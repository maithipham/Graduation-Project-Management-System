---
name: connect-api
description: Nối API backend Spring Boot vào frontend — type từ DTO Java, service axios, query/mutation hook TanStack Query, phân trang Spring Page, xử lý lỗi và toast. Dùng khi người dùng dán Controller/DTO Java hoặc nói "nối API", "gọi endpoint", "lấy dữ liệu từ BE", "connect API", "integrate backend".
---

# Nối API Spring Boot

Backend: Spring Boot tại `http://localhost:8080`, **không có Swagger**. Hợp đồng API chỉ lấy từ Controller/DTO Java.

## Cần có trước (thiếu thì HỎI, không đoán)

- **Controller**: method HTTP, URL, `@PathVariable`, `@RequestParam`, `Pageable`, `@RequestBody`.
- **DTO** request/response và các **enum** liên quan.
- Nếu màn hình cần báo lỗi theo từng ô: **mã lỗi nghiệp vụ** tương ứng (từ `ErrorCode.java`).

Không bịa endpoint, tên trường hay mã lỗi. Thấy endpoint "đoán" sẵn trong `src/shared/api/endpoints.ts` mà không khớp Controller thì báo người dùng.

## Hợp đồng chung (đã có sẵn, không viết lại)

| Thứ | Ở đâu | Ghi chú |
| --- | --- | --- |
| `apiClient` | `@/shared/api` | axios, `withCredentials: true` (JWT nằm trong cookie HttpOnly) |
| `API_ENDPOINTS` | `@/shared/api` (`endpoints.ts`) | thêm đường dẫn mới vào đây |
| `ApiResponse<T>` | `@/shared/types` | `{ code, message, data }`, `code === 1000` là thành công |
| `ApiError`, `isApiError` | `@/shared/types` | mọi lỗi từ `apiClient` đều là `ApiError` (`code` = mã BE, `status` = HTTP) |
| `SpringPage<T>`, `PageParams` | `@/shared/types` | trang **bắt đầu từ 0** |
| `toast` | `@/shared/components/feedback/toast.store` | chỉ dùng `toast.success` |

Interceptor đã tự lo: toast lỗi, lỗi nghiệp vụ (HTTP 200 nhưng `code ≠ 1000`), 401 → refresh token 1 lần → hết hạn thì về `/login`.

## Ánh xạ Java → TypeScript

| Java | TypeScript |
| --- | --- |
| `Long`, `Integer`, `Double`, `BigDecimal` | `number` |
| `String`, `UUID` | `string` |
| `Boolean` | `boolean` |
| `LocalDate` | `string` (`"2026-09-01"`) |
| `LocalDateTime`, `Instant` | `string` (ISO) — đổi sang hiển thị bằng `formatDate` trong `@/shared/utils` |
| `enum Status { A, B }` | `type Status = 'A' \| 'B'` |
| `List<T>`, `Set<T>` | `T[]` |
| `Page<T>` | `SpringPage<T>` |
| DTO lồng nhau | `interface` riêng (ví dụ `LecturerSummary`) |
| trường có thể `null` | `field: string \| null` (không dùng `?` nếu BE luôn trả key) |

API có thể trả `data = null` (ví dụ chưa có cấu hình, chưa có hội đồng) → khai báo `T | null` và hiện trạng thái trống.

## Các bước

Mẫu đầy đủ (đã chạy thử tsc/lint/test) nằm trong `templates/` — đọc đúng file cần dùng:

| Bước | File trong feature | Mẫu |
| --- | --- | --- |
| 1. Type từ DTO | `types/xxx.types.ts` | `templates/types.md` |
| 2. Endpoint | `src/shared/api/endpoints.ts` | thêm key theo role: `admin: { semesters: '/admin/semesters' }` |
| 3. Service | `services/xxx.service.ts` | `templates/service.md` |
| 4. Hook | `hooks/useXxx.ts` | `templates/hooks.md` |
| 5. Trang danh sách (nếu cần) | `pages/XxxListPage.tsx` | `templates/list-page.md` |
| 6. Export | `index.ts` của feature | export type + hook (không export page) |

### Service (giống `@Service` bên Spring)

- Chỉ gọi API và **trả `res.data.data`** (bóc wrapper `ApiResponse`), không trả `res.data`.
- Khai báo kiểu: `apiClient.get<ApiResponse<SpringPage<Semester>>>(...)`.
- Phân trang: truyền `params` + `paramsSerializer: { indexes: null }` để `sort` dạng mảng thành `?sort=a,asc&sort=b,desc` như Spring cần.
- Request gọi từ **form** (tạo/sửa): thêm `{ skipErrorToast: true }` — form tự hiện lỗi (xem skill `build-form`).
- Không `try/catch` trong service. Không xử lý giao diện.

### Hook (giống gọi repository có cache)

- Mỗi feature một bộ **query key** (`semesterKeys`): `all → lists → list(params)`, `detail(id)`.
- Đọc: `useQuery`. Danh sách phân trang thêm `placeholderData: keepPreviousData` (đổi trang không nháy trắng).
- Chờ có tham số mới gọi: `queryFn: id === undefined ? skipToken : () => service.getById(id)`.
- Ghi: `useMutation` → `onSuccess`: `toast.success('Đã …')` + `invalidateQueries` key liên quan (danh sách tự tải lại).
- Dữ liệu ít đổi (danh mục, khoa, ngành): trải `...referenceDataQueryOptions` từ `@/shared/api` vào `useQuery`.

### Trong component

- Lấy dữ liệu qua hook: `const { data, isPending, isError } = useSemesters(params)`.
- `isPending` → `Skeleton`; `isError` → dòng trạng thái "Không tải được …" (toast lỗi interceptor đã hiện);
  `data.empty` → "Chưa có … nào.".
- Hiển thị số trang cho người dùng = `data.number + 1`.
- Nút gọi mutation: `disabled={mutation.isPending}` + đổi chữ ("Đang lưu...", "Đang xóa...").

## Mock dữ liệu

Repo **chưa có** cơ chế mock khi chạy app (`VITE_USE_MOCK` chưa được nối). Chỉ làm mock khi người dùng yêu cầu,
và chỉ bật theo `VITE_USE_MOCK=true`. Dữ liệu mẫu cho test đặt ở `tests/mocks/`.

## KHÔNG được làm

- `try { await api() } catch { return mockData }` — che mất lỗi thật của backend.
- `toast.error(...)` trong component/hook — interceptor đã hiện rồi (trừ khi request có `skipErrorToast` thì tự hiển thị lỗi trên giao diện, vẫn không dùng toast).
- `useEffect + useState` để fetch; gọi `apiClient` thẳng trong component.
- Đọc/ghi token, lưu token vào `localStorage`, tự gắn header `Authorization`.
- Tự xử lý lỗi 401 trong component.
- Copy dữ liệu server vào Zustand — TanStack Query giữ dữ liệu server; Zustand chỉ giữ state giao diện (bộ lọc, tab).
- Đổi `page` sang bắt đầu từ 1 khi gửi lên BE.

## Kiểm tra

Làm theo skill `verify-changes`. Nếu backend đang chạy ở `localhost:8080`, mở trang xem dữ liệu thật và tab Network.
