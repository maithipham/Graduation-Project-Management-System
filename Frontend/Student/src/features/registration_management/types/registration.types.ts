
export type AdvisorRegistrationStatus =
  | 'PENDING'
  | 'TEACHER_APPROVED'
  | 'HOD_APPROVED'
  | 'REJECTED'
  | 'HOD_REJECTED'
  | 'ASSIGNED_BY_HOD'

export type AdvisorRegistrationDeadlineStatus =
  | 'NOT_CONFIGURED'
  | 'INACTIVE'
  | 'NOT_STARTED'
  | 'CLOSED'
  | 'OPEN'

export interface AvailableAdvisor {
  teacherPublicId: string
  teacherCode: string | null
  teacherName: string | null
  academicTitle: string | null
  organization: string | null
  majorName: string | null
  maxStudents: number
  occupiedStudents: number
  remainingSlots: number
  pendingCount: number
}

export interface AdvisorRegistrationResponse {
  registrationPublicId: string
  studentPublicId: string | null
  semesterPublicId: string | null
  teacherPublicId: string
  studentCode: string | null
  studentName: string | null
  majorName: string | null
  teacherCode: string | null
  teacherName: string | null
  topicName: string | null
  status: AdvisorRegistrationStatus
  statusDescription: string | null
  submittedAt: string | null
  processedAt: string | null
}

export interface SubmitAdvisorRegistrationRequest {
  teacherPublicId: string
  topicName?: string | null
}

export interface UpdateAdvisorRegistrationRequest {
  semesterPublicId: string
  teacherPublicId: string
  topicName?: string | null
}

export interface RegistrationOverviewResponse {
  semesterPublicId: string
  mentorName: string | null
  topicName: string | null
  deadlineName: string | null
  deadlineStartDate: string | null
  deadlineEndDate: string | null
  deadlineActive: boolean | null
  deadlineStatus: AdvisorRegistrationDeadlineStatus | null
}

