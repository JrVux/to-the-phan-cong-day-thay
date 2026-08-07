import { useEffect } from 'react'
import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import { CalendarPlus, History as HistoryIcon, Home as HomeIcon, Settings } from 'lucide-react'
import Toast from './components/ui/Toast'
import ConnectionStatus from './components/ConnectionStatus'
import Home from './pages/Home'
import History from './pages/History'
import NewSubstitution from './pages/NewSubstitution'
import SetupIndex from './pages/Setup/SetupIndex'
import { useAppStore } from './stores/appStore'
import logoUrl from './assets/logo-to-tin-the-duc-gdqp.png'

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
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <NavLink to="/" className="flex items-center gap-3">
            <img
              src={logoUrl}
              alt="Logo Tổ Tin - Thể dục - GDQP"
              className="h-11 w-11 rounded-2xl object-cover shadow-soft ring-1 ring-slate-900/5"
            />
            <div>
              <h1 className="max-w-48 text-[15px] font-extrabold leading-tight tracking-tight text-ink sm:max-w-none sm:text-base">
                Tổ Tin - Thể dục - GDQP
              </h1>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Phân công dạy thay</p>
            </div>
          </NavLink>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Điều hướng chính">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
className={({ isActive }) =>
                  `flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition ${isActive ? 'bg-gold/15 text-ink' : 'text-slate-500 hover:bg-slate-100'}`
                }
              >
                <Icon size={17} strokeWidth={2.2} /> {label}
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
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/90 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden" aria-label="Điều hướng di động">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition ${isActive ? 'text-ink' : 'text-slate-400'}`
              }
            >
              <Icon size={21} strokeWidth={2} /> {label}
            </NavLink>
          ))}
        </div>
      </nav>
      <footer className="mx-auto max-w-6xl px-4 pb-24 pt-2 text-left md:pb-4">
        <p className="text-[11px] font-semibold text-slate-400">Phòng CNTT - Trường THPT Cà Mau</p>
      </footer>
      <Toast toast={toast} onClose={clearToast} />
    </div>
  )
}

export default function App() {
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppShell />
    </HashRouter>
  )
}