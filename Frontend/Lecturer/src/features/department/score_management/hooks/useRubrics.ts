import { skipToken, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback'
import { rubricService } from '../services/rubric.service'
import type { EvaluationType, RubricRole, RubricTreeGroup, SemesterRangeBody } from '../types'
import {
  toEvaluationType,
  toRubricDetail,
  toRubricListItem,
  toSaveRubricBody,
} from '../utils/rubricMapper'
import { RUBRIC_ERROR, hasRubricErrorCode } from '../utils/rubricErrors'

// Giống gọi repository có cache: mỗi query có một "tên cache" (key). Ghi xong thì xóa cache theo key
// (invalidate) để TanStack Query tự gọi lại API, không phải tự cập nhật state bằng tay.

export const rubricKeys = {
  all: ['department', 'rubric'] as const,
  lists: () => [...rubricKeys.all, 'list'] as const,
  list: (type: EvaluationType) => [...rubricKeys.lists(), type] as const,
  details: () => [...rubricKeys.all, 'detail'] as const,
  detail: (publicId: string | undefined) => [...rubricKeys.details(), publicId] as const,
  previews: () => [...rubricKeys.all, 'preview'] as const,
  preview: (publicId: string | undefined, fromSemesterId: string | null, toSemesterId: string | null) =>
    [...rubricKeys.previews(), publicId, fromSemesterId, toSemesterId ?? ''] as const,
  cancelPreviews: () => [...rubricKeys.all, 'cancel-preview'] as const,
  cancelPreview: (publicId: string | undefined) => [...rubricKeys.cancelPreviews(), publicId] as const,
  semesters: () => [...rubricKeys.all, 'semester'] as const,
  semester: (semesterPublicId: string | undefined) => [...rubricKeys.semesters(), semesterPublicId] as const,
  semesterOptions: () => [...rubricKeys.all, 'semester-options'] as const,
}

// ---------------------------------------------------------------------------
// Đọc
// ---------------------------------------------------------------------------

/** A1 – kho rubric của tab đang mở. Đổi tab = đổi `role`, tab khác vẫn giữ cache */
export function useRubricList(role: RubricRole) {
  const type = toEvaluationType(role)
  return useQuery({
    queryKey: rubricKeys.list(type),
    queryFn: async () => (await rubricService.getList(type)).map(toRubricListItem),
  })
}

/** A2 – chi tiết rubric đang mở trong popup. publicId chưa có → chưa gọi API */
export function useRubricDetail(publicId: string | undefined) {
  return useQuery({
    queryKey: rubricKeys.detail(publicId),
    queryFn: publicId === undefined ? skipToken : async () => toRubricDetail(await rubricService.getDetail(publicId)),
  })
}

/**
 * A7 – xem trước Áp dụng / Sửa kỳ áp dụng. Chỉ gọi khi đã chọn "Từ kỳ"; `toSemesterId` null = chưa xác định.
 * Không tự thử lại: lỗi khoảng kỳ (3123–3126…) hiện ngay dưới 2 ô chọn.
 */
export function useApplyPreview(
  publicId: string | undefined,
  fromSemesterId: string | null,
  toSemesterId: string | null,
) {
  return useQuery({
    queryKey: rubricKeys.preview(publicId, fromSemesterId, toSemesterId),
    queryFn:
      publicId !== undefined && fromSemesterId !== null
        ? () => rubricService.getApplyPreview(publicId, fromSemesterId, toSemesterId)
        : skipToken,
    retry: false,
    staleTime: 0,
  })
}

/** A7b – xem trước Hủy áp dụng. `publicId` undefined (hộp thoại đang đóng) → chưa gọi API */
export function useCancelApplyPreview(publicId: string | undefined) {
  return useQuery({
    queryKey: rubricKeys.cancelPreview(publicId),
    queryFn: publicId === undefined ? skipToken : () => rubricService.getCancelApplyPreview(publicId),
    retry: false,
    staleTime: 0,
  })
}

// ---------------------------------------------------------------------------
// Ghi
// ---------------------------------------------------------------------------

/** Tải lại danh sách (mọi tab) + chi tiết một rubric */
function refreshRubric(queryClient: QueryClient, publicId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: rubricKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: rubricKeys.detail(publicId) }),
  ])
}

/**
 * Áp dụng / sửa kỳ / hủy áp dụng còn làm BE gán lại rubric của học kỳ → tải lại cả B1.
 * Kết quả xem trước (A7, A7b) đã cũ → xóa hẳn khỏi cache
 */
function refreshRubricAndSemesters(queryClient: QueryClient, publicId: string) {
  queryClient.removeQueries({ queryKey: rubricKeys.previews() })
  queryClient.removeQueries({ queryKey: rubricKeys.cancelPreviews() })
  return Promise.all([
    refreshRubric(queryClient, publicId),
    queryClient.invalidateQueries({ queryKey: rubricKeys.semesters() }),
  ])
}

