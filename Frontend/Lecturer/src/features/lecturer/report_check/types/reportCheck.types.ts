export type FinalReportStatus = 'PENDING' | 'REQUEST_CHANGES' | 'APPROVED' | 'REJECTED'

export type FinalReportDecision = 'APPROVED' | 'REQUEST_CHANGES' | 'REJECTED'

export type ReportDeadlineStatus =
  | 'NOT_CONFIGURED'
  | 'INACTIVE'
  | 'NOT_STARTED'
  | 'OPEN'
  | 'EXTENDED'
  | 'CLOSED'

export interface ThesisProgressReportResponse {
  publicId: string
  topicPublicId: string
  supervisorPublicId: string | null
  supervisorName: string | null
  progressFile: string
  supervisorNote: string | null
  submittedAt: string | null
}

export interface ThesisFinalReportHistoryResponse {
  publicId: string
  finalHistoryFile: string
  plagiarismRate: number | null
  plagiarismHistoryFile: string | null
  status: FinalReportStatus
  statusDescription: string
  supervisorFeedback: string | null
  submittedAt: string
  reviewedAt: string | null
}

export interface ThesisFinalReportResponse {
  publicId: string | null
  topicPublicId: string
  topicName: string
  currentStage: string
  topicStatus: string
  disqualificationReason: string | null
  studentPublicId: string
  studentCode: string
  studentName: string
  lecturerPublicId: string | null
  lecturerName: string | null
  coLecturerPublicId: string | null
  coLecturerName: string | null
  finalReportFile: string | null
  plagiarismRate: number | null
  plagiarismFile: string | null
  supervisorFeedback: string | null
  status: FinalReportStatus | null
  statusDescription: string | null
  submittedAt: string | null
  reviewedAt: string | null
  progressReport: ThesisProgressReportResponse | null
  canSubmitProgressReport: boolean
  canReview: boolean
  deadlineName: string | null
  deadlineStartDate: string | null
  deadlineEndDate: string | null
  deadlineActive: boolean | null
  deadlineStatus: ReportDeadlineStatus | null
  histories: ThesisFinalReportHistoryResponse[] | null
}

export type ReportStatus =
  | 'pending'
  | 'request_changes'
  | 'rejected'
  | 'approved'
  | 'not_submitted'

export type ReportTabStatus = 'pending' | 'rejected' | 'not_submitted' | 'approved' | ''

export interface ReportCheckItem {
  id: string
  publicId: string | null
  topicPublicId: string
  mssv: string
  name: string
  topic: string
  currentStage: string
  topicStatus: string
  disqualificationReason: string | null
  lecturerName: string | null
  coLecturerName: string | null
  reportFileName: string
  reportFileUrl: string | null
  reportSubmittedAt: string | null
  reviewedAt: string | null
  status: ReportStatus
  apiStatus: FinalReportStatus | null
  statusDescription: string | null
  plagiarismFile: string
  plagiarismFileUrl: string | null
  plagiarismRate: number | null
  comment: string | null
  progressReport: ThesisProgressReportResponse | null
  canSubmitProgressReport: boolean
  canReview: boolean
  deadlineName: string | null
  deadlineStartDate: string | null
  deadlineEndDate: string | null
  deadlineActive: boolean | null
  deadlineStatus: ReportDeadlineStatus | null
}

export interface ReportCheckCounts {
  pending: number
  rejected: number
  notSubmitted: number
  approved: number
  all: number
}

export interface SupervisorReportDeadlineInfo {
  text: string
  badgeText: string | null
  isExpired: boolean
  isUnconfigured: boolean
  canReviewWindow: boolean
  allowedDecisions: FinalReportDecision[]
}

export interface ReportDeadlineSnapshot {
  deadlineName: string | null
  deadlineStartDate: string | null
  deadlineEndDate: string | null
  deadlineActive: boolean | null
  deadlineStatus: ReportDeadlineStatus
}

export interface SupervisorReportListParams {
  semesterId?: string
  status?: FinalReportStatus
}

export interface ReviewFinalReportPayload {
  publicId: string
  plagiarismRate: number
  plagiarismFile: File
  decision: FinalReportDecision
  feedback?: string
}

export const REPORT_REVIEW_ERROR_CODES = {
  VALIDATION_ERROR: 4000,
  THESIS_FINAL_REPORT_NOT_FOUND: 3089,
  REPORT_DEADLINE_NOT_FOUND: 3094,
  FINAL_REPORT_SUBMISSION_DEADLINE_CLOSED: 3095,
  FINAL_REPORT_GRADING_CLOSED: 3097,
  FINAL_REPORT_NOT_PENDING: 3092,
  PROGRESS_REPORT_NOT_SUBMITTED: 3093,
  TOPIC_NOT_IN_PROGRESS: 3057,
  FORBIDDEN: 2001,
  UNAUTHORIZED: 2000,
} as const
