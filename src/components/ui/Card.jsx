export default function Card({ children, className = '', as: Tag = 'section' }) {
  return (
    <Tag className={`rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card ${className}`}>
      {children}
    </Tag>
  )
}