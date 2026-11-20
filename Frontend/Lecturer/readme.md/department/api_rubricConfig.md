# Cấu hình điểm – Rubric chấm điểm (Trưởng bộ môn) – Đặc tả API

> Mô tả 12 API cấu hình rubric (mẫu phiếu chấm) của Trưởng bộ môn (TBM): 11 API quản lý rubric (A1–A10, A7b) và 1 API
> xem rubric của học kỳ (B1). Hợp đồng API lấy từ backend Spring Boot (`tlu_gpms_system`):
> - `features/score_config/` (`EvaluationTemplateController`, `EvaluationTemplateServiceImpl`, `TemplateStatusRules`, `SemesterRangeRules`, `TemplateTreeValidator`)
> - `features/semester/` (`SemesterController` – API `GET /semester/{id}/evaluation-template`, và API danh sách học kỳ `GET /semester` có sẵn)
>
> Đặc tả nghiệp vụ phía BE: `doc/case_execution/cau_hinh_rubric.md`.
> Quy ước chung (wrapper response, interceptor, toast, refresh token) giống Mục 3 của `api_addStudent.md`. Chỗ nào file này không nói khác thì làm theo file đó.
>
> **Thay đổi so với bản trước (BE đã đổi):** rubric áp dụng theo **khoảng học kỳ** ("Từ kỳ" – "Đến kỳ") thay cho **ngày**
> (`effectiveFrom` / `effectiveTo`). Tóm tắt những gì FE phải sửa ở Mục 12.

---

## 1. Trạng thái hiện tại

| #   | Việc                                                                | Trạng thái                                                                                          |
| :-- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------- |
| 1   | Danh sách rubric theo loại phiếu (3 tab)                            | ✅ BE đã có – `GET /evaluation-template?type=` (A1)                                                 |
| 2   | Xem chi tiết rubric (cây nhóm / tiêu chí + cờ bật/tắt nút)          | ✅ BE đã có – `GET /evaluation-template/{publicId}` (A2)                                            |
| 3   | Tạo rubric Nháp trống                                               | ✅ BE đã có – `POST /evaluation-template` (A3)                                                      |
| 4   | Nhân bản rubric                                                     | ✅ BE đã có – `POST /evaluation-template/{publicId}/clone` (A4)                                     |
| 5   | Lưu tên + cây nhóm / tiêu chí                                       | ✅ BE đã có – `PUT /evaluation-template/{publicId}` (A5)                                            |
| 6   | Xóa rubric Nháp                                                     | ✅ BE đã có – `DELETE /evaluation-template/{publicId}` (A6)                                         |
| 7   | Hộp thoại xác nhận Áp dụng / Sửa kỳ áp dụng (xem trước học kỳ bị ảnh hưởng) | ✅ BE đã có – `GET /evaluation-template/{publicId}/apply-preview?fromSemesterId=&toSemesterId=` (A7) |
| 8   | Hộp thoại xác nhận Hủy áp dụng (xem trước học kỳ mất rubric)        | ✅ BE đã có – `GET /evaluation-template/{publicId}/cancel-apply-preview` (A7b)                      |
| 9   | Áp dụng rubric cho khoảng học kỳ "Từ kỳ" – "Đến kỳ"                 | ✅ BE đã có – `POST /evaluation-template/{publicId}/apply` (A8)                                     |
| 10  | Sửa kỳ áp dụng (rubric Sắp áp dụng / Đang áp dụng)                  | ✅ BE đã có – `PATCH /evaluation-template/{publicId}/semester-range` (A9)                           |
| 11  | Hủy áp dụng (rubric Sắp / Đang áp dụng chưa có phiếu chấm → Nháp)   | ✅ BE đã có – `POST /evaluation-template/{publicId}/cancel-apply` (A10)                             |
| 12  | Xem 3 rubric đang gán cho một học kỳ (chỉ xem)                      | ✅ BE đã có – `GET /semester/{semesterPublicId}/evaluation-template` (B1)                           |
| 13  | Danh sách học kỳ cho ô chọn "Từ kỳ" / "Đến kỳ"                      | ✅ BE đã có sẵn – `GET /semester?sortBy=startDate&sortDir=ASC` (Mục 6.1)                            |
| 14  | Đổi tay rubric của một học kỳ (B2 cũ `PUT /semester/{id}/evaluation-template`) | 🚫 **Đã bỏ** – rubric của học kỳ chỉ do khoảng kỳ của rubric quyết định. FE xóa nút "Đổi rubric" |
| 15  | Màn hình FE                                                         | 🟡 Đã có UI chạy dữ liệu mẫu ở `src/features/department/score_management/` (route `/department/grading-config`), **chưa có `services/`**, chưa nối API |
| 16  | Lịch sử đổi rubric của học kỳ (`RubricAssignmentChange`, lý do đổi) | ❌ BE không có                                                                                      |
| 17  | Số SV đã chấm theo từng học kỳ dùng rubric                          | ❌ BE không có – chỉ có tổng `semesterCount`, `sheetCount`; tên kỳ bị ảnh hưởng xem qua A7 / A7b (Mục 2.4) |

---

## 2. Gợi ý vị trí code FE

### 2.1. Cấu trúc thư mục

Giữ thư mục đang có `src/features/department/score_management/`, bổ sung phần còn thiếu:

```
src/features/department/score_management/
├── types.ts                            # thêm type BE (Mục 9) bên cạnh type UI hiện có
├── services/evaluationTemplate.service.ts   # MỚI: 12 hàm gọi A1–A10, A7b, B1 + 1 hàm lấy danh sách học kỳ
├── hooks/useRubricVersions.ts          # thay dữ liệu mẫu bằng React Query (Mục 9)
├── utils/
│   ├── rubricHelpers.ts
│   ├── rubricMapper.ts                 # MỚI: map response BE ↔ type UI (Mục 2.4)
│   ├── rubricSchema.ts                 # MỚI: zod cho form tạo / lưu cây / chọn khoảng kỳ
│   └── rubricSampleData.ts             # bỏ khi nối API xong
├── components/ ...                     # giữ nguyên; ChangeRubricDialog (đổi tay rubric học kỳ) bỏ
├── pages/GradingConfigPage.tsx
└── index.ts
```

Route `grading-config` và menu "Cấu hình điểm" đã có, không cần thêm.

### 2.2. Endpoint

Thêm vào `src/shared/api/endpoints.ts`:

```ts
// Cấu hình rubric chấm điểm của Trưởng bộ môn
departmentRubric: {
  // GET: danh sách theo loại (?type=) · POST: tạo rubric Nháp
  base: '/evaluation-template',
  // GET: chi tiết · PUT: lưu tên + cây · DELETE: xóa Nháp
  detail: (publicId: string) => `/evaluation-template/${publicId}`,
  clone: (publicId: string) => `/evaluation-template/${publicId}/clone`,
  applyPreview: (publicId: string) => `/evaluation-template/${publicId}/apply-preview`,
  cancelApplyPreview: (publicId: string) => `/evaluation-template/${publicId}/cancel-apply-preview`,
  apply: (publicId: string) => `/evaluation-template/${publicId}/apply`,
  semesterRange: (publicId: string) => `/evaluation-template/${publicId}/semester-range`,
  cancelApply: (publicId: string) => `/evaluation-template/${publicId}/cancel-apply`,
  // GET: 3 rubric của học kỳ (chỉ xem, không còn PUT)
  semester: (semesterPublicId: string) => `/semester/${semesterPublicId}/evaluation-template`,
  // GET: danh sách học kỳ cho ô chọn "Từ kỳ" / "Đến kỳ" (nếu endpoints.ts đã có endpoint học kỳ thì dùng lại)
  semesterList: '/semester',
},
```

Các ví dụ bên dưới viết tắt `const RUBRIC = API_ENDPOINTS.departmentRubric`.

### 2.3. Enum dùng chung

```ts
// Loại phiếu chấm (gửi lên đúng mã chữ hoa)
export type EvaluationType = 'ADVISOR' | 'EXAMINER' | 'COUNCIL'

// Trạng thái hiển thị: BE tính từ khoảng học kỳ so với hôm nay, không lưu DB
export type TemplateDisplayStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'EXPIRED'
```

| `EvaluationType` | Nhãn BE (`evaluationTypeName`) | Tab UI hiện tại (`RubricRole`) |
| :--------------- | :----------------------------- | :----------------------------- |
| `ADVISOR`        | Phiếu hướng dẫn                | `supervisor`                   |
| `EXAMINER`       | Phiếu phản biện                | `reviewer`                     |
| `COUNCIL`        | Phiếu hội đồng                 | `council`                      |

