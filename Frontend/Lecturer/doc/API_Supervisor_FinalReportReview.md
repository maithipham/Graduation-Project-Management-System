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
                                                                        ▼
                                         [ Backend chạy Plagiarism Auto-Verification ]
                                         - Trích xuất text & thông tin trang 1 file PDF
                                         - Kiểm tra tính toàn vẹn nội bộ (header vs biểu đồ tròn)
                                         - Đối chiếu 1-1 tỷ lệ GVHD nhập vs số liệu trong PDF
                                         - Đối chiếu Mã sinh viên (Lop_MSV_HoTen vs topic.studentCode)
                                         - Kiểm tra ngưỡng tối đa 35.0% khi duyệt APPROVED
                                                                        │
                             ┌──────────────────────────────────────────┼──────────────────────────────────────────┐
                             ▼                                          ▼                                          ▼
                   [decision = APPROVED]                [decision = REQUEST_CHANGES]                   [decision = REJECTED]
             (plagiarismRate <= 35.0%, Cả OPEN & EXTENDED)   (plagiarismRate > 35% hoặc cần sửa nội dung,  (plagiarismRate > 35% hoặc không đạt,
                              │                              CHỈ khi deadline OPEN)                     CHỈ khi deadline EXTENDED)
                              ▼                                          │                                          │
               topic.currentStage =                                      ▼                                          ▼
             STAGE_4_REPORT_APPROVED                        Giữ STAGE_3_OUTLINE_APPROVED             topic.status = DISQUALIFIED
             (Đủ điều kiện ra Phản biện)                    SV sửa & nộp lại khi còn OPEN            (Dừng đồ án trong học kỳ)
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
- **Validate dữ liệu kiểm tra trùng lặp & Quy tắc ngưỡng tối đa 35% (bắt buộc)**:
  - `plagiarismRate`: Bắt buộc nhập (`4000 - PLAGIARISM_RATE_REQUIRED`), giá trị số thực trong khoảng **`0` đến `100`** (`0 <= plagiarismRate <= 100`, ngoài khoảng báo `4000 - PLAGIARISM_RATE_INVALID`).
  - **Quy tắc tỷ lệ đạo văn tối đa 35% khi duyệt ĐẠT (`decision === 'APPROVED'`)**:
    - Báo cáo chỉ đủ điều kiện duyệt **ĐẠT (`APPROVED`)** khi **`plagiarismRate <= 35.0%`**.
    - Nếu **`plagiarismRate > 35.0%`**: Backend **tuyệt đối chặn không cho chọn `APPROVED`**, trả về lỗi **`4000 - PLAGIARISM_RATE_EXCEEDED`** (*"Tỷ lệ đạo văn vượt quá 35%, không đủ điều kiện phê duyệt Đạt"*).
    - Khi `plagiarismRate > 35.0%`:
      - *Trong thời gian mở nộp (`deadlineStatus === 'OPEN'`)*: GVHD chọn **`REQUEST_CHANGES`** (Yêu cầu chỉnh sửa) để sinh viên chỉnh sửa giảm tỷ lệ trùng lặp và nộp lại báo cáo.
      - *Trong thời gian gia hạn chấm (`deadlineStatus === 'EXTENDED'`)*: Do sinh viên không còn quyền nộp lại, GVHD chỉ được chọn **`REJECTED`** (Không đạt $\rightarrow$ sinh viên bị `DISQUALIFIED` dừng đồ án).
  - `plagiarismFile`: Bắt buộc tải file minh chứng kết quả quét (Turnitin / KiểmTraTàiLiệu / DoIT...). File bắt buộc có định dạng **`.pdf`**, dung lượng **nhỏ hơn 10 MB** (`< 10 * 1024 * 1024` bytes).
  - `feedback`: Tùy chọn (`string`), nhưng nên khuyến khích GVHD nhập khi chọn `REQUEST_CHANGES` hoặc `REJECTED`.
