import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Menu,
  PanelLeft,
  ChevronDown,
  User,
  LogOut,
} from 'lucide-react'
import { useLogout, useMyInfo } from '@/features/auth'
import { NotificationBell } from '@/features/notification'
import { STUDENT_PROFILE_MOCK } from '@/shared/constants/studentProfile.mock'
import { getInitials, getNavBreadcrumbs, type BreadcrumbNavItem } from '@/shared/utils'
import { useStudentSemester, type SemesterCode } from '@/shared/contexts'
import { studentNavItems } from './studentNav.config'
import { StudentProgressStepper } from './StudentProgressStepper'

interface StudentHeaderProps {
  onToggleSidebar?: () => void
  onMobileToggle?: () => void
}

const breadcrumbItems: BreadcrumbNavItem[] = studentNavItems.map((item) => ({
  to: item.path,
  label: item.title,
  end: item.path === '/student',
}))

const HEADER_TITLE_MAP: Record<string, string> = {
  '/student': 'Đăng ký GVHD',
  '/student/registration': 'Đăng ký GVHD',
  '/student/lecturers': 'Danh sách GVHD',
  '/student/outline': 'Đề cương',
  '/student/reports': 'Báo cáo',
  '/student/schedule': 'Lịch bảo vệ',
  '/student/results': 'Điểm',
  '/student/documents': 'Tài liệu biểu mẫu',
  '/student/files': 'Tài liệu biểu mẫu',
  '/student/profile': 'Trang cá nhân',
}

function resolvePageTitle(pathname: string): string {
  const normalized = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname
  if (HEADER_TITLE_MAP[normalized]) {
    return HEADER_TITLE_MAP[normalized]
  }
  const crumbs = getNavBreadcrumbs(breadcrumbItems, normalized)
  if (crumbs.length > 0) {
    return crumbs[crumbs.length - 1]
  }
  return 'Cổng sinh viên'
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({
  onToggleSidebar,
  onMobileToggle,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: user } = useMyInfo()
  const logout = useLogout()

  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

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

  const { year, semester, years, semesters, setYear, setSemester } = useStudentSemester()
  const pageTitle = resolvePageTitle(location.pathname)
  const displayName = user?.name?.trim() || STUDENT_PROFILE_MOCK.name
  const initials = getInitials(displayName) || STUDENT_PROFILE_MOCK.avatar

  return (
    <div className="sticky top-0 z-30 shrink-0 bg-[#F1F5F9]">
      <header
        className="h-16 w-full bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-2xs select-none"
        style={{
          fontFamily:
            '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* ========================================================
            1. BÊN TRÁI: TOGGLE SIDEBAR, PAGE TITLE & BỘ LỌC NĂM HỌC / HỌC KỲ
            ======================================================== */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onMobileToggle}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Mở menu"
          >
            <Menu size={20} />
          </button>

          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden lg:flex p-2 text-slate-500 hover:text-[#1565C0] hover:bg-blue-50/80 rounded-lg transition-colors cursor-pointer"
            title="Thu gọn / Mở rộng Sidebar"
            aria-label="Thu gọn / Mở rộng Sidebar"
          >
            <PanelLeft size={19} />
          </button>

          {/* Tiêu đề góc trái thanh header (ví dụ "Đăng ký GVHD" - chuẩn text-[12.5px] gv_ui) */}
          <nav
            className="flex items-center text-[12.5px] font-medium shrink-0 ml-1"
            aria-label="Breadcrumb"
          >
            <span className="text-[#1565C0] font-semibold whitespace-nowrap text-[12.5px] leading-5">
              {pageTitle}
            </span>
          </nav>

          {/* Đường phân cách nhỏ */}
          <div className="h-4 w-px bg-slate-200 mx-0.5 sm:mx-1 hidden xs:block" />

          {/* Bộ lọc Năm học & Học kỳ ngay sau tiêu đề góc trái (chuẩn text-[12.5px] gv_ui) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Dropdown Năm học */}
            <div className="relative inline-flex items-center">
              <select
                aria-label="Chọn năm học"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="h-8.5 pl-2.5 sm:pl-3 pr-7 sm:pr-8 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[12.5px] font-semibold text-slate-700 outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition appearance-none cursor-pointer shadow-2xs"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                strokeWidth={2.3}
                className="text-slate-500 absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              />
            </div>

            {/* Dropdown Học kỳ */}
            <div className="relative inline-flex items-center">
              <select
                aria-label="Chọn học kỳ"
                value={semester}
                onChange={(e) => setSemester(e.target.value as SemesterCode)}
                className="h-8.5 pl-2.5 sm:pl-3 pr-7 sm:pr-8 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[12.5px] font-semibold text-slate-700 outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition appearance-none cursor-pointer shadow-2xs"
              >
                {semesters.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                strokeWidth={2.3}
                className="text-slate-500 absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* ========================================================
            2. BÊN PHẢI: THÔNG BÁO & USER PROFILE (chuẩn gv_ui text-[12.5px] / text-[10.5px])
            ======================================================== */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <NotificationBell />

          <div className="h-5 w-px bg-slate-200 mx-0.5" />

          {/* User Profile Pill & Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 h-11 px-1.5 rounded-lg hover:bg-slate-100 transition-colors text-left cursor-pointer group"
              aria-expanded={profileOpen}
              aria-haspopup="true"
            >
              <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-lg bg-[#1565C0] text-white flex items-center justify-center font-bold text-[12px] shadow-xs shrink-0">
                {initials}
              </div>

              <span className="hidden sm:inline text-[12.5px] font-semibold text-slate-800 leading-tight truncate max-w-[140px]">
                {displayName}
              </span>

              <ChevronDown
                size={14}
                className={`text-slate-400 group-hover:text-slate-600 transition-transform duration-200 shrink-0 ${
                  profileOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-[13.5px] font-bold text-slate-900 truncate">{displayName}</p>
                  <p className="text-[11.5px] text-slate-500 mt-0.5">
                    MSSV: {STUDENT_PROFILE_MOCK.mssv}
                  </p>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false)
                      navigate('/student/profile')
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <User size={15} className="text-slate-400" />
                    <span>Trang cá nhân</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <LogOut size={15} className="text-rose-500" />
                    <span>{logout.isPending ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Thanh tiến độ đồ án (chỉ để xem tiến độ theo lịch trình học kỳ, không cho bấm chuyển trang) */}
      <StudentProgressStepper />
    </div>
  )
}

export default StudentHeader
