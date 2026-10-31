# Quản lý sinh viên (Trưởng bộ môn) – Đặc tả giao diện & API

> Ban đầu file này là **brief giao cho phiên chat khác** làm frontend; nay đã cập nhật theo code thực tế
> (`src/features/department/student_management/`). Đọc kèm `AGENTS.md` và các skill
> `create-feature`, `connect-api`, `build-form`, `verify-changes`.
> Hợp đồng API lấy từ backend Spring Boot (`tlu_gpms_system`); tài liệu nghiệp vụ gốc ở
> `Do_An_Fall26/readme.md/case_execution/addStudent_TBM.md` (Mục 6.2 – 6.5, 7.1).

---

## 0. Thay đổi phía BE so với bản FE đang dùng (cần sửa FE)

| #   | Thay đổi                                                                                                                                                | Ảnh hưởng tới FE                                                           |
| :-- | :------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------- |
| 1   | Danh sách sinh viên giờ **theo học kì**: mỗi dòng ứng với 1 đề tài (`thesis_topic`) của kì đang chọn. Sinh viên không có đề tài trong kì thì không hiện | Thêm bộ lọc **Năm học** + **Học kì**, gửi `semesterId`                     |
| 2   | Bỏ `Student.status` (đang hoạt động / đã tắt). Field `status: boolean` trong list và detail **không còn**                                               | Bỏ badge "Đang hoạt động / Đã tắt", bỏ bộ lọc `ACTIVE / INACTIVE / ALL`    |
| 3   | `status` trên list giờ là **trạng thái đồ án** (chuỗi enum) + `statusLabel` (tiếng Việt)                                                                | Bộ lọc Trạng thái dùng danh sách giai đoạn ở Mục 4.1.3                     |
| 4   | List trả thêm `batch`, `topicName`, `lecturerName`, `coLecturerName`, `statusLabel`, `accountStatus`                                                    | Bảng đổi cột: Họ và tên · Lớp / Khóa · Bộ môn · Đề tài · GVHD · Trạng thái |
| 5   | Có API danh sách khóa `GET /student/batch`                                                                                                              | Bỏ mảng tĩnh `BATCH_OPTIONS` (K62 → K66)                                   |
| 6   | Sort thêm key `batch`                                                                                                                                   |                                                                            |
| 7   | API `PATCH /student/{publicId}/activate` **đã xóa**                                                                                                     | Bỏ endpoint `activate`, bỏ nút "Kích hoạt"                                 |
| 8   | `POST /student`, `POST /student/import` **không nhận học kì**: BE tự thêm sinh viên vào năm học + học kì hiện tại                                      | **Không** gửi `semesterId`; chưa có học kì hiện tại → BE trả `409 3030`    |
| 9   | Thêm `PUT /student/{publicId}` (sửa) và `DELETE /student/{publicId}?semesterId=` (xóa SV import nhầm)                                                   | Đã nối (Mục 6.4, 6.5)                                                      |
| 10  | Mã lỗi trùng dữ liệu gộp về `3014` (thay `3004`, `3005`, `3010`, `3011`)                                                                                | FE chỉ hiện `message`, không cần đổi logic                                 |
| 11  | Phạm vi ngành **chỉ áp cho thao tác ghi**: mọi Trưởng ngành xem được sinh viên **mọi ngành** (danh sách, popup, khóa, export)                          | Bộ lọc Bộ môn hiện đủ ngành; nút Sửa / Xóa với SV ngành khác sẽ bị BE trả `403 3032` (Mục 3) |
| 12  | Có API xuất Excel `GET /student/export` (cùng bộ lọc với `GET /student`)                                                                               | Đã nối popup Export (Mục 4.6, 5.4)                                         |
| 13  | Có API tất cả khóa `GET /student/batch/all` (không theo học kì)                                                                                         | Chưa nối; thêm `batchAll` vào endpoints khi cần dropdown khóa không phụ thuộc học kì (Mục 4.2) |
| 14  | Body `PUT /student/{publicId}` **bỏ `major`** (không đổi ngành, không còn lỗi `3018`), **thêm `accountStatus`** (khóa / mở khóa); lỗi mới `3031` | Đã làm: ô Bộ môn chỉ đọc, có ô bật/tắt tài khoản (Mục 6.4) |
| 15  | Sửa / xóa SV ngành khác đổi từ `404 3008` "Sinh viên không tồn tại" sang **`403 3032`** "Bạn không có quyền thao tác với sinh viên không thuộc ngành phụ trách"; `3008` chỉ còn cho SV không có | FE chỉ hiện `message`; nếu có xử lý riêng theo HTTP 404 khi sửa / xóa thì xét thêm 403 (Mục 3, 6.4, 6.5) |
| 16  | Body `PUT /student/{publicId}` **bỏ `accountStatus`** (thay đổi #14 đã hủy một phần): form Sửa không còn khóa / mở khóa tài khoản; **xóa mã lỗi `3031`** | ✅ Đã làm: bỏ ô bật/tắt "Được đăng nhập" khỏi form Sửa, bỏ `accountStatus` khỏi schema / payload, bỏ xử lý `3031` (Mục 6.4) |

---

## 1. Trạng thái hiện tại

| #   | Việc                                                                   | Trạng thái                                                       |
| :-- | :--------------------------------------------------------------------- | :--------------------------------------------------------------- |
| 1   | Trang danh sách sinh viên: bảng, tìm kiếm, bộ lọc, sắp xếp, phân trang | 🔄 Cần sửa theo Mục 4.1 (cột + bộ lọc mới)                       |
| 2   | Bấm 1 dòng → popup "Thông tin sinh viên"                               | 🔄 Cần sửa: `status` → `accountStatus` (Mục 4.5)                 |
| 3   | Nút **Import file** → popup, kết quả theo tab, sửa & gửi lại dòng lỗi  | 🔄 Hiện học kì hiện tại, xử lý `1102`, `3023` – `3025`, `3030`   |
| 4   | Nút **Thêm sinh viên** → popup form                                    | 🔄 Hiện học kì hiện tại, xử lý `1102`, `3023` – `3025`, `3030`   |
| 5   | Nút **Export file** → popup                                            | ✅ Đã nối `GET /student/export` (Mục 4.6)                        |
| 6   | Sửa sinh viên                                                          | ✅ Đã nối `PUT /student/{publicId}` (Mục 6.4)                    |
| 7   | Xóa sinh viên import nhầm khỏi học kì                                  | ✅ Đã nối `DELETE /student/{publicId}?semesterId=` (Mục 6.5)     |
| 8   | Tải file mẫu import                                                    | ⏳ Chưa làm – BE chưa có API tải file mẫu                        |

---

## 2. Vị trí code & route

- URL: **`/department/student-management`** (menu "Quản lý sinh viên" trong `departmentNav.config.ts`,
  route `path: 'student-management'` trong `src/app/routes/department.routes.tsx`, nạp page bằng `lazy()` + `withSuspense(...)`).

```
student_management/
├── types.ts                         # StudentListItem, StudentDetail, MajorOption, SemesterOption, StudentListParams,
│                                    # StudentCreationRequest, StudentWriteResult, StudentImportResponse...
├── services/student.service.ts      # getStudents, getStudentDetail, getMajors, getBatches, getSemesters,
│                                    # importStudents, createStudent, updateStudent, deleteStudent
├── hooks/useStudents.ts             # departmentStudentKeys, majorKeys, useStudents, useStudentDetail, useMajors,
│                                    # useBatches, useSemesters, useImportStudents, useCreateStudent...
├── utils/
│   ├── studentFilters.ts            # DEFAULT_STUDENT_FILTERS, STUDENT_STATUS_OPTIONS, hasActiveFilters, mô tả bộ lọc
│   ├── studentTable.ts              # getNextSort (asc → desc → bỏ), getPageItems (nút số trang)
│   ├── createStudentSchema.ts       # schema zod form sinh viên, STUDENT_EMAIL_DOMAIN
│   └── importResult.ts              # đếm/chọn tab kết quả import, đổi dòng lỗi → giá trị form, cập nhật dòng sau khi gửi lại
├── components/
│   ├── StudentToolbar.tsx           # tìm kiếm + bộ lọc
│   ├── StudentTable.tsx             # bảng + sort header + phân trang
│   ├── StudentStatusBadge.tsx       # badge trạng thái đồ án (theo status / statusLabel)
│   ├── StudentDetailDialog.tsx      # popup "Thông tin sinh viên"
│   ├── ImportStudentDialog.tsx      # popup import
│   ├── FileDropZone.tsx             # khung chọn/kéo-thả file
│   ├── StudentImportResult.tsx      # kết quả import theo tab Lỗi / Cảnh báo / Thành công
│   ├── RetryImportRowForm.tsx       # form sửa 1 dòng lỗi rồi gửi lại qua POST /student
│   ├── StudentFormFields.tsx        # 8 ô nhập dùng chung (popup Thêm / Sửa + form sửa dòng lỗi)
│   ├── CreateStudentDialog.tsx      # popup Thêm sinh viên
│   └── ExportStudentDialog.tsx      # popup export (UI)
├── pages/StudentManagementPage.tsx  # export default
└── index.ts                         # export types + hooks (không export page)
```

Endpoint trong `src/shared/api/endpoints.ts` (key `student` đang dùng cho portal sinh viên nên đặt nhóm riêng):

```ts
departmentStudent: {
  base: '/student',                                     // GET danh sách · POST thêm thủ công
  detail: (publicId: string) => `/student/${publicId}`, // GET chi tiết · PUT sửa · DELETE xóa
  import: '/student/import',
  export: '/student/export',                            // tải file Excel danh sách
  batch: '/student/batch',                              // dropdown Khóa theo học kì
  // batchAll: '/student/batch/all'                     // chưa thêm: tất cả khóa (không theo học kì), Mục 4.2
  // activate: đã xóa (BE bỏ API kích hoạt)
},
major: { base: '/major' },
semester: { base: '/semester', current: '/semester/current' },
```

---

## 3. Quy ước chung của backend

- Mọi response: `{ code, message?, data? }`. BE bật `@JsonInclude(NON_NULL)` nên **`message` có thể không có**
  (API GET thường chỉ có `code` + `data`), **`data` không có** ở API ghi.
- `code = 1000`: thành công.
- **Dải `11xx` (HTTP 200): thành công kèm cảnh báo** (`1101`, `1102`, `1103`). Interceptor không reject mà tự hiện toast vàng
  (tắt bằng `{ skipWarningToast: true }`).
- Lỗi: HTTP 4xx/5xx kèm `code` nghiệp vụ → interceptor đã tự toast đỏ, component không toast lại.
  Request gọi từ form dùng `{ skipErrorToast: true }` để hiện lỗi ngay trong form.
- Quyền: BE kiểm tra theo **permission** (gán cho role `ADMIN` / `HEAD_OF_MAJOR`), không đủ quyền → `403`, `code 2001`:

  | Permission       | API                                                                                     |
  | :--------------- | :-------------------------------------------------------------------------------------- |
  | `VIEW_STUDENT`   | `GET /student`, `GET /student/{publicId}`, `GET /student/batch`, `GET /student/batch/all` |
  | `EXPORT_STUDENT` | `GET /student/export`                                                                   |
  | `IMPORT_STUDENT` | `POST /student/import`, `POST /student`, `PUT /student/{publicId}`, `DELETE /student/{publicId}` |

- **Phạm vi ngành chỉ áp cho thao tác ghi:**
  - **Xem** (danh sách, popup chi tiết, khóa, export): mọi Trưởng ngành thấy sinh viên của **mọi ngành**; muốn xem 1 ngành thì chọn Bộ môn (`majorId`).
  - **Ghi** (import, thêm, sửa, xóa): chỉ với ngành mình phụ trách. Ngành ngoài phạm vi khi import / thêm → `403 3018`;
    sửa / xóa sinh viên ngành khác → `403 3032` "Bạn không có quyền thao tác với sinh viên không thuộc ngành phụ trách".
  - BE **chưa có** API trả "các ngành tôi phụ trách", nên FE chưa ẩn được nút Sửa / Xóa theo ngành; hiện cứ hiện nút và để BE chặn.
- Không expose `id` số, chỉ dùng `publicId` (UUID string).

---

## 4. API đọc dữ liệu

### 4.1. `GET /student` – Danh sách sinh viên theo học kì

#### 4.1.1. Cột trên bảng ↔ field BE trả về

```
┌─────┬──────────────────┬───────────────┬────────────────────┬──────────────────────┬────────────────────────┬──────────────────────┐
│ STT │ Họ và tên ↕      │ Lớp / Khóa ↕  │ Bộ môn ↕           │ Đề tài               │ GVHD                   │ Trạng thái           │
├─────┼──────────────────┼───────────────┼────────────────────┼──────────────────────┼────────────────────────┼──────────────────────┤
│  1  │ Lê Trung Đức     │ 63KTPM1       │ Kỹ thuật phần mềm  │ Hệ thống quản lý     │ ThS. Nguyễn Văn A      │ ● Đã phân công GVHD  │
│     │ 2251172489       │ K63           │                    │ đồ án tốt nghiệp     │ TS. Trần Thị B         │                      │
└─────┴──────────────────┴───────────────┴────────────────────┴──────────────────────┴────────────────────────┴──────────────────────┘
```

| Cột                      | Field                                                                  | Cách hiển thị                                                                                                                                       |
| :----------------------- | :--------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| _(ẩn)_                   | `publicId`                                                             | `publicId` sinh viên, dùng mở popup chi tiết / sửa / xóa                                                                                            |
| **Họ và tên**            | `name` (dòng trên, đậm) + `studentCode` (dòng dưới, chữ nhỏ xám)       | `name` = Họ + Tên đã ghép sẵn. **Mã sinh viên nằm ngay dưới tên**, không còn cột Mã SV riêng                                                        |
| **Lớp / Khóa**           | `className` (dòng trên) + `batch` (dòng dưới, chữ nhỏ xám)             | Ví dụ `63KTPM1` / `K63`                                                                                                                             |
| **Bộ môn**               | `majorName`                                                            | Tên ngành; `null` → "—"                                                                                                                             |
| **Đề tài**               | `topicName`                                                            | `null` khi chưa chốt tên đề tài (trước Giai đoạn 2) → hiện "Chưa có đề tài" (chữ xám nghiêng). Tên dài: `line-clamp-2` + `title` để xem đủ          |
| **GVHD**                 | `lecturerName` (dòng trên) + `coLecturerName` (dòng dưới, nếu có)      | Đã kèm học hàm học vị (VD `ThS. Nguyễn Văn A`). `lecturerName = null` → "Chưa phân công" (chữ xám). `coLecturerName = null` → không hiện dòng thứ 2 |
| **Trạng thái**           | `statusLabel` (chữ hiển thị) + `status` (mã enum, dùng chọn màu badge) | Bảng màu ở Mục 4.1.3                                                                                                                                |
| _(không hiện trên bảng)_ | `accountStatus`                                                        | `true` được đăng nhập, `false` tài khoản bị khóa đăng nhập. Có thể hiện icon khóa nhỏ cạnh tên khi `false` (tùy chọn)                               |

Một phần tử trong `content`:

```json
{
  "publicId": "0192f3a1-7c2e-7b4d-9a10-3f5e2d1c0b9a",
  "studentCode": "2251172489",
  "name": "Lê Trung Đức",
  "className": "63KTPM1",
  "batch": "K63",
  "majorName": "Kỹ thuật phần mềm",
  "lecturerName": "ThS. Nguyễn Văn A",
  "status": "STAGE_1_ADVISOR_ASSIGNED",
  "statusLabel": "Đã phân công GVHD",
  "accountStatus": true
}
```

> BE bật `NON_NULL` nên field `null` (`topicName`, `lecturerName`, `coLecturerName`, `majorName`) **không có** trong JSON
> (ví dụ trên: chưa có đề tài, không có GV đồng hướng dẫn). FE khai báo các field này là optional và đọc bằng `?? null`.

```ts
export type StudentThesisStatus =
  | "STAGE_1_REGISTERING_ADVISOR"
  | "STAGE_1_ADVISOR_ASSIGNED"
  | "STAGE_2_TOPIC_CONFIRMED"
  | "STAGE_3_OUTLINE_APPROVED"
  | "STAGE_4_REPORT_APPROVED"
  | "STAGE_5_REVIEW_PASSED"
  | "STAGE_6_DEFENSE_COMPLETED"
  | "DISQUALIFIED"
  | "CANCELLED";

export interface StudentListItem {
  publicId: string;
  studentCode: string;
  name: string; // Họ + Tên, đã ghép sẵn
  className: string;
  batch: string;
  majorName?: string | null;
  topicName?: string | null; // không có: chưa chốt tên đề tài
  lecturerName?: string | null; // không có: chưa phân công GVHD
  coLecturerName?: string | null; // không có: không có GV đồng hướng dẫn
  status: StudentThesisStatus;
  statusLabel: string;
  accountStatus: boolean;
}
```

#### 4.1.2. Query params (bộ lọc)

| Param        | Kiểu             | Ý nghĩa                                                                                                                   | Ví dụ                                   |
| :----------- | :--------------- | :------------------------------------------------------------------------------------------------------------------------ | :-------------------------------------- |
| `semesterId` | UUID             | `publicId` học kì (lấy từ `GET /semester`, Mục 4.3). **Bỏ trống → học kì hiện tại**; chưa có học kì hiện tại → trang rỗng | `0192f3a1-...`                          |
| `keyword`    | string           | Tìm gần đúng, không phân biệt hoa/thường, theo **mã SV**, **họ tên đầy đủ** hoặc **email**. BE tự trim, gộp khoảng trắng  | `2251172489`, `trung đức`, `@gmail.com` |
| `batch`      | string           | Khóa, khớp chính xác, BE tự viết hoa (`k63` → `K63`). Giá trị lấy từ `GET /student/batch`                                 | `K63`                                   |
| `majorId`    | UUID             | Bộ môn: `publicId` của ngành lấy từ `GET /major`                                                                          | `0192f3a1-...`                          |
| `status`     | string           | Trạng thái đồ án: 1 giá trị trong Mục 4.1.3. Không phân biệt hoa/thường. Không gửi → tất cả                               | `STAGE_2_TOPIC_CONFIRMED`, `CANCELLED`  |
| `page`       | number           | Trang, **bắt đầu từ 0**                                                                                                   | `0`                                     |
| `size`       | number           | Mặc định **15**                                                                                                           | `15`                                    |
| `sort`       | string, lặp được | `field,asc\|desc`. Chỉ nhận: **`studentCode`, `name`, `className`, `batch`, `majorName`**                                 | `sort=name,asc`                         |

- **Năm học không phải param của BE.** FE tự gom từ danh sách học kì (`academicYear`) rồi gửi `semesterId` của học kì đã chọn (Mục 5.1).
- Không gửi param rỗng (`keyword=`): service bỏ hẳn key khi giá trị rỗng/`undefined` (`compactParams`).
- `sort=name` sắp theo **Tên rồi Họ** (thói quen tra danh sách tiếng Việt).
- Không gửi `sort`: BE tự sắp — sinh viên mới thêm vào kì lên trước.
- axios mặc định serialize mảng thành `sort[]=...` → **sai với Spring**. Service dùng
  `paramsSerializer: { indexes: null }` (ra `sort=a,asc&sort=b,desc`).

```ts
export type StudentSortField =
  | "studentCode"
  | "name"
  | "className"
  | "batch"
  | "majorName";

export interface StudentListParams {
  semesterId?: string;
  keyword?: string;
  batch?: string;
  majorId?: string;
  status?: StudentThesisStatus;
  page: number;
  size: number;
  sort?: `${StudentSortField},${"asc" | "desc"}`;
}
```

#### 4.1.3. Giá trị bộ lọc Trạng thái & màu badge

Cột Trạng thái BE ghép từ 2 nguồn: đề tài bị **đình chỉ / hủy** → lấy trạng thái đề tài; còn lại → lấy **giai đoạn** đồ án.
Lọc theo 1 giai đoạn chỉ trả các đề tài đang ở giai đoạn đó **và chưa** bị đình chỉ / hủy.

| `status` (giá trị gửi lên / nhận về) | `statusLabel`                            | Badge gợi ý        |
| :----------------------------------- | :--------------------------------------- | :----------------- |
| `STAGE_1_REGISTERING_ADVISOR`        | Đang đăng ký GVHD                        | xám `slate`        |
| `STAGE_1_ADVISOR_ASSIGNED`           | Đã phân công GVHD                        | xanh dương `blue`  |
| `STAGE_2_TOPIC_CONFIRMED`            | Đã chốt tên đề tài                       | xanh dương `blue`  |
| `STAGE_3_OUTLINE_APPROVED`           | Đã duyệt đề cương                        | chàm `indigo`      |
| `STAGE_4_REPORT_APPROVED`            | Đã duyệt báo cáo                         | chàm `indigo`      |
| `STAGE_5_REVIEW_PASSED`              | Đạt phản biện                            | tím `violet`       |
| `STAGE_6_DEFENSE_COMPLETED`          | Đã bảo vệ hội đồng                       | xanh lá `green`    |
| `DISQUALIFIED`                       | Bị đình chỉ / Không đủ điều kiện đi tiếp | đỏ `red`           |
| `CANCELLED`                          | Đã hủy                                   | đỏ nhạt / xám gạch |

- Option đầu của dropdown: "Tất cả trạng thái" (không gửi `status`).
- Danh sách option FE khai báo tĩnh (`STUDENT_STATUS_OPTIONS`) theo đúng bảng trên. Badge hiển thị **`statusLabel` của BE**
  (không tự map lại chữ), chỉ dùng `status` để chọn màu; `status` lạ → màu xám.

**Response `data`:** danh sách phân trang. Spring có thể trả **một trong hai dạng**:

```jsonc
// Page<T> dạng phẳng
{ "content": [ ... ], "totalElements": 1, "totalPages": 1, "number": 0, "size": 15,
  "numberOfElements": 1, "first": true, "last": true, "empty": false }

// PagedModel<T> (Spring Data 3.3+, pageSerializationMode = VIA_DTO)
{ "content": [ ... ], "page": { "size": 15, "number": 0, "totalElements": 1, "totalPages": 1 } }
```

Service khai báo `ApiResponse<RawSpringPage<StudentListItem>>` và trả `toSpringPage(res.data.data, params)`
(`@/shared/utils`) để đưa cả hai dạng về `SpringPage<StudentListItem>`.

**Lỗi:**

| Trường hợp                                   | HTTP | `code` | Message                     |
| :------------------------------------------- | :--- | :----- | :-------------------------- |
| `status` không thuộc bảng Mục 4.1.3          | 400  | 3026   | Trạng thái lọc không hợp lệ |
| `sort` ngoài 5 key trên (ví dụ `sort=email`) | 400  | 1008   | Trường sắp xếp không hợp lệ |
| `semesterId` / `majorId` không phải UUID     | 400  | 1006   | Yêu cầu không hợp lệ        |

### 4.2. `GET /student/batch` – Dropdown Khóa

| Param        | Ý nghĩa                                                               |
| :----------- | :-------------------------------------------------------------------- |
| `semesterId` | Học kì đang chọn (bỏ trống → kì hiện tại; chưa có kì hiện tại → `[]`) |
| `majorId`    | Tùy chọn, gửi khi đã chọn Bộ môn để chỉ ra khóa của ngành đó          |

```json
{ "code": 1000, "data": ["K63", "K64"] }
```

- Chỉ gồm các khóa **đang có sinh viên có đề tài trong kì**, không trùng, sắp tăng dần.
- **Không lọc theo phạm vi ngành** (giống `GET /student`): ra khóa của sinh viên mọi ngành, chỉ thu hẹp khi gửi `majorId`.
- Query key phụ thuộc `semesterId` + `majorId`: đổi học kì / bộ môn → gọi lại. Nếu khóa đang chọn không còn trong danh sách mới → reset về "Tất cả khóa".

**Tất cả khóa trong hệ thống – `GET /student/batch/all`**

- Không có param. Trả mọi `batch` của **tất cả sinh viên trong DB**, không trùng, bỏ giá trị rỗng, sắp tăng dần.
- **Không** theo học kì, **không** lọc ngành.

```json
{ "code": 1000, "data": ["K62", "K63", "K64"] }
```

- Dùng khi cần dropdown khóa không phụ thuộc học kì đang chọn. Dropdown Khóa trên bộ lọc danh sách vẫn dùng `GET /student/batch`
  (để không hiện khóa không có sinh viên trong kì). Có thể cache lâu (`referenceDataQueryOptions`), invalidate sau import / thêm / sửa.

### 4.3. `GET /semester` – Dropdown Năm học & Học kì

Dùng chung API của feature học kì (quyền `VIEW_SEMESTER`).

| Param               | Ý nghĩa                                                      |
| :------------------ | :----------------------------------------------------------- |
| `page`, `size`      | Mặc định `0`, `10`. FE gọi `size=100` để lấy đủ cho dropdown |
| `sortBy`, `sortDir` | Mặc định `startDate`, `DESC` (học kì mới nhất lên đầu)       |
| `keyword`, `status` | Không cần dùng ở màn này                                     |

Response `data` là `PageResponse` (**khác** dạng `Page` của `/student`: dùng `page` thay cho `number`, không có `first`/`last`):

```json
{
  "code": 1000,
  "data": {
    "totalElements": 2,
    "totalPages": 1,
    "page": 0,
    "size": 100,
    "content": [
      {
        "publicId": "0192f3a1-...",
        "name": "Học kỳ 1 năm học 2026-2027",
        "academicYear": "2026-2027",
        "term": "Học kỳ 1",
        "startDate": "01-08-2026",
        "endDate": "31-01-2027",
        "status": "Đang diễn ra",
        "statusCode": "ONGOING"
      }
    ]
  }
}
```

```ts
export interface SemesterOption {
  publicId: string;
  name: string;
  academicYear: string; // "2026-2027"
  term: string; // "Học kỳ 1"
  startDate: string; // dd-MM-yyyy
  endDate: string;
  status: string; // "Chưa bắt đầu" | "Đang diễn ra" | "Kết thúc"
  statusCode: "UPCOMING" | "ONGOING" | "COMPLETED";
}
```

- Học kì mặc định khi mở trang: `GET /semester/current` (trả 1 `SemesterOption`) → chọn sẵn Năm học + Học kì theo kết quả này.
- Dùng `publicId` làm `semesterId` (bỏ qua field `id`).

### 4.4. `GET /major` – Dropdown Bộ môn

Không có param. `data` là mảng, BE đã sắp theo tên ngành. Hook `useMajors` cache lâu (`referenceDataQueryOptions`).

```json
{
  "code": 1000,
  "data": [
    { "publicId": "0192f3a1-...", "code": "KTPM", "name": "Kỹ thuật phần mềm" }
  ]
}
```

```ts
export interface MajorOption {
  publicId: string;
  code: string;
  name: string;
}
```

### 4.5. `GET /student/{publicId}` – Chi tiết (popup)

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
    "accountStatus": true
  }
}
```

```ts
export interface StudentDetail {
  publicId: string;
  studentCode: string;
  name: string;
  email: string;
  phone?: string | null;
  majorName?: string | null;
  className: string;
  batch: string;
  accountStatus: boolean; // thay cho status cũ
}
```

> Detail **không** kế thừa `StudentListItem` nữa (list có field theo học kì, detail thì không).

| Lỗi                                             | HTTP | `code` | Message                 |
| :---------------------------------------------- | :--- | :----- | :---------------------- |
| `publicId` sai định dạng hoặc không có trong DB | 404  | 3008   | Sinh viên không tồn tại |

- Xem được chi tiết sinh viên **mọi ngành** (không giới hạn ngành phụ trách).

### 4.6. `GET /student/export` – Xuất Excel danh sách

- Param **giống hệt** `GET /student` (Mục 4.1.2): `semesterId`, `keyword`, `batch`, `majorId`, `status`, `sort` (lặp được, cùng whitelist 5 key).
  **Không** có `page` / `size`: xuất toàn bộ kết quả khớp bộ lọc. Gửi đúng bộ lọc + sort đang chọn trên màn hình.
- Không lọc theo phạm vi ngành (giống danh sách). Quyền `EXPORT_STUDENT`.
- `semesterId` bỏ trống → học kì hiện tại; chưa có học kì hiện tại → file chỉ có dòng tiêu đề.
- **Ngoại lệ của quy ước `{ code, data }`:** thành công trả thẳng file, không bọc JSON:
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename="danh_sach_sinh_vien.xlsx"`
- Sheet "Danh sách sinh viên", các cột: STT · Mã sinh viên · Họ tên · Lớp · Khóa · Ngành · Tên đề tài · Giáo viên hướng dẫn ·
  Giáo viên đồng hướng dẫn · Trạng thái · Trạng thái tài khoản ("Đang hoạt động" / "Bị khóa").

