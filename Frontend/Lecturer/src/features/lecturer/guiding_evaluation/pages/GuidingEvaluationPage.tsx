import { useMemo, useState } from 'react'
import {
  CheckSquare,
  ChevronDown,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileQuestion,
  FileText,
  History,
  RotateCcw,
  Search,
} from 'lucide-react'
import { Button, Select, Skeleton } from '@/shared/components/ui'
import { cn, formatDate } from '@/shared/utils'
import {
  PreviewTrackingModal,
  RubricGradingModal,
  StudentReportDetailModal,
  UploadTrackingModal,
} from '../components/GuidingEvaluationModals'
import {
  useGuidingEvaluation,
  useGuidingEvaluationCurrentSemester,
  useGuidingEvaluationSemesters,
} from '../hooks/useGuidingEvaluation'
import {
  canLecturerSubmitProgressReport,
  getProgressUploadBlockedReason,
  isSafeProgressFileUrl,
} from '../services/guidingEvaluation.service'
import type { GuidingEvaluationTabStatus } from '../types/guidingEvaluation.types'
import {
  hasEvaluationScore,
  hasTrackingFile,
  isEvaluationCompleted,
} from '../utils/guidingEvaluation.utils'

export default function GuidingEvaluationPage() {
  const [pickedSemesterPublicId, setPickedSemesterPublicId] = useState<
    string | undefined
  >()

  const {
    data: semesterList,
    isPending: semestersLoading,
    isError: semestersError,
    refetch: refetchSemesters,
  } = useGuidingEvaluationSemesters()
  const currentSemesterQuery = useGuidingEvaluationCurrentSemester()

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
    items,
    counts,
    isLoading,
    isError,
    refetch,
    deadlineSnapshot,
    deadlineInfo,
    isDeadlineLoading,
    filterStatus,
    searchQuery,
    pageSize,
    currentPage,
    totalPages,
    startIdx,
    endIdx,
    totalItems,
    pagedItems,

    uploadTarget,
    setUploadTarget,
    rubricTarget,
    setRubricTarget,
    previewTarget,
    setPreviewTarget,
    detailTarget,
    setDetailTarget,

    isSubmittingProgress,
    handleTabChange,
    handleSearchChange,
    handlePageSizeChange,
    handlePageChange,
    handleConfirmUpload,
    handleSaveRubric,
    handleDownloadTrackingFile,
    handleDownloadFinalReportFile,
  } = useGuidingEvaluation(selectedSemesterPublicId || undefined, semesterResolved)

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
          <Skeleton className="h-10 w-80 rounded-xl" />
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
    status: GuidingEvaluationTabStatus
    label: string
    count: number
  }> = [
    { status: 'all', label: 'Tất cả', count: counts.all },
    { status: 'incomplete', label: 'Chưa nộp phiếu', count: counts.incomplete },
    { status: 'completed', label: 'Đã nộp phiếu', count: counts.completed },
  ]

  const deadlineBadgeClass = deadlineInfo.isExpired
    ? 'bg-rose-50 border-rose-200/90 text-rose-800'
    : deadlineInfo.isUnconfigured ||
        deadlineSnapshot?.deadlineStatus === 'NOT_STARTED'
      ? 'bg-slate-100 border-slate-200 text-slate-700'
      : 'bg-amber-50 border-amber-200/90 text-amber-800'

  const deadlineIconClass = deadlineInfo.isExpired
    ? 'text-rose-600'
    : deadlineInfo.isUnconfigured ||
        deadlineSnapshot?.deadlineStatus === 'NOT_STARTED'
      ? 'text-slate-500'
      : 'text-amber-600'

  return (
    <div
      className="flex-1 min-h-0 w-full flex flex-col overflow-hidden max-w-[1520px] mx-auto"
      style={{
        fontFamily:
          '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Toolbar Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3 shrink-0">
        {/* 1. Tabs trạng thái */}
        <div
          className="h-10 bg-[#E2E8F0] p-1 rounded-xl flex items-center gap-1 text-[13px] font-semibold shadow-2xs border border-slate-300/70 shrink-0"
          id="statusTabs"
        >
          {tabs.map((tab) => {
            const isActive = filterStatus === tab.status
            return (
              <button
                key={tab.status}
                type="button"
                onClick={() => handleTabChange(tab.status)}
                className={cn(
                  'h-[32px] px-3.5 sm:px-4 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap',
                  isActive
                    ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 font-medium',
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'rounded-full text-[11px]',
                    isActive
                      ? 'px-2 py-0.5 font-bold bg-[#E3F2FD] text-[#1565C0]'
                      : 'px-1.5 py-0.5 font-semibold text-slate-500',
                  )}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* 2. Bộ lọc năm học / học kỳ, tìm kiếm & Hạn nộp phiếu */}
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

          <div className="relative flex-1 min-w-[220px] sm:max-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Tìm sinh viên, mã SV hoặc đề tài..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200/90 bg-white text-[13px] text-slate-800 placeholder-slate-400 outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
            />
          </div>

          {/* Box Hạn nộp phiếu theo dõi tiến độ */}
          <div
            className={cn(
              'inline-flex items-center gap-2 px-3.5 min-h-10 py-1.5 rounded-xl border text-[12px] font-semibold shrink-0 shadow-2xs whitespace-nowrap',
              deadlineBadgeClass,
            )}
          >
            <Clock className={cn('w-4 h-4 shrink-0', deadlineIconClass)} />
            {isDeadlineLoading ? (
              <Skeleton className="h-4 w-32 bg-amber-200/70" />
            ) : (
              <span>
                Hạn nộp phiếu:{' '}
                <b className="font-bold">{deadlineInfo.text}</b>
                {deadlineInfo.badgeText &&
                  deadlineSnapshot?.deadlineStatus === 'OPEN' && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10.5px] font-bold">
                      {deadlineInfo.badgeText}
                    </span>
                  )}
                {deadlineInfo.badgeText &&
                  deadlineSnapshot?.deadlineStatus === 'EXTENDED' && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded bg-blue-100 text-[#1565C0] text-[10.5px] font-bold">
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
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 text-[11.5px] font-bold uppercase tracking-wider border-b border-slate-200 shadow-2xs select-none">
              <tr>
                <th className="py-3.5 px-5 text-slate-600 font-bold uppercase tracking-wider text-[11.5px] bg-slate-50 w-16 text-center">
                  STT
                </th>
                <th className="py-3.5 px-5 bg-slate-50 min-w-[220px]">
                  SINH VIÊN HƯỚNG DẪN
                </th>
                <th className="py-3.5 px-5 bg-slate-50 min-w-[300px]">
                  ĐỀ TÀI & BÁO CÁO FINAL
                </th>
                <th className="py-3.5 px-5 bg-slate-50 min-w-[250px]">
                  PHIẾU THEO DÕI TIẾN ĐỘ
                </th>
                <th className="py-3.5 px-5 bg-slate-50 min-w-[160px]">
                  ĐIỂM HƯỚNG DẪN
                </th>
                <th className="py-3.5 px-5 bg-slate-50 min-w-[150px]">
                  TRẠNG THÁI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                Array.from({ length: 5 }, (_, idx) => (
                  <tr key={idx}>
                    {Array.from({ length: 6 }, (_, colIdx) => (
                      <td key={colIdx} className="py-4 px-5">
                        <Skeleton className="h-5 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <p className="text-sm font-semibold text-rose-700">
                      Không tải được danh sách sinh viên hướng dẫn từ máy chủ.
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
              ) : pagedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400">
                    <FileQuestion className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <div className="text-[13px] font-semibold text-slate-600">
                      {items.length === 0
                        ? 'Chưa có sinh viên hướng dẫn ở giai đoạn báo cáo trong học kỳ này'
                        : 'Không tìm thấy sinh viên nào phù hợp'}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {items.length === 0
                        ? 'Danh sách chỉ hiển thị các đề tài đã hoàn thành duyệt đề cương.'
                        : 'Vui lòng thử tìm kiếm với từ khóa khác hoặc chuyển tab lọc.'}
                    </div>
                  </td>
                </tr>
              ) : (
                pagedItems.map((item, idx) => {
                  const completed = isEvaluationCompleted(item)
                  const hasFile = hasTrackingFile(item)
                  const hasScore = hasEvaluationScore(item)
                  const canUpload = canLecturerSubmitProgressReport(item)
                  const blockedReason = getProgressUploadBlockedReason(item)
                  const displayStt = startIdx + idx

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition border-b border-slate-100 last:border-b-0"
                    >
                      {/* 1. STT */}
                      <td className="py-4 px-5 text-center text-[13px] font-semibold text-slate-400">
                        {displayStt}
                      </td>

                      {/* 2. SINH VIÊN HƯỚNG DẪN */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[13.5px] text-slate-900 leading-snug">
                            {item.name}
                          </span>
                          {!item.canSubmitProgressReport && (
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
                        <div className="text-[12px] text-slate-500 font-mono mt-0.5">
                          {item.mssv}
                        </div>
                        {!item.canSubmitProgressReport && item.lecturerName && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            GVHD chính: {item.lecturerName}
                          </div>
                        )}
                      </td>

                      {/* 3. ĐỀ TÀI & BÁO CÁO FINAL */}
                      <td className="py-4 px-5 max-w-[340px]">
                        <div
                          className="text-[13px] font-medium text-slate-800 leading-snug line-clamp-2"
                          title={item.topic}
                        >
                          {item.topic}
                        </div>
                        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                          {item.publicId ? (
                            <button
                              type="button"
                              onClick={() => setDetailTarget(item)}
                              className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#1565C0] hover:underline cursor-pointer"
                            >
                              <History className="w-3 h-3 shrink-0" />
                              <span>
                                {item.finalReportStatusDescription || 'Xem báo cáo Final'}
                              </span>
                            </button>
                          ) : (
                            <span className="text-[11.5px] text-slate-400 italic">
                              Sinh viên chưa nộp báo cáo Final
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. PHIẾU THEO DÕI TIẾN ĐỘ */}
                      <td className="py-4 px-5">
                        {!hasFile ? (
                          <div className="space-y-1">
                            {item.canSubmitProgressReport ? (
                              <>
                                <button
                                  type="button"
                                  disabled={!canUpload}
                                  title={blockedReason ?? 'Nộp phiếu theo dõi tiến độ'}
                                  onClick={() => setUploadTarget(item)}
                                  className={cn(
                                    'h-8 px-3.5 rounded-lg border text-[12px] font-semibold transition inline-flex items-center gap-1.5 shadow-2xs',
                                    canUpload
                                      ? 'bg-blue-50/90 hover:bg-blue-100 border-blue-200/90 text-[#1565C0] cursor-pointer'
                                      : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed',
                                  )}
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Nộp phiếu</span>
                                </button>
                                {!canUpload && blockedReason && (
                                  <div className="text-[11px] text-amber-700 font-medium">
                                    {blockedReason}
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-[12px] text-slate-400 italic">
                                Chưa có phiếu theo dõi
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 max-w-[280px]">
                              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                              <button
                                type="button"
                                onClick={() => setPreviewTarget(item)}
                                className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-[12.5px] truncate cursor-pointer"
                                title="Nhấp để xem trước phiếu theo dõi"
                              >
                                {item.fileName}
                              </button>
                              <button
                                type="button"
                                onClick={() => setPreviewTarget(item)}
                                className="text-slate-400 hover:text-blue-600 p-1 rounded-md hover:bg-blue-50 transition cursor-pointer shrink-0"
                                title="Xem trước phiếu theo dõi"
                                aria-label="Xem trước phiếu theo dõi"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {isSafeProgressFileUrl(item.progressFileUrl) && (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadTrackingFile(item)}
                                  className="text-slate-400 hover:text-blue-600 p-1 rounded-md hover:bg-blue-50 transition cursor-pointer shrink-0"
                                  title="Tải xuống phiếu theo dõi"
                                  aria-label="Tải xuống phiếu theo dõi"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-normal flex-wrap">
                              {item.submittedAt && (
                                <span>
                                  Nộp lúc: {formatDate(item.submittedAt, 'full')}
                                </span>
                              )}
                              {canUpload && (
                                <>
                                  {item.submittedAt && <span>•</span>}
                                  <button
                                    type="button"
                                    onClick={() => setUploadTarget(item)}
                                    className="text-blue-600 hover:text-blue-800 hover:underline font-bold transition cursor-pointer inline-flex items-center gap-1"
                                    title="Cập nhật phiếu theo dõi tiến độ mới"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Cập nhật phiếu theo dõi</span>
                                  </button>
                                </>
                              )}
                            </div>
                            {item.supervisorNote && (
                              <div
                                className="text-[11px] text-slate-500 line-clamp-1 max-w-[280px]"
                                title={item.supervisorNote}
                              >
                                Ghi chú: {item.supervisorNote}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 5. ĐIỂM HƯỚNG DẪN */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        {!item.canSubmitProgressReport ? (
                          <span className="text-[12px] text-slate-400 italic">
                            Chỉ xem
                          </span>
                        ) : !hasScore ? (
                          <button
                            type="button"
                            onClick={() => setRubricTarget(item)}
                            className="h-8 px-3.5 rounded-lg bg-[#1565C0] hover:bg-blue-700 text-white text-[12px] font-bold transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Chấm điểm</span>
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <span className="font-extrabold text-[13.5px] text-slate-900">
                              {Number(item.score).toFixed(1)}
                            </span>
                            <span className="text-xs text-slate-400 font-semibold">
                              / 10.0
                            </span>
                            <button
                              type="button"
                              onClick={() => setRubricTarget(item)}
                              className="p-1 rounded-md text-slate-400 hover:text-[#1565C0] hover:bg-blue-50 transition cursor-pointer ml-0.5"
                              title="Xem / Chỉnh sửa điểm Rubric"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* 6. TRẠNG THÁI */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        {completed ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                            Đã nộp phiếu
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11.5px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                            Chưa nộp phiếu theo dõi
                          </span>
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
          <p className="text-[12.5px] text-slate-500">
            Hiển thị{' '}
            <b className="text-slate-800">
              {totalItems === 0 ? 0 : `${startIdx}–${endIdx}`}
            </b>{' '}
            trên <b className="text-slate-800">{totalItems}</b> sinh viên
          </p>
          <div className="flex items-center gap-2">
            <div className="relative inline-flex items-center">
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="h-8 px-2.5 pr-7 bg-white border border-slate-300 rounded-lg text-[12px] font-medium outline-none cursor-pointer appearance-none shadow-2xs hover:border-slate-400 transition text-slate-800"
              >
                <option value={15}>15/trang</option>
                <option value={25}>25/trang</option>
                <option value={50}>50/trang</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="flex gap-1 items-center">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="h-8 px-2.5 rounded-lg border border-slate-200 text-slate-600 text-[12px] font-semibold hover:bg-slate-50 transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
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
                className="h-8 px-2.5 rounded-lg border border-slate-200 text-slate-600 text-[12px] font-semibold hover:bg-slate-50 transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <UploadTrackingModal
        key={`upload-${uploadTarget?.id ?? 'closed'}`}
        item={uploadTarget}
        isSubmitting={isSubmittingProgress}
        onClose={() => setUploadTarget(null)}
        onConfirm={handleConfirmUpload}
      />

      <RubricGradingModal
        key={`rubric-${rubricTarget?.id ?? 'closed'}`}
        item={rubricTarget}
        onClose={() => setRubricTarget(null)}
        onSave={handleSaveRubric}
      />

      <PreviewTrackingModal
        key={`preview-${previewTarget?.id ?? 'closed'}`}
        item={previewTarget}
        onClose={() => setPreviewTarget(null)}
        onReUpload={(it) => setUploadTarget(it)}
        onDownload={handleDownloadTrackingFile}
        onOpenReportDetail={(it) => setDetailTarget(it)}
      />

      <StudentReportDetailModal
        key={`detail-${detailTarget?.id ?? 'closed'}`}
        item={detailTarget}
        onClose={() => setDetailTarget(null)}
        onDownloadFinalReport={handleDownloadFinalReportFile}
        onOpenProgressUpload={(it) => setUploadTarget(it)}
      />
    </div>
  )
}
