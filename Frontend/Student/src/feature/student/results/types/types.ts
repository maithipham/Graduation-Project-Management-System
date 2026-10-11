export interface EvaluationScore {
  supervisorScore: number
  reviewerScore: number
  councilScore?: number | null
  finalScore?: number | null
  status: 'scoring' | 'completed'
}