| `TemplateDisplayStatus` | Nhãn BE (`displayStatusName`) | `RubricStatus` UI | Điều kiện BE (so với hôm nay, xét theo thứ tự)                    |
| :---------------------- | :---------------------------- | :---------------- | :---------------------------------------------------------------- |
| `DRAFT`                 | Nháp                          | `draft`           | `fromSemester = null`                                             |
| `SCHEDULED`             | Sắp áp dụng                   | `upcoming`        | ngày bắt đầu của "Từ kỳ" `>` hôm nay                              |
| `EXPIRED`               | Hết áp dụng                   | `archived`        | có "Đến kỳ" và ngày kết thúc của "Đến kỳ" `<` hôm nay             |
| `ACTIVE`                | Đang áp dụng                  | `active`          | còn lại (gồm cả "Đến kỳ" để trống = chưa xác định kỳ kết thúc)    |

"Đã áp dụng" trong tài liệu này = `SCHEDULED` hoặc `ACTIVE`.

Badge nên hiển thị thẳng `displayStatusName` của BE. **Không** tự tính trạng thái ở FE.

### 2.4. Chênh lệch giữa UI mẫu hiện tại và BE

| UI mẫu (`types.ts`)                                 | BE                                                                                   | Cách xử lý                                                                         |
| :-------------------------------------------------- | :----------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- |
| `id`                                                | `publicId` (UUID)                                                                    | Dùng `publicId`                                                                    |
| `code` "1", "1.2"                                   | `displayOrder` (1, 2, 3...)                                                          | FE tự ghép: `${group.displayOrder}.${criteria.displayOrder}`                       |
| `RubricGroup.weight` (khi nhóm chưa có tiêu chí)    | Nhóm **không** có trọng số riêng; `totalWeight` = tổng tiêu chí con                  | Bỏ ô trọng số của nhóm. Nhóm không có tiêu chí → không áp dụng được               |
| Điểm tối đa = trọng số / 10                         | `maxScore` = `weight × 10 / 100` (VD 15% → 1.5)                                      | Hiển thị `maxScore` BE trả, không tự tính                                          |
| `validFrom`, `validTo` (ngày) nhập khi tạo          | A3 chỉ nhận `type`, `name`. Khoảng áp dụng là **học kỳ**: `fromSemester` ("Từ kỳ", bắt buộc) và `toSemester` ("Đến kỳ", được để trống), chọn ở A8, sửa ở A9 | Bỏ ô ngày khỏi dòng tạo mới; hộp thoại Áp dụng / Sửa kỳ có 2 ô chọn học kỳ (Mục 6.1). Cột "Thời gian áp dụng" hiển thị `fromSemester.name → toSemester?.name ?? 'Chưa xác định'` |
| `PendingRubricRow.sourceId` (nhân bản)              | A4 không nhận tên: bản sao lấy tên gốc, là Nháp, cùng loại, không chép khoảng kỳ     | Gọi A4 → nhận `publicId` mới → mở chi tiết để đổi tên rồi A5                       |
| `appliedSemesters[]` (tên kỳ + số SV đã chấm)       | Danh sách chỉ có `semesterCount` (số học kỳ đang gán) và `sheetCount` (số phiếu chấm). Tên các kỳ bị ảnh hưởng chỉ có trong A7 / A7b (`assignedSemesters`, `releasedSemesters`) | Hiển thị 2 con số; `SemesterPopover` chưa có dữ liệu chi tiết, chưa có số SV theo kỳ |
| `lastModifiedBy`, `lastModifiedAt`                  | `updatedByName`, `updatedAt` (`dd-MM-yyyy HH:mm:ss`)                                 | Map thẳng                                                                          |
| `RubricAssignResult` `already-graded`, `ChangeRubricDialog` | B2 đã bỏ; màn học kỳ chỉ xem (B1)                                            | Xóa nút "Đổi rubric", `ChangeRubricDialog` và mọi xử lý lỗi `3111`                 |
| `RubricAssignmentChange` (lịch sử, lý do)           | Không có                                                                             | Ẩn phần lịch sử / ô lý do                                                          |

---

## 3. Quy ước chung

- Response `{ code, message?, data? }`, `code = 1000` là thành công. Mọi lỗi trả body `{ code, message }`, không có `data`.
- Lỗi HTTP 4xx/5xx → interceptor tự toast đỏ, component **không** `toast.error` lại. Popup muốn tự hiện lỗi trên form thì gửi `{ skipErrorToast: true }`.
- Quyền: cả 12 API A1–A10, A7b, B1 **chỉ** cho role `HEAD_OF_MAJOR` (`@PreAuthorize("hasRole('HEAD_OF_MAJOR')")` ở Service). `ADMIN` cũng bị `403`.
  API danh sách học kỳ `GET /semester` thì mọi tài khoản đã đăng nhập đều gọi được.
- Chỉ dùng `publicId` (UUID string), không có `id` số. `{id}` trong B1 là **`publicId` của học kỳ**.
- Code `4000` dùng chung cho mọi lỗi dữ liệu nhập, FE phân biệt bằng `message`, không bằng `code`.
- **Học kỳ gửi lên bằng `publicId`** (`fromSemesterId`, `toSemesterId` – UUID string), không gửi ngày.
  Học kỳ trong response rubric luôn ở dạng rút gọn `SemesterRef = { publicId, name }`.
- Ngày nhận về (`startDate` / `endDate` của `GET /semester`): **`dd-MM-yyyy`** (VD `"01-12-2026"`); `createdAt` / `updatedAt`: `dd-MM-yyyy HH:mm:ss`.
- Trọng số (`weight`, `totalWeight`, `maxScore`) là `BigDecimal` → JSON số (VD `15`, `15.5`, `1.55`). Gửi lên dạng số, tối đa 2 chữ số thập phân.
- **Cờ bật / tắt nút do BE tính** (`canEdit`, `canApply`, `canChangeFromSemester`, `canChangeToSemester`, `canCancelApply`, `canDelete`, `isValid`).
  FE chỉ đọc cờ, không tự suy luận từ trạng thái. BE vẫn kiểm tra lại khi gọi nên cờ cũ vẫn an toàn (trả lỗi 409).
- Sau mọi thao tác ghi (A3–A6, A8–A10), tải lại danh sách A1 của loại đó và chi tiết A2 đang mở.

**Lỗi chung cho cả 12 API** (bảng lỗi riêng ở Mục 4–7 không nhắc lại):

| Trường hợp                                                         | HTTP | `code` | Message                                     | FE xử lý                                                                |
| :----------------------------------------------------------------- | :--- | :----- | :------------------------------------------ | :---------------------------------------------------------------------- |
| Chưa đăng nhập, access token hết hạn hoặc sai                      | 401  | 2000   | Phiên đăng nhập của bạn đã hết hạn          | Interceptor tự gọi `/refresh-token` rồi gửi lại; thất bại → về `/login` |
| Không phải `HEAD_OF_MAJOR`                                         | 403  | 2001   | Bạn không có quyền truy cập (access denied) | Toast đỏ                                                                |
| `publicId` trên URL, `fromSemesterId` / `toSemesterId` không phải UUID | 400  | 1006   | Yêu cầu không hợp lệ                        | Toast đỏ (không ra 404)                                                 |
| `type` (query A1, body A3) sai giá trị enum                        | 400  | 1006   | Yêu cầu không hợp lệ                        | Toast đỏ                                                                |
| Body hỏng / thiếu, field sai kiểu                                  | 400  | 1006   | Yêu cầu không hợp lệ                        | Toast đỏ                                                                |
| Sai HTTP method (ví dụ `PUT` thay cho `PATCH` ở A9, hay `PUT` B1 cũ) | 405  | 1007   | Hệ thống không cấp phép                     | Toast đỏ                                                                |
| URL không khớp API nào                                             | 404  | 1005   | Thông tin không có sẵn                      | Toast đỏ                                                                |
| Lỗi không lường trước ở BE                                         | 500  | 1001   | Hệ thống không phản hồi                     | Toast đỏ                                                                |

**Lỗi nào trả trước:** 401 trả trước mọi lỗi khác. 403 chỉ được kiểm tra khi request vào tới Service, nên các lỗi ở tầng
Controller (`1006` / `1007` / `1005` ở bảng trên, lỗi validate `4000` của body) trả về **trước** 403.

**Bảng mã lỗi nghiệp vụ của rubric** (Mục 4–7 chỉ ghi mã, tra message ở đây):

