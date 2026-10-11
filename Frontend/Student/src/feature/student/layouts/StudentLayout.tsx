import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FilePlus2,
  Users,
  FileText,
  FileCheck2,
  Calendar,
  Award,
  BookOpen,
  Menu,
  GraduationCap,
  LogOut,
} from 'lucide-react'
import { RoleSwitcher } from '@/feature/auth/components/RoleSwitcher'
import { useAuthStore } from '@/feature/auth/store/authStore'

import '../styles/student.css'

const studentNavItems = [
  { to: '/student', label: 'Tổng quan tiến độ', icon: LayoutDashboard, end: true },
  { to: '/student/registration', label: 'Đăng ký đề tài', icon: FilePlus2 },
  { to: '/student/lecturer-list', label: 'Danh sách GVHD', icon: Users },
  { to: '/student/outline', label: 'Đề cương đồ án', icon: FileText },
  { to: '/student/report', label: 'Báo cáo tiến độ', icon: FileCheck2 },
  { to: '/student/schedule', label: 'Lịch bảo vệ', icon: Calendar },
  { to: '/student/results', label: 'Kết quả đánh giá', icon: Award },
  { to: '/student/documents', label: 'Biểu mẫu & Hướng dẫn', icon: BookOpen },
]

export const StudentLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const clearAuth = useAuthStore((state) => state.clearAuth)

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="student-layout">
      {/* Sidebar dành riêng cho Sinh viên */}
      <aside className={`student-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="student-sidebar-header">
          {!collapsed && (
            <div className="student-sidebar-logo">
              <GraduationCap size={22} />
              <span>SV Portal</span>
            </div>
          )}
          <button
            type="button"
            className="btn"
            style={{ padding: '6px', border: 'none', background: 'transparent' }}
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Thu gọn / mở rộng menu"
          >
            <Menu size={18} />
          </button>
        </div>

        <nav className="student-nav" aria-label="Điều hướng sinh viên">
          {studentNavItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `student-nav-item ${isActive ? 'active' : ''}`
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
      <div className="student-main">
        <header className="student-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>
              Hệ thống Quản lý Đồ án Tốt nghiệp
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <RoleSwitcher />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1e293b' }}>
                Sinh viên An
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

        <main className="student-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default StudentLayout
