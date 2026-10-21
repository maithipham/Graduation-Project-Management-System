import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TablePagination } from '@/shared/components/ui'
import { toSpringPage } from '@/shared/utils'

// Thanh phân trang dùng chung cho bảng Sinh viên và Giáo viên
function renderPagination(
  page: { number: number; totalElements: number; totalPages: number; count: number },
  disabled = false,
) {
  const onPageChange = vi.fn()
  const data = toSpringPage({
    content: Array.from({ length: page.count }, (_, i) => i),
    number: page.number,
    size: 10,
    totalElements: page.totalElements,
    totalPages: page.totalPages,
  })
  render(<TablePagination data={data} disabled={disabled} onPageChange={onPageChange} itemLabel="sinh viên" />)
  return onPageChange
}

describe('TablePagination', () => {
  it('chỉ 1 trang: hiện số đếm, không có nút chuyển trang', () => {
    renderPagination({ number: 0, totalElements: 7, totalPages: 1, count: 7 })

    expect(screen.getByText(/Hiển thị/)).toHaveTextContent('Hiển thị 1–7 / 7 sinh viên')
    expect(screen.queryByRole('navigation', { name: 'Phân trang' })).not.toBeInTheDocument()
  })

  it('trang cuối: đếm đúng khoảng, khóa "Trang sau", trang hiện tại có aria-current', () => {
    renderPagination({ number: 2, totalElements: 25, totalPages: 3, count: 5 })

    expect(screen.getByText(/Hiển thị/)).toHaveTextContent('Hiển thị 21–25 / 25 sinh viên')
    expect(screen.getByRole('button', { name: 'Trang sau' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Trang trước' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '3' })).toHaveAttribute('aria-current', 'page')
  })

  it('bấm số trang / trước / sau → báo chỉ số trang 0-based', async () => {
    const u = userEvent.setup()
    const onPageChange = renderPagination({ number: 1, totalElements: 25, totalPages: 3, count: 10 })

    await u.click(screen.getByRole('button', { name: '3' }))
    await u.click(screen.getByRole('button', { name: 'Trang trước' }))
    await u.click(screen.getByRole('button', { name: 'Trang sau' }))
    expect(onPageChange.mock.calls).toEqual([[2], [0], [2]])
  })

  it('đang chờ trang mới (disabled): khóa mọi nút', () => {
    renderPagination({ number: 1, totalElements: 25, totalPages: 3, count: 10 }, true)

    for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled()
  })
})
