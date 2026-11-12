import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import { formatDate, parseDate, saveBlob } from '@/shared/utils'
import type {
  FinalReportDecision,
  FinalReportStatus,
  ReportCheckCounts,
  ReportCheckItem,
  ReportDeadlineSnapshot,
  ReportDeadlineStatus,
  ReportStatus,
  ReviewFinalReportPayload,
  SupervisorReportDeadlineInfo,
  SupervisorReportListParams,
  ThesisFinalReportResponse,
} from '../types/reportCheck.types'

export const PLAGIARISM_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // Nhỏ hơn 10 MB
export const PLAGIARISM_ALLOWED_EXTENSIONS = ['doc', 'docx', 'pdf'] as const
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

export function validatePlagiarismFile(file: File | null | undefined): string | null {
  if (!file || file.size === 0 || !file.name.trim()) {
    return 'File tải lên không được để trống.'
  }
  const dotIndex = file.name.lastIndexOf('.')
  const extension = dotIndex > 0 ? file.name.slice(dotIndex + 1).toLowerCase() : ''
  if (
    !PLAGIARISM_ALLOWED_EXTENSIONS.includes(
      extension as (typeof PLAGIARISM_ALLOWED_EXTENSIONS)[number],
    )
  ) {
    return 'File tải lên chỉ nhận định dạng .doc, .docx hoặc .pdf.'
  }
  if (file.size >= PLAGIARISM_MAX_FILE_SIZE_BYTES) {
    return 'File tải lên phải nhỏ hơn 10MB.'
  }
  return null
}

export function validateReviewForm(params: {
  plagiarismRate: number | null | undefined
  plagiarismFile: File | null | undefined
  decision: FinalReportDecision | null | undefined
}): string | null {
  if (!params.decision) {
    return 'Vui lòng chọn kết quả thẩm định báo cáo.'
  }
  if (
    params.plagiarismRate === null ||
    params.plagiarismRate === undefined ||
    Number.isNaN(params.plagiarismRate)
  ) {
    return 'Vui lòng nhập tỷ lệ đạo văn.'
  }
  if (params.plagiarismRate < 0 || params.plagiarismRate > 100) {
    return 'Tỷ lệ đạo văn phải nằm trong khoảng 0% đến 100%.'
  }
  return validatePlagiarismFile(params.plagiarismFile)
}

export function isSafeReportFileUrl(url?: string | null): boolean {
  if (!url) return false
  const trimmed = url.trim()
  return /^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')
}

