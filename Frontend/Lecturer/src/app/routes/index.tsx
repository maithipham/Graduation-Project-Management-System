import { lazy, Suspense } from 'react'
import { Navigate, useRoutes, type RouteObject } from 'react-router-dom'
import { PublicLayout } from '@/shared/components/layout/PublicLayout'
import { LoadingFallback } from '@/shared/components/feedback/LoadingFallback'
import { NotFound } from '@/shared/components/feedback/NotFound'
import { adminRoutes } from './admin.routes'
import { departmentRoutes } from './department.routes'
import { lecturerRoutes } from './lecturer.routes'

const LoginPage = lazy(() => import('@/feature/auth/pages/LoginPage'))


const routes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to="/lecturer" replace />,
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
  adminRoutes,
  departmentRoutes,
  lecturerRoutes,
  {
    path: '*',
    element: <NotFound />,
  },
]

export function AppRouter() {
  return useRoutes(routes)
}

export default AppRouter
