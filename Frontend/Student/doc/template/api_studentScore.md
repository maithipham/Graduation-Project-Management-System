# API sinh viên xem điểm đồ án

> Dùng cho màn **Kết quả** của sinh viên (route `results`): `src/features/score_management` (`StudentResultsPage`, `ScoreResultCard`).
> Hiện màn này đang chạy **mock data** (`STUDENT_RESULTS_DATA` trong `services/score.service.ts`). Tài liệu này mô tả API thật và cách thay mock.

## 1. Tổng quan

| Mục | Giá trị |
|---|---|
| Method | `GET` |
| URL | `/thesis-score/my-score` |
| Header | `Authorization: Bearer <accessToken>` (interceptor đã tự gắn) |
| Role | Chỉ `STUDENT` (role khác → 403 / 2001) |
| Phân trang | Không. Mỗi lần gọi trả **1 đề tài của 1 học kỳ** |

**Sinh viên chỉ thấy điểm của chính mình.** BE tự lấy tài khoản đang đăng nhập, FE **không** gửi mã sinh viên hay id đề tài.

**Sinh viên thấy gì:**
- 3 điểm nhóm: **Hướng dẫn (HD)**, **Phản biện (PB)**, **Hội đồng (HĐ)**.
- **Điểm tổng kết**.

> Hệ thống **không có trọng số** cho 3 điểm nhóm. Điểm tổng kết là trung bình cộng điểm của GVHD, 2 cán bộ phản biện
> và các thành viên hội đồng bảo vệ (QĐ1305), BE tự tính.

**Sinh viên KHÔNG thấy:** điểm từng tiêu chí, điểm từng phiếu chấm (ví dụ PB1 / PB2 riêng), nhận xét của giảng viên, tên người chấm.

Thêm vào `src/shared/api/endpoints.ts` (trong nhóm `student`):

```ts
student: {
  // ...
  // Điểm đồ án của sinh viên đang đăng nhập (HD / PB / HĐ + tổng kết)
  myScore: '/thesis-score/my-score',
},
```

> Endpoint cũ `results: '/api/student/results'` **không tồn tại** ở BE, có thể xóa.
> BE không có prefix `/api`.

## 2. Query params

| Param | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `semesterId` | string (UUID) | Không | `publicId` của học kỳ. **Không gửi = học kỳ đang diễn ra** |

- "Học kỳ đang diễn ra" = học kỳ có ngày hôm nay nằm trong khoảng bắt đầu – kết thúc; không có thì lấy học kỳ trạng thái `ONGOING`.
- Không gửi param rỗng (`semesterId=''`) → bỏ hẳn param.
- `semesterId` không phải UUID → **400 / 1006**.

Ví dụ:

```
GET /thesis-score/my-score
GET /thesis-score/my-score?semesterId=0192f3a1-7c2e-7b44-9a51-3c8e2d1f0a77
```

### Nếu muốn có ô chọn học kỳ

Sinh viên gọi được 2 API học kỳ sẵn có (đã khai báo trong `endpoints.ts` nhóm `semester`):

| API | Dùng để |
|---|---|
| `GET /semester/current` | Lấy học kỳ hiện tại (để chọn sẵn trong dropdown) |
| `GET /semester?page=0&size=50` | Danh sách học kỳ (phân trang, field `publicId`, `name`, `statusCode`…) |

Lưu ý: chọn học kỳ mà sinh viên **không có đề tài** → BE trả **404 / 3049** (xem mục 6). Màn hiện tại chỉ có 1 thẻ kết quả, nên **cách đơn giản nhất là gọi không kèm `semesterId`** (kỳ hiện tại), chưa cần dropdown.

## 3. Response thành công

### 3.1. Đã có đủ điểm

```json
{
  "code": 1000,
  "data": {
    "semesterPublicId": "0192f3a1-7c2e-7b44-9a51-3c8e2d1f0a77",
    "semesterName": "Học kỳ 1 năm học 2026-2027",
    "topicPublicId": "0192f3b8-1d40-7e21-8c6a-5b9f4e2a1c03",
    "topicName": "Xây dựng hệ thống quản lý đồ án tốt nghiệp",
    "advisorScore": 8.5,
    "examinerScore": 8.3,
    "examinerPassed": true,
    "councilScore": 8.0,
    "finalScore": 8.2
  }
}
```

### 3.2. Mới có điểm Hướng dẫn (chưa đủ phiếu phản biện / hội đồng)

