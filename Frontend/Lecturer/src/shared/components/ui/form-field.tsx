import * as React from 'react'
import { cn } from '@/shared/utils/cn'

/** Các thuộc tính FormField tự gắn vào ô nhập con (Input / Select / Textarea) */
interface FieldControlProps {
  id?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

export interface FormFieldProps {
  label: string
  /** Thông báo lỗi (thường là `errors.<tên-trường>?.message`). Có lỗi → dòng chữ đỏ dưới ô + viền đỏ */
  error?: string
  /** Gợi ý nhỏ dưới ô, ẩn khi đang có lỗi */
  hint?: string
  /** Hiện dấu * đỏ cạnh nhãn (chỉ để hiển thị, việc bắt buộc vẫn do schema zod quyết định) */
  required?: boolean
  className?: string
  /** Đúng một ô nhập: Input, Select hoặc Textarea */
  children: React.ReactElement<FieldControlProps>
}

/**
 * Khung một trường form: nhãn + ô nhập + dòng báo lỗi đỏ ngay dưới ô.
 * Tự nối nhãn với ô (id/htmlFor) và gắn aria-invalid để ô đổi viền đỏ khi có lỗi.
 *
 * Dùng:
 *   <FormField label="Tên học kỳ" required error={errors.name?.message}>
 *     <Input {...register('name')} />
 *   </FormField>
 */
export function FormField({ label, error, hint, required, className, children }: FormFieldProps) {
  const generatedId = React.useId()
  const id = children.props.id ?? generatedId
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = error ? errorId : hint ? hintId : undefined

  const control = React.cloneElement(children, {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
  })

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-[#DC2626]">*</span>}
      </label>
      {control}
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-xs font-semibold text-[#DC2626]">
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="mt-1 text-xs text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
