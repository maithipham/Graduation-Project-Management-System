import { test, expect, type APIRequestContext, type BrowserContext } from '@playwright/test';
import { defineItc, defineItcSec } from '../../../support/integration-test-case';
import { apiCall, getApiBaseUrl, loginByEmail } from '../../../support/api';
import { dbSelect } from '../../../support/db';

// ============================================================================
// ĐẶC TẢ TEST CASE (ITC015..ITC030 & TC-SEC-005..TC-SEC-009)
// Feature: registration | Module/Sheet: DuyetDonDangKyGVHD
// Role: Giảng viên hướng dẫn (SUPERVISOR)
// ============================================================================

const ITC015 = defineItc({
  id: 'ITC015',
  feature: 'registration',
  module: 'DuyetDonDangKyGVHD',
  sheet: 'DuyetDonDangKyGVHD',
  fn: 'View and Filter Advisor Registration Requests',
  description: 'Verify that a supervisor can view the pending advisor registration list and status tab counters when the registration deadline is open',
  procedure:
    '1. Log in as a Supervisor ("Nguyễn Văn Hùng").\n' +
    '2. Open the "Đăng ký GVHD" screen ("/lecturer/supervisor-requests").',
  expected:
    '1. The API GET /api/teacher/advisor-registrations/deadline returns HTTP 200 with code = 1000 and deadline status OPEN.\n' +
    '2. The API GET /api/teacher/advisor-registrations with status = PENDING returns HTTP 200 with code = 1000, pendingCount = 1, approvedCount = 1, rejectedCount = 1, and totalCount = 3.\n' +
    '3. The database contains 3 registration records for supervisor "GV999201" in the current semester (1 PENDING, 1 TEACHER_APPROVED, 1 REJECTED).\n' +
    '4. The "Chưa duyệt" tab is active and displays student "Trần Minh Tuấn" ("9990000201") with enabled "Duyệt" and "Từ chối" buttons; tab counters show "Chưa duyệt" = 1, "Đã duyệt" = 1, "Đã từ chối" = 1, and "Tất cả" = 3.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Đăng ký GVHD" deadline.\n' +
    '2. Supervisor "Nguyễn Văn Hùng" ("GV999201") has 1 PENDING registration ("9990000201"), 1 TEACHER_APPROVED registration ("9990000202"), and 1 REJECTED registration ("9990000203") in the current semester.',
});

const ITC016 = defineItc({
  id: 'ITC016',
  feature: 'registration',
  module: 'DuyetDonDangKyGVHD',
  sheet: 'DuyetDonDangKyGVHD',
  fn: 'View and Filter Advisor Registration Requests',
  description: 'Verify that a supervisor can switch status tabs and filter advisor registration requests by student code',
  procedure:
    '1. Log in as a Supervisor and open the "Đăng ký GVHD" screen.\n' +
    '2. Click the "Đã duyệt" tab, then click the "Đã từ chối" tab, and then click the "Tất cả" tab.\n' +
    '3. Enter "9990000202" into the "Tìm theo mã sinh viên, tên sinh viên..." search box.',
  expected:
    '1. Switching tabs calls GET /api/teacher/advisor-registrations with the corresponding status filters (status = REJECTED for "Đã từ chối", no status param for "Đã duyệt" and "Tất cả"), returning HTTP 200 with code = 1000.\n' +
    '2. Searching calls GET /api/teacher/advisor-registrations with keyword = "9990000202", returning HTTP 200 with code = 1000 and 1 matching registration.\n' +
    '3. The "Đã duyệt" tab displays "Lê Thu Hà" with badge "GV đã duyệt"; the "Đã từ chối" tab displays "Phạm Đức Anh" with badge "Đã từ chối"; searching "9990000202" under "Tất cả" displays only student "Lê Thu Hà" ("9990000202").',
  precondition:
    '1. An ongoing semester exists with an OPEN "Đăng ký GVHD" deadline.\n' +
    '2. Supervisor "GV999201" has 1 PENDING ("9990000201"), 1 TEACHER_APPROVED ("9990000202"), and 1 REJECTED ("9990000203") registration in the current semester.',
});

const ITC017 = defineItc({
  id: 'ITC017',
  feature: 'registration',
  module: 'DuyetDonDangKyGVHD',
  sheet: 'DuyetDonDangKyGVHD',
  fn: 'View and Filter Advisor Registration Requests',
  description: 'Verify that approve and reject buttons are disabled and a warning banner is displayed when the advisor registration deadline has closed',
  procedure:
    '1. Log in as a Supervisor.\n' +
    '2. Open the "Đăng ký GVHD" screen after the registration deadline has closed.',
  expected:
    '1. The API GET /api/teacher/advisor-registrations/deadline returns HTTP 200 with code = 1000 and deadline status CLOSED.\n' +
    '2. The API GET /api/teacher/advisor-registrations with status = PENDING returns HTTP 200 with code = 1000.\n' +
    '3. The deadline indicator displays "Đã hết hạn xử lý đơn" and the warning banner "Đã hết hạn xử lý đơn — Hiện chỉ xem danh sách, không thể duyệt hoặc từ chối đơn đăng ký." is visible.\n' +
    '4. The "Duyệt" and "Từ chối" buttons on student "Trần Minh Tuấn"\'s row are disabled.',
  precondition:
    '1. An ongoing semester exists where the "Đăng ký GVHD" deadline status is CLOSED.\n' +
    '2. Supervisor "GV999201" has a PENDING registration from student "Trần Minh Tuấn" ("9990000201").',
});

const ITC018 = defineItc({
  id: 'ITC018',
  feature: 'registration',
  module: 'DuyetDonDangKyGVHD',
  sheet: 'DuyetDonDangKyGVHD',
  fn: 'View and Filter Advisor Registration Requests',
  description: 'Verify that an empty state message is displayed when no advisor registration matches the search keyword',
  procedure:
    '1. Log in as a Supervisor and open the "Đăng ký GVHD" screen.\n' +
    '2. Enter "KHONGTONTAI9999" into the "Tìm theo mã sinh viên, tên sinh viên..." search box.',
  expected:
    '1. The API GET /api/teacher/advisor-registrations with keyword = "KHONGTONTAI9999" returns HTTP 200 with code = 1000 and an empty registration list.\n' +
    '2. The table displays "Không tìm thấy đơn đăng ký nào." and "Thử thay đổi học kỳ, trạng thái hoặc từ khóa tìm kiếm.".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Đăng ký GVHD" deadline.\n' +
    '2. No student registered with supervisor "GV999201" matches keyword "KHONGTONTAI9999".',
});

const ITC019 = defineItc({
  id: 'ITC019',
  feature: 'registration',
  module: 'DuyetDonDangKyGVHD',
  sheet: 'DuyetDonDangKyGVHD',
  fn: 'View Advisor Registration Detail',
  description: 'Verify that a supervisor can view the full details of a pending registration request including proposed topic and action buttons',
  procedure:
    '1. Log in as a Supervisor and open the "Đăng ký GVHD" screen.\n' +
    '2. Click the "Xem chi tiết" button on the row of student "Trần Minh Tuấn" ("9990000201").',
  expected:
    '1. The API GET /api/teacher/advisor-registrations/{publicId} returns HTTP 200 with code = 1000.\n' +
    '2. The response contains studentCode = "9990000201", studentName = "Trần Minh Tuấn", topicName = "Hệ thống quản lý đồ án tốt nghiệp thông minh", status = "PENDING", and statusDescription = "Chờ duyệt".\n' +
    '3. The modal "Chi tiết đơn đăng ký giảng viên hướng dẫn" displays "Trần Minh Tuấn", "9990000201", "Hệ thống quản lý đồ án tốt nghiệp thông minh", "Chưa xử lý", status "Chờ duyệt", and enabled "Duyệt" and "Từ chối" buttons.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Đăng ký GVHD" deadline.\n' +
    '2. Supervisor "GV999201" has a PENDING registration from student "Trần Minh Tuấn" ("9990000201") with topic "Hệ thống quản lý đồ án tốt nghiệp thông minh".',
});

const ITC020 = defineItc({
  id: 'ITC020',
  feature: 'registration',
  module: 'DuyetDonDangKyGVHD',
  sheet: 'DuyetDonDangKyGVHD',
  fn: 'View Advisor Registration Detail',
  description: 'Verify that the list and detail modal display fallback text when a student submitted a registration without a proposed topic name',
  procedure:
    '1. Log in as a Supervisor and open the "Đăng ký GVHD" screen.\n' +
    '2. Locate the pending row of student "Trần Minh Tuấn" ("9990000201") and click "Xem chi tiết".',
  expected:
    '1. The API GET /api/teacher/advisor-registrations/{publicId} returns HTTP 200 with code = 1000 and topicName = null.\n' +
    '2. The database stores topic_name as NULL for the PENDING registration of student "9990000201".\n' +
    '3. The table row displays badge "Chưa có đề tài", and the detail modal displays "Sinh viên chưa đăng ký tên đề tài".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Đăng ký GVHD" deadline.\n' +
    '2. Supervisor "GV999201" has a PENDING registration from student "Trần Minh Tuấn" ("9990000201") with no proposed topic name.',
});

const ITC021 = defineItc({
  id: 'ITC021',
  feature: 'registration',
  module: 'DuyetDonDangKyGVHD',
  sheet: 'DuyetDonDangKyGVHD',
  fn: 'Approve Advisor Registration Request',
  description: 'Verify that a supervisor can approve a pending registration request from the list when within quota and deadline',
  procedure:
    '1. Log in as a Supervisor and open the "Đăng ký GVHD" screen.\n' +
    '2. Click "Duyệt" on the row of student "Trần Minh Tuấn" ("9990000201").\n' +
    '3. In the "Xác nhận phê duyệt đơn đăng ký" modal, click "Xác nhận".',
  expected:
    '1. The API PATCH /api/teacher/advisor-registrations/{publicId}/approve returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Duyệt đơn đăng ký giảng viên hướng dẫn thành công", with status = "TEACHER_APPROVED", statusDescription = "GV đã chấp thuận", and a non-null processedAt.\n' +
    '3. The database updates the registration of student "9990000201" to TEACHER_APPROVED with processed_at set and stores an approval notification for student "9990000201".\n' +
    '4. The UI shows toast "Đã tiếp nhận hướng dẫn đồ án cho sinh viên Trần Minh Tuấn thành công!", removes the row from "Chưa duyệt", and displays "Trần Minh Tuấn" with badge "GV đã duyệt" under the "Đã duyệt" tab.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Đăng ký GVHD" deadline.\n' +
    '2. Supervisor "GV999201" has quota maxStudents = 5 (0 occupied) and 1 PENDING registration from student "Trần Minh Tuấn" ("9990000201").',
});

const ITC022 = defineItc({
  id: 'ITC022',
  feature: 'registration',
  module: 'DuyetDonDangKyGVHD',
  sheet: 'DuyetDonDangKyGVHD',
  fn: 'Approve Advisor Registration Request',
  description: 'Verify that a supervisor can approve a pending registration request directly from the registration detail modal',
  procedure:
    '1. Log in as a Supervisor and open the "Đăng ký GVHD" screen.\n' +
    '2. Click "Xem chi tiết" on the row of student "Trần Minh Tuấn" ("9990000201").\n' +
    '3. Inside the "Chi tiết đơn đăng ký giảng viên hướng dẫn" modal, click "Duyệt", then click "Xác nhận" in the "Xác nhận phê duyệt đơn đăng ký" modal.',
  expected:
    '1. The API PATCH /api/teacher/advisor-registrations/{publicId}/approve returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Duyệt đơn đăng ký giảng viên hướng dẫn thành công" and status is TEACHER_APPROVED.\n' +
    '3. The database updates the registration of student "9990000201" to TEACHER_APPROVED with processed_at set.\n' +
    '4. The UI displays toast "Đã tiếp nhận hướng dẫn đồ án cho sinh viên Trần Minh Tuấn thành công!" and shows "Trần Minh Tuấn" under the "Đã duyệt" tab with badge "GV đã duyệt".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Đăng ký GVHD" deadline.\n' +
    '2. Supervisor "GV999201" has quota maxStudents = 5 (0 occupied) and 1 PENDING registration from student "Trần Minh Tuấn" ("9990000201").',
});

