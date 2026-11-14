export interface LecturerDocumentTemplate {
  id: number
  title: string
  extension: '.DOCX' | '.PDF'
  type: 'Mẫu báo cáo' | 'Phiếu đánh giá' | 'Quy chế' | 'Biên bản' | 'Mẫu đề cương'
  category: 'report' | 'evaluation' | 'regulation' | 'minutes' | 'outline'
  size: string
  format: 'docx' | 'pdf'
}


// ─── Kho tài liệu (giao diện giống trang Trưởng bộ môn, chỉ xem / tải về) ───
// Dữ liệu từ `GET /template` (dùng chung với màn Trưởng bộ môn, mọi role đã đăng nhập đều gọi được)

/** Loại tài liệu — đúng mã chữ hoa của enum BE */
export type TemplateFileType =
  | 'OUTLINE'
  | 'PROGRESS_REPORT'
  | 'FINAL_REPORT'
  | 'DEFENSE_PRESENTATION'
  | 'REVIEW_FORM'
  | 'TEMPLATE'
  | 'ATTACHMENT'
  | 'OTHER'

/** Một dòng trong bảng tài liệu */
export interface LecturerTemplateFile {
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
export interface LecturerTemplateFilters {
  keyword: string
  /** '' = tất cả loại */
  fileType: TemplateFileType | ''
}

/** Tham số danh sách (page bắt đầu từ 0, giống Spring) */
export interface LecturerTemplateListParams {
  keyword?: string
  fileType?: TemplateFileType
  page: number
  size: number
}

/** Dạng phân trang của BE: `page` là SỐ trang (khác Spring Page) → đọc bằng `fromPageResponse` */
export interface LecturerTemplatePageResponse<T> {
  totalElements: number
  totalPages: number
  page: number
  size: number
  content: T[]
}
