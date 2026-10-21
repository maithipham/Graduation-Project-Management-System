/** Hạn mức chưa thiết lập (null) hiện "—"; 0 vẫn là một hạn mức hợp lệ nên hiện "0" */
export function formatAmount(amount: number | null): string {
  return amount === null ? '—' : String(amount)
}

/** id của ô nhập hạn mức trên từng dòng — nút bút chì dùng để đưa con trỏ vào ô */
export function teacherAmountInputId(publicId: string): string {
  return `teacher-amount-${publicId}`
}
