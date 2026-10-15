---
name: build-form
description: Làm form tạo/sửa có kiểm tra dữ liệu (react-hook-form + zod v4) với dòng báo lỗi đỏ dưới từng ô input, hiển thị lỗi từ backend ngay trên form. Dùng khi người dùng nói "làm form…", "form đăng ký GVHD / nộp đề cương / cập nhật thông tin cá nhân…", "validate form", "báo lỗi dưới ô input", "create form", "edit form".
---

# Form tạo/sửa có kiểm tra dữ liệu

Mẫu đầy đủ (đã chạy thử): `templates/form-dialog.md` — form đăng ký / sửa đăng ký GVHD trong `Dialog`.
Gửi dữ liệu qua mutation hook của skill `connect-api`.

## Quy tắc hiển thị lỗi (bắt buộc)

1. Mọi `<form>` có **`noValidate`** (JSX viết camelCase, không phải `novalidate`) — tắt popup mặc định của trình duyệt
   ("Please fill out this field.").
2. **Toàn bộ kiểm tra dữ liệu nằm trong schema zod.** Không dựa vào `required`, `pattern`, `min` của HTML;
   không tự viết `if` kiểm tra trong hàm submit.
3. Lỗi hiện bằng **dòng chữ đỏ đậm ngay dưới ô input**: bọc ô bằng `FormField` (`@/shared/components/ui`) và truyền
   `error={errors.<tên-trường>?.message}`. `FormField` tự:
   - hiện `<p className="mt-1 text-xs font-semibold text-[#DC2626]">` dưới ô,
   - gắn `aria-invalid` → `Input` / `Select` / `Textarea` đổi **viền đỏ** `#DC2626`,
   - nối nhãn với ô (`id`/`htmlFor`), có `required` thì hiện dấu `*` đỏ.
4. **Thời điểm hiện lỗi**: khi bấm nút gửi (mặc định `useForm`). Sau đó lỗi tự cập nhật/biến mất ngay khi người dùng gõ sửa;
   con trỏ tự nhảy vào ô lỗi đầu tiên. Không đổi `mode` trừ khi người dùng yêu cầu.
5. **Thông báo lỗi tiếng Việt**, viết ngay trong schema, nói rõ cần làm gì: "Vui lòng nhập tên đề tài dự kiến",
   "Email không đúng định dạng", "Tên đề tài tối đa 200 ký tự".
6. **Lỗi từ backend**:
   - Lỗi gắn với một ô (ví dụ "Tên đề tài đã tồn tại", nhận biết bằng `error.code`) →
     `setError('<tên-trường>', { message: error.message }, { shouldFocus: true })` → hiện đúng dòng đỏ dưới ô đó.
   - Lỗi khác (GVHD đã đủ chỉ tiêu, hết hạn nộp, sai trạng thái...) → `setError('root.server', { message })`,
     hiện một dòng đỏ chung phía trên nút gửi (`text-sm font-semibold text-[#DC2626]`, `role="alert"`).
   - Request của form phải có `{ skipErrorToast: true }` trong service để không hiện thêm toast trùng.
   - Mã lỗi lấy từ `ErrorCode.java` — chưa biết thì **hỏi**, không đoán.

## Các bước

### 1. Schema zod (giống `@Valid` + `@NotBlank`/`@Size`/`@Email` trên DTO Java)

```ts
import { z } from 'zod'

const profileSchema = z
  .object({
    phone: z.string().trim().regex(/^0\d{9}$/, 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0'),
    personalEmail: z.email('Email không đúng định dạng'),
    topicTitle: z.string().trim().min(1, 'Vui lòng nhập tên đề tài').max(200, 'Tên đề tài tối đa 200 ký tự'),
    newTopicTitle: z.string().trim(),
  })
  // Kiểm tra liên quan nhiều ô → refine, gắn lỗi vào ô cần sửa bằng path
  .refine((v) => v.newTopicTitle !== v.topicTitle, {
    message: 'Tên đề tài mới phải khác tên hiện tại',
    path: ['newTopicTitle'],
  })

type ProfileFormValues = z.infer<typeof profileSchema> // không khai báo kiểu form lần thứ 2
```

Ghi chú zod v4: email dùng `z.email(...)` (không phải `z.string().email()`); chuỗi bắt buộc dùng `.trim().min(1, ...)`.
Ô số (`<Input type="number">`): `register('x', { valueAsNumber: true })` + `z.number({ error: 'Vui lòng nhập …' })`.

### 2. `useForm`

