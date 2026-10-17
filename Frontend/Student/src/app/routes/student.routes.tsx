import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { StudentLayout } from '@/features/student'
import { withSuspense } from './withSuspense'

// Page nạp bằng lazy() → mỗi page là một chunk riêng, chỉ tải khi vào URL đó
const StudentOverviewPage = lazy(
  () => import('@/features/student/overview/pages/StudentOverviewPage'),
)

// Đã nằm trong <RequireAuth /> + <ProtectedRoute allowedRoles={['STUDENT']} /> ở routes/index.tsx
export const studentRoutes: RouteObject = {
  path: 'student',
  element: <StudentLayout />,
  children: [
    {
      index: true,
      element: withSuspense(<StudentOverviewPage />),
    },
    // Thêm route mới ở đây sau khi đã tạo sub-feature tương ứng:
    // src/features/student/<sub_feature>/pages/<XxxPage>.tsx
  ],
}

export default studentRoutes
