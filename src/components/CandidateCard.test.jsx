import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import CandidateCard from './CandidateCard'

describe('CandidateCard', () => {
  it('hiển thị đề xuất hạng 1 và gọi onSelect', () => {
    const onSelect = vi.fn()
    render(
      <CandidateCard
        rank={1}
        name="Trần Thị Bình"
        balance={3}
        lien_ke
        tiet_ngay_do={[2, 3]}
        finalScore={0.87}
        ly_do="Chưa cân bằng tiết chuẩn, có tiết liền kề"
        onSelect={onSelect}
      />,
    )

    expect(screen.getByText('Đề xuất')).toBeInTheDocument()
    expect(screen.getByText('Trần Thị Bình')).toBeInTheDocument()
    expect(screen.getByText(/Thiếu 3 tiết chuẩn/)).toBeInTheDocument()
    expect(screen.getByText(/Đang dạy tiết Sáng T2, Sáng T3/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Chọn Trần Thị Bình/i }))
    expect(onSelect).toHaveBeenCalledOnce()
  })

  it('hiển thị cảnh báo vi phạm giới hạn nhưng vẫn cho chọn', () => {
    const onSelect = vi.fn()
    render(
      <CandidateCard
        rank={2}
        name="Lê Văn Cường"
        balance={-2}
        tiet_ngay_do={[2, 3]}
        finalScore={0.4}
        ly_do="Thừa tiết chuẩn"
        violations={['Đã thế 4/3 tiết/ngày', 'Vượt giới hạn 4 tiết/buổi']}
        onSelect={onSelect}
      />,
    )

    expect(screen.getByText(/Vi phạm giới hạn/)).toBeInTheDocument()
    expect(screen.getByText(/Đã thế 4\/3 tiết\/ngày/)).toBeInTheDocument()
    expect(screen.getByText(/Vượt giới hạn 4 tiết\/buổi/)).toBeInTheDocument()
    expect(screen.queryByText('Đề xuất')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Chọn Lê Văn Cường/i }))
    expect(onSelect).toHaveBeenCalledOnce()
  })
})
