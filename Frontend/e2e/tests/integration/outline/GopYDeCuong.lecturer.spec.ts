import { test, expect, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';
import { defineItc, defineItcSec } from '../../../support/integration-test-case';
import { apiCall, getApiBaseUrl, loginByEmail } from '../../../support/api';
import { dbSelect } from '../../../support/db';

// ============================================================================
// ĐẶC TẢ TEST CASE (ITC052..ITC067 & TC-SEC-025..TC-SEC-030)
// Feature: outline | Module/Sheet: GopYDeCuong
// Role: Giảng viên hướng dẫn (SUPERVISOR)
// ============================================================================

const ITC052 = defineItc({
  id: 'ITC052',
  feature: 'outline',
  module: 'GopYDeCuong',
  sheet: 'GopYDeCuong',
  fn: 'View and Filter Supervised Outlines',
  description:
    'Verify that a main supervisor can view supervised students\' outlines across all statuses with accurate tab counters and enabled feedback actions when the deadline is open',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Văn Hùng").\n' +
    '2. Open the "Duyệt đề cương" screen ("/lecturer/outline-review").',
  expected:
    '1. The API GET /api/v1/deadlines returns HTTP 200 with code = 1000 and an OPEN "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline.\n' +
    '2. The API GET /outline/supervisor-list returns HTTP 200 with code = 1000 and 4 outlines (1 PENDING, 1 REQUEST_CHANGES, 1 APPROVED, 1 REJECTED), all with canWriteAdvisorFeedback = true.\n' +
    '3. The database contains 4 thesis outline records for supervisor "GV999601" in the current semester (1 PENDING, 1 REQUEST_CHANGES, 1 APPROVED, 1 REJECTED).\n' +
    '4. The "Sinh viên đang hướng dẫn" tab badge shows 4, the open deadline banner displays "(Đang mở)", the "Chờ duyệt" tab is active displaying student "Trần Minh Quang" ("9990000601") with an enabled "Góp ý" button, and tab counters show "Chờ duyệt" = 1, "Đã duyệt" = 1, "Yêu cầu sửa" = 1, "Không đạt" = 1, and "Tất cả" = 4.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Main supervisor "Nguyễn Văn Hùng" ("GV999601") supervises 4 students with assigned commenting lecturer "Hoàng Thị Thu" ("GV999605"): "9990000601" (PENDING), "9990000602" (REQUEST_CHANGES with reviewer and supervisor feedback), "9990000603" (APPROVED), and "9990000604" (REJECTED).',
});

const ITC053 = defineItc({
  id: 'ITC053',
  feature: 'outline',
  module: 'GopYDeCuong',
  sheet: 'GopYDeCuong',
  fn: 'View and Filter Supervised Outlines',
  description:
    'Verify that a supervisor can switch status tabs, search by student code, and see the empty state for a non-matching keyword',
  procedure:
    '1. Log in as a main Supervisor and open the "Duyệt đề cương" screen ("/lecturer/outline-review").\n' +
    '2. Click the "Yêu cầu sửa" tab, then click the "Đã duyệt" tab, then click the "Không đạt" tab, and then click the "Tất cả" tab.\n' +
    '3. Enter "9990000602" into the "Tìm theo mã sinh viên, tên hoặc đề tài..." search box.\n' +
    '4. Replace the search keyword with "KHONGTONTAI9999".',
  expected:
    '1. The API GET /outline/supervisor-list returns HTTP 200 with code = 1000 and 4 supervised outlines for the current semester.\n' +
    '2. The "Yêu cầu sửa" tab displays student "Lê Thị Mai" ("9990000602") with reviewer feedback, supervisor feedback, and button "Sửa góp ý"; the "Đã duyệt" tab displays "Phạm Quốc Bảo" ("9990000603"); the "Không đạt" tab displays "Vũ Ngọc Ánh" ("9990000604").\n' +
    '3. Searching "9990000602" under "Tất cả" displays only student "Lê Thị Mai" ("9990000602").\n' +
    '4. Searching "KHONGTONTAI9999" displays empty state message "Không tìm thấy đề cương nào trong mục này.".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Main supervisor "GV999601" has 4 supervised outlines across PENDING ("9990000601"), REQUEST_CHANGES ("9990000602"), APPROVED ("9990000603"), and REJECTED ("9990000604").',
});

const ITC054 = defineItc({
  id: 'ITC054',
  feature: 'outline',
  module: 'GopYDeCuong',
  sheet: 'GopYDeCuong',
  fn: 'View and Filter Supervised Outlines',
  description:
    'Verify that a co-supervisor can view supervised students\' outlines in read-only mode without the feedback button',
  procedure:
    '1. Log in as a Co-Supervisor ("Đỗ Thị Lan").\n' +
    '2. Open the "Duyệt đề cương" screen ("/lecturer/outline-review").',
  expected:
    '1. The API GET /outline/supervisor-list returns HTTP 200 with code = 1000 and includes student "Trần Minh Quang" ("9990000601") with canWriteAdvisorFeedback = false.\n' +
    '2. The database confirms supervisor "GV999602" is assigned as the co-supervisor of student "9990000601"\'s thesis topic.\n' +
    '3. The row of student "Trần Minh Quang" displays badge "Đồng GVHD (Chỉ xem)" and an enabled "Lịch sử" button, with no "Góp ý" or "Sửa góp ý" button.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Trần Minh Quang" ("9990000601") has main supervisor "GV999601", co-supervisor "GV999602", and 1 PENDING submitted outline.',
});

const ITC055 = defineItc({
  id: 'ITC055',
  feature: 'outline',
  module: 'GopYDeCuong',
  sheet: 'GopYDeCuong',
  fn: 'View and Filter Supervised Outlines',
  description:
    'Verify that supervisor feedback is locked and a closed-deadline badge is displayed when the outline review deadline has closed',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Văn Hùng").\n' +
    '2. Open the "Duyệt đề cương" screen ("/lecturer/outline-review") after the outline review deadline has closed.',
  expected:
    '1. The API GET /api/v1/deadlines returns HTTP 200 with code = 1000 and the "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline in COMPLETED status.\n' +
    '2. The API GET /outline/supervisor-list returns HTTP 200 with code = 1000 and includes student "Trần Minh Quang"\'s PENDING outline.\n' +
    '3. The deadline banner displays "Đã hết hạn", and student "Trần Minh Quang"\'s row displays "Đã khóa góp ý" with no "Góp ý" button.',
  precondition:
    '1. An ongoing semester exists where the "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline is COMPLETED (past end date).\n' +
    '2. Main supervisor "GV999601" has a PENDING submitted outline from student "Trần Minh Quang" ("9990000601").',
});

const ITC056 = defineItc({
  id: 'ITC056',
  feature: 'outline',
  module: 'GopYDeCuong',
  sheet: 'GopYDeCuong',
  fn: 'View and Filter Supervised Outlines',
  description:
    'Verify that supervisor feedback is locked and a not-started deadline badge is displayed before the outline review period opens',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Văn Hùng").\n' +
    '2. Open the "Duyệt đề cương" screen ("/lecturer/outline-review") while the outline review deadline has not started yet.',
  expected:
    '1. The API GET /api/v1/deadlines returns HTTP 200 with code = 1000 and the "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline in NOT_STARTED status.\n' +
    '2. The API GET /outline/supervisor-list returns HTTP 200 with code = 1000 and includes student "Trần Minh Quang"\'s PENDING outline.\n' +
    '3. The deadline banner displays "Chưa mở", and student "Trần Minh Quang"\'s row displays "Đã khóa góp ý" with no "Góp ý" button.',
  precondition:
    '1. An ongoing semester exists where the "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline has a future start date (NOT_STARTED).\n' +
    '2. Main supervisor "GV999601" has a PENDING submitted outline from student "Trần Minh Quang" ("9990000601").',
});

const ITC057 = defineItc({
  id: 'ITC057',
  feature: 'outline',
  module: 'GopYDeCuong',
  sheet: 'GopYDeCuong',
  fn: 'View Outline Detail and Submission History',
  description:
    'Verify that a supervisor can open the submission history modal and view multiple outline submission versions with reviewer and supervisor feedback',
  procedure:
    '1. Log in as a main Supervisor and open the "Duyệt đề cương" screen ("/lecturer/outline-review").\n' +
    '2. Click the "Lịch sử" button on the row of student "Lê Thị Mai" ("9990000602").',
  expected:
    '1. The API GET /outline/{publicId} returns HTTP 200 with code = 1000 and 2 history records ordered newest first (version 2 in PENDING status followed by version 1 in REQUEST_CHANGES status with both reviewer and supervisor feedback).\n' +
    '2. The database contains 2 thesis outline history records for student "9990000602" in the current semester.\n' +
    '3. The modal "Lịch sử các lần nộp đề cương — Lê Thị Mai (9990000602)" displays "Lần 2" with badge "Đã nộp, chờ nhận xét" and "Lần 1" with badge "Yêu cầu chỉnh sửa", reviewer feedback "Cần bổ sung sơ đồ kiến trúc tổng thể" ("Bởi: Hoàng Thị Thu"), and supervisor feedback "Bổ sung sơ đồ phân rã chức năng ở bản 1" ("Bởi: Nguyễn Văn Hùng").',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Lê Thị Mai" ("9990000602") submitted version 1 (commented by GVHD and requested changes by GVNX) and resubmitted version 2 (PENDING).',
});

const ITC058 = defineItc({
  id: 'ITC058',
  feature: 'outline',
  module: 'GopYDeCuong',
  sheet: 'GopYDeCuong',
  fn: 'View Outline Detail and Submission History',
  description:
    'Verify that a supervisor can open the outline preview modal from the supervised outline table and view student metadata and existing advisor feedback',
  procedure:
    '1. Log in as a main Supervisor and open the "Duyệt đề cương" screen ("/lecturer/outline-review").\n' +
    '2. Click the outline file link on the row of student "Trần Minh Quang" ("9990000601").',
  expected:
    '1. The API GET /outline/supervisor-list returns HTTP 200 with code = 1000 including student "Trần Minh Quang"\'s outline file URL and existing supervisor feedback "Góp ý xem trước cho bản đề cương hiện tại".\n' +
    '2. The database confirms student "9990000601"\'s outline stores a non-empty file URL and the supervisor feedback.\n' +
    '3. The preview modal opens displaying student "Trần Minh Quang (9990000601)", supervisor "Nguyễn Văn Hùng", commenting lecturer "Hoàng Thị Thu", existing supervisor feedback "Góp ý xem trước cho bản đề cương hiện tại", a PDF preview iframe, and toast "Đã đọc đề cương của sinh viên Trần Minh Quang!".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Trần Minh Quang" ("9990000601") has a PENDING PDF outline with existing supervisor feedback "Góp ý xem trước cho bản đề cương hiện tại".',
});

const ITC059 = defineItc({
  id: 'ITC059',
  feature: 'outline',
  module: 'GopYDeCuong',
  sheet: 'GopYDeCuong',
  fn: 'Submit and Update Supervisor Feedback',
  description:
    'Verify that a main supervisor can submit initial feedback on a pending student outline when the deadline is open',
  procedure:
    '1. Log in as a main Supervisor and open the "Duyệt đề cương" screen ("/lecturer/outline-review").\n' +
    '2. Click "Góp ý" on the pending row of student "Trần Minh Quang" ("9990000601").\n' +
    '3. Enter "  Bố cục đề cương rõ ràng, em cần bổ sung thêm sơ đồ ERD chi tiết.  " into the feedback field and click "Lưu nhận xét".',
  expected:
    '1. The API PUT /outline/{publicId}/advisor-feedback with trimmed feedback returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Gửi nhận xét góp ý đề cương thành công".\n' +
    '3. The database updates thesis_outline.advisor_feedback and the latest thesis_outline_history.advisor_feedback to "Bố cục đề cương rõ ràng, em cần bổ sung thêm sơ đồ ERD chi tiết.", preserves outline status as PENDING and thesis stage as STAGE_2_TOPIC_CONFIRMED, and stores notification "GVHD đã nhận xét đề cương của bạn." for student "9990000601".\n' +
    '4. The UI shows toast "Đã gửi nhận xét góp ý cho sinh viên Trần Minh Quang thành công!", displays the feedback under "GÓP Ý CỦA GVHD", and changes the action button label to "Sửa góp ý".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Trần Minh Quang" ("9990000601") has a PENDING submitted outline with no supervisor feedback yet, supervised by "GV999601".',
});

const ITC060 = defineItc({
  id: 'ITC060',
  feature: 'outline',
  module: 'GopYDeCuong',
  sheet: 'GopYDeCuong',
  fn: 'Submit and Update Supervisor Feedback',
  description:
    'Verify that a main supervisor can edit existing supervisor feedback and sync the updated feedback to the latest submission history',
  procedure:
    '1. Log in as a main Supervisor and open the "Duyệt đề cương" screen ("/lecturer/outline-review").\n' +
    '2. Click "Sửa góp ý" on the row of student "Trần Minh Quang" ("9990000601").\n' +
    '3. Replace the pre-filled feedback with "Đã cập nhật góp ý: bổ sung phân tích yêu cầu phi chức năng và kế hoạch tuần." and click "Lưu nhận xét".',
  expected:
    '1. The modal pre-fills the existing feedback "Góp ý ban đầu về chương 1.".\n' +
    '2. The API PUT /outline/{publicId}/advisor-feedback returns HTTP 200 with code = 1000 and message "Gửi nhận xét góp ý đề cương thành công".\n' +
    '3. The database overwrites advisor_feedback on both the outline and its latest submission history record with "Đã cập nhật góp ý: bổ sung phân tích yêu cầu phi chức năng và kế hoạch tuần." and records a new student notification.\n' +
    '4. The UI shows toast "Đã gửi nhận xét góp ý cho sinh viên Trần Minh Quang thành công!" and displays the updated feedback text in the row.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Trần Minh Quang" ("9990000601") has a PENDING submitted outline with existing supervisor feedback "Góp ý ban đầu về chương 1.".',
});

const ITC061 = defineItc({
  id: 'ITC061',
  feature: 'outline',
  module: 'GopYDeCuong',
  sheet: 'GopYDeCuong',
  fn: 'Submit and Update Supervisor Feedback',
  description:
    'Verify that a main supervisor can submit feedback on an outline in REQUEST_CHANGES status while viewing the commenting lecturer\'s review feedback',
  procedure:
    '1. Log in as a main Supervisor and open the "Duyệt đề cương" screen ("/lecturer/outline-review").\n' +
    '2. Click the "Yêu cầu sửa" tab and click "Góp ý" on student "Lê Thị Mai" ("9990000602")\'s row.\n' +
    '3. Verify the commenting lecturer\'s review feedback is displayed in the modal, enter "Em sửa theo góp ý của GVNX và bổ sung thêm đặc tả API.", and click "Lưu nhận xét".',
  expected:
    '1. The feedback modal displays the commenting lecturer\'s feedback "Cần bổ sung sơ đồ kiến trúc tổng thể".\n' +
    '2. The API PUT /outline/{publicId}/advisor-feedback returns HTTP 200 with code = 1000 and message "Gửi nhận xét góp ý đề cương thành công".\n' +
    '3. The database updates advisor_feedback on the outline and latest history record while preserving status = REQUEST_CHANGES and review_feedback = "Cần bổ sung sơ đồ kiến trúc tổng thể".\n' +
    '4. The UI shows toast "Đã gửi nhận xét góp ý cho sinh viên Lê Thị Mai thành công!" and displays the new supervisor feedback in the "Yêu cầu sửa" tab.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Lê Thị Mai" ("9990000602") has an outline in REQUEST_CHANGES status with reviewer feedback "Cần bổ sung sơ đồ kiến trúc tổng thể" and no supervisor feedback yet.',
});

const ITC062 = defineItc({
  id: 'ITC062',
  feature: 'outline',
  module: 'GopYDeCuong',
  sheet: 'GopYDeCuong',
  fn: 'Submit and Update Supervisor Feedback',
  description:
    'Verify that a main supervisor can submit feedback on a student outline during the extended grading period',
  procedure:
    '1. Log in as a main Supervisor and open the "Duyệt đề cương" screen ("/lecturer/outline-review") while the outline deadline is in EXTENDED status.\n' +
    '2. Click "Góp ý" on student "Trần Minh Quang" ("9990000601")\'s row.\n' +
    '3. Enter "Góp ý bổ sung trong thời gian gia hạn chấm." and click "Lưu nhận xét".',
  expected:
    '1. The API GET /api/v1/deadlines returns HTTP 200 with code = 1000 and status EXTENDED; the deadline banner displays "Đã hết hạn nộp — Đang gia hạn chấm đến".\n' +
    '2. The API PUT /outline/{publicId}/advisor-feedback returns HTTP 200 with code = 1000 and message "Gửi nhận xét góp ý đề cương thành công".\n' +
    '3. The database updates advisor_feedback on the outline and latest history record to "Góp ý bổ sung trong thời gian gia hạn chấm." and creates a student notification.\n' +
    '4. The UI shows toast "Đã gửi nhận xét góp ý cho sinh viên Trần Minh Quang thành công!" and displays the feedback in the row.',
  precondition:
    '1. An ongoing semester exists where the "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline is in EXTENDED status within its allowed date range.\n' +
    '2. Student "Trần Minh Quang" ("9990000601") has a PENDING submitted outline supervised by "GV999601".',
});

const ITC063 = defineItc({
  id: 'ITC063',
  feature: 'outline',
  module: 'GopYDeCuong',
  sheet: 'GopYDeCuong',
  fn: 'Submit and Update Supervisor Feedback',
  description:
    'Verify that submitting blank or whitespace-only supervisor feedback is blocked by client-side validation and rejected by the backend API',
  procedure:
    '1. Log in as a main Supervisor and open the "Duyệt đề cương" screen ("/lecturer/outline-review").\n' +
    '2. Click "Góp ý" on student "Trần Minh Quang" ("9990000601")\'s row.\n' +
    '3. Enter only spaces "     " into the feedback field and click "Lưu nhận xét".\n' +
    '4. Verify the backend API rejects a whitespace-only feedback payload on PUT /outline/{publicId}/advisor-feedback.',
  expected:
    '1. The UI blocks submission on the client side, keeps the feedback modal open, and displays inline validation message "Vui lòng nhập nội dung góp ý đề cương!".\n' +
    '2. Direct API PUT /outline/{publicId}/advisor-feedback with whitespace-only feedback returns HTTP 400 with code = 4000 and message "Vui lòng nhập ý kiến nhận xét đề cương".\n' +
    '3. The database keeps advisor_feedback as NULL on both the outline and its latest submission history record.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Trần Minh Quang" ("9990000601") has a PENDING submitted outline with no supervisor feedback yet.',
});

const ITC064 = defineItc({
  id: 'ITC064',
  feature: 'outline',
  module: 'GopYDeCuong',
  sheet: 'GopYDeCuong',
  fn: 'Submit and Update Supervisor Feedback',
  description:
    'Verify that submitting supervisor feedback for a student who has not uploaded an outline file yet is blocked with a conflict error',
  procedure:
    '1. Log in as a main Supervisor and open the "Duyệt đề cương" screen ("/lecturer/outline-review").\n' +
    '2. Click the "Tất cả" tab and locate student "Trần Minh Quang" ("9990000601") with badge "Chưa nộp".\n' +
    '3. Click "Góp ý", enter "Góp ý khi sinh viên chưa nộp file", and click "Lưu nhận xét".',
  expected:
    '1. The API PUT /outline/{publicId}/advisor-feedback returns HTTP 409 with code = 3082.\n' +
    '2. The response message is "Sinh viên chưa nộp file đề cương".\n' +
    '3. The database keeps advisor_feedback as NULL and status as NULL for student "9990000601"\'s outline.\n' +
    '4. The UI displays error toast "Sinh viên chưa nộp file đề cương".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Trần Minh Quang" ("9990000601") has an assigned commenting lecturer (outline record exists) but has not uploaded any outline file yet.',
});

const ITC065 = defineItc({
  id: 'ITC065',
  feature: 'outline',
  module: 'GopYDeCuong',
  sheet: 'GopYDeCuong',
  fn: 'Submit and Update Supervisor Feedback',
  description:
    'Verify that submitting supervisor feedback on a disqualified thesis outline (REJECTED) is blocked because the thesis topic is no longer in progress',
  procedure:
    '1. Log in as a main Supervisor and open the "Duyệt đề cương" screen ("/lecturer/outline-review").\n' +
    '2. Click the "Không đạt" tab and click "Góp ý" on student "Vũ Ngọc Ánh" ("9990000604")\'s row.\n' +
    '3. Enter "Góp ý cho đề tài đã bị đình chỉ" and click "Lưu nhận xét".',
  expected:
    '1. The API PUT /outline/{publicId}/advisor-feedback returns HTTP 409 with code = 3057.\n' +
    '2. The response message is "Đề tài không ở trạng thái đang thực hiện".\n' +
    '3. The database keeps advisor_feedback as NULL and thesis topic status as DISQUALIFIED for student "9990000604".\n' +
    '4. The UI displays error toast "Đề tài không ở trạng thái đang thực hiện".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Vũ Ngọc Ánh" ("9990000604") has a REJECTED outline and a DISQUALIFIED thesis topic supervised by "GV999601".',
});

const ITC066 = defineItc({
  id: 'ITC066',
  feature: 'outline',
  module: 'GopYDeCuong',
  sheet: 'GopYDeCuong',
  fn: 'Submit and Update Supervisor Feedback',
  description:
    'Verify that submitting supervisor feedback is blocked when the grading deadline closes after the feedback modal is already open',
  procedure:
    '1. Log in as a main Supervisor, open the "Duyệt đề cương" screen, and click "Góp ý" on student "Trần Minh Quang"\'s row while the deadline is open.\n' +
    '2. The "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline transitions to COMPLETED before clicking save.\n' +
    '3. Enter "Góp ý sau khi hết hạn chấm" and click "Lưu nhận xét".',
  expected:
    '1. The API PUT /outline/{publicId}/advisor-feedback returns HTTP 403 with code = 3086.\n' +
    '2. The response message is "Đã quá thời hạn giảng viên nhận xét đề cương, vui lòng liên hệ Trưởng bộ môn gia hạn".\n' +
    '3. The database keeps advisor_feedback as NULL on student "9990000601"\'s outline.\n' +
    '4. The UI displays error toast "Đã quá thời hạn giảng viên nhận xét đề cương, vui lòng liên hệ Trưởng bộ môn gia hạn".',
  precondition:
    '1. Main supervisor "GV999601" opens the feedback modal on student "9990000601"\'s PENDING outline while the deadline is OPEN, and the deadline transitions to COMPLETED before saving.',
});

const ITC067 = defineItc({
  id: 'ITC067',
  feature: 'outline',
  module: 'GopYDeCuong',
  sheet: 'GopYDeCuong',
  fn: 'Submit and Update Supervisor Feedback',
  description:
    'Verify that submitting supervisor feedback is blocked when the outline deadline has not started before saving',
  procedure:
    '1. Log in as a main Supervisor, open the "Duyệt đề cương" screen, and click "Góp ý" on student "Trần Minh Quang"\'s row while the deadline is open.\n' +
    '2. The "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline transitions to NOT_STARTED (future start date) before clicking save.\n' +
    '3. Enter "Góp ý trước thời điểm mở hạn" and click "Lưu nhận xét".',
  expected:
    '1. The API PUT /outline/{publicId}/advisor-feedback returns HTTP 403 with code = 3085.\n' +
    '2. The response message is "Thời hạn sinh viên nộp đề cương chưa mở hoặc đã kết thúc".\n' +
    '3. The database keeps advisor_feedback as NULL on student "9990000601"\'s outline.\n' +
    '4. The UI displays error toast "Thời hạn sinh viên nộp đề cương chưa mở hoặc đã kết thúc".',
  precondition:
    '1. Main supervisor "GV999601" opens the feedback modal on student "9990000601"\'s PENDING outline while the deadline is OPEN, and the deadline transitions to NOT_STARTED before saving.',
});

// ============================================================================
// SECURITY TEST CASES (TC-SEC-025 .. TC-SEC-030)
// ============================================================================

const SEC025 = defineItcSec({
  id: 'TC-SEC-025',
  feature: 'outline',
  module: 'GopYDeCuong',
  sheet: 'GopYDeCuong',
  scenario: 'An unauthenticated user opens the outline review screen directly and calls supervisor outline APIs',
  roleSession: 'Unauthenticated (Anonymous)',
  technique: 'EP',
  given: 'The browser has no active login session (no access_token cookie)',
  when: 'Open "/lecturer/outline-review" directly on the Lecturer portal and call GET /outline/supervisor-list and PUT /outline/{publicId}/advisor-feedback',
  then: 'GET /my-info, GET /outline/supervisor-list, and PUT /outline/{publicId}/advisor-feedback return HTTP 401 with code = 2000; the UI automatically redirects to "/login" and displays no outline data',
});

const SEC026 = defineItcSec({
  id: 'TC-SEC-026',
  feature: 'outline',
  module: 'GopYDeCuong',
  sheet: 'GopYDeCuong',
  scenario: 'A student accesses the outline review screen and invokes supervisor outline list and advisor feedback APIs',
  roleSession: 'Student (STUDENT), logged in',
  technique: 'EP',
  given: 'Logged in with a Student account (without SUPERVISOR role or VIEW_ADVISED_STUDENT authority)',
  when: 'Open "/lecturer/outline-review" directly on the Lecturer portal and call GET /outline/supervisor-list and PUT /outline/{publicId}/advisor-feedback',
  then: 'The UI blocks access with message "Tài khoản của bạn không có quyền truy cập cổng cán bộ."; GET /outline/supervisor-list returns HTTP 403 with code = 2001 and message "Tài khoản hiện tại không phải là giảng viên"; PUT /outline/{publicId}/advisor-feedback returns HTTP 403 with code = 2001 and message "Bạn không có quyền truy cập (access denied)", and advisor_feedback remains NULL in the database',
});

const SEC027 = defineItcSec({
  id: 'TC-SEC-027',
  feature: 'outline',
  module: 'GopYDeCuong',
  sheet: 'GopYDeCuong',
  scenario: 'A plain lecturer without the SUPERVISOR role accesses the outline review screen and calls advisor feedback APIs',
  roleSession: 'Lecturer (LECTURER), logged in',
  technique: 'EP',
  given: 'Logged in with a Lecturer account not assigned as a supervisor in the semester (without SUPERVISOR role)',
  when: 'Open "/lecturer/outline-review" directly on the Lecturer portal and call GET /outline/{publicId} and PUT /outline/{publicId}/advisor-feedback',
  then: 'The UI blocks access with message "Tài khoản của bạn không có quyền truy cập cổng cán bộ."; GET /outline/{publicId} returns HTTP 403 with code = 2001 and message "Bạn không có quyền truy cập thông tin đề cương này"; PUT /outline/{publicId}/advisor-feedback returns HTTP 403 with code = 2001 and message "Bạn không có quyền truy cập (access denied)", and advisor_feedback remains NULL in the database',
});

const SEC028 = defineItcSec({
  id: 'TC-SEC-028',
  feature: 'outline',
  module: 'GopYDeCuong',
  sheet: 'GopYDeCuong',
  scenario: 'A supervisor session with a logged-out token accesses the outline review screen and advisor feedback APIs',
  roleSession: 'Supervisor (SUPERVISOR), logged-out token',
  technique: 'STATE_TRANSITION',
  given: 'The supervisor has logged out via POST /log-out so the token is invalidated, while the browser still sends the old access_token cookie',
  when: 'Open "/lecturer/outline-review" and call GET /outline/supervisor-list and PUT /outline/{publicId}/advisor-feedback with the logged-out token',
  then: 'GET /my-info, GET /outline/supervisor-list, and PUT /outline/{publicId}/advisor-feedback return HTTP 401 with code = 2000; the UI redirects to "/login", displays no data, and advisor_feedback remains NULL in the database',
});

const SEC029 = defineItcSec({
  id: 'TC-SEC-029',
  feature: 'outline',
  module: 'GopYDeCuong',
  sheet: 'GopYDeCuong',
  scenario: 'A co-supervisor attempts to submit advisor feedback via direct API despite read-only UI',
  roleSession: 'Co-Supervisor (SUPERVISOR), logged in as co-lecturer',
  technique: 'DECISION_TABLE',
  given: 'Supervisor "GV999602" is assigned as the co-supervisor (not the main supervisor) of student "9990000601"\'s thesis topic with a PENDING submitted outline',
  when: 'Open "/lecturer/outline-review" as Co-Supervisor "GV999602" and invoke PUT /outline/{publicId}/advisor-feedback directly',
  then: 'The UI displays badge "Đồng GVHD (Chỉ xem)" with no "Góp ý" button; PUT /outline/{publicId}/advisor-feedback returns HTTP 403 with code = 2001 and message "Giảng viên đồng hướng dẫn chỉ có quyền xem, không có quyền ghi nhận xét đề cương", and advisor_feedback remains NULL in the database',
});

const SEC030 = defineItcSec({
  id: 'TC-SEC-030',
  feature: 'outline',
  module: 'GopYDeCuong',
  sheet: 'GopYDeCuong',
  scenario: 'An unrelated supervisor attempts to view detail or submit advisor feedback for another supervisor\'s student outline',
  roleSession: 'Supervisor (SUPERVISOR), logged in as unrelated supervisor',
  technique: 'ERROR_GUESSING',
  given: 'Supervisor "GV999603" is logged in while student "9990000601" is supervised by "GV999601" and has a PENDING submitted outline',
  when: 'Open "/lecturer/outline-review" as Supervisor "GV999603" and invoke GET /outline/{publicId} and PUT /outline/{publicId}/advisor-feedback targeting student "9990000601"\'s outline',
  then: 'Student "9990000601" is not displayed in Supervisor "GV999603"\'s list; GET /outline/{publicId} returns HTTP 403 with code = 2001 and message "Bạn không có quyền truy cập thông tin đề cương này"; PUT /outline/{publicId}/advisor-feedback returns HTTP 403 with code = 2001 and message "Bạn không có quyền nhận xét đề cương của đề tài này", and advisor_feedback remains NULL in the database',
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
  teacherCode: 'GV999601',
  firstName: 'Nguyễn Văn',
  lastName: 'Hùng',
  fullName: 'Nguyễn Văn Hùng',
  email: 'itc.gopy.gv.999601@tlu.edu.vn',
  phone: '0989960601',
  academicTitle: 'TS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_CO_SUPERVISOR = {
  teacherCode: 'GV999602',
  firstName: 'Đỗ Thị',
  lastName: 'Lan',
  fullName: 'Đỗ Thị Lan',
  email: 'itc.gopy.gv.999602@tlu.edu.vn',
  phone: '0989960602',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_OTHER_SUPERVISOR = {
  teacherCode: 'GV999603',
  firstName: 'Lê Hoàng',
  lastName: 'Long',
  fullName: 'Lê Hoàng Long',
  email: 'itc.gopy.gv.999603@tlu.edu.vn',
  phone: '0989960603',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_PLAIN_LECTURER = {
  teacherCode: 'GV999604',
  firstName: 'Vũ Minh',
  lastName: 'Tuấn',
  fullName: 'Vũ Minh Tuấn',
  email: 'itc.gopy.gv.999604@tlu.edu.vn',
  phone: '0989960604',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_REVIEWER = {
  teacherCode: 'GV999605',
  firstName: 'Hoàng Thị',
  lastName: 'Thu',
  fullName: 'Hoàng Thị Thu',
  email: 'itc.gopy.gv.999605@tlu.edu.vn',
  phone: '0989960605',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_ARCHIVE_SUPERVISOR = {
  teacherCode: 'GV999699',
  firstName: 'Trần Lưu',
  lastName: 'Trữ',
  fullName: 'Trần Lưu Trữ',
  email: 'itc.gopy.gv.999699@tlu.edu.vn',
  phone: '0989960699',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_STUDENT_1 = {
  studentCode: '9990000601',
  firstName: 'Trần Minh',
  lastName: 'Quang',
  fullName: 'Trần Minh Quang',
  email: 'itc.gopy.sv.9990000601@gmail.com',
  phone: '0989960101',
  batch: 'K64',
  className: '64HTTT99',
  pdfFileName: '64HTTT99_9990000601_TranMinhQuang.pdf',
};

const TEST_STUDENT_2 = {
  studentCode: '9990000602',
  firstName: 'Lê Thị',
  lastName: 'Mai',
  fullName: 'Lê Thị Mai',
  email: 'itc.gopy.sv.9990000602@gmail.com',
  phone: '0989960102',
  batch: 'K64',
  className: '64HTTT99',
  pdfFileName: '64HTTT99_9990000602_LeThiMai.pdf',
};

const TEST_STUDENT_3 = {
  studentCode: '9990000603',
  firstName: 'Phạm Quốc',
  lastName: 'Bảo',
  fullName: 'Phạm Quốc Bảo',
  email: 'itc.gopy.sv.9990000603@gmail.com',
  phone: '0989960103',
  batch: 'K64',
  className: '64HTTT99',
  pdfFileName: '64HTTT99_9990000603_PhamQuocBao.pdf',
};

const TEST_STUDENT_4 = {
  studentCode: '9990000604',
  firstName: 'Vũ Ngọc',
  lastName: 'Ánh',
  fullName: 'Vũ Ngọc Ánh',
  email: 'itc.gopy.sv.9990000604@gmail.com',
  phone: '0989960104',
  batch: 'K64',
  className: '64HTTT99',
  pdfFileName: '64HTTT99_9990000604_VuNgocAnh.pdf',
};

type StudentProfile = typeof TEST_STUDENT_1;
type TeacherProfile = typeof TEST_MAIN_SUPERVISOR;

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
  assignCoSupervisor?: boolean;
  submissions?: SubmissionStep[];
}

interface ProvisionedStudentHandle {
  profile: StudentProfile;
  studentPublicId: string;
  studentToken: string;
  topicId: number;
  topicPublicId: string;
  outlinePublicId: string;
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
  mainSupervisorId: number;
  mainSupervisorPublicId: string;
  mainSupervisorToken: string;
  coSupervisorId: number;
  coSupervisorPublicId: string;
  coSupervisorToken: string;
  otherSupervisorId: number;
  otherSupervisorPublicId: string;
  otherSupervisorToken: string;
  plainLecturerId: number;
  plainLecturerToken: string;
  reviewerId: number;
  reviewerPublicId: string;
  reviewerToken: string;
  archiveSupervisorId: number;
  archiveSupervisorPublicId: string;
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
): Promise<{ id: number; publicId: string; token: string }> {
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
  return { id: teacherId, publicId: teacherPublicId, token };
}

async function sweepResidualTopicsInIsolatedMajor(request: APIRequestContext) {
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
    if (currentSupId !== envState.archiveSupervisorPublicId) {
      if (st.status === 'UNASSIGNED') {
        await apiCall(
          request,
          envState.hodToken,
          'POST',
          `/semesters/${envState.semesterPublicId}/advisor-assignments/assign`,
          {
            data: {
              teacherPublicId: envState.archiveSupervisorPublicId,
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
          { data: { newTeacherPublicId: envState.archiveSupervisorPublicId } },
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
      studentCode: `9996${suffix.slice(-6)}`,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: `itc.arch.gopy.sv.${suffix}@gmail.com`,
      phone: `0976${suffix.slice(-6)}`,
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
        teacherPublicId: envState.mainSupervisorPublicId,
        topicName: null,
      },
    });
    if (regRes.status !== 200 || !regRes.body?.data?.registrationPublicId) {
      throw new Error(`SV ${spec.profile.studentCode} không thể gửi đơn ĐK GVHD: ${JSON.stringify(regRes.body)}`);
    }

    const approveRegRes = await apiCall(
      request,
      envState.mainSupervisorToken,
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
    });
  }

  activeHandles.push(...handles);

  // Gán đồng hướng dẫn (nếu có) và chốt danh sách phân công GVHD
  await updateDeadline(request, envState.dlDangKy, 'DANG_KY_GVHD', 'CLOSED');
  await updateDeadline(request, envState.dlTbmChot, 'TBM_CHOT_DS_GVHD_DU_KIEN', 'OPEN');

  for (let i = 0; i < specs.length; i++) {
    if (specs[i].assignCoSupervisor) {
      const coRes = await apiCall(
        request,
        envState.hodToken,
        'PUT',
        `/semesters/${envState.semesterPublicId}/advisor-assignments/students/${handles[i].studentPublicId}/co-supervisor`,
        { data: { coTeacherPublicId: envState.coSupervisorPublicId } },
      );
      if (coRes.status !== 200) {
        throw new Error(`Không thể gán GV đồng hướng dẫn cho SV ${specs[i].profile.studentCode}: ${JSON.stringify(coRes.body)}`);
      }
    }
  }

  await setLockStatus(request, true);
  await setLockStatus(request, false);
  await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'OPEN');

  // Chốt tên đề tài -> GVHD duyệt -> TBM phân công GVNX -> SV nộp đề cương & xử lý các bước setup
  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    const h = handles[i];

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
      envState.mainSupervisorToken,
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
          commentingLecturerId: envState.reviewerId,
          studentOrTopicIds: [h.topicId],
        },
      },
    );
    if (assignRes.status !== 200) {
      throw new Error(`TBM không thể phân công GVNX cho SV ${h.profile.studentCode}: ${JSON.stringify(assignRes.body)}`);
    }
    envState.reviewerToken = await loginByEmail(request, TEST_REVIEWER.email);

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
          envState.mainSupervisorToken,
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
          envState.reviewerToken,
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
          await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'OPEN');
        }
      }
    }
  }

  return handles;
}

