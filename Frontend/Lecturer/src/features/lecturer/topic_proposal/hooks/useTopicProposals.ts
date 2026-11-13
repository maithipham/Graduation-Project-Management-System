import { useMemo, useState } from 'react'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { referenceDataQueryOptions } from '@/shared/api'
import { toast } from '@/shared/components/feedback/toast.store'
import { semesterService } from '@/shared/services/semester.service'
import {
  computeTopicDeadlineStatus,
  topicProposalService,
} from '../services/topicProposal.service'
import type {
  TopicProposalCounts,
  TopicProposalTabStatus,
  TopicTitleFilterParams,
  TopicTitleHistoryResponse,
  TopicTitleReviewRequest,
} from '../types/topicProposal.types'

const PAGE_SIZE = 15

export const TOPIC_TITLE_QUERY_KEYS = {
  all: ['lecturer', 'topic-proposals'] as const,
  requests: (params?: TopicTitleFilterParams) =>
    [...TOPIC_TITLE_QUERY_KEYS.all, 'requests', params] as const,
  history: (topicPublicId: string) =>
    [...TOPIC_TITLE_QUERY_KEYS.all, 'history', topicPublicId] as const,
  deadline: (semesterId: string | undefined) =>
    [...TOPIC_TITLE_QUERY_KEYS.all, 'deadline', semesterId] as const,
  semesters: ['lecturer', 'topic-proposals', 'semesters'] as const,
  currentSemester: ['lecturer', 'topic-proposals', 'current-semester'] as const,
}

/** Danh sách học kỳ cho dropdown chọn học kỳ */
export function useTopicProposalSemesters() {
  return useQuery({
    queryKey: TOPIC_TITLE_QUERY_KEYS.semesters,
    queryFn: () => semesterService.getAllSemesters(),
    ...referenceDataQueryOptions,
  })
}

/** Học kỳ hiện tại */
export function useTopicProposalCurrentSemester() {
  return useQuery({
    queryKey: TOPIC_TITLE_QUERY_KEYS.currentSemester,
    queryFn: () => semesterService.getCurrentSemester(),
    ...referenceDataQueryOptions,
    retry: false,
  })
}

/** Hook lấy deadline mốc nộp đề cương / đổi tên */
export function useTopicTitleDeadline(semesterId?: string) {
  return useQuery({
    queryKey: TOPIC_TITLE_QUERY_KEYS.deadline(semesterId),
    queryFn: () => topicProposalService.getOutlineDeadline(semesterId!),
    enabled: Boolean(semesterId),
  })
}

/** Hook lấy danh sách yêu cầu */
export function useTopicTitleRequests(params?: TopicTitleFilterParams) {
  return useQuery({
    queryKey: TOPIC_TITLE_QUERY_KEYS.requests(params),
    queryFn: () => topicProposalService.getRequestsForSupervisor(params),
    placeholderData: keepPreviousData,
  })
}

/** Hook lấy lịch sử của 1 đề tài */
export function useTopicTitleHistory(topicPublicId?: string) {
  return useQuery({
    queryKey: TOPIC_TITLE_QUERY_KEYS.history(topicPublicId || ''),
    queryFn: () => topicProposalService.getTopicHistory(topicPublicId!),
    enabled: Boolean(topicPublicId),
  })
}

/** Hook duyệt hoặc từ chối yêu cầu */
export function useReviewTopicTitle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      publicId,
      payload,
    }: {
      publicId: string
      payload: TopicTitleReviewRequest
    }) => topicProposalService.reviewTopicTitle(publicId, payload),
    onSuccess: () => {
      // Invalidate lại danh sách và lịch sử
      queryClient.invalidateQueries({ queryKey: TOPIC_TITLE_QUERY_KEYS.all })
    },
  })
}