| `code` | Tên (`ErrorCode`)                                  | HTTP | Message                                                                                                                       |
| :----- | :------------------------------------------------- | :--- | :---------------------------------------------------------------------------------------------------------------------------- |
| 3101   | `EVALUATION_TEMPLATE_NOT_FOUND`                    | 404  | Không tìm thấy rubric chấm điểm                                                                                               |
| 3102   | `EVALUATION_TEMPLATE_NOT_EDITABLE`                 | 409  | Chỉ được sửa nội dung rubric Nháp, hoặc rubric đã áp dụng (chưa hết áp dụng) mà chưa có phiếu chấm. Muốn thay đổi, hãy nhân bản để tạo rubric mới |
| 3103   | `EVALUATION_TEMPLATE_NOT_READY_TO_APPLY`           | 400  | Rubric chưa đủ điều kiện áp dụng: tổng trọng số phải đúng 100% và mỗi nhóm có ít nhất 1 tiêu chí                              |
| 3106   | `EVALUATION_TEMPLATE_HAS_SHEETS`                   | 409  | Rubric đã có phiếu chấm sử dụng, không thể thay đổi                                                                           |
| 3107   | `EVALUATION_TEMPLATE_NOT_DRAFT`                    | 409  | Chỉ được xóa hoặc áp dụng rubric Nháp                                                                                         |
| 3108   | `EVALUATION_TEMPLATE_IN_USE`                       | 409  | Rubric đang được học kỳ hoặc phiếu chấm sử dụng, không thể xóa                                                                |
| 3109   | `EVALUATION_TEMPLATE_VERSION_CONFLICT`             | 409  | Rubric đã được người khác cập nhật, vui lòng tải lại trang trước khi lưu                                                      |
| 3113   | `EVALUATION_TREE_ITEM_INVALID`                     | 400  | Nhóm tiêu chí hoặc tiêu chí không thuộc rubric này, hoặc bị gửi trùng                                                         |
| 3123   | `EVALUATION_TEMPLATE_FROM_SEMESTER_ENDED`          | 400  | "Từ kỳ" phải là học kỳ chưa kết thúc                                                                                          |
| 3124   | `EVALUATION_TEMPLATE_SEMESTER_RANGE_INVALID`       | 400  | "Đến kỳ" không được bắt đầu trước "Từ kỳ"                                                                                     |
| 3125   | `EVALUATION_TEMPLATE_SEMESTER_OVERLAP`             | 409  | **Message động**, VD: `Khoảng học kỳ bị trùng với rubric "Rubric phản biện 2026" (HK1 2026-2027 → chưa xác định). Hãy sửa "Đến kỳ" của rubric đó trước` |
| 3126   | `EVALUATION_TEMPLATE_SEMESTER_HAS_SHEETS_EXCLUDED` | 409  | **Message động**, VD: `Không thể bỏ học kỳ đã có phiếu chấm ra khỏi khoảng áp dụng của rubric: HK2 2026-2027`                 |
| 3127   | `EVALUATION_TEMPLATE_NOT_APPLIED_STATUS`           | 409  | Chỉ được sửa kỳ áp dụng hoặc hủy áp dụng rubric Sắp áp dụng / Đang áp dụng                                                    |
| 4041   | `SEMESTER_NOT_FOUND`                               | 404  | Không tìm thấy học kỳ yêu cầu                                                                                                 |

3125 / 3126 có message do BE ghép (nêu tên rubric / tên học kỳ) → FE hiển thị nguyên `message`, **không** tự dịch theo `code`.

Các mã cũ **đã bị xóa** khỏi BE, FE bỏ mọi xử lý liên quan: `3104`, `3105`, `3110`, `3111`, `3112`, `3114`,
key `EVALUATION_EFFECTIVE_FROM_NULL`, `EVALUATION_TEMPLATE_PUBLIC_ID_REQUIRED`.

Lỗi validate (đều `400`, `code = 4000`):

| Key                                      | Message                                                                     | Field                         |
| :--------------------------------------- | :-------------------------------------------------------------------------- | :---------------------------- |
| `EVALUATION_TYPE_NULL`                   | Vui lòng chọn loại phiếu chấm                                               | `type` (A3)                   |
| `EVALUATION_TEMPLATE_NAME_EMPTY`         | Tên rubric không được để trống                                              | `name` (A3, A5)               |
| `EVALUATION_TEMPLATE_NAME_TOO_LONG`      | Tên rubric tối đa 255 ký tự                                                 | `name`                        |
| `EVALUATION_TEMPLATE_VERSION_NULL`       | Thiếu phiên bản rubric, vui lòng tải lại trang                              | `version` (A5)                |
| `EVALUATION_FROM_SEMESTER_NULL`          | Vui lòng chọn "Từ kỳ"                                                       | `fromSemesterId` (A7, A8, A9) |
| `EVALUATION_GROUP_NAME_EMPTY`            | Tên nhóm tiêu chí không được để trống                                       | `groups[].name`               |
| `EVALUATION_GROUP_NAME_TOO_LONG`         | Tên nhóm tiêu chí tối đa 255 ký tự                                          | `groups[].name`               |
| `EVALUATION_CRITERIA_NAME_EMPTY`         | Tên tiêu chí không được để trống                                            | `groups[].criteria[].name`    |
| `EVALUATION_CRITERIA_NAME_TOO_LONG`      | Tên tiêu chí tối đa 500 ký tự                                               | `groups[].criteria[].name`    |
| `EVALUATION_CRITERIA_WEIGHT_NULL`        | Trọng số tiêu chí không được để trống                                       | `groups[].criteria[].weight`  |
| `EVALUATION_CRITERIA_WEIGHT_INVALID`     | Trọng số tiêu chí phải lớn hơn 0%, tối đa 100% và tối đa 2 chữ số thập phân | `groups[].criteria[].weight`  |

---

## 4. Danh sách và chi tiết rubric

### 4.1. `GET /evaluation-template?type=` – Danh sách rubric theo loại (A1)

| Query  | Bắt buộc | Mặc định  | Ghi chú                              |
| :----- | :------- | :-------- | :----------------------------------- |
| `type` | Không    | `ADVISOR` | `ADVISOR` / `EXAMINER` / `COUNCIL`   |

**Không phân trang**, trả toàn bộ rubric của loại đó (`data` là mảng). Thứ tự BE trả: rubric Nháp ở đầu, sau đó theo
ngày bắt đầu của "Từ kỳ" **giảm dần** (rubric mới nhất ở trên). FE giữ nguyên thứ tự này.

```ts
const res = await apiClient.get<ApiResponse<EvaluationTemplateSummary[]>>(RUBRIC.base, {
  params: { type: 'EXAMINER' },
})
```

Response:

```json
{
  "code": 1000,
  "data": [
    {
      "publicId": "0193b0f2-6c1e-7a52-9d1f-2b8a4c1e9f01",
      "name": "Rubric phản biện 2026",
      "type": "EXAMINER",
      "fromSemester": { "publicId": "0193a000-0000-7000-8000-000000000101", "name": "HK1 2026-2027" },
      "toSemester": null,
      "displayStatus": "ACTIVE",
      "displayStatusName": "Đang áp dụng",
      "totalWeight": 100,
      "criteriaCount": 8,
      "isValid": true,
      "semesterCount": 2,
      "sheetCount": 37,
      "canDelete": false,
      "updatedByName": "Nguyễn Văn A",
      "updatedAt": "15-11-2026 09:30:12"
    }
  ]
}
```

| Field                         | Ý nghĩa                                                                         |
| :---------------------------- | :------------------------------------------------------------------------------ |
| `fromSemester`                | "Từ kỳ" `{ publicId, name }`; `null` = Nháp                                     |
| `toSemester`                  | "Đến kỳ" `{ publicId, name }`; `null` = chưa xác định kỳ kết thúc (hoặc Nháp)  |
| `totalWeight`                 | Tổng trọng số % mọi tiêu chí                                                    |
| `criteriaCount`               | Số tiêu chí (cấp 2)                                                             |
| `isValid`                     | Cây đủ điều kiện áp dụng (có nhóm, nhóm nào cũng có tiêu chí, tổng đúng 100%)   |
| `semesterCount`, `sheetCount` | Số học kỳ đang gán rubric / số phiếu chấm đã dùng rubric                        |
| `canDelete`                   | Hiện nút Xóa                                                                    |

> Field JSON có giá trị `null` có thể bị BE **ẩn khỏi JSON** thay vì trả `null`. FE đọc bằng `?.` / `?? null`, không dựa vào `'field' in obj`.

Lỗi riêng: không có (ngoài bảng lỗi chung).

### 4.2. `GET /evaluation-template/{publicId}` – Chi tiết rubric (A2)

```json
{
  "code": 1000,
  "data": {
    "publicId": "0193b0f2-6c1e-7a52-9d1f-2b8a4c1e9f01",
    "name": "Rubric phản biện 2027",
    "type": "EXAMINER",
    "fromSemester": null,
    "toSemester": null,
    "displayStatus": "DRAFT",
    "displayStatusName": "Nháp",
    "version": 3,
    "totalWeight": 90,
    "criteriaCount": 2,
    "semesterCount": 0,
    "sheetCount": 0,
    "canEdit": true,
    "canApply": false,
    "applyBlockedReason": "Tổng trọng số hiện là 90%, cần đúng 100%",
    "canChangeFromSemester": false,
    "canChangeToSemester": false,
    "canCancelApply": false,
    "canDelete": true,
    "createdByName": "Nguyễn Văn A",
    "updatedByName": "Nguyễn Văn A",
    "createdAt": "10-11-2026 08:00:00",
    "updatedAt": "15-11-2026 09:30:12",
    "groups": [
      {
        "publicId": "0193b0f2-7000-7a52-9d1f-000000000001",
        "displayOrder": 1,
        "name": "Hình thức báo cáo",
        "totalWeight": 30,
        "maxScore": 3,
        "criteria": [
          {
            "publicId": "0193b0f2-7000-7a52-9d1f-000000000011",
            "displayOrder": 1,
            "name": "Bố cục, trình bày",
            "weight": 30,
            "maxScore": 3
          }
        ]
      },
      {
        "publicId": "0193b0f2-7000-7a52-9d1f-000000000002",
        "displayOrder": 2,
        "name": "Nội dung",
        "totalWeight": 60,
        "maxScore": 6,
        "criteria": [
          {
            "publicId": "0193b0f2-7000-7a52-9d1f-000000000021",
            "displayOrder": 1,
            "name": "Giải quyết vấn đề",
            "weight": 60,
            "maxScore": 6
          }
        ]
      }
    ]
  }
}
```

