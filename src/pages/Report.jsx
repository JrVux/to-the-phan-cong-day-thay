import WarningBanner from '../components/WarningBanner'
import Card from '../components/ui/Card'
import { getBalanceWarning } from '../engine/scoringEngine'

export default function Report({ summary }) {
  const warning = getBalanceWarning(summary.map((row) => ({ thua_gio_hk: row.tiet_the })))
  return (
    <div className="space-y-4">
      {warning.level !== 'none' && <WarningBanner level={warning.level}>{warning.message}</WarningBanner>}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-slate-900 text-xs uppercase tracking-wide text-white">
              <tr><th className="px-4 py-3">Giáo viên</th><th className="px-3 py-3 text-center">Chuẩn</th><th className="px-3 py-3 text-center">Thế</th><th className="px-3 py-3 text-center">Tổng</th><th className="px-3 py-3 text-center">Thừa/Thiếu</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.map((row) => (
                <tr key={row.teacher_id}>
                  <td className="px-4 py-3"><p className="font-bold text-ink">{row.name}</p><p className="mt-1 text-xs text-slate-400">{row.mon_day.join(', ')}</p></td>
                  <td className="px-3 py-3 text-center">{row.tiet_chuan}</td>
                  <td className="px-3 py-3 text-center font-bold text-primary">{row.tiet_the}</td>
                  <td className="px-3 py-3 text-center">{row.tong}</td>
                  <td className="px-3 py-3 text-center font-bold text-success">+{row.thua_thieu}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
