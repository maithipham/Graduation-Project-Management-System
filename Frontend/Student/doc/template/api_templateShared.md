# API danh sách tài liệu / biểu mẫu cho sinh viên

> Dùng cho màn **Tài liệu & biểu mẫu** của sinh viên: `src/features/template_management` (`StudentDocumentsPage`, `DocumentTemplateTable`).
> Hiện màn này đang chạy **mock data** (`TEMPLATE_DOCUMENTS_DATA` trong `services/template.service.ts`). Tài liệu này mô tả API thật và cách thay mock.

## 1. Tổng quan

| Mục | Giá trị |
|---|---|
| Method | `GET` |
| URL | `/template/shared` |
| Header | `Authorization: Bearer <accessToken>` (interceptor đã tự gắn) |
| Role | Mọi tài khoản đã đăng nhập (không có lỗi 403) |
| Phân trang | Có (`page` bắt đầu từ **0**) |
| Sắp xếp mặc định | `updatedAt,desc` (mới cập nhật lên đầu) |

**API chỉ trả về 3 loại tài liệu:**

| `fileType` | `fileTypeName` |
|---|---|
| `OUTLINE` | Đề cương |
| `FINAL_REPORT` | Báo cáo toàn văn |
| `DEFENSE_PRESENTATION` | Slide bảo vệ |

Các loại khác (Tài liệu mẫu, Phiếu nhận xét, Báo cáo tiến độ, Minh chứng, Tệp khác…) **không bao giờ** xuất hiện trong kết quả.

Thêm vào `src/shared/api/endpoints.ts` (trong nhóm `student`):

```ts
student: {
  // ...
  // Danh sách tài liệu / biểu mẫu sinh viên được xem và tải
  templates: '/template/shared',
},
```

> Endpoint cũ `documents: '/student/documents'` **không tồn tại** ở BE, có thể xóa.
> BE không có prefix `/api` trong đường dẫn — cấu hình theo cùng cách với các API đang chạy được như `/login`, `/my-info`.

## 2. Query params

| Param | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `keyword` | string | Không | Tìm theo **tên tài liệu**, không phân biệt hoa thường, chứa chuỗi. Rỗng / toàn khoảng trắng = không lọc. BE tự `trim()` |
| `fileType` | enum | Không | `OUTLINE` \| `FINAL_REPORT` \| `DEFENSE_PRESENTATION`. Không gửi = cả 3 loại |
| `page` | number | Không | Trang, bắt đầu từ `0`. Mặc định `0` |
| `size` | number | Không | Số bản ghi / trang. Mặc định `10` |
| `sort` | string | Không | `field,asc` hoặc `field,desc`. Field hợp lệ: `fileName`, `fileType`, `fileSize`, `updatedAt`. **Field khác → lỗi 500** |

Lưu ý:
- Gửi `fileType` là loại hợp lệ của hệ thống nhưng **không thuộc 3 loại trên** (vd `TEMPLATE`, `ATTACHMENT`) → BE trả **trang rỗng** (`code: 1000`, `content: []`), không báo lỗi.
- Gửi `fileType` không tồn tại (vd `abc`, hoặc gửi nhãn tiếng Việt `Đề cương`) → **400 / 1006**. Luôn gửi **mã enum**, không gửi nhãn.
- Ký tự `%` và `_` trong `keyword` đang được hiểu là ký tự đại diện (wildcard).
- Không gửi param rỗng (`keyword=''`, `fileType=''`) — bỏ hẳn param đó.

Ví dụ:

```
GET /template/shared?keyword=de%20cuong&fileType=OUTLINE&page=0&size=10&sort=updatedAt,desc
```

## 3. Response thành công

```json
{
  "code": 1000,
  "data": {
    "totalElements": 3,
    "totalPages": 1,
    "page": 0,
    "size": 10,
    "content": [
      {
        "publicId": "3f1c2a7e-9b1d-4c55-8a3e-2f7d6c1b0a91",
        "fileName": "Mẫu đề cương chi tiết đồ án",
        "fileUrl": "https://res.cloudinary.com/.../mau_de_cuong.docx",
        "fileType": "OUTLINE",
        "fileTypeName": "Đề cương",
        "fileSize": 143360,
        "fileSizeText": "140.0 KB",
        "updatedAt": "05-11-2026 14:20:31",
        "uploadedByName": "Nguyễn Văn A"
      }
    ]
  }
}
```

