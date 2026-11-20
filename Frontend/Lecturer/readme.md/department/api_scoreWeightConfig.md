# Cấu hình điểm – Trọng số điểm tổng kết (Trưởng bộ môn) – Đặc tả API

> Mô tả 9 API cấu hình **trọng số 3 đầu điểm** (Hướng dẫn / Phản biện / Hội đồng) dùng để tính **điểm tổng kết** của
> sinh viên. Hợp đồng API lấy từ backend Spring Boot (`tlu_gpms_system`):
> - `features/score_config/` (`ScoreWeightConfigController`, `ScoreWeightConfigServiceImpl`, `ScoreWeightRules`, `TemplateStatusRules`, `SemesterRangeRules`)
> - API danh sách học kỳ `GET /semester` có sẵn (dùng cho ô chọn "Từ kỳ" / "Đến kỳ", giống rubric)
>
> Vòng đời (Nháp → Sắp áp dụng → Đang áp dụng → Hết áp dụng) và cách áp dụng theo **khoảng học kỳ** giống hệt rubric:
> xem `api_rubricConfig.md` Mục 6. File này chỉ ghi phần khác.
> Quy ước chung (wrapper response, interceptor, toast, refresh token) giống Mục 3 của `api_addStudent.md`.

---

## 1. Trạng thái hiện tại

| #   | Việc                                                       | Trạng thái                                                                          |
| :-- | :--------------------------------------------------------- | :---------------------------------------------------------------------------------- |
| 1   | Danh sách cấu hình trọng số                                | ✅ BE đã có – `GET /score-weight-config` (W1)                                        |
| 2   | Chi tiết cấu hình (kèm `version` + cờ bật/tắt nút)         | ✅ BE đã có – `GET /score-weight-config/{publicId}` (W2)                             |
| 3   | Tạo cấu hình Nháp (tên + 3 trọng số)                       | ✅ BE đã có – `POST /score-weight-config` (W3)                                       |
| 4   | Sửa tên + 3 trọng số                                       | ✅ BE đã có – `PUT /score-weight-config/{publicId}` (W4)                             |
| 5   | Xóa cấu hình Nháp                                          | ✅ BE đã có – `DELETE /score-weight-config/{publicId}` (W5)                          |
| 6   | Xem trước Áp dụng / Sửa kỳ áp dụng                         | ✅ BE đã có – `GET /score-weight-config/{publicId}/apply-preview` (W6)               |
| 7   | Xem trước Hủy áp dụng                                      | ✅ BE đã có – `GET /score-weight-config/{publicId}/cancel-apply-preview` (W6b)       |
| 8   | Áp dụng cho khoảng học kỳ "Từ kỳ" – "Đến kỳ"               | ✅ BE đã có – `POST /score-weight-config/{publicId}/apply` (W7)                      |
| 9   | Sửa kỳ áp dụng                                             | ✅ BE đã có – `PATCH /score-weight-config/{publicId}/semester-range` (W8)            |
| 10  | Hủy áp dụng (về Nháp)                                      | ✅ BE đã có – `POST /score-weight-config/{publicId}/cancel-apply` (W9)               |
| 11  | Tab "Trọng số tổng kết" trong màn Cấu hình điểm            | ✅ FE đã làm – `score_management` (Mục 2)                                            |

**API rubric không đổi.** Màn "Cấu hình điểm" chỉ thêm tab thứ 4, 3 tab rubric giữ nguyên.

---

## 2. Vị trí code FE

### 2.1. Cấu trúc thư mục

Thêm vào sub-feature có sẵn `src/features/department/score_management/`:

```
score_management/
├── components/
│   ├── GradingConfigTabs.tsx         # 4 tab: Hướng dẫn / Phản biện / Hội đồng / Trọng số tổng kết
│   ├── ScoreWeightPanel.tsx          # nội dung tab trọng số: bảng + nút Tạo mới + các hộp thoại
│   ├── ScoreWeightTable.tsx          # bảng danh sách
│   ├── ScoreWeightFormDialog.tsx     # tạo / sửa (tên + 3 ô %)
│   └── ApplyScoreWeightDialog.tsx    # áp dụng / sửa kỳ (chọn kỳ + xem trước)
├── hooks/useScoreWeights.ts
├── services/scoreWeight.service.ts
├── utils/scoreWeightSchema.ts        # zod + tính tổng
└── types.ts                          # thêm type ScoreWeight*
```

