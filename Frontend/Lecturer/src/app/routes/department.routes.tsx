import { lazy, Suspense } from 'react'
import type { RouteObject } from 'react-router-dom'
import { DepartmentLayout } from '@/feature/department/layouts/DepartmentLayout'
import { LoadingFallback } from '@/shared/components/feedback/LoadingFallback'
import { ProtectedRoute } from '@/feature/auth/components/ProtectedRoute'

const DepartmentDashboardPage = lazy(() => import('@/feature/department/pages/DepartmentDashboardPage'))
const UserImportPage = lazy(() => import('@/feature/department/pages/UserImportPage'))
const SupervisorAssignmentPage = lazy(() => import('@/feature/department/pages/SupervisorAssignmentPage'))
const CouncilManagementPage = lazy(() => import('@/feature/department/pages/CouncilManagementPage'))
const RemindersPage = lazy(() => import('@/feature/department/pages/RemindersPage'))

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
