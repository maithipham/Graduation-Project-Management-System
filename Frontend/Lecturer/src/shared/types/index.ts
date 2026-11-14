// Role và thông tin người dùng đăng nhập nằm ở @/features/auth (UserRole, UserInfo)

export const API_SUCCESS_CODE = 1000

/**
 * Mã cảnh báo (dải 11xx, HTTP 200): thao tác vẫn hoàn tất nhưng có điều cần lưu ý,
 * ví dụ 1101 "Sinh viên đã có trong hệ thống, thông tin không thay đổi".
 * Interceptor coi là thành công (không reject) và hiện toast vàng.
 */
export function isApiWarningCode(code: number): boolean {
  return code >= 1100 && code < 1200
}

export interface ApiResponse<T = unknown> {
  code: number // 1000: thành công, 11xx: thành công kèm cảnh báo, còn lại: thất bại
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