### 2.2. Endpoint (`src/shared/api/endpoints.ts`)

```ts
departmentScoreWeight: {
  // GET: danh sách · POST: tạo Nháp
  base: '/score-weight-config',
  // GET: chi tiết · PUT: sửa tên + trọng số · DELETE: xóa Nháp
  detail: (publicId: string) => `/score-weight-config/${publicId}`,
  applyPreview: (publicId: string) => `/score-weight-config/${publicId}/apply-preview`,
  cancelApplyPreview: (publicId: string) => `/score-weight-config/${publicId}/cancel-apply-preview`,
  apply: (publicId: string) => `/score-weight-config/${publicId}/apply`,
  semesterRange: (publicId: string) => `/score-weight-config/${publicId}/semester-range`,
  cancelApply: (publicId: string) => `/score-weight-config/${publicId}/cancel-apply`,
},
```

### 2.3. Enum

Dùng lại `TemplateDisplayStatus` của rubric: `'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'EXPIRED'`
(Nháp / Sắp áp dụng / Đang áp dụng / Hết áp dụng). Nhãn hiển thị lấy từ `displayStatusName` BE trả.

---

## 3. Quy ước chung

- Chỉ **Trưởng bộ môn** (`HEAD_OF_MAJOR`) gọi được. Role khác → 403 / 2001.
- Trọng số tính theo **%**, gửi và nhận là **JSON number** (`40`, `30.5`), không phải chuỗi.
  - Mỗi đầu điểm: `> 0`, `≤ 100`, tối đa **2 chữ số thập phân**.
  - Tổng 3 đầu điểm phải **đúng bằng 100**.
- Ngày giờ: `"dd-MM-yyyy HH:mm:ss"` (giống rubric).
- Các cờ `canEdit`, `canApply`... do BE tính → FE chỉ bật / tắt nút theo cờ, không tự suy luận.
- Ghi xong (tạo, sửa, xóa, áp dụng, sửa kỳ, hủy) → tải lại danh sách W1.
- **Học kỳ không có cấu hình trọng số** → BE **không tính** điểm tổng kết (`finalScore = null`), không có mặc định 1:1:1.
  Áp dụng / sửa kỳ / hủy áp dụng / sửa trọng số của cấu hình đang áp dụng đều làm BE tính lại điểm tổng kết các kỳ liên quan.

### 3.1. Lỗi chung

| Trường hợp                    | HTTP | `code` |
| :---------------------------- | :--- | :----- |
| Chưa đăng nhập / token hết hạn | 401  | 2000   |
| Không phải Trưởng bộ môn       | 403  | 2001   |
| JSON hỏng, `publicId` sai kiểu | 400  | 1006   |
| Lỗi hệ thống                  | 500  | 1001   |

### 3.2. Lỗi nghiệp vụ

| `code` | HTTP | Message BE                                                                                           | Khi nào                                                    |
| :----- | :--- | :--------------------------------------------------------------------------------------------------- | :--------------------------------------------------------- |
| 3129   | 404  | Không tìm thấy cấu hình trọng số                                                                     | `publicId` không tồn tại (đã bị xóa)                       |
| 3130   | 400  | Chỉ được sửa cấu hình Nháp hoặc cấu hình đang áp dụng mà các kỳ chưa có phiếu chấm nộp chính thức   | W4 khi `canEdit = false`                                   |
| 3131   | 400  | Khoảng kỳ áp dụng đã có phiếu chấm nộp chính thức, không thể đổi "Từ kỳ" hoặc hủy áp dụng           | W6/W8 đổi "Từ kỳ", W6b/W9                                  |
| 3132   | 400  | Chỉ thao tác được với cấu hình trọng số ở trạng thái Nháp                                            | W5, W7 khi không còn Nháp                                  |
| 3133   | 409  | Cấu hình trọng số đã được người khác cập nhật, vui lòng tải lại trang trước khi lưu                  | W4 gửi `version` cũ                                        |
| 3134   | 400  | "Từ kỳ" phải là học kỳ chưa kết thúc                                                                 | R1                                                         |
| 3135   | 400  | "Đến kỳ" không được trước "Từ kỳ"                                                                    | R2                                                         |
| 3136   | 409  | *(message động)* Khoảng học kỳ bị trùng với cấu hình trọng số "…" (… → …). Hãy sửa "Đến kỳ" của cấu hình đó trước | R3 – **hiện nguyên văn**                     |
| 3137   | 400  | *(message động)* Không thể bỏ học kỳ đã có phiếu chấm nộp chính thức ra khỏi khoảng áp dụng: …       | R5 – **hiện nguyên văn**                                   |
| 3138   | 400  | Cấu hình trọng số chưa được áp dụng                                                                  | W8, W6b, W9 với Nháp; W6 với Hết áp dụng                   |
| 3139   | 400  | Tổng trọng số 3 đầu điểm phải bằng 100%                                                              | W3, W4                                                     |
| 4041   | 404  | Không tìm thấy học kỳ yêu cầu                                                                        | `fromSemesterId` / `toSemesterId` không tồn tại            |

