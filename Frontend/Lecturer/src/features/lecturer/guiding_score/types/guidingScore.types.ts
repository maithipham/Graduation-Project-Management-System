export type GuidingScoreStatus = 'scored' | 'unscored'

export interface GuidingScoreItem {
  id: string
  mssv: string
  name: string
  major: string
  topic: string
  score: number | null
  comment: string
  status: GuidingScoreStatus
}

export interface GuidingScoreStats {
  total: number
  gradedCount: number
  ungradedCount: number
}

