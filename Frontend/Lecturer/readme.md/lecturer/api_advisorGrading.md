# API chấm điểm hướng dẫn (màn Giáo viên hướng dẫn)

> Dùng cho màn **Đánh giá hướng dẫn** của giảng viên (`src/features/lecturer/guiding_evaluation`), hiện đang chạy mock (`useLecturerPortalStore.guidingEvaluations`, rubric cứng `RUBRIC_GROUPS` 9 tiêu chí).
> Khi nối BE: **rubric không còn cứng ở FE nữa**. Nhóm tiêu chí, tiêu chí, trọng số đều lấy từ phiếu chấm BE trả về (rubric Trưởng bộ môn đã áp dụng cho học kỳ).
> BE: `SupervisorGradeController` / `SupervisorGradeServiceImpl` (package `features/grade_capstone`).

## 1. Tổng quan

| #  | Method | URL                                          | Mục đích                                        | Trả về `data`                     |
| -- | ------ | -------------------------------------------- | ----------------------------------------------- | --------------------------------- |
| C1 | GET    | `/advisor-grade/topic?semesterId=`           | Danh sách đề tài GV cần chấm + thống kê         | `AdvisorGradeTopicListResponse`   |
| C2 | POST   | `/advisor-grade/topic/{topicPublicId}/sheet` | Mở phiếu chấm (chưa có thì tạo phiếu Nháp)      | `EvaluationSheetResponse`         |
| C3 | GET    | `/advisor-grade/sheet/{sheetPublicId}`       | Xem chi tiết phiếu                              | `EvaluationSheetResponse`         |
| C4 | PUT    | `/advisor-grade/sheet/{sheetPublicId}`       | Lưu nháp                                        | không có (`message`)              |
| C5 | POST   | `/advisor-grade/sheet/{sheetPublicId}/submit`| Nộp phiếu (khóa vĩnh viễn)                      | `EvaluationSheetResponse` đã khóa |

Chung cho cả 5 API:

| Mục        | Giá trị                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------- |
| Header     | `Authorization: Bearer <accessToken>` hoặc cookie `access_token`                          |
| Role       | `SUPERVISOR`. Role khác → **403 / 2001**                                                   |
| Quyền thêm | Chỉ **GVHD chính** của đề tài (không tính đồng hướng dẫn) và đúng người chấm của phiếu    |
| Phân trang | **Không** (C1 trả cả danh sách, không dùng `fromPageResponse`)                            |
| Ngày giờ   | ISO-8601 không múi giờ, vd `"2026-11-17T10:00:00"` (**khác** các API template dùng `dd-MM-yyyy HH:mm:ss`) |
| Thành công | `code = 1000`                                                                             |

Thêm vào `src/shared/api/endpoints.ts`:

```ts
advisorGrade: {
  topics: '/advisor-grade/topic',
  openSheet: (topicPublicId: string) => `/advisor-grade/topic/${topicPublicId}/sheet`,
  sheet: (sheetPublicId: string) => `/advisor-grade/sheet/${sheetPublicId}`,
  submit: (sheetPublicId: string) => `/advisor-grade/sheet/${sheetPublicId}/submit`,
},
```

## 2. Luồng màn hình

```
Vào màn ─► C1 danh sách đề tài (tab + bảng)
             │ bấm "Chấm" / "Xem" trên 1 dòng
             ▼
          có sheetPublicId? ── có ──► C3 lấy chi tiết phiếu
             │ không
             ▼
          C2 mở phiếu (BE tạo phiếu Nháp nếu đủ điều kiện)
             │
             ▼
     Popup phiếu chấm: canEdit = true  → cho nhập, nút "Lưu nháp" (C4) + "Nộp phiếu" (C5)
                       canEdit = false → chỉ xem, hiện lý do theo readonlyReason
             │ C4 / C5 xong
             ▼
          gọi lại C1 (invalidate query) để cập nhật trạng thái, số liệu thống kê
```

- Có thể **luôn gọi C2** khi bấm vào dòng cũng được: đã có phiếu thì C2 trả phiếu đó (kể cả đã hết hạn / đã nộp), không tạo phiếu mới. Bấm 2 lần hoặc mở 2 tab cũng an toàn.
- Dòng `sheetStatus = NOT_STARTED` và `canGrade = false` → **không gọi C2** (chắc chắn lỗi), disable nút và hiện lý do `readonlyReason`.

