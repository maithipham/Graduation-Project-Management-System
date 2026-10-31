import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { EditStudentAccountDialog } from '@/features/admin/account_management/components/EditStudentAccountDialog'
import { accountService } from '@/features/admin/account_management/services/account.service'
import {
  useCreateStudentAccount,
  useImportStudentAccounts,
} from '@/features/admin/account_management/hooks/useAccounts'
import type {
  StudentAccountDetail,
  StudentAccountItem,
} from '@/features/admin/account_management/types/account.types'
import { ImportStudentDialog } from '@/features/department/student_management/components/ImportStudentDialog'
import { studentService } from '@/features/department/student_management/services/student.service'
import { ApiError } from '@/shared/types'

const detail: StudentAccountDetail = {
  publicId: 'sv-1',
  studentCode: '2251172489',
  name: 'Lê Trung Đức',
  email: '2251172489@gmail.com',
  phone: '0911111111',
  className: '64KTPM1',
  batch: 'K64',
  majorName: 'Kỹ thuật phần mềm',
  accountStatus: true,
}
const row: StudentAccountItem = { ...detail }

function renderWithClient(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  vi.spyOn(studentService, 'getMajors').mockResolvedValue([
    { publicId: 'm-1', code: '7480103', name: 'Kỹ thuật phần mềm' },
    { publicId: 'm-2', code: '7480104', name: 'Hệ thống thông tin' },
  ])
  vi.spyOn(accountService, 'getStudentAccountDetail').mockResolvedValue(detail)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('EditStudentAccountDialog (PUT /student/account/{publicId})', () => {
  it('điền sẵn form từ chi tiết, tách họ tên; không đổi công tắc thì không gửi accountStatus', async () => {
    const update = vi
      .spyOn(accountService, 'updateStudentAccount')
      .mockResolvedValue({ code: 1000, message: 'Đã cập nhật: Ngành' })
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderWithClient(<EditStudentAccountDialog student={row} onClose={onClose} />)

    expect(await screen.findByDisplayValue('Lê Trung')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Đức')).toBeInTheDocument()

    await user.selectOptions(screen.getByRole('combobox'), 'Hệ thống thông tin')
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        publicId: 'sv-1',
        body: {
          studentCode: '2251172489',
          firstName: 'Lê Trung',
          lastName: 'Đức',
          email: '2251172489@gmail.com',
          phone: '0911111111',
          batch: 'K64',
          className: '64KTPM1',
          major: 'Hệ thống thông tin',
        },
      }),
      expect.anything(),
    )
    expect(onClose).toHaveBeenCalled()
  })

  it('tắt công tắc "Hoạt động" → gửi accountStatus: false', async () => {
    const update = vi
      .spyOn(accountService, 'updateStudentAccount')
      .mockResolvedValue({ code: 1000, message: 'Đã cập nhật: Trạng thái tài khoản' })
    const user = userEvent.setup()
    renderWithClient(<EditStudentAccountDialog student={row} onClose={() => {}} />)

    const toggle = await screen.findByRole('switch', { name: 'Hoạt động' })
    expect(toggle).toBeChecked()
    await user.click(toggle)
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    expect(update.mock.calls[0][0].body.accountStatus).toBe(false)
  })

  it('lỗi 3033 (đổi ngành khi đang làm đồ án) hiện trong form, không đóng popup', async () => {
    vi.spyOn(accountService, 'updateStudentAccount').mockRejectedValue(
      new ApiError('Sinh viên đang làm đồ án, không thể đổi ngành', 3033, undefined, 409),
    )
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderWithClient(<EditStudentAccountDialog student={row} onClose={onClose} />)

    await screen.findByDisplayValue('Lê Trung')
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Sinh viên đang làm đồ án, không thể đổi ngành',
    )
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('Import tài khoản sinh viên (Admin)', () => {
  it('gọi POST /student/account/import, kết quả chỉ có tab Lỗi / Thành công', async () => {
    const adminImport = vi.spyOn(accountService, 'importStudentAccounts').mockResolvedValue({
      totalRows: 2,
      successCount: 1,
      warningCount: 0,
      errorCount: 1,
      rowResults: [
        { ...importRow, rowNumber: 2, status: 'SUCCESS', message: 'Tạo tài khoản sinh viên thành công' },
        { ...importRow, rowNumber: 3, status: 'ERROR', message: 'Email trùng với tài khoản đã tồn tại trong hệ thống' },
      ],
    })
    const departmentImport = vi.spyOn(studentService, 'importStudents')
    const user = userEvent.setup()
    renderWithClient(
      <ImportStudentDialog
        open
        onOpenChange={() => {}}
        useImport={useImportStudentAccounts}
        useCreate={useCreateStudentAccount}
        resultStatuses={['ERROR', 'SUCCESS']}
      />,
    )

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')
    if (!input) throw new Error('Không thấy ô chọn file')
    await user.upload(input, new File(['x'], 'tai_khoan.xlsx'))
    await user.click(screen.getByRole('button', { name: 'Xác nhận Import' }))

    expect(await screen.findByText('Kết quả import sinh viên')).toBeInTheDocument()
    expect(adminImport).toHaveBeenCalled()
    expect(departmentImport).not.toHaveBeenCalled()
    expect(screen.getByRole('tab', { name: /Lỗi/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Thành công/ })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: /Cảnh báo/ })).not.toBeInTheDocument()
  })
})

const importRow = {
  studentCode: '2251172489',
  firstName: 'Lê Trung',
  lastName: 'Đức',
  email: '2251172489@gmail.com',
  phone: '0911111111',
  batch: 'K64',
  className: '64KTPM1',
  majorName: 'Kỹ thuật phần mềm',
}
