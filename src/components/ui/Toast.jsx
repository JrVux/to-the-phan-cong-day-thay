import { CheckCircle2, CircleAlert, X } from 'lucide-react'

export default function Toast({ toast, onClose }) {
  if (!toast) return null
  const danger = toast.type === 'error'
  return (
    <div
      role="status"
      className={`fixed bottom-24 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-xl ${danger ? 'bg-danger' : 'bg-slate-900/95'}`}
    >
      {danger ? <CircleAlert size={20} /> : <CheckCircle2 size={20} />}
      <span className="flex-1">{toast.message}</span>
      <button onClick={onClose} aria-label="Đóng thông báo" className="rounded-full p-0.5 opacity-70 hover:opacity-100"><X size={18} /></button>
    </div>
  )
}