import React, { Fragment, useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu,
  PanelLeft,
  ChevronRight,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from 'lucide-react'
import { RoleSwitcher, roleLabels, useLogout, useMyInfo } from '@/features/auth'
import { NotificationBell } from '@/features/notification'
import { getInitials, getNavBreadcrumbs } from '@/shared/utils'
import { departmentNavItems } from './departmentNav.config'

interface DepartmentHeaderProps {
  onToggleSidebar?: () => void
  onMobileToggle?: () => void
}

export const DepartmentHeader: React.FC<DepartmentHeaderProps> = ({
  onToggleSidebar,
  onMobileToggle,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: user } = useMyInfo()
  const logout = useLogout()

  // Dropdown states
  const [profileOpen, setProfileOpen] = useState(false)

  const profileRef = useRef<HTMLDivElement>(null)

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Breadcrumb lấy từ cấu hình menu sidebar → thêm/đổi tên menu là breadcrumb tự cập nhật
  const crumbs = getNavBreadcrumbs(departmentNavItems, location.pathname)
  const displayName = user?.name ?? ''
  const displayTitle = roleLabels.HEAD_OF_DEPARTMENT

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* ========================================================
          A. CỤM ĐIỀU KHIỂN BÊN TRÁI
          ======================================================== */}
      <div className="flex items-center gap-3">
        {/* 1. Mobile Menu Button (lg:hidden) */}
        <button
          type="button"
          onClick={onMobileToggle}
          className="p-2 rounded-lg text-[#596D83] hover:text-[#1E293B] hover:bg-slate-100 transition-colors cursor-pointer lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0288D1]/40"
          aria-label="Mở menu điều hướng"
        >
          <Menu size={20} />
        </button>

        {/* 2. Desktop Sidebar Toggle Button (hidden lg:flex) */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="w-9 h-9 rounded-lg text-[#596D83] hover:text-[#1E293B] hover:bg-slate-100 transition-colors cursor-pointer hidden lg:flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0288D1]/40"
            title="Thu gọn / mở rộng menu (Ctrl+B)"
            aria-label="Thu gọn hoặc mở rộng thanh bên"
          >
            <PanelLeft size={18} />
          </button>
        )}

        {/* 3. Breadcrumb Navigation (hidden md:flex) */}
        <nav
          className="hidden md:flex items-center gap-2 text-xs font-medium pl-1 select-none"
          aria-label="Breadcrumb"
        >
          <Link
            to="/department"
            className="text-[#596D83] hover:text-[#1E293B] transition-colors"
          >
            Trang chủ
          </Link>
          {crumbs.map((label, index) => (
            <Fragment key={label}>
              <ChevronRight size={13} className="text-slate-400 shrink-0" />
              <span
                className={
                  index === crumbs.length - 1 ? 'text-[#1E293B] font-semibold' : 'text-[#596D83]'
                }
              >
                {label}
              </span>
            </Fragment>
          ))}
        </nav>
      </div>

      {/* ========================================================
          B. CỤM TIỆN ÍCH BÊN PHẢI
          ======================================================== */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Nút chuyển portal Trưởng bộ môn ⇄ Giảng viên (chỉ hiện với trưởng bộ môn) */}
        <RoleSwitcher />
        {/* Chuông thông báo: số chưa đọc, danh sách, nhận thông báo mới qua SSE */}
        <NotificationBell />

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* 2. Menu Tài khoản Người dùng (User Profile Menu) */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="group flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer select-none text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0288D1]/40"
            aria-expanded={profileOpen}
            aria-haspopup="true"
          >
            {/* Avatar tròn gradient rực rỡ */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-blue-700 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 ring-2 ring-sky-100 group-hover:ring-[#0288D1]/30 transition-all">
              {getInitials(displayName)}
            </div>

            {/* Nhãn tên & chức vụ */}
            <div className="hidden sm:block min-w-0 pr-0.5">
              <span className="text-[13px] font-bold text-[#1E293B] block leading-tight truncate">
                {displayName}
              </span>
              <span className="text-[10.5px] text-slate-500 font-medium block leading-tight truncate mt-0.5">
                {displayTitle}
              </span>
            </div>

            <ChevronDown
              size={14}
              className={`text-[#596D83] group-hover:text-[#1E293B] transition-transform duration-200 hidden sm:block ${
                profileOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu xổ xuống */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-slate-200/90 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
              {/* Header thông tin người dùng */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {getInitials(displayName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1E293B] truncate leading-tight">
                      {displayName}
                    </p>
                  </div>
                </div>
                <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-[#1565C0] rounded-md border border-blue-200/60">
                  {displayTitle}
                </span>
              </div>

              {/* Menu điều hướng */}
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false)
                    navigate('/department')
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#1E293B] hover:bg-slate-50 font-medium transition-colors cursor-pointer"
                >
                  <User size={15} className="text-[#596D83]" />
                  <span>Trang cá nhân</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false)
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#1E293B] hover:bg-slate-50 font-medium transition-colors cursor-pointer"
                >
                  <Settings size={15} className="text-[#596D83]" />
                  <span>Cài đặt</span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogOut size={15} />
                  <span>{logout.isPending ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default DepartmentHeader