- FE đã nối: `studentService.exportStudents` gọi với `responseType: 'blob'`, `paramsSerializer: { indexes: null }`,
  timeout 2 phút; lấy tên file từ `Content-Disposition` (`getFilenameFromDisposition`, BE đã expose header này qua CORS),
  không đọc được thì dùng tên dự phòng. `useExportStudents` lưu file bằng `saveBlob`.
- **Lỗi vẫn trả JSON** (`{ code, message }`) nhưng vì `responseType: 'blob'` nên body là `Blob`:
  interceptor đã tự đổi lại thành JSON (`parseJsonBlob`) trước khi toast, component không cần xử lý thêm.

| Lỗi                                      | HTTP | `code` | Message                     |
| :--------------------------------------- | :--- | :----- | :-------------------------- |
| `status` sai                             | 400  | 3026   | Trạng thái lọc không hợp lệ |
| `sort` ngoài whitelist                   | 400  | 1008   | Trường sắp xếp không hợp lệ |
| `semesterId` / `majorId` không phải UUID | 400  | 1006   | Yêu cầu không hợp lệ        |
| Không có quyền `EXPORT_STUDENT`          | 403  | 2001   |                             |

---

## 5. Giao diện

Dùng component sẵn có ở `@/shared/components/ui` (`Button`, `Input`, `Select`, `Table*`, `Dialog*`, `Tabs*`, `Badge`,
`Skeleton`, `FormField`), icon `lucide-react`, tông `slate` + `blue`. Toàn bộ chữ tiếng Việt có dấu.

