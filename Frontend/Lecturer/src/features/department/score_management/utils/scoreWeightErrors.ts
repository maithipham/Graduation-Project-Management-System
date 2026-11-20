import { isApiError } from '@/shared/types'

/** Mã lỗi nghiệp vụ của API trọng số điểm tổng kết (đặc tả mục 3) */
export const SCORE_WEIGHT_ERROR = {
  VALIDATION: 4000,
  NOT_FOUND: 3169,
  NOT_EDITABLE: 3170,
  HAS_SUBMITTED_SHEETS: 3171,
  NOT_DRAFT: 3172,
  VERSION_CONFLICT: 3173,
  FROM_SEMESTER_ENDED: 3174,
  RANGE_INVALID: 3175,
  /** Trùng khoảng với cấu hình khác – message động, hiện nguyên văn */
  OVERLAP: 3176,
  /** Bỏ học kỳ đã có phiếu nộp ra khỏi khoảng – message động, hiện nguyên văn */
  HAS_SHEETS_EXCLUDED: 3177,
  NOT_APPLIED_STATUS: 3178,
  TOTAL_INVALID: 3179,
  SEMESTER_NOT_FOUND: 4041,
} as const

export type ScoreWeightErrorCode = (typeof SCORE_WEIGHT_ERROR)[keyof typeof SCORE_WEIGHT_ERROR]

/** `error` là lỗi BE có mã nằm trong `codes` */
export function hasScoreWeightErrorCode(error: unknown, ...codes: ScoreWeightErrorCode[]): boolean {
  return isApiError(error) && (codes as number[]).includes(error.code)
}
