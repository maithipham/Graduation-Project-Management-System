# Quản lý tài khoản sinh viên (Admin) – Đặc tả giao diện & API

> Tài liệu để nối màn hình **`/admin/accounts-students`** với backend Spring Boot (`tlu_gpms_system`).
> Code FE: `src/features/admin/account_management/` (page `StudentAccountListPage.tsx` → `AccountListView role="Sinh viên"`).
> Hiện trang đang lọc trên **dữ liệu mock** (`useAccountStore`); tài liệu này mô tả cách chuyển sang API thật.

---

## 1. Tổng quan API

| #   | API                                  | Dùng cho                                        | Trạng thái FE         |
| :-- | :----------------------------------- | :---------------------------------------------- | :-------------------- |
| 1   | `GET /student/account`               | Bảng danh sách tài khoản sinh viên + bộ lọc     | ⏳ Cần nối (Mục 4)    |
| 2   | `GET /student/account/{publicId}`    | Popup chi tiết khi bấm vào 1 sinh viên          | ⏳ Cần nối (Mục 5)    |
| 3   | `GET /major`                         | Dropdown "Tất cả bộ môn"                        | ✅ Đã gọi (`useMajors`) |
| 4   | `GET /student/batch/all`             | Dropdown "Tất cả khóa"                          | ✅ Đã gọi (`useAllStudentBatches`) |
| 5   | `DELETE /student/account/{publicId}` | Icon thùng rác: xóa hẳn hoặc khóa tài khoản     | ⏳ Cần nối (Mục 6.2)  |
| 6   | `PUT /student/account/{publicId}`    | Icon bút chì: sửa 8 trường (có Ngành) + mở / khóa tài khoản | ⏳ Cần nối (Mục 6.1) |
| 7   | `GET /student/account/export`        | Nút Xuất Excel (cùng bộ lọc với bảng, không phân trang) | ⏳ Cần nối (Mục 9) |
| 8   | `POST /student/account`              | Nút Thêm sinh viên: chỉ tạo tài khoản           | ⏳ Cần nối (Mục 10.1) |
| 9   | `POST /student/account/import`       | Nút Import file: chỉ tạo tài khoản              | ⏳ Cần nối (Mục 10.2) |

Khác với `GET /student` của Trưởng bộ môn (lọc theo **học kì**, mỗi dòng là 1 đề tài), API `/student/account`
liệt kê **mọi sinh viên có tài khoản trong hệ thống**, không phụ thuộc học kì, không có thông tin đề tài.

Các API ghi của Admin (thêm, import, sửa, xóa) **tách riêng hoàn toàn** khỏi luồng Trưởng bộ môn (`/student`,
`/student/import`, `PUT /student/{publicId}`): không gắn sinh viên vào học kì, không tạo đề tài, không giới hạn phạm vi ngành.

---

## 2. Quy ước chung của backend

- Mọi response: `{ code, message?, data? }`, `code = 1000` là thành công. BE bật `@JsonInclude(NON_NULL)`
  nên API GET thường chỉ có `code` + `data`.
- Lỗi: HTTP 4xx/5xx kèm `code` nghiệp vụ, interceptor đã tự toast đỏ → component không toast lại.
- Quyền (role `ADMIN` đã có đủ):
  - `VIEW_ACCOUNT`: danh sách, chi tiết, xuất Excel
  - `CREATE_ACCOUNT`: thêm thủ công, import file
  - `UPDATE_ACCOUNT`: sửa (bút chì)
  - `DELETE_ACCOUNT`: xóa (thùng rác)

  Thiếu quyền → `403`, `code 2001`.
- Dải `11xx` (HTTP 200) là thành công kèm cảnh báo, interceptor tự hiện toast vàng (ở màn này chỉ có `1103`).
- Định danh sinh viên luôn là **`publicId` (UUID dạng chuỗi)**, không có `id` số.

### Mã lỗi có thể gặp

