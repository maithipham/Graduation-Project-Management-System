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
  downloadProgressFile,
  formatProgressDeadlineForSupervisor,
  guidingEvaluationService,
  mapFinalReportToGuidingItem,
} from '../services/guidingEvaluation.service'
import { useGuidingEvaluationStore } from '../store/guidingEvaluation.store'
import type {
  GuidingEvaluationItem,
  ProgressDeadlineSnapshot,
  RubricScores,
  SubmitProgressReportPayload,
} from '../types/guidingEvaluation.types'
import { isEvaluationCompleted } from '../utils/guidingEvaluation.utils'

export const guidingEvaluationKeys = {
  all: ['lecturer', 'guiding-evaluation'] as const,
  semesters: ['lecturer', 'guiding-evaluation', 'semesters'] as const,
  currentSemester: ['lecturer', 'guiding-evaluation', 'current-semester'] as const,
  lists: () => [...guidingEvaluationKeys.all, 'list'] as const,
  list: (semesterId: string | undefined) =>
    [...guidingEvaluationKeys.lists(), semesterId] as const,
  details: () => [...guidingEvaluationKeys.all, 'detail'] as const,
  detail: (publicId: string | undefined) =>
    [...guidingEvaluationKeys.details(), publicId] as const,
  deadlines: () => [...guidingEvaluationKeys.all, 'deadline'] as const,
  deadline: (semesterId: string | undefined) =>
    [...guidingEvaluationKeys.deadlines(), semesterId] as const,
}

/** Danh sách học kỳ cho dropdown chọn năm học / học kỳ */
export function useGuidingEvaluationSemesters() {
  return useQuery({
    queryKey: guidingEvaluationKeys.semesters,
    queryFn: () => semesterService.getAllSemesters(),
    ...referenceDataQueryOptions,
  })
}

/** Học kỳ hiện tại (tắt toast lỗi tự động vì có fallback sang học kỳ đầu danh sách) */
export function useGuidingEvaluationCurrentSemester() {
  return useQuery({
    queryKey: guidingEvaluationKeys.currentSemester,
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

/** Danh sách sinh viên hướng dẫn theo học kỳ */
export function useSupervisorProgressReports(
  semesterId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: guidingEvaluationKeys.list(semesterId),
    queryFn: () =>
      guidingEvaluationService.getSupervisorProgressReports({ semesterId }),
    placeholderData: keepPreviousData,
    enabled: enabled && Boolean(semesterId),
  })
}

/** Fallback lấy mốc hạn nộp GĐ 4 từ /api/v1/deadlines khi supervisor-list trả rỗng [] */
export function useFallbackProgressDeadline(
  semesterId: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: guidingEvaluationKeys.deadline(semesterId),
    queryFn:
      semesterId && enabled
        ? () => guidingEvaluationService.getFallbackProgressDeadline(semesterId)
        : skipToken,
    retry: false,
  })
}

/** Chi tiết Báo cáo Final (kèm histories & progressReport) */
export function useSupervisorReportDetail(publicId: string | null | undefined) {
  return useQuery({
    queryKey: guidingEvaluationKeys.detail(publicId ?? undefined),
    queryFn: publicId
      ? () => guidingEvaluationService.getReportDetailForSupervisor(publicId)
      : skipToken,
  })
}

export interface SubmitProgressMutationVariables {
  payload: SubmitProgressReportPayload
  studentName: string
  isUpdate: boolean
}

/** GVHD chính nộp hoặc cập nhật Phiếu theo dõi tiến độ */
export function useSubmitProgressReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ payload }: SubmitProgressMutationVariables) =>
      guidingEvaluationService.submitProgressReport(payload),
    onSuccess: (_data, variables) => {
      toast.success(
        variables.isUpdate
          ? `Đã cập nhật phiếu theo dõi tiến độ cho sinh viên ${variables.studentName}`
          : `Đã nộp phiếu theo dõi tiến độ cho sinh viên ${variables.studentName}`,
      )
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: guidingEvaluationKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['lecturer', 'report-check'] }),
      ])
    },
  })
}

