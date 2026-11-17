# Cấu hình điểm – Rubric chấm điểm (Trưởng bộ môn) – Đặc tả API

> Mô tả 12 API cấu hình rubric (mẫu phiếu chấm) của Trưởng bộ môn (TBM): 10 API quản lý rubric (A1–A10) và 2 API rubric
> của học kỳ (B1–B2). Hợp đồng API lấy từ backend Spring Boot (`tlu_gpms_system`):
> - `features/score_config/` (`EvaluationTemplateController`, `EvaluationTemplateServiceImpl`, `TemplateStatusRules`, `TemplateTreeValidator`)
> - `features/semester/` (`SemesterController` – 2 API `/semester/{id}/evaluation-template`)
>
> Đặc tả nghiệp vụ phía BE: `doc/case_execution/cau_hinh_rubric.md`.
> Quy ước chung (wrapper response, interceptor, toast, refresh token) giống Mục 3 của `api_addStudent.md`. Chỗ nào file này không nói khác thì làm theo file đó.

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
| 7   | Hộp thoại xác nhận Áp dụng / Đổi ngày (xem trước số liệu)           | ✅ BE đã có – `GET /evaluation-template/{publicId}/apply-preview?effectiveFrom=` (A7)               |
| 8   | Áp dụng rubric từ ngày                                              | ✅ BE đã có – `POST /evaluation-template/{publicId}/apply` (A8)                                     |
| 9   | Đổi ngày áp dụng (rubric Sắp áp dụng)                               | ✅ BE đã có – `PATCH /evaluation-template/{publicId}/effective-from` (A9)                           |
| 10  | Hủy áp dụng (rubric Sắp áp dụng → Nháp)                             | ✅ BE đã có – `POST /evaluation-template/{publicId}/cancel-apply` (A10)                             |
| 11  | Xem 3 rubric đang gán cho một học kỳ                                | ✅ BE đã có – `GET /semester/{semesterPublicId}/evaluation-template` (B1)                           |
| 12  | Đổi tay rubric của một học kỳ cho một loại phiếu                    | ✅ BE đã có – `PUT /semester/{semesterPublicId}/evaluation-template` (B2)                           |
| 13  | Màn hình FE                                                         | 🟡 Đã có UI chạy dữ liệu mẫu ở `src/features/department/score_management/` (route `/department/grading-config`), **chưa có `services/`**, chưa nối API |
| 14  | Lưu riêng ngày kết thúc (`validTo`) khi tạo                         | ❌ BE không có – ngày kết thúc do BE tự tính khi áp dụng rubric mới hơn (Mục 2.4)                   |
| 15  | Lịch sử đổi rubric của học kỳ (`RubricAssignmentChange`, lý do đổi) | ❌ BE không có – B2 không nhận `reason`, không lưu lịch sử                                          |
| 16  | Danh sách học kỳ đang dùng rubric + số SV đã chấm từng kỳ           | ❌ BE không có – chỉ có tổng `semesterCount`, `sheetCount` (Mục 2.4)                                |

---

## 2. Gợi ý vị trí code FE

### 2.1. Cấu trúc thư mục

Giữ thư mục đang có `src/features/department/score_management/`, bổ sung phần còn thiếu:

```
src/features/department/score_management/
├── types.ts                            # thêm type BE (Mục 9) bên cạnh type UI hiện có
├── services/evaluationTemplate.service.ts   # MỚI: 12 hàm gọi A1–A10, B1, B2
├── hooks/useRubricVersions.ts          # thay dữ liệu mẫu bằng React Query (Mục 9)
├── utils/
│   ├── rubricHelpers.ts
│   ├── rubricMapper.ts                 # MỚI: map response BE ↔ type UI (Mục 2.4)
│   ├── rubricSchema.ts                 # MỚI: zod cho form tạo / lưu cây / chọn ngày
│   └── rubricSampleData.ts             # bỏ khi nối API xong
├── components/ ...                     # giữ nguyên
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
  apply: (publicId: string) => `/evaluation-template/${publicId}/apply`,
  effectiveFrom: (publicId: string) => `/evaluation-template/${publicId}/effective-from`,
  cancelApply: (publicId: string) => `/evaluation-template/${publicId}/cancel-apply`,
  // GET: 3 rubric của học kỳ · PUT: đổi rubric của học kỳ
  semester: (semesterPublicId: string) => `/semester/${semesterPublicId}/evaluation-template`,
},
```

Các ví dụ bên dưới viết tắt `const RUBRIC = API_ENDPOINTS.departmentRubric`.

### 2.3. Enum dùng chung

```ts
// Loại phiếu chấm (gửi lên đúng mã chữ hoa)
export type EvaluationType = 'ADVISOR' | 'EXAMINER' | 'COUNCIL'

// Trạng thái hiển thị: BE tính từ ngày, không lưu DB
export type TemplateDisplayStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'EXPIRED'
```

| `EvaluationType` | Nhãn BE (`evaluationTypeName`) | Tab UI hiện tại (`RubricRole`) |
| :--------------- | :----------------------------- | :----------------------------- |
| `ADVISOR`        | Phiếu hướng dẫn                | `supervisor`                   |
| `EXAMINER`       | Phiếu phản biện                | `reviewer`                     |
| `COUNCIL`        | Phiếu hội đồng                 | `council`                      |

