import type { Destination, DestinationAvailability } from './types'

export const initialDestinationsData: Destination[] = [
  {
    id: '1',
    title: 'Welcome Centre',
    type: 'Arrival & orientation',
    time: '9:00 AM',
    duration: '30 min',
    distance: 'You are here',
    description: 'Collect your visitor pass, settle in, and get a gentle introduction to the centre.',
    tone: 'sage',
    iconName: 'Compass',
    priority: 3,
    latitude: 10.97654,
    longitude: 76.73715,
    googleMapsUrl: 'https://maps.google.com/?q=10.976540,76.737150',
    order: 1,
    isInRoute: true,
  },
  {
    id: '2',
    title: 'Dhyanalinga',
    type: 'Meditation space',
    time: '9:45 AM',
    duration: '45 min',
    distance: '8 min walk',
    description: 'A powerful space for meditation and inner wellbeing. Silence is observed inside.',
    tone: 'terracotta',
    iconName: 'Sunrise',
    priority: 5,
    latitude: 10.978079,
    longitude: 76.735264,
    googleMapsUrl: 'https://maps.google.com/?q=10.978079,76.735264',
    order: 2,
    isInRoute: true,
  },
  {
    id: '3',
    title: 'Adiyogi Alayam',
    type: 'Sacred space',
    time: '11:00 AM',
    duration: '45 min',
    distance: '5 min walk',
    description: 'Experience the stillness of this expansive meditation hall and its quiet surroundings.',
    tone: 'gold',
    iconName: 'Sparkles',
    priority: 4,
    latitude: 10.978598,
    longitude: 76.737581,
    googleMapsUrl: 'https://maps.google.com/?q=10.978598,76.737581',
    order: 3,
    isInRoute: true,
  },
  {
    id: '4',
    title: 'Isha Café',
    type: 'Vegetarian lunch',
    time: '12:15 PM',
    duration: '1 hr',
    distance: '4 min walk',
    description: 'Take a nourishing break with fresh, vegetarian food made for mindful eating.',
    tone: 'clay',
    iconName: 'Utensils',
    priority: 4,
    latitude: 10.97682,
    longitude: 76.73634,
    googleMapsUrl: 'https://maps.google.com/?q=10.976820,76.736340',
    order: 4,
    isInRoute: true,
  },
  {
    id: '5',
    title: 'Biksha Hall',
    type: 'Ashram dining',
    time: '10:00 AM',
    duration: '45 min',
    distance: '6 min walk',
    description: 'Traditional ashram dining hall serving nourishing yogic vegetarian brunch and dinner in mindful silence.',
    tone: 'clay',
    iconName: 'Utensils',
    priority: 4,
    latitude: 10.97715,
    longitude: 76.7368,
    googleMapsUrl: 'https://maps.google.com/?q=10.977150,76.736800',
    order: 5,
    isInRoute: true,
  },
  {
    id: '101',
    title: 'Surya Kund',
    type: 'Water body',
    time: '1:30 PM',
    duration: '30 min',
    distance: '7 min walk',
    description: 'A quiet place to pause beside the water and take in the open sky before your afternoon walk.',
    tone: 'gold',
    iconName: 'Sunrise',
    priority: 3,
    latitude: 10.97743,
    longitude: 76.73582,
    googleMapsUrl: 'https://maps.google.com/?q=10.977430,76.735820',
    order: 5,
    isInRoute: false,
  },
  {
    id: '102',
    title: 'Vanashree Garden',
    type: 'Garden & nature',
    time: '2:15 PM',
    duration: '45 min',
    distance: '10 min walk',
    description: 'A leafy walking trail for a slower contemplative moment between centres and pavilions.',
    tone: 'sage',
    iconName: 'Sparkles',
    priority: 2,
    latitude: 10.97778,
    longitude: 76.73452,
    googleMapsUrl: 'https://maps.google.com/?q=10.977780,76.734520',
    order: 6,
    isInRoute: false,
  },
  {
    id: '103',
    title: 'Spanda Hall',
    type: 'Meditation space',
    time: '3:15 PM',
    duration: '40 min',
    distance: '6 min walk',
    description: 'A spacious, serene hall configured for deep inner stillness and reflective quietude.',
    tone: 'terracotta',
    iconName: 'Compass',
    priority: 3,
    latitude: 10.97921,
    longitude: 76.73605,
    googleMapsUrl: 'https://maps.google.com/?q=10.979210,76.736050',
    order: 7,
    isInRoute: false,
  },
  {
    id: '104',
    title: 'Sadhguru Sannidhi',
    type: 'Sacred space',
    time: '4:15 PM',
    duration: '30 min',
    distance: '12 min walk',
    description: 'A contemplative space to sit, listen, and reconnect with clarity and intention.',
    tone: 'clay',
    iconName: 'MapPin',
    priority: 3,
    latitude: 10.972416,
    longitude: 76.740602,
    googleMapsUrl: 'https://maps.google.com/?q=10.972416,76.740602',
    order: 8,
    isInRoute: false,
  },
  {
    id: 'night-silence',
    title: 'Night Time Silence',
    type: 'Ashram observance',
    time: '9:30 PM — 4:30 AM',
    duration: '7 hr',
    distance: 'Campus-wide',
    description: 'Campus-wide silence is observed from 9:30 PM to 4:30 AM across all residential, hall, and pathway areas.',
    tone: 'terracotta',
    iconName: 'Sunrise',
    priority: 5,
    latitude: 10.9775,
    longitude: 76.736,
    googleMapsUrl: 'https://maps.google.com/?q=10.977500,76.736000',
    order: 9,
    isInRoute: true,
  },
]

