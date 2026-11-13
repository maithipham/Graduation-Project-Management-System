export type {
  DeadlineMilestone,
  RawDeadlinesGroupedResponse,
} from '@/features/lecturer/topic_proposal/types/topicProposal.types'

export type OutlineStatus =
  | 'PENDING'
  | 'REQUEST_CHANGES'
  | 'APPROVED'
  | 'REJECTED'

export type ThesisStage =
  | 'STAGE_1_ADVISOR_ASSIGNED'
  | 'STAGE_2_TOPIC_CONFIRMED'
  | 'STAGE_3_OUTLINE_APPROVED'
  | string

export type TopicStatus =
  | 'IN_PROGRESS'
  | 'DISQUALIFIED'
  | 'COMPLETED'
  | string

export type DeadlineStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'EXTENDED'
  | 'COMPLETED'

export interface ThesisOutlineHistoryResponse {
  publicId: string
  outlineHistoryFile: string
  submissionNote?: string | null
  status: OutlineStatus
  statusDescription: string
  submittedAt: string
  reviewerPublicId?: string | null
  reviewerName?: string | null
  reviewFeedback?: string | null
  reviewedAt?: string | null
}

export interface ThesisOutlineResponse {
  publicId: string
  topicPublicId: string
  topicName?: string | null
  currentStage: ThesisStage
  topicStatus: TopicStatus
  disqualificationReason?: string | null
  studentPublicId: string
  studentCode: string
  studentName: string
  lecturerPublicId?: string | null
  lecturerName?: string | null
  coLecturerPublicId?: string | null
  coLecturerName?: string | null
  reviewerPublicId?: string | null
  reviewerName?: string | null
  title?: string | null
  outlineFile?: string | null
  status?: OutlineStatus | null
  statusDescription?: string | null
  reviewFeedback?: string | null
  advisorFeedback?: string | null
  submittedAt?: string | null
  reviewedAt?: string | null
  canReview: boolean
  canWriteAdvisorFeedback: boolean
  deadlineName?: string | null
  deadlineStartDate?: string | null
  deadlineEndDate?: string | null
  deadlineActive?: boolean | null
  deadlineStatus?: string | null
  histories?: ThesisOutlineHistoryResponse[] | null
}

export interface OutlineReviewRequest {
  decision: OutlineStatus
  feedback: string
}

export interface OutlineAdvisorFeedbackRequest {
  feedback: string
}

export interface OutlineFilterParams {
  semesterId?: string
  status?: OutlineStatus
}

export interface OutlineDeadlineInfo {
  status: 'NOT_CONFIGURED' | 'OPEN' | 'EXTENDED' | 'CLOSED' | 'NOT_STARTED'
  label: string
  canReview: boolean
  canWriteFeedback: boolean
  startDate: string | null
  endDate: string | null
  rawStatus?: string | null
}

export type OutlineRole = 'guide' | 'reviewer'

export type OutlineTabStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REQUEST_CHANGES'
  | 'REJECTED'
  | ''

export interface OutlineReviewCounts {
  pending: number
  approved: number
  requestChanges: number
  rejected: number
  all: number
}

// ============================================================================
// Legacy types giữ lại để đảm bảo tương thích ngược với lecturer_portal_storage
// ============================================================================
export interface OutlineSubmissionHistoryEntry {
  submitIndex: number
  submittedDate: string
  fileName: string
  status: string
  processedAt?: string
  approvedAt?: string
  note: string
}

export interface OutlineReviewItem {
  id: string
  mssv: string
  name: string
  topic: string
  fileName: string
  fileUrl: string
  submitCount: number
  isResubmitted?: boolean
  submittedDate: string
  approvedAt?: string
  rejectedAt?: string
  academicYear: string
  semester: string
  status: any
  role: any
  supervisorName?: string
  feedback: string
  previousRejectReason?: string
  history: OutlineSubmissionHistoryEntry[]
}
