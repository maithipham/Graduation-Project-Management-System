import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, FormField, Input } from '@/shared/components/ui'

describe('FormField', () => {
  it('nối nhãn với ô nhập và chưa báo lỗi khi không có error', () => {
    render(
      <FormField label="Tên học kỳ" hint="Ví dụ: Học kỳ 1 2026-2027">
        <Input />
      </FormField>,
    )

    const input = screen.getByLabelText('Tên học kỳ')
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).toHaveAccessibleDescription('Ví dụ: Học kỳ 1 2026-2027')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('có error → dòng chữ đỏ đậm dưới ô và ô được đánh dấu lỗi', () => {
    render(
      <FormField label="Tên học kỳ" error="Vui lòng nhập tên học kỳ">
        <Input />
      </FormField>,
    )

    const input = screen.getByLabelText('Tên học kỳ')
    const message = screen.getByRole('alert')
    expect(message).toHaveTextContent('Vui lòng nhập tên học kỳ')
    expect(message).toHaveClass('text-[#DC2626]', 'font-semibold')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Vui lòng nhập tên học kỳ')
  })
})

// Mẫu form giống skill build-form: noValidate + zod + FormField
const schema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên học kỳ'),
  email: z.email('Email không đúng định dạng'),
})
type FormValues = z.infer<typeof schema>

function DemoForm({ onSubmit }: { onSubmit: (values: FormValues) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', email: '' } })

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Tên học kỳ" required error={errors.name?.message}>
        <Input {...register('name')} />
      </FormField>
      <FormField label="Email" error={errors.email?.message}>
        <Input type="email" {...register('email')} />
      </FormField>
      <Button type="submit">Lưu</Button>
    </form>
  )
}

describe('Form theo mẫu build-form', () => {
  it('bấm Lưu khi thiếu dữ liệu → hiện lỗi dưới từng ô, không gửi form', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<DemoForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Lưu' }))

    expect(await screen.findByText('Vui lòng nhập tên học kỳ')).toBeInTheDocument()
    expect(screen.getByText('Email không đúng định dạng')).toBeInTheDocument()
    expect(screen.getByLabelText(/Tên học kỳ/)).toHaveFocus()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('sửa lại đúng → dòng lỗi tự biến mất, form được gửi', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<DemoForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Lưu' }))
    await user.type(screen.getByLabelText(/Tên học kỳ/), 'Học kỳ 1')
    expect(screen.queryByText('Vui lòng nhập tên học kỳ')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Email'), 'gv@tlu.edu.vn')
    await user.click(screen.getByRole('button', { name: 'Lưu' }))

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Học kỳ 1', email: 'gv@tlu.edu.vn' }, expect.anything())
  })
})
