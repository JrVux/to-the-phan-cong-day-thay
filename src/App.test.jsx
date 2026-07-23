import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the TổThế application shell', () => {
    render(App())

    expect(screen.getByRole('img', { name: /logo tổ tin - thể dục - gdqp/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /TổThế/i })).toBeInTheDocument()
    expect(screen.getByText(/Phân công dạy thay/i)).toBeInTheDocument()
  })
})
