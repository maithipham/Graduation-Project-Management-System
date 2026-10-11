import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users2,
  CalendarDays,
  GraduationCap,
  ShieldCheck,
  Menu,
  LogOut,
} from 'lucide-react'
import { RoleSwitcher } from '@/feature/auth/components/RoleSwitcher'
import { useAuthStore } from '@/feature/auth/store/authStore'

import '../styles/admin.css'

const adminNavItems = [
  { to: '/admin', label: 'Tổng quan Hệ thống', icon: LayoutDashboard, end: true },
  { to: '/admin/accounts', label: 'Quản lý Tài khoản', icon: Users2 },
  { to: '/admin/semesters', label: 'Quản lý Học kỳ', icon: CalendarDays },
  { to: '/admin/majors', label: 'Quản lý Chuyên ngành', icon: GraduationCap },
]

export const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="admin-layout">
      {/* Sidebar dành riêng cho Admin */}
      <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="admin-sidebar-header">
          {!collapsed && (
            <div className="admin-sidebar-logo">
              <ShieldCheck size={22} />
              <span>Admin Portal</span>
            </div>
          )}
          <button
            type="button"
            className="btn"
            style={{ padding: '6px', border: 'none', background: 'transparent', color: '#94a3b8' }}
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Thu gọn / mở rộng menu"
          >
            <Menu size={18} />
          </button>
        </div>

        <nav className="admin-nav" aria-label="Điều hướng quản trị viên">
          {adminNavItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `admin-nav-item ${isActive ? 'active' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>
      </aside>

      {/* Main Container */}
      <div className="admin-main">
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

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
