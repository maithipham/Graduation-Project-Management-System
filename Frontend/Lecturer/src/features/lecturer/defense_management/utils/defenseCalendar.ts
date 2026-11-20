import type {
  CouncilDefenseSchedule,
  CouncilExaminerBoard,
  CouncilMemberRole,
  MyCouncil,
  MyExaminerAssignment,
} from '../types'
import type { ScheduleEvent } from '../components/DefenseEventDetailDialog'

/**
 * Ghép dữ liệu thật (ca phản biện + ca bảo vệ Hội đồng) thành sự kiện cho màn "Lịch bảo vệ & phản biện".
 * Hàm thuần, không gọi API.
 */

export interface CalendarEvent {
  id: string
  type: 'review' | 'council'
  dateIso: string // YYYY-MM-DD
  time: string // HH:mm (giờ bắt đầu, dùng để sắp xếp)
  roleTag: string
  title: string
  location: string
  isOnline: boolean
  eventData: ScheduleEvent
}

const ROLE_LABEL: Record<CouncilMemberRole, string> = {
  CHAIRPERSON: 'Chủ tịch',
  SECRETARY: 'Thư ký',
  COUNCIL_MEMBER: 'Ủy viên',
}

const ONLINE_PATTERN = /meet\.|teams|zoom|https?:\/\/|trực tuyến|online/i

export function isOnlineLocation(location: string | null | undefined): boolean {
  return Boolean(location && ONLINE_PATTERN.test(location))
}

// Link họp trong địa điểm: có http(s):// hoặc dạng tên miền/đường dẫn (meet.google.com/abc, zoom.us/j/123)
const URL_PATTERN = /(https?:\/\/[^\s,;]+)|(\b(?:[a-z0-9-]+\.)+[a-z]{2,}\/[^\s,;]*)/i

/** Lấy link phòng họp trực tuyến trong địa điểm (thêm https:// nếu thiếu); không có link thì null */
export function extractMeetingUrl(location: string | null | undefined): string | null {
  if (!location) return null
  const match = URL_PATTERN.exec(location)
  if (!match) return null
  const raw = match[0].replace(/[).]+$/, '')
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
}

/** "08:00:00" | "08:00" → "08:00" */
export function hhmm(time: string | null | undefined): string {
  return time ? time.slice(0, 5) : ''
}

/** "2026-11-21T08:00:00" → { date: "2026-11-21", time: "08:00" } (không đổi múi giờ) */
function splitIso(iso: string): { date: string; time: string } {
  const [date, time = ''] = iso.split('T')
  return { date, time: hhmm(time) }
}

function isPast(dateIso: string, endTime: string, now: Date): boolean {
  const [y, m, d] = dateIso.split('-').map(Number)
  const [hh = 23, mm = 59] = (endTime || '23:59').split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm) < now
}

/** Ca phản biện của chính giảng viên (GET /examiner-assignment/my), chỉ những ca đã có lịch */
export function buildReviewEvents(
  assignments: MyExaminerAssignment[],
  supervisorByAssignment: Map<string, string | null>,
  now: Date,
): CalendarEvent[] {
  return assignments
    .filter((a) => a.reviewDate && a.reviewStartTime)
    .map((a) => {
      const start = hhmm(a.reviewStartTime)
      const end = hhmm(a.reviewEndTime)
      const location = a.reviewLocation ?? ''
      const online = isOnlineLocation(location)
      const role = `GVPB ${a.examinerOrder}`
      return {
        id: `review-${a.examinerAssignmentPublicId}`,
        type: 'review' as const,
        dateIso: a.reviewDate as string,
        time: start,
        roleTag: a.examinerOrder === 1 ? `${role} (Chính)` : role,
        title: `Phản biện: ${a.studentName}`,
        location,
        isOnline: online,
        eventData: {
          id: a.examinerAssignmentPublicId,
          type: 'review',
          councilId: a.councilPublicId,
          code: a.councilCode,
          title: `Đánh giá phản biện ĐATN — ${a.studentName}`,
          subTitle: a.councilName,
          role,
          dateIso: a.reviewDate as string,
          timeRange: end ? `${start} - ${end}` : start,
          startTime: start,
          endTime: end,
          room: location || 'Chưa cập nhật',
          mode: online ? 'Trực tuyến' : 'Trực tiếp',
          status: isPast(a.reviewDate as string, end, now) ? 'completed' : 'upcoming',
          studentName: a.studentName,
          studentMssv: a.studentCode,
          topic: a.topicName ?? '',
          supervisor: supervisorByAssignment.get(a.defenseAssignmentPublicId) ?? undefined,
          score: a.sheetScore,
          eligible: a.decision === 'APPROVED' ? true : a.decision === 'REJECTED' ? false : null,
          note: a.reviewNote ?? undefined,
        },
      }
    })
}

