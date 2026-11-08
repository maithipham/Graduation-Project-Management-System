import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type {
  Lecturer,
  MajorOption,
  SemesterAdvisorResponse,
} from '../types/lecturer.types'

export const LECTURERS_MOCK: Lecturer[] = [
  {
    id: 1,
    name: 'PGS.TS. Trần Quốc Bảo',
    degree: 'Phó Giáo sư',
    department: 'Kỹ thuật phần mềm',
    origin: 'internal',
    email: 'bao.tq@tlu.edu.vn',
    phone: '0901 234 567',
    room: 'Phòng B.301',
    quota: '3 / 5',
    isAccepting: 1,
    field: 'Kiến trúc phần mềm, DevOps',
    bio: 'Hướng dẫn đồ án về kiến trúc phần mềm, kiểm thử và CI/CD.',
  },
  {
    id: 2,
    name: 'TS. Vũ Thị Lan',
    degree: 'Tiến sĩ',
    department: 'Kỹ thuật phần mềm',
    origin: 'internal',
    email: 'lan.vt@tlu.edu.vn',
    phone: '0908 777 888',
    room: 'Phòng B.314',
    quota: '4 / 5',
    isAccepting: 1,
    field: 'Công nghệ phần mềm, Hệ thống thông minh',
    bio: 'Hướng dẫn đồ án về công nghệ web, ứng dụng di động và AI ứng dụng.',
  },
  {
    id: 3,
    name: 'ThS. Nguyễn Thị Hoa',
    degree: 'Thạc sĩ',
    department: 'Kỹ thuật phần mềm',
    origin: 'internal',
    email: 'hoa.nt@tlu.edu.vn',
    phone: '0902 345 678',
    room: 'Phòng B.305',
    quota: '2 / 4',
    isAccepting: 1,
    field: 'Phân tích thiết kế hệ thống, UI/UX',
    bio: 'Hướng dẫn đồ án về phân tích nghiệp vụ và phát triển phần mềm.',
  },
  {
    id: 4,
    name: 'PGS.TS. Trịnh Xuân Bình',
    degree: 'Phó Giáo sư',
    department: 'Kỹ thuật phần mềm',
    origin: 'internal',
    email: 'binh.tx@tlu.edu.vn',
    phone: '0904 567 890',
    room: 'Phòng B.312',
    quota: '4 / 5',
    isAccepting: 1,
    field: 'Công nghệ phần mềm, An toàn thông tin',
    bio: 'Hướng dẫn đồ án về an toàn phần mềm và kiến trúc microservices.',
  },
  {
    id: 5,
    name: 'TS. Trần Minh Khôi',
    degree: 'Tiến sĩ',
    department: 'Kỹ thuật phần mềm',
    origin: 'internal',
    email: 'khoi.tran@tlu.edu.vn',
    phone: '0901 234 567',
    room: 'Phòng B.301',
    quota: '3 / 5',
    isAccepting: 1,
    field: 'Xử lý ngôn ngữ tự nhiên, trí tuệ nhân tạo',
    bio: 'Hướng dẫn đồ án về NLP, khai phá văn bản, học máy ứng dụng.',
  },
  {
    id: 6,
    name: 'ThS. Bùi Hoàng Long',
    degree: 'Thạc sĩ',
    department: 'Kỹ thuật phần mềm',
    origin: 'internal',
    email: 'long.bui@tlu.edu.vn',
    phone: '0909 888 999',
    room: 'Phòng B.316',
    quota: '3 / 4',
    isAccepting: 1,
    field: 'Lập trình web, phát triển ứng dụng di động',
    bio: 'Hướng dẫn đồ án Fullstack (React, Node.js, Flutter) và ứng dụng đa nền tảng.',
  },
  {
    id: 7,
    name: 'TS. Nguyễn Hoàng Anh',
    degree: 'Tiến sĩ',
    department: 'Kỹ thuật phần mềm',
    origin: 'internal',
    email: 'anh.nh@tlu.edu.vn',
    phone: '0912 345 678',
    room: 'Phòng B.318',
    quota: '3 / 5',
    isAccepting: 1,
    field: 'Công nghệ phần mềm hướng dịch vụ (SOA), Cloud',
    bio: 'Hướng dẫn đồ án về hệ thống Microservices, Kubernetes.',
  },
  {
    id: 8,
    name: 'ThS. Lê Minh Đức',
    degree: 'Thạc sĩ',
    department: 'Kỹ thuật phần mềm',
    origin: 'internal',
    email: 'duc.lm@tlu.edu.vn',
    phone: '0913 456 789',
    room: 'Phòng B.319',
    quota: '2 / 4',
    isAccepting: 1,
    field: 'Phát triển phần mềm nhúng, IoT',
    bio: 'Hướng dẫn đồ án ứng dụng IoT kết hợp ứng dụng Web/Mobile.',
  },
  {
    id: 9,
    name: 'TS. Phạm Hồng Nhung',
    degree: 'Tiến sĩ',
    department: 'Kỹ thuật phần mềm',
    origin: 'internal',
    email: 'nhung.ph@tlu.edu.vn',
    phone: '0914 567 890',
    room: 'Phòng B.320',
    quota: '4 / 5',
    isAccepting: 1,
    field: 'Kiểm thử phần mềm tự động, CI/CD',
    bio: 'Hướng dẫn đề tài kiểm thử tự động, bảo đảm chất lượng phần mềm (QA/QC).',
  },
  {
    id: 10,
    name: 'ThS. Đặng Quốc Huy',
    degree: 'Thạc sĩ',
    department: 'Kỹ thuật phần mềm',
    origin: 'internal',
    email: 'huy.dq@tlu.edu.vn',
    phone: '0915 678 901',
    room: 'Phòng B.321',
    quota: '1 / 4',
    isAccepting: 1,
    field: 'Lập trình Web nâng cao, Progressive Web App',
    bio: 'Hướng dẫn đồ án xây dựng ứng dụng Web hiện đại Next.js, Vue.js.',
  },
  {
    id: 11,
    name: 'PGS.TS. Ngô Tuấn Anh',
    degree: 'Phó Giáo sư',
    department: 'Kỹ thuật phần mềm',
    origin: 'internal',
    email: 'anh.nt@tlu.edu.vn',
    phone: '0916 789 012',
    room: 'Phòng B.322',
    quota: '5 / 5',
    isAccepting: 0,
    field: 'Kiến trúc hệ thống lớn, High Availability',
    bio: 'Hướng dẫn đồ án tối ưu hóa hiệu năng và thiết kế hệ thống chịu tải cao.',
  },
  {
    id: 12,
    name: 'TS. Hà Thị Thu Trang',
    degree: 'Tiến sĩ',
    department: 'Kỹ thuật phần mềm',
    origin: 'internal',
    email: 'trang.htt@tlu.edu.vn',
    phone: '0917 890 123',
    room: 'Phòng B.323',
    quota: '3 / 5',
    isAccepting: 1,
    field: 'Thiết kế trải nghiệm người dùng (UX/UI), Design System',
    bio: 'Hướng dẫn đồ án nghiên cứu hành vi người dùng và phát triển giao diện hiện đại.',
  },
  {
    id: 13,
    name: 'ThS. Phan Đình Vũ',
    degree: 'Thạc sĩ',
    department: 'Kỹ thuật phần mềm',
    origin: 'internal',
    email: 'vu.pd@tlu.edu.vn',
    phone: '0918 901 234',
    room: 'Phòng B.324',
    quota: '2 / 4',
    isAccepting: 1,
    field: 'Lập trình ứng dụng di động React Native, iOS',
    bio: 'Hướng dẫn đồ án phát triển ứng dụng di động đa nền tảng.',
  },
  {
    id: 14,
    name: 'TS. Dương Văn Cường',
    degree: 'Tiến sĩ',
    department: 'Kỹ thuật phần mềm',
    origin: 'internal',
    email: 'cuong.dv@tlu.edu.vn',
    phone: '0919 012 345',
    room: 'Phòng B.325',
    quota: '3 / 5',
    isAccepting: 1,
    field: 'Bảo mật mã nguồn, DevSecOps',
    bio: 'Hướng dẫn đồ án về quy trình tích hợp an toàn trong vòng đời phần mềm.',
  },
  {
    id: 15,
    name: 'ThS. Nguyễn Quỳnh Nga',
    degree: 'Thạc sĩ',
    department: 'Kỹ thuật phần mềm',
    origin: 'internal',
    email: 'nga.nq@tlu.edu.vn',
    phone: '0920 123 456',
    room: 'Phòng B.326',
    quota: '2 / 4',
    isAccepting: 1,
    field: 'Phân tích yêu cầu phần mềm, Agile/Scrum',
    bio: 'Hướng dẫn đồ án quản trị dự án phần mềm và phân tích nghiệp vụ chuyên sâu.',
  },
  {
    id: 16,
    name: 'TS. Hoàng Hữu Hạnh',
    degree: 'Tiến sĩ',
    department: 'Kỹ thuật phần mềm',
    origin: 'internal',
    email: 'hanh.hh@tlu.edu.vn',
    phone: '0921 234 567',
    room: 'Phòng B.327',
    quota: '4 / 5',
    isAccepting: 1,
    field: 'Tái cấu trúc mã nguồn (Refactoring), Clean Architecture',
    bio: 'Hướng dẫn đồ án chuẩn hóa kiến trúc mã nguồn và kiểm thử đơn vị.',
  },
  {
    id: 17,
    name: 'ThS. Vũ Trọng Khánh',
    degree: 'Thạc sĩ',
    department: 'Kỹ thuật phần mềm',
    origin: 'internal',
    email: 'khanh.vt@tlu.edu.vn',
    phone: '0922 345 678',
    room: 'Phòng B.328',
    quota: '3 / 4',
    isAccepting: 1,
    field: 'Phát triển phần mềm E-commerce, Cổng thanh toán',
    bio: 'Hướng dẫn đồ án tích hợp các cổng thanh toán điện tử và sàn thương mại.',
  },
  {
    id: 18,
    name: 'PGS.TS. Lâm Hoài Nam',
    degree: 'Phó Giáo sư',
    department: 'Kỹ thuật phần mềm',
    origin: 'internal',
    email: 'nam.lh@tlu.edu.vn',
    phone: '0923 456 789',
    room: 'Phòng B.329',
    quota: '3 / 5',
    isAccepting: 1,
    field: 'Phương pháp mô hình hóa hình thức (Formal Methods)',
    bio: 'Hướng dẫn nghiên cứu các phương pháp kiểm chứng phần mềm an toàn cao.',
  },
  {
    id: 19,
    name: 'TS. Đinh Tiến Dũng',
    degree: 'Tiến sĩ',
    department: 'Kỹ thuật phần mềm',
    origin: 'internal',
    email: 'dung.dt@tlu.edu.vn',
    phone: '0924 567 890',
    room: 'Phòng B.330',
    quota: '2 / 5',
    isAccepting: 1,
    field: 'Trí tuệ nhân tạo tạo sinh trong lập trình (Copilot, LLMs)',
    bio: 'Hướng dẫn đề tài nghiên cứu tích hợp mô hình ngôn ngữ lớn hỗ trợ kỹ sư phần mềm.',
  },
  {
    id: 20,
    name: 'ThS. Mai Thị Bích Ngọc',
    degree: 'Thạc sĩ',
    department: 'Kỹ thuật phần mềm',
    origin: 'internal',
    email: 'ngoc.mtb@tlu.edu.vn',
    phone: '0925 678 901',
    room: 'Phòng B.331',
    quota: '3 / 4',
    isAccepting: 1,
    field: 'Kiểm thử bảo mật Web & API',
    bio: 'Hướng dẫn đồ án rà quét lỗ hổng OWASP Top 10 và bảo mật ứng dụng Web.',
  },
  {
    id: 21,
    name: 'TS. Hoàng Minh Tuấn',
    degree: 'Tiến sĩ',
    department: 'Kỹ thuật phần mềm',
    origin: 'external',
    unit: 'Viện CNTT - Tập đoàn Viettel',
    email: 'tuan.hm@viettel.com.vn',
    phone: '0907 888 777',
    room: 'Liên hệ qua email',
    quota: '2 / 3',
    isAccepting: 1,
    field: 'Hệ thống phân tán, An toàn mạng viễn thông',
    bio: 'Chuyên gia ngoài trường, hướng dẫn các đề tài về bảo mật hệ thống lớn.',
  },
  {
    id: 22,
    name: 'ThS. Võ Thu Hà',
    degree: 'Thạc sĩ',
    department: 'Hệ thống thông tin',
    origin: 'internal',
    email: 'ha.vo@tlu.edu.vn',
    phone: '0902 345 678',
    room: 'Phòng B.305',
    quota: '2 / 4',
    isAccepting: 1,
    field: 'Cơ sở dữ liệu, phân tích dữ liệu',
    bio: 'Hướng dẫn đồ án về CSDL, kho dữ liệu, BI và trực quan hóa.',
  },
  {
    id: 23,
    name: 'TS. Đỗ Thị Mai',
    degree: 'Tiến sĩ',
    department: 'Hệ thống thông tin',
    origin: 'internal',
    email: 'mai.do@tlu.edu.vn',
    phone: '0906 333 444',
    room: 'Phòng B.306',
    quota: '3 / 4',
    isAccepting: 1,
    field: 'Hệ thống thông tin doanh nghiệp, ERP',
    bio: 'Hướng dẫn đồ án phân tích và thiết kế hệ thống ERP, CRM.',
  },
  {
    id: 24,
    name: 'TS. Lê Thanh Tùng',
    degree: 'Tiến sĩ',
    department: 'Mạng & Truyền thông',
    origin: 'internal',
    email: 'tung.le@tlu.edu.vn',
    phone: '0904 567 890',
    room: 'Phòng B.312',
    quota: '4 / 5',
    isAccepting: 1,
    field: 'An toàn thông tin, mạng máy tính',
    bio: 'Hướng dẫn đồ án về bảo mật ứng dụng và hạ tầng mạng.',
  },
  {
    id: 25,
    name: 'ThS. Hoàng Trọng Nghĩa',
    degree: 'Thạc sĩ',
    department: 'Mạng & Truyền thông',
    origin: 'internal',
    email: 'nghia.hoang@tlu.edu.vn',
    phone: '0907 555 666',
    room: 'Phòng B.308',
    quota: '2 / 5',
    isAccepting: 1,
    field: 'Điện toán đám mây, IoT',
    bio: 'Hướng dẫn đồ án về Cloud AWS/GCP, hệ thống IoT thông minh.',
  },
  {
    id: 26,
    name: 'PGS.TS. Phạm Văn Hải',
    degree: 'Phó Giáo sư',
    department: 'Khoa học máy tính',
    origin: 'internal',
    email: 'hai.pham@tlu.edu.vn',
    phone: '0905 111 222',
    room: 'Phòng B.302',
    quota: '4 / 5',
    isAccepting: 1,
    field: 'Khoa học dữ liệu, Hệ khuyến nghị',
    bio: 'Hướng dẫn đồ án về Big Data, Data Science và Deep Learning.',
  },
  {
    id: 27,
    name: 'ThS. Nguyễn Văn Toàn',
    degree: 'Thạc sĩ',
    department: 'Khoa học máy tính',
    origin: 'external',
    unit: 'Đại học Bách khoa Hà Nội',
    email: 'toan.nv@hust.edu.vn',
    phone: '0906 111 222',
    room: 'Liên hệ qua email',
    quota: '1 / 3',
    isAccepting: 1,
    field: 'Học sâu, Thị giác máy tính',
    bio: 'Giảng viên thỉnh giảng, hướng dẫn đề tài về computer vision và học sâu ứng dụng.',
  },
  {
    id: 28,
    name: 'TS. Vũ Quốc Cường',
    degree: 'Tiến sĩ',
    department: 'Trí tuệ nhân tạo',
    origin: 'internal',
    email: 'cuong.vq@tlu.edu.vn',
    phone: '0926 789 012',
    room: 'Phòng B.332',
    quota: '3 / 5',
    isAccepting: 1,
    field: 'Học máy ứng dụng, Xử lý ảnh',
    bio: 'Hướng dẫn đồ án áp dụng AI trong y tế và giao thông thông minh.',
  },
  {
    id: 29,
    name: 'ThS. Trương Ngọc Hà',
    degree: 'Thạc sĩ',
    department: 'Trí tuệ nhân tạo',
    origin: 'internal',
    email: 'ha.tn@tlu.edu.vn',
    phone: '0927 890 123',
    room: 'Phòng B.333',
    quota: '2 / 4',
    isAccepting: 1,
    field: 'Mô hình ngôn ngữ lớn (LLM), Chatbot thông minh',
    bio: 'Hướng dẫn đồ án xây dựng hệ thống hỏi đáp tự động và Retrieval-Augmented Generation (RAG).',
  },
  {
    id: 30,
    name: 'PGS.TS. Đỗ Ngọc Minh',
    degree: 'Phó Giáo sư',
    department: 'Hệ thống thông tin',
    origin: 'external',
    unit: 'Viện Hàn lâm Khoa học & Công nghệ VN',
    email: 'minh.dn@vast.vn',
    phone: '0928 901 234',
    room: 'Liên hệ qua email',
    quota: '2 / 3',
    isAccepting: 1,
    field: 'Khai phá dữ liệu không gian, GIS',
    bio: 'Chuyên gia ngoài trường hướng dẫn đề tài GIS và phân tích dữ liệu viễn thám.',
  },
]

