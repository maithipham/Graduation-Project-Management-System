export type TrackingSheetStatus = 'submitted' | 'not_submitted'

export interface TrackingSheetItem {
  id: string
  mssv: string
  name: string
  topic: string
  fileName: string
  submittedAt: string
  status: TrackingSheetStatus
}

export interface ProgressTrackingStats {
  total: number
  submitted: number
  unsubmitted: number
}

