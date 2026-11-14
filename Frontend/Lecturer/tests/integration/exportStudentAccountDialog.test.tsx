import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ExportStudentAccountDialog } from '@/features/admin/account_management/components/ExportStudentAccountDialog'
import { accountService } from '@/features/admin/account_management/services/account.service'
import type { StudentAccountExportParams } from '@/features/admin/account_management/types/account.types'
import * as utils from '@/shared/utils'

const majors = [{ publicId: 'm-1', code: '7480103', name: 'Kỹ thuật phần mềm' }]

function renderDialog(filters: StudentAccountExportParams, filteredCount?: number) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <ExportStudentAccountDialog
        open
        onOpenChange={() => {}}
        filters={filters}
        majors={majors}
        filteredCount={filteredCount}
      />
    </QueryClientProvider>,
  )
}

const filteredOption = () => screen.getByRole('radio', { name: /Export theo bộ lọc/ })
const allOption = () => screen.getByRole('radio', { name: /Export toàn bộ danh sách/ })
const exportButton = () => screen.getByRole('button', { name: 'Export' })

function mockExport() {
  vi.spyOn(utils, 'saveBlob').mockImplementation(() => {})
  return vi
    .spyOn(accountService, 'exportStudentAccounts')
    .mockResolvedValue({ blob: new Blob(['x']), filename: 'danh_sach.xlsx' })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ExportStudentAccountDialog', () => {
  it('chưa lọc gì: mặc định chọn "toàn bộ danh sách"', () => {
    renderDialog({})
    expect(allOption()).toBeChecked()
    expect(screen.getByText(/Chưa áp dụng bộ lọc nào/)).toBeInTheDocument()
  })

  it('đang lọc: mặc định "theo bộ lọc", hiện bộ lọc + số sinh viên và gửi đúng tham số', async () => {
    const exportFn = mockExport()
    const filters = { keyword: 'đức', batch: 'K64', majorId: 'm-1', status: false }
    renderDialog(filters, 12)

    expect(filteredOption()).toBeChecked()
    expect(screen.getByText('Bộ môn: Kỹ thuật phần mềm')).toBeInTheDocument()
    expect(screen.getByText('Trạng thái: Không hoạt động')).toBeInTheDocument()
    expect(screen.getByText('12 sinh viên')).toBeInTheDocument()

    await userEvent.click(exportButton())
    expect(exportFn.mock.calls[0][0]).toEqual(filters)
  })

  it('chọn "toàn bộ danh sách" thì không gửi tham số lọc nào', async () => {
    const exportFn = mockExport()
    renderDialog({ batch: 'K64' }, 3)

    await userEvent.click(allOption())
    await userEvent.click(exportButton())
    expect(exportFn.mock.calls[0][0]).toEqual({})
  })

  it('bộ lọc không khớp ai: chặn export theo bộ lọc', () => {
    renderDialog({ batch: 'K99' }, 0)
    expect(screen.getByText(/không thể export file rỗng/)).toBeInTheDocument()
    expect(exportButton()).toBeDisabled()
  })
})