## 3. C1 – Danh sách đề tài cần chấm

```
GET /advisor-grade/topic
GET /advisor-grade/topic?semesterId=0193a1b2-....
```

| Param        | Kiểu | Bắt buộc | Mô tả                                                                 |
| ------------ | ---- | -------- | --------------------------------------------------------------------- |
| `semesterId` | UUID | Không    | `publicId` học kỳ. Bỏ trống = học kỳ **đang diễn ra**                  |

Response:

```json
{
  "code": 1000,
  "data": {
    "semesterId": "0193a1b2-0000-7000-8000-000000000001",
    "deadline": {
      "startDate": "2026-11-10T00:00:00",
      "endDate": "2026-11-30T23:59:59",
      "open": true
    },
    "summary": { "notStarted": 3, "draft": 1, "submitted": 2 },
    "items": [
      {
        "topicPublicId": "0193a1b2-0000-7000-8000-0000000000a1",
        "topicName": "Xây dựng hệ thống quản lý đồ án",
        "studentCode": "2151060001",
        "studentName": "Nguyễn Văn A",
        "className": "63CNTT1",
        "topicStatus": "IN_PROGRESS",
        "currentStage": "STAGE_4_REPORT_APPROVED",
        "sheetPublicId": "0193a1b2-0000-7000-8000-0000000000s1",
        "sheetStatus": "DRAFT",
        "gradedCount": 5,
        "totalCriteria": 9,
        "advisorScore": null,
        "canGrade": true,
        "readonlyReason": null
      }
    ]
  }
}
```

| Field            | Ý nghĩa                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `deadline`       | Hạn chấm (mốc nộp báo cáo & phiếu theo dõi). `null` = Trưởng bộ môn chưa thiết lập         |
| `deadline.open`  | `true` khi đang trong hạn. Đúng `startDate` / `endDate` vẫn tính là trong hạn               |
| `summary`        | Đếm theo `sheetStatus`, dùng cho số trên tab                                               |
| `sheetPublicId`  | `null` khi chưa có phiếu                                                                   |
| `sheetStatus`    | `NOT_STARTED` / `DRAFT` / `SUBMITTED` (mục 8)                                              |
| `gradedCount`    | Số tiêu chí đã có điểm                                                                     |
| `totalCriteria`  | Tổng tiêu chí của rubric. `null` khi học kỳ chưa có rubric                                 |
| `advisorScore`   | Điểm hướng dẫn (thang 10, 1 chữ số thập phân). **Chỉ có khi `SUBMITTED`**, còn lại `null`  |
| `canGrade`       | `true` = bấm vào chấm / sửa được                                                           |
| `readonlyReason` | Lý do không chấm được (mục 8), `null` khi `canGrade = true`                                |

Ghi chú:

- Chỉ có đề tài mà GV đang đăng nhập là **GVHD chính**.
- BE đã sắp sẵn: `DRAFT` → `NOT_STARTED` còn chấm được → `NOT_STARTED` không chấm được → `SUBMITTED`; cùng nhóm thì theo mã SV. FE giữ nguyên thứ tự, không cần sort lại.
- Mapping tab của mock: `all` = `items`; `incomplete` = `sheetStatus !== 'SUBMITTED'`; `completed` = `sheetStatus === 'SUBMITTED'`.
- Mock đang có cột **phiếu theo dõi** (`fileName`, `submitTrackingFile`, `verifyTrackingFileContent`). Bộ API này **không** xử lý file phiếu theo dõi; phần đó giữ nguyên mock hoặc chờ API khác.

Lỗi riêng:

| HTTP | code | Key                  | Khi nào                                                  |
| ---- | ---- | -------------------- | -------------------------------------------------------- |
| 400  | 3022 | `SEMESTER_REQUIRED`  | Không gửi `semesterId` và hiện không có học kỳ đang diễn ra |
| 404  | 4041 | `SEMESTER_NOT_FOUND` | `semesterId` không tồn tại                                |

## 4. C2 – Mở phiếu chấm

```
POST /advisor-grade/topic/{topicPublicId}/sheet
(không có body)
```

- Đề tài **đã có phiếu** → trả phiếu đó luôn, không kiểm tra hạn / trạng thái (FE xem theo `canEdit`).
- **Chưa có phiếu** → BE kiểm tra theo thứ tự, sai ở bước nào trả lỗi bước đó:

| Thứ tự | Điều kiện                                                          | Lỗi nếu sai                                   |
| ------ | ------------------------------------------------------------------ | --------------------------------------------- |
| 1      | Đề tài `IN_PROGRESS` và `currentStage = STAGE_4_REPORT_APPROVED`   | 409 / 3117 `GRADING_TOPIC_NOT_ELIGIBLE`       |
| 2      | Đã thiết lập hạn chấm                                              | 400 / 3064 `DEADLINE_NOT_CONFIGURED`          |
| 3      | Đã tới `startDate`                                                 | 403 / 3065 `DEADLINE_NOT_OPEN`                |
| 4      | Chưa qua `endDate`                                                 | 403 / 3066 `DEADLINE_EXPIRED`                 |
| 5      | Học kỳ đã có rubric phiếu hướng dẫn                                | 409 / 3116 `SEMESTER_ADVISOR_TEMPLATE_NOT_ASSIGNED` |

Đủ điều kiện → tạo phiếu `DRAFT` (chưa có điểm) và trả `EvaluationSheetResponse` (mục 7).

Lỗi khác: 404 / 3049 `THESIS_TOPIC_NOT_FOUND`; 403 / 2001 khi không phải GVHD chính.

## 5. C3 – Chi tiết phiếu

```
GET /advisor-grade/sheet/{sheetPublicId}
```

Trả `EvaluationSheetResponse` (mục 7). Không tìm thấy hoặc phiếu không phải phiếu hướng dẫn → 404 / 3115 `EVALUATION_SHEET_NOT_FOUND`.

## 6. C4 Lưu nháp / C5 Nộp phiếu

```
PUT  /advisor-grade/sheet/{sheetPublicId}          → Lưu nháp
POST /advisor-grade/sheet/{sheetPublicId}/submit   → Nộp phiếu
```

Body (dùng chung):

```json
{
  "generalComment": "Sinh viên chăm chỉ, báo cáo trình bày rõ ràng.",
  "details": [
    { "criteriaId": "0193a1b2-0000-7000-8000-0000000000c1", "score": 8.5 },
    { "criteriaId": "0193a1b2-0000-7000-8000-0000000000c2", "score": null }
  ]
}
```

| Field                  | Kiểu          | Bắt buộc | Mô tả                                                                 |
| ---------------------- | ------------- | -------- | --------------------------------------------------------------------- |
| `generalComment`       | string        | Không (C4) / **Có** (C5) | Nhận xét chung. BE `trim()`, chuỗi rỗng lưu `null`     |
| `details`              | array         | **Có**   | Gửi được `[]` nhưng không được thiếu / `null`                          |
| `details[].criteriaId` | UUID          | **Có**   | `publicId` của tiêu chí (`groups[].criteria[].publicId`)               |
| `details[].score`      | number / null | Không    | Thang **0–10**, tối đa **1 chữ số thập phân**. `null` = chưa chấm      |

**Quan trọng – BE thay TOÀN BỘ điểm theo `details`:** tiêu chí gửi `score: null` hoặc **không có trong `details`** sẽ bị **xóa điểm**. FE luôn gửi đủ mọi tiêu chí của phiếu (lấy từ `groups[].criteria[]`), tiêu chí chưa nhập thì `score: null`.

Response:

```json
// C4
{ "code": 1000, "message": "Lưu nháp thành công" }

// C5
{ "code": 1000, "message": "Nộp phiếu thành công", "data": { ...EvaluationSheetResponse, "status": "SUBMITTED", "canEdit": false } }
```

C5 thêm 2 điều kiện so với C4:

- Phải có điểm **mọi** tiêu chí → thiếu: 400 / 3119 `EVALUATION_SHEET_INCOMPLETE`.
- Phải có nhận xét → thiếu: 400 / 3120 `EVALUATION_GENERAL_COMMENT_REQUIRED`.

Sau khi nộp: phiếu **khóa vĩnh viễn** (không có API mở lại); BE ghi điểm hướng dẫn vào bảng điểm đồ án và gửi thông báo cho SV (không kèm điểm).

Lỗi của C4 / C5:

| HTTP | code | Key                                    | Khi nào / message                                                |
| ---- | ---- | -------------------------------------- | ---------------------------------------------------------------- |
| 400  | 4000 | `EVALUATION_DETAILS_REQUIRED`          | Thiếu `details`                                                  |
| 400  | 4000 | `EVALUATION_CRITERIA_ID_REQUIRED`      | Có phần tử thiếu `criteriaId`                                    |
| 400  | 4000 | `EVALUATION_SCORE_INVALID`             | "Điểm tiêu chí phải từ 0 đến 10, tối đa 1 chữ số thập phân"      |
| 400  | 3122 | `EVALUATION_CRITERIA_DUPLICATED`       | Một tiêu chí gửi 2 lần                                           |
| 400  | 3121 | `EVALUATION_CRITERIA_NOT_IN_TEMPLATE`  | `criteriaId` không thuộc rubric của phiếu                        |
| 409  | 3118 | `EVALUATION_SHEET_ALREADY_SUBMITTED`   | Phiếu đã nộp                                                     |
| 409  | 3117 | `GRADING_TOPIC_NOT_ELIGIBLE`           | Đề tài đã đổi trạng thái (bị đình chỉ, hủy, sang giai đoạn khác) |
| 400/403 | 3064/3065/3066 | `DEADLINE_*`                 | Chưa thiết lập / chưa mở / đã hết hạn chấm                       |
| 404  | 3115 | `EVALUATION_SHEET_NOT_FOUND`           | Sai `sheetPublicId`                                              |
| 400  | 3119 | `EVALUATION_SHEET_INCOMPLETE`          | (chỉ C5) Chưa chấm đủ tiêu chí                                   |
| 400  | 3120 | `EVALUATION_GENERAL_COMMENT_REQUIRED`  | (chỉ C5) Thiếu nhận xét                                          |

> Mã `4000` dùng chung cho nhiều lỗi validate, FE hiển thị theo `message`, không phân biệt theo `code`.

## 7. `EvaluationSheetResponse` (C2, C3, C5)

```json
{
  "sheetPublicId": "0193a1b2-0000-7000-8000-0000000000s1",
  "status": "DRAFT",
  "topic": {
    "publicId": "0193a1b2-0000-7000-8000-0000000000a1",
    "name": "Xây dựng hệ thống quản lý đồ án",
    "status": "IN_PROGRESS",
    "currentStage": "STAGE_4_REPORT_APPROVED"
  },
  "student": {
    "studentCode": "2151060001",
    "fullName": "Nguyễn Văn A",
    "className": "63CNTT1",
    "majorName": "Công nghệ thông tin"
  },
  "evaluator": {
    "teacherCode": "GV001",
    "fullName": "Trần Văn B",
    "academicTitle": "ThS",
    "organization": "Bộ môn Công nghệ phần mềm"
  },
  "template": { "publicId": "0193a1b2-...-t1", "name": "Rubric hướng dẫn 2026" },
  "groups": [
    {
      "publicId": "0193a1b2-...-g1",
      "name": "Chuyên cần, ý thức và thái độ làm việc",
      "displayOrder": 1,
      "weight": 20,
      "criteria": [
        {
          "publicId": "0193a1b2-...-c1",
          "name": "Tham gia đầy đủ các buổi hướng dẫn theo quy định",
          "displayOrder": 1,
          "weight": 10,
          "maxScore": 1,
          "score": 8.5
        }
      ]
    }
  ],
  "generalComment": null,
  "gradedCount": 5,
  "totalCriteria": 9,
  "totalScore": null,
  "advisorScore": null,
  "submittedAt": null,
  "updatedAt": "2026-11-17T10:00:00",
  "deadline": { "startDate": "2026-11-10T00:00:00", "endDate": "2026-11-30T23:59:59", "open": true },
  "canEdit": true,
  "readonlyReason": null
}
```

