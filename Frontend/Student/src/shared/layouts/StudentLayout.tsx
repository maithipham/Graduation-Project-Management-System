import React, { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { SemesterProvider } from '@/shared/contexts'
import { StudentSidebar } from './components/StudentSidebar'
import { StudentHeader } from './components/StudentHeader'

const SIDEBAR_STORAGE_KEY = 'student_sidebar_collapsed'

export const StudentLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const [prevPath, setPrevPath] = useState(location.pathname)

  // Đóng mobile drawer nếu URL thay đổi
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname)
    setMobileOpen(false)
  }

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? '1' : '0')
      } catch {
        // ignore
      }
      return next
    })
  }

  // Phím tắt Ctrl+B thu gọn / mở rộng Sidebar giống student_ui
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault()
        setCollapsed((prev) => {
          const next = !prev
          try {
            localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? '1' : '0')
          } catch {
            // ignore
          }
          return next
        })
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const isLecturersPage = location.pathname.startsWith('/student/lecturers')
  const isOutlinePage = location.pathname.startsWith('/student/outline')

  return (
    <SemesterProvider>
      <div
        className={`bg-[#F1F5F9] text-slate-800 antialiased ${
          isLecturersPage ? 'h-screen overflow-hidden' : 'min-h-screen'
        }`}
      >
        {/* 1. Backdrop Overlay cho Mobile Drawer */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 lg:hidden transition-opacity duration-200 cursor-pointer"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* 2. Sidebar cố định bên trái (w-[260px] hoặc w-[72px]) */}
        <StudentSidebar
          collapsed={collapsed}
          onToggle={toggleCollapsed}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        {/* 3. Khung nội dung chính với margin đồng bộ theo trạng thái Sidebar (khi thu hẹp sidebar khối nội dung tự giãn ra full width) */}
        <div
          className={`flex flex-col min-w-0 bg-[#F1F5F9] transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
            collapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'
          } ml-0 ${isLecturersPage ? 'h-screen overflow-hidden' : 'min-h-screen'}`}
        >
          <StudentHeader
            onToggleSidebar={toggleCollapsed}
            onMobileToggle={() => setMobileOpen(!mobileOpen)}
          />
          <main
            className={
              isLecturersPage
                ? 'flex-1 min-h-0 px-4 sm:px-6 pt-2.5 pb-4 max-w-[1400px] w-full mx-auto flex flex-col overflow-hidden'
                : isOutlinePage
                  ? 'flex-1 px-4 sm:px-6 pt-1 pb-6 w-full max-w-full transition-all duration-200'
                  : 'flex-1 px-4 sm:px-6 pt-2.5 pb-6 lg:pb-8 w-full max-w-full transition-all duration-200'
            }
          >
            <Outlet />
          </main>
        </div>
      </div>
    </SemesterProvider>
  )
}

export default StudentLayout
