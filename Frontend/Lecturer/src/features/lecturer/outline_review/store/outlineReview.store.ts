import { useLecturerPortalStore } from '@/features/lecturer/lecturer_portal_storage'
import type { OutlineReviewItem } from '../types/outlineReview.types'

export const useOutlineReviewStore = () => {
  const outlines = useLecturerPortalStore((s) => s.outlines)
  const readOutlineIds = useLecturerPortalStore((s) => s.readOutlineIds)
  const approveOutline = useLecturerPortalStore((s) => s.approveOutline)
  const rejectOutline = useLecturerPortalStore((s) => s.rejectOutline)
  const updateOutlineFeedback = useLecturerPortalStore((s) => s.updateOutlineFeedback)
  const markOutlineAsRead = useLecturerPortalStore((s) => s.markOutlineAsRead)
  const resetOutlines = useLecturerPortalStore((s) => s.resetOutlines)

  return {
    outlines: outlines as OutlineReviewItem[],
    readOutlineIds,
    approveOutline,
    rejectOutline,
    updateOutlineFeedback,
    markOutlineAsRead,
    resetOutlines,
  }
}

