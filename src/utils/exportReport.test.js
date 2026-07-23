import { describe, expect, it } from 'vitest'
import { buildHistoryExportRows, buildSummaryExportRows } from './exportReport'

describe('report export mapping', () => {
  it('ánh xạ tổng hợp đủ cột nghiệp vụ', () => {
    const rows = buildSummaryExportRows([
      { name: 'Lê Văn Cường', mon_day: ['Toán', 'Tin'], tiet_chuan: 17, tiet_the: 4, tong: 21, thua_thieu: 4 },
    ])
    expect(rows[0]).toEqual({
      'Giáo viên': 'Lê Văn Cường',
      Môn: 'Toán, Tin',
      'Tiết chuẩn': 17,
      'Tiết thế': 4,
      Tổng: 21,
      'Thừa/Thiếu': 4,
    })
  })

  it('ánh xạ lịch sử với tên GV vắng và GV thế', () => {
    const rows = buildHistoryExportRows(
      [{ ngay: '2025-09-22', tiet: 1, lop: '10A1', mon: 'Toán', nghi_teacher_id: 'gv_01', the_teacher_id: null, ghi_chu: 'Chờ xử lý' }],
      [{ id: 'gv_01', name: 'Nguyễn Văn An' }],
    )
    expect(rows[0]['GV vắng']).toBe('Nguyễn Văn An')
    expect(rows[0]['GV dạy thế']).toBe('Chưa phân công')
  })
})
