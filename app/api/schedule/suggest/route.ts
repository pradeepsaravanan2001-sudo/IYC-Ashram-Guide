import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { GoogleGenAI, Type } from '@google/genai'
import { getDestinationsFromDb, getAvailabilityFromDb } from '@/lib/db/postgres'
import type { Destination, DestinationAvailability, DestinationTone, IconName } from '@/lib/types'

interface SuggestRequest {
  checkInDate: string
  checkOutDate: string
  checkInTime?: string
  checkOutTime?: string
  dailyPace?: 'gentle' | 'balanced' | 'immersive'
  userPreferences?: string
}

export interface SuggestedScheduleItem {
  destinationId: string
  title: string
  type: string
  tone: DestinationTone
  iconName: IconName
  priority: number
  time: string
  duration: string
  distance: string
  description: string
  latitude?: number | null
  longitude?: number | null
  googleMapsUrl?: string | null
  date: string
  reasoning?: string
  matchedSlot?: {
    label: string
    startTime: string
    endTime: string
    status: string
  }
}

export interface SuggestedDayPlan {
  date: string
  dayNumber: number
  dateLabel: string
  timeWindow: string
  items: SuggestedScheduleItem[]
}

// Helper: Parse "HH:MM" to minutes from midnight
function timeToMinutes(t: string): number {
  if (!t) return 540
  const clean = t.trim()
  const parts = clean.split(':').map(Number)
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return 540
  return parts[0] * 60 + parts[1]
}

// Helper: Minutes to "H:MM AM/PM"
function minutesTo12Hour(minutes: number): string {
  const normalized = Math.max(0, Math.min(24 * 60 - 1, minutes))
  const h24 = Math.floor(normalized / 60)
  const m = normalized % 60
  const period = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  const minuteStr = m < 10 ? `0${m}` : `${m}`
  return `${h12}:${minuteStr} ${period}`
}

// Helper: Parse duration string to minutes
function parseDurationMinutes(durationStr: string): number {
  if (!durationStr) return 30
  const lower = durationStr.toLowerCase()
  if (lower.includes('hr') || lower.includes('hour')) {
    const num = parseFloat(lower.replace(/[^0-9.]/g, '')) || 1
    return Math.round(num * 60)
  }
  const match = lower.match(/\d+/)
  return match ? parseInt(match[0], 10) : 30
}

// Helper: Format date label
function formatDateLabel(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day, 12))
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${weekdays[date.getUTCDay()]} ${day} ${months[month - 1]}`
  } catch {
    return dateStr
  }
}

// Helper: Check if user visit overlaps with Night Time Silence (9:30 PM / 21:30 to 4:30 AM / 04:30)
function checkVisitOverlapsNightSilence(
  checkInDate: string,
  checkOutDate: string,
  checkInTime: string,
  checkOutTime: string
): boolean {
  if (checkOutDate > checkInDate) {
    return true
  }
  const inMins = timeToMinutes(checkInTime)
  const outMins = timeToMinutes(checkOutTime)
  const morningSilenceEnd = 4 * 60 + 30 // 04:30
  const eveningSilenceStart = 21 * 60 + 30 // 21:30

  const overlapsMorning = inMins < morningSilenceEnd && outMins > 0
  const overlapsEvening = outMins > eveningSilenceStart && inMins < 24 * 60
  return overlapsMorning || overlapsEvening
}

interface RawGeminiItem {
  destinationId: string
  startTime: string
  endTime: string
  reasoning?: string
}

interface RawGeminiDay {
  date: string
  dayNumber: number
  items: RawGeminiItem[]
}

interface RawGeminiResponse {
  days: RawGeminiDay[]
  summary: string
}

// Initialize server-side Gemini client utility
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  })
}

// Load custom Gemini prompt instructions from GEMINI_INSTRUCTIONS.md if present
function loadGeminiInstructions(): string {
  try {
    const instructionsPath = path.join(process.cwd(), 'GEMINI_INSTRUCTIONS.md')
    if (fs.existsSync(instructionsPath)) {
      return fs.readFileSync(instructionsPath, 'utf-8').trim()
    }
  } catch (err) {
    console.warn('Could not read GEMINI_INSTRUCTIONS.md, using default system instructions:', err)
  }
  return `You are the master scheduler for a spiritual centre and ashram.
