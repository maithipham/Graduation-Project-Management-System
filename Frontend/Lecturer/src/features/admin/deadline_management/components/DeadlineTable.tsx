import React from 'react';
import type { DeadlineItem } from '../types/deadline.types';

interface DeadlineTableProps {
  deadlines: DeadlineItem[];
  editedDeadlines: Map<string, { startDate: string; endDate: string }>;
  onDateChange: (deadlineId: string, field: 'startDate' | 'endDate', value: string) => void;
  loading: boolean;
}

export const DeadlineTable: React.FC<DeadlineTableProps> = ({
  deadlines,
  editedDeadlines,
  onDateChange,
  loading,
}) => {
  // Format datetime ISO string sang format chuẩn cho input datetime-local: "YYYY-MM-DDTHH:mm"
  const formatDateTimeLocal = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-500 bg-white">
        <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
        <p className="text-sm">Đang tải dữ liệu kế hoạch mốc thời gian...</p>
      </div>
    );
  }

  if (deadlines.length === 0) {
    return (
      <div className="py-16 text-center text-gray-400 bg-white">
        <p className="text-sm font-medium">Chưa có mốc thời gian nào trong giai đoạn này.</p>
        <p className="text-xs text-gray-400 mt-1">Bấm "Khởi tạo mốc theo mẫu" ở góc phải để tạo danh mục mốc chuẩn.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-600 border-b uppercase text-[11px] font-bold tracking-wider">
          <tr>
            <th className="py-3.5 px-4 w-12 text-center">STT</th>
            <th className="py-3.5 px-4">Mốc sự kiện (Deadline)</th>
            <th className="py-3.5 px-4 w-36">Phạm vi</th>
            <th className="py-3.5 px-4 w-64">Thời gian bắt đầu</th>
            <th className="py-3.5 px-4 w-64">Thời gian kết thúc (Hạn chót)</th>
            <th className="py-3.5 px-4 w-32 text-center">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {deadlines.map((item, index) => {
            const edited = editedDeadlines.get(item.deadlineId);
            const currentStartDate = edited ? edited.startDate : item.startDate;
            const currentEndDate = edited ? edited.endDate : item.endDate;

            const isRowEdited = Boolean(edited);
            const isInvalid = new Date(currentStartDate) > new Date(currentEndDate);

            return (
              <tr
                key={item.deadlineId}
                className={`hover:bg-gray-50/80 transition duration-150 ${
                  isRowEdited ? 'bg-amber-50/30 font-medium' : ''
                }`}
              >
                {/* Cột 1: STT */}
                <td className="py-3.5 px-4 text-center font-medium text-gray-500">
                  {index + 1}
                </td>

                {/* Cột 2: Mốc sự kiện & Mô tả */}
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-gray-800 flex items-center gap-2">
                    {item.name}
                    {isRowEdited && (
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-500" title="Có thay đổi chưa lưu" />
                    )}
                  </div>
                  {item.description && (
                    <div className="text-xs text-gray-400 mt-0.5 font-normal">{item.description}</div>
                  )}
                </td>

                {/* Cột 3: Phạm vi (Chung hay Theo ngành) */}
                <td className="py-3.5 px-4">
                  {item.scope === 'GLOBAL' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      Toàn trường
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                      {item.majorName || 'Theo ngành'}
                    </span>
                  )}
                </td>

                {/* Cột 4: DatePicker Bắt đầu */}
                <td className="py-3.5 px-4">
                  <input
                    type="datetime-local"
                    value={formatDateTimeLocal(currentStartDate)}
                    onChange={(e) => {
                      if (e.target.value) {
                        onDateChange(item.deadlineId, 'startDate', new Date(e.target.value).toISOString());
                      }
                    }}
                    className="w-full border-gray-300 rounded-md text-xs py-1.5 px-2.5 border focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition"
                  />
                </td>

                {/* Cột 5: DatePicker Kết thúc */}
                <td className="py-3.5 px-4">
                  <input
                    type="datetime-local"
                    value={formatDateTimeLocal(currentEndDate)}
                    onChange={(e) => {
                      if (e.target.value) {
                        onDateChange(item.deadlineId, 'endDate', new Date(e.target.value).toISOString());
                      }
                    }}
                    className={`w-full rounded-md text-xs py-1.5 px-2.5 border shadow-sm transition focus:ring-1 ${
                      isInvalid
                        ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {isInvalid && (
                    <div className="text-[10px] text-red-600 mt-1 font-normal">
                      Thời gian kết thúc phải sau thời gian bắt đầu
                    </div>
                  )}
                </td>

                {/* Cột 6: Trạng thái Badge */}
                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      item.status === 'COMPLETED'
                        ? 'bg-gray-100 text-gray-600 border border-gray-200'
                        : item.status === 'IN_PROGRESS'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : item.status === 'EXTENDED'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {item.status === 'COMPLETED'
                      ? 'Đã kết thúc'
                      : item.status === 'IN_PROGRESS'
                      ? 'Đang mở'
                      : item.status === 'EXTENDED'
                      ? 'Gia hạn'
                      : 'Chưa bắt đầu'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

