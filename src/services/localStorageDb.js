import { seedData } from '../data/seed'

const STORAGE_KEY = 'tothe_database_v1'
const clone = (value) => JSON.parse(JSON.stringify(value))

function createSeedSnapshot() {
  return Object.fromEntries(
    Object.entries(seedData).map(([table, rows]) => [table, clone(rows)]),
  )
}

function loadSnapshot() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const snapshot = createSeedSnapshot()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
    return snapshot
  }
  try {
    return JSON.parse(raw)
  } catch {
    const snapshot = createSeedSnapshot()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
    return snapshot
  }
}

function persist(snapshot) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
}

function assertTable(snapshot, table) {
  if (!Array.isArray(snapshot[table])) {
    throw new Error(`Bảng dữ liệu không hợp lệ: ${table}`)
  }
}

export const localStorageDb = {
  getAll(table) {
    const snapshot = loadSnapshot()
    assertTable(snapshot, table)
    return clone(snapshot[table])
  },
  getById(table, id) {
    return this.getAll(table).find((row) => row.id === id) ?? null
  },
  insert(table, record) {
    const snapshot = loadSnapshot()
    assertTable(snapshot, table)
    if (!record.id) throw new Error('Bản ghi phải có id')
    if (snapshot[table].some((row) => row.id === record.id)) {
      throw new Error(`ID đã tồn tại: ${record.id}`)
    }
    snapshot[table].push(clone(record))
    persist(snapshot)
    return clone(record)
  },
  update(table, id, patch) {
    const snapshot = loadSnapshot()
    assertTable(snapshot, table)
    const index = snapshot[table].findIndex((row) => row.id === id)
    if (index < 0) throw new Error(`Không tìm thấy bản ghi: ${id}`)
    snapshot[table][index] = { ...snapshot[table][index], ...clone(patch), id }
    persist(snapshot)
    return clone(snapshot[table][index])
  },
  remove(table, id) {
    const snapshot = loadSnapshot()
    assertTable(snapshot, table)
    const previousLength = snapshot[table].length
    snapshot[table] = snapshot[table].filter((row) => row.id !== id)
    persist(snapshot)
    return snapshot[table].length < previousLength
  },
  replaceAll(table, records) {
    const snapshot = loadSnapshot()
    assertTable(snapshot, table)
    snapshot[table] = clone(records)
    persist(snapshot)
    return clone(records)
  },
  exportSnapshot() {
    return clone(loadSnapshot())
  },
}

export function makeId(prefix = 'id') {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`
  return `${prefix}_${random}`
}

export function resetDatabase() {
  localStorage.removeItem(STORAGE_KEY)
  loadSnapshot()
}
