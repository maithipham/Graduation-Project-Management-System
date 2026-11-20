# PROMPT FE – BƯỚC 12: PHÂN CÔNG GVPB, LỊCH PHẢN BIỆN & CHẤM PHẢN BIỆN (Inter 3)

> Copy toàn bộ phần dưới vào Claude Code / Antigravity, mở đúng thư mục `Frontend/Lecturer`.

---

Đọc và tuân thủ `AGENTS.md`, dùng skill **`connect-api`** (type → endpoint → service → hook), **`build-form`** (form lịch phản biện + form chấm điểm) và **`verify-changes`** trước khi báo xong.

## 0. Bối cảnh

Module `src/features/lecturer/defense_management` (portal giảng viên, route `/lecturer/defense`, `/lecturer/defense/councils`, `/lecturer/defense/reviews`) hiện chạy **dữ liệu giả** qua `@/features/lecturer/lecturer_portal_storage` (`defenseCouncils`, `defenseReviews`, `updateDefenseReviewScore`, `approveDefenseReview`, `rejectDefenseReview`). Backend Bước 12 đã có, hãy nối API thật cho 3 nghiệp vụ:

1. **Chủ tịch / Thư ký** của một Hội đồng phân công **2 Giảng viên phản biện (GVPB)** cho từng sinh viên.
2. **GVPB** tạo lịch phản biện cho sinh viên. **2 GVPB có lịch độc lập**: mỗi người chỉ tạo/sửa lịch cho suất phản biện của mình, không ảnh hưởng lịch của GVPB còn lại.
3. **GVPB** quyết định Đồng ý / Không đồng ý cho sinh viên ra Hội đồng và chấm phiếu phản biện theo Rubric (lưu nháp / lưu chính thức), tải file nhận xét (tùy chọn).

Quyền Chủ tịch / Thư ký / GVPB **gắn theo từng Hội đồng** (không phải role trong JWT): FE dựa vào `myRole`, `canAssignExaminers`, `editable`, `gradingOpen`, `scheduleOpen` do BE trả về để ẩn/khóa nút; BE vẫn kiểm tra lại.

## 1. Hợp đồng API (đã có ở BE – không đổi tên)

Tất cả trả `ApiResponse<T>`; API ghi (PUT/PATCH/POST) trả `data` rỗng + `message` tiếng Việt → sau khi thành công phải `invalidateQueries` để tải lại.

| # | Method & URL | Body / Params | `data` |
|---|---|---|---|
| 1 | `GET /defense-council/my` | `?semesterId=` (tùy chọn, nhận publicId học kỳ) | `MyCouncil[]` |
| 2 | `GET /defense-council/{councilPublicId}/examiner` | – | `CouncilExaminerBoard` |
| 3 | `PUT /defense-assignment/{defenseAssignmentPublicId}/examiner` | `AssignExaminersRequest` | – |
| 4 | `GET /examiner-assignment/my` | `?semesterId=` (tùy chọn) | `MyExaminerAssignment[]` |
| 5 | `PUT /examiner-assignment/{examinerAssignmentPublicId}/schedule` | `ScheduleExaminerReviewRequest` | – |
| 6 | `GET /examiner-assignment/{examinerAssignmentPublicId}/evaluation` | – | `ExaminerEvaluation` |
| 7 | `PUT /examiner-assignment/{examinerAssignmentPublicId}/evaluation` | `ExaminerEvaluationRequest` | – |
| 8 | `PATCH /examiner-assignment/{examinerAssignmentPublicId}/decision` | `{ decision: 'APPROVED' \| 'REJECTED' }` | – |
| 9 | `POST /examiner-assignment/{examinerAssignmentPublicId}/review-file` | multipart, part tên **`file`** (PDF/DOC/DOCX) | – |

Thêm vào `src/shared/api/endpoints.ts` một nhóm mới, ví dụ:

```ts
// Bước 12: Phân công GVPB, lịch & chấm phản biện (Giảng viên)
examinerReview: {
  myCouncils: '/defense-council/my',
  councilBoard: (councilPublicId: string) => `/defense-council/${councilPublicId}/examiner`,
  assignExaminers: (defenseAssignmentPublicId: string) => `/defense-assignment/${defenseAssignmentPublicId}/examiner`,
  myAssignments: '/examiner-assignment/my',
  schedule: (id: string) => `/examiner-assignment/${id}/schedule`,
  evaluation: (id: string) => `/examiner-assignment/${id}/evaluation`,
  decision: (id: string) => `/examiner-assignment/${id}/decision`,
  reviewFile: (id: string) => `/examiner-assignment/${id}/review-file`,
},
```

