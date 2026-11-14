// Giá trị role đúng như BE trả về (Set<String> roles). Portal sinh viên chỉ dùng 1 role
export const userRoles = ['STUDENT'] as const

export type UserRole = (typeof userRoles)[number]

export function isUserRole(value: string): value is UserRole {
  return userRoles.some((role) => role === value)
}

export const roleLabels: Record<UserRole, string> = {
  STUDENT: 'Sinh viên',
}

// Trang chủ (dashboard) của portal
export const roleHomePaths: Record<UserRole, string> = {
  STUDENT: '/student',
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
