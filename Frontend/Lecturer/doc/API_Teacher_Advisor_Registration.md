# Tài Liệu Kết Nối FE - BE: Quản Lý Đơn Đăng Ký Giảng Viên Hướng Dẫn (Phía Giảng Viên - Bước 3)

Tài liệu này mô tả chi tiết chuẩn giao tiếp API giữa **Frontend Lecturer** (`D:\Đồ án\code\FE\Graduation-Project-Management-System\Frontend\Lecturer`) và **Backend TLU GPMS** (`TeacherAdvisorRegistrationController`) cho 5 chức năng xử lý nguyện vọng đăng ký Giảng viên hướng dẫn (GVHD) ở **Giai đoạn 1 — Bước 3: Giảng viên tiếp nhận & Phê duyệt cấp 1**.

---

## 1. Tổng Quan & Quy Tắc Chung

### 1.1. Base URL & Endpoints
- **Axios Client**: Sử dụng `apiClient` từ `@/shared/api/client` (`withCredentials: true`, tự động đính kèm Cookie `access_token` và tự động refresh token khi gặp `401`).
- **Khai báo Endpoint**: Đã cấu hình sẵn trong `src/shared/api/endpoints.ts` tại nhánh `API_ENDPOINTS.lecturer`:

```ts
lecturer: {
  // 1. GET: Lấy danh sách đơn đăng ký theo học kỳ, trạng thái và từ khóa
  base: '/api/teacher/advisor-registrations',

  // 5. GET: Lấy thời hạn đăng ký GVHD theo học kỳ
  deadline: '/api/teacher/advisor-registrations/deadline',

  // 2. GET: Xem chi tiết đơn đăng ký
  detail: (publicId: string) => `/api/teacher/advisor-registrations/${publicId}`,

  // 3. PATCH: Duyệt đơn đăng ký
  approve: (publicId: string) => `/api/teacher/advisor-registrations/${publicId}/approve`,

  // 4. PATCH: Từ chối đơn đăng ký
  reject: (publicId: string) => `/api/teacher/advisor-registrations/${publicId}/reject`,
}
```

> **Lưu ý cấu hình `VITE_API_BASE_URL`**:
> Các đường dẫn trong `API_ENDPOINTS.lecturer` đã có tiền tố `/api/teacher/...`. Vì vậy `VITE_API_BASE_URL` trong `.env.local` cần trỏ tới gốc máy chủ Backend (ví dụ `http://localhost:8080`), tránh đặt `http://localhost:8080/api` gây lặp `/api/api/teacher/...`.

### 1.2. Chuẩn Wrapper Phản Hồi (`APIResponse<T>`)
Tất cả 5 API trong `TeacherAdvisorRegistrationController` đều trả về chuẩn wrapper `APIResponse<T>` (`src/shared/types/index.ts`):

```ts
export interface ApiResponse<T = unknown> {
  code: number      // 1000 = Thành công
  message?: string  // Thông báo tiếng Việt (có mặt ở API approve, reject và khi lỗi)
  data: T           // Payload dữ liệu thực tế
}
```

> **Cảnh báo quan trọng khi đọc dữ liệu từ `apiClient`**:
> Response interceptor (`src/shared/api/interceptors.ts`) kiểm tra `response.data.code === 1000` nhưng **giữ nguyên `response.data` là `ApiResponse<T>`** (không tự động bóc lớp `.data` bên trong).
> Do đó, ở tầng Service (`supervisorRegistration.service.ts` và `supervisorDeadline.service.ts`), bắt buộc phải truy cập **`response.data.data`** thay vì `response.data`. (Xem chi tiết mục **4. Hướng dẫn cập nhật Code FE hiện tại** bên dưới).

### 1.3. Phân Quyền (Authorization)
- **API xem danh sách, xem chi tiết, xem hạn đăng ký**: Yêu cầu quyền `VIEW_ADVISOR_REQUEST` hoặc role `SUPERVISOR`.
- **API duyệt đơn, từ chối đơn**: Yêu cầu quyền `REVIEW_ADVISOR_REQUEST` hoặc role `SUPERVISOR`.
- **Cô lập dữ liệu theo giảng viên**: Backend tự động lấy tài khoản giảng viên đang đăng nhập qua `AuthenticationService.getAccountInfo()`. Giảng viên **chỉ nhìn thấy và chỉ được xử lý** các đơn đăng ký gửi cho chính mình (`lecturer.id == currentTeacher.id`).

