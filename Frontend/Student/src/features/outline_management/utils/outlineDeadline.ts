import { formatDate } from '@/shared/utils'
import type { ThesisOutlineResponse } from '../types/outline.types'
import type { StudentTopicOverviewResponse } from '../types/topicTitle.types'

export interface OutlineDeadlineDisplay {
  text: string
  toneClassName: string
  isOpenForStudent: boolean
  lockedReason: string | null
}

export interface OutlineDeadlineDisplayOptions {
  /** Nhãn mặc định khi BE chưa trả `deadlineName` (ví dụ khi `NOT_CONFIGURED`). */
  fallbackName?: string
}

export interface OutlineSubmitState {
  canSubmit: boolean
  reason: string | null
  deadlineDisplay: OutlineDeadlineDisplay
}

type OutlineDeadlineInput = Pick<
  StudentTopicOverviewResponse,
  'deadlineStartDate' | 'deadlineEndDate' | 'deadlineStatus'
> & {
  deadlineName?: string | null
}

/** Chuẩn hóa nhãn hiển thị tên mốc thời hạn từ BE. */
export function formatOutlineDeadlineName(
  deadlineName?: string | null,
  fallbackName: string = 'Thời hạn nộp',
): string {
  const trimmed = deadlineName?.trim()
  if (!trimmed) {
    return fallbackName.trim() || 'Thời hạn nộp'
  }
  if (/^Hạn sinh viên chỉnh sửa\s*&\s*nộp lại đề cương$/i.test(trimmed)) {
    return 'Hạn nộp đề cương'
  }
  return trimmed
}

function getDeadlineDisplayLabel(
  overview?: OutlineDeadlineInput | null,
  options?: OutlineDeadlineDisplayOptions,
): string {
  return formatOutlineDeadlineName(overview?.deadlineName, options?.fallbackName)
}

function toSentenceLowerPrefix(label: string): string {
  if (!label) return 'thời hạn nộp'
  return label.charAt(0).toLowerCase() + label.slice(1)
}

/**
 * Chuyển thông tin mốc thời hạn từ BE (`CHOT_TEN_DE_TAI` khi chốt tên lần đầu,
 * `SV_CHINH_SUA_NOP_LAI_DE_CUONG` khi đổi tên đề tài / nộp đề cương) sang nhãn hiển thị
 * và lý do khóa theo `deadlineName` / `deadlineStatus`.
 */
export function getOutlineDeadlineDisplay(
  overview?: OutlineDeadlineInput | null,
  options?: OutlineDeadlineDisplayOptions,
): OutlineDeadlineDisplay {
  const label = getDeadlineDisplayLabel(overview, options)
  const lowerLabel = toSentenceLowerPrefix(label)

  if (!overview) {
    return {
      text: 'Chưa cấu hình thời hạn nộp',
      toneClassName: 'text-slate-500',
      isOpenForStudent: false,
      lockedReason: `Học kỳ hiện tại chưa được cấu hình ${lowerLabel}.`,
    }
  }

  const start = formatDate(overview.deadlineStartDate, 'full')
  const end = formatDate(overview.deadlineEndDate, 'full')

  switch (overview.deadlineStatus) {
    case 'OPEN':
      return {
        text:
          start && end
            ? `Từ ${start} đến ${end} (Đang mở)`
            : end
              ? `Đến ${end} (Đang mở)`
              : 'Đang mở',
        toneClassName: 'text-amber-800',
        isOpenForStudent: true,
        lockedReason: null,
      }
    case 'EXTENDED':
      return {
        text: end
          ? `Đã hết hạn nộp — Đang trong thời gian gia hạn chấm của giảng viên (đến ${end})`
          : 'Đã hết hạn nộp — Đang trong thời gian gia hạn chấm của giảng viên',
        toneClassName: 'text-amber-700',
        isOpenForStudent: false,
        lockedReason: end
          ? `Đã hết ${lowerLabel} cho sinh viên (đang gia hạn chấm cho giảng viên đến ${end}).`
          : `Đã hết ${lowerLabel} cho sinh viên (đang gia hạn chấm cho giảng viên).`,
      }
    case 'NOT_STARTED':
      return {
        text:
          start && end
            ? `Chưa mở (Mở từ ${start} - Đóng lúc ${end})`
            : start
              ? `Chưa mở (Mở từ ${start})`
              : 'Chưa đến thời gian mở nộp',
        toneClassName: 'text-slate-600',
        isOpenForStudent: false,
        lockedReason: start
          ? `${label} chưa mở (Mở từ ${start}).`
          : `Chưa đến ${lowerLabel}.`,
      }
    case 'CLOSED':
      return {
        text: end ? `Đã hết hạn (${end})` : 'Đã hết hạn',
        toneClassName: 'text-rose-700',
        isOpenForStudent: false,
        lockedReason: null,
      }
    case 'NOT_CONFIGURED':
    case 'INACTIVE':
    default:
      return {
        text: 'Chưa cấu hình thời hạn nộp',
        toneClassName: 'text-slate-500',
        isOpenForStudent: false,
        lockedReason: `Học kỳ hiện tại chưa được cấu hình ${lowerLabel}.`,
      }
  }
}

