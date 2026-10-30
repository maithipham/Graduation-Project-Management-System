import React from 'react'
import { X } from 'lucide-react'
import type { SupervisorRequestItem } from '../types/supervisorRegistration.types'

interface ApproveSupervisorModalProps {
  item: SupervisorRequestItem | null
  onClose: () => void
  onConfirm: (id: string) => void
}

export const ApproveSupervisorModal: React.FC<ApproveSupervisorModalProps> = ({
  item,
  onClose,
  onConfirm,
}) => {
  if (!item) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      style={{
        fontFamily:
          '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[560px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <h3 className="text-[16px] font-bold text-slate-900">
            Xác nhận phê duyệt đơn đăng ký
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 sm:p-7 space-y-4 text-[13.5px]">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-slate-800 leading-relaxed space-y-1.5">
            <div>Bạn có chắc chắn muốn phê duyệt đơn đăng ký hướng dẫn của sinh viên:</div>
            <div className="text-[15px] font-bold text-emerald-950 flex items-center gap-2">
              <span>{item.name}</span>
              <span className="text-[12px] font-mono text-emerald-700 font-semibold">
                ({item.mssv})
              </span>
            </div>
            <div className="text-[12.5px] text-slate-600 pt-1 border-t border-emerald-200/60">
              Đề tài:{' '}
              <span className="font-medium text-slate-800">
                {item.topic || 'Chưa có tên đề tài cụ thể'}
              </span>
            </div>
          </div>
          <p className="text-slate-500 text-[12.5px] italic">
            Sau khi duyệt, sinh viên sẽ được chính thức ghi nhận vào danh sách hướng dẫn của bạn
            trong học kỳ này.
          </p>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-[12px] font-bold hover:bg-slate-50 transition cursor-pointer"
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

interface RejectSupervisorModalProps {
  item: SupervisorRequestItem | null
  onClose: () => void
  onConfirm: (id: string, reason?: string) => void
}

export const RejectSupervisorModal: React.FC<RejectSupervisorModalProps> = ({
  item,
  onClose,
  onConfirm,
}) => {
  if (!item) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      style={{
        fontFamily:
          '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[560px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <h3 className="text-[16px] font-bold text-slate-900">
            Xác nhận từ chối đơn đăng ký
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 sm:p-7 space-y-4 text-[13.5px]">
          <div className="p-4 bg-rose-50/70 border border-rose-200/80 rounded-xl text-slate-800 leading-relaxed space-y-1.5">
            <div>Bạn có chắc chắn muốn từ chối đơn đăng ký hướng dẫn của sinh viên:</div>
            <div className="text-[15px] font-bold text-rose-950 flex items-center gap-2">
              <span>{item.name}</span>
              <span className="text-[12px] font-mono text-rose-700 font-semibold">
                ({item.mssv})
              </span>
            </div>
            <div className="text-[12.5px] text-slate-600 pt-1 border-t border-rose-200/60">
              Đề tài:{' '}
              <span className="font-medium text-slate-800">
                {item.topic || 'Chưa có tên đề tài cụ thể'}
              </span>
            </div>
          </div>
          <p className="text-slate-500 text-[12.5px] italic">
            Sau khi từ chối, sinh viên sẽ nhận được thông báo để chọn lại nguyện vọng hướng dẫn khác.
          </p>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-[12px] font-bold hover:bg-slate-50 transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            id="btnConfirmReject"
            onClick={() => onConfirm(item.id)}
            className="h-8 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-bold transition cursor-pointer shadow-xs"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  )
}
