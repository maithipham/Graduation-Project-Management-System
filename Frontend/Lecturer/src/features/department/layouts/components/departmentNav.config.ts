import type { LucideIcon } from 'lucide-react'
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
}

export interface DepartmentNavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  children?: DepartmentSubNavItem[]
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
        to: '/department/lecturers',
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
    to: '/department/documents',
    label: 'Tài liệu & Biểu mẫu',
    icon: FolderArchive,
  },
]
