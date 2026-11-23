# API thông tin cá nhân giảng viên (xem & cập nhật)

> Dùng cho màn **Hồ sơ cá nhân** của giảng viên (`src/features/lecturer/profile_management`), hiện đang chạy dữ liệu mock
> (`DEFAULT_LECTURER_PROFILE` và `localStorage` key `lecturer_profile_contact_v2`).
> Có 2 API cùng URL `/teacher/my-info`:
>
> - `GET`: lấy thông tin của **chính giảng viên đang đăng nhập**.
> - `PUT`: giảng viên tự sửa **Họ, Tên, Số điện thoại**. **Email không cho tự đổi.**
>
> BE xác định giảng viên theo token. FE **không** gửi id / publicId.

## 0. Tổng quan

| Mục    | `GET /teacher/my-info`                            | `PUT /teacher/my-info`                            |
| ------ | ------------------------------------------------- | ------------------------------------------------- |
| Header | `Authorization: Bearer <accessToken>` (bắt buộc) | `Authorization: Bearer <accessToken>` (bắt buộc) |
| Body   | Không                                             | JSON `{ firstName, lastName, phone }`             |
| Role   | Mọi role giảng viên, kể cả **Trưởng bộ môn**     | Giống GET                                         |
| Data   | `TeacherMyInfo` (mục 1.2)                         | Không có `data`, chỉ có `code` và `message`       |

**Role được gọi**: `HEAD_OF_MAJOR`, `SECRETARY`, `CHAIRPERSON`, `COUNCIL_MEMBER`, `SUPERVISOR`, `EXAMINER`, `COMMENTING_LECTURER`.

- `ADMIN` và `STUDENT` gọi sẽ bị **403 / 2001**.
- Chỉ đăng nhập vào portal giảng viên mới cần gọi 2 API này.

Thêm vào `src/shared/api/endpoints.ts`, trong nhóm `lecturer`. Tạo nhóm này nếu chưa có, **không** đặt vào `departmentTeacher` vì nhóm đó dành cho màn TBM quản lý giáo viên:

```ts
lecturer: {
  // GET: xem thông tin cá nhân · PUT: sửa Họ, Tên, Số điện thoại
  myInfo: '/teacher/my-info',
},
```

---

## 1. `GET /teacher/my-info` – Lấy thông tin cá nhân

### 1.1. Request

```
GET /teacher/my-info
```

Request không có param và không có body.

### 1.2. Response thành công (HTTP 200)

```json
{
  "code": 1000,
  "data": {
    "teacherCode": "GV001",
    "academicTitle": "TS.",
    "academicTitleName": "Tiến sĩ",
    "name": "Nguyễn Văn An",
    "email": "an.nv@tlu.edu.vn",
    "phone": "0912345678",
    "organization": "Trường Đại học Thủy lợi",
    "majorName": "Kỹ thuật phần mềm",
    "facultyName": "Công nghệ thông tin"
  }
}
```

Ví dụ giảng viên **ngoài trường**: không có Bộ môn / Khoa, có thể chưa có học hàm học vị:

```json
{
  "code": 1000,
  "data": {
    "teacherCode": "GV002",
    "academicTitle": null,
    "academicTitleName": null,
    "name": "Trần Thị Bình",
    "email": "binh.tt@gmail.com",
    "phone": "0987654321",
    "organization": "Trường Đại học Bách khoa Hà Nội",
    "majorName": null,
    "facultyName": null
  }
}
```

| Field               | Kiểu           | Ghi chú                                                                                       |
| ------------------- | -------------- | --------------------------------------------------------------------------------------------- |
| `teacherCode`       | string         | Mã giảng viên                                                                                 |
| `academicTitle`     | string \| null | Học hàm, học vị **viết tắt**: `ThS.`, `TS.`, `PGS.TS.`, `GS.TS.`… `null` nếu chưa có         |
| `academicTitleName` | string \| null | Học hàm, học vị **đầy đủ**: `Thạc sĩ`, `Tiến sĩ`, `Phó Giáo sư`, `Giáo sư`… `null` nếu chưa có |
| `name`              | string         | Họ tên đầy đủ (Họ + Tên), **không** kèm học vị                                                |
| `email`             | string         | Email đăng nhập, chỉ hiển thị                                                                 |
| `phone`             | string \| null | 10 chữ số, không có dấu cách (VD `0912345678`)                                                |
| `organization`      | string \| null | Đơn vị công tác                                                                               |
| `majorName`         | string \| null | Bộ môn (tên ngành). `null` với giảng viên ngoài trường                                        |
| `facultyName`       | string \| null | Khoa. `null` với giảng viên ngoài trường                                                      |

