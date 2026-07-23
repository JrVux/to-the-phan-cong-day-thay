import { db, makeId } from './db'

export function listTeachers({ includeInactive = true } = {}) {
  return db
    .getAll('teachers')
    .filter((teacher) => includeInactive || teacher.active)
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
}

export function saveTeacher(teacher) {
  if (!teacher.name?.trim()) throw new Error('Tên giáo viên là bắt buộc')
  if (!Array.isArray(teacher.mon_day) || teacher.mon_day.length === 0) {
    throw new Error('Giáo viên phải có ít nhất một môn dạy')
  }
  const record = {
    ...teacher,
    name: teacher.name.trim(),
    mon_day: [...new Set(teacher.mon_day.map((subject) => subject.trim()).filter(Boolean))],
    active: teacher.active ?? true,
    id: teacher.id || makeId('gv'),
  }
  return teacher.id ? db.update('teachers', teacher.id, record) : db.insert('teachers', record)
}

export function deleteTeacher(id) {
  return db.update('teachers', id, { active: false })
}

export function listLocks() {
  return db.getAll('teacher_locks').sort((a, b) => b.tu_ngay.localeCompare(a.tu_ngay))
}

export function isLockActive(lock, date = new Date()) {
  const target = date instanceof Date ? date.toISOString().slice(0, 10) : String(date).slice(0, 10)
  return lock.tu_ngay <= target && target <= lock.den_ngay
}

export function saveLock(lock) {
  if (!lock.teacher_id || !lock.tu_ngay || !lock.den_ngay || !lock.ly_do?.trim()) {
    throw new Error('Vui lòng nhập đầy đủ thông tin ngoại lệ')
  }
  if (lock.tu_ngay > lock.den_ngay) throw new Error('Khoảng ngày ngoại lệ không hợp lệ')
  const record = { ...lock, id: lock.id || makeId('lock'), ly_do: lock.ly_do.trim() }
  return lock.id ? db.update('teacher_locks', lock.id, record) : db.insert('teacher_locks', record)
}

export function deleteLock(id) {
  return db.remove('teacher_locks', id)
}
