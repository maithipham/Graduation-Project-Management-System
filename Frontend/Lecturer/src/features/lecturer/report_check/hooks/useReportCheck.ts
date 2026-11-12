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
import { semesterService } from '@/shared/services/semester.service'
import type { ApiResponse } from '@/shared/types'
import type { SemesterResponse } from '@/shared/types/semester.types'
import { formatDate } from '@/shared/utils'
import {
  downloadReportFile,
  formatReportDeadlineForReview,
  mapFinalReportToCheckItem,
  reportCheckService,
} from '../services/reportCheck.service'
import { useReportCheckStore } from '../store/reportCheck.store'
import type {
  FinalReportDecision,
  ReportCheckItem,
  ReportDeadlineSnapshot,
  ReviewFinalReportPayload,
} from '../types/reportCheck.types'

export const reportCheckKeys = {
  all: ['lecturer', 'report-check'] as const,
  semesters: ['lecturer', 'report-check', 'semesters'] as const,
  currentSemester: ['lecturer', 'report-check', 'current-semester'] as const,
  lists: () => [...reportCheckKeys.all, 'list'] as const,
  list: (semesterId: string | undefined) =>
    [...reportCheckKeys.lists(), semesterId] as const,
  details: () => [...reportCheckKeys.all, 'detail'] as const,
  detail: (publicId: string | undefined) =>
    [...reportCheckKeys.details(), publicId] as const,
  deadlines: () => [...reportCheckKeys.all, 'deadline'] as const,
  deadline: (semesterId: string | undefined) =>
    [...reportCheckKeys.deadlines(), semesterId] as const,
}

/** Danh sách học kỳ cho dropdown chọn năm học / học kỳ */
export function useReportCheckSemesters() {
  return useQuery({
    queryKey: reportCheckKeys.semesters,
    queryFn: () => semesterService.getAllSemesters(),
    ...referenceDataQueryOptions,
  })
}

/** Học kỳ hiện tại (tắt toast lỗi tự động vì có fallback sang học kỳ đầu danh sách) */
export function useReportCheckCurrentSemester() {
  return useQuery({
    queryKey: reportCheckKeys.currentSemester,
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

/** Danh sách báo cáo Final của sinh viên hướng dẫn theo học kỳ */
export function useSupervisorFinalReports(
  semesterId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: reportCheckKeys.list(semesterId),
    queryFn: () => reportCheckService.getSupervisorFinalReports({ semesterId }),
    placeholderData: keepPreviousData,
    enabled: enabled && Boolean(semesterId),
  })
}

/** Fallback lấy mốc hạn nộp GĐ 4 từ /api/v1/deadlines khi supervisor-list trả rỗng [] */
export function useFallbackReportDeadline(
  semesterId: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: reportCheckKeys.deadline(semesterId),
    queryFn:
      semesterId && enabled
        ? () => reportCheckService.getFallbackReportDeadline(semesterId)
        : skipToken,
    retry: false,
  })
}

/** Chi tiết một Báo cáo Final (kèm histories & progressReport) */
export function useFinalReportDetail(publicId: string | undefined) {
  return useQuery({
    queryKey: reportCheckKeys.detail(publicId),
    queryFn: publicId
      ? () => reportCheckService.getFinalReportDetailForSupervisor(publicId)
      : skipToken,
  })
}

/** GVHD chính nộp kết quả kiểm tra trùng lặp và thẩm định báo cáo Final */
export function useReviewFinalReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ReviewFinalReportPayload) =>
      reportCheckService.reviewStudentFinalReport(payload),
    onSuccess: (_data, variables) => {
      const actionLabel =
        variables.decision === 'APPROVED'
          ? 'Đã duyệt đạt báo cáo Final'
          : variables.decision === 'REQUEST_CHANGES'
            ? 'Đã gửi yêu cầu chỉnh sửa báo cáo Final'
            : 'Đã ghi nhận kết quả không đạt cho báo cáo Final'
      toast.success(actionLabel)
      return queryClient.invalidateQueries({ queryKey: reportCheckKeys.all })
    },
  })
}

export interface ReviewModalTarget {
  item: ReportCheckItem
  initialDecision?: FinalReportDecision
}

