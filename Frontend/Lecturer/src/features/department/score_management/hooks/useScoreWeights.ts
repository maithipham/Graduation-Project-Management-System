import { skipToken, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback'
import { scoreWeightService } from '../services/scoreWeight.service'
import type { ScoreWeightBody, SemesterRangeBody, UpdateScoreWeightBody } from '../types'
import { SCORE_WEIGHT_ERROR, hasScoreWeightErrorCode } from '../utils/scoreWeightErrors'

// Cùng cách làm với useRubrics.ts: mỗi query có key riêng, ghi xong thì invalidate để TanStack Query gọi lại API.

export const scoreWeightKeys = {
  all: ['department', 'score-weight'] as const,
  list: () => [...scoreWeightKeys.all, 'list'] as const,
  details: () => [...scoreWeightKeys.all, 'detail'] as const,
  detail: (publicId: string | undefined) => [...scoreWeightKeys.details(), publicId] as const,
  previews: () => [...scoreWeightKeys.all, 'preview'] as const,
  preview: (publicId: string | undefined, fromSemesterId: string | null, toSemesterId: string | null) =>
    [...scoreWeightKeys.previews(), publicId, fromSemesterId, toSemesterId ?? ''] as const,
  cancelPreviews: () => [...scoreWeightKeys.all, 'cancel-preview'] as const,
  cancelPreview: (publicId: string | undefined) => [...scoreWeightKeys.cancelPreviews(), publicId] as const,
  /** mutationKey: hộp thoại dùng `useIsMutating` để không cho đóng khi đang lưu */
  saveMutation: () => [...scoreWeightKeys.all, 'save'] as const,
  rangeMutation: () => [...scoreWeightKeys.all, 'range'] as const,
}

// ---------------------------------------------------------------------------
// Đọc
// ---------------------------------------------------------------------------

/** W1 – danh sách cấu hình trọng số */
export function useScoreWeightList() {
  return useQuery({
    queryKey: scoreWeightKeys.list(),
    queryFn: () => scoreWeightService.getList(),
  })
}

/**
 * W2 – chi tiết, dùng khi mở hộp thoại Sửa để lấy dữ liệu và `version` mới nhất (không dùng dòng trong danh sách
 * vì danh sách có thể đã cũ). `publicId` undefined (đang tạo mới / hộp thoại đóng) → chưa gọi API
 */
export function useScoreWeightDetail(publicId: string | undefined) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: scoreWeightKeys.detail(publicId),
    queryFn:
      publicId === undefined
        ? skipToken
        : () => withStaleListRefresh(queryClient, scoreWeightService.getDetail(publicId)),
    retry: false,
    staleTime: 0,
  })
}

/** W6 – xem trước Áp dụng / Sửa kỳ. Chỉ gọi khi đã chọn "Từ kỳ"; lỗi khoảng kỳ hiện dưới 2 ô chọn */
export function useScoreWeightApplyPreview(
  publicId: string | undefined,
  fromSemesterId: string | null,
  toSemesterId: string | null,
) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: scoreWeightKeys.preview(publicId, fromSemesterId, toSemesterId),
    queryFn:
      publicId !== undefined && fromSemesterId !== null
        ? () =>
            withStaleListRefresh(
              queryClient,
              scoreWeightService.getApplyPreview(publicId, fromSemesterId, toSemesterId),
            )
        : skipToken,
    retry: false,
    staleTime: 0,
  })
}

/** W6b – xem trước Hủy áp dụng. `publicId` undefined (hộp thoại đóng) → chưa gọi API */
export function useScoreWeightCancelPreview(publicId: string | undefined) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: scoreWeightKeys.cancelPreview(publicId),
    queryFn:
      publicId === undefined
        ? skipToken
        : () => withStaleListRefresh(queryClient, scoreWeightService.getCancelApplyPreview(publicId)),
    retry: false,
    staleTime: 0,
  })
}

// ---------------------------------------------------------------------------
// Ghi
// ---------------------------------------------------------------------------

/** Tải lại danh sách và bỏ kết quả xem trước / chi tiết đã cũ */
function refreshScoreWeights(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: scoreWeightKeys.previews() })
  queryClient.removeQueries({ queryKey: scoreWeightKeys.cancelPreviews() })
  queryClient.removeQueries({ queryKey: scoreWeightKeys.details(), type: 'inactive' })
  return queryClient.invalidateQueries({ queryKey: scoreWeightKeys.list() })
}

