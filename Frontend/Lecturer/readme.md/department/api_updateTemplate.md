# Tài liệu & Biểu mẫu (Trưởng bộ môn) – Đặc tả API

> Mô tả 4 API quản lý tài liệu của Trưởng bộ môn (TBM): danh sách, tải lên, cập nhật, xóa. File lưu trên **Cloudinary**,
> thông tin lưu ở bảng `file` của backend. Bảng này **chỉ chứa tài liệu do TBM tải lên**; file sinh viên nộp lưu ở chỗ khác.
> Hợp đồng API lấy từ backend Spring Boot (`tlu_gpms_system`), package `features/teamplate/`
> (`TemplateFileController`, `TemplateFileServiceImpl`, `TemplateFileResponse`).
> Quy ước chung (wrapper response, interceptor, toast, refresh token) giống Mục 3 của `api_addStudent.md`. Chỗ nào file này không nói khác thì làm theo file đó.

---

## 1. Trạng thái hiện tại

| #   | Việc                                                                | Trạng thái                                                                                                                                                          |
| :-- | :------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Bảng danh sách tài liệu + tìm theo tên + lọc theo loại + phân trang | ✅ BE đã có – `GET /template`                                                                                                                                       |
| 2   | Nút **Tải lên tài liệu** (popup chọn file + tên + loại)             | ✅ BE đã có – `POST /template` (multipart)                                                                                                                          |
| 3   | Sửa tài liệu: đổi tên, đổi loại, thay file mới                      | ✅ BE đã có – `PUT /template/{publicId}` (multipart)                                                                                                                |
| 4   | Xóa tài liệu                                                        | ✅ BE đã có – `DELETE /template/{publicId}`                                                                                                                         |
| 5   | Màn hình FE                                                         | ⏳ Chưa làm – menu `/department/documents` ("Tài liệu & Biểu mẫu") đã có trong `departmentNav.config.ts` nhưng **chưa đăng ký route** trong `department.routes.tsx` |
| 6   | API trả danh sách loại tài liệu                                     | ❌ BE không có – FE tự khai hằng số (Mục 2.3)                                                                                                                       |
| 7   | Tải file về qua BE / xem trước                                      | ❌ BE không có – FE mở thẳng `fileUrl` của Cloudinary                                                                                                               |

---

## 2. Gợi ý vị trí code FE

### 2.1. Cấu trúc thư mục

Làm theo khuôn của `lecturer_management/`:

```
src/features/department/document_management/
├── types.ts                          # TemplateFile, TemplateFileListParams, PageResponse, FileType, FILE_TYPE_OPTIONS
├── services/templateFile.service.ts  # getTemplateFiles, createTemplateFile, updateTemplateFile, deleteTemplateFile
├── hooks/useTemplateFiles.ts         # templateFileKeys, useTemplateFiles, useCreateTemplateFile, useUpdateTemplateFile, useDeleteTemplateFile
├── utils/templateFileSchema.ts       # schema zod cho popup tải lên / sửa (Mục 5.5)
├── components/
│   ├── TemplateFileToolbar.tsx       # ô tìm theo tên + dropdown lọc loại + nút "Tải lên tài liệu"
│   ├── TemplateFileTable.tsx         # bảng 5 cột + cột Thao tác + phân trang
│   ├── TemplateFileFormDialog.tsx    # popup dùng chung cho Tải lên / Sửa
│   └── DeleteTemplateFileDialog.tsx  # hỏi xác nhận trước khi xóa
├── pages/DocumentManagementPage.tsx  # export default
└── index.ts
```

Route: thêm `{ path: 'documents', element: withSuspense(<DocumentManagementPage />) }` vào `department.routes.tsx`
(nạp bằng `lazy()` như các trang khác).

Dùng lại được: `FileDropZone` (`src/shared/components/ui/file-drop-zone.tsx`), `TablePagination` (`src/shared/components/ui/pagination.tsx`),
`compactParams` (`src/shared/utils/params.ts`).

