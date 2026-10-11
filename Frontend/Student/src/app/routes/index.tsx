import { lazy, Suspense } from 'react'
import { Navigate, useRoutes, type RouteObject } from 'react-router-dom'
import { PublicLayout } from '@/shared/components/layout/PublicLayout'
import { LoadingFallback } from '@/shared/components/feedback/LoadingFallback'
import { NotFound } from '@/shared/components/feedback/NotFound'
import { studentRoutes } from './student.routes'

const LoginPage = lazy(() => import('@/feature/auth/pages/LoginPage'))


const routes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to="/student" replace />,
  },
  {
    element: <PublicLayout />,
    children: [
      {
        path: 'login',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: '404',
        element: <NotFound />,
      },
    ],
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
