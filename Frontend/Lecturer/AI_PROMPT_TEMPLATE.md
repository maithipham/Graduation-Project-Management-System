# MẪU PROMPT CHO AI — NỐI API BACKEND VÀO FRONTEND

Dùng cho Claude Code và Antigravity khi mở folder `Frontend/Lecturer`.
Quy trình thường gặp: **viết API Backend trước → test bằng Postman → dùng prompt dưới đây để AI nối vào FE.**

---

## 1. AI biết viết code ở đâu nhờ đâu?

Bạn **không cần** ghi tên từng file. AI tự biết nhờ 3 lớp (giống Spring Boot "convention over configuration"):

| Lớp                       | Nạp khi nào                  | Trả lời câu hỏi                                                             |
| ------------------------- | ---------------------------- | --------------------------------------------------------------------------- |
| `AGENTS.md`               | Tự nạp mọi phiên             | Feature đặt ở đâu, page/route/menu nằm file nào, quy tắc gọi API và báo lỗi |
| Skill (`.agents/skills/`) | Khi yêu cầu khớp mô tả skill | Làm từng bước thế nào + code mẫu hoàn chỉnh trong `templates/`              |
| Code đang có              | AI tự mở đọc                 | Cách viết route, menu, feature cạnh bên                                     |

Những thứ AI **không thể tự biết** và bạn phải đưa vào prompt:

1. **Role** (`admin` / `lecturer` / `department`) và **tên feature**.
2. **Code Backend thật**: Controller, DTO, ErrorCode.
3. **Màn hình mong muốn**: hiển thị gì, thao tác gì.

Ví dụ chỉ với `Role: admin`, `Feature: semester_management` và Controller `@RequestMapping("/admin/semesters")`, AI sẽ tạo:

```
src/features/admin/semester_management/
├── types/semester.types.ts            ← từ DTO
├── services/semester.service.ts       ← URL lấy từ Controller
├── hooks/useSemesters.ts              ← TanStack Query
├── components/SemesterFormDialog.tsx  ← form thêm/sửa
├── pages/SemesterPage.tsx             ← màn hình danh sách
└── index.ts
+ sửa src/app/routes/admin.routes.tsx                          ← đăng ký route
+ sửa src/features/admin/layouts/components/adminNav.config.ts ← thêm menu
```

---

## 2. Template chính — nối tính năng mới (copy từ đây)

````markdown
Dùng skill `connect-api` (và `build-form` nếu có form) để nối API sau vào FE.

## 1. Vị trí

- Role: <admin | lecturer | department>
- Feature: <tên_feature_snake_case> (vd: semester_management)
- Feature đã có màn hình chưa: <chưa có — tạo mới bằng skill create-feature | đã có — nối vào file ...>
- Tên menu sidebar: "<Tên tiếng Việt>"

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
<dán 1 response thành công, nhất là API phân trang>
```

## 3. Màn hình mong muốn

- Danh sách: hiển thị các cột <...>; có <tìm kiếm theo ... / lọc theo ... / phân trang ... dòng>
- Thao tác: <thêm | sửa | xóa | xem chi tiết | ...>
- Form thêm/sửa gồm các trường: <trường — bắt buộc? — quy tắc>
- Quy tắc nghiệp vụ phía FE: <vd: ngày kết thúc phải sau ngày bắt đầu>
- Thông báo thành công: "<...>"

## 4. Ghi chú

- <API nào chưa xong, mã lỗi nào cần hiện dưới ô nào, chỗ cần lưu ý...>

Không tự đoán field hay URL ngoài code mình dán; chỗ nào thiếu thì hỏi lại.
Trước khi code, liệt kê các file sẽ tạo/sửa và URL route, chờ mình xác nhận.
Làm xong chạy skill `verify-changes`.
````

---

## 3. Ví dụ đã điền đầy đủ

````markdown
Dùng skill `connect-api` và `build-form` để nối API sau vào FE.

## 1. Vị trí

- Role: admin
- Feature: semester_management
- Feature đã có màn hình chưa: chưa có — tạo mới bằng skill create-feature
- Tên menu sidebar: "Quản lý học kỳ"

## 2. Code Backend

### Controller

```java
@RestController
@RequestMapping("/admin/semesters")
public class SemesterController {
    @GetMapping
    public APIResponse<Page<SemesterResponse>> getAll(
        @RequestParam(required = false) String keyword, Pageable pageable) { ... }

