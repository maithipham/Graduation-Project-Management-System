# Hướng dẫn Tích hợp API: Chốt & Đổi Tên Đề Tài Đồ Án (Dành cho Sinh Viên)

Tài liệu hướng dẫn kết nối Frontend (`Frontend/Student`) với Backend (`tlu_gpms_system`) cho các chức năng quản lý tên đề tài tốt nghiệp thuộc **Giai đoạn 2: Làm đồ án**:
1. **Xem tổng quan đề tài, lịch sử tên và thời hạn chốt tên / nộp đề cương** (`GET /topic/my-title-history`).
2. **Chốt tên đề tài chính thức lần đầu** (`POST /topic/confirm-title` — sau khi sinh viên đã có GVHD nhưng chưa chốt tên chính thức).
3. **Xin đổi tên đề tài** (`POST /topic/change-title` — sau khi đã có tên chính thức và đang trong quá trình thực hiện đồ án).

> **Tài liệu liên quan**: Luồng nộp & xem kết quả thẩm định đề cương (`GET /outline/my-outline`, `POST /outline/submit`) xem tại [API_Student_Outline.md](./API_Student_Outline.md).

---

## 1. Tổng quan Nghiệp vụ & Luồng xử lý (Workflow)

```
                            [ Sinh viên đăng ký GVHD thành công ]
                                             │
                                             ▼
                             Trạng thái: STAGE_1_ADVISOR_ASSIGNED
                                     (officialName = null)
                                             │
                  ┌──────────────────────────┴──────────────────────────┐
                  ▼                                                     ▼
      Trong hạn nộp (Deadline mở)                             Quá hạn nộp Deadline
  Sinh viên gọi: POST /topic/confirm-title                    Hệ thống tự động quét:
                  │                                            - Có tên dự kiến: Lấy làm tên chính thức -> STAGE_2
                  ▼                                            - Không có tên: Đình chỉ đồ án (DISQUALIFIED)
  Tạo bản ghi TopicTitleHistory: PENDING
       (Chờ GVHD chính duyệt)
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
    [APPROVED]          [REJECTED]
Tên đề tài cập nhật     - Còn hạn nộp: Giữ nguyên ở STAGE_1 để SV gửi lại tên khác
Chuyển sang:
STAGE_2_TOPIC_CONFIRMED
        │
        ▼
   Sinh viên thực hiện đồ án
        │
   (Nếu cần đổi tên đề tài khi deadlineStatus === "OPEN")
        │
        ▼
  Sinh viên gọi: POST /topic/change-title
  (Áp dụng chung hạn nộp đề cương SV_CHINH_SUA_NOP_LAI_DE_CUONG, tên mới khác tên cũ & không có yêu cầu PENDING)
        │
        ▼
  Tạo bản ghi TopicTitleHistory: PENDING -> GVHD chính duyệt / từ chối (OPEN hoặc EXTENDED)
```

### Lưu ý về Mốc thời hạn (Deadline) dùng chung
- Cả 3 nghiệp vụ **Chốt tên đề tài chính thức lần đầu** (`POST /topic/confirm-title`), **Xin đổi/cập nhật tên đề tài** (`POST /topic/change-title`), và **Nộp đề cương** (`POST /outline/submit`) đều sử dụng chung một mốc thời hạn duy nhất: **`SV_CHINH_SUA_NOP_LAI_DE_CUONG`** (*"Hạn sinh viên chỉnh sửa & nộp lại đề cương"*) do Trưởng bộ môn cấu hình cho học kỳ.
- Chỉ khi `deadlineStatus === "OPEN"` (tức `startDate <= now <= endDate` và trạng thái mốc khác `EXTENDED` / `COMPLETED`), sinh viên mới được phép chốt tên lần đầu hoặc gửi yêu cầu đổi tên đề tài.
- Khi mốc ở trạng thái **`EXTENDED`** (gia hạn chấm cho giảng viên): **khóa toàn bộ thao tác nộp/đổi tên của sinh viên**, nhưng GVHD chính vẫn tiếp tục được duyệt (`APPROVED`) hoặc từ chối (`REJECTED`) các yêu cầu `PENDING` đã gửi trước đó.
- Thông tin thời hạn này được Backend trả kèm **trực tiếp trong `StudentTopicOverviewResponse`** (`GET /topic/my-title-history`) gồm: `deadlineName`, `deadlineStartDate`, `deadlineEndDate`, `deadlineActive`, `deadlineStatus` — thống nhất định dạng với `RegistrationOverviewResponse` ở Giai đoạn 1.

