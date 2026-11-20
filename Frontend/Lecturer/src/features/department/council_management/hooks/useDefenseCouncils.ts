import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback/toast.store'
import { defenseCouncilApi } from '../services/defenseCouncilApi'
import type {
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
