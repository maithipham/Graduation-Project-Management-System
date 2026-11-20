import { isApiError } from '@/shared/types'

/** Mã lỗi nghiệp vụ của API trọng số điểm tổng kết (đặc tả mục 3) */
export const SCORE_WEIGHT_ERROR = {
  VALIDATION: 4000,
  NOT_FOUND: 3129,
  NOT_EDITABLE: 3130,
  HAS_SUBMITTED_SHEETS: 3131,
  NOT_DRAFT: 3132,
  VERSION_CONFLICT: 3133,
  FROM_SEMESTER_ENDED: 3134,
  RANGE_INVALID: 3135,
  /** Trùng khoảng với cấu hình khác – message động, hiện nguyên văn */
  OVERLAP: 3136,
  /** Bỏ học kỳ đã có phiếu nộp ra khỏi khoảng – message động, hiện nguyên văn */
  HAS_SHEETS_EXCLUDED: 3137,
  NOT_APPLIED_STATUS: 3138,
  TOTAL_INVALID: 3139,
  SEMESTER_NOT_FOUND: 4041,
} as const

export type ScoreWeightErrorCode = (typeof SCORE_WEIGHT_ERROR)[keyof typeof SCORE_WEIGHT_ERROR]

/** `error` là lỗi BE có mã nằm trong `codes` */
export function hasScoreWeightErrorCode(error: unknown, ...codes: ScoreWeightErrorCode[]): boolean {
  return isApiError(error) && (codes as number[]).includes(error.code)
}
