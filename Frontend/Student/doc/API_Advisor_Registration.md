# Hướng dẫn Tích hợp API: Đăng ký Giảng viên Hướng dẫn & Xem Tổng quan (Dành cho Sinh viên)

Tài liệu hướng dẫn kết nối Frontend (`Frontend/Student`) với Backend (`tlu_gpms_system`) cho các chức năng thuộc **Giai đoạn 1 — Bước 2 & Bước 3**:
1. **Tạo đơn đăng ký giảng viên hướng dẫn (GVHD)** *(khi sinh viên chưa có đơn đăng ký trong kỳ hoặc đơn gần nhất đã bị từ chối `REJECTED`)*.
2. **Cập nhật đơn đăng ký GVHD** *(khi sinh viên đang có đơn ở trạng thái `PENDING` và còn hạn đăng ký GVHD)*.
3. **Hiển thị lịch sử đơn đăng ký GVHD của sinh viên theo học kỳ** *(kèm API lấy đơn mới nhất trong học kỳ hiện tại)*.
4. **Lấy danh sách GVHD của học kỳ hiện tại còn chỉ tiêu hướng dẫn**.
5. **Lấy GVHD và đề tài chính thức của các kỳ**.
6. **Lấy hạn đăng ký GVHD theo học kỳ**.

---

## 1. Tổng quan Nghiệp vụ & Luồng xử lý (Workflow)

```
                     [ Sinh viên thuộc danh sách làm đồ án kỳ ONGOING ]
                               (STAGE_1_REGISTERING_ADVISOR)
                                             │
        ┌────────────────────────────────────┴────────────────────────────────────┐
        ▼                                                                         ▼
  [ Chưa có đơn / Đơn gần nhất = REJECTED ]                            [ Đang có đơn = PENDING ]
  - Chọn GVHD còn chỉ tiêu:                                           - Còn hạn & chưa khóa danh sách:
    GET /api/student/advisor-registrations/advisors                     PUT /api/student/advisor-registrations
  - Gửi đơn mới (topicName không bắt buộc):                             (Đổi GVHD khác còn chỉ tiêu / sửa topicName)
    POST /api/student/advisor-registrations
        │                                                                         │
        └────────────────────────────────────┬────────────────────────────────────┘
                                             ▼
                                Trạng thái đơn: PENDING
                                (Chờ GVHD tiếp nhận cấp 1)
                                             │
                 ┌───────────────────────────┼───────────────────────────┐
                 ▼                           ▼                           ▼
          [GV duyệt đạt]             [GV từ chối / Tự động]       [Hết hạn DANG_KY_GVHD]
        TEACHER_APPROVED                  REJECTED                       REJECTED
     (Chờ TBM thẩm định)          (Kèm thông báo SSE cho SV)     (Job tự động reject + thông báo)
                 │                           │
                 │                           └─► Nếu còn hạn: SV được nộp lại đơn mới
                 ▼
      [TBM chốt danh sách]
  HOD_APPROVED / ASSIGNED_BY_HOD
  Cập nhật GVHD vào thesis_topic
  (Hiển thị ở mentorName trong /overview)
```

### Lưu ý nghiệp vụ quan trọng
- **Hạn đăng ký (`DANG_KY_GVHD`)**: Sinh viên chỉ được **tạo đơn mới** hoặc **cập nhật đơn `PENDING`** khi học kỳ đang `ONGOING`, TBM **chưa khóa danh sách phân công**, và thời điểm hiện tại nằm trong `[deadlineStartDate, deadlineEndDate]` (`deadlineStatus === "OPEN"`).
- **Tên đề tài dự kiến (`topicName`)**: **Không bắt buộc**. Có thể truyền `null`, `""` hoặc bỏ qua; Backend tự `trim()` và chuẩn hóa chuỗi rỗng thành `null`, giới hạn tối đa **500 ký tự**.
- **Chỉ tiêu GVHD (`remainingSlots`)**: Đã bao gồm cả số đơn chính (`TEACHER_APPROVED`, `HOD_APPROVED`, `ASSIGNED_BY_HOD`) và số đề tài giảng viên làm đồng hướng dẫn (`coLecturer`). Danh sách GVHD trả về **chỉ gồm các giảng viên còn chỉ tiêu** (`occupiedStudents < maxStudents`).
- **Tự động chuyển sang `REJECTED` + gửi thông báo**:
  - Khi GVHD bấm duyệt một sinh viên và tổng số sinh viên nhận hướng dẫn vừa đạt đủ `maxStudents`, các đơn `PENDING` còn lại gửi tới giảng viên đó sẽ tự động chuyển sang `REJECTED` và gửi thông báo tới từng sinh viên.
  - Khi hết thời hạn `DANG_KY_GVHD` (`now > endDate`), hệ thống tự động quét các đơn còn ở trạng thái `PENDING` chuyển sang `REJECTED` và gửi thông báo tới sinh viên.
  - Khi GVHD bấm duyệt (`TEACHER_APPROVED`), Backend **không** gửi thông báo cho sinh viên; thông báo chỉ gửi khi đơn bị từ chối (`REJECTED`) hoặc khi TBM chốt danh sách phân công chính thức.

