import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { AdvisorEvaluation, AdvisorEvaluationRequest } from '../types'

const EP = API_ENDPOINTS.advisorEvaluation

// GVHD chính / GV đồng hướng dẫn: mỗi người chấm phiếu hướng dẫn (ADVISOR) của riêng mình; GVHD chính nộp Phiếu theo dõi tiến độ
export const advisorEvaluationService = {
  // GET /report/advisor-evaluation/my (?semesterPublicId=, bỏ trống = học kỳ đang diễn ra)
  getMyEvaluations: async (semesterPublicId?: string): Promise<AdvisorEvaluation[]> => {
    const res = await apiClient.get<ApiResponse<AdvisorEvaluation[]>>(EP.my, {
      params: semesterPublicId ? { semesterPublicId } : undefined,
    })
    return res.data.data
  },

  // GET /report/advisor-evaluation/{topicPublicId}
  getEvaluation: async (topicPublicId: string): Promise<AdvisorEvaluation> => {
    const res = await apiClient.get<ApiResponse<AdvisorEvaluation>>(EP.detail(topicPublicId))
    return res.data.data
  },

  // PUT /report/advisor-evaluation/{topicPublicId}
  saveEvaluation: async (topicPublicId: string, data: AdvisorEvaluationRequest): Promise<void> => {
    const res = await apiClient.put<ApiResponse<void>>(EP.detail(topicPublicId), data)
    return res.data.data
  },

  // POST /report/progress-report (multipart: topicPublicId, file, supervisorNote)
  submitProgressReport: async (topicPublicId: string, file: File, supervisorNote?: string): Promise<void> => {
    const formData = new FormData()
    formData.append('topicPublicId', topicPublicId)
    formData.append('file', file)
    if (supervisorNote?.trim()) formData.append('supervisorNote', supervisorNote.trim())
    const res = await apiClient.post<ApiResponse<void>>(EP.progressReport, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },
}
