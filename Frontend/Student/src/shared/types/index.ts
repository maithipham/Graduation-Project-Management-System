export const userRoles = [
  'student',
  'lecturer',
  'secretary',
  'department-head',
  'council',
] as const

export type UserRole = (typeof userRoles)[number]

export interface UserProfile {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
  department?: string
  code?: string // Mã sinh viên hoặc mã cán bộ
}

export const API_SUCCESS_CODE = 1000

export interface ApiResponse<T = unknown> {
  code: number // 1000: thành công, khác 1000: thất bại
  message: string // thông báo từ Backend
  data: T // dữ liệu phản hồi
}

export interface ApiErrorResponse {
  code: number
  message: string
  data?: unknown
}

// code dùng khi không có phản hồi từ server (mất mạng, timeout, CORS...)
export const NETWORK_ERROR_CODE = -1

/**
 * Lỗi chuẩn hóa: mọi request thất bại qua apiClient đều reject bằng ApiError.
 * - code: mã nghiệp vụ từ BE (khác 1000); nếu BE không trả body thì là HTTP status, hoặc NETWORK_ERROR_CODE
 * - status: HTTP status (undefined khi không có phản hồi)
 */
export class ApiError extends Error {
  code: number
  data?: unknown
  status?: number

  constructor(message: string, code: number, data?: unknown, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.data = data
    this.status = status
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export * from './pagination'
