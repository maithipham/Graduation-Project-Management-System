export type CouncilMemberRole = 'CHAIRPERSON' | 'SECRETARY' | 'COUNCIL_MEMBER'
export type CouncilStatus = 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED'
export type DefenseStatus =
  | 'ASSIGNED_TO_COUNCIL'
  | 'FAILED_REVIEW'
  | 'READY_FOR_DEFENSE'
  | 'SCHEDULED'
  | 'COMPLETED'
export type ExaminerDecision = 'PENDING' | 'APPROVED' | 'REJECTED'
export type ScheduleBlockedReason =
  | 'NO_PERMISSION'
  | 'COUNCIL_NOT_PUBLISHED'
  | 'DEADLINE_NOT_CONFIGURED'
export type EvaluationSheetStatus = 'DRAFT' | 'SUBMITTED'
export type ThesisStage =
  | 'STAGE_1_REGISTERING_ADVISOR'
  | 'STAGE_1_ADVISOR_ASSIGNED'
  | 'STAGE_2_TOPIC_CONFIRMED'
  | 'STAGE_3_OUTLINE_APPROVED'
  | 'STAGE_4_REPORT_APPROVED'
  | 'STAGE_5_REVIEW_PASSED'
  | 'STAGE_6_DEFENSE_COMPLETED'

// GET /defense-council/my
export interface MyCouncil {
  councilPublicId: string
  code: string
  name: string
  semesterPublicId: string
  semesterName: string
  majorCode: string
  majorName: string
  location: string | null
  defenseStartTime: string | null // LocalDateTime ISO
  defenseEndTime: string | null
  status: CouncilStatus
  myRole: CouncilMemberRole
  studentCount: number
}

// DefenseCouncilResponse.MemberDetailDto (record Java)
export interface CouncilMember {
  memberPublicId: string // gửi vào councilMemberPublicId1/2
  teacherId: number
  teacherCode: string | null
  fullName: string
  academicTitle: string
  departmentName: string | null
  role: CouncilMemberRole
}

export interface ExaminerSlot {
  examinerAssignmentPublicId: string
  examinerOrder: number // 1 hoặc 2
  councilMemberPublicId: string
  teacherCode: string | null
  fullName: string
  academicTitle: string | null
  councilRole: CouncilMemberRole
  decision: ExaminerDecision
  decidedAt: string | null
  sheetStatus: EvaluationSheetStatus | null // null = chưa chấm
  sheetScore: number | null // điểm phiếu đã nộp, làm tròn 1 chữ số
  reviewDate: string | null // "2026-12-01"
  reviewStartTime: string | null // "08:00"
  reviewEndTime: string | null
  reviewLocation: string | null
  reviewNote: string | null
  scheduledAt: string | null
  reviewFileUrl: string | null
  reviewFileName: string | null
}

export interface CouncilStudentExaminer {
  defenseAssignmentPublicId: string
  thesisTopicPublicId: string
  studentCode: string
  studentName: string
  className: string | null
  topicName: string | null
  supervisorName: string | null
  coSupervisorName: string | null
  ineligibleMemberPublicIds: string[] // thành viên là GVHD/đồng GVHD → không được chọn làm GVPB
  defenseStatus: DefenseStatus
  currentStage: ThesisStage
  examinerScore: number | null // TB 2 phiếu, null = chưa đủ 2 phiếu
  examinerPassed: boolean | null // null = chưa có kết quả
  canAssignExaminers: boolean
  examiners: ExaminerSlot[] // 0..2 phần tử, sắp theo examinerOrder
}

// GET /defense-council/{id}/examiner
export interface CouncilExaminerBoard {
  councilPublicId: string
  code: string
  name: string
  majorName: string
  location: string | null
  defenseStartTime: string | null
  defenseEndTime: string | null
  status: CouncilStatus
  myRole: CouncilMemberRole
  canAssignExaminers: boolean
  members: CouncilMember[]
  students: CouncilStudentExaminer[]
}