| `TemplateDisplayStatus` | Nhãn BE (`displayStatusName`) | `RubricStatus` UI | Điều kiện (so với hôm nay)                         |
| :---------------------- | :---------------------------- | :---------------- | :------------------------------------------------- |
| `DRAFT`                 | Nháp                          | `draft`           | `effectiveFrom = null`                             |
| `SCHEDULED`             | Sắp áp dụng                   | `upcoming`        | `effectiveFrom > hôm nay`                          |
| `ACTIVE`                | Đang áp dụng                  | `active`          | còn lại (kể cả `effectiveFrom = hôm nay`)          |
| `EXPIRED`               | Hết áp dụng                   | `archived`        | `effectiveTo != null` và `effectiveTo < hôm nay`   |

Badge nên hiển thị thẳng `displayStatusName` của BE. **Không** tự tính trạng thái từ ngày ở FE.

### 2.4. Chênh lệch giữa UI mẫu hiện tại và BE

| UI mẫu (`types.ts`)                                 | BE                                                                                   | Cách xử lý                                                                         |
| :-------------------------------------------------- | :----------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- |
| `id`                                                | `publicId` (UUID)                                                                    | Dùng `publicId`                                                                    |
| `code` "1", "1.2"                                   | `displayOrder` (1, 2, 3...)                                                          | FE tự ghép: `${group.displayOrder}.${criteria.displayOrder}`                       |
| `RubricGroup.weight` (khi nhóm chưa có tiêu chí)    | Nhóm **không** có trọng số riêng; `totalWeight` = tổng tiêu chí con                  | Bỏ ô trọng số của nhóm. Nhóm không có tiêu chí → không áp dụng được               |
| Điểm tối đa = trọng số / 10                         | `maxScore` = `weight × 10 / 100` (VD 15% → 1.5)                                      | Hiển thị `maxScore` BE trả, không tự tính                                          |
| `validFrom`, `validTo` nhập khi tạo                 | A3 chỉ nhận `type`, `name`. `effectiveFrom` đặt ở A8; `effectiveTo` BE tự đặt = ngày áp dụng của rubric mới hơn − 1 | Bỏ ô ngày khỏi dòng tạo mới; chọn ngày trong hộp thoại Áp dụng |
| `PendingRubricRow.sourceId` (nhân bản)              | A4 không nhận tên: bản sao lấy tên gốc, là Nháp, cùng loại                           | Gọi A4 → nhận `publicId` mới → mở chi tiết để đổi tên rồi A5                       |
| `appliedSemesters[]` (tên kỳ + số SV đã chấm)       | Chỉ có `semesterCount` (số học kỳ đang gán) và `sheetCount` (số phiếu chấm)          | Hiển thị 2 con số; `SemesterPopover` chưa có dữ liệu chi tiết                      |
| `lastModifiedBy`, `lastModifiedAt`                  | `updatedByName`, `updatedAt` (`dd-MM-yyyy HH:mm:ss`)                                 | Map thẳng                                                                          |
| `RubricAssignResult` `already-graded`               | B2 trả `409 3111`                                                                    | Bắt lỗi 3111 trong `ChangeRubricDialog`, tải lại B1                                |
| `RubricAssignmentChange` (lịch sử, lý do)           | Không có                                                                             | Ẩn phần lịch sử / ô lý do                                                          |

---

## 3. Quy ước chung

- Response `{ code, message?, data? }`, `code = 1000` là thành công. Mọi lỗi trả body `{ code, message }`, không có `data`.
- Lỗi HTTP 4xx/5xx → interceptor tự toast đỏ, component **không** `toast.error` lại. Popup muốn tự hiện lỗi trên form thì gửi `{ skipErrorToast: true }`.
- Quyền: cả 12 API **chỉ** cho role `HEAD_OF_MAJOR` (`@PreAuthorize("hasRole('HEAD_OF_MAJOR')")` ở Service). `ADMIN` cũng bị `403`.
- Chỉ dùng `publicId` (UUID string), không có `id` số. `{id}` trong B1/B2 là **`publicId` của học kỳ**.
- Code `4000` dùng chung cho mọi lỗi dữ liệu nhập, FE phân biệt bằng `message`, không bằng `code`.
- **Định dạng ngày khác nhau giữa gửi lên và nhận về:**
  - Gửi lên (body `effectiveFrom`, query `effectiveFrom`): **`yyyy-MM-dd`** (VD `"2026-12-01"`).
  - Nhận về (mọi field `LocalDate` trong response): **`dd-MM-yyyy`** (VD `"01-12-2026"`); `createdAt` / `updatedAt`: `dd-MM-yyyy HH:mm:ss`.
- Trọng số (`weight`, `totalWeight`, `maxScore`) là `BigDecimal` → JSON số (VD `15`, `15.5`, `1.55`). Gửi lên dạng số, tối đa 2 chữ số thập phân.
- **Cờ bật / tắt nút do BE tính** (`canEdit`, `canApply`, `canChangeEffectiveFrom`, `canCancelApply`, `canDelete`, `isValid`, `canChange`).
  FE chỉ đọc cờ, không tự suy luận từ trạng thái. BE vẫn kiểm tra lại khi gọi nên cờ cũ vẫn an toàn (trả lỗi 409).
