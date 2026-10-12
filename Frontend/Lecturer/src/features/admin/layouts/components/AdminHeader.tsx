import React from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { RoleSwitcher } from '@/features/auth/components/RoleSwitcher'
import { useAuthStore } from '@/features/auth/store/authStore'

export const AdminHeader: React.FC = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  return (
    <header className="admin-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '0.9rem', color: '#7e22ce', fontWeight: 600 }}>
          Cổng Quản Trị Hệ Thống Toàn Trường
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <RoleSwitcher />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>
            {user?.name || 'Quản trị viên Hệ thống'}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="btn"
            style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#ef4444' }}
            title="Đăng xuất"
          >
            <LogOut size={14} style={{ marginRight: 4 }} /> Thoát
          </button>
        </div>
      </div>
    </header>
  )
}
