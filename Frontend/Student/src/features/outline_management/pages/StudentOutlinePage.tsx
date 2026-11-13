import { useRef, useState } from 'react'
import {
  AlertTriangle,
  Award,
  Clock,
  Eye,
  FilePenLine,
  FileUp,
  FileX,
  Send,
} from 'lucide-react'
import { useMyInfo } from '@/features/auth'
import { toast } from '@/shared/components/feedback/toast.store'
import { Skeleton } from '@/shared/components/ui'
import { cn, formatDate } from '@/shared/utils'
import { OnlineOutlineEditorModal } from '../components/OnlineOutlineEditorModal'
import { SubmitOutlineFileModal } from '../components/SubmitOutlineFileModal'
import { useMyOutline, useSubmitOutline } from '../hooks/useOutlineManagement'
import {
  useConfirmInitialTitle,
  useMyTopicOverview,
  useRequestChangeTitle,
} from '../hooks/useTopicTitle'
import { extractOutlineFileName, isSafeFileUrl } from '../services/outline.service'
import type { OutlineStatus, SubmitOutlineRequest } from '../types/outline.types'
import {
  getOutlineDeadlineDisplay,
  getOutlineSubmitState,
} from '../utils/outlineDeadline'

const OUTLINE_STATUS_STYLE: Record<
  OutlineStatus,
  { label: string; badgeClassName: string }
