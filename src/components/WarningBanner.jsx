import { AlertTriangle } from 'lucide-react'

export default function WarningBanner({ level = 'warning', children }) {
  if (!children) return null
  const style = level === 'danger'
    ? 'border-red-200 bg-red-50 text-red-800'
    : 'border-amber-200 bg-amber-50 text-amber-800'
  return (
    <div role="alert" className={`flex items-start gap-3 rounded-2xl border p-4 text-sm leading-6 ${style}`}>
      <AlertTriangle className="mt-0.5 shrink-0" size={20} />
      <div>{children}</div>
    </div>
  )
}
