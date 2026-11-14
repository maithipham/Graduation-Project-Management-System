import React from 'react';
import type { ScheduleEventItem } from '../types';

interface ScheduleTableProps {
  events: ScheduleEventItem[];
  editedEvents: Map<string, { start: string; end: string; rawStart: string; rawEnd: string }>;
  onDateChange: (eventId: string, field: 'start' | 'end', rawValue: string) => void;
  onResetRow: (eventId: string) => void;
  onSaveRow: (event: ScheduleEventItem) => void;
  loading: boolean;
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({
  events,
  editedEvents,
  onDateChange,
  onResetRow,
  onSaveRow,
  loading,
}) => {
  // Chuẩn hóa datetime sang định dạng "YYYY-MM-DDTHH:mm" cho input datetime-local (không qua Date timezone)
  const toDateTimeLocal = (val: string | null | undefined): string => {
    if (!val) return '';
    const str = val.replace(' ', 'T');
    return str.length >= 16 ? str.slice(0, 16) : str;
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500 bg-white">
        <div className="animate-spin inline-block w-6 h-6 border-2 border-[#1565C0] border-t-transparent rounded-full mb-2"></div>
        <p className="text-xs font-medium text-slate-600">Đang tải kế hoạch mốc thời gian...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400 bg-white">
        <p className="text-sm font-medium">Chưa có mốc sự kiện nào trong giai đoạn này.</p>
        <p className="text-xs text-slate-400 mt-1">Hệ thống sẽ đồng bộ mốc thời hạn tự động theo quy trình đồ án.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white">
      <table className="w-full text-left text-[13px] border-collapse min-w-[880px]">
        <thead>
          <tr className="bg-slate-50/70 text-slate-600 text-[11.5px] font-bold uppercase tracking-wider border-b border-slate-100">
            <th className="w-16 px-4 py-3 text-center">STT</th>
            <th className="px-6 py-3 min-w-[280px]">MỐC SỰ KIỆN</th>
            <th className="px-5 py-3 w-[215px]">THỜI GIAN BẮT ĐẦU</th>
            <th className="px-5 py-3 w-[215px]">THỜI GIAN KẾT THÚC</th>
            <th className="w-28 px-3 py-3 text-center"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {events.map((item, index) => {
            const edited = editedEvents.get(item.id);
            const currentRawStart = edited ? edited.rawStart : item.rawStart;
            const currentRawEnd = edited ? edited.rawEnd : item.rawEnd;
            const isRowEdited = Boolean(edited);

            return (
              <tr
                key={item.id}
                className={`hover:bg-slate-50/80 transition duration-150 ${
                  isRowEdited ? 'bg-blue-50/20' : ''
                }`}
              >
                {/* 1. STT */}
                <td className="w-16 px-4 py-3.5 text-center font-semibold text-slate-400 text-xs">
                  {index + 1}
                </td>

                {/* 2. Tên mốc sự kiện */}
                <td className="px-6 py-3.5">
                  <div className="font-semibold text-slate-800 text-[13px] leading-snug">
                    {item.name}
                  </div>
                  {item.description && (
                    <div className="text-[11.5px] text-slate-400 mt-0.5 leading-relaxed">
                      {item.description}
                    </div>
                  )}
                </td>

                {/* 3. Thời gian bắt đầu */}
                <td className="px-5 py-3.5">
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={toDateTimeLocal(currentRawStart)}
                      onChange={(e) => onDateChange(item.id, 'start', e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-mono font-medium text-slate-700 focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 shadow-2xs transition"
                    />
                  </div>
                </td>

                {/* 4. Thời gian kết thúc */}
                <td className="px-5 py-3.5">
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={toDateTimeLocal(currentRawEnd)}
                      onChange={(e) => onDateChange(item.id, 'end', e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-mono font-medium text-slate-700 focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 shadow-2xs transition"
                    />
                  </div>
                </td>

                {/* 5. Cột thao tác: Cụm nút thuần chữ Lưu / Hủy xuất hiện khi có thay đổi */}
                <td className="w-28 px-3 py-3.5 text-center whitespace-nowrap">
                  {isRowEdited ? (
                    <div className="flex items-center justify-center gap-1.5 animate-in fade-in duration-150">
                      <button
                        type="button"
                        onClick={() => onResetRow(item.id)}
                        className="h-8 px-2.5 rounded-lg text-slate-500 hover:text-slate-800 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={() => onSaveRow(item)}
                        className="h-8 px-3 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        Lưu
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-300 font-mono">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

