import { lazy } from 'react'
import { Navigate, useRoutes, type RouteObject } from 'react-router-dom'
import { NotFound } from '@/shared/components/feedback/NotFound'
import { studentRoutes } from './student.routes'
import { withSuspense } from './withSuspense'

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: 'login',
    element: withSuspense(<LoginPage />),
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
