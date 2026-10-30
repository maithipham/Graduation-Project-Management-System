import React, { useState } from 'react'
import { CheckCircle2, GraduationCap, Mail, SquarePen } from 'lucide-react'
import { useLecturerProfile } from '../hooks/useLecturerProfile'
import { LecturerProfileModal } from '../components/LecturerProfileModal'
import { lecturerProfileService } from '../services/lecturerProfile.service'
import type { LecturerProfileContactPayload } from '../types/lecturerProfile.types'

export const LecturerProfilePage: React.FC = () => {
  const {
    profile,
    displayName,
    avatarText,
    isEditOpen,
    setIsEditOpen,
    updateContact,
  } = useLecturerProfile()

  const [toastMsg, setToastMsg] = useState('')

  const handleOpenEdit = () => {
    setIsEditOpen(true)
  }

  const handleCloseEdit = () => {
    setIsEditOpen(false)
  }

  const handleSaveProfile = (payload: LecturerProfileContactPayload) => {
    updateContact(payload)
    setToastMsg('Thông tin cá nhân đã được cập nhật thành công!')
    window.setTimeout(() => {
      setToastMsg('')
    }, 3200)
  }

  const degreeFullText = lecturerProfileService.formatDegreeFull(profile.degree)

  return (
    <div
      className="max-w-7xl w-full mx-auto space-y-6 select-none"
      style={{
        fontFamily:
          '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* ========================================================
          1. PHẦN ĐẦU TRANG: AVATAR, HỌ TÊN (KÈM HỌC VỊ), VAI TRÒ & NÚT CẬP NHẬT
          ======================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {/* Avatar chữ cái đầu */}
          <div
            id="lecturerProfileAvatar"
            className="w-16 h-16 rounded-2xl bg-[#1565C0] text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0"
          >
            {avatarText}
          </div>

          <div>
            {/* Họ tên kèm học vị (VD: TS. Trần Mai Anh) */}
            <h1
              id="lecturerProfileName"
              className="text-xl font-bold text-slate-900 tracking-tight"
            >
              {displayName}
            </h1>
            {/* Dòng phụ: chức danh hoặc vai trò (Giảng viên / Trưởng ngành) */}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-slate-500 font-medium">
                {profile.role || 'Giảng viên'}
              </span>
            </div>
          </div>
        </div>

        {/* Nút Cập nhật thông tin */}
        <button
          id="btnOpenEditLecturerProfile"
          type="button"
          onClick={handleOpenEdit}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer shrink-0 uppercase tracking-wide active:scale-95"
        >
          <SquarePen className="w-4 h-4" />
          <span>Cập nhật thông tin</span>
        </button>
      </div>

      {/* ========================================================
          2. KHỐI NỘI DUNG: THÔNG TIN CÔNG TÁC & THÔNG TIN LIÊN HỆ
          ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Khối “Thông tin công tác” (tương ứng “Thông tin học tập”) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-[#1565C0]">
            <GraduationCap className="w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Thông tin công tác
            </h2>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Học vị viết rõ (Tiến sĩ / Thạc sĩ) */}
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-400 font-semibold">Học vị:</span>
              <span id="profileDegree" className="col-span-2 font-bold text-slate-800">
                {degreeFullText}
              </span>
            </div>

            {/* Đơn vị công tác */}
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-400 font-semibold">Đơn vị công tác:</span>
              <span id="profileWorkplace" className="col-span-2 font-semibold text-slate-800">
                {profile.workplace || 'Trường Đại học Thủy lợi'}
                {profile.isExternal && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Ngoài trường
                  </span>
                )}
              </span>
            </div>

            {/* Bộ môn (ngoài trường để trống) */}
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-400 font-semibold">Bộ môn:</span>
              <span id="profileDepartment" className="col-span-2 font-semibold text-slate-800">
                {profile.isExternal ? '' : (profile.department || '—')}
              </span>
            </div>

            {/* Khoa quản lý (ngoài trường để trống) */}
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-400 font-semibold">Khoa quản lý:</span>
              <span id="profileFaculty" className="col-span-2 font-semibold text-slate-800">
                {profile.isExternal ? '' : (profile.faculty || '—')}
              </span>
            </div>
          </div>
        </div>

        {/* Khối “Thông tin liên hệ” */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-[#1565C0]">
            <Mail className="w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Thông tin liên hệ
            </h2>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Email */}
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-400 font-semibold">Email:</span>
              <span
                id="profileEmail"
                className="col-span-2 font-semibold text-slate-800 break-all"
              >
                {profile.email || '—'}
              </span>
            </div>

            {/* Số điện thoại */}
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-400 font-semibold">Số điện thoại:</span>
              <span id="profilePhone" className="col-span-2 font-semibold text-slate-800">
                {profile.phone || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal chỉnh sửa thông tin cá nhân: chỉ cho sửa tên, email, sđt */}
      <LecturerProfileModal
        isOpen={isEditOpen}
        onClose={handleCloseEdit}
        onSave={handleSaveProfile}
        initialValues={{
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
        }}
      />

      {/* Toast Notification khi cập nhật thành công */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default LecturerProfilePage
