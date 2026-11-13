# Hướng dẫn Tích hợp API: Quản lý & Thẩm định Đề cương Đồ án Tốt nghiệp (Dành cho Giảng viên)

Tài liệu hướng dẫn kết nối Frontend (`Frontend/Lecturer`) với Backend (`tlu_gpms_system`) cho **Giai đoạn 3: Nộp & Thẩm định Đề cương**. Giảng viên trong hệ thống có thể đảm nhiệm 2 vai trò riêng biệt đối với đề cương sinh viên:

1. **Giao diện Giảng viên Hướng dẫn (GVHD)**:
   - Xem danh sách đề cương của sinh viên do mình hướng dẫn (chính hoặc phụ) theo học kỳ và trạng thái (`GET /outline/supervisor-list`).
   - Hiển thị thời hạn nộp đề cương của học kỳ (mốc `SV_CHINH_SUA_NOP_LAI_DE_CUONG`).
   - Xem file đề cương và xem chi tiết kèm **lịch sử tất cả các lần nộp** của từng sinh viên (`GET /outline/{publicId}`).
   - Gửi nhận xét góp ý đề cương về cho sinh viên (`PUT /outline/{publicId}/advisor-feedback`) — **chỉ GVHD chính** mới có quyền ghi nhận xét (`canWriteAdvisorFeedback = true`); GVHD đồng hướng dẫn chỉ có quyền xem.

2. **Giao diện Giảng viên Nhận xét (GVNX)**:
   - Xem danh sách đề cương sinh viên được Trưởng bộ môn (TBM) phân công thẩm định theo học kỳ và trạng thái (`GET /outline/review-list`).
   - Hiển thị thời hạn nộp & thời gian chấm đề cương.
   - Xem file đề cương của sinh viên (`GET /outline/{publicId}`).
   - Thẩm định đề cương: Phê duyệt ĐẠT (`APPROVED`), Yêu cầu chỉnh sửa (`REQUEST_CHANGES`), hoặc Không đạt (`REJECTED`) (`PUT /outline/{publicId}/review`).
   - Bắt buộc ghi nhận xét đánh giá (`feedback`) khi thẩm định đề cương.
   - **Ràng buộc quan trọng**: Chỉ được duyệt ĐẠT (`APPROVED`) khi đề tài đã được GVHD chính thức xác nhận tên (hoàn thành GĐ 2).

> **Tài liệu liên quan**:
> - Luồng sinh viên nộp & theo dõi đề cương: [API_Student_Outline.md](../../Student/doc/API_Student_Outline.md)
> - Luồng GVHD duyệt tên đề tài (GĐ 2): [API_Supervisor_TopicTitleReview.md](./API_Supervisor_TopicTitleReview.md)
> - Luồng GVHD nộp phiếu theo dõi tiến độ (GĐ 4): [API_Supervisor_ProgressReport.md](./API_Supervisor_ProgressReport.md)

---

## 1. Tổng quan Nghiệp vụ & Luồng xử lý (Workflow)

```
====================================================================================================
LUỒNG 1: GIẢNG VIÊN HƯỚNG DẪN (SUPERVISOR) THEO DÕI & GÓP Ý ĐỀ CƯƠNG
====================================================================================================

      GVHD gọi: GET /outline/supervisor-list?semesterId={uuid}&status={status?}
  (Lấy danh sách đề cương của SV mình hướng dẫn chính hoặc đồng hướng dẫn trong kỳ)
                                     │
                                     ▼
                  Mở xem chi tiết: GET /outline/{publicId}
         (Xem thông tin đề tài, file đề cương, lịch sử các lần nộp histories)
                                     │
        ┌────────────────────────────┴────────────────────────────┐
        ▼                                                         ▼
[Là GVHD đồng hướng dẫn]                                  [Là GVHD chính]
canWriteAdvisorFeedback = false                          canWriteAdvisorFeedback = true
-> Chỉ có quyền xem                                      -> Khi SV đã nộp đề cương (outline.file != null)
   (Gọi gửi nhận xét -> 403 FORBIDDEN)                      và chưa quá hạn chấm (now <= endDate):
                                                            GVHD chính gọi:
                                                            PUT /outline/{publicId}/advisor-feedback
                                                            { "feedback": "Nhận xét góp ý..." }
                                                                  │
                                                                  ▼
                                                      - Lưu vào outline.advisorFeedback
                                                      - KHÔNG thay đổi status đề cương
                                                      - KHÔNG thay đổi currentStage đề tài
                                                      - Bắn thông báo SSE real-time cho sinh viên
```

