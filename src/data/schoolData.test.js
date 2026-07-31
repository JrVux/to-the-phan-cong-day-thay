import { describe, expect, it } from 'vitest'
import data from './schoolData.json'

describe('dữ liệu HK II 2025–2026', () => {
  it('chứa đúng số giáo viên, phân công và tiết dạy đã duyệt', () => {
    expect(data.teachers).toHaveLength(24)
    expect(data.schedules).toHaveLength(360)
    expect(data.schedules.filter((row) => row.mon === 'Tin học')).toHaveLength(126)
    expect(data.schedules.filter((row) => row.mon === 'Giáo dục thể chất')).toHaveLength(156)
    expect(data.schedules.filter((row) => row.mon === 'GDQP AN')).toHaveLength(78)
    expect(data.schedule_periods).toEqual([
      expect.objectContaining({
        id: 'hk2_2025_2026',
        hoc_ky: 2,
        nam_hoc: '2025-2026',
      }),
    ])
  })

  it('ánh xạ tiết chiều sang 6–10 và không tạo tiết trùng', () => {
    expect(data.schedules.every((row) => row.tiet >= 1 && row.tiet <= 10)).toBe(true)
    expect(data.schedules.some((row) => row.buoi === 'Chiều' && row.tiet >= 6)).toBe(true)

    const teachingKeys = data.schedules.map(
      (row) => `${row.teacher_id}-${row.thu}-${row.tiet}`,
    )
    expect(new Set(teachingKeys).size).toBe(teachingKeys.length)
  })

  it('gán môn dạy và phân công cho giáo viên thể dục', () => {
    for (const name of ['Tào Phát Đạt', 'Lê Văn Giang']) {
      const teacher = data.teachers.find((item) => item.name === name)
      expect(teacher).toMatchObject({ active: true, mon_day: ['Giáo dục thể chất'] })
      expect(data.assignments.some((item) => item.teacher_id === teacher.id)).toBe(true)
    }
  })

  it('có phân công chuyên môn với số lớp và tiết/tuần', () => {
    expect(data.assignments.every((row) => Array.isArray(row.classes))).toBe(true)
    expect(data.assignments.every((row) => Number.isFinite(row.so_lop))).toBe(true)
    expect(data.assignments.every((row) => Number.isFinite(row.so_tiet_tuan))).toBe(true)
    expect(data.assignments.some((row) => row.so_tiet_tuan > 0)).toBe(true)
  })
})