---

## 2. Danh sách API Endpoints

Tất cả API dưới đây đều trả về cấu trúc wrapper chuẩn `APIResponse<T>` (`{ code: 1000, message?: string, data: T }`) với HTTP `200 OK` khi thành công.

| Chức năng | Method | Endpoint | Quyền (`@PreAuthorize`) | Mục đích |
|---|:---:|---|---|---|
| **Học kỳ hiện tại** | `GET` | `/semester/current` | Đăng nhập | Lấy `semester.publicId` của học kỳ hiện tại |
| **Danh sách học kỳ** | `GET` | `/semester` | Đăng nhập | Lấy danh sách các kỳ để lọc lịch sử & tổng quan |
| **Tổng quan & Hạn đăng ký** *(Mục 5 & 6)* | `GET` | `/api/student/advisor-registrations/overview?semesterPublicId={uuid}` | `STUDENT` | Lấy GVHD, đề tài chính thức và trạng thái hạn đăng ký GVHD của học kỳ |
| **Lịch sử đơn theo học kỳ** *(Mục 3)* | `GET` | `/api/student/advisor-registrations?semesterPublicId={uuid}` | `STUDENT` | Lấy tất cả đơn đăng ký đã gửi trong học kỳ (mới nhất đứng đầu) |
| **Đơn mới nhất kỳ hiện tại** *(Bổ trợ Mục 1, 2, 3)* | `GET` | `/api/student/advisor-registrations/current` | `STUDENT` | Lấy đơn mới nhất trong kỳ hiện tại (`data: null` nếu chưa nộp) |
| **Danh sách GVHD còn chỉ tiêu** *(Mục 4)* | `GET` | `/api/student/advisor-registrations/advisors?semesterPublicId={uuid}` | `REGISTER_ADVISOR` hoặc `STUDENT` | Lấy danh sách GVHD kỳ hiện tại còn chỉ tiêu (`occupiedStudents < maxStudents`) |
| **Tạo đơn đăng ký GVHD** *(Mục 1)* | `POST` | `/api/student/advisor-registrations` | `REGISTER_ADVISOR` hoặc `STUDENT` | Nộp đơn mới (khi chưa có đơn hoặc đơn gần nhất = `REJECTED`) |
| **Cập nhật đơn đăng ký GVHD** *(Mục 2)* | `PUT` | `/api/student/advisor-registrations` | `REGISTER_ADVISOR` hoặc `STUDENT` | Sửa GVHD / tên đề tài dự kiến khi đơn gần nhất đang là `PENDING` |

> **Ghi chú xác thực & cấu hình Axios**:
> - `apiClient` trong `src/shared/api/client.ts` đã bật `withCredentials: true` để gửi kèm cookie `access_token` (HttpOnly), hoặc gửi header `Authorization: Bearer <token>`.
> - Nếu `VITE_API_BASE_URL` trỏ gốc Backend (ví dụ `http://localhost:8080`), các endpoint `/api/student/advisor-registrations...` sẽ gọi trực tiếp tới `http://localhost:8080/api/student/advisor-registrations...`.

---

## 3. Chi tiết từng API

### 3.1. Tạo đơn đăng ký GVHD *(Mục 1)*

- **Endpoint**: `POST /api/student/advisor-registrations`
- **Điều kiện gọi thành công**:
  1. Tài khoản sinh viên đang hoạt động (`status = true`).
  2. Có học kỳ đang diễn ra (`ONGOING`) và TBM **chưa khóa** danh sách phân công GVHD.
  3. Sinh viên nằm trong danh sách làm đồ án kỳ hiện tại (`thesis_topic.currentStage == STAGE_1_REGISTERING_ADVISOR`, `thesis_topic.status == IN_PROGRESS`).
  4. Mốc thời hạn `DANG_KY_GVHD` của học kỳ hiện tại đã cấu hình và đang mở (`startDate <= now <= endDate`).
  5. Sinh viên **chưa có đơn nào** trong kỳ hiện tại **HOẶC** đơn gần nhất có `status === "REJECTED"`.
  6. Giảng viên được chọn đang hoạt động trong kỳ (`SemesterAdvisor.status == ACTIVE`, `teacher.account.status == true`) và còn chỉ tiêu (`occupied < maxStudents`).
