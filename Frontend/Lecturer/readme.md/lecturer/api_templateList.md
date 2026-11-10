# API danh sách tài liệu / biểu mẫu (màn giảng viên)

> Dùng cho màn **Kho tài liệu & biểu mẫu** của giảng viên (`src/features/lecturer/template_management`), hiện đang chạy mock data (`documentTemplates`).
> Màn giảng viên gọi **chung API `GET /template`** với màn quản lý tài liệu của Trưởng bộ môn. API này đã bỏ giới hạn role: mọi tài khoản đã đăng nhập đều gọi được.

## 1. Tổng quan

| Mục | Giá trị |
|---|---|
| Method | `GET` |
| URL | `/template` |
| Header | `Authorization: Bearer <accessToken>` (bắt buộc) |
| Role | Mọi role đã đăng nhập (SV, GV, TBM, Admin…) – không có lỗi 403 |
| Phân trang | Có (Spring Pageable, `page` bắt đầu từ **0**) |
| Sắp xếp mặc định | `updatedAt,desc` |

`endpoints.ts` đã có sẵn, dùng lại `departmentDocument.base`:

```ts
departmentDocument: {
  base: '/template',
  detail: (publicId: string) => `/template/${publicId}`,
},
```

> Lưu ý: chỉ API **GET danh sách** mở cho mọi role. Thêm / sửa / xóa (`POST`, `PUT`, `DELETE /template...`) vẫn chỉ Trưởng bộ môn gọi được; giảng viên gọi sẽ bị **403 / 2001**. Màn giảng viên chỉ xem và tải.

## 2. Query params

| Param | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `keyword` | string | Không | Tìm theo **tên tài liệu**, không phân biệt hoa thường, chứa chuỗi. Rỗng / toàn khoảng trắng = không lọc. BE tự `trim()` |
| `fileType` | enum | Không | Lọc theo 1 loại (xem bảng mục 3). Không gửi = tất cả loại |
| `page` | number | Không | Trang, bắt đầu từ `0`. Mặc định `0` |
| `size` | number | Không | Số bản ghi / trang. Mặc định `10` |
| `sort` | string | Không | `field,asc|desc`. Field hợp lệ: `fileName`, `fileType`, `fileSize`, `updatedAt`. **Field khác → lỗi 500**, FE không cho người dùng tự nhập |

Lưu ý:
- Gửi giá trị enum không tồn tại (vd `fileType=abc`) → **400 / 1006**.
- Ký tự `%` và `_` trong `keyword` đang được hiểu là ký tự đại diện của SQL LIKE.
- Dùng `compactParams` (`src/shared/utils/params.ts`) để bỏ các param rỗng trước khi gọi.

Ví dụ:

```
GET /template?keyword=bao%20cao&fileType=FINAL_REPORT&page=0&size=10&sort=updatedAt,desc
```

## 3. Danh sách loại tài liệu (`fileType`)

API trả về **tất cả 8 loại** (BE không ẩn loại nào):

| `fileType` (gửi lên BE) | `fileTypeName` (BE trả về) |
|---|---|
| `OUTLINE` | Đề cương |
| `PROGRESS_REPORT` | Báo cáo tiến độ |
| `FINAL_REPORT` | Báo cáo toàn văn |
| `DEFENSE_PRESENTATION` | Slide bảo vệ |
| `REVIEW_FORM` | Phiếu nhận xét / Đánh giá |
| `TEMPLATE` | Tài liệu mẫu |
| `ATTACHMENT` | Minh chứng / Tài liệu đính kèm |
| `OTHER` | Tệp khác |

```ts
export const FILE_TYPE_OPTIONS = [
  { key: '', label: 'Tất cả' },
  { key: 'OUTLINE', label: 'Đề cương' },
  { key: 'PROGRESS_REPORT', label: 'Báo cáo tiến độ' },
  { key: 'FINAL_REPORT', label: 'Báo cáo toàn văn' },
  { key: 'DEFENSE_PRESENTATION', label: 'Slide bảo vệ' },
  { key: 'REVIEW_FORM', label: 'Phiếu nhận xét / Đánh giá' },
  { key: 'TEMPLATE', label: 'Tài liệu mẫu' },
  { key: 'ATTACHMENT', label: 'Minh chứng / Tài liệu đính kèm' },
  { key: 'OTHER', label: 'Tệp khác' },
] as const
```

> Các nút lọc cũ trên `LecturerTemplatesPage` ("Mẫu báo cáo", "Biên bản", "Quy chế"…) là dữ liệu mock, BE không có các loại này → thay bằng danh sách trên.
> Không nên tự lọc bỏ loại nào ở phía FE sau khi nhận dữ liệu: làm vậy sẽ lệch `totalElements` và số dòng mỗi trang.

## 4. Response thành công

```json
{
  "code": 1000,
  "data": {
    "totalElements": 12,
    "totalPages": 2,
    "page": 0,
    "size": 10,
    "content": [
      {
        "publicId": "3f1c2a7e-9b1d-4c55-8a3e-2f7d6c1b0a91",
        "fileName": "Mẫu báo cáo toàn văn ĐATN",
        "fileUrl": "https://res.cloudinary.com/.../mau_bao_cao.docx",
        "fileType": "FINAL_REPORT",
        "fileTypeName": "Báo cáo toàn văn",
        "fileSize": 254312,
        "fileSizeText": "248.4 KB",
        "updatedAt": "05-11-2026 14:20:31",
        "uploadedByName": "Nguyễn Văn A"
      }
    ]
  }
}
```

