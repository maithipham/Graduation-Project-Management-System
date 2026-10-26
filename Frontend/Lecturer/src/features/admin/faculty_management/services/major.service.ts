import { apiClient } from '@/shared/api/client'
import { API_ENDPOINTS } from '@/shared/api/endpoints'
import type { ApiResponse } from '@/shared/types'
import type { PageResponseBE } from '@/features/admin/semester_management'
import type {
  MajorResponseBE,
  MajorCreationRequestBE,
  MajorUpdateRequestBE,
  FacultyMajorParams,
} from '../types/faculty.types'

export const majorService = {
  /**
   * Lấy tất cả chuyên ngành (danh sách không phân trang, dùng cho dropdown)
   * GET /major
   */
  getAllMajors: async () => {
    const res = await apiClient.get<ApiResponse<MajorResponseBE[]>>(
      API_ENDPOINTS.major.base,
    )
    return res.data.data
  },

  /**
   * Lấy chi tiết một chuyên ngành
   * GET /majors/{majorId}
   */
  getById: async (majorId: string) => {
    const res = await apiClient.get<ApiResponse<MajorResponseBE>>(
      `${API_ENDPOINTS.admin.majors}/${majorId}`,
    )
    return res.data.data
  },

  /**
   * Lấy danh sách chuyên ngành theo khoa có phân trang, tìm kiếm, sắp xếp
   * GET /faculties/{facultyId}/majors
   */
  getByFaculty: async (
    facultyId: string,
    params?: FacultyMajorParams,
  ) => {
    const res = await apiClient.get<ApiResponse<PageResponseBE<MajorResponseBE>>>(
      `${API_ENDPOINTS.admin.faculties}/${facultyId}/majors`,
      { params },
    )
    return res.data.data
  },

  /**
   * Thêm chuyên ngành vào khoa
   * POST /faculties/{facultyId}/majors
   */
  create: async (facultyId: string, body: MajorCreationRequestBE) => {
    const res = await apiClient.post<ApiResponse<void>>(
      `${API_ENDPOINTS.admin.faculties}/${facultyId}/majors`,
      body,
      { skipErrorToast: true },
    )
    return res.data.data
  },

  /**
   * Cập nhật chuyên ngành
   * PUT /majors/{majorId}
   */
  update: async (majorId: string, body: MajorUpdateRequestBE) => {
    const res = await apiClient.put<ApiResponse<void>>(
      `${API_ENDPOINTS.admin.majors}/${majorId}`,
      body,
      { skipErrorToast: true },
    )
    return res.data.data
  },

  /**
   * Xóa chuyên ngành
   * DELETE /majors/{majorId}
   */
  delete: async (majorId: string) => {
    const res = await apiClient.delete<ApiResponse<void>>(
      `${API_ENDPOINTS.admin.majors}/${majorId}`,
    )
    return res.data.data
  },
}
