import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api'
import {
  OUTLINE_ERROR_CODES,
  OUTLINE_MAX_FILE_SIZE_BYTES,
  extractOutlineFileName,
  getOutlineSubmitState,
  isSafeFileUrl,
  outlineService,
  validateOutlineFile,
} from '@/features/outline_management'
import type { ThesisOutlineResponse } from '@/features/outline_management'

vi.mock('@/shared/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
  API_ENDPOINTS: {
    topicTitle: {
      overview: '/topic/my-title-history',
      confirmInitial: '/topic/confirm-title',
      requestChange: '/topic/change-title',
    },
    outline: {
      myOutline: '/outline/my-outline',
      submit: '/outline/submit',
    },
  },
}))

function createMockOutline(
  overrides: Partial<ThesisOutlineResponse> = {},
): ThesisOutlineResponse {
  return {
    publicId: '018db26a-932f-789a-bc01-111111111111',
    topicPublicId: '018db26a-932f-789a-bc01-e23456789abc',
    topicName: 'Xây dựng hệ thống Quản lý Đồ án TLU',
    currentStage: 'STAGE_2_TOPIC_CONFIRMED',
    topicStatus: 'IN_PROGRESS',
    disqualificationReason: null,
    studentPublicId: '018db26a-932f-789a-bc01-222222222222',
    studentCode: '2051060001',
    studentName: 'Nguyễn Văn An',
    lecturerPublicId: '018db26a-932f-789a-bc01-333333333333',
    lecturerName: 'Trần Văn Bình',
    coLecturerPublicId: null,
    coLecturerName: null,
    reviewerPublicId: '018db26a-932f-789a-bc01-444444444444',
    reviewerName: 'Phạm Thị Dung',
    title: 'Xây dựng hệ thống Quản lý Đồ án TLU',
    outlineFile: 'https://res.cloudinary.com/demo/raw/upload/de_cuong_v2.pdf',
    status: 'REQUEST_CHANGES',
    statusDescription: 'Yêu cầu chỉnh sửa',
    reviewFeedback: 'Cần làm rõ kiến trúc phân hệ.',
    advisorFeedback: 'Đồng ý góp ý, em bổ sung chương 3.',
    submittedAt: '2026-11-10T10:15:00',
    reviewedAt: '2026-11-10T16:40:00',
    canReview: false,
    canWriteAdvisorFeedback: false,
    deadlineName: 'Hạn sinh viên chỉnh sửa & nộp lại đề cương',
    deadlineStartDate: '2026-11-01T00:00:00',
    deadlineEndDate: '2026-11-20T23:59:59',
    deadlineActive: true,
    deadlineStatus: 'OPEN',
    histories: [],
    ...overrides,
  }
}

describe('Outline Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getMyOutline calls GET /outline/my-outline with and without semesterId', async () => {
    const mockOutline = createMockOutline()
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        code: 1000,
        message: null,
        data: mockOutline,
      },
    })

    const currentResult = await outlineService.getMyOutline()
    expect(apiClient.get).toHaveBeenCalledWith('/outline/my-outline', {
      params: undefined,
    })
    expect(currentResult).toEqual(mockOutline)

    const bySemester = await outlineService.getMyOutline('semester-uuid')
    expect(apiClient.get).toHaveBeenCalledWith('/outline/my-outline', {
      params: { semesterId: 'semester-uuid' },
    })
    expect(bySemester).toEqual(mockOutline)
  })

  it('submitOutline sends FormData multipart/form-data to POST /outline/submit', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        code: 1000,
        message: 'Nộp đề cương thành công',
        data: null,
      },
    })

    const file = new File(['dummy pdf'], 'De_cuong_2051060001.pdf', {
      type: 'application/pdf',
    })

    await outlineService.submitOutline({
      file,
      submissionNote: '  Em nộp bản v2  ',
      title: '  Đề cương tốt nghiệp  ',
    })

    expect(apiClient.post).toHaveBeenCalledTimes(1)
    const [url, body, config] = vi.mocked(apiClient.post).mock.calls[0]
    expect(url).toBe('/outline/submit')
    expect(body).toBeInstanceOf(FormData)
    const formData = body as FormData
    expect(formData.get('file')).toBe(file)
    expect(formData.get('submissionNote')).toBe('Em nộp bản v2')
    expect(formData.get('title')).toBe('Đề cương tốt nghiệp')
    expect(config).toEqual({
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  })

  it('submitOutline omits blank optional submissionNote and title fields', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: { code: 1000, message: 'OK', data: null },
    })

    const file = new File(['doc'], 'outline.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })

    await outlineService.submitOutline({
      file,
      submissionNote: '   ',
      title: '',
    })

    const formData = vi.mocked(apiClient.post).mock.calls[0][1] as FormData
    expect(formData.get('file')).toBe(file)
    expect(formData.get('submissionNote')).toBeNull()
    expect(formData.get('title')).toBeNull()
  })
})

describe('Outline URL & File Name Helpers', () => {
  it('validates safe URLs and rejects unsafe schemes', () => {
    expect(isSafeFileUrl('https://res.cloudinary.com/demo/de_cuong_v2.pdf')).toBe(true)
    expect(isSafeFileUrl('http://localhost:8080/files/de_cuong.docx')).toBe(true)
    expect(isSafeFileUrl('/uploads/de_cuong.pdf')).toBe(true)
    expect(isSafeFileUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeFileUrl('')).toBe(false)
    expect(isSafeFileUrl(null)).toBe(false)
  })

  it('extracts decoded file name from URL with query parameters', () => {
    expect(
      extractOutlineFileName(
        'https://res.cloudinary.com/demo/raw/upload/v1/De%20cuong%20v2.pdf?download=1',
      ),
    ).toBe('De cuong v2.pdf')
    expect(extractOutlineFileName(null)).toBe('Tệp đề cương')
  })
})