export interface AssignExaminersRequest {
  councilMemberPublicId1: string
  councilMemberPublicId2: string
}

// GET /examiner-assignment/my
export interface MyExaminerAssignment {
  examinerAssignmentPublicId: string
  examinerOrder: number
  councilPublicId: string
  councilCode: string
  councilName: string
  semesterPublicId: string
  defenseAssignmentPublicId: string
  thesisTopicPublicId: string
  studentCode: string
  studentName: string
  className: string | null
  topicName: string | null
  defenseStatus: DefenseStatus
  decision: ExaminerDecision // của chính GVPB đang đăng nhập
  decidedAt: string | null
  sheetStatus: EvaluationSheetStatus | null
  sheetScore: number | null
  examinerScore: number | null // kết quả chung của sinh viên
  examinerPassed: boolean | null
  reviewDate: string | null
  reviewStartTime: string | null
  reviewEndTime: string | null
  reviewLocation: string | null
  reviewNote: string | null
  scheduledAt: string | null
  reviewFileUrl: string | null
  reviewFileName: string | null
  coExaminer: ExaminerSlot | null // GVPB còn lại
  scheduleStartAt: string | null // khung tạo lịch = mốc GVPB_NOP_BAN_MEM_NHAN_XET
  scheduleEndAt: string | null
  scheduleOpen: boolean
  gradingStartAt: string | null // khung chấm/quyết định
  gradingCloseAt: string | null // 00:00 của (ngày bảo vệ − 2 ngày), không bao gồm
  gradingOpen: boolean
  editable: boolean // false khi SV đã xếp ca / hoàn tất / bị đình chỉ
}

export interface ScheduleExaminerReviewRequest {
  reviewDate: string // "yyyy-MM-dd"
  reviewStartTime: string // "HH:mm"
  reviewEndTime: string // "HH:mm"
  reviewLocation: string // bắt buộc, ≤ 255 ký tự
  reviewNote?: string | null
}

// Rubric + phiếu (score_config EvaluationSheetDetailResponse)
export interface RubricCriteria {
  criteriaPublicId: string
  name: string
  displayOrder: number
  weight: number // %
  score: number | null // điểm đã chấm (0–10)
}

export interface RubricGroup {
  groupPublicId: string
  name: string
  displayOrder: number
  criteria: RubricCriteria[]
}

export interface EvaluationSheetDetail {
  templatePublicId: string
  templateName: string
  type: 'ADVISOR' | 'EXAMINER' | 'COUNCIL'
  sheetPublicId: string | null // null = chưa lưu lần nào
  status: EvaluationSheetStatus | null
  generalComment: string | null
  totalScore: number | null // chưa làm tròn, null khi nháp
  roundedTotalScore: number | null
  submittedAt: string | null
  updatedAt: string | null
  groups: RubricGroup[]
}

// GET /examiner-assignment/{id}/evaluation
export interface ExaminerEvaluation {
  examinerAssignmentPublicId: string
  examinerOrder: number
  councilCode: string
  studentCode: string
  studentName: string
  topicName: string | null
  defenseStatus: DefenseStatus
  decision: ExaminerDecision
  decidedAt: string | null
  question1: string | null
  question2: string | null
  reviewFileUrl: string | null
  reviewFileName: string | null
  examinerScore: number | null
  examinerPassed: boolean | null
  gradingStartAt: string | null
  gradingCloseAt: string | null
  gradingOpen: boolean
  editable: boolean
  defenseEditing: boolean // trong buổi bảo vệ: chỉ sửa điểm + nộp lại, không đổi quyết định / câu hỏi / file
  sheet: EvaluationSheetDetail
}

export interface ExaminerEvaluationRequest {
  criteriaScores: { criteriaPublicId: string; score: number | null }[]
  generalComment: string | null
  question1: string | null
  question2: string | null
  decision: 'APPROVED' | 'REJECTED' | null // null = giữ nguyên quyết định cũ; KHÔNG gửi 'PENDING'
  submit: boolean // false = Lưu nháp, true = Lưu chính thức
}