### 2.2. Endpoint

Thêm vào `src/shared/api/endpoints.ts`:

```ts
// Tài liệu & Biểu mẫu của Trưởng bộ môn (lưu trên Cloudinary)
departmentDocument: {
  // GET: danh sách (phân trang) · POST: tải lên (multipart)
  base: '/template',
  // PUT: sửa (multipart) · DELETE: xóa
  detail: (publicId: string) => `/template/${publicId}`,
},
```

Các ví dụ bên dưới viết tắt `const DOCUMENT = API_ENDPOINTS.departmentDocument`.

### 2.3. Loại tài liệu (`fileType`)

BE không có API trả danh sách loại, FE khai hằng số khớp enum `FileType` của BE (gửi lên **đúng mã chữ hoa**):

```ts
export type FileType =
  | "OUTLINE"
  | "PROGRESS_REPORT"
  | "FINAL_REPORT"
  | "DEFENSE_PRESENTATION"
  | "REVIEW_FORM"
  | "TEMPLATE"
  | "ATTACHMENT"
  | "OTHER";

// Nhãn giống hệt fileTypeName BE trả về
export const FILE_TYPE_OPTIONS: { value: FileType; label: string }[] = [
  { value: "OUTLINE", label: "Đề cương" },
  { value: "PROGRESS_REPORT", label: "Báo cáo tiến độ" },
  { value: "FINAL_REPORT", label: "Báo cáo toàn văn" },
  { value: "DEFENSE_PRESENTATION", label: "Slide bảo vệ" },
  { value: "REVIEW_FORM", label: "Phiếu nhận xét / Đánh giá" },
  { value: "TEMPLATE", label: "Tài liệu mẫu" },
  { value: "ATTACHMENT", label: "Minh chứng / Tài liệu đính kèm" },
  { value: "OTHER", label: "Tệp khác" },
];
```

Trên bảng hiển thị `fileTypeName` BE trả về, không cần tra lại hằng số này.

---

## 3. Quy ước chung

- Response `{ code, message?, data? }`, `code = 1000` là thành công. Mọi lỗi trả body `{ code, message }`, không có `data`.
- Lỗi HTTP 4xx/5xx → interceptor tự toast đỏ, component **không** `toast.error` lại. Popup muốn tự hiện lỗi trên form thì gửi `{ skipErrorToast: true }`.
- Quyền: cả 4 API **chỉ** cho role `HEAD_OF_MAJOR` (`@PreAuthorize("hasRole('HEAD_OF_MAJOR')")` ở `TemplateFileServiceImpl`). `ADMIN` cũng bị `403`.
- Chỉ dùng `publicId` (UUID string), không có `id` số.
- Code `4000` dùng chung cho mọi lỗi dữ liệu nhập, FE phân biệt bằng `message`, không bằng `code`.
- **Không tự đặt header `Content-Type`** khi gửi `FormData` (POST / PUT): để axios tự sinh `multipart/form-data; boundary=...`.
  Tự đặt sẽ mất `boundary` → `400 1006`.

**Lỗi chung cho cả 4 API** (bảng lỗi riêng ở Mục 4–7 không nhắc lại):

