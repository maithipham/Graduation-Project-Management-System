import { STUDENT_TOPIC_STORAGE_KEYS } from '@/shared/constants/studentProfile.mock'
import type {
  OutlineEditorData,
  OutlineScheduleRow,
  OutlineSectionConfig,
  OutlineSubmissionItem,
  StudentOutlineMeta,
} from '../types/outline.types'

export const OUTLINE_CONTENT_SECTIONS: OutlineSectionConfig[] = [
  {
    key: 'summary',
    title: 'TÓM TẮT ĐỀ TÀI',
    hint: 'Nêu ngắn gọn lý do chọn đề tài, tính cấp thiết, vấn đề giải quyết và phạm vi tổng quan.',
    required: true,
    rows: 4,
  },
  {
    key: 'objectives',
    title: 'CÁC MỤC TIÊU CHÍNH',
    hint: 'Các mục tiêu cụ thể cần đạt được về phương pháp, mô hình, chức năng và sản phẩm phần mềm.',
    required: true,
    rows: 4,
  },
  {
    key: 'expectedResults',
    title: 'KẾT QUẢ DỰ KIẾN',
    hint: 'Kết quả định lượng, tài liệu phân tích thiết kế, sản phẩm hoàn thiện và báo cáo tổng kết.',
    required: true,
    rows: 4,
  },
  {
    key: 'references',
    title: 'TÀI LIỆU THAM KHẢO',
    hint: 'Mỗi tài liệu một dòng (sách, bài báo khoa học, trang tài liệu kỹ thuật...).',
    required: true,
    rows: 4,
  },
]

// Backward-compatible alias
export const OUTLINE_SECTIONS = OUTLINE_CONTENT_SECTIONS

export const DEFAULT_SCHEDULE_ROWS: OutlineScheduleRow[] = [
  {
    step: 1,
    time: 'Tuần 1 - Tuần 4',
    task: 'Khảo sát hiện trạng, thu thập yêu cầu và nghiên cứu công nghệ liên quan',
    expectedResult: 'Tài liệu đặc tả yêu cầu phần mềm (SRS)',
  },
  {
    step: 2,
    time: 'Tuần 5 - Tuần 8',
    task: 'Thiết kế kiến trúc hệ thống tổng thể, thiết kế cơ sở dữ liệu và giao diện người dùng',
    expectedResult: 'Tài liệu thiết kế kiến trúc, lược đồ CSDL và mockup UI',
  },
  {
    step: 3,
    time: 'Tuần 9 - Tuần 13',
    task: 'Hiện thực hóa các mô-đun chức năng chính, tích hợp phân hệ và triển khai thử nghiệm',
    expectedResult: 'Mã nguồn hoàn thiện các chức năng và môi trường chạy thử',
  },
  {
    step: 4,
    time: 'Tuần 14 - Tuần 15',
    task: 'Kiểm thử toàn diện hệ thống, đánh giá kết quả, viết báo cáo tốt nghiệp và chuẩn bị thuyết trình',
    expectedResult: 'Báo cáo đồ án tốt nghiệp hoàn chỉnh và slide bảo vệ',
  },
]

export const SAMPLE_EDITOR_OUTLINE: OutlineEditorData = {
  topic: 'Xây dựng hệ thống Quản lý Đồ án Tốt nghiệp trực tuyến (GPMS)',
  studentName: 'Phạm Mai',
  className: '21DH-CNTT1',
  mssv: '2151060001',
  phone: '0912 345 678',
  email: 'mai.pham@student.tlu.edu.vn',
  supervisor1: 'TS. Nguyễn Thu Thủy',
  supervisor2: '',
  summary:
    'Đồ án tập trung xây dựng hệ thống trực tuyến hỗ trợ sinh viên, giảng viên và bộ môn trong quy trình quản lý đồ án tốt nghiệp từ khâu đăng ký giảng viên hướng dẫn, đề xuất và duyệt tên đề tài, nộp đề cương trực tuyến đến theo dõi tiến độ và đánh giá kết quả. Hệ thống giải quyết các bất cập trong quản lý thủ công, tối ưu hóa thời gian xử lý và nâng cao tính minh bạch.',
  objectives:
    '- Nghiên cứu quy trình quản lý đồ án tốt nghiệp hiện hành tại Khoa Công nghệ thông tin - Trường Đại học Thủy Lợi.\n- Phân tích và thiết kế hệ thống phần mềm đáp ứng đầy đủ các nghiệp vụ của sinh viên, giảng viên hướng dẫn và trưởng bộ môn.\n- Xây dựng ứng dụng web với giao diện hiện đại, thân thiện, tương thích đa thiết bị và đảm bảo an toàn thông tin.',
  expectedResults:
    '- Tài liệu phân tích yêu cầu (SRS) và tài liệu thiết kế hệ thống (SDD).\n- Hệ thống phần mềm web hoàn chỉnh có các chức năng: nộp đề cương trực tuyến, phê duyệt đề tài, phản hồi nhận xét và theo dõi tiến độ.\n- Bản tổng kết đánh giá hiệu năng và báo cáo đồ án tốt nghiệp đúng quy chuẩn.',
  schedule: DEFAULT_SCHEDULE_ROWS,
  references:
    '[1] Pressman, R. S. Software Engineering: A Practitioner\'s Approach, 8th Edition, McGraw-Hill, 2014.\n[2] React Official Documentation, https://react.dev/\n[3] Khoa CNTT - ĐHTL, Quy định về quản lý đồ án tốt nghiệp đại học, 2026.',
}

