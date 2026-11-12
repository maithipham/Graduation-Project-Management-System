import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import { formatDate, parseDate, saveBlob } from '@/shared/utils'
import type {
  GuidingDeadlineStatus,
  GuidingEvaluationCounts,
  GuidingEvaluationItem,
  GuidingFinalReportDto,
  ProgressDeadlineDisplayInfo,
  ProgressDeadlineSnapshot,
  SubmitProgressReportPayload,
  SupervisorProgressListParams,
} from '../types/guidingEvaluation.types'
import { isEvaluationCompleted } from '../utils/guidingEvaluation.utils'

export const PROGRESS_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // Nhỏ hơn 10 MB
export const PROGRESS_ALLOWED_EXTENSIONS = ['doc', 'docx', 'pdf'] as const
const REPORT_DEADLINE_CODE = 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI'

interface RawDeadlineMilestone {
  code?: string | null
  templateCode?: string | null
  name?: string | null
  startDate?: string | null
  endDate?: string | null
  status?: string | null
  active?: boolean | null
}

interface RawDeadlinesGroupedResponse {
  thucHienDeadlines?: RawDeadlineMilestone[] | null
  stage2?: RawDeadlineMilestone[] | null
}

export function validateProgressFile(file: File | null | undefined): string | null {
  if (!file || file.size === 0 || !file.name.trim()) {
    return 'File tải lên không được để trống.'
  }
  const dotIndex = file.name.lastIndexOf('.')
  const extension = dotIndex > 0 ? file.name.slice(dotIndex + 1).toLowerCase() : ''
  if (
    !PROGRESS_ALLOWED_EXTENSIONS.includes(
      extension as (typeof PROGRESS_ALLOWED_EXTENSIONS)[number],
    )
  ) {
    return 'File tải lên chỉ nhận định dạng .doc, .docx hoặc .pdf.'
  }
  if (file.size >= PROGRESS_MAX_FILE_SIZE_BYTES) {
    return 'File tải lên phải nhỏ hơn 10MB.'
  }
  return null
}

export function isSafeProgressFileUrl(url?: string | null): boolean {
  if (!url) return false
  const trimmed = url.trim()
  return /^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')
}

export function extractProgressFileName(
  fileUrl?: string | null,
  fallback = 'Phiếu theo dõi tiến độ',
): string {
  if (!fileUrl) return fallback
  const withoutQuery = fileUrl.trim().split('?')[0].split('#')[0]
  const segments = withoutQuery.split('/').filter(Boolean)
  const rawName = segments[segments.length - 1]
  if (!rawName) return fileUrl
  try {
    return decodeURIComponent(rawName)
  } catch {
    return rawName
  }
}

export function getProgressFileExtensionLabel(fileUrl?: string | null): string {
  const name = extractProgressFileName(fileUrl, '')
  const dotIndex = name.lastIndexOf('.')
  if (dotIndex <= 0) return 'FILE'
  return name.slice(dotIndex + 1).toUpperCase()
}

export function isPdfProgressFileUrl(fileUrl?: string | null): boolean {
  if (!fileUrl) return false
  const cleanUrl = fileUrl.trim().split('?')[0].split('#')[0].toLowerCase()
  return cleanUrl.endsWith('.pdf')
}

export function mapFinalReportToGuidingItem(
  dto: GuidingFinalReportDto,
): GuidingEvaluationItem {
  const progressFileUrl = dto.progressReport?.progressFile ?? null
  return {
    id: dto.topicPublicId,
    publicId: dto.publicId,
    topicPublicId: dto.topicPublicId,
    name: dto.studentName,
    mssv: dto.studentCode,
    topic: dto.topicName,
    currentStage: dto.currentStage,
    topicStatus: dto.topicStatus,
    disqualificationReason: dto.disqualificationReason,
    lecturerName: dto.lecturerName,
    coLecturerName: dto.coLecturerName,
    finalReportFile: dto.finalReportFile,
    finalReportFileName: dto.finalReportFile
      ? extractProgressFileName(dto.finalReportFile, 'Báo cáo Final')
      : '',
    finalReportStatus: dto.status,
    finalReportStatusDescription: dto.statusDescription,
    finalReportSubmittedAt: dto.submittedAt,
    plagiarismRate: dto.plagiarismRate,
    plagiarismFile: dto.plagiarismFile,
    supervisorFeedback: dto.supervisorFeedback,
    reviewedAt: dto.reviewedAt,
    progressReport: dto.progressReport,
    fileName: progressFileUrl
      ? extractProgressFileName(progressFileUrl, 'Phiếu theo dõi tiến độ')
      : '',
    progressFileUrl,
    submittedAt: dto.progressReport?.submittedAt ?? null,
    supervisorName: dto.progressReport?.supervisorName ?? dto.lecturerName,
    supervisorNote: dto.progressReport?.supervisorNote ?? null,
    canSubmitProgressReport: dto.canSubmitProgressReport,
    canReview: dto.canReview,
    deadlineName: dto.deadlineName,
    deadlineStartDate: dto.deadlineStartDate,
    deadlineEndDate: dto.deadlineEndDate,
    deadlineActive: dto.deadlineActive,
    deadlineStatus: dto.deadlineStatus,
    score: null,
    rubricScores: null,
  }
}

