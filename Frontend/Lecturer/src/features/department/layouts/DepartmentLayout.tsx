import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { DepartmentSidebar } from './components/DepartmentSidebar'
import { DepartmentHeader } from './components/DepartmentHeader'

export const DepartmentLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const [prevPath, setPrevPath] = useState(location.pathname)

  // Đóng mobile drawer nếu URL thay đổi
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname)
    setMobileOpen(false)
  }

  return (
    // data-own-scroll: trang tự cuộn trong <main>, html không cần giữ chỗ thanh cuộn (global.css)
    <div data-own-scroll className="min-h-screen bg-[#F5F7FB] text-[#1E293B]">
      {/* 1. Backdrop Overlay cho Mobile Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden transition-opacity duration-200 cursor-pointer"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 2. Sidebar cố định bên trái (w-[260px] hoặc w-[72px]) */}
      <DepartmentSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* 3. Khung nội dung chính với margin đồng bộ theo trạng thái Sidebar.
          Cao đúng 1 màn hình: header đứng yên, chỉ <main> cuộn. Nhờ vậy trang nào muốn
          lấp đầy phần còn lại (VD bảng sinh viên) chỉ cần `flex-1 min-h-0` */}
      <div
        className={`flex flex-col h-screen h-dvh min-w-0 transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
          collapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'
        } ml-0`}
      >
        <DepartmentHeader
          onToggleSidebar={() => setCollapsed(!collapsed)}
          onMobileToggle={() => setMobileOpen(!mobileOpen)}
        />
        <main className="flex flex-1 flex-col min-h-0 overflow-y-auto p-6 [scrollbar-gutter:stable]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DepartmentLayout