> "Phiếu chấm nộp chính thức" = phiếu chấm (bất kỳ loại nào) trạng thái `SUBMITTED` thuộc một học kỳ trong khoảng.
> Cờ `hasSubmittedSheets` trong response cho biết điều này.

### 3.3. Lỗi validate (`code = 4000`, HTTP 400)

| Key BE                              | Message                                                            |
| :---------------------------------- | :----------------------------------------------------------------- |
| `SCORE_WEIGHT_CONFIG_NAME_EMPTY`    | Tên cấu hình trọng số không được để trống                          |
| `SCORE_WEIGHT_CONFIG_NAME_TOO_LONG` | Tên cấu hình trọng số tối đa 255 ký tự                             |
| `SCORE_WEIGHT_NULL`                 | Vui lòng nhập đủ trọng số 3 đầu điểm                               |
| `SCORE_WEIGHT_INVALID`              | Trọng số phải lớn hơn 0, không quá 100, tối đa 2 chữ số thập phân  |
| `SCORE_WEIGHT_CONFIG_VERSION_NULL`  | Thiếu phiên bản cấu hình trọng số                                  |
| `EVALUATION_FROM_SEMESTER_NULL`     | Vui lòng chọn "Từ kỳ"                                              |

FE nên chặn sớm bằng zod (Mục 8.3) để người dùng thấy lỗi dưới từng ô, BE vẫn kiểm tra lại.

---

## 4. Response chung `ScoreWeightConfigResponse`

W1 (mỗi phần tử) và W2 trả **cùng một kiểu** (cấu hình chỉ có vài field nên không tách list / detail).

```json
{
  "publicId": "0195f3a2-1c4b-7d10-9a01-000000000001",
  "name": "Trọng số K66",
  "advisorWeight": 30,
  "examinerWeight": 30,
  "councilWeight": 40,
  "fromSemester": { "publicId": "0193a000-0000-7000-8000-000000000101", "name": "Học kỳ 1 năm học 2026-2027" },
  "toSemester": null,
  "displayStatus": "ACTIVE",
  "displayStatusName": "Đang áp dụng",
  "version": 3,
  "hasSubmittedSheets": false,
  "canEdit": true,
  "canApply": false,
  "canChangeFromSemester": true,
  "canChangeToSemester": true,
  "canCancelApply": true,
  "canDelete": false,
  "createdByName": "Nguyễn Văn A",
  "updatedByName": "Nguyễn Văn A",
  "createdAt": "10-11-2026 09:15:00",
  "updatedAt": "18-11-2026 14:02:31"
}
```

| Field                                          | Ý nghĩa                                                                                     |
| :--------------------------------------------- | :------------------------------------------------------------------------------------------ |
| `advisorWeight` / `examinerWeight` / `councilWeight` | Trọng số (%) điểm Hướng dẫn / Phản biện / Hội đồng. Tổng luôn = 100                  |
| `fromSemester`                                 | "Từ kỳ"; `null` = Nháp                                                                      |
| `toSemester`                                   | "Đến kỳ"; `null` = chưa xác định kỳ kết thúc (hoặc Nháp)                                    |
| `displayStatus` / `displayStatusName`          | Trạng thái tính theo khoảng kỳ so với hôm nay (không lưu DB)                                |
| `version`                                      | Khóa lạc quan: gửi lại đúng số này khi sửa (W4)                                             |
| `hasSubmittedSheets`                           | Khoảng kỳ áp dụng đã có phiếu chấm nộp chính thức → khóa sửa trọng số, đổi "Từ kỳ", hủy áp dụng |
| `canEdit`                                      | Nút **Sửa** (Nháp, hoặc Sắp/Đang áp dụng mà chưa có phiếu nộp)                              |
| `canApply`                                     | Nút **Áp dụng** (chỉ Nháp)                                                                  |
| `canChangeFromSemester`                        | Ô "Từ kỳ" trong hộp thoại Sửa kỳ được chọn                                                   |
| `canChangeToSemester`                          | Nút **Sửa kỳ áp dụng** (Sắp/Đang áp dụng)                                                    |
| `canCancelApply`                               | Nút **Hủy áp dụng** (Sắp/Đang áp dụng, chưa có phiếu nộp)                                    |
| `canDelete`                                    | Nút **Xóa** (chỉ Nháp)                                                                      |

