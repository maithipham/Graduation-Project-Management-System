import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { ApiError } from '@/shared/types'
import type { ScoreWeightConfig } from '@/features/department/score_management/types'

const toastMock = vi.hoisted(() => ({ success: vi.fn(), info: vi.fn(), warning: vi.fn(), error: vi.fn() }))
vi.mock('@/shared/components/feedback', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  toast: toastMock,
}))

// Giả lập tầng service (giống @MockBean): panel + hook chạy thật, chỉ thay phần gọi HTTP
const serviceMock = vi.hoisted(() => ({
  getList: vi.fn(),
  getDetail: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  getApplyPreview: vi.fn(),
  getCancelApplyPreview: vi.fn(),
  apply: vi.fn(),
  changeSemesterRange: vi.fn(),
  cancelApply: vi.fn(),
}))
vi.mock('@/features/department/score_management/services/scoreWeight.service', () => ({
  scoreWeightService: serviceMock,
}))

import { ScoreWeightPanel } from '@/features/department/score_management/components/ScoreWeightPanel'

const HK1 = { publicId: 's-1', name: 'Học kỳ 1 năm học 2026-2027' }

function config(overrides: Partial<ScoreWeightConfig> = {}): ScoreWeightConfig {
  return {
    publicId: 'w-draft',
    name: 'Trọng số nháp',
    advisorWeight: 40,
    examinerWeight: 30,
    councilWeight: 30,
    fromSemester: null,
    toSemester: null,
    displayStatus: 'DRAFT',
    displayStatusName: 'Nháp',
    version: 0,
    hasSubmittedSheets: false,
    canEdit: true,
    canApply: true,
    canChangeFromSemester: false,
    canChangeToSemester: false,
    canCancelApply: false,
    canDelete: true,
    createdByName: null,
    updatedByName: null,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  }
}

const ACTIVE = config({
  publicId: 'w-active',
  name: 'Trọng số đang dùng',
  fromSemester: HK1,
  displayStatus: 'ACTIVE',
  displayStatusName: 'Đang áp dụng',
  hasSubmittedSheets: true,
  canEdit: false,
  canApply: false,
  canChangeToSemester: true,
  canCancelApply: true,
  canDelete: false,
})

function renderPanel() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <ScoreWeightPanel />
    </QueryClientProvider>,
  )
  return { user: userEvent.setup() }
}

/** Dòng của bảng theo tên cấu hình */
async function findRow(name: string) {
  const cell = await screen.findByText(name)
  const row = cell.closest('tr')
  if (!row) throw new Error(`Không thấy dòng ${name}`)
  return within(row)
}

/** Mở menu "···" của dòng, trả tên các mục trong menu */
async function openMenu(user: ReturnType<typeof userEvent.setup>, name: string) {
  const row = await findRow(name)
  await user.click(row.getByRole('button', { name: 'Thao tác khác' }))
  const menu = screen.getByRole('menu')
  return within(menu)
    .getAllByRole('menuitem')
    .map((item) => item.textContent)
}

/** Mở menu "···" của dòng rồi chọn một thao tác */
async function chooseAction(user: ReturnType<typeof userEvent.setup>, name: string, label: string) {
  await openMenu(user, name)
  await user.click(screen.getByRole('menuitem', { name: label }))
}

