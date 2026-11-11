# Hướng dẫn Tích hợp API: Nộp & Theo dõi Đề cương Đồ án (Dành cho Sinh viên)

Tài liệu hướng dẫn kết nối Frontend (`Frontend/Student`) với Backend (`tlu_gpms_system`) cho chức năng **Nộp, Nộp lại và Theo dõi Kết quả Thẩm định Đề cương** thuộc **Giai đoạn 2**:
1. **Xem đề cương hiện tại, lịch sử nộp và thời hạn nộp đề cương** (`GET /outline/my-outline`).
2. **Nộp mới hoặc nộp lại file đề cương** (`POST /outline/submit`).

> **Tài liệu liên quan**: Chốt tên đề tài lần đầu & xin đổi tên đề tài xem tại [API_Create_Update_topicName.md](./API_Create_Update_topicName.md).

---

## 1. Tổng quan Nghiệp vụ & Luồng xử lý (Workflow)

```
       [ Đề tài đã chốt tên chính thức (STAGE_2_TOPIC_CONFIRMED) & status = IN_PROGRESS ]
                 [ Đã được TBM phân công Giảng viên nhận xét đề cương ]
                                             │
                                             ▼
                         Kiểm tra qua GET /outline/my-outline
                  (Trả về thông tin đề tài + deadline + trạng thái nộp)
                                             │
                                             ▼
                      deadlineStatus === "OPEN" && status !== APPROVED/REJECTED
                                             │
                                             ▼
                          Sinh viên gọi: POST /outline/submit
                     (Multipart file + submissionNote? + title?)
                                             │
                                             ▼
                            Trạng thái đề cương: PENDING
                         (Chờ Giảng viên nhận xét thẩm định)
                                             │
               ┌─────────────────────────────┼─────────────────────────────┐
               ▼                             ▼                             ▼
          [APPROVED]                 [REQUEST_CHANGES]                 [REJECTED]
    Hoàn thành đề cương          Yêu cầu chỉnh sửa & nộp lại       Không đạt (trong hạn gia hạn)
 -> STAGE_3_OUTLINE_APPROVED      (SV sửa & gọi lại /submit        -> Đề tài: DISQUALIFIED
                                   khi deadlineStatus === "OPEN")
```

### Lưu ý nghiệp vụ quan trọng
- **Điều kiện tiên quyết để nộp đề cương**:
  1. Đề tài ở trạng thái `IN_PROGRESS` và đã chốt tên chính thức (`currentStage === "STAGE_2_TOPIC_CONFIRMED"`).
  2. Đã được phân công Giảng viên nhận xét đề cương (`reviewerPublicId != null`). Nếu chưa phân công, `POST /outline/submit` trả lỗi `3068` (`OUTLINE_REVIEWER_NOT_ASSIGNED`).
  3. Mốc thời hạn `SV_CHINH_SUA_NOP_LAI_DE_CUONG` phải đang ở trạng thái **`OPEN`** (`startDate <= now <= endDate` và trạng thái mốc khác `EXTENDED` / `COMPLETED`).
     - Khi `deadlineStatus === "EXTENDED"` (TBM mở gia hạn chấm để GV nhận xét chấm dứt điểm bài `PENDING`), sinh viên **không thể nộp/nộp lại đề cương**.
  4. Trạng thái đề cương hiện tại không phải `APPROVED` hoặc `REJECTED`. Nếu đang `PENDING` hoặc `REQUEST_CHANGES` và còn hạn mở (`OPEN`), sinh viên có thể nộp lại bản mới (tạo thêm bản ghi lịch sử mới).
- **`GET /outline/my-outline` không bao giờ trả `null` phần Deadline**:
  - Kể cả khi sinh viên **chưa được phân công GV nhận xét** (`publicId: null`, chưa có bản ghi `ThesisOutline`) hoặc **chưa có đề tài trong kỳ** (`topicPublicId: null`), API vẫn trả về đối tượng `ThesisOutlineResponse` chứa đầy đủ thông tin đề tài (nếu có) và 5 trường deadline thực tế (`deadlineName`, `deadlineStartDate`, `deadlineEndDate`, `deadlineActive`, `deadlineStatus`).

