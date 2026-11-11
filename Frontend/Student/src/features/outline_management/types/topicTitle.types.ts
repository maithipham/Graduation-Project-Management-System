export type TopicTitleChangeStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type OutlineDeadlineStatus =
  | 'NOT_CONFIGURED'
  | 'INACTIVE'
  | 'NOT_STARTED'
  | 'OPEN'
  | 'CLOSED'
  | 'EXTENDED'

export interface TopicTitleHistoryResponse {
  publicId: string
  topicPublicId: string
  studentPublicId: string
  studentCode: string
  studentName: string
  oldName: string | null
  newName: string
  status: TopicTitleChangeStatus
  statusDescription: string
  requestedAt: string
  reviewedAt: string | null
  reviewerPublicId: string | null
  reviewerName: string | null
  canReview?: boolean
}

export interface StudentTopicOverviewResponse {
  topicPublicId: string | null
  officialName: string | null
  provisionalName: string | null
  currentStage: string | null
  currentStageDescription: string | null
  status: 'IN_PROGRESS' | 'DISQUALIFIED' | 'CANCELLED' | 'COMPLETED' | string | null
  disqualificationReason: string | null
  lecturerPublicId: string | null
  lecturerName: string | null
  coLecturerPublicId: string | null
  coLecturerName: string | null
  deadlineName: string | null
  deadlineStartDate: string | null
  deadlineEndDate: string | null
  deadlineActive: boolean | null
  deadlineStatus: OutlineDeadlineStatus
  histories: TopicTitleHistoryResponse[]
}

export interface TopicTitleSubmitRequest {
  newName: string
}

export const TOPIC_TITLE_ERROR_CODES = {
  TOPIC_NAME_EMPTY: 4000,
  ADVISOR_TOPIC_NAME_TOO_LONG: 3048,
  TOPIC_NEW_NAME_UNCHANGED: 3058,
  TOPIC_TITLE_PENDING_EXISTS: 3051,
  TOPIC_STAGE_INVALID_FOR_TITLE: 3056,
  TOPIC_NOT_IN_PROGRESS: 3057,
  TOPIC_CONFIRMATION_DEADLINE_CLOSED: 3054,
  TOPIC_CONFIRMATION_DEADLINE_NOT_FOUND: 3053,
  FORBIDDEN: 2001,
  UNAUTHORIZED: 2000,
} as const
