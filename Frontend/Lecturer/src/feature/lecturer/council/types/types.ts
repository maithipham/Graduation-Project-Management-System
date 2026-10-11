export interface CouncilDefenseStudent {
  defenseId: string
  studentCode: string
  studentName: string
  topicTitle: string
  supervisorScore: number
  reviewerScore: number
  councilScores?: number[]
  finalScore?: number
}

export interface DefenseGradingSubmission {
  defenseId: string
  score: number
  comments: string
  memberRole: 'president' | 'secretary' | 'reviewer' | 'member'
}
