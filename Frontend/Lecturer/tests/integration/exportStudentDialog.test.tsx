import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ExportStudentDialog } from '@/features/department/student_management/components/ExportStudentDialog'
import { studentService } from '@/features/department/student_management/services/student.service'
import type { SemesterOption } from '@/features/department/student_management/types'
import {
  DEFAULT_STUDENT_FILTERS,
  type StudentFilters,
} from '@/features/department/student_management/utils/studentFilters'

const semester: SemesterOption = {
  publicId: 'sem-1',
  name: 'Học kỳ 1 năm học 2026-2027',
  academicYear: '2026-2027',
  term: 'Học kỳ 1',
  startDate: '01-09-2026',
  endDate: '15-01-2027',
  status: 'Đang diễn ra',
  statusCode: 'ONGOING',
}

function renderDialog(filters: StudentFilters, filteredCount?: number) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
    <ExportStudentDialog
      open
      onOpenChange={() => {}}
      semester={semester}
      filters={filters}
      majors={[]}
      sort="name,asc"
      filteredCount={filteredCount}
    />
    </QueryClientProvider>,
  )
}

const filteredOption = () => screen.getByRole('radio', { name: /Export theo bộ lọc/ })
const allOption = () => screen.getByRole('radio', { name: /Export toàn bộ danh sách/ })

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ExportStudentDialog', () => {
  it('chưa lọc gì: mặc định chọn "toàn bộ danh sách"', () => {
    renderDialog(DEFAULT_STUDENT_FILTERS)
    expect(allOption()).toBeChecked()
    expect(screen.getByText(/Chưa áp dụng bộ lọc nào/)).toBeInTheDocument()
  })

  it('đang lọc: mặc định chọn "theo bộ lọc", hiện bộ lọc và số sinh viên', () => {
    renderDialog({ ...DEFAULT_STUDENT_FILTERS, batch: 'K63' }, 12)
    expect(filteredOption()).toBeChecked()
    expect(screen.getByText('Khóa: K63')).toBeInTheDocument()
    expect(screen.getByText('12 sinh viên')).toBeInTheDocument()
  })

  it('bộ lọc ra 0 sinh viên: khóa nút Export, chuyển sang "toàn bộ" thì mở lại', async () => {
    const user = userEvent.setup()
    renderDialog({ ...DEFAULT_STUDENT_FILTERS, batch: 'K63' }, 0)
    const exportButton = screen.getByRole('button', { name: 'Export' })
    expect(exportButton).toBeDisabled()
    expect(screen.getByText(/không thể export file rỗng/)).toBeInTheDocument()

    await user.click(allOption())
    expect(exportButton).toBeEnabled()
  })

  it('đổi được giữa 2 lựa chọn', async () => {
    const user = userEvent.setup()
    renderDialog({ ...DEFAULT_STUDENT_FILTERS, batch: 'K63' })
    await user.click(allOption())
    expect(allOption()).toBeChecked()
    expect(filteredOption()).not.toBeChecked()
  })

  it('theo bộ lọc: gửi semesterId + bộ lọc đang chọn + sort; toàn bộ: chỉ semesterId + sort', async () => {
    // Không tải file thật trong jsdom
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:x')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const exportSpy = vi
      .spyOn(studentService, 'exportStudents')
      .mockResolvedValue({ blob: new Blob(), filename: 'a.xlsx' })
    const user = userEvent.setup()
    renderDialog({ ...DEFAULT_STUDENT_FILTERS, keyword: '  An ', batch: 'K63' }, 5)

    await user.click(screen.getByRole('button', { name: 'Export' }))
    expect(exportSpy.mock.calls[0][0]).toEqual({
      semesterId: 'sem-1',
      keyword: 'An',
      majorId: undefined,
      batch: 'K63',
      status: undefined,
      sort: 'name,asc',
    })

    await user.click(allOption())
    await user.click(screen.getByRole('button', { name: 'Export' }))
    expect(exportSpy.mock.calls[1][0]).toEqual({ semesterId: 'sem-1', sort: 'name,asc' })
  })
})