| Field | Kiểu | Ghi chú |
|---|---|---|
| `publicId` | string (UUID) | Dùng làm `key` và id chọn dòng |
| `fileName` | string | Tên tài liệu hiển thị |
| `fileUrl` | string | Link Cloudinary, mở trực tiếp để xem / tải |
| `fileType` | enum | Mã loại |
| `fileTypeName` | string | Nhãn tiếng Việt, hiển thị thẳng |
| `fileSize` | number | Byte |
| `fileSizeText` | string | Đã format sẵn (KB / MB), hiển thị thẳng |
| `updatedAt` | string | Định dạng `dd-MM-yyyy HH:mm:ss` (**không phải ISO**, không đưa thẳng vào `new Date()`) |
| `uploadedByName` | string \| null | Họ tên người tải lên |

Không có `message` khi thành công.

### ⚠ Dạng phân trang khác `SpringPage`

`data` **không** phải `SpringPage<T>` trong `src/shared/types/pagination.ts`:

| `SpringPage` (FE đang khai báo) | BE thực tế trả về |
|---|---|
| `number` | `page` |
| `numberOfElements`, `first`, `last`, `empty` | **không có** |

→ Khai báo type riêng (mục 4), **không** ép kiểu sang `SpringPage`.

## 4. Mapping code

### 4.1. Types — `types/template.types.ts`

Type mock cũ → field thật:

| Mock cũ (`TemplateDocumentItem`) | Dữ liệu thật |
|---|---|
| `id: number` | `publicId: string` |
| `title` | `fileName` |
| `type` (`'Mẫu báo cáo'`…) | `fileTypeName` |
| `category` (`'report'`…) | `fileType` |
| `size` | `fileSizeText` |
| `extension` / `format` / `iconColor` | Tự tính từ đuôi của `fileUrl` (BE không trả) |

```ts
export type StudentTemplateFileType = 'OUTLINE' | 'FINAL_REPORT' | 'DEFENSE_PRESENTATION'

export interface TemplateFileResponse {
  publicId: string
  fileName: string
  fileUrl: string
  fileType: StudentTemplateFileType
  fileTypeName: string
  fileSize: number
  fileSizeText: string
  updatedAt: string // dd-MM-yyyy HH:mm:ss
  uploadedByName: string | null
}

// Dạng phân trang BE trả về (PageResponse)
export interface PageResponse<T> {
  totalElements: number
  totalPages: number
  page: number // 0-based
  size: number
  content: T[]
}

export interface TemplateQuery {
  keyword?: string
  fileType?: StudentTemplateFileType | ''
  page?: number
  size?: number
  sort?: string
}

// Item dùng cho bảng (giữ gần giống mock cũ để ít sửa UI)
export interface TemplateDocumentItem {
  id: string // = publicId
  title: string // = fileName
  type: string // = fileTypeName
  fileType: StudentTemplateFileType
  size: string // = fileSizeText
  extension: string // vd '.DOCX', tính từ fileUrl
  format: string // vd 'docx'
  iconColor: 'blue' | 'red'
  fileUrl: string
  updatedAt: string
}
```

### 4.2. Danh sách lựa chọn loại (thay `TEMPLATE_DOCUMENT_TYPES`)

Dropdown "Tất cả loại biểu mẫu" chỉ có 3 lựa chọn; `value` là **mã enum**:

```ts
export const TEMPLATE_FILE_TYPE_OPTIONS: { value: StudentTemplateFileType; label: string }[] = [
  { value: 'OUTLINE', label: 'Đề cương' },
  { value: 'FINAL_REPORT', label: 'Báo cáo toàn văn' },
  { value: 'DEFENSE_PRESENTATION', label: 'Slide bảo vệ' },
]
```

```tsx
<option value="">Tất cả loại biểu mẫu</option>
{TEMPLATE_FILE_TYPE_OPTIONS.map((t) => (
  <option key={t.value} value={t.value}>{t.label}</option>
))}
```

> Các loại mock cũ ("Mẫu báo cáo", "Phiếu đánh giá", "Quy chế", "Biên bản") BE **không có** → bỏ.

### 4.3. Service — `services/template.service.ts`

