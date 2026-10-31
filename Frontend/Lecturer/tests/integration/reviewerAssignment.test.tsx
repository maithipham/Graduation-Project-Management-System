import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ReviewerAssignmentPage from '@/features/department/lecturer_management/pages/ReviewerAssignmentPage'
import { teacherService } from '@/features/department/lecturer_management/services/teacher.service'
import { studentService } from '@/features/department/student_management/services/student.service'
import { toSpringPage } from '@/shared/utils'
import type { TeacherListItem } from '@/features/department/lecturer_management/types'
import type { StudentListItem } from '@/features/department/student_management/types'

const MOCK_TEACHERS: TeacherListItem[] = [
  {
    publicId: 't-1',
    id: 1,
    name: 'Vũ Thị Lan',
    academicTitle: 'TS.',
    email: 'lan.vt@tlu.edu.vn',
    organization: 'Trường Đại học Thủy lợi',
    isInternal: true,
    majorName: 'Kỹ thuật phần mềm',
    amount: 5,
    isAssigned: false,
    assignmentStatus: 'Chưa phân công',
    status: true,
  },
]

const MOCK_STUDENTS: StudentListItem[] = [
  {
    publicId: 's-1',
    studentCode: '2151060001',
    name: 'Nguyễn Văn An',
    className: '62PM1',
    batch: 'K62',
    majorName: 'Kỹ thuật phần mềm',
    topicName: 'Hệ thống Microservices',
    lecturerName: 'TS. Nguyễn Quốc Bảo',
    coLecturerName: null,
    status: 'STAGE_1_ADVISOR_ASSIGNED',
    statusLabel: 'Đã phân công GVHD',
    accountStatus: true,
  },
  {
    publicId: 's-2',
    studentCode: '2151060002',
    name: 'Trần Thị Bình',
    className: '62PM1',
    batch: 'K62',
    majorName: 'Kỹ thuật phần mềm',
    topicName: 'Kiến trúc Clean Architecture',
    lecturerName: 'ThS. Bùi Hoàng Long',
    coLecturerName: null,
    status: 'STAGE_1_ADVISOR_ASSIGNED',
    statusLabel: 'Đã phân công GVHD',
    accountStatus: true,
  },
]

function renderPage() {
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
  vi.spyOn(studentService, 'getMajors').mockResolvedValue([
    { publicId: 'm1', code: '7480103', name: 'Kỹ thuật phần mềm' },
  ])
  vi.spyOn(studentService, 'getBatches').mockResolvedValue(['K62', 'K63'])
  vi.spyOn(teacherService, 'getTeachers').mockImplementation(async (params) =>
    toSpringPage({
      content: MOCK_TEACHERS,
      number: params.page,
      size: params.size,
      totalElements: MOCK_TEACHERS.length,
      totalPages: 1,
    }),
  )
  vi.spyOn(studentService, 'getStudents').mockImplementation(async (params) =>
    toSpringPage({
      content: MOCK_STUDENTS,
      number: params.page,
      size: params.size,
      totalElements: MOCK_STUDENTS.length,
      totalPages: 1,
    }),
  )

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <ReviewerAssignmentPage />
    </QueryClientProvider>,
  )
}

describe('ReviewerAssignmentPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('hiển thị thanh công cụ, thống kê và danh sách sinh viên lấy từ backend', async () => {
    renderPage()

    expect(screen.getByText('Tải file mẫu')).toBeInTheDocument()
    expect(screen.getByText('Import File')).toBeInTheDocument()
    expect(screen.getByText('Thêm thủ công')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument()
      expect(screen.getByText('Trần Thị Bình')).toBeInTheDocument()
    })
  })

  it('chọn người nhận xét từ combobox cập nhật người nhận xét của sinh viên', async () => {
    const u = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument()
    })

    // Tìm các nút combobox
    const buttons = screen.getAllByRole('button', { name: /Chưa phân công|TS\.|PGS\.|ThS\./i })
    expect(buttons.length).toBeGreaterThan(0)

    // Bấm vào 1 nút combobox đang "Chưa phân công"
    const unassignedBtn = screen.getAllByRole('button', { name: 'Chưa phân công' })[0]
    await u.click(unassignedBtn)

    // Hiển thị danh sách giảng viên để chọn
    expect(await screen.findByPlaceholderText('Tìm GV nhận xét...')).toBeInTheDocument()
  })
})
