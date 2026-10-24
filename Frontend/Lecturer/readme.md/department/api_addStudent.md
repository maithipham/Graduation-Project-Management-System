# Quản lý sinh viên (Trưởng bộ môn) – Đặc tả giao diện & API

> Ban đầu file này là **brief giao cho phiên chat khác** làm frontend; nay đã cập nhật theo code thực tế
> (`src/features/department/student_management/`). Đọc kèm `AGENTS.md` và các skill
> `create-feature`, `connect-api`, `build-form`, `verify-changes`.
> Hợp đồng API lấy từ backend Spring Boot (`tlu_gpms_system`, branch `Login_Feature`); tài liệu nghiệp vụ gốc ở
> `Do_An_Fall26/README.md/case_execution/addStudent_TBM.md`.

---

## 1. Trạng thái hiện tại

| # | Việc | Trạng thái |
| :--- | :--- | :--- |
| 1 | Trang danh sách sinh viên: bảng, tìm kiếm, bộ lọc, sắp xếp, phân trang | ✅ API thật – `GET /student`, `GET /major` |
| 2 | Bấm 1 dòng → popup "Thông tin sinh viên" | ✅ API thật – `GET /student/{publicId}` |
| 3 | Nút **Import file** → popup, kết quả theo tab, sửa & gửi lại dòng lỗi | ✅ API thật – `POST /student/import`, `POST /student` |
| 4 | Nút **Thêm sinh viên** → popup form | ✅ API thật – `POST /student` |
| 5 | Nút **Export file** → popup | ⏳ Chỉ giao diện (BE **chưa có** API export) |
| 6 | Kích hoạt lại sinh viên đã tắt | ⏳ Chưa làm – `PATCH /student/{publicId}/activate` (Mục 6.3) |
| 7 | Tải file mẫu import | ⏳ Chưa làm – BE chưa có API tải file mẫu |

---

## 2. Vị trí code & route

- URL: **`/department/student-management`** (menu "Quản lý sinh viên" trong `departmentNav.config.ts`,
  route `path: 'student-management'` trong `src/app/routes/department.routes.tsx`, nạp page bằng `lazy()` + `withSuspense(...)`).

```
student_management/
├── types.ts                         # StudentListItem, StudentDetail, MajorOption, StudentListParams,
│                                    # StudentCreationRequest, StudentWriteResult, StudentImportResponse...
├── services/student.service.ts      # getStudents, getStudentDetail, getMajors, importStudents, createStudent
├── hooks/useStudents.ts             # departmentStudentKeys, majorKeys, useStudents, useStudentDetail, useMajors,
│                                    # useImportStudents, useCreateStudent
├── utils/
│   ├── studentFilters.ts            # DEFAULT_STUDENT_FILTERS, BATCH_OPTIONS, hasActiveFilters, mô tả bộ lọc
│   ├── studentTable.ts              # getNextSort (asc → desc → bỏ), getPageItems (nút số trang)
│   ├── createStudentSchema.ts       # schema zod form sinh viên, STUDENT_EMAIL_DOMAIN
│   └── importResult.ts              # đếm/chọn tab kết quả import, đổi dòng lỗi → giá trị form, cập nhật dòng sau khi gửi lại
├── components/
│   ├── StudentToolbar.tsx           # tìm kiếm + bộ lọc
│   ├── StudentTable.tsx             # bảng + sort header + phân trang
│   ├── StudentStatusBadge.tsx
│   ├── StudentDetailDialog.tsx      # popup "Thông tin sinh viên"
│   ├── ImportStudentDialog.tsx      # popup import
│   ├── FileDropZone.tsx             # khung chọn/kéo-thả file
│   ├── StudentImportResult.tsx      # kết quả import theo tab Lỗi / Cảnh báo / Thành công
│   ├── RetryImportRowForm.tsx       # form sửa 1 dòng lỗi rồi gửi lại qua POST /student
│   ├── StudentFormFields.tsx        # 8 ô nhập dùng chung (popup Thêm + form sửa dòng lỗi)
│   ├── CreateStudentDialog.tsx      # popup Thêm sinh viên
│   └── ExportStudentDialog.tsx      # popup export (UI)
├── pages/StudentManagementPage.tsx  # export default
└── index.ts                         # export types + hooks (không export page)
```

