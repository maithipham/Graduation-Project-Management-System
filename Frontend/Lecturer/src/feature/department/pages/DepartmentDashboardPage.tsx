import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  FileCheck2,
  CalendarCheck2,
  BellRing,
  UserCheck2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { departmentService, type DepartmentStats } from '@/feature/department/services'

export const DepartmentDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DepartmentStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    departmentService.getOverviewStats().then((data) => {
      setStats(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Bảng Điều Khiển Trưởng Bộ Môn & Khoa
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Bộ môn Công nghệ phần mềm — Học kỳ Thu 2026 (Năm học 2026-2027)
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/department/users-import"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-700 shadow-sm transition"
          >
            Import dữ liệu mới
          </Link>
          <Link
            to="/department/councils"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition"
          >
            Lập hội đồng
          </Link>
        </div>
      </div>

      {/* Grid thống kê chính */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Sinh viên đủ điều kiện</span>
            <Users className="h-5 w-5 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '...' : `${stats?.assignedStudents} / ${stats?.totalStudents}`}
          </div>
          <p className="text-xs text-amber-600 mt-1 font-medium">
            Còn {stats?.unassignedStudents} SV chưa có GVHD
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Đề cương đã duyệt</span>
            <FileCheck2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '...' : `${stats?.approvedOutlines} / ${stats?.totalStudents}`}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {stats?.pendingOutlines} đề cương đang chờ thẩm định
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Hội đồng bảo vệ</span>
            <CalendarCheck2 className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '...' : `${stats?.formedCouncils} hội đồng`}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Đúng quy chuẩn 5 thành viên
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Giảng viên hướng dẫn</span>
            <UserCheck2 className="h-5 w-5 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '...' : `${stats?.totalSupervisors} cán bộ`}
          </div>
          <p className="text-xs text-teal-600 mt-1 font-medium">
            Đạt 85% chỉ tiêu đăng ký
          </p>
        </div>
      </div>

      {/* Nhiệm vụ cần xử lý ngay */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-sky-600" />
              Nhiệm vụ nghiệp vụ cần xử lý (Theo quy định)
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-start justify-between p-3.5 rounded-xl border border-amber-200 bg-amber-50/50">
              <div>
                <p className="font-semibold text-xs text-amber-900">
                  BF-02: Phân công GVHD cho SV quá hạn đăng ký
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  7 sinh viên chưa có GVHD duyệt hoặc bị từ chối sau thời hạn đăng ký nguyện vọng.
                </p>
              </div>
              <Link
                to="/department/assignments"
                className="shrink-0 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition"
              >
                Xử lý ngay →
              </Link>
            </div>

            <div className="flex items-start justify-between p-3.5 rounded-xl border border-sky-200 bg-sky-50/50">
              <div>
                <p className="font-semibold text-xs text-sky-900">
                  BF-01: Rà soát danh sách sinh viên & GVHD đủ điều kiện
                </p>
                <p className="text-xs text-sky-700 mt-0.5">
                  Kiểm tra tính hợp lệ miền email .edu, chống trùng lặp tài khoản trước khi chốt đợt.
                </p>
              </div>
              <Link
                to="/department/users-import"
                className="shrink-0 text-xs font-semibold text-sky-800 bg-sky-100 hover:bg-sky-200 px-3 py-1.5 rounded-lg transition"
              >
                Xem danh sách →
              </Link>
            </div>

            <div className="flex items-start justify-between p-3.5 rounded-xl border border-purple-200 bg-purple-50/50">
              <div>
                <p className="font-semibold text-xs text-purple-900">
                  BF-06: Thành lập và phân công Hội đồng bảo vệ đồ án
                </p>
                <p className="text-xs text-purple-700 mt-0.5">
                  Thiết lập 5 thành viên (Chủ tịch, Thư ký, 3 Ủy viên) và phân phòng bảo vệ cho SV đủ điều kiện.
                </p>
              </div>
              <Link
                to="/department/councils"
                className="shrink-0 text-xs font-semibold text-purple-800 bg-purple-100 hover:bg-purple-200 px-3 py-1.5 rounded-lg transition"
              >
                Cấu hình →
              </Link>
            </div>
          </div>
        </div>

        {/* Nhắc nhở & cảnh báo tự động */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <BellRing className="h-4 w-4 text-amber-500" />
              Công cụ nhắc nhở hàng loạt (Bulk Email Notification)
            </h2>
            <Link to="/department/reminders" className="text-xs text-sky-600 hover:underline">
              Mở hòm thư nhắc →
            </Link>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Hệ thống tự động lọc ra các Giảng viên hướng dẫn hoặc Reviewer chưa hoàn tất phê duyệt sau khi đã qua hạn chót (Deadline):
          </p>

          <div className="space-y-2.5">
            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
              <div>
                <span className="font-medium text-slate-800">GV Review chưa duyệt đề cương SV</span>
                <p className="text-slate-500 mt-0.5">4 giảng viên quá hạn review phiên bản mới nhất</p>
              </div>
              <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 font-semibold">
                4 GV
              </span>
            </div>

            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
              <div>
                <span className="font-medium text-slate-800">GVHD chưa nộp phiếu nhận xét tiến độ</span>
                <p className="text-slate-500 mt-0.5">2 giảng viên chưa nộp bảng điểm tuần cuối</p>
              </div>
              <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 font-semibold">
                2 GV
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/department/reminders"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition"
            >
              Gửi email nhắc nhở tất cả các mục quá hạn <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DepartmentDashboardPage