---

## 2. Danh sách API Endpoints

Tất cả API trả về cấu trúc wrapper chuẩn `APIResponse<T>` (`{ code: 1000, message?: string, data: T }`) với HTTP `200 OK` khi thành công.

| Chức năng | Phương thức | Endpoint | Quyền (`@PreAuthorize`) | Content-Type |
|---|:---:|---|---|---|
| **Xem đề cương, lịch sử & deadline** | `GET` | `/outline/my-outline?semesterId={uuid}` | `VIEW_TOPIC`, `SUBMIT_OUTLINE` hoặc `STUDENT` | `application/json` |
| **Nộp / Nộp lại đề cương** | `POST` | `/outline/submit` | `SUBMIT_OUTLINE` hoặc `STUDENT` | `multipart/form-data` |

> **Ghi chú xác thực**: Yêu cầu gửi kèm cookie `access_token` (`withCredentials: true`) hoặc header `Authorization: Bearer <token>`.

---

## 3. Chi tiết từng API

### 3.1. Xem đề cương hiện tại, lịch sử nộp và thời hạn nộp

- **Endpoint**: `GET /outline/my-outline`
- **Query Params**:
  - `semesterId` (`UUID`, *không bắt buộc*): `publicId` của học kỳ cần tra cứu. Nếu bỏ trống, Backend tự động lấy học kỳ hiện tại (`ONGOING`).
- **Response Success (HTTP 200)**:

```json
{
  "code": 1000,
  "message": null,
  "data": {
    "publicId": "018db26a-932f-789a-bc01-111111111111",
    "topicPublicId": "018db26a-932f-789a-bc01-e23456789abc",
    "topicName": "Xây dựng hệ thống Quản lý Đồ án TLU",
    "currentStage": "STAGE_2_TOPIC_CONFIRMED",
    "topicStatus": "IN_PROGRESS",
    "disqualificationReason": null,
    "studentPublicId": "018db26a-932f-789a-bc01-222222222222",
    "studentCode": "2051060001",
    "studentName": "Nguyễn Văn An",
    "lecturerPublicId": "018db26a-932f-789a-bc01-333333333333",
    "lecturerName": "Trần Văn Bình",
    "coLecturerPublicId": null,
    "coLecturerName": null,
    "reviewerPublicId": "018db26a-932f-789a-bc01-444444444444",
    "reviewerName": "Phạm Thị Dung",
    "title": "Xây dựng hệ thống Quản lý Đồ án TLU",
    "outlineFile": "https://res.cloudinary.com/.../de_cuong_v2.pdf",
    "status": "REQUEST_CHANGES",
    "statusDescription": "Yêu cầu chỉnh sửa",
    "reviewFeedback": "Cần làm rõ kiến trúc phân hệ và kế hoạch kiểm thử.",
    "advisorFeedback": "Đồng ý với góp ý của GV nhận xét, em bổ sung chương 3.",
    "submittedAt": "2026-11-10T10:15:00",
    "reviewedAt": "2026-11-10T16:40:00",
    "canReview": false,
    "canWriteAdvisorFeedback": false,
    "deadlineName": "Hạn sinh viên chỉnh sửa & nộp lại đề cương",
    "deadlineStartDate": "2026-11-01T00:00:00",
    "deadlineEndDate": "2026-11-20T23:59:59",
    "deadlineActive": true,
    "deadlineStatus": "OPEN",
    "histories": [
      {
        "publicId": "018db26a-932f-789a-bc01-555555555555",
        "outlineHistoryFile": "https://res.cloudinary.com/.../de_cuong_v2.pdf",
        "submissionNote": "Em nộp bản chỉnh sửa lần 2",
        "status": "REQUEST_CHANGES",
        "statusDescription": "Yêu cầu chỉnh sửa",
        "submittedAt": "2026-11-10T10:15:00",
        "reviewerPublicId": "018db26a-932f-789a-bc01-444444444444",
        "reviewerName": "Phạm Thị Dung",
        "reviewFeedback": "Cần làm rõ kiến trúc phân hệ và kế hoạch kiểm thử.",
        "reviewedAt": "2026-11-10T16:40:00"
      }
    ]
  }
}
```

