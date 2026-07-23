import { useState } from 'react'
import { CalendarRange, Clock3, LockKeyhole, UsersRound } from 'lucide-react'
import SetupLocks from './SetupLocks'
import SetupPeriod from './SetupPeriod'
import SetupSchedule from './SetupSchedule'
import SetupTeachers from './SetupTeachers'

const tabs = [
  { id: 'teachers', label: 'Giáo viên', icon: UsersRound, component: SetupTeachers },
  { id: 'periods', label: 'Đợt TKB', icon: CalendarRange, component: SetupPeriod },
  { id: 'schedule', label: 'Thời khóa biểu', icon: Clock3, component: SetupSchedule },
  { id: 'locks', label: 'Ngoại lệ', icon: LockKeyhole, component: SetupLocks },
]

export default function SetupIndex() {
  const [activeTab, setActiveTab] = useState('teachers')
  const ActiveComponent = tabs.find((tab) => tab.id === activeTab).component
  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Quản trị dữ liệu</p>
        <h1 className="mt-1 text-2xl font-black text-ink">Thiết lập hệ thống</h1>
      </header>
      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-slate-200/70 p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-bold transition ${activeTab === id ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
          >
            <Icon size={18} /> {label}
          </button>
        ))}
      </div>
      <ActiveComponent />
    </div>
  )
}
