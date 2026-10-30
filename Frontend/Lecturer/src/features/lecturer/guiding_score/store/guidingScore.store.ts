import { useLecturerPortalStore } from '@/features/lecturer/lecturer_portal_storage'
import type { GuidingScoreItem } from '../types/guidingScore.types'

export const useGuidingScoreStore = () => {
  const guidingScores = useLecturerPortalStore((s) => s.guidingScores)
  const saveGuidingScore = useLecturerPortalStore((s) => s.saveGuidingScore)

  return {
    guidingScores: guidingScores as GuidingScoreItem[],
    saveGuidingScore,
  }
}