---

## 2. Danh sách API Endpoints

Tất cả API trả về cấu trúc wrapper chuẩn `APIResponse<T>` (`{ code: 1000, message?: string, data: T }`) với HTTP `200 OK` khi thành công.

| Chức năng | Phương thức | Endpoint | Quyền (`@PreAuthorize`) | Mục đích |
|---|:---:|---|---|---|
| **Xem đề tài, lịch sử & deadline** | `GET` | `/topic/my-title-history?semesterId={uuid}` | `VIEW_TOPIC` hoặc `STUDENT` | Lấy thông tin đề tài, lịch sử chốt/đổi tên và trạng thái hạn nộp đề tài / đề cương |
| **Chốt tên lần đầu** | `POST` | `/topic/confirm-title` | `REGISTER_TOPIC` hoặc `STUDENT` | Sinh viên gửi tên đề tài chính thức lần đầu khi ở `STAGE_1_ADVISOR_ASSIGNED` |
| **Xin đổi tên đề tài** | `POST` | `/topic/change-title` | `UPDATE_TOPIC` hoặc `STUDENT` | Sinh viên gửi yêu cầu đổi tên khi đã ở `>= STAGE_2_TOPIC_CONFIRMED` |

> **Ghi chú xác thực**: Mọi request đều yêu cầu gửi kèm cookie `access_token` (`withCredentials: true`) hoặc header `Authorization: Bearer <token>`.

---

## 3. Chi tiết từng API

### 3.1. Lấy thông tin đề tài, lịch sử tên & thời hạn nộp

- **Endpoint**: `GET /topic/my-title-history`
- **Query Params**:
  - `semesterId` (`UUID`, *không bắt buộc*): `publicId` của học kỳ cần tra cứu. Nếu bỏ trống, Backend tự động lấy học kỳ hiện tại (`ONGOING`).
- **Đặc điểm phản hồi**:
  - **Luôn trả kèm thông tin Deadline** (`deadlineName`, `deadlineStartDate`, `deadlineEndDate`, `deadlineActive`, `deadlineStatus`), **ngay cả khi sinh viên chưa có đề tài trong học kỳ** (khi đó `topicPublicId: null`, các trường đề tài là `null`, `histories: []`).
- **Response Success (HTTP 200)**:

```json
{
  "code": 1000,
  "message": null,
  "data": {
    "topicPublicId": "018db26a-932f-789a-bc01-e23456789abc",
    "officialName": "Xây dựng hệ thống Quản lý Đồ án TLU",
    "provisionalName": "Nghiên cứu ứng dụng GPMS",
    "currentStage": "STAGE_1_ADVISOR_ASSIGNED",
    "currentStageDescription": "Đã có GVHD, chưa chốt tên đề tài",
    "status": "IN_PROGRESS",
    "disqualificationReason": null,
    "lecturerPublicId": "018db26a-932f-789a-bc01-aaaaaaaaaaaa",
    "lecturerName": "Trần Văn Bình",
    "coLecturerPublicId": "018db26a-932f-789a-bc01-bbbbbbbbbbbb",
    "coLecturerName": "Lê Văn Cường",
    "deadlineName": "Hạn sinh viên chỉnh sửa & nộp lại đề cương",
    "deadlineStartDate": "2026-11-01T00:00:00",
    "deadlineEndDate": "2026-11-20T23:59:59",
    "deadlineActive": true,
    "deadlineStatus": "OPEN",
    "histories": [
      {
        "publicId": "018db26a-932f-789a-bc01-cccccccccccc",
        "topicPublicId": "018db26a-932f-789a-bc01-e23456789abc",
        "studentPublicId": "018db26a-932f-789a-bc01-dddddddddddd",
        "studentCode": "2051060001",
        "studentName": "Nguyễn Văn An",
        "oldName": null,
        "newName": "Xây dựng hệ thống Quản lý Đồ án TLU",
        "status": "PENDING",
        "statusDescription": "Chờ giảng viên hướng dẫn xác nhận",
        "requestedAt": "2026-11-09T14:30:00",
        "reviewedAt": null,
        "reviewerPublicId": null,
        "reviewerName": null,
        "canReview": false
      }
    ]
  }
}
```

