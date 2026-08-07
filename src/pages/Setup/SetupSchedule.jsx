import { useMemo, useState } from 'react'
import { FileSpreadsheet, Plus, Upload } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import { computeTeacherWorkload, saveSchedule, saveSchedules, updateAssignmentsFromSchedules } from '../../services/scheduleService'
import { getRoles } from '../../services/roleService'
import { useAppStore } from '../../stores/appStore'
import { parseScheduleFile } from '../../utils/scheduleImport'

function WorkloadTable({ data, title = 'Phân tích khối lượng' }) {
  const totalThua = data.reduce((sum, d) => sum + Math.max(0, d.thua_thieu), 0)
  const totalThieu = data.reduce((sum, d) => sum + Math.max(0, -d.thua_thieu), 0)
  return (
    <Card className="space-y-3 border-gold/40">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-ink">{title}</h3>
        <Badge variant="primary">{data.length} GV</Badge>
      </div>
      <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-900 text-xs uppercase text-white">
            <tr>
              <th className="sticky left-0 top-0 z-30 bg-slate-900 px-3 py-2.5">Giáo viên</th>
              <th className="sticky top-0 z-20 bg-slate-900 px-3 py-2.5 text-center">Môn</th>
              <th className="sticky top-0 z-20 bg-slate-900 px-3 py-2.5 text-center">Số lớp</th>
              <th className="sticky top-0 z-20 bg-slate-900 px-3 py-2.5 text-center">Tiết/TKB</th>
              <th className="sticky top-0 z-20 bg-slate-900 px-3 py-2.5 text-center">Phụ cấp CN</th>
              <th className="sticky top-0 z-20 bg-slate-900 px-3 py-2.5 text-center">Tổng tiết</th>
              <th className="sticky top-0 z-20 bg-slate-900 px-3 py-2.5 text-center">Tiết chuẩn</th>
              <th className="sticky top-0 z-20 bg-slate-900 px-3 py-2.5 text-center">Thừa/Thiếu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row) => (
              <tr key={row.teacher_id} className="hover:bg-slate-50">
                <td className="sticky left-0 z-10 bg-white px-3 py-2">
                  <p className="font-semibold text-ink">{row.teacher_name}</p>
                  {row.vai_tro?.length > 0 && (
                    <p className="mt-0.5 space-x-1">
                      {getRoles(row.vai_tro).map((role) => (
                        <Badge key={role.id} variant={role.id === 'chu_nhiem' ? 'warning' : 'primary'}>{role.label}</Badge>
                      ))}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2 text-center text-xs text-slate-500">{row.mon}</td>
                <td className="px-3 py-2 text-center">{row.so_lop}</td>
                <td className="px-3 py-2 text-center">{row.so_tiet_cb}</td>
                <td className="px-3 py-2 text-center">
                  {row.phu_cap_cn > 0 ? <Badge variant="warning">+{row.phu_cap_cn}</Badge> : <span className="text-slate-300">0</span>}
                </td>
                <td className="px-3 py-2 text-center font-black text-ink">{row.so_tiet_tuan}</td>
                <td className="px-3 py-2 text-center">
                  {row.tiet_chuan}
                  {row.tiet_chuan !== row.tiet_chuan_goc && (
                    <span className="block text-[10px] text-slate-400">gốc {row.tiet_chuan_goc}</span>
                  )}
                </td>
                <td className={`px-3 py-2 text-center font-bold ${row.thua_thieu > 0 ? 'text-success' : row.thua_thieu < 0 ? 'text-danger' : 'text-slate-400'}`}>
                  {row.thua_thieu > 0 ? '+' : ''}{row.thua_thieu}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-4 text-xs text-slate-500">
        <span>Tổng thừa: <strong className="text-success">+{totalThua}</strong></span>
        <span className="text-slate-300">|</span>
        <span>Tổng thiếu: <strong className="text-danger">{totalThieu}</strong></span>
      </div>
      <p className="text-xs text-slate-400">Phụ cấp chủ nhiệm +4 tiết/tuần cho GVCN. Tiết chuẩn hiệu lực đã trừ kiêm nhiệm (Tổ Trưởng −3, Tổ phó −1, TTND −2, TTCĐ −3, TPCĐ −1, KTPMTin −2; Phó BTĐ đặt 8,5, Bí thư Đoàn đặt 2,5).</p>
    </Card>
  )
}

function TimetableGrid({ rows, teachers }) {
  const days = [2, 3, 4, 5, 6, 7]
  const sessions = ['Sáng', 'Chiều']

  const grid = useMemo(() => {
    const map = new Map()
    rows.forEach((row) => {
      const buoi = row.buoi || (row.tiet > 5 ? 'Chiều' : 'Sáng')
      const key = `${row.teacher_id}\u0000${row.thu}\u0000${buoi}`
      const cell = map.get(key) || new Map()
      cell.set(row.tiet_trong_buoi || row.tiet, row.lop)
      map.set(key, cell)
    })
    return map
  }, [rows])

  const totals = useMemo(() => {
    const map = new Map()
    rows.forEach((row) => map.set(row.teacher_id, (map.get(row.teacher_id) || 0) + 1))
    return map
  }, [rows])

  const teacherIds = useMemo(() => {
    const ids = new Set(rows.map((row) => row.teacher_id))
    return [...ids].map((id) => {
      const teacher = teachers.find((item) => item.id === id)
      return { id, name: teacher?.name || id, mons: [...new Set(rows.filter((row) => row.teacher_id === id).map((row) => row.mon))].join(', ') }
    }).sort((a, b) => a.name.localeCompare(b.name, 'vi'))
  }, [rows, teachers])

  return (
    <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="bg-slate-900 text-xs uppercase text-white">
            <th rowSpan={2} className="sticky left-0 top-0 z-30 bg-slate-900 px-3 py-2.5">Giáo viên</th>
            {days.map((day) => (
              <th key={day} colSpan={2} className="sticky top-0 z-20 bg-slate-900 border-l border-slate-700 px-3 py-2.5 text-center">Thứ {day}</th>
            ))}
            <th rowSpan={2} className="sticky top-0 z-20 bg-slate-900 border-l border-slate-700 px-3 py-2.5 text-center">Tổng tiết</th>
          </tr>
          <tr className="bg-slate-800 text-xs uppercase text-white">
            {days.map((day) => sessions.map((buoi) => (
              <th key={`${day}-${buoi}`} className="sticky top-9 z-20 bg-slate-800 border-l border-slate-700 px-2 py-2 text-center font-medium">{buoi}</th>
            )))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {teacherIds.map((teacher) => (
            <tr key={teacher.id} className="align-top hover:bg-slate-50">
              <td className="sticky left-0 z-10 bg-white px-3 py-2">
                <p className="whitespace-nowrap font-semibold text-ink">{teacher.name}</p>
                <p className="text-[10px] text-slate-400">{teacher.mons}</p>
              </td>
              {days.map((day) => sessions.map((buoi) => {
                const cell = grid.get(`${teacher.id}\u0000${day}\u0000${buoi}`)
                return (
                  <td key={`${day}-${buoi}`} className="border-l border-slate-100 px-1 py-1">
                    {[1, 2, 3, 4, 5].map((tiet) => {
                      const lop = cell?.get(tiet)
                      return (
                        <div key={tiet} className={`flex items-center gap-1 rounded px-1 py-0.5 text-xs ${lop ? 'hover:bg-gold/10' : ''}`}>
                          <span className="w-4 shrink-0 text-center text-[10px] font-bold text-slate-400">T{tiet}</span>
                          {lop ? <span className="truncate font-bold text-ink">{lop}</span> : <span className="text-slate-200">·</span>}
                        </div>
                      )
                    })}
                  </td>
                )
              }))}
              <td className="border-l border-slate-100 px-3 py-2 text-center text-base font-black text-primary">{totals.get(teacher.id) || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const emptyRow = { teacher_id: '', thu: 2, tiet: 1, lop: '', mon: 'Tin học' }

export default function SetupSchedule() {
  const store = useAppStore()
  const [periodId, setPeriodId] = useState(() => {
    const preferred = localStorage.getItem('tothe_preferred_period')
    return store.periods.some((period) => period.id === preferred)
      ? preferred
      : store.periods[0]?.id || ''
  })
  const [editing, setEditing] = useState(null)
  const [preview, setPreview] = useState([])
  const [importErrors, setImportErrors] = useState([])
  const [error, setError] = useState('')
  const [workloadPreview, setWorkloadPreview] = useState([])
  const rows = useMemo(
    () => store.schedules.filter((row) => row.period_id === periodId).sort((a, b) => a.thu - b.thu || a.tiet - b.tiet),
    [periodId, store.schedules],
  )
  const existingWorkload = useMemo(() => {
    if (periodId && rows.length > 0) return computeTeacherWorkload(periodId)
    return []
  }, [periodId, rows.length])

  async function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const result = await parseScheduleFile(file, { teachers: store.teachers, periodId })
      setPreview(result.rows)
      setImportErrors(result.errors)
      if (result.rows.length) {
        setWorkloadPreview(computeTeacherWorkload(periodId, result.rows))
      } else {
        setWorkloadPreview([])
      }
    } catch {
      setPreview([])
      setWorkloadPreview([])
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
          <p className="mt-1 text-xs text-slate-500">Nhập tay hoặc import bảng tính. Tự nhận diện file mẫu TKB theo môn (Tin học, Thể dục, GDQP) dạng lưới THỨ/BUỔI/TIẾT + cột giáo viên.</p>
        </div>
        <select value={periodId} onChange={(event) => setPeriodId(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 px-3">
          {store.periods.map((period) => <option key={period.id} value={period.id}>{period.ten_dot}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => setEditing({ ...emptyRow, period_id: periodId })}><Plus size={18} /> Nhập một dòng</Button>
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gold/15 px-3 text-sm font-bold text-ink">
            <Upload size={18} /> Import Excel
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="sr-only" />
          </label>
        </div>
      </Card>

      {(preview.length > 0 || importErrors.length > 0) && (
        <Card className="space-y-4 border-gold/40">
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
              {workloadPreview.length > 0 && <WorkloadTable data={workloadPreview} title="Phân tích khối lượng (dữ liệu import)" />}
              <Button className="w-full" variant="success" onClick={() => {
                try {
                  saveSchedules(preview)
                  updateAssignmentsFromSchedules(periodId)
                  store.refresh()
                  setPreview([])
                  setWorkloadPreview([])
                  setImportErrors([])
                  store.notify(`Đã import ${preview.length} dòng TKB và cập nhật phân công.`)
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
        <TimetableGrid rows={rows} teachers={store.teachers} />
        <p className="mt-2 text-xs text-slate-400">Mỗi ô hiện các tiết dạy từ 1–5 trong buổi hôm đó kèm lớp. Cột cuối là tổng số tiết dạy trong đợt.</p>
      </div>

      {existingWorkload.length > 0 && (
        <>
          <WorkloadTable data={existingWorkload} title="Phân tích khối lượng (TKB hiện tại)" />
          <Button variant="secondary" onClick={() => {
            try {
              updateAssignmentsFromSchedules(periodId)
              store.refresh()
              store.notify('Đã cập nhật phân công chuyên môn từ TKB.')
            } catch (err) {
              store.notify(err.message, 'error')
            }
          }}>Cập nhật phân công từ TKB</Button>
        </>
      )}

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
