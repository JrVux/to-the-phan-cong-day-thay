export default function Card({ children, className = '', as: Tag = 'section' }) {
  return (
    <Tag className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {children}
    </Tag>
  )
}
