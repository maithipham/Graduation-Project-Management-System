import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Layers,
  FileCheck,
  ClipboardList,
  GraduationCap,
  Building2,
  Menu,
  UserCheck,
  LogOut,
} from 'lucide-react'
import { RoleSwitcher } from '@/feature/auth/components/RoleSwitcher'
import { useAuthStore } from '@/feature/auth/store/authStore'

import '../styles/lecturer.css'

const lecturerNavItems = [
  { to: '/lecturer', label: 'Bảng điều khiển', icon: LayoutDashboard, end: true },
  { to: '/lecturer/topic-manage', label: 'Quản lý đề tài', icon: Layers },
  { to: '/lecturer/review-outline', label: 'Duyệt đề cương', icon: FileCheck },
  { to: '/lecturer/report-eval', label: 'Đánh giá tiến độ', icon: ClipboardList },
  { to: '/lecturer/council', label: 'Hội đồng chấm', icon: GraduationCap },
  { to: '/lecturer/department', label: 'Bộ môn & Khoa', icon: Building2 },
]

export const LecturerLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const clearAuth = useAuthStore((state) => state.clearAuth)

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="lecturer-layout">
      {/* Sidebar dành riêng cho Giảng viên */}
      <aside className={`lecturer-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="lecturer-sidebar-header">
          {!collapsed && (
            <div className="lecturer-sidebar-logo">
              <UserCheck size={22} />
              <span>GV Portal</span>
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

        <nav className="lecturer-nav" aria-label="Điều hướng giảng viên">
          {lecturerNavItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `lecturer-nav-item ${isActive ? 'active' : ''}`
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
      <div className="lecturer-main">
        <header className="lecturer-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
              Không gian làm việc Giảng viên
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <RoleSwitcher />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>
                TS. Trần Minh Khôi
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

        <main className="lecturer-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default LecturerLayout