Mọi popup dùng `Dialog` dùng chung: khi mở, trang nền bị khóa cuộn và được bù đúng bề rộng thanh cuộn.

### 5.1. Bố cục trang `/department/student-management`

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ Quản lý sinh viên                         [⬆ Import file] [⬇ Export file] [+ Thêm sinh viên] │
│ Danh sách sinh viên làm đồ án trong học kì.                                               │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ [Năm học ▾] [Học kì ▾]  [🔍 Tìm theo mã SV, họ tên hoặc email...]                          │
│ [Khóa ▾] [Bộ môn ▾] [Trạng thái ▾] [Xóa lọc]                                              │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ STT │ Họ và tên ↕ │ Lớp / Khóa ↕ │ Bộ môn ↕ │ Đề tài │ GVHD │ Trạng thái                   │
│  …  (xem Mục 4.1.1)                                                                       │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ Hiển thị 1–15 / 120 sinh viên                                   [‹] 1 2 3 … 8 [›]          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

**Bộ lọc:**

| Bộ lọc         | Nguồn option                                                            | Gửi lên BE                                   | Mặc định                                  |
| :------------- | :---------------------------------------------------------------------- | :------------------------------------------- | :---------------------------------------- |
| **Năm học**    | Các `academicYear` không trùng từ `GET /semester` (giữ thứ tự mới → cũ) | _Không gửi_ – chỉ để thu hẹp dropdown Học kì | Năm học của học kì hiện tại               |
| **Học kì**     | Các học kì thuộc năm học đã chọn, hiện `term` ("Học kỳ 1", "Học kỳ 2")  | `semesterId` = `publicId`                    | Học kì hiện tại (`GET /semester/current`) |
| **Khóa**       | `GET /student/batch?semesterId=&majorId=`, option đầu "Tất cả khóa"     | `batch`                                      | Tất cả                                    |
| **Bộ môn**     | `GET /major`, option đầu "Tất cả bộ môn"                                | `majorId`                                    | Tất cả                                    |
| **Trạng thái** | Tĩnh theo Mục 4.1.3, option đầu "Tất cả trạng thái"                     | `status`                                     | Tất cả                                    |
| Tìm kiếm       | Ô nhập, debounce 400 ms (`useDebounce`)                                 | `keyword`                                    | rỗng                                      |

