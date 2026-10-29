// Ánh xạ DTO của module quản lý sinh viên (BE: StudentController, MajorController)
import type { SortValue } from '@/shared/types'

/**
 * Trạng thái đồ án của sinh viên trong học kì (cột Trạng thái, bộ lọc `status`).
 * Đề tài bị đình chỉ / hủy → DISQUALIFIED / CANCELLED, còn lại là giai đoạn đồ án
 */
export type StudentThesisStatus =
  | 'STAGE_1_REGISTERING_ADVISOR'
  | 'STAGE_1_ADVISOR_ASSIGNED'
  | 'STAGE_2_TOPIC_CONFIRMED'
  | 'STAGE_3_OUTLINE_APPROVED'
  | 'STAGE_4_REPORT_APPROVED'
  | 'STAGE_5_REVIEW_PASSED'
  | 'STAGE_6_DEFENSE_COMPLETED'
  | 'DISQUALIFIED'
  | 'CANCELLED'

/** Các cột BE cho phép sắp xếp. Cột khác → HTTP 400, code 1008 */
export type StudentSortField = 'studentCode' | 'name' | 'className' | 'batch' | 'majorName'
export type StudentSort = SortValue<StudentSortField>

// Một dòng trong GET /student — ứng với 1 đề tài của sinh viên trong học kì đang chọn.
// BE bật NON_NULL nên field null không có trong JSON → khai báo optional
export interface StudentListItem {
  publicId: string // UUID
  studentCode: string
  name: string // Họ + Tên, BE đã ghép sẵn
  className: string
  batch: string
  majorName?: string | null
  topicName?: string | null // không có: chưa chốt tên đề tài
  lecturerName?: string | null // không có: chưa phân công GVHD (đã kèm học hàm học vị)
  coLecturerName?: string | null // không có: không có GV đồng hướng dẫn
  status: StudentThesisStatus
  statusLabel: string // chữ tiếng Việt BE trả, dùng để hiển thị
  accountStatus: boolean // false = tài khoản bị khóa đăng nhập
}

// GET /student/{publicId} — không theo học kì nên không kế thừa StudentListItem
export interface StudentDetail {
  publicId: string
  studentCode: string
  name: string
  email: string
  phone?: string | null
  majorName?: string | null
  className: string
  batch: string
  accountStatus: boolean
}

// Tham số gửi lên GET /student (@RequestParam + Pageable)
export interface StudentListParams {
  semesterId?: string // bỏ trống → BE lấy học kì hiện tại
  keyword?: string
  batch?: string
  majorId?: string
  status?: StudentThesisStatus // không gửi → tất cả trạng thái
  page: number // 0-based
  size: number
  sort?: StudentSort
}

// Tham số GET /student/batch
export interface StudentBatchParams {
  semesterId?: string
  majorId?: string
}

// Một phần tử trong GET /semester (content) và GET /semester/current
// DELETE /student/{publicId}?semesterId=
export interface StudentDeleteParams {
  publicId: string
  semesterId: string
}

export interface SemesterOption {
  publicId: string
  name: string // "Học kỳ 1 năm học 2026-2027"
  academicYear: string // "2026-2027"
  term: string // "Học kỳ 1"
  startDate: string // dd-MM-yyyy
  endDate: string
  status: string // "Chưa bắt đầu" | "Đang diễn ra" | "Kết thúc"
  statusCode: 'UPCOMING' | 'ONGOING' | 'COMPLETED'
}

// GET /major
export interface MajorOption {
  publicId: string
  code: string | null // BE có ngành chưa có mã (null)
  name: string
}

// Body POST /student (StudentCreationRequest)
export interface StudentCreationRequest {
  studentCode: string
  firstName: string
  lastName: string
  email: string
  phone: string
  batch: string
  className: string
  major: string // tên ngành, không phải publicId
}

/**
 * Kết quả POST /student. Màn hình cần phân biệt thành công / cảnh báo và hiện đúng câu của BE,
 * nên service trả `code` + `message` thay vì `data`:
 * 1000 = thêm mới / cập nhật / kích hoạt lại · 1101 = đã có trong hệ thống, thông tin không đổi
 */
export interface StudentWriteResult {
  code: number
  message: string
}

// Kết quả POST /student/import (StudentImportResponse)
export type RowImportStatus = 'SUCCESS' | 'WARNING' | 'ERROR'

export interface StudentImportRowResult {
  rowNumber: number // dòng thật trên Excel (tiêu đề = 1)
  // Giữ nguyên giá trị đọc từ file; ô trống có thể là null
  studentCode: string | null
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  batch: string | null
  className: string | null
  majorName: string | null
  status: RowImportStatus
  message: string
}

export interface StudentImportResponse {
  totalRows: number
  successCount: number
  warningCount: number
  errorCount: number
  rowResults: StudentImportRowResult[]
}
