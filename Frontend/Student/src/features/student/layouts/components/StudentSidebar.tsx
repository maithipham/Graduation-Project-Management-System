import React, { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react'
import { studentNavItems } from './studentNav.config'

interface StudentSidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

// Style chung với sidebar portal cán bộ (Frontend/Lecturer/readme.md/sidebar_specification.md)
const ACTIVE_ITEM = 'bg-white/[0.18] text-white font-semibold shadow-xs'

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  collapsed,
  onToggle,
  mobileOpen = false,
  onMobileClose,
}) => {
  const location = useLocation()

  // Lắng nghe phím tắt Ctrl + B / Cmd + B để thu gọn menu
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

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 bg-[#1565C0] border-r border-[#0D47A1] text-blue-100 font-['Inter','Be_Vietnam_Pro',system-ui,-apple-system,sans-serif] flex flex-col select-none transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] shadow-xl ${collapsed ? 'w-[72px]' : 'w-[260px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
    >
      {/* ========================================================
          A. KHU VỰC LOGO & THƯƠNG HIỆU (Header Sidebar - h-16)
          ======================================================== */}
      <div
        className={`h-16 flex items-center border-b border-white/10 shrink-0 ${collapsed ? 'justify-center px-0' : 'px-5 gap-3'
          }`}
      >
        <div className="w-9 h-9 rounded-lg bg-white p-[1px] border border-white/20 flex items-center justify-center shrink-0 shadow-xs transition-transform duration-200 hover:scale-105 overflow-hidden">
          <img
            src="/logo.webp"
            alt="Logo Trường Đại học Thủy Lợi"
            className="w-full h-full object-contain scale-105"
          />
        </div>

        {!collapsed && (
          <div className="min-w-0 flex-1 overflow-hidden flex flex-col justify-center">
            <span className="block text-[13.5px] font-bold text-white tracking-tight leading-tight whitespace-nowrap">
              TLU CAPSTONE
            </span>
            <span className="block text-[10.5px] text-blue-200 font-medium tracking-wide uppercase leading-tight whitespace-nowrap mt-0.5">
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
          B. KHU VỰC MENU ĐIỀU HƯỚNG (<nav>)
          ======================================================== */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-thin scrollbar-thumb-white/20"
        aria-label="Điều hướng chính sinh viên"
      >
        {studentNavItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onMobileClose?.()}
              title={collapsed ? item.title : undefined}
              className={`group relative h-10 rounded-lg flex items-center text-[13px] transition-all duration-150 select-none ${collapsed
                ? 'w-11 mx-auto justify-center p-0'
                : 'w-full px-3 gap-3 justify-start'
                } ${isActive
                  ? ACTIVE_ITEM
                  : 'text-blue-100 font-medium hover:text-white hover:bg-white/10'
                }`}
            >
              {/* Thanh chỉ báo màu trắng nổi bật ở mép trái */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3.5px] h-5 rounded-r bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
              )}

              <Icon className="w-[18px] h-[18px] shrink-0" />

              {!collapsed && (
                <>
                  <span className="truncate flex-1 text-left leading-5">
                    {item.title}
                  </span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-amber-950 shrink-0">
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
          C. CHÂN SIDEBAR (Footer Sidebar)
          ======================================================== */}
      <div className="p-3 border-t border-white/10 mt-auto shrink-0">
        {/* Nút thu gọn chỉ có ý nghĩa trên desktop, mobile dùng nút X ở header */}
        <button
          type="button"
          onClick={onToggle}
          className={`hidden lg:flex h-10 items-center rounded-xl text-blue-100 hover:text-white hover:bg-white/10 transition-colors tracking-wide cursor-pointer ${collapsed
              ? 'w-11 mx-auto justify-center px-0'
              : 'w-full px-3 gap-3'
            }`}
          title={collapsed ? 'Mở rộng menu (Ctrl B)' : 'Thu gọn menu (Ctrl B)'}
          aria-label="Thu gọn hoặc mở rộng menu"
        >
          <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </span>

          {!collapsed && (
            <>
              {/* global.css đặt `button { font: inherit }` nên cỡ/độ đậm chữ phải đặt ở span, không đặt ở button */}
              <span className="truncate flex-1 text-left text-[13px] font-medium">Thu gọn menu</span>
              <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-[10px] font-semibold text-blue-200/90">
                Ctrl B
              </span>
            </>
          )}
        </button>

        <div className="mt-2 text-[10.5px] font-normal text-blue-200/50 text-center select-none truncate">
          {!collapsed ? 'v2.4.1 · TLU © 2025' : 'v2.4'}
        </div>
      </div>
    </aside>
  )
}

export default StudentSidebar
