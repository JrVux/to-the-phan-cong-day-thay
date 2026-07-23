const variants = {
  primary: 'bg-primary text-white hover:bg-blue-800 focus-visible:ring-primary',
  secondary: 'bg-blue-50 text-primary hover:bg-blue-100 focus-visible:ring-primary',
  success: 'bg-success text-white hover:bg-green-700 focus-visible:ring-success',
  danger: 'bg-red-50 text-danger hover:bg-red-100 focus-visible:ring-danger',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400',
}

export default function Button({
  children,
  className = '',
  variant = 'primary',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