| Trường hợp                                     | HTTP | `code` | Message                                     | FE xử lý                                                                |
| :--------------------------------------------- | :--- | :----- | :------------------------------------------ | :---------------------------------------------------------------------- |
| Chưa đăng nhập, access token hết hạn hoặc sai  | 401  | 2000   | Phiên đăng nhập của bạn đã hết hạn          | Interceptor tự gọi `/refresh-token` rồi gửi lại; thất bại → về `/login` |
| Không phải `HEAD_OF_MAJOR`                     | 403  | 2001   | Bạn không có quyền truy cập (access denied) | Toast đỏ                                                                |
| `publicId` trên URL không phải UUID            | 400  | 1006   | Yêu cầu không hợp lệ                        | Toast đỏ (không ra 404)                                                 |
| `fileType` trên query (GET) sai giá trị enum   | 400  | 1006   | Yêu cầu không hợp lệ                        | Toast đỏ                                                                |
| Sai `Content-Type`, mất `boundary`, body hỏng  | 400  | 1006   | Yêu cầu không hợp lệ                        | Toast đỏ                                                                |
| Sai HTTP method (ví dụ `PATCH` thay cho `PUT`) | 405  | 1007   | Hệ thống không cấp phép                     | Toast đỏ                                                                |
| URL không khớp API nào (ví dụ `/template/`)    | 404  | 1005   | Thông tin không có sẵn                      | Toast đỏ                                                                |
| Lỗi không lường trước ở BE                     | 500  | 1001   | Hệ thống không phản hồi                     | Toast đỏ                                                                |

**Lỗi nào trả trước:** 401 trả trước mọi lỗi khác. 403 chỉ được kiểm tra khi request vào tới Service, nên các lỗi ở tầng
Controller trả về **trước** 403: `1006` / `1007` / `1005` ở bảng trên, thiếu part `file`, file > 50MB, lỗi validate `fileName` / `fileType` (Mục 5.4).

---

## 4. `GET /template` – Danh sách tài liệu

Trả 5 cột của bảng: **TÊN TÀI LIỆU, LINK TRUY CẬP, LOẠI, KÍCH THƯỚC, NGÀY CẬP NHẬT** (kèm người tải lên).

### 4.1. Query params (đều không bắt buộc)

| Param      | Kiểu   | Ý nghĩa                                                                                                                  |
| :--------- | :----- | :----------------------------------------------------------------------------------------------------------------------- |
| `keyword`  | string | Tìm gần đúng theo **tên tài liệu**, không phân biệt hoa/thường. BE tự trim; chuỗi rỗng / toàn dấu cách coi như không lọc |
| `fileType` | string | Lọc đúng 1 loại, giá trị trong Mục 2.3. Không gửi → tất cả loại. Sai giá trị → `400 1006`                                |
| `page`     | number | Trang, **bắt đầu từ 0**                                                                                                  |
| `size`     | number | Mặc định **10**                                                                                                          |
| `sort`     | string | `<field>,asc` / `<field>,desc`. Mặc định (không gửi): `updatedAt,desc` – mới cập nhật lên đầu                            |

Field `sort` dùng được (tên field của entity, phân biệt hoa/thường):

| Field       | Cột trên bảng                                           |
| :---------- | :------------------------------------------------------ |
| `fileName`  | Tên tài liệu                                            |
| `fileType`  | Loại (sắp theo **mã enum**, không theo nhãn tiếng Việt) |
| `fileSize`  | Kích thước                                              |
| `updatedAt` | Ngày cập nhật                                           |

> ⚠️ BE **chưa có whitelist** sort cho API này: gửi field không tồn tại (`name`, `size`, `abc`...) sẽ ra **`500 1001`**
> (không phải `400` như các API có whitelist). FE chỉ gửi đúng 4 field trên.

- `page` / `size` sai (âm, chữ, `size=0`) không báo lỗi, Spring đưa về mặc định. `page` vượt quá số trang → `content` rỗng, vẫn `200`.
- Ký tự `%` và `_` trong `keyword` đang được hiểu là ký tự đại diện của `LIKE` (BE chưa escape). Không lỗi, chỉ ra kết quả rộng hơn.

Ví dụ: `GET /template?keyword=đề cương&fileType=TEMPLATE&page=0&size=10&sort=updatedAt,desc`

