# Hướng dẫn Tích hợp API: Danh sách Sinh viên Hướng dẫn & Nộp Phiếu Theo dõi Tiến độ (Dành cho Giảng viên Hướng dẫn)

Tài liệu hướng dẫn kết nối Frontend với Backend (`tlu_gpms_system`) cho **Giảng viên Hướng dẫn (GVHD)** ở **Giai đoạn 4** với các chức năng:
1. **Xem hạn nộp Phiếu theo dõi tiến độ theo học kỳ** (chưa có hạn $\rightarrow$ hiển thị `"Chưa có"`; đã hết hạn $\rightarrow$ hiển thị ngày hết hạn kèm chữ `"Đã hết hạn"`).
2. **Xem danh sách sinh viên hướng dẫn** (gồm cả sinh viên do mình hướng dẫn chính lẫn đồng hướng dẫn, kể cả sinh viên chưa nộp Báo cáo Final) và **xem chi tiết báo cáo** (`GET /report/supervisor-list`, `GET /report/{publicId}`).
3. **Nộp / cập nhật Phiếu theo dõi tiến độ** (`POST /report/progress-report`) — **chỉ GVHD chính** mới có quyền nộp; GVHD đồng hướng dẫn chỉ được xem.

> **Tài liệu liên quan**:
> - Luồng sinh viên nộp & xem Báo cáo Final: [API_Student_FinalReport.md](./API_Student_FinalReport.md)

---

## 1. Tổng quan Nghiệp vụ & Quy tắc Phân quyền

```
       [ Đề tài đang ở giai đoạn làm báo cáo (STAGE_3_OUTLINE_APPROVED) & status = IN_PROGRESS ]
                                             │
                                             ▼
            GVHD gọi: GET /report/supervisor-list?semesterId={uuid}&status={status?}
         (Lấy danh sách SV do GV hướng dẫn chính hoặc đồng hướng dẫn + deadline + phiếu tiến độ)
                                             │
          ┌──────────────────────────────────┴──────────────────────────────────┐
          ▼                                                                     ▼
  [Là GVHD đồng hướng dẫn]                                              [Là GVHD chính]
  canSubmitProgressReport = false                            canSubmitProgressReport = true
  -> Chỉ được xem danh sách &                                -> Khi stage == STAGE_3_OUTLINE_APPROVED,
     chi tiết (GET /report/{publicId})                          topicStatus == IN_PROGRESS và
     (Gọi nộp phiếu -> 403 FORBIDDEN)                           deadlineStatus ∈ {"OPEN", "EXTENDED"}:
                                                                GVHD chính gọi POST /report/progress-report
                                                                (topicPublicId + file + supervisorNote?)
                                                                        │
                                                                        ▼
                                                     Tạo mới hoặc cập nhật ThesisProgressReport
                                                     (Điều kiện tiên quyết để GVHD thẩm định
                                                      Báo cáo Final của sinh viên sau đó)
```

### Lưu ý nghiệp vụ quan trọng
- **Phân biệt GVHD chính và GVHD đồng hướng dẫn**:
  - Danh sách `GET /report/supervisor-list` trả về đề tài của **cả GVHD chính (`lecturer`) lẫn đồng hướng dẫn (`coLecturer`)**.
  - **Chỉ GVHD chính (`topic.lecturer`)** mới được phép gọi `POST /report/progress-report`.
  - Nếu là **GVHD đồng hướng dẫn** (hoặc giảng viên không phụ trách đề tài), Backend chặn với lỗi `2001 - FORBIDDEN` (HTTP `403`). Trong danh sách trả về, cờ `canSubmitProgressReport` sẽ mang giá trị `false` để Frontend ẩn/khóa thao tác nộp phiếu.
- **Khác biệt quan trọng về Deadline của Phiếu theo dõi tiến độ (`EXTENDED` vẫn nộp được)**:
  - Mốc dùng chung cho GĐ 4 là `NOP_BAO_CAO_VA_PHIEU_THEO_DOI`.
  - Khác với sinh viên (bị khóa khi mốc chuyển sang `EXTENDED`), **GVHD chính được phép nộp và cập nhật Phiếu theo dõi tiến độ cả trong thời gian nộp (`OPEN`) lẫn thời gian gia hạn chấm (`EXTENDED`)**, miễn là `startDate <= now <= endDate` và trạng thái mốc khác `COMPLETED`.
  - Trước `startDate`, quá `endDate`, hoặc `status === COMPLETED` $\rightarrow$ `3096 - PROGRESS_REPORT_DEADLINE_CLOSED`.
  - Học kỳ chưa cấu hình mốc $\rightarrow$ `3094 - REPORT_DEADLINE_NOT_FOUND`.
