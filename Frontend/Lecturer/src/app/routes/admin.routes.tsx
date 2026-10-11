import { lazy, Suspense } from 'react'
import type { RouteObject } from 'react-router-dom'
import { AdminLayout } from '@/feature/admin/layouts/AdminLayout'
import { LoadingFallback } from '@/shared/components/feedback/LoadingFallback'
import { ProtectedRoute } from '@/feature/auth/components/ProtectedRoute'

const AdminDashboardPage = lazy(() => import('@/feature/admin/pages/AdminDashboardPage'))
const AccountManagementPage = lazy(() => import('@/feature/admin/pages/AccountManagementPage'))
const SemesterManagementPage = lazy(() => import('@/feature/admin/pages/SemesterManagementPage'))
const MajorManagementPage = lazy(() => import('@/feature/admin/pages/MajorManagementPage'))

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
