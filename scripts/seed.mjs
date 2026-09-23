#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { PGlite } from '@electric-sql/pglite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const schemaPath = path.join(rootDir, 'schema.sql')
const seedPath = path.join(rootDir, 'seed.sql')
const dataDir = path.join(rootDir, 'data', 'postgres')

console.log('========================================================')
console.log('Stillpoint Spiritual Centre - Database Seeder')
console.log('========================================================')

async function runSeed() {
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found at: ${schemaPath}`)
  }
  if (!fs.existsSync(seedPath)) {
    throw new Error(`Seed file not found at: ${seedPath}`)
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf8')
  const seedSql = fs.readFileSync(seedPath, 'utf8')

  console.log(`1️⃣  Target local data directory: ${dataDir}`)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  // Remove any stale lock/pid file if present
  const pidFile = path.join(dataDir, 'postmaster.pid')
  if (fs.existsSync(pidFile)) {
    try {
      fs.unlinkSync(pidFile)
    } catch {
      // ignore
    }
  }

  console.log('2️⃣  Initializing PostgreSQL engine...')
  const client = new PGlite(dataDir)
  await client.waitReady

  console.log('3️⃣  Applying DDL schema (schema.sql)...')
  await client.exec(schemaSql)
  console.log('   ✅ Schema applied successfully.')

  console.log('4️⃣  Importing Stillpoint sacred destinations and availability slots (seed.sql)...')
  await client.exec(seedSql)
  console.log('   ✅ Seed records imported successfully.')

  console.log('5️⃣  Verifying imported records...')
  const destRes = await client.query('SELECT id, title, type, priority FROM destinations ORDER BY display_order ASC;')
  const slotsRes = await client.query('SELECT count(*) as count FROM destination_availabilities;')

  console.log('--------------------------------------------------------')
  console.log(`Found ${destRes.rows.length} Sacred Destinations:`)
  for (const row of destRes.rows) {
    console.log(` • [ID: ${String(row.id).padEnd(13)}] ${String(row.title).padEnd(22)} (${row.type}) - Priority: ${row.priority}`)
  }
  console.log(`Total Recurring Operating Slots: ${slotsRes.rows[0].count}`)
  console.log('--------------------------------------------------------')
  console.log('🎉 Stillpoint database is fully populated and ready!')
  console.log('========================================================')

  await client.close()
}

runSeed().catch((err) => {
  console.error('❌ Seeding failed:', err)
  process.exit(1)
})
