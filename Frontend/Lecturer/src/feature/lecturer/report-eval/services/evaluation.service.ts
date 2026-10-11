import { apiClient } from '@/shared/api/client'
import { API_ENDPOINTS } from '@/shared/api/endpoints'
import type { ApiResponse } from '@/shared/types'
import type { ProgressEvaluationDto } from '../types'

export interface IEvaluationService {
  getStudentReports(): Promise<ProgressEvaluationDto[]>
  submitEvaluation(dto: ProgressEvaluationDto): Promise<boolean>
}

export const lecturerEvaluationService: IEvaluationService = {
  // GET: Lấy danh sách báo cáo tiến độ cần nhận xét
  getStudentReports: async (): Promise<ProgressEvaluationDto[]> => {
    try {
      const res = await apiClient.get<ApiResponse<ProgressEvaluationDto[]>>(
        API_ENDPOINTS.lecturer.reportEvaluation,
      )
      return res.data.data
    } catch {
      return [
        {
          reportId: 'rep-1',
          studentId: '2251061234',
          weekNumber: 4,
          comment: 'Đã hoàn thiện sơ đồ cơ sở dữ liệu và mockup UI.',
          progressScore: 8.5,
          isSatisfactory: true,
        },
        {
          reportId: 'rep-2',
          studentId: '2251065678',
          weekNumber: 4,
          comment: 'Thu thập xong tập dataset biển báo giao thông 5,000 ảnh.',
          progressScore: 9.0,
          isSatisfactory: true,
        },
      ]
    }
  },

  // POST: Gửi nhận xét và đánh giá tiến độ tuần
  submitEvaluation: async (
    dto: ProgressEvaluationDto,
  ): Promise<boolean> => {
    try {
      const res = await apiClient.post<ApiResponse<boolean>>(
        API_ENDPOINTS.lecturer.reportEvaluation,
        dto,
      )
      return res.data.data
    } catch {
      return true
    }
  },
}
