// Ánh xạ DTO của module quản lý giảng viên (BE: UserController – nhóm /teacher)
import type { SortValue } from '@/shared/types'
import type { RowImportStatus } from '@/features/department/student_management'

/** Các cột BE cho phép sắp xếp (whitelist, phân biệt hoa/thường) */
export type TeacherSortField = 'name' | 'organization' | 'majorName' | 'amount'
export type TeacherSort = SortValue<TeacherSortField>

// Danh mục học hàm, học vị từ bảng academic_title (GET /teacher/academic-titles)
export interface AcademicTitle {
  id: number
  code: string // MASTER, DOCTOR, ASSOCIATE_PROFESSOR, PROFESSOR
  name: string // "Thạc sĩ", "Tiến sĩ", "Phó Giáo sư", "Giáo sư"
  abbreviation: string // "ThS.", "TS.", "PGS.TS.", "GS.TS."
  sortOrder?: number
}

// Một dòng trong GET /teacher (TeacherResponse). BE sắp sẵn: đang hoạt động trước, mới thêm trước
export interface TeacherListItem {
  id?: number
  teacherId?: number
  publicId: string // UUID
  teacherCode?: string
  name: string // Họ + Tên, BE đã ghép sẵn
  firstName?: string
  lastName?: string
  academicTitleId?: number | null
  academicTitle?: string | null // Viết tắt ("PGS.TS.", "TS.", "ThS.", "GS.TS.")
  academicTitleName?: string | null // Tên đầy đủ ("Phó Giáo sư", "Tiến sĩ", ...)
  fullNameWithTitle?: string | null // "PGS.TS. Trần Quốc Bảo"
  displayName?: string | null
  email: string
  phone: string | null
  organization: string // Đơn vị công tác: tên trường (trong trường luôn là "Trường Đại học Thủy lợi")
  isInternal: boolean
  unitType?: 'INTERNAL' | 'EXTERNAL' | string
  majorName: string | null // Ngành (giáo viên ngoài trường không có ngành)
  majorPublicId?: string | null
  isAssigned?: boolean
  assignmentStatus?: string // "Chưa phân công" | "Đã phân công"
  amount?: number | null // Hạn mức sinh viên được nhận (nếu có)
  status: boolean // true = tài khoản đang hoạt động
}

// GET /teacher/{publicId} (TeacherDetailResponse). Trả cả giáo viên đã tắt
export interface TeacherDetail extends TeacherListItem {
  email: string
}

/** internal / external hoặc INTERNAL / EXTERNAL */
export type TeacherOrganizationType = 'internal' | 'external'
export type UnitTypeFilter = 'INTERNAL' | 'EXTERNAL' | 'ALL' | ''

// Tham số gửi lên GET /teacher (@RequestParam + Pageable).
export interface TeacherListParams {
  semesterId?: string
  keyword?: string // Tìm theo họ tên, email, SĐT, mã GV
  name?: string
  majorId?: string // publicId của ngành
  unitType?: UnitTypeFilter // INTERNAL | EXTERNAL | ALL | ''
  organization?: string
  organizationType?: TeacherOrganizationType
  majorName?: string
  isAssigned?: boolean // false = Chưa phân công; để trống = tất cả
  page: number // 0-based
  size: number
  sort?: TeacherSort
}

// Body POST /semesters/{semesterId}/advisors
export interface AssignAdvisorsRequest {
  teacherIds: number[]
  maxStudentsPerTeacher?: number
}

// Response GET /semesters/{semesterId}/advisors hoặc /advisors (kèm thông tin GV & hạn mức maxStudents từ bảng semester_advisor)
export interface SemesterAdvisorResponse {
  id?: string | number
  semesterAdvisorId?: string | number
  semesterId?: string
  maxStudents?: number
  currentStudents?: number
  assignedStudents?: number
  teacherId?: number
  teacherPublicId?: string
  name?: string
  teacherName?: string
  email?: string
  teacherEmail?: string
  phone?: string
  academicTitle?: string
  academicTitleId?: number
  academicTitleName?: string
  fullNameWithTitle?: string
  displayName?: string
  majorName?: string
  organization?: string
  isInternal?: boolean
  status?: boolean
  teacher?: TeacherListItem
}

// Body POST /teacher (thêm thủ công 1 giáo viên). BE nhận mọi field dạng chuỗi → gửi chuỗi hết, kể cả phone
export interface TeacherCreationRequest {
  firstName: string
  lastName: string
  email: string // chỉ @tlu.edu.vn hoặc @gmail.com
  phone: string
  organization: string // tên trường, phải khớp email (@tlu.edu.vn ⇔ "Trường Đại học Thủy lợi", @gmail.com ⇔ trường khác)
  major: string // tên hoặc mã ngành; ngoài trường gửi ""
  academicTitleId?: number | null // ID từ bảng academic_title
  academicTitle?: string | null // ThS., TS., PGS.TS., GS.TS.
  amount?: string | null // hạn mức; null → BE tự gán theo email (20 / 10)
}