**Cờ thao tác → nút trên UI:**

| Cờ                       | Nút                                    | Điều kiện BE                                                                   |
| :----------------------- | :------------------------------------- | :----------------------------------------------------------------------------- |
| `canEdit`                | Sửa tên / thêm-xóa-sửa nhóm, tiêu chí  | `DRAFT`, hoặc đã áp dụng (`SCHEDULED` / `ACTIVE`) và chưa có phiếu chấm        |
| `canApply`               | Áp dụng                                | `DRAFT` và cây hợp lệ                                                          |
| `applyBlockedReason`     | Tooltip khi nút Áp dụng bị tắt         | Chỉ có khi `DRAFT` và cây chưa hợp lệ; còn lại `null`                          |
| `canChangeFromSemester`  | Ô "Từ kỳ" trong hộp thoại Sửa kỳ áp dụng được chọn | Đã áp dụng và chưa có phiếu chấm                                   |
| `canChangeToSemester`    | Nút "Sửa kỳ áp dụng" (ô "Đến kỳ")      | Đã áp dụng (kể cả đã có phiếu chấm)                                            |
| `canCancelApply`         | Hủy áp dụng                            | Đã áp dụng và chưa có phiếu chấm                                               |
| `canDelete`              | Xóa                                    | `DRAFT` và không học kỳ / phiếu chấm nào trỏ tới                               |
| (luôn bật)               | Nhân bản                               | Mọi trạng thái                                                                 |

- Nút "Sửa kỳ áp dụng" hiện khi `canChangeToSemester = true`. Trong hộp thoại, ô "Từ kỳ" **khóa** (chỉ hiện kỳ hiện tại)
  khi `canChangeFromSemester = false` (rubric đã có phiếu chấm); khi đó chỉ sửa được "Đến kỳ".
- `applyBlockedReason` trả theo thứ tự ưu tiên: chưa có nhóm nào → có nhóm chưa có tiêu chí → tổng trọng số khác 100%.
- Rubric `EXPIRED`, hoặc đã có phiếu chấm (`canEdit = false`): chỉ xem nội dung, muốn sửa thì **Nhân bản** rồi sửa bản Nháp.
  Rubric đã có phiếu chấm mà chưa Hết áp dụng vẫn sửa được "Đến kỳ" (A9).

Lỗi riêng: `404 3101`.

---

## 5. Tạo, nhân bản, lưu, xóa

### 5.1. `POST /evaluation-template` – Tạo rubric Nháp trống (A3)

Body:

```json
{ "type": "ADVISOR", "name": "Rubric hướng dẫn 2027" }
```

| Field  | Bắt buộc | Ràng buộc                                    |
| :----- | :------- | :------------------------------------------- |
| `type` | Có       | `ADVISOR` / `EXAMINER` / `COUNCIL`           |
| `name` | Có       | Không rỗng (sau khi trim), tối đa 255 ký tự  |

Response: `data` là **`publicId` của rubric mới** (string UUID) → dùng để mở chi tiết ngay.

```json
{ "code": 1000, "message": "Thêm mới thành công", "data": "0193b0f2-6c1e-7a52-9d1f-2b8a4c1e9f02" }
```

Lỗi riêng: `400 4000` (`EVALUATION_TYPE_NULL`, `EVALUATION_TEMPLATE_NAME_EMPTY`, `EVALUATION_TEMPLATE_NAME_TOO_LONG`).

### 5.2. `POST /evaluation-template/{publicId}/clone` – Nhân bản (A4)

Không có body. Bản sao: cùng loại, cùng tên, chép nhóm + tiêu chí (giữ thứ tự, trọng số), **luôn là Nháp**, không chép khoảng học kỳ.

```json
{ "code": 1000, "message": "Nhân bản thành công", "data": "0193b0f2-6c1e-7a52-9d1f-2b8a4c1e9f03" }
```

Lỗi riêng: `404 3101`.

### 5.3. `PUT /evaluation-template/{publicId}` – Lưu tên + toàn bộ cây (A5)

Chỉ gọi khi `canEdit = true`. Gửi **toàn bộ** cây sau khi sửa (không phải từng thay đổi lẻ). BE so sánh theo `publicId`:

| Trường hợp trong body                             | BE xử lý                         |
| :------------------------------------------------ | :------------------------------- |
| Nhóm / tiêu chí có `publicId`                     | Sửa phần tử cũ                   |
| Nhóm / tiêu chí `publicId: null` (hoặc bỏ field)  | Thêm mới                         |
| Nhóm / tiêu chí cũ không còn trong body           | Xóa                              |
| Thứ tự phần tử trong mảng                         | Là thứ tự hiển thị (BE đánh lại `displayOrder` 1, 2, 3...) |

Một tiêu chí **có thể chuyển nhóm**: giữ `publicId` của tiêu chí, đặt nó vào mảng `criteria` của nhóm khác.

Body:

```json
{
  "name": "Rubric phản biện 2027",
  "version": 3,
  "groups": [
    {
      "publicId": "0193b0f2-7000-7a52-9d1f-000000000001",
      "name": "Hình thức báo cáo",
      "criteria": [
        { "publicId": "0193b0f2-7000-7a52-9d1f-000000000011", "name": "Bố cục, trình bày", "weight": 30 }
      ]
    },
    {
      "publicId": null,
      "name": "Nội dung",
      "criteria": [
        { "publicId": null, "name": "Giải quyết vấn đề", "weight": 55.5 },
        { "publicId": null, "name": "Tính mới", "weight": 14.5 }
      ]
    }
  ]
}
```

| Field                         | Bắt buộc | Ràng buộc                                                       |
| :---------------------------- | :------- | :-------------------------------------------------------------- |
| `name`                        | Có       | Không rỗng, tối đa 255                                          |
| `version`                     | Có       | Lấy đúng `version` từ A2 lần tải gần nhất                       |
| `groups`                      | Không    | Mảng, có thể rỗng                                               |
| `groups[].publicId`           | Không    | `null` = nhóm mới                                               |
| `groups[].name`               | Có       | Không rỗng, tối đa 255                                          |
| `groups[].criteria`           | Không    | Mảng, có thể rỗng                                               |
| `groups[].criteria[].publicId`| Không    | `null` = tiêu chí mới                                           |
| `groups[].criteria[].name`    | Có       | Không rỗng, tối đa 500                                          |
| `groups[].criteria[].weight`  | Có       | `> 0`, `≤ 100`, tối đa 2 chữ số thập phân                       |

**Rubric Nháp được lưu dở dang** (chưa đủ 100%, có nhóm trống) – chỉ bị chặn lúc bấm Áp dụng.
**Rubric đã áp dụng** (Sắp áp dụng / Đang áp dụng, chưa có phiếu chấm) phải luôn hợp lệ khi lưu (vì đang / sắp được dùng để chấm) → không hợp lệ trả `3103`.

```json
{ "code": 1000, "message": "Cập nhật thành công" }
```

Sau khi lưu thành công **phải tải lại A2** để lấy `version` mới và `publicId` của phần tử vừa thêm; lưu lần 2 bằng `version` cũ sẽ bị `3109`.

Lỗi riêng (đúng thứ tự BE kiểm tra):

| Trường hợp                                                        | HTTP | `code` | FE xử lý                                                                   |
| :---------------------------------------------------------------- | :--- | :----- | :------------------------------------------------------------------------- |
| Lỗi validate field (bảng 4000 ở Mục 3)                            | 400  | 4000   | Hiện lỗi trên form                                                          |
| Không tìm thấy rubric                                             | 404  | 3101   | Toast, đóng màn chi tiết, tải lại A1                                       |
| Rubric không sửa được (Hết áp dụng, hoặc đã có phiếu chấm)        | 409  | 3102   | Toast, tải lại A2 (chuyển sang chế độ xem), gợi ý Nhân bản                 |
| `version` lệch (người khác vừa lưu, hoặc chưa tải lại sau lần lưu trước) | 409  | 3109   | Hỏi "Tải lại trang?" → tải lại A2 (mất thay đổi chưa lưu)           |
| Rubric đã áp dụng mà cây không hợp lệ                             | 400  | 3103   | Giữ form, hiện lỗi                                                          |
| `publicId` nhóm / tiêu chí không thuộc rubric này, hoặc gửi trùng | 400  | 3113   | Lỗi FE ghép body → tải lại A2                                              |

