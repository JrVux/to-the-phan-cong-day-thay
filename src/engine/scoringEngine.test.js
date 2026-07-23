import { describe, expect, it } from 'vitest'
import { getBalanceWarning, scoreCandidates } from './scoringEngine'
import { seedLocks, seedSchedules, seedSubstitutions, seedTeachers } from '../data/seed'

const teachers = [
  { id: 'gv_01', name: 'Nguyễn Văn An', mon_day: ['Toán'], active: true },
  { id: 'gv_02', name: 'Trần Thị Bình', mon_day: ['Toán'], active: true },
  { id: 'gv_03', name: 'Lê Văn Cường', mon_day: ['Toán', 'Tin'], active: true },
  { id: 'gv_04', name: 'Phạm Thị Dung', mon_day: ['Toán'], active: true },
  { id: 'gv_05', name: 'Hoàng Văn Em', mon_day: ['Tin'], active: true },
]

const schedules = [
  { id: 's1', period_id: 'dot_1', teacher_id: 'gv_01', thu: 2, tiet: 1, lop: '10A1', mon: 'Toán' },
  { id: 's2', period_id: 'dot_1', teacher_id: 'gv_02', thu: 2, tiet: 3, lop: '10A4', mon: 'Toán' },
  { id: 's3', period_id: 'dot_1', teacher_id: 'gv_03', thu: 2, tiet: 4, lop: '10A6', mon: 'Toán' },
]

const baseInput = {
  nghi_teacher_id: 'gv_01',
  ngay: '2025-09-22',
  thu: 2,
  tiet: 1,
  mon: 'Toán',
  hoc_ky: 1,
  nam_hoc: '2025-2026',
  period_id: 'dot_1',
  allTeachers: teachers,
  schedules,
  substitutions: [],
  locks: [],
}

describe('scoreCandidates', () => {
  it('trả về ứng viên Tin học hợp lệ trên toàn bộ dữ liệu thật', () => {
    const result = scoreCandidates({
      ...baseInput,
      nghi_teacher_id: 'gv_09',
      ngay: '2026-01-19',
      tiet: 2,
      mon: 'Tin học',
      hoc_ky: 2,
      period_id: 'hk2_2025_2026',
      allTeachers: seedTeachers,
      schedules: seedSchedules,
      substitutions: seedSubstitutions,
      locks: seedLocks,
    })

    expect(result.length).toBeGreaterThan(0)
    expect(result.every((item) => item.teacher.mon_day.includes('Tin học'))).toBe(true)
    expect(result.every((item) => item.teacher.id !== 'gv_09')).toBe(true)
  })

  it('ưu tiên GV Bình và loại GV sai môn', () => {
    const result = scoreCandidates(baseInput)

    expect(result[0].teacher.id).toBe('gv_02')
    expect(result.some((item) => item.teacher.id === 'gv_05')).toBe(false)
  })

  it('trả về rỗng khi mọi GV Toán đều bận', () => {
    const busySchedules = [
      ...schedules,
      { id: 'busy2', period_id: 'dot_1', teacher_id: 'gv_02', thu: 2, tiet: 1, lop: '11A1', mon: 'Toán' },
      { id: 'busy3', period_id: 'dot_1', teacher_id: 'gv_03', thu: 2, tiet: 1, lop: '11A2', mon: 'Toán' },
      { id: 'busy4', period_id: 'dot_1', teacher_id: 'gv_04', thu: 2, tiet: 1, lop: '11A3', mon: 'Toán' },
    ]

    expect(scoreCandidates({ ...baseInput, schedules: busySchedules })).toEqual([])
  })

  it('loại GV đang bị khóa đúng ngày', () => {
    const locks = [{ id: 'l1', teacher_id: 'gv_04', tu_ngay: '2025-09-20', den_ngay: '2025-10-10' }]
    const result = scoreCandidates({ ...baseInput, locks })

    expect(result.some((item) => item.teacher.id === 'gv_04')).toBe(false)
  })

  it('đẩy GV đã thế nhiều xuống cuối dù có lịch thuận tiện', () => {
    const substitutions = Array.from({ length: 4 }, (_, index) => ({
      id: `sub${index}`,
      the_teacher_id: 'gv_03',
      ngay: `2025-09-${10 + index}`,
      hoc_ky: 1,
      nam_hoc: '2025-2026',
    }))
    const result = scoreCandidates({ ...baseInput, substitutions })

    expect(result.at(-1).teacher.id).toBe('gv_03')
  })
})

describe('getBalanceWarning', () => {
  it('cảnh báo vàng khi chênh lệch trên 5 và đỏ khi trên 10', () => {
    expect(getBalanceWarning([{ thua_gio_hk: 0 }, { thua_gio_hk: 6 }]).level).toBe('warning')
    expect(getBalanceWarning([{ thua_gio_hk: 0 }, { thua_gio_hk: 11 }]).level).toBe('danger')
    expect(getBalanceWarning([{ thua_gio_hk: 2 }, { thua_gio_hk: 5 }]).level).toBe('none')
  })
})
