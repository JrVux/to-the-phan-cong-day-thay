import { create } from 'zustand'
import { databaseMode, db, initializeDatabase, resetDatabase } from '../services/db'
import { createSubstitutions, deleteSubstitution } from '../services/substitutionService'
import {
  getSessionUser,
  hasSupabase,
  onAuthStateChange,
  signInWithEmail,
  signOut,
  signUpWithEmail,
} from '../services/supabaseClient'
import { fetchMyProfile } from '../services/authService'

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
  authReady: false,
  user: null,
  profile: null,
  isAdmin: false,

  async initAuth() {
    if (!hasSupabase) {
      set({ authReady: true, user: { id: 'local', email: 'Bản demo (không đăng nhập)' }, profile: { role: 'admin' }, isAdmin: true })
      get().loadData()
      return
    }
    const user = await getSessionUser()
    set({ user })
    if (user) {
      const profile = await fetchMyProfile(user.id)
      set({ profile, isAdmin: profile?.role === 'admin' })
    }
    set({ authReady: true })
    onAuthStateChange((event, nextUser) => {
      if (nextUser) {
        fetchMyProfile(nextUser.id).then((profile) => {
          set({ user: nextUser, profile, isAdmin: profile?.role === 'admin' })
          get().loadData()
        })
      } else {
        set({ user: null, profile: null, isAdmin: false, ...emptyState })
      }
    })
  },

  async login(email, password) {
    const user = await signInWithEmail(email, password)
    const profile = await fetchMyProfile(user.id)
    set({ user, profile, isAdmin: profile?.role === 'admin' })
    get().loadData()
    return profile
  },

  async register({ email, password, inviteCode }) {
    const user = await signUpWithEmail(email, password, inviteCode)
    if (!user) return null
    const profile = await fetchMyProfile(user.id)
    set({ user, profile, isAdmin: profile?.role === 'admin' })
    get().loadData()
    return profile
  },

  async logout() {
    await signOut()
    set({ user: null, profile: null, isAdmin: false, ...emptyState })
  },

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