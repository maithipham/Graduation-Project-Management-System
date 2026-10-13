import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'
import { Feature1Page } from '@/features/student/feature_1'

describe('Feature1Page', () => {
  it('renders sample feature placeholder correctly', () => {
    render(
      <MemoryRouter>
        <Feature1Page />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Tính năng mẫu \(Feature 1\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Cổng Thông Tin Sinh Viên/i)).toBeInTheDocument()
  })
})
