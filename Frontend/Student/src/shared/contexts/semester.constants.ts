export type SemesterCode = 'HK1' | 'HK2'

export interface StudentTerm {
  year: string
  semester: SemesterCode
}

export interface SemesterSelectItem {
  value: SemesterCode
  label: string
}

export interface SemesterOption {
  id: string
  label: string
}

export interface TermDeadlineInfo {
  outlineDeadline?: string
  reportDeadline?: string
}

export interface TimelineMilestone {
  stage: number
  title: string
  start?: string
  end: string
}

export const TERM_STORAGE_KEY = 'student_term_filter_v1'

export const ACADEMIC_YEARS = ['2026-2027', '2025-2026', '2024-2025'] as const

export const ACADEMIC_SEMESTERS: readonly SemesterSelectItem[] = [
  { value: 'HK1', label: 'Học kỳ 1' },
  { value: 'HK2', label: 'Học kỳ 2' },
]

export const DEFAULT_TERM: StudentTerm = {
  year: '2026-2027',
  semester: 'HK2',
}

export const DEFAULT_SEMESTERS: SemesterOption[] = [
  { id: '2026-2027|HK2', label: '2026-2027 · Học kỳ 2' },
  { id: '2026-2027|HK1', label: '2026-2027 · Học kỳ 1' },
  { id: '2025-2026|HK2', label: '2025-2026 · Học kỳ 2' },
]

export const STEPPER_STAGES = [
  { title: 'Đăng ký giảng viên hướng dẫn' },
  { title: 'Làm đề cương' },
  { title: 'Làm đồ án' },
  { title: 'Phản biện' },
  { title: 'Bảo vệ đồ án' },
] as const

export const TERM_DEADLINES: Record<string, TermDeadlineInfo> = {
  '2026-2027|HK2': {
    outlineDeadline: '31/10/2026 23:59',
    reportDeadline: '28/10/2026 23:59:55',
  },
  '2026-2027|HK1': {
    outlineDeadline: '31/10/2026 23:59',
    reportDeadline: '28/10/2026 23:59:55',
  },
  '2025-2026|HK2': {
    outlineDeadline: '31/03/2026 23:59',
    reportDeadline: '30/04/2026 23:59:55',
  },
}

