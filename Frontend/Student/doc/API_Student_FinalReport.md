# Hướng dẫn Tích hợp API: Nộp & Theo dõi Báo cáo Đồ án Cuối kỳ - Final Report (Dành cho Sinh viên)

Tài liệu hướng dẫn kết nối Frontend (`Frontend/Student`) với Backend (`tlu_gpms_system`) cho chức năng **Nộp Báo cáo Final, Xem Lịch sử Nộp kèm Kết quả Kiểm tra Trùng lặp (Đạo văn) và Xem Thời hạn Nộp Báo cáo theo Học kỳ** thuộc **Giai đoạn 4** (tiếp nối sau khi đề cương đã được phê duyệt đạt `STAGE_3_OUTLINE_APPROVED`):

1. **Nộp mới hoặc nộp lại Báo cáo Final** (`POST /report/submit`).
2. **Xem thông tin báo cáo hiện tại, lịch sử các lần nộp (trạng thái, tỷ lệ đạo văn, file minh chứng check trùng, nhận xét của GVHD), phiếu theo dõi tiến độ và hạn nộp theo học kỳ** (`GET /report/my-report?semesterId={uuid}`).
3. **Xem chi tiết một Báo cáo Final theo `publicId`** (`GET /report/{publicId}`).

> **Tài liệu liên quan**:
> - Chốt tên đề tài lần đầu & xin đổi tên đề tài: [API_Create_Update_topicName.md](./API_Create_Update_topicName.md)
> - Nộp & theo dõi đề cương đồ án (Giai đoạn 3): [API_Student_Outline.md](./API_Student_Outline.md)

---

## 1. Tổng quan Nghiệp vụ & Luồng xử lý (Workflow)

```
       [ Đề tài đã được duyệt đề cương (>= STAGE_3_OUTLINE_APPROVED) & status = IN_PROGRESS ]
                                             │
                                             ▼
                          Kiểm tra qua GET /report/my-report?semesterId={uuid}
               (Trả về thông tin đề tài + deadline + báo cáo hiện tại + histories + progressReport)
                                             │
                                             ▼
                      deadlineStatus === "OPEN" && status !== APPROVED/REJECTED
                                             │
                                             ▼
                          Sinh viên gọi: POST /report/submit
                                    (Multipart file)
            -> Backend validate file (.doc/.docx/.pdf, < 10 MB) -> Upload Cloudinary
            -> Tạo/cập nhật ThesisFinalReport + thêm bản ghi mới vào ThesisFinalReportHistory
                                             │
                                             ▼
                            Trạng thái báo cáo: PENDING
                  (Chờ GVHD chính kiểm tra đạo văn & thẩm định báo cáo)
                                             │
               ┌─────────────────────────────┼─────────────────────────────┐
               ▼                             ▼                             ▼
          [APPROVED]                 [REQUEST_CHANGES]                 [REJECTED]
    Hoàn thành Báo cáo Final     Yêu cầu chỉnh sửa & nộp lại       Không đạt (khi EXTENDED
 -> STAGE_4_REPORT_APPROVED      (SV xem tỷ lệ đạo văn, file       hoặc Job hết hạn quét)
 (Đủ điều kiện ra Phản biện)      check trùng, nhận xét của GVHD   -> Đề tài: DISQUALIFIED
                                  & nộp lại khi deadline OPEN)
```

### Lưu ý nghiệp vụ quan trọng
- **Điều kiện tiên quyết để sinh viên nộp Báo cáo Final (`POST /report/submit`)**:
  1. Đề tài ở trạng thái `IN_PROGRESS` (`3057 - TOPIC_NOT_IN_PROGRESS` nếu đã bị đình chỉ `DISQUALIFIED` hoặc hủy) và đã hoàn thành duyệt đề cương (`currentStage >= STAGE_3_OUTLINE_APPROVED`, nếu chưa đạt báo `3090 - REPORT_STAGE_INVALID`).
  2. Mốc thời hạn `NOP_BAO_CAO_VA_PHIEU_THEO_DOI` của học kỳ phải đang ở trạng thái **`OPEN`** (`startDate <= now <= endDate` và trạng thái mốc khác `EXTENDED` / `COMPLETED`).
     - Khi `deadlineStatus === "EXTENDED"` (TBM gia hạn chấm riêng cho GVHD), sinh viên **không thể nộp/nộp lại báo cáo** (`3095 - FINAL_REPORT_SUBMISSION_DEADLINE_CLOSED`).
     - Chưa cấu hình mốc cho học kỳ sẽ trả lỗi `3094 - REPORT_DEADLINE_NOT_FOUND`.
  3. Trạng thái báo cáo hiện tại chưa có (`null`) hoặc đang thuộc `{PENDING, REQUEST_CHANGES}`:
     - Nếu đang `PENDING` (nộp đè trước khi GVHD chấm) hoặc `REQUEST_CHANGES` (nộp bản sửa sau khi GVHD trả kết quả đạo văn & nhận xét) và hạn vẫn `OPEN`, sinh viên được nộp lại nhiều lần (mỗi lần tạo thêm 1 dòng trong `histories`).
     - Nếu đã `APPROVED` hoặc `REJECTED` thì bị chặn (`3091 - FINAL_REPORT_ALREADY_FINALIZED`).
