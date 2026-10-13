import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  Award,
  FileSpreadsheet,
  FolderKanban,
} from 'lucide-react'

export interface LecturerSubNavItem {
  to: string
  label: string
  icon: LucideIcon
}

export interface LecturerNavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  children?: LecturerSubNavItem[]
}

export const lecturerNavItems: LecturerNavItem[] = [
  {
    to: '/lecturer',
    label: 'Dashboard',
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: '/lecturer/feature-1',
    label: 'Feature 1',
    icon: BookOpen,
  },
  {
    to: '/lecturer/feature-2',
    label: 'Feature 2',
    icon: FileText,
    children: [
      {
        to: '/lecturer/feature-2/sub-1',
        label: 'Feature 2.1',
        icon: FileSpreadsheet,
      },
      {
        to: '/lecturer/feature-2/sub-2',
        label: 'Feature 2.2',
        icon: FolderKanban,
      },
    ],
  },
  {
    to: '/lecturer/feature-3',
    label: 'Feature 3',
    icon: Users,
  },
  {
    to: '/lecturer/feature-4',
    label: 'Feature 4',
    icon: Award,
  },
]