### 1.1. Type (đặt trong `types.ts` của feature – khớp DTO Java)

```ts
export type CouncilMemberRole = 'CHAIRPERSON' | 'SECRETARY' | 'COUNCIL_MEMBER'
export type CouncilStatus = 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED'
export type DefenseStatus = 'ASSIGNED_TO_COUNCIL' | 'FAILED_REVIEW' | 'READY_FOR_DEFENSE' | 'SCHEDULED' | 'COMPLETED'
export type ExaminerDecision = 'PENDING' | 'APPROVED' | 'REJECTED'
export type EvaluationSheetStatus = 'DRAFT' | 'SUBMITTED'
export type ThesisStage =
  | 'STAGE_1_REGISTERING_ADVISOR' | 'STAGE_1_ADVISOR_ASSIGNED' | 'STAGE_2_TOPIC_CONFIRMED'
  | 'STAGE_3_OUTLINE_APPROVED' | 'STAGE_4_REPORT_APPROVED' | 'STAGE_5_REVIEW_PASSED' | 'STAGE_6_DEFENSE_COMPLETED'

// GET /defense-council/my
export interface MyCouncil {
  councilPublicId: string
  code: string
  name: string
  semesterPublicId: string
  semesterName: string
  majorCode: string
  majorName: string
  location: string | null
  defenseStartTime: string | null   // LocalDateTime ISO
  defenseEndTime: string | null
  status: CouncilStatus
  myRole: CouncilMemberRole
  studentCount: number
}

// DefenseCouncilResponse.MemberDetailDto (record Java)
export interface CouncilMember {
  memberPublicId: string            // gửi vào councilMemberPublicId1/2
  teacherId: number
  teacherCode: string | null
  fullName: string
  academicTitle: string
  departmentName: string | null
  role: CouncilMemberRole
}

export interface ExaminerSlot {
  examinerAssignmentPublicId: string
  examinerOrder: number             // 1 hoặc 2
  councilMemberPublicId: string
  teacherCode: string | null
  fullName: string
  academicTitle: string | null
  councilRole: CouncilMemberRole
  decision: ExaminerDecision
  decidedAt: string | null
  sheetStatus: EvaluationSheetStatus | null   // null = chưa chấm
  sheetScore: number | null                   // điểm phiếu đã nộp, làm tròn 1 chữ số
  reviewDate: string | null                   // "2026-12-01"
  reviewStartTime: string | null              // "08:00"
  reviewEndTime: string | null
  reviewLocation: string | null
  reviewNote: string | null
  scheduledAt: string | null
  reviewFileUrl: string | null
  reviewFileName: string | null
}

export interface CouncilStudentExaminer {
  defenseAssignmentPublicId: string
  thesisTopicPublicId: string
  studentCode: string
  studentName: string
  className: string | null
  topicName: string | null
  supervisorName: string | null
  coSupervisorName: string | null
  ineligibleMemberPublicIds: string[]   // thành viên là GVHD/đồng GVHD → không được chọn làm GVPB
  defenseStatus: DefenseStatus
  currentStage: ThesisStage
  examinerScore: number | null          // TB 2 phiếu, null = chưa đủ 2 phiếu
  examinerPassed: boolean | null        // null = chưa có kết quả
  canAssignExaminers: boolean
  examiners: ExaminerSlot[]             // 0..2 phần tử, sắp theo examinerOrder
}

// GET /defense-council/{id}/examiner
export interface CouncilExaminerBoard {
  councilPublicId: string
  code: string
  name: string
  majorName: string
  location: string | null
  defenseStartTime: string | null
  defenseEndTime: string | null
  status: CouncilStatus
  myRole: CouncilMemberRole
  canAssignExaminers: boolean
  members: CouncilMember[]
  students: CouncilStudentExaminer[]
}

export interface AssignExaminersRequest {
  councilMemberPublicId1: string
  councilMemberPublicId2: string
}

// GET /examiner-assignment/my
export interface MyExaminerAssignment {
  examinerAssignmentPublicId: string
  examinerOrder: number
  councilPublicId: string
  councilCode: string
  councilName: string
  semesterPublicId: string
  defenseAssignmentPublicId: string
  thesisTopicPublicId: string
  studentCode: string
  studentName: string
  className: string | null
  topicName: string | null
  defenseStatus: DefenseStatus
  decision: ExaminerDecision            // của chính GVPB đang đăng nhập
  decidedAt: string | null
  sheetStatus: EvaluationSheetStatus | null
  sheetScore: number | null
  examinerScore: number | null          // kết quả chung của sinh viên
  examinerPassed: boolean | null
  // Lịch phản biện của CHÍNH GVPB đang đăng nhập (lịch GVPB còn lại nằm trong coExaminer)
  reviewDate: string | null
  reviewStartTime: string | null
  reviewEndTime: string | null
  reviewLocation: string | null
  reviewNote: string | null
  scheduledAt: string | null
  reviewFileUrl: string | null
  reviewFileName: string | null
  coExaminer: ExaminerSlot | null       // GVPB còn lại
  scheduleStartAt: string | null        // khung tạo lịch = mốc GVPB_NOP_BAN_MEM_NHAN_XET
  scheduleEndAt: string | null
  scheduleOpen: boolean
  gradingStartAt: string | null         // khung chấm/quyết định
  gradingCloseAt: string | null         // 00:00 của (ngày bảo vệ − 2 ngày), không bao gồm
  gradingOpen: boolean
  editable: boolean                     // false khi SV đã xếp ca / hoàn tất / bị đình chỉ
}

export interface ScheduleExaminerReviewRequest {
  reviewDate: string        // "yyyy-MM-dd"
  reviewStartTime: string   // "HH:mm"
  reviewEndTime: string     // "HH:mm"
  reviewLocation: string    // bắt buộc, ≤ 255 ký tự
  reviewNote?: string | null
}

// Rubric + phiếu (score_config EvaluationSheetDetailResponse)
export interface RubricCriteria {
  criteriaPublicId: string
  name: string
  displayOrder: number
  weight: number            // %
  score: number | null      // điểm đã chấm (0–10)
}
export interface RubricGroup {
  groupPublicId: string
  name: string
  displayOrder: number
  criteria: RubricCriteria[]
}
export interface EvaluationSheetDetail {
  templatePublicId: string
  templateName: string
  type: 'ADVISOR' | 'EXAMINER' | 'COUNCIL'
  sheetPublicId: string | null          // null = chưa lưu lần nào
  status: EvaluationSheetStatus | null
  generalComment: string | null
  totalScore: number | null             // chưa làm tròn, null khi nháp
  roundedTotalScore: number | null
  submittedAt: string | null
  updatedAt: string | null
  groups: RubricGroup[]
}

// GET /examiner-assignment/{id}/evaluation
export interface ExaminerEvaluation {
  examinerAssignmentPublicId: string
  examinerOrder: number
  councilCode: string
  studentCode: string
  studentName: string
  topicName: string | null
  defenseStatus: DefenseStatus
  decision: ExaminerDecision
  decidedAt: string | null
  question1: string | null
  question2: string | null
  reviewFileUrl: string | null
  reviewFileName: string | null
  examinerScore: number | null
  examinerPassed: boolean | null
  gradingStartAt: string | null
  gradingCloseAt: string | null
  gradingOpen: boolean
  editable: boolean
  sheet: EvaluationSheetDetail
}

export interface ExaminerEvaluationRequest {
  criteriaScores: { criteriaPublicId: string; score: number | null }[]
  generalComment: string | null
  question1: string | null
  question2: string | null
  decision: 'APPROVED' | 'REJECTED' | null   // null = giữ nguyên quyết định cũ; KHÔNG gửi 'PENDING'
  submit: boolean                            // false = Lưu nháp, true = Lưu chính thức
}
```

