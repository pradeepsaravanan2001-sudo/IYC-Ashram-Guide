-- ==========================================================
-- STILLPOINT SPIRITUAL CENTRE - COMPLETE POSTGRESQL SEED DATA
-- Import into any local or hosted PostgreSQL instance (psql, DBeaver, pgAdmin)
-- ==========================================================

-- 1. Insert Destinations (Sacred spaces, arrival centre, gardens, dining, observances)
INSERT INTO destinations (
    id, title, type, time, duration, distance, description,
    tone, icon_name, priority, latitude, longitude, google_maps_url,
    display_order, is_in_route
) VALUES
(
    '1',
    'Welcome Centre',
    'Arrival & orientation',
    '9:00 AM',
    '30 min',
    'You are here',
    'Collect your visitor pass, settle in, and get a gentle introduction to the centre.',
    'sage',
    'Compass',
    3,
    10.976540,
    76.737150,
    'https://maps.google.com/?q=10.976540,76.737150',
    1,
    true
),
(
    '2',
    'Dhyanalinga',
    'Meditation space',
    '9:45 AM',
    '45 min',
    '8 min walk',
    'A powerful space for meditation and inner wellbeing. Silence is observed inside.',
    'terracotta',
    'Sunrise',
    5,
    10.978079,
    76.735264,
    'https://maps.google.com/?q=10.978079,76.735264',
    2,
    true
),
(
    '3',
    'Adiyogi Alayam',
    'Sacred space',
    '11:00 AM',
    '45 min',
    '5 min walk',
    'Experience the stillness of this expansive meditation hall and its quiet surroundings.',
    'gold',
    'Sparkles',
    4,
    10.978598,
    76.737581,
    'https://maps.google.com/?q=10.978598,76.737581',
    3,
    true
),
(
    '4',
    'Isha Café',
    'Vegetarian lunch',
    '12:15 PM',
    '1 hr',
    '4 min walk',
    'Take a nourishing break with fresh, vegetarian food made for mindful eating.',
    'clay',
    'Utensils',
    4,
    10.976820,
    76.736340,
    'https://maps.google.com/?q=10.976820,76.736340',
    4,
    true
),
(
    '5',
    'Biksha Hall',
    'Ashram dining',
    '10:00 AM',
    '45 min',
    '6 min walk',
    'Traditional ashram dining hall serving nourishing yogic vegetarian brunch and dinner in mindful silence.',
    'clay',
    'Utensils',
    4,
    10.977150,
    76.736800,
    'https://maps.google.com/?q=10.977150,76.736800',
    5,
    true
),
(
    '101',
    'Surya Kund',
    'Water body',
    '1:30 PM',
    '30 min',
    '7 min walk',
    'A quiet place to pause beside the water and take in the open sky before your afternoon walk.',
    'gold',
    'Sunrise',
    3,
    10.977430,
    76.735820,
    'https://maps.google.com/?q=10.977430,76.735820',
    6,
    false
),
(
    '102',
    'Vanashree Garden',
    'Garden & nature',
    '2:15 PM',
    '45 min',
    '10 min walk',
    'A leafy walking trail for a slower contemplative moment between centres and pavilions.',
    'sage',
    'Sparkles',
    2,
    10.977780,
    76.734520,
    'https://maps.google.com/?q=10.977780,76.734520',
    7,
    false
),
(
    '103',
    'Spanda Hall',
    'Meditation space',
    '3:15 PM',
    '40 min',
    '6 min walk',
    'A spacious, serene hall configured for deep inner stillness and reflective quietude.',
    'terracotta',
    'Compass',
    3,
    10.979210,
    76.736050,
    'https://maps.google.com/?q=10.979210,76.736050',
    8,
    false
),
(
    '104',
    'Sadhguru Sannidhi',
    'Sacred space',
    '4:15 PM',
    '30 min',
    '12 min walk',
    'A contemplative space to sit, listen, and reconnect with clarity and intention.',
    'clay',
    'MapPin',
    3,
    10.972416,
    76.740602,
    'https://maps.google.com/?q=10.972416,76.740602',
    9,
    false
),
(
    'night-silence',
    'Night Time Silence',
    'Ashram observance',
    '9:30 PM — 4:30 AM',
    '7 hr',
    'Campus-wide',
    'Campus-wide silence is observed from 9:30 PM to 4:30 AM across all residential, hall, and pathway areas.',
    'terracotta',
    'Sunrise',
    5,
    10.977500,
    76.736000,
    'https://maps.google.com/?q=10.977500,76.736000',
    10,
    true
)
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
    updated_at = CURRENT_TIMESTAMP;


