import type { FileType } from '../types'

/** Lựa chọn loại tài liệu — nhãn giống hệt `fileTypeName` BE trả về (BE không có API danh sách loại) */
export const FILE_TYPE_OPTIONS: { value: FileType; label: string }[] = [
  { value: 'OUTLINE', label: 'Đề cương' },
  { value: 'PROGRESS_REPORT', label: 'Báo cáo tiến độ' },
  { value: 'FINAL_REPORT', label: 'Báo cáo toàn văn' },
  { value: 'DEFENSE_PRESENTATION', label: 'Slide bảo vệ' },
  { value: 'REVIEW_FORM', label: 'Phiếu nhận xét / Đánh giá' },
  { value: 'TEMPLATE', label: 'Tài liệu mẫu' },
  { value: 'ATTACHMENT', label: 'Minh chứng / Tài liệu đính kèm' },
  { value: 'OTHER', label: 'Tệp khác' },
]

export const FILE_TYPE_VALUES = FILE_TYPE_OPTIONS.map((option) => option.value) as [
  FileType,
  ...FileType[],
]

/** Màu nhãn loại trong bảng */
export const FILE_TYPE_BADGE_CLASS: Record<FileType, string> = {
  OUTLINE: 'bg-blue-50 text-blue-700 border-blue-200',
  PROGRESS_REPORT: 'bg-sky-50 text-sky-700 border-sky-200',
  FINAL_REPORT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  DEFENSE_PRESENTATION: 'bg-orange-50 text-orange-700 border-orange-200',
  REVIEW_FORM: 'bg-violet-50 text-violet-700 border-violet-200',
  TEMPLATE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ATTACHMENT: 'bg-amber-50 text-amber-700 border-amber-200',
  OTHER: 'bg-slate-100 text-slate-600 border-slate-200',
}

/** Đuôi file (chữ thường, không dấu chấm) từ tên file hoặc URL, ví dụ `docx` */
export function getFileExtension(nameOrUrl: string): string {
  const path = nameOrUrl.split(/[?#]/)[0]
  const fileName = path.slice(path.lastIndexOf('/') + 1)
  const dot = fileName.lastIndexOf('.')
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : ''
}

/** Tên file bỏ đuôi, dùng điền sẵn ô "Tên tài liệu" khi chọn file */
export function stripFileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  return dot > 0 ? fileName.slice(0, dot) : fileName
}
