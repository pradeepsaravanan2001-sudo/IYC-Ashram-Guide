import fs from 'fs'
import path from 'path'
import { PGlite } from '@electric-sql/pglite'
import type { Destination, DestinationAvailability } from '../types'

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
  // Welcome Centre (id: '1')
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

  // Dhyanalinga (id: '2')
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

  // Adiyogi Alayam (id: '3')
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

  // Isha Café (id: '4')
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

  // Biksha Hall (id: '5')
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

  // Surya Kund (id: '101')
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

  // Vanashree Garden (id: '102')
  {
    id: 'avail-102-1',
    destinationId: '102',
    startTime: '06:00',
    endTime: '18:30',
    label: 'Daylight Walking Trail',
    status: 'open',
    recurrence: 'daily',
  },

  // Spanda Hall (id: '103')
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

  // Sadhguru Sannidhi (id: '104')
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

  // Campus-wide Night Silence (id: 'night-silence')
  {
    id: 'avail-night-silence-1',
    destinationId: 'night-silence',
    startTime: '21:30',
    endTime: '04:30',
    label: 'Night Time Silence (9:30 PM — 4:30 AM)',
    status: 'silent_period',
    recurrence: 'daily',
  },
]

// Global singleton for Next.js hot module reloads
interface GlobalPostgres {
  pglite?: PGlite
  initPromise?: Promise<PGlite>
}

const globalForPostgres = globalThis as unknown as GlobalPostgres

async function createPgliteInstance(): Promise<PGlite> {
  const dataDir = path.join(process.cwd(), 'data', 'postgres')

  if (fs.existsSync(dataDir)) {
    const pidFile = path.join(dataDir, 'postmaster.pid')
    if (fs.existsSync(pidFile)) {
      try {
        fs.unlinkSync(pidFile)
      } catch {
        // ignore unlink error
      }
    }

    try {
      const client = new PGlite(dataDir)
      await client.waitReady
      return client
    } catch (err) {
      console.warn('Existing PGlite cluster in dataDir could not be opened, rebuilding fresh cluster...', err)
      try {
        fs.rmSync(dataDir, { recursive: true, force: true })
      } catch (rmErr) {
        console.warn('Failed to remove dataDir:', rmErr)
      }
    }
  }

  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    const client = new PGlite(dataDir)
    await client.waitReady
    return client
  } catch (fsErr) {
    console.warn('Filesystem PGlite failed, falling back to in-memory store:', fsErr)
    const client = new PGlite()
    await client.waitReady
    return client
  }
}

export async function getPostgresClient(): Promise<PGlite> {
  if (globalForPostgres.pglite) {
    return globalForPostgres.pglite
  }

  if (!globalForPostgres.initPromise) {
    globalForPostgres.initPromise = (async () => {
      try {
        const client = await createPgliteInstance()
        await initializePostgresDatabase(client)
        globalForPostgres.pglite = client
        return client
      } catch (err) {
        console.error('Failed to initialize persistent PGlite, falling back to in-memory instance:', err)
        try {
          const inMem = new PGlite()
          await inMem.waitReady
          await initializePostgresDatabase(inMem)
          globalForPostgres.pglite = inMem
          return inMem
        } catch (fatalErr) {
          globalForPostgres.initPromise = undefined
          throw fatalErr
        }
      }
    })()
  }

  return globalForPostgres.initPromise
}

async function initializePostgresDatabase(client: PGlite) {
  // 1. Create tables using exec for multi-statement DDL
  await client.exec(`
    CREATE TABLE IF NOT EXISTS destinations (
      id VARCHAR(100) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      type VARCHAR(100) NOT NULL,
      time VARCHAR(50) DEFAULT 'Next',
      duration VARCHAR(50) DEFAULT '30 min',
      distance VARCHAR(50) DEFAULT '5 min walk',
      description TEXT NOT NULL DEFAULT '',
      tone VARCHAR(50) NOT NULL DEFAULT 'sage',
      icon_name VARCHAR(50) NOT NULL DEFAULT 'Compass',
      priority INTEGER NOT NULL DEFAULT 3,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      google_maps_url TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_in_route BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE destinations ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 3;
    ALTER TABLE destinations ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
    ALTER TABLE destinations ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
    ALTER TABLE destinations ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
    CREATE INDEX IF NOT EXISTS idx_destinations_priority ON destinations (priority DESC);
    CREATE INDEX IF NOT EXISTS idx_destinations_order ON destinations (display_order ASC);
    CREATE INDEX IF NOT EXISTS idx_destinations_tone ON destinations (tone);

    CREATE TABLE IF NOT EXISTS destination_availabilities (
      id VARCHAR(100) PRIMARY KEY,
      destination_id VARCHAR(100) NOT NULL REFERENCES destinations(id) ON DELETE CASCADE ON UPDATE CASCADE,
      start_time VARCHAR(10) NOT NULL,
      end_time VARCHAR(10) NOT NULL,
      label VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'open',
      recurrence VARCHAR(50) NOT NULL DEFAULT 'daily',
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_availabilities_destination ON destination_availabilities (destination_id);
    CREATE INDEX IF NOT EXISTS idx_availabilities_start_time ON destination_availabilities (start_time ASC);

    INSERT INTO destinations (id, title, type, time, duration, distance, description, tone, icon_name, priority, latitude, longitude, google_maps_url, display_order, is_in_route)
    VALUES ('5', 'Biksha Hall', 'Ashram dining', '10:00 AM', '45 min', '6 min walk', 'Traditional ashram dining hall serving nourishing yogic vegetarian brunch and dinner in mindful silence.', 'clay', 'Utensils', 4, 10.97715, 76.73680, 'https://maps.google.com/?q=10.977150,76.736800', 5, true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO destination_availabilities (id, destination_id, start_time, end_time, label, status, recurrence)
    VALUES ('avail-5-1', '5', '10:00', '11:30', 'Morning Yogic Brunch (in silence)', 'open', 'daily')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO destination_availabilities (id, destination_id, start_time, end_time, label, status, recurrence)
    VALUES ('avail-5-2', '5', '18:45', '20:15', 'Evening Yogic Dinner (in silence)', 'open', 'daily')
    ON CONFLICT (id) DO NOTHING;
  `)

  // 2. Check if seeding is needed
  const countCheck = await client.query<{ count: string }>('SELECT count(*) AS count FROM destinations;')
  const count = parseInt(countCheck.rows[0]?.count || '0', 10)

  if (count === 0) {
    await seedPostgresDatabase(client)
  }
}

