import { create } from 'zustand'
import type { ReviewPendingItem } from '../types'

interface ReviewState {
  pendingReviews: ReviewPendingItem[]
  selectedReview: ReviewPendingItem | null
  setPendingReviews: (items: ReviewPendingItem[]) => void
  setSelectedReview: (item: ReviewPendingItem | null) => void
}

export const useReviewStore = create<ReviewState>((set) => ({
  pendingReviews: [],
  selectedReview: null,
  setPendingReviews: (items) => set({ pendingReviews: items }),
  setSelectedReview: (item) => set({ selectedReview: item }),
}))
