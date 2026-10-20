import { apiClient } from '@/shared/api/client'
import { API_ENDPOINTS } from '@/shared/api/endpoints'
import type { ApiResponse } from '@/shared/types'
import type { PageResponseBE } from '@/features/admin/semester_management'
import type {
  MajorResponseBE,
  MajorRequestBE,
} from '../types/faculty.types'

export const majorService = {
  /**
   * Lấy danh sách chuyên ngành theo khoa
   */
  getByFaculty: async (
    facultyId: string,
    params?: { page?: number; size?: number },
  ) => {
    const res = await apiClient.get<ApiResponse<PageResponseBE<MajorResponseBE>>>(
      `${API_ENDPOINTS.admin.faculties}/${facultyId}/majors`,
      { params },
    )
    return res.data.data
  },

  /**
   * Thêm chuyên ngành vào khoa
   */
  create: async (facultyId: string, body: MajorRequestBE) => {
    const res = await apiClient.post<ApiResponse<void>>(
      `${API_ENDPOINTS.admin.faculties}/${facultyId}/majors`,
      body,
    )
    return res.data.data
  },

  /**
   * Cập nhật chuyên ngành
   */
  update: async (majorId: string, body: MajorRequestBE) => {
    const res = await apiClient.put<ApiResponse<void>>(
      `${API_ENDPOINTS.admin.majors}/${majorId}`,
      body,
    )
    return res.data.data
  },

  /**
   * Xóa chuyên ngành
   */
  delete: async (majorId: string) => {
    const res = await apiClient.delete<ApiResponse<void>>(
      `${API_ENDPOINTS.admin.majors}/${majorId}`,
    )
    return res.data.data
  },
}
