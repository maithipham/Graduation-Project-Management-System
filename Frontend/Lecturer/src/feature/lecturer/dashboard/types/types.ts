export interface LecturerDashboardStats {
  supervisedCount: number
  maxQuota: number
  pendingOutlinesCount: number
  weeklyReportsCount: number
  councilsCount: number
}

export interface SupervisedStudent {
  msv: string
  name: string
  topic: string
  status: string
}
