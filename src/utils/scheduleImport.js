const aliases = {
  teacher: ['Giáo viên', 'Giao vien', 'GV', 'teacher', 'teacher_name'],
  teacherId: ['Mã GV', 'Ma GV', 'teacher_id'],
  thu: ['Thứ', 'Thu', 'thu', 'day'],
  tiet: ['Tiết', 'Tiet', 'tiet', 'period'],
  lop: ['Lớp', 'Lop', 'lop', 'class'],
  mon: ['Môn', 'Mon', 'mon', 'subject'],
}

const TITLE_TOKENS = new Set(['thầy', 'cô', 't', 'th', 'gv', 'thầygiáo', 'côgiáo'])

const MON_HDTN = 'HĐ trải nghiệm, hướng nghiệp'

function normalizeNameTokens(value) {
  return String(value)
    .toLowerCase()
    .replace(/[.,:;()]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

function lastWord(name) {
  return name.trim().split(/\s+/).pop().toLowerCase()
}

function firstWord(name) {
  return name.trim().split(/\s+/)[0].toLowerCase()
}

export function matchTeacherByShortName(teachers, rawName) {
  if (!rawName) return null
  const tokens = normalizeNameTokens(rawName).filter((token) => !TITLE_TOKENS.has(token))
  if (!tokens.length) return null
  const exact = teachers.find((teacher) => teacher.name.localeCompare(rawName.trim(), 'vi', { sensitivity: 'base' }) === 0)
  if (exact) return exact
  const candidates = teachers.filter((teacher) => {
    const teacherTokens = normalizeNameTokens(teacher.name)
    return tokens.some((token) => teacherTokens.includes(token))
  })
  if (candidates.length === 1) return candidates[0]
  const byGivenName = candidates.filter((teacher) => tokens.includes(lastWord(teacher.name)))
  if (byGivenName.length === 1) return byGivenName[0]
  if (byGivenName.length > 1) {
    const withFamily = byGivenName.filter((teacher) => tokens.includes(firstWord(teacher.name)))
    if (withFamily.length === 1) return withFamily[0]
  }
  return null
}

function isMatrixHeader(row) {
  const [a, b, c] = row
  return (
    /^th[ứu]$/i.test(String(a || '').trim()) &&
    /^bu[ổo]i$/i.test(String(b || '').trim()) &&
    /^ti[ếe]t$/i.test(String(c || '').trim())
  )
}

export function detectSubjectFromMatrix(matrix) {
  const text = matrix
    .slice(0, 8)
    .flat()
    .join(' ')
    .toUpperCase()
  if (text.includes('QUỐC PHÒNG')) return 'GDQP AN'
  if (text.includes('THỂ DỤC')) return 'Giáo dục thể chất'
  if (text.includes('TIN HỌC')) return 'Tin học'
  return ''
}

function normalizeBuoi(value) {
  const v = String(value || '').trim().toLowerCase()
  if (v === 's' || v === 'sáng') return 'Sáng'
  if (v === 'c' || v === 'chiều') return 'Chiều'
  return String(value || '').trim()
}

function normalizeMatrixMon(raw) {
  const mon = String(raw).trim()
  const low = mon.toLowerCase()
  if (low.includes('tin')) return 'Tin học'
  if (low.includes('chào cờ') || low.includes('hđtn') || low.includes('shl')) return MON_HDTN
  return mon
}

function parseMatrixCell(cell, defaultMon) {
  let value = String(cell).trim()
  if (value.startsWith('(') && value.endsWith(')')) value = value.slice(1, -1).trim()
  const dash = value.indexOf('-')
  if (dash > 0) {
    const lop = value.slice(0, dash).trim()
    const mon = normalizeMatrixMon(value.slice(dash + 1).trim())
    if (!lop || !mon) return null
    return { lop, mon }
  }
  if (!defaultMon) return null
  return { lop: value, mon: defaultMon }
}

export function normalizeMatrixScheduleRows(matrix, { teachers, periodId }) {
  const rows = []
  const errors = []
  const seen = new Set()
  const headerIdx = matrix.findIndex(isMatrixHeader)
  if (headerIdx < 0) {
    return { rows, errors: ['Không nhận diện được định dạng lưới TKB (THỨ, BUỔI, TIẾT).'] }
  }
  const teacherRow = matrix[headerIdx + 1] || []
  const teacherCols = teacherRow
    .map((name, col) => ({ col, name: String(name).trim() }))
    .filter((item) => item.col >= 3 && item.name)
  if (!teacherCols.length) {
    return { rows, errors: ['Không tìm thấy dòng tên giáo viên dạy môn.'] }
  }
  if (!periodId) errors.push('Chưa chọn đợt TKB')
  const defaultMon = detectSubjectFromMatrix(matrix)
  const mappedCols = teacherCols.map(({ col, name }) => ({
    col,
    name,
    teacher: matchTeacherByShortName(teachers, name),
  }))
  mappedCols.forEach(({ name, teacher }) => {
    if (!teacher) errors.push(`Cột '${name}' không khớp giáo viên nào trong danh sách.`)
  })

  let currentThu = 0
  let currentBuoi = ''
  matrix.slice(headerIdx + 2).forEach((row, offset) => {
    const line = headerIdx + offset + 3
    const rawThu = String(row[0] || '').trim()
    const rawBuoi = String(row[1] || '').trim()
    const rawTiet = String(row[2] || '').trim()
    if (rawThu) currentThu = Number(rawThu)
    if (rawBuoi) currentBuoi = normalizeBuoi(rawBuoi)
    const tietTrongBuoi = Number(rawTiet)
    if (!currentThu || currentThu < 2 || currentThu > 7) return
    if (!Number.isInteger(tietTrongBuoi) || tietTrongBuoi < 1 || tietTrongBuoi > 5) return
    if (!currentBuoi) return
    const buoi = currentBuoi
    const tiet = tietTrongBuoi + (buoi === 'Chiều' ? 5 : 0)
    mappedCols.forEach(({ col, teacher }) => {
      const cell = String(row[col] || '').trim()
      if (!cell || !teacher) return
      const parsed = parseMatrixCell(cell, defaultMon)
      if (!parsed) {
        errors.push(`Dòng ${line}: ô '${cell}' không hợp lệ.`)
        return
      }
      const key = `${teacher.id}|${currentThu}|${tiet}`
      if (seen.has(key)) {
        errors.push(`Dòng ${line}: trùng lịch ${teacher.name}, thứ ${currentThu} và tiết ${tiet} trong file.`)
        return
      }
      seen.add(key)
      rows.push({
        period_id: periodId,
        teacher_id: teacher.id,
        thu: currentThu,
        tiet,
        tiet_trong_buoi: tietTrongBuoi,
        buoi,
        lop: parsed.lop,
        mon: parsed.mon,
      })
    })
  })
  return { rows, errors }
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
  const matrix = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '', raw: false })
  if (matrix.some(isMatrixHeader)) {
    return normalizeMatrixScheduleRows(matrix, options)
  }
  const rawRows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })
  return normalizeScheduleRows(rawRows, options)
}
