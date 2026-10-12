import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AdminSidebar } from './components/AdminSidebar'
import { AdminHeader } from './components/AdminHeader'

import '../styles/admin.css'

export const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="admin-layout">
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="admin-main">
        <AdminHeader />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
