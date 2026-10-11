export interface MockScoreRecord {
  studentCode: string
  supervisorScore: number // Điểm GVHD
  reviewerScore: number   // Điểm GVPB
  councilScores: number[] // Điểm các thành viên hội đồng
  finalScore?: number
}

export const mockScores: MockScoreRecord[] = [
  {
    studentCode: '2251061234',
    supervisorScore: 8.8,
    reviewerScore: 8.5,
    councilScores: [8.5, 9.0, 8.7],
    finalScore: 8.7,
  },
  {
    studentCode: '2251065678',
    supervisorScore: 9.0,
    reviewerScore: 9.2,
    councilScores: [9.0, 9.5, 9.0],
    finalScore: 9.1,
  },
  {
    studentCode: '2251069012',
    supervisorScore: 8.0,
    reviewerScore: 6.0, // Chênh lệch điểm > 2.0 (Kỹ thuật #28: Live Outlier Alert)
    councilScores: [7.5, 7.0, 7.5],
  },
]
