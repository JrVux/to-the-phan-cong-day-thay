function toDateString(value) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10)
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

function scheduleScore(lessons, tiet) {
  const lessonPeriods = lessons.map((lesson) => Number(lesson.tiet))
  const distance = lessonPeriods.length
    ? Math.min(...lessonPeriods.map((period) => Math.abs(period - tiet)))
    : Number.POSITIVE_INFINITY
  if (lessonPeriods.some((period) => Math.abs(period - tiet) === 1)) {
    return { score: 1, label: 'có tiết liền kề', distance }
  }
  const sameSession = lessonPeriods.some((period) => (period <= 5) === (tiet <= 5))
  if (sameSession) return { score: 0.66, label: 'có tiết cùng buổi', distance }
  if (lessonPeriods.length) return { score: 0.33, label: 'có tiết khác buổi', distance }
  return { score: 0.1, label: 'không có tiết trong ngày', distance }
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
  } = input
  const target = toDateString(ngay)
  const weekStart = startOfWeek(target)
  const weekEnd = endOfWeek(target)

  return allTeachers
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
            Number(lesson.tiet) === Number(tiet),
        ),
    )
    .map((teacher) => {
      const thuaGio = substitutions.filter(
        (row) =>
          row.the_teacher_id === teacher.id &&
          Number(row.hoc_ky) === Number(hoc_ky) &&
          (!nam_hoc || row.nam_hoc === nam_hoc),
      ).length
      const theTuan = substitutions.filter((row) => {
        if (row.the_teacher_id !== teacher.id) return false
        const rowDate = new Date(`${toDateString(row.ngay)}T12:00:00`)
        return rowDate >= weekStart && rowDate <= weekEnd
      }).length
      const dayLessons = schedules.filter(
        (lesson) =>
          lesson.teacher_id === teacher.id &&
          (!period_id || lesson.period_id === period_id) &&
          Number(lesson.thu) === Number(thu),
      )
      const schedule = scheduleScore(dayLessons, Number(tiet))
      const scoreA = 1 / (thuaGio + 1)
      const scoreC = 1 / (theTuan + 1)
      const finalScore = scoreA * 0.6 + schedule.score * 0.3 + scoreC * 0.1
      const balanceReason = thuaGio === 0 ? 'chưa có giờ dạy thế' : `${thuaGio} tiết thế trong học kỳ`
      return {
        teacher,
        teacher_id: teacher.id,
        thua_gio_hk: thuaGio,
        the_tuan: theTuan,
        lien_ke: schedule.score === 1,
        tiet_ngay_do: dayLessons.map((lesson) => lesson.tiet).sort((a, b) => a - b),
        score_A: scoreA,
        score_B: schedule.score,
        score_C: scoreC,
        scheduleDistance: schedule.distance,
        finalScore,
        ly_do: `${balanceReason}, ${schedule.label}`,
      }
    })
    .sort(
      (a, b) =>
        b.finalScore - a.finalScore ||
        a.thua_gio_hk - b.thua_gio_hk ||
        a.scheduleDistance - b.scheduleDistance ||
        a.teacher.name.localeCompare(b.teacher.name, 'vi'),
    )
}

export function getBalanceWarning(candidates = []) {
  if (!candidates.length) return { level: 'none', difference: 0, message: '' }
  const values = candidates.map((candidate) => Number(candidate.thua_gio_hk ?? candidate.tiet_the ?? 0))
  const difference = Math.max(...values) - Math.min(...values)
  if (difference > 10) {
    return {
      level: 'danger',
      difference,
      message: `Chênh lệch ${difference} tiết. Hãy ưu tiên giáo viên đang có ít giờ dạy thế nhất.`,
    }
  }
  if (difference > 5) {
    return {
      level: 'warning',
      difference,
      message: `Chênh lệch ${difference} tiết. Cần theo dõi để giữ cân bằng trong tổ.`,
    }
  }
  return { level: 'none', difference, message: '' }
}
