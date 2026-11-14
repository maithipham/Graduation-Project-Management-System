# BẢNG TỔNG HỢP YÊU CẦU KỸ THUẬT FRONT-END CHI TIẾT

Dự án: Hệ thống Hỗ trợ Quản lý Quy trình Thực hiện Đồ án Tốt nghiệp
Công nghệ Front-end: Vite + ReactJS + TypeScript

Tài liệu này liệt kê TẤT CẢ 36 hạng mục kỹ thuật từ đặc tả yêu cầu, cùng với trạng thái hiện tại của portal Lecturer
(đối chiếu với code ngày 15/10/2026):
✅ `[x]` Đã hoàn thành và đang chạy trong ứng dụng.
🔧 `[ ]` + **(Có nền)** Đã viết sẵn hook/component/cấu hình nhưng chưa được dùng ở màn hình nào.
⏳ `[ ]` Chưa triển khai.

## I. Tối ưu tốc độ tải (Vite & Build)
- [x] **1. Code Splitting & Lazy Loading:** Phân tách gói tải theo vai trò người dùng bằng `React.lazy()` và `<Suspense>` (`app/routes`, helper `withSuspense`).
- [x] **2. Manual Chunks Splitting:** Phân mảnh các gói thư viện nặng trong `vite.config.ts` (chia `react-vendor`, `data-vendor`).
- [x] **3. Bundle Analyzer:** Cài đặt `rollup-plugin-visualizer` để đo lường dung lượng build.
- [x] **4. Path Alias (@/):** Chuẩn hóa đường dẫn import (`vite.config.ts`, `tsconfig.json`).
- [x] **5. Asset & Icon Tree-shaking:** Sử dụng bộ icon vector `lucide-react` để tối ưu dung lượng.

## II. Trải nghiệm chờ (Loading & Feedback UX)
- [ ] **6. Skeleton Loading:** Hiển thị khung xám nhấp nháy giữ chỗ để tránh giật vỡ layout (CLS).
  **(Có nền)** Component `Skeleton` trong `@/shared/components/ui`, chưa màn hình nào dùng.
- [ ] **7. Upload Progress Tracker:** Hiển thị thanh tiến trình tải file % bằng `onUploadProgress` của axios/fetch và `AbortController`.
  **(Có nền)** Hook `useFileUpload` trong `@/shared/hooks`, chưa màn hình nào dùng.
- [ ] **8. Button Mutation State:** Khóa nút (disabled) và đổi chữ (isPending) khi bấm submit để tránh double-submit (Sử dụng TanStack Query).
  **(Có nền)** Quy tắc đã ghi trong `AGENTS.md` mục 5 và mẫu ở skill `build-form`; chưa có form thật nào gọi API.
- [ ] **9. Optimistic UI (Có chọn lọc):** Cập nhật UI ngay lập tức khi thực hiện thao tác phụ trợ (dùng `onMutate` của TanStack Query).

## III. Bảo vệ dữ liệu & Biểu mẫu (Forms & Safety)
- [ ] **10. Form Auto-draft (Lưu nháp cục bộ):** Tự động lưu nháp dữ liệu biểu mẫu vào `localStorage` qua hook tự viết (`useLocalStorage.ts`).
  **(Có nền)** Hook `useLocalStorage` trong `@/shared/hooks`, chưa form nào dùng. Không lưu dữ liệu nhạy cảm (điểm, hồ sơ sinh viên) vào nháp.
- [ ] **11. Cross-field Form Validation:** Validate biểu mẫu hiển thị trên UI bằng `react-hook-form` kết hợp `zod` schema.
  **(Có nền)** Component `FormField` (lỗi đỏ dưới ô input) + skill `build-form` (có mẫu `.refine` so sánh 2 trường); chưa form thật nào dùng.
- [ ] **12. Rich Text Editor:** Soạn thảo văn bản có định dạng chuẩn bằng `@tiptap/react` hoặc `lexical`.
- [ ] **13. Conditional Dropdown Filtering:** Ràng buộc logic lọc mảng động (array filter) trên component Select (VD: loại trừ GVHD khỏi danh sách Hội đồng).

## IV. Bảo mật & Phân quyền (Routing & RBAC)
- [ ] **14. Client-side Route Guard:** Chặn truy cập URL trái phép bằng `<ProtectedRoute>` component.
  **(Có nền)** Component `ProtectedRoute` trong `@/features/auth`, nhưng các route chưa được bọc → hiện ai cũng vào được mọi URL.
- [ ] **15. Permission Component Check:** Tự động ẩn nút chức năng khi không có thẩm quyền bằng `<CanAccess>` component.
  **(Có nền)** Component `CanAccess` trong `@/features/auth`, chưa màn hình nào dùng.
- [ ] **16. Role Switcher:** Chuyển đổi ngữ cảnh làm việc (Active Role) qua Zustand store trên Navbar/Header (`<RoleSwitcher>`).
  **(Có nền)** Component `RoleSwitcher` trong `@/features/auth`, chưa gắn vào header nào.