### 5.4. `DELETE /evaluation-template/{publicId}` – Xóa rubric Nháp (A6)

Xóa cứng (cả nhóm, tiêu chí). Chỉ hiện nút khi `canDelete = true`. Nên hỏi xác nhận trước.

```json
{ "code": 1000, "message": "Xóa thành công" }
```

| Trường hợp                                   | HTTP | `code` |
| :------------------------------------------- | :--- | :----- |
| Không tìm thấy                               | 404  | 3101   |
| Không phải Nháp                              | 409  | 3107   |
| Có học kỳ hoặc phiếu chấm trỏ tới            | 409  | 3108   |

### 5.5. Schema zod gợi ý

```ts
// utils/rubricSchema.ts
import { z } from 'zod'

export const createRubricSchema = z.object({
  type: z.enum(['ADVISOR', 'EXAMINER', 'COUNCIL']),
  name: z.string().trim().min(1, 'Tên rubric không được để trống').max(255, 'Tên rubric tối đa 255 ký tự'),
})

const criteriaSchema = z.object({
  publicId: z.string().uuid().nullable(),
  name: z.string().trim().min(1, 'Tên tiêu chí không được để trống').max(500, 'Tên tiêu chí tối đa 500 ký tự'),
  weight: z
    .number({ invalid_type_error: 'Trọng số tiêu chí không được để trống' })
    .gt(0, 'Trọng số tiêu chí phải lớn hơn 0%')
    .max(100, 'Trọng số tiêu chí tối đa 100%')
    .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-9, 'Trọng số tối đa 2 chữ số thập phân'),
})

const groupSchema = z.object({
  publicId: z.string().uuid().nullable(),
  name: z.string().trim().min(1, 'Tên nhóm tiêu chí không được để trống').max(255, 'Tên nhóm tiêu chí tối đa 255 ký tự'),
  criteria: z.array(criteriaSchema),
})

// Dùng khi lưu (A5). Không ép tổng 100% vì rubric Nháp được lưu dở dang
export const saveRubricSchema = z.object({
  name: z.string().trim().min(1, 'Tên rubric không được để trống').max(255, 'Tên rubric tối đa 255 ký tự'),
  version: z.number(),
  groups: z.array(groupSchema),
})

// Hộp thoại Áp dụng (A8) / Sửa kỳ áp dụng (A9)
export const semesterRangeSchema = z.object({
  fromSemesterId: z.string({ required_error: 'Vui lòng chọn "Từ kỳ"' }).uuid('Vui lòng chọn "Từ kỳ"'),
  // để trống = chưa xác định kỳ kết thúc
  toSemesterId: z.string().uuid().nullable(),
})

// Hiển thị cảnh báo "Tổng: 90% / 100%" ở FE (chỉ để báo sớm, BE vẫn là nguồn chuẩn)
export const sumWeight = (groups: z.infer<typeof groupSchema>[]) =>
  Math.round(groups.flatMap((g) => g.criteria).reduce((s, c) => s + c.weight, 0) * 100) / 100
```

Với rubric đã áp dụng (`SCHEDULED` / `ACTIVE`), FE nên chặn nút Lưu khi `sumWeight !== 100` hoặc có nhóm không có tiêu chí (tránh `3103`).

---

## 6. Vòng đời áp dụng

### 6.0. Luồng trên UI

```
            A8 Áp dụng (chọn Từ kỳ, Đến kỳ)        tới ngày bắt đầu "Từ kỳ"        qua ngày kết thúc "Đến kỳ"
Nháp ───────────────────────────────► Sắp áp dụng ─────────────────────► Đang áp dụng ─────────────────────► Hết áp dụng
  ▲                                     │  ▲                               │  ▲                              (chỉ xem, nhân bản)
  │                         A9 Sửa kỳ ──┘  │                   A9 Sửa kỳ ──┘  │
  └──────── A10 Hủy áp dụng (chưa có phiếu chấm) ──────────────────────────────┘
```

Quy tắc khoảng học kỳ (BE kiểm tra, thứ tự học kỳ so theo ngày bắt đầu):

| Mã   | Quy tắc                                                                                                    | Lỗi    |
| :--- | :--------------------------------------------------------------------------------------------------------- | :----- |
| –    | Rubric đã có phiếu chấm thì **không đổi được "Từ kỳ"** (chỉ sửa được "Đến kỳ")                              | `3106` |
| R1   | "Từ kỳ" mới chọn phải là học kỳ **chưa kết thúc** (kỳ đang diễn ra hoặc sắp tới). Chỉ xét khi "Từ kỳ" thay đổi: rubric Đang áp dụng có "Từ kỳ" đã kết thúc vẫn sửa được "Đến kỳ" | `3123` |
| R2   | "Đến kỳ" (nếu chọn) không được bắt đầu trước "Từ kỳ". Chọn "Đến kỳ" = "Từ kỳ" là hợp lệ (áp dụng đúng 1 kỳ) | `3124` |
| R3   | Khoảng không được **giao** với khoảng của rubric khác **cùng loại** đã áp dụng, kể cả rubric Hết áp dụng. BE **không** tự cắt khoảng của rubric kia | `3125` |
| R4   | Được phép có học kỳ không thuộc khoảng rubric nào (học kỳ không có rubric loại đó)                          | –      |
| R5   | Rubric đã có phiếu chấm: học kỳ đã có phiếu chấm không được rời khỏi khoảng mới                             | `3126` |

Hệ quả cho UI:
- Mỗi loại phiếu có tối đa **1** rubric "Đến kỳ" để trống. Muốn áp dụng rubric mới khi rubric cũ đang để trống "Đến kỳ":
  **sửa "Đến kỳ" của rubric cũ trước** (A9), rồi mới Áp dụng rubric mới. Message `3125` đã nêu tên rubric cần sửa.
- Sau A8 / A9 / A10, BE tự đồng bộ rubric của học kỳ: kỳ thuộc khoảng → trỏ tới rubric này; kỳ rời khỏi khoảng → không còn rubric.
  Học kỳ đã có phiếu chấm loại đó giữ nguyên rubric.

### 6.1. Danh sách học kỳ cho ô chọn "Từ kỳ" / "Đến kỳ"

Dùng API học kỳ có sẵn `GET /semester` (trả `PageResponse<SemesterResponse>`):

```ts
const res = await apiClient.get<ApiResponse<PageResponse<SemesterOption>>>(RUBRIC.semesterList, {
  params: { page: 0, size: 100, sortBy: 'startDate', sortDir: 'ASC' },
})
const semesters = res.data.data?.content ?? []
```

| Field dùng             | Kiểu / định dạng                                   | Dùng để                                           |
| :--------------------- | :------------------------------------------------- | :------------------------------------------------ |
| `publicId`             | UUID                                               | Giá trị gửi lên `fromSemesterId` / `toSemesterId` |
| `name`                 | string                                             | Nhãn trong `<select>`                             |
| `startDate`, `endDate` | `dd-MM-yyyy`                                       | Lọc / sắp xếp ô "Đến kỳ"                          |
| `statusCode`           | `UPCOMING` / `ONGOING` / `COMPLETED`               | Lọc ô "Từ kỳ"                                     |
| `status`               | Tên trạng thái tiếng Việt                          | Hiển thị phụ bên cạnh tên kỳ                      |

Gợi ý lọc (chỉ để chặn sớm, BE vẫn kiểm tra lại):
- Ô **"Từ kỳ"** (bắt buộc): chỉ hiện kỳ có `statusCode !== 'COMPLETED'` (R1). Khi Sửa kỳ áp dụng mà "Từ kỳ" hiện tại đã kết thúc
  thì vẫn giữ kỳ đó trong danh sách để hiện giá trị đang chọn.
- Ô **"Đến kỳ"** (không bắt buộc): option đầu tiên "Chưa xác định" (gửi `null`), sau đó các kỳ có `startDate ≥ startDate`
  của "Từ kỳ" đã chọn (R2). Đổi "Từ kỳ" làm "Đến kỳ" đang chọn không còn hợp lệ → reset về "Chưa xác định".
- So sánh ngày: tự chuyển `dd-MM-yyyy` sang `yyyyMMdd` (`d.split('-').reverse().join('')`) rồi so sánh chuỗi.

### 6.2. `GET /evaluation-template/{publicId}/apply-preview?fromSemesterId=&toSemesterId=` – Xem trước Áp dụng / Sửa kỳ (A7)

Gọi mỗi khi người dùng đổi lựa chọn trong hộp thoại **Áp dụng** (rubric Nháp) hoặc **Sửa kỳ áp dụng** (rubric đã áp dụng),
trước khi bấm xác nhận. Không ghi gì vào DB. Lỗi khoảng kỳ trả **giống hệt** khi lưu → hiện ngay dưới 2 ô chọn.

