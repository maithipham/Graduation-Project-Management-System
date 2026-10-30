import React, { useState, useEffect } from 'react'
import { X, Mail, Phone, User } from 'lucide-react'
import type { LecturerProfileContactPayload } from '../types/lecturerProfile.types'

interface LecturerProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (payload: LecturerProfileContactPayload) => void
  initialValues: {
    name: string
    email: string
    phone: string
  }
}

export const LecturerProfileModal: React.FC<LecturerProfileModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialValues,
}) => {
  const [name, setName] = useState(initialValues.name)
  const [email, setEmail] = useState(initialValues.email)
  const [phone, setPhone] = useState(initialValues.phone)

  useEffect(() => {
    if (isOpen) {
      setName(initialValues.name)
      setEmail(initialValues.email)
      setPhone(initialValues.phone)
    }
  }, [isOpen, initialValues])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name: name.trim() || initialValues.name,
      email: email.trim() || initialValues.email,
      phone: phone.trim() || initialValues.phone,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      style={{
        fontFamily:
          '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#1565C0]" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Cập nhật thông tin cá nhân
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content: Chỉ cho sửa tên, email, sđt */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Họ và tên */}
          <div>
            <label htmlFor="editLecturerNameInput" className="block font-semibold text-slate-700 mb-1.5">
              Họ và tên <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                id="editLecturerNameInput"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Trần Mai Anh"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#1565C0]/30 focus:border-[#1565C0] transition"
              />
            </div>
          </div>

          {/* Email liên hệ */}
          <div>
            <label htmlFor="editLecturerEmailInput" className="block font-semibold text-slate-700 mb-1.5">
              Email liên hệ <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                id="editLecturerEmailInput"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@tlu.edu.vn"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#1565C0]/30 focus:border-[#1565C0] transition"
              />
            </div>
          </div>

          {/* Số điện thoại */}
          <div>
            <label htmlFor="editLecturerPhoneInput" className="block font-semibold text-slate-700 mb-1.5">
              Số điện thoại <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                id="editLecturerPhoneInput"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912 345 678"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#1565C0]/30 focus:border-[#1565C0] transition"
              />
            </div>
          </div>

          {/* Footer nút hành động */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer text-xs"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="h-9 px-5 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold transition shadow-xs cursor-pointer text-xs active:scale-95"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
