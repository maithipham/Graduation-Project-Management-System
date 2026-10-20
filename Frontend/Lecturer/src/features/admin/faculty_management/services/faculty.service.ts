import { apiClient } from '@/shared/api/client'
import { API_ENDPOINTS } from '@/shared/api/endpoints'
import type { ApiResponse } from '@/shared/types'
import type { PageResponseBE } from '@/features/admin/semester_management'
import type {
  FacultyResponseBE,
  FacultyDetailResponseBE,
  FacultyCreationRequestBE,
  FacultyUpdateRequestBE,
  HeadCandidateResponseBE,
} from '../types/faculty.types'

export const facultyService = {
  /**
   * Lấy danh sách khoa có phân trang và tìm kiếm
   */
  getAll: async (params?: { page?: number; size?: number; keyword?: string }) => {
    const res = await apiClient.get<ApiResponse<PageResponseBE<FacultyResponseBE>>>(
      API_ENDPOINTS.admin.faculties,
      { params },
    )
    return res.data.data
  },

  /**
   * Lấy chi tiết khoa
   */
  getById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<FacultyDetailResponseBE>>(
      `${API_ENDPOINTS.admin.faculties}/${id}`,
    )
    return res.data.data
  },

  /**
   * Tạo khoa mới
   */
  create: async (body: FacultyCreationRequestBE) => {
    const res = await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.admin.faculties,
      body,
    )
    return res.data.data
  },

  /**
   * Cập nhật thông tin khoa
   */
  update: async (id: string, body: FacultyUpdateRequestBE) => {
    const res = await apiClient.put<ApiResponse<void>>(
      `${API_ENDPOINTS.admin.faculties}/${id}`,
      body,
    )
    return res.data.data
  },

  /**
   * Xóa khoa
   */
  delete: async (id: string) => {
    const res = await apiClient.delete<ApiResponse<void>>(
      `${API_ENDPOINTS.admin.faculties}/${id}`,
    )
    return res.data.data
  },

  /**
   * Lấy danh sách giảng viên ứng cử trưởng khoa
   */
  getHeadCandidates: async () => {
    const res = await apiClient.get<ApiResponse<HeadCandidateResponseBE[]>>(
      `${API_ENDPOINTS.admin.faculties}/head-candidates`,
    )
    return res.data.data
  },
}
