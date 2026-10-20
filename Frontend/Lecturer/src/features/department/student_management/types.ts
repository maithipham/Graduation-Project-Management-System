// Ánh xạ DTO của module quản lý sinh viên (BE: StudentController, MajorController)

/** Lọc trạng thái: ACTIVE = đang hoạt động (mặc định), INACTIVE = đã tắt từ kì trước */
export type StudentStatusFilter = 'ACTIVE' | 'INACTIVE' | 'ALL'

/** Các cột BE cho phép sắp xếp. Cột khác → HTTP 400, code 1008 */
export type StudentSortField = 'studentCode' | 'name' | 'majorName' | 'className'
export type SortDirection = 'asc' | 'desc'
export type StudentSort = `${StudentSortField},${SortDirection}`

// Một dòng trong GET /student
export interface StudentListItem {
  publicId: string // UUID
  studentCode: string
  name: string // Họ + Tên, BE đã ghép sẵn
  majorName: string | null
  className: string
  status: boolean // true = đang hoạt động
}

// GET /student/{publicId}
export interface StudentDetail extends StudentListItem {
  email: string
  phone: string | null
  batch: string
}

// Tham số gửi lên GET /student (@RequestParam + Pageable)
export interface StudentListParams {
  keyword?: string
  batch?: string
  majorId?: string
  status: StudentStatusFilter
  page: number // 0-based
  size: number
  sort?: StudentSort
}

// GET /major
export interface MajorOption {
  publicId: string
  code: string
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
