import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Copy, Gift, Plus, Trash2, UserCog, UsersRound, XCircle } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import {
  createInviteCode,
  deleteInviteCode,
  listInviteCodes,
  listProfiles,
  toggleInviteCode,
  updateProfileRole,
} from '../../services/authService'
import { useAppStore } from '../../stores/appStore'

export default function SetupAdmin() {
  const store = useAppStore()
  const [codes, setCodes] = useState([])
  const [profiles, setProfiles] = useState([])
  const [codeInput, setCodeInput] = useState('')
  const [maxUses, setMaxUses] = useState(1)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  const load = async () => {
    try {
      setCodes(await listInviteCodes())
      setProfiles(await listProfiles())
    } catch (loadError) {
      setError(loadError.message)
    }
  }
  useEffect(() => { load() }, [])
  const liveCodes = useMemo(() => codes.filter((code) => code && code.code), [codes])

  async function addCode(event) {
    event.preventDefault()
    setError('')
    try {
      const created = await createInviteCode({ code: codeInput, maxUses })
      await load()
      setCodeInput('')
      setMaxUses(1)
      store.notify(`Đã tạo mã mời ${created.code}.`)
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  async function copyCode(code) {
    try {
      await navigator.clipboard.writeText(`Đăng ký Phân công dạy thay tại https://jrvux.github.io/to-the-phan-cong-day-thay/ — mã mời của bạn: ${code}`)
      setCopied(code)
      setTimeout(() => setCopied(''), 1500)
    } catch { /* clipboard không khả dụng */ }
  }

  async function toggle(code) {
    await toggleInviteCode(code.id, !code.active)
    await load()
  }

  async function remove(code) {
    if (!window.confirm(`Xóa mã mời ${code.code}?`)) return
    await deleteInviteCode(code.id)
    await load()
  }

  async function setRole(userId, role) {
    await updateProfileRole(userId, role)
    store.notify('Đã cập nhật quyền.')
    await load()
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Quản trị hệ thống</p>
        <h1 className="mt-1 text-2xl font-black text-ink">Quản trị viên</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Tạo mã mời để chia sẻ cho thành viên tổ và quản lý quyền người dùng.</p>
      </header>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-danger">{error}</p>}

      <Card className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-black text-ink"><Gift size={18} className="text-primary" /> Tạo mã mời</div>
        <p className="text-xs leading-6 text-slate-500">Người đăng ký bằng mã này sẽ được vào dùng dữ liệu chung của tổ. Mỗi mã có giới hạn số lần dùng.</p>
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-danger">{error}</p>}
        <form onSubmit={addCode} className="space-y-3">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input value={codeInput} onChange={(event) => setCodeInput(event.target.value)} placeholder="VD: TD-TOTIN-2026" required className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm uppercase" />
            <input type="number" min={1} value={maxUses} onChange={(event) => setMaxUses(Number(event.target.value))} aria-label="Số lần dùng" className="min-h-11 w-20 rounded-xl border border-slate-300 px-3 text-sm" />
          </div>
          <Button type="submit" className="w-full"><Plus size={18} /> Tạo mã mời</Button>
        </form>

        <div className="space-y-2">
          {liveCodes.map((code) => (
            <div key={code.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3">
              <div>
                <p className="font-bold text-ink">{code.code}</p>
                <p className="mt-1 text-xs text-slate-500">{code.used_uses}/{code.max_uses} lượt dùng {code.active ? <Badge variant="success">Đang kích hoạt</Badge> : <Badge variant="neutral">Đã khóa</Badge>}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="primary" className="min-h-9 px-3 py-1.5" onClick={() => copyCode(code.code)}><Copy size={15} /> {copied === code.code ? 'Đã sao' : 'Sao chép'}</Button>
                <Button variant="secondary" className="min-h-9 px-3 py-1.5" onClick={() => toggle(code, false)} aria-label="Khóa"><XCircle size={16} /></Button>
                <Button variant="danger" className="min-h-9 px-3 py-1.5" onClick={() => remove(code)} aria-label="Xóa"><Trash2 size={15} /></Button>
              </div>
            </div>
          ))}
          {!liveCodes.length && <p className="text-sm font-semibold text-slate-400">Chưa có mã mời nào.</p>}
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-black text-ink"><UsersRound size={18} className="text-primary" /> Người dùng</div>
        {profiles.map((profile) => (
          <div key={profile.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3">
            <div>
              <p className="font-bold text-ink">{profile.email} {profile.id === store.user?.id && <span className="text-xs text-slate-400">(bạn)</span>}</p>
              <div className="mt-1"><Badge variant={profile.role === 'admin' ? 'danger' : 'neutral'}>{profile.role === 'admin' ? 'Quản trị' : 'Người dùng'}</Badge></div>
            </div>
            {profile.id !== store.user?.id && (
              <Button variant="secondary" className="min-h-9 px-3 py-1.5" onClick={() => setRole(profile.id, profile.role === 'admin' ? 'user' : 'admin')}>
                <UserCog size={15} /> {profile.role === 'admin' ? 'Hạ xuống người dùng' : 'Nâng lên quản trị'}
              </Button>
            )}
          </div>
        ))}
        {!profiles.length && <p className="text-sm font-semibold text-slate-400">Chưa có người dùng nào.</p>}
      </Card>
    </div>
  )
}