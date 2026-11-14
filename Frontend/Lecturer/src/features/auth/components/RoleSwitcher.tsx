import { ArrowLeftRight } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { roleHomePaths, roleLabels } from '../types'
import { useMyInfo } from '../hooks/useAuth'

/**
 * Nút chuyển qua lại giữa portal Trưởng bộ môn và Giảng viên.
 * Chỉ hiện với trưởng bộ môn (người duy nhất có 2 role). Chỉ đổi URL, không gọi API.
 */
export function RoleSwitcher() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { data: user } = useMyInfo()

  if (!user?.roles.includes('HEAD_OF_MAJOR')) return null

  const isOnDepartment = pathname.startsWith(roleHomePaths.HEAD_OF_MAJOR)
  const target = isOnDepartment ? 'SUPERVISOR' : 'HEAD_OF_MAJOR'
  const label = `Chuyển sang ${roleLabels[target]}`

  return (
    <button
      type="button"
      onClick={() => navigate(roleHomePaths[target])}
      className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:text-[#1565C0] hover:border-blue-200 hover:bg-blue-50/80 transition-colors cursor-pointer"
      title={label}
      aria-label={label}
    >
      <ArrowLeftRight size={14} className="shrink-0" />
      <span className="hidden md:inline">{roleLabels[target]}</span>
    </button>
  )
}
