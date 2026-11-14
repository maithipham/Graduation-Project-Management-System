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
  MajorResponseBE,
  MajorCreationRequestBE,
  FacultyListParams,
  FacultyMajorParams,
} from '../types/faculty.types'

export const facultyService = {
  /**
   * Lấy danh sách khoa có phân trang, tìm kiếm và sắp xếp
   */
  getAll: async (params?: FacultyListParams) => {
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
   * Tạo khoa mới - skipErrorToast để form tự hiển thị lỗi
   */
  create: async (body: FacultyCreationRequestBE) => {
    const res = await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.admin.faculties,
      body,
      { skipErrorToast: true },
    )
    return res.data.data
  },

  /**
   * Cập nhật thông tin khoa - skipErrorToast để form tự hiển thị lỗi
   */
  update: async (id: string, body: FacultyUpdateRequestBE) => {
    const res = await apiClient.put<ApiResponse<void>>(
      `${API_ENDPOINTS.admin.faculties}/${id}`,
      body,
      { skipErrorToast: true },
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
   * Lấy danh sách giảng viên ứng cử trưởng bộ môn / khoa
   */
  getHeadCandidates: async () => {
    try {
      const res = await apiClient.get<ApiResponse<HeadCandidateResponseBE[]>>(
        `${API_ENDPOINTS.admin.faculties}/head-candidates`,
        { skipErrorToast: true },
      )
      return res.data?.data || []
    } catch {
      // Backend có thể chưa khởi động lại hoặc chưa nạp endpoint, fallback danh sách rỗng
      return []
    }
  },

  /**
   * Lấy danh sách ngành theo khoa từ endpoint GET /{id}/majors
   */
  getMajorsByFaculty: async (facultyId: string, params?: FacultyMajorParams) => {
    const res = await apiClient.get<ApiResponse<PageResponseBE<MajorResponseBE>>>(
      `${API_ENDPOINTS.admin.faculties}/${facultyId}/majors`,
      { params },
    )
    return res.data.data
  },

  /**
   * Thêm ngành mới vào khoa từ endpoint POST /{id}/majors
   */
  addMajor: async (facultyId: string, body: MajorCreationRequestBE) => {
    const res = await apiClient.post<ApiResponse<void>>(
      `${API_ENDPOINTS.admin.faculties}/${facultyId}/majors`,
      body,
      { skipErrorToast: true },
    )
    return res.data.data
  },
}