| HTTP | code | Khi nào                                                        | Message                                       |
| :--- | :--- | :------------------------------------------------------------- | :-------------------------------------------- |
| 400  | 1006 | `majorId` không phải UUID, `status` không phải `true/false`    | Yêu cầu không hợp lệ                          |
| 400  | 1008 | `sort` theo trường không có trong danh sách cho phép (Mục 4.1) | Trường sắp xếp không hợp lệ                   |
| 401  | 2000 | Hết phiên đăng nhập                                            | Phiên đăng nhập của bạn đã hết hạn            |
| 400  | 4000 | Dữ liệu thêm / sửa sai định dạng, ngành không tồn tại, file import lỗi (Mục 6.1, 10) | Message lỗi cụ thể |
| 403  | 2001 | Tài khoản không có permission tương ứng                        | Bạn không có quyền truy cập (access denied)   |
| 404  | 3008 | `publicId` sai định dạng hoặc sinh viên không tồn tại (Mục 5, 6) | Sinh viên không tồn tại                     |
| 409  | 3014 | Mã SV / email / SĐT trùng tài khoản khác (Mục 6.1, 10)          | `<các trường> trùng với tài khoản đã tồn tại trong hệ thống` |
| 409  | 3033 | Đổi ngành khi sinh viên đang làm đồ án (Mục 6.1)                | Sinh viên đang làm đồ án, không thể đổi ngành |
| 500  | 4000 | Lỗi tạo file Excel khi xuất (Mục 9)                            | Không tạo được file Excel, vui lòng thử lại   |

---

## 3. Endpoint FE

Thêm vào `src/shared/api/endpoints.ts`, nhóm `admin` (trang sinh viên không dùng `admin.accounts = '/accounts'`,
BE không có endpoint đó):

```ts
admin: {
  // ...
  studentAccounts: '/student/account',                                        // GET danh sách
  studentAccountDetail: (publicId: string) => `/student/account/${publicId}`, // GET chi tiết, PUT sửa, DELETE xóa / khóa
  studentAccountExport: '/student/account/export',                            // GET xuất Excel
  studentAccountImport: '/student/account/import',                            // POST import file
  studentBatchAll: '/student/batch/all',                                      // thay hằng STUDENT_ALL_BATCHES_ENDPOINT
  // POST thêm thủ công dùng chung studentAccounts
},
```

---

## 4. Danh sách tài khoản sinh viên – `GET /student/account`

### 4.1 Request

Mọi tham số đều **không bắt buộc**; bỏ trống / không gửi = không lọc theo điều kiện đó.

| Param     | Kiểu              | Ý nghĩa                                                                                     | Lấy giá trị từ                                       |
| :-------- | :---------------- | :------------------------------------------------------------------------------------------ | :--------------------------------------------------- |
| `keyword` | string            | Ô tìm kiếm: khớp một phần **mã SV**, **họ tên đầy đủ** hoặc **email**, không phân biệt hoa thường | Ô search của toolbar                          |
| `batch`   | string            | Lọc theo khóa, ví dụ `K65` (không phân biệt hoa thường)                                     | Dropdown "Tất cả khóa" ← `GET /student/batch/all`    |
| `majorId` | string (UUID)     | Lọc theo bộ môn — **`publicId` của ngành, KHÔNG phải tên ngành**                            | Dropdown "Tất cả bộ môn" ← `GET /major` (`publicId`) |
| `status`  | `true` \| `false` | `true` = Hoạt động, `false` = Không hoạt động                                               | Dropdown "Trạng thái" (`AccountStatusFilter`)        |
| `page`    | number            | Trang, **bắt đầu từ 0** (mặc định 0)                                                        | `currentPage - 1`                                    |
| `size`    | number            | Số dòng / trang (mặc định 10)                                                               | `PAGE_SIZE`                                          |
| `sort`    | string            | `<field>,asc\|desc`, có thể gửi nhiều lần                                                   | (tùy chọn)                                           |

- `sort` cho phép: `name` (sắp theo Tên rồi Họ), `email`, `studentCode`, `majorName`, `className`, `batch`, `accountStatus`.
  Trường khác → `400 1008`. Không gửi `sort` → sinh viên **mới tạo lên trước**.
