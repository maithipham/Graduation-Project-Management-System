export type ReportStatus = 'pending' | 'approved' | 'rejected' | 'not_submitted'

export interface ReportCheckItem {
  id: string
  mssv: string
  name: string
  topic: string
  reportFileName: string
  reportFileUrl: string
  reportSubmittedAt: string
  status: ReportStatus
  approvedAt?: string
  rejectedAt?: string
  plagiarismFile: string
  plagiarismRate: number | null
  comment: string
}

export interface ReportCheckSummary {
  total: number
  submittedCount: number
  notSubmittedCount: number
  hasPlagCount: number
  approvedCount: number
}

export interface ReportPreviewDocState {
  fileName: string
  studentName: string
  docType: string
}
