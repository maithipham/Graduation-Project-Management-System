import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Info } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { roleHomePaths } from "../types";

export default function LoginPage() {
  const navigate = useNavigate();
  const setActiveRole = useAuthStore((state) => state.setActiveRole);
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);

  const [isLoading, setIsLoading] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const handleGoogleLogin = () => {
    if (isLoading) return;
    setIsLoading(true);

    // Demo xác thực 1.5 giây
    setTimeout(() => {
      // Mock tài khoản sinh viên
      const mockStudent = {
        id: "sv-2024-001",
        name: "Nguyễn Văn An",
        email: "an.nv@sinhvien.tlu.edu.vn",
        code: "2151060001",
        role: "student" as const,
      };

      setActiveRole("student");
      setUser(mockStudent);
      setToken("demo-tlu-google-token-student");

      // Chuyển hướng tới cổng chính của sinh viên
      navigate(roleHomePaths.student || "/student", { replace: true });
    }, 1500);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#F8FAFC] overflow-hidden flex flex-col justify-center select-none font-['Be_Vietnam_Pro',sans-serif]">
      {/* ========================================================
          1. HIỆU ỨNG NỀN XANH - TRẮNG LOANG (MESH GRADIENT BLUR ORBS)
          ======================================================== */}
      {/* Orb 1: Góc trên bên trái */}
      <div
        className="absolute -top-24 -left-24 w-[450px] h-[450px] rounded-full bg-[#BAE6FD] blur-[120px] opacity-60 pointer-events-none"
        aria-hidden="true"
      />

      {/* Orb 2: Góc dưới bên phải */}
      <div
        className="absolute -bottom-28 -right-28 w-[500px] h-[500px] rounded-full bg-[#93C5FD] blur-[140px] opacity-45 pointer-events-none"
        aria-hidden="true"
      />

      {/* Orb 3: Tâm màn hình */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[#E0F2FE] blur-[90px] opacity-70 pointer-events-none"
        aria-hidden="true"
      />

      {/* ========================================================
          2. BỐ CỤC CHIA ĐÔI MÀN HÌNH (SPLIT-SCREEN 50:50)
          ======================================================== */}
      <div className="relative z-10 w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* ----------------------------------------------------
            CỘT TRÁI: NHẬN DIỆN THƯƠNG HIỆU TỐI GIẢN (BRANDING)
            ---------------------------------------------------- */}
        <div className="flex flex-col justify-between pt-6 sm:pt-8 lg:pt-10 pb-8 sm:pb-10 lg:pb-12 px-6 sm:px-10 lg:px-14 min-h-[380px] lg:min-h-screen">
          {/* Đầu cột: Logo trường trên đầu phía bên trái */}
          <div className="flex items-center gap-3.5">
            <img
              src="/logo.webp"
              alt="Trường Đại học Thủy Lợi"
              className="h-13 sm:h-15 w-auto object-contain shrink-0"
            />
            <div className="flex flex-col">
              <span className="font-bold text-slate-800 text-xs sm:text-sm tracking-tight uppercase leading-snug">
                CỔNG THÔNG TIN QUẢN LÝ ĐỒ ÁN
              </span>
              <span className="font-semibold text-slate-500 text-[11px] sm:text-xs tracking-wide uppercase leading-tight">
                KHOA CÔNG NGHỆ THÔNG TIN
              </span>
            </div>
          </div>

          {/* Giữa cột: Nội dung thông tin hệ thống dành cho Sinh viên */}
          <div className="my-8 lg:my-0 max-w-2xl text-left">
            {/* Dòng 1 & 2: Tiêu đề chính, chữ in hoa, cỡ chữ cân đối đồng đều, màu xanh navy đậm */}
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] xl:text-[36px] font-bold uppercase tracking-tight text-[#0A2540] leading-tight">
              <span className="block whitespace-nowrap">
                HỆ THỐNG QUẢN LÝ ĐỒ ÁN
              </span>
              <span className="block mt-1 sm:mt-1.5">TỐT NGHIỆP</span>
            </h1>

            {/* Dòng 3: Phụ đề dành cho Sinh viên */}
            <p className="text-lg sm:text-xl text-slate-700 mt-5 sm:mt-6 leading-relaxed">
              <span className="font-normal text-slate-600">
                Dành cho Sinh viên
              </span>
              {" - "}
              <span className="font-bold text-slate-900">
                Khoa Công nghệ thông tin
              </span>
            </p>

            {/* Dòng 4 & 5: Mô tả chức năng sinh viên */}
            <div className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed mt-3.5 sm:mt-4">
              <p>
                Nền tảng số hóa quản lý đề tài, đăng ký giảng viên hướng dẫn và
                theo dõi tiến độ đồ án tốt nghiệp.
              </p>
            </div>
          </div>

          {/* Chân cột: Footer */}
          <div>
            <p className="text-xs text-slate-400 font-normal">
              © 2026 Trường Đại học Thủy Lợi - Khoa Công nghệ Thông tin
            </p>
          </div>
        </div>

        {/* ----------------------------------------------------
            CỘT PHẢI: KHỐI FORM ĐĂNG NHẬP GỌN GÀNG (AUTH & ACTION)
            ---------------------------------------------------- */}
        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-16">
          <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-2xl shadow-slate-200/50 backdrop-blur-xs">
            {/* 1. Tiêu đề card */}
            <div className="text-left">
              <span className="inline-block bg-blue-50 text-[#0D47A1] text-xs font-bold px-3 py-1.5 rounded-full w-fit mb-4 border border-blue-200">
                DÀNH CHO SINH VIÊN
              </span>
              <h2 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight leading-snug">
                Cổng thông tin sinh viên
              </h2>
              <p className="text-slate-500 font-normal text-sm mt-2.5 leading-relaxed">
                Sử dụng tài khoản Google Sinh viên được cấp bởi nhà trường
              </p>
            </div>

            {/* 2. Nút đăng nhập duy nhất (Google Button) */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="mt-7 w-full h-12 rounded-xl border border-slate-300 bg-white font-medium text-sm text-slate-700 flex items-center justify-center gap-3 transition-all duration-200 hover:bg-slate-50 hover:border-slate-400 hover:shadow-md active:scale-[0.99] cursor-pointer disabled:opacity-80 disabled:cursor-wait"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-[#1565C0] shrink-0" />
                  <span className="text-slate-700 font-medium">
                    Đang xác thực...
                  </span>
                </>
              ) : (
                <>
                  {/* Google 4-color SVG Icon */}
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
                  <span className="font-medium">Đăng nhập với Google</span>
                </>
              )}
            </button>

            {/* 3. Chân thẻ (Ghi chú & Hỗ trợ ngắn gọn) */}
            <div className="text-xs text-amber-700 bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 text-center mt-6 font-medium leading-relaxed">
              Chỉ áp dụng cho tài khoản sinh viên (@sinhvien.tlu.edu.vn hoặc
              @e.tlu.edu.vn)
            </div>

            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="text-xs text-center text-[#1565C0] font-medium hover:underline block w-full mt-5 cursor-pointer"
            >
              Cần trợ giúp? Liên hệ Giáo vụ Khoa CNTT
            </button>

            {/* Modal thông tin hỗ trợ */}
            {helpOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
                onClick={() => setHelpOpen(false)}
              >
                <div
                  className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center">
                      <Info size={20} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      Hỗ trợ Sinh viên
                    </h3>
                  </div>
                  <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                    <p className="font-normal">
                      <strong className="font-bold">Văn phòng:</strong> P302 -
                      Nhà C1, Trường Đại học Thủy Lợi
                    </p>
                    <p className="font-normal">
                      <strong className="font-bold">Điện thoại:</strong> (024)
                      3852 2201 (Máy lẻ: 215)
                    </p>
                    <p className="font-normal">
                      <strong className="font-bold">Email:</strong>{" "}
                      vpkcntt@tlu.edu.vn
                    </p>
                    <p className="text-[11px] text-slate-400 pt-1 font-normal">
                      Thời gian làm việc: Giờ hành chính các ngày từ Thứ 2 đến
                      Thứ 6. Sinh viên mang theo thẻ sinh viên khi liên hệ trực
                      tiếp.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHelpOpen(false)}
                    className="w-full mt-4 h-9 rounded-lg bg-[#1565C0] text-white text-xs font-bold hover:bg-[#0D47A1] transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