- **Cơ chế Tự động Bóc tách & Đối chiếu File PDF Báo cáo Trùng lặp (Plagiarism Auto-Verification)**:
  Nhằm đảm bảo tính trung thực, khách quan và loại trừ sai sót thao tác (GVHD gõ nhầm số liệu hoặc chọn nhầm file của sinh viên khác), Backend đã tích hợp module kiểm tra và đối chiếu tự động file PDF (`PlagiarismReportExtractorService`):
  1. **Kiến trúc bóc tách 2 tầng (Hybrid Engine)**:
     - *Tầng 1 (PDFBox + Regex):* Trích xuất text layer trang 1 của file PDF siêu tốc (mili-giây), nhận diện tiêu đề báo cáo chuẩn `BÁO CÁO KIỂM TRA TRÙNG LẶP`, đọc điểm trùng lặp và mã sinh viên.
     - *Tầng 2 (Gemini Vision AI Fallback):* Tự động kích hoạt khi file PDF là dạng ảnh scan không có text layer.
  2. **4 Ràng buộc đối chiếu khắt khe phía Backend**:
     - 🛡️ **Kiểm tra tính toàn vẹn nội bộ file PDF:** So khớp điểm số ở mục thông tin và biểu đồ tròn kết quả trên trang 1. Nếu có sự sai lệch $\rightarrow$ chặn và báo lỗi `PLAGIARISM_REPORT_INTERNAL_INCONSISTENCY` (Code 4000).
     - 🛡️ **Đối chiếu 1-1 giữa số GVHD nhập và số liệu trong file:** Tỷ lệ `plagiarismRate` GVHD nhập trên Form phải khớp hoàn toàn với tỷ lệ trích xuất từ file PDF (sai số $< 0.01\%$). Nếu lệch $\rightarrow$ chặn và báo lỗi `PLAGIARISM_SCORE_MISMATCH` (Code 4000).
     - 🛡️ **Kiểm tra ngưỡng tối đa 35%:** Tỷ lệ bóc tách từ file báo cáo không được vượt quá `35.0%` khi duyệt Đạt (`APPROVED`). Nếu vượt $\rightarrow$ báo lỗi `PLAGIARISM_RATE_EXCEEDED` (Code 4000).
     - 🛡️ **Đối chiếu Mã sinh viên (chống nộp nhầm file của sinh viên khác):** Hệ thống trích xuất mã sinh viên từ mục *Tên tài liệu* trên trang 1 (quy chuẩn: `Lop_MSV_HoTen`, ví dụ `64KTPM3_2251172405_LuongThiThuyLien` $\rightarrow$ MSV `2251172405`) và đối chiếu với mã sinh viên của đề tài đang duyệt. Nếu không tìm thấy MSV $\rightarrow$ `PLAGIARISM_REPORT_STUDENT_ID_NOT_FOUND`; nếu MSV không khớp $\rightarrow$ `PLAGIARISM_REPORT_STUDENT_ID_MISMATCH` (Code 4000).
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
    > ⚠️ **Lưu ý nghiệp vụ**:
    > - Chỉ được chọn `decision: "APPROVED"` khi `plagiarismRate <= 35.0`. Nếu `plagiarismRate > 35.0`, bắt buộc chọn `"REQUEST_CHANGES"` (khi OPEN) hoặc `"REJECTED"` (khi EXTENDED).
    > - Con số GVHD nhập **phải khớp hoàn toàn** với con số ghi nhận trên file PDF tải lên (sai số cho phép $< 0.01\%$).
  - `plagiarismFile` (`File`, **bắt buộc**): File PDF báo cáo kết quả kiểm tra trùng lặp (Turnitin / KiểmTraTàiLiệu / DoIT...).
    > ⚠️ **Ràng buộc định dạng & Quy chuẩn đặt tên tài liệu**:
    > - Bắt buộc file định dạng **`.pdf`** (Backend phân tích trang 1 bằng PDFBox & Gemini AI Vision), dung lượng **nhỏ hơn 10 MB**.
    > - File báo cáo PDF cần tuân thủ quy chuẩn đặt tên tài liệu khi quét: **`Lop_MSV_HoTen`** (ví dụ: `64KTPM3_2251172405_LuongThiThuyLien.pdf`) để hệ thống tự động bóc tách và đối chiếu đúng Mã sinh viên của đề tài.
  - `decision` (`FinalReportStatus`, **bắt buộc**):
    - Khi `deadlineStatus === "OPEN"`: chỉ nhận `"APPROVED"` hoặc `"REQUEST_CHANGES"`.
    - Khi `deadlineStatus === "EXTENDED"`: chỉ nhận `"APPROVED"` hoặc `"REJECTED"`.
  - `feedback` (`string`, *không bắt buộc*): Ý kiến nhận xét của GVHD.