```json
{
  "code": 1000,
  "data": {
    "semesterPublicId": "0192f3a1-7c2e-7b44-9a51-3c8e2d1f0a77",
    "semesterName": "Học kỳ 1 năm học 2026-2027",
    "topicPublicId": "0192f3b8-1d40-7e21-8c6a-5b9f4e2a1c03",
    "topicName": "Xây dựng hệ thống quản lý đồ án tốt nghiệp",
    "advisorScore": 8.5,
    "examinerScore": null,
    "examinerPassed": null,
    "councilScore": null,
    "finalScore": null
  }
}
```

### 3.3. Chưa có điểm nào

```json
{
  "code": 1000,
  "data": {
    "semesterPublicId": "0192f3a1-7c2e-7b44-9a51-3c8e2d1f0a77",
    "semesterName": "Học kỳ 1 năm học 2026-2027",
    "topicPublicId": "0192f3b8-1d40-7e21-8c6a-5b9f4e2a1c03",
    "topicName": "Xây dựng hệ thống quản lý đồ án tốt nghiệp",
    "advisorScore": null,
    "examinerScore": null,
    "examinerPassed": null,
    "councilScore": null,
    "finalScore": null
  }
}
```

> Các field `null` **vẫn có mặt** trong JSON (không bị lược bỏ). Không có `message` khi thành công.

### 3.4. Bảng field

| Field | Kiểu | Ghi chú |
|---|---|---|
| `semesterPublicId` | string (UUID) | Học kỳ của kết quả (khi không gửi `semesterId` thì đây là kỳ hiện tại) |
| `semesterName` | string | Hiển thị thẳng (vd badge "HK1 2026-2027") |
| `topicPublicId` | string (UUID) | Dùng làm `key` |
| `topicName` | string \| null | Tên đề tài; có thể `null` nếu sinh viên chưa chốt tên đề tài |
| `advisorScore` | number \| null | Điểm Hướng dẫn, thang 10, **1 chữ số thập phân**. `null` = GVHD chưa nộp phiếu |
| `examinerScore` | number \| null | Điểm Phản biện = trung bình **2 phiếu** phản biện, 1 chữ số thập phân. `null` = chưa đủ 2 phiếu |
| `examinerPassed` | boolean \| null | `true` khi điểm PB ≥ 5.0; `false` khi < 5.0; `null` khi chưa có điểm PB |
| `councilScore` | number \| null | Điểm Hội đồng = trung bình **5 phiếu** hội đồng, 1 chữ số thập phân. `null` = chưa đủ 5 phiếu |
| `finalScore` | number \| null | Điểm tổng kết theo QĐ1305, 1 chữ số thập phân. `null` = chưa có kết quả bảo vệ (chưa đủ điểm) |

**Cách BE tính (FE không cần tính lại, chỉ hiển thị):**

```
finalScore = round1( trung bình cộng điểm cá nhân của GVHD, 2 cán bộ phản biện và các thành viên hội đồng )
```

- Theo QĐ1305 – Điều 9.1. **Không có trọng số**, BE (phần bảo vệ) tính và ghi khi đủ điểm.
- Làm tròn 1 chữ số kiểu HALF_UP (8.25 → 8.3).
- Điểm chỉ được tính từ **phiếu đã nộp chính thức**. Phiếu giảng viên đang lưu nháp không ảnh hưởng điểm sinh viên thấy.

> ⚠ **Không tự tính `finalScore` ở FE** (mock cũ đang `reduce` theo trọng số). `finalScore` là trung bình điểm **từng
> giảng viên**, FE không có đủ dữ liệu để tính (chỉ có 3 điểm nhóm). Luôn hiển thị `finalScore` của BE.

## 4. Cách hiển thị đề xuất

### 4.1. Bảng 3 dòng

| Loại điểm | Điểm | Ghi chú |
|---|---|---|
| Hướng dẫn | `advisorScore` | — |
| Phản biện | `examinerScore` | Kèm nhãn từ `examinerPassed` |
| Hội đồng | `councilScore` | — |

- Điểm `null` → hiện **"Chưa có điểm"** (chữ xám, nghiêng), **không** hiện `0`.
- `examinerPassed`: `true` → nhãn xanh "PB ≥ 5.0"; `false` → nhãn đỏ "PB < 5.0"; `null` → không hiện nhãn.

### 4.2. Điểm tổng kết

| Trường hợp | Hiển thị |
|---|---|
| `finalScore !== null` | Số to, `finalScore.toFixed(1)` |
| `finalScore === null` | "Chưa có điểm tổng kết" + dòng phụ: *Chờ đủ điểm Hướng dẫn, Phản biện và Hội đồng.* |