- Sau mọi thao tác ghi (A3–A6, A8–A10, B2), tải lại danh sách A1 của loại đó và chi tiết A2 đang mở.

**Lỗi chung cho cả 12 API** (bảng lỗi riêng ở Mục 4–7 không nhắc lại):

| Trường hợp                                                         | HTTP | `code` | Message                                     | FE xử lý                                                                |
| :----------------------------------------------------------------- | :--- | :----- | :------------------------------------------ | :---------------------------------------------------------------------- |
| Chưa đăng nhập, access token hết hạn hoặc sai                      | 401  | 2000   | Phiên đăng nhập của bạn đã hết hạn          | Interceptor tự gọi `/refresh-token` rồi gửi lại; thất bại → về `/login` |
| Không phải `HEAD_OF_MAJOR`                                         | 403  | 2001   | Bạn không có quyền truy cập (access denied) | Toast đỏ                                                                |
| `publicId` trên URL không phải UUID                                | 400  | 1006   | Yêu cầu không hợp lệ                        | Toast đỏ (không ra 404)                                                 |
| `type` (query A1) / `evaluationType` (body B2) sai giá trị enum    | 400  | 1006   | Yêu cầu không hợp lệ                        | Toast đỏ                                                                |
| Ngày sai định dạng (không phải `yyyy-MM-dd`), body hỏng / thiếu    | 400  | 1006   | Yêu cầu không hợp lệ                        | Toast đỏ                                                                |
| Sai HTTP method (ví dụ `PUT` thay cho `PATCH` ở A9)                | 405  | 1007   | Hệ thống không cấp phép                     | Toast đỏ                                                                |
| URL không khớp API nào                                             | 404  | 1005   | Thông tin không có sẵn                      | Toast đỏ                                                                |
| Lỗi không lường trước ở BE                                         | 500  | 1001   | Hệ thống không phản hồi                     | Toast đỏ                                                                |

**Lỗi nào trả trước:** 401 trả trước mọi lỗi khác. 403 chỉ được kiểm tra khi request vào tới Service, nên các lỗi ở tầng
Controller (`1006` / `1007` / `1005` ở bảng trên, lỗi validate `4000` của body) trả về **trước** 403.

**Bảng mã lỗi nghiệp vụ của rubric** (Mục 4–7 chỉ ghi mã, tra message ở đây):

| `code` | Tên (`ErrorCode`)                            | HTTP | Message                                                                                                                       |
| :----- | :------------------------------------------- | :--- | :---------------------------------------------------------------------------------------------------------------------------- |
| 3101   | `EVALUATION_TEMPLATE_NOT_FOUND`              | 404  | Không tìm thấy rubric chấm điểm                                                                                               |
| 3102   | `EVALUATION_TEMPLATE_NOT_EDITABLE`           | 409  | Chỉ được sửa nội dung rubric Nháp hoặc rubric Sắp áp dụng chưa có phiếu chấm. Muốn thay đổi, hãy nhân bản để tạo rubric mới   |
| 3103   | `EVALUATION_TEMPLATE_NOT_READY_TO_APPLY`     | 400  | Rubric chưa đủ điều kiện áp dụng: tổng trọng số phải đúng 100% và mỗi nhóm có ít nhất 1 tiêu chí                              |
| 3104   | `EVALUATION_TEMPLATE_EFFECTIVE_FROM_INVALID` | 400  | Ngày áp dụng không được ở quá khứ và phải sau ngày áp dụng của rubric mới nhất cùng loại                                      |
| 3105   | `EVALUATION_TEMPLATE_NOT_LATEST`             | 409  | Chỉ được đổi ngày hoặc hủy áp dụng rubric mới nhất của loại phiếu này                                                         |
| 3106   | `EVALUATION_TEMPLATE_HAS_SHEETS`             | 409  | Rubric đã có phiếu chấm sử dụng, không thể thay đổi                                                                           |
| 3107   | `EVALUATION_TEMPLATE_NOT_DRAFT`              | 409  | Chỉ được xóa hoặc áp dụng rubric Nháp                                                                                         |
| 3108   | `EVALUATION_TEMPLATE_IN_USE`                 | 409  | Rubric đang được học kỳ hoặc phiếu chấm sử dụng, không thể xóa                                                                |
| 3109   | `EVALUATION_TEMPLATE_VERSION_CONFLICT`       | 409  | Rubric đã được người khác cập nhật, vui lòng tải lại trang trước khi lưu                                                      |
| 3110   | `EVALUATION_TEMPLATE_NOT_SCHEDULED`          | 409  | Chỉ được đổi ngày hoặc hủy áp dụng rubric chưa đến ngày áp dụng                                                               |
| 3111   | `SEMESTER_TEMPLATE_LOCKED`                   | 409  | Học kỳ đã có phiếu chấm loại này, không thể đổi rubric                                                                        |
| 3112   | `EVALUATION_TEMPLATE_TYPE_MISMATCH`          | 400  | Rubric không cùng loại phiếu chấm                                                                                             |
| 3113   | `EVALUATION_TREE_ITEM_INVALID`               | 400  | Nhóm tiêu chí hoặc tiêu chí không thuộc rubric này, hoặc bị gửi trùng                                                         |
| 3114   | `EVALUATION_TEMPLATE_NOT_APPLIED`            | 400  | Chỉ được gán rubric đã áp dụng cho học kỳ, không được gán rubric Nháp                                                         |
| 4041   | `SEMESTER_NOT_FOUND`                         | 404  | Không tìm thấy học kỳ yêu cầu                                                                                                 |

