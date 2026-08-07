import WarningBanner from '../components/WarningBanner'
import Card from '../components/ui/Card'
import { getBalanceWarning } from '../engine/scoringEngine'

export default function Report({ summary }) {
  const warning = getBalanceWarning(summary.map((row) => ({ balance: -row.thua_thieu })))
  return (
    <div className="space-y-4">
      {warning.level !== 'none' && <WarningBanner level={warning.level}>{warning.message}</WarningBanner>}
      <Card className="overflow-hidden p-0">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-slate-900 text-xs uppercase tracking-wide text-white">
              <tr><th className="sticky left-0 top-0 z-30 bg-slate-900 px-4 py-3">Giáo viên</th><th className="sticky top-0 z-20 bg-slate-900 px-3 py-3 text-center">Chuẩn</th><th className="sticky top-0 z-20 bg-slate-900 px-3 py-3 text-center">Tiết/tuần</th><th className="sticky top-0 z-20 bg-slate-900 px-3 py-3 text-center">Thế</th><th className="sticky top-0 z-20 bg-slate-900 px-3 py-3 text-center">Thừa/Thiếu</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.map((row) => (
                <tr key={row.teacher_id}>
                  <td className="sticky left-0 z-10 bg-white px-4 py-3"><p className="font-bold text-ink">{row.name}</p><p className="mt-1 text-xs text-slate-400">{row.mon_day.join(', ')}</p></td>
                  <td className="px-3 py-3 text-center">{row.tiet_chuan}</td>
                  <td className="px-3 py-3 text-center">{row.so_tiet_tuan}</td>
                  <td className="px-3 py-3 text-center font-bold text-primary">{row.tiet_the}</td>
                  <td className={`px-3 py-3 text-center font-bold ${row.thua_thieu > 0 ? 'text-amber-600' : row.thua_thieu < 0 ? 'text-ink' : 'text-slate-500'}`}>
                    {row.thua_thieu === 0 ? 'Đủ chuẩn' : row.thua_thieu > 0 ? `Thừa ${row.thua_thieu}` : `Thiếu ${-row.thua_thieu}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
