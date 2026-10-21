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

// 25 giáo viên, mỗi trang 10 → có 3 trang
const rows: TeacherListItem[] = Array.from({ length: 10 }, (_, i) => ({
  publicId: `id-${i}`,
  name: `Giáo viên ${i + 1}`,
  majorName: 'Kỹ thuật phần mềm',
  organization: 'Trường Đại học Thủy lợi',
  phone: null,
  amount: 20,
  status: true,
}))

function renderPage() {
  const getTeachers = vi
    .spyOn(teacherService, 'getTeachers')
    .mockImplementation(async (params) =>
      toSpringPage({ content: rows, number: params.page, size: params.size, totalElements: 25, totalPages: 3 }),
    )
  vi.spyOn(studentService, 'getMajors').mockResolvedValue(MAJORS)
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

describe('LecturerManagementPage — bộ lọc, phân trang, sắp xếp', () => {
  it('lần đầu: chỉ gửi page=0, size=10, không lọc, không sort', async () => {
    const { lastParams } = renderPage()

    await screen.findByText('Giáo viên 1')
    expect(lastParams()).toEqual({ page: 0, size: 10 })
  })

  it('đổi bộ lọc đơn vị / ngành → gửi đúng tham số BE', async () => {
    const u = userEvent.setup()
    const { lastParams } = renderPage()
    await screen.findByText('Giáo viên 1')

    await u.selectOptions(screen.getByLabelText('Lọc theo đơn vị công tác'), 'Trong trường')
    await waitFor(() =>
      expect(lastParams()).toEqual({ organizationType: 'internal', page: 0, size: 10 }),
    )

    await u.selectOptions(screen.getByLabelText('Lọc theo đơn vị công tác'), 'Ngoài trường')
    await waitFor(() => expect(lastParams()).toEqual({ organizationType: 'external', page: 0, size: 10 }))

    await u.selectOptions(await screen.findByLabelText('Lọc theo khoa'), 'Kỹ thuật phần mềm')
    await waitFor(() =>
      expect(lastParams()).toEqual({
        organizationType: 'external',
        majorName: 'Kỹ thuật phần mềm',
        page: 0,
        size: 10,
      }),
    )
  })

  it('ô tìm tên: chờ ngừng gõ mới gọi API, bỏ khoảng trắng hai đầu', async () => {
    const u = userEvent.setup()
    const { getTeachers, lastParams } = renderPage()
    await screen.findByText('Giáo viên 1')
    const callsBefore = getTeachers.mock.calls.length

    await u.type(screen.getByLabelText('Tìm kiếm giáo viên'), '  An ')

    // Vừa gõ xong: chưa gọi API theo từng ký tự
    expect(getTeachers.mock.calls.slice(callsBefore).some(([p]) => p.name)).toBe(false)
    await waitFor(() => expect(lastParams()).toEqual({ name: 'An', page: 0, size: 10 }))
    // Chỉ gọi đúng 1 lần với tên đã gõ xong, không gọi với "A"
    expect(getTeachers.mock.calls.filter(([p]) => p.name).map(([p]) => p.name)).toEqual(['An'])
  })

  it('đang ở trang 2 mà đổi bộ lọc → quay về trang đầu', async () => {
    const u = userEvent.setup()
    const { lastParams } = renderPage()

    await u.click(await screen.findByRole('button', { name: '2' }))
    await waitFor(() => expect(lastParams()).toEqual({ page: 1, size: 10 }))

    await u.selectOptions(screen.getByLabelText('Lọc theo đơn vị công tác'), 'Ngoài trường')
    await waitFor(() => expect(lastParams()).toEqual({ organizationType: 'external', page: 0, size: 10 }))
  })

  it('"Xóa lọc" xóa cả bộ lọc lẫn cột sắp xếp và quay về trang đầu', async () => {
    const u = userEvent.setup()
    const { lastParams } = renderPage()
    await screen.findByText('Giáo viên 1')

    await u.click(screen.getByRole('button', { name: 'Họ và tên' }))
    await waitFor(() => expect(lastParams()).toEqual({ page: 0, size: 10, sort: 'name,asc' }))
    await u.selectOptions(await screen.findByLabelText('Lọc theo khoa'), 'Kỹ thuật phần mềm')
    await u.click(await screen.findByRole('button', { name: '2' }))
    await waitFor(() =>
      expect(lastParams()).toEqual({ majorName: 'Kỹ thuật phần mềm', page: 1, size: 10, sort: 'name,asc' }),
    )

    await u.click(screen.getByRole('button', { name: /Xóa lọc/ }))

    await waitFor(() => expect(lastParams()).toEqual({ page: 0, size: 10 }))
    expect(screen.queryByRole('button', { name: /Xóa lọc/ })).not.toBeInTheDocument()
  })
})
