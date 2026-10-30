import React, { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { studentNavItems } from './studentNav.config'

interface StudentSidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  collapsed,
  onToggle,
  mobileOpen = false,
  onMobileClose,
}) => {
  const location = useLocation()

  // Lắng nghe phím tắt Ctrl + B / Cmd + B để thu gọn / mở rộng menu (chuẩn gv_ui)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        onToggle()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onToggle])

  const handleNavClick = () => {
    try {
      sessionStorage.removeItem('student_lecturer_filters_v1')
      sessionStorage.setItem('student_lecturer_from_sidebar', '1')
    } catch {
      // ignore storage errors
    }
    onMobileClose?.()
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 bg-[#1565C0] border-r border-[#0D47A1] text-blue-100 flex flex-col select-none transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] shadow-xl ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      style={{
        fontFamily:
          '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
      aria-label="Thanh điều hướng Cổng Sinh Viên"
    >
      {/* ========================================================
          A. KHU VỰC LOGO & THƯƠNG HIỆU (Header Sidebar - h-16)
          ======================================================== */}
      <div
        className={`sidebar-brand h-16 flex items-center border-b border-white/10 shrink-0 transition-all duration-200 ${
          collapsed ? 'justify-center px-0' : 'gap-3 px-4'
        }`}
      >
        <div className="w-[38px] h-[38px] rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-xs transition-transform duration-200 hover:scale-105 overflow-hidden">
          <img
            src="/logo.webp"
            alt="Logo Trường Đại học Thủy Lợi"
            className="w-full h-full object-contain scale-105"
          />
        </div>

        {!collapsed && (
          <div className="min-w-0 flex-1 overflow-hidden flex flex-col justify-center">
            <span className="block text-[13.5px] font-bold text-white tracking-wider leading-tight whitespace-nowrap">
              TLU CAPSTONE
            </span>
            <span className="block text-[10.5px] text-blue-200 font-medium tracking-wider uppercase leading-tight whitespace-nowrap mt-0.5">
              CỔNG SINH VIÊN
            </span>
          </div>
        )}

        {/* Nút đóng trên mobile drawer */}
        {mobileOpen && onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            className="lg:hidden p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 ml-auto cursor-pointer"
            aria-label="Đóng thanh điều hướng"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ========================================================
          B. KHU VỰC MENU ĐIỀU HƯỚNG (<nav> - Chuẩn cỡ chữ gv_ui text-[13px])
          ======================================================== */}
      <nav
        className="sidebar-scroll flex-1 overflow-y-auto py-3 px-3 space-y-1.5 scrollbar-thin scrollbar-thumb-white/20"
        aria-label="Điều hướng chính sinh viên"
      >
        {studentNavItems.map((item) => {
          const Icon = item.icon
          const isActive =
            location.pathname === item.path ||
            (item.path === '/student/registration' &&
              (location.pathname === '/student' || location.pathname === '/student/')) ||
            (item.path === '/student/documents' && location.pathname === '/student/files')

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              title={collapsed ? item.title : undefined}
              className={`nav-item group relative w-full h-10 rounded-lg flex items-center transition-all duration-150 select-none ${
                collapsed
                  ? 'w-11 h-11 mx-auto justify-center p-0'
                  : 'px-3 gap-3 justify-start'
              } ${
                isActive
                  ? 'bg-white/[0.18] text-white font-semibold shadow-xs'
                  : 'text-blue-100 hover:text-white hover:bg-white/10 font-medium'
              }`}
            >
              {/* Vạch định vị active màu trắng ở mép trái (chuẩn gv_ui) */}
              {isActive && !collapsed && (
                <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-[3.5px] h-[20px] rounded-r bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
              )}

              <span className="w-[18px] h-[18px] flex items-center justify-center shrink-0 text-white">
                <Icon size={18} />
              </span>

              {!collapsed && (
                <>
                  <span
                    className={`truncate flex-1 text-left text-[13px] leading-5 ${
                      isActive ? 'font-semibold text-white' : 'font-medium text-blue-100'
                    }`}
                  >
                    {item.title}
                  </span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-[10.5px] font-bold rounded-full bg-rose-500 text-white shrink-0 leading-none shadow-2xs">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* ========================================================
          C. CHÂN SIDEBAR (Footer Sidebar - Chuẩn 100% theo gv_ui)
          ======================================================== */}
      <div className="sidebar-footer border-t border-white/10 p-3 shrink-0 flex flex-col gap-1.5 transition-all duration-200">
        <button
          type="button"
          onClick={onToggle}
          className={`collapse-toggle group relative w-full flex items-center justify-between h-10 px-3 rounded-xl text-[13px] font-medium text-blue-100 hover:text-white hover:bg-white/10 active:bg-white/20 active:scale-[0.98] transition-all duration-200 cursor-pointer select-none ${
            collapsed ? 'w-11 h-11 mx-auto justify-center p-0' : 'px-3'
          }`}
          title={collapsed ? 'Mở rộng menu (Ctrl + B)' : 'Thu gọn menu (Ctrl + B)'}
          aria-label="Thu gọn / mở rộng menu"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="collapse-icon-box w-7 h-7 rounded-lg bg-white/10 group-hover:bg-white/20 border border-white/15 flex items-center justify-center shrink-0 text-white transition-all duration-200 shadow-sm">
              {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </div>
            {!collapsed && (
              <span className="truncate text-[13px] font-medium tracking-wide">
                Thu gọn menu
              </span>
            )}
          </div>

          {!collapsed && (
            <div className="flex items-center gap-1 shrink-0">
              <kbd className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-blue-200/90 group-hover:text-white group-hover:bg-white/20 transition-colors">
                Ctrl B
              </kbd>
            </div>
          )}
        </button>

        {!collapsed && (
          <div className="flex items-center justify-between px-3 pt-2 text-[10.5px] text-blue-200/50 font-normal">
            <span>v2.4.1</span>
            <span>TLU © 2026</span>
          </div>
        )}
      </div>
    </aside>
  )
}

export default StudentSidebar