    @PostMapping
    public APIResponse<SemesterResponse> create(@RequestBody @Valid SemesterRequest req) { ... }

    @PutMapping("/{id}")
    public APIResponse<SemesterResponse> update(@PathVariable Long id, @RequestBody @Valid SemesterRequest req) { ... }

    @DeleteMapping("/{id}")
    public APIResponse<Void> delete(@PathVariable Long id) { ... }
}
```

### DTO Request / Response

```java
public class SemesterRequest {
    @NotBlank String code;
    @NotBlank String name;
    LocalDate startDate;
    LocalDate endDate;
}
public class SemesterResponse {
    Long id; String code; String name;
    LocalDate startDate; LocalDate endDate;
    SemesterStatus status;   // enum: UPCOMING, ACTIVE, CLOSED
}
```

### Mã lỗi liên quan

```java
SEMESTER_CODE_EXISTED(3001, "Mã học kỳ đã tồn tại"),
SEMESTER_NOT_FOUND(3002, "Không tìm thấy học kỳ"),
```

## 3. Màn hình mong muốn

- Danh sách: cột Mã, Tên, Ngày bắt đầu, Ngày kết thúc, Trạng thái (badge màu); có ô tìm kiếm và phân trang 10 dòng
- Thao tác: thêm, sửa (mở Dialog), xóa (hỏi xác nhận)
- Form: Mã (bắt buộc, tối đa 20 ký tự), Tên (bắt buộc), Ngày bắt đầu, Ngày kết thúc (bắt buộc)
- Quy tắc FE: ngày kết thúc phải sau ngày bắt đầu
- Thông báo thành công: "Đã tạo học kỳ" / "Đã cập nhật học kỳ" / "Đã xóa học kỳ"

## 4. Ghi chú

- Lỗi 3001 hiện dưới ô "Mã học kỳ"

Không tự đoán field hay URL ngoài code mình dán; chỗ nào thiếu thì hỏi lại.
Trước khi code, liệt kê các file sẽ tạo/sửa và URL route, chờ mình xác nhận.
Làm xong chạy skill `verify-changes`.
````

---

## 4. Mẫu ngắn cho các trường hợp khác

### a) Thêm API vào màn hình đã có

````markdown
Dùng skill `connect-api`. Thêm chức năng <xuất Excel / duyệt / khóa tài khoản ...>
vào màn hình `src/features/<role>/<feature>/pages/<XxxPage>.tsx`.

Controller (chỉ phần API mới):

```java
<dán method mới>
```

DTO mới (nếu có):

```java
<dán>
```

Giao diện: <nút đặt ở đâu, bấm xong hiện gì, có hỏi xác nhận không>

Trước khi code, liệt kê các file sẽ sửa, chờ mình xác nhận.
````

## 5. Mẹo

- **Dán code thật, đừng tóm tắt bằng lời.** "API trả danh sách học kỳ" kém hơn nhiều so với dán DTO.
- **Một tính năng mỗi prompt.** 3–4 API của cùng một màn hình thì ổn, không gộp cả module.
- **Test API bằng Postman trước.** BE lỗi thì FE sẽ mất công tìm lỗi sai chỗ.
- **Có `@PreAuthorize` thì dán kèm** để AI biết role nào được thấy nút nào.
- **Chạy BE ở `http://localhost:8080`** trước khi kiểm tra trên trình duyệt (cần cookie đăng nhập để gọi API thật).
- **Luôn yêu cầu AI liệt kê file trước khi code.** Sai chỗ thì sửa ngay, đỡ phải gỡ code sau.
- **Đọc diff trước khi commit.** AI không được tự commit/push khi chưa được đồng ý.
