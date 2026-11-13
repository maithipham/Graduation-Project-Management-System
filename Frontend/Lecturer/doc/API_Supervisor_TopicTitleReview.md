# Hướng dẫn Tích hợp API: Quản lý & Thẩm định Yêu cầu Đổi / Chốt Tên Đề tài (Dành cho Giảng viên Hướng dẫn)

Tài liệu hướng dẫn kết nối Frontend (`Frontend/Lecturer`) với Backend (`tlu_gpms_system`) cho **Giảng viên Hướng dẫn (GVHD)** thuộc **Giai đoạn 2: Chốt & Đổi tên đề tài chính thức**:
1. **Xem danh sách đơn yêu cầu chốt / đổi tên đề tài** của sinh viên do mình hướng dẫn (chính hoặc phụ) theo học kỳ và trạng thái đơn (`GET /topic/title-request`).
2. **Xem và hiển thị thời hạn đổi / chốt tên đề tài** (sử dụng chung mốc `SV_CHINH_SUA_NOP_LAI_DE_CUONG` với nộp đề cương).
3. **Phê duyệt hoặc Từ chối yêu cầu tên đề tài** (`PUT /topic/title-request/{publicId}/review`) — **chỉ GVHD chính** mới có quyền xử lý; GVHD đồng hướng dẫn chỉ có quyền xem.
4. **Xem toàn bộ lịch sử thay đổi tên của một đề tài cụ thể** (`GET /topic/{topicPublicId}/title-history`) để phục vụ xem timeline chi tiết.

> **Tài liệu liên quan**:
> - Luồng sinh viên gửi tên & đổi tên: [API_Create_Update_topicName.md](../../Student/doc/API_Create_Update_topicName.md)
> - Luồng sinh viên nộp đề cương: [API_Student_Outline.md](../../Student/doc/API_Student_Outline.md)
> - Luồng GVHD nộp phiếu theo dõi tiến độ (GĐ 4): [API_Supervisor_ProgressReport.md](./API_Supervisor_ProgressReport.md)

---

## 1. Tổng quan Nghiệp vụ & Quy tắc Phân quyền

```
          [ Sinh viên gửi tên chính thức lần đầu (GĐ 2) hoặc xin đổi tên đề tài ]
                                             │
                                             ▼
           GVHD gọi: GET /topic/title-request?semesterId={uuid}&status={status?}
       (Lấy danh sách các đơn yêu cầu của sinh viên mình hướng dẫn chính hoặc phụ)
                                             │
          ┌──────────────────────────────────┴──────────────────────────────────┐
          ▼                                                                     ▼
  [Là GVHD đồng hướng dẫn]                                              [Là GVHD chính]
     canReview = false                                                 canReview = true
  -> Chỉ được xem danh sách &                                           -> Khi đơn có status === 'PENDING',
     timeline lịch sử                                                      đề tài status === 'IN_PROGRESS'
     (Gọi duyệt/từ chối -> 403 FORBIDDEN)                                 và deadlineStatus ∈ {"OPEN", "EXTENDED"}:
                                                                        GVHD chính gọi:
                                                                        PUT /topic/title-request/{publicId}/review
                                                                        { decision: "APPROVED" | "REJECTED" }
                                                                                │
                                           ┌────────────────────────────────────┴────────────────────────────────────┐
                                           ▼                                                                         ▼
                                      [APPROVED]                                                                [REJECTED]
                     - topic_title_history.status = APPROVED                                   - topic_title_history.status = REJECTED
                     - thesis_topic.name = newName                                             - thesis_topic.name giữ nguyên
                     - Nếu chốt tên lần đầu: đề tài chuyển                                      - SV được gửi lại nếu còn hạn nộp (OPEN)
                       sang STAGE_2_TOPIC_CONFIRMED                                             - Nếu trong gia hạn chấm (EXTENDED): SV không
                     - Nếu đổi tên: giữ nguyên STAGE_2                                           được gửi lại; Job quét kế tiếp sẽ xử lý
                     - Bắn thông báo SSE cho sinh viên                                         - Bắn thông báo SSE cho sinh viên
```

### Lưu ý nghiệp vụ quan trọng
- **Phân biệt quyền hạn giữa GVHD chính và GVHD đồng hướng dẫn (`coLecturer`)**:
  - API `GET /topic/title-request` trả về đề tài của **cả GVHD chính (`lecturer`) lẫn GVHD đồng hướng dẫn (`coLecturer`)**.
  - **Chỉ GVHD chính** mới có quyền duyệt hoặc từ chối đơn (`canReview: true`).
  - **GVHD đồng hướng dẫn chỉ có quyền xem** (`canReview: false`). Nếu GVHD đồng hướng dẫn cố tình gọi `PUT /topic/title-request/{publicId}/review`, Backend sẽ chặn lại với lỗi `403 FORBIDDEN` (*"Giảng viên đồng hướng dẫn chỉ có quyền xem, không có quyền duyệt tên đề tài"*).
