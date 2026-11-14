# BUG: Đăng nhập xong bị đá về trang Login (BE trả 401 cho token vừa cấp)

> Tài liệu cho agent sửa lỗi (Antigravity / Gemini). **Phạm vi sửa: Backend Spring Boot** (`http://localhost:8080`).
> Frontend (`Frontend/Lecturer`) đang chạy đúng thiết kế — **không sửa FE để "né" lỗi**
> (không bỏ cơ chế refresh, không bỏ gọi `/notification`, không bắt 401 rồi bỏ qua).

## 1. Triệu chứng

1. Người dùng đăng nhập Google → FE gọi `POST /login` → **200**, FE chuyển sang dashboard (`/admin`, `/department` hoặc `/lecturer`).
2. Ngay sau đó FE tự gọi `POST /refresh-token`.
3. Refresh thất bại → FE xóa phiên và quay về trang `/login`.

Breakpoint đặt trong Controller **không** dừng ở `/notification`, vì request bị chặn trước khi vào tới Controller
(filter / entry point / exception handler).

## 2. Dữ liệu đo được (trình duyệt thật, origin `http://localhost:5173`, ngày 2026-10-16)

Thứ tự request sau khi đăng nhập:

| # | Request | Kết quả |
| --- | --- | --- |
| 1 | `POST /login` | **200** |
| 2 | `GET /notification` (kèm cookie) | **401** `{"code":2000,"message":"Phiên đăng nhập của bạn đã hết hạn"}` |
| 3 | `GET /connection` (SSE, kèm cookie) | **200** |
| 4 | `POST /refresh-token` | thất bại → FE về `/login` |

Gọi lại thủ công từ cùng trình duyệt, ngay sau khi đăng nhập:

| Request | Gửi cookie? | Kết quả |
| --- | --- | --- |
| `GET /my-info` | không | **401** `{"code":2000,"message":"Phiên đăng nhập của bạn đã hết hạn"}` |
| `GET /my-info` | **có** | **500** `{"code":1001,"message":"Hệ thống không phản hồi"}` |
| `GET /notification` | **có** | **401** `{"code":2000,...}` |
| `GET /connection` | **có** | **200** |

Đã loại trừ:

- **CORS đúng**: preflight trả `Access-Control-Allow-Origin: http://localhost:5173`,
  `Access-Control-Allow-Credentials: true`, cho phép `GET,POST,PUT,DELETE,PATCH,OPTIONS`.
- **Cookie có được lưu và gửi**: `/my-info` cho kết quả khác nhau khi có / không có cookie (500 vs 401).
- **FE gọi đúng địa chỉ**: `API_BASE_URL = http://localhost:8080`, axios và EventSource đều `withCredentials: true`.

## 3. Kết luận

Với **cùng một cookie access token vừa được `/login` cấp**, BE xử lý không nhất quán:

- `/notification` → 401 code 2000 ("hết hạn") dù token mới vài giây.
- `/my-info` → 500 code 1001: có exception chưa được xử lý trong quá trình xác thực / lấy user hiện tại.
- `/connection` → 200: nhiều khả năng endpoint này đang `permitAll()` nên không đi qua bước kiểm tra token.

⇒ Lỗi nằm ở **bước BE đọc / xác thực JWT từ cookie hoặc lấy user hiện tại từ SecurityContext**. Nhiều khả năng
`/notification` (401) và `/my-info` (500) chung một nguyên nhân gốc.
Ngoài ra `POST /refresh-token` cũng thất bại → cần kiểm tra luôn việc đọc cookie refresh token.

## 4. Hướng điều tra phía BE (theo thứ tự)

1. **Filter / resolver đọc JWT từ cookie** (custom `OncePerRequestFilter`, `BearerTokenResolver`, `JwtDecoder`…):
   - Tên cookie đọc có đúng với tên cookie `/login` set không (ví dụ `access_token`)?
   - Giải mã / verify chữ ký có dùng **cùng secret / key** với lúc phát hành token không?
   - Kiểm tra `exp` / `iat`: đơn vị (giây vs mili-giây), timezone, thời hạn cấu hình có bị bằng 0 / âm không.
   - Nếu dùng `oauth2ResourceServer().jwt()` mặc định: nó chỉ đọc header `Authorization: Bearer`, không đọc cookie
     → cần `BearerTokenResolver` đọc từ cookie.
   - Có cơ chế blacklist / invalidated token (ví dụ lưu token đã logout) đang đánh dấu nhầm token mới không?
2. **`SecurityConfig`**: so sánh rule của `/connection` với `/notification`, `/my-info`. Xác nhận `/connection`
   có phải `permitAll()` không (nếu có, SSE không được bảo vệ — cũng cần sửa sau khi xác thực chạy đúng).
3. **Exception → response**: tìm nơi sinh code **2000** (`AuthenticationEntryPoint`, `@ControllerAdvice`,
   enum `ErrorCode`) và code **1001**. Log stack trace của exception gốc thay vì nuốt lỗi — đó là manh mối chính.