Lỗi validate (đều `400`, `code = 4000`):

| Key                                      | Message                                                                     | Field                         |
| :--------------------------------------- | :-------------------------------------------------------------------------- | :---------------------------- |
| `EVALUATION_TYPE_NULL`                   | Vui lòng chọn loại phiếu chấm                                               | `type` (A3), `evaluationType` (B2) |
| `EVALUATION_TEMPLATE_NAME_EMPTY`         | Tên rubric không được để trống                                              | `name` (A3, A5)               |
| `EVALUATION_TEMPLATE_NAME_TOO_LONG`      | Tên rubric tối đa 255 ký tự                                                 | `name`                        |
| `EVALUATION_TEMPLATE_VERSION_NULL`       | Thiếu phiên bản rubric, vui lòng tải lại trang                              | `version` (A5)                |
| `EVALUATION_TEMPLATE_PUBLIC_ID_REQUIRED` | Vui lòng chọn rubric                                                        | `templatePublicId` (B2)       |
| `EVALUATION_EFFECTIVE_FROM_NULL`         | Vui lòng chọn ngày áp dụng                                                  | `effectiveFrom` (A7, A8, A9)  |
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

**Không phân trang**, trả toàn bộ rubric của loại đó (`data` là mảng).

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
      "effectiveFrom": "01-01-2026",
      "effectiveTo": null,
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
| `totalWeight`                 | Tổng trọng số % mọi tiêu chí                                                    |
| `criteriaCount`               | Số tiêu chí (cấp 2)                                                             |
| `isValid`                     | Cây đủ điều kiện áp dụng (có nhóm, nhóm nào cũng có tiêu chí, tổng đúng 100%)   |
| `semesterCount`, `sheetCount` | Số học kỳ đang gán rubric / số phiếu chấm đã dùng rubric                        |
| `canDelete`                   | Hiện nút Xóa                                                                    |

Lỗi riêng: không có (ngoài bảng lỗi chung).

### 4.2. `GET /evaluation-template/{publicId}` – Chi tiết rubric (A2)

```json
{
  "code": 1000,
  "data": {
    "publicId": "0193b0f2-6c1e-7a52-9d1f-2b8a4c1e9f01",
    "name": "Rubric phản biện 2027",
    "type": "EXAMINER",
    "effectiveFrom": null,
    "effectiveTo": null,
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
    "canChangeEffectiveFrom": false,
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

| Cờ                       | Nút                                    | Điều kiện BE                                                       |
| :----------------------- | :------------------------------------- | :----------------------------------------------------------------- |
| `canEdit`                | Sửa tên / thêm-xóa-sửa nhóm, tiêu chí  | `DRAFT`, hoặc `SCHEDULED` và chưa có phiếu chấm                    |
| `canApply`               | Áp dụng                                | `DRAFT` và cây hợp lệ                                              |
| `applyBlockedReason`     | Tooltip khi nút Áp dụng bị tắt         | Chỉ có khi `DRAFT` và cây chưa hợp lệ; còn lại `null`              |
| `canChangeEffectiveFrom` | Đổi ngày áp dụng                       | `SCHEDULED`, là rubric mới nhất của loại, chưa có phiếu chấm       |
| `canCancelApply`         | Hủy áp dụng                            | Giống `canChangeEffectiveFrom`                                     |
| `canDelete`              | Xóa                                    | `DRAFT` và không học kỳ / phiếu chấm nào trỏ tới                   |
| (luôn bật)               | Nhân bản                               | Mọi trạng thái                                                     |

`applyBlockedReason` trả theo thứ tự ưu tiên: chưa có nhóm nào → có nhóm chưa có tiêu chí → tổng trọng số khác 100%.

Rubric `ACTIVE` / `EXPIRED` hoặc đã có phiếu chấm: chỉ xem, muốn sửa thì **Nhân bản** rồi sửa bản Nháp.

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

Không có body. Bản sao: cùng loại, cùng tên, chép nhóm + tiêu chí (giữ thứ tự, trọng số), **luôn là Nháp**, không chép ngày áp dụng.

```json
{ "code": 1000, "message": "Nhân bản thành công", "data": "0193b0f2-6c1e-7a52-9d1f-2b8a4c1e9f03" }
```

Lỗi riêng: `404 3101`.

### 5.3. `PUT /evaluation-template/{publicId}` – Lưu tên + toàn bộ cây (A5)

Gửi **toàn bộ** cây sau khi sửa (không phải từng thay đổi lẻ). BE so sánh theo `publicId`:

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
**Rubric Sắp áp dụng** phải luôn hợp lệ khi lưu (vì đến ngày nó tự thành Đang áp dụng) → không hợp lệ trả `3103`.

```json
{ "code": 1000, "message": "Cập nhật thành công" }
```

Sau khi lưu thành công **phải tải lại A2** để lấy `version` mới và `publicId` của phần tử vừa thêm; lưu lần 2 bằng `version` cũ sẽ bị `3109`.

Lỗi riêng (đúng thứ tự BE kiểm tra):

| Trường hợp                                                        | HTTP | `code` | FE xử lý                                                                   |
| :---------------------------------------------------------------- | :--- | :----- | :------------------------------------------------------------------------- |
| Lỗi validate field (bảng 4000 ở Mục 3)                            | 400  | 4000   | Hiện lỗi trên form                                                          |
| Không tìm thấy rubric                                             | 404  | 3101   | Toast, đóng màn chi tiết, tải lại A1                                       |
| Rubric không sửa được (đã Đang áp dụng / Hết / có phiếu chấm)     | 409  | 3102   | Toast, tải lại A2 (chuyển sang chế độ xem), gợi ý Nhân bản                 |
| `version` lệch (người khác vừa lưu, hoặc chưa tải lại sau lần lưu trước) | 409  | 3109   | Hỏi "Tải lại trang?" → tải lại A2 (mất thay đổi chưa lưu)           |
| Rubric Sắp áp dụng mà cây không hợp lệ                            | 400  | 3103   | Giữ form, hiện lỗi                                                          |
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
    .refine((v) => Number.isInteger(Math.round(v * 100)) && Math.abs(v * 100 - Math.round(v * 100)) < 1e-9,
      'Trọng số tối đa 2 chữ số thập phân'),
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

// Hiển thị cảnh báo "Tổng: 90% / 100%" ở FE (chỉ để báo sớm, BE vẫn là nguồn chuẩn)
export const sumWeight = (groups: z.infer<typeof groupSchema>[]) =>
  Math.round(groups.flatMap((g) => g.criteria).reduce((s, c) => s + c.weight, 0) * 100) / 100
```