### 4.2. Response

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
        "publicId": "0192f3a1-7c2e-7b4d-9a10-3f5e2d1c0b9a",
        "fileName": "Mẫu đề cương K66",
        "fileUrl": "https://res.cloudinary.com/<cloud>/raw/upload/v1731200000/gpms/templates/<tên file>.docx",
        "fileType": "TEMPLATE",
        "fileTypeName": "Tài liệu mẫu",
        "fileSize": 1310720,
        "fileSizeText": "1.25 MB",
        "updatedAt": "10-11-2026 14:35:20",
        "uploadedByName": "Nguyễn Văn An"
      }
    ]
  }
}
```

| Field            | Kiểu           | Cột / ý nghĩa                                                                                       |
| :--------------- | :------------- | :-------------------------------------------------------------------------------------------------- |
| `publicId`       | string (UUID)  | Dùng cho Sửa / Xóa                                                                                  |
| `fileName`       | string         | **TÊN TÀI LIỆU**                                                                                    |
| `fileUrl`        | string         | **LINK TRUY CẬP** – link Cloudinary (https), mở thẳng được                                          |
| `fileType`       | `FileType`     | Mã loại, dùng để điền sẵn dropdown khi Sửa                                                          |
| `fileTypeName`   | string         | **LOẠI** – nhãn tiếng Việt để hiển thị                                                              |
| `fileSize`       | number \| null | Số byte gốc                                                                                         |
| `fileSizeText`   | string \| null | **KÍCH THƯỚC** đã định dạng: `"512 B"`, `"12.50 KB"`, `"1.25 MB"`, `"1.02 GB"` (dấu chấm thập phân) |
| `updatedAt`      | string         | **NGÀY CẬP NHẬT**, định dạng **`dd-MM-yyyy HH:mm:ss`** (giờ server, không có múi giờ)               |
| `uploadedByName` | string \| null | Họ tên người tải lên / thay file gần nhất                                                           |

Field rỗng trong `content` vẫn có mặt với giá trị `null` (chỉ wrapper ngoài cùng mới bỏ field `null`).

### 4.3. ⚠️ `data` là `PageResponse`, **không** dùng `toSpringPage`

Khác `GET /teacher` / `GET /student`, `data` ở đây có dạng `{ totalElements, totalPages, page, size, content }`,
trong đó **`page` là số trang (number)**. `toSpringPage` (`src/shared/utils/springPage.ts`) đọc `raw.page ?? raw` như object
metadata của `PagedModel`; với `page = 0` nó lấy số `0` làm metadata nên **tính sai** `totalElements` / `totalPages`
(ví dụ 12 bản ghi, trang 0 cỡ 10 → ra `totalElements = 10`, `totalPages = 1`, mất trang 2). Service tự đổi sang `SpringPage`:

```ts
// Dạng PageResponse của BE (common/dto/PageResponse.java)
export interface PageResponse<T> {
  totalElements: number;
  totalPages: number;
  page: number; // số trang hiện tại, bắt đầu từ 0
  size: number;
  content: T[];
}

