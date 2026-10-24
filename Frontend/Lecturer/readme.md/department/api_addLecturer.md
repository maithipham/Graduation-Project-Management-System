# Quản lý giảng viên (Trưởng bộ môn) – Đặc tả giao diện & API

> Mô tả màn hình **Giảng viên** (menu "Quản lý giáo viên → Giảng viên") của Trưởng bộ môn theo code thực tế
> (`src/features/department/lecturer_management/`). Đọc kèm `AGENTS.md` và các skill
> `create-feature`, `connect-api`, `verify-changes`.
> Hợp đồng API lấy từ backend Spring Boot (`tlu_gpms_system`); tài liệu nghiệp vụ gốc ở
> `Do_An_Fall26/readme.md/case_execution/addLecturer_TBM.md`.
> Màn hình làm theo cùng khuôn với Quản lý sinh viên (`api_addStudent.md`). Chỗ nào file này không nói khác thì làm theo file đó.

---

## 1. Trạng thái hiện tại

| # | Việc | Trạng thái |
| :--- | :--- | :--- |
| 1 | Trang danh sách giáo viên hướng dẫn: bảng + phân trang | ✅ API thật – `GET /teacher` |
| 2 | Bấm 1 dòng → popup "Thông tin giáo viên" | ✅ API thật – `GET /teacher/{publicId}` |
| 3 | Ô nhập số **Hạn mức** trên từng dòng (+ nút bút chì ở cột Thao tác) | ✅ API thật – `PATCH /teacher/{publicId}/amount`, hỏi xác nhận trước khi lưu (Mục 6.1) |
| 4 | Nút **Import Excel** | ✅ API thật – popup "Import danh sách giáo viên", `POST /teacher/import`; sửa dòng lỗi gửi lại qua `POST /teacher` (Mục 5.4, 6.2) |
| 5 | Nút **Export Excel** | ⏳ Chỉ hiển thị – BE **chưa có** API export |
| 6 | Nút **Thêm thủ công** | ✅ API thật – popup "Thêm giáo viên", `POST /teacher` (Mục 5.3, 6.3) |
| 7 | Tìm kiếm / bộ lọc / sắp xếp | ✅ Ô tìm theo họ tên (`name`), lọc `organizationType`, `majorName`; bấm tiêu đề cột để sắp xếp (Mục 4.1, 5.1) |
| 8 | Kích hoạt lại giáo viên đã tắt | ⏳ Chưa làm – `PATCH /teacher/{publicId}/activate` (Mục 6.4) |

---

## 2. Vị trí code & route

- URL: **`/department/lecturer-management`** (menu "Quản lý giáo viên → Giảng viên" trong `departmentNav.config.ts`,
  route `path: 'lecturer-management'` trong `src/app/routes/department.routes.tsx`, nạp page bằng `lazy()` + `withSuspense(...)`).
- Mục menu "Hướng dẫn" (`/department/supervisors`) hiện **chưa có trang** (chưa đăng ký route).

```
lecturer_management/
├── types.ts                            # TeacherListItem, TeacherDetail, TeacherListParams, TeacherSort, TeacherCreationRequest, TeacherWriteResult, TeacherImportRowResult, TeacherImportResponse
├── services/teacher.service.ts         # getTeachers, getTeacherDetail, createTeacher, importTeachers (multipart, timeout 5 phút)
├── hooks/useTeachers.ts                # departmentTeacherKeys, useTeachers, useTeacherDetail, useCreateTeacher, useImportTeachers
├── hooks/useTeacherEmailAutoFill.ts    # đổi đuôi email → tự điền đơn vị công tác, hạn mức, bỏ ngành (popup thêm + form sửa dòng import)
├── utils/teacherDisplay.ts             # formatAmount (null → "—", 0 vẫn hiện "0")
├── utils/teacherFilters.ts             # TeacherFilters, DEFAULT_TEACHER_FILTERS, ORGANIZATION_OPTIONS, hasActiveTeacherFilters
├── utils/createTeacherSchema.ts        # schema zod form thêm giáo viên (Mục 6.5), getTeacherEmailRule (đuôi email → đơn vị + hạn mức)
├── utils/teacherImportResult.ts       # importRowToFormValues, applyRetrySuccess, applyRetryError (sửa dòng import lỗi)
├── components/
│   ├── TeacherToolbar.tsx              # ô tìm họ tên + lọc đơn vị + lọc khoa + "Xóa lọc"
│   ├── TeacherTable.tsx                # bảng + tiêu đề cột sắp xếp + nút "Thiết lập hạn mức" + phân trang
│   ├── TeacherStatusBadge.tsx          # badge Đang hoạt động / Đã tắt (popup chi tiết)
│   ├── TeacherDetailDialog.tsx         # popup "Thông tin giáo viên"
│   ├── TeacherFormFields.tsx           # 7 ô thông tin giáo viên, dùng chung cho popup thêm và form sửa dòng import
│   ├── CreateTeacherDialog.tsx         # popup "Thêm giáo viên" (Thêm thủ công)
│   ├── ImportTeacherDialog.tsx         # popup "Import danh sách giáo viên": chọn file → kết quả
│   ├── TeacherImportResult.tsx         # kết quả import: tab Lỗi / Cảnh báo / Thành công
│   └── RetryTeacherImportRowForm.tsx   # sửa 1 dòng lỗi rồi gửi lại qua POST /teacher
├── pages/LecturerManagementPage.tsx  # export default
└── index.ts                            # export types + hooks (không export page)
```

Phân trang và sắp xếp dùng chung với bảng sinh viên (đã tách khỏi `student_management`):

| File | Nội dung |
| :--- | :--- |
| `src/shared/utils/pagination.ts` | `getPageItems(current, totalPages)`, type `PageItem` |
| `src/shared/components/ui/pagination.tsx` | `<TablePagination data disabled onPageChange itemLabel />` – dòng "Hiển thị X–Y / N {itemLabel}" + nút trang |
| `src/shared/types/pagination.ts` | `SortDirection`, `SortValue<F>` (ví dụ `name,asc`) |
| `src/shared/utils/sort.ts` | `getNextSort(current, field)`: tăng dần → giảm dần → bỏ sắp xếp |
| `src/shared/utils/params.ts` | `compactParams(params)`: bỏ tham số `undefined` / chuỗi rỗng trước khi gửi |
| `src/shared/components/ui/sortable-table-head.tsx` | `<SortableTableHead label field sort onSortChange />` – tiêu đề cột bấm được, có `aria-sort` |
| `src/shared/components/ui/file-drop-zone.tsx` | `<FileDropZone file accept hint onSelect onClear />` – ô kéo thả / chọn file, dùng chung cho import sinh viên và giáo viên (chuyển từ `student_management/components`) |

`student_management/utils/studentTable.ts` vẫn re-export `getNextSort`, `getPageItems` để code / test cũ không phải đổi import.
Feature giáo viên lấy danh sách khoa qua `useMajors`, và `countRowsByStatus`, `IMPORT_TAB_ORDER`, `pickDefaultTab`, `RowImportStatus` (tab kết quả import) từ `@/features/department/student_management` (cổng `index.ts`).

Endpoint trong `src/shared/api/endpoints.ts`:

```ts
departmentTeacher: {
  base: '/teacher',                                    // GET danh sách · POST thêm thủ công
  detail: (publicId: string) => `/teacher/${publicId}`,
  import: '/teacher/import',
  activate: (publicId: string) => `/teacher/${publicId}/activate`,
  amount: (publicId: string) => `/teacher/${publicId}/amount`, // PATCH thiết lập hạn mức
},
```

---

## 3. Quy ước chung của backend

