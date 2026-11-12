# Hướng dẫn Tích hợp API: Thẩm định Báo cáo Final & Kiểm tra Trùng lặp (Dành cho Giảng viên Hướng dẫn)

Tài liệu hướng dẫn kết nối Frontend với Backend (`tlu_gpms_system`) cho **Giảng viên Hướng dẫn (GVHD)** ở **Giai đoạn 4** với các chức năng:
1. **Xem hạn nộp / thẩm định báo cáo theo học kỳ** (chưa có hạn $\rightarrow$ hiển thị `"Chưa có"`; đã hết hạn $\rightarrow$ hiển thị ngày hết hạn kèm chữ `"Đã hết hạn"`).
2. **Xem danh sách báo cáo của sinh viên hướng dẫn theo học kỳ và trạng thái đơn báo cáo** (`GET /report/supervisor-list?semesterId={uuid}&status={status}`) và **xem chi tiết báo cáo kèm lịch sử nộp** (`GET /report/{publicId}`).
3. **Nộp file kết quả kiểm tra trùng lặp (đạo văn) kèm tỷ lệ đạo văn** và **duyệt / yêu cầu sửa / từ chối báo cáo** (`PUT /report/{publicId}/review`) — **chỉ GVHD chính** mới có quyền thực hiện, và **bắt buộc đã nộp Phiếu theo dõi tiến độ trước đó**.

> **Tài liệu liên quan**:
> - Luồng GVHD nộp Phiếu theo dõi tiến độ: [API_Supervisor_ProgressReport.md](./API_Supervisor_ProgressReport.md)
> - Luồng sinh viên nộp & xem Báo cáo Final: [API_Student_FinalReport.md](./API_Student_FinalReport.md)

---

## 1. Tổng quan Nghiệp vụ & Quy tắc Thẩm định

```
       [ GVHD gọi GET /report/supervisor-list?semesterId={uuid}&status={status?} ]
          (Xem danh sách báo cáo của SV mình hướng dẫn chính hoặc đồng hướng dẫn)
                                             │
                                             ▼
                     GVHD mở chi tiết báo cáo: GET /report/{publicId}
                            (Xem file báo cáo, histories, progressReport)
                                             │
          ┌──────────────────────────────────┴──────────────────────────────────┐
          ▼                                                                     ▼
  [Là GVHD đồng hướng dẫn]                                              [Là GVHD chính]
  canReview = false                                                     canReview = true
  -> Chỉ được xem                                        Điều kiện bắt buộc để thẩm định:
     (Gọi review -> 403 FORBIDDEN)                       1. report.status === "PENDING"
                                                         2. topicStatus === "IN_PROGRESS"
                                                         3. ĐÃ NỘP Phiếu theo dõi tiến độ
                                                            (item.progressReport !== null)
                                                         4. deadlineStatus ∈ {"OPEN", "EXTENDED"}
                                                                        │
                                                                        ▼
                                                     PUT /report/{publicId}/review
                                           (plagiarismRate + plagiarismFile + decision + feedback?)
                                                                        │
                             ┌──────────────────────────────────────────┼──────────────────────────────────────────┐
                             ▼                                          ▼                                          ▼
                   [decision = APPROVED]                [decision = REQUEST_CHANGES]                   [decision = REJECTED]
                   (Cả OPEN & EXTENDED)                    (CHỈ khi deadline OPEN)                    (CHỈ khi deadline EXTENDED)
                             │                                          │                                          │
                             ▼                                          ▼                                          ▼
              topic.currentStage =                       Giữ STAGE_3_OUTLINE_APPROVED             topic.status = DISQUALIFIED
            STAGE_4_REPORT_APPROVED                      SV sửa & nộp lại khi còn OPEN            (Dừng đồ án trong học kỳ)
            (Đủ điều kiện ra Phản biện)
```

### Lưu ý nghiệp vụ quan trọng
- **Quyền thẩm định (`canReview`)**:
  - Danh sách `GET /report/supervisor-list` trả về đề tài của **cả GVHD chính (`lecturer`) và GVHD đồng hướng dẫn (`coLecturer`)**.
  - **Chỉ GVHD chính (`topic.lecturer`)** mới có quyền nộp file kết quả kiểm tra trùng lặp và duyệt/từ chối báo cáo (`PUT /report/{publicId}/review`). Đồng hướng dẫn (`canReview = false`) chỉ có quyền xem; nếu gọi API thẩm định sẽ bị chặn `2001 - FORBIDDEN` (HTTP `403`).
