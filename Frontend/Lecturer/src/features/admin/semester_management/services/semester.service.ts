import { apiClient } from '@/shared/api/client'
import { API_ENDPOINTS } from '@/shared/api/endpoints'
import type { ApiResponse } from '@/shared/types'
import type {
  SemesterResponseBE,
  SemesterRequestBE,
  PageResponseBE,
} from '../types/semester.types'

export const semesterService = {
  /**
   * Lấy danh sách học kỳ có phân trang và tìm kiếm
   */
  getAll: async (params?: { page?: number; size?: number; search?: string }) => {
    const res = await apiClient.get<ApiResponse<PageResponseBE<SemesterResponseBE>>>(
      API_ENDPOINTS.admin.semesters,
      { params },
    )
    return res.data.data
  },

  /**
   * Lấy chi tiết một học kỳ theo UUID
   */
  getById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<SemesterResponseBE>>(
      `${API_ENDPOINTS.admin.semesters}/${id}`,
    )
    return res.data.data
  },

  /**
   * Tạo học kỳ mới
   */
  create: async (body: SemesterRequestBE) => {
    const res = await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.admin.semesters,
      body,
      { skipErrorToast: true },
    )
    return res.data.data
  },

  /**
   * Cập nhật thông tin học kỳ
   */
  update: async (id: string, body: SemesterRequestBE) => {
    const res = await apiClient.put<ApiResponse<void>>(
      `${API_ENDPOINTS.admin.semesters}/${id}`,
      body,
      { skipErrorToast: true },
    )
    return res.data.data
  },

  /**
   * Xóa học kỳ theo UUID
   */
  delete: async (id: string) => {
    const res = await apiClient.delete<ApiResponse<void>>(
      `${API_ENDPOINTS.admin.semesters}/${id}`,
    )
    return res.data.data
  },
}
