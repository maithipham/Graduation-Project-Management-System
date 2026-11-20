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
  SUBMITTED: 'Phiếu đã nộp, chỉ xem.',
  TOPIC_DISQUALIFIED: 'Đề tài bị đình chỉ.',
  TOPIC_CANCELLED: 'Đề tài đã hủy.',
  TOPIC_NOT_READY: 'Đề tài chưa được duyệt báo cáo hoặc đã qua giai đoạn chấm hướng dẫn.',
  DEADLINE_NOT_CONFIGURED: 'Chưa thiết lập hạn chấm.',
  DEADLINE_NOT_OPEN: 'Chưa đến thời gian chấm.',
  DEADLINE_EXPIRED: 'Đã hết hạn chấm.',
  TEMPLATE_NOT_ASSIGNED: 'Học kỳ chưa có rubric chấm hướng dẫn.',
}

/** Ngày giờ ISO của BE ("2026-11-17T10:00:00") → "17/11/2026, 10:00" */
export function formatAdvisorGradeDateTime(value: string | null | undefined): string {
  return value ? formatDate(value, 'full') : ''
}

/** Lý do chỉ xem, kèm mốc thời gian khi chưa mở / đã hết hạn */
export function getAdvisorGradeReadonlyMessage(
  reason: AdvisorGradeReadonlyReason | null,
  deadline: AdvisorGradeDeadline | null,
): string | null {
  if (!reason) return null
  const base = ADVISOR_GRADE_READONLY_LABELS[reason] ?? 'Không thể chấm phiếu này.'
  if (reason === 'DEADLINE_NOT_OPEN' && deadline?.startDate) {
    return `${base.slice(0, -1)} (mở lúc ${formatAdvisorGradeDateTime(deadline.startDate)}).`
  }
  if (reason === 'DEADLINE_EXPIRED' && deadline?.endDate) {
    return `${base.slice(0, -1)} (hạn cuối ${formatAdvisorGradeDateTime(deadline.endDate)}).`
  }
  return base
}

export type AdvisorGradeDeadlineState = 'NOT_CONFIGURED' | 'OPEN' | 'NOT_OPEN' | 'EXPIRED'

/** Trạng thái hạn chấm cho badge đầu màn. `open` do BE tính; FE chỉ so ngày để biết chưa mở hay đã hết */
export function getAdvisorGradeDeadlineState(
  deadline: AdvisorGradeDeadline | null,
  now: Date = new Date(),
): AdvisorGradeDeadlineState {
  if (!deadline) return 'NOT_CONFIGURED'
  if (deadline.open) return 'OPEN'
  const start = new Date(deadline.startDate)
  return !Number.isNaN(start.getTime()) && now < start ? 'NOT_OPEN' : 'EXPIRED'
}

// ---------------------------------------------------------------------------
// Điều kiện trên bảng danh sách
// ---------------------------------------------------------------------------

/** Dòng chưa có phiếu và không chấm được → không gọi C2 (chắc chắn lỗi) */
export function canOpenAdvisorGradeSheet(topic: AdvisorGradeTopic): boolean {
  return !(topic.sheetStatus === 'NOT_STARTED' && !topic.canGrade)
}

/** Nhãn nút trên dòng: "Chấm" khi còn sửa được, "Xem" khi đã nộp hoặc chỉ xem */
export function getAdvisorGradeActionLabel(topic: AdvisorGradeTopic): 'Chấm' | 'Xem' {
  return topic.canGrade && topic.sheetStatus !== 'SUBMITTED' ? 'Chấm' : 'Xem'
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
  ADVISOR_GRADE_ERROR_CODES.EVALUATION_SHEET_ALREADY_SUBMITTED,
  ADVISOR_GRADE_ERROR_CODES.DEADLINE_NOT_CONFIGURED,
  ADVISOR_GRADE_ERROR_CODES.DEADLINE_NOT_OPEN,
  ADVISOR_GRADE_ERROR_CODES.DEADLINE_EXPIRED,
])

/**
 * Phiếu bị khóa / hết hạn trong lúc đang nhập (3117, 3118, 3064–3066)
 * → màn hình cần tải lại phiếu (C3) và danh sách (C1) để chuyển sang chế độ chỉ xem.
 */
export function isAdvisorGradeLockingError(error: unknown): boolean {
  return isApiError(error) && LOCKING_ERROR_CODES.has(error.code)
}
