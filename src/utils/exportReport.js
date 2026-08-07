export function buildSummaryExportRows(summary) {
  return summary.map((row) => ({
    'Giáo viên': row.name,
    Môn: row.mon_day.join(', '),
    'Tiết chuẩn': row.tiet_chuan,
    'Tiết/tuần': row.so_tiet_tuan,
    'Tiết thế': row.tiet_the,
    'Thừa/Thiếu': row.thua_thieu,
  }))
}

export function buildHistoryExportRows(history, teachers) {
  const teacherName = (id) => teachers.find((teacher) => teacher.id === id)?.name
  return history.map((row) => ({
    Ngày: row.ngay,
    Thứ: row.thu,
    Buổi: row.buoi || (row.tiet > 5 ? 'Chiều' : 'Sáng'),
    'Tiết trong buổi': row.tiet_trong_buoi || (row.tiet > 5 ? row.tiet - 5 : row.tiet),
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
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 14 }]
  historySheet['!cols'] = [{ wch: 12 }, { wch: 7 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 25 }, { wch: 25 }, { wch: 10 }, { wch: 12 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tong hop')
  XLSX.utils.book_append_sheet(workbook, historySheet, 'Lich su')
  XLSX.writeFile(workbook, filename)
}

const stripDiacritics = (value) =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')

function describeLesson(row) {
  const soTiet = Number(row.tiet) || 0
  const buoi = row.buoi || (soTiet > 5 ? 'Chiều' : 'Sáng')
  const tietTrongBuoi = Number(row.tiet_trong_buoi) || (buoi === 'Chiều' ? soTiet - 5 : soTiet)
  return { buoi, tietTrongBuoi }
}

function teacherName(teachers, id) {
  return teachers.find((teacher) => teacher.id === id)?.name || 'Chưa phân công'
}

async function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

async function loadVietnameseFonts(doc) {
  try {
    const [regular, bold] = await Promise.all([
      fetch(`${import.meta.env.BASE_URL}fonts/DejaVuSans.ttf`).then((response) => response.arrayBuffer()),
      fetch(`${import.meta.env.BASE_URL}fonts/DejaVuSans-Bold.ttf`).then((response) => response.arrayBuffer()),
    ])
    doc.addFileToVFS('DejaVuSans.ttf', await arrayBufferToBase64(regular))
    doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal')
    doc.addFileToVFS('DejaVuSans-Bold.ttf', await arrayBufferToBase64(bold))
    doc.addFont('DejaVuSans-Bold.ttf', 'DejaVuSans', 'bold')
    return true
  } catch {
    return false
  }
}

function addSignatureBlock(doc, y, { fullName = 'Trần Thanh Duy', fallback = false, note = '' } = {}) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const fontName = fallback ? 'helvetica' : 'DejaVuSans'
  const today = new Date()
  const dateText = `Cà Mau, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`
  doc.setFont(fontName, 'normal')
  doc.setFontSize(9)
  doc.text(fallback ? stripDiacritics(note) : note, 14, y, { maxWidth: pageWidth - 100 })
  doc.setFontSize(10)
  doc.text(fallback ? stripDiacritics(dateText) : dateText, pageWidth - 20, y, { align: 'right' })
  doc.setFont(fontName, 'bold')
  doc.setFontSize(11)
  doc.text(fallback ? 'TO TRUONG CHUYEN MON' : 'TỔ TRƯỞNG CHUYÊN MÔN', pageWidth - 20, y + 16, { align: 'right' })
  doc.setFont(fontName, 'normal')
  doc.setFontSize(9)
  doc.text(fallback ? '(Da ky, ghi ro ho va ten)' : '(Đã ký, ghi rõ họ và tên)', pageWidth - 20, y + 24, { align: 'right' })
  doc.setFont(fontName, 'bold')
  doc.setFontSize(11)
  doc.text(fallback ? stripDiacritics(fullName) : fullName, pageWidth - 20, y + 32, { align: 'right' })
}

const headStyles = { fillColor: [30, 64, 175], font: 'DejaVuSans', fontStyle: 'bold' }
const bodyStyles = { font: 'DejaVuSans', fontSize: 9 }
const fallbackHeadStyles = { fillColor: [30, 64, 175], font: 'helvetica', fontStyle: 'bold' }
const fallbackBodyStyles = { font: 'helvetica', fontSize: 9 }

export async function exportReportPdf({ summary, history = [], teachers = [], filename = 'bao-cao-day-the.pdf', nguoiKy = 'Trần Thanh Duy' }) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const autoTable = autoTableModule.default
  const doc = new jsPDF({ orientation: 'landscape' })
  const vi = await loadVietnameseFonts(doc)
  const fontName = vi ? 'DejaVuSans' : 'helvetica'
  const fix = (value) => (vi ? value : stripDiacritics(value))
  doc.setFont(fontName, 'bold')
  doc.setFontSize(16)
  doc.text(fix('BÁO CÁO PHÂN CÔNG DẠY THẾ'), 14, 16)
  doc.setFont(fontName, 'normal')
  doc.setFontSize(10)
  doc.text(fix(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`), 14, 23)
  autoTable(doc, {
    startY: 29,
    head: [['Giáo viên', 'Môn', 'Tiết chuẩn', 'Tiết/tuần', 'Tiết thế', 'Thừa/Thiếu']],
    body: summary.map((row) => [
      fix(row.name),
      fix(row.mon_day.join(', ')),
      row.tiet_chuan,
      row.so_tiet_tuan,
      row.tiet_the,
      row.thua_thieu,
    ]),
    theme: 'grid',
    headStyles: vi ? headStyles : fallbackHeadStyles,
    styles: vi ? bodyStyles : fallbackBodyStyles,
  })
  const summaryEndY = doc.lastAutoTable?.finalY || 60
  if (history.length) {
    doc.addPage()
    doc.setFont(fontName, 'bold')
    doc.setFontSize(14)
    doc.text(fix('CHI TIẾT LỊCH SỬ PHÂN CÔNG'), 14, 16)
    autoTable(doc, {
      startY: 22,
      head: [['Ngày', 'Thứ', 'Buổi', 'Tiết', 'Lớp', 'Môn', 'GV vắng', 'GV dạy thế', 'Ghi chú']],
      body: history.map((row) => {
        const lesson = describeLesson(row)
        return [
          row.ngay,
          row.thu,
          fix(lesson.buoi),
          lesson.tietTrongBuoi,
          row.lop,
          fix(row.mon),
          fix(teacherName(teachers, row.nghi_teacher_id)),
          fix(teacherName(teachers, row.the_teacher_id)),
          fix(row.ghi_chu || ''),
        ]
      }),
      theme: 'grid',
      headStyles: vi ? headStyles : fallbackHeadStyles,
      styles: vi ? bodyStyles : fallbackBodyStyles,
    })
  }
  const historyEndY = doc.lastAutoTable?.finalY || 100
  const pageHeight = doc.internal.pageSize.getHeight()
  const signatureY = Math.min(pageHeight - 55, (history.length ? historyEndY : summaryEndY) + 20)
  addSignatureBlock(doc, signatureY, {
    fullName: nguoiKy,
    fallback: !vi,
    note: 'Báo cáo tổng hợp phân công dạy thế trong học kỳ để trình Tổ chuyên môn và Ban Giám hiệu nhà trường.',
  })
  doc.save(filename)
}

export async function exportAssignmentPdf({
  ngay,
  thu,
  absentTeacher,
  records,
  teachers = [],
  filename = 'phieu-phan-cong-day-thay.pdf',
  nguoiKy = 'Trần Thanh Duy',
}) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const autoTable = autoTableModule.default
  const doc = new jsPDF({ orientation: 'landscape' })
  const vi = await loadVietnameseFonts(doc)
  const fontName = vi ? 'DejaVuSans' : 'helvetica'
  const fix = (value) => (vi ? value : stripDiacritics(value))
  doc.setFont(fontName, 'bold')
  doc.setFontSize(16)
  doc.text(fix('PHIẾU PHÂN CÔNG DẠY THẾ'), 14, 16)
  doc.setFont(fontName, 'normal')
  doc.setFontSize(10)
  doc.text(fix(`Ngày: ${ngay} - Thứ ${thu}`), 14, 23)
  doc.text(fix(`Giáo viên vắng: ${absentTeacher}`), 14, 29)
  autoTable(doc, {
    startY: 35,
    head: [['Buổi', 'Tiết', 'Lớp', 'Môn', 'GV dạy thế', 'Ghi chú']],
    body: records.map((row) => {
      const lesson = describeLesson(row)
      return [
        fix(lesson.buoi),
        lesson.tietTrongBuoi,
        row.lop,
        fix(row.mon),
        fix(teacherName(teachers, row.the_teacher_id)),
        fix(row.ghi_chu || ''),
      ]
    }),
    theme: 'grid',
    headStyles: vi ? headStyles : fallbackHeadStyles,
    styles: vi ? bodyStyles : fallbackBodyStyles,
  })
  const tableEndY = doc.lastAutoTable?.finalY || 60
  const pageHeight = doc.internal.pageSize.getHeight()
  const signatureY = Math.min(pageHeight - 55, tableEndY + 20)
  addSignatureBlock(doc, signatureY, {
    fullName: nguoiKy,
    fallback: !vi,
  })
  doc.save(filename)
}

export async function exportAssignmentsByAbsentTeacher({
  records,
  teachers = [],
  filenamePrefix = 'phieu-phan-cong',
  nguoiKy = 'Trần Thanh Duy',
}) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const autoTable = autoTableModule.default

  const groupedByTeacher = new Map()
  records.forEach((row) => {
    if (!groupedByTeacher.has(row.nghi_teacher_id)) groupedByTeacher.set(row.nghi_teacher_id, [])
    groupedByTeacher.get(row.nghi_teacher_id).push(row)
  })

  for (const [teacherId, teacherRecords] of groupedByTeacher) {
    const teacher = teachers.find((item) => item.id === teacherId)
    const doc = new jsPDF({ orientation: 'landscape' })
    const vi = await loadVietnameseFonts(doc)
    const fontName = vi ? 'DejaVuSans' : 'helvetica'
    const fix = (value) => (vi ? value : stripDiacritics(value))
    const cleanName = stripDiacritics(teacher?.name || teacherId).replace(/\s+/g, '-')

    doc.setFont(fontName, 'bold')
    doc.setFontSize(16)
    doc.text(fix('PHIẾU PHÂN CÔNG DẠY THẾ'), 14, 16)
    doc.setFont(fontName, 'normal')
    doc.setFontSize(10)
    doc.text(fix(`Giáo viên vắng: ${teacher?.name || teacherId}`), 14, 23)

    const sorted = sortRecordsByWeekday(teacherRecords)
    autoTable(doc, {
      startY: 29,
      head: [['Ngày', 'Buổi', 'Tiết', 'Lớp', 'Môn', 'GV dạy thế', 'Ghi chú']],
      body: sorted.map((row) => {
        const lesson = describeLesson(row)
        return [
          `${row.ngay} (${fix(weekdayLabel(row.ngay))})`,
          fix(lesson.buoi),
          lesson.tietTrongBuoi,
          row.lop,
          fix(row.mon),
          fix(teacherName(teachers, row.the_teacher_id)),
          fix(row.ghi_chu || ''),
        ]
      }),
      theme: 'grid',
      headStyles: vi ? headStyles : fallbackHeadStyles,
      styles: vi ? bodyStyles : fallbackBodyStyles,
      columnStyles: {
        0: { cellWidth: 46 },
      },
    })

    const tableEndY = doc.lastAutoTable?.finalY || 60
    const pageHeight = doc.internal.pageSize.getHeight()
    const signatureY = Math.min(pageHeight - 55, tableEndY + 20)
    addSignatureBlock(doc, signatureY, {
      fullName: nguoiKy,
      fallback: !vi,
    })
    doc.save(`${filenamePrefix}-${cleanName}.pdf`)
  }
}

const WEEKDAY_ORDER = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }
const VIETNAMESE_WEEKDAY = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']

function weekdayLabel(dateString) {
  const date = new Date(`${String(dateString).slice(0, 10)}T12:00:00`)
  return VIETNAMESE_WEEKDAY[date.getDay()] || 'Thứ 2'
}

function sortRecordsByWeekday(records) {
  return [...records].sort((a, b) => {
    const dayA = new Date(`${String(a.ngay).slice(0, 10)}T12:00:00`).getDay()
    const dayB = new Date(`${String(b.ngay).slice(0, 10)}T12:00:00`).getDay()
    const weekdayDiff = WEEKDAY_ORDER[dayA] - WEEKDAY_ORDER[dayB]
    if (weekdayDiff !== 0) return weekdayDiff
    const dateDiff = String(a.ngay).localeCompare(String(b.ngay))
    if (dateDiff !== 0) return dateDiff
    return (Number(a.tiet_trong_buoi) || a.tiet) - (Number(b.tiet_trong_buoi) || b.tiet)
  })
}
