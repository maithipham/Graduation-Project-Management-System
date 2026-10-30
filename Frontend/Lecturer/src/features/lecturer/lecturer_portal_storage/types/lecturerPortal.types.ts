import type { SupervisorRequestItem } from '@/features/lecturer/supervisor_registration/types/supervisorRegistration.types'
import type { TopicProposalItem } from '@/features/lecturer/topic_proposal/types/topicProposal.types'
import type { OutlineReviewItem } from '@/features/lecturer/outline_review/types/outlineReview.types'
import type { ReportCheckItem } from '@/features/lecturer/report_check/types/reportCheck.types'
import type { TrackingSheetItem } from '@/features/lecturer/progress_tracking/types/progressTracking.types'
import type { GuidingScoreItem } from '@/features/lecturer/guiding_score/types/guidingScore.types'
import type {
  DefenseCouncilItem,
  DefenseReviewItem,
} from '@/features/lecturer/defense_management/types/defenseManagement.types'
import type { LecturerDocumentTemplate } from '@/features/lecturer/template_management/types/templateManagement.types'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface TeacherProfile {
  code: string
  name: string
  title: string
  degree: string
  faculty: string
  department: string
  email: string
  phone: string
  quota: number
  currentLoad: number
  year: string
  semester: string
  workplace?: string
  isExternal?: boolean
}

export interface LecturerNavBadges {
  supervisorRequests: number
  topicProposals: number
  outlines: number
  reports: number
}

export interface LecturerPortalState {
  academicYear: string
  semester: string
  teacher: TeacherProfile
  supervisorRequests: SupervisorRequestItem[]
  topicProposals: TopicProposalItem[]
  outlines: OutlineReviewItem[]
  reports: ReportCheckItem[]
  trackingSheets: TrackingSheetItem[]
  guidingScores: GuidingScoreItem[]
  defenseCouncils: DefenseCouncilItem[]
  defenseReviews: DefenseReviewItem[]
  documentTemplates: LecturerDocumentTemplate[]
  readOutlineIds: string[]

  setAcademicFilter: (year: string, semester: string) => void

  approveSupervisorRequest: (id: string) => void
  rejectSupervisorRequest: (id: string, reason?: string) => void

  approveTopicProposal: (id: string) => void
  rejectTopicProposal: (id: string, reason?: string) => void

  markOutlineAsRead: (id: string) => void
  approveOutline: (id: string) => void
  rejectOutline: (id: string, feedback: string) => void
  updateOutlineFeedback: (id: string, feedback: string) => void
  resetOutlines: () => void

  approveReport: (id: string) => void
  rejectReport: (id: string, comment?: string) => void
  submitPlagiarismResult: (id: string, fileName: string, rate: number) => void

  submitTrackingSheet: (id: string, customFileName?: string) => void

  saveGuidingScore: (id: string, score: number | null, comment: string) => void

  updateDefenseReviewScore: (id: string, score: number | null) => void
  approveDefenseReview: (id: string) => void
  rejectDefenseReview: (id: string) => void
  updateTeacherProfile: (profile: Partial<TeacherProfile>) => void
}