// =========================================================================
// BƯỚC 13: Lịch bảo vệ Hội đồng (Chủ tịch / Thư ký xếp ca bảo vệ)
// =========================================================================

export interface DefenseSlot {
  defenseAssignmentPublicId: string
  thesisTopicPublicId: string
  studentCode: string
  studentName: string
  className: string | null
  topicName: string | null
  supervisorName: string | null
  coSupervisorName: string | null
  defenseStatus: DefenseStatus
  currentStage: ThesisStage
  examinerScore: number | null
  slotOrder: number | null
  defenseStartTime: string | null // ISO "yyyy-MM-ddTHH:mm:ss"
  defenseEndTime: string | null // ISO "yyyy-MM-ddTHH:mm:ss"
  room: string | null
  scheduledAt: string | null
  scheduledByName: string | null
  canSchedule: boolean
  canUnschedule: boolean
}

export interface CouncilDefenseSchedule {
  councilPublicId: string
  code: string
  name: string
  majorName: string
  location: string | null
  status: CouncilStatus
  defenseStartTime: string | null
  defenseEndTime: string | null
  deadlineStartAt: string | null
  deadlineEndAt: string | null
  myRole: CouncilMemberRole
  canSchedule: boolean
  // Lý do không xếp được ca (null khi canSchedule = true)
  scheduleBlockedReason: ScheduleBlockedReason | null
  students: DefenseSlot[]
}

export interface ScheduleDefenseSlotRequest {
  slotOrder: number
  defenseStartTime: string // ISO "yyyy-MM-ddTHH:mm:ss"
  defenseEndTime: string // ISO "yyyy-MM-ddTHH:mm:ss"
  room?: string | null
}

// Bảng mã lỗi Bước 13 (3138 - 3145)
export const DEFENSE_SCHEDULE_ERROR_MAP: Record<number, string> = {
  3138: 'Chỉ được xếp ca bảo vệ cho sinh viên đã đạt phản biện (Đủ điều kiện bảo vệ hoặc Đã xếp ca)',
  3139: 'Thời gian bắt đầu ca bảo vệ phải trước thời gian kết thúc',
  3140: 'Ca bảo vệ phải nằm trong mốc Thời gian tổ chức Hội đồng bảo vệ ĐATN',
  3141: 'Ca bảo vệ phải nằm trong khung lịch bảo vệ của Hội đồng',
  3142: 'Ca bảo vệ bị chồng lấn thời gian với ca của sinh viên khác trong Hội đồng',
  3143: 'Số thứ tự ca bảo vệ đã được dùng cho sinh viên khác trong Hội đồng',
  3144: 'Sinh viên chưa được xếp ca bảo vệ',
  3145: 'Chưa nhập phòng bảo vệ và Hội đồng chưa có địa điểm mặc định',
}

// =========================================================================
// BƯỚC 14: Chấm điểm Hội đồng, bảng điểm realtime, biên bản, hoàn tất bảo vệ
// =========================================================================

export type DefenseMinutesStatus = 'DRAFT' | 'FINALIZED'
export type ScoreEntryStatus = 'NOT_STARTED' | 'DRAFT' | 'SUBMITTED'
export type DefenseScoreResult = 'PENDING' | 'PASSED' | 'FAILED'
// Bước xét điểm không hợp lệ: COUNCIL (B1) → EXAMINER (B2) → ADVISOR (B3)
export type DefenseScoreGroup = 'COUNCIL' | 'EXAMINER' | 'ADVISOR'
export type RevisionStatus =
  | 'REQUIRED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'RETURNED'
  | 'OVERDUE'