```
====================================================================================================
LUỒNG 2: GIẢNG VIÊN NHẬN XÉT (COMMENTING LECTURER / REVIEWER) THẨM ĐỊNH ĐỀ CƯƠNG
====================================================================================================

      GVNX gọi: GET /outline/review-list?semesterId={uuid}&status={status?}
     (Lấy danh sách đề cương sinh viên được TBM phân công cho mình thẩm định)
                                     │
                                     ▼
                  Mở xem chi tiết: GET /outline/{publicId}
          (Tải file đề cương về đọc, xem lịch sử các lần nộp trước)
                                     │
                                     ▼
        Điều kiện thẩm định: canReview === true, outline.status === "PENDING",
                             đề tài status === "IN_PROGRESS" và now <= endDate
                                     │
                                     ▼
                 GVNX gọi: PUT /outline/{publicId}/review
                 { "decision": "...", "feedback": "Ý kiến nhận xét bắt buộc" }
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        ▼                            ▼                            ▼
  [decision = APPROVED]    [decision = REQUEST_CHANGES]   [decision = REJECTED]
  (Cả thời gian nộp &      (CHỈ trong thời gian nộp -     (CHỈ trong thời gian gia hạn
   thời gian chấm)          mốc chưa EXTENDED)             chấm - mốc EXTENDED)
        │                            │                            │
        ▼                            ▼                            ▼
- ĐIỀU KIỆN TIÊN QUYẾT:    - outline.status =             - outline.status = REJECTED
  Đề tài ĐÃ ĐƯỢC CHỐT TÊN    REQUEST_CHANGES              - topic.status = DISQUALIFIED
  (STAGE_2_TOPIC_CONFIRMED - Đề tài giữ nguyên mốc        - disqualificationReason =
   & không có title PENDING) - SV được sửa & nộp lại         "Không hoàn thành phê duyệt
- outline.status = APPROVED  khi còn hạn mở                  đề cương đúng hạn"
- topic.currentStage =     - Bắn thông báo SSE            - Dừng đồ án trong học kỳ
  STAGE_3_OUTLINE_APPROVED   kèm nhận xét cho SV          - Bắn thông báo SSE cho SV
- Bắn thông báo SSE cho SV
```

---

### Lưu ý nghiệp vụ quan trọng

1. **Phân biệt 2 vai trò của Giảng viên**:
   - **Giảng viên Hướng dẫn (GVHD)**: Chỉ đóng vai trò đồng hành, góp ý (`advisorFeedback`). GVHD **không có thẩm quyền quyết định** ĐẠT / KHÔNG ĐẠT đề cương.
   - **Giảng viên Nhận xét (GVNX)**: Do Trưởng bộ môn phân công độc lập (theo quy tắc **BR-05: GVNX $\ne$ GVHD**). GVNX là người **duy nhất có thẩm quyền quyết định kết quả** đề cương (`decision`).

2. **Phân biệt quyền hạn giữa GVHD chính và GVHD đồng hướng dẫn (`coLecturer`)**:
   - `GET /outline/supervisor-list` trả về sinh viên của **cả GVHD chính lẫn GVHD đồng hướng dẫn**.
   - **Chỉ GVHD chính** mới có quyền gửi nhận xét góp ý (`canWriteAdvisorFeedback: true`).
   - **GVHD đồng hướng dẫn chỉ có quyền xem** (`canWriteAdvisorFeedback: false`). Nếu gọi API gửi góp ý sẽ bị chặn `403 FORBIDDEN` (*"Giảng viên đồng hướng dẫn chỉ có quyền xem, không có quyền ghi nhận xét đề cương"*).

3. **Mốc thời hạn áp dụng (`SV_CHINH_SUA_NOP_LAI_DE_CUONG`)**:
   - Dùng chung 1 mốc thời hạn với Chốt tên đề tài (GĐ 2).
   - **Trong thời gian nộp (`status != EXTENDED` và `now <= endDate`)**:
     - Sinh viên được nộp / nộp lại nhiều lần.
     - GVNX chỉ được chọn **`APPROVED`** (Đạt) hoặc **`REQUEST_CHANGES`** (Yêu cầu chỉnh sửa). Nếu gửi `REJECTED` sẽ bị Backend chặn (`3087 - OUTLINE_DECISION_INVALID_IN_SUBMISSION_PERIOD`).
   - **Trong thời gian gia hạn chấm (`status == EXTENDED` và `now <= endDate`)**:
     - Sinh viên bị khóa nộp bài.
     - GVNX xử lý các đề cương `PENDING` và chỉ được chọn **`APPROVED`** (Đạt) hoặc **`REJECTED`** (Không đạt). Nếu gửi `REQUEST_CHANGES` sẽ bị Backend chặn (`3088 - OUTLINE_DECISION_INVALID_IN_GRADING_PERIOD`).
   - **Sau `endDate` hoặc khi mốc `COMPLETED`**: Khóa toàn bộ quyền thẩm định và góp ý (`3086 - OUTLINE_GRADING_CLOSED`). TBM phải lùi `endDate` nếu muốn mở lại thời gian chấm.

4. **Ràng buộc DUYỆT ĐẠT với Tên đề tài (BẮT BUỘC)**:
   - GVNX **không thể duyệt ĐẠT (`APPROVED`)** đề cương nếu đề tài chưa có tên chính thức hoặc đang có yêu cầu đổi tên `PENDING` chưa được GVHD xác nhận.
   - Nếu vi phạm, Backend trả lỗi **`3100 - OUTLINE_TOPIC_TITLE_NOT_CONFIRMED`** (HTTP 409 Conflict): *"Tên đề tài chưa được GVHD xác nhận, chưa thể duyệt đạt đề cương"*.
   - Trong thời gian gia hạn chấm, GVHD cần duyệt chốt tên trước, sau đó GVNX mới duyệt ĐẠT đề cương được.

