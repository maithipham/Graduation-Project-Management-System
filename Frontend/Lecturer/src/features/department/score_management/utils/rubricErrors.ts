import { isApiError } from '@/shared/types'

/** Mã lỗi nghiệp vụ của API rubric (đặc tả mục 3) */
export const RUBRIC_ERROR = {
  VALIDATION: 4000,
  NOT_FOUND: 3101,
  NOT_EDITABLE: 3102,
  NOT_READY: 3103,
  EFFECTIVE_FROM_INVALID: 3104,
  NOT_LATEST: 3105,
  HAS_SHEETS: 3106,
  NOT_DRAFT: 3107,
  IN_USE: 3108,
  VERSION_CONFLICT: 3109,
  NOT_SCHEDULED: 3110,
  SEMESTER_LOCKED: 3111,
  TYPE_MISMATCH: 3112,
  TREE_ITEM_INVALID: 3113,
  NOT_APPLIED: 3114,
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
