# AGENTS.md — Portal Lecturer (Frontend)

> File này được **Claude Code** (qua `CLAUDE.md`) và **Antigravity / Gemini** tự động đọc ở mọi phiên
> (Antigravity phải mở đúng folder `Frontend/Lecturer`, không mở `Frontend`).
> Đây là quy tắc luôn áp dụng. Các quy trình nhiều bước nằm trong skill ở `.agents/skills/` (xem mục 6).
> Ưu tiên khi mâu thuẫn: **file này + skill** > code đang có.

## 1. Dự án

- Hệ thống Quản lý Đồ án Tốt nghiệp — Đại học Thủy Lợi. Thư mục này là portal cho **cán bộ**:
  `admin` (Quản trị viên), `lecturer` (Giảng viên / hội đồng), `department` (Trưởng bộ môn / thư ký).
- Stack: React 19 + TypeScript + Vite, Tailwind CSS v4, React Router v7, TanStack Query v5, Zustand v5,
  react-hook-form + zod v4, axios, lucide-react. Test: Vitest + Testing Library. Lint: oxlint.
- Backend: **Spring Boot**, chạy local tại `http://localhost:8080`. Không có Swagger — hợp đồng API lấy từ
  Controller/DTO Java do người dùng cung cấp.
- Người dùng chính của repo này là **dev Backend**, không chuyên React: khi giải thích, dùng ngôn ngữ dễ hiểu,
  so sánh với khái niệm Spring khi có ích (service ↔ `@Service`, type ↔ DTO, query hook ↔ gọi repository có cache).

## 2. Lệnh

| Việc | Lệnh |
| --- | --- |
| Chạy dev | `npm run dev` |
| Kiểm tra kiểu | `npx tsc -b` |
| Lint | `npm run lint` |
| Test | `npm test` |
| Build | `npm run build` |
| Đồng bộ skill sang Claude | `npm run sync-skills` |

Trước khi báo "xong" một thay đổi code: làm theo skill **`verify-changes`**.

## 3. Kiến trúc (bắt buộc)

```
src/
├── app/routes/<role>.routes.tsx       # Đăng ký URL cho từng role
├── features/<role>/<sub_feature>/     # Nghiệp vụ — role ∈ admin | lecturer | department
│   ├── components/  pages/  hooks/  services/  store/  types/
│   └── index.ts                       # Cổng export duy nhất của feature
├── features/<role>/layouts/components/<role>Nav.config.ts   # Menu sidebar
├── features/auth/                     # Đăng nhập, phân quyền, UserRole
├── features/notification/             # Chuông thông báo + SSE, dùng chung cho cả 3 role
└── shared/                            # Chỉ chứa "viên gạch" không có nghiệp vụ
    ├── api/      (apiClient, interceptors, queryClient, endpoints)
    ├── components/ui/  (Button, Card, Dialog, Input, Select, Table, Tabs, Skeleton, Badge, Textarea)
    ├── components/feedback/ (toast, LoadingFallback, ErrorFallback, NotFound, FeaturePlaceholder)
    ├── hooks/  types/  utils/
```

Quy tắc:
1. **Không deep import vào feature khác.** Chỉ import qua `index.ts` của feature/role
   (`@/features/admin/semester_management`), không import `.../services/xxx.service`. Trong nội bộ một feature thì
   import tương đối (`../services/...`) là bình thường.
   **Ngoại lệ duy nhất:** `app/routes` import thẳng file page bằng `lazy(() => import('@/features/<role>/<feature>/pages/XxxPage'))`.
   `index.ts` của feature **không export pages** (nếu export, page bị kéo vào bundle chính, mất tác dụng lazy).
2. **`shared/` không chứa nghiệp vụ.** Component có tên nghiệp vụ (`TopicCard`, `StudentGradeModal`) phải nằm trong `features/`.
3. Luôn dùng alias `@/` cho import ngoài feature, không dùng `../../../shared`.
4. Page component: **`export default`** (để `React.lazy`), đăng ký route bằng `lazy()` + `withSuspense(<XxxPage />)`
   (helper ở `src/app/routes/withSuspense.tsx`, bọc sẵn `<Suspense fallback={<LoadingFallback />}>`).
5. Tên thư mục feature: `snake_case` (`topic_management`), đặt theo nghiệp vụ. Tên file: `PascalCase.tsx` cho component/page,
   `useXxx.ts` cho hook, `xxx.service.ts`, `xxx.store.ts`, `xxx.types.ts` hoặc `types.ts`.
   Feature chưa code chỉ có `index.ts` (`export {}`); chỉ tạo các thư mục con `types/ services/ hooks/ components/ pages/ store/`
   khi thực sự cần. Không tạo file placeholder rỗng.
6. Ưu tiên dùng component sẵn có trong `@/shared/components/ui` trước khi tự viết. Gộp class bằng `cn()` từ `@/shared/utils/cn`.
7. Role chỉ khai báo ở `@/features/auth`: `UserRole` = `'ADMIN' | 'HEAD_OF_DEPARTMENT' | 'LECTURER'` (đúng chuỗi BE trả về).
   Người đang đăng nhập: `useMyInfo()` (cache TanStack `['auth','me']`, không có store riêng). Ẩn/hiện theo role: `CanAccess`.
   Trưởng bộ môn có cả `HEAD_OF_DEPARTMENT` và `LECTURER`; portal đang dùng do URL quyết định (`/department` hay `/lecturer`).
