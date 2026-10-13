# KIẾN TRÚC THƯ MỤC LECTURER & HƯỚNG DẪN VIBE CODING FEATURE MỚI

> **Tài liệu tham khảo nhanh (Cheatsheet & Architecture Guide)**  
> Dành cho Developer & AI Assistant khi phát triển các tính năng trên portal **Lecturer** (bao gồm cả các vai trò: **Admin**, **Lecturer**, **Department**, và **Auth**).

---

## 1. TỔNG QUAN KIẾN TRÚC FOLDER HIỆN TẠI

Dự án áp dụng mô hình **Feature-Based Architecture (Vertical Slice)** kết hợp **Two-Tier Hierarchy (Phân cấp 2 tầng: Role -> Feature)**:

```text
d:\graduation\Graduation-Project-Management-System\Frontend\Lecturer\
├── public/                                # Tài nguyên tĩnh (favicon, logo, icons)
├── src/
│   ├── app/                               # Khởi tạo App, Global Providers & Routing
│   │   ├── routes/                        # Cấu hình Routing theo từng Role
│   │   │   ├── index.tsx                  # AppRouter tổng hợp, Public routes, 404
│   │   │   ├── admin.routes.tsx           # Route cấu hình cho cổng Admin
│   │   │   ├── lecturer.routes.tsx         # Route cấu hình cho cổng Giảng viên
│   │   │   └── department.routes.tsx       # Route cấu hình cho cổng Bộ môn
│   │   ├── App.css                        # CSS gốc của App (import Tailwind, theme)
│   │   ├── App.tsx                        # Root component, QueryProvider, RouterProvider
│   │   └── index.ts                       # Entrypoint app
│   │
│   ├── features/                          # TOÀN BỘ NGHIỆP VỤ (CHIA THEO ROLE)
│   │   ├── index.ts                       # Barrel export cấp cao nhất (auth, admin, lecturer, department)
│   │   │
│   │   ├── auth/                          # Module 0: Xác thực & Đăng nhập
│   │   │   ├── components/                # ProtectedRoute, RoleSwitcher, CanAccess
│   │   │   ├── pages/                     # LoginPage.tsx
│   │   │   ├── hooks/                     # useAuth.ts
│   │   │   ├── services/                  # auth.service.ts
│   │   │   ├── store/                     # authStore.ts (Zustand lưu user, token, role)
│   │   │   ├── types.ts                   # Types xác thực
│   │   │   └── index.ts                   # Public API của Auth
│   │   │
│   │   ├── admin/                         # Role 1: Quản trị viên hệ thống
│   │   │   ├── layouts/                   # AdminLayout, AdminHeader, AdminSidebar, adminNav.config
│   │   │   ├── account_management/        # Sub-feature: Quản lý tài khoản người dùng
│   │   │   ├── semester_management/       # Sub-feature: Quản lý đợt đồ án / học kỳ
│   │   │   ├── major_management/          # Sub-feature: Quản lý chuyên ngành
│   │   │   └── index.ts                   # Public API của Admin (re-export layouts & features)
│   │   │
│   │   ├── lecturer/                      # Role 2: Giảng viên (GVHD / GVPB / Hội đồng)
│   │   │   ├── layouts/                   # LecturerLayout, LecturerHeader, LecturerSidebar, lecturerNav.config
│   │   │   ├── feature_1/                 # Sub-feature ví dụ (Quản lý đề tài / Hướng dẫn)
│   │   │   ├── feature_2/                 # Sub-feature ví dụ (Chấm điểm / Phản biện)
│   │   │   └── index.ts                   # Public API của Lecturer
│   │   │
│   │   └── department/                    # Role 3: Trưởng bộ môn & Giáo vụ khoa
│   │       ├── layouts/                   # DepartmentLayout, DepartmentHeader, DepartmentSidebar
│   │       ├── styles/                    # department.css (Styles đặc thù nếu có)
│   │       ├── student_management/        # Sub-feature: Quản lý phân công sinh viên
│   │       ├── feature_2/                 # Sub-feature ví dụ (Hội đồng bộ môn)
│   │       └── index.ts                   # Public API của Department
│   │
│   ├── shared/                            # DÙNG CHUNG TOÀN HỆ THỐNG (Tối giản & Tinh gọn)
│   │   ├── api/                           # client.ts (baseURL, timeout), interceptors.ts (bắt lỗi BE, toast 3s), queryClient.ts, endpoints.ts
│   │   ├── components/                    # UI Primitives & Feedback:
│   │   │   ├── feedback/                  # ToastContainer.tsx, toast.store.ts, ErrorFallback.tsx, LoadingFallback.tsx, NotFound.tsx, FeaturePlaceholder.tsx
│   │   │   ├── layout/                    # PublicLayout.tsx
│   │   │   └── ui/                        # Button, Card, Dialog, Input, Select, Skeleton, Table, Tabs, Textarea, Badge
│   │   ├── hooks/                         # Custom hooks (useDebounce.ts, useLocalStorage.ts, useFileUpload.ts)
│   │   ├── styles/                        # variables.css, global.css, premium.css, responsive.css, print.css
│   │   ├── types/                         # index.ts (ApiResponse<T>, API_SUCCESS_CODE, ApiError, UserProfile, UserRole...)
│   │   ├── utils/                         # Hàm helper thuần túy (cn.ts, formatDate.ts, formatBytes.ts, scoring.ts, excel.ts)
│   │   └── index.ts                       # Public API của Shared module
│   │
│   ├── assets/                            # Hình ảnh, SVG, fonts cục bộ
│   └── main.tsx                           # ReactDOM entrypoint
│
├── tests/                                 # Cấu hình test Vitest / Testing Library
├── index.html                             # Single Page HTML entry
├── vite.config.ts                         # Cấu hình Vite & Alias `@/` trỏ vào `src/`
└── tsconfig.app.json                      # Cấu hình TypeScript cho ứng dụng
```

