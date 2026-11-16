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
export const PLAGIARISM_ALLOWED_EXTENSIONS = ['pdf'] as const // Bắt buộc PDF chuẩn
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
    return 'File báo cáo kiểm tra trùng lặp không được để trống.'
  }
  const dotIndex = file.name.lastIndexOf('.')
  const extension = dotIndex > 0 ? file.name.slice(dotIndex + 1).toLowerCase() : ''
  if (
    !PLAGIARISM_ALLOWED_EXTENSIONS.includes(
      extension as (typeof PLAGIARISM_ALLOWED_EXTENSIONS)[number],
    )
  ) {
    return 'File kiểm tra trùng lặp bắt buộc là định dạng .pdf (xuất từ Turnitin / KiểmTraTàiLiệu).'
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
  if (params.decision === 'APPROVED' && params.plagiarismRate > 35) {
    return 'Tỷ lệ đạo văn vượt quá 35%, không đủ điều kiện phê duyệt Đạt.'
  }
  return validatePlagiarismFile(params.plagiarismFile)
}

/**
 * Ánh xạ thông báo lỗi thân thiện cho GVHD khi Backend ném mã lỗi đối chiếu PDF
 * (Hỗ trợ cả mã chuỗi ErrorCode lẫn mã số + message Tiếng Việt từ Backend)
 */
export function mapPlagiarismReviewError(
  errorCode: string | number,
  backendMessage?: string,
): string {
  switch (errorCode) {
    case 'PLAGIARISM_SCORE_MISMATCH':
      return 'Số liệu không khớp! Tỷ lệ trùng lặp bạn nhập trên Form khác với kết quả ghi nhận trong file báo cáo PDF. Vui lòng kiểm tra lại tỷ lệ % đã gõ!'
    case 'PLAGIARISM_REPORT_STUDENT_ID_MISMATCH':
      return 'Cảnh báo nộp nhầm file! Báo cáo PDF có Mã sinh viên không khớp với sinh viên của đề tài đang duyệt. Vui lòng chọn đúng file của sinh viên này!'
    case 'PLAGIARISM_REPORT_STUDENT_ID_NOT_FOUND':
      return 'Không tìm thấy Mã sinh viên hợp lệ trong mục "Tên tài liệu" của file báo cáo PDF. Vui lòng kiểm tra file có quy chuẩn đặt tên Lop_MSV_HoTen!'
    case 'PLAGIARISM_RATE_EXCEEDED':
      return 'Tỷ lệ đạo văn trong file báo cáo vượt quá 35.0%. Không đủ điều kiện phê duyệt Đạt!'
    case 'PLAGIARISM_REPORT_INTERNAL_INCONSISTENCY':
      return 'Phát hiện bất thường trong file PDF: Điểm trùng lặp ở phần thông tin không khớp với biểu đồ tròn kết quả!'
    case 'PROGRESS_REPORT_NOT_SUBMITTED':
    case 3093:
      return 'Bạn chưa nộp Phiếu theo dõi tiến độ cho sinh viên này! Vui lòng nộp Phiếu theo dõi tiến độ trước khi thực hiện thẩm định báo cáo.'
    case 'AI_SERVICE_TIMEOUT':
      return 'Dịch vụ phân tích file scan gặp gián đoạn tạm thời. Vui lòng thử lại sau ít phút!'
    default:
      break
  }

  if (backendMessage) {
    const lower = backendMessage.toLowerCase()
    if (lower.includes('số liệu không khớp') || lower.includes('khác với kết quả trong file')) {
      return 'Số liệu không khớp! Tỷ lệ trùng lặp bạn nhập trên Form khác với kết quả ghi nhận trong file báo cáo PDF. Vui lòng kiểm tra lại tỷ lệ % đã gõ!'
    }
    if (lower.includes('mã sinh viên không khớp') || lower.includes('nhầm tài liệu')) {
      return 'Cảnh báo nộp nhầm file! Báo cáo PDF có Mã sinh viên không khớp với sinh viên của đề tài đang duyệt. Vui lòng chọn đúng file của sinh viên này!'
    }
    if (lower.includes('không tìm thấy mã sinh viên')) {
      return 'Không tìm thấy Mã sinh viên hợp lệ trong mục "Tên tài liệu" của file báo cáo PDF. Vui lòng kiểm tra file có quy chuẩn đặt tên Lop_MSV_HoTen!'
    }
    if (lower.includes('bất thường trong file pdf') || lower.includes('biểu đồ kết quả')) {
      return 'Phát hiện bất thường trong file PDF: Điểm trùng lặp ở phần thông tin không khớp với biểu đồ tròn kết quả!'
    }
    if (lower.includes('phiếu theo dõi tiến độ')) {
      return 'Bạn chưa nộp Phiếu theo dõi tiến độ cho sinh viên này! Vui lòng nộp Phiếu theo dõi tiến độ trước khi thực hiện thẩm định báo cáo.'
    }
    if (lower.includes('ai timeout')) {
      return 'Dịch vụ phân tích file scan gặp gián đoạn tạm thời. Vui lòng thử lại sau ít phút!'
    }
    return backendMessage
  }

  return 'Thẩm định báo cáo thất bại. Vui lòng thử lại!'
}