BE **không** trả các trường sau, FE tự xử lý:

- **`isExternal`**: suy ra bằng `majorName == null`. Giảng viên ngoài trường không thuộc Bộ môn nào.
- **Chức danh / vai trò** (`role`: "Giảng viên" / "Trưởng bộ môn"): giữ nguồn hiện tại (portal store / `GET /my-info`). API này không trả role.
- **`firstName` / `lastName` riêng**: BE chỉ trả `name` đã ghép, xem cách tách ở mục 2.4.

### 1.3. Lỗi

| HTTP | `code` | `message`                                   | Khi nào                                                       |
| ---- | ------ | ------------------------------------------- | ------------------------------------------------------------- |
| 401  | 2000   | Phiên đăng nhập của bạn đã hết hạn          | Thiếu / hết hạn token (interceptor tự refresh)                |
| 403  | 2001   | Bạn không có quyền truy cập (access denied) | Tài khoản không có role giảng viên (Admin, Sinh viên)         |
| 404  | 4042   | Không tìm thấy thông tin giảng viên         | Tài khoản có role giảng viên nhưng chưa có hồ sơ giảng viên   |

---

## 2. `PUT /teacher/my-info` – Cập nhật Họ, Tên, Số điện thoại

### 2.1. Request

```
PUT /teacher/my-info
Content-Type: application/json
```

```json
{
  "firstName": "Nguyễn Văn",
  "lastName": "Anh",
  "phone": "0912345679"
}
```

| Field       | Kiểu   | Bắt buộc | Quy tắc (BE kiểm tra)                                                                                                    |
| ----------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| `firstName` | string | Có       | **Họ và tên đệm**. Chỉ chữ cái (có dấu), các từ cách nhau 1 dấu cách, không số / ký tự đặc biệt. Tối đa 255 ký tự      |
| `lastName`  | string | Có       | **Tên**: đúng **1 từ**, chỉ chữ cái (có dấu), không có dấu cách bên trong. Tối đa 255 ký tự                              |
| `phone`     | string | Có       | Đúng 10 chữ số, bắt đầu bằng `0` (`^0\d{9}$`). Không được trùng số của tài khoản khác. Trùng chính số cũ của mình thì vẫn hợp lệ |

- **Gửi đủ cả 3 field**, kể cả field không đổi. BE so sánh từng field với dữ liệu hiện tại để biết field nào thay đổi. Thiếu field thì BE coi là rỗng và báo lỗi.
- **Không gửi `email`**: nếu có gửi, BE cũng bỏ qua.
- BE tự chuẩn hóa trước khi kiểm tra: `trim`, gộp nhiều khoảng trắng thành 1, chuẩn Unicode NFC.
  - Ví dụ `"  Nguyễn   Văn "` → `"Nguyễn Văn"`.
  - **Dấu cách bên trong số điện thoại KHÔNG bị xóa**: `"0912 345 678"` sẽ bị báo sai định dạng. FE phải bỏ dấu cách trước khi gửi; modal hiện tại đã làm (`value.replace(/\s/g, '')`).

### 2.2. Response thành công (HTTP 200)

Có thay đổi:

```json
{
  "code": 1000,
  "message": "Đã cập nhật: Tên, Số điện thoại"
}
```

`message` có dạng `"Đã cập nhật: "` + danh sách field **thực sự thay đổi**, theo thứ tự `Họ, Tên, Số điện thoại`. Ví dụ:

- `"Đã cập nhật: Họ, Tên, Số điện thoại"`
- `"Đã cập nhật: Tên"`

Không có gì thay đổi (gửi y hệt dữ liệu cũ, kể cả chỉ khác khoảng trắng thừa):

```json
{
  "code": 1104,
  "message": "Thông tin giảng viên không thay đổi"
}
```

- `1104` là **cảnh báo** (HTTP 200, thuộc dải `11xx`). Interceptor (`isApiWarningCode`) tự hiện **toast vàng** và trả response bình thường, không reject.
- BE **không** lưu gì trong trường hợp này.