// GET /defense-council/{councilPublicId}/council-evaluation – 1 sinh viên
export interface CouncilGradingItem {
  defenseAssignmentPublicId: string
  studentCode: string
  studentName: string
  className: string | null
  topicName: string | null
  supervisorName: string | null
  defenseStatus: DefenseStatus
  slotOrder: number | null
  defenseStartTime: string | null
  defenseEndTime: string | null
  room: string | null
  mySheetStatus: EvaluationSheetStatus | null // null = chưa chấm
  myScore: number | null // điểm phiếu của tôi đã nộp (làm tròn 1 chữ số)
  reportFileUrl: string | null // Báo cáo Final của sinh viên
  minutesStatus: DefenseMinutesStatus | null // null = Thư ký chưa lập
  editable: boolean
}

export interface CouncilGradingBoard {
  councilPublicId: string
  councilCode: string
  councilName: string
  majorName: string
  location: string | null
  status: CouncilStatus
  myRole: CouncilMemberRole
  myName: string
  gradingStartAt: string | null // mốc TO_CHUC_HOI_DONG_BAO_VE
  gradingEndAt: string | null
  gradingOpen: boolean
  canViewMinutes: boolean
  canEditMinutes: boolean
  canCompleteDefense: boolean
  canViewAllScores: boolean
  students: CouncilGradingItem[]
}

// GET /defense-assignment/{id}/council-evaluation
export interface CouncilEvaluation {
  defenseAssignmentPublicId: string
  councilPublicId: string
  councilCode: string
  myRole: CouncilMemberRole
  studentCode: string
  studentName: string
  topicName: string | null
  defenseStatus: DefenseStatus
  slotOrder: number | null
  defenseStartTime: string | null
  defenseEndTime: string | null
  room: string | null
  gradingStartAt: string | null
  gradingEndAt: string | null
  gradingOpen: boolean
  editable: boolean
  sheet: EvaluationSheetDetail
}

export interface CouncilEvaluationRequest {
  criteriaScores: { criteriaPublicId: string; score: number | null }[]
  generalComment: string | null
  submit: boolean // false = Lưu nháp, true = Lưu & gửi chính thức
}

// 1 đầu điểm trên bảng điểm (GVHD / GVPB / thành viên HĐ). Trường không có giá trị thì BE bỏ khỏi JSON.
export interface DefenseScoreEntry {
  order?: number // GVPB 1, 2
  role?: CouncilMemberRole // thành viên HĐ
  teacherName: string
  score?: number // chỉ có khi SUBMITTED và người xem được thấy
  status: ScoreEntryStatus
  deviated?: boolean // true = lệch >= 1.5: chỉ cảnh báo, điểm vẫn được tính
  deviation?: number
  deviationStep?: DefenseScoreGroup
  mine?: boolean
}

// GET /defense-score/{id} và payload WebSocket
export interface DefenseScoreBoard {
  defenseAssignmentPublicId: string
  version: number
  updatedAt: string
  defenseStatus: DefenseStatus
  advisor: DefenseScoreEntry | null
  coAdvisor: DefenseScoreEntry | null // GV đồng hướng dẫn (null nếu không có)
  examiners: DefenseScoreEntry[]
  council: DefenseScoreEntry[]
  submittedCouncilCount: number
  councilScore: number | null
  finalScore: number | null
  result: DefenseScoreResult | null // null khi bị ẩn (Ủy viên, chưa đủ 5/5)
  hasDeviation: boolean // có điểm lệch >= 1.5 (chỉ cảnh báo, vẫn được Hoàn tất bảo vệ)
  scoreHidden: boolean
}

// POST /defense-assignment/{id}/defense-score/trial – bảng thử điểm của Chủ tịch / Thư ký (không lưu)
export interface DefenseScoreTrialRequest {
  advisorScores: number[] // GVHD chính, rồi GV đồng hướng dẫn (nếu có)
  examinerScores: number[] // GVPB 1, 2
  councilScores: number[] // 5 thành viên Hội đồng
}

export interface DefenseScoreTrialEntry {
  score: number
  deviated: boolean | null
  deviation: number | null
}