describe('ScoreWeightPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    serviceMock.getList.mockResolvedValue([config(), ACTIVE])
  })

  it('menu "···" hiện thao tác theo cờ canXxx của BE', async () => {
    const { user } = renderPanel()
    expect(await openMenu(user, 'Trọng số nháp')).toEqual(['Sửa', 'Áp dụng', 'Xóa'])
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    expect(await openMenu(user, 'Trọng số đang dùng')).toEqual(['Sửa kỳ', 'Hủy áp dụng'])
    // Có cấu hình đang áp dụng → không hiện cảnh báo
    expect(screen.queryByText(/Chưa có cấu hình trọng số nào đang áp dụng/)).not.toBeInTheDocument()
  })

  it('cảnh báo khi chưa có cấu hình nào đang áp dụng', async () => {
    serviceMock.getList.mockResolvedValue([config()])
    renderPanel()
    expect(await screen.findByText(/Chưa có cấu hình trọng số nào đang áp dụng/)).toBeInTheDocument()
  })

  it('tạo mới: chặn khi tổng khác 100, đúng 100 thì gọi W3', async () => {
    serviceMock.create.mockResolvedValue('w-new')
    const { user } = renderPanel()
    await user.click(screen.getByRole('button', { name: 'Tạo mới' }))

    await user.type(screen.getByLabelText(/Tên cấu hình/), 'Trọng số K67')
    await user.type(screen.getByLabelText(/Hướng dẫn/), '40')
    await user.type(screen.getByLabelText(/Phản biện/), '30')
    await user.type(screen.getByLabelText(/Hội đồng/), '20')
    expect(screen.getByTestId('score-weight-total')).toHaveTextContent('90% / 100%')

    await user.click(screen.getByRole('button', { name: 'Tạo cấu hình' }))
    expect(await screen.findByText('Tổng trọng số 3 đầu điểm phải bằng 100%')).toBeInTheDocument()
    expect(serviceMock.create).not.toHaveBeenCalled()

    await user.clear(screen.getByLabelText(/Hội đồng/))
    await user.type(screen.getByLabelText(/Hội đồng/), '30')
    await user.click(screen.getByRole('button', { name: 'Tạo cấu hình' }))
    await waitFor(() =>
      expect(serviceMock.create).toHaveBeenCalledWith({
        name: 'Trọng số K67',
        advisorWeight: 40,
        examinerWeight: 30,
        councilWeight: 30,
      }),
    )
    expect(toastMock.success).toHaveBeenCalledWith('Đã tạo cấu hình Trọng số K67')
  })

  it('sửa: tải W2 và gửi version mới nhất, không dùng version của danh sách', async () => {
    serviceMock.getDetail.mockResolvedValue(config({ name: 'Tên mới từ W2', version: 7 }))
    serviceMock.update.mockResolvedValue(undefined)
    const { user } = renderPanel()
    await chooseAction(user, 'Trọng số nháp', 'Sửa')

    expect(await screen.findByDisplayValue('Tên mới từ W2')).toBeInTheDocument()
    expect(serviceMock.getDetail).toHaveBeenCalledWith('w-draft')
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    await waitFor(() =>
      expect(serviceMock.update).toHaveBeenCalledWith('w-draft', {
        name: 'Tên mới từ W2',
        advisorWeight: 40,
        examinerWeight: 30,
        councilWeight: 30,
        version: 7,
      }),
    )
  })

  it('sửa lỗi 3133: hiện lỗi + nút tải lại, tải xong gửi version mới', async () => {
    serviceMock.getDetail
      .mockResolvedValueOnce(config({ version: 1 }))
      .mockResolvedValueOnce(config({ advisorWeight: 50, examinerWeight: 25, councilWeight: 25, version: 2 }))
    serviceMock.update
      .mockRejectedValueOnce(new ApiError('Cấu hình đã được người khác cập nhật', 3133, undefined, 409))
      .mockResolvedValueOnce(undefined)
    const { user } = renderPanel()
    await chooseAction(user, 'Trọng số nháp', 'Sửa')
    await user.click(await screen.findByRole('button', { name: 'Lưu thay đổi' }))

    expect(await screen.findByText('Cấu hình đã được người khác cập nhật')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tải dữ liệu mới nhất' }))

    expect(await screen.findByDisplayValue('50')).toBeInTheDocument()
    expect(screen.queryByText('Cấu hình đã được người khác cập nhật')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    await waitFor(() =>
      expect(serviceMock.update).toHaveBeenLastCalledWith('w-draft', expect.objectContaining({ version: 2 })),
    )
  })

  it('sửa: W2 cho biết đã khóa (canEdit=false) → khóa form', async () => {
    serviceMock.getDetail.mockResolvedValue(config({ canEdit: false, hasSubmittedSheets: true }))
    const { user } = renderPanel()
    await chooseAction(user, 'Trọng số nháp', 'Sửa')

    expect(await screen.findByText(/Cấu hình này không còn sửa được/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeDisabled()
    expect(screen.getByLabelText(/Tên cấu hình/)).toBeDisabled()
  })

  it('hủy áp dụng: W6b lỗi → khóa nút xác nhận', async () => {
    serviceMock.getCancelApplyPreview.mockRejectedValue(
      new ApiError('Cấu hình không ở trạng thái áp dụng', 3138, undefined, 409),
    )
    const { user } = renderPanel()
    await chooseAction(user, 'Trọng số đang dùng', 'Hủy áp dụng')

    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText(/Cấu hình không ở trạng thái áp dụng/)).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Hủy áp dụng' })).toBeDisabled()
    expect(serviceMock.cancelApply).not.toHaveBeenCalled()
  })

  it('hủy áp dụng: W6b xong thì liệt kê học kỳ bị ảnh hưởng và cho xác nhận W9', async () => {
    serviceMock.getCancelApplyPreview.mockResolvedValue({ assignedSemesters: [], releasedSemesters: [HK1] })
    serviceMock.cancelApply.mockResolvedValue(undefined)
    const { user } = renderPanel()
    await chooseAction(user, 'Trọng số đang dùng', 'Hủy áp dụng')

    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText(/Học kỳ 1 năm học 2026-2027/)).toBeInTheDocument()
    const confirm = within(dialog).getByRole('button', { name: 'Hủy áp dụng' })
    expect(confirm).toBeEnabled()
    await user.click(confirm)
    await waitFor(() => expect(serviceMock.cancelApply).toHaveBeenCalledWith('w-active'))
    expect(toastMock.success).toHaveBeenCalledWith(
      'Đã hủy áp dụng Trọng số đang dùng, cấu hình trở về bản nháp',
    )
  })
})