- **Điều kiện tiên quyết — Phải nộp Phiếu theo dõi tiến độ trước khi thẩm định**:
  - Trước khi GVHD chính bấm Duyệt (`APPROVED`), Yêu cầu chỉnh sửa (`REQUEST_CHANGES`) hay Không đạt (`REJECTED`), đề tài **bắt buộc đã có Phiếu theo dõi tiến độ** (`item.progressReport !== null`).
  - Nếu chưa nộp phiếu tiến độ, Backend chặn mọi quyết định với lỗi `3093 - PROGRESS_REPORT_NOT_SUBMITTED` (*"GVHD chưa nộp phiếu theo dõi tiến độ cho đề tài này"*). UI nên hiển thị cảnh báo/gợi ý GVHD nộp phiếu tiến độ trước khi mở nút thẩm định.
- **Quy tắc chọn `decision` theo trạng thái Deadline (`OPEN` vs `EXTENDED`)**:
  - **Trong thời gian mở nộp (`deadlineStatus === 'OPEN'`)**: GVHD chỉ được chọn **`APPROVED`** (Đạt) hoặc **`REQUEST_CHANGES`** (Yêu cầu chỉnh sửa để SV nộp lại). Nếu gửi `REJECTED` $\rightarrow$ `3098 - FINAL_REPORT_DECISION_INVALID_IN_SUBMISSION_PERIOD`.
  - **Trong thời gian gia hạn chấm (`deadlineStatus === 'EXTENDED'`)**: SV đã hết hạn nộp lại nên GVHD chỉ được chọn **`APPROVED`** (Đạt) hoặc **`REJECTED`** (Không đạt $\rightarrow$ `topicStatus = DISQUALIFIED`). Nếu gửi `REQUEST_CHANGES` $\rightarrow$ `3099 - FINAL_REPORT_DECISION_INVALID_IN_GRADING_PERIOD`.
  - **Quá `endDate` hoặc `COMPLETED` (`deadlineStatus === 'CLOSED'`)**: Chặn thẩm định (`3097 - FINAL_REPORT_GRADING_CLOSED`), GVHD cần liên hệ Trưởng bộ môn gia hạn chấm (`EXTENDED` + lùi `endDate`).
- **Validate dữ liệu kiểm tra trùng lặp (bắt buộc)**:
  - `plagiarismRate`: Bắt buộc nhập (`4000 - PLAGIARISM_RATE_REQUIRED`), giá trị số thực trong khoảng **`0` đến `100`** (`0 <= plagiarismRate <= 100`, ngoài khoảng báo `4000 - PLAGIARISM_RATE_INVALID`).
  - `plagiarismFile`: Bắt buộc tải file minh chứng kết quả quét (Turnitin/DoIT...). Chỉ nhận **`.doc`**, **`.docx`**, **`.pdf`**, dung lượng **nhỏ hơn 10 MB** (`< 10 * 1024 * 1024` bytes).
  - `feedback`: Tùy chọn (`string`), nhưng nên khuyến khích GVHD nhập khi chọn `REQUEST_CHANGES` hoặc `REJECTED`.
- **Thông báo real-time (SSE)**:
  - Sau khi thẩm định (`APPROVED` / `REQUEST_CHANGES` / `REJECTED`), Backend gửi thông báo SSE cho sinh viên gồm **kết quả, tỷ lệ đạo văn (%) và nhận xét của GVHD**.

---

## 2. Danh sách API Endpoints

Tất cả API trả về cấu trúc wrapper chuẩn `APIResponse<T>` (`{ code: 1000, message?: string, data: T }`) với HTTP `200 OK` khi thành công.

| Chức năng | Phương thức | Endpoint | Quyền (`@PreAuthorize`) | Content-Type |
|---|:---:|---|---|---|
| **1. Danh sách báo cáo SV hướng dẫn theo học kỳ & trạng thái** | `GET` | `/report/supervisor-list?semesterId={uuid}&status={status}` | `VIEW_REPORT` hoặc `SUPERVISOR` | `application/json` |
| **2. Xem chi tiết Báo cáo Final & lịch sử nộp** | `GET` | `/report/{publicId}` | `STUDENT`, `SUPERVISOR`, `VIEW_TOPIC`, `SUBMIT_REPORT` hoặc `VIEW_REPORT` | `application/json` |
| **3. Nộp file check trùng & Duyệt / Yêu cầu sửa / Từ chối báo cáo** | `PUT` | `/report/{publicId}/review` | `REVIEW_REPORT` hoặc `SUPERVISOR` | `multipart/form-data` |
| **4. (Fallback lấy deadline khi danh sách rỗng)** | `GET` | `/api/v1/deadlines?semesterId={uuid}` | `VIEW_SCHEDULE`, `SUPERVISOR`, `ADMIN`, `HEAD_OF_MAJOR`, `STUDENT` | `application/json` |

