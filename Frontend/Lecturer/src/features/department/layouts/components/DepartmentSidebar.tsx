import React from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, Building2 } from 'lucide-react'
import { departmentNavItems } from './departmentNav.config'

interface DepartmentSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export const DepartmentSidebar: React.FC<DepartmentSidebarProps> = ({ collapsed, onToggle }) => {
  return (
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
          onClick={onToggle}
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
              className={({ isActive }) => `dept-nav-item ${isActive ? 'active' : ''}`}
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
