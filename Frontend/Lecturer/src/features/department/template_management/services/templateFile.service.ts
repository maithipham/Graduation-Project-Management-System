import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse, SpringPage } from '@/shared/types'
import { compactParams } from '@/shared/utils'
import type {
  PageResponse,
  TemplateFile,
  TemplateFileCreateBody,
  TemplateFileListParams,
  TemplateFileUpdateBody,
} from '../types'
import { fromPageResponse } from '../utils/templateFilters'

const DOCUMENT = API_ENDPOINTS.departmentDocument

/** Upload lên Cloudinary có thể lâu hơn timeout mặc định */
const UPLOAD_TIMEOUT_MS = 2 * 60 * 1000

/**
 * apiClient mặc định gửi JSON (axios sẽ đổi FormData thành JSON). Khai báo multipart để giữ nguyên FormData;
 * trình duyệt tự thay bằng `multipart/form-data; boundary=...` khi gửi.
 */
const MULTIPART_CONFIG = {
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: UPLOAD_TIMEOUT_MS,
  // Lỗi hiện ngay trên form tải lên / sửa, không toast
  skipErrorToast: true,
}

export const templateFileService = {
  // GET /template
  async getTemplateFiles(params: TemplateFileListParams): Promise<SpringPage<TemplateFile>> {
    const res = await apiClient.get<ApiResponse<PageResponse<TemplateFile>>>(DOCUMENT.base, {
      params: compactParams({ ...params, keyword: params.keyword?.trim() }),
    })
    return fromPageResponse(res.data.data)
  },

  // POST /template — trả message thành công của BE
  async createTemplateFile(body: TemplateFileCreateBody, signal?: AbortSignal): Promise<string | undefined> {
    const form = new FormData()
    form.append('file', body.file)
    form.append('fileType', body.fileType)
    if (body.fileName?.trim()) form.append('fileName', body.fileName.trim())
    const res = await apiClient.post<ApiResponse<void>>(DOCUMENT.base, form, { ...MULTIPART_CONFIG, signal })
    return res.data.message
  },

  // PUT /template/{publicId} — part nào không gửi thì BE giữ giá trị cũ
  async updateTemplateFile(
    publicId: string,
    body: TemplateFileUpdateBody,
    signal?: AbortSignal,
  ): Promise<string | undefined> {
    const form = new FormData()
    if (body.file) form.append('file', body.file)
    if (body.fileType) form.append('fileType', body.fileType)
    if (body.fileName?.trim()) form.append('fileName', body.fileName.trim())
    const res = await apiClient.put<ApiResponse<void>>(DOCUMENT.detail(publicId), form, { ...MULTIPART_CONFIG, signal })
    return res.data.message
  },

  // DELETE /template/{publicId} — chỉ xóa bản ghi, file trên Cloudinary vẫn còn
  async deleteTemplateFile(publicId: string): Promise<string | undefined> {
    const res = await apiClient.delete<ApiResponse<void>>(DOCUMENT.detail(publicId))
    return res.data.message
  },
}
