import React from 'react';
import { CalendarCheck2, X } from 'lucide-react';

interface ConfirmSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  eventName: string;
  startDateDisplay: string;
  endDateDisplay: string;
  isSaving: boolean;
}

export const ConfirmSaveModal: React.FC<ConfirmSaveModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  eventName,
  startDateDisplay,
  endDateDisplay,
  isSaving,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <h3 className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck2 className="w-5 h-5 text-[#1565C0]" />
            <span>Xác nhận thiết lập mốc thời gian</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-[13px] text-slate-600 space-y-4">
          <p>Bạn có chắc chắn muốn lưu mốc thời gian này cho tiến độ đợt đồ án?</p>

          <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3.5 space-y-2">
            <div className="font-bold text-slate-900 text-sm">
              {eventName}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-blue-100">
              <div>
                <span className="text-slate-500 block mb-0.5">Thời gian bắt đầu:</span>
                <span className="font-bold text-[#1565C0] font-mono text-[12.5px]">
                  {startDateDisplay || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Thời gian kết thúc:</span>
                <span className="font-bold text-[#1565C0] font-mono text-[12.5px]">
                  {endDateDisplay || '—'}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 italic">
            * Sau khi lưu, mốc thời gian này sẽ được áp dụng cho toàn bộ giảng viên và sinh viên tham gia đợt đồ án.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="h-9 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer transition disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="h-9 px-5 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? 'Đang lưu...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
};

