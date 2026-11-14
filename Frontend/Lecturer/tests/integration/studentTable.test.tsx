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
  batch: 'K63',
  // Dòng đầu chưa có đề tài / GVHD, các dòng sau đã có
  topicName: i === 0 ? undefined : `Đề tài ${i}`,
  lecturerName: i === 0 ? undefined : 'ThS. Nguyễn Văn A',
  status: i === 0 ? 'STAGE_1_REGISTERING_ADVISOR' : 'STAGE_2_TOPIC_CONFIRMED',
  statusLabel: i === 0 ? 'Đang đăng ký GVHD' : 'Đã chốt tên đề tài',
  accountStatus: true,
}))

function renderTable(
  onPageChange = vi.fn(),
  onPageSizeChange = vi.fn(),
  onDelete?: (student: StudentListItem) => void,
) {
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
      pageSizeOptions={[15, 25, 50]}
      sort={undefined}
      onSortChange={() => {}}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onRowClick={() => {}}
      emptyMessage="Không tìm thấy thông tin sinh viên trong học kì này"
      onDelete={onDelete}
    />,
  )
  return { onPageChange, onPageSizeChange }
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
    const { onPageChange } = renderTable()

    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page')

    await user.click(screen.getByRole('button', { name: 'Trang sau' }))
    await user.click(screen.getByRole('button', { name: 'Trang trước' }))
    await user.click(screen.getByRole('button', { name: '3' }))

    expect(onPageChange.mock.calls).toEqual([[2], [0], [2]])
  })

  it('đổi số dòng mỗi trang gọi onPageSizeChange', async () => {
    const user = userEvent.setup()
    const { onPageSizeChange } = renderTable()

    await user.selectOptions(screen.getByRole('combobox', { name: 'Số dòng mỗi trang' }), '50')

    expect(onPageSizeChange).toHaveBeenCalledWith(50)
  })
})

describe('StudentTable — nội dung dòng', () => {
  it('hiện statusLabel của BE và chữ thay thế khi chưa có đề tài / GVHD', () => {
    renderTable()
    const [first, second] = screen.getAllByRole('row', { name: /Xem chi tiết sinh viên/ })

    expect(within(first).getByText('(chưa đăng ký)')).toBeInTheDocument()
    expect(within(first).getByText('Chưa gán')).toBeInTheDocument()
    expect(within(first).getByText('Đang đăng ký GVHD')).toBeInTheDocument()

    expect(within(second).getByText('Đề tài 1')).toBeInTheDocument()
    expect(within(second).getByText('ThS. Nguyễn Văn A')).toBeInTheDocument()
    expect(within(second).getByText('Đã chốt tên đề tài')).toBeInTheDocument()
  })
})

describe('StudentTable — nút Xóa', () => {
  it('chỉ hiện ở dòng chưa đăng ký GVHD / đề tài, bấm gọi onDelete mà không mở chi tiết', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    renderTable(vi.fn(), vi.fn(), onDelete)

    const deleteButtons = screen.getAllByRole('button', { name: /^Xóa / })
    expect(deleteButtons).toHaveLength(1)
    expect(deleteButtons[0]).toHaveAccessibleName('Xóa Sinh viên 0')

    await user.click(deleteButtons[0])
    expect(onDelete).toHaveBeenCalledWith(students[0])
  })

  it('không truyền onDelete (học kì đã kết thúc) → ẩn nút Xóa', () => {
    renderTable()
    expect(screen.queryByRole('button', { name: /^Xóa / })).not.toBeInTheDocument()
  })
})