#### Bảng giá trị của `deadlineStatus`:

| Giá trị `deadlineStatus` | `deadlineActive` | Ý nghĩa |
|---|:---:|---|
| `NOT_CONFIGURED` | `null` | Học kỳ chưa cấu hình mốc `SV_CHINH_SUA_NOP_LAI_DE_CUONG` hoặc cả `startDate`/`endDate` đều `null`. |
| `INACTIVE` | `false` | Mới cấu hình 1 trong 2 mốc `startDate` / `endDate`. |
| `NOT_STARTED` | `true` | Chưa đến thời điểm bắt đầu mở (`now < deadlineStartDate`). |
| `OPEN` | `true` | Đang mở cho phép sinh viên chốt tên lần đầu, xin đổi tên đề tài và nộp đề cương (`deadlineStartDate <= now <= deadlineEndDate` và trạng thái không phải `EXTENDED`/`COMPLETED`). |
| `EXTENDED` | `true` | TBM đang gia hạn thời gian chấm cho giảng viên (`status == EXTENDED` trong khoảng `startDate..endDate`). Ở trạng thái này **khóa mọi thao tác nộp mới của sinh viên** (chốt tên, đổi tên và nộp đề cương); giảng viên tiếp tục thẩm định/duyệt các yêu cầu `PENDING` đã gửi trước đó. |
| `CLOSED` | `true` | Đã quá hạn kết thúc (`now > deadlineEndDate`) hoặc mốc đã đóng (`COMPLETED`). |

---

### 3.2. Chốt tên đề tài chính thức lần đầu

- **Endpoint**: `POST /topic/confirm-title`
- **Điều kiện gọi thành công**:
  1. Đề tài của sinh viên đang ở trạng thái `IN_PROGRESS`.
  2. Giai đoạn hiện tại là `STAGE_1_ADVISOR_ASSIGNED` và đề tài chưa có tên (`officialName == null`).
  3. Thời hạn (`SV_CHINH_SUA_NOP_LAI_DE_CUONG`) đã cấu hình và **đang mở cho sinh viên** (`deadlineStatus === "OPEN"`, không bị khóa bởi `EXTENDED` hay `COMPLETED`).
  4. Đề tài **chưa có yêu cầu nào đang ở trạng thái `PENDING`**.
- **Request Body**:
```json
{
  "newName": "Xây dựng hệ thống Quản lý Đồ án tốt nghiệp trường Đại học Thủy Lợi"
}
```
- **Validation DTO (`TopicTitleSubmitRequest`)**:
  - `newName`: `@NotBlank(message = "TOPIC_NAME_EMPTY")`, `@Size(max = 500, message = "ADVISOR_TOPIC_NAME_TOO_LONG")`. Backend tự `trim()` khoảng trắng thừa.
- **Response Success (HTTP 200)**:
```json
{
  "code": 1000,
  "message": "Gửi tên đề tài chính thức thành công",
  "data": null
}
```

---

### 3.3. Xin đổi tên đề tài (sau khi đã có tên chính thức)

- **Endpoint**: `POST /topic/change-title`
- **Điều kiện gọi thành công**:
  1. Đề tài của sinh viên đang ở trạng thái `IN_PROGRESS`.
  2. Giai đoạn hiện tại từ `STAGE_2_TOPIC_CONFIRMED` trở đi và đã có tên chính thức (`officialName != null`).
  3. Thời hạn (`SV_CHINH_SUA_NOP_LAI_DE_CUONG`) đã cấu hình và **đang mở cho sinh viên** (`deadlineStatus === "OPEN"`, bị khóa nếu `NOT_CONFIGURED`, `INACTIVE`, `NOT_STARTED`, `EXTENDED` hoặc `CLOSED`).
  4. Đề tài **chưa có yêu cầu nào đang ở trạng thái `PENDING`**.
  5. Tên mới phải khác với tên hiện tại (`newName.trim().toLowerCase() != officialName.trim().toLowerCase()`).
