import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  UserPlus2,
  UserCheck2,
  GraduationCap,
  BellRing,
  Menu,
  Building2,
  LogOut,
} from 'lucide-react'
import { RoleSwitcher } from '@/feature/auth/components/RoleSwitcher'
import { useAuthStore } from '@/feature/auth/store/authStore'

import '../styles/department.css'

const departmentNavItems = [
  { to: '/department', label: 'Tổng quan Bộ môn', icon: LayoutDashboard, end: true },
  { to: '/department/users-import', label: 'Import SV & GVHD', icon: UserPlus2 },
  { to: '/department/assignments', label: 'Phân công GVHD', icon: UserCheck2 },
  { to: '/department/councils', label: 'Thành lập Hội đồng', icon: GraduationCap },
  { to: '/department/reminders', label: 'Nhắc nhở tiến độ', icon: BellRing },
]

export const DepartmentLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="dept-layout">
      {/* Sidebar dành riêng cho Trưởng bộ môn */}
      <aside className={`dept-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="dept-sidebar-header">
          {!collapsed && (
            <div className="dept-sidebar-logo">
              <Building2 size={22} />
              <span>TBM Portal</span>
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

        <nav className="dept-nav" aria-label="Điều hướng trưởng bộ môn">
          {departmentNavItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `dept-nav-item ${isActive ? 'active' : ''}`
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
      <div className="dept-main">
        <header className="dept-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.9rem', color: '#0369a1', fontWeight: 600 }}>
              Cổng Quản lý Trưởng Bộ Môn & Khoa
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <RoleSwitcher />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>
                {user?.name || 'PGS. TS. Nguyễn Văn Hùng'}
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

        <main className="dept-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DepartmentLayout
