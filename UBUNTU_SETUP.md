# Stillpoint Spiritual Centre — Local Ubuntu Setup Guide

This guide walks you through setting up, building, and running Stillpoint on your local **Ubuntu Linux** machine, as well as importing the complete database schema and seed data into your local or remote **PostgreSQL** instance.

---

## 1. Prerequisites on Ubuntu

Open your Ubuntu terminal and update packages:

```bash
sudo apt-get update
sudo apt-get install -y curl git build-essential postgresql postgresql-contrib postgresql-client
```

### Install Node.js (v20+ recommended)
If you do not have Node.js 20 or higher installed, install it via NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify versions:
```bash
node -v   # Should be >= 20.x
npm -v    # Should be >= 10.x
psql --version
```

---

## 2. Set Up Local PostgreSQL

Ensure the PostgreSQL service is active:

```bash
sudo systemctl enable postgresql
sudo systemctl start postgresql
sudo systemctl status postgresql
```

### Create a Database User and Database
Switch to the postgres superuser or create your user:

```bash
# Switch to postgres user
sudo -u postgres psql

-- Inside PostgreSQL prompt:
CREATE USER stillpoint_user WITH PASSWORD 'stillpoint_password';
CREATE DATABASE stillpoint OWNER stillpoint_user;
GRANT ALL PRIVILEGES ON DATABASE stillpoint TO stillpoint_user;
\q
```

---

## 3. Import Schema & Seed Data

The project includes two SQL files and an automated import script:
- `schema.sql`: DDL statements defining the `destinations` and `destination_availabilities` tables, indexes, constraints, and column definitions (including `priority`, `latitude`, `longitude`, and `google_maps_url`).
- `seed.sql`: Complete seed data with all 9 sacred destinations, coordinates, Google Maps navigation links, and recurring 24-hr operating slots.
- `import-data.sh`: Automated bash import script.

### Method A: Using the Automated Bash Script (Recommended)

Make sure the script is executable and run it:

```bash
chmod +x import-data.sh

# Run with custom database credentials:
PGHOST=localhost \
PGPORT=5432 \
PGUSER=stillpoint_user \
PGPASSWORD=stillpoint_password \
PGDATABASE=stillpoint \
./import-data.sh
```

Or if running as default `postgres` user:
```bash
sudo -u postgres ./import-data.sh
```

### Method B: Using `psql` Directly

```bash
# 1. Apply Schema
psql -h localhost -U stillpoint_user -d stillpoint -f schema.sql

# 2. Import Seed Data
psql -h localhost -U stillpoint_user -d stillpoint -f seed.sql

# 3. Verify
psql -h localhost -U stillpoint_user -d stillpoint -c "SELECT title, priority, latitude, longitude, google_maps_url FROM destinations ORDER BY display_order;"
```

---

## 4. Install Dependencies & Configure Environment

Inside the project directory:

```bash
# 1. Install dependencies
npm install

# 2. Configure Environment Variables
cp .env.example .env.local

# Edit .env.local and add your Gemini API Key from https://aistudio.google.com/app/apikey
# GEMINI_API_KEY=AIzaSy...
```

> **Note on Gemini AI:**
> - If `GEMINI_API_KEY` is set, the app uses **Gemini 3.1 Flash Lite** with your custom instructions from `GEMINI_INSTRUCTIONS.md` to compose personalized, contemplative rhythms.
> - If `GEMINI_API_KEY` is omitted, the app automatically falls back to its built-in deterministic PostgreSQL scheduling engine, so the application continues to run seamlessly.

```bash
# 3. Check TypeScript validation
npm run lint

# 4. Build production bundle
npm run build
```

---

## 5. Run the Application

### Development Mode (with live reload)
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Mode
```bash
npm run build
npm start
```
The application will listen on `http://localhost:3000`.

---

## 6. Project Architecture Overview

| File / Directory | Purpose |
|---|---|
| `schema.sql` | PostgreSQL DDL definitions for destinations and operating slots |
| `seed.sql` | SQL data script containing all waypoints, coordinates, and operating slots |
| `import-data.sh` | Shell script for Ubuntu / Linux to provision and import data |
| `app/page.tsx` | Main interface (Visitor Timeline, Guide, Admin, and PostgreSQL SQL Query Console) |
| `app/api/schedule/suggest/route.ts` | Server-side Rhythm Scheduling Engine allocating visitor slots and silence observances |
| `lib/db/postgres.ts` | Embedded PostgreSQL (PGlite) engine for self-contained execution and zero-dependency mode |
