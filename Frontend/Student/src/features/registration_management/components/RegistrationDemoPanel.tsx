import React from 'react'
import {
  BadgeCheck,
  Check,
  FileText,
  Hourglass,
  Lightbulb,
  RotateCcw,
  UserX,
  X,
} from 'lucide-react'
import type { SupervisorRegistrationItem } from '../types/registration.types'

interface RegistrationDemoPanelProps {
  studentName: string
  studentMssv: string
  studentClass: string
  mentor: string
  assignedByTbm: boolean
  hasApprovedRequest: boolean
  isLatestRejected: boolean
  pendingRequest?: SupervisorRegistrationItem
  reasonDraft: string
  onReasonDraftChange: (val: string) => void
  onApproveGvhd: () => void
  onRejectGvhd: () => void
  onApproveTbm: () => void
  onRejectAndAssignTbm: () => void
  onResetDemo: () => void
}

export const RegistrationDemoPanel: React.FC<RegistrationDemoPanelProps> = ({
  studentName,
  studentMssv,
  studentClass,
  mentor,
  assignedByTbm,
  hasApprovedRequest,
  isLatestRejected,
  pendingRequest,
  reasonDraft,
  onReasonDraftChange,
  onApproveGvhd,
  onRejectGvhd,
  onApproveTbm,
  onRejectAndAssignTbm,
  onResetDemo,
}) => {
  return (
    <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-5 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-amber-500 text-white text-[10px] font-extrabold tracking-wider">
            DEMO
          </span>
          <h3 className="text-sm font-bold text-slate-900">
            Giả lập duyệt đơn 2 cấp (GVHD duyệt → TBM duyệt / từ chối &amp; gán)
          </h3>
        </div>
        <button
          type="button"
          onClick={onResetDemo}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <RotateCcw size={14} />
          <span>Đặt lại demo</span>
        </button>
      </div>

      {pendingRequest && pendingRequest.subStatus === 'pending_gvhd' ? (
        <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-full bg-blue-50 text-[#1565C0] flex items-center justify-center shrink-0">
              <FileText size={16} />
            </span>
            <div className="text-xs space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-100 text-amber-800">
                  BƯỚC 1: PHÍA GIẢNG VIÊN HƯỚNG DẪN
                </span>
                <span className="text-slate-400">
                  · Trạng thái sinh viên nhìn thấy:{' '}
                  <strong className="text-[#1565C0]">Đang xử lý</strong>
                </span>
              </div>
              <div className="font-bold text-slate-900 text-sm">
                {studentName}{' '}
                <span className="font-medium text-slate-500">
                  · {studentMssv} · {studentClass}
                </span>
              </div>
              <div className="text-slate-700">
                <span className="font-semibold">Đề tài dự kiến:</span>{' '}
                {pendingRequest.topic ? (
                  pendingRequest.topic
                ) : (
                  <span className="text-slate-400 italic">Chưa có tên đề tài</span>
                )}
              </div>
              <div className="text-slate-500">
                Gửi đến GV:{' '}
                <span className="font-semibold text-slate-800">{pendingRequest.lecturer}</span> ·
                lúc {pendingRequest.time}
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="demoReasonInput"
              className="block text-[11px] font-semibold text-slate-600 mb-1"
            >
              Lời nhắn / phản hồi của giảng viên
            </label>
            <input
              id="demoReasonInput"
              type="text"
              value={reasonDraft}
              onChange={(e) => onReasonDraftChange(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#1565C0]/30 focus:border-[#1565C0]"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={onApproveGvhd}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
            >
              <Check size={14} />
              <span>GVHD duyệt đơn (Đồng ý hướng dẫn)</span>
            </button>
            <button
              type="button"
              onClick={onRejectGvhd}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer shadow-xs"
            >
              <X size={14} />
              <span>GVHD từ chối đơn</span>
            </button>
          </div>
        </div>
      ) : pendingRequest && pendingRequest.subStatus === 'pending_tbm' ? (
        <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Hourglass size={16} />
            </span>
            <div className="text-xs space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-blue-100 text-[#1565C0]">
                  BƯỚC 2: PHÍA TRƯỞNG BỘ MÔN (TBM)
                </span>
                <span className="text-slate-400">
                  · Trạng thái sinh viên nhìn thấy:{' '}
                  <strong className="text-[#1565C0]">Đang xử lý</strong>
                </span>
              </div>
              <div className="text-slate-700">
                Giảng viên <strong className="text-slate-900">{pendingRequest.lecturer}</strong> đã
                đồng ý tiếp nhận sinh viên{' '}
                <strong className="text-slate-900">{studentName}</strong>.
              </div>
              <div className="text-slate-500">
                Trưởng bộ môn xem xét phê duyệt hoặc từ chối để phân công giảng viên khác.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={onApproveTbm}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
            >
              <BadgeCheck size={14} />
              <span>TBM phê duyệt đơn</span>
            </button>
            <button
              type="button"
              onClick={onRejectAndAssignTbm}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer shadow-xs"
            >
              <UserX size={14} />
              <span>TBM từ chối &amp; gán GVHD khác</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-white/70 border border-dashed border-slate-300 p-4 text-xs text-slate-600 flex items-start gap-2.5 leading-relaxed">
          <Lightbulb size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <span>
            {assignedByTbm ? (
              <>
                <strong className="font-bold text-slate-700">
                  Trưởng bộ môn đã từ chối đơn đề xuất và phân công GVHD khác:
                </strong>{' '}
                Sinh viên thấy đơn trạng thái{' '}
                <strong className="font-bold text-slate-700">&quot;Đã từ chối&quot;</strong>, và mục
                Giảng viên hướng dẫn phía trên đã cập nhật tên{' '}
                <strong className="font-bold text-slate-700">{mentor}</strong>.
              </>
            ) : hasApprovedRequest ? (
              <>
                <strong className="font-bold text-slate-700">
                  Đơn đã được phê duyệt thành công:
                </strong>{' '}
                Sinh viên thấy trạng thái{' '}
                <strong className="font-bold text-slate-700">&quot;Đã duyệt&quot;</strong> và mục
                Giảng viên hướng dẫn hiển thị tên chính thức{' '}
                <strong className="font-bold text-slate-700">{mentor}</strong>.
              </>
            ) : isLatestRejected ? (
              <>
                <strong className="font-bold text-slate-700">Đơn đã bị GVHD từ chối:</strong> Sinh
                viên thấy trạng thái{' '}
                <strong className="font-bold text-slate-700">&quot;Đã từ chối&quot;</strong>, có thể
                bấm &quot;Tạo đơn đăng ký mới&quot; với giảng viên khác.
              </>
            ) : (
              <>
                Hãy bấm nút{' '}
                <strong className="font-bold text-slate-700">“Tạo đơn đăng ký GVHD”</strong> ở trên
                để gửi đơn mới và trải nghiệm quy trình 2 cấp duyệt (GVHD duyệt → TBM duyệt/từ
                chối).
              </>
            )}
          </span>
        </div>
      )}
    </div>
  )
}

