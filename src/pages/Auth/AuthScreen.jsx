import { useState } from 'react'
import { AtSign, Gift, KeySquare, LogIn, ShieldPlus, Sparkles } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { useAppStore } from '../../stores/appStore'
import logoUrl from '../../assets/logo-to-tin-the-duc-gdqp.png'

export default function AuthScreen() {
  const store = useAppStore()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [invite, setInvite] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'login') {
        await store.login(email.trim(), password)
      } else {
        if (!invite.trim()) {
          throw new Error('Vui lòng nhập mã mời. Liên hệ admin (người quản lý) để được cấp mã.')
        }
        await store.register({ email: email.trim(), password, inviteCode: invite.trim() })
      }
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <img src={logoUrl} alt="Logo Tổ Tin - Thể dục - GDQP" className="mx-auto h-16 w-16 rounded-3xl object-cover shadow-soft ring-1 ring-slate-900/5" />
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.14em] text-primary">Tổ Tin - Thể dục - GDQP</p>
          <h1 className="mt-1 text-2xl font-black text-ink">Phân công dạy thay</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{mode === 'login' ? 'Đăng nhập để quản lý phân công.' : 'Tạo tài khoản với mã mời do admin cấp.'}</p>
        </div>

        <Card className="space-y-4">
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-danger">{error}</p>}
          <form onSubmit={submit} className="space-y-3">
            <label className="block"><span className="mb-1 block text-sm font-semibold">Email</span>
              <div className="relative">
                <AtSign size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required className="min-h-11 w-full rounded-xl border border-slate-300 pl-9 pr-3 text-sm" />
              </div>
            </label>
            <label className="block"><span className="mb-1 block text-sm font-semibold">Mật khẩu</span>
              <div className="relative">
                <KeySquare size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required minLength={6} className="min-h-11 w-full rounded-xl border border-slate-300 pl-9 pr-3 text-sm" />
              </div>
            </label>

            {mode === 'register' && (
              <label className="block"><span className="mb-1 block text-sm font-semibold">Mã mời (do admin cấp)</span>
                <div className="relative">
                  <Gift size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={invite} onChange={(event) => setInvite(event.target.value)} placeholder="Ví dụ: TD-TOTIN-2026" className="min-h-11 w-full rounded-xl border border-slate-300 pl-9 pr-3 text-sm uppercase" />
                </div>
                <span className="mt-1 block text-[11px] text-slate-400">Người đầu tiên đăng ký sẽ tự động thành Admin.</span>
              </label>
            )}

            <Button variant="secondary" className="w-full" type="submit" disabled={busy}>
              {mode === 'login' ? <><LogIn size={18} /> {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</> : <><ShieldPlus size={18} /> {busy ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}</>}
            </Button>
          </form>

          <div className="flex items-center justify-center gap-1 border-t border-slate-100 pt-3 text-sm">
            <Sparkles size={15} className="text-slate-400" />
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }} className="font-semibold text-primary hover:underline">
              {mode === 'login' ? 'Chưa có tài khoản? Đăng ký bằng mã mời' : 'Đã có tài khoản? Đăng nhập'}
            </button>
          </div>
        </Card>

        <p className="text-center text-xs leading-5 text-slate-400">Chỉ dùng cho tổ trưởng và thành viên tổ được admin mời. Dữ liệu đồng bộ giữa các thiết bị qua cloud.</p>
      </div>
    </div>
  )
}