Giống hệt Mục 3 của `api_addStudent.md`:
- Response `{ code, message?, data? }`, `code = 1000` là thành công; dải `11xx` (HTTP 200) là thành công kèm cảnh báo, interceptor tự hiện toast vàng.
- Lỗi HTTP 4xx/5xx → interceptor đã tự toast đỏ, component **không** `toast.error` lại.
  Form muốn tự hiện lỗi ngay trên form thì gửi `{ skipErrorToast: true }`; muốn tự hiện kết quả `11xx` thì gửi `{ skipWarningToast: true }`.
- Quyền: mọi API ở đây yêu cầu role `ADMIN` hoặc `HEAD_OF_MAJOR` (`@PreAuthorize` ở `UserServiceImpl`).
- Chỉ dùng `publicId` (UUID string), không có `id` số. `publicId` sai định dạng UUID được coi như không tìm thấy (`404 3009`), không ra `500`.
- Mọi lỗi đều trả body `{ code, message }`, không có `data`. Code `4000` dùng chung cho mọi lỗi dữ liệu nhập, nên FE phân biệt
  từng lỗi bằng `message`, không bằng `code`.

**Lỗi chung cho cả 6 API** (bảng lỗi riêng của từng API ở Mục 4 và Mục 6 không nhắc lại các lỗi này):

| Trường hợp | HTTP | `code` | Message | FE xử lý |
| :--- | :--- | :--- | :--- | :--- |
| Chưa đăng nhập, access token hết hạn hoặc sai | 401 | 2000 | Phiên đăng nhập của bạn đã hết hạn | Interceptor tự gọi `/refresh-token` 1 lần rồi gửi lại request; refresh thất bại → về `/login`, **không** toast |
| Không phải `ADMIN` / `HEAD_OF_MAJOR` | 403 | 2001 | Bạn không có quyền truy cập (access denied) | Toast đỏ |
| Request sai ở tầng Spring (xem danh sách bên dưới) | 400 | 1006 | Yêu cầu không hợp lệ | Toast đỏ |
| Sai HTTP method, ví dụ `PUT` thay cho `PATCH` | 405 | 1007 | Hệ thống không cấp phép | Toast đỏ |
| URL không khớp API nào, ví dụ `/teacher/` (thừa dấu `/` ở cuối) | 404 | 1005 | Thông tin không có sẵn | Toast đỏ |
| Lỗi không lường trước ở BE | 500 | 1001 | Hệ thống không phản hồi | Toast đỏ; query (GET) tự thử lại 1 lần, mutation không thử lại |

`400 1006` gồm: thiếu body hoặc body không phải JSON hợp lệ; field sai kiểu JSON (object / mảng, ví dụ `"amount": {}`;
số có 0 đứng đầu như `0987654321`); gửi sai `Content-Type` (ví dụ gửi JSON vào `POST /teacher/import`);
tự đặt header `Content-Type: multipart/form-data` làm mất `boundary`. Đây là **một message chung**, không kèm tên field
và không gom với lỗi kiểm tra dữ liệu `4000` ở Mục 6.5. FE gọi đúng như tài liệu thì không gặp 3 lỗi `1006` / `1007` / `1005`.

401 của các API này luôn là `2000` (do `CustomAuthenticationEntryPoint` trả); các code `2002`, `2003` có trong `ErrorCode` nhưng không dùng ở đây.

**Lỗi nào trả trước:** 401 trả trước mọi lỗi khác (trừ URL có `//`, xem bảng dưới). 403 chỉ được kiểm tra khi request đã vào tới Service,
nên các lỗi phát sinh ở tầng Controller sẽ trả về **trước** 403: `1005` / `1007` / `1006` ở bảng trên, thiếu part `file`
(400 "File import không được để trống"), file > 50MB (400 "File import vượt quá dung lượng...").

**Lỗi đã biết (BE chưa xử lý riêng).** FE gọi đúng như tài liệu thì không gặp, nhưng nên biết khi test bằng Postman:

| Trường hợp | API | Kết quả hiện tại |
| :--- | :--- | :--- |
| URL thiếu `publicId` ở giữa (`/teacher//amount`, `/teacher//activate`) | `PATCH .../amount`, `PATCH .../activate` | Spring Security chặn URL có `//` trước cả bước kiểm tra đăng nhập, trả `400` **không có** `code` / `message` (interceptor báo "Có lỗi xảy ra từ máy chủ (HTTP 400)"). Không ra `3009`. Còn `/teacher/` (thiếu ở cuối) ra `404 1005` như bảng trên. FE không gọi khi chưa có `publicId` |
| Hai request ghi cùng lúc tạo tài khoản cho cùng một email (2 lần import, hoặc import và `POST /teacher`) | `POST /teacher/import`, `POST /teacher` | Vi phạm unique, rollback **cả request**, trả `500 1001` |
| File lớn hơn 50MB nhiều: `server.tomcat.max-swallow-size` chưa cấu hình (mặc định 2MB), Tomcat có thể ngắt kết nối trước khi trình duyệt đọc được `400` (chưa kiểm chứng thực tế) | `POST /teacher/import` | Axios không có `response`, interceptor báo "Không thể kết nối đến máy chủ...". FE **bắt buộc** chặn file > 50MB trước khi gửi |

---

## 4. API đọc dữ liệu

### 4.1. `GET /teacher` – Danh sách giáo viên

**Query params** (đều không bắt buộc):

| Param | Kiểu | Ý nghĩa | FE đang gửi? |
| :--- | :--- | :--- | :--- |
| `page` | number | Trang, **bắt đầu từ 0** | ✅ |
| `size` | number | Mặc định **10** (`@PageableDefault(size = 10)`) | ✅ `10` |
| `name` | string | Tìm gần đúng theo **họ tên đầy đủ** (Họ + Tên): gõ `An`, `Nguyễn` hay `Nguyễn Văn An` đều ra | ✅ ô tìm kiếm, chờ ngừng gõ 400ms |
| `organization` | string | **BE đã bỏ tham số này** (gửi lên sẽ bị bỏ qua) | ❌ Đã thay bằng `organizationType` |
| `organizationType` | string | **BE tự đổi sang điều kiện trên tên trường.** `internal` = `organization = 'Trường Đại học Thủy lợi'`; `external` = mọi trường khác. Không gửi / chuỗi rỗng → không lọc. BE không phân biệt hoa/thường nhưng FE gửi **chữ thường**. Giá trị khác → `400`, `1006` `INVALID_REQUEST` | ✅ "Trong trường" → `internal`; "Ngoài trường" → `external`; "Tất cả đơn vị" → không gửi |
| `majorName` | string | Tìm gần đúng theo tên khoa / ngành | ✅ **tên** khoa lấy từ `GET /major` (không gửi `publicId`) |
| `sort` | string | `<key>,asc` hoặc `<key>,desc`, gửi được nhiều lần; chỉ nhận key trong whitelist bên dưới | ✅ 1 cột mỗi lần |

- Bộ lọc không phân biệt hoa/thường; BE tự trim và gộp khoảng trắng, chuỗi rỗng coi như không lọc.
  Tham số cũ `lastName` (chỉ tìm theo Tên) **đã bỏ**, dùng `name`.
- Whitelist sort (key ứng với cột trên bảng):

  | Key | Cột | Sắp theo |
  | :--- | :--- | :--- |
  | `name` | Họ và tên | Tên rồi đến Họ (thói quen tra danh sách tiếng Việt) |
  | `organization` | Đơn vị công tác | |
  | `majorName` | Khoa phụ trách | |
  | `amount` | Hạn mức | |

  Key phân biệt hoa/thường (`Name` là sai). Hướng `asc` / `desc` thì không phân biệt.
