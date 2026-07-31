import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../stores/appStore'
import SetupSchedule from './SetupSchedule'
import SetupTeachers from './SetupTeachers'

describe('giao diện dữ liệu chuyên môn đã nhập', () => {
  beforeEach(() => {
    localStorage.clear()
    useAppStore.getState().reset()
    useAppStore.getState().loadData()
  })

  it('hiển thị môn, lớp phân công và số lớp/tiết từ TKB', () => {
    render(<SetupTeachers />)

    expect(screen.getAllByText('Tin học').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Giáo dục thể chất').length).toBeGreaterThan(0)
    expect(screen.getAllByText('GDQP AN').length).toBeGreaterThan(0)
    expect(screen.getByLabelText('Môn của Nguyễn Trung Kiên')).toBeDisabled()
    expect(screen.getAllByRole('table').length).toBeGreaterThan(0)
  })

  it('tự chọn HK II khi máy còn lưu mã đợt cũ và hiển thị buổi chiều', () => {
    localStorage.setItem('tothe_preferred_period', 'dot_1')

    render(<SetupSchedule />)

    expect(screen.getByText('360 dòng')).toBeInTheDocument()
    expect(screen.getAllByText('Chiều').length).toBeGreaterThan(0)
  })
})
