import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  History,
  Inbox,
  Search,
} from 'lucide-react'
import { Button, Select, Skeleton } from '@/shared/components/ui'
import { cn, formatDate } from '@/shared/utils'
import {
  FinalReportReviewModal,
  ReportClassroomPreviewModal,
  ReportHistoryModal,
} from '../components/ReportCheckModals'
import {
  useReportCheck,
  useReportCheckCurrentSemester,
  useReportCheckSemesters,
} from '../hooks/useReportCheck'
import {
  canReviewFinalReport,
  getReviewBlockedReason,
  isSafeReportFileUrl,
} from '../services/reportCheck.service'
import type { ReportCheckItem, ReportTabStatus } from '../types/reportCheck.types'

export default function ReportCheckPage() {
  const [pickedSemesterPublicId, setPickedSemesterPublicId] = useState<
    string | undefined
  >()

  const {
    data: semesterList,
    isPending: semestersLoading,
    isError: semestersError,
    refetch: refetchSemesters,
  } = useReportCheckSemesters()
  const currentSemesterQuery = useReportCheckCurrentSemester()

  const semesters = useMemo(() => {
    const list = semesterList ?? []
    const cur = currentSemesterQuery.data
    return cur && !list.some((item) => item.publicId === cur.publicId)
      ? [cur, ...list]
      : list
  }, [semesterList, currentSemesterQuery.data])

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

  const {
    reports,
    pagedReports,
    counts,
    isLoading,
    isError,
    refetch,
    deadlineSnapshot,
    deadlineInfo,
    isDeadlineLoading,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    pageSize,
    setPageSize,
    currentPage,
    totalPages,
    startIdx,
    endIdx,
    totalItems,
    handlePageChange,

    // Modals
    reviewTarget,
    setReviewTarget,
    historyTarget,
    setHistoryTarget,
    previewTarget,
    setPreviewTarget,

    // Actions
    isReviewPending,
    handleSubmitReview,
    handleDownloadReport,
  } = useReportCheck(selectedSemesterPublicId || undefined, semesterResolved)

  const handleAcademicYearChange = (academicYear: string) => {
    const latestOfYear = semesters.find(
      (item) => item.academicYear === academicYear,
    )
    if (latestOfYear) {
      setPickedSemesterPublicId(latestOfYear.publicId)
    }
  }

  if (initialSemesterLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-10 w-96 rounded-xl" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-36 rounded-xl" />
            <Skeleton className="h-10 w-36 rounded-xl" />
            <Skeleton className="h-10 w-64 rounded-xl" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          {Array.from({ length: 5 }, (_, idx) => (
            <Skeleton key={idx} className="h-12 w-full" />
          ))}
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

  const tabs: Array<{
    status: ReportTabStatus
    label: string
    count: number
    id: string
    badgeId: string
  }> = [
    {
      status: 'pending',
      label: 'Chưa duyệt',
      count: counts.pending,
      id: 'btnTabPending',
      badgeId: 'tabCountPending',
    },
    {
      status: 'rejected',
      label: 'Yêu cầu sửa / Không đạt',
      count: counts.rejected,
      id: 'btnTabRejected',
      badgeId: 'tabCountRejected',
    },
    {
      status: 'not_submitted',
      label: 'Chưa nộp',
      count: counts.notSubmitted,
      id: 'btnTabNotSubmitted',
      badgeId: 'tabCountNotSubmitted',
    },
    {
      status: 'approved',
      label: 'Đã duyệt',
      count: counts.approved,
      id: 'btnTabApproved',
      badgeId: 'tabCountApproved',
    },
    {
      status: '',
      label: 'Tất cả',
      count: counts.all,
      id: 'btnTabAll',
      badgeId: 'tabCountAll',
    },
  ]

  const deadlineBadgeClass = deadlineInfo.isExpired
    ? 'bg-rose-50 border-rose-200/90 text-rose-800'
    : deadlineInfo.isUnconfigured ||
        deadlineSnapshot?.deadlineStatus === 'NOT_STARTED'
      ? 'bg-slate-100 border-slate-200 text-slate-700'
      : 'bg-amber-50 border-amber-200/80 text-amber-800'

  const deadlineIconClass = deadlineInfo.isExpired
    ? 'text-rose-600'
    : deadlineInfo.isUnconfigured ||
        deadlineSnapshot?.deadlineStatus === 'NOT_STARTED'
      ? 'text-slate-500'
      : 'text-amber-600'

  return (
    <div
      className="flex-1 min-h-0 w-full flex flex-col overflow-hidden"
      style={{
        fontFamily:
          '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Tabs, Bộ lọc Học kỳ, Tìm kiếm & Hạn thẩm định */}
      <div className="flex items-center justify-between gap-3 shrink-0 flex-wrap mb-3">
        {/* 1. Tabs trạng thái */}
        <div
          className="h-10 bg-[#E2E8F0] p-1 rounded-xl flex items-center gap-1 text-[13px] font-semibold shadow-2xs border border-slate-300/70 shrink-0 overflow-x-auto max-w-full"
          id="statusTabs"
        >
          {tabs.map((tab) => {
            const isActive = filterStatus === tab.status
            return (
              <button
                key={tab.status}
                type="button"
                data-status={tab.status}
                id={tab.id}
                onClick={() => setFilterStatus(tab.status)}
                className={cn(
                  'tab-btn h-[32px] px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap',
                  isActive
                    ? 'active bg-white text-[#1565C0] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 font-medium',
                )}
              >
                <span>{tab.label}</span>
                <span
                  id={tab.badgeId}
                  className={cn(
                    'tab-badge rounded-full text-[11px] font-bold',
                    isActive
                      ? 'px-2 py-0.5 bg-[#E3F2FD] text-[#1565C0]'
                      : 'px-1.5 py-0.5 text-slate-500 font-semibold',
                  )}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* 2. Chọn năm học / học kỳ, ô tìm kiếm & hạn hoàn thành */}
        <div className="flex items-center gap-2.5 flex-1 justify-end flex-wrap">
          <Select
            aria-label="Chọn năm học"
            containerClassName="w-[130px]"
            value={selectedSemester?.academicYear ?? ''}
            onChange={(e) => handleAcademicYearChange(e.target.value)}
            disabled={academicYears.length === 0}
            className="h-10 border-slate-200/90 text-[13px] font-medium text-slate-700 bg-white rounded-xl"
          >
            {academicYears.map((year) => (
              <option key={year} value={year}>
                {year.replace('-', '–')}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Chọn học kỳ"
            containerClassName="w-[130px]"
            value={selectedSemesterPublicId}
            onChange={(e) => setPickedSemesterPublicId(e.target.value)}
            disabled={termsOfYear.length === 0 && semesters.length === 0}
            className="h-10 border-slate-200/90 text-[13px] font-medium text-slate-700 bg-white rounded-xl"
          >
            {(selectedSemester?.academicYear ? termsOfYear : semesters).map(
              (item) => (
                <option key={item.publicId} value={item.publicId}>
                  {item.term || item.name}
                </option>
              ),
            )}
          </Select>

          <div className="flex items-center gap-2 h-10 w-full sm:w-64 px-3.5 bg-white border border-slate-200/90 rounded-xl focus-within:border-[#1565C0] focus-within:ring-2 focus-within:ring-blue-100 transition shadow-2xs">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              id="searchInput"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã SV, tên hoặc đề tài..."
              className="w-full bg-transparent outline-none text-[13px] text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Hạn nộp / thẩm định */}
          <div
            className={cn(
              'inline-flex items-center gap-1.5 min-h-10 px-3.5 py-1.5 rounded-xl border text-[12px] font-semibold shrink-0 shadow-2xs',
              deadlineBadgeClass,
            )}
          >
            <Clock className={cn('w-3.5 h-3.5 shrink-0', deadlineIconClass)} />
            {isDeadlineLoading ? (
              <Skeleton className="h-4 w-32 bg-amber-200/70" />
            ) : (
              <span>
                Hạn báo cáo:{' '}
                <b className="font-bold">{deadlineInfo.text}</b>
                {deadlineInfo.badgeText &&
                  deadlineSnapshot?.deadlineStatus === 'OPEN' && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10.5px] font-bold">
                      {deadlineInfo.badgeText}
                    </span>
                  )}
                {deadlineInfo.badgeText &&
                  deadlineSnapshot?.deadlineStatus === 'NOT_STARTED' && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10.5px] font-bold">
                      {deadlineInfo.badgeText}
                    </span>
                  )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Card: Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto" id="tableScrollContainer">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead
              id="tableHead"
              className="sticky top-0 z-10 bg-slate-50 text-slate-600 text-[11.5px] font-bold uppercase tracking-wider border-b border-slate-200 shadow-2xs whitespace-nowrap"
            >
              <tr>
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4 min-w-[220px]">Sinh viên & Đề tài</th>
                <th className="py-3 px-4 min-w-[220px]">File báo cáo đồ án</th>
                <th className="py-3 px-4 min-w-[220px]">
                  Trùng lặp & Phiếu tiến độ
                </th>
                <th className="py-3 px-4 w-40 text-center">Trạng thái</th>
                <th className="py-3 px-4 min-w-[180px] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody id="tableBody" className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                Array.from({ length: 5 }, (_, idx) => (
                  <tr key={idx}>
                    {Array.from({ length: 6 }, (_, colIdx) => (
                      <td key={colIdx} className="py-4 px-4">
                        <Skeleton className="h-5 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <p className="text-sm font-semibold text-rose-700">
                      Không tải được danh sách báo cáo từ máy chủ.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void refetch()}
                      className="mt-3"
                    >
                      Thử lại
                    </Button>
                  </td>
                </tr>
              ) : pagedReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <Inbox className="w-7 h-7" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        {reports.length === 0
                          ? 'Chưa có sinh viên hướng dẫn ở giai đoạn báo cáo trong học kỳ này'
                          : 'Không tìm thấy báo cáo đồ án phù hợp'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {reports.length === 0
                          ? 'Danh sách chỉ hiển thị các đề tài đã hoàn thành duyệt đề cương.'
                          : 'Thử chọn tab trạng thái khác hoặc nhập từ khóa tìm kiếm mới.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedReports.map((item: ReportCheckItem, idx: number) => {
                  const itemIndex = startIdx + idx
                  const isReviewable = canReviewFinalReport(item)
                  const blockedReason = getReviewBlockedReason(item)

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* STT */}
                      <td className="py-3.5 px-4 text-center font-medium text-slate-400 text-xs">
                        {itemIndex}
                      </td>

                      {/* Sinh viên & Đề tài */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 group-hover:text-[#1565C0] transition-colors">
                            {item.name}
                          </span>
                          {!item.canReview && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10.5px] font-semibold">
                              Đồng hướng dẫn (Chỉ xem)
                            </span>
                          )}
                          {item.topicStatus === 'DISQUALIFIED' && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10.5px] font-semibold">
                              Đình chỉ
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {item.mssv}
                        </div>
                        <div
                          className="text-slate-700 text-[12px] font-medium line-clamp-1 mt-1"
                          title={item.topic}
                        >
                          {item.topic}
                        </div>
                      </td>

                      {/* File báo cáo đồ án */}
                      <td className="py-3.5 px-4">
                        {item.publicId && item.reportFileName ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setPreviewTarget(item)}
                                className="inline-flex items-center gap-1.5 text-[#1565C0] hover:text-[#0D47A1] font-bold text-[12.5px] group/file cursor-pointer text-left"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400 group-hover/file:text-[#1565C0] shrink-0 transition-colors" />
                                <span className="line-clamp-1 group-hover/file:underline">
                                  {item.reportFileName}
                                </span>
                              </button>
                              {isSafeReportFileUrl(item.reportFileUrl) && (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadReport(item)}
                                  className="p-1 text-slate-400 hover:text-[#1565C0] rounded cursor-pointer shrink-0"
                                  title="Tải xuống báo cáo"
                                  aria-label="Tải xuống báo cáo"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              {item.reportSubmittedAt && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 shrink-0" />
                                  <span>{formatDate(item.reportSubmittedAt, 'full')}</span>
                                </span>
                              )}
                              <span>•</span>
                              <button
                                type="button"
                                onClick={() => setHistoryTarget(item)}
                                className="inline-flex items-center gap-1 text-[#1565C0] hover:underline font-semibold cursor-pointer"
                              >
                                <History className="w-3 h-3" />
                                <span>Lịch sử</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[12px] text-slate-400 italic">
                            Chưa nộp báo cáo Final
                          </span>
                        )}
                      </td>

                      {/* Kiểm tra trùng lặp & Phiếu theo dõi tiến độ */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          {item.plagiarismRate !== null &&
                          item.plagiarismRate !== undefined ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded-full text-[11px] font-bold border',
                                  item.plagiarismRate <= 20
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : item.plagiarismRate <= 35
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200',
                                )}
                              >
                                Trùng {item.plagiarismRate}%
                              </span>
                              {item.plagiarismFileUrl &&
                              isSafeReportFileUrl(item.plagiarismFileUrl) ? (
                                <a
                                  href={item.plagiarismFileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11.5px] text-[#1565C0] hover:underline truncate max-w-[140px] inline-flex items-center gap-1"
                                  title={item.plagiarismFile}
                                >
                                  <span className="truncate">
                                    {item.plagiarismFile}
                                  </span>
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                              ) : (
                                item.plagiarismFile && (
                                  <span className="text-[11.5px] text-slate-500 truncate max-w-[140px]">
                                    {item.plagiarismFile}
                                  </span>
                                )
                              )}
                            </div>
                          ) : item.publicId ? (
                            <span className="text-[11.5px] text-slate-400 italic block">
                              Chưa kiểm tra trùng lặp
                            </span>
                          ) : (
                            <span className="text-[12px] text-slate-400 italic block">
                              —
                            </span>
                          )}

                          {/* Trạng thái Phiếu theo dõi tiến độ */}
                          {item.progressReport ? (
                            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              <span>Đã có phiếu tiến độ</span>
                              {isSafeReportFileUrl(
                                item.progressReport.progressFile,
                              ) && (
                                <a
                                  href={item.progressReport.progressFile}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#1565C0] hover:underline ml-0.5 inline-flex items-center"
                                  title="Xem phiếu theo dõi tiến độ"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[11px] text-amber-700 font-medium">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>Chưa nộp phiếu tiến độ</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {item.status === 'pending' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {item.statusDescription || 'Chờ thẩm định'}
                          </span>
                        )}
                        {item.status === 'request_changes' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                            {item.statusDescription || 'Yêu cầu chỉnh sửa'}
                          </span>
                        )}
                        {item.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            {item.statusDescription || 'Không đạt'}
                          </span>
                        )}
                        {item.status === 'not_submitted' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Chưa nộp
                          </span>
                        )}
                        {item.status === 'approved' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {item.statusDescription || 'Đã duyệt đạt'}
                          </span>
                        )}
                        {item.reviewedAt && (
                          <div className="text-[10.5px] text-slate-400 mt-1">
                            {formatDate(item.reviewedAt, 'full')}
                          </div>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {!item.canReview ? (
                          <div className="inline-flex items-center gap-2 justify-end">
                            <span className="text-[11.5px] text-slate-500 italic">
                              Chỉ xem
                            </span>
                            {item.publicId && (
                              <button
                                type="button"
                                onClick={() => setPreviewTarget(item)}
                                className="p-1 text-slate-400 hover:text-[#1565C0] rounded transition cursor-pointer"
                                title="Xem báo cáo"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ) : !item.publicId ? (
                          <span className="text-[11.5px] text-slate-400 italic">
                            Chờ sinh viên nộp
                          </span>
                        ) : item.apiStatus === 'APPROVED' ? (
                          <div className="inline-flex items-center gap-2 justify-end">
                            <span className="text-[11.5px] text-emerald-600 font-semibold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Đã duyệt đạt
                            </span>
                            <button
                              type="button"
                              onClick={() => setPreviewTarget(item)}
                              className="p-1 text-slate-400 hover:text-[#1565C0] rounded transition cursor-pointer"
                              title="Xem lại báo cáo"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        ) : item.apiStatus === 'REQUEST_CHANGES' ? (
                          <div className="inline-flex items-center gap-2 justify-end">
                            <span className="text-[11.5px] text-orange-700 font-medium">
                              Chờ SV nộp lại
                            </span>
                            <button
                              type="button"
                              onClick={() => setPreviewTarget(item)}
                              className="p-1 text-slate-400 hover:text-[#1565C0] rounded transition cursor-pointer"
                              title="Xem báo cáo"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        ) : item.apiStatus === 'REJECTED' ? (
                          <div className="inline-flex items-center gap-2 justify-end">
                            <span className="text-[11.5px] text-rose-700 font-medium">
                              Không đạt
                            </span>
                            <button
                              type="button"
                              onClick={() => setPreviewTarget(item)}
                              className="p-1 text-slate-400 hover:text-[#1565C0] rounded transition cursor-pointer"
                              title="Xem báo cáo"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-end gap-1">
                            <Button
                              type="button"
                              size="sm"
                              disabled={!isReviewable}
                              onClick={() => setReviewTarget({ item })}
                              title={blockedReason ?? 'Thẩm định báo cáo Final'}
                              className="bg-[#1565C0] hover:bg-[#0D47A1] text-white h-8 px-3 text-xs"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>Thẩm định</span>
                            </Button>
                            {!isReviewable && blockedReason && (
                              <span className="text-[10.5px] text-amber-700 font-medium whitespace-normal text-right max-w-[180px]">
                                {blockedReason}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3 bg-slate-50/70 shrink-0">
          <p className="text-[12.5px] text-slate-500" id="plagiarismPaginationInfo">
            Hiển thị{' '}
            <b className="text-slate-800">
              {totalItems === 0 ? 0 : `${startIdx}–${endIdx}`}
            </b>{' '}
            trên <b className="text-slate-800">{totalItems}</b> sinh viên
          </p>
          <div className="flex items-center gap-2">
            <div className="relative inline-flex items-center">
              <select
                id="plagiarismPageSizeSelect"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-8 px-2.5 pr-7 bg-white border border-slate-300 rounded-lg text-[12px] font-medium outline-none cursor-pointer appearance-none shadow-2xs hover:border-slate-400 transition text-slate-800"
              >
                <option value="15">15/trang</option>
                <option value="25">25/trang</option>
                <option value="50">50/trang</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div
              className="flex gap-1 items-center"
              id="plagiarismPaginationControls"
            >
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="btn-prev h-8 px-2.5 rounded-lg border border-slate-200 text-slate-600 text-[12px] font-semibold hover:bg-slate-50 transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => {
                  const isActive = pageNum === currentPage
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => handlePageChange(pageNum)}
                      className={cn(
                        'h-8 min-w-8 px-2 rounded-lg text-[12.5px] transition cursor-pointer font-bold',
                        isActive
                          ? 'bg-[#1565C0] text-white shadow-xs'
                          : 'border border-slate-200 text-slate-700 hover:bg-slate-50',
                      )}
                    >
                      {pageNum}
                    </button>
                  )
                },
              )}

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="btn-next h-8 px-2.5 rounded-lg border border-slate-200 text-slate-600 text-[12px] font-semibold hover:bg-slate-50 transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Các Modals */}
      <FinalReportReviewModal
        item={reviewTarget?.item ?? null}
        initialDecision={reviewTarget?.initialDecision}
        isSubmitting={isReviewPending}
        onClose={() => {
          if (!isReviewPending) setReviewTarget(null)
        }}
        onSubmitReview={handleSubmitReview}
      />

      <ReportHistoryModal
        item={historyTarget}
        onClose={() => setHistoryTarget(null)}
      />

      <ReportClassroomPreviewModal
        item={previewTarget}
        onClose={() => setPreviewTarget(null)}
        onOpenReview={(it) => {
          setPreviewTarget(null)
          setReviewTarget({ item: it })
        }}
        onDownloadReport={handleDownloadReport}
      />
    </div>
  )
}
