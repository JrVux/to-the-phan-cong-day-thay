import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarCheck, CheckCircle2, Share2, UserRoundX } from 'lucide-react'
import CandidateCard from '../components/CandidateCard'
import DatePicker from '../components/DatePicker'
import TeacherSelector from '../components/TeacherSelector'
import WarningBanner from '../components/WarningBanner'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { getBalanceWarning, scoreCandidates } from '../engine/scoringEngine'
import { getCurrentPeriod, getSchedulesForTeacherDate, getVietnameseWeekday, listPeriods, listSchedules } from '../services/scheduleService'
import { useAppStore } from '../stores/appStore'

function defaultDate() {
  const today = new Date().toISOString().slice(0, 10)
  if (getCurrentPeriod(today)) return today
  const fallbackPeriod = listPeriods().find((period) => listSchedules(period.id).length > 0)
  const firstLesson = fallbackPeriod && listSchedules(fallbackPeriod.id)[0]
  if (!fallbackPeriod || !firstLesson) return today
  const date = new Date(`${fallbackPeriod.tu_ngay}T12:00:00`)
  while (getVietnameseWeekday(date) !== firstLesson.thu && date.toISOString().slice(0, 10) <= fallbackPeriod.den_ngay) {
    date.setDate(date.getDate() + 1)
  }
  return date.toISOString().slice(0, 10)
}