- **Request Body**:
```json
{
  "newName": "Nghiên cứu và phát triển hệ thống Quản lý Đồ án tốt nghiệp TLU"
}
```
- **Validation**:
  - `newName`: Bắt buộc, không được để trống, tối đa 500 ký tự, không trùng tên hiện tại.
- **Response Success (HTTP 200)**:
```json
{
  "code": 1000,
  "message": "Gửi yêu cầu đổi tên đề tài thành công",
  "data": null
}
```

---

## 4. Bảng mã lỗi Backend (ErrorCode) & Cách hiển thị trên UI

Khi API trả về lỗi (HTTP 4xx / 5xx), response body có dạng:
```json
{
  "code": 3051,
  "message": "Đề tài đang có yêu cầu chờ giảng viên hướng dẫn xác nhận"
}
```

| HTTP Status | Mã ErrorCode | Tên mã lỗi | Ý nghĩa nghiệp vụ & Gợi ý xử lý trên giao diện |
|:---:|:---:|---|---|
| **400** | `4000` | `TOPIC_NAME_EMPTY` | Tên đề tài không được để trống. |
| **400** | `3048` | `ADVISOR_TOPIC_NAME_TOO_LONG` | Tên đề tài không được vượt quá 500 ký tự. |
| **400** | `3058` | `TOPIC_NEW_NAME_UNCHANGED` | Tên đề tài mới trùng với tên đề tài hiện tại. |
| **409** | `3051` | `TOPIC_TITLE_PENDING_EXISTS` | Đang có một yêu cầu chờ GVHD duyệt. Cần ẩn/khóa form nộp để tránh gửi trùng lặp. |
| **409** | `3056` | `TOPIC_STAGE_INVALID_FOR_TITLE` | Sai mốc giai đoạn (ví dụ: đã chốt tên rồi nhưng gọi `/confirm-title`, hoặc chưa chốt tên lần đầu mà gọi `/change-title`). |
| **409** | `3057` | `TOPIC_NOT_IN_PROGRESS` | Đề tài không ở trạng thái đang thực hiện (đã bị đình chỉ `DISQUALIFIED` hoặc bị hủy `CANCELLED`). |
| **403** | `3054` | `TOPIC_CONFIRMATION_DEADLINE_CLOSED` | Thời hạn nộp đề cương / cập nhật tên đề tài chưa mở, đang gia hạn chấm (`EXTENDED`) hoặc đã kết thúc. Hiển thị thông báo liên hệ GVHD / Trưởng bộ môn. |
| **404** | `3053` | `TOPIC_CONFIRMATION_DEADLINE_NOT_FOUND` | Chưa cấu hình thời hạn nộp đề cương / cập nhật tên đề tài cho học kỳ này. |
| **403** | `2001` | `FORBIDDEN` | Sinh viên không có tên trong danh sách làm đồ án kỳ này, hoặc tài khoản bị khóa. |
| **401** | `2000` | `UNAUTHORIZED` | Phiên đăng nhập hết hạn. Điều hướng về màn hình đăng nhập. |

---

## 5. Hướng dẫn Tích hợp Code Phía Frontend (TypeScript / React)

### 5.1. Endpoints (`src/shared/api/endpoints.ts`)

```typescript
export const API_ENDPOINTS = {
  // ... các endpoint hiện tại ...
  topicTitle: {
    overview: '/topic/my-title-history',
    confirmInitial: '/topic/confirm-title',
    requestChange: '/topic/change-title',
  },
} as const;
```

---

### 5.2. Types (`src/features/outline_management/types/topicTitle.types.ts`)

