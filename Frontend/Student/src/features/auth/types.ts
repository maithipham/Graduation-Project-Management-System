export const userRoles = [
  'student',
] as const

export type UserRole = (typeof userRoles)[number]

export function isUserRole(value: string): value is UserRole {
  return userRoles.some((role) => role === value)
}

export const roleLabels: Record<UserRole, string> = {
  student: 'Sinh viên',
}

export const roleHomePaths: Record<UserRole, string> = {
  student: '/student',
}
