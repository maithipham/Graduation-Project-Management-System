// Type cho API chấm điểm hướng dẫn (SupervisorGradeController) – tương ứng DTO bên BE.
// Tài liệu: readme.md/lecturer/api_advisorGrading.md
// Ngày giờ ở các API này là ISO không múi giờ, vd "2026-11-17T10:00:00".

/** Trạng thái phiếu ở C1. `NOT_STARTED` = chưa có phiếu */
export type AdvisorGradeSheetStatus = 'NOT_STARTED' | 'DRAFT' | 'SUBMITTED'

/** Trạng thái của phiếu đã tạo (C2, C3, C5) */
export type AdvisorGradeSavedSheetStatus = Exclude<AdvisorGradeSheetStatus, 'NOT_STARTED'>

/**
 * Lý do không chấm / không sửa được. BE chỉ trả 1 lý do theo thứ tự ưu tiên.
 * Phiếu đã nộp KHÔNG còn là lý do chỉ xem (được nộp lại đến khi khóa chấm).
 */
export type AdvisorGradeReadonlyReason =
  | 'TOPIC_DISQUALIFIED'
  | 'TOPIC_CANCELLED'
  | 'TOPIC_NOT_READY'
  | 'GRADING_LOCKED'
  | 'TEMPLATE_NOT_ASSIGNED'

/**
 * Mốc Tổ chức hội đồng bảo vệ của ngành SV = thời điểm khóa chấm.
 * Đúng `endDate` vẫn sửa được (`locked = false`).
 */
export interface AdvisorGradeDeadline {
  startDate: string | null
  endDate: string
  /** `true` = đã qua `endDate`, không chấm / sửa điểm được nữa */
  locked: boolean
}

/** Một dòng ở C1 – đề tài GV đang đăng nhập là GVHD chính */
export interface AdvisorGradeTopic {
  topicPublicId: string
  topicName: string
  studentCode: string | null
  studentName: string | null
  className: string | null
  topicStatus: string
  currentStage: string
  sheetPublicId: string | null
  sheetStatus: AdvisorGradeSheetStatus
  gradedCount: number
  totalCriteria: number | null
  /** Chỉ có khi `SUBMITTED` */
  advisorScore: number | null
  /** Thời điểm khóa chấm (endDate mốc hội đồng của ngành SV). `null` = ngành chưa có mốc, chưa khóa */
  lockAt: string | null
  /** `true` = chấm / sửa được. Phiếu `SUBMITTED` chưa khóa vẫn `true` (nộp lại được) */
  canGrade: boolean
  readonlyReason: AdvisorGradeReadonlyReason | null
}

export interface AdvisorGradeSummary {
  notStarted: number
  draft: number
  submitted: number
}

/** C1 – `AdvisorGradeTopicListResponse` (không phân trang) */
export interface AdvisorGradeTopicList {
  semesterId: string
  summary: AdvisorGradeSummary
  items: AdvisorGradeTopic[]
}

export interface AdvisorGradeCriteria {
  publicId: string
  name: string
  displayOrder: number
  /** Trọng số (%). Tổng mọi tiêu chí = 100 */
  weight: number
  /** Đóng góp tối đa vào tổng = weight / 10 */
  maxScore: number
  /** Điểm GV nhập (0–10), `null` = chưa chấm */
  score: number | null
}

export interface AdvisorGradeGroup {
  publicId: string
  name: string
  displayOrder: number
  weight: number
  criteria: AdvisorGradeCriteria[]
}

export interface AdvisorGradeSheetTopic {
  publicId: string
  name: string
  status: string
  currentStage: string
}

export interface AdvisorGradeSheetStudent {
  studentCode: string
  fullName: string
  className: string
  majorName: string
}

export interface AdvisorGradeSheetEvaluator {
  teacherCode: string
  fullName: string
  academicTitle: string | null
  organization: string | null
}

/** C2, C3, C5 – `EvaluationSheetResponse` */
export interface AdvisorGradeSheet {
  sheetPublicId: string
  status: AdvisorGradeSavedSheetStatus
  topic: AdvisorGradeSheetTopic
  student: AdvisorGradeSheetStudent | null
  evaluator: AdvisorGradeSheetEvaluator
  template: { publicId: string; name: string }
  /** Đã sắp theo displayOrder (cả nhóm và tiêu chí) */
  groups: AdvisorGradeGroup[]
  generalComment: string | null
  gradedCount: number
  totalCriteria: number
  /** Chỉ có khi `SUBMITTED` */
  totalScore: number | null
  /** Điểm chính thức – chỉ có khi `SUBMITTED` */
  advisorScore: number | null
  /** Lần nộp gần nhất (nộp lại thì cập nhật), `null` khi Nháp */
  submittedAt: string | null
  updatedAt: string
  /** `null` = ngành chưa có mốc hội đồng hoặc mốc chưa có endDate (chưa khóa) */
  deadline: AdvisorGradeDeadline | null
  /** Phiếu `SUBMITTED` chưa khóa vẫn `true` (nộp lại được) */
  canEdit: boolean
  readonlyReason: AdvisorGradeReadonlyReason | null
}

export interface AdvisorGradeDetailBody {
  criteriaId: string
  score: number | null
}

/**
 * Body C4 (lưu nháp) / C5 (nộp). BE thay TOÀN BỘ điểm theo `details`:
 * tiêu chí thiếu hoặc `score: null` sẽ bị xóa điểm → luôn gửi đủ mọi tiêu chí.
 */
export interface AdvisorGradeSheetBody {
  generalComment: string | null
  details: AdvisorGradeDetailBody[]
}

/** Mã lỗi nghiệp vụ riêng của nhóm API chấm hướng dẫn */
export const ADVISOR_GRADE_ERROR_CODES = {
  SEMESTER_REQUIRED: 3022,
  SEMESTER_NOT_FOUND: 4041,
  THESIS_TOPIC_NOT_FOUND: 3049,
  SEMESTER_ADVISOR_TEMPLATE_NOT_ASSIGNED: 3116,
  EVALUATION_SHEET_NOT_FOUND: 3115,
  GRADING_TOPIC_NOT_ELIGIBLE: 3117,
  EVALUATION_SHEET_ALREADY_SUBMITTED: 3118,
  EVALUATION_SHEET_INCOMPLETE: 3119,
  EVALUATION_GENERAL_COMMENT_REQUIRED: 3120,
  EVALUATION_CRITERIA_NOT_IN_TEMPLATE: 3121,
  EVALUATION_CRITERIA_DUPLICATED: 3122,
  /** Đã qua endDate mốc Tổ chức hội đồng bảo vệ của ngành SV */
  ADVISOR_GRADING_LOCKED: 3128,
  /** Dùng chung cho nhiều lỗi validate – hiển thị theo `message` */
  VALIDATION: 4000,
} as const
