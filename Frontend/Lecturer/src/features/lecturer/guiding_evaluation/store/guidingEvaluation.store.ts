import { useLecturerPortalStore } from '@/features/lecturer/lecturer_portal_storage'
import type { GuidingEvaluationItem } from '../types/guidingEvaluation.types'

export const useGuidingEvaluationStore = () => {
  const guidingEvaluations = useLecturerPortalStore((s) => s.guidingEvaluations)
  const teacher = useLecturerPortalStore((s) => s.teacher)
  const academicYear = useLecturerPortalStore((s) => s.academicYear)
  const semester = useLecturerPortalStore((s) => s.semester)
  const submitEvaluationTrackingFile = useLecturerPortalStore(
    (s) => s.submitEvaluationTrackingFile,
  )
  const saveEvaluationRubric = useLecturerPortalStore((s) => s.saveEvaluationRubric)

  return {
    guidingEvaluations: guidingEvaluations as GuidingEvaluationItem[],
    teacher,
    academicYear,
    semester,
    submitEvaluationTrackingFile,
    saveEvaluationRubric,
  }
}

