export type ScheduleEventType = 'Bảo vệ đồ án' | 'Phản biện'

export interface StudentScheduleItem {
  ty: ScheduleEventType
  c: string
  room: string
  s: string
  e: string
  p: [string, string][]
}

