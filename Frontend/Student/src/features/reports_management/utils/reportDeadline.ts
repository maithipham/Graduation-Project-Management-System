import { formatDate } from '@/shared/utils'
import type { ReportDeadlineStatus, ThesisFinalReportResponse } from '../types/reports.types'

export interface ReportDeadlineDisplay {
  text: string
  badgeText: string | null
  badgeClassName: string
  toneClassName: string
  isOpenForStudent: boolean
  lockedReason: string | null
}

export interface ReportSubmitState {
  canSubmit: boolean
  reason: string | null
  deadlineDisplay: ReportDeadlineDisplay
}

type ReportDeadlineInput = {
  deadlineName?: string | null
  deadlineStartDate?: string | null
  deadlineEndDate?: string | null
  deadlineStatus?: ReportDeadlineStatus | null
}

const REPORT_STAGE_ORDER: Record<string, number> = {
  STAGE_1_REGISTERING_ADVISOR: 0,
  STAGE_1_ADVISOR_ASSIGNED: 1,
  STAGE_2_TOPIC_CONFIRMED: 2,
  STAGE_3_OUTLINE_APPROVED: 3,
  STAGE_4_REPORT_APPROVED: 4,
  STAGE_5_REVIEW_PASSED: 5,
  STAGE_6_DEFENSE_COMPLETED: 6,
}

export function formatReportDeadlineName(
  deadlineName?: string | null,
  fallbackName: string = 'Thời hạn nộp báo cáo Final',
): string {
  const trimmed = deadlineName?.trim()
  return trimmed || fallbackName
}

/**
 * Chuyển thông tin mốc thời hạn `NOP_BAO_CAO_VA_PHIEU_THEO_DOI` từ BE
 * sang nhãn hiển thị, badge trạng thái và lý do khóa cho sinh viên.
 */
export function getReportDeadlineDisplay(
  report?: ReportDeadlineInput | null,
): ReportDeadlineDisplay {
  const status = report?.deadlineStatus
  const start = formatDate(report?.deadlineStartDate, 'full')
  const end = formatDate(report?.deadlineEndDate, 'full')

  if (!report || !status || status === 'NOT_CONFIGURED' || status === 'INACTIVE' || !end) {
    return {
      text: 'Chưa có',
      badgeText: null,
      badgeClassName: 'bg-slate-100 text-slate-600 border-slate-200',
      toneClassName: 'text-slate-500',
      isOpenForStudent: false,
      lockedReason: 'Học kỳ hiện tại chưa cấu hình thời hạn nộp báo cáo Final.',
    }
  }

  switch (status) {
    case 'OPEN':
      return {
        text: start ? `Từ ${start} đến ${end}` : `Hạn chót: ${end}`,
        badgeText: 'Đang mở',
        badgeClassName: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        toneClassName: 'text-slate-900',
        isOpenForStudent: true,
        lockedReason: null,
      }
    case 'NOT_STARTED':
      return {
        text: start ? `Mở từ ${start} – Đóng lúc ${end}` : `Đóng lúc ${end}`,
        badgeText: 'Chưa mở',
        badgeClassName: 'bg-amber-50 text-amber-700 border-amber-200',
        toneClassName: 'text-slate-700',
        isOpenForStudent: false,
        lockedReason: start
          ? `Thời hạn nộp báo cáo chưa mở (mở từ ${start}).`
          : 'Chưa đến thời gian mở nộp báo cáo Final.',
      }
    case 'EXTENDED':
      return {
        text: end,
        badgeText: 'Đã hết hạn',
        badgeClassName: 'bg-rose-50 text-rose-700 border-rose-200',
        toneClassName: 'text-rose-700',
        isOpenForStudent: false,
        lockedReason:
          'Đã hết hạn nộp của sinh viên — Đang trong thời gian giảng viên chấm.',
      }
    case 'CLOSED':
    default:
      return {
        text: end,
        badgeText: 'Đã hết hạn',
        badgeClassName: 'bg-rose-50 text-rose-700 border-rose-200',
        toneClassName: 'text-rose-700',
        isOpenForStudent: false,
        lockedReason: `Thời hạn nộp báo cáo Final đã kết thúc (${end}).`,
      }
  }
}

/**
 * Kiểm tra đầy đủ điều kiện mở/khóa nút "Nộp báo cáo Final" theo `API_Student_FinalReport.md`.
 */
export function getFinalReportSubmitState(
  report?: ThesisFinalReportResponse | null,
): ReportSubmitState {
  const deadlineDisplay = getReportDeadlineDisplay(report)

  if (!report) {
    return {
      canSubmit: false,
      reason: null,
      deadlineDisplay,
    }
  }

  if (!report.topicPublicId) {
    return {
      canSubmit: false,
      reason: 'Bạn chưa có đề tài đồ án trong học kỳ này.',
      deadlineDisplay,
    }
  }

  if (report.topicStatus === 'DISQUALIFIED') {
    const detail = report.disqualificationReason?.trim()
    return {
      canSubmit: false,
      reason: detail
        ? `Đề tài đã bị đình chỉ (${detail}), không thể nộp báo cáo Final.`
        : 'Đề tài đã bị đình chỉ, không thể nộp báo cáo Final.',
      deadlineDisplay,
    }
  }

  if (report.topicStatus !== 'IN_PROGRESS') {
    return {
      canSubmit: false,
      reason: `Đề tài hiện ở trạng thái ${report.topicStatus ?? 'không hợp lệ'}, không thể nộp báo cáo Final.`,
      deadlineDisplay,
    }
  }

  const stageRank = REPORT_STAGE_ORDER[report.currentStage ?? ''] ?? -1
  if (stageRank < REPORT_STAGE_ORDER.STAGE_3_OUTLINE_APPROVED) {
    return {
      canSubmit: false,
      reason: 'Đề tài chưa hoàn thành phê duyệt đề cương, chưa thể nộp báo cáo Final.',
      deadlineDisplay,
    }
  }

  if (report.status === 'APPROVED') {
    return {
      canSubmit: false,
      reason: 'Báo cáo Final đã được phê duyệt đạt, không thể nộp lại.',
      deadlineDisplay,
    }
  }

  if (report.status === 'REJECTED') {
    return {
      canSubmit: false,
      reason: 'Báo cáo Final đã có kết quả không đạt, không thể nộp lại.',
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

