import { lazy, Suspense } from 'react'
import type { RouteObject } from 'react-router-dom'
import { LecturerLayout } from '@/feature/lecturer/layouts/LecturerLayout'
import { LoadingFallback } from '@/shared/components/feedback/LoadingFallback'
import { ProtectedRoute } from '@/feature/auth/components/ProtectedRoute'

const LecturerDashboardPage = lazy(() => import('@/feature/lecturer/dashboard/pages/LecturerDashboardPage'))
const TopicManagePage = lazy(() => import('@/feature/lecturer/topic-manage/pages/TopicManagePage'))
const ReviewOutlinePage = lazy(() => import('@/feature/lecturer/review-outline/pages/ReviewOutlinePage'))
const ReportEvalPage = lazy(() => import('@/feature/lecturer/report-eval/pages/ReportEvalPage'))
const CouncilPage = lazy(() => import('@/feature/lecturer/council/pages/CouncilPage'))
const DepartmentPage = lazy(() => import('@/feature/lecturer/department/pages/DepartmentPage'))

export const lecturerRoutes: RouteObject = {
  path: 'lecturer',
  element: <ProtectedRoute allowedRoles={['lecturer', 'department-head', 'secretary', 'council', 'admin']} />,

  children: [
    {
      element: <LecturerLayout />,
      children: [
        {
          index: true,
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <LecturerDashboardPage />
            </Suspense>
          ),
        },
        {
          path: 'topic-manage',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <TopicManagePage />
            </Suspense>
          ),
        },
        {
          path: 'review-outline',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <ReviewOutlinePage />
            </Suspense>
          ),
        },
        {
          path: 'report-eval',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <ReportEvalPage />
            </Suspense>
          ),
        },
        {
          path: 'council',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <CouncilPage />
            </Suspense>
          ),
        },
        {
          path: 'department',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <DepartmentPage />
            </Suspense>
          ),
        },
      ],
    },
  ],
}
