import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError } from '@/shared/types'
import type {
  AdvisorGradeSheet,
  AdvisorGradeTopic,
} from '@/features/lecturer/guiding_evaluation/types/advisorGrade.types'

const toastMock = vi.hoisted(() => ({ success: vi.fn(), info: vi.fn(), warning: vi.fn(), error: vi.fn() }))
vi.mock('@/shared/components/feedback', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  toast: toastMock,
}))

const serviceMock = vi.hoisted(() => ({
  getTopics: vi.fn(),
  openSheet: vi.fn(),
  getSheet: vi.fn(),
  saveDraft: vi.fn(),
  submit: vi.fn(),
}))
vi.mock('@/features/lecturer/guiding_evaluation/services/advisorGrade.service', () => ({
  advisorGradeService: serviceMock,
}))

import { AdvisorGradingDialog } from '@/features/lecturer/guiding_evaluation/components/AdvisorGradingDialog'

const deadline = { startDate: '2026-11-10T00:00:00', endDate: '2026-11-30T23:59:59', locked: false }

const topic = (over: Partial<AdvisorGradeTopic> = {}): AdvisorGradeTopic => ({
  topicPublicId: 't1',
  topicName: 'Hệ thống quản lý đồ án',
  studentCode: '2151060001',
  studentName: 'Nguyễn Văn A',
  className: '63CNTT1',
  topicStatus: 'IN_PROGRESS',
  currentStage: 'STAGE_4_REPORT_APPROVED',
  sheetPublicId: 'sh1',
  sheetStatus: 'DRAFT',
  gradedCount: 1,
  totalCriteria: 2,
  advisorScore: null,
  lockAt: '2026-11-30T23:59:59',
  canGrade: true,
  readonlyReason: null,
  ...over,
})

const sheet = (over: Partial<AdvisorGradeSheet> = {}): AdvisorGradeSheet => ({
  sheetPublicId: 'sh1',
  status: 'DRAFT',
  topic: { publicId: 't1', name: 'Hệ thống quản lý đồ án', status: 'IN_PROGRESS', currentStage: 'X' },
  student: { studentCode: '2151060001', fullName: 'Nguyễn Văn A', className: '63CNTT1', majorName: 'CNTT' },
  evaluator: { teacherCode: 'GV1', fullName: 'GV', academicTitle: null, organization: null },
  template: { publicId: 'tp1', name: 'Mẫu' },
  groups: [
    {
      publicId: 'g1',
      name: 'Nhóm 1',
      displayOrder: 1,
      weight: 100,
      criteria: [
        { publicId: 'c1', name: 'Chuyên cần', displayOrder: 1, weight: 40, maxScore: 4, score: 8 },
        { publicId: 'c2', name: 'Nội dung', displayOrder: 2, weight: 60, maxScore: 6, score: null },
      ],
    },
  ],
  generalComment: null,
  gradedCount: 1,
  totalCriteria: 2,
  totalScore: null,
  advisorScore: null,
  submittedAt: null,
  updatedAt: '2026-11-17T10:00:00',
  deadline,
  canEdit: true,
  readonlyReason: null,
  ...over,
})

function renderDialog(row: AdvisorGradeTopic = topic(), onClose = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  render(<AdvisorGradingDialog topic={row} onClose={onClose} />, { wrapper })
  return { onClose }
}

