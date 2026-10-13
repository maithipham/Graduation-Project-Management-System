import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react'
import { lecturerNavItems } from './lecturerNav.config'

interface LecturerSidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export const LecturerSidebar: React.FC<LecturerSidebarProps> = ({
  collapsed,
  onToggle,
  mobileOpen = false,
  onMobileClose,
}) => {
  const location = useLocation()

  // Quản lý trạng thái mở/đóng của sub-menu Accordion (mặc định mở 'Feature 2')
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    '/lecturer/feature-2': true,
  })

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

  const handleAccordionToggle = (key: string) => {
    if (collapsed) {
      onToggle()
      setOpenSubmenus((prev) => ({ ...prev, [key]: true }))
      return
    }
    setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }))
  }

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
              GIẢNG VIÊN
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
        aria-label="Điều hướng chính giảng viên"
      >
        {lecturerNavItems.map((item) => {
          const Icon = item.icon
          const hasChildren = Boolean(item.children && item.children.length > 0)
          const isAccordionOpen = Boolean(openSubmenus[item.to])
          const isChildActive = Boolean(
            hasChildren &&
            item.children?.some((child) => location.pathname === child.to)
          )

          // 1. Mục Accordion đa cấp (Collapsible Sub-menu)
          if (hasChildren) {
            return (
              <div key={item.to} className="w-full">
                <button
                  type="button"
                  onClick={() => handleAccordionToggle(item.to)}
                  title={collapsed ? item.label : undefined}
                  className={`group relative w-full h-10 rounded-lg flex items-center transition-all duration-150 cursor-pointer select-none ${collapsed
                      ? 'w-11 h-11 mx-auto justify-center p-0'
                      : 'px-3 gap-3 justify-start'
                    } ${isChildActive
                      ? 'bg-white/[0.18] text-white font-medium shadow-xs'
                      : 'text-blue-100 hover:text-white hover:bg-white/10 font-medium'
                    }`}
                >
                  {/* Thanh chỉ báo màu trắng nổi bật ở mép trái khi mục con active */}
                  {isChildActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3.5px] h-[20px] rounded-r bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
                  )}

                  <span className="w-5 h-5 flex items-center justify-center shrink-0">
                    <Icon size={18} />
                  </span>

                  {!collapsed && (
                    <>
                      <span className="truncate flex-1 text-left text-[13.5px] font-medium leading-5">
                        {item.label}
                      </span>
                      <ChevronRight
                        size={15}
                        className={`text-blue-200/70 shrink-0 transition-transform duration-200 ${isAccordionOpen ? 'rotate-90 text-white' : ''
                          }`}
                      />
                    </>
                  )}
                </button>

                {/* Nhóm con (Sub-items với hiệu ứng max-height mượt mà) */}
                <div
                  className={`overflow-hidden transition-all duration-200 ease-in-out ${!collapsed && isAccordionOpen
                      ? 'max-h-48 opacity-100 pt-1 pb-0.5'
                      : 'max-h-0 opacity-0 py-0 pointer-events-none'
                    }`}
                >
                  <div className="pl-7 pr-1 space-y-1">
                    {item.children?.map((child) => {
                      const ChildIcon = child.icon
                      return (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={() => onMobileClose?.()}
                          className={({ isActive }) =>
                            `relative h-8.5 w-full px-2.5 rounded-md flex items-center gap-2.5 text-[12.5px] font-medium leading-5 transition-colors select-none ${isActive
                              ? 'bg-white/[0.18] text-white font-medium shadow-xs'
                              : 'text-blue-100/90 hover:text-white hover:bg-white/10'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[14px] rounded-r bg-white shadow-[0_0_4px_rgba(255,255,255,0.5)]" />
                              )}
                              <span className="w-4 h-4 flex items-center justify-center shrink-0">
                                <ChildIcon size={15} />
                              </span>
                              <span className="truncate text-left flex-1 font-medium leading-5">
                                {child.label}
                              </span>
                            </>
                          )}
                        </NavLink>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          }

          // 2. Mục đơn (Single Nav Item)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => onMobileClose?.()}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `group relative w-full h-10 rounded-lg flex items-center transition-all duration-150 select-none ${collapsed
                  ? 'w-11 h-11 mx-auto justify-center p-0'
                  : 'px-3 gap-3 justify-start'
                } ${isActive
                  ? 'bg-white/[0.18] text-white font-medium shadow-xs'
                  : 'text-blue-100 hover:text-white hover:bg-white/10 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Thanh chỉ báo màu trắng nổi bật ở mép trái */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3.5px] h-[20px] rounded-r bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
                  )}

                  <span className="w-5 h-5 flex items-center justify-center shrink-0">
                    <Icon size={18} />
                  </span>

                  {!collapsed && (
                    <span className="truncate flex-1 text-left text-[13.5px] font-medium leading-5">
                      {item.label}
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

export default LecturerSidebar
