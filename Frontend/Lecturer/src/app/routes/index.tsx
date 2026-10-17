import { lazy } from 'react'
import { useRoutes, type RouteObject } from 'react-router-dom'
import { HomeRedirect, ProtectedRoute, RequireAuth } from '@/features/auth'
import { PublicLayout } from '@/shared/components/layout/PublicLayout'
import { NotFound } from '@/shared/components/feedback/NotFound'
import { adminRoutes } from './admin.routes'
import { departmentRoutes } from './department.routes'
import { lecturerRoutes } from './lecturer.routes'
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
    // Mọi route bên trong cần đăng nhập; mỗi portal cần thêm role tương ứng
    element: <RequireAuth />,
    children: [
      { index: true, element: <HomeRedirect /> },
      { element: <ProtectedRoute allowedRoles={['ADMIN']} />, children: [adminRoutes] },
      {
        element: <ProtectedRoute allowedRoles={['HEAD_OF_DEPARTMENT']} />,
        children: [departmentRoutes],
      },
      { element: <ProtectedRoute allowedRoles={['LECTURER']} />, children: [lecturerRoutes] },
    ],
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
  {
    path: '*',
    element: <NotFound />,
  },
]

export function AppRouter() {
  return useRoutes(routes)
}

export default AppRouter
