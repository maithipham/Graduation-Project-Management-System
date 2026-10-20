import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Users,
  CalendarRange,
  School,
} from 'lucide-react'

export interface AdminSubNavItem {
  to: string
  label: string
  icon: LucideIcon
}

export interface AdminNavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  children?: AdminSubNavItem[]
}

export const adminNavItems: AdminNavItem[] = [
  {
    to: '/admin',
    label: 'Tổng quan',
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: '/admin/accounts',
    label: 'Quản lý tài khoản',
    icon: Users,
  },
  {
    to: '/admin/semesters',
    label: 'Quản lý học kỳ',
    icon: CalendarRange,
  },
  {
    to: '/admin/faculties',
    label: 'Khoa',
    icon: School,
  },
]
