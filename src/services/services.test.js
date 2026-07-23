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
    expect(db.getAll('teachers')).toHaveLength(24)
    expect(db.getAll('schedule_periods')).toHaveLength(1)
  })

  it('tìm đúng đợt TKB hiệu lực và các tiết của GV trong ngày', () => {
    const period = getCurrentPeriod('2026-01-19')
    const lessons = getSchedulesForTeacherDate('gv_09', '2026-01-19', period.id)

    expect(period.id).toBe('hk2_2025_2026')
    expect(lessons.map((lesson) => lesson.tiet)).toEqual([2, 3])
  })

  it('giữ đủ lịch sử khi tạo nhiều phân công dạy thay', () => {
    createSubstitutions([
      {
        period_id: 'hk2_2025_2026',
        nghi_teacher_id: 'gv_09',
        the_teacher_id: 'gv_01',
        ngay: '2026-01-19',
        thu: 2,
        tiet: 2,
        lop: '12D3',
        mon: 'Tin học',
        hoc_ky: 2,
        nam_hoc: '2025-2026',
      },
      {
        period_id: 'hk2_2025_2026',
        nghi_teacher_id: 'gv_09',
        the_teacher_id: 'gv_15',
        ngay: '2026-01-19',
        thu: 2,
        tiet: 3,
        lop: '12D3',
        mon: 'Tin học',
        hoc_ky: 2,
        nam_hoc: '2025-2026',
      },
    ])

    const history = listSubstitutions()
    expect(history).toHaveLength(2)
    expect(history.map((item) => item.tiet).sort()).toEqual([2, 3])
  })

  it('tổng hợp tiết chuẩn, tiết thế, tổng và thừa thiếu', () => {
    createSubstitutions([{
      period_id: 'hk2_2025_2026',
      nghi_teacher_id: 'gv_09',
      the_teacher_id: 'gv_01',
      ngay: '2026-01-19',
      thu: 2,
      tiet: 2,
      lop: '12D3',
      mon: 'Tin học',
      hoc_ky: 2,
      nam_hoc: '2025-2026',
    }])
    const summary = buildTeacherSummary({ hoc_ky: 2, nam_hoc: '2025-2026' })
    const teacher = summary.find((item) => item.teacher_id === 'gv_01')

    expect(teacher.tiet_chuan).toBe(17)
    expect(teacher.tiet_the).toBe(1)
    expect(teacher.tong).toBe(teacher.tiet_chuan + teacher.tiet_the)
    expect(teacher.thua_thieu).toBe(teacher.tiet_the)
  })
})