- **Quy định Validate File tải lên**:
  - File không được rỗng và có tên file gốc hợp lệ (`4000 - REPORT_FILE_EMPTY`).
  - Chỉ nhận định dạng **`.doc`**, **`.docx`**, **`.pdf`** (`4000 - REPORT_FILE_INVALID_FORMAT`).
  - Dung lượng **nhỏ hơn 10 MB** (`file.size < 10 * 1024 * 1024` bytes; từ `10 MB` trở lên trả `4000 - REPORT_FILE_TOO_LARGE`).
- **Kết quả kiểm tra trùng lặp (đạo văn) & nhận xét từ GVHD**:
  - Mỗi lần GVHD chính thẩm định báo cáo, GVHD bắt buộc nhập **tỷ lệ đạo văn (`plagiarismRate`, từ `0%` đến `100%`)** và tải lên **file kết quả kiểm tra trùng lặp (`plagiarismFile` / `plagiarismHistoryFile`)** kèm ý kiến nhận xét (`supervisorFeedback`) và kết quả (`APPROVED` / `REQUEST_CHANGES` / `REJECTED`).
  - Toàn bộ thông tin này được lưu trên cả bản ghi báo cáo hiện tại (`ThesisFinalReportResponse`) lẫn từng lần nộp trong mảng `histories` (`ThesisFinalReportHistoryResponse`, sắp xếp mới nhất lên đầu `submittedAt DESC`).
- **`GET /report/my-report` luôn trả thông tin Deadline theo học kỳ**:
  - Kể cả khi sinh viên **chưa nộp báo cáo lần nào** (`publicId: null`, `histories: []`) hoặc **chưa có đề tài trong kỳ**, API vẫn trả HTTP `200 OK` (không bắn lỗi) kèm 5 trường deadline của mốc `NOP_BAO_CAO_VA_PHIEU_THEO_DOI` (`deadlineName`, `deadlineStartDate`, `deadlineEndDate`, `deadlineActive`, `deadlineStatus`).

---

## 2. Danh sách API Endpoints

Tất cả API trả về cấu trúc wrapper chuẩn `APIResponse<T>` (`{ code: 1000, message?: string, data: T }`) với HTTP `200 OK` khi thành công.

| Chức năng | Phương thức | Endpoint | Quyền (`@PreAuthorize`) | Content-Type |
|---|:---:|---|---|---|
| **1. Nộp / Nộp lại Báo cáo Final** | `POST` | `/report/submit` | `SUBMIT_REPORT` hoặc `STUDENT` | `multipart/form-data` |
| **2. Xem báo cáo, lịch sử nộp, kết quả đạo văn & deadline theo học kỳ** | `GET` | `/report/my-report?semesterId={uuid}` | `VIEW_TOPIC`, `SUBMIT_REPORT` hoặc `STUDENT` | `application/json` |
| **3. Xem chi tiết Báo cáo Final theo `publicId`** | `GET` | `/report/{publicId}` | `STUDENT`, `SUPERVISOR`, `VIEW_TOPIC`, `SUBMIT_REPORT` hoặc `VIEW_REPORT` | `application/json` |

> **Ghi chú xác thực**: Yêu cầu gửi kèm cookie `access_token` (`withCredentials: true`) hoặc header `Authorization: Bearer <token>`.

---

## 3. Chi tiết từng API

### 3.1. Sinh viên nộp / nộp lại Báo cáo Final

