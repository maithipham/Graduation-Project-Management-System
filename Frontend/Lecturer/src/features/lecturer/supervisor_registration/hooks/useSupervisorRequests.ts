import { useMemo, useState } from 'react'
import {
  keepPreviousData,
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  apiClient,
  API_ENDPOINTS,
  referenceDataQueryOptions,
} from '@/shared/api'
import { toast } from '@/shared/components/feedback/toast.store'
import { useDebounce } from '@/shared/hooks'
import { semesterService } from '@/shared/services/semester.service'
import { isApiError, type ApiResponse } from '@/shared/types'
import type { SemesterResponse } from '@/shared/types/semester.types'

import { supervisorDeadlineService } from '../services/supervisorDeadline.service'
import { supervisorRegistrationService } from '../services/supervisorRegistration.service'
import type {
  GetSupervisorRequestsParams,
  SupervisorRequestCounts,
  SupervisorRequestItem,
  SupervisorTabStatus,
} from '../types/supervisorRegistration.types'

const PAGE_SIZE = 15
const SEARCH_DEBOUNCE_MS = 300

const INITIAL_COUNTS: SupervisorRequestCounts = {
  pending: 0,
  approved: 0,
  rejected: 0,
  assigned: 0,
  all: 0,
}

export const supervisorRegistrationKeys = {
  all: ['lecturer', 'supervisor-registrations'] as const,
  lists: () => [...supervisorRegistrationKeys.all, 'list'] as const,
  list: (params: GetSupervisorRequestsParams) =>
    [...supervisorRegistrationKeys.lists(), params] as const,
  detail: (id: string | undefined) =>
    [...supervisorRegistrationKeys.all, 'detail', id] as const,
  deadlines: () => [...supervisorRegistrationKeys.all, 'deadline'] as const,
  deadline: (semesterPublicId: string | undefined) =>
    [...supervisorRegistrationKeys.deadlines(), semesterPublicId] as const,
  semesters: ['lecturer', 'supervisor-registrations', 'semesters'] as const,
  currentSemester: [
    'lecturer',
    'supervisor-registrations',
    'current-semester',
  ] as const,
}

/** Danh sách học kỳ cho dropdown chọn học kỳ */
export function useLecturerSemesters() {
  return useQuery({
    queryKey: supervisorRegistrationKeys.semesters,
    queryFn: () => semesterService.getAllSemesters(),
    ...referenceDataQueryOptions,
  })
}

/** Học kỳ hiện tại (tắt toast lỗi tự động vì có fallback chọn học kỳ mới nhất) */
export function useLecturerCurrentSemester() {
  return useQuery({
    queryKey: supervisorRegistrationKeys.currentSemester,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<SemesterResponse>>(
        API_ENDPOINTS.semester.current,
        { skipErrorToast: true },
      )
      return response.data.data
    },
    ...referenceDataQueryOptions,
    retry: false,
  })
}

/** Thời hạn đăng ký GVHD theo học kỳ */
export function useSupervisorDeadline(semesterPublicId: string | undefined) {
  return useQuery({
    queryKey: supervisorRegistrationKeys.deadline(semesterPublicId),
    queryFn: semesterPublicId
      ? () =>
          supervisorDeadlineService.getRegistrationDeadline(semesterPublicId)
      : skipToken,
  })
}

/** Danh sách đơn đăng ký GVHD theo học kỳ, trạng thái tab và từ khóa */
export function useSupervisorRequestsList(
  params: GetSupervisorRequestsParams,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: supervisorRegistrationKeys.list(params),
    queryFn: () => supervisorRegistrationService.getRequests(params),
    placeholderData: keepPreviousData,
    enabled: enabled && Boolean(params.semesterPublicId),
  })
}

/** Chi tiết một đơn đăng ký GVHD. Chưa chọn đơn -> chưa gọi API */
export function useSupervisorRequestDetail(id: string | undefined) {
  return useQuery({
    queryKey: supervisorRegistrationKeys.detail(id),
    queryFn:
      id === undefined
        ? skipToken
        : () => supervisorRegistrationService.getRequestDetail(id),
  })
}

