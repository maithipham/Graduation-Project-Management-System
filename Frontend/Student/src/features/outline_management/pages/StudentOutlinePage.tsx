import { useRef, useState } from 'react'
import {
  Award,
  Clock,
  Eye,
  FilePen,
  FilePenLine,
  FileText,
  FileUp,
  FileX,
  History,
  Send,
} from 'lucide-react'
import { useMyInfo } from '@/features/auth'
import {
  STUDENT_PROFILE_MOCK,
  STUDENT_TOPIC_STORAGE_KEYS,
} from '@/shared/constants/studentProfile.mock'
import { getTermInfo, getTermLabel, useStudentSemester } from '@/shared/contexts'
import {
  OnlineOutlineEditorModal,
  OutlineSubmittedPreviewModal,
} from '../components/OnlineOutlineEditorModal'
import { SubmitOutlineFileModal } from '../components/SubmitOutlineFileModal'
import { INITIAL_OUTLINE_SUBMISSIONS, formatOutlineNow } from '../services/outline.service'
import type { OutlineEditorData, OutlineSubmissionItem } from '../types/outline.types'

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'warning' | 'error'
}

function readInitialTopicState() {
  try {
    const rawStoredTopic = localStorage.getItem(STUDENT_TOPIC_STORAGE_KEYS.topic)
    const rawOldTopic = localStorage.getItem(STUDENT_TOPIC_STORAGE_KEYS.oldTopic)
    const rawHasRequested =
      localStorage.getItem(STUDENT_TOPIC_STORAGE_KEYS.topicRequested) === '1'
    const initialTopic =
      rawStoredTopic !== null ? rawStoredTopic : STUDENT_PROFILE_MOCK.topic
    return {
      topic: initialTopic,
      committedTopic: initialTopic,
      oldTopic: rawHasRequested ? rawOldTopic || '' : '',
      hasTopicRequest: rawHasRequested,
    }
  } catch {
    return {
      topic: STUDENT_PROFILE_MOCK.topic,
      committedTopic: STUDENT_PROFILE_MOCK.topic,
      oldTopic: '',
      hasTopicRequest: false,
    }
  }
}

