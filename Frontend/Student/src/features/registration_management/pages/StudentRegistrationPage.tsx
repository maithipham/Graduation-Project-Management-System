import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNotifications } from '@/features/notification'
import { Skeleton } from '@/shared/components/ui'
import { isApiError } from '@/shared/types'
import RegistrationFormModal from '../components/RegistrationFormModal'
import { RegistrationHistoryTable } from '../components/RegistrationHistoryTable'
import { RegistrationOverviewCard } from '../components/RegistrationOverviewCard'
import {
  registrationKeys,
  useCurrentSemester,
  useSemesters,
  useCurrentRegistration,
  useRegistrationOverview,
  useRegistrationHistory,
  useAvailableAdvisors,
  useSubmitRegistration,
  useUpdateRegistration,
} from '../hooks'
import type {
  AdvisorRegistrationDeadlineStatus,
  AdvisorRegistrationResponse,
  AvailableAdvisor,
} from '../types/registration.types'

function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Có lỗi xảy ra. Vui lòng thử lại.'
}

function formatDeadlineDate(date: string | null): string {
  if (!date) return ''

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return ''
  }

  const day = String(parsedDate.getDate()).padStart(2, '0')
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
  const year = parsedDate.getFullYear()

  return `${day}/${month}/${year}`
}

function computeCountdownLabel(
  startDate: string | null,
  endDate: string | null,
  isActive: boolean | null,
  deadlineStatus: AdvisorRegistrationDeadlineStatus | null,
): string {
  if (deadlineStatus === 'NOT_CONFIGURED' || (!startDate && !endDate)) {
    return 'Chưa thiết lập'
  }

  if (deadlineStatus === 'INACTIVE' || !startDate || !endDate) {
    return 'Chưa kích hoạt'
  }

  if (isActive !== true) {
    return 'Đã khóa'
  }

  const now = Date.now()
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return 'Chưa thiết lập'
  }

  if (deadlineStatus === 'CLOSED' || now > end) {
    return 'Đã hết hạn'
  }

  if (deadlineStatus === 'NOT_STARTED' || now < start) {
    const diffMs = Math.max(0, start - now)
    const totalHours = Math.ceil(diffMs / (1000 * 60 * 60))
    const days = Math.floor(totalHours / 24)
    const hours = totalHours % 24

    if (days > 0) {
      return `Mở sau ${days} ngày ${hours} giờ`
    }

    return `Mở sau ${Math.max(1, hours)} giờ`
  }

  const diffMs = Math.max(0, end - now)
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60))
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24

  if (days > 0) {
    return `Còn ${days} ngày ${hours} giờ`
  }

  return `Còn ${Math.max(1, hours)} giờ`
}

function getDeadlineText(
  startDate: string | null,
  endDate: string | null,
): string {
  const start = formatDeadlineDate(startDate)
  const end = formatDeadlineDate(endDate)

  if (start && end) {
    return `${start} - ${end}`
  }

  if (end) {
    return `Đến ${end}`
  }

  return 'Chưa thiết lập'
}