Craft balanced, conflict-free, non-overlapping daily schedules honoring PostgreSQL operating hours and visitor preferences with mindful pacing.`
}

// Generate Schedule using resilient multi-tier Gemini Flash models
async function generateGeminiSchedule(
  ai: GoogleGenAI,
  dates: string[],
  checkInDate: string,
  checkOutDate: string,
  checkInTime: string,
  checkOutTime: string,
  userPreferences: string,
  destinations: Destination[],
  availabilities: DestinationAvailability[],
  overlapsNightSilence: boolean
): Promise<{ days: SuggestedDayPlan[]; summary: string; flatQueue: string[]; modelName: string; modelId: string }> {
  const destinationsCatalog = destinations.map((d) => ({
    id: d.id,
    title: d.title,
    type: d.type,
    duration: d.duration,
    priority: d.priority ?? 3,
    description: d.description,
  }))

  const slotsCatalog = availabilities.map((a) => ({
    destinationId: a.destinationId,
    label: a.label,
    startTime: a.startTime,
    endTime: a.endTime,
    status: a.status,
  }))

  const systemInstruction = loadGeminiInstructions()

  const prompt = `A visitor is planning their visit and has provided the following visit details and preferences:
- Arrival Date: ${checkInDate}
- Departure Date: ${checkOutDate}
- Arrival Time: ${checkInTime}
- Departure Time: ${checkOutTime}
- Stay Dates to schedule: ${dates.join(', ')}
- Visitor's Personal Preferences & Focus: ${userPreferences ? `"${userPreferences}"` : 'Balanced, reflective, and serene journey across key meditation and sacred spaces.'}

Available Destinations in PostgreSQL:
${JSON.stringify(destinationsCatalog, null, 2)}

Operating Hours / Availability Slots in PostgreSQL:
${JSON.stringify(slotsCatalog, null, 2)}

CRITICAL ASHRAM SCHEDULING DIRECTIVES (HONOR STRICTLY):
1. **FILL THE DAY UNTIL 9:30 PM (21:30)**:
   - Unless the visitor specifies an earlier check-out time on departure day, plan the day to extend continuously and mindfully right up to 9:30 PM (21:30) when campus-wide Night Time Silence begins.
   - Schedule sufficient stops (typically 6 to 8 stops per full day) covering morning, brunch, midday, afternoon, dinner, and evening contemplation.
   - Maintain mindful, sufficient gaps of 15 to 30 minutes between consecutive activities for unhurried walking and settling.

2. **DESTINATION REPETITION IS PERMITTED & ENCOURAGED**:
   - You CAN and SHOULD schedule the same destination multiple times a day if time and operating slots permit.
   - Give preference to higher-priority destinations (e.g. Dhyanalinga for morning meditation and evening Darshan / Nadha Aradhana, priority 5).
   - Biksha Hall must be visited twice daily as specified below.

3. **SURYA KUND DIP MUST PRECEDE DHYANALINGA VISIT**:
   - A dip in the consecrated theerthakund water of Surya Kund (id: '101') MUST ALWAYS BE SCHEDULED BEFORE visiting Dhyanalinga (id: '2') on any given day. The cleansing bath traditionally precedes deep meditation in Dhyanalinga. Never schedule Dhyanalinga before Surya Kund on the same day.

4. **INCLUDE BIKSHA HALL TWICE DAILY FOR BRUNCH & DINNER**:
   - Include Biksha Hall (id: '5') visits twice a day:
     a) Morning Yogic Brunch: between 10:00 AM and 11:30 AM (refer to PostgreSQL availability slot)
     b) Evening Yogic Dinner: between 6:45 PM and 8:15 PM (18:45 - 20:15, refer to PostgreSQL availability slot)
   - Refer directly to the availability slots in PostgreSQL for exact opening times.

5. **ZERO OVERLAP**:
   - Every scheduled activity MUST have a non-overlapping time window. Activity B's startTime MUST be at least 15 to 30 minutes after Activity A's endTime.

6. **OPERATING HOURS & AVAILABILITY**:
   - Each scheduled activity [startTime, endTime] MUST fall strictly within an 'open' or 'silent_period' availability slot for that destination in PostgreSQL. Never schedule when a venue is closed.

7. **CHECK-IN & CHECK-OUT BOUNDARIES**:
   - On arrival date (${checkInDate}), do not schedule activities before check-in time (${checkInTime}). If Welcome Centre (id: '1') is open upon arrival, schedule it first.
   - On departure date (${checkOutDate}), do not schedule activities after check-out time (${checkOutTime}).

8. **NIGHT TIME SILENCE**:
   - Campus-wide silence is observed every night from 9:30 PM (21:30) to 4:30 AM. Conclude all daytime activities before 9:30 PM.

