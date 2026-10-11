import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'
import { LecturerDashboardPage } from '@/feature/lecturer/dashboard/pages/LecturerDashboardPage'

describe('LecturerDashboardPage', () => {
  it('renders lecturer dashboard heading and stats correctly', () => {
    render(
      <MemoryRouter>
        <LecturerDashboardPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Bảng điều khiển Giảng viên/i)).toBeInTheDocument()
    expect(screen.getByText(/Sinh viên đang hướng dẫn/i)).toBeInTheDocument()
    expect(screen.getByText(/Đề cương chờ duyệt/i)).toBeInTheDocument()
  })
})
