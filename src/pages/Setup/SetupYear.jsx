import { useState } from 'react'
import { RefreshCw, Trash2 } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { countYearData, startNewYear } from '../../services/yearService'
import { useAppStore } from '../../stores/appStore'

export default function SetupYear() {
  const store = useAppStore()
  const [confirmNew, setConfirmNew] = useState(false)
  const [confirmAll, setConfirmAll] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const counts = countYearData()

  function handleNewYear() {
    if (!confirmNew) return setConfirmNew(true)
    if (!confirmText) return store.notify('Vui lòng gõ XÁC NHẬN để tiếp tục.', 'error')
    startNewYear()
    store.refresh()
    setConfirmNew(false)
    setConfirmText('')
    store.notify('Đã bắt đầu năm học mới: xóa lịch sử, TKB, phân công và ngoại lệ cũ.')
  }

  function handleResetAll() {
    if (!confirmAll) return setConfirmAll(true)
    if (!confirmText) return store.notify('Vui lòng gõ XÁC NHẬN để tiếp tục.', 'error')
    store.reset()
    store.refresh()
    setConfirmAll(false)
    setConfirmText('')
    store.notify('Đã xóa toàn bộ dữ liệu, khôi phục dữ liệu mẫu.')
  }

  return (
    <div className="space-y-5">
      <Card className="space-y-3 border-red-100">
        <div className="flex items-center gap-2 text-sm font-black text-ink"><RefreshCw size={18} className="text-primary" /> Bắt đầu năm học mới</div>
        <p className="text-xs leading-6 text-slate-500">Xóa lịch sử dạy thay, thời khóa biểu, phân công chuyên môn và ngoại lệ của năm cũ. <b>Giữ nguyên danh sách giáo viên</b> để không phải nhập lại. Sau đó tạo đợt TKB mới trong tab "Đợt TKB".</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-slate-50 p-3"><p className="font-bold text-ink">Sẽ giữ</p><p className="mt-1 text-slate-500">Giáo viên ({counts.teachers}), đợt TKB ({counts.periods})</p></div>
          <div className="rounded-xl bg-slate-50 p-3"><p className="font-bold text-ink">Sẽ xóa</p><p className="mt-1 text-slate-500">Lịch sử ({counts.substitutions}), TKB ({counts.schedules}), phân công ({counts.assignments}), ngoại lệ ({counts.locks})</p></div>
        </div>
        {confirmNew && (
          <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-bold text-danger">Xác nhận: gõ chữ XÁC NHẬN rồi bấm lại nút bên dưới.</p>
            <input value={confirmText} onChange={(event) => setConfirmText(event.target.value)} placeholder="XÁC NHẬN" className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" />
          </div>
        )}
        <Button variant="danger" className="w-full" onClick={handleNewYear}><RefreshCw size={18} /> {confirmNew ? 'Xác nhận bắt đầu năm học mới' : 'Bắt đầu năm học mới'}</Button>
      </Card>

      <Card className="space-y-3 border-red-100">
        <div className="flex items-center gap-2 text-sm font-black text-danger"><Trash2 size={18} /> Xóa toàn bộ dữ liệu</div>
        <p className="text-xs leading-6 text-slate-500">Xóa tất cả dữ liệu hiện tại và khôi phục về dữ liệu mẫu ban đầu (dùng khi chạy thử, nhập sai hoặc muốn làm lại từ đầu).</p>
        {confirmAll && (
          <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-bold text-danger">Xác nhận: gõ chữ XÁC NHẬN rồi bấm lại nút bên dưới.</p>
            <input value={confirmText} onChange={(event) => setConfirmText(event.target.value)} placeholder="XÁC NHẬN" className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" />
          </div>
        )}
        <Button variant="danger" className="w-full" onClick={handleResetAll}><Trash2 size={18} /> {confirmAll ? 'Xác nhận xóa toàn bộ' : 'Xóa toàn bộ dữ liệu'}</Button>
      </Card>
    </div>
  )
}