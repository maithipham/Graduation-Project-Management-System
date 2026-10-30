import type { SemesterCode } from '@/shared/contexts'

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

export type OutlineSubmissionStatus = 'Đã duyệt' | 'Đã từ chối' | 'Chờ duyệt'

export interface OutlineSubmissionItem {
  id: number
  year: string
  semester: SemesterCode
  source: 'file' | 'editor'
  editorData?: OutlineEditorData | null
  time: string
  fileName: string
  status: OutlineSubmissionStatus
  approvedTime?: string
  note: string
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