- **Endpoint**: `POST /report/submit`
- **Content-Type**: `multipart/form-data`
- **Form Data Params**:
  - `file` (`File`, **bắt buộc**): File báo cáo toàn văn tải lên. Chỉ chấp nhận định dạng **`.doc`**, **`.docx`**, **`.pdf`**, tên file gốc hợp lệ, dung lượng **nhỏ hơn 10 MB** (`< 10 * 1024 * 1024` bytes).
- **Response Success (HTTP 200)**:

```json
{
  "code": 1000,
  "message": "Nộp báo cáo Final thành công",
  "data": null
}
```

---

### 3.2. Xem thông tin Báo cáo Final, lịch sử nộp (kèm kết quả đạo văn) & hạn nộp theo học kỳ

- **Endpoint**: `GET /report/my-report`
- **Query Params**:
  - `semesterId` (`UUID`, *không bắt buộc*): `publicId` của học kỳ cần xem. Nếu bỏ trống, Backend tự động lấy học kỳ đang diễn ra (`ONGOING`).
- **Response Success (HTTP 200) — Khi sinh viên đã nộp báo cáo và đã có kết quả thẩm định**:

```json
{
  "code": 1000,
  "message": null,
  "data": {
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
    "coLecturerPublicId": null,
    "coLecturerName": null,
    "finalReportFile": "https://res.cloudinary.com/.../bao_cao_final_v2.pdf",
    "plagiarismRate": 14.5,
    "plagiarismFile": "https://res.cloudinary.com/.../turnitin_v1.pdf",
    "supervisorFeedback": "Tỷ lệ trùng lặp ở chương 2 còn cao, em trích dẫn lại nguồn tài liệu.",
    "status": "PENDING",
    "statusDescription": "Đã nộp, chờ nhận xét",
    "submittedAt": "2026-11-12T15:30:00",
    "reviewedAt": "2026-11-11T18:00:00",
    "progressReport": {
      "publicId": "018db26a-932f-789a-bc01-777777777777",
      "topicPublicId": "018db26a-932f-789a-bc01-e23456789abc",
      "supervisorPublicId": "018db26a-932f-789a-bc01-333333333333",
      "supervisorName": "Trần Văn Bình",
      "progressFile": "https://res.cloudinary.com/.../phieu_tien_do.pdf",
      "supervisorNote": "Sinh viên thực hiện nghiêm túc, đúng tiến độ.",
      "submittedAt": "2026-11-11T09:00:00"
    },
    "canSubmitProgressReport": false,
    "canReview": false,
    "deadlineName": "Hạn nộp báo cáo ĐATN & Phiếu theo dõi tiến độ",
    "deadlineStartDate": "2026-11-01T00:00:00",
    "deadlineEndDate": "2026-11-25T23:59:59",
    "deadlineActive": true,
    "deadlineStatus": "OPEN",
    "histories": [
      {
        "publicId": "018db26a-932f-789a-bc01-888888888802",
        "finalHistoryFile": "https://res.cloudinary.com/.../bao_cao_final_v2.pdf",
        "plagiarismRate": null,
        "plagiarismHistoryFile": null,
        "status": "PENDING",
        "statusDescription": "Đã nộp, chờ nhận xét",
        "supervisorFeedback": null,
        "submittedAt": "2026-11-12T15:30:00",
        "reviewedAt": null
      },
      {
        "publicId": "018db26a-932f-789a-bc01-888888888801",
        "finalHistoryFile": "https://res.cloudinary.com/.../bao_cao_final_v1.pdf",
        "plagiarismRate": 28.4,
        "plagiarismHistoryFile": "https://res.cloudinary.com/.../turnitin_v1.pdf",
        "status": "REQUEST_CHANGES",
        "statusDescription": "Yêu cầu chỉnh sửa",
        "supervisorFeedback": "Tỷ lệ trùng lặp ở chương 2 còn cao, em trích dẫn lại nguồn tài liệu.",
        "submittedAt": "2026-11-10T10:15:00",
        "reviewedAt": "2026-11-11T18:00:00"
      }
    ]
  }
}
```