### 1.2. Mã lỗi BE cần biết (interceptor đã toast; form tự hiển thị thì dùng `skipErrorToast`)

| Code | Ý nghĩa |
|---|---|
| 3119 / 3120 | Không phải Chủ tịch/Thư ký / không phải thành viên Hội đồng |
| 3121 | Hội đồng chưa công bố |
| 3122 | Sinh viên không còn ở trạng thái chờ phân công |
| 3123 / 3124 / 3125 | GVPB không thuộc HĐ / 2 GVPB trùng nhau / GVPB là GVHD |
| 3126 | Không thể thay GVPB đã nộp phiếu hoặc đã quyết định |
| 3128 | Không phải GVPB của sinh viên này |
| 3129 / 3130 | Giờ bắt đầu ≥ giờ kết thúc / ngày phản biện ngoài mốc |
| 3131 | Ngoài khung chấm phản biện (message có kèm khoảng thời gian) |
| 3132 | Sinh viên đã xếp ca / hoàn tất → khóa phản biện |
| 3133 | Học kỳ chưa cấu hình Rubric phản biện |
| 3134 / 3135 / 3136 | Tiêu chí sai / điểm sai (0–10, 1 chữ số) / chưa chấm đủ khi nộp |
| 3064 / 3065–3066 | Chưa thiết lập mốc / mốc chưa mở / đã hết hạn |
| 4000 | Lỗi validate field (message tiếng Việt) |