Với rubric `SCHEDULED`, FE nên chặn nút Lưu khi `sumWeight !== 100` hoặc có nhóm không có tiêu chí (tránh `3103`).

---

## 6. Vòng đời áp dụng

### 6.0. Luồng trên UI

```
Nháp ──(A7 xem trước → A8 Áp dụng, chọn ngày)──► Sắp áp dụng ──(tới ngày)──► Đang áp dụng ──(rubric mới hơn tới ngày)──► Hết áp dụng
                                                     │  ▲
                              A9 Đổi ngày ───────────┘  │
                              A10 Hủy áp dụng ──► về Nháp
```

- Mỗi loại phiếu, tại một ngày, có tối đa **1** rubric Đang áp dụng.
- Áp dụng rubric mới từ ngày `D`: rubric đã áp dụng mới nhất cùng loại tự có `effectiveTo = D − 1`.
- Học kỳ có `startDate ≥ D` và **chưa có phiếu chấm** loại đó được BE tự gán rubric mới; học kỳ đã có phiếu giữ rubric cũ.

### 6.1. `GET /evaluation-template/{publicId}/apply-preview?effectiveFrom=yyyy-MM-dd` – Xem trước (A7)

Gọi khi người dùng chọn ngày trong hộp thoại **Áp dụng** (rubric Nháp) hoặc **Đổi ngày áp dụng** (rubric Sắp áp dụng),
trước khi bấm xác nhận. Không ghi gì vào DB.

```ts
const res = await apiClient.get<ApiResponse<ApplyPreview>>(RUBRIC.applyPreview(publicId), {
  params: { effectiveFrom: '2027-01-01' },
  skipErrorToast: true, // hiện lỗi ngay dưới ô chọn ngày
})
```

```json
{
  "code": 1000,
  "data": {
    "effectiveFrom": "01-01-2027",
    "closingTemplatePublicId": "0193b0f2-6c1e-7a52-9d1f-2b8a4c1e9f01",
    "closingTemplateName": "Rubric phản biện 2026",
    "closingTemplateEffectiveFrom": "01-01-2026",
    "closingTemplateEffectiveTo": "31-12-2026",
    "assignedSemesterCount": 1,
    "keptSemesterCount": 0
  }
}
```

| Field                                                           | Ý nghĩa / câu hiển thị gợi ý                                                                                     |
| :-------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------- |
| `closingTemplate*`                                              | "Rubric **{name}** (áp dụng từ {from}) sẽ kết thúc ngày **{to}**". Cả 4 field `null` khi loại này chưa có rubric nào áp dụng |
| `assignedSemesterCount`                                         | "{n} học kỳ bắt đầu từ ngày này sẽ dùng rubric mới"                                                              |
| `keptSemesterCount`                                             | "{n} học kỳ đã có phiếu chấm, giữ rubric cũ"                                                                     |

| Trường hợp                                                     | HTTP | `code` |
| :------------------------------------------------------------- | :--- | :----- |
| Thiếu `effectiveFrom`                                          | 400  | 4000 (`EVALUATION_EFFECTIVE_FROM_NULL`) hoặc 1006 |
| Không tìm thấy rubric                                          | 404  | 3101   |
| Rubric Sắp áp dụng nhưng không còn đổi ngày được               | 409  | 3110 / 3105 / 3106 |
| Ngày ở quá khứ, hoặc không sau ngày áp dụng của rubric liền trước | 400  | 3104   |