5. **Quy tắc bảo vệ Sinh viên & Job quét tự động**:
   - Job tự động chạy định kỳ **5 phút/lần** khi mốc thời hạn đóng:
     - **Bỏ qua hoàn toàn** các đề cương đang `PENDING` (sinh viên nộp đúng hạn nhưng GV chưa chấm **không bao giờ bị loại**).
     - Đề tài không nộp hoặc đang ở trạng thái `REQUEST_CHANGES` (không nộp lại bản sửa trước hạn) sẽ bị chuyển `REJECTED` và `topic.status = DISQUALIFIED`.

---

## 2. Danh sách API Endpoints

Tất cả API trả về cấu trúc wrapper chuẩn `APIResponse<T>` (`{ code: 1000, message?: string, data: T }`) với HTTP `200 OK` khi thành công.

| STT | Chức năng | Method | Endpoint | Quyền (`@PreAuthorize`) | Content-Type |
|:---:|---|:---:|---|---|---|
| **1** | **GVHD xem danh sách đề cương sinh viên mình hướng dẫn** | `GET` | `/outline/supervisor-list?semesterId={uuid}&status={status}` | `VIEW_ADVISED_STUDENT`, `SUPERVISOR` | `application/json` |
| **2** | **GVNX xem danh sách đề cương được phân công thẩm định** | `GET` | `/outline/review-list?semesterId={uuid}&status={status}` | `VIEW_REVIEW_STUDENT`, `REVIEW_OUTLINE`, `COMMENTING_LECTURER` | `application/json` |
| **3** | **Xem chi tiết 1 đề cương kèm lịch sử các lần nộp** | `GET` | `/outline/{publicId}` | `STUDENT`, `COMMENTING_LECTURER`, `SUPERVISOR`, `VIEW_TOPIC`, `REVIEW_OUTLINE`, `VIEW_ADVISED_STUDENT` | `application/json` |
| **4** | **GVNX thẩm định & cho kết quả đề cương** | `PUT` | `/outline/{publicId}/review` | `REVIEW_OUTLINE`, `COMMENTING_LECTURER` | `application/json` |
| **5** | **GVHD chính gửi nhận xét góp ý đề cương** | `PUT` | `/outline/{publicId}/advisor-feedback` | `VIEW_ADVISED_STUDENT`, `SUPERVISOR` | `application/json` |
| **6** | *(Tiện ích)* **Lấy mốc thời hạn học kỳ (Deadline)** | `GET` | `/api/v1/deadlines?semesterId={uuid}` | `VIEW_SCHEDULE`, `SUPERVISOR`, `ADMIN`, `HEAD_OF_MAJOR`, `STUDENT` | `application/json` |

> **Xác thực**: Yêu cầu cookie `access_token` (`withCredentials: true`) hoặc header `Authorization: Bearer <token>`.

---

## 3. Chi tiết từng API

### 3.1. GVHD xem danh sách đề cương sinh viên mình hướng dẫn

- **Endpoint**: `GET /outline/supervisor-list`
- **Query Params**:
  - `semesterId` (`UUID`, *tùy chọn*): Public ID của học kỳ. Bỏ trống sẽ lấy học kỳ đang diễn ra (`ONGOING`).
  - `status` (`OutlineStatus`, *tùy chọn*): Lọc theo trạng thái đề cương:
    - Bỏ trống: Lấy toàn bộ đề cương đã nộp của sinh viên mình hướng dẫn.
    - `PENDING`: Đang chờ nhận xét thẩm định.
    - `REQUEST_CHANGES`: Đang yêu cầu chỉnh sửa.
    - `APPROVED`: Đã được duyệt đạt.
    - `REJECTED`: Không đạt.
- **Quyền**: GVHD chính hoặc GVHD đồng hướng dẫn của đề tài.
- **Response Success (HTTP 200)**:

```json
{
  "code": 1000,
  "message": null,
  "data": [
    {
      "publicId": "018db26a-932f-789a-bc01-111111111111",
      "topicPublicId": "018db26a-932f-789a-bc01-e23456789abc",
      "topicName": "Xây dựng hệ thống Quản lý Đồ án Tốt nghiệp TLU GPMS",
      "currentStage": "STAGE_2_TOPIC_CONFIRMED",
      "topicStatus": "IN_PROGRESS",
      "disqualificationReason": null,
      "studentPublicId": "018db26a-932f-789a-bc01-222222222222",
      "studentCode": "2051060001",
      "studentName": "Nguyễn Văn An",
      "lecturerPublicId": "018db26a-932f-789a-bc01-333333333333",
      "lecturerName": "TS. Trần Văn Hướng Dẫn",
      "coLecturerPublicId": null,
      "coLecturerName": null,
      "reviewerPublicId": "018db26a-932f-789a-bc01-444444444444",
      "reviewerName": "PGS.TS. Lê Nhận Xét",
      "title": "Đề cương chi tiết Hệ thống Quản lý Đồ án Tốt nghiệp",
      "outlineFile": "https://res.cloudinary.com/gpms/raw/upload/v1/outlines/de_cuong_an.docx",
      "status": "PENDING",
      "statusDescription": "Đã nộp, chờ nhận xét",
      "reviewFeedback": null,
      "advisorFeedback": "Đề cương cần bổ sung thêm chương kiến trúc hệ thống và công nghệ sử dụng.",
      "submittedAt": "2026-11-12T14:30:00",
      "reviewedAt": null,
      "canReview": false,
      "canWriteAdvisorFeedback": true,
      "deadlineName": "Hạn sinh viên chỉnh sửa & nộp lại đề cương",
      "deadlineStartDate": "2026-11-01T00:00:00",
      "deadlineEndDate": "2026-11-20T23:59:59",
      "deadlineActive": true,
      "deadlineStatus": "IN_PROGRESS",
      "histories": null
    }
  ]
}
```

