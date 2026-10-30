import { useLecturerPortalStore } from '@/features/lecturer/lecturer_portal_storage'
import type {
  GuidingScoreItem,
  GuidingScoreStats,
} from '../types/guidingScore.types'

export const guidingScoreService = {
  getGuidingScores: (): GuidingScoreItem[] => {
    return useLecturerPortalStore.getState().guidingScores
  },

  saveGuidingScore: (id: string, score: number | null, comment: string): void => {
    useLecturerPortalStore.getState().saveGuidingScore(id, score, comment)
  },

  getStats: (items: GuidingScoreItem[]): GuidingScoreStats => {
    const total = items.length
    const gradedCount = items.filter(
      (x) => x.score !== null && x.score !== undefined,
    ).length
    const ungradedCount = total - gradedCount
    return { total, gradedCount, ungradedCount }
  },
}

