import type { LucideIcon } from 'lucide-react'
import { LayoutDashboard, Users2, CalendarDays, GraduationCap } from 'lucide-react'

export interface AdminNavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export const adminNavItems: AdminNavItem[] = [
  { to: '/admin', label: 'Tổng quan Hệ thống', icon: LayoutDashboard, end: true },
  { to: '/admin/accounts', label: 'Quản lý Tài khoản', icon: Users2 },
  { to: '/admin/semesters', label: 'Quản lý Học kỳ', icon: CalendarDays },
  { to: '/admin/majors', label: 'Quản lý Chuyên ngành', icon: GraduationCap },
]
