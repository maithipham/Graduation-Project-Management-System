# AGENTS.md — Portal Student (Frontend)

> File này được **Claude Code** (qua `CLAUDE.md`) và **Antigravity / Gemini** tự động đọc ở mọi phiên
> (Antigravity phải mở đúng folder `Frontend/Student`, không mở `Frontend`).
> Đây là quy tắc luôn áp dụng. Các quy trình nhiều bước nằm trong skill ở `.agents/skills/` (xem mục 6).
> Ưu tiên khi mâu thuẫn: **file này + skill** > code đang có.

## 1. Dự án

- Hệ thống Quản lý Đồ án Tốt nghiệp — Đại học Thủy Lợi. Thư mục này là portal cho **sinh viên** (role `STUDENT`).
  Portal cán bộ (admin, giảng viên, trưởng bộ môn) nằm ở `Frontend/Lecturer`, là một app riêng.
- Nghiệp vụ của sinh viên (chi tiết ở `REQUIREMENT.md` mục 2 và 6): đăng ký GVHD và tên đề tài, nộp đề cương,
  nộp báo cáo cuối và bản sửa sau bảo vệ, xem GVHD / GV review / GVPB / hội đồng, lịch bảo vệ, kết quả, tài liệu mẫu,
  thông tin cá nhân.
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
├── app/routes/student.routes.tsx      # Đăng ký URL của sinh viên (routes/index.tsx đã bọc RequireAuth + ProtectedRoute 'STUDENT')
├── features/student/<sub_feature>/    # Nghiệp vụ, ví dụ overview, supervisor_registration
│   ├── components/  pages/  hooks/  services/  store/  types/
│   └── index.ts                       # Cổng export duy nhất của feature
├── features/student/layouts/          # StudentLayout, StudentHeader, StudentSidebar
│   └── components/studentNav.config.ts   # Menu sidebar (breadcrumb trên header cũng lấy từ đây)
├── features/auth/                     # Đăng nhập Google, RequireAuth, ProtectedRoute, UserRole
├── features/notification/             # Chuông thông báo + SSE
└── shared/                            # Chỉ chứa "viên gạch" không có nghiệp vụ
    ├── api/      (apiClient, interceptors, session, queryClient, endpoints)
    ├── components/ui/  (Button, Card, Dialog, FormField, Input, Select, Table, Tabs, Skeleton, Badge, Textarea)
    ├── components/feedback/ (toast, LoadingFallback, ErrorFallback, NotFound, FeaturePlaceholder)
    ├── hooks/  types/  utils/
