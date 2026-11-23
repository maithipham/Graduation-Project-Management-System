import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type {
  DeadlineGroupedResponse,
  MilestoneProgress,
  SemesterDeadlineItem,
} from '../types/deadline.types'

export const deadlineService = {
  async getBySemester(semesterId: string): Promise<SemesterDeadlineItem[]> {
    const res = await apiClient.get<ApiResponse<DeadlineGroupedResponse>>(
      API_ENDPOINTS.deadline.base,
      { params: { semesterId } },
    )
    const d = res.data.data
    return [
      ...(d?.giaoNhanDeadlines ?? []),
      ...(d?.thucHienDeadlines ?? []),
      ...(d?.danhGiaDeadlines ?? []),
    ]
  },
}

/** Gán trạng thái từng mốc theo `nowMs`; sắp xếp theo thời gian bắt đầu. */
export function computeMilestones(
  items: SemesterDeadlineItem[],
  nowMs: number,
): MilestoneProgress[] {
  const rank = { GIAO_NHAN: 0, THUC_HIEN: 1, DANH_GIA: 2 } as const
  return items
    .map<MilestoneProgress>((item) => {
      const start = item.startDate ? Date.parse(item.startDate) : NaN
      const end = item.endDate ? Date.parse(item.endDate) : NaN
      if (Number.isNaN(start) || Number.isNaN(end)) {
        return { ...item, state: 'unscheduled', elapsed: 0 }
      }
      if (nowMs >= end) return { ...item, state: 'done', elapsed: 1 }
      if (nowMs < start) return { ...item, state: 'upcoming', elapsed: 0 }
      const span = Math.max(end - start, 1)
      return { ...item, state: 'active', elapsed: (nowMs - start) / span }
    })
    .sort((a, b) => {
      if (a.state === 'unscheduled' && b.state !== 'unscheduled') return 1
      if (b.state === 'unscheduled' && a.state !== 'unscheduled') return -1
      const sa = a.startDate ? Date.parse(a.startDate) : 0
      const sb = b.startDate ? Date.parse(b.startDate) : 0
      return sa - sb || rank[a.stage] - rank[b.stage] || a.orderIndex - b.orderIndex
    })
}

/** % tiến độ tổng: mốc đã xong tính 1, mốc đang diễn ra tính theo phần đã trôi qua. */
export function computeOverallPercent(milestones: MilestoneProgress[]): number {
  const scheduled = milestones.filter((m) => m.state !== 'unscheduled')
  if (scheduled.length === 0) return 0
  const sum = scheduled.reduce(
    (acc, m) => acc + (m.state === 'done' ? 1 : m.state === 'active' ? m.elapsed : 0),
    0,
  )
  return Math.round((sum / scheduled.length) * 100)
}