export function fromPageResponse<T>(
  raw: PageResponse<T> | null | undefined,
): SpringPage<T> {
  const content = raw?.content ?? [];
  const number = raw?.page ?? 0;
  const totalPages = raw?.totalPages ?? 0;
  return {
    content,
    number,
    size: raw?.size ?? content.length,
    totalElements: raw?.totalElements ?? content.length,
    totalPages,
    numberOfElements: content.length,
    first: number === 0,
    last: number >= totalPages - 1,
    empty: content.length === 0,
  };
}
```

### 4.4. Hiển thị cột LINK TRUY CẬP

- Mở bằng `<a href={fileUrl} target="_blank" rel="noopener noreferrer">`. File Word / Excel / PowerPoint / ZIP trình duyệt sẽ tải về; PDF / TXT thường mở xem luôn.
- Tên file khi tải về theo tên lưu trên Cloudinary, **không** theo `fileName` hiển thị.
- Nếu link PDF / ZIP mở ra lỗi `401` từ Cloudinary: tài khoản Cloudinary đang chặn phát file PDF/ZIP (cài đặt bảo mật của Cloudinary).
  Báo BE kiểm tra mục cho phép phát PDF/ZIP trong Cloudinary Console; FE không xử lý được.

---

## 5. `POST /template` – Tải lên tài liệu mới

`Content-Type: multipart/form-data` (axios tự đặt khi body là `FormData`).

### 5.1. Các part

| Part       | Kiểu   | Bắt buộc | Ghi chú                                                                                                                                              |
| :--------- | :----- | :------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| `file`     | File   | ✅       | Đuôi cho phép: `pdf, doc, docx, xls, xlsx, ppt, pptx, txt, zip, rar` (không phân biệt hoa/thường). BE chỉ kiểm tra **đuôi**, không kiểm tra nội dung |
| `fileType` | string | ✅       | Mã trong Mục 2.3                                                                                                                                     |
| `fileName` | string | ❌       | Tên hiển thị, tối đa 255 ký tự. Bỏ trống / toàn dấu cách → BE lấy **tên file gốc** (cắt còn 255 ký tự nếu dài hơn). Có nhập → BE trim                |

- Tên tài liệu **được phép trùng** nhau, BE không kiểm tra.
- File `.tar.gz` bị từ chối (BE lấy đuôi sau dấu chấm cuối cùng → `gz`). File tên bắt đầu bằng dấu chấm (`.pdf`) cũng bị từ chối.

### 5.2. Ví dụ gọi

```ts
const UPLOAD_TIMEOUT_MS = 2 * 60 * 1000 // upload lên Cloudinary có thể lâu hơn timeout mặc định

// POST /template – không đặt header Content-Type
async createTemplateFile(body: TemplateFileCreateBody, config?: { skipErrorToast?: boolean }): Promise<string | undefined> {
  const form = new FormData()
  form.append('file', body.file)
  form.append('fileType', body.fileType)
  if (body.fileName?.trim()) form.append('fileName', body.fileName.trim())
  const res = await apiClient.post<ApiResponse<void>>(DOCUMENT.base, form, {
    timeout: UPLOAD_TIMEOUT_MS,
    skipErrorToast: config?.skipErrorToast,
  })
  return res.data.message
}
```

### 5.3. Response thành công

```json
{ "code": 1000, "message": "Thêm mới tài liệu thành công" }
```

Không có `data` → sau khi thành công, **invalidate** query danh sách (`templateFileKeys.lists()`) để bảng tải lại.

### 5.4. Lỗi

Thứ tự BE kiểm tra: thiếu part `file` → validate `fileType` / `fileName` → (quyền) → file rỗng / sai đuôi → upload Cloudinary → lưu DB.

| Trường hợp                                                         | HTTP | `code` | Message                                                                                             |
| :----------------------------------------------------------------- | :--- | :----- | :-------------------------------------------------------------------------------------------------- |
| Không gửi part `file`                                              | 400  | 4000   | File import không được để trống _(message dùng chung với API import, chữ "import" là của BE)_       |
| File > 50MB                                                        | 400  | 4000   | File import vượt quá dung lượng cho phép (50MB)                                                     |
| Thiếu `fileType`                                                   | 400  | 4000   | Loại tài liệu không được để trống                                                                   |
| `fileType` sai giá trị enum (ví dụ `"Tài liệu mẫu"`, `"abc"`)      | 422  | 1003   | Xác thực thất bại                                                                                   |
| `fileName` > 255 ký tự                                             | 400  | 4000   | Tên tài liệu không được vượt quá 255 ký tự                                                          |
| Part `file` có 0 byte, hoặc file không có tên                      | 400  | 4000   | Vui lòng chọn tài liệu cần tải lên                                                                  |
| Sai đuôi file / không có đuôi                                      | 400  | 4000   | Định dạng tài liệu không được hỗ trợ (chỉ nhận PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP, RAR) |
| Cloudinary từ chối (quá dung lượng của gói, mất kết nối, cấu hình) | 400  | 4000   | Lưu thất bại                                                                                        |

- Gửi sai cùng lúc nhiều field (ví dụ thiếu `fileType` **và** `fileName` quá dài) → BE chỉ báo **một** lỗi, không cố định lỗi nào trước.
- Nếu lưu DB lỗi sau khi đã upload, BE tự xóa file vừa upload trên Cloudinary và trả `500 1001`.

> ⚠️ **Giới hạn dung lượng thực tế có thể nhỏ hơn 50MB.** Spring nhận tối đa 50MB, nhưng Cloudinary giới hạn theo gói tài khoản
> (gói Free: **10MB** mỗi file raw). File lớn hơn giới hạn của gói sẽ upload xong rồi mới nhận `400 "Lưu thất bại"`.
> FE nên chặn trước khi gửi (gợi ý **10MB**, hỏi BE nếu đã nâng gói).

### 5.5. Kiểm tra phía FE (schema zod gợi ý)

Chặn trước những lỗi chắc chắn sai để không phải chờ upload. Message giữ giống BE:

```ts
const ALLOWED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "zip",
  "rar",
];
export const TEMPLATE_FILE_ACCEPT = ALLOWED_EXTENSIONS.map(
  (ext) => `.${ext}`,
).join(","); // cho <input accept>
export const MAX_TEMPLATE_FILE_BYTES = 10 * 1024 * 1024;

