# Hướng dẫn Tích hợp API: Chốt và Đổi Tên Đề Tài Đồ Án (Dành cho Sinh Viên)

Tài liệu hướng dẫn kết nối Frontend với Backend cho các chức năng quản lý tên đề tài tốt nghiệp trong **Giai đoạn 2: Làm đồ án**:
1. **Chốt tên đề tài chính thức lần đầu** (sau khi sinh viên đã có GVHD nhưng chưa chốt tên chính thức).
2. **Xin đổi tên đề tài** (sau khi đã có tên chính thức và đang trong quá trình thực hiện đồ án).
3. **Xem tổng quan đề tài và lịch sử các lần nộp / đổi tên**.

---

## 1. Tổng quan Nghiệp vụ & Luồng xử lý (Workflow)

```
                            [ Sinh viên đăng ký GVHD thành công ]
                                             │
                                             ▼
                             Trạng thái: STAGE_1_ADVISOR_ASSIGNED
                                     (Tên đề tài = null)
                                             │
                  ┌──────────────────────────┴──────────────────────────┐
                  ▼                                                     ▼
      Trong hạn nộp (Deadline mở)                             Quá hạn nộp Deadline
  Sinh viên gọi: POST /topic/confirm-title                    Hệ thống tự động quét:
                  │                                            - Nếu có tên dự kiến: Lấy làm tên chính thức -> STAGE_2
                  ▼                                            - Không có tên: Đình chỉ đồ án (DISQUALIFIED)
  Tạo bản ghi TopicTitleHistory: PENDING
       (Chờ GVHD chính duyệt)
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
    [APPROVED]          [REJECTED]
Tên đề tài cập nhật     - Nếu còn hạn nộp: Giữ nguyên để SV gửi lại tên khác
Chuyển sang:            - Nếu trong hạn chấm: Tự động dùng tên dự kiến (hoặc DISQUALIFIED)
STAGE_2_TOPIC_CONFIRMED
        │
        ▼
   Sinh viên thực hiện đồ án
        │
   (Nếu cần đổi tên đề tài)
        │
        ▼
  Sinh viên gọi: POST /topic/change-title
  (Không phụ thuộc Deadline, chỉ cần khác tên cũ & không có yêu cầu nào đang PENDING)
        │
        ▼
  Tạo bản ghi TopicTitleHistory: PENDING -> GVHD chính duyệt / từ chối
```

---

## 2. Danh sách API Endpoints

| Chức năng | Phương thức | Endpoint | Phân quyền |
|---|:---:|---|---|
| **Chốt tên lần đầu** | `POST` | `/topic/confirm-title` | `STUDENT` |
| **Xin đổi tên đề tài** | `POST` | `/topic/change-title` | `STUDENT` |

> **Ghi chú xác thực**: Mọi request đều yêu cầu gửi kèm cookie `access_token` hoặc header `Authorization: Bearer <token>`.

---

## 3. Chi tiết từng API

### 3.1. Chốt tên đề tài chính thức lần đầu

- **Endpoint**: `POST /topic/confirm-title`
- **Điều kiện gọi thành công**:
  1. Đề tài của sinh viên đang ở trạng thái `IN_PROGRESS`.
  2. Giai đoạn hiện tại là `STAGE_1_ADVISOR_ASSIGNED` và đề tài chưa có tên (`officialName == null`).
  3. Thời hạn chốt tên đề tài (`TOPIC_CONFIRMATION`) của học kỳ đang mở (`now <= endDate`).
  4. Đề tài **chưa có yêu cầu nào đang ở trạng thái `PENDING`**.
- **Request Body**:
```json
{
  "newName": "Xây dựng hệ thống Quản lý Đồ án tốt nghiệp trường Đại học Thủy Lợi"
}
```
- **Validation**:
  - `newName`: Bắt buộc, không được để trống hoặc chỉ có khoảng trắng (tối thiểu 1 ký tự, tối đa 500 ký tự).
- **Response Success (HTTP 200)**:
```json
{
  "code": 1000,
  "message": "Gửi tên đề tài chính thức thành công",
  "data": null
}
```

---

### 3.2. Xin đổi tên đề tài (sau khi đã có tên chính thức)

- **Endpoint**: `POST /topic/change-title`
- **Điều kiện gọi thành công**:
  1. Đề tài của sinh viên đang ở trạng thái `IN_PROGRESS`.
  2. Giai đoạn hiện tại từ `STAGE_2_TOPIC_CONFIRMED` trở đi và đã có tên chính thức (`officialName != null`).
  3. Không phụ thuộc vào hạn Deadline của GĐ2 (sinh viên có thể xin đổi tên trong quá trình làm đề tài theo sự đồng ý của GVHD).
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

Khi API trả về lỗi (HTTP 4xx / 5xx), response body sẽ theo format:
```json
{
  "code": 3051,
  "message": "Đề tài đang có yêu cầu chờ giảng viên hướng dẫn xác nhận"
}
```

