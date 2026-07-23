import { useState } from 'react'
import { BookOpenCheck, Pencil, Plus, UserRoundCheck, UserRoundX } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import { listAssignments, saveAssignment } from '../../services/scheduleService'
import { deleteTeacher, saveTeacher } from '../../services/teacherService'
import { useAppStore } from '../../stores/appStore'

const emptyTeacher = { name: '', mon_day: ['Toán'], active: true }

export default function SetupTeachers() {
  const store = useAppStore()
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [periodId, setPeriodId] = useState(store.periods[0]?.id || '')
  const assignments = listAssignments(periodId)

  function submitTeacher(event) {
    event.preventDefault()
    setError('')
    try {
      saveTeacher(editing)
      store.refresh()
      setEditing(null)
      store.notify('Đã lưu thông tin giáo viên.')
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  function updateAssignment(teacher, patch) {
    const existing = assignments.find((item) => item.teacher_id === teacher.id)
    const period = store.periods.find((item) => item.id === periodId)
    try {
      saveAssignment({
        ...(existing || {}),
        period_id: periodId,
        teacher_id: teacher.id,
        mon: patch.mon ?? existing?.mon ?? teacher.mon_day[0],
        tiet_chuan: patch.tiet_chuan ?? existing?.tiet_chuan ?? 17,
        hoc_ky: period?.hoc_ky || 1,
      })
      store.refresh()
      store.notify('Đã cập nhật phân công chuyên môn.')
    } catch (assignmentError) {
      store.notify(assignmentError.message, 'error')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-ink">Danh sách giáo viên</h2>
          <p className="text-xs text-slate-500">{store.teachers.filter((teacher) => teacher.active).length} đang hoạt động</p>
        </div>
        <Button onClick={() => setEditing({ ...emptyTeacher })}><Plus size={18} /> Thêm GV</Button>
      </div>
      <div className="space-y-3">
        {store.teachers.map((teacher) => (
          <Card key={teacher.id} className={!teacher.active ? 'opacity-60' : ''}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-ink">{teacher.name}</h3>
                  <Badge variant={teacher.active ? 'success' : 'neutral'}>{teacher.active ? 'Hoạt động' : 'Tạm ẩn'}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {teacher.mon_day.map((subject) => <Badge key={subject} variant="primary">{subject}</Badge>)}
                </div>
              </div>
              <Button variant="ghost" className="h-10 min-h-10 px-3" onClick={() => setEditing({ ...teacher })}><Pencil size={17} /></Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-2 text-primary"><BookOpenCheck size={20} /></div>
          <div>
            <h2 className="font-black text-ink">Phân công chuyên môn</h2>
            <p className="text-xs text-slate-500">Môn và tiết chuẩn theo từng đợt.</p>
          </div>
        </div>
        <select value={periodId} onChange={(event) => setPeriodId(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 px-3">
          {store.periods.map((period) => <option key={period.id} value={period.id}>{period.ten_dot}</option>)}
        </select>
        <div className="space-y-2">
          {store.teachers.filter((teacher) => teacher.active).map((teacher) => {
            const assignment = assignments.find((item) => item.teacher_id === teacher.id)
            return (
              <div key={teacher.id} className="grid grid-cols-[1fr_88px_70px] items-center gap-2 rounded-xl bg-slate-50 p-2">
                <span className="truncate text-sm font-semibold">{teacher.name}</span>
                <select
                  aria-label={`Môn của ${teacher.name}`}
                  value={assignment?.mon || teacher.mon_day[0]}
                  onChange={(event) => updateAssignment(teacher, { mon: event.target.value })}
                  className="min-h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs"
                >
                  {teacher.mon_day.map((subject) => <option key={subject}>{subject}</option>)}
                </select>
                <input
                  aria-label={`Tiết chuẩn của ${teacher.name}`}
                  type="number"
                  min="0"
                  max="40"
                  value={assignment?.tiet_chuan ?? 17}
                  onChange={(event) => updateAssignment(teacher, { tiet_chuan: Number(event.target.value) })}
                  className="min-h-9 rounded-lg border border-slate-200 px-2 text-center text-xs"
                />
              </div>
            )
          })}
        </div>
      </Card>

      <Modal open={Boolean(editing)} title={editing?.id ? 'Sửa giáo viên' : 'Thêm giáo viên'} onClose={() => setEditing(null)}>
        {editing && (
          <form onSubmit={submitTeacher} className="space-y-4">
            {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-danger">{error}</p>}
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Họ và tên</span>
              <input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} className="min-h-11 w-full rounded-xl border border-slate-300 px-3" />
            </label>
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">Môn dạy</legend>
              <div className="flex gap-4">
                {['Toán', 'Tin'].map((subject) => (
                  <label key={subject} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editing.mon_day.includes(subject)}
                      onChange={(event) => setEditing({
                        ...editing,
                        mon_day: event.target.checked
                          ? [...editing.mon_day, subject]
                          : editing.mon_day.filter((item) => item !== subject),
                      })}
                    /> {subject}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={editing.active} onChange={(event) => setEditing({ ...editing, active: event.target.checked })} />
              Đang hoạt động
            </label>
            <Button className="w-full" type="submit"><UserRoundCheck size={18} /> Lưu giáo viên</Button>
            {editing.id && editing.active && (
              <Button className="w-full" variant="danger" onClick={() => {
                deleteTeacher(editing.id)
                store.refresh()
                setEditing(null)
              }}><UserRoundX size={18} /> Tạm ẩn giáo viên</Button>
            )}
          </form>
        )}
      </Modal>
    </div>
  )
}
