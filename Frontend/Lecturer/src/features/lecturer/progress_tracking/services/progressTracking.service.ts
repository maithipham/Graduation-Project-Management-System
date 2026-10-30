import { useLecturerPortalStore } from '@/features/lecturer/lecturer_portal_storage'
import type {
  TrackingSheetItem,
  ProgressTrackingStats,
} from '../types/progressTracking.types'

export const progressTrackingService = {
  getTrackingSheets: (): TrackingSheetItem[] => {
    return useLecturerPortalStore.getState().trackingSheets
  },

  submitTrackingSheet: (id: string, customFileName?: string): void => {
    useLecturerPortalStore.getState().submitTrackingSheet(id, customFileName)
  },

  getStats: (items: TrackingSheetItem[]): ProgressTrackingStats => {
    const total = items.length
    const submitted = items.filter((x) => x.status === 'submitted').length
    const unsubmitted = total - submitted
    return { total, submitted, unsubmitted }
  },
}

