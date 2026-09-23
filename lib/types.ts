export type DestinationTone = 'sage' | 'terracotta' | 'clay' | 'gold'
export type IconName = 'Compass' | 'Sunrise' | 'Sparkles' | 'Utensils' | 'MapPin'
export type AvailabilityStatus = 'open' | 'closed' | 'exclusive_program' | 'silent_period'

export interface Destination {
  id: string
  title: string
  type: string
  time: string
  duration: string
  distance: string
  description: string
  tone: DestinationTone
  iconName: IconName
  priority?: number
  latitude?: number | null
  longitude?: number | null
  googleMapsUrl?: string | null
  order: number
  isInRoute?: boolean
  createdAt?: number
  updatedAt?: number
}

export interface DestinationAvailability {
  id: string
  destinationId: string
  startTime: string // "06:00"
  endTime: string   // "08:30"
  label: string     // e.g. "Morning Meditation & Chanting"
  status: AvailabilityStatus
  recurrence: 'daily'
  createdAt?: number
  updatedAt?: number
}