- **Mốc thời hạn áp dụng (Dùng chung mốc nộp đề cương `SV_CHINH_SUA_NOP_LAI_DE_CUONG`)**:
  - Cả chốt tên đề tài lần đầu và xin đổi tên đề tài đều **dùng chung mốc thời hạn với nộp đề cương** (`SV_CHINH_SUA_NOP_LAI_DE_CUONG`). Không còn mốc riêng `CHOT_TEN_DE_TAI`.
  - **Trong thời gian nộp (`OPEN`)**: Sinh viên được nộp/đổi tên; GVHD chính được duyệt/từ chối.
  - **Trong thời gian gia hạn chấm (`EXTENDED`)**:
    - Khóa toàn bộ quyền gửi/đổi tên của sinh viên (sinh viên không được gửi đơn mới).
    - **GVHD chính VẪN ĐƯỢC PHÉP DUYỆT (`APPROVED`) HOẶC TỪ CHỐI (`REJECTED`)** các đơn đang `PENDING` đã gửi trước đó.
  - **Quá `endDate` hoặc mốc `COMPLETED` (`CLOSED`)**: Khóa quyền duyệt của GVHD (`3055 - TOPIC_CONFIRMATION_GRADING_CLOSED`). Nếu vẫn còn đơn `PENDING`, TBM bắt buộc phải lùi `endDate` và giữ mốc ở `EXTENDED` để GVHD duyệt nốt.
- **Biến động đề tài khi Phê duyệt (`APPROVED`)**:
  - Với đơn **chốt tên lần đầu** (đề tài đang ở `STAGE_1_ADVISOR_ASSIGNED`, `oldName: null`): Khi GVHD duyệt `APPROVED`, đề tài tự động nhảy mốc sang **`STAGE_2_TOPIC_CONFIRMED`**. Đây là điều kiện tiên quyết để Giảng viên nhận xét (GVNX) có thể duyệt ĐẠT đề cương ở Giai đoạn 3.
  - Với đơn **xin đổi tên** (đề tài đã ở `STAGE_2_TOPIC_CONFIRMED`, `oldName != null`): Cập nhật `name` mới, giữ nguyên mốc `STAGE_2_TOPIC_CONFIRMED`.
  - **Lưu ý**: Sau khi đề cương đã được GVNX duyệt ĐẠT (đề tài lên `STAGE_3_OUTLINE_APPROVED` trở đi), sinh viên **không thể xin đổi tên nữa** (Backend chặn với `TOPIC_STAGE_INVALID_FOR_TITLE`).
- **Thông báo Real-time qua SSE**:
  - Khi sinh viên gửi tên/đổi tên $\rightarrow$ GVHD chính nhận được thông báo SSE real-time.
  - Khi GVHD duyệt hoặc từ chối $\rightarrow$ Sinh viên nhận thông báo SSE real-time kết quả (`được phê duyệt` hoặc `bị từ chối`), **không gửi email**.

---

## 2. Danh sách API Endpoints

Tất cả API trả về cấu trúc wrapper chuẩn `APIResponse<T>` (`{ code: 1000, message?: string, data: T }`) với HTTP `200 OK` khi thành công.

| Chức năng | Phương thức | Endpoint | Quyền (`@PreAuthorize`) | Content-Type |
|---|:---:|---|---|---|
| **1. Danh sách đơn yêu cầu tên đề tài theo học kỳ & trạng thái** | `GET` | `/topic/title-request?semesterId={uuid}&status={status}` | `VIEW_ADVISED_STUDENT`, `REVIEW_TOPIC` hoặc `SUPERVISOR` | `application/json` |
| **2. Xem toàn bộ lịch sử thay đổi tên của 1 đề tài cụ thể** | `GET` | `/topic/{topicPublicId}/title-history` | `VIEW_ADVISED_STUDENT`, `REVIEW_TOPIC` hoặc `SUPERVISOR` | `application/json` |
| **3. GVHD chính duyệt hoặc từ chối yêu cầu tên đề tài** | `PUT` | `/topic/title-request/{publicId}/review` | `REVIEW_TOPIC` hoặc `SUPERVISOR` | `application/json` |
| **4. Lấy thông tin mốc thời hạn theo học kỳ (Deadline)** | `GET` | `/api/v1/deadlines?semesterId={uuid}` | `VIEW_SCHEDULE`, `SUPERVISOR`, `ADMIN`, `HEAD_OF_MAJOR`, `STUDENT` | `application/json` |

