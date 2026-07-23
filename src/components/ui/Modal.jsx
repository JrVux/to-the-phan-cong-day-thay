import { X } from 'lucide-react'
import Button from './Button'

export default function Modal({ open, title, children, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4" role="presentation">
      <section
        aria-modal="true"
        aria-labelledby="modal-title"
        role="dialog"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="modal-title" className="text-xl font-bold text-ink">{title}</h2>
          <Button variant="ghost" className="h-10 min-h-10 w-10 px-0" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </Button>
        </div>
        {children}
      </section>
    </div>
  )
}
