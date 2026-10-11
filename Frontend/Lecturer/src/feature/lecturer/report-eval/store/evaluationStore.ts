import { create } from 'zustand'
import type { ProgressEvaluationDto } from '../types'

interface EvaluationState {
  reports: ProgressEvaluationDto[]
  selectedReport: ProgressEvaluationDto | null
  setReports: (reports: ProgressEvaluationDto[]) => void
  setSelectedReport: (report: ProgressEvaluationDto | null) => void
}

export const useEvaluationStore = create<EvaluationState>((set) => ({
  reports: [],
  selectedReport: null,
  setReports: (reports) => set({ reports }),
  setSelectedReport: (report) => set({ selectedReport: report }),
}))
