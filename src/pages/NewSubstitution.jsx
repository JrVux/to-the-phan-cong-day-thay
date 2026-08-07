import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarCheck, CheckCircle2, FileText, Share2, Sparkles, UserRoundX } from 'lucide-react'
import CandidateCard from '../components/CandidateCard'
import DatePicker from '../components/DatePicker'
import TeacherSelector from '../components/TeacherSelector'
import WarningBanner from '../components/WarningBanner'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import {
  compareOptimal,
  computeTeacherBalance,
  getBalanceWarning,
  MAX_PERIODS_PER_SESSION,
  MAX_THE_PER_DAY,
  MAX_THE_PER_WEEK,
  MAX_TOTAL_PER_DAY,
  scoreCandidates,
  weekBounds,
} from '../engine/scoringEngine'
import { getCurrentPeriod, compactDayTKB, describeTiet, getSchedulesForTeacherDate, getVietnameseWeekday, isChaoCoPeriod, listPeriods, listSchedules } from '../services/scheduleService'
import { useAppStore } from '../stores/appStore'
import { exportAssignmentPdf } from '../utils/exportReport'

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
  const [savedRecords, setSavedRecords] = useState([])
  const [exporting, setExporting] = useState(false)

  const absentTeacher = store.teachers.find((teacher) => teacher.id === teacherId)
  const balance = useMemo(() => {
    const period = getCurrentPeriod(date)
    const counts = store.teachers
      .filter((teacher) => teacher.active)
      .map((teacher) => {
        const info = computeTeacherBalance({
          teacher,
          assignments: store.assignments,
          periods: store.periods,
          schedules: store.schedules,
          substitutions: store.substitutions,
          targetDate: date,
          periodId: period?.id,
        })
        return { balance: info.balance }
      })
    return getBalanceWarning(counts)
  }, [date, store.assignments, store.periods, store.schedules, store.substitutions, store.teachers])

  const selectedCount = useMemo(() => {
    const counts = {}
    Object.values(selected).forEach((tid) => {
      if (tid) counts[tid] = (counts[tid] || 0) + 1
    })
    return counts
  }, [selected])

  const absentDayTKB = useMemo(() => {
    if (!teacherId || !date) return []
    const period = getCurrentPeriod(date)
    if (!period) return []
    return compactDayTKB(getSchedulesForTeacherDate(teacherId, date, period.id))
  }, [teacherId, date])

  const candidatesOf = useMemo(() => {
    const map = {}
    lessons.forEach((lesson) => {
      const lessonSessionMorning = Number(lesson.tiet) <= 5
      map[lesson.id] = lesson.candidates.filter((candidate) => {
        const isThisLesson = selected[lesson.id] === candidate.teacher.id
        const effectiveSelected = (selectedCount[candidate.teacher.id] || 0) - (isThisLesson ? 1 : 0)
        const effectiveTheTrongNgay = candidate.the_trong_ngay + effectiveSelected
        if (effectiveTheTrongNgay >= MAX_THE_PER_DAY) return false
        if (candidate.tiet_ngay_do.length + effectiveTheTrongNgay >= MAX_TOTAL_PER_DAY) return false
        const effectiveWeekCount = candidate.the_tuan + effectiveSelected
        if (effectiveWeekCount >= MAX_THE_PER_WEEK) return false
        const sessionRegular = (candidate.tiet_ngay_do || []).filter(
          (t) => (Number(t) <= 5) === lessonSessionMorning,
        ).length
        const selectedInSession = Object.entries(selected).filter(([lid, tid]) => {
          if (tid !== candidate.teacher.id) return false
          if (lid === lesson.id) return false
          const l = lessons.find((item) => item.id === lid)
          return l && (Number(l.tiet) <= 5) === lessonSessionMorning
        }).length
        const effectiveSessionSubs = candidate.the_trong_ngay_session + selectedInSession - (isThisLesson ? 1 : 0)
        if (sessionRegular + effectiveSessionSubs >= MAX_PERIODS_PER_SESSION) return false
        return true
      })
    })
    return map
  }, [lessons, selected, selectedCount])

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
    const rows = getSchedulesForTeacherDate(teacherId, date, period.id)
      .filter((lesson) => !isChaoCoPeriod(lesson))
      .map((lesson) => ({
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
        assignments: store.assignments,
        periods: store.periods,
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

  function autoSelectOptimal() {
    const next = { ...selected }
    const targetDateStr = date
    const { start: weekStart, end: weekEnd } = weekBounds(date)

    const saved = {}
    store.substitutions.forEach((row) => {
      if (!row.the_teacher_id) return
      const tid = row.the_teacher_id
      if (!saved[tid]) saved[tid] = { day: 0, week: 0, morning: 0, afternoon: 0 }
      const rowDate = row.ngay instanceof Date ? row.ngay.toISOString().slice(0, 10) : String(row.ngay).slice(0, 10)
      if (rowDate === targetDateStr) {
        saved[tid].day += 1
        if (Number(row.tiet) <= 5) saved[tid].morning += 1
        else saved[tid].afternoon += 1
      }
      const rowDateObj = new Date(`${rowDate}T12:00:00`)
      if (rowDateObj >= weekStart && rowDateObj <= weekEnd) {
        saved[tid].week += 1
      }
    })

    const counts = {}
    const regularLessons = {}
    lessons.forEach((lesson) => {
      lesson.candidates.forEach((c) => {
        const tid = c.teacher.id
        if (!(tid in counts)) {
          counts[tid] = { ...(saved[tid] || { day: 0, week: 0, morning: 0, afternoon: 0 }) }
          regularLessons[tid] = {
            morning: (c.tiet_ngay_do || []).filter((t) => Number(t) <= 5).length,
            afternoon: (c.tiet_ngay_do || []).filter((t) => Number(t) > 5).length,
          }
        }
      })
    })

    Object.entries(next).forEach(([lessonId, tid]) => {
      const lesson = lessons.find((l) => l.id === lessonId)
      if (!tid || !lesson || !(tid in counts)) return
      counts[tid].day += 1
      counts[tid].week += 1
      if (Number(lesson.tiet) <= 5) counts[tid].morning += 1
      else counts[tid].afternoon += 1
    })

    const ordered = [...lessons].sort((a, b) => {
      const buoiA = a.buoi === 'Chiều' ? 1 : 0
      const buoiB = b.buoi === 'Chiều' ? 1 : 0
      if (buoiA !== buoiB) return buoiA - buoiB
      return (a.tiet_trong_buoi || a.tiet) - (b.tiet_trong_buoi || b.tiet)
    })

    const isWithinLimits = (tid, session) => {
      const c = counts[tid]
      if (!c) return false
      const rl = regularLessons[tid]?.[session] || 0
      return (
        c.day < MAX_THE_PER_DAY &&
        c.week < MAX_THE_PER_WEEK &&
        c[session] + rl < MAX_PERIODS_PER_SESSION &&
        (regularLessons[tid] ? regularLessons[tid].morning + regularLessons[tid].afternoon : 0) + c.day < MAX_TOTAL_PER_DAY
      )
    }

    const covered = new Set()
    ordered.forEach((lesson, index) => {
      if (covered.has(lesson.id)) return
      const session = Number(lesson.tiet) <= 5 ? 'morning' : 'afternoon'
      const available = lesson.candidates
        .filter((c) => isWithinLimits(c.teacher.id, session) && c.tiet_ngay_do.length + (counts[c.teacher.id]?.day || 0) < MAX_TOTAL_PER_DAY)
        .sort(compareOptimal)
      if (!available.length) return
      const prev = index > 0 ? ordered[index - 1] : null
      const continuation = prev && next[prev.id]
        ? available.find((c) => c.teacher.id === next[prev.id])
        : null
      const chosen = continuation || available[0]
      const tid = chosen.teacher.id
      for (let j = index; j < ordered.length; j += 1) {
        const target = ordered[j]
        if (covered.has(target.id)) break
        const targetSession = Number(target.tiet) <= 5 ? 'morning' : 'afternoon'
        if (!isWithinLimits(tid, targetSession)) break
        if (target.candidates.some((c) => c.teacher.id === tid)) {
          next[target.id] = tid
          counts[tid].day += 1
          counts[tid].week += 1
          counts[tid][targetSession] += 1
          covered.add(target.id)
        } else {
          break
        }
      }
    })
    setSelected(next)
    store.notify(`Đã tự chọn: 1 lớp 1 GV thế, dạy liên tiếp (≤${MAX_THE_PER_DAY} thế/ngày, ≤${MAX_THE_PER_WEEK} thế/tuần, ≤${MAX_PERIODS_PER_SESSION} tiết/buổi, tổng ≤${MAX_TOTAL_PER_DAY} tiết/GV/ngày).`)
  }

  function save() {
    const dayCount = {}
    const weekCount = {}
    const sessionCount = {}
    const targetDateStr = date
    const { start: weekStart, end: weekEnd } = weekBounds(date)

    store.substitutions.forEach((row) => {
      if (!row.the_teacher_id) return
      const tid = row.the_teacher_id
      if (!(tid in dayCount)) {
        dayCount[tid] = 0
        weekCount[tid] = 0
        sessionCount[tid] = { morning: 0, afternoon: 0 }
      }
      const rowDate = row.ngay instanceof Date ? row.ngay.toISOString().slice(0, 10) : String(row.ngay).slice(0, 10)
      if (rowDate === targetDateStr) {
        dayCount[tid] += 1
        if (Number(row.tiet) <= 5) sessionCount[tid].morning += 1
        else sessionCount[tid].afternoon += 1
      }
      const rowDateObj = new Date(`${rowDate}T12:00:00`)
      if (rowDateObj >= weekStart && rowDateObj <= weekEnd) {
        weekCount[tid] += 1
      }
    })

    const dayLessonsOf = {}
    const sessionLessonsOf = {}
    lessons.forEach((lesson) => {
      lesson.candidates.forEach((candidate) => {
        if (!(candidate.teacher.id in dayLessonsOf)) {
          dayLessonsOf[candidate.teacher.id] = candidate.tiet_ngay_do.length
          sessionLessonsOf[candidate.teacher.id] = {
            morning: (candidate.tiet_ngay_do || []).filter((t) => Number(t) <= 5).length,
            afternoon: (candidate.tiet_ngay_do || []).filter((t) => Number(t) > 5).length,
          }
        }
      })
    })

    lessons.forEach((lesson) => {
      const tid = selected[lesson.id]
      if (!tid) return
      if (!(tid in dayCount)) {
        dayCount[tid] = 0
        weekCount[tid] = 0
        sessionCount[tid] = { morning: 0, afternoon: 0 }
      }
      dayCount[tid] += 1
      weekCount[tid] += 1
      if (Number(lesson.tiet) <= 5) sessionCount[tid].morning += 1
      else sessionCount[tid].afternoon += 1
    })

    const violator = Object.entries(dayCount).find(([tid, count]) => {
      const dayReg = dayLessonsOf[tid] || 0
      const sessionKey = Number(lessons.find((l) => selected[l.id] === tid)?.tiet || 0) <= 5 ? 'morning' : 'afternoon'
      const sessionReg = sessionLessonsOf[tid]?.[sessionKey] || 0
      const sessionSubs = sessionCount[tid]?.[sessionKey] || 0
      return (
        count > MAX_THE_PER_DAY ||
        dayReg + count > MAX_TOTAL_PER_DAY ||
        weekCount[tid] > MAX_THE_PER_WEEK ||
        sessionSubs + sessionReg > MAX_PERIODS_PER_SESSION
      )
    })
    if (violator) {
      const teacherName = store.teachers.find((item) => item.id === violator[0])?.name || violator[0]
      const count = violator[1]
      const weekCount_val = weekCount[violator[0]] || 0
      const dayReg = dayLessonsOf[violator[0]] || 0
      setError(
        `Không thể lưu: ${teacherName} — ${count} thế hôm nay (≤${MAX_THE_PER_DAY}/ngày), ${weekCount_val} thế/tuần (≤${MAX_THE_PER_WEEK}), tổng ${dayReg + count} tiết (≤${MAX_TOTAL_PER_DAY}), ≤${MAX_PERIODS_PER_SESSION} tiết/buổi.`,
      )
      setStep(2)
      return
    }
    const records = lessons.map((lesson) => ({
      period_id: lesson.period.id,
      nghi_teacher_id: teacherId,
      the_teacher_id: selected[lesson.id] || null,
      ngay: date,
      thu: lesson.thu,
      tiet: lesson.tiet,
      tiet_trong_buoi: lesson.tiet_trong_buoi,
      buoi: lesson.buoi,
      lop: lesson.lop,
      mon: lesson.mon,
      hoc_ky: lesson.period.hoc_ky,
      nam_hoc: lesson.period.nam_hoc,
      ghi_chu: notes[lesson.id] || '',
    }))
    store.saveSubstitutions(records)
    setSavedRecords(records)
    setSavedCount(records.length)
    setStep(4)
  }

  async function exportPdf() {
    setExporting(true)
    try {
      await exportAssignmentPdf({
        ngay: date,
        thu: getVietnameseWeekday(date),
        absentTeacher: absentTeacher?.name || teacherId,
        records: savedRecords,
        teachers: store.teachers,
      })
      store.notify('Đã xuất báo cáo PDF gửi lên tổ.')
    } catch {
      store.notify('Không thể xuất báo cáo PDF. Vui lòng thử lại.', 'error')
    } finally {
      setExporting(false)
    }
  }

  async function shareResult() {
    const lines = lessons.map((lesson) => {
      const teacher = store.teachers.find((item) => item.id === selected[lesson.id])
      return `${describeTiet(lesson).label} • ${lesson.mon} ${lesson.lop}: ${teacher?.name || 'Chưa phân công'}`
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
          <p className="mt-2 text-sm leading-6 text-slate-600">Lịch sử và báo cáo thừa giờ đã được cập nhật. Xuất báo cáo PDF để gửi lên tổ.</p>
          <div className="mt-6 grid gap-3">
            <Button onClick={exportPdf} disabled={exporting}><FileText size={18} /> {exporting ? 'Đang xuất…' : 'Xuất báo cáo PDF'}</Button>
            <Button onClick={shareResult}><Share2 size={18} /> Chia sẻ kết quả</Button>
            <Button variant="secondary" onClick={() => {
              setStep(1)
              setTeacherId('')
              setLessons([])
              setSelected({})
              setSavedRecords([])
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
          {absentDayTKB.length > 0 && (
            <div className="rounded-xl bg-blue-50 px-4 py-2 text-xs leading-6 text-blue-800">
              <span className="font-bold">TKB của {absentTeacher?.name}:</span>{' '}
              {absentDayTKB.map((item) => `${item.label}: ${item.mon} ${item.lop}`).join(' • ')}
            </div>
          )}
          <p className="text-xs text-slate-500">Quy định: mỗi GV thế tối đa {MAX_THE_PER_DAY} tiết/ngày, {MAX_THE_PER_WEEK} tiết/tuần, {MAX_PERIODS_PER_SESSION} tiết/buổi, tổng dạy + thế ≤ {MAX_TOTAL_PER_DAY} tiết/ngày.</p>
          {lessons.map((lesson) => {
            const candidates = candidatesOf[lesson.id] || []
            return (
              <section key={lesson.id} data-testid="lesson-candidate" className="space-y-3">
                <div className="sticky top-16 z-10 rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-lg">
                  <p className="font-bold">{describeTiet(lesson).label} — {lesson.mon} — {lesson.lop}</p>
                  <p className="mt-1 text-xs text-slate-300">{candidates.length} ứng viên hợp lệ</p>
                </div>
                {candidates.length ? candidates.slice(0, 3).map((candidate, index) => (
                  <CandidateCard
                    key={candidate.teacher.id}
                    rank={index + 1}
                    name={candidate.teacher.name}
                    balance={candidate.balance}
                    lien_ke={candidate.lien_ke}
                    tiet_ngay_do={candidate.tiet_ngay_do}
                    dayTKB={candidate.dayTKB}
                    the_trong_ngay={candidate.the_trong_ngay}
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
            )
          })}
          <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto]">
            <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft size={18} /> Quay lại</Button>
            <Button variant="secondary" onClick={autoSelectOptimal}><Sparkles size={18} /> Tự chọn phân công tối ưu nhất</Button>
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
                    <p className="font-bold text-ink">{describeTiet(lesson).label} • {lesson.mon} • {lesson.lop}</p>
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
