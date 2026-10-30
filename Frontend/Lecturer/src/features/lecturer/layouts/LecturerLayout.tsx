import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { LecturerSidebar } from './components/LecturerSidebar'
import { LecturerHeader } from './components/LecturerHeader'

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'gv_sidebar_collapsed'

const VIEWPORT_LOCKED_PATHS = new Set([
  '/lecturer/supervisor-requests',
  '/lecturer/topic-proposals',
  '/lecturer/outline-review',
])

function loadInitialCollapsed(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const val = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY)
    return val === '1' || val === 'true'
  } catch {
    return false
  }
}

export const LecturerLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(loadInitialCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const [prevPath, setPrevPath] = useState(location.pathname)

  // Đóng mobile drawer nếu URL thay đổi
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname)
    setMobileOpen(false)
  }

  const handleToggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, next ? '1' : '0')
      } catch {
        // Bỏ qua lỗi lưu trữ nếu trình duyệt chặn localStorage
      }
      return next
    })
  }

  const isViewportLocked = VIEWPORT_LOCKED_PATHS.has(location.pathname)

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased"
      style={{
        fontFamily:
          '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* 1. Backdrop Overlay cho Mobile Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-200 cursor-pointer"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 2. Sidebar cố định bên trái (w-[260px] hoặc w-[72px]) */}
      <LecturerSidebar
        collapsed={collapsed}
        onToggle={handleToggleSidebar}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* 3. Khung nội dung chính với margin đồng bộ theo trạng thái Sidebar */}
      <div
        className={`flex flex-col min-w-0 transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isViewportLocked ? 'h-screen overflow-hidden' : 'min-h-screen'
        } ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'} ml-0`}
      >
        <LecturerHeader
          onToggleSidebar={handleToggleSidebar}
          onMobileToggle={() => setMobileOpen(!mobileOpen)}
        />
        <main
          id="content"
          className={
            isViewportLocked
              ? 'flex-1 min-h-0 px-4 sm:px-6 pt-1.5 pb-3 w-full max-w-full flex flex-col overflow-hidden transition-all duration-200'
              : `flex-1 p-6 w-full mx-auto transition-all duration-200 ${
                  collapsed ? 'max-w-full' : 'max-w-[1520px]'
                }`
          }
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default LecturerLayout
