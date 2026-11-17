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
  changeEffectiveFrom: vi.fn(),
  cancelApply: vi.fn(),
  getSemesterRubrics: vi.fn(),
  changeSemesterRubric: vi.fn(),
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

function summary(overrides: Partial<EvaluationTemplateSummary> = {}): EvaluationTemplateSummary {
  return {
    publicId: 't-active',
    name: 'Rubric HD 2026',
    type: 'ADVISOR',
    effectiveFrom: '01-01-2026',
    effectiveTo: null,
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
  effectiveFrom: null,
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
    effectiveFrom: null,
    effectiveTo: null,
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
    canChangeEffectiveFrom: false,
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
    effectiveFrom: '01-01-2026',
    effectiveTo: null,
    displayStatus: 'ACTIVE',
    displayStatusName: 'Đang áp dụng',
    canChange: true,
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
        effectiveFrom: '01-01-2026',
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

  it('thẻ học kỳ (B1) hiện rubric đang gán; đổi rubric (B2) chỉ cho chọn rubric đã áp dụng', async () => {
    serviceMock.getList.mockImplementation(async () => [
      summary(),
      DRAFT,
      summary({ publicId: 't-next', name: 'Rubric HD 2027', displayStatus: 'SCHEDULED', displayStatusName: 'Sắp áp dụng' }),
    ])
    serviceMock.changeSemesterRubric.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()

    const card = within(await screen.findByRole('region', { name: 'Rubric áp dụng cho học kỳ' }))
    expect(await card.findByRole('button', { name: 'Rubric HD 2026' })).toBeInTheDocument()
    expect(serviceMock.getSemesterRubrics).toHaveBeenCalledWith('s-1')

    await user.click(card.getByRole('button', { name: /Đổi rubric cho kỳ này/ }))
    const dialog = within(await screen.findByRole('dialog'))
    // Bản nháp và rubric đang gán không có trong danh sách chọn
    expect(dialog.queryByText('Rubric HD nháp')).not.toBeInTheDocument()
    expect(dialog.getAllByRole('radio')).toHaveLength(1)

    await user.click(dialog.getByRole('radio'))
    await user.click(dialog.getByRole('button', { name: 'Xác nhận đổi' }))

    await waitFor(() =>
      expect(serviceMock.changeSemesterRubric).toHaveBeenCalledWith('s-1', {
        evaluationType: 'ADVISOR',
        templatePublicId: 't-next',
      }),
    )
    expect(toastMock.success).toHaveBeenCalledWith(
      'Đã đổi rubric Hướng dẫn của Học kỳ 1 năm học 2026-2027 sang Rubric HD 2027.',
    )
  })

  it('học kỳ đã có phiếu chấm (canChange = false) thì mở popup không thể đổi', async () => {
    serviceMock.getSemesterRubrics.mockResolvedValue([semesterRow({ canChange: false })])
    serviceMock.clone.mockResolvedValue('t-copy')
    const user = userEvent.setup()
    renderPage()

    const card = within(await screen.findByRole('region', { name: 'Rubric áp dụng cho học kỳ' }))
    await card.findByRole('button', { name: 'Rubric HD 2026' })
    await user.click(card.getByRole('button', { name: /Đổi rubric cho kỳ này/ }))

    const dialog = within(await screen.findByRole('dialog'))
    expect(dialog.getByText('Không thể đổi rubric')).toBeInTheDocument()
    await user.click(dialog.getByRole('button', { name: /Nhân bản để áp dụng kỳ sau/ }))
    await waitFor(() => expect(serviceMock.clone).toHaveBeenCalledWith('t-active'))
    expect(serviceMock.changeSemesterRubric).not.toHaveBeenCalled()
  })
})
