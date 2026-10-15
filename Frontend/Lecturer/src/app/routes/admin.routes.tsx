import type { RouteObject } from 'react-router-dom'
import { AdminLayout } from '@/features/admin'
import { FeaturePlaceholder } from '@/shared/components/feedback/FeaturePlaceholder'

export const adminRoutes: RouteObject = {
  path: 'admin',
  element: <AdminLayout />,
  children: [
    {
      index: true,
      element: (
        <FeaturePlaceholder
          title="Bảng điều khiển Quản trị viên (Dashboard)"
          subtitle="Tổng quan trạng thái hệ thống, phân quyền và giám sát hoạt động."
          role="Quản trị viên Hệ thống"
        />
      ),
    },
    {
      path: 'feature-1',
      element: (
        <FeaturePlaceholder
          title="Feature 1"
          subtitle="Không gian tính năng Feature 1 dành cho Quản trị viên."
          role="Quản trị viên Hệ thống"
        />
      ),
    },
    {
      path: 'feature-2',
      element: (
        <FeaturePlaceholder
          title="Feature 2"
          subtitle="Không gian tính năng Feature 2 dành cho Quản trị viên."
          role="Quản trị viên Hệ thống"
        />
      ),
    },
    {
      path: 'feature-2/sub-1',
      element: (
        <FeaturePlaceholder
          title="Feature 2.1"
          subtitle="Tính năng con cấp 2 (Feature 2.1) thuộc nhóm Feature 2."
          role="Quản trị viên Hệ thống"
        />
      ),
    },
    {
      path: 'feature-2/sub-2',
      element: (
        <FeaturePlaceholder
          title="Feature 2.2"
          subtitle="Tính năng con cấp 2 (Feature 2.2) thuộc nhóm Feature 2."
          role="Quản trị viên Hệ thống"
        />
      ),
    },
    {
      path: 'feature-3',
      element: (
        <FeaturePlaceholder
          title="Feature 3"
          subtitle="Không gian tính năng Feature 3 dành cho Quản trị viên."
          role="Quản trị viên Hệ thống"
        />
      ),
    },
    {
      path: 'feature-4',
      element: (
        <FeaturePlaceholder
          title="Feature 4"
          subtitle="Không gian tính năng Feature 4 dành cho Quản trị viên."
          role="Quản trị viên Hệ thống"
        />
      ),
    },
  ],
}

export default adminRoutes
