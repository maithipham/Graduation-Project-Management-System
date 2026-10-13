import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu,
  PanelLeft,
  ChevronRight,
  Bell,
  Clock,
  Shield,
  AlertTriangle,
  CheckCheck,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '@/features/auth/store/authStore'

interface AdminHeaderProps {
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

const mockAdminNotifications: NotificationItem[] = [
  {
    id: '1',
    title: 'Cập nhật hệ thống định kỳ',
    description: 'Hệ thống sẽ bảo trì vào 23:00 Chủ Nhật tuần này.',
    time: '15 phút trước',
    type: 'warning',
    unread: true,
  },
  {
    id: '2',
    title: 'Tài khoản cán bộ mới tạo',
    description: 'Đã thêm 3 tài khoản giảng viên mới vào khoa CNTT.',
    time: '2 giờ trước',
    type: 'info',
    unread: true,
  },
  {
    id: '3',
    title: 'Cảnh báo đồng bộ dữ liệu',
    description: 'Tiến trình đồng bộ điểm có 1 bản ghi xung đột.',
    time: 'Hôm qua',
    type: 'danger',
    unread: false,
  },
]

export const AdminHeader: React.FC<AdminHeaderProps> = ({
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
  const [notifications, setNotifications] = useState(mockAdminNotifications)

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
    if (path.includes('/feature-1')) return 'Feature 1'
    if (path.includes('/feature-2/sub-1')) return 'Feature 2.1'
    if (path.includes('/feature-2/sub-2')) return 'Feature 2.2'
    if (path.includes('/feature-2')) return 'Feature 2'
    if (path.includes('/feature-3')) return 'Feature 3'
    if (path.includes('/feature-4')) return 'Feature 4'
    return 'Dashboard'
  }

  const currentTitle = getBreadcrumbTitle(location.pathname)
  const displayName = user?.name || 'Quản trị viên Hệ thống'
  const displayTitle = 'Quản trị viên Hệ thống'
  const displayEmail = user?.email || 'admin@tlu.edu.vn'

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
            to="/admin"
            className="text-slate-400 hover:text-slate-700 transition-colors whitespace-nowrap truncate max-w-[100px] sm:max-w-none"
          >
            Admin
          </Link>

          <ChevronRight size={14} className="mx-1.5 text-slate-300 shrink-0" />

          <span className="text-[#1565C0] font-semibold truncate max-w-[140px] sm:max-w-[260px]">
            {currentTitle}
          </span>
        </nav>
      </div>

      {/* ========================================================
          2. BÊN PHẢI: THÔNG BÁO & USER PROFILE
          ======================================================== */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Chuông Thông Báo (Notifications Dropdown) */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Thông báo"
            title="Thông báo"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Box Thông Báo */}
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-800">Thông báo</span>
                  {unreadCount > 0 && (
                    <span className="bg-blue-50 text-[#1565C0] text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                      {unreadCount} mới
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck size={14} /> Đã đọc tất cả
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 hover:bg-slate-50 transition-colors flex gap-3 ${
                      item.unread ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {item.type === 'warning' ? (
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                          <AlertTriangle size={16} />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1565C0] flex items-center justify-center">
                          <Shield size={16} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 leading-snug">
                        {item.title}
                      </p>
                      <p className="text-[11.5px] text-slate-500 mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
                      <span className="flex items-center gap-1 text-[10.5px] text-slate-400 mt-1.5 font-normal">
                        <Clock size={11} /> {item.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-4 pt-2 border-t border-slate-100 text-center">
                <button
                  type="button"
                  className="text-xs text-[#1565C0] font-medium hover:underline cursor-pointer"
                >
                  Xem toàn bộ thông báo hệ thống
                </button>
              </div>
            </div>
          )}
        </div>

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
              AD
            </div>

            {/* Thông tin tên & Chức danh (ẩn trên màn hình quá nhỏ) */}
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
                <p className="text-xs font-bold text-slate-900 truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {displayEmail}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 bg-blue-50 text-[#1565C0] text-[10.5px] font-semibold px-2 py-0.5 rounded-md border border-blue-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1565C0]" />
                  Quản trị viên
                </div>
              </div>

              {/* Danh sách hành động */}
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false)
                    navigate('/admin')
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <User size={15} className="text-slate-400" />
                  Hồ sơ cá nhân
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false)
                    navigate('/admin/feature-4')
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Settings size={15} className="text-slate-400" />
                  Cấu hình hệ thống
                </button>
              </div>

              {/* Nút Đăng xuất */}
              <div className="pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut size={15} className="text-red-500" />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default AdminHeader
