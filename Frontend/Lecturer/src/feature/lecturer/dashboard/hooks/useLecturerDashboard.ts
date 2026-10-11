import { useState, useEffect } from 'react'
import { dashboardService } from '../services/dashboard.service'
import type { LecturerDashboardStats, SupervisedStudent } from '../types'

export function useLecturerDashboard() {
  const [stats, setStats] = useState<LecturerDashboardStats | null>(null)
  const [students, setStudents] = useState<SupervisedStudent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    Promise.all([
      dashboardService.getOverviewStats(),
      dashboardService.getSupervisedStudents(),
    ]).then(([s, st]) => {
      if (mounted) {
        setStats(s)
        setStudents(st)
        setIsLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  return { stats, students, isLoading }
}