- Không gửi `sort`: BE tự sắp **đang hoạt động trước, mới thêm trước** (`a.status DESC, t.id DESC`).
  Có gửi `sort`: BE luôn chốt thêm `t.id DESC` để phân trang không bị nhảy dòng khi trùng giá trị.
- BE trả **cả giáo viên đang hoạt động và đã tắt** (không có tham số `status` như `GET /student`).
- `page` / `size` sai không báo lỗi: số âm, chữ, `size=0` được Spring đưa về mặc định (`page = 0`, `size = 10`);
  `size` tối đa 2000. `page` vượt quá số trang → `content` rỗng, vẫn `200`.
- Ký tự `%` và `_` trong `name` / `majorName` đang được hiểu là ký tự đại diện của `LIKE` (BE chưa escape).
  Không gây lỗi, chỉ ra kết quả rộng hơn.

| Lỗi | HTTP | `code` | Message |
| :--- | :--- | :--- | :--- |
| `sort` có key ngoài whitelist (`id`, `status`, `email`, `phone`, sai hoa/thường...) | 400 | 1008 | Trường sắp xếp không hợp lệ |

- `data` là `Page` phẳng hoặc `PagedModel` → service trả `toSpringPage(res.data.data, params)` (giống `GET /student`).
- Service gửi `params: compactParams(params)` + `paramsSerializer: { indexes: null }` (giống `GET /student`):
  bộ lọc rỗng không gửi lên, `sort` dạng mảng thành `sort=a,asc&sort=b,desc` đúng kiểu Spring.

Một phần tử trong `content` (`TeacherResponse`):

```json
{
  "publicId": "0192f3a1-7c2e-7b4d-9a10-3f5e2d1c0b9a",
  "name": "Nguyễn Văn An",
  "majorName": "Công nghệ thông tin",
  "organization": "Trường Đại học Thủy lợi",
  "phone": "0912345678",
  "amount": 20,
  "status": true
}
```

```ts
export interface TeacherListItem {
  publicId: string
  name: string               // Họ + Tên, BE đã ghép sẵn
  majorName: string | null   // Khoa phụ trách
  organization: string       // Đơn vị công tác: tên trường (trong trường luôn là "Trường Đại học Thủy lợi")
  phone: string | null
  amount: number | null      // Hạn mức sinh viên được nhận
  status: boolean            // true = tài khoản đang hoạt động
}

export type TeacherSortField = 'name' | 'organization' | 'majorName' | 'amount'
export type TeacherSort = SortValue<TeacherSortField> // name,asc | amount,desc | ...

export interface TeacherListParams {
  name?: string
  organization?: string       // tên trường, tìm gần đúng (bộ lọc không dùng)
  organizationType?: 'internal' | 'external' // Trong / Ngoài trường, BE tự đổi sang điều kiện trên tên trường
  majorName?: string
  page: number // 0-based
  size: number
  sort?: TeacherSort
}
```

### 4.2. `GET /teacher/{publicId}` – Chi tiết (popup)

Gọi khi bấm 1 dòng, dùng `publicId` của dòng đó. Trả cả giáo viên đã tắt (`status = false`), không chỉ giáo viên đang hoạt động.

```json
{
  "code": 1000,
  "data": {
    "publicId": "0192f3a1-7c2e-7b4d-9a10-3f5e2d1c0b9a",
    "name": "Nguyễn Văn An",
    "email": "annv@tlu.edu.vn",
    "phone": "0912345678",
    "organization": "Trường Đại học Thủy lợi",
    "majorName": "Công nghệ thông tin",
    "amount": 20,
    "status": true
  }
}
```

```ts
export interface TeacherDetail extends TeacherListItem {
  email: string
}
```

| Lỗi | HTTP | `code` | Message |
| :--- | :--- | :--- | :--- |
| `publicId` sai định dạng hoặc không có trong DB | 404 | 3009 | Giáo viên không tồn tại |

---

## 5. Giao diện

Dùng component sẵn có ở `@/shared/components/ui` (`Button`, `Table*`, `TablePagination`, `Dialog*`, `Badge`, `Skeleton`),
icon `lucide-react`, tông `slate` + `blue`. Toàn bộ chữ tiếng Việt có dấu.

### 5.1. Bố cục trang `/department/lecturer-management`

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ Giảng viên                                  [⬆ Import Excel] [⬇ Export Excel] [+ Thêm thủ công] │
│ Danh sách giảng viên và hạn mức sinh viên được nhận.                                      │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ [🔍 Tìm theo họ tên giáo viên...        ] [Tất cả đơn vị ▾] [Tất cả khoa ▾] [✕ Xóa lọc]  │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ STT │ Họ và tên ⇅            │ Đơn vị công tác ⇅│ Ngành ⇅             │ Hạn mức ⇅│ Thao tác             │
│  1  │ Nguyễn Văn An          │ ĐH Thủy lợi     │ Công nghệ thông tin │ 20      │ [⚙ Thiết lập hạn mức] │
│  2  │ Trần Thị Bình [Đã tắt] │ ĐH Bách khoa    │ —                   │ 10      │ [⚙ Thiết lập hạn mức] (khóa) │
│  …                                                                                        │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ Hiển thị 1–10 / 34 giáo viên                                        [‹] 1 2 3 4 [›]        │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

**Nút đầu trang:** "Thêm thủ công" mở popup "Thêm giáo viên" (Mục 5.3). "Import Excel" mở popup import (Mục 5.4). Export Excel hiện chỉ gọi
`toast.info('Chức năng này sẽ được hỗ trợ sau')`.

**Thanh tìm kiếm / bộ lọc** (`TeacherToolbar`, giống `StudentToolbar`):
- Ô tìm `type="search"` có icon `Search`, placeholder "Tìm theo họ tên giáo viên...". Trang chờ ngừng gõ **400ms**
  (`useDebounce`) rồi mới gửi `name` (đã trim, rỗng thì không gửi).
- Select đơn vị: "Tất cả đơn vị" / "Trong trường" / "Ngoài trường". FE gửi thẳng giá trị option
  (`toOrganizationParams`): Trong trường → `organizationType=internal`; Ngoài trường → `organizationType=external`;
  Tất cả đơn vị → không gửi. Việc đổi sang điều kiện trên tên trường do **BE** làm (Mục 4.1).
- Select khoa: "Tất cả khoa" + danh sách từ `useMajors()` (Kỹ thuật phần mềm, Hệ thống thông tin, Công nghệ thông tin,
  An ninh mạng, Trí tuệ nhân tạo và Khoa học dữ liệu); giá trị là **`major.name`** vì BE lọc theo `majorName`.
  Đang tải danh sách: khóa select, dòng đầu "Đang tải khoa...".
- Nút ghost **"Xóa lọc"** (icon `X`) chỉ hiện khi có bộ lọc; bấm xóa cả bộ lọc **và** sắp xếp.
- Đổi bất kỳ bộ lọc / sắp xếp nào → quay về trang đầu (`page = 0`).

**Sắp xếp:** bấm tiêu đề cột Họ và tên (`name`), Đơn vị công tác (`organization`), Ngành (`majorName`),
Hạn mức (`amount`). Mỗi lần bấm: tăng dần → giảm dần → bỏ sắp xếp (BE quay về thứ tự mặc định). Cột đang sắp xếp
có chữ + mũi tên màu xanh. STT và Thao tác **không** sắp xếp được (không có trong whitelist).