Ngày chọn được: `≥ hôm nay` **và** `>` ngày áp dụng của rubric đã áp dụng mới nhất cùng loại. Datepicker nên chặn ngày quá khứ;
điều kiện thứ hai để BE trả `3104`.

### 6.2. `POST /evaluation-template/{publicId}/apply` – Áp dụng (A8)

Chỉ cho rubric Nháp có `canApply = true`. Body:

```json
{ "effectiveFrom": "2027-01-01" }
```

```json
{ "code": 1000, "message": "Áp dụng thành công" }
```

Sau khi thành công: rubric chuyển `SCHEDULED` (hoặc `ACTIVE` nếu chọn hôm nay). Tải lại A1 (rubric liền trước đổi `effectiveTo`) và A2.

| Trường hợp                                                    | HTTP | `code` |
| :------------------------------------------------------------ | :--- | :----- |
| Thiếu `effectiveFrom`                                         | 400  | 4000   |
| Không tìm thấy                                                | 404  | 3101   |
| Không phải Nháp                                               | 409  | 3107   |
| Cây chưa hợp lệ                                               | 400  | 3103   |
| Ngày không hợp lệ                                             | 400  | 3104   |
| Người khác vừa sửa rubric / áp dụng cùng lúc                  | 409  | 3109   |

### 6.3. `PATCH /evaluation-template/{publicId}/effective-from` – Đổi ngày áp dụng (A9)

Chỉ khi `canChangeEffectiveFrom = true`. Body giống A8: `{ "effectiveFrom": "2027-02-01" }`.
BE cập nhật lại ngày kết thúc của rubric liền trước (= ngày mới − 1) và gán lại học kỳ.

```json
{ "code": 1000, "message": "Cập nhật thành công" }
```

| Trường hợp                                          | HTTP | `code` |
| :-------------------------------------------------- | :--- | :----- |
| Thiếu `effectiveFrom`                               | 400  | 4000   |
| Không tìm thấy                                      | 404  | 3101   |
| Không phải Sắp áp dụng (đã tới ngày / là Nháp)       | 409  | 3110   |
| Không phải rubric mới nhất của loại                 | 409  | 3105   |
| Đã có phiếu chấm dùng rubric                        | 409  | 3106   |
| Ngày không hợp lệ                                   | 400  | 3104   |
| Xung đột cập nhật đồng thời                         | 409  | 3109   |

### 6.4. `POST /evaluation-template/{publicId}/cancel-apply` – Hủy áp dụng (A10)

Chỉ khi `canCancelApply = true`. Không có body. Kết quả:
- Rubric về **Nháp** (`effectiveFrom = effectiveTo = null`).
- Rubric liền trước mở lại (`effectiveTo = null`).
- Học kỳ đang trỏ tới rubric bị hủy chuyển về rubric liền trước (hoặc trống nếu không có). Học kỳ dùng rubric khác giữ nguyên.

```json
{ "code": 1000, "message": "Hủy áp dụng thành công" }
```

Lỗi riêng: `404 3101`, `409 3110`, `409 3105`, `409 3106`, `409 3109` (ý nghĩa như A9). Nên hỏi xác nhận trước.

---

## 7. Rubric của học kỳ

### 7.1. `GET /semester/{semesterPublicId}/evaluation-template` – 3 rubric của học kỳ (B1)

Luôn trả **đúng 3 dòng**, mỗi `EvaluationType` một dòng. Học kỳ chưa có rubric loại nào thì các field rubric của dòng đó là `null`.

```json
{
  "code": 1000,
  "data": [
    {
      "evaluationType": "ADVISOR",
      "evaluationTypeName": "Phiếu hướng dẫn",
      "templatePublicId": "0193b0f2-6c1e-7a52-9d1f-2b8a4c1e9f05",
      "templateName": "Rubric hướng dẫn 2026",
      "effectiveFrom": "01-01-2026",
      "effectiveTo": null,
      "displayStatus": "ACTIVE",
      "displayStatusName": "Đang áp dụng",
      "canChange": true
    },
    {
      "evaluationType": "EXAMINER",
      "evaluationTypeName": "Phiếu phản biện",
      "templatePublicId": null,
      "templateName": null,
      "effectiveFrom": null,
      "effectiveTo": null,
      "displayStatus": null,
      "displayStatusName": null,
      "canChange": true
    },
    {
      "evaluationType": "COUNCIL",
      "evaluationTypeName": "Phiếu hội đồng",
      "templatePublicId": "0193b0f2-6c1e-7a52-9d1f-2b8a4c1e9f07",
      "templateName": "Rubric hội đồng 2026",
      "effectiveFrom": "01-01-2026",
      "effectiveTo": null,
      "displayStatus": "ACTIVE",
      "displayStatusName": "Đang áp dụng",
      "canChange": false
    }
  ]
}
```

`canChange = false` khi học kỳ đã có phiếu chấm loại đó → ẩn / tắt nút "Đổi rubric".

Lỗi riêng: `404 4041` (`SEMESTER_NOT_FOUND`).

