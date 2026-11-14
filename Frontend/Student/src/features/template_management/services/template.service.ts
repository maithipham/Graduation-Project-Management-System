import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse, SpringPage } from '@/shared/types'
import type { TemplateFile, TemplateListParams, TemplatePageResponse } from '../types/template.types'
import { fromPageResponse } from '../utils/templateFilters'

export const templateService = {
  // GET /template/shared — sinh viên chỉ xem + tải, mới cập nhật lên đầu. Không gửi param rỗng
  async getTemplateFiles(params: TemplateListParams): Promise<SpringPage<TemplateFile>> {
    const query: Record<string, string | number> = {
      page: params.page,
      size: params.size,
      sort: 'updatedAt,desc',
    }
    const keyword = params.keyword?.trim()
    if (keyword) query.keyword = keyword
    if (params.fileType) query.fileType = params.fileType

    const res = await apiClient.get<ApiResponse<TemplatePageResponse<TemplateFile>>>(
      API_ENDPOINTS.student.templates,
      { params: query },
    )
    return fromPageResponse(res.data.data)
  },
}