const ITC023 = defineItc({
  id: 'ITC023',
  feature: 'registration',
  module: 'DuyetDonDangKyGVHD',
  sheet: 'DuyetDonDangKyGVHD',
  fn: 'Approve Advisor Registration Request',
  description: 'Verify that approving the final available quota slot automatically rejects all remaining pending registrations for that supervisor',
  procedure:
    '1. Log in as a Supervisor and open the "Đăng ký GVHD" screen.\n' +
    '2. Click "Duyệt" on the row of student "Trần Minh Tuấn" ("9990000201") and click "Xác nhận" in the confirmation modal.',
  expected:
    '1. The API PATCH /api/teacher/advisor-registrations/{publicId}/approve returns HTTP 200 with code = 1000 and message "Duyệt đơn đăng ký giảng viên hướng dẫn thành công".\n' +
    '2. The database updates student "9990000201"\'s registration to TEACHER_APPROVED and automatically updates student "9990000202"\'s registration to REJECTED with processed_at set, while storing an auto-rejection notification for student "9990000202".\n' +
    '3. The "Chưa duyệt" tab has 0 pending requests; the "Đã duyệt" tab shows "Trần Minh Tuấn" ("GV đã duyệt") and the "Đã từ chối" tab shows "Lê Thu Hà" ("Đã từ chối").',
  precondition:
    '1. An ongoing semester exists with an OPEN "Đăng ký GVHD" deadline.\n' +
    '2. Supervisor "GV999201" has quota maxStudents = 1 (0 occupied) and 2 PENDING registrations from students "Trần Minh Tuấn" ("9990000201") and "Lê Thu Hà" ("9990000202").',
});

const ITC024 = defineItc({
  id: 'ITC024',
  feature: 'registration',
  module: 'DuyetDonDangKyGVHD',
  sheet: 'DuyetDonDangKyGVHD',
  fn: 'Approve Advisor Registration Request',
  description: 'Verify that approving a pending registration is blocked after the Head of Major lowers the supervisor quota to full, auto-rejecting the pending request',
  procedure:
    '1. Log in as a Supervisor, open the "Đăng ký GVHD" screen, and click "Duyệt" on student "Trần Minh Tuấn"\'s row.\n' +
    '2. Before confirmation, the Head of Major reduces the supervisor\'s quota to match the occupied slots (1 occupied out of maxStudents = 1), triggering automatic rejection of remaining pending requests.\n' +
    '3. Click "Xác nhận" in the "Xác nhận phê duyệt đơn đăng ký" modal.',
  expected:
    '1. The API PATCH /api/teacher/advisor-registrations/{publicId}/approve returns HTTP 400 with code = 4000.\n' +
    '2. The response message is "Đơn đăng ký này đã được xử lý trước đó".\n' +
    '3. The database stores student "9990000201"\'s registration in REJECTED status (auto-rejected when quota became full) with an auto-rejection notification sent.\n' +
    '4. The UI displays error toast "Đơn đăng ký này đã được xử lý trước đó".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Đăng ký GVHD" deadline.\n' +
    '2. Supervisor "GV999201" has 1 TEACHER_APPROVED registration ("9990000202") and 1 PENDING registration ("9990000201"), and maxStudents is reduced to 1 by the Head of Major before confirmation.',
});

const ITC025 = defineItc({
  id: 'ITC025',
  feature: 'registration',
  module: 'DuyetDonDangKyGVHD',
  sheet: 'DuyetDonDangKyGVHD',
  fn: 'Approve Advisor Registration Request',
  description: 'Verify that approving a registration is blocked when the request has already been processed prior to confirmation',
  procedure:
    '1. Log in as a Supervisor, open the "Đăng ký GVHD" screen, and click "Duyệt" on student "Trần Minh Tuấn"\'s row.\n' +
    '2. Concurrently in another session, the registration is rejected so its status changes from PENDING to REJECTED.\n' +
    '3. Click "Xác nhận" in the "Xác nhận phê duyệt đơn đăng ký" modal.',
  expected:
    '1. The API PATCH /api/teacher/advisor-registrations/{publicId}/approve returns HTTP 400 with code = 4000.\n' +
    '2. The response message is "Đơn đăng ký này đã được xử lý trước đó".\n' +
    '3. The database retains student "9990000201"\'s registration in REJECTED status.\n' +
    '4. The UI displays error toast "Đơn đăng ký này đã được xử lý trước đó".',
  precondition:
    '1. Supervisor "GV999201" opens the approve modal while student "9990000201"\'s registration is PENDING, and the registration is concurrently processed to REJECTED before confirmation.',
});

const ITC026 = defineItc({
  id: 'ITC026',
  feature: 'registration',
  module: 'DuyetDonDangKyGVHD',
  sheet: 'DuyetDonDangKyGVHD',
  fn: 'Approve Advisor Registration Request',
  description: 'Verify that approving a pending registration is blocked when the processing deadline closes before confirmation',
  procedure:
    '1. Log in as a Supervisor, open the "Đăng ký GVHD" screen, and click "Duyệt" on student "Trần Minh Tuấn"\'s row.\n' +
    '2. The "Đăng ký GVHD" deadline closes before clicking confirm.\n' +
    '3. Click "Xác nhận" in the "Xác nhận phê duyệt đơn đăng ký" modal.',
  expected:
    '1. The API PATCH /api/teacher/advisor-registrations/{publicId}/approve returns HTTP 403 with code = 2001.\n' +
    '2. The response message is "Đã hết thời hạn xử lý đơn đăng ký GVHD".\n' +
    '3. The database keeps student "9990000201"\'s registration in PENDING status with processed_at = null.\n' +
    '4. The UI displays error toast "Đã hết thời hạn xử lý đơn đăng ký GVHD".',
  precondition:
    '1. Supervisor "GV999201" opens the approve modal while the deadline is OPEN, and the deadline transitions to CLOSED before confirmation.',
});

const ITC027 = defineItc({
  id: 'ITC027',
  feature: 'registration',
  module: 'DuyetDonDangKyGVHD',
  sheet: 'DuyetDonDangKyGVHD',
  fn: 'Reject Advisor Registration Request',
  description: 'Verify that a supervisor can reject a pending registration request and notify the student',
  procedure:
    '1. Log in as a Supervisor and open the "Đăng ký GVHD" screen.\n' +
    '2. Click "Từ chối" on the row of student "Trần Minh Tuấn" ("9990000201").\n' +
    '3. In the "Xác nhận từ chối đơn đăng ký" modal, click "Xác nhận".',
  expected:
    '1. The API PATCH /api/teacher/advisor-registrations/{publicId}/reject returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Từ chối đơn đăng ký giảng viên hướng dẫn thành công", with status = "REJECTED", statusDescription = "Đã từ chối", and a non-null processedAt.\n' +
    '3. The database updates student "9990000201"\'s registration to REJECTED with processed_at set and stores a rejection notification for student "9990000201".\n' +
    '4. The UI displays toast "Đã từ chối hướng dẫn đồ án của sinh viên Trần Minh Tuấn!", removes the row from "Chưa duyệt", and shows "Trần Minh Tuấn" with badge "Đã từ chối" under the "Đã từ chối" tab.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Đăng ký GVHD" deadline.\n' +
    '2. Supervisor "GV999201" has 1 PENDING registration from student "Trần Minh Tuấn" ("9990000201").',
});

const ITC028 = defineItc({
  id: 'ITC028',
  feature: 'registration',
  module: 'DuyetDonDangKyGVHD',
  sheet: 'DuyetDonDangKyGVHD',
  fn: 'Reject Advisor Registration Request',
  description: 'Verify that a supervisor can reject a pending registration request directly from the registration detail modal',
  procedure:
    '1. Log in as a Supervisor and open the "Đăng ký GVHD" screen.\n' +
    '2. Click "Xem chi tiết" on the row of student "Trần Minh Tuấn" ("9990000201").\n' +
    '3. Inside the "Chi tiết đơn đăng ký giảng viên hướng dẫn" modal, click "Từ chối", then click "Xác nhận" in the "Xác nhận từ chối đơn đăng ký" modal.',
  expected:
    '1. The API PATCH /api/teacher/advisor-registrations/{publicId}/reject returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Từ chối đơn đăng ký giảng viên hướng dẫn thành công" and status is REJECTED.\n' +
    '3. The database updates student "9990000201"\'s registration to REJECTED with processed_at set.\n' +
    '4. The UI displays toast "Đã từ chối hướng dẫn đồ án của sinh viên Trần Minh Tuấn!" and shows "Trần Minh Tuấn" under the "Đã từ chối" tab with badge "Đã từ chối".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Đăng ký GVHD" deadline.\n' +
    '2. Supervisor "GV999201" has 1 PENDING registration from student "Trần Minh Tuấn" ("9990000201").',
});

const ITC029 = defineItc({
  id: 'ITC029',
  feature: 'registration',
  module: 'DuyetDonDangKyGVHD',
  sheet: 'DuyetDonDangKyGVHD',
  fn: 'Reject Advisor Registration Request',
  description: 'Verify that rejecting a registration is blocked when the request has already been processed prior to confirmation',
  procedure:
    '1. Log in as a Supervisor, open the "Đăng ký GVHD" screen, and click "Từ chối" on student "Trần Minh Tuấn"\'s row.\n' +
    '2. Concurrently in another session, the registration is approved so its status changes from PENDING to TEACHER_APPROVED.\n' +
    '3. Click "Xác nhận" in the "Xác nhận từ chối đơn đăng ký" modal.',
  expected:
    '1. The API PATCH /api/teacher/advisor-registrations/{publicId}/reject returns HTTP 400 with code = 4000.\n' +
    '2. The response message is "Đơn đăng ký này đã được xử lý trước đó".\n' +
    '3. The database retains student "9990000201"\'s registration in TEACHER_APPROVED status.\n' +
    '4. The UI displays error toast "Đơn đăng ký này đã được xử lý trước đó".',
  precondition:
    '1. Supervisor "GV999201" opens the reject modal while student "9990000201"\'s registration is PENDING, and the registration is concurrently processed to TEACHER_APPROVED before confirmation.',
});

const ITC030 = defineItc({
  id: 'ITC030',
  feature: 'registration',
  module: 'DuyetDonDangKyGVHD',
  sheet: 'DuyetDonDangKyGVHD',
  fn: 'Reject Advisor Registration Request',
  description: 'Verify that rejecting a pending registration is blocked when the processing deadline closes before confirmation',
  procedure:
    '1. Log in as a Supervisor, open the "Đăng ký GVHD" screen, and click "Từ chối" on student "Trần Minh Tuấn"\'s row.\n' +
    '2. The "Đăng ký GVHD" deadline closes before clicking confirm.\n' +
    '3. Click "Xác nhận" in the "Xác nhận từ chối đơn đăng ký" modal.',
  expected:
    '1. The API PATCH /api/teacher/advisor-registrations/{publicId}/reject returns HTTP 403 with code = 2001.\n' +
    '2. The response message is "Đã hết thời hạn xử lý đơn đăng ký GVHD".\n' +
    '3. The database keeps student "9990000201"\'s registration in PENDING status with processed_at = null.\n' +
    '4. The UI displays error toast "Đã hết thời hạn xử lý đơn đăng ký GVHD".',
  precondition:
    '1. Supervisor "GV999201" opens the reject modal while the deadline is OPEN, and the deadline transitions to CLOSED before confirmation.',
});

// ============================================================================
// SECURITY TEST CASES (TC-SEC-005 .. TC-SEC-009)
// ============================================================================

const SEC005 = defineItcSec({
  id: 'TC-SEC-005',
  feature: 'registration',
  module: 'DuyetDonDangKyGVHD',
  sheet: 'DuyetDonDangKyGVHD',
  scenario: 'An unauthenticated user opens the supervisor registration management screen directly',
  roleSession: 'Unauthenticated (Anonymous)',
  technique: 'EP',
  given: 'The browser has no active login session (no access_token cookie)',
  when: 'Open "/lecturer/supervisor-requests" directly on the Lecturer portal and call GET /api/teacher/advisor-registrations',
  then: 'GET /my-info and GET /api/teacher/advisor-registrations return HTTP 401 with code = 2000; the UI automatically redirects to "/login" and displays no registration data',
});