-- 2. Insert Operating Windows & Sacred Slots (Destination Availabilities)
INSERT INTO destination_availabilities (
    id, destination_id, start_time, end_time, label, status, recurrence
) VALUES
-- Welcome Centre (id: '1')
('avail-1-1', '1', '07:00', '13:00', 'Morning Registration & Visitor Badges', 'open', 'daily'),
('avail-1-2', '1', '14:00', '19:30', 'Afternoon Check-In & Assistance', 'open', 'daily'),

-- Dhyanalinga (id: '2')
('avail-2-1', '2', '06:00', '08:30', 'Morning Silent Meditation', 'silent_period', 'daily'),
('avail-2-2', '2', '08:30', '11:45', 'General Darshan & Sitting', 'open', 'daily'),
('avail-2-3', '2', '11:45', '12:15', 'Nadha Aradhana (Sound Offering)', 'exclusive_program', 'daily'),
('avail-2-4', '2', '12:30', '17:45', 'Afternoon Silent Meditation', 'open', 'daily'),
('avail-2-5', '2', '17:45', '18:15', 'Evening Nadha Aradhana (Sound Offering)', 'exclusive_program', 'daily'),
('avail-2-6', '2', '18:30', '20:00', 'Evening Meditation', 'silent_period', 'daily'),

-- Adiyogi Alayam (id: '3')
('avail-3-1', '3', '07:00', '12:00', 'Morning Chanting & Meditation Session', 'open', 'daily'),
('avail-3-2', '3', '16:00', '19:30', 'Evening Stillness & Inner Exploration', 'open', 'daily'),

-- Isha Café (id: '4')
('avail-4-1', '4', '07:30', '10:30', 'Wholesome Breakfast & Herbal Teas', 'open', 'daily'),
('avail-4-2', '4', '12:00', '15:30', 'Mindful Vegetarian Lunch Service', 'open', 'daily'),
('avail-4-3', '4', '17:00', '20:00', 'Evening Light Refreshments & Dinner', 'open', 'daily'),

-- Biksha Hall (id: '5')
('avail-5-1', '5', '10:00', '11:30', 'Morning Yogic Brunch (in silence)', 'open', 'daily'),
('avail-5-2', '5', '18:45', '20:15', 'Evening Yogic Dinner (in silence)', 'open', 'daily'),

-- Surya Kund (id: '101')
('avail-101-1', '101', '06:30', '11:30', 'Morning Theerthakund Dip', 'open', 'daily'),
('avail-101-2', '101', '15:30', '19:30', 'Evening Theerthakund Dip', 'open', 'daily'),

-- Vanashree Garden (id: '102')
('avail-102-1', '102', '06:00', '18:30', 'Daylight Walking Trail', 'open', 'daily'),

-- Spanda Hall (id: '103')
('avail-103-1', '103', '08:00', '11:00', 'Morning Hall Access', 'open', 'daily'),
('avail-103-2', '103', '15:00', '18:00', 'Afternoon Reflection', 'open', 'daily'),

-- Sadhguru Sannidhi (id: '104')
('avail-104-1', '104', '06:00', '12:30', 'Morning Contemplation', 'open', 'daily'),
('avail-104-2', '104', '16:00', '20:00', 'Evening Contemplation', 'open', 'daily'),

-- Campus-wide Night Silence (id: 'night-silence')
('avail-night-silence-1', 'night-silence', '21:30', '04:30', 'Night Time Silence (9:30 PM — 4:30 AM)', 'silent_period', 'daily')
ON CONFLICT (id) DO UPDATE SET
    destination_id = EXCLUDED.destination_id,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    label = EXCLUDED.label,
    status = EXCLUDED.status,
    recurrence = EXCLUDED.recurrence,
    updated_at = CURRENT_TIMESTAMP;