| Query            | Bắt buộc | Ghi chú                                              |
| :--------------- | :------- | :--------------------------------------------------- |
| `fromSemesterId` | Có       | `publicId` học kỳ "Từ kỳ"                            |
| `toSemesterId`   | Không    | `publicId` học kỳ "Đến kỳ"; bỏ trống = chưa xác định |

```ts
const res = await apiClient.get<ApiResponse<ApplyPreview>>(RUBRIC.applyPreview(publicId), {
  params: { fromSemesterId, toSemesterId: toSemesterId ?? undefined },
  skipErrorToast: true, // hiện lỗi ngay dưới ô chọn kỳ
})
```

```json
{
  "code": 1000,
  "data": {
    "fromSemester": { "publicId": "0193a000-0000-7000-8000-000000000102", "name": "HK2 2026-2027" },
    "toSemester": null,
    "assignedSemesters": [
      { "publicId": "0193a000-0000-7000-8000-000000000102", "name": "HK2 2026-2027" },
      { "publicId": "0193a000-0000-7000-8000-000000000103", "name": "HK1 2027-2028" }
    ],
    "releasedSemesters": []
  }
}
```

| Field                        | Ý nghĩa / câu hiển thị gợi ý                                                                                      |
| :--------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| `fromSemester`, `toSemester` | Khoảng đang xem trước. "Áp dụng từ **{from}** đến **{to ?? 'chưa xác định'}**"                                    |
| `assignedSemesters`          | Học kỳ **mới vào** khoảng → sẽ dùng rubric này. "Các học kỳ sẽ dùng rubric này: {tên, ...}"                        |
| `releasedSemesters`          | Học kỳ đang dùng rubric này mà **rời khỏi** khoảng (chỉ có khi Sửa kỳ) → sẽ không còn rubric loại này. "Các học kỳ sẽ không còn rubric: {tên, ...}" |

2 danh sách sắp theo ngày bắt đầu tăng dần; rỗng thì ẩn dòng tương ứng.

Lỗi riêng (đúng thứ tự BE kiểm tra):

| Trường hợp                                                     | HTTP | `code`                                 |
| :------------------------------------------------------------- | :--- | :------------------------------------- |
| Không tìm thấy rubric                                          | 404  | 3101                                   |
| Rubric Hết áp dụng                                             | 409  | 3127                                   |
| Rubric Nháp mà cây chưa hợp lệ                                 | 400  | 3103                                   |
| Thiếu `fromSemesterId`                                         | 400  | 4000 (`EVALUATION_FROM_SEMESTER_NULL`) |
| Học kỳ `fromSemesterId` / `toSemesterId` không tồn tại         | 404  | 4041                                   |
| Đổi "Từ kỳ" của rubric đã có phiếu chấm                        | 409  | 3106                                   |
| "Từ kỳ" đã kết thúc (R1)                                       | 400  | 3123                                   |
| "Đến kỳ" bắt đầu trước "Từ kỳ" (R2)                            | 400  | 3124                                   |
| Trùng khoảng với rubric khác cùng loại (R3)                    | 409  | 3125                                   |
| Bỏ học kỳ đã có phiếu chấm ra khỏi khoảng (R5)                 | 409  | 3126                                   |

### 6.3. `GET /evaluation-template/{publicId}/cancel-apply-preview` – Xem trước Hủy áp dụng (A7b)

Gọi khi mở hộp thoại xác nhận **Hủy áp dụng**. Không có query, không ghi DB. Cùng kiểu response với A7:
`fromSemester`, `toSemester` không có (null, bị ẩn khỏi JSON), `assignedSemesters = []`, `releasedSemesters` = các học kỳ thuộc khoảng hiện tại.

```json
{
  "code": 1000,
  "data": {
    "assignedSemesters": [],
    "releasedSemesters": [
      { "publicId": "0193a000-0000-7000-8000-000000000102", "name": "HK2 2026-2027" }
    ]
  }
}
```

Câu gợi ý: "Rubric sẽ về Nháp. Các học kỳ sau sẽ không còn rubric {loại phiếu}: {tên, ...}".

Lỗi riêng: `404 3101`, `409 3127` (không phải Sắp / Đang áp dụng), `409 3106` (đã có phiếu chấm).

### 6.4. `POST /evaluation-template/{publicId}/apply` – Áp dụng (A8)

Chỉ cho rubric Nháp có `canApply = true`. Body:

```json
{ "fromSemesterId": "0193a000-0000-7000-8000-000000000102", "toSemesterId": null }
```

| Field            | Bắt buộc | Ghi chú                                         |
| :--------------- | :------- | :---------------------------------------------- |
| `fromSemesterId` | Có       | "Từ kỳ"                                         |
| `toSemesterId`   | Không    | "Đến kỳ"; `null` / bỏ field = chưa xác định     |

```json
{ "code": 1000, "message": "Áp dụng thành công" }
```

Sau khi thành công: rubric chuyển `SCHEDULED` (hoặc `ACTIVE` nếu "Từ kỳ" đang diễn ra). Rubric khác **không** bị đổi
(BE không tự cắt khoảng). Tải lại A1, A2 và B1 (nếu đang mở).

Lỗi riêng (đúng thứ tự BE kiểm tra):

| Trường hợp                                                    | HTTP      | `code`             |
| :------------------------------------------------------------ | :-------- | :----------------- |
| Thiếu `fromSemesterId`                                        | 400       | 4000               |
| Không tìm thấy                                                | 404       | 3101               |
| Không phải Nháp                                               | 409       | 3107               |
| Cây chưa hợp lệ                                               | 400       | 3103               |
| Học kỳ không tồn tại                                          | 404       | 4041               |
| Khoảng kỳ sai (R1 / R2 / R3)                                  | 400 / 409 | 3123 / 3124 / 3125 |
| Người khác vừa sửa rubric / áp dụng cùng lúc                  | 409       | 3109               |

### 6.5. `PATCH /evaluation-template/{publicId}/semester-range` – Sửa kỳ áp dụng (A9)

Chỉ khi `canChangeToSemester = true` (rubric Sắp / Đang áp dụng). Body giống A8.
Rubric đã có phiếu chấm (`canChangeFromSemester = false`): gửi lại đúng `fromSemesterId` hiện tại, chỉ đổi `toSemesterId`.

```json
{ "fromSemesterId": "0193a000-0000-7000-8000-000000000101", "toSemesterId": "0193a000-0000-7000-8000-000000000102" }
```

BE gán rubric cho kỳ mới vào khoảng và bỏ rubric khỏi kỳ rời khoảng (như `assignedSemesters` / `releasedSemesters` ở A7).

```json
{ "code": 1000, "message": "Cập nhật thành công" }
```

Lỗi riêng (đúng thứ tự BE kiểm tra):

| Trường hợp                                            | HTTP      | `code`             |
| :---------------------------------------------------- | :-------- | :----------------- |
| Thiếu `fromSemesterId`                                | 400       | 4000               |
| Không tìm thấy                                        | 404       | 3101               |
| Không phải Sắp / Đang áp dụng (là Nháp / Hết áp dụng) | 409       | 3127               |
| Học kỳ không tồn tại                                  | 404       | 4041               |
| Đổi "Từ kỳ" khi đã có phiếu chấm                      | 409       | 3106               |
| Khoảng kỳ sai (R1 / R2 / R3)                          | 400 / 409 | 3123 / 3124 / 3125 |
| Bỏ học kỳ đã có phiếu chấm ra khỏi khoảng (R5)        | 409       | 3126               |
| Xung đột cập nhật đồng thời                           | 409       | 3109               |

### 6.6. `POST /evaluation-template/{publicId}/cancel-apply` – Hủy áp dụng (A10)

Chỉ khi `canCancelApply = true`. Không có body. Nên mở hộp thoại xác nhận có dữ liệu A7b trước. Kết quả:
- Rubric về **Nháp** (`fromSemester = toSemester = null`).
- Các học kỳ đang trỏ tới rubric này về **không có rubric** loại đó. BE **không** tự gán rubric khác, **không** mở lại rubric nào.

```json
{ "code": 1000, "message": "Hủy áp dụng thành công" }
```

Lỗi riêng: `404 3101`, `409 3127`, `409 3106`, `409 3109`.

---

## 7. Rubric của học kỳ

### 7.1. `GET /semester/{semesterPublicId}/evaluation-template` – 3 rubric của học kỳ (B1, chỉ xem)

Luôn trả **đúng 3 dòng** theo thứ tự `ADVISOR`, `EXAMINER`, `COUNCIL`. Học kỳ chưa có rubric loại nào thì các field rubric
của dòng đó là `null` (có thể bị ẩn khỏi JSON).