- Ô "Trạng thái" đang lưu chuỗi `'' | 'true' | 'false'` → đổi sang `undefined | true | false` trước khi gửi.
- Gửi tham số qua `compactParams(...)` (`@/shared/utils/params`) để bỏ giá trị rỗng.

Ví dụ:

```
GET /student/account?keyword=đức&batch=K65&majorId=0192f3a1-...&status=true&page=0&size=10&sort=name,asc
```

### 4.2 Response

BE trả `Page` dạng **PagedModel** (`content` + `page`), dùng `toSpringPage` (`@/shared/utils/springPage`) để đưa về `SpringPage<T>`.

```json
{
  "code": 1000,
  "data": {
    "content": [
      {
        "publicId": "0192f3b2-7c1e-7a10-9b2e-3f4d5a6b7c8d",
        "studentCode": "2251061234",
        "name": "Lê Trung Đức",
        "email": "2251061234@e.tlu.edu.vn",
        "className": "65CNTT1",
        "batch": "K65",
        "majorName": "Công nghệ thông tin",
        "accountStatus": true
      }
    ],
    "page": { "size": 10, "number": 0, "totalElements": 57, "totalPages": 6 }
  }
}
```

| Field           | Kiểu           | Ghi chú                                                            |
| :-------------- | :------------- | :----------------------------------------------------------------- |
| `publicId`      | string (UUID)  | Không hiển thị; dùng làm `key` của dòng và để gọi API chi tiết     |
| `studentCode`   | string         | Không hiện trên bảng (hiện trong popup chi tiết)                   |
| `name`          | string         | Họ + Tên, ví dụ "Lê Trung Đức"                                     |
| `email`         | string         | Hiện **dưới tên** ở cột Họ và tên                                  |
| `className`     | string         | Lớp                                                                |
| `batch`         | string         | Khóa                                                               |
| `majorName`     | string \| null | Tên ngành (cột Bộ môn); hiện `—` nếu null                          |
| `accountStatus` | boolean        | `true` = Hoạt động, `false` = Không hoạt động (bị khóa đăng nhập)  |

Không có kết quả → `content: []`, `totalElements: 0`.

### 4.3 Hiển thị bảng

| STT | Họ và tên | Bộ môn | Lớp / Khóa | Trạng thái | Thao tác |
| :-- | :-------- | :----- | :--------- | :--------- | :------- |

| Cột            | Dữ liệu                                                                                                          |
| :------------- | :--------------------------------------------------------------------------------------------------------------- |
| **STT**        | `page.number * page.size + index + 1` (đánh số liên tục qua các trang)                                           |
| **Họ và tên**  | Dòng 1: `name` (đậm). Dòng 2: `email` (chữ nhỏ, màu xám)                                                         |
| **Bộ môn**     | `majorName ?? '—'`                                                                                               |
| **Lớp / Khóa** | `` `${className} / ${batch}` `` (ví dụ `65CNTT1 / K65`)                                                          |
| **Trạng thái** | `accountStatus === true` → badge xanh "Hoạt động"; `false` → badge xám "Không hoạt động" (giữ `getStatusBadge`) |
| **Thao tác**   | 2 icon: **bút chì** (`Pencil` của `lucide-react`, sửa) và **thùng rác** (`Trash2`, xóa) — thay cho menu `MoreVertical` hiện tại |

- Bấm vào **dòng** (trừ vùng 2 icon) → mở popup chi tiết (Mục 5). Ở 2 icon gọi `e.stopPropagation()` để không mở popup.
- Mỗi icon có `aria-label` ("Sửa sinh viên", "Xóa sinh viên") và tooltip.
- Hành vi của bút chì / thùng rác xem Mục 6.

```tsx
<TableRow key={student.publicId} onClick={() => onViewDetail(student)} className="cursor-pointer">
  ...
  <TableCell>
    <div className="font-semibold text-slate-900 text-sm">{student.name}</div>
    <div className="text-xs text-slate-500">{student.email}</div>
  </TableCell>
  ...
  <TableCell className="text-center">
    <div className="flex items-center justify-center gap-1">
      <button type="button" aria-label="Sửa sinh viên"
        onClick={(e) => { e.stopPropagation(); onEdit(student) }}>
        <Pencil className="h-4 w-4" />
      </button>
      <button type="button" aria-label="Xóa sinh viên"
        onClick={(e) => { e.stopPropagation(); onDelete(student) }}>
        <Trash2 className="h-4 w-4 text-red-600" />
      </button>
    </div>
  </TableCell>
</TableRow>
```

