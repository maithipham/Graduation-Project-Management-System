import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api'
import {
  FINAL_REPORT_ERROR_CODES,
  REPORT_MAX_FILE_SIZE_BYTES,
  extractReportFileName,
  getFinalReportSubmitState,
  getReportDeadlineDisplay,
  isSafeReportFileUrl,
  reportsService,
  validateReportFile,
} from '@/features/reports_management'
import type { ThesisFinalReportResponse } from '@/features/reports_management'

vi.mock('@/shared/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
  API_ENDPOINTS: {
    report: {
      myReport: '/report/my-report',
      submit: '/report/submit',
      detail: (publicId: string) => `/report/${publicId}`,
    },
  },
}))

function createMockFinalReport(
  overrides: Partial<ThesisFinalReportResponse> = {},
): ThesisFinalReportResponse {
  return {
    publicId: '018db26a-932f-789a-bc01-999999999999',
    topicPublicId: '018db26a-932f-789a-bc01-e23456789abc',
    topicName: 'Xây dựng hệ thống Quản lý Đồ án TLU',
    currentStage: 'STAGE_3_OUTLINE_APPROVED',
    topicStatus: 'IN_PROGRESS',
    disqualificationReason: null,
    studentPublicId: '018db26a-932f-789a-bc01-222222222222',
    studentCode: '2051060001',
    studentName: 'Nguyễn Văn An',
    lecturerPublicId: '018db26a-932f-789a-bc01-333333333333',
    lecturerName: 'Trần Văn Bình',
    coLecturerPublicId: null,
    coLecturerName: null,
    finalReportFile: 'https://res.cloudinary.com/demo/raw/upload/bao_cao_final_v1.pdf',
    plagiarismRate: 14.5,
    plagiarismFile: 'https://res.cloudinary.com/demo/raw/upload/turnitin_v1.pdf',
    supervisorFeedback: 'Cần bổ sung thêm tài liệu tham khảo ở chương 2.',
    status: 'REQUEST_CHANGES',
    statusDescription: 'Yêu cầu chỉnh sửa',
    submittedAt: '2026-11-12T15:30:00',
    reviewedAt: '2026-11-12T18:00:00',
    progressReport: null,
    canSubmitProgressReport: false,
    canReview: false,
    deadlineName: 'Hạn nộp báo cáo ĐATN & Phiếu theo dõi tiến độ',
    deadlineStartDate: '2026-11-01T00:00:00',
    deadlineEndDate: '2026-11-25T23:59:59',
    deadlineActive: true,
    deadlineStatus: 'OPEN',
    histories: [],
    ...overrides,
  }
}

describe('Final Report Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getMyReport calls GET /report/my-report with and without semesterId', async () => {
    const mockReport = createMockFinalReport()
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        code: 1000,
        message: null,
        data: mockReport,
      },
    })

    const currentResult = await reportsService.getMyReport()
    expect(apiClient.get).toHaveBeenCalledWith('/report/my-report', {
      params: undefined,
    })
    expect(currentResult).toEqual(mockReport)

    const bySemester = await reportsService.getMyReport('semester-uuid')
    expect(apiClient.get).toHaveBeenCalledWith('/report/my-report', {
      params: { semesterId: 'semester-uuid' },
    })
    expect(bySemester).toEqual(mockReport)
  })

  it('submitReport sends FormData with file and skipErrorToast to POST /report/submit', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        code: 1000,
        message: 'Nộp báo cáo Final thành công',
        data: null,
      },
    })

    const file = new File(['dummy pdf'], 'Bao_cao_2051060001.pdf', {
      type: 'application/pdf',
    })

    await reportsService.submitReport(file)

    expect(apiClient.post).toHaveBeenCalledTimes(1)
    const [url, body, config] = vi.mocked(apiClient.post).mock.calls[0]
    expect(url).toBe('/report/submit')
    expect(body).toBeInstanceOf(FormData)
    expect((body as FormData).get('file')).toBe(file)
    expect(config).toEqual({
      headers: { 'Content-Type': 'multipart/form-data' },
      skipErrorToast: true,
    })
  })

  it('getReportDetail calls GET /report/{publicId}', async () => {
    const mockReport = createMockFinalReport()
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        code: 1000,
        message: null,
        data: mockReport,
      },
    })

    const detail = await reportsService.getReportDetail('report-uuid-1')
    expect(apiClient.get).toHaveBeenCalledWith('/report/report-uuid-1')
    expect(detail).toEqual(mockReport)
  })
})