---

## 2. TIÊU CHUẨN 6 THƯ MỤC CỦA MỖI SUB-FEATURE

Mỗi tính năng con nằm trong một Role (ví dụ: `src/features/admin/semester_management/` hoặc `src/features/lecturer/topic_management/`) **bắt buộc tuân thủ đúng 6 thư mục con + 1 file `index.ts`**:

```text
<sub_feature_name>/
├── components/          # 1. UI Components nội bộ của riêng tính năng này
│   └── ...
├── pages/               # 2. Page Components (Route Entrypoint - export default)
│   └── ...
├── hooks/               # 3. Custom Hooks (Logic xử lý, lifecycle, React Query)
│   └── ...
├── services/            # 4. API Calls (có Interface SOLID + Mock fallback)
│   └── ...
├── store/               # 5. Local State Management (Zustand store riêng của feature)
│   └── ...
├── types/               # 6. Type Definitions, DTOs, Enums của feature
│   └── ...
└── index.ts             # 7. Barrel Export công khai của feature
```

### Ý nghĩa & nguyên tắc của từng thư mục:

| Thư mục | Nhiệm vụ | Quy tắc bắt buộc |
| :--- | :--- | :--- |
| **`types/`** | Khai báo cấu trúc dữ liệu, Request/Response DTOs | Không import ngược từ components/hooks |
| **`services/`** | Gọi API Backend qua `apiClient` (`@/shared/api/client`) | Phải có `interface I...Service` & mock fallback an toàn |
| **`store/`** | Lưu state cục bộ bằng Zustand (bộ lọc, tab đang chọn, draft form) | Đặt tên file `<feature>.store.ts` |
| **`hooks/`** | Gom logic nghiệp vụ, gọi service hoặc kết nối store với UI | Tách biệt logic khỏi file JSX giao diện |
| **`components/`** | Các modal, bảng dữ liệu, toolbar, card nhỏ nội bộ | Không dùng chung ra ngoài feature khác |
| **`pages/`** | Trang hoàn chỉnh ghép các components lại, nhận route params | **Bắt buộc `export default`** để hỗ trợ `React.lazy()` |
| **`index.ts`** | "Cổng giao tiếp" duy nhất của feature ra bên ngoài | Export tất cả những gì cần cho role/router sử dụng |

---

## 3. NGUYÊN TẮC VÀNG KHI VIBE CODING (IMPORT & PHÂN TẦNG)