- **Hành vi xử lý phía Backend khi gọi API**:
  1. Kiểm tra quyền GVHD chính và điều kiện đã nộp Phiếu theo dõi tiến độ.
  2. Bóc tách tự động trang 1 file PDF, so khớp 1-1 tỷ lệ trùng lặp và mã sinh viên.
  3. Nếu dữ liệu hợp lệ: Upload file lên Cloudinary, cập nhật Báo cáo Final + Lịch sử nộp, cập nhật tiến trình đề tài (`APPROVED` $\rightarrow$ `STAGE_4_REPORT_APPROVED`; `REJECTED` $\rightarrow$ `DISQUALIFIED`), và bắn thông báo SSE cho sinh viên.
  4. Nếu phát hiện sai sót (nhập sai số, nộp nhầm file SV khác, vượt 35%...): Dừng ngay lập tức, không upload Cloudinary và trả mã lỗi 4000 tương ứng.
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

| HTTP Status | Mã ErrorCode | Tên mã lỗi | Thông báo Tiếng Việt từ Backend | Giải thích & Cách xử lý phía Frontend |
|:---:|:---:|---|---|---|
| **400** | `4000` | `FINAL_REPORT_DECISION_NULL` | Vui lòng chọn kết quả thẩm định báo cáo | Chưa chọn APPROVED / REQUEST_CHANGES / REJECTED |
| **400** | `4000` | `PLAGIARISM_RATE_REQUIRED` | Vui lòng nhập tỷ lệ đạo văn | Chưa nhập tỷ lệ % trùng lặp |
| **400** | `4000` | `PLAGIARISM_RATE_INVALID` | Tỷ lệ đạo văn phải nằm trong khoảng 0% đến 100% | Số âm hoặc lớn hơn 100% |
| **400** | `4000` | `PLAGIARISM_RATE_EXCEEDED` | Tỷ lệ đạo văn vượt quá 35%, không đủ điều kiện phê duyệt Đạt | Tỷ lệ > 35.0% nhưng GVHD lại bấm APPROVED |
| **400** | `4000` | `PLAGIARISM_REPORT_FILE_REQUIRED` | Vui lòng tải lên file PDF báo cáo kiểm tra trùng lặp! | Chưa chọn file báo cáo đạo văn |
| **400** | `4000` | `PLAGIARISM_SCORE_MISMATCH` | Số liệu không khớp! Tỷ lệ trùng lặp bạn nhập khác với kết quả trong file báo cáo PDF. Vui lòng kiểm tra lại tài liệu! | **Số GVHD gõ khác số đọc được trong PDF** $\rightarrow$ FE báo đỏ nhắc GVHD kiểm tra lại số liệu hoặc file |
| **400** | `4000` | `PLAGIARISM_REPORT_STUDENT_ID_NOT_FOUND` | Không tìm thấy Mã sinh viên hợp lệ trong mục 'Tên tài liệu' của file báo cáo PDF (Quy chuẩn: Lop_MSV_HoTen)! | Tên tài liệu khi scan không chứa chuỗi 10 chữ số MSV |
| **400** | `4000` | `PLAGIARISM_REPORT_STUDENT_ID_MISMATCH` | Cảnh báo nhầm tài liệu! File báo cáo PDF có mã sinh viên không khớp với sinh viên đang duyệt. | **Nộp nhầm file của sinh viên khác!** $\rightarrow$ FE popup cảnh báo chọn đúng file SV |
| **400** | `4000` | `PLAGIARISM_REPORT_DATA_NOT_FOUND` | Không tìm thấy dữ liệu tỷ lệ trùng lặp hợp lệ trên trang 1 của tài liệu. Vui lòng kiểm tra lại đúng mẫu báo cáo PDF! | Trang 1 không đúng định dạng báo cáo kiểm tra trùng lặp chuẩn |
| **400** | `4000` | `PLAGIARISM_REPORT_INTERNAL_INCONSISTENCY` | Phát hiện bất thường trong file PDF: 'Điểm trùng lặp' ở phần thông tin không khớp với biểu đồ kết quả! | File PDF bị chỉnh sửa hoặc số liệu tiêu đề lệch biểu đồ tròn |
| **400** | `4000` | `PDF_FILE_EMPTY` | File PDF rỗng! | File 0 byte hoặc không có trang nào |
| **400** | `4000` | `AI_SERVICE_TIMEOUT` | Mạng rớt & AI timeout. Hãy thử lại | Dịch vụ AI Vision trích xuất ảnh scan gặp sự cố/timeout |
| **400** | `4000` | `EXPECTED_STUDENT_ID_REQUIRED` | Mã sinh viên cần đối chiếu (expectedStudentId) không được để trống! | Thông tin sinh viên của đề tài bị thiếu mã SV |
| **400** | `4000` | `REPORT_FILE_EMPTY` | File tải lên không được để trống | File rỗng |
| **400** | `4000` | `REPORT_FILE_INVALID_FORMAT` | File tải lên chỉ nhận định dạng .doc, .docx hoặc .pdf | File sai đuôi hoặc không đọc được cấu trúc PDF |
| **400** | `4000` | `REPORT_FILE_TOO_LARGE` | File tải lên phải nhỏ hơn 10MB | Dung lượng vượt quá 10MB |
| **400** | `4000` | `FINAL_REPORT_DECISION_INVALID_IN_SUBMISSION_PERIOD` | Trong thời gian nhận bài chỉ được chọn Đạt (APPROVED) hoặc Yêu cầu chỉnh sửa (REQUEST_CHANGES) | Chọn REJECTED khi hạn đang OPEN |
| **400** | `4000` | `FINAL_REPORT_DECISION_INVALID_IN_GRADING_PERIOD` | Trong thời gian gia hạn chấm chỉ được chọn Đạt (APPROVED) hoặc Không đạt (REJECTED) | Chọn REQUEST_CHANGES khi hạn đang EXTENDED |
| **400** | `4000` | `CLOUDINARY_SERVICE_FAIL` | Upload file thất bại | Lỗi dịch vụ Cloudinary |
| **404** | `3089` | `THESIS_FINAL_REPORT_NOT_FOUND` | Không tìm thấy báo cáo Final của đề tài | Báo cáo không tồn tại |
| **404** | `3094` | `REPORT_DEADLINE_NOT_FOUND` | Chưa cấu hình thời hạn nộp báo cáo cho học kỳ này | Học kỳ chưa tạo mốc hạn |
| **403** | `3095` | `FINAL_REPORT_SUBMISSION_DEADLINE_CLOSED` | Thời hạn sinh viên nộp báo cáo chưa mở hoặc đã kết thúc *(khi chưa tới startDate)* | Chưa tới ngày mở mốc |
| **403** | `3097` | `FINAL_REPORT_GRADING_CLOSED` | Đã quá thời hạn GVHD thẩm định báo cáo, vui lòng liên hệ Trưởng bộ môn gia hạn | Mốc đã quá hạn hoặc COMPLETED |
| **409** | `3092` | `FINAL_REPORT_NOT_PENDING` | Báo cáo không ở trạng thái chờ thẩm định | Báo cáo đã được APPROVED/REJECTED trước đó |
| **409** | `3093` | `PROGRESS_REPORT_NOT_SUBMITTED` | GVHD chưa nộp phiếu theo dõi tiến độ cho đề tài này | **Chưa nộp phiếu tiến độ** $\rightarrow$ Chặn mọi quyết định |
| **409** | `3057` | `TOPIC_NOT_IN_PROGRESS` | Đề tài không ở trạng thái đang thực hiện | Đề tài đã bị loại hoặc hoàn tất |
| **403** | `2001` | `FORBIDDEN` | Giảng viên đồng hướng dẫn không có quyền thẩm định báo cáo / Không phải GVHD chính / Học kỳ đã kết thúc | Không có quyền thao tác ghi |
| **401** | `2000` | `UNAUTHORIZED` | Phiên đăng nhập hết hạn | Cần đăng nhập lại |

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
export const PLAGIARISM_ALLOWED_EXTENSIONS = ['pdf'] as const; // Bắt buộc PDF chuẩn

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
  if (params.decision === 'APPROVED' && params.plagiarismRate > 35) {
    return 'Tỷ lệ đạo văn vượt quá 35%, không đủ điều kiện phê duyệt Đạt.';
  }
  const file = params.plagiarismFile;
  if (!file || file.size === 0 || !file.name.trim()) {
    return 'File báo cáo kiểm tra trùng lặp không được để trống.';
  }
  const dotIndex = file.name.lastIndexOf('.');
  const extension = dotIndex > 0 ? file.name.slice(dotIndex + 1).toLowerCase() : '';
  if (!PLAGIARISM_ALLOWED_EXTENSIONS.includes(extension as (typeof PLAGIARISM_ALLOWED_EXTENSIONS)[number])) {
    return 'File kiểm tra trùng lặp bắt buộc là định dạng .pdf (xuất từ Turnitin / KiểmTraTàiLiệu).';
  }
  if (file.size >= PLAGIARISM_MAX_FILE_SIZE_BYTES) {
    return 'File tải lên phải nhỏ hơn 10MB.';
  }
  return null;
};

