import { skipToken, useQuery } from '@tanstack/react-query'
import { referenceDataQueryOptions } from '@/shared/api'
import { rubricService } from '../services/rubric.service'
import { toSemesterRubricAssignment } from '../utils/rubricMapper'
import { rubricKeys } from './useRubrics'

// Rubric gán cho từng học kỳ (mục B của đặc tả, chỉ xem). Dùng chung bộ key `rubricKeys` với kho rubric
// để thao tác Áp dụng / Sửa kỳ / Hủy áp dụng bên useRubrics.ts tải lại được cả phần này.

/** B1 – 3 rubric (3 loại phiếu) của học kỳ đang chọn ở dropdown. Chưa chọn học kỳ → chưa gọi API */
export function useSemesterRubrics(semesterPublicId: string | undefined) {
  return useQuery({
    queryKey: rubricKeys.semester(semesterPublicId),
    queryFn:
      semesterPublicId === undefined
        ? skipToken
        : async () => (await rubricService.getSemesterRubrics(semesterPublicId)).map(toSemesterRubricAssignment),
  })
}

/** Học kỳ cho ô chọn "Từ kỳ" / "Đến kỳ" (sắp tăng dần). Danh sách ít đổi → giữ cache lâu */
export function useSemesterOptions() {
  return useQuery({
    queryKey: rubricKeys.semesterOptions(),
    queryFn: () => rubricService.getSemesterOptions(),
    ...referenceDataQueryOptions,
  })
}