> **Ghi chú xác thực**: Yêu cầu gửi kèm cookie `access_token` (`withCredentials: true`) hoặc header `Authorization: Bearer <token>`.

---

## 3. Chi tiết từng API

### 3.1. Danh sách báo cáo của sinh viên hướng dẫn theo học kỳ và trạng thái

- **Endpoint**: `GET /report/supervisor-list`
- **Query Params**:
  - `semesterId` (`UUID`, *không bắt buộc*): `publicId` của học kỳ cần lọc. Bỏ trống sẽ lấy học kỳ hiện tại (`ONGOING`).
  - `status` (`FinalReportStatus`, *không bắt buộc*): Trạng thái đơn báo cáo cần lọc:
    - `PENDING`: Đã nộp, chờ nhận xét (báo cáo cần GVHD chấm)
    - `REQUEST_CHANGES`: Yêu cầu chỉnh sửa
    - `APPROVED`: Đã duyệt đạt
    - `REJECTED`: Không đạt
    - *Không truyền `status`*: Trả về tất cả sinh viên ở GĐ 4 trở lên (`STAGE_3_OUTLINE_APPROVED`+) của GVHD (bao gồm cả sinh viên chưa nộp báo cáo với `publicId: null`, `status: null`).
- **Response Success (HTTP 200)**: Trả về `APIResponse<ThesisFinalReportResponse[]>`. Xem cấu trúc JSON mẫu ở [API_Supervisor_ProgressReport.md](./API_Supervisor_ProgressReport.md#31-danh-sách-sinh-viên-hướng-dẫn-theo-học-kỳ).

---

### 3.2. Xem chi tiết một Báo cáo Final

- **Endpoint**: `GET /report/{publicId}`
- **Path Variable**:
  - `publicId` (`UUID`, **bắt buộc**): `item.publicId` của Báo cáo Final.
- **Response Success (HTTP 200)**: Trả về `APIResponse<ThesisFinalReportResponse>` kèm đầy đủ mảng `histories` (lịch sử các lần nộp kèm tỷ lệ đạo văn & file check trùng từng lần) và `progressReport` (Phiếu theo dõi tiến độ).

---

### 3.3. Nộp kết quả kiểm tra trùng lặp & Duyệt / Từ chối Báo cáo Final

- **Endpoint**: `PUT /report/{publicId}/review`
- **Path Variable**:
  - `publicId` (`UUID`, **bắt buộc**): `item.publicId` của Báo cáo Final đang ở trạng thái `PENDING`.
- **Content-Type**: `multipart/form-data`
- **Form Data Params**:
  - `plagiarismRate` (`Double`, **bắt buộc**): Tỷ lệ đạo văn (%), giá trị hợp lệ từ `0` đến `100` (ví dụ `12.5`).
  - `plagiarismFile` (`File`, **bắt buộc**): File kết quả kiểm tra trùng lặp (Turnitin/DoIT...). Chỉ nhận **`.doc`**, **`.docx`**, **`.pdf`**, dung lượng **nhỏ hơn 10 MB**.
  - `decision` (`FinalReportStatus`, **bắt buộc**):
    - Khi `deadlineStatus === "OPEN"`: chỉ nhận `"APPROVED"` hoặc `"REQUEST_CHANGES"`.
    - Khi `deadlineStatus === "EXTENDED"`: chỉ nhận `"APPROVED"` hoặc `"REJECTED"`.
  - `feedback` (`string`, *không bắt buộc*): Ý kiến nhận xét của GVHD.
- **Response Success (HTTP 200)**:

```json
{
  "code": 1000,
  "message": "Thẩm định báo cáo Final thành công",
  "data": null
}
```

---

## 4. Quy tắc Hiển thị Hạn nộp Báo cáo theo Học kỳ

Backend trả về 5 trường deadline (`deadlineName`, `deadlineStartDate`, `deadlineEndDate`, `deadlineActive`, `deadlineStatus`) trong mỗi phần tử của `GET /report/supervisor-list` và `GET /report/{publicId}`. Nếu danh sách `supervisor-list` rỗng (`[]`), gọi fallback `GET /api/v1/deadlines?semesterId={uuid}` và lấy mốc `templateCode === "NOP_BAO_CAO_VA_PHIEU_THEO_DOI"` trong `stage2`.

| Giá trị `deadlineStatus` | Ý nghĩa nghiệp vụ | Cách hiển thị trên UI theo yêu cầu | Các quyết định (`decision`) hợp lệ cho GVHD chính |
|---|---|---|---:|
| `"NOT_CONFIGURED"` hoặc `"INACTIVE"` (hoặc `deadlineEndDate === null`) | Học kỳ chưa cấu hình hạn | Hiển thị: **`Chưa có`** | Không (khóa thẩm định) |
| `"NOT_STARTED"` | Chưa tới ngày mở (`now < startDate`) | Hiển thị ngày bắt đầu – kết thúc kèm **`Chưa mở`** | Không (khóa thẩm định) |
| `"OPEN"` | Đang trong hạn nộp của sinh viên | Hiển thị `formatDateTime(deadlineEndDate)` kèm **`Đang mở`** | `APPROVED` / `REQUEST_CHANGES` |
| `"EXTENDED"` | TBM đã đóng hạn SV và gia hạn cho GV chấm | Hiển thị `formatDateTime(deadlineEndDate)` kèm **`Gia hạn chấm`** *(hoặc ghi chú: Đã hết hạn SV nộp - Đang gia hạn GV chấm)* | `APPROVED` / `REJECTED` |
| `"CLOSED"` | Đã quá `deadlineEndDate` hoặc mốc đã `COMPLETED` | Hiển thị ngày hết hạn `formatDateTime(deadlineEndDate)` kèm chữ **`Đã hết hạn`** | Không (khóa thẩm định) |

### Hàm Helper gợi ý cho UI

```typescript
export type ReportDeadlineStatus =
  | 'NOT_CONFIGURED'
  | 'INACTIVE'
  | 'NOT_STARTED'
  | 'OPEN'
  | 'EXTENDED'
  | 'CLOSED';

export interface SupervisorReportDeadlineInfo {
  text: string;
  badgeText: string | null;
  isExpired: boolean;
  isUnconfigured: boolean;
  canReviewWindow: boolean;
  allowedDecisions: Array<'APPROVED' | 'REQUEST_CHANGES' | 'REJECTED'>;
}

export const formatReportDeadlineForReview = (
  deadlineEndDate: string | null | undefined,
  deadlineStatus: ReportDeadlineStatus | null | undefined,
  formatDateTime: (iso: string) => string
): SupervisorReportDeadlineInfo => {
  if (
    !deadlineStatus ||
    deadlineStatus === 'NOT_CONFIGURED' ||
    deadlineStatus === 'INACTIVE' ||
    !deadlineEndDate
  ) {
    return {
      text: 'Chưa có',
      badgeText: null,
      isExpired: false,
      isUnconfigured: true,
      canReviewWindow: false,
      allowedDecisions: [],
    };
  }

  const formattedEndDate = formatDateTime(deadlineEndDate);

  if (deadlineStatus === 'CLOSED') {
    return {
      text: `${formattedEndDate} (Đã hết hạn)`,
      badgeText: 'Đã hết hạn',
      isExpired: true,
      isUnconfigured: false,
      canReviewWindow: false,
      allowedDecisions: [],
    };
  }

  if (deadlineStatus === 'NOT_STARTED') {
    return {
      text: formattedEndDate,
      badgeText: 'Chưa mở',
      isExpired: false,
      isUnconfigured: false,
      canReviewWindow: false,
      allowedDecisions: [],
    };
  }

  if (deadlineStatus === 'EXTENDED') {
    return {
      text: `${formattedEndDate} (Gia hạn chấm)`,
      badgeText: 'Gia hạn chấm',
      isExpired: false,
      isUnconfigured: false,
      canReviewWindow: true,
      allowedDecisions: ['APPROVED', 'REJECTED'],
    };
  }

  // OPEN
  return {
    text: formattedEndDate,
    badgeText: 'Đang mở',
    isExpired: false,
    isUnconfigured: false,
    canReviewWindow: true,
    allowedDecisions: ['APPROVED', 'REQUEST_CHANGES'],
  };
};
```

---

## 5. Bảng mã lỗi Backend (ErrorCode)

| HTTP Status | Mã ErrorCode | Tên mã lỗi | Thông báo Tiếng Việt từ Backend |
|:---:|:---:|---|---|
| **400** | `4000` | `FINAL_REPORT_DECISION_NULL` | Vui lòng chọn kết quả thẩm định báo cáo |
| **400** | `4000` | `PLAGIARISM_RATE_REQUIRED` | Vui lòng nhập tỷ lệ đạo văn |
| **400** | `4000` | `PLAGIARISM_RATE_INVALID` | Tỷ lệ đạo văn phải nằm trong khoảng 0% đến 100% |
| **400** | `4000` | `REPORT_FILE_EMPTY` | File tải lên không được để trống |
| **400** | `4000` | `REPORT_FILE_INVALID_FORMAT` | File tải lên chỉ nhận định dạng .doc, .docx hoặc .pdf |
| **400** | `4000` | `REPORT_FILE_TOO_LARGE` | File tải lên phải nhỏ hơn 10MB |
| **400** | `4000` | `FINAL_REPORT_DECISION_INVALID_IN_SUBMISSION_PERIOD` | Trong thời gian nhận bài chỉ được chọn Đạt (APPROVED) hoặc Yêu cầu chỉnh sửa (REQUEST_CHANGES) |
| **400** | `4000` | `FINAL_REPORT_DECISION_INVALID_IN_GRADING_PERIOD` | Trong thời gian gia hạn chấm chỉ được chọn Đạt (APPROVED) hoặc Không đạt (REJECTED) |
| **400** | `4000` | `CLOUDINARY_SERVICE_FAIL` | Upload file thất bại |
| **404** | `3089` | `THESIS_FINAL_REPORT_NOT_FOUND` | Không tìm thấy báo cáo Final của đề tài |
| **404** | `3094` | `REPORT_DEADLINE_NOT_FOUND` | Chưa cấu hình thời hạn nộp báo cáo cho học kỳ này |
| **403** | `3095` | `FINAL_REPORT_SUBMISSION_DEADLINE_CLOSED` | Thời hạn sinh viên nộp báo cáo chưa mở hoặc đã kết thúc *(khi chưa tới startDate)* |
| **403** | `3097` | `FINAL_REPORT_GRADING_CLOSED` | Đã quá thời hạn GVHD thẩm định báo cáo, vui lòng liên hệ Trưởng bộ môn gia hạn |
| **409** | `3092` | `FINAL_REPORT_NOT_PENDING` | Báo cáo không ở trạng thái chờ thẩm định |
| **409** | `3093` | `PROGRESS_REPORT_NOT_SUBMITTED` | GVHD chưa nộp phiếu theo dõi tiến độ cho đề tài này |
| **409** | `3057` | `TOPIC_NOT_IN_PROGRESS` | Đề tài không ở trạng thái đang thực hiện |
| **403** | `2001` | `FORBIDDEN` | Giảng viên đồng hướng dẫn không có quyền thẩm định báo cáo / Không phải GVHD chính / Học kỳ đã kết thúc |
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
    review: (publicId: string) => `/report/${publicId}/review`,
  },
} as const;
```

### 6.2. Service gọi API (`supervisorReview.service.ts`)

```typescript
import type { FinalReportStatus, ThesisFinalReportResponse } from './finalReport.types';