Bảng cờ theo trạng thái (để FE kiểm tra lại giao diện):

| Trạng thái        | Sửa                 | Áp dụng | Sửa kỳ | Đổi "Từ kỳ"        | Hủy áp dụng         | Xóa |
| :---------------- | :------------------ | :------ | :----- | :----------------- | :------------------ | :-- |
| Nháp              | ✅                  | ✅      | –      | –                  | –                   | ✅  |
| Sắp / Đang áp dụng | ✅ nếu chưa có phiếu | –       | ✅     | ✅ nếu chưa có phiếu | ✅ nếu chưa có phiếu | –   |
| Hết áp dụng       | –                   | –       | –      | –                  | –                   | –   |

---

## 5. Danh sách, chi tiết, tạo, sửa, xóa

### 5.1. `GET /score-weight-config` – Danh sách (W1)

Không phân trang, không query. Trả mảng `ScoreWeightConfigResponse` (Mục 4), rỗng thì `data: []`.
Sắp xếp do BE quyết định; FE hiển thị đúng thứ tự trả về.

### 5.2. `GET /score-weight-config/{publicId}` – Chi tiết (W2)

Trả 1 `ScoreWeightConfigResponse`. Dùng khi mở hộp thoại Sửa để lấy `version` mới nhất. Lỗi: 3129.

### 5.3. `POST /score-weight-config` – Tạo Nháp (W3)

```json
{ "name": "Trọng số K66", "advisorWeight": 30, "examinerWeight": 30, "councilWeight": 40 }
```

```json
{ "code": 1000, "message": "Thêm mới thành công", "data": "0195f3a2-1c4b-7d10-9a01-000000000001" }
```

`data` = `publicId` cấu hình mới (trạng thái Nháp). Lỗi: 4000 (Mục 3.3), 3139.

### 5.4. `PUT /score-weight-config/{publicId}` – Sửa tên + trọng số (W4)

```json
{ "name": "Trọng số K66", "advisorWeight": 25, "examinerWeight": 25, "councilWeight": 50, "version": 3 }
```

```json
{ "code": 1000, "message": "Cập nhật thành công" }
```

| Lỗi (đúng thứ tự BE kiểm tra)              | HTTP | `code` |
| :----------------------------------------- | :--- | :----- |
| Thiếu / sai field                          | 400  | 4000   |
| Tổng ≠ 100                                 | 400  | 3139   |
| Không tìm thấy                             | 404  | 3129   |
| Không được sửa (`canEdit = false`)         | 400  | 3130   |
| `version` cũ (người khác vừa sửa)          | 409  | 3133   |

> Sửa cấu hình **đang áp dụng** → BE tính lại điểm tổng kết các kỳ trong khoảng theo trọng số mới.
> Hiện câu nhắc trong hộp thoại: "Cấu hình đang áp dụng: điểm tổng kết của các học kỳ trong khoảng sẽ được tính lại."

### 5.5. `DELETE /score-weight-config/{publicId}` – Xóa Nháp (W5)

```json
{ "code": 1000, "message": "Xóa thành công" }
```

Xóa cứng. Lỗi: 3129, 3132 (không còn là Nháp).

---

## 6. Vòng đời áp dụng

Giống hệt rubric (`api_rubricConfig.md` Mục 6), chỉ đổi URL và mã lỗi:

| Rubric | Trọng số | API                                                                         |
| :----- | :------- | :-------------------------------------------------------------------------- |
| A7     | W6       | `GET /score-weight-config/{publicId}/apply-preview?fromSemesterId=&toSemesterId=` |
| A7b    | W6b      | `GET /score-weight-config/{publicId}/cancel-apply-preview`                  |
| A8     | W7       | `POST /score-weight-config/{publicId}/apply`                                |
| A9     | W8       | `PATCH /score-weight-config/{publicId}/semester-range`                      |
| A10    | W9       | `POST /score-weight-config/{publicId}/cancel-apply`                         |