Cả 2 trường hợp đều **không có `data`**. Sau khi lưu thành công (`1000`), FE gọi lại `GET /teacher/my-info` (invalidate query) để lấy dữ liệu mới.

### 2.3. Lỗi

Thứ tự BE kiểm tra:

1. Có hồ sơ giảng viên không.
2. Định dạng 3 field.
3. Trùng số điện thoại.

Gặp lỗi ở bước nào thì dừng ở bước đó, không lưu gì.

| HTTP | `code` | `message` (ví dụ)                                              | Khi nào                                                  |
| ---- | ------ | -------------------------------------------------------------- | -------------------------------------------------------- |
| 400  | 4000   | Họ không được để trống                                         | Chỉ `firstName` rỗng                                     |
| 400  | 4000   | Họ không được chứa số và kí tự đặc biệt                        | Chỉ `firstName` sai định dạng                            |
| 400  | 4000   | Tên không được để trống                                        | Chỉ `lastName` rỗng                                      |
| 400  | 4000   | Tên chỉ được chứa chữ cái                                      | Chỉ `lastName` sai (có số, ký tự đặc biệt, hoặc nhiều từ) |
| 400  | 4000   | Số điện thoại không được để trống                              | Chỉ `phone` rỗng                                         |
| 400  | 4000   | Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0          | Chỉ `phone` sai định dạng                                |
| 400  | 4000   | Họ và Tên không hợp lệ, vui lòng kiểm tra lại                  | **Từ 2 field lỗi trở lên**: BE gộp tên các field lỗi     |
| 400  | 4000   | Họ, Tên và Số điện thoại không hợp lệ, vui lòng kiểm tra lại   | Cả 3 field lỗi                                           |
| 409  | 3014   | Số điện thoại trùng với tài khoản đã tồn tại trong hệ thống    | Số điện thoại đã thuộc tài khoản khác                    |
| 404  | 4042   | Không tìm thấy thông tin giảng viên                            | Tài khoản chưa có hồ sơ giảng viên                       |
| 400  | 1006   | Yêu cầu không hợp lệ                                           | Body rỗng / JSON hỏng                                    |
| 403  | 2001   | Bạn không có quyền truy cập (access denied)                    | Tài khoản không có role giảng viên                       |
| 401  | 2000   | Phiên đăng nhập của bạn đã hết hạn                             | Thiếu / hết hạn token                                    |

- Mọi lỗi validate đều cùng `code = 4000`. FE **hiển thị thẳng `message`** của BE, không map theo code.
- Message gộp nhiều field chỉ cho biết **tên** field lỗi, không nói rõ lỗi gì. Vì vậy FE nên validate trước bằng cùng quy tắc (mục 2.1) để hiện lỗi dưới từng ô; lỗi BE chủ yếu còn lại là **trùng số điện thoại**.
- Interceptor đã tự toast lỗi. Nếu muốn gắn lỗi `3014` vào ô Số điện thoại, gọi với `skipErrorToast` rồi `setError('phone', ...)`.

### 2.4. Họ / Tên trên form

BE lưu **Họ** (`firstName`) và **Tên** (`lastName`) riêng, nên modal cần đổi ô "Họ và tên" thành **2 ô**:

| Ô trên form    | Gửi lên BE  | Quy tắc FE (khớp BE)                                                 |
| -------------- | ----------- | -------------------------------------------------------------------- |
| Họ và tên đệm  | `firstName` | `/^\p{Script=Latin}+( \p{Script=Latin}+)*$/u`, tối đa 255           |
| Tên            | `lastName`  | `/^\p{Script=Latin}+$/u` (1 từ), tối đa 255                          |
| Số điện thoại  | `phone`     | Bỏ mọi dấu cách, rồi `/^0\d{9}$/`                                    |
| Email          | –           | Chỉ hiển thị (disabled), không gửi                                   |

Điền sẵn giá trị khi mở modal: `GET` chỉ trả `name` đã ghép. Tách theo **dấu cách cuối cùng**: `lastName` là từ cuối, `firstName` là phần còn lại. Cách này đúng vì Tên luôn là 1 từ.

```ts
export function splitFullName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return { firstName: '', lastName: parts[0] ?? '' }
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] }
}
```

---

## 3. Mapping sang màn hồ sơ giảng viên

### 3.1. Type