Endpoint trong `src/shared/api/endpoints.ts` (key `student` đang dùng cho portal sinh viên nên đặt nhóm riêng):

```ts
departmentStudent: {
  base: '/student',                                   // GET danh sách · POST thêm thủ công
  detail: (publicId: string) => `/student/${publicId}`,
  import: '/student/import',
  activate: (publicId: string) => `/student/${publicId}/activate`,
},
major: { base: '/major' },
```

---

## 3. Quy ước chung của backend

- Mọi response: `{ code, message?, data? }`. BE bật `@JsonInclude(NON_NULL)` nên **`message` có thể không có**
  (API GET thường chỉ có `code` + `data`), **`data` không có** ở API ghi.
- `code = 1000`: thành công.
- **Dải `11xx` (HTTP 200): thành công kèm cảnh báo** (`1100`, `1101`). Interceptor không reject mà tự hiện toast vàng
  (tắt bằng `{ skipWarningToast: true }`).
- Lỗi: HTTP 4xx/5xx kèm `code` nghiệp vụ → interceptor đã tự toast đỏ, component không toast lại.
  Request gọi từ form dùng `{ skipErrorToast: true }` để hiện lỗi ngay trong form.
- Quyền: mọi API ở đây yêu cầu role `ADMIN` hoặc `HEAD_OF_MAJOR`, không đủ quyền → `403`, `code 2001`.
- Không expose `id` số, chỉ dùng `publicId` (UUID string).

---

## 4. API đọc dữ liệu

### 4.1. `GET /student` – Danh sách sinh viên

**Query params** (đều không bắt buộc):

| Param | Kiểu | Ý nghĩa | Ví dụ |
| :--- | :--- | :--- | :--- |
| `keyword` | string | Tìm gần đúng, không phân biệt hoa/thường, theo **mã SV**, **họ tên đầy đủ** hoặc **email**. BE tự trim, gộp khoảng trắng | `2251172489`, `trung đức`, `@gmail.com` |
| `batch` | string | Khóa, khớp chính xác, BE tự viết hoa (`k63` → `K63`) | `K63` |
| `majorId` | UUID | `publicId` của ngành lấy từ `GET /major` | `0192f3a1-...` |
| `status` | `ACTIVE` \| `INACTIVE` \| `ALL` | Mặc định `ACTIVE` (đang hoạt động). `INACTIVE` = đã tắt từ kì trước | `ALL` |
| `page` | number | Trang, **bắt đầu từ 0** | `0` |
| `size` | number | Mặc định **15** | `15` |
| `sort` | string, lặp được | `field,asc\|desc`. Chỉ nhận: **`studentCode`, `name`, `majorName`, `className`** | `sort=name,asc` |

- Không gửi param rỗng (`keyword=`): service bỏ hẳn key khi giá trị rỗng/`undefined` (`compactParams`).
- `sort=name` sắp theo **Tên rồi Họ** (thói quen tra danh sách tiếng Việt).
- Không gửi `sort`: BE tự sắp — đang hoạt động lên trước, sinh viên mới thêm lên trước.
- axios mặc định serialize mảng thành `sort[]=...` → **sai với Spring**. Service dùng
  `paramsSerializer: { indexes: null }` (ra `sort=a,asc&sort=b,desc`).

**Response `data`:** danh sách phân trang. Spring có thể trả **một trong hai dạng**:

```jsonc
// Page<T> dạng phẳng
{ "content": [ ... ], "totalElements": 1, "totalPages": 1, "number": 0, "size": 15,
  "numberOfElements": 1, "first": true, "last": true, "empty": false }

// PagedModel<T> (Spring Data 3.3+, pageSerializationMode = VIA_DTO)
{ "content": [ ... ], "page": { "size": 15, "number": 0, "totalElements": 1, "totalPages": 1 } }
```

Service khai báo `ApiResponse<RawSpringPage<StudentListItem>>` và trả `toSpringPage(res.data.data, params)`
(`@/shared/utils`) để đưa cả hai dạng về `SpringPage<StudentListItem>`. Nếu đọc thẳng `data.number` khi BE trả
`PagedModel` thì ra `undefined` → STT thành `NaN`, mất thanh phân trang.