### 4.4 Thanh lọc

| Ô lọc         | Option                                                 | Gửi lên BE                      |
| :------------ | :----------------------------------------------------- | :------------------------------ |
| Tìm kiếm      | —                                                      | `keyword` (nên debounce ~300ms) |
| Tất cả khóa   | `GET /student/batch/all` → `["K63", "K64", ...]`       | `batch`                         |
| Tất cả bộ môn | `GET /major` → hiển thị `name`, **value = `publicId`** | `majorId`                       |
| Trạng thái    | "Hoạt động" (`'true'`), "Không hoạt động" (`'false'`)  | `status: true / false`          |

> ⚠️ Hiện `AccountListView` đang truyền `majors: apiMajors.map((m) => m.name)` và lọc theo tên.
> Cần đổi `AccountFilterToolbar` nhận option `{ value: publicId, label: name }` và lưu `selectedMajor = publicId`.

- Đổi bất kỳ ô lọc nào → về trang 1 (`page=0`) (đã có sẵn `setCurrentPage(1)`).
- Nút "Xóa bộ lọc" → reset 4 ô, về trang 1.
- `totalCount` trên toolbar lấy từ `totalElements`.

### 4.5 Phân trang

- Phân trang **phía server**: bỏ `filteredAccounts.slice(...)`, hiển thị thẳng `content`.
- `totalPages` lấy từ response; `currentPage` (1-based ở UI) → gửi `page = currentPage - 1`.
- Dùng `placeholderData: keepPreviousData` trong `useQuery` để bảng không nháy khi chuyển trang / đổi lọc.

---

## 5. Chi tiết sinh viên – `GET /student/account/{publicId}`

### 5.1 Request

| Path param | Kiểu          | Ghi chú                               |
| :--------- | :------------ | :------------------------------------ |
| `publicId` | string (UUID) | `publicId` của dòng vừa bấm trên bảng |

```
GET /student/account/0192f3b2-7c1e-7a10-9b2e-3f4d5a6b7c8d
```

### 5.2 Response

```json
{
  "code": 1000,
  "data": {
    "publicId": "0192f3b2-7c1e-7a10-9b2e-3f4d5a6b7c8d",
    "studentCode": "2251061234",
    "name": "Lê Trung Đức",
    "email": "2251061234@e.tlu.edu.vn",
    "phone": "0912345678",
    "majorName": "Công nghệ thông tin",
    "className": "65CNTT1",
    "batch": "K65",
    "accountStatus": true
  }
}
```

`phone` và `majorName` có thể `null` → hiện `—`.

### 5.3 Hiển thị popup "Thông tin sinh viên"

| Nhãn          | Dữ liệu                                                 |
| :------------ | :------------------------------------------------------ |
| Họ và tên     | `name`                                                  |
| Mã sinh viên  | `studentCode`                                           |
| Bộ môn        | `majorName ?? '—'`                                      |
| Lớp / Khóa    | `` `${className} / ${batch}` ``                         |
| Email         | `email`                                                 |
| Số điện thoại | `phone ?? '—'`                                          |
| Trạng thái    | `accountStatus` → badge "Hoạt động" / "Không hoạt động" |

- Mở popup ngay khi bấm dòng, gọi API theo `publicId` (`enabled: Boolean(publicId)`), trong lúc chờ hiện skeleton.
- Có thể hiện tạm dữ liệu sẵn có từ dòng của bảng (`name`, `email`, `className`, `batch`, `majorName`, `accountStatus`)
  trong lúc chờ API trả thêm `studentCode`, `phone`.
- Lỗi `404 3008` (sinh viên vừa bị xóa) → interceptor đã toast, đóng popup và `invalidateQueries` danh sách.

---

