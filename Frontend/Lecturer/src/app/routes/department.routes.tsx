import { lazy, Suspense } from 'react'
import type { RouteObject } from 'react-router-dom'
import { DepartmentLayout } from '@/features/department/layouts/DepartmentLayout'
import { LoadingFallback } from '@/shared/components/feedback/LoadingFallback'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'

const DepartmentDashboardPage = lazy(() => import('@/features/department/pages/DepartmentDashboardPage'))
const UserImportPage = lazy(() => import('@/features/department/pages/UserImportPage'))
const SupervisorAssignmentPage = lazy(() => import('@/features/department/pages/SupervisorAssignmentPage'))
const CouncilManagementPage = lazy(() => import('@/features/department/pages/CouncilManagementPage'))
const RemindersPage = lazy(() => import('@/features/department/pages/RemindersPage'))

export const departmentRoutes: RouteObject = {
  path: 'department',
  element: <ProtectedRoute allowedRoles={['department-head', 'secretary', 'admin']} />,
  children: [
    {
      element: <DepartmentLayout />,
      children: [
        {
          index: true,
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <DepartmentDashboardPage />
            </Suspense>
          ),
        },
        {
          path: 'users-import',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <UserImportPage />
            </Suspense>
          ),
        },
        {
          path: 'assignments',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <SupervisorAssignmentPage />
            </Suspense>
          ),
        },
        {
          path: 'councils',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <CouncilManagementPage />
            </Suspense>
          ),
        },
        {
          path: 'reminders',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <RemindersPage />
            </Suspense>
          ),
        },
      ],
    },
  ],
}

export default departmentRoutes
