import React from 'react'
import { Link } from 'react-router-dom'
import { Users, UserCheck, Calendar, School, ArrowRight } from 'lucide-react'
import { Card } from '@/shared/components/ui/card'
import type { SystemOverviewStats } from '../types/overview.types'

interface StatCardGridProps {
  stats: SystemOverviewStats
}

export const StatCardGrid: React.FC<StatCardGridProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Card 1: Tổng số tài khoản */}
      <Card className="p-5 border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tổng số tài khoản
            </span>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">
            {stats.totalAccounts}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700">
            {stats.activeRate}%
          </span>
          <span className="text-slate-500 ml-1.5 mr-auto">đang hoạt động</span>
          <Link
            to="/admin/accounts"
            className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1"
          >
            <span>Xem DS</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </Card>

      {/* Card 2: Tài khoản hoạt động */}
      <Card className="p-5 border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tài khoản hoạt động
            </span>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-700">
            {stats.activeAccounts}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{stats.inactiveAccounts} tài khoản tạm dừng / khóa</span>
          <Link
            to="/admin/accounts"
            className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1"
          >
            <span>Chi tiết</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </Card>

      {/* Card 3: Học kỳ hiện tại */}
      <Card className="p-5 border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Học kỳ hiện tại
            </span>
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 truncate">
            {stats.currentSemesterName}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="truncate mr-2">{stats.currentSemesterPeriod}</span>
          <Link
            to="/admin/semesters"
            className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1 shrink-0"
          >
            <span>Quản lý</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </Card>

      {/* Card 4: Khoa & Ngành đào tạo */}
      <Card className="p-5 border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Khoa & Ngành đào tạo
            </span>
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <School className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">
            {stats.totalFaculties}{' '}
            <span className="text-base font-semibold text-slate-500">Khoa</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{stats.totalMajors} Chuyên ngành</span>
          <Link
            to="/admin/faculties"
            className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1"
          >
            <span>Xem Khoa</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </Card>
    </div>
  )
}
