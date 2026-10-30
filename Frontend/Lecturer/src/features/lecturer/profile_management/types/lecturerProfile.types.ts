export interface LecturerProfileData {
  degree: string // Học vị ghi rõ (VD: Tiến sĩ, Thạc sĩ, Phó Giáo sư, Tiến sĩ...)
  name: string // Họ và tên (VD: Trần Mai Anh)
  role: string // Chức danh hoặc vai trò: Giảng viên / Trưởng ngành
  workplace: string // Đơn vị công tác (Trường ĐH Thủy lợi hoặc ngoài trường)
  isExternal: boolean // Giảng viên ngoài trường
  department: string // Bộ môn (để trống nếu ngoài trường)
  faculty: string // Khoa quản lý (để trống nếu ngoài trường)
  email: string // Email liên hệ
  phone: string // Số điện thoại
}

export interface LecturerProfileContactPayload {
  name: string
  email: string
  phone: string
}