- **Request Body**:
```json
{
  "teacherPublicId": "33333333-3333-3333-3333-333333333333",
  "topicName": "Nghiên cứu xây dựng hệ thống quản lý đồ án tốt nghiệp TLU"
}
```
- **Validation DTO (`SubmitAdvisorRegistrationRequest`)**:
  - `teacherPublicId` (`UUID`, **bắt buộc**): `@NotNull` $\rightarrow$ thiếu trả lỗi `TEACHER_PUBLIC_ID_REQUIRED` (`3046`).
  - `topicName` (`string | null`, **không bắt buộc**): tối đa `500` ký tự $\rightarrow$ vượt quá trả lỗi `ADVISOR_TOPIC_NAME_TOO_LONG` (`3048`). Có thể gửi `null`, `""` hoặc không truyền field này.
- **Response Success (HTTP 200)**:
```json
{
  "code": 1000,
  "message": "Đăng ký giảng viên hướng dẫn thành công",
  "data": {
    "registrationPublicId": "9f8c1d2e-4a5b-7c8d-9e0f-1a2b3c4d5e6f",
    "studentPublicId": "11111111-1111-1111-1111-111111111111",
    "semesterPublicId": "22222222-2222-2222-2222-222222222222",
    "teacherPublicId": "33333333-3333-3333-3333-333333333333",
    "studentCode": "2251172001",
    "studentName": "Nguyễn Văn An",
    "majorName": "Kỹ thuật phần mềm",
    "teacherCode": "GV001",
    "teacherName": "Trần Bình",
    "topicName": "Nghiên cứu xây dựng hệ thống quản lý đồ án tốt nghiệp TLU",
    "status": "PENDING",
    "statusDescription": "Chờ duyệt",
    "submittedAt": "2026-11-11T09:00:00",
    "processedAt": null
  }
}
```

---

### 3.2. Cập nhật đơn đăng ký GVHD *(Mục 2)*

- **Endpoint**: `PUT /api/student/advisor-registrations`
- **Điều kiện gọi thành công**:
  1. Tài khoản sinh viên đang hoạt động, có học kỳ `ONGOING` và chưa bị TBM khóa phân công.
  2. `semesterPublicId` trong body phải khớp đúng `publicId` của học kỳ hiện tại (`ONGOING`).
  3. Sinh viên đã có đơn trong kỳ hiện tại và đơn **mới nhất** đang ở trạng thái **`PENDING`**.
  4. Mốc `DANG_KY_GVHD` vẫn đang mở (`startDate <= now <= endDate`).
  5. Giảng viên mới hợp lệ và còn chỉ tiêu *(khi đếm chỉ tiêu, Backend tự loại trừ chính đơn đang cập nhật để sinh viên giữ nguyên GV hoặc sửa tên đề tài không bị đếm trùng)*.
- **Request Body**:
```json
{
  "semesterPublicId": "22222222-2222-2222-2222-222222222222",
  "teacherPublicId": "44444444-4444-4444-4444-444444444444",
  "topicName": "Xây dựng ứng dụng AI hỗ trợ phân tích mã nguồn"
}
```
- **Validation DTO (`UpdateAdvisorRegistrationRequest`)**:
  - `semesterPublicId` (`UUID`, **bắt buộc**): thiếu trả lỗi `SEMESTER_PUBLIC_ID_REQUIRED` (`3047`).
  - `teacherPublicId` (`UUID`, **bắt buộc**): thiếu trả lỗi `TEACHER_PUBLIC_ID_REQUIRED` (`3046`).
  - `topicName` (`string | null`, **không bắt buộc**): tối đa `500` ký tự (`ADVISOR_TOPIC_NAME_TOO_LONG` - `3048`). Truyền `null` hoặc `""` sẽ xóa tên đề tài dự kiến về `null`.
- **Response Success (HTTP 200)**:
```json
{
  "code": 1000,
  "message": "Cập nhật đơn đăng ký giảng viên hướng dẫn thành công",
  "data": {
    "registrationPublicId": "9f8c1d2e-4a5b-7c8d-9e0f-1a2b3c4d5e6f",
    "studentPublicId": "11111111-1111-1111-1111-111111111111",
    "semesterPublicId": "22222222-2222-2222-2222-222222222222",
    "teacherPublicId": "44444444-4444-4444-4444-444444444444",
    "studentCode": "2251172001",
    "studentName": "Nguyễn Văn An",
    "majorName": "Kỹ thuật phần mềm",
    "teacherCode": "GV002",
    "teacherName": "Lê Minh",
    "topicName": "Xây dựng ứng dụng AI hỗ trợ phân tích mã nguồn",
    "status": "PENDING",
    "statusDescription": "Chờ duyệt",
    "submittedAt": "2026-11-11T09:00:00",
    "processedAt": null
  }
}
```

