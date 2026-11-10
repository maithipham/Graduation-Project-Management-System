export type TopicTitleChangeStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

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
  topicPublicId: string
  officialName: string | null
  provisionalName: string | null
  currentStage: string
  currentStageDescription: string
  status: 'IN_PROGRESS' | 'DISQUALIFIED' | 'CANCELLED' | 'COMPLETED' | string
  disqualificationReason: string | null
  lecturerPublicId: string
  lecturerName: string
  coLecturerPublicId: string | null
  coLecturerName: string | null
  histories: TopicTitleHistoryResponse[]
}

export interface TopicTitleSubmitRequest {
  newName: string
}

export const TOPIC_TITLE_ERROR_CODES = {
  TOPIC_NAME_EMPTY: 4000,
  ADVISOR_TOPIC_NAME_TOO_LONG: 4000,
  TOPIC_NEW_NAME_UNCHANGED: 3058,
  TOPIC_TITLE_PENDING_EXISTS: 3051,
  TOPIC_STAGE_INVALID_FOR_TITLE: 3056,
  TOPIC_NOT_IN_PROGRESS: 3057,
  TOPIC_CONFIRMATION_DEADLINE_CLOSED: 3054,
  TOPIC_CONFIRMATION_DEADLINE_NOT_FOUND: 3053,
  FORBIDDEN: 2001,
  UNAUTHORIZED: 2000,
} as const

