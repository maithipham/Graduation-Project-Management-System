# API sinh viên xem và sửa thông tin cá nhân

> Dùng cho màn **Trang cá nhân** của sinh viên (route `profile`): `src/features/profile_management`
> (`StudentProfilePage`, `ProfileContactModal`).
> Hiện màn này đang chạy **mock data** (`STUDENT_PROFILE_MOCK` + `localStorage` trong `services/profile.service.ts`).
> Tài liệu này mô tả 2 API thật và cách thay mock.

## 1. Tổng quan

| API | Method | URL | Dùng để |
|---|---|---|---|
| Xem thông tin | `GET` | `/student/my-info` | Hiển thị toàn bộ thông tin trên trang cá nhân |
| Sửa thông tin | `PUT` | `/student/my-info` | Popup "Sửa thông tin": sửa **Họ, Tên, Số điện thoại** |

| Mục | Giá trị |
|---|---|
| Header | `Authorization: Bearer <accessToken>` (interceptor đã tự gắn) |
| Role | Chỉ `STUDENT` (role khác → 403 / 2001) |
| Phân trang | Không |

**Sinh viên chỉ xem / sửa được thông tin của chính mình.** BE tự lấy tài khoản đang đăng nhập, FE **không** gửi mã
sinh viên hay `publicId`.

Thêm vào `src/shared/api/endpoints.ts` (trong nhóm `student`):

```ts
student: {
  // ...
  // GET: thông tin cá nhân + đề tài kỳ hiện tại · PUT: sửa Họ, Tên, Số điện thoại
  myInfo: '/student/my-info',
},
```

> Khác `auth.myInfo` (`/my-info`): API đó chỉ trả `name` + `roles` cho header / phân quyền. Trang cá nhân dùng
> `student.myInfo`. BE không có prefix `/api`.

---

## 2. GET `/student/my-info` — xem thông tin

Không có query param, không có body.

```
GET /student/my-info
```

### 2.1. Response thành công

**Đã có đề tài, GVHD và đồng hướng dẫn trong học kỳ hiện tại:**

```json
{
  "code": 1000,
  "data": {
    "topicName": "Xây dựng hệ thống quản lý đồ án tốt nghiệp",
    "lecturerName": "TS. Nguyễn Thu Thủy",
    "coLecturerName": "ThS. Trần Minh Khôi",
    "name": "Phạm Thị Mai",
    "studentCode": "2151060001",
    "batch": "K63",
    "className": "63CNTT1",
    "email": "maipham@gmail.com",
    "phone": "0912345678",
    "majorName": "Công nghệ phần mềm",
    "facultyName": "Khoa Công nghệ thông tin"
  }
}
```

**Chưa có đề tài trong học kỳ hiện tại (hoặc hệ thống chưa có học kỳ nào đang diễn ra):**

```json
{
  "code": 1000,
  "data": {
    "topicName": null,
    "lecturerName": null,
    "coLecturerName": null,
    "name": "Phạm Thị Mai",
    "studentCode": "2151060001",
    "batch": "K63",
    "className": "63CNTT1",
    "email": "maipham@gmail.com",
    "phone": "0912345678",
    "majorName": "Công nghệ phần mềm",
    "facultyName": "Khoa Công nghệ thông tin"
  }
}
```

> Các field `null` **vẫn có mặt** trong JSON (không bị lược bỏ). Không có `message` khi thành công.
> Trường hợp chưa có đề tài **không phải lỗi**: BE vẫn trả 200 / 1000 kèm đủ thông tin cá nhân.

### 2.2. Bảng field

| Field | Kiểu | Hiển thị | Ghi chú |
|---|---|---|---|
| `topicName` | string \| null | Tên đề tài | Đề tài của **học kỳ hiện tại**. `null` = chưa có đề tài kỳ này, hoặc đã có nhưng chưa chốt tên |
| `lecturerName` | string \| null | Giảng viên hướng dẫn | Đã kèm học hàm học vị (vd `TS. Nguyễn Thu Thủy`). `null` = chưa được phân công GVHD |
| `coLecturerName` | string \| null | Đồng hướng dẫn | Kèm học hàm học vị. `null` = không có GV đồng hướng dẫn |
| `name` | string | Họ và tên | Họ + Tên, đã ghép sẵn |
| `studentCode` | string | Mã sinh viên | 10 chữ số |
| `batch` | string | Khóa | Dạng `K63` |
| `className` | string | Lớp | |
| `email` | string | Email | **Không sửa được** |
| `phone` | string | Số điện thoại | 10 chữ số, bắt đầu bằng `0`, không có dấu cách |
| `majorName` | string | Bộ môn | Tên ngành |
| `facultyName` | string | Khoa | |

