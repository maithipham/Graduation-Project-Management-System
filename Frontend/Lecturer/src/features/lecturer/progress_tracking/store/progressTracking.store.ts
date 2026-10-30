import { useLecturerPortalStore } from '@/features/lecturer/lecturer_portal_storage'
import type { TrackingSheetItem } from '../types/progressTracking.types'

export const useProgressTrackingStore = () => {
  const trackingSheets = useLecturerPortalStore((s) => s.trackingSheets)
  const submitTrackingSheet = useLecturerPortalStore((s) => s.submitTrackingSheet)

  return {
    trackingSheets: trackingSheets as TrackingSheetItem[],
    submitTrackingSheet,
  }
}