export const PLAGIARISM_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // Nhỏ hơn 10 MB
export const PLAGIARISM_ALLOWED_EXTENSIONS = ['doc', 'docx', 'pdf'] as const;

export const validateReviewForm = (params: {
  plagiarismRate: number | null | undefined;
  plagiarismFile: File | null | undefined;
  decision: 'APPROVED' | 'REQUEST_CHANGES' | 'REJECTED' | null | undefined;
}): string | null => {
  if (!params.decision) {
    return 'Vui lòng chọn kết quả thẩm định báo cáo.';
  }
  if (params.plagiarismRate === null || params.plagiarismRate === undefined || Number.isNaN(params.plagiarismRate)) {
    return 'Vui lòng nhập tỷ lệ đạo văn.';
  }
  if (params.plagiarismRate < 0 || params.plagiarismRate > 100) {
    return 'Tỷ lệ đạo văn phải nằm trong khoảng 0% đến 100%.';
  }
  const file = params.plagiarismFile;
  if (!file || file.size === 0 || !file.name.trim()) {
    return 'File tải lên không được để trống.';
  }
  const dotIndex = file.name.lastIndexOf('.');
  const extension = dotIndex > 0 ? file.name.slice(dotIndex + 1).toLowerCase() : '';
  if (!PLAGIARISM_ALLOWED_EXTENSIONS.includes(extension as (typeof PLAGIARISM_ALLOWED_EXTENSIONS)[number])) {
    return 'File tải lên chỉ nhận định dạng .doc, .docx hoặc .pdf.';
  }
  if (file.size >= PLAGIARISM_MAX_FILE_SIZE_BYTES) {
    return 'File tải lên phải nhỏ hơn 10MB.';
  }
  return null;
};