**Bảng:**
- STT = `number * size + index + 1`, ví dụ trang 2 bắt đầu từ 11.
- Họ và tên: `name`; giáo viên đã tắt (`status = false`) có thêm `Badge` xám nhỏ **"Đã tắt"** cạnh tên.
- Đơn vị công tác: `organization`. Ngành: `majorName` (null → "—", ví dụ giáo viên ngoài trường). Hạn mức: `amount` (null → "—", `0` vẫn hiện "0").
- Hạn mức (`TeacherAmountInput`): giáo viên đang hoạt động có ô `<input type="number" min=0 step=1>`; đã tắt chỉ hiện chữ
  (BE trả `3012 TEACHER_INACTIVE`).
  - Bấm mũi tên tăng / giảm (hoặc phím ↑ ↓, lăn chuột) bao nhiêu lần cũng được; **ngừng bấm 1 giây** mới hỏi xác nhận
    một lần với số cuối cùng. Gõ số → hỏi khi Enter hoặc rời ô (Enter / rời ô cũng hỏi ngay, không cần đợi 1 giây).
  - Số đang sửa mà chưa lưu → ô có viền vàng nhạt.
  - Chặn gõ `- + . , e`; xóa trống hoặc không đổi → giữ số cũ, không hỏi; quá 18 chữ số → toast vàng, giữ số cũ.
  - Popup xác nhận (`ConfirmAmountSheet`) trượt từ dưới lên: "Bạn có muốn cập nhật số lượng giảng viên không?" kèm `cũ → mới`.
    **Bắt buộc trả lời**: không có nút X, Escape / bấm nền không đóng, Tab chỉ chạy giữa 2 nút.
  - "Cập nhật" → `useUpdateTeacherAmount` → `PATCH`, thành công toast xanh + tải lại danh sách; lỗi (toast do interceptor) hoặc "Không" → trả về số cũ.
  - Click / phím trong ô và popup không lan lên dòng → **không** mở popup chi tiết.
- Thao tác: nút bút chì (icon, `aria-label` "Thiết lập hạn mức") đưa con trỏ vào ô hạn mức của dòng; **khóa** khi `status = false`.
- Cả dòng có `cursor-pointer` + hover nền `slate-50`; bấm dòng mở popup chi tiết. Bàn phím: `tabIndex={0}`, Enter trên dòng mở popup
  (Enter trên nút trong dòng chỉ chạy nút, nhờ kiểm tra `e.target === e.currentTarget`).
- Đang tải lần đầu: 10 dòng `Skeleton`. Đổi trang: giữ dữ liệu cũ (`keepPreviousData`), làm mờ bảng và khóa nút phân trang.
- Lỗi: "Không tải được danh sách giáo viên." (toast lỗi do interceptor hiện).
- Rỗng khi **không lọc**: icon `UserPlus` + "Chưa có giáo viên nào" + nút "Thêm thủ công" (mở popup Mục 5.3).
- Rỗng khi **đang lọc**: icon `SearchX` + "Không tìm thấy giáo viên phù hợp" (không có nút).
- Phân trang: `<TablePagination itemLabel="giáo viên" />`, chỉ hiện nút số trang khi `totalPages > 1`.

### 5.2. Popup "Thông tin giáo viên"

- Mở với `publicId` của dòng; `useTeacherDetail(publicId)` (chưa có `publicId` → chưa gọi API, dùng `skipToken`).
- Tiêu đề **"Thông tin giáo viên"** kèm badge trạng thái (Đang hoạt động / Đã tắt) khi đã có dữ liệu.
- Nội dung lưới 2 cột (label xám nhỏ, giá trị đậm), đúng 6 trường:

  | Label | Field |
  | :--- | :--- |
  | Họ và tên | `name` |
  | Đơn vị công tác | `organization` |
  | Ngành | `majorName` (null → "—") |
  | Hạn mức | `amount` (null → "—") |
  | Số điện thoại | `phone` (null → "—") |
  | Email | `email` (link `mailto:`) |

- Đang tải: 6 ô `Skeleton`. Lỗi (ví dụ 3009): "Không tải được thông tin giáo viên." (toast do interceptor).
- Footer: nút "Đóng".

### 5.3. Popup "Thêm giáo viên" (Thêm thủ công)

`CreateTeacherDialog` (làm theo skill `build-form`, cùng khuôn với popup "Thêm sinh viên"). Mỗi lần mở popup, form được làm trống.

| Ô (thứ tự lưới 2 cột) | Field | Bắt buộc | Ghi chú |
| :--- | :--- | :--- | :--- |
| Họ và tên đệm | `firstName` | ✔ | VD: Nguyễn Văn |
| Tên | `lastName` | ✔ | Một từ, VD: An |
| Email | `email` | ✔ | Gợi ý dưới ô: @tlu.edu.vn (trong trường) hoặc @gmail.com (ngoài trường) |
| Số điện thoại | `phone` | ✔ | Gửi dạng chuỗi |
| Đơn vị công tác | `organization` | ✔ | Ô chữ: tên trường. Email `@tlu.edu.vn` → tự điền `Trường Đại học Thủy lợi`; `@gmail.com` → TBM tự gõ tên trường khác |
| Ngành | `major` | ✔ trong trường | `Select` từ `useMajors()`, giá trị là **tên ngành**; đang tải thì khóa + "Đang tải ngành...". Email `@gmail.com` → xóa và khóa ô, gửi `""` |
| Hạn mức sinh viên | `amount` | | Ô chữ `inputMode="numeric"`; để trống → gửi `null` (BE tự gán) |

- **Tự điền theo email:** gõ email đúng định dạng và đúng đuôi thì tự điền Đơn vị công tác và Hạn mức
  (`@tlu.edu.vn` → `Trường Đại học Thủy lợi` / 20; `@gmail.com` → xóa tên Thủy lợi đã tự điền để TBM gõ tên trường khác, hạn mức 10, xóa và khóa ô Ngành). Chỉ ghi đè ô còn trống hoặc vẫn đang là giá trị
  tự điền lần trước; ô người dùng đã tự sửa thì giữ nguyên.
- **Kiểm tra trên FE** bằng `createTeacherSchema` (zod) với đúng quy tắc + message Mục 6.5: chuẩn hóa (NFC, gộp khoảng trắng,
  xóa ký tự ẩn, email chữ thường, tên `Trường Đại học Thủy lợi` không phân biệt hoa/thường), quá 255 ký tự là sai định dạng, mỗi ô 1 lỗi.
  Lỗi "Đơn vị công tác không khớp với email" vẫn hiện cùng lúc với lỗi các ô khác (chỉ xét khi email và đơn vị đã hợp lệ).
  Lỗi hiện bằng dòng đỏ `#DC2626` dưới ô qua `FormField`. Riêng "Ngành học không tồn tại" FE không tự biết (chọn từ danh sách).
- **Gửi:** `useCreateTeacher` → `teacherService.createTeacher` (`skipErrorToast: true`), body toàn chuỗi, `amount` trống → `null`.
  - `1000`: `toast.success` đúng message BE (thêm mới / kích hoạt lại / kích hoạt lại và cập nhật), đóng popup.
  - `1100`: interceptor hiện toast vàng "Thông tin giáo viên đã có trong hệ thống", đóng popup.
  - Cả hai: `invalidateQueries(departmentTeacherKeys.all)`.
  - Lỗi (`3006`, `3007`, `4000`, `2007`, mất mạng...): dòng đỏ chung phía trên nút Lưu (`role="alert"`), giữ popup và dữ liệu đã nhập.
- Dòng ghi chú (icon `Info`): giáo viên đã tắt sẽ được kích hoạt lại và cập nhật SĐT / đơn vị / ngành / hạn mức; đang hoạt động thì không đổi gì.
- Footer: "Hủy" (outline) + "Lưu". Đang lưu: cả 2 nút khóa, nút Lưu đổi chữ "Đang lưu...", không đóng được popup.

