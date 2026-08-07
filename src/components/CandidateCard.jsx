import { CalendarDays, Check, Clock3, Sparkles } from 'lucide-react'
import { describeTiet } from '../services/scheduleService'
import Badge from './ui/Badge'
import Button from './ui/Button'

const borderClasses = {
  1: 'border-2 border-success bg-emerald-50/40',
  2: 'border-2 border-primary/40',
  3: 'border border-slate-200/70',
}

export default function CandidateCard({
  rank,
  name,
  balance,
  lien_ke,
  tiet_ngay_do = [],
  dayTKB = [],
  the_trong_ngay = 0,
  finalScore,
  ly_do,
  selected = false,
  onSelect,
}) {
  const balanceText = balance > 0 ? `Thiếu ${balance} tiết chuẩn` : balance < 0 ? `Thừa ${-balance} tiết chuẩn` : 'Đủ tiết chuẩn'
  return (
    <article className={`rounded-2xl bg-white p-4 shadow-sm transition ${borderClasses[rank] || borderClasses[3]} ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-black text-slate-400">#{rank}</span>
            <h3 className="font-bold text-ink">{name}</h3>
            {rank === 1 && <Badge variant="success"><Sparkles size={12} className="mr-1" />Đề xuất</Badge>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1">
              <Clock3 size={14} /> {balanceText}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1">
              <CalendarDays size={14} />
              {tiet_ngay_do.length ? `Đang dạy tiết ${tiet_ngay_do.map((tiet) => describeTiet({ tiet }).label).join(', ')}` : 'Không có tiết ngày này'}
            </span>
            {lien_ke && <Badge variant="primary">Liền kề</Badge>}
            {the_trong_ngay > 0 && <Badge variant="warning">Đã thế {the_trong_ngay} tiết hôm nay</Badge>}
          </div>
          {dayTKB.length > 0 && (
            <div className="mt-3 rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">TKB hôm nay</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                {dayTKB.map((item) => `${item.label}: ${item.mon} ${item.lop}`).join(' • ')}
              </p>
            </div>
          )}
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary">{Math.round(finalScore * 100)}đ</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{ly_do}</p>
      <Button
        variant={selected ? 'success' : rank === 1 ? 'primary' : 'secondary'}
        className="mt-4 w-full"
        onClick={onSelect}
        aria-label={`Chọn ${name}`}
      >
        {selected ? <><Check size={18} /> Đã chọn</> : 'Chọn giáo viên'}
      </Button>
    </article>
  )
}
