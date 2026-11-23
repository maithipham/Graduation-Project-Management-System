import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type {
  TeacherMyInfo,
  TeacherMyInfoUpdatePayload,
  TeacherMyInfoUpdateResult,
} from '../types/lecturerProfile.types'

// Mã BE dùng trong màn hồ sơ
export const TEACHER_INFO_NOT_CHANGED = 1104 // cảnh báo (HTTP 200): gửi y hệt dữ liệu cũ
export const TEACHER_INFO_INVALID = 4000 // sai định dạng Họ / Tên / Số điện thoại
export const PHONE_EXISTED = 3014 // số điện thoại đã thuộc tài khoản khác

/** Tách `name` thành Họ (phần đầu) và Tên (từ cuối) — Tên luôn là 1 từ */
export function splitFullName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return { firstName: '', lastName: parts[0] ?? '' }
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] }
}

/** Tên hiển thị kèm học vị viết tắt: "TS. Nguyễn Văn An"; chưa có học vị → chỉ tên */
export function formatDisplayName(academicTitle: string | null, name: string): string {
  return academicTitle ? `${academicTitle} ${name}`.trim() : name
}

/** 2 chữ cái đầu của 2 từ cuối trong tên (VD "Nguyễn Văn An" → "VA") */
export function computeAvatar(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return words
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export const lecturerProfileService = {
  // GET /teacher/my-info — BE lấy giảng viên theo token
  getMyInfo: async (): Promise<TeacherMyInfo> => {
    const res = await apiClient.get<ApiResponse<TeacherMyInfo>>(API_ENDPOINTS.lecturer.myInfo)
    return res.data.data
  },

  // PUT /teacher/my-info — không có data, trả code + message để phân biệt 1000 / 1104.
  // skipErrorToast: lỗi hiện ngay trên form
  updateMyInfo: async (body: TeacherMyInfoUpdatePayload): Promise<TeacherMyInfoUpdateResult> => {
    const res = await apiClient.put<ApiResponse<null>>(API_ENDPOINTS.lecturer.myInfo, body, {
      skipErrorToast: true,
    })
    return { code: res.data.code, message: res.data.message }
  },
}
