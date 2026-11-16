import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import { formatDate, saveBlob } from '@/shared/utils'
import type {
  DeadlineMilestone,
  RawDeadlinesGroupedResponse,
} from '@/features/lecturer/topic_proposal/types/topicProposal.types'
import type {
  OutlineAdvisorFeedbackRequest,
  OutlineDeadlineInfo,
  OutlineFilterParams,
  OutlineReviewCounts,
  OutlineReviewRequest,
  ThesisOutlineResponse,
} from '../types/outlineReview.types'
import {
  getFileNameFromUrl,
  isSafeOutlineFileUrl,
} from '../utils/outlineReview.utils'

const OUTLINE_DEADLINE_CODE = 'SV_CHINH_SUA_NOP_LAI_DE_CUONG'

export function computeOutlineDeadlineStatus(
  deadline?: DeadlineMilestone | null,
): OutlineDeadlineInfo {
  if (!deadline || !deadline.startDate || !deadline.endDate) {
    return {
      status: 'NOT_CONFIGURED',
      label: 'Chưa có',
      canReview: false,
      canWriteFeedback: false,
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
      canReview: false,
      canWriteFeedback: false,
      startDate: deadline.startDate,
      endDate: deadline.endDate,
      rawStatus: deadline.status,
    }
  }

  if (now < start) {
    return {
      status: 'NOT_STARTED',
      label: `Chưa mở (Từ ${formatDate(deadline.startDate, 'full')})`,
      canReview: false,
      canWriteFeedback: false,
      startDate: deadline.startDate,
      endDate: deadline.endDate,
      rawStatus: deadline.status,
    }
  }

  if (deadline.status === 'EXTENDED') {
    return {
      status: 'EXTENDED',
      label: `Đã hết hạn nộp — Đang gia hạn chấm đến ${formatDate(deadline.endDate, 'full')}`,
      canReview: true,
      canWriteFeedback: true,
      startDate: deadline.startDate,
      endDate: deadline.endDate,
      rawStatus: deadline.status,
    }
  }

  return {
    status: 'OPEN',
    label: `Hạn review: Từ ${formatDate(deadline.startDate, 'full')} đến ${formatDate(deadline.endDate, 'full')}`,
    canReview: true,
    canWriteFeedback: true,
    startDate: deadline.startDate,
    endDate: deadline.endDate,
    rawStatus: deadline.status,
  }
}