## 6. Icon Sửa (bút chì) / Xóa (thùng rác)

### 6.1 Bút chì (sửa) – `PUT /student/account/{publicId}`

API riêng cho Admin (quyền `UPDATE_ACCOUNT`). **Không dùng** `PUT /student/{publicId}` của Trưởng bộ môn.
Khác bản của Trưởng bộ môn: **đổi được Ngành**, **mở / khóa được tài khoản**, không giới hạn phạm vi ngành.

**Request body** (gửi đủ 8 trường như form; `accountStatus` không bắt buộc):

```json
{
  "studentCode": "2251172489",
  "firstName": "Lê Trung",
  "lastName": "Đức",
  "email": "2251172489@gmail.com",
  "phone": "0911111111",
  "batch": "K64",
  "className": "64KTPM1",
  "major": "Kỹ thuật phần mềm",
  "accountStatus": false
}
```

| Field           | Ghi chú                                                                                  |
| :-------------- | :--------------------------------------------------------------------------------------- |
| 7 trường đầu    | Cùng quy tắc định dạng với form Thêm (Mục 10.1)                                          |
| `major`         | **Tên ngành** (dropdown `GET /major`, gửi `name`), không phân biệt hoa thường            |
| `accountStatus` | `true` = mở khóa, `false` = khóa đăng nhập, **không gửi / `null` = giữ nguyên**           |

- Mở khóa tự do, không kiểm tra học kì.
- Đổi ngành bị chặn khi sinh viên **đang làm đồ án**: còn đề tài ở bất kỳ học kì nào chưa `COMPLETED` / `DISQUALIFIED` / `CANCELLED`.
  Đã hoàn thành, bị đình chỉ hoặc đã hủy đồ án thì vẫn đổi được.

**Response**:

| Tình huống                                   | HTTP | code     | message                                                        |
| :------------------------------------------- | :--- | :------- | :------------------------------------------------------------- |
| Có thay đổi – xanh                           | 200  | 1000     | `Đã cập nhật: <các trường đã đổi>` (VD `Đã cập nhật: Ngành, Trạng thái tài khoản`) |
| Không đổi gì – vàng                          | 200  | **1103** | Thông tin sinh viên không thay đổi                             |
| SV không có                                  | 404  | 3008     | Sinh viên không tồn tại                                        |
| Lỗi định dạng / ngành không tồn tại          | 400  | 4000     | Message lỗi cụ thể / `<các trường> không hợp lệ, vui lòng kiểm tra lại` |
| Trùng mã SV / email / SĐT với tài khoản khác | 409  | 3014     | `<Mã sinh viên, Email, Số điện thoại> trùng với tài khoản đã tồn tại trong hệ thống` |
| Đổi ngành khi đang làm đồ án                 | 409  | **3033** | Sinh viên đang làm đồ án, không thể đổi ngành                  |

Tên trường trong message `Đã cập nhật: ...`: Mã sinh viên, Họ, Tên, Email, Số điện thoại, Khóa, Lớp, Ngành, Trạng thái tài khoản.

**Hành vi FE**: bấm bút chì (`stopPropagation`) → mở dialog đã điền sẵn từ `GET /student/account/{publicId}`
(cần `firstName` / `lastName` riêng: tách từ `name` hoặc lấy từ form; ô Ngành là dropdown, có công tắc "Hoạt động").
Chỉ gửi `accountStatus` khi Admin đổi công tắc. Thành công `1000` → toast xanh đúng `message`, đóng dialog,
`invalidateQueries(ACCOUNT_KEYS.all)`; `1103` → interceptor toast vàng, đóng dialog; lỗi 400 / 409 → hiện `message` ở đầu form, giữ dialog.

### 6.2 Thùng rác (xóa) – `DELETE /student/account/{publicId}`

API riêng cho Admin, **không theo học kì**. **Không dùng** `DELETE /student/{publicId}?semesterId=` của Trưởng bộ môn
(API đó chỉ xóa sinh viên import nhầm khỏi 1 học kì).

**Request**: không có body, không có query. `publicId` lấy từ dòng được bấm.