```json
{
  "code": 1000,
  "data": [
    {
      "evaluationType": "ADVISOR",
      "evaluationTypeName": "Phiếu hướng dẫn",
      "templatePublicId": "0193b0f2-6c1e-7a52-9d1f-2b8a4c1e9f05",
      "templateName": "Rubric hướng dẫn 2026",
      "fromSemester": { "publicId": "0193a000-0000-7000-8000-000000000101", "name": "HK1 2026-2027" },
      "toSemester": null,
      "displayStatus": "ACTIVE",
      "displayStatusName": "Đang áp dụng"
    },
    {
      "evaluationType": "EXAMINER",
      "evaluationTypeName": "Phiếu phản biện"
    },
    {
      "evaluationType": "COUNCIL",
      "evaluationTypeName": "Phiếu hội đồng",
      "templatePublicId": "0193b0f2-6c1e-7a52-9d1f-2b8a4c1e9f07",
      "templateName": "Rubric hội đồng 2026",
      "fromSemester": { "publicId": "0193a000-0000-7000-8000-000000000101", "name": "HK1 2026-2027" },
      "toSemester": { "publicId": "0193a000-0000-7000-8000-000000000102", "name": "HK2 2026-2027" },
      "displayStatus": "ACTIVE",
      "displayStatusName": "Đang áp dụng"
    }
  ]
}
```

- Dòng không có rubric hiển thị "Chưa có rubric".
- **Không còn cờ `canChange` và không còn nút "Đổi rubric"**. Muốn đổi rubric của một học kỳ thì vào màn Cấu hình điểm,
  sửa khoảng kỳ của rubric (A9) hoặc áp dụng rubric khác cho khoảng chứa học kỳ đó (A8).
- Rubric của học kỳ cũng có thể đổi khi ngày bắt đầu học kỳ bị sửa (BE gán lại theo khoảng kỳ, với loại chưa có phiếu chấm).

Lỗi riêng: `404 4041` (`SEMESTER_NOT_FOUND`).

---

## 8. Ví dụ service

```ts
// services/evaluationTemplate.service.ts
import { apiClient } from '@/shared/api/client'
import { API_ENDPOINTS } from '@/shared/api/endpoints'
import type { ApiResponse, PageResponse } from '@/shared/types/api'
import type {
  EvaluationType, EvaluationTemplateSummary, EvaluationTemplateDetail, SaveRubricBody,
  ApplyPreview, SemesterRangeBody, SemesterEvaluationTemplate, SemesterOption,
} from '../types'

const RUBRIC = API_ENDPOINTS.departmentRubric

export const evaluationTemplateService = {
  // A1
  async getList(type: EvaluationType) {
    const res = await apiClient.get<ApiResponse<EvaluationTemplateSummary[]>>(RUBRIC.base, { params: { type } })
    return res.data.data ?? []
  },
  // A2
  async getDetail(publicId: string) {
    const res = await apiClient.get<ApiResponse<EvaluationTemplateDetail>>(RUBRIC.detail(publicId))
    return res.data.data!
  },
  // A3 → trả publicId mới
  async create(body: { type: EvaluationType; name: string }) {
    const res = await apiClient.post<ApiResponse<string>>(RUBRIC.base, body)
    return { publicId: res.data.data!, message: res.data.message }
  },
  // A4 → trả publicId bản sao
  async clone(publicId: string) {
    const res = await apiClient.post<ApiResponse<string>>(RUBRIC.clone(publicId))
    return { publicId: res.data.data!, message: res.data.message }
  },
  // A5
  async save(publicId: string, body: SaveRubricBody) {
    const res = await apiClient.put<ApiResponse<void>>(RUBRIC.detail(publicId), body)
    return res.data.message
  },
  // A6
  async remove(publicId: string) {
    const res = await apiClient.delete<ApiResponse<void>>(RUBRIC.detail(publicId))
    return res.data.message
  },
  // A7 – xem trước Áp dụng (Nháp) / Sửa kỳ áp dụng (Sắp / Đang áp dụng)
  async applyPreview(publicId: string, fromSemesterId: string, toSemesterId: string | null) {
    const res = await apiClient.get<ApiResponse<ApplyPreview>>(RUBRIC.applyPreview(publicId), {
      params: { fromSemesterId, toSemesterId: toSemesterId ?? undefined },
      skipErrorToast: true,
    })
    return res.data.data!
  },
  // A7b – xem trước Hủy áp dụng
  async cancelApplyPreview(publicId: string) {
    const res = await apiClient.get<ApiResponse<ApplyPreview>>(RUBRIC.cancelApplyPreview(publicId), {
      skipErrorToast: true,
    })
    return res.data.data!
  },
  // A8
  async apply(publicId: string, body: SemesterRangeBody) {
    const res = await apiClient.post<ApiResponse<void>>(RUBRIC.apply(publicId), body)
    return res.data.message
  },
  // A9
  async changeSemesterRange(publicId: string, body: SemesterRangeBody) {
    const res = await apiClient.patch<ApiResponse<void>>(RUBRIC.semesterRange(publicId), body)
    return res.data.message
  },
  // A10
  async cancelApply(publicId: string) {
    const res = await apiClient.post<ApiResponse<void>>(RUBRIC.cancelApply(publicId))
    return res.data.message
  },
  // B1 (chỉ xem)
  async getSemesterRubrics(semesterPublicId: string) {
    const res = await apiClient.get<ApiResponse<SemesterEvaluationTemplate[]>>(RUBRIC.semester(semesterPublicId))
    return res.data.data ?? []
  },
  // Danh sách học kỳ cho ô chọn "Từ kỳ" / "Đến kỳ" (API học kỳ có sẵn)
  async getSemesterOptions() {
    const res = await apiClient.get<ApiResponse<PageResponse<SemesterOption>>>(RUBRIC.semesterList, {
      params: { page: 0, size: 100, sortBy: 'startDate', sortDir: 'ASC' },
    })
    return res.data.data?.content ?? []
  },
}
```

Đường dẫn import (`apiClient`, `ApiResponse`, `PageResponse`) chỉnh theo đúng chỗ các service khác trong dự án đang dùng.

---

## 9. Types & hook gợi ý

```ts
// types.ts (thêm cạnh type UI hiện có)
export type EvaluationType = 'ADVISOR' | 'EXAMINER' | 'COUNCIL'
export type TemplateDisplayStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'EXPIRED'

/** Ngày BE trả: "dd-MM-yyyy"; ngày giờ: "dd-MM-yyyy HH:mm:ss" */
type BeDate = string
type BeDateTime = string

/** Học kỳ rút gọn trong response rubric */
export interface SemesterRef {
  publicId: string
  name: string
}

/** Một dòng của GET /semester (chỉ các field ô chọn kỳ cần) */
export interface SemesterOption {
  publicId: string
  name: string
  startDate: BeDate
  endDate: BeDate
  status: string
  statusCode: 'UPCOMING' | 'ONGOING' | 'COMPLETED'
}

/** Wrapper phân trang của BE (nếu dự án đã có thì dùng lại) */
export interface PageResponse<T> {
  totalElements: number
  totalPages: number
  page: number
  size: number
  content: T[]
}

export interface EvaluationTemplateSummary {
  publicId: string
  name: string
  type: EvaluationType
  fromSemester: SemesterRef | null
  toSemester: SemesterRef | null
  displayStatus: TemplateDisplayStatus
  displayStatusName: string
  totalWeight: number
  criteriaCount: number
  isValid: boolean
  semesterCount: number
  sheetCount: number
  canDelete: boolean
  updatedByName: string | null
  updatedAt: BeDateTime | null
}

export interface EvaluationCriteria {
  publicId: string
  displayOrder: number
  name: string
  weight: number
  maxScore: number
}

export interface EvaluationCriteriaGroup {
  publicId: string
  displayOrder: number
  name: string
  totalWeight: number
  maxScore: number
  criteria: EvaluationCriteria[]
}

export interface EvaluationTemplateDetail {
  publicId: string
  name: string
  type: EvaluationType
  fromSemester: SemesterRef | null
  toSemester: SemesterRef | null
  displayStatus: TemplateDisplayStatus
  displayStatusName: string
  version: number
  totalWeight: number
  criteriaCount: number
  semesterCount: number
  sheetCount: number
  canEdit: boolean
  canApply: boolean
  applyBlockedReason: string | null
  canChangeFromSemester: boolean
  canChangeToSemester: boolean
  canCancelApply: boolean
  canDelete: boolean
  createdByName: string | null
  updatedByName: string | null
  createdAt: BeDateTime | null
  updatedAt: BeDateTime | null
  groups: EvaluationCriteriaGroup[]
}

export interface SaveRubricBody {
  name: string
  version: number
  groups: {
    publicId: string | null
    name: string
    criteria: { publicId: string | null; name: string; weight: number }[]
  }[]
}

/** Body A8 / A9 */
export interface SemesterRangeBody {
  fromSemesterId: string
  toSemesterId: string | null
}

/** Response A7 / A7b */
export interface ApplyPreview {
  fromSemester?: SemesterRef | null
  toSemester?: SemesterRef | null
  assignedSemesters: SemesterRef[]
  releasedSemesters: SemesterRef[]
}

export interface SemesterEvaluationTemplate {
  evaluationType: EvaluationType
  evaluationTypeName: string
  templatePublicId?: string | null
  templateName?: string | null
  fromSemester?: SemesterRef | null
  toSemester?: SemesterRef | null
  displayStatus?: TemplateDisplayStatus | null
  displayStatusName?: string | null
}
```

