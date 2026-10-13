# KIẾN TRÚC THƯ MỤC STUDENT & HƯỚNG DẪN VIBE CODING FEATURE MỚI

> **Tài liệu tham khảo nhanh (Cheatsheet & Architecture Guide)**  
> Dành cho Developer & AI Assistant khi phát triển các tính năng trên portal **Student** (Cổng sinh viên thực hiện đồ án tốt nghiệp).

---

## 1. TỔNG QUAN KIẾN TRÚC FOLDER HIỆN TẠI

Dự án áp dụng mô hình **Feature-Based Architecture (Vertical Slice)** kết hợp **Two-Tier Hierarchy (Phân cấp 2 tầng: Auth Gateway -> Student Portal)**:

```text
d:\graduation\Graduation-Project-Management-System\Frontend\Student\
├── public/                                # Tài nguyên tĩnh (favicon, logo, icons)
├── src/
│   ├── app/                               # Khởi tạo App, Global Providers & Routing
│   │   ├── routes/                        # Cấu hình Routing
│   │   │   ├── index.tsx                  # AppRouter tổng hợp, Public routes, 404
│   │   │   └── student.routes.tsx         # Route cấu hình cho cổng Sinh viên
│   │   ├── App.css                        # CSS gốc của App (import Tailwind v4, theme)
│   │   ├── App.tsx                        # Root component, QueryProvider, ToastContainer, RouterProvider
│   │   └── index.ts                       # Entrypoint app
│   │
│   ├── features/                          # TOÀN BỘ NGHIỆP VỤ HỆ THỐNG
│   │   ├── index.ts                       # Barrel export cấp cao nhất (auth, student)
│   │   │
│   │   ├── auth/                          # Tầng 1: Xác thực & Đăng nhập (Public Gateway)
│   │   │   ├── components/                # ProtectedRoute, RoleSwitcher...
│   │   │   ├── pages/                     # LoginPage.tsx (export default)
│   │   │   ├── hooks/                     # useAuth.ts
│   │   │   ├── services/                  # auth.service.ts
│   │   │   ├── store/                     # authStore.ts (Zustand lưu user, token, role 'student')
│   │   │   ├── types/                     # types.ts (LoginRequest, AuthResponse...)
│   │   │   └── index.ts                   # Public API của Auth
│   │   │
│   │   └── student/                       # Tầng 2: Cổng Sinh viên (Protected Workspace)
│   │       ├── layouts/                   # Khung giao diện dùng chung của Sinh viên
│   │       │   ├── StudentLayout.tsx      # Main layout (Sidebar + Header + Outlet)
│   │       │   ├── components/            # StudentSidebar, StudentHeader, studentNav.config.ts
│   │       │   └── index.ts               # Re-export layouts
│   │       │
│   │       ├── feature_1/                 # Sub-feature mẫu 1 (Chuẩn 6 thư mục con)
│   │       ├── feature_2/                 # Sub-feature mẫu 2 (Chuẩn 6 thư mục con)
│   │       │   # (Các tính năng thực tế sau này: overview, topic_registration,
│   │       │   #  outline_submission, weekly_report, defense_schedule, results...)
│   │       └── index.ts                   # Public API của Student (re-export layouts & features)
│   │
│   ├── shared/                            # DÙNG CHUNG TOÀN HỆ THỐNG (Tối giản & Tinh gọn)
│   │   ├── api/                           # client.ts (baseURL, timeout), interceptors.ts (bắt lỗi BE, toast 3s), queryClient.ts, endpoints.ts
│   │   ├── components/                    # UI Primitives & Feedback:
│   │   │   ├── feedback/                  # ToastContainer.tsx, toast.store.ts, ErrorFallback.tsx, LoadingFallback.tsx, NotFound.tsx, FeaturePlaceholder.tsx
│   │   │   ├── ui/                        # Button, Card, Dialog, Input, Select, Skeleton, Table, Tabs, Textarea, Badge
│   │   │   └── index.ts
│   │   ├── hooks/                         # Custom hooks (useDebounce.ts, useLocalStorage.ts, useFileUpload.ts)
│   │   ├── styles/                        # variables.css, global.css, premium.css, responsive.css
│   │   ├── types/                         # index.ts (ApiResponse<T>, API_SUCCESS_CODE, ApiError, UserProfile, UserRole...)
│   │   ├── utils/                         # Hàm helper thuần túy (cn.ts, formatDate.ts, formatBytes.ts, scoring.ts, excel.ts)
│   │   └── index.ts                       # Public API của Shared module
│   │
│   ├── assets/                            # Hình ảnh, SVG, fonts cục bộ
│   └── main.tsx                           # ReactDOM entrypoint
│
├── tests/                                 # Cấu hình test Vitest / Testing Library
│   ├── unit/                              # apiHandlers.test.ts, authStore.test.ts, utils.test.ts
│   ├── integration/                       # Feature1Page.test.tsx, Feature2Page.test.tsx
│   └── setup.ts                           # Mock setup
├── index.html                             # Single Page HTML entry
├── vite.config.ts                         # Cấu hình Vite & Alias `@/` trỏ vào `src/`
└── tsconfig.app.json                      # Cấu hình TypeScript cho ứng dụng
```

