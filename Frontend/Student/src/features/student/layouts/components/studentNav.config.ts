import type { LucideIcon } from 'lucide-react'
import { Layers, FolderGit2 } from 'lucide-react'

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
    title: 'Tính năng mẫu 1',
    path: '/student/feature-1',
    icon: Layers,
    badge: 'Mẫu 1',
  },
  {
    title: 'Tính năng mẫu 2',
    path: '/student/feature-2',
    icon: FolderGit2,
    badge: 'Mẫu 2',
  },
]
