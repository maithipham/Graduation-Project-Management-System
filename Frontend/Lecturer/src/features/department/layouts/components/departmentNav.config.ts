import type { LucideIcon } from 'lucide-react'
import type { UserRole } from '@/features/auth'
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  UserCheck,
  UserPlus,
  MessageSquareText,
  Award,
  CalendarRange,
  SlidersHorizontal,
  FolderArchive,
} from 'lucide-react'

export interface DepartmentSubNavItem {
  to: string
  label: string
  icon: LucideIcon
  roles?: UserRole[]
}

export interface DepartmentNavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  children?: DepartmentSubNavItem[]
  roles?: UserRole[]
}

export const departmentNavItems: DepartmentNavItem[] = [
  {
    to: '/department',
    label: 'Dashboard',
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: '/department/student-management',
    label: 'Quản lý sinh viên',
    icon: GraduationCap,
  },
  {
    to: '/department/teachers',
    label: 'Quản lý giáo viên',
    icon: Users,
    children: [
      {
        to: '/department/lecturer-management',
        label: 'Giảng viên',
        icon: UserCheck,
      },
      {
        to: '/department/supervisors',
        label: 'Hướng dẫn',
        icon: UserPlus,
      },
      {
        to: '/department/reviewers',
        label: 'Nhận xét',
        icon: MessageSquareText,
      },
    ],
  },
  {
    to: '/department/councils',
    label: 'Hội đồng bảo vệ',
    icon: Award,
    roles: ['ADMIN', 'HEAD_OF_MAJOR'],
  },
  {
    to: '/department/schedule',
    label: 'Kế hoạch & Tiến độ',
    icon: CalendarRange,
  },
  {
    to: '/department/grading-config',
    label: 'Cấu hình điểm',
    icon: SlidersHorizontal,
  },
  {
    to: '/department/documents-management',
    label: 'Tài liệu & Biểu mẫu',
    icon: FolderArchive,
  },
]