### ❌ KHÔNG BAO GIỜ Deep Import vào ruột của feature khác
```typescript
// ❌ SAI: Đi thẳng vào cấu trúc bên trong của feature khác
import { semesterService } from '@/features/admin/semester_management/services/semester.service'
import { SemesterTable } from '@/features/admin/semester_management/components/SemesterTable'

// ✅ ĐÚNG: Import thông qua Barrel export của sub-feature
import { semesterService, SemesterTable } from '@/features/admin/semester_management'

// ✅ HOẶC: Import thông qua Barrel export của Role
import { semesterService } from '@/features/admin'
```

### ❌ KHÔNG đưa logic nghiệp vụ vào `shared/`
- Thư mục `shared/` chỉ chứa **các viên gạch độc lập** (Button, Input, Date formatter, Network client).
- Nếu một component có dính tới nghiệp vụ (ví dụ: `StudentGradeModal`, `TopicCard`), nó **phải nằm trong `features/`**.

### ✅ Luôn có Mock Data trong Service khi Backend chưa sẵn sàng
Vibe coding đòi hỏi giao diện và trải nghiệm phải kiểm thử được ngay lập tức trên trình duyệt. Do đó:
- `try { ...call api } catch { return mockData }` luôn là cứu cánh để dev giao diện mượt mà trước khi API backend hoàn thành.

---

## 4. QUY TRÌNH 5 BƯỚC THÊM FEATURE MỚI (CHECKLIST DÀNH CHO VIBE CODING)

Giả sử bạn muốn thêm tính năng **`council_management`** (Quản lý hội đồng bảo vệ) vào role **`admin`**:

### ⚡ Bước 1: Tạo cấu trúc thư mục
Tạo thư mục `src/features/admin/council_management/` với đủ 6 thư mục con và file `index.ts`.

> **Lệnh PowerShell tạo nhanh 1 giây:**
> ```powershell
> $feat = "src/features/admin/council_management"
> mkdir "$feat/components", "$feat/pages", "$feat/hooks", "$feat/services", "$feat/store", "$feat/types"
> New-Item "$feat/index.ts", "$feat/types/types.ts", "$feat/services/council.service.ts", "$feat/store/council.store.ts", "$feat/hooks/useCouncil.ts", "$feat/pages/CouncilPage.tsx"
> ```

---

### ⚡ Bước 2: Viết Type & Service (`types/` & `services/`)

#### 📄 `types/types.ts`
```typescript
export interface CouncilMember {
  id: string
  name: string
  role: 'CHAIR' | 'SECRETARY' | 'REVIEWER' | 'MEMBER'
  email: string
}

export interface Council {
  id: string
  code: string
  name: string
  date: string
  room: string
  members: CouncilMember[]
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED'
}
```

#### 📄 `services/council.service.ts`
```typescript
import { apiClient } from '@/shared/api/client'
import type { Council } from '../types/types'

export interface ICouncilService {
  getCouncils(): Promise<Council[]>
  createCouncil(data: Partial<Council>): Promise<Council>
}

// Mock fallback để giao diện hiển thị được ngay lập tức khi Vibe Coding
const MOCK_COUNCILS: Council[] = [
  {
    id: 'c1',
    code: 'HD-2026-01',
    name: 'Hội đồng Bảo vệ Đồ án Kỹ thuật Phần mềm 01',
    date: '2026-11-20',
    room: 'A2-501',
    status: 'ACTIVE',
    members: [
      { id: 'm1', name: 'TS. Nguyễn Văn A', role: 'CHAIR', email: 'anv@university.edu.vn' },
      { id: 'm2', name: 'ThS. Trần Thị B', role: 'SECRETARY', email: 'btt@university.edu.vn' },
    ],
  },
]

export const councilService: ICouncilService = {
  getCouncils: async () => {
    try {
      const res = await apiClient.get<Council[]>('/admin/councils')
      return res.data
    } catch {
      return MOCK_COUNCILS
    }
  },
  createCouncil: async (data) => {
    const res = await apiClient.post<Council>('/admin/councils', data)
    return res.data
  },
}
```

---

### ⚡ Bước 3: Tạo Store hoặc Hook (`store/` & `hooks/`)

#### 📄 `store/council.store.ts` (Nếu cần lưu bộ lọc, tìm kiếm, tab đang chọn)
```typescript
import { create } from 'zustand'

interface CouncilState {
  searchTerm: string
  statusFilter: string
  setSearchTerm: (term: string) => void
  setStatusFilter: (status: string) => void
}

export const useCouncilStore = create<CouncilState>((set) => ({
  searchTerm: '',
  statusFilter: 'ALL',
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
}))
```