### 7.2. `PUT /semester/{semesterPublicId}/evaluation-template` – Đổi rubric của học kỳ (B2)

Body:

```json
{ "evaluationType": "EXAMINER", "templatePublicId": "0193b0f2-6c1e-7a52-9d1f-2b8a4c1e9f01" }
```

Dropdown chọn rubric: lấy từ A1 cùng `type`, **chỉ giữ rubric không phải Nháp** (`displayStatus !== 'DRAFT'`).
Chọn đúng rubric đang gán thì BE không đổi gì nhưng vẫn trả thành công.

```json
{ "code": 1000, "message": "Cập nhật thành công" }
```

Lỗi riêng (đúng thứ tự BE kiểm tra):

| Trường hợp                                   | HTTP | `code` | FE xử lý                         |
| :------------------------------------------- | :--- | :----- | :------------------------------- |
| Thiếu `evaluationType` / `templatePublicId`  | 400  | 4000   | Lỗi trên form                    |
| Không tìm thấy học kỳ                        | 404  | 4041   | Toast                            |
| Học kỳ vừa có phiếu chấm loại này            | 409  | 3111   | Toast, tải lại B1                |
| Không tìm thấy rubric                        | 404  | 3101   | Toast, tải lại A1                |
| Rubric khác loại với `evaluationType`        | 400  | 3112   | Lỗi FE ghép body                 |
| Rubric là Nháp                               | 400  | 3114   | Lọc Nháp khỏi dropdown           |

Lưu ý: rubric gán tay ở B2 có thể bị BE gán lại tự động khi sau đó TBM Áp dụng / Đổi ngày một rubric mới cùng loại có ngày `≤ startDate` của học kỳ (học kỳ chưa có phiếu chấm).

---

## 8. Ví dụ service

```ts
// services/evaluationTemplate.service.ts
import { apiClient } from '@/shared/api/client'
import { API_ENDPOINTS } from '@/shared/api/endpoints'
import type { ApiResponse } from '@/shared/types/api'
import type {
  EvaluationType, EvaluationTemplateSummary, EvaluationTemplateDetail, SaveRubricBody,
  ApplyPreview, SemesterEvaluationTemplate, ChangeSemesterRubricBody,
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
  // A7 – effectiveFrom dạng yyyy-MM-dd
  async applyPreview(publicId: string, effectiveFrom: string) {
    const res = await apiClient.get<ApiResponse<ApplyPreview>>(RUBRIC.applyPreview(publicId), {
      params: { effectiveFrom },
      skipErrorToast: true,
    })
    return res.data.data!
  },
  // A8
  async apply(publicId: string, effectiveFrom: string) {
    const res = await apiClient.post<ApiResponse<void>>(RUBRIC.apply(publicId), { effectiveFrom })
    return res.data.message
  },
  // A9
  async changeEffectiveFrom(publicId: string, effectiveFrom: string) {
    const res = await apiClient.patch<ApiResponse<void>>(RUBRIC.effectiveFrom(publicId), { effectiveFrom })
    return res.data.message
  },
  // A10
  async cancelApply(publicId: string) {
    const res = await apiClient.post<ApiResponse<void>>(RUBRIC.cancelApply(publicId))
    return res.data.message
  },
  // B1
  async getSemesterRubrics(semesterPublicId: string) {
    const res = await apiClient.get<ApiResponse<SemesterEvaluationTemplate[]>>(RUBRIC.semester(semesterPublicId))
    return res.data.data ?? []
  },
  // B2
  async changeSemesterRubric(semesterPublicId: string, body: ChangeSemesterRubricBody) {
    const res = await apiClient.put<ApiResponse<void>>(RUBRIC.semester(semesterPublicId), body)
    return res.data.message
  },
}
```

Đường dẫn import (`apiClient`, `ApiResponse`) chỉnh theo đúng chỗ các service khác trong dự án đang dùng.

---

## 9. Types & hook gợi ý

```ts
// types.ts (thêm cạnh type UI hiện có)
export type EvaluationType = 'ADVISOR' | 'EXAMINER' | 'COUNCIL'
export type TemplateDisplayStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'EXPIRED'

/** Ngày BE trả: "dd-MM-yyyy"; ngày giờ: "dd-MM-yyyy HH:mm:ss" */
type BeDate = string
type BeDateTime = string

export interface EvaluationTemplateSummary {
  publicId: string
  name: string
  type: EvaluationType
  effectiveFrom: BeDate | null
  effectiveTo: BeDate | null
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
  effectiveFrom: BeDate | null
  effectiveTo: BeDate | null
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
  canChangeEffectiveFrom: boolean
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

export interface ApplyPreview {
  effectiveFrom: BeDate
  closingTemplatePublicId: string | null
  closingTemplateName: string | null
  closingTemplateEffectiveFrom: BeDate | null
  closingTemplateEffectiveTo: BeDate | null
  assignedSemesterCount: number
  keptSemesterCount: number
}

export interface SemesterEvaluationTemplate {
  evaluationType: EvaluationType
  evaluationTypeName: string
  templatePublicId: string | null
  templateName: string | null
  effectiveFrom: BeDate | null
  effectiveTo: BeDate | null
  displayStatus: TemplateDisplayStatus | null
  displayStatusName: string | null
  canChange: boolean
}

export interface ChangeSemesterRubricBody {
  evaluationType: EvaluationType
  templatePublicId: string
}
```