export const INITIAL_OUTLINE_SUBMISSIONS: OutlineSubmissionItem[] = [
  {
    id: 1,
    year: '2026-2027',
    semester: 'HK1',
    source: 'editor',
    editorData: SAMPLE_EDITOR_OUTLINE,
    time: '28/10/2026 10:15',
    fileName: 'De_cuong_2151060001_Pham_Mai.docx',
    status: 'Đã duyệt',
    approvedTime: '29/10/2026 14:20',
    note: 'Đề cương đạt yêu cầu, kế hoạch phân chia rõ ràng và bám sát tiến độ học kỳ.',
  },
  {
    id: 2,
    year: '2026-2027',
    semester: 'HK1',
    source: 'file',
    time: '12/10/2026 09:15',
    fileName: 'De_cuong_DATN_v2.pdf',
    status: 'Đã từ chối',
    approvedTime: '13/10/2026 09:15',
    note: 'Bổ sung mục tiêu đo lường cụ thể và làm rõ phạm vi dữ liệu thử nghiệm.',
  },
  {
    id: 3,
    year: '2026-2027',
    semester: 'HK1',
    source: 'file',
    time: '09/10/2026 20:40',
    fileName: 'De_cuong_DATN_v1.pdf',
    status: 'Đã từ chối',
    approvedTime: '10/10/2026 09:15',
    note: 'Thiếu phần tài liệu tham khảo và bảng tiến độ thực hiện chưa rõ ràng.',
  },
  {
    id: 4,
    year: '2025-2026',
    semester: 'HK2',
    source: 'file',
    time: '15/03/2026 14:20',
    fileName: 'De_cuong_DATN_HK2_2526.pdf',
    status: 'Đã duyệt',
    approvedTime: '16/03/2026 10:00',
    note: 'Đề cương đạt yêu cầu.',
  },
]

export function createEmptyOutlineEditorData(
  topic: string = '',
  meta?: Partial<StudentOutlineMeta>,
): OutlineEditorData {
  return {
    topic: topic || '',
    studentName: meta?.name || '',
    className: meta?.className || '',
    mssv: meta?.mssv || '',
    phone: meta?.phone || '',
    email: meta?.email || '',
    supervisor1: meta?.mentor || '',
    supervisor2: '',
    summary: '',
    objectives: '',
    expectedResults: '',
    schedule: DEFAULT_SCHEDULE_ROWS.map((r) => ({ ...r })),
    references: '',
    topicVi: topic || '',
  }
}

export function loadSavedOutlineDraft(
  defaultTopic: string,
  meta?: Partial<StudentOutlineMeta>,
): OutlineEditorData {
  const base = createEmptyOutlineEditorData(defaultTopic, meta)
  try {
    const raw = localStorage.getItem(STUDENT_TOPIC_STORAGE_KEYS.outlineDraft)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<OutlineEditorData> | null
      if (parsed && typeof parsed === 'object') {
        const schedule =
          Array.isArray(parsed.schedule) && parsed.schedule.length > 0
            ? parsed.schedule
            : Array.isArray(parsed.plan) && parsed.plan.length > 0
              ? parsed.plan.map((p, idx) => ({
                  step: idx + 1,
                  time: p.time,
                  task: p.task,
                  expectedResult: p.result,
                }))
              : base.schedule

        return {
          ...base,
          ...parsed,
          topic: parsed.topic || parsed.topicVi || defaultTopic || base.topic,
          studentName: parsed.studentName || base.studentName,
          className: parsed.className || base.className,
          mssv: parsed.mssv || base.mssv,
          phone: parsed.phone || base.phone,
          email: parsed.email || base.email,
          supervisor1: parsed.supervisor1 || base.supervisor1,
          supervisor2: parsed.supervisor2 || '',
          summary: parsed.summary || parsed.reason || '',
          objectives: parsed.objectives || '',
          expectedResults: parsed.expectedResults || parsed.expected || '',
          references: parsed.references || '',
          schedule,
        }
      }
    }
  } catch {
    // ignore storage errors
  }
  return base
}

export function buildDefaultDocxFileName(mssv: string, name: string): string {
  const safeName = String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return `De_cuong_${mssv || 'MSSV'}_${safeName || 'HoTen'}.docx`
}

export function formatOutlineNow(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
}

export const outlineService = {
  getInitialSubmissions: (): OutlineSubmissionItem[] => INITIAL_OUTLINE_SUBMISSIONS,
  loadDraft: (topic: string = '', meta?: Partial<StudentOutlineMeta>): OutlineEditorData =>
    loadSavedOutlineDraft(topic, meta),
  createEmptyDraft: (topic: string = '', meta?: Partial<StudentOutlineMeta>): OutlineEditorData =>
    createEmptyOutlineEditorData(topic, meta),
}
