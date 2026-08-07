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
})
