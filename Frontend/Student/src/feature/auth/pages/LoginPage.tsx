import { useNavigate } from 'react-router-dom'
import { roleHomePaths } from '../types'
import { useAuthStore } from '../store/authStore'
import { GraduationCap, ArrowRight, ShieldCheck, LogIn } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'

export default function LoginPage() {
  const navigate = useNavigate()
  const setActiveRole = useAuthStore((state) => state.setActiveRole)
  const setUser = useAuthStore((state) => state.setUser)
  const setToken = useAuthStore((state) => state.setToken)

  function loginAsStudent() {
    setActiveRole('student')
    setUser({
      id: 'sv-2024-001',
      name: 'Nguyễn Văn An',
      email: 'an.nv@sinhvien.edu.vn',
      role: 'student',
      code: 'SV2024001',
    })
    setToken('demo-student-token')
    navigate(roleHomePaths.student, { replace: true })
  }

  return (
    <div className="flex min-h-[85vh] items-center justify-center p-4">
      <Card className="w-full max-w-lg border-slate-200 bg-white/95 shadow-xl backdrop-blur-sm">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-8 ring-blue-50/50 mb-2">
            <GraduationCap className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Cổng Thông Tin Sinh Viên
          </CardTitle>
          <CardDescription className="text-sm text-slate-500">
            Hệ thống Quản lý Đồ án Tốt nghiệp - Phân hệ Sinh viên
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 text-xs text-blue-800">
            <p className="font-semibold mb-1 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              Đăng nhập tài khoản sinh viên
            </p>
            <p className="text-blue-600/90 leading-relaxed">
              Truy cập để đăng ký người hướng dẫn, đề xuất tên đề tài, nộp đề cương, nộp báo cáo tiến độ và theo dõi kết quả đánh giá của hội đồng.
            </p>
          </div>

          <button
            type="button"
            onClick={loginAsStudent}
            className="group relative flex w-full items-center justify-between rounded-xl border-2 border-blue-300 bg-blue-50/60 p-4 text-left transition-all duration-200 hover:border-blue-600 hover:bg-blue-100/70 hover:shadow-md cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition-transform group-hover:scale-105">
                <LogIn className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 group-hover:text-blue-700">
                    Vào Cổng Sinh Viên (SV site)
                  </span>
                  <Badge variant="outline" className="border-blue-300 text-blue-700 text-[10px] py-0 px-1.5">
                    Học tập
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đăng nhập với vai trò Sinh viên (SV2024001)
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-blue-600 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </CardContent>

        <CardFooter className="flex flex-col items-center border-t border-slate-100 pt-4 pb-4">
          <p className="text-xs text-slate-400 text-center">
            Sinh viên gặp vấn đề về tài khoản vui lòng liên hệ Văn phòng Khoa
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

