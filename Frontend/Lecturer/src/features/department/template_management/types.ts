// Type cho feature template_management (Tài liệu & Biểu mẫu của Trưởng bộ môn)
// Khớp `TemplateFileResponse` + enum `FileType` bên BE (package features/teamplate/)

/** Loại tài liệu — gửi lên BE đúng mã chữ hoa */
export type FileType =
  | 'OUTLINE'
  | 'PROGRESS_REPORT'
  | 'FINAL_REPORT'
  | 'DEFENSE_PRESENTATION'
  | 'REVIEW_FORM'
  | 'TEMPLATE'
  | 'ATTACHMENT'
  | 'OTHER'

/** Một dòng trong bảng tài liệu (`GET /template`) */
export interface TemplateFile {
  publicId: string
  /** Tên tài liệu hiển thị */
  fileName: string
  /** Link Cloudinary (https), mở thẳng được */
  fileUrl: string
  fileType: FileType
  /** Nhãn tiếng Việt của loại, BE trả sẵn */
  fileTypeName: string
  /** Số byte gốc */
  fileSize: number | null
  /** Kích thước đã định dạng, ví dụ "1.25 MB" */
  fileSizeText: string | null
  /** Định dạng `dd-MM-yyyy HH:mm:ss` (giờ server) */
  updatedAt: string
  uploadedByName: string | null
}

/** Field được phép sort (BE chưa có whitelist, field sai → 500) */
export type TemplateFileSortField = 'fileName' | 'fileType' | 'fileSize' | 'updatedAt'

/** Query params của `GET /template` (page bắt đầu từ 0) */
export interface TemplateFileListParams {
  keyword?: string
  fileType?: FileType
  page: number
  size: number
  sort?: `${TemplateFileSortField},${'asc' | 'desc'}`
}

/** Body `POST /template` (multipart) */
export interface TemplateFileCreateBody {
  file: File
  fileType: FileType
  /** Bỏ trống → BE lấy tên file gốc */
  fileName?: string
}

/** Body `PUT /template/{publicId}` (multipart) — part nào không gửi thì BE giữ giá trị cũ */
export interface TemplateFileUpdateBody {
  file?: File
  fileType?: FileType
  fileName?: string
}

/** Dạng `PageResponse` của BE: `page` là SỐ trang (khác Spring Page) */
export interface PageResponse<T> {
  totalElements: number
  totalPages: number
  page: number
  size: number
  content: T[]
}

/** Bộ lọc trên thanh công cụ */
export interface TemplateFilters {
  keyword: string
  /** '' = tất cả loại */
  fileType: FileType | ''
}
