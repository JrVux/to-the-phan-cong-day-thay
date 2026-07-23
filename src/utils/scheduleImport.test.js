import { describe, expect, it } from 'vitest'
import { normalizeScheduleRows } from './scheduleImport'

describe('normalizeScheduleRows', () => {
  const teachers = [
    { id: 'gv_01', name: 'Nguyễn Văn An', mon_day: ['Toán'] },
    { id: 'gv_02', name: 'Trần Thị Bình', mon_day: ['Toán'] },
  ]

  it('chuẩn hóa dòng theo tên giáo viên', () => {
    const result = normalizeScheduleRows(
      [{ 'Giáo viên': 'Nguyễn Văn An', Thứ: 2, Tiết: 1, Lớp: '10A1', Môn: 'Toán' }],
      { teachers, periodId: 'dot_1' },
    )

    expect(result.errors).toEqual([])
    expect(result.rows[0]).toMatchObject({
      teacher_id: 'gv_01',
      period_id: 'dot_1',
      thu: 2,
      tiet: 1,
      lop: '10A1',
      mon: 'Toán',
    })
  })

  it('báo số dòng khi thiếu cột hoặc giá trị không hợp lệ', () => {
    const result = normalizeScheduleRows(
      [
        { 'Giáo viên': 'Không tồn tại', Thứ: 9, Tiết: 0, Lớp: '', Môn: 'Toán' },
        { 'Giáo viên': 'Nguyễn Văn An', Thứ: 2, Tiết: 1, Lớp: '10A1' },
      ],
      { teachers, periodId: 'dot_1' },
    )

    expect(result.rows).toEqual([])
    expect(result.errors[0]).toMatch(/Dòng 2/)
    expect(result.errors[1]).toMatch(/Dòng 3/)
  })

  it('loại dòng trùng trong cùng file', () => {
    const row = { 'Giáo viên': 'Nguyễn Văn An', Thứ: 2, Tiết: 1, Lớp: '10A1', Môn: 'Toán' }
    const result = normalizeScheduleRows([row, row], { teachers, periodId: 'dot_1' })

    expect(result.rows).toHaveLength(1)
    expect(result.errors[0]).toMatch(/trùng/)
  })
})
