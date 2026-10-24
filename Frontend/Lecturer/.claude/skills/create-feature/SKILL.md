---
name: create-feature
description: Tạo màn hình / tính năng mới cho portal cán bộ (role admin, lecturer, department) — thư mục feature, page, route lazy, mục menu sidebar. Dùng khi người dùng nói "tạo trang…", "thêm màn hình…", "làm tính năng quản lý … cho admin/giảng viên/trưởng bộ môn", "create feature", "add page".
---

# Tạo feature mới

Quy tắc chung (kiến trúc, import, giao diện) nằm trong `AGENTS.md` — skill này chỉ là trình tự các bước.

## Cần xác định trước (thiếu thì HỎI, không đoán)

1. **Role**: `admin` | `lecturer` | `department`.
   Phần dùng chung cho cả 3 role (ví dụ chuông thông báo) không thuộc role nào: đặt ở `src/features/<feature>/`
   như `auth`, `notification` (AGENTS.md mục 3, quy tắc 8). Thêm feature dùng chung mới thì hỏi người dùng trước.
2. **Tên feature** theo nghiệp vụ, dạng `snake_case` (ví dụ `semester_management`, `topic_review`).
3. **URL** và **nhãn menu** tiếng Việt (ví dụ `/admin/semesters` — "Quản lý học kỳ").
4. Có cần gọi API không → nếu có, sau khi tạo khung thì làm tiếp skill `connect-api`.

Kiểm tra `src/features/<role>/` trước: nhiều feature đã có sẵn thư mục rỗng (chỉ có `index.ts` với `export {}`),
ví dụ `admin/semester_management`, `admin/account_management`, `admin/major_management`, `department/student_management`.
Có rồi thì dùng lại, không tạo trùng.

Menu và route hiện có (kiểm tra lại trong code, có thể đã đổi):
- `admin`, `lecturer`: menu còn các mục giả "Feature 1…4" (URL `/<role>/feature-N`), route trỏ tới `FeaturePlaceholder`.
  Màn hình mới **thay** một mục giả (cả menu lẫn route), không thêm mục mới bên cạnh mục giả. Không rõ thay mục nào thì hỏi.
- `department`: menu đã có mục thật (`/department/councils`, `/department/schedule`…) nhưng `department.routes.tsx`
  chưa có route → chỉ thêm route đúng URL trong menu, không thêm mục menu trùng.
  Mục nào chưa có route mà URL chưa rõ nghĩa thì có thể đổi sang dạng `<danh-từ>-management`
  (như `/department/student-management`), nhớ sửa cả menu lẫn route.

## Các bước

### 1. Thư mục feature

```
src/features/<role>/<feature>/
├── index.ts        # cổng export duy nhất
└── pages/XxxPage.tsx
```

- Chỉ tạo thêm `components/ hooks/ services/ types/ store/` khi thật sự có file đặt vào. Không tạo file rỗng.
- Feature mới phải được export ở `src/features/<role>/index.ts`: `export * from './<feature>'`.

### 2. Page

```tsx
// src/features/admin/semester_management/pages/SemesterListPage.tsx
export default function SemesterListPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý học kỳ</h1>
        <p className="text-sm text-slate-500">Mô tả ngắn về màn hình.</p>
      </div>
      {/* nội dung */}
    </div>
  )
}
```

- **`export default`** (để `React.lazy` nạp được).
- **Không thêm padding ngoài cùng** (`p-6`): layout của role đã có `<main className="flex-1 p-6">`.
- Chữ hiển thị tiếng Việt có dấu, tông `slate` + `blue`, icon `lucide-react`, ưu tiên component trong `@/shared/components/ui`.
- Đang tải dữ liệu → `Skeleton`.

### 3. `index.ts` của feature

```ts
// Public API của sub-feature: semester_management
// Không export pages: page được nạp bằng lazy() trong app/routes.
export * from './types/semester.types'
export * from './hooks/useSemesters'
```

Chỉ export thứ feature khác cần. **Không export page** (nếu export, page bị kéo vào bundle chính, mất lazy load).
Đặt tên cụ thể (`useSemesters`, `Semester`) vì role `index.ts` gom mọi feature — tên chung chung như `useList` sẽ trùng.

### 4. Route — `src/app/routes/<role>.routes.tsx`

```tsx
const SemesterListPage = lazy(
  () => import('@/features/admin/semester_management/pages/SemesterListPage'),
)

// trong children của route role:
{ path: 'semesters', element: withSuspense(<SemesterListPage />) },
```

Đây là chỗ **duy nhất** được import thẳng vào file page. Nếu đang có route `FeaturePlaceholder` cho đúng URL đó thì thay thế nó.

### 5. Menu sidebar — `src/features/<role>/layouts/components/<role>Nav.config.ts`

```ts
{ to: '/admin/semesters', label: 'Quản lý học kỳ', icon: CalendarRange },
```

- Breadcrumb trên header **tự lấy nhãn từ menu này** (`getNavBreadcrumbs`), không cần sửa header.
- Trang gốc của role dùng `end: true`. Mục con đặt trong `children` của mục cha.
- Trang chi tiết (ví dụ `/admin/semesters/12`) không cần thêm vào menu — breadcrumb tự khớp mục cha.

### 6. Kiểm tra

Làm theo skill `verify-changes`. Nếu có thể, mở trang trong trình duyệt (`npm run dev`) xem route, menu, breadcrumb.

## KHÔNG được làm

- Import sâu vào feature khác (`@/features/admin/x/services/...`) — chỉ qua `index.ts`.
- Đặt component có tên nghiệp vụ (`SemesterCard`) vào `src/shared/`.
- Fetch dữ liệu bằng `useEffect + useState` — dùng skill `connect-api`.
- Tự viết chuỗi role (`'admin'`, `'lecturer'`…) — dùng `UserRole` (`ADMIN`, `HEAD_OF_MAJOR`, `SUPERVISOR`),
  `CanAccess`, `useMyInfo` từ `@/features/auth`. Trang mới không cần tự chặn role: route của portal đã nằm trong `ProtectedRoute`.
- Tạo đủ 6 thư mục con "cho đúng chuẩn" khi chưa có file đặt vào, hoặc viết mock fallback trong service (`catch { return mock }`).
