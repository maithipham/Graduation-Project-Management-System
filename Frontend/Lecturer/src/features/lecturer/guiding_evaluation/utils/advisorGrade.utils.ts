import { isApiError } from '@/shared/types'
import { formatDate } from '@/shared/utils'
import {
  ADVISOR_GRADE_ERROR_CODES,
  type AdvisorGradeDeadline,
  type AdvisorGradeGroup,
  type AdvisorGradeReadonlyReason,
  type AdvisorGradeSheet,
  type AdvisorGradeSheetBody,
  type AdvisorGradeSheetStatus,
  type AdvisorGradeTopic,
} from '../types/advisorGrade.types'

// Tiện ích cho màn chấm điểm hướng dẫn (API /advisor-grade). Không gọi API, không có state.

/** Điểm từng tiêu chí theo criteriaId (publicId của tiêu chí). `null` = chưa chấm */
export type AdvisorGradeScores = Record<string, number | null>

// ---------------------------------------------------------------------------
// Nhãn hiển thị
// ---------------------------------------------------------------------------

export const ADVISOR_GRADE_STATUS_META: Record<
  AdvisorGradeSheetStatus,
  { label: string; tone: 'slate' | 'amber' | 'emerald' }
> = {
  NOT_STARTED: { label: 'Chưa chấm', tone: 'slate' },
  DRAFT: { label: 'Đang chấm (nháp)', tone: 'amber' },
  SUBMITTED: { label: 'Đã nộp', tone: 'emerald' },
}

export const ADVISOR_GRADE_READONLY_LABELS: Record<AdvisorGradeReadonlyReason, string> = {
  TOPIC_DISQUALIFIED: 'Đề tài bị đình chỉ.',
  TOPIC_CANCELLED: 'Đề tài đã hủy.',
  TOPIC_NOT_READY: 'Đề tài chưa được duyệt báo cáo hoặc đã bảo vệ xong.',
  GRADING_LOCKED: 'Đã qua thời gian tổ chức hội đồng bảo vệ, không thể chấm hoặc sửa điểm.',
  TEMPLATE_NOT_ASSIGNED: 'Học kỳ chưa có rubric chấm hướng dẫn.',
}

/** Ngày giờ ISO của BE ("2026-11-17T10:00:00") → "17/11/2026, 10:00" */
export function formatAdvisorGradeDateTime(value: string | null | undefined): string {
  return value ? formatDate(value, 'full') : ''
}

/**
 * Lý do chỉ xem. Khi đã khóa chấm thì kèm thời điểm khóa
 * (`lockAt` ở C1 hoặc `deadline.endDate` ở phiếu).
 */
export function getAdvisorGradeReadonlyMessage(
  reason: AdvisorGradeReadonlyReason | null,
  lockAt: string | null | undefined,
): string | null {
  if (!reason) return null
  const base = ADVISOR_GRADE_READONLY_LABELS[reason] ?? 'Không thể chấm phiếu này.'
  if (reason === 'GRADING_LOCKED' && lockAt) {
    return `${base.slice(0, -1)} (khóa lúc ${formatAdvisorGradeDateTime(lockAt)}).`
  }
  return base
}

/** Thời điểm khóa chấm của phiếu; `null` = chưa có mốc (chưa khóa) */
export function getSheetLockAt(deadline: AdvisorGradeDeadline | null | undefined): string | null {
  return deadline?.endDate ?? null
}

// ---------------------------------------------------------------------------
// Điều kiện trên bảng danh sách
// ---------------------------------------------------------------------------

/** Dòng chưa có phiếu và không chấm được → không gọi C2 (chắc chắn lỗi) */
export function canOpenAdvisorGradeSheet(topic: AdvisorGradeTopic): boolean {
  return !(topic.sheetStatus === 'NOT_STARTED' && !topic.canGrade)
}

export type AdvisorGradeAction = 'Chấm' | 'Sửa điểm' | 'Xem'