- Đổi **Năm học** → tự chọn học kì đầu tiên (mới nhất) của năm đó; đổi Năm học / Học kì → reset Khóa (danh sách khóa phụ thuộc kì).
- Đổi **Bộ môn** → gọi lại `GET /student/batch` với `majorId`, khóa đang chọn không còn thì reset.
- Đổi bất kỳ filter hoặc sort nào → `page = 0`.
- "Xóa lọc": về keyword rỗng, Khóa / Bộ môn / Trạng thái = Tất cả, `page = 0`, bỏ sort. **Giữ nguyên** Năm học + Học kì.
  Chỉ hiện khi đang có filter khác mặc định.
- Chưa có học kì nào (`GET /semester` rỗng / `current` lỗi): vẫn gọi `GET /student` không có `semesterId`
  (BE trả trang rỗng) và hiện "Chưa có học kì nào".
- Học kì đang chọn có `statusCode = COMPLETED`: ẩn / disable nút "Xóa" (BE sẽ trả `3029`).
- "Import file" và "Thêm sinh viên" **luôn thêm vào học kì hiện tại** (BE tự xác định), không phụ thuộc học kì đang chọn trên bộ lọc.
  Chỉ disable khi chưa có học kì hiện tại (`GET /semester/current` lỗi); BE vẫn chặn bằng `409 3030`.
