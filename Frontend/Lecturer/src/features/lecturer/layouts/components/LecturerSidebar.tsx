import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react'
import {
  computeLecturerBadges,
  useLecturerPortalStore,
} from '@/features/lecturer/lecturer_portal_storage'
import {
  lecturerNavItems,
  type LecturerNavBadgeKey,
} from './lecturerNav.config'

interface LecturerSidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

function getInitialOpenSubmenus(pathname: string): Record<string, boolean> {
  const initial: Record<string, boolean> = {
    '/lecturer/topic-assignment': true,
    '/lecturer/thesis-execution': true,
  }
  for (const item of lecturerNavItems) {
    if (item.children?.some((child) => child.to === pathname)) {
      initial[item.to] = true
    }
  }
  return initial
}

export const LecturerSidebar: React.FC<LecturerSidebarProps> = ({
  collapsed,
  onToggle,
  mobileOpen = false,
  onMobileClose,
}) => {
  const location = useLocation()

  const supervisorRequests = useLecturerPortalStore((s) => s.supervisorRequests)
  const topicProposals = useLecturerPortalStore((s) => s.topicProposals)
  const outlines = useLecturerPortalStore((s) => s.outlines)
  const reports = useLecturerPortalStore((s) => s.reports)

  const badges = useMemo(
    () =>
      computeLecturerBadges({
        supervisorRequests,
        topicProposals,
        outlines,
        reports,
      }),
    [supervisorRequests, topicProposals, outlines, reports],
  )

  const getBadgeCount = (badgeKey?: LecturerNavBadgeKey): number => {
    switch (badgeKey) {
      case 'supervisorRequests':
        return badges.supervisorRequests || 8
      case 'topicProposals':
        return badges.topicProposals || 6
      case 'outlines':
        return badges.outlines || 12
      case 'reports':
        return badges.reports || 2
      case 'topicAssignmentGroup':
        return (badges.supervisorRequests || 8) + (badges.topicProposals || 6)
      case 'thesisExecutionGroup':
        return badges.reports || 2
      default:
        return 0
    }
  }

  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>(() =>
    getInitialOpenSubmenus(location.pathname),
  )
  const [prevPath, setPrevPath] = useState(location.pathname)

  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname)
    const activeParent = lecturerNavItems.find((item) =>
      item.children?.some((child) => child.to === location.pathname),
    )
    if (activeParent && !openSubmenus[activeParent.to]) {
      setOpenSubmenus((prev) => ({ ...prev, [activeParent.to]: true }))
    }
  }

  // Lắng nghe phím tắt Ctrl + B / Cmd + B để thu gọn menu (Chuẩn theo sidebar.js)
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
    <>
      <style>{`
        .sidebar-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.22);
          border-radius: 6px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.4);
        }
      `}</style>
      <aside
        id="sidebar"
        className={`sidebar fixed inset-y-0 left-0 z-40 bg-[#1565C0] text-blue-100 border-r border-[#0D47A1] flex flex-col shadow-sm select-none transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
          collapsed ? 'w-[72px]' : 'w-[260px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{
          fontFamily:
            '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* ========================================================
            A. KHU VỰC LOGO & THƯƠNG HIỆU (Header Sidebar - h-16)
            ======================================================== */}
        <div className="relative">
          <NavLink
            to="/lecturer"
            end
            onClick={() => onMobileClose?.()}
            className={`sidebar-brand h-16 flex items-center border-b border-white/10 shrink-0 transition-all duration-200 hover:bg-white/5 ${
              collapsed ? 'justify-center px-0' : 'gap-3 px-4'
            }`}
            title="Trang chủ Cổng Giảng viên"
          >
            <div className="w-[38px] h-[38px] rounded-2xl bg-white p-1 flex items-center justify-center shrink-0 shadow-xs transition-transform duration-200 hover:scale-105 overflow-hidden">
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
                  CỔNG GIẢNG VIÊN
                </span>
              </div>
            )}
          </NavLink>

          {/* Nút đóng trên mobile drawer */}
          {mobileOpen && onMobileClose && (
            <button
              type="button"
              onClick={onMobileClose}
              className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
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
          id="nav"
          className="sidebar-scroll flex-1 overflow-y-auto py-3 px-3 space-y-1.5"
          aria-label="Điều hướng chính giảng viên"
        >
          {lecturerNavItems.map((item) => {
            const Icon = item.icon
            const hasChildren = Boolean(item.children && item.children.length > 0)
            const isAccordionOpen = Boolean(openSubmenus[item.to])
            const parentBadgeCount = getBadgeCount(item.badgeKey)

            // 1. Mục Accordion đa cấp (Giao đề tài, Làm đồ án)
            if (hasChildren) {
              return (
                <div
                  key={item.to}
                  className="accordion-item w-full"
                  data-acc={item.to.replace('/lecturer/', '')}
                >
                  <button
                    type="button"
                    onClick={() => handleAccordionToggle(item.to)}
                    title={collapsed ? item.label : undefined}
                    className={`accordion-btn sb-item group relative w-full h-10 px-3 rounded-lg text-[13px] font-medium flex items-center justify-between transition-all duration-150 cursor-pointer select-none text-blue-100 hover:text-white hover:bg-white/10 ${
                      collapsed
                        ? 'w-11 h-11 mx-auto justify-center p-0'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-[18px] h-[18px] flex items-center justify-center shrink-0 text-white">
                        <Icon size={18} />
                      </span>
                      {!collapsed && (
                        <span className="sb-hide flex-1 text-left truncate text-[13px] font-medium leading-5">
                          {item.label}
                        </span>
                      )}
                    </div>

                    {collapsed && parentBadgeCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#1565C0]" />
                    )}

                    {!collapsed && (
                      <div className="flex items-center gap-1.5 sb-hide">
                        {parentBadgeCount > 0 && (
                          <span className="px-2 py-0.5 text-[10.5px] font-bold rounded-full bg-rose-500 text-white leading-none shrink-0 shadow-xs">
                            {parentBadgeCount}
                          </span>
                        )}
                        <ChevronRight
                          size={16}
                          style={{
                            transform: isAccordionOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                          className={`accordion-chev w-4 h-4 text-blue-200/70 shrink-0 ${
                            isAccordionOpen ? 'open' : ''
                          }`}
                        />
                      </div>
                    )}
                  </button>

                  {/* Nhóm menu con cấp 2 (Indent pl-3 chuẩn theo bản gốc gv_ui) */}
                  <div
                    className={`accordion-body pl-3 mt-1 space-y-0.5 overflow-hidden transition-all duration-200 ease-in-out ${
                      !collapsed && isAccordionOpen
                        ? 'max-h-72 opacity-100 open'
                        : 'max-h-0 opacity-0 py-0 pointer-events-none'
                    }`}
                  >
                    {item.children?.map((child) => {
                      const childBadgeCount = getBadgeCount(child.badgeKey)

                      return (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={() => onMobileClose?.()}
                          className={({ isActive }) =>
                            `nav-sub w-full flex items-center justify-between h-9 pl-6 pr-3 rounded-lg text-[12.5px] font-medium transition select-none ${
                              isActive
                                ? 'active bg-white/20 text-white font-semibold shadow-xs'
                                : 'text-blue-200 hover:bg-white/10 hover:text-white'
                            }`
                          }
                        >
                          <span className="sb-hide truncate leading-5">
                            {child.label}
                          </span>
                          {childBadgeCount > 0 && (
                            <span className="sb-hide px-2 py-0.5 text-[10.5px] font-bold rounded-full bg-rose-500 text-white shrink-0 leading-none ml-1.5 shadow-xs">
                              {childBadgeCount}
                            </span>
                          )}
                        </NavLink>
                      )
                    })}
                  </div>
                </div>
              )
            }

            // 2. Mục đơn (Tổng quan, Bảo vệ đồ án, Tài liệu mẫu)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => onMobileClose?.()}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `nav-item relative w-full flex items-center gap-3 h-10 px-3 rounded-lg text-[13px] font-medium transition select-none ${
                    collapsed
                      ? 'w-11 h-11 mx-auto justify-center p-0'
                      : ''
                  } ${
                    isActive
                      ? 'active bg-white/20 text-white font-semibold shadow-xs'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {() => (
                  <>
                    <span className="w-[18px] h-[18px] flex items-center justify-center shrink-0 text-white">
                      <Icon size={18} />
                    </span>

                    {!collapsed && (
                      <span className="sb-hide flex-1 text-left truncate text-[13px] leading-5">
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
            C. CHÂN SIDEBAR (Footer Sidebar - Chuẩn 100% gv_ui / sidebar.js)
            ======================================================== */}
        <div className="sidebar-footer border-t border-white/10 p-3 shrink-0 flex flex-col gap-1.5 transition-all duration-200">
          <button
            id="collapseBtn"
            type="button"
            onClick={onToggle}
            className={`collapse-toggle group relative w-full flex items-center justify-between h-10 px-3 rounded-xl text-[13px] font-medium text-blue-100 hover:text-white hover:bg-white/10 active:bg-white/20 active:scale-[0.98] transition-all duration-200 cursor-pointer select-none ${
              collapsed ? 'w-11 h-11 mx-auto justify-center p-0 rounded-xl' : ''
            }`}
            title={collapsed ? 'Mở rộng menu (Ctrl+B)' : 'Thu gọn menu (Ctrl+B)'}
            aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="collapse-icon-box w-7 h-7 rounded-lg bg-white/10 group-hover:bg-white/20 border border-white/15 flex items-center justify-center shrink-0 text-white transition-all duration-200 shadow-sm">
                {collapsed ? (
                  <PanelLeftOpen size={16} className="collapse-icon-open text-white" />
                ) : (
                  <PanelLeftClose size={16} className="collapse-icon-close text-white" />
                )}
              </div>
              {!collapsed && (
                <span className="sb-hide truncate text-[13px] font-medium tracking-wide">
                  Thu gọn menu
                </span>
              )}
            </div>

            {!collapsed && (
              <div className="sb-hide flex items-center gap-1 shrink-0">
                <kbd className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-blue-200/90 group-hover:text-white group-hover:bg-white/20 transition-colors">
                  Ctrl B
                </kbd>
              </div>
            )}
          </button>

          {!collapsed && (
            <div className="sb-hide flex items-center justify-between px-3 pt-2 text-[10.5px] text-blue-200/50">
              <span>v2.4.1</span>
              <span>TLU © 2026</span>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

export default LecturerSidebar
