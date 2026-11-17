import { skipToken, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback'
import { rubricService } from '../services/rubric.service'
import type { ApiDate, EvaluationType, RubricRole, RubricTreeGroup } from '../types'
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
  preview: (publicId: string | undefined, effectiveFrom: ApiDate | null) =>
    [...rubricKeys.all, 'preview', publicId, effectiveFrom] as const,
  semesters: () => [...rubricKeys.all, 'semester'] as const,
  semester: (semesterPublicId: string | undefined) => [...rubricKeys.semesters(), semesterPublicId] as const,
}

const API_DATE = /^\d{4}-\d{2}-\d{2}$/

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
 * A7 – xem trước khi Áp dụng / Đổi ngày. Chỉ gọi khi đã chọn ngày đúng dạng yyyy-MM-dd.
 * Không tự thử lại: ngày sai (3104) thì hiện lỗi ngay dưới ô chọn ngày.
 */
export function useApplyPreview(publicId: string | undefined, effectiveFrom: ApiDate | null) {
  const ready = publicId !== undefined && effectiveFrom !== null && API_DATE.test(effectiveFrom)
  return useQuery({
    queryKey: rubricKeys.preview(publicId, effectiveFrom),
    queryFn: ready ? () => rubricService.getApplyPreview(publicId, effectiveFrom) : skipToken,
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

/** Áp dụng / đổi ngày / hủy áp dụng còn làm BE gán lại rubric của học kỳ → tải lại cả B1 */
function refreshRubricAndSemesters(queryClient: QueryClient, publicId: string) {
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
      RUBRIC_ERROR.NOT_LATEST,
      RUBRIC_ERROR.HAS_SHEETS,
      RUBRIC_ERROR.NOT_DRAFT,
      RUBRIC_ERROR.IN_USE,
      RUBRIC_ERROR.NOT_SCHEDULED,
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

/** A8 – áp dụng rubric Nháp từ ngày đã chọn (yyyy-MM-dd) */
export function useApplyRubric() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ publicId, effectiveFrom }: { publicId: string; effectiveFrom: ApiDate; name: string }) =>
      rubricService.apply(publicId, effectiveFrom),
    onSuccess: (_data, { publicId, name }) => {
      toast.success(`Đã áp dụng ${name}`)
      return refreshRubricAndSemesters(queryClient, publicId)
    },
    onError: (error, { publicId }) => refreshOnStaleError(queryClient, error, publicId),
  })
}

/** A9 – đổi ngày áp dụng của rubric Sắp áp dụng */
export function useChangeEffectiveFrom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ publicId, effectiveFrom }: { publicId: string; effectiveFrom: ApiDate; name: string }) =>
      rubricService.changeEffectiveFrom(publicId, effectiveFrom),
    onSuccess: (_data, { publicId, name }) => {
      toast.success(`Đã đổi ngày áp dụng của ${name}`)
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

