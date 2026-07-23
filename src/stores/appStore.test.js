import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from './appStore'

describe('appStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useAppStore.getState().reset()
  })

  it('tải snapshot dữ liệu và lưu một phân công', () => {
    useAppStore.getState().loadData()
    expect(useAppStore.getState().teachers).toHaveLength(24)

    useAppStore.getState().saveSubstitutions([
      {
        period_id: 'hk2_2025_2026',
        nghi_teacher_id: 'gv_09',
        the_teacher_id: 'gv_01',
        ngay: '2026-01-19',
        thu: 2,
        tiet: 2,
        lop: '12D3',
        mon: 'Tin học',
        hoc_ky: 2,
        nam_hoc: '2025-2026',
      },
    ])

    expect(useAppStore.getState().substitutions.some((row) => row.ngay === '2026-01-19')).toBe(true)
  })
})