### 5.4. Popup "Import danh sách giáo viên" (Import Excel)

`ImportTeacherDialog`, cùng các bước và giao diện với popup import sinh viên:

1. **Chọn file** (`FileDropZone` dùng chung ở `@/shared/components/ui`): kéo thả hoặc bấm chọn, nút "x" bỏ chọn file và xóa lỗi.
   - Kiểm tra trên FE (zod, đúng message Mục 6.2): trống, không có đuôi `.xlsx`, lớn hơn 50MB. Lỗi hiện đỏ dưới ô.
   - Khung ghi chú: 6 cột A–F theo thứ tự (Họ và tên đệm, Tên, Email, Số điện thoại, Đơn vị công tác, Ngành).
     Không có cột hạn mức (BE tự gán 20 / 10 theo email). Giáo viên ngoài trường để trống cột Ngành.
   - "Tải file mẫu" hiện vẫn là `toast.info('Sẽ hỗ trợ sau')` (BE chưa có file mẫu).
2. **Gửi:** `useImportTeachers` → `teacherService.importTeachers`.
   - Body là `multipart/form-data`, part `file`; timeout 5 phút; `skipErrorToast: true`.
   - Lỗi cả file (sai tiêu đề, ô gộp, không có dữ liệu, `2007`, mất mạng...) hiện dưới ô chọn file, không toast.
   - Đang gửi: khóa ô chọn file và 2 nút, nút đổi chữ "Đang import...", không đóng được popup.
   - Thành công: `invalidateQueries(departmentTeacherKeys.all)`. Không có dòng lỗi / cảnh báo → `toast.success('Đã import thành công N giáo viên')`.
3. **Kết quả** (`TeacherImportResult`, popup rộng hơn):
   - Có 3 tab Lỗi / Cảnh báo / Thành công kèm số đếm; tab mở sẵn là tab đầu tiên còn dòng.
   - Cột: Dòng / Họ tên / Email / Đơn vị công tác / Ngành / Hạn mức / Lý do lỗi (tab Lỗi) hoặc Thông báo.
   - Footer: "Import file khác" (quay lại bước 1) + "Đóng".
4. **Sửa dòng lỗi** (`RetryTeacherImportRowForm`): bấm "Sửa" → form ngay dưới dòng, cùng 7 ô và cùng quy tắc tự điền theo email với popup "Thêm giáo viên" (`TeacherFormFields`, `useTeacherEmailAutoFill`).
   - Hạn mức để trống. Email ngoài trường thì bỏ ngành.
   - Excel ghi mã ngành thì vẫn giữ mã, ô Ngành hiện "`<tên ngành>` (mã `<mã>`)".
   - "Gửi lại" → `POST /teacher`.
     - `1000`: toast xanh, dòng sang tab Thành công.
     - `1100`: toast vàng, dòng sang tab Cảnh báo.
     - Lỗi: dòng đỏ trong form, lý do mới thay cho lý do cũ, dòng giữ ở tab Lỗi.

---

## 6. API ghi dữ liệu (6.1, 6.2 và 6.3 đã nối – Mục 5.1, 5.3, 5.4; các API khác chưa nối)

Khi nối, sau khi ghi thành công thì `invalidateQueries({ queryKey: departmentTeacherKeys.all })` để tải lại danh sách và popup.

### 6.1. `PATCH /teacher/{publicId}/amount` – Thiết lập hạn mức

Body `{ "amount": 15 }` (BE nhận dạng chuỗi để không bị làm tròn; gửi số `15` hay chuỗi `"15"` đều được). Response không có `data`.

**Thứ tự kiểm tra:** `amount` trống → `amount` sai → `publicId` (3009) → giáo viên đã tắt (3012).
`amount` được kiểm tra trước khi truy vấn DB, nên `amount` sai thì luôn ra `4000`, kể cả khi `publicId` cũng sai.

| Trường hợp | HTTP | `code` | Message |
| :--- | :--- | :--- | :--- |
| Thành công (kể cả số không đổi) | 200 | 1000 | Cập nhật số lượng hướng dẫn thành công |
| `amount` trống: thiếu field (`{}`), `null`, `""`, chuỗi toàn khoảng trắng | 400 | 4000 | Số lượng sinh viên hướng dẫn không được để trống |
| Không phải số nguyên ≥ 0, hoặc dài quá 18 chữ số (`5.5`, `5.0`, `-1`, `"+5"`, `"1 5"`, `"abc"`) | 400 | 4000 | Số lượng sinh viên hướng dẫn phải là số nguyên không âm |
| `publicId` sai định dạng UUID hoặc không có trong DB | 404 | 3009 | Giáo viên không tồn tại |
| Giáo viên đã tắt (`status = false`) | 409 | 3012 | Giáo viên không hoạt động trong kì này, không thể cập nhật số lượng hướng dẫn |

- Hợp lệ: `0` (không nhận hướng dẫn, chỉ phản biện / hội đồng), `" 15 "` (BE tự trim), `"007"` (lưu thành `7`). Không giới hạn trên.
- Sửa được mọi giáo viên đang hoạt động, kể cả Trưởng bộ môn.
- Thiếu body, body không phải JSON, hoặc `amount` là object / mảng (`"amount": {}`) → `400 1006` "Yêu cầu không hợp lệ" (lỗi chung Mục 3),
  không phải `4000`. Lỗi này trả trước cả `3009` / `3012`.

Ràng buộc FE nên kiểm tra trước giống BE: bắt buộc, chỉ gồm chữ số 0–9 (≥ 0, không dấu, không thập phân), tối đa 18 chữ số, không làm tròn.

### 6.2. `POST /teacher/import` – Import Excel

**Request:** `multipart/form-data`, part tên **`file`** (.xlsx, tối đa 50MB). Không tự đặt header `Content-Type`, để axios tự thêm `boundary`.

**File mẫu:** chỉ đọc **sheet đầu tiên**, dòng 1 là tiêu đề, dữ liệu từ dòng 2. Đúng 6 cột theo thứ tự, cột thứ 7 phải trống
(không có cột hạn mức: BE tự gán `amount` theo email, `@tlu.edu.vn` → 20, `@gmail.com` → 10).
Tiêu đề so khớp không phân biệt hoa/thường. Dòng trống hoàn toàn (xét cột A–F) bị bỏ qua, không tính vào `totalRows`. Không giới hạn số dòng.
Ở các dòng dữ liệu, BE chỉ đọc cột A–F: dữ liệu từ cột G trở đi bị bỏ qua, không báo lỗi.

| Cột | Tiêu đề | Field |
| :--- | :--- | :--- |
| A | Họ và tên đệm (hoặc "Họ") | `firstName` |
| B | Tên | `lastName` |
| C | Email | `email` |
| D | Số điện thoại | `phone` |
| E | Đơn vị công tác | `organization` |
| F | Ngành | `major` (tên hoặc mã ngành) |

**Lỗi mức toàn file:** từ chối cả file, không lưu dòng nào, không có `data`.

