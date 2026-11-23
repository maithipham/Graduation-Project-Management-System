import type { StudentListItem } from '../types'

// Đã chuyển sang shared để bảng giáo viên dùng chung; giữ export ở đây cho code/test cũ
export { getNextSort, getPageItems, type PageItem } from '@/shared/utils'

/**
 * Chỉ xóa được sinh viên chưa đăng ký GVHD và chưa có đề tài (Mục 6.5 tài liệu API).
 * SV đã gửi đơn đăng ký GVHD có status STAGE_1_ADVISOR_REQUESTED → tự động không hiện nút Xóa
 * (BE chỉ cho xóa đề tài chưa có đơn đăng ký). BE vẫn kiểm tra lại, ví dụ đơn đã bị từ chối → lỗi 3028
 */
export function canDeleteStudent(student: StudentListItem) {
  return (
    student.status === 'STAGE_1_REGISTERING_ADVISOR' && !student.lecturerName && !student.topicName
  )
}
