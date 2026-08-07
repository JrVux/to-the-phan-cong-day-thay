const variants = {
  primary: 'bg-gold/15 text-ink',
  success: 'bg-emerald-100/80 text-emerald-700',
  warning: 'bg-amber-100/80 text-amber-800',
  danger: 'bg-red-100/80 text-red-700',
  neutral: 'bg-slate-100 text-slate-600',
}

export default function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}