export default function StudentOutlinePage() {
  const { data: user } = useMyInfo()
  const { term } = useStudentSemester()
  const topicInputRef = useRef<HTMLTextAreaElement>(null)
  const toastSeqRef = useRef<number>(0)
  const submissionSeqRef = useRef<number>(100)

  const [initialTopic] = useState(readInitialTopicState)
  const [topic, setTopic] = useState<string>(initialTopic.topic)
  const [committedTopic, setCommittedTopic] = useState<string>(initialTopic.committedTopic)
  const [oldTopic, setOldTopic] = useState<string>(initialTopic.oldTopic)
  const [hasTopicRequest, setHasTopicRequest] = useState<boolean>(
    initialTopic.hasTopicRequest,
  )

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

  const handleSaveTopic = () => {
    const val = topic.trim()
    if (!val) {
      pushToast('Vui lòng nhập tên đề tài!', 'error')
      topicInputRef.current?.focus()
      return
    }
    if (val === committedTopic.trim()) {
      pushToast('Vui lòng nhập tên đề tài mới khác với tên hiện tại!', 'warning')
      topicInputRef.current?.focus()
      return
    }

    const previousTopic = committedTopic.trim()
    setOldTopic(previousTopic)
    setTopic(val)
    setCommittedTopic(val)
    setHasTopicRequest(true)

    try {
      localStorage.setItem(STUDENT_TOPIC_STORAGE_KEYS.topic, val)
      localStorage.setItem(STUDENT_TOPIC_STORAGE_KEYS.oldTopic, previousTopic)
      localStorage.setItem(STUDENT_TOPIC_STORAGE_KEYS.topicRequested, '1')
    } catch {
      // ignore storage errors
    }

    pushToast('Yêu cầu đã được gửi, chờ GVHD phê duyệt', 'success')
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
      status: 'Đã duyệt',
      approvedTime: '13/10/2026 14:20',
      note: 'Đề cương đạt yêu cầu, được thông qua.',
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
      status: 'Đã duyệt',
      approvedTime: '13/10/2026 14:20',
      note: 'Đề cương đạt yêu cầu, được thông qua.',
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

  const hasOldTopic = Boolean(oldTopic.trim())
  const oldTopicText = hasOldTopic ? oldTopic.trim() : 'không có'

  const studentMeta = {
    name: user?.name?.trim() || STUDENT_PROFILE_MOCK.name,
    mssv: STUDENT_PROFILE_MOCK.mssv,
    className: STUDENT_PROFILE_MOCK.className,
    department: STUDENT_PROFILE_MOCK.department,
    mentor: STUDENT_PROFILE_MOCK.mentor,
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

      {/* 1. Khối thông tin đề cương (Cùng 1 khối 4 cột thẳng hàng: Tên đề tài, Nội dung, Thời hạn nộp, Nút thao tác) */}
      <div className="rounded-xl border border-slate-200 bg-white px-4 sm:px-5 py-3.5 sm:py-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1.1fr)_minmax(0,0.95fr)_auto] items-stretch divide-y md:divide-y-0 lg:divide-x divide-slate-100 gap-4 lg:gap-0">
          {/* Cột 1: Tên đề tài tốt nghiệp & Gửi yêu cầu */}
          <div className="lg:pr-4 xl:pr-5">
            <div className="min-h-[28px] flex items-center justify-between gap-2 mb-2">
              <label
                htmlFor="outlineTopicInput"
                className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
              >
                <Award size={14} className="text-[#1565C0] shrink-0" />
                <span>Tên đề tài tốt nghiệp</span>
              </label>
              <button
                type="button"
                onClick={handleSaveTopic}
                className="h-7 px-2.5 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] text-white text-[11px] font-bold tracking-wide uppercase transition cursor-pointer shadow-2xs inline-flex items-center justify-center gap-1 shrink-0 whitespace-nowrap"
              >
                <Send size={12} className="shrink-0" />
                <span>Gửi yêu cầu</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <textarea
                id="outlineTopicInput"
                ref={topicInputRef}
                rows={2}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault()
                    handleSaveTopic()
                  }
                }}
                placeholder="Nhập tên đề tài tốt nghiệp..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-xs sm:text-[13px] text-slate-900 leading-snug focus:outline-hidden focus:border-[#1565C0] focus:ring-2 focus:ring-[#1565C0]/20 transition resize-y min-h-[54px]"
              />
              {hasTopicRequest && (
                <div className="pt-0.5 text-xs leading-snug wrap-break-word">
                  <span className="text-slate-500 font-medium">Tên cũ: </span>
                  <span
                    className={
                      hasOldTopic ? 'text-slate-700 font-medium' : 'text-slate-400 italic'
                    }
                  >
                    {oldTopicText}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Cột 2: Nội dung */}
          <div className="pt-4 md:pt-0 lg:px-4 xl:px-5">
            <div className="min-h-[28px] flex items-center mb-2">
              <h2 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText size={14} className="text-[#1565C0] shrink-0" />
                <span>Nội dung</span>
              </h2>
            </div>
            <div className="space-y-1.5 text-xs sm:text-[13px] text-slate-600">
              <p className="leading-relaxed">
                Nêu mục tiêu, phạm vi, phương pháp và kế hoạch thực hiện đề tài.
              </p>
              <div className="pt-0.5 text-slate-700">
                Giáo viên nhận xét:{' '}
                <strong className="font-bold text-slate-900">
                  {STUDENT_PROFILE_MOCK.outlineReviewer}
                </strong>
              </div>
            </div>
          </div>

          {/* Cột 3: Thời hạn nộp */}
          <div className="pt-4 md:pt-0 lg:px-4 xl:px-5">
            <div className="min-h-[28px] flex items-center mb-2">
              <h2 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock size={14} className="text-[#1565C0] shrink-0" />
                <span>Thời hạn nộp</span>
              </h2>
            </div>
            <p className="text-xs sm:text-[13.5px] font-bold text-amber-800 leading-snug">
              {outlineDeadline}
            </p>
            <div className="mt-2 space-y-1 text-xs text-slate-500">
              <div>
                Đã nộp:{' '}
                <strong className="font-bold text-slate-800">
                  {filteredSubmissions.length} lần
                </strong>
              </div>
              <div>
                Lần nộp gần nhất:{' '}
                <strong className="font-bold text-slate-700">
                  {filteredSubmissions.length > 0 ? filteredSubmissions[0].time : 'Chưa có'}
                </strong>
              </div>
            </div>
          </div>

          {/* Cột 4: TẢI TỆP LÊN & SOẠN TRỰC TUYẾN (Mỗi nút 1 dòng) */}
          <div className="pt-4 md:pt-0 lg:pl-4 xl:pl-5 flex flex-col justify-center items-stretch gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setFileModalOpen(true)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg border border-[#1565C0] text-[#1565C0] bg-blue-50/40 hover:bg-blue-50 font-semibold text-xs tracking-wide uppercase transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
            >
              <FileUp size={14} className="shrink-0" />
              <span>TẢI TỆP LÊN</span>
            </button>
            <button
              type="button"
              onClick={() => setEditorModalOpen(true)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg bg-[#1565C0] text-white hover:bg-[#0D47A1] font-semibold text-xs tracking-wide uppercase transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              <FilePenLine size={14} className="shrink-0" />
              <span>SOẠN TRỰC TUYẾN</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Lịch sử nộp đề cương */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <History size={16} className="text-[#1565C0]" />
            <span>Lịch sử nộp đề cương</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-sm font-bold text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-44 font-bold">Thời gian nộp</th>
                <th className="py-3 px-4 w-60 font-bold">Tên tệp</th>
                <th className="py-3 px-4 w-32 font-bold">Trạng thái</th>
                <th className="py-3 px-4 font-bold">Giáo viên nhận xét</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 px-4 text-center text-slate-400 text-xs">
                    <FileX size={32} className="text-slate-300 mx-auto mb-2" />
                    Chưa có lần nộp đề cương nào trong học kỳ này.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((row) => {
                  const isEditor = row.source === 'editor'
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-sm font-normal text-slate-900 whitespace-nowrap">
                        {row.time}
                      </td>
                      <td className="py-3.5 px-4 text-sm font-normal text-slate-900">
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
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-sm whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleSubmissionStatus(row.id)}
                          title="Nhấp để chuyển trạng thái giữa Đã duyệt và Đã từ chối"
                          className="cursor-pointer text-left"
                        >
                          {renderStatusBadge(row.status, row.approvedTime)}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-sm font-normal text-slate-800 max-w-[340px]">
                        {row.note || '—'}
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
        defaultTopicVi={committedTopic}
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