> **Ghi chú xác thực**: Yêu cầu gửi kèm cookie `access_token` (`withCredentials: true`) hoặc header `Authorization: Bearer <token>`.

---

## 3. Chi tiết từng API

### 3.1. Danh sách đơn yêu cầu đổi / chốt tên đề tài

- **Endpoint**: `GET /topic/title-request`
- **Query Params**:
  - `semesterId` (`UUID`, *không bắt buộc*): `publicId` của học kỳ cần xem. Nếu bỏ trống, Backend tự động lấy học kỳ hiện tại (`ONGOING`).
  - `status` (`TopicTitleChangeStatus`, *không bắt buộc*): Lọc theo trạng thái đơn:
    - Bỏ trống: Lấy toàn bộ đơn (`PENDING`, `APPROVED`, `REJECTED`).
    - `PENDING`: Lọc các đơn đang chờ duyệt (thường dùng làm tab mặc định).
    - `APPROVED`: Lọc các đơn đã được duyệt.
    - `REJECTED`: Lọc các đơn đã bị từ chối.
- **Response Success (HTTP 200)**:

```json
{
  "code": 1000,
  "message": null,
  "data": [
    {
      "publicId": "018db26a-932f-789a-bc01-111111111111",
      "topicPublicId": "018db26a-932f-789a-bc01-e23456789abc",
      "studentPublicId": "018db26a-932f-789a-bc01-222222222222",
      "studentCode": "2051060001",
      "studentName": "Nguyễn Văn An",
      "oldName": "Xây dựng hệ thống Quản lý Đồ án TLU",
      "newName": "Nghiên cứu và phát triển Hệ thống Quản lý Đồ án TLU GPMS",
      "status": "PENDING",
      "statusDescription": "Chờ giảng viên hướng dẫn xác nhận",
      "requestedAt": "2026-11-12T14:30:00",
      "reviewedAt": null,
      "reviewerPublicId": null,
      "reviewerName": null,
      "canReview": true
    },
    {
      "publicId": "018db26a-932f-789a-bc01-333333333333",
      "topicPublicId": "018db26a-932f-789a-bc01-f34567890def",
      "studentPublicId": "018db26a-932f-789a-bc01-444444444444",
      "studentCode": "2051060002",
      "studentName": "Trần Thị Mai",
      "oldName": null,
      "newName": "Ứng dụng AI trong hỗ trợ chấm bài tập lập trình",
      "status": "APPROVED",
      "statusDescription": "Đã được phê duyệt",
      "requestedAt": "2026-11-10T09:15:00",
      "reviewedAt": "2026-11-11T10:00:00",
      "reviewerPublicId": "018db26a-932f-789a-bc01-555555555555",
      "reviewerName": "TS. Phạm Thái An",
      "canReview": true
    },
    {
      "publicId": "018db26a-932f-789a-bc01-666666666666",
      "topicPublicId": "018db26a-932f-789a-bc01-a12345678bbb",
      "studentPublicId": "018db26a-932f-789a-bc01-777777777777",
      "studentCode": "2051060003",
      "studentName": "Lê Hoàng Nam",
      "oldName": "Phần mềm Quản lý Thư viện",
      "newName": "Hệ thống Quản lý Thư viện thông minh sử dụng RFID",
      "status": "PENDING",
      "statusDescription": "Chờ giảng viên hướng dẫn xác nhận",
      "requestedAt": "2026-11-12T16:00:00",
      "reviewedAt": null,
      "reviewerPublicId": null,
      "reviewerName": null,
      "canReview": false
    }
  ]
}
```

