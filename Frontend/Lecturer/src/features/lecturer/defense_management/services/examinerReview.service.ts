import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type {
  AssignExaminersRequest,
  CouncilExaminerBoard,
  ExaminerEvaluation,
  ExaminerEvaluationRequest,
  MyCouncil,
  MyExaminerAssignment,
  ScheduleExaminerReviewRequest,
} from '../types'

export const examinerReviewService = {
  // 1. GET /defense-council/my (?semesterId=)
  getMyCouncils: async (semesterId?: string): Promise<MyCouncil[]> => {
    const res = await apiClient.get<ApiResponse<MyCouncil[]>>(
      API_ENDPOINTS.examinerReview.myCouncils,
      {
        params: semesterId ? { semesterId } : undefined,
      },
    )
    return res.data.data
  },

  // 2. GET /defense-council/{councilPublicId}/examiner
  getCouncilBoard: async (
    councilPublicId: string,
  ): Promise<CouncilExaminerBoard> => {
    const res = await apiClient.get<ApiResponse<CouncilExaminerBoard>>(
      API_ENDPOINTS.examinerReview.councilBoard(councilPublicId),
    )
    return res.data.data
  },

  // 3. PUT /defense-assignment/{defenseAssignmentPublicId}/examiner
  assignExaminers: async (
    defenseAssignmentPublicId: string,
    data: AssignExaminersRequest,
  ): Promise<void> => {
    const res = await apiClient.put<ApiResponse<void>>(
      API_ENDPOINTS.examinerReview.assignExaminers(defenseAssignmentPublicId),
      data,
      {
        skipErrorToast: true,
      },
    )
    return res.data.data
  },

  // 4. GET /examiner-assignment/my (?semesterId=)
  getMyAssignments: async (
    semesterId?: string,
  ): Promise<MyExaminerAssignment[]> => {
    const res = await apiClient.get<ApiResponse<MyExaminerAssignment[]>>(
      API_ENDPOINTS.examinerReview.myAssignments,
      {
        params: semesterId ? { semesterId } : undefined,
      },
    )
    return res.data.data
  },

  // 5. PUT /examiner-assignment/{examinerAssignmentPublicId}/schedule
  scheduleReview: async (
    examinerAssignmentPublicId: string,
    data: ScheduleExaminerReviewRequest,
  ): Promise<void> => {
    const res = await apiClient.put<ApiResponse<void>>(
      API_ENDPOINTS.examinerReview.schedule(examinerAssignmentPublicId),
      data,
      {
        skipErrorToast: true,
      },
    )
    return res.data.data
  },

  // 6. GET /examiner-assignment/{examinerAssignmentPublicId}/evaluation
  getEvaluation: async (
    examinerAssignmentPublicId: string,
  ): Promise<ExaminerEvaluation> => {
    const res = await apiClient.get<ApiResponse<ExaminerEvaluation>>(
      API_ENDPOINTS.examinerReview.evaluation(examinerAssignmentPublicId),
    )
    return res.data.data
  },

  // 7. PUT /examiner-assignment/{examinerAssignmentPublicId}/evaluation
  saveEvaluation: async (
    examinerAssignmentPublicId: string,
    data: ExaminerEvaluationRequest,
  ): Promise<void> => {
    const res = await apiClient.put<ApiResponse<void>>(
      API_ENDPOINTS.examinerReview.evaluation(examinerAssignmentPublicId),
      data,
      {
        skipErrorToast: true,
      },
    )
    return res.data.data
  },

  // 8. PATCH /examiner-assignment/{examinerAssignmentPublicId}/decision
  updateDecision: async (
    examinerAssignmentPublicId: string,
    decision: 'APPROVED' | 'REJECTED',
  ): Promise<void> => {
    const res = await apiClient.patch<ApiResponse<void>>(
      API_ENDPOINTS.examinerReview.decision(examinerAssignmentPublicId),
      { decision },
    )
    return res.data.data
  },

  // 9. POST /examiner-assignment/{examinerAssignmentPublicId}/review-file
  uploadReviewFile: async (
    examinerAssignmentPublicId: string,
    file: File,
  ): Promise<void> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.examinerReview.reviewFile(examinerAssignmentPublicId),
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        skipErrorToast: true,
      },
    )
    return res.data.data
  },
}
