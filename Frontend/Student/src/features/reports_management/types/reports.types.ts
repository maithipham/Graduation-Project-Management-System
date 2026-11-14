import type { SemesterCode } from '@/shared/contexts'

export type ReportSubmissionStatus = 'Đã duyệt' | 'Đã từ chối' | 'Chờ duyệt'

export interface StudentReportSubmissionItem {
  id: number
  year: string
  semester: SemesterCode
  time: string
  fileName: string
  status: ReportSubmissionStatus
  approvedTime?: string
  plagiarismFile?: string
  plagiarismRate?: number
  note: string
}

