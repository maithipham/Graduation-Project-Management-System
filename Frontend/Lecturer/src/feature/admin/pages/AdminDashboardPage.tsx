import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users2,
  CalendarDays,
  ShieldCheck,
  Activity,
  UserPlus,
} from 'lucide-react'
import { systemService, type AuditLogItem } from '@/feature/admin/services'


export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState({
    totalAccounts: 0,
    totalSemesters: 0,
    activeLecturers: 0,
    activeHeads: 0,
    activeAdmins: 0,
  })
  const [logs, setLogs] = useState<AuditLogItem[]>([])

  useEffect(() => {
    systemService.getSystemMetrics().then(setMetrics)
    systemService.getAuditLogs().then(setLogs)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Bảng Điều Khiển Quản Trị Hệ Thống (Admin Portal)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản trị tài khoản, gán phân quyền (Admin, Trưởng bộ môn, Giảng viên) và thiết lập các học kỳ.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/accounts"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-purple-700 text-white hover:bg-purple-800 shadow-sm transition"
          >
            <UserPlus className="h-4 w-4" />
            Tạo tài khoản mới
          </Link>
          <Link
            to="/admin/semesters"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition"
          >
            <CalendarDays className="h-4 w-4" />
            Thiết lập học kỳ
          </Link>
        </div>
      </div>

      {/* Grid thống kê Admin */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Tổng tài khoản</span>
            <Users2 className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.totalAccounts}</div>
          <p className="text-xs text-slate-500 mt-1">Phân quyền đa vai trò</p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Giảng viên hoạt động</span>
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.activeLecturers}</div>
          <p className="text-xs text-emerald-600 mt-1 font-medium">Đang hướng dẫn & phản biện</p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Trưởng bộ môn</span>
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.activeHeads}</div>
          <p className="text-xs text-slate-500 mt-1">5 bộ môn trực thuộc khoa</p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Học kỳ đồ án</span>
            <CalendarDays className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.totalSemesters}</div>
          <p className="text-xs text-amber-600 mt-1 font-medium">Học kỳ Thu 2026 đang mở</p>
        </div>
      </div>

      {/* Nhật ký hoạt động & Phân quyền */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-semibold text-slate-900 text-sm">
              Quản trị người dùng & Phân cấp vai trò
            </h2>
            <Link to="/admin/accounts" className="text-xs text-purple-600 hover:underline">
              Quản lý chi tiết →
            </Link>
          </div>
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl border border-purple-100 bg-purple-50/40 flex items-center justify-between">
              <div>
                <span className="font-semibold text-purple-900">Ban Quản Trị (Admin)</span>
                <p className="text-purple-700 mt-0.5">Khởi tạo học kỳ, quản lý tài khoản & phân quyền</p>
              </div>
              <span className="font-bold text-purple-900">{metrics.activeAdmins} tài khoản</span>
            </div>

            <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/40 flex items-center justify-between">
              <div>
                <span className="font-semibold text-blue-900">Trưởng Bộ Môn (Department Head)</span>
                <p className="text-blue-700 mt-0.5">Phân công GVHD, phân công review, thành lập hội đồng</p>
              </div>
              <span className="font-bold text-blue-900">{metrics.activeHeads} tài khoản</span>
            </div>

            <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/40 flex items-center justify-between">
              <div>
                <span className="font-semibold text-emerald-900">Giảng Viên (Lecturer)</span>
                <p className="text-emerald-700 mt-0.5">Duyệt đề tài, thẩm định đề cương, chấm báo cáo & bảo vệ</p>
              </div>
              <span className="font-bold text-emerald-900">{metrics.activeLecturers} tài khoản</span>
            </div>
          </div>
        </div>

        {/* Audit Log */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-semibold text-slate-900 text-sm">
              Nhật ký bảo mật & Hoạt động gần đây
            </h2>
          </div>
          <div className="space-y-2.5">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-medium text-slate-800">{log.action}</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Thực hiện bởi: {log.actor} · {log.timestamp}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage
