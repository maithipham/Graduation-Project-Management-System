import { describe, expect, it } from 'vitest'
import { API_ENDPOINTS } from '@/shared/api'
import {
  defenseScheduleKeys,
  getDefenseScheduleErrorMessage,
} from '@/features/lecturer/defense_management/hooks/useDefenseSchedule'
import { defenseScheduleService } from '@/features/lecturer/defense_management/services/defenseSchedule.service'
import { DEFENSE_SCHEDULE_ERROR_MAP } from '@/features/lecturer/defense_management/types'
import {
  combineDateAndTime,
  addMinutesToDateTime,
  parseIsoParts,
  formatDayOfWeekDate,
} from '@/features/lecturer/defense_management/utils/defenseDateUtils'
import { ApiError } from '@/shared/types'

describe('defenseSchedule API endpoints & keys (Bước 13)', () => {
  it('đúng cấu trúc API_ENDPOINTS.defenseSchedule cho 3 API', () => {
    expect(
      API_ENDPOINTS.defenseSchedule.councilSchedule('council-uuid-123'),
    ).toBe('/defense-council/council-uuid-123/defense-schedule')
    expect(
      API_ENDPOINTS.defenseSchedule.scheduleSlot('assign-uuid-456'),
    ).toBe('/defense-assignment/assign-uuid-456/defense-slot')
    expect(
      API_ENDPOINTS.defenseSchedule.unscheduleSlot('assign-uuid-456'),
    ).toBe('/defense-assignment/assign-uuid-456/defense-slot')
  })

  it('đúng cấu trúc query keys defenseScheduleKeys', () => {
    expect(defenseScheduleKeys.all).toEqual(['lecturer', 'defense-schedule'])
    expect(defenseScheduleKeys.council('council-123')).toEqual([
      'lecturer',
      'defense-schedule',
      'council',
      'council-123',
    ])
  })

  it('defenseScheduleService có đủ 3 hàm API', () => {
    expect(typeof defenseScheduleService.getCouncilDefenseSchedule).toBe(
      'function',
    )
    expect(typeof defenseScheduleService.scheduleDefenseSlot).toBe('function')
    expect(typeof defenseScheduleService.unscheduleDefenseSlot).toBe('function')
  })

  it('khớp đầy đủ bảng mã lỗi 3138–3145 theo backend ErrorCode', () => {
    expect(DEFENSE_SCHEDULE_ERROR_MAP[3138]).toBe(
      'Chỉ được xếp ca bảo vệ cho sinh viên đã đạt phản biện (Đủ điều kiện bảo vệ hoặc Đã xếp ca)',
    )
    expect(DEFENSE_SCHEDULE_ERROR_MAP[3139]).toBe(
      'Thời gian bắt đầu ca bảo vệ phải trước thời gian kết thúc',
    )
    expect(DEFENSE_SCHEDULE_ERROR_MAP[3140]).toBe(
      'Ca bảo vệ phải nằm trong mốc Thời gian tổ chức Hội đồng bảo vệ ĐATN',
    )
    expect(DEFENSE_SCHEDULE_ERROR_MAP[3141]).toBe(
      'Ca bảo vệ phải nằm trong khung lịch bảo vệ của Hội đồng',
    )
    expect(DEFENSE_SCHEDULE_ERROR_MAP[3142]).toBe(
      'Ca bảo vệ bị chồng lấn thời gian với ca của sinh viên khác trong Hội đồng',
    )
    expect(DEFENSE_SCHEDULE_ERROR_MAP[3143]).toBe(
      'Số thứ tự ca bảo vệ đã được dùng cho sinh viên khác trong Hội đồng',
    )
    expect(DEFENSE_SCHEDULE_ERROR_MAP[3144]).toBe(
      'Sinh viên chưa được xếp ca bảo vệ',
    )
    expect(DEFENSE_SCHEDULE_ERROR_MAP[3145]).toBe(
      'Chưa nhập phòng bảo vệ và Hội đồng chưa có địa điểm mặc định',
    )

    // Test getDefenseScheduleErrorMessage with ApiError
    const err3142 = new ApiError('Chồng ca', 3142, null, 409)
    expect(getDefenseScheduleErrorMessage(err3142)).toBe(
      'Ca bảo vệ bị chồng lấn thời gian với ca của sinh viên khác trong Hội đồng',
    )

    const errUnknown = new ApiError('Lỗi lạ', 9999, null, 400)
    expect(getDefenseScheduleErrorMessage(errUnknown)).toBe('Lỗi lạ')
  })

  it('xử lý ngày giờ ISO không có múi giờ (LocalDateTime) chính xác, không dùng toISOString', () => {
    const combined = combineDateAndTime('2026-06-21', '08:00')
    expect(combined).toBe('2026-06-21T08:00:00')

    const parts = parseIsoParts('2026-06-21T08:30:00')
    expect(parts).toEqual({
      date: '2026-06-21',
      time: '08:30',
      hours: 8,
      minutes: 30,
    })

    const next = addMinutesToDateTime('2026-06-21', '08:00', 30)
    expect(next.dateStr).toBe('2026-06-21')
    expect(next.timeStr).toBe('08:30')
    expect(next.iso).toBe('2026-06-21T08:30:00')

    const dayOfWeek = formatDayOfWeekDate('2026-06-21')
    expect(dayOfWeek).toContain('21/06/2026')
    expect(dayOfWeek).toContain('Chủ Nhật')
  })
})
