import type { LucideIcon } from 'lucide-react'
import { LayoutDashboard, UserPlus2, UserCheck2, GraduationCap, BellRing } from 'lucide-react'

export interface DepartmentNavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export const departmentNavItems: DepartmentNavItem[] = [
  { to: '/department', label: 'Tổng quan Bộ môn', icon: LayoutDashboard, end: true },
  { to: '/department/users-import', label: 'Import SV & GVHD', icon: UserPlus2 },
  { to: '/department/assignments', label: 'Phân công GVHD', icon: UserCheck2 },
  { to: '/department/councils', label: 'Thành lập Hội đồng', icon: GraduationCap },
  { to: '/department/reminders', label: 'Nhắc nhở tiến độ', icon: BellRing },
]
