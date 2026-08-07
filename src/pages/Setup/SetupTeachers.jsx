import { useState } from 'react'
import { BookOpenCheck, Pencil, Plus, UserRoundCheck, UserRoundX } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import { listAssignments, saveAssignment } from '../../services/scheduleService'
import { deleteTeacher, saveTeacher } from '../../services/teacherService'
import { KIEM_NHIEM_ROLES, MAX_KIEM_NHIEM, computeEffectiveTietChuan, computePhuCapChuNhiem, getRoles } from '../../services/roleService'
import { useAppStore } from '../../stores/appStore'

const subjectOptions = ['Tin học', 'Giáo dục thể chất', 'GDQP AN', 'HĐ trải nghiệm, hướng nghiệp']
const emptyTeacher = { name: '', mon_day: ['Tin học'], active: true, vai_tro: [] }

export default function SetupTeachers() {
  const store = useAppStore()
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [periodId, setPeriodId] = useState(store.periods[0]?.id || '')
  const [classEdits, setClassEdits] = useState({})
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

  function toggleRole(teacher, roleId) {
    const current = teacher.vai_tro || []
    const next = current.includes(roleId)
      ? current.filter((id) => id !== roleId)
      : current.length >= MAX_KIEM_NHIEM
        ? current
        : [...current, roleId]
    try {
      saveTeacher({ ...teacher, vai_tro: next })
      store.refresh()
    } catch (roleError) {
      store.notify(roleError.message, 'error')
    }
  }

  function commitClasses(teacher, rawText) {
    const classes = [...new Set(rawText.split(',').map((item) => item.trim()).filter(Boolean))]
    const teacherAssignments = assignments.filter((item) => item.teacher_id === teacher.id)
    if (teacherAssignments.length === 0) return
    const period = store.periods.find((item) => item.id === periodId)
    teacherAssignments.forEach((item) => {
      saveAssignment({
        ...item,
        classes,
        so_lop: classes.length,
        hoc_ky: period?.hoc_ky || item.hoc_ky || 1,
      })
    })
    setClassEdits((current) => ({ ...current, [teacher.id]: undefined }))
    store.refresh()
    store.notify('Đã cập nhật danh sách lớp.')
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
        {store.teachers.map((teacher) => {
          const teacherAssignments = assignments.filter((item) => item.teacher_id === teacher.id)
          const assignedClasses = [...new Set(teacherAssignments.flatMap((item) => item.classes || []))]
          return (
          <Card key={teacher.id} className={!teacher.active ? 'opacity-60' : ''}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-ink">{teacher.name}</h3>
                  <Badge variant={teacher.active ? 'success' : 'neutral'}>{teacher.active ? 'Hoạt động' : 'Tạm ẩn'}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {teacher.mon_day.length
                    ? teacher.mon_day.map((subject) => <Badge key={subject} variant="primary">{subject}</Badge>)
                    : <Badge variant="warning">Chưa xác định</Badge>}
                </div>
                {assignedClasses.length > 0 && (
                  <p className="mt-2 text-xs leading-5 text-slate-500">Lớp: {assignedClasses.join(', ')}</p>
                )}
                {teacher.vai_tro?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {getRoles(teacher.vai_tro).map((role) => (
                      <Badge key={role.id} variant={role.id === 'chu_nhiem' ? 'warning' : 'primary'}>{role.label}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <Button variant="ghost" className="h-10 min-h-10 px-3" onClick={() => setEditing({ ...teacher })}><Pencil size={17} /></Button>
            </div>
          </Card>
          )
        })}
      </div>

      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gold/15 p-2 text-ink"><BookOpenCheck size={20} /></div>
          <div>
            <h2 className="font-black text-ink">Phân công chuyên môn</h2>
            <p className="text-xs text-slate-500">Môn và tiết chuẩn theo từng đợt.</p>
          </div>
        </div>
        <select value={periodId} onChange={(event) => setPeriodId(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 px-3">
          {store.periods.map((period) => <option key={period.id} value={period.id}>{period.ten_dot}</option>)}
        </select>
        <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-slate-900 text-xs uppercase text-white">
              <tr>
                <th className="sticky left-0 top-0 z-30 bg-slate-900 px-3 py-2.5">Giáo viên</th>
                <th className="sticky top-0 z-20 bg-slate-900 px-3 py-2.5 text-center">Môn</th>
                <th className="sticky top-0 z-20 bg-slate-900 px-3 py-2.5 text-center">Kiêm nhiệm</th>
                <th className="sticky top-0 z-20 bg-slate-900 px-3 py-2.5 text-center">Lớp</th>
                <th className="sticky top-0 z-20 bg-slate-900 px-3 py-2.5 text-center">Số lớp</th>
                <th className="sticky top-0 z-20 bg-slate-900 px-3 py-2.5 text-center">Tiết/TKB</th>
                <th className="sticky top-0 z-20 bg-slate-900 px-3 py-2.5 text-center">Tổng</th>
                <th className="sticky top-0 z-20 bg-slate-900 px-3 py-2.5 text-center">Tiết chuẩn</th>
                <th className="sticky top-0 z-20 bg-slate-900 px-3 py-2.5 text-center">Thừa/Thiếu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {store.teachers.filter((teacher) => teacher.active).map((teacher) => {
                const teacherAssignments = assignments.filter((item) => item.teacher_id === teacher.id)
                const assignment = teacherAssignments[0]
                const assignedClasses = [...new Set(teacherAssignments.flatMap((item) => item.classes || []))]
                const soTietTuan = teacherAssignments.reduce((sum, item) => sum + (Number(item.so_tiet_tuan) || 0), 0)
                const vaiTro = teacher.vai_tro || []
                const phuCapCN = computePhuCapChuNhiem(vaiTro)
                const tongTiet = soTietTuan + phuCapCN
                const tietChuanGoc = Number(assignment?.tiet_chuan ?? 17)
                const tietChuan = computeEffectiveTietChuan(tietChuanGoc, vaiTro)
                const thuaThieu = tongTiet - tietChuan
                const classDraft = classEdits[teacher.id]
                const classText = classDraft !== undefined ? classDraft : assignedClasses.join(', ')
                return (
                  <tr key={teacher.id} className="hover:bg-slate-50">
                    <td className="sticky left-0 z-10 bg-white px-3 py-2">
                      <span className="font-semibold text-ink">{teacher.name}</span>
                      {vaiTro.length > 0 && (
                        <span className="mt-0.5 block space-x-1">
                          {getRoles(vaiTro).map((role) => (
                            <Badge key={role.id} variant={role.id === 'chu_nhiem' ? 'warning' : 'primary'}>{role.label}</Badge>
                          ))}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <select
                        aria-label={`Môn của ${teacher.name}`}
                        value={assignment?.mon || teacher.mon_day[0] || ''}
                        onChange={(event) => updateAssignment(teacher, { mon: event.target.value })}
                        disabled={teacherAssignments.length !== 1}
                        className="min-h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs"
                      >
                        {!teacher.mon_day.length && <option value="">Chưa xác định</option>}
                        {teacher.mon_day.map((subject) => <option key={subject}>{subject}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="mx-auto grid w-48 grid-cols-3 gap-1">
                        {KIEM_NHIEM_ROLES.map((role) => {
                          const checked = vaiTro.includes(role.id)
                          const disabled = !checked && vaiTro.length >= MAX_KIEM_NHIEM
                          return (
                            <label key={role.id} title={`${role.label}${checked ? '' : disabled ? ' (đạt giới hạn kiêm nhiệm)' : ''}`} className={`flex cursor-pointer items-center justify-center gap-1 rounded-md border px-1 py-1 text-[10px] font-bold leading-none ${checked ? 'border-primary bg-gold/20 text-ink' : disabled ? 'cursor-not-allowed border-slate-100 text-slate-300' : 'border-slate-200 text-slate-500'}`}>
                              <input
                                type="checkbox"
                                className="size-2.5 accent-amber-500"
                                checked={checked}
                                disabled={disabled}
                                onChange={() => toggleRole(teacher, role.id)}
                              />
                              <span className="truncate">{role.label}</span>
                            </label>
                          )
                        })}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        aria-label={`Lớp của ${teacher.name}`}
                        value={classText}
                        placeholder="10A3, 12D3"
                        onChange={(event) => setClassEdits({ ...classEdits, [teacher.id]: event.target.value })}
                        onBlur={() => commitClasses(teacher, classText)}
                        onKeyDown={(event) => { if (event.key === 'Enter') event.target.blur() }}
                        className="min-h-8 w-full min-w-36 rounded-lg border border-slate-200 px-2 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-slate-500">{classText.split(',').map((item) => item.trim()).filter(Boolean).length}</td>
                    <td className="px-3 py-2 text-center">
                      {soTietTuan}
                      {phuCapCN > 0 && <span className="block text-[10px] text-slate-400">+{phuCapCN} CN</span>}
                    </td>
                    <td className="px-3 py-2 text-center font-black text-ink">{tongTiet}</td>
                    <td className="px-3 py-2 text-center">
                      <input
                        aria-label={`Tiết chuẩn của ${teacher.name}`}
                        type="number"
                        min="0"
                        max="40"
                        value={tietChuanGoc}
                        onChange={(event) => updateAssignment(teacher, { tiet_chuan: Number(event.target.value) })}
                        className="min-h-8 w-16 rounded-lg border border-slate-200 px-2 text-center text-xs"
                      />
                      {tietChuan !== tietChuanGoc && (
                        <span className="block text-[10px] text-amber-600">hiệu lực {tietChuan}</span>
                      )}
                    </td>
                    <td className={`px-3 py-2 text-center font-bold ${thuaThieu > 0 ? 'text-success' : thuaThieu < 0 ? 'text-danger' : 'text-slate-400'}`}>
                      {thuaThieu > 0 ? '+' : ''}{thuaThieu}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400">
          Mỗi người được tối đa {MAX_KIEM_NHIEM} kiêm nhiệm. Chủ nhiệm cộng {computePhuCapChuNhiem(['chu_nhiem'])} tiết/tuần;
          Phó BTĐ và Bí thư Đoàn đặt tiết chuẩn 8,5 / 2,5 tiết; Tổ Trưởng (−3), Tổ phó (−1), TTND (−2), TTCĐ (−3), TPCĐ (−1), KTPMTin (−2) giảm từ tiết chuẩn gốc.
        </p>
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
                {subjectOptions.map((subject) => (
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