| Field                       | Ý nghĩa                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| `status`                    | `DRAFT` / `SUBMITTED`                                                                    |
| `student`                   | Có thể `null` (đề tài chưa gắn SV – hiếm)                                                |
| `groups`                    | Đã sắp theo `displayOrder`; `criteria` trong nhóm cũng vậy                               |
| `groups[].weight`           | Tổng trọng số (%) các tiêu chí trong nhóm                                                |
| `criteria[].weight`         | Trọng số (%) tiêu chí. Tổng mọi tiêu chí = 100                                           |
| `criteria[].maxScore`       | Điểm đóng góp tối đa vào tổng = `weight / 10` (vd weight 25 → 2.5)                       |
| `criteria[].score`          | Điểm GV nhập (0–10), `null` = chưa chấm                                                  |
| `weight`, `maxScore`        | Đã bỏ số 0 thừa (`5.00` → `5`)                                                           |
| `totalScore`                | Tổng có trọng số, 5 chữ số thập phân. **Chỉ có khi `SUBMITTED`**                          |
| `advisorScore`              | `totalScore` làm tròn 1 chữ số (HALF_UP). **Chỉ có khi `SUBMITTED`** – đây là điểm chính thức |
| `submittedAt`               | Thời điểm nộp, `null` khi Nháp                                                           |
| `updatedAt`                 | Lần lưu gần nhất (chưa lưu lần nào thì là lúc tạo phiếu) – hiện "Đã lưu lúc ..."         |
| `deadline`                  | Như C1, `null` = chưa thiết lập                                                          |
| `canEdit` / `readonlyReason`| Có cho nhập không và lý do (mục 8)                                                        |

## 8. Enum

### `sheetStatus` (C1) / `status` (phiếu)

| Giá trị       | Nhãn gợi ý     | Màu gợi ý |
| ------------- | -------------- | --------- |
| `NOT_STARTED` | Chưa chấm      | xám       |
| `DRAFT`       | Đang chấm (nháp) | vàng    |
| `SUBMITTED`   | Đã nộp         | xanh lá   |

`NOT_STARTED` chỉ có ở C1 (chưa có phiếu); phiếu đã tạo chỉ là `DRAFT` hoặc `SUBMITTED`.

### `readonlyReason`

BE chỉ trả **1 lý do** theo thứ tự ưu tiên từ trên xuống:

| Giá trị                   | Nhãn gợi ý cho FE                                                      |
| ------------------------- | ---------------------------------------------------------------------- |
| `SUBMITTED`               | Phiếu đã nộp, chỉ xem                                                  |
| `TOPIC_DISQUALIFIED`      | Đề tài bị đình chỉ                                                     |
| `TOPIC_CANCELLED`         | Đề tài đã hủy                                                          |
| `TOPIC_NOT_READY`         | Đề tài chưa được duyệt báo cáo hoặc đã qua giai đoạn chấm hướng dẫn    |
| `DEADLINE_NOT_CONFIGURED` | Chưa thiết lập hạn chấm                                                |
| `DEADLINE_NOT_OPEN`       | Chưa đến thời gian chấm (hiện kèm `deadline.startDate`)                |
| `DEADLINE_EXPIRED`        | Đã hết hạn chấm (hiện kèm `deadline.endDate`)                          |
| `TEMPLATE_NOT_ASSIGNED`   | Học kỳ chưa có rubric chấm hướng dẫn                                   |

### `topic.status` / `topicStatus`

`OFFICIAL` Đã giao chính thức · `IN_PROGRESS` Đang thực hiện · `COMPLETED` Đã hoàn thành · `DISQUALIFIED` Bị đình chỉ · `CANCELLED` Đã hủy

### `currentStage`

`STAGE_1_REGISTERING_ADVISOR` Chưa đăng ký GVHD · `STAGE_1_ADVISOR_ASSIGNED` Đã phân công GVHD · `STAGE_2_TOPIC_CONFIRMED` Đã chốt tên đề tài · `STAGE_3_OUTLINE_APPROVED` Đã duyệt đề cương · `STAGE_4_REPORT_APPROVED` Đã duyệt báo cáo · `STAGE_5_REVIEW_PASSED` Đạt phản biện · `STAGE_6_DEFENSE_COMPLETED` Đã bảo vệ hội đồng

## 9. Cách tính điểm (để FE hiển thị tạm khi đang nhập)

BE chỉ trả `totalScore` / `advisorScore` sau khi **nộp**. Khi đang nhập, FE tự tính để xem trước, giống công thức BE:

```
đóng góp tiêu chí = score * weight / 100          (tối đa = maxScore)
tổng nhóm         = Σ đóng góp các tiêu chí trong nhóm
totalScore        = Σ đóng góp mọi tiêu chí đã có điểm   (bỏ qua score null)
advisorScore      = làm tròn totalScore 1 chữ số, HALF_UP (7.25 → 7.3; 7.24999 → 7.2)
```