**BE tự quyết định xóa hay khóa** theo dữ liệu đồ án (bảng `thesis_topic`):

| Tình huống                                              | BE làm gì                                        | HTTP | code | message                                                                      |
| :------------------------------------------------------ | :----------------------------------------------- | :--- | :--- | :--------------------------------------------------------------------------- |
| Sinh viên **chưa có** đề tài / đăng ký đồ án nào         | Xóa hẳn hồ sơ sinh viên + tài khoản + thông báo  | 200  | 1000 | Xóa tài khoản sinh viên thành công                                           |
| Sinh viên **đã có** dữ liệu đồ án (bất kỳ học kì nào)   | Giữ hồ sơ, chỉ khóa tài khoản (`accountStatus = false`) | 200  | 1000 | Sinh viên đã có dữ liệu đồ án nên không thể xóa, tài khoản đã bị khóa đăng nhập |
| Đã có dữ liệu đồ án và tài khoản **đã khóa từ trước**   | Không đổi gì                                     | 200  | 1000 | Sinh viên đã có dữ liệu đồ án, tài khoản đã bị khóa từ trước                 |
| `publicId` sai / sinh viên không tồn tại                | —                                                | 404  | 3008 | Sinh viên không tồn tại                                                      |

```json
{ "code": 1000, "message": "Xóa tài khoản sinh viên thành công" }
```

**Hành vi FE**:

1. Bấm thùng rác → **dừng lan sự kiện** (`e.stopPropagation()`) để không mở popup chi tiết của dòng.
2. Mở dialog xác nhận, ví dụ: *"Xóa tài khoản sinh viên **{name}** ({studentCode})? Nếu sinh viên đã có dữ liệu đồ án,
   tài khoản sẽ chỉ bị khóa đăng nhập thay vì xóa."*
3. Xác nhận → gọi API, nút "Xóa" disable + spinner khi đang gọi.
4. Thành công → **toast xanh hiển thị đúng `message` BE trả về** (vì message cho biết đã xóa hay chỉ khóa),
   đóng dialog, `invalidateQueries(ACCOUNT_KEYS.all)` để tải lại danh sách (dòng biến mất hoặc chuyển "Không hoạt động").
5. Lỗi 404 3008 (sinh viên đã bị xóa ở tab khác) → interceptor đã toast, FE chỉ đóng dialog và tải lại danh sách.

---

## 7. Gợi ý code FE

### 7.1 Types (`types/account.types.ts`)

```ts
/** 1 dòng của GET /student/account */
export interface StudentAccountItem {
  publicId: string
  studentCode: string
  name: string
  email: string
  className: string
  batch: string
  majorName: string | null
  accountStatus: boolean
}

/** data của GET /student/account/{publicId} */
export interface StudentAccountDetail extends StudentAccountItem {
  phone: string | null
}

/** Query của GET /student/account */
export interface StudentAccountListParams {
  keyword?: string
  batch?: string
  majorId?: string
  status?: boolean
  page: number // 0-based
  size: number
  sort?: string | string[]
}
```

### 7.2 Service (`services/account.service.ts`)

```ts
getStudentAccounts: async (params: StudentAccountListParams): Promise<SpringPage<StudentAccountItem>> => {
  const res = await apiClient.get<ApiResponse<RawSpringPage<StudentAccountItem>>>(
    API_ENDPOINTS.admin.studentAccounts,
    { params: compactParams(params), paramsSerializer: { indexes: null } }, // sort=a,asc&sort=b,desc
  )
  return toSpringPage(res.data.data, params)
},

getStudentAccountDetail: async (publicId: string): Promise<StudentAccountDetail> => {
  const res = await apiClient.get<ApiResponse<StudentAccountDetail>>(
    API_ENDPOINTS.admin.studentAccountDetail(publicId),
  )
  return res.data.data
},

/** Trả về message BE để FE toast (xóa hẳn hay chỉ khóa) */
deleteStudentAccount: async (publicId: string): Promise<string> => {
  const res = await apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.admin.studentAccountDetail(publicId))
  return res.data.message ?? 'Xóa tài khoản sinh viên thành công'
},
```