| Trường hợp | HTTP | `code` | Message |
| :--- | :--- | :--- | :--- |
| Không phải `multipart/form-data` (ví dụ gửi JSON), hoặc tự đặt `Content-Type` làm mất `boundary` | 400 | 1006 | Yêu cầu không hợp lệ |
| Không chọn file, file 0 byte, hoặc request thiếu part `file` | 400 | 4000 | File import không được để trống |
| File lớn hơn 50MB | 400 | 4000 | File import vượt quá dung lượng cho phép (50MB) |
| Không có đuôi `.xlsx`, nội dung không phải .xlsx thật (kiểm tra magic bytes, ví dụ `.csv`/`.docx` đổi đuôi), hoặc file hỏng | 400 | 4000 | File import phải có định dạng .xlsx |
| Dòng 1 trống (kể cả sheet trống hoàn toàn, hoặc tiêu đề nằm ở dòng 2), sai / thiếu / thừa / đảo thứ tự cột (kể cả thêm cột hạn mức) | 400 | 4000 | Dòng tiêu đề không đúng với file mẫu |
| Có ô gộp (merged cells) bắt đầu ở cột A–F, ở bất kỳ dòng nào (kể cả dòng tiêu đề) | 400 | 4000 | File import không được chứa ô bị gộp |
| Workbook không có sheet nào, hoặc có tiêu đề đúng nhưng không còn dòng dữ liệu nào sau khi bỏ dòng trống | 400 | 4000 | File import không có dòng dữ liệu nào |
| Role `SUPERVISOR` không có trong DB (lỗi cấu hình, chỉ xảy ra khi có ít nhất 1 dòng hợp lệ) | 404 | 2007 | Role không tồn tại |

BE kiểm tra theo thứ tự, gặp lỗi đầu tiên thì dừng:
`Content-Type` / multipart, dung lượng và thiếu part `file` (Spring chặn trước khi vào Service) → file 0 byte → đuôi `.xlsx` → magic bytes / mở workbook →
không có sheet → tiêu đề → ô gộp → không còn dòng dữ liệu → (sau khi kiểm tra từng dòng) role `SUPERVISOR`.
Lỗi role xảy ra sau khi đã kiểm tra dòng nhưng vẫn rollback cả file, không lưu dòng nào.
FE nên chặn trước: chưa chọn file, đuôi khác `.xlsx`, file > 50MB.

**Thành công:** qua được các kiểm tra trên thì **luôn** trả `200`, `code 1000`, message "Xử lý file import hoàn tất",
kể cả khi mọi dòng đều lỗi. Dòng hợp lệ được lưu, dòng lỗi bị bỏ qua (import từng phần).

```json
{
  "code": 1000,
  "message": "Xử lý file import hoàn tất",
  "data": {
    "totalRows": 3,
    "successCount": 1,
    "warningCount": 1,
    "errorCount": 1,
    "rowResults": [
      {
        "rowNumber": 2,
        "firstName": "Nguyễn Văn", "lastName": "An", "email": "an.nv@tlu.edu.vn", "phone": "0987654321",
        "organization": "Trường Đại học Thủy lợi", "majorName": "Kỹ thuật phần mềm",
        "amount": 20, "status": "SUCCESS", "message": "Thêm giáo viên thành công"
      },
      {
        "rowNumber": 3,
        "firstName": "Trần Thị", "lastName": "Bình", "email": "binh.tt@gmail.com", "phone": "0912345678",
        "organization": "Trường Đại học Bách khoa Hà Nội", "majorName": "",
        "amount": 12, "status": "WARNING", "message": "Thông tin giáo viên đã có trong hệ thống"
      },
      {
        "rowNumber": 4,
        "firstName": "Lê", "lastName": "Cường", "email": "cuong@gmail.com", "phone": "0901234567",
        "organization": "Trường Đại học Thủy lợi", "majorName": "",
        "amount": null, "status": "ERROR",
        "message": "Đơn vị công tác không khớp với email (email @tlu.edu.vn phải là Trường Đại học Thủy lợi, email @gmail.com phải là trường khác)"
      }
    ]
  }
}
```

```ts
// RowImportStatus dùng lại từ student_management/types.ts: 'SUCCESS' | 'WARNING' | 'ERROR'
export interface TeacherImportRowResult {
  rowNumber: number           // Số dòng thật trên Excel (tiêu đề = 1, dữ liệu đầu tiên = 2)
  // Các field dưới là giá trị BE ĐÃ chuẩn hóa (trim, gộp khoảng trắng, email chữ thường,
  // tên Thủy lợi về đúng "Trường Đại học Thủy lợi", tên trường khác giữ nguyên); ô trống là "" chứ không phải null
  firstName: string
  lastName: string
  email: string
  phone: string
  organization: string
  majorName: string           // Đúng chuỗi trong ô Ngành (có thể là mã ngành), không phải tên ngành tra từ DB
  amount: number | null       // SUCCESS: giá trị vừa gán; WARNING: giá trị đang có trong DB; ERROR: null
  status: RowImportStatus
  message: string             // Luôn có (xem bảng dưới)
}

export interface TeacherImportResponse {
  totalRows: number           // Số dòng có dữ liệu (không tính dòng trống)
  successCount: number
  warningCount: number
  errorCount: number
  rowResults: TeacherImportRowResult[]  // Đúng thứ tự dòng trong file
}
```

**Kết quả từng dòng** (`status` + `message`; không phải HTTP status, cả file vẫn `200`):

| `status` | Khi nào | `message` |
| :--- | :--- | :--- |
| `SUCCESS` | Giáo viên mới (tạo tài khoản, role `SUPERVISOR`, `amount` mặc định theo email) | Thêm giáo viên thành công |
| `SUCCESS` | Giáo viên đã tắt, kích hoạt lại, SĐT / đơn vị / ngành / hạn mức đều giống DB | Đã kích hoạt lại tài khoản giáo viên |
| `SUCCESS` | Giáo viên đã tắt, kích hoạt lại, có trường khác DB (được ghi đè) | Đã kích hoạt lại và cập nhật: `<các trường>`, theo thứ tự Số điện thoại, Đơn vị công tác, Ngành, Số lượng hướng dẫn |
| `WARNING` | Giáo viên đang hoạt động sẵn (kể cả Trưởng bộ môn), Họ / Tên khớp DB: **không** cập nhật gì, kể cả khi SĐT / ngành khác | Thông tin giáo viên đã có trong hệ thống |
| `ERROR` | Đúng 1 ô sai | Message của lỗi đó (bảng Mục 6.5) |
| `ERROR` | Từ 2 ô sai trở lên (trùng email trong file cũng tính là 1 lỗi) | Thông tin nhập không hợp lệ, vui lòng kiểm tra lại |
| `ERROR` | Email bị trùng với dòng khác trong file, các ô khác đều đúng (**mọi** dòng trùng đều lỗi, không giữ dòng đầu) | Email bị trùng với dòng khác trong file |
| `ERROR` | Email đã thuộc tài khoản không phải giáo viên (sinh viên, admin...) | Email đã thuộc về một tài khoản khác trong hệ thống |
| `ERROR` | Email là giáo viên đã có nhưng Họ hoặc Tên khác DB (không phân biệt hoa/thường). Xét **trước** trạng thái hoạt động, nên giáo viên đang hoạt động mà lệch Họ / Tên ra lỗi này chứ không ra `WARNING` | Thông tin không khớp với hồ sơ gốc trong hệ thống |

- Dòng kết quả không có `code`: FE phân biệt bằng `status` và `message`.
- Khi kích hoạt lại qua import, `amount` được đặt lại về mặc định theo email (vì file không có cột hạn mức).

### 6.3. `POST /teacher` – Thêm thủ công

Body 1 giáo viên:

```json
{
  "firstName": "Nguyễn Văn",
  "lastName": "An",
  "email": "an.nv@tlu.edu.vn",
  "phone": "0987654321",
  "organization": "Trường Đại học Thủy lợi",
  "major": "Kỹ thuật phần mềm",
  "amount": 15
}
```

