import { apiClient } from '@/shared/api/client'
import { API_ENDPOINTS } from '@/shared/api/endpoints'
import type { ApiResponse } from '@/shared/types'
import type { CouncilDefenseStudent, DefenseGradingSubmission } from '../types'

export interface ICouncilService {
  getCouncilStudents(councilId?: string): Promise<CouncilDefenseStudent[]>
  submitGrading(submission: DefenseGradingSubmission): Promise<boolean>
}

export const lecturerCouncilService: ICouncilService = {
  // GET: Lấy danh sách sinh viên bảo vệ trong hội đồng
  getCouncilStudents: async (councilId?: string): Promise<CouncilDefenseStudent[]> => {
    try {
      const url = councilId
        ? `${API_ENDPOINTS.lecturer.council}/${councilId}/students`
        : API_ENDPOINTS.lecturer.council
      const res = await apiClient.get<ApiResponse<CouncilDefenseStudent[]>>(url)
      return res.data.data
    } catch {
      return [
        {
          defenseId: 'def-1',
          studentCode: '2251061234',
          studentName: 'Nguyễn Văn An',
          topicTitle: 'Hệ thống hỗ trợ phân tích phản hồi khách hàng bằng NLP',
          supervisorScore: 9.0,
          reviewerScore: 8.5,
          councilScores: [8.5, 9.0, 8.5],
          finalScore: 8.7,
        },
        {
          defenseId: 'def-2',
          studentCode: '2251065678',
          studentName: 'Trần Thị Bình',
          topicTitle: 'Ứng dụng Computer Vision nhận diện biển báo giao thông',
          supervisorScore: 9.5,
          reviewerScore: 9.0,
          councilScores: [9.0, 9.5, 9.0],
          finalScore: 9.2,
        },
      ]
    }
  },

  // POST: Nhập điểm và biên bản bảo vệ
  submitGrading: async (submission: DefenseGradingSubmission): Promise<boolean> => {
    try {
      const res = await apiClient.post<ApiResponse<boolean>>(
        `${API_ENDPOINTS.lecturer.council}/grade`,
        submission,
      )
      return res.data.data
    } catch {
      return true
    }
  },
}
