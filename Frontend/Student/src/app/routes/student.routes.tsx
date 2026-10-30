import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { StudentLayout } from '@/shared'
import { withSuspense } from './withSuspense'

// Lazy load các trang tính năng của Sinh viên từ các module ngang hàng với auth
const StudentRegistrationPage = lazy(
  () => import('@/features/registration_management/pages/StudentRegistrationPage'),
)
const StudentLecturersPage = lazy(
  () => import('@/features/lecturer_list/pages/StudentLecturersPage'),
)
const StudentOutlinePage = lazy(
  () => import('@/features/outline_management/pages/StudentOutlinePage'),
)
const StudentReportsPage = lazy(
  () => import('@/features/reports_management/pages/StudentReportsPage'),
)
const StudentSchedulePage = lazy(
  () => import('@/features/schedule_management/pages/StudentSchedulePage'),
)
const StudentResultsPage = lazy(
  () => import('@/features/score_management/pages/StudentResultsPage'),
)
const StudentDocumentsPage = lazy(
  () => import('@/features/template_management/pages/StudentDocumentsPage'),
)
const StudentProfilePage = lazy(
  () => import('@/features/profile_management/pages/StudentProfilePage'),
)

// Đã nằm trong <RequireAuth /> + <ProtectedRoute allowedRoles={['STUDENT']} /> ở routes/index.tsx
export const studentRoutes: RouteObject = {
  path: 'student',
  element: <StudentLayout />,
  children: [
    {
      index: true,
      element: withSuspense(<StudentRegistrationPage />),
    },
    {
      path: 'registration',
      element: withSuspense(<StudentRegistrationPage />),
    },
    {
      path: 'lecturers',
      element: withSuspense(<StudentLecturersPage />),
    },
    {
      path: 'outline',
      element: withSuspense(<StudentOutlinePage />),
    },
    {
      path: 'reports',
      element: withSuspense(<StudentReportsPage />),
    },
    {
      path: 'schedule',
      element: withSuspense(<StudentSchedulePage />),
    },
    {
      path: 'results',
      element: withSuspense(<StudentResultsPage />),
    },
    {
      path: 'documents',
      element: withSuspense(<StudentDocumentsPage />),
    },
    {
      path: 'files',
      element: withSuspense(<StudentDocumentsPage />),
    },
    {
      path: 'profile',
      element: withSuspense(<StudentProfilePage />),
    },
  ],
}

export default studentRoutes
