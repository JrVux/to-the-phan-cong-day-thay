import { beforeEach, describe, expect, it } from 'vitest'
import { db, resetDatabase } from './db'
import { computeTeacherWorkload, getCurrentPeriod, getSchedulesForTeacherDate, isChaoCoPeriod } from './scheduleService'
import { saveTeacher } from './teacherService'
import { createSubstitutions, deleteSubstitution, listSubstitutions } from './substitutionService'
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
    expect(lessons.map((lesson) => lesson.tiet)).toEqual([1, 2, 3])
  })

  it('nhận diện tiết chào cờ thứ 2 (sáng tiết 1 và chiều tiết 5)', () => {
    expect(isChaoCoPeriod({ thu: 2, tiet: 1, buoi: 'Sáng', tiet_trong_buoi: 1 })).toBe(true)
    expect(isChaoCoPeriod({ thu: 2, tiet: 10, buoi: 'Chiều', tiet_trong_buoi: 5 })).toBe(true)
    expect(isChaoCoPeriod({ thu: 2, tiet: 2, buoi: 'Sáng', tiet_trong_buoi: 2 })).toBe(false)
    expect(isChaoCoPeriod({ thu: 2, tiet: 6 })).toBe(false)
    expect(isChaoCoPeriod({ thu: 3, tiet: 1 })).toBe(false)
  })

  it('tính khối lượng với phụ cấp chủ nhiệm và tiết chuẩn hiệu lực từ vai trò', () => {
    const workload = computeTeacherWorkload('hk2_2025_2026')

    const khang = workload.find((item) => item.teacher_id === 'gv_09')
    expect(khang.phu_cap_cn).toBe(4)
    expect(khang.tiet_chuan).toBe(17)

    saveTeacher({ ...db.getById('teachers', 'gv_01'), vai_tro: ['to_truong'] })
    const updated = computeTeacherWorkload('hk2_2025_2026')
    const truong = updated.find((item) => item.teacher_id === 'gv_01')
    expect(truong.tiet_chuan).toBe(14)
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

  it('xóa một phân công dạy thay vừa lưu khi phân nhầm', () => {
    const [record] = createSubstitutions([{
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
    expect(listSubstitutions()).toHaveLength(1)

    deleteSubstitution(record.id)
    expect(listSubstitutions()).toHaveLength(0)
  })

  it('tổng hợp tiết chuẩn, tiết TKB/tuần, tiết thế và thừa thiếu trong đợt', () => {
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
    expect(teacher.so_tiet_tuan).toBe(18)
    expect(teacher.tiet_the).toBe(1)
    expect(teacher.tong).toBe(teacher.so_tiet_tuan + teacher.tiet_the)
    expect(teacher.thua_thieu).toBe((teacher.so_tiet_tuan - teacher.tiet_chuan) * 19 + teacher.tiet_the)
  })
})