export default function NewSubstitution() {
  const store = useAppStore()
  const [step, setStep] = useState(1)
  const [teacherId, setTeacherId] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [lessons, setLessons] = useState([])
  const [selected, setSelected] = useState({})
  const [notes, setNotes] = useState({})
  const [error, setError] = useState('')
  const [savedCount, setSavedCount] = useState(0)

  const absentTeacher = store.teachers.find((teacher) => teacher.id === teacherId)
  const balance = useMemo(() => {
    const counts = store.teachers
      .filter((teacher) => teacher.active)
      .map((teacher) => ({
        thua_gio_hk: store.substitutions.filter((row) => row.the_teacher_id === teacher.id).length,
      }))
    return getBalanceWarning(counts)
  }, [store.substitutions, store.teachers])

  function findLessons() {
    setError('')
    if (!teacherId || !date) {
      setError('Vui lòng chọn giáo viên vắng và ngày nghỉ.')
      return
    }
    const period = getCurrentPeriod(date)
    if (!period) {
      setError('Không có đợt thời khóa biểu hiệu lực cho ngày đã chọn.')
      return
    }
    const rows = getSchedulesForTeacherDate(teacherId, date, period.id).map((lesson) => ({
      ...lesson,
      period,
      candidates: scoreCandidates({
        nghi_teacher_id: teacherId,
        ngay: date,
        thu: lesson.thu,
        tiet: lesson.tiet,
        mon: lesson.mon,
        hoc_ky: period.hoc_ky,
        nam_hoc: period.nam_hoc,
        period_id: period.id,
        allTeachers: store.teachers,
        schedules: store.schedules,
        substitutions: store.substitutions,
        locks: store.locks,
      }),
    }))
    if (!rows.length) {
      setError('Giáo viên không có tiết dạy trong ngày này.')
      return
    }
    setLessons(rows)
    setSelected({})
    setStep(2)
  }

  function save() {
    const records = lessons.map((lesson) => ({
      period_id: lesson.period.id,
      nghi_teacher_id: teacherId,
      the_teacher_id: selected[lesson.id] || null,
      ngay: date,
      thu: lesson.thu,
      tiet: lesson.tiet,
      lop: lesson.lop,
      mon: lesson.mon,
      hoc_ky: lesson.period.hoc_ky,
      nam_hoc: lesson.period.nam_hoc,
      ghi_chu: notes[lesson.id] || '',
    }))
    store.saveSubstitutions(records)
    setSavedCount(records.length)
    setStep(4)
  }

  async function shareResult() {
    const lines = lessons.map((lesson) => {
      const teacher = store.teachers.find((item) => item.id === selected[lesson.id])
      return `Tiết ${lesson.tiet} • ${lesson.mon} ${lesson.lop}: ${teacher?.name || 'Chưa phân công'}`
    })
    const text = `Phân công dạy thay ngày ${date}\nGV vắng: ${absentTeacher?.name}\n${lines.join('\n')}`
    try {
      if (navigator.share) await navigator.share({ title: 'Phân công dạy thay', text })
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        store.notify('Đã sao chép nội dung để chia sẻ.')
      }
    } catch (shareError) {
      if (shareError.name !== 'AbortError') store.notify('Không thể chia sẻ lúc này.', 'error')
    }
  }

  if (step === 4) {
    return (
      <div className="space-y-5">
        <Card className="p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-success">
            <CheckCircle2 size={34} />
          </div>
          <h1 className="mt-4 text-2xl font-black text-ink">Đã lưu {savedCount} tiết phân công</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Lịch sử và báo cáo thừa giờ đã được cập nhật.</p>
          <div className="mt-6 grid gap-3">
            <Button onClick={shareResult}><Share2 size={18} /> Chia sẻ kết quả</Button>
            <Button variant="secondary" onClick={() => {
              setStep(1)
              setTeacherId('')
              setLessons([])
              setSelected({})
            }}>Tạo phân công khác</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Tác vụ chính</p>
        <h1 className="mt-1 text-2xl font-black text-ink">Phân công dạy thay</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Chọn giáo viên và ngày nghỉ, hệ thống sẽ xử lý phần còn lại.</p>
      </header>

      <ol className="grid grid-cols-3 gap-2" aria-label="Tiến trình">
        {['GV vắng', 'Chọn người thế', 'Xác nhận'].map((label, index) => (
          <li key={label} className={`rounded-xl px-2 py-2 text-center text-xs font-bold ${step === index + 1 ? 'bg-primary text-white' : step > index + 1 ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'}`}>
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      {error && <WarningBanner level="danger">{error}</WarningBanner>}
      {balance.level !== 'none' && <WarningBanner level={balance.level}>{balance.message}</WarningBanner>}

      {step === 1 && (
        <Card className="space-y-5 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2 text-primary"><UserRoundX size={22} /></div>
            <div>
              <h2 className="font-bold text-ink">Ai sẽ nghỉ?</h2>
              <p className="text-xs text-slate-500">Hệ thống tự tìm tất cả tiết trong ngày.</p>
            </div>
          </div>
          <TeacherSelector teachers={store.teachers} value={teacherId} onChange={setTeacherId} />
          <DatePicker value={date} onChange={setDate} />
          <Button className="w-full" onClick={findLessons}>
            <CalendarCheck size={18} /> Tìm tiết cần thế <ArrowRight size={18} />
          </Button>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-ink">Tìm thấy {lessons.length} tiết cần bố trí</h2>
              <p className="text-sm text-slate-500">{absentTeacher?.name} • {date}</p>
            </div>
            <Badge variant="primary">Thứ {getVietnameseWeekday(date)}</Badge>
          </div>
          {lessons.map((lesson) => (
            <section key={lesson.id} data-testid="lesson-candidate" className="space-y-3">
              <div className="sticky top-16 z-10 rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-lg">
                <p className="font-bold">Tiết {lesson.tiet} — {lesson.mon} — {lesson.lop}</p>
                <p className="mt-1 text-xs text-slate-300">{lesson.candidates.length} ứng viên hợp lệ</p>
              </div>
              {lesson.candidates.length ? lesson.candidates.slice(0, 3).map((candidate, index) => (
                <CandidateCard
                  key={candidate.teacher.id}
                  rank={index + 1}
                  name={candidate.teacher.name}
                  thua_gio_hk={candidate.thua_gio_hk}
                  lien_ke={candidate.lien_ke}
                  tiet_ngay_do={candidate.tiet_ngay_do}
                  finalScore={candidate.finalScore}
                  ly_do={candidate.ly_do}
                  selected={selected[lesson.id] === candidate.teacher.id}
                  onSelect={() => setSelected((current) => ({ ...current, [lesson.id]: candidate.teacher.id }))}
                />
              )) : (
                <WarningBanner level="danger">
                  Không tìm được GV thay phù hợp cho tiết này. Vui lòng xử lý thủ công.
                </WarningBanner>
              )}
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Ghi chú / lý do chưa phân công</span>
                <textarea
                  value={notes[lesson.id] || ''}
                  onChange={(event) => setNotes((current) => ({ ...current, [lesson.id]: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-primary"
                  rows="2"
                />
              </label>
            </section>
          ))}
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft size={18} /> Quay lại</Button>
            <Button onClick={() => setStep(3)}>Tiếp tục xác nhận <ArrowRight size={18} /></Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <Card className="space-y-4 p-5">
          <div>
            <p className="text-sm font-bold text-primary">Bước 3</p>
            <h2 className="text-xl font-black text-ink">Xác nhận phân công</h2>
          </div>
          <div className="space-y-3">
            {lessons.map((lesson) => {
              const teacher = store.teachers.find((item) => item.id === selected[lesson.id])
              return (
                <div key={lesson.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                  <div>
                    <p className="font-bold text-ink">Tiết {lesson.tiet} • {lesson.mon} • {lesson.lop}</p>
                    <p className="mt-1 text-xs text-slate-500">GV vắng: {absentTeacher?.name}</p>
                  </div>
                  <Badge variant={teacher ? 'success' : 'warning'}>{teacher?.name || 'Chưa phân công'}</Badge>
                </div>
              )
            })}
          </div>
          <Button className="w-full" variant="success" onClick={save}><CheckCircle2 size={18} /> Lưu phân công</Button>
          <Button className="w-full" variant="ghost" onClick={() => setStep(2)}><ArrowLeft size={18} /> Điều chỉnh lại</Button>
        </Card>
      )}
    </div>
  )
}
