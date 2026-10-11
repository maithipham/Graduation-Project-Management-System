import { apiClient } from '@/shared/api/client'
import type { OverviewProgress } from '../types'

export interface IOverviewService {
  getProgress(): Promise<OverviewProgress>
}

export const overviewService: IOverviewService = {
  getProgress: async (): Promise<OverviewProgress> => {
    try {
      const res = await apiClient.get<OverviewProgress>('/student/overview/progress')
      return res.data
    } catch {
      return {
        currentStage: 3,
        totalStages: 6,
        nextDeadline: '2026-10-18',
        nextTaskTitle: 'Nộp đề cương',
        isOutlineNeedsRevision: true,
      }
    }
  },
}
