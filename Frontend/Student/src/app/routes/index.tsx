import { lazy } from 'react'
import { useRoutes, type RouteObject } from 'react-router-dom'
import { HomeRedirect, ProtectedRoute, RequireAuth } from '@/features/auth'
import { NotFound } from '@/shared/components/feedback/NotFound'
import { studentRoutes } from './student.routes'
import { withSuspense } from './withSuspense'

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const AuthenticatePage = lazy(() => import('@/features/auth/pages/AuthenticatePage'))

const routes: RouteObject[] = [
  {
    path: 'login',
    element: withSuspense(<LoginPage />),
  },
  {
    // Google chuyển về đây sau khi chọn tài khoản (phải trùng VITE_GOOGLE_REDIRECT_URI)
    path: 'authenticate',
    element: withSuspense(<AuthenticatePage />),
  },
  {
    // Mọi route bên trong cần đăng nhập và có role STUDENT
    element: <RequireAuth />,
    children: [
      // "/" → dashboard /student
      { index: true, element: <HomeRedirect /> },
      { element: <ProtectedRoute allowedRoles={['STUDENT']} />, children: [studentRoutes] },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]

export function AppRouter() {
  return useRoutes(routes)
}

export default AppRouter