export const initialAvailabilityData: DestinationAvailability[] = [
  {
    id: 'avail-1-1',
    destinationId: '1',
    startTime: '07:00',
    endTime: '13:00',
    label: 'Morning Registration & Visitor Badges',
    status: 'open',
    recurrence: 'daily',
  },
  {
    id: 'avail-1-2',
    destinationId: '1',
    startTime: '14:00',
    endTime: '19:30',
    label: 'Afternoon Check-In & Assistance',
    status: 'open',
    recurrence: 'daily',
  },
  {
    id: 'avail-2-1',
    destinationId: '2',
    startTime: '06:00',
    endTime: '08:30',
    label: 'Morning Silent Meditation',
    status: 'silent_period',
    recurrence: 'daily',
  },
  {
    id: 'avail-2-2',
    destinationId: '2',
    startTime: '08:30',
    endTime: '11:45',
    label: 'General Darshan & Sitting',
    status: 'open',
    recurrence: 'daily',
  },
  {
    id: 'avail-2-3',
    destinationId: '2',
    startTime: '11:45',
    endTime: '12:15',
    label: 'Nadha Aradhana (Sound Offering)',
    status: 'exclusive_program',
    recurrence: 'daily',
  },
  {
    id: 'avail-2-4',
    destinationId: '2',
    startTime: '12:30',
    endTime: '17:45',
    label: 'Afternoon Silent Meditation',
    status: 'open',
    recurrence: 'daily',
  },
  {
    id: 'avail-2-5',
    destinationId: '2',
    startTime: '17:45',
    endTime: '18:15',
    label: 'Evening Nadha Aradhana (Sound Offering)',
    status: 'exclusive_program',
    recurrence: 'daily',
  },
  {
    id: 'avail-2-6',
    destinationId: '2',
    startTime: '18:30',
    endTime: '20:00',
    label: 'Evening Meditation',
    status: 'silent_period',
    recurrence: 'daily',
  },
  {
    id: 'avail-3-1',
    destinationId: '3',
    startTime: '07:00',
    endTime: '12:00',
    label: 'Morning Chanting & Meditation Session',
    status: 'open',
    recurrence: 'daily',
  },
  {
    id: 'avail-3-2',
    destinationId: '3',
    startTime: '16:00',
    endTime: '19:30',
    label: 'Evening Stillness & Inner Exploration',
    status: 'open',
    recurrence: 'daily',
  },
  {
    id: 'avail-4-1',
    destinationId: '4',
    startTime: '07:30',
    endTime: '10:30',
    label: 'Wholesome Breakfast & Herbal Teas',
    status: 'open',
    recurrence: 'daily',
  },
  {
    id: 'avail-4-2',
    destinationId: '4',
    startTime: '12:00',
    endTime: '15:30',
    label: 'Mindful Vegetarian Lunch Service',
    status: 'open',
    recurrence: 'daily',
  },
  {
    id: 'avail-4-3',
    destinationId: '4',
    startTime: '17:00',
    endTime: '20:00',
    label: 'Evening Light Refreshments & Dinner',
    status: 'open',
    recurrence: 'daily',
  },
  {
    id: 'avail-5-1',
    destinationId: '5',
    startTime: '10:00',
    endTime: '11:30',
    label: 'Morning Yogic Brunch (in silence)',
    status: 'open',
    recurrence: 'daily',
  },
  {
    id: 'avail-5-2',
    destinationId: '5',
    startTime: '18:45',
    endTime: '20:15',
    label: 'Evening Yogic Dinner (in silence)',
    status: 'open',
    recurrence: 'daily',
  },
  {
    id: 'avail-101-1',
    destinationId: '101',
    startTime: '06:30',
    endTime: '11:30',
    label: 'Morning Theerthakund Dip',
    status: 'open',
    recurrence: 'daily',
  },
  {
    id: 'avail-101-2',
    destinationId: '101',
    startTime: '15:30',
    endTime: '19:30',
    label: 'Evening Theerthakund Dip',
    status: 'open',
    recurrence: 'daily',
  },
  {
    id: 'avail-102-1',
    destinationId: '102',
    startTime: '06:00',
    endTime: '18:30',
    label: 'Daylight Walking Trail',
    status: 'open',
    recurrence: 'daily',
  },
  {
    id: 'avail-103-1',
    destinationId: '103',
    startTime: '08:00',
    endTime: '11:00',
    label: 'Morning Hall Access',
    status: 'open',
    recurrence: 'daily',
  },
  {
    id: 'avail-103-2',
    destinationId: '103',
    startTime: '15:00',
    endTime: '18:00',
    label: 'Afternoon Reflection',
    status: 'open',
    recurrence: 'daily',
  },
  {
    id: 'avail-104-1',
    destinationId: '104',
    startTime: '06:00',
    endTime: '12:30',
    label: 'Morning Contemplation',
    status: 'open',
    recurrence: 'daily',
  },
  {
    id: 'avail-104-2',
    destinationId: '104',
    startTime: '16:00',
    endTime: '20:00',
    label: 'Evening Contemplation',
    status: 'open',
    recurrence: 'daily',
  },
]

