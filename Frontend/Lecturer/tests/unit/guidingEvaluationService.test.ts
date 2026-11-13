import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api'
import {
  PROGRESS_MAX_FILE_SIZE_BYTES,
  canLecturerSubmitProgressReport,
  formatProgressDeadlineForSupervisor,
  getProgressUploadBlockedReason,
  guidingEvaluationService,
  mapFinalReportToGuidingItem,
  validateProgressFile,
} from '@/features/lecturer/guiding_evaluation'
import type { GuidingFinalReportDto } from '@/features/lecturer/guiding_evaluation'

vi.mock('@/shared/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
  API_ENDPOINTS: {
    report: {
      supervisorList: '/report/supervisor-list',
      detail: (publicId: string) => `/report/${publicId}`,
      submitProgressReport: '/report/progress-report',
      deadlines: '/api/v1/deadlines',
    },
  },
}))

function createMockDto(
  overrides: Partial<GuidingFinalReportDto> = {},
): GuidingFinalReportDto {
  return {
    publicId: 'rep-uuid-1',
    topicPublicId: 'topic-uuid-1',
    topicName: 'Xây dựng hệ thống Quản lý Đồ án TLU',
    currentStage: 'STAGE_3_OUTLINE_APPROVED',
    topicStatus: 'IN_PROGRESS',
    disqualificationReason: null,
    studentPublicId: 'stu-uuid-1',
    studentCode: '2051060001',
    studentName: 'Nguyễn Văn An',
    lecturerPublicId: 'lec-uuid-1',
    lecturerName: 'Trần Văn Bình',
    coLecturerPublicId: null,
    coLecturerName: null,
    finalReportFile: 'https://res.cloudinary.com/demo/raw/upload/bao_cao_final.pdf',
    plagiarismRate: null,
    plagiarismFile: null,
    supervisorFeedback: null,
    status: 'PENDING',
    statusDescription: 'Đã nộp, chờ nhận xét',
    submittedAt: '2026-11-12T15:30:00',
    reviewedAt: null,
    progressReport: {
      publicId: 'prog-uuid-1',
      topicPublicId: 'topic-uuid-1',
      supervisorPublicId: 'lec-uuid-1',
      supervisorName: 'Trần Văn Bình',
      progressFile: 'https://res.cloudinary.com/demo/raw/upload/phieu_tien_do.pdf',
      supervisorNote: 'Đúng tiến độ',
      submittedAt: '2026-11-11T09:00:00',
    },
    canSubmitProgressReport: true,
    canReview: true,
    deadlineName: 'Hạn nộp báo cáo ĐATN & Phiếu theo dõi tiến độ',
    deadlineStartDate: '2026-11-01T00:00:00',
    deadlineEndDate: '2026-11-25T23:59:59',
    deadlineActive: true,
    deadlineStatus: 'OPEN',
    histories: null,
    ...overrides,
  }
}

