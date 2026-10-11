export interface StudentOutline {
  id: string
  title: string
  fileName: string
  fileUrl: string
  submittedAt: string
  version: number
  status: 'draft' | 'submitted' | 'needs_revision' | 'approved'
  feedback?: string
}
