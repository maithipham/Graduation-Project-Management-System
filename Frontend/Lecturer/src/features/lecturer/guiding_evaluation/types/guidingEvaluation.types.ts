import type {
  FinalReportStatus,
  ReportDeadlineStatus,
  ThesisFinalReportHistoryResponse,
  ThesisFinalReportResponse,
  ThesisProgressReportResponse,
} from '@/features/lecturer/report_check'

export type GuidingFinalReportDto = ThesisFinalReportResponse
export type GuidingFinalReportHistoryDto = ThesisFinalReportHistoryResponse
export type GuidingProgressReportDto = ThesisProgressReportResponse
export type GuidingFinalReportStatus = FinalReportStatus
export type GuidingDeadlineStatus = ReportDeadlineStatus

export interface RubricScores {
  r1_1: number
  r1_2: number
  r2_1: number
  r2_2: number
  r3_1: number
  r3_2: number
  r4_1: number
  r4_2: number
  r4_3: number
}

export type RubricCriterionKey = keyof RubricScores

export type GuidingEvaluationTabStatus = 'all' | 'incomplete' | 'completed'

export interface GuidingEvaluationItem {
  id: string
  publicId: string | null
  topicPublicId: string
  name: string
  mssv: string
  topic: string
  currentStage: string
  topicStatus: string
  disqualificationReason: string | null
  lecturerName: string | null
  coLecturerName: string | null
  finalReportFile: string | null
  finalReportFileName: string
  finalReportStatus: GuidingFinalReportStatus | null
  finalReportStatusDescription: string | null
  finalReportSubmittedAt: string | null
  plagiarismRate: number | null
  plagiarismFile: string | null
  supervisorFeedback: string | null
  reviewedAt: string | null
  progressReport: GuidingProgressReportDto | null
  fileName: string
  progressFileUrl: string | null
  submittedAt: string | null
  supervisorName: string | null
  supervisorNote: string | null
  canSubmitProgressReport: boolean
  canReview: boolean
  deadlineName: string | null
  deadlineStartDate: string | null
  deadlineEndDate: string | null
  deadlineActive: boolean | null
  deadlineStatus: GuidingDeadlineStatus | null
  score: number | null
  rubricScores: RubricScores | null
}

export interface GuidingEvaluationCounts {
  all: number
  incomplete: number
  completed: number
}

export interface ProgressDeadlineDisplayInfo {
  text: string
  badgeText: string | null
  canSubmitWindow: boolean
  isExpired: boolean
  isUnconfigured: boolean
}

export interface ProgressDeadlineSnapshot {
  deadlineName: string | null
  deadlineStartDate: string | null
  deadlineEndDate: string | null
  deadlineActive: boolean | null
  deadlineStatus: GuidingDeadlineStatus
}

export interface SupervisorProgressListParams {
  semesterId?: string
  status?: GuidingFinalReportStatus
}

export interface SubmitProgressReportPayload {
  topicPublicId: string
  file: File
  supervisorNote?: string
}

export const PROGRESS_REPORT_ERROR_CODES = {
  VALIDATION_ERROR: 4000,
  THESIS_TOPIC_NOT_FOUND: 3049,
  THESIS_FINAL_REPORT_NOT_FOUND: 3089,
  REPORT_STAGE_INVALID: 3090,
  REPORT_DEADLINE_NOT_FOUND: 3094,
  PROGRESS_REPORT_DEADLINE_CLOSED: 3096,
  TOPIC_NOT_IN_PROGRESS: 3057,
  FORBIDDEN: 2001,
  UNAUTHORIZED: 2000,
} as const

export interface RubricCriterionConfig {
  key: RubricCriterionKey
  code: string
  label: string
  weight: number
  group: 1 | 2 | 3 | 4
}

export interface RubricGroupConfig {
  group: 1 | 2 | 3 | 4
  title: string
  weight: number
  criteria: RubricCriterionConfig[]
}
