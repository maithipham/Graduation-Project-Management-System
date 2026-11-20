import { describe, expect, it } from 'vitest'
import {
  buildCouncilEvents,
  buildReviewEvents,
  extractMeetingUrl,
  isOnlineLocation,
  startOfWeek,
  toDateIso,
} from '@/features/lecturer/defense_management/utils/defenseCalendar'
import type {
  CouncilDefenseSchedule,
  DefenseSlot,
  MyCouncil,
  MyExaminerAssignment,
} from '@/features/lecturer/defense_management/types'

const NOW = new Date(2026, 10, 20, 9, 0) // 20/11/2026 09:00

const council: MyCouncil = {
  councilPublicId: 'c1',
  code: 'KTPM202601',
  name: 'HD KTPM 01',
  semesterPublicId: 's1',
  semesterName: 'HK1',
  majorCode: 'KTPM01',
  majorName: 'Kỹ thuật phần mềm',
  location: 'P.302',
  defenseStartTime: '2026-11-21T08:00:00',
  defenseEndTime: '2026-11-23T17:00:00',
  status: 'PUBLISHED',
  myRole: 'SECRETARY',
  studentCount: 3,
}

function slot(id: string, start: string | null, end: string | null, room = 'P.302'): DefenseSlot {
  return {
    defenseAssignmentPublicId: id,
    thesisTopicPublicId: `t-${id}`,
    studentCode: `SV${id}`,
    studentName: `Sinh viên ${id}`,
    className: null,
    topicName: `Đề tài ${id}`,
    supervisorName: 'GVHD',
    coSupervisorName: null,
    defenseStatus: start ? 'SCHEDULED' : 'READY_FOR_DEFENSE',
    currentStage: 'STAGE_5_REVIEW_PASSED',
    examinerScore: 7,
    slotOrder: null,
    defenseStartTime: start,
    defenseEndTime: end,
    room,
    scheduledAt: null,
    scheduledByName: null,
    canSchedule: true,
    canUnschedule: true,
  }
}

describe('defenseCalendar – buildCouncilEvents', () => {
  it('gom các ca bảo vệ theo ngày: giờ từ ca sớm nhất đến ca muộn nhất, đủ danh sách SV', () => {
    const schedule = {
      students: [
        slot('2', '2026-11-21T08:45:00', '2026-11-21T09:30:00'),
        slot('1', '2026-11-21T08:00:00', '2026-11-21T08:45:00'),
        slot('3', '2026-11-22T13:30:00', '2026-11-22T14:15:00'),
        slot('4', null, null),
      ],
    } as CouncilDefenseSchedule

    const events = buildCouncilEvents(council, schedule, undefined, NOW)

    expect(events).toHaveLength(2)
    const day1 = events.find((e) => e.dateIso === '2026-11-21')!
    expect(day1.time).toBe('08:00')
    expect(day1.eventData.timeRange).toBe('08:00 - 09:30')
    expect(day1.eventData.students?.map((s) => s.mssv)).toEqual(['SV1', 'SV2'])
    expect(day1.roleTag).toBe('Thư ký')
    expect(day1.eventData.status).toBe('upcoming')
  })

  it('Hội đồng chưa xếp ca nào: 1 sự kiện theo khung lịch tổng thể của Hội đồng', () => {
    const events = buildCouncilEvents(council, { students: [] } as unknown as CouncilDefenseSchedule, undefined, NOW)
    expect(events).toHaveLength(1)
    expect(events[0].dateIso).toBe('2026-11-21')
    expect(events[0].eventData.studentCount).toBe(3)
  })
})

describe('defenseCalendar – buildReviewEvents', () => {
  const base = {
    examinerAssignmentPublicId: 'ea1',
    examinerOrder: 1,
    councilPublicId: 'c1',
    councilCode: 'KTPM202601',
    councilName: 'HD KTPM 01',
    defenseAssignmentPublicId: 'd1',
    studentCode: 'SV1',
    studentName: 'Sinh viên 1',
    topicName: 'Đề tài 1',
    decision: 'APPROVED',
    sheetScore: 7.5,
    reviewDate: '2026-11-19',
    reviewStartTime: '09:00:00',
    reviewEndTime: '09:45:00',
    reviewLocation: 'Google Meet: meet.google.com/abc',
    reviewNote: null,
  } as unknown as MyExaminerAssignment

  it('chỉ lấy ca phản biện đã có lịch; GVPB 1 gắn nhãn (Chính), ca đã qua là completed', () => {
    const noSchedule = { ...base, examinerAssignmentPublicId: 'ea2', reviewDate: null } as MyExaminerAssignment
    const events = buildReviewEvents([base, noSchedule], new Map([['d1', 'TS. GVHD']]), NOW)

    expect(events).toHaveLength(1)
    expect(events[0].roleTag).toBe('GVPB 1 (Chính)')
    expect(events[0].time).toBe('09:00')
    expect(events[0].isOnline).toBe(true)
    expect(events[0].eventData.supervisor).toBe('TS. GVHD')
    expect(events[0].eventData.eligible).toBe(true)
    expect(events[0].eventData.status).toBe('completed')
  })
})

describe('defenseCalendar – tiện ích ngày', () => {
  it('startOfWeek trả về Thứ 2 của tuần, toDateIso không lệch múi giờ', () => {
    expect(toDateIso(startOfWeek(new Date(2026, 10, 22)))).toBe('2026-11-16') // CN 22/11 → T2 16/11
    expect(toDateIso(startOfWeek(new Date(2026, 10, 20), 1))).toBe('2026-11-23')
  })

  it('tách link phòng họp trực tuyến trong địa điểm', () => {
    expect(extractMeetingUrl('Google Meet: https://meet.google.com/abc-defg-hij')).toBe('https://meet.google.com/abc-defg-hij')
    expect(extractMeetingUrl('Google Meet: meet.google.com/gvpb-103')).toBe('https://meet.google.com/gvpb-103')
    expect(extractMeetingUrl('Zoom zoom.us/j/123456, pass 1234')).toBe('https://zoom.us/j/123456')
    expect(extractMeetingUrl('MS Teams - K64HTTT')).toBeNull()
    expect(extractMeetingUrl('Phòng 302 - Nhà C1')).toBeNull()
    expect(extractMeetingUrl(null)).toBeNull()
  })

  it('nhận diện địa điểm trực tuyến', () => {
    expect(isOnlineLocation('MS Teams - K64')).toBe(true)
    expect(isOnlineLocation('Phòng 302 - Nhà C1')).toBe(false)
  })
})