> **Lưu ý**: Field `canWriteAdvisorFeedback` trả về `true` nếu giảng viên đăng nhập là **GVHD chính** (`topic.lecturer`), trả về `false` nếu là **đồng GVHD** (`topic.coLecturer`).

---

### 3.2. GVNX xem danh sách đề cương được phân công thẩm định

- **Endpoint**: `GET /outline/review-list`
- **Query Params**:
  - `semesterId` (`UUID`, *tùy chọn*): Public ID của học kỳ. Bỏ trống sẽ lấy học kỳ hiện tại (`ONGOING`).
  - `status` (`OutlineStatus`, *tùy chọn*): Lọc theo trạng thái đề cương (`PENDING`, `REQUEST_CHANGES`, `APPROVED`, `REJECTED`). Thường dùng `status=PENDING` cho tab "Cần thẩm định".
- **Quyền**: Giảng viên nhận xét được phân công.
- **Response Success (HTTP 200)**:

```json
{
  "code": 1000,
  "message": null,
  "data": [
    {
      "publicId": "018db26a-932f-789a-bc01-111111111111",
      "topicPublicId": "018db26a-932f-789a-bc01-e23456789abc",
      "topicName": "Xây dựng hệ thống Quản lý Đồ án Tốt nghiệp TLU GPMS",
      "currentStage": "STAGE_2_TOPIC_CONFIRMED",
      "topicStatus": "IN_PROGRESS",
      "disqualificationReason": null,
      "studentPublicId": "018db26a-932f-789a-bc01-222222222222",
      "studentCode": "2051060001",
      "studentName": "Nguyễn Văn An",
      "lecturerPublicId": "018db26a-932f-789a-bc01-333333333333",
      "lecturerName": "TS. Trần Văn Hướng Dẫn",
      "coLecturerPublicId": null,
      "coLecturerName": null,
      "reviewerPublicId": "018db26a-932f-789a-bc01-444444444444",
      "reviewerName": "PGS.TS. Lê Nhận Xét",
      "title": "Đề cương chi tiết Hệ thống Quản lý Đồ án Tốt nghiệp",
      "outlineFile": "https://res.cloudinary.com/gpms/raw/upload/v1/outlines/de_cuong_an.docx",
      "status": "PENDING",
      "statusDescription": "Đã nộp, chờ nhận xét",
      "reviewFeedback": null,
      "advisorFeedback": "Đề cương cần bổ sung thêm chương kiến trúc hệ thống và công nghệ sử dụng.",
      "submittedAt": "2026-11-12T14:30:00",
      "reviewedAt": null,
      "canReview": true,
      "canWriteAdvisorFeedback": false,
      "deadlineName": "Hạn sinh viên chỉnh sửa & nộp lại đề cương",
      "deadlineStartDate": "2026-11-01T00:00:00",
      "deadlineEndDate": "2026-11-20T23:59:59",
      "deadlineActive": true,
      "deadlineStatus": "IN_PROGRESS",
      "histories": null
    }
  ]
}
```

> **Lưu ý**: Field `canReview` luôn trả về `true` cho GVNX được phân công đề cương này.

---

### 3.3. Xem chi tiết một đề cương kèm lịch sử các lần nộp

API này dùng chung cho cả GVHD, GVNX và Sinh viên để mở popup/drawer hoặc trang chi tiết xem đề cương và lịch sử nộp bài.

- **Endpoint**: `GET /outline/{publicId}`
- **Path Param**: `publicId` (`UUID`) — Public ID của đề cương (`ThesisOutline.publicId`).
- **Response Success (HTTP 200)**:

```json
{
  "code": 1000,
  "message": null,
  "data": {
    "publicId": "018db26a-932f-789a-bc01-111111111111",
    "topicPublicId": "018db26a-932f-789a-bc01-e23456789abc",
    "topicName": "Xây dựng hệ thống Quản lý Đồ án Tốt nghiệp TLU GPMS",
    "currentStage": "STAGE_2_TOPIC_CONFIRMED",
    "topicStatus": "IN_PROGRESS",
    "disqualificationReason": null,
    "studentPublicId": "018db26a-932f-789a-bc01-222222222222",
    "studentCode": "2051060001",
    "studentName": "Nguyễn Văn An",
    "lecturerPublicId": "018db26a-932f-789a-bc01-333333333333",
    "lecturerName": "TS. Trần Văn Hướng Dẫn",
    "coLecturerPublicId": null,
    "coLecturerName": null,
    "reviewerPublicId": "018db26a-932f-789a-bc01-444444444444",
    "reviewerName": "PGS.TS. Lê Nhận Xét",
    "title": "Đề cương chi tiết Hệ thống Quản lý Đồ án Tốt nghiệp",
    "outlineFile": "https://res.cloudinary.com/gpms/raw/upload/v1/outlines/de_cuong_an_v2.docx",
    "status": "PENDING",
    "statusDescription": "Đã nộp, chờ nhận xét",
    "reviewFeedback": null,
    "advisorFeedback": "Đã đọc bản sửa v2, sinh viên đã cập nhật sơ đồ kiến trúc khá tốt.",
    "submittedAt": "2026-11-14T09:15:00",
    "reviewedAt": null,
    "canReview": true,
    "canWriteAdvisorFeedback": false,
    "histories": [
      {
        "publicId": "018db26a-932f-789a-bc01-aaaa11112222",
        "outlineHistoryFile": "https://res.cloudinary.com/gpms/raw/upload/v1/outlines/de_cuong_an_v2.docx",
        "submissionNote": "Em xin nộp lại đề cương bản v2 đã bổ sung thiết kế CSDL và kiến trúc.",
        "status": "PENDING",
        "statusDescription": "Đã nộp, chờ nhận xét",
        "submittedAt": "2026-11-14T09:15:00",
        "reviewerPublicId": null,
        "reviewerName": null,
        "reviewFeedback": null,
        "reviewedAt": null
      },
      {
        "publicId": "018db26a-932f-789a-bc01-aaaa33334444",
        "outlineHistoryFile": "https://res.cloudinary.com/gpms/raw/upload/v1/outlines/de_cuong_an_v1.docx",
        "submissionNote": "Bản nộp lần đầu.",
        "status": "REQUEST_CHANGES",
        "statusDescription": "Yêu cầu chỉnh sửa",
        "submittedAt": "2026-11-10T10:00:00",
        "reviewerPublicId": "018db26a-932f-789a-bc01-444444444444",
        "reviewerName": "PGS.TS. Lê Nhận Xét",
        "reviewFeedback": "Nội dung phần 2 quá sơ sài, yêu cầu bổ sung sơ đồ use-case và thiết kế bảng dữ liệu.",
        "reviewedAt": "2026-11-11T16:20:00"
      }
    ]
  }
}
```

---

### 3.4. Giảng viên nhận xét thẩm định đề cương

- **Endpoint**: `PUT /outline/{publicId}/review`
- **Path Param**: `publicId` (`UUID`) — Public ID của đề cương.
- **Request Body (`application/json`)**:

```json
{
  "decision": "APPROVED",
  "feedback": "Đề cương viết rõ ràng, bố cục hợp lý, đáp ứng yêu cầu của đồ án tốt nghiệp."
}
```

#### Quy định trường dữ liệu:
| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
|---|:---:|:---:|---|
| `decision` | `string` | **Có** | Giá trị enum `OutlineStatus`: <br>• Thời gian nộp: `"APPROVED"` hoặc `"REQUEST_CHANGES"`<br>• Thời gian gia hạn chấm: `"APPROVED"` hoặc `"REJECTED"` |
| `feedback` | `string` | **Có** | Ý kiến nhận xét của GVNX. Không được để trống hoặc chỉ có khoảng trắng (`OUTLINE_FEEDBACK_EMPTY`). |

- **Response Success (HTTP 200)**:

```json
{
  "code": 1000,
  "message": "Thẩm định đề cương thành công",
  "data": null
}
```

---

### 3.5. Giảng viên hướng dẫn chính gửi nhận xét góp ý đề cương

- **Endpoint**: `PUT /outline/{publicId}/advisor-feedback`
- **Path Param**: `publicId` (`UUID`) — Public ID của đề cương.
- **Request Body (`application/json`)**:

```json
{
  "feedback": "Thầy đã xem qua đề cương, phần phân tích yêu cầu làm rất chi tiết. Em nên trao đổi thêm với GV nhận xét để hoàn thiện sớm."
}
```

#### Quy định trường dữ liệu:
| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|:---:|:---:|---|
| `feedback` | `string` | **Có** | Ý kiến góp ý của GVHD chính. Không được để trống (`OUTLINE_FEEDBACK_EMPTY`). Cho phép gửi lại nhiều lần để ghi đè nhận xét mới nhất. |

- **Response Success (HTTP 200)**:

```json
{
  "code": 1000,
  "message": "Gửi nhận xét góp ý đề cương thành công",
  "data": null
}
```

---

### 3.6. Lấy thông tin Mốc thời hạn (Deadline) của Học kỳ

Dùng chung mốc **`SV_CHINH_SUA_NOP_LAI_DE_CUONG`**:

- **Endpoint**: `GET /api/v1/deadlines?semesterId={semesterId}`
- **Response Success (HTTP 200)**: Lấy mốc có `code === 'SV_CHINH_SUA_NOP_LAI_DE_CUONG'`:

```json
{
  "code": 1000,
  "message": null,
  "data": {
    "thucHienDeadlines": [
      {
        "deadlineId": "018db26a-932f-789a-bc01-999999999999",
        "code": "SV_CHINH_SUA_NOP_LAI_DE_CUONG",
        "name": "Hạn sinh viên chỉnh sửa & nộp lại đề cương",
        "startDate": "2026-11-01T00:00:00",
        "endDate": "2026-11-20T23:59:59",
        "status": "IN_PROGRESS"
      }
    ]
  }
}
```