Một phần tử trong `content`:

```json
{
  "publicId": "0192f3a1-7c2e-7b4d-9a10-3f5e2d1c0b9a",
  "studentCode": "2251172489",
  "name": "Lê Trung Đức",
  "majorName": "Kỹ thuật phần mềm",
  "className": "63KTPM1",
  "status": true
}
```

```ts
export interface StudentListItem {
  publicId: string
  studentCode: string
  name: string            // Họ + Tên, đã ghép sẵn
  majorName: string | null
  className: string
  status: boolean         // true = đang hoạt động
}

export type StudentStatusFilter = 'ACTIVE' | 'INACTIVE' | 'ALL'
export type StudentSortField = 'studentCode' | 'name' | 'majorName' | 'className'

export interface StudentListParams {
  keyword?: string
  batch?: string
  majorId?: string
  status: StudentStatusFilter
  page: number
  size: number
  sort?: `${StudentSortField},${'asc' | 'desc'}`
}
```

**Lỗi:**

| Trường hợp | HTTP | `code` | Message |
| :--- | :--- | :--- | :--- |
| `sort` ngoài 4 key trên (ví dụ `sort=email`, `sort=batch`) | 400 | 1008 | Trường sắp xếp không hợp lệ |
| `majorId` không phải UUID, `status` sai giá trị | 400 | 1006 | Yêu cầu không hợp lệ |

### 4.2. `GET /major` – Dropdown ngành

Không có param. `data` là mảng, BE đã sắp theo tên ngành. Hook `useMajors` cache lâu (`referenceDataQueryOptions`).

```json
{ "code": 1000, "data": [ { "publicId": "0192f3a1-...", "code": "KTPM", "name": "Kỹ thuật phần mềm" } ] }
```

```ts
export interface MajorOption { publicId: string; code: string; name: string }
```

Trưởng bộ môn quản lý **nhiều ngành**, nên cần cả bộ lọc ngành và cột Ngành trên bảng.

### 4.3. `GET /student/{publicId}` – Chi tiết (popup)

Gọi khi bấm 1 dòng, dùng `publicId` của dòng đó.

```json
{
  "code": 1000,
  "data": {
    "publicId": "0192f3a1-7c2e-7b4d-9a10-3f5e2d1c0b9a",
    "studentCode": "2251172489",
    "name": "Lê Trung Đức",
    "email": "2251172489@gmail.com",
    "phone": "0911111111",
    "majorName": "Kỹ thuật phần mềm",
    "className": "63KTPM1",
    "batch": "K63",
    "status": true
  }
}
```

```ts
export interface StudentDetail extends StudentListItem {
  email: string
  phone: string | null
  batch: string
}
```

| Lỗi | HTTP | `code` | Message |
| :--- | :--- | :--- | :--- |
| `publicId` sai định dạng hoặc không có trong DB | 404 | 3008 | Sinh viên không tồn tại |

---

## 5. Giao diện

Dùng component sẵn có ở `@/shared/components/ui` (`Button`, `Input`, `Select`, `Table*`, `Dialog*`, `Tabs*`, `Badge`,
`Skeleton`, `FormField`), icon `lucide-react`, tông `slate` + `blue`. Toàn bộ chữ tiếng Việt có dấu.

Mọi popup dùng `Dialog` dùng chung: khi mở, trang nền bị khóa cuộn và được bù đúng bề rộng thanh cuộn
(`padding-right`) nên trang phía sau không bị giãn ra / co lại khi mở / đóng popup.

