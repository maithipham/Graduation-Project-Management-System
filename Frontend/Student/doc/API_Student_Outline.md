# Hướng dẫn Tích hợp API: Nộp & Theo dõi Đề cương Đồ án (Dành cho Sinh viên)

Tài liệu hướng dẫn kết nối Frontend (`Frontend/Student`) với Backend (`tlu_gpms_system`) cho chức năng **Nộp, Nộp lại và Theo dõi Kết quả Thẩm định Đề cương** thuộc **Giai đoạn 3** (tiếp nối sau khi chốt tên đề tài chính thức):
1. **Xem đề cương hiện tại, lịch sử nộp và thời hạn nộp đề cương** (`GET /outline/my-outline`).
2. **Nộp mới hoặc nộp lại file đề cương** (`POST /outline/submit`).

> **Tài liệu liên quan**: Chốt tên đề tài lần đầu & xin đổi tên đề tài xem tại [API_Create_Update_topicName.md](./API_Create_Update_topicName.md).

---

## 1. Tổng quan Nghiệp vụ & Luồng xử lý (Workflow)

```
       [ Đề tài đã chốt tên chính thức (>= STAGE_2_TOPIC_CONFIRMED) & status = IN_PROGRESS ]
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
            -> Backend validate file (.doc/.docx/.pdf, < 10 MB) -> Upload Cloudinary
            -> Tạo ThesisOutline (lần đầu) + lưu bản ghi mới vào ThesisOutlineHistory
                                             │
                                             ▼
                            Trạng thái đề cương: PENDING
                         (Chờ Giảng viên nhận xét thẩm định)
                                             │
               ┌─────────────────────────────┼─────────────────────────────┐
               ▼                             ▼                             ▼
          [APPROVED]                 [REQUEST_CHANGES]                 [REJECTED]
    Hoàn thành đề cương          Yêu cầu chỉnh sửa & nộp lại       Không đạt (khi EXTENDED
 -> STAGE_3_OUTLINE_APPROVED      (SV sửa & gọi lại /submit        hoặc Job hết hạn quét)
                                   khi deadlineStatus === "OPEN")  -> Đề tài: DISQUALIFIED
```

### Lưu ý nghiệp vụ quan trọng
- **Điều kiện tiên quyết để nộp đề cương**:
  1. Đề tài ở trạng thái `IN_PROGRESS` (`3057 - TOPIC_NOT_IN_PROGRESS` nếu đã bị đình chỉ/hủy) và đã hoàn thành chốt tên chính thức (`currentStage >= STAGE_2_TOPIC_CONFIRMED`, nếu chưa đạt báo `3080 - OUTLINE_STAGE_INVALID`).
  2. Đã được TBM phân công Giảng viên nhận xét đề cương:
     - Bản ghi `ThesisOutline` **chỉ được tạo ở lần nộp đầu tiên (`POST /outline/submit`)**, không tạo sẵn khi TBM phân công GV nhận xét.
     - Nếu chưa có `ThesisOutline` (hoặc `outline.reviewer == null`), Backend lấy từ `topic.commentingLecturer`. Nếu vẫn chưa có GV nhận xét thì `POST /outline/submit` trả lỗi `3079` (`OUTLINE_REVIEWER_NOT_ASSIGNED`).
  3. Mốc thời hạn `SV_CHINH_SUA_NOP_LAI_DE_CUONG` phải đang ở trạng thái **`OPEN`** (`startDate <= now <= endDate` và trạng thái mốc khác `EXTENDED` / `COMPLETED`).
     - Khi `deadlineStatus === "EXTENDED"` (TBM gia hạn chấm riêng cho giảng viên), sinh viên **không thể nộp/nộp lại đề cương** (`3085 - OUTLINE_SUBMISSION_DEADLINE_CLOSED`).
     - Ở lần nộp đầu tiên, Backend gán mốc `SV_CHINH_SUA_NOP_LAI_DE_CUONG` vào `ThesisOutline.deadline`. Khi nộp lại, Backend ưu tiên dùng `outline.deadline` (nếu chưa có mới lấy mốc của học kỳ).
  4. Trạng thái đề cương hiện tại không phải `APPROVED` hoặc `REJECTED` (`3081 - OUTLINE_ALREADY_FINALIZED`). Nếu đang `PENDING` (nộp đè trước khi GV chấm) hoặc `REQUEST_CHANGES` (nộp bản sửa) và còn hạn mở (`OPEN`), sinh viên được nộp lại nhiều lần (mỗi lần tạo thêm 1 bản ghi lịch sử `PENDING`).