```ts
const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<RegistrationFormValues>({
  resolver: zodResolver(registrationSchema), // import { zodResolver } from '@hookform/resolvers/zod'
  defaultValues: emptyValues,                // luôn có giá trị mặc định cho mọi ô ('' cho chuỗi)
})
```

### 3. JSX

```tsx
<form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
  <FormField label="Tên đề tài dự kiến" required error={errors.topicTitle?.message}>
    <Input placeholder="VD: Xây dựng hệ thống quản lý đồ án" {...register('topicTitle')} />
  </FormField>

  <FormField label="Hướng nghiên cứu" error={errors.field?.message}>
    <Select {...register('field')}>
      <option value="">-- Chọn hướng nghiên cứu --</option>
      <option value="WEB">Ứng dụng web</option>
    </Select>
  </FormField>

  {errors.root?.server && (
    <p role="alert" className="text-sm font-semibold text-[#DC2626]">{errors.root.server.message}</p>
  )}

  <Button type="submit" disabled={isPending}>{isPending ? 'Đang gửi...' : 'Gửi đăng ký'}</Button>
</form>
```

- Mỗi ô một `FormField`, bên trong **đúng một** `Input` / `Select` / `Textarea`.
- `FormField` có thêm `hint` cho gợi ý nhỏ dưới ô (tự ẩn khi có lỗi).
- Dùng component trong `@/shared/components/ui`; không tự viết `<input>` trần hay tự tô viền đỏ.

### 4. Gửi form

```ts
const onSubmit = (values: RegistrationFormValues) => {
  const body = { supervisorId: supervisor.id, topicTitle: values.topicTitle, note: values.note || null }
  registerMutation.mutate(body, {
    onSuccess: () => onOpenChange(false), // toast.success đã nằm trong hook
    onError: (error) => {
      if (isApiError(error) && error.code === TOPIC_TITLE_EXISTED) {
        setError('topicTitle', { message: error.message }, { shouldFocus: true })
        return
      }
      setError('root.server', { message: isApiError(error) ? error.message : 'Có lỗi xảy ra, vui lòng thử lại.' })
    },
  })
}
```

- Đổi giá trị form sang body BE rõ ràng từng trường (ô trống `''` → `null` nếu DTO cho phép null).
- **Không** đưa `studentId` của chính mình vào body — BE lấy từ JWT (trừ khi DTO yêu cầu rõ).
- Nút submit: `disabled={isPending}` + chữ "Đang gửi..." / "Đang lưu..."; nút Hủy cũng `disabled` khi đang gửi.

### 5. Form sửa

- Dùng **chung một component** cho tạo và sửa: có prop dữ liệu cũ (`registration?: SupervisorRegistration`) → sửa; không có → tạo.
- Nạp dữ liệu cũ bằng `reset(...)` trong `useEffect` khi dialog mở / dữ liệu tải xong (xem mẫu).
  Không truyền dữ liệu từ API thẳng vào `defaultValues` (lúc mount dữ liệu có thể chưa về).
- Đổi dữ liệu BE sang giá trị form rõ ràng từng trường (`null` → `''`).

### 6. Form có tải file (đề cương, báo cáo)

- Chưa có mẫu đã chạy thử. Hỏi người dùng Controller nhận `MultipartFile` thế nào (tên field, giới hạn dung lượng, định dạng)
  trước khi làm. Có sẵn hook `useFileUpload` trong `@/shared/hooks` (thanh tiến trình %) — đọc code hook trước khi dùng.
- Kiểm tra định dạng/dung lượng file cũng đặt trong schema zod, lỗi hiện dưới ô chọn file qua `FormField`.

### 7. Kiểm tra

- Thêm test cho form quan trọng (mẫu: `tests/unit/formField.test.tsx`): bấm gửi khi trống → thấy lỗi;
  sửa lại → lỗi mất, mutation được gọi đúng dữ liệu.
- Làm theo skill `verify-changes`.

## KHÔNG được làm

- Thiếu `noValidate` trên `<form>`.
- Báo lỗi nhập liệu bằng `alert()`, `toast` hay popup.
- Thao tác DOM (`document.getElementById`, `addEventListener`) để kiểm tra hay chèn lỗi.
- Dùng `useState` cho từng ô nhập thay vì `register`.
- Khai báo kiểu form tách rời schema (phải dùng `z.infer`).
- Tự đặt màu lỗi khác `#DC2626` hoặc tự viết dòng lỗi thay vì dùng `FormField`.