const SEC006 = defineItcSec({
  id: 'TC-SEC-006',
  feature: 'registration',
  module: 'DuyetDonDangKyGVHD',
  sheet: 'DuyetDonDangKyGVHD',
  scenario: 'A student accesses the supervisor registration management screen and invokes supervisor approve API',
  roleSession: 'Student (STUDENT), logged in',
  technique: 'EP',
  given: 'Logged in with a Student account (without SUPERVISOR role or REVIEW_ADVISOR_REQUEST authority)',
  when: 'Open "/lecturer/supervisor-requests" directly on the Lecturer portal and send GET /api/teacher/advisor-registrations and PATCH /api/teacher/advisor-registrations/{publicId}/approve',
  then: 'The UI blocks access with message "Tài khoản của bạn không có quyền truy cập cổng cán bộ."; both APIs return HTTP 403 with code = 2001 and message "Bạn không có quyền truy cập (access denied)", and the registration remains PENDING in the database',
});

const SEC007 = defineItcSec({
  id: 'TC-SEC-007',
  feature: 'registration',
  module: 'DuyetDonDangKyGVHD',
  sheet: 'DuyetDonDangKyGVHD',
  scenario: 'A lecturer not assigned as a supervisor accesses the supervisor registration screen and calls reject API',
  roleSession: 'Lecturer (LECTURER), logged in',
  technique: 'EP',
  given: 'Logged in with a Lecturer account not assigned as a supervisor in the semester (without SUPERVISOR role)',
  when: 'Open "/lecturer/supervisor-requests" directly on the Lecturer portal and send GET /api/teacher/advisor-registrations and PATCH /api/teacher/advisor-registrations/{publicId}/reject',
  then: 'The UI blocks access with message "Tài khoản của bạn không có quyền truy cập cổng cán bộ."; both APIs return HTTP 403 with code = 2001 and message "Bạn không có quyền truy cập (access denied)", and the registration remains PENDING in the database',
});

const SEC008 = defineItcSec({
  id: 'TC-SEC-008',
  feature: 'registration',
  module: 'DuyetDonDangKyGVHD',
  sheet: 'DuyetDonDangKyGVHD',
  scenario: 'A supervisor session with a logged-out token accesses the registration screen and approval API',
  roleSession: 'Supervisor (SUPERVISOR), logged-out token',
  technique: 'STATE_TRANSITION',
  given: 'The supervisor has logged out via POST /log-out so the token is invalidated, while the browser still sends the old access_token cookie',
  when: 'Open "/lecturer/supervisor-requests" and call GET /api/teacher/advisor-registrations and PATCH /api/teacher/advisor-registrations/{publicId}/approve with the logged-out token',
  then: 'Both APIs return HTTP 401 with code = 2000; the UI redirects to "/login" and displays no registration data',
});

const SEC009 = defineItcSec({
  id: 'TC-SEC-009',
  feature: 'registration',
  module: 'DuyetDonDangKyGVHD',
  sheet: 'DuyetDonDangKyGVHD',
  scenario: 'Another supervisor attempts to view, approve, or reject a registration addressed to a different supervisor',
  roleSession: 'Supervisor (SUPERVISOR), logged in as another supervisor',
  technique: 'ERROR_GUESSING',
  given: 'Supervisor "GV999202" is logged in while student "9990000201" has a PENDING registration addressed to Supervisor "GV999201"',
  when: 'Open "/lecturer/supervisor-requests" as Supervisor "GV999202" and call GET /api/teacher/advisor-registrations/{publicId}, PATCH /api/teacher/advisor-registrations/{publicId}/approve, and PATCH /api/teacher/advisor-registrations/{publicId}/reject targeting Supervisor "GV999201"\'s registration',
  then: 'Student "9990000201" is not displayed in Supervisor "GV999202"\'s list; all three APIs return HTTP 404 with code = 3022 and message "Không tìm thấy đơn đăng ký hoặc bạn không có quyền truy cập", and the registration remains PENDING in the database',
});

// ============================================================================
// HẠ TẦNG DỮ LIỆU TEST (TẠO QUA API, ĐỐI CHIẾU DB SELECT, DỌN SẠCH SAU TEST)
// ============================================================================

const TEST_SUPERVISOR_1 = {
  teacherCode: 'GV999201',
  firstName: 'Nguyễn Văn',
  lastName: 'Hùng',
  fullName: 'Nguyễn Văn Hùng',
  email: 'itc.gv.999201@tlu.edu.vn',
  phone: '0989920201',
  academicTitle: 'TS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_SUPERVISOR_2 = {
  teacherCode: 'GV999202',
  firstName: 'Đỗ Thị',
  lastName: 'Lan',
  fullName: 'Đỗ Thị Lan',
  email: 'itc.gv.999202@tlu.edu.vn',
  phone: '0989920202',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_PLAIN_LECTURER = {
  teacherCode: 'GV999203',
  firstName: 'Vũ Minh',
  lastName: 'Tuấn',
  fullName: 'Vũ Minh Tuấn',
  email: 'itc.gv.999203@tlu.edu.vn',
  phone: '0989920203',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_STUDENT_1 = {
  studentCode: '9990000201',
  firstName: 'Trần Minh',
  lastName: 'Tuấn',
  fullName: 'Trần Minh Tuấn',
  email: 'itc.sv.9990000201@gmail.com',
  phone: '0989920101',
  batch: 'K64',
  className: '64KTPM99',
};

const TEST_STUDENT_2 = {
  studentCode: '9990000202',
  firstName: 'Lê Thu',
  lastName: 'Hà',
  fullName: 'Lê Thu Hà',
  email: 'itc.sv.9990000202@gmail.com',
  phone: '0989920102',
  batch: 'K64',
  className: '64KTPM99',
};

const TEST_STUDENT_3 = {
  studentCode: '9990000203',
  firstName: 'Phạm Đức',
  lastName: 'Anh',
  fullName: 'Phạm Đức Anh',
  email: 'itc.sv.9990000203@gmail.com',
  phone: '0989920103',
  batch: 'K64',
  className: '64KTPM99',
};

type StudentProfile = typeof TEST_STUDENT_1;

interface CreatedStudentHandle {
  profile: StudentProfile;
  publicId: string;
  token: string;
  registrationPublicId?: string;
}

interface TestEnvState {
  hodToken: string;
  supervisor1Id: number;
  supervisor1PublicId: string;
  supervisor1Token: string;
  supervisor2Id: number;
  supervisor2PublicId: string;
  supervisor2Token: string;
  plainLecturerId: number;
  plainLecturerToken: string;
  semesterId: number;
  semesterPublicId: string;
  semesterStartDate: string;
  semesterEndDate: string;
  originallyLocked: boolean;
  majorName: string;
  dkGvhdTemplateId: string;
  dkGvhdDeadlineId: string | null;
  originalDeadlineStart: string | null;
  originalDeadlineEnd: string | null;
  originalDeadlineStatus: string | null;
}

let envState: TestEnvState;
let activeStudentHandles: CreatedStudentHandle[] = [];
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

async function configureDangKyGvhdDeadline(
  request: APIRequestContext,
  mode: 'OPEN' | 'CLOSED' | 'RESTORE',
) {
  const semStart = new Date(`${envState.semesterStartDate}T00:00:00`);
  const semEnd = new Date(`${envState.semesterEndDate}T23:59:59`);
  const now = new Date();

  let startDateStr: string;
  let endDateStr: string;
  let status: string | undefined;

  if (mode === 'RESTORE') {
    if (!envState.originalDeadlineStart || !envState.originalDeadlineEnd) {
      return;
    }
    startDateStr = envState.originalDeadlineStart;
    endDateStr = envState.originalDeadlineEnd;
    status = envState.originalDeadlineStatus ?? undefined;
  } else if (mode === 'OPEN') {
    const start = new Date(Math.max(semStart.getTime(), now.getTime() - 24 * 3600 * 1000));
    const end = new Date(Math.min(semEnd.getTime(), now.getTime() + 48 * 3600 * 1000));
    startDateStr = toLocalIso(start);
    endDateStr = toLocalIso(end);
    status = 'IN_PROGRESS';
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
          deadlineId: envState.dkGvhdDeadlineId,
          templateId: envState.dkGvhdTemplateId,
          startDate: startDateStr,
          endDate: endDateStr,
          status,
        },
      ],
    },
  });

  if (res.status !== 200) {
    throw new Error(`Không thể cập nhật deadline DANG_KY_GVHD (${mode}): ${JSON.stringify(res.body)}`);
  }

  const dlRes = await apiCall(request, envState.hodToken, 'GET', '/api/v1/deadlines', {
    params: { semesterId: envState.semesterPublicId },
  });
  const list: any[] = dlRes.body?.data?.giaoNhanDeadlines ?? [];
  const found = list.find((d) => d.code === 'DANG_KY_GVHD');
  if (found?.deadlineId) {
    envState.dkGvhdDeadlineId = found.deadlineId;
  }
}

async function setSupervisorQuota(request: APIRequestContext, teacherId: number, maxStudents: number) {
  const res = await apiCall(
    request,
    envState.hodToken,
    'PUT',
    `/semesters/${envState.semesterPublicId}/advisors/${teacherId}/quota`,
    { data: { maxStudents } },
  );
  if (res.status !== 200) {
    throw new Error(`Không thể cập nhật quota cho teacherId=${teacherId}: ${JSON.stringify(res.body)}`);
  }
}

