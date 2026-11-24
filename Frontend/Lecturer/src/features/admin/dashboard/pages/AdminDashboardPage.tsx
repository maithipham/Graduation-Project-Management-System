import { OverviewBanner } from '../components/OverviewBanner'
import { StatCardGrid } from '../components/StatCardGrid'
import { RoleDistributionCard } from '../components/RoleDistributionCard'
import { FacultySummaryCard } from '../components/FacultySummaryCard'
import { SemesterTimelineCard } from '../components/SemesterTimelineCard'
import { useAdminOverview } from '../hooks/useAdminOverview'

export default function AdminDashboardPage() {
  const { stats, semesters, faculties } = useAdminOverview()

  return (
    <div className="space-y-6">
      <OverviewBanner />

      <StatCardGrid stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <RoleDistributionCard stats={stats} />
          <FacultySummaryCard faculties={faculties} />
        </div>

        <div className="lg:col-span-5 space-y-6">
          <SemesterTimelineCard semesters={semesters} />
        </div>
      </div>
    </div>
  )
}
