import { API_SUCCESS_CODE } from '@/shared/types'
import type {
  RowImportStatus,
  StudentImportRowResult,
  StudentWriteResult,
} from '../types'
import type { CreateStudentFormInput, CreateStudentFormValues } from './createStudentSchema'

/** Thứ tự tab: việc cần xử lý (lỗi) lên trước */
export const IMPORT_TAB_ORDER: RowImportStatus[] = ['ERROR', 'WARNING', 'SUCCESS']

export type ImportRowCounts = Record<RowImportStatus, number>

/**
 * Đếm theo trạng thái hiện tại của từng dòng (đổi khi gửi lại dòng lỗi thành công).
 * Dùng chung cho kết quả import sinh viên và giáo viên
 */
export function countRowsByStatus(rows: { status: RowImportStatus }[]): ImportRowCounts {
  const counts: ImportRowCounts = { ERROR: 0, WARNING: 0, SUCCESS: 0 }
  for (const row of rows) counts[row.status] += 1
  return counts
}

/** Tab mở sẵn: tab đầu tiên có dữ liệu theo thứ tự Lỗi → Cảnh báo → Thành công */
export function pickDefaultTab(counts: ImportRowCounts): RowImportStatus {
  return IMPORT_TAB_ORDER.find((status) => counts[status] > 0) ?? 'ERROR'
}

/** Dòng import → giá trị form sửa. Ô trống trong Excel có thể về `null` */
export function importRowToFormValues(row: StudentImportRowResult): CreateStudentFormInput {
  return {
    studentCode: row.studentCode ?? '',
    firstName: row.firstName ?? '',
    lastName: row.lastName ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    batch: row.batch ?? '',
    className: row.className ?? '',
    major: row.majorName ?? '', // POST /student nhận tên ngành ở field `major`
  }
}

/** Ghi dữ liệu vừa gửi lại vào dòng, để mở lại form vẫn thấy bản đã sửa */
function withValues(row: StudentImportRowResult, values: CreateStudentFormValues): StudentImportRowResult {
  return {
    ...row,
    studentCode: values.studentCode,
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    phone: values.phone,
    batch: values.batch,
    className: values.className,
    majorName: values.major,
  }
}

/** Gửi lại thành công (1000) → Thành công; cảnh báo (11xx) → Cảnh báo. Message lấy đúng câu của BE */
export function applyRetrySuccess(
  row: StudentImportRowResult,
  values: CreateStudentFormValues,
  result: StudentWriteResult,
): StudentImportRowResult {
  return {
    ...withValues(row, values),
    status: result.code === API_SUCCESS_CODE ? 'SUCCESS' : 'WARNING',
    message: result.message,
  }
}

/** Gửi lại vẫn lỗi → giữ ở tab Lỗi, cập nhật lý do mới */
export function applyRetryError(
  row: StudentImportRowResult,
  values: CreateStudentFormValues,
  message: string,
): StudentImportRowResult {
  return { ...withValues(row, values), status: 'ERROR', message }
}
