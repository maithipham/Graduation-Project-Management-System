import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback/toast.store'
import { topicTitleService } from '../services/topicTitle.service'
import type { TopicTitleSubmitRequest } from '../types/topicTitle.types'

export const TOPIC_TITLE_KEYS = {
  all: ['topic-title'] as const,
  overview: (semesterId?: string) => ['topic-title', 'overview', semesterId] as const,
}

/** Lấy thông tin đề tài, lịch sử nộp/đổi tên và thời hạn chốt tên / nộp đề cương. */
export const useMyTopicOverview = (semesterId?: string) => {
  return useQuery({
    queryKey: TOPIC_TITLE_KEYS.overview(semesterId),
    queryFn: () => topicTitleService.getMyTopicOverview(semesterId),
    staleTime: 30 * 1000,
  })
}

function useTopicTitleMutation(
  mutationFn: (payload: TopicTitleSubmitRequest) => Promise<void>,
  successMessage: string,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(successMessage)
      void queryClient.invalidateQueries({ queryKey: TOPIC_TITLE_KEYS.all })
      void queryClient.invalidateQueries({ queryKey: ['student-outline'] })
    },
  })
}

/** Chốt tên đề tài chính thức lần đầu (Giai đoạn 2). */
export const useConfirmInitialTitle = () =>
  useTopicTitleMutation(
    topicTitleService.confirmInitialTitle,
    'Gửi tên đề tài chính thức thành công!',
  )

/** Gửi yêu cầu xin đổi tên đề tài (sau khi đã có tên chính thức). */
export const useRequestChangeTitle = () =>
  useTopicTitleMutation(
    topicTitleService.requestChangeTitle,
    'Gửi yêu cầu đổi tên đề tài thành công!',
  )