```typescript
export type TopicTitleChangeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type OutlineDeadlineStatus =
  | 'NOT_CONFIGURED'
  | 'INACTIVE'
  | 'NOT_STARTED'
  | 'OPEN'
  | 'CLOSED'
  | 'EXTENDED';

export interface TopicTitleHistoryResponse {
  publicId: string;
  topicPublicId: string;
  studentPublicId: string;
  studentCode: string;
  studentName: string;
  oldName: string | null;
  newName: string;
  status: TopicTitleChangeStatus;
  statusDescription: string;
  requestedAt: string;
  reviewedAt: string | null;
  reviewerPublicId: string | null;
  reviewerName: string | null;
  canReview?: boolean;
}

export interface StudentTopicOverviewResponse {
  topicPublicId: string | null;
  officialName: string | null;
  provisionalName: string | null;
  currentStage: string | null;
  currentStageDescription: string | null;
  status: 'IN_PROGRESS' | 'DISQUALIFIED' | 'CANCELLED' | 'COMPLETED' | string | null;
  disqualificationReason: string | null;
  lecturerPublicId: string | null;
  lecturerName: string | null;
  coLecturerPublicId: string | null;
  coLecturerName: string | null;
  deadlineName: string | null;
  deadlineStartDate: string | null;
  deadlineEndDate: string | null;
  deadlineActive: boolean | null;
  deadlineStatus: OutlineDeadlineStatus;
  histories: TopicTitleHistoryResponse[];
}

export interface TopicTitleSubmitRequest {
  newName: string;
}
```

---

### 5.3. Service gọi API (`src/features/outline_management/services/topicTitle.service.ts`)

```typescript
import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoints';
import { APIResponse } from '@/shared/types/api';
import {
  StudentTopicOverviewResponse,
  TopicTitleSubmitRequest,
} from '../types/topicTitle.types';

export const topicTitleService = {
  // Lấy thông tin đề tài, lịch sử và thời hạn chốt tên / nộp đề cương
  getMyTopicOverview: async (semesterId?: string) => {
    const response = await apiClient.get<APIResponse<StudentTopicOverviewResponse>>(
      API_ENDPOINTS.topicTitle.overview,
      { params: semesterId ? { semesterId } : undefined }
    );
    return response.data.data;
  },

  // Chốt tên đề tài chính thức lần đầu (GĐ 2)
  confirmInitialTitle: async (payload: TopicTitleSubmitRequest) => {
    const response = await apiClient.post<APIResponse<void>>(
      API_ENDPOINTS.topicTitle.confirmInitial,
      payload
    );
    return response.data;
  },

  // Xin đổi tên đề tài (sau khi đã có tên chính thức)
  requestChangeTitle: async (payload: TopicTitleSubmitRequest) => {
    const response = await apiClient.post<APIResponse<void>>(
      API_ENDPOINTS.topicTitle.requestChange,
      payload
    );
    return response.data;
  },
};
```

---

### 5.4. React Hooks (`src/features/outline_management/hooks/useTopicTitle.ts`)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { topicTitleService } from '../services/topicTitle.service';
import { TopicTitleSubmitRequest } from '../types/topicTitle.types';

export const TOPIC_TITLE_KEYS = {
  overview: (semesterId?: string) => ['topic-title', 'overview', semesterId] as const,
};

// Hook lấy thông tin đề tài, lịch sử & deadline
export const useMyTopicOverview = (semesterId?: string) => {
  return useQuery({
    queryKey: TOPIC_TITLE_KEYS.overview(semesterId),
    queryFn: () => topicTitleService.getMyTopicOverview(semesterId),
  });
};

// Hook chốt tên đề tài lần đầu
export const useConfirmInitialTitle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TopicTitleSubmitRequest) =>
      topicTitleService.confirmInitialTitle(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic-title'] });
      queryClient.invalidateQueries({ queryKey: ['student-outline'] });
    },
  });
};

