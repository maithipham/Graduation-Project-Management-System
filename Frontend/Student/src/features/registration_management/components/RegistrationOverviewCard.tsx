import React from 'react'
import type { SupervisorRegistrationItem } from '../types/registration.types'

interface RegistrationOverviewCardProps {
  mentor: string
  topic: string
  deadlineText: string
  countdownLabel: string
  pendingRequest?: SupervisorRegistrationItem
  hasAssignedMentor: boolean
  isLatestRejected: boolean
  onPrimaryAction: () => void
}

export const RegistrationOverviewCard: React.FC<RegistrationOverviewCardProps> = ({
  mentor,
  topic,
  deadlineText,
  countdownLabel,
  pendingRequest,
  hasAssignedMentor,
  isLatestRejected,
  onPrimaryAction,
}) => {
  let buttonText = 'Tạo đơn đăng ký GVHD'
  let buttonTitle = 'Tạo đơn đăng ký GVHD'
  let isDisabled = false
  let buttonClass =
    'inline-flex items-center justify-center px-5 h-10 rounded-lg bg-[#1565C0] text-white text-[13.5px] font-semibold hover:bg-[#0D47A1] shadow-xs cursor-pointer transition-colors whitespace-nowrap'

  if (hasAssignedMentor) {
    isDisabled = true
    buttonText = 'Tạo đơn đăng ký GVHD'
    buttonTitle = 'Sinh viên đã có giảng viên hướng dẫn.'
    buttonClass =
      'inline-flex items-center justify-center px-5 h-10 rounded-lg bg-slate-200 text-slate-400 text-[13.5px] font-semibold cursor-not-allowed shadow-none border border-slate-300 transition-colors whitespace-nowrap'
  } else if (pendingRequest) {
    if (pendingRequest.subStatus === 'pending_tbm') {
      isDisabled = true
      buttonText = 'Đang xử lý đơn'
      buttonTitle = 'Đơn đăng ký đang được xử lý'
      buttonClass =
        'inline-flex items-center justify-center px-5 h-10 rounded-lg bg-slate-200 text-slate-500 text-[13.5px] font-semibold cursor-not-allowed shadow-none border border-slate-300 transition-colors whitespace-nowrap'
    } else {
      buttonText = 'Chỉnh sửa đơn đăng ký'
      buttonTitle = 'Nhấp để chỉnh sửa đơn đăng ký'
    }
  } else if (isLatestRejected) {
    buttonText = 'Tạo đơn đăng ký mới'
    buttonTitle = 'Nhấp để gửi đơn mới với giảng viên khác'
  }

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white px-5 sm:px-6 py-4 shadow-xs">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1.1fr_1.3fr_1.4fr_auto] items-center gap-4 xl:gap-6 divide-y md:divide-y-0">
        {/* Cột 1: Giảng viên hướng dẫn */}
        <div className="xl:border-r xl:border-slate-100 xl:pr-6 flex flex-col justify-center min-w-0">
          <div className="text-xs font-semibold text-slate-500 mb-1">Giảng viên hướng dẫn</div>
          <div className="flex items-center gap-2 h-7">
            <span className="text-[15px] font-bold text-slate-900 leading-tight truncate">
              {mentor || 'Chưa có GVHD'}
            </span>
          </div>
        </div>

        {/* Cột 2: Tên đề tài chính thức */}
        <div className="pt-3 md:pt-0 xl:border-r xl:border-slate-100 xl:pr-6 flex flex-col justify-center min-w-0">
          <div className="text-xs font-semibold text-slate-500 mb-1">Tên đề tài chính thức</div>
          <div className="flex items-center h-7 min-w-0">
            <span
              className="text-[15px] font-bold text-slate-900 leading-tight truncate w-full"
              title={topic || 'Chưa đăng ký'}
            >
              {topic || 'Chưa đăng ký'}
            </span>
          </div>
        </div>

        {/* Cột 3: Hạn đăng ký GVHD */}
        <div className="pt-3 md:pt-0 flex flex-col justify-center">
          <div className="text-xs font-semibold text-slate-500 mb-1">Hạn đăng ký GVHD</div>
          <div className="flex items-center gap-2 h-7 flex-wrap">
            <span className="text-[15px] font-bold text-slate-900 leading-tight">
              {deadlineText}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#1565C0] whitespace-nowrap">
              {countdownLabel}
            </span>
          </div>
        </div>

        {/* Cột 4: Nút Tạo đơn đăng ký GVHD */}
        <div className="pt-3 md:pt-0 flex items-center justify-start xl:justify-end shrink-0">
          <button
            type="button"
            disabled={isDisabled}
            title={buttonTitle}
            onClick={onPrimaryAction}
            className={buttonClass}
          >
            <span>{buttonText}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

