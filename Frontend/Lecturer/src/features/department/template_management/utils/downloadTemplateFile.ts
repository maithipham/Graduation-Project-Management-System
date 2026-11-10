import type { TemplateFile } from '../types'
import { getFileExtension } from './templateCategory'

/** Tên file khi lưu về máy: tên tài liệu + đuôi lấy từ link (nếu tên chưa có đuôi đó) */
export function getDownloadFileName(doc: Pick<TemplateFile, 'fileName' | 'fileUrl'>): string {
  const extension = getFileExtension(doc.fileUrl)
  const name = doc.fileName.trim() || 'tai-lieu'
  if (!extension || name.toLowerCase().endsWith(`.${extension}`)) return name
  return `${name}.${extension}`
}

/**
 * Link Cloudinary buộc trình duyệt lưu file thay vì mở ra xem (thêm `fl_attachment`).
 * Chỉ áp dụng cho file loại image/video (PDF thuộc loại image); file "raw" (docx, xlsx...) trình duyệt vốn đã tự tải về.
 */
export function toAttachmentUrl(fileUrl: string): string {
  return fileUrl.replace(/\/(image|video)\/upload\/(?!fl_attachment)/, '/$1/upload/fl_attachment/')
}

function clickLink(href: string, fileName?: string) {
  const link = document.createElement('a')
  link.href = href
  if (fileName) link.download = fileName
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

/**
 * Lưu tài liệu về máy người dùng.
 * File nằm trên Cloudinary (khác domain) nên thuộc tính `download` của thẻ <a> bị trình duyệt bỏ qua
 * → tải nội dung về dạng blob rồi lưu (giữ đúng tên tài liệu).
 * Không tải được blob (CORS, mất mạng) → mở link `fl_attachment` để trình duyệt tự lưu (tên theo Cloudinary).
 */
export async function downloadTemplateFile(doc: Pick<TemplateFile, 'fileName' | 'fileUrl'>): Promise<void> {
  try {
    // Không gửi cookie: đây là link Cloudinary, không phải API của hệ thống
    const response = await fetch(doc.fileUrl, { credentials: 'omit' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const blob = await response.blob()

    const objectUrl = URL.createObjectURL(blob)
    clickLink(objectUrl, getDownloadFileName(doc))
    // Đợi trình duyệt bắt đầu lưu rồi mới thu hồi URL
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  } catch {
    clickLink(toAttachmentUrl(doc.fileUrl))
  }
}
