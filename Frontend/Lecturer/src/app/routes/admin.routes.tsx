import { lazy } from 'react'
import { Navigate, type RouteObject } from 'react-router-dom'
import { AdminLayout } from '@/features/admin'
import { withSuspense } from './withSuspense'

const AdminDashboardPage = lazy(
  () => import('@/features/admin/dashboard/pages/AdminDashboardPage'),
)
const LecturerAccountListPage = lazy(
  () => import('@/features/admin/account_management/pages/LecturerAccountListPage'),
)
const StudentAccountListPage = lazy(
  () => import('@/features/admin/account_management/pages/StudentAccountListPage'),
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
    // URL cũ /admin/accounts (link ở Dashboard) → trang Giảng viên
    {
      path: 'accounts',
      element: <Navigate to="/admin/accounts-lecturer" replace />,
    },
    {
      path: 'accounts-lecturer',
      element: withSuspense(<LecturerAccountListPage />),
    },
    {
      path: 'accounts-students',
      element: withSuspense(<StudentAccountListPage />),
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
