import { test, expect, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';
import { defineItc, defineItcSec } from '../../../support/integration-test-case';
import { apiCall, getApiBaseUrl, loginByEmail } from '../../../support/api';
import { dbSelect } from '../../../support/db';

// ============================================================================
// ĐẶC TẢ TEST CASE (ITC068..ITC085 & TC-SEC-031..TC-SEC-036)
// Feature: outline | Module/Sheet: DuyetDeCuong
// Role: Giảng viên nhận xét (COMMENTING_LECTURER)
// ============================================================================

const ITC068 = defineItc({
  id: 'ITC068',
  feature: 'outline',
  module: 'DuyetDeCuong',
  sheet: 'DuyetDeCuong',
  fn: 'View and Filter Assigned Outlines for Review',
  description:
    'Verify that a commenting lecturer can view assigned students\' outlines across all statuses with accurate tab counters and enabled review actions when the deadline is open',
  procedure:
    '1. Log in as a Commenting Lecturer ("Hoàng Thị Thu").\n' +
    '2. Open the "Duyệt đề cương" screen ("/lecturer/outline-review") and click the "Sinh viên được phân công nhận xét" role tab.',
  expected:
    '1. The API GET /api/v1/deadlines returns HTTP 200 with code = 1000 and an OPEN "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline.\n' +
    '2. The API GET /outline/review-list returns HTTP 200 with code = 1000 and 4 outlines (1 PENDING, 1 REQUEST_CHANGES, 1 APPROVED, 1 REJECTED), all with canReview = true.\n' +
    '3. The database contains 4 thesis outline records assigned to the commenting lecturer in the current semester (1 PENDING, 1 REQUEST_CHANGES, 1 APPROVED, 1 REJECTED).\n' +
    '4. The "Sinh viên được phân công nhận xét" tab badge shows 4, the open deadline banner displays "(Đang mở)", the "Chờ duyệt" tab is active displaying student "Trần Minh Quang" ("9990000701") with supervisor badge "GVHD: Nguyễn Văn Hùng" and enabled "Duyệt" and "Yêu cầu sửa" buttons, and tab counters show "Chờ duyệt" = 1, "Đã duyệt" = 1, "Yêu cầu sửa" = 1, "Không đạt" = 1, and "Tất cả" = 4.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Commenting lecturer "Hoàng Thị Thu" is assigned 4 students supervised by "Nguyễn Văn Hùng": "9990000701" (PENDING), "9990000702" (REQUEST_CHANGES with reviewer and supervisor feedback), "9990000703" (APPROVED), and "9990000704" (REJECTED).',
});

const ITC069 = defineItc({
  id: 'ITC069',
  feature: 'outline',
  module: 'DuyetDeCuong',
  sheet: 'DuyetDeCuong',
  fn: 'View and Filter Assigned Outlines for Review',
  description:
    'Verify that a commenting lecturer can switch status tabs, search assigned outlines by student code, and see the empty state for a non-matching keyword',
  procedure:
    '1. Log in as a Commenting Lecturer, open "/lecturer/outline-review", and switch to the "Sinh viên được phân công nhận xét" tab.\n' +
    '2. Click the "Yêu cầu sửa" tab, then click the "Đã duyệt" tab, then click the "Không đạt" tab, and then click the "Tất cả" tab.\n' +
    '3. Enter "9990000702" into the "Tìm theo mã sinh viên, tên hoặc đề tài..." search box.\n' +
    '4. Replace the search keyword with "KHONGTONTAI9999".',
  expected:
    '1. The API GET /outline/review-list returns HTTP 200 with code = 1000 and 4 assigned outlines for the current semester.\n' +
    '2. The "Yêu cầu sửa" tab displays student "Lê Thị Mai" ("9990000702") with reviewer feedback, supervisor feedback, and no "Duyệt" or "Yêu cầu sửa" buttons; the "Đã duyệt" tab displays "Phạm Quốc Bảo" ("9990000703"); the "Không đạt" tab displays "Vũ Ngọc Ánh" ("9990000704").\n' +
    '3. Searching "9990000702" under "Tất cả" displays only student "Lê Thị Mai" ("9990000702").\n' +
    '4. Searching "KHONGTONTAI9999" displays empty state message "Không tìm thấy đề cương nào trong mục này.".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. The commenting lecturer has 4 assigned outlines across PENDING ("9990000701"), REQUEST_CHANGES ("9990000702"), APPROVED ("9990000703"), and REJECTED ("9990000704").',
});

const ITC070 = defineItc({
  id: 'ITC070',
  feature: 'outline',
  module: 'DuyetDeCuong',
  sheet: 'DuyetDeCuong',
  fn: 'View and Filter Assigned Outlines for Review',
  description:
    'Verify that outline review actions are locked and a closed-deadline status is displayed when the outline review deadline has closed',
  procedure:
    '1. Log in as a Commenting Lecturer ("Hoàng Thị Thu").\n' +
    '2. Open "/lecturer/outline-review" and click the "Sinh viên được phân công nhận xét" tab after the outline review deadline has closed.',
  expected:
    '1. The API GET /api/v1/deadlines returns HTTP 200 with code = 1000 and the "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline in COMPLETED status.\n' +
    '2. The API GET /outline/review-list returns HTTP 200 with code = 1000 and includes student "Trần Minh Quang"\'s PENDING outline.\n' +
    '3. The deadline banner displays "Đã hết hạn", and student "Trần Minh Quang"\'s row displays "Đã hết hạn thẩm định" with no "Duyệt" or "Yêu cầu sửa" buttons.',
  precondition:
    '1. An ongoing semester exists where the "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline is COMPLETED (past end date).\n' +
    '2. Commenting lecturer "Hoàng Thị Thu" is assigned a PENDING submitted outline from student "Trần Minh Quang" ("9990000701").',
});

const ITC071 = defineItc({
  id: 'ITC071',
  feature: 'outline',
  module: 'DuyetDeCuong',
  sheet: 'DuyetDeCuong',
  fn: 'View and Filter Assigned Outlines for Review',
  description:
    'Verify that outline review actions are locked and a not-started deadline badge is displayed before the outline review period opens',
  procedure:
    '1. Log in as a Commenting Lecturer ("Hoàng Thị Thu").\n' +
    '2. Open "/lecturer/outline-review" and click the "Sinh viên được phân công nhận xét" tab while the outline review deadline has not started yet.',
  expected:
    '1. The API GET /api/v1/deadlines returns HTTP 200 with code = 1000 and the "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline in NOT_STARTED status.\n' +
    '2. The API GET /outline/review-list returns HTTP 200 with code = 1000 and includes student "Trần Minh Quang"\'s PENDING outline.\n' +
    '3. The deadline banner displays "Chưa mở", and student "Trần Minh Quang"\'s row displays "Không thể thao tác" with no "Duyệt" or "Yêu cầu sửa" buttons.',
  precondition:
    '1. An ongoing semester exists where the "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline has a future start date (NOT_STARTED).\n' +
    '2. Commenting lecturer "Hoàng Thị Thu" is assigned a PENDING submitted outline from student "Trần Minh Quang" ("9990000701").',
});

const ITC072 = defineItc({
  id: 'ITC072',
  feature: 'outline',
  module: 'DuyetDeCuong',
  sheet: 'DuyetDeCuong',
  fn: 'View Outline Detail, Preview Gate, and Submission History',
  description:
    'Verify that a commenting lecturer can open the submission history modal and view multiple outline submission versions with reviewer and supervisor feedback',
  procedure:
    '1. Log in as a Commenting Lecturer, open "/lecturer/outline-review", and switch to the "Sinh viên được phân công nhận xét" tab.\n' +
    '2. Click the "Lịch sử" button on the row of student "Lê Thị Mai" ("9990000702").',
  expected:
    '1. The API GET /outline/{publicId} returns HTTP 200 with code = 1000, canReview = true, and 2 history records ordered newest first (version 2 in PENDING status followed by version 1 in REQUEST_CHANGES status with both reviewer and supervisor feedback).\n' +
    '2. The database contains 2 thesis outline history records for student "9990000702" in the current semester.\n' +
    '3. The modal "Lịch sử các lần nộp đề cương — Lê Thị Mai (9990000702)" displays "Lần 2" with badge "Đã nộp, chờ nhận xét" and "Lần 1" with badge "Yêu cầu chỉnh sửa", reviewer feedback "Cần bổ sung sơ đồ kiến trúc hệ thống" ("Bởi: Hoàng Thị Thu"), and supervisor feedback "Bổ sung mô hình dữ liệu ở bản 1" ("Bởi: Nguyễn Văn Hùng").',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Lê Thị Mai" ("9990000702") submitted version 1 (commented by GVHD and requested changes by GVNX) and resubmitted version 2 (PENDING).',
});

const ITC073 = defineItc({
  id: 'ITC073',
  feature: 'outline',
  module: 'DuyetDeCuong',
  sheet: 'DuyetDeCuong',
  fn: 'View Outline Detail, Preview Gate, and Submission History',
  description:
    'Verify that clicking approve on an unread pending outline opens the preview modal to unlock review actions',
  procedure:
    '1. Log in as a Commenting Lecturer, open "/lecturer/outline-review", and switch to the "Sinh viên được phân công nhận xét" tab.\n' +
    '2. Without previewing the file first, click "Duyệt" on student "Trần Minh Quang" ("9990000701")\'s row.\n' +
    '3. Close the preview modal and click "Duyệt" again.',
  expected:
    '1. The API GET /outline/review-list returns HTTP 200 with code = 1000 including student "Trần Minh Quang"\'s outline file URL.\n' +
    '2. The database confirms student "9990000701"\'s outline has a non-empty file URL and PENDING status.\n' +
    '3. The first click on "Duyệt" does not open the approve modal; instead it opens the preview modal displaying "Trần Minh Quang (9990000701)", supervisor "Nguyễn Văn Hùng", commenting lecturer "Hoàng Thị Thu", a PDF preview iframe, and toast "Đã đọc đề cương của sinh viên Trần Minh Quang!".\n' +
    '4. After closing the preview modal, clicking "Duyệt" opens the "Xác nhận phê duyệt đề cương" modal.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Trần Minh Quang" ("9990000701") has a PENDING PDF outline assigned to commenting lecturer "Hoàng Thị Thu", not yet previewed in the current session.',
});

const ITC074 = defineItc({
  id: 'ITC074',
  feature: 'outline',
  module: 'DuyetDeCuong',
  sheet: 'DuyetDeCuong',
  fn: 'Review, Approve, Request Changes, and Reject Student Outlines',
  description:
    'Verify that a commenting lecturer can approve a pending student outline during the open submission period',
  procedure:
    '1. Log in as a Commenting Lecturer, open "/lecturer/outline-review", and switch to the "Sinh viên được phân công nhận xét" tab.\n' +
    '2. Preview and close student "Trần Minh Quang" ("9990000701")\'s outline to unlock review actions, then click "Duyệt".\n' +
    '3. Enter "  Đề cương đạt yêu cầu, bố cục rõ ràng và mục tiêu khả thi.  " into the feedback field and click "Xác nhận duyệt".',
  expected:
    '1. The API PUT /outline/{publicId}/review with decision = APPROVED and trimmed feedback returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Thẩm định đề cương thành công".\n' +
    '3. The database updates thesis_outline.status = APPROVED, review_feedback = "Đề cương đạt yêu cầu, bố cục rõ ràng và mục tiêu khả thi.", reviewed_at IS NOT NULL, updates the latest thesis_outline_history to APPROVED with reviewer_id set, advances thesis_topic.current_stage to STAGE_3_OUTLINE_APPROVED (status = IN_PROGRESS), and creates a student notification containing "Đề cương của bạn đã được giảng viên nhận xét phê duyệt ĐẠT.".\n' +
    '4. The UI shows toast "Đã phê duyệt đề cương của sinh viên Trần Minh Quang thành công!", removes the row from "Chờ duyệt", and displays the student under "Đã duyệt" with badge "Đã duyệt" and the trimmed reviewer feedback.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Trần Minh Quang" ("9990000701") has a confirmed official topic title (STAGE_2_TOPIC_CONFIRMED, no pending title change) and a PENDING submitted outline assigned to "Hoàng Thị Thu".',
});

const ITC075 = defineItc({
  id: 'ITC075',
  feature: 'outline',
  module: 'DuyetDeCuong',
  sheet: 'DuyetDeCuong',
  fn: 'Review, Approve, Request Changes, and Reject Student Outlines',
  description:
    'Verify that a commenting lecturer can request changes on a pending student outline during the open submission period',
  procedure:
    '1. Log in as a Commenting Lecturer, open "/lecturer/outline-review", and switch to the "Sinh viên được phân công nhận xét" tab.\n' +
    '2. Preview and close student "Trần Minh Quang" ("9990000701")\'s outline, then click "Yêu cầu sửa".\n' +
    '3. Verify "Yêu cầu chỉnh sửa (REQUEST_CHANGES)" is selected and "Không đạt (REJECTED)" is disabled, enter "  Cần bổ sung biểu đồ trình tự và phạm vi kiểm thử.  ", and click "Gửi yêu cầu sửa".',
  expected:
    '1. The API PUT /outline/{publicId}/review with decision = REQUEST_CHANGES and trimmed feedback returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Thẩm định đề cương thành công".\n' +
    '3. The database updates thesis_outline.status = REQUEST_CHANGES, review_feedback = "Cần bổ sung biểu đồ trình tự và phạm vi kiểm thử.", updates the latest thesis_outline_history to REQUEST_CHANGES, keeps thesis_topic.current_stage = STAGE_2_TOPIC_CONFIRMED and status = IN_PROGRESS, and creates a student notification containing "Đề cương của bạn cần chỉnh sửa theo góp ý của giảng viên nhận xét.".\n' +
    '4. The UI shows toast "Đã gửi yêu cầu chỉnh sửa đề cương cho sinh viên Trần Minh Quang!", removes the row from "Chờ duyệt", and displays the student under "Yêu cầu sửa" with the trimmed reviewer feedback and no review action buttons.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Trần Minh Quang" ("9990000701") has a PENDING submitted outline assigned to "Hoàng Thị Thu".',
});

const ITC076 = defineItc({
  id: 'ITC076',
  feature: 'outline',
  module: 'DuyetDeCuong',
  sheet: 'DuyetDeCuong',
  fn: 'Review, Approve, Request Changes, and Reject Student Outlines',
  description:
    'Verify that a commenting lecturer can approve a pending student outline during the extended grading period',
  procedure:
    '1. Log in as a Commenting Lecturer, open "/lecturer/outline-review" while the outline deadline is EXTENDED, and switch to the "Sinh viên được phân công nhận xét" tab.\n' +
    '2. Preview and close student "Trần Minh Quang" ("9990000701")\'s outline, then click "Duyệt".\n' +
    '3. Enter "Đề cương đạt yêu cầu trong thời gian gia hạn chấm." and click "Xác nhận duyệt".',
  expected:
    '1. The API GET /api/v1/deadlines returns HTTP 200 with code = 1000 and status EXTENDED; the deadline banner displays "Đã hết hạn nộp — Đang gia hạn chấm đến".\n' +
    '2. The API PUT /outline/{publicId}/review with decision = APPROVED returns HTTP 200 with code = 1000 and message "Thẩm định đề cương thành công".\n' +
    '3. The database updates thesis_outline.status = APPROVED, latest history status = APPROVED, thesis_topic.current_stage = STAGE_3_OUTLINE_APPROVED, and creates a student approval notification.\n' +
    '4. The UI shows toast "Đã phê duyệt đề cương của sinh viên Trần Minh Quang thành công!" and moves the student to the "Đã duyệt" tab.',
  precondition:
    '1. An ongoing semester exists where the "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline is in EXTENDED status within its allowed date range.\n' +
    '2. Student "Trần Minh Quang" ("9990000701") has a confirmed topic title (STAGE_2_TOPIC_CONFIRMED) and a PENDING submitted outline assigned to "Hoàng Thị Thu".',
});

const ITC077 = defineItc({
  id: 'ITC077',
  feature: 'outline',
  module: 'DuyetDeCuong',
  sheet: 'DuyetDeCuong',
  fn: 'Review, Approve, Request Changes, and Reject Student Outlines',
  description:
    'Verify that a commenting lecturer can reject a pending student outline during the extended grading period and disqualify the thesis topic',
  procedure:
    '1. Log in as a Commenting Lecturer, open "/lecturer/outline-review" while the outline deadline is EXTENDED, and switch to the "Sinh viên được phân công nhận xét" tab.\n' +
    '2. Preview and close student "Trần Minh Quang" ("9990000701")\'s outline, then click "Yêu cầu sửa".\n' +
    '3. Verify the modal shows "Đánh giá Không đạt đề cương" with "Không đạt (REJECTED)" selected and "Yêu cầu chỉnh sửa (REQUEST_CHANGES)" disabled, enter "Đề cương thiếu phương pháp nghiên cứu và chưa đáp ứng chuẩn đồ án.", and click "Xác nhận Không đạt".',
  expected:
    '1. The API PUT /outline/{publicId}/review with decision = REJECTED returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Thẩm định đề cương thành công".\n' +
    '3. The database updates thesis_outline.status = REJECTED, review_feedback = "Đề cương thiếu phương pháp nghiên cứu và chưa đáp ứng chuẩn đồ án.", updates the latest thesis_outline_history to REJECTED, updates thesis_topic.status = DISQUALIFIED with disqualification_reason = "Không hoàn thành phê duyệt đề cương đúng hạn", and creates a student notification containing "Đề cương của bạn không đạt trong đợt gia hạn chấm. Đồ án đã bị đình chỉ trong học kỳ này.".\n' +
    '4. The UI shows toast "Đã đánh giá Không đạt đề cương của sinh viên Trần Minh Quang!" and moves the student to the "Không đạt" tab with the reviewer feedback.',
  precondition:
    '1. An ongoing semester exists where the "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline is in EXTENDED status within its allowed date range.\n' +
    '2. Student "Trần Minh Quang" ("9990000701") has a PENDING submitted outline assigned to the commenting lecturer.',
});

const ITC078 = defineItc({
  id: 'ITC078',
  feature: 'outline',
  module: 'DuyetDeCuong',
  sheet: 'DuyetDeCuong',
  fn: 'Review, Approve, Request Changes, and Reject Student Outlines',
  description:
    'Verify that approving an outline is blocked when the student has a pending topic title change request not yet confirmed by the supervisor',
  procedure:
    '1. Log in as a Commenting Lecturer, open "/lecturer/outline-review", and switch to the "Sinh viên được phân công nhận xét" tab.\n' +
    '2. Preview and close student "Trần Minh Quang" ("9990000701")\'s outline, click "Duyệt", enter "Đề cương đạt yêu cầu nhưng tên đề tài đang chờ duyệt đổi.", and click "Xác nhận duyệt".',
  expected:
    '1. The API PUT /outline/{publicId}/review returns HTTP 409 with code = 3100.\n' +
    '2. The response message is "Tên đề tài chưa được GVHD xác nhận, chưa thể duyệt đạt đề cương".\n' +
    '3. The database keeps thesis_outline.status = PENDING, review_feedback = NULL, and thesis_topic.current_stage = STAGE_2_TOPIC_CONFIRMED.\n' +
    '4. The UI displays error toast "Tên đề tài chưa được GVHD xác nhận. Chưa thể duyệt đạt đề cương!".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Trần Minh Quang" ("9990000701") has a PENDING submitted outline and an unapproved PENDING topic title change request.',
});

const ITC079 = defineItc({
  id: 'ITC079',
  feature: 'outline',
  module: 'DuyetDeCuong',
  sheet: 'DuyetDeCuong',
  fn: 'Review, Approve, Request Changes, and Reject Student Outlines',
  description:
    'Verify that submitting blank or whitespace-only feedback on the approve modal is blocked by client-side validation and rejected by the backend API',
  procedure:
    '1. Log in as a Commenting Lecturer, open "/lecturer/outline-review", and switch to the "Sinh viên được phân công nhận xét" tab.\n' +
    '2. Preview and close student "Trần Minh Quang" ("9990000701")\'s outline, then click "Duyệt".\n' +
    '3. Replace the default feedback with spaces "     " and click "Xác nhận duyệt".\n' +
    '4. Verify the backend API rejects a whitespace-only feedback payload on PUT /outline/{publicId}/review.',
  expected:
    '1. The UI blocks submission on the client side, keeps the approve modal open, and displays inline validation message "Vui lòng nhập ý kiến nhận xét phê duyệt đề cương!".\n' +
    '2. Direct API PUT /outline/{publicId}/review with decision = APPROVED and whitespace-only feedback returns HTTP 400 with code = 4000 and message "Vui lòng nhập ý kiến nhận xét đề cương".\n' +
    '3. The database keeps thesis_outline.status = PENDING and review_feedback = NULL.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Trần Minh Quang" ("9990000701") has a PENDING submitted outline assigned to "Hoàng Thị Thu".',
});

const ITC080 = defineItc({
  id: 'ITC080',
  feature: 'outline',
  module: 'DuyetDeCuong',
  sheet: 'DuyetDeCuong',
  fn: 'Review, Approve, Request Changes, and Reject Student Outlines',
  description:
    'Verify that submitting blank or whitespace-only feedback on the request-changes modal is blocked on the client side and a null decision is rejected by the backend API',
  procedure:
    '1. Log in as a Commenting Lecturer, open "/lecturer/outline-review", and switch to the "Sinh viên được phân công nhận xét" tab.\n' +
    '2. Preview and close student "Trần Minh Quang" ("9990000701")\'s outline, then click "Yêu cầu sửa".\n' +
    '3. Enter spaces "   " into the feedback field and click "Gửi yêu cầu sửa".\n' +
    '4. Verify the backend API rejects a null decision payload on PUT /outline/{publicId}/review.',
  expected:
    '1. The UI blocks submission on the client side, keeps the modal open, and displays inline validation message "Vui lòng nêu rõ lý do và nội dung cần chỉnh sửa!".\n' +
    '2. Direct API PUT /outline/{publicId}/review with decision = null returns HTTP 400 with code = 4000 and message "Vui lòng chọn kết quả thẩm định đề cương".\n' +
    '3. The database keeps thesis_outline.status = PENDING and review_feedback = NULL.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Trần Minh Quang" ("9990000701") has a PENDING submitted outline assigned to "Hoàng Thị Thu".',
});

const ITC081 = defineItc({
  id: 'ITC081',
  feature: 'outline',
  module: 'DuyetDeCuong',
  sheet: 'DuyetDeCuong',
  fn: 'Review, Approve, Request Changes, and Reject Student Outlines',
  description:
    'Verify that submitting a REJECTED decision is blocked when the deadline transitions from extended grading back to the open submission period',
  procedure:
    '1. Log in as a Commenting Lecturer, open "/lecturer/outline-review" while the deadline is EXTENDED, switch to "Sinh viên được phân công nhận xét", unlock preview, and click "Yêu cầu sửa" so REJECTED is selected.\n' +
    '2. The "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline transitions back to IN_PROGRESS (OPEN) before submitting.\n' +
    '3. Enter "Thử gửi Không đạt trong thời gian nhận bài" and click "Xác nhận Không đạt".',
  expected:
    '1. The API PUT /outline/{publicId}/review returns HTTP 400 with code = 3087.\n' +
    '2. The response message is "Trong thời gian nhận bài chỉ được chọn Đạt (APPROVED) hoặc Yêu cầu chỉnh sửa (REQUEST_CHANGES)".\n' +
    '3. The database keeps thesis_outline.status = PENDING, review_feedback = NULL, and thesis_topic.status = IN_PROGRESS.\n' +
    '4. The UI displays error toast "Trong thời gian nhận bài chỉ được chọn Đạt hoặc Yêu cầu chỉnh sửa!".',
  precondition:
    '1. Commenting lecturer "Hoàng Thị Thu" opens the reject modal on student "9990000701"\'s PENDING outline while the deadline is EXTENDED, and the deadline transitions to IN_PROGRESS before confirming.',
});

const ITC082 = defineItc({
  id: 'ITC082',
  feature: 'outline',
  module: 'DuyetDeCuong',
  sheet: 'DuyetDeCuong',
  fn: 'Review, Approve, Request Changes, and Reject Student Outlines',
  description:
    'Verify that submitting a REQUEST_CHANGES decision is blocked when the deadline transitions from the open submission period to extended grading',
  procedure:
    '1. Log in as a Commenting Lecturer, open "/lecturer/outline-review" while the deadline is OPEN, switch to "Sinh viên được phân công nhận xét", unlock preview, and click "Yêu cầu sửa" so REQUEST_CHANGES is selected.\n' +
    '2. The "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline transitions to EXTENDED before submitting.\n' +
    '3. Enter "Thử gửi Yêu cầu sửa trong đợt gia hạn chấm" and click "Gửi yêu cầu sửa".',
  expected:
    '1. The API PUT /outline/{publicId}/review returns HTTP 400 with code = 3088.\n' +
    '2. The response message is "Trong thời gian gia hạn chấm chỉ được chọn Đạt (APPROVED) hoặc Không đạt (REJECTED)".\n' +
    '3. The database keeps thesis_outline.status = PENDING and review_feedback = NULL.\n' +
    '4. The UI displays error toast "Trong thời gian gia hạn chấm chỉ được chọn Đạt hoặc Không đạt!".',
  precondition:
    '1. Commenting lecturer "Hoàng Thị Thu" opens the request-changes modal on student "9990000701"\'s PENDING outline while the deadline is OPEN, and the deadline transitions to EXTENDED before confirming.',
});

const ITC083 = defineItc({
  id: 'ITC083',
  feature: 'outline',
  module: 'DuyetDeCuong',
  sheet: 'DuyetDeCuong',
  fn: 'Review, Approve, Request Changes, and Reject Student Outlines',
  description:
    'Verify that submitting a review is blocked when the grading deadline closes after the approve modal is already open',
  procedure:
    '1. Log in as a Commenting Lecturer, open "/lecturer/outline-review" while the deadline is OPEN, switch to "Sinh viên được phân công nhận xét", unlock preview, and click "Duyệt".\n' +
    '2. The "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline transitions to COMPLETED before confirming.\n' +
    '3. Enter "Duyệt sau khi hết hạn thẩm định" and click "Xác nhận duyệt".',
  expected:
    '1. The API PUT /outline/{publicId}/review returns HTTP 403 with code = 3086.\n' +
    '2. The response message is "Đã quá thời hạn giảng viên nhận xét đề cương, vui lòng liên hệ Trưởng bộ môn gia hạn".\n' +
    '3. The database keeps thesis_outline.status = PENDING and review_feedback = NULL.\n' +
    '4. The UI displays error toast "Đã quá thời hạn thẩm định đề cương, vui lòng liên hệ Trưởng bộ môn gia hạn!".',
  precondition:
    '1. Commenting lecturer "Hoàng Thị Thu" opens the approve modal on student "9990000701"\'s PENDING outline while the deadline is OPEN, and the deadline transitions to COMPLETED before confirming.',
});

const ITC084 = defineItc({
  id: 'ITC084',
  feature: 'outline',
  module: 'DuyetDeCuong',
  sheet: 'DuyetDeCuong',
  fn: 'Review, Approve, Request Changes, and Reject Student Outlines',
  description:
    'Verify that submitting a review is blocked when the outline deadline transitions to not started before confirming review',
  procedure:
    '1. Log in as a Commenting Lecturer, open "/lecturer/outline-review" while the deadline is OPEN, switch to "Sinh viên được phân công nhận xét", unlock preview, and click "Duyệt".\n' +
    '2. The "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline transitions to NOT_STARTED (future start date) before confirming.\n' +
    '3. Enter "Duyệt trước thời điểm mở hạn" and click "Xác nhận duyệt".',
  expected:
    '1. The API PUT /outline/{publicId}/review returns HTTP 403 with code = 3085.\n' +
    '2. The response message is "Thời hạn sinh viên nộp đề cương chưa mở hoặc đã kết thúc".\n' +
    '3. The database keeps thesis_outline.status = PENDING and review_feedback = NULL.\n' +
    '4. The UI displays error toast "Thời hạn sinh viên nộp đề cương chưa mở hoặc đã kết thúc".',
  precondition:
    '1. Commenting lecturer "Hoàng Thị Thu" opens the approve modal on student "9990000701"\'s PENDING outline while the deadline is OPEN, and the deadline transitions to NOT_STARTED before confirming.',
});

const ITC085 = defineItc({
  id: 'ITC085',
  feature: 'outline',
  module: 'DuyetDeCuong',
  sheet: 'DuyetDeCuong',
  fn: 'Review, Approve, Request Changes, and Reject Student Outlines',
  description:
    'Verify that submitting a review is blocked when the outline is no longer in PENDING status',
  procedure:
    '1. Log in as a Commenting Lecturer, open "/lecturer/outline-review" while the outline is PENDING, switch to "Sinh viên được phân công nhận xét", unlock preview, and click "Duyệt".\n' +
    '2. The outline is already reviewed as REQUEST_CHANGES before confirming approval in the modal.\n' +
    '3. Click "Xác nhận duyệt".',
  expected:
    '1. The API PUT /outline/{publicId}/review returns HTTP 409 with code = 3083.\n' +
    '2. The response message is "Đề cương không ở trạng thái chờ thẩm định".\n' +
    '3. The database preserves thesis_outline.status = REQUEST_CHANGES and the previous review feedback.\n' +
    '4. The UI displays error toast "Đề cương không ở trạng thái chờ thẩm định".',
  precondition:
    '1. Commenting lecturer "Hoàng Thị Thu" opens the approve modal on student "9990000701"\'s PENDING outline, and the outline transitions to REQUEST_CHANGES before the modal confirmation is submitted.',
});

// ============================================================================
// SECURITY TEST CASES (TC-SEC-031 .. TC-SEC-036)
// ============================================================================

const SEC031 = defineItcSec({
  id: 'TC-SEC-031',
  feature: 'outline',
  module: 'DuyetDeCuong',
  sheet: 'DuyetDeCuong',
  scenario: 'An unauthenticated user opens the outline review screen directly and calls commenting lecturer review APIs',
  roleSession: 'Unauthenticated (Anonymous)',
  technique: 'EP',
  given: 'The browser has no active login session (no access_token cookie)',
  when: 'Open "/lecturer/outline-review" directly on the Lecturer portal and call GET /outline/review-list and PUT /outline/{publicId}/review',
  then: 'GET /my-info, GET /outline/review-list, and PUT /outline/{publicId}/review return HTTP 401 with code = 2000; the UI automatically redirects to "/login" and displays no outline data',
});

const SEC032 = defineItcSec({
  id: 'TC-SEC-032',
  feature: 'outline',
  module: 'DuyetDeCuong',
  sheet: 'DuyetDeCuong',
  scenario: 'A student accesses the outline review screen and invokes commenting lecturer review list and review APIs',
  roleSession: 'Student (STUDENT), logged in',
  technique: 'EP',
  given: 'Logged in with a Student account (without COMMENTING_LECTURER role or REVIEW_OUTLINE authority)',
  when: 'Open "/lecturer/outline-review" directly on the Lecturer portal and call GET /outline/review-list and PUT /outline/{publicId}/review',
  then: 'The UI blocks access with message "Tài khoản của bạn không có quyền truy cập cổng cán bộ."; GET /outline/review-list returns HTTP 403 with code = 2001 and message "Tài khoản hiện tại không phải là giảng viên"; PUT /outline/{publicId}/review returns HTTP 403 with code = 2001 and message "Bạn không có quyền truy cập (access denied)", and outline status remains PENDING in the database',
});

const SEC033 = defineItcSec({
  id: 'TC-SEC-033',
  feature: 'outline',
  module: 'DuyetDeCuong',
  sheet: 'DuyetDeCuong',
  scenario: 'A plain lecturer without the COMMENTING_LECTURER role accesses the outline review screen and calls outline review APIs',
  roleSession: 'Lecturer (LECTURER), logged in',
  technique: 'EP',
  given: 'Logged in with a Lecturer account not assigned as a supervisor or commenting lecturer in the semester',
  when: 'Open "/lecturer/outline-review" directly on the Lecturer portal and call GET /outline/{publicId} and PUT /outline/{publicId}/review',
  then: 'The UI blocks access with message "Tài khoản của bạn không có quyền truy cập cổng cán bộ."; GET /outline/{publicId} returns HTTP 403 with code = 2001 and message "Bạn không có quyền truy cập thông tin đề cương này"; PUT /outline/{publicId}/review returns HTTP 403 with code = 2001 and message "Bạn không có quyền truy cập (access denied)", and outline status remains PENDING in the database',
});

const SEC034 = defineItcSec({
  id: 'TC-SEC-034',
  feature: 'outline',
  module: 'DuyetDeCuong',
  sheet: 'DuyetDeCuong',
  scenario: 'A commenting lecturer session with a logged-out token accesses the outline review screen and outline review APIs',
  roleSession: 'Commenting Lecturer (COMMENTING_LECTURER), logged-out token',
  technique: 'STATE_TRANSITION',
  given: 'The commenting lecturer has logged out via POST /log-out so the token is invalidated, while the browser still sends the old access_token cookie',
  when: 'Open "/lecturer/outline-review" and call GET /outline/review-list and PUT /outline/{publicId}/review with the logged-out token',
  then: 'GET /my-info, GET /outline/review-list, and PUT /outline/{publicId}/review return HTTP 401 with code = 2000; the UI redirects to "/login", displays no data, and outline status remains PENDING in the database',
});

const SEC035 = defineItcSec({
  id: 'TC-SEC-035',
  feature: 'outline',
  module: 'DuyetDeCuong',
  sheet: 'DuyetDeCuong',
  scenario: 'A supervisor without the COMMENTING_LECTURER role attempts to approve their own supervised student\'s outline',
  roleSession: 'Supervisor (SUPERVISOR), logged in (BR-05 separation of duty)',
  technique: 'DECISION_TABLE',
  given: 'Supervisor "Nguyễn Văn Hùng" supervises student "9990000701" (without COMMENTING_LECTURER role) while "Hoàng Thị Thu" is the assigned commenting lecturer of the PENDING outline',
  when: 'Open "/lecturer/outline-review" as Supervisor, switch to the "Sinh viên được phân công nhận xét" tab, and invoke PUT /outline/{publicId}/review directly',
  then: 'Student "9990000701" is not displayed under "Sinh viên được phân công nhận xét"; PUT /outline/{publicId}/review returns HTTP 403 with code = 2001 and message "Bạn không có quyền truy cập (access denied)", and outline status remains PENDING in the database',
});

const SEC036 = defineItcSec({
  id: 'TC-SEC-036',
  feature: 'outline',
  module: 'DuyetDeCuong',
  sheet: 'DuyetDeCuong',
  scenario: 'An unrelated commenting lecturer attempts to view detail or review an outline assigned to another commenting lecturer (IDOR)',
  roleSession: 'Commenting Lecturer (COMMENTING_LECTURER), assigned to a different student',
  technique: 'ERROR_GUESSING',
  given: 'Commenting lecturer "Lê Hoàng Long" holds the COMMENTING_LECTURER role for another student, while student "9990000701"\'s PENDING outline is assigned to "Hoàng Thị Thu"',
  when: 'Open "/lecturer/outline-review" as "Lê Hoàng Long", switch to "Sinh viên được phân công nhận xét", and invoke GET /outline/{publicId} and PUT /outline/{publicId}/review targeting student "9990000701"\'s outline',
  then: 'Student "9990000701" is not displayed in "Lê Hoàng Long"\'s review list; GET /outline/{publicId} returns HTTP 403 with code = 2001 and message "Bạn không có quyền truy cập thông tin đề cương này"; PUT /outline/{publicId}/review returns HTTP 403 with code = 2001 and message "Bạn không phải giảng viên nhận xét được phân công cho đề cương này", and outline status remains PENDING in the database',
});

// ============================================================================
// HÀM SINH FILE PDF HỢP LỆ TỐI THIỂU ĐỂ NỘP ĐỀ CƯƠNG QUA API SETUP
// ============================================================================

function createMinimalValidPdfBuffer(titleText = 'TLU GPMS Test Outline PDF'): Buffer {
  const safeText = titleText.replace(/[()\\]/g, '');
  const stream = `BT /F1 12 Tf 72 720 Td (${safeText}) Tj ET`;
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];

  let body = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(body, 'utf8'));
    body += obj;
  }
  const xrefStart = Buffer.byteLength(body, 'utf8');
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    body += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(body, 'utf8');
}

