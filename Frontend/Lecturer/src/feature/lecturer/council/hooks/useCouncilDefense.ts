import { useState, useEffect } from 'react'
import { lecturerCouncilService } from '../services/council.service'
import type { CouncilDefenseStudent, DefenseGradingSubmission } from '../types'

export function useCouncilDefense(councilId?: string) {
  const [students, setStudents] = useState<CouncilDefenseStudent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    lecturerCouncilService.getCouncilStudents(councilId).then((res) => {
      if (mounted) {
        setStudents(res)
        setIsLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [councilId])

  const submitGrading = async (submission: DefenseGradingSubmission) => {
    const success = await lecturerCouncilService.submitGrading(submission)
    return success
  }

  return { students, isLoading, submitGrading }
}