const AVATAR_BG_CLASSES = [
  'bg-[#D81B60]',
  'bg-[#E65100]',
  'bg-[#1E88E5]',
  'bg-[#7B1FA2]',
  'bg-[#00897B]',
  'bg-[#43A047]',
] as const

export function getAvatarBgClass(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % AVATAR_BG_CLASSES.length
  }
  return AVATAR_BG_CLASSES[hash]
}

export function getLecturerInitials(name: string): string {
  const parts = name
    .replace(/^(PGS\.TS\.|PGS\.|TS\.|ThS\.|GS\.)\s*/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return (parts[0] ?? 'GV').slice(0, 2).toUpperCase()
}

export function normalizeDepartment(value: string): string {
  const raw = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^bo mon /, '')
    .replace(/^nganh /, '')
    .replace(/^khoa /, '')
  if (raw.includes('phan mem')) return 'ky thuat phan mem'
  return raw
}

export function cleanDepartmentName(value: string): string {
  return value
    .replace(/^bộ môn\s+/i, '')
    .replace(/^bo mon\s+/i, '')
    .trim()
}

export function isDepartmentMatch(lecDept: string | undefined, filterDept: string | undefined): boolean {
  if (!filterDept) return true
  if (!lecDept) return false
  const normLec = normalizeDepartment(lecDept)
  const normFilter = normalizeDepartment(filterDept)
  return normLec === normFilter || normLec.includes(normFilter) || normFilter.includes(normLec)
}