---

### 3.3. Hiển thị lịch sử đơn đăng ký GVHD theo học kỳ *(Mục 3)*

- **Endpoint**: `GET /api/student/advisor-registrations?semesterPublicId={uuid}`
- **Query Params**:
  - `semesterPublicId` (`UUID`, **bắt buộc**): `publicId` của học kỳ cần xem (lấy từ `GET /semester` hoặc `GET /semester/current`).
- **Response Success (HTTP 200)**: Mảng đơn đăng ký sắp xếp **mới nhất lên đầu** (`ORDER BY createdAt DESC, id DESC`). Nếu học kỳ đó sinh viên chưa gửi đơn nào, `data` là mảng rỗng `[]`.
```json
{
  "code": 1000,
  "data": [
    {
      "registrationPublicId": "9f8c1d2e-4a5b-7c8d-9e0f-1a2b3c4d5e6f",
      "studentPublicId": "11111111-1111-1111-1111-111111111111",
      "semesterPublicId": "22222222-2222-2222-2222-222222222222",
      "teacherPublicId": "44444444-4444-4444-4444-444444444444",
      "studentCode": "2251172001",
      "studentName": "Nguyễn Văn An",
      "majorName": "Kỹ thuật phần mềm",
      "teacherCode": "GV002",
      "teacherName": "Lê Minh",
      "topicName": "Xây dựng ứng dụng AI hỗ trợ phân tích mã nguồn",
      "status": "PENDING",
      "statusDescription": "Chờ duyệt",
      "submittedAt": "2026-11-11T09:00:00",
      "processedAt": null
    },
    {
      "registrationPublicId": "8a7b6c5d-1111-2222-3333-444455556666",
      "studentPublicId": "11111111-1111-1111-1111-111111111111",
      "semesterPublicId": "22222222-2222-2222-2222-222222222222",
      "teacherPublicId": "33333333-3333-3333-3333-333333333333",
      "studentCode": "2251172001",
      "studentName": "Nguyễn Văn An",
      "majorName": "Kỹ thuật phần mềm",
      "teacherCode": "GV001",
      "teacherName": "Trần Bình",
      "topicName": null,
      "status": "REJECTED",
      "statusDescription": "Đã từ chối",
      "submittedAt": "2026-11-10T14:20:00",
      "processedAt": "2026-11-10T16:05:00"
    }
  ]
}
```

#### API bổ trợ: Lấy đơn đăng ký mới nhất trong học kỳ hiện tại
- **Endpoint**: `GET /api/student/advisor-registrations/current`
- **Response Success (HTTP 200)**:
  - Khi có đơn: `data` là object `AdvisorRegistrationResponse` mới nhất trong kỳ `ONGOING`.
  - Khi sinh viên chưa có đơn nào trong kỳ `ONGOING`:
```json
{
  "code": 1000
}
```
*(Lưu ý: Do `APIResponse` có `@JsonInclude(NON_NULL)`, khi `data` là `null` trường `data` sẽ không xuất hiện trong JSON — phía FE xử lý `res.data.data ?? null`.)*

---

### 3.4. Lấy danh sách GVHD của học kỳ hiện tại còn chỉ tiêu *(Mục 4)*

- **Endpoint**: `GET /api/student/advisor-registrations/advisors?semesterPublicId={uuid}`
- **Query Params**:
  - `semesterPublicId` (`UUID`, **bắt buộc**): Phải trùng `publicId` của học kỳ hiện tại (`ONGOING`). Nếu truyền `semesterPublicId` của học kỳ cũ/khác, Backend ném `INVALID_REQUEST (1006)`.
- **Quy tắc lọc phía Backend**:
  - Chỉ lấy giảng viên có `SemesterAdvisor.status == ACTIVE` và tài khoản `Account.status == true`.
  - Chỉ trả về giảng viên còn chỉ tiêu: `occupiedStudents < maxStudents` (trong đó `occupiedStudents` = đơn `TEACHER_APPROVED` + `HOD_APPROVED` + `ASSIGNED_BY_HOD` + số đề tài đồng hướng dẫn `coLecturer`).
