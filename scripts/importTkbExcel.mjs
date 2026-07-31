import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { readdirSync } from 'node:fs'
import path from 'node:path'
import XLSX from 'xlsx'

const ROOT = path.resolve(process.cwd())
const DATA_PATH = path.join(ROOT, 'src', 'data', 'schoolData.json')

const TEACHER_MAP = {
  'Thầy Diễn': 'gv_04',
  'Thầy Được': 'gv_05',
  'Cô Phượng': 'gv_19',
  'Thầy Sinh': 'gv_20',
  'T Nghiêm': 'gv_12',
  'T M Toàn': 'gv_23',
  'T Minh': 'gv_10',
  'T Giang': 'gv_07',
  'T Khải': 'gv_16',
  'T Đăng': 'gv_02',
  'T Tính': 'gv_22',
  'T Đạt': 'gv_03',
  'T Thịnh': 'gv_13',
  'Khang': 'gv_09',
  'Anh.H Nguyễn': 'gv_01',
  'Tuyền': 'gv_15',
  'Vũ': 'gv_24',
  'Kiên': 'gv_17',
  'Mộng': 'gv_18',
  'Tiên.P': 'gv_21',
  'Nghị Tạ': 'gv_11',
  'Thu': 'gv_14',
  'Duy': 'gv_06',
  'Hương': 'gv_08',
}

const BUOI_TO_TIET_OFFSET = { S: 0, Sáng: 0, C: 5, Chiều: 5 }
const MON_MAP = { QP: 'GDQP AN', TD: 'Giáo dục thể chất' }

const CLASS_PATTERN = /^(?:\(\s*)?(\d{2}[A-E]\d)(?:\s*-\s*)?/i

function detectTeacherCols(row) {
  const thuRaw = String(row[0] ?? '').trim()
  const buoiRaw = String(row[1] ?? '').trim()
  const tietRaw = String(row[2] ?? '').trim()
  if (thuRaw || buoiRaw || tietRaw) return null
  const names = row
    .slice(3)
    .map((name, idx) => ({ name: String(name ?? '').trim(), col: idx + 3 }))
    .filter((item) => item.name)
  if (names.length < 2) return null
  const first = String(row[3] ?? '').trim()
  if (first.length > 15) return null
  return names
}

function findFiles() {
  const files = readdirSync(ROOT).filter((f) => /\.(xls|xlsx|csv)$/i.test(f))
  const tin = files.find((f) => /TIN/i.test(f))
  const td = files.find((f) => /TD/i.test(f) || /THỂ DỤC/i.test(f))
  const qp = files.find((f) => /QP/i.test(f) || /QUỐC PHÒNG/i.test(f) || /GDQP/i.test(f))
  return { tin, td, qp }
}

function parseGrid(filePath, subject) {
  if (!filePath) return []
  const wb = XLSX.readFile(filePath, { cellDates: false })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '', header: 1 })
  const schedules = []
  let teacherCols = []
  let errors = []
  let currentThu = ''
  let currentBuoi = ''

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const detected = detectTeacherCols(row)
    if (detected) {
      teacherCols = detected
      currentThu = ''
      currentBuoi = ''
      continue
    }
    if (!teacherCols.length) continue

    const thuRaw = String(row[0] ?? '').trim() || currentThu
    const buoiRaw = String(row[1] ?? '').trim() || currentBuoi
    const tietRaw = String(row[2] ?? '').trim()
    if (!thuRaw || !buoiRaw || !tietRaw) continue
    currentThu = thuRaw
    currentBuoi = buoiRaw

    const thu = Number(thuRaw)
    const buoi = buoiRaw === 'C' ? 'Chiều' : buoiRaw
    const tietTrongBuoi = Number(tietRaw)
    const offset = BUOI_TO_TIET_OFFSET[buoi]
    if (!Number.isInteger(thu) || thu < 2 || thu > 7) continue
    if (!Number.isInteger(tietTrongBuoi) || tietTrongBuoi < 1 || tietTrongBuoi > 5) continue
    if (offset === undefined) continue

    const tiet = offset + tietTrongBuoi
    for (const { name, col } of teacherCols) {
      const cell = String(row[col] ?? '').trim()
      if (!cell) continue
      const teacherId = TEACHER_MAP[name]
      if (!teacherId) {
        errors.push(`Không tìm thấy GV "${name}" (dòng ${i + 1})`)
        continue
      }
      const match = cell.match(CLASS_PATTERN)
      if (!match) {
        errors.push(`Ô không hợp lệ "${cell}" (dòng ${i + 1})`)
        continue
      }
      const lop = match[1]
      const mon = subject
      schedules.push({
        period_id: 'hk2_2025_2026',
        teacher_id: teacherId,
        thu,
        tiet,
        tiet_trong_buoi: tietTrongBuoi,
        buoi,
        lop,
        mon,
      })
    }
  }
  return { schedules, errors }
}