export function extractReportFileName(
  fileUrl?: string | null,
  fallback = 'Tệp đính kèm',
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

export function getFileExtensionLabel(fileUrl?: string | null): string {
  const name = extractReportFileName(fileUrl, '')
  const dotIndex = name.lastIndexOf('.')
  if (dotIndex <= 0) return 'FILE'
  return name.slice(dotIndex + 1).toUpperCase()
}

export function isPdfFileUrl(fileUrl?: string | null): boolean {
  if (!fileUrl) return false
  const cleanUrl = fileUrl.trim().split('?')[0].split('#')[0].toLowerCase()
  return cleanUrl.endsWith('.pdf')
}

export function mapApiStatusToUiStatus(
  publicId: string | null,
  status: FinalReportStatus | null,
): ReportStatus {
  if (!publicId || !status) return 'not_submitted'
  switch (status) {
    case 'APPROVED':
      return 'approved'
    case 'REQUEST_CHANGES':
      return 'request_changes'
    case 'REJECTED':
      return 'rejected'
    case 'PENDING':
    default:
      return 'pending'
  }
}

export function mapFinalReportToCheckItem(
  dto: ThesisFinalReportResponse,
): ReportCheckItem {
  return {
    id: dto.publicId ?? dto.topicPublicId,
    publicId: dto.publicId,
    topicPublicId: dto.topicPublicId,
    mssv: dto.studentCode,
    name: dto.studentName,
    topic: dto.topicName,
    currentStage: dto.currentStage,
    topicStatus: dto.topicStatus,
    disqualificationReason: dto.disqualificationReason,
    lecturerName: dto.lecturerName,
    coLecturerName: dto.coLecturerName,
    reportFileName: dto.finalReportFile
      ? extractReportFileName(dto.finalReportFile, 'Báo cáo Final')
      : '',
    reportFileUrl: dto.finalReportFile,
    reportSubmittedAt: dto.submittedAt,
    reviewedAt: dto.reviewedAt,
    status: mapApiStatusToUiStatus(dto.publicId, dto.status),
    apiStatus: dto.status,
    statusDescription: dto.statusDescription,
    plagiarismFile: dto.plagiarismFile
      ? extractReportFileName(dto.plagiarismFile, 'Kết quả kiểm tra trùng lặp')
      : '',
    plagiarismFileUrl: dto.plagiarismFile,
    plagiarismRate: dto.plagiarismRate,
    comment: dto.supervisorFeedback,
    progressReport: dto.progressReport,
    canSubmitProgressReport: dto.canSubmitProgressReport,
    canReview: dto.canReview,
    deadlineName: dto.deadlineName,
    deadlineStartDate: dto.deadlineStartDate,
    deadlineEndDate: dto.deadlineEndDate,
    deadlineActive: dto.deadlineActive,
    deadlineStatus: dto.deadlineStatus,
  }
}

export function canReviewFinalReport(item: {
  canReview: boolean
  publicId: string | null
  apiStatus?: FinalReportStatus | null
  status?: FinalReportStatus | ReportStatus | null
  topicStatus: string
  progressReport: unknown
  deadlineStatus: ReportDeadlineStatus | null | undefined
}): boolean {
  const isReviewWindowOpen =
    item.deadlineStatus === 'OPEN' || item.deadlineStatus === 'EXTENDED'
  const isPending =
    item.apiStatus !== undefined
      ? item.apiStatus === 'PENDING'
      : item.status === 'PENDING'

  return (
    item.canReview === true &&
    item.publicId !== null &&
    isPending &&
    item.topicStatus === 'IN_PROGRESS' &&
    item.progressReport !== null &&
    isReviewWindowOpen
  )
}

export function getReviewBlockedReason(item: ReportCheckItem): string | null {
  if (!item.canReview) {
    return 'Đồng hướng dẫn (Chỉ xem)'
  }
  if (!item.publicId || item.apiStatus !== 'PENDING') {
    return null
  }
  if (item.topicStatus !== 'IN_PROGRESS') {
    return 'Đề tài không ở trạng thái đang thực hiện'
  }
  if (item.progressReport === null) {
    return 'Chưa nộp phiếu theo dõi tiến độ'
  }
  if (item.deadlineStatus === 'CLOSED') {
    return 'Đã hết hạn thẩm định'
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

export function getAllowedReviewDecisions(
  deadlineStatus: ReportDeadlineStatus | null | undefined,
): FinalReportDecision[] {
  if (deadlineStatus === 'OPEN') return ['APPROVED', 'REQUEST_CHANGES']
  if (deadlineStatus === 'EXTENDED') return ['APPROVED', 'REJECTED']
  return []
}

export function formatReportDeadlineForReview(
  deadlineEndDate: string | null | undefined,
  deadlineStatus: ReportDeadlineStatus | null | undefined,
  formatDateTime: (iso: string) => string = (iso) => formatDate(iso, 'full'),
  deadlineStartDate?: string | null,
): SupervisorReportDeadlineInfo {
  if (
    !deadlineStatus ||
    deadlineStatus === 'NOT_CONFIGURED' ||
    deadlineStatus === 'INACTIVE' ||
    !deadlineEndDate
  ) {
    return {
      text: 'Chưa có',
      badgeText: null,
      isExpired: false,
      isUnconfigured: true,
      canReviewWindow: false,
      allowedDecisions: [],
    }
  }

  const formattedEndDate = formatDateTime(deadlineEndDate)

  if (deadlineStatus === 'CLOSED') {
    return {
      text: `${formattedEndDate} (Đã hết hạn)`,
      badgeText: 'Đã hết hạn',
      isExpired: true,
      isUnconfigured: false,
      canReviewWindow: false,
      allowedDecisions: [],
    }
  }

  if (deadlineStatus === 'NOT_STARTED') {
    const formattedStart = deadlineStartDate ? formatDateTime(deadlineStartDate) : ''
    return {
      text: formattedStart ? `${formattedStart} – ${formattedEndDate}` : formattedEndDate,
      badgeText: 'Chưa mở',
      isExpired: false,
      isUnconfigured: false,
      canReviewWindow: false,
      allowedDecisions: [],
    }
  }

  if (deadlineStatus === 'EXTENDED') {
    return {
      text: `${formattedEndDate} (Gia hạn chấm)`,
      badgeText: 'Gia hạn chấm',
      isExpired: false,
      isUnconfigured: false,
      canReviewWindow: true,
      allowedDecisions: ['APPROVED', 'REJECTED'],
    }
  }

  return {
    text: formattedEndDate,
    badgeText: 'Đang mở',
    isExpired: false,
    isUnconfigured: false,
    canReviewWindow: true,
    allowedDecisions: ['APPROVED', 'REQUEST_CHANGES'],
  }
}

function mapRawMilestoneStatus(milestone: RawDeadlineMilestone): ReportDeadlineStatus {
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

export async function downloadReportFile(
  fileUrl: string,
  fallbackFilename: string,
): Promise<void> {
  if (!isSafeReportFileUrl(fileUrl)) return
  try {
    const res = await fetch(fileUrl)
    if (!res.ok) throw new Error('Download failed')
    const blob = await res.blob()
    saveBlob({
      blob,
      filename: extractReportFileName(fileUrl, fallbackFilename),
    })
  } catch {
    // Nếu Cloudinary/CDN chặn fetch trực tiếp theo CORS → mở tab mới để trình duyệt tải/xem
    window.open(fileUrl, '_blank', 'noopener,noreferrer')
  }
}

export const reportCheckService = {
  /** 1. Lấy danh sách báo cáo của sinh viên hướng dẫn theo học kỳ & trạng thái */
  getSupervisorFinalReports: async (
    params?: SupervisorReportListParams,
  ): Promise<ThesisFinalReportResponse[]> => {
    const response = await apiClient.get<ApiResponse<ThesisFinalReportResponse[]>>(
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

  /** 2. Xem chi tiết Báo cáo Final (kèm histories & progressReport) */
  getFinalReportDetailForSupervisor: async (
    publicId: string,
  ): Promise<ThesisFinalReportResponse> => {
    const response = await apiClient.get<ApiResponse<ThesisFinalReportResponse>>(
      API_ENDPOINTS.report.detail(publicId),
    )
    return response.data.data
  },

  /** 3. GVHD chính nộp file kiểm tra trùng lặp và duyệt / yêu cầu sửa / từ chối báo cáo */
  reviewStudentFinalReport: async (
    params: ReviewFinalReportPayload,
  ): Promise<void> => {
    const formData = new FormData()
    formData.append('plagiarismRate', String(params.plagiarismRate))
    formData.append('plagiarismFile', params.plagiarismFile)
    formData.append('decision', params.decision)
    if (params.feedback?.trim()) {
      formData.append('feedback', params.feedback.trim())
    }

    await apiClient.put<ApiResponse<null>>(
      API_ENDPOINTS.report.review(params.publicId),
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        skipErrorToast: true,
      },
    )
  },

  /** 4. Fallback lấy deadline GĐ 4 khi danh sách supervisor-list rỗng */
  getFallbackReportDeadline: async (
    semesterId: string,
  ): Promise<ReportDeadlineSnapshot> => {
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

  getCounts: (items: ReportCheckItem[]): ReportCheckCounts => {
    let pending = 0
    let rejected = 0
    let notSubmitted = 0
    let approved = 0

    for (const r of items) {
      if (r.status === 'pending') pending++
      else if (r.status === 'rejected' || r.status === 'request_changes') rejected++
      else if (r.status === 'not_submitted') notSubmitted++
      else if (r.status === 'approved') approved++
    }

    return {
      pending,
      rejected,
      notSubmitted,
      approved,
      all: items.length,
    }
  },
}
