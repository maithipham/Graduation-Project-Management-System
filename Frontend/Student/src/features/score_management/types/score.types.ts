export interface StudentScoreRow {
  type: string
  component: string
  weight: number
  score: number
  comment: string
}

export interface StudentSemesterScoreCard {
  semesterKey: string
  courseName: string
  className: string
  rows: StudentScoreRow[]
}

