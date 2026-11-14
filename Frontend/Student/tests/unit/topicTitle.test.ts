import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api'
import {
  getOutlineDeadlineDisplay,
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
  it('returns unconfigured state when overview is missing or NOT_CONFIGURED / INACTIVE', () => {
    expect(getOutlineDeadlineDisplay(null)).toMatchObject({
      text: 'Chưa cấu hình thời hạn nộp',
      isOpenForStudent: false,
      lockedReason:
        'Học kỳ hiện tại chưa được cấu hình thời hạn nộp đề cương và cập nhật tên đề tài.',
    })

    expect(
      getOutlineDeadlineDisplay({
        deadlineStartDate: null,
        deadlineEndDate: null,
        deadlineStatus: 'INACTIVE',
      }),
    ).toMatchObject({
      text: 'Chưa cấu hình thời hạn nộp',
      isOpenForStudent: false,
      lockedReason:
        'Học kỳ hiện tại chưa được cấu hình thời hạn nộp đề cương và cập nhật tên đề tài.',
    })
  })

  it('returns OPEN display with formatted start and end dates and allows student actions', () => {
    const res = getOutlineDeadlineDisplay({
      deadlineStartDate: '2026-11-01T00:00:00',
      deadlineEndDate: '2026-11-20T23:59:59',
      deadlineStatus: 'OPEN',
    })
    expect(res.text).toContain('Từ ')
    expect(res.text).toContain('(Đang mở)')
    expect(res.isOpenForStudent).toBe(true)
    expect(res.lockedReason).toBeNull()
  })

  it('locks student actions on NOT_STARTED, EXTENDED, and CLOSED with unified reasons', () => {
    const notStarted = getOutlineDeadlineDisplay({
      deadlineStartDate: '2026-11-15T08:00:00',
      deadlineEndDate: '2026-11-20T23:59:59',
      deadlineStatus: 'NOT_STARTED',
    })
    expect(notStarted.text).toContain('Chưa mở')
    expect(notStarted.isOpenForStudent).toBe(false)
    expect(notStarted.lockedReason).toContain('thời hạn nộp đề cương và cập nhật tên đề tài')

    const extended = getOutlineDeadlineDisplay({
      deadlineStartDate: '2026-11-01T00:00:00',
      deadlineEndDate: '2026-11-22T23:59:59',
      deadlineStatus: 'EXTENDED',
    })
    expect(extended.text).toContain('Đang trong thời gian gia hạn chấm của giảng viên')
    expect(extended.isOpenForStudent).toBe(false)
    expect(extended.lockedReason).toContain('gia hạn chấm cho giảng viên')

    const closed = getOutlineDeadlineDisplay({
      deadlineStartDate: '2026-11-01T00:00:00',
      deadlineEndDate: '2026-11-10T23:59:59',
      deadlineStatus: 'CLOSED',
    })
    expect(closed.text).toContain('Đã hết hạn')
    expect(closed.isOpenForStudent).toBe(false)
    expect(closed.lockedReason).toContain('Thời hạn nộp đề cương và cập nhật tên đề tài')
  })
})
