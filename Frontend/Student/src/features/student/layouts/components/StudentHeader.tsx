import React, { Fragment, useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu,
  PanelLeft,
  ChevronRight,
  ChevronDown,
  User,
  LogOut,
} from 'lucide-react'
import { roleLabels, useLogout, useMyInfo } from '@/features/auth'
import { NotificationBell } from '@/features/notification'
import { getInitials, getNavBreadcrumbs, type BreadcrumbNavItem } from '@/shared/utils'
import { studentNavItems } from './studentNav.config'

interface StudentHeaderProps {
  onToggleSidebar?: () => void
  onMobileToggle?: () => void
}

// Đổi cấu hình menu sang dạng breadcrumb dùng. '/student' là trang gốc nên chỉ khớp đúng URL.
const breadcrumbItems: BreadcrumbNavItem[] = studentNavItems.map((item) => ({
  to: item.path,
  label: item.title,
  end: item.path === '/student',
}))

export const StudentHeader: React.FC<StudentHeaderProps> = ({
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
  const crumbs = getNavBreadcrumbs(breadcrumbItems, location.pathname)
  // GET /my-info chỉ trả { name, roles } → chưa hiện được MSSV / email
  const displayName = user?.name ?? ''
  const displayTitle = roleLabels.STUDENT

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] select-none">
      {/* ========================================================
          1. BÊN TRÁI: TOGGLE SIDEBAR & BREADCRUMB
          ======================================================== */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Nút Hamburger cho màn hình Mobile */}
        <button
          type="button"
          onClick={onMobileToggle}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Mở menu"
        >
          <Menu size={20} />
        </button>

        {/* Nút Toggle Sidebar Desktop */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden lg:flex p-2 text-slate-500 hover:text-[#1565C0] hover:bg-blue-50/80 rounded-lg transition-colors cursor-pointer"
          title="Thu gọn / Mở rộng Sidebar"
          aria-label="Thu gọn / Mở rộng Sidebar"
        >
          <PanelLeft size={19} />
        </button>

        {/* Breadcrumb Navigation */}
        <nav
          className="flex items-center text-xs sm:text-sm font-medium overflow-hidden ml-1"
          aria-label="Breadcrumb"
        >
          <Link
            to="/student"
            className="text-slate-400 hover:text-slate-700 transition-colors whitespace-nowrap truncate max-w-[100px] sm:max-w-none"
          >
            Sinh viên
          </Link>

          {crumbs.map((label, index) => (
            <Fragment key={label}>
              <ChevronRight size={14} className="mx-1.5 text-slate-300 shrink-0" />
              <span
                className={
                  index === crumbs.length - 1
                    ? 'text-[#1565C0] font-semibold truncate max-w-[140px] sm:max-w-[260px]'
                    : 'text-slate-400 whitespace-nowrap truncate max-w-[100px] sm:max-w-none'
                }
              >
                {label}
              </span>
            </Fragment>
          ))}
        </nav>
      </div>

      {/* ========================================================
          2. BÊN PHẢI: THÔNG BÁO & USER PROFILE
          ======================================================== */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Chuông thông báo: số chưa đọc, danh sách, nhận thông báo mới qua SSE */}
        <NotificationBell />

        {/* Đường phân cách */}
        <div className="h-6 w-px bg-slate-200 mx-0.5" />

        {/* User Profile Pill & Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 transition-colors text-left cursor-pointer group"
            aria-expanded={profileOpen}
            aria-haspopup="true"
          >
            {/* Avatar chữ cái đại diện */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1565C0] to-[#1E88E5] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              {getInitials(displayName)}
            </div>

            {/* Thông tin tên & vai trò (ẩn trên màn hình quá nhỏ) */}
            <div className="hidden sm:flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">
                {displayName}
              </span>
              <span className="text-[10.5px] text-slate-500 font-medium leading-tight truncate max-w-[130px]">
                {displayTitle}
              </span>
            </div>

            <ChevronDown
              size={14}
              className={`text-slate-400 group-hover:text-slate-600 transition-transform duration-200 shrink-0 ${
                profileOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu Profile */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Header của Profile Dropdown */}
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 bg-blue-50 text-[#1565C0] text-[10.5px] font-semibold px-2 py-0.5 rounded-md border border-blue-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1565C0]" />
                  Sinh viên làm đồ án
                </div>
              </div>

              {/* Danh sách hành động */}
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false)
                    navigate('/student')
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <User size={15} className="text-slate-400" />
                  Hồ sơ sinh viên
                </button>
              </div>

              {/* Nút Đăng xuất */}
              <div className="pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogOut size={15} className="text-red-500" />
                  {logout.isPending ? 'Đang đăng xuất...' : 'Đăng xuất'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default StudentHeader
