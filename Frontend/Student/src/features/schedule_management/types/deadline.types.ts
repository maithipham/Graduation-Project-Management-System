export type DeadlineStage = 'GIAO_NHAN' | 'THUC_HIEN' | 'DANH_GIA'

export type DeadlineServerStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'EXTENDED'

/** Khớp DeadlineResponse của BE. */
export interface SemesterDeadlineItem {
  deadlineId: string | null
  templateId: string
  name: string
  code: string
  stage: DeadlineStage
  orderIndex: number
  description: string | null
  startDate: string | null
  endDate: string | null
  status: DeadlineServerStatus | null
}

/** Khớp DeadlineGroupedResponse của BE. */
export interface DeadlineGroupedResponse {
  giaoNhanDeadlines: SemesterDeadlineItem[]
  thucHienDeadlines: SemesterDeadlineItem[]
  danhGiaDeadlines: SemesterDeadlineItem[]
}

/** Trạng thái mốc tính ở FE theo giờ hiện tại, để thanh tiến độ tự cập nhật. */
export type MilestoneState = 'done' | 'active' | 'upcoming' | 'unscheduled'

export interface MilestoneProgress extends SemesterDeadlineItem {
  state: MilestoneState
  /** 0..1 — mức đã trôi qua của mốc (chỉ có nghĩa khi đang diễn ra). */
  elapsed: number
}
