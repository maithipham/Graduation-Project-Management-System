import { useRef, useState } from 'react'
import {
  AlertTriangle,
  Award,
  Clock,
  Eye,
  FilePen,
  FilePenLine,
  FileUp,
  FileX,
  Send,
} from 'lucide-react'
import { useMyInfo } from '@/features/auth'
import { getTermInfo, getTermLabel, useStudentSemester } from '@/shared/contexts'
import {
  OnlineOutlineEditorModal,
  OutlineSubmittedPreviewModal,
} from '../components/OnlineOutlineEditorModal'
import { SubmitOutlineFileModal } from '../components/SubmitOutlineFileModal'
import { INITIAL_OUTLINE_SUBMISSIONS, formatOutlineNow } from '../services/outline.service'
import {
  useConfirmInitialTitle,
  useMyTopicOverview,
  useRequestChangeTitle,
} from '../hooks/useTopicTitle'
import type { OutlineEditorData, OutlineSubmissionItem } from '../types/outline.types'

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'warning' | 'error'
}

export default function StudentOutlinePage() {
  const { data: user } = useMyInfo()
  const { term } = useStudentSemester()
  const topicInputRef = useRef<HTMLTextAreaElement>(null)
  const toastSeqRef = useRef<number>(0)
  const submissionSeqRef = useRef<number>(100)

  // 1. Lấy dữ liệu thật từ Backend (Overview đề tài và toàn bộ lịch sử)
  const {
    data: topicOverview,
    isPending: isTopicLoading,
    isError: isTopicError,
  } = useMyTopicOverview()

  // 2. Mutations để chốt tên và xin đổi tên đề tài
  const confirmMutation = useConfirmInitialTitle()
  const changeMutation = useRequestChangeTitle()
  const isMutating = confirmMutation.isPending || changeMutation.isPending

  // 3. Quản lý trạng thái nhập tên đề tài (derive trực tiếp từ server state, chỉ ghi đè khi user tự sửa)
  const [editedTopic, setEditedTopic] = useState<string | null>(null)
  const defaultTopic =
    topicOverview?.officialName || topicOverview?.provisionalName || ''
  const topic = editedTopic !== null ? editedTopic : defaultTopic

  const [history, setHistory] = useState<OutlineSubmissionItem[]>(
    INITIAL_OUTLINE_SUBMISSIONS,
  )
  const [fileModalOpen, setFileModalOpen] = useState<boolean>(false)
  const [editorModalOpen, setEditorModalOpen] = useState<boolean>(false)
  const [previewItem, setPreviewItem] = useState<{
    fileName: string
    data: OutlineEditorData
  } | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const pushToast = (
    message: string,
    type: 'success' | 'warning' | 'error' = 'success',
  ) => {
    toastSeqRef.current += 1
    const id = toastSeqRef.current
    setToasts((prev) => [...prev, { id, message, type }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2800)
  }

  // 4. Các điều kiện nghiệp vụ dựa theo API response
  const isDisqualified = topicOverview?.status === 'DISQUALIFIED'
  const pendingHistory = topicOverview?.histories?.find((h) => h.status === 'PENDING')
  const hasPendingRequest = Boolean(pendingHistory)
  const isInitial =
    topicOverview?.currentStage === 'STAGE_1_ADVISOR_ASSIGNED' &&
    !topicOverview?.officialName

  const handleSaveTopic = () => {
    if (isDisqualified) {
      pushToast(
        `Đồ án đã bị đình chỉ: ${topicOverview?.disqualificationReason || 'Không xác định'}`,
        'error',
      )
      return
    }

    if (hasPendingRequest) {
      pushToast(
        'Đang có yêu cầu chờ giảng viên hướng dẫn xác nhận, vui lòng không gửi trùng lặp!',
        'warning',
      )
      return
    }

    const val = topic.trim()
    if (!val) {
      pushToast('Vui lòng nhập tên đề tài!', 'error')
      topicInputRef.current?.focus()
      return
    }

    if (val.length > 500) {
      pushToast('Tên đề tài không được vượt quá 500 ký tự!', 'error')
      topicInputRef.current?.focus()
      return
    }

    if (isInitial) {
      confirmMutation.mutate(
        { newName: val },
        {
          onSuccess: () => {
            setEditedTopic(null)
            pushToast('Gửi tên đề tài chính thức thành công, chờ GVHD phê duyệt!', 'success')
          },
          onError: (err) => {
            pushToast(err instanceof Error ? err.message : 'Gửi tên đề tài thất bại', 'error')
          },
        },
      )
    } else {
      if (
        topicOverview?.officialName &&
        val.toLowerCase() === topicOverview.officialName.trim().toLowerCase()
      ) {
        pushToast('Vui lòng nhập tên đề tài mới khác với tên chính thức hiện tại!', 'warning')
        topicInputRef.current?.focus()
        return
      }

      changeMutation.mutate(
        { newName: val },
        {
          onSuccess: () => {
            setEditedTopic(null)
            pushToast('Gửi yêu cầu đổi tên đề tài thành công, chờ GVHD phê duyệt!', 'success')
          },
          onError: (err) => {
            pushToast(err instanceof Error ? err.message : 'Gửi yêu cầu đổi tên thất bại', 'error')
          },
        },
      )
    }
  }

  const filteredSubmissions = history.filter(
    (h) => h.year === term.year && h.semester === term.semester,
  )

  const termInfo = getTermInfo(term)
  const outlineDeadline = `${termInfo.outlineDeadline || '28/10/2026 23:59:55'} (GMT+07)`

  const handleFileSubmit = (file: File) => {
    submissionSeqRef.current += 1
    const newItem: OutlineSubmissionItem = {
      id: submissionSeqRef.current,
      year: term.year,
      semester: term.semester,
      source: 'file',
      time: formatOutlineNow(),
      fileName: file.name,
      status: 'Chờ duyệt',
      reviewerName: topicOverview?.lecturerName || 'Chưa phân công',
      note: 'Đề cương vừa nộp, đang chờ xét duyệt.',
      advisorNote: 'Chờ GVHD nhận xét.',
    }
    setHistory((prev) => [newItem, ...prev])
    setFileModalOpen(false)
    pushToast(`Đã nộp thành công tệp: ${file.name}`, 'success')
  }

  const handleOnlineEditorSubmit = ({
    fileName,
    data,
  }: {
    fileName: string
    data: OutlineEditorData
  }) => {
    submissionSeqRef.current += 1
    const newItem: OutlineSubmissionItem = {
      id: submissionSeqRef.current,
      year: term.year,
      semester: term.semester,
      source: 'editor',
      editorData: data,
      time: formatOutlineNow(),
      fileName,
      status: 'Chờ duyệt',
      reviewerName: topicOverview?.lecturerName || 'Chưa phân công',
      note: 'Đề cương vừa nộp, đang chờ xét duyệt.',
      advisorNote: 'Chờ GVHD nhận xét.',
    }
    setHistory((prev) => [newItem, ...prev])
    pushToast(`Đã nộp thành công đề cương: ${fileName}`, 'success')
  }

  const handleToggleSubmissionStatus = (id: number) => {
    setHistory((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const nextStatus = item.status === 'Đã duyệt' ? 'Đã từ chối' : 'Đã duyệt'
        return {
          ...item,
          status: nextStatus,
          approvedTime:
            nextStatus === 'Đã duyệt' ? '13/10/2026 14:20' : '10/10/2026 09:15',
          note:
            nextStatus === 'Đã duyệt'
              ? 'Đề cương đạt yêu cầu, được thông qua.'
              : 'Bổ sung mục tiêu đo lường cụ thể và làm rõ phạm vi dữ liệu.',
          advisorNote:
            nextStatus === 'Đã duyệt'
              ? 'Đồng ý thông qua.'
              : 'Yêu cầu sinh viên sửa lại theo góp ý của GV nhận xét.',
        }
      }),
    )
  }

  const handleViewOutlineItem = (item: OutlineSubmissionItem) => {
    if (item.source === 'editor' && item.editorData) {
      setPreviewItem({ fileName: item.fileName, data: item.editorData })
    } else {
      window.open(
        `/student/outline/preview?file=${encodeURIComponent(item.fileName)}`,
        '_blank',
        'noopener,noreferrer',
      )
    }
  }

  const renderStatusBadge = (
    status: OutlineSubmissionItem['status'],
    approvedTime?: string,
  ) => {
    if (status === 'Đã duyệt') {
      return (
        <div className="flex flex-col items-start gap-1">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            Đã duyệt
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            {approvedTime || '13/10/2026 14:20'}
          </span>
        </div>
      )
    }

    if (status === 'Đã từ chối') {
      return (
        <div className="flex flex-col items-start gap-1">
          <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
            Đã từ chối
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            {approvedTime || '10/10/2026 09:15'}
          </span>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-start gap-1">
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
          Chờ duyệt
        </span>
      </div>
    )
  }

  const studentMeta = {
    name: user?.name?.trim() || topicOverview?.histories?.[0]?.studentName || '',
    mssv: topicOverview?.histories?.[0]?.studentCode || '',
    className: '',
    department: '',
    mentor: topicOverview?.lecturerName || '',
  }

  return (
    <div className="w-full max-w-full space-y-4">
      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed top-5 right-5 z-100 flex flex-col gap-2 pointer-events-none">
          {toasts.map((t) => {
            const bgCls =
              t.type === 'error'
                ? 'bg-rose-600'
                : t.type === 'warning'
                  ? 'bg-amber-600'
                  : 'bg-emerald-600'
            return (
              <div
                key={t.id}
                className={`${bgCls} text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg transition-all duration-300 pointer-events-auto`}
              >
                {t.message}
              </div>
            )
          })}
        </div>
      )}

      {/* 1. Khối thông tin đề cương (Cùng 1 khối, thẳng hàng trên 1 line: Tên đề tài, Nội dung, Thời hạn nộp, Nút thao tác) */}
      <div className="rounded-xl border border-slate-200 bg-white px-4 sm:px-5 py-3.5 sm:py-4 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1.2fr)_auto] items-stretch divide-y lg:divide-y-0 lg:divide-x divide-slate-100 gap-4 lg:gap-0">
          {/* Cột 1: Tên đề tài tốt nghiệp & Gửi yêu cầu */}
          <div id="topic-container" className="lg:pr-4 xl:pr-5">
            <div className="min-h-[28px] flex items-center justify-between gap-2 mb-2">
              <label
                htmlFor="outlineTopicInput"
                className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
              >
                <Award size={14} className="text-[#1565C0] shrink-0" />
                <span>Tên đề tài tốt nghiệp</span>
                {isInitial && (
                  <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#1565C0] border border-blue-200">
                    Chốt lần đầu
                  </span>
                )}
              </label>
              <button
                type="button"
                onClick={handleSaveTopic}
                disabled={
                  isDisqualified ||
                  hasPendingRequest ||
                  isMutating ||
                  isTopicLoading ||
                  !topic.trim()
                }
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
              <div className="h-14 rounded-lg bg-slate-100 animate-pulse border border-slate-200" />
            ) : isDisqualified ? (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-rose-600 shrink-0" />
                  <span>Đề tài đã bị đình chỉ (DISQUALIFIED)</span>
                </p>
                <p className="text-[11px] text-rose-700">
                  {topicOverview?.disqualificationReason ||
                    'Bạn đã bị dừng thực hiện đồ án trong học kỳ này.'}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <textarea
                  id="outlineTopicInput"
                  ref={topicInputRef}
                  rows={2}
                  value={topic}
                  disabled={hasPendingRequest || isMutating}
                  onChange={(e) => setEditedTopic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault()
                      handleSaveTopic()
                    }
                  }}
                  placeholder={
                    isInitial
                      ? 'Nhập tên đề tài chính thức lần đầu...'
                      : 'Nhập tên đề tài muốn đổi...'
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-xs sm:text-[13px] text-slate-900 leading-snug focus:outline-hidden focus:border-[#1565C0] focus:ring-2 focus:ring-[#1565C0]/20 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed transition resize-y min-h-[54px]"
                />

                {hasPendingRequest && (
                  <div className="rounded-md bg-amber-50 border border-amber-200 p-2 text-xs text-amber-900 space-y-0.5">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                      <Clock size={12} className="text-amber-600 shrink-0" />
                      <span>Đang chờ GVHD duyệt tên đề tài:</span>
                    </div>
                    <div className="text-[12px] text-amber-950 font-medium pl-4">
                      "{pendingHistory?.newName}"
                    </div>
                    {pendingHistory?.oldName && (
                      <div className="text-[11px] text-amber-700 pl-4">
                        (Tên hiện tại: {pendingHistory.oldName})
                      </div>
                    )}
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

                {isTopicError && (
                  <div className="text-[11px] text-rose-600 pt-0.5">
                    Không tải được thông tin đề tài từ máy chủ. Vui lòng thử lại.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cột 2: Thời hạn nộp & Giáo viên nhận xét */}
          <div className="pt-4 lg:pt-0 lg:px-4 xl:px-5">
            <div className="min-h-[28px] flex items-center mb-2">
              <h2 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock size={14} className="text-[#1565C0] shrink-0" />
                <span>Thời hạn nộp</span>
              </h2>
            </div>
            <p id="outlineDeadlineText" className="text-xs sm:text-[13.5px] font-bold text-amber-800 leading-snug">
              {outlineDeadline}
            </p>
            <div className="mt-2.5 text-xs text-slate-600 space-y-1">
              <div>
                Giảng viên hướng dẫn:{' '}
                <strong className="text-slate-900 font-semibold">
                  {topicOverview?.lecturerName ||
                    (isTopicLoading ? 'Đang tải...' : 'Chưa phân công')}
                </strong>
              </div>
              {topicOverview?.coLecturerName && (
                <div>
                  Đồng GVHD:{' '}
                  <strong className="text-slate-800 font-medium">
                    {topicOverview.coLecturerName}
                  </strong>
                </div>
              )}
              {topicOverview?.currentStageDescription && (
                <div className="text-[11px] text-slate-500">
                  Giai đoạn:{' '}
                  <span className="text-slate-700 font-medium">
                    {topicOverview.currentStageDescription}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Cột 3: TẢI TỆP LÊN & SOẠN TRỰC TUYẾN (Mỗi nút 1 dòng, cùng 1 ô thẳng hàng) */}
          <div className="pt-4 lg:pt-0 lg:pl-4 xl:pl-5 flex flex-col justify-center items-stretch gap-2 shrink-0">
            <button
              type="button"
              id="openSubmitModalBtn"
              disabled={isDisqualified}
              onClick={() => setFileModalOpen(true)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg border border-[#1565C0] text-[#1565C0] bg-blue-50/40 hover:bg-blue-50 disabled:border-slate-200 disabled:text-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed font-semibold text-xs tracking-wide uppercase transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
            >
              <FileUp size={14} className="shrink-0" />
              <span id="submitBtnText">TẢI TỆP LÊN</span>
            </button>
            <button
              type="button"
              id="openEditorBtn"
              disabled={isDisqualified}
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
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <Clock size={16} className="text-[#1565C0]" />
          <h2 className="text-xs sm:text-[13px] font-bold text-slate-900" id="historyHeaderTitle">
            Lịch sử nộp đề cương
          </h2>
        </div>

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
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 px-5 text-center text-slate-400 text-xs">
                    <FileX size={32} className="text-slate-300 mx-auto mb-2" />
                    Chưa có lần nộp đề cương nào trong học kỳ này.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((row) => {
                  const isEditor = row.source === 'editor'
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-normal text-slate-900 whitespace-nowrap">
                        {row.time}
                      </td>
                      <td className="py-3.5 px-5 font-normal text-slate-900">
                        <div className="inline-flex items-center gap-2 flex-wrap">
                          <span
                            onClick={() => handleViewOutlineItem(row)}
                            className="hover:text-[#1565C0] font-medium cursor-pointer"
                          >
                            {row.fileName}
                          </span>
                          {isEditor && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-blue-50 text-[#1565C0] border border-blue-200">
                              <FilePen size={12} />
                              <span>Soạn online</span>
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleViewOutlineItem(row)}
                            className="p-1 rounded text-slate-400 hover:text-[#1565C0] hover:bg-blue-50 transition cursor-pointer"
                            title="Xem đề cương"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleSubmissionStatus(row.id)}
                          title="Nhấp để chuyển trạng thái giữa Đã duyệt và Đã từ chối"
                          className="cursor-pointer text-left"
                        >
                          {renderStatusBadge(row.status, row.approvedTime)}
                        </button>
                      </td>
                      <td className="py-3.5 px-5 font-normal text-slate-800 max-w-[280px]">
                        {row.reviewerName && (
                          <div className="font-semibold text-slate-900 mb-0.5">{row.reviewerName}</div>
                        )}
                        <div className="text-slate-600 text-xs leading-relaxed">{row.note || '—'}</div>
                      </td>
                      <td className="py-3.5 px-5 font-normal text-slate-700 text-xs leading-relaxed max-w-[280px]">
                        {row.advisorNote || '—'}
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
        onClose={() => setFileModalOpen(false)}
        onSubmitFile={handleFileSubmit}
      />

      <OnlineOutlineEditorModal
        open={editorModalOpen}
        defaultTopicVi={topicOverview?.officialName || topicOverview?.provisionalName || ''}
        termLabel={getTermLabel(term)}
        studentMeta={studentMeta}
        onClose={() => setEditorModalOpen(false)}
        onSubmit={handleOnlineEditorSubmit}
        onToast={pushToast}
      />

      <OutlineSubmittedPreviewModal
        open={Boolean(previewItem)}
        fileName={previewItem?.fileName ?? ''}
        data={previewItem?.data ?? null}
        studentMeta={studentMeta}
        onClose={() => setPreviewItem(null)}
      />
    </div>
  )
}