---

## 2. TIÊU CHUẨN 6 THƯ MỤC CỦA MỖI SUB-FEATURE

Mỗi tính năng con nằm trong sinh viên (ví dụ: `src/features/student/topic_registration/` hoặc `src/features/student/weekly_report/`) **bắt buộc tuân thủ đúng 6 thư mục con + 1 file `index.ts`**:

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
import { feature1Service } from '@/features/student/feature_1/services/feature_1.service'
import { Feature1Card } from '@/features/student/feature_1/components/Feature1Card'

// ✅ ĐÚNG: Import thông qua Barrel export của sub-feature
import { feature1Service, Feature1Card } from '@/features/student/feature_1'

// ✅ HOẶC: Import thông qua Barrel export của Student module
import { feature1Service } from '@/features/student'
```

### ❌ KHÔNG đưa logic nghiệp vụ vào `shared/`
- Thư mục `shared/` chỉ chứa **các viên gạch độc lập** (Button, Input, Date formatter, Network client).
- Tuyệt đối không tạo layout sinh viên trong `shared/components/layout/`. Khung giao diện của sinh viên nằm tại `src/features/student/layouts/`.
- Nếu một component có dính tới nghiệp vụ (ví dụ: `TopicRegisterModal`, `ReportCard`), nó **phải nằm trong `features/student/`**.

### ✅ Luôn có Mock Data trong Service khi Backend chưa sẵn sàng
Vibe coding đòi hỏi giao diện và trải nghiệm phải kiểm thử được ngay lập tức trên trình duyệt. Do đó:
- `try { ...call api } catch { return mockData }` luôn là cứu cánh để dev giao diện mượt mà trước khi API backend hoàn thành.

---

## 4. QUY TRÌNH 5 BƯỚC THÊM FEATURE MỚI (CHECKLIST DÀNH CHO VIBE CODING)

Giả sử bạn muốn thêm tính năng **`topic_registration`** (Đăng ký đề tài tốt nghiệp) vào portal **`student`**:

### ⚡ Bước 1: Tạo cấu trúc thư mục
Tạo thư mục `src/features/student/topic_registration/` với đủ 6 thư mục con và file `index.ts`.

> **Lệnh PowerShell tạo nhanh 1 giây:**
> ```powershell
> $feat = "src/features/student/topic_registration"
> mkdir "$feat/components", "$feat/pages", "$feat/hooks", "$feat/services", "$feat/store", "$feat/types"
> New-Item "$feat/index.ts", "$feat/types/types.ts", "$feat/types/index.ts", "$feat/services/topic.service.ts", "$feat/services/index.ts", "$feat/store/topic.store.ts", "$feat/store/index.ts", "$feat/hooks/useTopic.ts", "$feat/hooks/index.ts", "$feat/pages/TopicRegistrationPage.tsx", "$feat/pages/index.ts", "$feat/components/index.ts"
> ```

---

### ⚡ Bước 2: Viết Type & Service (`types/` & `services/`)

#### 📄 `types/types.ts`
```typescript
export interface Topic {
  id: string
  code: string
  title: string
  lecturerName: string
  maxStudents: number
  currentStudents: number
  description: string
  status: 'AVAILABLE' | 'FULL'
}
```

#### 📄 `services/topic.service.ts`
```typescript
import { apiClient } from '@/shared/api/client'
import type { ApiResponse } from '@/shared/types'
import type { Topic } from '../types/types'

