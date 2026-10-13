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
      className={`fixed inset-y-0 left-0 z-40 bg-[#1565C0] border-r border-[#0D47A1] text-blue-100 flex flex-col select-none transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] shadow-xl ${collapsed ? 'w-[72px]' : 'w-[260px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
    >
      {/* ========================================================
          A. KHU VỰC LOGO & THƯƠNG HIỆU (Header Sidebar - h-16)
          ======================================================== */}
      <div
        className={`h-16 px-4 flex items-center border-b border-white/10 shrink-0 ${collapsed ? 'justify-center px-0' : 'gap-3'
          }`}
      >
        <div className="w-[36px] h-[36px] rounded-lg bg-white p-[1px] flex items-center justify-center shrink-0 shadow-xs transition-transform duration-200 hover:scale-105 overflow-hidden">
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
          B. KHU VỰC MENU ĐIỀU HƯỚNG (<nav>)
          ======================================================== */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-white/20"
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
              className={`group relative w-full h-10 rounded-lg flex items-center transition-all duration-150 select-none ${collapsed
                ? 'w-11 h-11 mx-auto justify-center p-0'
                : 'px-3 gap-3 justify-start'
                } ${isActive
                  ? 'bg-white/[0.18] text-white font-medium shadow-xs'
                  : 'text-blue-100 hover:text-white hover:bg-white/10 font-medium'
                }`}
            >
              {/* Thanh chỉ báo màu trắng nổi bật ở mép trái */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3.5px] h-[20px] rounded-r bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
              )}

              <span className="w-5 h-5 flex items-center justify-center shrink-0">
                <Icon size={18} />
              </span>

              {!collapsed && (
                <>
                  <span className="truncate flex-1 text-left text-[13.5px] font-medium leading-5">
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
      <div className="border-t border-white/10 p-3 shrink-0 flex flex-col gap-2">
        {/* Nút thu gọn / mở rộng Sidebar Desktop */}
        <button
          type="button"
          onClick={onToggle}
          className={`hidden lg:flex items-center rounded-xl text-xs font-medium text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ${collapsed ? 'h-9 w-9 justify-center mx-auto' : 'h-9 px-3 gap-2.5 w-full'
            }`}
          title={collapsed ? 'Mở rộng menu (Ctrl + B)' : 'Thu gọn menu (Ctrl + B)'}
          aria-label="Thu gọn / mở rộng menu"
        >
          {collapsed ? (
            <PanelLeftOpen size={16} />
          ) : (
            <>
              <PanelLeftClose size={16} />
              <span className="truncate">Thu gọn menu</span>
              <kbd className="ml-auto text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-blue-100">
                Ctrl+B
              </kbd>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}

export default StudentSidebar
