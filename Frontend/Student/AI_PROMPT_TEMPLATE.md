# MẪU PROMPT CHO AI — NỐI API BACKEND VÀO FRONTEND (PORTAL SINH VIÊN)

Dùng cho Claude Code và Antigravity khi mở folder `Frontend/Student`.
Quy trình thường gặp: **thiết kế giao diện trước → viết API Backend → test bằng Postman → dùng prompt dưới đây để AI nối vào FE.**

---

## 1. AI biết viết code ở đâu nhờ đâu?

Bạn **không cần** ghi tên từng file. AI tự biết nhờ 3 lớp (giống Spring Boot "convention over configuration"):

| Lớp                       | Nạp khi nào                  | Trả lời câu hỏi                                                             |
| ------------------------- | ---------------------------- | --------------------------------------------------------------------------- |
| `AGENTS.md`               | Tự nạp mọi phiên             | Feature đặt ở đâu, page/route/menu nằm file nào, quy tắc gọi API và báo lỗi |
| Skill (`.agents/skills/`) | Khi yêu cầu khớp mô tả skill | Làm từng bước thế nào + code mẫu hoàn chỉnh trong `templates/`              |
| Code đang có              | AI tự mở đọc                 | Cách viết route, menu, feature cạnh bên                                     |

Những thứ AI **không thể tự biết** và bạn phải đưa vào prompt:

1. **Tên feature** (portal này chỉ có role `student`).
2. **Code Backend thật**: Controller, DTO, ErrorCode.
3. **Quyền / trạng thái**: dữ liệu nào là "của tôi" (BE lấy từ JWT), nút nào bị khóa theo trạng thái hay hạn chót.

Ví dụ chỉ với `Feature: supervisor_registration` và Controller `@RequestMapping("/student/registration")`, AI sẽ tạo:

```
src/features/student/supervisor_registration/
├── types/registration.types.ts            ← từ DTO
├── services/registration.service.ts       ← URL lấy từ Controller
├── hooks/useSupervisorRegistration.ts     ← TanStack Query
├── components/RegistrationFormDialog.tsx  ← form đăng ký / sửa
├── pages/SupervisorRegistrationPage.tsx   ← màn hình chính
└── index.ts
+ sửa src/app/routes/student.routes.tsx                            ← đăng ký route
+ sửa src/features/student/layouts/components/studentNav.config.ts ← thêm menu
```

---

## 2. Template chính — nối tính năng mới (copy từ đây)

````markdown
Dùng skill `connect-api` (và `build-form` nếu có form) để nối API sau vào FE.

## 1. Vị trí

- Feature: <tên_feature_snake_case> (vd: supervisor_registration)
- Feature đã có màn hình chưa: <chưa có — tạo mới bằng skill create-feature | đã có — nối vào file ...>
- URL và tên menu sidebar: </student/... — "<Tên tiếng Việt>">

## 2. Code Backend

### Controller

```java
<dán nguyên file Controller, kể cả @PreAuthorize nếu có>
```

### DTO Request / Response

```java
<dán các class DTO dùng trong Controller, kể cả enum và DTO lồng nhau>
```

### Mã lỗi liên quan (trong ErrorCode.java)

```java
<dán các dòng ErrorCode mà API này có thể trả về>
```

### Ví dụ JSON thật (nếu có, lấy từ Postman)

```json
<dán 1 response thành công, nhất là API phân trang hoặc API "của tôi" khi chưa có dữ liệu (data = null)>
```

## 3. Quyền / trạng thái

- Dữ liệu của chính sinh viên: <API nào BE tự lấy sinh viên từ JWT — FE không gửi studentId>
- Nút bị khóa khi: <vd: đã có đăng ký đang chờ duyệt / GVHD đủ chỉ tiêu / quá hạn chót (trường deadline trong DTO)>
- Chỉ được sửa / hủy khi trạng thái là: <vd: PENDING>
- Thông báo thành công: "<...>"

## 4. Ghi chú

- <giao diện đã thiết kế nằm ở file nào, API nào chưa xong, mã lỗi nào cần hiện dưới ô nào...>

Không tự đoán field hay URL ngoài code mình dán; chỗ nào thiếu thì hỏi lại.
Trước khi code, liệt kê các file sẽ tạo/sửa và URL route, chờ mình xác nhận.
Làm xong chạy skill `verify-changes`.
````

---

## 3. Ví dụ đã điền đầy đủ

````markdown
Dùng skill `connect-api` và `build-form` để nối API sau vào FE.

## 1. Vị trí

