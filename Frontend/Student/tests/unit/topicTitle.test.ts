import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api'
import {
  formatOutlineDeadlineName,
  getOutlineDeadlineDisplay,
  hasConfiguredDeadline,
  hasDistinctTopicDeadline,
  topicTitleService,
} from '@/features/outline_management'
import type { StudentTopicOverviewResponse } from '@/features/outline_management'

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
  },
}))

describe('Topic Title Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getMyTopicOverview calls GET /topic/my-title-history and returns data including deadline', async () => {
    const mockOverview: StudentTopicOverviewResponse = {
      topicPublicId: '018db26a-932f-789a-bc01-e23456789abc',
      officialName: 'Xây dựng hệ thống Quản lý Đồ án TLU',
      provisionalName: 'Nghiên cứu ứng dụng GPMS',
      currentStage: 'STAGE_2_TOPIC_CONFIRMED',
      currentStageDescription: 'Đã chốt tên đề tài chính thức',
      status: 'IN_PROGRESS',
      disqualificationReason: null,
      lecturerPublicId: 'lecturer-uuid',
      lecturerName: 'ThS. Trần Văn Bình',
      coLecturerPublicId: null,
      coLecturerName: null,
      deadlineName: 'Hạn sinh viên chỉnh sửa & nộp lại đề cương',
      deadlineStartDate: '2026-11-01T00:00:00',
      deadlineEndDate: '2026-11-20T23:59:59',
      deadlineActive: true,
      deadlineStatus: 'OPEN',
      histories: [],
    }

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        code: 1000,
        message: null,
        data: mockOverview,
      },
    })

    const result = await topicTitleService.getMyTopicOverview('semester-123')

    expect(apiClient.get).toHaveBeenCalledWith('/topic/my-title-history', {
      params: { semesterId: 'semester-123' },
    })
    expect(result).toEqual(mockOverview)
  })

  it('confirmInitialTitle calls POST /topic/confirm-title', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        code: 1000,
        message: 'Gửi tên đề tài chính thức thành công',
        data: null,
      },
    })

    await topicTitleService.confirmInitialTitle({
      newName: 'Tên đề tài chính thức mới',
    })

    expect(apiClient.post).toHaveBeenCalledWith('/topic/confirm-title', {
      newName: 'Tên đề tài chính thức mới',
    })
  })

  it('requestChangeTitle calls POST /topic/change-title', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        code: 1000,
        message: 'Gửi yêu cầu đổi tên đề tài thành công',
        data: null,
      },
    })

    await topicTitleService.requestChangeTitle({
      newName: 'Tên đề tài xin đổi mới',
    })

    expect(apiClient.post).toHaveBeenCalledWith('/topic/change-title', {
      newName: 'Tên đề tài xin đổi mới',
    })
  })
})