export function canLecturerSubmitProgressReport(item: {
  canSubmitProgressReport: boolean
  topicStatus: string
  currentStage: string
  deadlineStatus: GuidingDeadlineStatus | null | undefined
}): boolean {
  const isDeadlineOpenForSupervisor =
    item.deadlineStatus === 'OPEN' || item.deadlineStatus === 'EXTENDED'

  return (
    item.canSubmitProgressReport === true &&
    item.topicStatus === 'IN_PROGRESS' &&
    item.currentStage === 'STAGE_4_REPORT_APPROVED' &&
    isDeadlineOpenForSupervisor
  )
}

export function getProgressUploadBlockedReason(item: {
  canSubmitProgressReport: boolean
  topicStatus: string
  currentStage: string
  deadlineStatus: GuidingDeadlineStatus | null | undefined
}): string | null {
  if (!item.canSubmitProgressReport) {
    return 'Đồng hướng dẫn (Chỉ xem)'
  }
  if (item.topicStatus !== 'IN_PROGRESS') {
    return 'Đề tài không ở trạng thái đang thực hiện'
  }
  if (item.currentStage !== 'STAGE_4_REPORT_APPROVED') {
    return 'Đề tài chưa đạt giai đoạn nộp phiếu theo dõi'
  }
  if (item.deadlineStatus === 'CLOSED') {
    return 'Đã hết hạn nộp phiếu theo dõi'
  }
  if (item.deadlineStatus === 'NOT_STARTED') {
    return 'Chưa tới thời gian mở'
  }
  if (
    !item.deadlineStatus ||
    item.deadlineStatus === 'NOT_CONFIGURED' ||
    item.deadlineStatus === 'INACTIVE'
  ) {
    return 'Chưa cấu hình thời hạn'
  }
  return null
}

export function formatProgressDeadlineForSupervisor(
  deadlineEndDate: string | null | undefined,
  deadlineStatus: GuidingDeadlineStatus | null | undefined,
  formatDateTime: (iso: string) => string = (iso) => formatDate(iso, 'full'),
  deadlineStartDate?: string | null,
): ProgressDeadlineDisplayInfo {
  if (
    !deadlineStatus ||
    deadlineStatus === 'NOT_CONFIGURED' ||
    deadlineStatus === 'INACTIVE' ||
    !deadlineEndDate
  ) {
    return {
      text: 'Chưa có',
      badgeText: null,
      canSubmitWindow: false,
      isExpired: false,
      isUnconfigured: true,
    }
  }

  const formattedEndDate = formatDateTime(deadlineEndDate)

  if (deadlineStatus === 'CLOSED') {
    return {
      text: `${formattedEndDate} (Đã hết hạn)`,
      badgeText: 'Đã hết hạn',
      canSubmitWindow: false,
      isExpired: true,
      isUnconfigured: false,
    }
  }

  if (deadlineStatus === 'NOT_STARTED') {
    const formattedStart = deadlineStartDate ? formatDateTime(deadlineStartDate) : ''
    return {
      text: formattedStart ? `${formattedStart} – ${formattedEndDate}` : formattedEndDate,
      badgeText: 'Chưa mở',
      canSubmitWindow: false,
      isExpired: false,
      isUnconfigured: false,
    }
  }

  return {
    text: formattedEndDate,
    badgeText: deadlineStatus === 'EXTENDED' ? 'Gia hạn chấm' : 'Đang mở',
    canSubmitWindow: true,
    isExpired: false,
    isUnconfigured: false,
  }
}