#### Trường hợp chưa có bản ghi `ThesisOutline` (ví dụ mới ở `STAGE_1` hoặc chưa phân công GV nhận xét):
- `publicId`, `reviewerPublicId`, `reviewerName`, `outlineFile`, `status`, `submittedAt`, `reviewedAt` sẽ là `null`.
- `histories` là mảng rỗng `[]`.
- Vẫn có đủ `topicPublicId`, `topicName`, `currentStage`, `topicStatus`, `lecturerName` và **5 trường deadline** (`deadlineName`, `deadlineStartDate`, `deadlineEndDate`, `deadlineActive`, `deadlineStatus`).

---

### 3.2. Sinh viên nộp / nộp lại file đề cương

- **Endpoint**: `POST /outline/submit`
- **Content-Type**: `multipart/form-data`
- **Form Data Params**:
  - `file` (`File`, **bắt buộc**): File đề cương tải lên (PDF, DOCX...).
  - `submissionNote` (`string`, *không bắt buộc*): Ghi chú của sinh viên khi nộp/nộp lại.
  - `title` (`string`, *không bắt buộc*, tối đa `500` ký tự): Tiêu đề đề cương (nếu bỏ trống Backend tự lấy tiêu đề hiện tại của đề cương hoặc tên đề tài chính thức).
- **Response Success (HTTP 200)**:

```json
{
  "code": 1000,
  "message": "Nộp đề cương thành công",
  "data": null
}
```

---

## 4. Bảng mã lỗi Backend (ErrorCode)

| HTTP Status | Mã ErrorCode | Tên mã lỗi | Ý nghĩa nghiệp vụ & Gợi ý xử lý UI |
|:---:|:---:|---|---|
| **400** | `4000` | `OUTLINE_FILE_EMPTY` | File đề cương tải lên không được để trống. |
| **400** | `4000` | `OUTLINE_TITLE_TOO_LONG` | Tiêu đề đề cương không được vượt quá 500 ký tự. |
| **404** | `3073` | `OUTLINE_DEADLINE_NOT_FOUND` | Chưa cấu hình thời hạn nộp đề cương cho học kỳ này. |
| **403** | `3074` | `OUTLINE_SUBMISSION_DEADLINE_CLOSED` | Thời hạn sinh viên nộp đề cương chưa mở, đã kết thúc hoặc đang ở giai đoạn gia hạn chấm (`EXTENDED`). |
| **409** | `3068` | `OUTLINE_REVIEWER_NOT_ASSIGNED` | Đề tài chưa được phân công giảng viên nhận xét đề cương. |
| **409** | `3069` | `OUTLINE_STAGE_INVALID` | Đề tài chưa hoàn thành chốt tên chính thức (`STAGE_2_TOPIC_CONFIRMED`) hoặc không ở giai đoạn nộp đề cương. |
| **409** | `3070` | `OUTLINE_ALREADY_FINALIZED` | Đề cương đã được phê duyệt (`APPROVED`) hoặc đã bị đánh không đạt (`REJECTED`), không thể nộp lại. |
| **409** | `3057` | `TOPIC_NOT_IN_PROGRESS` | Đề tài đã bị đình chỉ (`DISQUALIFIED`) hoặc bị hủy (`CANCELLED`). |
| **403** | `2001` | `FORBIDDEN` | Sinh viên không thuộc danh sách làm đồ án kỳ này, hoặc tài khoản bị khóa. |
| **401** | `2000` | `UNAUTHORIZED` | Phiên đăng nhập hết hạn. |

