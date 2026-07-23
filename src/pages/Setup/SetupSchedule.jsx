import { useMemo, useState } from 'react'
import { FileSpreadsheet, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import { deleteSchedule, saveSchedule, saveSchedules } from '../../services/scheduleService'
import { useAppStore } from '../../stores/appStore'
import { parseScheduleFile } from '../../utils/scheduleImport'

const emptyRow = { teacher_id: '', thu: 2, tiet: 1, lop: '', mon: 'Toán' }

export default function SetupSchedule() {
  const store = useAppStore()
  const [periodId, setPeriodId] = useState(localStorage.getItem('tothe_preferred_period') || store.periods[0]?.id || '')
  const [editing, setEditing] = useState(null)
  const [preview, setPreview] = useState([])
  const [importErrors, setImportErrors] = useState([])
  const [error, setError] = useState('')
  const rows = useMemo(
    () => store.schedules.filter((row) => row.period_id === periodId).sort((a, b) => a.thu - b.thu || a.tiet - b.tiet),
    [periodId, store.schedules],
  )

  async function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const result = await parseScheduleFile(file, { teachers: store.teachers, periodId })
      setPreview(result.rows)
      setImportErrors(result.errors)
    } catch {
      setPreview([])
      setImportErrors(['Không thể đọc file. Hãy dùng .xlsx, .xls hoặc .csv với đúng tiêu đề cột.'])
    }
  }

  function submit(event) {
    event.preventDefault()
    setError('')
    try {
      saveSchedule({ ...editing, period_id: periodId })
      store.refresh()
      setEditing(null)
      store.notify('Đã lưu dòng thời khóa biểu.')
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  return (
    <div className="space-y-5">
      <Card className="space-y-4">
        <div>
          <h2 className="font-black text-ink">Thời khóa biểu theo đợt</h2>
          <p className="mt-1 text-xs text-slate-500">Nhập tay hoặc import bảng tính.</p>
        </div>
        <select value={periodId} onChange={(event) => setPeriodId(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 px-3">
          {store.periods.map((period) => <option key={period.id} value={period.id}>{period.ten_dot}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => setEditing({ ...emptyRow, period_id: periodId })}><Plus size={18} /> Nhập một dòng</Button>
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 text-sm font-bold text-primary">
            <Upload size={18} /> Import Excel
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="sr-only" />
          </label>
        </div>
      </Card>

      {(preview.length > 0 || importErrors.length > 0) && (
        <Card className="space-y-4 border-blue-200">
          <div className="flex items-center gap-2"><FileSpreadsheet className="text-primary" size={20} /><h3 className="font-black">Xem trước import</h3></div>
          <p className="text-sm text-slate-600">{preview.length} dòng hợp lệ • {importErrors.length} lỗi</p>
          {importErrors.length > 0 && <ul className="max-h-32 overflow-y-auto rounded-xl bg-red-50 p-3 text-xs leading-5 text-danger">{importErrors.map((item) => <li key={item}>{item}</li>)}</ul>}
          {preview.length > 0 && (
            <>
              <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200">
                {preview.map((row, index) => {
                  const teacher = store.teachers.find((item) => item.id === row.teacher_id)
                  return <div key={`${row.teacher_id}-${row.thu}-${row.tiet}-${index}`} className="grid grid-cols-[1fr_auto] gap-2 border-b border-slate-100 p-2 text-xs"><span>{teacher?.name} • {row.lop} • {row.mon}</span><span>T{row.thu} / tiết {row.tiet}</span></div>
                })}
              </div>
              <Button className="w-full" variant="success" onClick={() => {
                try {
                  saveSchedules(preview)
                  store.refresh()
                  setPreview([])
                  setImportErrors([])
                  store.notify(`Đã import ${preview.length} dòng TKB.`)
                } catch (saveError) {
                  setImportErrors((current) => [...current, saveError.message])
                }
              }}>Xác nhận import {preview.length} dòng</Button>
            </>
          )}
        </Card>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-black text-ink">Lưới TKB</h3>
          <Badge variant="primary">{rows.length} dòng</Badge>
        </div>
        <div className="space-y-2">
          {rows.map((row) => {
            const teacher = store.teachers.find((item) => item.id === row.teacher_id)
            return (
              <Card key={row.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 p-3">
                <div className="rounded-xl bg-blue-100 px-3 py-2 text-center text-primary">
                  <p className="text-[10px] font-bold">THỨ {row.thu}</p><p className="font-black">T{row.tiet}</p>
                </div>
                <div className="min-w-0"><p className="truncate text-sm font-bold">{teacher?.name}</p><p className="mt-1 text-xs text-slate-500">{row.mon} • {row.lop}</p></div>
                <div className="flex">
                  <Button variant="ghost" className="h-9 min-h-9 px-2" onClick={() => setEditing({ ...row })}><Pencil size={16} /></Button>
                  <Button variant="ghost" className="h-9 min-h-9 px-2 text-danger" onClick={() => { deleteSchedule(row.id); store.refresh() }}><Trash2 size={16} /></Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      <Modal open={Boolean(editing)} title={editing?.id ? 'Sửa dòng TKB' : 'Nhập dòng TKB'} onClose={() => setEditing(null)}>
        {editing && (
          <form onSubmit={submit} className="space-y-4">
            {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-danger">{error}</p>}
            <label className="block"><span className="mb-1 block text-sm font-semibold">Giáo viên</span><select value={editing.teacher_id} onChange={(event) => { const teacher = store.teachers.find((item) => item.id === event.target.value); setEditing({ ...editing, teacher_id: event.target.value, mon: teacher?.mon_day[0] || editing.mon }) }} className="min-h-11 w-full rounded-xl border border-slate-300 px-3"><option value="">Chọn GV</option>{store.teachers.filter((teacher) => teacher.active).map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select></label>
            <div className="grid grid-cols-2 gap-3"><label><span className="mb-1 block text-sm font-semibold">Thứ</span><input type="number" min="2" max="7" value={editing.thu} onChange={(event) => setEditing({ ...editing, thu: Number(event.target.value) })} className="min-h-11 w-full rounded-xl border border-slate-300 px-3" /></label><label><span className="mb-1 block text-sm font-semibold">Tiết</span><input type="number" min="1" max="10" value={editing.tiet} onChange={(event) => setEditing({ ...editing, tiet: Number(event.target.value) })} className="min-h-11 w-full rounded-xl border border-slate-300 px-3" /></label></div>
            <div className="grid grid-cols-2 gap-3"><label><span className="mb-1 block text-sm font-semibold">Lớp</span><input value={editing.lop} onChange={(event) => setEditing({ ...editing, lop: event.target.value })} className="min-h-11 w-full rounded-xl border border-slate-300 px-3" /></label><label><span className="mb-1 block text-sm font-semibold">Môn</span><input value={editing.mon} onChange={(event) => setEditing({ ...editing, mon: event.target.value })} className="min-h-11 w-full rounded-xl border border-slate-300 px-3" /></label></div>
            <Button className="w-full" type="submit">Lưu dòng TKB</Button>
          </form>
        )}
      </Modal>
    </div>
  )
}