## 2. Tổ chức code

Làm lại `src/features/lecturer/defense_management` theo khung chuẩn (`components/ hooks/ pages/ services/ utils/ types.ts index.ts`):

- `types.ts`: thay `types/defenseManagement.types.ts` bằng type ở mục 1.1 (giữ type cũ nào còn dùng cho phần chưa nối API, ví dụ lịch hội đồng chấm bảo vệ – Bước 13/14).
- `services/examinerReview.service.ts`: 9 hàm tương ứng 9 API, trả `res.data.data`. Upload dùng `FormData` + header `multipart/form-data` như `features/department/lecturer_management/services/teacher.service.ts`. Form (lịch, chấm điểm) thêm `{ skipErrorToast: true }`.
- `hooks/useExaminerReview.ts`: query key `examinerReviewKeys = { all: ['lecturer','examiner-review'], myCouncils(semesterId), board(councilPublicId), myAssignments(semesterId), evaluation(id) }`; query dùng `skipToken` khi chưa có id; mutation `onSuccess` → `toast.success(...)` + invalidate:
  - phân công GVPB → `board(councilPublicId)` + `myAssignments`
  - lịch / quyết định / chấm / upload → `myAssignments` + `evaluation(id)` + mọi `board`
- Học kỳ: lấy `useLecturerCurrentSemester()` từ `@/features/lecturer/supervisor_registration` (import qua `index.ts`); có `publicId` thì truyền `semesterId`, không có thì gọi không kèm tham số (BE trả mọi học kỳ).
- Bỏ phần `defenseCouncils`/`defenseReviews` lấy từ `lecturer_portal_storage` trong các page dưới. **Không xóa** slice trong `lecturer_portal_storage` nếu feature khác còn dùng; nếu không còn ai dùng thì báo người dùng trước khi xóa.
- `index.ts`: export type + hook, **không export page**.

## 3. Màn hình

Giữ phong cách hiện có của `DefenseCouncilPage` / `DefenseReviewPage` (thẻ trắng bo `rounded-2xl`, tông slate/blue, `#1565C0`), dùng component `@/shared/components/ui` (Table, Dialog, Select, Tabs, Badge, Button, Input, Textarea, Skeleton, FormField).

### 3.1. `/lecturer/defense` – `ThesisDefensePage` (hiện đang rỗng)
Trang tổng: 2 thẻ điều hướng "Hội đồng tôi tham gia" (`/lecturer/defense/councils`, kèm số hội đồng) và "Phản biện đồ án" (`/lecturer/defense/reviews`, kèm số SV chưa chấm `sheetStatus !== 'SUBMITTED'`).

### 3.2. `/lecturer/defense/councils` – `DefenseCouncilPage`
- Danh sách thẻ từ API #1: mã, tên, ngành, phòng, thời gian bảo vệ (`formatDate`), badge `myRole` (Chủ tịch / Thư ký / Ủy viên), badge `status`, số SV.
- Nút "Xem / Phân công phản biện" → route mới `/lecturer/defense/councils/:councilPublicId` (đăng ký trong `app/routes/lecturer.routes.tsx` bằng `lazy()` + `withSuspense`).