"Học kỳ hiện tại" = học kỳ có ngày hôm nay nằm trong khoảng bắt đầu – kết thúc; không có thì lấy học kỳ trạng thái
`ONGOING` (cùng quy tắc với `GET /semester/current`).

---

## 3. PUT `/student/my-info` — sửa thông tin

### 3.1. Request body

```json
{
  "firstName": "Phạm Thị",
  "lastName": "Mai",
  "phone": "0912345678"
}
```

| Field | Kiểu | Bắt buộc | Quy tắc (BE kiểm tra) |
|---|---|---|---|
| `firstName` | string | Có | **Họ và tên đệm**. Chỉ chữ cái tiếng Việt và khoảng trắng, tối đa 255 ký tự |
| `lastName` | string | Có | **Tên**, chỉ **1 từ**, chỉ chữ cái tiếng Việt |
| `phone` | string | Có | Đúng 10 chữ số, bắt đầu bằng `0` (regex `^0\d{9}$`), không dấu cách / dấu chấm |

- Luôn gửi **đủ 3 field** (field không sửa thì gửi lại giá trị cũ). Thiếu field / chuỗi rỗng → lỗi "không được để trống".
- BE tự chuẩn hóa trước khi kiểm tra: xóa ký tự ẩn, trim, gộp nhiều khoảng trắng thành 1.
- **Không gửi `email`**: sinh viên không được sửa email (BE bỏ qua nếu có gửi).
- Họ và Tên tách thành **2 ô nhập**, không gửi 1 chuỗi họ tên đầy đủ.

### 3.2. Response

API ghi dữ liệu nên **không có `data`**, chỉ có `code` + `message`.

| Trường hợp | HTTP | `code` | `message` |
|---|---|---|---|
| Sửa thành công | 200 | 1000 | `Đã cập nhật: Họ, Tên, Số điện thoại` (chỉ liệt kê các trường **thực sự thay đổi**) |
| Không có gì thay đổi | 200 | **1103** | `Thông tin sinh viên không thay đổi` |

```json
{ "code": 1000, "message": "Đã cập nhật: Số điện thoại" }
```

```json
{ "code": 1103, "message": "Thông tin sinh viên không thay đổi" }
```

> ⚠ **1103 là cảnh báo, không phải lỗi** (HTTP 200). Nhưng interceptor của FE coi mọi `code !== 1000` là lỗi:
> request sẽ **reject** với `ApiError` (`error.code === 1103`) và tự toast đỏ. Vì vậy request PUT phải gửi
> `skipErrorToast: true` và FE tự xử lý (xem mục 5.2, 5.3): 1103 → toast **vàng** (`toast.warning`) và đóng popup.

### 3.3. Lỗi validate

| HTTP | `code` | `message` | Khi nào |
|---|---|---|---|
| 400 | 4000 | `Họ không được để trống` | `firstName` rỗng |
| 400 | 4000 | `Họ không được chứa số và kí tự đặc biệt` | `firstName` có số / ký tự đặc biệt |
| 400 | 4000 | `Tên không được để trống` | `lastName` rỗng |
| 400 | 4000 | `Tên chỉ được chứa chữ cái` | `lastName` có số / ký tự đặc biệt / nhiều hơn 1 từ |
| 400 | 4000 | `Số điện thoại không được để trống` | `phone` rỗng |
| 400 | 4000 | `Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0` | `phone` sai định dạng |
| 400 | 4000 | `Họ, Tên và Số điện thoại không hợp lệ, vui lòng kiểm tra lại` | **≥ 2 trường** sai cùng lúc (liệt kê đúng các trường sai, vd `Họ và Số điện thoại ...`) |
| 409 | 3014 | `Số điện thoại trùng với tài khoản đã tồn tại trong hệ thống` | Số điện thoại đã thuộc tài khoản khác |