- State bộ lọc: `useState` trong page (chưa đồng bộ lên URL).

**Bảng:**

- STT = `number * size + index + 1` (lấy từ `SpringPage` đã chuẩn hóa).
- Cột bấm sort được: **Họ và tên** (`name`), **Lớp / Khóa** (`className`), **Bộ môn** (`majorName`). Lần 1 `asc`, lần 2 `desc`,
  lần 3 bỏ sort. Key `studentCode`, `batch` BE cũng nhận nếu sau này cần thêm menu sort phụ.
  Cột STT, Đề tài, GVHD, Trạng thái **không** sort được (BE trả `1008`).
- Nội dung từng cột theo Mục 4.1.1 (tên + mã SV 2 dòng; lớp + khóa 2 dòng; GVHD chính + đồng hướng dẫn 2 dòng).
- Cả dòng có `cursor-pointer` + hover nền `slate-50`; bấm dòng mở popup chi tiết. Hỗ trợ bàn phím: `tabIndex={0}`, Enter mở popup.
- Đang tải lần đầu: 15 dòng `Skeleton`. Đổi trang/filter: giữ dữ liệu cũ (`placeholderData: keepPreviousData`), làm mờ nhẹ.
- Rỗng: icon `Users` + "Không tìm thấy sinh viên phù hợp" (khi có filter) hoặc "Chưa có sinh viên nào trong học kì này" (khi không filter),
  kèm nút "Thêm sinh viên".
