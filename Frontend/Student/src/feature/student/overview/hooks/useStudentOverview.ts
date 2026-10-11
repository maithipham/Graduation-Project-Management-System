import { useState, useEffect } from 'react'
import { overviewService } from '../services'
import type { OverviewProgress } from '../types'

export function useStudentOverview() {
  const [progress, setProgress] = useState<OverviewProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    overviewService.getProgress().then((p) => {
      if (mounted) {
        setProgress(p)
        setIsLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  return { progress, isLoading }
}