- Lỗi 1 trường → message của đúng lỗi đó; lỗi ≥ 2 trường → 1 message gộp tên các trường.
- Nên kiểm tra định dạng ở FE trước khi gửi (cùng quy tắc mục 3.1) để báo lỗi ngay dưới ô nhập; BE vẫn kiểm tra lại.

Regex gợi ý cho FE (khớp BE):

```ts
// Họ và tên đệm: các từ chữ cái, cách nhau 1 khoảng trắng
export const FIRST_NAME_REGEX = /^\p{Script=Latin}+( \p{Script=Latin}+)*$/u
// Tên: 1 từ chữ cái
export const LAST_NAME_REGEX = /^\p{Script=Latin}+$/u
// Số điện thoại: 10 số, bắt đầu bằng 0
export const PHONE_REGEX = /^0\d{9}$/
```

> Chuẩn hóa trước khi test regex: `value.normalize('NFC').trim().replace(/\s+/g, ' ')`.

---

## 4. Cách hiển thị đề xuất

### 4.1. Trang cá nhân

| Khu vực | Nhãn | Field | Khi `null` |
|---|---|---|---|
| Header | Tên + avatar | `name` (avatar: `profileService.computeProfileAvatar(name)`) | — |
| Thông tin học vụ | Mã sinh viên | `studentCode` | — |
| | Lớp | `className` | — |
| | Khóa | `batch` | — |
| | Bộ môn | `majorName` | — |
| | Khoa | `facultyName` | — |
| Thông tin đồ án *(thêm mới)* | Tên đề tài | `topicName` | "Chưa có tên đề tài" (chữ xám, nghiêng) |
| | Giảng viên hướng dẫn | `lecturerName` | "Chưa được phân công" |
| | Đồng hướng dẫn | `coLecturerName` | "Không có" |
| Thông tin liên hệ | Email | `email` | — |
| | Số điện thoại | `phone` | — |

- Có thể hiển thị số điện thoại dạng `0912 345 678` cho dễ đọc, nhưng khi **gửi lên BE** phải bỏ dấu cách.
- Nếu `topicName`, `lecturerName`, `coLecturerName` đều `null` → có thể gộp thành 1 dòng
  *"Bạn chưa có đề tài đồ án trong học kỳ này."*

### 4.2. Popup "Sửa thông tin" (`ProfileContactModal`)

- **3 ô nhập**: `Họ và tên đệm` (`firstName`), `Tên` (`lastName`), `Số điện thoại` (`phone`).
- **Bỏ ô Email** (sinh viên không được sửa email). Có thể hiện email dạng chỉ đọc nếu muốn.
- Giá trị ban đầu: GET chỉ trả `name` (đã ghép). Tách tạm theo **từ cuối cùng** = Tên, phần còn lại = Họ
  (đúng với quy tắc Tên chỉ 1 từ của BE):

```ts
// "Phạm Thị Mai" -> { firstName: "Phạm Thị", lastName: "Mai" }
export const splitFullName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts.at(-1) ?? '',
  }
}
```

- Bấm **Lưu thay đổi** → gọi PUT, nút chuyển trạng thái đang lưu (disable) tới khi có kết quả.
- Kết quả:

| Kết quả | Xử lý |
|---|---|
| 1000 | `toast.success(message)`, đóng popup, tải lại thông tin (mục 5.3) |
| 1103 | `toast.warning(message)`, đóng popup |
| 4000 / 3014 | **Giữ popup mở**, `toast.error(message)` (hoặc hiện message dưới form) để sinh viên sửa lại |
| Lỗi khác | `toast.error(message)` |

### 4.3. Khác biệt so với mock cũ

| Mock cũ (`StudentProfileData`) | Dữ liệu thật |
|---|---|
| `name` | `name` |
| `mssv` | `studentCode` |
| `className` | `className` |
| `department` | `majorName` |
| `faculty` | `facultyName` |
| `academicYear` ("2021 - 2025", nhãn "Niên khóa") | `batch` ("K63") → đổi nhãn thành **"Khóa"** |
| `status` ("Đang làm đồ án tốt nghiệp") | **BE không trả** → bỏ |
| `email` | `email` (chỉ đọc) |
| `phone` | `phone` |
| `mentor` | `lecturerName` |
| — | `coLecturerName` (mới) |
| `topic` (đọc từ `localStorage`) | `topicName` |
| Lưu `name/email/phone` vào `localStorage` | `PUT /student/my-info` với `firstName/lastName/phone` |

