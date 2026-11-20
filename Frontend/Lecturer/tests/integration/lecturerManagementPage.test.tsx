import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LecturerManagementPage from '@/features/department/lecturer_management/pages/LecturerManagementPage'
import { teacherService } from '@/features/department/lecturer_management/services/teacher.service'
import type { TeacherListItem } from '@/features/department/lecturer_management/types'
import { studentService } from '@/features/department/student_management/services/student.service'

const MAJORS = [{ publicId: 'm1', code: '7480103', name: 'Kỹ thuật phần mềm' }]

const SEMESTER = {
  publicId: 'sem-curr',
  name: 'Học kỳ 1 năm học 2026-2027',
  academicYear: '2026-2027',
  term: 'Học kỳ 1',
  startDate: '01-09-2026',
  endDate: '15-01-2027',
}

// 20 giáo viên: GV 1–17 chưa phân công, GV 18–20 đã phân công. Trang 15 dòng → 2 trang (phân trang ở FE)
const rows: TeacherListItem[] = Array.from({ length: 20 }, (_, i) => {
  const assigned = i >= 17
  return {
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
    isAssigned: assigned,
    assignmentStatus: assigned ? 'Đã phân công' : 'Chưa phân công',
    status: true,
  }
})

function renderPage(managedMajor: (typeof MAJORS)[number] | null = null) {
  // GET /teacher/all: BE trả toàn bộ danh sách, FE tự phân trang
  const getAll = vi.spyOn(teacherService, 'getAllTeachersList').mockResolvedValue(rows)
  vi.spyOn(teacherService, 'getManagedMajor').mockResolvedValue(managedMajor)
  vi.spyOn(studentService, 'getMajors').mockResolvedValue(MAJORS)
  vi.spyOn(studentService, 'getCurrentSemester').mockResolvedValue(SEMESTER)
  vi.spyOn(studentService, 'getSemesters').mockResolvedValue([SEMESTER])

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <LecturerManagementPage />
    </QueryClientProvider>,
  )
  /** Tham số của lần gọi API gần nhất */
  const lastParams = () => getAll.mock.lastCall?.[0]
  return { getAll, lastParams }
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('LecturerManagementPage — bộ lọc, phân trang, phân công GVHD', () => {
  it('lần đầu: lấy GV của học kỳ hiện tại, mọi trạng thái; phân trang FE 15 dòng/trang', async () => {
    const { lastParams } = renderPage()

    await screen.findByText('Giáo viên 1')
    await waitFor(() => expect(lastParams()?.semesterId).toBe('sem-curr'))
    expect(lastParams()?.isAssigned).toBeUndefined()
    expect(screen.getByText('Giáo viên 15')).toBeInTheDocument()
    expect(screen.queryByText('Giáo viên 16')).not.toBeInTheDocument()
  })

  it('TBM có ngành phụ trách: tự lọc theo ngành đó khi mở trang', async () => {
    const { lastParams } = renderPage(MAJORS[0])

    await screen.findByText('Giáo viên 1')
    await waitFor(() =>
      expect(lastParams()).toEqual(
        expect.objectContaining({ majorId: 'm1', majorName: 'Kỹ thuật phần mềm' }),
      ),
    )
  })

  it('đổi bộ lọc đơn vị / ngành / trạng thái → gửi đúng tham số BE', async () => {
    const u = userEvent.setup()
    const { lastParams } = renderPage()
    await screen.findByText('Giáo viên 1')

    await u.selectOptions(screen.getByLabelText('Lọc theo đơn vị công tác'), 'Trong trường')
    await waitFor(() => expect(lastParams()).toEqual(expect.objectContaining({ unitType: 'INTERNAL' })))

    await u.selectOptions(screen.getByLabelText('Lọc theo đơn vị công tác'), 'Ngoài trường')
    await waitFor(() => expect(lastParams()).toEqual(expect.objectContaining({ unitType: 'EXTERNAL' })))

    await u.selectOptions(await screen.findByLabelText('Lọc theo ngành'), 'Kỹ thuật phần mềm')
    await waitFor(() =>
      expect(lastParams()).toEqual(
        expect.objectContaining({ majorName: 'Kỹ thuật phần mềm', majorId: 'm1' }),
      ),
    )

    await u.selectOptions(screen.getByLabelText('Lọc theo trạng thái phân công'), 'Chưa phân công')
    await waitFor(() => expect(lastParams()).toEqual(expect.objectContaining({ isAssigned: false })))
  })

  it('lọc "Đã phân công": chỉ hiện GV đã phân công', async () => {
    const u = userEvent.setup()
    renderPage()
    await screen.findByText('Giáo viên 1')

    await u.selectOptions(screen.getByLabelText('Lọc theo trạng thái phân công'), 'Đã phân công')

    expect(await screen.findByText('Giáo viên 18')).toBeInTheDocument()
    expect(screen.queryByText('Giáo viên 1')).not.toBeInTheDocument()
  })

  it('chọn Tất cả học kỳ → không gửi semesterId', async () => {
    const u = userEvent.setup()
    const { lastParams } = renderPage()
    await screen.findByText('Giáo viên 1')

    await u.selectOptions(screen.getByLabelText('Chọn học kỳ'), 'all')
    await waitFor(() => expect(lastParams()?.semesterId).toBeUndefined())
  })

  it('ô tìm kiếm: chờ ngừng gõ mới gọi API, bỏ khoảng trắng hai đầu', async () => {
    const u = userEvent.setup()
    const { lastParams } = renderPage()
    await screen.findByText('Giáo viên 1')
    await waitFor(() => expect(lastParams()?.semesterId).toBe('sem-curr'))

    await u.type(screen.getByLabelText('Tìm kiếm giáo viên'), '  Bảo  ')
    expect(lastParams()?.name).toBeUndefined()

    await waitFor(() => expect(lastParams()?.name).toBe('Bảo'), { timeout: 1500 })
    expect(lastParams()?.keyword).toBe('Bảo')
  })

  it('nút "Phân công làm GVHD (x)" hiển thị số lượng được chọn và bật khi có chọn dòng', async () => {
    const u = userEvent.setup()
    renderPage()
    await screen.findByText('Giáo viên 1')

    const assignButton = screen.getByRole('button', { name: /Phân công làm GVHD/i })
    expect(assignButton).toBeDisabled()

    // checkboxes[0] là header chọn tất cả, checkboxes[1] là dòng 1
    await u.click(screen.getAllByRole('checkbox')[1])

    expect(assignButton).toBeEnabled()
    expect(assignButton).toHaveTextContent('Phân công làm GVHD (1)')
  })

  it('"Xóa lọc" xóa bộ lọc', async () => {
    const u = userEvent.setup()
    const { lastParams } = renderPage()
    await screen.findByText('Giáo viên 1')

    await u.selectOptions(screen.getByLabelText('Lọc theo đơn vị công tác'), 'Ngoài trường')
    await waitFor(() => expect(lastParams()?.unitType).toBe('EXTERNAL'))

    await u.click(screen.getByRole('button', { name: /Xóa lọc/i }))
    await waitFor(() => expect(lastParams()?.unitType).toBeUndefined())
  })
})
