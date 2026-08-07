import { describe, expect, it } from 'vitest'
import { getBalanceWarning, scoreCandidates } from './scoringEngine'
import { seedAssignments, seedLocks, seedPeriods, seedSchedules, seedSubstitutions, seedTeachers } from '../data/seed'

const teachers = [
  { id: 'gv_01', name: 'Nguyễn Văn An', mon_day: ['Toán'], active: true },
  { id: 'gv_02', name: 'Trần Thị Bình', mon_day: ['Toán'], active: true },
  { id: 'gv_03', name: 'Lê Văn Cường', mon_day: ['Toán', 'Tin'], active: true },
  { id: 'gv_04', name: 'Phạm Thị Dung', mon_day: ['Toán'], active: true },
  { id: 'gv_05', name: 'Hoàng Văn Em', mon_day: ['Tin'], active: true },
]

function makeRows(periodId, teacherId, count, mon = 'Toán') {
  return Array.from({ length: count }, (_, index) => ({
    id: `${periodId}_${teacherId}_${index}`,
    period_id: periodId,
    teacher_id: teacherId,
    thu: 2 + (index % 6),
    tiet: 2 + (index % 9),
    lop: `10A${(index % 9) + 1}`,
    mon,
  }))
}

const schedules = [
  ...makeRows('dot_1', 'gv_01', 15),
  ...makeRows('dot_1', 'gv_02', 16),
  ...makeRows('dot_1', 'gv_03', 17),
  ...makeRows('dot_1', 'gv_04', 20),
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
  assignments: [],
  periods: [{ id: 'dot_1', tu_ngay: '2025-09-22', den_ngay: '2026-01-10', hoc_ky: 1, nam_hoc: '2025-2026' }],
}

