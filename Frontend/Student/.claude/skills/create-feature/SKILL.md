---
name: create-feature
description: Tạo màn hình / tính năng mới cho portal sinh viên (role student) — thư mục feature, page, route lazy, mục menu sidebar. Dùng khi người dùng nói "tạo trang…", "thêm màn hình…", "làm tính năng đăng ký GVHD / nộp đề cương / xem lịch bảo vệ… cho sinh viên", "create feature", "add page".
---

# Tạo feature mới

Quy tắc chung (kiến trúc, import, giao diện) nằm trong `AGENTS.md` — skill này chỉ là trình tự các bước.
Portal này chỉ có một role là `student`, nên mọi feature nằm trong `src/features/student/`.

## Cần xác định trước (thiếu thì HỎI, không đoán)

1. **Tên feature** theo nghiệp vụ, dạng `snake_case` (ví dụ `supervisor_registration`, `outline_submission`, `defense_schedule`).
2. **URL** và **nhãn menu** tiếng Việt (ví dụ `/student/registration` — "Đăng ký GVHD").
3. Có cần gọi API không → nếu có, sau khi tạo khung thì làm tiếp skill `connect-api`.

Kiểm tra `src/features/student/` trước: feature đã có thì dùng lại, không tạo trùng.

## Các bước

### 1. Thư mục feature

```
src/features/student/<feature>/
├── index.ts        # cổng export duy nhất
└── pages/XxxPage.tsx
```

- Chỉ tạo thêm `components/ hooks/ services/ types/ store/` khi thật sự có file đặt vào. Không tạo file rỗng.
- Feature mới phải được export ở `src/features/student/index.ts`: `export * from './<feature>'`.

### 2. Page

```tsx
// src/features/student/supervisor_registration/pages/SupervisorRegistrationPage.tsx
export default function SupervisorRegistrationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Đăng ký GVHD</h1>
        <p className="text-sm text-slate-500">Mô tả ngắn về màn hình.</p>
      </div>
      {/* nội dung */}
    </div>
  )
}
```

- **`export default`** (để `React.lazy` nạp được).
- **Không thêm padding ngoài cùng** (`p-6`): `StudentLayout` đã có `<main className="flex-1 p-6">`.
- Chữ hiển thị tiếng Việt có dấu, tông `slate` + `blue`, icon `lucide-react`, ưu tiên component trong `@/shared/components/ui`.
- Đang tải dữ liệu → `Skeleton`. Chưa có dữ liệu → dòng trạng thái trống, **không** dùng dữ liệu giả.

### 3. `index.ts` của feature

```ts
// Public API của sub-feature: supervisor_registration
// Không export pages: page được nạp bằng lazy() trong app/routes.
export * from './types/registration.types'
export * from './hooks/useSupervisorRegistration'
```

Chỉ export thứ feature khác cần. **Không export page** (nếu export, page bị kéo vào bundle chính, mất lazy load).
Đặt tên cụ thể (`useSupervisors`, `SupervisorRegistration`) vì `src/features/student/index.ts` gom mọi feature —
tên chung chung như `useList` sẽ trùng.

### 4. Route — `src/app/routes/student.routes.tsx`

```tsx
const SupervisorRegistrationPage = lazy(
  () => import('@/features/student/supervisor_registration/pages/SupervisorRegistrationPage'),
)

// trong children của StudentLayout (đã nằm trong ProtectedRoute allowedRoles={['student']}):
{ path: 'registration', element: withSuspense(<SupervisorRegistrationPage />) },
```

Đây là chỗ **duy nhất** được import thẳng vào file page. Route mới đặt trong `children` của `StudentLayout`
(không đặt ngoài, nếu không sẽ mất sidebar/header và mất bảo vệ của `ProtectedRoute`).

### 5. Menu sidebar — `src/features/student/layouts/components/studentNav.config.ts`

```ts
import { UserCheck } from 'lucide-react'

{ title: 'Đăng ký GVHD', path: '/student/registration', icon: UserCheck },
```

- Menu dạng `{ title, path, icon, badge? }` (khác portal Lecturer). `badge` là chữ nhỏ cạnh mục menu, chỉ thêm khi có dữ liệu thật.
- Breadcrumb trên header **tự lấy nhãn từ menu này** (`getNavBreadcrumbs`), không cần sửa `StudentHeader`.
- Trang gốc `/student` chỉ khớp đúng URL (đã cấu hình trong `StudentHeader`).
- Trang chi tiết (ví dụ `/student/outline/12`) không cần thêm vào menu — breadcrumb tự khớp mục cha.

### 6. Kiểm tra

Làm theo skill `verify-changes`. Nếu có thể, mở trang trong trình duyệt (`npm run dev`) xem route, menu, breadcrumb.

## KHÔNG được làm

- Import sâu vào feature khác (`@/features/student/x/services/...`) — chỉ qua `index.ts`.
- Đặt component có tên nghiệp vụ (`TopicCard`) vào `src/shared/`.
- Fetch dữ liệu bằng `useEffect + useState` — dùng skill `connect-api`.
- Dùng `UserRole` từ `@/shared/types` (bản cũ) — dùng từ `@/features/auth`.
- Tạo đủ 6 thư mục con "cho đúng chuẩn" khi chưa có file đặt vào, hoặc viết mock fallback trong service (`catch { return mock }`).