```ts
export const rubricKeys = {
  all: ['department', 'rubric'] as const,
  lists: () => [...rubricKeys.all, 'list'] as const,
  list: (type: EvaluationType) => [...rubricKeys.lists(), type] as const,
  detail: (publicId: string) => [...rubricKeys.all, 'detail', publicId] as const,
  preview: (publicId: string, effectiveFrom: string) =>
    [...rubricKeys.all, 'preview', publicId, effectiveFrom] as const,
  semester: (semesterPublicId: string) => [...rubricKeys.all, 'semester', semesterPublicId] as const,
}

// useRubricList(type), useRubricDetail(publicId), useApplyPreview(publicId, date) (enabled khi đã chọn ngày)
// Mutation (create/clone/save/remove/apply/changeEffectiveFrom/cancelApply):
//   onSuccess → toast.success(message)
//             + invalidateQueries({ queryKey: rubricKeys.lists() })
//             + invalidateQueries({ queryKey: rubricKeys.detail(publicId) })
//   apply / changeEffectiveFrom / cancelApply còn làm đổi rubric của học kỳ
//             → invalidateQueries({ queryKey: [...rubricKeys.all, 'semester'] })
// useChangeSemesterRubric: onSuccess → invalidate rubricKeys.semester(id) + rubricKeys.lists()
//   (semesterCount của rubric thay đổi)
```

Đổi tab loại phiếu → đổi `type` của `useRubricList`, không cần gọi lại các tab khác.

---

## 10. Lưu ý

- Các API đã có unit test ở tầng Service (`EvaluationTemplateServiceImplTest`, `SemesterServiceImplTest`), **chưa** chạy thử end-to-end với FE.
  Gặp sai lệch với tài liệu này thì báo BE.
- Trạng thái đổi theo ngày mà không cần thao tác: rubric `SCHEDULED` tự thành `ACTIVE` khi tới ngày. Trang mở qua đêm nên refetch khi focus lại.
- `version` tăng sau **mọi** lần ghi rubric (A5, A8, A9, A10, và khi rubric liền trước bị đổi `effectiveTo`). Màn chi tiết luôn dùng `version` của lần A2 gần nhất.
- Không gửi `displayOrder`, `maxScore`, `totalWeight` lên BE ở A5 – BE tự tính, field thừa bị bỏ qua.
- Ngày gửi lên `yyyy-MM-dd`, ngày nhận về `dd-MM-yyyy` (Mục 3). Đừng đưa thẳng ngày từ response vào request.

---

## 11. Tóm tắt nhanh

| #   | API                                                      | Body / query                                   | Thành công                                     | Lỗi riêng chính                        |
| :-- | :------------------------------------------------------- | :--------------------------------------------- | :--------------------------------------------- | :------------------------------------- |
| A1  | `GET /evaluation-template`                               | query `type` (mặc định `ADVISOR`)              | `data: EvaluationTemplateSummary[]`            | —                                      |
| A2  | `GET /evaluation-template/{publicId}`                    | —                                              | `data: EvaluationTemplateDetail`               | `404 3101`                             |
| A3  | `POST /evaluation-template`                              | `{ type, name }`                               | Thêm mới thành công, `data: publicId`          | `4000`                                 |
| A4  | `POST /evaluation-template/{publicId}/clone`             | —                                              | Nhân bản thành công, `data: publicId`          | `404 3101`                             |
| A5  | `PUT /evaluation-template/{publicId}`                    | `{ name, version, groups[] }`                  | Cập nhật thành công                            | `4000`, `3101`, `3102`, `3109`, `3103`, `3113` |
| A6  | `DELETE /evaluation-template/{publicId}`                 | —                                              | Xóa thành công                                 | `3101`, `3107`, `3108`                 |
| A7  | `GET /evaluation-template/{publicId}/apply-preview`      | query `effectiveFrom=yyyy-MM-dd`               | `data: ApplyPreview`                           | `3101`, `3104`, `3110`, `3105`, `3106` |
| A8  | `POST /evaluation-template/{publicId}/apply`             | `{ effectiveFrom }`                            | Áp dụng thành công                             | `3101`, `3107`, `3103`, `3104`, `3109` |
| A9  | `PATCH /evaluation-template/{publicId}/effective-from`   | `{ effectiveFrom }`                            | Cập nhật thành công                            | `3101`, `3110`, `3105`, `3106`, `3104`, `3109` |
| A10 | `POST /evaluation-template/{publicId}/cancel-apply`      | —                                              | Hủy áp dụng thành công                         | `3101`, `3110`, `3105`, `3106`, `3109` |
| B1  | `GET /semester/{semesterPublicId}/evaluation-template`   | —                                              | `data: SemesterEvaluationTemplate[3]`          | `404 4041`                             |
| B2  | `PUT /semester/{semesterPublicId}/evaluation-template`   | `{ evaluationType, templatePublicId }`         | Cập nhật thành công                            | `4041`, `3111`, `3101`, `3112`, `3114` |