---

## 2. Sơ Đồ Luồng Nghiệp Vụ & Trạng Thái Đơn

```
                     ┌──────────────────────────────────────┐
                     │        PENDING (Chờ GV duyệt)        │
                     └──────┬────────────────────────┬──────┘
                            │                        │
     GV bấm "Duyệt"         │                        │  1. GV bấm "Từ chối" (PATCH .../reject)
  (PATCH .../approve)       │                        │  2. Tự động từ chối khi GV vừa đủ quota
  [Khi còn chỉ tiêu &       │                        │  3. Tự động từ chối khi hết hạn DANG_KY_GVHD
   trong hạn DANG_KY_GVHD]  ▼                        ▼
              ┌──────────────────────────┐  ┌──────────────────────────┐
              │     TEACHER_APPROVED     │  │         REJECTED         │
              │ (GV đã duyệt - Chờ TBM)  │  │       (Bị từ chối)       │
              └──────────────────────────┘  └──────────────────────────┘
              (Không gửi thông báo cho SV   (Hệ thống tự động gửi thông báo
               ở bước này; chờ TBM chốt)     real-time SSE cho sinh viên)
```

### Quy tắc nghiệp vụ tự động ở Backend cần lưu ý trên UI:
1. **Tự động từ chối các đơn chờ còn lại khi GV vừa đủ chỉ tiêu (Quota)**:
   - Khi giảng viên bấm **Duyệt** 1 đơn (`PENDING` -> `TEACHER_APPROVED`), nếu tổng số chỗ đã chiếm của giảng viên đó trong học kỳ (`TEACHER_APPROVED` + `HOD_APPROVED` + `ASSIGNED_BY_HOD` + số đề tài đứng tên Đồng hướng dẫn `coLecturer`) **chạm mốc chỉ tiêu tối đa (`maxStudents`)**, Backend sẽ **tự động chuyển toàn bộ các đơn `PENDING` còn lại của giảng viên đó sang `REJECTED`** và gửi thông báo cho từng sinh viên bị từ chối.
   - Do đó, sau khi gọi API `approve` thành công, FE cần gọi lại API `getRequests` để cập nhật lại danh sách và bộ đếm (`pendingCount`, `approvedCount`, `rejectedCount`).
2. **Tự động từ chối khi hết hạn `DANG_KY_GVHD`**:
   - Khi quá `endDate` của mốc `DANG_KY_GVHD`, tiến trình ngầm của Backend tự động chuyển mọi đơn `PENDING` còn tồn đọng sang `REJECTED` và gửi thông báo cho sinh viên.

---

## 3. Chi Tiết Từng API Theo 5 Chức Năng

---

### Chức năng 1: Hiển thị danh sách đơn đăng ký hướng dẫn của sinh viên theo học kỳ và trạng thái
*(Chỉ hiển thị các đơn đăng ký gửi cho giảng viên hướng dẫn đang đăng nhập, kèm số lượng thống kê theo từng tab)*

- **Endpoint**: `GET /api/teacher/advisor-registrations`
- **Hằng số FE**: `API_ENDPOINTS.lecturer.base`
- **Query Parameters**:
  | Tham số | Kiểu | Bắt buộc | Mô tả |
  | :--- | :--- | :---: | :--- |
  | `semesterPublicId` | `string` (UUID) | **Có** | Mã định danh công khai của học kỳ cần tra cứu |
  | `status` | `ApiRegistrationStatus` | Không | Lọc theo trạng thái đơn. Nếu bỏ trống hoặc không truyền -> lấy **Tất cả** trạng thái. Các giá trị hợp lệ: `PENDING`, `TEACHER_APPROVED`, `REJECTED`, `HOD_APPROVED`, `ASSIGNED_BY_HOD` |
  | `keyword` | `string` | Không | Tìm kiếm không phân biệt hoa thường theo **Mã sinh viên (`studentCode`)** hoặc **Họ và tên sinh viên (`firstName + ' ' + lastName`)** |

