-- ==========================================================
-- STILLPOINT SPIRITUAL CENTRE - POSTGRESQL DATA MODEL DDL
-- Compatible with PostgreSQL 14, 15, 16, 17, Cloud SQL, Neon, Supabase, RDS, PGlite
-- ==========================================================

-- 1. DESTINATIONS TABLE
-- Stores sacred spaces, halls, arrival pavilions, and gardens
CREATE TABLE IF NOT EXISTS destinations (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    time VARCHAR(50) DEFAULT 'Next',
    duration VARCHAR(50) DEFAULT '30 min',
    distance VARCHAR(50) DEFAULT '5 min walk',
    description TEXT NOT NULL DEFAULT '',
    tone VARCHAR(50) NOT NULL DEFAULT 'sage' CHECK (tone IN ('sage', 'terracotta', 'clay', 'gold')),
    icon_name VARCHAR(50) NOT NULL DEFAULT 'Compass' CHECK (icon_name IN ('Compass', 'Sunrise', 'Sparkles', 'Utensils', 'MapPin')),
    priority INTEGER NOT NULL DEFAULT 3,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    google_maps_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_in_route BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for ordering in itineraries and listings
CREATE INDEX IF NOT EXISTS idx_destinations_order ON destinations (display_order ASC);
CREATE INDEX IF NOT EXISTS idx_destinations_tone ON destinations (tone);

-- 2. DESTINATION AVAILABILITY / OPERATING SLOTS TABLE
-- Stores recurring daily time windows, session names, and status codes
CREATE TABLE IF NOT EXISTS destination_availabilities (
    id VARCHAR(100) PRIMARY KEY,
    destination_id VARCHAR(100) NOT NULL REFERENCES destinations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    start_time VARCHAR(10) NOT NULL, -- 24-hr format: "06:00"
    end_time VARCHAR(10) NOT NULL,   -- 24-hr format: "08:30"
    label VARCHAR(255) NOT NULL,     -- e.g. "Morning Silent Meditation"
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'exclusive_program', 'silent_period')),
    recurrence VARCHAR(50) NOT NULL DEFAULT 'daily',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning fast lookups by destination and time
CREATE INDEX IF NOT EXISTS idx_availabilities_destination ON destination_availabilities (destination_id);
CREATE INDEX IF NOT EXISTS idx_availabilities_start_time ON destination_availabilities (start_time ASC);
CREATE INDEX IF NOT EXISTS idx_availabilities_status ON destination_availabilities (status);

-- Comments for database documentation
COMMENT ON TABLE destinations IS 'Waypoints, sacred halls, dining spaces, and pavilions at Stillpoint Spiritual Centre';
COMMENT ON COLUMN destinations.tone IS 'Design palette token for visual identity: sage, terracotta, clay, gold';
COMMENT ON TABLE destination_availabilities IS 'Recurring daily operating windows and sacred session schedules per destination';
COMMENT ON COLUMN destination_availabilities.status IS 'Status code: open, silent_period, exclusive_program, or closed';
