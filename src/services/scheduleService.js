import { db, makeId } from './db'
import { computeEffectiveTietChuan, computePhuCapChuNhiem } from './roleService'

const asDateOnly = (value) => {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

export function getVietnameseWeekday(date) {
  const day = new Date(`${asDateOnly(date)}T12:00:00`).getDay()
  return day === 0 ? 8 : day + 1
}

export function getCurrentPeriod(date = new Date()) {
  const target = asDateOnly(date)
  return (
    db
      .getAll('schedule_periods')
      .filter((period) => period.tu_ngay <= target && target <= period.den_ngay)
      .sort((a, b) => b.tu_ngay.localeCompare(a.tu_ngay))[0] ?? null
  )
}

export function listPeriods() {
  return db.getAll('schedule_periods').sort((a, b) => b.tu_ngay.localeCompare(a.tu_ngay))
}

export function savePeriod(period) {
  if (!period.ten_dot?.trim() || !period.tu_ngay || !period.den_ngay || !period.nam_hoc) {
    throw new Error('Vui lòng nhập đầy đủ thông tin đợt TKB')
  }
  if (period.tu_ngay > period.den_ngay) {
    throw new Error('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc')
  }
  const record = { ...period, id: period.id || makeId('dot'), hoc_ky: Number(period.hoc_ky) }
  return period.id ? db.update('schedule_periods', period.id, record) : db.insert('schedule_periods', record)
}

export function deletePeriod(id) {
  return db.remove('schedule_periods', id)
}

export function listSchedules(periodId) {
  return db
    .getAll('schedules')
    .filter((row) => !periodId || row.period_id === periodId)
    .sort((a, b) => a.thu - b.thu || a.tiet - b.tiet)
}

export function getSchedulesForTeacherDate(teacherId, date, periodId) {
  const thu = getVietnameseWeekday(date)
  return listSchedules(periodId).filter((row) => row.teacher_id === teacherId && row.thu === thu)
}

export function describeTiet({ tiet, tiet_trong_buoi, buoi } = {}) {
  const soTiet = Number(tiet) || 0
  const session = buoi || (soTiet > 5 ? 'Chiều' : 'Sáng')
  const trongBuoi = Number(tiet_trong_buoi) || (session === 'Chiều' ? soTiet - 5 : soTiet)
  return {
    buoi: session,
    tiet_trong_buoi: trongBuoi,
    label: `${session} T${trongBuoi}`,
  }
}

export function compactDayTKB(lessons = []) {
  return lessons
    .filter((lesson) => !isChaoCoPeriod(lesson))
    .map((lesson) => ({ ...describeTiet(lesson), mon: lesson.mon, lop: lesson.lop }))
    .sort((a, b) => a.buoi.localeCompare(b.buoi) || a.tiet_trong_buoi - b.tiet_trong_buoi)
}

export function isChaoCoPeriod({ thu, tiet, buoi, tiet_trong_buoi } = {}) {
  if (Number(thu) !== 2) return false
  const soTiet = Number(tiet) || 0
  const session = buoi || (soTiet > 5 ? 'Chiều' : 'Sáng')
  const trongBuoi = Number(tiet_trong_buoi) || (session === 'Chiều' ? soTiet - 5 : soTiet)
  return (session === 'Sáng' && trongBuoi === 1) || (session === 'Chiều' && trongBuoi === 5)
}

export function saveSchedule(schedule) {
  const thu = Number(schedule.thu)
  const tiet = Number(schedule.tiet)
  if (!schedule.period_id || !schedule.teacher_id || !schedule.lop?.trim() || !schedule.mon?.trim()) {
    throw new Error('Dòng TKB thiếu thông tin bắt buộc')
  }
  if (thu < 2 || thu > 7 || tiet < 1 || tiet > 10) {
    throw new Error('Thứ phải từ 2–7 và tiết phải từ 1–10')
  }
  const duplicate = listSchedules(schedule.period_id).find(
    (row) =>
      row.id !== schedule.id &&
      row.teacher_id === schedule.teacher_id &&
      row.thu === thu &&
      row.tiet === tiet,
  )
  if (duplicate) throw new Error('Giáo viên đã có lịch ở thứ và tiết này')
  const record = { ...schedule, thu, tiet, id: schedule.id || makeId('tkb') }
  return schedule.id ? db.update('schedules', schedule.id, record) : db.insert('schedules', record)
}

export function saveSchedules(schedules) {
  return schedules.map(saveSchedule)
}

export function deleteSchedule(id) {
  return db.remove('schedules', id)
}

export function listAssignments(periodId) {
  return db.getAll('assignments').filter((row) => !periodId || row.period_id === periodId)
}

export function saveAssignment(assignment) {
  if (!assignment.period_id || !assignment.teacher_id || !assignment.mon) {
    throw new Error('Phân công chuyên môn thiếu thông tin')
  }
  const record = {
    ...assignment,
    id: assignment.id || makeId('pc'),
    tiet_chuan: Number(assignment.tiet_chuan),
    hoc_ky: Number(assignment.hoc_ky),
    classes: assignment.classes || [],
    so_lop: Number(assignment.so_lop) || 0,
    so_tiet_tuan: Number(assignment.so_tiet_tuan) || 0,
    phu_cap_cn: Number(assignment.phu_cap_cn) || 0,
  }
  return assignment.id ? db.update('assignments', assignment.id, record) : db.insert('assignments', record)
}

export function computeTeacherWorkload(periodId, scheduleRows) {
  const rows = scheduleRows || listSchedules(periodId)
  const assignments = listAssignments(periodId)
  const teachers = db.getAll('teachers')

  const grouped = {}
  rows.forEach((s) => {
    if (!grouped[s.teacher_id]) {
      grouped[s.teacher_id] = { classes: [], total_tiet: 0, mons: new Set() }
    }
    if (!grouped[s.teacher_id].classes.includes(s.lop)) {
      grouped[s.teacher_id].classes.push(s.lop)
    }
    grouped[s.teacher_id].total_tiet++
    grouped[s.teacher_id].mons.add(s.mon)
  })

  return Object.entries(grouped)
    .map(([teacherId, data]) => {
      const teacher = teachers.find((t) => t.id === teacherId)
      const assignment = assignments.find((a) => a.teacher_id === teacherId)
      const vaiTro = teacher?.vai_tro || []
      const tietChuanGoc = Number(assignment?.tiet_chuan) || 17
      const phuCapCN = computePhuCapChuNhiem(vaiTro)
      const soTietTuan = data.total_tiet + phuCapCN
      const tietChuan = computeEffectiveTietChuan(tietChuanGoc, vaiTro)
      return {
        teacher_id: teacherId,
        teacher_name: teacher?.name || teacherId,
        mon: [...data.mons].join(', '),
        so_lop: data.classes.length,
        so_tiet_tuan: soTietTuan,
        so_tiet_cb: data.total_tiet,
        phu_cap_cn: phuCapCN,
        tiet_chuan: tietChuan,
        tiet_chuan_goc: tietChuanGoc,
        vai_tro: vaiTro,
        thua_thieu: soTietTuan - tietChuan,
        classes: data.classes,
      }
    })
    .sort((a, b) => a.teacher_name.localeCompare(b.teacher_name, 'vi'))
}

export function updateAssignmentsFromSchedules(periodId) {
  const workload = computeTeacherWorkload(periodId)
  const period = db.getById('schedule_periods', periodId)
  if (!period) return []

  return workload
    .filter((item) => item.so_tiet_cb > 0)
    .map((item) => {
      const existing = listAssignments(periodId).find((a) => a.teacher_id === item.teacher_id)
      return saveAssignment({
        id: existing?.id,
        period_id: periodId,
        teacher_id: item.teacher_id,
        mon: existing?.mon || item.mon,
        tiet_chuan: existing?.tiet_chuan || 0,
        hoc_ky: period.hoc_ky,
        classes: item.classes,
        so_lop: item.so_lop,
        so_tiet_tuan: item.so_tiet_cb,
        phu_cap_cn: item.phu_cap_cn,
      })
    })
}
