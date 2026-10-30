import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  PanelLeft,
  Settings,
  User,
} from 'lucide-react'
import { RoleSwitcher, useLogout, useMyInfo } from '@/features/auth'
import { NotificationBell } from '@/features/notification'
import { useLecturerPortalStore } from '@/features/lecturer/lecturer_portal_storage'
import { getNavBreadcrumbs } from '@/shared/utils'
import { lecturerNavItems } from './lecturerNav.config'

interface LecturerHeaderProps {
  onToggleSidebar?: () => void
  onMobileToggle?: () => void
}

function getHeaderBreadcrumbTitle(pathname: string): string {
  if (pathname === '/lecturer' || pathname === '/lecturer/') return 'Tổng quan'
  if (pathname.includes('/supervisor-requests')) return 'Giao đề tài › Đăng ký GVHD'
  if (pathname.includes('/topic-proposals')) return 'Giao đề tài › Duyệt tên đề tài'
  if (pathname.includes('/outline-review')) return 'Giao đề tài › Duyệt đề cương'
  if (pathname.includes('/report-check')) return 'Làm đồ án › Kiểm tra báo cáo'
  if (pathname.includes('/progress-tracking')) return 'Làm đồ án › Phiếu theo dõi tiến trình'
  if (pathname.includes('/guiding-scores')) return 'Làm đồ án › Chấm điểm hướng dẫn'
  if (pathname.includes('/defense/councils')) return 'Bảo vệ đồ án › Hội đồng chấm bảo vệ'
  if (pathname.includes('/defense/reviews')) return 'Bảo vệ đồ án › Đánh giá phản biện'
  if (pathname.includes('/defense')) return 'Bảo vệ đồ án'
  if (pathname.includes('/templates')) return 'Tài liệu mẫu'
  const crumbs = getNavBreadcrumbs(lecturerNavItems, pathname)
  return crumbs.join(' › ') || 'Tổng quan'
}

export const LecturerHeader: React.FC<LecturerHeaderProps> = ({
  onToggleSidebar,
  onMobileToggle,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: user } = useMyInfo()
  const logout = useLogout()

  const academicYear = useLecturerPortalStore((s) => s.academicYear)
  const semester = useLecturerPortalStore((s) => s.semester)
  const teacher = useLecturerPortalStore((s) => s.teacher)
  const setAcademicFilter = useLecturerPortalStore((s) => s.setAcademicFilter)

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

  const currentTitle = getHeaderBreadcrumbTitle(location.pathname)

  const isDefaultAccountName =
    !user?.name ||
    user.name.includes('@') ||
    user.name.startsWith('mai pthc') ||
    /^[a-z0-9_.-]+$/i.test(user.name)

  const displayName = isDefaultAccountName ? (teacher.name || 'TS. Trần Mai Anh') : user.name
  const displayTitle = 'Giảng viên hướng dẫn'
  const initials = displayName
    .replace(/^(PGS\.TS\.|TS\.|ThS\.|GS\.TS\.)\s*/, '')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase() || 'MA'

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] select-none shrink-0">
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
          className="hidden lg:flex w-9 h-9 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 items-center justify-center transition cursor-pointer"
          title="Thu gọn / Mở rộng Sidebar"
          aria-label="Thu gọn / Mở rộng Sidebar"
        >
          <PanelLeft size={18} />
        </button>

        {/* Breadcrumb Navigation chuẩn theo gv_ui */}
        <nav
          className="hidden md:flex items-center gap-2 text-[12.5px] text-slate-500 min-w-0 ml-1"
          aria-label="Breadcrumb"
        >
          <Link
            to="/lecturer"
            className="hover:text-[#1565C0] transition font-medium whitespace-nowrap"
          >
            Trang chủ
          </Link>

          {currentTitle !== 'Tổng quan' && (
            <>
              <ChevronRight size={14} className="text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-800 truncate" id="crumbCurrent">
                {currentTitle}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* ========================================================
          2. BÊN PHẢI: NĂM HỌC, HỌC KỲ, THÔNG BÁO & USER PROFILE
          ======================================================== */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Bộ chọn Năm học & Học kỳ đồng bộ toàn cổng Giảng viên (chuẩn gv_ui header) */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="relative inline-flex items-center">
            <select
              id="headerYearSelect"
              value={academicYear}
              onChange={(e) => setAcademicFilter(e.target.value, semester)}
              aria-label="Chọn năm học"
              className="header-filter-select h-9 pl-3 pr-8 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[12.5px] font-semibold text-slate-700 outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition appearance-none cursor-pointer"
            >
              <option value="2026-2027">2026-2027</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2024-2025">2024-2025</option>
            </select>
            <svg
              className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>

          <div className="relative inline-flex items-center">
            <select
              id="headerSemesterSelect"
              value={semester}
              onChange={(e) => setAcademicFilter(academicYear, e.target.value)}
              aria-label="Chọn học kỳ"
              className="header-filter-select h-9 pl-3 pr-8 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[12.5px] font-semibold text-slate-700 outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition appearance-none cursor-pointer"
            >
              <option value="HK1">Học kỳ 1</option>
              <option value="HK2">Học kỳ 2</option>
            </select>
            <svg
              className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>

        {/* Nút chuyển portal Trưởng bộ môn ⇄ Giảng viên (chỉ hiện với trưởng bộ môn) */}
        <RoleSwitcher />

        {/* Chuông thông báo */}
        <NotificationBell fallbackCount={3} />

        {/* User Profile Pill & Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 h-11 px-1.5 rounded-lg hover:bg-slate-100 transition-colors text-left cursor-pointer group"
            aria-expanded={profileOpen}
            aria-haspopup="true"
          >
            {/* Avatar chữ cái đại diện */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-blue-700 text-white flex items-center justify-center font-bold text-[12px] shadow shrink-0">
              {initials}
            </div>

            {/* Thông tin tên & Chức danh */}
            <div className="hidden sm:flex flex-col leading-tight min-w-0">
              <span className="text-[12.5px] font-semibold text-slate-800 leading-tight truncate max-w-[180px]">
                {displayName}
              </span>
              <span className="text-[10.5px] text-slate-500 font-normal leading-tight truncate max-w-[180px] mt-0.5">
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
            <div className="absolute right-0 mt-2 w-[260px] rounded-xl bg-white shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Header của Profile Dropdown */}
              <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-100 mb-1">
                <span className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-400 to-blue-700 flex items-center justify-center text-white font-bold text-[14px] shrink-0">
                  {initials}
                </span>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-bold text-slate-900 truncate">
                    {displayName}
                  </div>
                  <div className="text-[11.5px] text-slate-500 truncate">
                    Bộ môn Kỹ thuật phần mềm
                  </div>
                </div>
              </div>

              {/* Danh sách hành động */}
              <div className="py-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false)
                    navigate('/lecturer')
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <User size={16} className="text-slate-400 shrink-0" />
                  <span>Trang cá nhân</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false)
                    navigate('/lecturer')
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Settings size={16} className="text-slate-400 shrink-0" />
                  <span>Cài đặt</span>
                </button>
              </div>

              {/* Nút Đăng xuất */}
              <div className="pt-1 mt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogOut size={16} className="text-rose-500 shrink-0" />
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

export default LecturerHeader
