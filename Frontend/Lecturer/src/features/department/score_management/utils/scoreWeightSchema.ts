import { z } from 'zod'

// Schema zod cho hộp thoại Tạo / Sửa trọng số: FE chặn sớm, BE vẫn kiểm tra lại (4000, 3139).

/** Đổi % sang số nguyên (×100) để cộng / so sánh không bị lỗi số thực (33.33 + 33.33 + 33.34) */
function toHundredths(value: number): number {
  return Math.round(value * 100)
}

/** true nếu số có tối đa 2 chữ số thập phân */
function hasAtMostTwoDecimals(value: number): boolean {
  return Math.abs(value * 100 - toHundredths(value)) < 1e-9
}

const weightField = z
  .number({ error: 'Vui lòng nhập trọng số' })
  .gt(0, 'Trọng số phải lớn hơn 0%')
  .max(100, 'Trọng số tối đa 100%')
  .refine(hasAtMostTwoDecimals, 'Trọng số tối đa 2 chữ số thập phân')

export interface ScoreWeightValues {
  advisorWeight: number
  examinerWeight: number
  councilWeight: number
}

/** Tổng 3 trọng số, làm tròn 2 chữ số. Ô nào chưa nhập (NaN) thì tính 0 */
export function sumScoreWeights(values: ScoreWeightValues): number {
  const total = [values.advisorWeight, values.examinerWeight, values.councilWeight]
    .map((value) => (Number.isFinite(value) ? toHundredths(value) : 0))
    .reduce((sum, value) => sum + value, 0)
  return total / 100
}

/** W3, W4 – tên + 3 trọng số, tổng phải đúng 100% (lỗi tổng gắn vào path `total`) */
export const scoreWeightSchema = z
  .object({
    name: z.string().trim().min(1, 'Tên cấu hình không được để trống').max(255, 'Tên cấu hình tối đa 255 ký tự'),
    advisorWeight: weightField,
    examinerWeight: weightField,
    councilWeight: weightField,
  })
  .refine((values) => toHundredths(sumScoreWeights(values)) === 10000, {
    message: 'Tổng trọng số 3 đầu điểm phải bằng 100%',
    path: ['total'],
  })

export type ScoreWeightInput = z.infer<typeof scoreWeightSchema>
