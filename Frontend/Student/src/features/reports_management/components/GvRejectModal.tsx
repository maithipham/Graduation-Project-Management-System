import React, { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import type { StudentReportSubmissionItem } from '../types/reports.types'

interface GvRejectModalProps {
  open: boolean
  item: StudentReportSubmissionItem | null
  studentName: string
  studentMssv: string
  onClose: () => void
  onConfirmReject: (id: number, reason: string) => void
}

export const GvRejectModal: React.FC<GvRejectModalProps> = ({
  open,
  item,
  studentName,
  studentMssv,
  onClose,
  onConfirmReject,
}) => {
  const [reason, setReason] = useState<string>(
    'Tỷ lệ trùng lặp vượt quy định, yêu cầu sinh viên viết lại nội dung và bổ sung trích dẫn.',
  )
  const [error, setError] = useState<string>('')

  const [prevOpen, setPrevOpen] = useState(open)
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (open) {
      setReason(
        item?.note && item.note.includes('Tỷ lệ trùng lặp')
          ? item.note
          : 'Tỷ lệ trùng lặp vượt quy định, yêu cầu sinh viên viết lại nội dung và bổ sung trích dẫn.',
      )
      setError('')
    }
  }

  if (!open || !item) return null

  const rate = item.plagiarismRate ?? 42

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do từ chối & yêu cầu chỉnh sửa.')
      return
    }
    onConfirmReject(item.id, reason.trim())
    onClose()
  }

  return (
    <div
      id="gvRejectModal"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50/60">
          <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            Từ chối báo cáo đồ án
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
              <b id="gvRejectStudentName" className="text-slate-900">
                {studentName}
              </b>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Mã sinh viên:</span>
              <span
                id="gvRejectStudentMssv"
                className="font-mono font-bold text-slate-800"
              >
                {studentMssv}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Tỷ lệ trùng lặp:</span>
              <span
                id="gvRejectPlagiarismRate"
                className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full text-xs"
              >
                Trùng: {rate}% ({rate > 35 ? 'Vượt ngưỡng > 35%' : 'Không đạt'})
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              Lý do từ chối & Yêu cầu chỉnh sửa: <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="gvRejectCommentInput"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                if (error) setError('')
              }}
              placeholder="Tỷ lệ trùng lặp vượt quy định, yêu cầu sinh viên viết lại nội dung và bổ sung trích dẫn..."
              className={`w-full text-xs p-3 rounded-xl border ${
                error ? 'border-rose-500' : 'border-slate-200'
              } bg-white placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition resize-none`}
            />
            {error && (
              <p className="text-[11.5px] text-rose-600 mt-1">{error}</p>
            )}
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
            id="btnGvConfirmReject"
            onClick={handleConfirm}
            className="h-8 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-bold transition cursor-pointer shadow-xs"
          >
            Xác nhận từ chối
          </button>
        </div>
      </div>
    </div>
  )
}

