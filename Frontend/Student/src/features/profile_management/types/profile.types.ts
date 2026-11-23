// Response của GET /student/my-info (các field null vẫn luôn có mặt trong JSON)
export interface StudentMyInfoResponse {
  /** Đề tài học kỳ hiện tại; null = chưa có đề tài / chưa chốt tên */
  topicName: string | null
  /** GVHD (kèm học hàm học vị); null = chưa được phân công */
  lecturerName: string | null
  /** GV đồng hướng dẫn; null = không có */
  coLecturerName: string | null
  /** Họ + Tên đã ghép sẵn */
  name: string
  studentCode: string
  /** Dạng "K63" */
  batch: string
  className: string
  /** Sinh viên không sửa được */
  email: string
  phone: string
  /** Bộ môn */
  majorName: string
  facultyName: string
}

// Body của PUT /student/my-info — luôn gửi đủ 3 field
export interface StudentMyInfoUpdateRequest {
  /** Họ và tên đệm */
  firstName: string
  /** Tên (1 từ) */
  lastName: string
  /** 10 chữ số, bắt đầu bằng 0, không dấu cách */
  phone: string
}
