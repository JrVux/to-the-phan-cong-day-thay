import { db, makeId } from './db'

export function listSubstitutions(filters = {}) {
  return db
    .getAll('substitutions')
    .filter((row) => !filters.hoc_ky || row.hoc_ky === Number(filters.hoc_ky))
    .filter((row) => !filters.nam_hoc || row.nam_hoc === filters.nam_hoc)
    .filter((row) => !filters.teacher_id || row.the_teacher_id === filters.teacher_id || row.nghi_teacher_id === filters.teacher_id)
    .filter((row) => !filters.month || row.ngay.startsWith(filters.month))
    .sort((a, b) => b.ngay.localeCompare(a.ngay) || b.tiet - a.tiet)
}

export function createSubstitutions(records) {
  if (!Array.isArray(records) || records.length === 0) throw new Error('Không có tiết để lưu')
  return records.map((record) => {
    const required = ['period_id', 'nghi_teacher_id', 'ngay', 'thu', 'tiet', 'lop', 'mon', 'hoc_ky', 'nam_hoc']
    if (required.some((field) => record[field] === undefined || record[field] === '')) {
      throw new Error('Phân công thiếu thông tin bắt buộc')
    }
    return db.insert('substitutions', {
      ...record,
      id: record.id || makeId('sub'),
      created_at: record.created_at || new Date().toISOString(),
      the_teacher_id: record.the_teacher_id || null,
      status: record.the_teacher_id ? 'assigned' : 'unassigned',
      ghi_chu: record.ghi_chu || '',
    })
  })
}

export function updateSubstitution(id, patch) {
  return db.update('substitutions', id, patch)
}

export function deleteSubstitution(id) {
  return db.remove('substitutions', id)
}