```ts
import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type {
  PageResponse,
  TemplateDocumentItem,
  TemplateFileResponse,
  TemplateQuery,
} from '../types/template.types'

// Lấy đuôi file từ URL Cloudinary
const getExtension = (url: string) => {
  const clean = url.split('?')[0]
  const dot = clean.lastIndexOf('.')
  return dot > clean.lastIndexOf('/') ? clean.slice(dot + 1).toLowerCase() : ''
}

export const toTemplateItem = (f: TemplateFileResponse): TemplateDocumentItem => {
  const ext = getExtension(f.fileUrl)
  return {
    id: f.publicId,
    title: f.fileName,
    type: f.fileTypeName,
    fileType: f.fileType,
    size: f.fileSizeText,
    extension: ext ? `.${ext.toUpperCase()}` : '',
    format: ext,
    iconColor: ext === 'pdf' ? 'red' : 'blue',
    fileUrl: f.fileUrl,
    updatedAt: f.updatedAt,
  }
}

export const templateService = {
  getTemplates: async (query: TemplateQuery = {}) => {
    const params: Record<string, string | number> = {
      page: query.page ?? 0,
      size: query.size ?? 10,
      sort: query.sort ?? 'updatedAt,desc',
    }
    const keyword = query.keyword?.trim()
    if (keyword) params.keyword = keyword
    if (query.fileType) params.fileType = query.fileType

    const res = await apiClient.get<ApiResponse<PageResponse<TemplateFileResponse>>>(
      API_ENDPOINTS.student.templates,
      { params },
    )
    const page = res.data.data!
    return {
      items: page.content.map(toTemplateItem),
      totalElements: page.totalElements,
      totalPages: page.totalPages,
      page: page.page,
      size: page.size,
    }
  },
}
```

### 4.4. Store / hook / page

- `template.store.ts`: bỏ `documents: templateService.getDocuments()` (mock). Chuyển sang gọi `templateService.getTemplates(...)` trong hook (hoặc React Query, project đã có `queryClient`).
- `selectedIds`: đổi `number[]` → `string[]` (`publicId`). Sửa luôn props `selectedIds` / `onToggle…` trong `DocumentTemplateTable`.
- `StudentDocumentsPage`:
  - Bỏ lọc client-side `filteredDocs` (`useMemo`) → gửi `keyword`, `fileType` lên BE.
  - Debounce ô tìm kiếm ~300–400 ms; đổi từ khóa / loại thì reset `page = 0`.
  - Tổng số tài liệu lấy `totalElements`, không dùng `items.length`.
  - Thêm phân trang dưới bảng; STT = `page * size + idx + 1`.

Ví dụ hook dùng React Query:

```ts
const { data, isLoading } = useQuery({
  queryKey: ['student-templates', keyword, fileType, page, size],
  queryFn: () => templateService.getTemplates({ keyword, fileType, page, size }),
  placeholderData: (prev) => prev,
})
```

## 5. Tải tài liệu

BE **không có** API tải riêng và **không có** API nén ZIP.

- **Tải 1 file**: mở `fileUrl`:
  ```ts
  const handleDownloadSingle = (doc: TemplateDocumentItem) => {
    window.open(doc.fileUrl, '_blank', 'noopener,noreferrer')
  }
  ```
- **"Tải các mục đã chọn"**: lặp qua các dòng đã chọn, mở từng `fileUrl` (trình duyệt có thể chặn nhiều popup — có thể tạo thẻ `<a>` tạm rồi `click()` lần lượt). Bỏ toast "Đang nén và chuẩn bị tải xuống…" vì không có ZIP.
- Nếu cho chọn qua nhiều trang, FE cần giữ cả object dòng đã chọn (không chỉ id) để còn `fileUrl`.

## 6. Lỗi có thể gặp

| HTTP | `code` | Khi nào | FE xử lý |
|---|---|---|---|
| 401 | 2000 | Thiếu / hết hạn token | Theo luồng refresh / đăng nhập lại chung |
| 400 | 1006 | `fileType` không phải mã enum, `page` / `size` sai kiểu | Chỉ gửi giá trị từ `TEMPLATE_FILE_TYPE_OPTIONS` |
| 404 | 1005 | Sai URL | Kiểm tra `endpoints.ts` |
| 405 | 1007 | Sai method | Dùng `GET` |
| 500 | 1001 | `sort` theo field không tồn tại, lỗi hệ thống | Chỉ dùng field sort ở mục 2 |

Lỗi trả về dạng:

```json
{ "code": 1006, "message": "..." }
```

## 7. Ghi chú

- Dữ liệu do Trưởng bộ môn quản lý (thêm / sửa / xóa ở màn TBM). TBM cập nhật thì sinh viên thấy ngay.
- Sinh viên **chỉ xem và tải**, không có API thêm / sửa / xóa cho sinh viên.
- BE đã có unit test cho logic lọc (UTC383–UTC386). Chưa test end-to-end với FE.
