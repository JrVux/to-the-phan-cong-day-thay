import { useEffect, useState } from 'react'
import { CloudOff, Wifi } from 'lucide-react'
import { databaseMode } from '../services/db'

export default function ConnectionStatus() {
  const [online, setOnline] = useState(() => navigator.onLine)
  const [syncError, setSyncError] = useState('')

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    const handleSyncError = (event) => setSyncError(event.detail)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('tothe:sync-error', handleSyncError)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('tothe:sync-error', handleSyncError)
    }
  }, [])

  if (online && !syncError) return null
  return (
    <div className={`fixed inset-x-0 top-16 z-30 flex items-center justify-center gap-2 px-4 py-2 text-center text-xs font-bold text-white ${online ? 'bg-warning' : 'bg-slate-800'}`}>
      {online ? <Wifi size={15} /> : <CloudOff size={15} />}
      {!online
        ? 'Đang ngoại tuyến — dữ liệu được lưu trên thiết bị.'
        : databaseMode === 'supabase'
          ? 'Đồng bộ cloud tạm gián đoạn — dữ liệu local vẫn an toàn.'
          : 'Đang dùng dữ liệu trên thiết bị.'}
    </div>
  )
}
