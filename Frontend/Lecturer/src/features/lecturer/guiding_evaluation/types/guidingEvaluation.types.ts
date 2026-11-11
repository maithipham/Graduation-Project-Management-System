export interface RubricScores {
  r1_1: number
  r1_2: number
  r2_1: number
  r2_2: number
  r3_1: number
  r3_2: number
  r4_1: number
  r4_2: number
  r4_3: number
}

export type RubricCriterionKey = keyof RubricScores

export type GuidingEvaluationTabStatus = 'all' | 'incomplete' | 'completed'

export interface GuidingEvaluationItem {
  id: string
  stt: number
  name: string
  mssv: string
  classCode: string
  major: string
  topic: string
  fileName: string
  submittedAt: string
  score: number | null
  rubricScores: RubricScores | null
}

export interface GuidingEvaluationCounts {
  all: number
  incomplete: number
  completed: number
}

export interface RubricCriterionConfig {
  key: RubricCriterionKey
  code: string
  label: string
  weight: number
  group: 1 | 2 | 3 | 4
}

export interface RubricGroupConfig {
  group: 1 | 2 | 3 | 4
  title: string
  weight: number
  criteria: RubricCriterionConfig[]
}

export interface TrackingTimelineEntry {
  date: string
  work: string
  comment: string
  location: string
}