| HTTP Status | Mã ErrorCode | Tên mã lỗi | Ý nghĩa nghiệp vụ & Gợi ý xử lý trên giao diện |
|:---:|:---:|---|---|
| **400** | `4000` | `TOPIC_NAME_EMPTY` | Tên đề tài không được để trống. |
| **400** | `4000` | `ADVISOR_TOPIC_NAME_TOO_LONG` | Tên đề tài không được vượt quá 500 ký tự. |
| **400** | `3058` | `TOPIC_NEW_NAME_UNCHANGED` | Tên đề tài mới trùng với tên đề tài hiện tại. |
| **400** | `3051` | `TOPIC_TITLE_PENDING_EXISTS` | Đang có một yêu cầu chờ GVHD duyệt. Cần ẩn/khóa form nộp để tránh gửi trùng lặp. |
| **400** | `3056` | `TOPIC_STAGE_INVALID_FOR_TITLE` | Sai mốc giai đoạn (ví dụ: đã chốt tên rồi nhưng lại gọi `/confirm-title`, hoặc chưa chốt tên lần đầu mà lại gọi `/change-title`). |
| **400** | `3057` | `TOPIC_NOT_IN_PROGRESS` | Đề tài không ở trạng thái đang thực hiện (đã bị đình chỉ `DISQUALIFIED` hoặc bị hủy `CANCELLED`). |
| **400** | `3054` | `TOPIC_CONFIRMATION_DEADLINE_CLOSED` | Thời hạn gửi tên đề tài chính thức đã kết thúc. Hiển thị thông báo liên hệ GVHD / Trưởng bộ môn. |
| **404** | `3053` | `TOPIC_CONFIRMATION_DEADLINE_NOT_FOUND` | Học kỳ hiện tại chưa được cấu hình đợt chốt tên đề tài. |
| **403** | `2001` | `FORBIDDEN` | Sinh viên không có tên trong danh sách làm đồ án kỳ này, hoặc tài khoản bị khóa. |
| **401** | `2000` | `UNAUTHORIZED` | Phiên đăng nhập hết hạn. Điều hướng về màn hình đăng nhập. |

---

## 5. Hướng dẫn Tích hợp Code Phía Frontend (TypeScript / React)

### 5.1. Bổ sung vào `src/shared/api/endpoints.ts`

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

### 5.2. Định nghĩa Types trong `src/features/outline_management/types/topicTitle.ts`

```typescript
export type TopicTitleChangeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

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
  topicPublicId: string;
  officialName: string | null;
  provisionalName: string | null;
  currentStage: string;
  currentStageDescription: string;
  status: string;
  disqualificationReason: string | null;
  lecturerPublicId: string;
  lecturerName: string;
  coLecturerPublicId: string | null;
  coLecturerName: string | null;
  histories: TopicTitleHistoryResponse[];
}

export interface TopicTitleSubmitRequest {
  newName: string;
}
```

---

### 5.3. Tạo Service gọi API: `src/features/outline_management/services/topicTitleService.ts`

```typescript
import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoints';
import { APIResponse } from '@/shared/types/api';
import {
  StudentTopicOverviewResponse,
  TopicTitleSubmitRequest,
} from '../types/topicTitle';

export const topicTitleService = {
  // Lấy thông tin đề tài và toàn bộ lịch sử
  getMyTopicOverview: async (semesterId?: string) => {
    const response = await apiClient.get<APIResponse<StudentTopicOverviewResponse>>(
      API_ENDPOINTS.topicTitle.overview,
      { params: { semesterId } }
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

### 5.4. React Hooks mẫu (sử dụng `@tanstack/react-query`)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { topicTitleService } from '../services/topicTitleService';
import { TopicTitleSubmitRequest } from '../types/topicTitle';

export const TOPIC_TITLE_KEYS = {
  overview: (semesterId?: string) => ['topic-title', 'overview', semesterId] as const,
};

// Hook lấy thông tin đề tài & lịch sử
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
    },
  });
};
```

---

## 6. Logic Hiển Thị Giao Diện Người Dùng (UI/UX Checklist)

Dựa vào dữ liệu trả về từ `GET /topic/my-title-history`, Frontend kiểm tra các điều kiện sau:

### 1. Trạng thái có yêu cầu đang chờ duyệt (`isPending`):
```typescript
const hasPendingRequest = topicData?.histories?.some(h => h.status === 'PENDING');
```
- **Nếu `hasPendingRequest === true`**:
  - Hiển thị badge màu vàng: **"Đang chờ GVHD duyệt tên đề tài"**.
  - **Khóa (Disable) hoặc ẩn** nút gửi tên mới để tránh người dùng click spam gây lỗi `3051 (TOPIC_TITLE_PENDING_EXISTS)`.

### 2. Form Chốt tên lần đầu (`/topic/confirm-title`):
- Hiển thị khi:
  ```typescript
  topicData?.currentStage === 'STAGE_1_ADVISOR_ASSIGNED' && !topicData?.officialName
  ```
- Tiêu đề Form: **"Chốt tên đề tài chính thức"**.
- Có thể gợi ý điền sẵn `provisionalName` (tên dự kiến lúc đăng ký GVHD nếu có) vào ô input để sinh viên tiện chỉnh sửa.

### 3. Form Đổi tên đề tài (`/topic/change-title`):
- Hiển thị khi:
  ```typescript
  topicData?.officialName != null && !hasPendingRequest
  ```
- Tiêu đề Form: **"Yêu cầu đổi tên đề tài"**.
- Validate trước khi submit: Tên mới không được trùng với `topicData.officialName`.

### 4. Đề tài bị đình chỉ (`DISQUALIFIED`):
- Khi `topicData?.status === 'DISQUALIFIED'`:
  - Hiển thị alert đỏ cảnh báo: *"Bạn đã bị dừng thực hiện đồ án trong học kỳ này. Lý do: {topicData.disqualificationReason}"*.
  - Khóa toàn bộ các thao tác gửi tên hoặc nộp bài.