const OUTLINE_STAGE_ORDER: Record<string, number> = {
  STAGE_1_REGISTERING_ADVISOR: 0,
  STAGE_1_ADVISOR_ASSIGNED: 1,
  STAGE_2_TOPIC_CONFIRMED: 2,
  STAGE_3_OUTLINE_APPROVED: 3,
  STAGE_4_REPORT_APPROVED: 4,
  STAGE_5_REVIEW_PASSED: 5,
  STAGE_6_DEFENSE_COMPLETED: 6,
}

/**
 * Kiểm tra đầy đủ điều kiện mở/khóa thao tác nộp & soạn đề cương theo tài liệu BE (`GET /outline/my-outline`).
 */
export function getOutlineSubmitState(
  outline?: ThesisOutlineResponse | null,
): OutlineSubmitState {
  const deadlineDisplay = getOutlineDeadlineDisplay(outline, {
    fallbackName: 'Thời hạn nộp đề cương',
  })

  if (!outline) {
    return {
      canSubmit: false,
      reason: null,
      deadlineDisplay,
    }
  }

  if (!outline.topicPublicId) {
    return {
      canSubmit: false,
      reason: 'Bạn chưa nằm trong danh sách sinh viên thực hiện đồ án của học kỳ này.',
      deadlineDisplay,
    }
  }

  if (outline.topicStatus === 'DISQUALIFIED') {
    const detail = outline.disqualificationReason?.trim()
    return {
      canSubmit: false,
      reason: detail
        ? `Đề tài đã bị đình chỉ (${detail}), không thể nộp đề cương.`
        : 'Đề tài đã bị đình chỉ, không thể nộp đề cương.',
      deadlineDisplay,
    }
  }

  if (outline.topicStatus !== 'IN_PROGRESS') {
    return {
      canSubmit: false,
      reason: `Đề tài hiện ở trạng thái ${outline.topicStatus ?? 'không hợp lệ'}, không thể nộp đề cương.`,
      deadlineDisplay,
    }
  }

  if (outline.status === 'APPROVED') {
    return {
      canSubmit: false,
      reason: 'Đề cương đã được phê duyệt, không thể nộp lại.',
      deadlineDisplay,
    }
  }

  if (outline.status === 'REJECTED') {
    return {
      canSubmit: false,
      reason: 'Đề cương đã bị đánh không đạt, không thể nộp lại.',
      deadlineDisplay,
    }
  }

  const stageRank = OUTLINE_STAGE_ORDER[outline.currentStage ?? ''] ?? -1
  if (stageRank < OUTLINE_STAGE_ORDER.STAGE_2_TOPIC_CONFIRMED) {
    return {
      canSubmit: false,
      reason: null,
      deadlineDisplay,
    }
  }

  // Khi chưa nộp lần đầu (publicId === null), BE trả reviewerPublicId = null dù TBM đã phân công.
  // Chỉ khóa nếu đã có bản ghi ThesisOutline nhưng chưa có GV nhận xét; khi nộp lần đầu BE sẽ kiểm tra lỗi 3079.
  if (outline.publicId !== null && !outline.reviewerPublicId) {
    return {
      canSubmit: false,
      reason: 'Đang chờ Trưởng bộ môn phân công giảng viên nhận xét đề cương.',
      deadlineDisplay,
    }
  }

  if (!deadlineDisplay.isOpenForStudent) {
    return {
      canSubmit: false,
      reason: deadlineDisplay.lockedReason,
      deadlineDisplay,
    }
  }

  return {
    canSubmit: true,
    reason: null,
    deadlineDisplay,
  }
}

/** Kiểm tra một response từ BE đã được cấu hình mốc thời hạn hay chưa. */
export function hasConfiguredDeadline(
  overview?: OutlineDeadlineInput | null,
): boolean {
  if (!overview) return false
  return (
    overview.deadlineStatus !== 'NOT_CONFIGURED' ||
    Boolean(overview.deadlineStartDate) ||
    Boolean(overview.deadlineEndDate)
  )
}

/**
 * Kiểm tra xem mốc hạn chốt tên đề tài (`GET /topic/my-title-history`) có khác với
 * mốc hạn nộp đề cương (`GET /outline/my-outline`) hay không để hiển thị đủ 2 hạn trên UI.
 */
export function hasDistinctTopicDeadline(
  topicOverview?: OutlineDeadlineInput | null,
  outlineData?: OutlineDeadlineInput | null,
): boolean {
  if (!hasConfiguredDeadline(topicOverview) || !outlineData) {
    return false
  }
  return (
    topicOverview?.deadlineName !== outlineData.deadlineName ||
    topicOverview?.deadlineStartDate !== outlineData.deadlineStartDate ||
    topicOverview?.deadlineEndDate !== outlineData.deadlineEndDate ||
    topicOverview?.deadlineStatus !== outlineData.deadlineStatus
  )
}
