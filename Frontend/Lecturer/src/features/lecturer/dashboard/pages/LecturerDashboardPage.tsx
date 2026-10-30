import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  Clock,
  FileText,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react'
import { toast } from '@/shared/components/feedback/toast.store'
import { useLecturerPortalStore } from '@/features/lecturer/lecturer_portal_storage'

export default function LecturerDashboardPage() {
  const teacher = useLecturerPortalStore((s) => s.teacher)
  const academicYear = useLecturerPortalStore((s) => s.academicYear)
  const semester = useLecturerPortalStore((s) => s.semester)
  const supervisorRequests = useLecturerPortalStore((s) => s.supervisorRequests)
  const topicProposals = useLecturerPortalStore((s) => s.topicProposals)
  const outlines = useLecturerPortalStore((s) => s.outlines)
  const reports = useLecturerPortalStore((s) => s.reports)
  const approveSupervisorRequest = useLecturerPortalStore((s) => s.approveSupervisorRequest)
  const rejectSupervisorRequest = useLecturerPortalStore((s) => s.rejectSupervisorRequest)

  const pendingSupervisorCount = supervisorRequests.filter((r) => r.status === 'pending').length
  const pendingTopicCount = topicProposals.filter((p) => p.status === 'pending').length
  const pendingOutlineCount = outlines.filter((o) => o.status === 'pending').length
  const pendingReportCount = reports.filter((r) => r.status === 'pending').length
  const totalNewApprovals = pendingSupervisorCount + pendingTopicCount

  const loadPercent = Math.min(100, Math.round((teacher.currentLoad / Math.max(1, teacher.quota)) * 100))
  const remainingQuota = Math.max(0, teacher.quota - teacher.currentLoad)
  const latestPendingRequests = supervisorRequests.filter((r) => r.status === 'pending').slice(0, 4)
  const semesterLabel = semester === 'HK1' ? 'Học kỳ 1' : 'Học kỳ 2'

  const handleQuickApprove = (id: string, studentName: string) => {
    approveSupervisorRequest(id)
    toast.success(`Đã duyệt đơn đăng ký của sinh viên ${studentName} thành công!`)
  }

  const handleQuickReject = (id: string, studentName: string) => {
    rejectSupervisorRequest(id, 'Từ chối nhanh')
    toast.info(`Đã từ chối đơn của sinh viên ${studentName}.`)
  }

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-[#0D47A1] to-[#1565C0] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md mb-3 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>
              Bảng điều khiển Giảng viên · {semesterLabel} · Năm học {academicYear}
            </span>
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight">Xin chào, {teacher.name}!</h1>
          <p className="text-white/80 text-[13.5px] mt-1.5 leading-relaxed">
            Hệ thống quản lý đồ án tốt nghiệp — Bạn có{' '}
            <b className="text-white font-bold underline">
              {totalNewApprovals} đơn đăng ký &amp; phê duyệt
            </b>{' '}
            mới cần xử lý trong tuần này.
          </p>
        </div>
        <div className="absolute right-6 -bottom-6 opacity-10 pointer-events-none">
          <GraduationCap className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tải hướng dẫn */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Sinh viên đang hướng dẫn
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-extrabold text-slate-900">
              {teacher.currentLoad}{' '}
              <span className="text-sm font-semibold text-slate-400">/ {teacher.quota} SV</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mt-3">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${loadPercent}%` }}
              />
            </div>
            <div className="text-[11.5px] text-slate-500 mt-2 flex items-center justify-between">
              <span>Đã nhận {loadPercent}% chỉ tiêu</span>
              <span className="font-bold text-blue-600">Còn {remainingQuota} chỉ tiêu</span>
            </div>
          </div>
        </div>

        {/* Card 2: Đơn đăng ký GVHD */}
        <Link
          to="/lecturer/supervisor-requests"
          className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-blue-400 hover:shadow-sm transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Đăng ký GVHD
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
              <UserPlus className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-extrabold text-slate-900">
              {pendingSupervisorCount}{' '}
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 ml-1">
                Chờ duyệt
              </span>
            </div>
            <p className="text-[12px] text-slate-500 mt-3 flex items-center gap-1 group-hover:text-blue-600 transition">
              <span>Vào duyệt ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </p>
          </div>
        </Link>

        {/* Card 3: Đơn duyệt đề tài */}
        <Link
          to="/lecturer/topic-proposals"
          className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-blue-400 hover:shadow-sm transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Duyệt tên đề tài
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-extrabold text-slate-900">
              {pendingTopicCount}{' '}
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 ml-1">
                Cần duyệt
              </span>
            </div>
            <p className="text-[12px] text-slate-500 mt-3 flex items-center gap-1 group-hover:text-blue-600 transition">
              <span>Xem danh sách đề tài</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </p>
          </div>
        </Link>

        {/* Card 4: Kiểm tra báo cáo & Đạo văn */}
        <Link
          to="/lecturer/report-check"
          className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-blue-400 hover:shadow-sm transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Báo cáo &amp; Đạo văn
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-extrabold text-slate-900">
              {pendingReportCount}{' '}
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 ml-1">
                Cần kiểm tra
              </span>
            </div>
            <p className="text-[12px] text-slate-500 mt-3 flex items-center gap-1 group-hover:text-blue-600 transition">
              <span>Nộp kết quả kiểm tra</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </p>
          </div>
        </Link>
      </div>

      {/* Quick Access Shortcuts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột 1 & 2: Danh sách đơn chờ duyệt gần nhất */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-[15px] text-slate-900">Đơn chờ xử lý mới nhất</h3>
            </div>
            <Link
              to="/lecturer/supervisor-requests"
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Xem tất cả ›
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {latestPendingRequests.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                Hiện tại không có đơn nào đang chờ xử lý.
              </div>
            ) : (
              latestPendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-[13.5px] text-slate-900">
                      {req.name}{' '}
                      <span className="font-mono text-slate-400 font-normal text-xs">
                        ({req.mssv})
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 truncate mt-0.5">{req.topic}</div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Gửi ngày: {req.submittedDate} · Ngành: {req.major}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleQuickApprove(req.id, req.name)}
                      className="btn-approve h-8 px-3.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white text-[12px] font-bold transition flex items-center cursor-pointer shadow-xs"
                    >
                      Duyệt
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickReject(req.id, req.name)}
                      className="btn-reject h-8 px-3 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 text-[12px] font-bold transition flex items-center cursor-pointer shadow-2xs"
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cột 3: Kế hoạch & Mốc thời gian */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-[15px] text-slate-900">Kế hoạch học kỳ</h3>
          </div>
          <div className="space-y-3.5 text-[12.5px]">
            <Link
              to="/lecturer/outline-review"
              className="block p-3 bg-blue-50/60 border border-blue-200 rounded-xl hover:border-blue-400 transition"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-bold text-blue-900">Hạn chót duyệt đề cương</div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                  Đề cương chờ duyệt: {pendingOutlineCount}
                </span>
              </div>
              <div className="text-slate-600 mt-0.5">05/11/2026 — Hạn review 23:59</div>
            </Link>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="font-bold text-slate-800">Báo cáo tiến độ đợt 1</div>
              <div className="text-slate-500 mt-0.5">01/11/2026 đến 05/11/2026</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="font-bold text-slate-800">Kiểm tra trùng lặp &amp; Nghiệm thu</div>
              <div className="text-slate-500 mt-0.5">15/12/2026 đến 20/12/2026</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