### 7.3 Hooks (`hooks/useAccounts.ts`)

```ts
export const ACCOUNT_KEYS = {
  // ...
  studentList: (params: StudentAccountListParams) => [...ACCOUNT_KEYS.all, 'students', params] as const,
  studentDetail: (publicId: string) => [...ACCOUNT_KEYS.all, 'students', 'detail', publicId] as const,
}

export function useStudentAccounts(params: StudentAccountListParams) {
  return useQuery({
    queryKey: ACCOUNT_KEYS.studentList(params),
    queryFn: () => accountService.getStudentAccounts(params),
    placeholderData: keepPreviousData,
  })
}

export function useStudentAccountDetail(publicId: string | null) {
  return useQuery({
    queryKey: ACCOUNT_KEYS.studentDetail(publicId ?? ''),
    queryFn: () => accountService.getStudentAccountDetail(publicId!),
    enabled: Boolean(publicId),
  })
}

export function useDeleteStudentAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (publicId: string) => accountService.deleteStudentAccount(publicId),
    onSuccess: (message) => {
      toast.success(message)
      queryClient.invalidateQueries({ queryKey: ACCOUNT_KEYS.all })
    },
    // Lỗi: interceptor đã toast; vẫn tải lại để bỏ dòng đã bị xóa ở nơi khác
    onError: () => queryClient.invalidateQueries({ queryKey: ACCOUNT_KEYS.all }),
  })
}
```

### 7.4 Trong `AccountListView` (trang Sinh viên)

```ts
const { data, isLoading } = useStudentAccounts({
  keyword: debouncedSearch.trim() || undefined,
  batch: selectedBatch || undefined,
  majorId: selectedMajor || undefined, // publicId ngành
  status: selectedStatus === '' ? undefined : selectedStatus === 'true',
  page: currentPage - 1,
  size: PAGE_SIZE,
})
// data.content → bảng, data.totalElements → totalCount, data.totalPages → phân trang
```

Trang Giảng viên vẫn dùng mock như cũ cho tới khi có API riêng.

---

## 8. Checklist nối API

- [ ] Thêm endpoint `admin.studentAccounts`, `admin.studentAccountDetail`, `admin.studentBatchAll`
- [ ] Thêm types `StudentAccountItem`, `StudentAccountDetail`, `StudentAccountListParams`
- [ ] Service + hook `useStudentAccounts`, `useStudentAccountDetail`, `useDeleteStudentAccount`
- [ ] Dropdown Bộ môn dùng `publicId` làm value
- [ ] Bảng: cột Họ và tên có email bên dưới; cột Thao tác 2 icon bút chì / thùng rác
- [ ] Phân trang phía server (`page` 0-based), STT liên tục qua các trang
- [ ] Bấm dòng → popup chi tiết gọi `GET /student/account/{publicId}`
- [ ] Trạng thái loading / rỗng ("Không tìm thấy tài khoản phù hợp với điều kiện tìm kiếm.")
- [ ] Thùng rác: `stopPropagation`, dialog xác nhận, gọi `DELETE /student/account/{publicId}`, toast đúng message BE, tải lại danh sách (Mục 6.2)
- [ ] Bút chì: dialog sửa có dropdown Ngành + công tắc trạng thái, gọi `PUT /student/account/{publicId}`, xử lý `1103`, `3014`, `3033` (Mục 6.1)
- [ ] Nút Xuất Excel gọi `GET /student/account/export` với đúng bộ lọc đang chọn (Mục 9)
- [ ] Nút Thêm sinh viên gọi `POST /student/account`, xử lý `3014` (Mục 10.1)
- [ ] Nút Import file gọi `POST /student/account/import`, hiển thị kết quả theo dòng (Mục 10.2)

---

## 9. Xuất Excel – `GET /student/account/export`

Quyền `VIEW_ACCOUNT`. Nhận **đúng bộ lọc** của `GET /student/account`: `keyword`, `batch`, `majorId`, `status`, `sort`
(cùng whitelist, sai → `400 1008`). **Không** nhận `page` / `size`: xuất toàn bộ dòng khớp lọc.

