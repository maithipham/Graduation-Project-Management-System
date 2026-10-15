import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { LecturerLayout } from '@/features/lecturer'
import { FeaturePlaceholder } from '@/shared/components/feedback/FeaturePlaceholder'
import { withSuspense } from './withSuspense'

// Page nạp bằng lazy() → mỗi page là một chunk riêng, chỉ tải khi vào URL đó
const LecturerDashboardPage = lazy(
  () => import('@/features/lecturer/dashboard/pages/LecturerDashboardPage'),
)

export const lecturerRoutes: RouteObject = {
  path: 'lecturer',
  element: <LecturerLayout />,
  children: [
    {
      index: true,
      element: withSuspense(<LecturerDashboardPage />),
    },
    {
      path: 'feature-1',
      element: (
        <FeaturePlaceholder
          title="Feature 1"
          subtitle="Không gian tính năng Feature 1 dành cho Giảng viên."
          role="Giảng viên Khoa CNTT"
        />
      ),
    },
    {
      path: 'feature-2',
      element: (
        <FeaturePlaceholder
          title="Feature 2"
          subtitle="Không gian tính năng Feature 2 dành cho Giảng viên."
          role="Giảng viên Khoa CNTT"
        />
      ),
    },
    {
      path: 'feature-2/sub-1',
      element: (
        <FeaturePlaceholder
          title="Feature 2.1"
          subtitle="Tính năng con cấp 2 (Feature 2.1) thuộc nhóm Feature 2."
          role="Giảng viên Khoa CNTT"
        />
      ),
    },
    {
      path: 'feature-2/sub-2',
      element: (
        <FeaturePlaceholder
          title="Feature 2.2"
          subtitle="Tính năng con cấp 2 (Feature 2.2) thuộc nhóm Feature 2."
          role="Giảng viên Khoa CNTT"
        />
      ),
    },
    {
      path: 'feature-3',
      element: (
        <FeaturePlaceholder
          title="Feature 3"
          subtitle="Không gian tính năng Feature 3 dành cho Giảng viên."
          role="Giảng viên Khoa CNTT"
        />
      ),
    },
    {
      path: 'feature-4',
      element: (
        <FeaturePlaceholder
          title="Feature 4"
          subtitle="Không gian tính năng Feature 4 dành cho Giảng viên."
          role="Giảng viên Khoa CNTT"
        />
      ),
    },
  ],
}

export default lecturerRoutes
