import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { roleHomePaths } from '../types'

export default function LoginPage() {
  const navigate = useNavigate()
  const setActiveRole = useAuthStore((state) => state.setActiveRole)
  const setUser = useAuthStore((state) => state.setUser)
  const setToken = useAuthStore((state) => state.setToken)

  const [isLoading, setIsLoading] = useState(false)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    // Thu nhỏ đồng thời ảnh và khối đăng nhập, giữ nguyên bố cục hai cột
    const fitLoginPage = () => {
      const viewport = window.visualViewport
      const width = viewport ? viewport.width : window.innerWidth
      const height = viewport ? viewport.height : window.innerHeight
      const nextScale = Math.min(width / 1680, height / 768, 1)
      setScale(nextScale)
    }

    fitLoginPage()
    window.addEventListener('resize', fitLoginPage)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', fitLoginPage)
    }

    return () => {
      window.removeEventListener('resize', fitLoginPage)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', fitLoginPage)
      }
    }
  }, [])

  const handleGoogleLogin = () => {
    if (isLoading) return
    setIsLoading(true)

    // Demo xác thực 1.5 giây
    setTimeout(() => {
      // Mock tài khoản cán bộ
      const mockUser = {
        id: 'tbm-01',
        name: 'TS. Phạm Hoàng',
        email: 'phamhoang@tlu.edu.vn',
        code: 'TBM-CNPM',
        role: 'department-head' as const,
      }

      setActiveRole('department-head')
      setUser(mockUser)
      setToken('demo-tlu-google-token-department-head')

      // Chuyển hướng tới trang chính theo role
      navigate(roleHomePaths['department-head'] || '/department', { replace: true })
    }, 1500)
  }

  return (
    <div className="relative w-full min-h-screen min-h-[100dvh] overflow-hidden font-sans text-[#202428] bg-white select-none">
      <main
        className="login-page fixed top-1/2 left-1/2 flex w-[1680px] h-[768px] px-5 py-4 origin-center"
        style={{
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {/* Cột trái: Hình ảnh khuôn viên trường Đại học Thủy Lợi */}
        <section
          className="relative w-[810px] shrink-0 overflow-hidden rounded-[32px]"
          aria-label="Đại học Thủy Lợi"
        >
          <img
            className="absolute inset-0 w-full h-full object-cover object-center"
            src="/login.jpg"
            alt="Khuôn viên Đại học Thủy Lợi"
          />
        </section>

        {/* Cột phải: Form đăng nhập Google */}
        <section
          className="flex-1 flex items-center justify-center p-8"
          aria-labelledby="login-title"
        >
          <div className="w-full max-w-[480px] text-center -translate-y-3 bg-white border border-[#e2e8f0] rounded-[10px] shadow-[0_10px_35px_rgba(0,0,0,0.08)] px-8 py-6 sm:px-9 sm:py-7">
            <img
              className="block w-[200px] max-w-full h-auto mx-auto mb-3.5"
              src="/logo.webp"
              alt="Đại học Thủy Lợi"
            />
            <h2
              id="login-title"
              className="m-0 mb-1.5 text-[28px] sm:text-[30px] font-bold leading-tight whitespace-nowrap text-[#1e293b]"
            >
              HỆ THỐNG QUẢN LÝ ĐỒ ÁN
            </h2>
            <p className="m-0 mb-5 text-[#676b70] text-base leading-normal">
              Đăng nhập dành cho cán bộ &amp; giảng viên
            </p>

            {/* Nút đăng nhập Google */}
            <button
              className="w-full h-[50px] flex items-center justify-between gap-3 px-5 border border-[#e1e7ef] rounded-[8px] bg-white text-[#171b20] font-sans text-base font-semibold cursor-pointer transition-colors duration-150 hover:bg-[#f8faff] hover:border-[#c3cedd] focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#225bb9] focus-visible:outline-offset-4 shadow-sm disabled:opacity-75 disabled:cursor-wait"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg
                className="w-5 h-5 shrink-0"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>

              <span className="truncate">
                {isLoading ? 'Đang xác thực tài khoản...' : 'Đăng nhập với Google'}
              </span>

              {isLoading ? (
                <Loader2 className="w-4 h-4 shrink-0 text-[#225bb9] animate-spin" />
              ) : (
                <div className="w-4 h-4 shrink-0" aria-hidden="true" />
              )}
            </button>

            {/* Chân card hỗ trợ */}
            <div className="mt-5 pt-5 border-t border-[#f1f5f9]">
              <p className="m-0 mb-1.5 text-[#6b7077] text-sm leading-normal">
                Cần hỗ trợ truy cập?
              </p>
              <a
                className="inline-flex items-center gap-2 text-[#1456b9] text-sm font-medium no-underline hover:underline focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#225bb9] focus-visible:outline-offset-4"
                href="mailto:vpkcntt@tlu.edu.vn"
              >
                <span>Liên hệ quản trị hệ thống</span>
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