- Ô chọn học kỳ: `GET /semester?page=0&size=100&sortBy=startDate&sortDir=ASC` (dùng chung với rubric).
  "Từ kỳ" bỏ kỳ đã kết thúc; "Đến kỳ" chỉ gồm kỳ bắt đầu không sớm hơn "Từ kỳ", thêm lựa chọn "Chưa xác định".
- Khoảng kỳ của 2 cấu hình trọng số **không được giao nhau** (R3, lỗi 3136). Trọng số và rubric độc lập, không kiểm tra chéo.

### 6.1. W6 – Xem trước Áp dụng / Sửa kỳ

Query `fromSemesterId` (bắt buộc), `toSemesterId` (bỏ trống = chưa xác định). Gửi `skipErrorToast: true`, lỗi hiện dưới 2 ô chọn.

```json
{
  "code": 1000,
  "data": {
    "fromSemester": { "publicId": "…102", "name": "Học kỳ 2 năm học 2026-2027" },
    "toSemester": null,
    "assignedSemesters": [{ "publicId": "…102", "name": "Học kỳ 2 năm học 2026-2027" }],
    "releasedSemesters": []
  }
}
```

- `assignedSemesters`: học kỳ **mới vào** khoảng → "Các học kỳ sẽ tính điểm tổng kết theo cấu hình này: …"
- `releasedSemesters`: học kỳ **rời** khoảng (chỉ khi Sửa kỳ) → "Các học kỳ sẽ không còn cấu hình trọng số (chưa có điểm tổng kết): …"

Lỗi (thứ tự BE kiểm tra): 3129 → 3138 (Hết áp dụng) → 4000 `EVALUATION_FROM_SEMESTER_NULL` → 4041 → 3131 (đổi "Từ kỳ" khi đã có phiếu) → 3134 → 3135 → 3136 → 3137.

### 6.2. W6b – Xem trước Hủy áp dụng

```json
{ "code": 1000, "data": { "assignedSemesters": [], "releasedSemesters": [{ "publicId": "…101", "name": "Học kỳ 1 năm học 2026-2027" }] } }
```

`releasedSemesters` = các kỳ sẽ **không còn** cấu hình trọng số. Lỗi: 3129, 3138, 3131.

### 6.3. W7 – Áp dụng (chỉ Nháp) / W8 – Sửa kỳ

Body chung:

```json
{ "fromSemesterId": "0193a000-0000-7000-8000-000000000101", "toSemesterId": null }
```

```json
{ "code": 1000, "message": "Áp dụng thành công" }
```

W8 trả `"Cập nhật thành công"`. Lỗi như W6; W7 thêm 3132 (không còn Nháp), 3139 (trọng số lỗi – hiếm, BE kiểm tra lại).

### 6.4. W9 – Hủy áp dụng

Không body. Trả `"Hủy áp dụng thành công"`, cấu hình về Nháp. Lỗi: 3129, 3138, 3131.

---

## 7. Gợi ý giao diện (tab "Trọng số tổng kết")

| Cột                | Nội dung                                                                       |
| :----------------- | :----------------------------------------------------------------------------- |
| Tên cấu hình       | `name`                                                                         |
| Trọng số           | "HD 30% · PB 30% · HĐ 40%"                                                      |
| Trạng thái         | Badge theo `displayStatus`, chữ = `displayStatusName` (màu giống rubric)        |
| Thời gian áp dụng  | "{from} → {to ?? 'Chưa xác định'}"; Nháp → "Chưa áp dụng"                      |
| Phiếu chấm         | `hasSubmittedSheets` → "Đã có phiếu nộp (khóa)"; ngược lại "Chưa có"           |
| Cập nhật           | `updatedByName` + `updatedAt`                                                  |
| Thao tác           | Nút theo cờ: Sửa, Áp dụng, Sửa kỳ, Hủy áp dụng, Xóa                            |

Hộp thoại Tạo / Sửa: ô tên + 3 ô % + dòng **tổng hiện tại** (xanh khi = 100, đỏ khi khác).

---

## 8. Code FE

### 8.1. Types

