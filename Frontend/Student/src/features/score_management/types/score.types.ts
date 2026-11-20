// Response của GET /thesis-score/my-score (mỗi lần gọi: 1 đề tài của 1 học kỳ)
export interface StudentScoreResponse {
  semesterPublicId: string
  semesterName: string
  topicPublicId: string
  topicName: string | null
  advisorScore: number | null // null = GVHD chưa nộp phiếu
  advisorWeight: number | null
  examinerScore: number | null // trung bình 2 phiếu phản biện; null = chưa đủ phiếu
  examinerWeight: number | null
  examinerPassed: boolean | null // null khi chưa có điểm PB
  councilScore: number | null // trung bình 5 phiếu hội đồng; null = chưa đủ phiếu
  councilWeight: number | null
  finalScore: number | null // BE tính sẵn, FE không tính lại
  weightConfigured: boolean // false = Trưởng ngành chưa cấu hình trọng số cho kỳ (chỉ ảnh hưởng cột trọng số, không ảnh hưởng điểm tổng kết)
}

// Một dòng của bảng điểm (dùng cho UI)
export interface StudentScoreRow {
  key: 'advisor' | 'examiner' | 'council'
  label: string
  weight: number | null
  score: number | null
  passed?: boolean | null // chỉ dòng Phản biện
}

// Mã lỗi nghiệp vụ BE hiển thị thành trạng thái rỗng trong trang
export const SCORE_ERROR_CODE = {
  TOPIC_NOT_FOUND: 3049, // sinh viên chưa có đề tài trong học kỳ
  SEMESTER_REQUIRED: 3022, // không có học kỳ đang diễn ra
} as const
