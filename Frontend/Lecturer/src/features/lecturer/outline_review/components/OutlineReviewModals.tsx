import React, { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  Download,
  Eye,
  FileText,
  MessageSquare,
  X,
} from 'lucide-react'
import { formatDate } from '@/shared/utils'
import { useOutlineDetail } from '../hooks/useOutlineReview'
import type {
  OutlineStatus,
  ThesisOutlineHistoryResponse,
  ThesisOutlineResponse,
} from '../types/outlineReview.types'
import { getFileNameFromUrl } from '../utils/outlineReview.utils'

// ============================================================================
// 1. MODAL PHÊ DUYỆT ĐỀ CƯƠNG (GVNX)
// ============================================================================
interface ApproveOutlineModalProps {
  item: ThesisOutlineResponse | null
  onClose: () => void
  onConfirm: (publicId: string, feedback: string) => Promise<void> | void
  isPending?: boolean
}

export const ApproveOutlineModal: React.FC<ApproveOutlineModalProps> = ({
  item,
  onClose,
  onConfirm,
  isPending = false,
}) => {
  const [feedback, setFeedback] = useState(
    'Đề cương viết rõ ràng, bố cục hợp lý, đáp ứng yêu cầu của đồ án tốt nghiệp.',
  )
  const [errorMsg, setErrorMsg] = useState('')

  if (!item) return null

  // Ràng buộc GĐ 2: Đề tài phải được GVHD xác nhận chốt tên
  const isTitleConfirmed = item.currentStage === 'STAGE_2_TOPIC_CONFIRMED'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = feedback.trim()
    if (!trimmed) {
      setErrorMsg('Vui lòng nhập ý kiến nhận xét phê duyệt đề cương!')
      return
    }
    setErrorMsg('')
    onConfirm(item.publicId, trimmed)
  }

  return (
    <div
      id="approveModal"
      className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose()
      }}
    >
      <form
        noValidate
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl w-full max-w-[620px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-slate-900">
            Xác nhận phê duyệt đề cương
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            aria-label="Đóng"
            className="modal-close-btn w-9 h-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-7 space-y-4 text-[13.5px]">
          {/* Cảnh báo chưa chốt tên đề tài */}
          {!isTitleConfirmed && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5 text-[12.5px] leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <b className="font-bold">Lưu ý ràng buộc:</b> Sinh viên chưa được Giảng viên hướng dẫn xác nhận tên đề tài chính thức (Giai đoạn 2 chưa hoàn thành). Nếu duyệt Đạt ngay lúc này, hệ thống sẽ báo lỗi. Vui lòng liên hệ GVHD chốt tên trước.
              </div>
            </div>
          )}

          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-slate-800 leading-relaxed space-y-1.5">
            <div>Bạn đang thực hiện phê duyệt đề cương của sinh viên:</div>
            <div className="text-[15px] font-bold text-emerald-950 flex items-center gap-2">
              <span id="approveStudentName">{item.studentName}</span>
              <span
                id="approveStudentMssv"
                className="text-[12px] font-mono text-emerald-700 font-semibold"
              >
                ({item.studentCode})
              </span>
            </div>
            <div
              id="approveStudentTopicWrap"
              className="text-[12.5px] text-slate-600 pt-1 border-t border-emerald-200/60"
            >
              Đề tài:{' '}
              <span id="approveStudentTopic" className="font-medium text-slate-800">
                {item.topicName || item.title || 'Chưa có tên đề tài cụ thể'}
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="approveFeedbackInput"
              className="block text-slate-700 font-semibold mb-1 text-[13px]"
            >
              Ý kiến nhận xét đánh giá <span className="text-rose-600 font-bold">* (bắt buộc)</span>:
            </label>
            <textarea
              id="approveFeedbackInput"
              rows={4}
              value={feedback}
              onChange={(e) => {
                setFeedback(e.target.value)
                if (errorMsg) setErrorMsg('')
              }}
              placeholder="Nhập nhận xét đánh giá đề cương..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] outline-none focus:border-emerald-500 focus:bg-white transition resize-y"
            />
            {errorMsg && (
              <div className="text-[12px] text-rose-600 font-semibold mt-1">
                {errorMsg}
              </div>
            )}
          </div>

          <p className="text-slate-500 text-[12px] italic">
            Sau khi duyệt, đề cương sẽ chuyển sang trạng thái <b>ĐÃ DUYỆT (APPROVED)</b> và chuyển tiếp sang giai đoạn thực hiện đồ án.
          </p>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="modal-close-btn h-8 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-[12px] font-bold hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            id="btnConfirmApprove"
            disabled={isPending}
            className="h-8 px-4 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white text-[12px] font-bold transition cursor-pointer shadow-xs disabled:opacity-60 flex items-center gap-1.5"
          >
            {isPending ? 'Đang duyệt...' : 'Xác nhận duyệt'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ============================================================================
// 2. MODAL TỪ CHỐI / YÊU CẦU SỬA ĐỀ CƯƠNG (GVNX)
// ============================================================================
interface RejectOutlineModalProps {
  item: ThesisOutlineResponse | null
  deadlineStatus?: string | null
  onClose: () => void
  onConfirm: (
    publicId: string,
    feedback: string,
    decision: OutlineStatus,
  ) => Promise<void> | void
  isPending?: boolean
}

export const RejectOutlineModal: React.FC<RejectOutlineModalProps> = ({
  item,
  deadlineStatus,
  onClose,
  onConfirm,
  isPending = false,
}) => {
  const isExtendedPeriod = deadlineStatus === 'EXTENDED'
  const defaultDecision: OutlineStatus = isExtendedPeriod
    ? 'REJECTED'
    : 'REQUEST_CHANGES'

  const [decision, setDecision] = useState<OutlineStatus>(defaultDecision)
  const [feedback, setFeedback] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  if (!item) return null

  const handleClose = () => {
    if (isPending) return
    setFeedback('')
    setErrorMsg('')
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = feedback.trim()
    if (!trimmed) {
      setErrorMsg('Vui lòng nêu rõ lý do và nội dung cần chỉnh sửa!')
      return
    }
    setErrorMsg('')
    onConfirm(item.publicId, trimmed, decision)
  }

  return (
    <div
      id="rejectModal"
      className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) handleClose()
      }}
    >
      <form
        noValidate
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl w-full max-w-[680px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-slate-900">
            {decision === 'REJECTED'
              ? 'Đánh giá Không đạt đề cương'
              : 'Yêu cầu chỉnh sửa đề cương'}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            aria-label="Đóng"
            className="modal-close-btn text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-[13px]">
          <p className="text-slate-600">
            Sinh viên:{' '}
            <b id="rejectStudentName" className="text-slate-900">
              {item.studentName} ({item.studentCode})
            </b>
            <br />
            Đề tài:{' '}
            <span className="font-medium text-slate-800">
              {item.topicName || item.title || '—'}
            </span>
          </p>

          {/* Lựa chọn loại quyết định */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              Kết quả đánh giá:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label
                className={`p-3 border rounded-xl flex items-start gap-2.5 cursor-pointer transition ${
                  decision === 'REQUEST_CHANGES'
                    ? 'border-sky-500 bg-sky-50/70 text-sky-950 ring-1 ring-sky-500'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                } ${isExtendedPeriod ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <input
                  type="radio"
                  name="reviewDecision"
                  value="REQUEST_CHANGES"
                  checked={decision === 'REQUEST_CHANGES'}
                  onChange={() => setDecision('REQUEST_CHANGES')}
                  disabled={isExtendedPeriod}
                  className="mt-0.5 text-sky-600"
                />
                <div>
                  <div className="font-bold text-[13px]">Yêu cầu chỉnh sửa (REQUEST_CHANGES)</div>
                  <div className="text-[11.5px] text-slate-500 mt-0.5">
                    Cho phép sinh viên sửa đổi và nộp lại đề cương trong hạn.
                  </div>
                </div>
              </label>

              <label
                className={`p-3 border rounded-xl flex items-start gap-2.5 cursor-pointer transition ${
                  decision === 'REJECTED'
                    ? 'border-rose-500 bg-rose-50/70 text-rose-950 ring-1 ring-rose-500'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                } ${!isExtendedPeriod ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <input
                  type="radio"
                  name="reviewDecision"
                  value="REJECTED"
                  checked={decision === 'REJECTED'}
                  onChange={() => setDecision('REJECTED')}
                  disabled={!isExtendedPeriod}
                  className="mt-0.5 text-rose-600"
                />
                <div>
                  <div className="font-bold text-[13px]">Không đạt (REJECTED)</div>
                  <div className="text-[11.5px] text-slate-500 mt-0.5">
                    Áp dụng khi gia hạn chấm. Sinh viên sẽ bị dừng đồ án trong kỳ.
                  </div>
                </div>
              </label>
            </div>
            {isExtendedPeriod ? (
              <p className="text-[11.5px] text-amber-700 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Đang trong thời gian gia hạn chấm — Backend chỉ cho phép chọn Đạt hoặc Không đạt.
              </p>
            ) : (
              <p className="text-[11.5px] text-slate-500 mt-1.5 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                Trong thời gian nhận bài — Chọn &ldquo;Yêu cầu chỉnh sửa&rdquo; để sinh viên nộp lại bản sửa.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="rejectFeedbackInput"
              className="block text-slate-700 font-semibold mb-1"
            >
              Ý kiến nhận xét &amp; Yêu cầu sửa đổi{' '}
              <span className="text-rose-600 font-bold">* (bắt buộc)</span>:
            </label>
            <textarea
              id="rejectFeedbackInput"
              rows={5}
              value={feedback}
              onChange={(e) => {
                setFeedback(e.target.value)
                if (errorMsg) setErrorMsg('')
              }}
              placeholder="Nêu rõ các phần chưa đạt yêu cầu cần sinh viên bổ sung (VD: Bổ sung kiến trúc phân tầng, làm rõ thuật toán đề xuất...)"
              className="w-full min-h-[130px] p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] outline-none focus:border-rose-500 focus:bg-white transition resize-y"
            />
            {errorMsg && (
              <div id="rejectErrorMsg" className="text-[12px] text-rose-600 font-semibold mt-1">
                {errorMsg}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="modal-close-btn h-8 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-[12px] font-bold hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            id="btnConfirmReject"
            disabled={isPending}
            className={`h-8 px-4 rounded-lg text-white text-[12px] font-bold transition cursor-pointer shadow-xs disabled:opacity-60 flex items-center gap-1.5 ${
              decision === 'REJECTED'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-sky-600 hover:bg-sky-700'
            }`}
          >
            {isPending
              ? 'Đang lưu...'
              : decision === 'REJECTED'
                ? 'Xác nhận Không đạt'
                : 'Gửi yêu cầu sửa'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ============================================================================
// 3. MODAL GÓP Ý NHẬN XÉT ĐỀ CƯƠNG (GVHD)
// ============================================================================
interface OutlineFeedbackModalProps {
  item: ThesisOutlineResponse | null
  initialValue?: string
  onClose: () => void
  onSave: (publicId: string, feedback: string) => Promise<void> | void
  isPending?: boolean
}

export const OutlineFeedbackModal: React.FC<OutlineFeedbackModalProps> = ({
  item,
  initialValue = '',
  onClose,
  onSave,
  isPending = false,
}) => {
  const [content, setContent] = useState(initialValue || item?.advisorFeedback || '')
  const [errorMsg, setErrorMsg] = useState('')

  if (!item) return null

  const handleClose = () => {
    if (isPending) return
    setErrorMsg('')
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) {
      setErrorMsg('Vui lòng nhập nội dung góp ý đề cương!')
      return
    }
    setErrorMsg('')
    onSave(item.publicId, trimmed)
  }

  return (
    <div
      id="feedbackModal"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) handleClose()
      }}
    >
      <form
        noValidate
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl w-full max-w-[680px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" /> Góp ý nhận xét đề cương (GVHD)
          </h3>
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            aria-label="Đóng"
            className="modal-close-btn text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-[13px]">
          <div className="space-y-1">
            <div>
              <span className="text-slate-500">Sinh viên:</span>{' '}
              <b id="feedbackStudentName" className="text-slate-800">
                {item.studentName} ({item.studentCode})
              </b>
            </div>
            <div className="text-[12.5px] text-slate-700">
              <span className="text-slate-500 font-medium">Đề tài:</span>{' '}
              <span id="feedbackTopicName" className="font-medium text-slate-900">
                {item.topicName || item.title || '—'}
              </span>
            </div>
            {item.reviewFeedback && (
              <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px]">
                <div className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Nhận xét của Giảng viên Thẩm định ({item.reviewerName || 'GVNX'}):
                </div>
                <p className="text-slate-600 italic leading-relaxed">
                  &ldquo;{item.reviewFeedback}&rdquo;
                </p>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="feedbackContentInput"
              className="block text-slate-700 font-semibold mb-1.5"
            >
              Ý kiến góp ý của Giảng viên hướng dẫn{' '}
              <span className="text-rose-600 font-bold">* (bắt buộc)</span>:
            </label>
            <textarea
              id="feedbackContentInput"
              rows={6}
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                if (errorMsg) setErrorMsg('')
              }}
              placeholder="Nhập nhận xét góp ý đề cương gửi cho sinh viên (VD: Thầy đã xem qua đề cương, phần phân tích yêu cầu làm tốt, em cần bổ sung thêm chương công nghệ...)"
              className="w-full min-h-[140px] p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] outline-none focus:border-blue-500 focus:bg-white transition resize-y"
            />
            {errorMsg && (
              <div className="text-[12px] text-rose-600 font-semibold mt-1">
                {errorMsg}
              </div>
            )}
            <p className="text-[11.5px] text-slate-500 mt-1 italic">
              Nhận xét này sẽ được gửi trực tiếp đến sinh viên qua thông báo hệ thống và hiển thị trong hồ sơ đồ án.
            </p>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="modal-close-btn h-8 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-[12px] font-bold hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            id="btnSaveFeedback"
            disabled={isPending}
            className="h-8 px-4 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] text-white text-[12px] font-bold transition cursor-pointer shadow-xs disabled:opacity-60 flex items-center gap-1.5"
          >
            {isPending ? 'Đang lưu...' : 'Lưu nhận xét'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ============================================================================
// 4. MODAL LỊCH SỬ NỘP ĐỀ CƯƠNG (CẢ GVHD VÀ GVNX ĐỀU XEM ĐƯỢC)
// ============================================================================
interface OutlineHistoryModalProps {
  item: ThesisOutlineResponse | null
  showReasonColumn?: boolean
  onClose: () => void
  onPreviewFile?: (target: ThesisOutlineResponse) => void
}

export const OutlineHistoryModal: React.FC<OutlineHistoryModalProps> = ({
  item,
  showReasonColumn = true,
  onClose,
  onPreviewFile,
}) => {
  const detailQuery = useOutlineDetail(item?.publicId)
  const detailData = detailQuery.data || item

  if (!item) return null

  const histories = detailData?.histories && detailData.histories.length > 0
    ? detailData.histories
    : [
        {
          publicId: item.publicId,
          outlineHistoryFile: item.outlineFile || '',
          submissionNote: null,
          status: item.status || 'PENDING',
          statusDescription: item.statusDescription || 'Đã nộp',
          submittedAt: item.submittedAt || '',
          reviewerName: item.reviewerName,
          reviewFeedback: item.reviewFeedback,
          reviewedAt: item.reviewedAt,
        } as ThesisOutlineHistoryResponse,
      ]

  return (
    <div
      id="submissionHistoryModal"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-[15px] font-bold text-slate-900" id="histModalStudentName">
              Lịch sử các lần nộp đề cương — {item.studentName} ({item.studentCode})
            </h3>
            <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-1" id="histModalTopicName">
              Đề tài: {item.topicName || item.title || '—'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="modal-close-btn text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {detailQuery.isLoading ? (
            <div className="space-y-3 py-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-[12.5px]">
                <thead className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-20">LẦN NỘP</th>
                    <th className="px-4 py-3 w-40">THỜI GIAN NỘP</th>
                    <th className="px-4 py-3 min-w-[200px]">FILE ĐỀ CƯƠNG</th>
                    <th className="px-4 py-3 w-36">TRẠNG THÁI</th>
                    {showReasonColumn && (
                      <th className="px-4 py-3 min-w-[240px]" id="thHistReason">
                        Ý KIẾN ĐÁNH GIÁ (GVNX)
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody id="histModalTableBody" className="divide-y divide-slate-100 bg-white">
                  {histories.map((h: ThesisOutlineHistoryResponse, i: number) => {
                    const isApproved = h.status === 'APPROVED'
                    const isChanges = h.status === 'REQUEST_CHANGES'
                    const isRejected = h.status === 'REJECTED'
                    const fileName = getFileNameFromUrl(h.outlineHistoryFile)
                    const submitNumber = histories.length - i

                    return (
                      <tr
                        key={h.publicId || `${submitNumber}-${i}`}
                        className="hover:bg-slate-50/70 transition"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-700">
                          Lần {submitNumber}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap text-xs">
                          {formatDate(h.submittedAt, 'full')}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {h.outlineHistoryFile ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={h.outlineHistoryFile}
                                target="_blank"
                                rel="noreferrer"
                                className="font-bold text-[12px] text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                                title="Mở file trên trình duyệt"
                              >
                                <Download className="w-3.5 h-3.5 text-blue-500" />
                                {fileName}
                              </a>
                              {onPreviewFile && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose()
                                    onPreviewFile({
                                      ...item,
                                      outlineFile: h.outlineHistoryFile,
                                    })
                                  }}
                                  className="text-slate-400 hover:text-blue-600 p-1"
                                  title="Xem trước"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Không có file</span>
                          )}
                          {h.submissionNote && (
                            <div className="text-[11.5px] text-slate-500 mt-1 italic">
                              Ghi chú: &ldquo;{h.submissionNote}&rdquo;
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isApproved
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isChanges
                                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                  : isRejected
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {h.statusDescription || h.status}
                          </span>
                          {h.reviewedAt && (
                            <div className="text-[10.5px] text-slate-400 font-mono mt-0.5">
                              {formatDate(h.reviewedAt, 'full')}
                            </div>
                          )}
                        </td>
                        {showReasonColumn && (
                          <td className="px-4 py-3 text-slate-700 leading-snug">
                            {h.reviewFeedback ? (
                              <div>
                                <div className="text-xs text-slate-800">
                                  {h.reviewFeedback}
                                </div>
                                {h.reviewerName && (
                                  <div className="text-[11px] text-slate-400 mt-0.5">
                                    Bởi: {h.reviewerName}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
