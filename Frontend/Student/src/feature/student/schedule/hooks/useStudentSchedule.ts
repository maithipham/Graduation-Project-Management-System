import { useState, useEffect } from 'react'
import { studentScheduleService } from '../services'
import type { DefenseSchedule } from '../types'

export function useStudentSchedule() {
  const [schedule, setSchedule] = useState<DefenseSchedule | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    studentScheduleService.getSchedule().then((s) => {
      if (mounted) {
        setSchedule(s)
        setIsLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  return { schedule, isLoading }
}
