# HƯỚNG DẪN KIẾN TRÚC FEATURE-BASED (CHUẨN DỰ ÁN)

Tài liệu này quy chuẩn cấu trúc thư mục, triết lý thiết kế và quy tắc lập trình theo mô hình **Feature-Based Architecture (Kiến trúc theo tính năng)** kết hợp với **Clean Architecture & SOLID** cho hệ thống Frontend (áp dụng cho cả dự án **Student** và **Lecturer**).

---

## 1. TẠI SAO LẠI DÙNG FEATURE-BASED?

### ❌ Vấn đề của kiến trúc truyền thống (Layer-Based / Monolithic)
Trong cấu trúc cũ, code được gom theo loại file:
```text
src/
├── pages/       # Gom tất cả 30-40 trang của SV, GV, Admin vào 1 chỗ
├── components/  # Hàng trăm component dùng chung lẫn lộn
├── services/    # 1 file hoặc 1 folder phình to, ôm toàn bộ API cả trường
├── hooks/       # Hooks của tất cả chức năng gom chung
└── types/       # Hàng trăm interface gộp chung
```
* **Nhược điểm**: Khi sửa tính năng "Nộp đề cương", developer phải nhảy qua lại giữa 5 thư mục cách xa nhau (`src/pages`, `src/services`, `src/hooks`, `src/types`, `src/components`).
* **Độ phụ thuộc cao (High Coupling)**: Xóa hoặc đổi 1 tính năng rất dễ làm gãy tính năng khác.

### ✅ Giải pháp: Feature-Based (Vertical Slice Architecture)
Mỗi tính năng là một **"lát cắt dọc"** khép kín và tự chủ:
* Tất cả những gì thuộc về tính năng đó (UI, Logic, API, Types, State) đều nằm **chung trong một thư mục**.
* **Dễ bảo trì**: Cần sửa tính năng nào thì chỉ mở đúng thư mục đó.
* **Dễ xóa/mở rộng**: Xóa 1 feature là xóa toàn bộ code liên quan, không để lại rác ở các tầng khác.
* **Tuân thủ SOLID**: Single Responsibility (Mỗi module giải quyết 1 nghiệp vụ), Interface Segregation (Service có interface riêng biệt).

---

## 2. NGUYÊN TẮC PHÂN CẤP 2 TẦNG (TWO-TIER HIERARCHY)

Dự án có nhiều vai trò (Student, Lecturer, Admin, Bộ môn) cùng với chức năng Xác thực (Auth). Do đó, thư mục `src/feature/` được chia theo **2 tầng rõ ràng**:

```text
src/feature/
├── <role-module>/           # TẦNG 1: Phân cấp theo Vai trò / Hệ thống con
│   ├── <sub-feature-1>/     # TẦNG 2: Tính năng nghiệp vụ con (Chuẩn 6 thư mục)
│   ├── <sub-feature-2>/     # TẦNG 2: Tính năng nghiệp vụ con (Chuẩn 6 thư mục)
│   ├── layouts/             # Shell Layout riêng của Role đó
│   ├── styles/              # CSS styling riêng của Role đó
│   ├── types.ts             # Barrel export types của Role
│   └── index.ts             # Public API / Barrel export của Role
```

### Các Role Modules trong hệ thống:
1. **`auth`**: Xác thực, đăng nhập, bảo vệ route, phiên làm việc (`ProtectedRoute`, `RoleSwitcher`, `authStore`).
2. **`student`**: Toàn bộ nghiệp vụ cổng sinh viên (`overview`, `registration`, `outline`, `report`, `documents`, `schedule`, `results`, `lecturer-list`).
3. **`lecturer`**: Cổng giảng viên (`dashboard`, `topic-manage`, `review-outline`, `report-eval`, `council`, `department`).
4. **`admin`**: Cổng quản trị hệ thống (`dashboard`, `account`, `semester`, `major`).
5. **`department`**: Cổng trưởng bộ môn / giáo vụ (`dashboard`, `user-import`, `supervisor-assignment`, `council`, `reminders`).

---

## 3. TIÊU CHUẨN 6 THƯ MỤC CỦA MỖI SUB-FEATURE

