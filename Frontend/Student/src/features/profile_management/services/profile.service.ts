import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { StudentMyInfoResponse, StudentMyInfoUpdateRequest } from '../types/profile.types'

// Mã BE trả khi PUT không có gì thay đổi (HTTP 200, là cảnh báo chứ không phải lỗi)
export const STUDENT_INFO_NOT_CHANGED = 1103
// Lỗi validate dữ liệu nhập
export const STUDENT_INFO_INVALID = 4000
// Số điện thoại trùng với tài khoản khác
export const PHONE_EXISTED = 3014

export const profileService = {
  getMyInfo: async (): Promise<StudentMyInfoResponse> => {
    const res = await apiClient.get<ApiResponse<StudentMyInfoResponse>>(API_ENDPOINTS.student.myInfo)
    return res.data.data
  },

  // API ghi không có data → trả message để toast. 1103 bị interceptor reject thành ApiError
  updateMyInfo: async (body: StudentMyInfoUpdateRequest): Promise<string> => {
    const res = await apiClient.put<ApiResponse<null>>(API_ENDPOINTS.student.myInfo, body, {
      // Form tự hiển thị lỗi (dưới ô / dòng chung), 1103 hiện toast vàng
      skipErrorToast: true,
    })
    return res.data.message
  },

  // Chữ viết tắt cho avatar: 2 từ cuối của họ tên
  computeProfileAvatar: (fullName: string): string => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean)
    return parts
      .slice(-2)
      .map((word) => word[0]?.toUpperCase() ?? '')
      .join('')
  },

  // "Phạm Thị Mai" -> { firstName: "Phạm Thị", lastName: "Mai" } (Tên chỉ 1 từ theo quy tắc BE)
  splitFullName: (name: string): Pick<StudentMyInfoUpdateRequest, 'firstName' | 'lastName'> => {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    return {
      firstName: parts.slice(0, -1).join(' '),
      lastName: parts.at(-1) ?? '',
    }
  },

  // "0912345678" -> "0912 345 678" (chỉ để hiển thị)
  formatPhone: (phone: string): string =>
    /^\d{10}$/.test(phone) ? `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}` : phone,
}
