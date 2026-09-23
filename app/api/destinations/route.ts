import { NextRequest, NextResponse } from 'next/server'
import {
  getDestinationsFromDb,
  upsertDestinationInDb,
  deleteDestinationFromDb,
} from '@/lib/db/postgres'
import type { Destination } from '@/lib/types'

export async function GET() {
  try {
    const destinations = await getDestinationsFromDb()
    return NextResponse.json({ success: true, data: destinations })
  } catch (error) {
    console.error('Error fetching destinations from PostgreSQL:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown database error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const destination = (await req.json()) as Destination
    if (!destination || !destination.title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }

    await upsertDestinationInDb(destination)
    return NextResponse.json({ success: true, data: destination })
  } catch (error) {
    console.error('Error saving destination to PostgreSQL:', error)
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
      return NextResponse.json({ success: false, error: 'Destination id is required' }, { status: 400 })
    }

    await deleteDestinationFromDb(id)
    return NextResponse.json({ success: true, message: `Destination ${id} deleted` })
  } catch (error) {
    console.error('Error deleting destination from PostgreSQL:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown database error' },
      { status: 500 }
    )
  }
}
