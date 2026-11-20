import { z } from 'zod'
import { roundWeight } from './rubricMapper'

// Schema zod giống Bean Validation (@NotBlank, @Size, @DecimalMin) bên DTO Spring:
// FE chặn sớm cho người dùng thấy lỗi ngay dưới ô, BE vẫn kiểm tra lại (đặc tả mục 3 và 5.5).

/** Tên rubric: dùng cho A3 (dòng nhập tên inline, loại phiếu lấy theo tab đang mở) và A5 */
export const rubricNameSchema = z
  .string()
  .trim()
  .min(1, 'Tên rubric không được để trống')
  .max(255, 'Tên rubric tối đa 255 ký tự')

/** true nếu số có tối đa 2 chữ số thập phân (chịu được sai số dấu phẩy động, VD 15.55) */
function hasAtMostTwoDecimals(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-9
}

const criterionSchema = z.object({
  // Không ép uuid: BE đã kiểm tra (lỗi 3113), FE chỉ cần chuỗi hoặc null = tiêu chí mới
  publicId: z.string().min(1).nullable(),
  name: z
    .string()
    .trim()
    .min(1, 'Tên tiêu chí không được để trống')
    .max(500, 'Tên tiêu chí tối đa 500 ký tự'),
  weight: z
    .number({ error: 'Trọng số tiêu chí không được để trống' })
    .gt(0, 'Trọng số tiêu chí phải lớn hơn 0%')
    .max(100, 'Trọng số tiêu chí tối đa 100%')
    .refine(hasAtMostTwoDecimals, 'Trọng số tối đa 2 chữ số thập phân'),
})

const groupSchema = z.object({
  publicId: z.string().min(1).nullable(),
  name: z
    .string()
    .trim()
    .min(1, 'Tên nhóm tiêu chí không được để trống')
    .max(255, 'Tên nhóm tiêu chí tối đa 255 ký tự'),
  criteria: z.array(criterionSchema),
})

/** A5 – lưu cả cây. Không ép tổng 100% vì rubric Nháp được lưu dở dang */
export const saveRubricSchema = z.object({
  name: rubricNameSchema,
  version: z.number().int(),
  groups: z.array(groupSchema),
})

export type SaveRubricInput = z.infer<typeof saveRubricSchema>

/** Tổng trọng số cả rubric, làm tròn 2 chữ số (chỉ để cảnh báo sớm, BE là nguồn chuẩn) */
export function sumWeight(groups: { criteria: { weight: number }[] }[]): number {
  return roundWeight(groups.flatMap((group) => group.criteria).reduce((sum, criterion) => sum + criterion.weight, 0))
}

/**
 * Rubric đã áp dụng (Sắp / Đang áp dụng, chưa có phiếu chấm) phải luôn hợp lệ khi lưu (không thì BE trả 3103):
 * tổng đúng 100% và không có nhóm nào trống tiêu chí. Trả lý do chặn, null = được lưu.
 */
export function getScheduledSaveBlockReason(groups: { criteria: { weight: number }[] }[]): string | null {
  if (groups.length === 0) return 'Rubric đã áp dụng phải có ít nhất một nhóm tiêu chí'
  if (groups.some((group) => group.criteria.length === 0)) return 'Mỗi nhóm tiêu chí phải có ít nhất một tiêu chí'
  const total = sumWeight(groups)
  if (total !== 100) return `Tổng trọng số (${total}%) phải bằng 100%`
  return null
}

/**
 * A7, A8, A9 – khoảng học kỳ: "Từ kỳ" bắt buộc, "Đến kỳ" null = chưa xác định.
 * Kỳ đã kết thúc / "Đến kỳ" trước "Từ kỳ" / trùng rubric khác để BE kiểm tra (3123–3125).
 */
export const semesterRangeSchema = z.object({
  fromSemesterId: z.string({ error: 'Vui lòng chọn Từ kỳ' }).min(1, 'Vui lòng chọn Từ kỳ'),
  toSemesterId: z.string().min(1).nullable(),
})

export type SemesterRangeInput = z.infer<typeof semesterRangeSchema>
