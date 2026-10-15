import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import StudentOverviewPage from '@/features/student/overview/pages/StudentOverviewPage'

describe('StudentOverviewPage', () => {
  it('hiển thị tiêu đề trang Tổng quan', () => {
    render(<StudentOverviewPage />)

    expect(screen.getByRole('heading', { name: 'Tổng quan' })).toBeInTheDocument()
  })
})
