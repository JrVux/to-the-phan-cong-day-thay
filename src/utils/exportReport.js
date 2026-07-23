export function buildSummaryExportRows(summary) {
  return summary.map((row) => ({
    'Giáo viên': row.name,
    Môn: row.mon_day.join(', '),
    'Tiết chuẩn': row.tiet_chuan,
    'Tiết thế': row.tiet_the,
    Tổng: row.tong,
    'Thừa/Thiếu': row.thua_thieu,
  }))
}

export function buildHistoryExportRows(history, teachers) {
  const teacherName = (id) => teachers.find((teacher) => teacher.id === id)?.name
  return history.map((row) => ({
    Ngày: row.ngay,
    Thứ: row.thu,
    Tiết: row.tiet,
    Lớp: row.lop,
    Môn: row.mon,
    'GV vắng': teacherName(row.nghi_teacher_id) || row.nghi_teacher_id,
    'GV dạy thế': teacherName(row.the_teacher_id) || 'Chưa phân công',
    'Học kỳ': row.hoc_ky,
    'Năm học': row.nam_hoc,
    'Ghi chú': row.ghi_chu || '',
  }))
}

export async function exportReportExcel({ summary, history, teachers, filename = 'bao-cao-day-the.xlsx' }) {
  const XLSX = await import('xlsx')
  const workbook = XLSX.utils.book_new()
  const summarySheet = XLSX.utils.json_to_sheet(buildSummaryExportRows(summary))
  const historySheet = XLSX.utils.json_to_sheet(buildHistoryExportRows(history, teachers))
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }]
  historySheet['!cols'] = [{ wch: 12 }, { wch: 7 }, { wch: 7 }, { wch: 10 }, { wch: 10 }, { wch: 25 }, { wch: 25 }, { wch: 10 }, { wch: 12 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tong hop')
  XLSX.utils.book_append_sheet(workbook, historySheet, 'Lich su')
  XLSX.writeFile(workbook, filename)
}

export async function exportReportPdf({ summary, filename = 'bao-cao-day-the.pdf' }) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const autoTable = autoTableModule.default
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(16)
  doc.text('BAO CAO PHAN CONG DAY THE', 14, 16)
  doc.setFontSize(10)
  doc.text(`Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`, 14, 23)
  autoTable(doc, {
    startY: 29,
    head: [['Giao vien', 'Mon', 'Tiet chuan', 'Tiet the', 'Tong', 'Thua/Thieu']],
    body: summary.map((row) => [
      row.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D'),
      row.mon_day.join(', ').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      row.tiet_chuan,
      row.tiet_the,
      row.tong,
      row.thua_thieu,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175] },
  })
  doc.save(filename)
}
