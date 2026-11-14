import { create } from 'zustand'
import type { StudentReportSubmissionItem } from '../types/reports.types'
import { reportsService } from '../services/reports.service'

interface ReportsState {
  reportHistory: StudentReportSubmissionItem[]
  setReportHistory: (
    history:
      | StudentReportSubmissionItem[]
      | ((prev: StudentReportSubmissionItem[]) => StudentReportSubmissionItem[]),
  ) => void
}

export const useReportsStore = create<ReportsState>((set) => ({
  reportHistory: reportsService.getInitialSubmissions(),
  setReportHistory: (reportHistory) =>
    set((state) => ({
      reportHistory:
        typeof reportHistory === 'function'
          ? reportHistory(state.reportHistory)
          : reportHistory,
    })),
}))
