import React, { useState } from 'react'
import { X } from 'lucide-react'

interface ProfileContactModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (contact: { name: string; email: string; phone: string }) => void
  initialValues: {
    name: string
    email: string
    phone: string
  }
}

export const ProfileContactModal: React.FC<ProfileContactModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialValues,
}) => {
  const [editName, setEditName] = useState(initialValues.name)
  const [editEmail, setEditEmail] = useState(initialValues.email)
  const [editPhone, setEditPhone] = useState(initialValues.phone)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name: editName.trim() || initialValues.name,
      email: editEmail.trim() || initialValues.email,
      phone: editPhone.trim() || initialValues.phone,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Cập nhật thông tin cá nhân
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="editNameInput"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Họ và tên
            </label>
            <input
              type="text"
              id="editNameInput"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#1565C0]/30 focus:border-[#1565C0]"
            />
          </div>

          <div>
            <label
              htmlFor="editEmailInput"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Email liên hệ
            </label>
            <input
              type="email"
              id="editEmailInput"
              required
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#1565C0]/30 focus:border-[#1565C0]"
            />
          </div>

          <div>
            <label
              htmlFor="editPhoneInput"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Số điện thoại
            </label>
            <input
              type="tel"
              id="editPhoneInput"
              required
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#1565C0]/30 focus:border-[#1565C0]"
            />
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 mt-6 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-bold uppercase transition-colors bg-[#1565C0] text-white hover:bg-[#0D47A1] shadow-xs cursor-pointer"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
