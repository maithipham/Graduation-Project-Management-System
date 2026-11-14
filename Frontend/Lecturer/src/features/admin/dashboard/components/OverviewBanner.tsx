import React from 'react'
import { UserPlus, Building } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

interface OverviewBannerProps {
  onQuickAddAccount: () => void
  onQuickAddFaculty: () => void
}

export const OverviewBanner: React.FC<OverviewBannerProps> = ({
  onQuickAddAccount,
  onQuickAddFaculty,
}) => {
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

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            type="button"
            onClick={onQuickAddAccount}
            className="h-10 bg-white text-blue-700 hover:bg-blue-50 font-semibold text-xs gap-1.5 shadow-sm border border-transparent"
          >
            <UserPlus className="h-4 w-4 text-blue-700" />
            <span>Thêm tài khoản</span>
          </Button>

          <Button
            type="button"
            onClick={onQuickAddFaculty}
            variant="outline"
            className="h-10 bg-white/10 hover:bg-white/20 text-white border-white/25 font-semibold text-xs gap-1.5 backdrop-blur-xs"
          >
            <Building className="h-4 w-4" />
            <span>Thêm khoa</span>
          </Button>
        </div>
      </div>

      {/* Decorative background shapes */}
      <div className="absolute right-0 top-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute left-1/2 bottom-0 -mb-12 h-48 w-48 rounded-full bg-blue-500/20 blur-xl pointer-events-none" />
    </div>
  )
}