> **Lưu ý về bộ đếm (`pendingCount`, `approvedCount`, `rejectedCount`, `totalCount`)**:
> Dù FE có truyền `status` hay `keyword` để lọc danh sách `registrations`, 4 trường đếm `pendingCount`, `approvedCount`, `rejectedCount`, `totalCount` do BE trả về **luôn là tổng số lượng đơn thực tế của giảng viên trong học kỳ đó** để hiển thị chính xác trên badge của 4 Tab (`Chưa duyệt`, `Đã duyệt`, `Đã từ chối`, `Tất cả`).
> Thứ tự danh sách `registrations`: Sắp xếp giảm dần theo `submittedAt DESC, id DESC` (đơn nộp mới nhất lên đầu).

- **Response thành công (`200 OK`)**:
```json
{
  "code": 1000,
  "data": {
    "registrations": [
      {
        "registrationPublicId": "0195f3e2-8d44-7b21-9f0a-1a2b3c4d5e6f",
        "studentPublicId": "0195f100-1111-7000-8000-000000000010",
        "semesterPublicId": "0195f000-0000-7000-8000-000000000001",
        "teacherPublicId": "0195f000-2222-7000-8000-000000000002",
        "studentCode": "2151170555",
        "studentName": "Nguyễn Văn An",
        "majorName": "Kỹ thuật phần mềm",
        "teacherCode": "GV001",
        "teacherName": "TS. Nguyễn Văn A",
        "topicName": "Xây dựng hệ thống quản lý đồ án tốt nghiệp TLU",
        "status": "PENDING",
        "statusDescription": "Chờ giảng viên xác nhận",
        "submittedAt": "2026-03-03T08:30:00",
        "processedAt": null
      }
    ],
    "pendingCount": 3,
    "approvedCount": 2,
    "rejectedCount": 1,
    "totalCount": 6
  }
}
```

- **Các lỗi có thể gặp**:
  | HTTP Status | Mã `code` | `ErrorCode` | `message` trả về | Nguyên nhân |
  | :---: | :---: | :--- | :--- | :--- |
  | `404` | `4041` | `SEMESTER_NOT_FOUND` | `"Không tìm thấy học kỳ"` | `semesterPublicId` không tồn tại |
  | `404` | `3009` | `TEACHER_NOT_FOUND` | `"Không tìm thấy giáo viên"` | Tài khoản đang đăng nhập chưa gắn hồ sơ `Teacher` |
  | `400` | `1006` | `INVALID_REQUEST` | `"Yêu cầu không hợp lệ"` | Giá trị `status` truyền lên không thuộc enum `RegistrationStatus` hoặc sai định dạng UUID |

---

### Chức năng 2: Xem chi tiết đơn đăng ký của sinh viên
*(Chỉ xem được đơn đăng ký gửi cho chính giảng viên đang đăng nhập)*

- **Endpoint**: `GET /api/teacher/advisor-registrations/{publicId}`
- **Hằng số FE**: `API_ENDPOINTS.lecturer.detail(publicId)`
- **Path Parameters**:
  | Tham số | Kiểu | Bắt buộc | Mô tả |
  | :--- | :--- | :---: | :--- |
  | `publicId` | `string` (UUID) | **Có** | `registrationPublicId` của đơn đăng ký cần xem |

- **Response thành công (`200 OK`)**:
```json
{
  "code": 1000,
  "data": {
    "registrationPublicId": "0195f3e2-8d44-7b21-9f0a-1a2b3c4d5e6f",
    "studentPublicId": "0195f100-1111-7000-8000-000000000010",
    "semesterPublicId": "0195f000-0000-7000-8000-000000000001",
    "teacherPublicId": "0195f000-2222-7000-8000-000000000002",
    "studentCode": "2151170555",
    "studentName": "Nguyễn Văn An",
    "majorName": "Kỹ thuật phần mềm",
    "teacherCode": "GV001",
    "teacherName": "TS. Nguyễn Văn A",
    "topicName": "Xây dựng hệ thống quản lý đồ án tốt nghiệp TLU",
    "status": "PENDING",
    "statusDescription": "Chờ giảng viên xác nhận",
    "submittedAt": "2026-03-03T08:30:00",
    "processedAt": null
  }
}
```

