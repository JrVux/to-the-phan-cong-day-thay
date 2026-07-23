import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the Tổ Tin - Thể dục - GDQP brand and slogan', () => {
    render(App())

    expect(screen.getByRole('img', { name: /logo tổ tin - thể dục - gdqp/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tổ Tin - Thể dục - GDQP' })).toBeInTheDocument()
    const slogan = screen.getByRole('heading', { name: /Vững tri thức.*Khỏe thể chất.*Chắc bản lĩnh/i })
    expect(slogan).toBeInTheDocument()
    expect(slogan.closest('header')).toHaveClass('text-center')
    expect(screen.queryByText('TổThế')).not.toBeInTheDocument()
    expect(screen.getAllByText(/Phân công dạy thay/i).length).toBeGreaterThan(0)
  })
})
