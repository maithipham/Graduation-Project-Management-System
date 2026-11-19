import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Video,
} from 'lucide-react';
import {
  DefenseEventDetailDialog,
  type ScheduleEvent,
} from '../components/DefenseEventDetailDialog';

interface DayEvent {
  id: string;
  type: 'review' | 'council';
  roleTag: string; // e.g. 'GVPB 1 (Chính)', 'Chủ tịch', 'Thư ký'
  time: string; // '09:00', '08:00', '13:30'
  title: string; // 'Phản biện: Lê Minh Quân...', 'HĐ CNTT 01 — Tiểu ban Công...'
  location: string; // 'Phòng BM KTPM - P308 C1', 'Google Meet: meet.google.co/gvpb-103'
  isOnline?: boolean;
  eventData: ScheduleEvent;
}

interface DayColumn {
  dayName: string; // 'THỨ 2', 'THỨ 3', ...
  dayNumber: number; // 15, 16, ...
  dateStr: string; // '2026-06-15'
  events: DayEvent[];
}

export const ThesisDefensePage: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  // Exact data from Image 1
  const weekDays: DayColumn[] = [
    {
      dayName: 'THỨ 2',
      dayNumber: 15,
      dateStr: '2026-06-15',
      events: [
        {
          id: 'ev-1',
          type: 'review',
          roleTag: 'GVPB 1 (Chính)',
          time: '09:00',
          title: 'Phản biện: Lê Minh Quân...',
          location: 'Phòng BM KTPM - P308 C1',
          eventData: {
            id: 'ev-1',
            type: 'review',
            code: 'PB-01',
            title: 'Đánh giá phản biện ĐATN — Lê Minh Quân',
            subTitle: 'Kỹ thuật phần mềm',
            role: 'GVPB 1',
            dateIso: '2026-06-15',
            timeRange: '09:00 - 09:45',
            startTime: '09:00',
            endTime: '09:45',
            room: 'Phòng BM KTPM - P308 C1',
            mode: 'Trực tiếp',
            status: 'upcoming',
            studentName: 'Lê Minh Quân',
            studentMssv: '2251060123',
            topic: 'Nhận diện sâu bệnh cây lúa qua ảnh chụp flycam bằng YOLOv9',
            supervisor: 'TS. Vũ Thị Lan',
          },
        },
        {
          id: 'ev-2',
          type: 'review',
          roleTag: 'GVPB 1 (Chính)',
          time: '10:00',
          title: 'Phản biện: Đỗ Phương Linh...',
          location: 'Phòng BM KTPM - P308 C1',
          eventData: {
            id: 'ev-2',
            type: 'review',
            code: 'PB-02',
            title: 'Đánh giá phản biện ĐATN — Đỗ Phương Linh',
            subTitle: 'Hệ thống thông tin',
            role: 'GVPB 1',
            dateIso: '2026-06-15',
            timeRange: '10:00 - 10:45',
            startTime: '10:00',
            endTime: '10:45',
            room: 'Phòng BM KTPM - P308 C1',
            mode: 'Trực tiếp',
            status: 'upcoming',
            studentName: 'Đỗ Phương Linh',
            studentMssv: '2251060542',
            topic: 'Hệ thống cảnh báo ngập lụt đô thị thông minh',
            supervisor: 'TS. Hoàng Thị Mai',
          },
        },
      ],
    },
    {
      dayName: 'THỨ 3',
      dayNumber: 16,
      dateStr: '2026-06-16',
      events: [
        {
          id: 'ev-3',
          type: 'review',
          roleTag: 'GVPB 1 (Chính)',
          time: '08:30',
          title: 'Phản biện: Nguyễn Hoàng...',
          location: 'Phòng họp khoa CNTT - C5',
          eventData: {
            id: 'ev-3',
            type: 'review',
            code: 'PB-03',
            title: 'Đánh giá phản biện ĐATN — Nguyễn Hoàng Anh',
            subTitle: 'Khoa học dữ liệu',
            role: 'GVPB 1',
            dateIso: '2026-06-16',
            timeRange: '08:30 - 09:15',
            startTime: '08:30',
            endTime: '09:15',
            room: 'Phòng họp khoa CNTT - C5',
            mode: 'Trực tiếp',
            status: 'upcoming',
            studentName: 'Nguyễn Hoàng Anh',
            studentMssv: '2251060321',
            topic: 'Phân tích chuỗi thời gian dữ liệu mưa lớn lưu vực sông Hồng',
            supervisor: 'TS. Bùi Văn Cường',
          },
        },
        {
          id: 'ev-4',
          type: 'review',
          roleTag: 'GVPB 1 (Chính)',
          time: '10:00',
          title: 'Phản biện: Bùi Thị Hải Yến...',
          location: 'Phòng BM KTPM - P308 C1',
          eventData: {
            id: 'ev-4',
            type: 'review',
            code: 'PB-04',
            title: 'Đánh giá phản biện ĐATN — Bùi Thị Hải Yến',
            subTitle: 'Kỹ thuật phần mềm',
            role: 'GVPB 1',
            dateIso: '2026-06-16',
            timeRange: '10:00 - 10:45',
            startTime: '10:00',
            endTime: '10:45',
            room: 'Phòng BM KTPM - P308 C1',
            mode: 'Trực tiếp',
            status: 'upcoming',
            studentName: 'Bùi Thị Hải Yến',
            studentMssv: '2251060888',
            topic: 'Nền tảng thi trắc nghiệm trực tuyến',
            supervisor: 'ThS. Nguyễn Văn Dũng',
          },
        },
      ],
    },
    {
      dayName: 'THỨ 4',
      dayNumber: 17,
      dateStr: '2026-06-17',
      events: [
        {
          id: 'ev-5',
          type: 'review',
          roleTag: 'GVPB 1 (Chính)',
          time: '14:00',
          title: 'Phản biện: Nguyễn Hải...',
          location: 'Google Meet: meet.google.co/gvpb-103',
          isOnline: true,
          eventData: {
            id: 'ev-5',
            type: 'review',
            code: 'PB-05',
            title: 'Đánh giá phản biện ĐATN — Nguyễn Hải Nam',
            subTitle: 'Kỹ thuật phần mềm',
            role: 'GVPB 1',
            dateIso: '2026-06-17',
            timeRange: '14:00 - 14:45',
            startTime: '14:00',
            endTime: '14:45',
            room: 'Google Meet: meet.google.co/gvpb-103',
            mode: 'Trực tuyến',
            status: 'upcoming',
            studentName: 'Nguyễn Hải Nam',
            studentMssv: '2251060412',
            topic: 'Ứng dụng AI phân tích dữ liệu thủy văn',
            supervisor: 'PGS.TS. Phạm Hồng Nam',
          },
        },
      ],
    },
    {
      dayName: 'THỨ 5',
      dayNumber: 18,
      dateStr: '2026-06-18',
      events: [
        {
          id: 'ev-6',
          type: 'review',
          roleTag: 'GVPB 1 (Chính)',
          time: '09:30',
          title: 'Phản biện: Trần Quốc Huy...',
          location: 'MS Teams - K64HTTT',
          isOnline: true,
          eventData: {
            id: 'ev-6',
            type: 'review',
            code: 'PB-06',
            title: 'Đánh giá phản biện ĐATN — Trần Quốc Huy',
            subTitle: 'Hệ thống thông tin',
            role: 'GVPB 1',
            dateIso: '2026-06-18',
            timeRange: '09:30 - 10:15',
            startTime: '09:30',
            endTime: '10:15',
            room: 'MS Teams - K64HTTT',
            mode: 'Trực tuyến',
            status: 'upcoming',
            studentName: 'Trần Quốc Huy',
            studentMssv: '2151000002',
            topic: 'Hệ thống quản lý chuỗi cung ứng nông sản áp dụng Blockchain',
            supervisor: 'PGS.TS. Phạm Hoàng Nam',
          },
        },
        {
          id: 'ev-7',
          type: 'review',
          roleTag: 'GVPB 1 (Chính)',
          time: '15:00',
          title: 'Phản biện: Phạm Ngọc V...',
          location: 'Phòng Lab ATTT - P402',
          eventData: {
            id: 'ev-7',
            type: 'review',
            code: 'PB-07',
            title: 'Đánh giá phản biện ĐATN — Phạm Ngọc Văn',
            subTitle: 'An toàn thông tin',
            role: 'GVPB 1',
            dateIso: '2026-06-18',
            timeRange: '15:00 - 15:45',
            startTime: '15:00',
            endTime: '15:45',
            room: 'Phòng Lab ATTT - P402',
            mode: 'Trực tiếp',
            status: 'upcoming',
            studentName: 'Phạm Ngọc Văn',
            studentMssv: '2251060999',
            topic: 'Nhận dạng mã độc trong lưu lượng mạng IoT',
            supervisor: 'TS. Nguyễn Văn Tuấn',
          },
        },
      ],
    },
    {
      dayName: 'THỨ 6',
      dayNumber: 19,
      dateStr: '2026-06-19',
      events: [],
    },
    {
      dayName: 'THỨ 7',
      dayNumber: 20,
      dateStr: '2026-06-20',
      events: [
        {
          id: 'ev-8',
          type: 'council',
          roleTag: 'Chủ tịch',
          time: '08:00',
          title: 'HĐ CNTT 01 — Tiểu ban Côn...',
          location: 'Phòng Hội thảo 205 - Nhà T45',
          eventData: {
            id: 'ev-8',
            type: 'council',
            code: 'HĐ CNTT 01',
            title: 'Hội đồng Bảo vệ ĐATN CNTT 01',
            subTitle: 'Tiểu ban Công nghệ phần mềm & Trí tuệ nhân tạo',
            role: 'Chủ tịch',
            dateIso: '2026-06-20',
            timeRange: '08:00 - 11:30',
            startTime: '08:00',
            endTime: '11:30',
            room: 'Phòng Hội thảo 205 - Nhà T45',
            mode: 'Trực tiếp',
            status: 'upcoming',
            studentCount: 8,
          },
        },
      ],
    },
    {
      dayName: 'CN',
      dayNumber: 21,
      dateStr: '2026-06-21',
      events: [
        {
          id: 'ev-9',
          type: 'council',
          roleTag: 'Thư ký',
          time: '13:30',
          title: 'HĐ CNTT 02 — Tiểu ban Hệ...',
          location: 'Phòng Hội thảo 302 - Nhà T45',
          eventData: {
            id: 'ev-9',
            type: 'council',
            code: 'HĐ CNTT 02',
            title: 'Hội đồng Bảo vệ ĐATN CNTT 02',
            subTitle: 'Tiểu ban Hệ thống thông tin & Khoa học dữ liệu',
            role: 'Thư ký',
            dateIso: '2026-06-21',
            timeRange: '13:30 - 17:00',
            startTime: '13:30',
            endTime: '17:00',
            room: 'Phòng Hội thảo 302 - Nhà T45',
            mode: 'Trực tiếp',
            status: 'upcoming',
            studentCount: 6,
          },
        },
      ],
    },
  ];

  return (
    <div className="max-w-[1520px] w-full mx-auto space-y-4">
      {/* Calendar Card Matching 100% Image 1 */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {/* Top Week Navigation Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
          {/* Left: < Tuần: 15/06 – 21/06/2026 > */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-slate-800">
              Tuần: 15/06 – 21/06/2026 {weekOffset !== 0 && `(${weekOffset > 0 ? `+${weekOffset}` : weekOffset})`}
            </span>
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Tuần này (20/06) Button */}
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            className="h-8.5 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#1565C0] font-bold text-xs transition cursor-pointer shadow-2xs"
          >
            Tuần này (20/06)
          </button>
        </div>

        {/* 7 Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-200 min-h-[580px]">
          {weekDays.map((col) => (
            <div key={col.dayName} className="flex flex-col">
              {/* Column Header */}
              <div className="text-center p-3 border-b border-slate-200 bg-slate-50/50">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {col.dayName}
                </div>
                <div className="text-lg font-black text-slate-900 leading-tight mt-0.5">
                  {col.dayNumber}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {col.events.length} ca
                </div>
              </div>

              {/* Column Body: Event Cards */}
              <div className="p-2.5 space-y-2.5 flex-1 bg-white">
                {col.events.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-slate-400 italic text-xs">
                    Trống
                  </div>
                ) : (
                  col.events.map((ev) => {
                    const isReview = ev.type === 'review';

                    return (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev.eventData)}
                        className={`rounded-2xl p-3 space-y-1.5 transition cursor-pointer hover:shadow-xs border ${
                          isReview
                            ? 'bg-amber-50/60 border-amber-200 hover:border-amber-300'
                            : 'bg-blue-50/60 border-blue-200 hover:border-blue-300'
                        }`}
                      >
                        {/* Top Row: Role Badge & Time */}
                        <div className="flex items-center justify-between gap-1 text-[11px] font-extrabold">
                          <span
                            className={
                              isReview ? 'text-amber-900' : 'text-blue-900'
                            }
                          >
                            {ev.roleTag}
                          </span>
                          <span
                            className={
                              isReview ? 'text-amber-900 font-mono' : 'text-blue-900 font-mono'
                            }
                          >
                            {ev.time}
                          </span>
                        </div>

                        {/* Title */}
                        <div
                          className="font-bold text-[12px] text-slate-900 line-clamp-2 leading-snug"
                          title={ev.title}
                        >
                          {ev.title}
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 pt-0.5">
                          {ev.isOnline ? (
                            <Video className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          ) : (
                            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          )}
                          <span className="truncate">{ev.location}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Event Details Dialog */}
      <DefenseEventDetailDialog
        event={selectedEvent}
        open={!!selectedEvent}
        onOpenChange={(op) => !op && setSelectedEvent(null)}
      />
    </div>
  );
};
export default ThesisDefensePage;
