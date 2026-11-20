import React, { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react'
import { formatDate } from '@/shared/utils'
import type { MyExaminerAssignment } from '../types'

interface ScheduleCalendarViewProps {
  assignments: MyExaminerAssignment[]
  onOpenSchedule: (item: MyExaminerAssignment) => void
}

const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]

const DAY_NAMES = [
  'Thứ 2',
  'Thứ 3',
  'Thứ 4',
  'Thứ 5',
  'Thứ 6',
  'Thứ 7',
  'Chủ Nhật',
]

// Helper: Lấy ngày Thứ Hai của tuần chứa một ngày cho trước
function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({
  assignments,
  onOpenSchedule,
}) => {
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week')

  // Chọn ngày bắt đầu tuần dựa trên ca đầu tiên có lịch hoặc ngày hôm nay
  const [currentMonday, setCurrentMonday] = useState<Date>(() => {
    const firstWithDate = assignments.find((a) => a.reviewDate)
    if (firstWithDate?.reviewDate) {
      const parts = firstWithDate.reviewDate.split('-')
      if (parts.length === 3) {
        return getMonday(new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)))
      }
    }
    return getMonday(new Date())
  })

  const todayKey = useMemo(() => formatDateKey(new Date()), [])

  // 7 ngày trong tuần
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentMonday, i))
  }, [currentMonday])

  const sunday = addDays(currentMonday, 6)
  const weekRangeLabel = `${formatDate(currentMonday, 'short')} – ${formatDate(sunday, 'short')}`

  // Phân loại sinh viên có lịch và chưa có lịch
  const scheduledAssignments = useMemo(
    () => assignments.filter((a) => a.reviewDate && a.reviewStartTime),
    [assignments],
  )
  const unscheduledAssignments = useMemo(
    () => assignments.filter((a) => !a.reviewDate || !a.reviewStartTime),
    [assignments],
  )

  // Map ngày -> danh sách ca hẹn
  const scheduleByDate = useMemo(() => {
    const map: Record<string, MyExaminerAssignment[]> = {}
    scheduledAssignments.forEach((item) => {
      if (item.reviewDate) {
        if (!map[item.reviewDate]) map[item.reviewDate] = []
        map[item.reviewDate].push(item)
      }
    })
    return map
  }, [scheduledAssignments])

  const handlePrevWeek = () => {
    setCurrentMonday((prev) => addDays(prev, -7))
  }
  const handleNextWeek = () => {
    setCurrentMonday((prev) => addDays(prev, 7))
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-stretch">
      {/* 1. Left: Calendar Timetable matching Image 3 */}
      <div className="flex-1 min-w-0 bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col">
        {/* Calendar Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-blue-50 text-[#1565C0] border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Lịch tuần
            </button>
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-blue-50 text-[#1565C0] border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Lịch ngày
            </button>
          </div>

          <div className="flex items-center gap-2 self-center">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition cursor-pointer text-slate-600"
              title="Tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 px-2 min-w-[150px] text-center">
              {weekRangeLabel}
            </span>
            <button
              type="button"
              onClick={handleNextWeek}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition cursor-pointer text-slate-600"
              title="Tuần sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timetable Grid */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 flex-1">
          <table className="w-full text-left text-xs border-collapse min-w-[750px]">
            {/* Header: Days of Week */}
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <tr>
                <th className="py-2.5 px-3 w-16 text-center text-[11px] font-mono text-slate-400 border-r border-slate-100">
                  GMT+7
                </th>
                {weekDays.map((d, i) => {
                  const dateStr = formatDateKey(d)
                  const isToday = todayKey === dateStr
                  return (
                    <th
                      key={dateStr}
                      className={`py-2.5 px-3 text-center border-r border-slate-100 last:border-r-0 ${
                        isToday ? 'bg-blue-50/60' : ''
                      }`}
                    >
                      <div className="text-[11px] font-semibold text-slate-500 uppercase">
                        {DAY_NAMES[i]}
                      </div>
                      <div
                        className={`text-xs font-bold mt-0.5 ${
                          isToday ? 'text-[#1565C0]' : 'text-slate-900'
                        }`}
                      >
                        {formatDate(d, 'short')}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>

            {/* Body: Hours 7h to 19h */}
            <tbody className="divide-y divide-slate-100">
              {HOURS.map((hour) => (
                <tr key={hour} className="h-16 hover:bg-slate-50/40 transition-colors">
                  {/* Hour label */}
                  <td className="py-2 px-2 text-center text-[11px] font-mono text-slate-400 align-top border-r border-slate-100 bg-slate-50/30">
                    {hour}h
                  </td>

                  {/* 7 Day cells */}
                  {weekDays.map((d) => {
                    const dateStr = formatDateKey(d)
                    const dayItems = scheduleByDate[dateStr] || []
                    // Lọc các ca trong khung giờ này
                    const slotInHour = dayItems.filter((item) => {
                      if (!item.reviewStartTime) return false
                      const h = parseInt(item.reviewStartTime.split(':')[0], 10)
                      return h === hour
                    })

                    return (
                      <td
                        key={dateStr}
                        className="p-1 align-top border-r border-slate-100 last:border-r-0 relative"
                      >
                        {slotInHour.map((slot) => {
                          const isGreen = slot.examinerOrder === 1
                          return (
                            <div
                              key={slot.examinerAssignmentPublicId}
                              onClick={() => onOpenSchedule(slot)}
                              className={`p-1.5 rounded-lg border text-[11px] transition shadow-2xs cursor-pointer hover:shadow-xs hover:scale-[1.02] active:scale-95 space-y-0.5 ${
                                isGreen
                                  ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                                  : 'bg-blue-50/90 border-blue-200 text-blue-900'
                              }`}
                              title={`Bấm để sửa lịch: ${slot.studentName}`}
                            >
                              <div className="flex items-center justify-between text-[10px] font-semibold opacity-85">
                                <span>
                                  {slot.reviewStartTime}–{slot.reviewEndTime}
                                </span>
                                <span className="font-mono text-[9.5px]">
                                  {slot.councilCode}
                                </span>
                              </div>
                              <div className="font-bold truncate">
                                {slot.studentName}
                              </div>
                            </div>
                          )
                        })}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Right: Unscheduled Sidebar matching Image 3 */}
      <div className="w-full lg:w-[340px] shrink-0 bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 flex flex-col space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              Chưa có lịch phản biện
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Bấm vào sinh viên để xếp lịch hẹn
            </p>
          </div>
          <span className="w-6 h-6 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold flex items-center justify-center shrink-0">
            {unscheduledAssignments.length}
          </span>
        </div>

        <div className="space-y-2.5 overflow-y-auto max-h-[640px] pr-1">
          {unscheduledAssignments.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 italic">
              Tất cả sinh viên đều đã được xếp lịch phản biện!
            </div>
          ) : (
            unscheduledAssignments.map((st) => (
              <div
                key={st.examinerAssignmentPublicId}
                onClick={() => onOpenSchedule(st)}
                className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 hover:bg-blue-50/40 hover:border-blue-300 transition cursor-pointer shadow-2xs group space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-900 group-hover:text-[#1565C0] transition-colors">
                    {st.studentName}
                  </div>
                  <span className="text-[10px] text-slate-400 group-hover:text-blue-600 transition">
                    <Plus className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {st.studentCode} · {st.councilCode}
                </div>
                <div
                  className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed"
                  title={st.topicName || ''}
                >
                  {st.topicName || 'Chưa có tên đề tài'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
