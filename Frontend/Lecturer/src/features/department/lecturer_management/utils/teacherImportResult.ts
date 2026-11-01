import { API_SUCCESS_CODE } from '@/shared/types'
import type { TeacherImportRowResult, TeacherWriteResult } from '../types'
import {
  getTeacherEmailRule,
  type CreateTeacherFormInput,
  type CreateTeacherFormValues,
} from './createTeacherSchema'

const DEFAULT_RETRY_SUCCESS_MESSAGE = 'Thêm giáo viên thành công'

/**
 * Dòng import → giá trị form sửa.
 * Email ngoài trường thì bỏ ngành (ô Ngành bị khóa, giữ lại thì không xóa được và BE vẫn báo lỗi)
 */
export function importRowToFormValues(row: TeacherImportRowResult): CreateTeacherFormInput {
  const external = getTeacherEmailRule(row.email)?.internal === false
  return {
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    organization: row.organization,
    major: external ? '' : row.majorName, // POST /teacher nhận tên hoặc mã ngành ở field `major`
    amount: '',
    academicTitle: '',
  }
}

/** Ghi dữ liệu vừa gửi lại vào dòng, để mở lại form vẫn thấy bản đã sửa */
function withValues(
  row: TeacherImportRowResult,
  values: CreateTeacherFormValues,
): TeacherImportRowResult {
  return {
    ...row,
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    phone: values.phone,
    organization: values.organization,
    majorName: values.major,
    amount: values.amount === null || values.amount === undefined ? null : Number(values.amount),
  }
}

/** Gửi lại thành công (1000) → Thành công; cảnh báo (1100) → Cảnh báo. Message lấy đúng câu của BE */
export function applyRetrySuccess(
  row: TeacherImportRowResult,
  values: CreateTeacherFormValues,
  result: TeacherWriteResult,
): TeacherImportRowResult {
  const success = result.code === API_SUCCESS_CODE
  return {
    ...withValues(row, values),
    status: success ? 'SUCCESS' : 'WARNING',
    message: result.message || (success ? DEFAULT_RETRY_SUCCESS_MESSAGE : ''),
  }
}

/**
 * Gửi lại bị lỗi (3006, 3007...):
 * Giữ nguyên trạng thái ERROR, đổi message theo lỗi mới nhất của BE (VD: sửa xong email nhưng trùng SĐT)
 */
export function applyRetryError(
  row: TeacherImportRowResult,
  values: CreateTeacherFormValues,
  message: string,
): TeacherImportRowResult {
  return {
    ...withValues(row, values),
    message,
  }
}
