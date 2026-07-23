import { describe, expect, it } from 'vitest'
import { resolveDatabaseMode } from './database'

describe('database adapter selection', () => {
  it('dùng localStorage khi thiếu cấu hình Supabase', () => {
    expect(resolveDatabaseMode({})).toBe('local')
    expect(resolveDatabaseMode({ VITE_SUPABASE_URL: 'https://demo.supabase.co' })).toBe('local')
  })

  it('dùng Supabase khi có đủ URL và anon key', () => {
    expect(resolveDatabaseMode({
      VITE_SUPABASE_URL: 'https://demo.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'anon-key',
    })).toBe('supabase')
  })
})