export const outlineReviewService = {
  /** 1. GVHD xem danh sách đề cương sinh viên mình hướng dẫn (chính hoặc phụ) */
  getSupervisorList: async (
    params?: OutlineFilterParams,
  ): Promise<ThesisOutlineResponse[]> => {
    const cleanParams: Record<string, string> = {}
    if (params?.semesterId) cleanParams.semesterId = params.semesterId
    if (params?.status) cleanParams.status = params.status

    const response = await apiClient.get<ApiResponse<ThesisOutlineResponse[]>>(
      API_ENDPOINTS.outline.supervisorList,
      { params: cleanParams },
    )
    return response.data.data ?? []
  },

  /** 2. GVNX xem danh sách đề cương sinh viên được phân công thẩm định */
  getReviewerList: async (
    params?: OutlineFilterParams,
  ): Promise<ThesisOutlineResponse[]> => {
    const cleanParams: Record<string, string> = {}
    if (params?.semesterId) cleanParams.semesterId = params.semesterId
    if (params?.status) cleanParams.status = params.status

    const response = await apiClient.get<ApiResponse<ThesisOutlineResponse[]>>(
      API_ENDPOINTS.outline.reviewList,
      { params: cleanParams },
    )
    return response.data.data ?? []
  },

  /** 3. Xem chi tiết 1 đề cương kèm lịch sử các lần nộp */
  getDetail: async (publicId: string): Promise<ThesisOutlineResponse> => {
    const response = await apiClient.get<ApiResponse<ThesisOutlineResponse>>(
      API_ENDPOINTS.outline.detail(publicId),
    )
    return response.data.data
  },

  /** 4. GVNX thẩm định đề cương (APPROVED / REQUEST_CHANGES / REJECTED) */
  reviewOutline: async (
    publicId: string,
    payload: OutlineReviewRequest,
  ): Promise<void> => {
    await apiClient.put<ApiResponse<null>>(
      API_ENDPOINTS.outline.review(publicId),
      payload,
      { skipErrorToast: true },
    )
  },

  /** 5. GVHD chính gửi nhận xét góp ý đề cương */
  writeAdvisorFeedback: async (
    publicId: string,
    payload: OutlineAdvisorFeedbackRequest,
  ): Promise<void> => {
    await apiClient.put<ApiResponse<null>>(
      API_ENDPOINTS.outline.advisorFeedback(publicId),
      payload,
      { skipErrorToast: true },
    )
  },

  /** 6. Lấy mốc deadline của học kỳ */
  getOutlineDeadline: async (
    semesterId: string,
  ): Promise<DeadlineMilestone | null> => {
    const response = await apiClient.get<
      ApiResponse<RawDeadlinesGroupedResponse | DeadlineMilestone[]>
    >(API_ENDPOINTS.outline.deadlines, {
      params: { semesterId },
      skipErrorToast: true,
    })
    const grouped = response.data.data
    let milestones: DeadlineMilestone[] = []
    if (Array.isArray(grouped)) {
      milestones = grouped
    } else if (grouped && typeof grouped === 'object') {
      milestones = [
        ...(grouped.giaoNhanDeadlines ?? []),
        ...(grouped.thucHienDeadlines ?? []),
        ...(grouped.danhGiaDeadlines ?? []),
        ...(grouped.stage1 ?? []),
        ...(grouped.stage2 ?? []),
        ...(grouped.stage3 ?? []),
      ]
    }
    return (
      milestones.find(
        (m) =>
          (m.templateCode ?? m.code) === OUTLINE_DEADLINE_CODE,
      ) ??
      milestones.find((m) => (m.templateCode ?? m.code) === 'NOP_DE_CUONG') ??
      milestones.find((m) => (m.templateCode ?? m.code) === 'CHOT_TEN_DE_TAI') ??
      milestones.find((m) => m.name?.toLowerCase().includes('đề cương')) ??
      null
    )
  },

  /** Tính tổng số lượng theo từng tab trạng thái */
  getCounts: (items: ThesisOutlineResponse[]): OutlineReviewCounts => {
    let pending = 0
    let approved = 0
    let requestChanges = 0
    let rejected = 0

    for (const item of items) {
      if (item.status === 'PENDING') pending++
      else if (item.status === 'APPROVED') approved++
      else if (item.status === 'REQUEST_CHANGES') requestChanges++
      else if (item.status === 'REJECTED') rejected++
    }

    return {
      pending,
      approved,
      requestChanges,
      rejected,
      all: items.length,
    }
  },
}

/** Tải file đề cương về máy (Blob / forced attachment download) */
export async function downloadOutlineFile(
  fileUrl: string,
  fallbackFilename: string,
): Promise<void> {
  if (!isSafeOutlineFileUrl(fileUrl)) return
  try {
    const res = await fetch(fileUrl)
    if (!res.ok) throw new Error('Download failed')
    const blob = await res.blob()
    saveBlob({
      blob,
      filename: getFileNameFromUrl(fileUrl, fallbackFilename),
    })
  } catch {
    // Nếu fetch trực tiếp bị CORS chặn -> thử tạo link với fl_attachment nếu là Cloudinary
    let downloadUrl = fileUrl
    if (fileUrl.includes('/upload/') && !fileUrl.includes('fl_attachment')) {
      downloadUrl = fileUrl.replace('/upload/', '/upload/fl_attachment/')
    }
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = getFileNameFromUrl(fileUrl, fallbackFilename)
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }
}
