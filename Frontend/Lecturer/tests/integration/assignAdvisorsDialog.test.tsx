import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AssignAdvisorsDialog } from '@/features/department/lecturer_management/components/AssignAdvisorsDialog'
import { teacherService } from '@/features/department/lecturer_management/services/teacher.service'
import type { TeacherListItem } from '@/features/department/lecturer_management/types'
import type { SemesterOption } from '@/features/department/student_management'

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

const MOCK_TERMS: SemesterOption[] = [
  {
    publicId: 'sem-1',
    name: 'Học kỳ 1 năm học 2026-2027',
    academicYear: '2026-2027',
    term: 'Học kỳ 1',
    startDate: '01-09-2026',
    endDate: '15-01-2027',
  },
  {
    publicId: 'sem-2',
    name: 'Học kỳ 2 năm học 2026-2027',
    academicYear: '2026-2027',
    term: 'Học kỳ 2',
    startDate: '16-01-2027',
    endDate: '31-05-2027',
  },
]

describe('AssignAdvisorsDialog — Popup xác nhận phân công GVHD', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('hiển thị đầy đủ tiêu đề, năm học/học kỳ chỉ hiển thị không cho thay đổi, danh sách GV đã chọn và cột Thao tác', () => {
    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <AssignAdvisorsDialog
          open
          onOpenChange={vi.fn()}
          selectedTeachers={MOCK_TEACHERS}
          semesterId="sem-1"
          academicYears={['2026-2027']}
          termsOfYear={MOCK_TERMS}
          selectedYear="2026-2027"
          selectedSemesterId="sem-1"
          onSuccess={vi.fn()}
        />
      </QueryClientProvider>,
    )

    expect(screen.getByText('Phân công làm Giảng viên Hướng dẫn')).toBeInTheDocument()
    // Năm học và Học kỳ chỉ hiển thị cố định, không phải combobox để thay đổi
    expect(screen.getByText('2026-2027')).toBeInTheDocument()
    expect(screen.getByText('Học kỳ 1')).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.getByTitle('Học hàm / Học vị')).toBeInTheDocument()
    expect(screen.getByText('Trần Quốc Bảo')).toBeInTheDocument()
    expect(screen.getByText('PGS.TS.')).toBeInTheDocument()
    expect(screen.getByText('Vũ Thị Lan')).toBeInTheDocument()
    expect(screen.getByText('TS.')).toBeInTheDocument()
    expect(screen.getAllByText('Kỹ thuật phần mềm')).toHaveLength(2)
  })

  it('bấm icon xóa (thùng rác) gỡ giảng viên khỏi danh sách phân công', async () => {
    const u = userEvent.setup()
    const queryClient = new QueryClient()
    const onRemoveTeacher = vi.fn()

    render(
      <QueryClientProvider client={queryClient}>
        <AssignAdvisorsDialog
          open
          onOpenChange={vi.fn()}
          selectedTeachers={MOCK_TEACHERS}
          semesterId="sem-1"
          academicYears={['2026-2027']}
          termsOfYear={MOCK_TERMS}
          selectedYear="2026-2027"
          selectedSemesterId="sem-1"
          onRemoveTeacher={onRemoveTeacher}
          onSuccess={vi.fn()}
        />
      </QueryClientProvider>,
    )

    const deleteButtons = screen.getAllByTitle('Xóa khỏi danh sách phân công')
    expect(deleteButtons).toHaveLength(2)

    await u.click(deleteButtons[0])

    expect(onRemoveTeacher).toHaveBeenCalledWith(1)
    expect(screen.queryByText('Trần Quốc Bảo')).not.toBeInTheDocument()
    expect(screen.getByText('Vũ Thị Lan')).toBeInTheDocument()
  })

  it('bấm Xác nhận gọi API POST /semesters/{semesterId}/advisors và đóng modal khi thành công', async () => {
    const u = userEvent.setup()
    const queryClient = new QueryClient()
    const assignSpy = vi
      .spyOn(teacherService, 'assignAdvisors')
      .mockResolvedValue('Cấu hình danh sách giáo viên hướng dẫn thành công')
    const onSuccess = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <QueryClientProvider client={queryClient}>
        <AssignAdvisorsDialog
          open
          onOpenChange={onOpenChange}
          selectedTeachers={MOCK_TEACHERS}
          semesterId="sem-1"
          academicYears={['2026-2027']}
          termsOfYear={MOCK_TERMS}
          selectedYear="2026-2027"
          selectedSemesterId="sem-1"
          onSuccess={onSuccess}
        />
      </QueryClientProvider>,
    )

    await u.click(screen.getByRole('button', { name: 'Xác nhận' }))

    await waitFor(() => {
      expect(assignSpy).toHaveBeenCalledWith('sem-1', {
        teacherIds: [1, 2],
        maxStudentsPerTeacher: 20,
      })
    })
    expect(onSuccess).toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('hiển thị thông báo lỗi khi học kỳ không thể phân công (SEMESTER_NOT_EDITABLE)', async () => {
    const u = userEvent.setup()
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    vi.spyOn(teacherService, 'assignAdvisors').mockRejectedValue(
      new Error('Chỉ kỳ đang diễn ra mới được phân công GVHD'),
    )

    render(
      <QueryClientProvider client={queryClient}>
        <AssignAdvisorsDialog
          open
          onOpenChange={vi.fn()}
          selectedTeachers={MOCK_TEACHERS}
          semesterId="sem-1"
          academicYears={['2026-2027']}
          termsOfYear={MOCK_TERMS}
          selectedYear="2026-2027"
          selectedSemesterId="sem-1"
          onSuccess={vi.fn()}
        />
      </QueryClientProvider>,
    )

    await u.click(screen.getByRole('button', { name: 'Xác nhận' }))

    expect(await screen.findByText('Chỉ kỳ đang diễn ra mới được phân công GVHD')).toBeInTheDocument()
  })

  it('không bị lỗi ReferenceError khi selectedSemesterId là "all" (bấm chọn Tất cả học kỳ)', () => {
    const queryClient = new QueryClient()
    expect(() => {
      render(
        <QueryClientProvider client={queryClient}>
          <AssignAdvisorsDialog
            open
            onOpenChange={vi.fn()}
            selectedTeachers={MOCK_TEACHERS}
            semesterId="sem-1"
            semesterName="Học kỳ 1"
            academicYears={['2026-2027']}
            termsOfYear={MOCK_TERMS}
            selectedYear="all"
            selectedSemesterId="all"
            onSuccess={vi.fn()}
          />
        </QueryClientProvider>,
      )
    }).not.toThrow()

    expect(screen.getByText('Phân công làm Giảng viên Hướng dẫn')).toBeInTheDocument()
    expect(screen.getByText('Học kỳ 1')).toBeInTheDocument()
  })
})