// ============================================================================
// HẠ TẦNG DỮ LIỆU TEST (TẠO QUA API, ĐỐI CHIẾU DB SELECT, DỌN SẠCH SAU TEST)
// ============================================================================

const TEST_MAIN_SUPERVISOR = {
  teacherCode: 'GV999701',
  firstName: 'Nguyễn Văn',
  lastName: 'Hùng',
  fullName: 'Nguyễn Văn Hùng',
  email: 'itc.duyetdc.gv.999701@tlu.edu.vn',
  phone: '0989970701',
  academicTitle: 'TS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_PRIMARY_REVIEWER = {
  teacherCode: 'GV999702',
  firstName: 'Hoàng Thị',
  lastName: 'Thu',
  fullName: 'Hoàng Thị Thu',
  email: 'itc.duyetdc.gv.999702@tlu.edu.vn',
  phone: '0989970702',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_OTHER_REVIEWER = {
  teacherCode: 'GV999703',
  firstName: 'Lê Hoàng',
  lastName: 'Long',
  fullName: 'Lê Hoàng Long',
  email: 'itc.duyetdc.gv.999703@tlu.edu.vn',
  phone: '0989970703',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_PLAIN_LECTURER = {
  teacherCode: 'GV999704',
  firstName: 'Vũ Minh',
  lastName: 'Tuấn',
  fullName: 'Vũ Minh Tuấn',
  email: 'itc.duyetdc.gv.999704@tlu.edu.vn',
  phone: '0989970704',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_ARCHIVE_REVIEWER = {
  teacherCode: 'GV999798',
  firstName: 'Phạm Lưu',
  lastName: 'Trữ',
  fullName: 'Phạm Lưu Trữ',
  email: 'itc.duyetdc.gv.999798@tlu.edu.vn',
  phone: '0989970798',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_ARCHIVE_SUPERVISOR = {
  teacherCode: 'GV999799',
  firstName: 'Trần Lưu',
  lastName: 'Trữ',
  fullName: 'Trần Lưu Trữ',
  email: 'itc.duyetdc.gv.999799@tlu.edu.vn',
  phone: '0989970799',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_STUDENT_1 = {
  studentCode: '9990000701',
  firstName: 'Trần Minh',
  lastName: 'Quang',
  fullName: 'Trần Minh Quang',
  email: 'itc.duyetdc.sv.9990000701@gmail.com',
  phone: '0989970101',
  batch: 'K64',
  className: '64HTTT99',
  pdfFileName: '64HTTT99_9990000701_TranMinhQuang.pdf',
};

const TEST_STUDENT_2 = {
  studentCode: '9990000702',
  firstName: 'Lê Thị',
  lastName: 'Mai',
  fullName: 'Lê Thị Mai',
  email: 'itc.duyetdc.sv.9990000702@gmail.com',
  phone: '0989970102',
  batch: 'K64',
  className: '64HTTT99',
  pdfFileName: '64HTTT99_9990000702_LeThiMai.pdf',
};

const TEST_STUDENT_3 = {
  studentCode: '9990000703',
  firstName: 'Phạm Quốc',
  lastName: 'Bảo',
  fullName: 'Phạm Quốc Bảo',
  email: 'itc.duyetdc.sv.9990000703@gmail.com',
  phone: '0989970103',
  batch: 'K64',
  className: '64HTTT99',
  pdfFileName: '64HTTT99_9990000703_PhamQuocBao.pdf',
};

const TEST_STUDENT_4 = {
  studentCode: '9990000704',
  firstName: 'Vũ Ngọc',
  lastName: 'Ánh',
  fullName: 'Vũ Ngọc Ánh',
  email: 'itc.duyetdc.sv.9990000704@gmail.com',
  phone: '0989970104',
  batch: 'K64',
  className: '64HTTT99',
  pdfFileName: '64HTTT99_9990000704_VuNgocAnh.pdf',
};

const TEST_STUDENT_5 = {
  studentCode: '9990000705',
  firstName: 'Ngô Gia',
  lastName: 'Huy',
  fullName: 'Ngô Gia Huy',
  email: 'itc.duyetdc.sv.9990000705@gmail.com',
  phone: '0989970105',
  batch: 'K64',
  className: '64HTTT99',
  pdfFileName: '64HTTT99_9990000705_NgoGiaHuy.pdf',
};

type StudentProfile = typeof TEST_STUDENT_1;
type TeacherProfile = typeof TEST_MAIN_SUPERVISOR;

interface TeacherHandle {
  profile: TeacherProfile;
  id: number;
  publicId: string;
  token: string;
}

interface DeadlineSnapshot {
  templateId: string;
  deadlineId: string | null;
  originalStart: string | null;
  originalEnd: string | null;
  originalStatus: string | null;
}

interface SubmissionStep {
  submissionNote?: string;
  advisorFeedback?: string;
  reviewDecision?: 'APPROVED' | 'REQUEST_CHANGES' | 'REJECTED';
  reviewFeedback?: string;
}

interface ProvisionStudentSpec {
  profile: StudentProfile;
  topicName: string;
  reviewer?: TeacherHandle;
  pendingTitleChangeName?: string;
  submissions?: SubmissionStep[];
}

interface ProvisionedStudentHandle {
  profile: StudentProfile;
  studentPublicId: string;
  studentToken: string;
  topicId: number;
  topicPublicId: string;
  outlinePublicId: string;
  reviewer: TeacherHandle;
  isDisqualified: boolean;
}

interface TestEnvState {
  hodToken: string;
  majorId: number;
  majorName: string;
  semesterId: number;
  semesterPublicId: string;
  semesterStartDate: string;
  semesterEndDate: string;
  originallyLocked: boolean;
  mainSupervisor: TeacherHandle;
  primaryReviewer: TeacherHandle;
  otherReviewer: TeacherHandle;
  plainLecturer: TeacherHandle;
  archiveReviewer: TeacherHandle;
  archiveSupervisor: TeacherHandle;
  dlDangKy: DeadlineSnapshot;
  dlTbmChot: DeadlineSnapshot;
  dlDeCuong: DeadlineSnapshot;
}

let envState: TestEnvState;
let activeHandles: ProvisionedStudentHandle[] = [];
let rotateCounter = 1;

function toLocalIso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

async function setAuthCookie(context: BrowserContext, token: string) {
  const apiUrlObj = new URL(getApiBaseUrl());
  await context.clearCookies();
  await context.addCookies([
    {
      name: 'access_token',
      value: token,
      domain: apiUrlObj.hostname,
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

async function submitOutlineViaApi(
  request: APIRequestContext,
  token: string,
  fileName: string,
  submissionNote?: string,
): Promise<{ status: number; body: any }> {
  const url = `${getApiBaseUrl()}/outline/submit`;
  const multipart: Record<string, any> = {
    file: {
      name: fileName,
      mimeType: 'application/pdf',
      buffer: createMinimalValidPdfBuffer(`Outline ${fileName}`),
    },
  };
  if (submissionNote !== undefined) {
    multipart.submissionNote = submissionNote;
  }
  const res = await request.fetch(url, {
    method: 'POST',
    headers: { Cookie: `access_token=${token}` },
    multipart,
  });
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    body = await res.text();
  }
  return { status: res.status(), body };
}

async function updateDeadline(
  request: APIRequestContext,
  snap: DeadlineSnapshot,
  code: string,
  mode: 'OPEN' | 'CLOSED' | 'NOT_STARTED' | 'EXTENDED' | 'RESTORE',
) {
  const semStart = new Date(`${envState.semesterStartDate}T00:00:00`);
  const semEnd = new Date(`${envState.semesterEndDate}T23:59:59`);
  const now = new Date();

  let startDateStr: string;
  let endDateStr: string;
  let status: string | undefined;

  if (mode === 'RESTORE') {
    if (!snap.originalStart || !snap.originalEnd) return;
    startDateStr = snap.originalStart;
    endDateStr = snap.originalEnd;
    status = snap.originalStatus ?? undefined;
  } else if (mode === 'OPEN') {
    const start = new Date(Math.max(semStart.getTime(), now.getTime() - 24 * 3600 * 1000));
    const end = new Date(Math.min(semEnd.getTime(), now.getTime() + 48 * 3600 * 1000));
    startDateStr = toLocalIso(start);
    endDateStr = toLocalIso(end);
    status = 'IN_PROGRESS';
  } else if (mode === 'EXTENDED') {
    const start = new Date(Math.max(semStart.getTime(), now.getTime() - 48 * 3600 * 1000));
    const end = new Date(Math.min(semEnd.getTime(), now.getTime() + 48 * 3600 * 1000));
    startDateStr = toLocalIso(start);
    endDateStr = toLocalIso(end);
    status = 'EXTENDED';
  } else if (mode === 'NOT_STARTED') {
    const start = new Date(Math.min(semEnd.getTime() - 3600 * 1000, now.getTime() + 24 * 3600 * 1000));
    const end = new Date(Math.min(semEnd.getTime(), start.getTime() + 48 * 3600 * 1000));
    startDateStr = toLocalIso(start);
    endDateStr = toLocalIso(end);
    status = 'NOT_STARTED';
  } else {
    const end = new Date(Math.max(semStart.getTime() + 60 * 1000, now.getTime() - 60 * 1000));
    const start = new Date(Math.max(semStart.getTime(), end.getTime() - 3600 * 1000));
    startDateStr = toLocalIso(start);
    endDateStr = toLocalIso(end);
    status = 'COMPLETED';
  }

  const res = await apiCall(request, envState.hodToken, 'PUT', '/api/v1/deadlines/batch-update', {
    data: {
      semesterId: envState.semesterPublicId,
      deadlines: [
        {
          deadlineId: snap.deadlineId,
          templateId: snap.templateId,
          startDate: startDateStr,
          endDate: endDateStr,
          status,
        },
      ],
    },
  });
  if (res.status !== 200) {
    throw new Error(`Không thể cập nhật deadline ${code} (${mode}): ${JSON.stringify(res.body)}`);
  }

  const dlRes = await apiCall(request, envState.hodToken, 'GET', '/api/v1/deadlines', {
    params: { semesterId: envState.semesterPublicId },
  });
  const list: any[] = dlRes.body?.data?.giaoNhanDeadlines ?? [];
  const found = list.find((d) => d.code === code);
  if (found?.deadlineId) {
    snap.deadlineId = found.deadlineId;
  }
}

async function setLockStatus(request: APIRequestContext, isLocked: boolean) {
  await updateDeadline(request, envState.dlDangKy, 'DANG_KY_GVHD', 'CLOSED');
  await updateDeadline(request, envState.dlTbmChot, 'TBM_CHOT_DS_GVHD_DU_KIEN', 'OPEN');
  const res = await apiCall(
    request,
    envState.hodToken,
    'PUT',
    `/semesters/${envState.semesterPublicId}/advisor-assignments/lock-status`,
    { data: { isLocked } },
  );
  if (res.status !== 200) {
    throw new Error(`Không thể đặt trạng thái khóa=${isLocked}: ${JSON.stringify(res.body)}`);
  }
}

async function ensureTeacher(
  request: APIRequestContext,
  teacher: TeacherProfile,
  assignAsAdvisor: boolean,
  maxStudents = 20,
): Promise<TeacherHandle> {
  const existingRows = await dbSelect<{ id: number }>(
    'SELECT id FROM teacher WHERE teacher_code = ?',
    [teacher.teacherCode],
  );

  if (existingRows.length === 0) {
    const createRes = await apiCall(request, envState.hodToken, 'POST', '/teacher', {
      data: {
        teacherCode: teacher.teacherCode,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        phone: teacher.phone,
        academicTitle: teacher.academicTitle,
        organization: teacher.organization,
        major: envState.majorName,
      },
    });
    if (createRes.status !== 200) {
      throw new Error(`Không thể tạo giảng viên ${teacher.teacherCode}: ${JSON.stringify(createRes.body)}`);
    }
  }

  const tRows = await dbSelect<{ id: number }>(
    'SELECT id FROM teacher WHERE teacher_code = ?',
    [teacher.teacherCode],
  );
  if (tRows.length === 0) {
    throw new Error(`Không tìm thấy giảng viên ${teacher.teacherCode} trong DB`);
  }
  const teacherId = tRows[0].id;

  let teacherPublicId = '';
  if (assignAsAdvisor) {
    const usedRows = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM advisor_registration
        WHERE semester_id = ? AND lecturer_id = ?`,
      [envState.semesterId, teacherId],
    );
    const effectiveQuota = Math.max(maxStudents, Number(usedRows[0]?.total ?? 0) + 100);

    await apiCall(request, envState.hodToken, 'POST', `/semesters/${envState.semesterPublicId}/advisors`, {
      data: {
        teacherIds: [teacherId],
        maxStudentsPerTeacher: effectiveQuota,
      },
    });
    await apiCall(
      request,
      envState.hodToken,
      'PUT',
      `/semesters/${envState.semesterPublicId}/advisors/${teacherId}/quota`,
      { data: { maxStudents: effectiveQuota } },
    );

    const advisorsRes = await apiCall(
      request,
      envState.hodToken,
      'GET',
      `/semesters/${envState.semesterPublicId}/advisors`,
    );
    const matched = (advisorsRes.body?.data ?? []).find((a: any) => a.teacherCode === teacher.teacherCode);
    teacherPublicId = matched?.teacherPublicId ?? '';
    if (!teacherPublicId) {
      throw new Error(`Không lấy được publicId cho giảng viên ${teacher.teacherCode}`);
    }
  } else {
    await apiCall(
      request,
      envState.hodToken,
      'DELETE',
      `/semesters/${envState.semesterPublicId}/advisors/${teacherId}`,
    );
  }

  const token = await loginByEmail(request, teacher.email);
  return { profile: teacher, id: teacherId, publicId: teacherPublicId, token };
}

/**
 * Tạo giảng viên nhận xét riêng biệt cho các case phát sinh đề tài DISQUALIFIED (REJECTED),
 * tránh tích lũy đề tài bị đình chỉ (không chuyển GVNX được qua API) vào danh sách của GVNX chính.
 */
async function createFreshIsolatedReviewer(
  request: APIRequestContext,
  tag: string,
): Promise<TeacherHandle> {
  const uniqueDigits = `${String(Date.now()).slice(-5)}${rotateCounter++}`.slice(-6);
  const profile: TeacherProfile = {
    teacherCode: `GV9997${tag}${uniqueDigits.slice(-3)}`,
    firstName: 'Hoàng Thị',
    lastName: 'Thu',
    fullName: 'Hoàng Thị Thu',
    email: `itc.duyetdc.rev.${tag.toLowerCase()}.${uniqueDigits}@tlu.edu.vn`,
    phone: `0977${uniqueDigits}`,
    academicTitle: 'ThS.',
    organization: 'Trường Đại học Thủy lợi',
  };
  return ensureTeacher(request, profile, true, 20);
}

async function sweepResidualTopicsInIsolatedMajor(request: APIRequestContext) {
  // 1. Chuyển toàn bộ đề cương IN_PROGRESS đang gắn với primaryReviewer / otherReviewer sang archiveReviewer
  const reviewerIds = [envState.primaryReviewer.id, envState.otherReviewer.id].filter((id) => id > 0);
  if (reviewerIds.length > 0 && envState.archiveReviewer.id > 0) {
    const topicRows = await dbSelect<{ topic_id: number }>(
      `SELECT tt.id AS topic_id
         FROM thesis_outline o
         JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE tt.semester_id = ?
          AND tt.status = 'IN_PROGRESS'
          AND tt.current_stage IN ('STAGE_2_TOPIC_CONFIRMED', 'STAGE_3_OUTLINE_APPROVED')
          AND s.student_code LIKE '999%'
          AND o.commenting_lecture_id IN (${reviewerIds.map(() => '?').join(', ')})`,
      [envState.semesterId, ...reviewerIds],
    );
    for (const row of topicRows) {
      await apiCall(request, envState.hodToken, 'POST', '/api/v1/assignments/commenting-lecturers/manual', {
        data: {
          commentingLecturerId: envState.archiveReviewer.id,
          studentOrTopicIds: [row.topic_id],
        },
      });
    }
  }

  // 2. Chuyển các đề tài test 999% sang archiveSupervisor
  const lockRows = await dbSelect<{ is_advisor_assignment_locked: Buffer | number }>(
    'SELECT is_advisor_assignment_locked FROM semester WHERE id = ?',
    [envState.semesterId],
  );
  const currentlyLocked = Boolean(
    Buffer.isBuffer(lockRows[0]?.is_advisor_assignment_locked)
      ? lockRows[0].is_advisor_assignment_locked[0]
      : lockRows[0]?.is_advisor_assignment_locked,
  );
  if (currentlyLocked) {
    await setLockStatus(request, false);
  } else {
    await updateDeadline(request, envState.dlDangKy, 'DANG_KY_GVHD', 'CLOSED');
    await updateDeadline(request, envState.dlTbmChot, 'TBM_CHOT_DS_GVHD_DU_KIEN', 'OPEN');
  }

  const wsRes = await apiCall(
    request,
    envState.hodToken,
    'GET',
    `/semesters/${envState.semesterPublicId}/advisor-assignments`,
  );
  const students: any[] = wsRes.body?.data?.students ?? [];
  for (const st of students) {
    if (!String(st.studentCode || '').startsWith('999')) continue;
    const currentCoSupId = st.coSupervisor?.publicId ?? st.coSupervisor?.teacherPublicId ?? st.coSupervisorPublicId;
    const currentSupId = st.supervisor?.publicId ?? st.supervisor?.teacherPublicId ?? st.supervisorPublicId;
    if (currentCoSupId) {
      await apiCall(
        request,
        envState.hodToken,
        'PUT',
        `/semesters/${envState.semesterPublicId}/advisor-assignments/students/${st.studentPublicId}/co-supervisor`,
        { data: { coTeacherPublicId: null } },
      );
    }
    if (currentSupId !== envState.archiveSupervisor.publicId) {
      if (st.status === 'UNASSIGNED') {
        await apiCall(
          request,
          envState.hodToken,
          'POST',
          `/semesters/${envState.semesterPublicId}/advisor-assignments/assign`,
          {
            data: {
              teacherPublicId: envState.archiveSupervisor.publicId,
              studentPublicIds: [st.studentPublicId],
            },
          },
        );
      } else {
        await apiCall(
          request,
          envState.hodToken,
          'PUT',
          `/semesters/${envState.semesterPublicId}/advisor-assignments/students/${st.studentPublicId}/supervisor`,
          { data: { newTeacherPublicId: envState.archiveSupervisor.publicId } },
        );
      }
    }
  }
}

async function releaseStudentCodeIfTaken(request: APIRequestContext, profile: StudentProfile) {
  const existing = await dbSelect<{ id: number }>(
    'SELECT id FROM student WHERE student_code = ?',
    [profile.studentCode],
  );
  if (existing.length === 0) return;

  const listRes = await apiCall(request, envState.hodToken, 'GET', '/student', {
    params: { semesterId: envState.semesterPublicId, keyword: profile.studentCode },
  });
  const matched = (listRes.body?.data?.content ?? []).find(
    (s: any) => s.studentCode === profile.studentCode,
  );
  if (!matched?.publicId) return;

  const suffix = `${String(Date.now()).slice(-5)}${rotateCounter++}`;
  await apiCall(request, envState.hodToken, 'PUT', `/student/${matched.publicId}`, {
    data: {
      studentCode: `9997${suffix.slice(-6)}`,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: `itc.arch.duyetdc.sv.${suffix}@gmail.com`,
      phone: `0977${suffix.slice(-6)}`,
      batch: profile.batch,
      className: profile.className,
    },
  });
}

async function provisionStudentsWithOutlines(
  request: APIRequestContext,
  specs: ProvisionStudentSpec[],
): Promise<ProvisionedStudentHandle[]> {
  await sweepResidualTopicsInIsolatedMajor(request);
  await updateDeadline(request, envState.dlDangKy, 'DANG_KY_GVHD', 'OPEN');

  const handles: ProvisionedStudentHandle[] = [];
  for (const spec of specs) {
    await releaseStudentCodeIfTaken(request, spec.profile);

    const createRes = await apiCall(request, envState.hodToken, 'POST', '/student', {
      data: {
        studentCode: spec.profile.studentCode,
        firstName: spec.profile.firstName,
        lastName: spec.profile.lastName,
        email: spec.profile.email,
        phone: spec.profile.phone,
        batch: spec.profile.batch,
        className: spec.profile.className,
        major: envState.majorName,
      },
    });
    if (createRes.status !== 200) {
      throw new Error(`Không thể tạo SV ${spec.profile.studentCode}: ${JSON.stringify(createRes.body)}`);
    }

    const listRes = await apiCall(request, envState.hodToken, 'GET', '/student', {
      params: { semesterId: envState.semesterPublicId, keyword: spec.profile.studentCode },
    });
    const matched = (listRes.body?.data?.content ?? []).find(
      (s: any) => s.studentCode === spec.profile.studentCode,
    );
    if (!matched?.publicId) {
      throw new Error(`Không tìm thấy publicId của SV ${spec.profile.studentCode}`);
    }

    const studentToken = await loginByEmail(request, spec.profile.email);

    const regRes = await apiCall(request, studentToken, 'POST', '/api/student/advisor-registrations', {
      data: {
        teacherPublicId: envState.mainSupervisor.publicId,
        topicName: null,
      },
    });
    if (regRes.status !== 200 || !regRes.body?.data?.registrationPublicId) {
      throw new Error(`SV ${spec.profile.studentCode} không thể gửi đơn ĐK GVHD: ${JSON.stringify(regRes.body)}`);
    }

    const approveRegRes = await apiCall(
      request,
      envState.mainSupervisor.token,
      'PATCH',
      `/api/teacher/advisor-registrations/${regRes.body.data.registrationPublicId}/approve`,
    );
    if (approveRegRes.status !== 200) {
      throw new Error(`GVHD không thể duyệt đơn ĐK của SV ${spec.profile.studentCode}: ${JSON.stringify(approveRegRes.body)}`);
    }

    handles.push({
      profile: spec.profile,
      studentPublicId: matched.publicId,
      studentToken,
      topicId: 0,
      topicPublicId: '',
      outlinePublicId: '',
      reviewer: spec.reviewer ?? envState.primaryReviewer,
      isDisqualified: false,
    });
  }

  activeHandles.push(...handles);

  // Chốt danh sách phân công GVHD (tạo ThesisTopic ở STAGE_1) rồi mở khóa lại
  await setLockStatus(request, true);
  await setLockStatus(request, false);
  await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'OPEN');

  // Chốt tên đề tài -> GVHD duyệt -> TBM phân công GVNX -> SV nộp đề cương & xử lý setup
  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    const h = handles[i];
    const targetReviewer = h.reviewer;

    const confirmRes = await apiCall(request, h.studentToken, 'POST', '/topic/confirm-title', {
      data: { newName: spec.topicName },
    });
    if (confirmRes.status !== 200) {
      throw new Error(`SV ${h.profile.studentCode} không thể chốt tên đề tài: ${JSON.stringify(confirmRes.body)}`);
    }

    const ovRes = await apiCall(request, h.studentToken, 'GET', '/topic/my-title-history');
    h.topicPublicId = ovRes.body?.data?.topicPublicId ?? '';
    const latestReqId = ovRes.body?.data?.histories?.[0]?.publicId;
    const approveTitleRes = await apiCall(
      request,
      envState.mainSupervisor.token,
      'PUT',
      `/topic/title-request/${latestReqId}/review`,
      { data: { decision: 'APPROVED' } },
    );
    if (approveTitleRes.status !== 200) {
      throw new Error(`GVHD không thể duyệt tên đề tài cho SV ${h.profile.studentCode}: ${JSON.stringify(approveTitleRes.body)}`);
    }

    const topicRows = await dbSelect<{ id: number }>(
      `SELECT tt.id
         FROM thesis_topic tt
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [h.profile.studentCode, envState.semesterId],
    );
    h.topicId = topicRows[0].id;

    const assignRes = await apiCall(
      request,
      envState.hodToken,
      'POST',
      '/api/v1/assignments/commenting-lecturers/manual',
      {
        data: {
          commentingLecturerId: targetReviewer.id,
          studentOrTopicIds: [h.topicId],
        },
      },
    );
    if (assignRes.status !== 200) {
      throw new Error(`TBM không thể phân công GVNX cho SV ${h.profile.studentCode}: ${JSON.stringify(assignRes.body)}`);
    }
    // Đăng nhập lại GVNX để JWT mang role COMMENTING_LECTURER mới nhất
    targetReviewer.token = await loginByEmail(request, targetReviewer.profile.email);

    const myOutlineInit = await apiCall(request, h.studentToken, 'GET', '/outline/my-outline');
    h.outlinePublicId = myOutlineInit.body?.data?.publicId ?? '';

    for (const step of spec.submissions ?? []) {
      await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'OPEN');
      const subRes = await submitOutlineViaApi(
        request,
        h.studentToken,
        h.profile.pdfFileName,
        step.submissionNote,
      );
      if (subRes.status !== 200) {
        throw new Error(`SV ${h.profile.studentCode} không thể nộp đề cương: ${JSON.stringify(subRes.body)}`);
      }

      const myOutlineRes = await apiCall(request, h.studentToken, 'GET', '/outline/my-outline');
      h.outlinePublicId = myOutlineRes.body?.data?.publicId ?? h.outlinePublicId;

      if (step.advisorFeedback) {
        const fbRes = await apiCall(
          request,
          envState.mainSupervisor.token,
          'PUT',
          `/outline/${h.outlinePublicId}/advisor-feedback`,
          { data: { feedback: step.advisorFeedback } },
        );
        if (fbRes.status !== 200) {
          throw new Error(`GVHD không thể gửi góp ý setup: ${JSON.stringify(fbRes.body)}`);
        }
      }

      if (step.reviewDecision) {
        if (step.reviewDecision === 'REJECTED') {
          await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'EXTENDED');
        }
        const revRes = await apiCall(
          request,
          targetReviewer.token,
          'PUT',
          `/outline/${h.outlinePublicId}/review`,
          {
            data: {
              decision: step.reviewDecision,
              feedback: step.reviewFeedback ?? 'Nhận xét thẩm định tự động',
            },
          },
        );
        if (revRes.status !== 200) {
          throw new Error(`GVNX không thể thẩm định (${step.reviewDecision}): ${JSON.stringify(revRes.body)}`);
        }
        if (step.reviewDecision === 'REJECTED') {
          h.isDisqualified = true;
          await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'OPEN');
        }
      }
    }

    if (spec.pendingTitleChangeName) {
      await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'OPEN');
      const changeRes = await apiCall(request, h.studentToken, 'POST', '/topic/change-title', {
        data: { newName: spec.pendingTitleChangeName },
      });
      if (changeRes.status !== 200) {
        throw new Error(`SV ${h.profile.studentCode} không thể gửi yêu cầu đổi tên: ${JSON.stringify(changeRes.body)}`);
      }
    }
  }

  return handles;
}

async function cleanupActiveStudents(request: APIRequestContext) {
  if (activeHandles.length === 0) return;

  const handles = [...activeHandles];
  activeHandles = [];

  // Reassign GVNX cho các đề tài IN_PROGRESS trước khi đổi mã sinh viên lưu trữ
  for (const h of handles) {
    if (!h.topicId || h.isDisqualified) continue;
    await apiCall(request, envState.hodToken, 'POST', '/api/v1/assignments/commenting-lecturers/manual', {
      data: {
        commentingLecturerId: envState.archiveReviewer.id,
        studentOrTopicIds: [h.topicId],
      },
    });
  }

  await sweepResidualTopicsInIsolatedMajor(request);

  for (const h of handles) {
    const suffix = `${String(Date.now()).slice(-5)}${rotateCounter++}`;
    await apiCall(request, envState.hodToken, 'PUT', `/student/${h.studentPublicId}`, {
      data: {
        studentCode: `9997${suffix.slice(-6)}`,
        firstName: h.profile.firstName,
        lastName: h.profile.lastName,
        email: `itc.arch.duyetdc.sv.${suffix}@gmail.com`,
        phone: `0977${suffix.slice(-6)}`,
        batch: h.profile.batch,
        className: h.profile.className,
      },
    });
  }
}

async function openReviewerOutlineTab(page: Page, context: BrowserContext, token: string) {
  await setAuthCookie(context, token);

  const deadlinePromise = page.waitForResponse(
    (r) =>
      r.url().includes('/api/v1/deadlines') &&
      r.url().includes(`semesterId=${envState.semesterPublicId}`) &&
      r.request().method() === 'GET',
  );
  const reviewListPromise = page.waitForResponse(
    (r) =>
      r.url().includes('/outline/review-list') &&
      r.url().includes(`semesterId=${envState.semesterPublicId}`) &&
      r.request().method() === 'GET',
  );

  await page.goto('/lecturer/outline-review');
  const [deadlineRes, reviewListRes] = await Promise.all([deadlinePromise, reviewListPromise]);

  // Chuyển sang tab "Sinh viên được phân công nhận xét"
  await page.locator('#roleTabs button[data-role="reviewer"]').click();
  return { deadlineRes, reviewListRes };
}

async function unlockOutlineByPreview(page: Page, studentCode: string) {
  const row = page.getByRole('row', { name: new RegExp(studentCode) });
  await expect(row).toBeVisible();
  await row.getByTitle('Xem trước đề cương').click();
  const previewModal = page.locator('#outlineClassroomPreviewModal');
  await expect(previewModal).toBeVisible();
  await previewModal.getByRole('button', { name: 'Đóng xem trước' }).click();
  await expect(previewModal).toBeHidden();
}

test.describe('Report 5.2 - Commenting Lecturer Review of Student Thesis Outline (DuyetDeCuong)', () => {
  test.beforeAll(async ({ request }) => {
    const hodFallbackEmail = process.env.E2E_EMAIL_HEAD_OF_MAJOR?.trim();
    if (!hodFallbackEmail) {
      throw new Error('Thiếu E2E_EMAIL_HEAD_OF_MAJOR trong .env.e2e');
    }
    const hodFallbackToken = await loginByEmail(request, hodFallbackEmail);

    const semRes = await apiCall(request, hodFallbackToken, 'GET', '/semester/current');
    if (semRes.status !== 200 || !semRes.body?.data?.publicId) {
      throw new Error('Không tìm thấy học kỳ hiện tại (GET /semester/current)');
    }
    const semData = semRes.body.data;
    const semRows = await dbSelect<{
      id: number;
      is_advisor_assignment_locked: Buffer | number;
      start_date: string;
      end_date: string;
    }>(
      `SELECT id,
              is_advisor_assignment_locked,
              DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
              DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date
         FROM semester
        WHERE name = ?`,
      [semData.name],
    );
    if (semRows.length === 0) {
      throw new Error(`Không tìm thấy học kỳ "${semData.name}" trong DB`);
    }
    const semId = semRows[0].id;
    const origLocked = Boolean(
      Buffer.isBuffer(semRows[0].is_advisor_assignment_locked)
        ? semRows[0].is_advisor_assignment_locked[0]
        : semRows[0].is_advisor_assignment_locked,
    );

    const emptyMajorRows = await dbSelect<{
      id: number;
      name: string;
      email: string;
    }>(
      `SELECT m.id, m.name, a.email
         FROM major m
         JOIN account a ON a.id = m.head_account_id
         JOIN user_role ur ON ur.user_id = a.id AND ur.role_name = 'HEAD_OF_MAJOR'
        WHERE a.status = 1
          AND NOT EXISTS (
            SELECT 1
              FROM thesis_topic tt
              JOIN student s ON s.id = tt.student_id
             WHERE tt.semester_id = ?
               AND s.major_id = m.id
               AND s.student_code NOT LIKE '999%'
          )
        ORDER BY m.id ASC
        LIMIT 1`,
      [semId],
    );
    if (emptyMajorRows.length === 0) {
      throw new Error('Không tìm thấy ngành trống có Trưởng ngành hoạt động để cô lập dữ liệu kiểm thử');
    }
    const isolatedMajor = emptyMajorRows[0];
    const isolatedHodToken = await loginByEmail(request, isolatedMajor.email);

    const dlRes = await apiCall(request, isolatedHodToken, 'GET', '/api/v1/deadlines', {
      params: { semesterId: semData.publicId },
    });
    const giaoNhan: any[] = dlRes.body?.data?.giaoNhanDeadlines ?? [];
    const findSnap = (code: string): DeadlineSnapshot => {
      const item = giaoNhan.find((d) => d.code === code);
      if (!item?.templateId) {
        throw new Error(`Không tìm thấy mốc mẫu ${code}`);
      }
      return {
        templateId: item.templateId,
        deadlineId: item.deadlineId ?? null,
        originalStart: item.startDate ?? null,
        originalEnd: item.endDate ?? null,
        originalStatus: item.status ?? null,
      };
    };

    const dummyTeacher: TeacherHandle = { profile: TEST_MAIN_SUPERVISOR, id: 0, publicId: '', token: '' };
    envState = {
      hodToken: isolatedHodToken,
      majorId: isolatedMajor.id,
      majorName: isolatedMajor.name,
      semesterId: semId,
      semesterPublicId: semData.publicId,
      semesterStartDate: semRows[0].start_date,
      semesterEndDate: semRows[0].end_date,
      originallyLocked: origLocked,
      mainSupervisor: dummyTeacher,
      primaryReviewer: dummyTeacher,
      otherReviewer: dummyTeacher,
      plainLecturer: dummyTeacher,
      archiveReviewer: dummyTeacher,
      archiveSupervisor: dummyTeacher,
      dlDangKy: findSnap('DANG_KY_GVHD'),
      dlTbmChot: findSnap('TBM_CHOT_DS_GVHD_DU_KIEN'),
      dlDeCuong: findSnap('SV_CHINH_SUA_NOP_LAI_DE_CUONG'),
    };

    envState.mainSupervisor = await ensureTeacher(request, TEST_MAIN_SUPERVISOR, true, 20);
    envState.primaryReviewer = await ensureTeacher(request, TEST_PRIMARY_REVIEWER, true, 20);
    envState.otherReviewer = await ensureTeacher(request, TEST_OTHER_REVIEWER, true, 20);
    envState.plainLecturer = await ensureTeacher(request, TEST_PLAIN_LECTURER, false);
    envState.archiveReviewer = await ensureTeacher(request, TEST_ARCHIVE_REVIEWER, true, 500);
    envState.archiveSupervisor = await ensureTeacher(request, TEST_ARCHIVE_SUPERVISOR, true, 500);
  });

  test.afterAll(async ({ request }) => {
    if (!envState) return;
    try {
      await cleanupActiveStudents(request);
    } catch {
      // bỏ qua lỗi phụ khi dọn cuối suite
    }
    try {
      if (envState.originallyLocked) {
        await setLockStatus(request, true);
      }
    } catch {
      // giữ nguyên nếu không cần khóa lại
    }
    await updateDeadline(request, envState.dlDangKy, 'DANG_KY_GVHD', 'RESTORE');
    await updateDeadline(request, envState.dlTbmChot, 'TBM_CHOT_DS_GVHD_DU_KIEN', 'RESTORE');
    await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'RESTORE');
  });

  // ==========================================================================
  // NHÓM READ-ONLY (ITC068..ITC069) - DÙNG CHUNG BỘ 4 SINH VIÊN ĐỂ TỐI ƯU TỐC ĐỘ
  // ==========================================================================

  test.describe('View and Filter Assigned Outlines - Multi-status Dataset (ITC068..ITC069)', () => {
    let multiStatusReviewer: TeacherHandle;

    test.beforeAll(async ({ request }) => {
      multiStatusReviewer = await createFreshIsolatedReviewer(request, 'M');
      await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống quản lý đồ án tốt nghiệp thông minh',
          reviewer: multiStatusReviewer,
          submissions: [{ submissionNote: 'Bản nộp lần 1' }],
        },
        {
          profile: TEST_STUDENT_2,
          topicName: 'Hệ thống quản lý thư viện số ứng dụng AI',
          reviewer: multiStatusReviewer,
          submissions: [
            {
              submissionNote: 'Bản nộp cần chỉnh sửa',
              advisorFeedback: 'Em cần làm rõ phạm vi hệ thống',
              reviewDecision: 'REQUEST_CHANGES',
              reviewFeedback: 'Cần bổ sung sơ đồ kiến trúc tổng thể',
            },
          ],
        },
        {
          profile: TEST_STUDENT_3,
          topicName: 'Ứng dụng theo dõi tiến độ học tập trực tuyến',
          reviewer: multiStatusReviewer,
          submissions: [
            {
              submissionNote: 'Bản nộp đạt yêu cầu',
              reviewDecision: 'APPROVED',
              reviewFeedback: 'Đề cương đạt yêu cầu',
            },
          ],
        },
        {
          profile: TEST_STUDENT_4,
          topicName: 'Hệ thống gợi ý việc làm sinh viên CNTT',
          reviewer: multiStatusReviewer,
          submissions: [
            {
              submissionNote: 'Bản nộp không đạt',
              reviewDecision: 'REJECTED',
              reviewFeedback: 'Nội dung chưa đáp ứng yêu cầu',
            },
          ],
        },
      ]);
    });

    test.afterAll(async ({ request }) => {
      await cleanupActiveStudents(request);
      await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'OPEN');
    });

    test(ITC068.title, { annotation: ITC068.annotation }, async ({ page, context }) => {
      const { deadlineRes, reviewListRes } = await openReviewerOutlineTab(
        page,
        context,
        multiStatusReviewer.token,
      );

      expect(deadlineRes.status()).toBe(200);
      const deadlineBody = await deadlineRes.json();
      expect(deadlineBody.code).toBe(1000);
      const dlItem = (deadlineBody.data?.giaoNhanDeadlines ?? []).find(
        (d: any) => d.code === 'SV_CHINH_SUA_NOP_LAI_DE_CUONG',
      );
      expect(dlItem?.status).toBe('IN_PROGRESS');

      expect(reviewListRes.status()).toBe(200);
      const listBody = await reviewListRes.json();
      expect(listBody.code).toBe(1000);
      expect(listBody.data).toHaveLength(4);
      for (const item of listBody.data) {
        expect(item.canReview).toBe(true);
      }

      // Kiểm tra badge số lượng GVNX và mốc thời hạn đang mở
      await expect(page.locator('#roleCountReviewer')).toHaveText('4');
      await expect(page.getByText('(Đang mở)')).toBeVisible();

      const statusTabs = page.locator('#statusTabs');
      await expect(statusTabs.locator('button[data-status="PENDING"] .tab-badge')).toHaveText('1');
      await expect(statusTabs.locator('button[data-status="APPROVED"] .tab-badge')).toHaveText('1');
      await expect(statusTabs.locator('button[data-status="REQUEST_CHANGES"] .tab-badge')).toHaveText('1');
      await expect(statusTabs.locator('button[data-status="REJECTED"] .tab-badge')).toHaveText('1');
      await expect(statusTabs.locator('button[data-status=""] .tab-badge')).toHaveText('4');
      await expect(statusTabs.locator('button[data-status="PENDING"]')).toHaveAttribute('data-active', 'true');

      // Kiểm tra dòng sinh viên ở tab Chờ duyệt
      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(row1).toBeVisible();
      await expect(row1).toContainText(TEST_STUDENT_1.fullName);
      await expect(row1).toContainText(`GVHD: ${TEST_MAIN_SUPERVISOR.fullName}`);
      await expect(row1.getByRole('button', { name: 'Duyệt', exact: true })).toBeEnabled();
      await expect(row1.getByRole('button', { name: 'Yêu cầu sửa', exact: true })).toBeEnabled();

      // Đối chiếu DB bằng SELECT
      const dbRows = await dbSelect<{ status: string; total: number }>(
        `SELECT o.status, COUNT(*) AS total
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
          WHERE o.commenting_lecture_id = ? AND tt.semester_id = ?
          GROUP BY o.status`,
        [multiStatusReviewer.id, envState.semesterId],
      );
      const countByStatus = Object.fromEntries(dbRows.map((r) => [r.status, Number(r.total)]));
      expect(countByStatus.PENDING).toBe(1);
      expect(countByStatus.REQUEST_CHANGES).toBe(1);
      expect(countByStatus.APPROVED).toBe(1);
      expect(countByStatus.REJECTED).toBe(1);
    });

    test(ITC069.title, { annotation: ITC069.annotation }, async ({ page, context }) => {
      const { reviewListRes } = await openReviewerOutlineTab(page, context, multiStatusReviewer.token);
      expect(reviewListRes.status()).toBe(200);
      expect((await reviewListRes.json()).data).toHaveLength(4);

      const statusTabs = page.locator('#statusTabs');

      await statusTabs.locator('button[data-status="REQUEST_CHANGES"]').click();
      const row2 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) });
      await expect(row2).toBeVisible();
      await expect(row2).toContainText('Cần bổ sung sơ đồ kiến trúc tổng thể');
      await expect(row2).toContainText('Em cần làm rõ phạm vi hệ thống');
      await expect(row2.getByRole('button', { name: 'Duyệt', exact: true })).toHaveCount(0);
      await expect(row2.getByRole('button', { name: 'Yêu cầu sửa', exact: true })).toHaveCount(0);

      await statusTabs.locator('button[data-status="APPROVED"]').click();
      const row3 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_3.studentCode) });
      await expect(row3).toBeVisible();
      await expect(row3.getByRole('button', { name: 'Duyệt', exact: true })).toHaveCount(0);

      await statusTabs.locator('button[data-status="REJECTED"]').click();
      const row4 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_4.studentCode) });
      await expect(row4).toBeVisible();
      await expect(row4.getByRole('button', { name: 'Duyệt', exact: true })).toHaveCount(0);

      await statusTabs.locator('button[data-status=""]').click();
      const searchBox = page.getByPlaceholder('Tìm theo mã sinh viên, tên hoặc đề tài...');
      await searchBox.fill(TEST_STUDENT_2.studentCode);

      await expect(page.locator('#tableBody tr')).toHaveCount(1);
      await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) })).toBeVisible();

      await searchBox.fill('KHONGTONTAI9999');
      await expect(page.getByText('Không tìm thấy đề cương nào trong mục này.')).toBeVisible();
    });
  });

  // ==========================================================================
  // NHÓM ĐỘC LẬP TỪNG TEST (ITC070..ITC085 & TC-SEC-031..TC-SEC-036)
  // ==========================================================================

  test.describe('Deadlines, History/Preview Gate, Review Mutations, and Security (ITC070..ITC085, TC-SEC-031..TC-SEC-036)', () => {
    test.afterEach(async ({ request }) => {
      await cleanupActiveStudents(request);
      await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'OPEN');
    });

    test(ITC070.title, { annotation: ITC070.annotation }, async ({ page, context, request }) => {
      await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống kiểm thử khóa thẩm định khi hết hạn',
          submissions: [{ submissionNote: 'Bản nộp trước khi hết hạn' }],
        },
      ]);

      await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'CLOSED');

      const { deadlineRes, reviewListRes } = await openReviewerOutlineTab(
        page,
        context,
        envState.primaryReviewer.token,
      );
      expect(deadlineRes.status()).toBe(200);
      const dlBody = await deadlineRes.json();
      const dlItem = (dlBody.data?.giaoNhanDeadlines ?? []).find(
        (d: any) => d.code === 'SV_CHINH_SUA_NOP_LAI_DE_CUONG',
      );
      expect(dlItem?.status).toBe('COMPLETED');

      expect(reviewListRes.status()).toBe(200);
      expect((await reviewListRes.json()).data).toHaveLength(1);

      await expect(page.getByText(/Đã hết hạn \(/)).toBeVisible();
      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(row1).toContainText('Đã hết hạn thẩm định');
      await expect(row1.getByRole('button', { name: 'Duyệt', exact: true })).toHaveCount(0);
      await expect(row1.getByRole('button', { name: 'Yêu cầu sửa', exact: true })).toHaveCount(0);
    });

    test(ITC071.title, { annotation: ITC071.annotation }, async ({ page, context, request }) => {
      await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống kiểm thử khóa thẩm định khi chưa mở hạn',
          submissions: [{ submissionNote: 'Bản nộp chờ mở hạn' }],
        },
      ]);

      await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'NOT_STARTED');

      const { deadlineRes, reviewListRes } = await openReviewerOutlineTab(
        page,
        context,
        envState.primaryReviewer.token,
      );
      expect(deadlineRes.status()).toBe(200);
      const dlBody = await deadlineRes.json();
      const dlItem = (dlBody.data?.giaoNhanDeadlines ?? []).find(
        (d: any) => d.code === 'SV_CHINH_SUA_NOP_LAI_DE_CUONG',
      );
      expect(dlItem?.status).toBe('NOT_STARTED');

      expect(reviewListRes.status()).toBe(200);
      expect((await reviewListRes.json()).data).toHaveLength(1);

      await expect(page.getByText(/Chưa mở/)).toBeVisible();
      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(row1).toContainText('Không thể thao tác');
      await expect(row1.getByRole('button', { name: 'Duyệt', exact: true })).toHaveCount(0);
      await expect(row1.getByRole('button', { name: 'Yêu cầu sửa', exact: true })).toHaveCount(0);
    });

    test(ITC072.title, { annotation: ITC072.annotation }, async ({ page, context, request }) => {
      const [s2] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_2,
          topicName: 'Hệ thống quản lý thư viện số ứng dụng AI',
          submissions: [
            {
              submissionNote: 'Bản nộp lần 1',
              advisorFeedback: 'Bổ sung mô hình dữ liệu ở bản 1',
              reviewDecision: 'REQUEST_CHANGES',
              reviewFeedback: 'Cần bổ sung sơ đồ kiến trúc hệ thống',
            },
            {
              submissionNote: 'Bản nộp lần 2 sau chỉnh sửa',
            },
          ],
        },
      ]);

      await openReviewerOutlineTab(page, context, envState.primaryReviewer.token);

      const detailPromise = page.waitForResponse(
        (r) => r.url().includes(`/outline/${s2.outlinePublicId}`) && r.request().method() === 'GET',
      );
      const row2 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) });
      await row2.getByRole('button', { name: 'Lịch sử', exact: true }).click();
      const detailRes = await detailPromise;

      expect(detailRes.status()).toBe(200);
      const detailBody = await detailRes.json();
      expect(detailBody.code).toBe(1000);
      expect(detailBody.data.canReview).toBe(true);
      expect(detailBody.data.histories).toHaveLength(2);
      expect(detailBody.data.histories[0].status).toBe('PENDING');
      expect(detailBody.data.histories[1].status).toBe('REQUEST_CHANGES');
      expect(detailBody.data.histories[1].reviewFeedback).toBe('Cần bổ sung sơ đồ kiến trúc hệ thống');
      expect(detailBody.data.histories[1].advisorFeedback).toBe('Bổ sung mô hình dữ liệu ở bản 1');

      const modal = page.locator('#submissionHistoryModal');
      await expect(modal).toBeVisible();
      await expect(modal.locator('#histModalStudentName')).toContainText(
        `Lịch sử các lần nộp đề cương — ${TEST_STUDENT_2.fullName} (${TEST_STUDENT_2.studentCode})`,
      );
      const histRows = modal.locator('#histModalTableBody tr');
      await expect(histRows).toHaveCount(2);
      await expect(histRows.nth(0)).toContainText('Lần 2');
      await expect(histRows.nth(0)).toContainText('Đã nộp, chờ nhận xét');
      await expect(histRows.nth(1)).toContainText('Lần 1');
      await expect(histRows.nth(1)).toContainText('Yêu cầu chỉnh sửa');
      await expect(histRows.nth(1)).toContainText('Cần bổ sung sơ đồ kiến trúc hệ thống');
      await expect(histRows.nth(1)).toContainText(`Bởi: ${TEST_PRIMARY_REVIEWER.fullName}`);
      await expect(histRows.nth(1)).toContainText('Bổ sung mô hình dữ liệu ở bản 1');
      await expect(histRows.nth(1)).toContainText(`Bởi: ${TEST_MAIN_SUPERVISOR.fullName}`);

      const dbRows = await dbSelect<{ total: number }>(
        `SELECT COUNT(*) AS total
           FROM thesis_outline_history h
           JOIN thesis_outline o ON o.id = h.thesis_outline_id
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_2.studentCode, envState.semesterId],
      );
      expect(Number(dbRows[0].total)).toBe(2);
    });

    test(ITC073.title, { annotation: ITC073.annotation }, async ({ page, context, request }) => {
      await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống phân tích dữ liệu học tập sinh viên',
          submissions: [{ submissionNote: 'Bản đề cương PDF cần mở khóa đọc trước' }],
        },
      ]);

      const { reviewListRes } = await openReviewerOutlineTab(
        page,
        context,
        envState.primaryReviewer.token,
      );
      expect(reviewListRes.status()).toBe(200);
      const listBody = await reviewListRes.json();
      expect(listBody.code).toBe(1000);
      expect(listBody.data[0].outlineFile).toBeTruthy();

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      // Bấm Duyệt khi chưa xem trước -> FE mở modal xem trước thay vì modal phê duyệt
      await row1.getByRole('button', { name: 'Duyệt', exact: true }).click();

      await expect(page.locator('#approveModal')).toHaveCount(0);
      const previewModal = page.locator('#outlineClassroomPreviewModal');
      await expect(previewModal).toBeVisible();
      await expect(previewModal).toContainText(`${TEST_STUDENT_1.fullName} (${TEST_STUDENT_1.studentCode})`);
      await expect(previewModal).toContainText(TEST_MAIN_SUPERVISOR.fullName);
      await expect(previewModal).toContainText(TEST_PRIMARY_REVIEWER.fullName);
      await expect(previewModal.locator('iframe')).toBeVisible();
      await expect(
        page.getByText(`Đã đọc đề cương của sinh viên ${TEST_STUDENT_1.fullName}!`),
      ).toBeVisible();

      // Đóng modal xem trước và bấm Duyệt lần 2 -> mở modal xác nhận phê duyệt
      await previewModal.getByRole('button', { name: 'Đóng xem trước' }).click();
      await expect(previewModal).toBeHidden();

      await row1.getByRole('button', { name: 'Duyệt', exact: true }).click();
      const approveModal = page.locator('#approveModal');
      await expect(approveModal).toBeVisible();
      await expect(approveModal).toContainText('Xác nhận phê duyệt đề cương');

      const dbRows = await dbSelect<{ outline_file: string | null; status: string }>(
        `SELECT o.outline_file, o.status
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows[0].outline_file).toBeTruthy();
      expect(dbRows[0].status).toBe('PENDING');
    });

    test(ITC074.title, { annotation: ITC074.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống quản lý đồ án tốt nghiệp thông minh',
          submissions: [{ submissionNote: 'Bản đề cương hoàn chỉnh' }],
        },
      ]);

      await openReviewerOutlineTab(page, context, envState.primaryReviewer.token);
      await unlockOutlineByPreview(page, TEST_STUDENT_1.studentCode);

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Duyệt', exact: true }).click();

      const modal = page.locator('#approveModal');
      await expect(modal).toBeVisible();
      const rawFeedback = '  Đề cương đạt yêu cầu, bố cục rõ ràng và mục tiêu khả thi.  ';
      const trimmedFeedback = rawFeedback.trim();
      await modal.locator('#approveFeedbackInput').fill(rawFeedback);

      const putPromise = page.waitForResponse(
        (r) => r.url().includes(`/outline/${s1.outlinePublicId}/review`) && r.request().method() === 'PUT',
      );
      await modal.locator('#btnConfirmApprove').click();
      const putRes = await putPromise;

      expect(putRes.status()).toBe(200);
      expect(putRes.request().postDataJSON()).toEqual({
        decision: 'APPROVED',
        feedback: trimmedFeedback,
      });
      const putBody = await putRes.json();
      expect(putBody.code).toBe(1000);
      expect(putBody.message).toBe('Thẩm định đề cương thành công');

      await expect(
        page.getByText(`Đã phê duyệt đề cương của sinh viên ${TEST_STUDENT_1.fullName} thành công!`),
      ).toBeVisible();
      await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) })).toHaveCount(0);

      // Chuyển sang tab Đã duyệt kiểm tra hiển thị
      await page.locator('#statusTabs button[data-status="APPROVED"]').click();
      const approvedRow = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(approvedRow).toBeVisible();
      await expect(approvedRow).toContainText('Đã duyệt');
      await expect(approvedRow).toContainText(trimmedFeedback);
      await expect(approvedRow.getByRole('button', { name: 'Duyệt', exact: true })).toHaveCount(0);

      // Đối chiếu DB: thesis_outline, thesis_outline_history, thesis_topic, notification
      const dbOutline = await dbSelect<{
        status: string;
        review_feedback: string | null;
        reviewed_at: string | null;
        current_stage: string;
        topic_status: string;
      }>(
        `SELECT o.status, o.review_feedback, o.reviewed_at, tt.current_stage, tt.status AS topic_status
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbOutline[0].status).toBe('APPROVED');
      expect(dbOutline[0].review_feedback).toBe(trimmedFeedback);
      expect(dbOutline[0].reviewed_at).not.toBeNull();
      expect(dbOutline[0].current_stage).toBe('STAGE_3_OUTLINE_APPROVED');
      expect(dbOutline[0].topic_status).toBe('IN_PROGRESS');

      const dbHist = await dbSelect<{
        status: string;
        review_feedback: string | null;
        reviewer_id: number | null;
      }>(
        `SELECT h.status, h.review_feedback, h.reviewer_id
           FROM thesis_outline_history h
           JOIN thesis_outline o ON o.id = h.thesis_outline_id
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?
          ORDER BY h.submitted_at DESC, h.id DESC
          LIMIT 1`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbHist[0].status).toBe('APPROVED');
      expect(dbHist[0].review_feedback).toBe(trimmedFeedback);
      expect(Number(dbHist[0].reviewer_id)).toBe(envState.primaryReviewer.id);

      const dbNoti = await dbSelect<{ content: string }>(
        `SELECT n.content
           FROM notification n
           JOIN account a ON a.id = n.account_id
           JOIN student s ON s.account_id = a.id
          WHERE s.student_code = ?
          ORDER BY n.id DESC
          LIMIT 5`,
        [TEST_STUDENT_1.studentCode],
      );
      expect(
        dbNoti.some(
          (n) =>
            n.content.includes('Đề cương của bạn đã được giảng viên nhận xét phê duyệt ĐẠT.') &&
            n.content.includes(trimmedFeedback),
        ),
      ).toBe(true);
    });

    test(ITC075.title, { annotation: ITC075.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống đặt lịch phòng thí nghiệm trực tuyến',
          submissions: [{ submissionNote: 'Bản nộp lần 1 chờ góp ý sửa' }],
        },
      ]);

      await openReviewerOutlineTab(page, context, envState.primaryReviewer.token);
      await unlockOutlineByPreview(page, TEST_STUDENT_1.studentCode);

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Yêu cầu sửa', exact: true }).click();

      const modal = page.locator('#rejectModal');
      await expect(modal).toBeVisible();
      await expect(modal.locator('input[name="reviewDecision"][value="REQUEST_CHANGES"]')).toBeChecked();
      await expect(modal.locator('input[name="reviewDecision"][value="REJECTED"]')).toBeDisabled();

      const rawFeedback = '  Cần bổ sung biểu đồ trình tự và phạm vi kiểm thử.  ';
      const trimmedFeedback = rawFeedback.trim();
      await modal.locator('#rejectFeedbackInput').fill(rawFeedback);

      const putPromise = page.waitForResponse(
        (r) => r.url().includes(`/outline/${s1.outlinePublicId}/review`) && r.request().method() === 'PUT',
      );
      await modal.locator('#btnConfirmReject').click();
      const putRes = await putPromise;

      expect(putRes.status()).toBe(200);
      expect(putRes.request().postDataJSON()).toEqual({
        decision: 'REQUEST_CHANGES',
        feedback: trimmedFeedback,
      });
      const putBody = await putRes.json();
      expect(putBody.code).toBe(1000);
      expect(putBody.message).toBe('Thẩm định đề cương thành công');

      await expect(
        page.getByText(`Đã gửi yêu cầu chỉnh sửa đề cương cho sinh viên ${TEST_STUDENT_1.fullName}!`),
      ).toBeVisible();
      await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) })).toHaveCount(0);

      await page.locator('#statusTabs button[data-status="REQUEST_CHANGES"]').click();
      const changesRow = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(changesRow).toBeVisible();
      await expect(changesRow).toContainText(trimmedFeedback);
      await expect(changesRow.getByRole('button', { name: 'Duyệt', exact: true })).toHaveCount(0);
      await expect(changesRow.getByRole('button', { name: 'Yêu cầu sửa', exact: true })).toHaveCount(0);

      const dbOutline = await dbSelect<{
        status: string;
        review_feedback: string | null;
        current_stage: string;
        topic_status: string;
      }>(
        `SELECT o.status, o.review_feedback, tt.current_stage, tt.status AS topic_status
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbOutline[0].status).toBe('REQUEST_CHANGES');
      expect(dbOutline[0].review_feedback).toBe(trimmedFeedback);
      expect(dbOutline[0].current_stage).toBe('STAGE_2_TOPIC_CONFIRMED');
      expect(dbOutline[0].topic_status).toBe('IN_PROGRESS');

      const dbHist = await dbSelect<{ status: string; review_feedback: string | null }>(
        `SELECT h.status, h.review_feedback
           FROM thesis_outline_history h
           JOIN thesis_outline o ON o.id = h.thesis_outline_id
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?
          ORDER BY h.submitted_at DESC, h.id DESC
          LIMIT 1`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbHist[0].status).toBe('REQUEST_CHANGES');
      expect(dbHist[0].review_feedback).toBe(trimmedFeedback);

      const dbNoti = await dbSelect<{ content: string }>(
        `SELECT n.content
           FROM notification n
           JOIN account a ON a.id = n.account_id
           JOIN student s ON s.account_id = a.id
          WHERE s.student_code = ?
          ORDER BY n.id DESC
          LIMIT 5`,
        [TEST_STUDENT_1.studentCode],
      );
      expect(
        dbNoti.some(
          (n) =>
            n.content.includes('Đề cương của bạn cần chỉnh sửa theo góp ý của giảng viên nhận xét.') &&
            n.content.includes(trimmedFeedback),
        ),
      ).toBe(true);
    });

    test(ITC076.title, { annotation: ITC076.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống kiểm thử duyệt đạt trong đợt gia hạn chấm',
          submissions: [{ submissionNote: 'Bản nộp chờ chấm gia hạn' }],
        },
      ]);

      await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'EXTENDED');

      const { deadlineRes } = await openReviewerOutlineTab(
        page,
        context,
        envState.primaryReviewer.token,
      );
      expect(deadlineRes.status()).toBe(200);
      const dlBody = await deadlineRes.json();
      const dlItem = (dlBody.data?.giaoNhanDeadlines ?? []).find(
        (d: any) => d.code === 'SV_CHINH_SUA_NOP_LAI_DE_CUONG',
      );
      expect(dlItem?.status).toBe('EXTENDED');
      await expect(page.getByText(/Đã hết hạn nộp — Đang gia hạn chấm đến/)).toBeVisible();

      await unlockOutlineByPreview(page, TEST_STUDENT_1.studentCode);
      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Duyệt', exact: true }).click();

      const modal = page.locator('#approveModal');
      const feedbackText = 'Đề cương đạt yêu cầu trong thời gian gia hạn chấm.';
      await modal.locator('#approveFeedbackInput').fill(feedbackText);

      const putPromise = page.waitForResponse(
        (r) => r.url().includes(`/outline/${s1.outlinePublicId}/review`) && r.request().method() === 'PUT',
      );
      await modal.locator('#btnConfirmApprove').click();
      const putRes = await putPromise;

      expect(putRes.status()).toBe(200);
      const putBody = await putRes.json();
      expect(putBody.code).toBe(1000);
      expect(putBody.message).toBe('Thẩm định đề cương thành công');

      await expect(
        page.getByText(`Đã phê duyệt đề cương của sinh viên ${TEST_STUDENT_1.fullName} thành công!`),
      ).toBeVisible();
      await page.locator('#statusTabs button[data-status="APPROVED"]').click();
      await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) })).toBeVisible();

      const dbOutline = await dbSelect<{
        status: string;
        review_feedback: string | null;
        current_stage: string;
      }>(
        `SELECT o.status, o.review_feedback, tt.current_stage
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbOutline[0].status).toBe('APPROVED');
      expect(dbOutline[0].review_feedback).toBe(feedbackText);
      expect(dbOutline[0].current_stage).toBe('STAGE_3_OUTLINE_APPROVED');
    });

    test(ITC077.title, { annotation: ITC077.annotation }, async ({ page, context, request }) => {
      // Dùng GVNX cô lập riêng vì đề tài sẽ chuyển sang DISQUALIFIED
      const rejectReviewer = await createFreshIsolatedReviewer(request, 'R');
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống kiểm thử đánh giá không đạt khi gia hạn chấm',
          reviewer: rejectReviewer,
          submissions: [{ submissionNote: 'Bản nộp đánh giá trong đợt gia hạn' }],
        },
      ]);

      await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'EXTENDED');

      await openReviewerOutlineTab(page, context, rejectReviewer.token);
      await unlockOutlineByPreview(page, TEST_STUDENT_1.studentCode);

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Yêu cầu sửa', exact: true }).click();

      const modal = page.locator('#rejectModal');
      await expect(modal).toBeVisible();
      await expect(modal).toContainText('Đánh giá Không đạt đề cương');
      await expect(modal.locator('input[name="reviewDecision"][value="REJECTED"]')).toBeChecked();
      await expect(modal.locator('input[name="reviewDecision"][value="REQUEST_CHANGES"]')).toBeDisabled();

      const feedbackText = 'Đề cương thiếu phương pháp nghiên cứu và chưa đáp ứng chuẩn đồ án.';
      await modal.locator('#rejectFeedbackInput').fill(feedbackText);

      const putPromise = page.waitForResponse(
        (r) => r.url().includes(`/outline/${s1.outlinePublicId}/review`) && r.request().method() === 'PUT',
      );
      await modal.locator('#btnConfirmReject').click();
      const putRes = await putPromise;
      s1.isDisqualified = true;

      expect(putRes.status()).toBe(200);
      expect(putRes.request().postDataJSON()).toEqual({
        decision: 'REJECTED',
        feedback: feedbackText,
      });
      const putBody = await putRes.json();
      expect(putBody.code).toBe(1000);
      expect(putBody.message).toBe('Thẩm định đề cương thành công');

      await expect(
        page.getByText(`Đã đánh giá Không đạt đề cương của sinh viên ${TEST_STUDENT_1.fullName}!`),
      ).toBeVisible();
      await page.locator('#statusTabs button[data-status="REJECTED"]').click();
      const rejectedRow = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(rejectedRow).toBeVisible();
      await expect(rejectedRow).toContainText(feedbackText);

      const dbOutline = await dbSelect<{
        status: string;
        review_feedback: string | null;
        topic_status: string;
        disqualification_reason: string | null;
      }>(
        `SELECT o.status, o.review_feedback, tt.status AS topic_status, tt.disqualification_reason
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbOutline[0].status).toBe('REJECTED');
      expect(dbOutline[0].review_feedback).toBe(feedbackText);
      expect(dbOutline[0].topic_status).toBe('DISQUALIFIED');
      expect(dbOutline[0].disqualification_reason).toBe('Không hoàn thành phê duyệt đề cương đúng hạn');

      const dbHist = await dbSelect<{ status: string; review_feedback: string | null }>(
        `SELECT h.status, h.review_feedback
           FROM thesis_outline_history h
           JOIN thesis_outline o ON o.id = h.thesis_outline_id
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?
          ORDER BY h.submitted_at DESC, h.id DESC
          LIMIT 1`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbHist[0].status).toBe('REJECTED');
      expect(dbHist[0].review_feedback).toBe(feedbackText);

      const dbNoti = await dbSelect<{ content: string }>(
        `SELECT n.content
           FROM notification n
           JOIN account a ON a.id = n.account_id
           JOIN student s ON s.account_id = a.id
          WHERE s.student_code = ?
          ORDER BY n.id DESC
          LIMIT 5`,
        [TEST_STUDENT_1.studentCode],
      );
      expect(
        dbNoti.some(
          (n) =>
            n.content.includes(
              'Đề cương của bạn không đạt trong đợt gia hạn chấm. Đồ án đã bị đình chỉ trong học kỳ này.',
            ) && n.content.includes(feedbackText),
        ),
      ).toBe(true);
    });

    test(ITC078.title, { annotation: ITC078.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống gợi ý đề tài ban đầu',
          pendingTitleChangeName: 'Hệ thống gợi ý đề tài đồ án nâng cao',
          submissions: [{ submissionNote: 'Bản nộp khi đang có yêu cầu đổi tên chờ duyệt' }],
        },
      ]);

      await openReviewerOutlineTab(page, context, envState.primaryReviewer.token);
      await unlockOutlineByPreview(page, TEST_STUDENT_1.studentCode);

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Duyệt', exact: true }).click();

      const modal = page.locator('#approveModal');
      await modal.locator('#approveFeedbackInput').fill('Đề cương đạt yêu cầu nhưng tên đề tài đang chờ duyệt đổi.');

      const putPromise = page.waitForResponse(
        (r) => r.url().includes(`/outline/${s1.outlinePublicId}/review`) && r.request().method() === 'PUT',
      );
      await modal.locator('#btnConfirmApprove').click();
      const putRes = await putPromise;

      expect(putRes.status()).toBe(409);
      const putBody = await putRes.json();
      expect(putBody.code).toBe(3100);
      expect(putBody.message).toBe('Tên đề tài chưa được GVHD xác nhận, chưa thể duyệt đạt đề cương');

      await expect(
        page.getByText('Tên đề tài chưa được GVHD xác nhận. Chưa thể duyệt đạt đề cương!'),
      ).toBeVisible();

      const dbOutline = await dbSelect<{
        status: string;
        review_feedback: string | null;
        current_stage: string;
      }>(
        `SELECT o.status, o.review_feedback, tt.current_stage
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbOutline[0].status).toBe('PENDING');
      expect(dbOutline[0].review_feedback).toBeNull();
      expect(dbOutline[0].current_stage).toBe('STAGE_2_TOPIC_CONFIRMED');
    });

    test(ITC079.title, { annotation: ITC079.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống kiểm thử validate rỗng khi duyệt đề cương',
          submissions: [{ submissionNote: 'Bản nộp kiểm thử validate rỗng' }],
        },
      ]);

      await openReviewerOutlineTab(page, context, envState.primaryReviewer.token);
      await unlockOutlineByPreview(page, TEST_STUDENT_1.studentCode);

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Duyệt', exact: true }).click();

      const modal = page.locator('#approveModal');
      await modal.locator('#approveFeedbackInput').fill('     ');
      await modal.locator('#btnConfirmApprove').click();

      await expect(modal).toBeVisible();
      await expect(modal.getByText('Vui lòng nhập ý kiến nhận xét phê duyệt đề cương!')).toBeVisible();

      // Kiểm tra BE chặn payload chỉ chứa khoảng trắng
      const apiRes = await apiCall(
        request,
        envState.primaryReviewer.token,
        'PUT',
        `/outline/${s1.outlinePublicId}/review`,
        { data: { decision: 'APPROVED', feedback: '   ' } },
      );
      expect(apiRes.status).toBe(400);
      expect(apiRes.body.code).toBe(4000);
      expect(apiRes.body.message).toBe('Vui lòng nhập ý kiến nhận xét đề cương');

      const dbOutline = await dbSelect<{ status: string; review_feedback: string | null }>(
        `SELECT o.status, o.review_feedback
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbOutline[0].status).toBe('PENDING');
      expect(dbOutline[0].review_feedback).toBeNull();
    });

    test(ITC080.title, { annotation: ITC080.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống kiểm thử validate yêu cầu sửa đề cương',
          submissions: [{ submissionNote: 'Bản nộp kiểm thử validate yêu cầu sửa' }],
        },
      ]);

      await openReviewerOutlineTab(page, context, envState.primaryReviewer.token);
      await unlockOutlineByPreview(page, TEST_STUDENT_1.studentCode);

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Yêu cầu sửa', exact: true }).click();

      const modal = page.locator('#rejectModal');
      await modal.locator('#rejectFeedbackInput').fill('   ');
      await modal.locator('#btnConfirmReject').click();

      await expect(modal).toBeVisible();
      await expect(modal.locator('#rejectErrorMsg')).toHaveText(
        'Vui lòng nêu rõ lý do và nội dung cần chỉnh sửa!',
      );

      // Kiểm tra BE chặn payload thiếu decision
      const apiRes = await apiCall(
        request,
        envState.primaryReviewer.token,
        'PUT',
        `/outline/${s1.outlinePublicId}/review`,
        { data: { decision: null, feedback: 'Nhận xét kiểm thử thiếu quyết định' } },
      );
      expect(apiRes.status).toBe(400);
      expect(apiRes.body.code).toBe(4000);
      expect(apiRes.body.message).toBe('Vui lòng chọn kết quả thẩm định đề cương');

      const dbOutline = await dbSelect<{ status: string; review_feedback: string | null }>(
        `SELECT o.status, o.review_feedback
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbOutline[0].status).toBe('PENDING');
      expect(dbOutline[0].review_feedback).toBeNull();
    });

    test(ITC081.title, { annotation: ITC081.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống kiểm thử chặn REJECTED khi hạn đang mở nộp',
          submissions: [{ submissionNote: 'Bản nộp kiểm thử sai quyết định' }],
        },
      ]);

      // Mở modal ở trạng thái EXTENDED để radio REJECTED được chọn, sau đó chuyển hạn về OPEN
      await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'EXTENDED');
      await openReviewerOutlineTab(page, context, envState.primaryReviewer.token);
      await unlockOutlineByPreview(page, TEST_STUDENT_1.studentCode);

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Yêu cầu sửa', exact: true }).click();
      const modal = page.locator('#rejectModal');
      await expect(modal.locator('input[name="reviewDecision"][value="REJECTED"]')).toBeChecked();

      await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'OPEN');
      await modal.locator('#rejectFeedbackInput').fill('Thử gửi Không đạt trong thời gian nhận bài');

      const putPromise = page.waitForResponse(
        (r) => r.url().includes(`/outline/${s1.outlinePublicId}/review`) && r.request().method() === 'PUT',
      );
      await modal.locator('#btnConfirmReject').click();
      const putRes = await putPromise;

      expect(putRes.status()).toBe(400);
      const putBody = await putRes.json();
      expect(putBody.code).toBe(3087);
      expect(putBody.message).toBe(
        'Trong thời gian nhận bài chỉ được chọn Đạt (APPROVED) hoặc Yêu cầu chỉnh sửa (REQUEST_CHANGES)',
      );
      await expect(
        page.getByText('Trong thời gian nhận bài chỉ được chọn Đạt hoặc Yêu cầu chỉnh sửa!'),
      ).toBeVisible();

      const dbOutline = await dbSelect<{
        status: string;
        review_feedback: string | null;
        topic_status: string;
      }>(
        `SELECT o.status, o.review_feedback, tt.status AS topic_status
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbOutline[0].status).toBe('PENDING');
      expect(dbOutline[0].review_feedback).toBeNull();
      expect(dbOutline[0].topic_status).toBe('IN_PROGRESS');
    });

    test(ITC082.title, { annotation: ITC082.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống kiểm thử chặn REQUEST_CHANGES khi gia hạn chấm',
          submissions: [{ submissionNote: 'Bản nộp kiểm thử sai quyết định gia hạn' }],
        },
      ]);

      // Mở modal ở trạng thái OPEN để radio REQUEST_CHANGES được chọn, sau đó chuyển hạn sang EXTENDED
      await openReviewerOutlineTab(page, context, envState.primaryReviewer.token);
      await unlockOutlineByPreview(page, TEST_STUDENT_1.studentCode);

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Yêu cầu sửa', exact: true }).click();
      const modal = page.locator('#rejectModal');
      await expect(modal.locator('input[name="reviewDecision"][value="REQUEST_CHANGES"]')).toBeChecked();

      await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'EXTENDED');
      await modal.locator('#rejectFeedbackInput').fill('Thử gửi Yêu cầu sửa trong đợt gia hạn chấm');

      const putPromise = page.waitForResponse(
        (r) => r.url().includes(`/outline/${s1.outlinePublicId}/review`) && r.request().method() === 'PUT',
      );
      await modal.locator('#btnConfirmReject').click();
      const putRes = await putPromise;

      expect(putRes.status()).toBe(400);
      const putBody = await putRes.json();
      expect(putBody.code).toBe(3088);
      expect(putBody.message).toBe(
        'Trong thời gian gia hạn chấm chỉ được chọn Đạt (APPROVED) hoặc Không đạt (REJECTED)',
      );
      await expect(
        page.getByText('Trong thời gian gia hạn chấm chỉ được chọn Đạt hoặc Không đạt!'),
      ).toBeVisible();

      const dbOutline = await dbSelect<{ status: string; review_feedback: string | null }>(
        `SELECT o.status, o.review_feedback
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbOutline[0].status).toBe('PENDING');
      expect(dbOutline[0].review_feedback).toBeNull();
    });

    test(ITC083.title, { annotation: ITC083.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống kiểm thử đóng hạn trước khi xác nhận duyệt',
          submissions: [{ submissionNote: 'Bản nộp kiểm thử đóng hạn' }],
        },
      ]);

      await openReviewerOutlineTab(page, context, envState.primaryReviewer.token);
      await unlockOutlineByPreview(page, TEST_STUDENT_1.studentCode);

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Duyệt', exact: true }).click();
      const modal = page.locator('#approveModal');
      await expect(modal).toBeVisible();

      await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'CLOSED');
      await modal.locator('#approveFeedbackInput').fill('Duyệt sau khi hết hạn thẩm định');

      const putPromise = page.waitForResponse(
        (r) => r.url().includes(`/outline/${s1.outlinePublicId}/review`) && r.request().method() === 'PUT',
      );
      await modal.locator('#btnConfirmApprove').click();
      const putRes = await putPromise;

      expect(putRes.status()).toBe(403);
      const putBody = await putRes.json();
      expect(putBody.code).toBe(3086);
      expect(putBody.message).toBe(
        'Đã quá thời hạn giảng viên nhận xét đề cương, vui lòng liên hệ Trưởng bộ môn gia hạn',
      );
      await expect(
        page.getByText('Đã quá thời hạn thẩm định đề cương, vui lòng liên hệ Trưởng bộ môn gia hạn!'),
      ).toBeVisible();

      const dbOutline = await dbSelect<{ status: string; review_feedback: string | null }>(
        `SELECT o.status, o.review_feedback
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbOutline[0].status).toBe('PENDING');
      expect(dbOutline[0].review_feedback).toBeNull();
    });

    test(ITC084.title, { annotation: ITC084.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống kiểm thử hạn chưa mở trước khi xác nhận duyệt',
          submissions: [{ submissionNote: 'Bản nộp kiểm thử chưa mở hạn' }],
        },
      ]);

      await openReviewerOutlineTab(page, context, envState.primaryReviewer.token);
      await unlockOutlineByPreview(page, TEST_STUDENT_1.studentCode);

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Duyệt', exact: true }).click();
      const modal = page.locator('#approveModal');
      await expect(modal).toBeVisible();

      await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'NOT_STARTED');
      await modal.locator('#approveFeedbackInput').fill('Duyệt trước thời điểm mở hạn');

      const putPromise = page.waitForResponse(
        (r) => r.url().includes(`/outline/${s1.outlinePublicId}/review`) && r.request().method() === 'PUT',
      );
      await modal.locator('#btnConfirmApprove').click();
      const putRes = await putPromise;

      const expectedMsg = 'Thời hạn sinh viên nộp đề cương chưa mở hoặc đã kết thúc';
      expect(putRes.status()).toBe(403);
      const putBody = await putRes.json();
      expect(putBody.code).toBe(3085);
      expect(putBody.message).toBe(expectedMsg);
      await expect(page.getByText(expectedMsg)).toBeVisible();

      const dbOutline = await dbSelect<{ status: string; review_feedback: string | null }>(
        `SELECT o.status, o.review_feedback
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbOutline[0].status).toBe('PENDING');
      expect(dbOutline[0].review_feedback).toBeNull();
    });

    test(ITC085.title, { annotation: ITC085.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống kiểm thử đề cương không còn ở trạng thái chờ duyệt',
          submissions: [{ submissionNote: 'Bản nộp kiểm thử trạng thái không PENDING' }],
        },
      ]);

      await openReviewerOutlineTab(page, context, envState.primaryReviewer.token);
      await unlockOutlineByPreview(page, TEST_STUDENT_1.studentCode);

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Duyệt', exact: true }).click();
      const modal = page.locator('#approveModal');
      await expect(modal).toBeVisible();

      // Đề cương đã được chuyển sang REQUEST_CHANGES trước khi bấm Xác nhận duyệt
      const priorFeedback = 'Đã yêu cầu chỉnh sửa trước đó';
      const preReviewRes = await apiCall(
        request,
        envState.primaryReviewer.token,
        'PUT',
        `/outline/${s1.outlinePublicId}/review`,
        { data: { decision: 'REQUEST_CHANGES', feedback: priorFeedback } },
      );
      expect(preReviewRes.status).toBe(200);

      const putPromise = page.waitForResponse(
        (r) => r.url().includes(`/outline/${s1.outlinePublicId}/review`) && r.request().method() === 'PUT',
      );
      await modal.locator('#btnConfirmApprove').click();
      const putRes = await putPromise;

      const expectedMsg = 'Đề cương không ở trạng thái chờ thẩm định';
      expect(putRes.status()).toBe(409);
      const putBody = await putRes.json();
      expect(putBody.code).toBe(3083);
      expect(putBody.message).toBe(expectedMsg);
      await expect(page.getByText(expectedMsg)).toBeVisible();

      const dbOutline = await dbSelect<{ status: string; review_feedback: string | null }>(
        `SELECT o.status, o.review_feedback
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbOutline[0].status).toBe('REQUEST_CHANGES');
      expect(dbOutline[0].review_feedback).toBe(priorFeedback);
    });

    // ========================================================================
    // SECURITY TEST CASES (TC-SEC-031 .. TC-SEC-036)
    // ========================================================================

    test(SEC031.title, { annotation: SEC031.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Đề tài kiểm thử truy cập ẩn danh thẩm định đề cương',
          submissions: [{ submissionNote: 'Bản nộp kiểm thử ẩn danh' }],
        },
      ]);

      await context.clearCookies();
      const myInfoPromise = page.waitForResponse(
        (r) => r.url().includes('/my-info') && r.request().method() === 'GET',
      );
      await page.goto('/lecturer/outline-review');
      const myInfoRes = await myInfoPromise;

      expect(myInfoRes.status()).toBe(401);
      expect((await myInfoRes.json()).code).toBe(2000);
      await expect(page).toHaveURL(/\/login/);

      const listRes = await request.get(
        `${getApiBaseUrl()}/outline/review-list?semesterId=${envState.semesterPublicId}`,
      );
      expect(listRes.status()).toBe(401);
      expect((await listRes.json()).code).toBe(2000);

      const revRes = await request.put(`${getApiBaseUrl()}/outline/${s1.outlinePublicId}/review`, {
        headers: { 'Content-Type': 'application/json' },
        data: { decision: 'APPROVED', feedback: 'Duyệt ẩn danh' },
      });
      expect(revRes.status()).toBe(401);
      expect((await revRes.json()).code).toBe(2000);
    });

    test(SEC032.title, { annotation: SEC032.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Đề tài kiểm thử phân quyền sinh viên thẩm định',
          submissions: [{ submissionNote: 'Bản nộp kiểm thử phân quyền SV' }],
        },
      ]);

      await setAuthCookie(context, s1.studentToken);
      await page.goto('/lecturer/outline-review');
      await expect(
        page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.'),
      ).toBeVisible();

      const listRes = await apiCall(request, s1.studentToken, 'GET', '/outline/review-list', {
        params: { semesterId: envState.semesterPublicId },
      });
      expect(listRes.status).toBe(403);
      expect(listRes.body.code).toBe(2001);
      expect(listRes.body.message).toBe('Tài khoản hiện tại không phải là giảng viên');

      const revRes = await apiCall(
        request,
        s1.studentToken,
        'PUT',
        `/outline/${s1.outlinePublicId}/review`,
        { data: { decision: 'APPROVED', feedback: 'Sinh viên tự duyệt đề cương trái phép' } },
      );
      expect(revRes.status).toBe(403);
      expect(revRes.body.code).toBe(2001);
      expect(revRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');

      const dbOutline = await dbSelect<{ status: string }>(
        `SELECT o.status
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbOutline[0].status).toBe('PENDING');
    });

    test(SEC033.title, { annotation: SEC033.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Đề tài kiểm thử phân quyền giảng viên thường thẩm định',
          submissions: [{ submissionNote: 'Bản nộp kiểm thử phân quyền GV thường' }],
        },
      ]);

      await setAuthCookie(context, envState.plainLecturer.token);
      await page.goto('/lecturer/outline-review');
      await expect(
        page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.'),
      ).toBeVisible();

      const detailRes = await apiCall(
        request,
        envState.plainLecturer.token,
        'GET',
        `/outline/${s1.outlinePublicId}`,
      );
      expect(detailRes.status).toBe(403);
      expect(detailRes.body.code).toBe(2001);
      expect(detailRes.body.message).toBe('Bạn không có quyền truy cập thông tin đề cương này');

      const revRes = await apiCall(
        request,
        envState.plainLecturer.token,
        'PUT',
        `/outline/${s1.outlinePublicId}/review`,
        { data: { decision: 'APPROVED', feedback: 'Giảng viên thường duyệt trái phép' } },
      );
      expect(revRes.status).toBe(403);
      expect(revRes.body.code).toBe(2001);
      expect(revRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');

      const dbOutline = await dbSelect<{ status: string }>(
        `SELECT o.status
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbOutline[0].status).toBe('PENDING');
    });

    test(SEC034.title, { annotation: SEC034.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Đề tài kiểm thử token GVNX đã đăng xuất',
          submissions: [{ submissionNote: 'Bản nộp kiểm thử logout token' }],
        },
      ]);

      const freshToken = await loginByEmail(request, TEST_PRIMARY_REVIEWER.email);
      const logoutRes = await apiCall(request, freshToken, 'POST', '/log-out');
      expect(logoutRes.status).toBe(200);

      await setAuthCookie(context, freshToken);
      const myInfoPromise = page.waitForResponse(
        (r) => r.url().includes('/my-info') && r.request().method() === 'GET',
      );
      await page.goto('/lecturer/outline-review');
      const myInfoRes = await myInfoPromise;

      expect(myInfoRes.status()).toBe(401);
      expect((await myInfoRes.json()).code).toBe(2000);
      await expect(page).toHaveURL(/\/login/);

      const listRes = await apiCall(request, freshToken, 'GET', '/outline/review-list', {
        params: { semesterId: envState.semesterPublicId },
      });
      expect(listRes.status).toBe(401);
      expect(listRes.body.code).toBe(2000);

      const revRes = await apiCall(
        request,
        freshToken,
        'PUT',
        `/outline/${s1.outlinePublicId}/review`,
        { data: { decision: 'APPROVED', feedback: 'Duyệt với token đã đăng xuất' } },
      );
      expect(revRes.status).toBe(401);
      expect(revRes.body.code).toBe(2000);

      const dbOutline = await dbSelect<{ status: string }>(
        `SELECT o.status
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbOutline[0].status).toBe('PENDING');
    });

    test(SEC035.title, { annotation: SEC035.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Đề tài kiểm thử tách biệt quyền GVHD và GVNX (BR-05)',
          submissions: [{ submissionNote: 'Bản nộp kiểm thử BR-05' }],
        },
      ]);

      await openReviewerOutlineTab(page, context, envState.mainSupervisor.token);
      await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) })).toHaveCount(0);

      const revRes = await apiCall(
        request,
        envState.mainSupervisor.token,
        'PUT',
        `/outline/${s1.outlinePublicId}/review`,
        { data: { decision: 'APPROVED', feedback: 'GVHD tự duyệt đề cương sinh viên của mình' } },
      );
      expect(revRes.status).toBe(403);
      expect(revRes.body.code).toBe(2001);
      expect(revRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');

      const dbOutline = await dbSelect<{ status: string }>(
        `SELECT o.status
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbOutline[0].status).toBe('PENDING');
    });

    test(SEC036.title, { annotation: SEC036.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Đề tài gán cho Hoàng Thị Thu không cho Lê Hoàng Long duyệt',
          reviewer: envState.primaryReviewer,
          submissions: [{ submissionNote: 'Bản nộp kiểm thử IDOR GVNX' }],
        },
        {
          profile: TEST_STUDENT_5,
          topicName: 'Đề tài khác để Lê Hoàng Long giữ vai trò COMMENTING_LECTURER',
          reviewer: envState.otherReviewer,
          submissions: [{ submissionNote: 'Bản nộp phụ cho GVNX khác' }],
        },
      ]);

      await openReviewerOutlineTab(page, context, envState.otherReviewer.token);
      await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) })).toHaveCount(0);

      const detailRes = await apiCall(
        request,
        envState.otherReviewer.token,
        'GET',
        `/outline/${s1.outlinePublicId}`,
      );
      expect(detailRes.status).toBe(403);
      expect(detailRes.body.code).toBe(2001);
      expect(detailRes.body.message).toBe('Bạn không có quyền truy cập thông tin đề cương này');

      const revRes = await apiCall(
        request,
        envState.otherReviewer.token,
        'PUT',
        `/outline/${s1.outlinePublicId}/review`,
        { data: { decision: 'APPROVED', feedback: 'GVNX khác duyệt trái phép' } },
      );
      expect(revRes.status).toBe(403);
      expect(revRes.body.code).toBe(2001);
      expect(revRes.body.message).toBe(
        'Bạn không phải giảng viên nhận xét được phân công cho đề cương này',
      );

      const dbOutline = await dbSelect<{ status: string }>(
        `SELECT o.status
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbOutline[0].status).toBe('PENDING');
    });
  });
});