```ts
// Response GET /teacher/my-info
export interface TeacherMyInfo {
  teacherCode: string
  academicTitle: string | null // "TS."
  academicTitleName: string | null // "Tiến sĩ"
  name: string
  email: string
  phone: string | null
  organization: string | null
  majorName: string | null
  facultyName: string | null
}

// Body PUT /teacher/my-info
export interface TeacherMyInfoUpdatePayload {
  firstName: string
  lastName: string
  phone: string
}
```

### 3.2. Field mock cũ → dữ liệu thật

Áp cho `LecturerProfileData` và `LecturerProfileContactPayload`:

| Mock cũ                         | Dữ liệu thật                                                                           |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| `degree` + `formatDegreeFull()` | `academicTitleName` (đã đầy đủ). `null` → hiện `—`, **không** mặc định "Tiến sĩ" |
| Tiền tố trước tên (`getDegreePrefix()`) | `academicTitle` (VD `TS. Nguyễn Văn An`). `null` → chỉ hiện `name`             |
| `name`                          | `name`                                                                                 |
| `workplace`                     | `organization`                                                                         |
| `isExternal`                    | `majorName == null`                                                                    |
| `department`                    | `majorName`                                                                            |
| `faculty`                       | `facultyName`                                                                          |
| `email`                         | `email`                                                                                |
| `phone`                         | `phone`                                                                                |
| `role`                          | Giữ nguồn hiện tại (không có trong API này)                                            |
| (mới) Mã giảng viên             | `teacherCode` (có thể hiện thêm ở card "Thông tin cá nhân")                            |
| Payload `name`                  | Tách thành `firstName` + `lastName`                                                    |
| Payload `email`                 | Bỏ, không gửi                                                                          |

### 3.3. Việc cần sửa ở FE

1. **Bỏ mock**:
   - Xóa `DEFAULT_LECTURER_PROFILE`, `loadInitialProfile` và việc đọc/ghi `localStorage` (`lecturer_profile_contact_v2`).
   - Dữ liệu lấy bằng TanStack Query, ví dụ `queryKey: ['lecturer', 'my-info']`, gọi `GET /teacher/my-info`.
2. **Bỏ fallback giả**: `'Trường Đại học Thủy lợi'` cho đơn vị, `'Tiến sĩ'` / `'TS.'` cho học vị. Giá trị `null` thì hiện `—`, riêng đơn vị công tác có thể giữ `emptyText`.
3. **Modal sửa**:
   - Đổi thành 2 ô Họ / Tên (mục 2.4).
   - Submit gọi `PUT /teacher/my-info` bằng `useMutation`.
   - Khi `code === 1000`:
     - Hiện toast xanh bằng **`message` của BE** (thay câu cố định `'Đã cập nhật thông tin cá nhân'`).
     - Đóng modal và `invalidateQueries(['lecturer', 'my-info'])`.
   - Khi `code === 1104`: interceptor đã hiện toast vàng. **Không** hiện thêm toast xanh. Có thể đóng modal.
   - Khi lỗi: giữ modal mở để người dùng sửa.
4. **Header**: sau khi cập nhật thành công, đồng bộ tên / SĐT sang `useLecturerPortalStore.updateTeacherProfile` (như `saveProfileContact` đang làm), để header đổi theo mà không cần tải lại trang.

---

## 4. Kiểm tra sau khi nối API

- [ ] Giảng viên trong trường: hiện đủ mã GV, học vị (đầy đủ + tiền tố trước tên), đơn vị, Bộ môn, Khoa, email, SĐT.
- [ ] Giảng viên ngoài trường (`majorName = null`): có nhãn "Ngoài trường", ẩn Bộ môn / Khoa.
- [ ] Giảng viên chưa có học vị: không hiện tiền tố, ô Học vị hiện `—`.
- [ ] Đăng nhập bằng **Trưởng bộ môn** → xem được thông tin, sửa được.
- [ ] Sửa Tên + SĐT → `PUT` trả `1000` "Đã cập nhật: Tên, Số điện thoại" → dữ liệu và header cập nhật.
- [ ] Lưu không đổi gì → toast vàng "Thông tin giảng viên không thay đổi", không có toast xanh.
- [ ] Nhập SĐT của giảng viên khác → `409 / 3014` "Số điện thoại trùng với tài khoản đã tồn tại trong hệ thống".
- [ ] Nhập "0912 345 678" → FE bỏ dấu cách, gửi `0912345678`.
- [ ] Ô Email không sửa được, request `PUT` không có `email`.