Mỗi thư mục tính năng con (ví dụ: `outline/`, `registration/`, `topic-manage/`) **bắt buộc phải có đầy đủ 6 thư mục con + 1 file `index.ts`**:

```text
feature-name/
├── components/   # 1. UI Components nội bộ
├── pages/        # 2. Trang hoàn chỉnh (Route entrypoint)
├── hooks/        # 3. Custom Hooks (Logic & State management)
├── services/     # 4. API Calls & Interface nghiệp vụ
├── store/        # 5. Local State Management (Zustand)
├── types/        # 6. Type Definitions & DTOs
└── index.ts      # 7. Barrel export công khai của feature
```

### Chi tiết nhiệm vụ từng thư mục:

| Thư mục | Nhiệm vụ cụ thể | Ví dụ nội dung |
| :--- | :--- | :--- |
| **`components/`** | Chứa các UI components nhỏ, chuyên biệt, chỉ phục vụ riêng cho tính năng này. Nếu chưa cần component con, tạo `index.ts` rỗng (`export {}`). | `OutlineReviewModal.tsx`, `TopicFilterBar.tsx` |
| **`pages/`** | Chứa file Component trang chính (Page). File này kết hợp các components, hooks và xuất ra `export default` để Router lazy-load. | `StudentOutlinePage.tsx`, `index.ts` |
| **`hooks/`** | Chứa các custom hook chứa logic điều khiển giao diện, gọi API service, xử lý dữ liệu và lifecycle. | `useStudentOutline.ts`, `index.ts` |
| **`services/`** | Chứa interface (`I...Service`) và implementation gọi API qua `apiClient`. Tự chứa mock fallback khi API chưa sẵn sàng. | `outline.service.ts`, `index.ts` |
| **`store/`** | Chứa Zustand store quản lý state phức tạp hoặc chia sẻ giữa các sub-component trong feature. | `outlineStore.ts`, `index.ts` |
| **`types/`** | Chứa các TypeScript interface, type, enum mô tả cấu trúc dữ liệu, request, response của feature. | `types.ts`, `index.ts` |
| **`index.ts`** | Public API của feature. Re-export tất cả những gì feature cho phép bên ngoài dùng. | `export * from './types'`, `export * from './pages'`... |

---

## 4. QUY TẮC PHÂN CHIA VỊ TRÍ: NẰM Ở ĐÂU LÀ ĐÚNG?

Để tránh việc sinh ra các thư mục "lạc loài" (như `services/`, `styles/`, `layouts/` trôi nổi ngang hàng với feature):

### 1. Thư mục `layouts/` và `styles/`
* **Vị trí đúng**: Nằm bên trong thư mục **Role tương ứng** (ví dụ: `src/feature/student/layouts/StudentLayout.tsx` và `src/feature/student/styles/student.css`).
* **Lý do**: `StudentLayout` và `student.css` chỉ phục vụ các trang của sinh viên, không phục vụ toàn bộ app.

### 2. Thư mục `src/shared/` vs `src/feature/`
* **Đưa vào `src/shared/`** khi:
  * Thành phần đó là **hạ tầng hoặc UI dùng chung toàn ứng dụng**: `Button`, `Badge`, `Modal`, `LoadingFallback`, `ErrorFallback`.
  * Client mạng hạ tầng: `src/shared/api/client.ts` (Axios), `src/shared/api/queryClient.ts` (React Query).
  * Hàm tiện ích chung: `src/shared/utils/formatDate.ts`.
* **Đưa vào `src/feature/`** khi:
  * Thành phần đó gắn liền với nghiệp vụ cụ thể (Ví dụ: "Đăng ký đề tài", "Đánh giá điểm đồ án", "Phân công GVHD").

### 3. Thư mục `src/app/`
* Chứa code khởi tạo toàn bộ ứng dụng:
  * `src/app/App.tsx`: Khởi tạo React Query Provider, Error Boundary, Router.
  * `src/app/App.css`: Import Tailwind và các file CSS toàn cục từ `shared/styles/`.
  * `src/app/routes/`: Cấu hình danh sách route, lazy-loading trang (`index.tsx`, `student.routes.tsx`, `lecturer.routes.tsx`, v.v.).

