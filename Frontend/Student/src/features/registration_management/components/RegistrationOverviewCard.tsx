import React from 'react'
import type {
  AdvisorRegistrationDeadlineStatus,
  AdvisorRegistrationResponse,
} from '../types/registration.types'
import type { Semester } from '../types/semester.types'

interface RegistrationOverviewCardProps {
  mentor: string
  topic: string
  deadlineText: string
  countdownLabel: string
  deadlineStatus: AdvisorRegistrationDeadlineStatus | null
  currentRegistration: AdvisorRegistrationResponse | null
  hasAssignedMentor: boolean
  isLatestRejected: boolean
  isCurrentSemester: boolean
  isDeadlineOpen: boolean
  academicYears: string[]
  selectedAcademicYear: string
  termsOfYear: Semester[]
  selectedSemesterPublicId: string
  onAcademicYearChange: (academicYear: string) => void
  onSemesterChange: (semesterPublicId: string) => void
  onPrimaryAction: () => void
}

function getCountdownBadgeClass(
  deadlineStatus: AdvisorRegistrationDeadlineStatus | null,
): string {
  switch (deadlineStatus) {
    case 'OPEN':
      return 'bg-blue-50 text-[#1565C0]'
    case 'NOT_STARTED':
      return 'bg-amber-50 text-amber-700'
    case 'CLOSED':
      return 'bg-rose-50 text-rose-700'
    case 'INACTIVE':
    case 'NOT_CONFIGURED':
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

export const RegistrationOverviewCard: React.FC<
  RegistrationOverviewCardProps
> = ({
  mentor,
  topic,
  deadlineText,
  countdownLabel,
  deadlineStatus,
  currentRegistration,
  hasAssignedMentor,
  isLatestRejected,
  isCurrentSemester,
  isDeadlineOpen,
  academicYears,
  selectedAcademicYear,
  termsOfYear,
  selectedSemesterPublicId,
  onAcademicYearChange,
  onSemesterChange,
  onPrimaryAction,
}) => {
  let buttonText = 'Tạo đơn đăng ký GVHD'
  let buttonTitle = 'Tạo đơn đăng ký GVHD'
  let disabledReason: string | null = null
  let isDisabled = false

  const activeButtonClass =
    'inline-flex items-center justify-center px-4 h-10 rounded-lg bg-[#1565C0] text-white text-[13px] font-semibold hover:bg-[#0D47A1] shadow-xs cursor-pointer transition-colors whitespace-nowrap'
  const disabledButtonClass =
    'inline-flex items-center justify-center px-4 h-10 rounded-lg bg-slate-200 text-slate-500 text-[13px] font-semibold cursor-not-allowed shadow-none border border-slate-300 whitespace-nowrap'

  // 1. Sinh viên đã có GVHD chính thức
  if (
    hasAssignedMentor ||
    currentRegistration?.status === 'HOD_APPROVED' ||
    currentRegistration?.status === 'ASSIGNED_BY_HOD'
  ) {
    isDisabled = true
    buttonText = 'Đã có GVHD'
    disabledReason = 'Đã được phân công GVHD chính thức'
    buttonTitle = 'Sinh viên đã được phân công giảng viên hướng dẫn.'
  }
  // 2. Đơn mới nhất đã được GVHD duyệt, chờ TBM thẩm định
  else if (currentRegistration?.status === 'TEACHER_APPROVED') {
    isDisabled = true
    buttonText = 'Đang chờ TBM chốt danh sách'
    disabledReason = 'GVHD đã duyệt, chờ Trưởng bộ môn thẩm định'
    buttonTitle = 'Đơn đăng ký đang chờ Trưởng bộ môn chốt danh sách.'
  }
  // 3. Các trạng thái có thể thao tác (PENDING, REJECTED, hoặc chưa có đơn)
  else {
    if (currentRegistration?.status === 'PENDING') {
      buttonText = 'Chỉnh sửa đơn đăng ký'
      buttonTitle = 'Nhấp để chỉnh sửa đơn đăng ký đang chờ duyệt'
    } else if (
      currentRegistration?.status === 'REJECTED' ||
      isLatestRejected
    ) {
      buttonText = 'Tạo đơn đăng ký mới'
      buttonTitle =
        'Đơn đăng ký trước đó đã bị từ chối. Nhấp để gửi đơn mới.'
    }

    if (!isCurrentSemester) {
      isDisabled = true
      disabledReason = 'Chỉ thao tác trong học kỳ hiện tại'
      buttonTitle =
        'Chỉ có thể tạo hoặc chỉnh sửa đơn đăng ký trong học kỳ hiện tại.'
    } else if (!isDeadlineOpen) {
      isDisabled = true
      switch (deadlineStatus) {
        case 'CLOSED':
          disabledReason = 'Đã hết thời hạn đăng ký GVHD'
          buttonTitle = 'Đã hết thời hạn đăng ký giảng viên hướng dẫn.'
          break
        case 'NOT_STARTED':
          disabledReason = 'Chưa tới thời gian mở đăng ký'
          buttonTitle = 'Chưa tới thời gian mở đợt đăng ký giảng viên hướng dẫn.'
          break
        case 'INACTIVE':
          disabledReason = 'Đợt đăng ký chưa kích hoạt'
          buttonTitle = 'Mốc thời hạn đăng ký chưa được kích hoạt đầy đủ.'
          break
        case 'NOT_CONFIGURED':
        default:
          disabledReason = 'Chưa thiết lập hạn đăng ký'
          buttonTitle = 'Nhà trường chưa thiết lập thời hạn đăng ký GVHD cho học kỳ này.'
          break
      }
    }
  }

  return (
    <div className="w-full rounded-xl border border-slate-200/90 bg-white px-4 sm:px-5 py-4 shadow-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[0.82fr_0.9fr_1fr_1.2fr_1.35fr_auto] items-center gap-4">
        {/* Lọc theo năm học */}
        <div className="flex flex-col justify-center min-w-0">
          <label
            htmlFor="registration-academic-year"
            className="text-xs font-semibold text-slate-500 mb-2"
          >
            Năm học
          </label>

          <select
            id="registration-academic-year"
            value={selectedAcademicYear}
            onChange={(event) => onAcademicYearChange(event.target.value)}
            disabled={academicYears.length === 0}
            className="h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {academicYears.length === 0 ? (
              <option value="">Chưa có năm học</option>
            ) : (
              academicYears.map((year) => (
                <option key={year} value={year}>
                  {year.replace('-', '–')}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Lọc theo học kỳ */}
        <div className="xl:border-l xl:border-slate-100 xl:pl-4 flex flex-col justify-center min-w-0">
          <label
            htmlFor="registration-semester"
            className="text-xs font-semibold text-slate-500 mb-2"
          >
            Học kỳ
          </label>

          <select
            id="registration-semester"
            value={selectedSemesterPublicId}
            onChange={(event) => onSemesterChange(event.target.value)}
            disabled={termsOfYear.length === 0}
            className="h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {termsOfYear.map((item) => (
              <option key={item.publicId} value={item.publicId}>
                {item.term?.trim() || item.name}
              </option>
            ))}
          </select>
        </div>

        {/* Giảng viên hướng dẫn chính thức */}
        <div className="xl:border-l xl:border-slate-100 xl:pl-4 flex flex-col justify-center min-w-0">
          <div className="text-xs font-semibold text-slate-500 mb-2">
            Giảng viên hướng dẫn
          </div>

          <div className="flex items-center h-10 min-w-0">
            <span
              className="text-[14px] font-bold text-slate-900 leading-tight truncate"
              title={mentor || 'Chưa có'}
            >
              {mentor || 'Chưa có'}
            </span>
          </div>
        </div>

        {/* Tên đề tài chính thức */}
        <div className="xl:border-l xl:border-slate-100 xl:pl-4 flex flex-col justify-center min-w-0">
          <div className="text-xs font-semibold text-slate-500 mb-2">
            Đề tài đăng ký
          </div>

          <div className="flex items-center h-10 min-w-0">
            <span
              className="text-[14px] font-bold text-slate-900 leading-tight truncate w-full"
              title={topic || 'Chưa có'}
            >
              {topic || 'Chưa có'}
            </span>
          </div>
        </div>

        {/* Hạn đăng ký */}
        <div className="xl:border-l xl:border-slate-100 xl:pl-4 flex flex-col justify-center min-w-0">
          <div className="text-xs font-semibold text-slate-500 mb-2">
            Hạn đăng ký
          </div>

          <div className="flex flex-col justify-center gap-1 min-w-0">
            <span className="text-[14px] font-bold text-slate-900 leading-tight whitespace-nowrap">
              {deadlineText || 'Chưa thiết lập'}
            </span>

            <span
              className={`inline-flex w-fit items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${getCountdownBadgeClass(
                deadlineStatus,
              )}`}
            >
              {countdownLabel}
            </span>
          </div>
        </div>

        {/* Nút đăng ký */}
        <div className="flex flex-col items-start xl:items-end justify-center gap-1">
          <button
            type="button"
            disabled={isDisabled}
            title={buttonTitle}
            onClick={onPrimaryAction}
            className={isDisabled ? disabledButtonClass : activeButtonClass}
          >
            <span>{buttonText}</span>
          </button>

          {isDisabled && disabledReason && (
            <span className="text-[11px] text-slate-500 xl:text-right">
              {disabledReason}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