```ts
export interface ScoreWeightConfig {
  publicId: string
  name: string
  advisorWeight: number
  examinerWeight: number
  councilWeight: number
  fromSemester: SemesterRef | null
  toSemester: SemesterRef | null
  displayStatus: TemplateDisplayStatus
  displayStatusName: string
  version: number
  hasSubmittedSheets: boolean
  canEdit: boolean
  canApply: boolean
  canChangeFromSemester: boolean
  canChangeToSemester: boolean
  canCancelApply: boolean
  canDelete: boolean
  createdByName: string | null
  updatedByName: string | null
  createdAt: BeDateTime | null
  updatedAt: BeDateTime | null
}

export interface ScoreWeightBody {
  name: string
  advisorWeight: number
  examinerWeight: number
  councilWeight: number
}

export interface UpdateScoreWeightBody extends ScoreWeightBody {
  version: number
}
```

`SemesterRangeBody`, `ApplyPreview`, `SemesterRef` dùng lại của rubric.

### 8.2. Service

```ts
const WEIGHT = API_ENDPOINTS.departmentScoreWeight

export const scoreWeightService = {
  async getList(): Promise<ScoreWeightConfig[]> {
    const res = await apiClient.get<ApiResponse<ScoreWeightConfig[] | null>>(WEIGHT.base)
    return res.data.data ?? []
  },
  async getDetail(publicId: string): Promise<ScoreWeightConfig> {
    const res = await apiClient.get<ApiResponse<ScoreWeightConfig>>(WEIGHT.detail(publicId))
    return res.data.data
  },
  // Tạo / sửa: lỗi hiện trong hộp thoại
  async create(body: ScoreWeightBody): Promise<string> {
    const res = await apiClient.post<ApiResponse<string>>(WEIGHT.base, body, { skipErrorToast: true })
    return res.data.data
  },
  async update(publicId: string, body: UpdateScoreWeightBody): Promise<void> {
    await apiClient.put<ApiResponse<null>>(WEIGHT.detail(publicId), body, { skipErrorToast: true })
  },
  async remove(publicId: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(WEIGHT.detail(publicId))
  },
  // getApplyPreview, getCancelApplyPreview, apply, changeSemesterRange, cancelApply: giống rubricService
}
```

### 8.3. Schema zod

```ts
const weightField = z
  .number({ error: 'Vui lòng nhập trọng số' })
  .gt(0, 'Trọng số phải lớn hơn 0')
  .max(100, 'Trọng số không quá 100')
  .refine((v) => Number.isInteger(Math.round(v * 100 * 1e6) / 1e6), 'Tối đa 2 chữ số thập phân')

export const scoreWeightSchema = z
  .object({
    name: z.string().trim().min(1, 'Tên cấu hình không được để trống').max(255, 'Tên cấu hình tối đa 255 ký tự'),
    advisorWeight: weightField,
    examinerWeight: weightField,
    councilWeight: weightField,
  })
  .refine((v) => Math.round((v.advisorWeight + v.examinerWeight + v.councilWeight) * 100) === 10000, {
    message: 'Tổng trọng số 3 đầu điểm phải bằng 100%',
    path: ['total'],
  })
```

So sánh tổng bằng số nguyên (×100) để tránh lỗi số thực (`33.33 + 33.33 + 33.34`).

### 8.4. Hooks

- Query key: `['department', 'score-weight', 'list' | 'detail' | 'preview' | 'cancel-preview', ...]`.
- Mọi mutation thành công → `invalidateQueries(['department','score-weight','list'])` + xóa cache xem trước.
- Lỗi cho thấy dữ liệu cũ (3129, 3130, 3131, 3132, 3138) → tải lại danh sách. 3133 → báo người dùng tải lại.

---

## 9. Lưu ý

- Không có cấu hình mặc định: kỳ nào chưa có cấu hình đang áp dụng thì điểm tổng kết của sinh viên kỳ đó **trống**.
  Nên nhắc TBM áp dụng một cấu hình cho kỳ hiện tại.
- Sinh viên xem điểm qua `GET /thesis-score/my-score?semesterId=` (không thuộc tab này): field `weightConfigured = false`
  thì hiện "Chưa có cấu hình trọng số, chưa tính điểm tổng kết".
- Trọng số của cấu hình đã có phiếu nộp chính thức bị khóa; muốn đổi cho kỳ sau → tạo cấu hình mới, sửa "Đến kỳ" của cấu hình cũ rồi áp dụng cấu hình mới.