export function useReportCheck(semesterId?: string, enabled = true) {
  const {
    searchQuery,
    filterStatus,
    pageSize,
    currentPage,
    setSearchQuery,
    setFilterStatus,
    setPageSize,
    setCurrentPage,
  } = useReportCheckStore()

  const reportsQuery = useSupervisorFinalReports(semesterId, enabled)
  const rawReports = useMemo(
    () => reportsQuery.data ?? [],
    [reportsQuery.data],
  )

  const shouldFetchFallbackDeadline =
    Boolean(semesterId) &&
    reportsQuery.isSuccess &&
    !reportsQuery.isPlaceholderData &&
    rawReports.length === 0

  const fallbackDeadlineQuery = useFallbackReportDeadline(
    semesterId,
    shouldFetchFallbackDeadline,
  )

  const reports = useMemo(
    () => rawReports.map(mapFinalReportToCheckItem),
    [rawReports],
  )

  const deadlineSnapshot: ReportDeadlineSnapshot | null = useMemo(() => {
    if (rawReports.length > 0) {
      const first = rawReports[0]
      return {
        deadlineName: first.deadlineName,
        deadlineStartDate: first.deadlineStartDate,
        deadlineEndDate: first.deadlineEndDate,
        deadlineActive: first.deadlineActive,
        deadlineStatus: first.deadlineStatus ?? 'NOT_CONFIGURED',
      }
    }
    if (fallbackDeadlineQuery.data) {
      return fallbackDeadlineQuery.data
    }
    return null
  }, [rawReports, fallbackDeadlineQuery.data])

  const deadlineInfo = useMemo(
    () =>
      formatReportDeadlineForReview(
        deadlineSnapshot?.deadlineEndDate,
        deadlineSnapshot?.deadlineStatus,
        (iso) => formatDate(iso, 'full'),
        deadlineSnapshot?.deadlineStartDate,
      ),
    [deadlineSnapshot],
  )

  const reviewMutation = useReviewFinalReport()

  // Targets cho các modal
  const [reviewTarget, setReviewTarget] = useState<ReviewModalTarget | null>(
    null,
  )
  const [historyTarget, setHistoryTarget] = useState<ReportCheckItem | null>(
    null,
  )
  const [previewTarget, setPreviewTarget] = useState<ReportCheckItem | null>(
    null,
  )

  // Thống kê đếm số lượng cho các tab
  const counts = useMemo(
    () => reportCheckService.getCounts(reports),
    [reports],
  )

  // Lọc dữ liệu theo tab và từ khóa tìm kiếm
  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return reports.filter((item) => {
      const matchQ =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.mssv.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q) ||
        item.reportFileName.toLowerCase().includes(q)

      let matchStatus = true
      if (filterStatus === 'rejected') {
        matchStatus =
          item.status === 'rejected' || item.status === 'request_changes'
      } else if (filterStatus) {
        matchStatus = item.status === filterStatus
      }

      return matchQ && matchStatus
    })
  }, [reports, searchQuery, filterStatus])

  // Phân trang phía client trên danh sách của học kỳ
  const totalItems = filteredReports.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const startIdx = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1
  const endIdx = Math.min(safePage * pageSize, totalItems)

  const pagedReports = useMemo(() => {
    const from = (safePage - 1) * pageSize
    return filteredReports.slice(from, from + pageSize)
  }, [filteredReports, safePage, pageSize])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleSubmitReview = async (payload: ReviewFinalReportPayload) => {
    await reviewMutation.mutateAsync(payload)
    setReviewTarget(null)
  }

  const handleDownloadReport = (item: ReportCheckItem) => {
    if (!item.reportFileUrl) return
    void downloadReportFile(
      item.reportFileUrl,
      item.reportFileName || `${item.mssv}-bao-cao-final.pdf`,
    )
  }

  return {
    reports,
    filteredReports,
    pagedReports,
    counts,
    isLoading: reportsQuery.isPending,
    isFetching: reportsQuery.isFetching,
    isError: reportsQuery.isError,
    isPlaceholderData: reportsQuery.isPlaceholderData,
    refetch: reportsQuery.refetch,
    deadlineSnapshot,
    deadlineInfo,
    isDeadlineLoading:
      reportsQuery.isPending ||
      (shouldFetchFallbackDeadline && fallbackDeadlineQuery.isPending),

    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    pageSize,
    setPageSize,
    currentPage: safePage,
    totalPages,
    startIdx,
    endIdx,
    totalItems,
    handlePageChange,

    // Modal targets
    reviewTarget,
    setReviewTarget,
    historyTarget,
    setHistoryTarget,
    previewTarget,
    setPreviewTarget,

    // Actions
    isReviewPending: reviewMutation.isPending,
    handleSubmitReview,
    handleDownloadReport,
  }
}