/**
 * Buổi bảo vệ của Hội đồng mà giảng viên là thành viên: mỗi ngày có sinh viên được xếp ca là 1 sự kiện
 * (giờ = ca sớm nhất → ca muộn nhất). Hội đồng chưa xếp ca nào → 1 sự kiện theo khung lịch tổng thể.
 */
export function buildCouncilEvents(
  council: MyCouncil,
  schedule: CouncilDefenseSchedule | undefined,
  board: CouncilExaminerBoard | undefined,
  now: Date,
): CalendarEvent[] {
  const role = ROLE_LABEL[council.myRole] ?? 'Thành viên'
  const members = board?.members.map((m) => ({
    name: m.fullName,
    role: ROLE_LABEL[m.role] ?? 'Ủy viên',
    department: m.departmentName ?? undefined,
  }))

  const scheduled = (schedule?.students ?? []).filter((s) => s.defenseStartTime)
  const byDate = new Map<string, typeof scheduled>()
  scheduled.forEach((s) => {
    const { date } = splitIso(s.defenseStartTime as string)
    byDate.set(date, [...(byDate.get(date) ?? []), s])
  })

  const makeEvent = (
    dateIso: string,
    start: string,
    end: string,
    room: string,
    students: ScheduleEvent['students'],
    studentCount: number,
  ): CalendarEvent => {
    const online = isOnlineLocation(room)
    return {
      id: `council-${council.councilPublicId}-${dateIso}`,
      type: 'council',
      dateIso,
      time: start,
      roleTag: role,
      title: `${council.code} — ${council.name}`,
      location: room,
      isOnline: online,
      eventData: {
        id: `${council.councilPublicId}-${dateIso}`,
        type: 'council',
        councilId: council.councilPublicId,
        code: council.code,
        title: `Hội đồng bảo vệ ĐATN ${council.code}`,
        subTitle: `${council.name} · ${council.majorName}`,
        role,
        dateIso,
        timeRange: end ? `${start} - ${end}` : start,
        startTime: start,
        endTime: end,
        room: room || 'Chưa cập nhật',
        mode: online ? 'Trực tuyến' : 'Trực tiếp',
        status: council.status === 'COMPLETED' || isPast(dateIso, end, now) ? 'completed' : 'upcoming',
        studentCount,
        students,
        members,
      },
    }
  }

  if (byDate.size === 0) {
    if (!council.defenseStartTime) return []
    const startParts = splitIso(council.defenseStartTime)
    const endParts = council.defenseEndTime ? splitIso(council.defenseEndTime) : null
    return [
      makeEvent(
        startParts.date,
        startParts.time,
        endParts && endParts.date === startParts.date ? endParts.time : '',
        council.location ?? '',
        [],
        council.studentCount,
      ),
    ]
  }

  return [...byDate.entries()].map(([dateIso, slots]) => {
    const sorted = [...slots].sort((a, b) =>
      (a.defenseStartTime as string).localeCompare(b.defenseStartTime as string),
    )
    const start = splitIso(sorted[0].defenseStartTime as string).time
    const lastEnd = sorted
      .map((s) => s.defenseEndTime)
      .filter((v): v is string => Boolean(v))
      .sort()
      .pop()
    const rooms = [...new Set(sorted.map((s) => s.room).filter(Boolean))]
    const room = rooms.length === 1 ? (rooms[0] as string) : rooms.length > 1 ? rooms.join(', ') : council.location ?? ''
    return makeEvent(
      dateIso,
      start,
      lastEnd ? splitIso(lastEnd).time : '',
      room,
      sorted.map((s) => ({
        id: s.defenseAssignmentPublicId,
        name: s.studentName,
        mssv: s.studentCode,
        slotTime: splitIso(s.defenseStartTime as string).time,
        slotEnd: s.defenseEndTime ? splitIso(s.defenseEndTime).time : undefined,
        topic: s.topicName ?? '',
        supervisor: s.supervisorName ?? undefined,
      })),
      sorted.length,
    )
  })
}

/** Ngày đầu tuần (Thứ 2) của tuần chứa `date`, cộng thêm `weekOffset` tuần */
export function startOfWeek(date: Date, weekOffset = 0): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff = (d.getDay() + 6) % 7 // Thứ 2 = 0
  d.setDate(d.getDate() - diff + weekOffset * 7)
  return d
}

/** Date → "YYYY-MM-DD" theo giờ địa phương (không dùng toISOString để tránh lệch múi giờ) */
export function toDateIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
