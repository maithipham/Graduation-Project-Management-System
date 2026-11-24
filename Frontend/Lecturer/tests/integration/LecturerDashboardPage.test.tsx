import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LecturerDashboardPage from '@/features/lecturer/dashboard/pages/LecturerDashboardPage'

describe('LecturerDashboardPage', () => {
  it('hiển thị tiêu đề và các lối tắt chức năng, không còn số liệu giả', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <LecturerDashboardPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText(/Bảng điều khiển Giảng viên/i)).toBeInTheDocument()
    expect(screen.getByText(/Đăng ký GVHD/i)).toBeInTheDocument()
    expect(screen.getByText(/Hội đồng chấm bảo vệ/i)).toBeInTheDocument()
    expect(screen.queryByText(/Sinh viên đang hướng dẫn/i)).not.toBeInTheDocument()
  })
})
