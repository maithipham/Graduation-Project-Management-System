import type { ReactNode } from 'react'
import type { UserRole } from '../types'
import { useMyInfo } from '../hooks/useAuth'

type CanAccessProps = {
  allowedRoles: UserRole[]
  children: ReactNode
}

/**
 * Ẩn/hiện nút bấm hoặc khối UI theo role: chỉ hiện khi người dùng có ít nhất 1 role trong danh sách
 */
export function CanAccess({ allowedRoles, children }: CanAccessProps) {
  const { data: user } = useMyInfo()

  if (!user?.roles.some((role) => allowedRoles.includes(role))) return null

  return <>{children}</>
}