export async function fetchDestinations(): Promise<Destination[]> {
  try {
    const res = await fetch('/api/destinations', { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    const json = await res.json()
    if (json.success && Array.isArray(json.data)) {
      return json.data
    }
    return initialDestinationsData
  } catch (err) {
    console.warn('Failed to fetch destinations from PostgreSQL API, using fallback:', err)
    return initialDestinationsData
  }
}

export async function fetchAvailability(destinationId?: string): Promise<DestinationAvailability[]> {
  try {
    const url = destinationId ? `/api/availability?destinationId=${encodeURIComponent(destinationId)}` : '/api/availability'
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    const json = await res.json()
    if (json.success && Array.isArray(json.data)) {
      return json.data
    }
    return initialAvailabilityData
  } catch (err) {
    console.warn('Failed to fetch availability from PostgreSQL API, using fallback:', err)
    return initialAvailabilityData
  }
}

export async function saveDestinationDoc(dest: Destination): Promise<void> {
  const res = await fetch('/api/destinations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dest),
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.error || `Failed to save destination (${res.status})`)
  }
}

export async function deleteDestinationDoc(id: string): Promise<void> {
  const res = await fetch(`/api/destinations?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.error || `Failed to delete destination (${res.status})`)
  }
}

export async function syncDestinationAvailabilitySlots(
  destinationId: string,
  slots: DestinationAvailability[]
): Promise<void> {
  const res = await fetch('/api/availability', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ destinationId, slots }),
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.error || `Failed to sync availability slots (${res.status})`)
  }
}

export async function saveAvailabilitySlotDoc(slot: DestinationAvailability): Promise<void> {
  const res = await fetch('/api/availability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(slot),
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.error || `Failed to save availability slot (${res.status})`)
  }
}

export async function deleteAvailabilitySlotDoc(id: string): Promise<void> {
  const res = await fetch(`/api/availability?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.error || `Failed to delete availability slot (${res.status})`)
  }
}

export async function executePostgresQuery(query: string): Promise<{
  rows: Record<string, unknown>[]
  rowCount: number
  fields: { name: string; dataTypeID: number }[]
  executionTimeMs: number
}> {
  const res = await fetch('/api/sql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  const json = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.error || `SQL execution error (${res.status})`)
  }
  return json.data
}

export async function fetchPostgresStats(): Promise<{
  stats: {
    engine: string
    destinationsCount: number
    availabilitiesCount: number
    tables: string[]
    status: string
    storagePath: string
  }
  columns: {
    table_name: string
    column_name: string
    data_type: string
    is_nullable: string
    column_default: string | null
  }[]
}> {
  const res = await fetch('/api/sql', { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP error ${res.status}`)
  return res.json()
}

export async function reseedDatabase(): Promise<void> {
  const res = await fetch('/api/seed', { method: 'POST' })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.error || 'Seed failed')
  }
}

export interface SuggestedScheduleItem {
  destinationId: string
  title: string
  type: string
  tone: string
  iconName: string
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

export interface SuggestedScheduleResult {
  checkInDate: string
  checkOutDate: string
  checkInTime: string
  checkOutTime: string
  totalDays: number
  totalStops: number
  days: SuggestedDayPlan[]
  flatQueue: string[]
  summary: string
  engine?: string
  model?: string
  userPreferences?: string
}

export async function suggestSchedule(params: {
  checkInDate: string
  checkOutDate: string
  checkInTime?: string
  checkOutTime?: string
  dailyPace?: 'gentle' | 'balanced' | 'immersive'
  userPreferences?: string
}): Promise<SuggestedScheduleResult> {
  const res = await fetch('/api/schedule/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const json = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to suggest schedule')
  }
  return json.data
}

export interface CalculatedDistanceResult {
  destinationId: string
  distanceMeters: number
  durationSeconds: number
  walkTimeFormatted: string
  distanceFormatted: string
  source: 'osrm' | 'haversine'
}

export async function fetchLiveWalkDistances(
  userLat: number,
  userLng: number,
  destinations: { id: string; latitude: number; longitude: number }[]
): Promise<CalculatedDistanceResult[]> {
  const res = await fetch('/api/distance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userLat, userLng, destinations }),
  })
  const data = await res.json()
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Could not calculate walking distances')
  }
  return data.results
}