> = {
  APPROVED: {
    label: 'Đã duyệt',
    badgeClassName: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  REQUEST_CHANGES: {
    label: 'Yêu cầu chỉnh sửa',
    badgeClassName: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  REJECTED: {
    label: 'Không đạt',
    badgeClassName: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  PENDING: {
    label: 'Đang chờ duyệt',
    badgeClassName: 'bg-blue-50 text-[#1565C0] border-blue-200',
  },
}

export default function StudentOutlinePage() {
  const { data: user } = useMyInfo()
  const topicInputRef = useRef<HTMLTextAreaElement>(null)

  // 1. Lấy dữ liệu thật từ Backend (Overview đề tài & Đề cương hiện tại)
  const {
    data: topicOverview,
    isPending: isTopicLoading,
    isError: isTopicError,
  } = useMyTopicOverview()
  const {
    data: outlineData,
    isPending: isOutlineLoading,
    isError: isOutlineError,
  } = useMyOutline()

  // 2. Mutations chốt tên, xin đổi tên và nộp/nộp lại đề cương
  const confirmMutation = useConfirmInitialTitle()
  const changeMutation = useRequestChangeTitle()
  const submitOutlineMutation = useSubmitOutline()
  const isMutating = confirmMutation.isPending || changeMutation.isPending

  // 3. Quản lý trạng thái nhập tên đề tài (derive trực tiếp từ server state, chỉ ghi đè khi user tự sửa)
  const pendingHistory = topicOverview?.histories?.find((h) => h.status === 'PENDING')
  const hasPendingRequest = Boolean(pendingHistory)
  const latestRejectedHistory =
    !hasPendingRequest && topicOverview?.histories?.[0]?.status === 'REJECTED'
      ? topicOverview.histories[0]
      : null

  const [editedTopic, setEditedTopic] = useState<string | null>(null)
  const [topicValidationError, setTopicValidationError] = useState<string | null>(null)
  const defaultTopic =
    pendingHistory?.newName ||
    topicOverview?.officialName ||
    topicOverview?.provisionalName ||
    ''
  const topic = editedTopic !== null ? editedTopic : defaultTopic

  const [fileModalOpen, setFileModalOpen] = useState<boolean>(false)
  const [editorModalOpen, setEditorModalOpen] = useState<boolean>(false)

  const handleEditorToast = (
    message: string,
    type: 'success' | 'warning' | 'error' = 'success',
  ) => {
    toast[type](message)
  }

  // 4. Các điều kiện nghiệp vụ dựa theo API response (GET /topic/my-title-history)
  const hasTopic = Boolean(topicOverview?.topicPublicId)
  const isDisqualified = topicOverview?.status === 'DISQUALIFIED'
  const isTopicLockedStatus =
    Boolean(topicOverview?.status) && topicOverview?.status !== 'IN_PROGRESS'
  const isInitial =
    hasTopic &&
    (topicOverview?.currentStage === 'STAGE_1_ADVISOR_ASSIGNED' ||
      topicOverview?.currentStage === 'STAGE_2_TOPIC_CONFIRMED') &&
    !topicOverview?.officialName
  const isChange = hasTopic && topicOverview?.officialName != null && !hasPendingRequest

  const deadlineDisplay = getOutlineDeadlineDisplay(topicOverview)
  // Cả chốt tên lần đầu lẫn đổi/cập nhật tên đều dùng chung mốc hạn nộp đề cương (chỉ mở khi deadlineStatus === 'OPEN')
  const isBlockedByDeadline = !deadlineDisplay.isOpenForStudent
  const canEditTopic =
    !isTopicLoading &&
    !isTopicError &&
    hasTopic &&
    !isTopicLockedStatus &&
    !hasPendingRequest &&
    (isInitial || isChange)
  const isTopicSubmitDisabled =
    !canEditTopic || isMutating || isBlockedByDeadline

  const handleSaveTopic = () => {
    if (!canEditTopic || isBlockedByDeadline) {
      return
    }

    const val = topic.trim()
    if (!val) {
      setTopicValidationError('Vui lòng nhập tên đề tài!')
      topicInputRef.current?.focus()
      return
    }

    if (val.length > 500) {
      setTopicValidationError('Tên đề tài không được vượt quá 500 ký tự!')
      topicInputRef.current?.focus()
      return
    }

    if (isInitial) {
      setTopicValidationError(null)
      confirmMutation.mutate(
        { newName: val },
        {
          onSuccess: () => {
            setEditedTopic(null)
            setTopicValidationError(null)
          },
        },
      )
      return
    }

    if (
      topicOverview?.officialName &&
      val.toLowerCase() === topicOverview.officialName.trim().toLowerCase()
    ) {
      setTopicValidationError('Tên đề tài mới phải khác với tên hiện tại!')
      topicInputRef.current?.focus()
      return
    }

    setTopicValidationError(null)
    changeMutation.mutate(
      { newName: val },
      {
        onSuccess: () => {
          setEditedTopic(null)
          setTopicValidationError(null)
        },
      },
    )
  }

  const deadlineSource = outlineData ?? topicOverview
  const isDeadlineLoading = isOutlineLoading && isTopicLoading
  const isDeadlineError = isOutlineError && isTopicError
  const outlineSubmitState = getOutlineSubmitState(outlineData)
  const outlineDeadlineDisplay = outlineData
    ? outlineSubmitState.deadlineDisplay
    : getOutlineDeadlineDisplay(deadlineSource)
  const canSubmitOutline =
    !isOutlineLoading && !isOutlineError && outlineSubmitState.canSubmit

  const handleFileSubmit = (payload: SubmitOutlineRequest) => {
    submitOutlineMutation.mutate(payload, {
      onSuccess: () => {
        setFileModalOpen(false)
      },
    })
  }

  const handleOnlineEditorSubmit = (payload: { file: File; title?: string }) => {
    submitOutlineMutation.mutate(
      {
        file: payload.file,
        title: payload.title,
      },
      {
        onSuccess: () => {
          setEditorModalOpen(false)
        },
      },
    )
  }

  const renderOutlineStatusBadge = (
    status: OutlineStatus,
    statusDescription?: string | null,
    reviewedAt?: string | null,
  ) => {
    const config = OUTLINE_STATUS_STYLE[status] ?? OUTLINE_STATUS_STYLE.PENDING
    return (
      <div className="flex flex-col items-start gap-1">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border',
            config.badgeClassName,
          )}
        >
          {statusDescription || config.label}
        </span>
        {reviewedAt && (
          <span className="text-[11px] text-slate-500 font-medium">
            {formatDate(reviewedAt, 'full')}
          </span>
        )}
      </div>
    )
  }

  const studentMeta = {
    name:
      outlineData?.studentName ||
      user?.name?.trim() ||
      topicOverview?.histories?.[0]?.studentName ||
      '',
    mssv:
      outlineData?.studentCode || topicOverview?.histories?.[0]?.studentCode || '',
    className: '',
    department: '',
    mentor: deadlineSource?.lecturerName || '',
  }

  const outlineHistories = outlineData?.histories ?? []
  const hasExactOutlineFileMatch = Boolean(
    outlineData?.outlineFile &&
      outlineHistories.some((h) => h.outlineHistoryFile === outlineData.outlineFile),
  )

  return (
    <div className="w-full max-w-full space-y-4">

      {/* 1. Khối thông tin đề cương (Cùng 1 khối, thẳng hàng trên 1 line: Tên đề tài, Nội dung, Thời hạn nộp, Nút thao tác) */}
      <div className="rounded-xl border border-slate-200 bg-white px-4 sm:px-5 py-3.5 sm:py-4 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1.2fr)_auto] items-stretch divide-y lg:divide-y-0 lg:divide-x divide-slate-100 gap-4 lg:gap-0">
          {/* Cột 1: Tên đề tài tốt nghiệp & Gửi yêu cầu */}
          <form
            id="topic-container"
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              handleSaveTopic()
            }}
            className="lg:pr-4 xl:pr-5"
          >
            <div className="min-h-[28px] flex items-center justify-between gap-2 mb-2">
              <label
                htmlFor="outlineTopicInput"
                className="text-xs font-bold text-slate-700 flex items-center gap-1.5 flex-wrap"
              >
                <Award size={14} className="text-[#1565C0] shrink-0" />
                <span>
                  {isInitial
                    ? 'Chốt tên đề tài chính thức'
                    : isChange
                      ? 'Yêu cầu đổi tên đề tài'
                      : 'Tên đề tài tốt nghiệp'}
                </span>
                {hasPendingRequest && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-semibold text-amber-800 border border-amber-200">
                    Đang chờ GVHD duyệt tên đề tài
                  </span>
                )}
              </label>
              <button
                type="submit"
                disabled={isTopicSubmitDisabled}
                className="h-7 px-2.5 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-[11px] font-bold tracking-wide uppercase transition cursor-pointer shadow-2xs inline-flex items-center justify-center gap-1 shrink-0 whitespace-nowrap"
              >
                <Send size={12} className="shrink-0" />
                <span>
                  {isMutating
                    ? 'Đang gửi...'
                    : isInitial
                      ? 'Chốt tên đề tài'
                      : 'Gửi yêu cầu'}
                </span>
              </button>
            </div>

            {isTopicLoading ? (
              <Skeleton className="h-14 w-full rounded-lg" />
            ) : isTopicError ? (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
                Không tải được thông tin đề tài từ máy chủ. Vui lòng thử lại sau.
              </div>
            ) : isDisqualified ? (
              <div
                role="alert"
                className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1"
              >
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-rose-600 shrink-0" />
                  <span>Đề tài đã bị đình chỉ (DISQUALIFIED)</span>
                </p>
                <p className="text-[11px] text-rose-700">
                  Bạn đã bị dừng thực hiện đồ án trong học kỳ này. Lý do:{' '}
                  {topicOverview?.disqualificationReason || 'Không xác định'}
                </p>
              </div>
            ) : !hasTopic ? (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                Bạn chưa nằm trong danh sách sinh viên thực hiện đồ án của học kỳ này.
              </div>
            ) : (
              <div className="space-y-1.5">
                <textarea
                  id="outlineTopicInput"
                  ref={topicInputRef}
                  rows={2}
                  value={topic}
                  aria-invalid={Boolean(topicValidationError)}
                  disabled={
                    hasPendingRequest ||
                    isMutating ||
                    isTopicLockedStatus ||
                    isBlockedByDeadline
                  }
                  onChange={(e) => {
                    setEditedTopic(e.target.value)
                    if (topicValidationError) {
                      setTopicValidationError(null)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault()
                      handleSaveTopic()
                    }
                  }}
                  placeholder={
                    isInitial
                      ? 'Nhập tên đề tài chính thức lần đầu...'
                      : 'Nhập tên đề tài mới...'
                  }
                  className={cn(
                    'w-full px-3 py-2 rounded-lg border bg-white font-medium text-xs sm:text-[13px] text-slate-900 leading-snug focus:outline-hidden focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed transition resize-y min-h-[54px]',
                    topicValidationError
                      ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20'
                      : 'border-slate-300 focus:border-[#1565C0] focus:ring-[#1565C0]/20',
                  )}
                />

                {topicValidationError && (
                  <p role="alert" className="text-xs font-semibold text-[#DC2626]">
                    {topicValidationError}
                  </p>
                )}

                {isBlockedByDeadline && deadlineDisplay.lockedReason && (
                  <p className="text-xs font-medium text-rose-700">
                    {deadlineDisplay.lockedReason}
                  </p>
                )}

                {isTopicLockedStatus && !isDisqualified && (
                  <p className="text-xs font-medium text-slate-600">
                    Đề tài hiện ở trạng thái {topicOverview?.status}, không thể chỉnh sửa tên đề tài.
                  </p>
                )}

                {hasPendingRequest && pendingHistory?.oldName && (
                  <div className="rounded-md bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-[11.5px] text-amber-800 wrap-break-word">
                    <span className="font-medium">Tên hiện tại: </span>
                    <span className="font-semibold text-amber-950">
                      {pendingHistory.oldName}
                    </span>
                  </div>
                )}

                {latestRejectedHistory && (
                  <div className="rounded-md bg-rose-50 border border-rose-200 px-2.5 py-1.5 text-[11.5px] text-rose-800">
                    Yêu cầu tên đề tài "{latestRejectedHistory.newName}" đã bị GVHD từ chối. Vui lòng chỉnh sửa và gửi lại.
                  </div>
                )}

                {!hasPendingRequest && topicOverview?.officialName && (
                  <div className="pt-0.5 text-xs leading-snug wrap-break-word">
                    <span className="text-slate-500 font-medium">Tên chính thức: </span>
                    <span className="text-slate-800 font-semibold">
                      {topicOverview.officialName}
                    </span>
                  </div>
                )}

                {!hasPendingRequest &&
                  !topicOverview?.officialName &&
                  topicOverview?.provisionalName && (
                    <div className="pt-0.5 text-xs leading-snug wrap-break-word">
                      <span className="text-slate-500 font-medium">
                        Tên dự kiến khi đăng ký GVHD:{' '}
                      </span>
                      <span className="text-slate-700 italic">
                        {topicOverview.provisionalName}
                      </span>
                    </div>
                  )}
              </div>
            )}
          </form>

          {/* Cột 2: Thời hạn nộp & Giảng viên phụ trách */}
          <div className="pt-4 lg:pt-0 lg:px-4 xl:px-5">
            <div className="min-h-[28px] flex items-center mb-2">
              <h2 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock size={14} className="text-[#1565C0] shrink-0" />
                <span>{deadlineSource?.deadlineName || 'Thời hạn nộp'}</span>
              </h2>
            </div>

            {isDeadlineLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-52" />
                <Skeleton className="h-4 w-40" />
              </div>
            ) : isDeadlineError ? (
              <p id="outlineDeadlineText" className="text-xs font-medium text-rose-600">
                Không tải được thời hạn nộp.
              </p>
            ) : (
              <>
                <p
                  id="outlineDeadlineText"
                  className={cn(
                    'text-xs sm:text-[13.5px] font-bold leading-snug',
                    outlineDeadlineDisplay.toneClassName,
                  )}
                >
                  {outlineDeadlineDisplay.text}
                </p>
                {outlineDeadlineDisplay.lockedReason && (
                  <p className="text-[11.5px] font-medium text-rose-700 mt-1 leading-snug">
                    {outlineDeadlineDisplay.lockedReason}
                  </p>
                )}
              </>
            )}

            <div className="mt-2.5 text-xs text-slate-600 space-y-1">
              <div>
                Giảng viên hướng dẫn:{' '}
                <strong className="text-slate-900 font-semibold">
                  {deadlineSource?.lecturerName ||
                    (isDeadlineLoading ? 'Đang tải...' : 'Chưa phân công')}
                </strong>
              </div>
              {deadlineSource?.coLecturerName && (
                <div>
                  Đồng GVHD:{' '}
                  <strong className="text-slate-800 font-medium">
                    {deadlineSource.coLecturerName}
                  </strong>
                </div>
              )}
              <div>
                Giáo viên nhận xét:{' '}
                <strong className="text-slate-900 font-semibold">
                  {isOutlineLoading
                    ? 'Đang tải...'
                    : outlineData?.reviewerName || 'Chưa phân công'}
                </strong>
              </div>
              {topicOverview?.currentStageDescription && (
                <div className="text-[11px] text-slate-500">
                  Giai đoạn:{' '}
                  <span className="text-slate-700 font-medium">
                    {topicOverview.currentStageDescription}
                  </span>
                </div>
              )}
              {!isOutlineLoading &&
                !isOutlineError &&
                !outlineSubmitState.canSubmit &&
                outlineSubmitState.reason &&
                outlineSubmitState.reason !== outlineDeadlineDisplay.lockedReason && (
                  <p
                    className={cn(
                      'text-[11.5px] font-medium rounded-md px-2.5 py-1.5 mt-1.5 border leading-snug',
                      outlineData?.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200',
                    )}
                  >
                    {outlineSubmitState.reason}
                  </p>
                )}
            </div>
          </div>

          {/* Cột 3: TẢI TỆP LÊN & SOẠN TRỰC TUYẾN (Mỗi nút 1 dòng, cùng 1 ô thẳng hàng) */}
          <div className="pt-4 lg:pt-0 lg:pl-4 xl:pl-5 flex flex-col justify-center items-stretch gap-2 shrink-0">
            <button
              type="button"
              id="openSubmitModalBtn"
              disabled={!canSubmitOutline || submitOutlineMutation.isPending}
              onClick={() => setFileModalOpen(true)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg border border-[#1565C0] text-[#1565C0] bg-blue-50/40 hover:bg-blue-50 disabled:border-slate-200 disabled:text-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed font-semibold text-xs tracking-wide uppercase transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
            >
              <FileUp size={14} className="shrink-0" />
              <span id="submitBtnText">TẢI TỆP LÊN</span>
            </button>
            <button
              type="button"
              id="openEditorBtn"
              disabled={!canSubmitOutline || submitOutlineMutation.isPending}
              onClick={() => setEditorModalOpen(true)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg bg-[#1565C0] text-white hover:bg-[#0D47A1] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed font-semibold text-xs tracking-wide uppercase transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              <FilePenLine size={14} className="shrink-0" />
              <span>SOẠN TRỰC TUYẾN</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Lịch sử nộp đề cương */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#1565C0]" />
            <h2 className="text-xs sm:text-[13px] font-bold text-slate-900" id="historyHeaderTitle">
              Lịch sử nộp đề cương
            </h2>
          </div>
          {!isOutlineLoading && !isOutlineError && outlineData?.status && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Trạng thái hiện tại:</span>
              {renderOutlineStatusBadge(outlineData.status, outlineData.statusDescription)}
            </div>
          )}
        </div>

        {!isOutlineLoading &&
          !isOutlineError &&
          (outlineData?.reviewFeedback || outlineData?.advisorFeedback) && (
            <div className="px-5 py-3 bg-slate-50/60 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {outlineData.reviewFeedback && (
                <div className="rounded-lg bg-white border border-slate-200/80 p-3 space-y-1">
                  <div className="font-semibold text-slate-700">
                    Nhận xét của GV thẩm định
                    {outlineData.reviewerName ? ` (${outlineData.reviewerName})` : ''}:
                  </div>
                  <p className="text-slate-600 leading-relaxed wrap-break-word">
                    {outlineData.reviewFeedback}
                  </p>
                </div>
              )}
              {outlineData.advisorFeedback && (
                <div className="rounded-lg bg-white border border-slate-200/80 p-3 space-y-1">
                  <div className="font-semibold text-slate-700">
                    Nhận xét của GVHD
                    {outlineData.lecturerName ? ` (${outlineData.lecturerName})` : ''}:
                  </div>
                  <p className="text-slate-600 leading-relaxed wrap-break-word">
                    {outlineData.advisorFeedback}
                  </p>
                </div>
              )}
            </div>
          )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-[13px] text-slate-600 border-collapse">
            <thead className="bg-slate-50/70 text-[12px] font-bold text-slate-700 border-b border-slate-100">
              <tr>
                <th className="py-3 px-5 font-semibold text-slate-700">Thời gian nộp</th>
                <th className="py-3 px-5 font-semibold text-slate-700">Tên tệp</th>
                <th className="py-3 px-5 font-semibold text-slate-700">Trạng thái</th>
                <th className="py-3 px-5 font-semibold text-slate-700">Giáo viên nhận xét</th>
                <th className="py-3 px-5 font-semibold text-slate-700">Nhận xét của GVHD</th>
              </tr>
            </thead>
            <tbody id="submissions-table-body" className="divide-y divide-slate-100 bg-white">
              {isOutlineLoading ? (
                Array.from({ length: 2 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="py-3.5 px-5"><Skeleton className="h-4 w-28" /></td>
                    <td className="py-3.5 px-5"><Skeleton className="h-4 w-48" /></td>
                    <td className="py-3.5 px-5"><Skeleton className="h-5 w-24 rounded-full" /></td>
                    <td className="py-3.5 px-5"><Skeleton className="h-4 w-44" /></td>
                    <td className="py-3.5 px-5"><Skeleton className="h-4 w-40" /></td>
                  </tr>
                ))
              ) : isOutlineError ? (
                <tr>
                  <td colSpan={5} className="py-8 px-5 text-center text-rose-600 text-xs font-medium">
                    Không tải được lịch sử nộp đề cương từ máy chủ. Vui lòng thử lại sau.
                  </td>
                </tr>
              ) : outlineHistories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 px-5 text-center text-slate-400 text-xs">
                    <FileX size={32} className="text-slate-300 mx-auto mb-2" />
                    Chưa có lần nộp đề cương nào trong học kỳ này.
                  </td>
                </tr>
              ) : (
                outlineHistories.map((row, idx) => {
                  const canOpenFile = isSafeFileUrl(row.outlineHistoryFile)
                  const displayFileName = extractOutlineFileName(row.outlineHistoryFile)
                  const reviewerDisplayName = row.reviewerName || outlineData?.reviewerName
                  const isLatestRow = hasExactOutlineFileMatch
                    ? row.outlineHistoryFile === outlineData?.outlineFile
                    : idx === 0
                  const rowAdvisorFeedback =
                    isLatestRow && outlineData?.advisorFeedback
                      ? outlineData.advisorFeedback
                      : null

                  return (
                    <tr key={row.publicId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-normal text-slate-900 whitespace-nowrap">
                        {formatDate(row.submittedAt, 'full') || '—'}
                      </td>
                      <td className="py-3.5 px-5 font-normal text-slate-900">
                        <div className="inline-flex items-center gap-2 flex-wrap">
                          {canOpenFile ? (
                            <>
                              <a
                                href={row.outlineHistoryFile}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-[#1565C0] hover:underline font-medium break-all"
                              >
                                {displayFileName}
                              </a>
                              <a
                                href={row.outlineHistoryFile}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded text-slate-400 hover:text-[#1565C0] hover:bg-blue-50 transition"
                                title="Xem đề cương"
                              >
                                <Eye size={15} />
                              </a>
                            </>
                          ) : (
                            <span className="font-medium break-all">{displayFileName}</span>
                          )}
                        </div>
                        {row.submissionNote && (
                          <div className="text-[11px] text-slate-500 mt-0.5 wrap-break-word">
                            Ghi chú: {row.submissionNote}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {renderOutlineStatusBadge(
                          row.status,
                          row.statusDescription,
                          row.reviewedAt,
                        )}
                      </td>
                      <td className="py-3.5 px-5 font-normal text-slate-800 max-w-[280px]">
                        {reviewerDisplayName && (
                          <div className="font-semibold text-slate-900 mb-0.5">
                            {reviewerDisplayName}
                          </div>
                        )}
                        <div className="text-slate-600 text-xs leading-relaxed wrap-break-word">
                          {row.reviewFeedback || '—'}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-normal text-slate-700 text-xs leading-relaxed max-w-[280px] wrap-break-word">
                        {rowAdvisorFeedback || '—'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SubmitOutlineFileModal
        open={fileModalOpen}
        isSubmitting={submitOutlineMutation.isPending}
        defaultTitle={
          outlineData?.title ||
          outlineData?.topicName ||
          topicOverview?.officialName ||
          topicOverview?.provisionalName ||
          ''
        }
        onClose={() => setFileModalOpen(false)}
        onSubmitFile={handleFileSubmit}
      />

      <OnlineOutlineEditorModal
        open={editorModalOpen}
        isSubmitting={submitOutlineMutation.isPending}
        defaultTopicVi={
          outlineData?.topicName ||
          topicOverview?.officialName ||
          topicOverview?.provisionalName ||
          ''
        }
        termLabel={deadlineSource?.deadlineName || 'Học kỳ hiện tại'}
        studentMeta={studentMeta}
        onClose={() => setEditorModalOpen(false)}
        onSubmit={handleOnlineEditorSubmit}
        onToast={handleEditorToast}
      />
    </div>
  )
}
