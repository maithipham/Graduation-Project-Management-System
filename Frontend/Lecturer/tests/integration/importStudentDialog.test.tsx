import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ImportStudentDialog } from '@/features/department/student_management/components/ImportStudentDialog'
import { studentService } from '@/features/department/student_management/services/student.service'
import { ApiError } from '@/shared/types'

function renderDialog() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <ImportStudentDialog open onOpenChange={() => {}} />
    </QueryClientProvider>,
  )
}

function fileInput() {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')
  if (!input) throw new Error('Không thấy ô chọn file')
  return input
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ImportStudentDialog — bỏ chọn file', () => {
  // applyAccept: false để chọn được file .csv như người dùng kéo thả vào
  const user = () => userEvent.setup({ applyAccept: false })

  it('file sai định dạng: bấm "x" xóa file và dòng lỗi, chọn lại được file mới', async () => {
    const u = user()
    renderDialog()

    await u.upload(fileInput(), new File(['a,b'], 'A02_sai_dinh_dang_csv.csv', { type: 'text/csv' }))
    expect(await screen.findByText('File import phải có định dạng .xlsx')).toBeInTheDocument()

    await u.click(screen.getByRole('button', { name: 'Bỏ chọn file' }))

    expect(screen.queryByText('A02_sai_dinh_dang_csv.csv')).not.toBeInTheDocument()
    expect(screen.queryByText('File import phải có định dạng .xlsx')).not.toBeInTheDocument()
    expect(screen.getByText('Bấm để chọn file')).toBeInTheDocument()

    await u.upload(fileInput(), new File(['x'], 'sinh_vien.xlsx'))
    expect(screen.getByText('sinh_vien.xlsx')).toBeInTheDocument()
  })

  it('backend báo lỗi cả file: bấm "x" xóa được lỗi đó', async () => {
    vi.spyOn(studentService, 'importStudents').mockRejectedValue(
      new ApiError('File import không đúng mẫu', 4000, undefined, 400),
    )
    const u = user()
    renderDialog()

    await u.upload(fileInput(), new File(['x'], 'sai_mau.xlsx'))
    await u.click(screen.getByRole('button', { name: 'Import' }))
    expect(await screen.findByText('File import không đúng mẫu')).toBeInTheDocument()

    await u.click(screen.getByRole('button', { name: 'Bỏ chọn file' }))

    expect(screen.queryByText('sai_mau.xlsx')).not.toBeInTheDocument()
    expect(screen.queryByText('File import không đúng mẫu')).not.toBeInTheDocument()
  })
})
