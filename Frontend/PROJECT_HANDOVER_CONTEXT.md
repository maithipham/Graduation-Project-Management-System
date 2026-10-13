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

## 4. NHIỆM VỤ TIẾP THEO CẦN THỰC HIỆN TRÊN PORTAL STUDENT (`Frontend/Student`)
Bây giờ chuyển trọng tâm công việc sang folder `Student`:
1. **Đánh giá kiến trúc thư mục hiện tại của Student:** Rà soát và nhận xét thẳng thắn xem cấu trúc feature-based của Student đã chuẩn theo quy cách 6 thư mục và phân cấp 2 tầng như bên Lecturer chưa.
2. **Refactor cấu trúc Student (nếu cần):** Bổ sung `store/`, `index.ts` vào từng feature; dọn dẹp các file thừa ở `shared/`.
3. **Đồng bộ chuẩn API & Toast:** Thiết lập `ApiResponse` (`code: 1000`) và cơ chế Toast 3s sang Student.
4. **Kiểm tra biên dịch:** Đảm bảo `npx tsc -b` của Student chạy qua 100% không có lỗi.
