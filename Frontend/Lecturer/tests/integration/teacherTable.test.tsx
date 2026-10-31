import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TeacherTable } from '@/features/department/lecturer_management/components/TeacherTable'
import type { TeacherListItem } from '@/features/department/lecturer_management/types'
import { toSpringPage } from '@/shared/utils'

const teachers: TeacherListItem[] = [
  {
    id: 1,
    teacherId: 1,
    publicId: 'id-1',
    name: 'Trần Quốc Bảo',
    firstName: 'Trần Quốc',
    lastName: 'Bảo',
    academicTitle: 'PGS.TS.',
    email: 'bao.tq@tlu.edu.vn',
    majorName: 'Kỹ thuật phần mềm',
    organization: 'Trường Đại học Thủy lợi',
    isInternal: true,
    unitType: 'INTERNAL',
    isAssigned: false,
    assignmentStatus: 'Chưa phân công',
    phone: '0912345678',
    amount: 20,
    status: true,
  },
  {
    id: 2,
    teacherId: 2,
    publicId: 'id-2',
    name: 'Vũ Thị Lan',
    firstName: 'Vũ Thị',
    lastName: 'Lan',
    academicTitle: 'TS.',
    email: 'lan.vt@tlu.edu.vn',
    majorName: 'Kỹ thuật phần mềm',
    organization: 'Trường Đại học Thủy lợi',
    isInternal: true,
    unitType: 'INTERNAL',
    isAssigned: false,
    assignmentStatus: 'Chưa phân công',
    phone: null,
    amount: null,
    status: true,
  },
]

function renderTable(options: {
  rows?: TeacherListItem[]
  selectedIds?: Set<number>
  onToggleSelect?: (id: number) => void
  onSelectAll?: (selected: boolean) => void
  onRowClick?: (teacher: TeacherListItem) => void
} = {}) {
  const {
    rows = teachers,
    selectedIds = new Set<number>(),
    onToggleSelect = vi.fn(),
    onSelectAll = vi.fn(),
    onRowClick = vi.fn(),
  } = options

  const data = toSpringPage({
    content: rows,
    page: { number: 0, size: 15, totalElements: rows.length, totalPages: 1 },
  })

  render(
    <TeacherTable
      data={data}
      isPending={false}
      isError={false}
      isPlaceholderData={false}
      pageSize={15}
      selectedIds={selectedIds}
      onToggleSelect={onToggleSelect}
      onSelectAll={onSelectAll}
      onPageChange={() => {}}
      onRowClick={onRowClick}
      hasFilters={false}
      onCreate={() => {}}
    />,
  )

  return { onToggleSelect, onSelectAll, onRowClick }
}

describe('TeacherTable', () => {
  it('hiển thị đầy đủ thông tin: STT, avatar initials, họ tên, email, ngành, tag đơn vị và vai trò GVHD', () => {
    renderTable()

    expect(screen.getByText('Trần Quốc Bảo')).toBeInTheDocument()
    expect(screen.getByText('bao.tq@tlu.edu.vn')).toBeInTheDocument()
    expect(screen.getByText('TB')).toBeInTheDocument()

    expect(screen.getByText('Vũ Thị Lan')).toBeInTheDocument()
    expect(screen.getByText('lan.vt@tlu.edu.vn')).toBeInTheDocument()
    expect(screen.getByText('VL')).toBeInTheDocument()

    expect(screen.getByTitle('Học hàm / Học vị')).toBeInTheDocument()
    expect(screen.getByText('PGS.TS.')).toBeInTheDocument()
    expect(screen.getByText('TS.')).toBeInTheDocument()
    expect(screen.getAllByText('Kỹ thuật phần mềm')).toHaveLength(2)
    expect(screen.getAllByText('Trong trường')).toHaveLength(2)
    expect(screen.getAllByText('Chưa phân công')).toHaveLength(2)
  })

  it('bấm checkbox chọn dòng gọi onToggleSelect với đúng id', async () => {
    const u = userEvent.setup()
    const { onToggleSelect } = renderTable()

    const checkboxes = screen.getAllByRole('checkbox')
    // checkboxes[1] là checkbox của dòng đầu tiên (id = 1)
    await u.click(checkboxes[1])
    expect(onToggleSelect).toHaveBeenCalledWith(1)
  })

  it('bấm checkbox tiêu đề gọi onSelectAll', async () => {
    const u = userEvent.setup()
    const { onSelectAll } = renderTable()

    const checkboxes = screen.getAllByRole('checkbox')
    // checkboxes[0] là header checkbox
    await u.click(checkboxes[0])
    expect(onSelectAll).toHaveBeenCalledWith(true)
  })

  it('bấm vào dòng gọi onRowClick với dữ liệu giáo viên đó', async () => {
    const u = userEvent.setup()
    const { onRowClick } = renderTable()

    await u.click(screen.getByText('Trần Quốc Bảo'))
    expect(onRowClick).toHaveBeenCalledWith(teachers[0])
  })
})
