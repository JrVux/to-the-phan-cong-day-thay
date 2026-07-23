import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import XLSX from 'xlsx'

const PERIOD_ID = 'hk2_2025_2026'
const HEADER_TO_TEACHER = {
  Khang: 'Lưu Tấn Khang',
  'Anh.H Nguyễn': 'Nguyễn Hùng Anh',
  Tuyền: 'Nguyễn Thanh Tuyền',
  Vũ: 'Nguyễn Thanh Vũ',
  Kiên: 'Nguyễn Trung Kiên',
  Mộng: 'Nguyễn Văn Mộng',
  'Tiên.P': 'Phan Như Tiên',
  'Nghị Tạ': 'Tạ Hoàng Nghị',
  Thu: 'Trần Ngọc Thu',
  Duy: 'Trần Thanh Duy',
  Hương: 'Trần Thị Thanh Hương',
}

function text(value) {
  return String(value ?? '').trim()
}

function normalized(value) {
  return text(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/gi, 'd')
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('vi')
}

function displayName(value) {
  return text(value)
    .toLocaleLowerCase('vi')
    .replace(/(^|[\s-])\p{L}/gu, (letter) => letter.toLocaleUpperCase('vi'))
}

function sheetRows(workbook) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })
}

function parseAssignmentLines(value) {
  return text(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const separator = line.indexOf(':')
      if (separator < 0) return []
      const mon = line.slice(0, separator).trim()
      const classes = line
        .slice(separator + 1)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
      return [{ mon, classes }]
    })
}

function parseTeachersAndAssignments(workbook) {
  const rows = sheetRows(workbook)
  const headerIndex = rows.findIndex((row) => normalized(row[1]) === 'ho va ten')
  if (headerIndex < 0) throw new Error('Không tìm thấy cột Họ và tên trong file PCGD.')

  const teachers = []
  const assignments = []

  for (const row of rows.slice(headerIndex + 1)) {
    const name = displayName(row[1])
    if (!name) continue

    const teacher = {
      id: `gv_${String(teachers.length + 1).padStart(2, '0')}`,
      name,
      mon_day: [],
      active: true,
    }
    const parsedAssignments = parseAssignmentLines(row[2])
    teacher.mon_day = [...new Set(parsedAssignments.map((item) => item.mon))]
    teachers.push(teacher)

    parsedAssignments.forEach((assignment, index) => {
      assignments.push({
        id: `pc_${teacher.id}_${String(index + 1).padStart(2, '0')}`,
        period_id: PERIOD_ID,
        teacher_id: teacher.id,
        mon: assignment.mon,
        classes: assignment.classes,
        tiet_chuan: 17,
        hoc_ky: 2,
      })
    })
  }

  return { teachers, assignments }
}

function parseSchedules(workbook, teachers) {
  const rows = sheetRows(workbook)
  const headers = rows[1]?.slice(3).map(text) ?? []
  const teachersByName = new Map(teachers.map((teacher) => [normalized(teacher.name), teacher]))
  const teacherColumns = headers.map((header, index) => {
    const fullName = HEADER_TO_TEACHER[header]
    const teacher = teachersByName.get(normalized(fullName))
    if (!teacher) throw new Error(`Không ánh xạ được giáo viên TKB: ${header}`)
    return { column: index + 3, teacher }
  })

  let currentDay = null
  let currentSession = null
  const schedules = []

  for (const row of rows.slice(2)) {
    if (text(row[0])) currentDay = Number(row[0])
    if (text(row[1])) currentSession = text(row[1]).toLocaleUpperCase('vi')
    const periodInSession = Number(row[2])
    if (!currentDay || !currentSession || !periodInSession) continue

    for (const { column, teacher } of teacherColumns) {
      const cell = text(row[column])
      if (!cell || cell.startsWith('(')) continue
      const separator = cell.indexOf('-')
      if (separator < 1) continue

      const lop = cell.slice(0, separator).trim()
      const mon = cell.slice(separator + 1).trim()
      const afternoon = currentSession === 'C'
      schedules.push({
        id: `tkb_${String(schedules.length + 1).padStart(3, '0')}`,
        period_id: PERIOD_ID,
        teacher_id: teacher.id,
        thu: currentDay,
        tiet: periodInSession + (afternoon ? 5 : 0),
        tiet_trong_buoi: periodInSession,
        buoi: afternoon ? 'Chiều' : 'Sáng',
        lop,
        mon,
      })
    }
  }

  return schedules
}

export function convertSchoolData(pcgdPath, timetablePath) {
  const pcgdWorkbook = XLSX.readFile(pcgdPath)
  const timetableWorkbook = XLSX.readFile(timetablePath)
  const { teachers, assignments } = parseTeachersAndAssignments(pcgdWorkbook)
  const schedules = parseSchedules(timetableWorkbook, teachers)

  return {
    teachers,
    schedule_periods: [
      {
        id: PERIOD_ID,
        nam_hoc: '2025-2026',
        ten_dot: 'HK II — Năm học 2025–2026',
        tu_ngay: '2026-01-19',
        den_ngay: '2026-05-31',
        hoc_ky: 2,
      },
    ],
    schedules,
    assignments,
    substitutions: [],
    teacher_locks: [],
  }
}

function main() {
  const [, , pcgdPath, timetablePath, outputPath = 'src/data/schoolData.json'] = process.argv
  if (!pcgdPath || !timetablePath) {
    throw new Error(
      'Cách dùng: node scripts/import-school-data.mjs <Export_PCGD.xlsx> <Theo môn.xls> [output.json]',
    )
  }

  const data = convertSchoolData(pcgdPath, timetablePath)
  const absoluteOutput = path.resolve(outputPath)
  fs.mkdirSync(path.dirname(absoluteOutput), { recursive: true })
  fs.writeFileSync(absoluteOutput, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  process.stdout.write(
    `Đã tạo ${absoluteOutput}: ${data.teachers.length} giáo viên, ${data.assignments.length} phân công, ${data.schedules.length} tiết TKB.\n`,
  )
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main()
}
