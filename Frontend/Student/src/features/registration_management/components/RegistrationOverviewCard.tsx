import React from 'react'
import type { AdvisorRegistrationResponse } from '../types/registration.types'

interface SemesterOption {
  publicId: string
  name: string
}

interface RegistrationOverviewCardProps {
  mentor: string
  topic: string
  deadlineText: string
  countdownLabel: string
  currentRegistration: AdvisorRegistrationResponse | null
  hasAssignedMentor: boolean
  isLatestRejected: boolean
  semesters: SemesterOption[]
  selectedSemesterPublicId: string
  onSemesterChange: (semesterPublicId: string) => void
  onPrimaryAction: () => void
}

export const RegistrationOverviewCard: React.FC<
  RegistrationOverviewCardProps
> = ({
  mentor,
  topic,
  deadlineText,
  countdownLabel,
  currentRegistration,
  hasAssignedMentor,
  isLatestRejected,
  semesters,
  selectedSemesterPublicId,
  onSemesterChange,
  onPrimaryAction,
}) => {
  let buttonText = 'Tạo đơn đăng ký GVHD'
  let buttonTitle = 'Tạo đơn đăng ký GVHD'
  let isDisabled = false

  let buttonClass =
    'inline-flex items-center justify-center px-4 h-10 rounded-lg bg-[#1565C0] text-white text-[13px] font-semibold hover:bg-[#0D47A1] shadow-xs cursor-pointer transition-colors whitespace-nowrap'

  // Sinh viên đã được phân công GVHD
  if (hasAssignedMentor) {
    isDisabled = true
    buttonText = 'Đã có GVHD'
    buttonTitle = 'Sinh viên đã được phân công giảng viên hướng dẫn.'

    buttonClass =
      'inline-flex items-center justify-center px-4 h-10 rounded-lg bg-slate-200 text-slate-400 text-[13px] font-semibold cursor-not-allowed shadow-none border border-slate-300 whitespace-nowrap'
  }

  // Đơn đăng ký hiện tại đang tồn tại
  else if (currentRegistration) {
    switch (currentRegistration.status) {
      case 'PENDING':
        buttonText = 'Chỉnh sửa đơn đăng ký'
        buttonTitle = 'Nhấp để chỉnh sửa đơn đăng ký'
        break

      case 'TEACHER_APPROVED':
        isDisabled = true
        buttonText = 'Đang xử lý đơn'
        buttonTitle = 'Đơn đăng ký đang chờ Trưởng bộ môn xử lý.'

        buttonClass =
          'inline-flex items-center justify-center px-4 h-10 rounded-lg bg-slate-200 text-slate-500 text-[13px] font-semibold cursor-not-allowed shadow-none border border-slate-300 whitespace-nowrap'
        break

      case 'HOD_APPROVED':
      case 'ASSIGNED_BY_HOD':
        isDisabled = true
        buttonText = 'Đã có GVHD'
        buttonTitle = 'Sinh viên đã được phân công giảng viên hướng dẫn.'

        buttonClass =
          'inline-flex items-center justify-center px-4 h-10 rounded-lg bg-slate-200 text-slate-400 text-[13px] font-semibold cursor-not-allowed shadow-none border border-slate-300 whitespace-nowrap'
        break

      case 'REJECTED':
        buttonText = 'Tạo đơn đăng ký mới'
        buttonTitle =
          'Đơn đăng ký trước đó đã bị từ chối. Nhấp để gửi đơn mới.'
        break

      default:
        break
    }
  }

  // Đơn gần nhất bị từ chối
  else if (isLatestRejected) {
    buttonText = 'Tạo đơn đăng ký mới'
    buttonTitle = 'Nhấp để gửi đơn đăng ký mới'
  }

  return (
    <div className="w-full rounded-xl border border-slate-200/90 bg-white px-4 sm:px-5 py-4 shadow-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1.3fr_1.5fr_auto] items-center gap-4 xl:gap-5">

        {/* Học kỳ đăng ký */}
        <div className="flex flex-col justify-center min-w-0">
          <label
            htmlFor="registration-semester"
            className="text-xs font-semibold text-slate-500 mb-2"
          >
            Học kỳ đăng ký
          </label>

          <select
            id="registration-semester"
            value={selectedSemesterPublicId}
            onChange={(event) =>
              onSemesterChange(event.target.value)
            }
            disabled={semesters.length === 0}
            className="h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {semesters.map((item) => (
              <option key={item.publicId} value={item.publicId}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {/* Giảng viên hướng dẫn */}
        <div className="xl:border-l xl:border-slate-100 xl:pl-5 flex flex-col justify-center min-w-0">
          <div className="text-xs font-semibold text-slate-500 mb-2">
            Giảng viên hướng dẫn
          </div>

          <div className="flex items-center h-10 min-w-0">
            <span className="text-[14px] font-bold text-slate-900 leading-tight truncate">
              {mentor || 'Chưa có'}
            </span>
          </div>
        </div>

        {/* Tên đề tài */}
        <div className="xl:border-l xl:border-slate-100 xl:pl-5 flex flex-col justify-center min-w-0">
          <div className="text-xs font-semibold text-slate-500 mb-2">
            Đề tài đăng ký
          </div>

          <div className="flex items-center h-10 min-w-0">
            <span
              className="text-[14px] font-bold text-slate-900 leading-tight truncate w-full">
              {topic || 'Chưa có'}
            </span>
          </div>
        </div>

        {/* Hạn đăng ký */}
        <div className="xl:border-l xl:border-slate-100 xl:pl-5 flex flex-col justify-center min-w-0">
          <div className="text-xs font-semibold text-slate-500 mb-2">
            Hạn đăng ký
          </div>

          <div className="flex flex-col justify-center gap-1 min-w-0">
            <span className="text-[14px] font-bold text-slate-900 leading-tight whitespace-nowrap">
              {deadlineText || 'Chưa thiết lập'}
            </span>

            <span className="inline-flex w-fit items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#1565C0] whitespace-nowrap">
              {countdownLabel}
            </span>
          </div>
        </div>

        {/* Nút đăng ký */}
        <div className="flex items-center justify-start xl:justify-end">
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