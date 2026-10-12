import { lazy, Suspense } from 'react'
import type { RouteObject } from 'react-router-dom'
import { AdminLayout } from '@/features/admin/layouts/AdminLayout'
import { LoadingFallback } from '@/shared/components/feedback/LoadingFallback'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'

const AdminDashboardPage = lazy(() => import('@/features/admin/pages/AdminDashboardPage'))
const AccountManagementPage = lazy(() => import('@/features/admin/pages/AccountManagementPage'))
const SemesterManagementPage = lazy(() => import('@/features/admin/pages/SemesterManagementPage'))
const MajorManagementPage = lazy(() => import('@/features/admin/pages/MajorManagementPage'))

export const adminRoutes: RouteObject = {
  path: 'admin',
  element: <ProtectedRoute allowedRoles={['admin']} />,
  children: [
    {
      element: <AdminLayout />,
      children: [
        {
          index: true,
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <AdminDashboardPage />
            </Suspense>
          ),
        },
        {
          path: 'accounts',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <AccountManagementPage />
            </Suspense>
          ),
        },
        {
          path: 'semesters',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <SemesterManagementPage />
            </Suspense>
          ),
        },
        {
          path: 'majors',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <MajorManagementPage />
            </Suspense>
          ),
        },
      ],
    },
  ],
}

export default adminRoutes
