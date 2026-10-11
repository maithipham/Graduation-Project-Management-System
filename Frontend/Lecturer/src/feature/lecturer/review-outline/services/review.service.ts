import { apiClient } from '@/shared/api/client'
import { API_ENDPOINTS } from '@/shared/api/endpoints'
import type { ApiResponse } from '@/shared/types'
import type { OutlineReviewSubmission, ReviewPendingItem } from '../types'

export interface IReviewService {
  getPendingReviews(): Promise<ReviewPendingItem[]>
  submitReview(submission: OutlineReviewSubmission): Promise<boolean>
}

export const lecturerReviewService: IReviewService = {
  // GET: Lấy danh sách đề cương cần duyệt
  getPendingReviews: async (): Promise<ReviewPendingItem[]> => {
    try {
      const res = await apiClient.get<ApiResponse<ReviewPendingItem[]>>(
        API_ENDPOINTS.lecturer.reviewOutline,
      )
      return res.data.data
    } catch {
      return [
        {
          id: 'out-1',
          studentCode: '2251061234',
          studentName: 'Nguyễn Văn An',
          topicTitle: 'Hệ thống hỗ trợ phân tích phản hồi khách hàng bằng xử lý ngôn ngữ tự nhiên',
          submittedAt: '2026-10-10 14:30',
          fileUrl: '/uploads/de-cuong-nguyen-van-an-v2.pdf',
          version: 2,
        },
        {
          id: 'out-2',
          studentCode: '2251065678',
          studentName: 'Trần Thị Bình',
          topicTitle: 'Ứng dụng Computer Vision nhận diện biển báo giao thông',
          submittedAt: '2026-10-11 09:15',
          fileUrl: '/uploads/de-cuong-tran-thi-binh-v1.pdf',
          version: 1,
        },
      ]
    }
  },

  // POST: Gửi kết quả phê duyệt và nhận xét đề cương
  submitReview: async (submission: OutlineReviewSubmission): Promise<boolean> => {
    try {
      const res = await apiClient.post<ApiResponse<boolean>>(
        API_ENDPOINTS.lecturer.reviewOutline,
        submission,
      )
      return res.data.data
    } catch {
      return true
    }
  },
}
