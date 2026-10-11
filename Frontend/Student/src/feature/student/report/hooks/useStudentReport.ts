import { useState, useEffect } from 'react'
import { studentReportService } from '../services'
import type { WeeklyReport } from '../types'

export function useStudentReport() {
  const [reports, setReports] = useState<WeeklyReport[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    studentReportService.getWeeklyReports().then((res) => {
      if (mounted) {
        setReports(res)
        setIsLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  const submit = async (data: Omit<WeeklyReport, 'id' | 'submittedAt' | 'status'>) => {
    const res = await studentReportService.submitWeeklyReport(data)
    setReports((prev) => [...prev, res])
    return res
  }

  return { reports, isLoading, submit }
}
