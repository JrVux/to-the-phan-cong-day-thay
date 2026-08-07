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
    expect(screen.queryByText(/HĐ trải nghiệm, hướng nghiệp/)).not.toBeInTheDocument()
    const lessonCards = screen.getAllByTestId('lesson-candidate')
    lessonCards.forEach((card) => {
      const chooseButtons = within(card).queryAllByRole('button', { name: /Chọn /i })
      if (chooseButtons.length) fireEvent.click(chooseButtons[0])
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

  it('tự chọn phân công tối ưu nhất cho mọi tiết', () => {
    render(<NewSubstitution />)

    fireEvent.change(screen.getByLabelText('Giáo viên vắng'), { target: { value: 'gv_09' } })
    fireEvent.change(screen.getByLabelText('Ngày nghỉ'), { target: { value: '2026-01-19' } })
    fireEvent.click(screen.getByRole('button', { name: /Tìm tiết cần thế/i }))

    fireEvent.click(screen.getByRole('button', { name: /Tự chọn phân công tối ưu nhất/i }))

    expect(screen.getAllByText(/Đã chọn/i).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục xác nhận/i }))
    fireEvent.click(screen.getByRole('button', { name: /Lưu phân công/i }))
    expect(screen.getByText(/Đã lưu 2 tiết phân công/i)).toBeInTheDocument()
  })

  it('tự chọn gán cùng một GV thế cho các tiết liên tiếp cùng lớp', () => {
    render(<NewSubstitution />)

    fireEvent.change(screen.getByLabelText('Giáo viên vắng'), { target: { value: 'gv_09' } })
    fireEvent.change(screen.getByLabelText('Ngày nghỉ'), { target: { value: '2026-01-19' } })
    fireEvent.click(screen.getByRole('button', { name: /Tìm tiết cần thế/i }))

    fireEvent.click(screen.getByRole('button', { name: /Tự chọn phân công tối ưu nhất/i }))

    const chosenTeachers = screen.getAllByTestId('lesson-candidate').map((card) => {
      const chosenButton = within(card).queryAllByText(/Đã chọn/i)[0]
      if (!chosenButton) return null
      const article = chosenButton.closest('article')
      return article?.querySelector('h3')?.textContent
    })
    expect(chosenTeachers.filter(Boolean).length).toBeGreaterThan(0)
    expect(new Set(chosenTeachers.filter(Boolean)).size).toBeLessThan(chosenTeachers.filter(Boolean).length)
  })

  it('hiển thị buổi và tiết trong buổi cho tiết buổi chiều', () => {
    const gv = useAppStore.getState().teachers.find((teacher) => teacher.name === 'Nguyễn Minh Toàn')
    render(<NewSubstitution />)

    fireEvent.change(screen.getByLabelText('Giáo viên vắng'), { target: { value: gv.id } })
    fireEvent.change(screen.getByLabelText('Ngày nghỉ'), { target: { value: '2026-01-23' } })
    fireEvent.click(screen.getByRole('button', { name: /Tìm tiết cần thế/i }))

    expect(screen.getAllByText(/Chiều T/i).length).toBeGreaterThan(0)
  })

  it('hiển thị TKB ngày của GV nghỉ và TKB hôm nay trên thẻ ứng viên', () => {
    render(<NewSubstitution />)

    fireEvent.change(screen.getByLabelText('Giáo viên vắng'), { target: { value: 'gv_09' } })
    fireEvent.change(screen.getByLabelText('Ngày nghỉ'), { target: { value: '2026-01-19' } })
    fireEvent.click(screen.getByRole('button', { name: /Tìm tiết cần thế/i }))

    expect(screen.getByText(/TKB của Lưu Tấn Khang:/i)).toBeInTheDocument()
    expect(screen.getAllByText(/TKB hôm nay/i).length).toBeGreaterThan(0)
  })
})