function parseTin(filePath) {
  if (!filePath) return { schedules: [], errors: [] }
  const wb = XLSX.readFile(filePath, { cellDates: false })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '', header: 1 })
  const schedules = []
  const errors = []
  let teacherCols = []
  let currentThu = ''
  let currentBuoi = ''

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const detected = detectTeacherCols(row)
    if (detected) {
      teacherCols = detected
      currentThu = ''
      currentBuoi = ''
      continue
    }
    if (!teacherCols.length) continue
    const thuRaw = String(row[0] ?? '').trim() || currentThu
    const buoiRaw = String(row[1] ?? '').trim() || currentBuoi
    const tietRaw = String(row[2] ?? '').trim()
    if (!thuRaw || !buoiRaw || !tietRaw) continue
    currentThu = thuRaw
    currentBuoi = buoiRaw
    const thu = Number(thuRaw)
    const buoi = buoiRaw === 'C' ? 'Chiều' : buoiRaw
    const tietTrongBuoi = Number(tietRaw)
    const offset = BUOI_TO_TIET_OFFSET[buoi]
    if (!Number.isInteger(thu) || thu < 2 || thu > 7) continue
    if (!Number.isInteger(tietTrongBuoi) || tietTrongBuoi < 1 || tietTrongBuoi > 5) continue
    if (offset === undefined) continue
    const tiet = offset + tietTrongBuoi
    for (const { name, col } of teacherCols) {
      const cell = String(row[col] ?? '').trim()
      if (!cell) continue
      const teacherId = TEACHER_MAP[name]
      if (!teacherId) {
        errors.push(`Không tìm thấy GV "${name}" (dòng ${i + 1})`)
        continue
      }
      if (!/Tin học/i.test(cell)) {
        continue
      }
      const match = cell.match(CLASS_PATTERN)
      if (!match) {
        errors.push(`Ô không hợp lệ "${cell}" (dòng ${i + 1})`)
        continue
      }
      schedules.push({
        period_id: 'hk2_2025_2026',
        teacher_id: teacherId,
        thu,
        tiet,
        tiet_trong_buoi: tietTrongBuoi,
        buoi,
        lop: match[1],
        mon: 'Tin học',
      })
    }
  }
  return { schedules, errors }
}

const { tin, td, qp } = findFiles()
console.log('Files:', JSON.stringify({ tin, td, qp }, null, 2))

const tinResult = parseTin(tin)
const tdResult = parseGrid(td, MON_MAP.TD)
const qpResult = parseGrid(qp, MON_MAP.QP)

for (const [label, result] of [['TIN', tinResult], ['TD', tdResult], ['QP', qpResult]]) {
  console.log(`\n${label}: ${result.schedules.length} dòng`)
  console.log('Errors:', result.errors.length ? result.errors : 'không có')
}

const byTeacher = (rows) => {
  const map = {}
  rows.forEach((s) => {
    map[s.teacher_id] = (map[s.teacher_id] || 0) + 1
  })
  return Object.entries(map).sort((a, b) => b[1] - a[1])
}

console.log('\n--- Số tiết/tuần theo GV ---')
const combined = [...tinResult.schedules, ...tdResult.schedules, ...qpResult.schedules]
console.table(byTeacher(combined).map(([id, count]) => ({ id, tiet: count })))

console.log('\n--- So sánh với TIN hiện có trong schoolData.json ---')
const data = JSON.parse(readFileSync(DATA_PATH, 'utf8'))
const existingTin = data.schedules.filter((s) => s.mon === 'Tin học')
console.log('Existing Tin:', existingTin.length, 'vs Parsed Tin:', tinResult.schedules.length)
const existingKey = new Set(existingTin.map((s) => `${s.teacher_id}|${s.thu}|${s.tiet}|${s.lop}`))
const parsedKey = new Set(tinResult.schedules.map((s) => `${s.teacher_id}|${s.thu}|${s.tiet}|${s.lop}`))
const missing = tinResult.schedules.filter((s) => !existingKey.has(`${s.teacher_id}|${s.thu}|${s.tiet}|${s.lop}`))
const extra = existingTin.filter((s) => !parsedKey.has(`${s.teacher_id}|${s.thu}|${s.tiet}|${s.lop}`))
console.log('Tin parsed nhưng chưa có:', missing.length)
console.log('Tin có nhưng parsed thiếu:', extra.length)
if (missing.length) console.log('Ví dụ missing:', missing.slice(0, 5))
if (extra.length) console.log('Ví dụ extra:', extra.slice(0, 5))

writeFileSync(
  path.join(ROOT, 'output', 'parsed_tkb.json'),
  JSON.stringify({ tin: tinResult, td: tdResult, qp: qpResult }, null, 2),
)
console.log('\nĐã ghi kết quả ra output/parsed_tkb.json')
