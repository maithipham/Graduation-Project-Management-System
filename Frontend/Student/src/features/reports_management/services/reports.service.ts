import { API_ENDPOINTS, apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { ThesisFinalReportResponse } from '../types/reports.types'

export const REPORT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // Nhỏ hơn 10 MB
export const REPORT_ALLOWED_EXTENSIONS = ['doc', 'docx', 'pdf'] as const

/** Kiểm tra file báo cáo Final theo quy định Backend (.doc, .docx, .pdf và < 10 MB). */
export function validateReportFile(file: File | null | undefined): string | null {
  if (!file || file.size === 0 || !file.name.trim()) {
    return 'File tải lên không được để trống.'
  }
  const dotIndex = file.name.lastIndexOf('.')
  const extension = dotIndex > 0 ? file.name.slice(dotIndex + 1).toLowerCase() : ''
  if (
    !REPORT_ALLOWED_EXTENSIONS.includes(
      extension as (typeof REPORT_ALLOWED_EXTENSIONS)[number],
    )
  ) {
    return 'File tải lên chỉ nhận định dạng .doc, .docx hoặc .pdf.'
  }
  if (file.size >= REPORT_MAX_FILE_SIZE_BYTES) {
    return 'File tải lên phải nhỏ hơn 10MB.'
  }
  return null
}

/** Kiểm tra URL tệp an toàn trước khi gắn vào href. */
export function isSafeReportFileUrl(url?: string | null): boolean {
  if (!url) return false
  const trimmed = url.trim()
  return /^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')
}

/** Tách tên tệp hiển thị từ URL Cloudinary hoặc đường dẫn tệp do BE trả về. */
export function extractReportFileName(
  fileUrl?: string | null,
  fallback: string = 'Tệp báo cáo',
): string {
  if (!fileUrl) return fallback
  const withoutQuery = fileUrl.trim().split('?')[0].split('#')[0]
  const segments = withoutQuery.split('/').filter(Boolean)
  const rawName = segments[segments.length - 1]
  if (!rawName) return fileUrl
  try {
    return decodeURIComponent(rawName)
  } catch {
    return rawName
  }
}

export const reportsService = {
  /** Xem báo cáo Final, lịch sử nộp (kèm kết quả trùng lặp), phiếu tiến độ & hạn nộp theo học kỳ (`GET /report/my-report`). */
  async getMyReport(semesterId?: string): Promise<ThesisFinalReportResponse> {
    const res = await apiClient.get<ApiResponse<ThesisFinalReportResponse>>(
      API_ENDPOINTS.report.myReport,
      { params: semesterId ? { semesterId } : undefined },
    )
    return res.data.data
  },

  /** Sinh viên nộp mới hoặc nộp lại Báo cáo Final (`POST /report/submit`). */
  async submitReport(file: File): Promise<void> {
    const formData = new FormData()
    formData.append('file', file)

    await apiClient.post<ApiResponse<void>>(API_ENDPOINTS.report.submit, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      skipErrorToast: true,
    })
  },

  /** Xem chi tiết một Báo cáo Final theo `publicId` (`GET /report/{publicId}`). */
  async getReportDetail(publicId: string): Promise<ThesisFinalReportResponse> {
    const res = await apiClient.get<ApiResponse<ThesisFinalReportResponse>>(
      API_ENDPOINTS.report.detail(publicId),
    )
    return res.data.data
  },
}