describe('scoreCandidates', () => {
  it('đính kèm TKB ngày của ứng viên và loại tiết chào cờ thứ 2', () => {
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
      assignments: seedAssignments,
      periods: seedPeriods,
    })

    expect(result.length).toBeGreaterThan(0)
    result.forEach((candidate) => {
      expect(Array.isArray(candidate.dayTKB)).toBe(true)
      expect(candidate.dayTKB.some((item) => item.label === 'Sáng T1')).toBe(false)
      candidate.dayTKB.forEach((item) => {
        expect(item.mon).toBeTruthy()
        expect(item.lop).toBeTruthy()
      })
    })
  })

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
      assignments: seedAssignments,
      periods: seedPeriods,
    })

    expect(result.length).toBeGreaterThan(0)
    expect(result.every((item) => item.teacher.mon_day.includes('Tin học'))).toBe(true)
    expect(result.every((item) => item.teacher.id !== 'gv_09')).toBe(true)
  })

  it('ưu tiên GV thiếu tiết chuẩn nhất và loại GV sai môn', () => {
    const result = scoreCandidates(baseInput)

    expect(result).toHaveLength(1)
    expect(result[0].teacher.id).toBe('gv_02')
    expect(result[0].balance).toBeGreaterThan(0)
    expect(result.some((item) => item.teacher.id === 'gv_05')).toBe(false)
  })

  it('đẩy GV thừa tiết chuẩn xuống cuối', () => {
    const result = scoreCandidates(baseInput)
    expect(result).toHaveLength(1)
    expect(result[0].teacher.id).toBe('gv_02')
    expect(result[0].balance).toBeGreaterThan(0)
  })

  it('cộng 4 tiết phụ cấp chủ nhiệm vào tiết/tuần', () => {
    const cnTeachers = teachers.map((t) => (t.id === 'gv_02' ? { ...t, vai_tro: ['chu_nhiem'] } : t))
    const result = scoreCandidates({ ...baseInput, allTeachers: cnTeachers })

    const binh = result.find((item) => item.teacher.id === 'gv_02')
    expect(binh.phu_cap_cn).toBe(4)
    expect(binh.so_tiet_tuan).toBe(20)
    expect(binh.balance).toBe(-3)
    expect(result[0].teacher.id).toBe('gv_03')
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

  it('cộng tiết thế trong tuần vào tổng tiết để ưu tiên lần sau', () => {
    const weeklySchedules = [
      ...makeRows('dot_1', 'gv_01', 15),
      ...makeRows('dot_1', 'gv_02', 16),
      ...makeRows('dot_1', 'gv_03', 16),
      ...makeRows('dot_1', 'gv_04', 20),
    ]
    const substitutions = [
      { id: 'sub1', the_teacher_id: 'gv_03', ngay: '2025-09-22', hoc_ky: 1, nam_hoc: '2025-2026', period_id: 'dot_1' },
      { id: 'sub2', the_teacher_id: 'gv_03', ngay: '2025-09-23', hoc_ky: 1, nam_hoc: '2025-2026', period_id: 'dot_1' },
    ]
    const result = scoreCandidates({ ...baseInput, schedules: weeklySchedules, substitutions })

    expect(result.length).toBeGreaterThan(0)
    const indexOf = (id) => result.findIndex((item) => item.teacher.id === id)
    expect(result[0].teacher.id).toBe('gv_02')
    expect(indexOf('gv_02')).toBeLessThan(indexOf('gv_03'))
  })

  it('cộng dồn thừa/thiếu của đợt trước làm số dư cho đợt sau', () => {
    const pastSchedules = [
      ...makeRows('dot_0', 'gv_02', 20),
      ...makeRows('dot_0', 'gv_03', 16),
      ...makeRows('dot_0', 'gv_04', 16),
    ]
    const periods = [
      { id: 'dot_0', tu_ngay: '2025-01-06', den_ngay: '2025-01-12', hoc_ky: 1, nam_hoc: '2024-2025' },
      { id: 'dot_1', tu_ngay: '2025-09-22', den_ngay: '2026-01-10', hoc_ky: 1, nam_hoc: '2025-2026' },
    ]
    const result = scoreCandidates({
      ...baseInput,
      schedules: [...pastSchedules, ...schedules],
      periods,
    })

    expect(result.length).toBeGreaterThan(0)
    const deficitTeachers = result.filter((c) => c.balance > 0).map((c) => c.teacher.id)
    expect(deficitTeachers.length).toBeGreaterThan(0)
    expect(deficitTeachers[0]).toBe('gv_03')
  })

  it('loại GV đã thế đủ 3 tiết trong cùng ngày', () => {
    const substitutions = Array.from({ length: 3 }, (_, index) => ({
      id: `day_${index}`,
      the_teacher_id: 'gv_02',
      ngay: '2025-09-22',
      hoc_ky: 1,
      nam_hoc: '2025-2026',
      period_id: 'dot_1',
    }))
    const result = scoreCandidates({ ...baseInput, substitutions })

    expect(result.some((item) => item.teacher.id === 'gv_02')).toBe(false)
    expect(result[0].teacher.id).toBe('gv_03')
  })

  it('cho phép GV mới thế khi mới nhận 2 tiết trong ngày', () => {
    const substitutions = [
      { id: 'day_1', the_teacher_id: 'gv_02', ngay: '2025-09-22', hoc_ky: 1, nam_hoc: '2025-2026', period_id: 'dot_1' },
      { id: 'day_2', the_teacher_id: 'gv_02', ngay: '2025-09-22', hoc_ky: 1, nam_hoc: '2025-2026', period_id: 'dot_1' },
    ]
    const result = scoreCandidates({ ...baseInput, substitutions })

    const binh = result.find((item) => item.teacher.id === 'gv_02')
    expect(binh).toBeDefined()
    expect(binh.the_trong_ngay).toBe(2)
  })

  it('giới hạn thế/ngày không tính tiết thế của ngày khác', () => {
    const substitutions = Array.from({ length: 3 }, (_, index) => ({
      id: `other_${index}`,
      the_teacher_id: 'gv_02',
      ngay: '2025-09-23',
      hoc_ky: 1,
      nam_hoc: '2025-2026',
      period_id: 'dot_1',
    }))
    const result = scoreCandidates({ ...baseInput, substitutions })

    const binh = result.find((item) => item.teacher.id === 'gv_02')
    expect(binh).toBeDefined()
    expect(binh.the_trong_ngay).toBe(0)
    expect(binh.balance).toBeGreaterThan(0)
  })

  it('loại GV có tổng dạy + thế trong ngày vượt quá 6 tiết', () => {
    const busy = [
      ...makeRows('dot_1', 'gv_02', 16),
      ...makeRows('dot_1', 'gv_03', 17),
      ...makeRows('dot_1', 'gv_04', 20),
      { id: 'x1', period_id: 'dot_1', teacher_id: 'gv_02', thu: 2, tiet: 5, lop: '10Z1', mon: 'Toán' },
      { id: 'x2', period_id: 'dot_1', teacher_id: 'gv_02', thu: 2, tiet: 6, lop: '10Z2', mon: 'Toán' },
      { id: 'x3', period_id: 'dot_1', teacher_id: 'gv_02', thu: 2, tiet: 7, lop: '10Z3', mon: 'Toán' },
    ]
    const substitutions = [
      { id: 'd1', the_teacher_id: 'gv_02', ngay: '2025-09-22', hoc_ky: 1, nam_hoc: '2025-2026', period_id: 'dot_1' },
      { id: 'd2', the_teacher_id: 'gv_02', ngay: '2025-09-22', hoc_ky: 1, nam_hoc: '2025-2026', period_id: 'dot_1' },
    ]
    const result = scoreCandidates({ ...baseInput, schedules: busy, substitutions })

    expect(result.some((item) => item.teacher.id === 'gv_02')).toBe(false)
    expect(result.some((item) => item.teacher.id === 'gv_03')).toBe(true)
  })
})

describe('getBalanceWarning', () => {
  it('cảnh báo vàng khi chênh lệch trên 5 và đỏ khi trên 10', () => {
    expect(getBalanceWarning([{ balance: 0 }, { balance: 6 }]).level).toBe('warning')
    expect(getBalanceWarning([{ balance: 0 }, { balance: 11 }]).level).toBe('danger')
    expect(getBalanceWarning([{ balance: 2 }, { balance: 5 }]).level).toBe('none')
  })
})
