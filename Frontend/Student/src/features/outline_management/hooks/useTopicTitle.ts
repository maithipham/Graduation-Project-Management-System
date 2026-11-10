import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback/toast.store'
import { topicTitleService } from '../services/topicTitle.service'
import type { TopicTitleSubmitRequest } from '../types/topicTitle.types'

export const TOPIC_TITLE_KEYS = {
  all: ['topic-title'] as const,
  overview: (semesterId?: string) => ['topic-title', 'overview', semesterId] as const,
}

// Hook lấy thông tin đề tài & toàn bộ lịch sử nộp/đổi tên
export const useMyTopicOverview = (semesterId?: string) => {
  return useQuery({
    queryKey: TOPIC_TITLE_KEYS.overview(semesterId),
    queryFn: () => topicTitleService.getMyTopicOverview(semesterId),
    staleTime: 30 * 1000,
  })
}

// Hook chốt tên đề tài chính thức lần đầu
export const useConfirmInitialTitle = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: TopicTitleSubmitRequest) =>
      topicTitleService.confirmInitialTitle(payload),
    onSuccess: () => {
      toast.success('Gửi tên đề tài chính thức thành công!')
      queryClient.invalidateQueries({ queryKey: TOPIC_TITLE_KEYS.all })
    },
  })
}

// Hook xin đổi tên đề tài
export const useRequestChangeTitle = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: TopicTitleSubmitRequest) =>
      topicTitleService.requestChangeTitle(payload),
    onSuccess: () => {
      toast.success('Gửi yêu cầu đổi tên đề tài thành công!')
      queryClient.invalidateQueries({ queryKey: TOPIC_TITLE_KEYS.all })
    },
  })
}

