export type FinalReportStatus = 'PENDING' | 'REQUEST_CHANGES' | 'APPROVED' | 'REJECTED'

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
  topicPublicId: string | null
  topicName: string | null
  currentStage: string | null
  topicStatus: string | null
  disqualificationReason: string | null
  studentPublicId: string | null
  studentCode: string | null
  studentName: string | null
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
  deadlineStatus: ReportDeadlineStatus
  histories: ThesisFinalReportHistoryResponse[]
}

export const FINAL_REPORT_ERROR_CODES = {
  REPORT_FILE_EMPTY: 4000,
  REPORT_FILE_INVALID_FORMAT: 4000,
  REPORT_FILE_TOO_LARGE: 4000,
  CLOUDINARY_SERVICE_FAIL: 4000,
  THESIS_FINAL_REPORT_NOT_FOUND: 3089,
  REPORT_STAGE_INVALID: 3090,
  FINAL_REPORT_ALREADY_FINALIZED: 3091,
  REPORT_DEADLINE_NOT_FOUND: 3094,
  FINAL_REPORT_SUBMISSION_DEADLINE_CLOSED: 3095,
  TOPIC_NOT_IN_PROGRESS: 3057,
} as const