export interface DefenseScoreTrialResult {
  advisors: DefenseScoreTrialEntry[]
  examiners: DefenseScoreTrialEntry[]
  council: DefenseScoreTrialEntry[]
  advisorScore: number
  examinerScore: number
  councilScore: number
  finalScore: number
  result: DefenseScoreResult
  hasDeviation: boolean
}

// GET /defense-council/{councilPublicId}/defense-score
export interface CouncilScoreSummaryItem {
  defenseAssignmentPublicId: string
  studentCode: string
  studentName: string
  className: string | null
  topicName: string | null
  supervisorName: string | null
  minutesStatus: DefenseMinutesStatus | null
  revisionRequired: boolean | null
  revisionPublicId: string | null
  revisionStatus: RevisionStatus | null // null = không yêu cầu chỉnh sửa
  board: DefenseScoreBoard
}

// GET /defense-assignment/{id}/defense-minutes
export interface DefenseMinutes {
  defenseAssignmentPublicId: string
  councilCode: string
  studentCode: string
  studentName: string
  topicName: string | null
  defenseStatus: DefenseStatus
  councilName: string | null
  councilLocation: string | null
  className: string | null
  supervisorName: string | null
  supervisorEmail: string | null
  slotOrder: number | null
  defenseStartTime: string | null
  defenseEndTime: string | null
  room: string | null
  minutesPublicId: string | null // null = chưa lập biên bản
  secretaryName: string | null
  presentationSummary: string | null
  qaContent: string | null
  councilConclusion: string | null
  revisionRequired: boolean | null
  revisionRequirement: string | null
  status: DefenseMinutesStatus | null
  finalizedAt: string | null
  updatedAt: string | null
  editable: boolean
}

export interface DefenseMinutesRequest {
  presentationSummary: string | null
  qaContent: string | null
  councilConclusion: string | null
  revisionRequired: boolean | null
  revisionRequirement: string | null
}

// GET /defense-revision/{id}
export interface DefenseRevisionHistory {
  historyPublicId: string
  revisedReportFile: string
  revisedReportFileName: string | null
  explanationFile: string | null
  explanationFileName: string | null
  studentNote: string | null
  status: RevisionStatus
  submittedAt: string
  reviewerName: string | null
  reviewedAt: string | null
  reviewNote: string | null
}

export interface DefenseRevision {
  revisionPublicId: string
  defenseAssignmentPublicId: string
  councilCode: string
  studentCode: string
  studentName: string
  topicName: string | null
  requirement: string
  status: RevisionStatus
  deadlineStartAt: string | null
  deadlineEndAt: string | null
  submitOpen: boolean
  canReview: boolean
  revisedReportFile: string | null
  revisedReportFileName: string | null
  explanationFile: string | null
  explanationFileName: string | null
  studentNote: string | null
  submittedAt: string | null
  reviewerName: string | null
  reviewedAt: string | null
  reviewNote: string | null
  histories: DefenseRevisionHistory[]
}

export interface DefenseRevisionReviewRequest {
  decision: 'APPROVED' | 'RETURNED'
  reviewNote: string | null
}

// =========================================================================
// Legacy types (dùng cho lecturer_portal_storage & các bước sau chưa nối API)
// =========================================================================
export type DefenseReviewStatus = 'pending' | 'approved' | 'rejected'

export interface DefenseCouncilStudentSlot {
  order: number
  name: string
  mssv: string
  timeSlot: string
}

export interface DefenseCouncilItem {
  id: string
  codeBadge: string
  badgeVariant: 'blue' | 'purple'
  title: string
  sessionLabel: string
  sessionVariant: 'amber' | 'slate'
  timeRange: string
  location: string
  lecturerRole: string
  committeeSummary: string
  actionLabel: string
  students: DefenseCouncilStudentSlot[]
}

export interface DefenseReviewItem {
  id: string
  mssv: string
  name: string
  topic: string
  major: string
  supervisorName: string
  reportFileName: string
  score: number | null
  status: DefenseReviewStatus
}
