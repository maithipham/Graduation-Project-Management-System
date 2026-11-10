// ─── Kho tài liệu & biểu mẫu (giao diện giống màn giảng viên, chỉ xem / tải về) ───
// Khớp `TemplateFileResponse` của `GET /template/shared`

/** Loại tài liệu sinh viên được xem — API `/template/shared` chỉ trả 3 loại này (mã enum BE) */
export type TemplateFileType = 'OUTLINE' | 'FINAL_REPORT' | 'DEFENSE_PRESENTATION'

/** Một dòng trong bảng tài liệu */
export interface TemplateFile {
  publicId: string
  /** Tên tài liệu hiển thị */
  fileName: string
  /** Link file (Cloudinary, https) */
  fileUrl: string
  fileType: TemplateFileType
  /** Nhãn tiếng Việt của loại */
  fileTypeName: string
  fileSize: number | null
  /** Kích thước đã định dạng, ví dụ "1.25 MB" */
  fileSizeText: string | null
  /** Định dạng `dd-MM-yyyy HH:mm:ss` */
  updatedAt: string
  uploadedByName: string | null
}

/** Bộ lọc trên thanh công cụ */
export interface TemplateFilters {
  keyword: string
  /** '' = tất cả loại */
  fileType: TemplateFileType | ''
}

/** Tham số danh sách (page bắt đầu từ 0, giống Spring) */
export interface TemplateListParams {
  keyword?: string
  fileType?: TemplateFileType
  page: number
  size: number
}

/** Dạng phân trang của BE: `page` là SỐ trang (khác Spring Page) → đọc bằng `fromPageResponse` */
export interface TemplatePageResponse<T> {
  totalElements: number
  totalPages: number
  page: number
  size: number
  content: T[]
}