/**
 * Lỗi cho thấy dữ liệu trên màn đã cũ (rubric bị xóa, đổi trạng thái, người khác vừa sửa…)
 * → tải lại cho khớp BE. Toast lỗi thì interceptor đã hiện (hoặc màn hình tự hiện), ở đây không toast.
 * Riêng 3109 (lệch version) không tự tải lại: màn chi tiết hỏi người dùng trước vì sẽ mất thay đổi chưa lưu.
 */
function refreshOnStaleError(queryClient: QueryClient, error: unknown, publicId: string) {
  if (hasRubricErrorCode(error, RUBRIC_ERROR.NOT_FOUND)) {
    queryClient.removeQueries({ queryKey: rubricKeys.detail(publicId) })
    return queryClient.invalidateQueries({ queryKey: rubricKeys.lists() })
  }
  if (
    hasRubricErrorCode(
      error,
      RUBRIC_ERROR.NOT_EDITABLE,
      RUBRIC_ERROR.HAS_SHEETS,
      RUBRIC_ERROR.NOT_DRAFT,
      RUBRIC_ERROR.IN_USE,
      RUBRIC_ERROR.NOT_APPLIED_STATUS,
      RUBRIC_ERROR.TREE_ITEM_INVALID,
    )
  ) {
    return refreshRubric(queryClient, publicId)
  }
  return undefined
}

/** A3 – tạo bản Nháp rỗng. Trả publicId để mở luôn popup chi tiết */
export function useCreateRubric() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ role, name }: { role: RubricRole; name: string }) =>
      rubricService.create({ type: toEvaluationType(role), name: name.trim() }),
    onSuccess: (_publicId, { name }) => {
      toast.success(`Đã tạo bản nháp ${name.trim()}`)
      return queryClient.invalidateQueries({ queryKey: rubricKeys.lists() })
    },
  })
}

/** A4 – nhân bản thành bản Nháp mới. Trả publicId bản sao */
export function useCloneRubric() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ publicId }: { publicId: string; name: string }) => rubricService.clone(publicId),
    onSuccess: (_newPublicId, { name }) => {
      toast.success(`Đã nhân bản ${name} thành bản nháp mới`)
      return queryClient.invalidateQueries({ queryKey: rubricKeys.lists() })
    },
    onError: (error, { publicId }) => refreshOnStaleError(queryClient, error, publicId),
  })
}

/**
 * A5 – lưu toàn bộ cây. `version` lấy từ lần tải A2 gần nhất.
 * Thành công → tải lại A2 để có `version` mới và publicId của phần tử vừa thêm.
 */
export function useSaveRubric() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      publicId,
      name,
      version,
      groups,
    }: {
      publicId: string
      name: string
      version: number
      groups: RubricTreeGroup[]
    }) => rubricService.save(publicId, toSaveRubricBody(name, version, groups)),
    onSuccess: (_data, { publicId }) => {
      toast.success('Đã lưu các thay đổi của rubric')
      return refreshRubric(queryClient, publicId)
    },
    onError: (error, { publicId }) => refreshOnStaleError(queryClient, error, publicId),
  })
}

/** A6 – xóa rubric Nháp */
export function useDeleteRubric() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ publicId }: { publicId: string; name: string }) => rubricService.remove(publicId),
    onSuccess: (_data, { publicId, name }) => {
      toast.success(`Đã xóa ${name}`)
      queryClient.removeQueries({ queryKey: rubricKeys.detail(publicId) })
      return queryClient.invalidateQueries({ queryKey: rubricKeys.lists() })
    },
    onError: (error, { publicId }) => refreshOnStaleError(queryClient, error, publicId),
  })
}

/** A8 – áp dụng rubric Nháp cho khoảng học kỳ đã chọn */
export function useApplyRubric() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ publicId, body }: { publicId: string; body: SemesterRangeBody; name: string }) =>
      rubricService.apply(publicId, body),
    onSuccess: (_data, { publicId, name }) => {
      toast.success(`Đã áp dụng ${name}`)
      return refreshRubricAndSemesters(queryClient, publicId)
    },
    onError: (error, { publicId }) => refreshOnStaleError(queryClient, error, publicId),
  })
}

/** A9 – sửa kỳ áp dụng ("Từ kỳ" / "Đến kỳ") của rubric Sắp / Đang áp dụng */
export function useChangeSemesterRange() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ publicId, body }: { publicId: string; body: SemesterRangeBody; name: string }) =>
      rubricService.changeSemesterRange(publicId, body),
    onSuccess: (_data, { publicId, name }) => {
      toast.success(`Đã cập nhật kỳ áp dụng của ${name}`)
      return refreshRubricAndSemesters(queryClient, publicId)
    },
    onError: (error, { publicId }) => refreshOnStaleError(queryClient, error, publicId),
  })
}

/** A10 – hủy áp dụng, rubric về Nháp */
export function useCancelApplyRubric() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ publicId }: { publicId: string; name: string }) => rubricService.cancelApply(publicId),
    onSuccess: (_data, { publicId, name }) => {
      toast.success(`Đã hủy áp dụng ${name}, rubric trở về bản nháp`)
      return refreshRubricAndSemesters(queryClient, publicId)
    },
    onError: (error, { publicId }) => refreshOnStaleError(queryClient, error, publicId),
  })
}