export function matchMajorToOption(
  majorName: string,
  options: ReadonlyArray<{ value: string; label: string }>,
): string {
  if (!majorName) return ''
  const norm = normalizeDepartment(majorName)
  const exact = options.find((opt) => opt.value && normalizeDepartment(opt.value) === norm)
  if (exact) return exact.value

  const partial = options.find(
    (opt) =>
      opt.value &&
      (normalizeDepartment(opt.value).includes(norm) || norm.includes(normalizeDepartment(opt.value))),
  )
  if (partial) return partial.value
  return majorName
}

export const DEFAULT_TLU_MAJORS: MajorOption[] = [
  { id: 1, name: 'Kỹ thuật phần mềm', code: 'KTPM01' },
  { id: 2, name: 'Hệ thống thông tin', code: 'HTTT01' },
  { id: 3, name: 'Công nghệ thông tin', code: 'CNTT01' },
  { id: 4, name: 'An ninh mạng', code: 'ANM01' },
  { id: 5, name: 'Trí tuệ nhân tạo và Khoa học dữ liệu', code: 'AI01' },
]

export function extractAcademicTitle(name: string, rawTitle?: string): string {
  if (rawTitle && rawTitle.trim()) {
    return rawTitle.trim()
  }
  const match = name.match(/^(PGS\.TS\.|GS\.TS\.|GS\.|PGS\.|TS\.|ThS\.|CN\.|KS\.)/i)
  if (match) {
    return match[1].trim()
  }
  return ''
}