- **Điều kiện đề tài để nộp / cập nhật Phiếu theo dõi tiến độ**:
  - `topicStatus === 'IN_PROGRESS'` (nếu đã bị `DISQUALIFIED` / hủy báo `3057 - TOPIC_NOT_IN_PROGRESS`).
  - `currentStage === 'STAGE_3_OUTLINE_APPROVED'` (nếu chưa duyệt đề cương hoặc đã duyệt Báo cáo Final lên `STAGE_4_REPORT_APPROVED` báo `3090 - REPORT_STAGE_INVALID`).
  - Mỗi đề tài có duy nhất 1 `ThesisProgressReport`. Gửi lại `POST /report/progress-report` khi còn hợp lệ sẽ **cập nhật đè** file mới và `supervisorNote` mới lên bản ghi hiện có.
- **Quy định Validate File tải lên**:
  - File không được rỗng và có tên file gốc hợp lệ (`4000 - REPORT_FILE_EMPTY`).
  - Chỉ nhận định dạng **`.doc`**, **`.docx`**, **`.pdf`** (`4000 - REPORT_FILE_INVALID_FORMAT`).
  - Dung lượng **nhỏ hơn 10 MB** (`file.size < 10 * 1024 * 1024` bytes; từ `10 MB` trở lên trả `4000 - REPORT_FILE_TOO_LARGE`).
- **Thông báo real-time (SSE)**:
  - Khi GVHD chính nộp hoặc cập nhật Phiếu theo dõi tiến độ thành công, Backend tự động gửi thông báo SSE cho sinh viên: *"GVHD đã nộp phiếu theo dõi tiến độ."*

---

## 2. Danh sách API Endpoints

Tất cả API trả về cấu trúc wrapper chuẩn `APIResponse<T>` (`{ code: 1000, message?: string, data: T }`) với HTTP `200 OK` khi thành công.

| Chức năng | Phương thức | Endpoint | Quyền (`@PreAuthorize`) | Content-Type |
|---|:---:|---|---|---|
| **1. Danh sách SV hướng dẫn & deadline GĐ 4 theo học kỳ** | `GET` | `/report/supervisor-list?semesterId={uuid}&status={status}` | `VIEW_REPORT` hoặc `SUPERVISOR` | `application/json` |
| **2. Xem chi tiết Báo cáo Final & Phiếu tiến độ** | `GET` | `/report/{publicId}` | `STUDENT`, `SUPERVISOR`, `VIEW_TOPIC`, `SUBMIT_REPORT` hoặc `VIEW_REPORT` | `application/json` |
| **3. GVHD chính nộp / cập nhật Phiếu theo dõi tiến độ** | `POST` | `/report/progress-report` | `SUBMIT_PROGRESS_FORM` hoặc `SUPERVISOR` | `multipart/form-data` |
| **4. (Fallback lấy deadline khi danh sách SV rỗng)** | `GET` | `/api/v1/deadlines?semesterId={uuid}` | `VIEW_SCHEDULE`, `SUPERVISOR`, `ADMIN`, `HEAD_OF_MAJOR`, `STUDENT` | `application/json` |

> **Ghi chú xác thực**: Yêu cầu gửi kèm cookie `access_token` (`withCredentials: true`) hoặc header `Authorization: Bearer <token>`.

---

## 3. Chi tiết từng API

### 3.1. Danh sách sinh viên hướng dẫn theo học kỳ

- **Endpoint**: `GET /report/supervisor-list`
- **Query Params**:
  - `semesterId` (`UUID`, *không bắt buộc*): `publicId` của học kỳ cần xem. Bỏ trống sẽ lấy học kỳ hiện tại (`ONGOING`).
  - `status` (`FinalReportStatus`, *không bắt buộc*): Lọc theo trạng thái Báo cáo Final (`PENDING` | `REQUEST_CHANGES` | `APPROVED` | `REJECTED`).
    - Khi **không truyền `status`**: trả về toàn bộ sinh viên do giảng viên hướng dẫn đang ở giai đoạn GĐ 4 trở lên (`currentStage >= STAGE_3_OUTLINE_APPROVED`), **bao gồm cả sinh viên chưa nộp Báo cáo Final** (`publicId: null`, `status: null`) để GVHD vẫn nộp được Phiếu theo dõi tiến độ cho sinh viên đó.
    - Khi **có truyền `status`**: chỉ trả về các sinh viên đã nộp báo cáo và có trạng thái khớp `status`.
