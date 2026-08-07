import { create } from 'zustand'
import { databaseMode, db, initializeDatabase, resetDatabase } from '../services/db'
import { createSubstitutions, deleteSubstitution } from '../services/substitutionService'

const emptyState = {
  teachers: [],
  periods: [],
  schedules: [],
  assignments: [],
  locks: [],
  substitutions: [],
  loading: false,
  error: '',
  toast: null,
}

function snapshotState() {
  const snapshot = db.exportSnapshot()
  return {
    teachers: snapshot.teachers,
    periods: snapshot.schedule_periods,
    schedules: snapshot.schedules,
    assignments: snapshot.assignments,
    locks: snapshot.teacher_locks,
    substitutions: snapshot.substitutions,
  }
}

export const useAppStore = create((set, get) => ({
  ...emptyState,
  loadData() {
    set({ loading: true, error: '' })
    try {
      set({ ...snapshotState(), loading: false })
      if (databaseMode === 'supabase') {
        initializeDatabase()
          .then(() => set({ ...snapshotState(), loading: false }))
          .catch((error) => set({ error: `Không thể đồng bộ Supabase: ${error.message}` }))
      }
    } catch (error) {
      set({ loading: false, error: error.message })
    }
  },
  refresh() {
    set(snapshotState())
  },
  saveSubstitutions(records) {
    const saved = createSubstitutions(records)
    set({ substitutions: db.getAll('substitutions') })
    return saved
  },
  removeSubstitution(id) {
    deleteSubstitution(id)
    set({ substitutions: db.getAll('substitutions') })
  },
  notify(message, type = 'success') {
    set({ toast: { message, type } })
  },
  clearToast() {
    set({ toast: null })
  },
  reset() {
    resetDatabase()
    set({ ...emptyState })
  },
  getTeacher(id) {
    return get().teachers.find((teacher) => teacher.id === id) ?? null
  },
}))
