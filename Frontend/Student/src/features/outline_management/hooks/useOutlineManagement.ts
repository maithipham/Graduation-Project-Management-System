import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback/toast.store'
import { outlineService } from '../services/outline.service'
import type { SubmitOutlineRequest } from '../types/outline.types'
import { TOPIC_TITLE_KEYS } from './useTopicTitle'

export const STUDENT_OUTLINE_KEYS = {
  all: ['student-outline'] as const,
  mine: (semesterId?: string) => ['student-outline', 'mine', semesterId] as const,
}

/** Lấy đề cương hiện tại, lịch sử nộp và thời hạn nộp đề cương từ Backend. */
export const useMyOutline = (semesterId?: string) => {
  return useQuery({
    queryKey: STUDENT_OUTLINE_KEYS.mine(semesterId),
    queryFn: () => outlineService.getMyOutline(semesterId),
    staleTime: 30 * 1000,
  })
}

/** Nộp mới hoặc nộp lại tệp đề cương lên Backend (`POST /outline/submit`). */
export const useSubmitOutline = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SubmitOutlineRequest) => outlineService.submitOutline(payload),
    onSuccess: () => {
      toast.success('Nộp đề cương thành công!')
      void queryClient.invalidateQueries({ queryKey: STUDENT_OUTLINE_KEYS.all })
      void queryClient.invalidateQueries({ queryKey: TOPIC_TITLE_KEYS.all })
    },
  })
}
