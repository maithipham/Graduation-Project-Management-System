import type { TemplateFileType } from '../types/template.types'

/** Lựa chọn loại tài liệu — chỉ 3 loại mà `GET /template/shared` trả về; `value` là mã enum */
export const FILE_TYPE_OPTIONS: { value: TemplateFileType; label: string }[] = [
  { value: 'OUTLINE', label: 'Đề cương' },
  { value: 'FINAL_REPORT', label: 'Báo cáo toàn văn' },
  { value: 'DEFENSE_PRESENTATION', label: 'Slide bảo vệ' },
]

/** Màu nhãn loại trong bảng */
export const FILE_TYPE_BADGE_CLASS: Record<TemplateFileType, string> = {
  OUTLINE: 'bg-blue-50 text-blue-700 border-blue-200',
  FINAL_REPORT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  DEFENSE_PRESENTATION: 'bg-orange-50 text-orange-700 border-orange-200',
}

/** Màu dự phòng nếu BE trả loại lạ */
export const DEFAULT_FILE_TYPE_BADGE_CLASS = 'bg-slate-100 text-slate-600 border-slate-200'

/** Đuôi file (chữ thường, không dấu chấm) từ tên file hoặc URL, ví dụ `docx` */
export function getFileExtension(nameOrUrl: string): string {
  const path = nameOrUrl.split(/[?#]/)[0]
  const fileName = path.slice(path.lastIndexOf('/') + 1)
  const dot = fileName.lastIndexOf('.')
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : ''
}

