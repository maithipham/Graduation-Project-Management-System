export type CouncilRole = 'CHAIRPERSON' | 'SECRETARY' | 'COUNCIL_MEMBER'
export type CouncilStatus = 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED'
export type TeacherScope = 'ALL' | 'IN_MAJOR' | 'OUT_MAJOR' | 'EXTERNAL'

export interface CouncilMember {
  teacherId: number
  fullName: string
  academicTitle: string
  departmentName: string
  role: CouncilRole
}

export interface DefenseCouncil {
  publicId: string
  code: string
  name: string
  location: string | null
  defenseStartTime: string
  defenseEndTime: string
  status: CouncilStatus
  studentCount: number
  memberCount: number
  members: CouncilMember[]
}

export interface CouncilListResponse {
  councils: DefenseCouncil[]
  incompleteCouncilCount: number
  waitingStudentCount: number
}

export interface CreateCouncilBatchRequest {
  semesterId: number | string
  majorId: number | string
  quantity: number
  defenseStartTime: string
  defenseEndTime: string
}

export interface UpdateCouncilLocationRequest {
  location: string
}

export interface CandidateTeacher {
  teacherId: number
  fullName: string
  academicTitle: string
  departmentName: string
  scope: TeacherScope | string
  assignedCouncilName?: string
}

export interface UpdateCouncilMembersRequest {
  members: Array<{
    teacherId: number
    role: CouncilRole
  }>
}

export interface EligibleStudent {
  assignmentPublicId?: string
  thesisTopicPublicId: string
  studentCode: string
  studentName: string
  topicTitle: string
  councilName?: string
}

export interface AssignStudentsToCouncilRequest {
  thesisTopicPublicIds: string[]
}

export interface CandidateTeacherParams {
  semesterId: number | string
  majorId: number | string
  scope?: TeacherScope
  assignedOnly?: boolean
  keyword?: string
}

export interface EligibleStudentParams {
  semesterId: number | string
  majorId: number | string
  assigned?: boolean
  page?: number
  size?: number
}
