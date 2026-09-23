#!/usr/bin/env bash
# ==============================================================================
# Stillpoint Spiritual Centre - PostgreSQL Import Script for Ubuntu / Linux
# ==============================================================================
# Usage:
#   chmod +x import-data.sh
#   ./import-data.sh
#
# Or pass custom options:
#   PGHOST=localhost PGPORT=5432 PGUSER=postgres PGDATABASE=stillpoint ./import-data.sh
# ==============================================================================

set -euo pipefail

# Configuration with defaults
DB_HOST="${PGHOST:-localhost}"
DB_PORT="${PGPORT:-5432}"
DB_USER="${PGUSER:-postgres}"
DB_NAME="${PGDATABASE:-stillpoint}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_FILE="${SCRIPT_DIR}/schema.sql"
SEED_FILE="${SCRIPT_DIR}/seed.sql"

echo "=========================================================="
echo "Stillpoint Spiritual Centre - Database Provision & Import"
echo "=========================================================="
echo "Target Host     : ${DB_HOST}:${DB_PORT}"
echo "Target User     : ${DB_USER}"
echo "Target Database : ${DB_NAME}"
echo "Schema File     : ${SCHEMA_FILE}"
echo "Seed Data File  : ${SEED_FILE}"
echo "----------------------------------------------------------"

# Step 1: Seed local embedded PostgreSQL engine for Next.js app
echo "1️⃣  Seeding local application database..."
node "${SCRIPT_DIR}/scripts/seed.mjs"

# Step 2: Check if psql client is installed for external/system PostgreSQL
echo ""
echo "2️⃣  Checking for native PostgreSQL server..."
if ! command -v psql &> /dev/null; then
    echo "ℹ️  'psql' client is not installed. Application local database is already seeded and ready!"
    echo "To install psql on Ubuntu: sudo apt-get install -y postgresql-client"
    exit 0
fi

# Step 3: Check if PostgreSQL server is reachable
if ! psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -c '\q' 2>/dev/null; then
    echo "ℹ️  Cannot reach external PostgreSQL server at ${DB_HOST}:${DB_PORT} (User: ${DB_USER})."
    echo "   Application local database is already seeded and fully ready for 'npm run dev'!"
    exit 0
fi

# Step 4: Create database if it does not already exist
echo "3️⃣  Checking if external database '${DB_NAME}' exists..."
if psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -lqt | cut -d \| -f 1 | grep -qw "${DB_NAME}"; then
    echo "   Database '${DB_NAME}' already exists."
else
    echo "   Database '${DB_NAME}' does not exist. Creating..."
    psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -c "CREATE DATABASE ${DB_NAME};"
    echo "   ✅ Database '${DB_NAME}' created."
fi

# Step 5: Execute DDL schema
echo "4️⃣  Applying DDL schema (schema.sql)..."
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -f "${SCHEMA_FILE}"
echo "   ✅ Schema applied successfully."

# Step 6: Insert seed records
echo "5️⃣  Importing Stillpoint sacred destinations and availability slots (seed.sql)..."
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -f "${SEED_FILE}"
echo "   ✅ Seed records imported successfully."

# Step 7: Verification summary
echo "6️⃣  Verifying imported records..."
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "
SELECT 
    (SELECT count(*) FROM destinations) AS total_destinations,
    (SELECT count(*) FROM destination_availabilities) AS total_operating_slots;
"

echo "----------------------------------------------------------"
echo "🎉 Import completed successfully!"
echo "To connect to your PostgreSQL database in the app or via CLI:"
echo "    psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME}"
echo "=========================================================="