export function useTopicProposals() {
  // 1. Học kỳ
  const semestersQuery = useTopicProposalSemesters()
  const currentSemesterQuery = useTopicProposalCurrentSemester()
  const semesters = semestersQuery.data ?? []

  const [selectedSemesterState, setSelectedSemesterState] = useState<string>('')
  const selectedSemesterId =
    selectedSemesterState ||
    currentSemesterQuery.data?.publicId ||
    semesters[0]?.publicId ||
    ''

  const selectedSemester =
    semesters.find((s) => s.publicId === selectedSemesterId) ??
    currentSemesterQuery.data

  // 2. Deadline
  const deadlineQuery = useTopicTitleDeadline(selectedSemesterId || undefined)
  const deadlineInfo = useMemo(
    () => computeTopicDeadlineStatus(deadlineQuery.data),
    [deadlineQuery.data],
  )

  // 3. Danh sách yêu cầu theo học kỳ
  const requestsQuery = useTopicTitleRequests({
    semesterId: selectedSemesterId || undefined,
  })
  const requests = requestsQuery.data ?? []

  // 4. Bộ lọc & tìm kiếm
  const [tabStatus, setTabStatus] = useState<TopicProposalTabStatus>('PENDING')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Modals
  const [approveTarget, setApproveTarget] =
    useState<TopicTitleHistoryResponse | null>(null)
  const [rejectTarget, setRejectTarget] =
    useState<TopicTitleHistoryResponse | null>(null)
  const [historyTarget, setHistoryTarget] =
    useState<TopicTitleHistoryResponse | null>(null)
  const [detailTarget, setDetailTarget] =
    useState<TopicTitleHistoryResponse | null>(null)

  // Mutation
  const reviewMutation = useReviewTopicTitle()

  // Counts
  const counts: TopicProposalCounts = useMemo(
    () => topicProposalService.getCounts(requests),
    [requests],
  )

  // Filtered
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return requests.filter((item) => {
      const matchQ =
        !q ||
        item.studentName.toLowerCase().includes(q) ||
        item.studentCode.toLowerCase().includes(q) ||
        item.newName.toLowerCase().includes(q) ||
        (item.oldName && item.oldName.toLowerCase().includes(q))
      const matchSt = !tabStatus || item.status === tabStatus
      return matchQ && matchSt
    })
  }, [requests, searchQuery, tabStatus])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const startIdx = (safePage - 1) * PAGE_SIZE
  const endIdx = Math.min(startIdx + PAGE_SIZE, filtered.length)
  const pageData = filtered.slice(startIdx, endIdx)

  const handleConfirmApprove = async (publicId: string) => {
    const target = approveTarget || requests.find((p) => p.publicId === publicId)
    await reviewMutation.mutateAsync({
      publicId,
      payload: { decision: 'APPROVED' },
    })
    toast.success(
      `Đã duyệt tên đề tài cho sinh viên ${target?.studentName ?? ''} thành công!`,
    )
    setApproveTarget(null)
  }

  const handleConfirmReject = async (publicId: string) => {
    const target = rejectTarget || requests.find((p) => p.publicId === publicId)
    await reviewMutation.mutateAsync({
      publicId,
      payload: { decision: 'REJECTED' },
    })
    toast.success(
      `Đã từ chối yêu cầu tên đề tài của sinh viên ${target?.studentName ?? ''}!`,
    )
    setRejectTarget(null)
  }

  return {
    semesters,
    semestersLoading: semestersQuery.isLoading,
    selectedSemesterId,
    setSelectedSemesterId: setSelectedSemesterState,
    selectedSemester,
    deadlineInfo,
    deadlineLoading: deadlineQuery.isLoading,
    isLoading: requestsQuery.isLoading,
    isFetching: requestsQuery.isFetching,
    isError: requestsQuery.isError,
    refetch: requestsQuery.refetch,
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
    approveTarget,
    setApproveTarget,
    isApproving: reviewMutation.isPending && reviewMutation.variables?.payload.decision === 'APPROVED',
    rejectTarget,
    setRejectTarget,
    isRejecting: reviewMutation.isPending && reviewMutation.variables?.payload.decision === 'REJECTED',
    historyTarget,
    setHistoryTarget,
    detailTarget,
    setDetailTarget,
    handleConfirmApprove,
    handleConfirmReject,
  }
}
