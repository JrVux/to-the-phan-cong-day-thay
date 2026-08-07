export default function DatePicker({ value, onChange, label = 'Ngày nghỉ' }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-ink outline-none focus:border-primary focus:ring-2 focus:ring-gold/30"
      />
    </label>
  )
}