### 5.1. Bố cục trang `/department/student-management`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Quản lý sinh viên                         [⬆ Import file] [⬇ Export file] [+ Thêm sinh viên] │
│ Danh sách sinh viên làm đồ án kì này.                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│ [🔍 Tìm theo mã SV, họ tên hoặc email...]  [Ngành ▾] [Khóa ▾] [Trạng thái ▾] [Xóa lọc] │
├──────────────────────────────────────────────────────────────────────────────┤
│ STT │ Mã SV ↕   │ Họ và tên ↕     │ Ngành ↕            │ Lớp ↕    │ Trạng thái      │
│  1  │ 2251172489│ Lê Trung Đức    │ Kỹ thuật phần mềm  │ 63KTPM1  │ ● Đang hoạt động│
│  …                                                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│ Hiển thị 1–15 / 120 sinh viên                         [‹] 1 2 3 … 8 [›]        │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Thanh công cụ:**
- Ô tìm kiếm: debounce 400 ms bằng `useDebounce` (`@/shared/hooks`), đổi keyword thì về `page = 0`.
- Ngành: `Select` từ `GET /major`, option đầu "Tất cả ngành" (không gửi `majorId`).
- Khóa: `Select` tĩnh `BATCH_OPTIONS` = K62 → K66, option đầu "Tất cả khóa" (BE chưa có API danh sách khóa). Gửi `batch`.
- Trạng thái: "Đang hoạt động" (mặc định, `ACTIVE`) · "Đã tắt" (`INACTIVE`) · "Tất cả" (`ALL`).
- "Xóa lọc": về keyword rỗng, mọi filter mặc định, `page = 0`, bỏ sort. Chỉ hiện khi đang có filter khác mặc định.
- Đổi bất kỳ filter hoặc sort nào → `page = 0`.
- State bộ lọc: `useState` trong page (chưa đồng bộ lên URL).

**Bảng:**
- STT = `number * size + index + 1` (lấy từ `SpringPage` đã chuẩn hóa), ví dụ trang 2 bắt đầu từ 16.
- Header bấm được ở 4 cột Mã SV / Họ và tên / Ngành / Lớp: lần 1 `asc`, lần 2 `desc`, lần 3 bỏ sort. Hiện icon
  `ArrowUp` / `ArrowDown` / `ArrowUpDown`. Cột STT, Trạng thái **không** sort được (BE sẽ trả 1008).
- Trạng thái: `Badge` xanh lá "Đang hoạt động" khi `status = true`, xám "Đã tắt" khi `false`.
- `majorName` null → hiện "—".
- Cả dòng có `cursor-pointer` + hover nền `slate-50`; bấm dòng mở popup chi tiết. Hỗ trợ bàn phím: `tabIndex={0}`, Enter mở popup.
- Đang tải lần đầu: 15 dòng `Skeleton`. Đổi trang/filter: giữ dữ liệu cũ (`placeholderData: keepPreviousData`), làm mờ nhẹ
  bảng và khóa nút phân trang đến khi dữ liệu mới về.
- Rỗng: icon `Users` + "Không tìm thấy sinh viên phù hợp" (khi có filter) hoặc "Chưa có sinh viên nào" (khi không filter),
  kèm nút "Thêm sinh viên".
- Phân trang: "Hiển thị X–Y / totalElements sinh viên"; nút trước/sau disabled theo `first` / `last`; nút số trang
  (`getPageItems`: luôn có trang đầu, trang cuối, 1 trang mỗi bên trang hiện tại, còn lại là "…"). Chỉ hiện nút khi `totalPages > 1`.

### 5.2. Popup "Thông tin sinh viên"

- Mở với `publicId` của dòng; `useStudentDetail(publicId)` (chưa có `publicId` → chưa gọi API, dùng `skipToken`).
- Header: chỉ tiêu đề **"Thông tin sinh viên"** (không có avatar / tên / mã SV / badge ở header).
- Nội dung dạng lưới 2 cột (label xám nhỏ, giá trị đậm):

  | Label | Field |
  | :--- | :--- |
  | Mã sinh viên | `studentCode` |
  | Họ và tên | `name` |
  | Email | `email` (link `mailto:`) |
  | Số điện thoại | `phone` (null → "—") |
  | Ngành | `majorName` (null → "—") |
  | Lớp | `className` |
  | Khóa | `batch` |
  | Trạng thái | `status` (badge) |

- Khối mờ "Đề tài & Giảng viên hướng dẫn – Sẽ cập nhật khi có module đề tài." (giai đoạn 2 BE sẽ bổ sung).
- Đang tải: `Skeleton` theo lưới. Lỗi 404 (`3008`): interceptor đã toast, popup hiện "Không tải được thông tin sinh viên"
  (không toast lại).
