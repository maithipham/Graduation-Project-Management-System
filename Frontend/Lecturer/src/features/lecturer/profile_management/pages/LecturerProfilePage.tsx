import React from 'react'
import { UserRound } from 'lucide-react'
import { roleLabels, useMyInfo } from '@/features/auth'

/** Thông tin cá nhân: chỉ hiển thị dữ liệu thật từ tài khoản đang đăng nhập (GET /my-info) */
export const LecturerProfilePage: React.FC = () => {
  const { data: user } = useMyInfo()

  const name = user?.name || '—'
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '?'

  return (
    <div className="max-w-3xl w-full mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#1565C0] text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
          {initials}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {(user?.roles ?? []).map((role) => (
              <span
                key={role}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#1565C0] border border-blue-200"
              >
                {roleLabels[role] ?? role}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex items-start gap-3 text-xs text-slate-500">
        <UserRound className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
        <p>
          Thông tin học vị, bộ môn và liên hệ được quản lý bởi Trưởng bộ môn / Quản trị viên. Hiện
          hệ thống chưa cung cấp API cập nhật hồ sơ cá nhân cho giảng viên.
        </p>
      </div>
    </div>
  )
}

export default LecturerProfilePage
