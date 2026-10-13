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
  data: T // dữ liệu payload
}

export interface ApiErrorResponse {
  code: number
  message: string
  data?: unknown
}

export class ApiError extends Error {
  code: number
  data?: unknown

  constructor(message: string, code: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.data = data
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