describe('AdvisorGradingDialog', () => {
  beforeEach(() => vi.clearAllMocks())

  it('popup đóng (topic null) → không gọi API', () => {
    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <AdvisorGradingDialog topic={null} onClose={vi.fn()} />
      </QueryClientProvider>,
    )
    expect(serviceMock.getSheet).not.toHaveBeenCalled()
    expect(serviceMock.openSheet).not.toHaveBeenCalled()
  })

  it('nạp điểm từ phiếu, điểm tạm tính cập nhật khi nhập', async () => {
    serviceMock.getSheet.mockResolvedValue(sheet())
    renderDialog()

    const c1 = await screen.findByLabelText('Điểm Chuyên cần')
    expect(c1).toHaveValue('8')
    // 8 * 40% = 3.2
    expect(screen.getByTestId('advisor-grade-score')).toHaveTextContent('3.2')

    await userEvent.type(screen.getByLabelText('Điểm Nội dung'), '10')
    // 3.2 + 6 = 9.2
    expect(screen.getByTestId('advisor-grade-score')).toHaveTextContent('9.2')
  })

  it('chưa có phiếu → gọi C2 mở phiếu', async () => {
    serviceMock.openSheet.mockResolvedValue(sheet())
    renderDialog(topic({ sheetPublicId: null, sheetStatus: 'NOT_STARTED' }))
    await screen.findByLabelText('Điểm Chuyên cần')
    expect(serviceMock.openSheet).toHaveBeenCalledWith('t1')
  })

  it('điểm sai định dạng → báo lỗi đỏ, không gọi lưu nháp', async () => {
    serviceMock.getSheet.mockResolvedValue(sheet())
    renderDialog()
    await userEvent.type(await screen.findByLabelText('Điểm Nội dung'), '11')
    expect(screen.getByText(/Điểm phải là số từ 0 đến 10/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Lưu nháp' }))
    expect(serviceMock.saveDraft).not.toHaveBeenCalled()
  })

  it('lưu nháp gửi đủ mọi tiêu chí', async () => {
    serviceMock.getSheet.mockResolvedValue(sheet())
    serviceMock.saveDraft.mockResolvedValue(undefined)
    renderDialog()
    await userEvent.type(await screen.findByLabelText('Điểm Nội dung'), '7.5')
    await userEvent.click(screen.getByRole('button', { name: 'Lưu nháp' }))
    await waitFor(() =>
      expect(serviceMock.saveDraft).toHaveBeenCalledWith('sh1', {
        generalComment: null,
        details: [
          { criteriaId: 'c1', score: 8 },
          { criteriaId: 'c2', score: 7.5 },
        ],
      }),
    )
  })

  it('nộp phiếu thiếu điểm / nhận xét → chặn ở FE, không gọi C5', async () => {
    serviceMock.getSheet.mockResolvedValue(sheet())
    renderDialog()
    await screen.findByLabelText('Điểm Chuyên cần')
    await userEvent.click(screen.getByRole('button', { name: 'Nộp phiếu' }))
    expect(screen.getByText(/Còn 1 tiêu chí chưa có điểm/)).toBeInTheDocument()
    expect(screen.getByText('Vui lòng nhập nhận xét chung trước khi nộp')).toBeInTheDocument()
    expect(screen.queryByText(/Xác nhận nộp\?/)).not.toBeInTheDocument()
    expect(serviceMock.submit).not.toHaveBeenCalled()
  })

  it('nộp phiếu đủ điều kiện → hỏi xác nhận rồi gọi C5, phiếu vẫn sửa được (nút "Nộp lại")', async () => {
    serviceMock.getSheet.mockResolvedValue(sheet())
    serviceMock.submit.mockResolvedValue(
      sheet({
        status: 'SUBMITTED',
        advisorScore: 8,
        totalScore: 8,
        submittedAt: '2026-11-18T09:00:00',
        generalComment: 'Tốt',
        groups: [
          {
            ...sheet().groups[0],
            criteria: sheet().groups[0].criteria.map((c) => ({ ...c, score: 8 })),
          },
        ],
      }),
    )
    renderDialog()
    await userEvent.type(await screen.findByLabelText('Điểm Nội dung'), '8')
    await userEvent.type(screen.getByLabelText(/Nhận xét chung/), 'Tốt')
    await userEvent.click(screen.getByRole('button', { name: 'Nộp phiếu' }))

    expect(screen.getByText(/Nộp phiếu sẽ ghi nhận điểm hướng dẫn\. Bạn vẫn sửa được đến .*30\/11\/2026/)).toBeInTheDocument()
    expect(serviceMock.submit).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Xác nhận nộp' }))

    await waitFor(() => expect(serviceMock.submit).toHaveBeenCalledTimes(1))
    expect(await screen.findByText(/^Đã nộp phiếu chấm\. Bạn vẫn sửa được đến/)).toBeInTheDocument()
    expect(screen.getByLabelText('Điểm Chuyên cần')).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Nộp phiếu' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Lưu nháp' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nộp lại' })).toBeInTheDocument()
    expect(screen.getByText('Điểm chính thức')).toBeInTheDocument()
  })

  it('phiếu đã nộp chưa khóa → sửa điểm rồi "Nộp lại"', async () => {
    const submitted = sheet({
      status: 'SUBMITTED',
      advisorScore: 8,
      totalScore: 8,
      submittedAt: '2026-11-18T09:00:00',
      generalComment: 'Tốt',
      groups: [{ ...sheet().groups[0], criteria: sheet().groups[0].criteria.map((c) => ({ ...c, score: 8 })) }],
    })
    serviceMock.getSheet.mockResolvedValue(submitted)
    serviceMock.submit.mockResolvedValue({ ...submitted, advisorScore: 9.2 })
    renderDialog(topic({ sheetStatus: 'SUBMITTED', advisorScore: 8 }))

    const c2 = await screen.findByLabelText('Điểm Nội dung')
    expect(screen.queryByRole('button', { name: 'Lưu nháp' })).not.toBeInTheDocument()
    expect(screen.getByText(/Phiếu đã nộp lúc .*18\/11\/2026.*điểm chính thức 8\.0/)).toBeInTheDocument()

    await userEvent.clear(c2)
    await userEvent.type(c2, '10')
    // Đang sửa → hiện điểm tạm tính: 8*40% + 10*60% = 9.2
    expect(screen.getByText('Điểm tạm tính')).toBeInTheDocument()
    expect(screen.getByTestId('advisor-grade-score')).toHaveTextContent('9.2')

    await userEvent.click(screen.getByRole('button', { name: 'Nộp lại' }))
    expect(screen.getByText(/Nộp lại sẽ thay điểm hướng dẫn đã nộp/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Xác nhận nộp lại' }))

    await waitFor(() =>
      expect(serviceMock.submit).toHaveBeenCalledWith('sh1', {
        generalComment: 'Tốt',
        details: [
          { criteriaId: 'c1', score: 8 },
          { criteriaId: 'c2', score: 10 },
        ],
      }),
    )
    expect(await screen.findByText(/^Đã cập nhật điểm hướng dẫn\./)).toBeInTheDocument()
  })

  it('C4 lỗi khóa chấm (3128) → hiện lỗi trong popup, không toast.error', async () => {
    serviceMock.getSheet.mockResolvedValue(sheet())
    serviceMock.saveDraft.mockRejectedValue(new ApiError('Đã khóa chấm', 3128))
    renderDialog()
    await userEvent.type(await screen.findByLabelText('Điểm Nội dung'), '5')
    await userEvent.click(screen.getByRole('button', { name: 'Lưu nháp' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Đã khóa chấm Phiếu đã chuyển sang chế độ chỉ xem.')
    expect(toastMock.error).not.toHaveBeenCalled()
  })

  it('C4 lỗi phiếu đã nộp (3118) → gợi ý "Nộp lại"', async () => {
    serviceMock.getSheet.mockResolvedValue(sheet())
    serviceMock.saveDraft.mockRejectedValue(new ApiError('Phiếu đã nộp', 3118))
    renderDialog()
    await userEvent.type(await screen.findByLabelText('Điểm Nội dung'), '5')
    await userEvent.click(screen.getByRole('button', { name: 'Lưu nháp' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Phiếu đã nộp .*bấm "Nộp lại" để cập nhật/)
    expect(toastMock.error).not.toHaveBeenCalled()
  })

  it('phiếu chỉ xem → khóa ô nhập, ẩn nút lưu/nộp, hiện lý do', async () => {
    serviceMock.getSheet.mockResolvedValue(sheet({ canEdit: false, readonlyReason: 'GRADING_LOCKED', deadline: { ...deadline, locked: true } }))
    renderDialog()
    expect(await screen.findByLabelText('Điểm Chuyên cần')).toBeDisabled()
    expect(screen.getByText(/Đã qua thời gian tổ chức hội đồng bảo vệ.*khóa lúc .*30\/11\/2026/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Lưu nháp' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nộp phiếu' })).not.toBeInTheDocument()
  })

  it('có thay đổi chưa lưu → hỏi trước khi đóng', async () => {
    serviceMock.getSheet.mockResolvedValue(sheet())
    const { onClose } = renderDialog()
    await userEvent.type(await screen.findByLabelText('Điểm Nội dung'), '5')
    // Nút X của Dialog và nút "Đóng" ở footer đều đi qua bước hỏi này
    for (const button of screen.getAllByRole('button', { name: 'Đóng' })) {
      await userEvent.click(button)
      expect(onClose).not.toHaveBeenCalled()
      expect(screen.getByText(/Có thay đổi chưa lưu/)).toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: 'Ở lại' }))
    }
    await userEvent.click(screen.getAllByRole('button', { name: 'Đóng' }).at(-1)!)
    expect(screen.getByText(/Có thay đổi chưa lưu/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Đóng không lưu' }))
    expect(onClose).toHaveBeenCalled()
  })
})