const getExtension = (name: string) => {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
};

const fileRule = z
  .instanceof(File)
  .refine((f) => f.size > 0, "Vui lòng chọn tài liệu cần tải lên")
  .refine(
    (f) => ALLOWED_EXTENSIONS.includes(getExtension(f.name)),
    "Định dạng tài liệu không được hỗ trợ (chỉ nhận PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP, RAR)",
  )
  .refine(
    (f) => f.size <= MAX_TEMPLATE_FILE_BYTES,
    "Tài liệu vượt quá dung lượng cho phép (10MB)",
  );

const fileTypeRule = z.enum(
  [
    "OUTLINE",
    "PROGRESS_REPORT",
    "FINAL_REPORT",
    "DEFENSE_PRESENTATION",
    "REVIEW_FORM",
    "TEMPLATE",
    "ATTACHMENT",
    "OTHER",
  ],
  { message: "Loại tài liệu không được để trống" },
);
const fileNameRule = z
  .string()
  .max(255, "Tên tài liệu không được vượt quá 255 ký tự")
  .optional();

export const createTemplateFileSchema = z.object({
  file: fileRule,
  fileType: fileTypeRule,
  fileName: fileNameRule,
});

// Sửa: mọi field đều tùy chọn
export const updateTemplateFileSchema = z.object({
  file: fileRule.optional(),
  fileType: fileTypeRule.optional(),
  fileName: fileNameRule,
});
```

Gợi ý giao diện: khi người dùng chọn file mà ô Tên đang trống, điền sẵn tên file để họ sửa.

---

## 6. `PUT /template/{publicId}` – Cập nhật tài liệu

`Content-Type: multipart/form-data`. **Mọi part đều tùy chọn**: part nào không gửi (hoặc rỗng) thì giữ giá trị cũ.

### 6.1. Các part

| Part       | Kiểu   | Ghi chú                                                                                                               |
| :--------- | :----- | :-------------------------------------------------------------------------------------------------------------------- |
| `file`     | File   | Gửi khi muốn **thay file mới**. Cùng quy tắc đuôi như Mục 5.1. File 0 byte được coi như **không gửi** (không báo lỗi) |
| `fileType` | string | Loại mới                                                                                                              |
| `fileName` | string | Tên mới, tối đa 255 ký tự, BE trim                                                                                    |

Kết quả theo tổ hợp gửi lên:

| Gửi                                              | Tên sau khi lưu                      | File / link / kích thước | Người tải lên          |
| :----------------------------------------------- | :----------------------------------- | :----------------------- | :--------------------- |
| Chỉ `fileName` và/hoặc `fileType`                | Tên mới (nếu có)                     | Giữ nguyên               | Giữ nguyên             |
| `file` + `fileName`                              | `fileName` mới                       | File mới                 | Đổi thành TBM đang sửa |
| `file`, **không** có `fileName`                  | **Tên file mới** (ghi đè tên cũ)     | File mới                 | Đổi thành TBM đang sửa |
| `fileName` rỗng / toàn dấu cách, không có `file` | Giữ tên cũ (không xóa được tên)      | Giữ nguyên               | Giữ nguyên             |
| Không gửi gì                                     | Giữ nguyên, chỉ cập nhật `updatedAt` | Giữ nguyên               | Giữ nguyên             |

- Thay file mới: `fileUrl` **đổi sang link mới**. File cũ **vẫn còn** trên Cloudinary (link cũ vẫn mở được), BE không xóa.
- Nếu không muốn tên bị đổi theo file mới, popup Sửa nên **luôn gửi lại `fileName`** đang hiển thị trong ô Tên.

### 6.2. Ví dụ gọi

```ts
// PUT /template/{publicId}
async updateTemplateFile(publicId: string, body: TemplateFileUpdateBody, config?: { skipErrorToast?: boolean }): Promise<string | undefined> {
  const form = new FormData()
  if (body.file) form.append('file', body.file)
  if (body.fileType) form.append('fileType', body.fileType)
  if (body.fileName?.trim()) form.append('fileName', body.fileName.trim())
  const res = await apiClient.put<ApiResponse<void>>(DOCUMENT.detail(publicId), form, {
    timeout: UPLOAD_TIMEOUT_MS,
    skipErrorToast: config?.skipErrorToast,
  })
  return res.data.message
}
```

### 6.3. Response thành công

```json
{ "code": 1000, "message": "Cập nhật tài liệu thành công" }
```

Sau khi thành công → invalidate query danh sách.

### 6.4. Lỗi

| Trường hợp                           | HTTP | `code` | Message                                                                                             |
| :----------------------------------- | :--- | :----- | :-------------------------------------------------------------------------------------------------- |
| `publicId` không tồn tại (đã bị xóa) | 404  | 3067   | Không tìm thấy tài liệu                                                                             |
| `fileType` sai giá trị enum          | 422  | 1003   | Xác thực thất bại                                                                                   |
| `fileName` > 255 ký tự               | 400  | 4000   | Tên tài liệu không được vượt quá 255 ký tự                                                          |
| File mới sai đuôi / không có đuôi    | 400  | 4000   | Định dạng tài liệu không được hỗ trợ (chỉ nhận PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP, RAR) |
| File mới > 50MB                      | 400  | 4000   | File import vượt quá dung lượng cho phép (50MB)                                                     |
| Cloudinary từ chối file mới          | 400  | 4000   | Lưu thất bại                                                                                        |

Khi có lỗi, **không** thay đổi gì: tên, loại, file cũ giữ nguyên.
Gặp `404 3067` (người khác vừa xóa) → đóng popup và invalidate danh sách.

---

## 7. `DELETE /template/{publicId}` – Xóa tài liệu

Không có body.

```json
{ "code": 1000, "message": "Xóa tài liệu thành công" }
```

- **Chỉ xóa bản ghi trong DB**, file trên Cloudinary **vẫn còn**: ai đã lưu link vẫn mở được. Popup xác nhận nên ghi đúng ý này
  (ví dụ: "Tài liệu sẽ bị gỡ khỏi danh sách").
- Xóa cứng, không khôi phục được qua API. **Bắt buộc** hỏi xác nhận trước khi gọi.
- Sau khi thành công → invalidate danh sách. Nếu xóa dòng cuối của trang cuối, lùi `page` về trang trước.

| Lỗi                                           | HTTP | `code` | Message                 |
| :-------------------------------------------- | :--- | :----- | :---------------------- |
| `publicId` không tồn tại (đã bị xóa trước đó) | 404  | 3067   | Không tìm thấy tài liệu |

---

## 8. Types & hook gợi ý

```ts
export interface TemplateFile {
  publicId: string;
  fileName: string;
  fileUrl: string;
  fileType: FileType;
  fileTypeName: string;
  fileSize: number | null;
  fileSizeText: string | null;
  updatedAt: string; // "dd-MM-yyyy HH:mm:ss"
  uploadedByName: string | null;
}

