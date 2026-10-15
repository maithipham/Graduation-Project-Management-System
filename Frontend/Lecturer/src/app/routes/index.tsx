import { lazy } from 'react'
import { Navigate, useRoutes, type RouteObject } from 'react-router-dom'
import { PublicLayout } from '@/shared/components/layout/PublicLayout'
import { NotFound } from '@/shared/components/feedback/NotFound'
import { adminRoutes } from './admin.routes'
import { departmentRoutes } from './department.routes'
import { lecturerRoutes } from './lecturer.routes'
import { withSuspense } from './withSuspense'

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to="/department" replace />,
  },
  {
    path: 'login',
    element: withSuspense(<LoginPage />),
  },
  {
    element: <PublicLayout />,
    children: [
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