8. **Feature dùng chung nhiều role** (có nghiệp vụ nên không đặt trong `shared/`) nằm thẳng ở `features/<feature>/`,
   ngoài thư mục role. Hiện chỉ có `auth` và `notification`. Vẫn theo đủ quy tắc trên (cổng `index.ts`, không deep import).
   Feature chỉ một role dùng thì vẫn đặt trong `features/<role>/`; muốn thêm feature dùng chung mới thì hỏi người dùng trước.

## 4. Dữ liệu & API (tóm tắt — chi tiết ở skill `connect-api`)

- Mọi response: `APIResponse<T> { code, message, data }`. **`code === 1000` là thành công**; khác 1000 là lỗi
  (ví dụ `2000` = phiên đăng nhập hết hạn). TS: `ApiResponse<T>`, `API_SUCCESS_CODE`, `ApiError` trong `@/shared/types`.
- **HTTP 401** (chưa đăng nhập hoặc token hết hạn): interceptor tự gọi `POST /refresh-token` **1 lần** (nhiều request 401
  cùng lúc dùng chung 1 lần refresh) rồi gửi lại request. Refresh thất bại hoặc gửi lại vẫn 401 → xóa trạng thái đăng nhập
  + cache, chuyển về `/login`, **không hiện thông báo** (`shared/api/session.ts` + `app/SessionExpiredListener.tsx`).
  Component không cần tự bắt lỗi 401.
- Service luôn trả về **`res.data.data`** (bóc wrapper), không trả `res.data`.
- Interceptor (`src/shared/api/interceptors.ts`) **đã tự hiện toast lỗi** → không `toast.error` lại trong component/hook.
  Chỉ tự gọi `toast.success(...)` khi thao tác thành công. Muốn tự hiển thị lỗi (ví dụ lỗi ngay trên form) thì
  truyền `{ skipErrorToast: true }` vào config axios của request đó.
- Mọi lỗi từ `apiClient` đều là `ApiError` (`code` = mã nghiệp vụ BE, `status` = HTTP status; mất mạng → `NETWORK_ERROR_CODE`).
  Kiểm tra bằng `isApiError(error)`. Query chỉ tự thử lại khi mất mạng hoặc lỗi 5xx; `staleTime` mặc định 30 giây.
- Gọi API trong component **chỉ qua TanStack Query** (`useQuery` / `useMutation`) trong `hooks/`.
  Không dùng `useEffect + useState` để fetch.
- Danh sách phân trang: backend trả **Spring Data `Page<T>`** (trang bắt đầu từ **0**). Dùng type `SpringPage<T>`
  và `PageParams` từ `@/shared/types` (file `shared/types/pagination.ts`).
- Xác thực: **JWT trong HttpOnly cookie** + Google OAuth2, có refresh token. Frontend **không đọc/ghi token**;
  request phải gửi kèm cookie (`withCredentials: true`). Không lưu token vào `localStorage`.
- Mock data: chỉ bật khi `VITE_USE_MOCK=true`. **Không** dùng kiểu `try { api } catch { return mock }`
  (nó che mất lỗi thật của backend).
- Dữ liệu từ server để TanStack Query giữ; Zustand (`store/`) chỉ dành cho state giao diện (bộ lọc, tab đang chọn, bản nháp).

## 5. Giao diện

- Toàn bộ chữ hiển thị cho người dùng bằng **tiếng Việt có dấu**. Tên biến/hàm/file bằng tiếng Anh. Comment tiếng Việt OK.
- Styling bằng Tailwind class, tông `slate` + `blue` như các component trong `shared/components/ui`.
- Trạng thái tải: dùng `Skeleton`; nút submit phải `disabled={isPending}` và đổi chữ (ví dụ "Đang lưu...").
- Icon: chỉ dùng `lucide-react`.
- Form: `<form noValidate>` (tắt popup của trình duyệt), kiểm tra dữ liệu bằng schema zod, lỗi hiện bằng dòng chữ
  đỏ đậm `#DC2626` ngay dưới ô qua `FormField` (`@/shared/components/ui`). Chi tiết ở skill `build-form`.

## 6. Skill có sẵn

| Skill | Khi nào dùng |
| --- | --- |
| `create-feature` | Tạo màn hình / tính năng mới cho một role (thư mục, route, menu) |
| `connect-api` | Nối API Spring Boot vào frontend (type, service, query hook, phân trang, xử lý lỗi) |
| `build-form` | Làm form tạo/sửa có validate (react-hook-form + zod), lỗi đỏ dưới ô input |
| `verify-changes` | Kiểm tra kiểu, lint, test, build trước khi báo xong |

- **Bản gốc: `.agents/skills/<tên>/SKILL.md`** (Antigravity đọc ở đây). Chỉ sửa skill ở bản gốc.
- **Bản sao: `.claude/skills/`** (Claude Code đọc ở đây) do `npm run sync-skills` sinh ra — **không sửa tay**.
  Sửa bản gốc xong phải chạy `npm run sync-skills`; `npm test` báo lỗi nếu hai bản lệch nhau.
- Code mẫu dài của skill nằm trong `templates/` cạnh `SKILL.md`, chỉ đọc khi cần.

## 7. Vấn đề đã biết trong code hiện tại (đừng sao chép, sửa khi được yêu cầu)

- Menu "Hồ sơ" / "Cài đặt" trong dropdown tài khoản ở 3 header vẫn trỏ tới trang giả (`/<role>` hoặc `/<role>/feature-N`).
- `LecturerDashboardPage` vẫn dùng số liệu tĩnh trong code, chưa nối API.

Nếu một task chạm vào các chỗ trên, báo cho người dùng biết thay vì âm thầm làm theo code cũ.
