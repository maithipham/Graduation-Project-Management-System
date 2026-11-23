import { test, expect, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';
import { defineItc, defineItcSec } from '../../../support/integration-test-case';
import { apiCall, getApiBaseUrl, loginByEmail } from '../../../support/api';
import { dbSelect } from '../../../support/db';

// ============================================================================
// ĐẶC TẢ TEST CASE (ITC017..ITC034 & TC-SEC-016..TC-SEC-019)
// Feature: outline | Module/Sheet: DangKyVaDoiTenDeTai
// Role: Sinh viên (STUDENT)
// ============================================================================

const ITC017 = defineItc({
  id: 'ITC017',
  feature: 'outline',
  module: 'DangKyVaDoiTenDeTai',
  sheet: 'DangKyVaDoiTenDeTai',
  fn: 'View Topic Title Overview and Status',
  description:
    'Verify that a student assigned a main supervisor and co-supervisor without an official title can view the initial title confirmation form when the deadline is open',
  procedure:
    '1. Log in as a Student ("Nguyễn Thị Mai").\n' +
    '2. Open the "Nộp đề cương" screen ("/student/outline").',
  expected:
    '1. The API GET /topic/my-title-history returns HTTP 200 with code = 1000, officialName = null, deadlineStatus = "OPEN", lecturerName = "Trần Quốc Bảo", coLecturerName = "Phạm Thị Lan", and an empty histories list.\n' +
    '2. The database confirms student "9990000401" has a thesis topic with official name = NULL, main supervisor "GV999401", co-supervisor "GV999402", and 0 topic title history records.\n' +
    '3. The UI displays heading "Chốt tên đề tài chính thức", an enabled empty topic input with placeholder "Nhập tên đề tài chính thức lần đầu...", an enabled "Chốt tên đề tài" button, supervisor "Trần Quốc Bảo", co-supervisor "Phạm Thị Lan", and open deadline "(Đang mở)".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Nguyễn Thị Mai" ("9990000401") has main supervisor "Trần Quốc Bảo" ("GV999401"), co-supervisor "Phạm Thị Lan" ("GV999402"), no official title yet, and no topic title requests.',
});

const ITC018 = defineItc({
  id: 'ITC018',
  feature: 'outline',
  module: 'DangKyVaDoiTenDeTai',
  sheet: 'DangKyVaDoiTenDeTai',
  fn: 'View Topic Title Overview and Status',
  description:
    'Verify that the topic title input and submit button are disabled when the student has not been assigned a supervisor yet',
  procedure:
    '1. Log in as a Student ("Vũ Minh Quân") who has not been assigned a supervisor yet.\n' +
    '2. Open the "Nộp đề cương" screen ("/student/outline").',
  expected:
    '1. The API GET /topic/my-title-history returns HTTP 200 with code = 1000, currentStage = "STAGE_1_REGISTERING_ADVISOR", officialName = null, and lecturerName = null.\n' +
    '2. The database confirms student "9990000402"\'s thesis topic is at stage STAGE_1_REGISTERING_ADVISOR with no assigned supervisor and official name = NULL.\n' +
    '3. The UI displays label "Tên đề tài tốt nghiệp", supervisor "Chưa phân công", a disabled topic title input, and a disabled "Gửi yêu cầu" button.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Vũ Minh Quân" ("9990000402") is in STAGE_1_REGISTERING_ADVISOR with no assigned supervisor and no official title.',
});

const ITC019 = defineItc({
  id: 'ITC019',
  feature: 'outline',
  module: 'DangKyVaDoiTenDeTai',
  sheet: 'DangKyVaDoiTenDeTai',
  fn: 'View Topic Title Overview and Status',
  description:
    'Verify that a student with a pending topic title request sees the pending badge and cannot edit or submit another request',
  procedure:
    '1. Log in as a Student ("Nguyễn Thị Mai") who has a pending initial title request.\n' +
    '2. Open the "Nộp đề cương" screen ("/student/outline").',
  expected:
    '1. The API GET /topic/my-title-history returns HTTP 200 with code = 1000, officialName = null, and 1 PENDING history record with newName = "Hệ thống quản lý đồ án tốt nghiệp ứng dụng AI".\n' +
    '2. The database contains 1 PENDING topic title history record for student "9990000401" and keeps the official thesis title as NULL.\n' +
    '3. The UI displays badge "Đang chờ GVHD duyệt tên đề tài", fills the disabled input with "Hệ thống quản lý đồ án tốt nghiệp ứng dụng AI", and disables the "Chốt tên đề tài" button.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Nguyễn Thị Mai" ("9990000401") has 1 PENDING initial title request for "Hệ thống quản lý đồ án tốt nghiệp ứng dụng AI".',
});

const ITC020 = defineItc({
  id: 'ITC020',
  feature: 'outline',
  module: 'DangKyVaDoiTenDeTai',
  sheet: 'DangKyVaDoiTenDeTai',
  fn: 'View Topic Title Overview and Status',
  description:
    'Verify that a student whose latest title request was rejected sees the rejection notice and can edit and resubmit',
  procedure:
    '1. Log in as a Student ("Nguyễn Thị Mai") whose initial title request was rejected by the supervisor.\n' +
    '2. Open the "Nộp đề cương" screen ("/student/outline").',
  expected:
    '1. The API GET /topic/my-title-history returns HTTP 200 with code = 1000, officialName = null, and the latest history record in REJECTED status.\n' +
    '2. The database contains 1 REJECTED topic title history record for student "9990000401" and keeps the official thesis title as NULL.\n' +
    '3. The UI displays rejection notice "Yêu cầu tên đề tài \\"Tên đề tài quá chung chung\\" đã bị GVHD từ chối. Vui lòng chỉnh sửa và gửi lại." and keeps the topic input and "Chốt tên đề tài" button enabled.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Nguyễn Thị Mai" ("9990000401") has 1 REJECTED initial title request ("Tên đề tài quá chung chung") and no official title.',
});

const ITC021 = defineItc({
  id: 'ITC021',
  feature: 'outline',
  module: 'DangKyVaDoiTenDeTai',
  sheet: 'DangKyVaDoiTenDeTai',
  fn: 'View Topic Title Overview and Status',
  description:
    'Verify that the topic title input and submit button are disabled when the outline and topic title deadline is closed or not started',
  procedure:
    '1. Log in as a Student ("Nguyễn Thị Mai") and open the "Nộp đề cương" screen while the deadline is CLOSED.\n' +
    '2. Update the deadline to NOT_STARTED and reload the "Nộp đề cương" screen.',
  expected:
    '1. When CLOSED, GET /topic/my-title-history returns HTTP 200 with code = 1000 and deadlineStatus = "CLOSED"; the UI displays "Đã hết hạn" and disables both the topic input and "Chốt tên đề tài" button.\n' +
    '2. When NOT_STARTED, GET /topic/my-title-history returns HTTP 200 with code = 1000 and deadlineStatus = "NOT_STARTED"; the UI displays "Chưa mở" and "Hạn nộp đề cương chưa mở", and disables both the topic input and "Chốt tên đề tài" button.',
  precondition:
    '1. Student "Nguyễn Thị Mai" ("9990000401") has an assigned supervisor and no official title.\n' +
    '2. The "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline is configured as CLOSED, then NOT_STARTED.',
});

const ITC022 = defineItc({
  id: 'ITC022',
  feature: 'outline',
  module: 'DangKyVaDoiTenDeTai',
  sheet: 'DangKyVaDoiTenDeTai',
  fn: 'View Topic Title Overview and Status',
  description:
    'Verify that the topic title input and submit button are disabled for students during the lecturer extended grading period',
  procedure:
    '1. Log in as a Student ("Nguyễn Thị Mai").\n' +
    '2. Open the "Nộp đề cương" screen ("/student/outline") while the deadline is in EXTENDED grading status.',
  expected:
    '1. The API GET /topic/my-title-history returns HTTP 200 with code = 1000 and deadlineStatus = "EXTENDED".\n' +
    '2. The UI displays "Đã hết hạn nộp — Đang trong thời gian gia hạn chấm của giảng viên" and "Đã hết hạn nộp đề cương cho sinh viên", and disables both the topic input and "Chốt tên đề tài" button.',
  precondition:
    '1. An ongoing semester exists where the "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline is in EXTENDED status.\n' +
    '2. Student "Nguyễn Thị Mai" ("9990000401") has an assigned supervisor and no official title.',
});

const ITC023 = defineItc({
  id: 'ITC023',
  feature: 'outline',
  module: 'DangKyVaDoiTenDeTai',
  sheet: 'DangKyVaDoiTenDeTai',
  fn: 'Confirm Initial Thesis Title',
  description:
    'Verify that a student can successfully confirm an initial thesis title with leading and trailing whitespace trimmed',
  procedure:
    '1. Log in as a Student ("Nguyễn Thị Mai") and open the "Nộp đề cương" screen.\n' +
    '2. Enter "  Xây dựng hệ thống gợi ý đề tài đồ án tốt nghiệp  " into the topic title input and click "Chốt tên đề tài".',
  expected:
    '1. The API POST /topic/confirm-title sends trimmed newName = "Xây dựng hệ thống gợi ý đề tài đồ án tốt nghiệp" and returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Gửi tên đề tài chính thức thành công".\n' +
    '3. The database stores 1 new PENDING topic title history record with old_name = NULL and new_name = "Xây dựng hệ thống gợi ý đề tài đồ án tốt nghiệp", keeps the official thesis title as NULL pending supervisor approval, and stores a notification for supervisor "GV999401".\n' +
    '4. The UI shows toast "Gửi tên đề tài chính thức thành công!", displays badge "Đang chờ GVHD duyệt tên đề tài", and disables the topic input and "Chốt tên đề tài" button.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Nguyễn Thị Mai" ("9990000401") has main supervisor "GV999401", no official title yet, and no PENDING title requests.',
});

const ITC024 = defineItc({
  id: 'ITC024',
  feature: 'outline',
  module: 'DangKyVaDoiTenDeTai',
  sheet: 'DangKyVaDoiTenDeTai',
  fn: 'Confirm Initial Thesis Title',
  description:
    'Verify that a student can resubmit a new initial thesis title after a previous initial title request was rejected',
  procedure:
    '1. Log in as a Student ("Nguyễn Thị Mai") whose previous initial title request was rejected, and open the "Nộp đề cương" screen.\n' +
    '2. Enter "Hệ thống hỗ trợ quản lý tiến độ đồ án tốt nghiệp TLU" and click "Chốt tên đề tài".',
  expected:
    '1. The API POST /topic/confirm-title returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Gửi tên đề tài chính thức thành công".\n' +
    '3. The database contains 2 topic title history records for student "9990000401" (1 REJECTED and 1 new PENDING with old_name = NULL and new_name = "Hệ thống hỗ trợ quản lý tiến độ đồ án tốt nghiệp TLU").\n' +
    '4. The UI shows toast "Gửi tên đề tài chính thức thành công!", hides the rejection notice, displays badge "Đang chờ GVHD duyệt tên đề tài", and disables the input and button.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Nguyễn Thị Mai" ("9990000401") has 1 REJECTED initial title request ("Tên đề tài sơ bộ chưa đạt") and no official title.',
});

const ITC025 = defineItc({
  id: 'ITC025',
  feature: 'outline',
  module: 'DangKyVaDoiTenDeTai',
  sheet: 'DangKyVaDoiTenDeTai',
  fn: 'Confirm Initial Thesis Title',
  description:
    'Verify that submitting a blank or whitespace-only initial thesis title is blocked by client-side validation without calling the API',
  procedure:
    '1. Log in as a Student ("Nguyễn Thị Mai") and open the "Nộp đề cương" screen.\n' +
    '2. Enter whitespace only ("   ") into the topic title input and click "Chốt tên đề tài".',
  expected:
    '1. No request is sent to POST /topic/confirm-title.\n' +
    '2. The UI displays inline validation error "Vui lòng nhập tên đề tài!".\n' +
    '3. The database contains 0 topic title history records for student "9990000401".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Nguyễn Thị Mai" ("9990000401") has an assigned supervisor and no official title.',
});

const ITC026 = defineItc({
  id: 'ITC026',
  feature: 'outline',
  module: 'DangKyVaDoiTenDeTai',
  sheet: 'DangKyVaDoiTenDeTai',
  fn: 'Confirm Initial Thesis Title',
  description:
    'Verify that submitting an initial thesis title exceeding 500 characters is blocked by client-side validation without calling the API',
  procedure:
    '1. Log in as a Student ("Nguyễn Thị Mai") and open the "Nộp đề cương" screen.\n' +
    '2. Enter a 501-character thesis title and click "Chốt tên đề tài".',
  expected:
    '1. No request is sent to POST /topic/confirm-title.\n' +
    '2. The UI displays inline validation error "Tên đề tài không được vượt quá 500 ký tự!".\n' +
    '3. The database contains 0 topic title history records for student "9990000401".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Nguyễn Thị Mai" ("9990000401") has an assigned supervisor and no official title.',
});

const ITC027 = defineItc({
  id: 'ITC027',
  feature: 'outline',
  module: 'DangKyVaDoiTenDeTai',
  sheet: 'DangKyVaDoiTenDeTai',
  fn: 'Confirm Initial Thesis Title',
  description:
    'Verify that confirming an initial thesis title is blocked when another pending request is submitted concurrently before clicking submit',
  procedure:
    '1. Log in as a Student ("Nguyễn Thị Mai") and open the "Nộp đề cương" screen.\n' +
    '2. Concurrently in another session, submit an initial title request so the thesis topic already has a PENDING record.\n' +
    '3. Enter "Tên đề tài gửi trùng lặp" into the input and click "Chốt tên đề tài".',
  expected:
    '1. The API POST /topic/confirm-title returns HTTP 409 with code = 3051.\n' +
    '2. The response message is "Đề tài đang có yêu cầu chờ giảng viên hướng dẫn xác nhận".\n' +
    '3. The database retains only the 1 existing PENDING history record and creates no duplicate.\n' +
    '4. The UI displays error toast "Đề tài đang có yêu cầu chờ giảng viên hướng dẫn xác nhận".',
  precondition:
    '1. Student "Nguyễn Thị Mai" ("9990000401") opens "Nộp đề cương" with no PENDING request, and a PENDING request is concurrently created before clicking submit.',
});

const ITC028 = defineItc({
  id: 'ITC028',
  feature: 'outline',
  module: 'DangKyVaDoiTenDeTai',
  sheet: 'DangKyVaDoiTenDeTai',
  fn: 'Confirm Initial Thesis Title',
  description:
    'Verify that confirming an initial thesis title is blocked when the deadline closes before clicking submit',
  procedure:
    '1. Log in as a Student ("Nguyễn Thị Mai") and open the "Nộp đề cương" screen while the deadline is open.\n' +
    '2. The "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline closes before clicking submit.\n' +
    '3. Enter "Tên đề tài nộp sau khi hết hạn" and click "Chốt tên đề tài".',
  expected:
    '1. The API POST /topic/confirm-title returns HTTP 403 with code = 3054.\n' +
    '2. The response message is "Thời hạn nộp đề cương và cập nhật tên đề tài chưa mở hoặc đã kết thúc".\n' +
    '3. The database contains 0 topic title history records for student "9990000401".\n' +
    '4. The UI displays error toast "Thời hạn nộp đề cương và cập nhật tên đề tài chưa mở hoặc đã kết thúc".',
  precondition:
    '1. Student "Nguyễn Thị Mai" ("9990000401") opens "Nộp đề cương" while the deadline is OPEN, and the deadline transitions to COMPLETED before clicking submit.',
});

const ITC029 = defineItc({
  id: 'ITC029',
  feature: 'outline',
  module: 'DangKyVaDoiTenDeTai',
  sheet: 'DangKyVaDoiTenDeTai',
  fn: 'Request Thesis Title Change',
  description:
    'Verify that a student with an approved official title can successfully submit a thesis title change request',
  procedure:
    '1. Log in as a Student ("Nguyễn Thị Mai") who has an approved official title, and open the "Nộp đề cương" screen.\n' +
    '2. Replace the input value with "Hệ thống quản lý thư viện số tích hợp tìm kiếm ngữ nghĩa" and click "Gửi yêu cầu".',
  expected:
    '1. The API POST /topic/change-title sends newName = "Hệ thống quản lý thư viện số tích hợp tìm kiếm ngữ nghĩa" and returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Gửi yêu cầu đổi tên đề tài thành công".\n' +
    '3. The database stores a new PENDING history record with old_name = "Hệ thống quản lý thư viện số" and new_name = "Hệ thống quản lý thư viện số tích hợp tìm kiếm ngữ nghĩa", preserves the official title "Hệ thống quản lý thư viện số" until supervisor approval, and stores a notification for supervisor "GV999401".\n' +
    '4. The UI shows toast "Gửi yêu cầu đổi tên đề tài thành công!", displays badge "Đang chờ GVHD duyệt tên đề tài" and "Tên hiện tại: Hệ thống quản lý thư viện số", and disables the input and button.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Nguyễn Thị Mai" ("9990000401") has approved official title "Hệ thống quản lý thư viện số" at STAGE_2_TOPIC_CONFIRMED and no PENDING title requests.',
});

const ITC030 = defineItc({
  id: 'ITC030',
  feature: 'outline',
  module: 'DangKyVaDoiTenDeTai',
  sheet: 'DangKyVaDoiTenDeTai',
  fn: 'Request Thesis Title Change',
  description:
    'Verify that submitting a title change identical to the current official title (ignoring case and outer whitespace) is blocked by client-side validation',
  procedure:
    '1. Log in as a Student ("Nguyễn Thị Mai") who has approved official title "Hệ thống quản lý thư viện số", and open the "Nộp đề cương" screen.\n' +
    '2. Enter "  hệ thống quản lý thư viện số  " into the input and click "Gửi yêu cầu".',
  expected:
    '1. No request is sent to POST /topic/change-title.\n' +
    '2. The UI displays inline validation error "Tên đề tài mới phải khác với tên hiện tại!".\n' +
    '3. The database retains only the 1 original APPROVED history record and creates no PENDING record.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Nguyễn Thị Mai" ("9990000401") has approved official title "Hệ thống quản lý thư viện số" at STAGE_2_TOPIC_CONFIRMED.',
});

const ITC031 = defineItc({
  id: 'ITC031',
  feature: 'outline',
  module: 'DangKyVaDoiTenDeTai',
  sheet: 'DangKyVaDoiTenDeTai',
  fn: 'Request Thesis Title Change',
  description:
    'Verify that submitting a blank or over-500-character thesis title change is blocked by client-side validation without calling the API',
  procedure:
    '1. Log in as a Student ("Nguyễn Thị Mai") who has approved official title "Hệ thống quản lý thư viện số", and open the "Nộp đề cương" screen.\n' +
    '2. Clear the input to whitespace only ("   ") and click "Gửi yêu cầu".\n' +
    '3. Enter a 501-character title and click "Gửi yêu cầu".',
  expected:
    '1. No request is sent to POST /topic/change-title in either attempt.\n' +
    '2. The UI displays inline error "Vui lòng nhập tên đề tài!" for the blank input and "Tên đề tài không được vượt quá 500 ký tự!" for the 501-character input.\n' +
    '3. The database contains no new PENDING topic title history record.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Nguyễn Thị Mai" ("9990000401") has approved official title "Hệ thống quản lý thư viện số" at STAGE_2_TOPIC_CONFIRMED.',
});

const ITC032 = defineItc({
  id: 'ITC032',
  feature: 'outline',
  module: 'DangKyVaDoiTenDeTai',
  sheet: 'DangKyVaDoiTenDeTai',
  fn: 'Request Thesis Title Change',
  description:
    'Verify that a student can submit a new thesis title change request after a previous title change request was rejected',
  procedure:
    '1. Log in as a Student ("Nguyễn Thị Mai") whose previous title change request was rejected, and open the "Nộp đề cương" screen.\n' +
    '2. Enter "Hệ thống quản lý thư viện số đa nền tảng" and click "Gửi yêu cầu".',
  expected:
    '1. The API POST /topic/change-title returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Gửi yêu cầu đổi tên đề tài thành công".\n' +
    '3. The database contains 3 topic title history records (1 APPROVED, 1 REJECTED, and 1 new PENDING with old_name = "Hệ thống quản lý thư viện số" and new_name = "Hệ thống quản lý thư viện số đa nền tảng").\n' +
    '4. The UI shows toast "Gửi yêu cầu đổi tên đề tài thành công!", hides the rejection notice, displays badge "Đang chờ GVHD duyệt tên đề tài", and disables the input and button.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Nguyễn Thị Mai" ("9990000401") has approved official title "Hệ thống quản lý thư viện số" and 1 REJECTED title change request ("Tên đổi lần 1 bị từ chối").',
});

const ITC033 = defineItc({
  id: 'ITC033',
  feature: 'outline',
  module: 'DangKyVaDoiTenDeTai',
  sheet: 'DangKyVaDoiTenDeTai',
  fn: 'Request Thesis Title Change',
  description:
    'Verify that requesting a title change is blocked when another pending change request exists concurrently before clicking submit',
  procedure:
    '1. Log in as a Student ("Nguyễn Thị Mai") who has approved official title "Hệ thống quản lý thư viện số", and open the "Nộp đề cương" screen.\n' +
    '2. Concurrently in another session, submit a title change request so a PENDING record exists.\n' +
    '3. Enter "Tên đề tài đổi bị trùng phiên" and click "Gửi yêu cầu".',
  expected:
    '1. The API POST /topic/change-title returns HTTP 409 with code = 3051.\n' +
    '2. The response message is "Đề tài đang có yêu cầu đổi tên chờ giảng viên hướng dẫn xác nhận".\n' +
    '3. The database retains only 1 PENDING change request and does not insert a duplicate.\n' +
    '4. The UI displays error toast "Đề tài đang có yêu cầu đổi tên chờ giảng viên hướng dẫn xác nhận".',
  precondition:
    '1. Student "Nguyễn Thị Mai" ("9990000401") opens "Nộp đề cương" with official title "Hệ thống quản lý thư viện số" and no PENDING request, then concurrently submits a PENDING title change request before clicking submit.',
});

const ITC034 = defineItc({
  id: 'ITC034',
  feature: 'outline',
  module: 'DangKyVaDoiTenDeTai',
  sheet: 'DangKyVaDoiTenDeTai',
  fn: 'Request Thesis Title Change',
  description:
    'Verify that requesting a title change is blocked when the deadline transitions to extended grading period before clicking submit',
  procedure:
    '1. Log in as a Student ("Nguyễn Thị Mai") who has approved official title "Hệ thống quản lý thư viện số", and open the "Nộp đề cương" screen while the deadline is open.\n' +
    '2. The "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline transitions to EXTENDED status before clicking submit.\n' +
    '3. Enter "Tên đề tài đổi trong thời gian gia hạn chấm" and click "Gửi yêu cầu".',
  expected:
    '1. The API POST /topic/change-title returns HTTP 403 with code = 3054.\n' +
    '2. The response message is "Thời hạn nộp đề cương và cập nhật tên đề tài chưa mở hoặc đã kết thúc".\n' +
    '3. The database contains no new PENDING history record and preserves official title "Hệ thống quản lý thư viện số".\n' +
    '4. The UI displays error toast "Thời hạn nộp đề cương và cập nhật tên đề tài chưa mở hoặc đã kết thúc".',
  precondition:
    '1. Student "Nguyễn Thị Mai" ("9990000401") opens "Nộp đề cương" with official title "Hệ thống quản lý thư viện số" while the deadline is OPEN, and the deadline transitions to EXTENDED before clicking submit.',
});

// ============================================================================
// SECURITY TEST CASES (TC-SEC-016 .. TC-SEC-019)
// ============================================================================

const SEC016 = defineItcSec({
  id: 'TC-SEC-016',
  feature: 'outline',
  module: 'DangKyVaDoiTenDeTai',
  sheet: 'DangKyVaDoiTenDeTai',
  scenario: 'An unauthenticated user opens the Student outline screen directly and calls student topic title APIs',
  roleSession: 'Unauthenticated (Anonymous)',
  technique: 'EP',
  given: 'The browser has no active login session (no access_token cookie)',
  when: 'Open "/student/outline" directly on the Student portal and call GET /topic/my-title-history, POST /topic/confirm-title, and POST /topic/change-title',
  then: 'GET /my-info, GET /topic/my-title-history, POST /topic/confirm-title, and POST /topic/change-title return HTTP 401 with code = 2000; the UI automatically redirects to "/login" and displays no topic title data',
});

const SEC017 = defineItcSec({
  id: 'TC-SEC-017',
  feature: 'outline',
  module: 'DangKyVaDoiTenDeTai',
  sheet: 'DangKyVaDoiTenDeTai',
  scenario: 'A supervisor accesses the Student outline screen and calls student topic title APIs',
  roleSession: 'Supervisor (SUPERVISOR), logged in',
  technique: 'EP',
  given: 'Logged in with a Supervisor account (without STUDENT role or VIEW_TOPIC, REGISTER_TOPIC, UPDATE_TOPIC authorities)',
  when: 'Open "/student/outline" directly on the Student portal and call GET /topic/my-title-history, POST /topic/confirm-title, and POST /topic/change-title',
  then: 'The UI blocks access with message "Tài khoản của bạn không có quyền truy cập cổng sinh viên."; all three APIs return HTTP 403 with code = 2001 and message "Bạn không có quyền truy cập (access denied)"',
});

const SEC018 = defineItcSec({
  id: 'TC-SEC-018',
  feature: 'outline',
  module: 'DangKyVaDoiTenDeTai',
  sheet: 'DangKyVaDoiTenDeTai',
  scenario: 'A Head of Major accesses the Student outline screen and calls student topic title APIs',
  roleSession: 'Head of Major (HEAD_OF_MAJOR), logged in',
  technique: 'EP',
  given: 'Logged in with a Head of Major account (without STUDENT role)',
  when: 'Open "/student/outline" directly on the Student portal and call GET /topic/my-title-history, POST /topic/confirm-title, and POST /topic/change-title',
  then: 'The UI blocks access with message "Tài khoản của bạn không có quyền truy cập cổng sinh viên."; all three APIs return HTTP 403 with code = 2001 and message "Bạn không có quyền truy cập (access denied)"',
});

const SEC019 = defineItcSec({
  id: 'TC-SEC-019',
  feature: 'outline',
  module: 'DangKyVaDoiTenDeTai',
  sheet: 'DangKyVaDoiTenDeTai',
  scenario: 'A student session with a logged-out token accesses the outline screen and student topic title APIs',
  roleSession: 'Student (STUDENT), logged-out token',
  technique: 'STATE_TRANSITION',
  given: 'The student has logged out via POST /log-out so the token is invalidated, while the browser still sends the old access_token cookie',
  when: 'Open "/student/outline" and call GET /topic/my-title-history, POST /topic/confirm-title, and POST /topic/change-title with the logged-out token',
  then: 'GET /my-info, GET /topic/my-title-history, POST /topic/confirm-title, and POST /topic/change-title return HTTP 401 with code = 2000; the UI redirects to "/login", displays no topic title data, and no topic title history record is created in the database',
});

// ============================================================================
// HẠ TẦNG DỮ LIỆU TEST (TẠO QUA API, ĐỐI CHIẾU DB SELECT, DỌN SẠCH SAU TEST)
// ============================================================================

const TEST_MAIN_SUPERVISOR = {
  teacherCode: 'GV999401',
  firstName: 'Trần Quốc',
  lastName: 'Bảo',
  fullName: 'Trần Quốc Bảo',
  email: 'itc.svtopic.gv.999401@tlu.edu.vn',
  phone: '0989940401',
  academicTitle: 'TS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_CO_SUPERVISOR = {
  teacherCode: 'GV999402',
  firstName: 'Phạm Thị',
  lastName: 'Lan',
  fullName: 'Phạm Thị Lan',
  email: 'itc.svtopic.gv.999402@tlu.edu.vn',
  phone: '0989940402',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_ARCHIVE_SUPERVISOR = {
  teacherCode: 'GV999499',
  firstName: 'Nguyễn Lưu',
  lastName: 'Trữ',
  fullName: 'Nguyễn Lưu Trữ',
  email: 'itc.svtopic.gv.999499@tlu.edu.vn',
  phone: '0989940499',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_STUDENT_1 = {
  studentCode: '9990000401',
  firstName: 'Nguyễn Thị',
  lastName: 'Mai',
  fullName: 'Nguyễn Thị Mai',
  email: 'itc.svtopic.sv.9990000401@gmail.com',
  phone: '0989940101',
  batch: 'K64',
  className: '64HTTT99',
};

const TEST_STUDENT_2 = {
  studentCode: '9990000402',
  firstName: 'Vũ Minh',
  lastName: 'Quân',
  fullName: 'Vũ Minh Quân',
  email: 'itc.svtopic.sv.9990000402@gmail.com',
  phone: '0989940102',
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
  provisionalName?: string | null;
  assignCoSupervisor?: boolean;
  initialRequest?: {
    newName: string;
    reviewDecision?: 'APPROVED' | 'REJECTED';
  };
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
  deletableViaApi?: boolean;
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
  const teacherPublicId = matched?.teacherPublicId ?? '';
  if (!teacherPublicId) {
    throw new Error(`Không lấy được publicId cho giảng viên ${teacher.teacherCode}`);
  }

  const token = await loginByEmail(request, teacher.email);
  return { id: teacherId, publicId: teacherPublicId, token };
}

async function sweepResidualTopicsInIsolatedMajor(request: APIRequestContext) {
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
    if (st.coSupervisorPublicId === envState.coSupervisorPublicId) {
      await apiCall(
        request,
        envState.hodToken,
        'PUT',
        `/semesters/${envState.semesterPublicId}/advisor-assignments/students/${st.studentPublicId}/co-supervisor`,
        { data: { coTeacherPublicId: null } },
      );
    }
    if (
      st.status === 'UNASSIGNED' ||
      st.supervisorPublicId === envState.mainSupervisorPublicId ||
      st.supervisorPublicId === envState.coSupervisorPublicId
    ) {
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

  // Thử xóa hẳn nếu sinh viên chưa có đơn đăng ký/đề tài; nếu không xóa được thì xoay mã sang lưu trữ
  const delRes = await apiCall(request, envState.hodToken, 'DELETE', `/student/${matched.publicId}`);
  if (delRes.status === 200) return;

  const suffix = `${String(Date.now()).slice(-5)}${rotateCounter++}`;
  await apiCall(request, envState.hodToken, 'PUT', `/student/${matched.publicId}`, {
    data: {
      studentCode: `9998${suffix.slice(-6)}`,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: `itc.arch.svtopic.${suffix}@gmail.com`,
      phone: `0978${suffix.slice(-6)}`,
      batch: profile.batch,
      className: profile.className,
    },
  });
}

async function provisionUnassignedStudent(
  request: APIRequestContext,
  profile: StudentProfile,
): Promise<ProvisionedStudentHandle> {
  await releaseStudentCodeIfTaken(request, profile);

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
    throw new Error(`Không thể tạo SV ${profile.studentCode}: ${JSON.stringify(createRes.body)}`);
  }

  const listRes = await apiCall(request, envState.hodToken, 'GET', '/student', {
    params: { semesterId: envState.semesterPublicId, keyword: profile.studentCode },
  });
  const matched = (listRes.body?.data?.content ?? []).find(
    (s: any) => s.studentCode === profile.studentCode,
  );
  if (!matched?.publicId) {
    throw new Error(`Không tìm thấy publicId của SV ${profile.studentCode}`);
  }

  const studentToken = await loginByEmail(request, profile.email);
  const ovRes = await apiCall(request, studentToken, 'GET', '/topic/my-title-history');
  const handle: ProvisionedStudentHandle = {
    profile,
    studentPublicId: matched.publicId,
    studentToken,
    topicPublicId: ovRes.body?.data?.topicPublicId ?? '',
    deletableViaApi: true,
  };
  activeHandles.push(handle);
  return handle;
}

async function provisionAssignedStudent(
  request: APIRequestContext,
  spec: ProvisionStudentSpec,
): Promise<ProvisionedStudentHandle> {
  await sweepResidualTopicsInIsolatedMajor(request);
  await updateDeadline(request, envState.dlDangKy, 'DANG_KY_GVHD', 'OPEN');

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
      topicName: spec.provisionalName ?? null,
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

  const handle: ProvisionedStudentHandle = {
    profile: spec.profile,
    studentPublicId: matched.publicId,
    studentToken,
    topicPublicId: '',
  };
  activeHandles.push(handle);

  await updateDeadline(request, envState.dlDangKy, 'DANG_KY_GVHD', 'CLOSED');
  await updateDeadline(request, envState.dlTbmChot, 'TBM_CHOT_DS_GVHD_DU_KIEN', 'OPEN');

  if (spec.assignCoSupervisor) {
    const coRes = await apiCall(
      request,
      envState.hodToken,
      'PUT',
      `/semesters/${envState.semesterPublicId}/advisor-assignments/students/${handle.studentPublicId}/co-supervisor`,
      { data: { coTeacherPublicId: envState.coSupervisorPublicId } },
    );
    if (coRes.status !== 200) {
      throw new Error(`Không thể gán GV đồng hướng dẫn cho SV ${spec.profile.studentCode}: ${JSON.stringify(coRes.body)}`);
    }
  }

  await setLockStatus(request, true);
  await setLockStatus(request, false);

  await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'OPEN');

  if (spec.initialRequest) {
    const initRes = await apiCall(request, handle.studentToken, 'POST', '/topic/confirm-title', {
      data: { newName: spec.initialRequest.newName },
    });
    if (initRes.status !== 200) {
      throw new Error(`SV ${handle.profile.studentCode} không thể chốt tên lần đầu: ${JSON.stringify(initRes.body)}`);
    }

    const ovRes = await apiCall(request, handle.studentToken, 'GET', '/topic/my-title-history');
    handle.topicPublicId = ovRes.body?.data?.topicPublicId ?? '';
    const latestId = ovRes.body?.data?.histories?.[0]?.publicId;

    if (spec.initialRequest.reviewDecision && latestId) {
      const revRes = await apiCall(
        request,
        envState.mainSupervisorToken,
        'PUT',
        `/topic/title-request/${latestId}/review`,
        { data: { decision: spec.initialRequest.reviewDecision } },
      );
      if (revRes.status !== 200) {
        throw new Error(`Không thể duyệt sẵn yêu cầu đầu cho SV ${handle.profile.studentCode}: ${JSON.stringify(revRes.body)}`);
      }
    }
  }

  if (spec.changeRequest) {
    const chgRes = await apiCall(request, handle.studentToken, 'POST', '/topic/change-title', {
      data: { newName: spec.changeRequest.newName },
    });
    if (chgRes.status !== 200) {
      throw new Error(`SV ${handle.profile.studentCode} không thể gửi yêu cầu đổi tên: ${JSON.stringify(chgRes.body)}`);
    }

    const ovRes = await apiCall(request, handle.studentToken, 'GET', '/topic/my-title-history');
    handle.topicPublicId = ovRes.body?.data?.topicPublicId ?? handle.topicPublicId;
    const latestId = ovRes.body?.data?.histories?.[0]?.publicId;

    if (spec.changeRequest.reviewDecision && latestId) {
      const revRes = await apiCall(
        request,
        envState.mainSupervisorToken,
        'PUT',
        `/topic/title-request/${latestId}/review`,
        { data: { decision: spec.changeRequest.reviewDecision } },
      );
      if (revRes.status !== 200) {
        throw new Error(`Không thể duyệt sẵn yêu cầu đổi tên cho SV ${handle.profile.studentCode}: ${JSON.stringify(revRes.body)}`);
      }
    }
  }

  if (!handle.topicPublicId) {
    const ovRes = await apiCall(request, handle.studentToken, 'GET', '/topic/my-title-history');
    handle.topicPublicId = ovRes.body?.data?.topicPublicId ?? '';
  }

  return handle;
}

async function cleanupActiveStudents(request: APIRequestContext) {
  if (activeHandles.length === 0) return;

  const handles = [...activeHandles];
  activeHandles = [];

  // Xóa trước các sinh viên chưa từng gửi đơn đăng ký (xóa sạch không để lại dữ liệu)
  const remaining: ProvisionedStudentHandle[] = [];
  for (const h of handles) {
    if (h.deletableViaApi) {
      const delRes = await apiCall(request, envState.hodToken, 'DELETE', `/student/${h.studentPublicId}`);
      if (delRes.status === 200) continue;
    }
    remaining.push(h);
  }

  if (remaining.length === 0) return;

  await sweepResidualTopicsInIsolatedMajor(request);

  for (const h of remaining) {
    const suffix = `${String(Date.now()).slice(-5)}${rotateCounter++}`;
    await apiCall(request, envState.hodToken, 'PUT', `/student/${h.studentPublicId}`, {
      data: {
        studentCode: `9998${suffix.slice(-6)}`,
        firstName: h.profile.firstName,
        lastName: h.profile.lastName,
        email: `itc.arch.svtopic.${suffix}@gmail.com`,
        phone: `0978${suffix.slice(-6)}`,
        batch: h.profile.batch,
        className: h.profile.className,
      },
    });
  }
}

async function openStudentOutlinePage(page: Page, context: BrowserContext, token: string) {
  await setAuthCookie(context, token);

  const overviewPromise = page.waitForResponse(
    (r) => r.url().includes('/topic/my-title-history') && r.request().method() === 'GET',
  );
  await page.goto('/student/outline');
  const overviewRes = await overviewPromise;
  return { overviewRes };
}

test.describe('Report 5.2 - Student Register/Confirm and Change Thesis Title (DangKyVaDoiTenDeTai)', () => {
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
      archiveSupervisorId: 0,
      archiveSupervisorPublicId: '',
      dlDangKy: findSnap('DANG_KY_GVHD'),
      dlTbmChot: findSnap('TBM_CHOT_DS_GVHD_DU_KIEN'),
      dlDeCuong: findSnap('SV_CHINH_SUA_NOP_LAI_DE_CUONG'),
    };

    const mainSup = await ensureTeacher(request, TEST_MAIN_SUPERVISOR, 20);
    envState.mainSupervisorId = mainSup.id;
    envState.mainSupervisorPublicId = mainSup.publicId;
    envState.mainSupervisorToken = mainSup.token;

    const coSup = await ensureTeacher(request, TEST_CO_SUPERVISOR, 20);
    envState.coSupervisorId = coSup.id;
    envState.coSupervisorPublicId = coSup.publicId;

    const archiveSup = await ensureTeacher(request, TEST_ARCHIVE_SUPERVISOR, 500);
    envState.archiveSupervisorId = archiveSup.id;
    envState.archiveSupervisorPublicId = archiveSup.publicId;
  });

  test.afterEach(async ({ request }) => {
    await cleanupActiveStudents(request);
    await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'OPEN');
  });

  test.afterAll(async ({ request }) => {
    if (!envState) return;
    try {
      await cleanupActiveStudents(request);
    } catch {
      // bỏ qua lỗi phụ khi dọn cuối suite
    }

    if (envState.coSupervisorId) {
      await apiCall(request, envState.hodToken, 'DELETE', `/semesters/${envState.semesterPublicId}/advisors/${envState.coSupervisorId}`);
      await apiCall(request, envState.hodToken, 'DELETE', `/teacher/${envState.coSupervisorId}`);
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
  // FUNCTION 1: View Topic Title Overview and Status (ITC017..ITC022)
  // ==========================================================================

  test(ITC017.title, { annotation: ITC017.annotation }, async ({ page, context, request }) => {
    const h = await provisionAssignedStudent(request, {
      profile: TEST_STUDENT_1,
      assignCoSupervisor: true,
    });

    const { overviewRes } = await openStudentOutlinePage(page, context, h.studentToken);
    expect(overviewRes.status()).toBe(200);
    const body = await overviewRes.json();
    expect(body.code).toBe(1000);
    expect(body.data.officialName).toBeNull();
    expect(body.data.deadlineStatus).toBe('OPEN');
    expect(body.data.lecturerName).toBe(TEST_MAIN_SUPERVISOR.fullName);
    expect(body.data.coLecturerName).toBe(TEST_CO_SUPERVISOR.fullName);
    expect(body.data.histories).toHaveLength(0);

    await expect(page.getByText('Chốt tên đề tài chính thức')).toBeVisible();
    const input = page.locator('#outlineTopicInput');
    await expect(input).toBeEnabled();
    await expect(input).toHaveValue('');
    await expect(input).toHaveAttribute('placeholder', 'Nhập tên đề tài chính thức lần đầu...');
    await expect(page.getByRole('button', { name: 'Chốt tên đề tài' })).toBeEnabled();
    await expect(page.getByText(TEST_MAIN_SUPERVISOR.fullName)).toBeVisible();
    await expect(page.getByText(TEST_CO_SUPERVISOR.fullName)).toBeVisible();
    await expect(page.locator('#outlineDeadlineText')).toContainText('(Đang mở)');

    // Đối chiếu DB bằng SELECT
    const topicRows = await dbSelect<{
      name: string | null;
      lecturer_code: string | null;
      co_lecturer_code: string | null;
      history_count: number;
    }>(
      `SELECT tt.name,
              t1.teacher_code AS lecturer_code,
              t2.teacher_code AS co_lecturer_code,
              (SELECT COUNT(*) FROM topic_title_history h WHERE h.thesis_topic_id = tt.id) AS history_count
         FROM thesis_topic tt
         JOIN student s ON s.id = tt.student_id
         LEFT JOIN teacher t1 ON t1.id = tt.lecturer_id
         LEFT JOIN teacher t2 ON t2.id = tt.co_lecturer_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(topicRows).toHaveLength(1);
    expect(topicRows[0].name).toBeNull();
    expect(topicRows[0].lecturer_code).toBe(TEST_MAIN_SUPERVISOR.teacherCode);
    expect(topicRows[0].co_lecturer_code).toBe(TEST_CO_SUPERVISOR.teacherCode);
    expect(Number(topicRows[0].history_count)).toBe(0);
  });

  test(ITC018.title, { annotation: ITC018.annotation }, async ({ page, context, request }) => {
    await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'OPEN');
    const h = await provisionUnassignedStudent(request, TEST_STUDENT_2);

    const { overviewRes } = await openStudentOutlinePage(page, context, h.studentToken);
    expect(overviewRes.status()).toBe(200);
    const body = await overviewRes.json();
    expect(body.code).toBe(1000);
    expect(body.data.currentStage).toBe('STAGE_1_REGISTERING_ADVISOR');
    expect(body.data.officialName).toBeNull();
    expect(body.data.lecturerName).toBeNull();

    await expect(page.getByText('Tên đề tài tốt nghiệp')).toBeVisible();
    await expect(page.getByText('Chưa phân công').first()).toBeVisible();
    await expect(page.locator('#outlineTopicInput')).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Gửi yêu cầu' })).toBeDisabled();

    const rows = await dbSelect<{
      current_stage: string;
      lecturer_id: number | null;
      name: string | null;
    }>(
      `SELECT tt.current_stage, tt.lecturer_id, tt.name
         FROM thesis_topic tt
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_2.studentCode, envState.semesterId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].current_stage).toBe('STAGE_1_REGISTERING_ADVISOR');
    expect(rows[0].lecturer_id).toBeNull();
    expect(rows[0].name).toBeNull();
  });

  test(ITC019.title, { annotation: ITC019.annotation }, async ({ page, context, request }) => {
    const pendingTitle = 'Hệ thống quản lý đồ án tốt nghiệp ứng dụng AI';
    const h = await provisionAssignedStudent(request, {
      profile: TEST_STUDENT_1,
      initialRequest: { newName: pendingTitle },
    });

    const { overviewRes } = await openStudentOutlinePage(page, context, h.studentToken);
    expect(overviewRes.status()).toBe(200);
    const body = await overviewRes.json();
    expect(body.code).toBe(1000);
    expect(body.data.officialName).toBeNull();
    expect(body.data.histories).toHaveLength(1);
    expect(body.data.histories[0].status).toBe('PENDING');
    expect(body.data.histories[0].newName).toBe(pendingTitle);

    await expect(page.getByText('Đang chờ GVHD duyệt tên đề tài')).toBeVisible();
    const input = page.locator('#outlineTopicInput');
    await expect(input).toBeDisabled();
    await expect(input).toHaveValue(pendingTitle);
    await expect(page.getByRole('button', { name: 'Chốt tên đề tài' })).toBeDisabled();

    const rows = await dbSelect<{ status: string; new_name: string; topic_name: string | null }>(
      `SELECT h.status, h.new_name, tt.name AS topic_name
         FROM topic_title_history h
         JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('PENDING');
    expect(rows[0].new_name).toBe(pendingTitle);
    expect(rows[0].topic_name).toBeNull();
  });

  test(ITC020.title, { annotation: ITC020.annotation }, async ({ page, context, request }) => {
    const rejectedTitle = 'Tên đề tài quá chung chung';
    const h = await provisionAssignedStudent(request, {
      profile: TEST_STUDENT_1,
      initialRequest: { newName: rejectedTitle, reviewDecision: 'REJECTED' },
    });

    const { overviewRes } = await openStudentOutlinePage(page, context, h.studentToken);
    expect(overviewRes.status()).toBe(200);
    const body = await overviewRes.json();
    expect(body.code).toBe(1000);
    expect(body.data.officialName).toBeNull();
    expect(body.data.histories[0].status).toBe('REJECTED');

    await expect(
      page.getByText(`Yêu cầu tên đề tài "${rejectedTitle}" đã bị GVHD từ chối. Vui lòng chỉnh sửa và gửi lại.`),
    ).toBeVisible();
    await expect(page.locator('#outlineTopicInput')).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Chốt tên đề tài' })).toBeEnabled();

    const rows = await dbSelect<{ status: string; topic_name: string | null }>(
      `SELECT h.status, tt.name AS topic_name
         FROM topic_title_history h
         JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('REJECTED');
    expect(rows[0].topic_name).toBeNull();
  });

  test(ITC021.title, { annotation: ITC021.annotation }, async ({ page, context, request }) => {
    const h = await provisionAssignedStudent(request, {
      profile: TEST_STUDENT_1,
    });

    // 1. Trạng thái CLOSED
    await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'CLOSED');
    const closedOpen = await openStudentOutlinePage(page, context, h.studentToken);
    expect(closedOpen.overviewRes.status()).toBe(200);
    const closedBody = await closedOpen.overviewRes.json();
    expect(closedBody.code).toBe(1000);
    expect(closedBody.data.deadlineStatus).toBe('CLOSED');

    await expect(page.locator('#outlineDeadlineText')).toContainText('Đã hết hạn');
    await expect(page.locator('#outlineTopicInput')).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Chốt tên đề tài' })).toBeDisabled();

    // 2. Trạng thái NOT_STARTED
    await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'NOT_STARTED');
    const notStartedPromise = page.waitForResponse(
      (r) => r.url().includes('/topic/my-title-history') && r.request().method() === 'GET',
    );
    await page.reload();
    const notStartedRes = await notStartedPromise;
    expect(notStartedRes.status()).toBe(200);
    const notStartedBody = await notStartedRes.json();
    expect(notStartedBody.code).toBe(1000);
    expect(notStartedBody.data.deadlineStatus).toBe('NOT_STARTED');

    await expect(page.locator('#outlineDeadlineText')).toContainText('Chưa mở');
    await expect(page.getByText(/Hạn nộp đề cương chưa mở/).first()).toBeVisible();
    await expect(page.locator('#outlineTopicInput')).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Chốt tên đề tài' })).toBeDisabled();
  });

  test(ITC022.title, { annotation: ITC022.annotation }, async ({ page, context, request }) => {
    const h = await provisionAssignedStudent(request, {
      profile: TEST_STUDENT_1,
    });

    await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'EXTENDED');
    const { overviewRes } = await openStudentOutlinePage(page, context, h.studentToken);
    expect(overviewRes.status()).toBe(200);
    const body = await overviewRes.json();
    expect(body.code).toBe(1000);
    expect(body.data.deadlineStatus).toBe('EXTENDED');

    await expect(page.locator('#outlineDeadlineText')).toContainText(
      'Đã hết hạn nộp — Đang trong thời gian gia hạn chấm của giảng viên',
    );
    await expect(page.getByText(/Đã hết hạn nộp đề cương cho sinh viên/).first()).toBeVisible();
    await expect(page.locator('#outlineTopicInput')).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Chốt tên đề tài' })).toBeDisabled();
  });

  // ==========================================================================
  // FUNCTION 2: Confirm Initial Thesis Title (ITC023..ITC028)
  // ==========================================================================

  test(ITC023.title, { annotation: ITC023.annotation }, async ({ page, context, request }) => {
    const h = await provisionAssignedStudent(request, {
      profile: TEST_STUDENT_1,
    });

    const rawInput = '  Xây dựng hệ thống gợi ý đề tài đồ án tốt nghiệp  ';
    const trimmedTitle = 'Xây dựng hệ thống gợi ý đề tài đồ án tốt nghiệp';

    await openStudentOutlinePage(page, context, h.studentToken);
    const input = page.locator('#outlineTopicInput');
    await input.fill(rawInput);

    const confirmPromise = page.waitForResponse(
      (r) => r.url().endsWith('/topic/confirm-title') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Chốt tên đề tài' }).click();
    const confirmRes = await confirmPromise;

    expect(confirmRes.request().postDataJSON()).toEqual({ newName: trimmedTitle });
    expect(confirmRes.status()).toBe(200);
    const confirmBody = await confirmRes.json();
    expect(confirmBody.code).toBe(1000);
    expect(confirmBody.message).toBe('Gửi tên đề tài chính thức thành công');

    await expect(page.getByText('Gửi tên đề tài chính thức thành công!')).toBeVisible();
    await expect(page.getByText('Đang chờ GVHD duyệt tên đề tài')).toBeVisible();
    await expect(input).toBeDisabled();
    await expect(input).toHaveValue(trimmedTitle);
    await expect(page.getByRole('button', { name: 'Chốt tên đề tài' })).toBeDisabled();

    // Đối chiếu DB: lịch sử PENDING, tên chính thức vẫn NULL, thông báo cho GVHD
    const histRows = await dbSelect<{
      old_name: string | null;
      new_name: string;
      status: string;
      topic_name: string | null;
    }>(
      `SELECT h.old_name, h.new_name, h.status, tt.name AS topic_name
         FROM topic_title_history h
         JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(histRows).toHaveLength(1);
    expect(histRows[0].old_name).toBeNull();
    expect(histRows[0].new_name).toBe(trimmedTitle);
    expect(histRows[0].status).toBe('PENDING');
    expect(histRows[0].topic_name).toBeNull();

    const notifRows = await dbSelect<{ content: string }>(
      `SELECT n.content
         FROM notification n
         JOIN account a ON a.id = n.account_id
         JOIN teacher t ON t.account_id = a.id
        WHERE t.teacher_code = ?
        ORDER BY n.id DESC
        LIMIT 5`,
      [TEST_MAIN_SUPERVISOR.teacherCode],
    );
    expect(
      notifRows.some(
        (n) =>
          n.content.includes(TEST_STUDENT_1.fullName) &&
          n.content.includes('đã gửi tên đề tài chính thức chờ bạn xác nhận'),
      ),
    ).toBe(true);
  });

  test(ITC024.title, { annotation: ITC024.annotation }, async ({ page, context, request }) => {
    const rejectedTitle = 'Tên đề tài sơ bộ chưa đạt';
    const resubmittedTitle = 'Hệ thống hỗ trợ quản lý tiến độ đồ án tốt nghiệp TLU';

    const h = await provisionAssignedStudent(request, {
      profile: TEST_STUDENT_1,
      initialRequest: { newName: rejectedTitle, reviewDecision: 'REJECTED' },
    });

    await openStudentOutlinePage(page, context, h.studentToken);
    const rejectionBanner = page.getByText(
      `Yêu cầu tên đề tài "${rejectedTitle}" đã bị GVHD từ chối. Vui lòng chỉnh sửa và gửi lại.`,
    );
    await expect(rejectionBanner).toBeVisible();

    const input = page.locator('#outlineTopicInput');
    await input.fill(resubmittedTitle);

    const confirmPromise = page.waitForResponse(
      (r) => r.url().endsWith('/topic/confirm-title') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Chốt tên đề tài' }).click();
    const confirmRes = await confirmPromise;

    expect(confirmRes.status()).toBe(200);
    const confirmBody = await confirmRes.json();
    expect(confirmBody.code).toBe(1000);
    expect(confirmBody.message).toBe('Gửi tên đề tài chính thức thành công');

    await expect(page.getByText('Gửi tên đề tài chính thức thành công!')).toBeVisible();
    await expect(rejectionBanner).toBeHidden();
    await expect(page.getByText('Đang chờ GVHD duyệt tên đề tài')).toBeVisible();
    await expect(input).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Chốt tên đề tài' })).toBeDisabled();

    const histRows = await dbSelect<{ old_name: string | null; new_name: string; status: string }>(
      `SELECT h.old_name, h.new_name, h.status
         FROM topic_title_history h
         JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?
        ORDER BY h.requested_at DESC, h.id DESC`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(histRows).toHaveLength(2);
    expect(histRows[0].status).toBe('PENDING');
    expect(histRows[0].old_name).toBeNull();
    expect(histRows[0].new_name).toBe(resubmittedTitle);
    expect(histRows[1].status).toBe('REJECTED');
  });

  test(ITC025.title, { annotation: ITC025.annotation }, async ({ page, context, request }) => {
    const h = await provisionAssignedStudent(request, {
      profile: TEST_STUDENT_1,
    });

    await openStudentOutlinePage(page, context, h.studentToken);

    let confirmCalled = false;
    page.on('request', (req) => {
      if (req.url().endsWith('/topic/confirm-title') && req.method() === 'POST') {
        confirmCalled = true;
      }
    });

    await page.locator('#outlineTopicInput').fill('   ');
    await page.getByRole('button', { name: 'Chốt tên đề tài' }).click();

    await expect(page.getByRole('alert').filter({ hasText: 'Vui lòng nhập tên đề tài!' })).toBeVisible();
    expect(confirmCalled).toBe(false);

    const rows = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM topic_title_history h
         JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(Number(rows[0].total)).toBe(0);
  });

  test(ITC026.title, { annotation: ITC026.annotation }, async ({ page, context, request }) => {
    const h = await provisionAssignedStudent(request, {
      profile: TEST_STUDENT_1,
    });

    await openStudentOutlinePage(page, context, h.studentToken);

    let confirmCalled = false;
    page.on('request', (req) => {
      if (req.url().endsWith('/topic/confirm-title') && req.method() === 'POST') {
        confirmCalled = true;
      }
    });

    await page.locator('#outlineTopicInput').fill('A'.repeat(501));
    await page.getByRole('button', { name: 'Chốt tên đề tài' }).click();

    await expect(
      page.getByRole('alert').filter({ hasText: 'Tên đề tài không được vượt quá 500 ký tự!' }),
    ).toBeVisible();
    expect(confirmCalled).toBe(false);

    const rows = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM topic_title_history h
         JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(Number(rows[0].total)).toBe(0);
  });

  test(ITC027.title, { annotation: ITC027.annotation }, async ({ page, context, request }) => {
    const h = await provisionAssignedStudent(request, {
      profile: TEST_STUDENT_1,
    });

    await openStudentOutlinePage(page, context, h.studentToken);
    await page.locator('#outlineTopicInput').fill('Tên đề tài gửi trùng lặp');

    // Gửi trước 1 yêu cầu từ phiên khác để tạo trạng thái PENDING song song
    const concurrentRes = await apiCall(request, h.studentToken, 'POST', '/topic/confirm-title', {
      data: { newName: 'Tên đề tài đã gửi ở phiên khác' },
    });
    expect(concurrentRes.status).toBe(200);

    const confirmPromise = page.waitForResponse(
      (r) => r.url().endsWith('/topic/confirm-title') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Chốt tên đề tài' }).click();
    const confirmRes = await confirmPromise;

    expect(confirmRes.status()).toBe(409);
    const body = await confirmRes.json();
    expect(body.code).toBe(3051);
    expect(body.message).toBe('Đề tài đang có yêu cầu chờ giảng viên hướng dẫn xác nhận');

    await expect(page.getByText('Đề tài đang có yêu cầu chờ giảng viên hướng dẫn xác nhận')).toBeVisible();

    const rows = await dbSelect<{ new_name: string; status: string }>(
      `SELECT h.new_name, h.status
         FROM topic_title_history h
         JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('PENDING');
    expect(rows[0].new_name).toBe('Tên đề tài đã gửi ở phiên khác');
  });

  test(ITC028.title, { annotation: ITC028.annotation }, async ({ page, context, request }) => {
    const h = await provisionAssignedStudent(request, {
      profile: TEST_STUDENT_1,
    });

    await openStudentOutlinePage(page, context, h.studentToken);
    await page.locator('#outlineTopicInput').fill('Tên đề tài nộp sau khi hết hạn');

    // Đóng hạn ngay trước khi bấm nút
    await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'CLOSED');

    const confirmPromise = page.waitForResponse(
      (r) => r.url().endsWith('/topic/confirm-title') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Chốt tên đề tài' }).click();
    const confirmRes = await confirmPromise;

    expect(confirmRes.status()).toBe(403);
    const body = await confirmRes.json();
    expect(body.code).toBe(3054);
    expect(body.message).toBe('Thời hạn nộp đề cương và cập nhật tên đề tài chưa mở hoặc đã kết thúc');

    await expect(
      page.getByText('Thời hạn nộp đề cương và cập nhật tên đề tài chưa mở hoặc đã kết thúc'),
    ).toBeVisible();

    const rows = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM topic_title_history h
         JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(Number(rows[0].total)).toBe(0);
  });

  // ==========================================================================
  // FUNCTION 3: Request Thesis Title Change (ITC029..ITC034)
  // ==========================================================================

  test(ITC029.title, { annotation: ITC029.annotation }, async ({ page, context, request }) => {
    const officialTitle = 'Hệ thống quản lý thư viện số';
    const newTitle = 'Hệ thống quản lý thư viện số tích hợp tìm kiếm ngữ nghĩa';

    const h = await provisionAssignedStudent(request, {
      profile: TEST_STUDENT_1,
      initialRequest: { newName: officialTitle, reviewDecision: 'APPROVED' },
    });

    await openStudentOutlinePage(page, context, h.studentToken);
    await expect(page.getByText('Yêu cầu đổi tên đề tài')).toBeVisible();
    await expect(page.getByText('Tên chính thức:')).toBeVisible();
    await expect(page.getByText(officialTitle).first()).toBeVisible();

    const input = page.locator('#outlineTopicInput');
    await input.fill(newTitle);

    const changePromise = page.waitForResponse(
      (r) => r.url().endsWith('/topic/change-title') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Gửi yêu cầu' }).click();
    const changeRes = await changePromise;

    expect(changeRes.request().postDataJSON()).toEqual({ newName: newTitle });
    expect(changeRes.status()).toBe(200);
    const body = await changeRes.json();
    expect(body.code).toBe(1000);
    expect(body.message).toBe('Gửi yêu cầu đổi tên đề tài thành công');

    await expect(page.getByText('Gửi yêu cầu đổi tên đề tài thành công!')).toBeVisible();
    await expect(page.getByText('Đang chờ GVHD duyệt tên đề tài')).toBeVisible();
    await expect(page.getByText('Tên hiện tại:')).toBeVisible();
    await expect(page.getByText(officialTitle).first()).toBeVisible();
    await expect(input).toBeDisabled();
    await expect(input).toHaveValue(newTitle);
    await expect(page.getByRole('button', { name: 'Gửi yêu cầu' })).toBeDisabled();

    // Đối chiếu DB: lưu PENDING với old_name = officialTitle, giữ nguyên thesis_topic.name, thông báo GVHD
    const histRows = await dbSelect<{
      old_name: string | null;
      new_name: string;
      status: string;
      topic_name: string | null;
    }>(
      `SELECT h.old_name, h.new_name, h.status, tt.name AS topic_name
         FROM topic_title_history h
         JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?
        ORDER BY h.requested_at DESC, h.id DESC`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(histRows).toHaveLength(2);
    expect(histRows[0].status).toBe('PENDING');
    expect(histRows[0].old_name).toBe(officialTitle);
    expect(histRows[0].new_name).toBe(newTitle);
    expect(histRows[0].topic_name).toBe(officialTitle);

    const notifRows = await dbSelect<{ content: string }>(
      `SELECT n.content
         FROM notification n
         JOIN account a ON a.id = n.account_id
         JOIN teacher t ON t.account_id = a.id
        WHERE t.teacher_code = ?
        ORDER BY n.id DESC
        LIMIT 5`,
      [TEST_MAIN_SUPERVISOR.teacherCode],
    );
    expect(
      notifRows.some(
        (n) =>
          n.content.includes(TEST_STUDENT_1.fullName) &&
          n.content.includes('đã gửi yêu cầu xin đổi tên đề tài'),
      ),
    ).toBe(true);
  });

  test(ITC030.title, { annotation: ITC030.annotation }, async ({ page, context, request }) => {
    const officialTitle = 'Hệ thống quản lý thư viện số';
    const h = await provisionAssignedStudent(request, {
      profile: TEST_STUDENT_1,
      initialRequest: { newName: officialTitle, reviewDecision: 'APPROVED' },
    });

    await openStudentOutlinePage(page, context, h.studentToken);

    let changeCalled = false;
    page.on('request', (req) => {
      if (req.url().endsWith('/topic/change-title') && req.method() === 'POST') {
        changeCalled = true;
      }
    });

    await page.locator('#outlineTopicInput').fill('  hệ thống quản lý thư viện số  ');
    await page.getByRole('button', { name: 'Gửi yêu cầu' }).click();

    await expect(
      page.getByRole('alert').filter({ hasText: 'Tên đề tài mới phải khác với tên hiện tại!' }),
    ).toBeVisible();
    expect(changeCalled).toBe(false);

    const rows = await dbSelect<{ status: string }>(
      `SELECT h.status
         FROM topic_title_history h
         JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('APPROVED');
  });

  test(ITC031.title, { annotation: ITC031.annotation }, async ({ page, context, request }) => {
    const officialTitle = 'Hệ thống quản lý thư viện số';
    const h = await provisionAssignedStudent(request, {
      profile: TEST_STUDENT_1,
      initialRequest: { newName: officialTitle, reviewDecision: 'APPROVED' },
    });

    await openStudentOutlinePage(page, context, h.studentToken);

    let changeCalled = false;
    page.on('request', (req) => {
      if (req.url().endsWith('/topic/change-title') && req.method() === 'POST') {
        changeCalled = true;
      }
    });

    // 1. Trắng
    await page.locator('#outlineTopicInput').fill('   ');
    await page.getByRole('button', { name: 'Gửi yêu cầu' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Vui lòng nhập tên đề tài!' })).toBeVisible();

    // 2. Vượt quá 500 ký tự
    await page.locator('#outlineTopicInput').fill('B'.repeat(501));
    await page.getByRole('button', { name: 'Gửi yêu cầu' }).click();
    await expect(
      page.getByRole('alert').filter({ hasText: 'Tên đề tài không được vượt quá 500 ký tự!' }),
    ).toBeVisible();

    expect(changeCalled).toBe(false);

    const rows = await dbSelect<{ status: string }>(
      `SELECT h.status
         FROM topic_title_history h
         JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('APPROVED');
  });

  test(ITC032.title, { annotation: ITC032.annotation }, async ({ page, context, request }) => {
    const officialTitle = 'Hệ thống quản lý thư viện số';
    const rejectedChangeTitle = 'Tên đổi lần 1 bị từ chối';
    const newChangeTitle = 'Hệ thống quản lý thư viện số đa nền tảng';

    const h = await provisionAssignedStudent(request, {
      profile: TEST_STUDENT_1,
      initialRequest: { newName: officialTitle, reviewDecision: 'APPROVED' },
      changeRequest: { newName: rejectedChangeTitle, reviewDecision: 'REJECTED' },
    });

    await openStudentOutlinePage(page, context, h.studentToken);
    const rejectionBanner = page.getByText(
      `Yêu cầu tên đề tài "${rejectedChangeTitle}" đã bị GVHD từ chối. Vui lòng chỉnh sửa và gửi lại.`,
    );
    await expect(rejectionBanner).toBeVisible();

    const input = page.locator('#outlineTopicInput');
    await input.fill(newChangeTitle);

    const changePromise = page.waitForResponse(
      (r) => r.url().endsWith('/topic/change-title') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Gửi yêu cầu' }).click();
    const changeRes = await changePromise;

    expect(changeRes.status()).toBe(200);
    const body = await changeRes.json();
    expect(body.code).toBe(1000);
    expect(body.message).toBe('Gửi yêu cầu đổi tên đề tài thành công');

    await expect(page.getByText('Gửi yêu cầu đổi tên đề tài thành công!')).toBeVisible();
    await expect(rejectionBanner).toBeHidden();
    await expect(page.getByText('Đang chờ GVHD duyệt tên đề tài')).toBeVisible();
    await expect(input).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Gửi yêu cầu' })).toBeDisabled();

    const rows = await dbSelect<{ old_name: string | null; new_name: string; status: string }>(
      `SELECT h.old_name, h.new_name, h.status
         FROM topic_title_history h
         JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?
        ORDER BY h.requested_at DESC, h.id DESC`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(rows).toHaveLength(3);
    expect(rows[0].status).toBe('PENDING');
    expect(rows[0].old_name).toBe(officialTitle);
    expect(rows[0].new_name).toBe(newChangeTitle);
    expect(rows[1].status).toBe('REJECTED');
    expect(rows[2].status).toBe('APPROVED');
  });

  test(ITC033.title, { annotation: ITC033.annotation }, async ({ page, context, request }) => {
    const officialTitle = 'Hệ thống quản lý thư viện số';
    const h = await provisionAssignedStudent(request, {
      profile: TEST_STUDENT_1,
      initialRequest: { newName: officialTitle, reviewDecision: 'APPROVED' },
    });

    await openStudentOutlinePage(page, context, h.studentToken);
    await page.locator('#outlineTopicInput').fill('Tên đề tài đổi bị trùng phiên');

    const concurrentRes = await apiCall(request, h.studentToken, 'POST', '/topic/change-title', {
      data: { newName: 'Tên đề tài đổi gửi trước từ phiên khác' },
    });
    expect(concurrentRes.status).toBe(200);

    const changePromise = page.waitForResponse(
      (r) => r.url().endsWith('/topic/change-title') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Gửi yêu cầu' }).click();
    const changeRes = await changePromise;

    expect(changeRes.status()).toBe(409);
    const body = await changeRes.json();
    expect(body.code).toBe(3051);
    expect(body.message).toBe('Đề tài đang có yêu cầu đổi tên chờ giảng viên hướng dẫn xác nhận');

    await expect(
      page.getByText('Đề tài đang có yêu cầu đổi tên chờ giảng viên hướng dẫn xác nhận'),
    ).toBeVisible();

    const pendingRows = await dbSelect<{ new_name: string }>(
      `SELECT h.new_name
         FROM topic_title_history h
         JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ? AND h.status = 'PENDING'`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(pendingRows).toHaveLength(1);
    expect(pendingRows[0].new_name).toBe('Tên đề tài đổi gửi trước từ phiên khác');
  });

  test(ITC034.title, { annotation: ITC034.annotation }, async ({ page, context, request }) => {
    const officialTitle = 'Hệ thống quản lý thư viện số';
    const h = await provisionAssignedStudent(request, {
      profile: TEST_STUDENT_1,
      initialRequest: { newName: officialTitle, reviewDecision: 'APPROVED' },
    });

    await openStudentOutlinePage(page, context, h.studentToken);
    await page.locator('#outlineTopicInput').fill('Tên đề tài đổi trong thời gian gia hạn chấm');

    // Chuyển hạn sang EXTENDED (chỉ GVHD được chấm, SV bị khóa) ngay trước khi bấm gửi
    await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'EXTENDED');

    const changePromise = page.waitForResponse(
      (r) => r.url().endsWith('/topic/change-title') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Gửi yêu cầu' }).click();
    const changeRes = await changePromise;

    expect(changeRes.status()).toBe(403);
    const body = await changeRes.json();
    expect(body.code).toBe(3054);
    expect(body.message).toBe('Thời hạn nộp đề cương và cập nhật tên đề tài chưa mở hoặc đã kết thúc');

    await expect(
      page.getByText('Thời hạn nộp đề cương và cập nhật tên đề tài chưa mở hoặc đã kết thúc'),
    ).toBeVisible();

    const rows = await dbSelect<{ status: string; topic_name: string | null }>(
      `SELECT h.status, tt.name AS topic_name
         FROM topic_title_history h
         JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('APPROVED');
    expect(rows[0].topic_name).toBe(officialTitle);
  });

  // ==========================================================================
  // SECURITY TEST CASES (TC-SEC-016 .. TC-SEC-019)
  // ==========================================================================

  test(SEC016.title, { annotation: SEC016.annotation }, async ({ page, context, request }) => {
    await context.clearCookies();

    const myInfoPromise = page.waitForResponse(
      (r) => r.url().endsWith('/my-info') && r.request().method() === 'GET',
    );
    await page.goto('/student/outline');
    const myInfoRes = await myInfoPromise;
    expect(myInfoRes.status()).toBe(401);
    expect((await myInfoRes.json()).code).toBe(2000);

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('#outlineTopicInput')).toHaveCount(0);

    const apiBase = getApiBaseUrl();
    const getRes = await request.get(`${apiBase}/topic/my-title-history`);
    expect(getRes.status()).toBe(401);
    expect((await getRes.json()).code).toBe(2000);

    const confirmRes = await request.post(`${apiBase}/topic/confirm-title`, {
      data: { newName: 'Truy cập trái phép không token' },
    });
    expect(confirmRes.status()).toBe(401);
    expect((await confirmRes.json()).code).toBe(2000);

    const changeRes = await request.post(`${apiBase}/topic/change-title`, {
      data: { newName: 'Đổi tên trái phép không token' },
    });
    expect(changeRes.status()).toBe(401);
    expect((await changeRes.json()).code).toBe(2000);
  });

  test(SEC017.title, { annotation: SEC017.annotation }, async ({ page, context, request }) => {
    await setAuthCookie(context, envState.mainSupervisorToken);
    await page.goto('/student/outline');

    await expect(
      page.getByText('Tài khoản của bạn không có quyền truy cập cổng sinh viên.'),
    ).toBeVisible();
    await expect(page.locator('#outlineTopicInput')).toHaveCount(0);

    const getRes = await apiCall(request, envState.mainSupervisorToken, 'GET', '/topic/my-title-history');
    expect(getRes.status).toBe(403);
    expect(getRes.body.code).toBe(2001);
    expect(getRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');

    const confirmRes = await apiCall(request, envState.mainSupervisorToken, 'POST', '/topic/confirm-title', {
      data: { newName: 'GVHD gọi API sinh viên' },
    });
    expect(confirmRes.status).toBe(403);
    expect(confirmRes.body.code).toBe(2001);
    expect(confirmRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');

    const changeRes = await apiCall(request, envState.mainSupervisorToken, 'POST', '/topic/change-title', {
      data: { newName: 'GVHD gọi API đổi tên sinh viên' },
    });
    expect(changeRes.status).toBe(403);
    expect(changeRes.body.code).toBe(2001);
    expect(changeRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');
  });

  test(SEC018.title, { annotation: SEC018.annotation }, async ({ page, context, request }) => {
    await setAuthCookie(context, envState.hodToken);
    await page.goto('/student/outline');

    await expect(
      page.getByText('Tài khoản của bạn không có quyền truy cập cổng sinh viên.'),
    ).toBeVisible();
    await expect(page.locator('#outlineTopicInput')).toHaveCount(0);

    const getRes = await apiCall(request, envState.hodToken, 'GET', '/topic/my-title-history');
    expect(getRes.status).toBe(403);
    expect(getRes.body.code).toBe(2001);
    expect(getRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');

    const confirmRes = await apiCall(request, envState.hodToken, 'POST', '/topic/confirm-title', {
      data: { newName: 'TBM gọi API sinh viên' },
    });
    expect(confirmRes.status).toBe(403);
    expect(confirmRes.body.code).toBe(2001);
    expect(confirmRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');

    const changeRes = await apiCall(request, envState.hodToken, 'POST', '/topic/change-title', {
      data: { newName: 'TBM gọi API đổi tên sinh viên' },
    });
    expect(changeRes.status).toBe(403);
    expect(changeRes.body.code).toBe(2001);
    expect(changeRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');
  });

  test(SEC019.title, { annotation: SEC019.annotation }, async ({ page, context, request }) => {
    const h = await provisionAssignedStudent(request, {
      profile: TEST_STUDENT_1,
    });

    // Tạo token riêng và đăng xuất để đưa vào blacklist
    const loggedOutToken = await loginByEmail(request, TEST_STUDENT_1.email);
    const logoutRes = await apiCall(request, loggedOutToken, 'POST', '/log-out');
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.code).toBe(1000);

    await setAuthCookie(context, loggedOutToken);
    const myInfoPromise = page.waitForResponse(
      (r) => r.url().endsWith('/my-info') && r.request().method() === 'GET',
    );
    await page.goto('/student/outline');
    const myInfoRes = await myInfoPromise;
    expect(myInfoRes.status()).toBe(401);
    expect((await myInfoRes.json()).code).toBe(2000);

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('#outlineTopicInput')).toHaveCount(0);

    const getRes = await apiCall(request, loggedOutToken, 'GET', '/topic/my-title-history');
    expect(getRes.status).toBe(401);
    expect(getRes.body.code).toBe(2000);

    const confirmRes = await apiCall(request, loggedOutToken, 'POST', '/topic/confirm-title', {
      data: { newName: 'Gửi chốt tên bằng token đã đăng xuất' },
    });
    expect(confirmRes.status).toBe(401);
    expect(confirmRes.body.code).toBe(2000);

    const changeRes = await apiCall(request, loggedOutToken, 'POST', '/topic/change-title', {
      data: { newName: 'Gửi đổi tên bằng token đã đăng xuất' },
    });
    expect(changeRes.status).toBe(401);
    expect(changeRes.body.code).toBe(2000);

    const rows = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM topic_title_history h
         JOIN thesis_topic tt ON tt.id = h.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(Number(rows[0].total)).toBe(0);
  });
});
