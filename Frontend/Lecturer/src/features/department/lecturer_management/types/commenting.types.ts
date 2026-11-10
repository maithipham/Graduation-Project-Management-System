/**
 * TypeScript Interfaces & Types cho tính năng Phân công Giảng viên Nhận xét (commenting_lecturer).
 */

// ---------------------------------------------------------------------------
// 1. Raw API Response DTOs (Phản hồi thô từ Backend)
// ---------------------------------------------------------------------------

export interface CommentingLecturerApi {
  id: number
  publicId?: string
  code?: string
  fullName: string
  title?: string
  email?: string
  phone?: string
  department?: string
  organization?: string
  currentCommentingCount: number
}

export interface StudentAssignmentApi {
  studentId: number
  studentPublicId?: string
  studentCode: string
  studentName: string
  className?: string
  majorName?: string
  topicId: number
  topicPublicId?: string
  topicTitle?: string
  supervisorId?: number
  supervisorPublicId?: string
  supervisorName?: string
  coSupervisorId?: number
  coSupervisorPublicId?: string
  coSupervisorName?: string
  commentingLecturerId?: number | null
  commentingLecturerPublicId?: string | null
  commentingLecturerName?: string | null
  isSupervisorConflict?: boolean
}

// ---------------------------------------------------------------------------
// 2. Client View State Models (Mô hình giao diện sau khi qua tầng Transformer)
// ---------------------------------------------------------------------------

export type LecturerCategory = 'all' | 'internal' | 'dept_ext' | 'univ_ext'
export type LecturerSort = 'default' | 'asc' | 'desc'

export interface CommentingLecturer {
  id: number
  publicId: string
  code: string
  displayName: string
  rawName: string
  title: string
  email: string
  department: string
  organization: string
  commentingStudentCount: number
  isInternal: boolean
  category: 'internal' | 'dept_ext' | 'univ_ext'
  categoryLabel: string
  subLabel: string
}

export type AssignmentStatus = 'UNASSIGNED' | 'ASSIGNED'

export interface StudentAssignment {
  id: number // topicId hoặc studentId
  studentId: number
  studentPublicId: string
  studentCode: string
  studentName: string
  className: string
  majorName: string
  topicId: number
  topicPublicId: string
  topicTitle: string
  supervisorId: number | null
  supervisorPublicId: string
  supervisorName: string
  coSupervisorId: number | null
  coSupervisorName: string
  commentingLecturerId: number | null
  commentingLecturerPublicId: string | null
  commentingLecturerName: string | null
  status: AssignmentStatus
  statusLabel: string
  isConflict: boolean
}

// ---------------------------------------------------------------------------
// 3. Request Payloads & Filter Parameters
// ---------------------------------------------------------------------------

export interface AssignmentFilterParams {
  search: string
  status: 'ALL' | 'UNASSIGNED' | 'ASSIGNED'
  department: string
  lecturerSearch?: string
  lecturerCategory?: LecturerCategory
  lecturerSort?: LecturerSort
}

export interface ManualAssignRequest {
  commentingLecturerId: number
  commentingLecturerPublicId?: string
  studentOrTopicIds: number[]
  publicIds?: string[]
}

export interface AutoDistributeRequest {
  semesterId: string
  departmentId?: string
  preview?: boolean
}

export interface DistributionPreviewSummary {
  lecturerId: number
  lecturerName: string
  department: string
  currentCount: number
  newCount: number
  diffCount: number
}

