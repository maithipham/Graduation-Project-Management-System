import { apiClient } from '@/shared/api'
import { API_ENDPOINTS } from '@/shared/api/endpoints'
import type { ApiResponse } from '@/shared/types'
import { formatDate } from '@/shared/utils'
import type {
  DeadlineMilestone,
  RawDeadlinesGroupedResponse,
  TopicDeadlineInfo,
  TopicProposalCounts,
  TopicTitleFilterParams,
  TopicTitleHistoryResponse,
  TopicTitleReviewRequest,
} from '../types/topicProposal.types'

export const OUTLINE_DEADLINE_CODE = 'SV_CHINH_SUA_NOP_LAI_DE_CUONG'

export function computeTopicDeadlineStatus(
  deadline?: DeadlineMilestone | null,
): TopicDeadlineInfo {
  if (!deadline || !deadline.startDate || !deadline.endDate) {
    return {
      status: 'NOT_CONFIGURED',
      label: 'Chưa có',
      canTeacherReview: false,
      startDate: null,
      endDate: null,
    }
  }

  const now = new Date()
  const start = new Date(deadline.startDate)
  const end = new Date(deadline.endDate)

  if (deadline.status === 'COMPLETED' || now > end) {
    return {
      status: 'CLOSED',
      label: `Đã hết hạn (${formatDate(deadline.endDate, 'full')})`,
      canTeacherReview: false,
      startDate: deadline.startDate,
      endDate: deadline.endDate,
    }
  }

  if (now < start) {
    return {
      status: 'NOT_STARTED',
      label: `Chưa mở (Từ ${formatDate(deadline.startDate, 'full')})`,
      canTeacherReview: false,
      startDate: deadline.startDate,
      endDate: deadline.endDate,
    }
  }

  if (deadline.status === 'EXTENDED') {
    return {
      status: 'EXTENDED',
      label: `Đã hết hạn nộp — Đang gia hạn chấm đến ${formatDate(deadline.endDate, 'full')}`,
      canTeacherReview: true,
      startDate: deadline.startDate,
      endDate: deadline.endDate,
    }
  }

  return {
    status: 'OPEN',
    label: `Từ ${formatDate(deadline.startDate, 'full')} đến ${formatDate(deadline.endDate, 'full')}`,
    canTeacherReview: true,
    startDate: deadline.startDate,
    endDate: deadline.endDate,
  }
}

export const topicProposalService = {
  /** 1. Lấy danh sách yêu cầu tên đề tài của sinh viên hướng dẫn */
  getRequestsForSupervisor: async (
    params?: TopicTitleFilterParams,
  ): Promise<TopicTitleHistoryResponse[]> => {
    const cleanParams: Record<string, string> = {}
    if (params?.semesterId) cleanParams.semesterId = params.semesterId
    if (params?.status) cleanParams.status = params.status

    const response = await apiClient.get<ApiResponse<TopicTitleHistoryResponse[]>>(
      API_ENDPOINTS.topicTitle.supervisorRequests,
      { params: cleanParams },
    )
    return response.data.data ?? []
  },

  /** 2. GVHD chính duyệt hoặc từ chối yêu cầu */
  reviewTopicTitle: async (
    publicId: string,
    payload: TopicTitleReviewRequest,
  ): Promise<void> => {
    await apiClient.put<ApiResponse<null>>(
      API_ENDPOINTS.topicTitle.review(publicId),
      payload,
    )
  },

  /** 3. Xem toàn bộ lịch sử thay đổi tên của 1 đề tài cụ thể */
  getTopicHistory: async (
    topicPublicId: string,
  ): Promise<TopicTitleHistoryResponse[]> => {
    const response = await apiClient.get<ApiResponse<TopicTitleHistoryResponse[]>>(
      API_ENDPOINTS.topicTitle.historyByTopic(topicPublicId),
    )
    return response.data.data ?? []
  },

  /** 4. Lấy mốc thời hạn nộp đề cương / đổi tên đề tài theo học kỳ */
  getOutlineDeadline: async (
    semesterId: string,
  ): Promise<DeadlineMilestone | null> => {
    const response = await apiClient.get<ApiResponse<RawDeadlinesGroupedResponse>>(
      API_ENDPOINTS.topicTitle.deadlines,
      { params: { semesterId }, skipErrorToast: true },
    )
    const grouped = response.data.data
    const milestones = [
      ...(grouped?.thucHienDeadlines ?? []),
      ...(grouped?.stage2 ?? []),
    ]
    return (
      milestones.find(
        (m) =>
          (m.templateCode ?? m.code) === OUTLINE_DEADLINE_CODE,
      ) ?? null
    )
  },

  /** Tính tổng số lượng đơn theo từng trạng thái */
  getCounts: (items: TopicTitleHistoryResponse[]): TopicProposalCounts => {
    let pending = 0
    let approved = 0
    let rejected = 0
    for (const item of items) {
      if (item.status === 'PENDING') pending++
      else if (item.status === 'APPROVED') approved++
      else if (item.status === 'REJECTED') rejected++
    }
    return {
      pending,
      approved,
      rejected,
      all: items.length,
    }
  },
}