export function extractPlainName(name: string): string {
  return name.replace(/^(PGS\.TS\.|GS\.TS\.|GS\.|PGS\.|TS\.|ThS\.|CN\.|KS\.)\s*/i, '').trim()
}

export function resolveAdvisorDepartment(
  item: SemesterAdvisorResponse,
  isInternal: boolean,
): string {
  // 1. Nếu có majorName trực tiếp
  const directMajor = (
    item.majorName ||
    item.major ||
    (item as any)?.teacher?.majorName ||
    (item as any)?.teacher?.major ||
    (item as any)?.department
  )?.trim()

  if (
    directMajor &&
    directMajor.toLowerCase() !== 'bộ môn' &&
    directMajor.toLowerCase() !== 'bo mon'
  ) {
    return directMajor
  }

  // 2. Nếu là giảng viên ngoài trường và có organization cụ thể
  const org = (item.organization || (item as any)?.teacher?.organization || '').trim()
  if (
    !isInternal &&
    org &&
    !org.toLowerCase().includes('thủy lợi') &&
    !org.toLowerCase().includes('thuy loi')
  ) {
    return org
  }

  // 3. Phán đoán qua email nếu có tiền tố ngành (vd: truongnganh.ktpm@tlu.edu.vn)
  const email = (
    item.teacherEmail ||
    item.email ||
    (item as any)?.teacher?.email ||
    ''
  ).toLowerCase()

  if (email.includes('ktpm') || email.includes('cnpm') || email.includes('phanmem')) {
    return 'Kỹ thuật phần mềm'
  }
  if (email.includes('httt') || email.includes('hethong')) {
    return 'Hệ thống thông tin'
  }
  if (email.includes('cntt') || email.includes('congnghe')) {
    return 'Công nghệ thông tin'
  }
  if (email.includes('anm') || email.includes('anninh') || email.includes('antoan')) {
    return 'An ninh mạng'
  }
  if (email.includes('ai') || email.includes('datascience')) {
    return 'Trí tuệ nhân tạo và Khoa học dữ liệu'
  }

  // 4. Phán đoán qua họ tên giảng viên (vd: GS.TS. Nguyễn Kỹ thuật phần mềm)
  const rawName = (
    item.fullNameWithTitle ||
    item.displayName ||
    item.teacherName ||
    item.name ||
    ''
  ).toLowerCase()

  if (rawName.includes('kỹ thuật phần mềm') || rawName.includes('ky thuat phan mem')) {
    return 'Kỹ thuật phần mềm'
  }
  if (rawName.includes('hệ thống thông tin') || rawName.includes('he thong thong tin')) {
    return 'Hệ thống thông tin'
  }
  if (rawName.includes('công nghệ thông tin') || rawName.includes('cong nghe thong tin')) {
    return 'Công nghệ thông tin'
  }
  if (rawName.includes('an ninh mạng') || rawName.includes('an ninh mang')) {
    return 'An ninh mạng'
  }
  if (rawName.includes('trí tuệ nhân tạo') || rawName.includes('tri tue nhan tao')) {
    return 'Trí tuệ nhân tạo và Khoa học dữ liệu'
  }

  // 5. Khớp tên các giảng viên thực tế trong hệ thống
  if (
    rawName.includes('trần quốc bảo') ||
    rawName.includes('vũ thị lan') ||
    rawName.includes('nguyễn thị hoa') ||
    rawName.includes('trịnh xuân bình')
  ) {
    return 'Kỹ thuật phần mềm'
  }
  if (rawName.includes('nguyễn văn hải')) {
    return 'Hệ thống thông tin'
  }
  if (rawName.includes('lê hoàng nam')) {
    return 'Công nghệ thông tin'
  }

  if (!isInternal) {
    return org || 'Đơn vị ngoài trường'
  }

  return 'Kỹ thuật phần mềm'
}