---

## 5. Mapping code

### 5.1. Types — `types/profile.types.ts`

```ts
// Response của GET /student/my-info
export interface StudentMyInfoResponse {
  topicName: string | null
  lecturerName: string | null
  coLecturerName: string | null
  name: string
  studentCode: string
  batch: string
  className: string
  email: string
  phone: string
  majorName: string
  facultyName: string
}

// Body của PUT /student/my-info
export interface StudentMyInfoUpdateRequest {
  firstName: string // Họ và tên đệm
  lastName: string // Tên (1 từ)
  phone: string // 10 số, bắt đầu bằng 0
}
```

> Xóa `StudentProfileData` sau khi các component đã chuyển sang `StudentMyInfoResponse`.

### 5.2. Service — `services/profile.service.ts`

```ts
import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { StudentMyInfoResponse, StudentMyInfoUpdateRequest } from '../types/profile.types'

export const profileService = {
  getMyInfo: async () => {
    const res = await apiClient.get<ApiResponse<StudentMyInfoResponse>>(API_ENDPOINTS.student.myInfo)
    return res.data.data
  },

  // Trả { code, message }: 1000 = đã cập nhật. 1103 (không thay đổi) bị interceptor reject thành ApiError
  updateMyInfo: async (body: StudentMyInfoUpdateRequest) => {
    const res = await apiClient.put<ApiResponse<void>>(API_ENDPOINTS.student.myInfo, body, {
      // Tự hiện toast theo từng code (1103 là cảnh báo vàng, không phải lỗi đỏ)
      skipErrorToast: true,
    })
    return res.data
  },

  // Giữ lại: tính chữ viết tắt cho avatar
  computeProfileAvatar: (fullName: string): string => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean)
    return parts
      .slice(-2)
      .map((word) => word[0]?.toUpperCase() ?? '')
      .join('')
  },
}
```

> Xóa `loadInitialProfile`, `getHasCustomName`, `saveProfileContact`, `PROFILE_CONTACT_STORAGE_KEY`
> (mock + `localStorage`).

### 5.3. Hook — `hooks/useProfileManagement.ts` (React Query, bỏ zustand store)

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authKeys } from '@/features/auth'
import { toast } from '@/shared/components/feedback/toast.store'
import { isApiError } from '@/shared/types'
import { profileService } from '../services/profile.service'
import type { StudentMyInfoUpdateRequest } from '../types/profile.types'

export const studentProfileKeys = {
  myInfo: ['student', 'my-info'] as const,
}

export function useStudentMyInfo() {
  return useQuery({
    queryKey: studentProfileKeys.myInfo,
    queryFn: profileService.getMyInfo,
  })
}

// onDone: đóng popup khi thành công hoặc không có gì thay đổi
export function useUpdateStudentMyInfo(onDone?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: StudentMyInfoUpdateRequest) => profileService.updateMyInfo(body),
    onSuccess: (res) => {
      toast.success(res.message)
      // Tải lại trang cá nhân + tên trên header (header dùng GET /my-info)
      queryClient.invalidateQueries({ queryKey: studentProfileKeys.myInfo })
      queryClient.invalidateQueries({ queryKey: authKeys.myInfo })
      onDone?.()
    },
    onError: (error) => {
      if (isApiError(error) && error.code === 1103) {
        toast.warning(error.message)
        onDone?.()
        return
      }
      // 4000 / 3014 / lỗi khác: giữ popup để sinh viên sửa lại
      toast.error(isApiError(error) ? error.message : 'Cập nhật thất bại. Vui lòng thử lại.')
    },
  })
}
```

> `store/profile.store.ts` không còn cần (dữ liệu lấy từ server), có thể xóa.
> `isApiError` đã có sẵn trong `@/shared/types` (đang dùng ở `RequireAuth.tsx`).

### 5.4. Page — `pages/StudentProfilePage.tsx`

```tsx
const { data: profile, isPending, isError, refetch } = useStudentMyInfo()
const [isEditOpen, setIsEditOpen] = useState(false)
const updateMutation = useUpdateStudentMyInfo(() => setIsEditOpen(false))

