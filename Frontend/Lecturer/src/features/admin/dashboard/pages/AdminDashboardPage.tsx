import { useState, useMemo } from 'react'
import { useAccountStore } from '@/features/admin/account_management'
import { useSemesterStore } from '@/features/admin/semester_management'
import { useFacultyStore } from '@/features/admin/faculty_management'
import { formatDate } from '@/shared/utils/formatDate'
import { OverviewBanner } from '../components/OverviewBanner'
import { StatCardGrid } from '../components/StatCardGrid'
import { RoleDistributionCard } from '../components/RoleDistributionCard'
import { FacultySummaryCard } from '../components/FacultySummaryCard'
import { SemesterTimelineCard } from '../components/SemesterTimelineCard'
import { ActivityHistoryTimeline } from '../components/ActivityHistoryTimeline'
import { AddAccountDialog } from '@/features/admin/account_management/components/AddAccountDialog'
import { SemesterFormDialog } from '@/features/admin/semester_management/components/SemesterFormDialog'
import { FacultyFormDialog } from '@/features/admin/faculty_management/components/FacultyFormDialog'
import type { SystemOverviewStats } from '../types/overview.types'

export default function AdminDashboardPage() {
  const { accounts, addAccount } = useAccountStore()
  const { semesters, addSemester } = useSemesterStore()
  const { faculties, addFaculty } = useFacultyStore()

  // Quick Action Modal states
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false)
  const [isAddSemesterOpen, setIsAddSemesterOpen] = useState(false)
  const [isAddFacultyOpen, setIsAddFacultyOpen] = useState(false)

  // Compute live overview statistics
  const stats: SystemOverviewStats = useMemo(() => {
    const totalAccounts = accounts.length
    const activeAccounts = accounts.filter((a) => a.status === 'active').length
    const inactiveAccounts = accounts.filter((a) => a.status === 'inactive').length
    const activeRate = totalAccounts
      ? Math.round((activeAccounts / totalAccounts) * 100)
      : 0

    const studentCount = accounts.filter((a) => a.role === 'Sinh viên').length
    const lecturerCount = accounts.filter((a) => a.role === 'Giảng viên').length
    const adminCount = accounts.filter((a) => a.role === 'Quản trị viên').length

    const studentPct = totalAccounts
      ? Number(((studentCount / totalAccounts) * 100).toFixed(1))
      : 0
    const lecturerPct = totalAccounts
      ? Number(((lecturerCount / totalAccounts) * 100).toFixed(1))
      : 0
    const adminPct = totalAccounts
      ? Number(((adminCount / totalAccounts) * 100).toFixed(1))
      : 0

    const activeSemester = semesters.find((s) => s.status === 'active')
    const upcomingSemester = semesters.find((s) => s.status === 'upcoming')
    const currentSemester = activeSemester || upcomingSemester

    const currentSemesterName = currentSemester
      ? currentSemester.name
      : 'Chưa thiết lập'
    const currentSemesterPeriod = currentSemester
      ? `${formatDate(currentSemester.startDate)} - ${formatDate(
          currentSemester.endDate,
        )}`
      : 'Chưa có lịch'

    const totalFaculties = faculties.length
    const totalMajors = faculties.reduce(
      (sum, f) => sum + (f.majors?.length || 0),
      0,
    )

    return {
      totalAccounts,
      activeAccounts,
      inactiveAccounts,
      activeRate,
      studentCount,
      studentPct,
      lecturerCount,
      lecturerPct,
      adminCount,
      adminPct,
      currentSemesterName,
      currentSemesterPeriod,
      totalFaculties,
      totalMajors,
    }
  }, [accounts, semesters, faculties])

  return (
    <div className="space-y-6">
      {/* 1. Overview Banner */}
      <OverviewBanner
        onQuickAddAccount={() => setIsAddAccountOpen(true)}
        onQuickAddSemester={() => setIsAddSemesterOpen(true)}
        onQuickAddFaculty={() => setIsAddFacultyOpen(true)}
      />

      {/* 2. 4 Stat KPI Cards */}
      <StatCardGrid stats={stats} />

      {/* 3. Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Roles & Faculties */}
        <div className="lg:col-span-7 space-y-6">
          <RoleDistributionCard stats={stats} />
          <FacultySummaryCard faculties={faculties} />
        </div>

        {/* Right Column: Semesters & Activity Log */}
        <div className="lg:col-span-5 space-y-6">
          <SemesterTimelineCard semesters={semesters} />
          <ActivityHistoryTimeline accounts={accounts} />
        </div>
      </div>

      {/* Quick Modals */}
      <AddAccountDialog
        open={isAddAccountOpen}
        onOpenChange={setIsAddAccountOpen}
        existingAccounts={accounts}
        onAccountAdded={addAccount}
      />

      <SemesterFormDialog
        open={isAddSemesterOpen}
        onOpenChange={setIsAddSemesterOpen}
        editingSemester={null}
        onSubmitSuccess={(vals) => addSemester(vals)}
      />

      <FacultyFormDialog
        open={isAddFacultyOpen}
        onOpenChange={setIsAddFacultyOpen}
        editingFaculty={null}
        existingFaculties={faculties}
        onSubmitSuccess={(vals) => addFaculty(vals)}
      />
    </div>
  )
}
