import { useNavigate } from 'react-router-dom'
import { roleHomePaths, type UserRole } from '../types'
import { useAuthStore } from '../store/authStore'
import {
  ShieldCheck,
  Building2,
  UserCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'

interface RoleOption {
  role: UserRole
  title: string
  badge: string
  description: string
  color: 'purple' | 'blue' | 'emerald'
  icon: typeof ShieldCheck
  user: {
    id: string
    name: string
    email: string
    code?: string
  }
}

const roleOptions: RoleOption[] = [
  {
    role: 'admin',
    title: 'Quản trị viên (Admin)',
    badge: 'Hệ thống',
    description: 'Quản lý tài khoản, phân quyền người dùng, kích hoạt & cấu hình học kỳ',
    color: 'purple',
    icon: ShieldCheck,
    user: {
      id: 'adm-01',
      name: 'Quản trị viên Hệ thống',
      email: 'admin@gpms.edu.vn',
      code: 'ADM01',
    },
  },
  {
    role: 'department-head',
    title: 'Trưởng bộ môn (Head of Dept)',
    badge: 'Quản lý đào tạo',
    description: 'Phân công GVHD, phân công review đề cương, lập hội đồng & nhắc việc',
    color: 'blue',
    icon: Building2,
    user: {
      id: 'tbm-01',
      name: 'PGS. TS. Nguyễn Văn Hùng',
      email: 'hung.nv@fe.edu.vn',
      code: 'TBM-CNPM',
    },
  },
  {
    role: 'lecturer',
    title: 'Giảng viên (Lecturer / GVHD / GVPB)',
    badge: 'Chuyên môn',
    description: 'Duyệt đề tài & đề cương, đánh giá tiến độ, kiểm tra AI & chấm điểm hội đồng',
    color: 'emerald',
    icon: UserCheck,
    user: {
      id: 'gv-01',
      name: 'TS. Trần Minh Khôi',
      email: 'khoi.tm@fe.edu.vn',
      code: 'GV001',
    },
  },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const setActiveRole = useAuthStore((state) => state.setActiveRole)
  const setUser = useAuthStore((state) => state.setUser)
  const setToken = useAuthStore((state) => state.setToken)

  function loginAs(option: RoleOption) {
    setActiveRole(option.role)
    setUser({
      ...option.user,
      role: option.role,
    })
    setToken(`demo-token-${option.role}`)
    navigate(roleHomePaths[option.role], { replace: true })
  }

  return (
    <div className="flex min-h-[88vh] items-center justify-center p-4">
      <Card className="w-full max-w-xl border-slate-200 bg-white/95 shadow-2xl backdrop-blur-sm">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50 mb-2">
            <Sparkles className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Cổng Quản Trị & Giảng Viên
          </CardTitle>
          <CardDescription className="text-sm text-slate-500">
            Hệ thống Quản lý Đồ án Tốt nghiệp — Dành cho Ban Quản trị, Trưởng bộ môn & Giảng viên
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3.5">
          {roleOptions.map((opt) => {
            const Icon = opt.icon
            const isPurple = opt.color === 'purple'
            const isBlue = opt.color === 'blue'

            const borderClass = isPurple
              ? 'border-purple-200 bg-purple-50/40 hover:border-purple-500 hover:bg-purple-50'
              : isBlue
                ? 'border-blue-200 bg-blue-50/40 hover:border-blue-500 hover:bg-blue-50'
                : 'border-emerald-200 bg-emerald-50/40 hover:border-emerald-500 hover:bg-emerald-50'

            const iconBgClass = isPurple
              ? 'bg-purple-600'
              : isBlue
                ? 'bg-blue-600'
                : 'bg-emerald-600'

            const badgeBorderClass = isPurple
              ? 'border-purple-300 text-purple-700'
              : isBlue
                ? 'border-blue-300 text-blue-700'
                : 'border-emerald-300 text-emerald-700'

            const arrowClass = isPurple
              ? 'text-purple-600'
              : isBlue
                ? 'text-blue-600'
                : 'text-emerald-600'

            return (
              <button
                key={opt.role}
                type="button"
                onClick={() => loginAs(opt)}
                className={`group relative flex w-full items-center justify-between rounded-xl border-2 p-4 text-left transition-all duration-200 hover:shadow-md cursor-pointer ${borderClass}`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white shadow-sm transition-transform group-hover:scale-105 ${iconBgClass}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 group-hover:text-slate-800">
                        {opt.title}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] py-0 px-1.5 ${badgeBorderClass}`}
                      >
                        {opt.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {opt.description}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Đăng nhập mẫu: <strong className="font-medium text-slate-600">{opt.user.name}</strong> ({opt.user.code})
                    </p>
                  </div>
                </div>
                <ArrowRight
                  className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1 ${arrowClass}`}
                />
              </button>
            )
          })}
        </CardContent>

        <CardFooter className="flex flex-col items-center border-t border-slate-100 pt-4 pb-4">
          <p className="text-xs text-slate-400 text-center">
            Sinh viên vui lòng truy cập tại phân hệ <span className="font-medium text-slate-600">Student Portal</span> riêng biệt.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