- **Các lỗi có thể gặp**:
  | HTTP Status | Mã `code` | `ErrorCode` | `message` trả về | Nguyên nhân |
  | :---: | :---: | :--- | :--- | :--- |
  | `404` | `3022` | `REGISTRATION_NOT_FOUND` | `"Không tìm thấy đơn đăng ký hoặc bạn không có quyền truy cập"` | `publicId` không tồn tại hoặc đơn thuộc về giảng viên khác |
  | `404` | `3009` | `TEACHER_NOT_FOUND` | `"Không tìm thấy giáo viên"` | Tài khoản đang đăng nhập chưa gắn hồ sơ `Teacher` |

---

### Chức năng 3: Duyệt đơn đăng ký hướng dẫn của sinh viên
*(Chỉ được duyệt khi đơn đang ở trạng thái `PENDING`, học kỳ `ONGOING`, TBM chưa khóa phân công, đang trong hạn `DANG_KY_GVHD`, và giảng viên còn chỉ tiêu hướng dẫn)*

- **Endpoint**: `PATCH /api/teacher/advisor-registrations/{publicId}/approve`
- **Hằng số FE**: `API_ENDPOINTS.lecturer.approve(publicId)`
- **Path Parameters**:
  - `publicId` (`string` - UUID, **bắt buộc**): `registrationPublicId` của đơn đăng ký cần duyệt.
- **Request Body**: Không có body.

- **Response thành công (`200 OK`)**:
```json
{
  "code": 1000,
  "message": "Duyệt đơn đăng ký giảng viên hướng dẫn thành công",
  "data": {
    "registrationPublicId": "0195f3e2-8d44-7b21-9f0a-1a2b3c4d5e6f",
    "studentPublicId": "0195f100-1111-7000-8000-000000000010",
    "semesterPublicId": "0195f000-0000-7000-8000-000000000001",
    "teacherPublicId": "0195f000-2222-7000-8000-000000000002",
    "studentCode": "2151170555",
    "studentName": "Nguyễn Văn An",
    "majorName": "Kỹ thuật phần mềm",
    "teacherCode": "GV001",
    "teacherName": "TS. Nguyễn Văn A",
    "topicName": "Xây dựng hệ thống quản lý đồ án tốt nghiệp TLU",
    "status": "TEACHER_APPROVED",
    "statusDescription": "Giảng viên đã đồng ý hướng dẫn",
    "submittedAt": "2026-03-03T08:30:00",
    "processedAt": "2026-03-04T14:20:00"
  }
}
```

- **Các điều kiện kiểm tra & mã lỗi tại Backend**:
  | HTTP Status | Mã `code` | `ErrorCode` | `message` trả về | Nguyên nhân |
  | :---: | :---: | :--- | :--- | :--- |
  | `404` | `3022` | `REGISTRATION_NOT_FOUND` | `"Không tìm thấy đơn đăng ký hoặc bạn không có quyền truy cập"` | Đơn không tồn tại hoặc không thuộc giảng viên hiện tại |
  | `400` | `4000` | `REGISTRATION_STATUS_INVALID` | `"Đơn đăng ký này đã được xử lý trước đó"` | Đơn không còn ở trạng thái `PENDING` |
  | `403` | `2001` | `FORBIDDEN` | `"Học kỳ không còn trong thời gian xử lý đơn đăng ký GVHD"` | Học kỳ của đơn không ở trạng thái `ONGOING` |
  | `400` | `4000` | `ASSIGNMENT_ALREADY_LOCKED` | `"Danh sách phân công đã bị khóa, không thể thao tác"` | TBM đã khóa danh sách phân công GVHD của học kỳ |
  | `403` | `2001` | `FORBIDDEN` | `"Đã hết thời hạn xử lý đơn đăng ký GVHD"` | Mốc `DANG_KY_GVHD` chưa mở, đã đóng hoặc bị vô hiệu hóa |
  | `400` | `4000` | `TEACHER_NOT_ASSIGNED_IN_SEMESTER` | `"Giảng viên chưa được phân bổ quota trong học kỳ này"` | Giảng viên không có bản ghi `SemesterAdvisor` trong kỳ |
  | `400` | `1006` | `INVALID_REQUEST` | `"Quota hướng dẫn của giảng viên hiện không hoạt động"` | Bản ghi `SemesterAdvisor` đang `INACTIVE` |
  | `400` | `1006` | `INVALID_REQUEST` | `"Quota hướng dẫn của giảng viên chưa được cấu hình hợp lệ"` | `maxStudents == null` hoặc `maxStudents <= 0` |
  | `400` | `4000` | `ADVISOR_QUOTA_EXCEEDED` | `"Giảng viên đã đủ số lượng sinh viên hướng dẫn, không thể duyệt đơn"` | Số sinh viên đã nhận (`occupiedSlots`) đã đạt tối đa `maxStudents` |

