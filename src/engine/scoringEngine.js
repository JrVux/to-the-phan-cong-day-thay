import { computeEffectiveTietChuan, computePhuCapChuNhiem } from '../services/roleService'
import { compactDayTKB, isChaoCoPeriod } from '../services/scheduleService'

export const MAX_THE_PER_DAY = 3
export const MAX_THE_PER_WEEK = 3
export const MAX_TOTAL_PER_DAY = 6
export const MAX_PERIODS_PER_SESSION = 4

function toDateString(value) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10)
}

function isMorningSession(tiet) {
  return Number(tiet) <= 5
}

export function countWeeks(tuNgay, denNgay) {
  const start = new Date(`${toDateString(tuNgay)}T12:00:00`)
  const end = new Date(`${toDateString(denNgay)}T12:00:00`)
  const days = Math.round((end - start) / (24 * 60 * 60 * 1000))
  return Math.max(1, Math.round(days / 7))
}

function startOfWeek(value) {
  const date = new Date(`${toDateString(value)}T12:00:00`)
  const day = date.getDay()
  const distance = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + distance)
  return date
}

function endOfWeek(value) {
  const date = startOfWeek(value)
  date.setDate(date.getDate() + 6)
  return date
}

export function weekBounds(date) {
  return { start: startOfWeek(date), end: endOfWeek(date) }
}

function scheduleScore(lessons, tiet) {
  const numericTiet = Number(tiet)
  const targetIsMorning = isMorningSession(numericTiet)
  const lessonPeriods = lessons.map((lesson) => Number(lesson.tiet))
  const distance = lessonPeriods.length
    ? Math.min(...lessonPeriods.map((period) => Math.abs(period - numericTiet)))
    : Number.POSITIVE_INFINITY
  const adjacentInSession = lessonPeriods.some(
    (period) => isMorningSession(period) === targetIsMorning && Math.abs(period - numericTiet) === 1,
  )
  if (adjacentInSession) {
    return { score: 1, label: 'có tiết liền kề', distance }
  }
  const sameSession = lessonPeriods.some((period) => isMorningSession(period) === targetIsMorning)
  if (sameSession) return { score: 0.66, label: 'có tiết cùng buổi', distance }
  if (lessonPeriods.length) return { score: 0.33, label: 'có tiết khác buổi', distance }
  return { score: 0.1, label: 'không có tiết trong ngày', distance }
}

export function computeTeacherBalance({
  teacher,
  assignments = [],
  periods = [],
  schedules = [],
  substitutions = [],
  targetDate = new Date(),
  periodId = null,
}) {
  const target = toDateString(targetDate)
  const currentPeriod = periodId ? periods.find((period) => period.id === periodId) : null
  const assignmentOf = (period) =>
    assignments.find((row) => row.teacher_id === teacher.id && (!period || row.period_id === period.id))
  const phuCapCN = computePhuCapChuNhiem(teacher.vai_tro)
  const tietChuan = computeEffectiveTietChuan(assignmentOf(currentPeriod)?.tiet_chuan ?? 17, teacher.vai_tro)
  const soTietTuan = schedules.filter(
    (lesson) => lesson.teacher_id === teacher.id && (!currentPeriod || lesson.period_id === currentPeriod.id),
  ).length + phuCapCN
  const { start: weekStart, end: weekEnd } = weekBounds(target)
  const theTuan = substitutions.filter(
    (row) =>
      row.the_teacher_id === teacher.id &&
      (() => {
        const rowDate = new Date(`${toDateString(row.ngay)}T12:00:00`)
        return rowDate >= weekStart && rowDate <= weekEnd
      })(),
  ).length

  let carryover = 0
  if (currentPeriod) {
    const earlier = periods
      .filter((period) => period.tu_ngay < currentPeriod.tu_ngay)
      .sort((a, b) => a.tu_ngay.localeCompare(b.tu_ngay))
    for (const period of earlier) {
      const weeks = countWeeks(period.tu_ngay, period.den_ngay)
      const periodChuan = computeEffectiveTietChuan(assignmentOf(period)?.tiet_chuan ?? 17, teacher.vai_tro)
      const periodWeekly = schedules.filter(
        (lesson) => lesson.teacher_id === teacher.id && lesson.period_id === period.id,
      ).length + phuCapCN
      const periodThe = substitutions.filter(
        (row) => row.the_teacher_id === teacher.id && row.period_id === period.id,
      ).length
      carryover += (periodChuan - periodWeekly) * weeks - periodThe
    }
  }

  return {
    tiet_chuan: tietChuan,
    so_tiet_tuan: soTietTuan,
    phu_cap_cn: phuCapCN,
    the_tuan: theTuan,
    carryover,
    balance: tietChuan - soTietTuan + carryover,
  }
}

