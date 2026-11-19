import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback/toast.store'
import { isApiError } from '@/shared/types'
import { defenseScheduleService } from '../services/defenseSchedule.service'
import {
  DEFENSE_SCHEDULE_ERROR_MAP,
  type ScheduleDefenseSlotRequest,
} from '../types'

export const defenseScheduleKeys = {
  all: ['lecturer', 'defense-schedule'] as const,
  council: (councilPublicId: string) =>
    [...defenseScheduleKeys.all, 'council', councilPublicId] as const,
}

export function getDefenseScheduleErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    if (typeof error.code === 'number' && DEFENSE_SCHEDULE_ERROR_MAP[error.code]) {
      return DEFENSE_SCHEDULE_ERROR_MAP[error.code]
    }
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Có lỗi xảy ra khi thao tác với lịch bảo vệ'
}

// 1. Hook lấy dữ liệu Lịch bảo vệ Hội đồng
export function useCouncilDefenseSchedule(councilPublicId?: string) {
  return useQuery({
    queryKey: councilPublicId
      ? defenseScheduleKeys.council(councilPublicId)
      : defenseScheduleKeys.all,
    queryFn: councilPublicId
      ? () => defenseScheduleService.getCouncilDefenseSchedule(councilPublicId)
      : skipToken,
    enabled: Boolean(councilPublicId),
  })
}

// 2. Hook xếp / sửa ca bảo vệ cho 1 sinh viên (thường dùng trong Dialog)
export function useScheduleDefenseSlot(councilPublicId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      defenseAssignmentPublicId,
      data,
    }: {
      defenseAssignmentPublicId: string
      data: ScheduleDefenseSlotRequest
    }) =>
      defenseScheduleService.scheduleDefenseSlot(
        defenseAssignmentPublicId,
        data,
        { skipErrorToast: true },
      ),
    onSuccess: () => {
      toast.success('Xếp ca bảo vệ thành công')
      void queryClient.invalidateQueries({
        queryKey: defenseScheduleKeys.council(councilPublicId),
      })
    },
    onError: (error) => {
      toast.error(getDefenseScheduleErrorMessage(error))
    },
  })
}

// 3. Hook gỡ ca bảo vệ
export function useUnscheduleDefenseSlot(councilPublicId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (defenseAssignmentPublicId: string) =>
      defenseScheduleService.unscheduleDefenseSlot(defenseAssignmentPublicId, {
        skipErrorToast: true,
      }),
    onSuccess: () => {
      toast.success('Gỡ ca bảo vệ thành công')
      void queryClient.invalidateQueries({
        queryKey: defenseScheduleKeys.council(councilPublicId),
      })
    },
    onError: (error) => {
      toast.error(getDefenseScheduleErrorMessage(error))
    },
  })
}

// 4. Hook xếp ca hàng loạt TUẦN TỰ (Sequential)
// FE gọi PUT lần lượt cho từng sinh viên, KHÔNG gọi song song, để backend không báo chồng giờ
export function useBatchScheduleDefenseSlots(councilPublicId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      items: Array<{
        defenseAssignmentPublicId: string
        data: ScheduleDefenseSlotRequest
      }>,
    ) => {
      for (const item of items) {
        await defenseScheduleService.scheduleDefenseSlot(
          item.defenseAssignmentPublicId,
          item.data,
          { skipErrorToast: true },
        )
      }
    },
    onSuccess: (_, variables) => {
      toast.success(`Đã xếp ca thành công cho ${variables.length} sinh viên!`)
      void queryClient.invalidateQueries({
        queryKey: defenseScheduleKeys.council(councilPublicId),
      })
    },
    onError: (error) => {
      toast.error(getDefenseScheduleErrorMessage(error))
      void queryClient.invalidateQueries({
        queryKey: defenseScheduleKeys.council(councilPublicId),
      })
    },
  })
}

// 5. Hook đặt lại lịch bảo vệ của Hội đồng (gỡ toàn bộ ca đã xếp tuần tự)
export function useResetCouncilSchedule(councilPublicId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (defenseAssignmentPublicIds: string[]) => {
      for (const id of defenseAssignmentPublicIds) {
        await defenseScheduleService.unscheduleDefenseSlot(id, {
          skipErrorToast: true,
        })
      }
    },
    onSuccess: () => {
      toast.success('Đã đặt lại toàn bộ lịch bảo vệ của hội đồng')
      void queryClient.invalidateQueries({
        queryKey: defenseScheduleKeys.council(councilPublicId),
      })
    },
    onError: (error) => {
      toast.error(getDefenseScheduleErrorMessage(error))
      void queryClient.invalidateQueries({
        queryKey: defenseScheduleKeys.council(councilPublicId),
      })
    },
  })
}
