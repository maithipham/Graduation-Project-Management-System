import React from 'react'
import { Link } from 'react-router-dom'
import { UserPlus, Building } from 'lucide-react'

export const OverviewBanner: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-md">
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold text-blue-100 mb-3 border border-white/20">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Bảng điều khiển Trung tâm Quản trị
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Tổng quan Hệ thống GPMS
          </h1>
          <p className="mt-2 text-sm text-blue-100/90 leading-relaxed">
            Chào mừng Quản trị viên. Theo dõi tổng thể tài khoản người dùng, tiến trình học kỳ và các khoa đào tạo toàn trường.
          </p>
        </div>

        {/* Lối tắt tới trang quản lý */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            to="/admin/accounts-lecturer"
            className="h-10 px-4 inline-flex items-center gap-1.5 rounded-lg bg-white text-blue-700 hover:bg-blue-50 font-semibold text-xs shadow-sm transition"
          >
            <UserPlus className="h-4 w-4 text-blue-700" />
            <span>Quản lý tài khoản</span>
          </Link>
          <Link
            to="/admin/faculties"
            className="h-10 px-4 inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/25 font-semibold text-xs backdrop-blur-xs transition"
          >
            <Building className="h-4 w-4" />
            <span>Quản lý khoa</span>
          </Link>
        </div>
      </div>

      {/* Decorative background shapes */}
      <div className="absolute right-0 top-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute left-1/2 bottom-0 -mb-12 h-48 w-48 rounded-full bg-blue-500/20 blur-xl pointer-events-none" />
    </div>
  )
}
