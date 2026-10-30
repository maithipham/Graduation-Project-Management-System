import type { RegistrationLecturerOption } from '../types/registration.types'

export const REGISTRATION_LECTURERS_MOCK: RegistrationLecturerOption[] = [
  {
    id: 1,
    name: 'TS. Trần Minh Khôi',
    degree: 'Tiến sĩ',
    department: 'Bộ môn Công nghệ phần mềm',
    origin: 'internal',
    email: 'khoi.tran@tlu.edu.vn',
    phone: '0901 234 567',
    room: 'Phòng B.301',
    quota: '3 / 5',
    used: 3,
    max: 5,
    isAccepting: 1,
    field: 'Xử lý ngôn ngữ tự nhiên, Trí tuệ nhân tạo',
    bio: 'Hướng dẫn đồ án chuyên sâu về NLP, khai phá văn bản và học máy ứng dụng.',
  },
  {
    id: 2,
    name: 'ThS. Võ Thu Hà',
    degree: 'Thạc sĩ',
    department: 'Bộ môn Hệ thống thông tin',
    origin: 'internal',
    email: 'ha.vo@tlu.edu.vn',
    phone: '0902 345 678',
    room: 'Phòng B.305',
    quota: '2 / 4',
    used: 2,
    max: 4,
    isAccepting: 1,
    field: 'Cơ sở dữ liệu, Phân tích dữ liệu lớn',
    bio: 'Hướng dẫn đồ án về CSDL, kho dữ liệu, Business Intelligence và trực quan hóa dữ liệu.',
  },
  {
    id: 3,
    name: 'TS. Nguyễn Quốc Bảo',
    degree: 'Tiến sĩ',
    department: 'Bộ môn Công nghệ phần mềm',
    origin: 'internal',
    email: 'bao.nguyen@tlu.edu.vn',
    phone: '0903 456 789',
    room: 'Phòng B.310',
    quota: '5 / 5',
    used: 5,
    max: 5,
    isAccepting: 0,
    field: 'Kiến trúc phần mềm, DevOps, Cloud Computing',
    bio: 'Hướng dẫn đồ án kiến trúc microservices, CI/CD và kiểm thử phần mềm tự động.',
  },
  {
    id: 4,
    name: 'TS. Lê Thanh Tùng',
    degree: 'Tiến sĩ',
    department: 'Bộ môn Mạng & Truyền thông',
    origin: 'internal',
    email: 'tung.le@tlu.edu.vn',
    phone: '0904 567 890',
    room: 'Phòng B.312',
    quota: '4 / 5',
    used: 4,
    max: 5,
    isAccepting: 1,
    field: 'An toàn thông tin, Mạng máy tính',
    bio: 'Hướng dẫn các đề tài về bảo mật hệ thống, an ninh mạng và blockchain.',
  },
  {
    id: 5,
    name: 'TS. Nguyễn Thu Thủy',
    degree: 'Tiến sĩ',
    department: 'Bộ môn Công nghệ phần mềm',
    origin: 'internal',
    email: 'thuy.nguyen@tlu.edu.vn',
    phone: '0905 123 456',
    room: 'Phòng B.308',
    quota: '3 / 5',
    used: 3,
    max: 5,
    isAccepting: 1,
    field: 'Hệ thống thông tin doanh nghiệp, Công nghệ Web',
    bio: 'Hướng dẫn các đề tài về chuyển đổi số, hệ thống ERP và giải pháp phần mềm quản trị.',
  },
  {
    id: 6,
    name: 'ThS. Nguyễn Văn Toàn',
    degree: 'Thạc sĩ',
    department: 'Bộ môn Khoa học máy tính',
    unit: 'Đại học Bách khoa Hà Nội',
    origin: 'external',
    email: 'toan.nv@hust.edu.vn',
    phone: '0906 111 222',
    room: 'Liên hệ qua email',
    quota: '1 / 3',
    used: 1,
    max: 3,
    isAccepting: 1,
    field: 'Học sâu, Thị giác máy tính',
    bio: 'Giảng viên thỉnh giảng, hướng dẫn đề tài về computer vision và học sâu ứng dụng.',
  },
  {
    id: 7,
    name: 'TS. Hoàng Minh Tuấn',
    degree: 'Tiến sĩ',
    department: 'Bộ môn Công nghệ phần mềm',
    unit: 'Viện Công nghệ thông tin - VAST',
    origin: 'external',
    email: 'tuan.hm@ioit.ac.vn',
    phone: '0907 333 444',
    room: 'Liên hệ qua email',
    quota: '2 / 3',
    used: 2,
    max: 3,
    isAccepting: 1,
    field: 'Kỹ nghệ phần mềm, Kiểm thử tự động',
    bio: 'Nghiên cứu viên, hướng dẫn đề tài về kỹ nghệ yêu cầu và kiểm thử phần mềm.',
  },
  {
    id: 8,
    name: 'ThS. Đặng Thị Lan',
    degree: 'Thạc sĩ',
    department: 'Bộ môn Hệ thống thông tin',
    unit: 'Công ty FPT Software',
    origin: 'external',
    email: 'lan.dt@fpt.com',
    phone: '0908 555 666',
    room: 'Liên hệ qua email',
    quota: '3 / 3',
    used: 3,
    max: 3,
    isAccepting: 0,
    field: 'Phân tích nghiệp vụ, ERP',
    bio: 'Chuyên gia doanh nghiệp, hướng dẫn đề tài thực tế về phân tích & thiết kế hệ thống.',
  },
]

export function normalizeRegistrationText(text: string): string {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()
}

export function cleanDepartmentLabel(dept: string): string {
  return String(dept || '').replace(/^Bộ môn\s+/i, '')
}

export function isLecturerQuotaFull(lecturer: RegistrationLecturerOption): boolean {
  const left = (lecturer.max || 0) - (lecturer.used || 0)
  return lecturer.isAccepting === 0 || left <= 0
}

export function formatRegistrationNow(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}



export const registrationService = {
  getLecturers: (): RegistrationLecturerOption[] => [...REGISTRATION_LECTURERS_MOCK],
  formatNow: formatRegistrationNow,
}
