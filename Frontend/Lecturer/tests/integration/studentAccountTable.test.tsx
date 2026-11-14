import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StudentAccountTable } from '@/features/admin/account_management/components/StudentAccountTable'
import type { StudentAccountItem } from '@/features/admin/account_management/types/account.types'
import { toSpringPage } from '@/shared/utils'

const students: StudentAccountItem[] = Array.from({ length: 10 }, (_, i) => ({
  publicId: `id-${i}`,
  studentCode: `22511${String(i).padStart(5, '0')}`,
  name: `Sinh viên ${i}`,
  email: `sv${i}@e.tlu.edu.vn`,
  className: '63KTPM1',
  batch: 'K63',
  // Dòng đầu chưa có bộ môn và bị khóa
  majorName: i === 0 ? null : 'Kỹ thuật phần mềm',
  accountStatus: i !== 0,
}))

function renderTable(content: StudentAccountItem[] = students) {
  const onRowClick = vi.fn()
  const onEdit = vi.fn()
  const onDelete = vi.fn()
  // Dạng PagedModel BE trả về, đang ở trang 2 (number = 1)
  const data = toSpringPage({
    content,
    page: { number: 1, size: 10, totalElements: 25, totalPages: 3 },
  })
  render(
    <StudentAccountTable
      data={data}
      isPending={false}
      isError={false}
      isPlaceholderData={false}
      onRowClick={onRowClick}
      onEdit={onEdit}
      onDelete={onDelete}
    />,
  )
  return { onRowClick, onEdit, onDelete }
}

describe('StudentAccountTable (Admin — tài khoản sinh viên)', () => {
  it('STT nối tiếp theo trang (trang 2 bắt đầu từ 11)', () => {
    renderTable()
    const rows = screen.getAllByRole('row', { name: /Xem chi tiết sinh viên/ })
    expect(within(rows[0]).getAllByRole('cell')[0]).toHaveTextContent('11')
    expect(within(rows[9]).getAllByRole('cell')[0]).toHaveTextContent('20')
  })

  it('hiện email dưới tên, bộ môn trống là "—", lớp / khóa và trạng thái', () => {
    renderTable()
    const row = screen.getByRole('row', { name: 'Xem chi tiết sinh viên Sinh viên 0' })
    expect(within(row).getByText('sv0@e.tlu.edu.vn')).toBeInTheDocument()
    expect(within(row).getByText('—')).toBeInTheDocument()
    expect(within(row).getByText('63KTPM1 / K63')).toBeInTheDocument()
    expect(within(row).getByText('Không hoạt động')).toBeInTheDocument()
  })

  it('bấm dòng mở chi tiết; bấm thùng rác chỉ gọi onDelete', async () => {
    const user = userEvent.setup()
    const { onRowClick, onDelete } = renderTable()
    const row = screen.getByRole('row', { name: 'Xem chi tiết sinh viên Sinh viên 1' })

    await user.click(within(row).getByRole('button', { name: 'Xóa sinh viên' }))
    expect(onDelete).toHaveBeenCalledWith(students[1])
    expect(onRowClick).not.toHaveBeenCalled()

    await user.click(within(row).getByText('Sinh viên 1'))
    expect(onRowClick).toHaveBeenCalledWith(students[1])
  })

  it('bấm bút chì chỉ gọi onEdit, không mở chi tiết', async () => {
    const user = userEvent.setup()
    const { onRowClick, onEdit } = renderTable()
    const row = screen.getByRole('row', { name: 'Xem chi tiết sinh viên Sinh viên 2' })

    await user.click(within(row).getByRole('button', { name: 'Sửa sinh viên' }))
    expect(onEdit).toHaveBeenCalledWith(students[2])
    expect(onRowClick).not.toHaveBeenCalled()
  })

  it('không có dữ liệu → hiện thông báo trống', () => {
    renderTable([])
    expect(
      screen.getByText('Không tìm thấy tài khoản phù hợp với điều kiện tìm kiếm.'),
    ).toBeInTheDocument()
  })
})