// Hàm ánh xạ thông báo lỗi thân thiện cho GVHD khi Backend ném mã lỗi đối chiếu PDF
export const mapPlagiarismReviewError = (errorCode: string | number, backendMessage?: string): string => {
  switch (errorCode) {
    case 'PLAGIARISM_SCORE_MISMATCH':
      return 'Số liệu không khớp! Tỷ lệ trùng lặp bạn nhập trên Form khác với kết quả ghi nhận trong file báo cáo PDF. Vui lòng kiểm tra lại tỷ lệ % đã gõ!';
    case 'PLAGIARISM_REPORT_STUDENT_ID_MISMATCH':
      return 'Cảnh báo nộp nhầm file! Báo cáo PDF có Mã sinh viên không khớp với sinh viên của đề tài đang duyệt. Vui lòng chọn đúng file của sinh viên này!';
    case 'PLAGIARISM_REPORT_STUDENT_ID_NOT_FOUND':
      return 'Không tìm thấy Mã sinh viên hợp lệ trong mục "Tên tài liệu" của file báo cáo PDF. Vui lòng kiểm tra file có quy chuẩn đặt tên Lop_MSV_HoTen!';
    case 'PLAGIARISM_RATE_EXCEEDED':
      return 'Tỷ lệ đạo văn trong file báo cáo vượt quá 35.0%. Không đủ điều kiện phê duyệt Đạt!';
    case 'PLAGIARISM_REPORT_INTERNAL_INCONSISTENCY':
      return 'Phát hiện bất thường trong file PDF: Điểm trùng lặp ở phần thông tin không khớp với biểu đồ tròn kết quả!';
    case 'PROGRESS_REPORT_NOT_SUBMITTED':
      return 'Bạn chưa nộp Phiếu theo dõi tiến độ cho sinh viên này! Vui lòng nộp Phiếu theo dõi tiến độ trước khi thực hiện thẩm định báo cáo.';
    case 'AI_SERVICE_TIMEOUT':
      return 'Dịch vụ phân tích file scan gặp gián đoạn tạm thời. Vui lòng thử lại sau ít phút!';
    default:
      return backendMessage || 'Thẩm định báo cáo thất bại. Vui lòng thử lại!';
  }
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
- **Ràng buộc tỷ lệ đạo văn tối đa 35% trên Form thẩm định**:
  - Khi GVHD nhập `plagiarismRate > 35` (ví dụ `38.5%`):
    - **Disable lựa chọn "Duyệt đạt (`APPROVED`)"** (nếu đang được chọn thì tự động bỏ chọn hoặc chuyển sang `REQUEST_CHANGES` / `REJECTED`).
    - Hiển thị cảnh báo màu đỏ bên dưới: *"Tỷ lệ đạo văn vượt quá 35% (tối đa cho phép: 35.0%). Không thể phê duyệt Đạt. Vui lòng chọn 'Yêu cầu chỉnh sửa' (khi đang mở nộp) hoặc 'Không đạt' (khi gia hạn chấm)."*
- **Tùy chọn quyết định (`decision`) trong Modal/Form thẩm định**:
  - `item.deadlineStatus === 'OPEN'` $\rightarrow$ Chỉ hiển thị 2 lựa chọn: **Duyệt đạt (`APPROVED`)** (chỉ click được khi `plagiarismRate <= 35%`) và **Yêu cầu chỉnh sửa (`REQUEST_CHANGES`)**.
  - `item.deadlineStatus === 'EXTENDED'` $\rightarrow$ Chỉ hiển thị 2 lựa chọn: **Duyệt đạt (`APPROVED`)** (chỉ click được khi `plagiarismRate <= 35%`) và **Không đạt (`REJECTED`)**.
- **Hướng dẫn Giao diện (UI/UX) cho Form / Modal Thẩm định Báo cáo**:
  - **Gợi ý tải file PDF**: Thêm dòng ghi chú nhỏ bên dưới ô upload file:
    > *"Lưu ý: Bắt buộc tải lên file PDF kết quả quét đạo văn chuẩn (Turnitin / KiểmTraTàiLiệu / DoIT). Tên file/tài liệu khi quét nên theo chuẩn `Lop_MSV_HoTen` để hệ thống tự động nhận diện và đối chiếu Mã sinh viên."*
  - **Gợi ý nhập số liệu**: Thêm tooltip/placeholder:
    > *"Nhập chính xác tỷ lệ % hiển thị trên file PDF (hệ thống sẽ tự động đối chiếu số liệu và cảnh báo nếu có sự sai lệch)."*
  - **Xử lý phản hồi lỗi từ Backend**:
    - Khi nhận mã lỗi `PLAGIARISM_SCORE_MISMATCH`: Tô đỏ ô nhập tỷ lệ đạo văn kèm thông báo *"Tỷ lệ bạn nhập không khớp với con số trong file PDF vừa tải lên. Vui lòng kiểm tra lại."*
    - Khi nhận mã lỗi `PLAGIARISM_REPORT_STUDENT_ID_MISMATCH`: Bật Toast/Modal cảnh báo nghiêm trọng *"Cảnh báo: File PDF này thuộc về sinh viên khác, không khớp với sinh viên đang được chấm! Vui lòng kiểm tra lại file đã chọn."*
    - Khi nhận mã lỗi `PROGRESS_REPORT_NOT_SUBMITTED`: Hiển thị nút bấm liên kết nhanh *"Nộp Phiếu theo dõi tiến độ ngay"* dẫn tới Modal nộp phiếu tiến độ.

