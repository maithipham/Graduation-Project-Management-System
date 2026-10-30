import React, { useState } from 'react'
import { CheckCircle2, GraduationCap, Mail, SquarePen } from 'lucide-react'
import { useMyInfo } from '@/features/auth'
import { ProfileContactModal } from '../components/ProfileContactModal'
import { useProfileManagement } from '../hooks/useProfileManagement'
import { profileService } from '../services/profile.service'

export const StudentProfilePage: React.FC = () => {
  const { data: authUser } = useMyInfo()
  const {
    profile,
    isEditOpen,
    hasCustomName,
    setIsEditOpen,
    updateContact,
  } = useProfileManagement()

  const [toastMsg, setToastMsg] = useState('')

  const displayName = hasCustomName
    ? profile.name
    : authUser?.name?.trim() || profile.name
  const avatarText = profileService.computeProfileAvatar(displayName)

  const handleOpenEdit = () => {
    setIsEditOpen(true)
  }

  const handleCloseEdit = () => {
    setIsEditOpen(false)
  }

  const handleSaveContact = (contact: { name: string; email: string; phone: string }) => {
    updateContact(contact)
    setToastMsg('Thông tin cá nhân đã được cập nhật thành công!')
    window.setTimeout(() => {
      setToastMsg('')
    }, 3200)
  }

  return (
    <div className="max-w-7xl w-full mx-auto space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            id="profileAvatar"
            className="w-16 h-16 rounded-2xl bg-[#1565C0] text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0"
          >
            {avatarText}
          </div>
          <div>
            <h1 id="profileName" className="text-xl font-bold text-slate-900 tracking-tight">
              {displayName}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-slate-400 font-medium">Hệ Đại học chính quy</span>
            </div>
          </div>
        </div>

        <button
          id="openEditProfileBtn"
          type="button"
          onClick={handleOpenEdit}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs cursor-pointer shrink-0"
        >
          <SquarePen className="w-4 h-4 text-slate-500" />
          <span>Sửa thông tin</span>
        </button>
      </div>

      {/* Profile Detail Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic Details Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-[#1565C0]">
            <GraduationCap className="w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Thông tin học vụ
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-400 font-semibold">Mã sinh viên:</span>
              <span id="profileMssv" className="col-span-2 font-bold text-slate-800">
                {profile.mssv}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-400 font-semibold">Lớp sinh hoạt:</span>
              <span id="profileClass" className="col-span-2 font-semibold text-slate-800">
                {profile.className}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-400 font-semibold">Bộ môn:</span>
              <span id="profileDept" className="col-span-2 font-semibold text-slate-800">
                {profile.department}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-400 font-semibold">Khoa quản lý:</span>
              <span className="col-span-2 font-semibold text-slate-800">
                {profile.faculty}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-400 font-semibold">Niên khóa:</span>
              <span className="col-span-2 font-semibold text-slate-800">
                {profile.academicYear}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 items-center">
              <span className="text-slate-400 font-semibold">Trạng thái:</span>
              <span className="col-span-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {profile.status}
              </span>
            </div>
          </div>
        </div>

        {/* Contact Details Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-[#1565C0]">
            <Mail className="w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Thông tin liên hệ & Hướng dẫn
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-400 font-semibold">Email:</span>
              <span id="profileEmail" className="col-span-2 font-semibold text-slate-800 break-all">
                {profile.email}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-400 font-semibold">Số điện thoại:</span>
              <span id="profilePhone" className="col-span-2 font-semibold text-slate-800">
                {profile.phone}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-400 font-semibold">GVHD:</span>
              <span className="col-span-2 font-bold text-[#1565C0]">
                {profile.mentor}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-400 font-semibold">Đề tài đồ án:</span>
              <span className="col-span-2 font-semibold text-slate-800 leading-snug">
                {profile.topic}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <ProfileContactModal
        isOpen={isEditOpen}
        onClose={handleCloseEdit}
        onSave={handleSaveContact}
        initialValues={{
          name: displayName,
          email: profile.email,
          phone: profile.phone,
        }}
      />

      {/* Toast Notification */}
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

export default StudentProfilePage
