export interface MockTopic {
  id: string
  code: string
  title: string
  description: string
  lecturerName: string
  lecturerEmail: string
  department: string
  status: 'available' | 'registered' | 'approved' | 'locked'
  maxStudents: number
  enrolledStudents: number
}

export const mockTopics: MockTopic[] = [
  {
    id: 'topic-1',
    code: 'DATN-26-0148',
    title: 'Hệ thống hỗ trợ phân tích phản hồi khách hàng bằng xử lý ngôn ngữ tự nhiên',
    description: 'Ứng dụng mô hình transformer và sentiment analysis để phân loại phản hồi đa kênh.',
    lecturerName: 'TS. Trần Minh Khôi',
    lecturerEmail: 'khoitm@tlu.edu.vn',
    department: 'Công nghệ phần mềm',
    status: 'approved',
    maxStudents: 1,
    enrolledStudents: 1,
  },
  {
    id: 'topic-2',
    code: 'DATN-26-0149',
    title: 'Ứng dụng Computer Vision nhận diện biển báo giao thông trên xe tự hành',
    description: 'Xây dựng pipeline huấn luyện YOLOv8 tối ưu cho thiết bị nhúng Jetson Nano.',
    lecturerName: 'TS. Trần Minh Khôi',
    lecturerEmail: 'khoitm@tlu.edu.vn',
    department: 'Công nghệ phần mềm',
    status: 'registered',
    maxStudents: 1,
    enrolledStudents: 1,
  },
  {
    id: 'topic-3',
    code: 'DATN-26-0150',
    title: 'Nền tảng quản lý chuỗi cung ứng vật tư y tế trên nền tảng Blockchain',
    description: 'Triển khai smart contract trên Hyperledger Fabric đảm bảo tính minh bạch.',
    lecturerName: 'PGS. TS. Nguyễn Văn Hùng',
    lecturerEmail: 'hungnv@tlu.edu.vn',
    department: 'Hệ thống thông tin',
    status: 'available',
    maxStudents: 2,
    enrolledStudents: 1,
  },
]