- **Response Success (HTTP 200)**:

```json
{
  "code": 1000,
  "message": null,
  "data": [
    {
      "publicId": "018db26a-932f-789a-bc01-999999999999",
      "topicPublicId": "018db26a-932f-789a-bc01-e23456789abc",
      "topicName": "Xây dựng hệ thống Quản lý Đồ án TLU",
      "currentStage": "STAGE_3_OUTLINE_APPROVED",
      "topicStatus": "IN_PROGRESS",
      "disqualificationReason": null,
      "studentPublicId": "018db26a-932f-789a-bc01-222222222222",
      "studentCode": "2051060001",
      "studentName": "Nguyễn Văn An",
      "lecturerPublicId": "018db26a-932f-789a-bc01-333333333333",
      "lecturerName": "Trần Văn Bình",
      "coLecturerPublicId": "018db26a-932f-789a-bc01-444444444444",
      "coLecturerName": "Lê Thị Chi",
      "finalReportFile": "https://res.cloudinary.com/.../bao_cao_final.pdf",
      "plagiarismRate": null,
      "plagiarismFile": null,
      "supervisorFeedback": null,
      "status": "PENDING",
      "statusDescription": "Đã nộp, chờ nhận xét",
      "submittedAt": "2026-11-12T15:30:00",
      "reviewedAt": null,
      "progressReport": {
        "publicId": "018db26a-932f-789a-bc01-777777777777",
        "topicPublicId": "018db26a-932f-789a-bc01-e23456789abc",
        "supervisorPublicId": "018db26a-932f-789a-bc01-333333333333",
        "supervisorName": "Trần Văn Bình",
        "progressFile": "https://res.cloudinary.com/.../phieu_tien_do.pdf",
        "supervisorNote": "Hoàn thành đúng tiến độ các tuần.",
        "submittedAt": "2026-11-11T09:00:00"
      },
      "canSubmitProgressReport": true,
      "canReview": true,
      "deadlineName": "Hạn nộp báo cáo ĐATN & Phiếu theo dõi tiến độ",
      "deadlineStartDate": "2026-11-01T00:00:00",
      "deadlineEndDate": "2026-11-25T23:59:59",
      "deadlineActive": true,
      "deadlineStatus": "OPEN",
      "histories": null
    },
    {
      "publicId": null,
      "topicPublicId": "018db26a-932f-789a-bc01-e23456789abd",
      "topicName": "Ứng dụng AI hỗ trợ phân loại văn bản",
      "currentStage": "STAGE_3_OUTLINE_APPROVED",
      "topicStatus": "IN_PROGRESS",
      "disqualificationReason": null,
      "studentPublicId": "018db26a-932f-789a-bc01-222222222223",
      "studentCode": "2051060002",
      "studentName": "Phạm Thị Dung",
      "lecturerPublicId": "018db26a-932f-789a-bc01-888888888888",
      "lecturerName": "Hoàng Văn Em",
      "coLecturerPublicId": "018db26a-932f-789a-bc01-333333333333",
      "coLecturerName": "Trần Văn Bình",
      "finalReportFile": null,
      "plagiarismRate": null,
      "plagiarismFile": null,
      "supervisorFeedback": null,
      "status": null,
      "statusDescription": null,
      "submittedAt": null,
      "reviewedAt": null,
      "progressReport": null,
      "canSubmitProgressReport": false,
      "canReview": false,
      "deadlineName": "Hạn nộp báo cáo ĐATN & Phiếu theo dõi tiến độ",
      "deadlineStartDate": "2026-11-01T00:00:00",
      "deadlineEndDate": "2026-11-25T23:59:59",
      "deadlineActive": true,
      "deadlineStatus": "OPEN",
      "histories": []
    }
  ]
}
```

> **Lưu ý phân biệt `publicId` và `topicPublicId`**:
> - `item.topicPublicId`: là ID công khai của **đề tài** (luôn khác `null`) $\rightarrow$ dùng để truyền vào `POST /report/progress-report`.
> - `item.publicId`: là ID công khai của **Báo cáo Final** (`null` nếu sinh viên chưa nộp báo cáo lần nào) $\rightarrow$ chỉ dùng để gọi `GET /report/{publicId}` khi `item.publicId !== null`.

---

### 3.2. Xem chi tiết một Báo cáo Final kèm lịch sử nộp và Phiếu theo dõi tiến độ

