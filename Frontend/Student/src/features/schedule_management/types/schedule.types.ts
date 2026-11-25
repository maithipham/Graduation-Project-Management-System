/** Loại lịch, khớp StudentScheduleType của BE. */
export type StudentScheduleType = 'REVIEW' | 'DEFENSE'

export interface StudentScheduleParticipant {
  /** "Giảng viên phản biện 1", "Chủ tịch hội đồng", "Thư ký hội đồng", "Ủy viên" */
  role: string
  /** Họ tên kèm học hàm / học vị, ví dụ "TS. Lê Hoàng Nam" */
  fullName: string
}

/** Khớp StudentScheduleItemResponse của BE (`GET /student-schedule/my`). */
export interface StudentScheduleItem {
  type: StudentScheduleType
  /** "Phản biện 1", "Phản biện 2", "Bảo vệ đồ án" */
  title: string
  examinerOrder: number | null
  councilCode: string
  councilName: string
  semesterName: string
  scheduled: boolean
  /** yyyy-MM-dd, null khi chưa xếp lịch */
  date: string | null
  /** HH:mm */
  startTime: string | null
  /** HH:mm */
  endTime: string | null
  location: string | null
  note: string | null
  participants: StudentScheduleParticipant[]
}
