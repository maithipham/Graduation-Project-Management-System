import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ImportTeacherDialog } from '@/features/department/lecturer_management/components/ImportTeacherDialog'
import { teacherService } from '@/features/department/lecturer_management/services/teacher.service'
import type { TeacherImportResponse } from '@/features/department/lecturer_management/types'
import { studentService } from '@/features/department/student_management/services/student.service'
import { useToastStore } from '@/shared/components/feedback/toast.store'
import { ApiError } from '@/shared/types'

const MAJORS = [{ publicId: 'm1', code: '7480103', name: 'Kỹ thuật phần mềm' }]

const RESULT: TeacherImportResponse = {
  totalRows: 2,
  successCount: 1,
  warningCount: 0,
  errorCount: 1,
  rowResults: [
    {
      rowNumber: 2,
      firstName: 'Trần Thị',
      lastName: 'Bình',
      email: 'binh.tt@tlu.edu.vn',
      phone: '0911111111',
      organization: 'Trường Đại học Thủy lợi',
      majorName: 'Kỹ thuật phần mềm',
      amount: 20,
      status: 'SUCCESS',
      message: 'Thêm giáo viên thành công',
    },
    {
      rowNumber: 3,
      firstName: 'Nguyễn Văn',
      lastName: 'An',
      email: 'an.nv@tlu.edu.vn',
      phone: '0911111111',
      organization: 'Trường Đại học Thủy lợi',
      majorName: '7480103',
      amount: null,
      status: 'ERROR',
      message: 'Số điện thoại đã tồn tại',
    },
  ],
}

function renderDialog() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <ImportTeacherDialog open onOpenChange={() => {}} />
    </QueryClientProvider>,
  )
}

function fileInput() {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')
  if (!input) throw new Error('Không thấy ô chọn file')
  return input
}

// applyAccept: false để chọn được file .csv như người dùng kéo thả vào
const user = () => userEvent.setup({ applyAccept: false })

async function importFile(u: ReturnType<typeof userEvent.setup>, name = 'giao_vien.xlsx') {
  await u.upload(fileInput(), new File(['x'], name))
  await u.click(screen.getByRole('button', { name: 'Import' }))
}

beforeEach(() => {
  useToastStore.getState().clearAll()
  vi.spyOn(studentService, 'getMajors').mockResolvedValue(MAJORS)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ImportTeacherDialog — chọn file', () => {
  it('file sai định dạng: hiện lỗi, bấm "x" xóa file và lỗi', async () => {
    const u = user()
    renderDialog()

    await u.upload(fileInput(), new File(['a,b'], 'giao_vien.csv', { type: 'text/csv' }))
    expect(await screen.findByText('File import phải có định dạng .xlsx')).toBeInTheDocument()

    await u.click(screen.getByRole('button', { name: 'Bỏ chọn file' }))

    expect(screen.queryByText('giao_vien.csv')).not.toBeInTheDocument()
    expect(screen.queryByText('File import phải có định dạng .xlsx')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled()
  })

  it('backend báo lỗi cả file: lỗi hiện dưới ô chọn file, không toast', async () => {
    vi.spyOn(teacherService, 'importTeachers').mockRejectedValue(
      new ApiError('File import không đúng mẫu', 4000, undefined, 400),
    )
    const u = user()
    renderDialog()

    await importFile(u, 'sai_mau.xlsx')

    expect(await screen.findByText('File import không đúng mẫu')).toBeInTheDocument()
    expect(useToastStore.getState().toasts).toEqual([])
  })

  it('import toàn bộ thành công: toast xanh với số giáo viên', async () => {
    vi.spyOn(teacherService, 'importTeachers').mockResolvedValue({
      ...RESULT,
      totalRows: 1,
      errorCount: 0,
      rowResults: [RESULT.rowResults[0]],
    })
    const u = user()
    renderDialog()

    await importFile(u)

    expect(await screen.findByText('Kết quả import giáo viên')).toBeInTheDocument()
    expect(useToastStore.getState().toasts.map((t) => [t.type, t.message])).toEqual([
      ['success', 'Đã import thành công 1 giáo viên'],
    ])
  })
})

describe('ImportTeacherDialog — kết quả và sửa dòng lỗi', () => {
  it('mở tab Lỗi trước; sửa dòng rồi gửi lại thành công → dòng chuyển sang tab Thành công', async () => {
    vi.spyOn(teacherService, 'importTeachers').mockResolvedValue(RESULT)
    const create = vi
      .spyOn(teacherService, 'createTeacher')
      .mockResolvedValue({ code: 1000, message: 'Thêm giáo viên thành công' })
    const u = user()
    renderDialog()

    await importFile(u)

    expect(await screen.findByText('Số điện thoại đã tồn tại')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Lỗi/ })).toHaveAttribute('aria-selected', 'true')

    await u.click(screen.getByRole('button', { name: /Sửa/ }))

    // Excel ghi mã ngành → vẫn chọn sẵn, hiện kèm tên ngành
    const major = await screen.findByRole('option', { name: 'Kỹ thuật phần mềm (mã 7480103)' })
    expect((major as HTMLOptionElement).selected).toBe(true)

    const phone = screen.getByLabelText(/^Số điện thoại/)
    await u.clear(phone)
    await u.type(phone, '0922222222')
    await u.click(screen.getByRole('button', { name: /Gửi lại/ }))

    expect(await screen.findByText('Không còn dòng lỗi nào.')).toBeInTheDocument()
    expect(create.mock.calls[0][0]).toMatchObject({ phone: '0922222222', major: '7480103', amount: null })
    expect(within(screen.getByRole('tab', { name: /Thành công/ })).getByText('2')).toBeInTheDocument()
  })

  it('gửi lại vẫn lỗi: lý do mới hiện trong form và trên dòng, dòng giữ ở tab Lỗi', async () => {
    vi.spyOn(teacherService, 'importTeachers').mockResolvedValue(RESULT)
    vi.spyOn(teacherService, 'createTeacher').mockRejectedValue(
      new ApiError('Email đã tồn tại', 3006, undefined, 400),
    )
    const u = user()
    renderDialog()

    await importFile(u)
    await u.click(await screen.findByRole('button', { name: /Sửa/ }))
    await screen.findByRole('option', { name: 'Kỹ thuật phần mềm (mã 7480103)' })
    await u.click(screen.getByRole('button', { name: /Gửi lại/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email đã tồn tại')
    expect(screen.getAllByText('Email đã tồn tại')).toHaveLength(2)
    expect(screen.getByRole('tab', { name: /Lỗi/ })).toHaveAttribute('aria-selected', 'true')
  })

  it('ngành không có trong danh sách và có ngành chưa có mã (code null): mở form sửa không lỗi', async () => {
    vi.spyOn(studentService, 'getMajors').mockResolvedValue([
      { publicId: 'm2', code: null, name: 'Công nghệ thông tin' },
      ...MAJORS,
    ])
    const [, errorRow] = RESULT.rowResults
    vi.spyOn(teacherService, 'importTeachers').mockResolvedValue({
      ...RESULT,
      rowResults: [
        RESULT.rowResults[0],
        { ...errorRow, majorName: 'Khoa học máy tính', message: 'Ngành học không tồn tại trong hệ thống' },
      ],
    })
    const u = user()
    renderDialog()

    await importFile(u)
    await u.click(await screen.findByRole('button', { name: /Sửa/ }))

    const option = await screen.findByRole('option', { name: 'Khoa học máy tính (không có trong danh sách)' })
    expect((option as HTMLOptionElement).selected).toBe(true)
  })
})
