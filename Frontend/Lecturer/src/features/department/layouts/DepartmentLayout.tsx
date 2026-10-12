import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { DepartmentSidebar } from './components/DepartmentSidebar'
import { DepartmentHeader } from './components/DepartmentHeader'

import '../styles/department.css'

export const DepartmentLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="dept-layout">
      <DepartmentSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="dept-main">
        <DepartmentHeader />
        <main className="dept-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DepartmentLayout