export function scoreCandidates(input) {
  const {
    nghi_teacher_id,
    ngay,
    thu,
    tiet,
    mon,
    hoc_ky,
    nam_hoc,
    period_id,
    allTeachers = [],
    schedules = [],
    substitutions = [],
    locks = [],
    assignments = [],
    periods = [],
  } = input
  const target = toDateString(ngay)
  const numericTiet = Number(tiet)
  const targetIsMorning = isMorningSession(numericTiet)

  const baseEligible = allTeachers
    .filter((teacher) => teacher.active !== false)
    .filter((teacher) => teacher.id !== nghi_teacher_id)
    .filter((teacher) => teacher.mon_day?.includes(mon))
    .filter(
      (teacher) =>
        !locks.some(
          (lock) =>
            lock.teacher_id === teacher.id &&
            lock.tu_ngay <= target &&
            target <= lock.den_ngay,
        ),
    )
    .filter(
      (teacher) =>
        !schedules.some(
          (lesson) =>
            lesson.teacher_id === teacher.id &&
            (!period_id || lesson.period_id === period_id) &&
            Number(lesson.thu) === Number(thu) &&
            Number(lesson.tiet) === numericTiet,
        ),
    )

  const withBalance = baseEligible.map((teacher) => {
    const balanceInfo = computeTeacherBalance({
      teacher,
      assignments,
      periods,
      schedules,
      substitutions,
      targetDate: target,
      periodId: period_id,
    })
    return { teacher, balanceInfo }
  })

  const deficitTeachers = withBalance.filter((entry) => entry.balanceInfo.balance > 0)
  const eligible = (deficitTeachers.length > 0 ? deficitTeachers : withBalance).map((entry) => entry.teacher)

  const candidates = eligible.map((teacher) => {
    const balanceInfo = computeTeacherBalance({
      teacher,
      assignments,
      periods,
      schedules,
      substitutions,
      targetDate: target,
      periodId: period_id,
    })
    const thuaGio = substitutions.filter(
      (row) =>
        row.the_teacher_id === teacher.id &&
        Number(row.hoc_ky) === Number(hoc_ky) &&
        (!nam_hoc || row.nam_hoc === nam_hoc),
    ).length
    const theTrongNgay = substitutions.filter(
      (row) => row.the_teacher_id === teacher.id && toDateString(row.ngay) === target,
    ).length
    const theTrongNgaySession = substitutions.filter(
      (row) =>
        row.the_teacher_id === teacher.id &&
        toDateString(row.ngay) === target &&
        isMorningSession(row.tiet) === targetIsMorning,
    ).length
    const dayLessons = schedules
      .filter(
        (lesson) =>
          lesson.teacher_id === teacher.id &&
          (!period_id || lesson.period_id === period_id) &&
          Number(lesson.thu) === Number(thu),
      )
      .filter((lesson) => !isChaoCoPeriod(lesson))
    const dayLessonCount = dayLessons.length
    const sessionLessonCount = dayLessons.filter(
      (lesson) => isMorningSession(lesson.tiet) === targetIsMorning,
    ).length
    const canTheThem = theTrongNgay < MAX_THE_PER_DAY
    const totalThemDuoc = dayLessonCount + theTrongNgay < MAX_TOTAL_PER_DAY
    const sessionThemDuoc = sessionLessonCount + theTrongNgaySession < MAX_PERIODS_PER_SESSION
    const viPham = []
    if (theTrongNgay >= MAX_THE_PER_DAY) {
      viPham.push(`Đã thế quá ${MAX_THE_PER_DAY} tiết/ngày (hiện ${theTrongNgay})`)
    }
    if (!totalThemDuoc) {
      viPham.push(`Vượt giới hạn ${MAX_TOTAL_PER_DAY} tiết dạy + thế/ngày`)
    }
    if (!sessionThemDuoc) {
      viPham.push(`Vượt giới hạn ${MAX_PERIODS_PER_SESSION} tiết/buổi`)
    }
    if (balanceInfo.the_tuan >= MAX_THE_PER_WEEK) {
      viPham.push(`Đã thế ${balanceInfo.the_tuan}/${MAX_THE_PER_WEEK} tiết tuần`)
    }
    if (balanceInfo.balance < 0) {
      viPham.push('Thừa tiết chuẩn')
    }
    const schedule = scheduleScore(dayLessons, numericTiet)
    return {
      teacher,
      teacher_id: teacher.id,
      thua_gio_hk: thuaGio,
      the_trong_ngay: theTrongNgay,
      the_trong_ngay_session: theTrongNgaySession,
      violations: viPham,
      has_violation: viPham.length > 0,
      luat_han_che: { canTheThem, totalThemDuoc, sessionThemDuoc },
      ...balanceInfo,
      lien_ke: schedule.score === 1,
      tiet_ngay_do: dayLessons.map((lesson) => lesson.tiet).sort((a, b) => a - b),
      dayTKB: compactDayTKB(dayLessons),
      schedule,
      score_C: 1 / (balanceInfo.the_tuan + 1),
      scheduleDistance: schedule.distance,
    }
  })

  const balances = candidates.map((candidate) => candidate.balance)
  const minBalance = Math.min(...balances)
  const range = Math.max(...balances) - minBalance

  return candidates
    .map((candidate) => {
      const scoreA = range > 0 ? (candidate.balance - minBalance) / range : 0.5
      const finalScore = scoreA * 0.7 + candidate.schedule.score * 0.2 + candidate.score_C * 0.1
      const totalLabel = candidate.phu_cap_cn
        ? `TKB ${candidate.so_tiet_tuan - candidate.phu_cap_cn} + CN ${candidate.phu_cap_cn} = ${candidate.so_tiet_tuan} tiết/tuần`
        : `tiết/tuần ${candidate.so_tiet_tuan}`
      const balanceReason =
        candidate.balance > 0
          ? `thiếu ${candidate.balance} tiết chuẩn (chuẩn ${candidate.tiet_chuan}, ${totalLabel}, thế ${candidate.the_tuan} tuần này)`
          : candidate.balance < 0
            ? `thừa ${-candidate.balance} tiết chuẩn`
            : 'đủ tiết chuẩn'
      const carryReason = candidate.carryover
        ? candidate.carryover > 0
          ? `, còn thiếu ${candidate.carryover} từ đợt trước`
          : `, đã thừa ${-candidate.carryover} từ đợt trước`
        : ''
      const weekLimitReason = candidate.the_tuan > 0 ? `, đã thế ${candidate.the_tuan}/${MAX_THE_PER_WEEK} tiết tuần này` : ''
      const dayReason = candidate.the_trong_ngay > 0 ? `, đã thế ${candidate.the_trong_ngay} tiết hôm nay` : ''
      return {
        ...candidate,
        score_A: scoreA,
        score_B: candidate.schedule.score,
        finalScore,
        ly_do: `${balanceReason}${carryReason}${weekLimitReason}${dayReason}, ${candidate.schedule.label}`,
      }
    })
    .sort(compareOptimal)
}