export interface ITopicService {
  getTopics(): Promise<Topic[]>
  registerTopic(topicId: string): Promise<boolean>
}

// Mock fallback để giao diện hiển thị được ngay lập tức khi Vibe Coding
const MOCK_TOPICS: Topic[] = [
  {
    id: 't1',
    code: 'DT-2026-01',
    title: 'Xây dựng hệ thống Quản lý Đồ án Tốt nghiệp tích hợp AI',
    lecturerName: 'TS. Nguyễn Văn A',
    maxStudents: 2,
    currentStudents: 1,
    description: 'Nghiên cứu ứng dụng GenAI hỗ trợ quản lý đề tài và phân công hội đồng.',
    status: 'AVAILABLE',
  },
  {
    id: 't2',
    code: 'DT-2026-02',
    title: 'Nền tảng thi trực tuyến chống gian lận dựa trên Vision AI',
    lecturerName: 'ThS. Trần Thị B',
    maxStudents: 3,
    currentStudents: 3,
    description: 'Hệ thống nhận diện cử chỉ và giám sát qua webcam theo thời gian thực.',
    status: 'FULL',
  },
]

export const topicService: ITopicService = {
  getTopics: async () => {
    try {
      const res = await apiClient.get<ApiResponse<Topic[]>>('/student/topics')
      return res.data.data
    } catch {
      return MOCK_TOPICS
    }
  },
  registerTopic: async (topicId: string) => {
    try {
      const res = await apiClient.post<ApiResponse<boolean>>('/student/topics/register', { topicId })
      return res.data.code === 1000
    } catch {
      return true
    }
  },
}
```

---

### ⚡ Bước 3: Tạo Store hoặc Hook (`store/` & `hooks/`)

#### 📄 `store/topic.store.ts` (Nếu cần lưu bộ lọc, tìm kiếm, tab đang chọn)
```typescript
import { create } from 'zustand'

interface TopicState {
  searchTerm: string
  statusFilter: string
  setSearchTerm: (term: string) => void
  setStatusFilter: (status: string) => void
}

export const useTopicStore = create<TopicState>((set) => ({
  searchTerm: '',
  statusFilter: 'ALL',
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
}))
```

#### 📄 `hooks/useTopic.ts`
```typescript
import { useState, useEffect } from 'react'
import { topicService } from '../services/topic.service'
import type { Topic } from '../types/types'
import { toast } from '@/shared/components/feedback/toast.store'

export function useTopic() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    topicService
      .getTopics()
      .then((data) => setTopics(data))
      .finally(() => setLoading(false))
  }, [])

  const handleRegister = async (topicId: string) => {
    const success = await topicService.registerTopic(topicId)
    if (success) {
      toast.success('Đăng ký đề tài thành công!')
    }
  }

  return { topics, loading, handleRegister }
}
```

---

### ⚡ Bước 4: Tạo Page UI Component (`pages/TopicRegistrationPage.tsx`)

> **LƯU Ý QUAN TRỌNG:** Phải sử dụng **`export default`** cho component trang để Router có thể dùng `React.lazy()`.

#### 📄 `pages/TopicRegistrationPage.tsx`
```tsx
import { useTopic } from '../hooks/useTopic'