- Phân trang: "Hiển thị X–Y / totalElements sinh viên"; chỉ hiện nút khi `totalPages > 1`.

### 5.2. Popup "Thông tin sinh viên"

- Mở với `publicId` của dòng; `useStudentDetail(publicId)` (chưa có `publicId` → `skipToken`).
- Lưới 2 cột (label xám nhỏ, giá trị đậm):

  | Label         | Field                                                                                   |
  | :------------ | :-------------------------------------------------------------------------------------- |
  | Mã sinh viên  | `studentCode`                                                                           |
  | Họ và tên     | `name`                                                                                  |
  | Email         | `email` (link `mailto:`)                                                                |
  | Số điện thoại | `phone` (null → "—")                                                                    |
  | Bộ môn        | `majorName` (null → "—")                                                                |
  | Lớp           | `className`                                                                             |
  | Khóa          | `batch`                                                                                 |
  | Tài khoản     | `accountStatus`: `true` → "Được đăng nhập" (xanh) · `false` → "Bị khóa đăng nhập" (xám) |

- Khối "Đồ án học kì này": lấy luôn từ **dòng đang bấm** trên bảng (`topicName`, `lecturerName`, `coLecturerName`, `statusLabel`),
  không cần gọi thêm API.
- Đang tải: `Skeleton` theo lưới. Lỗi 404 (`3008`): interceptor đã toast, popup hiện "Không tải được thông tin sinh viên".
- Footer: "Xóa khỏi học kì" (Mục 6.5, chỉ hiện khi đủ điều kiện xóa) · "Sửa" (Mục 6.4) · "Đóng".

### 5.3. Popup Import file

- Như cũ (chỉ nhận `.xlsx`, tối đa 50MB, kết quả theo tab Lỗi / Cảnh báo / Thành công, sửa & gửi lại dòng lỗi).
- **Mới:** hiện dòng "Import vào: _Học kỳ 1 năm học 2026-2027_" lấy từ `GET /semester/current` (**không** phải học kì đang chọn
  trên bộ lọc). **Không** gửi `semesterId` (Mục 6.1); gửi lại dòng lỗi qua `POST /student` cũng không gửi.
- Xong import hoặc gửi lại thành công → `invalidateQueries(departmentStudentKeys.all)` (gồm cả danh sách khóa).

