import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCurrentSemester } from '@/features/registration_management'
import {
  computeMilestones,
  computeOverallPercent,
  deadlineService,
} from '../services/deadline.service'

const TICK_MS = 60_000

/** Mốc thời hạn của học kỳ hiện tại; tự tính lại mỗi phút theo giờ hiện tại. */
export function useSemesterDeadlines() {
  const semesterQuery = useCurrentSemester()
  const semesterId = semesterQuery.data?.publicId ?? semesterQuery.data?.id

  const deadlinesQuery = useQuery({
    queryKey: ['semester-deadlines', semesterId],
    queryFn: () => deadlineService.getBySemester(semesterId as string),
    enabled: Boolean(semesterId),
  })

  const [nowMs, setNowMs] = useState<number>(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), TICK_MS)
    return () => window.clearInterval(timer)
  }, [])

  const milestones = useMemo(
    () => computeMilestones(deadlinesQuery.data ?? [], nowMs),
    [deadlinesQuery.data, nowMs],
  )

  return {
    semester: semesterQuery.data ?? null,
    milestones,
    percent: computeOverallPercent(milestones),
    nowMs,
    isLoading: semesterQuery.isLoading || deadlinesQuery.isLoading,
    isError: semesterQuery.isError || deadlinesQuery.isError,
  }
}