export function useGuidingEvaluation(semesterId?: string, enabled = true) {
  const {
    filterStatus,
    searchQuery,
    pageSize,
    currentPage,
    localRubrics,
    setFilterStatus,
    setSearchQuery,
    setPageSize,
    setCurrentPage,
    saveLocalRubric,
  } = useGuidingEvaluationStore()

  const reportsQuery = useSupervisorProgressReports(semesterId, enabled)
  const rawReports = useMemo(
    () => reportsQuery.data ?? [],
    [reportsQuery.data],
  )

  const shouldFetchFallbackDeadline =
    Boolean(semesterId) &&
    reportsQuery.isSuccess &&
    !reportsQuery.isPlaceholderData &&
    rawReports.length === 0

  const fallbackDeadlineQuery = useFallbackProgressDeadline(
    semesterId,
    shouldFetchFallbackDeadline,
  )

  const items = useMemo(
    () =>
      rawReports.map((dto) => {
        const mapped = mapFinalReportToGuidingItem(dto)
        const localRubric = localRubrics[mapped.topicPublicId]
        if (!localRubric) return mapped
        return {
          ...mapped,
          score: localRubric.score,
          rubricScores: localRubric.rubricScores,
        }
      }),
    [rawReports, localRubrics],
  )

  const deadlineSnapshot: ProgressDeadlineSnapshot | null = useMemo(() => {
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
      formatProgressDeadlineForSupervisor(
        deadlineSnapshot?.deadlineEndDate,
        deadlineSnapshot?.deadlineStatus,
        (iso) => formatDate(iso, 'full'),
        deadlineSnapshot?.deadlineStartDate,
      ),
    [deadlineSnapshot],
  )

  const submitMutation = useSubmitProgressReport()

  const [uploadTarget, setUploadTarget] = useState<GuidingEvaluationItem | null>(
    null,
  )
  const [rubricTarget, setRubricTarget] = useState<GuidingEvaluationItem | null>(
    null,
  )
  const [previewTarget, setPreviewTarget] =
    useState<GuidingEvaluationItem | null>(null)
  const [detailTarget, setDetailTarget] = useState<GuidingEvaluationItem | null>(
    null,
  )

  const counts = useMemo(
    () => guidingEvaluationService.getCounts(items),
    [items],
  )

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return items.filter((item) => {
      const completed = isEvaluationCompleted(item)
      if (filterStatus === 'incomplete' && completed) return false
      if (filterStatus === 'completed' && !completed) return false

      if (q) {
        return (
          item.name.toLowerCase().includes(q) ||
          item.mssv.toLowerCase().includes(q) ||
          item.topic.toLowerCase().includes(q) ||
          item.fileName.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [items, filterStatus, searchQuery])

  const totalItems = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const startIdx = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1
  const endIdx = Math.min(safePage * pageSize, totalItems)

  const pagedItems = useMemo(() => {
    const from = (safePage - 1) * pageSize
    return filteredItems.slice(from, from + pageSize)
  }, [filteredItems, safePage, pageSize])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleConfirmUpload = async (
    item: GuidingEvaluationItem,
    payload: SubmitProgressReportPayload,
  ) => {
    await submitMutation.mutateAsync({
      payload,
      studentName: item.name,
      isUpdate: Boolean(item.progressReport),
    })
    setUploadTarget(null)
  }

  const handleSaveRubric = (
    item: GuidingEvaluationItem,
    totalScore: number,
    rubricScores: RubricScores,
    isDraft: boolean,
  ) => {
    saveLocalRubric(item.topicPublicId, totalScore, rubricScores, isDraft)
    setRubricTarget(null)
    if (isDraft) {
      toast.info(`Đã lưu nháp bảng điểm cho sinh viên ${item.name}.`)
    } else {
      toast.success(
        `Đã lưu tạm bảng điểm hướng dẫn (${totalScore.toFixed(1)} / 10.0) cho ${item.name}.`,
      )
    }
  }

  const handleDownloadTrackingFile = (item: GuidingEvaluationItem) => {
    if (!item.progressFileUrl) return
    void downloadProgressFile(
      item.progressFileUrl,
      item.fileName || `phieu-tien-do-${item.mssv}.pdf`,
    )
  }

  const handleDownloadFinalReportFile = (item: GuidingEvaluationItem) => {
    if (!item.finalReportFile) return
    void downloadProgressFile(
      item.finalReportFile,
      item.finalReportFileName || `bao-cao-final-${item.mssv}.pdf`,
    )
  }

  return {
    items,
    counts,
    isLoading: reportsQuery.isPending,
    isFetching: reportsQuery.isFetching,
    isError: reportsQuery.isError,
    refetch: reportsQuery.refetch,
    deadlineSnapshot,
    deadlineInfo,
    isDeadlineLoading:
      reportsQuery.isPending ||
      (shouldFetchFallbackDeadline && fallbackDeadlineQuery.isPending),

    filterStatus,
    searchQuery,
    pageSize,
    currentPage: safePage,
    totalPages,
    startIdx,
    endIdx,
    totalItems,
    pagedItems,

    uploadTarget,
    setUploadTarget,
    rubricTarget,
    setRubricTarget,
    previewTarget,
    setPreviewTarget,
    detailTarget,
    setDetailTarget,

    isSubmittingProgress: submitMutation.isPending,
    handleTabChange: setFilterStatus,
    handleSearchChange: setSearchQuery,
    handlePageSizeChange: setPageSize,
    handlePageChange,
    handleConfirmUpload,
    handleSaveRubric,
    handleDownloadTrackingFile,
    handleDownloadFinalReportFile,
  }
}