- **Quy định Validate File tải lên** (áp dụng bắt buộc tại Backend trước khi upload lên Cloudinary):
  - File không được rỗng và phải có tên file gốc hợp lệ (`4000 - OUTLINE_FILE_EMPTY`).
  - Chỉ nhận định dạng **`.doc`**, **`.docx`**, **`.pdf`** (không phân biệt hoa/thường; sai định dạng trả `4000 - OUTLINE_FILE_INVALID_FORMAT`).
  - Dung lượng **nhỏ hơn 10 MB** (`file.size < 10 * 1024 * 1024` bytes; từ `10 MB` trở lên trả `4000 - OUTLINE_FILE_TOO_LARGE`).
- **`GET /outline/my-outline` luôn trả thông tin Deadline**:
  - Kể cả khi sinh viên **chưa nộp lần nào** (`publicId: null`, chưa có bản ghi `ThesisOutline`) hoặc **chưa có đề tài trong kỳ** (`topicPublicId: null`), API vẫn trả về đối tượng `ThesisOutlineResponse` chứa thông tin đề tài (nếu có) và 5 trường deadline thực tế của mốc `SV_CHINH_SUA_NOP_LAI_DE_CUONG` (`deadlineName`, `deadlineStartDate`, `deadlineEndDate`, `deadlineActive`, `deadlineStatus`).
  - **Lưu ý khi `publicId === null`**: Do `ThesisOutline` chỉ được tạo ở lần nộp đầu tiên, hàm map khi chưa có `ThesisOutline` chỉ map thông tin từ đề tài và deadline — `reviewerPublicId` và `reviewerName` trả về `null` kể cả khi TBM đã phân công `commentingLecturer` ở Backend. Sau khi nộp lần đầu (`publicId != null`), `reviewerPublicId` và `reviewerName` sẽ có dữ liệu.
- **Góp ý của GVHD chính (`advisorFeedback`)**:
  - GVHD chính (không áp dụng cho đồng GVHD) có thể ghi nhận xét góp ý trong thời gian từ `startDate` đến `endDate` (kể cả `EXTENDED`, chỉ chặn khi quá `endDate` hoặc `COMPLETED`), chỉ mang tính góp ý và **không làm thay đổi** `status` của đề cương hay `currentStage` của đề tài.
  - `advisorFeedback` chỉ lưu bản mới nhất trên `ThesisOutline` (ghi đè lần trước, không lưu vào `histories`).
- **Thông báo real-time (SSE) & Job quét hết hạn**:
  - Mọi thông báo giai đoạn này đều đẩy qua **SSE trên hệ thống (`NotificationService`)**, **không gửi email**:
    - SV nộp bài -> thông báo cho GV nhận xét.
    - GV nhận xét cho kết quả (`APPROVED` / `REQUEST_CHANGES` / `REJECTED`) -> thông báo cho SV gồm **kết quả và nội dung nhận xét**.
    - GVHD chính góp ý -> thông báo cho SV (*"GVHD đã nhận xét đề cương của bạn."*).
  - Job tự động chạy định kỳ **5 phút/lần** khi mốc `SV_CHINH_SUA_NOP_LAI_DE_CUONG` đã đóng với sinh viên (`> endDate`, `EXTENDED`, hoặc `COMPLETED`):
    - **Bỏ qua hoàn toàn** đề cương đang `PENDING` (SV đã nộp đúng hạn chờ GV chấm không bị loại).
    - Đề tài chưa nộp (`outline == null` hoặc `status == null`) hoặc còn ở `REQUEST_CHANGES`: nếu đang `REQUEST_CHANGES` thì chuyển `status = REJECTED`, chuyển `topicStatus = DISQUALIFIED` với lý do `"Không hoàn thành phê duyệt đề cương đúng hạn"` và gửi thông báo SSE cho sinh viên.

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

