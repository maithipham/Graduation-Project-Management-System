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
import { isApiError } from '@/shared/types'
import {
  computeOutlineDeadlineStatus,
  outlineReviewService,
} from '../services/outlineReview.service'
import { useOutlineReviewStore } from '../store/outlineReview.store'
import type {
  OutlineAdvisorFeedbackRequest,
  OutlineFilterParams,
  OutlineReviewCounts,
  OutlineReviewRequest,
  OutlineStatus,
  ThesisOutlineResponse,
} from '../types/outlineReview.types'

const PAGE_SIZE = 15

export const OUTLINE_QUERY_KEYS = {
  all: ['lecturer', 'outline-review'] as const,
  supervisorList: (semesterId?: string, status?: OutlineStatus) =>
    [...OUTLINE_QUERY_KEYS.all, 'supervisor-list', semesterId, status] as const,
  reviewerList: (semesterId?: string, status?: OutlineStatus) =>
    [...OUTLINE_QUERY_KEYS.all, 'review-list', semesterId, status] as const,
  detail: (publicId?: string) =>
    [...OUTLINE_QUERY_KEYS.all, 'detail', publicId] as const,
  deadline: (semesterId?: string) =>
    [...OUTLINE_QUERY_KEYS.all, 'deadline', semesterId] as const,
  semesters: ['lecturer', 'outline-review', 'semesters'] as const,
  currentSemester: ['lecturer', 'outline-review', 'current-semester'] as const,
}

/** 1. Danh sách học kỳ cho dropdown chọn học kỳ */
export function useOutlineSemesters() {
  return useQuery({
    queryKey: OUTLINE_QUERY_KEYS.semesters,
    queryFn: () => semesterService.getAllSemesters(),
    ...referenceDataQueryOptions,
  })
}

/** 2. Học kỳ hiện tại */
export function useOutlineCurrentSemester() {
  return useQuery({
    queryKey: OUTLINE_QUERY_KEYS.currentSemester,
    queryFn: () => semesterService.getCurrentSemester(),
    ...referenceDataQueryOptions,
    retry: false,
  })
}

/** 3. Hook lấy deadline mốc nộp / thẩm định đề cương */
export function useOutlineDeadline(semesterId?: string) {
  return useQuery({
    queryKey: OUTLINE_QUERY_KEYS.deadline(semesterId),
    queryFn: () => outlineReviewService.getOutlineDeadline(semesterId!),
    enabled: Boolean(semesterId),
  })
}

/** 4. Hook lấy danh sách đề cương cho GVHD */
export function useSupervisorOutlineList(params?: OutlineFilterParams) {
  return useQuery({
    queryKey: OUTLINE_QUERY_KEYS.supervisorList(params?.semesterId, params?.status),
    queryFn: () => outlineReviewService.getSupervisorList(params),
    placeholderData: keepPreviousData,
  })
}

/** 5. Hook lấy danh sách đề cương cho GVNX */
export function useReviewerOutlineList(params?: OutlineFilterParams) {
  return useQuery({
    queryKey: OUTLINE_QUERY_KEYS.reviewerList(params?.semesterId, params?.status),
    queryFn: () => outlineReviewService.getReviewerList(params),
    placeholderData: keepPreviousData,
  })
}

/** 6. Hook xem chi tiết đề cương & lịch sử nộp */
export function useOutlineDetail(publicId?: string) {
  return useQuery({
    queryKey: OUTLINE_QUERY_KEYS.detail(publicId),
    queryFn: () => outlineReviewService.getDetail(publicId!),
    enabled: Boolean(publicId),
  })
}

/** 7. Mutation thẩm định đề cương (GVNX) */
export function useReviewOutlineMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      publicId,
      payload,
    }: {
      publicId: string
      payload: OutlineReviewRequest
    }) => outlineReviewService.reviewOutline(publicId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTLINE_QUERY_KEYS.all })
    },
    onError: (error) => {
      if (isApiError(error)) {
        if (error.code === 3100) {
          toast.error(
            'Tên đề tài chưa được GVHD xác nhận. Chưa thể duyệt đạt đề cương!',
          )
        } else if (error.code === 3087) {
          toast.error(
            'Trong thời gian nhận bài chỉ được chọn Đạt hoặc Yêu cầu chỉnh sửa!',
          )
        } else if (error.code === 3088) {
          toast.error(
            'Trong thời gian gia hạn chấm chỉ được chọn Đạt hoặc Không đạt!',
          )
        } else if (error.code === 3086) {
          toast.error(
            'Đã quá thời hạn thẩm định đề cương, vui lòng liên hệ Trưởng bộ môn gia hạn!',
          )
        } else {
          toast.error(error.message || 'Thẩm định đề cương thất bại!')
        }
      }
    },
  })
}