#### Giải thích ý nghĩa các trường dữ liệu:
| Trường | Kiểu dữ liệu | Ý nghĩa |
|---|---|---|
| `publicId` | `string (UUID)` | ID duy nhất của bản ghi yêu cầu (dùng để truyền vào URL khi gọi API duyệt/từ chối). |
| `topicPublicId` | `string (UUID)` | ID của đề tài đồ án (dùng để xem toàn bộ lịch sử thay đổi tên). |
| `studentPublicId` | `string (UUID)` | ID của sinh viên. |
| `studentCode` | `string` | Mã sinh viên (VD: `2051060001`). |
| `studentName` | `string` | Họ và tên sinh viên. |
| `oldName` | `string \| null` | **Tên đề tài cũ**: <br>• Nếu là **`null`**: Đây là **đơn chốt tên đề tài chính thức lần đầu** (sinh viên chưa có tên trước đó).<br>• Nếu có giá trị chuỗi: Đây là **đơn xin đổi tên đề tài**. |
| `newName` | `string` | **Tên đề tài mới** do sinh viên đề xuất. |
| `status` | `string` | Trạng thái đơn: `'PENDING'` \| `'APPROVED'` \| `'REJECTED'`. |
| `statusDescription` | `string` | Mô tả tiếng Việt: `"Chờ giảng viên hướng dẫn xác nhận"`, `"Đã được phê duyệt"`, `"Bị từ chối"`. |
| `requestedAt` | `string (ISO)` | **Thời gian sinh viên gửi đơn** (VD: `"2026-11-12T14:30:00"`). |
| `reviewedAt` | `string (ISO) \| null` | **Thời gian giảng viên xử lý đơn** (null nếu đang `PENDING`). |
| `reviewerPublicId` | `string (UUID) \| null` | ID giảng viên đã xử lý đơn (null nếu chưa duyệt). |
| `reviewerName` | `string \| null` | Tên giảng viên đã xử lý đơn. |
| `canReview` | `boolean` | **Cờ phân quyền quan trọng**:<br>• `true`: Giảng viên đang đăng nhập là **GVHD chính** $\rightarrow$ có quyền bấm nút Duyệt / Từ chối.<br>• `false`: Giảng viên đang đăng nhập là **GVHD đồng hướng dẫn** $\rightarrow$ chỉ xem, ẩn hoặc khóa nút Duyệt / Từ chối. |

---

### 3.2. Giảng viên hướng dẫn chính duyệt hoặc từ chối yêu cầu tên đề tài

- **Endpoint**: `PUT /topic/title-request/{publicId}/review`
- **Path Param**:
  - `publicId` (`UUID`, **bắt buộc**): `publicId` của bản ghi yêu cầu (lấy từ trường `publicId` ở API 3.1).
- **Request Body (`application/json`)**:

```json
{
  "decision": "APPROVED"
}
```
*Hoặc khi từ chối:*
```json
{
  "decision": "REJECTED"
}
```

- **Validation Body**:
  - `decision` (**bắt buộc**, không được null): Chỉ nhận một trong hai giá trị `'APPROVED'` hoặc `'REJECTED'`.
- **Response Success (HTTP 200)**:

```json
{
  "code": 1000,
  "message": "Xử lý yêu cầu tên đề tài thành công",
  "data": null
}
```

---

### 3.3. Xem toàn bộ lịch sử thay đổi tên của một đề tài cụ thể

Dùng khi click vào một đề tài hoặc sinh viên để mở Drawer / Modal xem timeline lịch sử thay đổi tên qua các lần nộp.

- **Endpoint**: `GET /topic/{topicPublicId}/title-history`
- **Path Param**:
  - `topicPublicId` (`UUID`, **bắt buộc**): `publicId` của đề tài (lấy từ trường `topicPublicId` ở API 3.1).
- **Response Success (HTTP 200)**:
  - Trả về danh sách `TopicTitleHistoryResponse[]` được sắp xếp theo thời gian gửi giảm dần (`requestedAt DESC`).

```json
{
  "code": 1000,
  "message": null,
  "data": [
    {
      "publicId": "018db26a-932f-789a-bc01-111111111111",
      "topicPublicId": "018db26a-932f-789a-bc01-e23456789abc",
      "studentPublicId": "018db26a-932f-789a-bc01-222222222222",
      "studentCode": "2051060001",
      "studentName": "Nguyễn Văn An",
      "oldName": "Xây dựng hệ thống Quản lý Đồ án TLU",
      "newName": "Nghiên cứu và phát triển Hệ thống Quản lý Đồ án TLU GPMS",
      "status": "PENDING",
      "statusDescription": "Chờ giảng viên hướng dẫn xác nhận",
      "requestedAt": "2026-11-12T14:30:00",
      "reviewedAt": null,
      "reviewerPublicId": null,
      "reviewerName": null,
      "canReview": true
    },
    {
      "publicId": "018db26a-932f-789a-bc01-000000000000",
      "topicPublicId": "018db26a-932f-789a-bc01-e23456789abc",
      "studentPublicId": "018db26a-932f-789a-bc01-222222222222",
      "studentCode": "2051060001",
      "studentName": "Nguyễn Văn An",
      "oldName": null,
      "newName": "Xây dựng hệ thống Quản lý Đồ án TLU",
      "status": "APPROVED",
      "statusDescription": "Đã được phê duyệt",
      "requestedAt": "2026-11-05T08:00:00",
      "reviewedAt": "2026-11-06T15:20:00",
      "reviewerPublicId": "018db26a-932f-789a-bc01-555555555555",
      "reviewerName": "TS. Phạm Thái An",
      "canReview": true
    }
  ]
}
```