#### Trường hợp chưa có bản ghi `ThesisOutline` (sinh viên chưa nộp đề cương lần nào):
- `publicId`, `reviewerPublicId`, `reviewerName`, `title`, `outlineFile`, `status`, `statusDescription`, `reviewFeedback`, `advisorFeedback`, `submittedAt`, `reviewedAt` sẽ là `null`.
- `canReview: false`, `canWriteAdvisorFeedback: false`, `histories: []`.
- Vẫn có đủ thông tin đề tài (`topicPublicId`, `topicName`, `currentStage`, `topicStatus`, `lecturerName`,...) nếu sinh viên có đề tài trong học kỳ, và **5 trường deadline** (`deadlineName`, `deadlineStartDate`, `deadlineEndDate`, `deadlineActive`, `deadlineStatus`).

---

### 3.2. Sinh viên nộp / nộp lại file đề cương

- **Endpoint**: `POST /outline/submit`
- **Content-Type**: `multipart/form-data`
- **Form Data Params**:
  - `file` (`File`, **bắt buộc**): File đề cương tải lên. Chỉ chấp nhận định dạng **`.doc`**, **`.docx`**, **`.pdf`**, tên file gốc hợp lệ, dung lượng **nhỏ hơn 10 MB** (`< 10 * 1024 * 1024` bytes).
  - `submissionNote` (`string`, *không bắt buộc*): Ghi chú của sinh viên khi nộp/nộp lại (chuỗi chỉ có khoảng trắng sẽ được lưu `null`).
  - `title` (`string`, *không bắt buộc*, tối đa `500` ký tự sau khi `trim()`): Tiêu đề đề cương (nếu bỏ trống, Backend tự lấy tiêu đề hiện tại của đề cương hoặc tên đề tài chính thức `topic.name`).
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
| **400** | `4000` | `OUTLINE_FILE_EMPTY` | File đề cương tải lên không được để trống hoặc tên file gốc rỗng. |
| **400** | `4000` | `OUTLINE_FILE_INVALID_FORMAT` | File đề cương chỉ hỗ trợ định dạng `.doc`, `.docx` hoặc `.pdf`. |
| **400** | `4000` | `OUTLINE_FILE_TOO_LARGE` | Dung lượng file đề cương phải nhỏ hơn 10 MB. |
| **400** | `4000` | `OUTLINE_TITLE_TOO_LONG` | Tiêu đề đề cương không được vượt quá 500 ký tự. |
| **400** | `4000` | `CLOUDINARY_SERVICE_FAIL` | Upload file lên Cloudinary thất bại, vui lòng thử lại. |
| **400** | `4000` | `FILE_EMPTY` / `FILE_TOO_LARGE` | Thiếu part `file` trong multipart request hoặc file vượt giới hạn upload của server. |
| **404** | `3084` | `OUTLINE_DEADLINE_NOT_FOUND` | Chưa cấu hình thời hạn nộp đề cương cho học kỳ này. |
| **403** | `3085` | `OUTLINE_SUBMISSION_DEADLINE_CLOSED` | Thời hạn sinh viên nộp đề cương chưa mở, đã kết thúc hoặc đang ở giai đoạn gia hạn chấm (`EXTENDED`). |
| **409** | `3079` | `OUTLINE_REVIEWER_NOT_ASSIGNED` | Đề tài chưa được phân công giảng viên nhận xét đề cương. |
| **409** | `3080` | `OUTLINE_STAGE_INVALID` | Đề tài chưa hoàn thành chốt tên chính thức (`STAGE_2_TOPIC_CONFIRMED`) hoặc chưa ở giai đoạn nộp đề cương. |
| **409** | `3081` | `OUTLINE_ALREADY_FINALIZED` | Đề cương đã được phê duyệt (`APPROVED`) hoặc đã có kết quả cuối cùng (`REJECTED`), không thể nộp lại. |
| **409** | `3057` | `TOPIC_NOT_IN_PROGRESS` | Đề tài không ở trạng thái đang thực hiện (đã bị đình chỉ `DISQUALIFIED` hoặc hủy). |
| **403** | `3030` | `CURRENT_SEMESTER_NOT_FOUND` | Hiện chưa có học kỳ nào đang diễn ra (`ONGOING`). |
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
export const OUTLINE_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // Nhỏ hơn 10 MB
export const OUTLINE_ALLOWED_EXTENSIONS = ['doc', 'docx', 'pdf'] as const;

