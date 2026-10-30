import { STUDENT_TOPIC_STORAGE_KEYS } from '@/shared/constants/studentProfile.mock'
import type {
  OutlineEditorData,
  OutlineSectionConfig,
  OutlineSubmissionItem,
} from '../types/outline.types'

export const OUTLINE_SECTIONS: OutlineSectionConfig[] = [
  {
    key: 'reason',
    title: '1. Lý do chọn đề tài',
    hint: 'Nêu tính cấp thiết, bối cảnh và động lực thực hiện đề tài.',
    required: true,
    rows: 4,
  },
  {
    key: 'objectives',
    title: '2. Mục tiêu của đề tài',
    hint: 'Mục tiêu tổng quát và các mục tiêu cụ thể, có thể đo lường được.',
    required: true,
    rows: 4,
  },
  {
    key: 'scope',
    title: '3. Đối tượng và phạm vi nghiên cứu',
    hint: 'Xác định rõ đối tượng, phạm vi dữ liệu, công nghệ và giới hạn của đề tài.',
    required: true,
    rows: 3,
  },
  {
    key: 'methods',
    title: '4. Phương pháp nghiên cứu',
    hint: 'Các phương pháp, công cụ, quy trình phát triển sẽ sử dụng.',
    required: true,
    rows: 4,
  },
  {
    key: 'structure',
    title: '5. Nội dung và cấu trúc đồ án',
    hint: 'Dự kiến các chương/mục chính của quyển đồ án.',
    required: true,
    rows: 5,
  },
  {
    key: 'expected',
    title: '6. Kết quả dự kiến',
    hint: 'Sản phẩm, báo cáo, kết quả định lượng mong đợi khi hoàn thành.',
    required: false,
    rows: 3,
  },
  {
    key: 'references',
    title: '7. Tài liệu tham khảo',
    hint: 'Mỗi tài liệu một dòng, theo chuẩn trích dẫn của trường.',
    required: true,
    rows: 4,
  },
]

export const INITIAL_OUTLINE_SUBMISSIONS: OutlineSubmissionItem[] = [
  {
    id: 1,
    year: '2026-2027',
    semester: 'HK1',
    source: 'file',
    time: '12/10/2026 09:15',
    fileName: 'De_cuong_DATN_v2.pdf',
    status: 'Đã từ chối',
    approvedTime: '10/10/2026 09:15',
    note: 'Bổ sung mục tiêu đo lường cụ thể và làm rõ phạm vi dữ liệu thử nghiệm.',
  },
  {
    id: 2,
    year: '2026-2027',
    semester: 'HK1',
    source: 'file',
    time: '09/10/2026 20:40',
    fileName: 'De_cuong_DATN_v1.pdf',
    status: 'Đã từ chối',
    approvedTime: '10/10/2026 09:15',
    note: 'Thiếu phần tài liệu tham khảo và phương pháp nghiên cứu chưa rõ ràng.',
  },
  {
    id: 3,
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

export function createEmptyOutlineEditorData(topicVi: string): OutlineEditorData {
  return {
    topicVi,
    topicEn: '',
    reason: '',
    objectives: '',
    scope: '',
    methods: '',
    structure: '',
    expected: '',
    references: '',
    plan: [
      { task: '', time: '', result: '' },
      { task: '', time: '', result: '' },
      { task: '', time: '', result: '' },
    ],
  }
}

export function loadSavedOutlineDraft(defaultTopicVi: string): OutlineEditorData {
  const base = createEmptyOutlineEditorData(defaultTopicVi)
  try {
    const raw = localStorage.getItem(STUDENT_TOPIC_STORAGE_KEYS.outlineDraft)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<OutlineEditorData> | null
      if (parsed && typeof parsed === 'object') {
        return {
          ...base,
          ...parsed,
          plan:
            Array.isArray(parsed.plan) && parsed.plan.length > 0
              ? parsed.plan
              : base.plan,
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
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}


export const outlineService = {
  loadDraft: (topic: string = ''): OutlineEditorData => loadSavedOutlineDraft(topic),
  getInitialSubmissions: (): OutlineSubmissionItem[] => [...INITIAL_OUTLINE_SUBMISSIONS],
  createEmptyDraft: (topic: string = ''): OutlineEditorData => createEmptyOutlineEditorData(topic),
  formatNow: formatOutlineNow,
}
