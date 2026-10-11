import { useState, useEffect } from 'react'
import { lecturerEvaluationService } from '../services/evaluation.service'
import type { ProgressEvaluationDto } from '../types'

export function useReportEval() {
  const [reports, setReports] = useState<ProgressEvaluationDto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    lecturerEvaluationService.getStudentReports().then((res) => {
      if (mounted) {
        setReports(res)
        setIsLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  const submitEvaluation = async (dto: ProgressEvaluationDto) => {
    const success = await lecturerEvaluationService.submitEvaluation(dto)
    if (success) {
      setReports((prev) =>
        prev.map((r) => (r.reportId === dto.reportId ? dto : r)),
      )
    }
    return success
  }

  return { reports, isLoading, submitEvaluation }
}