#### Bảng quy tắc trạng thái Deadline (`status`):
| Giá trị `status` | Trạng thái hiển thị | Tác động tới Sinh viên | Tác động tới Giảng viên |
|---|---|---|---|
| `NOT_STARTED` | **Chưa bắt đầu** | Chưa được nộp | Chưa được thẩm định |
| `IN_PROGRESS` (hoặc tính theo thời gian: `now <= endDate`) | **Đang mở nhận bài** (Xanh lá) | Được nộp / nộp lại bài | • GVNX: chọn `APPROVED` hoặc `REQUEST_CHANGES`<br>• GVHD: gửi nhận xét góp ý |
| `EXTENDED` | **Gia hạn chấm** (Vàng cam) | **Bị khóa nộp bài** | • GVNX: chọn `APPROVED` hoặc `REJECTED`<br>• GVHD: gửi nhận xét góp ý |
| `COMPLETED` (hoặc `now > endDate`) | **Đã hết hạn / Đã đóng** (Xám/Đỏ) | Bị khóa hoàn toàn | Bị khóa thẩm định & góp ý |

---

## 4. Bảng mã lỗi Backend (ErrorCode) & Cách xử lý trên UI

| HTTP | Code | Enum Key | Ý nghĩa nghiệp vụ | Cách xử lý trên UI |
|:---:|:---:|---|---|---|
| **400** | `4000` | `OUTLINE_DECISION_NULL` | Chưa chọn kết quả thẩm định | Báo lỗi: *"Vui lòng chọn kết quả thẩm định (Duyệt đạt / Yêu cầu chỉnh sửa / Không đạt)"* |
| **400** | `4000` | `OUTLINE_FEEDBACK_EMPTY` | Ý kiến nhận xét bị để trống | Focus vào ô nhận xét và báo đỏ: *"Vui lòng nhập ý kiến nhận xét"* |
| **400** | `3087` | `OUTLINE_DECISION_INVALID_IN_SUBMISSION_PERIOD` | Chọn Không đạt trong thời gian nộp | Báo lỗi: *"Trong thời gian nhận bài chỉ được chọn Đạt hoặc Yêu cầu chỉnh sửa"* |
| **400** | `3088` | `OUTLINE_DECISION_INVALID_IN_GRADING_PERIOD` | Chọn Yêu cầu sửa trong thời gian chấm | Báo lỗi: *"Trong thời gian gia hạn chấm chỉ được chọn Đạt hoặc Không đạt"* |
| **403** | `2001` | `FORBIDDEN` | Sai vai trò / không được phân công / đồng GVHD gọi góp ý | Thông báo toast lỗi: *"Bạn không có quyền thực hiện thao tác này"* |
| **403** | `3086` | `OUTLINE_GRADING_CLOSED` | Đã quá hạn chấm (`now > endDate`) | Báo lỗi: *"Đã quá thời hạn thẩm định đề cương, vui lòng liên hệ Trưởng bộ môn gia hạn"* |
| **404** | `3067` | `THESIS_OUTLINE_NOT_FOUND` | Không tìm thấy đề cương | Báo lỗi: *"Không tìm thấy đề cương trên hệ thống"* |
| **404** | `3084` | `OUTLINE_DEADLINE_NOT_FOUND` | Chưa cấu hình hạn nộp cho học kỳ | Hiển thị thông báo: *"Học kỳ này chưa được cấu hình hạn nộp đề cương"* |
| **409** | `3057` | `TOPIC_NOT_IN_PROGRESS` | Đề tài đã bị đình chỉ (`DISQUALIFIED`) | Disable các nút thao tác, hiển thị badge *"Đã dừng đồ án"* |
| **409** | `3080` | `OUTLINE_STAGE_INVALID` | Đề tài chưa đến hoặc đã qua giai đoạn đề cương | Disable nút thẩm định |
| **409** | `3082` | `OUTLINE_NOT_SUBMITTED` | Sinh viên chưa nộp file đề cương | Disable nút góp ý, hiển thị: *"Sinh viên chưa nộp đề cương"* |
| **409** | `3083` | `OUTLINE_NOT_PENDING` | Đề cương không ở trạng thái PENDING | Disable nút thẩm định, hiển thị trạng thái hiện tại |
| **409** | `3100` | `OUTLINE_TOPIC_TITLE_NOT_CONFIRMED` | **Tên đề tài chưa được GVHD xác nhận** | **Popup cảnh báo nổi bật**: *"Tên đề tài chưa được Giảng viên hướng dẫn xác nhận, chưa thể duyệt đạt đề cương. Vui lòng liên hệ GVHD chốt tên trước."* |

---

## 5. Hướng dẫn Code Mẫu Frontend (TypeScript + Axios + React)

### 5.1. Định nghĩa Types & Interfaces (`types/outline.ts`)