### ❌ CÁC ĐIỀU TUYỆT ĐỐI CẤM
1. **KHÔNG** tạo thư mục `src/services/` monolithic ở root `src/` (toàn bộ mạng thuộc về `shared/api`, nghiệp vụ thuộc về từng feature).
2. **KHÔNG** để thư mục `services/` trôi nổi ở ngoài `src/feature/` hoặc `src/feature/student/`.
3. **KHÔNG** import chọc sâu vào nội tạng của feature khác (Ví dụ KHÔNG viết: `import { ... } from '@/feature/student/overview/services/overview.service'`). **HÃY VIẾT**: `import { ... } from '@/feature/student/overview'` hoặc `@/feature/student'`.

---

## 5. CẤU TRÚC THƯ MỤC CHUẨN CỦA DỰ ÁN

### A. Dự án `Student/src/`

```text
Student/src/
├── app/                                     # Khởi tạo App & Routes
│   ├── routes/
│   │   ├── index.tsx                        # Router tổng hợp
│   │   └── student.routes.tsx               # Danh sách routes sinh viên
│   ├── App.tsx
│   ├── App.css
│   └── index.ts
│
├── shared/                                  # Dùng chung toàn hệ thống
│   ├── api/                                 # client.ts, queryClient.ts, endpoints.ts
│   ├── components/                          # UI primitives: button, badge, layout
│   ├── hooks/                               # Hooks tiện ích chung
│   ├── styles/                              # variables.css, global.css, responsive.css
│   └── utils/                               # helpers
│
└── feature/                                 # Toàn bộ nghiệp vụ tính năng
    ├── auth/                                # 1. Xác thực & Đăng nhập
    │   ├── components/                      # ProtectedRoute, RoleSwitcher, CanAccess
    │   ├── pages/                           # LoginPage.tsx
    │   ├── hooks/                           # useAuth.ts
    │   ├── services/                        # auth.service.ts
    │   ├── store/                           # authStore.ts
    │   ├── types.ts
    │   └── index.ts
    │
    └── student/                             # 2. Portal Sinh viên
        ├── overview/                        # Sub-feature 1: Tổng quan tiến độ
        ├── registration/                    # Sub-feature 2: Đăng ký đề tài
        ├── outline/                         # Sub-feature 3: Đề cương đồ án
        ├── report/                          # Sub-feature 4: Báo cáo tiến độ
        ├── documents/                       # Sub-feature 5: Biểu mẫu & hướng dẫn
        ├── schedule/                        # Sub-feature 6: Lịch bảo vệ
        ├── results/                         # Sub-feature 7: Kết quả đánh giá
        ├── lecturer-list/                   # Sub-feature 8: Tra cứu danh sách GVHD
        │   └── [mỗi sub-feature trên có đủ: components, pages, hooks, services, store, types, index.ts]
        │
        ├── layouts/                         # StudentLayout.tsx
        ├── styles/                          # student.css
        ├── types.ts                         # Re-export types toàn bộ student
        └── index.ts                         # Re-export toàn bộ modules student
```

---

### B. Dự án `Lecturer/src/`

