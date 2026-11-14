import { useScheduleStore } from '../store/schedule.store'

export function useScheduleManagement() {
  const { schedules, setSchedules } = useScheduleStore()
  return {
    schedules,
    setSchedules,
  }
}
