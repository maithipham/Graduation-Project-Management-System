import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'
import { Feature2Page } from '@/features/student/feature_2'

describe('Feature2Page', () => {
  it('renders sample feature 2 placeholder correctly', () => {
    render(
      <MemoryRouter>
        <Feature2Page />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Tính năng mẫu 2 \(Feature 2\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Cổng Thông Tin Sinh Viên/i)).toBeInTheDocument()
  })
})
