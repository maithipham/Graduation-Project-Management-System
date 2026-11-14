export type ReportStatus = 'pending' | 'approved' | 'rejected' | 'not_submitted'

export type ReportTabStatus = 'pending' | 'rejected' | 'not_submitted' | 'approved' | ''

export interface ReportSubmissionHistoryEntry {
  submitIndex: number
  submittedDate: string
  fileName: string
  fileUrl?: string
  status: string
  processedAt?: string
  note: string
}

export interface ReportCheckItem {
  id: string
  mssv: string
  name: string
  topic: string
  cohort?: string
  studentClass?: string
  reportFileName: string
  reportFileUrl: string
  reportSubmittedAt: string
  status: ReportStatus
  approvedAt?: string
  rejectedAt?: string
  plagiarismFile: string
  plagiarismRate: number | null
  comment: string
  hasDownloaded?: boolean
  history?: ReportSubmissionHistoryEntry[]
}

export interface ReportCheckSummary {
  total: number
  submittedCount: number
  notSubmittedCount: number
  hasPlagCount: number
  approvedCount: number
}

export interface ReportCheckCounts {
  pending: number
  rejected: number
  notSubmitted: number
  approved: number
  all: number
}

export interface ReportPreviewDocState {
  fileName: string
  studentName: string
  studentMssv?: string
  studentClass?: string
  topic?: string
  docType: string
}
