import { lazy, Suspense } from 'react'
import { Navigate, useRoutes, type RouteObject } from 'react-router-dom'
import { LoadingFallback } from '@/shared/components/feedback/LoadingFallback'
import { NotFound } from '@/shared/components/feedback/NotFound'
import { studentRoutes } from './student.routes'

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: 'login',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <LoginPage />
      </Suspense>
    ),
  },
  studentRoutes,
  {
    path: '*',
    element: <NotFound />,
  },
]

export function AppRouter() {
  return useRoutes(routes)
}

export default AppRouter
