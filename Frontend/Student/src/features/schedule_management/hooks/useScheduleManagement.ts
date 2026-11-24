import { useQuery } from '@tanstack/react-query'
import { useCurrentSemester } from '@/features/registration_management'
import { scheduleService } from '../services/schedule.service'

/** Lịch chung (phản biện + bảo vệ) của sinh viên đang đăng nhập trong học kỳ hiện tại. */
export function useScheduleManagement() {
  const semesterQuery = useCurrentSemester()
  const semesterId = semesterQuery.data?.publicId ?? semesterQuery.data?.id

  const scheduleQuery = useQuery({
    queryKey: ['student-schedule', semesterId ?? 'all'],
    queryFn: () => scheduleService.getMySchedule(semesterId as string | undefined),
    // Chờ biết học kỳ hiện tại; không lấy được học kỳ thì vẫn tải toàn bộ lịch
    enabled: !semesterQuery.isLoading,
  })

  return {
    schedules: scheduleQuery.data ?? [],
    isLoading: semesterQuery.isLoading || scheduleQuery.isLoading,
    isError: scheduleQuery.isError,
  }
}