```
GET /student/account/export?keyword=đức&batch=K65&majorId=0192f3a1-...&status=true&sort=name,asc
```

- Thành công: HTTP 200, body là file `.xlsx` (**không** bọc `APIResponse`),
  `Content-Disposition: attachment; filename="danh_sach_tai_khoan_sinh_vien.xlsx"`.
- Cột: STT, Mã sinh viên, Họ tên, Email, Lớp, Khóa, Ngành, Trạng thái tài khoản ("Hoạt động" / "Không hoạt động").
- Gọi với `responseType: 'blob'`; lỗi trả JSON trong blob → đọc `await blob.text()` rồi `JSON.parse` nếu cần hiện message.

```ts
exportStudentAccounts: async (params: Omit<StudentAccountListParams, 'page' | 'size'>): Promise<Blob> => {
  const res = await apiClient.get(API_ENDPOINTS.admin.studentAccountExport, {
    params: compactParams(params), paramsSerializer: { indexes: null }, responseType: 'blob',
  })
  return res.data
},
```

---

## 10. Thêm / Import – chỉ tạo tài khoản

Quyền `CREATE_ACCOUNT`. Admin **chỉ tạo tài khoản** sinh viên (role `STUDENT`, trạng thái Hoạt động):
không gắn vào học kì nào, không tạo đề tài, không cần có học kì hiện tại (không có lỗi `3023`, `3024`, `3025`, `3030`).
Sinh viên đã có (trùng mã SV / email / SĐT) → **báo lỗi**, Admin không cập nhật được qua luồng này (muốn sửa thì dùng bút chì).

### 10.1 `POST /student/account` – thêm thủ công

Body giống `POST /student` của Trưởng bộ môn (`StudentCreationRequest`, **không** có `accountStatus`):

```json
{
  "studentCode": "2251172489",
  "firstName": "Lê Trung",
  "lastName": "Đức",
  "email": "2251172489@gmail.com",
  "phone": "0911111111",
  "batch": "K64",
  "className": "64KTPM1",
  "major": "Kỹ thuật phần mềm"
}
```

| Tình huống                                     | HTTP | code | message                                                                              |
| :--------------------------------------------- | :--- | :--- | :----------------------------------------------------------------------------------- |
| Tạo mới                                        | 200  | 1000 | Tạo tài khoản sinh viên thành công                                                   |
| Lỗi định dạng (1 lỗi / ≥ 2 lỗi), ngành không có | 400  | 4000 | Message lỗi cụ thể / `<các trường> không hợp lệ, vui lòng kiểm tra lại`              |
| Trùng mã SV / email / SĐT với tài khoản đã có   | 409  | 3014 | `<Mã sinh viên, Email, Số điện thoại> trùng với tài khoản đã tồn tại trong hệ thống` |

Thành công → toast xanh, đóng dialog, `invalidateQueries(ACCOUNT_KEYS.all)`; lỗi → hiện `message` ở đầu form.

### 10.2 `POST /student/account/import` – import file

`multipart/form-data`, chỉ part **`file`**, **cùng file mẫu** với import của Trưởng bộ môn.
Lưu một phần: dòng hợp lệ vẫn được tạo. Luôn trả HTTP 200, `code 1000`, message "Xử lý file import hoàn tất",
`data` = `StudentImportResponse` (cùng type với Trưởng bộ môn, xem `readme.md/department/api_addStudent.md` Mục 6.1).

- Mỗi dòng: `SUCCESS` ("Tạo tài khoản sinh viên thành công") hoặc `ERROR` (lỗi định dạng, trùng trong file, trùng với DB).
  Luồng Admin **không có `WARNING`** (`warningCount` luôn 0).
- Lỗi mức toàn file (file rỗng, sai định dạng, sai tiêu đề...): HTTP 400, `code 4000` như Trưởng bộ môn.
- Dòng lỗi có thể sửa ngay trên bảng kết quả rồi gửi lại từng dòng qua `POST /student/account` (Mục 10.1).
- Xong → `invalidateQueries(ACCOUNT_KEYS.all)` để bảng hiện tài khoản mới.
