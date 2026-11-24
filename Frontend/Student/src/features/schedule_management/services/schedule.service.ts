import { API_ENDPOINTS, apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { StudentScheduleItem } from '../types/schedule.types'

export const scheduleService = {
  /** Lịch chung của tôi (`GET /student-schedule/my`): phản biện + bảo vệ, đã sắp theo thời gian. */
  async getMySchedule(semesterId?: string): Promise<StudentScheduleItem[]> {
    const res = await apiClient.get<ApiResponse<StudentScheduleItem[]>>(
      API_ENDPOINTS.studentSchedule.my,
      { params: semesterId ? { semesterId } : undefined },
    )
    return res.data.data ?? []
  },
}

/** "2026-11-20" -> "20/11/2026" (đọc thẳng chuỗi, không đổi múi giờ). */
export function formatScheduleDate(date: string | null): string {
  if (!date) return '—'
  const [y, m, d] = date.split('-').map(Number)
  if (!y || !m || !d) return date
  return `${d}/${m}/${y}`
}

/** Khung giờ "08:00 – 08:45"; chưa xếp lịch thì "—". */
export function formatScheduleTimeRange(start: string | null, end: string | null): string {
  if (!start || !end) return '—'
  return `${start.slice(0, 5)} – ${end.slice(0, 5)}`
}

/** Thời điểm kết thúc (ms, giờ máy người dùng) để xác định lịch đã qua hay sắp tới. */
export function scheduleEndMs(item: StudentScheduleItem): number | null {
  if (!item.scheduled || !item.date || !item.endTime) return null
  const [y, m, d] = item.date.split('-').map(Number)
  const [hh, mm] = item.endTime.split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm).getTime()
}
