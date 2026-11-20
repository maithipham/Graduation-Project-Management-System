import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { ApiError } from '@/shared/types'
import type {
  EvaluationTemplateDetail,
  EvaluationTemplateSummary,
  SemesterEvaluationTemplate,
} from '@/features/department/score_management/types'

const toastMock = vi.hoisted(() => ({ success: vi.fn(), info: vi.fn(), warning: vi.fn(), error: vi.fn() }))
vi.mock('@/shared/components/feedback', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  toast: toastMock,
}))

// Giả lập tầng service (giống @MockBean): trang + hook chạy thật, chỉ thay phần gọi HTTP
const serviceMock = vi.hoisted(() => ({
  getList: vi.fn(),
  getDetail: vi.fn(),
  create: vi.fn(),
  clone: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
  getApplyPreview: vi.fn(),
  apply: vi.fn(),
  changeSemesterRange: vi.fn(),
  cancelApply: vi.fn(),
  getSemesterRubrics: vi.fn(),
  getCancelApplyPreview: vi.fn(),
  getSemesterOptions: vi.fn(),
}))
vi.mock('@/features/department/score_management/services/rubric.service', () => ({ rubricService: serviceMock }))

// Dropdown học kỳ: cố định 1 học kỳ để không phải gọi API học kỳ của feature khác
vi.mock('@/features/department/lecturer_management', () => {
  const semester = {
    publicId: 's-1',
    name: 'Học kỳ 1 năm học 2026-2027',
    academicYear: '2026-2027',
    term: 'Học kỳ 1',
    startDate: '01-09-2026',
    endDate: '15-01-2027',
  }
  return {
    useSemesterScope: () => ({
      semesters: [semester],
      academicYears: ['2026-2027'],
      termsOfYear: [semester],
      selectedYear: '2026-2027',
      selectedSemesterId: 's-1',
      activeSemesterId: 's-1',
      activeSemester: semester,
      currentSemester: semester,
      isLoading: false,
      onYearChange: vi.fn(),
      onSemesterChange: vi.fn(),
    }),
  }
})

import GradingConfigPage from '@/features/department/score_management/pages/GradingConfigPage'

const HK1 = { publicId: 's-1', name: 'Học kỳ 1 năm học 2026-2027' }

function summary(overrides: Partial<EvaluationTemplateSummary> = {}): EvaluationTemplateSummary {
  return {
    publicId: 't-active',
    name: 'Rubric HD 2026',
    type: 'ADVISOR',
    fromSemester: HK1,
    toSemester: null,
    displayStatus: 'ACTIVE',
    displayStatusName: 'Đang áp dụng',
    totalWeight: 100,
    criteriaCount: 2,
    isValid: true,
    semesterCount: 2,
    sheetCount: 37,
    canDelete: false,
    updatedByName: 'Nguyễn Văn A',
    updatedAt: '10-01-2026 08:30:00',
    ...overrides,
  }
}

const DRAFT = summary({
  publicId: 't-draft',
  name: 'Rubric HD nháp',
  fromSemester: null,
  displayStatus: 'DRAFT',
  displayStatusName: 'Nháp',
  totalWeight: 60,
  isValid: false,
  semesterCount: 0,
  sheetCount: 0,
  canDelete: true,
})

function detail(overrides: Partial<EvaluationTemplateDetail> = {}): EvaluationTemplateDetail {
  return {
    publicId: 't-draft',
    name: 'Rubric HD nháp',
    type: 'ADVISOR',
    fromSemester: null,
    toSemester: null,
    displayStatus: 'DRAFT',
    displayStatusName: 'Nháp',
    version: 3,
    totalWeight: 100,
    criteriaCount: 2,
    semesterCount: 0,
    sheetCount: 0,
    canEdit: true,
    canApply: true,
    applyBlockedReason: null,
    canChangeFromSemester: false,
    canChangeToSemester: false,
    canCancelApply: false,
    canDelete: true,
    createdByName: 'Nguyễn Văn A',
    updatedByName: null,
    createdAt: '05-01-2026 09:00:00',
    updatedAt: null,
    groups: [
      {
        publicId: 'g-1',
        displayOrder: 1,
        name: 'Thái độ',
        totalWeight: 100,
        maxScore: 10,
        criteria: [
          { publicId: 'c-1', displayOrder: 1, name: 'Chuyên cần', weight: 40, maxScore: 4 },
          { publicId: 'c-2', displayOrder: 2, name: 'Chủ động', weight: 60, maxScore: 6 },
        ],
      },
    ],
    ...overrides,
  }
}

