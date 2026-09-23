'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Code,
  Compass,
  Database,
  Edit3,
  ExternalLink,
  Eye,
  Footprints,
  GripVertical,
  Info,
  Layers,
  MapPin,
  Navigation,
  Play,
  Plus,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Sunrise,
  Terminal,
  Trash2,
  Utensils,
  X,
} from 'lucide-react'
import type { Destination, DestinationAvailability, AvailabilityStatus, DestinationTone, IconName } from '@/lib/types'
import {
  fetchDestinations,
  fetchAvailability,
  saveDestinationDoc,
  deleteDestinationDoc,
  syncDestinationAvailabilitySlots,
  executePostgresQuery,
  fetchPostgresStats,
  reseedDatabase,
  suggestSchedule,
  fetchLiveWalkDistances,
  CalculatedDistanceResult,
  SuggestedScheduleItem,
  initialDestinationsData,
  initialAvailabilityData,
} from '@/lib/api'

const ICON_MAP: Record<IconName, typeof Compass> = {
  Compass,
  Sunrise,
  Sparkles,
  Utensils,
  MapPin,
}

const STATUS_LABELS: Record<AvailabilityStatus, { label: string; class: string }> = {
  open: { label: 'Open Hours', class: 'status-badge-open' },
  silent_period: { label: 'Silent Meditation', class: 'status-badge-silent_period' },
  exclusive_program: { label: 'Special Program', class: 'status-badge-exclusive_program' },
  closed: { label: 'Closed / Cleaning', class: 'status-badge-closed' },
}

const ASHRAM_WELCOME_CENTRE_COORDS = {
  lat: 10.97654,
  lng: 76.73715,
}

