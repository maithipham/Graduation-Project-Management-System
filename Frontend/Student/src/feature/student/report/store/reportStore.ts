import { create } from 'zustand'
import type { WeeklyReport } from '../types'

interface ReportState {
  reports: WeeklyReport[]
  setReports: (reports: WeeklyReport[]) => void
}

export const useReportStore = create<ReportState>((set) => ({
  reports: [],
  setReports: (reports) => set({ reports }),
}))
