import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { AdminLayout } from '@/features/admin'
import { withSuspense } from './withSuspense'

const AdminDashboardPage = lazy(
  () => import('@/features/admin/dashboard/pages/AdminDashboardPage'),
)
const AccountListPage = lazy(
  () => import('@/features/admin/account_management/pages/AccountListPage'),
)
const SemesterListPage = lazy(
  () => import('@/features/admin/semester_management/pages/SemesterListPage'),
)
const MajorManagementPage = lazy(
  () => import('@/features/admin/faculty_management/pages/MajorManagementPage'),
)

export const adminRoutes: RouteObject = {
  path: 'admin',
  element: <AdminLayout />,
  children: [
    {
      index: true,
      element: withSuspense(<AdminDashboardPage />),
    },
    {
      path: 'accounts',
      element: withSuspense(<AccountListPage />),
    },
    {
      path: 'semesters',
      element: withSuspense(<SemesterListPage />),
    },
    {
      path: 'faculties',
      element: withSuspense(<MajorManagementPage />),
    },
  ],
}

export default adminRoutes