### 3.3. `/lecturer/defense/councils/:councilPublicId` – `CouncilExaminerPage` (mới)
- Header: thông tin Hội đồng + danh sách 5 thành viên (`members`).
- Bảng sinh viên (API #2): STT, MSSV, họ tên, lớp, đề tài, GVHD (+ đồng GVHD), GVPB 1, GVPB 2, Điểm PB, Trạng thái.
  - Mỗi ô GVPB: tên + badge quyết định (`PENDING` xám "Chưa quyết định", `APPROVED` xanh lá "Đồng ý", `REJECTED` đỏ "Không đồng ý") + trạng thái phiếu (`null` "Chưa chấm", `DRAFT` "Nháp", `SUBMITTED` + `sheetScore`) + lịch phản biện riêng của GVPB đó (`reviewDate` `reviewStartTime`–`reviewEndTime`, `reviewLocation`, hoặc "Chưa có lịch"). 2 GVPB có thể có 2 lịch khác nhau.
  - Điểm PB: `examinerScore?.toFixed(1)` hoặc "—"; badge Đạt / Không đạt theo `examinerPassed`.
  - Trạng thái theo `defenseStatus`: Chờ phản biện / Không đạt PB / Đạt – chờ xếp ca / Đã xếp ca / Đã bảo vệ.
- Nút "Phân công" / "Đổi GVPB" chỉ hiện khi `board.canAssignExaminers && student.canAssignExaminers` → mở Dialog:
  - 2 `Select` GVPB 1, GVPB 2 lấy từ `members`; disable (kèm chú thích "GVHD của sinh viên") các `memberPublicId` trong `ineligibleMemberPublicIds`; GVPB 2 không được trùng GVPB 1 (validate zod).
  - Giá trị mặc định = GVPB hiện tại (`examiners[].councilMemberPublicId`).
  - Lưu → API #3, toast "Đã phân công giảng viên phản biện", đóng dialog. Lưu ý: BE giữ nguyên suất của GVPB không đổi (nếu chỉ đổi 1 người, người còn lại giữ thứ tự cũ).
- Người không phải Chủ tịch/Thư ký: bảng chỉ đọc.

### 3.4. `/lecturer/defense/reviews` – `DefenseReviewPage`
- Banner: tổng SV được phân công, số chưa chấm; khung chấm "Chấm/quyết định từ {gradingStartAt} đến trước {gradingCloseAt}" (lấy từ phần tử đầu, hoặc theo từng HĐ nếu khác nhau).
- Bộ lọc (giữ ô tìm kiếm + select hiện có): Tất cả / Chưa chấm (`sheetStatus !== 'SUBMITTED'`) / Đã chấm; tìm theo tên, MSSV, đề tài. State bộ lọc để trong `useState` hoặc store UI (Zustand), **không** copy dữ liệu server vào store.
- Bảng (API #4): MSSV, họ tên, đề tài, Hội đồng, "PB {examinerOrder}", **lịch phản biện của tôi** (`reviewDate` + giờ + phòng, hoặc "Chưa có lịch"), quyết định của tôi, phiếu của tôi, GVPB còn lại (`coExaminer`: tên + quyết định + phiếu + lịch riêng của họ – chỉ xem, có thể để trong tooltip/hàng mở rộng), kết quả chung (`examinerScore`, Đạt/Không đạt).
- Hành động mỗi dòng:
  - **"Lịch phản biện"** → Dialog form (build-form + zod): ngày (`<input type="date">` có `min/max` = phần ngày của `scheduleStartAt/scheduleEndAt`), giờ bắt đầu, giờ kết thúc (`type="time"`, kiểm tra bắt đầu < kết thúc), phòng (bắt buộc ≤ 255), ghi chú. Có thêm các nút chọn nhanh khung giờ 08:00–08:45, 09:00–09:45, 10:00–10:45, 11:00–11:45, 13:30–14:15, 14:30–15:15, 15:30–16:15, 16:30–17:15. Tiêu đề dialog: "Lịch phản biện {examinerOrder} – {studentName}"; ghi chú dưới tiêu đề: "Lịch chỉ áp dụng cho suất phản biện của bạn, không thay đổi lịch của GVPB còn lại". Giá trị mặc định lấy từ lịch hiện tại của chính mình (không lấy của `coExaminer`). Disable khi `!scheduleOpen || !editable`. Gửi API #5.
  - **"Chấm phản biện"** → route mới `/lecturer/defense/reviews/:examinerAssignmentPublicId` (`ExaminerGradingPage`).
- Xóa logic mock cũ (`handleScoreChange`, `handleApprove`, `handleReject`, `toast.error` trong hook).

### 3.5. `/lecturer/defense/reviews/:examinerAssignmentPublicId` – `ExaminerGradingPage` (mới)
- Dữ liệu từ API #6. Header: SV, MSSV, đề tài, Hội đồng, "Phản biện {examinerOrder}", trạng thái phiếu, kết quả chung.
- Banner khóa (form chỉ đọc) khi `!editable` ("Sinh viên đã được xếp ca bảo vệ – không thể sửa phản biện") hoặc `!gradingOpen` ("Chỉ được chấm từ … đến trước …").
- Bảng Rubric render động từ `sheet.groups` (nhóm → tiêu chí → trọng số % → ô điểm). Ô điểm: số 0–10, tối đa 1 chữ số thập phân (zod: `z.number().min(0).max(10).multipleOf(0.1)` hoặc regex `^(10(\.0)?|\d(\.\d)?)$`), cho phép để trống khi lưu nháp. Tổng tạm tính = Σ(score × weight / 100), hiển thị làm tròn 1 chữ số (chỉ để xem; điểm chính thức do BE tính).
- Nhận xét chung (`generalComment`), Câu hỏi 1, Câu hỏi 2 (`Textarea`).
- Quyết định "Đề xuất điều kiện bảo vệ": 2 lựa chọn loại trừ nhau "Đủ điều kiện bảo vệ" (`APPROVED`) / "Không đủ điều kiện bảo vệ" (`REJECTED`); chưa chọn = `null`.
- File nhận xét (tùy chọn): chọn file `.pdf,.doc,.docx` → API #9 ngay khi chọn (nút "Tải lên", trạng thái "Đang tải..."); đã có thì hiện link `reviewFileName` mở `reviewFileUrl` ở tab mới.
- 2 nút:
  - **"Lưu nháp"** → API #7 với `submit: false` (không bắt buộc đủ điểm).
  - **"Lưu"** → validate đủ điểm mọi tiêu chí rồi API #7 với `submit: true`.
  - Cả 2 đều gửi kèm `decision` đang chọn (hoặc `null`). Dùng `skipErrorToast` và hiện lỗi BE (`ApiError.message`) ngay trên form.
  - Thành công: toast "Đã lưu nháp phiếu phản biện" / "Đã nộp phiếu phản biện", invalidate, ở lại trang (form nạp lại dữ liệu mới).
- Có thể đổi quyết định riêng (không chấm) qua API #8 nếu muốn tách nút; không bắt buộc.

## 4. Quy tắc nghiệp vụ để hiển thị đúng (BE vẫn kiểm tra lại)

- **Đạt phản biện**: cả 2 GVPB `APPROVED` + đủ 2 phiếu `SUBMITTED` + điểm TB (làm tròn 1 chữ số) ≥ 5.0 → `READY_FOR_DEFENSE`.
- **Không đạt**: có GVPB `REJECTED` hoặc đủ 2 phiếu mà TB < 5.0 → `FAILED_REVIEW`; vẫn sửa lại được trong khung chấm (BE tự xét lại).
- Phiếu đã "Lưu" (`SUBMITTED`) vẫn sửa / lưu lại được trong khung chấm. Bấm "Lưu nháp" trên phiếu đã nộp sẽ đưa phiếu về `DRAFT` → hỏi xác nhận trước ("Phiếu sẽ chuyển về nháp và không còn được tính điểm. Tiếp tục?").
- Khung chấm: từ `gradingStartAt` đến **trước** `gradingCloseAt`.
- Đổi GVPB bị chặn nếu GVPB cũ đã nộp phiếu hoặc đã quyết định.

## 5. Kiểm tra

- Chạy `npx tsc -b`, `npm run lint`, `npm test`, `npm run build` (skill `verify-changes`).
- Nếu BE chạy ở `localhost:8080`: đăng nhập tài khoản giảng viên là Chủ tịch/Thư ký của một Hội đồng đã công bố → phân công 2 GVPB; đăng nhập GVPB → tạo lịch, lưu nháp, lưu chính thức, kiểm tra trạng thái chuyển sang Đạt/Không đạt.
- Báo lại: file đã sửa/tạo, route mới, những chỗ còn dùng mock (Bước 13/14).
