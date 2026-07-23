import { db, makeId } from './db'

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
  }
  return assignment.id ? db.update('assignments', assignment.id, record) : db.insert('assignments', record)
}