```

Quy tắc:
1. **Không deep import vào feature khác.** Chỉ import qua `index.ts` của feature/role
   (`@/features/student/supervisor_registration`), không import `.../services/xxx.service`. Trong nội bộ một feature thì
   import tương đối (`../services/...`) là bình thường.
   **Ngoại lệ duy nhất:** `app/routes` import thẳng file page bằng `lazy(() => import('@/features/student/<feature>/pages/XxxPage'))`.
   `index.ts` của feature **không export pages** (nếu export, page bị kéo vào bundle chính, mất tác dụng lazy).
2. **`shared/` không chứa nghiệp vụ.** Component có tên nghiệp vụ (`TopicCard`, `OutlineUploadForm`) phải nằm trong `features/`.
3. Luôn dùng alias `@/` cho import ngoài feature, không dùng `../../../shared`.
4. Page component: **`export default`** (để `React.lazy`), đăng ký route bằng `lazy()` + `withSuspense(<XxxPage />)`
   (helper ở `src/app/routes/withSuspense.tsx`, bọc sẵn `<Suspense fallback={<LoadingFallback />}>`).
5. Tên thư mục feature: `snake_case` (`supervisor_registration`), đặt theo nghiệp vụ. Tên file: `PascalCase.tsx` cho component/page,
   `useXxx.ts` cho hook, `xxx.service.ts`, `xxx.store.ts`, `xxx.types.ts` hoặc `types.ts`.
   Chỉ tạo các thư mục con `types/ services/ hooks/ components/ pages/ store/` khi thực sự cần. Không tạo file placeholder rỗng.
6. Menu sidebar dạng `{ title, path, icon, badge? }` trong `studentNav.config.ts`. Thêm mục menu là breadcrumb tự cập nhật,
   không sửa `StudentHeader`.
7. Ưu tiên dùng component sẵn có trong `@/shared/components/ui` trước khi tự viết. Gộp class bằng `cn()` từ `@/shared/utils/cn`.
8. Role chỉ khai báo ở `@/features/auth`: `UserRole` = `'STUDENT'` (đúng chuỗi BE trả về).
   Người đang đăng nhập: `useMyInfo()` (cache TanStack `['auth','me']`, không có store riêng; BE chỉ trả `{ name, roles }`).
   Ẩn/hiện theo role: `CanAccess`. Tài khoản không có role `STUDENT` đăng nhập vào portal này sẽ thấy màn hình "không có quyền".
9. **Feature có nghiệp vụ nhưng không thuộc riêng màn hình sinh viên** nằm thẳng ở `features/<feature>/`, ngoài `features/student/`.
   Hiện chỉ có `auth` và `notification`. Vẫn theo đủ quy tắc trên (cổng `index.ts`, không deep import).
   Muốn thêm feature kiểu này thì hỏi người dùng trước.

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
- **Dữ liệu của chính sinh viên**: backend lấy sinh viên đang đăng nhập từ JWT. FE **không** gửi `studentId`
  của mình lên URL/body (trừ khi Controller yêu cầu rõ).
- Danh sách phân trang: backend trả **Spring Data `Page<T>`** (trang bắt đầu từ **0**). Dùng type `SpringPage<T>`
  và `PageParams` từ `@/shared/types` (file `shared/types/pagination.ts`).
- Xác thực: **JWT trong HttpOnly cookie** + Google OAuth2, có refresh token. Frontend **không đọc/ghi token**;
  request phải gửi kèm cookie (`withCredentials: true`). Không lưu token vào `localStorage`.
- Mock data: chỉ bật khi `VITE_USE_MOCK=true`. **Không** dùng kiểu `try { api } catch { return mock }`
  (nó che mất lỗi thật của backend).
- Dữ liệu từ server để TanStack Query giữ; Zustand (`store/`) chỉ dành cho state giao diện (bộ lọc, tab đang chọn, bản nháp).
- Trong `src/shared/api/endpoints.ts`, nhóm `auth` và `notification` đã khớp BE; các nhóm còn lại là **đoán trước**,
  chưa khớp Controller thật → khi nối API phải sửa theo Controller.

## 5. Giao diện

- Toàn bộ chữ hiển thị cho người dùng bằng **tiếng Việt có dấu**. Tên biến/hàm/file bằng tiếng Anh. Comment tiếng Việt OK.
- Styling bằng Tailwind class, tông `slate` + `blue` như các component trong `shared/components/ui`.
- Page không thêm padding ngoài cùng: `StudentLayout` đã có `<main className="flex-1 p-6">`.
- Trạng thái tải: dùng `Skeleton`; nút submit phải `disabled={isPending}` và đổi chữ (ví dụ "Đang lưu...").
- Nút bị khóa theo trạng thái nghiệp vụ (hết hạn nộp, đã được duyệt...) thì vẫn hiện nhưng `disabled`, kèm dòng giải thích lý do.
  Việc ẩn/khóa nút chỉ là giao diện — backend vẫn phải kiểm tra.
- Icon: chỉ dùng `lucide-react`.
- Form: `<form noValidate>` (tắt popup của trình duyệt), kiểm tra dữ liệu bằng schema zod, lỗi hiện bằng dòng chữ
  đỏ đậm `#DC2626` ngay dưới ô qua `FormField` (`@/shared/components/ui`). Chi tiết ở skill `build-form`.

## 6. Skill có sẵn

| Skill | Khi nào dùng |
| --- | --- |
| `create-feature` | Tạo màn hình / tính năng mới cho sinh viên (thư mục, route, menu) |
| `connect-api` | Nối API Spring Boot vào frontend (type, service, query hook, phân trang, xử lý lỗi) |
| `build-form` | Làm form tạo/sửa có validate (react-hook-form + zod), lỗi đỏ dưới ô input |
| `verify-changes` | Kiểm tra kiểu, lint, test, build trước khi báo xong |

- **Bản gốc: `.agents/skills/<tên>/SKILL.md`** (Antigravity đọc ở đây). Chỉ sửa skill ở bản gốc.
- **Bản sao: `.claude/skills/`** (Claude Code đọc ở đây) do `npm run sync-skills` sinh ra — **không sửa tay**.
  Sửa bản gốc xong phải chạy `npm run sync-skills`; `npm test` báo lỗi nếu hai bản lệch nhau.
- Code mẫu dài của skill nằm trong `templates/` cạnh `SKILL.md`, chỉ đọc khi cần.

## 7. Vấn đề đã biết trong code hiện tại (đừng sao chép, sửa khi được yêu cầu)

- Header chỉ hiện tên + "Sinh viên" vì `GET /my-info` chưa trả MSSV / email.
- `src/shared/api/endpoints.ts` còn nhóm `lecturer` (không dùng ở portal này) và các URL `student` chưa khớp Controller.
- `src/shared/styles/print.css` chỉ ẩn class của giao diện demo cũ → khi in, sidebar/header của `StudentLayout` vẫn bị in ra.
- `VITE_USE_MOCK` chưa được nối vào code.

Nếu một task chạm vào các chỗ trên, báo cho người dùng biết thay vì âm thầm làm theo code cũ.
