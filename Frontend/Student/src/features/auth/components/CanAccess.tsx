import type { ReactNode } from 'react'
import type { UserRole } from '../types'
import { useAuthStore } from '../store/authStore'

type CanAccessProps = {
  allowedRoles: UserRole[]
  children: ReactNode
}

/**
 * Component kiểm tra quyền để ẩn/hiện nút bấm hoặc khối UI (Kỹ thuật #15)
 */
export function CanAccess({ allowedRoles, children }: CanAccessProps) {
  const activeRole = useAuthStore((state) => state.activeRole)

  if (!activeRole || !allowedRoles.includes(activeRole)) return null

  return <>{children}</>
}
