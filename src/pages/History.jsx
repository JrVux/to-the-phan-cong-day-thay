import { useMemo, useState } from 'react'
import { Download, FileSpreadsheet, FileText, Filter, History as HistoryIcon, Trash2 } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { buildTeacherSummary } from '../services/reportService'
import { describeTiet } from '../services/scheduleService'
import { listSubstitutions } from '../services/substitutionService'
import { useAppStore } from '../stores/appStore'
import { exportReportExcel, exportReportPdf, exportAssignmentsByAbsentTeacher } from '../utils/exportReport'
import Report from './Report'

export default function History() {
  const store = useAppStore()
  const [hocKy, setHocKy] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [month, setMonth] = useState('')
  const [exporting, setExporting] = useState('')
  const [confirmId, setConfirmId] = useState('')
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
      else if (type === 'pdf-per-teacher') {
        await exportAssignmentsByAbsentTeacher({ records: history, teachers: store.teachers })
      } else await exportReportPdf({ summary, history, teachers: store.teachers })
      store.notify(`Đã xuất báo cáo ${type === 'excel' ? 'Excel' : 'PDF'}.`)
    } catch {
      store.notify('Không thể xuất báo cáo. Vui lòng thử lại.', 'error')
    } finally {
      setExporting('')
    }
  }

  function confirmDelete(id) {
    store.removeSubstitution(id)
    setConfirmId('')
    store.notify('Đã xóa phân công dạy thay.')
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
          <div><h2 className="text-lg font-black text-ink">Tổng hợp cân bằng tiết chuẩn</h2><p className="text-xs text-slate-500">Tiết/tuần = TKB + phụ cấp chủ nhiệm (+4). Thừa/Thiếu = tổng (tiết/tuần − chuẩn × số tuần + thế) cộng dồn theo đợt.</p></div>
          <Badge variant="primary">{summary.length} GV</Badge>
        </div>
        <Report summary={summary} />
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" disabled={Boolean(exporting)} onClick={() => runExport('excel')}><FileSpreadsheet size={18} /> {exporting === 'excel' ? 'Đang xuất…' : 'Xuất Excel'}</Button>
        <Button variant="secondary" disabled={Boolean(exporting)} onClick={() => runExport('pdf')}><FileText size={18} /> {exporting === 'pdf' ? 'Đang xuất…' : 'Xuất PDF'}</Button>
      </div>
      <Button variant="secondary" className="w-full" disabled={Boolean(exporting)} onClick={() => runExport('pdf-per-teacher')}><FileText size={18} /> {exporting === 'pdf-per-teacher' ? 'Đang xuất…' : 'Xuất PDF theo từng GV vắng (mỗi GV 1 file)'}</Button>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2"><HistoryIcon size={20} className="text-primary" /><h2 className="text-lg font-black text-ink">Chi tiết lịch sử</h2></div>
          <Badge variant="neutral">{history.length} bản ghi</Badge>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          {history.length ? (
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">Ngày</th>
                  <th className="px-4 py-3">Tiết dạy</th>
                  <th className="px-4 py-3">Lớp / Môn</th>
                  <th className="px-4 py-3">GV vắng</th>
                  <th className="px-4 py-3">GV dạy thế</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Học kỳ</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => {
                  const absent = store.teachers.find((teacher) => teacher.id === item.nghi_teacher_id)
                  const substitute = store.teachers.find((teacher) => teacher.id === item.the_teacher_id)
                  return (
                    <tr key={item.id} className="border-t border-slate-100 align-top hover:bg-slate-50/60">
                      <td className="whitespace-nowrap px-4 py-3">
                        <p className="font-semibold text-ink">{item.ngay}</p>
                        <p className="text-xs text-slate-400">{item.nam_hoc}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{describeTiet(item).label}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-ink">{item.lop}</p>
                        <p className="text-xs text-slate-400">{item.mon}</p>
                      </td>
                      <td className="px-4 py-3">{absent?.name || item.nghi_teacher_id}</td>
                      <td className="px-4 py-3">{substitute?.name || (<span className="text-slate-400">Chưa phân công</span>)}</td>
                      <td className="px-4 py-3"><Badge variant={substitute ? 'success' : 'warning'}>{substitute ? 'Đã phân công' : 'Chưa phân công'}</Badge></td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-slate-500">HK{item.hoc_ky}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {confirmId === item.id ? (
                          <div className="flex justify-end gap-1">
                            <Button variant="danger" className="min-h-8 px-3 py-1" onClick={() => confirmDelete(item.id)}>Xóa</Button>
                            <Button variant="ghost" className="min-h-8 px-3 py-1" onClick={() => setConfirmId('')}>Hủy</Button>
                          </div>
                        ) : (
                          <Button variant="ghost" className="min-h-8 px-3 py-1" onClick={() => setConfirmId(item.id)} aria-label={`Xóa phân công ${describeTiet(item).label}`}><Trash2 size={16} /></Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
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
