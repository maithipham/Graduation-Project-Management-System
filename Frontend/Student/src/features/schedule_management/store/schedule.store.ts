import { create } from 'zustand'
import type { StudentScheduleItem } from '../types/schedule.types'
import { scheduleService } from '../services/schedule.service'

interface ScheduleState {
  schedules: StudentScheduleItem[]
  setSchedules: (schedules: StudentScheduleItem[]) => void
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  schedules: scheduleService.getSchedules(),
  setSchedules: (schedules) => set({ schedules }),
}))
