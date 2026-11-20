import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api'
import {
  PLAGIARISM_MAX_FILE_SIZE_BYTES,
  REPORT_REVIEW_ERROR_CODES,
  canReviewFinalReport,
  formatReportDeadlineForReview,
  getAllowedReviewDecisions,
  getReviewBlockedReason,
  isValidDocumentFileName,
  mapFinalReportToCheckItem,
  mapPlagiarismReviewError,
  reportCheckService,
  resolvePlagiarismReviewError,
  validatePlagiarismFile,
  validateReviewForm,
} from '@/features/lecturer/report_check'
import type { ThesisFinalReportResponse } from '@/features/lecturer/report_check'

vi.mock('@/shared/api', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
  API_ENDPOINTS: {
    report: {
      supervisorList: '/report/supervisor-list',
      detail: (publicId: string) => `/report/${publicId}`,
      review: (publicId: string) => `/report/${publicId}/review`,
      deadlines: '/api/v1/deadlines',
    },
  },
}))

function createMockDto(
  overrides: Partial<ThesisFinalReportResponse> = {},
): ThesisFinalReportResponse {
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

describe('reportCheckService & helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getSupervisorFinalReports calls GET /report/supervisor-list with semesterId and status', async () => {
    const dto = createMockDto()
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { code: 1000, message: null, data: [dto] },
    })

    const result = await reportCheckService.getSupervisorFinalReports({
      semesterId: 'sem-1',
      status: 'PENDING',
    })

    expect(apiClient.get).toHaveBeenCalledWith('/report/supervisor-list', {
      params: { semesterId: 'sem-1', status: 'PENDING' },
    })
    expect(result).toEqual([dto])
  })

  it('getFinalReportDetailForSupervisor calls GET /report/{publicId}', async () => {
    const dto = createMockDto({ histories: [] })
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { code: 1000, message: null, data: dto },
    })

    const result = await reportCheckService.getFinalReportDetailForSupervisor('rep-uuid-1')
    expect(apiClient.get).toHaveBeenCalledWith('/report/rep-uuid-1')
    expect(result).toEqual(dto)
  })

  it('reviewStudentFinalReport sends multipart PUT /report/{publicId}/review with skipErrorToast', async () => {
    vi.mocked(apiClient.put).mockResolvedValueOnce({
      data: { code: 1000, message: 'Thẩm định báo cáo Final thành công', data: null },
    })

    const file = new File(['turnitin'], 'turnitin.pdf', { type: 'application/pdf' })
    await reportCheckService.reviewStudentFinalReport({
      publicId: 'rep-uuid-1',
      plagiarismRate: 12.5,
      plagiarismFile: file,
      decision: 'APPROVED',
      feedback: 'Đạt yêu cầu',
    })

    expect(apiClient.put).toHaveBeenCalledTimes(1)
    const [url, body, config] = vi.mocked(apiClient.put).mock.calls[0]
    expect(url).toBe('/report/rep-uuid-1/review')
    expect(body).toBeInstanceOf(FormData)
    const fd = body as FormData
    expect(fd.get('plagiarismRate')).toBe('12.5')
    expect(fd.get('plagiarismFile')).toBe(file)
    expect(fd.get('decision')).toBe('APPROVED')
    expect(fd.get('feedback')).toBe('Đạt yêu cầu')
    expect(config).toEqual({
      headers: { 'Content-Type': 'multipart/form-data' },
      skipErrorToast: true,
    })
  })

  it('getFallbackReportDeadline extracts NOP_BAO_CAO_VA_PHIEU_THEO_DOI from /api/v1/deadlines', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        code: 1000,
        data: {
          thucHienDeadlines: [
            {
              code: 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI',
              name: 'Hạn nộp báo cáo ĐATN',
              startDate: '2026-01-01T00:00:00',
              endDate: '2099-12-31T23:59:59',
              status: 'IN_PROGRESS',
            },
          ],
        },
      },
    })

    const deadline = await reportCheckService.getFallbackReportDeadline('sem-1')
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/deadlines', {
      params: { semesterId: 'sem-1' },
      skipErrorToast: true,
    })
    expect(deadline.deadlineStatus).toBe('OPEN')
    expect(deadline.deadlineEndDate).toBe('2099-12-31T23:59:59')
  })

  it('validates file name according to Tenlop_MaSV_HoVaTen rule', () => {
    expect(isValidDocumentFileName('DHKTPM17A_22110001_NguyenVanAn.pdf')).toBe(true)
    expect(isValidDocumentFileName('64KTPM3_2251172405_LuongThiThuyLien.pdf')).toBe(true)
    expect(isValidDocumentFileName('C:/docs/DHKTPM17A_22110001_NguyenVanAn.pdf')).toBe(true)
    expect(isValidDocumentFileName('\\\\shared\\DHKTPM17A_22110001_NguyenVanAn.pdf')).toBe(true)

    expect(isValidDocumentFileName('turnitin.pdf')).toBe(false)
    expect(isValidDocumentFileName('64KTPM3_NguyenVanAn.pdf')).toBe(false)
    expect(isValidDocumentFileName('Bao_cao_DATN_MSSV_HoTen.pdf')).toBe(false)
    expect(isValidDocumentFileName('DHKTPM17A__NguyenVanAn.pdf')).toBe(false)
    expect(isValidDocumentFileName('noextension')).toBe(false)
    expect(isValidDocumentFileName('.pdf')).toBe(false)
  })

  it('validates plagiarism file format (.pdf only), < 10MB limit, and Tenlop_MaSV_HoVaTen name', () => {
    expect(validatePlagiarismFile(null)).toBe(
      'File báo cáo kiểm tra trùng lặp không được để trống.',
    )
    expect(
      validatePlagiarismFile(new File(['abc'], 'result.txt', { type: 'text/plain' })),
    ).toBe(
      'File kiểm tra trùng lặp bắt buộc là định dạng .pdf (xuất từ Turnitin / KiểmTraTàiLiệu).',
    )
    expect(
      validatePlagiarismFile(new File(['abc'], 'turnitin.docx')),
    ).toBe(
      'File kiểm tra trùng lặp bắt buộc là định dạng .pdf (xuất từ Turnitin / KiểmTraTàiLiệu).',
    )

    const bigFile = new File(['x'], 'big.pdf', { type: 'application/pdf' })
    Object.defineProperty(bigFile, 'size', { value: PLAGIARISM_MAX_FILE_SIZE_BYTES })
    expect(validatePlagiarismFile(bigFile)).toBe('File tải lên phải nhỏ hơn 10MB.')

    const invalidNamePdf = new File(['ok'], 'turnitin.pdf', {
      type: 'application/pdf',
    })
    expect(validatePlagiarismFile(invalidNamePdf)).toBe(
      'Tên file không đúng định dạng! Vui lòng đổi tên file theo định dạng Tenlop_MaSV_HoVaTen (VD: DHKTPM17A_22110001_NguyenVanAn.pdf)',
    )

    const validPdf = new File(['ok'], '64KTPM3_2051060001_NguyenVanAn.pdf', {
      type: 'application/pdf',
    })
    expect(validatePlagiarismFile(validPdf)).toBeNull()

    expect(
      validateReviewForm({
        decision: null,
        plagiarismRate: 10,
        plagiarismFile: validPdf,
      }),
    ).toBe('Vui lòng chọn kết quả thẩm định báo cáo.')

    expect(
      validateReviewForm({
        decision: 'APPROVED',
        plagiarismRate: null,
        plagiarismFile: validPdf,
      }),
    ).toBe('Vui lòng nhập tỷ lệ đạo văn.')

    expect(
      validateReviewForm({
        decision: 'APPROVED',
        plagiarismRate: -1,
        plagiarismFile: validPdf,
      }),
    ).toBe('Tỷ lệ đạo văn phải nằm trong khoảng 0% đến 100%.')

    expect(
      validateReviewForm({
        decision: 'APPROVED',
        plagiarismRate: 36,
        plagiarismFile: validPdf,
      }),
    ).toBe('Tỷ lệ đạo văn vượt quá 35%, không đủ điều kiện phê duyệt Đạt.')

    expect(
      validateReviewForm({
        decision: 'APPROVED',
        plagiarismRate: 12.5,
        plagiarismFile: invalidNamePdf,
      }),
    ).toBe(
      'Tên file không đúng định dạng! Vui lòng đổi tên file theo định dạng Tenlop_MaSV_HoVaTen (VD: DHKTPM17A_22110001_NguyenVanAn.pdf)',
    )

    expect(
      validateReviewForm({
        decision: 'REQUEST_CHANGES',
        plagiarismRate: 36,
        plagiarismFile: validPdf,
      }),
    ).toBeNull()

    expect(
      validateReviewForm({
        decision: 'APPROVED',
        plagiarismRate: 35,
        plagiarismFile: validPdf,
      }),
    ).toBeNull()
  })

  it('maps and resolves Plagiarism Auto-Verification error codes accurately', () => {
    expect(mapPlagiarismReviewError('DOCUMENT_FILE_NAME_INVALID')).toBe(
      'Tên file không đúng định dạng! Vui lòng đổi tên file theo định dạng Tenlop_MaSV_HoVaTen (VD: DHKTPM17A_22110001_NguyenVanAn.pdf)',
    )
    expect(
      resolvePlagiarismReviewError(
        'DOCUMENT_FILE_NAME_INVALID',
        'Tên file không đúng định dạng! Vui lòng đổi tên file theo định dạng Tenlop_MaSV_HoVaTen (VD: DHKTPM17A_22110001_NguyenVanAn.pdf)',
      ),
    ).toMatchObject({
      field: 'plagiarismFile',
      isStudentMismatch: false,
      isMissingProgressReport: false,
    })

    expect(mapPlagiarismReviewError('PLAGIARISM_SCORE_MISMATCH')).toContain(
      'Số liệu không khớp!',
    )
    expect(
      resolvePlagiarismReviewError(
        4000,
        'Số liệu không khớp! Tỷ lệ trùng lặp bạn nhập khác với kết quả trong file báo cáo PDF. Vui lòng kiểm tra lại tài liệu!',
      ),
    ).toMatchObject({
      field: 'plagiarismRate',
      isStudentMismatch: false,
    })

    expect(
      resolvePlagiarismReviewError(
        4000,
        'Cảnh báo nhầm tài liệu! File báo cáo PDF có mã sinh viên không khớp với sinh viên đang duyệt.',
      ),
    ).toMatchObject({
      field: 'plagiarismFile',
      isStudentMismatch: true,
    })

    expect(
      resolvePlagiarismReviewError(
        4000,
        'Không tìm thấy dữ liệu tỷ lệ trùng lặp hợp lệ trên trang 1 của tài liệu. Vui lòng kiểm tra lại đúng mẫu báo cáo PDF!',
      ),
    ).toMatchObject({
      field: 'plagiarismFile',
      isStudentMismatch: false,
    })

    expect(
      resolvePlagiarismReviewError(
        3093,
        'GVHD chưa nộp phiếu theo dõi tiến độ cho đề tài này',
      ),
    ).toMatchObject({
      field: 'root',
      isMissingProgressReport: true,
    })
  })

  it('enforces canReviewFinalReport, blocked reasons, and allowed decisions', () => {
    const validItem = mapFinalReportToCheckItem(createMockDto())
    expect(canReviewFinalReport(validItem)).toBe(true)
    expect(getReviewBlockedReason(validItem)).toBeNull()
    expect(getAllowedReviewDecisions('OPEN')).toEqual(['APPROVED', 'REQUEST_CHANGES'])
    expect(getAllowedReviewDecisions('EXTENDED')).toEqual(['APPROVED', 'REJECTED'])

    const noProgressItem = mapFinalReportToCheckItem(
      createMockDto({ progressReport: null }),
    )
    expect(canReviewFinalReport(noProgressItem)).toBe(false)
    expect(getReviewBlockedReason(noProgressItem)).toBe('Chưa nộp phiếu theo dõi tiến độ')

    const coLecturerItem = mapFinalReportToCheckItem(
      createMockDto({ canReview: false }),
    )
    expect(canReviewFinalReport(coLecturerItem)).toBe(false)
    expect(getReviewBlockedReason(coLecturerItem)).toBe('Đồng hướng dẫn (Chỉ xem)')
  })

  it('formats deadline display states accurately', () => {
    const fmt = (iso: string) => iso.slice(0, 10)

    expect(formatReportDeadlineForReview(null, 'NOT_CONFIGURED', fmt)).toMatchObject({
      text: 'Chưa có',
      isUnconfigured: true,
      canReviewWindow: false,
    })
    expect(formatReportDeadlineForReview('2026-11-25T23:59:59', 'CLOSED', fmt)).toMatchObject({
      text: '2026-11-25 (Đã hết hạn)',
      badgeText: 'Đã hết hạn',
      isExpired: true,
      canReviewWindow: false,
    })
    expect(formatReportDeadlineForReview('2026-11-25T23:59:59', 'EXTENDED', fmt)).toMatchObject({
      text: '2026-11-25 (Gia hạn chấm)',
      badgeText: 'Gia hạn chấm',
      canReviewWindow: true,
      allowedDecisions: ['APPROVED', 'REJECTED'],
    })
    expect(formatReportDeadlineForReview('2026-11-25T23:59:59', 'OPEN', fmt)).toMatchObject({
      text: '2026-11-25',
      badgeText: 'Đang mở',
      canReviewWindow: true,
      allowedDecisions: ['APPROVED', 'REQUEST_CHANGES'],
    })
  })

  it('matches backend ErrorCode contract in API_Supervisor_FinalReportReview.md', () => {
    expect(REPORT_REVIEW_ERROR_CODES).toMatchObject({
      FINAL_REPORT_DECISION_NULL: 4000,
      PLAGIARISM_RATE_REQUIRED: 4000,
      PLAGIARISM_RATE_INVALID: 4000,
      PLAGIARISM_RATE_EXCEEDED: 4000,
      DOCUMENT_FILE_NAME_INVALID: 4000,
      PLAGIARISM_REPORT_FILE_REQUIRED: 4000,
      PLAGIARISM_SCORE_MISMATCH: 4000,
      PLAGIARISM_REPORT_STUDENT_ID_NOT_FOUND: 4000,
      PLAGIARISM_REPORT_STUDENT_ID_MISMATCH: 4000,
      PLAGIARISM_REPORT_DATA_NOT_FOUND: 4000,
      PLAGIARISM_REPORT_INTERNAL_INCONSISTENCY: 4000,
      PDF_FILE_EMPTY: 4000,
      AI_SERVICE_TIMEOUT: 4000,
      EXPECTED_STUDENT_ID_REQUIRED: 4000,
      REPORT_FILE_EMPTY: 4000,
      REPORT_FILE_INVALID_FORMAT: 4000,
      REPORT_FILE_TOO_LARGE: 4000,
      FINAL_REPORT_DECISION_INVALID_IN_SUBMISSION_PERIOD: 4000,
      FINAL_REPORT_DECISION_INVALID_IN_GRADING_PERIOD: 4000,
      CLOUDINARY_SERVICE_FAIL: 4000,
      THESIS_FINAL_REPORT_NOT_FOUND: 3089,
      REPORT_DEADLINE_NOT_FOUND: 3094,
      FINAL_REPORT_SUBMISSION_DEADLINE_CLOSED: 3095,
      FINAL_REPORT_GRADING_CLOSED: 3097,
      FINAL_REPORT_NOT_PENDING: 3092,
      PROGRESS_REPORT_NOT_SUBMITTED: 3093,
      TOPIC_NOT_IN_PROGRESS: 3057,
      FORBIDDEN: 2001,
      UNAUTHORIZED: 2000,
    })
  })
})