#### Giải thích các trường phục vụ hiển thị Lịch sử nộp & Kết quả kiểm tra trùng lặp:
- **Bản nộp hiện tại (ngoài cùng của `data`)**:
  - `finalReportFile`: Link tải file báo cáo Final mới nhất sinh viên đã nộp.
  - `status` & `statusDescription`:
    - `PENDING` (*"Đã nộp, chờ nhận xét"*)
    - `REQUEST_CHANGES` (*"Yêu cầu chỉnh sửa"*)
    - `APPROVED` (*"Đã duyệt đạt"*)
    - `REJECTED` (*"Không đạt"*)
  - `plagiarismRate`: Tỷ lệ trùng lặp / đạo văn (`number`, đơn vị `%`, ví dụ `14.5` $\rightarrow$ hiển thị `14.5%`). Khi chưa chấm lần nào sẽ là `null`.
  - `plagiarismFile`: Link tải file minh chứng kết quả quét đạo văn (PDF/Word do GVHD đính kèm).
  - `supervisorFeedback`: Nhận xét của GVHD cho báo cáo.
  - `progressReport`: Thông tin Phiếu theo dõi tiến độ do GVHD tải lên (`null` nếu GVHD chưa nộp phiếu).
- **Mảng `histories` (Lịch sử từng lần nộp, sắp xếp từ lần nộp mới nhất $\rightarrow$ cũ nhất)**:
  - `finalHistoryFile`: Link file báo cáo của lần nộp đó.
  - `submittedAt`: Thời điểm sinh viên nộp bản đó.
  - `status` & `statusDescription`: Trạng thái thẩm định của lần nộp đó (`PENDING`, `REQUEST_CHANGES`, `APPROVED`, `REJECTED`).
  - `plagiarismRate`: Tỷ lệ đạo văn (`%`) GVHD ghi nhận cho lần nộp đó (`null` nếu lần nộp đó đang `PENDING` hoặc bị nộp đè trước khi chấm).
  - `plagiarismHistoryFile`: Link file báo cáo kiểm tra trùng lặp của lần nộp đó (`null` nếu chưa chấm).
  - `supervisorFeedback`: Nhận xét của GVHD ở lần nộp đó.
  - `reviewedAt`: Thời điểm GVHD chấm lần nộp đó.

#### Trường hợp sinh viên chưa nộp Báo cáo Final lần nào:
- `publicId`, `finalReportFile`, `plagiarismRate`, `plagiarismFile`, `supervisorFeedback`, `status`, `statusDescription`, `submittedAt`, `reviewedAt` đều là `null`.
- `histories` là mảng rỗng `[]`.
- Vẫn trả đầy đủ thông tin đề tài (`topicPublicId`, `topicName`, `currentStage`, `topicStatus`,...), `progressReport` (nếu GVHD đã nộp phiếu tiến độ), và **5 trường deadline** của học kỳ.

---

### 3.3. Xem chi tiết một Báo cáo Final theo `publicId`

- **Endpoint**: `GET /report/{publicId}`
- **Path Variable**:
  - `publicId` (`UUID`, **bắt buộc**): `publicId` của bản ghi `ThesisFinalReport`.
- **Response Success (HTTP 200)**: Trả về cùng cấu trúc `APIResponse<ThesisFinalReportResponse>` như mục `3.2` (bao gồm đầy đủ `histories`, `progressReport` và 5 trường deadline).

---

## 4. Quy tắc Hiển thị Thời hạn Nộp Báo cáo (`deadlineStatus`) trên UI

Backend tính sẵn trường `deadlineStatus` và trả về trong `GET /report/my-report?semesterId={uuid}` với 5 giá trị:

| Giá trị `deadlineStatus` | Ý nghĩa từ Backend | Cách hiển thị trên UI theo yêu cầu | Cho phép SV bấm nộp? |
|---|---|---|:---:|
| `"NOT_CONFIGURED"` hoặc `"INACTIVE"` (hoặc `deadlineEndDate === null`) | Học kỳ chưa được TBM thiết lập hạn nộp báo cáo | Hiển thị: **`Chưa có`** | Không |
| `"NOT_STARTED"` | Đã cấu hình nhưng chưa tới `deadlineStartDate` | Hiển thị ngày bắt đầu – ngày kết thúc kèm nhãn **`Chưa mở`** | Không |
| `"OPEN"` | Đang trong thời gian nhận bài của sinh viên (`startDate <= now <= endDate`) | Hiển thị hạn chót `formatDateTime(deadlineEndDate)` (ví dụ: `23:59 - 25/11/2026`) kèm nhãn **`Đang mở`** | **Có** (nếu đề tài đủ điều kiện & báo cáo chưa `APPROVED`/`REJECTED`) |
| `"CLOSED"` | Đã quá `deadlineEndDate` hoặc mốc đã `COMPLETED` | Hiển thị ngày hết hạn `formatDateTime(deadlineEndDate)` kèm chữ/nhãn **`Đã hết hạn`** | Không |
| `"EXTENDED"` | TBM đã đóng hạn nộp của SV và chuyển sang gia hạn chấm cho GVHD | Đối với màn hình Sinh viên, hạn nộp đã kết thúc: hiển thị ngày hết hạn `formatDateTime(deadlineEndDate)` kèm chữ **`Đã hết hạn`** (hoặc ghi chú *"Đã hết hạn nộp - Đang trong thời gian giảng viên chấm"*) | Không |

