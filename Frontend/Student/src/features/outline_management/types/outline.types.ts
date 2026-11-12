import type { OutlineDeadlineStatus } from './topicTitle.types'

export type OutlineStatus = 'PENDING' | 'APPROVED' | 'REQUEST_CHANGES' | 'REJECTED'

export interface ThesisOutlineHistoryResponse {
  publicId: string
  outlineHistoryFile: string
  submissionNote: string | null
  status: OutlineStatus
  statusDescription: string
  submittedAt: string
  reviewerPublicId: string | null
  reviewerName: string | null
  reviewFeedback: string | null
  reviewedAt: string | null
}

export interface ThesisOutlineResponse {
  publicId: string | null
  topicPublicId: string | null
  topicName: string | null
  currentStage: string | null
  topicStatus: string | null
  disqualificationReason: string | null
  studentPublicId: string | null
  studentCode: string | null
  studentName: string | null
  lecturerPublicId: string | null
  lecturerName: string | null
  coLecturerPublicId: string | null
  coLecturerName: string | null
  reviewerPublicId: string | null
  reviewerName: string | null
  title: string | null
  outlineFile: string | null
  status: OutlineStatus | null
  statusDescription: string | null
  reviewFeedback: string | null
  advisorFeedback: string | null
  submittedAt: string | null
  reviewedAt: string | null
  canReview: boolean
  canWriteAdvisorFeedback: boolean
  deadlineName: string | null
  deadlineStartDate: string | null
  deadlineEndDate: string | null
  deadlineActive: boolean | null
  deadlineStatus: OutlineDeadlineStatus
  histories: ThesisOutlineHistoryResponse[]
}

export interface SubmitOutlineRequest {
  file: File
  submissionNote?: string
  title?: string
}

export const OUTLINE_ERROR_CODES = {
  OUTLINE_FILE_EMPTY: 4000,
  OUTLINE_FILE_INVALID_FORMAT: 4000,
  OUTLINE_FILE_TOO_LARGE: 4000,
  OUTLINE_TITLE_TOO_LONG: 4000,
  OUTLINE_REVIEWER_NOT_ASSIGNED: 3079,
  OUTLINE_STAGE_INVALID: 3080,
  OUTLINE_ALREADY_FINALIZED: 3081,
  OUTLINE_DEADLINE_NOT_FOUND: 3084,
  OUTLINE_SUBMISSION_DEADLINE_CLOSED: 3085,
  TOPIC_NOT_IN_PROGRESS: 3057,
} as const

export interface OutlineScheduleRow {
  step: number
  time: string
  task: string
  expectedResult: string
}

// Backward-compatible alias for any legacy usage
export interface OutlinePlanRow {
  task: string
  time: string
  result: string
}

export interface StudentOutlineMeta {
  name: string
  mssv: string
  className: string
  department?: string
  faculty?: string
  mentor: string
  phone?: string
  email?: string
}

export interface OutlineEditorData {
  // Main title
  topic: string

  // Student & Mentor information (matching template)
  studentName?: string
  className?: string
  mssv?: string
  phone?: string
  email?: string
  supervisor1: string
  supervisor2?: string

  // Main Outline Sections (matching Mẫu_đề_cương_ĐATN.docx)
  summary: string // TÓM TẮT ĐỀ TÀI
  objectives: string // CÁC MỤC TIÊU CHÍNH
  expectedResults: string // KẾT QUẢ DỰ KIẾN
  schedule: OutlineScheduleRow[] // TIẾN ĐỘ THỰC HIỆN
  references: string // TÀI LIỆU THAM KHẢO

  // Legacy fields (optional, kept for backward compatibility)
  topicVi?: string
  topicEn?: string
  reason?: string
  scope?: string
  methods?: string
  structure?: string
  expected?: string
  plan?: OutlinePlanRow[]
}

export type OutlineSectionKey =
  | 'summary'
  | 'objectives'
  | 'expectedResults'
  | 'references'

export interface OutlineSectionConfig {
  key: OutlineSectionKey
  title: string
  hint: string
  required: boolean
  rows: number
}

export interface SignSideBlock {
  date?: string
  title: string
  hint?: string
  name: string
}

export type DocxBlock =
  | {
      t: 'headerTable'
      university: string
      faculty: string
      title: string
    }
  | {
      t: 'center'
      text: string
      bold?: boolean
      italic?: boolean
      size?: number
      color?: string
      after?: number
    }
  | {
      t: 'h'
      text: string
      center?: boolean
      color?: string
    }
  | {
      t: 'p'
      text: string
      indent?: boolean
    }
  | {
      t: 'kv'
      label: string
      value: string
      italicLabel?: boolean
      boldLabel?: boolean
    }
  | {
      t: 'table'
      head: string[]
      widths: number[]
      rows: string[][]
    }
  | {
      t: 'sign'
      left: SignSideBlock
      right: SignSideBlock
    }
  | {
      t: 'blank'
    }