if (isPending) return /* skeleton */ null
if (isError) return <ErrorState text="Không tải được thông tin cá nhân." onRetry={() => refetch()} />

// ... hiển thị theo mục 4.1

<ProfileContactModal
  isOpen={isEditOpen}
  onClose={() => setIsEditOpen(false)}
  isSaving={updateMutation.isPending}
  initialValues={{ ...splitFullName(profile.name), phone: profile.phone }}
  onSave={(body) => updateMutation.mutate(body)}
/>
```

- Bỏ `useMyInfo()` của `auth` và cờ `hasCustomName`: tên lấy thẳng `profile.name`.
- Bỏ toast tự viết trong page (`toastMsg`), dùng `toast` chung như hook ở mục 5.3.
- `ErrorState` là tên minh họa — dùng component trạng thái lỗi sẵn có trong `shared/components` nếu có.

### 5.5. Component — `components/ProfileContactModal.tsx`

Các điểm cần sửa:

- Props: `initialValues: StudentMyInfoUpdateRequest`, `onSave: (body: StudentMyInfoUpdateRequest) => void`,
  thêm `isSaving: boolean` để disable nút **Lưu thay đổi**.
- Thay ô "Họ và tên" bằng 2 ô **Họ và tên đệm** / **Tên**; bỏ ô "Email liên hệ".
- Bỏ fallback `editX.trim() || initialValues.x` (đang tự lấy lại giá trị cũ khi để trống, làm sinh viên không biết
  mình nhập thiếu). Gửi đúng giá trị đã chuẩn hóa, để trống thì báo lỗi.
- Reset form về `initialValues` mỗi lần mở popup (state hiện tại chỉ khởi tạo 1 lần).
- Số điện thoại: bỏ hết dấu cách trước khi gửi (`phone.replace(/\s/g, '')`).

---

## 6. Lỗi chung có thể gặp (cả 2 API)

| HTTP | `code` | Message (BE) | Khi nào | FE xử lý |
|---|---|---|---|---|
| 401 | 2000 | Phiên đăng nhập của bạn đã hết hạn | Thiếu / hết hạn token | Theo luồng refresh / đăng nhập lại chung |
| 403 | 2001 | Bạn không có quyền truy cập (access denied) | Tài khoản không phải sinh viên | Không xảy ra ở app sinh viên |
| 404 | 3008 | Sinh viên không tồn tại | Tài khoản có role `STUDENT` nhưng chưa có hồ sơ sinh viên (dữ liệu lỗi) — chỉ GET | Hiện lỗi, đề nghị liên hệ quản trị |
| 404 | 4000 | Tài khoản của bạn không tồn tại | Tài khoản bị khóa / không còn | Theo luồng đăng nhập lại |
| 400 | 1006 | Yêu cầu không hợp lệ | PUT gửi body không phải JSON / sai kiểu | Kiểm tra body |
| 404 | 1005 | — | Sai URL | Kiểm tra `endpoints.ts` |
| 500 | 1001 | — | Lỗi hệ thống | Hiện lỗi chung + nút thử lại |

Lỗi trả về dạng:

```json
{ "code": 3014, "message": "Số điện thoại trùng với tài khoản đã tồn tại trong hệ thống" }
```

## 7. Ghi chú

- Sau khi sửa Họ / Tên, tên trên **header** (lấy từ `GET /my-info`) cũng đổi → nhớ invalidate `authKeys.myInfo`
  (mục 5.3).
- Thông tin đề tài / GVHD / đồng hướng dẫn chỉ của **học kỳ hiện tại**; API không nhận `semesterId`.
  Lịch sử các kỳ xem ở `student.registrationOverview`.
- `topicName`, `lecturerName`, `coLecturerName` có thể đổi khi TBM phân công / đổi GVHD hoặc sinh viên đổi tên đề tài
  → không cache lâu ở FE (mặc định React Query là đủ).
- Mã sinh viên, lớp, khóa, bộ môn, khoa, email: sinh viên **không** sửa được, chỉ TBM / Admin sửa.
- Chưa test end-to-end với FE.
