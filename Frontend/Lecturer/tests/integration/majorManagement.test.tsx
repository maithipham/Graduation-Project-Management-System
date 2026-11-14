import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MajorFormDialog } from '@/features/admin/faculty_management/components/MajorFormDialog'
import { FacultyDetailView } from '@/features/admin/faculty_management/components/FacultyDetailView'
import { facultyService } from '@/features/admin/faculty_management/services/faculty.service'
import { useToastStore } from '@/shared/components/feedback/toast.store'
import { ApiError } from '@/shared/types'
import type { Faculty } from '@/features/admin/faculty_management/types/faculty.types'

const CANDIDATES = [
  { id: 101, fullName: 'Nguyễn Văn A', email: 'a.nv@tlu.edu.vn', academicRank: 'TS.' },
  { id: 102, fullName: 'Trần Thị B', email: 'b.tt@tlu.edu.vn', academicRank: 'ThS.' },
]

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  useToastStore.getState().clearAll()
  vi.spyOn(facultyService, 'getHeadCandidates').mockResolvedValue(CANDIDATES)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('MajorFormDialog — Quản lý chuyên ngành & Trưởng bộ môn', () => {
  it('kiểm tra validation: mã ngành và tên ngành bắt buộc nhập', async () => {
    const onSubmitSuccess = vi.fn()
    const u = userEvent.setup()

    renderWithClient(
      <MajorFormDialog
        open
        onOpenChange={vi.fn()}
        facultyName="Công nghệ thông tin"
        editingMajor={null}
        onSubmitSuccess={onSubmitSuccess}
      />,
    )

    await u.click(screen.getByRole('button', { name: 'Lưu' }))

    expect(await screen.findByText('Vui lòng nhập mã chuyên ngành')).toBeInTheDocument()
    expect(screen.getByText('Vui lòng nhập tên chuyên ngành')).toBeInTheDocument()
    expect(onSubmitSuccess).not.toHaveBeenCalled()
  })

  it('nhập đầy đủ thông tin: chuyển mã ngành sang in hoa và gửi Trưởng bộ môn', async () => {
    const onSubmitSuccess = vi.fn().mockResolvedValue(undefined)
    const onOpenChange = vi.fn()
    const u = userEvent.setup()

    renderWithClient(
      <MajorFormDialog
        open
        onOpenChange={onOpenChange}
        facultyName="Công nghệ thông tin"
        editingMajor={null}
        onSubmitSuccess={onSubmitSuccess}
      />,
    )

    await u.type(screen.getByPlaceholderText('KTPM'), 'ktpm')
    await u.type(screen.getByPlaceholderText('Ví dụ: Kỹ thuật phần mềm'), 'Kỹ thuật phần mềm')

    // Chọn Trưởng bộ môn
    const selectTrigger = screen.getByText('-- Chọn giảng viên làm Trưởng bộ môn (tùy chọn) --')
    await u.click(selectTrigger)
    const candidateOption = await screen.findByText('TS. Nguyễn Văn A')
    await u.click(candidateOption)

    await u.click(screen.getByRole('button', { name: 'Lưu' }))

    await waitFor(() => {
      expect(onSubmitSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'KTPM',
          name: 'Kỹ thuật phần mềm',
          headTeacherId: '101',
          headFullName: 'TS. Nguyễn Văn A',
          status: 'active',
        }),
        undefined,
      )
    })
  })

  it('xử lý lỗi mã ngành trùng lặp từ backend (code 3021: MAJOR_CODE_EXIST)', async () => {
    const onSubmitSuccess = vi.fn().mockRejectedValue(
      new ApiError('Mã ngành đã tồn tại trong hệ thống', 3021),
    )
    const u = userEvent.setup()

    renderWithClient(
      <MajorFormDialog
        open
        onOpenChange={vi.fn()}
        facultyName="Công nghệ thông tin"
        editingMajor={null}
        onSubmitSuccess={onSubmitSuccess}
      />,
    )

    await u.type(screen.getByPlaceholderText('KTPM'), 'CNTT')
    await u.type(screen.getByPlaceholderText('Ví dụ: Kỹ thuật phần mềm'), 'Công nghệ thông tin')
    await u.click(screen.getByRole('button', { name: 'Lưu' }))

    expect(await screen.findByText('Mã ngành đã tồn tại trong hệ thống')).toBeInTheDocument()
  })
})

describe('FacultyDetailView — Hiển thị danh sách ngành & Trưởng bộ môn', () => {
  const mockFaculty: Faculty = {
    id: 1,
    code: 'CNTT',
    name: 'Khoa Công nghệ thông tin',
    dean: 'PGS. TS. Trần Văn Trưởng',
    description: 'Khoa đào tạo CNTT mũi nhọn',
    status: 'active',
    majors: [
      {
        id: 1,
        code: 'KTPM',
        name: 'Kỹ thuật phần mềm',
        description: 'Chuyên ngành phát triển phần mềm',
        status: 'active',
        headTeacherId: 101,
        headFullName: 'TS. Nguyễn Văn A',
      },
      {
        id: 2,
        code: 'HTTT',
        name: 'Hệ thống thông tin',
        description: 'Chuyên ngành quản trị dữ liệu',
        status: 'active',
        headTeacherId: null,
        headFullName: null,
      },
    ],
  }

  it('hiển thị đầy đủ cột Mã ngành, Tên ngành và thông tin Trưởng bộ môn', async () => {
    renderWithClient(
      <FacultyDetailView
        faculty={mockFaculty}
        onEditFaculty={vi.fn()}
        onOpenAddMajor={vi.fn()}
        onEditMajor={vi.fn()}
      />,
    )

    // Kiểm tra tiêu đề bảng
    expect(screen.getByText('Mã ngành')).toBeInTheDocument()
    expect(screen.getByText('Trưởng bộ môn')).toBeInTheDocument()

    // Kiểm tra dữ liệu ngành 1 (đã có Trưởng bộ môn)
    expect(await screen.findByText('KTPM')).toBeInTheDocument()
    expect(screen.getByText('Kỹ thuật phần mềm')).toBeInTheDocument()
    expect(screen.getByText('TS. Nguyễn Văn A')).toBeInTheDocument()

    // Kiểm tra dữ liệu ngành 2 (chưa bổ nhiệm Trưởng bộ môn)
    expect(screen.getByText('HTTT')).toBeInTheDocument()
    expect(screen.getByText('Hệ thống thông tin')).toBeInTheDocument()
    expect(screen.getByText('Chưa bổ nhiệm')).toBeInTheDocument()
  })

  it('tìm kiếm theo tên Trưởng bộ môn hoặc mã ngành', async () => {
    const u = userEvent.setup()
    renderWithClient(
      <FacultyDetailView
        faculty={mockFaculty}
        onEditFaculty={vi.fn()}
        onOpenAddMajor={vi.fn()}
        onEditMajor={vi.fn()}
      />,
    )

    const searchInput = screen.getByPlaceholderText('Tìm theo mã ngành, tên ngành, trưởng bộ môn...')

    // Tìm theo tên Trưởng bộ môn "Nguyễn Văn A"
    await u.type(searchInput, 'Nguyễn Văn A')
    expect(screen.getByText('KTPM')).toBeInTheDocument()
    expect(screen.queryByText('HTTT')).not.toBeInTheDocument()

    // Xóa tìm kiếm và tìm theo mã ngành "HTTT"
    await u.clear(searchInput)
    await u.type(searchInput, 'HTTT')
    expect(screen.getByText('HTTT')).toBeInTheDocument()
    expect(screen.queryByText('KTPM')).not.toBeInTheDocument()
  })
})