---

### Chức năng 4: Từ chối đơn đăng ký hướng dẫn của sinh viên
*(Từ chối đơn đang `PENDING` trong hạn `DANG_KY_GVHD` và tự động gửi thông báo real-time về phía sinh viên)*

- **Endpoint**: `PATCH /api/teacher/advisor-registrations/{publicId}/reject`
- **Hằng số FE**: `API_ENDPOINTS.lecturer.reject(publicId)`
- **Path Parameters**:
  - `publicId` (`string` - UUID, **bắt buộc**): `registrationPublicId` của đơn đăng ký cần từ chối.
- **Request Body**: Không có body (không yêu cầu nhập lý do từ chối).
- **Hành vi gửi thông báo**:
  Ngay khi chuyển trạng thái sang `REJECTED`, Backend tự động gọi `notificationService.pushNotification(...)` gửi thông báo đến tài khoản của sinh viên với nội dung:
  > *"Đơn đăng ký giảng viên hướng dẫn của bạn đã bị từ chối. Vui lòng kiểm tra thông tin đơn đăng ký."*

- **Response thành công (`200 OK`)**:
```json
{
  "code": 1000,
  "message": "Từ chối đơn đăng ký giảng viên hướng dẫn thành công",
  "data": {
    "registrationPublicId": "0195f3e2-8d44-7b21-9f0a-1a2b3c4d5e6f",
    "studentPublicId": "0195f100-1111-7000-8000-000000000010",
    "semesterPublicId": "0195f000-0000-7000-8000-000000000001",
    "teacherPublicId": "0195f000-2222-7000-8000-000000000002",
    "studentCode": "2151170555",
    "studentName": "Nguyễn Văn An",
    "majorName": "Kỹ thuật phần mềm",
    "teacherCode": "GV001",
    "teacherName": "TS. Nguyễn Văn A",
    "topicName": "Xây dựng hệ thống quản lý đồ án tốt nghiệp TLU",
    "status": "REJECTED",
    "statusDescription": "Đơn đăng ký đã bị từ chối",
    "submittedAt": "2026-03-03T08:30:00",
    "processedAt": "2026-03-04T14:25:00"
  }
}
```

- **Các điều kiện kiểm tra & mã lỗi tại Backend**:
  | HTTP Status | Mã `code` | `ErrorCode` | `message` trả về | Nguyên nhân |
  | :---: | :---: | :--- | :--- | :--- |
  | `404` | `3022` | `REGISTRATION_NOT_FOUND` | `"Không tìm thấy đơn đăng ký hoặc bạn không có quyền truy cập"` | Đơn không tồn tại hoặc không thuộc giảng viên hiện tại |
  | `400` | `4000` | `REGISTRATION_STATUS_INVALID` | `"Đơn đăng ký này đã được xử lý trước đó"` | Đơn không còn ở trạng thái `PENDING` |
  | `403` | `2001` | `FORBIDDEN` | `"Học kỳ không còn trong thời gian xử lý đơn đăng ký GVHD"` | Học kỳ của đơn không ở trạng thái `ONGOING` |
  | `400` | `4000` | `ASSIGNMENT_ALREADY_LOCKED` | `"Danh sách phân công đã bị khóa, không thể thao tác"` | TBM đã khóa danh sách phân công GVHD của học kỳ |
  | `403` | `2001` | `FORBIDDEN` | `"Đã hết thời hạn xử lý đơn đăng ký GVHD"` | Mốc `DANG_KY_GVHD` chưa mở, đã đóng hoặc bị vô hiệu hóa |
  | `404` | `3008` | `STUDENT_NOT_FOUND` | `"Không tìm thấy tài khoản sinh viên để gửi thông báo"` | Sinh viên của đơn chưa liên kết với `Account` |

---

### Chức năng 5: Lấy ra hạn đăng ký giảng viên hướng dẫn
*(Lấy thông tin mốc thời hạn `DANG_KY_GVHD` của học kỳ đang chọn để hiển thị đồng hồ đếm ngược / trạng thái mở-đóng trên thanh công cụ)*

