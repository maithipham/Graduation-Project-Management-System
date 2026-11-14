import type { StudentReportSubmissionItem } from '../types/reports.types'

export const INITIAL_REPORT_SUBMISSIONS: StudentReportSubmissionItem[] = [
  {
    id: 1,
    year: '2026-2027',
    semester: 'HK1',
    time: '12/10/2026 09:15',
    fileName: 'Bao_cao_DATN_v2.pdf',
    status: 'Đã từ chối',
    approvedTime: '13/10/2026 10:15',
    plagiarismFile: 'Bao-cao-do-an-2251060321.pdf',
    plagiarismRate: 42,
    note: 'Tỷ lệ trùng lặp 42% vượt quá ngưỡng cho phép (<= 35%). Cần viết lại và trích dẫn đầy đủ.',
  },
  {
    id: 2,
    year: '2026-2027',
    semester: 'HK1',
    time: '05/10/2026 14:30',
    fileName: 'Bao_cao_DATN_v1.docx',
    status: 'Đã duyệt',
    approvedTime: '06/10/2026 16:20',
    plagiarismFile: 'Bao-cao-do-an-2251060321.pdf',
    plagiarismRate: 18,
    note: 'Báo cáo tiến độ đạt yêu cầu, tỷ lệ trùng lặp 18% hợp lệ (<= 35%).',
  },
  {
    id: 3,
    year: '2025-2026',
    semester: 'HK2',
    time: '20/04/2026 16:00',
    fileName: 'Bao_cao_tien_do_HK2_2526.pdf',
    status: 'Đã duyệt',
    approvedTime: '22/04/2026 09:00',
    plagiarismFile: 'Bao-cao-do-an-2151060001.pdf',
    plagiarismRate: 12,
    note: 'Báo cáo tiến độ giai đoạn 2 hoàn thành tốt.',
  },
]

export function formatReportNow(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`
}

export function formatReportFileSize(bytes: number): string {
  const kb = Math.round(bytes / 1024)
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`
}



export const reportsService = {
  getInitialSubmissions: (): StudentReportSubmissionItem[] => [...INITIAL_REPORT_SUBMISSIONS],
  formatNow: formatReportNow,
}
