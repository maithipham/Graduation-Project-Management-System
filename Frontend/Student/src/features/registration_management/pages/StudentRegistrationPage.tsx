import { useEffect, useState } from 'react'
import RegistrationFormModal from '../components/RegistrationFormModal'
import { RegistrationHistoryTable } from '../components/RegistrationHistoryTable'
import { RegistrationOverviewCard } from '../components/RegistrationOverviewCard'
import {
  useCurrentSemester,
  useSemesters,
  useRegistrationOverview,
  useRegistrationHistory,
  useAvailableAdvisors,
  useSubmitRegistration,
  useUpdateRegistration,
} from '../hooks'
import type {
  AdvisorRegistrationResponse,
  AvailableAdvisor,
} from '../types/registration.types'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Có lỗi xảy ra. Vui lòng thử lại.'
}

function syncTopicToStorage(nextTopic: string | null) {
  try {
    if (nextTopic === null) {
      localStorage.removeItem('student_topic')
    } else {
      localStorage.setItem('student_topic', nextTopic)
    }
  } catch {
    // Bỏ qua lỗi localStorage
  }
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
  isActive: boolean,
  deadlineStatus: string | null,
): string {
  if (!isActive) {
    return 'Đã khóa'
  }

  if (!startDate || !endDate) {
    return 'Chưa thiết lập'
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

  if (now < start) {
    const diffMs = start - now
    const totalHours = Math.ceil(diffMs / (1000 * 60 * 60))
    const days = Math.floor(totalHours / 24)
    const hours = totalHours % 24

    if (days > 0) {
      return `Mở sau ${days} ngày ${hours} giờ`
    }

    return `Mở sau ${Math.max(1, hours)} giờ`
  }

  const diffMs = end - now
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

  // 3. Học kỳ đang được chọn
  const [selectedSemesterPublicId, setSelectedSemesterPublicId] =
    useState('')

  // Mặc định chọn học kỳ hiện tại
  useEffect(() => {
    if (!semester?.publicId) return

    setSelectedSemesterPublicId(semester.publicId)
  }, [semester?.publicId])

  // Nếu không có học kỳ hiện tại thì chọn học kỳ đầu tiên
  useEffect(() => {
    if (
      !selectedSemesterPublicId &&
      semesters.length > 0 &&
      !semester?.publicId
    ) {
      setSelectedSemesterPublicId(semesters[0].publicId)
    }
  }, [semesters, selectedSemesterPublicId, semester?.publicId])

  const semesterPublicId = selectedSemesterPublicId || undefined

  // Chỉ học kỳ hiện tại mới được phép đăng ký hoặc chỉnh sửa
  const isCurrentSemester =
    !!semester?.publicId &&
    semesterPublicId === semester.publicId

  // 4. Lấy thông tin tổng quan theo học kỳ được chọn
  const {
    data: registrationOverview,
    isLoading: isLoadingOverview,
    isError: isOverviewError,
    error: overviewError,
  } = useRegistrationOverview(semesterPublicId)

  // 5. Lấy lịch sử đăng ký
  const {
    data: requests = [],
    isLoading: isLoadingHistory,
    isError: isHistoryError,
    error: historyError,
  } = useRegistrationHistory(semesterPublicId)

  // 6. Lấy danh sách giảng viên còn chỉ tiêu
  const {
    data: lecturers = [],
    isLoading: isLoadingLecturers,
  } = useAvailableAdvisors(
    isCurrentSemester ? semesterPublicId : undefined,
  )

  // 7. Mutation đăng ký và cập nhật
  const submitMutation = useSubmitRegistration()
  const updateMutation = useUpdateRegistration()

  // 8. State giao diện
  const [modalOpen, setModalOpen] = useState(false)
  const [isEditingPending, setIsEditingPending] = useState(false)

  const [editingRegistration, setEditingRegistration] =
    useState<AdvisorRegistrationResponse | null>(null)

  const [submitError, setSubmitError] = useState<string | null>(null)

  const isSubmitting =
    submitMutation.isPending || updateMutation.isPending

  // 9. Xác định trạng thái đơn theo học kỳ đang chọn
  const pendingRegistration = requests.find(
    (request) => request.status === 'PENDING',
  )

  const waitingApprovalRegistration = requests.find(
    (request) => request.status === 'TEACHER_APPROVED',
  )

  const assignedRegistration = requests.find(
    (request) =>
      request.status === 'HOD_APPROVED' ||
      request.status === 'ASSIGNED_BY_HOD',
  )

  const hasAssignedMentor =
    !!registrationOverview?.mentorName ||
    !!assignedRegistration

  const isPending = !!pendingRegistration
  const isWaitingApproval = !!waitingApprovalRegistration

  const isLatestRejected =
    requests.length > 0 &&
    requests[0].status === 'REJECTED' &&
    !isPending &&
    !isWaitingApproval &&
    !hasAssignedMentor

  const cardRegistration =
    pendingRegistration ??
    waitingApprovalRegistration ??
    assignedRegistration ??
    (isLatestRejected ? requests[0] : null)

  // 10. Thông tin GVHD và đề tài chính thức
  const mentor = registrationOverview?.mentorName ?? ''
  const topic = registrationOverview?.topicName ?? ''

  // 11. Thông tin deadline
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

  // 12. Xử lý khi đổi học kỳ
  const handleSemesterChange = (nextSemesterPublicId: string) => {
    setSelectedSemesterPublicId(nextSemesterPublicId)
    setSubmitError(null)
    setModalOpen(false)
    setIsEditingPending(false)
    setEditingRegistration(null)
  }

  // 13. Mở form tạo đơn mới
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

    if (hasAssignedMentor) {
      return
    }

    const hasUnresolvedRegistration = requests.some(
      (request) =>
        request.status === 'PENDING' ||
        request.status === 'TEACHER_APPROVED',
    )

    if (hasUnresolvedRegistration) {
      setSubmitError(
        'Bạn đã có đơn đăng ký chưa bị từ chối. Vui lòng kiểm tra đơn trong bảng lịch sử.',
      )
      return
    }

    setIsEditingPending(false)
    setEditingRegistration(null)
    setSubmitError(null)
    setModalOpen(true)
  }

  // 14. Mở form chỉnh sửa đơn PENDING
  const handleEditRegistration = (
    request: AdvisorRegistrationResponse,
  ) => {
    if (!isCurrentSemester) {
      setSubmitError(
        'Bạn không thể chỉnh sửa đơn đăng ký của học kỳ cũ.',
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

  // 15. Đóng modal
  const handleCloseModal = () => {
    if (isSubmitting) return

    setModalOpen(false)
    setIsEditingPending(false)
    setEditingRegistration(null)
    setSubmitError(null)
  }

  // 16. Gửi đơn đăng ký hoặc cập nhật đơn
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

    // Lấy teacherPublicId thay vì semesterAdvisorPublicId
    if (!lecturer.teacherPublicId) {
      setSubmitError('Không tìm thấy thông tin giảng viên hướng dẫn.')
      return
    }

    setSubmitError(null)

    // Tên đề tài không bắt buộc
    const normalizedTopic = topicVal.trim()

    try {
      if (isEditingPending && editingRegistration) {
        await updateMutation.mutateAsync({
          semesterPublicId,
          teacherPublicId: lecturer.teacherPublicId,
          topicName: normalizedTopic || undefined,
        })
      } else {
        await submitMutation.mutateAsync({
          teacherPublicId: lecturer.teacherPublicId,
          topicName: normalizedTopic || undefined,
        })
      }

      syncTopicToStorage(normalizedTopic || null)

      setModalOpen(false)
      setIsEditingPending(false)
      setEditingRegistration(null)
      setSubmitError(null)
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    }
  }

  // 17. Trạng thái tải dữ liệu ban đầu
  if (isLoadingSemester || isLoadingSemesters) {
    return (
      <div className="w-full flex items-center justify-center py-16">
        <p className="text-sm text-slate-500">
          Đang tải thông tin đăng ký...
        </p>
      </div>
    )
  }

  // 18. Xử lý lỗi lấy dữ liệu học kỳ
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

  // 19. Không có học kỳ nào
  if (!semester && semesters.length === 0) {
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

  // 20. Lỗi khi tải overview
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
      {/* Thông tin đăng ký và chọn học kỳ */}
      <RegistrationOverviewCard
        currentRegistration={cardRegistration ?? null}
        mentor={mentor}
        topic={topic}
        deadlineText={deadlineText}
        countdownLabel={countdownLabel}
        hasAssignedMentor={hasAssignedMentor}
        isLatestRejected={isLatestRejected}
        semesters={semesters}
        selectedSemesterPublicId={selectedSemesterPublicId}
        onSemesterChange={handleSemesterChange}
        onPrimaryAction={handlePrimaryAction}
      />

      {/* Thông báo khi đang xem học kỳ cũ */}
      {!isCurrentSemester && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm text-blue-700">
            Bạn đang xem dữ liệu của học kỳ trước. Chức năng tạo và chỉnh sửa
            đơn đăng ký chỉ khả dụng trong học kỳ hiện tại.
          </p>
        </div>
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
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Đang tải lịch sử đăng ký...
          </p>
        </div>
      ) : (
        <RegistrationHistoryTable
          requests={requests}
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