## V. Quản lý dữ liệu & Mạng (Network Resilience)
- [x] **17. Multi-tier Caching:** Cấu hình cache `staleTime`, `refetchOnWindowFocus` trong TanStack Query (`queryClient.ts`): mặc định 30 giây, dữ liệu danh mục ít đổi 30 phút.
- [x] **18. Silent Token Refresh:** Gia hạn token ngầm thông qua Axios Interceptors (bắt lỗi HTTP 401): gọi `POST /refresh-token` 1 lần
  (nhiều request 401 cùng lúc dùng chung 1 lần), refresh thất bại thì về `/login` (`shared/api/interceptors.ts`, `shared/api/session.ts`).
- [ ] **19. Request Cancellation:** Tự động hủy yêu cầu cũ khi đổi bộ lọc liên tục (Race condition) thông qua `AbortController`.
  **(Có nền)** Hàm `createCancellableRequest` trong `shared/api/client.ts`, chưa dùng. Khi nối API nên truyền `signal`
  của TanStack Query (`queryFn: ({ signal }) => ...`) vào axios thay vì tự quản lý.

## VI. Tệp tin, Tài liệu & In ấn (Files & Print)
- [ ] **20. Client-side Excel Parser:** Đọc và preview file Excel từ client trước khi upload (sử dụng `xlsx` hoặc `papaparse`).
- [ ] **21. Client-side Excel Export:** Xuất bảng danh sách ra file Excel (`xlsx` hoặc `exceljs`).
- [ ] **22. In-browser PDF Viewer:** Nhúng khung đọc file PDF đồ án cạnh biểu mẫu chấm điểm (`@react-pdf-viewer/core` hoặc `<iframe>`).
- [ ] **23. Image Lightbox Viewer:** Phóng to/thu nhỏ ảnh scan chứng từ pháp lý (`yet-another-react-lightbox`).
- [ ] **24. CSS Print Layout (@media print):** Căn lề chuẩn A4 và ẩn điều hướng khi bấm in tài liệu (`shared/styles/print.css`).
  **(Có nền)** File `print.css` đã được nạp, nhưng chỉ ẩn các class của `PublicLayout` (`.topbar`, `.footer`, `.demo-*`);
  sidebar/header của Admin, Lecturer, Department vẫn bị in ra.

## VII. Tương tác dữ liệu & Kéo thả (Data Grid & DnD)
- [ ] **25. Table Virtualization:** Dựng hình mượt mà các bảng dài ngàn dòng (`@tanstack/react-virtual`).
- [ ] **26. Sortable Drag-and-Drop:** Kéo thả đổi thứ tự bảo vệ của sinh viên (`@hello-pangea/dnd` hoặc `@dnd-kit/core`).
- [ ] **27. Transfer List (Dual Listbox):** Chọn danh sách song song 2 cột để kéo thả sinh viên vào nhóm giảng viên.

## VIII. Tính toán thời gian thực & Nghiệp vụ đặc thù
- [ ] **28. Live Outlier Alert (Cảnh báo điểm lạc):** Cảnh báo đỏ nhấp nháy nếu độ lệch điểm giữa các ủy viên > 2.0.
- [ ] **29. Server-synced Countdown Banner:** Đếm ngược hạn chót nộp bài đồng bộ với giờ máy chủ.
- [ ] **30. Streaming Text UI:** Hiển thị văn bản biên bản AI theo dạng chữ chạy (SSE).
- [ ] **31. Capacity / Quota Badge:** Huy hiệu hiển thị trực quan `số sinh viên đã nhận / tổng slot` của GV.
- [ ] **32. Interactive Schedule Grid:** Lưới lịch trực quan phân chia ca và phòng bảo vệ.
- [ ] **33. Audit Trail & Diff Viewer:** Khung so sánh nội dung cũ/mới của đề cương (`react-diff-viewer-continued`).

## IX. Chống sập & Kiến trúc (Resilience & Architecture)
- [ ] **34. Granular Error Boundaries:** Bọc vùng bắt lỗi riêng biệt không làm sập toàn trang bằng `<ErrorBoundary>` (react-error-boundary).
  **(Có nền)** Hiện chỉ có 1 `ErrorBoundary` bọc toàn ứng dụng (`app/App.tsx`); chưa bọc riêng từng trang/vùng
  (bản trong `ProtectedRoute` chưa chạy vì `ProtectedRoute` chưa được dùng).
- [x] **35. Feature-based Architecture:** Chia thư mục mã nguồn chuẩn hóa theo từng nghiệp vụ (`src/features/<role>/<sub_feature>`), quy tắc ở `AGENTS.md` mục 3.
- [x] **36. State Separation (Server vs Client):** Dữ liệu API dùng TanStack Query, trạng thái giao diện dùng thư viện Zustand
  (hiện Zustand chỉ giữ `authStore` và `toast.store`).
