// Response GET /teacher/my-info
export interface TeacherMyInfo {
  teacherCode: string
  /** Học hàm, học vị viết tắt (VD "TS."), null nếu chưa có */
  academicTitle: string | null
  /** Học hàm, học vị đầy đủ (VD "Tiến sĩ"), null nếu chưa có */
  academicTitleName: string | null
  /** Họ tên đầy đủ, không kèm học vị */
  name: string
  email: string
  phone: string | null
  /** Đơn vị công tác */
  organization: string | null
  /** Bộ môn; null với giảng viên ngoài trường */
  majorName: string | null
  /** Khoa; null với giảng viên ngoài trường */
  facultyName: string | null
}

// Body PUT /teacher/my-info (luôn gửi đủ 3 field, không gửi email)
export interface TeacherMyInfoUpdatePayload {
  firstName: string
  lastName: string
  phone: string
}

/** Kết quả PUT: 1000 = đã lưu, 1104 = không có gì thay đổi (cảnh báo) */
export interface TeacherMyInfoUpdateResult {
  code: number
  message: string
}
