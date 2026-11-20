// Response của GET /thesis-score/my-score (mỗi lần gọi: 1 đề tài của 1 học kỳ)
export interface StudentScoreResponse {
  semesterPublicId: string
  semesterName: string
  topicPublicId: string
  topicName: string | null
  advisorScore: number | null // null = GVHD chưa nộp phiếu
  examinerScore: number | null // trung bình 2 phiếu phản biện; null = chưa đủ phiếu
  examinerPassed: boolean | null // null khi chưa có điểm PB
  councilScore: number | null // trung bình 5 phiếu hội đồng; null = chưa đủ phiếu
  finalScore: number | null // Điểm tổng kết theo QĐ1305, BE tính sẵn, FE không tính lại
}

// Một dòng của bảng điểm (dùng cho UI)
export interface StudentScoreRow {
  key: 'advisor' | 'examiner' | 'council'
  label: string
  score: number | null
  passed?: boolean | null // chỉ dòng Phản biện
}

// Mã lỗi nghiệp vụ BE hiển thị thành trạng thái rỗng trong trang
export const SCORE_ERROR_CODE = {
  TOPIC_NOT_FOUND: 3049, // sinh viên chưa có đề tài trong học kỳ
  SEMESTER_REQUIRED: 3022, // không có học kỳ đang diễn ra
} as const
