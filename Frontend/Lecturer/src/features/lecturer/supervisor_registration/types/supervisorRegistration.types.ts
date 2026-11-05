// ==================== STATUS ====================

// Status hiển thị trên giao diện
export type SupervisorApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'

export type SupervisorTabStatus = SupervisorApprovalStatus | ''

// Status BE trả về
export type ApiRegistrationStatus =
  | 'PENDING'
  | 'TEACHER_APPROVED'
  | 'HOD_APPROVED'
  | 'ASSIGNED_BY_HOD'
  | 'REJECTED'

// ==================== API RESPONSE ====================

// Một yêu cầu đăng ký GVHD từ BE
export interface AdvisorRegistrationResponse {
  registrationPublicId: string
  studentPublicId: string
  semesterPublicId: string
  semesterAdvisorPublicId: string | null

  studentCode: string
  studentName: string
  majorName: string | null

  teacherCode: string | null
  teacherName: string | null

  topicName: string | null

  status: ApiRegistrationStatus
  statusDescription: string

  submittedAt: string | null
  processedAt: string | null
}

// Danh sách yêu cầu đăng ký GVHD từ BE
export interface TeacherAdvisorRegistrationListResponse {
  registrations: AdvisorRegistrationResponse[]
  pendingCount: number
  approvedCount: number
  rejectedCount: number
  totalCount: number
}

// ==================== UI MODEL ====================

// Kiểu dữ liệu hiện tại mà giao diện đang sử dụng
export interface SupervisorRequestItem {
  id: string
  mssv: string
  name: string
  major: string
  topic: string
  submittedDate: string
  status: SupervisorApprovalStatus
  processedAt?: string
  email: string
  phone: string
  note: string
}

export interface SupervisorRequestCounts {
  pending: number
  approved: number
  rejected: number
  all: number
}

export interface SupervisorRequestFilterParams {
  tabStatus?: SupervisorTabStatus
  searchQuery?: string
}