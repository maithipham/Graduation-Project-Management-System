import { isApiError } from '@/shared/types'

/** Mã lỗi nghiệp vụ của API rubric (đặc tả mục 3) */
export const RUBRIC_ERROR = {
  VALIDATION: 4000,
  NOT_FOUND: 3101,
  NOT_EDITABLE: 3102,
  NOT_READY: 3103,
  HAS_SHEETS: 3106,
  NOT_DRAFT: 3107,
  IN_USE: 3108,
  VERSION_CONFLICT: 3109,
  TREE_ITEM_INVALID: 3113,
  /** "Từ kỳ" đã kết thúc (R1) */
  FROM_SEMESTER_ENDED: 3123,
  /** "Đến kỳ" bắt đầu trước "Từ kỳ" (R2) */
  SEMESTER_RANGE_INVALID: 3124,
  /** Trùng khoảng với rubric khác cùng loại (R3) – message động, hiện nguyên văn */
  SEMESTER_OVERLAP: 3125,
  /** Bỏ học kỳ đã có phiếu chấm ra khỏi khoảng (R5) – message động, hiện nguyên văn */
  SEMESTER_HAS_SHEETS_EXCLUDED: 3126,
  /** Chỉ sửa kỳ / hủy áp dụng được rubric Sắp áp dụng / Đang áp dụng */
  NOT_APPLIED_STATUS: 3127,
  SEMESTER_NOT_FOUND: 4041,
} as const

export type RubricErrorCode = (typeof RUBRIC_ERROR)[keyof typeof RUBRIC_ERROR]

/** `error` là lỗi BE có mã nằm trong `codes` (giống catch theo loại exception bên Java) */
export function hasRubricErrorCode(error: unknown, ...codes: RubricErrorCode[]): boolean {
  return isApiError(error) && (codes as number[]).includes(error.code)
}

/** Câu báo lỗi để hiện trên giao diện (lấy message BE trả, thiếu thì dùng câu chung) */
export function getRubricErrorMessage(error: unknown, fallback = 'Đã có lỗi xảy ra, vui lòng thử lại'): string {
  return isApiError(error) && error.message ? error.message : fallback
}
