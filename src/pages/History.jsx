import { useMemo, useState } from 'react'
import { Download, FileSpreadsheet, FileText, Filter, History as HistoryIcon } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { buildTeacherSummary } from '../services/reportService'
import { listSubstitutions } from '../services/substitutionService'
import { useAppStore } from '../stores/appStore'
import { exportReportExcel, exportReportPdf } from '../utils/exportReport'
import Report from './Report'

export default function History() {
  const store = useAppStore()
  const [hocKy, setHocKy] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [month, setMonth] = useState('')
  const [exporting, setExporting] = useState('')
  const filters = useMemo(
    () => ({
      hoc_ky: hocKy || undefined,
      teacher_id: teacherId || undefined,
      month: month || undefined,
    }),
    [hocKy, teacherId, month],
  )
  const history = listSubstitutions(filters)
  const summary = buildTeacherSummary({ hoc_ky: hocKy || undefined })

  async function runExport(type) {
    setExporting(type)
    try {
      if (type === 'excel') await exportReportExcel({ summary, history, teachers: store.teachers })
      else await exportReportPdf({ summary })
      store.notify(`Đã xuất báo cáo ${type === 'excel' ? 'Excel' : 'PDF'}.`)
    } catch {
      store.notify('Không thể xuất báo cáo. Vui lòng thử lại.', 'error')
    } finally {
      setExporting('')
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Dữ liệu toàn năm</p>
        <h1 className="mt-1 text-2xl font-black text-ink">Lịch sử & Báo cáo</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Theo dõi phân công, cân bằng thừa giờ và xuất hồ sơ.</p>
      </header>

      <Card className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-black text-ink"><Filter size={18} className="text-primary" /> Bộ lọc</div>
        <div className="grid gap-3 sm:grid-cols-3">
          <select aria-label="Học kỳ" value={hocKy} onChange={(event) => setHocKy(event.target.value)} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm"><option value="">Tất cả học kỳ</option><option value="1">Học kỳ 1</option><option value="2">Học kỳ 2</option></select>
          <select aria-label="Giáo viên" value={teacherId} onChange={(event) => setTeacherId(event.target.value)} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm"><option value="">Tất cả giáo viên</option>{store.teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select>
          <input aria-label="Tháng" type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm" />
        </div>
      </Card>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div><h2 className="text-lg font-black text-ink">Tổng hợp thừa giờ</h2><p className="text-xs text-slate-500">Tiết thế không cộng vào tiết chuẩn.</p></div>
          <Badge variant="primary">{summary.length} GV</Badge>
        </div>
        <Report summary={summary} />
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" disabled={Boolean(exporting)} onClick={() => runExport('excel')}><FileSpreadsheet size={18} /> {exporting === 'excel' ? 'Đang xuất…' : 'Xuất Excel'}</Button>
        <Button variant="secondary" disabled={Boolean(exporting)} onClick={() => runExport('pdf')}><FileText size={18} /> {exporting === 'pdf' ? 'Đang xuất…' : 'Xuất PDF'}</Button>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2"><HistoryIcon size={20} className="text-primary" /><h2 className="text-lg font-black text-ink">Chi tiết lịch sử</h2></div>
          <Badge variant="neutral">{history.length} bản ghi</Badge>
        </div>
        <div className="space-y-3">
          {history.map((item) => {
            const absent = store.teachers.find((teacher) => teacher.id === item.nghi_teacher_id)
            const substitute = store.teachers.find((teacher) => teacher.id === item.the_teacher_id)
            return (
              <Card key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-ink">Tiết {item.tiet} • {item.mon} • {item.lop}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.ngay} • {item.nam_hoc} • HK{item.hoc_ky}</p>
                  </div>
                  <Badge variant={substitute ? 'success' : 'warning'}>{substitute ? 'Đã phân công' : 'Chưa phân công'}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm">
                  <div><p className="text-[10px] font-bold uppercase text-slate-400">GV vắng</p><p className="mt-1 font-semibold">{absent?.name || item.nghi_teacher_id}</p></div>
                  <span className="text-primary">→</span>
                  <div className="text-right"><p className="text-[10px] font-bold uppercase text-slate-400">GV dạy thế</p><p className="mt-1 font-semibold">{substitute?.name || 'Chưa phân công'}</p></div>
                </div>
                {item.ghi_chu && <p className="mt-3 text-xs italic text-slate-500">“{item.ghi_chu}”</p>}
              </Card>
            )
          })}
          {!history.length && (
            <Card className="py-10 text-center">
              <Download className="mx-auto text-slate-300" size={32} />
              <p className="mt-3 text-sm font-semibold text-slate-500">Không có bản ghi phù hợp bộ lọc.</p>
            </Card>
          )}
        </div>
      </section>
    </div>
  )
}
