export const userRoles = [
  'admin',
  'department-head',
  'lecturer',
  'secretary',
  'council',
] as const

export type UserRole = (typeof userRoles)[number]

export function isUserRole(value: string): value is UserRole {
  return userRoles.some((role) => role === value)
}

export const roleLabels: Record<UserRole, string> = {
  admin: 'Quản trị viên (Admin)',
  'department-head': 'Trưởng bộ môn (Head of Dept)',
  lecturer: 'Giảng viên (Lecturer)',
  secretary: 'Thư ký hội đồng',
  council: 'Hội đồng chấm',
}

export const roleHomePaths: Record<UserRole, string> = {
  admin: '/admin',
  'department-head': '/department',
  lecturer: '/lecturer',
  secretary: '/department',
  council: '/lecturer/council',
}