// Validate phía UI trước khi gọi API nộp đề cương
export const validateOutlineFile = (file: File | null | undefined): string | null => {
  if (!file || file.size === 0 || !file.name.trim()) {
    return 'Vui lòng chọn file đề cương cần tải lên.';
  }
  const dotIndex = file.name.lastIndexOf('.');
  const extension = dotIndex > 0 ? file.name.slice(dotIndex + 1).toLowerCase() : '';
  if (!OUTLINE_ALLOWED_EXTENSIONS.includes(extension as (typeof OUTLINE_ALLOWED_EXTENSIONS)[number])) {
    return 'File đề cương chỉ hỗ trợ định dạng .doc, .docx hoặc .pdf.';
  }
  if (file.size >= OUTLINE_MAX_FILE_SIZE_BYTES) {
    return 'Dung lượng file đề cương phải nhỏ hơn 10 MB.';
  }
  return null;
};

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

## 6. Điều kiện Khóa/Mở nút "Tải tệp lên" & Kiểm tra File trên UI

```typescript
const STAGE_ORDER: Record<string, number> = {
  STAGE_1_REGISTERING_ADVISOR: 0,
  STAGE_1_ADVISOR_ASSIGNED: 1,
  STAGE_2_TOPIC_CONFIRMED: 2,
  STAGE_3_OUTLINE_APPROVED: 3,
  STAGE_4_REPORT_APPROVED: 4,
  STAGE_5_REVIEW_PASSED: 5,
  STAGE_6_DEFENSE_COMPLETED: 6,
};

const hasConfirmedTopic =
  Boolean(outlineData?.currentStage) &&
  (STAGE_ORDER[outlineData!.currentStage!] ?? -1) >= STAGE_ORDER.STAGE_2_TOPIC_CONFIRMED;

const canSubmitOutline =
  outlineData?.topicStatus === 'IN_PROGRESS' &&
  hasConfirmedTopic &&
  outlineData?.deadlineStatus === 'OPEN' &&
  outlineData?.status !== 'APPROVED' &&
  outlineData?.status !== 'REJECTED';
```

- **Không chặn nút nộp chỉ vì `outlineData?.reviewerPublicId === null` khi `outlineData?.publicId === null`**:
  - Vì ở lần nộp đầu tiên (khi chưa có bản ghi `ThesisOutline`), `GET /outline/my-outline` hiện trả `reviewerPublicId: null` dù TBM đã phân công GV nhận xét trên đề tài. Khi sinh viên bấm nộp, nếu thực sự chưa có GV nhận xét thì Backend sẽ trả lỗi `3079` (`OUTLINE_REVIEWER_NOT_ASSIGNED`) để UI hiển thị thông báo rõ ràng.
- Nếu `outlineData?.topicStatus === 'DISQUALIFIED'`: Hiển thị cảnh báo đỏ kèm `outlineData.disqualificationReason` và khóa toàn bộ thao tác nộp đề cương.
- Nếu `outlineData?.deadlineStatus !== 'OPEN'`: Hiển thị lý do rõ ràng ngay dưới mục **"Thời hạn nộp"** (`NOT_CONFIGURED`/`INACTIVE`: chưa cấu hình; `NOT_STARTED`: chưa mở; `EXTENDED`: đang trong thời gian gia hạn chấm dành cho giảng viên; `CLOSED`: đã hết hạn) và disable nút nộp bài.
- Trên input chọn file `<input type="file" accept=".doc,.docx,.pdf" />`: kiểm tra bằng `validateOutlineFile(file)` trước khi gửi request, và vẫn bắt error code từ Backend (`4000`, `3079`, `3080`, `3081`, `3084`, `3085`, `3057`) để hiển thị toast/alert chính xác.
