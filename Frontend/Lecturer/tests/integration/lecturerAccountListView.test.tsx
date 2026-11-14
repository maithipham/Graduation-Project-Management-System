import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LecturerAccountListView } from '@/features/admin/account_management/components/LecturerAccountListView'
import { teacherService } from '@/features/department/lecturer_management/services/teacher.service'
import { studentService } from '@/features/department/student_management/services/student.service'
import { toSpringPage } from '@/shared/utils'
import type { TeacherListItem } from '@/features/department/lecturer_management/types'

const MOCK_TEACHERS: TeacherListItem[] = [
  {
    publicId: 't-1',
    id: 1,
    teacherId: 1,
    name: 'Trần Quốc Bảo',
    academicTitle: 'PGS.TS.',
    email: 'bao.tq@tlu.edu.vn',
    phone: '0987654321',
    organization: 'Trường Đại học Thủy lợi',
    isInternal: true,
    majorName: 'Kỹ thuật phần mềm',
    status: true,
  },
  {
    publicId: 't-2',
    id: 2,
    teacherId: 2,
    name: 'Vũ Thị Lan',
    academicTitle: 'TS.',
    email: 'lan.vt@tlu.edu.vn',
    phone: '0987654322',
    organization: 'Trường Đại học Thủy lợi',
    isInternal: true,
    majorName: 'Kỹ thuật phần mềm',
    status: true,
  },
]

function renderComponent() {
  vi.spyOn(studentService, 'getMajors').mockResolvedValue([
    { publicId: 'm1', code: '7480103', name: 'Kỹ thuật phần mềm' },
    { publicId: 'm2', code: '7480201', name: 'Công nghệ thông tin' },
  ])

  vi.spyOn(teacherService, 'getTeachers').mockImplementation(async (params) =>
    toSpringPage({
      content: MOCK_TEACHERS,
      number: params.page,
      size: params.size,
      totalElements: MOCK_TEACHERS.length,
      totalPages: 1,
    }),
  )

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <LecturerAccountListView />
    </QueryClientProvider>,
  )
}

describe('LecturerAccountListView — Admin quản lý tài khoản Giảng viên (API thật)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('lấy danh sách tất cả giáo viên từ API và hiển thị lên bảng', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByTitle('Học hàm / Học vị')).toBeInTheDocument()
      expect(screen.getByText('Trần Quốc Bảo')).toBeInTheDocument()
      expect(screen.getByText('PGS.TS.')).toBeInTheDocument()
      expect(screen.getByText('Vũ Thị Lan')).toBeInTheDocument()
      expect(screen.getByText('TS.')).toBeInTheDocument()
      expect(screen.getByText('bao.tq@tlu.edu.vn')).toBeInTheDocument()
      expect(screen.getByText('0987654321')).toBeInTheDocument()
    })
  })

  it('bấm "+ Thêm giảng viên" mở popup với ô Ngành không bị khóa (Admin phải chọn ngành)', async () => {
    const u = userEvent.setup()
    renderComponent()

    await u.click(screen.getByRole('button', { name: /Thêm giảng viên/ }))

    expect(await screen.findByText('Nhập thông tin một giáo viên hướng dẫn đồ án.')).toBeInTheDocument()
    // Ô chọn ngành phải mở để Admin chọn ngành từ danh sách
    expect(screen.getByRole('combobox', { name: /^Ngành/ })).toBeEnabled()
  })

  it('bấm "Import giảng viên" mở popup import file Excel (Admin import được tất cả ngành)', async () => {
    const u = userEvent.setup()
    renderComponent()

    await u.click(screen.getByRole('button', { name: /Import giảng viên/ }))

    expect(await screen.findByText('Import danh sách giáo viên')).toBeInTheDocument()
  })
})