function mapRawMilestoneStatus(milestone: RawDeadlineMilestone): GuidingDeadlineStatus {
  if (milestone.active === false) return 'INACTIVE'
  const rawStatus = milestone.status
  if (!milestone.endDate) return 'NOT_CONFIGURED'
  if (rawStatus === 'COMPLETED') return 'CLOSED'
  if (rawStatus === 'NOT_STARTED') return 'NOT_STARTED'

  const now = Date.now()
  const start = parseDate(milestone.startDate)
  const end = parseDate(milestone.endDate)
  if (start && now < start.getTime()) return 'NOT_STARTED'
  if (end && now > end.getTime()) return 'CLOSED'
  if (rawStatus === 'EXTENDED') return 'EXTENDED'
  if (rawStatus === 'IN_PROGRESS') return 'OPEN'
  return 'NOT_CONFIGURED'
}

export async function downloadProgressFile(
  fileUrl: string,
  fallbackFilename: string,
): Promise<void> {
  if (!isSafeProgressFileUrl(fileUrl)) return
  try {
    const res = await fetch(fileUrl)
    if (!res.ok) throw new Error('Download failed')
    const blob = await res.blob()
    saveBlob({
      blob,
      filename: extractProgressFileName(fileUrl, fallbackFilename),
    })
  } catch {
    window.open(fileUrl, '_blank', 'noopener,noreferrer')
  }
}

export const guidingEvaluationService = {
  /** 1. Lấy danh sách SV hướng dẫn & trạng thái phiếu theo dõi tiến độ theo học kỳ */
  getSupervisorProgressReports: async (
    params?: SupervisorProgressListParams,
  ): Promise<GuidingFinalReportDto[]> => {
    const response = await apiClient.get<ApiResponse<GuidingFinalReportDto[]>>(
      API_ENDPOINTS.report.supervisorList,
      {
        params: {
          semesterId: params?.semesterId || undefined,
          status: params?.status || undefined,
        },
      },
    )
    return response.data.data ?? []
  },

  /** 2. Xem chi tiết Báo cáo Final (kèm lịch sử nộp & Phiếu theo dõi tiến độ) */
  getReportDetailForSupervisor: async (
    publicId: string,
  ): Promise<GuidingFinalReportDto> => {
    const response = await apiClient.get<ApiResponse<GuidingFinalReportDto>>(
      API_ENDPOINTS.report.detail(publicId),
    )
    return response.data.data
  },

  /** 3. GVHD chính nộp hoặc cập nhật Phiếu theo dõi tiến độ */
  submitProgressReport: async (
    payload: SubmitProgressReportPayload,
  ): Promise<void> => {
    const formData = new FormData()
    formData.append('topicPublicId', payload.topicPublicId)
    formData.append('file', payload.file)
    if (payload.supervisorNote?.trim()) {
      formData.append('supervisorNote', payload.supervisorNote.trim())
    }

    await apiClient.post<ApiResponse<null>>(
      API_ENDPOINTS.report.submitProgressReport,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        skipErrorToast: true,
      },
    )
  },

  /** 4. Fallback lấy deadline GĐ 4 khi danh sách supervisor-list rỗng */
  getFallbackProgressDeadline: async (
    semesterId: string,
  ): Promise<ProgressDeadlineSnapshot> => {
    const response = await apiClient.get<ApiResponse<RawDeadlinesGroupedResponse>>(
      API_ENDPOINTS.report.deadlines,
      {
        params: { semesterId },
        skipErrorToast: true,
      },
    )
    const grouped = response.data.data
    const stage2List = grouped?.stage2 ?? grouped?.thucHienDeadlines ?? []
    const milestone = stage2List.find(
      (item) => (item.templateCode ?? item.code) === REPORT_DEADLINE_CODE,
    )

    if (!milestone) {
      return {
        deadlineName: null,
        deadlineStartDate: null,
        deadlineEndDate: null,
        deadlineActive: null,
        deadlineStatus: 'NOT_CONFIGURED',
      }
    }

    return {
      deadlineName: milestone.name ?? null,
      deadlineStartDate: milestone.startDate ?? null,
      deadlineEndDate: milestone.endDate ?? null,
      deadlineActive: milestone.active ?? true,
      deadlineStatus: mapRawMilestoneStatus(milestone),
    }
  },

  getCounts: (items: GuidingEvaluationItem[]): GuidingEvaluationCounts => {
    const completed = items.filter(isEvaluationCompleted).length
    const all = items.length
    return {
      all,
      completed,
      incomplete: all - completed,
    }
  },
}