export function compareOptimal(a, b) {
  if (a.balance !== b.balance) return b.balance - a.balance
  if (a.lien_ke !== b.lien_ke) return a.lien_ke ? -1 : 1
  const aGap = hasScheduleGap(a)
  const bGap = hasScheduleGap(b)
  if (aGap !== bGap) return aGap ? 1 : -1
  const aDay = (a.tiet_ngay_do || []).length
  const bDay = (b.tiet_ngay_do || []).length
  if (aDay !== bDay) return aDay - bDay
  if (a.scheduleDistance !== b.scheduleDistance) return a.scheduleDistance - b.scheduleDistance
  if (a.finalScore !== b.finalScore) return b.finalScore - a.finalScore
  return a.teacher.name.localeCompare(b.teacher.name, 'vi')
}

function hasScheduleGap(candidate) {
  const periods = (candidate.tiet_ngay_do || []).sort((a, b) => a - b)
  if (periods.length <= 1) return false
  for (let i = 1; i < periods.length; i += 1) {
    const prev = periods[i - 1]
    const curr = periods[i]
    const prevMorning = isMorningSession(prev)
    const currMorning = isMorningSession(curr)
    if (prevMorning !== currMorning) continue
    if (curr - prev > 1) return true
  }
  return false
}

export function getBalanceWarning(candidates = []) {
  if (!candidates.length) return { level: 'none', difference: 0, message: '' }
  const values = candidates.map((candidate) => Number(candidate.balance ?? candidate.thua_gio_hk ?? candidate.tiet_the ?? 0))
  const difference = Math.max(...values) - Math.min(...values)
  if (difference > 10) {
    return {
      level: 'danger',
      difference,
      message: `Chênh lệch ${difference} tiết chuẩn. Hãy ưu tiên giáo viên đang thiếu tiết chuẩn nhất.`,
    }
  }
  if (difference > 5) {
    return {
      level: 'warning',
      difference,
      message: `Chênh lệch ${difference} tiết chuẩn. Cần theo dõi để giữ cân bằng tiết chuẩn trong tổ.`,
    }
  }
  return { level: 'none', difference, message: '' }
}