- **Endpoint**: `GET /report/{publicId}`
- **Path Variable**:
  - `publicId` (`UUID`, **bắt buộc**): `item.publicId` của Báo cáo Final (chỉ gọi khi sinh viên đã nộp báo cáo ít nhất 1 lần).
- **Response Success (HTTP 200)**: Trả về 1 đối tượng `ThesisFinalReportResponse` (giống phần tử ở `3.1` nhưng kèm đầy đủ mảng `histories` sắp theo `submittedAt DESC`). Nếu người gọi là đồng hướng dẫn thì `canSubmitProgressReport: false`, `canReview: false`.

---

### 3.3. GVHD chính nộp hoặc cập nhật Phiếu theo dõi tiến độ

- **Endpoint**: `POST /report/progress-report`
- **Content-Type**: `multipart/form-data`
- **Form Data Params**:
  - `topicPublicId` (`UUID`, **bắt buộc**): `topicPublicId` của đề tài sinh viên (lấy từ `item.topicPublicId`).
  - `file` (`File`, **bắt buộc**): File phiếu theo dõi tiến độ. Chỉ nhận **`.doc`**, **`.docx`**, **`.pdf`**, dung lượng **nhỏ hơn 10 MB** (`< 10 * 1024 * 1024` bytes).
  - `supervisorNote` (`string`, *không bắt buộc*): Nhận xét đánh giá tổng kết tiến độ của GVHD (chuỗi chỉ có khoảng trắng sẽ được lưu `null`).
- **Response Success (HTTP 200)**:

```json
{
  "code": 1000,
  "message": "Nộp phiếu theo dõi tiến độ thành công",
  "data": null
}
```

---

## 4. Quy tắc Hiển thị Hạn nộp Phiếu theo dõi tiến độ theo Học kỳ

Mỗi phần tử trong `GET /report/supervisor-list?semesterId={uuid}` đều chứa sẵn 5 trường deadline (`deadlineName`, `deadlineStartDate`, `deadlineEndDate`, `deadlineActive`, `deadlineStatus`).
- Nếu danh sách `supervisor-list` có ít nhất 1 phần tử: lấy trực tiếp 5 trường deadline từ `list[0]`.
- Nếu danh sách `supervisor-list` rỗng (`[]`) nhưng muốn hiển thị banner hạn nộp của học kỳ: gọi fallback `GET /api/v1/deadlines?semesterId={uuid}` và tìm mốc có `templateCode === "NOP_BAO_CAO_VA_PHIEU_THEO_DOI"` trong `stage2` (mốc chung GĐ 2 thực hiện đồ án).

### Bảng quy tắc hiển thị theo `deadlineStatus` (cho GVHD nộp Phiếu theo dõi)

| Giá trị `deadlineStatus` | Ý nghĩa từ Backend | Cách hiển thị trên UI theo yêu cầu | Cho phép GVHD chính nộp/cập nhật phiếu? |
|---|---|---|:---:|
| `"NOT_CONFIGURED"` hoặc `"INACTIVE"` (hoặc `deadlineEndDate === null`) | Học kỳ chưa cấu hình hạn nộp | Hiển thị: **`Chưa có`** | Không |
| `"NOT_STARTED"` | Đã cấu hình nhưng chưa tới `deadlineStartDate` | Hiển thị ngày bắt đầu – kết thúc kèm nhãn **`Chưa mở`** | Không |
| `"OPEN"` | Đang trong thời gian mở (`startDate <= now <= endDate`) | Hiển thị hạn chót `formatDateTime(deadlineEndDate)` kèm nhãn **`Đang mở`** | **Có** |
| `"EXTENDED"` | TBM gia hạn thời gian chấm (`startDate <= now <= endDate`) | Hiển thị hạn chót `formatDateTime(deadlineEndDate)` kèm nhãn **`Gia hạn chấm`** | **Có** *(GVHD vẫn nộp/cập nhật được phiếu)* |
| `"CLOSED"` | Đã quá `deadlineEndDate` hoặc mốc đã `COMPLETED` | Hiển thị ngày hết hạn `formatDateTime(deadlineEndDate)` kèm chữ **`Đã hết hạn`** | Không |

### Hàm Helper gợi ý hiển thị Hạn nộp Phiếu theo dõi cho GVHD

