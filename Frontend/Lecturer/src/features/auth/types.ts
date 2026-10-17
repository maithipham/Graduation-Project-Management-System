// Giá trị role đúng như BE trả về (Set<String> roles). Trưởng bộ môn luôn có thêm LECTURER.
export const userRoles = ['ADMIN', 'HEAD_OF_DEPARTMENT', 'LECTURER'] as const

export type UserRole = (typeof userRoles)[number]

export function isUserRole(value: string): value is UserRole {
  return userRoles.some((role) => role === value)
}

export const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Quản trị viên',
  HEAD_OF_DEPARTMENT: 'Trưởng bộ môn',
  LECTURER: 'Giảng viên',
}

// Trang chủ (dashboard) của từng portal
export const roleHomePaths: Record<UserRole, string> = {
  ADMIN: '/admin',
  HEAD_OF_DEPARTMENT: '/department',
  LECTURER: '/lecturer',
}

// GET /my-info → UserInfoResponse { name, roles }
export interface UserInfo {
  name: string
  roles: UserRole[]
}

// POST /login → LoginResponse { authenticated, name, roles } (token nằm trong cookie HttpOnly)
export interface LoginResponse extends UserInfo {
  authenticated: boolean
}
