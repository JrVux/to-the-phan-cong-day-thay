import { describe, expect, it } from 'vitest'
import { db, resetDatabase } from './db'
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

describe('dữ liệu khởi tạo cục bộ', () => {
  it('khởi tạo bộ dữ liệu thật của HK II', () => {
    resetDatabase()

    expect(db.getAll('teachers')).toHaveLength(24)
    expect(db.getAll('schedules')).toHaveLength(360)
    expect(db.getAll('schedule_periods')).toEqual([
      expect.objectContaining({ id: 'hk2_2025_2026', hoc_ky: 2 }),
    ])
  })
})
