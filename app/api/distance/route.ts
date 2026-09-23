// app/api/distance/route.ts
import { NextRequest, NextResponse } from 'next/server'

interface DistanceRequestDestination {
  id: string
  latitude: number
  longitude: number
}

interface DistanceRequest {
  userLat: number
  userLng: number
  destinations: DistanceRequestDestination[]
}

export interface DistanceResult {
  destinationId: string
  distanceMeters: number
  durationSeconds: number
  walkTimeFormatted: string
  distanceFormatted: string
  source: 'osrm' | 'haversine'
}

/**
 * Calculates Great-Circle distance using Haversine formula (accurate fallback in meters)
 */
function calculateHaversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

function formatDistance(meters: number): string {
  if (meters < 25) return 'At destination'
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

function formatWalkTime(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  if (minutes <= 1) return '1 min walk'
  if (minutes < 60) return `${minutes} min walk`
  const hrs = Math.floor(minutes / 60)
  const remainingMins = minutes % 60
  if (remainingMins === 0) return `${hrs} hr walk`
  return `${hrs} hr ${remainingMins} min walk`
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DistanceRequest
    const { userLat, userLng, destinations } = body

    if (
      typeof userLat !== 'number' ||
      typeof userLng !== 'number' ||
      !Array.isArray(destinations) ||
      destinations.length === 0
    ) {
      return NextResponse.json(
        { error: 'Valid userLat, userLng, and destinations array required' },
        { status: 400 }
      )
    }

    // Prepare coordinate query for OpenStreetMap OSRM public table API
    // Format: userLng,userLat;dest1Lng,dest1Lat;dest2Lng,dest2Lat...
    // OSRM table service returns duration and distance matrices from source (index 0) to destinations (indices 1..N)
    const validDests = destinations.filter(
      (d) =>
        d &&
        typeof d.latitude === 'number' &&
        !isNaN(d.latitude) &&
        typeof d.longitude === 'number' &&
        !isNaN(d.longitude)
    )

    if (validDests.length === 0) {
      return NextResponse.json({ results: [] })
    }

    const coordinatesList = [
      `${userLng.toFixed(6)},${userLat.toFixed(6)}`,
      ...validDests.map((d) => `${d.longitude.toFixed(6)},${d.latitude.toFixed(6)}`),
    ].join(';')

    // Source is index 0 (user location). Destinations are 1 through validDests.length
    const destIndices = validDests.map((_, idx) => idx + 1).join(';')
    const osrmUrl = `https://router.project-osrm.org/table/v1/walking/${coordinatesList}?sources=0&destinations=${destIndices}&annotations=duration,distance`

    let osrmData: {
      code?: string
      distances?: number[][]
      durations?: number[][]
    } | null = null

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000)

      const osrmResponse = await fetch(osrmUrl, {
        headers: {
          'User-Agent': 'StillpointSpiritualCentre/1.0 (Isha Asham Wayfinding)',
        },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (osrmResponse.ok) {
        osrmData = await osrmResponse.json()
      }
    } catch {
      // Gracefully fall back to local high-precision Haversine walking calculation
      osrmData = null
    }

    const results: DistanceResult[] = validDests.map((dest, idx) => {
      let distanceMeters: number
      let durationSeconds: number
      let source: 'osrm' | 'haversine' = 'haversine'

      // Check if OSRM returned valid numbers
      const osrmDist = osrmData?.distances?.[0]?.[idx]
      const osrmDur = osrmData?.durations?.[0]?.[idx]

      if (
        osrmDist !== undefined &&
        osrmDist !== null &&
        !isNaN(osrmDist)
      ) {
        distanceMeters = Math.round(osrmDist)
        // Pedestrian walking pace for ashram pathways: 4.5 km/h = 1.25 m/s (~75 meters/min)
        durationSeconds = Math.round(distanceMeters / 1.25)
        source = 'osrm'
      } else {
        // Fallback: Haversine distance with standard pedestrian walking speed (4.5 km/h = 1.25 m/s)
        // With 1.15 winding trail factor for ashram pathway contours
        const straightMeters = calculateHaversineMeters(
          userLat,
          userLng,
          dest.latitude,
          dest.longitude
        )
        distanceMeters = Math.round(straightMeters * 1.15)
        durationSeconds = Math.round(distanceMeters / 1.25)
      }

      const formattedDist = formatDistance(distanceMeters)
      const formattedWalk = formatWalkTime(durationSeconds)

      return {
        destinationId: dest.id,
        distanceMeters,
        durationSeconds,
        walkTimeFormatted: formattedWalk,
        distanceFormatted: formattedDist,
        source,
      }
    })

    return NextResponse.json({
      success: true,
      userLocation: { lat: userLat, lng: userLng },
      results,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
