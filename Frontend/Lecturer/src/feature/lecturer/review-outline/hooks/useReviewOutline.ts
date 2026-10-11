import { useState, useEffect } from 'react'
import { lecturerReviewService } from '../services/review.service'
import type { ReviewPendingItem, OutlineReviewSubmission } from '../types'

export function useReviewOutline() {
  const [reviews, setReviews] = useState<ReviewPendingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    lecturerReviewService.getPendingReviews().then((res) => {
      if (mounted) {
        setReviews(res)
        setIsLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  const submitReview = async (submission: OutlineReviewSubmission) => {
    const success = await lecturerReviewService.submitReview(submission)
    if (success) {
      setReviews((prev) => prev.filter((r) => r.id !== submission.outlineId))
    }
    return success
  }

  return { reviews, isLoading, submitReview }
}
