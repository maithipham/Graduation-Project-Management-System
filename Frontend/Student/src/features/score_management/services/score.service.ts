import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { StudentScoreResponse, StudentScoreRow } from '../types/score.types'

// Chuyển response thành 3 dòng của bảng điểm
export const toScoreRows = (s: StudentScoreResponse): StudentScoreRow[] => [
  { key: 'advisor', label: 'Hướng dẫn', weight: s.advisorWeight, score: s.advisorScore },
  {
    key: 'examiner',
    label: 'Phản biện',
    weight: s.examinerWeight,
    score: s.examinerScore,
    passed: s.examinerPassed,
  },
  { key: 'council', label: 'Hội đồng', weight: s.councilWeight, score: s.councilScore },
]

export const scoreService = {
  // Không truyền semesterId = học kỳ hiện tại
  getMyScore: async (semesterId?: string): Promise<StudentScoreResponse> => {
    const res = await apiClient.get<ApiResponse<StudentScoreResponse>>(
      API_ENDPOINTS.student.myScore,
      {
        params: semesterId ? { semesterId } : undefined,
        // 3049 / 3022 là trạng thái bình thường → trang tự hiển thị, không toast đỏ
        skipErrorToast: true,
      },
    )
    return res.data.data
  },
}