// 1. Lấy danh sách báo cáo của sinh viên hướng dẫn theo học kỳ và trạng thái
export const getSupervisorFinalReports = async (params?: {
  semesterId?: string;
  status?: FinalReportStatus;
}) => {
  const response = await apiClient.get<APIResponse<ThesisFinalReportResponse[]>>(
    API_ENDPOINTS.report.supervisorList,
    { params }
  );
  return response.data.data;
};

// 2. Xem chi tiết Báo cáo Final (kèm histories & progressReport)
export const getFinalReportDetailForSupervisor = async (publicId: string) => {
  const response = await apiClient.get<APIResponse<ThesisFinalReportResponse>>(
    API_ENDPOINTS.report.detail(publicId)
  );
  return response.data.data;
};

// 3. GVHD chính nộp file kiểm tra trùng lặp và duyệt / yêu cầu sửa / từ chối báo cáo
export const reviewStudentFinalReport = async (params: {
  publicId: string;
  plagiarismRate: number;
  plagiarismFile: File;
  decision: 'APPROVED' | 'REQUEST_CHANGES' | 'REJECTED';
  feedback?: string;
}) => {
  const formData = new FormData();
  formData.append('plagiarismRate', String(params.plagiarismRate));
  formData.append('plagiarismFile', params.plagiarismFile);
  formData.append('decision', params.decision);
  if (params.feedback?.trim()) {
    formData.append('feedback', params.feedback.trim());
  }

  const response = await apiClient.put<APIResponse<void>>(
    API_ENDPOINTS.report.review(params.publicId),
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};
```

---

## 7. Điều kiện Mở/Khóa Thao tác Thẩm định trên UI

```typescript
const canReviewFinalReport = (item: ThesisFinalReportResponse): boolean => {
  const isReviewWindowOpen =
    item.deadlineStatus === 'OPEN' || item.deadlineStatus === 'EXTENDED';

  return (
    item.canReview === true && // Chỉ true với GVHD chính (topic.lecturer)
    item.publicId !== null && // Sinh viên đã nộp báo cáo
    item.status === 'PENDING' && // Báo cáo đang chờ thẩm định
    item.topicStatus === 'IN_PROGRESS' &&
    item.progressReport !== null && // Bắt buộc đã nộp Phiếu theo dõi tiến độ trước
    isReviewWindowOpen
  );
};
```

- **Nếu `item.canReview === false`**: Giảng viên đang xem là **GVHD đồng hướng dẫn** $\rightarrow$ Ẩn/khóa form thẩm định, hiển thị nhãn *"Đồng hướng dẫn (Chỉ xem)"*.
- **Nếu `item.progressReport === null`** (và `item.canReview === true`, `item.status === 'PENDING'`): Khóa hoặc hiển thị cảnh báo nhắc GVHD chính **nộp Phiếu theo dõi tiến độ trước khi duyệt/từ chối báo cáo** (tránh lỗi `3093 - PROGRESS_REPORT_NOT_SUBMITTED`).
- **Tùy chọn quyết định (`decision`) trong Modal/Form thẩm định**:
  - `item.deadlineStatus === 'OPEN'` $\rightarrow$ Chỉ hiển thị 2 lựa chọn: **Duyệt đạt (`APPROVED`)** và **Yêu cầu chỉnh sửa (`REQUEST_CHANGES`)**.
  - `item.deadlineStatus === 'EXTENDED'` $\rightarrow$ Chỉ hiển thị 2 lựa chọn: **Duyệt đạt (`APPROVED`)** và **Không đạt (`REJECTED`)**.

