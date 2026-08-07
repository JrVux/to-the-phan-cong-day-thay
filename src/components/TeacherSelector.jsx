export default function TeacherSelector({ teachers, value, onChange, label = 'Giáo viên vắng' }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-ink outline-none focus:border-primary focus:ring-2 focus:ring-gold/30"
      >
        <option value="">Chọn giáo viên</option>
        {teachers.filter((teacher) => teacher.active).map((teacher) => (
          <option key={teacher.id} value={teacher.id}>{teacher.name} — {teacher.mon_day.join(', ')}</option>
        ))}
      </select>
    </label>
  )
}
