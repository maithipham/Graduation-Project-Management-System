export interface StudentProfileMock {
  name: string
  mssv: string
  className: string
  department: string
  faculty: string
  academicYear: string
  status: string
  email: string
  phone: string
  avatar: string
  mentor: string
  outlineReviewer: string
  topic: string
}

export const STUDENT_PROFILE_MOCK: StudentProfileMock = {
  name: 'Phạm Mai',
  mssv: '2151060001',
  className: '21DH-CNTT1',
  department: 'Công nghệ Phần mềm',
  faculty: 'Khoa Công nghệ thông tin',
  academicYear: '2021 - 2025',
  status: 'Đang làm đồ án tốt nghiệp',
  email: 'mai.pham@student.tlu.edu.vn',
  phone: '0912 345 678',
  avatar: 'PM',
  mentor: 'TS. Nguyễn Thu Thủy',
  outlineReviewer: 'TS. Trần Minh Khôi',
  topic: 'Xây dựng hệ thống Quản lý Đồ án Tốt nghiệp trực tuyến (GPMS)',
}

export const STUDENT_TOPIC_STORAGE_KEYS = {
  topic: 'student_profile_topic',
  oldTopic: 'student_profile_old_topic',
  topicRequested: 'student_topic_requested',
  outlineDraft: 'student_outline_draft_v1',
} as const