export type TemplateFileSortField =
  | "fileName"
  | "fileType"
  | "fileSize"
  | "updatedAt";

export interface TemplateFileListParams {
  keyword?: string;
  fileType?: FileType;
  page: number;
  size: number;
  sort?: `${TemplateFileSortField},${"asc" | "desc"}`;
}

export interface TemplateFileCreateBody {
  file: File;
  fileType: FileType;
  fileName?: string;
}

export interface TemplateFileUpdateBody {
  file?: File;
  fileType?: FileType;
  fileName?: string;
}
```

```ts
// GET /template
async getTemplateFiles(params: TemplateFileListParams): Promise<SpringPage<TemplateFile>> {
  const res = await apiClient.get<ApiResponse<PageResponse<TemplateFile>>>(DOCUMENT.base, {
    params: compactParams(params),
  })
  return fromPageResponse(res.data.data) // KHÔNG dùng toSpringPage (Mục 4.3)
},

// DELETE /template/{publicId}
async deleteTemplateFile(publicId: string): Promise<string | undefined> {
  const res = await apiClient.delete<ApiResponse<void>>(DOCUMENT.detail(publicId))
  return res.data.message
},
```

```ts
export const templateFileKeys = {
  all: ["department", "templateFiles"] as const,
  lists: () => [...templateFileKeys.all, "list"] as const,
  list: (params: TemplateFileListParams) =>
    [...templateFileKeys.lists(), params] as const,
};
// useCreateTemplateFile / useUpdateTemplateFile / useDeleteTemplateFile:
//   onSuccess → toast.success(message) + queryClient.invalidateQueries({ queryKey: templateFileKeys.lists() })
```

Khi đổi `keyword` (chờ ngừng gõ ~400ms) hoặc `fileType`, đưa `page` về `0`.

---

## 9. Lưu ý

- Các API mới được kiểm bằng unit test ở tầng Service; **chưa** chạy thử end-to-end với server thật. Đặc biệt `PUT` multipart
  (gửi `fileName` / `fileType` dạng form field kèm part `file`) cần thử sớm khi ghép FE. Gặp sai lệch với tài liệu này thì báo BE.
- Hạn chế đã biết của BE: sort sai field → `500` (Mục 4.1), `%` / `_` trong `keyword` chưa escape, giới hạn 50MB của Spring lớn hơn giới hạn gói Cloudinary.

---

## 10. Tóm tắt nhanh

| API                           | Body                                                    | Thành công                         | Lỗi riêng chính                                 |
| :---------------------------- | :------------------------------------------------------ | :--------------------------------- | :---------------------------------------------- |
| `GET /template`               | query `keyword, fileType, page, size, sort`             | `data: PageResponse<TemplateFile>` | sort sai field → `500`                          |
| `POST /template`              | multipart `file`_, `fileType`_, `fileName`              | Thêm mới tài liệu thành công       | thiếu loại, sai đuôi, file rỗng, Cloudinary lỗi |
| `PUT /template/{publicId}`    | multipart `file`, `fileType`, `fileName` (đều tùy chọn) | Cập nhật tài liệu thành công       | `404 3067`, sai đuôi, Cloudinary lỗi            |
| `DELETE /template/{publicId}` | —                                                       | Xóa tài liệu thành công            | `404 3067`                                      |