export default function TopicRegistrationPage() {
  const { topics, loading, handleRegister } = useTopic()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Đăng ký Đề tài Tốt nghiệp</h1>
          <p className="text-sm text-slate-500">Danh sách các đề tài đồ án mở đăng ký cho sinh viên.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Đang tải danh sách đề tài...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {topics.map((t) => (
            <div key={t.id} className="border border-slate-200 bg-white rounded-xl p-5 shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-[#1565C0] rounded-md">
                    {t.code}
                  </span>
                  <h3 className="mt-2 text-base font-semibold text-slate-800">{t.title}</h3>
                </div>
                <span className="text-xs text-slate-400">GVHD: {t.lecturerName}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">{t.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {t.currentStudents}/{t.maxStudents} sinh viên
                </span>
                <button
                  onClick={() => handleRegister(t.id)}
                  disabled={t.status === 'FULL'}
                  className="px-3 py-1.5 bg-[#1565C0] hover:bg-[#0D47A1] disabled:bg-slate-200 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  {t.status === 'FULL' ? 'Đã đủ' : 'Đăng ký'}
                </button>
              </div>
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

#### 1️⃣ Cập nhật `src/features/student/topic_registration/index.ts`
```typescript
export * from './types'
export * from './services'
export * from './store'
export * from './hooks'
export * from './components'
export { default as TopicRegistrationPage } from './pages/TopicRegistrationPage'
```

Và thêm vào `src/features/student/index.ts`:
```typescript
export * from './topic_registration'
```

#### 2️⃣ Đăng ký Route trong `src/app/routes/student.routes.tsx`
```tsx
import { lazy } from 'react'

// Lazy load trang vừa tạo
const TopicRegistrationPage = lazy(() => import('@/features/student/topic_registration/pages/TopicRegistrationPage'))

export const studentRoutes: RouteObject = {
  path: 'student',
  element: <ProtectedRoute allowedRoles={['student']} />,
  children: [
    {
      element: <StudentLayout />,
      children: [
        // ... các route khác
        {
          path: 'topic-registration',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <TopicRegistrationPage />
            </Suspense>
          ),
        },
      ],
    },
  ],
}
```

#### 3️⃣ Đăng ký Menu Sidebar trong `src/features/student/layouts/components/studentNav.config.ts`
```typescript
import { BookCheck } from 'lucide-react'

export const studentNavItems: StudentNavItem[] = [
  // ...
  {
    title: 'Đăng ký Đề tài',
    path: '/student/topic-registration',
    icon: BookCheck,
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
| **Thêm tính năng mới cho Sinh viên** | `src/features/student/<tên_tính_năng>/` |
| **Đổi icon hoặc menu điều hướng bên trái** | `src/features/student/layouts/components/studentNav.config.ts` |
| **Thêm URL / Trang mới vào hệ thống Sinh viên** | `src/app/routes/student.routes.tsx` |
| **Lưu thông tin đăng nhập hoặc phiên làm việc Sinh viên** | `src/features/auth/store/authStore.ts` |
| **Kiểm tra type lỗi toàn dự án** | Chạy lệnh `npx tsc -b` ở terminal |

---

## 6. MẸO PROMPT KHI VIBE CODING VỚI AI

Khi yêu cầu AI sinh code cho một tính năng mới trong dự án này, bạn có thể copy đoạn prompt chuẩn sau:

> *"Hãy tạo cho tôi tính năng `[tên_tính_năng]` trong portal Sinh viên (`src/features/student/[tên_tính_năng]`) theo chuẩn cấu trúc trong `Folder_Architecture.md`:*  
> *1. Tạo đủ 6 thư mục (`components`, `pages`, `hooks`, `services`, `store`, `types`) và file `index.ts`.*  
> *2. `services/` phải có Interface `I...Service` và Mock fallback data đầy đủ để hiển thị.*  
> *3. `pages/` xuất ra `export default`.*  
> *4. Cập nhật route vào `src/app/routes/student.routes.tsx` và sidebar vào `studentNav.config.ts`.*  
> *5. Gam màu chủ đạo `#1565C0`, chạy `npx tsc -b` không lỗi."*

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
   toast.success('Đăng ký đề tài thành công!')
   toast.error('Đã hết hạn đăng ký đề tài!')
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
