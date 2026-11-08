
import { useEffect, useRef, useState } from 'react'

import { Search, Clock, ChevronLeft, ChevronRight } from 'lucide-react'

import { semesterService } from '@/shared/services/semester.service'
import type { SemesterResponse } from '@/shared/types/semester.types'

import { supervisorDeadlineService } from '../services/supervisorDeadline.service'
import type { RegistrationDeadline } from '../services/supervisorDeadline.service'

import { useSupervisorRequests } from '../hooks/useSupervisorRequests'

import {
  ApproveSupervisorModal,
  RejectSupervisorModal,
} from '../components/SupervisorRequestModals'

const PAGE_SIZE = 15

export default function SupervisorRequestsPage() {
  const [semesters, setSemesters] = useState<SemesterResponse[]>([])
  const [selectedSemesterPublicId, setSelectedSemesterPublicId] = useState('')
  const [semesterLoading, setSemesterLoading] = useState(true)
  const [semesterError, setSemesterError] = useState<string | null>(null)

  // Deadline đăng ký GVHD lấy từ Backend
  const [deadline, setDeadline] = useState<RegistrationDeadline | null>(null)
  const [deadlineLoading, setDeadlineLoading] = useState(false)
  const [deadlineError, setDeadlineError] = useState<string | null>(null)

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Lấy danh sách học kỳ và xác định học kỳ mặc định
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        setSemesterLoading(true)
        setSemesterError(null)

        const [semesterList, currentSemester] = await Promise.all([
          semesterService.getAllSemesters(),
          semesterService.getCurrentSemester(),
        ])

        setSemesters(semesterList)

        // Mặc định chọn học kỳ hiện tại
        const currentSemesterExists = semesterList.some(
          (item) => item.publicId === currentSemester.publicId,
        )

        if (currentSemesterExists) {
          setSelectedSemesterPublicId(currentSemester.publicId)
        } else if (semesterList.length > 0) {
          setSelectedSemesterPublicId(semesterList[0].publicId)
        } else {
          setSemesterError('Hiện chưa có học kỳ nào.')
        }
      } catch (error) {
        console.error('Không thể tải danh sách học kỳ:', error)
        setSemesterError('Không thể tải danh sách học kỳ.')
      } finally {
        setSemesterLoading(false)
      }
    }

    fetchSemesters()
  }, [])

  // Lấy deadline đăng ký GVHD theo học kỳ đang chọn
  useEffect(() => {
    if (!selectedSemesterPublicId) {
      setDeadline(null)
      setDeadlineError(null)
      setDeadlineLoading(false)
      return
    }

    let isMounted = true

    const fetchDeadline = async () => {
      try {
        setDeadlineLoading(true)
        setDeadlineError(null)
        setDeadline(null)

        const result =
          await supervisorDeadlineService.getRegistrationDeadline(
            selectedSemesterPublicId,
          )

        if (isMounted) {
          setDeadline(result)
        }
      } catch (error) {
        console.error('Không thể tải deadline đăng ký GVHD:', error)

        if (isMounted) {
          setDeadline(null)
          setDeadlineError('Không thể tải thông tin deadline.')
        }
      } finally {
        if (isMounted) {
          setDeadlineLoading(false)
        }
      }
    }

    fetchDeadline()

    return () => {
      isMounted = false
    }
  }, [selectedSemesterPublicId])

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
    error,
    approveTarget,
    setApproveTarget,
    rejectTarget,
    setRejectTarget,
    handleConfirmApprove,
    handleConfirmReject,
  } = useSupervisorRequests(selectedSemesterPublicId)

  // Cuộn bảng về đầu khi chuyển trang
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }, [currentPage])

  // Định dạng ngày và giờ
  const formatDateTime = (value?: string | null) => {
    if (!value) return '—'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return value
    }

    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  // Định dạng ngày deadline
  const formatDeadlineDate = (value?: string | null) => {
    if (!value) return '—'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return value
    }

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // Tính thời gian còn lại đến hạn đăng ký
  const getRemainingTime = (endDate: string) => {
    const now = new Date()
    const end = new Date(endDate)

    if (Number.isNaN(end.getTime())) {
      return 'Không xác định thời hạn'
    }

    const diff = end.getTime() - now.getTime()

    if (diff <= 0) {
      return 'Đã hết hạn'
    }

    const totalDays = Math.ceil(diff / (1000 * 60 * 60 * 24))

    if (totalDays === 1) {
      return 'Còn 1 ngày'
    }

    return `Còn ${totalDays} ngày`
  }

  // Trạng thái deadline do Backend trả về
  const getDeadlineStatus = () => {
    if (!deadline) return 'Chưa có thông tin deadline'

    switch (deadline.status) {
      case 'NOT_CONFIGURED':
        return 'Chưa cấu hình deadline'

      case 'INACTIVE':
        return 'Deadline đã bị vô hiệu hóa'

      case 'NOT_STARTED':
        return 'Chưa đến thời gian đăng ký'

      case 'CLOSED':
        return 'Đã đóng đăng ký'

      case 'OPEN':
        return deadline.endDate
          ? getRemainingTime(deadline.endDate)
          : 'Đang mở đăng ký'

      default:
        return 'Không xác định'
    }
  }

  // Hiển thị loading khi tải học kỳ
  if (semesterLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  // Hiển thị lỗi nếu không lấy được học kỳ
  if (semesterError || semesters.length === 0) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {semesterError || 'Không có học kỳ hiện tại.'}

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="ml-3 font-semibold underline"
        >
          Tải lại
        </button>
      </div>
    )
  }

  const tabs = [
    { key: 'pending' as const, label: 'Chưa duyệt', count: counts.pending },
    { key: 'approved' as const, label: 'Đã duyệt', count: counts.approved },
    { key: 'rejected' as const, label: 'Đã từ chối', count: counts.rejected },
    { key: '' as const, label: 'Tất cả', count: counts.all },
  ]

  // Chuyển trạng thái thành nội dung hiển thị
  const getStatusLabel = (status: string) => {
    switch (status) {
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

  // CSS theo trạng thái
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-700'
      case 'approved':
        return 'bg-emerald-100 text-emerald-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const startIndex =
    filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1

  const endIndex = Math.min(currentPage * PAGE_SIZE, filtered.length)

  return (
    <div className="w-full space-y-4">
      {/* Thanh bộ lọc */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 xl:flex-row xl:items-center xl:justify-between">
          {/* Tabs trạng thái */}
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => {
              const active = tabStatus === tab.key

              return (
                <button
                  key={tab.key || 'all'}
                  type="button"
                  onClick={() => {
                    setTabStatus(tab.key)
                    setCurrentPage(1)
                  }}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-slate-600 hover:text-blue-600'
                  }`}
                >
                  {tab.label}

                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      active
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Tìm kiếm, chọn học kỳ và deadline */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* Chọn học kỳ */}
            <div className="min-w-[220px]">
              <select
                value={selectedSemesterPublicId}
                onChange={(event) => {
                  setSelectedSemesterPublicId(event.target.value)
                  setCurrentPage(1)
                }}
                disabled={semesterLoading || semesters.length === 0}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                {semesters.length === 0 ? (
                  <option value="">Chưa có học kỳ</option>
                ) : (
                  semesters.map((item) => (
                    <option key={item.publicId} value={item.publicId}>
                      {item.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Tìm kiếm */}
            <div className="relative min-w-0 flex-1 xl:w-[350px]">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Tìm theo mã sinh viên, tên sinh viên,..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Deadline đăng ký GVHD */}
            <div className="flex min-h-10 shrink-0 flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
              <Clock size={16} />

              {deadlineLoading ? (
                <span>Đang tải deadline...</span>
              ) : deadlineError ? (
                <span className="text-red-600">{deadlineError}</span>
              ) : deadline?.status === 'NOT_CONFIGURED' || !deadline ? (
                <span>Chưa cấu hình deadline</span>
              ) : (
                <>
                  <span>
                    Hạn: {formatDeadlineDate(deadline.endDate)}
                  </span>

                  <span className="h-4 w-px bg-amber-300" />

                  <span
                    className={
                      deadline.status === 'CLOSED' ||
                      deadline.status === 'INACTIVE'
                        ? 'text-red-600'
                        : 'text-amber-800'
                    }
                  >
                    {getDeadlineStatus()}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Thông báo lỗi danh sách đơn */}
        {error && (
          <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Bảng dữ liệu */}
        <div
          ref={scrollContainerRef}
          className="w-full overflow-x-auto"
        >
          <table className="w-full min-w-[1150px] border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="w-16 px-5 py-4 text-center">STT</th>

                <th className="w-[220px] px-5 py-4">
                  Sinh viên
                </th>

                <th className="w-[190px] px-5 py-4">
                  Bộ môn
                </th>

                <th className="px-5 py-4">
                  Đề tài đăng ký
                </th>

                <th className="w-[180px] px-5 py-4">
                  Ngày gửi đơn
                </th>

                <th className="w-[180px] px-5 py-4">
                  Thời gian xử lý
                </th>

                <th className="w-[200px] px-5 py-4 text-center">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

                      <span className="text-sm text-slate-500">
                        Đang tải danh sách yêu cầu...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : pageData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="text-sm font-medium text-slate-500">
                      Không tìm thấy đơn đăng ký nào.
                    </div>

                    <p className="mt-1 text-xs text-slate-400">
                      Thử thay đổi trạng thái hoặc từ khóa tìm kiếm.
                    </p>
                  </td>
                </tr>
              ) : (
                pageData.map((request, index) => (
                  <tr
                    key={request.id}
                    className="transition-colors hover:bg-blue-50/40"
                  >
                    <td className="px-5 py-5 text-center text-sm text-slate-400">
                      {startIndex + index}
                    </td>

                    <td className="px-5 py-5">
                      <p className="text-sm font-bold text-slate-900">
                        {request.name}
                      </p>

                      <p className="mt-1 font-mono text-xs text-slate-500">
                        {request.mssv}
                      </p>
                    </td>

                    <td className="px-5 py-5 text-sm text-slate-600">
                      {request.major || '—'}
                    </td>

                    <td className="max-w-[400px] px-5 py-5">
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
                    </td>

                    {/* Ngày gửi đơn */}
                    <td className="whitespace-nowrap px-5 py-5 text-sm text-slate-600">
                      {formatDateTime(request.submittedDate)}
                    </td>

                    {/* Thời gian xử lý */}
                    <td className="whitespace-nowrap px-5 py-5 text-sm text-slate-600">
                      {request.processedAt ? (
                        formatDateTime(request.processedAt)
                      ) : (
                        <span className="text-amber-600">
                          Chưa xử lý
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-5">
                      <div className="flex items-center justify-center gap-2">
                        {request.status === 'pending' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setApproveTarget(request)}
                              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 active:scale-95"
                            >
                              Duyệt
                            </button>

                            <button
                              type="button"
                              onClick={() => setRejectTarget(request)}
                              className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 active:scale-95"
                            >
                              Từ chối
                            </button>
                          </>
                        ) : (
                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClass(
                              request.status,
                            )}`}
                          >
                            {getStatusLabel(request.status)}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Trang trước"
            >
              <ChevronLeft size={18} />
            </button>

            <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white">
              {currentPage}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Trang sau"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal duyệt */}
      <ApproveSupervisorModal
        item={approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleConfirmApprove}
      />

      {/* Modal từ chối */}
      <RejectSupervisorModal
        item={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleConfirmReject}
      />
    </div>
  )
}
