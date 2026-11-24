import { test, expect, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';
import { defineItc, defineItcSec } from '../../../support/integration-test-case';
import { apiCall, getApiBaseUrl, loginByEmail } from '../../../support/api';
import { dbSelect } from '../../../support/db';

// ============================================================================
// ĐẶC TẢ TEST CASE (ITC001..ITC016 & TC-SEC-010..TC-SEC-015)
// Feature: outline | Module/Sheet: DuyetTenDeTai
// Role: Giảng viên hướng dẫn (SUPERVISOR)
// ============================================================================

const ITC001 = defineItc({
  id: 'ITC001',
  feature: 'outline',
  module: 'DuyetTenDeTai',
  sheet: 'DuyetTenDeTai',
  fn: 'View and Filter Topic Title Requests',
  description: 'Verify that a main supervisor can view pending initial title and title change requests with accurate tab counters when the deadline is open',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Văn Hùng").\n' +
    '2. Open the "Duyệt tên đề tài" screen ("/lecturer/topic-proposals").',
  expected:
    '1. The API GET /api/v1/deadlines returns HTTP 200 with code = 1000 and an OPEN "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline.\n' +
    '2. The API GET /topic/title-request returns HTTP 200 with code = 1000 and 4 topic title requests for the current semester (2 PENDING, 1 APPROVED, 1 REJECTED), all with canReview = true.\n' +
    '3. The database contains 4 topic title history records for supervisor "GV999301" in the current semester (2 PENDING, 1 APPROVED, 1 REJECTED).\n' +
    '4. The "Chưa duyệt" tab is active and displays student "Trần Minh Tuấn" ("9990000301") with badge "Chốt tên lần đầu" and student "Lê Thu Hà" ("9990000302") with badge "Xin đổi tên đề tài", both with enabled "Duyệt" and "Từ chối" buttons; tab counters show "Chưa duyệt" = 2, "Đã duyệt" = 1, "Đã từ chối" = 1, and "Tất cả" = 4.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Main supervisor "Nguyễn Văn Hùng" ("GV999301") supervises 3 students in the current semester: "9990000301" has 1 PENDING initial title request, "9990000302" has 1 APPROVED initial title request and 1 PENDING title change request, and "9990000303" has 1 REJECTED initial title request.',
});

const ITC002 = defineItc({
  id: 'ITC002',
  feature: 'outline',
  module: 'DuyetTenDeTai',
  sheet: 'DuyetTenDeTai',
  fn: 'View and Filter Topic Title Requests',
  description: 'Verify that a supervisor can switch status tabs, search by student code, and see the empty state for a non-matching keyword',
  procedure:
    '1. Log in as a main Supervisor and open the "Duyệt tên đề tài" screen.\n' +
    '2. Click the "Đã duyệt" tab, then click the "Đã từ chối" tab, and then click the "Tất cả" tab.\n' +
    '3. Enter "9990000302" into the "Tìm theo tên SV, MSSV, tên đề tài..." search box.\n' +
    '4. Replace the search keyword with "KHONGTONTAI9999".',
  expected:
    '1. The API GET /topic/title-request returns HTTP 200 with code = 1000 and 4 records for the current semester.\n' +
    '2. The "Đã duyệt" tab displays student "Lê Thu Hà" ("9990000302") with badge "Đã duyệt"; the "Đã từ chối" tab displays student "Phạm Đức Anh" ("9990000303") with badge "Đã từ chối".\n' +
    '3. Searching "9990000302" under "Tất cả" displays only the 2 requests of student "Lê Thu Hà" ("9990000302").\n' +
    '4. Searching "KHONGTONTAI9999" displays empty state messages "Không có yêu cầu tên đề tài nào" and "Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Main supervisor "GV999301" has 2 PENDING ("9990000301", "9990000302"), 1 APPROVED ("9990000302"), and 1 REJECTED ("9990000303") topic title requests.',
});

const ITC003 = defineItc({
  id: 'ITC003',
  feature: 'outline',
  module: 'DuyetTenDeTai',
  sheet: 'DuyetTenDeTai',
  fn: 'View and Filter Topic Title Requests',
  description: 'Verify that a co-supervisor can view topic title requests in read-only mode without approve or reject buttons',
  procedure:
    '1. Log in as a Co-Supervisor ("Đỗ Thị Lan").\n' +
    '2. Open the "Duyệt tên đề tài" screen ("/lecturer/topic-proposals").',
  expected:
    '1. The API GET /topic/title-request returns HTTP 200 with code = 1000 and includes student "Trần Minh Tuấn" ("9990000301") with canReview = false.\n' +
    '2. The database confirms supervisor "GV999302" is assigned as the co-supervisor of student "9990000301"\'s thesis topic.\n' +
    '3. The row of student "Trần Minh Tuấn" displays badge "Đồng hướng dẫn (Chỉ xem)" and an enabled "Lịch sử" button, with no "Duyệt" or "Từ chối" buttons.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Trần Minh Tuấn" ("9990000301") has main supervisor "GV999301", co-supervisor "GV999302", and 1 PENDING initial title request.',
});

const ITC004 = defineItc({
  id: 'ITC004',
  feature: 'outline',
  module: 'DuyetTenDeTai',
  sheet: 'DuyetTenDeTai',
  fn: 'View and Filter Topic Title Requests',
  description: 'Verify that approve and reject buttons are disabled and a closed-deadline badge is displayed when the review deadline has closed',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Văn Hùng").\n' +
    '2. Open the "Duyệt tên đề tài" screen after the outline and topic title deadline has closed.',
  expected:
    '1. The API GET /api/v1/deadlines returns HTTP 200 with code = 1000 and the "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline in COMPLETED status.\n' +
    '2. The API GET /topic/title-request returns HTTP 200 with code = 1000 and includes student "Trần Minh Tuấn"\'s PENDING request.\n' +
    '3. The deadline banner displays "Đã hết hạn", and the "Duyệt" and "Từ chối" buttons on student "Trần Minh Tuấn"\'s row are disabled.',
  precondition:
    '1. An ongoing semester exists where the "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline is COMPLETED (past end date).\n' +
    '2. Main supervisor "GV999301" has a PENDING initial title request from student "Trần Minh Tuấn" ("9990000301").',
});

const ITC005 = defineItc({
  id: 'ITC005',
  feature: 'outline',
  module: 'DuyetTenDeTai',
  sheet: 'DuyetTenDeTai',
  fn: 'View and Filter Topic Title Requests',
  description: 'Verify that approve and reject buttons are disabled and a not-started deadline badge is displayed before the review period opens',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Văn Hùng").\n' +
    '2. Open the "Duyệt tên đề tài" screen while the outline and topic title deadline has not started yet.',
  expected:
    '1. The API GET /api/v1/deadlines returns HTTP 200 with code = 1000 and the "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline in NOT_STARTED status.\n' +
    '2. The API GET /topic/title-request returns HTTP 200 with code = 1000 and includes student "Trần Minh Tuấn"\'s PENDING request.\n' +
    '3. The deadline banner displays "Chưa mở", and the "Duyệt" and "Từ chối" buttons on student "Trần Minh Tuấn"\'s row are disabled.',
  precondition:
    '1. An ongoing semester exists where the "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline has a future start date (NOT_STARTED).\n' +
    '2. Main supervisor "GV999301" has a PENDING initial title request from student "Trần Minh Tuấn" ("9990000301").',
});

const ITC006 = defineItc({
  id: 'ITC006',
  feature: 'outline',
  module: 'DuyetTenDeTai',
  sheet: 'DuyetTenDeTai',
  fn: 'View Topic Title Change History',
  description: 'Verify that a supervisor can open the history modal and view the chronological title change timeline of a student\'s thesis topic',
  procedure:
    '1. Log in as a main Supervisor and open the "Duyệt tên đề tài" screen.\n' +
    '2. Click the "Lịch sử" button on the pending row of student "Lê Thu Hà" ("9990000302").',
  expected:
    '1. The API GET /topic/{topicPublicId}/title-history returns HTTP 200 with code = 1000 and 2 history records ordered newest first (PENDING title change followed by APPROVED initial confirmation).\n' +
    '2. The database contains 2 topic title history records for student "9990000302"\'s thesis topic.\n' +
    '3. The "Lịch sử thay đổi tên đề tài" modal displays student "Lê Thu Hà" ("9990000302"), entry "Xin đổi tên" with status "Chờ duyệt" and proposed title "Hệ thống quản lý thư viện số ứng dụng AI", and entry "Chốt tên lần đầu" with status "Đã duyệt", title "Hệ thống quản lý thư viện số", and reviewer "Nguyễn Văn Hùng".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Lê Thu Hà" ("9990000302") has 1 APPROVED initial title ("Hệ thống quản lý thư viện số") and 1 PENDING title change ("Hệ thống quản lý thư viện số ứng dụng AI").',
});

const ITC007 = defineItc({
  id: 'ITC007',
  feature: 'outline',
  module: 'DuyetTenDeTai',
  sheet: 'DuyetTenDeTai',
  fn: 'Approve Topic Title Request',
  description: 'Verify that a main supervisor can approve a pending initial title confirmation request when the deadline is open',
  procedure:
    '1. Log in as a main Supervisor and open the "Duyệt tên đề tài" screen.\n' +
    '2. Click "Duyệt" on the pending initial title row of student "Trần Minh Tuấn" ("9990000301").\n' +
    '3. In the "Xác nhận chốt tên đề tài lần đầu" modal, click "Xác nhận duyệt".',
  expected:
    '1. The API PUT /topic/title-request/{publicId}/review with decision = "APPROVED" returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Xử lý yêu cầu tên đề tài thành công".\n' +
    '3. The database updates the title request to APPROVED with reviewer "GV999301" and reviewed_at set, updates the student\'s official thesis title to "Hệ thống quản lý đồ án tốt nghiệp thông minh" at stage STAGE_2_TOPIC_CONFIRMED, and stores an approval notification for student "9990000301".\n' +
    '4. The UI shows toast "Đã duyệt tên đề tài cho sinh viên Trần Minh Tuấn thành công!", removes the row from "Chưa duyệt", and displays student "Trần Minh Tuấn" with badge "Đã duyệt" and reviewer "Nguyễn Văn Hùng" under the "Đã duyệt" tab.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Trần Minh Tuấn" ("9990000301") has no official title yet and 1 PENDING initial title request for "Hệ thống quản lý đồ án tốt nghiệp thông minh" supervised by "GV999301".',
});

const ITC008 = defineItc({
  id: 'ITC008',
  feature: 'outline',
  module: 'DuyetTenDeTai',
  sheet: 'DuyetTenDeTai',
  fn: 'Approve Topic Title Request',
  description: 'Verify that a main supervisor can approve a pending title change request and update the official thesis topic title',
  procedure:
    '1. Log in as a main Supervisor and open the "Duyệt tên đề tài" screen.\n' +
    '2. Click "Duyệt" on the pending title change row of student "Lê Thu Hà" ("9990000302").\n' +
    '3. In the "Xác nhận phê duyệt đổi tên đề tài" modal, click "Xác nhận duyệt".',
  expected:
    '1. The API PUT /topic/title-request/{publicId}/review with decision = "APPROVED" returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Xử lý yêu cầu tên đề tài thành công".\n' +
    '3. The database updates the title change request to APPROVED with reviewer "GV999301" and reviewed_at set, updates the student\'s official thesis title from "Hệ thống quản lý thư viện số" to "Hệ thống quản lý thư viện số ứng dụng AI" at stage STAGE_2_TOPIC_CONFIRMED, and stores an approval notification for student "9990000302".\n' +
    '4. The UI shows toast "Đã duyệt tên đề tài cho sinh viên Lê Thu Hà thành công!", removes the row from "Chưa duyệt", and displays the approved title change request under the "Đã duyệt" tab.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Lê Thu Hà" ("9990000302") has confirmed title "Hệ thống quản lý thư viện số" and 1 PENDING title change request to "Hệ thống quản lý thư viện số ứng dụng AI" supervised by "GV999301".',
});

const ITC009 = defineItc({
  id: 'ITC009',
  feature: 'outline',
  module: 'DuyetTenDeTai',
  sheet: 'DuyetTenDeTai',
  fn: 'Approve Topic Title Request',
  description: 'Verify that a main supervisor can approve a pending topic title request during the extended grading period',
  procedure:
    '1. Log in as a main Supervisor and open the "Duyệt tên đề tài" screen while the deadline is in EXTENDED grading status.\n' +
    '2. Click "Duyệt" on the pending row of student "Trần Minh Tuấn" ("9990000301").\n' +
    '3. In the "Xác nhận chốt tên đề tài lần đầu" modal, click "Xác nhận duyệt".',
  expected:
    '1. The API GET /api/v1/deadlines returns HTTP 200 with code = 1000 and status EXTENDED; the banner displays "Đã hết hạn nộp — Đang gia hạn chấm đến".\n' +
    '2. The API PUT /topic/title-request/{publicId}/review with decision = "APPROVED" returns HTTP 200 with code = 1000 and message "Xử lý yêu cầu tên đề tài thành công".\n' +
    '3. The database updates the request to APPROVED and sets student "9990000301"\'s official thesis title to "Hệ thống phân tích dữ liệu học tập trong kỳ gia hạn".\n' +
    '4. The UI displays toast "Đã duyệt tên đề tài cho sinh viên Trần Minh Tuấn thành công!" and moves the row to the "Đã duyệt" tab.',
  precondition:
    '1. An ongoing semester exists where the "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline is in EXTENDED status within its allowed date range.\n' +
    '2. Student "Trần Minh Tuấn" ("9990000301") has 1 PENDING initial title request submitted before the extension.',
});

const ITC010 = defineItc({
  id: 'ITC010',
  feature: 'outline',
  module: 'DuyetTenDeTai',
  sheet: 'DuyetTenDeTai',
  fn: 'Approve Topic Title Request',
  description: 'Verify that approving a topic title request is blocked when the request has already been processed prior to confirmation',
  procedure:
    '1. Log in as a main Supervisor, open the "Duyệt tên đề tài" screen, and click "Duyệt" on student "Trần Minh Tuấn"\'s row.\n' +
    '2. Concurrently in another session, the request is rejected so its status changes from PENDING to REJECTED.\n' +
    '3. Click "Xác nhận duyệt" in the "Xác nhận chốt tên đề tài lần đầu" modal.',
  expected:
    '1. The API PUT /topic/title-request/{publicId}/review returns HTTP 409 with code = 3052.\n' +
    '2. The response message is "Yêu cầu này đã được xử lý trước đó".\n' +
    '3. The database retains the request in REJECTED status and keeps student "9990000301"\'s official thesis title as NULL.\n' +
    '4. The UI displays error toast "Yêu cầu này đã được xử lý trước đó".',
  precondition:
    '1. Main supervisor "GV999301" opens the approve modal while student "9990000301"\'s initial title request is PENDING, and the request is concurrently rejected before confirmation.',
});

const ITC011 = defineItc({
  id: 'ITC011',
  feature: 'outline',
  module: 'DuyetTenDeTai',
  sheet: 'DuyetTenDeTai',
  fn: 'Approve Topic Title Request',
  description: 'Verify that approving an initial title request is blocked when the grading deadline closes before confirmation',
  procedure:
    '1. Log in as a main Supervisor, open the "Duyệt tên đề tài" screen, and click "Duyệt" on student "Trần Minh Tuấn"\'s initial title row.\n' +
    '2. The "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline closes before clicking confirm.\n' +
    '3. Click "Xác nhận duyệt" in the "Xác nhận chốt tên đề tài lần đầu" modal.',
  expected:
    '1. The API PUT /topic/title-request/{publicId}/review returns HTTP 403 with code = 3055.\n' +
    '2. The response message is "Đã quá thời hạn giảng viên xác nhận tên đề tài, vui lòng liên hệ Trưởng bộ môn gia hạn chấm".\n' +
    '3. The database keeps the request in PENDING status with reviewed_at = NULL and keeps student "9990000301"\'s official thesis title as NULL.\n' +
    '4. The UI displays error toast "Đã quá thời hạn giảng viên xác nhận tên đề tài, vui lòng liên hệ Trưởng bộ môn gia hạn chấm".',
  precondition:
    '1. Main supervisor "GV999301" opens the approve modal while the deadline is OPEN, and the deadline transitions to COMPLETED before confirmation.',
});

const ITC012 = defineItc({
  id: 'ITC012',
  feature: 'outline',
  module: 'DuyetTenDeTai',
  sheet: 'DuyetTenDeTai',
  fn: 'Approve Topic Title Request',
  description: 'Verify that approving a title change request is blocked with the title-change error message when the grading deadline closes before confirmation',
  procedure:
    '1. Log in as a main Supervisor, open the "Duyệt tên đề tài" screen, and click "Duyệt" on student "Lê Thu Hà"\'s title change row.\n' +
    '2. The "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline closes before clicking confirm.\n' +
    '3. Click "Xác nhận duyệt" in the "Xác nhận phê duyệt đổi tên đề tài" modal.',
  expected:
    '1. The API PUT /topic/title-request/{publicId}/review returns HTTP 403 with code = 3055.\n' +
    '2. The response message is "Đã quá thời hạn giảng viên xác nhận yêu cầu đổi tên đề tài, vui lòng liên hệ Trưởng bộ môn gia hạn chấm".\n' +
    '3. The database keeps the title change request in PENDING status with reviewed_at = NULL and preserves student "9990000302"\'s official thesis title "Hệ thống quản lý thư viện số".\n' +
    '4. The UI displays error toast "Đã quá thời hạn giảng viên xác nhận yêu cầu đổi tên đề tài, vui lòng liên hệ Trưởng bộ môn gia hạn chấm".',
  precondition:
    '1. Main supervisor "GV999301" opens the approve modal on student "9990000302"\'s PENDING title change request while the deadline is OPEN, and the deadline transitions to COMPLETED before confirmation.',
});

const ITC013 = defineItc({
  id: 'ITC013',
  feature: 'outline',
  module: 'DuyetTenDeTai',
  sheet: 'DuyetTenDeTai',
  fn: 'Reject Topic Title Request',
  description: 'Verify that a main supervisor can reject a pending initial title confirmation request without updating the thesis topic title',
  procedure:
    '1. Log in as a main Supervisor and open the "Duyệt tên đề tài" screen.\n' +
    '2. Click "Từ chối" on the pending initial title row of student "Trần Minh Tuấn" ("9990000301").\n' +
    '3. In the "Xác nhận từ chối yêu cầu tên đề tài" modal, click "Xác nhận từ chối".',
  expected:
    '1. The API PUT /topic/title-request/{publicId}/review with decision = "REJECTED" returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Xử lý yêu cầu tên đề tài thành công".\n' +
    '3. The database updates the title request to REJECTED with reviewer "GV999301" and reviewed_at set, leaves student "9990000301"\'s official thesis title as NULL, and stores a rejection notification for student "9990000301".\n' +
    '4. The UI shows toast "Đã từ chối yêu cầu tên đề tài của sinh viên Trần Minh Tuấn!", removes the row from "Chưa duyệt", and displays student "Trần Minh Tuấn" with badge "Đã từ chối" under the "Đã từ chối" tab.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Trần Minh Tuấn" ("9990000301") has no official title yet and 1 PENDING initial title request supervised by "GV999301".',
});

const ITC014 = defineItc({
  id: 'ITC014',
  feature: 'outline',
  module: 'DuyetTenDeTai',
  sheet: 'DuyetTenDeTai',
  fn: 'Reject Topic Title Request',
  description: 'Verify that a main supervisor can reject a pending title change request while preserving the student\'s existing official title',
  procedure:
    '1. Log in as a main Supervisor and open the "Duyệt tên đề tài" screen.\n' +
    '2. Click "Từ chối" on the pending title change row of student "Lê Thu Hà" ("9990000302").\n' +
    '3. In the "Xác nhận từ chối yêu cầu tên đề tài" modal, click "Xác nhận từ chối".',
  expected:
    '1. The API PUT /topic/title-request/{publicId}/review with decision = "REJECTED" returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Xử lý yêu cầu tên đề tài thành công".\n' +
    '3. The database updates the title change request to REJECTED with reviewer "GV999301" and reviewed_at set, preserves student "9990000302"\'s official thesis title as "Hệ thống quản lý thư viện số", and stores a rejection notification for student "9990000302".\n' +
    '4. The UI shows toast "Đã từ chối yêu cầu tên đề tài của sinh viên Lê Thu Hà!", removes the row from "Chưa duyệt", and displays the rejected request under the "Đã từ chối" tab.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Lê Thu Hà" ("9990000302") has confirmed title "Hệ thống quản lý thư viện số" and 1 PENDING title change request supervised by "GV999301".',
});

const ITC015 = defineItc({
  id: 'ITC015',
  feature: 'outline',
  module: 'DuyetTenDeTai',
  sheet: 'DuyetTenDeTai',
  fn: 'Reject Topic Title Request',
  description: 'Verify that rejecting a topic title request is blocked when the request has already been processed prior to confirmation',
  procedure:
    '1. Log in as a main Supervisor, open the "Duyệt tên đề tài" screen, and click "Từ chối" on student "Trần Minh Tuấn"\'s row.\n' +
    '2. Concurrently in another session, the request is approved so its status changes from PENDING to APPROVED.\n' +
    '3. Click "Xác nhận từ chối" in the "Xác nhận từ chối yêu cầu tên đề tài" modal.',
  expected:
    '1. The API PUT /topic/title-request/{publicId}/review returns HTTP 409 with code = 3052.\n' +
    '2. The response message is "Yêu cầu này đã được xử lý trước đó".\n' +
    '3. The database retains the request in APPROVED status and preserves student "9990000301"\'s approved official title.\n' +
    '4. The UI displays error toast "Yêu cầu này đã được xử lý trước đó".',
  precondition:
    '1. Main supervisor "GV999301" opens the reject modal while student "9990000301"\'s initial title request is PENDING, and the request is concurrently approved before confirmation.',
});

const ITC016 = defineItc({
  id: 'ITC016',
  feature: 'outline',
  module: 'DuyetTenDeTai',
  sheet: 'DuyetTenDeTai',
  fn: 'Reject Topic Title Request',
  description: 'Verify that rejecting a pending topic title request is blocked when the grading deadline closes before confirmation',
  procedure:
    '1. Log in as a main Supervisor, open the "Duyệt tên đề tài" screen, and click "Từ chối" on student "Trần Minh Tuấn"\'s row.\n' +
    '2. The "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline closes before clicking confirm.\n' +
    '3. Click "Xác nhận từ chối" in the "Xác nhận từ chối yêu cầu tên đề tài" modal.',
  expected:
    '1. The API PUT /topic/title-request/{publicId}/review returns HTTP 403 with code = 3055.\n' +
    '2. The response message is "Đã quá thời hạn giảng viên xác nhận tên đề tài, vui lòng liên hệ Trưởng bộ môn gia hạn chấm".\n' +
    '3. The database keeps the request in PENDING status with reviewed_at = NULL.\n' +
    '4. The UI displays error toast "Đã quá thời hạn giảng viên xác nhận tên đề tài, vui lòng liên hệ Trưởng bộ môn gia hạn chấm".',
  precondition:
    '1. Main supervisor "GV999301" opens the reject modal while the deadline is OPEN, and the deadline transitions to COMPLETED before confirmation.',
});

// ============================================================================
// SECURITY TEST CASES (TC-SEC-010 .. TC-SEC-015)
// ============================================================================

const SEC010 = defineItcSec({
  id: 'TC-SEC-010',
  feature: 'outline',
  module: 'DuyetTenDeTai',
  sheet: 'DuyetTenDeTai',
  scenario: 'An unauthenticated user opens the topic title approval screen directly',
  roleSession: 'Unauthenticated (Anonymous)',
  technique: 'EP',
  given: 'The browser has no active login session (no access_token cookie)',
  when: 'Open "/lecturer/topic-proposals" directly on the Lecturer portal and call GET /topic/title-request',
  then: 'GET /my-info and GET /topic/title-request return HTTP 401 with code = 2000; the UI automatically redirects to "/login" and displays no topic title request data',
});

const SEC011 = defineItcSec({
  id: 'TC-SEC-011',
  feature: 'outline',
  module: 'DuyetTenDeTai',
  sheet: 'DuyetTenDeTai',
  scenario: 'A student accesses the topic title approval screen and invokes supervisor topic review APIs',
  roleSession: 'Student (STUDENT), logged in',
  technique: 'EP',
  given: 'Logged in with a Student account (without SUPERVISOR role or REVIEW_TOPIC authority)',
  when: 'Open "/lecturer/topic-proposals" directly on the Lecturer portal and call GET /topic/title-request and PUT /topic/title-request/{publicId}/review',
  then: 'The UI blocks access with message "Tài khoản của bạn không có quyền truy cập cổng cán bộ."; both APIs return HTTP 403 with code = 2001 and message "Bạn không có quyền truy cập (access denied)", and the request remains PENDING in the database',
});

const SEC012 = defineItcSec({
  id: 'TC-SEC-012',
  feature: 'outline',
  module: 'DuyetTenDeTai',
  sheet: 'DuyetTenDeTai',
  scenario: 'A lecturer not assigned as a supervisor accesses the topic title approval screen and calls supervisor review APIs',
  roleSession: 'Lecturer (LECTURER), logged in',
  technique: 'EP',
  given: 'Logged in with a Lecturer account not assigned as a supervisor in the semester (without SUPERVISOR role)',
  when: 'Open "/lecturer/topic-proposals" directly on the Lecturer portal and call GET /topic/title-request and PUT /topic/title-request/{publicId}/review',
  then: 'The UI blocks access with message "Tài khoản của bạn không có quyền truy cập cổng cán bộ."; both APIs return HTTP 403 with code = 2001 and message "Bạn không có quyền truy cập (access denied)", and the request remains PENDING in the database',
});

const SEC013 = defineItcSec({
  id: 'TC-SEC-013',
  feature: 'outline',
  module: 'DuyetTenDeTai',
  sheet: 'DuyetTenDeTai',
  scenario: 'A supervisor session with a logged-out token accesses the topic title approval screen and review API',
  roleSession: 'Supervisor (SUPERVISOR), logged-out token',
  technique: 'STATE_TRANSITION',
  given: 'The supervisor has logged out via POST /log-out so the token is invalidated, while the browser still sends the old access_token cookie',
  when: 'Open "/lecturer/topic-proposals" and call GET /topic/title-request and PUT /topic/title-request/{publicId}/review with the logged-out token',
  then: 'GET /my-info, GET /topic/title-request, and PUT /topic/title-request/{publicId}/review return HTTP 401 with code = 2000; the UI redirects to "/login", displays no data, and the request remains PENDING in the database',
});

const SEC014 = defineItcSec({
  id: 'TC-SEC-014',
  feature: 'outline',
  module: 'DuyetTenDeTai',
  sheet: 'DuyetTenDeTai',
  scenario: 'A co-supervisor attempts to approve or reject a topic title request via direct API despite read-only UI',
  roleSession: 'Co-Supervisor (SUPERVISOR), logged in as co-lecturer',
  technique: 'DECISION_TABLE',
  given: 'Supervisor "GV999302" is assigned as the co-supervisor (not the main supervisor) of student "9990000301"\'s thesis topic with a PENDING initial title request',
  when: 'Open "/lecturer/topic-proposals" as Co-Supervisor "GV999302" and invoke PUT /topic/title-request/{publicId}/review with APPROVED and REJECTED decisions',
  then: 'The UI displays badge "Đồng hướng dẫn (Chỉ xem)" with no "Duyệt" or "Từ chối" buttons; both review API calls return HTTP 403 with code = 2001 and message "Giảng viên đồng hướng dẫn chỉ có quyền xem, không có quyền duyệt tên đề tài", and the request remains PENDING in the database',
});

const SEC015 = defineItcSec({
  id: 'TC-SEC-015',
  feature: 'outline',
  module: 'DuyetTenDeTai',
  sheet: 'DuyetTenDeTai',
  scenario: 'An unrelated supervisor attempts to view history or review a topic title request belonging to another supervisor\'s student',
  roleSession: 'Supervisor (SUPERVISOR), logged in as unrelated supervisor',
  technique: 'ERROR_GUESSING',
  given: 'Supervisor "GV999303" is logged in while student "9990000301" is supervised by "GV999301" and has a PENDING topic title request',
  when: 'Open "/lecturer/topic-proposals" as Supervisor "GV999303" and invoke GET /topic/{topicPublicId}/title-history and PUT /topic/title-request/{publicId}/review targeting student "9990000301"\'s topic',
  then: 'Student "9990000301" is not displayed in Supervisor "GV999303"\'s list; GET /topic/{topicPublicId}/title-history returns HTTP 403 with code = 2001 and message "Bạn không có quyền truy cập thông tin đề tài này"; PUT /topic/title-request/{publicId}/review returns HTTP 403 with code = 2001 and message "Bạn không có quyền xử lý yêu cầu của đề tài này", and the request remains PENDING in the database',
});

// ============================================================================
// HẠ TẦNG DỮ LIỆU TEST (TẠO QUA API, ĐỐI CHIẾU DB SELECT, DỌN SẠCH SAU TEST)
// ============================================================================

const TEST_MAIN_SUPERVISOR = {
  teacherCode: 'GV999301',
  firstName: 'Nguyễn Văn',
  lastName: 'Hùng',
  fullName: 'Nguyễn Văn Hùng',
  email: 'itc.topic.gv.999301@tlu.edu.vn',
  phone: '0989930301',
  academicTitle: 'TS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_CO_SUPERVISOR = {
  teacherCode: 'GV999302',
  firstName: 'Đỗ Thị',
  lastName: 'Lan',
  fullName: 'Đỗ Thị Lan',
  email: 'itc.topic.gv.999302@tlu.edu.vn',
  phone: '0989930302',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_OTHER_SUPERVISOR = {
  teacherCode: 'GV999303',
  firstName: 'Lê Hoàng',
  lastName: 'Long',
  fullName: 'Lê Hoàng Long',
  email: 'itc.topic.gv.999303@tlu.edu.vn',
  phone: '0989930303',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_PLAIN_LECTURER = {
  teacherCode: 'GV999304',
  firstName: 'Vũ Minh',
  lastName: 'Tuấn',
  fullName: 'Vũ Minh Tuấn',
  email: 'itc.topic.gv.999304@tlu.edu.vn',
  phone: '0989930304',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_ARCHIVE_SUPERVISOR = {
  teacherCode: 'GV999399',
  firstName: 'Trần Lưu',
  lastName: 'Trữ',
  fullName: 'Trần Lưu Trữ',
  email: 'itc.topic.gv.999399@tlu.edu.vn',
  phone: '0989930399',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_STUDENT_1 = {
  studentCode: '9990000301',
  firstName: 'Trần Minh',
  lastName: 'Tuấn',
  fullName: 'Trần Minh Tuấn',
  email: 'itc.topic.sv.9990000301@gmail.com',
  phone: '0989930101',
  batch: 'K64',
  className: '64HTTT99',
};

const TEST_STUDENT_2 = {
  studentCode: '9990000302',
  firstName: 'Lê Thu',
  lastName: 'Hà',
  fullName: 'Lê Thu Hà',
  email: 'itc.topic.sv.9990000302@gmail.com',
  phone: '0989930102',
  batch: 'K64',
  className: '64HTTT99',
};

const TEST_STUDENT_3 = {
  studentCode: '9990000303',
  firstName: 'Phạm Đức',
  lastName: 'Anh',
  fullName: 'Phạm Đức Anh',
  email: 'itc.topic.sv.9990000303@gmail.com',
  phone: '0989930103',
  batch: 'K64',
  className: '64HTTT99',
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

interface ProvisionStudentSpec {
  profile: StudentProfile;
  assignCoSupervisor?: boolean;
  /** Yêu cầu chốt tên lần đầu (oldName = null) */
  initialRequest?: {
    newName: string;
    reviewDecision?: 'APPROVED' | 'REJECTED';
  };
  /** Yêu cầu đổi tên tiếp theo (cần initialRequest đã APPROVED hoặc initialOfficialTitle) */
  changeRequest?: {
    newName: string;
    reviewDecision?: 'APPROVED' | 'REJECTED';
  };
}

interface ProvisionedStudentHandle {
  profile: StudentProfile;
  studentPublicId: string;
  studentToken: string;
  topicPublicId: string;
  initialHistoryPublicId?: string;
  changeHistoryPublicId?: string;
  latestHistoryPublicId?: string;
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
    // CLOSED
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

  // Đồng bộ lại deadlineId nếu vừa tạo mới
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
    await apiCall(request, envState.hodToken, 'POST', `/semesters/${envState.semesterPublicId}/advisors`, {
      data: {
        teacherIds: [teacherId],
        maxStudentsPerTeacher: maxStudents,
      },
    });
    await apiCall(
      request,
      envState.hodToken,
      'PUT',
      `/semesters/${envState.semesterPublicId}/advisors/${teacherId}/quota`,
      { data: { maxStudents } },
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
    // Đảm bảo giảng viên thường không có trong danh sách GVHD kỳ này
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

/**
 * Thu hồi các sinh viên test cũ thuộc ngành cô lập đang gắn với GVHD chính/phụ
 * để đảm bảo danh sách yêu cầu của GVHD chính luôn trống sạch trước mỗi test.
 */
async function sweepResidualTopicsInIsolatedMajor(request: APIRequestContext) {
  // Mở hạn duyệt đề tài để từ chối hết yêu cầu PENDING còn sót của GV999301
  await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'OPEN');
  const reqRes = await apiCall(request, envState.mainSupervisorToken, 'GET', '/topic/title-request', {
    params: { semesterId: envState.semesterPublicId, status: 'PENDING' },
  });
  for (const item of reqRes.body?.data ?? []) {
    if (String(item.studentCode || '').startsWith('999')) {
      await apiCall(request, envState.mainSupervisorToken, 'PUT', `/topic/title-request/${item.publicId}/review`, {
        data: { decision: 'REJECTED' },
      });
    }
  }

  // Đảm bảo danh sách phân công đang mở khóa và đã qua hạn ĐK GVHD để chuyển đề tài về GV lưu trữ
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

  // Chuyển toàn bộ sinh viên test 999% đang gắn với GV999301/GV999302/chưa có GV trong ngành cô lập sang GV lưu trữ
  const wsRes = await apiCall(
    request,
    envState.hodToken,
    'GET',
    `/semesters/${envState.semesterPublicId}/advisor-assignments`,
  );
  const students: any[] = wsRes.body?.data?.students ?? [];
  for (const st of students) {
    if (!String(st.studentCode || '').startsWith('999')) continue;
    if (st.coSupervisorPublicId) {
      await apiCall(
        request,
        envState.hodToken,
        'PUT',
        `/semesters/${envState.semesterPublicId}/advisor-assignments/students/${st.studentPublicId}/co-supervisor`,
        { data: { coTeacherPublicId: null } },
      );
    }
    if (st.supervisorPublicId !== envState.archiveSupervisorPublicId) {
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
      studentCode: `9997${suffix.slice(-6)}`,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: `itc.arch.topic.sv.${suffix}@gmail.com`,
      phone: `0976${suffix.slice(-6)}`,
      batch: profile.batch,
      className: profile.className,
    },
  });
}

async function provisionStudentsWithTopicRequests(
  request: APIRequestContext,
  specs: ProvisionStudentSpec[],
): Promise<ProvisionedStudentHandle[]> {
  await sweepResidualTopicsInIsolatedMajor(request);

  // 1. Mở hạn ĐK GVHD để tạo SV, SV gửi đơn (topicName = null) và GVHD chính duyệt sơ bộ
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
      topicPublicId: '',
    });
  }

  activeHandles.push(...handles);

  // 2. Gán đồng hướng dẫn (nếu có), chốt danh sách phân công GVHD cho ngành cô lập rồi mở khóa lại ngay
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

  // Chốt để đề tài chuyển sang STAGE_2_TOPIC_CONFIRMED với lecturer = GV999301 và name = null
  await setLockStatus(request, true);
  await setLockStatus(request, false);

  // 3. Mở hạn đề cương & chốt tên để sinh viên nộp yêu cầu chốt tên / đổi tên thật qua API
  await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'OPEN');

  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    const h = handles[i];

    if (spec.initialRequest) {
      const initRes = await apiCall(request, h.studentToken, 'POST', '/topic/confirm-title', {
        data: { newName: spec.initialRequest.newName },
      });
      if (initRes.status !== 200) {
        throw new Error(`SV ${h.profile.studentCode} không thể chốt tên lần đầu: ${JSON.stringify(initRes.body)}`);
      }

      const ovRes = await apiCall(request, h.studentToken, 'GET', '/topic/my-title-history', {
        params: { semesterId: envState.semesterPublicId },
      });
      h.topicPublicId = ovRes.body?.data?.topicPublicId ?? '';
      const latest = ovRes.body?.data?.histories?.[0];
      h.initialHistoryPublicId = latest?.publicId;
      h.latestHistoryPublicId = latest?.publicId;

      if (spec.initialRequest.reviewDecision && h.initialHistoryPublicId) {
        const revRes = await apiCall(
          request,
          envState.mainSupervisorToken,
          'PUT',
          `/topic/title-request/${h.initialHistoryPublicId}/review`,
          { data: { decision: spec.initialRequest.reviewDecision } },
        );
        if (revRes.status !== 200) {
          throw new Error(`Không thể duyệt sẵn yêu cầu đầu cho SV ${h.profile.studentCode}: ${JSON.stringify(revRes.body)}`);
        }
      }
    }

    if (spec.changeRequest) {
      const chgRes = await apiCall(request, h.studentToken, 'POST', '/topic/change-title', {
        data: { newName: spec.changeRequest.newName },
      });
      if (chgRes.status !== 200) {
        throw new Error(`SV ${h.profile.studentCode} không thể gửi yêu cầu đổi tên: ${JSON.stringify(chgRes.body)}`);
      }

      const ovRes = await apiCall(request, h.studentToken, 'GET', '/topic/my-title-history', {
        params: { semesterId: envState.semesterPublicId },
      });
      h.topicPublicId = ovRes.body?.data?.topicPublicId ?? h.topicPublicId;
      const latest = ovRes.body?.data?.histories?.[0];
      h.changeHistoryPublicId = latest?.publicId;
      h.latestHistoryPublicId = latest?.publicId;

      if (spec.changeRequest.reviewDecision && h.changeHistoryPublicId) {
        const revRes = await apiCall(
          request,
          envState.mainSupervisorToken,
          'PUT',
          `/topic/title-request/${h.changeHistoryPublicId}/review`,
          { data: { decision: spec.changeRequest.reviewDecision } },
        );
        if (revRes.status !== 200) {
          throw new Error(`Không thể duyệt sẵn yêu cầu đổi tên cho SV ${h.profile.studentCode}: ${JSON.stringify(revRes.body)}`);
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

  // Xoay mã/email/SĐT để giải phóng bộ mã SV 9990000301..303 cho test kế tiếp
  for (const h of handles) {
    const suffix = `${String(Date.now()).slice(-5)}${rotateCounter++}`;
    await apiCall(request, envState.hodToken, 'PUT', `/student/${h.studentPublicId}`, {
      data: {
        studentCode: `9997${suffix.slice(-6)}`,
        firstName: h.profile.firstName,
        lastName: h.profile.lastName,
        email: `itc.arch.topic.sv.${suffix}@gmail.com`,
        phone: `0976${suffix.slice(-6)}`,
        batch: h.profile.batch,
        className: h.profile.className,
      },
    });
  }
}

async function openTopicProposalsPage(page: Page, context: BrowserContext, token: string) {
  await setAuthCookie(context, token);

  const deadlinePromise = page.waitForResponse(
    (r) =>
      r.url().includes('/api/v1/deadlines') &&
      r.url().includes(`semesterId=${envState.semesterPublicId}`) &&
      r.request().method() === 'GET',
  );
  const requestsPromise = page.waitForResponse(
    (r) =>
      r.url().includes('/topic/title-request') &&
      r.url().includes(`semesterId=${envState.semesterPublicId}`) &&
      r.request().method() === 'GET',
  );

  await page.goto('/lecturer/topic-proposals');
  const [deadlineRes, requestsRes] = await Promise.all([deadlinePromise, requestsPromise]);
  return { deadlineRes, requestsRes };
}

test.describe('Report 5.2 - Supervisor Approve/Reject Topic Title Requests (DuyetTenDeTai)', () => {
  test.beforeAll(async ({ request }) => {
    const hodFallbackEmail = process.env.E2E_EMAIL_HEAD_OF_MAJOR?.trim();
    if (!hodFallbackEmail) {
      throw new Error('Thiếu E2E_EMAIL_HEAD_OF_MAJOR trong .env.e2e');
    }
    const hodFallbackToken = await loginByEmail(request, hodFallbackEmail);

    // 1. Lấy học kỳ hiện tại đang ONGOING
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

    // 2. Chọn ngành không có sinh viên thật (chỉ dữ liệu test) để khóa/mở khóa phân công GVHD hoàn toàn cô lập
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

    // 3. Lưu lại cấu hình gốc của 3 mốc giai đoạn Giao nhận để khôi phục sau toàn bộ suite
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
      archiveSupervisorId: 0,
      archiveSupervisorPublicId: '',
      dlDangKy: findSnap('DANG_KY_GVHD'),
      dlTbmChot: findSnap('TBM_CHOT_DS_GVHD_DU_KIEN'),
      dlDeCuong: findSnap('SV_CHINH_SUA_NOP_LAI_DE_CUONG'),
    };

    // 4. Tạo các giảng viên kiểm thử sạch trong ngành cô lập
    const mainSup = await ensureTeacher(request, TEST_MAIN_SUPERVISOR, true, 20);
    envState.mainSupervisorId = mainSup.id;
    envState.mainSupervisorPublicId = mainSup.publicId;
    envState.mainSupervisorToken = mainSup.token;

    const coSup = await ensureTeacher(request, TEST_CO_SUPERVISOR, true, 20);
    envState.coSupervisorId = coSup.id;
    envState.coSupervisorPublicId = coSup.publicId;
    envState.coSupervisorToken = coSup.token;

    const otherSup = await ensureTeacher(request, TEST_OTHER_SUPERVISOR, true, 5);
    envState.otherSupervisorId = otherSup.id;
    envState.otherSupervisorPublicId = otherSup.publicId;
    envState.otherSupervisorToken = otherSup.token;

    const plainLec = await ensureTeacher(request, TEST_PLAIN_LECTURER, false);
    envState.plainLecturerId = plainLec.id;
    envState.plainLecturerToken = plainLec.token;

    const archiveSup = await ensureTeacher(request, TEST_ARCHIVE_SUPERVISOR, true, 500);
    envState.archiveSupervisorId = archiveSup.id;
    envState.archiveSupervisorPublicId = archiveSup.publicId;
  });

  test.afterAll(async ({ request }) => {
    if (!envState) return;
    try {
      await cleanupActiveStudents(request);
    } catch {
      // bỏ qua lỗi phụ khi dọn cuối bộ test
    }

    // Gỡ bỏ các giảng viên không còn gắn dữ liệu đồ án (co-supervisor, unrelated supervisor, plain lecturer)
    for (const tId of [envState.coSupervisorId, envState.otherSupervisorId, envState.plainLecturerId]) {
      if (!tId) continue;
      await apiCall(request, envState.hodToken, 'DELETE', `/semesters/${envState.semesterPublicId}/advisors/${tId}`);
      await apiCall(request, envState.hodToken, 'DELETE', `/teacher/${tId}`);
    }

    // Khôi phục lại 3 mốc deadline và trạng thái khóa phân công ban đầu
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
  // NHÓM CHỈ ĐỌC: DANH SÁCH, TAB, TÌM KIẾM, CO-SUPERVISOR, DEADLINE, LỊCH SỬ (ITC001..ITC006)
  // ==========================================================================
  test.describe('Read-only views, filtering, co-supervisor, deadlines, and history modal (ITC001..ITC006)', () => {
    let student2Handle: ProvisionedStudentHandle;

    test.beforeAll(async ({ request }) => {
      const handles = await provisionStudentsWithTopicRequests(request, [
        {
          profile: TEST_STUDENT_1,
          assignCoSupervisor: true,
          initialRequest: {
            newName: 'Hệ thống quản lý đồ án tốt nghiệp thông minh',
          },
        },
        {
          profile: TEST_STUDENT_2,
          initialRequest: {
            newName: 'Hệ thống quản lý thư viện số',
            reviewDecision: 'APPROVED',
          },
          changeRequest: {
            newName: 'Hệ thống quản lý thư viện số ứng dụng AI',
          },
        },
        {
          profile: TEST_STUDENT_3,
          initialRequest: {
            newName: 'Hệ thống thương mại điện tử đa nền tảng',
            reviewDecision: 'REJECTED',
          },
        },
      ]);
      student2Handle = handles[1];
    });

    test.afterEach(async ({ request }) => {
      await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'OPEN');
    });

    test.afterAll(async ({ request }) => {
      await cleanupActiveStudents(request);
    });

    test(ITC001.title, { annotation: ITC001.annotation }, async ({ page, context }) => {
      const { deadlineRes, requestsRes } = await openTopicProposalsPage(
        page,
        context,
        envState.mainSupervisorToken,
      );

      expect(deadlineRes.status()).toBe(200);
      const dlBody = await deadlineRes.json();
      expect(dlBody.code).toBe(1000);
      const outlineDl = (dlBody.data?.giaoNhanDeadlines ?? []).find(
        (d: any) => d.code === 'SV_CHINH_SUA_NOP_LAI_DE_CUONG',
      );
      expect(outlineDl?.status).toBe('IN_PROGRESS');

      expect(requestsRes.status()).toBe(200);
      const reqBody = await requestsRes.json();
      expect(reqBody.code).toBe(1000);
      const items: any[] = reqBody.data ?? [];
      expect(items).toHaveLength(4);
      expect(items.every((i) => i.canReview === true)).toBe(true);

      // Kiểm tra giao diện tab Chưa duyệt và số đếm 4 tab
      await expect(page.getByText('(Đang mở)')).toBeVisible();
      await expect(page.getByRole('button', { name: /^Chưa duyệt/ })).toContainText('2');
      await expect(page.getByRole('button', { name: /^Đã duyệt/ })).toContainText('1');
      await expect(page.getByRole('button', { name: /^Đã từ chối/ })).toContainText('1');
      await expect(page.getByRole('button', { name: /^Tất cả/ })).toContainText('4');

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(row1).toBeVisible();
      await expect(row1).toContainText(TEST_STUDENT_1.fullName);
      await expect(row1).toContainText('Chốt tên lần đầu');
      await expect(row1).toContainText('Hệ thống quản lý đồ án tốt nghiệp thông minh');
      await expect(row1.getByRole('button', { name: 'Duyệt', exact: true })).toBeEnabled();
      await expect(row1.getByRole('button', { name: 'Từ chối', exact: true })).toBeEnabled();

      const row2 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) });
      await expect(row2).toBeVisible();
      await expect(row2).toContainText(TEST_STUDENT_2.fullName);
      await expect(row2).toContainText('Xin đổi tên đề tài');
      await expect(row2).toContainText('Hệ thống quản lý thư viện số ứng dụng AI');
      await expect(row2).toContainText('Hệ thống quản lý thư viện số');
      await expect(row2.getByRole('button', { name: 'Duyệt', exact: true })).toBeEnabled();
      await expect(row2.getByRole('button', { name: 'Từ chối', exact: true })).toBeEnabled();

      // Đối chiếu DB bằng SELECT
      const dbRows = await dbSelect<{ status: string; total: number }>(
        `SELECT h.status, COUNT(*) AS total
           FROM topic_title_history h
           JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
           JOIN teacher t ON t.id = tt.lecturer_id
          WHERE t.teacher_code = ? AND tt.semester_id = ?
          GROUP BY h.status`,
        [TEST_MAIN_SUPERVISOR.teacherCode, envState.semesterId],
      );
      const countByStatus = new Map(dbRows.map((r) => [r.status, Number(r.total)]));
      expect(countByStatus.get('PENDING')).toBe(2);
      expect(countByStatus.get('APPROVED')).toBe(1);
      expect(countByStatus.get('REJECTED')).toBe(1);
    });

    test(ITC002.title, { annotation: ITC002.annotation }, async ({ page, context }) => {
      const { requestsRes } = await openTopicProposalsPage(page, context, envState.mainSupervisorToken);
      expect(requestsRes.status()).toBe(200);
      expect((await requestsRes.json()).code).toBe(1000);

      // Chuyển tab Đã duyệt
      await page.getByRole('button', { name: /^Đã duyệt/ }).click();
      const approvedRow = page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) });
      await expect(approvedRow).toBeVisible();
      await expect(approvedRow).toContainText('Hệ thống quản lý thư viện số');
      await expect(approvedRow).toContainText('Đã duyệt');

      // Chuyển tab Đã từ chối
      await page.getByRole('button', { name: /^Đã từ chối/ }).click();
      const rejectedRow = page.getByRole('row', { name: new RegExp(TEST_STUDENT_3.studentCode) });
      await expect(rejectedRow).toBeVisible();
      await expect(rejectedRow).toContainText(TEST_STUDENT_3.fullName);
      await expect(rejectedRow).toContainText('Đã từ chối');

      // Chuyển tab Tất cả & tìm theo MSSV 9990000302
      await page.getByRole('button', { name: /^Tất cả/ }).click();
      const searchBox = page.getByPlaceholder('Tìm theo tên SV, MSSV, tên đề tài...');
      await searchBox.fill(TEST_STUDENT_2.studentCode);

      await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) })).toHaveCount(2);
      await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) })).toHaveCount(0);
      await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_3.studentCode) })).toHaveCount(0);

      // Tìm từ khóa không khớp -> hiển thị trạng thái rỗng
      await searchBox.fill('KHONGTONTAI9999');
      await expect(page.getByText('Không có yêu cầu tên đề tài nào')).toBeVisible();
      await expect(page.getByText('Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.')).toBeVisible();
    });

    test(ITC003.title, { annotation: ITC003.annotation }, async ({ page, context }) => {
      const { requestsRes } = await openTopicProposalsPage(page, context, envState.coSupervisorToken);

      expect(requestsRes.status()).toBe(200);
      const reqBody = await requestsRes.json();
      expect(reqBody.code).toBe(1000);
      const student1Item = (reqBody.data ?? []).find((i: any) => i.studentCode === TEST_STUDENT_1.studentCode);
      expect(student1Item).toBeTruthy();
      expect(student1Item.canReview).toBe(false);

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(row1).toBeVisible();
      await expect(row1).toContainText('Đồng hướng dẫn (Chỉ xem)');
      await expect(row1.getByRole('button', { name: 'Lịch sử' })).toBeEnabled();
      await expect(row1.getByRole('button', { name: 'Duyệt', exact: true })).toHaveCount(0);
      await expect(row1.getByRole('button', { name: 'Từ chối', exact: true })).toHaveCount(0);

      // Đối chiếu DB: co_lecturer_id đúng là GV999302
      const dbRows = await dbSelect<{ co_code: string }>(
        `SELECT ct.teacher_code AS co_code
           FROM thesis_topic tt
           JOIN student s ON s.id = tt.student_id
           JOIN teacher ct ON ct.id = tt.co_lecturer_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows).toHaveLength(1);
      expect(dbRows[0].co_code).toBe(TEST_CO_SUPERVISOR.teacherCode);
    });

    test(ITC004.title, { annotation: ITC004.annotation }, async ({ page, context, request }) => {
      await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'CLOSED');

      const { deadlineRes, requestsRes } = await openTopicProposalsPage(
        page,
        context,
        envState.mainSupervisorToken,
      );

      expect(deadlineRes.status()).toBe(200);
      const dlBody = await deadlineRes.json();
      expect(dlBody.code).toBe(1000);
      const outlineDl = (dlBody.data?.giaoNhanDeadlines ?? []).find(
        (d: any) => d.code === 'SV_CHINH_SUA_NOP_LAI_DE_CUONG',
      );
      expect(outlineDl?.status).toBe('COMPLETED');

      expect(requestsRes.status()).toBe(200);
      expect((await requestsRes.json()).code).toBe(1000);

      await expect(page.getByText(/Đã hết hạn \(/)).toBeVisible();
      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(row1).toBeVisible();
      await expect(row1.getByRole('button', { name: 'Duyệt', exact: true })).toBeDisabled();
      await expect(row1.getByRole('button', { name: 'Từ chối', exact: true })).toBeDisabled();
    });

    test(ITC005.title, { annotation: ITC005.annotation }, async ({ page, context, request }) => {
      await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'NOT_STARTED');

      const { deadlineRes, requestsRes } = await openTopicProposalsPage(
        page,
        context,
        envState.mainSupervisorToken,
      );

      expect(deadlineRes.status()).toBe(200);
      const dlBody = await deadlineRes.json();
      expect(dlBody.code).toBe(1000);
      const outlineDl = (dlBody.data?.giaoNhanDeadlines ?? []).find(
        (d: any) => d.code === 'SV_CHINH_SUA_NOP_LAI_DE_CUONG',
      );
      expect(outlineDl?.status).toBe('NOT_STARTED');

      expect(requestsRes.status()).toBe(200);
      expect((await requestsRes.json()).code).toBe(1000);

      await expect(page.getByText(/Chưa mở \(Từ/)).toBeVisible();
      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(row1).toBeVisible();
      await expect(row1.getByRole('button', { name: 'Duyệt', exact: true })).toBeDisabled();
      await expect(row1.getByRole('button', { name: 'Từ chối', exact: true })).toBeDisabled();
    });

    test(ITC006.title, { annotation: ITC006.annotation }, async ({ page, context }) => {
      await openTopicProposalsPage(page, context, envState.mainSupervisorToken);

      const row2 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) });
      await expect(row2).toBeVisible();

      const historyPromise = page.waitForResponse(
        (r) =>
          r.url().endsWith(`/topic/${student2Handle.topicPublicId}/title-history`) &&
          r.request().method() === 'GET',
      );
      await row2.getByRole('button', { name: 'Lịch sử' }).click();
      const historyRes = await historyPromise;

      expect(historyRes.status()).toBe(200);
      const historyBody = await historyRes.json();
      expect(historyBody.code).toBe(1000);
      expect(historyBody.data).toHaveLength(2);
      expect(historyBody.data[0].status).toBe('PENDING');
      expect(historyBody.data[0].oldName).toBe('Hệ thống quản lý thư viện số');
      expect(historyBody.data[0].newName).toBe('Hệ thống quản lý thư viện số ứng dụng AI');
      expect(historyBody.data[1].status).toBe('APPROVED');
      expect(historyBody.data[1].oldName).toBeNull();
      expect(historyBody.data[1].newName).toBe('Hệ thống quản lý thư viện số');

      // Kiểm tra giao diện modal Lịch sử thay đổi tên đề tài
      await expect(page.getByRole('heading', { name: 'Lịch sử thay đổi tên đề tài' })).toBeVisible();
      await expect(page.getByText(`Sinh viên: ${TEST_STUDENT_2.fullName} (${TEST_STUDENT_2.studentCode})`)).toBeVisible();
      await expect(page.getByText('Xin đổi tên', { exact: true })).toBeVisible();
      await expect(page.getByText('Chốt tên lần đầu', { exact: true }).last()).toBeVisible();
      await expect(page.getByText(TEST_MAIN_SUPERVISOR.fullName).first()).toBeVisible();

      // Đối chiếu DB bằng SELECT
      const dbRows = await dbSelect<{ total: number }>(
        `SELECT COUNT(*) AS total
           FROM topic_title_history h
           JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_2.studentCode, envState.semesterId],
      );
      expect(Number(dbRows[0].total)).toBe(2);
    });
  });

  // ==========================================================================
  // NHÓM THAO TÁC GHI & BẢO MẬT (ITC007..ITC016 & TC-SEC-010..TC-SEC-015)
  // ==========================================================================
  test.describe('Approve, Reject, Concurrency/Deadline Errors, and Security (ITC007..ITC016, TC-SEC-010..TC-SEC-015)', () => {
    test.afterEach(async ({ request }) => {
      await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'OPEN');
      await cleanupActiveStudents(request);
    });

    test(ITC007.title, { annotation: ITC007.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithTopicRequests(request, [
        {
          profile: TEST_STUDENT_1,
          initialRequest: { newName: 'Hệ thống quản lý đồ án tốt nghiệp thông minh' },
        },
      ]);

      await openTopicProposalsPage(page, context, envState.mainSupervisorToken);

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(row1).toBeVisible();
      await row1.getByRole('button', { name: 'Duyệt', exact: true }).click();

      await expect(page.getByRole('heading', { name: 'Xác nhận chốt tên đề tài lần đầu' })).toBeVisible();

      const reviewPromise = page.waitForResponse(
        (r) =>
          r.url().endsWith(`/topic/title-request/${s1.initialHistoryPublicId}/review`) &&
          r.request().method() === 'PUT',
      );
      await page.getByRole('button', { name: 'Xác nhận duyệt', exact: true }).click();
      const reviewRes = await reviewPromise;

      expect(reviewRes.request().postDataJSON()).toEqual({ decision: 'APPROVED' });
      expect(reviewRes.status()).toBe(200);
      const reviewBody = await reviewRes.json();
      expect(reviewBody.code).toBe(1000);
      expect(reviewBody.message).toBe('Xử lý yêu cầu tên đề tài thành công');

      await expect(
        page.getByText(`Đã duyệt tên đề tài cho sinh viên ${TEST_STUDENT_1.fullName} thành công!`),
      ).toBeVisible();
      await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) })).toHaveCount(0);

      await page.getByRole('button', { name: /^Đã duyệt/ }).click();
      const approvedRow = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(approvedRow).toBeVisible();
      await expect(approvedRow).toContainText('Đã duyệt');
      await expect(approvedRow).toContainText(TEST_MAIN_SUPERVISOR.fullName);

      // Đối chiếu DB: topic_title_history, thesis_topic và notification
      const dbRows = await dbSelect<{
        h_status: string;
        reviewer_code: string | null;
        reviewed_at: string | null;
        topic_name: string | null;
        current_stage: string;
      }>(
        `SELECT h.status AS h_status,
                rt.teacher_code AS reviewer_code,
                h.reviewed_at,
                tt.name AS topic_name,
                tt.current_stage
           FROM topic_title_history h
           JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
           LEFT JOIN teacher rt ON rt.id = h.reviewer_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows).toHaveLength(1);
      expect(dbRows[0].h_status).toBe('APPROVED');
      expect(dbRows[0].reviewer_code).toBe(TEST_MAIN_SUPERVISOR.teacherCode);
      expect(dbRows[0].reviewed_at).not.toBeNull();
      expect(dbRows[0].topic_name).toBe('Hệ thống quản lý đồ án tốt nghiệp thông minh');
      expect(dbRows[0].current_stage).toBe('STAGE_2_TOPIC_CONFIRMED');

      const notiRows = await dbSelect<{ content: string }>(
        `SELECT n.content
           FROM notification n
           JOIN student s ON s.account_id = n.account_id
          WHERE s.student_code = ?
          ORDER BY n.id DESC
          LIMIT 5`,
        [TEST_STUDENT_1.studentCode],
      );
      expect(
        notiRows.some((n) =>
          n.content.includes('Yêu cầu tên đề tài "Hệ thống quản lý đồ án tốt nghiệp thông minh" của bạn đã được phê duyệt.'),
        ),
      ).toBe(true);
    });

    test(ITC008.title, { annotation: ITC008.annotation }, async ({ page, context, request }) => {
      const [s2] = await provisionStudentsWithTopicRequests(request, [
        {
          profile: TEST_STUDENT_2,
          initialRequest: {
            newName: 'Hệ thống quản lý thư viện số',
            reviewDecision: 'APPROVED',
          },
          changeRequest: {
            newName: 'Hệ thống quản lý thư viện số ứng dụng AI',
          },
        },
      ]);

      await openTopicProposalsPage(page, context, envState.mainSupervisorToken);

      const row2 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) });
      await expect(row2).toBeVisible();
      await expect(row2).toContainText('Xin đổi tên đề tài');
      await row2.getByRole('button', { name: 'Duyệt', exact: true }).click();

      await expect(page.getByRole('heading', { name: 'Xác nhận phê duyệt đổi tên đề tài' })).toBeVisible();

      const reviewPromise = page.waitForResponse(
        (r) =>
          r.url().endsWith(`/topic/title-request/${s2.changeHistoryPublicId}/review`) &&
          r.request().method() === 'PUT',
      );
      await page.getByRole('button', { name: 'Xác nhận duyệt', exact: true }).click();
      const reviewRes = await reviewPromise;

      expect(reviewRes.request().postDataJSON()).toEqual({ decision: 'APPROVED' });
      expect(reviewRes.status()).toBe(200);
      const reviewBody = await reviewRes.json();
      expect(reviewBody.code).toBe(1000);
      expect(reviewBody.message).toBe('Xử lý yêu cầu tên đề tài thành công');

      await expect(
        page.getByText(`Đã duyệt tên đề tài cho sinh viên ${TEST_STUDENT_2.fullName} thành công!`),
      ).toBeVisible();
      await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) })).toHaveCount(0);

      await page.getByRole('button', { name: /^Đã duyệt/ }).click();
      await expect(page.getByText('Hệ thống quản lý thư viện số ứng dụng AI')).toBeVisible();

      // Đối chiếu DB: tên chính thức đã đổi sang tên mới và lịch sử đổi tên = APPROVED
      const dbRows = await dbSelect<{
        h_status: string;
        old_name: string | null;
        new_name: string;
        reviewer_code: string | null;
        reviewed_at: string | null;
        topic_name: string | null;
        current_stage: string;
      }>(
        `SELECT h.status AS h_status,
                h.old_name,
                h.new_name,
                rt.teacher_code AS reviewer_code,
                h.reviewed_at,
                tt.name AS topic_name,
                tt.current_stage
           FROM topic_title_history h
           JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
           LEFT JOIN teacher rt ON rt.id = h.reviewer_id
          WHERE s.student_code = ? AND tt.semester_id = ? AND h.old_name IS NOT NULL`,
        [TEST_STUDENT_2.studentCode, envState.semesterId],
      );
      expect(dbRows).toHaveLength(1);
      expect(dbRows[0].h_status).toBe('APPROVED');
      expect(dbRows[0].old_name).toBe('Hệ thống quản lý thư viện số');
      expect(dbRows[0].new_name).toBe('Hệ thống quản lý thư viện số ứng dụng AI');
      expect(dbRows[0].reviewer_code).toBe(TEST_MAIN_SUPERVISOR.teacherCode);
      expect(dbRows[0].reviewed_at).not.toBeNull();
      expect(dbRows[0].topic_name).toBe('Hệ thống quản lý thư viện số ứng dụng AI');
      expect(dbRows[0].current_stage).toBe('STAGE_2_TOPIC_CONFIRMED');

      const notiRows = await dbSelect<{ content: string }>(
        `SELECT n.content
           FROM notification n
           JOIN student s ON s.account_id = n.account_id
          WHERE s.student_code = ?
          ORDER BY n.id DESC
          LIMIT 5`,
        [TEST_STUDENT_2.studentCode],
      );
      expect(
        notiRows.some((n) =>
          n.content.includes('Yêu cầu tên đề tài "Hệ thống quản lý thư viện số ứng dụng AI" của bạn đã được phê duyệt.'),
        ),
      ).toBe(true);
    });

    test(ITC009.title, { annotation: ITC009.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithTopicRequests(request, [
        {
          profile: TEST_STUDENT_1,
          initialRequest: { newName: 'Hệ thống phân tích dữ liệu học tập trong kỳ gia hạn' },
        },
      ]);

      // Chuyển hạn sang EXTENDED (gia hạn chấm cho giảng viên)
      await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'EXTENDED');

      const { deadlineRes } = await openTopicProposalsPage(page, context, envState.mainSupervisorToken);
      expect(deadlineRes.status()).toBe(200);
      const dlBody = await deadlineRes.json();
      expect(dlBody.code).toBe(1000);
      const outlineDl = (dlBody.data?.giaoNhanDeadlines ?? []).find(
        (d: any) => d.code === 'SV_CHINH_SUA_NOP_LAI_DE_CUONG',
      );
      expect(outlineDl?.status).toBe('EXTENDED');

      await expect(page.getByText(/Đã hết hạn nộp — Đang gia hạn chấm đến/)).toBeVisible();

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(row1.getByRole('button', { name: 'Duyệt', exact: true })).toBeEnabled();
      await row1.getByRole('button', { name: 'Duyệt', exact: true }).click();

      const reviewPromise = page.waitForResponse(
        (r) =>
          r.url().endsWith(`/topic/title-request/${s1.initialHistoryPublicId}/review`) &&
          r.request().method() === 'PUT',
      );
      await page.getByRole('button', { name: 'Xác nhận duyệt', exact: true }).click();
      const reviewRes = await reviewPromise;

      expect(reviewRes.status()).toBe(200);
      const reviewBody = await reviewRes.json();
      expect(reviewBody.code).toBe(1000);
      expect(reviewBody.message).toBe('Xử lý yêu cầu tên đề tài thành công');

      await expect(
        page.getByText(`Đã duyệt tên đề tài cho sinh viên ${TEST_STUDENT_1.fullName} thành công!`),
      ).toBeVisible();

      const dbRows = await dbSelect<{ h_status: string; topic_name: string | null }>(
        `SELECT h.status AS h_status, tt.name AS topic_name
           FROM topic_title_history h
           JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows[0].h_status).toBe('APPROVED');
      expect(dbRows[0].topic_name).toBe('Hệ thống phân tích dữ liệu học tập trong kỳ gia hạn');
    });

    test(ITC010.title, { annotation: ITC010.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithTopicRequests(request, [
        {
          profile: TEST_STUDENT_1,
          initialRequest: { newName: 'Đề tài bị từ chối trước khi bấm duyệt' },
        },
      ]);

      await openTopicProposalsPage(page, context, envState.mainSupervisorToken);
      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Duyệt', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Xác nhận chốt tên đề tài lần đầu' })).toBeVisible();

      // Phiên khác từ chối đơn trước khi bấm Xác nhận duyệt
      const concurrentRes = await apiCall(
        request,
        envState.mainSupervisorToken,
        'PUT',
        `/topic/title-request/${s1.initialHistoryPublicId}/review`,
        { data: { decision: 'REJECTED' } },
      );
      expect(concurrentRes.status).toBe(200);

      const reviewPromise = page.waitForResponse(
        (r) =>
          r.url().endsWith(`/topic/title-request/${s1.initialHistoryPublicId}/review`) &&
          r.request().method() === 'PUT',
      );
      await page.getByRole('button', { name: 'Xác nhận duyệt', exact: true }).click();
      const reviewRes = await reviewPromise;

      expect(reviewRes.status()).toBe(409);
      const reviewBody = await reviewRes.json();
      expect(reviewBody.code).toBe(3052);
      expect(reviewBody.message).toBe('Yêu cầu này đã được xử lý trước đó');

      await expect(page.getByText('Yêu cầu này đã được xử lý trước đó')).toBeVisible();

      const dbRows = await dbSelect<{ h_status: string; topic_name: string | null }>(
        `SELECT h.status AS h_status, tt.name AS topic_name
           FROM topic_title_history h
           JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows[0].h_status).toBe('REJECTED');
      expect(dbRows[0].topic_name).toBeNull();
    });

    test(ITC011.title, { annotation: ITC011.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithTopicRequests(request, [
        {
          profile: TEST_STUDENT_1,
          initialRequest: { newName: 'Đề tài duyệt lần đầu sau khi hết hạn' },
        },
      ]);

      await openTopicProposalsPage(page, context, envState.mainSupervisorToken);
      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Duyệt', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Xác nhận chốt tên đề tài lần đầu' })).toBeVisible();

      // Đóng hạn trước khi bấm Xác nhận duyệt
      await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'CLOSED');

      const reviewPromise = page.waitForResponse(
        (r) =>
          r.url().endsWith(`/topic/title-request/${s1.initialHistoryPublicId}/review`) &&
          r.request().method() === 'PUT',
      );
      await page.getByRole('button', { name: 'Xác nhận duyệt', exact: true }).click();
      const reviewRes = await reviewPromise;

      const expectedMsg =
        'Đã quá thời hạn giảng viên xác nhận tên đề tài, vui lòng liên hệ Trưởng bộ môn gia hạn chấm';
      expect(reviewRes.status()).toBe(403);
      const reviewBody = await reviewRes.json();
      expect(reviewBody.code).toBe(3055);
      expect(reviewBody.message).toBe(expectedMsg);

      await expect(page.getByText(expectedMsg)).toBeVisible();

      const dbRows = await dbSelect<{
        h_status: string;
        reviewed_at: string | null;
        topic_name: string | null;
      }>(
        `SELECT h.status AS h_status, h.reviewed_at, tt.name AS topic_name
           FROM topic_title_history h
           JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows[0].h_status).toBe('PENDING');
      expect(dbRows[0].reviewed_at).toBeNull();
      expect(dbRows[0].topic_name).toBeNull();
    });

    test(ITC012.title, { annotation: ITC012.annotation }, async ({ page, context, request }) => {
      const [s2] = await provisionStudentsWithTopicRequests(request, [
        {
          profile: TEST_STUDENT_2,
          initialRequest: {
            newName: 'Hệ thống quản lý thư viện số',
            reviewDecision: 'APPROVED',
          },
          changeRequest: {
            newName: 'Hệ thống quản lý thư viện số sau khi hết hạn',
          },
        },
      ]);

      await openTopicProposalsPage(page, context, envState.mainSupervisorToken);
      const row2 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) });
      await row2.getByRole('button', { name: 'Duyệt', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Xác nhận phê duyệt đổi tên đề tài' })).toBeVisible();

      // Đóng hạn trước khi bấm Xác nhận duyệt
      await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'CLOSED');

      const reviewPromise = page.waitForResponse(
        (r) =>
          r.url().endsWith(`/topic/title-request/${s2.changeHistoryPublicId}/review`) &&
          r.request().method() === 'PUT',
      );
      await page.getByRole('button', { name: 'Xác nhận duyệt', exact: true }).click();
      const reviewRes = await reviewPromise;

      const expectedMsg =
        'Đã quá thời hạn giảng viên xác nhận yêu cầu đổi tên đề tài, vui lòng liên hệ Trưởng bộ môn gia hạn chấm';
      expect(reviewRes.status()).toBe(403);
      const reviewBody = await reviewRes.json();
      expect(reviewBody.code).toBe(3055);
      expect(reviewBody.message).toBe(expectedMsg);

      await expect(page.getByText(expectedMsg)).toBeVisible();

      const dbRows = await dbSelect<{
        h_status: string;
        reviewed_at: string | null;
        topic_name: string | null;
      }>(
        `SELECT h.status AS h_status, h.reviewed_at, tt.name AS topic_name
           FROM topic_title_history h
           JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ? AND h.old_name IS NOT NULL`,
        [TEST_STUDENT_2.studentCode, envState.semesterId],
      );
      expect(dbRows[0].h_status).toBe('PENDING');
      expect(dbRows[0].reviewed_at).toBeNull();
      expect(dbRows[0].topic_name).toBe('Hệ thống quản lý thư viện số');
    });

    test(ITC013.title, { annotation: ITC013.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithTopicRequests(request, [
        {
          profile: TEST_STUDENT_1,
          initialRequest: { newName: 'Hệ thống gợi ý thực đơn ăn kiêng' },
        },
      ]);

      await openTopicProposalsPage(page, context, envState.mainSupervisorToken);
      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Từ chối', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Xác nhận từ chối yêu cầu tên đề tài' })).toBeVisible();

      const reviewPromise = page.waitForResponse(
        (r) =>
          r.url().endsWith(`/topic/title-request/${s1.initialHistoryPublicId}/review`) &&
          r.request().method() === 'PUT',
      );
      await page.getByRole('button', { name: 'Xác nhận từ chối', exact: true }).click();
      const reviewRes = await reviewPromise;

      expect(reviewRes.request().postDataJSON()).toEqual({ decision: 'REJECTED' });
      expect(reviewRes.status()).toBe(200);
      const reviewBody = await reviewRes.json();
      expect(reviewBody.code).toBe(1000);
      expect(reviewBody.message).toBe('Xử lý yêu cầu tên đề tài thành công');

      await expect(
        page.getByText(`Đã từ chối yêu cầu tên đề tài của sinh viên ${TEST_STUDENT_1.fullName}!`),
      ).toBeVisible();
      await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) })).toHaveCount(0);

      await page.getByRole('button', { name: /^Đã từ chối/ }).click();
      const rejectedRow = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(rejectedRow).toBeVisible();
      await expect(rejectedRow).toContainText('Đã từ chối');

      // Đối chiếu DB: history = REJECTED, thesis_topic.name vẫn NULL, có thông báo từ chối
      const dbRows = await dbSelect<{
        h_status: string;
        reviewer_code: string | null;
        reviewed_at: string | null;
        topic_name: string | null;
      }>(
        `SELECT h.status AS h_status,
                rt.teacher_code AS reviewer_code,
                h.reviewed_at,
                tt.name AS topic_name
           FROM topic_title_history h
           JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
           LEFT JOIN teacher rt ON rt.id = h.reviewer_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows[0].h_status).toBe('REJECTED');
      expect(dbRows[0].reviewer_code).toBe(TEST_MAIN_SUPERVISOR.teacherCode);
      expect(dbRows[0].reviewed_at).not.toBeNull();
      expect(dbRows[0].topic_name).toBeNull();

      const notiRows = await dbSelect<{ content: string }>(
        `SELECT n.content
           FROM notification n
           JOIN student s ON s.account_id = n.account_id
          WHERE s.student_code = ?
          ORDER BY n.id DESC
          LIMIT 5`,
        [TEST_STUDENT_1.studentCode],
      );
      expect(
        notiRows.some((n) =>
          n.content.includes('Yêu cầu tên đề tài "Hệ thống gợi ý thực đơn ăn kiêng" của bạn đã bị từ chối.'),
        ),
      ).toBe(true);
    });

    test(ITC014.title, { annotation: ITC014.annotation }, async ({ page, context, request }) => {
      const [s2] = await provisionStudentsWithTopicRequests(request, [
        {
          profile: TEST_STUDENT_2,
          initialRequest: {
            newName: 'Hệ thống quản lý thư viện số',
            reviewDecision: 'APPROVED',
          },
          changeRequest: {
            newName: 'Tên đề tài mới đề xuất bị từ chối',
          },
        },
      ]);

      await openTopicProposalsPage(page, context, envState.mainSupervisorToken);
      const row2 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) });
      await row2.getByRole('button', { name: 'Từ chối', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Xác nhận từ chối yêu cầu tên đề tài' })).toBeVisible();

      const reviewPromise = page.waitForResponse(
        (r) =>
          r.url().endsWith(`/topic/title-request/${s2.changeHistoryPublicId}/review`) &&
          r.request().method() === 'PUT',
      );
      await page.getByRole('button', { name: 'Xác nhận từ chối', exact: true }).click();
      const reviewRes = await reviewPromise;

      expect(reviewRes.request().postDataJSON()).toEqual({ decision: 'REJECTED' });
      expect(reviewRes.status()).toBe(200);
      const reviewBody = await reviewRes.json();
      expect(reviewBody.code).toBe(1000);
      expect(reviewBody.message).toBe('Xử lý yêu cầu tên đề tài thành công');

      await expect(
        page.getByText(`Đã từ chối yêu cầu tên đề tài của sinh viên ${TEST_STUDENT_2.fullName}!`),
      ).toBeVisible();

      await page.getByRole('button', { name: /^Đã từ chối/ }).click();
      const rejectedRow = page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) });
      await expect(rejectedRow).toBeVisible();
      await expect(rejectedRow).toContainText('Đã từ chối');

      const dbRows = await dbSelect<{
        h_status: string;
        reviewer_code: string | null;
        reviewed_at: string | null;
        topic_name: string | null;
      }>(
        `SELECT h.status AS h_status,
                rt.teacher_code AS reviewer_code,
                h.reviewed_at,
                tt.name AS topic_name
           FROM topic_title_history h
           JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
           LEFT JOIN teacher rt ON rt.id = h.reviewer_id
          WHERE s.student_code = ? AND tt.semester_id = ? AND h.old_name IS NOT NULL`,
        [TEST_STUDENT_2.studentCode, envState.semesterId],
      );
      expect(dbRows[0].h_status).toBe('REJECTED');
      expect(dbRows[0].reviewer_code).toBe(TEST_MAIN_SUPERVISOR.teacherCode);
      expect(dbRows[0].reviewed_at).not.toBeNull();
      expect(dbRows[0].topic_name).toBe('Hệ thống quản lý thư viện số');

      const notiRows = await dbSelect<{ content: string }>(
        `SELECT n.content
           FROM notification n
           JOIN student s ON s.account_id = n.account_id
          WHERE s.student_code = ?
          ORDER BY n.id DESC
          LIMIT 5`,
        [TEST_STUDENT_2.studentCode],
      );
      expect(
        notiRows.some((n) =>
          n.content.includes('Yêu cầu tên đề tài "Tên đề tài mới đề xuất bị từ chối" của bạn đã bị từ chối.'),
        ),
      ).toBe(true);
    });

    test(ITC015.title, { annotation: ITC015.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithTopicRequests(request, [
        {
          profile: TEST_STUDENT_1,
          initialRequest: { newName: 'Đề tài đã được duyệt trước khi từ chối' },
        },
      ]);

      await openTopicProposalsPage(page, context, envState.mainSupervisorToken);
      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Từ chối', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Xác nhận từ chối yêu cầu tên đề tài' })).toBeVisible();

      const concurrentRes = await apiCall(
        request,
        envState.mainSupervisorToken,
        'PUT',
        `/topic/title-request/${s1.initialHistoryPublicId}/review`,
        { data: { decision: 'APPROVED' } },
      );
      expect(concurrentRes.status).toBe(200);

      const reviewPromise = page.waitForResponse(
        (r) =>
          r.url().endsWith(`/topic/title-request/${s1.initialHistoryPublicId}/review`) &&
          r.request().method() === 'PUT',
      );
      await page.getByRole('button', { name: 'Xác nhận từ chối', exact: true }).click();
      const reviewRes = await reviewPromise;

      expect(reviewRes.status()).toBe(409);
      const reviewBody = await reviewRes.json();
      expect(reviewBody.code).toBe(3052);
      expect(reviewBody.message).toBe('Yêu cầu này đã được xử lý trước đó');

      await expect(page.getByText('Yêu cầu này đã được xử lý trước đó')).toBeVisible();

      const dbRows = await dbSelect<{ h_status: string; topic_name: string | null }>(
        `SELECT h.status AS h_status, tt.name AS topic_name
           FROM topic_title_history h
           JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows[0].h_status).toBe('APPROVED');
      expect(dbRows[0].topic_name).toBe('Đề tài đã được duyệt trước khi từ chối');
    });

    test(ITC016.title, { annotation: ITC016.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithTopicRequests(request, [
        {
          profile: TEST_STUDENT_1,
          initialRequest: { newName: 'Đề tài từ chối sau khi hết hạn' },
        },
      ]);

      await openTopicProposalsPage(page, context, envState.mainSupervisorToken);
      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Từ chối', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Xác nhận từ chối yêu cầu tên đề tài' })).toBeVisible();

      await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'CLOSED');

      const reviewPromise = page.waitForResponse(
        (r) =>
          r.url().endsWith(`/topic/title-request/${s1.initialHistoryPublicId}/review`) &&
          r.request().method() === 'PUT',
      );
      await page.getByRole('button', { name: 'Xác nhận từ chối', exact: true }).click();
      const reviewRes = await reviewPromise;

      const expectedMsg =
        'Đã quá thời hạn giảng viên xác nhận tên đề tài, vui lòng liên hệ Trưởng bộ môn gia hạn chấm';
      expect(reviewRes.status()).toBe(403);
      const reviewBody = await reviewRes.json();
      expect(reviewBody.code).toBe(3055);
      expect(reviewBody.message).toBe(expectedMsg);

      await expect(page.getByText(expectedMsg)).toBeVisible();

      const dbRows = await dbSelect<{ h_status: string; reviewed_at: string | null }>(
        `SELECT h.status AS h_status, h.reviewed_at
           FROM topic_title_history h
           JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows[0].h_status).toBe('PENDING');
      expect(dbRows[0].reviewed_at).toBeNull();
    });

    // ========================================================================
    // SECURITY TEST CASES (TC-SEC-010 .. TC-SEC-015)
    // ========================================================================

    test(SEC010.title, { annotation: SEC010.annotation }, async ({ page, context, request }) => {
      await context.clearCookies();

      const myInfoPromise = page.waitForResponse(
        (r) => r.url().includes('/my-info') && r.request().method() === 'GET',
      );
      await page.goto('/lecturer/topic-proposals');
      const myInfoRes = await myInfoPromise;

      expect(myInfoRes.status()).toBe(401);
      expect((await myInfoRes.json()).code).toBe(2000);
      await expect(page).toHaveURL(/\/login/);

      const directRes = await request.get(
        `${getApiBaseUrl()}/topic/title-request?semesterId=${envState.semesterPublicId}`,
      );
      expect(directRes.status()).toBe(401);
      expect((await directRes.json()).code).toBe(2000);
    });

    test(SEC011.title, { annotation: SEC011.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithTopicRequests(request, [
        {
          profile: TEST_STUDENT_1,
          initialRequest: { newName: 'Đề tài kiểm thử phân quyền sinh viên' },
        },
      ]);

      await setAuthCookie(context, s1.studentToken);
      await page.goto('/lecturer/topic-proposals');

      await expect(
        page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.'),
      ).toBeVisible();

      const listRes = await apiCall(request, s1.studentToken, 'GET', '/topic/title-request', {
        params: { semesterId: envState.semesterPublicId },
      });
      expect(listRes.status).toBe(403);
      expect(listRes.body.code).toBe(2001);
      expect(listRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');

      const reviewRes = await apiCall(
        request,
        s1.studentToken,
        'PUT',
        `/topic/title-request/${s1.initialHistoryPublicId}/review`,
        { data: { decision: 'APPROVED' } },
      );
      expect(reviewRes.status).toBe(403);
      expect(reviewRes.body.code).toBe(2001);
      expect(reviewRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');

      const dbRows = await dbSelect<{ status: string }>(
        `SELECT h.status
           FROM topic_title_history h
           JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows[0].status).toBe('PENDING');
    });

    test(SEC012.title, { annotation: SEC012.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithTopicRequests(request, [
        {
          profile: TEST_STUDENT_1,
          initialRequest: { newName: 'Đề tài kiểm thử phân quyền giảng viên thường' },
        },
      ]);

      await setAuthCookie(context, envState.plainLecturerToken);
      await page.goto('/lecturer/topic-proposals');

      await expect(
        page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.'),
      ).toBeVisible();

      const listRes = await apiCall(request, envState.plainLecturerToken, 'GET', '/topic/title-request', {
        params: { semesterId: envState.semesterPublicId },
      });
      expect(listRes.status).toBe(403);
      expect(listRes.body.code).toBe(2001);
      expect(listRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');

      const reviewRes = await apiCall(
        request,
        envState.plainLecturerToken,
        'PUT',
        `/topic/title-request/${s1.initialHistoryPublicId}/review`,
        { data: { decision: 'REJECTED' } },
      );
      expect(reviewRes.status).toBe(403);
      expect(reviewRes.body.code).toBe(2001);
      expect(reviewRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');

      const dbRows = await dbSelect<{ status: string }>(
        `SELECT h.status
           FROM topic_title_history h
           JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows[0].status).toBe('PENDING');
    });

    test(SEC013.title, { annotation: SEC013.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithTopicRequests(request, [
        {
          profile: TEST_STUDENT_1,
          initialRequest: { newName: 'Đề tài kiểm thử token đã đăng xuất' },
        },
      ]);

      const freshToken = await loginByEmail(request, TEST_MAIN_SUPERVISOR.email);
      const logoutRes = await apiCall(request, freshToken, 'POST', '/log-out');
      expect(logoutRes.status).toBe(200);

      await setAuthCookie(context, freshToken);
      const myInfoPromise = page.waitForResponse(
        (r) => r.url().includes('/my-info') && r.request().method() === 'GET',
      );
      await page.goto('/lecturer/topic-proposals');
      const myInfoRes = await myInfoPromise;

      expect(myInfoRes.status()).toBe(401);
      expect((await myInfoRes.json()).code).toBe(2000);
      await expect(page).toHaveURL(/\/login/);

      const listRes = await apiCall(request, freshToken, 'GET', '/topic/title-request', {
        params: { semesterId: envState.semesterPublicId },
      });
      expect(listRes.status).toBe(401);
      expect(listRes.body.code).toBe(2000);

      const reviewRes = await apiCall(
        request,
        freshToken,
        'PUT',
        `/topic/title-request/${s1.initialHistoryPublicId}/review`,
        { data: { decision: 'APPROVED' } },
      );
      expect(reviewRes.status).toBe(401);
      expect(reviewRes.body.code).toBe(2000);

      const dbRows = await dbSelect<{ status: string }>(
        `SELECT h.status
           FROM topic_title_history h
           JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows[0].status).toBe('PENDING');
    });

    test(SEC014.title, { annotation: SEC014.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithTopicRequests(request, [
        {
          profile: TEST_STUDENT_1,
          assignCoSupervisor: true,
          initialRequest: { newName: 'Đề tài kiểm thử quyền đồng hướng dẫn' },
        },
      ]);

      await openTopicProposalsPage(page, context, envState.coSupervisorToken);
      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(row1).toBeVisible();
      await expect(row1).toContainText('Đồng hướng dẫn (Chỉ xem)');
      await expect(row1.getByRole('button', { name: 'Duyệt', exact: true })).toHaveCount(0);
      await expect(row1.getByRole('button', { name: 'Từ chối', exact: true })).toHaveCount(0);

      const expectedMsg =
        'Giảng viên đồng hướng dẫn chỉ có quyền xem, không có quyền duyệt tên đề tài';

      const approveRes = await apiCall(
        request,
        envState.coSupervisorToken,
        'PUT',
        `/topic/title-request/${s1.initialHistoryPublicId}/review`,
        { data: { decision: 'APPROVED' } },
      );
      expect(approveRes.status).toBe(403);
      expect(approveRes.body.code).toBe(2001);
      expect(approveRes.body.message).toBe(expectedMsg);

      const rejectRes = await apiCall(
        request,
        envState.coSupervisorToken,
        'PUT',
        `/topic/title-request/${s1.initialHistoryPublicId}/review`,
        { data: { decision: 'REJECTED' } },
      );
      expect(rejectRes.status).toBe(403);
      expect(rejectRes.body.code).toBe(2001);
      expect(rejectRes.body.message).toBe(expectedMsg);

      const dbRows = await dbSelect<{ status: string; topic_name: string | null }>(
        `SELECT h.status, tt.name AS topic_name
           FROM topic_title_history h
           JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows[0].status).toBe('PENDING');
      expect(dbRows[0].topic_name).toBeNull();
    });

    test(SEC015.title, { annotation: SEC015.annotation }, async ({ page, context, request }) => {
      const [s1] = await provisionStudentsWithTopicRequests(request, [
        {
          profile: TEST_STUDENT_1,
          initialRequest: { newName: 'Đề tài thuộc GV999301 không cho GV999303 thao tác' },
        },
      ]);

      await openTopicProposalsPage(page, context, envState.otherSupervisorToken);
      await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) })).toHaveCount(0);

      const historyRes = await apiCall(
        request,
        envState.otherSupervisorToken,
        'GET',
        `/topic/${s1.topicPublicId}/title-history`,
      );
      expect(historyRes.status).toBe(403);
      expect(historyRes.body.code).toBe(2001);
      expect(historyRes.body.message).toBe('Bạn không có quyền truy cập thông tin đề tài này');

      const reviewRes = await apiCall(
        request,
        envState.otherSupervisorToken,
        'PUT',
        `/topic/title-request/${s1.initialHistoryPublicId}/review`,
        { data: { decision: 'APPROVED' } },
      );
      expect(reviewRes.status).toBe(403);
      expect(reviewRes.body.code).toBe(2001);
      expect(reviewRes.body.message).toBe('Bạn không có quyền xử lý yêu cầu của đề tài này');

      const dbRows = await dbSelect<{ status: string; reviewed_at: string | null }>(
        `SELECT h.status, h.reviewed_at
           FROM topic_title_history h
           JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
           JOIN student s ON s.id = tt.student_id
          WHERE s.student_code = ? AND tt.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows[0].status).toBe('PENDING');
      expect(dbRows[0].reviewed_at).toBeNull();
    });
  });
});
