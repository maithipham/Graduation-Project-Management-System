import type { LucideIcon } from 'lucide-react'
import {
  Award,
  ClipboardCheck,
  ClipboardList,
  Edit3,
  FileCheck2,
  FileText,
  FolderArchive,
  FolderGit2,
  LayoutGrid,
  ShieldCheck,
  UserPlus,
} from 'lucide-react'

export type LecturerNavBadgeKey =
  | 'topicAssignmentGroup'
  | 'supervisorRequests'
  | 'topicProposals'
  | 'outlines'
  | 'thesisExecutionGroup'
  | 'reports'

export interface LecturerSubNavItem {
  to: string
  label: string
  icon: LucideIcon
  badgeKey?: LecturerNavBadgeKey
}

export interface LecturerNavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  badgeKey?: LecturerNavBadgeKey
  children?: LecturerSubNavItem[]
}

export const lecturerNavItems: LecturerNavItem[] = [
  {
    to: '/lecturer',
    label: 'Tổng quan',
    icon: LayoutGrid,
    end: true,
  },
  {
    to: '/lecturer/topic-assignment',
    label: 'Giao đề tài',
    icon: ClipboardList,
    badgeKey: 'topicAssignmentGroup',
    children: [
      {
        to: '/lecturer/supervisor-requests',
        label: 'Đăng ký GVHD',
        icon: UserPlus,
        badgeKey: 'supervisorRequests',
      },
      {
        to: '/lecturer/topic-proposals',
        label: 'Duyệt tên đề tài',
        icon: FileText,
        badgeKey: 'topicProposals',
      },
      {
        to: '/lecturer/outline-review',
        label: 'Duyệt đề cương',
        icon: FileCheck2,
        badgeKey: 'outlines',
      },
    ],
  },
  {
    to: '/lecturer/thesis-execution',
    label: 'Làm đồ án',
    icon: FolderGit2,
    badgeKey: 'thesisExecutionGroup',
    children: [
      {
        to: '/lecturer/report-check',
        label: 'Kiểm tra báo cáo',
        icon: ShieldCheck,
        badgeKey: 'reports',
      },
      {
        to: '/lecturer/progress-tracking',
        label: 'Phiếu theo dõi tiến trình',
        icon: ClipboardCheck,
      },
      {
        to: '/lecturer/guiding-scores',
        label: 'Chấm điểm hướng dẫn',
        icon: Edit3,
      },
    ],
  },
  {
    to: '/lecturer/defense',
    label: 'Bảo vệ đồ án',
    icon: Award,
  },
  {
    to: '/lecturer/templates',
    label: 'Tài liệu mẫu',
    icon: FolderArchive,
  },
]
