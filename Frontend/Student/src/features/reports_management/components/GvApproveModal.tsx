import React, { useState } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import type { StudentReportSubmissionItem } from '../types/reports.types'

interface GvApproveModalProps {
  open: boolean
  item: StudentReportSubmissionItem | null
  studentName: string
  studentMssv: string
  onClose: () => void
  onConfirmApprove: (id: number, comment: string) => void
}

export const GvApproveModal: React.FC<GvApproveModalProps> = ({
  open,
  item,
  studentName,
  studentMssv,
  onClose,
  onConfirmApprove,
}) => {
  const [comment, setComment] = useState<string>(
    'Báo cáo tiến độ đạt chất lượng tốt, sinh viên hoàn thành đúng kế hoạch.',
  )

  const [prevOpen, setPrevOpen] = useState(open)
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (open) {
      setComment(
        item?.note && item.note.includes('Báo cáo tiến độ')
          ? item.note
          : 'Báo cáo tiến độ đạt chất lượng tốt, sinh viên hoàn thành đúng kế hoạch.',
      )
    }
  }

  if (!open || !item) return null

  const rate = item.plagiarismRate ?? 18
  const isPassing = rate <= 35

  const handleConfirm = () => {
    onConfirmApprove(
      item.id,
      comment.trim() ||
        'Báo cáo tiến độ đạt chất lượng tốt, sinh viên hoàn thành đúng kế hoạch.',
    )
    onClose()
  }

  return (
    <div
      id="gvApproveModal"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-emerald-50/60">
          <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Xác nhận phê duyệt báo cáo đồ án
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="gv-modal-close-btn text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-[13px]">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Sinh viên:</span>
              <b id="gvApproveStudentName" className="text-slate-900">
                {studentName}
              </b>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Mã sinh viên:</span>
              <span
                id="gvApproveStudentMssv"
                className="font-mono font-bold text-slate-800"
              >
                {studentMssv}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Tỷ lệ trùng lặp:</span>
              <span
                id="gvApprovePlagiarismRate"
                className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                  isPassing
                    ? 'text-emerald-700 bg-emerald-100'
                    : 'text-amber-700 bg-amber-100'
                }`}
              >
                Trùng: {rate}% ({isPassing ? 'Hợp lệ ≤ 35%' : 'Cần lưu ý > 35%'})
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              Nhận xét / Đánh giá của GVHD:
            </label>
            <textarea
              id="gvApproveCommentInput"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Báo cáo tiến độ đạt chất lượng tốt, sinh viên hoàn thành đúng kế hoạch..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="gv-modal-close-btn h-8 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-[12px] font-bold hover:bg-slate-50 transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            id="btnGvConfirmApprove"
            onClick={handleConfirm}
            className="h-8 px-4 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white text-[12px] font-bold transition cursor-pointer shadow-xs"
          >
            Xác nhận duyệt
          </button>
        </div>
      </div>
    </div>
  )
}