### Hàm Helper gợi ý cho UI hiển thị Hạn nộp Báo cáo

```typescript
export type ReportDeadlineStatus =
  | 'NOT_CONFIGURED'
  | 'INACTIVE'
  | 'NOT_STARTED'
  | 'OPEN'
  | 'EXTENDED'
  | 'CLOSED';

export interface DeadlineDisplayInfo {
  text: string;
  badgeText: string | null;
  isExpired: boolean;
  isUnconfigured: boolean;
}

export const formatReportDeadlineForStudent = (
  deadlineEndDate: string | null | undefined,
  deadlineStatus: ReportDeadlineStatus | null | undefined,
  formatDateTime: (iso: string) => string
): DeadlineDisplayInfo => {
  // 1. Chưa cấu hình hạn nộp trong học kỳ
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
    };
  }

  const formattedEndDate = formatDateTime(deadlineEndDate);

  // 2. Đã hết hạn nộp đối với sinh viên (CLOSED hoặc EXTENDED)
  if (deadlineStatus === 'CLOSED' || deadlineStatus === 'EXTENDED') {
    return {
      text: `${formattedEndDate} (Đã hết hạn)`,
      badgeText: 'Đã hết hạn',
      isExpired: true,
      isUnconfigured: false,
    };
  }

  // 3. Chưa đến thời gian mở nộp
  if (deadlineStatus === 'NOT_STARTED') {
    return {
      text: formattedEndDate,
      badgeText: 'Chưa mở',
      isExpired: false,
      isUnconfigured: false,
    };
  }

  // 4. Đang trong hạn nộp (OPEN)
  return {
    text: formattedEndDate,
    badgeText: 'Đang mở',
    isExpired: false,
    isUnconfigured: false,
  };
};
```

---

## 5. Bảng mã lỗi Backend (ErrorCode)

| HTTP Status | Mã ErrorCode | Tên mã lỗi | Thông báo Tiếng Việt từ Backend |
|:---:|:---:|---|---|
| **400** | `4000` | `REPORT_FILE_EMPTY` | File tải lên không được để trống |
| **400** | `4000` | `REPORT_FILE_INVALID_FORMAT` | File tải lên chỉ nhận định dạng .doc, .docx hoặc .pdf |
| **400** | `4000` | `REPORT_FILE_TOO_LARGE` | File tải lên phải nhỏ hơn 10MB |
| **400** | `4000` | `CLOUDINARY_SERVICE_FAIL` | Upload file thất bại |
| **404** | `3089` | `THESIS_FINAL_REPORT_NOT_FOUND` | Không tìm thấy báo cáo Final của đề tài |
| **409** | `3090` | `REPORT_STAGE_INVALID` | Đề tài chưa được duyệt đề cương hoặc không ở giai đoạn làm báo cáo |
| **409** | `3091` | `FINAL_REPORT_ALREADY_FINALIZED` | Báo cáo đã được phê duyệt hoặc đã có kết quả cuối cùng, không thể nộp lại |
| **404** | `3094` | `REPORT_DEADLINE_NOT_FOUND` | Chưa cấu hình thời hạn nộp báo cáo cho học kỳ này |
| **403** | `3095` | `FINAL_REPORT_SUBMISSION_DEADLINE_CLOSED` | Thời hạn sinh viên nộp báo cáo chưa mở hoặc đã kết thúc |
| **409** | `3057` | `TOPIC_NOT_IN_PROGRESS` | Đề tài không ở trạng thái đang thực hiện |
| **403** | `2001` | `FORBIDDEN` | Bạn không có tên trong danh sách sinh viên làm đồ án của học kỳ này / Không có quyền truy cập |
| **401** | `2000` | `UNAUTHORIZED` | Phiên đăng nhập hết hạn |

---

## 6. Hướng dẫn Tích hợp Code Phía Frontend (TypeScript / React)

### 6.1. Bổ sung vào `src/shared/api/endpoints.ts`