```typescript
export type OutlineStatus = 'PENDING' | 'REQUEST_CHANGES' | 'APPROVED' | 'REJECTED';
export type ThesisStage = 'STAGE_1_ADVISOR_ASSIGNED' | 'STAGE_2_TOPIC_CONFIRMED' | 'STAGE_3_OUTLINE_APPROVED' | string;
export type TopicStatus = 'IN_PROGRESS' | 'DISQUALIFIED' | 'COMPLETED' | string;
export type DeadlineStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'EXTENDED' | 'COMPLETED';

export interface APIResponse<T> {
  code: number;
  message?: string | null;
  data: T;
}

export interface ThesisOutlineHistoryResponse {
  publicId: string;
  outlineHistoryFile: string;
  submissionNote?: string | null;
  status: OutlineStatus;
  statusDescription: string;
  submittedAt: string;
  reviewerPublicId?: string | null;
  reviewerName?: string | null;
  reviewFeedback?: string | null;
  reviewedAt?: string | null;
}

export interface ThesisOutlineResponse {
  publicId: string;
  topicPublicId: string;
  topicName?: string | null;
  currentStage: ThesisStage;
  topicStatus: TopicStatus;
  disqualificationReason?: string | null;
  studentPublicId: string;
  studentCode: string;
  studentName: string;
  lecturerPublicId?: string | null;
  lecturerName?: string | null;
  coLecturerPublicId?: string | null;
  coLecturerName?: string | null;
  reviewerPublicId?: string | null;
  reviewerName?: string | null;
  title?: string | null;
  outlineFile?: string | null;
  status?: OutlineStatus | null;
  statusDescription?: string | null;
  reviewFeedback?: string | null;
  advisorFeedback?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  canReview: boolean;
  canWriteAdvisorFeedback: boolean;
  deadlineName?: string | null;
  deadlineStartDate?: string | null;
  deadlineEndDate?: string | null;
  deadlineActive?: boolean | null;
  deadlineStatus?: string | null;
  histories?: ThesisOutlineHistoryResponse[] | null;
}

export interface OutlineReviewRequest {
  decision: OutlineStatus;
  feedback: string;
}

export interface OutlineAdvisorFeedbackRequest {
  feedback: string;
}
```

---

### 5.2. Service API (`services/outlineService.ts`)

```typescript
import apiClient from './apiClient'; // Instance Axios đã cấu hình withCredentials: true
import {
  APIResponse,
  ThesisOutlineResponse,
  OutlineReviewRequest,
  OutlineAdvisorFeedbackRequest,
  OutlineStatus
} from '../types/outline';

export const outlineService = {
  // 1. GVHD xem danh sách sinh viên mình hướng dẫn
  getSupervisorOutlines: async (semesterId?: string, status?: OutlineStatus) => {
    const response = await apiClient.get<APIResponse<ThesisOutlineResponse[]>>('/outline/supervisor-list', {
      params: { semesterId, status }
    });
    return response.data;
  },

  // 2. GVNX xem danh sách sinh viên được phân công thẩm định
  getReviewerOutlines: async (semesterId?: string, status?: OutlineStatus) => {
    const response = await apiClient.get<APIResponse<ThesisOutlineResponse[]>>('/outline/review-list', {
      params: { semesterId, status }
    });
    return response.data;
  },

  // 3. Xem chi tiết đề cương & lịch sử
  getOutlineDetail: async (publicId: string) => {
    const response = await apiClient.get<APIResponse<ThesisOutlineResponse>>(`/outline/${publicId}`);
    return response.data;
  },

  // 4. GVNX thẩm định đề cương (APPROVED / REQUEST_CHANGES / REJECTED)
  reviewOutline: async (publicId: string, payload: OutlineReviewRequest) => {
    const response = await apiClient.put<APIResponse<void>>(`/outline/${publicId}/review`, payload);
    return response.data;
  },

  // 5. GVHD chính gửi nhận xét góp ý đề cương
  writeAdvisorFeedback: async (publicId: string, payload: OutlineAdvisorFeedbackRequest) => {
    const response = await apiClient.put<APIResponse<void>>(`/outline/${publicId}/advisor-feedback`, payload);
    return response.data;
  },

  // 6. Lấy deadline học kỳ
  getOutlineDeadline: async (semesterId?: string) => {
    const response = await apiClient.get<APIResponse<{ thucHienDeadlines?: any[] }>>('/api/v1/deadlines', {
      params: { semesterId }
    });
    const deadlines = response.data.data?.thucHienDeadlines || [];
    return deadlines.find((d: any) => d.code === 'SV_CHINH_SUA_NOP_LAI_DE_CUONG');
  }
};
```

---

### 5.3. Custom Hooks React Query (`hooks/useOutline.ts`)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { outlineService } from '../services/outlineService';
import { OutlineStatus, OutlineReviewRequest, OutlineAdvisorFeedbackRequest } from '../types/outline';
import { toast } from 'react-toastify';

// Hook cho GVHD xem danh sách
export const useSupervisorOutlineList = (semesterId?: string, status?: OutlineStatus) => {
  return useQuery({
    queryKey: ['supervisor-outlines', semesterId, status],
    queryFn: () => outlineService.getSupervisorOutlines(semesterId, status)
  });
};

// Hook cho GVNX xem danh sách
export const useReviewerOutlineList = (semesterId?: string, status?: OutlineStatus) => {
  return useQuery({
    queryKey: ['reviewer-outlines', semesterId, status],
    queryFn: () => outlineService.getReviewerOutlines(semesterId, status)
  });
};

// Hook xem chi tiết đề cương
export const useOutlineDetail = (publicId?: string) => {
  return useQuery({
    queryKey: ['outline-detail', publicId],
    queryFn: () => outlineService.getOutlineDetail(publicId!),
    enabled: Boolean(publicId)
  });
};