/**
 * Nút trên dòng: "Chấm" khi chưa nộp và còn chấm được; "Sửa điểm" khi đã nộp nhưng chưa khóa
 * (nộp lại được); "Xem" khi không chấm được nữa.
 */
export function getAdvisorGradeActionLabel(topic: AdvisorGradeTopic): AdvisorGradeAction {
  if (!topic.canGrade) return 'Xem'
  return topic.sheetStatus === 'SUBMITTED' ? 'Sửa điểm' : 'Chấm'
}

// ---------------------------------------------------------------------------
// Ô nhập điểm
// ---------------------------------------------------------------------------

/** 0–10, tối đa 1 chữ số thập phân. Chấp nhận dấu phẩy ("8,5") */
const SCORE_PATTERN = /^\d{1,2}(\.\d)?$/

export type ParsedScoreInput = { ok: true; value: number | null } | { ok: false; error: string }

/** Đọc chuỗi trong ô điểm. Ô trống → `null` (chưa chấm), KHÔNG coi là 0 */
export function parseScoreInput(raw: string | null | undefined): ParsedScoreInput {
  const text = (raw ?? '').trim().replace(',', '.')
  if (text === '') return { ok: true, value: null }
  if (!SCORE_PATTERN.test(text)) {
    return { ok: false, error: 'Điểm phải là số từ 0 đến 10, tối đa 1 chữ số thập phân' }
  }
  const value = Number(text)
  if (value > 10) {
    return { ok: false, error: 'Điểm phải là số từ 0 đến 10, tối đa 1 chữ số thập phân' }
  }
  return { ok: true, value }
}

/** Điểm → chuỗi cho ô nhập (`null` → "") */
export function formatScoreInput(score: number | null | undefined): string {
  return score === null || score === undefined ? '' : String(score)
}

/** Giá trị ban đầu cho form từ phiếu BE trả về */
export function getInitialScoreInputs(sheet: AdvisorGradeSheet): Record<string, string> {
  const inputs: Record<string, string> = {}
  for (const group of sheet.groups) {
    for (const criteria of group.criteria) {
      inputs[criteria.publicId] = formatScoreInput(criteria.score)
    }
  }
  return inputs
}

/** Điểm hiện có trên phiếu (dùng khi xem phiếu chỉ đọc) */
export function getSheetScores(sheet: AdvisorGradeSheet): AdvisorGradeScores {
  const scores: AdvisorGradeScores = {}
  for (const group of sheet.groups) {
    for (const criteria of group.criteria) scores[criteria.publicId] = criteria.score
  }
  return scores
}

// ---------------------------------------------------------------------------
// Tính điểm xem trước (giống công thức BE, mục 9 tài liệu)
// ---------------------------------------------------------------------------

export interface AdvisorGradePreview {
  /** Tổng đóng góp từng nhóm (theo publicId nhóm) */
  groupTotals: Record<string, number>
  /** Σ score * weight / 100 các tiêu chí đã có điểm, 5 chữ số thập phân */
  totalScore: number
  /** totalScore làm tròn 1 chữ số HALF_UP; `null` khi chưa chấm tiêu chí nào */
  advisorScore: number | null
  gradedCount: number
  totalCriteria: number
}

// Tính trên số nguyên để tránh sai số số thực (7.25 → 7.3, không ra 7.2):
// score có ≤ 1 chữ số thập phân → score*10 nguyên; weight có ≤ 2 chữ số → weight*100 nguyên.
// đóng góp = score * weight / 100 = (score*10) * (weight*100) / 100000.
const CONTRIBUTION_SCALE = 100_000

function toContributionUnits(score: number, weight: number): number {
  return Math.round(score * 10) * Math.round(weight * 100)
}

/** Làm tròn 1 chữ số thập phân kiểu HALF_UP từ số đơn vị 1e-5 (luôn ≥ 0) */
function roundUnitsHalfUp(units: number): number {
  return Math.floor((units + CONTRIBUTION_SCALE / 20) / (CONTRIBUTION_SCALE / 10)) / 10
}