4. **Lấy user hiện tại** trong service của `/notification` và `/my-info` (`SecurityContextHolder`,
   `@AuthenticationPrincipal`, ép kiểu principal sang `Jwt` / entity, tìm user theo `sub` / email trong DB).
5. **`POST /refresh-token`**: cookie refresh token có `Path` phù hợp (nên `Path=/`) và được BE đọc đúng tên không.

## 5. Cách tái hiện không cần FE

```bash
# 1. Đăng nhập qua FE một lần, mở DevTools → Application → Cookies → copy giá trị access token
# 2. Gọi trực tiếp BE:
curl -i http://localhost:8080/my-info      -H "Cookie: access_token=<giá trị>"
curl -i http://localhost:8080/notification -H "Cookie: access_token=<giá trị>"
```

Không chép giá trị token vào code, log commit hay tài liệu.

## 6. Tiêu chí hoàn thành

- Ngay sau `POST /login` thành công, với cookie vừa nhận:
  - `GET /my-info` → 200 `{"code":1000,"data":{"name":...,"roles":[...]}}`
  - `GET /notification` → 200 `{"code":1000,"data":[...]}`
  - `GET /connection` → 200 (SSE) và **không có cookie thì phải 401**.
- Không còn `POST /refresh-token` nào xuất hiện ngay sau đăng nhập; người dùng ở lại dashboard.
- Token thật sự hết hạn → 401 code 2000 → `POST /refresh-token` thành công (200, set cookie mới) → request được gửi lại thành công.

## 7. Hợp đồng FE đang dựa vào (không đổi)

- Mọi response: `{ code, message, data }`, `code === 1000` là thành công.
- **HTTP 401** = chưa đăng nhập / token hết hạn → FE tự gọi `POST /refresh-token` một lần rồi gửi lại request;
  refresh thất bại → về `/login`. Vì vậy BE **chỉ** được trả 401 khi token thật sự thiếu / sai / hết hạn.
- Lỗi khác (500…) FE hiển thị toast, không đá người dùng ra.
- Token nằm trong cookie HttpOnly; FE không đọc / ghi token.

---

# BUG 2: `POST /logout` không vào Controller (Spring Security `LogoutFilter` mặc định chặn)

> Lỗi 1 ở trên đã được sửa. Phần này là lỗi đăng xuất, **phạm vi sửa: Backend**.
> Phía FE đã sửa xong phần của mình (xem cuối mục).

## Triệu chứng

Bấm "Đăng xuất" → breakpoint trong `@PostMapping("/logout")` **không bao giờ dừng**; người dùng không thoát được
(cookie đăng nhập vẫn còn hiệu lực).

## Bằng chứng (đo ngày 2026-10-16)

```bash
curl -i -X POST http://localhost:8080/logout -H "Origin: http://localhost:5173"
# HTTP/1.1 302
# Location: http://localhost:8080/login?logout
```

Response `302 → /login?logout` là hành vi của **`LogoutFilter` mặc định** của Spring Security:
`HttpSecurity` tự bật `.logout(withDefaults())`, filter này bắt `POST /logout` (khi tắt CSRF thì bắt mọi method)
**trước** DispatcherServlet → Controller `/logout` không chạy → **cookie access/refresh token không bị xóa**.

## Cách sửa (chọn 1)

1. Tắt logout mặc định để request vào Controller tự viết:
   ```java
   http.logout(AbstractHttpConfigurer::disable);
   ```
2. Hoặc giữ `LogoutFilter` nhưng cấu hình cho API: xóa cookie và trả JSON 200 thay vì redirect:
   ```java
   http.logout(logout -> logout
       .logoutUrl("/logout")
       .deleteCookies("<tên cookie access token>", "<tên cookie refresh token>")
       .logoutSuccessHandler((req, res, auth) -> { /* ghi APIResponse code 1000, status 200 */ }));
   ```

Khi xóa cookie: `Set-Cookie` cùng **tên, `Path`, `Domain`** như lúc tạo, với `Max-Age=0`.
Nếu có lưu refresh token / blacklist trong DB thì vô hiệu hóa luôn ở bước này.

## Tiêu chí hoàn thành

- `POST /logout` (kèm cookie) → **200** `{"code":1000,...}`, response có `Set-Cookie ...; Max-Age=0` cho từng cookie token.
- Ngay sau đó `GET /my-info` (cùng trình duyệt) → **401**.
- Breakpoint trong Controller `/logout` dừng được (nếu chọn cách 1).

## Phía FE (đã sửa, không cần đụng)

Trước đây FE xóa cache TanStack Query ngay khi bắt đầu chuyển về `/login`. Vì `LoginPage` nạp lazy nên layout cũ
còn hiển thị thêm một lúc → nó gọi lại `GET /my-info`, `GET /notification`, mở lại SSE `/connection`; và do cookie
chưa bị BE xóa nên `/my-info` thành công → người dùng bị đưa ngược vào dashboard.
Nay FE chuyển về `/login` trước (`SIGNED_OUT_STATE`), `LoginPage` mới xóa cache → không còn request thừa.
Có test: `tests/integration/logoutFlow.test.tsx`.