- **Response Success (HTTP 200)**:
```json
{
  "code": 1000,
  "data": [
    {
      "teacherPublicId": "33333333-3333-3333-3333-333333333333",
      "teacherCode": "GV001",
      "teacherName": "Trần Bình",
      "academicTitle": "Thạc sĩ",
      "organization": "Trường Đại học Thủy lợi",
      "majorName": "Kỹ thuật phần mềm",
      "maxStudents": 5,
      "occupiedStudents": 2,
      "remainingSlots": 3,
      "pendingCount": 4
    }
  ]
}
```
- **Giải thích các trường số liệu**:
  - `maxStudents`: Chỉ tiêu tối đa của giảng viên trong học kỳ.
  - `occupiedStudents`: Số suất đã có người nhận (đã duyệt sơ bộ / đã chốt / đồng hướng dẫn).
  - `remainingSlots`: Số suất trống còn lại (`maxStudents - occupiedStudents`).
  - `pendingCount`: Số đơn đang ở trạng thái `PENDING` chờ giảng viên duyệt *(để sinh viên tham khảo mức độ cạnh tranh; đơn `PENDING` chưa trừ vào `occupiedStudents`)*.

---

### 3.5. Lấy GVHD & đề tài chính thức của các kỳ *(Mục 5)* và Lấy hạn đăng ký GVHD *(Mục 6)*

Cả **Mục 5** và **Mục 6** dùng chung endpoint tổng quan theo từng học kỳ (kỳ hiện tại hoặc bất kỳ học kỳ cũ nào sinh viên chọn trên dropdown):

- **Endpoint**: `GET /api/student/advisor-registrations/overview?semesterPublicId={uuid}`
- **Query Params**:
  - `semesterPublicId` (`UUID`, **bắt buộc**): `publicId` của học kỳ bất kỳ (từ `GET /semester` hoặc `GET /semester/current`).
- **Response Success (HTTP 200)**:
```json
{
  "code": 1000,
  "data": {
    "semesterPublicId": "22222222-2222-2222-2222-222222222222",
    "mentorName": "Trần Bình",
    "topicName": "Hệ thống quản lý đồ án tốt nghiệp TLU",
    "deadlineName": "Đăng kí gvhd",
    "deadlineStartDate": "2026-11-01T00:00:00",
    "deadlineEndDate": "2026-11-15T23:59:59",
    "deadlineActive": true,
    "deadlineStatus": "OPEN"
  }
}
```

#### Chi tiết các trường phục vụ Mục 5 (GVHD & Đề tài chính thức của các kỳ)
- `mentorName` (`string | null`): Họ tên **GVHD chính thức** lấy từ `ThesisTopic.lecturer` của sinh viên trong học kỳ `semesterPublicId`. Trả `null` nếu kỳ đó chưa chốt GVHD (hoặc sinh viên không có `ThesisTopic` trong kỳ).
- `topicName` (`string | null`): Tên **đề tài chính thức** lấy từ `ThesisTopic.name` trong học kỳ `semesterPublicId`. Trả `null` nếu chưa chốt tên đề tài chính thức ở Giai đoạn 2 *(lưu ý: tên dự kiến khi nộp đơn chưa chốt vẫn xem trong `topicName` của lịch sử đơn ở Mục 3)*.

#### Chi tiết các trường phục vụ Mục 6 (Hạn đăng ký GVHD — mốc `DANG_KY_GVHD`)
- `deadlineName` (`string | null`): Tên mốc thời hạn từ `DeadlineTemplate` (ví dụ `"Đăng kí gvhd"`).
- `deadlineStartDate` (`string | null`): ISO-8601 `LocalDateTime`, thời điểm mở đăng ký.
- `deadlineEndDate` (`string | null`): ISO-8601 `LocalDateTime`, thời điểm đóng đăng ký.
- `deadlineActive` (`boolean | null`): `true` nếu mốc đã cấu hình đủ `startDate` và `endDate`; `false` nếu thiếu một trong hai mốc ngày; `null` khi `NOT_CONFIGURED`.
- `deadlineStatus` (`string`): Một trong **5 trạng thái**:

| Giá trị `deadlineStatus` | Điều kiện | Ý nghĩa hiển thị trên UI |
|---|---|---|
| `NOT_CONFIGURED` | Chưa có bản ghi mốc `DANG_KY_GVHD` hoặc cả `startDate` & `endDate` đều `null` | Chưa thiết lập hạn đăng ký (`deadlineActive: null`) |
| `INACTIVE` | Thiếu `startDate` hoặc `endDate` | Mốc thời hạn chưa đầy đủ / chưa kích hoạt |
| `NOT_STARTED` | `now < deadlineStartDate` | Chưa tới thời gian mở đăng ký (hiển thị đếm ngược tới lúc mở) |
| `CLOSED` | `now > deadlineEndDate` | Đã hết hạn đăng ký GVHD (khóa nút Tạo mới & Cập nhật) |
| `OPEN` | `deadlineStartDate <= now <= deadlineEndDate` | Đang mở đăng ký (cho phép Tạo mới / Cập nhật) |

