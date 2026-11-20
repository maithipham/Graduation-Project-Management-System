import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type {
  CouncilEvaluation,
  CouncilEvaluationRequest,
  CouncilGradingBoard,
  CouncilScoreSummaryItem,
  DefenseMinutes,
  DefenseMinutesRequest,
  DefenseRevision,
  DefenseRevisionReviewRequest,
  DefenseScoreBoard,
} from '../types'

const EP = API_ENDPOINTS.defenseEvaluation

// Bước 14 (Inter 3): chấm điểm Hội đồng, bảng điểm, biên bản, hoàn tất bảo vệ, duyệt bản sửa sau bảo vệ
export const defenseEvaluationService = {
  // GET /defense-council/{councilPublicId}/council-evaluation
  getGradingBoard: async (councilPublicId: string): Promise<CouncilGradingBoard> => {
    const res = await apiClient.get<ApiResponse<CouncilGradingBoard>>(
      EP.gradingBoard(councilPublicId),
    )
    return res.data.data
  },

  // GET /defense-assignment/{id}/council-evaluation
  getCouncilEvaluation: async (
    defenseAssignmentPublicId: string,
  ): Promise<CouncilEvaluation> => {
    const res = await apiClient.get<ApiResponse<CouncilEvaluation>>(
      EP.councilEvaluation(defenseAssignmentPublicId),
    )
    return res.data.data
  },

  // PUT /defense-assignment/{id}/council-evaluation
  saveCouncilEvaluation: async (
    defenseAssignmentPublicId: string,
    data: CouncilEvaluationRequest,
  ): Promise<void> => {
    const res = await apiClient.put<ApiResponse<void>>(
      EP.councilEvaluation(defenseAssignmentPublicId),
      data,
    )
    return res.data.data
  },

  // GET /defense-score/{id}
  getScoreBoard: async (defenseAssignmentPublicId: string): Promise<DefenseScoreBoard> => {
    const res = await apiClient.get<ApiResponse<DefenseScoreBoard>>(
      EP.scoreBoard(defenseAssignmentPublicId),
    )
    return res.data.data
  },

  // GET /defense-council/{councilPublicId}/defense-score
  getCouncilScoreBoards: async (
    councilPublicId: string,
  ): Promise<CouncilScoreSummaryItem[]> => {
    const res = await apiClient.get<ApiResponse<CouncilScoreSummaryItem[]>>(
      EP.councilScoreBoards(councilPublicId),
    )
    return res.data.data
  },

  // GET /defense-assignment/{id}/defense-minutes
  getMinutes: async (defenseAssignmentPublicId: string): Promise<DefenseMinutes> => {
    const res = await apiClient.get<ApiResponse<DefenseMinutes>>(
      EP.minutes(defenseAssignmentPublicId),
    )
    return res.data.data
  },

  // PUT /defense-assignment/{id}/defense-minutes (lưu nháp)
  saveMinutes: async (
    defenseAssignmentPublicId: string,
    data: DefenseMinutesRequest,
  ): Promise<void> => {
    const res = await apiClient.put<ApiResponse<void>>(
      EP.minutes(defenseAssignmentPublicId),
      data,
    )
    return res.data.data
  },

  // PATCH /defense-assignment/{id}/defense-minutes/finalize (chốt biên bản)
  finalizeMinutes: async (defenseAssignmentPublicId: string): Promise<void> => {
    const res = await apiClient.patch<ApiResponse<void>>(
      EP.finalizeMinutes(defenseAssignmentPublicId),
    )
    return res.data.data
  },

  // POST /defense-assignment/{id}/completion (Hoàn tất bảo vệ)
  completeDefense: async (defenseAssignmentPublicId: string): Promise<void> => {
    const res = await apiClient.post<ApiResponse<void>>(
      EP.completion(defenseAssignmentPublicId),
    )
    return res.data.data
  },

  // GET /defense-revision/{revisionPublicId}
  getRevision: async (revisionPublicId: string): Promise<DefenseRevision> => {
    const res = await apiClient.get<ApiResponse<DefenseRevision>>(
      EP.revisionDetail(revisionPublicId),
    )
    return res.data.data
  },

  // PATCH /defense-revision/{revisionPublicId}/review
  reviewRevision: async (
    revisionPublicId: string,
    data: DefenseRevisionReviewRequest,
  ): Promise<void> => {
    const res = await apiClient.patch<ApiResponse<void>>(
      EP.revisionReview(revisionPublicId),
      data,
    )
    return res.data.data
  },
}
