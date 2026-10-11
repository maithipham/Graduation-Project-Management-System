import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'
import { StudentOverviewPage } from '@/feature/student/overview'

describe('StudentOverviewPage', () => {
  it('renders student greeting and progress bar correctly', () => {
    render(
      <MemoryRouter>
        <StudentOverviewPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Chào An, đồ án của bạn đang tiến triển tốt/i)).toBeInTheDocument()
    expect(screen.getByText(/Tiến độ đồ án/i)).toBeInTheDocument()
    expect(screen.getByText(/Giai đoạn 3 \/ 6/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Nộp đề cương/i).length).toBeGreaterThan(0)
  })
})