- **Endpoint**: `GET /api/teacher/advisor-registrations/deadline`
- **Hằng số FE**: `API_ENDPOINTS.lecturer.deadline`
- **Query Parameters**:
  | Tham số | Kiểu | Bắt buộc | Mô tả |
  | :--- | :--- | :---: | :--- |
  | `semesterPublicId` | `string` (UUID) | **Có** | Mã định danh công khai của học kỳ cần kiểm tra hạn |

- **Response thành công (`200 OK`)**:
```json
{
  "code": 1000,
  "data": {
    "semesterPublicId": "0195f000-0000-7000-8000-000000000001",
    "name": "Đăng ký giảng viên hướng dẫn",
    "startDate": "2026-03-01T00:00:00",
    "endDate": "2026-03-15T23:59:59",
    "isActive": true,
    "status": "OPEN"
  }
}
```

- **Ý nghĩa các giá trị `status` của Deadline**:
  | Giá trị `status` | Điều kiện tại Backend | Ý nghĩa hiển thị trên UI Giảng viên | Cho phép bấm Duyệt / Từ chối? |
  | :--- | :--- | :--- | :---: |
  | `OPEN` | `isActive == true` và `startDate <= now <= endDate` | Đang trong hạn xử lý đơn (hiển thị ngày hết hạn & số ngày còn lại) | **Có** |
  | `NOT_CONFIGURED` | Chưa tạo mốc `DANG_KY_GVHD` cho học kỳ (`name`, `startDate`, `endDate`, `isActive` đều `null`) | Chưa cấu hình thời hạn đăng ký GVHD | Không |
  | `INACTIVE` | `isActive == false` | Thời hạn đăng ký GVHD đang tạm khóa / vô hiệu hóa | Không |
  | `NOT_STARTED` | `now < startDate` | Chưa đến thời gian mở đăng ký GVHD | Không |
  | `CLOSED` | `now > endDate` | Đã hết hạn đăng ký và duyệt nguyện vọng GVHD | Không |

- **Các lỗi có thể gặp**:
  | HTTP Status | Mã `code` | `ErrorCode` | `message` trả về | Nguyên nhân |
  | :---: | :---: | :--- | :--- | :--- |
  | `404` | `4041` | `SEMESTER_NOT_FOUND` | `"Không tìm thấy học kỳ"` | `semesterPublicId` không tồn tại |

---

## 4. Hướng Dẫn Cập Nhật Code FE Hiện Tại (`src/features/lecturer/supervisor_registration`)

Qua rà soát code hiện tại trong `Frontend\Lecturer\src\features\lecturer\supervisor_registration\`, có **3 điểm cần đồng bộ** để khớp 100% với Backend sau khi chuẩn hóa `APIResponse<T>`:

### 4.1. Cập nhật `types/supervisorRegistration.types.ts`
Backend trả về trường `teacherPublicId: string` trong `AdvisorRegistrationResponse` (thay vì `semesterAdvisorPublicId`):

```ts
// File: src/features/lecturer/supervisor_registration/types/supervisorRegistration.types.ts

export interface AdvisorRegistrationResponse {
  registrationPublicId: string
  studentPublicId: string
  semesterPublicId: string
  teacherPublicId: string | null // Đồng bộ với BE AdvisorRegistrationResponse.teacherPublicId

  studentCode: string
  studentName: string
  majorName: string | null

  teacherCode: string | null
  teacherName: string | null

  topicName: string | null

  status: ApiRegistrationStatus
  statusDescription: string

  submittedAt: string | null
  processedAt: string | null
}
```

### 4.2. Cập nhật `services/supervisorRegistration.service.ts` (Bóc `response.data.data`)
Tất cả 4 hàm trong `supervisorRegistrationService` cần khai báo generic `ApiResponse<...>` và trả về `response.data.data`:

```ts
// File: src/features/lecturer/supervisor_registration/services/supervisorRegistration.service.ts
import apiClient from '@/shared/api/client'
import { API_ENDPOINTS } from '@/shared/api/endpoints'
import type { ApiResponse } from '@/shared/types'

