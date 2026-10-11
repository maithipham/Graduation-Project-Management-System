import { apiClient } from '@/shared/api/client'
import type { EvaluationScore } from '../types'

export interface IResultsService {
  getEvaluationScores(): Promise<EvaluationScore>
}

export const studentResultsService: IResultsService = {
  getEvaluationScores: async (): Promise<EvaluationScore> => {
    try {
      const res = await apiClient.get<EvaluationScore>('/student/results')
      return res.data
    } catch {
      return {
        supervisorScore: 8.8,
        reviewerScore: 8.5,
        councilScore: null,
        finalScore: null,
        status: 'scoring',
      }
    }
  },
}