// Hook xin đổi tên đề tài
export const useRequestChangeTitle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TopicTitleSubmitRequest) =>
      topicTitleService.requestChangeTitle(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic-title'] });
      queryClient.invalidateQueries({ queryKey: ['student-outline'] });
    },
  });
};
```

---

## 6. Logic Hiển Thị Giao Diện Người Dùng (UI/UX Checklist)

Dựa vào dữ liệu trả về từ `GET /topic/my-title-history`:

### 1. Hiển thị Thời hạn nộp thực tế (bỏ toàn bộ dữ liệu hardcode):
- Thay thế hoàn toàn dữ liệu giả `getTermInfo(term).outlineDeadline` / `'28/10/2026 23:59:55'` trong `StudentOutlinePage.tsx` và `"Từ 01/10/2026 đến 15/01/2027"` trong `StudentOutlinePreviewPage.tsx` bằng `topicOverview.deadlineStartDate`, `topicOverview.deadlineEndDate`, `topicOverview.deadlineStatus`:
  - `NOT_CONFIGURED` / `INACTIVE`: Hiển thị `"Chưa cấu hình thời hạn nộp"` (màu xám).
  - `NOT_STARTED`: Hiển thị `"Chưa mở (Mở từ {formatDateTime(deadlineStartDate)} - Đóng lúc {formatDateTime(deadlineEndDate)})"` (màu xanh/xám).
  - `OPEN`: Hiển thị `"Từ {formatDateTime(deadlineStartDate)} đến {formatDateTime(deadlineEndDate)} (Đang mở)"` (màu xanh/hổ phách).
  - `EXTENDED`: Hiển thị `"Đã hết hạn nộp — Đang trong thời gian gia hạn chấm của giảng viên (đến {formatDateTime(deadlineEndDate)})"` (màu cam).
  - `CLOSED`: Hiển thị `"Đã hết hạn ({formatDateTime(deadlineEndDate)})"` (màu đỏ).

### 2. Trạng thái chưa có đề tài trong học kỳ (`!topicOverview?.topicPublicId`):
- Hiển thị thông báo: *"Bạn chưa nằm trong danh sách sinh viên thực hiện đồ án của học kỳ này"* và khóa nút gửi/sửa tên, nhưng vẫn hiển thị `deadlineStatus` / thời hạn nếu đã cấu hình.

### 3. Trạng thái có yêu cầu đang chờ duyệt (`hasPendingRequest`):
```typescript
const hasPendingRequest = topicOverview?.histories?.some((h) => h.status === 'PENDING');
```
- **Nếu `hasPendingRequest === true`**:
  - Hiển thị badge: **"Đang chờ GVHD duyệt tên đề tài"**.
  - **Khóa (Disable)** ô nhập và nút gửi tên mới để tránh gửi trùng (`3051 - TOPIC_TITLE_PENDING_EXISTS`).

### 4. Điều kiện mở Form Chốt tên lần đầu (`/topic/confirm-title`) & Form Đổi tên (`/topic/change-title`):
- Cả hai thao tác **Chốt tên lần đầu** và **Đổi/Cập nhật tên đề tài** dùng chung điều kiện hạn mở nộp của mốc `SV_CHINH_SUA_NOP_LAI_DE_CUONG`:
  ```typescript
  const isDeadlineOpenForStudent = topicOverview?.deadlineStatus === 'OPEN';
  ```
- **Nếu `deadlineStatus !== 'OPEN'`** (bao gồm `NOT_CONFIGURED`, `INACTIVE`, `NOT_STARTED`, `EXTENDED`, `CLOSED`):
  - **Khóa (Disable)** thao tác gửi của **cả hai form** (`confirm-title` và `change-title`), kèm thông báo thống nhất theo thời hạn nộp đề cương và cập nhật tên đề tài.
- **Form Chốt tên lần đầu (`/topic/confirm-title`)**:
  - Hiển thị khi `topicOverview?.currentStage === 'STAGE_1_ADVISOR_ASSIGNED' && !topicOverview?.officialName`.
  - Điền sẵn gợi ý `provisionalName` (nếu có).
- **Form Đổi tên đề tài (`/topic/change-title`)**:
  - Hiển thị khi `topicOverview?.officialName != null && !hasPendingRequest`.
  - Validate trước khi submit: Tên mới sau `trim()` không được rỗng, không vượt quá `500` ký tự và không trùng (không phân biệt hoa/thường) với `topicOverview.officialName`.

### 5. Đề tài bị đình chỉ (`DISQUALIFIED`):
- Khi `topicOverview?.status === 'DISQUALIFIED'`:
  - Hiển thị alert đỏ cảnh báo: *"Bạn đã bị dừng thực hiện đồ án trong học kỳ này. Lý do: {topicOverview.disqualificationReason}"*.
  - Khóa toàn bộ các thao tác gửi tên hoặc nộp đề cương.