import type {
  SupervisorRequestItem,
  SupervisorRequestCounts,
  SupervisorTabStatus,
  AdvisorRegistrationResponse,
  TeacherAdvisorRegistrationListResponse,
  ApiRegistrationStatus,
} from '../types/supervisorRegistration.types'

export interface GetSupervisorRequestsParams {
  semesterPublicId: string
  status?: SupervisorTabStatus
  keyword?: string
}

const mapStatus = (
  status: ApiRegistrationStatus,
): SupervisorRequestItem['status'] => {
  switch (status) {
    case 'PENDING':
      return 'pending'
    case 'REJECTED':
      return 'rejected'
    case 'TEACHER_APPROVED':
    case 'HOD_APPROVED':
    case 'ASSIGNED_BY_HOD':
      return 'approved'
    default:
      return 'pending'
  }
}

const mapRequest = (
  item: AdvisorRegistrationResponse,
): SupervisorRequestItem => {
  const status = mapStatus(item.status)

  return {
    id: item.registrationPublicId,
    mssv: item.studentCode,
    name: item.studentName,
    major: item.majorName ?? '',
    topic: item.topicName ?? '',
    submittedDate: item.submittedAt ?? '',
    processedAt: item.processedAt ?? undefined,
    status,
    email: '',
    phone: '',
    note: '',
  }
}

export const supervisorRegistrationService = {
  // 1. Lấy danh sách yêu cầu đăng ký GVHD theo học kỳ, trạng thái và từ khóa
  getRequests: async (
    params: GetSupervisorRequestsParams,
  ): Promise<{
    items: SupervisorRequestItem[]
    counts: SupervisorRequestCounts
  }> => {
    const response = await apiClient.get<
      ApiResponse<TeacherAdvisorRegistrationListResponse>
    >(API_ENDPOINTS.lecturer.base, {
      params: {
        semesterPublicId: params.semesterPublicId,
        status: params.status
          ? params.status.toUpperCase() === 'APPROVED'
            ? 'TEACHER_APPROVED'
            : params.status.toUpperCase()
          : undefined,
        keyword: params.keyword?.trim() || undefined,
      },
    })

    const data = response.data.data

    return {
      items: (data?.registrations ?? []).map(mapRequest),
      counts: {
        pending: data?.pendingCount ?? 0,
        approved: data?.approvedCount ?? 0,
        rejected: data?.rejectedCount ?? 0,
        all: data?.totalCount ?? 0,
      },
    }
  },

  // 2. Xem chi tiết đơn đăng ký của sinh viên
  getRequestDetail: async (
    id: string,
  ): Promise<AdvisorRegistrationResponse> => {
    const response = await apiClient.get<
      ApiResponse<AdvisorRegistrationResponse>
    >(API_ENDPOINTS.lecturer.detail(id))

    return response.data.data
  },

  // 3. Duyệt đơn đăng ký hướng dẫn của sinh viên
  approveRequest: async (id: string): Promise<AdvisorRegistrationResponse> => {
    const response = await apiClient.patch<
      ApiResponse<AdvisorRegistrationResponse>
    >(API_ENDPOINTS.lecturer.approve(id))

    return response.data.data
  },

  // 4. Từ chối đơn đăng ký hướng dẫn của sinh viên
  rejectRequest: async (id: string): Promise<AdvisorRegistrationResponse> => {
    const response = await apiClient.patch<
      ApiResponse<AdvisorRegistrationResponse>
    >(API_ENDPOINTS.lecturer.reject(id))

    return response.data.data
  },
}
```

### 4.3. Cập nhật `services/supervisorDeadline.service.ts` (Bóc `response.data.data`)

```ts
// File: src/features/lecturer/supervisor_registration/services/supervisorDeadline.service.ts
import apiClient from '@/shared/api/client'
import { API_ENDPOINTS } from '@/shared/api/endpoints'
import type { ApiResponse } from '@/shared/types'

export interface RegistrationDeadline {
  semesterPublicId: string
  name: string | null
  startDate: string | null
  endDate: string | null
  isActive: boolean | null
  status:
    | 'NOT_CONFIGURED'
    | 'INACTIVE'
    | 'NOT_STARTED'
    | 'CLOSED'
    | 'OPEN'
}

