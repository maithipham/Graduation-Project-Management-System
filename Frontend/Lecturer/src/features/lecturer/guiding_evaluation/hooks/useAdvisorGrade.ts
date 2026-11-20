import { skipToken, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback'
import { advisorGradeService } from '../services/advisorGrade.service'
import type { AdvisorGradeSheet, AdvisorGradeSheetBody } from '../types/advisorGrade.types'
import { isAdvisorGradeAlreadySubmittedError, isAdvisorGradeLockingError } from '../utils/advisorGrade.utils'

// Hook cho màn chấm điểm hướng dẫn (API /advisor-grade).
// Giống gọi repository có cache: mỗi query có "tên cache" (key); ghi xong thì invalidate key để TanStack tự gọi lại API.
// Key tách riêng khỏi `guidingEvaluationKeys` (['lecturer','guiding-evaluation']) để không đụng cache của màn cũ.

export const advisorGradeKeys = {
  all: ['lecturer', 'advisor-grade'] as const,
  topicLists: () => [...advisorGradeKeys.all, 'topic-list'] as const,
  /** `semesterId` undefined = học kỳ đang diễn ra */
  topicList: (semesterId: string | undefined) => [...advisorGradeKeys.topicLists(), semesterId ?? 'current'] as const,
  sheets: () => [...advisorGradeKeys.all, 'sheet'] as const,
  /** Phiếu lưu theo topicPublicId: dòng chưa có phiếu cũng có key ngay từ đầu */
  sheet: (topicPublicId: string | undefined) => [...advisorGradeKeys.sheets(), topicPublicId] as const,
}

/** Đề tài đang mở popup phiếu (lấy từ 1 dòng của C1) */
export interface AdvisorGradeSheetTarget {
  topicPublicId: string
  sheetPublicId: string | null
}

// ---------------------------------------------------------------------------
// Đọc
// ---------------------------------------------------------------------------

/**
 * C1 – danh sách đề tài cần chấm + thống kê (mỗi dòng có `lockAt` riêng theo ngành SV).
 * `semesterId` undefined = học kỳ đang diễn ra. `enabled = false` khi màn còn chờ chọn học kỳ (tránh gọi 2 lần).
 */
export function useAdvisorGradeTopics(semesterId: string | undefined, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  return useQuery({
    queryKey: advisorGradeKeys.topicList(semesterId),
    queryFn: enabled ? () => advisorGradeService.getTopics(semesterId) : skipToken,
  })
}

/**
 * Mở phiếu cho popup: đã có phiếu → C3, chưa có → C2 (BE tạo phiếu Nháp, gọi lại vẫn an toàn).
 * `target` null = popup đang đóng, chưa gọi API.
 * Chỉ truyền target khi `canOpenAdvisorGradeSheet(topic)` = true, nếu không C2 chắc chắn lỗi.
 */
export function useAdvisorGradeSheet(target: AdvisorGradeSheetTarget | null) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: advisorGradeKeys.sheet(target?.topicPublicId),
    queryFn: target
      ? async () => {
          if (target.sheetPublicId) return advisorGradeService.getSheet(target.sheetPublicId)
          const sheet = await advisorGradeService.openSheet(target.topicPublicId)
          // C2 vừa tạo phiếu Nháp → dòng trên bảng đổi từ "Chưa chấm" sang "Đang chấm"
          void queryClient.invalidateQueries({ queryKey: advisorGradeKeys.topicLists() })
          return sheet
        }
      : skipToken,
    // Mỗi lần mở popup lấy phiếu mới nhất; không tự tải lại khi quay lại tab để khỏi chen vào lúc đang nhập
    staleTime: 0,
    refetchOnWindowFocus: false,
    // Lỗi nghiệp vụ (đã khóa chấm, đề tài không đủ điều kiện…) thử lại cũng vậy
    retry: false,
  })
}

// ---------------------------------------------------------------------------
// Ghi
// ---------------------------------------------------------------------------

interface SheetMutationVariables {
  topicPublicId: string
  sheetPublicId: string
  body: AdvisorGradeSheetBody
}

function refreshTopics(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: advisorGradeKeys.topicLists() })
}

/**
 * Lỗi do phiếu / đề tài đổi trạng thái trong lúc đang nhập:
 * - 3117 / 3128 (đề tài không còn đủ điều kiện / đã khóa chấm) → tải lại phiếu (C3) + danh sách (C1),
 *   popup chuyển sang chỉ xem.
 * - 3118 (C4 gặp phiếu đã nộp ở tab khác) → tải lại phiếu + danh sách, popup chuyển sang nút "Nộp lại".
 * Không toast: request có `skipErrorToast`, popup tự hiện lỗi.
 */
function refreshOnStaleSheetError(queryClient: QueryClient, error: unknown, topicPublicId: string) {
  if (!isAdvisorGradeLockingError(error) && !isAdvisorGradeAlreadySubmittedError(error)) return undefined
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: advisorGradeKeys.sheet(topicPublicId) }),
    refreshTopics(queryClient),
  ])
}

/** C4 – lưu nháp. Thành công → tải lại phiếu (gradedCount, updatedAt) và danh sách */
export function useSaveAdvisorGradeDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sheetPublicId, body }: SheetMutationVariables) =>
      advisorGradeService.saveDraft(sheetPublicId, body),
    onSuccess: (_data, { topicPublicId }) => {
      toast.success('Đã lưu nháp phiếu chấm')
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: advisorGradeKeys.sheet(topicPublicId) }),
        refreshTopics(queryClient),
      ])
    },
    onError: (error, { topicPublicId }) => refreshOnStaleSheetError(queryClient, error, topicPublicId),
  })
}

/**
 * C5 – nộp phiếu (DRAFT) hoặc nộp lại để sửa điểm (SUBMITTED, đến khi khóa chấm).
 * Dùng luôn phiếu BE trả về, không gọi lại C3.
 */
export function useSubmitAdvisorGradeSheet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sheetPublicId, body }: SheetMutationVariables) => advisorGradeService.submit(sheetPublicId, body),
    onSuccess: (sheet, { topicPublicId }) => {
      const key = advisorGradeKeys.sheet(topicPublicId)
      const isResubmit = queryClient.getQueryData<AdvisorGradeSheet>(key)?.status === 'SUBMITTED'
      queryClient.setQueryData(key, sheet)
      toast.success(isResubmit ? 'Đã cập nhật điểm hướng dẫn' : 'Đã nộp phiếu chấm')
      return refreshTopics(queryClient)
    },
    onError: (error, { topicPublicId }) => refreshOnStaleSheetError(queryClient, error, topicPublicId),
  })
}