export const TERM_TIMELINES: Record<string, TimelineMilestone[]> = {
  '2026-2027|HK2': [
    {
      stage: 0,
      title: 'Đăng ký giảng viên hướng dẫn',
      start: '2026-10-01T00:00:00+07:00',
      end: '2026-11-15T23:59:59+07:00',
    },
    {
      stage: 1,
      title: 'Làm đề cương',
      start: '2026-11-16T00:00:00+07:00',
      end: '2026-11-30T23:59:59+07:00',
    },
    {
      stage: 2,
      title: 'Làm đồ án',
      start: '2026-12-01T00:00:00+07:00',
      end: '2026-12-31T23:59:59+07:00',
    },
    {
      stage: 3,
      title: 'Phản biện',
      start: '2027-01-01T00:00:00+07:00',
      end: '2027-01-08T23:59:59+07:00',
    },
    {
      stage: 4,
      title: 'Bảo vệ đồ án',
      start: '2027-01-09T00:00:00+07:00',
      end: '2027-01-15T23:59:59+07:00',
    },
  ],
  '2026-2027|HK1': [
    {
      stage: 0,
      title: 'Đăng ký giảng viên hướng dẫn',
      start: '2026-09-15T00:00:00+07:00',
      end: '2026-10-15T23:59:59+07:00',
    },
    {
      stage: 1,
      title: 'Làm đề cương',
      start: '2026-10-16T00:00:00+07:00',
      end: '2026-10-31T23:59:59+07:00',
    },
    {
      stage: 2,
      title: 'Làm đồ án',
      start: '2026-11-01T00:00:00+07:00',
      end: '2026-12-15T23:59:59+07:00',
    },
    {
      stage: 3,
      title: 'Phản biện',
      start: '2026-12-16T00:00:00+07:00',
      end: '2026-12-25T23:59:59+07:00',
    },
    {
      stage: 4,
      title: 'Bảo vệ đồ án',
      start: '2026-12-26T00:00:00+07:00',
      end: '2027-01-05T23:59:59+07:00',
    },
  ],
  '2025-2026|HK2': [
    {
      stage: 0,
      title: 'Đăng ký giảng viên hướng dẫn',
      start: '2026-02-01T00:00:00+07:00',
      end: '2026-03-01T23:59:59+07:00',
    },
    {
      stage: 1,
      title: 'Làm đề cương',
      start: '2026-03-02T00:00:00+07:00',
      end: '2026-03-31T23:59:59+07:00',
    },
    {
      stage: 2,
      title: 'Làm đồ án',
      start: '2026-04-01T00:00:00+07:00',
      end: '2026-05-15T23:59:59+07:00',
    },
    {
      stage: 3,
      title: 'Phản biện',
      start: '2026-05-16T00:00:00+07:00',
      end: '2026-05-25T23:59:59+07:00',
    },
    {
      stage: 4,
      title: 'Bảo vệ đồ án',
      start: '2026-05-26T00:00:00+07:00',
      end: '2026-06-05T23:59:59+07:00',
    },
  ],
  '2025-2026|HK1': [
    {
      stage: 0,
      title: 'Đăng ký giảng viên hướng dẫn',
      start: '2025-09-01T00:00:00+07:00',
      end: '2025-09-30T23:59:59+07:00',
    },
    {
      stage: 1,
      title: 'Làm đề cương',
      start: '2025-10-01T00:00:00+07:00',
      end: '2025-10-31T23:59:59+07:00',
    },
    {
      stage: 2,
      title: 'Làm đồ án',
      start: '2025-11-01T00:00:00+07:00',
      end: '2025-12-15T23:59:59+07:00',
    },
    {
      stage: 3,
      title: 'Phản biện',
      start: '2025-12-16T00:00:00+07:00',
      end: '2025-12-25T23:59:59+07:00',
    },
    {
      stage: 4,
      title: 'Bảo vệ đồ án',
      start: '2025-12-26T00:00:00+07:00',
      end: '2026-01-05T23:59:59+07:00',
    },
  ],
  '2024-2025|HK2': [
    {
      stage: 0,
      title: 'Đăng ký giảng viên hướng dẫn',
      start: '2025-02-01T00:00:00+07:00',
      end: '2025-03-01T23:59:59+07:00',
    },
    {
      stage: 1,
      title: 'Làm đề cương',
      start: '2025-03-02T00:00:00+07:00',
      end: '2025-03-31T23:59:59+07:00',
    },
    {
      stage: 2,
      title: 'Làm đồ án',
      start: '2025-04-01T00:00:00+07:00',
      end: '2025-05-15T23:59:59+07:00',
    },
    {
      stage: 3,
      title: 'Phản biện',
      start: '2025-05-16T00:00:00+07:00',
      end: '2025-05-25T23:59:59+07:00',
    },
    {
      stage: 4,
      title: 'Bảo vệ đồ án',
      start: '2025-05-26T00:00:00+07:00',
      end: '2025-06-05T23:59:59+07:00',
    },
  ],
  '2024-2025|HK1': [
    {
      stage: 0,
      title: 'Đăng ký giảng viên hướng dẫn',
      start: '2024-09-01T00:00:00+07:00',
      end: '2024-09-30T23:59:59+07:00',
    },
    {
      stage: 1,
      title: 'Làm đề cương',
      start: '2024-10-01T00:00:00+07:00',
      end: '2024-10-31T23:59:59+07:00',
    },
    {
      stage: 2,
      title: 'Làm đồ án',
      start: '2024-11-01T00:00:00+07:00',
      end: '2024-12-15T23:59:59+07:00',
    },
    {
      stage: 3,
      title: 'Phản biện',
      start: '2024-12-16T00:00:00+07:00',
      end: '2024-12-25T23:59:59+07:00',
    },
    {
      stage: 4,
      title: 'Bảo vệ đồ án',
      start: '2024-12-26T00:00:00+07:00',
      end: '2025-01-05T23:59:59+07:00',
    },
  ],
}

export function loadSavedTerm(): StudentTerm {
  try {
    const raw = localStorage.getItem(TERM_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StudentTerm> | null
      if (
        parsed &&
        typeof parsed.year === 'string' &&
        (ACADEMIC_YEARS as readonly string[]).includes(parsed.year) &&
        (parsed.semester === 'HK1' || parsed.semester === 'HK2')
      ) {
        return { year: parsed.year, semester: parsed.semester }
      }
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_TERM
}

export function saveTermToStorage(term: StudentTerm): void {
  try {
    localStorage.setItem(TERM_STORAGE_KEY, JSON.stringify(term))
  } catch {
    // ignore storage errors
  }
}

export function getTermInfo(term: StudentTerm): TermDeadlineInfo {
  return TERM_DEADLINES[`${term.year}|${term.semester}`] ?? {}
}

export function getTermLabel(term: StudentTerm): string {
  const sem = ACADEMIC_SEMESTERS.find((item) => item.value === term.semester)
  return `${sem ? sem.label : term.semester} - Năm học ${term.year}`
}

/**
 * Xác định giai đoạn hiện tại hoàn toàn theo mốc thời gian của lộ trình đồ án học kỳ
 * (không phụ thuộc màn hình đang mở, hàm thuần túy nhận vào nowMs).
 */
export function getTimelineStageIndex(term: StudentTerm, nowMs: number): number {
  const key = `${term.year}|${term.semester}`
  const milestones = TERM_TIMELINES[key]

  if (!milestones || milestones.length === 0) {
    const startYear = Number.parseInt(String(term.year).split('-')[0] ?? '', 10)
    if (!Number.isNaN(startYear) && startYear < 2026) return 4
    return 0
  }

  for (let i = 0; i < milestones.length; i += 1) {
    const endMs = Date.parse(milestones[i].end)
    if (!Number.isNaN(endMs) && nowMs <= endMs) {
      return i
    }
  }
  return milestones.length - 1
}

