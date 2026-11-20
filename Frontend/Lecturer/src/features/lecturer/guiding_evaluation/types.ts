import type {
  EvaluationSheetDetail,
  EvaluationSheetStatus,
  ThesisStage,
} from '@/features/lecturer/defense_management'

export type AdvisorTopicStatus = 'OFFICIAL' | 'IN_PROGRESS' | 'COMPLETED' | 'DISQUALIFIED' | 'CANCELLED'

// GET /report/advisor-evaluation/my (sheet = null) và GET /report/advisor-evaluation/{topicPublicId} (có sheet)
export interface AdvisorEvaluation {
  topicPublicId: string
  studentCode: string | null
  studentName: string | null
  className: string | null
  topicName: string | null
  currentStage: ThesisStage
  topicStatus: AdvisorTopicStatus
  // Phiếu theo dõi tiến độ GVHD đã nộp (null = chưa nộp)
  progressFileUrl: string | null
  progressSubmittedAt: string | null
  progressNote: string | null
  sheetStatus: EvaluationSheetStatus | null // null = chưa chấm
  advisorScore: number | null // điểm Hướng dẫn đã ghi nhận (phiếu đã nộp)
  // Mốc NOP_BAO_CAO_VA_PHIEU_THEO_DOI
  gradingStartAt: string | null
  gradingEndAt: string | null
  gradingOpen: boolean
  editable: boolean
  sheet: EvaluationSheetDetail | null
}

export interface AdvisorEvaluationRequest {
  criteriaScores: { criteriaPublicId: string; score: number | null }[]
  generalComment: string | null
  submit: boolean // false = Lưu nháp, true = Lưu chính thức
}

export type AdvisorEvaluationFilter = 'all' | 'incomplete' | 'completed'
