import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { defenseScheduleService } from '../services/defenseSchedule.service'
import { examinerReviewService } from '../services/examinerReview.service'
import { buildCouncilEvents, buildReviewEvents, type CalendarEvent } from '../utils/defenseCalendar'
import { defenseScheduleKeys } from './useDefenseSchedule'
import { examinerReviewKeys, useMyCouncils, useMyExaminerAssignments } from './useExaminerReview'

/**
 * Lịch bảo vệ & phản biện của giảng viên đang đăng nhập (dữ liệu thật):
 * - Ca phản biện: GET /examiner-assignment/my
 * - Buổi bảo vệ: GET /defense-council/my + mỗi Hội đồng GET .../defense-schedule (ca từng SV) và .../examiner (thành viên)
 * Dùng chung query key với các màn khác để tái sử dụng cache.
 */
// now: mốc thời gian để xác định ca đã diễn ra (component truyền vào, lấy 1 lần khi mở trang)
export function useDefenseCalendar(now: Date) {
  const councilsQuery = useMyCouncils()
  const reviewsQuery = useMyExaminerAssignments()

  const councils = useMemo(
    () => (councilsQuery.data ?? []).filter((c) => c.status !== 'CANCELLED'),
    [councilsQuery.data],
  )

  const scheduleQueries = useQueries({
    queries: councils.map((c) => ({
      queryKey: defenseScheduleKeys.council(c.councilPublicId),
      queryFn: () => defenseScheduleService.getCouncilDefenseSchedule(c.councilPublicId),
    })),
  })
  const boardQueries = useQueries({
    queries: councils.map((c) => ({
      queryKey: examinerReviewKeys.board(c.councilPublicId),
      queryFn: () => examinerReviewService.getCouncilBoard(c.councilPublicId),
    })),
  })

  const scheduleData = scheduleQueries.map((q) => q.data)
  const boardData = boardQueries.map((q) => q.data)

  // GVHD của từng sinh viên (lấy từ bảng phân công của Hội đồng) để hiện trong chi tiết ca phản biện
  const supervisorByAssignment = new Map<string, string | null>()
  boardData.forEach((b) =>
    b?.students.forEach((s) => supervisorByAssignment.set(s.defenseAssignmentPublicId, s.supervisorName)),
  )
  const events: CalendarEvent[] = [
    ...buildReviewEvents(reviewsQuery.data ?? [], supervisorByAssignment, now),
    ...councils.flatMap((c, idx) => buildCouncilEvents(c, scheduleData[idx], boardData[idx], now)),
  ].sort((a, b) => `${a.dateIso} ${a.time}`.localeCompare(`${b.dateIso} ${b.time}`))

  return {
    events,
    isPending: councilsQuery.isPending || reviewsQuery.isPending,
    isError: councilsQuery.isError && reviewsQuery.isError,
  }
}
