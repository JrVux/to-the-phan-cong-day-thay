import { Link } from 'react-router-dom'
import { ArrowRight, CalendarClock, LockKeyhole, Sparkles, TriangleAlert, UsersRound } from 'lucide-react'
import WarningBanner from '../components/WarningBanner'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { getBalanceWarning } from '../engine/scoringEngine'
import { getCurrentPeriod } from '../services/scheduleService'
import { buildTeacherSummary, getDashboardStats } from '../services/reportService'
import { useAppStore } from '../stores/appStore'

export default function Home() {
  const store = useAppStore()
  const demoDate = getCurrentPeriod(new Date()) ? new Date() : '2025-09-22'
  const stats = getDashboardStats(demoDate)
  const period = getCurrentPeriod(demoDate)
  const summary = buildTeacherSummary({ hoc_ky: period?.hoc_ky, nam_hoc: period?.nam_hoc })
  const warning = getBalanceWarning(summary.map((row) => ({ balance: -row.thua_thieu })))
  const recent = [...store.substitutions].sort((a, b) => b.ngay.localeCompare(a.ngay)).slice(0, 3)

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl border border-white/40 bg-gradient-to-br from-primaryDeep via-primary to-primary p-6 text-center text-white shadow-soft">
<div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/20 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-gold/10 blur-2xl"
          aria-hidden="true"
        />
        <div className="relative flex items-center justify-center">
          <Badge className="bg-gold/20 text-gold" variant="primary">{period?.ten_dot || 'Chưa có đợt hiện tại'}</Badge>
          <Sparkles className="absolute right-6 top-1 text-gold/80" size={20} />
        </div>
        <h1 className="relative mt-8 text-3xl font-black leading-tight tracking-tight">
          Vững tri thức.<br />Khỏe thể chất.<br />Chắc bản lĩnh.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/80">
          Quản lý và phân công dạy thay nhanh chóng, khoa học, góp phần xây dựng một tập thể chủ động, đoàn kết và trách nhiệm.
        </p>
        <Link to="/phan-cong" className="relative mx-auto mt-6 block max-w-sm">
          <Button className="w-full bg-gold text-ink ring-1 ring-white/20 hover:bg-goldDeep">Tạo phân công mới <ArrowRight size={18} /></Button>
        </Link>
      </header>

      {warning.level !== 'none' && <WarningBanner level={warning.level}>{warning.message}</WarningBanner>}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black tracking-tight text-ink">Tổng quan</h2>
          <span className="text-xs font-medium text-slate-500">Dữ liệu hiện tại</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Giáo viên', value: stats.totalTeachers, icon: UsersRound, tone: 'bg-primary text-white' },
            { label: 'Tiết thế tháng', value: stats.substitutionsThisMonth, icon: CalendarClock, tone: 'bg-gold text-ink' },
            { label: 'Chưa phân công', value: stats.unassigned, icon: TriangleAlert, tone: 'bg-amber-100/80 text-warning' },
            { label: 'Ngoại lệ hiệu lực', value: stats.activeLocks, icon: LockKeyhole, tone: 'bg-red-100/80 text-danger' },
          ].map(({ label, value, icon: Icon, tone }) => (
            <Card key={label} className="p-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon size={18} strokeWidth={2.2} /></div>
              <p className="mt-4 text-2xl font-black tracking-tight text-ink">{value}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black tracking-tight text-ink">Phân công gần đây</h2>
          <Link to="/lich-su" className="text-sm font-bold text-ink">Xem tất cả</Link>
        </div>
        <Card className="divide-y divide-slate-100 p-0">
          {recent.map((item) => {
            const substitute = store.teachers.find((teacher) => teacher.id === item.the_teacher_id)
            return (
              <div key={item.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-bold text-ink">Tiết {item.tiet} • {item.mon} • {item.lop}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.ngay}</p>
                </div>
                <Badge variant={substitute ? 'success' : 'warning'}>{substitute?.name || 'Chưa phân công'}</Badge>
              </div>
            )
          })}
        </Card>
      </section>
    </div>
  )
}
