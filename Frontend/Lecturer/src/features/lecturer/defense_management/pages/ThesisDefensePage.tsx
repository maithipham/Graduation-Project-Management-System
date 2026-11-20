import React, { useMemo, useState } from 'react'
import { CalendarSearch, ChevronLeft, ChevronRight, MapPin, Video } from 'lucide-react'
import { Skeleton } from '@/shared/components/ui'
import {
  DefenseEventDetailDialog,
  type ScheduleEvent,
} from '../components/DefenseEventDetailDialog'
import { useDefenseCalendar } from '../hooks/useDefenseCalendar'
import { extractMeetingUrl, startOfWeek, toDateIso } from '../utils/defenseCalendar'

const DAY_NAMES = ['THỨ 2', 'THỨ 3', 'THỨ 4', 'THỨ 5', 'THỨ 6', 'THỨ 7', 'CN']
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

function ddmm(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Lịch bảo vệ & phản biện theo tuần của giảng viên đang đăng nhập:
 * ca phản biện (vai trò GVPB) và buổi bảo vệ của các Hội đồng mình là thành viên.
 */
export const ThesisDefensePage: React.FC = () => {
  // Thời điểm mở trang (lấy 1 lần) làm mốc "hôm nay"
  const [today] = useState(() => new Date())
  const { events, isPending, isError } = useDefenseCalendar(today)
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null)
  // null = chưa tự chọn tuần: mở tuần có lịch sắp tới gần nhất (không có thì tuần hiện tại)
  const [weekOffset, setWeekOffset] = useState<number | null>(null)

  const thisWeekStart = useMemo(() => startOfWeek(today), [today])

  const defaultOffset = useMemo(() => {
    const todayIso = toDateIso(today)
    const next = events.find((e) => e.dateIso >= todayIso)
    if (!next) return 0
    const [y, m, d] = next.dateIso.split('-').map(Number)
    return Math.round((startOfWeek(new Date(y, m - 1, d)).getTime() - thisWeekStart.getTime()) / MS_PER_WEEK)
  }, [events, today, thisWeekStart])

  const offset = weekOffset ?? defaultOffset
  const weekStart = startOfWeek(today, offset)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    const dateIso = toDateIso(d)
    return { dayName: DAY_NAMES[i], date: d, dateIso, events: events.filter((e) => e.dateIso === dateIso) }
  })
  const weekEnd = days[6].date
  const weekCount = days.reduce((s, d) => s + d.events.length, 0)
  const todayIso = toDateIso(today)

  return (
    <div className="max-w-[1520px] w-full mx-auto space-y-4">
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {/* Điều hướng tuần */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWeekOffset(offset - 1)}
              className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition cursor-pointer"
              title="Tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-slate-800">
              Tuần: {ddmm(weekStart)} – {ddmm(weekEnd)}/{weekEnd.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => setWeekOffset(offset + 1)}
              className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition cursor-pointer"
              title="Tuần sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {!isPending && (
              <span className="text-xs text-slate-500 ml-1">
                {weekCount} lịch trong tuần · tổng {events.length} lịch
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {defaultOffset !== 0 && (
              <button
                type="button"
                onClick={() => setWeekOffset(defaultOffset)}
                className="h-8.5 px-3.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#1565C0] font-bold text-xs transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <CalendarSearch className="w-3.5 h-3.5" />
                Lịch sắp tới gần nhất
              </button>
            )}
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className="h-8.5 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#1565C0] font-bold text-xs transition cursor-pointer shadow-2xs"
            >
              Tuần này ({ddmm(today)})
            </button>
          </div>
        </div>

        {isError && (
          <div className="m-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-4 rounded-xl">
            Không tải được lịch bảo vệ & phản biện.
          </div>
        )}

        {/* Lưới 7 ngày */}
        <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-200 min-h-[580px]">
          {days.map((col) => {
            const isToday = col.dateIso === todayIso
            return (
              <div key={col.dateIso} className="flex flex-col">
                <div className={`text-center p-3 border-b border-slate-200 ${isToday ? 'bg-blue-50/70' : 'bg-slate-50/50'}`}>
                  <div className={`text-[11px] font-bold uppercase tracking-wider ${isToday ? 'text-[#1565C0]' : 'text-slate-500'}`}>
                    {col.dayName}
                  </div>
                  <div className={`text-lg font-black leading-tight mt-0.5 ${isToday ? 'text-[#1565C0]' : 'text-slate-900'}`}>
                    {col.date.getDate()}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">{col.events.length} ca</div>
                </div>

                <div className="p-2.5 space-y-2.5 flex-1 bg-white">
                  {isPending ? (
                    <Skeleton className="h-24 w-full rounded-2xl" />
                  ) : col.events.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-slate-400 italic text-xs">Trống</div>
                  ) : (
                    col.events.map((ev) => {
                      const isReview = ev.type === 'review'
                      const done = ev.eventData.status === 'completed'
                      const meetingUrl = ev.isOnline ? extractMeetingUrl(ev.location) : null
                      return (
                        <div
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev.eventData)}
                          className={`rounded-2xl p-3 space-y-1.5 transition cursor-pointer hover:shadow-xs border ${
                            isReview
                              ? 'bg-amber-50/60 border-amber-200 hover:border-amber-300'
                              : 'bg-blue-50/60 border-blue-200 hover:border-blue-300'
                          } ${done ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-center justify-between gap-1 text-[11px] font-extrabold">
                            <span className={isReview ? 'text-amber-900' : 'text-blue-900'}>{ev.roleTag}</span>
                            <span className={`font-mono ${isReview ? 'text-amber-900' : 'text-blue-900'}`}>{ev.time}</span>
                          </div>
                          <div className="font-bold text-[12px] text-slate-900 line-clamp-2 leading-snug" title={ev.title}>
                            {ev.title}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 pt-0.5">
                            {ev.isOnline ? (
                              <Video className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            ) : (
                              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            )}
                            {meetingUrl ? (
                              <a
                                href={meetingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="truncate text-[#1565C0] font-semibold hover:underline"
                                title="Mở link phòng họp trực tuyến"
                              >
                                {ev.location}
                              </a>
                            ) : (
                              <span className="truncate">{ev.location || 'Chưa cập nhật địa điểm'}</span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <DefenseEventDetailDialog
        event={selectedEvent}
        open={!!selectedEvent}
        onOpenChange={(op) => !op && setSelectedEvent(null)}
      />
    </div>
  )
}
export default ThesisDefensePage
