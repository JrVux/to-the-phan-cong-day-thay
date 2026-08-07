import { localStorageDb } from './localStorageDb'
import { createSupabaseDatabase } from './supabaseDb'
import { hasSupabase, supabaseClient } from './supabaseClient'

export function resolveDatabaseMode(env = {}) {
  return env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY ? 'supabase' : 'local'
}

const env = import.meta.env || {}
export const databaseMode = resolveDatabaseMode(env)
export const database = databaseMode === 'supabase'
  ? createSupabaseDatabase()
  : localStorageDb

export { hasSupabase, supabaseClient }

export async function initializeDatabase() {
  if (databaseMode === 'supabase' && database.initialize) {
    return database.initialize()
  }
  return database.exportSnapshot()
}