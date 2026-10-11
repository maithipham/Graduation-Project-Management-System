import { apiClient } from '@/shared/api/client'
import type { DefenseSchedule } from '../types'

export interface IScheduleService {
  getSchedule(): Promise<DefenseSchedule>
}

export const studentScheduleService: IScheduleService = {
  getSchedule: async (): Promise<DefenseSchedule> => {
    try {
      const res = await apiClient.get<DefenseSchedule>('/student/schedule')
      return res.data
    } catch {
      return {
        councilName: 'Hội đồng 01 - Chuyên ngành Công nghệ phần mềm',
        defenseDate: '2026-11-20',
        timeSession: '08:30 - 09:15',
        room: 'Phòng 402, Tòa Beta',
        orderNumber: 2,
      }
    }
  },
}