> BE **không trả** cờ "Đạt / Chưa đạt" cho điểm tổng kết. Nhãn "Đạt / Chưa đạt" (≥ 5.0) trong mock cũ là FE tự đặt; nếu muốn giữ, cần xác nhận lại quy định với nhóm nghiệp vụ. Tài liệu này đề xuất **bỏ** nhãn đó cho tới khi BE có cờ chính thức.

### 4.3. Khác biệt so với mock cũ

| Mock cũ (`StudentSemesterScoreCard`) | Dữ liệu thật |
|---|---|
| `semesterKey` | `semesterName` |
| `courseName` ("Đồ án tốt nghiệp") | BE không trả → để chữ cố định "Đồ án tốt nghiệp" |
| `className` | **BE không trả** → bỏ dòng "Lớp", thay bằng "Đề tài: `topicName`" |
| `rows[]` (4 dòng, PB1 / PB2 tách riêng) | 3 dòng HD / PB / HĐ, PB là điểm trung bình |
| `row.comment` (nhận xét) | **BE không trả** → bỏ cột "Nhận xét" |
| `totalScore` (FE tự tính theo trọng số) | `finalScore` (BE tính, không trọng số) |
| Cột "Trọng số" | **Bỏ** (hệ thống không có trọng số 3 điểm nhóm) |
| Mảng nhiều kỳ | Mỗi lần gọi 1 kỳ |

## 5. Mapping code

### 5.1. Types — `types/score.types.ts`

```ts
// Response của GET /thesis-score/my-score
export interface StudentScoreResponse {
  semesterPublicId: string
  semesterName: string
  topicPublicId: string
  topicName: string | null
  advisorScore: number | null
  examinerScore: number | null
  examinerPassed: boolean | null
  councilScore: number | null
  finalScore: number | null
}

// Một dòng của bảng điểm (dùng cho UI)
export interface StudentScoreRow {
  key: 'advisor' | 'examiner' | 'council'
  label: string // 'Hướng dẫn' | 'Phản biện' | 'Hội đồng'
  score: number | null
  passed?: boolean | null // chỉ dòng Phản biện
}
```

### 5.2. Service — `services/score.service.ts`

```ts
import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { StudentScoreResponse, StudentScoreRow } from '../types/score.types'

// Chuyển response thành 3 dòng của bảng điểm
export const toScoreRows = (s: StudentScoreResponse): StudentScoreRow[] => [
  { key: 'advisor', label: 'Hướng dẫn', score: s.advisorScore },
  {
    key: 'examiner',
    label: 'Phản biện',
    score: s.examinerScore,
    passed: s.examinerPassed,
  },
  { key: 'council', label: 'Hội đồng', score: s.councilScore },
]

export const scoreService = {
  // Không truyền semesterId = học kỳ hiện tại
  getMyScore: async (semesterId?: string) => {
    const res = await apiClient.get<ApiResponse<StudentScoreResponse>>(API_ENDPOINTS.student.myScore, {
      params: semesterId ? { semesterId } : undefined,
      // 3049 (chưa có đề tài) / 3022 (chưa có học kỳ) là trạng thái bình thường → hiện trong trang, không toast đỏ
      skipErrorToast: true,
    })
    return res.data.data
  },
}
```

> Xóa `STUDENT_RESULTS_DATA` và `scoreService.getResults()` (mock).

### 5.3. Hook — `hooks/useScoreManagement.ts` (React Query, bỏ zustand store)

```ts
import { useQuery } from '@tanstack/react-query'
import { scoreService } from '../services/score.service'

export const studentScoreKeys = {
  myScore: (semesterId?: string) => ['student', 'my-score', semesterId ?? 'current'] as const,
}

export function useMyScore(semesterId?: string) {
  return useQuery({
    queryKey: studentScoreKeys.myScore(semesterId),
    queryFn: () => scoreService.getMyScore(semesterId),
    retry: false, // lỗi 3049 / 3022 không cần thử lại
  })
}
```

> `store/score.store.ts` không còn cần (dữ liệu lấy từ server), có thể xóa.

### 5.4. Page — `pages/StudentResultsPage.tsx`

