import { lazy, Suspense } from 'react'
import { Navigate, type RouteObject } from 'react-router-dom'
import { StudentLayout } from '@/features/student/layouts/StudentLayout'
import { LoadingFallback } from '@/shared/components/feedback/LoadingFallback'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'

const Feature1Page = lazy(() => import('@/features/student/feature_1/pages/Feature1Page'))
const Feature2Page = lazy(() => import('@/features/student/feature_2/pages/Feature2Page'))

export const studentRoutes: RouteObject = {
  path: 'student',
  element: <ProtectedRoute allowedRoles={['student']} />,
  children: [
    {
      element: <StudentLayout />,
      children: [
        {
          index: true,
          element: <Navigate to="feature-1" replace />,
        },
        {
          path: 'feature-1',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <Feature1Page />
            </Suspense>
          ),
        },
        {
          path: 'feature-2',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <Feature2Page />
            </Suspense>
          ),
        },
        // Lưu ý: Chỉ thêm các route mới vào đây sau khi đã tạo sub-feature tương ứng
        // trong src/features/student/<sub-feature-name>/pages/<PageName>.tsx
      ],
    },
  ],
}

export default studentRoutes