```typescript
export type ReportDeadlineStatus =
  | 'NOT_CONFIGURED'
  | 'INACTIVE'
  | 'NOT_STARTED'
  | 'OPEN'
  | 'EXTENDED'
  | 'CLOSED';

export interface ProgressDeadlineDisplayInfo {
  text: string;
  badgeText: string | null;
  canSubmitWindow: boolean;
  isExpired: boolean;
  isUnconfigured: boolean;
}

export const formatProgressDeadlineForSupervisor = (
  deadlineEndDate: string | null | undefined,
  deadlineStatus: ReportDeadlineStatus | null | undefined,
  formatDateTime: (iso: string) => string
): ProgressDeadlineDisplayInfo => {
  // 1. Chưa có hạn nộp trong học kỳ
  if (
    !deadlineStatus ||
    deadlineStatus === 'NOT_CONFIGURED' ||
    deadlineStatus === 'INACTIVE' ||
    !deadlineEndDate
  ) {
    return {
      text: 'Chưa có',
      badgeText: null,
      canSubmitWindow: false,
      isExpired: false,
      isUnconfigured: true,
    };
  }

  const formattedEndDate = formatDateTime(deadlineEndDate);

  // 2. Đã hết hạn
  if (deadlineStatus === 'CLOSED') {
    return {
      text: `${formattedEndDate} (Đã hết hạn)`,
      badgeText: 'Đã hết hạn',
      canSubmitWindow: false,
      isExpired: true,
      isUnconfigured: false,
    };
  }

  // 3. Chưa đến thời gian mở
  if (deadlineStatus === 'NOT_STARTED') {
    return {
      text: formattedEndDate,
      badgeText: 'Chưa mở',
      canSubmitWindow: false,
      isExpired: false,
      isUnconfigured: false,
    };
  }

  // 4. Đang mở (OPEN) hoặc đang gia hạn chấm (EXTENDED) -> GVHD chính vẫn nộp được phiếu
  return {
    text: formattedEndDate,
    badgeText: deadlineStatus === 'EXTENDED' ? 'Gia hạn chấm' : 'Đang mở',
    canSubmitWindow: true,
    isExpired: false,
    isUnconfigured: false,
  };
};
```

---

## 5. Bảng mã lỗi Backend (ErrorCode)

| HTTP Status | Mã ErrorCode | Tên mã lỗi | Thông báo Tiếng Việt / Ý nghĩa |
|:---:|:---:|---|---|
| **400** | `4000` | `REPORT_FILE_EMPTY` | File tải lên không được để trống |
| **400** | `4000` | `REPORT_FILE_INVALID_FORMAT` | File tải lên chỉ nhận định dạng .doc, .docx hoặc .pdf |
| **400** | `4000` | `REPORT_FILE_TOO_LARGE` | File tải lên phải nhỏ hơn 10MB |
| **400** | `4000` | `CLOUDINARY_SERVICE_FAIL` | Upload file thất bại |
| **404** | `3049` | `THESIS_TOPIC_NOT_FOUND` | Không tìm thấy đề tài đồ án |
| **404** | `3089` | `THESIS_FINAL_REPORT_NOT_FOUND` | Không tìm thấy báo cáo Final của đề tài |
| **404** | `3094` | `REPORT_DEADLINE_NOT_FOUND` | Chưa cấu hình thời hạn nộp báo cáo cho học kỳ này |
| **403** | `3096` | `PROGRESS_REPORT_DEADLINE_CLOSED` | Thời hạn nộp phiếu theo dõi tiến độ chưa mở hoặc đã kết thúc |
| **409** | `3090` | `REPORT_STAGE_INVALID` | Đề tài chưa được duyệt đề cương hoặc không ở giai đoạn làm báo cáo (`currentStage != STAGE_3_OUTLINE_APPROVED`) |
| **409** | `3057` | `TOPIC_NOT_IN_PROGRESS` | Đề tài không ở trạng thái đang thực hiện (`DISQUALIFIED` / `CANCELLED`) |
| **403** | `2001` | `FORBIDDEN` | Giảng viên đồng hướng dẫn không có quyền nộp phiếu theo dõi tiến độ / Không phải GVHD chính của đề tài / Học kỳ đã kết thúc |
| **401** | `2000` | `UNAUTHORIZED` | Phiên đăng nhập hết hạn |

---

## 6. Hướng dẫn Tích hợp Code Phía Frontend (TypeScript / React)

### 6.1. Bổ sung vào `src/shared/api/endpoints.ts`

```typescript
export const API_ENDPOINTS = {
  // ... các endpoint hiện tại ...
  report: {
    supervisorList: '/report/supervisor-list',
    detail: (publicId: string) => `/report/${publicId}`,
    submitProgressReport: '/report/progress-report',
  },
} as const;
```

