export const MAX_KIEM_NHIEM = 2
export const PHU_CAP_CHU_NHIEM = 4

export const KIEM_NHIEM_ROLES = [
  { id: 'chu_nhiem', label: 'Chủ nhiệm', type: 'cong', value: PHU_CAP_CHU_NHIEM },
  { id: 'pho_btd', label: 'Phó BTĐ', type: 'dinh', value: 8.5 },
  { id: 'bi_thu_doan', label: 'Bí thư Đoàn', type: 'dinh', value: 2.5 },
  { id: 'to_truong', label: 'Tổ Trưởng', type: 'giam', value: 3 },
  { id: 'to_pho', label: 'Tổ phó', type: 'giam', value: 1 },
  { id: 'ttnd', label: 'TTND', type: 'giam', value: 2 },
  { id: 'ttcd', label: 'TTCĐ', type: 'giam', value: 3 },
  { id: 'tpcd', label: 'TPCĐ', type: 'giam', value: 1 },
  { id: 'ktpmtin', label: 'KTPMTin', type: 'giam', value: 2 },
]

export function getRole(id) {
  return KIEM_NHIEM_ROLES.find((role) => role.id === id)
}

export function getRoleLabel(id) {
  return getRole(id)?.label || id
}

export function getRoles(ids) {
  return KIEM_NHIEM_ROLES.filter((role) => ids?.includes(role.id))
}

export function computePhuCapChuNhiem(vaiTro = []) {
  return vaiTro.includes('chu_nhiem') ? PHU_CAP_CHU_NHIEM : 0
}

export function computeEffectiveTietChuan(baseTietChuan, vaiTro = []) {
  let chuan = Number(baseTietChuan) || 0
  for (const roleId of vaiTro) {
    const role = getRole(roleId)
    if (!role) continue
    if (role.type === 'dinh') chuan = role.value
    if (role.type === 'giam') chuan -= role.value
  }
  return Math.max(0, chuan)
}
