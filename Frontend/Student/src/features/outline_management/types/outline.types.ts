import type { SemesterCode } from '@/shared/contexts'

export interface OutlinePlanRow {
  task: string
  time: string
  result: string
}

export interface OutlineEditorData {
  topicVi: string
  topicEn: string
  reason: string
  objectives: string
  scope: string
  methods: string
  structure: string
  expected: string
  references: string
  plan: OutlinePlanRow[]
}

export type OutlineSectionKey =
  | 'reason'
  | 'objectives'
  | 'scope'
  | 'methods'
  | 'structure'
  | 'expected'
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
      t: 'center'
      text: string
      bold?: boolean
      italic?: boolean
      size?: number
      after?: number
    }
  | {
      t: 'h'
      text: string
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