---

### 3.4. Lấy thông tin Hạn đổi / Chốt tên đề tài (Deadline)

Mốc hạn chốt và đổi tên đề tài dùng chung mốc **`SV_CHINH_SUA_NOP_LAI_DE_CUONG`** (*"Hạn sinh viên chỉnh sửa & nộp lại đề cương"*). Phía Giảng viên gọi API lấy danh sách mốc thời hạn của học kỳ:

- **Endpoint**: `GET /api/v1/deadlines?semesterId={semesterId}`
- **Response Success (HTTP 200)**: Trả về `DeadlineGroupedResponse`. Frontend tìm mốc trong danh sách `thucHienDeadlines` (hoặc duyệt toàn bộ các danh sách) với điều kiện:
  ```typescript
  const outlineDeadline = response.data.thucHienDeadlines?.find(
    (d) => d.code === 'SV_CHINH_SUA_NOP_LAI_DE_CUONG'
  );
  ```

#### Cấu trúc đối tượng Deadline tìm được:
```typescript
interface DeadlineResponse {
  deadlineId: string;
  code: string; // 'SV_CHINH_SUA_NOP_LAI_DE_CUONG'
  name: string; // 'Hạn sinh viên chỉnh sửa & nộp lại đề cương'
  startDate: string | null; // ISO Date: "2026-11-01T00:00:00"
  endDate: string | null;   // ISO Date: "2026-11-20T23:59:59"
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXTENDED';
}
```

#### Quy tắc hiển thị thời hạn và trạng thái trên UI:
```typescript
export type TopicDeadlineDisplayStatus =
  | 'NOT_CONFIGURED' // Chưa có hạn
  | 'NOT_STARTED'    // Chưa đến ngày mở
  | 'OPEN'           // Đang trong thời gian nộp
  | 'EXTENDED'       // Đang trong thời gian gia hạn chấm cho giảng viên
  | 'CLOSED';        // Đã hết hạn

export const computeTopicDeadlineStatus = (
  deadline?: DeadlineResponse | null
): { status: TopicDeadlineDisplayStatus; label: string; canTeacherReview: boolean } => {
  if (!deadline || !deadline.startDate || !deadline.endDate) {
    return {
      status: 'NOT_CONFIGURED',
      label: 'Chưa có',
      canTeacherReview: false,
    };
  }

  const now = new Date();
  const start = new Date(deadline.startDate);
  const end = new Date(deadline.endDate);

  if (deadline.status === 'COMPLETED' || now > end) {
    return {
      status: 'CLOSED',
      label: `Đã hết hạn (${formatDate(deadline.endDate)})`,
      canTeacherReview: false,
    };
  }

  if (now < start) {
    return {
      status: 'NOT_STARTED',
      label: `Chưa mở (Từ ${formatDate(deadline.startDate)})`,
      canTeacherReview: false,
    };
  }

  if (deadline.status === 'EXTENDED') {
    return {
      status: 'EXTENDED',
      label: `Đã hết hạn nộp — Đang gia hạn chấm đến ${formatDate(deadline.endDate)}`,
      canTeacherReview: true, // GVHD chính vẫn ĐƯỢC DUYỆT khi đang EXTENDED
    };
  }

  // Đang trong hạn mở (IN_PROGRESS và startDate <= now <= endDate)
  return {
    status: 'OPEN',
    label: `Từ ${formatDate(deadline.startDate)} đến ${formatDate(deadline.endDate)}`,
    canTeacherReview: true,
  };
};
```

---

## 4. Bảng mã lỗi Backend (ErrorCode) & Hướng dẫn xử lý UI