/** 8. Mutation gửi nhận xét góp ý đề cương (GVHD chính) */
export function useAdvisorFeedbackMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      publicId,
      payload,
    }: {
      publicId: string
      payload: OutlineAdvisorFeedbackRequest
    }) => outlineReviewService.writeAdvisorFeedback(publicId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTLINE_QUERY_KEYS.all })
    },
    onError: (error) => {
      if (isApiError(error)) {
        toast.error(error.message || 'Gửi nhận xét góp ý đề cương thất bại!')
      }
    },
  })
}

export function useOutlineReview() {
  // Store UI
  const {
    activeRole,
    setActiveRole,
    tabStatus,
    setTabStatus,
    searchQuery,
    setSearchQuery,
    selectedSemesterId: storedSemesterId,
    setSelectedSemesterId: setStoredSemesterId,
    readOutlineIds,
    markOutlineAsRead,
  } = useOutlineReviewStore()

  // 1. Học kỳ
  const semestersQuery = useOutlineSemesters()
  const currentSemesterQuery = useOutlineCurrentSemester()
  const semesters = semestersQuery.data ?? []

  const selectedSemesterId =
    storedSemesterId ||
    currentSemesterQuery.data?.publicId ||
    semesters[0]?.publicId ||
    ''

  const selectedSemester =
    semesters.find((s) => s.publicId === selectedSemesterId) ??
    currentSemesterQuery.data

  // 2. Deadline
  const deadlineQuery = useOutlineDeadline(selectedSemesterId || undefined)
  const deadlineInfo = useMemo(
    () => computeOutlineDeadlineStatus(deadlineQuery.data),
    [deadlineQuery.data],
  )

  // 3. Danh sách GVHD và GVNX
  const supervisorQuery = useSupervisorOutlineList({
    semesterId: selectedSemesterId || undefined,
  })
  const reviewerQuery = useReviewerOutlineList({
    semesterId: selectedSemesterId || undefined,
  })

  const supervisorOutlines = supervisorQuery.data ?? []
  const reviewerOutlines = reviewerQuery.data ?? []

  const currentOutlines =
    activeRole === 'guide' ? supervisorOutlines : reviewerOutlines

  const isCurrentLoading =
    activeRole === 'guide'
      ? supervisorQuery.isLoading
      : reviewerQuery.isLoading

  // 4. Modals State
  const [previewItem, setPreviewItem] = useState<ThesisOutlineResponse | null>(null)
  const [approveItem, setApproveItem] = useState<ThesisOutlineResponse | null>(null)
  const [rejectItem, setRejectItem] = useState<ThesisOutlineResponse | null>(null)
  const [feedbackItem, setFeedbackItem] = useState<ThesisOutlineResponse | null>(null)
  const [historyItem, setHistoryItem] = useState<ThesisOutlineResponse | null>(null)

  // 5. Pagination
  const [currentPage, setCurrentPage] = useState(1)

  // 6. Mutations
  const reviewMutation = useReviewOutlineMutation()
  const feedbackMutation = useAdvisorFeedbackMutation()

  // 7. Counts
  const counts: OutlineReviewCounts = useMemo(
    () => outlineReviewService.getCounts(currentOutlines),
    [currentOutlines],
  )

  const badges = useMemo(() => {
    return {
      guideTotal: supervisorOutlines.length,
      reviewerTotal: reviewerOutlines.length,
      pendingCount: counts.pending,
      approvedCount: counts.approved,
      requestChangesCount: counts.requestChanges,
      rejectedCount: counts.rejected,
      allCount: counts.all,
    }
  }, [supervisorOutlines.length, reviewerOutlines.length, counts])

  // 8. Filter & Sort
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return currentOutlines
      .filter((item) => {
        const matchStatus = !tabStatus || item.status === tabStatus

        if (!matchStatus) return false

        if (q) {
          const matchName = item.studentName.toLowerCase().includes(q)
          const matchCode = item.studentCode.toLowerCase().includes(q)
          const matchTopic = (item.topicName || item.title || '')
            .toLowerCase()
            .includes(q)
          const matchSupervisor = (item.lecturerName || '')
            .toLowerCase()
            .includes(q)
          const matchReviewer = (item.reviewerName || '')
            .toLowerCase()
            .includes(q)
          if (
            !matchName &&
            !matchCode &&
            !matchTopic &&
            !matchSupervisor &&
            !matchReviewer
          ) {
            return false
          }
        }

        return true
      })
      .sort((a, b) => {
        const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0
        const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0
        return timeB - timeA
      })
  }, [currentOutlines, tabStatus, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const startIdx = (safePage - 1) * PAGE_SIZE
  const endIdx = Math.min(startIdx + PAGE_SIZE, filtered.length)
  const pageData = filtered.slice(startIdx, endIdx)

  // Actions
  const handleOpenPreview = (item: ThesisOutlineResponse) => {
    setPreviewItem(item)
  }

  const handleUnlockRead = (item: ThesisOutlineResponse) => {
    if (readOutlineIds.includes(item.publicId)) return
    markOutlineAsRead(item.publicId)
    toast.success(
      `Đã đọc đề cương của sinh viên ${item.studentName}!`,
    )
  }

  const handleClickApprove = (item: ThesisOutlineResponse) => {
    if (!readOutlineIds.includes(item.publicId)) {
      setPreviewItem(item)
      toast.info(
        `Vui lòng xem qua đề cương của ${item.studentName} để mở khóa phê duyệt!`,
      )
      return
    }
    setApproveItem(item)
  }

  const handleClickReject = (item: ThesisOutlineResponse) => {
    if (!readOutlineIds.includes(item.publicId)) {
      setPreviewItem(item)
      toast.info(
        `Vui lòng xem qua đề cương của ${item.studentName} để mở khóa từ chối / yêu cầu sửa!`,
      )
      return
    }
    setRejectItem(item)
  }

  const handleConfirmApprove = async (publicId: string, feedback: string) => {
    const target = approveItem || currentOutlines.find((o) => o.publicId === publicId)
    await reviewMutation.mutateAsync({
      publicId,
      payload: { decision: 'APPROVED', feedback },
    })
    toast.success(
      `Đã phê duyệt đề cương của sinh viên ${target?.studentName ?? ''} thành công!`,
    )
    setApproveItem(null)
    setPreviewItem(null)
  }

  const handleConfirmReject = async (
    publicId: string,
    feedback: string,
    decision: OutlineStatus,
  ) => {
    const target = rejectItem || currentOutlines.find((o) => o.publicId === publicId)
    await reviewMutation.mutateAsync({
      publicId,
      payload: { decision, feedback },
    })
    if (decision === 'REJECTED') {
      toast.success(
        `Đã đánh giá Không đạt đề cương của sinh viên ${target?.studentName ?? ''}!`,
      )
    } else {
      toast.success(
        `Đã gửi yêu cầu chỉnh sửa đề cương cho sinh viên ${target?.studentName ?? ''}!`,
      )
    }
    setRejectItem(null)
    setPreviewItem(null)
  }

  const handleSaveFeedback = async (publicId: string, feedback: string) => {
    const target = feedbackItem || currentOutlines.find((o) => o.publicId === publicId)
    await feedbackMutation.mutateAsync({
      publicId,
      payload: { feedback },
    })
    toast.success(
      `Đã gửi nhận xét góp ý cho sinh viên ${target?.studentName ?? ''} thành công!`,
    )
    setFeedbackItem(null)
  }

  return {
    semesters,
    semestersLoading: semestersQuery.isLoading,
    selectedSemesterId,
    setSelectedSemesterId: setStoredSemesterId,
    selectedSemester,
    deadlineInfo,
    deadlineLoading: deadlineQuery.isLoading,
    activeRole,
    setActiveRole,
    tabStatus,
    setTabStatus,
    searchQuery,
    setSearchQuery,
    currentPage: safePage,
    setCurrentPage,
    totalPages,
    counts,
    badges,
    filtered,
    pageData,
    isLoading: isCurrentLoading,
    readOutlineIds,
    previewItem,
    setPreviewItem,
    approveItem,
    setApproveItem,
    rejectItem,
    setRejectItem,
    feedbackItem,
    setFeedbackItem,
    historyItem,
    setHistoryItem,
    handleOpenPreview,
    handleUnlockRead,
    handleClickApprove,
    handleClickReject,
    handleConfirmApprove,
    handleConfirmReject,
    handleSaveFeedback,
    isReviewing: reviewMutation.isPending,
    isSubmittingFeedback: feedbackMutation.isPending,
  }
}
