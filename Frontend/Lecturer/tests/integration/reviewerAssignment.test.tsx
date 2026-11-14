import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ReviewerAssignmentPage from '@/features/department/lecturer_management/pages/ReviewerAssignmentPage'
import { teacherService } from '@/features/department/lecturer_management/services/teacher.service'
import { commentingLecturerService } from '@/features/department/lecturer_management/services/commentingLecturer.service'
import { transformCommentingLecturer, transformStudentAssignment } from '@/features/department/lecturer_management/utils/commenting.mapper'
import { studentService } from '@/features/department/student_management/services/student.service'
import type { SemesterOption } from '@/features/department/student_management/types'

const CURRENT_SEMESTER: SemesterOption = {
  publicId: 'sem-curr',
  name: 'Học kỳ 1 năm học 2026-2027',
  academicYear: '2026-2027',
  term: 'Học kỳ 1',
  startDate: '01-09-2026',
  endDate: '15-01-2027',
}

// Giảng viên nhận xét (đi qua mapper giống như service thật)
const MOCK_LECTURERS = [
  transformCommentingLecturer(
    {
      id: 10,
      publicId: 't-10',
      fullName: 'Vũ Thị Lan',
      title: 'TS.',
      department: 'Kỹ thuật phần mềm',
      organization: 'Trường Đại học Thủy lợi',
      currentCommentingCount: 1,
    },
    'Kỹ thuật phần mềm',
  ),
]

// Sinh viên: An chưa có GVNX, Bình đã có GVNX
const MOCK_STUDENTS = [
  transformStudentAssignment({
    studentId: 1,
    studentPublicId: 's-1',
    studentCode: '2151060001',
    studentName: 'Nguyễn Văn An',
    className: '62PM1',
    majorName: 'Kỹ thuật phần mềm',
    topicId: 101,
    topicTitle: 'Hệ thống Microservices',
    supervisorId: 20,
    supervisorName: 'TS. Nguyễn Quốc Bảo',
    commentingLecturerId: null,
  }),
  transformStudentAssignment({
    studentId: 2,
    studentPublicId: 's-2',
    studentCode: '2151060002',
    studentName: 'Trần Thị Bình',
    className: '62PM1',
    majorName: 'Kỹ thuật phần mềm',
    topicId: 102,
    topicTitle: 'Kiến trúc Clean Architecture',
    supervisorId: 21,
    supervisorName: 'ThS. Bùi Hoàng Long',
    commentingLecturerId: 10,
    commentingLecturerPublicId: 't-10',
    commentingLecturerName: 'TS. Vũ Thị Lan',
  }),
]

function renderPage() {
  vi.spyOn(studentService, 'getCurrentSemester').mockResolvedValue(CURRENT_SEMESTER)
  vi.spyOn(studentService, 'getSemesters').mockResolvedValue([CURRENT_SEMESTER])
  vi.spyOn(teacherService, 'getManagedMajor').mockResolvedValue({
    publicId: 'm1',
    code: '7480103',
    name: 'Kỹ thuật phần mềm',
  })
  const getLecturers = vi
    .spyOn(commentingLecturerService, 'getCommentingLecturers')
    .mockResolvedValue(MOCK_LECTURERS)
  const getStudents = vi
    .spyOn(commentingLecturerService, 'getStudents')
    .mockResolvedValue(MOCK_STUDENTS)
  const assignManual = vi
    .spyOn(commentingLecturerService, 'assignManual')
    .mockResolvedValue(undefined)

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <ReviewerAssignmentPage />
    </QueryClientProvider>,
  )

  return { getLecturers, getStudents, assignManual }
}

describe('ReviewerAssignmentPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('tự chọn học kỳ hiện tại, hiển thị sinh viên, thống kê và giảng viên nhận xét từ backend', async () => {
    const { getLecturers, getStudents } = renderPage()

    expect(await screen.findByText('Nguyễn Văn An')).toBeInTheDocument()
    expect(screen.getByText('Trần Thị Bình')).toBeInTheDocument()
    expect(screen.getByText('Tất cả (2)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Phân công nhanh \(Chia đều\)/ })).toBeInTheDocument()
    expect(screen.getAllByText('TS. Vũ Thị Lan').length).toBeGreaterThan(0)

    // Gọi API với học kỳ hiện tại
    expect(getStudents).toHaveBeenCalledWith('sem-curr', 'ALL')
    expect(getLecturers).toHaveBeenCalledWith('sem-curr', 'Kỹ thuật phần mềm')
  })

  it('tích chọn sinh viên rồi bấm Gán sẽ gửi phân công thủ công cho giảng viên đang chọn', async () => {
    const u = userEvent.setup()
    const { assignManual } = renderPage()

    const row = (await screen.findByText('Nguyễn Văn An')).closest('tr')
    expect(row).not.toBeNull()

    const assignBtn = screen.getByRole('button', { name: /Gán \(0 SV\)/ })
    expect(assignBtn).toBeDisabled()

    await u.click(within(row as HTMLElement).getByRole('checkbox'))

    const enabledBtn = await screen.findByRole('button', { name: /Gán \(1 SV\)/ })
    await waitFor(() => expect(enabledBtn).toBeEnabled())
    await u.click(enabledBtn)

    await waitFor(() => {
      expect(assignManual).toHaveBeenCalledWith({
        commentingLecturerId: 10,
        commentingLecturerPublicId: 't-10',
        studentOrTopicIds: [101],
      })
    })
  })
})