| HTTP Status | Mã Code | Tên ErrorCode | Ý nghĩa nghiệp vụ | Hướng dẫn hiển thị trên UI |
|:---:|:---:|---|---|---|
| **403** | `2001` | `FORBIDDEN` | Giảng viên đồng hướng dẫn chỉ có quyền xem, không có quyền duyệt tên đề tài. | Toast cảnh báo: *"Bạn là giảng viên đồng hướng dẫn, chỉ có quyền xem yêu cầu này."* |
| **403** | `2001` | `FORBIDDEN` | Bạn không có quyền xử lý yêu cầu của đề tài này (không phải GVHD chính). | Toast lỗi: *"Bạn không phụ trách hướng dẫn chính cho sinh viên này."* |
| **403** | `3055` | `TOPIC_CONFIRMATION_GRADING_CLOSED` | Đã quá thời hạn giảng viên xác nhận tên đề tài. | Toast lỗi: *"Đã quá thời hạn xác nhận tên đề tài, vui lòng liên hệ Trưởng bộ môn gia hạn chấm."* |
| **409** | `3052` | `TOPIC_TITLE_NOT_PENDING` | Đơn yêu cầu này đã được xử lý (APPROVED/REJECTED) trước đó. | Toast thông báo: *"Yêu cầu này đã được xử lý trước đó. Danh sách sẽ được tải lại."* $\rightarrow$ Tự động reload danh sách. |
| **409** | `3056` | `TOPIC_STAGE_INVALID_FOR_TITLE` | Đề tài không ở giai đoạn hợp lệ để thực hiện thao tác này. | Toast lỗi: *"Đề tài hiện không ở giai đoạn có thể duyệt tên."* |
| **409** | `3057` | `TOPIC_NOT_IN_PROGRESS` | Đề tài đã bị đình chỉ (`DISQUALIFIED`) hoặc đã kết thúc/hủy. | Toast cảnh báo: *"Đề tài này hiện không ở trạng thái đang thực hiện."* |
| **404** | `3050` | `TOPIC_TITLE_HISTORY_NOT_FOUND` | Không tìm thấy bản ghi đơn yêu cầu chốt/đổi tên đề tài. | Toast lỗi: *"Không tìm thấy đơn yêu cầu cần xử lý."* |
| **404** | `3053` | `TOPIC_CONFIRMATION_DEADLINE_NOT_FOUND` | Chưa cấu hình thời hạn nộp đề cương và cập nhật tên đề tài cho kỳ này. | Toast cảnh báo: *"Học kỳ này chưa được thiết lập thời hạn chốt/đổi tên đề tài."* |
| **400** | `4000` | `TOPIC_TITLE_DECISION_NULL` | Chưa chọn quyết định phê duyệt hoặc từ chối. | Validate trước khi submit modal. |
| **400** | `4000` | `TOPIC_TITLE_DECISION_INVALID` | Quyết định chỉ được nhận giá trị `APPROVED` hoặc `REJECTED`. | Chỉ gửi 1 trong 2 enum chuẩn. |
| **401** | `2000` | `UNAUTHORIZED` | Phiên đăng nhập hết hạn. | Chuyển hướng về trang đăng nhập. |

---

## 5. Hướng dẫn Tích hợp Code Phía Frontend (TypeScript / React)

### 5.1. Khai báo Endpoints (`src/shared/api/endpoints.ts`)

```typescript
export const API_ENDPOINTS = {
  // ... các endpoint hiện tại ...
  topicTitle: {
    // Danh sách yêu cầu gửi đến GVHD
    supervisorRequests: '/topic/title-request',
    // Duyệt / từ chối yêu cầu
    review: (publicId: string) => `/topic/title-request/${publicId}/review`,
    // Lịch sử tên của 1 đề tài
    historyByTopic: (topicPublicId: string) => `/topic/${topicPublicId}/title-history`,
    // Danh sách deadline học kỳ
    deadlines: '/api/v1/deadlines',
  },
} as const;
```

---

### 5.2. Khai báo Types (`src/features/topic_title_management/types/topicTitleReview.types.ts`)

```typescript
export type TopicTitleChangeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface TopicTitleHistoryResponse {
  publicId: string;
  topicPublicId: string;
  studentPublicId: string;
  studentCode: string;
  studentName: string;
  oldName: string | null; // null nếu là chốt tên lần đầu
  newName: string;
  status: TopicTitleChangeStatus;
  statusDescription: string;
  requestedAt: string;
  reviewedAt: string | null;
  reviewerPublicId: string | null;
  reviewerName: string | null;
  canReview: boolean; // Chỉ true khi là GVHD chính
}

export interface TopicTitleReviewRequest {
  decision: 'APPROVED' | 'REJECTED';
}

export interface TopicTitleFilterParams {
  semesterId?: string;
  status?: TopicTitleChangeStatus;
}
```

---

### 5.3. Service Gọi API (`src/features/topic_title_management/services/topicTitleReview.service.ts`)

