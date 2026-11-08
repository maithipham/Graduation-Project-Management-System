import React from 'react'
import {
  BookOpen,
  Building,
  Mail,
  MapPin,
  Phone,
  User,
  Users,
  X,
} from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import type { Lecturer } from '../types/lecturer.types'
import {
  cleanDepartmentName,
  getAvatarBgClass,
  getLecturerInitials,
} from '../services/lecturer.service'

interface LecturerDetailModalProps {
  lecturer: Lecturer | null
  open: boolean
  onClose: () => void
}

export const LecturerDetailModal: React.FC<LecturerDetailModalProps> = ({
  lecturer,
  open,
  onClose,
}) => {
  if (!open || !lecturer) return null

  const isExternal = lecturer.origin === 'external'
  const maxStudents = lecturer.maxStudents || 20
  const assignedCount = lecturer.assignedCount ?? 0
  const pct = Math.min(100, Math.round((assignedCount / maxStudents) * 100))
  const isFull = assignedCount >= maxStudents

  const progressColor =
    isFull
      ? 'bg-amber-500'
      : assignedCount > 0
        ? 'bg-emerald-500'
        : 'bg-slate-300'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lecturer-modal-title"
      >
        {/* Header modal */}
        <div className="flex items-start justify-between p-5 bg-gradient-to-r from-slate-50 to-sky-50/40 border-b border-slate-200">
          <div className="flex items-center gap-3.5 min-w-0">
            <span
              className={cn(
                'w-12 h-12 rounded-full text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm',
                getAvatarBgClass(lecturer.name),
              )}
            >
              {getLecturerInitials(lecturer.name)}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {lecturer.degree && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold text-slate-700 bg-white border border-slate-300 shadow-2xs">
                    {lecturer.degree}
                  </span>
                )}
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold',
                    isExternal
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200',
                  )}
                >
                  {isExternal ? 'Ngoài trường' : 'Trong trường'}
                </span>
              </div>
              <h3
                id="lecturer-modal-title"
                className="text-base font-bold text-slate-800 truncate mt-1"
              >
                {lecturer.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung chi tiết */}
        <div className="p-5 space-y-4 text-xs text-slate-600 max-h-[75vh] overflow-y-auto">
          {/* Thông tin đơn vị & chỉ tiêu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" />
                Đơn vị / Bộ môn
              </div>
              <div className="font-semibold text-slate-800 text-[13px]">
                {isExternal
                  ? lecturer.unit || 'Đơn vị ngoài trường'
                  : (() => {
                      const cleanDept = cleanDepartmentName(lecturer.department || '')
                      return cleanDept && cleanDept.toLowerCase() !== 'bộ môn' && cleanDept.toLowerCase() !== 'bo mon'
                        ? `Bộ môn ${cleanDept}`
                        : 'Bộ môn Kỹ thuật phần mềm'
                    })()}
              </div>
              <div className="text-[11px] text-slate-500">{lecturer.unit}</div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Chỉ tiêu hướng dẫn kỳ này
              </div>
              <div className="font-bold text-slate-800 text-[13px]">
                {assignedCount} / {maxStudents} sinh viên
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                <div
                  className={cn('h-full transition-all duration-300', progressColor)}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div
                className={cn(
                  'text-[10.5px] font-medium mt-0.5',
                  isFull ? 'text-amber-600' : 'text-emerald-600',
                )}
              >
                {isFull ? 'Đã đủ số lượng SV' : 'Còn nhận hướng dẫn'}
              </div>
            </div>
          </div>

          {/* Liên hệ */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              Thông tin liên hệ
            </div>
            <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-500 min-w-[60px]">Email:</span>
                <span className="font-mono text-slate-800 font-medium select-all">
                  {lecturer.email || 'Chưa cập nhật'}
                </span>
              </div>
              {lecturer.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-500 min-w-[60px]">SĐT:</span>
                  <span className="text-slate-800 font-medium">{lecturer.phone}</span>
                </div>
              )}
              {lecturer.room && (
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-500 min-w-[60px]">Phòng làm việc:</span>
                  <span className="text-slate-800 font-medium">{lecturer.room}</span>
                </div>
              )}
            </div>
          </div>

          {/* Hướng nghiên cứu */}
          {lecturer.field && (
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#0288D1]" />
                Hướng nghiên cứu & đề tài
              </div>
              <p className="text-[12.5px] text-slate-700 leading-relaxed bg-sky-50/50 p-3 rounded-lg border border-sky-100">
                {lecturer.field}
              </p>
            </div>
          )}

          {/* Giới thiệu */}
          {lecturer.bio && (
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Giới thiệu thêm
              </div>
              <p className="text-[12.5px] text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                {lecturer.bio}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-3.5 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition shadow-2xs cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

