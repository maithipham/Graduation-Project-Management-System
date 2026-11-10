import { apiClient } from '@/shared/api'
import { API_ENDPOINTS } from '@/shared/api/endpoints'
import type { ApiResponse } from '@/shared/types'
import type {
  StudentTopicOverviewResponse,
  TopicTitleSubmitRequest,
} from '../types/topicTitle.types'

export const topicTitleService = {
  // Lấy thông tin đề tài và toàn bộ lịch sử
  async getMyTopicOverview(semesterId?: string): Promise<StudentTopicOverviewResponse> {
    const res = await apiClient.get<ApiResponse<StudentTopicOverviewResponse>>(
      API_ENDPOINTS.topicTitle.overview,
      { params: semesterId ? { semesterId } : undefined },
    )
    return res.data.data
  },

  // Chốt tên đề tài chính thức lần đầu (Giai đoạn 2)
  async confirmInitialTitle(payload: TopicTitleSubmitRequest): Promise<void> {
    await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.topicTitle.confirmInitial,
      payload,
    )
  },

  // Xin đổi tên đề tài (sau khi đã có tên chính thức)
  async requestChangeTitle(payload: TopicTitleSubmitRequest): Promise<void> {
    await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.topicTitle.requestChange,
      payload,
    )
  },
}