describe('getOutlineDeadlineDisplay', () => {
  it('returns unconfigured state when overview is missing or NOT_CONFIGURED / INACTIVE and respects fallbackName', () => {
    expect(getOutlineDeadlineDisplay(null)).toMatchObject({
      text: 'Chưa cấu hình thời hạn nộp',
      isOpenForStudent: false,
      lockedReason: 'Học kỳ hiện tại chưa được cấu hình thời hạn nộp.',
    })

    expect(
      getOutlineDeadlineDisplay(
        {
          deadlineName: null,
          deadlineStartDate: null,
          deadlineEndDate: null,
          deadlineStatus: 'NOT_CONFIGURED',
        },
        { fallbackName: 'Thời hạn chốt tên đề tài' },
      ),
    ).toMatchObject({
      text: 'Chưa cấu hình thời hạn nộp',
      isOpenForStudent: false,
      lockedReason: 'Học kỳ hiện tại chưa được cấu hình thời hạn chốt tên đề tài.',
    })

    expect(
      getOutlineDeadlineDisplay(
        {
          deadlineStartDate: null,
          deadlineEndDate: null,
          deadlineStatus: 'INACTIVE',
        },
        { fallbackName: 'Thời hạn nộp đề cương (áp dụng cho đổi tên đề tài)' },
      ),
    ).toMatchObject({
      text: 'Chưa cấu hình thời hạn nộp',
      isOpenForStudent: false,
      lockedReason:
        'Học kỳ hiện tại chưa được cấu hình thời hạn nộp đề cương (áp dụng cho đổi tên đề tài).',
    })
  })

  it('returns OPEN display with formatted start and end dates and allows student actions', () => {
    const res = getOutlineDeadlineDisplay({
      deadlineName: 'Hạn chốt tên đề tài',
      deadlineStartDate: '2026-11-01T00:00:00',
      deadlineEndDate: '2026-11-20T23:59:59',
      deadlineStatus: 'OPEN',
    })
    expect(res.text).toContain('Từ ')
    expect(res.text).toContain('(Đang mở)')
    expect(res.isOpenForStudent).toBe(true)
    expect(res.lockedReason).toBeNull()
  })

  it('locks student actions on NOT_STARTED, EXTENDED, and CLOSED using deadlineName from BE', () => {
    const notStarted = getOutlineDeadlineDisplay({
      deadlineName: 'Hạn chốt tên đề tài',
      deadlineStartDate: '2026-11-15T08:00:00',
      deadlineEndDate: '2026-11-20T23:59:59',
      deadlineStatus: 'NOT_STARTED',
    })
    expect(notStarted.text).toContain('Chưa mở')
    expect(notStarted.isOpenForStudent).toBe(false)
    expect(notStarted.lockedReason).toContain('Hạn chốt tên đề tài chưa mở')

    const extended = getOutlineDeadlineDisplay({
      deadlineName: 'Hạn sinh viên chỉnh sửa & nộp lại đề cương',
      deadlineStartDate: '2026-11-01T00:00:00',
      deadlineEndDate: '2026-11-22T23:59:59',
      deadlineStatus: 'EXTENDED',
    })
    expect(extended.text).toContain('Đang trong thời gian gia hạn chấm của giảng viên')
    expect(extended.isOpenForStudent).toBe(false)
    expect(extended.lockedReason).toContain('hạn nộp đề cương cho sinh viên')
    expect(extended.lockedReason).toContain('gia hạn chấm cho giảng viên')

    const closed = getOutlineDeadlineDisplay({
      deadlineName: 'Hạn chốt tên đề tài',
      deadlineStartDate: '2026-11-01T00:00:00',
      deadlineEndDate: '2026-11-10T23:59:59',
      deadlineStatus: 'CLOSED',
    })
    expect(closed.text).toContain('Đã hết hạn')
    expect(closed.isOpenForStudent).toBe(false)
    expect(closed.lockedReason).toBeNull()
  })

  it('normalizes verbose outline deadline name to Hạn nộp đề cương', () => {
    expect(formatOutlineDeadlineName('Hạn sinh viên chỉnh sửa & nộp lại đề cương')).toBe(
      'Hạn nộp đề cương',
    )
    expect(formatOutlineDeadlineName('Hạn chốt tên đề tài')).toBe('Hạn chốt tên đề tài')
    expect(formatOutlineDeadlineName(null)).toBe('Thời hạn nộp')
  })
})

describe('hasConfiguredDeadline and hasDistinctTopicDeadline', () => {
  it('returns true only when topic deadline is configured and differs from outline deadline', () => {
    const chotTenDeadline = {
      deadlineName: 'Hạn chốt tên đề tài',
      deadlineStartDate: '2026-11-01T00:00:00',
      deadlineEndDate: '2026-11-10T23:59:59',
      deadlineStatus: 'OPEN' as const,
    }
    const outlineDeadline = {
      deadlineName: 'Hạn sinh viên chỉnh sửa & nộp lại đề cương',
      deadlineStartDate: '2026-11-01T00:00:00',
      deadlineEndDate: '2026-11-20T23:59:59',
      deadlineStatus: 'OPEN' as const,
    }
    const unconfiguredDeadline = {
      deadlineName: null,
      deadlineStartDate: null,
      deadlineEndDate: null,
      deadlineStatus: 'NOT_CONFIGURED' as const,
    }

    expect(hasConfiguredDeadline(unconfiguredDeadline)).toBe(false)
    expect(hasConfiguredDeadline(chotTenDeadline)).toBe(true)

    expect(hasDistinctTopicDeadline(chotTenDeadline, outlineDeadline)).toBe(true)
    expect(hasDistinctTopicDeadline(outlineDeadline, { ...outlineDeadline })).toBe(false)
    expect(hasDistinctTopicDeadline(unconfiguredDeadline, outlineDeadline)).toBe(false)
  })
})
