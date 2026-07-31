import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(process.cwd())
const DATA_PATH = path.join(ROOT, 'src', 'data', 'schoolData.json')
const PARSED_PATH = path.join(ROOT, 'output', 'parsed_tkb.json')

const parsed = JSON.parse(readFileSync(PARSED_PATH, 'utf8'))
const data = JSON.parse(readFileSync(DATA_PATH, 'utf8'))

const allParsed = [
  ...parsed.tin.schedules,
  ...parsed.td.schedules,
  ...parsed.qp.schedules,
]

const byTeacherMon = new Map()
for (const s of allParsed) {
  const key = `${s.teacher_id}|${s.mon}`
  if (!byTeacherMon.has(key)) byTeacherMon.set(key, new Set())
  byTeacherMon.get(key).add(s.lop)
}

const existingKeys = new Set(data.schedules.map((s) => `${s.teacher_id}|${s.thu}|${s.tiet}|${s.lop}|${s.mon}`))
let nextId = 1000
const newSchedules = []
for (const s of allParsed) {
  const key = `${s.teacher_id}|${s.thu}|${s.tiet}|${s.lop}|${s.mon}`
  if (existingKeys.has(key)) continue
  newSchedules.push({ ...s, id: `tkb_${String(nextId++).padStart(3, '0')}` })
}

data.schedules = [...data.schedules, ...newSchedules]
data.schedules.sort((a, b) => a.thu - b.thu || a.tiet - b.tiet)

const subjectByTeacher = new Map()
for (const s of data.schedules) {
  if (!subjectByTeacher.has(s.teacher_id)) subjectByTeacher.set(s.teacher_id, new Set())
  subjectByTeacher.get(s.teacher_id).add(s.mon)
}

for (const teacher of data.teachers) {
  if (!teacher.mon_day || teacher.mon_day.length === 0) {
    teacher.mon_day = [...(subjectByTeacher.get(teacher.id) || [])]
  }
}

const assignmentMap = new Map(data.assignments.map((a) => [`${a.teacher_id}|${a.mon}`, a]))
const newAssignments = []
for (const [key, classes] of byTeacherMon) {
  const [teacherId, mon] = key.split('|')
  const tietInWeek = data.schedules.filter((s) => s.teacher_id === teacherId && s.mon === mon).length
  const existing = assignmentMap.get(key)
  const record = {
    ...(existing || {}),
    id: existing?.id || `pc_${teacherId}_${mon}`,
    period_id: 'hk2_2025_2026',
    teacher_id: teacherId,
    mon,
    classes: [...classes].sort(),
    so_lop: classes.size,
    so_tiet_tuan: tietInWeek,
    tiet_chuan: existing?.tiet_chuan ?? 17,
    hoc_ky: 2,
  }
  newAssignments.push(record)
  assignmentMap.set(key, record)
}

const orphanAssignments = data.assignments.filter((a) => !byTeacherMon.has(`${a.teacher_id}|${a.mon}`))
data.assignments = [...newAssignments, ...orphanAssignments]

writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8')

console.log('Schedules:', data.schedules.length, '(thêm', newSchedules.length, ')')
console.log('Assignments:', data.assignments.length)
console.log('Teachers:', data.teachers.length)
console.log('GV môn trống đã cập nhật:', data.teachers.filter((t) => t.mon_day.length === 0).length === 0)