| Field | Kiểu | Ghi chú |
|---|---|---|
| `publicId` | string (UUID) | Dùng làm `key` / id chọn dòng |
| `fileName` | string | Tên hiển thị |
| `fileUrl` | string | Link Cloudinary, mở trực tiếp để xem / tải |
| `fileType` | enum | Mã loại |
| `fileTypeName` | string | Nhãn tiếng Việt, hiển thị thẳng |
| `fileSize` | number | Byte |
| `fileSizeText` | string | Đã format sẵn (KB/MB) |
| `updatedAt` | string | Định dạng `dd-MM-yyyy HH:mm:ss` (không phải ISO) |
| `uploadedByName` | string \| null | Họ tên người tải lên |

Không có `message` khi thành công.

### Đọc phân trang

`data.page` là **số trang** (0-based), **không** phải object. **Không dùng `toSpringPage`** (hàm này làm `raw.page ?? raw`, với `page = 0` sẽ tính sai). Dùng `fromPageResponse` như ở tài liệu department (`readme.md/department/api_updateTemplate.md`).

## 5. Mapping sang màn giảng viên

Type mock cũ `LecturerDocumentTemplate` → thay bằng dữ liệu thật:

| Mock cũ | Dữ liệu thật |
|---|---|
| `id: number` | `publicId: string` |
| `title` | `fileName` |
| `type` | `fileTypeName` |
| `category` | `fileType` |
| `size` | `fileSizeText` |
| `extension` / `format` | Tự tách từ đuôi của `fileUrl` (BE không trả riêng) |

```ts
// types/templateManagement.types.ts
export type FileType =
  | 'OUTLINE' | 'PROGRESS_REPORT' | 'FINAL_REPORT' | 'DEFENSE_PRESENTATION'
  | 'REVIEW_FORM' | 'TEMPLATE' | 'ATTACHMENT' | 'OTHER'

export interface TemplateFile {
  publicId: string
  fileName: string
  fileUrl: string
  fileType: FileType
  fileTypeName: string
  fileSize: number
  fileSizeText: string
  updatedAt: string
  uploadedByName: string | null
}

export interface TemplateFileQuery {
  keyword?: string
  fileType?: FileType | ''
  page?: number
  size?: number
  sort?: string
}

// Lấy đuôi file từ URL để hiển thị cột "Định dạng"
export const getExtension = (url: string) => {
  const clean = url.split('?')[0]
  const dot = clean.lastIndexOf('.')
  return dot > clean.lastIndexOf('/') ? clean.slice(dot + 1).toUpperCase() : ''
}
```

> Nếu màn department đã khai báo type / service tương tự (`TemplateFileResponse`, `getTemplates`…), có thể import dùng lại thay vì viết mới.

```ts
// services/templateManagement.service.ts
import { compactParams } from '@/shared/utils/params'

export const lecturerTemplateService = {
  getTemplates: async (query: TemplateFileQuery) => {
    const res = await http.get(endpoints.departmentDocument.base, {
      params: compactParams({
        keyword: query.keyword?.trim(),
        fileType: query.fileType || undefined,
        page: query.page ?? 0,
        size: query.size ?? 10,
        sort: query.sort ?? 'updatedAt,desc',
      }),
    })
    return fromPageResponse<TemplateFile>(res.data.data)
  },
}
```

Gợi ý chỉnh hook `useLecturerTemplates`:
- Bỏ lọc client-side (`filteredTemplates` bằng `useMemo`) → gửi `keyword`, `fileType` lên BE; nên debounce ô tìm kiếm ~300–400 ms và reset `page = 0` khi đổi bộ lọc.
- `selectedIds` đổi từ `number[]` sang `string[]` (`publicId`).
- "Tổng số: … tài liệu" lấy từ `totalElements`, không dùng `content.length`.
- Thêm `TablePagination` (`src/shared/components/ui/pagination.tsx`).
- Cột STT: `page * size + idx + 1`.

## 6. Tải tài liệu

BE **không có** API tải riêng và **không có** API nén ZIP.

- **Tải 1 file:** mở `fileUrl`:
  ```ts
  const handleDownloadOne = (doc: TemplateFile) => {
    window.open(doc.fileUrl, '_blank', 'noopener,noreferrer')
  }
  ```
- **"Tải tài liệu đã chọn":** lặp qua các dòng đã chọn và mở từng `fileUrl` (trình duyệt có thể chặn nhiều popup – nên báo người dùng cho phép popup, hoặc tạo thẻ `<a>` tạm rồi `click()` lần lượt). Bỏ toast "Đang tải nén ZIP…" vì không có ZIP.
- Chỉ chọn được file ở trang hiện tại trừ khi FE tự giữ object các dòng đã chọn qua nhiều trang.

## 7. Lỗi có thể gặp

| HTTP | `code` | Khi nào | FE xử lý |
|---|---|---|---|
| 401 | 2000 | Thiếu / hết hạn token | Theo luồng refresh / đăng nhập lại chung |
| 400 | 1006 | `fileType` không đúng enum, `page`/`size` sai kiểu | Chỉ gửi giá trị từ `FILE_TYPE_OPTIONS` |
| 404 | 1005 | Sai URL | Kiểm tra `endpoints.ts` |
| 405 | 1007 | Sai method | Dùng `GET` |
| 500 | 1001 | `sort` theo field không tồn tại, lỗi hệ thống | Chỉ dùng các field sort ở mục 2 |

Lỗi trả về dạng:
```json
{ "code": 1006, "message": "..." }
```

## 8. Ghi chú

- Chưa test end-to-end với FE.
- Màn giảng viên và màn TBM dùng **cùng dữ liệu**: TBM thêm / sửa / xóa thì màn giảng viên thấy ngay.
