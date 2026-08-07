import { db } from './db'
import { computeEffectiveTietChuan, computePhuCapChuNhiem } from './roleService'
import { listSubstitutions } from './substitutionService'
import { countWeeks } from '../engine/scoringEngine'

export function buildTeacherSummary(filters = {}) {
  const teachers = db.getAll('teachers')
  const periods = db
    .getAll('schedule_periods')
    .filter((period) => !filters.hoc_ky || period.hoc_ky === Number(filters.hoc_ky))
    .sort((a, b) => a.tu_ngay.localeCompare(b.tu_ngay))
  const schedules = db.getAll('schedules')
  const assignments = db
    .getAll('assignments')
    .filter((row) => !filters.hoc_ky || row.hoc_ky === Number(filters.hoc_ky))
  const substitutions = listSubstitutions(filters)

  return teachers
    .filter((teacher) => teacher.active)
    .map((teacher) => {
      const teacherAssignments = assignments.filter((row) => row.teacher_id === teacher.id)
      const tietChuanGoc = teacherAssignments.length
        ? Math.max(...teacherAssignments.map((row) => Number(row.tiet_chuan) || 0))
        : 17
      const tietChuan = computeEffectiveTietChuan(tietChuanGoc, teacher.vai_tro)
      const tietThe = substitutions.filter((row) => row.the_teacher_id === teacher.id).length

      let thuaThieu = 0
      for (const period of periods) {
        const weeks = countWeeks(period.tu_ngay, period.den_ngay)
        const periodAssignment = teacherAssignments.find((row) => row.period_id === period.id)
        const periodChuan = computeEffectiveTietChuan(periodAssignment?.tiet_chuan ?? tietChuanGoc, teacher.vai_tro)
        const periodWeekly = schedules.filter(
          (lesson) => lesson.teacher_id === teacher.id && lesson.period_id === period.id,
        ).length + computePhuCapChuNhiem(teacher.vai_tro)
        const periodThe = substitutions.filter(
          (row) => row.the_teacher_id === teacher.id && row.period_id === period.id,
        ).length
        thuaThieu += (periodWeekly - periodChuan) * weeks + periodThe
      }

      const latestPeriod = periods[periods.length - 1]
      const soTietTuan = latestPeriod
        ? schedules.filter(
            (lesson) => lesson.teacher_id === teacher.id && lesson.period_id === latestPeriod.id,
          ).length + computePhuCapChuNhiem(teacher.vai_tro)
        : 0

      return {
        teacher_id: teacher.id,
        name: teacher.name,
        mon_day: teacher.mon_day,
        tiet_chuan: tietChuan,
        so_tiet_tuan: soTietTuan,
        tiet_the: tietThe,
        tong: soTietTuan + tietThe,
        thua_thieu: thuaThieu,
      }
    })
    .sort((a, b) => a.thua_thieu - b.thua_thieu || a.name.localeCompare(b.name, 'vi'))
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
