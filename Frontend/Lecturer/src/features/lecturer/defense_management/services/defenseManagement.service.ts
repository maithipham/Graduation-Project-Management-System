import { useLecturerPortalStore } from '@/features/lecturer/lecturer_portal_storage'
import type {
  DefenseCouncilItem,
  DefenseReviewItem,
} from '../types/defenseManagement.types'

export const defenseManagementService = {
  getCouncils: (): DefenseCouncilItem[] => {
    return useLecturerPortalStore.getState().defenseCouncils
  },

  getReviews: (): DefenseReviewItem[] => {
    return useLecturerPortalStore.getState().defenseReviews
  },

  updateReviewScore: (id: string, score: number | null): void => {
    useLecturerPortalStore.getState().updateDefenseReviewScore(id, score)
  },

  approveReview: (id: string): void => {
    useLecturerPortalStore.getState().approveDefenseReview(id)
  },

  rejectReview: (id: string): void => {
    useLecturerPortalStore.getState().rejectDefenseReview(id)
  },
}

