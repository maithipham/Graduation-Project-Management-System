import { formatDate } from '@/shared/utils'
import type { ThesisOutlineResponse } from '../types/outline.types'
import type { StudentTopicOverviewResponse } from '../types/topicTitle.types'

export interface OutlineDeadlineDisplay {
  text: string
  toneClassName: string
  isOpenForStudent: boolean
  lockedReason: string | null
}

export interface OutlineSubmitState {
  canSubmit: boolean
  reason: string | null
  deadlineDisplay: OutlineDeadlineDisplay
}

type OutlineDeadlineInput = Pick<
  StudentTopicOverviewResponse,
  'deadlineStartDate' | 'deadlineEndDate' | 'deadlineStatus'
>

/**
 * Chuyển thông tin mốc thời hạn dùng chung (`SV_CHINH_SUA_NOP_LAI_DE_CUONG`) từ BE
 * sang nhãn hiển thị và cờ khóa thao tác thống nhất cho chốt tên, đổi tên và nộp đề cương.
 */
export function getOutlineDeadlineDisplay(
  overview?: OutlineDeadlineInput | null,
): OutlineDeadlineDisplay {
  if (!overview) {
    return {
      text: 'Chưa cấu hình thời hạn nộp',
      toneClassName: 'text-slate-500',
      isOpenForStudent: false,
      lockedReason:
        'Học kỳ hiện tại chưa được cấu hình thời hạn nộp đề cương và cập nhật tên đề tài.',
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
          ? `Đã hết hạn sinh viên nộp đề cương và cập nhật tên đề tài (đang gia hạn chấm cho giảng viên đến ${end}).`
          : 'Đã hết hạn sinh viên nộp đề cương và cập nhật tên đề tài (đang gia hạn chấm cho giảng viên).',
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
          ? `Chưa đến thời hạn nộp đề cương và cập nhật tên đề tài (Mở từ ${start}).`
          : 'Chưa đến thời hạn nộp đề cương và cập nhật tên đề tài.',
      }
    case 'CLOSED':
      return {
        text: end ? `Đã hết hạn (${end})` : 'Đã hết hạn',
        toneClassName: 'text-rose-700',
        isOpenForStudent: false,
        lockedReason: end
          ? `Thời hạn nộp đề cương và cập nhật tên đề tài đã kết thúc (${end}). Vui lòng liên hệ GVHD / Trưởng bộ môn.`
          : 'Thời hạn nộp đề cương và cập nhật tên đề tài đã kết thúc. Vui lòng liên hệ GVHD / Trưởng bộ môn.',
      }
    case 'NOT_CONFIGURED':
    case 'INACTIVE':
    default:
      return {
        text: 'Chưa cấu hình thời hạn nộp',
        toneClassName: 'text-slate-500',
        isOpenForStudent: false,
        lockedReason:
          'Học kỳ hiện tại chưa được cấu hình thời hạn nộp đề cương và cập nhật tên đề tài.',
      }
  }
}

/**
 * Kiểm tra đầy đủ điều kiện mở/khóa thao tác nộp & soạn đề cương theo tài liệu BE (`GET /outline/my-outline`).
 */
export function getOutlineSubmitState(
  outline?: ThesisOutlineResponse | null,
): OutlineSubmitState {
  const deadlineDisplay = getOutlineDeadlineDisplay(outline)

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
    return {
      canSubmit: false,
      reason: 'Đề tài đã bị đình chỉ, không thể nộp đề cương.',
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

  if (outline.currentStage !== 'STAGE_2_TOPIC_CONFIRMED') {
    return {
      canSubmit: false,
      reason: 'Cần hoàn thành chốt tên đề tài chính thức trước khi nộp đề cương.',
      deadlineDisplay,
    }
  }

  if (!outline.reviewerPublicId) {
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