```ts
export const rubricKeys = {
  all: ['department', 'rubric'] as const,
  lists: () => [...rubricKeys.all, 'list'] as const,
  list: (type: EvaluationType) => [...rubricKeys.lists(), type] as const,
  detail: (publicId: string) => [...rubricKeys.all, 'detail', publicId] as const,
  preview: (publicId: string, fromSemesterId: string, toSemesterId: string | null) =>
    [...rubricKeys.all, 'preview', publicId, fromSemesterId, toSemesterId ?? ''] as const,
  cancelPreview: (publicId: string) => [...rubricKeys.all, 'cancel-preview', publicId] as const,
  semester: (semesterPublicId: string) => [...rubricKeys.all, 'semester', semesterPublicId] as const,
  semesterOptions: () => [...rubricKeys.all, 'semester-options'] as const,
}

// useRubricList(type), useRubricDetail(publicId)
// useSemesterOptions(): staleTime dài (danh sách học kỳ ít đổi)
// useApplyPreview(publicId, fromSemesterId, toSemesterId): enabled khi đã chọn "Từ kỳ"
// useCancelApplyPreview(publicId): enabled khi mở hộp thoại Hủy áp dụng
// Mutation (create/clone/save/remove/apply/changeSemesterRange/cancelApply):
//   onSuccess → toast.success(message)
//             + invalidateQueries({ queryKey: rubricKeys.lists() })
//             + invalidateQueries({ queryKey: rubricKeys.detail(publicId) })
//   apply / changeSemesterRange / cancelApply còn làm đổi rubric của học kỳ
//             → invalidateQueries({ queryKey: [...rubricKeys.all, 'semester'] })
//             + removeQueries({ queryKey: [...rubricKeys.all, 'preview'] })
// Không còn hook đổi tay rubric của học kỳ (B2 đã bỏ)
```

Đổi tab loại phiếu → đổi `type` của `useRubricList`, không cần gọi lại các tab khác.

---

## 10. Lưu ý

- Các API đã có unit test ở tầng Service (`EvaluationTemplateServiceImplTest`, `SemesterServiceImplTest`) và integration test
  MockMvc (`EvaluationTemplateControllerIntegrationTest`, `SemesterEvaluationTemplateIntegrationTest`), **chưa** chạy thử end-to-end với FE.
  Gặp sai lệch với tài liệu này thì báo BE.
- Trạng thái đổi theo thời gian mà không cần thao tác: rubric `SCHEDULED` tự thành `ACTIVE` khi tới ngày bắt đầu của "Từ kỳ";
  `ACTIVE` tự thành `EXPIRED` khi qua ngày kết thúc của "Đến kỳ". Trang mở qua đêm nên refetch khi focus lại.
- `version` tăng sau mỗi lần ghi rubric (A5, A8, A9, A10). Áp dụng / sửa kỳ một rubric **không** làm đổi `version` của rubric khác.
  Màn chi tiết luôn dùng `version` của lần A2 gần nhất.
- Không gửi `displayOrder`, `maxScore`, `totalWeight` lên BE ở A5 – BE tự tính, field thừa bị bỏ qua.
- Học kỳ gửi lên bằng `publicId`, **không** gửi tên kỳ hay ngày.
- Field `null` trong response có thể bị ẩn khỏi JSON: luôn đọc bằng `?.` / `?? null`.

---

## 11. Tóm tắt nhanh

| #   | API                                                        | Body / query                                | Thành công                                 | Lỗi riêng chính                                               |
| :-- | :--------------------------------------------------------- | :------------------------------------------ | :----------------------------------------- | :------------------------------------------------------------ |
| A1  | `GET /evaluation-template`                                 | query `type` (mặc định `ADVISOR`)           | `data: EvaluationTemplateSummary[]`        | —                                                             |
| A2  | `GET /evaluation-template/{publicId}`                      | —                                           | `data: EvaluationTemplateDetail`           | `404 3101`                                                    |
| A3  | `POST /evaluation-template`                                | `{ type, name }`                            | Thêm mới thành công, `data: publicId`      | `4000`                                                        |
| A4  | `POST /evaluation-template/{publicId}/clone`               | —                                           | Nhân bản thành công, `data: publicId`      | `404 3101`                                                    |
| A5  | `PUT /evaluation-template/{publicId}`                      | `{ name, version, groups[] }`               | Cập nhật thành công                        | `4000`, `3101`, `3102`, `3109`, `3103`, `3113`                |
| A6  | `DELETE /evaluation-template/{publicId}`                   | —                                           | Xóa thành công                             | `3101`, `3107`, `3108`                                        |
| A7  | `GET /evaluation-template/{publicId}/apply-preview`        | query `fromSemesterId`, `toSemesterId?`     | `data: ApplyPreview`                       | `3101`, `3127`, `3103`, `4000`, `4041`, `3106`, `3123`–`3126` |
| A7b | `GET /evaluation-template/{publicId}/cancel-apply-preview` | —                                           | `data: ApplyPreview` (`releasedSemesters`) | `3101`, `3127`, `3106`                                        |
| A8  | `POST /evaluation-template/{publicId}/apply`               | `{ fromSemesterId, toSemesterId? }`         | Áp dụng thành công                         | `4000`, `3101`, `3107`, `3103`, `4041`, `3123`–`3125`, `3109` |
| A9  | `PATCH /evaluation-template/{publicId}/semester-range`     | `{ fromSemesterId, toSemesterId? }`         | Cập nhật thành công                        | `4000`, `3101`, `3127`, `4041`, `3106`, `3123`–`3126`, `3109` |
| A10 | `POST /evaluation-template/{publicId}/cancel-apply`        | —                                           | Hủy áp dụng thành công                     | `3101`, `3127`, `3106`, `3109`                                |
| B1  | `GET /semester/{semesterPublicId}/evaluation-template`     | —                                           | `data: SemesterEvaluationTemplate[3]`      | `404 4041`                                                    |
| –   | `GET /semester` (có sẵn)                                   | `page, size, sortBy=startDate, sortDir=ASC` | `data: PageResponse<SemesterOption>`       | —                                                             |

---

## 12. Những gì FE phải sửa so với bản trước

| Chỗ                     | Bản cũ                                                        | Bản mới                                                                                   |
| :---------------------- | :------------------------------------------------------------ | :---------------------------------------------------------------------------------------- |
| Field khoảng áp dụng    | `effectiveFrom`, `effectiveTo` (ngày `dd-MM-yyyy`)            | `fromSemester`, `toSemester` (`SemesterRef \| null`) ở A1, A2, B1                         |
| Cờ A2                   | `canChangeEffectiveFrom`                                      | `canChangeFromSemester` + `canChangeToSemester`                                           |
| `canEdit`               | `DRAFT` hoặc `SCHEDULED` chưa có phiếu                        | `DRAFT` hoặc (Sắp / Đang áp dụng) chưa có phiếu                                           |
| A7                      | query ngày; trả số học kỳ bị ảnh hưởng và rubric bị đóng      | `?fromSemesterId=&toSemesterId=`; trả `fromSemester`, `toSemester`, `assignedSemesters[]`, `releasedSemesters[]` |
| A7b                     | Không có                                                      | **Mới** `GET .../cancel-apply-preview`                                                    |
| A8 body                 | `{ effectiveFrom }`                                           | `{ fromSemesterId, toSemesterId }`                                                        |
| A9                      | `PATCH .../effective-from`, chỉ rubric Sắp áp dụng            | `PATCH .../semester-range`, rubric Sắp / Đang áp dụng                                     |
| A10                     | Chỉ rubric Sắp áp dụng; mở lại rubric liền trước              | Rubric Sắp / Đang áp dụng chưa có phiếu; kỳ về không có rubric, không mở lại rubric nào   |
| Áp dụng rubric mới      | BE tự đặt ngày kết thúc cho rubric cũ                         | BE **không** tự cắt; trùng khoảng → `3125`, TBM sửa "Đến kỳ" rubric cũ trước              |
| Hộp thoại Áp dụng / Sửa | Datepicker                                                    | 2 ô chọn học kỳ "Từ kỳ" (bắt buộc), "Đến kỳ" (có "Chưa xác định") – Mục 6.1               |
| B1                      | Có `canChange`, nút "Đổi rubric"                              | Bỏ `canChange`; màn học kỳ chỉ xem                                                        |
| B2                      | `PUT /semester/{id}/evaluation-template`                      | **Đã bỏ** – xóa service, hook đổi rubric học kỳ, `ChangeRubricDialog`, type body đổi rubric |
| Mã lỗi                  | `3104`, `3105`, `3110`, `3111`, `3112`, `3114`, `EVALUATION_EFFECTIVE_FROM_NULL`, `EVALUATION_TEMPLATE_PUBLIC_ID_REQUIRED` | Đã xóa. Mới: `3123`–`3127`, `EVALUATION_FROM_SEMESTER_NULL`; `3102` đổi message |
