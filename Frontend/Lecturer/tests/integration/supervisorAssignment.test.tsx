import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SupervisorAssignmentPage from '@/features/department/lecturer_management/pages/SupervisorAssignmentPage'
import { supervisorService } from '@/features/department/lecturer_management/services/supervisor.service'
import { teacherService } from '@/features/department/lecturer_management/services/teacher.service'
import { studentService } from '@/features/department/student_management/services/student.service'
import { toSpringPage } from '@/shared/utils'
import type { TeacherListItem } from '@/features/department/lecturer_management/types'
import type { StudentListItem } from '@/features/department/student_management/types'

const MOCK_TEACHERS: TeacherListItem[] = [
  {
    publicId: 't-1',
    id: 1,
    name: 'Nguyễn Quốc Bảo',
    academicTitle: 'TS.',
    email: 'bao.nq@tlu.edu.vn',
    organization: 'Trường Đại học Thủy lợi',
    isInternal: true,
    majorName: 'Kỹ thuật phần mềm',
    amount: 5,
    isAssigned: true,
    assignmentStatus: 'Đã phân công',
    status: true,
  },
  {
    publicId: 't-2',
    id: 2,
    name: 'Bùi Hoàng Long',
    academicTitle: 'ThS.',
    email: 'long.bh@tlu.edu.vn',
    organization: 'Trường Đại học Thủy lợi',
    isInternal: true,
    majorName: 'Kỹ thuật phần mềm',
    amount: 4,
    isAssigned: true,
    assignmentStatus: 'Đã phân công',
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
      <SupervisorAssignmentPage />
    </QueryClientProvider>,
  )
}

describe('SupervisorAssignmentPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('hiển thị bảng danh sách GVHD tổng quan với dữ liệu lấy từ backend', async () => {
    renderPage()

    expect(screen.getByText('Phân công GVHD')).toBeInTheDocument()
    expect(screen.getByText('Thiết lập mặc định')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTitle('Học hàm / Học vị')).toBeInTheDocument()
      expect(screen.getByText('Nguyễn Quốc Bảo')).toBeInTheDocument()
      expect(screen.getByText('Bùi Hoàng Long')).toBeInTheDocument()
      expect(screen.getByText('TS.')).toBeInTheDocument()
      expect(screen.getByText('ThS.')).toBeInTheDocument()
    })
  })

  it('bấm "Thiết lập mặc định" mở popup cấu hình hạn mức theo chức danh', async () => {
    const u = userEvent.setup()
    renderPage()

    await u.click(screen.getByText('Thiết lập mặc định'))
    expect(
      screen.getByText('Thiết lập hạn mức theo chức danh'),
    ).toBeInTheDocument()
    expect(screen.getByText('Thạc sĩ')).toBeInTheDocument()
    expect(screen.getByText('Tiến sĩ')).toBeInTheDocument()
  })

  it('bấm "Phân công GVHD" chuyển sang workspace 2 cột', async () => {
    const u = userEvent.setup()
    renderPage()

    await u.click(screen.getByRole('button', { name: /Phân công GVHD/ }))
    expect(screen.getByText('Danh sách GVHD')).toBeInTheDocument()
    expect(screen.getByText(/Chưa nhận GV/)).toBeInTheDocument()
    expect(screen.getByText(/Đã nhận GV/)).toBeInTheDocument()
    expect(screen.getByText('Giảng viên tiếp nhận')).toBeInTheDocument()
  })

  it('lấy danh sách GVHD từ endpoint GET /semesters/{semesterId}/advisors kèm hạn mức maxStudents từ bảng semester_advisor', async () => {
    vi.spyOn(supervisorService, 'getAssignedAdvisors').mockResolvedValue([
      {
        id: 101,
        semesterId: 'sem-curr',
        maxStudents: 8,
        currentStudents: 2,
        teacherId: 1,
        name: 'Nguyễn Quốc Bảo',
        fullNameWithTitle: 'TS. Nguyễn Quốc Bảo',
        academicTitle: 'TS.',
        email: 'bao.nq@tlu.edu.vn',
        isInternal: true,
        majorName: 'Kỹ thuật phần mềm',
        status: true,
      },
    ])

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Quốc Bảo')).toBeInTheDocument()
      expect(screen.getByText('TS.')).toBeInTheDocument()
      expect(screen.getByText('2/8 SV')).toBeInTheDocument()
    })
  })

  it('thay đổi hạn mức GVHD gọi supervisorService.updateLecturerQuota với teacherId/advisorId và semesterId', async () => {
    const updateSpy = vi
      .spyOn(supervisorService, 'updateLecturerQuota')
      .mockResolvedValue('Cập nhật hạn mức thành công')

    vi.spyOn(supervisorService, 'getAssignedAdvisors').mockResolvedValue([
      {
        id: 101,
        semesterId: 'sem-curr',
        maxStudents: 8,
        currentStudents: 2,
        teacherId: 1,
        name: 'Nguyễn Quốc Bảo',
        fullNameWithTitle: 'TS. Nguyễn Quốc Bảo',
        academicTitle: 'TS.',
        email: 'bao.nq@tlu.edu.vn',
        isInternal: true,
        majorName: 'Kỹ thuật phần mềm',
        status: true,
      },
    ])

    const u = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByDisplayValue('8')).toBeInTheDocument()
    })

    const quotaInput = screen.getByDisplayValue('8')
    await u.clear(quotaInput)
    await u.type(quotaInput, '10')

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          teacherOrAdvisorId: 1,
          quota: 10,
          semesterId: 'sem-curr',
        }),
      )
    })
  })

  it('bấm "Import File" mở popup ImportAdvisorsDialog kiểm tra các quy tắc đối soát tự động', async () => {
    const u = userEvent.setup()
    renderPage()

    const importButton = screen.getByRole('button', { name: /Import File/ })
    await u.click(importButton)

    await waitFor(() => {
      expect(
        screen.getByText('Import danh sách Giáo viên Hướng dẫn'),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/Quy tắc đối soát tự động khi import GVHD/i),
      ).toBeInTheDocument()
      expect(screen.getByText(/Đã là GVHD kỳ này/i)).toBeInTheDocument()
      expect(screen.getByText(/Chưa là GVHD kỳ này/i)).toBeInTheDocument()
      expect(screen.getByText(/Chưa có trong hệ thống/i)).toBeInTheDocument()
    })
  })
})
