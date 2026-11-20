import type { OutlineStatus } from '../types/outlineReview.types'

/** Lấy tên file từ đường dẫn URL Cloudinary hoặc chuỗi file */
export function getFileNameFromUrl(url?: string | null, fallback = 'Tài liệu đề cương'): string {
  if (!url) return fallback
  try {
    const cleanUrl = url.split('?')[0]
    const parts = cleanUrl.split('/')
    const lastPart = parts[parts.length - 1]
    return decodeURIComponent(lastPart) || fallback
  } catch {
    return fallback
  }
}

/** Tên nhãn hiển thị cho trạng thái đề cương */
export function getOutlineStatusLabel(status?: OutlineStatus | null): string {
  switch (status) {
    case 'PENDING':
      return 'Chờ duyệt'
    case 'APPROVED':
      return 'Đã duyệt'
    case 'REQUEST_CHANGES':
      return 'Yêu cầu sửa'
    case 'REJECTED':
      return 'Không đạt'
    default:
      return 'Chưa nộp'
  }
}

/** Class màu sắc badge trạng thái đề cương */
export function getOutlineStatusBadgeClass(status?: OutlineStatus | null): string {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-50 text-amber-800 border-amber-200'
    case 'APPROVED':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200'
    case 'REQUEST_CHANGES':
      return 'bg-sky-50 text-sky-800 border-sky-200'
    case 'REJECTED':
      return 'bg-rose-50 text-rose-800 border-rose-200'
    default:
      return 'bg-slate-100 text-slate-500 border-slate-200'
  }
}

/** Kiểm tra đường dẫn URL file an toàn */
export function isSafeOutlineFileUrl(url?: string | null): boolean {
  if (!url) return false
  const trimmed = url.trim()
  return /^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')
}

/** Kiểm tra xem đường dẫn file có phải là định dạng PDF không */
export function isPdfOutlineFileUrl(url?: string | null): boolean {
  if (!url) return false
  const clean = url.split('?')[0].split('#')[0].toLowerCase()
  return clean.endsWith('.pdf')
}

/** Lấy nhãn phần mở rộng file (PDF, DOCX, DOC...) */
export function getOutlineFileExtensionLabel(url?: string | null): string {
  if (!url) return 'PDF'
  const clean = url.split('?')[0].split('#')[0]
  const dotIdx = clean.lastIndexOf('.')
  if (dotIdx === -1) return 'PDF'
  const ext = clean.slice(dotIdx + 1).toUpperCase()
  return ext || 'PDF'
}
