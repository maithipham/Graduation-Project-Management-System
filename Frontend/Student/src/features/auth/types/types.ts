export const userRoles = [
  'student',
  'lecturer',
  'department-head',
  'secretary',
  'council',
  'admin',
] as const

export type UserRole = (typeof userRoles)[number]

export function isUserRole(value: string): value is UserRole {
  return userRoles.some((role) => role === value)
}

export const roleLabels: Record<UserRole, string> = {
  student: 'Sinh viên',
  lecturer: 'Giảng viên',
  'department-head': 'Trưởng bộ môn',
  secretary: 'Thư ký',
  council: 'Hội đồng',
  admin: 'Quản trị viên',
}

export const roleHomePaths: Record<UserRole, string> = {
  student: '/student',
  lecturer: '/lecturer',
  'department-head': '/department',
  secretary: '/department',
  council: '/lecturer/council',
  admin: '/admin',
}
