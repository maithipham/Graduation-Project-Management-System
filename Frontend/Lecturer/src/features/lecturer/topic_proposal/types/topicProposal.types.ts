export type TopicTitleChangeStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface TopicTitleHistoryResponse {
  publicId: string
  topicPublicId: string
  studentPublicId: string
  studentCode: string
  studentName: string
  oldName: string | null // null nếu là chốt tên lần đầu
  newName: string
  status: TopicTitleChangeStatus
  statusDescription: string
  requestedAt: string
  reviewedAt: string | null
  reviewerPublicId: string | null
  reviewerName: string | null
  canReview: boolean // Chỉ true khi là GVHD chính
}

export interface TopicTitleReviewRequest {
  decision: 'APPROVED' | 'REJECTED'
}

export interface TopicTitleFilterParams {
  semesterId?: string
  status?: TopicTitleChangeStatus
}

export type TopicDeadlineDisplayStatus =
  | 'NOT_CONFIGURED'
  | 'NOT_STARTED'
  | 'OPEN'
  | 'EXTENDED'
  | 'CLOSED'

export interface TopicDeadlineInfo {
  status: TopicDeadlineDisplayStatus
  label: string
  canTeacherReview: boolean
  startDate: string | null
  endDate: string | null
}

export interface DeadlineMilestone {
  deadlineId?: string
  code?: string | null
  templateCode?: string | null
  name?: string | null
  startDate?: string | null
  endDate?: string | null
  status?: string | null
  active?: boolean | null
}

export interface RawDeadlinesGroupedResponse {
  thucHienDeadlines?: DeadlineMilestone[] | null
  stage2?: DeadlineMilestone[] | null
}

export type TopicProposalApprovalStatus = 'pending' | 'approved' | 'rejected'

export type TopicProposalTabStatus = TopicTitleChangeStatus | ''

export interface TopicProposalCounts {
  pending: number
  approved: number
  rejected: number
  all: number
}

// Giữ lại TopicProposalItem để tương thích với các type import nội bộ khác (nếu có)
export interface TopicProposalItem {
  id: string
  mssv: string
  name: string
  major: string
  topic: string
  oldTopic: string
  isRename: boolean
  submittedDate: string
  academicYear: string
  semester: string
  status: TopicProposalApprovalStatus
  approvedAt?: string
  rejectedAt?: string
  rejectReason?: string
  description: string
}
