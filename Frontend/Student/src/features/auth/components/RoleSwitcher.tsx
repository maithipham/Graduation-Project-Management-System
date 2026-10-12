import { roleLabels } from '../types'
import { useAuthStore } from '../store/authStore'
import { Badge } from '@/shared/components/ui/badge'
import { GraduationCap } from 'lucide-react'

/**
 * Hiển thị vai trò hiện tại của tài khoản Sinh viên
 */
export function RoleSwitcher() {
  const activeRole = useAuthStore((state) => state.activeRole)

  if (!activeRole) return null

  return (
    <div className="inline-flex items-center gap-1.5 text-xs">
      <Badge
        variant="outline"
        className="flex items-center gap-1 border-blue-300 bg-blue-50/60 text-blue-700 py-1 px-2.5 font-medium"
      >
        <GraduationCap className="h-3.5 w-3.5" />
        {roleLabels[activeRole] || 'Sinh viên'}
      </Badge>
    </div>
  )
}

