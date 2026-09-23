import { NextResponse } from 'next/server'
import { seedPostgresDatabase } from '@/lib/db/postgres'

export async function POST() {
  try {
    await seedPostgresDatabase()
    return NextResponse.json({
      success: true,
      message: 'PostgreSQL database reset and re-seeded with initial sacred spaces and daily operating hours.',
    })
  } catch (error) {
    console.error('Error seeding PostgreSQL:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Seed failed' },
      { status: 500 }
    )
  }
}
