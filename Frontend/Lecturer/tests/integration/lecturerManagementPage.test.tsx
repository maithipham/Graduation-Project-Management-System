import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LecturerManagementPage from '@/features/department/lecturer_management/pages/LecturerManagementPage'
import { teacherService } from '@/features/department/lecturer_management/services/teacher.service'
import type { TeacherListItem } from '@/features/department/lecturer_management/types'
import { studentService } from '@/features/department/student_management/services/student.service'
import { toSpringPage } from '@/shared/utils'

const MAJORS = [{ publicId: 'm1', code: '7480103', name: 'Kỹ thuật phần mềm' }]

// 25 giáo viên, mỗi trang 15 → có 2 trang
const rows: TeacherListItem[] = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  teacherId: i + 1,
  publicId: `id-${i}`,
  name: `Giáo viên ${i + 1}`,
  firstName: 'Giáo viên',
  lastName: `${i + 1}`,
  academicTitle: null,
  email: `gv${i + 1}@tlu.edu.vn`,
  majorName: 'Kỹ thuật phần mềm',
  organization: 'Trường Đại học Thủy lợi',
  isInternal: true,
  unitType: 'INTERNAL',
  isAssigned: false,
  assignmentStatus: 'Chưa phân công',
  status: true,
}))

function renderPage() {
  const getTeachers = vi
    .spyOn(teacherService, 'getTeachers')
    .mockImplementation(async (params) =>
      toSpringPage({ content: rows, number: params.page, size: params.size, totalElements: 25, totalPages: 2 }),
    )
  vi.spyOn(studentService, 'getMajors').mockResolvedValue(MAJORS)
  vi.spyOn(studentService, 'getCurrentSemester').mockResolvedValue({
    publicId: 'sem-curr',
    name: 'Học kỳ 1 năm học 2026-2027',
    academicYear: '2026-2027',
    term: 'Học kỳ 1',
    startDate: '01-09-2026',
    endDate: '15-01-2027',
  })
  vi.spyOn(studentService, 'getSemesters').mockResolvedValue([
    {
      publicId: 'sem-curr',
      name: 'Học kỳ 1 năm học 2026-2027',
      academicYear: '2026-2027',
      term: 'Học kỳ 1',
      startDate: '01-09-2026',
      endDate: '15-01-2027',
    },
  ])

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <LecturerManagementPage />
    </QueryClientProvider>,
  )
  /** Tham số của lần gọi API gần nhất */
  const lastParams = () => getTeachers.mock.lastCall?.[0]
  return { getTeachers, lastParams }
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('LecturerManagementPage — bộ lọc, phân trang, phân công GVHD', () => {
  it('lần đầu (kỳ này): gửi page=0, size=15, isAssigned=false để chỉ hiện GV có thể phân công', async () => {
    const { lastParams } = renderPage()

    await screen.findByText('Giáo viên 1')
    expect(lastParams()).toEqual(
      expect.objectContaining({ page: 0, size: 15, isAssigned: false }),
    )
  })

  it('đổi bộ lọc đơn vị / ngành / trạng thái → gửi đúng tham số BE', async () => {
    const u = userEvent.setup()
    const { lastParams } = renderPage()
    await screen.findByText('Giáo viên 1')

    await u.selectOptions(screen.getByLabelText('Lọc theo đơn vị công tác'), 'Trong trường')
    await waitFor(() =>
      expect(lastParams()).toEqual(
        expect.objectContaining({ unitType: 'INTERNAL' }),
      ),
    )

    await u.selectOptions(screen.getByLabelText('Lọc theo đơn vị công tác'), 'Ngoài trường')
    await waitFor(() =>
      expect(lastParams()).toEqual(
        expect.objectContaining({ unitType: 'EXTERNAL' }),
      ),
    )

    await u.selectOptions(await screen.findByLabelText('Lọc theo ngành'), 'Kỹ thuật phần mềm')
    await waitFor(() =>
      expect(lastParams()).toEqual(
        expect.objectContaining({
          majorName: 'Kỹ thuật phần mềm',
          majorId: 'm1',
        }),
      ),
    )

    await u.selectOptions(screen.getByLabelText('Lọc theo trạng thái phân công'), 'Chưa phân công')
    await waitFor(() =>
      expect(lastParams()).toEqual(
        expect.objectContaining({
          isAssigned: false,
        }),
      ),
    )
  })

  it('chọn Tất cả học kỳ → không gửi semesterId để lấy tất cả giáo viên luôn', async () => {
    const u = userEvent.setup()
    const { lastParams } = renderPage()
    await screen.findByText('Giáo viên 1')

    await u.selectOptions(screen.getByLabelText('Chọn học kỳ'), 'all')
    await waitFor(() => {
      expect(lastParams()?.semesterId).toBeUndefined()
      expect(lastParams()?.isAssigned).toBeUndefined()
    })
  })

  it('ô tìm kiếm: chờ ngừng gõ mới gọi API, bỏ khoảng trắng hai đầu', async () => {
    const u = userEvent.setup()
    const { getTeachers, lastParams } = renderPage()
    await screen.findByText('Giáo viên 1')

    const initialCalls = getTeachers.mock.calls.length
    const input = screen.getByLabelText('Tìm kiếm giáo viên')

    await u.type(input, '  Bảo  ')
    expect(getTeachers.mock.calls.length).toBe(initialCalls)

    await waitFor(() => expect(lastParams()?.name).toBe('Bảo'), { timeout: 1500 })
  })

  it('nút "Phân công làm GVHD (x)" hiển thị số lượng được chọn và bật khi có chọn dòng', async () => {
    const u = userEvent.setup()
    renderPage()
    await screen.findByText('Giáo viên 1')

    const assignButton = screen.getByRole('button', { name: /Phân công làm GVHD/i })
    expect(assignButton).toBeDisabled()

    const checkboxes = screen.getAllByRole('checkbox')
    // Chọn dòng đầu tiên (checkboxes[0] là header select-all, checkboxes[1] là dòng 1)
    await u.click(checkboxes[1])

    expect(assignButton).toBeEnabled()
    expect(assignButton).toHaveTextContent('Phân công làm GVHD (1)')
  })

  it('"Xóa lọc" xóa bộ lọc và quay về trang đầu', async () => {
    const u = userEvent.setup()
    const { lastParams } = renderPage()
    await screen.findByText('Giáo viên 1')

    await u.selectOptions(screen.getByLabelText('Lọc theo đơn vị công tác'), 'Ngoài trường')
    await waitFor(() => expect(lastParams()?.unitType).toBe('EXTERNAL'))

    await u.click(screen.getByRole('button', { name: /Xóa lọc/i }))
    await waitFor(() => expect(lastParams()?.unitType).toBeUndefined())
  })
})