```typescript
export const API_ENDPOINTS = {
  // ... các endpoint hiện tại ...
  report: {
    myReport: '/report/my-report',
    myProgressReport: '/report/my-progress-report',
    submit: '/report/submit',
    detail: (publicId: string) => `/report/${publicId}`,
  },
} as const;
```

### 6.2. Khai báo Types (`finalReport.types.ts`)

```typescript
export type FinalReportStatus = 'PENDING' | 'REQUEST_CHANGES' | 'APPROVED' | 'REJECTED';

export type ReportDeadlineStatus =
  | 'NOT_CONFIGURED'
  | 'INACTIVE'
  | 'NOT_STARTED'
  | 'OPEN'
  | 'EXTENDED'
  | 'CLOSED';

export interface ThesisProgressReportResponse {
  publicId: string;
  topicPublicId: string;
  supervisorPublicId: string | null;
  supervisorName: string | null;
  progressFile: string;
  supervisorNote: string | null;
  submittedAt: string | null;
}

export interface ThesisFinalReportHistoryResponse {
  publicId: string;
  finalHistoryFile: string;
  plagiarismRate: number | null;
  plagiarismHistoryFile: string | null;
  status: FinalReportStatus;
  statusDescription: string;
  supervisorFeedback: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface ThesisFinalReportResponse {
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
  finalReportFile: string | null;
  plagiarismRate: number | null;
  plagiarismFile: string | null;
  supervisorFeedback: string | null;
  status: FinalReportStatus | null;
  statusDescription: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  progressReport: ThesisProgressReportResponse | null;
  canSubmitProgressReport: boolean;
  canReview: boolean;
  deadlineName: string | null;
  deadlineStartDate: string | null;
  deadlineEndDate: string | null;
  deadlineActive: boolean | null;
  deadlineStatus: ReportDeadlineStatus;
  histories: ThesisFinalReportHistoryResponse[];
}
```

### 6.3. Service gọi API (`finalReport.service.ts`)

```typescript
export const REPORT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // Nhỏ hơn 10 MB
export const REPORT_ALLOWED_EXTENSIONS = ['doc', 'docx', 'pdf'] as const;

export const validateReportFile = (file: File | null | undefined): string | null => {
  if (!file || file.size === 0 || !file.name.trim()) {
    return 'File tải lên không được để trống.';
  }
  const dotIndex = file.name.lastIndexOf('.');
  const extension = dotIndex > 0 ? file.name.slice(dotIndex + 1).toLowerCase() : '';
  if (!REPORT_ALLOWED_EXTENSIONS.includes(extension as (typeof REPORT_ALLOWED_EXTENSIONS)[number])) {
    return 'File tải lên chỉ nhận định dạng .doc, .docx hoặc .pdf.';
  }
  if (file.size >= REPORT_MAX_FILE_SIZE_BYTES) {
    return 'File tải lên phải nhỏ hơn 10MB.';
  }
  return null;
};

// 1. Xem báo cáo Final, lịch sử nộp (kèm kết quả trùng lặp) & hạn nộp theo học kỳ
export const getMyFinalReport = async (semesterId?: string) => {
  const response = await apiClient.get<APIResponse<ThesisFinalReportResponse>>(
    API_ENDPOINTS.report.myReport,
    { params: semesterId ? { semesterId } : undefined }
  );
  return response.data.data;
};

// 2. Sinh viên nộp / nộp lại Báo cáo Final
export const submitMyFinalReport = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<APIResponse<void>>(
    API_ENDPOINTS.report.submit,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

// 3. Xem chi tiết Báo cáo Final theo publicId
export const getFinalReportDetail = async (publicId: string) => {
  const response = await apiClient.get<APIResponse<ThesisFinalReportResponse>>(
    API_ENDPOINTS.report.detail(publicId)
  );
  return response.data.data;
};
```

---

## 7. Điều kiện Mở/Khóa Nút "Nộp Báo cáo Final" trên UI

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

const hasApprovedOutline =
  Boolean(reportData?.currentStage) &&
  (STAGE_ORDER[reportData!.currentStage!] ?? -1) >= STAGE_ORDER.STAGE_3_OUTLINE_APPROVED;

const canSubmitFinalReport =
  reportData?.topicStatus === 'IN_PROGRESS' &&
  hasApprovedOutline &&
  reportData?.deadlineStatus === 'OPEN' &&
  reportData?.status !== 'APPROVED' &&
  reportData?.status !== 'REJECTED';
```