describe('Final Report URL & File Helpers', () => {
  it('validates safe URLs and rejects unsafe schemes', () => {
    expect(isSafeReportFileUrl('https://res.cloudinary.com/demo/bao_cao.pdf')).toBe(true)
    expect(isSafeReportFileUrl('http://localhost:8080/files/bao_cao.docx')).toBe(true)
    expect(isSafeReportFileUrl('/uploads/bao_cao.pdf')).toBe(true)
    expect(isSafeReportFileUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeReportFileUrl('')).toBe(false)
    expect(isSafeReportFileUrl(null)).toBe(false)
  })

  it('extracts decoded file name from URL', () => {
    expect(
      extractReportFileName(
        'https://res.cloudinary.com/demo/raw/upload/v1/Bao%20cao%20Final.pdf?download=1',
      ),
    ).toBe('Bao cao Final.pdf')
    expect(extractReportFileName(null)).toBe('Tệp báo cáo')
  })

  it('validates empty, invalid extension, >= 10 MB, and valid report files', () => {
    expect(validateReportFile(null)).toBe('File tải lên không được để trống.')

    const emptyFile = new File([], 'empty.pdf', { type: 'application/pdf' })
    expect(validateReportFile(emptyFile)).toBe('File tải lên không được để trống.')

    const invalidExt = new File(['abc'], 'report.txt', { type: 'text/plain' })
    expect(validateReportFile(invalidExt)).toBe(
      'File tải lên chỉ nhận định dạng .doc, .docx hoặc .pdf.',
    )

    const exactLimitFile = new File(['x'], 'big.pdf', { type: 'application/pdf' })
    Object.defineProperty(exactLimitFile, 'size', { value: REPORT_MAX_FILE_SIZE_BYTES })
    expect(validateReportFile(exactLimitFile)).toBe('File tải lên phải nhỏ hơn 10MB.')

    const validDocx = new File(['valid'], 'Bao_cao_Final.DOCX', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    expect(validateReportFile(validDocx)).toBeNull()
  })
})

describe('getReportDeadlineDisplay & getFinalReportSubmitState', () => {
  it('formats deadlineStatus values according to API_Student_FinalReport.md', () => {
    expect(
      getReportDeadlineDisplay({
        deadlineStatus: 'NOT_CONFIGURED',
        deadlineStartDate: null,
        deadlineEndDate: null,
      }),
    ).toMatchObject({
      text: 'Chưa có',
      badgeText: null,
      isOpenForStudent: false,
    })

    expect(
      getReportDeadlineDisplay({
        deadlineStatus: 'NOT_STARTED',
        deadlineStartDate: '2026-11-15T00:00:00',
        deadlineEndDate: '2026-11-25T23:59:59',
      }),
    ).toMatchObject({
      badgeText: 'Chưa mở',
      isOpenForStudent: false,
    })

    expect(
      getReportDeadlineDisplay({
        deadlineStatus: 'OPEN',
        deadlineStartDate: '2026-11-01T00:00:00',
        deadlineEndDate: '2026-11-25T23:59:59',
      }),
    ).toMatchObject({
      badgeText: 'Đang mở',
      isOpenForStudent: true,
    })

    expect(
      getReportDeadlineDisplay({
        deadlineStatus: 'EXTENDED',
        deadlineStartDate: '2026-11-01T00:00:00',
        deadlineEndDate: '2026-11-25T23:59:59',
      }),
    ).toMatchObject({
      badgeText: 'Đã hết hạn',
      isOpenForStudent: false,
    })

    expect(
      getReportDeadlineDisplay({
        deadlineStatus: 'CLOSED',
        deadlineStartDate: '2026-11-01T00:00:00',
        deadlineEndDate: '2026-11-25T23:59:59',
      }),
    ).toMatchObject({
      badgeText: 'Đã hết hạn',
      isOpenForStudent: false,
    })
  })

  it('allows submission only when topic, stage >= STAGE_3_OUTLINE_APPROVED, OPEN deadline, and status allow', () => {
    expect(
      getFinalReportSubmitState(createMockFinalReport({ publicId: null, status: null })).canSubmit,
    ).toBe(true)
    expect(
      getFinalReportSubmitState(createMockFinalReport({ status: 'PENDING' })).canSubmit,
    ).toBe(true)
    expect(
      getFinalReportSubmitState(createMockFinalReport({ status: 'REQUEST_CHANGES' })).canSubmit,
    ).toBe(true)

    expect(
      getFinalReportSubmitState(
        createMockFinalReport({ topicPublicId: null, topicStatus: null, currentStage: null }),
      ).canSubmit,
    ).toBe(false)

    expect(
      getFinalReportSubmitState(
        createMockFinalReport({
          topicStatus: 'DISQUALIFIED',
          disqualificationReason: 'Vi phạm quy chế',
        }),
      ),
    ).toMatchObject({
      canSubmit: false,
      reason: 'Đề tài đã bị đình chỉ (Vi phạm quy chế), không thể nộp báo cáo Final.',
    })

    expect(
      getFinalReportSubmitState(
        createMockFinalReport({ currentStage: 'STAGE_2_TOPIC_CONFIRMED' }),
      ),
    ).toMatchObject({
      canSubmit: false,
      reason: 'Đề tài chưa hoàn thành phê duyệt đề cương, chưa thể nộp báo cáo Final.',
    })

    expect(
      getFinalReportSubmitState(createMockFinalReport({ status: 'APPROVED' })).canSubmit,
    ).toBe(false)
    expect(
      getFinalReportSubmitState(createMockFinalReport({ status: 'REJECTED' })).canSubmit,
    ).toBe(false)
    expect(
      getFinalReportSubmitState(createMockFinalReport({ deadlineStatus: 'EXTENDED' })).canSubmit,
    ).toBe(false)
    expect(
      getFinalReportSubmitState(createMockFinalReport({ deadlineStatus: 'CLOSED' })).canSubmit,
    ).toBe(false)
  })

  it('matches backend ErrorCode contract in API_Student_FinalReport.md', () => {
    expect(FINAL_REPORT_ERROR_CODES).toMatchObject({
      REPORT_FILE_EMPTY: 4000,
      REPORT_FILE_INVALID_FORMAT: 4000,
      REPORT_FILE_TOO_LARGE: 4000,
      CLOUDINARY_SERVICE_FAIL: 4000,
      THESIS_FINAL_REPORT_NOT_FOUND: 3089,
      REPORT_STAGE_INVALID: 3090,
      FINAL_REPORT_ALREADY_FINALIZED: 3091,
      REPORT_DEADLINE_NOT_FOUND: 3094,
      FINAL_REPORT_SUBMISSION_DEADLINE_CLOSED: 3095,
      TOPIC_NOT_IN_PROGRESS: 3057,
    })
  })
})