`computeRubricSummary` trong `guidingEvaluation.utils.ts` đã đúng công thức, chỉ cần đổi từ `RUBRIC_GROUPS` cứng sang `groups` của phiếu. Lưu ý `Math.round(x * 10) / 10` có thể sai ở số thực như `7.25`; nên làm tròn trên giá trị đã nhân 100000 rồi chia, hoặc chỉ coi là số xem trước, **điểm chính thức lấy `advisorScore` BE trả sau C5**.

Kiểm tra ô nhập phía FE (BE vẫn kiểm tra lại):

- `0 ≤ score ≤ 10`, tối đa 1 chữ số thập phân (`/^\d+(\.\d)?$/`). Bỏ `clampRubricValue` tự ép về 0/10, nên báo lỗi để người dùng sửa.
- Ô để trống → gửi `null`, **không** gửi `0` (0 là điểm hợp lệ).

## 10. Type TypeScript gợi ý

```ts
export type SheetStatus = 'NOT_STARTED' | 'DRAFT' | 'SUBMITTED'

export type GradingReadonlyReason =
  | 'SUBMITTED'
  | 'TOPIC_DISQUALIFIED'
  | 'TOPIC_CANCELLED'
  | 'TOPIC_NOT_READY'
  | 'DEADLINE_NOT_CONFIGURED'
  | 'DEADLINE_NOT_OPEN'
  | 'DEADLINE_EXPIRED'
  | 'TEMPLATE_NOT_ASSIGNED'

export interface GradingDeadline {
  startDate: string // ISO, vd "2026-11-10T00:00:00"
  endDate: string
  open: boolean
}

export interface AdvisorGradeTopic {
  topicPublicId: string
  topicName: string
  studentCode: string | null
  studentName: string | null
  className: string | null
  topicStatus: string
  currentStage: string
  sheetPublicId: string | null
  sheetStatus: SheetStatus
  gradedCount: number
  totalCriteria: number | null
  advisorScore: number | null
  canGrade: boolean
  readonlyReason: GradingReadonlyReason | null
}

export interface AdvisorGradeTopicList {
  semesterId: string
  deadline: GradingDeadline | null
  summary: { notStarted: number; draft: number; submitted: number }
  items: AdvisorGradeTopic[]
}

export interface SheetCriteria {
  publicId: string
  name: string
  displayOrder: number
  weight: number
  maxScore: number
  score: number | null
}

export interface SheetGroup {
  publicId: string
  name: string
  displayOrder: number
  weight: number
  criteria: SheetCriteria[]
}

export interface EvaluationSheet {
  sheetPublicId: string
  status: 'DRAFT' | 'SUBMITTED'
  topic: { publicId: string; name: string; status: string; currentStage: string }
  student: { studentCode: string; fullName: string; className: string; majorName: string } | null
  evaluator: { teacherCode: string; fullName: string; academicTitle: string | null; organization: string | null }
  template: { publicId: string; name: string }
  groups: SheetGroup[]
  generalComment: string | null
  gradedCount: number
  totalCriteria: number
  totalScore: number | null
  advisorScore: number | null
  submittedAt: string | null
  updatedAt: string
  deadline: GradingDeadline | null
  canEdit: boolean
  readonlyReason: GradingReadonlyReason | null
}

export interface EvaluationSheetBody {
  generalComment?: string | null
  details: { criteriaId: string; score: number | null }[]
}
```

## 11. Service gợi ý

Theo style `features/department/score_management/services/rubric.service.ts`:

```ts
import { API_ENDPOINTS, apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'

const GRADE = API_ENDPOINTS.advisorGrade

export const advisorGradeService = {
  /** C1 – danh sách đề tài cần chấm (không phân trang) */
  async getTopics(semesterId?: string): Promise<AdvisorGradeTopicList> {
    const res = await apiClient.get<ApiResponse<AdvisorGradeTopicList>>(GRADE.topics, {
      params: semesterId ? { semesterId } : undefined,
    })
    return res.data.data
  },

  /** C2 – mở phiếu, chưa có thì BE tạo phiếu Nháp */
  async openSheet(topicPublicId: string): Promise<EvaluationSheet> {
    const res = await apiClient.post<ApiResponse<EvaluationSheet>>(GRADE.openSheet(topicPublicId))
    return res.data.data
  },

  /** C3 – chi tiết phiếu */
  async getSheet(sheetPublicId: string): Promise<EvaluationSheet> {
    const res = await apiClient.get<ApiResponse<EvaluationSheet>>(GRADE.sheet(sheetPublicId))
    return res.data.data
  },

  /** C4 – lưu nháp. Lỗi hiện trong popup phiếu */
  async saveDraft(sheetPublicId: string, body: EvaluationSheetBody): Promise<void> {
    await apiClient.put<ApiResponse<null>>(GRADE.sheet(sheetPublicId), body, { skipErrorToast: true })
  },

  /** C5 – nộp phiếu, trả phiếu đã khóa */
  async submit(sheetPublicId: string, body: EvaluationSheetBody): Promise<EvaluationSheet> {
    const res = await apiClient.post<ApiResponse<EvaluationSheet>>(GRADE.submit(sheetPublicId), body, {
      skipErrorToast: true,
    })
    return res.data.data
  },
}
```

Dựng body từ state form (luôn gửi đủ mọi tiêu chí):

```ts
function toSheetBody(sheet: EvaluationSheet, scores: Record<string, number | null>, comment: string): EvaluationSheetBody {
  return {
    generalComment: comment,
    details: sheet.groups.flatMap((g) =>
      g.criteria.map((c) => ({ criteriaId: c.publicId, score: scores[c.publicId] ?? null })),
    ),
  }
}
```

## 12. Gợi ý UX

- Bảng danh sách: nút **"Chấm"** khi `canGrade && sheetStatus !== 'SUBMITTED'`; **"Xem"** khi `SUBMITTED`; disable kèm tooltip `readonlyReason` khi `!canGrade && sheetStatus === 'NOT_STARTED'`. Cột tiến độ hiển thị `gradedCount / totalCriteria`, cột điểm hiển thị `advisorScore ?? '—'`.
- Đầu màn: hiện hạn chấm từ `deadline` (`null` → "Chưa thiết lập hạn chấm"; `open = false` → nhãn "Chưa mở" / "Đã hết hạn" tùy so với ngày hiện tại).
- Popup phiếu: disable mọi ô và ẩn 2 nút khi `canEdit = false`, hiện banner theo `readonlyReason`. Khi `SUBMITTED` hiện `advisorScore` và `submittedAt`.
- Nút **"Nộp phiếu"**: kiểm tra FE trước (đủ điểm mọi tiêu chí, có nhận xét), rồi mở dialog xác nhận "Sau khi nộp sẽ không thể sửa". Nộp xong cập nhật popup bằng `data` trả về, không cần gọi lại C3.
- Khi C4/C5 trả **3118 / 3117 / 3064–3066**: phiếu đã bị khóa hoặc hết hạn trong lúc đang nhập → báo lỗi rồi gọi lại C3 + C1 để chuyển sang chế độ chỉ xem.
- Sau C4 / C5 thành công: invalidate query C1 để cập nhật tab và số liệu.
- Cảnh báo khi đóng popup có thay đổi chưa lưu (BE không tự lưu).

## 13. Lỗi chung

| HTTP | code | Khi nào                                                                                         |
| ---- | ---- | ----------------------------------------------------------------------------------------------- |
| 401  | 2000 | Chưa đăng nhập / token hết hạn                                                                  |
| 403  | 2001 | Không phải role `SUPERVISOR`; không phải GVHD chính của đề tài; không phải người chấm phiếu; tài khoản không có hồ sơ giảng viên |
| 400  | 1006 | UUID trên URL / query sai định dạng, JSON hỏng, `score` không phải số                           |
| 404  | 1005 | Sai URL                                                                                         |
| 405  | 1007 | Sai HTTP method                                                                                 |
| 500  | 1001 | Lỗi hệ thống                                                                                    |

## 14. Ghi chú

- Tài liệu viết theo code BE hiện tại (nhánh `Inter_1`), đã có unit test cho service. **Chưa test end-to-end với FE**; nếu gặp field / lỗi khác tài liệu thì báo lại BE.
- Ngày giờ trong các API này là ISO (`2026-11-17T10:00:00`), parse bằng `dayjs(value)` / `new Date(value)` trực tiếp, **không** dùng hàm parse `dd-MM-yyyy HH:mm:ss` của các màn khác.
