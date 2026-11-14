import type { StudentScheduleItem } from '../types/schedule.types'

export const STUDENT_SCHEDULE_DATA: StudentScheduleItem[] = [
  {
    ty: 'Bảo vệ đồ án',
    c: 'Đồ án tốt nghiệp',
    room: 'B.204',
    s: '2027-01-12T08:00',
    e: '2027-01-12T12:00',
    p: [
      ['Chủ tịch hội đồng', 'PGS.TS. Đỗ Hoàng Long'],
      ['Thư ký hội đồng', 'TS. Vũ Đình Huy'],
      ['Ủy viên phản biện', 'TS. Nguyễn Quốc Bảo'],
      ['Ủy viên', 'TS. Trần Minh Khôi'],
      ['Ủy viên', 'ThS. Võ Thu Hà'],
    ],
  },
  {
    ty: 'Phản biện',
    c: 'Đồ án tốt nghiệp',
    room: 'B.110',
    s: '2027-01-08T14:00',
    e: '2027-01-08T15:00',
    p: [
      ['Giảng viên phản biện 1', 'TS. Nguyễn Quốc Bảo'],
      ['Giảng viên phản biện 2', 'ThS. Lê Thanh Tùng'],
    ],
  },
]

export function formatScheduleTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatScheduleDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}



export const scheduleService = {
  getSchedules: (): StudentScheduleItem[] => [...STUDENT_SCHEDULE_DATA],
  formatDate: formatScheduleDate,
  formatTime: formatScheduleTime,
}
