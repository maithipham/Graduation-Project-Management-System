export interface MockStudent {
  id: string
  studentCode: string
  fullName: string
  email: string
  className: string
  major: string
  topicCode?: string
  progressStage: number // 1 đến 6
  status: 'active' | 'graduated' | 'suspended'
}

export const mockStudents: MockStudent[] = [
  {
    id: 'sv-1',
    studentCode: '2251061234',
    fullName: 'Nguyễn Văn An',
    email: 'annv22@gmail.com',
    className: '64CNPM1',
    major: 'Công nghệ phần mềm',
    topicCode: 'DATN-26-0148',
    progressStage: 3,
    status: 'active',
  },
  {
    id: 'sv-2',
    studentCode: '2251065678',
    fullName: 'Trần Thị Bình',
    email: 'binhtt22@gmail.com',
    className: '64CNPM2',
    major: 'Công nghệ phần mềm',
    topicCode: 'DATN-26-0149',
    progressStage: 4,
    status: 'active',
  },
  {
    id: 'sv-3',
    studentCode: '2251069012',
    fullName: 'Lê Hoàng Nam',
    email: 'namlh22@gmail.com',
    className: '64HTTT1',
    major: 'Hệ thống thông tin',
    topicCode: 'DATN-26-0150',
    progressStage: 4,
    status: 'active',
  },
]