### 6.2. Service gọi API (`supervisorReport.service.ts`)

```typescript
import type { FinalReportStatus, ThesisFinalReportResponse } from './finalReport.types';

export const PROGRESS_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // Nhỏ hơn 10 MB
export const PROGRESS_ALLOWED_EXTENSIONS = ['doc', 'docx', 'pdf'] as const;

export const validateProgressFile = (file: File | null | undefined): string | null => {
  if (!file || file.size === 0 || !file.name.trim()) {
    return 'File tải lên không được để trống.';
  }
  const dotIndex = file.name.lastIndexOf('.');
  const extension = dotIndex > 0 ? file.name.slice(dotIndex + 1).toLowerCase() : '';
  if (!PROGRESS_ALLOWED_EXTENSIONS.includes(extension as (typeof PROGRESS_ALLOWED_EXTENSIONS)[number])) {
    return 'File tải lên chỉ nhận định dạng .doc, .docx hoặc .pdf.';
  }
  if (file.size >= PROGRESS_MAX_FILE_SIZE_BYTES) {
    return 'File tải lên phải nhỏ hơn 10MB.';
  }
  return null;
};

// 1. Lấy danh sách sinh viên hướng dẫn theo học kỳ (kèm trạng thái nộp báo cáo, phiếu tiến độ & deadline)
export const getSupervisorReportList = async (params?: {
  semesterId?: string;
  status?: FinalReportStatus;
}) => {
  const response = await apiClient.get<APIResponse<ThesisFinalReportResponse[]>>(
    API_ENDPOINTS.report.supervisorList,
    { params }
  );
  return response.data.data;
};

// 2. Xem chi tiết Báo cáo Final + lịch sử nộp + Phiếu theo dõi tiến độ
export const getSupervisorReportDetail = async (reportPublicId: string) => {
  const response = await apiClient.get<APIResponse<ThesisFinalReportResponse>>(
    API_ENDPOINTS.report.detail(reportPublicId)
  );
  return response.data.data;
};

// 3. GVHD chính nộp hoặc cập nhật Phiếu theo dõi tiến độ cho sinh viên
export const submitStudentProgressReport = async (params: {
  topicPublicId: string;
  file: File;
  supervisorNote?: string;
}) => {
  const formData = new FormData();
  formData.append('topicPublicId', params.topicPublicId);
  formData.append('file', params.file);
  if (params.supervisorNote?.trim()) {
    formData.append('supervisorNote', params.supervisorNote.trim());
  }

  const response = await apiClient.post<APIResponse<void>>(
    API_ENDPOINTS.report.submitProgressReport,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};
```

---

## 7. Điều kiện Hiển thị Nút "Nộp / Cập nhật Phiếu theo dõi" trên UI

```typescript
const canLecturerSubmitProgressReport = (item: ThesisFinalReportResponse): boolean => {
  const isDeadlineOpenForSupervisor =
    item.deadlineStatus === 'OPEN' || item.deadlineStatus === 'EXTENDED';

  return (
    item.canSubmitProgressReport === true && // Chỉ true nếu giảng viên hiện tại là GVHD chính (topic.lecturer)
    item.topicStatus === 'IN_PROGRESS' &&
    item.currentStage === 'STAGE_3_OUTLINE_APPROVED' &&
    isDeadlineOpenForSupervisor
  );
};
```

- Nếu `item.canSubmitProgressReport === false`: Giảng viên đang xem với vai trò **GVHD đồng hướng dẫn (`coLecturer`)** $\rightarrow$ Ẩn hoặc disable nút nộp phiếu và hiển thị nhãn *"Đồng hướng dẫn (Chỉ xem)"*.
- Nếu `item.progressReport !== null`: Nút hiển thị nhãn **"Cập nhật phiếu theo dõi"** (cho phép thay file và ghi chú mới khi còn ở `STAGE_3_OUTLINE_APPROVED` và chưa hết hạn).
- Nếu `item.publicId !== null`: Cho phép click mở màn hình/drawer chi tiết gọi `GET /report/{item.publicId}` để xem lịch sử các lần nộp Báo cáo Final của sinh viên. Nếu `item.publicId === null`: hiển thị trạng thái *"Sinh viên chưa nộp báo cáo Final"*, vẫn cho phép GVHD chính nộp Phiếu theo dõi tiến độ trước bằng `item.topicPublicId`.

