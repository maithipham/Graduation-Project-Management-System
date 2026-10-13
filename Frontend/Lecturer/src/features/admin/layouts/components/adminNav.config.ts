import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Layers,
  Shield,
  Users,
  Settings,
  FolderKanban,
  FileSpreadsheet,
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
    label: 'Dashboard',
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: '/admin/feature-1',
    label: 'Feature 1',
    icon: Layers,
  },
  {
    to: '/admin/feature-2',
    label: 'Feature 2',
    icon: Shield,
    children: [
      {
        to: '/admin/feature-2/sub-1',
        label: 'Feature 2.1',
        icon: FolderKanban,
      },
      {
        to: '/admin/feature-2/sub-2',
        label: 'Feature 2.2',
        icon: FileSpreadsheet,
      },
    ],
  },
  {
    to: '/admin/feature-3',
    label: 'Feature 3',
    icon: Users,
  },
  {
    to: '/admin/feature-4',
    label: 'Feature 4',
    icon: Settings,
  },
]
