import type { LucideIcon } from 'lucide-react'
import { LayoutDashboard } from 'lucide-react'

export interface StudentNavItem {
  title: string
  path: string
  icon: LucideIcon
  badge?: string
}

/**
 * Danh mục điều hướng của Sinh viên
 * QUY TẮC: Chỉ thêm mục mới vào đây sau khi sub-feature tương ứng
 * đã được khởi tạo trong `src/features/student/<sub-feature-name>/`!
 */
export const studentNavItems: StudentNavItem[] = [
  {
    title: 'Tổng quan',
    path: '/student',
    icon: LayoutDashboard,
  },
]