---

## 4. Bảng mã lỗi Backend (ErrorCode) & Cách xử lý trên UI

Khi API lỗi (HTTP 4xx / 5xx), Backend trả JSON:
```json
{
  "code": 1004,
  "message": "Bạn đã có đơn đăng ký GVHD chưa bị từ chối, không thể tạo đơn mới"
}
```

| HTTP Status | `code` | Tên `ErrorCode` | Ngữ cảnh & Gợi ý xử lý UI |
|:---:|:---:|---|---|
| **400** | `3046` | `TEACHER_PUBLIC_ID_REQUIRED` | Chưa chọn giảng viên hướng dẫn khi `POST`/`PUT`. |
| **400** | `3047` | `SEMESTER_PUBLIC_ID_REQUIRED` | Thiếu `semesterPublicId` khi `PUT` cập nhật đơn. |
| **400** | `3048` | `ADVISOR_TOPIC_NAME_TOO_LONG` | Tên đề tài vượt quá 500 ký tự. |
| **400** | `4000` | `ASSIGNMENT_ALREADY_LOCKED` | TBM đã khóa danh sách phân công GVHD của học kỳ $\rightarrow$ khóa thao tác nộp/sửa và tải lại trang. |
| **400** | `4000` | `TEACHER_NOT_ASSIGNED_IN_SEMESTER` | Giảng viên chưa được phân công hướng dẫn trong học kỳ hiện tại. |
| **400** | `4000` | `ADVISOR_QUOTA_EXCEEDED` | Giảng viên đã đủ chỉ tiêu hướng dẫn (có thể vừa bị sinh viên khác/GV duyệt kín chỗ). Nên gọi lại `getAvailableAdvisors` để làm mới danh sách GV. |
| **400** | `4000` | `REGISTRATION_STATUS_INVALID` | Gọi `PUT` khi đơn không còn ở trạng thái `PENDING` (ví dụ GV vừa duyệt hoặc vừa từ chối). Cần refetch lịch sử/current. |
| **400** | `4000` | `SEMESTER_CONFIG_INVALID` | Có nhiều hơn 1 học kỳ đang `ONGOING`. |
| **400** | `4004` | `TEACHER_ACCOUNT_INACTIVE` | Tài khoản giảng viên được chọn đang bị khóa/ngưng hoạt động. |
| **400** | `1006` | `INVALID_REQUEST` | Truyền `semesterPublicId` không khớp kỳ hiện tại (khi lấy danh sách GV hoặc `PUT`), `teacherPublicId = null`, GV không `ACTIVE`, hoặc tên đề tài > 500 ký tự. |
| **401** | `2000` | `UNAUTHORIZED` | Phiên đăng nhập hết hạn. `interceptors.ts` tự gọi `/refresh-token` hoặc đẩy về `/login`. |
| **403** | `2001` | `FORBIDDEN` | Tài khoản bị khóa / không phải sinh viên / không nằm trong danh sách đồ án kỳ này / không ở `STAGE_1_REGISTERING_ADVISOR` / đợt `DANG_KY_GVHD` chưa mở hoặc đã hết hạn. |
| **404** | `1005` | `RESOURCE_NOT_FOUND` | Chưa cấu hình mốc thời hạn `DANG_KY_GVHD` khi nộp đơn (`POST`). |
| **404** | `4041` | `SEMESTER_NOT_FOUND` | Không tìm thấy học kỳ theo `semesterPublicId`. |
| **404** | `3022` | `REGISTRATION_NOT_FOUND` | Gọi `PUT` khi chưa có đơn đăng ký nào trong kỳ hiện tại. |
| **409** | `1004` | `RESOURCE_ALREADY_EXISTS` | Gọi `POST` khi đang có đơn chưa bị từ chối (`PENDING`, `TEACHER_APPROVED`, `HOD_APPROVED`, `ASSIGNED_BY_HOD`). |
| **409** | `3030` | `CURRENT_SEMESTER_NOT_FOUND` | Hiện chưa có học kỳ nào ở trạng thái `ONGOING`. |

---

## 5. Hướng dẫn Đồng bộ Code Phía Frontend (`Frontend/Student`)

Đối chiếu với source hiện có trong `src/features/registration_management/` và `src/shared/api/`:

### 5.1. Điểm cần sửa ngay trong `src/features/registration_management/services/registration.service.ts`

Hiện tại Backend đã bọc **toàn bộ 6 endpoint** của `AdvisorRegistrationController` trong `APIResponse<T>` (`{ code, message, data }`).
Trong file `registration.service.ts` cũ, 3 hàm `getCurrent`, `submit`, `update` đã bóc `.data.data`, **nhưng 3 hàm `getHistory`, `getOverview`, `getAvailableAdvisors` vẫn đang đọc thẳng `res.data` (sai cấu trúc mới)**. Cần sửa lại đồng bộ như sau:

```typescript
import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type {
  AdvisorRegistrationResponse,
  AvailableAdvisor,
  RegistrationOverviewResponse,
  SubmitAdvisorRegistrationRequest,
  UpdateAdvisorRegistrationRequest,
} from '../types/registration.types'

const REGISTRATION = API_ENDPOINTS.student.advisorRegistrations
const REGISTRATION_OVERVIEW = API_ENDPOINTS.student.registrationOverview
const AVAILABLE_ADVISORS = API_ENDPOINTS.student.availableAdvisors

export const registrationService = {
  // 3. Lịch sử đơn đăng ký theo học kỳ
  async getHistory(semesterPublicId: string): Promise<AdvisorRegistrationResponse[]> {
    const res = await apiClient.get<ApiResponse<AdvisorRegistrationResponse[]>>(
      REGISTRATION,
      { params: { semesterPublicId } },
    )
    return res.data.data ?? []
  },

  // Đơn đăng ký mới nhất trong học kỳ hiện tại
  async getCurrent(): Promise<AdvisorRegistrationResponse | null> {
    const res = await apiClient.get<ApiResponse<AdvisorRegistrationResponse | null>>(
      `${REGISTRATION}/current`,
    )
    return res.data.data ?? null
  },

  // 5 & 6. Tổng quan (GVHD, đề tài chính thức & hạn đăng ký GVHD) theo học kỳ
  async getOverview(semesterPublicId: string): Promise<RegistrationOverviewResponse> {
    const res = await apiClient.get<ApiResponse<RegistrationOverviewResponse>>(
      REGISTRATION_OVERVIEW,
      { params: { semesterPublicId } },
    )
    return res.data.data
  },

  // 4. Danh sách GVHD của học kỳ hiện tại còn chỉ tiêu
  async getAvailableAdvisors(semesterPublicId: string): Promise<AvailableAdvisor[]> {
    const res = await apiClient.get<ApiResponse<AvailableAdvisor[]>>(
      AVAILABLE_ADVISORS,
      { params: { semesterPublicId } },
    )
    return res.data.data ?? []
  },

  // 1. Tạo đơn đăng ký GVHD mới
  async submit(body: SubmitAdvisorRegistrationRequest): Promise<AdvisorRegistrationResponse> {
    const res = await apiClient.post<ApiResponse<AdvisorRegistrationResponse>>(
      REGISTRATION,
      body,
      { skipErrorToast: true },
    )
    return res.data.data
  },

  // 2. Cập nhật đơn đăng ký GVHD đang PENDING
  async update(body: UpdateAdvisorRegistrationRequest): Promise<AdvisorRegistrationResponse> {
    const res = await apiClient.put<ApiResponse<AdvisorRegistrationResponse>>(
      REGISTRATION,
      body,
      { skipErrorToast: true },
    )
    return res.data.data
  },
}
```

### 5.2. Cập nhật Types trong `src/features/registration_management/types/registration.types.ts`

```typescript
export type AdvisorRegistrationStatus =
  | 'PENDING'
  | 'TEACHER_APPROVED'
  | 'HOD_APPROVED'
  | 'REJECTED'
  | 'ASSIGNED_BY_HOD'

export type AdvisorRegistrationDeadlineStatus =
  | 'NOT_CONFIGURED'
  | 'INACTIVE'
  | 'NOT_STARTED'
  | 'CLOSED'
  | 'OPEN'

export interface AvailableAdvisor {
  teacherPublicId: string
  teacherCode: string | null
  teacherName: string | null
  academicTitle: string | null
  organization: string | null
  majorName: string | null
  maxStudents: number
  occupiedStudents: number
  remainingSlots: number
  pendingCount: number
}

export interface AdvisorRegistrationResponse {
  registrationPublicId: string
  studentPublicId: string | null
  semesterPublicId: string | null
  teacherPublicId: string
  studentCode: string | null
  studentName: string | null
  majorName: string | null
  teacherCode: string | null
  teacherName: string | null
  topicName: string | null
  status: AdvisorRegistrationStatus
  statusDescription: string | null
  submittedAt: string | null
  processedAt: string | null
}

export interface SubmitAdvisorRegistrationRequest {
  teacherPublicId: string
  topicName?: string | null
}

export interface UpdateAdvisorRegistrationRequest {
  semesterPublicId: string
  teacherPublicId: string
  topicName?: string | null
}

export interface RegistrationOverviewResponse {
  semesterPublicId: string
  mentorName: string | null
  topicName: string | null
  deadlineName: string | null
  deadlineStartDate: string | null
  deadlineEndDate: string | null
  deadlineActive: boolean | null
  deadlineStatus: AdvisorRegistrationDeadlineStatus | null
}
```

