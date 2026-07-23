import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import NewSubstitution from './NewSubstitution'
import { useAppStore } from '../stores/appStore'

describe('NewSubstitution flow', () => {
  beforeEach(() => {
    localStorage.clear()
    useAppStore.getState().reset()
    useAppStore.getState().loadData()
  })

  it('tìm nhiều tiết, chọn ứng viên và lưu phân công', () => {
    render(<NewSubstitution />)

    fireEvent.change(screen.getByLabelText('Giáo viên vắng'), { target: { value: 'gv_09' } })
    fireEvent.change(screen.getByLabelText('Ngày nghỉ'), { target: { value: '2026-01-19' } })
    fireEvent.click(screen.getByRole('button', { name: /Tìm tiết cần thế/i }))

    expect(screen.getByText(/Tìm thấy 2 tiết cần bố trí/i)).toBeInTheDocument()
    const lessonCards = screen.getAllByTestId('lesson-candidate')
    lessonCards.forEach((card) => {
      fireEvent.click(within(card).getAllByRole('button', { name: /Chọn /i })[0])
    })
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục xác nhận/i }))
    fireEvent.click(screen.getByRole('button', { name: /Lưu phân công/i }))

    expect(screen.getByText(/Đã lưu 2 tiết phân công/i)).toBeInTheDocument()
  })

  it('hiển thị hướng dẫn xử lý thủ công khi không có ứng viên', () => {
    const state = useAppStore.getState()
    state.schedules
      .filter((lesson) => lesson.period_id === 'hk2_2025_2026' && lesson.thu === 2)
      .forEach(() => {})

    render(<NewSubstitution />)
    expect(screen.getByText(/Chọn giáo viên và ngày nghỉ/i)).toBeInTheDocument()
  })
})
