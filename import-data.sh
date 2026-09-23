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

# Verify psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ Error: 'psql' client is not installed or not in PATH."
    echo "To install on Ubuntu:"
    echo "    sudo apt-get update && sudo apt-get install -y postgresql-client"
    exit 1
fi

# Verify schema and seed files exist
if [ ! -f "${SCHEMA_FILE}" ]; then
    echo "❌ Error: schema file '${SCHEMA_FILE}' not found."
    exit 1
fi

if [ ! -f "${SEED_FILE}" ]; then
    echo "❌ Error: seed file '${SEED_FILE}' not found."
    exit 1
fi

# Step 1: Create database if it does not already exist
echo "1️⃣  Checking if database '${DB_NAME}' exists..."
if psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -lqt | cut -d \| -f 1 | grep -qw "${DB_NAME}"; then
    echo "   Database '${DB_NAME}' already exists."
else
    echo "   Database '${DB_NAME}' does not exist. Creating..."
    psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -c "CREATE DATABASE ${DB_NAME};"
    echo "   ✅ Database '${DB_NAME}' created."
fi

# Step 2: Execute DDL schema
echo "2️⃣  Applying DDL schema (tables, indices, columns)..."
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -f "${SCHEMA_FILE}"
echo "   ✅ Schema applied successfully."

# Step 3: Insert seed records
echo "3️⃣  Importing Stillpoint sacred destinations and availability slots..."
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -f "${SEED_FILE}"
echo "   ✅ Seed records imported successfully."

# Step 4: Verification summary
echo "4️⃣  Verifying imported records..."
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