/** Duyệt đơn đăng ký GVHD; onSettled tải lại danh sách để đồng bộ cả trường hợp tự động từ chối khi chạm quota */
export function useApproveSupervisorRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      supervisorRegistrationService.approveRequest(id),
    onSuccess: (data) => {
      toast.success(
        data?.studentName
          ? `Đã tiếp nhận hướng dẫn đồ án cho sinh viên ${data.studentName} thành công!`
          : 'Duyệt đơn đăng ký giảng viên hướng dẫn thành công!',
      )
    },
    onSettled: (_data, _error, id) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: supervisorRegistrationKeys.lists(),
        }),
        queryClient.invalidateQueries({
          queryKey: supervisorRegistrationKeys.detail(id),
        }),
      ]),
  })
}

/** Từ chối đơn đăng ký GVHD; lỗi đã được interceptor hiển thị toast nên không toast.error trùng */
export function useRejectSupervisorRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => supervisorRegistrationService.rejectRequest(id),
    onSuccess: (data) => {
      toast.success(
        data?.studentName
          ? `Đã từ chối hướng dẫn đồ án của sinh viên ${data.studentName}!`
          : 'Từ chối đơn đăng ký giảng viên hướng dẫn thành công!',
      )
    },
    onSettled: (_data, _error, id) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: supervisorRegistrationKeys.lists(),
        }),
        queryClient.invalidateQueries({
          queryKey: supervisorRegistrationKeys.detail(id),
        }),
      ]),
  })
}

export function useSupervisorRequests(semesterPublicId: string) {
  const [tabStatus, setTabStatusState] =
    useState<SupervisorTabStatus>('pending')
  const [searchQuery, setSearchQueryState] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [approveTarget, setApproveTarget] =
    useState<SupervisorRequestItem | null>(null)
  const [rejectTarget, setRejectTarget] =
    useState<SupervisorRequestItem | null>(null)
  const [detailTargetId, setDetailTargetId] = useState<string | undefined>(
    undefined,
  )

  const debouncedKeyword = useDebounce(searchQuery.trim(), SEARCH_DEBOUNCE_MS)

  const requestsQuery = useSupervisorRequestsList(
    {
      semesterPublicId,
      status: tabStatus,
      keyword: debouncedKeyword,
    },
    { enabled: Boolean(semesterPublicId) },
  )

  const detailQuery = useSupervisorRequestDetail(detailTargetId)
  const approveMutation = useApproveSupervisorRequest()
  const rejectMutation = useRejectSupervisorRequest()

  const setTabStatus = (nextStatus: SupervisorTabStatus) => {
    setTabStatusState(nextStatus)
    setCurrentPage(1)
  }

  const setSearchQuery = (nextQuery: string) => {
    setSearchQueryState(nextQuery)
    setCurrentPage(1)
  }

  const filtered = useMemo(
    () => requestsQuery.data?.items ?? [],
    [requestsQuery.data?.items],
  )
  const counts = requestsQuery.data?.counts ?? INITIAL_COUNTS

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const startIdx = (safePage - 1) * PAGE_SIZE
  const endIdx = Math.min(startIdx + PAGE_SIZE, filtered.length)
  const pageData = filtered.slice(startIdx, endIdx)

  const handleConfirmApprove = (id: string) => {
    approveMutation.mutate(id, {
      onSettled: () => {
        setApproveTarget(null)
        setDetailTargetId((prev) => (prev === id ? undefined : prev))
      },
    })
  }

  const handleConfirmReject = (id: string) => {
    rejectMutation.mutate(id, {
      onSettled: () => {
        setRejectTarget(null)
        setDetailTargetId((prev) => (prev === id ? undefined : prev))
      },
    })
  }

  const error = requestsQuery.isError
    ? isApiError(requestsQuery.error)
      ? requestsQuery.error.message
      : 'Không thể tải danh sách yêu cầu đăng ký GVHD.'
    : null

  return {
    tabStatus,
    setTabStatus,

    searchQuery,
    setSearchQuery,

    currentPage: safePage,
    setCurrentPage,

    totalPages,
    counts,
    filtered,
    pageData,

    loading: Boolean(semesterPublicId) && requestsQuery.isPending,
    isPlaceholderData: requestsQuery.isPlaceholderData,
    error,

    approveTarget,
    setApproveTarget,
    isApproving: approveMutation.isPending,

    rejectTarget,
    setRejectTarget,
    isRejecting: rejectMutation.isPending,

    detailTargetId,
    setDetailTargetId,
    detailData: detailQuery.data,
    detailLoading: detailQuery.isPending,
    detailError: detailQuery.isError
      ? isApiError(detailQuery.error)
        ? detailQuery.error.message
        : 'Không thể tải chi tiết đơn đăng ký.'
      : null,

    handleConfirmApprove,
    handleConfirmReject,
  }
}
