import { Link } from 'react-router-dom'
import {
  ArrowRight,
  FileText,
  GraduationCap,
  Gavel,
  ShieldCheck,
  Sparkles,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import { useMyInfo } from '@/features/auth'
import { useLecturerCurrentSemester } from '@/features/lecturer/supervisor_registration'

interface QuickLink {
  to: string
  title: string
  description: string
  icon: LucideIcon
  iconClass: string
}

// Lối tắt tới các chức năng chính (chưa có API tổng hợp số liệu nên không hiển thị số đếm)
const QUICK_LINKS: QuickLink[] = [
  {
    to: '/lecturer/supervisor-requests',
    title: 'Đăng ký GVHD',
    description: 'Duyệt đơn đăng ký hướng dẫn của sinh viên',
    icon: UserPlus,
    iconClass: 'bg-amber-50 text-amber-600',
  },
  {
    to: '/lecturer/topic-proposals',
    title: 'Duyệt tên đề tài',
    description: 'Xem và duyệt yêu cầu đổi / chốt tên đề tài',
    icon: FileText,
    iconClass: 'bg-purple-50 text-purple-600',
  },
  {
    to: '/lecturer/report-check',
    title: 'Báo cáo & Đạo văn',
    description: 'Kiểm tra báo cáo và nộp kết quả đạo văn',
    icon: ShieldCheck,
    iconClass: 'bg-emerald-50 text-emerald-600',
  },
  {
    to: '/lecturer/defense/councils',
    title: 'Hội đồng chấm bảo vệ',
    description: 'Các hội đồng bạn được phân công',
    icon: Gavel,
    iconClass: 'bg-blue-50 text-blue-600',
  },
]

export default function LecturerDashboardPage() {
  const { data: user } = useMyInfo()
  const { data: semester } = useLecturerCurrentSemester()

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#0D47A1] to-[#1565C0] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md mb-3 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>
              Bảng điều khiển Giảng viên
              {semester ? ` · ${semester.name} · Năm học ${semester.academicYear}` : ''}
            </span>
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Xin chào{user?.name ? `, ${user.name}` : ''}!
          </h1>
          <p className="text-white/80 text-[13.5px] mt-1.5 leading-relaxed">
            Hệ thống quản lý đồ án tốt nghiệp — chọn một chức năng bên dưới để bắt đầu.
          </p>
        </div>
        <div className="absolute right-6 -bottom-6 opacity-10 pointer-events-none">
          <GraduationCap className="w-64 h-64 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {QUICK_LINKS.map(({ to, title, description, icon: Icon, iconClass }) => (
          <Link
            key={to}
            to={to}
            className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-blue-400 hover:shadow-sm transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {title}
              </span>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition ${iconClass}`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[12.5px] text-slate-500 mt-3">{description}</p>
            <p className="text-[12px] text-slate-500 mt-3 flex items-center gap-1 group-hover:text-blue-600 transition">
              <span>Mở chức năng</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
