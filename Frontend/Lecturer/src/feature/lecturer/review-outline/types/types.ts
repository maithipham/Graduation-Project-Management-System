export interface OutlineReviewSubmission {
  outlineId: string
  decision: 'approved' | 'revision_required' | 'rejected'
  comment: string
  score?: number
}

export interface ReviewPendingItem {
  id: string
  studentCode: string
  studentName: string
  topicTitle: string
  submittedAt: string
  fileUrl: string
  version: number
}