describe('guidingEvaluationService & helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getSupervisorProgressReports calls GET /report/supervisor-list with semesterId', async () => {
    const dto = createMockDto()
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { code: 1000, message: null, data: [dto] },
    })

    const result = await guidingEvaluationService.getSupervisorProgressReports({
      semesterId: 'sem-1',
    })

    expect(apiClient.get).toHaveBeenCalledWith('/report/supervisor-list', {
      params: { semesterId: 'sem-1', status: undefined },
    })
    expect(result).toEqual([dto])
  })

  it('getReportDetailForSupervisor calls GET /report/{publicId}', async () => {
    const dto = createMockDto({ histories: [] })
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { code: 1000, message: null, data: dto },
    })

    const result = await guidingEvaluationService.getReportDetailForSupervisor('rep-uuid-1')
    expect(apiClient.get).toHaveBeenCalledWith('/report/rep-uuid-1')
    expect(result).toEqual(dto)
  })

  it('submitProgressReport sends multipart POST /report/progress-report with skipErrorToast', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: { code: 1000, message: 'Nộp phiếu theo dõi tiến độ thành công', data: null },
    })

    const file = new File(['progress'], 'phieu_tien_do.pdf', { type: 'application/pdf' })
    await guidingEvaluationService.submitProgressReport({
      topicPublicId: 'topic-uuid-1',
      file,
      supervisorNote: '  Hoàn thành đúng tiến độ  ',
    })

    expect(apiClient.post).toHaveBeenCalledTimes(1)
    const [url, body, config] = vi.mocked(apiClient.post).mock.calls[0]
    expect(url).toBe('/report/progress-report')
    expect(body).toBeInstanceOf(FormData)
    const fd = body as FormData
    expect(fd.get('topicPublicId')).toBe('topic-uuid-1')
    expect(fd.get('file')).toBe(file)
    expect(fd.get('supervisorNote')).toBe('Hoàn thành đúng tiến độ')
    expect(config).toEqual({
      headers: { 'Content-Type': 'multipart/form-data' },
      skipErrorToast: true,
    })
  })

  it('getFallbackProgressDeadline extracts NOP_BAO_CAO_VA_PHIEU_THEO_DOI from /api/v1/deadlines', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        code: 1000,
        data: {
          stage2: [
            {
              templateCode: 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI',
              name: 'Hạn nộp báo cáo ĐATN & Phiếu theo dõi tiến độ',
              startDate: '2026-01-01T00:00:00',
              endDate: '2099-12-31T23:59:59',
              status: 'EXTENDED',
              active: true,
            },
          ],
        },
      },
    })

    const deadline = await guidingEvaluationService.getFallbackProgressDeadline('sem-1')
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/deadlines', {
      params: { semesterId: 'sem-1' },
      skipErrorToast: true,
    })
    expect(deadline.deadlineStatus).toBe('EXTENDED')
    expect(deadline.deadlineEndDate).toBe('2099-12-31T23:59:59')
  })

  it('validates progress report file format and < 10MB limit', () => {
    expect(validateProgressFile(null)).toBe('File tải lên không được để trống.')
    expect(
      validateProgressFile(new File(['abc'], 'notes.txt', { type: 'text/plain' })),
    ).toBe('File tải lên chỉ nhận định dạng .doc, .docx hoặc .pdf.')

    const bigFile = new File(['x'], 'big.pdf', { type: 'application/pdf' })
    Object.defineProperty(bigFile, 'size', { value: PROGRESS_MAX_FILE_SIZE_BYTES })
    expect(validateProgressFile(bigFile)).toBe('File tải lên phải nhỏ hơn 10MB.')

    expect(
      validateProgressFile(new File(['ok'], 'phieu_tien_do.docx')),
    ).toBeNull()
  })

  it('allows both OPEN and EXTENDED deadline for main supervisor and blocks co-supervisor', () => {
    const openItem = mapFinalReportToGuidingItem(createMockDto({ deadlineStatus: 'OPEN' }))
    expect(canLecturerSubmitProgressReport(openItem)).toBe(true)
    expect(getProgressUploadBlockedReason(openItem)).toBeNull()

    const extendedItem = mapFinalReportToGuidingItem(
      createMockDto({ deadlineStatus: 'EXTENDED' }),
    )
    expect(canLecturerSubmitProgressReport(extendedItem)).toBe(true)

    const closedItem = mapFinalReportToGuidingItem(
      createMockDto({ deadlineStatus: 'CLOSED' }),
    )
    expect(canLecturerSubmitProgressReport(closedItem)).toBe(false)
    expect(getProgressUploadBlockedReason(closedItem)).toBe('Đã hết hạn nộp phiếu theo dõi')

    const coLecturerItem = mapFinalReportToGuidingItem(
      createMockDto({ canSubmitProgressReport: false }),
    )
    expect(canLecturerSubmitProgressReport(coLecturerItem)).toBe(false)
    expect(getProgressUploadBlockedReason(coLecturerItem)).toBe('Đồng hướng dẫn (Chỉ xem)')
  })

  it('formats supervisor progress deadline display states accurately', () => {
    const fmt = (iso: string) => iso.slice(0, 10)

    expect(formatProgressDeadlineForSupervisor(null, 'NOT_CONFIGURED', fmt)).toMatchObject({
      text: 'Chưa có',
      isUnconfigured: true,
      canSubmitWindow: false,
    })
    expect(
      formatProgressDeadlineForSupervisor('2026-11-25T23:59:59', 'CLOSED', fmt),
    ).toMatchObject({
      text: '2026-11-25 (Đã hết hạn)',
      badgeText: 'Đã hết hạn',
      isExpired: true,
      canSubmitWindow: false,
    })
    expect(
      formatProgressDeadlineForSupervisor('2026-11-25T23:59:59', 'EXTENDED', fmt),
    ).toMatchObject({
      text: '2026-11-25',
      badgeText: 'Gia hạn chấm',
      canSubmitWindow: true,
    })
    expect(
      formatProgressDeadlineForSupervisor('2026-11-25T23:59:59', 'OPEN', fmt),
    ).toMatchObject({
      text: '2026-11-25',
      badgeText: 'Đang mở',
      canSubmitWindow: true,
    })
  })
})

