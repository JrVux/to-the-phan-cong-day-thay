import { describe, expect, it } from 'vitest'
import { buildHistoryExportRows, buildSummaryExportRows } from './exportReport'

describe('report export mapping', () => {
  it('ánh xạ tổng hợp đủ cột nghiệp vụ', () => {
    const rows = buildSummaryExportRows([
      { name: 'Lê Văn Cường', mon_day: ['Toán', 'Tin'], tiet_chuan: 17, so_tiet_tuan: 18, tiet_the: 4, so_tuan: 3, tong: 22, thua_thieu: 23 },
    ])
    expect(rows[0]).toEqual({
      'Giáo viên': 'Lê Văn Cường',
      Môn: 'Toán, Tin',
      'Tiết chuẩn': 17,
      'Tiết/tuần': 18,
      'Tiết thế': 4,
      'Số tuần qua': 3,
      'Thừa/Thiếu': 23,
    })
  })

  it('ánh xạ lịch sử với tên GV vắng và GV thế', () => {
    const rows = buildHistoryExportRows(
      [{ ngay: '2025-09-22', tiet: 8, tiet_trong_buoi: 3, buoi: 'Chiều', lop: '10A1', mon: 'Toán', nghi_teacher_id: 'gv_01', the_teacher_id: null, ghi_chu: 'Chờ xử lý' }],
      [{ id: 'gv_01', name: 'Nguyễn Văn An' }],
    )
    expect(rows[0]['GV vắng']).toBe('Nguyễn Văn An')
    expect(rows[0]['GV dạy thế']).toBe('Chưa phân công')
    expect(rows[0]['Buổi']).toBe('Chiều')
    expect(rows[0]['Tiết trong buổi']).toBe(3)
  })
})
