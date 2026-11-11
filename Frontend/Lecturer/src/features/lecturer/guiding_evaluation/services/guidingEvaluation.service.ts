import { useLecturerPortalStore } from '@/features/lecturer/lecturer_portal_storage'
import type {
  GuidingEvaluationCounts,
  GuidingEvaluationItem,
  RubricScores,
} from '../types/guidingEvaluation.types'
import { isEvaluationCompleted } from '../utils/guidingEvaluation.utils'

export const guidingEvaluationService = {
  getItems: (): GuidingEvaluationItem[] => {
    return useLecturerPortalStore.getState().guidingEvaluations
  },

  submitTrackingFile: (id: string, fileName: string): void => {
    useLecturerPortalStore.getState().submitEvaluationTrackingFile(id, fileName)
  },

  saveRubricEvaluation: (
    id: string,
    score: number | null,
    rubricScores: RubricScores,
    isDraft = false,
  ): void => {
    useLecturerPortalStore
      .getState()
      .saveEvaluationRubric(id, score, rubricScores, isDraft)
  },

  getCounts: (items: GuidingEvaluationItem[]): GuidingEvaluationCounts => {
    const completed = items.filter(isEvaluationCompleted).length
    const all = items.length
    return {
      all,
      completed,
      incomplete: all - completed,
    }
  },
}

