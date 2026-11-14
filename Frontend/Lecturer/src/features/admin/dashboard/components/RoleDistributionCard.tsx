import React from 'react'
import { Link } from 'react-router-dom'
import { PieChart, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card'
import type { SystemOverviewStats } from '../types/overview.types'

interface RoleDistributionCardProps {
  stats: SystemOverviewStats
}

export const RoleDistributionCard: React.FC<RoleDistributionCardProps> = ({
  stats,
}) => {
  return (
    <Card className="border-slate-200/90 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <PieChart className="h-4 w-4 text-blue-600" />
          <CardTitle className="text-base font-bold text-slate-900">
            Phân bổ người dùng theo vai trò
          </CardTitle>
        </div>
        <Link
          to="/admin/accounts"
          className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
        >
          <span>Quản lý</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Sinh viên */}
        <div>
          <div className="flex items-center justify-between text-xs font-medium mb-1.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              <span className="font-semibold text-slate-800">Sinh viên</span>
            </div>
            <span className="text-slate-500">
              <b className="text-slate-900">{stats.studentCount}</b> tài khoản (
              {stats.studentPct}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${stats.studentPct}%` }}
            />
          </div>
        </div>

        {/* Giảng viên */}
        <div>
          <div className="flex items-center justify-between text-xs font-medium mb-1.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
              <span className="font-semibold text-slate-800">Giảng viên</span>
            </div>
            <span className="text-slate-500">
              <b className="text-slate-900">{stats.lecturerCount}</b> tài khoản (
              {stats.lecturerPct}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-500"
              style={{ width: `${stats.lecturerPct}%` }}
            />
          </div>
        </div>

        {/* Quản trị viên */}
        <div>
          <div className="flex items-center justify-between text-xs font-medium mb-1.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-600" />
              <span className="font-semibold text-slate-800">Quản trị viên</span>
            </div>
            <span className="text-slate-500">
              <b className="text-slate-900">{stats.adminCount}</b> tài khoản (
              {stats.adminPct}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-purple-600 transition-all duration-500"
              style={{ width: `${stats.adminPct}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
