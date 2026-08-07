import { db } from './db'

const yearTables = ['substitutions', 'schedules', 'assignments', 'teacher_locks']

export function countYearData() {
  const snapshot = db.exportSnapshot()
  return {
    substitutions: snapshot.substitutions.length,
    schedules: snapshot.schedules.length,
    assignments: snapshot.assignments.length,
    locks: snapshot.teacher_locks.length,
    periods: snapshot.schedule_periods.length,
    teachers: snapshot.teachers.length,
  }
}

export function startNewYear() {
  const snapshot = db.exportSnapshot()
  const cleared = Object.fromEntries(
    yearTables.map((table) => [table, []]),
  )
  const next = { ...snapshot, ...cleared }
  db.restoreSnapshot(next)
  return countYearData()
}