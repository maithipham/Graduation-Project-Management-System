import { useState } from 'react'
import { ScheduleTable } from '../components/ScheduleTable'
import { useScheduleManagement } from '../hooks/useScheduleManagement'

export default function StudentSchedulePage() {
  const [nowMs] = useState<number>(() => Date.now())
  const { schedules } = useScheduleManagement()

  return (
    <div className="max-w-7xl w-full mx-auto space-y-6">
      <ScheduleTable schedules={schedules} nowMs={nowMs} />
    </div>
  )
}
