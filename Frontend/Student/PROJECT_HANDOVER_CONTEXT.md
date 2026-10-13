# BẢN TÓM TẮT NGỮ CẢNH DỰ ÁN (PROJECT HANDOVER CONTEXT)

## 1. THÔNG TIN DỰ ÁN & TECH STACK
- **Dự án:** Hệ thống Quản lý Đồ án Tốt nghiệp (Graduation Project Management System).
- **Cấu trúc Repository:** Gồm 2 portal Frontend độc lập:
  - `Frontend/Lecturer`: Cổng dành cho Cán bộ, Giảng viên, Ban chủ nhiệm bộ môn, Quản trị viên.
  - `Frontend/Student`: Cổng dành cho Sinh viên thực hiện đồ án tốt nghiệp.
- **Công nghệ nền tảng:** React 19 + Vite 8 + TypeScript + TailwindCSS v4 + Zustand 5 + React Router 7 + TanStack Query 5.
- **Triết lý kiến trúc:** Feature-Based Architecture (Vertical Slice) phân cấp 2 tầng (Role -> Sub-feature).

---

## 2. CÁC QUY CHUẨN ĐÃ ĐƯỢC THỐNG NHẤT & TRIỂN KHAI

### A. Quy chuẩn phản hồi Backend (APIResponse):
- Backend trả về theo format Java:
  ```java
  public class APIResponse<T> {
      Integer code;    // 1000: THÀNH CÔNG, khác 1000: THẤT BẠI
      String message; // Thông điệp phản hồi
      T data;         // Dữ liệu payload
  }
  ```
- **Xử lý phía Frontend:**
  - TypeScript interface: `ApiResponse<T>`, `API_SUCCESS_CODE = 1000`, class `ApiError`.
  - Hệ thống **Toast thông báo (Zustand)**: Tự động hiển thị và tắt sau **đúng 3 giây** (`toast.success`, `toast.error`, `toast.warning`, `toast.info`).
  - **Axios Interceptor** (`src/shared/api/interceptors.ts`): Tự động phát hiện khi Backend trả về `code !== 1000` hoặc lỗi HTTP để bắn `toast.error(message, 3000)` và ném lỗi vào khối `catch/onError`.

### B. Tiêu chuẩn 6 thư mục cho mỗi Sub-Feature:
Mỗi feature nghiệp vụ bắt buộc có đủ 6 thư mục con và file `index.ts`:
```text
feature-name/
├── components/   # UI components nội bộ (có component.tsx + index.ts)
├── pages/        # Route entrypoint (export default cho React.lazy, có index.ts)
├── hooks/        # Custom hooks nghiệp vụ (có hook.ts + index.ts)
├── services/     # API Service (I...Service + Mock fallback, có s.service.ts + index.ts)
├── store/        # Zustand local store (có <feature>.store.ts + index.ts)
├── types/        # Type definitions (có types.ts + index.ts)
└── index.ts      # Barrel export công khai của feature
```

### C. Quy chuẩn thư mục `src/shared/` tinh gọn:
- Đã dọn dẹp các file thừa:
  - Không dùng `animations.css` (dùng class Tailwind v4 `animate-spin` có sẵn).
  - Không dùng `env.ts` / `appConfig.ts` (cấu hình mạng tập trung tại `src/shared/api/client.ts`).
  - Không tạo thư mục lẻ `buttons/` (quy về `ui/button.tsx`).
- Thư mục `components` chỉ giữ 3 nhóm: `ui/`, `feedback/` (kèm Toast), và `layout/`.

---

## 3. CÁC CÔNG VIỆC ĐÃ HOÀN TẤT BÊN PORTAL LECTURER
1. Đã hoàn thiện tài liệu hướng dẫn Vibe Coding chi tiết tại: `Frontend/Lecturer/Folder_Architecture.md`.
2. Đã sửa triệt để toàn bộ lỗi import `index.ts` của 7 sub-feature thuộc 3 role (`admin`, `lecturer`, `department`) bằng cách bổ sung `index.ts` vào từng thư mục con và gán `export {}` hợp lệ.
3. Khởi tạo `lecturer/dashboard` hoàn chỉnh.
4. Kiểm tra toàn bộ: `npx tsc -b` sạch 100% không lỗi (clean build) và `vitest run` đạt 4/4 test suites (10/10 tests passed).

---

## 4. CÁC CÔNG VIỆC ĐÃ HOÀN TẤT BÊN PORTAL STUDENT (`Frontend/Student`)
1. **Chuẩn hóa hạ tầng `src/shared/`:**
   - Đồng bộ chuẩn phản hồi Backend Java: `ApiResponse<T>` với `API_SUCCESS_CODE = 1000` và class `ApiError`.
   - Xây dựng hệ thống Toast Zustand tự động tắt sau đúng 3s (`toast.store.ts` & `ToastContainer.tsx`).
   - Cập nhật Axios Interceptor tự động bắt lỗi `code !== 1000` và lỗi mạng để kích hoạt `toast.error(message, 3000)`.
   - Bổ sung `FeaturePlaceholder.tsx`. Dọn dẹp các import rác (`animations.css`, `buttons/LoadingButton`).
2. **Chuẩn hóa phân hệ `src/features/auth/`:**
   - Quy hoạch chuẩn 6 thư mục: `components/`, `hooks/`, `pages/`, `services/`, `store/`, `types/`.
   - Thêm đầy đủ file `index.ts` nội bộ và barrel export sạch sẽ. Sửa lỗi unused `React` trong `LoginPage.tsx`.
3. **Khởi tạo phân hệ `src/features/student/`:**
   - Dựng khung `layouts/`: `StudentLayout.tsx`, `StudentSidebar.tsx` (toggle Ctrl+B, mobile drawer), `StudentHeader.tsx`.
   - Xây dựng sub-feature mẫu `feature_1/` và `feature_2/` đạt chuẩn 100% 6 thư mục con cho Vibe Coding.
   - Kết nối barrel export `src/features/student/index.ts` và `src/features/index.ts`.
4. **Kết nối Routing & App Shell (`src/app/`):**
   - Nhúng `ToastContainer` vào `App.tsx`.
   - Mở khóa `student.routes.tsx` tích hợp `StudentLayout`, `ProtectedRoute`, `FeaturePlaceholder` và lazy-load `Feature1Page`, `Feature2Page`.
   - Tích hợp `studentRoutes` vào `src/app/routes/index.tsx`.
5. **Tài liệu Kiến trúc & Hướng dẫn Vibe Coding:**
   - Đã tạo hoàn chỉnh `Frontend/Student/Folder_Architecture.md` với tiêu chuẩn 6 thư mục con, chuẩn phản hồi Backend `ApiResponse` (`code: 1000`), Toast 3s, quy trình 6 bước Vibe Coding và prompt chuẩn cho AI.
6. **Kiểm tra chất lượng & Nghiệm thu (Verification):**
   - TypeScript `npx tsc -b`: Clean build 100% (0 errors).
   - Vite Production Build `npm run build`: Thành công 100%.
   - Vitest `npm test`: Pass 5/5 active test suites (11/11 tests passed).

