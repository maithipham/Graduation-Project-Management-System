import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse, SpringPage } from '@/shared/types'
import { compactParams } from '@/shared/utils'
import type {
  LecturerTemplateFile,
  LecturerTemplateListParams,
  LecturerTemplatePageResponse,
} from '../types/templateManagement.types'
import { fromPageResponse } from '../utils/templateFilters'

export const lecturerTemplateService = {
  // GET /template — dùng chung với màn Trưởng bộ môn (giảng viên chỉ được GET), mới nhất lên đầu
  async getTemplateFiles(params: LecturerTemplateListParams): Promise<SpringPage<LecturerTemplateFile>> {
    const res = await apiClient.get<ApiResponse<LecturerTemplatePageResponse<LecturerTemplateFile>>>(
      API_ENDPOINTS.departmentDocument.base,
      { params: compactParams({ ...params, keyword: params.keyword?.trim(), sort: 'updatedAt,desc' }) },
    )
    return fromPageResponse(res.data.data)
  },
}