- Feature: supervisor_registration
- Feature đã có màn hình chưa: chưa có — tạo mới bằng skill create-feature
- URL và tên menu sidebar: /student/registration — "Đăng ký GVHD"

## 2. Code Backend

### Controller

```java
@RestController
@RequestMapping("/student")
public class SupervisorRegistrationController {
    @GetMapping("/lecturers")
    public APIResponse<Page<SupervisorResponse>> getSupervisors(
        @RequestParam(required = false) String keyword, Pageable pageable) { ... }

    @GetMapping("/registration")
    public APIResponse<RegistrationResponse> getMyRegistration() { ... }   // null nếu chưa đăng ký

    @PostMapping("/registration")
    public APIResponse<RegistrationResponse> register(@RequestBody @Valid RegistrationRequest req) { ... }

    @PutMapping("/registration/{id}")
    public APIResponse<RegistrationResponse> update(@PathVariable Long id, @RequestBody @Valid RegistrationRequest req) { ... }

    @DeleteMapping("/registration/{id}")
    public APIResponse<Void> cancel(@PathVariable Long id) { ... }
}
```

### DTO Request / Response

```java
public class RegistrationRequest {
    @NotNull Long supervisorId;
    @NotBlank @Size(max = 200) String topicTitle;
    @Size(max = 500) String note;
}
public class SupervisorResponse {
    Long id; String code; String fullName; String email;
    String department; Integer quota; Integer acceptedCount;
}
public class RegistrationResponse {
    Long id; SupervisorSummary supervisor;   // { id, fullName }
    String topicTitle; String note;
    RegistrationStatus status;               // enum: PENDING, APPROVED, REJECTED
    String rejectReason; LocalDateTime createdAt;
}
```

### Mã lỗi liên quan

```java
SUPERVISOR_QUOTA_FULL(4001, "Giảng viên đã đủ chỉ tiêu"),
TOPIC_TITLE_EXISTED(4002, "Tên đề tài đã tồn tại"),
REGISTRATION_ALREADY_EXISTS(4003, "Bạn đã có đăng ký đang chờ duyệt"),
```

## 3. Quyền / trạng thái

- Dữ liệu của chính sinh viên: `GET/POST /student/registration` — BE lấy sinh viên từ JWT, FE không gửi studentId
- Nút "Đăng ký" bị khóa khi: GVHD đủ chỉ tiêu (`acceptedCount >= quota`) hoặc sinh viên đang có đăng ký
- Chỉ được sửa / hủy khi trạng thái là PENDING
- Thông báo thành công: "Đã gửi đăng ký GVHD" / "Đã cập nhật đăng ký" / "Đã hủy đăng ký"

## 4. Ghi chú

- Lỗi 4002 hiện dưới ô "Tên đề tài dự kiến"; 4001 và 4003 hiện dòng đỏ chung trên nút gửi

Không tự đoán field hay URL ngoài code mình dán; chỗ nào thiếu thì hỏi lại.
Trước khi code, liệt kê các file sẽ tạo/sửa và URL route, chờ mình xác nhận.
Làm xong chạy skill `verify-changes`.
````

---

## 4. Mẫu ngắn cho các trường hợp khác

### a) Thêm API vào màn hình đã có

````markdown
Dùng skill `connect-api`. Thêm chức năng <nộp đề cương / hủy đăng ký / tải biên bản ...>
vào màn hình `src/features/student/<feature>/pages/<XxxPage>.tsx`.

Controller (chỉ phần API mới):

```java
<dán method mới>
```

DTO mới (nếu có):

```java
<dán>
```

Giao diện: <nút đặt ở đâu, bị khóa khi nào, bấm xong hiện gì, có hỏi xác nhận không>

Trước khi code, liệt kê các file sẽ sửa, chờ mình xác nhận.
````

## 5. Mẹo

- **Dán code thật, đừng tóm tắt bằng lời.** "API trả đăng ký của sinh viên" kém hơn nhiều so với dán DTO.
- **Một tính năng mỗi prompt.** 3–4 API của cùng một màn hình thì ổn, không gộp cả module.
- **Test API bằng Postman trước.** BE lỗi thì FE sẽ mất công tìm lỗi sai chỗ.
- **Nói rõ API nào là "của tôi"** để AI không tự ghép `studentId` vào URL/body.
- **Chạy BE ở `http://localhost:8080`** trước khi kiểm tra trên trình duyệt (cần cookie đăng nhập để gọi API thật).
- **Luôn yêu cầu AI liệt kê file trước khi code.** Sai chỗ thì sửa ngay, đỡ phải gỡ code sau.
- **Đọc diff trước khi commit.** AI không được tự commit/push khi chưa được đồng ý.