export function computeAdvisorGradePreview(
  groups: AdvisorGradeGroup[],
  scores: AdvisorGradeScores,
): AdvisorGradePreview {
  const groupTotals: Record<string, number> = {}
  let totalUnits = 0
  let gradedCount = 0
  let totalCriteria = 0

  for (const group of groups) {
    let groupUnits = 0
    for (const criteria of group.criteria) {
      totalCriteria += 1
      const score = scores[criteria.publicId]
      if (score === null || score === undefined) continue
      gradedCount += 1
      groupUnits += toContributionUnits(score, criteria.weight)
    }
    groupTotals[group.publicId] = groupUnits / CONTRIBUTION_SCALE
    totalUnits += groupUnits
  }

  return {
    groupTotals,
    totalScore: totalUnits / CONTRIBUTION_SCALE,
    advisorScore: gradedCount === 0 ? null : roundUnitsHalfUp(totalUnits),
    gradedCount,
    totalCriteria,
  }
}

// ---------------------------------------------------------------------------
// Dựng body C4 / C5
// ---------------------------------------------------------------------------

/**
 * BE thay TOÀN BỘ điểm theo `details` → luôn gửi đủ mọi tiêu chí của phiếu,
 * tiêu chí chưa nhập gửi `score: null`. Nhận xét trống → `null`.
 */
export function toAdvisorGradeSheetBody(
  groups: AdvisorGradeGroup[],
  scores: AdvisorGradeScores,
  generalComment: string | null | undefined,
): AdvisorGradeSheetBody {
  const comment = (generalComment ?? '').trim()
  return {
    generalComment: comment === '' ? null : comment,
    details: groups.flatMap((group) =>
      group.criteria.map((criteria) => ({
        criteriaId: criteria.publicId,
        score: scores[criteria.publicId] ?? null,
      })),
    ),
  }
}

/** Kiểm tra FE trước khi nộp (BE vẫn kiểm tra lại: 3119 / 3120) */
export function getSubmitBlockers(
  groups: AdvisorGradeGroup[],
  scores: AdvisorGradeScores,
  generalComment: string | null | undefined,
): { missingCriteriaIds: string[]; missingComment: boolean } {
  const missingCriteriaIds = groups.flatMap((group) =>
    group.criteria
      .filter((criteria) => scores[criteria.publicId] === null || scores[criteria.publicId] === undefined)
      .map((criteria) => criteria.publicId),
  )
  return { missingCriteriaIds, missingComment: (generalComment ?? '').trim() === '' }
}

// ---------------------------------------------------------------------------
// Lỗi
// ---------------------------------------------------------------------------

const LOCKING_ERROR_CODES: ReadonlySet<number> = new Set([
  ADVISOR_GRADE_ERROR_CODES.GRADING_TOPIC_NOT_ELIGIBLE,
  ADVISOR_GRADE_ERROR_CODES.ADVISOR_GRADING_LOCKED,
])

/**
 * Đề tài đổi trạng thái hoặc đã khóa chấm trong lúc đang nhập (3117, 3168)
 * → tải lại phiếu (C3) và danh sách (C1) để popup chuyển sang chế độ chỉ xem.
 */
export function isAdvisorGradeLockingError(error: unknown): boolean {
  return isApiError(error) && LOCKING_ERROR_CODES.has(error.code)
}

/**
 * C4 trả 3118: phiếu đã được nộp ở nơi khác (vd tab khác) → tải lại phiếu (C3),
 * popup vẫn sửa được nhưng dùng nút "Nộp lại" thay cho "Lưu nháp".
 */
export function isAdvisorGradeAlreadySubmittedError(error: unknown): boolean {
  return isApiError(error) && error.code === ADVISOR_GRADE_ERROR_CODES.EVALUATION_SHEET_ALREADY_SUBMITTED
}
