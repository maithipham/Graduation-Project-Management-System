export interface WeeklyReport {
  id: string
  weekNumber: number
  tasksDone: string
  nextWeekTasks: string
  difficulties?: string
  submittedAt: string
  status: 'submitted' | 'reviewed'
  lecturerComment?: string
}
