import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api'
import { topicTitleService } from '@/features/outline_management'
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

  it('getMyTopicOverview calls GET /topic/my-title-history and returns data', async () => {
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

