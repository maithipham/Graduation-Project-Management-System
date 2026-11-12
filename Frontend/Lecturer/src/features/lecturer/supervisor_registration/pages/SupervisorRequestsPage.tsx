import { useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, Eye, Search } from 'lucide-react'
import {
  Button,
  Input,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui'
import { formatDate, parseDate } from '@/shared/utils'

import {
  ApproveSupervisorModal,
  RejectSupervisorModal,
  SupervisorDetailModal,
} from '../components/SupervisorRequestModals'
import {
  useLecturerCurrentSemester,
  useLecturerSemesters,
  useSupervisorDeadline,
  useSupervisorRequests,
} from '../hooks/useSupervisorRequests'
import type {
  RegistrationDeadline,
  SupervisorRequestItem,
} from '../types/supervisorRegistration.types'

const PAGE_SIZE = 15

function getRemainingTime(endDate: string): string {
  const end = parseDate(endDate)
  if (!end) return 'Không xác định thời hạn'

  const diff = end.getTime() - Date.now()
  if (diff <= 0) return 'Đã hết hạn'

  const totalHours = Math.floor(diff / (1000 * 60 * 60))
  if (totalHours < 24) {
    return `Còn ${Math.max(1, totalHours)} giờ`
  }

  const totalDays = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return `Còn ${totalDays} ngày`
}

function getDeadlineStatusText(deadline?: RegistrationDeadline): string {
  if (!deadline) return 'Chưa có thông tin thời hạn'

  switch (deadline.status) {
    case 'NOT_CONFIGURED':
      return 'Chưa có'
    case 'INACTIVE':
      return 'Thời hạn đang tạm khóa'
    case 'NOT_STARTED':
      return deadline.startDate
        ? `Mở từ ${formatDate(deadline.startDate, 'short')}`
        : 'Chưa đến thời gian đăng ký'
    case 'CLOSED':
      return 'Đã hết hạn xử lý đơn'
    case 'OPEN':
      return deadline.endDate
        ? getRemainingTime(deadline.endDate)
        : 'Đang mở đăng ký'
    default:
      return 'Không xác định'
  }
}

function getStatusLabel(request: SupervisorRequestItem): string {
  switch (request.apiStatus) {
    case 'TEACHER_APPROVED':
      return 'GV đã duyệt'
    case 'HOD_APPROVED':
      return 'TBM duyệt'
    case 'ASSIGNED_BY_HOD':
      return 'TBM phân công'
    case 'REJECTED':
      return 'Đã từ chối'
    case 'HOD_REJECTED':
      return 'TBM từ chối'
    default:
      switch (request.status) {
        case 'pending':
          return 'Chưa duyệt'
        case 'approved':
          return 'Đã duyệt'
        case 'rejected':
          return 'Đã từ chối'
        default:
          return 'Không xác định'
      }
  }
}

function getStatusClass(status: SupervisorRequestItem['status']): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-700'
    case 'approved':
      return 'bg-emerald-100 text-emerald-700'
    case 'rejected':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

export default function SupervisorRequestsPage() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [pickedSemesterPublicId, setPickedSemesterPublicId] = useState<
    string | undefined
  >()

  const {
    data: semesterList,
    isPending: semestersLoading,
    isError: semestersError,
    refetch: refetchSemesters,
  } = useLecturerSemesters()
  const currentSemesterQuery = useLecturerCurrentSemester()

  // Ghép thêm học kỳ hiện tại nếu chưa nằm trong trang học kỳ đầu tiên
  const semesters = useMemo(() => {
    const list = semesterList ?? []
    const cur = currentSemesterQuery.data
    return cur && !list.some((item) => item.publicId === cur.publicId)
      ? [cur, ...list]
      : list
  }, [semesterList, currentSemesterQuery.data])

  // Đợi kiểm tra học kỳ hiện tại xong mới fallback sang học kỳ mới nhất để tránh gọi API 2 lần
  const selectedSemesterPublicId =
    pickedSemesterPublicId ??
    currentSemesterQuery.data?.publicId ??
    (currentSemesterQuery.isPending ? '' : (semesters[0]?.publicId ?? ''))

  const selectedSemester =
    semesters.find((item) => item.publicId === selectedSemesterPublicId) ??
    currentSemesterQuery.data

  const academicYears = useMemo(
    () => [
      ...new Set(
        semesters.map((item) => item.academicYear).filter(Boolean),
      ),
    ],
    [semesters],
  )

  const termsOfYear = useMemo(
    () =>
      semesters.filter(
        (item) => item.academicYear === selectedSemester?.academicYear,
      ),
    [semesters, selectedSemester?.academicYear],
  )

  const semesterResolved = Boolean(selectedSemesterPublicId)
  const initialSemesterLoading =
    !semesterResolved && (semestersLoading || currentSemesterQuery.isPending)

  const deadlineQuery = useSupervisorDeadline(
    selectedSemesterPublicId || undefined,
  )
  const deadline = deadlineQuery.data
  const isDeadlineBlocked =
    Boolean(deadline) && deadline?.status !== 'OPEN'
  const canProcess = !deadlineQuery.isPending && !isDeadlineBlocked

  const {
    tabStatus,
    setTabStatus,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    counts,
    filtered,
    pageData,
    loading,
    isPlaceholderData,
    error,
    approveTarget,
    setApproveTarget,
    isApproving,
    rejectTarget,
    setRejectTarget,
    isRejecting,
    detailTargetId,
    setDetailTargetId,
    detailData,
    detailLoading,
    detailError,
    handleConfirmApprove,
    handleConfirmReject,
  } = useSupervisorRequests(selectedSemesterPublicId)

  const isActionPending = isApproving || isRejecting

  const handlePageChange = (nextPage: number) => {
    setCurrentPage(nextPage)
    scrollContainerRef.current?.scrollTo({ top: 0 })
  }

  const handleSemesterChange = (publicId: string) => {
    setPickedSemesterPublicId(publicId)
    setCurrentPage(1)
  }

  // Đổi năm học → chọn học kỳ mới nhất thuộc năm học đó
  const handleAcademicYearChange = (academicYear: string) => {
    const latestOfYear = semesters.find(
      (item) => item.academicYear === academicYear,
    )
    if (latestOfYear) {
      handleSemesterChange(latestOfYear.publicId)
    }
  }

  if (initialSemesterLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 flex-1 min-w-[200px]" />
            <Skeleton className="h-10 w-44" />
          </div>
          <Skeleton className="h-11 w-96" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (semestersError && semesters.length === 0) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 flex items-center justify-between gap-4">
        <span>Không thể tải danh sách học kỳ. Vui lòng thử lại.</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void refetchSemesters()}
        >
          Tải lại
        </Button>
      </div>
    )
  }

  if (!semesterResolved && semesters.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Hiện chưa có học kỳ nào trong hệ thống.
      </div>
    )
  }

  const tabs = [
    { key: 'pending' as const, label: 'Chưa duyệt', count: counts.pending },
    { key: 'approved' as const, label: 'Đã duyệt', count: counts.approved },
    { key: 'rejected' as const, label: 'Đã từ chối', count: counts.rejected },
    { key: '' as const, label: 'Tất cả', count: counts.all },
  ]

  const startIndex =
    filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const endIndex = Math.min(currentPage * PAGE_SIZE, filtered.length)

  const blockedReason = isDeadlineBlocked
    ? getDeadlineStatusText(deadline)
    : undefined

  return (
    <div className="w-full space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Thanh bộ lọc (dòng 1) và tabs trạng thái (dòng 2) */}
        <div className="border-b border-slate-200">
          {/* Dòng 1: Năm học, học kỳ, tìm kiếm và hạn đăng ký */}
          <div className="flex flex-col gap-2.5 p-4 lg:flex-row lg:items-center">
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Select
                aria-label="Chọn năm học"
                containerClassName="w-[140px]"
                value={selectedSemester?.academicYear ?? ''}
                onChange={(event) => handleAcademicYearChange(event.target.value)}
                disabled={academicYears.length === 0}
                className="h-10 border-slate-200 text-sm text-slate-700"
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
              </Select>

              <Select
                aria-label="Chọn học kỳ"
                containerClassName="w-[140px]"
                value={selectedSemesterPublicId}
                onChange={(event) => handleSemesterChange(event.target.value)}
                disabled={termsOfYear.length === 0 && semesters.length === 0}
                className="h-10 border-slate-200 text-sm text-slate-700"
              >
                {(selectedSemester?.academicYear ? termsOfYear : semesters).map(
                  (item) => (
                    <option key={item.publicId} value={item.publicId}>
                      {item.term || item.name}
                    </option>
                  ),
                )}
              </Select>
            </div>

            <div className="relative min-w-0 flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                type="text"
                aria-label="Tìm kiếm sinh viên"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tìm theo mã sinh viên, tên sinh viên..."
                className="h-10 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 focus-visible:bg-white"
              />
            </div>

            {/* Deadline đăng ký GVHD */}
            <div
              className={`flex min-h-10 shrink-0 flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
                isDeadlineBlocked
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
              }`}
            >
              <Clock size={16} />

              {deadlineQuery.isPending ? (
                <Skeleton className="h-4 w-32 bg-amber-200/70" />
              ) : deadlineQuery.isError ? (
                <span className="text-red-600">Không tải được thời hạn</span>
              ) : !deadline || deadline.status === 'NOT_CONFIGURED' ? (
                <span>{getDeadlineStatusText(deadline)}</span>
              ) : (
                <>
                  {deadline.endDate && (
                    <>
                      <span>Hạn: {formatDate(deadline.endDate, 'short')}</span>
                      <span
                        className={`h-4 w-px ${
                          isDeadlineBlocked ? 'bg-red-200' : 'bg-amber-300'
                        }`}
                      />
                    </>
                  )}
                  <span>{getDeadlineStatusText(deadline)}</span>
                </>
              )}
            </div>
          </div>

          {/* Dòng 2: Tabs trạng thái */}
          <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-2.5">
            <div className="inline-flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-100/90 p-1">
              {tabs.map((tab) => {
                const active = tabStatus === tab.key

                return (
                  <button
                    key={tab.key || 'all'}
                    type="button"
                    onClick={() => setTabStatus(tab.key)}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all cursor-pointer ${
                      active
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-white hover:text-blue-700'
                    }`}
                  >
                    <span>{tab.label}</span>

                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        active
                          ? 'bg-white text-blue-700'
                          : tab.key === 'pending' && tab.count > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200/80 text-slate-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Cảnh báo khi ngoài thời hạn xử lý đơn */}
        {isDeadlineBlocked && (
          <div className="border-b border-amber-200 bg-amber-50/70 px-5 py-2.5 text-xs font-medium text-amber-800">
            {getDeadlineStatusText(deadline)} — Hiện chỉ xem danh sách, không thể
            duyệt hoặc từ chối đơn đăng ký.
          </div>
        )}

        {/* Bảng dữ liệu */}
        <div ref={scrollContainerRef} className="w-full overflow-x-auto">
          <Table className="min-w-[1150px] border-collapse text-left">
            <TableHeader className="sticky top-0 z-10 bg-slate-50">
              <TableRow className="border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-500 hover:bg-slate-50">
                <TableHead className="h-auto w-16 px-5 py-4 text-center font-bold uppercase text-slate-500">
                  STT
                </TableHead>
                <TableHead className="h-auto w-[220px] px-5 py-4 font-bold uppercase text-slate-500">
                  Sinh viên
                </TableHead>
                <TableHead className="h-auto w-[190px] px-5 py-4 font-bold uppercase text-slate-500">
                  Bộ môn
                </TableHead>
                <TableHead className="h-auto px-5 py-4 font-bold uppercase text-slate-500">
                  Đề tài đăng ký
                </TableHead>
                <TableHead className="h-auto w-[180px] px-5 py-4 font-bold uppercase text-slate-500">
                  Ngày gửi đơn
                </TableHead>
                <TableHead className="h-auto w-[180px] px-5 py-4 font-bold uppercase text-slate-500">
                  Thời gian xử lý
                </TableHead>
                <TableHead className="h-auto w-[230px] px-5 py-4 text-center font-bold uppercase text-slate-500">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody
              className={`divide-y divide-slate-100 ${
                isPlaceholderData ? 'opacity-60 transition-opacity' : ''
              }`}
            >
              {loading ? (
                Array.from({ length: 5 }, (_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={7} className="px-5 py-4">
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="px-5 py-14 text-center text-sm text-red-600"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : pageData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-5 py-16 text-center">
                    <div className="text-sm font-medium text-slate-500">
                      Không tìm thấy đơn đăng ký nào.
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Thử thay đổi học kỳ, trạng thái hoặc từ khóa tìm kiếm.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                pageData.map((request, index) => (
                  <TableRow
                    key={request.id}
                    className="transition-colors hover:bg-blue-50/40"
                  >
                    <TableCell className="px-5 py-4 text-center text-sm text-slate-400">
                      {startIndex + index}
                    </TableCell>

                    <TableCell className="px-5 py-4">
                      <p className="text-sm font-bold text-slate-900">
                        {request.name}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-slate-500">
                        {request.mssv}
                      </p>
                    </TableCell>

                    <TableCell className="px-5 py-4 text-sm text-slate-600">
                      {request.major || '—'}
                    </TableCell>

                    <TableCell className="max-w-[400px] px-5 py-4">
                      <p
                        className="line-clamp-2 text-sm leading-6 text-slate-800"
                        title={
                          request.topic?.trim() ||
                          'Sinh viên chưa đăng ký tên đề tài'
                        }
                      >
                        {request.topic?.trim() ? (
                          request.topic
                        ) : (
                          <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                            Chưa có đề tài
                          </span>
                        )}
                      </p>
                    </TableCell>

                    <TableCell className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                      {request.submittedDate
                        ? formatDate(request.submittedDate, 'full')
                        : '—'}
                    </TableCell>

                    <TableCell className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                      {request.processedAt ? (
                        formatDate(request.processedAt, 'full')
                      ) : (
                        <span className="text-amber-600">Chưa xử lý</span>
                      )}
                    </TableCell>

                    <TableCell className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {request.status === 'pending' ? (
                          <>
                            <Button
                              type="button"
                              variant="success"
                              size="sm"
                              disabled={!canProcess || isActionPending}
                              title={blockedReason}
                              onClick={() => setApproveTarget(request)}
                            >
                              Duyệt
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              disabled={!canProcess || isActionPending}
                              title={blockedReason}
                              onClick={() => setRejectTarget(request)}
                            >
                              Từ chối
                            </Button>
                          </>
                        ) : (
                          <span
                            title={request.statusDescription}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClass(
                              request.status,
                            )}`}
                          >
                            {getStatusLabel(request)}
                          </span>
                        )}

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-blue-600"
                          aria-label={`Xem chi tiết đơn của ${request.name}`}
                          title="Xem chi tiết"
                          onClick={() => setDetailTargetId(request.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer phân trang */}
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Hiển thị{' '}
            <span className="font-semibold text-slate-800">
              {startIndex}–{endIndex}
            </span>{' '}
            trên{' '}
            <span className="font-semibold text-slate-800">
              {filtered.length}
            </span>{' '}
            đơn đăng ký
          </p>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={currentPage <= 1 || loading}
              onClick={() => handlePageChange(currentPage - 1)}
              aria-label="Trang trước"
            >
              <ChevronLeft size={18} />
            </Button>

            <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white">
              {currentPage}
            </span>

            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={currentPage >= totalPages || loading}
              onClick={() => handlePageChange(currentPage + 1)}
              aria-label="Trang sau"
            >
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Modal duyệt */}
      <ApproveSupervisorModal
        item={approveTarget}
        isPending={isApproving}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleConfirmApprove}
      />

      {/* Modal từ chối */}
      <RejectSupervisorModal
        item={rejectTarget}
        isPending={isRejecting}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleConfirmReject}
      />

      {/* Modal chi tiết đơn đăng ký */}
      <SupervisorDetailModal
        open={Boolean(detailTargetId)}
        data={detailData}
        isPending={detailLoading}
        error={detailError}
        canProcess={canProcess}
        isActionPending={isActionPending}
        onClose={() => setDetailTargetId(undefined)}
        onApprove={(detail) => {
          setDetailTargetId(undefined)
          setApproveTarget({
            id: detail.registrationPublicId,
            mssv: detail.studentCode,
            name: detail.studentName,
            major: detail.majorName ?? '',
            topic: detail.topicName ?? '',
            submittedDate: detail.submittedAt ?? '',
            processedAt: detail.processedAt ?? undefined,
            status: 'pending',
            apiStatus: detail.status,
            statusDescription: detail.statusDescription,
          })
        }}
        onReject={(detail) => {
          setDetailTargetId(undefined)
          setRejectTarget({
            id: detail.registrationPublicId,
            mssv: detail.studentCode,
            name: detail.studentName,
            major: detail.majorName ?? '',
            topic: detail.topicName ?? '',
            submittedDate: detail.submittedAt ?? '',
            processedAt: detail.processedAt ?? undefined,
            status: 'pending',
            apiStatus: detail.status,
            statusDescription: detail.statusDescription,
          })
        }}
      />
    </div>
  )
}