#### 📄 `hooks/useCouncil.ts`
```typescript
import { useState, useEffect } from 'react'
import { councilService } from '../services/council.service'
import type { Council } from '../types/types'

export function useCouncil() {
  const [councils, setCouncils] = useState<Council[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    councilService
      .getCouncils()
      .then((data) => setCouncils(data))
      .finally(() => setLoading(false))
  }, [])

  return { councils, loading, refresh: () => councilService.getCouncils().then(setCouncils) }
}
```

---

### ⚡ Bước 4: Tạo Page UI Component (`pages/CouncilPage.tsx`)

> **LƯU Ý QUAN TRỌNG:** Phải sử dụng **`export default`** cho component trang để Router có thể dùng `React.lazy()`.

#### 📄 `pages/CouncilPage.tsx`
```tsx
import React from 'react'
import { useCouncil } from '../hooks/useCouncil'

export default function CouncilPage() {
  const { councils, loading } = useCouncil()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Hội đồng Bảo vệ</h1>
          <p className="text-sm text-slate-500">Tổ chức và phân công các hội đồng chấm bảo vệ khóa luận.</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
          + Tạo Hội đồng Mới
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Đang tải dữ liệu hội đồng...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {councils.map((c) => (
            <div key={c.id} className="border border-slate-200 bg-white rounded-xl p-5 shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md">
                    {c.code}
                  </span>
                  <h3 className="mt-2 text-base font-semibold text-slate-800">{c.name}</h3>
                </div>
                <span className="text-xs text-slate-400">Phòng {c.room}</span>
              </div>
              <p className="mt-3 text-xs text-slate-500">{c.members.length} thành viên hội đồng</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

### ⚡ Bước 5: Kết nối Hệ thống (3 điểm nối dây bắt buộc)

#### 1️⃣ Cập nhật `src/features/admin/council_management/index.ts`
```typescript
export * from './types/types'
export * from './services/council.service'
export * from './store/council.store'
export * from './hooks/useCouncil'
export { default as CouncilPage } from './pages/CouncilPage'
```

Và thêm vào `src/features/admin/index.ts`:
```typescript
export * from './council_management'
```

#### 2️⃣ Đăng ký Route trong `src/app/routes/admin.routes.tsx`
```tsx
import { lazy } from 'react'

// Lazy load trang vừa tạo
const CouncilPage = lazy(() => import('@/features/admin/council_management/pages/CouncilPage'))

export const adminRoutes: RouteObject = {
  path: 'admin',
  element: <AdminLayout />,
  children: [
    // ... các route khác
    {
      path: 'councils',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <CouncilPage />
        </Suspense>
      ),
    },
  ],
}
```

#### 3️⃣ Đăng ký Menu Sidebar trong `src/features/admin/layouts/components/adminNav.config.ts`
```typescript
import { Users2 } from 'lucide-react'

