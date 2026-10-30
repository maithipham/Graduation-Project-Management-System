import { useLecturerPortalStore } from '@/features/lecturer/lecturer_portal_storage'
import type {
  ReportCheckItem,
  ReportCheckSummary,
} from '../types/reportCheck.types'

export const reportCheckService = {
  getReports: (): ReportCheckItem[] => {
    return useLecturerPortalStore.getState().reports
  },

  approveReport: (id: string): void => {
    useLecturerPortalStore.getState().approveReport(id)
  },

  rejectReport: (id: string, comment?: string): void => {
    useLecturerPortalStore.getState().rejectReport(id, comment)
  },

  submitPlagiarismResult: (id: string, fileName: string, rate: number): void => {
    useLecturerPortalStore.getState().submitPlagiarismResult(id, fileName, rate)
  },

  getSummary: (items: ReportCheckItem[]): ReportCheckSummary => {
    const total = items.length
    const submittedCount = items.filter(
      (r) => Boolean(r.reportFileName) && r.status !== 'not_submitted',
    ).length
    const notSubmittedCount = total - submittedCount
    const hasPlagCount = items.filter((r) => Boolean(r.plagiarismFile)).length
    const approvedCount = items.filter((r) => r.status === 'approved').length
    return { total, submittedCount, notSubmittedCount, hasPlagCount, approvedCount }
  },
}

