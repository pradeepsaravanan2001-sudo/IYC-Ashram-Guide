import { NextRequest, NextResponse } from 'next/server'
import { executeRawPostgresQuery, getPostgresStats, getPostgresClient } from '@/lib/db/postgres'

export async function GET() {
  try {
    const stats = await getPostgresStats()
    const pg = await getPostgresClient()

    // Query detailed schema information for destinations and destination_availabilities
    const columnsInfo = await pg.query<{
      table_name: string
      column_name: string
      data_type: string
      is_nullable: string
      column_default: string | null
    }>(`
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name IN ('destinations', 'destination_availabilities')
      ORDER BY table_name, ordinal_position;
    `)

    return NextResponse.json({
      success: true,
      stats,
      columns: columnsInfo.rows,
    })
  } catch (error) {
    console.error('Error fetching PostgreSQL schema stats:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Database error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const query = body?.query?.trim()

    if (!query) {
      return NextResponse.json({ success: false, error: 'Query string is required' }, { status: 400 })
    }

    const result = await executeRawPostgresQuery(query)
    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Error executing PostgreSQL query:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Database query execution failed',
      },
      { status: 400 }
    )
  }
}
