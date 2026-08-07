import { describe, expect, it } from 'vitest'
import {
  detectSubjectFromMatrix,
  matchTeacherByShortName,
  normalizeMatrixScheduleRows,
  normalizeScheduleRows,
} from './scheduleImport'

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

describe('matchTeacherByShortName', () => {
  const teachers = [
    { id: 'gv_01', name: 'Võ Chí Diễn' },
    { id: 'gv_02', name: 'Châu Vĩnh Nghiêm' },
    { id: 'gv_03', name: 'Nguyễn Hùng Anh' },
    { id: 'gv_04', name: 'Tạ Hoàng Nghị' },
    { id: 'gv_05', name: 'Phan Như Tiên' },
    { id: 'gv_06', name: 'Nguyễn Minh Toàn' },
    { id: 'gv_07', name: 'Lưu Tấn Khang' },
  ]

  it('khớp tên đầy đủ theo dạng file mẫu', () => {
    expect(matchTeacherByShortName(teachers, 'Thầy Diễn').id).toBe('gv_01')
    expect(matchTeacherByShortName(teachers, 'T Nghiêm').id).toBe('gv_02')
    expect(matchTeacherByShortName(teachers, 'Anh.H Nguyễn').id).toBe('gv_03')
    expect(matchTeacherByShortName(teachers, 'Nghị Tạ').id).toBe('gv_04')
    expect(matchTeacherByShortName(teachers, 'Tiên.P').id).toBe('gv_05')
    expect(matchTeacherByShortName(teachers, 'T M Toàn').id).toBe('gv_06')
    expect(matchTeacherByShortName(teachers, 'Khang').id).toBe('gv_07')
  })

  it('trả về null khi không khớp', () => {
    expect(matchTeacherByShortName(teachers, 'Thầy XYZ')).toBeNull()
    expect(matchTeacherByShortName(teachers, '')).toBeNull()
  })
})

describe('detectSubjectFromMatrix', () => {
  it('nhận diện môn từ tiêu đề file', () => {
    expect(detectSubjectFromMatrix([['THỜI KHÓA BIỂU MÔN QUỐC PHÒNG HK II NĂM 2025 - 2026']])).toBe('GDQP AN')
    expect(detectSubjectFromMatrix([['THỜI KHÓA BIỂU MÔN THỂ DỤC HK II NĂM 2025 - 2026']])).toBe('Giáo dục thể chất')
    expect(detectSubjectFromMatrix([['THỜI KHÓA BIỂU MÔN TIN HỌC HK II NĂM 2025 - 2026']])).toBe('Tin học')
  })
})

describe('normalizeMatrixScheduleRows', () => {
  const teachers = [
    { id: 'gv_01', name: 'Võ Chí Diễn' },
    { id: 'gv_02', name: 'Dương Thành Được' },
  ]
  const matrix = [
    ['THỜI KHÓA BIỂU MÔN QUỐC PHÒNG HK I NĂM 2025 - 2026'],
    ['ĐỊA ĐIỂM: PHÒNG MÁY 3,4 + TIẾNG ANH'],
    [],
    ['THỨ ', 'BUỔI', 'TIẾT', 'GIÁO VIÊN DẠY AN NINH QUỐC PHÒNG'],
    ['', '', '', 'Thầy Diễn', 'Thầy Được'],
    ['2', 'Sáng', '1', '', ''],
    ['', '', '2', '', '11A1'],
    ['', 'Chiều', '2', '12A1', ''],
  ]

  it('chuẩn hóa lưới TKB theo cột giáo viên', () => {
    const result = normalizeMatrixScheduleRows(matrix, { teachers, periodId: 'hk2' })

    expect(result.errors).toEqual([])
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toMatchObject({
      period_id: 'hk2',
      teacher_id: 'gv_02',
      thu: 2,
      tiet: 2,
      tiet_trong_buoi: 2,
      buoi: 'Sáng',
      lop: '11A1',
      mon: 'GDQP AN',
    })
    expect(result.rows[1]).toMatchObject({
      teacher_id: 'gv_01',
      thu: 2,
      tiet: 7,
      buoi: 'Chiều',
      lop: '12A1',
      mon: 'GDQP AN',
    })
  })

  it('nhận diện môn và ô dạng Lớp-Môn trong file Tin học', () => {
    const tinMatrix = [
      ['Thứ', 'Buổi', 'Tiết', 'Tin học'],
      ['', '', '', 'Khang', 'Duy'],
      ['2', 'S', '1', '(12D3-Chào cờ)', ''],
      ['', '', '2', '', '12D4-Tin học'],
    ]
    const result = normalizeMatrixScheduleRows(tinMatrix, { teachers: [{ id: 'gv_01', name: 'Lưu Tấn Khang' }, { id: 'gv_02', name: 'Trần Thanh Duy' }], periodId: 'hk2' })

    expect(result.errors).toEqual([])
    expect(result.rows[0]).toMatchObject({ teacher_id: 'gv_01', tiet: 1, lop: '12D3', mon: 'HĐ trải nghiệm, hướng nghiệp' })
    expect(result.rows[1]).toMatchObject({ teacher_id: 'gv_02', tiet: 2, lop: '12D4', mon: 'Tin học' })
  })

  it('báo lỗi khi thiếu đợt TKB hoặc giáo viên không khớp', () => {
    const result = normalizeMatrixScheduleRows(matrix, { teachers, periodId: '' })

    expect(result.errors[0]).toMatch(/Chưa chọn đợt/)
  })
})