- Footer: nút "Đóng". (Nút "Kích hoạt" cho sinh viên `status = false` để khi nối `PATCH .../activate`.)

### 5.3. Popup Import file

- Tiêu đề "Import danh sách sinh viên"; khi đã có kết quả đổi thành "Kết quả import sinh viên" và popup rộng ra (`max-w-6xl`).
- Khung kéo-thả / chọn file (`FileDropZone`): chỉ nhận **`.xlsx`**, tối đa **50MB**, 1 file. Chọn file xong hiện tên +
  dung lượng (`formatBytes`) + nút "x" bỏ chọn (xóa luôn cả lỗi đang hiện để chọn file khác).
  Sai đuôi / quá dung lượng → chữ đỏ dưới khung ("File import phải có định dạng .xlsx",
  "File import vượt quá dung lượng cho phép (50MB)") — trùng message của BE.
- Link "Tải file mẫu": tạm `toast.info('Sẽ hỗ trợ sau')` (file mẫu ở BE
  `src/main/resources/templates/student_import_template.xlsx`, chưa có API tải về).
- Khối hướng dẫn ngắn: 8 cột theo thứ tự **Mã sinh viên · Họ · Tên · Email · Số điện thoại · Khóa · Lớp · Ngành**,
  dòng 1 là tiêu đề, không gộp ô.
- Nút "Import" (disabled khi chưa chọn file, "Đang import..." khi đang gửi; timeout 5 phút). Gọi `POST /student/import`
  với `skipErrorToast`: lỗi mức toàn file (`4000`) hiện chữ đỏ ngay dưới khung chọn file.
- Import xong:
  - Không có dòng lỗi/cảnh báo → `toast.success('Đã import thành công N sinh viên')`.
  - Hiện kết quả theo **tab Lỗi / Cảnh báo / Thành công** (kèm số lượng; mở sẵn tab đầu tiên có dữ liệu) + dòng tóm tắt.
    Bảng mỗi tab: Dòng, Mã SV, Họ tên, Lớp, Ngành, "Lý do lỗi" / "Thông báo".
  - Dòng **Lỗi** có nút sửa: mở form ngay dưới dòng (`RetryImportRowForm`, cùng 8 ô và schema với popup Thêm),
    bấm "Gửi lại" → `POST /student`. `1000` → dòng chuyển sang Thành công; `11xx` → chuyển sang Cảnh báo;
    lỗi → hiện ở đầu form và cập nhật lý do của dòng.
  - Footer: "Import file khác" (quay lại chọn file) / "Đóng".
- Xong import hoặc gửi lại thành công → tải lại danh sách (`invalidateQueries(departmentStudentKeys.all)`).

### 5.4. Popup Export file (chỉ giao diện)

- Tiêu đề "Export danh sách sinh viên", mô tả "Xuất danh sách sinh viên ra file Excel."
- Chọn phạm vi: radio "Theo bộ lọc hiện tại" (mặc định, hiện tóm tắt filter đang chọn) / "Tất cả sinh viên".
- Định dạng: `.xlsx` (chỉ 1 lựa chọn).
- Nút "Export": `toast.info('Chức năng export sẽ được hỗ trợ sau')` rồi đóng. **BE chưa có API export**
  (khi làm sẽ cần thêm, ví dụ `GET /student/export` nhận cùng bộ lọc với `GET /student`).

### 5.5. Popup Thêm sinh viên

Form theo skill `build-form` (`react-hook-form` + `zod`, `<form noValidate>`, lỗi đỏ `#DC2626` dưới ô qua `FormField`).
Field khớp `StudentCreationRequest` của BE (Mục 6.2). Lưới 2 cột (`StudentFormFields`, dùng chung với form sửa dòng lỗi import):

