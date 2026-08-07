import { describe, expect, it, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  client: { from: () => null },
}))

vi.mock('./supabaseClient', () => ({
  supabaseClient: mocks.client,
  hasSupabase: true,
}))

const {
  createInviteCode,
  deleteInviteCode,
  listInviteCodes,
  updateProfileRole,
} = await import('./authService')

describe('authService', () => {
  beforeEach(() => {
    mocks.from = vi.fn()
    mocks.client.from = mocks.from
  })

  it('createInviteCode chuẩn hoá mã thành chữ in hoa và trim', async () => {
    const result = { id: '1', code: 'TD-TOTIN-2026', max_uses: 1 }
    mocks.from.mockReturnValueOnce({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: result, error: null }),
        })),
      })),
    })
    const created = await createInviteCode({ code: '  td-totin-2026  ', maxUses: 1 })
    expect(created.code).toBe('TD-TOTIN-2026')
    expect(mocks.from).toHaveBeenCalledWith('invite_codes')
  })

  it('createInviteCode báo lỗi khi mã trống', async () => {
    await expect(createInviteCode({ code: '   ', maxUses: 1 })).rejects.toThrow('Mã mời không được để trống')
  })

  it('listInviteCodes trả về danh sách có order', async () => {
    const chain = {
      select: vi.fn(() => chain),
      order: vi.fn().mockResolvedValue({ data: [{ id: '1', code: 'ABC' }], error: null }),
    }
    mocks.from.mockReturnValueOnce(chain)
    const codes = await listInviteCodes()
    expect(codes).toEqual([{ id: '1', code: 'ABC' }])
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('updateProfileRole gọi update đúng bảng', async () => {
    const chain = {
      update: vi.fn(() => chain),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mocks.from.mockReturnValueOnce(chain)
    await updateProfileRole('uid', 'admin')
    expect(chain.update).toHaveBeenCalledWith({ role: 'admin' })
    expect(chain.eq).toHaveBeenCalledWith('id', 'uid')
  })

  it('deleteInviteCode gọi delete', async () => {
    const chain = {
      delete: vi.fn(() => chain),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mocks.from.mockReturnValueOnce(chain)
    await deleteInviteCode('cid')
    expect(chain.eq).toHaveBeenCalledWith('id', 'cid')
  })
})
