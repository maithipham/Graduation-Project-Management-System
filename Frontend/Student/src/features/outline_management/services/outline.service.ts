import { API_ENDPOINTS, apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type {
  OutlineEditorData,
  OutlineScheduleRow,
  OutlineSectionConfig,
  StudentOutlineMeta,
  SubmitOutlineRequest,
  ThesisOutlineResponse,
} from '../types/outline.types'

export const OUTLINE_DRAFT_STORAGE_KEY = 'student_outline_draft_v1'

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
    const raw = localStorage.getItem(OUTLINE_DRAFT_STORAGE_KEY)
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

/** Kiểm tra URL tệp an toàn trước khi gắn vào href / iframe. */
export function isSafeFileUrl(url?: string | null): boolean {
  if (!url) return false
  const trimmed = url.trim()
  return /^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')
}

/** Tách tên tệp hiển thị từ URL Cloudinary hoặc đường dẫn tệp do BE trả về. */
export function extractOutlineFileName(fileUrl?: string | null): string {
  if (!fileUrl) return 'Tệp đề cương'
  const withoutQuery = fileUrl.trim().split('?')[0].split('#')[0]
  const segments = withoutQuery.split('/').filter(Boolean)
  const rawName = segments[segments.length - 1]
  if (!rawName) return fileUrl
  try {
    return decodeURIComponent(rawName)
  } catch {
    return rawName
  }
}

export const outlineService = {
  /** Lấy thông tin đề cương hiện tại, lịch sử nộp và hạn nộp (GET /outline/my-outline). */
  async getMyOutline(semesterId?: string): Promise<ThesisOutlineResponse> {
    const res = await apiClient.get<ApiResponse<ThesisOutlineResponse>>(
      API_ENDPOINTS.outline.myOutline,
      { params: semesterId ? { semesterId } : undefined },
    )
    return res.data.data
  },

  /** Nộp mới hoặc nộp lại file đề cương (POST /outline/submit). */
  async submitOutline(payload: SubmitOutlineRequest): Promise<void> {
    const formData = new FormData()
    formData.append('file', payload.file)
    if (payload.submissionNote?.trim()) {
      formData.append('submissionNote', payload.submissionNote.trim())
    }
    if (payload.title?.trim()) {
      formData.append('title', payload.title.trim())
    }

    await apiClient.post<ApiResponse<void>>(API_ENDPOINTS.outline.submit, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  loadDraft: (topic: string = '', meta?: Partial<StudentOutlineMeta>): OutlineEditorData =>
    loadSavedOutlineDraft(topic, meta),
  createEmptyDraft: (topic: string = '', meta?: Partial<StudentOutlineMeta>): OutlineEditorData =>
    createEmptyOutlineEditorData(topic, meta),
}
