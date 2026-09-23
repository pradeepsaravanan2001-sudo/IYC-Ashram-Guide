import { NextRequest, NextResponse } from 'next/server'
import {
  getAvailabilityFromDb,
  upsertAvailabilitySlotInDb,
  deleteAvailabilitySlotFromDb,
  syncDestinationAvailabilityInDb,
} from '@/lib/db/postgres'
import type { DestinationAvailability } from '@/lib/types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const destinationId = searchParams.get('destinationId') || undefined
    const slots = await getAvailabilityFromDb(destinationId)
    return NextResponse.json({ success: true, data: slots })
  } catch (error) {
    console.error('Error fetching availability from PostgreSQL:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown database error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const slot = (await req.json()) as DestinationAvailability
    if (!slot || !slot.destinationId || !slot.startTime || !slot.endTime) {
      return NextResponse.json(
        { success: false, error: 'destinationId, startTime, and endTime are required' },
        { status: 400 }
      )
    }

    await upsertAvailabilitySlotInDb(slot)
    return NextResponse.json({ success: true, data: slot })
  } catch (error) {
    console.error('Error saving availability slot to PostgreSQL:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown database error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as { destinationId: string; slots: DestinationAvailability[] }
    if (!body || !body.destinationId || !Array.isArray(body.slots)) {
      return NextResponse.json(
        { success: false, error: 'destinationId and slots array are required' },
        { status: 400 }
      )
    }

    await syncDestinationAvailabilityInDb(body.destinationId, body.slots)
    return NextResponse.json({ success: true, count: body.slots.length })
  } catch (error) {
    console.error('Error syncing availability slots to PostgreSQL:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown database error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    let id = searchParams.get('id')

    if (!id) {
      const body = await req.json().catch(() => ({}))
      id = body.id
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Slot id is required' }, { status: 400 })
    }

    await deleteAvailabilitySlotFromDb(id)
    return NextResponse.json({ success: true, message: `Availability slot ${id} deleted` })
  } catch (error) {
    console.error('Error deleting availability slot from PostgreSQL:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown database error' },
      { status: 500 }
    )
  }
}
