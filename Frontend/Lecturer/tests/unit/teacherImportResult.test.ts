import { describe, expect, it } from 'vitest'
import type { TeacherImportRowResult } from '@/features/department/lecturer_management/types'
import {
  applyRetryError,
  applyRetrySuccess,
  importRowToFormValues,
} from '@/features/department/lecturer_management/utils/teacherImportResult'

const ROW: TeacherImportRowResult = {
  rowNumber: 3,
  firstName: 'Nguyễn Văn',
  lastName: 'An',
  email: 'an.nv@tlu.edu.vn',
  phone: '0987654321',
  organization: 'Trường Đại học Thủy lợi',
  majorName: '7480103',
  amount: null,
  status: 'ERROR',
  message: 'Số điện thoại đã tồn tại',
}

const VALUES = {
  firstName: 'Nguyễn Văn',
  lastName: 'An',
  email: 'an.nv@tlu.edu.vn',
  phone: '0912345678',
  organization: 'Trường Đại học Thủy lợi',
  major: '7480103',
  amount: null,
}

describe('importRowToFormValues', () => {
  it('giữ nguyên ngành (cả mã ngành), hạn mức để trống cho BE tự gán', () => {
    expect(importRowToFormValues(ROW)).toMatchObject({ major: '7480103', amount: '' })
  })

  it('email ngoài trường → bỏ ngành', () => {
    expect(importRowToFormValues({ ...ROW, email: 'an@gmail.com', majorName: 'KTPM' }).major).toBe('')
  })
})

describe('applyRetrySuccess / applyRetryError', () => {
  it('1000 → SUCCESS, message rỗng thì dùng câu mặc định; ghi lại dữ liệu đã sửa', () => {
    const row = applyRetrySuccess(ROW, VALUES, { code: 1000, message: '' })
    expect(row).toMatchObject({
      status: 'SUCCESS',
      message: 'Thêm giáo viên thành công',
      phone: '0912345678',
      amount: null,
    })
  })

  it('1100 → WARNING với message của BE; hạn mức nhập tay đổi sang số', () => {
    const row = applyRetrySuccess(ROW, { ...VALUES, amount: '15' }, { code: 1100, message: 'Đã tồn tại' })
    expect(row).toMatchObject({ status: 'WARNING', message: 'Đã tồn tại', amount: 15 })
  })

  it('vẫn lỗi → ERROR với lý do mới', () => {
    expect(applyRetryError(ROW, VALUES, 'Email đã tồn tại')).toMatchObject({
      status: 'ERROR',
      message: 'Email đã tồn tại',
      rowNumber: 3,
    })
  })
})