```typescript
import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoints';
import { APIResponse } from '@/shared/types/api';
import {
  TopicTitleFilterParams,
  TopicTitleHistoryResponse,
  TopicTitleReviewRequest,
} from '../types/topicTitleReview.types';

export const topicTitleReviewService = {
  // 1. Lấy danh sách yêu cầu tên đề tài của sinh viên hướng dẫn
  getRequestsForSupervisor: async (params?: TopicTitleFilterParams) => {
    const response = await apiClient.get<APIResponse<TopicTitleHistoryResponse[]>>(
      API_ENDPOINTS.topicTitle.supervisorRequests,
      { params }
    );
    return response.data.data;
  },

  // 2. GVHD chính duyệt hoặc từ chối yêu cầu
  reviewTopicTitle: async (publicId: string, payload: TopicTitleReviewRequest) => {
    const response = await apiClient.put<APIResponse<void>>(
      API_ENDPOINTS.topicTitle.review(publicId),
      payload
    );
    return response.data;
  },

  // 3. Xem lịch sử thay đổi tên của 1 đề tài cụ thể
  getTopicHistory: async (topicPublicId: string) => {
    const response = await apiClient.get<APIResponse<TopicTitleHistoryResponse[]>>(
      API_ENDPOINTS.topicTitle.historyByTopic(topicPublicId)
    );
    return response.data.data;
  },

  // 4. Lấy mốc thời hạn đề cương / đổi tên đề tài theo học kỳ
  getOutlineDeadline: async (semesterId: string) => {
    const response = await apiClient.get<APIResponse<{ thucHienDeadlines?: any[] }>>(
      API_ENDPOINTS.topicTitle.deadlines,
      { params: { semesterId } }
    );
    const deadlines = response.data.data?.thucHienDeadlines || [];
    return deadlines.find((d: any) => d.code === 'SV_CHINH_SUA_NOP_LAI_DE_CUONG') || null;
  },
};
```

---

### 5.4. React Query Hooks (`src/features/topic_title_management/hooks/useTopicTitleReview.ts`)

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { topicTitleReviewService } from '../services/topicTitleReview.service';
import {
  TopicTitleFilterParams,
  TopicTitleReviewRequest,
} from '../types/topicTitleReview.types';

export const TOPIC_TITLE_QUERY_KEYS = {
  requests: (params?: TopicTitleFilterParams) => ['topic-title', 'supervisor-requests', params] as const,
  history: (topicPublicId: string) => ['topic-title', 'history', topicPublicId] as const,
  deadline: (semesterId: string) => ['topic-title', 'deadline', semesterId] as const,
};

// Hook lấy danh sách yêu cầu
export const useTopicTitleRequests = (params?: TopicTitleFilterParams) => {
  return useQuery({
    queryKey: TOPIC_TITLE_QUERY_KEYS.requests(params),
    queryFn: () => topicTitleReviewService.getRequestsForSupervisor(params),
  });
};

// Hook lấy lịch sử của 1 đề tài
export const useTopicTitleHistory = (topicPublicId?: string) => {
  return useQuery({
    queryKey: TOPIC_TITLE_QUERY_KEYS.history(topicPublicId || ''),
    queryFn: () => topicTitleReviewService.getTopicHistory(topicPublicId!),
    enabled: Boolean(topicPublicId),
  });
};

// Hook lấy deadline mốc đề cương / đổi tên
export const useTopicTitleDeadline = (semesterId?: string) => {
  return useQuery({
    queryKey: TOPIC_TITLE_QUERY_KEYS.deadline(semesterId || ''),
    queryFn: () => topicTitleReviewService.getOutlineDeadline(semesterId!),
    enabled: Boolean(semesterId),
  });
};

