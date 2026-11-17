import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback'
import { rubricService } from '../services/rubric.service'
import type { RubricRole } from '../types'
import { RUBRIC_ERROR, hasRubricErrorCode } from '../utils/rubricErrors'
import { toEvaluationType, toSemesterRubricAssignment } from '../utils/rubricMapper'
import { rubricKeys } from './useRubrics'

// Rubric gán cho từng học kỳ (mục B của đặc tả). Dùng chung bộ key `rubricKeys` với kho rubric
// để thao tác Áp dụng / Đổi ngày / Hủy áp dụng bên useRubrics.ts tải lại được cả phần này.

/** B1 – 3 rubric (3 loại phiếu) của học kỳ đang chọn ở dropdown. Chưa chọn học kỳ → chưa gọi API */
export function useSemesterRubrics(semesterPublicId: string | undefined) {
  return useQuery({
    queryKey: rubricKeys.semester(semesterPublicId),
    queryFn:
      semesterPublicId === undefined
        ? skipToken
        : async () => (await rubricService.getSemesterRubrics(semesterPublicId)).map(toSemesterRubricAssignment),
  })
}

/** B2 – đổi rubric của một loại phiếu trong học kỳ */
export function useChangeSemesterRubric() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      semesterPublicId,
      role,
      templatePublicId,
    }: {
      semesterPublicId: string
      role: RubricRole
      templatePublicId: string
      /** Chỉ để ghép câu thông báo */
      semesterName: string
      roleLabel: string
      templateName: string
    }) =>
      rubricService.changeSemesterRubric(semesterPublicId, {
        evaluationType: toEvaluationType(role),
        templatePublicId,
      }),
    onSuccess: (_data, { semesterPublicId, semesterName, roleLabel, templateName }) => {
      toast.success(`Đã đổi rubric ${roleLabel} của ${semesterName} sang ${templateName}.`)
      // semesterCount của rubric cũ/mới thay đổi → tải lại cả danh sách
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: rubricKeys.semester(semesterPublicId) }),
        queryClient.invalidateQueries({ queryKey: rubricKeys.lists() }),
      ])
    },
    onError: (error, { semesterPublicId }) => {
      // 3111: học kỳ vừa có phiếu chấm → nút Đổi phải khóa lại; 3101/3114: rubric vừa bị xóa / về Nháp
      if (hasRubricErrorCode(error, RUBRIC_ERROR.SEMESTER_LOCKED)) {
        return queryClient.invalidateQueries({ queryKey: rubricKeys.semester(semesterPublicId) })
      }
      if (hasRubricErrorCode(error, RUBRIC_ERROR.NOT_FOUND, RUBRIC_ERROR.NOT_APPLIED)) {
        return queryClient.invalidateQueries({ queryKey: rubricKeys.lists() })
      }
      return undefined
    },
  })
}