### 5.4. Popup Export file

- Đã nối `GET /student/export` (Mục 4.6). Chọn phạm vi: **theo bộ lọc đang chọn** (gửi `keyword`, `majorId`, `batch`, `status`)
  hoặc **toàn bộ** (bỏ các bộ lọc đó); cả hai đều gửi `semesterId` của học kì đang xem và `sort` đang chọn.
- Xuất ra sinh viên **mọi ngành** khớp bộ lọc (không giới hạn ngành phụ trách).

### 5.5. Popup Thêm sinh viên

Form theo skill `build-form` (`react-hook-form` + `zod`). 8 ô như cũ, **không** có học kì (BE tự thêm vào học kì hiện tại; có thể hiện dòng chữ "Thêm vào: _<học kì hiện tại>_"):

| Label            | Field         | Ràng buộc zod (trùng BE)                                         | Message lỗi (trùng BE)                                               |
| :--------------- | :------------ | :--------------------------------------------------------------- | :------------------------------------------------------------------- |
| Mã sinh viên \*  | `studentCode` | `^\d{10}$`                                                       | Mã sinh viên phải gồm đúng 10 chữ số                                 |
| Họ và tên đệm \* | `firstName`   | `^\p{L}+( \p{L}+)*$` (flag `u`)                                  | Họ chỉ được chứa chữ cái và khoảng trắng                             |
| Tên \*           | `lastName`    | `^\p{L}+$` (flag `u`)                                            | Tên chỉ được chứa chữ cái                                            |
| Email \*         | `email`       | định dạng email sau khi lowercase, rồi `.endsWith('@gmail.com')` | Email không đúng định dạng / Email sinh viên phải có đuôi @gmail.com |
| Số điện thoại \* | `phone`       | `^0\d{9}$`                                                       | Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0                |
| Khóa \*          | `batch`       | `^K\d{2}$` sau khi uppercase                                     | Khóa học không đúng định dạng (VD: K64)                              |
| Lớp \*           | `className`   | `^[\p{L}\p{N}]+( [\p{L}\p{N}]+)*$` (flag `u`)                    | Tên lớp không được chứa ký tự đặc biệt                               |
| Bộ môn \*        | `major`       | bắt buộc, `Select` từ `GET /major` (gửi **tên ngành**)           | Ngành học không được để trống                                        |

- Ghi chú dưới form: "Nếu sinh viên đã có trong hệ thống, chỉ Lớp và Số điện thoại được cập nhật."
- Kết quả: `1000` → toast xanh, đóng; `1101` / `1102` → toast vàng (interceptor), đóng; lỗi → hiện ở đầu form.

---

## 6. API ghi dữ liệu

### 6.1. `POST /student/import`

`multipart/form-data`, chỉ part **`file`**. Sinh viên luôn được thêm vào năm học + học kì hiện tại (BE tự xác định).
Luôn trả HTTP 200, `code 1000`, message "Xử lý file import hoàn tất", `data` = `StudentImportResponse` (không đổi):

```ts
export type RowImportStatus = "SUCCESS" | "WARNING" | "ERROR";

export interface StudentImportRowResult {
  rowNumber: number;
  studentCode: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  batch: string | null;
  className: string | null;
  majorName: string | null;
  status: RowImportStatus;
  message: string;
}

export interface StudentImportResponse {
  totalRows: number;
  successCount: number;
  warningCount: number;
  errorCount: number;
  rowResults: StudentImportRowResult[];
}
```

Lỗi mức toàn file (HTTP 400, `code 4000`) như cũ. Lỗi theo học kì: `409 3030` "Hiện chưa có học kỳ nào đang diễn ra, không thể thêm sinh viên",
`409 3023` "Học kỳ đã kết thúc, không thể thêm sinh viên" (học kì hiện tại thực tế đã qua ngày kết thúc).

### 6.2. `POST /student` – thêm thủ công & gửi lại dòng import lỗi

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

| Kết quả                                                                   | HTTP | `code`   | Message                                                                              |
| :------------------------------------------------------------------------ | :--- | :------- | :----------------------------------------------------------------------------------- |
| Thêm mới                                                                  | 200  | 1000     | Thêm sinh viên thành công                                                            |
| SV đã có, chưa có trong kì → thêm vào kì                                  | 200  | 1000     | Đã thêm sinh viên vào học kỳ                                                         |
| Đổi lớp / SĐT                                                             | 200  | 1000     | Đã cập nhật: Lớp, Số điện thoại                                                      |
| **Y hệt, đã có trong kì – vàng**                                          | 200  | **1101** | Sinh viên đã có trong học kỳ, thông tin không thay đổi                               |
| **Đã hoàn thành đồ án trong kì – vàng**                                   | 200  | **1102** | Sinh viên đã hoàn thành đồ án trong học kỳ này                                       |
| Lỗi định dạng (1 lỗi / ≥ 2 lỗi)                                           | 400  | 4000     | Message lỗi cụ thể / `<các trường> không hợp lệ, vui lòng kiểm tra lại`              |
| Trùng mã SV / email / SĐT với tài khoản khác, hoặc lệch họ tên/khóa/ngành | 409  | 3014     | `<Mã sinh viên, Email, Số điện thoại> trùng với tài khoản đã tồn tại trong hệ thống` |
| Chưa có học kì hiện tại                                                   | 409  | 3030     | Hiện chưa có học kỳ nào đang diễn ra, không thể thêm sinh viên                       |
| Học kì hiện tại thực tế đã qua ngày kết thúc                              | 409  | 3023     | Học kỳ đã kết thúc, không thể thêm sinh viên                                         |
| Đã hoàn thành đồ án ở kì trước                                            | 409  | 3024     | Sinh viên đã hoàn thành đồ án ở học kỳ trước, không thể thêm vào học kỳ mới          |
| Đang làm đồ án ở kì khác                                                  | 409  | 3025     | Sinh viên đang làm đồ án ở học kỳ khác                                               |

### 6.3. ~~`PATCH /student/{publicId}/activate`~~ – đã xóa

BE đã bỏ API này cùng `Student.status`. FE xóa endpoint `activate` và nút "Kích hoạt".

### 6.4. `PUT /student/{publicId}` – Sửa sinh viên

Body: 7 trường của form Thêm **trừ Ngành**, **không** có `semesterId`, **không** có `accountStatus`:

```json
{
  "studentCode": "2251172489",
  "firstName": "Lê Trung",
  "lastName": "Đức",
  "email": "duc@gmail.com",
  "phone": "0912345678",
  "batch": "K64",
  "className": "64KTPM3"
}
```

- **Không đổi ngành**: BE không nhận `major` (có gửi cũng bị bỏ qua), luôn giữ ngành hiện tại. Form Sửa hiện ô Bộ môn ở dạng
  chỉ đọc (`majorName` từ `GET /student/{publicId}`), không gửi lên.
- **Không đổi trạng thái tài khoản**: BE không nhận `accountStatus` (có gửi cũng bị bỏ qua), trạng thái đăng nhập giữ nguyên.
  Form Sửa **không** có ô bật/tắt "Được đăng nhập". Tài khoản chỉ bị khóa khi xóa SV khỏi kì mà SV còn lịch sử ở kì khác (Mục 6.5),
  và được mở lại khi import / thêm lại SV vào học kì hiện tại.
- Form Sửa dùng lại `StudentFormFields` + schema của popup Thêm (bỏ ô Ngành khỏi phần gửi), điền sẵn từ `GET /student/{publicId}`
  (tách `name` thành Họ / Tên: từ cuối là Tên).

| Kết quả                                      | HTTP | `code`   | Message                                                       |
| :------------------------------------------- | :--- | :------- | :------------------------------------------------------------ |
| Có thay đổi                                  | 200  | 1000     | Đã cập nhật: Tên, Số điện thoại, Lớp _(liệt kê field đã đổi)_ |
| Không đổi gì – vàng                          | 200  | **1103** | Thông tin sinh viên không thay đổi                            |
| SV không có                                  | 404  | 3008     | Sinh viên không tồn tại                                       |
| SV thuộc ngành mình không phụ trách (dù vẫn thấy trên bảng) | 403  | 3032     | Bạn không có quyền thao tác với sinh viên không thuộc ngành phụ trách |
| Lỗi định dạng                                | 400  | 4000     | như POST                                                      |
| Trùng mã SV / email / SĐT với tài khoản khác | 409  | 3014     | như POST                                                      |

Thành công → `invalidateQueries(departmentStudentKeys.all)` + detail của SV đó.

### 6.5. `DELETE /student/{publicId}?semesterId=` – Xóa SV import nhầm khỏi học kì

- Xóa **theo học kì đang chọn**. SV không còn đồ án ở kì nào khác → BE xóa luôn hồ sơ + tài khoản
  ("Xóa sinh viên thành công"); còn lịch sử ở kì khác → chỉ xóa khỏi kì ("Đã xóa sinh viên khỏi học kỳ"). FE hiện `message` của BE.
- Chỉ xóa được khi SV **chưa đăng ký GVHD / chưa có đề tài**. FE chỉ hiện nút khi dòng có `status = STAGE_1_REGISTERING_ADVISOR`
  và không có `lecturerName` / `topicName`; BE vẫn kiểm tra lại (kể cả đơn đăng ký GVHD đã bị từ chối → `3028`).
- Hỏi xác nhận trước khi gọi: "Xóa sinh viên _Lê Trung Đức (2251172489)_ khỏi _Học kỳ 1 năm học 2026-2027_?"

| Lỗi                               | HTTP | `code` | Message                                                             |
| :-------------------------------- | :--- | :----- | :------------------------------------------------------------------ |
| SV không có                       | 404  | 3008   | Sinh viên không tồn tại                                             |
| SV thuộc ngành mình không phụ trách | 403  | 3032   | Bạn không có quyền thao tác với sinh viên không thuộc ngành phụ trách |
| Thiếu `semesterId`                | 400  | 3022   | Vui lòng chọn học kỳ                                                |
| SV không có trong kì này          | 404  | 3027   | Sinh viên không có trong học kỳ này                                 |
| Đã đăng ký GVHD / có đề tài       | 409  | 3028   | Sinh viên đã đăng ký giáo viên hướng dẫn hoặc đề tài, không thể xóa |
| Học kì đã kết thúc                | 409  | 3029   | Học kỳ đã kết thúc, không thể xóa sinh viên                         |

---

## 7. Checklist

- [ ] Bộ lọc Năm học + Học kì từ `GET /semester` / `GET /semester/current`, gửi `semesterId`.
- [ ] Bảng 6 cột: Họ và tên (kèm mã SV bên dưới) · Lớp / Khóa · Bộ môn · Đề tài · GVHD (+ đồng hướng dẫn) · Trạng thái (`statusLabel`).
- [ ] Bộ lọc Khóa từ `GET /student/batch` (bỏ `BATCH_OPTIONS` tĩnh), Bộ môn từ `GET /major`, Trạng thái theo Mục 4.1.3.
- [ ] Bỏ `status: boolean` / `ACTIVE | INACTIVE | ALL` / nút Kích hoạt / endpoint `activate`.
- [ ] Sort đúng key `studentCode | name | className | batch | majorName`; phân trang 0-based, đọc được cả `Page` lẫn `PagedModel`.
- [ ] Popup chi tiết dùng `accountStatus`.
- [ ] `POST /student` và `POST /student/import` **không** gửi `semesterId` (BE tự vào học kì hiện tại); xử lý `1102`, `3023` – `3025`, `3030`.
- [x] Sửa sinh viên (`PUT`), xử lý `1103`.
- [x] Form Sửa: không gửi `major` (ô Bộ môn chỉ đọc).
- [x] Form Sửa: bỏ ô bật/tắt `accountStatus` và bỏ field này khỏi payload (`utils/updateStudentSchema.ts`,
      `EditStudentDialog.tsx`); bỏ xử lý lỗi `3031` (BE đã xóa).
- [x] Xóa sinh viên khỏi học kì (`DELETE`), có hộp xác nhận.
- [x] Export file (`GET /student/export`, Mục 4.6).
- [ ] Tải file mẫu import (chờ BE có API).
- [ ] Bộ lọc Bộ môn / danh sách hiển thị sinh viên **mọi ngành**; nút Sửa / Xóa với SV ngành khác để BE chặn (`403 3032`) cho tới khi BE có API "ngành tôi phụ trách".
- [ ] (Tùy chọn) Nối `GET /student/batch/all` khi cần dropdown khóa không theo học kì.
- [ ] `npx tsc -b`, `npm run lint`, `npm test`, `npm run build` đều qua.
