import { pgTable, varchar, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const destinationsTable = pgTable('destinations', {
  id: varchar('id', { length: 100 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  time: varchar('time', { length: 50 }).default('Next'),
  duration: varchar('duration', { length: 50 }).default('30 min'),
  distance: varchar('distance', { length: 50 }).default('5 min walk'),
  description: text('description').notNull().default(''),
  tone: varchar('tone', { length: 50 }).notNull().default('sage'),
  iconName: varchar('icon_name', { length: 50 }).notNull().default('Compass'),
  priority: integer('priority').notNull().default(3),
  displayOrder: integer('display_order').notNull().default(0),
  isInRoute: boolean('is_in_route').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const destinationAvailabilitiesTable = pgTable('destination_availabilities', {
  id: varchar('id', { length: 100 }).primaryKey(),
  destinationId: varchar('destination_id', { length: 100 })
    .notNull()
    .references(() => destinationsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  startTime: varchar('start_time', { length: 10 }).notNull(),
  endTime: varchar('end_time', { length: 10 }).notNull(),
  label: varchar('label', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('open'),
  recurrence: varchar('recurrence', { length: 50 }).notNull().default('daily'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const destinationsRelations = relations(destinationsTable, ({ many }) => ({
  availabilities: many(destinationAvailabilitiesTable),
}))

export const destinationAvailabilitiesRelations = relations(destinationAvailabilitiesTable, ({ one }) => ({
  destination: one(destinationsTable, {
    fields: [destinationAvailabilitiesTable.destinationId],
    references: [destinationsTable.id],
  }),
}))

export type DestinationDbRow = typeof destinationsTable.$inferSelect
export type NewDestinationDbRow = typeof destinationsTable.$inferInsert
export type DestinationAvailabilityDbRow = typeof destinationAvailabilitiesTable.$inferSelect
export type NewDestinationAvailabilityDbRow = typeof destinationAvailabilitiesTable.$inferInsert
