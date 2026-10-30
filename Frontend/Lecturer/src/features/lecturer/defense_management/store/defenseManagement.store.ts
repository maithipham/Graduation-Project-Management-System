import { useLecturerPortalStore } from '@/features/lecturer/lecturer_portal_storage'
import type {
  DefenseCouncilItem,
  DefenseReviewItem,
} from '../types/defenseManagement.types'

export const useDefenseManagementStore = () => {
  const defenseCouncils = useLecturerPortalStore((s) => s.defenseCouncils)
  const defenseReviews = useLecturerPortalStore((s) => s.defenseReviews)
  const updateDefenseReviewScore = useLecturerPortalStore((s) => s.updateDefenseReviewScore)
  const approveDefenseReview = useLecturerPortalStore((s) => s.approveDefenseReview)
  const rejectDefenseReview = useLecturerPortalStore((s) => s.rejectDefenseReview)

  return {
    defenseCouncils: defenseCouncils as DefenseCouncilItem[],
    defenseReviews: defenseReviews as DefenseReviewItem[],
    updateDefenseReviewScore,
    approveDefenseReview,
    rejectDefenseReview,
  }
}

