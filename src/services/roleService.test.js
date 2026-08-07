import { describe, expect, it } from 'vitest'
import {
  KIEM_NHIEM_ROLES,
  MAX_KIEM_NHIEM,
  computeEffectiveTietChuan,
  computePhuCapChuNhiem,
  getRoles,
} from './roleService'

describe('roleService (kiêm nhiệm)', () => {
  it('định nghĩa đúng 9 vai trò và giới hạn 2 kiêm nhiệm', () => {
    expect(KIEM_NHIEM_ROLES).toHaveLength(9)
    expect(MAX_KIEM_NHIEM).toBe(2)
    const labels = KIEM_NHIEM_ROLES.map((role) => role.label)
    expect(labels).toContain('Chủ nhiệm')
    expect(labels).toContain('Phó BTĐ')
    expect(labels).toContain('Bí thư Đoàn')
    expect(labels).toContain('Tổ Trưởng')
    expect(labels).toContain('Tổ phó')
    expect(labels).toContain('TTND')
    expect(labels).toContain('TTCĐ')
    expect(labels).toContain('TPCĐ')
    expect(labels).toContain('KTPMTin')
  })

  it('chủ nhiệm cộng 4 tiết phụ cấp', () => {
    expect(computePhuCapChuNhiem([])).toBe(0)
    expect(computePhuCapChuNhiem(['chu_nhiem'])).toBe(4)
    expect(computePhuCapChuNhiem(['to_truong'])).toBe(0)
  })

  it('tính tiết chuẩn hiệu lực theo vai trò', () => {
    expect(computeEffectiveTietChuan(17, [])).toBe(17)
    expect(computeEffectiveTietChuan(17, ['chu_nhiem'])).toBe(17)
    expect(computeEffectiveTietChuan(17, ['to_truong'])).toBe(14)
    expect(computeEffectiveTietChuan(17, ['to_pho'])).toBe(16)
    expect(computeEffectiveTietChuan(17, ['ttnd'])).toBe(15)
    expect(computeEffectiveTietChuan(17, ['ttcd'])).toBe(14)
    expect(computeEffectiveTietChuan(17, ['tpcd'])).toBe(16)
    expect(computeEffectiveTietChuan(17, ['ktpmtin'])).toBe(15)
    expect(computeEffectiveTietChuan(17, ['pho_btd'])).toBe(8.5)
    expect(computeEffectiveTietChuan(17, ['bi_thu_doan'])).toBe(2.5)
  })

  it('kết hợp 2 kiêm nhiệm: giảm cộng dồn, đặt tiết chuẩn ưu tiên', () => {
    expect(computeEffectiveTietChuan(17, ['chu_nhiem', 'to_truong'])).toBe(14)
    expect(computeEffectiveTietChuan(17, ['to_truong', 'to_pho'])).toBe(13)
    expect(computeEffectiveTietChuan(17, ['chu_nhiem', 'pho_btd'])).toBe(8.5)
    expect(computeEffectiveTietChuan(17, ['ttnd', 'ktpmtin'])).toBe(13)
  })

  it('không xuống dưới 0 và bỏ vai trò không hợp lệ', () => {
    expect(computeEffectiveTietChuan(2, ['to_truong'])).toBe(0)
    expect(computeEffectiveTietChuan(17, ['khong_co'])).toBe(17)
  })

  it('lấy đối tượng vai trò theo danh sách id', () => {
    const roles = getRoles(['chu_nhiem', 'to_truong'])
    expect(roles.map((role) => role.id)).toEqual(['chu_nhiem', 'to_truong'])
    expect(getRoles([])).toEqual([])
  })
})
