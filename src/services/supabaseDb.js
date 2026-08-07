import { localStorageDb } from './localStorageDb'
import { supabaseClient } from './supabaseClient'

const TABLES = [
  'teachers',
  'schedule_periods',
  'schedules',
  'assignments',
  'teacher_locks',
  'substitutions',
]

function reportSyncError(error) {
  console.warn('Supabase sync error:', error.message)
  globalThis.dispatchEvent?.(new CustomEvent('tothe:sync-error', { detail: error.message }))
}

export function createSupabaseDatabase() {
  const client = supabaseClient
  const mirror = (promise) => promise.then(({ error }) => {
    if (error) reportSyncError(error)
  }).catch(reportSyncError)

  return {
    ...localStorageDb,
    async initialize() {
      if (!client) return localStorageDb.exportSnapshot()
      const results = await Promise.all(
        TABLES.map(async (table) => {
          const { data, error } = await client.from(table).select('*')
          if (error) throw error
          return [table, data || []]
        }),
      )
      results.forEach(([table, rows]) => {
        if (rows.length) localStorageDb.replaceAll(table, rows)
      })
      return localStorageDb.exportSnapshot()
    },
    insert(table, record) {
      const saved = localStorageDb.insert(table, record)
      if (client) mirror(client.from(table).insert(saved))
      return saved
    },
    update(table, id, patch) {
      const saved = localStorageDb.update(table, id, patch)
      if (client) mirror(client.from(table).update(patch).eq('id', id))
      return saved
    },
    remove(table, id) {
      const removed = localStorageDb.remove(table, id)
      if (client && removed) mirror(client.from(table).delete().eq('id', id))
      return removed
    },
    replaceAll(table, records) {
      const saved = localStorageDb.replaceAll(table, records)
      if (client) mirror(client.from(table).upsert(saved))
      return saved
    },
  }
}