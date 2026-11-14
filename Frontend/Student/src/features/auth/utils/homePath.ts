import { roleHomePaths, type UserRole } from '../types'

// Thứ tự ưu tiên khi chọn trang chủ. Không dùng roles[0]: BE trả Set (HashSet) nên thứ tự không cố định
const rolePriority: UserRole[] = ['STUDENT']

/**
 * Trang chủ (dashboard) sau khi đăng nhập: sinh viên → /student.
 * Trả về null nếu tài khoản không có role nào của portal sinh viên (ví dụ tài khoản cán bộ).
 */
export function getHomePath(roles: readonly string[]): string | null {
  const role = rolePriority.find((item) => roles.includes(item))
  return role ? roleHomePaths[role] : null
}
