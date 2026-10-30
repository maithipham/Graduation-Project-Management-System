import React, { useState } from 'react'
import { MessageSquare, X } from 'lucide-react'
import type { OutlineReviewItem, OutlineSubmissionHistoryEntry } from '../types/outlineReview.types'

interface ApproveOutlineModalProps {
  item: OutlineReviewItem | null
  onClose: () => void
  onConfirm: (id: string) => void
}

export const ApproveOutlineModal: React.FC<ApproveOutlineModalProps> = ({
  item,
  onClose,
  onConfirm,
}) => {
  if (!item) return null

  return (
    <div
      id="approveModal"
      className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[580px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-slate-900">
            Xác nhận phê duyệt đề cương
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="modal-close-btn w-9 h-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-7 space-y-4 text-[13.5px]">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-slate-800 leading-relaxed space-y-1.5">
            <div>Bạn có chắc chắn muốn phê duyệt đề cương của sinh viên:</div>
            <div className="text-[15px] font-bold text-emerald-950 flex items-center gap-2">
              <span id="approveStudentName">{item.name}</span>
              <span
                id="approveStudentMssv"
                className="text-[12px] font-mono text-emerald-700 font-semibold"
              >
                {item.mssv ? `(${item.mssv})` : ''}
              </span>
            </div>
            <div
              id="approveStudentTopicWrap"
              className="text-[12.5px] text-slate-600 pt-1 border-t border-emerald-200/60"
            >
              Đề tài:{' '}
              <span id="approveStudentTopic" className="font-medium text-slate-800">
                {item.topic || 'Chưa có tên đề tài cụ thể'}
              </span>
            </div>
          </div>
          <p className="text-slate-500 text-[12.5px] italic">
            Sau khi duyệt, đề cương sẽ được xác nhận thông qua và sinh viên đủ điều kiện triển khai
            khóa luận chính thức.
          </p>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn h-8 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-[12px] font-bold hover:bg-slate-50 transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            id="btnConfirmApprove"
            onClick={() => onConfirm(item.id)}
            className="h-8 px-4 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white text-[12px] font-bold transition cursor-pointer shadow-xs"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  )
}

interface RejectOutlineModalProps {
  item: OutlineReviewItem | null
  onClose: () => void
  onConfirm: (id: string, feedback: string) => void
}

export const RejectOutlineModal: React.FC<RejectOutlineModalProps> = ({
  item,
  onClose,
  onConfirm,
}) => {
  const [feedback, setFeedback] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  if (!item) return null

  const handleClose = () => {
    setFeedback('')
    setErrorMsg('')
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = feedback.trim()
    if (!trimmed) {
      setErrorMsg('Vui lòng nhập rõ yêu cầu sửa đổi trước khi từ chối!')
      return
    }
    setErrorMsg('')
    onConfirm(item.id, trimmed)
    setFeedback('')
  }

  return (
    <div
      id="rejectModal"
      className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <form
        noValidate
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl w-full max-w-[680px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-slate-900">
            Yêu cầu nộp lại
          </h3>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Đóng"
            className="modal-close-btn text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-[13px]">
          <p className="text-slate-600">
            Từ chối đề cương của sinh viên{' '}
            <b id="rejectStudentName" className="text-slate-900">
              {item.name}
            </b>{' '}
            và yêu cầu chỉnh sửa lại?
          </p>
          <div>
            <label
              htmlFor="rejectFeedbackInput"
              className="block text-slate-700 font-semibold mb-1"
            >
              Nhập lý do từ chối và yêu cầu sinh viên chỉnh sửa đề cương{' '}
              <span className="text-rose-600 font-bold">* (bắt buộc)</span>:
            </label>
            <textarea
              id="rejectFeedbackInput"
              rows={6}
              value={feedback}
              onChange={(e) => {
                setFeedback(e.target.value)
                if (errorMsg) setErrorMsg('')
              }}
              placeholder="Nêu rõ các phần chưa đạt yêu cầu bắt buộc sinh viên phải sửa (VD: Mục tiêu nghiên cứu chưa rõ, thiếu mô hình thực nghiệm, bổ sung tài liệu tham khảo...)"
              className="w-full min-h-[150px] p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] outline-none focus:border-rose-500 focus:bg-white transition resize-y"
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
            className="modal-close-btn h-8 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-[12px] font-bold hover:bg-slate-50 transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            id="btnConfirmReject"
            className="h-8 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-bold transition cursor-pointer shadow-xs"
          >
            Xác nhận
          </button>
        </div>
      </form>
    </div>
  )
}

interface OutlineFeedbackModalProps {
  item: OutlineReviewItem | null
  initialValue: string
  onClose: () => void
  onSave: (id: string, feedback: string) => void
}

export const OutlineFeedbackModal: React.FC<OutlineFeedbackModalProps> = ({
  item,
  initialValue,
  onClose,
  onSave,
}) => {
  const [content, setContent] = useState(initialValue)

  if (!item) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(item.id, content)
  }

  return (
    <div
      id="feedbackModal"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <form
        noValidate
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl w-full max-w-[680px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" /> Nhận xét đề cương
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="modal-close-btn text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-[13px]">
          <div className="space-y-1">
            <div>
              <span className="text-slate-500">Sinh viên:</span>{' '}
              <b id="feedbackStudentName" className="text-slate-800">
                {item.name} ({item.mssv})
              </b>
            </div>
            <div className="text-[12.5px] text-slate-700">
              <span className="text-slate-500 font-medium">Đề tài:</span>{' '}
              <span id="feedbackTopicName" className="font-medium text-slate-900">
                {item.topic || '—'}
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="feedbackContentInput"
              className="block text-slate-700 font-semibold mb-1.5"
            >
              Nội dung nhận xét &amp; Góp ý:
            </label>
            <textarea
              id="feedbackContentInput"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nhận xét chi tiết (VD: Đề cương đã nêu rõ mục tiêu nghiên cứu, cần bổ sung tài liệu tham khảo...)"
              className="w-full min-h-[140px] p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] outline-none focus:border-blue-500 focus:bg-white transition resize-y"
            />
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn h-8 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-[12px] font-bold hover:bg-slate-50 transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            id="btnSaveFeedback"
            className="h-8 px-4 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] text-white text-[12px] font-bold transition cursor-pointer shadow-xs"
          >
            Lưu nhận xét
          </button>
        </div>
      </form>
    </div>
  )
}

interface OutlineHistoryModalProps {
  item: OutlineReviewItem | null
  showReasonColumn: boolean
  onClose: () => void
  onPreviewFile: (item: OutlineReviewItem) => void
}

export const OutlineHistoryModal: React.FC<OutlineHistoryModalProps> = ({
  item,
  showReasonColumn,
  onClose,
  onPreviewFile,
}) => {
  if (!item) return null

  const historyItems =
    item.history && item.history.length > 0
      ? item.history
      : [
          {
            submitIndex: item.submitCount || 1,
            submittedDate: item.submittedDate || '—',
            fileName: item.fileName || '',
            status:
              item.status === 'approved'
                ? 'Đã duyệt'
                : item.status === 'rejected'
                  ? 'Từ chối'
                  : 'Chưa duyệt',
            processedAt: item.approvedAt || item.rejectedAt || '—',
            note: item.status === 'rejected' ? item.feedback || '' : '',
          },
        ]

  return (
    <div
      id="submissionHistoryModal"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-slate-900" id="histModalStudentName">
              Lịch sử nộp đề cương — {item.name} ({item.mssv})
            </h3>
            <p className="text-[12px] text-slate-500 mt-0.5" id="histModalTopicName">
              Đề tài: {item.topic}
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

        <div className="p-6 max-h-[75vh] overflow-y-auto">
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-[12.5px]">
              <thead className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-20">LẦN NỘP</th>
                  <th className="px-4 py-3 w-44">THỜI GIAN NỘP</th>
                  <th className="px-4 py-3 min-w-[200px]">FILE ĐỀ CƯƠNG</th>
                  <th className="px-4 py-3 w-40">TRẠNG THÁI</th>
                  {showReasonColumn && (
                    <th className="px-4 py-3 min-w-[260px]" id="thHistReason">
                      LÝ DO TỪ CHỐI
                    </th>
                  )}
                </tr>
              </thead>
              <tbody id="histModalTableBody" className="divide-y divide-slate-100 bg-white">
                {historyItems.map((h: OutlineSubmissionHistoryEntry, i: number) => {
                  const isApp = h.status === 'Đã duyệt'
                  const isRej = h.status === 'Từ chối' || h.status === 'Đã từ chối'
                  const displayNote = isRej
                    ? h.note || 'Yêu cầu chỉnh sửa lại đề cương.'
                    : '—'
                  const processedTime = h.processedAt || h.approvedAt

                  return (
                    <tr
                      key={`${h.submitIndex}-${i}`}
                      className="hover:bg-slate-50/70 transition"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-600">
                        Lần {h.submitIndex || historyItems.length - i}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 whitespace-nowrap">
                        {h.submittedDate || '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-blue-600">
                        {h.fileName ? (
                          <button
                            type="button"
                            onClick={() => {
                              onClose()
                              onPreviewFile(item)
                            }}
                            className="btn-preview-file font-bold text-[12px] text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                          >
                            {h.fileName}
                          </button>
                        ) : (
                          <span className="text-slate-400 italic">Không có file</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isApp
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isRej
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {h.status || 'Chưa duyệt'}
                        </span>
                        {processedTime && processedTime !== '—' && (
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {processedTime}
                          </div>
                        )}
                      </td>
                      {showReasonColumn && (
                        <td className="px-4 py-3 text-slate-700 leading-snug">{displayNote}</td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