async function ensureFreshTeacher(
  request: APIRequestContext,
  teacher: typeof TEST_SUPERVISOR_1,
  assignAsAdvisor: boolean,
  maxStudents = 5,
): Promise<{ id: number; publicId: string; token: string }> {
  // Nếu giảng viên test cũ đã tồn tại và có đơn đăng ký từ lần chạy trước, xoay mã/email/SĐT để tạo mới sạch hoàn toàn
  const existingRows = await dbSelect<{ id: number; reg_count: number }>(
    `SELECT t.id,
            (SELECT COUNT(*) FROM advisor_registration ar WHERE ar.lecturer_id = t.id) AS reg_count
       FROM teacher t
      WHERE t.teacher_code = ?`,
    [teacher.teacherCode],
  );

  if (existingRows.length > 0 && Number(existingRows[0].reg_count) > 0) {
    const oldId = existingRows[0].id;
    const suffix = `${String(Date.now()).slice(-5)}${rotateCounter++}`;
    await apiCall(request, envState.hodToken, 'PUT', `/teacher/${oldId}`, {
      data: {
        teacherCode: `GV99${suffix.slice(-5)}`,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: `itc.arch.gv.${suffix}@tlu.edu.vn`,
        phone: `0978${suffix.slice(-6)}`,
        academicTitle: teacher.academicTitle,
        organization: teacher.organization,
        major: envState.majorName,
      },
    });
  } else if (existingRows.length > 0 && !assignAsAdvisor) {
    // Nếu tồn tại nhưng không có đơn, gỡ khỏi advisor kỳ này nếu cần
    await apiCall(
      request,
      envState.hodToken,
      'DELETE',
      `/semesters/${envState.semesterPublicId}/advisors/${existingRows[0].id}`,
    );
  }

  await apiCall(request, envState.hodToken, 'POST', '/teacher', {
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

  const tRows = await dbSelect<{ id: number }>(
    'SELECT id FROM teacher WHERE teacher_code = ?',
    [teacher.teacherCode],
  );
  if (tRows.length === 0) {
    throw new Error(`Không tìm thấy giảng viên ${teacher.teacherCode} sau khi tạo`);
  }
  const teacherId = tRows[0].id;

  let teacherPublicId = '';
  if (assignAsAdvisor) {
    const assignRes = await apiCall(
      request,
      envState.hodToken,
      'POST',
      `/semesters/${envState.semesterPublicId}/advisors`,
      {
        data: {
          teacherIds: [teacherId],
          maxStudentsPerTeacher: maxStudents,
        },
      },
    );
    if (assignRes.status !== 200) {
      throw new Error(`Không thể phân công ${teacher.teacherCode} làm GVHD: ${JSON.stringify(assignRes.body)}`);
    }
    const advisorsRes = await apiCall(
      request,
      envState.hodToken,
      'GET',
      `/semesters/${envState.semesterPublicId}/advisors`,
    );
    const matched = (advisorsRes.body?.data ?? []).find((a: any) => a.teacherCode === teacher.teacherCode);
    teacherPublicId = matched?.teacherPublicId ?? '';
  }

  const token = await loginByEmail(request, teacher.email);
  return { id: teacherId, publicId: teacherPublicId, token };
}

async function createCleanStudentWithRegistration(
  request: APIRequestContext,
  profile: StudentProfile,
  options?: {
    topicName?: string | null;
    targetStatus?: 'PENDING' | 'TEACHER_APPROVED' | 'REJECTED';
  },
): Promise<CreatedStudentHandle> {
  // Nếu mã sinh viên còn sót trong học kỳ, xử lý dọn hoặc xoay mã trước khi tạo mới
  const existing = await dbSelect<{ id: number; reg_count: number }>(
    `SELECT s.id,
            (SELECT COUNT(*) FROM advisor_registration ar WHERE ar.student_id = s.id) AS reg_count
       FROM student s
      WHERE s.student_code = ?`,
    [profile.studentCode],
  );

  if (existing.length > 0) {
    const listRes = await apiCall(request, envState.hodToken, 'GET', '/student', {
      params: { semesterId: envState.semesterPublicId, keyword: profile.studentCode },
    });
    const matched = (listRes.body?.data?.content ?? []).find(
      (s: any) => s.studentCode === profile.studentCode,
    );
    if (matched?.publicId) {
      if (Number(existing[0].reg_count) === 0) {
        await apiCall(request, envState.hodToken, 'DELETE', `/student/${matched.publicId}`, {
          params: { semesterId: envState.semesterPublicId },
        });
      } else {
        const suffix = `${String(Date.now()).slice(-5)}${rotateCounter++}`;
        await apiCall(request, envState.hodToken, 'PUT', `/student/${matched.publicId}`, {
          data: {
            studentCode: `9998${suffix.slice(-6)}`,
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: `itc.arch.sv.${suffix}@gmail.com`,
            phone: `0977${suffix.slice(-6)}`,
            batch: profile.batch,
            className: profile.className,
          },
        });
      }
    }
  }

  const createRes = await apiCall(request, envState.hodToken, 'POST', '/student', {
    data: {
      studentCode: profile.studentCode,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      batch: profile.batch,
      className: profile.className,
      major: envState.majorName,
    },
  });
  if (createRes.status !== 200) {
    throw new Error(`Không thể tạo sinh viên test ${profile.studentCode}: ${JSON.stringify(createRes.body)}`);
  }

  const listRes = await apiCall(request, envState.hodToken, 'GET', '/student', {
    params: { semesterId: envState.semesterPublicId, keyword: profile.studentCode },
  });
  const matched = (listRes.body?.data?.content ?? []).find(
    (s: any) => s.studentCode === profile.studentCode,
  );
  if (!matched?.publicId) {
    throw new Error(`Không tìm thấy publicId của sinh viên ${profile.studentCode}`);
  }

  const studentToken = await loginByEmail(request, profile.email);
  const handle: CreatedStudentHandle = {
    profile,
    publicId: matched.publicId,
    token: studentToken,
  };
  activeStudentHandles.push(handle);

  if (options) {
    const submitRes = await apiCall(request, studentToken, 'POST', '/api/student/advisor-registrations', {
      data: {
        teacherPublicId: envState.supervisor1PublicId,
        topicName: options.topicName === undefined ? 'Đề tài kiểm thử mặc định' : options.topicName,
      },
    });
    if (submitRes.status !== 200 || !submitRes.body?.data?.registrationPublicId) {
      throw new Error(`Sinh viên ${profile.studentCode} không thể gửi đơn đăng ký: ${JSON.stringify(submitRes.body)}`);
    }
    const regPublicId: string = submitRes.body.data.registrationPublicId;
    handle.registrationPublicId = regPublicId;

    if (options.targetStatus === 'TEACHER_APPROVED') {
      const appRes = await apiCall(
        request,
        envState.supervisor1Token,
        'PATCH',
        `/api/teacher/advisor-registrations/${regPublicId}/approve`,
      );
      if (appRes.status !== 200) {
        throw new Error(`Không thể duyệt sẵn đơn ${regPublicId}: ${JSON.stringify(appRes.body)}`);
      }
    } else if (options.targetStatus === 'REJECTED') {
      const rejRes = await apiCall(
        request,
        envState.supervisor1Token,
        'PATCH',
        `/api/teacher/advisor-registrations/${regPublicId}/reject`,
      );
      if (rejRes.status !== 200) {
        throw new Error(`Không thể từ chối sẵn đơn ${regPublicId}: ${JSON.stringify(rejRes.body)}`);
      }
    }
  }

  return handle;
}

/**
 * Dọn sạch các đơn PENDING/TEACHER_APPROVED và giải phóng mã sinh viên sau mỗi test case:
 * - Đơn PENDING -> GVHD từ chối qua API để không còn đơn chờ duyệt.
 * - Đơn TEACHER_APPROVED -> TBM từ chối (chuyển HOD_REJECTED) để giải phóng 100% chỉ tiêu cho GVHD.
 * - Sinh viên chưa có đơn -> DELETE /student/{publicId} xóa sạch hoàn toàn.
 * - Sinh viên đã có lịch sử đơn -> xoay mã/email/SĐT tạm qua PUT /student/{publicId} để giải phóng mã test.
 */
async function cleanupActiveStudents(request: APIRequestContext) {
  if (activeStudentHandles.length === 0) return;

  const handles = [...activeStudentHandles];
  activeStudentHandles = [];

  await configureDangKyGvhdDeadline(request, 'OPEN');

  // 1. Từ chối mọi đơn PENDING còn lại của các sinh viên test
  const pendingRes = await apiCall(request, envState.supervisor1Token, 'GET', '/api/teacher/advisor-registrations', {
    params: { semesterPublicId: envState.semesterPublicId, status: 'PENDING' },
  });
  const pendingRegs: any[] = pendingRes.body?.data?.registrations ?? [];
  const testCodes = new Set(handles.map((h) => h.profile.studentCode));

  for (const r of pendingRegs) {
    if (testCodes.has(r.studentCode)) {
      await apiCall(
        request,
        envState.supervisor1Token,
        'PATCH',
        `/api/teacher/advisor-registrations/${r.registrationPublicId}/reject`,
      );
    }
  }

  // 2. Giải phóng chỉ tiêu cho mọi đơn TEACHER_APPROVED qua API từ chối của TBM
  const allRes = await apiCall(request, envState.supervisor1Token, 'GET', '/api/teacher/advisor-registrations', {
    params: { semesterPublicId: envState.semesterPublicId },
  });
  const approvedIds = (allRes.body?.data?.registrations ?? [])
    .filter((r: any) => testCodes.has(r.studentCode) && r.status === 'TEACHER_APPROVED')
    .map((r: any) => r.registrationPublicId);

  if (approvedIds.length > 0) {
    await configureDangKyGvhdDeadline(request, 'CLOSED');
    await apiCall(
      request,
      envState.hodToken,
      'PUT',
      `/semesters/${envState.semesterPublicId}/advisor-assignments/reject`,
      { data: { registrationPublicIds: approvedIds } },
    );
    await configureDangKyGvhdDeadline(request, 'OPEN');
  }

  // 3. Xóa hoặc xoay mã cho từng sinh viên test
  for (const h of handles) {
    const regRows = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM advisor_registration ar
         JOIN student s ON s.id = ar.student_id
        WHERE s.student_code = ?`,
      [h.profile.studentCode],
    );
    if (Number(regRows[0]?.total ?? 0) === 0) {
      await apiCall(request, envState.hodToken, 'DELETE', `/student/${h.publicId}`, {
        params: { semesterId: envState.semesterPublicId },
      });
    } else {
      const suffix = `${String(Date.now()).slice(-5)}${rotateCounter++}`;
      await apiCall(request, envState.hodToken, 'PUT', `/student/${h.publicId}`, {
        data: {
          studentCode: `9998${suffix.slice(-6)}`,
          firstName: h.profile.firstName,
          lastName: h.profile.lastName,
          email: `itc.arch.sv.${suffix}@gmail.com`,
          phone: `0977${suffix.slice(-6)}`,
          batch: h.profile.batch,
          className: h.profile.className,
        },
      });
    }
  }
}

async function openSupervisorRequestsPage(page: any, context: BrowserContext, token: string) {
  await setAuthCookie(context, token);

  const deadlinePromise = page.waitForResponse(
    (r: any) =>
      r.url().includes('/api/teacher/advisor-registrations/deadline') &&
      r.request().method() === 'GET',
  );
  const listPromise = page.waitForResponse(
    (r: any) =>
      /\/api\/teacher\/advisor-registrations\?semesterPublicId=/.test(r.url()) &&
      r.request().method() === 'GET',
  );

  await page.goto('/lecturer/supervisor-requests');
  const [deadlineRes, listRes] = await Promise.all([deadlinePromise, listPromise]);
  return { deadlineRes, listRes };
}

test.describe('Report 5.2 - Supervisor Approve/Reject Advisor Registration Requests (DuyetDonDangKyGVHD)', () => {
  test.beforeAll(async ({ request }) => {
    const hodEmail = process.env.E2E_EMAIL_HEAD_OF_MAJOR?.trim();
    if (!hodEmail) {
      throw new Error('Thiếu E2E_EMAIL_HEAD_OF_MAJOR trong .env.e2e');
    }

    const hodToken = await loginByEmail(request, hodEmail);

    // 1. Lấy học kỳ hiện tại
    const semRes = await apiCall(request, hodToken, 'GET', '/semester/current');
    if (semRes.status !== 200 || !semRes.body?.data?.publicId) {
      throw new Error('Không tìm thấy học kỳ hiện tại (GET /semester/current)');
    }
    const semData = semRes.body.data;
    const semRows = await dbSelect<{
      id: number;
      is_advisor_assignment_locked: number;
      start_date: string;
      end_date: string;
    }>(
      'SELECT id, is_advisor_assignment_locked, DATE_FORMAT(start_date, "%Y-%m-%d") AS start_date, DATE_FORMAT(end_date, "%Y-%m-%d") AS end_date FROM semester WHERE name = ?',
      [semData.name],
    );
    if (semRows.length === 0) {
      throw new Error(`Không tìm thấy học kỳ "${semData.name}" trong DB`);
    }

    // 2. Lấy ngành phụ trách của TBM
    const majorRes = await apiCall(request, hodToken, 'GET', '/teacher/managed-major');
    let majorName: string | undefined = majorRes.body?.data?.name;
    if (!majorName) {
      const allMajorsRes = await apiCall(request, hodToken, 'GET', '/major');
      majorName = allMajorsRes.body?.data?.[0]?.name;
    }
    if (!majorName) {
      throw new Error('Không xác định được ngành học để tạo dữ liệu test');
    }

    // 3. Lưu lại cấu hình deadline DANG_KY_GVHD để khôi phục sau khi chạy
    const dlRes = await apiCall(request, hodToken, 'GET', '/api/v1/deadlines', {
      params: { semesterId: semData.publicId },
    });
    const giaoNhan: any[] = dlRes.body?.data?.giaoNhanDeadlines ?? [];
    const dkGvhd = giaoNhan.find((d) => d.code === 'DANG_KY_GVHD');
    const tbmChot = giaoNhan.find((d) => d.code === 'TBM_CHOT_DS_GVHD_DU_KIEN');
    if (!dkGvhd?.templateId) {
      throw new Error('Không tìm thấy mốc mẫu DANG_KY_GVHD');
    }

    if (tbmChot?.templateId) {
      const now = new Date();
      const sStart = new Date(`${semRows[0].start_date}T00:00:00`);
      const sEnd = new Date(`${semRows[0].end_date}T23:59:59`);
      await apiCall(request, hodToken, 'PUT', '/api/v1/deadlines/batch-update', {
        data: {
          semesterId: semData.publicId,
          deadlines: [
            {
              deadlineId: tbmChot.deadlineId ?? null,
              templateId: tbmChot.templateId,
              startDate: toLocalIso(new Date(Math.max(sStart.getTime(), now.getTime() - 24 * 3600 * 1000))),
              endDate: toLocalIso(new Date(Math.min(sEnd.getTime(), now.getTime() + 48 * 3600 * 1000))),
              status: 'IN_PROGRESS',
            },
          ],
        },
      });
    }

    envState = {
      hodToken,
      supervisor1Id: 0,
      supervisor1PublicId: '',
      supervisor1Token: '',
      supervisor2Id: 0,
      supervisor2PublicId: '',
      supervisor2Token: '',
      plainLecturerId: 0,
      plainLecturerToken: '',
      semesterId: semRows[0].id,
      semesterPublicId: semData.publicId,
      semesterStartDate: semRows[0].start_date,
      semesterEndDate: semRows[0].end_date,
      originallyLocked: Boolean(semRows[0].is_advisor_assignment_locked),
      majorName,
      dkGvhdTemplateId: dkGvhd.templateId,
      dkGvhdDeadlineId: dkGvhd.deadlineId ?? null,
      originalDeadlineStart: dkGvhd.startDate ?? null,
      originalDeadlineEnd: dkGvhd.endDate ?? null,
      originalDeadlineStatus: dkGvhd.status ?? null,
    };

    if (envState.originallyLocked) {
      await configureDangKyGvhdDeadline(request, 'CLOSED');
      await apiCall(
        request,
        hodToken,
        'PUT',
        `/semesters/${envState.semesterPublicId}/advisor-assignments/lock-status`,
        { data: { isLocked: false } },
      );
    }

    await configureDangKyGvhdDeadline(request, 'OPEN');

    // 4. Tạo 2 giảng viên hướng dẫn (SUPERVISOR) và 1 giảng viên thường (LECTURER) sạch cho bộ test
    const sup1 = await ensureFreshTeacher(request, TEST_SUPERVISOR_1, true, 5);
    envState.supervisor1Id = sup1.id;
    envState.supervisor1PublicId = sup1.publicId;
    envState.supervisor1Token = sup1.token;

    const sup2 = await ensureFreshTeacher(request, TEST_SUPERVISOR_2, true, 5);
    envState.supervisor2Id = sup2.id;
    envState.supervisor2PublicId = sup2.publicId;
    envState.supervisor2Token = sup2.token;

    const plain = await ensureFreshTeacher(request, TEST_PLAIN_LECTURER, false);
    envState.plainLecturerId = plain.id;
    envState.plainLecturerToken = plain.token;
  });

  test.afterAll(async ({ request }) => {
    if (!envState) return;
    try {
      await cleanupActiveStudents(request);
    } catch {
      // bỏ qua lỗi khi dọn cuối bộ test
    }

    // Gỡ giảng viên không có lịch sử đơn (Supervisor 2 và Plain Lecturer) để giữ DB sạch
    for (const tId of [envState.supervisor2Id, envState.plainLecturerId]) {
      if (!tId) continue;
      await apiCall(
        request,
        envState.hodToken,
        'DELETE',
        `/semesters/${envState.semesterPublicId}/advisors/${tId}`,
      );
      await apiCall(request, envState.hodToken, 'DELETE', `/teacher/${tId}`);
    }

    // Khôi phục lại thời hạn DANG_KY_GVHD và trạng thái khóa ban đầu
    await configureDangKyGvhdDeadline(request, 'RESTORE');
    if (envState.originallyLocked) {
      await apiCall(
        request,
        envState.hodToken,
        'PUT',
        `/semesters/${envState.semesterPublicId}/advisor-assignments/lock-status`,
        { data: { isLocked: true } },
      );
    }
  });

  // ==========================================================================
  // NHÓM CHỈ ĐỌC (ITC015 .. ITC019): DÙNG CHUNG BỘ 3 ĐƠN (1 PENDING, 1 APPROVED, 1 REJECTED)
  // ==========================================================================
  test.describe('Read-only views, filtering, deadline closed, and detail modal (ITC015..ITC019)', () => {
    let student1Handle: CreatedStudentHandle;

    test.beforeAll(async ({ request }) => {
      await configureDangKyGvhdDeadline(request, 'OPEN');
      await setSupervisorQuota(request, envState.supervisor1Id, 5);

      student1Handle = await createCleanStudentWithRegistration(request, TEST_STUDENT_1, {
        topicName: 'Hệ thống quản lý đồ án tốt nghiệp thông minh',
        targetStatus: 'PENDING',
      });
      await createCleanStudentWithRegistration(request, TEST_STUDENT_2, {
        topicName: 'Ứng dụng AI dự báo tiến độ học tập',
        targetStatus: 'TEACHER_APPROVED',
      });
      await createCleanStudentWithRegistration(request, TEST_STUDENT_3, {
        topicName: 'Hệ thống thương mại điện tử đa nền tảng',
        targetStatus: 'REJECTED',
      });
    });

    test.afterEach(async ({ request }) => {
      await configureDangKyGvhdDeadline(request, 'OPEN');
    });

    test.afterAll(async ({ request }) => {
      await cleanupActiveStudents(request);
    });

    test(ITC015.title, { annotation: ITC015.annotation }, async ({ page, context }) => {
      const { deadlineRes, listRes } = await openSupervisorRequestsPage(
        page,
        context,
        envState.supervisor1Token,
      );

      expect(deadlineRes.status()).toBe(200);
      const deadlineBody = await deadlineRes.json();
      expect(deadlineBody.code).toBe(1000);
      expect(deadlineBody.data.status).toBe('OPEN');

      expect(listRes.status()).toBe(200);
      expect(listRes.url()).toContain('status=PENDING');
      const listBody = await listRes.json();
      expect(listBody.code).toBe(1000);
      expect(listBody.data.pendingCount).toBe(1);
      expect(listBody.data.approvedCount).toBe(1);
      expect(listBody.data.rejectedCount).toBe(1);
      expect(listBody.data.totalCount).toBe(3);

      // Kiểm tra giao diện tab & dòng chờ duyệt
      const pendingRow = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(pendingRow).toBeVisible();
      await expect(pendingRow).toContainText(TEST_STUDENT_1.fullName);
      await expect(pendingRow).toContainText('Hệ thống quản lý đồ án tốt nghiệp thông minh');
      await expect(pendingRow.getByRole('button', { name: 'Duyệt', exact: true })).toBeEnabled();
      await expect(pendingRow.getByRole('button', { name: 'Từ chối', exact: true })).toBeEnabled();

      await expect(page.getByRole('button', { name: /^Chưa duyệt/ })).toContainText('1');
      await expect(page.getByRole('button', { name: /^Đã duyệt/ })).toContainText('1');
      await expect(page.getByRole('button', { name: /^Đã từ chối/ })).toContainText('1');
      await expect(page.getByRole('button', { name: /^Tất cả/ })).toContainText('3');

      // Đối chiếu DB bằng SELECT
      const dbRows = await dbSelect<{ status: string; total: number }>(
        `SELECT ar.status, COUNT(*) AS total
           FROM advisor_registration ar
           JOIN teacher t ON t.id = ar.lecturer_id
          WHERE t.teacher_code = ? AND ar.semester_id = ?
          GROUP BY ar.status`,
        [TEST_SUPERVISOR_1.teacherCode, envState.semesterId],
      );
      const countByStatus = new Map(dbRows.map((r) => [r.status, Number(r.total)]));
      expect(countByStatus.get('PENDING')).toBe(1);
      expect(countByStatus.get('TEACHER_APPROVED')).toBe(1);
      expect(countByStatus.get('REJECTED')).toBe(1);
    });

    test(ITC016.title, { annotation: ITC016.annotation }, async ({ page, context }) => {
      await openSupervisorRequestsPage(page, context, envState.supervisor1Token);

      // Tab Đã duyệt
      const approvedTabPromise = page.waitForResponse(
        (r) =>
          /\/api\/teacher\/advisor-registrations\?semesterPublicId=/.test(r.url()) &&
          !r.url().includes('status=') &&
          r.request().method() === 'GET',
      );
      await page.getByRole('button', { name: /^Đã duyệt/ }).click();
      const approvedTabRes = await approvedTabPromise;
      expect(approvedTabRes.status()).toBe(200);
      expect((await approvedTabRes.json()).code).toBe(1000);

      const approvedRow = page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) });
      await expect(approvedRow).toBeVisible();
      await expect(approvedRow).toContainText(TEST_STUDENT_2.fullName);
      await expect(approvedRow).toContainText('GV đã duyệt');

      // Tab Đã từ chối
      const rejectedTabPromise = page.waitForResponse(
        (r) =>
          /\/api\/teacher\/advisor-registrations\?semesterPublicId=/.test(r.url()) &&
          r.url().includes('status=REJECTED') &&
          r.request().method() === 'GET',
      );
      await page.getByRole('button', { name: /^Đã từ chối/ }).click();
      const rejectedTabRes = await rejectedTabPromise;
      expect(rejectedTabRes.status()).toBe(200);
      expect((await rejectedTabRes.json()).code).toBe(1000);

      const rejectedRow = page.getByRole('row', { name: new RegExp(TEST_STUDENT_3.studentCode) });
      await expect(rejectedRow).toBeVisible();
      await expect(rejectedRow).toContainText(TEST_STUDENT_3.fullName);
      await expect(rejectedRow).toContainText('Đã từ chối');

      // Tab Tất cả + tìm kiếm theo mã sinh viên 9990000202
      await page.getByRole('button', { name: /^Tất cả/ }).click();
      const searchPromise = page.waitForResponse(
        (r) =>
          /\/api\/teacher\/advisor-registrations\?/.test(r.url()) &&
          r.url().includes(`keyword=${TEST_STUDENT_2.studentCode}`) &&
          r.request().method() === 'GET',
      );
      await page
        .getByPlaceholder('Tìm theo mã sinh viên, tên sinh viên...')
        .fill(TEST_STUDENT_2.studentCode);
      const searchRes = await searchPromise;

      expect(searchRes.status()).toBe(200);
      const searchBody = await searchRes.json();
      expect(searchBody.code).toBe(1000);
      expect(searchBody.data.registrations).toHaveLength(1);
      expect(searchBody.data.registrations[0].studentCode).toBe(TEST_STUDENT_2.studentCode);

      await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) })).toBeVisible();
      await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) })).toHaveCount(0);
    });

    test(ITC017.title, { annotation: ITC017.annotation }, async ({ page, context, request }) => {
      await configureDangKyGvhdDeadline(request, 'CLOSED');

      const { deadlineRes, listRes } = await openSupervisorRequestsPage(
        page,
        context,
        envState.supervisor1Token,
      );

      expect(deadlineRes.status()).toBe(200);
      const deadlineBody = await deadlineRes.json();
      expect(deadlineBody.code).toBe(1000);
      expect(deadlineBody.data.status).toBe('CLOSED');

      expect(listRes.status()).toBe(200);
      expect((await listRes.json()).code).toBe(1000);

      await expect(page.getByText('Đã hết hạn xử lý đơn', { exact: true })).toBeVisible();
      await expect(
        page.getByText(
          'Đã hết hạn xử lý đơn — Hiện chỉ xem danh sách, không thể duyệt hoặc từ chối đơn đăng ký.',
        ),
      ).toBeVisible();

      const pendingRow = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(pendingRow.getByRole('button', { name: 'Duyệt', exact: true })).toBeDisabled();
      await expect(pendingRow.getByRole('button', { name: 'Từ chối', exact: true })).toBeDisabled();
    });

    test(ITC018.title, { annotation: ITC018.annotation }, async ({ page, context }) => {
      await openSupervisorRequestsPage(page, context, envState.supervisor1Token);

      const searchPromise = page.waitForResponse(
        (r) =>
          /\/api\/teacher\/advisor-registrations\?/.test(r.url()) &&
          r.url().includes('keyword=KHONGTONTAI9999') &&
          r.request().method() === 'GET',
      );
      await page
        .getByPlaceholder('Tìm theo mã sinh viên, tên sinh viên...')
        .fill('KHONGTONTAI9999');
      const searchRes = await searchPromise;

      expect(searchRes.status()).toBe(200);
      const searchBody = await searchRes.json();
      expect(searchBody.code).toBe(1000);
      expect(searchBody.data.registrations).toEqual([]);

      await expect(page.getByText('Không tìm thấy đơn đăng ký nào.')).toBeVisible();
      await expect(
        page.getByText('Thử thay đổi học kỳ, trạng thái hoặc từ khóa tìm kiếm.'),
      ).toBeVisible();
    });

    test(ITC019.title, { annotation: ITC019.annotation }, async ({ page, context }) => {
      await openSupervisorRequestsPage(page, context, envState.supervisor1Token);

      const detailPromise = page.waitForResponse(
        (r) =>
          r.url().endsWith(`/api/teacher/advisor-registrations/${student1Handle.registrationPublicId}`) &&
          r.request().method() === 'GET',
      );
      await page
        .getByRole('button', { name: `Xem chi tiết đơn của ${TEST_STUDENT_1.fullName}` })
        .click();
      const detailRes = await detailPromise;

      expect(detailRes.status()).toBe(200);
      const detailBody = await detailRes.json();
      expect(detailBody.code).toBe(1000);
      expect(detailBody.data.studentCode).toBe(TEST_STUDENT_1.studentCode);
      expect(detailBody.data.studentName).toBe(TEST_STUDENT_1.fullName);
      expect(detailBody.data.topicName).toBe('Hệ thống quản lý đồ án tốt nghiệp thông minh');
      expect(detailBody.data.status).toBe('PENDING');
      expect(detailBody.data.statusDescription).toBe('Chờ duyệt');

      const dialog = page.getByRole('dialog');
      await expect(dialog.getByText('Chi tiết đơn đăng ký giảng viên hướng dẫn')).toBeVisible();
      await expect(dialog).toContainText(TEST_STUDENT_1.fullName);
      await expect(dialog).toContainText(TEST_STUDENT_1.studentCode);
      await expect(dialog).toContainText('Hệ thống quản lý đồ án tốt nghiệp thông minh');
      await expect(dialog).toContainText('Chưa xử lý');
      await expect(dialog).toContainText('Chờ duyệt');
      await expect(dialog.getByRole('button', { name: 'Duyệt', exact: true })).toBeEnabled();
      await expect(dialog.getByRole('button', { name: 'Từ chối', exact: true })).toBeEnabled();
    });
  });

  // ==========================================================================
  // NHÓM THAO TÁC THAY ĐỔI DỮ LIỆU (ITC020 .. ITC030) & BẢO MẬT (TC-SEC-005 .. TC-SEC-009)
  // ==========================================================================
  test.describe('Mutating workflows and security cases (ITC020..ITC030, TC-SEC-005..TC-SEC-009)', () => {
    test.beforeEach(async ({ request }) => {
      await configureDangKyGvhdDeadline(request, 'OPEN');
      await setSupervisorQuota(request, envState.supervisor1Id, 5);
    });

    test.afterEach(async ({ request }) => {
      await cleanupActiveStudents(request);
      await setSupervisorQuota(request, envState.supervisor1Id, 5);
      await configureDangKyGvhdDeadline(request, 'OPEN');
    });

    test(ITC020.title, { annotation: ITC020.annotation }, async ({ page, context, request }) => {
      const student1 = await createCleanStudentWithRegistration(request, TEST_STUDENT_1, {
        topicName: null,
        targetStatus: 'PENDING',
      });

      await openSupervisorRequestsPage(page, context, envState.supervisor1Token);

      const pendingRow = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(pendingRow).toContainText('Chưa có đề tài');

      const detailPromise = page.waitForResponse(
        (r) =>
          r.url().endsWith(`/api/teacher/advisor-registrations/${student1.registrationPublicId}`) &&
          r.request().method() === 'GET',
      );
      await pendingRow
        .getByRole('button', { name: `Xem chi tiết đơn của ${TEST_STUDENT_1.fullName}` })
        .click();
      const detailRes = await detailPromise;

      expect(detailRes.status()).toBe(200);
      const detailBody = await detailRes.json();
      expect(detailBody.code).toBe(1000);
      expect(detailBody.data.topicName).toBeNull();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toContainText('Sinh viên chưa đăng ký tên đề tài');

      const dbRows = await dbSelect<{ status: string; topic_name: string | null }>(
        `SELECT ar.status, ar.topic_name
           FROM advisor_registration ar
           JOIN student s ON s.id = ar.student_id
          WHERE s.student_code = ? AND ar.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows).toHaveLength(1);
      expect(dbRows[0].status).toBe('PENDING');
      expect(dbRows[0].topic_name).toBeNull();
    });

    test(ITC021.title, { annotation: ITC021.annotation }, async ({ page, context, request }) => {
      const student1 = await createCleanStudentWithRegistration(request, TEST_STUDENT_1, {
        topicName: 'Hệ thống gợi ý đề tài đồ án bằng học máy',
        targetStatus: 'PENDING',
      });

      await openSupervisorRequestsPage(page, context, envState.supervisor1Token);

      const pendingRow = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await pendingRow.getByRole('button', { name: 'Duyệt', exact: true }).click();

      const dialog = page.getByRole('dialog');
      await expect(dialog.getByText('Xác nhận phê duyệt đơn đăng ký')).toBeVisible();

      const approvePromise = page.waitForResponse(
        (r) =>
          r.url().endsWith(`/api/teacher/advisor-registrations/${student1.registrationPublicId}/approve`) &&
          r.request().method() === 'PATCH',
      );
      await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
      const approveRes = await approvePromise;

      expect(approveRes.status()).toBe(200);
      const approveBody = await approveRes.json();
      expect(approveBody.code).toBe(1000);
      expect(approveBody.message).toBe('Duyệt đơn đăng ký giảng viên hướng dẫn thành công');
      expect(approveBody.data.status).toBe('TEACHER_APPROVED');
      expect(approveBody.data.statusDescription).toBe('GV đã chấp thuận');
      expect(approveBody.data.processedAt).toBeTruthy();

      await expect(
        page.getByText(`Đã tiếp nhận hướng dẫn đồ án cho sinh viên ${TEST_STUDENT_1.fullName} thành công!`),
      ).toBeVisible();
      await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) })).toHaveCount(0);

      // Chuyển sang tab Đã duyệt kiểm tra dòng đã chuyển trạng thái
      await page.getByRole('button', { name: /^Đã duyệt/ }).click();
      const approvedRow = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(approvedRow).toBeVisible();
      await expect(approvedRow).toContainText('GV đã duyệt');

      // Đối chiếu DB: advisor_registration & notification
      const dbRows = await dbSelect<{ status: string; processed_at: string | null }>(
        `SELECT ar.status, ar.processed_at
           FROM advisor_registration ar
           JOIN student s ON s.id = ar.student_id
          WHERE s.student_code = ? AND ar.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows).toHaveLength(1);
      expect(dbRows[0].status).toBe('TEACHER_APPROVED');
      expect(dbRows[0].processed_at).not.toBeNull();

      const notifRows = await dbSelect<{ content: string }>(
        `SELECT n.content
           FROM notification n
           JOIN account a ON a.id = n.account_id
           JOIN student s ON s.account_id = a.id
          WHERE s.student_code = ?
          ORDER BY n.id DESC
          LIMIT 1`,
        [TEST_STUDENT_1.studentCode],
      );
      expect(notifRows).toHaveLength(1);
      expect(notifRows[0].content).toContain('chấp thuận sơ bộ và đang chờ Trưởng bộ môn phê duyệt chính thức');
    });

    test(ITC022.title, { annotation: ITC022.annotation }, async ({ page, context, request }) => {
      const student1 = await createCleanStudentWithRegistration(request, TEST_STUDENT_1, {
        topicName: 'Xây dựng hệ thống phát hiện bất thường mạng',
        targetStatus: 'PENDING',
      });

      await openSupervisorRequestsPage(page, context, envState.supervisor1Token);

      await page
        .getByRole('button', { name: `Xem chi tiết đơn của ${TEST_STUDENT_1.fullName}` })
        .click();

      const detailDialog = page.getByRole('dialog');
      await expect(detailDialog.getByText('Chi tiết đơn đăng ký giảng viên hướng dẫn')).toBeVisible();
      await detailDialog.getByRole('button', { name: 'Duyệt', exact: true }).click();

      const confirmDialog = page.getByRole('dialog');
      await expect(confirmDialog.getByText('Xác nhận phê duyệt đơn đăng ký')).toBeVisible();

      const approvePromise = page.waitForResponse(
        (r) =>
          r.url().endsWith(`/api/teacher/advisor-registrations/${student1.registrationPublicId}/approve`) &&
          r.request().method() === 'PATCH',
      );
      await confirmDialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
      const approveRes = await approvePromise;

      expect(approveRes.status()).toBe(200);
      const approveBody = await approveRes.json();
      expect(approveBody.code).toBe(1000);
      expect(approveBody.message).toBe('Duyệt đơn đăng ký giảng viên hướng dẫn thành công');
      expect(approveBody.data.status).toBe('TEACHER_APPROVED');

      await expect(
        page.getByText(`Đã tiếp nhận hướng dẫn đồ án cho sinh viên ${TEST_STUDENT_1.fullName} thành công!`),
      ).toBeVisible();

      await page.getByRole('button', { name: /^Đã duyệt/ }).click();
      const approvedRow = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(approvedRow).toBeVisible();
      await expect(approvedRow).toContainText('GV đã duyệt');

      const dbRows = await dbSelect<{ status: string; processed_at: string | null }>(
        `SELECT ar.status, ar.processed_at
           FROM advisor_registration ar
           JOIN student s ON s.id = ar.student_id
          WHERE s.student_code = ? AND ar.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows).toHaveLength(1);
      expect(dbRows[0].status).toBe('TEACHER_APPROVED');
      expect(dbRows[0].processed_at).not.toBeNull();
    });

    test(ITC023.title, { annotation: ITC023.annotation }, async ({ page, context, request }) => {
      await setSupervisorQuota(request, envState.supervisor1Id, 1);

      const student1 = await createCleanStudentWithRegistration(request, TEST_STUDENT_1, {
        topicName: 'Đề tài sinh viên 1 chạm hạn mức',
        targetStatus: 'PENDING',
      });
      await createCleanStudentWithRegistration(request, TEST_STUDENT_2, {
        topicName: 'Đề tài sinh viên 2 tự động từ chối',
        targetStatus: 'PENDING',
      });

      await openSupervisorRequestsPage(page, context, envState.supervisor1Token);

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(row1).toBeVisible();
      await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) })).toBeVisible();

      await row1.getByRole('button', { name: 'Duyệt', exact: true }).click();
      const confirmDialog = page.getByRole('dialog');
      await expect(confirmDialog.getByText('Xác nhận phê duyệt đơn đăng ký')).toBeVisible();

      const approvePromise = page.waitForResponse(
        (r) =>
          r.url().endsWith(`/api/teacher/advisor-registrations/${student1.registrationPublicId}/approve`) &&
          r.request().method() === 'PATCH',
      );
      await confirmDialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
      const approveRes = await approvePromise;

      expect(approveRes.status()).toBe(200);
      const approveBody = await approveRes.json();
      expect(approveBody.code).toBe(1000);
      expect(approveBody.message).toBe('Duyệt đơn đăng ký giảng viên hướng dẫn thành công');

      // Cả 2 đơn đều rời tab Chưa duyệt
      await expect(page.getByRole('button', { name: /^Chưa duyệt/ })).toContainText('0');
      await expect(page.getByText('Không tìm thấy đơn đăng ký nào.')).toBeVisible();

      // Kiểm tra tab Đã duyệt có sinh viên 1
      await page.getByRole('button', { name: /^Đã duyệt/ }).click();
      const approvedRow = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(approvedRow).toBeVisible();
      await expect(approvedRow).toContainText('GV đã duyệt');

      // Kiểm tra tab Đã từ chối có sinh viên 2
      await page.getByRole('button', { name: /^Đã từ chối/ }).click();
      const rejectedRow = page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) });
      await expect(rejectedRow).toBeVisible();
      await expect(rejectedRow).toContainText('Đã từ chối');

      // Đối chiếu DB cho cả 2 sinh viên và thông báo tự động từ chối
      const dbRows = await dbSelect<{ student_code: string; status: string; processed_at: string | null }>(
        `SELECT s.student_code, ar.status, ar.processed_at
           FROM advisor_registration ar
           JOIN student s ON s.id = ar.student_id
          WHERE s.student_code IN (?, ?) AND ar.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, TEST_STUDENT_2.studentCode, envState.semesterId],
      );
      const byCode = new Map(dbRows.map((r) => [r.student_code, r]));
      expect(byCode.get(TEST_STUDENT_1.studentCode)?.status).toBe('TEACHER_APPROVED');
      expect(byCode.get(TEST_STUDENT_1.studentCode)?.processed_at).not.toBeNull();
      expect(byCode.get(TEST_STUDENT_2.studentCode)?.status).toBe('REJECTED');
      expect(byCode.get(TEST_STUDENT_2.studentCode)?.processed_at).not.toBeNull();

      const notifRows = await dbSelect<{ content: string }>(
        `SELECT n.content
           FROM notification n
           JOIN account a ON a.id = n.account_id
           JOIN student s ON s.account_id = a.id
          WHERE s.student_code = ?
          ORDER BY n.id DESC
          LIMIT 1`,
        [TEST_STUDENT_2.studentCode],
      );
      expect(notifRows).toHaveLength(1);
      expect(notifRows[0].content).toContain('đã bị từ chối tự động do giảng viên đã đủ chỉ tiêu hướng dẫn trong học kỳ');
    });

    test(ITC024.title, { annotation: ITC024.annotation }, async ({ page, context, request }) => {
      // Ban đầu quota = 5, có 1 đơn đã duyệt (SV2) và 1 đơn chờ duyệt (SV1)
      await createCleanStudentWithRegistration(request, TEST_STUDENT_2, {
        topicName: 'Đề tài đã duyệt chiếm 1 chỉ tiêu',
        targetStatus: 'TEACHER_APPROVED',
      });
      const student1 = await createCleanStudentWithRegistration(request, TEST_STUDENT_1, {
        topicName: 'Đề tài duyệt vượt chỉ tiêu',
        targetStatus: 'PENDING',
      });

      await openSupervisorRequestsPage(page, context, envState.supervisor1Token);

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Duyệt', exact: true }).click();

      const confirmDialog = page.getByRole('dialog');
      await expect(confirmDialog.getByText('Xác nhận phê duyệt đơn đăng ký')).toBeVisible();

      // Trước khi bấm Xác nhận, TBM giảm quota về 1 (đã đầy 1/1 bởi SV2) -> hệ thống tự động từ chối đơn PENDING của SV1
      await setSupervisorQuota(request, envState.supervisor1Id, 1);

      const approvePromise = page.waitForResponse(
        (r) =>
          r.url().endsWith(`/api/teacher/advisor-registrations/${student1.registrationPublicId}/approve`) &&
          r.request().method() === 'PATCH',
      );
      await confirmDialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
      const approveRes = await approvePromise;

      expect(approveRes.status()).toBe(400);
      const approveBody = await approveRes.json();
      expect(approveBody.code).toBe(4000);
      expect(approveBody.message).toBe('Đơn đăng ký này đã được xử lý trước đó');

      await expect(page.getByText('Đơn đăng ký này đã được xử lý trước đó')).toBeVisible();

      const dbRows = await dbSelect<{ status: string; processed_at: string | null }>(
        `SELECT ar.status, ar.processed_at
           FROM advisor_registration ar
           JOIN student s ON s.id = ar.student_id
          WHERE s.student_code = ? AND ar.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows).toHaveLength(1);
      expect(dbRows[0].status).toBe('REJECTED');
      expect(dbRows[0].processed_at).not.toBeNull();

      const notifRows = await dbSelect<{ content: string }>(
        `SELECT n.content
           FROM notification n
           JOIN account a ON a.id = n.account_id
           JOIN student s ON s.account_id = a.id
          WHERE s.student_code = ?
          ORDER BY n.id DESC
          LIMIT 1`,
        [TEST_STUDENT_1.studentCode],
      );
      expect(notifRows).toHaveLength(1);
      expect(notifRows[0].content).toContain('đủ chỉ tiêu');
    });

    test(ITC025.title, { annotation: ITC025.annotation }, async ({ page, context, request }) => {
      const student1 = await createCleanStudentWithRegistration(request, TEST_STUDENT_1, {
        topicName: 'Đề tài bị xử lý đồng thời trước khi duyệt',
        targetStatus: 'PENDING',
      });

      await openSupervisorRequestsPage(page, context, envState.supervisor1Token);

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Duyệt', exact: true }).click();

      const confirmDialog = page.getByRole('dialog');
      await expect(confirmDialog.getByText('Xác nhận phê duyệt đơn đăng ký')).toBeVisible();

      // Ở phiên khác, đơn đã bị từ chối trước khi bấm Xác nhận
      const preReject = await apiCall(
        request,
        envState.supervisor1Token,
        'PATCH',
        `/api/teacher/advisor-registrations/${student1.registrationPublicId}/reject`,
      );
      expect(preReject.status).toBe(200);

      const approvePromise = page.waitForResponse(
        (r) =>
          r.url().endsWith(`/api/teacher/advisor-registrations/${student1.registrationPublicId}/approve`) &&
          r.request().method() === 'PATCH',
      );
      await confirmDialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
      const approveRes = await approvePromise;

      expect(approveRes.status()).toBe(400);
      const approveBody = await approveRes.json();
      expect(approveBody.code).toBe(4000);
      expect(approveBody.message).toBe('Đơn đăng ký này đã được xử lý trước đó');

      await expect(page.getByText('Đơn đăng ký này đã được xử lý trước đó')).toBeVisible();

      const dbRows = await dbSelect<{ status: string }>(
        `SELECT ar.status
           FROM advisor_registration ar
           JOIN student s ON s.id = ar.student_id
          WHERE s.student_code = ? AND ar.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows).toHaveLength(1);
      expect(dbRows[0].status).toBe('REJECTED');
    });

    test(ITC026.title, { annotation: ITC026.annotation }, async ({ page, context, request }) => {
      const student1 = await createCleanStudentWithRegistration(request, TEST_STUDENT_1, {
        topicName: 'Đề tài duyệt sau khi hết hạn',
        targetStatus: 'PENDING',
      });

      await openSupervisorRequestsPage(page, context, envState.supervisor1Token);

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Duyệt', exact: true }).click();

      const confirmDialog = page.getByRole('dialog');
      await expect(confirmDialog.getByText('Xác nhận phê duyệt đơn đăng ký')).toBeVisible();

      // Thời hạn xử lý đóng trước khi giảng viên bấm Xác nhận
      await configureDangKyGvhdDeadline(request, 'CLOSED');

      const approvePromise = page.waitForResponse(
        (r) =>
          r.url().endsWith(`/api/teacher/advisor-registrations/${student1.registrationPublicId}/approve`) &&
          r.request().method() === 'PATCH',
      );
      await confirmDialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
      const approveRes = await approvePromise;

      expect(approveRes.status()).toBe(403);
      const approveBody = await approveRes.json();
      expect(approveBody.code).toBe(2001);
      expect(approveBody.message).toBe('Đã hết thời hạn xử lý đơn đăng ký GVHD');

      await expect(page.getByText('Đã hết thời hạn xử lý đơn đăng ký GVHD')).toBeVisible();

      const dbRows = await dbSelect<{ status: string; processed_at: string | null }>(
        `SELECT ar.status, ar.processed_at
           FROM advisor_registration ar
           JOIN student s ON s.id = ar.student_id
          WHERE s.student_code = ? AND ar.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows).toHaveLength(1);
      expect(dbRows[0].status).toBe('PENDING');
      expect(dbRows[0].processed_at).toBeNull();
    });

    test(ITC027.title, { annotation: ITC027.annotation }, async ({ page, context, request }) => {
      const student1 = await createCleanStudentWithRegistration(request, TEST_STUDENT_1, {
        topicName: 'Hệ thống nhận diện biển số xe thời gian thực',
        targetStatus: 'PENDING',
      });

      await openSupervisorRequestsPage(page, context, envState.supervisor1Token);

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Từ chối', exact: true }).click();

      const confirmDialog = page.getByRole('dialog');
      await expect(
        confirmDialog.getByRole('heading', { name: 'Xác nhận từ chối đơn đăng ký' }),
      ).toBeVisible();

      const rejectPromise = page.waitForResponse(
        (r) =>
          r.url().endsWith(`/api/teacher/advisor-registrations/${student1.registrationPublicId}/reject`) &&
          r.request().method() === 'PATCH',
      );
      await confirmDialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
      const rejectRes = await rejectPromise;

      expect(rejectRes.status()).toBe(200);
      const rejectBody = await rejectRes.json();
      expect(rejectBody.code).toBe(1000);
      expect(rejectBody.message).toBe('Từ chối đơn đăng ký giảng viên hướng dẫn thành công');
      expect(rejectBody.data.status).toBe('REJECTED');
      expect(rejectBody.data.statusDescription).toBe('Đã từ chối');
      expect(rejectBody.data.processedAt).toBeTruthy();

      await expect(
        page.getByText(`Đã từ chối hướng dẫn đồ án của sinh viên ${TEST_STUDENT_1.fullName}!`),
      ).toBeVisible();
      await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) })).toHaveCount(0);

      await page.getByRole('button', { name: /^Đã từ chối/ }).click();
      const rejectedRow = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(rejectedRow).toBeVisible();
      await expect(rejectedRow).toContainText('Đã từ chối');

      // Đối chiếu DB: advisor_registration & notification
      const dbRows = await dbSelect<{ status: string; processed_at: string | null }>(
        `SELECT ar.status, ar.processed_at
           FROM advisor_registration ar
           JOIN student s ON s.id = ar.student_id
          WHERE s.student_code = ? AND ar.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows).toHaveLength(1);
      expect(dbRows[0].status).toBe('REJECTED');
      expect(dbRows[0].processed_at).not.toBeNull();

      const notifRows = await dbSelect<{ content: string }>(
        `SELECT n.content
           FROM notification n
           JOIN account a ON a.id = n.account_id
           JOIN student s ON s.account_id = a.id
          WHERE s.student_code = ?
          ORDER BY n.id DESC
          LIMIT 1`,
        [TEST_STUDENT_1.studentCode],
      );
      expect(notifRows).toHaveLength(1);
      expect(notifRows[0].content).toBe(
        'Đơn đăng ký giảng viên hướng dẫn của bạn đã bị từ chối. Vui lòng kiểm tra thông tin đơn đăng ký.',
      );
    });

    test(ITC028.title, { annotation: ITC028.annotation }, async ({ page, context, request }) => {
      const student1 = await createCleanStudentWithRegistration(request, TEST_STUDENT_1, {
        topicName: 'Hệ thống tư vấn chọn môn học thông minh',
        targetStatus: 'PENDING',
      });

      await openSupervisorRequestsPage(page, context, envState.supervisor1Token);

      await page
        .getByRole('button', { name: `Xem chi tiết đơn của ${TEST_STUDENT_1.fullName}` })
        .click();

      const detailDialog = page.getByRole('dialog');
      await expect(
        detailDialog.getByRole('heading', { name: 'Chi tiết đơn đăng ký giảng viên hướng dẫn' }),
      ).toBeVisible();
      await detailDialog.getByRole('button', { name: 'Từ chối', exact: true }).click();

      const confirmDialog = page.getByRole('dialog');
      await expect(
        confirmDialog.getByRole('heading', { name: 'Xác nhận từ chối đơn đăng ký' }),
      ).toBeVisible();

      const rejectPromise = page.waitForResponse(
        (r) =>
          r.url().endsWith(`/api/teacher/advisor-registrations/${student1.registrationPublicId}/reject`) &&
          r.request().method() === 'PATCH',
      );
      await confirmDialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
      const rejectRes = await rejectPromise;

      expect(rejectRes.status()).toBe(200);
      const rejectBody = await rejectRes.json();
      expect(rejectBody.code).toBe(1000);
      expect(rejectBody.message).toBe('Từ chối đơn đăng ký giảng viên hướng dẫn thành công');
      expect(rejectBody.data.status).toBe('REJECTED');

      await expect(
        page.getByText(`Đã từ chối hướng dẫn đồ án của sinh viên ${TEST_STUDENT_1.fullName}!`),
      ).toBeVisible();

      await page.getByRole('button', { name: /^Đã từ chối/ }).click();
      const rejectedRow = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(rejectedRow).toBeVisible();
      await expect(rejectedRow).toContainText('Đã từ chối');

      const dbRows = await dbSelect<{ status: string; processed_at: string | null }>(
        `SELECT ar.status, ar.processed_at
           FROM advisor_registration ar
           JOIN student s ON s.id = ar.student_id
          WHERE s.student_code = ? AND ar.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows).toHaveLength(1);
      expect(dbRows[0].status).toBe('REJECTED');
      expect(dbRows[0].processed_at).not.toBeNull();
    });

    test(ITC029.title, { annotation: ITC029.annotation }, async ({ page, context, request }) => {
      const student1 = await createCleanStudentWithRegistration(request, TEST_STUDENT_1, {
        topicName: 'Đề tài đã được duyệt trước khi từ chối',
        targetStatus: 'PENDING',
      });

      await openSupervisorRequestsPage(page, context, envState.supervisor1Token);

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Từ chối', exact: true }).click();

      const confirmDialog = page.getByRole('dialog');
      await expect(
        confirmDialog.getByRole('heading', { name: 'Xác nhận từ chối đơn đăng ký' }),
      ).toBeVisible();

      // Ở phiên khác, đơn đã được duyệt trước khi bấm Xác nhận từ chối
      const preApprove = await apiCall(
        request,
        envState.supervisor1Token,
        'PATCH',
        `/api/teacher/advisor-registrations/${student1.registrationPublicId}/approve`,
      );
      expect(preApprove.status).toBe(200);

      const rejectPromise = page.waitForResponse(
        (r) =>
          r.url().endsWith(`/api/teacher/advisor-registrations/${student1.registrationPublicId}/reject`) &&
          r.request().method() === 'PATCH',
      );
      await confirmDialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
      const rejectRes = await rejectPromise;

      expect(rejectRes.status()).toBe(400);
      const rejectBody = await rejectRes.json();
      expect(rejectBody.code).toBe(4000);
      expect(rejectBody.message).toBe('Đơn đăng ký này đã được xử lý trước đó');

      await expect(page.getByText('Đơn đăng ký này đã được xử lý trước đó')).toBeVisible();

      const dbRows = await dbSelect<{ status: string }>(
        `SELECT ar.status
           FROM advisor_registration ar
           JOIN student s ON s.id = ar.student_id
          WHERE s.student_code = ? AND ar.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows).toHaveLength(1);
      expect(dbRows[0].status).toBe('TEACHER_APPROVED');
    });

    test(ITC030.title, { annotation: ITC030.annotation }, async ({ page, context, request }) => {
      const student1 = await createCleanStudentWithRegistration(request, TEST_STUDENT_1, {
        topicName: 'Đề tài từ chối sau khi hết hạn',
        targetStatus: 'PENDING',
      });

      await openSupervisorRequestsPage(page, context, envState.supervisor1Token);

      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await row1.getByRole('button', { name: 'Từ chối', exact: true }).click();

      const confirmDialog = page.getByRole('dialog');
      await expect(
        confirmDialog.getByRole('heading', { name: 'Xác nhận từ chối đơn đăng ký' }),
      ).toBeVisible();

      // Đóng thời hạn trước khi bấm Xác nhận
      await configureDangKyGvhdDeadline(request, 'CLOSED');

      const rejectPromise = page.waitForResponse(
        (r) =>
          r.url().endsWith(`/api/teacher/advisor-registrations/${student1.registrationPublicId}/reject`) &&
          r.request().method() === 'PATCH',
      );
      await confirmDialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
      const rejectRes = await rejectPromise;

      expect(rejectRes.status()).toBe(403);
      const rejectBody = await rejectRes.json();
      expect(rejectBody.code).toBe(2001);
      expect(rejectBody.message).toBe('Đã hết thời hạn xử lý đơn đăng ký GVHD');

      await expect(page.getByText('Đã hết thời hạn xử lý đơn đăng ký GVHD')).toBeVisible();

      const dbRows = await dbSelect<{ status: string; processed_at: string | null }>(
        `SELECT ar.status, ar.processed_at
           FROM advisor_registration ar
           JOIN student s ON s.id = ar.student_id
          WHERE s.student_code = ? AND ar.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows).toHaveLength(1);
      expect(dbRows[0].status).toBe('PENDING');
      expect(dbRows[0].processed_at).toBeNull();
    });

    // ========================================================================
    // SECURITY TEST CASES (TC-SEC-005 .. TC-SEC-009)
    // ========================================================================

    test(SEC005.title, { annotation: SEC005.annotation }, async ({ page, context, request }) => {
      await context.clearCookies();

      const myInfoPromise = page.waitForResponse(
        (r) => r.url().includes('/my-info') && r.request().method() === 'GET',
      );
      await page.goto('/lecturer/supervisor-requests');
      const myInfoRes = await myInfoPromise;

      expect(myInfoRes.status()).toBe(401);
      expect((await myInfoRes.json()).code).toBe(2000);
      await expect(page).toHaveURL(/\/login/);

      // Gọi trực tiếp API không có cookie
      const directRes = await request.get(
        `${getApiBaseUrl()}/api/teacher/advisor-registrations?semesterPublicId=${envState.semesterPublicId}`,
      );
      expect(directRes.status()).toBe(401);
      expect((await directRes.json()).code).toBe(2000);
    });

    test(SEC006.title, { annotation: SEC006.annotation }, async ({ page, context, request }) => {
      const student1 = await createCleanStudentWithRegistration(request, TEST_STUDENT_1, {
        topicName: 'Đơn kiểm thử phân quyền sinh viên',
        targetStatus: 'PENDING',
      });

      await setAuthCookie(context, student1.token);
      await page.goto('/lecturer/supervisor-requests');

      await expect(
        page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.'),
      ).toBeVisible();

      const listRes = await apiCall(request, student1.token, 'GET', '/api/teacher/advisor-registrations', {
        params: { semesterPublicId: envState.semesterPublicId },
      });
      expect(listRes.status).toBe(403);
      expect(listRes.body.code).toBe(2001);
      expect(listRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');

      const approveRes = await apiCall(
        request,
        student1.token,
        'PATCH',
        `/api/teacher/advisor-registrations/${student1.registrationPublicId}/approve`,
      );
      expect(approveRes.status).toBe(403);
      expect(approveRes.body.code).toBe(2001);
      expect(approveRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');

      const dbRows = await dbSelect<{ status: string }>(
        `SELECT ar.status
           FROM advisor_registration ar
           JOIN student s ON s.id = ar.student_id
          WHERE s.student_code = ? AND ar.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows[0].status).toBe('PENDING');
    });

    test(SEC007.title, { annotation: SEC007.annotation }, async ({ page, context, request }) => {
      const student1 = await createCleanStudentWithRegistration(request, TEST_STUDENT_1, {
        topicName: 'Đơn kiểm thử phân quyền giảng viên thường',
        targetStatus: 'PENDING',
      });

      await setAuthCookie(context, envState.plainLecturerToken);
      await page.goto('/lecturer/supervisor-requests');

      await expect(
        page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.'),
      ).toBeVisible();

      const listRes = await apiCall(
        request,
        envState.plainLecturerToken,
        'GET',
        '/api/teacher/advisor-registrations',
        { params: { semesterPublicId: envState.semesterPublicId } },
      );
      expect(listRes.status).toBe(403);
      expect(listRes.body.code).toBe(2001);
      expect(listRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');

      const rejectRes = await apiCall(
        request,
        envState.plainLecturerToken,
        'PATCH',
        `/api/teacher/advisor-registrations/${student1.registrationPublicId}/reject`,
      );
      expect(rejectRes.status).toBe(403);
      expect(rejectRes.body.code).toBe(2001);
      expect(rejectRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');

      const dbRows = await dbSelect<{ status: string }>(
        `SELECT ar.status
           FROM advisor_registration ar
           JOIN student s ON s.id = ar.student_id
          WHERE s.student_code = ? AND ar.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows[0].status).toBe('PENDING');
    });

    test(SEC008.title, { annotation: SEC008.annotation }, async ({ page, context, request }) => {
      const student1 = await createCleanStudentWithRegistration(request, TEST_STUDENT_1, {
        topicName: 'Đơn kiểm thử token đã đăng xuất',
        targetStatus: 'PENDING',
      });

      // Cấp token riêng cho Supervisor 1 rồi gọi POST /log-out để vô hiệu hóa token đó
      const freshToken = await loginByEmail(request, TEST_SUPERVISOR_1.email);
      const logoutRes = await apiCall(request, freshToken, 'POST', '/log-out');
      expect(logoutRes.status).toBe(200);

      await setAuthCookie(context, freshToken);
      const myInfoPromise = page.waitForResponse(
        (r) => r.url().includes('/my-info') && r.request().method() === 'GET',
      );
      await page.goto('/lecturer/supervisor-requests');
      const myInfoRes = await myInfoPromise;

      expect(myInfoRes.status()).toBe(401);
      expect((await myInfoRes.json()).code).toBe(2000);
      await expect(page).toHaveURL(/\/login/);

      const listRes = await apiCall(request, freshToken, 'GET', '/api/teacher/advisor-registrations', {
        params: { semesterPublicId: envState.semesterPublicId },
      });
      expect(listRes.status).toBe(401);
      expect(listRes.body.code).toBe(2000);

      const approveRes = await apiCall(
        request,
        freshToken,
        'PATCH',
        `/api/teacher/advisor-registrations/${student1.registrationPublicId}/approve`,
      );
      expect(approveRes.status).toBe(401);
      expect(approveRes.body.code).toBe(2000);
    });

    test(SEC009.title, { annotation: SEC009.annotation }, async ({ page, context, request }) => {
      const student1 = await createCleanStudentWithRegistration(request, TEST_STUDENT_1, {
        topicName: 'Đơn thuộc Supervisor 1 không cho Supervisor 2 thao tác',
        targetStatus: 'PENDING',
      });

      // Đăng nhập bằng Supervisor 2 và mở màn hình Quản lý đăng ký GVHD
      await openSupervisorRequestsPage(page, context, envState.supervisor2Token);
      await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) })).toHaveCount(0);

      // Supervisor 2 thử gọi GET detail, PATCH approve và PATCH reject lên đơn của Supervisor 1
      const detailRes = await apiCall(
        request,
        envState.supervisor2Token,
        'GET',
        `/api/teacher/advisor-registrations/${student1.registrationPublicId}`,
      );
      expect(detailRes.status).toBe(404);
      expect(detailRes.body.code).toBe(3022);
      expect(detailRes.body.message).toBe('Không tìm thấy đơn đăng ký hoặc bạn không có quyền truy cập');

      const approveRes = await apiCall(
        request,
        envState.supervisor2Token,
        'PATCH',
        `/api/teacher/advisor-registrations/${student1.registrationPublicId}/approve`,
      );
      expect(approveRes.status).toBe(404);
      expect(approveRes.body.code).toBe(3022);
      expect(approveRes.body.message).toBe('Không tìm thấy đơn đăng ký hoặc bạn không có quyền truy cập');

      const rejectRes = await apiCall(
        request,
        envState.supervisor2Token,
        'PATCH',
        `/api/teacher/advisor-registrations/${student1.registrationPublicId}/reject`,
      );
      expect(rejectRes.status).toBe(404);
      expect(rejectRes.body.code).toBe(3022);
      expect(rejectRes.body.message).toBe('Không tìm thấy đơn đăng ký hoặc bạn không có quyền truy cập');

      // Đơn của SV1 vẫn giữ nguyên trạng thái PENDING trong DB
      const dbRows = await dbSelect<{ status: string; processed_at: string | null }>(
        `SELECT ar.status, ar.processed_at
           FROM advisor_registration ar
           JOIN student s ON s.id = ar.student_id
          WHERE s.student_code = ? AND ar.semester_id = ?`,
        [TEST_STUDENT_1.studentCode, envState.semesterId],
      );
      expect(dbRows).toHaveLength(1);
      expect(dbRows[0].status).toBe('PENDING');
      expect(dbRows[0].processed_at).toBeNull();
    });
  });
});