export default function Page() {
  const [activeTab, setActiveTab] = useState<'planner' | 'guide' | 'admin'>('planner')
  const [adminViewMode, setAdminViewMode] = useState<'destinations' | 'timetable' | 'postgres'>('destinations')
  const [visited, setVisited] = useState<string[]>(['1'])
  const [showAddStop, setShowAddStop] = useState(false)

  // Visit details
  const [checkInDate, setCheckInDate] = useState('2026-09-22')
  const [checkOutDate, setCheckOutDate] = useState('2026-09-22')
  const [selectedPlannerDate, setSelectedPlannerDate] = useState('2026-09-22')
  const [checkIn, setCheckIn] = useState('09:00')
  const [checkOut, setCheckOut] = useState('21:30')
  const [todayFormatted, setTodayFormatted] = useState<string>('22 SEPTEMBER 2026')

  // Destinations & Availability Master State
  const [destinationsList, setDestinationsList] = useState<Destination[]>(initialDestinationsData)
  const [availabilityList, setAvailabilityList] = useState<DestinationAvailability[]>(initialAvailabilityData)
  const [plannerQueue, setPlannerQueue] = useState<string[]>(['1', '2', '3', '4'])
  const [isLoading, setIsLoading] = useState(false)

  // PostgreSQL Console & Schema State
  const [sqlQuery, setSqlQuery] = useState<string>(
    'SELECT d.title, d.type, a.start_time, a.end_time, a.status, a.label\nFROM destinations d\nJOIN destination_availabilities a ON d.id = a.destination_id\nORDER BY d.display_order ASC, a.start_time ASC\nLIMIT 10;'
  )
  const [sqlResults, setSqlResults] = useState<{
    rows: Record<string, unknown>[]
    rowCount: number
    fields: { name: string; dataTypeID: number }[]
    executionTimeMs: number
  } | null>(null)
  const [sqlLoading, setSqlLoading] = useState(false)
  const [sqlError, setSqlError] = useState<string | null>(null)
  const [postgresStats, setPostgresStats] = useState<{
    engine: string
    destinationsCount: number
    availabilitiesCount: number
    tables: string[]
    status: string
    storagePath: string
  } | null>(null)
  const [schemaColumns, setSchemaColumns] = useState<
    {
      table_name: string
      column_name: string
      data_type: string
      is_nullable: string
      column_default: string | null
    }[]
  >([])
  const [reseedStatus, setReseedStatus] = useState<string | null>(null)

  // Custom Stop Quick Add (Visitor view)
  const [customTitle, setCustomTitle] = useState('')
  const [customType, setCustomType] = useState('Personal destination')
  const [customDuration, setCustomDuration] = useState('30 min')
  const [customDistance, setCustomDistance] = useState('5 min walk')

  // Reorder state
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  // Admin Portal State
  const [adminSearch, setAdminSearch] = useState('')
  const [adminToneFilter, setAdminToneFilter] = useState<'all' | 'sage' | 'terracotta' | 'clay' | 'gold'>('all')
  const [adminSelectedDestFilter, setAdminSelectedDestFilter] = useState<string>('all')
  const [destinationModalMode, setDestinationModalMode] = useState<'create' | 'edit' | null>(null)
  const [destinationToDelete, setDestinationToDelete] = useState<Destination | null>(null)

  // Admin Form State
  const [formId, setFormId] = useState<string | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formType, setFormType] = useState('')
  const [formTime, setFormTime] = useState('')
  const [formDuration, setFormDuration] = useState('')
  const [formDistance, setFormDistance] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formTone, setFormTone] = useState<DestinationTone>('sage')
  const [formIcon, setFormIcon] = useState<IconName>('Compass')
  const [formPriority, setFormPriority] = useState<number>(3)
  const [formLatitude, setFormLatitude] = useState<string>('')
  const [formLongitude, setFormLongitude] = useState<string>('')
  const [formGoogleMapsUrl, setFormGoogleMapsUrl] = useState<string>('')
  const [formAddToRoute, setFormAddToRoute] = useState(false)
  const [formSlots, setFormSlots] = useState<DestinationAvailability[]>([])

  // Suggest Rhythm state
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [suggestionSummary, setSuggestionSummary] = useState<string | null>(null)
  const [suggestedEngine, setSuggestedEngine] = useState<string | null>(null)
  const [userPreferences, setUserPreferences] = useState('')
  const [dayPlansMap, setDayPlansMap] = useState<Record<string, SuggestedScheduleItem[]> | null>(null)

  // New Slot Input in modal
  const [newSlotStart, setNewSlotStart] = useState('09:00')
  const [newSlotEnd, setNewSlotEnd] = useState('11:00')
  const [newSlotLabel, setNewSlotLabel] = useState('')
  const [newSlotStatus, setNewSlotStatus] = useState<AvailabilityStatus>('open')

  // OpenStreetMap Live Geolocation & Walk Distance State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [geoStatusMsg, setGeoStatusMsg] = useState<string | null>(null)
  const [liveWalkMap, setLiveWalkMap] = useState<Record<string, CalculatedDistanceResult>>({})
  const [isCalculatingWalk, setIsCalculatingWalk] = useState(false)

  // Initial Load from PostgreSQL API
  useEffect(() => {
    try {
      const now = new Date()
      const day = now.getDate()
      const month = now.toLocaleString('en-US', { month: 'long' }).toUpperCase()
      const year = now.getFullYear()
      setTodayFormatted(`${day} ${month} ${year}`)
    } catch {
      // fallback preserved
    }

    let isMounted = true
    async function loadData() {
      try {
        setIsLoading(true)
        const [dests, avails, pgInfo] = await Promise.all([
          fetchDestinations(),
          fetchAvailability(),
          fetchPostgresStats().catch(() => null),
        ])
        if (isMounted) {
          if (dests && dests.length > 0) {
            setDestinationsList(dests)
            calculateWalkTimes(
              userLocation?.lat ?? ASHRAM_WELCOME_CENTRE_COORDS.lat,
              userLocation?.lng ?? ASHRAM_WELCOME_CENTRE_COORDS.lng,
              dests
            )
          }
          if (avails && avails.length > 0) setAvailabilityList(avails)
          if (pgInfo?.stats) setPostgresStats(pgInfo.stats)
          if (pgInfo?.columns) setSchemaColumns(pgInfo.columns)
        }
      } catch (err) {
        console.warn('Could not load from PostgreSQL API, using initial dataset:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    loadData()
    return () => {
      isMounted = false
    }
  }, [])

  // Ordered visitor route
  const orderedDestinations = useMemo(
    () => plannerQueue.map((id) => destinationsList.find((d) => d.id === id)).filter(Boolean) as Destination[],
    [plannerQueue, destinationsList],
  )

  const nextDestination = useMemo(
    () => orderedDestinations.find((d) => !visited.includes(d.id)) ?? orderedDestinations[0] ?? destinationsList[0],
    [orderedDestinations, visited, destinationsList],
  )

  // Get operating slots for a given destination
  const getDestinationSlots = (destId: string) => {
    return availabilityList
      .filter((a) => a.destinationId === destId)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  const updateCheckInDate = (date: string) => {
    if (!date) return
    setCheckInDate(date)
    setSelectedPlannerDate(date)
    setDayPlansMap(null)
    if (checkOutDate < date) setCheckOutDate(date)
  }

  const updateCheckOutDate = (date: string) => {
    if (!date) return
    const nextDate = date < checkInDate ? checkInDate : date
    setCheckOutDate(nextDate)
    setSelectedPlannerDate(nextDate)
    setDayPlansMap(null)
  }

  const plannerDates = useMemo(() => {
    const start = new Date(`${checkInDate}T12:00:00`)
    const end = new Date(`${checkOutDate}T12:00:00`)
    const dates: string[] = []
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().slice(0, 10))
    }
    return dates.length ? dates : [checkInDate]
  }, [checkInDate, checkOutDate])

  // OpenStreetMap Location & Walking Time Calculator with High-Accuracy GPS
  const handleRefreshLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser')
      return
    }

    setIsLocating(true)
    setGeoError(null)
    setGeoStatusMsg('Acquiring high-accuracy GPS coordinates...')

    const geoOptions: PositionOptions = {
      enableHighAccuracy: true, // Forces dedicated GPS chip / fine-grained positioning
      timeout: 15000,           // 15 seconds to ensure GPS hardware fix
      maximumAge: 0,            // Fresh GPS fix
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        setUserLocation({ lat: latitude, lng: longitude, accuracy })
        setIsLocating(false)
        setGeoStatusMsg(`Location updated (±${Math.round(accuracy)}m)`)
        calculateWalkTimes(latitude, longitude)
      },
      (err) => {
        setIsLocating(false)
        let msg = 'Could not retrieve your GPS location'
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission denied in browser'
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Position unavailable'
        } else if (err.code === err.TIMEOUT) {
          msg = 'GPS request timed out'
        }
        setGeoError(msg)
        setGeoStatusMsg(null)
      },
      geoOptions
    )
  }

  // Calculate walking times using OpenStreetMap OSRM routing API
  const calculateWalkTimes = async (lat: number, lng: number, destsOverride?: Destination[]) => {
    try {
      setIsCalculatingWalk(true)
      const list = destsOverride && destsOverride.length > 0 ? destsOverride : destinationsList
      const validDestTargets = list
        .filter((d) => d.latitude != null && d.longitude != null)
        .map((d) => ({
          id: d.id,
          latitude: d.latitude!,
          longitude: d.longitude!,
        }))

      if (validDestTargets.length === 0) return

      const results = await fetchLiveWalkDistances(lat, lng, validDestTargets)
      const map: Record<string, CalculatedDistanceResult> = {}
      results.forEach((r) => {
        map[r.destinationId] = r
      })
      setLiveWalkMap(map)
      setGeoStatusMsg(
        `Walking times calculated via OpenStreetMap for ${results.length} locations`
      )
    } catch (err) {
      console.warn('Could not calculate walking times from OpenStreetMap:', err)
      setGeoError('Failed to fetch walking routing from OpenStreetMap')
    } finally {
      setIsCalculatingWalk(false)
    }
  }

  // Calculate walking times from OpenStreetMap immediately on mount, and refine with GPS if available
  useEffect(() => {
    calculateWalkTimes(ASHRAM_WELCOME_CENTRE_COORDS.lat, ASHRAM_WELCOME_CENTRE_COORDS.lng, initialDestinationsData)

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords
          setUserLocation({ lat: latitude, lng: longitude, accuracy })
          calculateWalkTimes(latitude, longitude)
        },
        () => {
          // In iframe or GPS permission pending; walk times from Welcome Centre remain active
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  useEffect(() => {
    if (!plannerDates.includes(selectedPlannerDate)) setSelectedPlannerDate(plannerDates[0])
  }, [plannerDates, selectedPlannerDate])

  const formatDateLabel = (dateValue: string) => {
    const [year, month, day] = dateValue.split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day, 12))
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${weekdays[date.getUTCDay()]} ${day} ${months[month - 1]}`
  }

  const formatPlannerDate = (index: number) => {
    if (dayPlansMap && dayPlansMap[selectedPlannerDate]) {
      return formatDateLabel(selectedPlannerDate)
    }
    const start = new Date(`${checkInDate}T12:00:00`)
    const end = new Date(`${checkOutDate}T12:00:00`)
    const dayCount = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)
    const date = new Date(start)
    date.setDate(start.getDate() + Math.min(Math.floor(index / Math.max(1, Math.ceil(orderedDestinations.length / dayCount))), dayCount - 1))
    return formatDateLabel(date.toISOString().slice(0, 10))
  }

  const visibleDestinationEntries = useMemo(() => {
    if (dayPlansMap && dayPlansMap[selectedPlannerDate]) {
      const items = dayPlansMap[selectedPlannerDate]
      return items.map((item, index) => {
        const dest = destinationsList.find((d) => d.id === item.destinationId) || {
          id: item.destinationId,
          title: item.title,
          type: item.type,
          time: item.time,
          duration: item.duration,
          distance: item.distance,
          description: item.description,
          tone: item.tone as DestinationTone,
          iconName: item.iconName as IconName,
          priority: item.priority,
          latitude: item.latitude,
          longitude: item.longitude,
          googleMapsUrl: item.googleMapsUrl,
          order: index + 1,
        }
        return {
          destination: {
            ...dest,
            time: item.time,
            duration: item.duration,
            latitude: item.latitude ?? dest.latitude,
            longitude: item.longitude ?? dest.longitude,
            googleMapsUrl: item.googleMapsUrl ?? dest.googleMapsUrl,
          },
          index,
          matchedSlot: item.matchedSlot,
          reasoning: item.reasoning,
        }
      })
    }

    return orderedDestinations
      .map((destination, index) => ({
        destination,
        index,
        matchedSlot: undefined as SuggestedScheduleItem['matchedSlot'] | undefined,
        reasoning: undefined as string | undefined,
      }))
      .filter(({ index }) => formatPlannerDate(index) === formatDateLabel(selectedPlannerDate))
  }, [dayPlansMap, selectedPlannerDate, destinationsList, orderedDestinations, checkInDate, checkOutDate])

  const handleSuggestRhythm = async () => {
    try {
      setIsSuggesting(true)
      setSuggestionSummary(null)
      const result = await suggestSchedule({
        checkInDate,
        checkOutDate,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        dailyPace: 'balanced',
        userPreferences: userPreferences.trim() || undefined,
      })

      const map: Record<string, SuggestedScheduleItem[]> = {}
      for (const day of result.days) {
        map[day.date] = day.items
      }
      setDayPlansMap(map)

      if (result.flatQueue && result.flatQueue.length > 0) {
        setPlannerQueue(result.flatQueue)
      }

      setDestinationsList((prev) => {
        return prev.map((d) => {
          for (const day of result.days) {
            const item = day.items.find((i) => i.destinationId === d.id)
            if (item) {
              return { ...d, time: item.time }
            }
          }
          return d
        })
      })

      setSuggestedEngine(result.model || (result.engine === 'gemini-3.1-flash-lite' ? 'Gemini 3.1 Flash Lite' : 'Relational Algorithm'))
      setSuggestionSummary(result.summary)
      setTimeout(() => setSuggestionSummary(null), 10000)
    } catch (err) {
      console.error('Failed to suggest rhythm:', err)
      setSuggestionSummary('Unable to compose schedule. Please verify operating hours and try again.')
      setTimeout(() => setSuggestionSummary(null), 5000)
    } finally {
      setIsSuggesting(false)
    }
  }

  const moveDestination = (id: string, direction: -1 | 1) => {
    setPlannerQueue((current) => {
      const index = current.indexOf(id)
      const nextIndex = index + direction
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current
      const updated = [...current]
      ;[updated[index], updated[nextIndex]] = [updated[nextIndex], updated[index]]
      return updated
    })
  }

  const markVisited = (id: string) => {
    setVisited((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]))
  }

  const removeDestinationFromQueue = (id: string) => {
    setPlannerQueue((current) => current.filter((destinationId) => destinationId !== id))
    setVisited((current) => current.filter((destinationId) => destinationId !== id))
    if (dayPlansMap) {
      setDayPlansMap((prev) => {
        if (!prev) return prev
        const updated: Record<string, SuggestedScheduleItem[]> = {}
        for (const [dateKey, items] of Object.entries(prev)) {
          updated[dateKey] = items.filter((item) => item.destinationId !== id)
        }
        return updated
      })
    }
  }

  const addDestinationToQueue = (destination: Destination) => {
    setPlannerQueue((current) => [...current, destination.id])
    if (dayPlansMap) {
      setDayPlansMap((prev) => {
        if (!prev) return prev
        const currentList = prev[selectedPlannerDate] || []
        const newItem: SuggestedScheduleItem = {
          destinationId: destination.id,
          title: destination.title,
          type: destination.type,
          tone: destination.tone,
          iconName: destination.iconName,
          priority: destination.priority ?? 3,
          time: destination.time || 'Next',
          duration: destination.duration,
          distance: destination.distance,
          description: destination.description,
          latitude: destination.latitude,
          longitude: destination.longitude,
          googleMapsUrl: destination.googleMapsUrl,
          date: selectedPlannerDate,
        }
        return {
          ...prev,
          [selectedPlannerDate]: [...currentList, newItem],
        }
      })
    }
    setShowAddStop(false)
    setActiveTab('planner')
  }

  const addCustomDestination = async () => {
    const title = customTitle.trim()
    if (!title) return
    const id = `custom-${Date.now()}`
    const customDestination: Destination = {
      id,
      time: 'Next',
      title,
      type: customType.trim() || 'Personal destination',
      duration: customDuration.trim() || '30 min',
      distance: customDistance.trim() || '5 min walk',
      description: 'A destination added to your personal Ashram Guide route.',
      iconName: 'MapPin',
      tone: 'sage',
      order: destinationsList.length + 1,
      isInRoute: true,
    }
    setDestinationsList((prev) => [...prev, customDestination])
    addDestinationToQueue(customDestination)
    setCustomTitle('')
    setCustomType('Contemplative space')
    setCustomDuration('30 min')
    setCustomDistance('5 min walk')

    // Save to PostgreSQL in background
    try {
      await saveDestinationDoc(customDestination)
    } catch (e) {
      console.warn('Failed to save custom destination to PostgreSQL:', e)
    }
  }

  const reorderDestination = (targetId: string) => {
    if (draggedId === null || draggedId === targetId) return
    setPlannerQueue((current) => {
      const fromIndex = current.indexOf(draggedId)
      const toIndex = current.indexOf(targetId)
      if (fromIndex < 0 || toIndex < 0) return current
      const updated = [...current]
      updated.splice(fromIndex, 1)
      updated.splice(toIndex, 0, draggedId)
      return updated
    })
    setDraggedId(null)
    setDragOverId(null)
  }

  // Admin Actions
  const openCreateDestinationModal = () => {
    setFormId(null)
    setFormTitle('')
    setFormType('Meditation space')
    setFormTime('10:00 AM')
    setFormDuration('30 min')
    setFormDistance('6 min walk')
    setFormDescription('')
    setFormTone('sage')
    setFormIcon('Compass')
    setFormPriority(3)
    setFormLatitude('')
    setFormLongitude('')
    setFormGoogleMapsUrl('')
    setFormAddToRoute(true)
    setFormSlots([
      {
        id: `slot-${Date.now()}-1`,
        destinationId: '',
        startTime: '08:00',
        endTime: '12:00',
        label: 'Morning Session',
        status: 'open',
        recurrence: 'daily',
      },
    ])
    setNewSlotStart('14:00')
    setNewSlotEnd('18:00')
    setNewSlotLabel('Afternoon Session')
    setNewSlotStatus('open')
    setDestinationModalMode('create')
  }

  const openEditDestinationModal = (item: Destination) => {
    setFormId(item.id)
    setFormTitle(item.title)
    setFormType(item.type)
    setFormTime(item.time)
    setFormDuration(item.duration)
    setFormDistance(item.distance)
    setFormDescription(item.description)
    setFormTone(item.tone)
    setFormIcon(item.iconName)
    setFormPriority(item.priority ?? 3)
    setFormLatitude(item.latitude != null ? String(item.latitude) : '')
    setFormLongitude(item.longitude != null ? String(item.longitude) : '')
    setFormGoogleMapsUrl(item.googleMapsUrl || '')
    setFormAddToRoute(plannerQueue.includes(item.id))
    const existingSlots = getDestinationSlots(item.id)
    setFormSlots(existingSlots)
    setNewSlotStart('12:00')
    setNewSlotEnd('14:00')
    setNewSlotLabel('Mid-day Session')
    setNewSlotStatus('open')
    setDestinationModalMode('edit')
  }

  const handleAddSlotToForm = () => {
    if (!newSlotStart || !newSlotEnd) return
    const newSlot: DestinationAvailability = {
      id: `slot-${Date.now()}`,
      destinationId: formId || '',
      startTime: newSlotStart,
      endTime: newSlotEnd,
      label: newSlotLabel.trim() || 'General Session',
      status: newSlotStatus,
      recurrence: 'daily',
    }
    setFormSlots((prev) => [...prev, newSlot].sort((a, b) => a.startTime.localeCompare(b.startTime)))
    setNewSlotLabel('')
  }

  const handleRemoveSlotFromForm = (slotId: string) => {
    setFormSlots((prev) => prev.filter((s) => s.id !== slotId))
  }

  const handleSaveDestination = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) return

    const targetId = formId || `dest-${Date.now()}`
    const parsedLat = formLatitude.trim() ? parseFloat(formLatitude.trim()) : null
    const parsedLng = formLongitude.trim() ? parseFloat(formLongitude.trim()) : null
    const validLat = parsedLat !== null && !isNaN(parsedLat) ? parsedLat : null
    const validLng = parsedLng !== null && !isNaN(parsedLng) ? parsedLng : null
    const mapsUrl =
      formGoogleMapsUrl.trim() ||
      (validLat !== null && validLng !== null ? `https://maps.google.com/?q=${validLat},${validLng}` : null)

    const updatedDest: Destination = {
      id: targetId,
      title: formTitle.trim(),
      type: formType.trim() || 'General location',
      time: formTime.trim() || 'Next',
      duration: formDuration.trim() || '30 min',
      distance: formDistance.trim() || '5 min walk',
      description: formDescription.trim() || 'A peaceful waypoint at the spiritual centre.',
      tone: formTone,
      iconName: formIcon,
      priority: formPriority,
      latitude: validLat,
      longitude: validLng,
      googleMapsUrl: mapsUrl,
      order: destinationsList.length + 1,
      isInRoute: formAddToRoute,
    }

    const assignedSlots = formSlots.map((s) => ({
      ...s,
      destinationId: targetId,
      recurrence: 'daily' as const,
    }))

    // Optimistic UI updates
    if (destinationModalMode === 'create') {
      setDestinationsList((prev) => [...prev, updatedDest])
      if (formAddToRoute) {
        setPlannerQueue((prev) => [...prev, targetId])
      }
    } else {
      setDestinationsList((prev) => prev.map((d) => (d.id === targetId ? updatedDest : d)))
      if (formAddToRoute && !plannerQueue.includes(targetId)) {
        setPlannerQueue((prev) => [...prev, targetId])
      } else if (!formAddToRoute && plannerQueue.includes(targetId)) {
        setPlannerQueue((prev) => prev.filter((id) => id !== targetId))
      }
    }

    // Update availability list in state
    setAvailabilityList((prev) => [
      ...prev.filter((a) => a.destinationId !== targetId),
      ...assignedSlots,
    ])

    setDestinationModalMode(null)

    // Save to PostgreSQL via API
    try {
      await saveDestinationDoc(updatedDest)
      await syncDestinationAvailabilitySlots(targetId, assignedSlots)
      // Refresh stats in background
      fetchPostgresStats().then((data) => {
        if (data?.stats) setPostgresStats(data.stats)
      }).catch(() => {})
    } catch (err) {
      console.error('Failed to sync changes with PostgreSQL:', err)
    }
  }

  const handleDeleteDestination = async () => {
    if (!destinationToDelete) return
    const id = destinationToDelete.id
    setDestinationsList((prev) => prev.filter((dest) => dest.id !== id))
    setPlannerQueue((prev) => prev.filter((item) => item !== id))
    setVisited((prev) => prev.filter((item) => item !== id))
    setAvailabilityList((prev) => prev.filter((item) => item.destinationId !== id))
    setDestinationToDelete(null)

    // Delete in PostgreSQL
    try {
      await deleteDestinationDoc(id)
      fetchPostgresStats().then((data) => {
        if (data?.stats) setPostgresStats(data.stats)
      }).catch(() => {})
    } catch (err) {
      console.error('Failed to delete destination from PostgreSQL:', err)
    }
  }

  // SQL Execution in Admin PostgreSQL Console
  const handleExecuteSql = async (overrideQuery?: string) => {
    const q = (overrideQuery || sqlQuery).trim()
    if (!q) return
    setSqlLoading(true)
    setSqlError(null)
    try {
      const res = await executePostgresQuery(q)
      setSqlResults(res)
      if (overrideQuery) setSqlQuery(overrideQuery)
    } catch (err) {
      setSqlError(err instanceof Error ? err.message : 'SQL query execution failed')
      setSqlResults(null)
    } finally {
      setSqlLoading(false)
    }
  }

  // Reseed / Reset PostgreSQL Database
  const handleReseedPostgres = async () => {
    if (!window.confirm('Reset and re-seed the PostgreSQL database with default sacred spaces and hours?')) return
    try {
      setReseedStatus('Re-seeding PostgreSQL relational tables...')
      await reseedDatabase()
      const [dests, avails, pgInfo] = await Promise.all([
        fetchDestinations(),
        fetchAvailability(),
        fetchPostgresStats().catch(() => null),
      ])
      setDestinationsList(dests)
      setAvailabilityList(avails)
      if (pgInfo?.stats) setPostgresStats(pgInfo.stats)
      if (pgInfo?.columns) setSchemaColumns(pgInfo.columns)
      setReseedStatus('Database successfully restored and seeded in PostgreSQL!')
      setTimeout(() => setReseedStatus(null), 4000)
    } catch (err) {
      setReseedStatus('Failed to reseed database.')
      setTimeout(() => setReseedStatus(null), 4000)
    }
  }

  // Admin filtered items
  const filteredAdminDestinations = useMemo(() => {
    return destinationsList.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(adminSearch.toLowerCase()) ||
        item.type.toLowerCase().includes(adminSearch.toLowerCase()) ||
        item.description.toLowerCase().includes(adminSearch.toLowerCase())
      const matchesTone = adminToneFilter === 'all' || item.tone === adminToneFilter
      return matchesSearch && matchesTone
    })
  }, [destinationsList, adminSearch, adminToneFilter])

  // Admin filtered timetable rows
  const timetableRows = useMemo(() => {
    return availabilityList
      .filter((slot) => {
        if (adminSelectedDestFilter !== 'all' && slot.destinationId !== adminSelectedDestFilter) return false
        if (!adminSearch) return true
        const dest = destinationsList.find((d) => d.id === slot.destinationId)
        const text = `${dest?.title || ''} ${slot.label} ${slot.startTime} ${slot.endTime} ${slot.status}`.toLowerCase()
        return text.includes(adminSearch.toLowerCase())
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }, [availabilityList, destinationsList, adminSelectedDestFilter, adminSearch])

  return (
    <main className="app-shell">
      {/* Topbar */}
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><span /></div>
          <div>
            <p className="brand-name">Ashram Guide</p>
            <p className="brand-subtitle">Your day, held gently</p>
          </div>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <div className="tab-row" role="tablist" aria-label="Application views" style={{ marginTop: '28px', marginBottom: '32px' }}>
        <button
          id="tab-planner"
          type="button"
          className={activeTab === 'planner' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('planner')}
          role="tab"
          aria-selected={activeTab === 'planner'}
        >
          <Clock3 /> Planner
        </button>
        <button
          id="tab-guide"
          type="button"
          className={activeTab === 'guide' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('guide')}
          role="tab"
          aria-selected={activeTab === 'guide'}
        >
          <Compass /> Guide
        </button>
        <button
          id="tab-admin"
          type="button"
          className={activeTab === 'admin' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('admin')}
          role="tab"
          aria-selected={activeTab === 'admin'}
        >
          <ShieldCheck /> Admin Portal
        </button>
      </div>

      {/* ADMIN VIEW */}
      {activeTab === 'admin' && (
        <section className="admin-view" aria-label="Admin Destination Manager">
          <div className="admin-header-card">
            <div className="admin-header-titles">
              <span className="eyebrow"><span className="eyebrow-dot" /> POSTGRESQL ACTIVE · RELATIONAL DATA MODEL</span>
              <h2>Destination &amp; Availability Manager</h2>
              <p>Configure centre destinations and manage multiple daily opening and closing hours stored in PostgreSQL.</p>
            </div>
            <div className="admin-header-buttons">
              <button
                id="admin-add-destination-btn"
                type="button"
                className="btn-primary"
                onClick={openCreateDestinationModal}
              >
                <Plus /> Add Destination
              </button>
              <button
                id="admin-view-planner-btn"
                type="button"
                className="btn-secondary"
                onClick={() => setActiveTab('planner')}
              >
                <Eye /> Visitor View
              </button>
            </div>
          </div>

          {/* Sub-tabs in Admin: Destinations Directory vs Operating Hours Timetable vs PostgreSQL Model & Console */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div className="admin-subtab-row" role="tablist" aria-label="Admin views">
              <button
                id="admin-subtab-destinations"
                type="button"
                className={`admin-subtab ${adminViewMode === 'destinations' ? 'active' : ''}`}
                onClick={() => setAdminViewMode('destinations')}
              >
                <Layers style={{ width: '13px', height: '13px', display: 'inline', marginRight: '6px' }} />
                Destinations Directory ({destinationsList.length})
              </button>
              <button
                id="admin-subtab-timetable"
                type="button"
                className={`admin-subtab ${adminViewMode === 'timetable' ? 'active' : ''}`}
                onClick={() => setAdminViewMode('timetable')}
              >
                <Clock3 style={{ width: '13px', height: '13px', display: 'inline', marginRight: '6px' }} />
                Daily Operating Hours Table ({availabilityList.length} slots)
              </button>
              <button
                id="admin-subtab-postgres"
                type="button"
                className={`admin-subtab ${adminViewMode === 'postgres' ? 'active' : ''}`}
                onClick={() => {
                  setAdminViewMode('postgres')
                  fetchPostgresStats().then((data) => {
                    if (data?.stats) setPostgresStats(data.stats)
                    if (data?.columns) setSchemaColumns(data.columns)
                  }).catch(() => {})
                }}
              >
                <Database style={{ width: '13px', height: '13px', display: 'inline', marginRight: '6px' }} />
                PostgreSQL Schema &amp; Console
              </button>
            </div>

            {adminViewMode === 'timetable' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#68796f' }}>Filter by Destination:</span>
                <select
                  id="timetable-dest-filter"
                  className="admin-form-select"
                  style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}
                  value={adminSelectedDestFilter}
                  onChange={(e) => setAdminSelectedDestFilter(e.target.value)}
                >
                  <option value="all">All Destinations</option>
                  {destinationsList.map((d) => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Filter & Search Bar */}
          <div className="admin-filter-bar">
            <div className="admin-search-wrapper">
              <Search />
              <input
                id="admin-search-input"
                type="text"
                className="admin-search-input"
                placeholder={adminViewMode === 'destinations' ? 'Search destinations, spaces, or categories...' : 'Search timetable sessions or time...'}
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
              />
            </div>
            {adminViewMode === 'destinations' && (
              <div className="admin-filter-chips">
                {(['all', 'sage', 'terracotta', 'clay', 'gold'] as const).map((tone) => (
                  <button
                    id={`filter-tone-${tone}`}
                    key={tone}
                    type="button"
                    className={`filter-chip ${adminToneFilter === tone ? 'active' : ''}`}
                    onClick={() => setAdminToneFilter(tone)}
                  >
                    {tone === 'all' ? 'All Tones' : tone.charAt(0).toUpperCase() + tone.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* VIEW 1: DESTINATIONS DIRECTORY GRID */}
          {adminViewMode === 'destinations' && (
            <div className="admin-grid">
              {filteredAdminDestinations.map((item) => {
                const Icon = ICON_MAP[item.iconName] || MapPin
                const isInPlan = plannerQueue.includes(item.id)
                const slots = getDestinationSlots(item.id)

                return (
                  <article key={item.id} className="admin-card">
                    <div>
                      <div className="admin-card-top">
                        <div className={`place-icon ${item.tone}`}>
                          <Icon />
                        </div>
                        <div className="admin-card-heading">
                          <h3>{item.title}</h3>
                          <span>{item.type}</span>
                          <div className="admin-card-badges">
                            <span className="badge-pill priority-pill" title="Deterministic Rhythm priority weight">
                              ★ Priority {item.priority ?? 3}
                            </span>
                            <span className="badge-pill">
                              <Clock3 /> {item.duration}
                            </span>
                            {liveWalkMap[item.id] ? (
                              <span
                                className="badge-pill live-walk-pill"
                                title={`Walking time via OpenStreetMap (${liveWalkMap[item.id].distanceFormatted})`}
                              >
                                <Footprints />
                                {liveWalkMap[item.id].walkTimeFormatted} ({liveWalkMap[item.id].distanceFormatted})
                                <span style={{ fontSize: '9px', fontWeight: 600, background: 'rgba(30, 79, 45, 0.12)', padding: '1px 4px', borderRadius: '3px', color: '#1a4e28' }}>OSM</span>
                              </span>
                            ) : (
                              <span className="badge-pill">
                                <Footprints /> {item.distance}
                              </span>
                            )}
                            {item.latitude != null && item.longitude != null && (
                              <span
                                className="badge-pill"
                                style={{ background: '#f0f5ed', borderColor: '#cfe0ce', color: '#275239', fontFamily: 'monospace', fontSize: '10px' }}
                                title={`GPS Coordinates: ${item.latitude}, ${item.longitude}`}
                              >
                                <MapPin style={{ width: '10px', height: '10px' }} />
                                {item.latitude.toFixed(4)}°, {item.longitude.toFixed(4)}°
                              </span>
                            )}
                            {item.googleMapsUrl && (
                              <a
                                href={item.googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="badge-pill"
                                style={{ background: '#fcf2f0', borderColor: '#edd3cf', color: '#a63c26', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                title="Open in Google Maps"
                              >
                                Google Maps <ExternalLink style={{ width: '9px', height: '9px' }} />
                              </a>
                            )}
                            {isInPlan && (
                              <span className="badge-pill in-route">
                                <Check /> In Route
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="admin-card-desc" style={{ marginTop: '14px' }}>
                        {item.description}
                      </div>

                      {/* Operating Hours preview on card */}
                      <div style={{ marginTop: '14px', borderTop: '1px solid #edf1eb', paddingTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#4a5d51' }}>
                            Operating Slots ({slots.length} daily)
                          </span>
                          <span style={{ fontSize: '10px', color: '#7a8c80' }}>Daily recurrence</span>
                        </div>
                        {slots.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {slots.slice(0, 3).map((s) => (
                              <div
                                key={s.id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: '11px',
                                  background: '#f7f9f5',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                }}
                              >
                                <span style={{ fontWeight: 600, color: '#2e4438' }}>{s.startTime} – {s.endTime}</span>
                                <span style={{ color: '#68786f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                                  {s.label}
                                </span>
                                <span className={`status-badge ${STATUS_LABELS[s.status].class}`} style={{ fontSize: '9px', padding: '1px 5px' }}>
                                  {s.status === 'open' ? 'Open' : s.status === 'silent_period' ? 'Silent' : s.status === 'exclusive_program' ? 'Program' : 'Closed'}
                                </span>
                              </div>
                            ))}
                            {slots.length > 3 && (
                              <span style={{ fontSize: '10px', color: '#7a8c80', textAlign: 'center', marginTop: '2px' }}>
                                +{slots.length - 3} more daily session{slots.length - 3 > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p style={{ fontSize: '11px', color: '#97a39b', fontStyle: 'italic' }}>No operating hours configured.</p>
                        )}
                      </div>
                    </div>

                    <div className="admin-card-actions">
                      <button
                        id={`edit-dest-${item.id}`}
                        type="button"
                        className="btn-card-edit"
                        onClick={() => openEditDestinationModal(item)}
                      >
                        <Edit3 /> Edit &amp; Hours
                      </button>
                      <button
                        id={`delete-dest-${item.id}`}
                        type="button"
                        className="btn-card-delete"
                        onClick={() => setDestinationToDelete(item)}
                      >
                        <Trash2 /> Delete
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {/* VIEW 2: MASTER TIMETABLE VIEW */}
          {adminViewMode === 'timetable' && (
            <div className="timetable-container">
              <table className="timetable-table">
                <thead>
                  <tr>
                    <th>Destination</th>
                    <th>Time Window</th>
                    <th>Session / Activity Label</th>
                    <th>Status</th>
                    <th>Recurrence</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {timetableRows.map((slot) => {
                    const dest = destinationsList.find((d) => d.id === slot.destinationId)
                    const statusInfo = STATUS_LABELS[slot.status] || STATUS_LABELS.open

                    return (
                      <tr key={slot.id}>
                        <td>
                          <strong>{dest?.title || 'Unknown Destination'}</strong>
                          <div style={{ fontSize: '11px', color: '#7a8c80' }}>{dest?.type}</div>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#254032' }}>
                            {slot.startTime} — {slot.endTime}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 500, color: '#384d41' }}>{slot.label}</span>
                        </td>
                        <td>
                          <span className={`status-badge ${statusInfo.class}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '11px', color: '#5b6e62', textTransform: 'capitalize' }}>
                            {slot.recurrence}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {dest && (
                            <button
                              id={`edit-hours-${slot.id}`}
                              type="button"
                              className="btn-card-edit"
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                              onClick={() => openEditDestinationModal(dest)}
                            >
                              <Edit3 style={{ width: '12px', height: '12px' }} /> Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {timetableRows.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: '#7a8c80' }}>
                        No operating hours match the current query or filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW 3: POSTGRESQL SCHEMA & SQL CONSOLE */}
          {adminViewMode === 'postgres' && (
            <div className="postgres-container">
              {/* Engine Status Card */}
              <div className="postgres-card">
                <div className="postgres-header-row">
                  <div>
                    <div className="postgres-title">
                      <Server style={{ width: '18px', height: '18px', color: '#2b523e' }} />
                      <span>PostgreSQL Relational Engine</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#68796f', marginTop: '4px' }}>
                      ACID-compliant relational database powering Ashram Guide sacred destinations and recurring operating hours.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="postgres-badge-connected">Live &amp; Connected</span>
                    <button
                      id="postgres-reseed-btn"
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={handleReseedPostgres}
                    >
                      <RefreshCw style={{ width: '12px', height: '12px' }} /> Reset &amp; Re-seed
                    </button>
                  </div>
                </div>

                {reseedStatus && (
                  <div style={{ background: '#eaf4ee', border: '1px solid #bfe0ca', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', color: '#1b5e34' }}>
                    {reseedStatus}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  <div style={{ background: '#f8faf8', border: '1px solid #e2e8e3', padding: '10px 14px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#68796f', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Engine Version</span>
                    <p style={{ fontWeight: 600, color: '#1f3326', fontSize: '13px', marginTop: '3px' }}>PostgreSQL 16.2</p>
                  </div>
                  <div style={{ background: '#f8faf8', border: '1px solid #e2e8e3', padding: '10px 14px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#68796f', textTransform: 'uppercase', letterSpacing: '0.5px' }}>destinations rows</span>
                    <p style={{ fontWeight: 600, color: '#1f3326', fontSize: '13px', marginTop: '3px' }}>{destinationsList.length} rows</p>
                  </div>
                  <div style={{ background: '#f8faf8', border: '1px solid #e2e8e3', padding: '10px 14px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#68796f', textTransform: 'uppercase', letterSpacing: '0.5px' }}>destination_availabilities</span>
                    <p style={{ fontWeight: 600, color: '#1f3326', fontSize: '13px', marginTop: '3px' }}>{availabilityList.length} rows</p>
                  </div>
                  <div style={{ background: '#f8faf8', border: '1px solid #e2e8e3', padding: '10px 14px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#68796f', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Relational Integrity</span>
                    <p style={{ fontWeight: 600, color: '#1b5e34', fontSize: '13px', marginTop: '3px' }}>CASCADE ON DELETE</p>
                  </div>
                </div>
              </div>

              {/* Schema Definition Cards */}
              <div className="postgres-grid">
                {/* Table 1: destinations */}
                <div className="postgres-card">
                  <div className="postgres-header-row">
                    <div className="postgres-title">
                      <Database style={{ width: '16px', height: '16px', color: '#385b4a' }} />
                      <span>TABLE: destinations</span>
                    </div>
                    <span style={{ fontSize: '11px', background: '#eaf1eb', color: '#2d4b3c', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      Primary Entity
                    </span>
                  </div>
                  <table className="postgres-col-table">
                    <thead>
                      <tr>
                        <th>Column</th>
                        <th>Type</th>
                        <th>Constraints</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>id</strong></td>
                        <td><span className="postgres-type-tag">VARCHAR(100)</span></td>
                        <td>PRIMARY KEY</td>
                      </tr>
                      <tr>
                        <td>title</td>
                        <td><span className="postgres-type-tag">VARCHAR(255)</span></td>
                        <td>NOT NULL</td>
                      </tr>
                      <tr>
                        <td>type</td>
                        <td><span className="postgres-type-tag">VARCHAR(100)</span></td>
                        <td>NOT NULL</td>
                      </tr>
                      <tr>
                        <td>tone</td>
                        <td><span className="postgres-type-tag">VARCHAR(50)</span></td>
                        <td>CHECK (sage, terracotta, clay, gold)</td>
                      </tr>
                      <tr>
                        <td>icon_name</td>
                        <td><span className="postgres-type-tag">VARCHAR(50)</span></td>
                        <td>DEFAULT 'Compass'</td>
                      </tr>
                      <tr>
                        <td>display_order</td>
                        <td><span className="postgres-type-tag">INTEGER</span></td>
                        <td>INDEXED (idx_destinations_order)</td>
                      </tr>
                      <tr>
                        <td>is_in_route</td>
                        <td><span className="postgres-type-tag">BOOLEAN</span></td>
                        <td>DEFAULT false</td>
                      </tr>
                      <tr>
                        <td>priority</td>
                        <td><span className="postgres-type-tag">INTEGER</span></td>
                        <td>DEFAULT 3 (Weight 1-5 for Rhythm algorithm)</td>
                      </tr>
                      <tr>
                        <td>latitude</td>
                        <td><span className="postgres-type-tag">DOUBLE PRECISION</span></td>
                        <td>GPS Coordinate (e.g. 10.978079)</td>
                      </tr>
                      <tr>
                        <td>longitude</td>
                        <td><span className="postgres-type-tag">DOUBLE PRECISION</span></td>
                        <td>GPS Coordinate (e.g. 76.735264)</td>
                      </tr>
                      <tr>
                        <td>google_maps_url</td>
                        <td><span className="postgres-type-tag">TEXT</span></td>
                        <td>Direct Google Maps navigation URL</td>
                      </tr>
                      <tr>
                        <td>description</td>
                        <td><span className="postgres-type-tag">TEXT</span></td>
                        <td>DEFAULT ''</td>
                      </tr>
                      <tr>
                        <td>created_at / updated_at</td>
                        <td><span className="postgres-type-tag">TIMESTAMPTZ</span></td>
                        <td>DEFAULT CURRENT_TIMESTAMP</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Table 2: destination_availabilities */}
                <div className="postgres-card">
                  <div className="postgres-header-row">
                    <div className="postgres-title">
                      <Clock3 style={{ width: '16px', height: '16px', color: '#995633' }} />
                      <span>TABLE: destination_availabilities</span>
                    </div>
                    <span style={{ fontSize: '11px', background: '#faeee7', color: '#8c432d', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      Foreign Key Relation
                    </span>
                  </div>
                  <table className="postgres-col-table">
                    <thead>
                      <tr>
                        <th>Column</th>
                        <th>Type</th>
                        <th>Constraints</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>id</strong></td>
                        <td><span className="postgres-type-tag">VARCHAR(100)</span></td>
                        <td>PRIMARY KEY</td>
                      </tr>
                      <tr>
                        <td><strong>destination_id</strong></td>
                        <td><span className="postgres-type-tag">VARCHAR(100)</span></td>
                        <td><strong style={{ color: '#8c432d' }}>REFERENCES destinations(id) ON DELETE CASCADE</strong></td>
                      </tr>
                      <tr>
                        <td>start_time</td>
                        <td><span className="postgres-type-tag">VARCHAR(10)</span></td>
                        <td>NOT NULL (e.g. &apos;06:00&apos;)</td>
                      </tr>
                      <tr>
                        <td>end_time</td>
                        <td><span className="postgres-type-tag">VARCHAR(10)</span></td>
                        <td>NOT NULL (e.g. &apos;08:30&apos;)</td>
                      </tr>
                      <tr>
                        <td>label</td>
                        <td><span className="postgres-type-tag">VARCHAR(255)</span></td>
                        <td>NOT NULL</td>
                      </tr>
                      <tr>
                        <td>status</td>
                        <td><span className="postgres-type-tag">VARCHAR(50)</span></td>
                        <td>CHECK (open, silent_period, exclusive_program, closed)</td>
                      </tr>
                      <tr>
                        <td>recurrence</td>
                        <td><span className="postgres-type-tag">VARCHAR(50)</span></td>
                        <td>DEFAULT &apos;daily&apos;</td>
                      </tr>
                      <tr>
                        <td>created_at / updated_at</td>
                        <td><span className="postgres-type-tag">TIMESTAMPTZ</span></td>
                        <td>DEFAULT CURRENT_TIMESTAMP</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Live Interactive SQL Query Console */}
              <div className="postgres-card">
                <div className="postgres-header-row">
                  <div className="postgres-title">
                    <Terminal style={{ width: '17px', height: '17px', color: '#2b523e' }} />
                    <span>Interactive PostgreSQL Query Console</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#68796f' }}>
                    Execute queries directly against the live PostgreSQL database
                  </span>
                </div>

                <div className="postgres-chip-row">
                  <span style={{ fontSize: '11px', color: '#7a8c80', alignSelf: 'center', marginRight: '4px' }}>Quick Queries:</span>
                  <button
                    type="button"
                    className="postgres-chip"
                    onClick={() => {
                      const q = 'SELECT id, title, type, duration, tone FROM destinations ORDER BY display_order ASC;'
                      setSqlQuery(q)
                      handleExecuteSql(q)
                    }}
                  >
                    SELECT * destinations
                  </button>
                  <button
                    type="button"
                    className="postgres-chip"
                    onClick={() => {
                      const q = 'SELECT title, priority, latitude, longitude, google_maps_url FROM destinations ORDER BY priority DESC, display_order ASC;'
                      setSqlQuery(q)
                      handleExecuteSql(q)
                    }}
                  >
                    SELECT coordinates &amp; maps
                  </button>
                  <button
                    type="button"
                    className="postgres-chip"
                    onClick={() => {
                      const q = `SELECT d.title, a.start_time, a.end_time, a.status, a.label\nFROM destinations d\nJOIN destination_availabilities a ON d.id = a.destination_id\nORDER BY d.display_order ASC, a.start_time ASC\nLIMIT 12;`
                      setSqlQuery(q)
                      handleExecuteSql(q)
                    }}
                  >
                    JOIN destinations &amp; hours
                  </button>
                  <button
                    type="button"
                    className="postgres-chip"
                    onClick={() => {
                      const q = 'SELECT status, count(*) AS total_slots FROM destination_availabilities GROUP BY status;'
                      setSqlQuery(q)
                      handleExecuteSql(q)
                    }}
                  >
                    GROUP BY status count
                  </button>
                  <button
                    type="button"
                    className="postgres-chip"
                    onClick={() => {
                      const q = "SELECT table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position;"
                      setSqlQuery(q)
                      handleExecuteSql(q)
                    }}
                  >
                    information_schema.columns
                  </button>
                </div>

                <div className="postgres-sql-box">
                  <textarea
                    id="postgres-query-input"
                    className="postgres-sql-textarea"
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    placeholder="Enter PostgreSQL query..."
                    rows={4}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#8aa392' }}>Tip: Supports standard SQL SELECT, JOIN, GROUP BY, and EXPLAIN statements.</span>
                    <button
                      id="postgres-run-query-btn"
                      type="button"
                      className="btn-primary"
                      style={{ padding: '8px 16px', fontSize: '12px' }}
                      disabled={sqlLoading}
                      onClick={() => handleExecuteSql()}
                    >
                      <Play style={{ width: '13px', height: '13px' }} />
                      {sqlLoading ? 'Executing...' : 'Run Query'}
                    </button>
                  </div>
                </div>

                {sqlError && (
                  <div style={{ background: '#fcf1ee', border: '1px solid #f0cfc7', padding: '10px 14px', borderRadius: '8px', color: '#ad3e29', fontSize: '13px', fontFamily: 'monospace' }}>
                    <strong>PostgreSQL Error:</strong> {sqlError}
                  </div>
                )}

                {sqlResults && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="postgres-meta-bar">
                      <span><strong>{sqlResults.rowCount}</strong> row{sqlResults.rowCount !== 1 ? 's' : ''} returned</span>
                      <span>Execution time: <strong>{sqlResults.executionTimeMs} ms</strong></span>
                    </div>

                    <div className="postgres-result-container">
                      <table className="postgres-result-table">
                        <thead>
                          <tr>
                            {sqlResults.fields.map((f) => (
                              <th key={f.name}>{f.name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sqlResults.rows.map((row, rIdx) => (
                            <tr key={rIdx}>
                              {sqlResults.fields.map((f) => (
                                <td key={f.name}>
                                  {typeof row[f.name] === 'boolean'
                                    ? row[f.name] ? 'true' : 'false'
                                    : row[f.name] === null || row[f.name] === undefined
                                    ? '<null>'
                                    : String(row[f.name])}
                                </td>
                              ))}
                            </tr>
                          ))}
                          {sqlResults.rows.length === 0 && (
                            <tr>
                              <td colSpan={sqlResults.fields.length || 1} style={{ textAlign: 'center', padding: '24px', color: '#7a8c80' }}>
                                Query executed successfully (0 rows returned).
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {filteredAdminDestinations.length === 0 && adminViewMode === 'destinations' && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#7a8c81' }}>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '20px', color: '#385443' }}>No destinations match your filter.</p>
              <p style={{ fontSize: '13px', marginTop: '6px' }}>Try adjusting your search query or tone filter above.</p>
            </div>
          )}
        </section>
      )}

      {/* VISITOR VIEW (Planner / Guide) */}
      {activeTab !== 'admin' && (
        <>
          <section className="hero-section">
            <div className="eyebrow"><span className="eyebrow-dot" /> TODAY · {todayFormatted}</div>
            <h1>Make space for<br /><em>what matters.</em></h1>
            <p className="hero-copy">A thoughtful route through the centre, shaped around your time and pace.</p>
          </section>

          <div className="content-grid">
            <section className="main-panel">
              <section className="planner-time-strip" aria-label="Planner time and preferences settings">
                <div className="planner-time-header-row">
                  <div>
                    <p className="section-kicker">PLAN AROUND YOUR STAY</p>
                    <strong>{checkInDate === checkOutDate ? checkInDate : `${checkInDate} — ${checkOutDate}`}</strong>
                    <span>{checkIn} check-in · {checkOut} check-out</span>
                  </div>
                  <div className="planner-model-indicator">
                    <span className="gemini-pill-tag">
                      <Sparkles className="gemini-pill-icon" />
                      Gemini 3.1 Flash Lite
                    </span>
                  </div>
                </div>

                <div className="planner-time-fields">
                  <label>Arrival date<input type="date" value={checkInDate} onChange={(event) => updateCheckInDate(event.target.value)} /></label>
                  <label>Check in<input type="time" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} /></label>
                  <label>Departure date<input type="date" min={checkInDate} value={checkOutDate} onChange={(event) => updateCheckOutDate(event.target.value)} /></label>
                  <label>Check out<input type="time" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} /></label>
                </div>

                {/* Preference text box */}
                <div className="planner-preference-container">
                  <div className="planner-preference-top">
                    <label htmlFor="user-pref-input" className="planner-preference-label">
                      <Sparkles style={{ width: '13px', height: '13px', color: '#c18158' }} />
                      <span>Your Focus &amp; Preferences:</span>
                    </label>
                    <span className="planner-preference-hint">Gemini crafts a tailored, non-overlapping schedule</span>
                  </div>

                  <div className="planner-preference-input-group">
                    <input
                      id="user-pref-input"
                      type="text"
                      className="planner-preference-input"
                      value={userPreferences}
                      onChange={(e) => setUserPreferences(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isSuggesting) {
                          e.preventDefault()
                          handleSuggestRhythm()
                        }
                      }}
                      placeholder="e.g., Silent meditation, water dip at Surya Kund, walking trails, lunch at Isha Café..."
                    />
                    {userPreferences && (
                      <button
                        type="button"
                        className="planner-preference-clear"
                        onClick={() => setUserPreferences('')}
                        title="Clear preferences"
                        aria-label="Clear preferences"
                      >
                        <X style={{ width: '13px', height: '13px' }} />
                      </button>
                    )}
                    <button
                      id="suggest-rhythm-btn"
                      type="button"
                      className="suggest-rhythm-button"
                      onClick={handleSuggestRhythm}
                      disabled={isSuggesting}
                      title="Generate a conflict-free schedule with Gemini 3.1 Flash Lite"
                    >
                      <Sparkles className={isSuggesting ? 'animate-spin' : ''} />
                      <span>{isSuggesting ? 'Gemini is composing...' : 'Suggest Schedule'}</span>
                    </button>
                  </div>

                  <div className="planner-preference-chips" aria-label="Quick focus suggestions">
                    <span className="chips-label">Quick focus:</span>
                    {[
                      { label: '🧘 Silent Meditation', text: 'Silent meditation at Dhyanalinga and quiet contemplative spaces' },
                      { label: '💧 Surya Kund Dip', text: 'Morning dip at Surya Kund sacred water body before noon' },
                      { label: '🌿 Nature Walk', text: 'Peaceful walking trail through Vanashree Garden in late afternoon' },
                      { label: '🍲 Mindful Dining', text: 'Vegetarian lunch break at Isha Café around noon' },
                      { label: '📿 Chanting & Sounds', text: 'Sound offering (Nadha Aradhana) and evening chanting' },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        className="preference-chip"
                        onClick={() => {
                          setUserPreferences((prev) => {
                            if (!prev.trim()) return item.text
                            if (prev.includes(item.text)) return prev
                            return `${prev.trim()}, ${item.text}`
                          })
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {suggestionSummary && (
                <div className="suggestion-toast" role="status">
                  <Sparkles />
                  <div>
                    <strong>{suggestedEngine ? `${suggestedEngine} · Rhythm Composed:` : 'Rhythm Composed:'}</strong> {suggestionSummary}
                  </div>
                </div>
              )}

              {activeTab === 'planner' ? (
                <>
                  <div className="planner-date-nav" aria-label="Planner dates">
                    {plannerDates.map((date) => (
                      <button
                        type="button"
                        key={date}
                        id={`planner-date-${date}`}
                        className={selectedPlannerDate === date ? 'planner-date-button active' : 'planner-date-button'}
                        onClick={() => setSelectedPlannerDate(date)}
                      >
                        {formatDateLabel(date)}
                      </button>
                    ))}
                  </div>

                  <div className="section-header">
                    <div>
                      <p className="section-kicker">A SUGGESTED RHYTHM</p>
                      <h2>Your day at a glance</h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span
                        className="location-origin-tag"
                        style={{
                          fontSize: '11px',
                          color: '#245437',
                          background: '#eaf4ec',
                          border: '1px solid #bddbc2',
                          padding: '3px 8px',
                          borderRadius: '16px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontWeight: 500,
                        }}
                        title={
                          userLocation
                            ? `Walking times calculated from your live browser location via OpenStreetMap (±${Math.round(userLocation.accuracy ?? 10)}m)`
                            : 'Walking times calculated from Ashram Welcome Centre (Arrival) via OpenStreetMap'
                        }
                      >
                        <Footprints style={{ width: '12px', height: '12px', color: '#27693d' }} />
                        {userLocation ? 'OSM Live GPS' : 'OSM Walk Times (Arrival)'}
                      </span>
                      <button
                        id="refresh-location-btn"
                        type="button"
                        className={`refresh-location-btn ${isLocating || isCalculatingWalk ? 'locating' : ''}`}
                        onClick={handleRefreshLocation}
                        disabled={isLocating || isCalculatingWalk}
                        title={
                          userLocation
                            ? `Location updated: ${userLocation.lat.toFixed(4)}°, ${userLocation.lng.toFixed(4)}°. Click to refresh.`
                            : 'Acquire your current GPS location and calculate walking times to all destinations via OpenStreetMap'
                        }
                      >
                        <RefreshCw />
                        <span>
                          {isLocating
                            ? 'Locating GPS...'
                            : isCalculatingWalk
                            ? 'Routing walk...'
                            : 'Refresh location'}
                        </span>
                      </button>
                      <span className="time-range">{checkIn} — {checkOut}</span>
                    </div>
                  </div>

                  <div className="timeline">
                    {visibleDestinationEntries.map(({ destination, index, matchedSlot, reasoning }) => {
                      const Icon = ICON_MAP[destination.iconName] || MapPin
                      const isFirst = index === 0
                      const isLast = index === visibleDestinationEntries.length - 1
                      const isVisited = visited.includes(destination.id)
                      const isNext = destination.id === nextDestination.id && !isVisited

                      return (
                        <div
                          className={`timeline-item ${isVisited ? 'visited' : ''} ${isNext ? 'next' : ''} ${dragOverId === destination.id ? 'drag-over' : ''}`}
                          key={`${destination.id}-${index}`}
                          onDragOver={(event) => {
                            event.preventDefault()
                            setDragOverId(destination.id)
                          }}
                          onDrop={() => reorderDestination(destination.id)}
                        >
                          <div className="timeline-rail">
                            <div className="timeline-dot">
                              {isVisited ? <Check /> : <span>{index + 1}</span>}
                            </div>
                            {index < visibleDestinationEntries.length - 1 && <div className="timeline-line" />}
                          </div>

                          <article className="plan-card">
                            <div className="plan-topline">
                              <span className="plan-date"><CalendarDays /> {formatPlannerDate(index)}</span>
                              <span className="plan-time">{destination.time}</span>
                              <span className="plan-duration">{destination.duration}</span>
                              {matchedSlot && (
                                <span className="plan-slot-tag" title={`Operating slot: ${matchedSlot.label} (${matchedSlot.startTime}–${matchedSlot.endTime})`}>
                                  <Sparkles className="slot-icon" /> {matchedSlot.label}
                                </span>
                              )}
                            </div>

                            <div className="plan-title-row">
                              <button
                                id={`drag-handle-${destination.id}`}
                                className="drag-handle"
                                type="button"
                                draggable="true"
                                aria-label={`Drag to reorder ${destination.title}`}
                                onDragStart={() => setDraggedId(destination.id)}
                                onDragEnd={() => {
                                  setDraggedId(null)
                                  setDragOverId(null)
                                }}
                              >
                                <GripVertical />
                              </button>
                              <div className={`place-icon ${destination.tone}`}>
                                <Icon />
                              </div>
                              <div>
                                <h3>{destination.title}</h3>
                                <p>{destination.type}</p>
                              </div>
                              <div className="reorder-controls" aria-label={`Reorder ${destination.title}`}>
                                <button
                                  id={`move-up-${destination.id}`}
                                  type="button"
                                  onClick={() => moveDestination(destination.id, -1)}
                                  disabled={isFirst}
                                  aria-label={`Move ${destination.title} earlier`}
                                >
                                  <ArrowUp />
                                </button>
                                <button
                                  id={`move-down-${destination.id}`}
                                  type="button"
                                  onClick={() => moveDestination(destination.id, 1)}
                                  disabled={isLast}
                                  aria-label={`Move ${destination.title} later`}
                                >
                                  <ArrowDown />
                                </button>
                                <button
                                  id={`remove-stop-${destination.id}`}
                                  className="remove-stop"
                                  type="button"
                                  onClick={() => removeDestinationFromQueue(destination.id)}
                                  aria-label={`Remove ${destination.title} from plan`}
                                >
                                  ×
                                </button>
                              </div>
                            </div>

                            {reasoning && (
                              <div className="plan-gemini-reasoning" title="Scheduled with Gemini Flash Lite according to your intention">
                                <Sparkles className="reasoning-sparkle" />
                                <span>{reasoning}</span>
                              </div>
                            )}

                            <div className="plan-meta">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                {liveWalkMap[destination.id] ? (
                                  <span
                                    className="badge-pill live-walk-pill"
                                    title={`Approximate walking time via OpenStreetMap routing (${liveWalkMap[destination.id].distanceFormatted} away)`}
                                  >
                                    <Footprints />
                                    <strong>{liveWalkMap[destination.id].walkTimeFormatted}</strong>
                                    <span style={{ fontSize: '10px', opacity: 0.85 }}>({liveWalkMap[destination.id].distanceFormatted})</span>
                                    <span style={{ fontSize: '9px', fontWeight: 600, background: 'rgba(30, 79, 45, 0.12)', padding: '1px 5px', borderRadius: '4px', color: '#1a4e28' }}>OSM</span>
                                  </span>
                                ) : (
                                  <span><Footprints /> {destination.distance}</span>
                                )}
                                {destination.priority !== undefined && destination.priority >= 4 && (
                                  <span className="priority-badge-tag" title="Daily recurring anchor">★ Priority {destination.priority}</span>
                                )}
                                {destination.googleMapsUrl && (
                                  <a
                                    href={destination.googleMapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="maps-pill-link"
                                    title={
                                      destination.latitude != null && destination.longitude != null
                                        ? `Open in Google Maps (${destination.latitude.toFixed(4)}, ${destination.longitude.toFixed(4)})`
                                        : 'Open in Google Maps'
                                    }
                                  >
                                    <MapPin className="maps-icon" />
                                    <span>Maps</span>
                                    <ExternalLink className="maps-ext" />
                                  </a>
                                )}
                              </div>
                              {isNext && <span className="next-label">NEXT STOP</span>}
                            </div>


                            <button
                              id={`mark-visited-${destination.id}`}
                              type="button"
                              className={isVisited ? 'visited-button' : 'visit-button'}
                              onClick={() => markVisited(destination.id)}
                            >
                              {isVisited ? <><Check /> Visited</> : <>Mark as visited <Check /></>}
                            </button>
                          </article>
                        </div>
                      )
                    })}
                  </div>

                  <button
                    id="open-add-stop-btn"
                    className="add-stop"
                    type="button"
                    onClick={() => setShowAddStop(true)}
                  >
                    <Plus /> Add a stop to your plan
                  </button>
                </>
              ) : (
                <GuidePanel
                  destination={nextDestination}
                  slots={getDestinationSlots(nextDestination.id)}
                  liveDistance={liveWalkMap[nextDestination.id]}
                  onVisited={() => markVisited(nextDestination.id)}
                />
              )}
            </section>

            {/* Sidebar */}
            <aside className="guide-sidebar">
              <div className="sidebar-heading">
                <div>
                  <p className="section-kicker">UP NEXT</p>
                  <h2>{nextDestination.title}</h2>
                </div>
                <span className="live-pill"><span /> Live</span>
              </div>
              <div className="map-card">
                <div className="map-grid" />
                <div className="map-route route-one" />
                <div className="map-route route-two" />
                <div className="map-pin pin-start"><MapPin /></div>
                <div className="map-pin pin-end"><MapPin /></div>
                <div className="map-label label-start">You are here</div>
                <div className="map-label label-end">{nextDestination.title}</div>
                <div className="map-distance">
                  <Navigation />
                  {liveWalkMap[nextDestination.id] ? (
                    <span>
                      {liveWalkMap[nextDestination.id].walkTimeFormatted} ({liveWalkMap[nextDestination.id].distanceFormatted})
                    </span>
                  ) : (
                    nextDestination.distance
                  )}
                </div>
              </div>
              {nextDestination.latitude != null && nextDestination.longitude != null && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '-8px', marginBottom: '14px', fontSize: '11px', color: '#687d71' }}>
                  <span style={{ fontFamily: 'monospace' }}>
                    📍 {nextDestination.latitude.toFixed(5)}°, {nextDestination.longitude.toFixed(5)}°
                  </span>
                  {nextDestination.googleMapsUrl && (
                    <a
                      href={nextDestination.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="maps-pill-link"
                      style={{ padding: '2px 7px', fontSize: '10px' }}
                    >
                      <MapPin className="maps-icon" style={{ width: '10px', height: '10px' }} />
                      Google Maps
                      <ExternalLink className="maps-ext" style={{ width: '9px', height: '9px' }} />
                    </a>
                  )}
                </div>
              )}
              <p className="sidebar-copy">Your next destination is ready. Tap Guide to learn more about the space before you arrive.</p>
              <button
                id="sidebar-open-guide-btn"
                type="button"
                className="outline-button"
                onClick={() => setActiveTab('guide')}
              >
                Open guide <ArrowRight data-icon="inline-end" />
              </button>
              <div className="tip-card">
                <Info />
                <div>
                  <strong>A gentle reminder</strong>
                  <p>Keep your phone on silent in meditation spaces.</p>
                </div>
              </div>
            </aside>
          </div>
        </>
      )}

      {/* Add Stop Modal (Visitor view) */}
      {showAddStop && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowAddStop(false)
          }}
        >
          <section className="add-stop-modal" role="dialog" aria-modal="true" aria-labelledby="add-stop-title">
            <div className="add-stop-modal-header">
              <div>
                <p className="section-kicker">PILGRIM TIMELINE</p>
                <h2 id="add-stop-title" className="add-stop-modal-title">Add a Destination</h2>
              </div>
              <button
                id="close-add-stop-modal"
                className="modal-close-btn"
                type="button"
                onClick={() => setShowAddStop(false)}
                aria-label="Close add destination modal"
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <div className="available-destination-section">
              <div className="add-stop-section-header">
                <p className="section-kicker">CONSECRATED &amp; SACRED SPACES</p>
                <span className="add-stop-count-pill">{destinationsList.length} places available</span>
              </div>
              <p className="picker-copy">Choose an existing space to add to your daily itinerary:</p>
              <div className="destination-picker" aria-label="Available destinations list">
                {destinationsList.map((destination) => {
                  const alreadyAdded = plannerQueue.includes(destination.id)
                  const Icon = ICON_MAP[destination.iconName] || MapPin
                  return (
                    <article className="destination-option" key={destination.id}>
                      <div className={`place-icon ${destination.tone}`}>
                        <Icon />
                      </div>
                      <div className="destination-option-copy">
                        <strong className="destination-option-title">{destination.title}</strong>
                        <span className="destination-option-meta">
                          {destination.type} · {destination.duration}
                          {liveWalkMap[destination.id] && (
                            <span className="destination-walk-pill">
                              · {liveWalkMap[destination.id].walkTimeFormatted}
                            </span>
                          )}
                        </span>
                      </div>
                      <button
                        id={`add-stop-picker-${destination.id}`}
                        type="button"
                        className="destination-add-button"
                        onClick={() => addDestinationToQueue(destination)}
                        title={alreadyAdded ? `Add another visit to ${destination.title}` : `Add ${destination.title} to route`}
                        aria-label={alreadyAdded ? `Add another visit to ${destination.title}` : `Add ${destination.title}`}
                      >
                        <Plus style={{ width: '15px', height: '15px' }} />
                      </button>
                    </article>
                  )
                })}
              </div>
            </div>

            <div className="custom-stop-divider">
              <span className="custom-stop-divider-text">OR CREATE A PERSONAL STOP</span>
            </div>

            <div className="custom-stop-fields">
              <div className="custom-stop-field-group">
                <label htmlFor="custom-stop-title-input">
                  Place Name <span className="field-required">*</span>
                </label>
                <input
                  id="custom-stop-title-input"
                  autoFocus
                  className="custom-stop-input"
                  value={customTitle}
                  onChange={(event) => setCustomTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && customTitle.trim()) {
                      event.preventDefault()
                      addCustomDestination()
                    }
                  }}
                  placeholder="e.g. Lotus Pond, Quiet Grove, Spanda Pavilion"
                />
              </div>

              <div className="custom-stop-field-group">
                <label htmlFor="custom-stop-type-input">
                  Space Type or Activity
                </label>
                <input
                  id="custom-stop-type-input"
                  className="custom-stop-input"
                  value={customType}
                  onChange={(event) => setCustomType(event.target.value)}
                  placeholder="e.g. Contemplative walk, Rest area, Reading pavilion"
                />
              </div>

              <div className="time-fields">
                <div className="custom-stop-field-group">
                  <label htmlFor="custom-stop-duration-input">
                    Suggested Duration
                  </label>
                  <input
                    id="custom-stop-duration-input"
                    className="custom-stop-input"
                    value={customDuration}
                    onChange={(event) => setCustomDuration(event.target.value)}
                    placeholder="e.g. 30 min, 45 min"
                  />
                </div>
                <div className="custom-stop-field-group">
                  <label htmlFor="custom-stop-distance-input">
                    Walking Distance
                  </label>
                  <input
                    id="custom-stop-distance-input"
                    className="custom-stop-input"
                    value={customDistance}
                    onChange={(event) => setCustomDistance(event.target.value)}
                    placeholder="e.g. 5 min walk"
                  />
                </div>
              </div>

              <button
                id="submit-custom-destination-btn"
                className="submit-custom-stop-btn"
                type="button"
                onClick={addCustomDestination}
                disabled={!customTitle.trim()}
              >
                <Plus style={{ width: '16px', height: '16px' }} />
                <span>Add Custom Place to Itinerary</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Admin Add/Edit Destination Modal (With Operating Hours Manager) */}
      {destinationModalMode && (
        <div
          className="modal-overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDestinationModalMode(null)
          }}
        >
          <div className="admin-dialog" role="dialog" aria-modal="true" style={{ maxWidth: '640px' }}>
            <div className="editor-heading">
              <div>
                <p className="section-kicker">ADMIN PORTAL · FIRESTORE PERSISTENCE</p>
                <h2>{destinationModalMode === 'create' ? 'Add New Destination' : 'Edit Destination & Operating Hours'}</h2>
              </div>
              <button
                id="close-admin-modal-btn"
                type="button"
                className="icon-button"
                onClick={() => setDestinationModalMode(null)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveDestination} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="admin-form-group">
                <label htmlFor="form-title">Destination Name *</label>
                <input
                  id="form-title"
                  className="admin-form-input"
                  required
                  placeholder="e.g. Suryakund, Dhyanalinga"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label htmlFor="form-type">Category / Space Type</label>
                  <input
                    id="form-type"
                    className="admin-form-input"
                    placeholder="e.g. Meditation space, Water body"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                  />
                </div>
                <div className="admin-form-group">
                  <label htmlFor="form-time">Suggested Schedule Time</label>
                  <input
                    id="form-time"
                    className="admin-form-input"
                    placeholder="e.g. 10:00 AM"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label htmlFor="form-duration">Suggested Duration</label>
                  <input
                    id="form-duration"
                    className="admin-form-input"
                    placeholder="e.g. 45 min"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                  />
                </div>
                <div className="admin-form-group">
                  <label htmlFor="form-distance">Walking Distance</label>
                  <input
                    id="form-distance"
                    className="admin-form-input"
                    placeholder="e.g. 8 min walk"
                    value={formDistance}
                    onChange={(e) => setFormDistance(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Tone Theme</label>
                  <div className="tone-picker">
                    {(['sage', 'terracotta', 'clay', 'gold'] as const).map((tone) => (
                      <button
                        key={tone}
                        type="button"
                        id={`tone-select-${tone}`}
                        className={`tone-picker-option ${formTone === tone ? 'active' : ''}`}
                        onClick={() => setFormTone(tone)}
                      >
                        {tone.charAt(0).toUpperCase() + tone.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="admin-form-group">
                  <label htmlFor="form-icon">Visual Icon</label>
                  <select
                    id="form-icon"
                    className="admin-form-select"
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value as IconName)}
                  >
                    <option value="Compass">Compass (Navigation)</option>
                    <option value="Sunrise">Sunrise (Meditation / Sacred)</option>
                    <option value="Sparkles">Sparkles (Quiet spaces / Nature)</option>
                    <option value="Utensils">Utensils (Dining / Cafe)</option>
                    <option value="MapPin">MapPin (Waypoints / Shrines)</option>
                  </select>
                </div>
              </div>

              <div className="admin-form-group">
                <label htmlFor="form-description">Description &amp; Visitor Advice</label>
                <textarea
                  id="form-description"
                  rows={2}
                  className="admin-form-textarea"
                  placeholder="Describe the space, atmosphere, dress code, silence guidelines..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="form-priority">Scheduling Priority (for Suggest Rhythm algorithm)</label>
                <select
                  id="form-priority"
                  className="admin-form-select"
                  value={formPriority}
                  onChange={(e) => setFormPriority(Number(e.target.value))}
                >
                  <option value={5}>★ 5 — Essential Anchor (Highest Priority, repeats daily like Dhyanalinga)</option>
                  <option value={4}>★ 4 — High Priority (Sacred spaces &amp; lunch like Isha Café, Alayam)</option>
                  <option value={3}>★ 3 — Recommended (Highlight spaces, e.g. Surya Kund, Welcome Centre)</option>
                  <option value={2}>★ 2 — Contemplative / Trails (Nature walks, quiet gardens)</option>
                  <option value={1}>★ 1 — Flexible / Optional stop</option>
                </select>
                <span style={{ fontSize: '11px', color: '#7a8c80', marginTop: '2px' }}>
                  Higher priority destinations are scheduled first and repeat across multi-day itineraries.
                </span>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label htmlFor="form-latitude">Latitude (GPS)</label>
                  <input
                    id="form-latitude"
                    type="number"
                    step="any"
                    className="admin-form-input"
                    placeholder="e.g. 10.978079"
                    value={formLatitude}
                    onChange={(e) => setFormLatitude(e.target.value)}
                  />
                </div>
                <div className="admin-form-group">
                  <label htmlFor="form-longitude">Longitude (GPS)</label>
                  <input
                    id="form-longitude"
                    type="number"
                    step="any"
                    className="admin-form-input"
                    placeholder="e.g. 76.735264"
                    value={formLongitude}
                    onChange={(e) => setFormLongitude(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label htmlFor="form-maps-url">Google Maps URL</label>
                <input
                  id="form-maps-url"
                  type="url"
                  className="admin-form-input"
                  placeholder="e.g. https://maps.google.com/?q=10.978079,76.735264"
                  value={formGoogleMapsUrl}
                  onChange={(e) => setFormGoogleMapsUrl(e.target.value)}
                />
                <span style={{ fontSize: '11px', color: '#7a8c80', marginTop: '2px' }}>
                  Recorded in PostgreSQL. Leave blank to auto-generate a Google Maps navigation link from the coordinates.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '2px 0' }}>
                <input
                  id="form-add-to-route"
                  type="checkbox"
                  checked={formAddToRoute}
                  onChange={(e) => setFormAddToRoute(e.target.checked)}
                />
                <label htmlFor="form-add-to-route" style={{ fontSize: '12px', color: '#4a5c51', cursor: 'pointer' }}>
                  Include in the active visitor day route
                </label>
              </div>

              {/* OPERATING HOURS (Availability Slots Multi-Row Manager) */}
              <div className="availability-section">
                <div className="availability-header">
                  <div>
                    <h4>Operating Hours &amp; Sessions</h4>
                    <span>Multiple daily opening/closing windows with recurrence &amp; status</span>
                  </div>
                  <span className="badge-pill" style={{ background: '#edf4ee', borderColor: '#c4dac9', color: '#2b503b' }}>
                    Daily Recurrence
                  </span>
                </div>

                {/* Existing configured slots */}
                <div className="availability-list" aria-label="Operating slots list">
                  {formSlots.map((slot) => {
                    const statusInfo = STATUS_LABELS[slot.status] || STATUS_LABELS.open

                    return (
                      <div key={slot.id} className="availability-item-card">
                        <div className="availability-times">
                          <Clock3 style={{ width: '13px', height: '13px', color: '#385b4a' }} />
                          <span>{slot.startTime} – {slot.endTime}</span>
                        </div>
                        <div className="availability-label">
                          <strong>{slot.label}</strong>
                        </div>
                        <span className={`status-badge ${statusInfo.class}`}>
                          {statusInfo.label}
                        </span>
                        <button
                          id={`del-slot-${slot.id}`}
                          type="button"
                          className="btn-del-slot"
                          title="Remove time slot"
                          onClick={() => handleRemoveSlotFromForm(slot.id)}
                        >
                          <Trash2 style={{ width: '13px', height: '13px' }} />
                        </button>
                      </div>
                    )
                  })}
                  {formSlots.length === 0 && (
                    <p style={{ fontSize: '12px', color: '#8b9c91', textAlign: 'center', padding: '12px 0' }}>
                      No operating time slots added yet. Use the form below to add daily sessions.
                    </p>
                  )}
                </div>

                {/* Add new time slot row */}
                <div className="availability-add-box">
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#3b5545' }}>+ Add Operating Time Window</span>
                  <div className="availability-add-inputs">
                    <div>
                      <label style={{ fontSize: '10px', color: '#6a7d71', display: 'block', marginBottom: '3px' }}>Start Time</label>
                      <input
                        id="new-slot-start"
                        type="time"
                        className="admin-form-input"
                        style={{ padding: '6px 8px', fontSize: '12px' }}
                        value={newSlotStart}
                        onChange={(e) => setNewSlotStart(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: '#6a7d71', display: 'block', marginBottom: '3px' }}>End Time</label>
                      <input
                        id="new-slot-end"
                        type="time"
                        className="admin-form-input"
                        style={{ padding: '6px 8px', fontSize: '12px' }}
                        value={newSlotEnd}
                        onChange={(e) => setNewSlotEnd(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: '#6a7d71', display: 'block', marginBottom: '3px' }}>Status</label>
                      <select
                        id="new-slot-status"
                        className="admin-form-select"
                        style={{ padding: '6px 8px', fontSize: '12px' }}
                        value={newSlotStatus}
                        onChange={(e) => setNewSlotStatus(e.target.value as AvailabilityStatus)}
                      >
                        <option value="open">Open Hours</option>
                        <option value="silent_period">Silent Meditation</option>
                        <option value="exclusive_program">Special Program</option>
                        <option value="closed">Closed / Cleaning</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#6a7d71', display: 'block', marginBottom: '3px' }}>Session / Activity Label</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        id="new-slot-label"
                        type="text"
                        className="admin-form-input"
                        style={{ padding: '6px 8px', fontSize: '12px', flex: 1 }}
                        placeholder="e.g. Nadha Aradhana, Lunch Service, Silent Sitting..."
                        value={newSlotLabel}
                        onChange={(e) => setNewSlotLabel(e.target.value)}
                      />
                      <button
                        id="add-slot-btn"
                        type="button"
                        className="btn-add-slot"
                        onClick={handleAddSlotToForm}
                      >
                        <Plus style={{ width: '12px', height: '12px' }} /> Add Slot
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  id="cancel-admin-form-btn"
                  type="button"
                  className="btn-secondary"
                  onClick={() => setDestinationModalMode(null)}
                >
                  Cancel
                </button>
                <button id="save-destination-submit-btn" type="submit" className="btn-primary">
                  {destinationModalMode === 'create' ? 'Create Destination & Slots' : 'Save Changes & Sync to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {destinationToDelete && (
        <div
          className="modal-overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDestinationToDelete(null)
          }}
        >
          <div className="confirm-dialog" role="dialog" aria-modal="true">
            <div className="editor-heading">
              <div>
                <p className="section-kicker" style={{ color: '#bd4a36' }}>CONFIRM REMOVAL</p>
                <h3>Delete Destination?</h3>
              </div>
              <button
                id="close-delete-modal-btn"
                type="button"
                className="icon-button"
                onClick={() => setDestinationToDelete(null)}
              >
                ×
              </button>
            </div>
            <p>
              Are you sure you want to permanently remove <strong>&ldquo;{destinationToDelete.title}&rdquo;</strong> and all of its associated operating hours from the database? It will also be removed from any active visitor schedules.
            </p>
            <div className="confirm-dialog-actions">
              <button
                id="cancel-delete-btn"
                type="button"
                className="btn-secondary"
                onClick={() => setDestinationToDelete(null)}
              >
                Keep Destination
              </button>
              <button
                id="confirm-delete-btn"
                type="button"
                className="btn-danger"
                onClick={handleDeleteDestination}
              >
                <Trash2 style={{ width: '14px', height: '14px' }} /> Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="footer-note">
        <span>Made for a slower, fuller day</span>
        <span className="footer-leaf">◒</span>
      </footer>
    </main>
  )
}

function GuidePanel({
  destination,
  slots,
  liveDistance,
  onVisited,
}: {
  destination: Destination
  slots: DestinationAvailability[]
  liveDistance?: CalculatedDistanceResult
  onVisited: () => void
}) {
  const Icon = ICON_MAP[destination.iconName] || MapPin

  return (
    <div className="guide-panel">
      <div className={`guide-hero ${destination.tone}`}>
        <div className="large-place-icon"><Icon /></div>
        <span className="guide-eyebrow">NEXT DESTINATION · {destination.time}</span>
        <h2>{destination.title}</h2>
        <p>{destination.type}</p>
      </div>
      <div className="guide-details">
        <div className="detail-row">
          <span>Distance from you</span>
          {liveDistance ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong style={{ color: '#1e4f2d', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Footprints /> {liveDistance.walkTimeFormatted}
              </strong>
              <span style={{ fontSize: '12px', color: '#567360' }}>
                ({liveDistance.distanceFormatted} via OSM)
              </span>
            </div>
          ) : (
            <strong><Footprints /> {destination.distance}</strong>
          )}
        </div>
        <div className="detail-row">
          <span>Suggested time</span>
          <strong><Clock3 /> {destination.duration}</strong>
        </div>
        {destination.latitude != null && destination.longitude != null && (
          <div className="detail-row">
            <span>Coordinates (GPS)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <strong style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {destination.latitude.toFixed(6)}°, {destination.longitude.toFixed(6)}°
              </strong>
              {destination.googleMapsUrl && (
                <a
                  href={destination.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="maps-pill-link"
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                >
                  <MapPin className="maps-icon" />
                  Google Maps
                  <ExternalLink className="maps-ext" />
                </a>
              )}
            </div>
          </div>
        )}
        <div className="detail-description">
          <p className="section-kicker">ABOUT THIS PLACE</p>
          <p>{destination.description}</p>
        </div>

        {/* Operating Hours & Sessions for Visitor Guide */}
        {slots.length > 0 && (
          <div style={{ margin: '14px 0 24px', borderTop: '1px solid #edf0eb', paddingTop: '16px' }}>
            <p className="section-kicker">TODAY&apos;S SCHEDULE &amp; OPERATING SESSIONS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              {slots.map((s) => {
                const statusInfo = STATUS_LABELS[s.status] || STATUS_LABELS.open
                return (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px',
                      background: '#f8fbf6',
                      border: '1px solid #e2ece0',
                      padding: '8px 12px',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock3 style={{ width: '13px', height: '13px', color: '#385b4a' }} />
                      <strong style={{ color: '#274435' }}>{s.startTime} – {s.endTime}</strong>
                      <span style={{ color: '#52695c' }}>{s.label}</span>
                    </div>
                    <span className={`status-badge ${statusInfo.class}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div>
          <button id="guide-mark-visited-btn" type="button" className="primary-button" style={{ width: '100%' }} onClick={onVisited}>
            Mark {destination.title} as visited <Check data-icon="inline-end" />
          </button>
        </div>
      </div>
    </div>
  )
}
