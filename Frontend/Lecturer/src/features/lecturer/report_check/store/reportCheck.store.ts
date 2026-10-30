import { useLecturerPortalStore } from '@/features/lecturer/lecturer_portal_storage'
import type { ReportCheckItem } from '../types/reportCheck.types'

export const useReportCheckStore = () => {
  const reports = useLecturerPortalStore((s) => s.reports)
  const approveReport = useLecturerPortalStore((s) => s.approveReport)
  const rejectReport = useLecturerPortalStore((s) => s.rejectReport)
  const submitPlagiarismResult = useLecturerPortalStore((s) => s.submitPlagiarismResult)

  return {
    reports: reports as ReportCheckItem[],
    approveReport,
    rejectReport,
    submitPlagiarismResult,
  }
}

