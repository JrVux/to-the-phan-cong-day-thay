import { db } from './db'
import { listSubstitutions } from './substitutionService'

export function buildTeacherSummary(filters = {}) {
  const teachers = db.getAll('teachers')
  const assignments = db
    .getAll('assignments')
    .filter((row) => !filters.hoc_ky || row.hoc_ky === Number(filters.hoc_ky))
  const substitutions = listSubstitutions(filters)

  return teachers
    .filter((teacher) => teacher.active)
    .map((teacher) => {
      const teacherAssignments = assignments.filter((row) => row.teacher_id === teacher.id)
      const tietChuan = teacherAssignments.length
        ? Math.max(...teacherAssignments.map((row) => Number(row.tiet_chuan) || 0))
        : 0
      const tietThe = substitutions.filter((row) => row.the_teacher_id === teacher.id).length
      return {
        teacher_id: teacher.id,
        name: teacher.name,
        mon_day: teacher.mon_day,
        tiet_chuan: tietChuan,
        tiet_the: tietThe,
        tong: tietChuan + tietThe,
        thua_thieu: tietThe,
      }
    })
    .sort((a, b) => a.tiet_the - b.tiet_the || a.name.localeCompare(b.name, 'vi'))
}

export function getDashboardStats(date = new Date()) {
  const dateString = date instanceof Date ? date.toISOString().slice(0, 10) : String(date).slice(0, 10)
  const month = dateString.slice(0, 7)
  const substitutions = db.getAll('substitutions')
  return {
    totalTeachers: db.getAll('teachers').filter((teacher) => teacher.active).length,
    substitutionsThisMonth: substitutions.filter((row) => row.ngay.startsWith(month)).length,
    unassigned: substitutions.filter((row) => !row.the_teacher_id || row.status === 'unassigned').length,
    activeLocks: db
      .getAll('teacher_locks')
      .filter((lock) => lock.tu_ngay <= dateString && dateString <= lock.den_ngay).length,
  }
}
