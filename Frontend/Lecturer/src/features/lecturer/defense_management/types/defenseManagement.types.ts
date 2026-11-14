export type DefenseReviewStatus = 'pending' | 'approved' | 'rejected'

export interface DefenseCouncilStudentSlot {
  order: number
  name: string
  mssv: string
  timeSlot: string
}

export interface DefenseCouncilItem {
  id: string
  codeBadge: string
  badgeVariant: 'blue' | 'purple'
  title: string
  sessionLabel: string
  sessionVariant: 'amber' | 'slate'
  timeRange: string
  location: string
  lecturerRole: string
  committeeSummary: string
  actionLabel: string
  students: DefenseCouncilStudentSlot[]
}

export interface DefenseReviewItem {
  id: string
  mssv: string
  name: string
  topic: string
  major: string
  supervisorName: string
  reportFileName: string
  score: number | null
  status: DefenseReviewStatus
}