async function cleanupActiveStudents(request: APIRequestContext) {
  if (activeHandles.length === 0) return;

  const handles = [...activeHandles];
  activeHandles = [];

  await sweepResidualTopicsInIsolatedMajor(request);

  for (const h of handles) {
    const suffix = `${String(Date.now()).slice(-5)}${rotateCounter++}`;
    await apiCall(request, envState.hodToken, 'PUT', `/student/${h.studentPublicId}`, {
      data: {
        studentCode: `9996${suffix.slice(-6)}`,
        firstName: h.profile.firstName,
        lastName: h.profile.lastName,
        email: `itc.arch.gopy.sv.${suffix}@gmail.com`,
        phone: `0976${suffix.slice(-6)}`,
        batch: h.profile.batch,
        className: h.profile.className,
      },
    });
  }
}

async function openOutlineReviewPage(page: Page, context: BrowserContext, token: string) {
  await setAuthCookie(context, token);

  const deadlinePromise = page.waitForResponse(
    (r) =>
      r.url().includes('/api/v1/deadlines') &&
      r.url().includes(`semesterId=${envState.semesterPublicId}`) &&
      r.request().method() === 'GET',
  );
  const supervisorListPromise = page.waitForResponse(
    (r) =>
      r.url().includes('/outline/supervisor-list') &&
      r.url().includes(`semesterId=${envState.semesterPublicId}`) &&
      r.request().method() === 'GET',
  );

  await page.goto('/lecturer/outline-review');
  const [deadlineRes, supervisorListRes] = await Promise.all([deadlinePromise, supervisorListPromise]);
  return { deadlineRes, supervisorListRes };
}

