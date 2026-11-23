import { DeadlineProgress } from '../components/DeadlineProgress'
import { ScheduleTable } from '../components/ScheduleTable'
import { useScheduleManagement } from '../hooks/useScheduleManagement'
import { useSemesterDeadlines } from '../hooks/useSemesterDeadlines'

export default function StudentSchedulePage() {
  const { schedules } = useScheduleManagement()
  const { semester, milestones, percent, nowMs, isLoading, isError } =
    useSemesterDeadlines()

  return (
    <div className="max-w-7xl w-full mx-auto space-y-6">
      <DeadlineProgress
        milestones={milestones}
        percent={percent}
        semesterName={semester?.name}
        isLoading={isLoading}
        isError={isError}
      />
      <ScheduleTable schedules={schedules} nowMs={nowMs} />
    </div>
  )
}
