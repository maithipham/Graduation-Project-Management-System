import { useMemo, useState } from 'react'
import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback/toast.store'
import { advisorEvaluationService } from '../services/advisorEvaluation.service'
import type { AdvisorEvaluation, AdvisorEvaluationFilter, AdvisorEvaluationRequest } from '../types'

export const advisorEvaluationKeys = {
  all: ['lecturer', 'advisor-evaluation'] as const,
  my: () => [...advisorEvaluationKeys.all, 'my'] as const,
  detail: (topicPublicId: string) => [...advisorEvaluationKeys.all, 'detail', topicPublicId] as const,
}

// Hoàn tất = đã nộp phiếu theo dõi tiến độ và đã gửi chính thức phiếu chấm hướng dẫn
export function isAdvisorEvaluationCompleted(item: AdvisorEvaluation): boolean {
  return Boolean(item.progressFileUrl) && item.sheetStatus === 'SUBMITTED'
}

export function getAdvisorMissingText(item: AdvisorEvaluation): string {
  const missingFile = !item.progressFileUrl
  const missingScore = item.sheetStatus !== 'SUBMITTED'
  if (missingFile && missingScore) return 'Chưa nộp phiếu & chưa chấm'
  if (missingFile) return 'Chưa nộp phiếu tiến độ'
  if (item.sheetStatus === 'DRAFT') return 'Điểm đang lưu nháp'
  return missingScore ? 'Chưa chấm điểm' : 'Đã hoàn tất'
}

export function useAdvisorEvaluationDetail(topicPublicId?: string) {
  return useQuery({
    queryKey: advisorEvaluationKeys.detail(topicPublicId ?? ''),
    queryFn: topicPublicId ? () => advisorEvaluationService.getEvaluation(topicPublicId) : skipToken,
  })
}

export function useSaveAdvisorEvaluation(topicPublicId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AdvisorEvaluationRequest) => advisorEvaluationService.saveEvaluation(topicPublicId, data),
    onSuccess: (_, data) => {
      toast.success(data.submit ? 'Đã lưu bảng điểm hướng dẫn chính thức' : 'Đã lưu nháp bảng điểm hướng dẫn')
      void queryClient.invalidateQueries({ queryKey: advisorEvaluationKeys.all })
    },
  })
}

export function useSubmitProgressReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ topicPublicId, file, note }: { topicPublicId: string; file: File; note?: string }) =>
      advisorEvaluationService.submitProgressReport(topicPublicId, file, note),
    onSuccess: () => {
      toast.success('Đã nộp phiếu theo dõi tiến độ thành công')
      void queryClient.invalidateQueries({ queryKey: advisorEvaluationKeys.all })
    },
  })
}

/** Trạng thái màn "Đánh giá hướng dẫn": danh sách SV mình hướng dẫn chính, lọc, tìm kiếm, phân trang, modal */
export function useGuidingEvaluation() {
  const listQuery = useQuery({
    queryKey: advisorEvaluationKeys.my(),
    queryFn: () => advisorEvaluationService.getMyEvaluations(),
  })
  const items = useMemo(() => listQuery.data ?? [], [listQuery.data])

  const [filterStatus, setFilterStatus] = useState<AdvisorEvaluationFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [pageSize, setPageSize] = useState<number>(15)
  const [currentPage, setCurrentPage] = useState<number>(1)

  const [uploadTarget, setUploadTarget] = useState<AdvisorEvaluation | null>(null)
  const [rubricTarget, setRubricTarget] = useState<AdvisorEvaluation | null>(null)
  const [previewTarget, setPreviewTarget] = useState<AdvisorEvaluation | null>(null)

  const counts = useMemo(() => {
    const completed = items.filter(isAdvisorEvaluationCompleted).length
    return { all: items.length, completed, incomplete: items.length - completed }
  }, [items])

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return items.filter((item) => {
      const completed = isAdvisorEvaluationCompleted(item)
      if (filterStatus === 'incomplete' && completed) return false
      if (filterStatus === 'completed' && !completed) return false
      if (!q) return true
      return [item.studentName, item.studentCode, item.topicName, item.className].some((v) =>
        (v ?? '').toLowerCase().includes(q),
      )
    })
  }, [items, filterStatus, searchQuery])

  const totalItems = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const startIdx = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1
  const endIdx = Math.min(safePage * pageSize, totalItems)
  const pagedItems = useMemo(
    () => filteredItems.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredItems, safePage, pageSize],
  )

  // Hạn hoàn thành = cuối mốc NOP_BAO_CAO_VA_PHIEU_THEO_DOI (chung cho cả học kỳ)
  const gradingEndAt = items.find((i) => i.gradingEndAt)?.gradingEndAt ?? null

  return {
    isPending: listQuery.isPending,
    isError: listQuery.isError,
    gradingEndAt,
    counts,
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
    handleTabChange: (status: AdvisorEvaluationFilter) => {
      setFilterStatus(status)
      setCurrentPage(1)
    },
    handleSearchChange: (value: string) => {
      setSearchQuery(value)
      setCurrentPage(1)
    },
    handlePageSizeChange: (size: number) => {
      setPageSize(size)
      setCurrentPage(1)
    },
    handlePageChange: (page: number) => {
      if (page >= 1 && page <= totalPages) setCurrentPage(page)
    },
  }
}