| Label | Field | Ràng buộc zod (trùng BE) | Message lỗi (trùng BE) |
| :--- | :--- | :--- | :--- |
| Mã sinh viên * | `studentCode` | `^\d{10}$` | Mã sinh viên phải gồm đúng 10 chữ số |
| Họ và tên đệm * | `firstName` | chữ cái, các từ cách nhau 1 khoảng trắng: `^\p{L}+( \p{L}+)*$` (flag `u`) | Họ chỉ được chứa chữ cái và khoảng trắng |
| Tên * | `lastName` | 1 từ chữ cái: `^\p{L}+$` (flag `u`) | Tên chỉ được chứa chữ cái |
| Email * | `email` | (1) `^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$` sau khi lowercase; (2) đúng định dạng rồi mới xét: `.endsWith('@gmail.com')` (`STUDENT_EMAIL_DOMAIN`; chỉ form sinh viên, form giáo viên không áp dụng) | (1) Email không đúng định dạng; (2) Email sinh viên phải có đuôi @gmail.com |
| Số điện thoại * | `phone` | `^0\d{9}$` | Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0 |
| Khóa * | `batch` | `^K\d{2}$` sau khi uppercase | Khóa học không đúng định dạng (VD: K64) |
| Lớp * | `className` | `^[\p{L}\p{N}]+( [\p{L}\p{N}]+)*$` (flag `u`) | Tên lớp không được chứa ký tự đặc biệt |
| Ngành * | `major` | bắt buộc, `Select` từ `GET /major` (gửi **tên ngành**) | Ngành học không được để trống |

- Ô trống → message "… không được để trống" tương ứng (ví dụ "Mã sinh viên không được để trống").
- Trim + gộp khoảng trắng trước khi validate.
- Email sai định dạng chỉ báo 1 lỗi định dạng, không báo thêm lỗi đuôi email.
- Placeholder ví dụ: `2251172489`, `Lê Trung`, `Đức`, `2251172489@gmail.com`, `0911111111`, `K63`, `63KTPM1`.
- Ghi chú nhỏ dưới form: "Nếu sinh viên đã có trong hệ thống, chỉ Lớp và Số điện thoại được cập nhật."
- Nút "Hủy" / "Lưu" ("Đang lưu..." khi đang gửi; không cho đóng popup lúc đang gửi). Gọi `POST /student` với `skipErrorToast`:
  - `1000` → `toast.success(message của BE)`, đóng và reset form.
  - `11xx` (ví dụ `1101`) → interceptor hiện toast vàng, đóng popup.
  - Lỗi (`4000`, `3004`, `3010`, `3011`, `3005`, mất mạng) → hiện message của BE ở đầu form (`setError('root.server')`).

---

## 6. API ghi dữ liệu

### 6.1. `POST /student/import` (đã nối)

`multipart/form-data`, part tên **`file`** (service gửi kèm header `Content-Type: multipart/form-data` để axios không
serialize FormData thành JSON). Luôn trả HTTP 200, `code 1000`, message "Xử lý file import hoàn tất", kèm:

```ts
export type RowImportStatus = 'SUCCESS' | 'WARNING' | 'ERROR'

export interface StudentImportRowResult {
  rowNumber: number        // dòng thật trên Excel (tiêu đề = 1)
  // Giữ nguyên giá trị đọc từ file; ô trống có thể là null
  studentCode: string | null
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  batch: string | null
  className: string | null
  majorName: string | null
  status: RowImportStatus  // SUCCESS xanh · WARNING vàng · ERROR đỏ
  message: string          // lý do / kết quả của dòng
}

export interface StudentImportResponse {
  totalRows: number
  successCount: number
  warningCount: number
  errorCount: number
  rowResults: StudentImportRowResult[]
}
```

Lỗi mức toàn file (HTTP 400, `code 4000`): "File import không được để trống", "File import phải có định dạng .xlsx",
"Dòng tiêu đề không đúng với file mẫu", "File import không được chứa ô bị gộp", "File import không có dòng dữ liệu nào",
"File import vượt quá dung lượng cho phép (50MB)".

Lỗi đối chiếu DB của từng dòng (`status = ERROR`) dùng cùng message với `POST /student` (bảng Mục 6.2), ví dụ
"Mã sinh viên đã thuộc về một tài khoản khác trong hệ thống". FE chỉ hiển thị `message`, không cần đổi code khi BE đổi message.

### 6.2. `POST /student` (đã nối – thêm thủ công & gửi lại dòng import lỗi)

Body JSON:

```json
{
  "studentCode": "2251172489",
  "firstName": "Lê Trung",
  "lastName": "Đức",
  "email": "2251172489@gmail.com",
  "phone": "0911111111",
  "batch": "K63",
  "className": "63KTPM1",
  "major": "Kỹ thuật phần mềm"
}
```

