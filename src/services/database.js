import { localStorageDb } from './localStorageDb'
import { createSupabaseDatabase } from './supabaseDb'

export function resolveDatabaseMode(env = {}) {
  return env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY ? 'supabase' : 'local'
}

const env = import.meta.env || {}
export const databaseMode = resolveDatabaseMode(env)
export const database = databaseMode === 'supabase'
  ? createSupabaseDatabase({
      url: env.VITE_SUPABASE_URL,
      anonKey: env.VITE_SUPABASE_ANON_KEY,
    })
  : localStorageDb

export async function initializeDatabase() {
  if (databaseMode === 'supabase' && database.initialize) {
    return database.initialize()
  }
  return database.exportSnapshot()
}
