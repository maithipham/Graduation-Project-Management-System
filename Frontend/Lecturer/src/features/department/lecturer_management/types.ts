// Ánh xạ DTO của module quản lý giảng viên (BE: UserController – nhóm /teacher)
import type { SortValue } from '@/shared/types'
import type { RowImportStatus } from '@/features/department/student_management'

/** Các cột BE cho phép sắp xếp (whitelist, phân biệt hoa/thường). Key khác (kể cả `Name`) → HTTP 400, code 1008 */
export type TeacherSortField = 'name' | 'organization' | 'majorName' | 'amount'
export type TeacherSort = SortValue<TeacherSortField>

// Một dòng trong GET /teacher (TeacherResponse). BE sắp sẵn: đang hoạt động trước, mới thêm trước
export interface TeacherListItem {
  publicId: string // UUID
  name: string // Họ + Tên, BE đã ghép sẵn
  majorName: string | null // Ngành (giáo viên ngoài trường không có ngành)
  organization: string // Đơn vị công tác: tên trường (trong trường luôn là "Trường Đại học Thủy lợi")
  phone: string | null
  amount: number | null // Hạn mức sinh viên được nhận
  status: boolean // true = tài khoản đang hoạt động
}

// GET /teacher/{publicId} (TeacherDetailResponse). Trả cả giáo viên đã tắt
export interface TeacherDetail extends TeacherListItem {
  email: string
}

/** internal = Trường Đại học Thủy lợi · external = mọi trường khác */
export type TeacherOrganizationType = 'internal' | 'external'

// Tham số gửi lên GET /teacher (@RequestParam + Pageable). Bộ lọc tìm gần đúng, không phân biệt hoa/thường
export interface TeacherListParams {
  name?: string // họ tên đầy đủ (Họ + Tên)
  organization?: string // tên trường, tìm gần đúng (VD "Thủy lợi")
  organizationType?: TeacherOrganizationType // trong / ngoài trường, BE tự đổi sang điều kiện trên tên trường
  majorName?: string // tên ngành
  page: number // 0-based
  size: number
  sort?: TeacherSort
}

// Body POST /teacher (thêm thủ công 1 giáo viên). BE nhận mọi field dạng chuỗi → gửi chuỗi hết, kể cả phone
export interface TeacherCreationRequest {
  firstName: string
  lastName: string
  email: string // chỉ @tlu.edu.vn hoặc @gmail.com
  phone: string
  organization: string // tên trường, phải khớp email (@tlu.edu.vn ⇔ "Trường Đại học Thủy lợi", @gmail.com ⇔ trường khác)
  major: string // tên hoặc mã ngành; ngoài trường gửi ""
  amount: string | null // hạn mức; null → BE tự gán theo email (20 / 10)
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
