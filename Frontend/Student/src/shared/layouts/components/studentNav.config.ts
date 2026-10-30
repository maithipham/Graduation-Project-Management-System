import type { LucideIcon } from 'lucide-react'
import {
  UserCheck,
  Users,
  FileEdit,
  FileCheck2,
  CalendarDays,
  GraduationCap,
  FolderDown,
} from 'lucide-react'

export interface StudentNavItem {
  title: string
  path: string
  icon: LucideIcon
  badge?: string
}

export const studentNavItems: StudentNavItem[] = [
  {
    title: 'Đăng ký GVHD',
    path: '/student/registration',
    icon: UserCheck,
  },
  {
    title: 'Danh sách GVHD',
    path: '/student/lecturers',
    icon: Users,
  },
  {
    title: 'Nộp đề cương',
    path: '/student/outline',
    icon: FileEdit,
  },
  {
    title: 'Nộp báo cáo',
    path: '/student/reports',
    icon: FileCheck2,
  },
  {
    title: 'Lịch bảo vệ',
    path: '/student/schedule',
    icon: CalendarDays,
  },
  {
    title: 'Điểm',
    path: '/student/results',
    icon: GraduationCap,
  },
  {
    title: 'Tài liệu biểu mẫu',
    path: '/student/documents',
    icon: FolderDown,
  },
]
