import { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { LecturerLayout } from '@/features/lecturer'
import { withSuspense } from './withSuspense'

// Page nạp bằng lazy() → mỗi page là một chunk riêng, chỉ tải khi vào URL đó
const LecturerDashboardPage = lazy(
  () => import('@/features/lecturer/dashboard/pages/LecturerDashboardPage'),
)
const SupervisorRequestsPage = lazy(
  () =>
    import(
      '@/features/lecturer/supervisor_registration/pages/SupervisorRequestsPage'
    ),
)
const TopicProposalsPage = lazy(
  () => import('@/features/lecturer/topic_proposal/pages/TopicProposalsPage'),
)
const OutlineReviewPage = lazy(
  () => import('@/features/lecturer/outline_review/pages/OutlineReviewPage'),
)
const ReportCheckPage = lazy(
  () => import('@/features/lecturer/report_check/pages/ReportCheckPage'),
)
const GuidingEvaluationPage = lazy(
  () =>
    import(
      '@/features/lecturer/guiding_evaluation/pages/GuidingEvaluationPage'
    ),
)
const ThesisDefensePage = lazy(
  () =>
    import('@/features/lecturer/defense_management/pages/ThesisDefensePage'),
)
const DefenseCouncilPage = lazy(
  () =>
    import('@/features/lecturer/defense_management/pages/DefenseCouncilPage'),
)
const CouncilExaminerPage = lazy(
  () =>
    import('@/features/lecturer/defense_management/pages/CouncilExaminerPage'),
)
const DefenseReviewPage = lazy(
  () =>
    import('@/features/lecturer/defense_management/pages/DefenseReviewPage'),
)
const ExaminerGradingPage = lazy(
  () =>
    import('@/features/lecturer/defense_management/pages/ExaminerGradingPage'),
)
const LecturerTemplatesPage = lazy(
  () =>
    import(
      '@/features/lecturer/template_management/pages/LecturerTemplatesPage'
    ),
)
const LecturerProfilePage = lazy(
  () =>
    import(
      '@/features/lecturer/profile_management/pages/LecturerProfilePage'
    ),
)

export const lecturerRoutes: RouteObject = {
  path: 'lecturer',
  element: <LecturerLayout />,
  children: [
    {
      index: true,
      element: withSuspense(<LecturerDashboardPage />),
    },
    {
      path: 'topic-assignment',
      element: <Navigate to="/lecturer/supervisor-requests" replace />,
    },
    {
      path: 'supervisor-requests',
      element: withSuspense(<SupervisorRequestsPage />),
    },
    {
      path: 'topic-proposals',
      element: withSuspense(<TopicProposalsPage />),
    },
    {
      path: 'outline-review',
      element: withSuspense(<OutlineReviewPage />),
    },
    {
      path: 'thesis-execution',
      element: <Navigate to="/lecturer/report-check" replace />,
    },
    {
      path: 'report-check',
      element: withSuspense(<ReportCheckPage />),
    },
    {
      path: 'guiding-evaluation',
      element: withSuspense(<GuidingEvaluationPage />),
    },
    {
      path: 'progress-tracking',
      element: <Navigate to="/lecturer/guiding-evaluation" replace />,
    },
    {
      path: 'guiding-scores',
      element: <Navigate to="/lecturer/guiding-evaluation" replace />,
    },
    {
      path: 'defense',
      element: withSuspense(<ThesisDefensePage />),
    },
    {
      path: 'defense/councils',
      element: withSuspense(<DefenseCouncilPage />),
    },
    {
      path: 'defense/councils/:councilPublicId',
      element: withSuspense(<CouncilExaminerPage />),
    },
    {
      path: 'defense/reviews',
      element: withSuspense(<DefenseReviewPage />),
    },
    {
      path: 'defense/reviews/:examinerAssignmentPublicId',
      element: withSuspense(<ExaminerGradingPage />),
    },
    {
      path: 'templates',
      element: withSuspense(<LecturerTemplatesPage />),
    },
    {
      path: 'profile',
      element: withSuspense(<LecturerProfilePage />),
    },
  ],
}

export default lecturerRoutes
