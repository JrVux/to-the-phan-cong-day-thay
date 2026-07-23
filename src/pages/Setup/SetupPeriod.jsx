import { useState } from 'react'
import { CalendarPlus, CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import { deletePeriod, getCurrentPeriod, savePeriod } from '../../services/scheduleService'
import { useAppStore } from '../../stores/appStore'

const newPeriod = {
  nam_hoc: '2026-2027',
  ten_dot: '',
  tu_ngay: '',
  den_ngay: '',
  hoc_ky: 1,
}

export default function SetupPeriod() {
  const store = useAppStore()
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [preferred, setPreferred] = useState(localStorage.getItem('tothe_preferred_period') || '')
  const current = getCurrentPeriod()

  function submit(event) {
    event.preventDefault()
    setError('')
    try {
      savePeriod(editing)
      store.refresh()
      setEditing(null)
      store.notify('Đã lưu đợt thời khóa biểu.')
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-ink">Các đợt thời khóa biểu</h2>
          <p className="text-xs text-slate-500">Dữ liệu cũ luôn được giữ nguyên.</p>
        </div>
        <Button onClick={() => setEditing({ ...newPeriod })}><Plus size={18} /> Tạo đợt</Button>
      </div>
      {store.periods
        .slice()
        .sort((a, b) => b.tu_ngay.localeCompare(a.tu_ngay))
        .map((period) => (
          <Card key={period.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-ink">{period.ten_dot}</h3>
                  {(current?.id === period.id || preferred === period.id) && <Badge variant="success">Hiện tại</Badge>}
                </div>
                <p className="mt-2 text-sm text-slate-600">{period.tu_ngay} → {period.den_ngay}</p>
                <p className="mt-1 text-xs text-slate-400">{period.nam_hoc} • Học kỳ {period.hoc_ky}</p>
              </div>
              <Button variant="ghost" className="h-10 min-h-10 px-3" onClick={() => setEditing({ ...period })}><Pencil size={17} /></Button>
            </div>
            <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
              <Button variant="secondary" onClick={() => {
                localStorage.setItem('tothe_preferred_period', period.id)
                setPreferred(period.id)
                store.notify('Đã đặt làm đợt mặc định trong thiết lập.')
              }}><CheckCircle2 size={17} /> Đặt làm đợt hiện tại</Button>
              <Button variant="danger" onClick={() => {
                if (window.confirm('Xóa đợt này? Lịch sử phân công cũ không bị xóa.')) {
                  deletePeriod(period.id)
                  store.refresh()
                }
              }} aria-label={`Xóa ${period.ten_dot}`}><Trash2 size={17} /></Button>
            </div>
          </Card>
        ))}

      <Modal open={Boolean(editing)} title={editing?.id ? 'Sửa đợt TKB' : 'Tạo đợt mới'} onClose={() => setEditing(null)}>
        {editing && (
          <form onSubmit={submit} className="space-y-4">
            {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-danger">{error}</p>}
            <label className="block"><span className="mb-1 block text-sm font-semibold">Tên đợt</span><input value={editing.ten_dot} onChange={(event) => setEditing({ ...editing, ten_dot: event.target.value })} className="min-h-11 w-full rounded-xl border border-slate-300 px-3" /></label>
            <label className="block"><span className="mb-1 block text-sm font-semibold">Năm học</span><input value={editing.nam_hoc} onChange={(event) => setEditing({ ...editing, nam_hoc: event.target.value })} className="min-h-11 w-full rounded-xl border border-slate-300 px-3" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label><span className="mb-1 block text-sm font-semibold">Từ ngày</span><input type="date" value={editing.tu_ngay} onChange={(event) => setEditing({ ...editing, tu_ngay: event.target.value })} className="min-h-11 w-full rounded-xl border border-slate-300 px-3" /></label>
              <label><span className="mb-1 block text-sm font-semibold">Đến ngày</span><input type="date" value={editing.den_ngay} onChange={(event) => setEditing({ ...editing, den_ngay: event.target.value })} className="min-h-11 w-full rounded-xl border border-slate-300 px-3" /></label>
            </div>
            <label className="block"><span className="mb-1 block text-sm font-semibold">Học kỳ</span><select value={editing.hoc_ky} onChange={(event) => setEditing({ ...editing, hoc_ky: Number(event.target.value) })} className="min-h-11 w-full rounded-xl border border-slate-300 px-3"><option value="1">Học kỳ 1</option><option value="2">Học kỳ 2</option></select></label>
            <Button className="w-full" type="submit"><CalendarPlus size={18} /> Lưu đợt TKB</Button>
          </form>
        )}
      </Modal>
    </div>
  )
}
