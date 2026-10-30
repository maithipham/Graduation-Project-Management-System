export type TopicProposalApprovalStatus = 'pending' | 'approved' | 'rejected'

export type TopicProposalTabStatus = TopicProposalApprovalStatus | ''

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

export interface TopicProposalCounts {
  pending: number
  approved: number
  rejected: number
  all: number
}

export interface TopicProposalFilterParams {
  tabStatus?: TopicProposalTabStatus
  searchQuery?: string
}

