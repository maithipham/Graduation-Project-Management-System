import React from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, ShieldCheck } from 'lucide-react'
import { adminNavItems } from './adminNav.config'

interface AdminSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ collapsed, onToggle }) => {
  return (
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
          onClick={onToggle}
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
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