```tsx
import { isAxiosError } from 'axios'
import { ScoreResultCard } from '../components/ScoreResultCard'
import { useMyScore } from '../hooks/useScoreManagement'

// Lấy code lỗi BE trong body response
const getErrorCode = (error: unknown) =>
  isAxiosError<{ code?: number }>(error) ? error.response?.data?.code : undefined

export default function StudentResultsPage() {
  const { data, isPending, isError, error, refetch } = useMyScore()

  if (isPending) return /* skeleton thẻ kết quả */ null

  if (isError) {
    const code = getErrorCode(error)
    if (code === 3049) return <EmptyState text="Bạn chưa có đề tài đồ án trong học kỳ này." />
    if (code === 3022) return <EmptyState text="Hiện chưa có học kỳ nào đang diễn ra." />
    return <ErrorState text="Không tải được kết quả. Vui lòng thử lại." onRetry={() => refetch()} />
  }

  return (
    <div className="max-w-7xl w-full mx-auto space-y-6">
      <ScoreResultCard item={data} />
    </div>
  )
}
```

> `EmptyState` / `ErrorState` là tên minh họa — dùng component trạng thái rỗng / lỗi sẵn có trong `shared/components` nếu có.

### 5.5. Component — `components/ScoreResultCard.tsx`

Các điểm cần sửa:

- Prop `item: StudentScoreResponse` (thay `StudentSemesterScoreCard`).
- Bỏ `reduce` tính `totalScore`; hiển thị `item.finalScore` theo mục 4.2.
- Bỏ dòng "Lớp", thay bằng "Đề tài: `item.topicName ?? 'Chưa có tên đề tài'`".
- Badge kỳ: `item.semesterName`.
- Bảng: dùng `toScoreRows(item)`, 2 cột **Loại điểm / Điểm**; bỏ cột "Điểm thành phần" và "Nhận xét", bỏ logic `rowSpan` (mỗi loại chỉ 1 dòng).
- Hàm hiển thị gợi ý:

```ts
const formatScore = (score: number | null) => (score === null ? null : score.toFixed(1))
```

```tsx
<td className="py-3.5 px-4 font-bold text-slate-900">
  {formatScore(row.score) ?? <span className="font-normal italic text-slate-400">Chưa có điểm</span>}
</td>
```

## 6. Lỗi có thể gặp

| HTTP | `code` | Message (BE) | Khi nào | FE xử lý |
|---|---|---|---|---|
| 401 | 2000 | Phiên đăng nhập của bạn đã hết hạn | Thiếu / hết hạn token | Theo luồng refresh / đăng nhập lại chung |
| 403 | 2001 | Bạn không có quyền truy cập (access denied) | Tài khoản không phải sinh viên | Không xảy ra ở app sinh viên |
| 404 | 3049 | Không tìm thấy đề tài đồ án | Sinh viên **chưa có đề tài** trong học kỳ đó | Trạng thái rỗng "Bạn chưa có đề tài đồ án trong học kỳ này" |
| 400 | 3022 | Vui lòng chọn học kỳ | Không gửi `semesterId` và hệ thống **không có học kỳ đang diễn ra** | Trạng thái rỗng "Hiện chưa có học kỳ nào đang diễn ra" (hoặc cho chọn kỳ) |
| 404 | 4041 | Không tìm thấy học kỳ yêu cầu | `semesterId` không tồn tại | Báo lỗi, quay về kỳ hiện tại |
| 400 | 1006 | Yêu cầu không hợp lệ | `semesterId` không phải UUID | Chỉ gửi `publicId` lấy từ API học kỳ |
| 404 | 1005 | — | Sai URL | Kiểm tra `endpoints.ts` |
| 500 | 1001 | — | Lỗi hệ thống | Hiện lỗi chung + nút thử lại |

Lỗi trả về dạng:

```json
{ "code": 3049, "message": "Không tìm thấy đề tài đồ án" }
```

Vì request có `skipErrorToast: true`, interceptor **không** tự hiện toast. FE tự hiện lỗi trong trang theo bảng trên.

## 7. Ghi chú

- **Khi nào điểm xuất hiện:**
  - `advisorScore`: ngay khi GVHD **nộp** phiếu chấm hướng dẫn.
  - `examinerScore`: khi đủ **2 phiếu** phản biện đã nộp.
  - `councilScore`: khi đủ **5 phiếu** hội đồng đã nộp.
  - `finalScore`: khi phần bảo vệ đã có kết quả (đủ phiếu theo QĐ1305).
- Điểm có thể **thay đổi** sau khi đã hiển thị: GVHD được nộp lại phiếu hướng dẫn tới hết mốc Tổ chức hội đồng bảo vệ, khi đó BE cập nhật `advisorScore` và tính lại `finalScore`. Không cache lâu ở FE (mặc định React Query là đủ; có thể `refetchOnWindowFocus`).
- API chỉ **đọc**, sinh viên không có API sửa / khiếu nại điểm.
- Chưa test end-to-end với FE.