export function mapAdvisorToLecturer(item: SemesterAdvisorResponse, index: number): Lecturer {
  const rawIsInternal =
    item.isInternal ??
    (item as any)?.teacher?.isInternal ??
    (item as any)?.internal

  const isInternal =
    rawIsInternal !== undefined
      ? Boolean(rawIsInternal)
      : !(
          item.organization &&
          !item.organization.toLowerCase().includes('thủy lợi') &&
          !item.organization.toLowerCase().includes('thuy loi')
        )

  const rawName =
    item.fullNameWithTitle ||
    item.displayName ||
    item.teacherName ||
    item.name ||
    (item as any)?.teacher?.name ||
    ''

  const title = extractAcademicTitle(
    rawName,
    item.academicTitle ||
      item.academicTitleName ||
      (item as any)?.teacher?.academicTitle,
  )

  const plainName = extractPlainName(rawName)
  let fullName = rawName
  if (title && !fullName.toLowerCase().includes(title.toLowerCase())) {
    fullName = `${title} ${plainName}`.trim()
  }

  const dept = resolveAdvisorDepartment(item, isInternal)

  const currentStudents =
    item.currentStudents ?? item.assignedStudents ?? item.occupiedStudents ?? 0
  const maxStudents =
    item.maxStudents ?? (item as any)?.teacher?.maxStudents ?? (isInternal ? 20 : 5)

  return {
    id: item.id ?? item.semesterAdvisorId ?? item.teacherId ?? item.teacherPublicId ?? index + 1,
    teacherPublicId: item.teacherPublicId || (item as any)?.teacher?.publicId,
    teacherCode: item.teacherCode || (item as any)?.teacher?.teacherCode,
    name: fullName || 'Giảng viên',
    plainName: plainName || fullName || 'Giảng viên',
    degree: title,
    department: dept,
    origin: isInternal ? 'internal' : 'external',
    unit:
      item.organization ||
      (item as any)?.teacher?.organization ||
      (isInternal ? 'Trường Đại học Thủy lợi' : 'Đơn vị ngoài trường'),
    email: item.teacherEmail || item.email || (item as any)?.teacher?.email || '',
    phone: item.phone || (item as any)?.teacher?.phone || '',
    room: item.room || '',
    quota:
      maxStudents > 0
        ? `${currentStudents} / ${maxStudents}`
        : currentStudents > 0
          ? `${currentStudents}`
          : '0 / 20',
    maxStudents: maxStudents > 0 ? maxStudents : 20,
    assignedCount: currentStudents,
    isAccepting: maxStudents > 0 ? (currentStudents < maxStudents ? 1 : 0) : 1,
    field: item.field || '',
    bio: item.bio || '',
  }
}