function semesterRow(overrides: Partial<SemesterEvaluationTemplate> = {}): SemesterEvaluationTemplate {
  return {
    evaluationType: 'ADVISOR',
    evaluationTypeName: 'Hướng dẫn',
    templatePublicId: 't-active',
    templateName: 'Rubric HD 2026',
    fromSemester: HK1,
    toSemester: null,
    displayStatus: 'ACTIVE',
    displayStatusName: 'Đang áp dụng',
    ...overrides,
  }
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return render(<GradingConfigPage />, { wrapper })
}

async function findTable() {
  return within(await screen.findByRole('table'))
}

describe('GradingConfigPage (nối API)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    serviceMock.getList.mockImplementation(async (type: string) =>
      type === 'ADVISOR' ? [summary(), DRAFT] : [summary({ publicId: 't-pb', name: 'Rubric PB 2026', type: 'EXAMINER' })],
    )
    serviceMock.getSemesterRubrics.mockResolvedValue([semesterRow()])
    serviceMock.getDetail.mockResolvedValue(detail())
    serviceMock.getSemesterOptions.mockResolvedValue([
      { publicId: 's-0', name: 'HK2 2025-2026', startDate: '01-02-2026', endDate: '30-06-2026', status: 'Đã kết thúc', statusCode: 'COMPLETED' },
      { ...HK1, startDate: '01-09-2026', endDate: '15-01-2027', status: 'Đang diễn ra', statusCode: 'ONGOING' },
      { publicId: 's-2', name: 'HK2 2026-2027', startDate: '01-02-2027', endDate: '30-06-2027', status: 'Sắp diễn ra', statusCode: 'UPCOMING' },
    ])
  })

  it('hiển thị kho rubric theo tab (A1) và đổi tab gọi đúng loại phiếu', async () => {
    const user = userEvent.setup()
    renderPage()

    const table = await findTable()
    expect(await table.findByRole('button', { name: 'Rubric HD 2026' })).toBeInTheDocument()
    expect(table.getByText('2 học kỳ · 37 phiếu chấm')).toBeInTheDocument()
    expect(table.getByRole('img', { name: /Tổng trọng số \(60%\) chưa đạt 100%/ })).toBeInTheDocument()
    expect(serviceMock.getList).toHaveBeenCalledWith('ADVISOR')

    await user.click(screen.getByRole('tab', { name: 'Phản biện' }))
    expect(await table.findByRole('button', { name: 'Rubric PB 2026' })).toBeInTheDocument()
    expect(serviceMock.getList).toHaveBeenCalledWith('EXAMINER')
  })

  it('tạo bản nháp (A3): báo lỗi tên trống, tạo xong mở luôn chi tiết', async () => {
    serviceMock.create.mockResolvedValue('t-new')
    serviceMock.getDetail.mockResolvedValue(detail({ publicId: 't-new', name: 'Rubric thử', groups: [] }))
    const user = userEvent.setup()
    renderPage()
    await findTable()

    await user.click(screen.getByRole('button', { name: /Tạo mới/ }))
    await user.click(screen.getByRole('button', { name: 'Lưu' }))
    expect(screen.getByText('Tên rubric không được để trống')).toBeInTheDocument()
    expect(serviceMock.create).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText('Tên mẫu rubric mới'), '  Rubric thử {Enter}')
    await waitFor(() => expect(serviceMock.create).toHaveBeenCalledWith({ type: 'ADVISOR', name: 'Rubric thử' }))
    expect(toastMock.success).toHaveBeenCalledWith('Đã tạo bản nháp Rubric thử')
    expect(await screen.findByLabelText('Tên mẫu rubric')).toHaveValue('Rubric thử')
    expect(serviceMock.getDetail).toHaveBeenCalledWith('t-new')
  })

  it('tạo bản nháp bị BE từ chối thì hiện lỗi ngay dưới ô tên', async () => {
    serviceMock.create.mockRejectedValue(new ApiError('Tên rubric đã tồn tại', 3102, undefined, 409))
    const user = userEvent.setup()
    renderPage()
    await findTable()

    await user.click(screen.getByRole('button', { name: /Tạo mới/ }))
    await user.type(screen.getByLabelText('Tên mẫu rubric mới'), 'Rubric HD 2026{Enter}')
    expect(await screen.findByText('Tên rubric đã tồn tại')).toBeInTheDocument()
    expect(toastMock.error).not.toHaveBeenCalled()
  })

  it('sửa tiêu chí của bản nháp rồi lưu (A5) gửi đủ cây kèm version', async () => {
    serviceMock.save.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()
    const table = await findTable()

    await user.click(await table.findByRole('button', { name: 'Rubric HD nháp' }))
    const dialog = await screen.findByRole('dialog')
    const saveButton = await within(dialog).findByRole('button', { name: 'Lưu' })
    expect(saveButton).toBeDisabled()

    const criterionName = within(dialog).getByLabelText('Tên tiêu chí 1.1')
    await user.clear(criterionName)
    await user.type(criterionName, 'Đi đủ buổi')
    await user.click(saveButton)

    await waitFor(() =>
      expect(serviceMock.save).toHaveBeenCalledWith('t-draft', {
        name: 'Rubric HD nháp',
        version: 3,
        groups: [
          {
            publicId: 'g-1',
            name: 'Thái độ',
            criteria: [
              { publicId: 'c-1', name: 'Đi đủ buổi', weight: 40 },
              { publicId: 'c-2', name: 'Chủ động', weight: 60 },
            ],
          },
        ],
      }),
    )
    expect(toastMock.success).toHaveBeenCalledWith('Đã lưu các thay đổi của rubric')
  })

  it('lưu bị lỗi kiểm tra ở FE thì không gọi API', async () => {
    const user = userEvent.setup()
    renderPage()
    const table = await findTable()

    await user.click(await table.findByRole('button', { name: 'Rubric HD nháp' }))
    const dialog = await screen.findByRole('dialog')
    await user.clear(await within(dialog).findByLabelText('Tên mẫu rubric'))
    await user.click(within(dialog).getByRole('button', { name: 'Lưu' }))

    expect(within(dialog).getByText('Tên rubric không được để trống')).toBeInTheDocument()
    expect(serviceMock.save).not.toHaveBeenCalled()
  })

  it('lưu gặp 3109 (người khác vừa sửa) thì hỏi rồi tải lại chi tiết', async () => {
    serviceMock.save.mockRejectedValue(new ApiError('Rubric đã được cập nhật', 3109, undefined, 409))
    const user = userEvent.setup()
    renderPage()
    const table = await findTable()

    await user.click(await table.findByRole('button', { name: 'Rubric HD nháp' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(await within(dialog).findByLabelText('Tên mẫu rubric'), ' mới')
    await user.click(within(dialog).getByRole('button', { name: 'Lưu' }))

    expect(await screen.findByText('Rubric vừa được người khác cập nhật')).toBeInTheDocument()
    const callsBefore = serviceMock.getDetail.mock.calls.length
    await user.click(screen.getByRole('button', { name: 'Tải lại' }))
    await waitFor(() => expect(serviceMock.getDetail.mock.calls.length).toBeGreaterThan(callsBefore))
  })

  it('rubric đã có phiếu chấm (canEdit = false) chỉ xem, không có nút Lưu', async () => {
    serviceMock.getDetail.mockResolvedValue(
      detail({
        publicId: 't-active',
        name: 'Rubric HD 2026',
        displayStatus: 'ACTIVE',
        displayStatusName: 'Đang áp dụng',
        fromSemester: HK1,
        canEdit: false,
        canApply: false,
        canDelete: false,
        semesterCount: 2,
        sheetCount: 37,
      }),
    )
    const user = userEvent.setup()
    renderPage()
    const table = await findTable()

    await user.click(await table.findByRole('button', { name: 'Rubric HD 2026' }))
    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText(/chỉ xem, không thể sửa/)).toBeInTheDocument()
    expect(within(dialog).getByText('Chuyên cần')).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: 'Lưu' })).not.toBeInTheDocument()
    expect(within(dialog).queryByLabelText('Tên tiêu chí 1.1')).not.toBeInTheDocument()
  })

  it('xóa bản nháp (A6) qua hộp xác nhận', async () => {
    serviceMock.remove.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()
    const table = await findTable()
    await table.findByRole('button', { name: 'Rubric HD nháp' })

    const draftRow = table.getByRole('button', { name: 'Rubric HD nháp' }).closest('tr') as HTMLElement
    await user.click(within(draftRow).getByRole('button', { name: 'Thao tác khác' }))
    await user.click(screen.getByRole('menuitem', { name: /Xóa/ }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Xóa' }))

    await waitFor(() => expect(serviceMock.remove).toHaveBeenCalledWith('t-draft'))
    expect(toastMock.success).toHaveBeenCalledWith('Đã xóa Rubric HD nháp')
  })

  it('bảng hiện khoảng kỳ áp dụng, bản nháp hiện "Chưa áp dụng"', async () => {
    renderPage()
    const table = await findTable()
    expect(await table.findByText('2026-2027 - Học kỳ 1')).toBeInTheDocument()
    const draftRow = table.getByRole('button', { name: 'Rubric HD nháp' }).closest('tr') as HTMLElement
    expect(within(draftRow).getAllByText('Chưa áp dụng').length).toBeGreaterThan(0)
  })

  it('thẻ học kỳ (B1) chỉ xem: hiện rubric + khoảng kỳ, bấm tên mở chi tiết', async () => {
    serviceMock.getDetail.mockResolvedValue(detail({ publicId: 't-active', name: 'Rubric HD 2026' }))
    const user = userEvent.setup()
    renderPage()

    const card = within(await screen.findByRole('region', { name: 'Rubric áp dụng cho học kỳ' }))
    expect(await card.findByRole('button', { name: 'Rubric HD 2026' })).toBeInTheDocument()
    expect(card.queryByText('(Học kỳ 1 năm học 2026-2027 → Chưa xác định)')).not.toBeInTheDocument()
    expect(serviceMock.getSemesterRubrics).toHaveBeenCalledWith('s-1')
    // Không còn đổi rubric thủ công ở thẻ học kỳ
    expect(card.queryByRole('button', { name: /Đổi rubric/ })).not.toBeInTheDocument()

    await user.click(card.getByRole('button', { name: 'Rubric HD 2026' }))
    await screen.findByRole('dialog')
    expect(serviceMock.getDetail).toHaveBeenCalledWith('t-active')
  })

  it('học kỳ chưa có rubric thì thẻ B1 nhắc áp dụng rubric', async () => {
    serviceMock.getSemesterRubrics.mockResolvedValue([{ evaluationType: 'ADVISOR', evaluationTypeName: 'Hướng dẫn' }])
    renderPage()

    expect(
      await screen.findByText(/Học kỳ này chưa có rubric Hướng dẫn\. Hãy áp dụng một rubric có khoảng kỳ chứa học kỳ này\./),
    ).toBeInTheDocument()
  })

  it('áp dụng bản nháp (A7 → A8): bỏ kỳ đã kết thúc, xem trước rồi gửi khoảng kỳ', async () => {
    serviceMock.getApplyPreview.mockResolvedValue({
      fromSemester: HK1,
      toSemester: null,
      assignedSemesters: [HK1],
      releasedSemesters: [],
    })
    serviceMock.apply.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()
    const table = await findTable()

    await user.click(await table.findByRole('button', { name: 'Rubric HD nháp' }))
    const detailDialog = within(await screen.findByRole('dialog'))
    await user.click(await detailDialog.findByRole('button', { name: 'Áp dụng' }))

    const applyDialog = within(
      (await screen.findByRole('heading', { name: 'Áp dụng rubric' })).closest('[role="dialog"]') as HTMLElement,
    )
    const fromSelect = await applyDialog.findByLabelText(/Từ kỳ/)
    // Kỳ đã kết thúc không có trong "Từ kỳ"
    expect(within(fromSelect).queryByText(/HK2 2025-2026/)).not.toBeInTheDocument()

    await user.selectOptions(fromSelect, 's-1')
    expect(await applyDialog.findByText(/Các học kỳ sẽ dùng rubric này/)).toHaveTextContent(
      'Các học kỳ sẽ dùng rubric này: Học kỳ 1 năm học 2026-2027',
    )
    expect(serviceMock.getApplyPreview).toHaveBeenCalledWith('t-draft', 's-1', null)

    await user.click(applyDialog.getByRole('button', { name: 'Xác nhận áp dụng' }))
    await waitFor(() =>
      expect(serviceMock.apply).toHaveBeenCalledWith('t-draft', { fromSemesterId: 's-1', toSemesterId: null }),
    )
    expect(toastMock.success).toHaveBeenCalledWith('Đã áp dụng Rubric HD nháp')
  })

  it('áp dụng bị BE từ chối (3125 trùng khoảng kỳ) thì hiện lỗi trong popup', async () => {
    serviceMock.getApplyPreview.mockResolvedValue({ assignedSemesters: [HK1], releasedSemesters: [] })
    serviceMock.apply.mockRejectedValue(
      new ApiError('Khoảng kỳ trùng với rubric "Rubric HD 2026"', 3125, undefined, 409),
    )
    const user = userEvent.setup()
    renderPage()
    const table = await findTable()

    await user.click(await table.findByRole('button', { name: 'Rubric HD nháp' }))
    await user.click(await within(await screen.findByRole('dialog')).findByRole('button', { name: 'Áp dụng' }))
    const applyDialog = within(
      (await screen.findByRole('heading', { name: 'Áp dụng rubric' })).closest('[role="dialog"]') as HTMLElement,
    )
    await user.selectOptions(await applyDialog.findByLabelText(/Từ kỳ/), 's-1')
    await user.click(await applyDialog.findByRole('button', { name: 'Xác nhận áp dụng' }))

    expect(await applyDialog.findByText('Khoảng kỳ trùng với rubric "Rubric HD 2026"')).toBeInTheDocument()
    expect(toastMock.success).not.toHaveBeenCalled()
    expect(toastMock.error).not.toHaveBeenCalled()
  })

  it('sửa kỳ khi đã có phiếu chấm: khóa "Từ kỳ", chỉ đổi "Đến kỳ" (A9)', async () => {
    serviceMock.getDetail.mockResolvedValue(
      detail({
        publicId: 't-active',
        name: 'Rubric HD 2026',
        displayStatus: 'ACTIVE',
        displayStatusName: 'Đang áp dụng',
        fromSemester: HK1,
        canEdit: false,
        canApply: false,
        canDelete: false,
        canChangeFromSemester: false,
        canChangeToSemester: true,
        semesterCount: 1,
        sheetCount: 5,
      }),
    )
    serviceMock.getApplyPreview.mockResolvedValue({ assignedSemesters: [], releasedSemesters: [] })
    serviceMock.changeSemesterRange.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()
    const table = await findTable()

    await user.click(await table.findByRole('button', { name: 'Rubric HD 2026' }))
    await user.click(await within(await screen.findByRole('dialog')).findByRole('button', { name: 'Sửa kỳ áp dụng' }))
    const changeDialog = within(
      (await screen.findByRole('heading', { name: 'Sửa kỳ áp dụng' })).closest('[role="dialog"]') as HTMLElement,
    )

    expect(await changeDialog.findByLabelText(/Từ kỳ/)).toBeDisabled()
    expect(changeDialog.getByText('Đã có phiếu chấm nên không đổi được')).toBeInTheDocument()
    // Chưa đổi gì thì chưa lưu được
    expect(changeDialog.getByRole('button', { name: 'Lưu kỳ áp dụng' })).toBeDisabled()

    await user.selectOptions(changeDialog.getByLabelText('Đến kỳ'), 's-2')
    await waitFor(() => expect(changeDialog.getByRole('button', { name: 'Lưu kỳ áp dụng' })).toBeEnabled())
    await user.click(changeDialog.getByRole('button', { name: 'Lưu kỳ áp dụng' }))

    await waitFor(() =>
      expect(serviceMock.changeSemesterRange).toHaveBeenCalledWith('t-active', {
        fromSemesterId: 's-1',
        toSemesterId: 's-2',
      }),
    )
    expect(toastMock.success).toHaveBeenCalledWith('Đã cập nhật kỳ áp dụng của Rubric HD 2026')
  })

  it('hủy áp dụng (A7b → A10) báo các học kỳ sẽ mất rubric rồi đưa về Nháp', async () => {
    serviceMock.getDetail.mockResolvedValue(
      detail({
        publicId: 't-next',
        name: 'Rubric HD 2027',
        displayStatus: 'SCHEDULED',
        displayStatusName: 'Sắp áp dụng',
        fromSemester: { publicId: 's-2', name: 'HK2 2026-2027' },
        canApply: false,
        canDelete: false,
        canChangeFromSemester: true,
        canChangeToSemester: true,
        canCancelApply: true,
      }),
    )
    serviceMock.getCancelApplyPreview.mockResolvedValue({ releasedSemesters: [{ publicId: 's-2', name: 'HK2 2026-2027' }] })
    serviceMock.cancelApply.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()
    const table = await findTable()

    await user.click(await table.findByRole('button', { name: 'Rubric HD nháp' }))
    await user.click(await within(await screen.findByRole('dialog')).findByRole('button', { name: 'Hủy áp dụng' }))

    expect(
      await screen.findByText(/Các học kỳ sau sẽ không còn rubric Hướng dẫn: HK2 2026-2027\. Bạn có chắc chắn\?/),
    ).toBeInTheDocument()
    expect(serviceMock.getCancelApplyPreview).toHaveBeenCalledWith('t-next')

    const confirmDialog = within(
      (await screen.findByRole('heading', { name: 'Hủy áp dụng rubric' })).closest('[role="dialog"]') as HTMLElement,
    )
    await user.click(confirmDialog.getByRole('button', { name: 'Hủy áp dụng' }))
    await waitFor(() => expect(serviceMock.cancelApply).toHaveBeenCalledWith('t-next'))
    expect(toastMock.success).toHaveBeenCalledWith('Đã hủy áp dụng Rubric HD 2027, rubric trở về bản nháp')
  })
})