export interface ResolvedPlagiarismReviewError {
  field: 'plagiarismRate' | 'plagiarismFile' | 'decision' | 'root'
  message: string
  isStudentMismatch: boolean
  isMissingProgressReport: boolean
}

export function resolvePlagiarismReviewError(
  errorCode: string | number,
  backendMessage?: string,
): ResolvedPlagiarismReviewError {
  const message = mapPlagiarismReviewError(errorCode, backendMessage)
  const lower = (backendMessage ?? message).toLowerCase()

  // 1. Lỗi thiếu Phiếu theo dõi tiến độ (3093 - PROGRESS_REPORT_NOT_SUBMITTED)
  if (
    errorCode === 3093 ||
    errorCode === 'PROGRESS_REPORT_NOT_SUBMITTED' ||
    lower.includes('phiếu theo dõi tiến độ')
  ) {
    return {
      field: 'root',
      message,
      isStudentMismatch: false,
      isMissingProgressReport: true,
    }
  }

  // 2. Lỗi nộp nhầm file của sinh viên khác (PLAGIARISM_REPORT_STUDENT_ID_MISMATCH)
  if (
    errorCode === 'PLAGIARISM_REPORT_STUDENT_ID_MISMATCH' ||
    lower.includes('mã sinh viên không khớp') ||
    lower.includes('nhầm tài liệu') ||
    lower.includes('nộp nhầm file')
  ) {
    return {
      field: 'plagiarismFile',
      message,
      isStudentMismatch: true,
      isMissingProgressReport: false,
    }
  }

  // 3. Lỗi lệch số liệu nhập với số liệu trong PDF (PLAGIARISM_SCORE_MISMATCH)
  if (
    errorCode === 'PLAGIARISM_SCORE_MISMATCH' ||
    lower.includes('số liệu không khớp') ||
    lower.includes('khác với kết quả')
  ) {
    return {
      field: 'plagiarismRate',
      message,
      isStudentMismatch: false,
      isMissingProgressReport: false,
    }
  }

  // 4. Các lỗi thuộc về cấu trúc / nội dung file PDF báo cáo trùng lặp
  if (
    errorCode === 'PLAGIARISM_REPORT_STUDENT_ID_NOT_FOUND' ||
    errorCode === 'PLAGIARISM_REPORT_DATA_NOT_FOUND' ||
    errorCode === 'PLAGIARISM_REPORT_INTERNAL_INCONSISTENCY' ||
    errorCode === 'PLAGIARISM_REPORT_FILE_REQUIRED' ||
    errorCode === 'PDF_FILE_EMPTY' ||
    lower.includes('không tìm thấy mã sinh viên') ||
    lower.includes('trang 1 của tài liệu') ||
    lower.includes('bất thường trong file pdf') ||
    lower.includes('biểu đồ') ||
    lower.includes('file') ||
    lower.includes('tệp') ||
    lower.includes('pdf') ||
    lower.includes('10mb')
  ) {
    return {
      field: 'plagiarismFile',
      message,
      isStudentMismatch: false,
      isMissingProgressReport: false,
    }
  }

  // 5. Các lỗi thuộc về tỷ lệ đạo văn (PLAGIARISM_RATE_REQUIRED / INVALID / EXCEEDED)
  if (
    errorCode === 'PLAGIARISM_RATE_EXCEEDED' ||
    errorCode === 'PLAGIARISM_RATE_REQUIRED' ||
    errorCode === 'PLAGIARISM_RATE_INVALID' ||
    lower.includes('đạo văn') ||
    lower.includes('tỷ lệ') ||
    lower.includes('vượt quá 35')
  ) {
    return {
      field: 'plagiarismRate',
      message,
      isStudentMismatch: false,
      isMissingProgressReport: false,
    }
  }

  // 6. Các lỗi thuộc về quyết định thẩm định (decision)
  if (
    lower.includes('quyết định') ||
    lower.includes('kết quả thẩm định') ||
    lower.includes('trong thời gian nhận bài') ||
    lower.includes('trong thời gian gia hạn chấm') ||
    lower.includes('approved') ||
    lower.includes('request_changes') ||
    lower.includes('rejected')
  ) {
    return {
      field: 'decision',
      message,
      isStudentMismatch: false,
      isMissingProgressReport: false,
    }
  }

  return {
    field: 'root',
    message,
    isStudentMismatch: false,
    isMissingProgressReport: false,
  }
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
