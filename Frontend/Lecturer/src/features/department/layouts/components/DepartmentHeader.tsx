import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu,
  PanelLeft,
  ChevronRight,
  Bell,
  Clock,
  FileText,
  AlertTriangle,
  CheckCheck,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '@/features/auth/store/authStore'

interface DepartmentHeaderProps {
  onToggleSidebar?: () => void
  onMobileToggle?: () => void
}

interface NotificationItem {
  id: string
  title: string
  description: string
  time: string
  type: 'warning' | 'info' | 'danger'
  unread: boolean
}

const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    title: 'Sắp đến hạn nộp đề cương đồ án',
    description: 'Hạn chót ngày 15/10/2025 cho sinh viên K62.',
    time: '10 phút trước',
    type: 'warning',
    unread: true,
  },
  {
    id: '2',
    title: '5 đề tài mới chờ duyệt',
    description: 'Giảng viên bộ môn CNPM đã gửi danh sách đề tài mới.',
    time: '1 giờ trước',
    type: 'info',
    unread: true,
  },
  {
    id: '3',
    title: 'Yêu cầu đổi giảng viên hướng dẫn',
    description: 'Sinh viên Nguyễn Văn A (K62) gửi đơn kiến nghị.',
    time: 'Hôm qua',
    type: 'danger',
    unread: false,
  },
]

export const DepartmentHeader: React.FC<DepartmentHeaderProps> = ({
  onToggleSidebar,
  onMobileToggle,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  // Dropdown states
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState(mockNotifications)

  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  const unreadCount = notifications.filter((n) => n.unread).length

  // Xác định tiêu đề Breadcrumb theo pathname
  const getBreadcrumbTitle = (path: string) => {
    if (path.includes('/students')) return 'Quản lý sinh viên'
    if (path.includes('/lecturers')) return 'Giảng viên'
    if (path.includes('/supervisors')) return 'Hướng dẫn'
    if (path.includes('/reviewers')) return 'Nhận xét'
    if (path.includes('/teachers')) return 'Quản lý giáo viên'
    if (path.includes('/councils')) return 'Hội đồng bảo vệ'
    if (path.includes('/schedule')) return 'Kế hoạch & Tiến độ'
    if (path.includes('/grading-config')) return 'Cấu hình điểm'
    if (path.includes('/documents')) return 'Tài liệu & Biểu mẫu'
    return 'Dashboard'
  }

  const currentTitle = getBreadcrumbTitle(location.pathname)
  const displayName = user?.name || 'TS. Phạm Hoàng'
  const displayTitle = 'Trưởng Bộ Môn CNPM'
  const displayEmail = user?.email || 'phamhoang@tlu.edu.vn'

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
          <ChevronRight size={13} className="text-slate-400 shrink-0" />
          <span className="text-[#1E293B] font-semibold">{currentTitle}</span>
        </nav>
      </div>

      {/* ========================================================
          B. CỤM TIỆN ÍCH BÊN PHẢI
          ======================================================== */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* 1. Thông báo (Notification Bell) */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen(!notifOpen)
              setProfileOpen(false)
            }}
            className="relative p-2 rounded-xl text-[#596D83] hover:text-[#1E293B] hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0288D1]/40"
            aria-label={`Thông báo (${unreadCount} chưa đọc)`}
            aria-expanded={notifOpen}
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown thông báo */}
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200/90 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1E293B]">Thông báo</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[10.5px] font-semibold">
                      {unreadCount} mới
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-[11.5px] text-[#0288D1] hover:text-[#01579B] font-medium flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <CheckCheck size={14} /> Đánh dấu đã đọc
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {notifications.map((item) => {
                  let iconBg = 'bg-amber-100 text-amber-600'
                  let Icon = Clock
                  if (item.type === 'info') {
                    iconBg = 'bg-sky-100 text-[#0288D1]'
                    Icon = FileText
                  } else if (item.type === 'danger') {
                    iconBg = 'bg-rose-100 text-rose-600'
                    Icon = AlertTriangle
                  }

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 flex gap-3 items-start transition-colors hover:bg-slate-50 cursor-pointer ${
                        item.unread ? 'bg-sky-50/30' : ''
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#1E293B] leading-snug">
                          {item.title}
                        </p>
                        <p className="text-[11.5px] text-[#596D83] mt-0.5 leading-snug line-clamp-2">
                          {item.description}
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium block mt-1">
                          {item.time}
                        </span>
                      </div>
                      {item.unread && (
                        <span className="w-2 h-2 rounded-full bg-[#0288D1] shrink-0 mt-1.5" />
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="p-2 border-t border-slate-100 bg-slate-50/50 text-center">
                <button
                  type="button"
                  onClick={() => setNotifOpen(false)}
                  className="text-xs text-[#0288D1] hover:text-[#01579B] font-semibold transition-colors py-1 cursor-pointer"
                >
                  Xem tất cả thông báo
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* 2. Menu Tài khoản Người dùng (User Profile Menu) */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setProfileOpen(!profileOpen)
              setNotifOpen(false)
            }}
            className="group flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer select-none text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0288D1]/40"
            aria-expanded={profileOpen}
            aria-haspopup="true"
          >
            {/* Avatar tròn gradient rực rỡ */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-blue-700 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 ring-2 ring-sky-100 group-hover:ring-[#0288D1]/30 transition-all">
              PH
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
                    PH
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1E293B] truncate leading-tight">
                      {displayName}
                    </p>
                    <p className="text-[11px] text-[#596D83] truncate leading-tight mt-0.5">
                      {displayEmail}
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
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-semibold transition-colors cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>Đăng xuất</span>
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