### 5.3. Cách sử dụng `useAdvisorRegistration.ts` (đã có sẵn)

```typescript
// Lấy học kỳ hiện tại & danh sách các học kỳ (để chuyển đổi học kỳ trên dropdown)
const { data: currentSemester } = useCurrentSemester()
const { data: semesters = [] } = useSemesters()

// Tổng quan (GVHD, đề tài chính thức & deadline) theo học kỳ đang chọn
const { data: overview } = useRegistrationOverview(selectedSemesterPublicId)

// Lịch sử đơn đăng ký theo học kỳ đang chọn
const { data: history = [] } = useRegistrationHistory(selectedSemesterPublicId)

// Đơn mới nhất của học kỳ hiện tại (dùng kiểm tra nhanh trạng thái PENDING / REJECTED)
const { data: currentRegistration } = useCurrentRegistration()

// Danh sách GVHD còn chỉ tiêu (chỉ gọi khi đang xem học kỳ hiện tại)
const { data: advisors = [] } = useAvailableAdvisors(
  isCurrentSemester ? currentSemester?.publicId : undefined,
)

// Submit / Update tự động invalidate toàn bộ registrationKeys.all
const submitMutation = useSubmitRegistration()
const updateMutation = useUpdateRegistration()
```

---

## 6. Logic Hiển thị Giao diện Người dùng (UI/UX Checklist)

1. **Kiểm tra khả năng Tạo mới / Chỉnh sửa theo thời hạn & học kỳ**:
   - Chỉ cho phép Tạo đơn (`POST`) hoặc Sửa đơn (`PUT`) khi:
     ```typescript
     const isCurrentSemester = !!currentSemester?.publicId && selectedSemesterPublicId === currentSemester.publicId
     const isDeadlineOpen = overview?.deadlineStatus === 'OPEN'
     ```
   - Khi `overview?.deadlineStatus` là `'CLOSED'`, `'NOT_STARTED'`, `'INACTIVE'` hoặc `'NOT_CONFIGURED'`:
     - Khóa/ẩn nút **Tạo đơn mới** và nút **Chỉnh sửa đơn** trên bảng lịch sử lẫn card tổng quan (hiển thị lý do tương ứng cho sinh viên).
   - Khi `overview?.deadlineActive === null` (lúc `deadlineStatus === 'NOT_CONFIGURED'`): kiểm tra null-safe `Boolean(overview?.deadlineActive)` thay vì kiểm tra `!overview.deadlineActive` khiến UI hiểu nhầm là `"Đã khóa"` thay vì `"Chưa thiết lập"`.

2. **Điều kiện nút hành động chính theo trạng thái đơn**:
   - Đã có GVHD chính thức (`!!overview?.mentorName` hoặc có đơn `HOD_APPROVED` / `ASSIGNED_BY_HOD`): **Khóa nút**, hiển thị *"Đã có GVHD"*.
   - Đơn mới nhất là `TEACHER_APPROVED`: **Khóa nút**, hiển thị *"Đang chờ TBM chốt danh sách"*.
   - Đơn mới nhất là `PENDING` (và `isDeadlineOpen`): mở modal chế độ **Cập nhật** (`PUT /api/student/advisor-registrations`), điền sẵn `teacherPublicId` & `topicName`, chú ý khi `PUT` thành công gọi invalidate cache để cập nhật lại danh sách GVHD còn chỉ tiêu.
   - Chưa có đơn (`history.length === 0`) hoặc đơn mới nhất là `REJECTED` (và `isDeadlineOpen`): mở modal chế độ **Tạo mới** (`POST /api/student/advisor-registrations`).

3. **Validate form nộp/sửa đơn**:
   - `teacherPublicId`: Bắt buộc chọn 1 GVHD từ `useAvailableAdvisors`.
   - `topicName`: Cho phép để trống. Nếu nhập thì kiểm tra `topicName.trim().length <= 500`.

4. **Đồng bộ Realtime với SSE (`/connection`)**:
   - Khi nhận sự kiện `notification` từ kênh SSE (GVHD từ chối, GVHD duyệt người khác khiến hết chỉ tiêu dẫn đến tự động `REJECTED`, hết hạn đăng ký, hoặc TBM chốt danh sách chính thức), Frontend nên gọi `queryClient.invalidateQueries({ queryKey: registrationKeys.all })` để tự động làm mới trạng thái đơn, GVHD chính thức và danh sách giảng viên còn chỉ tiêu mà không cần F5.