```text
Lecturer/src/
├── app/                                     # Khởi tạo App & Routes
│   ├── routes/
│   │   ├── index.tsx                        # Router tổng
│   │   ├── lecturer.routes.tsx              # Routes Giảng viên
│   │   ├── admin.routes.tsx                 # Routes Quản trị
│   │   └── department.routes.tsx            # Routes Bộ môn
│   ├── App.tsx
│   ├── App.css
│   └── index.ts
│
├── shared/                                  # Dùng chung (api, ui, utils, styles)
│
└── feature/                                 # 4 Roles độc lập
    ├── auth/                                # Xác thực, đăng nhập
    │
    ├── lecturer/                            # Role 1: Giảng viên (Chuẩn 6 thư mục mỗi sub-feature)
    │   ├── dashboard/                       # Dashboard tiến độ hướng dẫn
    │   ├── topic-manage/                    # Quản lý & duyệt đề tài
    │   ├── review-outline/                  # Nhận xét & phản biện đề cương
    │   ├── report-eval/                     # Đánh giá báo cáo & chấm điểm
    │   ├── council/                         # Chấm điểm hội đồng bảo vệ
    │   ├── department/                      # Kênh liên hệ ban chủ nhiệm bộ môn
    │   ├── layouts/LecturerLayout.tsx       # Khung layout giảng viên
    │   ├── styles/lecturer.css              # Style giảng viên
    │   ├── types.ts
    │   └── index.ts
    │
    ├── admin/                               # Role 2: Quản trị viên
    │   ├── dashboard/                       # Tổng quan hệ thống
    │   ├── account/                         # Quản lý tài khoản người dùng
    │   ├── semester/                        # Quản lý đợt đồ án / học kỳ
    │   ├── major/                           # Quản lý ngành học
    │   ├── layouts/AdminLayout.tsx          # Khung layout admin
    │   └── styles/admin.css
    │
    └── department/                          # Role 3: Trưởng bộ môn & Giáo vụ
        ├── dashboard/                       # Tổng quan bộ môn
        ├── user-import/                     # Import danh sách SV / GV
        ├── supervisor-assignment/           # Phân công giảng viên hướng dẫn
        ├── council/                         # Thành lập hội đồng bảo vệ
        ├── reminders/                       # Gửi nhắc nhở thời hạn
        ├── layouts/DepartmentLayout.tsx     # Khung layout bộ môn
        └── styles/department.css
```

---

## 6. TEMPLATE MẪU KHI TẠO THÊM 1 TÍNH NĂNG MỚI

Khi bạn cần thêm một tính năng mới (ví dụ `feedback`), hãy tạo đủ cấu trúc sau:

```text
src/feature/<role>/feedback/
├── components/
│   ├── FeedbackModal.tsx
│   └── index.ts
├── pages/
│   ├── FeedbackPage.tsx
│   └── index.ts
├── hooks/
│   ├── useFeedback.ts
│   └── index.ts
├── services/
│   ├── feedback.service.ts
│   └── index.ts
├── store/
│   ├── feedbackStore.ts
│   └── index.ts
├── types/
│   ├── types.ts
│   └── index.ts
└── index.ts
```

### Mẫu file `index.ts` chuẩn của feature:
```typescript
// src/feature/<role>/feedback/index.ts
export * from './types'
export * from './services'
export * from './store'
export * from './hooks'
export * from './components'
export * from './pages'
```

### Mẫu file `services/feedback.service.ts` chuẩn (có Interface theo SOLID):
```typescript
import { apiClient } from '@/shared/api/client'
import type { FeedbackItem } from '../types'

export interface IFeedbackService {
  getFeedbacks(): Promise<FeedbackItem[]>
  sendFeedback(content: string): Promise<boolean>
}

export const feedbackService: IFeedbackService = {
  getFeedbacks: async () => {
    try {
      const res = await apiClient.get<FeedbackItem[]>('/feedbacks')
      return res.data
    } catch {
      return [] // Mock fallback an toàn khi mất mạng hoặc API chưa sẵn sàng
    }
  },
  sendFeedback: async (content) => {
    const res = await apiClient.post('/feedbacks', { content })
    return res.status === 200
  },
}
```

---

## 7. CHECKLIST KIỂM TRA ĐẠT CHUẨN

Mỗi khi code xong hoặc review code, dùng checklist này:

* [ ] Sub-feature có đầy đủ **6 thư mục con**: `components`, `pages`, `hooks`, `services`, `store`, `types` và `index.ts`.
* [ ] Service có khai báo **Interface** rõ ràng (`interface I...Service`).
* [ ] Page được export default để Router hỗ trợ `React.lazy()` tối ưu tải trang.
* [ ] Không có thư mục `services` nào trôi nổi ở ngoài `src/feature/` hay `src/`.
* [ ] Layout và Styles của role nào nằm đúng trong thư mục role đó (`feature/<role>/layouts`, `feature/<role>/styles`).
* [ ] Chạy `npm run build` và `npm test` thành công 100% không có lỗi type hay import gãy.
