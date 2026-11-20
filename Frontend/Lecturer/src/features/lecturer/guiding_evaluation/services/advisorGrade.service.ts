import { API_ENDPOINTS, apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type {
  AdvisorGradeSheet,
  AdvisorGradeSheetBody,
  AdvisorGradeTopicList,
} from '../types/advisorGrade.types'

const GRADE = API_ENDPOINTS.advisorGrade

// Giống @Service bên Spring nhưng chỉ gọi HTTP: trả đúng DTO của BE (res.data.data), không xử lý giao diện.
// C4 / C5 có `skipErrorToast`: lỗi hiện ngay trong popup phiếu chấm thay vì toast đỏ.

export const advisorGradeService = {
  /** C1 – danh sách đề tài cần chấm + thống kê. Bỏ trống semesterId = học kỳ đang diễn ra */
  async getTopics(semesterId?: string): Promise<AdvisorGradeTopicList> {
    const res = await apiClient.get<ApiResponse<AdvisorGradeTopicList>>(GRADE.topics, {
      params: semesterId ? { semesterId } : undefined,
    })
    return res.data.data
  },

  /** C2 – mở phiếu; chưa có thì BE tạo phiếu Nháp (gọi lại nhiều lần vẫn an toàn) */
  async openSheet(topicPublicId: string): Promise<AdvisorGradeSheet> {
    const res = await apiClient.post<ApiResponse<AdvisorGradeSheet>>(GRADE.openSheet(topicPublicId))
    return res.data.data
  },

  /** C3 – chi tiết phiếu */
  async getSheet(sheetPublicId: string): Promise<AdvisorGradeSheet> {
    const res = await apiClient.get<ApiResponse<AdvisorGradeSheet>>(GRADE.sheet(sheetPublicId))
    return res.data.data
  },

  /** C4 – lưu nháp (BE không trả data) */
  async saveDraft(sheetPublicId: string, body: AdvisorGradeSheetBody): Promise<void> {
    await apiClient.put<ApiResponse<null>>(GRADE.sheet(sheetPublicId), body, {
      skipErrorToast: true,
    })
  },

  /** C5 – nộp phiếu, khóa vĩnh viễn; trả phiếu đã khóa */
  async submit(sheetPublicId: string, body: AdvisorGradeSheetBody): Promise<AdvisorGradeSheet> {
    const res = await apiClient.post<ApiResponse<AdvisorGradeSheet>>(GRADE.submit(sheetPublicId), body, {
      skipErrorToast: true,
    })
    return res.data.data
  },
}
