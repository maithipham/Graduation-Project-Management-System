import { create } from 'zustand'
import type { DefenseSchedule } from '../types'

interface ScheduleState {
  schedule: DefenseSchedule | null
  setSchedule: (s: DefenseSchedule) => void
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  schedule: null,
  setSchedule: (schedule) => set({ schedule }),
}))
