import { z } from 'zod'

/** Form tạo hội đồng: số lượng + khoảng ngày bảo vệ chung */
export const createCouncilFormSchema = z
  .object({
    quantity: z
      .number({ error: 'Vui lòng nhập số lượng hội đồng' })
      .int('Số lượng phải là số nguyên')
      .min(1, 'Số lượng hội đồng tối thiểu là 1')
      .max(20, 'Số lượng hội đồng tối đa là 20'),
    startDate: z.string().min(1, 'Vui lòng chọn ngày bắt đầu bảo vệ'),
    endDate: z.string().min(1, 'Vui lòng chọn ngày kết thúc bảo vệ'),
  })
  .refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate, {
    message: 'Ngày kết thúc không được nhỏ hơn ngày bắt đầu',
    path: ['endDate'],
  })

export type CreateCouncilFormValues = z.infer<typeof createCouncilFormSchema>

export type CouncilRole ='CHAIRPERSON' | 'SECRETARY' | 'COUNCIL_MEMBER'
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

/** Sửa ngày bảo vệ chung cho mọi hội đồng của ngành trong học kỳ */
export interface UpdateCommonDefenseDateRequest {
  semesterId: number | string
  majorId: number | string
  defenseStartTime: string
  defenseEndTime: string
}

/** Trạng thái mốc THANH_LAP_HOI_DONG */
export type FormationMilestoneState = 'LOADING' | 'NOT_CONFIGURED' | 'NOT_STARTED' | 'OPEN' | 'CLOSED'

export interface FormationMilestone {
  state: FormationMilestoneState
  startDate: string | null
  endDate: string | null
}

/** Form sửa ngày bảo vệ chung */
export const editDefenseDateFormSchema = z
  .object({
    startDate: z.string().min(1, 'Vui lòng chọn ngày bắt đầu bảo vệ'),
    endDate: z.string().min(1, 'Vui lòng chọn ngày kết thúc bảo vệ'),
  })
  .refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate, {
    message: 'Ngày kết thúc không được nhỏ hơn ngày bắt đầu',
    path: ['endDate'],
  })

export type EditDefenseDateFormValues = z.infer<typeof editDefenseDateFormSchema>

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
