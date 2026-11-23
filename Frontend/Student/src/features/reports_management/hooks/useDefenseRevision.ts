import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback/toast.store'
import { defenseRevisionService } from '../services/defenseRevision.service'
import type { SubmitDefenseRevisionPayload } from '../types/defenseRevision.types'

export const DEFENSE_REVISION_KEYS = {
  all: ['student-defense-revision'] as const,
  mine: (semesterId?: string) => ['student-defense-revision', 'mine', semesterId] as const,
}

/** Yêu cầu chỉnh sửa và nộp lại báo cáo sau bảo vệ (`data = null` khi không có yêu cầu). */
export const useMyDefenseRevision = (semesterId?: string) => {
  return useQuery({
    queryKey: DEFENSE_REVISION_KEYS.mine(semesterId),
    queryFn: () => defenseRevisionService.getMyRevision(semesterId),
    staleTime: 30 * 1000,
  })
}

/** Sinh viên nộp / nộp lại bản sửa báo cáo sau bảo vệ. */
export const useSubmitDefenseRevision = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SubmitDefenseRevisionPayload) =>
      defenseRevisionService.submitRevision(payload),
    onSuccess: () => {
      toast.success('Nộp báo cáo sau bảo vệ thành công!')
      return queryClient.invalidateQueries({ queryKey: DEFENSE_REVISION_KEYS.all })
    },
  })
}
