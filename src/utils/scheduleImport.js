const aliases = {
  teacher: ['Giáo viên', 'Giao vien', 'GV', 'teacher', 'teacher_name'],
  teacherId: ['Mã GV', 'Ma GV', 'teacher_id'],
  thu: ['Thứ', 'Thu', 'thu', 'day'],
  tiet: ['Tiết', 'Tiet', 'tiet', 'period'],
  lop: ['Lớp', 'Lop', 'lop', 'class'],
  mon: ['Môn', 'Mon', 'mon', 'subject'],
}

function valueFor(row, keys) {
  const key = keys.find((item) => Object.hasOwn(row, item))
  return key ? row[key] : undefined
}

export function normalizeScheduleRows(rawRows, { teachers, periodId }) {
  const rows = []
  const errors = []
  const seen = new Set()

  rawRows.forEach((raw, index) => {
    const line = index + 2
    const teacherIdValue = String(valueFor(raw, aliases.teacherId) || '').trim()
    const teacherName = String(valueFor(raw, aliases.teacher) || '').trim()
    const teacher = teachers.find(
      (item) =>
        (teacherIdValue && item.id === teacherIdValue) ||
        (teacherName && item.name.localeCompare(teacherName, 'vi', { sensitivity: 'base' }) === 0),
    )
    const thu = Number(valueFor(raw, aliases.thu))
    const tiet = Number(valueFor(raw, aliases.tiet))
    const lop = String(valueFor(raw, aliases.lop) || '').trim()
    const mon = String(valueFor(raw, aliases.mon) || '').trim()
    const rowErrors = []
    if (!teacher) rowErrors.push('không tìm thấy giáo viên')
    if (!Number.isInteger(thu) || thu < 2 || thu > 7) rowErrors.push('Thứ phải từ 2–7')
    if (!Number.isInteger(tiet) || tiet < 1 || tiet > 10) rowErrors.push('Tiết phải từ 1–10')
    if (!lop) rowErrors.push('thiếu Lớp')
    if (!mon) rowErrors.push('thiếu Môn')
    if (!periodId) rowErrors.push('chưa chọn đợt TKB')
    if (rowErrors.length) {
      errors.push(`Dòng ${line}: ${rowErrors.join(', ')}`)
      return
    }
    const key = `${teacher.id}|${thu}|${tiet}`
    if (seen.has(key)) {
      errors.push(`Dòng ${line}: trùng lịch giáo viên, thứ và tiết trong file`)
      return
    }
    seen.add(key)
    rows.push({
      period_id: periodId,
      teacher_id: teacher.id,
      thu,
      tiet,
      lop,
      mon,
    })
  })
  return { rows, errors }
}

export async function parseScheduleFile(file, options) {
  const XLSX = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const rawRows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })
  return normalizeScheduleRows(rawRows, options)
}