API ghi không có `data`, nên service trả `StudentWriteResult { code, message }` để màn hình phân biệt thành công / cảnh báo.

| Kết quả | HTTP | `code` | Message |
| :--- | :--- | :--- | :--- |
| Thêm mới | 200 | 1000 | Thêm sinh viên thành công |
| Đang hoạt động, đổi lớp/SĐT | 200 | 1000 | Đã cập nhật: Lớp, Số điện thoại |
| Bị tắt, kích hoạt lại (± cập nhật) | 200 | 1000 | Đã kích hoạt lại … |
| **Đang hoạt động, y hệt – cảnh báo vàng** | 200 | **1101** | Sinh viên đã có trong hệ thống, thông tin không thay đổi |
| 1 lỗi định dạng | 400 | 4000 | Message lỗi cụ thể (bảng Mục 5.5) |
| Email đúng định dạng nhưng không có đuôi `@gmail.com` | 400 | 4000 | Email sinh viên phải có đuôi @gmail.com |
| ≥ 2 lỗi định dạng | 400 | 4000 | Thông tin nhập không hợp lệ, vui lòng kiểm tra lại |
| Mã SV chưa có, email đã thuộc tài khoản khác (SV khác, giáo viên, admin) | 409 | 3010 | Email đã thuộc về một tài khoản khác trong hệ thống |
| Mã SV đã có (gắn với email khác), email nhập vào chưa có trong hệ thống | 409 | 3011 | Mã sinh viên đã thuộc về một tài khoản khác trong hệ thống |
| Mã SV và email đều đã có nhưng thuộc 2 tài khoản khác nhau | 409 | 3004 | Mã sinh viên và Email thuộc về hai tài khoản khác nhau trong hệ thống |
| Đúng mã + email nhưng lệch họ tên/khóa/ngành | 409 | 3005 | Thông tin không khớp với hồ sơ gốc trong hệ thống |

### 6.3. `PATCH /student/{publicId}/activate` (chưa nối)

Không body. `1000` "Đã kích hoạt lại tài khoản sinh viên" · **`1100`** (HTTP 200, vàng) "Sinh viên đã tồn tại/đang hoạt động trong kì này" ·
404 `3008` "Sinh viên không tồn tại". Endpoint đã khai báo sẵn (`API_ENDPOINTS.departmentStudent.activate`);
mã `1100` sẽ tự hiện toast vàng nhờ interceptor xử lý dải `11xx`.

---

## 7. Checklist

- [x] `/department/student-management` mở được từ menu, page nạp lazy.
- [x] Bảng hiển thị dữ liệu thật từ `GET /student`, mặc định `status=ACTIVE`, `size=15`, `page=0`.
- [x] Tìm kiếm (debounce), lọc Ngành (từ `GET /major`), Khóa, Trạng thái, Xóa lọc; đổi filter về trang 0.
- [x] Sort 4 cột đúng key `studentCode | name | majorName | className`; phân trang đúng (0-based), STT nối tiếp theo trang,
      đọc được cả `Page` phẳng lẫn `PagedModel`.
- [x] Bấm dòng → popup "Thông tin sinh viên" gọi `GET /student/{publicId}`, có skeleton khi tải, xử lý 404.
- [x] Import gọi `POST /student/import`, kết quả theo tab, sửa & gửi lại dòng lỗi qua `POST /student`; nút "x" bỏ chọn file lỗi.
- [x] Popup Thêm sinh viên gọi `POST /student`, validate zod đúng message BE (gồm đuôi `@gmail.com`).
- [x] Mở/đóng popup không làm trang nền giãn ra / co lại.
- [ ] Export file (chờ BE có API).
- [ ] Kích hoạt lại sinh viên đã tắt (`PATCH /student/{publicId}/activate`).
- [ ] Tải file mẫu import (chờ BE có API).
- [x] Không deep import, service trả `res.data.data` (riêng API ghi trả `{ code, message }`), không `toast.error` thủ công.
- [x] `npx tsc -b`, `npm run lint`, `npm test`, `npm run build` đều qua.