// Hook xem deadline
export const useOutlineDeadline = (semesterId?: string) => {
  return useQuery({
    queryKey: ['outline-deadline', semesterId],
    queryFn: () => outlineService.getOutlineDeadline(semesterId)
  });
};

// Mutation thẩm định đề cương (GVNX)
export const useReviewOutlineMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ publicId, payload }: { publicId: string; payload: OutlineReviewRequest }) =>
      outlineService.reviewOutline(publicId, payload),
    onSuccess: () => {
      toast.success('Thẩm định đề cương thành công!');
      queryClient.invalidateQueries({ queryKey: ['reviewer-outlines'] });
      queryClient.invalidateQueries({ queryKey: ['outline-detail'] });
    },
    onError: (error: any) => {
      const errCode = error?.response?.data?.code;
      const errMsg = error?.response?.data?.message;
      if (errCode === 3100) {
        toast.error('Tên đề tài chưa được GVHD xác nhận. Chưa thể duyệt đạt đề cương!');
      } else {
        toast.error(errMsg || 'Thẩm định đề cương thất bại!');
      }
    }
  });
};

// Mutation gửi nhận xét góp ý (GVHD)
export const useAdvisorFeedbackMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ publicId, payload }: { publicId: string; payload: OutlineAdvisorFeedbackRequest }) =>
      outlineService.writeAdvisorFeedback(publicId, payload),
    onSuccess: () => {
      toast.success('Gửi nhận xét góp ý thành công!');
      queryClient.invalidateQueries({ queryKey: ['supervisor-outlines'] });
      queryClient.invalidateQueries({ queryKey: ['outline-detail'] });
    },
    onError: (error: any) => {
      const errMsg = error?.response?.data?.message;
      toast.error(errMsg || 'Gửi góp ý đề cương thất bại!');
    }
  });
};
```

---

## 6. Gợi ý Thiết kế Giao diện (UI/UX Best Practices)

### 6.1. Giao diện Giảng viên Hướng dẫn (Supervisor View)
1. **Banner thông tin thời hạn**:
   - Hiển thị ngày bắt đầu, ngày kết thúc và trạng thái hạn nộp: `Đang mở nhận bài` (Xanh), `Gia hạn chấm` (Cam), hoặc `Đã hết hạn` (Xám).
2. **Bộ lọc trạng thái (Tabs / Select)**:
   - Tất cả | Chờ thẩm định (`PENDING`) | Yêu cầu sửa (`REQUEST_CHANGES`) | Đã duyệt (`APPROVED`) | Không đạt (`REJECTED`).
3. **Bảng danh sách sinh viên**:
   - Cột: Mã SV, Tên SV, Tên đề tài, GV Nhận xét, Phiên bản nộp gần nhất, Trạng thái, Thao tác.
   - Nút **"Xem đề cương"**: Mở file `.docx` / `.pdf` trực tiếp từ URL Cloudinary (`item.outlineFile`).
   - Nút **"Lịch sử nộp"**: Mở drawer hiển thị timeline các lần nộp của SV (gồm ngày nộp, ghi chú của SV, nhận xét của GVNX).
   - Nút **"Gửi góp ý"**: 
     - Chỉ enable khi `item.canWriteAdvisorFeedback === true` (GVHD chính) và `item.topicStatus === 'IN_PROGRESS'`.
     - Nếu là đồng GVHD (`canWriteAdvisorFeedback === false`), ẩn nút hoặc disable kèm tooltip: *"Chỉ GVHD chính mới có quyền gửi nhận xét"*.
     - Mở modal cho phép GVHD nhập nội dung góp ý (`textarea`), hiển thị lại nhận xét cũ nếu đã từng gửi.

### 6.2. Giao diện Giảng viên Nhận xét (Reviewer View)
1. **Bộ lọc ưu tiên**:
   - Tab mặc định: **"Cần thẩm định"** (`status=PENDING`).
   - Tab phụ: **"Đã xử lý"** (`status=APPROVED,REJECTED,REQUEST_CHANGES`).
2. **Hành động thẩm định (Modal Thẩm định)**:
   - Hiển thị thông tin đề tài, tên SV, link tải file đề cương và các lần nộp trước đó.
   - **Lựa chọn kết quả linh hoạt theo mốc**:
     - Khi mốc ở `IN_PROGRESS` (thời gian nộp): Cho chọn 2 radio: `Duyệt ĐẠT (APPROVED)` hoặc `Yêu cầu chỉnh sửa (REQUEST_CHANGES)`.
     - Khi mốc ở `EXTENDED` (thời gian gia hạn chấm): Cho chọn 2 radio: `Duyệt ĐẠT (APPROVED)` hoặc `Không đạt (REJECTED)`.
   - **Cảnh báo trước khi chọn Duyệt ĐẠT**:
     - Kiểm tra nếu `item.currentStage !== 'STAGE_2_TOPIC_CONFIRMED'` hoặc chưa có tên đề tài: Hiển thị alert cảnh báo màu vàng: *"Sinh viên chưa được GVHD chốt tên đề tài chính thức. Nếu chọn Duyệt Đạt hệ thống sẽ báo lỗi."*
   - Ô nhập nhận xét: `Textarea` bắt buộc, có đếm số ký tự, validate không được để trống trước khi bấm Lưu.