export default function StudentRegistrationPage() {
  const queryClient = useQueryClient()

  // Đồng bộ realtime khi nhận thông báo mới qua SSE (/connection)
  const { data: notifications } = useNotifications()
  const latestNotificationId = notifications?.[0]?.id
  const prevNotificationIdRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (latestNotificationId === undefined) return
    if (
      prevNotificationIdRef.current !== undefined &&
      prevNotificationIdRef.current !== latestNotificationId
    ) {
      void queryClient.invalidateQueries({
        queryKey: registrationKeys.all,
      })
    }
    prevNotificationIdRef.current = latestNotificationId
  }, [latestNotificationId, queryClient])

  // 1. Lấy học kỳ hiện tại
  const {
    data: semester,
    isLoading: isLoadingSemester,
    isError: isSemesterError,
    error: semesterError,
  } = useCurrentSemester()

  // 2. Lấy danh sách tất cả học kỳ
  const {
    data: semesters = [],
    isLoading: isLoadingSemesters,
    isError: isSemestersError,
    error: semestersError,
  } = useSemesters()

  // Gộp học kỳ hiện tại vào danh sách nếu chưa có
  const semesterOptions = useMemo(() => {
    if (
      semester &&
      !semesters.some((item) => item.publicId === semester.publicId)
    ) {
      return [semester, ...semesters]
    }
    return semesters
  }, [semester, semesters])

  // 3. Năm học và học kỳ do người dùng chọn (mặc định ưu tiên học kỳ hiện tại, sau đó học kỳ đầu tiên)
  const [userSelectedYear, setUserSelectedYear] = useState<string | null>(null)
  const [userSelectedSemesterId, setUserSelectedSemesterId] = useState<
    string | null
  >(null)

  const academicYears = useMemo(
    () =>
      Array.from(
        new Set(
          semesterOptions
            .map((item) => item.academicYear)
            .filter(Boolean),
        ),
      ),
    [semesterOptions],
  )

  const selectedSemester = useMemo(() => {
    if (userSelectedSemesterId) {
      const matched = semesterOptions.find(
        (item) => item.publicId === userSelectedSemesterId,
      )
      if (matched) return matched
    }

    return semester ?? semesterOptions[0] ?? null
  }, [userSelectedSemesterId, semesterOptions, semester])

  const selectedAcademicYear =
    userSelectedYear && academicYears.includes(userSelectedYear)
      ? userSelectedYear
      : (selectedSemester?.academicYear ?? academicYears[0] ?? '')

  const termsOfYear = useMemo(() => {
    if (!selectedAcademicYear) {
      return semesterOptions
    }

    const filtered = semesterOptions.filter(
      (item) => item.academicYear === selectedAcademicYear,
    )
    return filtered.length > 0 ? filtered : semesterOptions
  }, [semesterOptions, selectedAcademicYear])

  const selectedSemesterPublicId = selectedSemester?.publicId ?? ''

  const semesterPublicId = selectedSemesterPublicId || undefined

  // Chỉ học kỳ hiện tại mới được phép đăng ký hoặc chỉnh sửa
  const isCurrentSemester =
    Boolean(semester?.publicId) &&
    semesterPublicId === semester?.publicId

  // 4. Lấy thông tin tổng quan theo học kỳ được chọn
  const {
    data: registrationOverview,
    isLoading: isLoadingOverview,
    isError: isOverviewError,
    error: overviewError,
  } = useRegistrationOverview(semesterPublicId)

  // 5. Lấy lịch sử đăng ký theo học kỳ được chọn
  const {
    data: requests = [],
    isLoading: isLoadingHistory,
    isError: isHistoryError,
    error: historyError,
  } = useRegistrationHistory(semesterPublicId)

  // 6. Lấy đơn đăng ký mới nhất trong học kỳ hiện tại
  const { data: currentRegistration } = useCurrentRegistration()

  // 7. Lấy danh sách giảng viên còn chỉ tiêu (chỉ gọi khi đang xem học kỳ hiện tại)
  const {
    data: lecturers = [],
    isLoading: isLoadingLecturers,
  } = useAvailableAdvisors(
    isCurrentSemester ? semesterPublicId : undefined,
  )

  // 8. Mutation đăng ký và cập nhật
  const submitMutation = useSubmitRegistration()
  const updateMutation = useUpdateRegistration()

  // 9. State giao diện
  const [modalOpen, setModalOpen] = useState(false)
  const [isEditingPending, setIsEditingPending] = useState(false)

  const [editingRegistration, setEditingRegistration] =
    useState<AdvisorRegistrationResponse | null>(null)

  const [submitError, setSubmitError] = useState<string | null>(null)

  const isSubmitting =
    submitMutation.isPending || updateMutation.isPending

  // 10. Trạng thái hạn đăng ký
  const deadlineStatus = registrationOverview?.deadlineStatus ?? null
  const isDeadlineOpen = deadlineStatus === 'OPEN'
  const canEditOrSubmit = isCurrentSemester && isDeadlineOpen

  let editDisabledReason: string | null = null
  if (!isCurrentSemester) {
    editDisabledReason = 'Học kỳ cũ'
  } else if (!isDeadlineOpen) {
    switch (deadlineStatus) {
      case 'CLOSED':
        editDisabledReason = 'Đã hết hạn'
        break
      case 'NOT_STARTED':
        editDisabledReason = 'Chưa mở đăng ký'
        break
      case 'INACTIVE':
        editDisabledReason = 'Chưa kích hoạt'
        break
      default:
        editDisabledReason = 'Chưa thiết lập hạn'
        break
    }
  }

  // 11. Xác định trạng thái đơn theo học kỳ đang chọn
  const pendingRegistration =
    (isCurrentSemester && currentRegistration?.status === 'PENDING'
      ? currentRegistration
      : undefined) ??
    requests.find((request) => request.status === 'PENDING')

  const waitingApprovalRegistration =
    (isCurrentSemester &&
    currentRegistration?.status === 'TEACHER_APPROVED'
      ? currentRegistration
      : undefined) ??
    requests.find((request) => request.status === 'TEACHER_APPROVED')

  const assignedRegistration =
    (isCurrentSemester &&
    (currentRegistration?.status === 'HOD_APPROVED' ||
      currentRegistration?.status === 'ASSIGNED_BY_HOD')
      ? currentRegistration
      : undefined) ??
    requests.find(
      (request) =>
        request.status === 'HOD_APPROVED' ||
        request.status === 'ASSIGNED_BY_HOD',
    )

  const latestInSemester =
    (isCurrentSemester ? currentRegistration : null) ??
    requests[0] ??
    null

  const isAssignmentLocked = Boolean(
    registrationOverview?.isAssignmentLocked,
  )

  const hasAssignedMentor =
    Boolean(registrationOverview?.mentorName) ||
    (isAssignmentLocked && Boolean(assignedRegistration))

  const isPending = Boolean(pendingRegistration)
  const isWaitingApproval = Boolean(waitingApprovalRegistration)
  const isWaitingHODLock =
    !isAssignmentLocked && Boolean(assignedRegistration)

  const isLatestRejected =
    latestInSemester?.status === 'REJECTED' &&
    !isPending &&
    !isWaitingApproval &&
    !hasAssignedMentor &&
    !isWaitingHODLock

  const cardRegistration =
    pendingRegistration ??
    waitingApprovalRegistration ??
    assignedRegistration ??
    (isLatestRejected ? latestInSemester : null)

  // 12. Thông tin GVHD và đề tài chính thức
  const mentor = registrationOverview?.mentorName ?? ''
  const topic = registrationOverview?.topicName ?? ''

  // 13. Thông tin deadline
  const deadlineText = getDeadlineText(
    registrationOverview?.deadlineStartDate ?? null,
    registrationOverview?.deadlineEndDate ?? null,
  )

  const countdownLabel = registrationOverview
    ? computeCountdownLabel(
        registrationOverview.deadlineStartDate,
        registrationOverview.deadlineEndDate,
        registrationOverview.deadlineActive,
        registrationOverview.deadlineStatus,
      )
    : 'Đang tải...'

  // 14. Xử lý khi đổi năm học / học kỳ
  const handleAcademicYearChange = (nextAcademicYear: string) => {
    if (nextAcademicYear === selectedAcademicYear) return

    const termsInYear = semesterOptions.filter(
      (item) => item.academicYear === nextAcademicYear,
    )
    const nextSemester =
      termsInYear.find((item) => item.publicId === semester?.publicId) ??
      termsInYear[0]

    setUserSelectedYear(nextAcademicYear)
    setUserSelectedSemesterId(nextSemester?.publicId ?? null)
    setSubmitError(null)
    setModalOpen(false)
    setIsEditingPending(false)
    setEditingRegistration(null)
  }

  const handleSemesterChange = (nextSemesterPublicId: string) => {
    const matched = semesterOptions.find(
      (item) => item.publicId === nextSemesterPublicId,
    )
    if (matched?.academicYear) {
      setUserSelectedYear(matched.academicYear)
    }

    setUserSelectedSemesterId(nextSemesterPublicId)
    setSubmitError(null)
    setModalOpen(false)
    setIsEditingPending(false)
    setEditingRegistration(null)
  }

  // 15. Mở form tạo đơn mới hoặc chỉnh sửa đơn hiện tại
  const handlePrimaryAction = () => {
    if (!isCurrentSemester) {
      setSubmitError(
        'Bạn chỉ có thể đăng ký GVHD trong học kỳ hiện tại.',
      )
      return
    }

    if (
      isLoadingSemester ||
      isLoadingHistory ||
      isLoadingOverview
    ) {
      return
    }

    if (!semesterPublicId) {
      setSubmitError('Không tìm thấy học kỳ được chọn.')
      return
    }

    if (!isDeadlineOpen) {
      setSubmitError(
        'Hiện không nằm trong thời gian mở đăng ký giảng viên hướng dẫn.',
      )
      return
    }

    if (hasAssignedMentor) {
      return
    }

    if (isWaitingHODLock) {
      setSubmitError(
        'Đơn đăng ký của bạn đang chờ Trưởng bộ môn chốt danh sách.',
      )
      return
    }

    // Nếu đã có đơn PENDING thì mở form chỉnh sửa đơn đó
    if (pendingRegistration) {
      setEditingRegistration(pendingRegistration)
      setIsEditingPending(true)
      setSubmitError(null)
      setModalOpen(true)
      return
    }

    // Nếu đơn đã được giảng viên duyệt và đang chờ Trưởng bộ môn
    if (waitingApprovalRegistration) {
      setSubmitError(
        'Đơn đăng ký của bạn đang chờ Trưởng bộ môn xử lý.',
      )
      return
    }

    // Không còn đơn chưa được xử lý thì cho phép tạo đơn mới
    setIsEditingPending(false)
    setEditingRegistration(null)
    setSubmitError(null)
    setModalOpen(true)
  }

  // 16. Mở form chỉnh sửa đơn PENDING
  const handleEditRegistration = (
    request: AdvisorRegistrationResponse,
  ) => {
    if (!isCurrentSemester) {
      setSubmitError(
        'Bạn không thể chỉnh sửa đơn đăng ký của học kỳ cũ.',
      )
      return
    }

    if (!isDeadlineOpen) {
      setSubmitError(
        'Hiện không nằm trong thời gian mở đăng ký giảng viên hướng dẫn.',
      )
      return
    }

    if (request.status !== 'PENDING') {
      return
    }

    setEditingRegistration(request)
    setIsEditingPending(true)
    setSubmitError(null)
    setModalOpen(true)
  }

  // 17. Đóng modal
  const handleCloseModal = () => {
    if (isSubmitting) return

    setModalOpen(false)
    setIsEditingPending(false)
    setEditingRegistration(null)
    setSubmitError(null)
  }

  // 18. Gửi đơn đăng ký hoặc cập nhật đơn
  const handleFormSubmit = async (
    lecturer: AvailableAdvisor,
    topicVal: string,
  ) => {
    if (!isCurrentSemester) {
      setSubmitError(
        'Bạn chỉ có thể đăng ký hoặc chỉnh sửa trong học kỳ hiện tại.',
      )
      return
    }

    if (!semesterPublicId) {
      setSubmitError('Không tìm thấy học kỳ được chọn.')
      return
    }

    if (!isDeadlineOpen) {
      setSubmitError(
        'Hiện không nằm trong thời gian mở đăng ký giảng viên hướng dẫn.',
      )
      return
    }

    if (!lecturer.teacherPublicId) {
      setSubmitError('Không tìm thấy thông tin giảng viên hướng dẫn.')
      return
    }

    setSubmitError(null)

    // Tên đề tài không bắt buộc: chuỗi rỗng gửi null để xóa hoặc bỏ trống trên BE
    const normalizedTopic = topicVal.trim()

    try {
      if (isEditingPending && editingRegistration) {
        await updateMutation.mutateAsync({
          semesterPublicId,
          teacherPublicId: lecturer.teacherPublicId,
          topicName: normalizedTopic ? normalizedTopic : null,
        })
      } else {
        await submitMutation.mutateAsync({
          teacherPublicId: lecturer.teacherPublicId,
          topicName: normalizedTopic ? normalizedTopic : null,
        })
      }

      setModalOpen(false)
      setIsEditingPending(false)
      setEditingRegistration(null)
      setSubmitError(null)
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    }
  }

  // 19. Trạng thái tải dữ liệu ban đầu
  if (isLoadingSemester || isLoadingSemesters) {
    return (
      <div className="w-full space-y-5">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  // 20. Xử lý lỗi lấy dữ liệu học kỳ
  if (isSemesterError || isSemestersError) {
    return (
      <div className="w-full rounded-xl border border-rose-200 bg-rose-50 p-5">
        <p className="text-sm font-semibold text-rose-700">
          Không thể tải thông tin đăng ký.
        </p>

        <p className="text-xs text-rose-600 mt-2">
          {getErrorMessage(semesterError ?? semestersError)}
        </p>
      </div>
    )
  }

  // 21. Không có học kỳ nào
  if (!semester && semesterOptions.length === 0) {
    return (
      <div className="w-full rounded-xl border border-amber-200 bg-amber-50 p-5">
        <p className="text-sm font-semibold text-amber-700">
          Hiện tại chưa có học kỳ nào.
        </p>

        <p className="text-xs text-amber-600 mt-2">
          Vui lòng quay lại sau khi nhà trường thiết lập học kỳ.
        </p>
      </div>
    )
  }

  // 22. Lỗi khi tải overview
  if (isOverviewError) {
    return (
      <div className="w-full rounded-xl border border-rose-200 bg-rose-50 p-5">
        <p className="text-sm font-semibold text-rose-700">
          Không thể tải thông tin tổng quan của học kỳ.
        </p>

        <p className="text-xs text-rose-600 mt-2">
          {getErrorMessage(overviewError)}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full space-y-5">
      {/* Thông tin đăng ký và chọn năm học / học kỳ */}
      {isLoadingOverview ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : (
        <RegistrationOverviewCard
          currentRegistration={cardRegistration ?? null}
          mentor={mentor}
          topic={topic}
          deadlineText={deadlineText}
          countdownLabel={countdownLabel}
          deadlineStatus={deadlineStatus}
          hasAssignedMentor={hasAssignedMentor}
          isAssignmentLocked={isAssignmentLocked}
          isLatestRejected={isLatestRejected}
          isCurrentSemester={isCurrentSemester}
          isDeadlineOpen={isDeadlineOpen}
          academicYears={academicYears}
          selectedAcademicYear={selectedAcademicYear}
          termsOfYear={termsOfYear}
          selectedSemesterPublicId={selectedSemesterPublicId}
          onAcademicYearChange={handleAcademicYearChange}
          onSemesterChange={handleSemesterChange}
          onPrimaryAction={handlePrimaryAction}
        />
      )}

      {/* Thông báo lỗi khi tải lịch sử */}
      {isHistoryError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-700">
            Không thể tải lịch sử đăng ký: {getErrorMessage(historyError)}
          </p>
        </div>
      )}

      {/* Bảng lịch sử đăng ký */}
      {isLoadingHistory ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <RegistrationHistoryTable
          requests={requests}
          canEdit={canEditOrSubmit}
          editDisabledReason={editDisabledReason}
          onEdit={handleEditRegistration}
        />
      )}

      {/* Thông báo lỗi tạo hoặc cập nhật đơn */}
      {submitError && !modalOpen && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-700">{submitError}</p>
        </div>
      )}

      {/* Form đăng ký / chỉnh sửa */}
      <RegistrationFormModal
        open={modalOpen}
        isEditing={isEditingPending}
        lecturers={lecturers}
        isLoadingLecturers={isLoadingLecturers}
        isSubmitting={isSubmitting}
        submitError={submitError}
        initialLecturerId={
          isEditingPending
            ? editingRegistration?.teacherPublicId ?? null
            : null
        }
        initialLecturerName={
          isEditingPending
            ? editingRegistration?.teacherName ?? null
            : null
        }
        initialLecturerCode={
          isEditingPending
            ? editingRegistration?.teacherCode ?? null
            : null
        }
        initialTopic={
          isEditingPending
            ? editingRegistration?.topicName ?? ''
            : ''
        }
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
