import { API_ENDPOINTS, apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type {
  DefenseRevisionResponse,
  SubmitDefenseRevisionPayload,
} from '../types/defenseRevision.types'
import { REPORT_ALLOWED_EXTENSIONS, REPORT_MAX_FILE_SIZE_BYTES } from './reports.service'

/**
 * Kiểm tra file nộp sau bảo vệ giống BE (DocumentFileValidator): .doc, .docx, .pdf, nhỏ hơn 10 MB.
 * BE không bắt quy tắc đặt tên Tenlop_MaSV_HoVaTen cho luồng này.
 */
export function validateRevisionFile(file: File | null | undefined): string | null {
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

export const defenseRevisionService = {
  /** Yêu cầu chỉnh sửa báo cáo sau bảo vệ của tôi (`GET /defense-revision/my`), `null` = không có yêu cầu. */
  async getMyRevision(semesterId?: string): Promise<DefenseRevisionResponse | null> {
    const res = await apiClient.get<ApiResponse<DefenseRevisionResponse | null>>(
      API_ENDPOINTS.defenseRevision.my,
      { params: semesterId ? { semesterId } : undefined },
    )
    return res.data.data ?? null
  },

  /** Nộp bản sửa (`POST /defense-revision/{id}/submission`). */
  async submitRevision({
    revisionPublicId,
    revisedReportFile,
    explanationFile,
    studentNote,
  }: SubmitDefenseRevisionPayload): Promise<void> {
    const formData = new FormData()
    formData.append('revisedReportFile', revisedReportFile)
    if (explanationFile) formData.append('explanationFile', explanationFile)
    if (studentNote) formData.append('studentNote', studentNote)

    await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.defenseRevision.submit(revisionPublicId),
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        skipErrorToast: true,
      },
    )
  },
}