export async function seedPostgresDatabase(client?: PGlite): Promise<void> {
  const pg = client || (await getPostgresClient())

  // Ensure priority, latitude, longitude, and google_maps_url columns exist
  await pg.exec(`
    ALTER TABLE destinations ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 3;
    ALTER TABLE destinations ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
    ALTER TABLE destinations ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
    ALTER TABLE destinations ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
  `)

  await pg.query('BEGIN;')
  try {
    // Clear existing
    await pg.query('DELETE FROM destination_availabilities;')
    await pg.query('DELETE FROM destinations;')

    // Seed destinations
    for (const d of initialDestinationsData) {
      await pg.query(
        `INSERT INTO destinations (id, title, type, time, duration, distance, description, tone, icon_name, priority, latitude, longitude, google_maps_url, display_order, is_in_route)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15);`,
        [
          d.id,
          d.title,
          d.type,
          d.time,
          d.duration,
          d.distance,
          d.description,
          d.tone,
          d.iconName,
          d.priority ?? 3,
          d.latitude ?? null,
          d.longitude ?? null,
          d.googleMapsUrl ?? null,
          d.order,
          d.isInRoute ?? false,
        ]
      )
    }

    // Seed availabilities
    for (const a of initialAvailabilityData) {
      await pg.query(
        `INSERT INTO destination_availabilities (id, destination_id, start_time, end_time, label, status, recurrence)
         VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [a.id, a.destinationId, a.startTime, a.endTime, a.label, a.status, a.recurrence]
      )
    }

    await pg.query('COMMIT;')
    console.log('PostgreSQL seeded successfully!')
  } catch (err) {
    await pg.query('ROLLBACK;')
    console.error('PostgreSQL seed failed:', err)
    throw err
  }
}

// Destination query operations
export async function getDestinationsFromDb(): Promise<Destination[]> {
  const pg = await getPostgresClient()
  const res = await pg.query<{
    id: string
    title: string
    type: string
    time: string
    duration: string
    distance: string
    description: string
    tone: string
    icon_name: string
    priority: number | null
    latitude: number | null
    longitude: number | null
    google_maps_url: string | null
    display_order: number
    is_in_route: boolean
  }>('SELECT * FROM destinations ORDER BY display_order ASC, title ASC;')

  return res.rows.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    time: r.time,
    duration: r.duration,
    distance: r.distance,
    description: r.description,
    tone: r.tone as Destination['tone'],
    iconName: r.icon_name as Destination['iconName'],
    priority: r.priority !== null && r.priority !== undefined ? Number(r.priority) : 3,
    latitude: r.latitude !== null && r.latitude !== undefined ? Number(r.latitude) : null,
    longitude: r.longitude !== null && r.longitude !== undefined ? Number(r.longitude) : null,
    googleMapsUrl: r.google_maps_url || null,
    order: r.display_order,
    isInRoute: r.is_in_route,
  }))
}

export async function upsertDestinationInDb(destination: Destination): Promise<void> {
  const pg = await getPostgresClient()
  const mapsUrl =
    destination.googleMapsUrl ||
    (destination.latitude != null && destination.longitude != null
      ? `https://maps.google.com/?q=${destination.latitude},${destination.longitude}`
      : null)

  await pg.query(
    `INSERT INTO destinations (id, title, type, time, duration, distance, description, tone, icon_name, priority, latitude, longitude, google_maps_url, display_order, is_in_route, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP)
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       type = EXCLUDED.type,
       time = EXCLUDED.time,
       duration = EXCLUDED.duration,
       distance = EXCLUDED.distance,
       description = EXCLUDED.description,
       tone = EXCLUDED.tone,
       icon_name = EXCLUDED.icon_name,
       priority = EXCLUDED.priority,
       latitude = EXCLUDED.latitude,
       longitude = EXCLUDED.longitude,
       google_maps_url = EXCLUDED.google_maps_url,
       display_order = EXCLUDED.display_order,
       is_in_route = EXCLUDED.is_in_route,
       updated_at = CURRENT_TIMESTAMP;`,
    [
      destination.id,
      destination.title,
      destination.type,
      destination.time,
      destination.duration,
      destination.distance,
      destination.description,
      destination.tone,
      destination.iconName,
      destination.priority ?? 3,
      destination.latitude ?? null,
      destination.longitude ?? null,
      mapsUrl,
      destination.order,
      destination.isInRoute ?? false,
    ]
  )
}

export async function deleteDestinationFromDb(id: string): Promise<void> {
  const pg = await getPostgresClient()
  await pg.query('DELETE FROM destinations WHERE id = $1;', [id])
}

// Availability slots operations
export async function getAvailabilityFromDb(destinationId?: string): Promise<DestinationAvailability[]> {
  const pg = await getPostgresClient()
  let sql = 'SELECT * FROM destination_availabilities ORDER BY start_time ASC;'
  let params: unknown[] = []

  if (destinationId) {
    sql = 'SELECT * FROM destination_availabilities WHERE destination_id = $1 ORDER BY start_time ASC;'
    params = [destinationId]
  }

  const res = await pg.query<{
    id: string
    destination_id: string
    start_time: string
    end_time: string
    label: string
    status: string
    recurrence: string
  }>(sql, params)

  return res.rows.map((r) => ({
    id: r.id,
    destinationId: r.destination_id,
    startTime: r.start_time,
    endTime: r.end_time,
    label: r.label,
    status: r.status as DestinationAvailability['status'],
    recurrence: (r.recurrence as DestinationAvailability['recurrence']) || 'daily',
  }))
}

export async function upsertAvailabilitySlotInDb(slot: DestinationAvailability): Promise<void> {
  const pg = await getPostgresClient()
  await pg.query(
    `INSERT INTO destination_availabilities (id, destination_id, start_time, end_time, label, status, recurrence, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
     ON CONFLICT (id) DO UPDATE SET
       destination_id = EXCLUDED.destination_id,
       start_time = EXCLUDED.start_time,
       end_time = EXCLUDED.end_time,
       label = EXCLUDED.label,
       status = EXCLUDED.status,
       recurrence = EXCLUDED.recurrence,
       updated_at = CURRENT_TIMESTAMP;`,
    [slot.id, slot.destinationId, slot.startTime, slot.endTime, slot.label, slot.status, slot.recurrence || 'daily']
  )
}

export async function deleteAvailabilitySlotFromDb(id: string): Promise<void> {
  const pg = await getPostgresClient()
  await pg.query('DELETE FROM destination_availabilities WHERE id = $1;', [id])
}

export async function syncDestinationAvailabilityInDb(
  destinationId: string,
  slots: DestinationAvailability[]
): Promise<void> {
  const pg = await getPostgresClient()
  await pg.query('BEGIN;')
  try {
    await pg.query('DELETE FROM destination_availabilities WHERE destination_id = $1;', [destinationId])
    for (const slot of slots) {
      await pg.query(
        `INSERT INTO destination_availabilities (id, destination_id, start_time, end_time, label, status, recurrence)
         VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [slot.id, destinationId, slot.startTime, slot.endTime, slot.label, slot.status, slot.recurrence || 'daily']
      )
    }
    await pg.query('COMMIT;')
  } catch (err) {
    await pg.query('ROLLBACK;')
    throw err
  }
}

// Raw SQL query executor for Admin PostgreSQL Console
export async function executeRawPostgresQuery(queryText: string, params: unknown[] = []) {
  const pg = await getPostgresClient()
  const start = Date.now()
  const result = await pg.query(queryText, params)
  const executionTimeMs = Date.now() - start
  return {
    rows: result.rows,
    rowCount: result.rows?.length ?? 0,
    fields: result.fields?.map((f) => ({ name: f.name, dataTypeID: f.dataTypeID })) || [],
    executionTimeMs,
  }
}

// Get PostgreSQL schema inspection & stats
export async function getPostgresStats() {
  const pg = await getPostgresClient()
  const destCount = await pg.query<{ count: string }>('SELECT count(*) AS count FROM destinations;')
  const availCount = await pg.query<{ count: string }>('SELECT count(*) AS count FROM destination_availabilities;')
  const tables = await pg.query<{ table_name: string }>(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
  )

  return {
    engine: 'PostgreSQL 16 (Relational Engine via PGlite)',
    destinationsCount: parseInt(destCount.rows[0]?.count || '0', 10),
    availabilitiesCount: parseInt(availCount.rows[0]?.count || '0', 10),
    tables: tables.rows.map((t) => t.table_name),
    status: 'connected',
    storagePath: 'data/postgres',
  }
}
