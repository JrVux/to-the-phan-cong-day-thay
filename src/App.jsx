import { useEffect } from 'react'
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import { CalendarPlus, History as HistoryIcon, Home as HomeIcon, Settings } from 'lucide-react'
import Toast from './components/ui/Toast'
import ConnectionStatus from './components/ConnectionStatus'
import Home from './pages/Home'
import History from './pages/History'
import NewSubstitution from './pages/NewSubstitution'
import SetupIndex from './pages/Setup/SetupIndex'
import { useAppStore } from './stores/appStore'

const navItems = [
  { to: '/', label: 'Tổng quan', icon: HomeIcon, end: true },
  { to: '/phan-cong', label: 'Phân công', icon: CalendarPlus },
  { to: '/lich-su', label: 'Lịch sử', icon: HistoryIcon },
  { to: '/thiet-lap', label: 'Thiết lập', icon: Settings },
]

function AppShell() {
  const loadData = useAppStore((state) => state.loadData)
  const toast = useAppStore((state) => state.toast)
  const clearToast = useAppStore((state) => state.clearToast)
  useEffect(() => loadData(), [loadData])

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <NavLink to="/" className="flex items-center gap-3">
            <img
              src="/logo-to-tin-the-duc-gdqp.png"
              alt="Logo Tổ Tin - Thể dục - GDQP"
              className="h-12 w-12 rounded-full object-cover shadow-sm ring-2 ring-amber-400/70"
            />
            <div>
              <h1 className="max-w-48 text-sm font-black leading-tight text-ink sm:max-w-none sm:text-base">
                Tổ Tin - Thể dục - GDQP
              </h1>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Phân công dạy thay</p>
            </div>
          </NavLink>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Điều hướng chính">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${isActive ? 'bg-blue-50 text-primary' : 'text-slate-500 hover:bg-slate-100'}`}>
                <Icon size={17} /> {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <ConnectionStatus />
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 md:pb-10">
        <div className="mx-auto max-w-xl">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/phan-cong" element={<NewSubstitution />} />
            <Route path="/lich-su" element={<History />} />
            <Route path="/thiet-lap/*" element={<SetupIndex />} />
          </Routes>
        </div>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden" aria-label="Điều hướng di động">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-bold ${isActive ? 'text-primary' : 'text-slate-400'}`}>
              <Icon size={21} /> {label}
            </NavLink>
          ))}
        </div>
      </nav>
      <footer className="mx-auto max-w-6xl px-4 pb-24 pt-2 text-left md:pb-4">
        <p className="text-[11px] font-semibold text-slate-400">Phòng CNTT - Trường THPT Cà Mau By OPENCODE</p>
      </footer>
      <Toast toast={toast} onClose={clearToast} />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppShell />
    </BrowserRouter>
  )
}
