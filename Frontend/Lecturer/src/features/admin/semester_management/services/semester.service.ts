import { apiClient } from '@/shared/api/client'
import { API_ENDPOINTS } from '@/shared/api/endpoints'
import type { ApiResponse } from '@/shared/types'
import type {
  SemesterResponseBE,
  SemesterRequestBE,
  SemesterConfigBE,
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
   * Lấy học kỳ hiện tại đang diễn ra
   */
  getCurrent: async () => {
    const res = await apiClient.get<ApiResponse<SemesterResponseBE>>(
      `${API_ENDPOINTS.admin.semesters}/current`,
    )
    return res.data.data
  },

  /**
   * Kích hoạt đồng bộ chu kỳ học kỳ tự động
   */
  sync: async () => {
    const res = await apiClient.post<ApiResponse<void>>(
      `${API_ENDPOINTS.admin.semesters}/sync`,
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
   * Cập nhật khoảng thời gian học kỳ (startDate, endDate)
   */
  update: async (id: string, body: SemesterRequestBE) => {
    const res = await apiClient.put<ApiResponse<void>>(
      `${API_ENDPOINTS.admin.semesters}/${id}`,
      body,
    )
    return res.data.data
  },

  /**
   * Lấy cấu hình khung thời gian chuẩn hiện tại (GET /semesters/config)
   */
  getConfig: async () => {
    const res = await apiClient.get<ApiResponse<SemesterConfigBE>>(
      `${API_ENDPOINTS.admin.semesters}/config`,
    )
    return res.data.data
  },

  /**
   * Cập nhật khung thời gian chuẩn áp dụng cho tất cả các năm sau (PUT /semesters/config)
   */
  updateConfig: async (body: SemesterConfigBE) => {
    const res = await apiClient.put<ApiResponse<void>>(
      `${API_ENDPOINTS.admin.semesters}/config`,
      body,
    )
    return res.data.data
  },
}
