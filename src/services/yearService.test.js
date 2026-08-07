import { describe, expect, it, beforeEach } from 'vitest'
import { resetDatabase } from './localStorageDb'
import { countYearData, startNewYear } from './yearService'
import { db } from './db'

describe('yearService', () => {
  beforeEach(() => {
    resetDatabase()
  })

  it('bắt đầu năm mới giữ giáo viên và đợt TKB, xóa dữ liệu phân công', () => {
    db.getAll('teachers')
    const before = countYearData()
    const after = startNewYear()

    expect(before.teachers).toBeGreaterThan(0)
    expect(before.periods).toBeGreaterThan(0)
    expect(before.schedules).toBeGreaterThan(0)

    expect(after.teachers).toBe(before.teachers)
    expect(after.periods).toBe(before.periods)
    expect(after.substitutions).toBe(0)
    expect(after.schedules).toBe(0)
    expect(after.assignments).toBe(0)
    expect(after.locks).toBe(0)
  })

  it('resetDatabase khôi phục dữ liệu mẫu đầy đủ', () => {
    resetDatabase()
    const counts = countYearData()
    expect(counts.teachers).toBeGreaterThan(0)
    expect(counts.periods).toBeGreaterThanOrEqual(0)
    expect(counts.substitutions).toBeGreaterThanOrEqual(0)
    expect(db.getAll('teachers').length).toBe(counts.teachers)
  })
})