- 5 field `firstName`, `lastName`, `email`, `phone`, `organization` đều **bắt buộc**. `major` bắt buộc với giáo viên trong trường và **phải để trống** (`""` / `null`) với giáo viên ngoài trường. Quy tắc từng field ở Mục 6.5.
- `email` chỉ nhận `@tlu.edu.vn` (trong trường) hoặc `@gmail.com` (ngoài trường); `organization` là tên trường và phải khớp với email (`@tlu.edu.vn` ⇔ `Trường Đại học Thủy lợi`, `@gmail.com` ⇔ trường khác).
- `major` là **tên hoặc mã ngành**.
- `amount` không bắt buộc: FE tự điền theo đuôi email (20 / 10), TBM được sửa thành số nguyên ≥ 0; bỏ trống (`null` / `""`) thì BE tự gán.
- BE nhận **mọi field dạng chuỗi**. FE nên gửi chuỗi cho tất cả, đặc biệt `phone`:
  gửi số `0987654321` (số có 0 đứng đầu) là JSON sai → `400 1006`; gửi số `987654321` → BE nhận chuỗi `"987654321"` → lỗi SĐT.
  Field là object / mảng (`{}`, `[]`) cũng ra `400 1006` (lỗi chung Mục 3). Lỗi `1006` chỉ có message chung "Yêu cầu không hợp lệ",
  không gom với lỗi các field khác như `4000`. Field thừa trong body bị bỏ qua.
- BE dùng **đúng pipeline của 1 dòng Excel** (không dùng `@Valid`), nên lỗi chỉ có **1 message**, không kèm tên field:
  sai 1 field → message của field đó, sai từ 2 field → message chung. FE nên kiểm tra trước bằng đúng quy tắc Mục 6.5
  để báo lỗi ngay dưới từng ô; lỗi BE trả về (thường là 3006 / 3007, FE không tự biết được) thì hiện chung trên form.
- Response không có `data`, chỉ có `code` + `message`.

| Trường hợp | HTTP | `code` | Message |
| :--- | :--- | :--- | :--- |
| Giáo viên mới: tạo tài khoản, role `SUPERVISOR` | 200 | 1000 | Thêm giáo viên thành công |
| Giáo viên đã tắt, kích hoạt lại, SĐT / đơn vị / ngành / hạn mức đều giống DB | 200 | 1000 | Đã kích hoạt lại tài khoản giáo viên |
| Giáo viên đã tắt, kích hoạt lại, có trường khác DB (được ghi đè) | 200 | 1000 | Đã kích hoạt lại và cập nhật: `<các trường>` (ví dụ "Đã kích hoạt lại và cập nhật: Số điện thoại, Số lượng hướng dẫn") |
| Giáo viên đang hoạt động sẵn (kể cả Trưởng bộ môn), Họ / Tên khớp DB – **Báo Vàng**, không cập nhật gì (`amount` gửi lên bị bỏ qua) | 200 | 1100 | Thông tin giáo viên đã có trong hệ thống |
| Đúng 1 field sai | 400 | 4000 | Message của lỗi đó (bảng Mục 6.5) |
| Từ 2 field sai trở lên | 400 | 4000 | Thông tin nhập không hợp lệ, vui lòng kiểm tra lại |
| Email đã thuộc tài khoản không phải giáo viên (sinh viên, admin...) | 409 | 3006 | Email đã thuộc về một tài khoản khác trong hệ thống |
| Email là giáo viên đã có nhưng Họ hoặc Tên khác DB (không phân biệt hoa/thường). Xét **trước** trạng thái hoạt động, nên giáo viên đang hoạt động mà lệch Họ / Tên ra `3007` chứ không ra `1100` | 409 | 3007 | Thông tin không khớp với hồ sơ gốc trong hệ thống |
| Role `SUPERVISOR` không có trong DB (lỗi cấu hình). Chỉ xảy ra khi dữ liệu nhập đã hợp lệ, kể cả khi email đã tồn tại | 404 | 2007 | Role không tồn tại |
| Body thiếu / không phải JSON / field sai kiểu JSON (lỗi chung Mục 3), trả trước mọi lỗi ở trên | 400 | 1006 | Yêu cầu không hợp lệ |

**Thứ tự kiểm tra:** dữ liệu nhập (bảng Mục 6.5, gom lỗi) → role `SUPERVISOR` → đối chiếu DB theo email:
email chưa có → tạo mới; có nhưng không phải giáo viên → `3006`; lệch Họ / Tên → `3007`; đang hoạt động → `1100`; còn lại → kích hoạt lại.

- Xanh và Vàng đều HTTP `200`, FE phân biệt bằng `code` (`1000` / `1100`). Mã `1100` interceptor tự hiện toast vàng
  (gửi `skipWarningToast: true` nếu form tự hiện kết quả).
- Kích hoạt lại qua form: Họ, Tên phải khớp DB; SĐT, đơn vị, ngành, hạn mức lấy theo dữ liệu nhập
  (`amount` bỏ trống → mặc định theo email). Message 1000 liệt kê các trường đã đổi theo thứ tự
  Số điện thoại, Đơn vị công tác, Ngành, Số lượng hướng dẫn.
- Sau `1000` / `1100`: `invalidateQueries(departmentTeacherKeys.all)`.
- Khi `1100`, hạn mức không đổi; muốn đổi hạn mức của giáo viên đang hoạt động thì dùng `PATCH /teacher/{publicId}/amount` (Mục 6.1).

### 6.4. `PATCH /teacher/{publicId}/activate` – Kích hoạt lại

Không có body, `publicId` lấy từ dòng trên danh sách. Response không có `data`.
- Giáo viên đã tắt: bật lại tài khoản, đặt `amount` về **mặc định theo email** (`@tlu.edu.vn` → 20, còn lại → 10);
  giữ nguyên SĐT, đơn vị, ngành, role. Muốn đổi các trường này khi kích hoạt thì dùng `POST /teacher` (Mục 6.3).
- Giáo viên đang hoạt động sẵn (kể cả Trưởng bộ môn): không cập nhật gì.
- Không kiểm tra Họ / Tên hay dữ liệu hồ sơ, chỉ dựa vào `publicId`.

**Thứ tự kiểm tra:** `publicId` (3009) → đang hoạt động (1100) → kích hoạt.

| Trường hợp | HTTP | `code` | Message |
| :--- | :--- | :--- | :--- |
| Kích hoạt thành công | 200 | 1000 | Đã kích hoạt lại tài khoản giáo viên |
| Đang hoạt động sẵn – **Báo Vàng** | 200 | 1100 | Thông tin giáo viên đã có trong hệ thống |
| `publicId` sai định dạng UUID hoặc không có trong DB | 404 | 3009 | Giáo viên không tồn tại |
| Sai method, ví dụ `POST` thay cho `PATCH` (lỗi chung Mục 3) | 405 | 1007 | Hệ thống không cấp phép |
| URL thiếu `publicId` (`/teacher//activate`, Mục 3 Lỗi đã biết) | 400 | không có | *(không có body `{code, message}`)* |

FE chỉ nên hiện nút Kích hoạt cho dòng `status = false`; `1100` chỉ xảy ra khi danh sách đang hiển thị dữ liệu cũ.

### 6.5. Bảng lỗi kiểm tra dữ liệu 1 giáo viên (dùng chung cho 6.2 và 6.3)

Lỗi ở bảng này là `400`, `code 4000` khi gọi `POST /teacher`, và là dòng `status = "ERROR"` khi import.

**Chuẩn hóa trước khi kiểm tra:** xóa ký tự ẩn, gộp khoảng trắng (cả tab, xuống dòng) thành 1, trim, chuẩn NFC;
`email` đổi về chữ thường; `organization` là tên Thủy lợi (không phân biệt hoa/thường) thì đổi về đúng `Trường Đại học Thủy lợi`, tên trường khác giữ nguyên.
Chuỗi toàn khoảng trắng coi như trống.

