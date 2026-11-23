// Nộp lại báo cáo cuối cùng sau bảo vệ (BE: DefenseRevisionController, feature defense)
// Thư ký đánh dấu trong biên bản → "Hoàn tất bảo vệ" tạo yêu cầu → sinh viên nộp → Thư ký / Chủ tịch duyệt

export type DefenseRevisionStatus =
  | 'REQUIRED' // Chờ nộp
  | 'SUBMITTED' // Đã nộp, chờ duyệt
  | 'APPROVED' // Đã duyệt
  | 'RETURNED' // Bị trả lại, nộp lại
  | 'OVERDUE' // Quá hạn

export interface DefenseRevisionHistoryResponse {
  historyPublicId: string
  revisedReportFile: string
  revisedReportFileName: string | null
  explanationFile: string | null
  explanationFileName: string | null
  studentNote: string | null
  status: DefenseRevisionStatus
  submittedAt: string
  reviewerName: string | null
  reviewedAt: string | null
  reviewNote: string | null
}

/** `GET /defense-revision/my` — `deadlineEndAt = null`: kỳ chưa cấu hình mốc, hạn nộp sẽ được thông báo sau. */
export interface DefenseRevisionResponse {
  revisionPublicId: string
  defenseAssignmentPublicId: string
  councilCode: string
  studentCode: string
  studentName: string
  topicName: string | null
  requirement: string
  status: DefenseRevisionStatus
  deadlineStartAt: string | null
  deadlineEndAt: string | null
  // Sinh viên đang được nộp (đúng trạng thái và trong mốc)
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
  histories: DefenseRevisionHistoryResponse[]
}

export interface SubmitDefenseRevisionPayload {
  revisionPublicId: string
  revisedReportFile: File
  explanationFile: File | null
  studentNote: string | null
}
