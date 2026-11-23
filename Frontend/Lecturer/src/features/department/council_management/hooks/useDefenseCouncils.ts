import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback/toast.store'
import { defenseCouncilApi } from '../services/defenseCouncilApi'
import { resolveMilestoneState } from '../utils/councilFormatters'
import type {
  FormationMilestone,
  UpdateCommonDefenseDateRequest,
  CreateCouncilBatchRequest,
  UpdateCouncilLocationRequest,
  CandidateTeacherParams,
  UpdateCouncilMembersRequest,
  EligibleStudentParams,
  AssignStudentsToCouncilRequest,
} from '../types'

export const COUNCIL_QUERY_KEYS = {
  all: ['defense-council'] as const,
  list: (semesterId: number | string, majorId: number | string) =>
    ['defense-council', 'list', semesterId, majorId] as const,
  teachers: (params: CandidateTeacherParams) =>
    ['defense-council', 'teachers', params] as const,
  students: (params: EligibleStudentParams) =>
    ['defense-council', 'students', params] as const,
}

export function useDefenseCouncils(
  semesterId: number | string | undefined,
  majorId: number | string | undefined,
) {
  const enabled = Boolean(semesterId && majorId && semesterId !== 'all')

  return useQuery({
    queryKey: COUNCIL_QUERY_KEYS.list(semesterId ?? '', majorId ?? ''),
    queryFn: () =>
      defenseCouncilApi.getCouncils({
        semesterId: semesterId!,
        majorId: majorId!,
      }),
    enabled,
  })
}

export function useCreateCouncilBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCouncilBatchRequest) => defenseCouncilApi.createBatch(data),
    onSuccess: (_, variables) => {
      toast.success(`Đã khởi tạo thành công ${variables.quantity} hội đồng bảo vệ!`)
      queryClient.invalidateQueries({
        queryKey: COUNCIL_QUERY_KEYS.all,
      })
    },
  })
}

export function useUpdateCouncilLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      councilPublicId,
      data,
    }: {
      councilPublicId: string
      data: UpdateCouncilLocationRequest
    }) => defenseCouncilApi.updateLocation(councilPublicId, data),
    onSuccess: (council) => {
      toast.success(`Đã cập nhật phòng cho ${council.code || 'hội đồng'}!`)
      queryClient.invalidateQueries({
        queryKey: COUNCIL_QUERY_KEYS.all,
      })
    },
  })
}

/** Trạng thái mốc THANH_LAP_HOI_DONG của học kỳ (đang mở / chưa mở / đã đóng / chưa thiết lập) */
export function useFormationMilestone(
  semesterId: number | string | undefined,
  majorId: number | string | undefined,
): FormationMilestone {
  const enabled = Boolean(semesterId && majorId && semesterId !== 'all')
  const { data, isPending, isError } = useQuery({
    queryKey: ['defense-council', 'milestone', semesterId ?? '', majorId ?? ''],
    queryFn: () =>
      defenseCouncilApi.getFormationMilestone({ semesterId: semesterId!, majorId: majorId! }),
    enabled,
  })

  if (!enabled || (enabled && isPending)) {
    return { state: 'LOADING', startDate: null, endDate: null }
  }
  // Không đọc được mốc: coi như chưa thiết lập để chặn thao tác (BE vẫn là nơi quyết định cuối)
  if (isError || !data) {
    return { state: 'NOT_CONFIGURED', startDate: null, endDate: null }
  }
  return {
    state: resolveMilestoneState(data.startDate, data.endDate),
    startDate: data.startDate,
    endDate: data.endDate,
  }
}

export function useUpdateCommonDefenseDate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateCommonDefenseDateRequest) =>
      defenseCouncilApi.updateCommonDefenseDate(data),
    onSuccess: () => {
      toast.success('Đã cập nhật ngày bảo vệ chung của các hội đồng!')
      queryClient.invalidateQueries({ queryKey: COUNCIL_QUERY_KEYS.all })
    },
  })
}

export function useDeleteCouncil() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (councilPublicId: string) => defenseCouncilApi.deleteCouncil(councilPublicId),
    onSuccess: () => {
      toast.success('Đã xóa hội đồng bảo vệ!')
      queryClient.invalidateQueries({ queryKey: COUNCIL_QUERY_KEYS.all })
    },
  })
}

export function useCandidateTeachers(params: CandidateTeacherParams, enabled: boolean = true) {
  const isQueryEnabled = Boolean(
    enabled && params.semesterId && params.majorId && params.semesterId !== 'all',
  )

  return useQuery({
    queryKey: COUNCIL_QUERY_KEYS.teachers(params),
    queryFn: () => defenseCouncilApi.getTeachers(params),
    enabled: isQueryEnabled,
  })
}

export function useUpdateCouncilMembers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      councilPublicId,
      data,
    }: {
      councilPublicId: string
      data: UpdateCouncilMembersRequest
    }) => defenseCouncilApi.updateMembers(councilPublicId, data),
    onSuccess: () => {
      toast.success('Đã lưu danh sách thành viên hội đồng thành công!')
      queryClient.invalidateQueries({
        queryKey: COUNCIL_QUERY_KEYS.all,
      })
    },
  })
}

export function useEligibleStudents(params: EligibleStudentParams, enabled: boolean = true) {
  const isQueryEnabled = Boolean(
    enabled && params.semesterId && params.majorId && params.semesterId !== 'all',
  )

  return useQuery({
    queryKey: COUNCIL_QUERY_KEYS.students(params),
    queryFn: () => defenseCouncilApi.getStudents(params),
    enabled: isQueryEnabled,
  })
}

export function useAssignStudentsToCouncil() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      councilPublicId,
      data,
    }: {
      councilPublicId: string
      data: AssignStudentsToCouncilRequest
    }) => defenseCouncilApi.assignStudents(councilPublicId, data),
    onSuccess: (_, variables) => {
      toast.success(
        `Đã gán thành công ${variables.data.thesisTopicPublicIds.length} sinh viên vào hội đồng!`,
      )
      queryClient.invalidateQueries({
        queryKey: COUNCIL_QUERY_KEYS.all,
      })
    },
  })
}

/**
 * Đổi hội đồng cho các sinh viên đã gán: gỡ khỏi hội đồng cũ rồi gán vào hội đồng mới.
 */
export function useReassignStudents() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      targetCouncilPublicId,
      items,
    }: {
      targetCouncilPublicId: string
      items: Array<{
        sourceCouncilPublicId: string
        assignmentPublicId: string
        thesisTopicPublicId: string
      }>
    }) => {
      for (const it of items) {
        await defenseCouncilApi.removeStudentAssignment(
          it.sourceCouncilPublicId,
          it.assignmentPublicId,
        )
      }
      await defenseCouncilApi.assignStudents(targetCouncilPublicId, {
        thesisTopicPublicIds: items.map((it) => it.thesisTopicPublicId),
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: COUNCIL_QUERY_KEYS.all })
    },
  })
}

export function useRemoveStudentAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      councilPublicId,
      assignmentPublicId,
    }: {
      councilPublicId: string
      assignmentPublicId: string
    }) => defenseCouncilApi.removeStudentAssignment(councilPublicId, assignmentPublicId),
    onSuccess: () => {
      toast.success('Đã gỡ sinh viên khỏi hội đồng thành công!')
      queryClient.invalidateQueries({
        queryKey: COUNCIL_QUERY_KEYS.all,
      })
    },
  })
}
