import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StudentTable } from '@/features/department/student_management/components/StudentTable'
import type { StudentListItem } from '@/features/department/student_management/types'
import { toSpringPage } from '@/shared/utils'

const students: StudentListItem[] = Array.from({ length: 15 }, (_, i) => ({
  publicId: `id-${i}`,
  studentCode: `22511${String(i).padStart(5, '0')}`,
  name: `Sinh viên ${i}`,
  majorName: 'Kỹ thuật phần mềm',
  className: '63KTPM1',
  status: true,
}))

function renderTable(onPageChange = vi.fn()) {
  // Dạng PagedModel mà BE Spring Data 3.3+ trả về, đã qua service
  const data = toSpringPage({
    content: students,
    page: { number: 1, size: 15, totalElements: 40, totalPages: 3 },
  })
  render(
    <StudentTable
      data={data}
      isPending={false}
      isError={false}
      isPlaceholderData={false}
      pageSize={15}
      sort={undefined}
      onSortChange={() => {}}
      onPageChange={onPageChange}
      onRowClick={() => {}}
      hasFilters={false}
      onCreate={() => {}}
    />,
  )
  return onPageChange
}

describe('StudentTable — STT và phân trang', () => {
  it('STT nối tiếp theo trang (trang 2 bắt đầu từ 16)', () => {
    renderTable()
    const rows = screen.getAllByRole('row', { name: /Xem chi tiết sinh viên/ })
    expect(within(rows[0]).getAllByRole('cell')[0]).toHaveTextContent('16')
    expect(within(rows[14]).getAllByRole('cell')[0]).toHaveTextContent('30')
    expect(screen.getByText('16–30')).toBeInTheDocument()
  })

  it('bấm trang trước / trang sau / số trang gọi đúng chỉ số trang (0-based)', async () => {
    const user = userEvent.setup()
    const onPageChange = renderTable()

    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page')

    await user.click(screen.getByRole('button', { name: 'Trang sau' }))
    await user.click(screen.getByRole('button', { name: 'Trang trước' }))
    await user.click(screen.getByRole('button', { name: '3' }))

    expect(onPageChange.mock.calls).toEqual([[2], [0], [2]])
  })
})
