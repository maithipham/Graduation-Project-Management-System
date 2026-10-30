export type OutlineStatus = 'pending' | 'approved' | 'rejected' | 'not_submitted'

export type OutlineRole = 'guide' | 'reviewer'

export type OutlineTabStatus = 'pending' | 'approved' | 'rejected' | ''

export type RejectedSubTab = 'rejected_resubmitted' | 'rejected_unsubmitted'

export type OutlineCategory = 'approved' | 'resubmitted' | 'rejected' | 'pending' | 'not_submitted'

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
  status: OutlineStatus
  role: OutlineRole
  supervisorName?: string
  feedback: string
  previousRejectReason?: string
  history: OutlineSubmissionHistoryEntry[]
}

export interface OutlineReviewCounts {
  pending: number
  approved: number
  rejected: number
  resubmitted: number
  unsubmitted: number
  all: number
}
