import { GraduationCap } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { roleLabels } from '../types'
import { useMyInfo } from '../hooks/useAuth'

/**
 * Hiển thị vai trò của tài khoản đang đăng nhập (portal sinh viên chỉ có 1 role nên không có nút chuyển)
 */
export function RoleSwitcher() {
  const { data: user } = useMyInfo()

  if (!user?.roles.includes('STUDENT')) return null

  return (
    <div className="inline-flex items-center gap-1.5 text-xs">
      <Badge
        variant="outline"
        className="flex items-center gap-1 border-blue-300 bg-blue-50/60 text-blue-700 py-1 px-2.5 font-medium"
      >
        <GraduationCap className="h-3.5 w-3.5" />
        {roleLabels.STUDENT}
      </Badge>
    </div>
  )
}