describe('getOutlineSubmitState', () => {
  it('allows outline submission only when all prerequisite conditions hold', () => {
    expect(getOutlineSubmitState(createMockOutline({ status: null })).canSubmit).toBe(true)
    expect(
      getOutlineSubmitState(
        createMockOutline({
          publicId: null,
          status: null,
          reviewerPublicId: null,
          reviewerName: null,
        }),
      ).canSubmit,
    ).toBe(true)
    expect(
      getOutlineSubmitState(createMockOutline({ status: 'PENDING' })).canSubmit,
    ).toBe(true)
    expect(
      getOutlineSubmitState(createMockOutline({ status: 'REQUEST_CHANGES' })).canSubmit,
    ).toBe(true)
    expect(
      getOutlineSubmitState(
        createMockOutline({ currentStage: 'STAGE_3_OUTLINE_APPROVED', status: 'REQUEST_CHANGES' }),
      ).canSubmit,
    ).toBe(true)
  })

  it('locks submission for missing topic, disqualified, finalized, unconfirmed stage, unassigned reviewer, or non-OPEN deadline', () => {
    expect(
      getOutlineSubmitState(
        createMockOutline({ topicPublicId: null, topicStatus: null, currentStage: null }),
      ).canSubmit,
    ).toBe(false)

    expect(
      getOutlineSubmitState(createMockOutline({ topicStatus: 'DISQUALIFIED' })),
    ).toMatchObject({
      canSubmit: false,
      reason: 'Đề tài đã bị đình chỉ, không thể nộp đề cương.',
    })

    expect(
      getOutlineSubmitState(
        createMockOutline({
          topicStatus: 'DISQUALIFIED',
          disqualificationReason: 'Không hoàn thành phê duyệt đề cương đúng hạn',
        }),
      ),
    ).toMatchObject({
      canSubmit: false,
      reason:
        'Đề tài đã bị đình chỉ (Không hoàn thành phê duyệt đề cương đúng hạn), không thể nộp đề cương.',
    })

    expect(
      getOutlineSubmitState(
        createMockOutline({
          status: 'APPROVED',
          currentStage: 'STAGE_3_OUTLINE_APPROVED',
        }),
      ),
    ).toMatchObject({
      canSubmit: false,
      reason: 'Đề cương đã được phê duyệt, không thể nộp lại.',
    })

    expect(
      getOutlineSubmitState(createMockOutline({ status: 'REJECTED' })),
    ).toMatchObject({
      canSubmit: false,
      reason: 'Đề cương đã bị đánh không đạt, không thể nộp lại.',
    })

    expect(
      getOutlineSubmitState(
        createMockOutline({ currentStage: 'STAGE_1_ADVISOR_ASSIGNED' }),
      ),
    ).toMatchObject({
      canSubmit: false,
      reason: null,
    })

    expect(
      getOutlineSubmitState(createMockOutline({ reviewerPublicId: null, reviewerName: null })),
    ).toMatchObject({
      canSubmit: false,
      reason: 'Đang chờ Trưởng bộ môn phân công giảng viên nhận xét đề cương.',
    })

    expect(
      getOutlineSubmitState(createMockOutline({ deadlineStatus: 'EXTENDED' })).canSubmit,
    ).toBe(false)
    expect(
      getOutlineSubmitState(createMockOutline({ deadlineStatus: 'CLOSED' })).canSubmit,
    ).toBe(false)
  })
})

describe('validateOutlineFile & OUTLINE_ERROR_CODES', () => {
  it('validates empty, invalid extension, >= 10 MB, and valid outline files', () => {
    expect(validateOutlineFile(null)).toBe('Vui lòng chọn file đề cương cần tải lên.')

    const emptyFile = new File([], 'empty.pdf', { type: 'application/pdf' })
    expect(validateOutlineFile(emptyFile)).toBe('Vui lòng chọn file đề cương cần tải lên.')

    const invalidExt = new File(['abc'], 'outline.txt', { type: 'text/plain' })
    expect(validateOutlineFile(invalidExt)).toBe(
      'File đề cương chỉ hỗ trợ định dạng .doc, .docx hoặc .pdf.',
    )

    const exactLimitFile = new File(['x'], 'big.pdf', { type: 'application/pdf' })
    Object.defineProperty(exactLimitFile, 'size', { value: OUTLINE_MAX_FILE_SIZE_BYTES })
    expect(validateOutlineFile(exactLimitFile)).toBe(
      'Dung lượng file đề cương phải nhỏ hơn 10 MB.',
    )

    const validDocx = new File(['valid'], 'De_cuong.DOCX', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    expect(validateOutlineFile(validDocx)).toBeNull()
  })

  it('matches backend ErrorCode contract in API_Student_Outline.md', () => {
    expect(OUTLINE_ERROR_CODES).toMatchObject({
      OUTLINE_FILE_EMPTY: 4000,
      OUTLINE_FILE_INVALID_FORMAT: 4000,
      OUTLINE_FILE_TOO_LARGE: 4000,
      OUTLINE_TITLE_TOO_LONG: 4000,
      OUTLINE_REVIEWER_NOT_ASSIGNED: 3079,
      OUTLINE_STAGE_INVALID: 3080,
      OUTLINE_ALREADY_FINALIZED: 3081,
      OUTLINE_DEADLINE_NOT_FOUND: 3084,
      OUTLINE_SUBMISSION_DEADLINE_CLOSED: 3085,
      TOPIC_NOT_IN_PROGRESS: 3057,
    })
  })
})