/**
 * Kết quả POST /teacher (response không có `data`).
 * 1000 = thêm mới / kích hoạt lại · 1100 = giáo viên đang hoạt động sẵn, không cập nhật gì
 */
export interface TeacherWriteResult {
  code: number
  /** Tài liệu API ghi `message?`: BE có thể không trả */
  message?: string
}

// Kết quả POST /teacher/import (TeacherImportResponse). Trạng thái dòng dùng chung với import sinh viên
export interface TeacherImportRowResult {
  rowNumber: number // dòng thật trên Excel (tiêu đề = 1)
  // Giá trị BE đã chuẩn hóa (trim, email chữ thường...); ô trống là "" chứ không phải null
  firstName: string
  lastName: string
  email: string
  phone: string
  organization: string
  majorName: string // đúng chuỗi trong ô Ngành (có thể là mã ngành)
  amount: number | null // SUCCESS: vừa gán · WARNING: giá trị đang có trong DB · ERROR: null
  status: RowImportStatus
  message: string
}

export interface TeacherImportResponse {
  totalRows: number // số dòng có dữ liệu (không tính dòng trống)
  successCount: number
  warningCount: number
  errorCount: number
  rowResults: TeacherImportRowResult[]
}

// Kết quả import file Excel danh sách GVHD trong kỳ (POST /semesters/{semesterId}/advisors/import-excel)
export interface AdvisorImportRowResult {
  rowNumber: number
  teacherCode?: string
  code?: string
  name?: string
  fullName?: string
  firstName?: string
  lastName?: string
  academicTitle?: string
  title?: string
  email: string
  phone?: string
  organization?: string
  majorName?: string
  department?: string
  quota?: number | null
  amount?: number | null
  maxStudents?: number | null
  status: RowImportStatus
  reason?: string
  message?: string
}

export interface AdvisorImportRowError {
  rowNumber: number
  email: string
  reason: string
}

export interface AdvisorImportResponse {
  totalRows: number
  successCount: number
  skippedCount: number
  warningCount?: number
  failedCount: number
  errorCount?: number
  errors?: AdvisorImportRowError[]
  warnings?: AdvisorImportRowError[]
  rowResults?: AdvisorImportRowResult[]
  rows?: AdvisorImportRowResult[]
}

// ---------------------------------------------------------------------------
// Types cho trang Giáo viên Hướng dẫn (Supervisor)
// ---------------------------------------------------------------------------
export interface SupervisorLecturer {
  id: string
  advisorId?: string | number
  advisorPublicId?: string
  teacherId?: number
  teacherPublicId?: string
  teacherCode?: string
  name: string
  title: string
  email: string
  category: 'internal' | 'dept_ext' | 'univ_ext'
  categoryLabel: string
  department: string
  quota: number
  assigned: number
  year: string
  semester: string
  status: 'active' | 'busy'
  busyReason?: string
}

export interface SupervisorStudent {
  id: string
  code: string
  name: string
  className: string
  topic: string
  supervisorId: string | null
  supervisorName: string | null
  supervisor2Id?: string | null
  supervisor2Name?: string | null
  assignedTime: string | null
  status: 'received' | 'unassigned' | 'approved'
  year: string
  semester: string
}

export interface TitleQuotaConfig {
  id: string | number
  academicTitleId?: number
  code?: string
  titleCode?: string
  title: string
  titleName?: string
  shortTitle: string
  academicTitle?: string
  internal: number | null
  external: number | null
  internalQuota?: number | null
  externalQuota?: number | null
}

export interface SupervisorOverviewFilters {
  search: string
  year: string
  semester: string
  department: string
  unitType: 'all' | 'internal' | 'external'
  status: 'all' | 'active' | 'unassigned'
}

export interface SupervisorWorkspaceFilters {
  studentSearch: string
  lecturerSearch: string
  lecturerCategory: 'all' | 'internal' | 'dept_ext' | 'univ_ext'
  lecturerSort: 'default' | 'asc' | 'desc'
  currentTab: 'received' | 'unassigned' | 'approved'
}

// ---------------------------------------------------------------------------
// Types cho trang Giáo viên Nhận xét (Reviewer)
// ---------------------------------------------------------------------------
export interface ReviewerLecturer {
  id: string
  name: string
  email: string
  department: string
  isExternal?: boolean
}

export interface ReviewerStudent {
  id: string
  code: string
  name: string
  email: string
  className: string
  topic: string
  gvhds: string[]
  reviewerId: string | null
  reviewerName: string | null
  department: string
  batch: string
}

export interface ReviewerFilters {
  search: string
  department: string
  batch: string
  className: string
  status: 'all' | 'assigned' | 'unassigned'
}

