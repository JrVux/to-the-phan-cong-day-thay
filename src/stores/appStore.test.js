import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from './appStore'

describe('appStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useAppStore.getState().reset()
  })

  it('tải snapshot dữ liệu và lưu một phân công', () => {
    useAppStore.getState().loadData()
    expect(useAppStore.getState().teachers).toHaveLength(12)

    useAppStore.getState().saveSubstitutions([
      {
        period_id: 'dot_1',
        nghi_teacher_id: 'gv_01',
        the_teacher_id: 'gv_02',
        ngay: '2025-09-29',
        thu: 2,
        tiet: 1,
        lop: '10A1',
        mon: 'Toán',
        hoc_ky: 1,
        nam_hoc: '2025-2026',
      },
    ])

    expect(useAppStore.getState().substitutions.some((row) => row.ngay === '2025-09-29')).toBe(true)
  })
})