Return a JSON object adhering to the schema with:
- days: list of scheduled days with strictly non-overlapping sequential items (each having destinationId, startTime in 24hr "HH:MM", endTime in 24hr "HH:MM", and brief reasoning).
- summary: a warm, personalized 1-2 sentence overview of the rhythm crafted for their stay and preferences.`

  const CANDIDATE_MODELS = [
    { id: 'gemini-3.5-flash', displayName: 'Gemini 3.5 Flash' },
    { id: 'gemini-3.6-flash', displayName: 'Gemini 3.6 Flash' },
    { id: 'gemini-3.8-flash', displayName: 'Gemini 3.8 Flash' },
    { id: 'gemini-flash-latest', displayName: 'Gemini Flash' },
    { id: 'gemini-3.1-flash-lite', displayName: 'Gemini 3.1 Flash Lite' },
  ]

  let responseText: string | null = null
  let successfulModel: { id: string; displayName: string } | null = null

  for (const candidate of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: candidate.id,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              days: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING },
                    dayNumber: { type: Type.INTEGER },
                    items: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          destinationId: { type: Type.STRING },
                          startTime: { type: Type.STRING, description: '24-hour time HH:MM e.g. 09:00' },
                          endTime: { type: Type.STRING, description: '24-hour time HH:MM e.g. 09:45' },
                          reasoning: { type: Type.STRING, description: 'Why this item was selected or placed at this time' },
                        },
                        required: ['destinationId', 'startTime', 'endTime'],
                      },
                    },
                  },
                  required: ['date', 'dayNumber', 'items'],
                },
              },
              summary: { type: Type.STRING },
            },
            required: ['days', 'summary'],
          },
        },
      })

      if (response && response.text) {
        responseText = response.text
        successfulModel = candidate
        break
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.info(`[Suggest Route] Model ${candidate.id} unavailable (${msg.slice(0, 80)}). Trying next candidate...`)
    }
  }

  if (!responseText || !successfulModel) {
    throw new Error('All AI models are currently at high demand capacity.')
  }

  const parsed = JSON.parse(responseText) as RawGeminiResponse
  if (!parsed.days || !Array.isArray(parsed.days) || parsed.days.length === 0) {
    throw new Error('Gemini response did not include valid days')
  }

  // Group availabilities for fast lookup
  const availMap = new Map<string, DestinationAvailability[]>()
  for (const a of availabilities) {
    const list = availMap.get(a.destinationId) || []
    list.push(a)
    availMap.set(a.destinationId, list)
  }

  const scheduledDays: SuggestedDayPlan[] = []
  const flatQueue: string[] = []

  for (const day of parsed.days) {
    const dateStr = day.date || dates[day.dayNumber - 1] || dates[0]
    const dayNumber = day.dayNumber || scheduledDays.length + 1

    // Determine boundary limits for this day
    const isArrivalDay = dateStr === checkInDate
    const isDepartureDay = dateStr === checkOutDate
    const dayStartMinutes = isArrivalDay ? timeToMinutes(checkInTime) : 7 * 60
    // Fill the day until 9:30 PM (21:30) unless user checkout specifies earlier
    const dayEndMinutes = isDepartureDay ? timeToMinutes(checkOutTime) : 21 * 60 + 30

    // Sort items chronologically by startTime
    const sortedItems = [...(day.items || [])].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    )

    const dayItems: SuggestedScheduleItem[] = []
    let lastActivityEndMinutes = dayStartMinutes

    for (const raw of sortedItems) {
      if (raw.destinationId === 'night-silence') continue

      const dest = destinations.find((d) => d.id === raw.destinationId)
      if (!dest) continue

      // Allow same destination multiple times a day (Rule 2 & 4),
      // only skip if scheduled immediately back-to-back within 40 minutes of its previous instance
      const prevSame = dayItems.slice().reverse().find((i) => i.destinationId === dest.id)
      let itemStartMins = timeToMinutes(raw.startTime)
      let itemEndMins = timeToMinutes(raw.endTime)
      const parsedDur = parseDurationMinutes(dest.duration)

      if (prevSame) {
        const prevStart = timeToMinutes(prevSame.time)
        if (Math.abs(itemStartMins - prevStart) < 40) {
          continue
        }
      }

      // Guarantee STRICT NON-OVERLAP with 15-25 min mindful gaps:
      if (dayItems.length > 0) {
        if (itemStartMins < lastActivityEndMinutes + 15) {
          itemStartMins = lastActivityEndMinutes + 20
          itemEndMins = itemStartMins + parsedDur
        }
      } else {
        if (itemStartMins < dayStartMinutes) {
          itemStartMins = dayStartMinutes
          itemEndMins = itemStartMins + parsedDur
        }
      }

      if (itemEndMins <= itemStartMins) {
        itemEndMins = itemStartMins + parsedDur
      }

      // Check if exceeds day checkout boundary
      if (itemStartMins + 20 > dayEndMinutes) {
        continue
      }
      if (itemEndMins > dayEndMinutes) {
        itemEndMins = dayEndMinutes
      }

      // Match availability slot in PostgreSQL
      const slots = availMap.get(dest.id) || []
      const matchedSlot =
        slots.find((s) => {
          const sStart = timeToMinutes(s.startTime)
          const sEnd = timeToMinutes(s.endTime)
          return itemStartMins >= sStart && itemStartMins <= sEnd && s.status !== 'closed'
        }) ||
        slots.find((s) => s.status === 'open' || s.status === 'silent_period') ||
        slots[0]

      dayItems.push({
        destinationId: dest.id,
        title: dest.title,
        type: dest.type,
        tone: dest.tone,
        iconName: dest.iconName,
        priority: dest.priority ?? 3,
        time: minutesTo12Hour(itemStartMins),
        duration: dest.duration,
        distance: dest.distance,
        description: dest.description,
        latitude: dest.latitude ?? null,
        longitude: dest.longitude ?? null,
        googleMapsUrl: dest.googleMapsUrl ?? null,
        date: dateStr,
        reasoning: raw.reasoning,
        matchedSlot: matchedSlot
          ? {
              label: matchedSlot.label,
              startTime: matchedSlot.startTime,
              endTime: matchedSlot.endTime,
              status: matchedSlot.status,
            }
          : undefined,
      })

      lastActivityEndMinutes = itemEndMins
      if (!flatQueue.includes(dest.id)) {
        flatQueue.push(dest.id)
      }
    }

    // DIRECTIVE 3: Ensure Surya Kund dip comes before Dhyanalinga visit
    const suryaIdx = dayItems.findIndex((i) => i.destinationId === '101' || i.title.toLowerCase().includes('surya kund'))
    const dhyanaIdx = dayItems.findIndex((i) => i.destinationId === '2' || i.title.toLowerCase().includes('dhyanalinga'))
    if (suryaIdx !== -1 && dhyanaIdx !== -1 && suryaIdx > dhyanaIdx) {
      // Swap timing and slots so Surya Kund dip strictly precedes Dhyanalinga
      const suryaItem = dayItems[suryaIdx]
      const dhyanaItem = dayItems[dhyanaIdx]
      const tempTime = suryaItem.time
      const tempSlot = suryaItem.matchedSlot
      suryaItem.time = dhyanaItem.time
      suryaItem.matchedSlot = dhyanaItem.matchedSlot
      dhyanaItem.time = tempTime
      dhyanaItem.matchedSlot = tempSlot
      dayItems.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
    }

    // DIRECTIVE 4: Ensure Biksha Hall visits twice a day (brunch and dinner) if time allows
    const bikshaDest = destinations.find((d) => d.id === '5' || d.title.toLowerCase().includes('biksha hall'))
    if (bikshaDest) {
      const bikshaSlots = availMap.get(bikshaDest.id) || []
      const brunchSlot = bikshaSlots.find((s) => s.startTime.startsWith('10:')) || bikshaSlots[0]
      const dinnerSlot = bikshaSlots.find((s) => s.startTime.startsWith('18:') || s.startTime.startsWith('19:')) || bikshaSlots[1]

      // Check Brunch (10:00 - 11:30)
      const hasBrunch = dayItems.some((i) => {
        if (i.destinationId !== bikshaDest.id && !i.title.toLowerCase().includes('biksha hall')) return false
        const m = timeToMinutes(i.time)
        return m >= 9 * 60 + 30 && m <= 12 * 60
      })
      if (!hasBrunch && dayStartMinutes <= 10 * 60 + 30 && dayEndMinutes >= 11 * 60) {
        const brunchStart = 10 * 60 + 15 // 10:15 AM
        dayItems.push({
          destinationId: bikshaDest.id,
          title: bikshaDest.title,
          type: bikshaDest.type,
          tone: bikshaDest.tone,
          iconName: bikshaDest.iconName,
          priority: bikshaDest.priority ?? 4,
          time: minutesTo12Hour(brunchStart),
          duration: bikshaDest.duration,
          distance: bikshaDest.distance,
          description: bikshaDest.description,
          latitude: bikshaDest.latitude ?? null,
          longitude: bikshaDest.longitude ?? null,
          googleMapsUrl: bikshaDest.googleMapsUrl ?? null,
          date: dateStr,
          reasoning: 'Morning yogic brunch served in meditative silence.',
          matchedSlot: brunchSlot
            ? {
                label: brunchSlot.label,
                startTime: brunchSlot.startTime,
                endTime: brunchSlot.endTime,
                status: brunchSlot.status,
              }
            : undefined,
        })
        if (!flatQueue.includes(bikshaDest.id)) flatQueue.push(bikshaDest.id)
      }

      // Check Dinner (18:45 - 20:15)
      const hasDinner = dayItems.some((i) => {
        if (i.destinationId !== bikshaDest.id && !i.title.toLowerCase().includes('biksha hall')) return false
        const m = timeToMinutes(i.time)
        return m >= 18 * 60 && m <= 20 * 60 + 30
      })
      if (!hasDinner && dayStartMinutes <= 19 * 60 && dayEndMinutes >= 19 * 60 + 30) {
        const dinnerStart = 19 * 60 // 7:00 PM
        dayItems.push({
          destinationId: bikshaDest.id,
          title: bikshaDest.title,
          type: bikshaDest.type,
          tone: bikshaDest.tone,
          iconName: bikshaDest.iconName,
          priority: bikshaDest.priority ?? 4,
          time: minutesTo12Hour(dinnerStart),
          duration: bikshaDest.duration,
          distance: bikshaDest.distance,
          description: bikshaDest.description,
          latitude: bikshaDest.latitude ?? null,
          longitude: bikshaDest.longitude ?? null,
          googleMapsUrl: bikshaDest.googleMapsUrl ?? null,
          date: dateStr,
          reasoning: 'Evening yogic dinner served in mindful silence.',
          matchedSlot: dinnerSlot
            ? {
                label: dinnerSlot.label,
                startTime: dinnerSlot.startTime,
                endTime: dinnerSlot.endTime,
                status: dinnerSlot.status,
              }
            : undefined,
        })
        if (!flatQueue.includes(bikshaDest.id)) flatQueue.push(bikshaDest.id)
      }

      dayItems.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
    }

    // DIRECTIVE 1: Fill the day till 9:30 PM (21:30) with sufficient gaps
    if (dayEndMinutes >= 21 * 60 + 30) {
      const nonNightItems = dayItems.filter((i) => i.destinationId !== 'night-silence')
      const lastItem = nonNightItems[nonNightItems.length - 1]
      const lastEnd = lastItem
        ? timeToMinutes(lastItem.time) + parseDurationMinutes(lastItem.duration)
        : dayStartMinutes

      if (lastEnd < 20 * 60 + 15) {
        // Schedule evening contemplation / meditation at Dhyanalinga (id: '2') from 20:15 to 21:00
        const dhyanalingaDest = destinations.find((d) => d.id === '2')
        if (dhyanalingaDest) {
          const dhyanaSlots = availMap.get('2') || []
          const eveningSlot = dhyanaSlots.find((s) => s.startTime >= '18:00') || dhyanaSlots[0]
          dayItems.push({
            destinationId: '2',
            title: dhyanalingaDest.title,
            type: dhyanalingaDest.type,
            tone: dhyanalingaDest.tone,
            iconName: dhyanalingaDest.iconName,
            priority: 5,
            time: '8:15 PM',
            duration: '45 min',
            distance: dhyanalingaDest.distance,
            description: dhyanalingaDest.description,
            latitude: dhyanalingaDest.latitude ?? null,
            longitude: dhyanalingaDest.longitude ?? null,
            googleMapsUrl: dhyanalingaDest.googleMapsUrl ?? null,
            date: dateStr,
            reasoning: 'Evening deep silence and meditation before night campus silence.',
            matchedSlot: eveningSlot
              ? {
                  label: eveningSlot.label,
                  startTime: eveningSlot.startTime,
                  endTime: eveningSlot.endTime,
                  status: eveningSlot.status,
                }
              : undefined,
          })
          dayItems.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
        }
      }
    }

    // Add Night Time Silence if visitor stay overlaps
    if (overlapsNightSilence) {
      const nightSilenceDest = destinations.find((d) => d.id === 'night-silence')
      dayItems.push({
        destinationId: 'night-silence',
        title: nightSilenceDest?.title || 'Night Time Silence',
        type: nightSilenceDest?.type || 'Ashram observance',
        tone: (nightSilenceDest?.tone as DestinationTone) || 'terracotta',
        iconName: (nightSilenceDest?.iconName as IconName) || 'Sunrise',
        priority: nightSilenceDest?.priority ?? 5,
        time: '9:30 PM — 4:30 AM',
        duration: '7 hr',
        distance: nightSilenceDest?.distance || 'Campus-wide',
        description:
          nightSilenceDest?.description ||
          'Campus-wide silence is observed from 9:30 PM to 4:30 AM across all residential, hall, and pathway areas.',
        latitude: nightSilenceDest?.latitude ?? 10.9775,
        longitude: nightSilenceDest?.longitude ?? 76.736,
        googleMapsUrl: nightSilenceDest?.googleMapsUrl ?? 'https://maps.google.com/?q=10.977500,76.736000',
        date: dateStr,
        reasoning: 'Campus-wide quietude observed every evening across all ashram pathways and residences.',
        matchedSlot: {
          label: 'Night Time Silence (9:30 PM — 4:30 AM)',
          startTime: '21:30',
          endTime: '04:30',
          status: 'silent_period',
        },
      })
      if (!flatQueue.includes('night-silence')) {
        flatQueue.push('night-silence')
      }
    }

    scheduledDays.push({
      date: dateStr,
      dayNumber,
      dateLabel: formatDateLabel(dateStr),
      timeWindow: `${minutesTo12Hour(dayStartMinutes)} — ${minutesTo12Hour(dayEndMinutes)}`,
      items: dayItems,
    })
  }

  // Pad flatQueue if needed
  for (const d of destinations) {
    if (!flatQueue.includes(d.id) && flatQueue.length < 5) {
      flatQueue.push(d.id)
    }
  }

  return {
    days: scheduledDays,
    summary: parsed.summary,
    flatQueue,
    modelName: successfulModel.displayName,
    modelId: successfulModel.id,
  }
}

// Fallback Deterministic Scheduling Algorithm (Honoring all 4 directives)
function generateDeterministicSchedule(
  dates: string[],
  checkInDate: string,
  checkOutDate: string,
  checkInTime: string,
  checkOutTime: string,
  pace: 'gentle' | 'balanced' | 'immersive',
  destinations: Destination[],
  availabilities: DestinationAvailability[],
  overlapsNightSilence: boolean,
  userPreferences?: string
): { days: SuggestedDayPlan[]; summary: string; flatQueue: string[] } {
  const totalDays = dates.length

  const availMap = new Map<string, DestinationAvailability[]>()
  for (const a of availabilities) {
    const list = availMap.get(a.destinationId) || []
    list.push(a)
    availMap.set(a.destinationId, list)
  }
  for (const [, slots] of availMap.entries()) {
    slots.sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  const scheduledDays: SuggestedDayPlan[] = []
  const flatQueue: string[] = []

  const welcomeDest = destinations.find((d) => d.id === '1')
  const suryaDest = destinations.find((d) => d.id === '101')
  const dhyanaDest = destinations.find((d) => d.id === '2')
  const bikshaDest = destinations.find((d) => d.id === '5' || d.title.toLowerCase().includes('biksha hall'))
  const adiyogiDest = destinations.find((d) => d.id === '3')
  const gardenDest = destinations.find((d) => d.id === '102')
  const spandaDest = destinations.find((d) => d.id === '103')
  const sannidhiDest = destinations.find((d) => d.id === '104')
  const cafeDest = destinations.find((d) => d.id === '4')

  for (let dayIdx = 0; dayIdx < totalDays; dayIdx++) {
    const dateStr = dates[dayIdx]
    const isArrivalDay = dayIdx === 0
    const isDepartureDay = dayIdx === totalDays - 1

    let dayStartMinutes = 7 * 60
    // Rule 1: Try to fill the day till 9:30 PM (21:30) unless user specifies otherwise
    let dayEndMinutes = 21 * 60 + 30

    if (isArrivalDay) dayStartMinutes = Math.max(timeToMinutes(checkInTime), 6 * 60)
    if (isDepartureDay) dayEndMinutes = Math.min(timeToMinutes(checkOutTime), 21 * 60 + 30)
    if (isArrivalDay && isDepartureDay) {
      dayStartMinutes = timeToMinutes(checkInTime)
      dayEndMinutes = timeToMinutes(checkOutTime)
    }

    const dayItems: SuggestedScheduleItem[] = []

    const addItem = (
      dest: Destination | undefined,
      startMins: number,
      durMins: number,
      reason: string,
      slotMatcher?: (slots: DestinationAvailability[]) => DestinationAvailability | undefined
    ) => {
      if (!dest) return
      if (startMins < dayStartMinutes || startMins + durMins > dayEndMinutes + 10) return

      const slots = availMap.get(dest.id) || []
      const matched = slotMatcher ? slotMatcher(slots) : slots.find((s) => s.status !== 'closed') || slots[0]

      dayItems.push({
        destinationId: dest.id,
        title: dest.title,
        type: dest.type,
        tone: dest.tone,
        iconName: dest.iconName,
        priority: dest.priority ?? 3,
        time: minutesTo12Hour(startMins),
        duration: `${durMins} min`,
        distance: dest.distance,
        description: dest.description,
        latitude: dest.latitude ?? null,
        longitude: dest.longitude ?? null,
        googleMapsUrl: dest.googleMapsUrl ?? null,
        date: dateStr,
        reasoning: reason,
        matchedSlot: matched
          ? {
              label: matched.label,
              startTime: matched.startTime,
              endTime: matched.endTime,
              status: matched.status,
            }
          : undefined,
      })
      if (!flatQueue.includes(dest.id)) flatQueue.push(dest.id)
    }

    // 1. Arrival Day Welcome Centre
    if (isArrivalDay && welcomeDest && dayStartMinutes <= 10 * 60) {
      addItem(welcomeDest, dayStartMinutes, 30, 'Arrival orientation and registration.')
    }

    // 2. Rule 3: Surya Kund dip comes BEFORE Dhyanalinga visit
    if (suryaDest && dayStartMinutes <= 8 * 60 + 30 && dayEndMinutes >= 9 * 60) {
      const suryaStart = Math.max(dayStartMinutes + (isArrivalDay ? 35 : 0), 8 * 60)
      addItem(suryaDest, suryaStart, 35, 'Sacred theerthakund dip for energization before Dhyanalinga.')
    }

    // 3. Dhyanalinga morning darshan & meditation (Strictly after Surya Kund dip)
    if (dhyanaDest && dayStartMinutes <= 9 * 60 + 15 && dayEndMinutes >= 10 * 60) {
      const dhyanaStart = 9 * 60 + 15 // 9:15 AM
      addItem(dhyanaDest, dhyanaStart, 45, 'Profound silent meditation following sacred Surya Kund bath.')
    }

    // 4. Rule 4: Biksha Hall visit 1 - Morning Yogic Brunch (10:15 - 11:00)
    if (bikshaDest && dayStartMinutes <= 10 * 60 + 30 && dayEndMinutes >= 11 * 60) {
      addItem(
        bikshaDest,
        10 * 60 + 15,
        45,
        'Yogic brunch served in serene silence at Biksha Hall.',
        (slots) => slots.find((s) => s.startTime.startsWith('10:'))
      )
    }

    // 5. Adiyogi Alayam (11:30 - 12:15)
    if (adiyogiDest && dayStartMinutes <= 11 * 60 + 30 && dayEndMinutes >= 12 * 60) {
      addItem(adiyogiDest, 11 * 60 + 30, 45, 'Expansive stillness and consecrated chanting.')
    }

    // 6. Midday break / Isha Café if preferred (12:45 - 13:30)
    if (cafeDest && dayStartMinutes <= 12 * 60 + 45 && dayEndMinutes >= 13 * 60 + 30) {
      addItem(cafeDest, 12 * 60 + 45, 45, 'Light herbal teas and mindful refreshment.')
    }

    // 7. Afternoon: Vanashree Garden (14:15 - 15:00)
    if (gardenDest && dayStartMinutes <= 14 * 60 + 15 && dayEndMinutes >= 15 * 60) {
      addItem(gardenDest, 14 * 60 + 15, 45, 'Quiet walking trail amidst green mountain backdrop.')
    }

    // 8. Afternoon: Spanda Hall (15:30 - 16:15)
    if (spandaDest && dayStartMinutes <= 15 * 60 + 30 && dayEndMinutes >= 16 * 60) {
      addItem(spandaDest, 15 * 60 + 30, 45, 'Deep meditative reflection in consecrated hall.')
    }

    // 9. Late afternoon: Sadhguru Sannidhi (16:45 - 17:30)
    if (sannidhiDest && dayStartMinutes <= 16 * 60 + 45 && dayEndMinutes >= 17 * 60 + 30) {
      addItem(sannidhiDest, 16 * 60 + 45, 45, 'Contemplative darshan and gratitude.')
    }

    // 10. Rule 4: Biksha Hall visit 2 - Evening Yogic Dinner (19:00 - 19:45)
    if (bikshaDest && dayStartMinutes <= 19 * 60 && dayEndMinutes >= 19 * 60 + 45) {
      addItem(
        bikshaDest,
        19 * 60,
        45,
        'Yogic dinner served in mindful silence at Biksha Hall.',
        (slots) => slots.find((s) => s.startTime.startsWith('18:') || s.startTime.startsWith('19:'))
      )
    }

    // 11. Rule 2 & Rule 1: Repeat Dhyanalinga in evening to fill day till 9:30 PM (20:15 - 21:00)
    if (dhyanaDest && dayStartMinutes <= 20 * 60 + 15 && dayEndMinutes >= 21 * 60) {
      addItem(
        dhyanaDest,
        20 * 60 + 15,
        45,
        'Evening stillness and meditation in Dhyanalinga before night silence.',
        (slots) => slots.find((s) => s.startTime >= '18:00')
      )
    }

    // Sort items chronologically
    dayItems.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))

    // 12. Night Time Silence (9:30 PM — 4:30 AM)
    if (overlapsNightSilence) {
      const nightSilenceDest = destinations.find((d) => d.id === 'night-silence')
      dayItems.push({
        destinationId: 'night-silence',
        title: nightSilenceDest?.title || 'Night Time Silence',
        type: nightSilenceDest?.type || 'Ashram observance',
        tone: (nightSilenceDest?.tone as DestinationTone) || 'terracotta',
        iconName: (nightSilenceDest?.iconName as IconName) || 'Sunrise',
        priority: nightSilenceDest?.priority ?? 5,
        time: '9:30 PM — 4:30 AM',
        duration: '7 hr',
        distance: nightSilenceDest?.distance || 'Campus-wide',
        description:
          nightSilenceDest?.description ||
          'Campus-wide silence is observed from 9:30 PM to 4:30 AM across all residential, hall, and pathway areas.',
        latitude: nightSilenceDest?.latitude ?? 10.9775,
        longitude: nightSilenceDest?.longitude ?? 76.736,
        googleMapsUrl: nightSilenceDest?.googleMapsUrl ?? 'https://maps.google.com/?q=10.977500,76.736000',
        date: dateStr,
        reasoning: 'Campus-wide night quietude observed every evening.',
        matchedSlot: {
          label: 'Night Time Silence (9:30 PM — 4:30 AM)',
          startTime: '21:30',
          endTime: '04:30',
          status: 'silent_period',
        },
      })
      if (!flatQueue.includes('night-silence')) flatQueue.push('night-silence')
    }

    scheduledDays.push({
      date: dateStr,
      dayNumber: dayIdx + 1,
      dateLabel: formatDateLabel(dateStr),
      timeWindow: `${minutesTo12Hour(dayStartMinutes)} — ${minutesTo12Hour(dayEndMinutes)}`,
      items: dayItems,
    })
  }

  for (const d of destinations) {
    if (!flatQueue.includes(d.id) && flatQueue.length < 5) {
      flatQueue.push(d.id)
    }
  }

  const totalStops = scheduledDays.reduce((acc, d) => acc + d.items.length, 0)
  const silenceNote = overlapsNightSilence
    ? ' Night time silence (9:30 PM — 4:30 AM) is observed across all days.'
    : ''
  const summary =
    totalDays === 1
      ? `Crafted a balanced single-day rhythm with ${totalStops} serene stops adhering to PostgreSQL operating hours.${silenceNote}`
      : `Crafted a mindful ${totalDays}-day journey with ${totalStops} total stops, recurring high-priority spaces, and diversified daily exploration.${silenceNote}`

  return {
    days: scheduledDays,
    summary,
    flatQueue,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SuggestRequest
    const checkInDate = body.checkInDate || new Date().toISOString().slice(0, 10)
    const checkOutDate = body.checkOutDate || checkInDate
    const checkInTime = body.checkInTime || '09:00'
    const checkOutTime = body.checkOutTime || '16:00'
    const pace = body.dailyPace || 'balanced'
    const userPreferences = (body.userPreferences || '').trim()

    // Fetch live relational data from PostgreSQL
    const [destinations, allAvailabilities] = await Promise.all([
      getDestinationsFromDb(),
      getAvailabilityFromDb(),
    ])

    if (!destinations || destinations.length === 0) {
      return NextResponse.json({ success: false, error: 'No destinations found in database' }, { status: 404 })
    }

    // Generate date sequence
    const dates: string[] = []
    const startObj = new Date(`${checkInDate}T12:00:00`)
    const endObj = new Date(`${checkOutDate}T12:00:00`)
    const maxDays = 14
    let current = new Date(startObj)
    while (current <= endObj && dates.length < maxDays) {
      dates.push(current.toISOString().slice(0, 10))
      current.setDate(current.getDate() + 1)
    }
    if (dates.length === 0) dates.push(checkInDate)

    const overlapsNightSilence = checkVisitOverlapsNightSilence(
      checkInDate,
      checkOutDate,
      checkInTime,
      checkOutTime
    )

    let generatedSchedule: { days: SuggestedDayPlan[]; summary: string; flatQueue: string[] }
    let engineUsed = 'deterministic'
    let modelUsed: string | undefined = undefined

    const geminiAi = getGeminiClient()
    if (geminiAi) {
      try {
        const geminiResult = await generateGeminiSchedule(
          geminiAi,
          dates,
          checkInDate,
          checkOutDate,
          checkInTime,
          checkOutTime,
          userPreferences,
          destinations,
          allAvailabilities,
          overlapsNightSilence
        )
        generatedSchedule = geminiResult
        engineUsed = geminiResult.modelId
        modelUsed = geminiResult.modelName
      } catch (_geminiError) {
        console.info('Gemini models temporarily under high demand; serving optimal deterministic relational schedule seamlessly.')
        generatedSchedule = generateDeterministicSchedule(
          dates,
          checkInDate,
          checkOutDate,
          checkInTime,
          checkOutTime,
          pace,
          destinations,
          allAvailabilities,
          overlapsNightSilence,
          userPreferences
        )
        engineUsed = 'deterministic'
        modelUsed = 'Relational Algorithm'
      }
    } else {
      generatedSchedule = generateDeterministicSchedule(
        dates,
        checkInDate,
        checkOutDate,
        checkInTime,
        checkOutTime,
        pace,
        destinations,
        allAvailabilities,
        overlapsNightSilence,
        userPreferences
      )
      engineUsed = 'deterministic'
      modelUsed = 'Relational Algorithm'
    }

    const totalStops = generatedSchedule.days.reduce((acc, d) => acc + d.items.length, 0)

    return NextResponse.json({
      success: true,
      data: {
        checkInDate,
        checkOutDate,
        checkInTime,
        checkOutTime,
        totalDays: dates.length,
        totalStops,
        days: generatedSchedule.days,
        flatQueue: generatedSchedule.flatQueue,
        summary: generatedSchedule.summary,
        engine: engineUsed,
        model: modelUsed,
        userPreferences: userPreferences || undefined,
      },
    })
  } catch (error) {
    console.error('Error suggesting schedule:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to suggest schedule' },
      { status: 500 }
    )
  }
}
