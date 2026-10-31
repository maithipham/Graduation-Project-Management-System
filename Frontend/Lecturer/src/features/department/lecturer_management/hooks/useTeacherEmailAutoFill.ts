import { useCallback, useEffect, useRef } from 'react'
import type { UseFormSetValue, UseFormSubscribe } from 'react-hook-form'
import {
  getTeacherEmailRule,
  TLU_ORGANIZATION,
  type CreateTeacherFormInput,
  type TeacherEmailRule,
} from '../utils/createTeacherSchema'

/** Đơn vị tự điền theo email: trong trường → tên Thủy lợi, ngoài trường → để trống cho người dùng tự gõ */
const autoOrganization = (rule: TeacherEmailRule) => (rule.internal ? TLU_ORGANIZATION : '')

interface UseTeacherEmailAutoFillOptions {
  subscribe: UseFormSubscribe<CreateTeacherFormInput>
  setValue: UseFormSetValue<CreateTeacherFormInput>
  /** Đã bấm Lưu / Gửi lại một lần thì kiểm tra lại ngay để dòng lỗi cũ biến mất */
  isSubmitted: boolean
  /** Email có sẵn khi mở form (sửa dòng import) → coi đơn vị / hạn mức hiện tại như đã tự điền theo email đó */
  initialEmail?: string
  defaultMajor?: string
}

/**
 * Gõ email xong đúng đuôi → tự điền đơn vị công tác và hạn mức mặc định:
 *   @tlu.edu.vn → Trường Đại học Thủy lợi / 20
 *   @gmail.com  → xóa tên Thủy lợi đã tự điền (người dùng gõ tên trường khác) / 10, xóa ngành
 * Chỉ ghi đè ô còn trống hoặc vẫn đang là giá trị tự điền lần trước, không đè lên giá trị người dùng tự sửa.
 * Trả về hàm `resetAutoFill` để gọi khi làm trống form (mở lại popup).
 */
export function useTeacherEmailAutoFill({
  subscribe,
  setValue,
  isSubmitted,
  initialEmail = '',
  defaultMajor = '',
}: UseTeacherEmailAutoFillOptions) {
  // Quy tắc theo đuôi email đã tự điền lần trước (để biết ô nào người dùng tự sửa thì không ghi đè)
  const autoFilledRef = useRef<TeacherEmailRule | undefined>(getTeacherEmailRule(initialEmail))

  useEffect(
    () =>
      subscribe({
        name: 'email',
        formState: { values: true },
        callback: ({ name, values }) => {
          if (name !== 'email') return // reset() cũng gọi callback, không tính là người dùng gõ
          const rule = getTeacherEmailRule(values.email)
          const previous = autoFilledRef.current
          if (!rule || rule === previous) return

          const options = { shouldValidate: isSubmitted }
          if (
            !values.organization ||
            (previous && values.organization === autoOrganization(previous))
          ) {
            setValue('organization', autoOrganization(rule), options)
          }
          if (!values.amount || values.amount === String(previous?.amount)) {
            setValue('amount', String(rule.amount), options)
          }
          // Ngoài trường không có ngành (BE báo lỗi nếu có)
          if (!rule.internal && values.major) {
            setValue('major', '', options)
          } else if (rule.internal && !values.major && defaultMajor) {
            setValue('major', defaultMajor, options)
          }
          autoFilledRef.current = rule
        },
      }),
    [subscribe, setValue, isSubmitted, defaultMajor],
  )

  const resetAutoFill = useCallback(() => {
    autoFilledRef.current = undefined
  }, [])

  return { resetAutoFill }
}