// Hook duyệt hoặc từ chối yêu cầu
export const useReviewTopicTitle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ publicId, payload }: { publicId: string; payload: TopicTitleReviewRequest }) =>
      topicTitleReviewService.reviewTopicTitle(publicId, payload),
    onSuccess: () => {
      // Invalidate lại danh sách và lịch sử
      queryClient.invalidateQueries({ queryKey: ['topic-title'] });
    },
  });
};
```

---

## 6. Logic Hiển Thị & UI/UX Checklist cho Frontend

Dựa vào dữ liệu trả về từ các API trên, giao diện phía Giảng viên cần tuân thủ các quy tắc sau:

### 1. Hiển thị Card / Banner Thời hạn nộp & chấm ở đầu trang:
- Gọi `useTopicTitleDeadline(selectedSemesterId)`.
- **Nếu `status === 'NOT_CONFIGURED'`**:
  - Hiển thị badge xám: `"Thời hạn: Chưa có"`.
  - Khóa toàn bộ các nút Duyệt / Từ chối (disable có tooltip giải thích: *"Chưa cấu hình thời hạn nộp & duyệt tên đề tài"*).
- **Nếu `status === 'OPEN'`**:
  - Hiển thị badge xanh lá: `"Thời hạn: Từ {startDate} đến {endDate} (Đang mở)"`.
  - Nút Duyệt / Từ chối mở bình thường cho GVHD chính đối với các đơn `PENDING`.
- **Nếu `status === 'EXTENDED'`**:
  - Hiển thị badge cam cảnh báo: `"Thời hạn nộp của sinh viên đã đóng. Đang trong thời gian gia hạn chấm của giảng viên đến {endDate}"`.
  - Nút Duyệt / Từ chối vẫn mở bình thường cho GVHD chính đối với các đơn `PENDING` đã nộp trước đó.
- **Nếu `status === 'CLOSED'`**:
  - Hiển thị badge đỏ: `"Đã hết hạn ({endDate})"`.
  - Khóa toàn bộ các nút Duyệt / Từ chối (disable có tooltip: *"Đã quá thời hạn duyệt tên đề tài. Vui lòng liên hệ Trưởng bộ môn để được gia hạn chấm"*).

---

### 2. Bảng Danh sách Đơn yêu cầu (`Table`):
Mỗi dòng trong bảng hiển thị đầy đủ thông tin:
- **Thông tin Sinh viên**: Mã SV (`studentCode`) + Tên SV (`studentName`).
- **Phân loại đơn**:
  - Nếu `oldName === null`: Badge xanh dương `"Chốt tên lần đầu"`.
  - Nếu `oldName != null`: Badge tím `"Xin đổi tên đề tài"`.
- **Nội dung tên đề tài**:
  - **Tên cũ**: Nếu có hiển thị text gạch ngang hoặc chữ xám mờ; nếu `oldName === null` hiển thị *"Chưa có (Chốt lần đầu)"*.
  - **Tên mới**: Hiển thị in đậm (bold), nổi bật.
- **Thời gian**:
  - Ngày gửi: `formatDateTime(requestedAt)` (VD: `14:30 12/11/2026`).
  - Ngày xử lý: `reviewedAt ? formatDateTime(reviewedAt) : '—'`.
- **Trạng thái đơn**:
  - `PENDING`: Badge vàng cam *"Chờ duyệt"*.
  - `APPROVED`: Badge xanh lá *"Đã duyệt"* (kèm tên người duyệt `reviewerName`).
  - `REJECTED`: Badge đỏ *"Đã từ chối"* (kèm tên người từ chối `reviewerName`).
- **Cột Thao tác (`Actions`)**:
  - Nút **"Lịch sử" (Icon con mắt hoặc đồng hồ)**: Luôn bật cho mọi đơn, click mở Drawer xem timeline chi tiết các lần đổi tên của đề tài (`useTopicTitleHistory(item.topicPublicId)`).
  - Nút **"Duyệt" (Phê duyệt)** và **"Từ chối"**:
    ```typescript
    const isPending = item.status === 'PENDING';
    const isMainSupervisor = item.canReview === true;
    const canReviewByDeadline = deadlineInfo?.canTeacherReview === true;

    const canAction = isPending && isMainSupervisor && canReviewByDeadline;
    ```
    - Nếu `isPending && !isMainSupervisor`: Hiển thị badge phụ *"Đồng hướng dẫn (Chỉ xem)"*, ẩn nút thao tác hoặc disable có tooltip: *"Chỉ giảng viên hướng dẫn chính mới có quyền duyệt tên đề tài."*
    - Nếu `isPending && isMainSupervisor && !canReviewByDeadline`: Disable nút kèm tooltip giải thích do thời hạn đã đóng (`CLOSED`) hoặc chưa mở.
    - Khi click **"Duyệt"**: Mở Modal xác nhận:
      > *"Bạn có chắc chắn muốn phê duyệt tên đề tài mới cho sinh viên **{studentName}**?*
      > 
      > *Tên mới: **{newName}**"*
      > 
      > *(Nếu là chốt tên lần đầu: Nhắc nhở thêm: "Đề tài sẽ được chính thức chuyển sang giai đoạn Chốt tên đề tài (STAGE_2_TOPIC_CONFIRMED) để sẵn sàng thẩm định đề cương.")*
    - Khi click **"Từ chối"**: Mở Modal xác nhận:
      > *"Bạn có chắc chắn muốn TỪ CHỐI yêu cầu tên đề tài này của sinh viên **{studentName}**?*
      > 
      > *Tên đề tài của sinh viên sẽ giữ nguyên tên cũ."*
    - Sau khi API trả về thành công: Đóng Modal, hiển thị toast thành công và tự động refetch lại danh sách (`queryClient.invalidateQueries`).

