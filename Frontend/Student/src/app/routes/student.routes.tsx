import { lazy, Suspense } from 'react'
import type { RouteObject } from 'react-router-dom'
import { StudentLayout } from '@/feature/student/layouts/StudentLayout'
import { LoadingFallback } from '@/shared/components/feedback/LoadingFallback'
import { ProtectedRoute } from '@/feature/auth/components/ProtectedRoute'


const StudentOverviewPage = lazy(() => import('@/feature/student/overview/pages/StudentOverviewPage'))
const StudentRegistrationPage = lazy(() => import('@/feature/student/registration/pages/StudentRegistrationPage'))
const StudentLecturerListPage = lazy(() => import('@/feature/student/lecturer-list/pages/StudentLecturerListPage'))
const StudentOutlinePage = lazy(() => import('@/feature/student/outline/pages/StudentOutlinePage'))
const StudentReportPage = lazy(() => import('@/feature/student/report/pages/StudentReportPage'))
const StudentSchedulePage = lazy(() => import('@/feature/student/schedule/pages/StudentSchedulePage'))
const StudentResultsPage = lazy(() => import('@/feature/student/results/pages/StudentResultsPage'))
const StudentDocumentsPage = lazy(() => import('@/feature/student/documents/pages/StudentDocumentsPage'))


export const studentRoutes: RouteObject = {
  path: 'student',
  element: <ProtectedRoute allowedRoles={['student']} />,
  children: [
    {
      element: <StudentLayout />,
      children: [
        {
          index: true,
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <StudentOverviewPage />
            </Suspense>
          ),
        },
        {
          path: 'registration',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <StudentRegistrationPage />
            </Suspense>
          ),
        },
        {
          path: 'lecturer-list',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <StudentLecturerListPage />
            </Suspense>
          ),
        },
        {
          path: 'outline',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <StudentOutlinePage />
            </Suspense>
          ),
        },
        {
          path: 'report',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <StudentReportPage />
            </Suspense>
          ),
        },
        {
          path: 'schedule',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <StudentSchedulePage />
            </Suspense>
          ),
        },
        {
          path: 'results',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <StudentResultsPage />
            </Suspense>
          ),
        },
        {
          path: 'documents',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <StudentDocumentsPage />
            </Suspense>
          ),
        },
      ],
    },
  ],
}