export const lecturerService = {
  getLecturers: async (): Promise<Lecturer[]> => {
    return lecturerService.getSemesterAdvisors('current')
  },

  getSemesterAdvisors: async (semesterId?: string): Promise<Lecturer[]> => {
    const cleanSemesterId = semesterId && semesterId !== 'all' ? semesterId : ''

    // 1. Thử lấy danh sách GVHD trong kỳ qua endpoint /semesters/{id}/advisors
    if (cleanSemesterId) {
      try {
        const res = await apiClient.get<
          ApiResponse<SemesterAdvisorResponse[]> | SemesterAdvisorResponse[]
        >(API_ENDPOINTS.advisor.advisors(cleanSemesterId), {
          skipErrorToast: true,
        })

        let advisors: SemesterAdvisorResponse[] = []
        if (Array.isArray(res.data)) {
          advisors = res.data
        } else if (res.data && Array.isArray((res.data as any).data)) {
          advisors = (res.data as any).data
        } else if (res.data && Array.isArray((res.data as any).content)) {
          advisors = (res.data as any).content
        }

        if (advisors.length > 0) {
          return advisors.map((item, idx) => mapAdvisorToLecturer(item, idx))
        }
      } catch {
        // Tiếp tục thử fallback
      }
    }

    // 2. Thử gọi /semesters/current/advisors
    try {
      const res = await apiClient.get<
        ApiResponse<SemesterAdvisorResponse[]> | SemesterAdvisorResponse[]
      >('/semesters/current/advisors', {
        skipErrorToast: true,
      })

      let advisors: SemesterAdvisorResponse[] = []
      if (Array.isArray(res.data)) {
        advisors = res.data
      } else if (res.data && Array.isArray((res.data as any).data)) {
        advisors = (res.data as any).data
      }

      if (advisors.length > 0) {
        return advisors.map((item, idx) => mapAdvisorToLecturer(item, idx))
      }
    } catch {
      // Tiếp tục thử fallback
    }

    // 3. Fallback sang endpoint danh sách GVHD của sinh viên (availableAdvisors)
    try {
      const res = await apiClient.get<
        ApiResponse<SemesterAdvisorResponse[]> | SemesterAdvisorResponse[]
      >(API_ENDPOINTS.student.availableAdvisors, {
        params: cleanSemesterId ? { semesterPublicId: cleanSemesterId } : undefined,
        skipErrorToast: true,
      })

      let advisors: SemesterAdvisorResponse[] = []
      if (Array.isArray(res.data)) {
        advisors = res.data
      } else if (res.data && Array.isArray((res.data as any).data)) {
        advisors = (res.data as any).data
      }

      if (advisors.length > 0) {
        return advisors.map((item, idx) => mapAdvisorToLecturer(item, idx))
      }
    } catch {
      // Bỏ qua lỗi
    }

    // 4. Fallback danh sách mẫu khi chạy local/dev không có backend
    return [...LECTURERS_MOCK]
  },

  getMajors: async (): Promise<MajorOption[]> => {
    try {
      const res = await apiClient.get<ApiResponse<MajorOption[]> | MajorOption[]>(
        API_ENDPOINTS.major.base,
        { skipErrorToast: true },
      )
      let list: MajorOption[] = []
      if (Array.isArray(res.data)) {
        list = res.data
      } else if (Array.isArray(res.data?.data)) {
        list = res.data.data
      } else if (Array.isArray((res.data as any)?.content)) {
        list = (res.data as any).content
      }
      if (list && list.length > 0) {
        return list
      }
    } catch {
      // Thử fallback sang /majors nếu cần
    }

    try {
      const res = await apiClient.get<ApiResponse<MajorOption[]> | MajorOption[]>(
        '/majors',
        { skipErrorToast: true },
      )
      let list: MajorOption[] = []
      if (Array.isArray(res.data)) {
        list = res.data
      } else if (Array.isArray(res.data?.data)) {
        list = res.data.data
      }
      if (list && list.length > 0) {
        return list
      }
    } catch {
      // Bỏ qua lỗi
    }

    return [...DEFAULT_TLU_MAJORS]
  },
}