---

## 5. Hướng dẫn Tích hợp Code Phía Frontend (TypeScript / React)

### 5.1. Bổ sung vào `src/shared/api/endpoints.ts`

```typescript
export const API_ENDPOINTS = {
  // ... các endpoint hiện tại ...
  outline: {
    myOutline: '/outline/my-outline',
    submit: '/outline/submit',
  },
} as const;
```

### 5.2. Types & Service gợi ý

```typescript
import type { OutlineDeadlineStatus } from './topicTitle.types';

export type OutlineStatus = 'PENDING' | 'APPROVED' | 'REQUEST_CHANGES' | 'REJECTED';

export interface ThesisOutlineHistoryResponse {
  publicId: string;
  outlineHistoryFile: string;
  submissionNote: string | null;
  status: OutlineStatus;
  statusDescription: string;
  submittedAt: string;
  reviewerPublicId: string | null;
  reviewerName: string | null;
  reviewFeedback: string | null;
  reviewedAt: string | null;
}

export interface ThesisOutlineResponse {
  publicId: string | null;
  topicPublicId: string | null;
  topicName: string | null;
  currentStage: string | null;
  topicStatus: string | null;
  disqualificationReason: string | null;
  studentPublicId: string | null;
  studentCode: string | null;
  studentName: string | null;
  lecturerPublicId: string | null;
  lecturerName: string | null;
  coLecturerPublicId: string | null;
  coLecturerName: string | null;
  reviewerPublicId: string | null;
  reviewerName: string | null;
  title: string | null;
  outlineFile: string | null;
  status: OutlineStatus | null;
  statusDescription: string | null;
  reviewFeedback: string | null;
  advisorFeedback: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  canReview: boolean;
  canWriteAdvisorFeedback: boolean;
  deadlineName: string | null;
  deadlineStartDate: string | null;
  deadlineEndDate: string | null;
  deadlineActive: boolean | null;
  deadlineStatus: OutlineDeadlineStatus;
  histories: ThesisOutlineHistoryResponse[];
}
```

```typescript
// Gọi API với FormData khi nộp đề cương
export const submitMyOutline = async (params: {
  file: File;
  submissionNote?: string;
  title?: string;
}) => {
  const formData = new FormData();
  formData.append('file', params.file);
  if (params.submissionNote?.trim()) {
    formData.append('submissionNote', params.submissionNote.trim());
  }
  if (params.title?.trim()) {
    formData.append('title', params.title.trim());
  }

  const response = await apiClient.post<APIResponse<void>>(
    API_ENDPOINTS.outline.submit,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};
```

---

## 6. Điều kiện Khóa/Mở nút "Tải tệp lên" & "Soạn trực tuyến" trên UI

```typescript
const canSubmitOutline =
  outlineData?.topicStatus === 'IN_PROGRESS' &&
  outlineData?.currentStage === 'STAGE_2_TOPIC_CONFIRMED' &&
  Boolean(outlineData?.reviewerPublicId) &&
  outlineData?.deadlineStatus === 'OPEN' &&
  outlineData?.status !== 'APPROVED' &&
  outlineData?.status !== 'REJECTED';
```

- Nếu `outlineData?.deadlineStatus !== 'OPEN'`: Hiển thị lý do rõ ràng ngay dưới mục **"Thời hạn nộp"** (Chưa cấu hình / Chưa mở / Đang gia hạn chấm chỉ dành cho giảng viên / Đã hết hạn) và disable nút nộp bài.
- Nếu `!outlineData?.reviewerPublicId` (khi đã ở `STAGE_2_TOPIC_CONFIRMED`): Hiển thị thông báo *"Đang chờ Trưởng bộ môn phân công giảng viên nhận xét đề cương"* và disable nút nộp bài.

