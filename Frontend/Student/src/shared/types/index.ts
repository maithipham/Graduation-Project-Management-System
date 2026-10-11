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

export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
  timestamp?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