export const adminNavItems: AdminNavItem[] = [
  // ...
  {
    to: '/admin/councils',
    label: 'Hội đồng Bảo vệ',
    icon: Users2,
  },
]
```

---

## 5. BẢNG TỔNG KẾT VỊ TRÍ FILE (CHEAT SHEET)

| Bạn đang muốn làm gì? | File / Thư mục cần chạm vào |
| :--- | :--- |
| **Cấu hình API Base URL & Timeout** | `src/shared/api/client.ts` |
| **Gọi thông báo Toast (tự tắt sau 3 giây)** | `src/shared/components/feedback/toast.store.ts` (`toast.success`, `toast.error`...) |
| **Thêm API Endpoint / Model chung của dự án** | `src/shared/api/endpoints.ts` hoặc `src/shared/types/index.ts` |
| **Tạo component UI cơ bản (Button, Dialog, Input, Card...)** | `src/shared/components/ui/` |
| **Thêm tính năng mới cho Giảng viên** | `src/features/lecturer/<tên_tính_năng>/` |
| **Thêm tính năng mới cho Quản trị viên** | `src/features/admin/<tên_tính_năng>/` |
| **Thêm tính năng mới cho Bộ môn** | `src/features/department/<tên_tính_năng>/` |
| **Đổi icon hoặc menu điều hướng bên trái** | `src/features/<role>/layouts/components/<role>Nav.config.ts` |
| **Thêm URL / Trang mới vào hệ thống** | `src/app/routes/<role>.routes.tsx` |
| **Lưu thông tin đăng nhập hoặc phân quyền người dùng** | `src/features/auth/store/authStore.ts` |
| **Kiểm tra type lỗi toàn dự án** | Chạy lệnh `npx tsc --noEmit` ở terminal |

---

## 6. MẸO PROMPT KHI VIBE CODING VỚI AI

Khi yêu cầu AI sinh code cho một tính năng mới trong dự án này, bạn có thể copy đoạn prompt chuẩn sau:

> *"Hãy tạo cho tôi tính năng `[tên_tính_năng]` trong role `[admin/lecturer/department]` theo chuẩn cấu trúc trong `Folder_Architecture.md`:*  
> *1. Tạo đủ 6 thư mục (`components`, `pages`, `hooks`, `services`, `store`, `types`) và file `index.ts`.*  
> *2. `services/` phải có Interface `I...Service` và Mock fallback data đầy đủ để hiển thị.*  
> *3. `pages/` xuất ra `export default`.*  
> *4. Cập nhật route vào `src/app/routes/[role].routes.tsx` và sidebar vào `[role]Nav.config.ts`."*

---

## 7. QUY CHUẨN PHẢN HỒI BACKEND (APIRESPONSE) & THÔNG BÁO TOAST (3 GIÂY)

### 📌 Cấu trúc chuẩn Backend trả về:
```json
{
  "code": 1000,
  "message": "Thao tác thành công",
  "data": { ... }
}
```
* **`code`**:
  * `1000`: Thành công.
  * Khác `1000` (ví dụ: `1001`, `1002`, `400`...): Thất bại (Lỗi nghiệp vụ hoặc dữ liệu không hợp lệ).
* **`message`**: Chuỗi thông báo từ Backend (thành công hoặc lý do lỗi).
* **`data`**: Payload dữ liệu trả về (Generic `T`).

### 🚀 Cơ chế tự động xử lý và hiển thị thông báo (Toast 3s):
1. **Tự động bắt lỗi trong `src/shared/api/interceptors.ts`:**
   * Nếu Backend trả về HTTP 200 nhưng `code !== 1000` $\rightarrow$ Tự động bật thông báo lỗi `toast.error(message, 3000)` và ném `ApiError` vào khối `catch`.
   * Nếu HTTP status trả về lỗi (400, 403, 500) $\rightarrow$ Tự động bật `toast.error(message, 3000)`.
2. **Chủ động gọi Toast trong Component / Feature:**
   * Bạn có thể gọi trực tiếp ở bất kỳ file nào mà không cần truyền prop:
   ```typescript
   import { toast } from '@/shared/components/feedback/toast.store'

   // Mặc định tự tắt sau đúng 3 giây (3000ms):
   toast.success('Tạo đề tài thành công!')
   toast.error('Mã sinh viên đã tồn tại trên hệ thống!')
   toast.warning('Hạn nộp đề cương sắp kết thúc!')
   toast.info('Hệ thống đang đồng bộ dữ liệu...')
   ```

---

## 8. NGUYÊN TẮC TINH GỌN THƯ MỤC SHARED (CLEAN SHARED DIRECTORY)

Để giữ cho thư mục `src/shared/` luôn trong sạch, tránh phình to và rác code:

1. **Tập trung cấu hình mạng duy nhất một nơi**: URL và cấu hình Axios nằm trọn vẹn tại `src/shared/api/client.ts` (không tạo các file thừa như `env.ts` hay `appConfig.ts`).
2. **Không phân mảnh component UI**: Toàn bộ UI primitives nguyên tử (Button, Input, Card, Dialog...) nằm tập trung trong `src/shared/components/ui/` (không tạo thêm các thư mục con đơn lẻ như `buttons/`).
3. **Phản hồi người dùng**: Toàn bộ popup, cảnh báo, fallback nằm trong `src/shared/components/feedback/` (`ToastContainer`, `toast.store`, `ErrorFallback`, `NotFound`...).
4. **CSS & Styling**: Tận dụng tối đa class tiện ích của TailwindCSS v4 thay vì tạo thêm file `.css` rải rác.