export const supervisorDeadlineService = {
  // 5. Lấy hạn đăng ký GVHD theo học kỳ
  getRegistrationDeadline: async (
    semesterPublicId: string,
  ): Promise<RegistrationDeadline> => {
    const response = await apiClient.get<ApiResponse<RegistrationDeadline>>(
      API_ENDPOINTS.lecturer.deadline,
      {
        params: {
          semesterPublicId,
        },
      },
    )

    return response.data.data
  },
}
```

### 4.4. Lưu ý xử lý Toast lỗi trong `hooks/useSupervisorRequests.ts`
Trong `src/shared/api/interceptors.ts`, mọi lỗi HTTP `400/403/404/500` hoặc `code !== 1000` đã được interceptor **tự động hiển thị `toast.error(apiError.message, 3000)`** với đúng thông báo tiếng Việt từ Backend (ví dụ: *"Giảng viên đã đủ số lượng sinh viên hướng dẫn, không thể duyệt đơn"* hoặc *"Đã hết thời hạn xử lý đơn đăng ký GVHD"*).
Do đó trong `useSupervisorRequests.ts`:
- Không cần gọi thêm `toast.error('Không thể duyệt yêu cầu. Vui lòng thử lại!')` trong khối `catch` của `handleConfirmApprove` và `handleConfirmReject` để tránh bị hiện 2 thông báo lỗi chồng nhau.
- Sau khi `approveRequest` hoặc `rejectRequest` hoàn tất (hoặc ngay cả khi gặp lỗi `400/403` do đơn đã được tự động xử lý), đóng modal xác nhận (`setApproveTarget(null)` / `setRejectTarget(null)`) để giảng viên thấy trạng thái mới nhất của bảng.

---

## 5. Checklist Kiểm Thử Tích Hợp FE - BE

1. **Hiển thị danh sách & bộ đếm theo học kỳ**:
   - Chọn học kỳ từ dropdown -> FE gọi song song `GET /api/teacher/advisor-registrations/deadline?semesterPublicId=...` và `GET /api/teacher/advisor-registrations?semesterPublicId=...&status=PENDING`.
   - Badge trên 4 tab (`Chưa duyệt`, `Đã duyệt`, `Đã từ chối`, `Tất cả`) hiển thị đúng `pendingCount`, `approvedCount`, `rejectedCount`, `totalCount`.
   - Khi chuyển sang tab `Đã duyệt`, tham số `status=TEACHER_APPROVED` được gửi lên BE; khi chuyển sang tab `Tất cả`, không truyền `status`.
   - Khi gõ vào ô tìm kiếm mã SV hoặc tên SV, tham số `keyword` được gửi lên BE và lọc danh sách khớp kết quả.
2. **Xem hạn đăng ký GVHD**:
   - Khi `deadline.status === 'OPEN'`, hiển thị ngày hết hạn (`endDate`) và số ngày còn lại.
   - Khi `deadline.status` là `CLOSED`, `NOT_STARTED`, `INACTIVE` hoặc `NOT_CONFIGURED`, hiển thị trạng thái tương ứng (có thể disable nút `Duyệt` / `Từ chối` trên UI hoặc để BE chặn với mã `403`).
3. **Duyệt đơn & Tự động từ chối khi đủ chỉ tiêu**:
   - Bấm **Duyệt** -> Mở `ApproveSupervisorModal` -> Bấm **Xác nhận** -> Gọi `PATCH /api/teacher/advisor-registrations/{publicId}/approve`.
   - Đơn chuyển sang `TEACHER_APPROVED`, `processedAt` cập nhật thời gian duyệt.
   - Trường hợp giảng viên có `maxStudents = 2`, đang có `1` SV đã duyệt và `3` SV đang `PENDING`: khi giảng viên duyệt thêm `1` SV (đạt `2/2`), `2` đơn `PENDING` còn lại tự động chuyển sang tab **Đã từ chối (`REJECTED`)**, `pendingCount` về `0`, và 2 sinh viên đó nhận được thông báo từ chối.
4. **Từ chối đơn & Thông báo cho sinh viên**:
   - Bấm **Từ chối** -> Mở `RejectSupervisorModal` -> Bấm **Xác nhận** -> Gọi `PATCH /api/teacher/advisor-registrations/{publicId}/reject`.
   - Đơn chuyển sang `REJECTED`, `processedAt` cập nhật thời gian xử lý, và tài khoản sinh viên nhận được thông báo real-time qua SSE (`/notification`).