/** Mã lỗi cho thấy dữ liệu trên màn đã cũ (bị xóa, đổi trạng thái, vừa có phiếu nộp, người khác vừa sửa) */
function isStaleError(error: unknown): boolean {
  return hasScoreWeightErrorCode(
    error,
    SCORE_WEIGHT_ERROR.NOT_FOUND,
    SCORE_WEIGHT_ERROR.NOT_EDITABLE,
    SCORE_WEIGHT_ERROR.HAS_SUBMITTED_SHEETS,
    SCORE_WEIGHT_ERROR.NOT_DRAFT,
    SCORE_WEIGHT_ERROR.VERSION_CONFLICT,
    SCORE_WEIGHT_ERROR.NOT_APPLIED_STATUS,
  )
}

/**
 * Ghi lỗi do dữ liệu cũ → tải lại danh sách cho khớp BE.
 * Thông báo lỗi do interceptor (toast) hoặc hộp thoại hiện.
 */
function refreshOnStaleError(queryClient: QueryClient, error: unknown) {
  return isStaleError(error) ? refreshScoreWeights(queryClient) : undefined
}

/**
 * Đọc (W2, W6, W6b) lỗi do dữ liệu cũ → chỉ tải lại danh sách để các nút trên bảng khớp BE.
 * Không xóa cache xem trước như khi ghi, vì chính query đang lỗi nằm trong đó.
 */
async function withStaleListRefresh<T>(queryClient: QueryClient, request: Promise<T>): Promise<T> {
  try {
    return await request
  } catch (error) {
    if (isStaleError(error)) void queryClient.invalidateQueries({ queryKey: scoreWeightKeys.list() })
    throw error
  }
}

/** W3 – tạo cấu hình Nháp */
export function useCreateScoreWeight() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: scoreWeightKeys.saveMutation(),
    mutationFn: (body: ScoreWeightBody) => scoreWeightService.create(body),
    onSuccess: (_publicId, body) => {
      toast.success(`Đã tạo cấu hình ${body.name}`)
      return refreshScoreWeights(queryClient)
    },
  })
}

/** W4 – sửa tên + trọng số. `version` lấy từ chi tiết W2 vừa tải khi mở hộp thoại */
export function useUpdateScoreWeight() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: scoreWeightKeys.saveMutation(),
    mutationFn: ({ publicId, body }: { publicId: string; body: UpdateScoreWeightBody }) =>
      scoreWeightService.update(publicId, body),
    onSuccess: (_data, { body }) => {
      toast.success(`Đã cập nhật cấu hình ${body.name}`)
      return refreshScoreWeights(queryClient)
    },
    onError: (error) => refreshOnStaleError(queryClient, error),
  })
}

/** W5 – xóa cấu hình Nháp */
export function useDeleteScoreWeight() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ publicId }: { publicId: string; name: string }) => scoreWeightService.remove(publicId),
    onSuccess: (_data, { name }) => {
      toast.success(`Đã xóa ${name}`)
      return refreshScoreWeights(queryClient)
    },
    onError: (error) => refreshOnStaleError(queryClient, error),
  })
}

/** W7 – áp dụng cấu hình Nháp cho khoảng học kỳ */
export function useApplyScoreWeight() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: scoreWeightKeys.rangeMutation(),
    mutationFn: ({ publicId, body }: { publicId: string; body: SemesterRangeBody; name: string }) =>
      scoreWeightService.apply(publicId, body),
    onSuccess: (_data, { name }) => {
      toast.success(`Đã áp dụng ${name}`)
      return refreshScoreWeights(queryClient)
    },
    onError: (error) => refreshOnStaleError(queryClient, error),
  })
}

/** W8 – sửa kỳ áp dụng của cấu hình Sắp / Đang áp dụng */
export function useChangeScoreWeightRange() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: scoreWeightKeys.rangeMutation(),
    mutationFn: ({ publicId, body }: { publicId: string; body: SemesterRangeBody; name: string }) =>
      scoreWeightService.changeSemesterRange(publicId, body),
    onSuccess: (_data, { name }) => {
      toast.success(`Đã cập nhật kỳ áp dụng của ${name}`)
      return refreshScoreWeights(queryClient)
    },
    onError: (error) => refreshOnStaleError(queryClient, error),
  })
}

/** W9 – hủy áp dụng, cấu hình về Nháp */
export function useCancelApplyScoreWeight() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ publicId }: { publicId: string; name: string }) => scoreWeightService.cancelApply(publicId),
    onSuccess: (_data, { name }) => {
      toast.success(`Đã hủy áp dụng ${name}, cấu hình trở về bản nháp`)
      return refreshScoreWeights(queryClient)
    },
    onError: (error) => refreshOnStaleError(queryClient, error),
  })
}