**Riêng khi import:** ô công thức lấy giá trị đã tính sẵn; ô công thức bị lỗi (`#N/A`, `#REF!`...) bị coi là sai định dạng
của cột đó. Ô SĐT để kiểu Number sẽ mất số `0` đầu → lỗi SĐT, nên file mẫu cần để cột SĐT ở định dạng Text.

**Thứ tự kiểm tra trên mỗi field:** Trống → Định dạng / Danh mục → Trùng trong file (chỉ email, chỉ khi import).
Field đã lỗi ở bước trước thì không xét bước sau, nên **mỗi field tối đa 1 lỗi**. Mọi field chuỗi dài quá **255 ký tự**
bị coi là lỗi định dạng của field đó.

| Field | Quy tắc | Trống | Sai định dạng / danh mục |
| :--- | :--- | :--- | :--- |
| `firstName` | Chữ cái tiếng Việt, các từ cách nhau 1 khoảng trắng (không số, không ký tự đặc biệt) | Họ không được để trống | Họ chỉ được chứa chữ cái và khoảng trắng |
| `lastName` | **Một từ**, chỉ chữ cái tiếng Việt | Tên không được để trống | Tên chỉ được chứa chữ cái |
| `email` | (a) Đúng định dạng email; (b) đúng định dạng rồi mới xét đuôi `@tlu.edu.vn` / `@gmail.com` (email sinh viên `@e.tlu.edu.vn` cũng bị chặn) | Email không được để trống | (a) Email không đúng định dạng<br>(b) Email giáo viên phải có đuôi @tlu.edu.vn (trong trường) hoặc @gmail.com (ngoài trường) |
| `phone` | 10 chữ số, bắt đầu bằng `0` | Số điện thoại không được để trống | Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0 |
| `organization` | (a) Tên trường: chữ, số, khoảng trắng và các dấu `. , - & ( ) ' /`, tối đa 255 ký tự; (b) phải khớp email: `@tlu.edu.vn` ⇔ `Trường Đại học Thủy lợi`, `@gmail.com` ⇔ trường khác (chỉ xét khi email đã hợp lệ) | Đơn vị công tác không được để trống | (a) Đơn vị công tác chỉ gồm chữ, số, khoảng trắng và các dấu . , - & ( ) ' / (tối đa 255 ký tự)<br>(b) Đơn vị công tác không khớp với email (email @tlu.edu.vn phải là Trường Đại học Thủy lợi, email @gmail.com phải là trường khác) |
| `major` | **Trong trường:** tên ngành hoặc mã ngành có trong DB (không phân biệt hoa/thường, chưa lọc theo bộ môn). **Ngoài trường:** phải để trống. Email lỗi mà ngành trống thì không báo lỗi ngành | Ngành học không được để trống *(chỉ trong trường)* | Ngành học không tồn tại trong hệ thống<br>Giáo viên ngoài trường không được điền ngành |
| `amount` *(chỉ `POST /teacher`)* | Không bắt buộc. Số nguyên ≥ 0, không làm tròn (`5.5`, `5.0`, `-1`, `+5`, `abc` đều sai), tối đa 18 chữ số, không giới hạn trên theo nghiệp vụ | *(không lỗi, BE tự gán)* | Số lượng sinh viên hướng dẫn phải là số nguyên không âm |

Lỗi chỉ có khi import:

| Trường hợp | Message |
| :--- | :--- |
| Email (đã hợp lệ) trùng với dòng khác trong cùng file, **mọi** dòng trùng đều lỗi | Email bị trùng với dòng khác trong file |

**Gom lỗi:** đúng 1 field sai → message của field đó; từ 2 field sai trở lên → "Thông tin nhập không hợp lệ, vui lòng kiểm tra lại".
Dòng / request đã có lỗi ở bảng này thì không đối chiếu DB, nên không ra 3006 / 3007.

**Đối chiếu DB** (chỉ với dòng / request hợp lệ, theo email, xét lần lượt, gặp trường hợp nào thì dừng):

| # | Điều kiện | Kết quả |
| :--- | :--- | :--- |
| 1 | Email chưa có tài khoản | Tạo mới (role `SUPERVISOR`) |
| 2 | Email đã có tài khoản nhưng không phải giáo viên | `3006` |
| 3 | Là giáo viên, Họ hoặc Tên khác DB (không phân biệt hoa/thường) | `3007` |
| 4 | Là giáo viên đang hoạt động | `1100` (Báo Vàng), không cập nhật gì |
| 5 | Là giáo viên đã tắt | Kích hoạt lại, ghi đè SĐT / đơn vị / ngành (ngoài trường: không có ngành) / hạn mức |

---

## 7. Checklist

- [x] Route `/department/lecturer-management` + page `LecturerManagementPage` (`export default`, nạp lazy).
- [x] `GET /teacher` qua `teacherService.getTeachers` + `toSpringPage`, `useTeachers` (`keepPreviousData`).
- [x] `GET /teacher/{publicId}` qua `useTeacherDetail` (`skipToken`) + `TeacherDetailDialog`.
- [x] Bảng 6 cột STT / Họ và tên / Đơn vị công tác / Khoa phụ trách / Hạn mức / Thao tác; skeleton, lỗi, rỗng, phân trang.
- [x] Nút Thiết lập hạn mức (từng dòng, khóa khi đã tắt), Export Excel: chỉ hiển thị.
- [x] Tách phân trang dùng chung (`getPageItems`, `TablePagination`) cho bảng sinh viên và giáo viên.
- [x] Tìm kiếm / bộ lọc (`name`, `organizationType=internal|external`, `majorName`) và bấm tiêu đề cột để sắp xếp; tách `SortableTableHead`, `getNextSort`, `compactParams` dùng chung.
- [x] Test `tests/integration/teacherTable.test.tsx` (cột, STT, "—", nút hạn mức không mở popup, khóa nút khi đã tắt, sắp xếp, rỗng khi lọc) + `tests/unit/utils.test.ts` (`getNextSort`, `compactParams`).
- [x] Tài liệu đủ exception của 6 API, đã rà soát lại với code BE ngày 21/10/2026: lỗi chung 401 / 403 / 400 `1006` / 405 / 404 `1005` / 500 và lỗi đã biết (Mục 3; `GlobalException` đã bắt lỗi tầng request, trước đây ra 500),
  bảng lỗi + thứ tự kiểm tra từng API (Mục 4, 6.1–6.4), bảng lỗi kiểm tra dữ liệu và đối chiếu DB (Mục 6.5).
- [x] Nối `PATCH /teacher/{publicId}/amount`: ô nhập số trong bảng + popup xác nhận bắt buộc (`TeacherAmountInput`, `ConfirmAmountSheet`, `useUpdateTeacherAmount`); test trong `tests/integration/teacherTable.test.tsx`, `tests/unit/teacherService.test.ts`.
- [x] Nối Thêm thủ công: popup "Thêm giáo viên" + `POST /teacher` (`useCreateTeacher`, `createTeacherSchema`); test `tests/unit/createTeacherSchema.test.ts`, `tests/integration/createTeacherDialog.test.tsx`.
- [x] Nối Import Excel: popup chọn file (`.xlsx`, ≤ 50MB, lỗi cả file hiện dưới ô) → kết quả 3 tab, sửa dòng lỗi gửi lại qua `POST /teacher`; test `tests/integration/importTeacherDialog.test.tsx`, `tests/unit/teacherImportResult.test.ts`, `tests/unit/teacherService.test.ts`.
- [ ] Nối Kích hoạt lại; Export Excel chờ BE.
