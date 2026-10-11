import { useState, useEffect } from 'react'
import { studentResultsService } from '../services'
import type { EvaluationScore } from '../types'

export function useStudentResults() {
  const [scores, setScores] = useState<EvaluationScore | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    studentResultsService.getEvaluationScores().then((s) => {
      if (mounted) {
        setScores(s)
        setIsLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  return { scores, isLoading }
}
