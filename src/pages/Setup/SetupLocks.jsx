import { useState } from 'react'
import { LockKeyhole, Pencil, Plus, Trash2 } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import { deleteLock, isLockActive, saveLock } from '../../services/teacherService'
import { useAppStore } from '../../stores/appStore'

const emptyLock = { teacher_id: '', tu_ngay: '', den_ngay: '', ly_do: '' }

export default function SetupLocks() {
  const store = useAppStore()
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  function submit(event) {
    event.preventDefault()
    setError('')
    try {
      saveLock(editing)
      store.refresh()
      setEditing(null)
      store.notify('Đã lưu ngoại lệ giáo viên.')
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="text-lg font-black text-ink">Ngoại lệ giáo viên</h2><p className="text-xs text-slate-500">Tự hết hiệu lực sau ngày kết thúc.</p></div>
        <Button onClick={() => setEditing({ ...emptyLock })}><Plus size={18} /> Thêm khóa</Button>
      </div>
      {store.locks.map((lock) => {
        const teacher = store.teachers.find((item) => item.id === lock.teacher_id)
        const active = isLockActive(lock)
        return (
          <Card key={lock.id}>
            <div className="flex items-start justify-between gap-3">
              <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{teacher?.name}</h3><Badge variant={active ? 'danger' : 'neutral'}>{active ? 'Đang hiệu lực' : 'Đã hết hạn'}</Badge></div><p className="mt-2 text-sm text-slate-600">{lock.ly_do}</p><p className="mt-2 text-xs text-slate-400">{lock.tu_ngay} → {lock.den_ngay}</p></div>
              <div className="flex"><Button variant="ghost" className="h-9 min-h-9 px-2" onClick={() => setEditing({ ...lock })}><Pencil size={16} /></Button><Button variant="ghost" className="h-9 min-h-9 px-2 text-danger" onClick={() => { deleteLock(lock.id); store.refresh() }}><Trash2 size={16} /></Button></div>
            </div>
          </Card>
        )
      })}

      <Modal open={Boolean(editing)} title={editing?.id ? 'Sửa ngoại lệ' : 'Thêm ngoại lệ'} onClose={() => setEditing(null)}>
        {editing && (
          <form onSubmit={submit} className="space-y-4">
            {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-danger">{error}</p>}
            <label className="block"><span className="mb-1 block text-sm font-semibold">Giáo viên</span><select value={editing.teacher_id} onChange={(event) => setEditing({ ...editing, teacher_id: event.target.value })} className="min-h-11 w-full rounded-xl border border-slate-300 px-3"><option value="">Chọn GV</option>{store.teachers.filter((teacher) => teacher.active).map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select></label>
            <div className="grid grid-cols-2 gap-3"><label><span className="mb-1 block text-sm font-semibold">Từ ngày</span><input type="date" value={editing.tu_ngay} onChange={(event) => setEditing({ ...editing, tu_ngay: event.target.value })} className="min-h-11 w-full rounded-xl border border-slate-300 px-3" /></label><label><span className="mb-1 block text-sm font-semibold">Đến ngày</span><input type="date" value={editing.den_ngay} onChange={(event) => setEditing({ ...editing, den_ngay: event.target.value })} className="min-h-11 w-full rounded-xl border border-slate-300 px-3" /></label></div>
            <label className="block"><span className="mb-1 block text-sm font-semibold">Lý do</span><textarea rows="3" value={editing.ly_do} onChange={(event) => setEditing({ ...editing, ly_do: event.target.value })} className="w-full rounded-xl border border-slate-300 p-3" /></label>
            <Button className="w-full" type="submit"><LockKeyhole size={18} /> Lưu ngoại lệ</Button>
          </form>
        )}
      </Modal>
    </div>
  )
}
