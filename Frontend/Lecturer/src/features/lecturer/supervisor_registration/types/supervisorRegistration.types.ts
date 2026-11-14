// ==================== STATUS ====================

// Status hiển thị trên giao diện
export type SupervisorApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'assigned'

export type SupervisorTabStatus = SupervisorApprovalStatus | ''

// Status BE trả về (RegistrationStatus)
export type ApiRegistrationStatus =
  | 'PENDING'
  | 'TEACHER_APPROVED'
  | 'HOD_APPROVED'
  | 'ASSIGNED_BY_HOD'
  | 'REJECTED'
  | 'HOD_REJECTED'

// Status mốc thời hạn DANG_KY_GVHD từ BE
export type RegistrationDeadlineStatus =
  | 'NOT_CONFIGURED'
  | 'INACTIVE'
  | 'NOT_STARTED'
  | 'CLOSED'
  | 'OPEN'

// ==================== API RESPONSE ====================

// Một đơn đăng ký GVHD từ BE (AdvisorRegistrationResponse)
export interface AdvisorRegistrationResponse {
  registrationPublicId: string
  studentPublicId: string
  semesterPublicId: string
  teacherPublicId: string | null

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

// Danh sách đơn đăng ký GVHD từ BE (TeacherAdvisorRegistrationListResponse)
export interface TeacherAdvisorRegistrationListResponse {
  registrations: AdvisorRegistrationResponse[]
  pendingCount: number
  approvedCount: number
  rejectedCount: number
  totalCount: number
}

// Thông tin thời hạn đăng ký GVHD từ BE
export interface RegistrationDeadline {
  semesterPublicId: string
  name: string | null
  startDate: string | null
  endDate: string | null
  isActive: boolean | null
  status: RegistrationDeadlineStatus
}

// ==================== API REQUEST PARAMS ====================

export interface GetSupervisorRequestsParams {
  semesterPublicId: string
  status?: SupervisorTabStatus
  keyword?: string
}

// ==================== UI MODEL ====================

export interface SupervisorRequestItem {
  id: string
  mssv: string
  name: string
  major: string
  topic: string
  submittedDate: string
  status: SupervisorApprovalStatus
  apiStatus?: ApiRegistrationStatus
  statusDescription?: string
  processedAt?: string
  // Các trường tùy chọn còn dùng bởi lecturer_portal_storage (mock cũ ở màn hình khác)
  email?: string
  phone?: string
  note?: string
  rejectedAt?: string
  rejectReason?: string
}

export interface SupervisorRequestCounts {
  pending: number
  approved: number
  rejected: number
  assigned: number
  all: number
}

export interface SupervisorRequestFilterParams {
  tabStatus?: SupervisorTabStatus
  searchQuery?: string
}