test.describe('Report 5.2 - Supervisor Feedback on Student Thesis Outline (GopYDeCuong)', () => {
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

    envState = {
      hodToken: isolatedHodToken,
      majorId: isolatedMajor.id,
      majorName: isolatedMajor.name,
      semesterId: semId,
      semesterPublicId: semData.publicId,
      semesterStartDate: semRows[0].start_date,
      semesterEndDate: semRows[0].end_date,
      originallyLocked: origLocked,
      mainSupervisorId: 0,
      mainSupervisorPublicId: '',
      mainSupervisorToken: '',
      coSupervisorId: 0,
      coSupervisorPublicId: '',
      coSupervisorToken: '',
      otherSupervisorId: 0,
      otherSupervisorPublicId: '',
      otherSupervisorToken: '',
      plainLecturerId: 0,
      plainLecturerToken: '',
      reviewerId: 0,
      reviewerPublicId: '',
      reviewerToken: '',
      archiveSupervisorId: 0,
      archiveSupervisorPublicId: '',
      dlDangKy: findSnap('DANG_KY_GVHD'),
      dlTbmChot: findSnap('TBM_CHOT_DS_GVHD_DU_KIEN'),
      dlDeCuong: findSnap('SV_CHINH_SUA_NOP_LAI_DE_CUONG'),
    };

    const mainSup = await ensureTeacher(request, TEST_MAIN_SUPERVISOR, true, 20);
    envState.mainSupervisorId = mainSup.id;
    envState.mainSupervisorPublicId = mainSup.publicId;
    envState.mainSupervisorToken = mainSup.token;

    const coSup = await ensureTeacher(request, TEST_CO_SUPERVISOR, true, 20);
    envState.coSupervisorId = coSup.id;
    envState.coSupervisorPublicId = coSup.publicId;
    envState.coSupervisorToken = coSup.token;

    const otherSup = await ensureTeacher(request, TEST_OTHER_SUPERVISOR, true, 10);
    envState.otherSupervisorId = otherSup.id;
    envState.otherSupervisorPublicId = otherSup.publicId;
    envState.otherSupervisorToken = otherSup.token;

    const plainLec = await ensureTeacher(request, TEST_PLAIN_LECTURER, false);
    envState.plainLecturerId = plainLec.id;
    envState.plainLecturerToken = plainLec.token;

    const reviewer = await ensureTeacher(request, TEST_REVIEWER, true, 20);
    envState.reviewerId = reviewer.id;
    envState.reviewerPublicId = reviewer.publicId;
    envState.reviewerToken = reviewer.token;

    const archiveSup = await ensureTeacher(request, TEST_ARCHIVE_SUPERVISOR, true, 500);
    envState.archiveSupervisorId = archiveSup.id;
    envState.archiveSupervisorPublicId = archiveSup.publicId;
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
  // NHÓM READ-ONLY (ITC052..ITC053) - DÙNG CHUNG BỘ 4 SINH VIÊN ĐỂ TỐI ƯU TỐC ĐỘ
  // ==========================================================================

  test.describe('View and Filter Supervised Outlines - Multi-status Dataset (ITC052..ITC053)', () => {
    test.beforeAll(async ({ request }) => {
      await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống quản lý đồ án tốt nghiệp thông minh',
          submissions: [{ submissionNote: 'Bản nộp lần 1' }],
        },
        {
          profile: TEST_STUDENT_2,
          topicName: 'Hệ thống quản lý thư viện số ứng dụng AI',
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

    test(ITC052.title, { annotation: ITC052.annotation }, async ({ page, context }) => {
      const { deadlineRes, supervisorListRes } = await openOutlineReviewPage(
        page,
        context,
        envState.mainSupervisorToken,
      );

      expect(deadlineRes.status()).toBe(200);
      const deadlineBody = await deadlineRes.json();
      expect(deadlineBody.code).toBe(1000);
      const dlItem = (deadlineBody.data?.giaoNhanDeadlines ?? []).find(
        (d: any) => d.code === 'SV_CHINH_SUA_NOP_LAI_DE_CUONG',
      );
      expect(dlItem?.status).toBe('IN_PROGRESS');

      expect(supervisorListRes.status()).toBe(200);
      const listBody = await supervisorListRes.json();
      expect(listBody.code).toBe(1000);
      expect(listBody.data).toHaveLength(4);
      for (const item of listBody.data) {
        expect(item.canWriteAdvisorFeedback).toBe(true);
      }

      // Kiểm tra badge số lượng và mốc thời hạn đang mở
      await expect(page.locator('#roleCountGuide')).toHaveText('4');
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
      await expect(row1).toContainText(`GVNX: ${TEST_REVIEWER.fullName}`);
      await expect(row1.getByRole('button', { name: 'Góp ý', exact: true })).toBeEnabled();

      // Đối chiếu DB bằng SELECT
      const dbRows = await dbSelect<{ status: string; total: number }>(
        `SELECT o.status, COUNT(*) AS total
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN teacher t ON t.id = tt.lecturer_id
          WHERE t.teacher_code = ? AND tt.semester_id = ?
          GROUP BY o.status`,
        [TEST_MAIN_SUPERVISOR.teacherCode, envState.semesterId],
      );
      const countByStatus = Object.fromEntries(dbRows.map((r) => [r.status, Number(r.total)]));
      expect(countByStatus.PENDING).toBe(1);
      expect(countByStatus.REQUEST_CHANGES).toBe(1);
      expect(countByStatus.APPROVED).toBe(1);
      expect(countByStatus.REJECTED).toBe(1);
    });

    test(ITC053.title, { annotation: ITC053.annotation }, async ({ page, context }) => {
      const { supervisorListRes } = await openOutlineReviewPage(
        page,
        context,
        envState.mainSupervisorToken,
      );
      expect(supervisorListRes.status()).toBe(200);
      expect((await supervisorListRes.json()).data).toHaveLength(4);

      const statusTabs = page.locator('#statusTabs');

      await statusTabs.locator('button[data-status="REQUEST_CHANGES"]').click();
      const row2 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) });
      await expect(row2).toBeVisible();
      await expect(row2).toContainText('Cần bổ sung sơ đồ kiến trúc tổng thể');
      await expect(row2).toContainText('Em cần làm rõ phạm vi hệ thống');
      await expect(row2.getByRole('button', { name: 'Sửa góp ý', exact: true })).toBeEnabled();

      await statusTabs.locator('button[data-status="APPROVED"]').click();
      await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_3.studentCode) })).toBeVisible();

      await statusTabs.locator('button[data-status="REJECTED"]').click();
      await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_4.studentCode) })).toBeVisible();

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
  // NHÓM ĐỘC LẬP TỪNG TEST (ITC054..ITC067 & TC-SEC-025..TC-SEC-030)
  // ==========================================================================

  test.describe('Read-only Modes, History/Preview, Feedback Mutations, and Security (ITC054..ITC067, TC-SEC-025..TC-SEC-030)', () => {
    test.afterEach(async ({ request }) => {
      await cleanupActiveStudents(request);
      await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'OPEN');
    });

    test(ITC054.title, { annotation: ITC054.annotation }, async ({ page, context, request }) => {
      await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống giám sát năng lượng thông minh',
          assignCoSupervisor: true,
          submissions: [{ submissionNote: 'Bản nộp có đồng hướng dẫn' }],
        },
      ]);

      const { supervisorListRes } = await openOutlineReviewPage(page, context, envState.coSupervisorToken);
      expect(supervisorListRes.status()).toBe(200);
      const listBody = await supervisorListRes.json();
      expect(listBody.code).toBe(1000);
      const matched = (listBody.data ?? []).find((x: any) => x.studentCode === TEST_STUDENT_1.studentCode);
      expect(matched).toBeTruthy();
      expect(matched.canWriteAdvisorFeedback).toBe(false);

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(row1).toBeVisible();
      await expect(row1).toContainText('Đồng GVHD (Chỉ xem)');
      await expect(row1.getByRole('button', { name: 'Lịch sử', exact: true })).toBeEnabled();
      await expect(row1.getByRole('button', { name: 'Góp ý', exact: true })).toHaveCount(0);
      await expect(row1.getByRole('button', { name: 'Sửa góp ý', exact: true })).toHaveCount(0);

      const dbRows = await dbSelect<{ co_code: string | null }>(
        `SELECT ct.teacher_code AS co_code
           FROM thesis_topic tt
           JOIN student s ON s.id = tt.student_id
           LEFT JOIN teacher ct ON ct.id = tt.co_lecturer_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows[0]?.co_code).toBe(TEST_CO_SUPERVISOR.teacherCode);
    });

    test(ITC055.title, { annotation: ITC055.annotation }, async ({ page, context, request }) => {
      await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống kiểm thử khóa góp ý khi hết hạn',
          submissions: [{ submissionNote: 'Bản nộp trước khi hết hạn' }],
        },
      ]);

      await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'CLOSED');

      const { deadlineRes, supervisorListRes } = await openOutlineReviewPage(
        page,
        context,
        envState.mainSupervisorToken,
      );
      expect(deadlineRes.status()).toBe(200);
      const dlBody = await deadlineRes.json();
      const dlItem = (dlBody.data?.giaoNhanDeadlines ?? []).find(
        (d: any) => d.code === 'SV_CHINH_SUA_NOP_LAI_DE_CUONG',
      );
      expect(dlItem?.status).toBe('COMPLETED');

      expect(supervisorListRes.status()).toBe(200);
      expect((await supervisorListRes.json()).data).toHaveLength(1);

      await expect(page.getByText(/Đã hết hạn/)).toBeVisible();
      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(row1).toContainText('Đã khóa góp ý');
      await expect(row1.getByRole('button', { name: 'Góp ý', exact: true })).toHaveCount(0);
    });

    test(ITC056.title, { annotation: ITC056.annotation }, async ({ page, context, request }) => {
      await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống kiểm thử khóa góp ý khi chưa mở hạn',
          submissions: [{ submissionNote: 'Bản nộp chờ mở hạn' }],
        },
      ]);

      await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'NOT_STARTED');

      const { deadlineRes, supervisorListRes } = await openOutlineReviewPage(
        page,
        context,
        envState.mainSupervisorToken,
      );
      expect(deadlineRes.status()).toBe(200);
      const dlBody = await deadlineRes.json();
      const dlItem = (dlBody.data?.giaoNhanDeadlines ?? []).find(
        (d: any) => d.code === 'SV_CHINH_SUA_NOP_LAI_DE_CUONG',
      );
      expect(dlItem?.status).toBe('NOT_STARTED');

      expect(supervisorListRes.status()).toBe(200);
      expect((await supervisorListRes.json()).data).toHaveLength(1);

      await expect(page.getByText(/Chưa mở/)).toBeVisible();
      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(row1).toContainText('Đã khóa góp ý');
      await expect(row1.getByRole('button', { name: 'Góp ý', exact: true })).toHaveCount(0);
    });

    test(ITC057.title, { annotation: ITC057.annotation }, async ({ page, context, request }) => {
      const [s2] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_2,
          topicName: 'Hệ thống quản lý thư viện số ứng dụng AI',
          submissions: [
            {
              submissionNote: 'Bản nộp lần 1',
              advisorFeedback: 'Bổ sung sơ đồ phân rã chức năng ở bản 1',
              reviewDecision: 'REQUEST_CHANGES',
              reviewFeedback: 'Cần bổ sung sơ đồ kiến trúc tổng thể',
            },
            {
              submissionNote: 'Bản nộp lần 2 sau chỉnh sửa',
            },
          ],
        },
      ]);

      await openOutlineReviewPage(page, context, envState.mainSupervisorToken);

      const detailPromise = page.waitForResponse(
        (r) => r.url().includes(`/outline/${s2.outlinePublicId}`) && r.request().method() === 'GET',
      );
      const row2 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) });
      await row2.getByRole('button', { name: 'Lịch sử', exact: true }).click();
      const detailRes = await detailPromise;

      expect(detailRes.status()).toBe(200);
      const detailBody = await detailRes.json();
      expect(detailBody.code).toBe(1000);
      expect(detailBody.data.histories).toHaveLength(2);
      expect(detailBody.data.histories[0].status).toBe('PENDING');
      expect(detailBody.data.histories[1].status).toBe('REQUEST_CHANGES');
      expect(detailBody.data.histories[1].reviewFeedback).toBe('Cần bổ sung sơ đồ kiến trúc tổng thể');
      expect(detailBody.data.histories[1].advisorFeedback).toBe('Bổ sung sơ đồ phân rã chức năng ở bản 1');

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
      await expect(histRows.nth(1)).toContainText('Cần bổ sung sơ đồ kiến trúc tổng thể');
      await expect(histRows.nth(1)).toContainText(`Bởi: ${TEST_REVIEWER.fullName}`);
      await expect(histRows.nth(1)).toContainText('Bổ sung sơ đồ phân rã chức năng ở bản 1');
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

    test(ITC058.title, { annotation: ITC058.annotation }, async ({ page, context, request }) => {
      const existingFeedback = 'Góp ý xem trước cho bản đề cương hiện tại';
      await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống phân tích cảm xúc bài đánh giá sản phẩm',
          submissions: [
            {
              submissionNote: 'Bản đề cương PDF để xem trước',
              advisorFeedback: existingFeedback,
            },
          ],
        },
      ]);

      const { supervisorListRes } = await openOutlineReviewPage(
        page,
        context,
        envState.mainSupervisorToken,
      );
      expect(supervisorListRes.status()).toBe(200);
      const listBody = await supervisorListRes.json();
      expect(listBody.code).toBe(1000);
      expect(listBody.data[0].outlineFile).toBeTruthy();
      expect(listBody.data[0].advisorFeedback).toBe(existingFeedback);

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByTitle('Xem trước đề cương').click();

      const previewModal = page.locator('#outlineClassroomPreviewModal');
      await expect(previewModal).toBeVisible();
      await expect(previewModal).toContainText(`${TEST_STUDENT_1.fullName} (${TEST_STUDENT_1.studentCode})`);
      await expect(previewModal).toContainText(TEST_MAIN_SUPERVISOR.fullName);
      await expect(previewModal).toContainText(TEST_REVIEWER.fullName);
      await expect(previewModal).toContainText(existingFeedback);
      await expect(previewModal.locator('iframe')).toBeVisible();
      await expect(
        page.getByText(`Đã đọc đề cương của sinh viên ${TEST_STUDENT_1.fullName}!`),
      ).toBeVisible();

      const dbRows = await dbSelect<{ outline_file: string | null; advisor_feedback: string | null }>(
        `SELECT o.outline_file, o.advisor_feedback
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows[0]?.outline_file).toBeTruthy();
      expect(dbRows[0]?.advisor_feedback).toBe(existingFeedback);
    });

    test(ITC059.title, { annotation: ITC059.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống quản lý đồ án tốt nghiệp thông minh',
          submissions: [{ submissionNote: 'Bản nộp lần đầu chờ góp ý' }],
        },
      ]);

      await openOutlineReviewPage(page, context, envState.mainSupervisorToken);

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Góp ý', exact: true }).click();

      const modal = page.locator('#feedbackModal');
      await expect(modal).toBeVisible();

      const rawFeedback = '  Bố cục đề cương rõ ràng, em cần bổ sung thêm sơ đồ ERD chi tiết.  ';
      const expectedTrimmed = rawFeedback.trim();
      await modal.locator('#feedbackContentInput').fill(rawFeedback);

      const putPromise = page.waitForResponse(
        (r) =>
          r.url().includes(`/outline/${s1.outlinePublicId}/advisor-feedback`) &&
          r.request().method() === 'PUT',
      );
      await modal.locator('#btnSaveFeedback').click();
      const putRes = await putPromise;

      expect(putRes.request().postDataJSON()).toEqual({ feedback: expectedTrimmed });
      expect(putRes.status()).toBe(200);
      const putBody = await putRes.json();
      expect(putBody.code).toBe(1000);
      expect(putBody.message).toBe('Gửi nhận xét góp ý đề cương thành công');

      await expect(
        page.getByText(`Đã gửi nhận xét góp ý cho sinh viên ${TEST_STUDENT_1.fullName} thành công!`),
      ).toBeVisible();
      await expect(modal).toHaveCount(0);
      await expect(row1).toContainText(expectedTrimmed);
      await expect(row1.getByRole('button', { name: 'Sửa góp ý', exact: true })).toBeEnabled();

      // Đối chiếu DB: thesis_outline, thesis_outline_history, thesis_topic và notification
      const outlineRows = await dbSelect<{
        advisor_feedback: string | null;
        status: string;
        current_stage: string;
      }>(
        `SELECT o.advisor_feedback, o.status, tt.current_stage
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(outlineRows[0].advisor_feedback).toBe(expectedTrimmed);
      expect(outlineRows[0].status).toBe('PENDING');
      expect(outlineRows[0].current_stage).toBe('STAGE_2_TOPIC_CONFIRMED');

      const histRows = await dbSelect<{ advisor_feedback: string | null }>(
        `SELECT h.advisor_feedback
           FROM thesis_outline_history h
           JOIN thesis_outline o ON o.id = h.thesis_outline_id
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?
          ORDER BY h.submitted_at DESC, h.id DESC
          LIMIT 1`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(histRows[0].advisor_feedback).toBe(expectedTrimmed);

      const notifRows = await dbSelect<{ total: number }>(
        `SELECT COUNT(*) AS total
           FROM notification n
           JOIN account a ON a.id = n.account_id
           JOIN student s ON s.account_id = a.id
          WHERE s.student_code = ?
            AND n.content = ?`,
        [TEST_STUDENT_1.studentCode, 'GVHD đã nhận xét đề cương của bạn.'],
      );
      expect(Number(notifRows[0].total)).toBeGreaterThanOrEqual(1);
    });

    test(ITC060.title, { annotation: ITC060.annotation }, async ({ page, context, request }) => {
      const initialFeedback = 'Góp ý ban đầu về chương 1.';
      const updatedFeedback = 'Đã cập nhật góp ý: bổ sung phân tích yêu cầu phi chức năng và kế hoạch tuần.';

      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống quản lý đồ án tốt nghiệp thông minh',
          submissions: [
            {
              submissionNote: 'Bản nộp đã có góp ý cũ',
              advisorFeedback: initialFeedback,
            },
          ],
        },
      ]);

      const beforeNotif = await dbSelect<{ total: number }>(
        `SELECT COUNT(*) AS total
           FROM notification n
           JOIN student s ON s.account_id = n.account_id
          WHERE s.student_code = ? AND n.content = ?`,
        [TEST_STUDENT_1.studentCode, 'GVHD đã nhận xét đề cương của bạn.'],
      );
      const notifCountBefore = Number(beforeNotif[0].total);

      await openOutlineReviewPage(page, context, envState.mainSupervisorToken);

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Sửa góp ý', exact: true }).click();

      const modal = page.locator('#feedbackModal');
      await expect(modal).toBeVisible();
      await expect(modal.locator('#feedbackContentInput')).toHaveValue(initialFeedback);

      await modal.locator('#feedbackContentInput').fill(updatedFeedback);
      const putPromise = page.waitForResponse(
        (r) =>
          r.url().includes(`/outline/${s1.outlinePublicId}/advisor-feedback`) &&
          r.request().method() === 'PUT',
      );
      await modal.locator('#btnSaveFeedback').click();
      const putRes = await putPromise;

      expect(putRes.status()).toBe(200);
      const putBody = await putRes.json();
      expect(putBody.code).toBe(1000);
      expect(putBody.message).toBe('Gửi nhận xét góp ý đề cương thành công');

      await expect(
        page.getByText(`Đã gửi nhận xét góp ý cho sinh viên ${TEST_STUDENT_1.fullName} thành công!`),
      ).toBeVisible();
      await expect(row1).toContainText(updatedFeedback);

      const dbRows = await dbSelect<{ outline_fb: string | null; hist_fb: string | null }>(
        `SELECT o.advisor_feedback AS outline_fb,
                (SELECT h.advisor_feedback
                   FROM thesis_outline_history h
                  WHERE h.thesis_outline_id = o.id
                  ORDER BY h.submitted_at DESC, h.id DESC
                  LIMIT 1) AS hist_fb
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows[0].outline_fb).toBe(updatedFeedback);
      expect(dbRows[0].hist_fb).toBe(updatedFeedback);

      const afterNotif = await dbSelect<{ total: number }>(
        `SELECT COUNT(*) AS total
           FROM notification n
           JOIN student s ON s.account_id = n.account_id
          WHERE s.student_code = ? AND n.content = ?`,
        [TEST_STUDENT_1.studentCode, 'GVHD đã nhận xét đề cương của bạn.'],
      );
      expect(Number(afterNotif[0].total)).toBe(notifCountBefore + 1);
    });

    test(ITC061.title, { annotation: ITC061.annotation }, async ({ page, context, request }) => {
      const reviewerNote = 'Cần bổ sung sơ đồ kiến trúc tổng thể';
      const newAdvisorNote = 'Em sửa theo góp ý của GVNX và bổ sung thêm đặc tả API.';

      const [s2] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_2,
          topicName: 'Hệ thống quản lý thư viện số ứng dụng AI',
          submissions: [
            {
              submissionNote: 'Bản nộp chờ sửa',
              reviewDecision: 'REQUEST_CHANGES',
              reviewFeedback: reviewerNote,
            },
          ],
        },
      ]);

      await openOutlineReviewPage(page, context, envState.mainSupervisorToken);
      await page.locator('#statusTabs button[data-status="REQUEST_CHANGES"]').click();

      const row2 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) });
      await expect(row2).toBeVisible();
      await row2.getByRole('button', { name: 'Góp ý', exact: true }).click();

      const modal = page.locator('#feedbackModal');
      await expect(modal).toBeVisible();
      await expect(modal).toContainText(reviewerNote);

      await modal.locator('#feedbackContentInput').fill(newAdvisorNote);
      const putPromise = page.waitForResponse(
        (r) =>
          r.url().includes(`/outline/${s2.outlinePublicId}/advisor-feedback`) &&
          r.request().method() === 'PUT',
      );
      await modal.locator('#btnSaveFeedback').click();
      const putRes = await putPromise;

      expect(putRes.status()).toBe(200);
      const putBody = await putRes.json();
      expect(putBody.code).toBe(1000);
      expect(putBody.message).toBe('Gửi nhận xét góp ý đề cương thành công');

      await expect(
        page.getByText(`Đã gửi nhận xét góp ý cho sinh viên ${TEST_STUDENT_2.fullName} thành công!`),
      ).toBeVisible();
      await expect(row2).toContainText(newAdvisorNote);

      const dbRows = await dbSelect<{
        status: string;
        review_feedback: string | null;
        advisor_feedback: string | null;
      }>(
        `SELECT o.status, o.review_feedback, o.advisor_feedback
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_2.studentCode, envState.semesterId],
      );
      expect(dbRows[0].status).toBe('REQUEST_CHANGES');
      expect(dbRows[0].review_feedback).toBe(reviewerNote);
      expect(dbRows[0].advisor_feedback).toBe(newAdvisorNote);
    });

    test(ITC062.title, { annotation: ITC062.annotation }, async ({ page, context, request }) => {
      const extendedFeedback = 'Góp ý bổ sung trong thời gian gia hạn chấm.';
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống kiểm thử góp ý trong giai đoạn gia hạn chấm',
          submissions: [{ submissionNote: 'Bản nộp trước khi gia hạn chấm' }],
        },
      ]);

      await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'EXTENDED');

      const { deadlineRes } = await openOutlineReviewPage(page, context, envState.mainSupervisorToken);
      expect(deadlineRes.status()).toBe(200);
      const dlBody = await deadlineRes.json();
      const dlItem = (dlBody.data?.giaoNhanDeadlines ?? []).find(
        (d: any) => d.code === 'SV_CHINH_SUA_NOP_LAI_DE_CUONG',
      );
      expect(dlItem?.status).toBe('EXTENDED');
      await expect(page.getByText(/Đã hết hạn nộp — Đang gia hạn chấm đến/)).toBeVisible();

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Góp ý', exact: true }).click();

      const modal = page.locator('#feedbackModal');
      await modal.locator('#feedbackContentInput').fill(extendedFeedback);
      const putPromise = page.waitForResponse(
        (r) =>
          r.url().includes(`/outline/${s1.outlinePublicId}/advisor-feedback`) &&
          r.request().method() === 'PUT',
      );
      await modal.locator('#btnSaveFeedback').click();
      const putRes = await putPromise;

      expect(putRes.status()).toBe(200);
      expect((await putRes.json()).code).toBe(1000);
      await expect(
        page.getByText(`Đã gửi nhận xét góp ý cho sinh viên ${TEST_STUDENT_1.fullName} thành công!`),
      ).toBeVisible();
      await expect(row1).toContainText(extendedFeedback);

      const dbRows = await dbSelect<{ advisor_feedback: string | null }>(
        `SELECT o.advisor_feedback
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows[0].advisor_feedback).toBe(extendedFeedback);
    });

    test(ITC063.title, { annotation: ITC063.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống kiểm thử validate góp ý rỗng',
          submissions: [{ submissionNote: 'Bản nộp kiểm thử validate' }],
        },
      ]);

      await openOutlineReviewPage(page, context, envState.mainSupervisorToken);
      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Góp ý', exact: true }).click();

      const modal = page.locator('#feedbackModal');
      await expect(modal).toBeVisible();
      await modal.locator('#feedbackContentInput').fill('     ');
      await modal.locator('#btnSaveFeedback').click();

      await expect(modal.getByText('Vui lòng nhập nội dung góp ý đề cương!')).toBeVisible();
      await expect(modal).toBeVisible();

      // Kiểm tra thêm validation phía BE với chuỗi chỉ gồm khoảng trắng
      const apiRes = await apiCall(
        request,
        envState.mainSupervisorToken,
        'PUT',
        `/outline/${s1.outlinePublicId}/advisor-feedback`,
        { data: { feedback: '   ' } },
      );
      expect(apiRes.status).toBe(400);
      expect(apiRes.body.code).toBe(4000);
      expect(apiRes.body.message).toBe('Vui lòng nhập ý kiến nhận xét đề cương');

      const dbRows = await dbSelect<{ advisor_feedback: string | null }>(
        `SELECT o.advisor_feedback
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows[0].advisor_feedback).toBeNull();
    });

    test(ITC064.title, { annotation: ITC064.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống kiểm thử sinh viên chưa nộp file đề cương',
          submissions: [],
        },
      ]);

      await openOutlineReviewPage(page, context, envState.mainSupervisorToken);
      await page.locator('#statusTabs button[data-status=""]').click();

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(row1).toBeVisible();
      await expect(row1).toContainText('Chưa nộp');
      await row1.getByRole('button', { name: 'Góp ý', exact: true }).click();

      const modal = page.locator('#feedbackModal');
      await modal.locator('#feedbackContentInput').fill('Góp ý khi sinh viên chưa nộp file');
      const putPromise = page.waitForResponse(
        (r) =>
          r.url().includes(`/outline/${s1.outlinePublicId}/advisor-feedback`) &&
          r.request().method() === 'PUT',
      );
      await modal.locator('#btnSaveFeedback').click();
      const putRes = await putPromise;

      expect(putRes.status()).toBe(409);
      const putBody = await putRes.json();
      expect(putBody.code).toBe(3082);
      expect(putBody.message).toBe('Sinh viên chưa nộp file đề cương');
      await expect(page.getByText('Sinh viên chưa nộp file đề cương', { exact: true })).toBeVisible();

      const dbRows = await dbSelect<{ status: string | null; advisor_feedback: string | null }>(
        `SELECT o.status, o.advisor_feedback
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows[0].status).toBeNull();
      expect(dbRows[0].advisor_feedback).toBeNull();
    });

    test(ITC065.title, { annotation: ITC065.annotation }, async ({ page, context, request }) => {
      const [s4] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_4,
          topicName: 'Hệ thống kiểm thử đề tài đã bị đình chỉ',
          submissions: [
            {
              submissionNote: 'Bản nộp không đạt',
              reviewDecision: 'REJECTED',
              reviewFeedback: 'Không đáp ứng yêu cầu đề cương',
            },
          ],
        },
      ]);

      await openOutlineReviewPage(page, context, envState.mainSupervisorToken);
      await page.locator('#statusTabs button[data-status="REJECTED"]').click();

      const row4 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_4.studentCode) });
      await expect(row4).toBeVisible();
      await row4.getByRole('button', { name: 'Góp ý', exact: true }).click();

      const modal = page.locator('#feedbackModal');
      await modal.locator('#feedbackContentInput').fill('Góp ý cho đề tài đã bị đình chỉ');
      const putPromise = page.waitForResponse(
        (r) =>
          r.url().includes(`/outline/${s4.outlinePublicId}/advisor-feedback`) &&
          r.request().method() === 'PUT',
      );
      await modal.locator('#btnSaveFeedback').click();
      const putRes = await putPromise;

      expect(putRes.status()).toBe(409);
      const putBody = await putRes.json();
      expect(putBody.code).toBe(3057);
      expect(putBody.message).toBe('Đề tài không ở trạng thái đang thực hiện');
      await expect(page.getByText('Đề tài không ở trạng thái đang thực hiện')).toBeVisible();

      const dbRows = await dbSelect<{ topic_status: string; advisor_feedback: string | null }>(
        `SELECT tt.status AS topic_status, o.advisor_feedback
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_4.studentCode, envState.semesterId],
      );
      expect(dbRows[0].topic_status).toBe('DISQUALIFIED');
      expect(dbRows[0].advisor_feedback).toBeNull();
    });

    test(ITC066.title, { annotation: ITC066.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống kiểm thử đóng hạn chấm trước khi lưu góp ý',
          submissions: [{ submissionNote: 'Bản nộp chờ góp ý' }],
        },
      ]);

      await openOutlineReviewPage(page, context, envState.mainSupervisorToken);
      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Góp ý', exact: true }).click();

      const modal = page.locator('#feedbackModal');
      await expect(modal).toBeVisible();

      // Đóng hạn chấm trước khi bấm Lưu nhận xét
      await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'CLOSED');

      await modal.locator('#feedbackContentInput').fill('Góp ý sau khi hết hạn chấm');
      const putPromise = page.waitForResponse(
        (r) =>
          r.url().includes(`/outline/${s1.outlinePublicId}/advisor-feedback`) &&
          r.request().method() === 'PUT',
      );
      await modal.locator('#btnSaveFeedback').click();
      const putRes = await putPromise;

      const expectedMsg =
        'Đã quá thời hạn giảng viên nhận xét đề cương, vui lòng liên hệ Trưởng bộ môn gia hạn';
      expect(putRes.status()).toBe(403);
      const putBody = await putRes.json();
      expect(putBody.code).toBe(3086);
      expect(putBody.message).toBe(expectedMsg);
      await expect(page.getByText(expectedMsg)).toBeVisible();

      const dbRows = await dbSelect<{ advisor_feedback: string | null }>(
        `SELECT o.advisor_feedback
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows[0].advisor_feedback).toBeNull();
    });

    test(ITC067.title, { annotation: ITC067.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Hệ thống kiểm thử hạn chưa mở trước khi lưu góp ý',
          submissions: [{ submissionNote: 'Bản nộp chờ góp ý' }],
        },
      ]);

      await openOutlineReviewPage(page, context, envState.mainSupervisorToken);
      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Góp ý', exact: true }).click();

      const modal = page.locator('#feedbackModal');
      await expect(modal).toBeVisible();

      // Đổi hạn sang chưa mở trước khi bấm Lưu nhận xét
      await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'NOT_STARTED');

      await modal.locator('#feedbackContentInput').fill('Góp ý trước thời điểm mở hạn');
      const putPromise = page.waitForResponse(
        (r) =>
          r.url().includes(`/outline/${s1.outlinePublicId}/advisor-feedback`) &&
          r.request().method() === 'PUT',
      );
      await modal.locator('#btnSaveFeedback').click();
      const putRes = await putPromise;

      const expectedMsg = 'Thời hạn sinh viên nộp đề cương chưa mở hoặc đã kết thúc';
      expect(putRes.status()).toBe(403);
      const putBody = await putRes.json();
      expect(putBody.code).toBe(3085);
      expect(putBody.message).toBe(expectedMsg);
      await expect(page.getByText(expectedMsg)).toBeVisible();

      const dbRows = await dbSelect<{ advisor_feedback: string | null }>(
        `SELECT o.advisor_feedback
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows[0].advisor_feedback).toBeNull();
    });

    // ========================================================================
    // SECURITY TEST CASES (TC-SEC-025 .. TC-SEC-030)
    // ========================================================================

    test(SEC025.title, { annotation: SEC025.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Đề tài kiểm thử truy cập ẩn danh',
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
        `${getApiBaseUrl()}/outline/supervisor-list?semesterId=${envState.semesterPublicId}`,
      );
      expect(listRes.status()).toBe(401);
      expect((await listRes.json()).code).toBe(2000);

      const fbRes = await request.put(`${getApiBaseUrl()}/outline/${s1.outlinePublicId}/advisor-feedback`, {
        headers: { 'Content-Type': 'application/json' },
        data: { feedback: 'Góp ý ẩn danh' },
      });
      expect(fbRes.status()).toBe(401);
      expect((await fbRes.json()).code).toBe(2000);
    });

    test(SEC026.title, { annotation: SEC026.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Đề tài kiểm thử phân quyền sinh viên',
          submissions: [{ submissionNote: 'Bản nộp kiểm thử phân quyền SV' }],
        },
      ]);

      await setAuthCookie(context, s1.studentToken);
      await page.goto('/lecturer/outline-review');
      await expect(
        page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.'),
      ).toBeVisible();

      const listRes = await apiCall(request, s1.studentToken, 'GET', '/outline/supervisor-list', {
        params: { semesterId: envState.semesterPublicId },
      });
      expect(listRes.status).toBe(403);
      expect(listRes.body.code).toBe(2001);
      expect(listRes.body.message).toBe('Tài khoản hiện tại không phải là giảng viên');

      const fbRes = await apiCall(
        request,
        s1.studentToken,
        'PUT',
        `/outline/${s1.outlinePublicId}/advisor-feedback`,
        { data: { feedback: 'Sinh viên tự góp ý trái phép' } },
      );
      expect(fbRes.status).toBe(403);
      expect(fbRes.body.code).toBe(2001);
      expect(fbRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');

      const dbRows = await dbSelect<{ advisor_feedback: string | null }>(
        `SELECT o.advisor_feedback
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows[0].advisor_feedback).toBeNull();
    });

    test(SEC027.title, { annotation: SEC027.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Đề tài kiểm thử phân quyền giảng viên thường',
          submissions: [{ submissionNote: 'Bản nộp kiểm thử phân quyền GV thường' }],
        },
      ]);

      await setAuthCookie(context, envState.plainLecturerToken);
      await page.goto('/lecturer/outline-review');
      await expect(
        page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.'),
      ).toBeVisible();

      const detailRes = await apiCall(
        request,
        envState.plainLecturerToken,
        'GET',
        `/outline/${s1.outlinePublicId}`,
      );
      expect(detailRes.status).toBe(403);
      expect(detailRes.body.code).toBe(2001);
      expect(detailRes.body.message).toBe('Bạn không có quyền truy cập thông tin đề cương này');

      const fbRes = await apiCall(
        request,
        envState.plainLecturerToken,
        'PUT',
        `/outline/${s1.outlinePublicId}/advisor-feedback`,
        { data: { feedback: 'Giảng viên thường gửi góp ý trái phép' } },
      );
      expect(fbRes.status).toBe(403);
      expect(fbRes.body.code).toBe(2001);
      expect(fbRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');

      const dbRows = await dbSelect<{ advisor_feedback: string | null }>(
        `SELECT o.advisor_feedback
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows[0].advisor_feedback).toBeNull();
    });

    test(SEC028.title, { annotation: SEC028.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Đề tài kiểm thử token đã đăng xuất',
          submissions: [{ submissionNote: 'Bản nộp kiểm thử logout token' }],
        },
      ]);

      const freshToken = await loginByEmail(request, TEST_MAIN_SUPERVISOR.email);
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

      const listRes = await apiCall(request, freshToken, 'GET', '/outline/supervisor-list', {
        params: { semesterId: envState.semesterPublicId },
      });
      expect(listRes.status).toBe(401);
      expect(listRes.body.code).toBe(2000);

      const fbRes = await apiCall(
        request,
        freshToken,
        'PUT',
        `/outline/${s1.outlinePublicId}/advisor-feedback`,
        { data: { feedback: 'Góp ý với token đã đăng xuất' } },
      );
      expect(fbRes.status).toBe(401);
      expect(fbRes.body.code).toBe(2000);

      const dbRows = await dbSelect<{ advisor_feedback: string | null }>(
        `SELECT o.advisor_feedback
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows[0].advisor_feedback).toBeNull();
    });

    test(SEC029.title, { annotation: SEC029.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Đề tài kiểm thử quyền đồng hướng dẫn',
          assignCoSupervisor: true,
          submissions: [{ submissionNote: 'Bản nộp kiểm thử đồng GVHD' }],
        },
      ]);

      await openOutlineReviewPage(page, context, envState.coSupervisorToken);
      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(row1).toBeVisible();
      await expect(row1).toContainText('Đồng GVHD (Chỉ xem)');
      await expect(row1.getByRole('button', { name: 'Góp ý', exact: true })).toHaveCount(0);

      const fbRes = await apiCall(
        request,
        envState.coSupervisorToken,
        'PUT',
        `/outline/${s1.outlinePublicId}/advisor-feedback`,
        { data: { feedback: 'Đồng hướng dẫn gửi góp ý trái phép' } },
      );
      expect(fbRes.status).toBe(403);
      expect(fbRes.body.code).toBe(2001);
      expect(fbRes.body.message).toBe(
        'Giảng viên đồng hướng dẫn chỉ có quyền xem, không có quyền ghi nhận xét đề cương',
      );

      const dbRows = await dbSelect<{ advisor_feedback: string | null }>(
        `SELECT o.advisor_feedback
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows[0].advisor_feedback).toBeNull();
    });

    test(SEC030.title, { annotation: SEC030.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithOutlines(request, [
        {
          profile: TEST_STUDENT_1,
          topicName: 'Đề tài thuộc GV999601 không cho GV999603 thao tác',
          submissions: [{ submissionNote: 'Bản nộp kiểm thử IDOR' }],
        },
      ]);

      await openOutlineReviewPage(page, context, envState.otherSupervisorToken);
      await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) })).toHaveCount(0);

      const detailRes = await apiCall(
        request,
        envState.otherSupervisorToken,
        'GET',
        `/outline/${s1.outlinePublicId}`,
      );
      expect(detailRes.status).toBe(403);
      expect(detailRes.body.code).toBe(2001);
      expect(detailRes.body.message).toBe('Bạn không có quyền truy cập thông tin đề cương này');

      const fbRes = await apiCall(
        request,
        envState.otherSupervisorToken,
        'PUT',
        `/outline/${s1.outlinePublicId}/advisor-feedback`,
        { data: { feedback: 'GVHD khác gửi góp ý trái phép' } },
      );
      expect(fbRes.status).toBe(403);
      expect(fbRes.body.code).toBe(2001);
      expect(fbRes.body.message).toBe('Bạn không có quyền nhận xét đề cương của đề tài này');

      const dbRows = await dbSelect<{ advisor_feedback: string | null }>(
        `SELECT o.advisor_feedback
           FROM thesis_outline o
           JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows[0].advisor_feedback).toBeNull();
    });
  });
});
