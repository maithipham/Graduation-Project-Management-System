import { useNavigate } from 'react-router-dom'
import {
  isUserRole,
  roleHomePaths,
  roleLabels,
  userRoles,
} from '../types'
import { useAuthStore } from '../store/authStore'
import { Select } from '@/shared/components/ui/select'

/**
 * Role Switcher cho phép chuyển đổi nhanh vai trò để test giao diện (#16)
 */
export function RoleSwitcher() {
  const navigate = useNavigate()
  const activeRole = useAuthStore((state) => state.activeRole)
  const setActiveRole = useAuthStore((state) => state.setActiveRole)

  if (!activeRole) return null

  return (
    <div className="inline-flex items-center gap-2 text-xs">
      <span className="text-slate-500 font-medium hidden sm:inline">Vai trò:</span>
      <div className="w-40">
        <Select
          aria-label="Chuyển vai trò"
          value={activeRole}
          onChange={(event) => {
            const role = event.target.value
            if (!isUserRole(role)) return
            setActiveRole(role)
            navigate(roleHomePaths[role])
          }}
          className="h-8 text-xs bg-slate-50/80 border-slate-300"
        >
          {userRoles.map((role) => (
            <option key={role} value={role}>
              {roleLabels[role]}
            </option>
          ))}
        </Select>
      </div>
    </div>
  )
}
