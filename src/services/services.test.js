import { beforeEach, describe, expect, it } from 'vitest'
import { db, resetDatabase } from './db'
import { getCurrentPeriod, getSchedulesForTeacherDate } from './scheduleService'
import { createSubstitutions, listSubstitutions } from './substitutionService'
import { buildTeacherSummary } from './reportService'

describe('service layer', () => {
  beforeEach(() => {
    localStorage.clear()
    resetDatabase()
  })

  it('seed dữ liệu khi storage trống', () => {
    expect(db.getAll('teachers')).toHaveLength(12)
    expect(db.getAll('schedule_periods').length).toBeGreaterThanOrEqual(2)
  })

  it('tìm đúng đợt TKB hiệu lực và các tiết của GV trong ngày', () => {
    const period = getCurrentPeriod('2025-09-22')
    const lessons = getSchedulesForTeacherDate('gv_01', '2025-09-22', period.id)

    expect(period.id).toBe('dot_1')
    expect(lessons.map((lesson) => lesson.tiet)).toContain(1)
  })

  it('giữ lịch sử của đợt cũ khi tạo phân công ở đợt mới', () => {
    createSubstitutions([
      {
        period_id: 'dot_2',
        nghi_teacher_id: 'gv_01',
        the_teacher_id: 'gv_02',
        ngay: '2025-11-03',
        thu: 2,
        tiet: 1,
        lop: '10A1',
        mon: 'Toán',
        hoc_ky: 1,
        nam_hoc: '2025-2026',
      },
    ])

    const history = listSubstitutions()
    expect(history.some((item) => item.period_id === 'dot_1')).toBe(true)
    expect(history.some((item) => item.period_id === 'dot_2')).toBe(true)
  })

  it('tổng hợp tiết chuẩn, tiết thế, tổng và thừa thiếu', () => {
    const summary = buildTeacherSummary({ hoc_ky: 1, nam_hoc: '2025-2026' })
    const teacher = summary.find((item) => item.teacher_id === 'gv_03')

    expect(teacher.tiet_chuan).toBe(17)
    expect(teacher.tiet_the).toBeGreaterThanOrEqual(4)
    expect(teacher.tong).toBe(teacher.tiet_chuan + teacher.tiet_the)
    expect(teacher.thua_thieu).toBe(teacher.tiet_the)
  })
})
