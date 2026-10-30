import { useLecturerPortalStore } from '@/features/lecturer/lecturer_portal_storage'
import type { OutlineReviewItem } from '../types/outlineReview.types'

export const outlineReviewService = {
  getOutlines: (): OutlineReviewItem[] => {
    return useLecturerPortalStore.getState().outlines
  },

  approveOutline: (id: string): void => {
    useLecturerPortalStore.getState().approveOutline(id)
  },

  rejectOutline: (id: string, feedback: string): void => {
    useLecturerPortalStore.getState().rejectOutline(id, feedback)
  },

  updateFeedback: (id: string, feedback: string): void => {
    useLecturerPortalStore.getState().updateOutlineFeedback(id, feedback)
  },

  markAsRead: (id: string): void => {
    useLecturerPortalStore.getState().markOutlineAsRead(id)
  },

  resetOutlines: (): void => {
    useLecturerPortalStore.getState().resetOutlines()
  },
}

