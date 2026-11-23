import { test, expect, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';
import { defineItc, defineItcSec } from '../../../support/integration-test-case';
import { apiCall, getApiBaseUrl, loginByEmail } from '../../../support/api';
import { dbSelect } from '../../../support/db';

// ============================================================================
// ĐẶC TẢ TEST CASE (ITC035..ITC051 & TC-SEC-020..TC-SEC-024)
// Feature: outline | Module/Sheet: NopDeCuong
// Role: Sinh viên (STUDENT)
// ============================================================================

const ITC035 = defineItc({
  id: 'ITC035',
  feature: 'outline',
  module: 'NopDeCuong',
  sheet: 'NopDeCuong',
  fn: 'View Outline Overview and Submission History',
  description:
    'Verify that a student with a confirmed thesis title and an assigned commenting lecturer can view the outline overview and enabled submission buttons when the deadline is open',
  procedure:
    '1. Log in as a Student ("Lê Thị Hương").\n' +
    '2. Open the "Nộp đề cương" screen ("/student/outline").',
  expected:
    '1. The API GET /outline/my-outline returns HTTP 200 with code = 1000, currentStage = "STAGE_2_TOPIC_CONFIRMED", status = null, lecturerName = "Nguyễn Văn Hùng", reviewerName = "Hoàng Thị Thu", deadlineStatus = "OPEN", and an empty histories list.\n' +
    '2. The database confirms student "9990000501" has a thesis outline assigned to commenting lecturer "GV999502" with status = NULL and 0 outline history records.\n' +
    '3. The UI displays supervisor "Nguyễn Văn Hùng", commenting lecturer "Hoàng Thị Thu", open deadline "(Đang mở)", empty history message "Chưa có lần nộp đề cương nào trong học kỳ này.", and enabled "TẢI TỆP LÊN" and "SOẠN TRỰC TUYẾN" buttons.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Lê Thị Hương" ("9990000501") has confirmed official title "Hệ thống quản lý thực tập doanh nghiệp" at STAGE_2_TOPIC_CONFIRMED, main supervisor "Nguyễn Văn Hùng" ("GV999501"), assigned commenting lecturer "Hoàng Thị Thu" ("GV999502"), and has not submitted any outline file yet.',
});

const ITC036 = defineItc({
  id: 'ITC036',
  feature: 'outline',
  module: 'NopDeCuong',
  sheet: 'NopDeCuong',
  fn: 'View Outline Overview and Submission History',
  description:
    'Verify that the outline upload and online editor buttons are disabled when the student has not been assigned a supervisor yet',
  procedure:
    '1. Log in as a Student ("Đỗ Gia Huy") who has not been assigned a supervisor yet.\n' +
    '2. Open the "Nộp đề cương" screen ("/student/outline").',
  expected:
    '1. The API GET /outline/my-outline returns HTTP 200 with code = 1000, currentStage = "STAGE_1_REGISTERING_ADVISOR", lecturerName = null, status = null, and an empty histories list.\n' +
    '2. The database confirms student "9990000502"\'s thesis topic is at STAGE_1_REGISTERING_ADVISOR with no assigned supervisor and 0 thesis outline records.\n' +
    '3. The UI displays supervisor "Chưa phân công", disables both the "TẢI TỆP LÊN" and "SOẠN TRỰC TUYẾN" buttons, and displays "Chưa có lần nộp đề cương nào trong học kỳ này.".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Đỗ Gia Huy" ("9990000502") is at STAGE_1_REGISTERING_ADVISOR with no assigned supervisor and no thesis outline record.',
});

const ITC037 = defineItc({
  id: 'ITC037',
  feature: 'outline',
  module: 'NopDeCuong',
  sheet: 'NopDeCuong',
  fn: 'View Outline Overview and Submission History',
  description:
    'Verify that a student whose outline requires changes can view both reviewer and supervisor feedback and keep submission buttons enabled',
  procedure:
    '1. Log in as a Student ("Lê Thị Hương") whose submitted outline was reviewed as REQUEST_CHANGES with reviewer and supervisor feedback.\n' +
    '2. Open the "Nộp đề cương" screen ("/student/outline").',
  expected:
    '1. The API GET /outline/my-outline returns HTTP 200 with code = 1000, status = "REQUEST_CHANGES", reviewFeedback = "Cần bổ sung sơ đồ kiến trúc hệ thống", advisorFeedback = "Em nên làm rõ phần phạm vi đề tài", and 1 history record in REQUEST_CHANGES status.\n' +
    '2. The database confirms student "9990000501"\'s outline and its history record store REQUEST_CHANGES status with both reviewer and supervisor feedback.\n' +
    '3. The UI displays the reviewer feedback card, the supervisor feedback card, 1 history row with badge "Yêu cầu chỉnh sửa", and keeps both "TẢI TỆP LÊN" and "SOẠN TRỰC TUYẾN" buttons enabled.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Lê Thị Hương" ("9990000501") submitted an outline that commenting lecturer "GV999502" reviewed as REQUEST_CHANGES ("Cần bổ sung sơ đồ kiến trúc hệ thống") and supervisor "GV999501" commented on ("Em nên làm rõ phần phạm vi đề tài").',
});

const ITC038 = defineItc({
  id: 'ITC038',
  feature: 'outline',
  module: 'NopDeCuong',
  sheet: 'NopDeCuong',
  fn: 'View Outline Overview and Submission History',
  description:
    'Verify that a student whose outline has been approved sees the approved status and cannot resubmit',
  procedure:
    '1. Log in as a Student ("Lê Thị Hương") whose outline has been approved.\n' +
    '2. Open the "Nộp đề cương" screen ("/student/outline").',
  expected:
    '1. The API GET /outline/my-outline returns HTTP 200 with code = 1000, status = "APPROVED", currentStage = "STAGE_3_OUTLINE_APPROVED", and reviewFeedback = "Đề cương đạt yêu cầu, triển khai đúng kế hoạch".\n' +
    '2. The database confirms student "9990000501"\'s outline status is APPROVED and the thesis topic has advanced to STAGE_3_OUTLINE_APPROVED.\n' +
    '3. The UI displays lock notice "Đề cương đã được phê duyệt, không thể nộp lại.", shows history badge "Đã duyệt", and disables both "TẢI TỆP LÊN" and "SOẠN TRỰC TUYẾN" buttons.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Lê Thị Hương" ("9990000501") submitted an outline and commenting lecturer "GV999502" approved it with feedback "Đề cương đạt yêu cầu, triển khai đúng kế hoạch".',
});

const ITC039 = defineItc({
  id: 'ITC039',
  feature: 'outline',
  module: 'NopDeCuong',
  sheet: 'NopDeCuong',
  fn: 'View Outline Overview and Submission History',
  description:
    'Verify that a student whose outline was rejected and thesis disqualified sees the disqualification banner and disabled submission buttons',
  procedure:
    '1. Log in as a Student ("Lê Thị Hương") whose outline was rejected during the extended grading period.\n' +
    '2. Open the "Nộp đề cương" screen ("/student/outline").',
  expected:
    '1. The API GET /outline/my-outline returns HTTP 200 with code = 1000, status = "REJECTED", topicStatus = "DISQUALIFIED", and disqualificationReason = "Không hoàn thành phê duyệt đề cương đúng hạn".\n' +
    '2. The database confirms student "9990000501"\'s outline status is REJECTED and thesis topic status is DISQUALIFIED.\n' +
    '3. The UI displays the disqualification alert "Đề tài đã bị đình chỉ (DISQUALIFIED)", shows history badge "Không đạt", and disables both "TẢI TỆP LÊN" and "SOẠN TRỰC TUYẾN" buttons.',
  precondition:
    '1. Student "Lê Thị Hương" ("9990000501") submitted an outline while the deadline was open, and commenting lecturer "GV999502" rejected it during the EXTENDED grading period.',
});

const ITC040 = defineItc({
  id: 'ITC040',
  feature: 'outline',
  module: 'NopDeCuong',
  sheet: 'NopDeCuong',
  fn: 'View Outline Overview and Submission History',
  description:
    'Verify that the outline submission buttons are disabled when the outline submission deadline is closed, not started, or in extended grading period',
  procedure:
    '1. Log in as a Student ("Lê Thị Hương") and open the "Nộp đề cương" screen while the deadline is CLOSED.\n' +
    '2. Update the deadline to NOT_STARTED and reload the "Nộp đề cương" screen.\n' +
    '3. Update the deadline to EXTENDED and reload the "Nộp đề cương" screen.',
  expected:
    '1. When CLOSED, GET /outline/my-outline returns HTTP 200 with code = 1000 and deadlineStatus = "CLOSED"; the UI displays "Đã hết hạn" and disables both "TẢI TỆP LÊN" and "SOẠN TRỰC TUYẾN".\n' +
    '2. When NOT_STARTED, GET /outline/my-outline returns HTTP 200 with code = 1000 and deadlineStatus = "NOT_STARTED"; the UI displays "Chưa mở" and disables both buttons.\n' +
    '3. When EXTENDED, GET /outline/my-outline returns HTTP 200 with code = 1000 and deadlineStatus = "EXTENDED"; the UI displays "Đã hết hạn nộp — Đang trong thời gian gia hạn chấm của giảng viên" and disables both buttons.',
  precondition:
    '1. Student "Lê Thị Hương" ("9990000501") is at STAGE_2_TOPIC_CONFIRMED with an assigned commenting lecturer.\n' +
    '2. The "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline is configured sequentially as CLOSED, NOT_STARTED, and EXTENDED.',
});

const ITC041 = defineItc({
  id: 'ITC041',
  feature: 'outline',
  module: 'NopDeCuong',
  sheet: 'NopDeCuong',
  fn: 'Submit Outline via File Upload',
  description:
    'Verify that a student can successfully upload a valid PDF outline file for the first time',
  procedure:
    '1. Log in as a Student ("Lê Thị Hương") and open the "Nộp đề cương" screen.\n' +
    '2. Click "TẢI TỆP LÊN", select the valid PDF file "64HTTT99_9990000501_LeThiHuong.pdf", and click "Nộp đề cương".',
  expected:
    '1. The API POST /outline/submit returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Nộp đề cương thành công".\n' +
    '3. The database updates student "9990000501"\'s thesis outline to PENDING with a non-empty file URL, title inherited as "Hệ thống quản lý thực tập doanh nghiệp", creates 1 PENDING outline history record, and stores a notification for commenting lecturer "GV999502".\n' +
    '4. The UI shows toast "Nộp đề cương thành công!", closes the "Tải lên tệp đề cương" modal, and displays 1 row in "Lịch sử nộp đề cương" with file name containing "64HTTT99_9990000501_LeThiHuong.pdf" and status "Đã nộp, chờ nhận xét".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Lê Thị Hương" ("9990000501") is at STAGE_2_TOPIC_CONFIRMED with official title "Hệ thống quản lý thực tập doanh nghiệp", assigned commenting lecturer "GV999502", and has not submitted any outline file yet.',
});

const ITC042 = defineItc({
  id: 'ITC042',
  feature: 'outline',
  module: 'NopDeCuong',
  sheet: 'NopDeCuong',
  fn: 'Submit Outline via File Upload',
  description:
    'Verify that re-uploading a valid DOCX outline file while the current submission is still PENDING updates the existing pending history record in place',
  procedure:
    '1. Log in as a Student ("Lê Thị Hương") who already has a PENDING PDF outline submission, and open the "Nộp đề cương" screen.\n' +
    '2. Click "TẢI TỆP LÊN", select the valid DOCX file "64HTTT99_9990000501_LeThiHuong.docx", and click "Nộp đề cương".',
  expected:
    '1. The API POST /outline/submit returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Nộp đề cương thành công".\n' +
    '3. The database keeps student "9990000501"\'s thesis outline in PENDING status with the updated DOCX file URL and retains exactly 1 PENDING history record (updated in place without creating a duplicate row).\n' +
    '4. The UI shows toast "Nộp đề cương thành công!" and updates the single row in "Lịch sử nộp đề cương" to display "64HTTT99_9990000501_LeThiHuong.docx" with status "Đã nộp, chờ nhận xét".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Lê Thị Hương" ("9990000501") has 1 PENDING outline submission ("64HTTT99_9990000501_LeThiHuong.pdf") awaiting review by "GV999502".',
});

const ITC043 = defineItc({
  id: 'ITC043',
  feature: 'outline',
  module: 'NopDeCuong',
  sheet: 'NopDeCuong',
  fn: 'Submit Outline via File Upload',
  description:
    'Verify that a student can resubmit a revised PDF outline after REQUEST_CHANGES, creating a second history record and clearing current outline feedback',
  procedure:
    '1. Log in as a Student ("Lê Thị Hương") whose outline is in REQUEST_CHANGES status with reviewer and supervisor feedback, and open the "Nộp đề cương" screen.\n' +
    '2. Click "TẢI TỆP LÊN", select the revised file "64HTTT99_9990000501_LeThiHuong.pdf", and click "Nộp đề cương".',
  expected:
    '1. The API POST /outline/submit returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Nộp đề cương thành công".\n' +
    '3. The database transitions the main thesis outline back to PENDING with review_feedback = NULL, advisor_feedback = NULL, and reviewed_at = NULL, while thesis_outline_history stores 2 records (the newest PENDING and the previous REQUEST_CHANGES preserving both feedbacks).\n' +
    '4. The UI shows toast "Nộp đề cương thành công!", hides the current feedback summary banner, and displays 2 rows in "Lịch sử nộp đề cương" with the newest row in status "Đã nộp, chờ nhận xét" and the older row in status "Yêu cầu chỉnh sửa".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Lê Thị Hương" ("9990000501") has 1 outline submission reviewed as REQUEST_CHANGES by "GV999502" and commented on by supervisor "GV999501".',
});

const ITC044 = defineItc({
  id: 'ITC044',
  feature: 'outline',
  module: 'NopDeCuong',
  sheet: 'NopDeCuong',
  fn: 'Submit Outline via File Upload',
  description:
    'Verify that selecting an unsupported file format (.txt) is blocked by validation and does not create an outline submission',
  procedure:
    '1. Log in as a Student ("Lê Thị Hương") and open the "Nộp đề cương" screen.\n' +
    '2. Click "TẢI TỆP LÊN" and select the invalid file "64HTTT99_9990000501_LeThiHuong.txt".',
  expected:
    '1. No request is sent to POST /outline/submit.\n' +
    '2. The modal displays validation error "File đề cương chỉ hỗ trợ định dạng .doc, .docx hoặc .pdf." and keeps the "Nộp đề cương" button disabled.\n' +
    '3. The database contains 0 outline history records for student "9990000501".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Lê Thị Hương" ("9990000501") is at STAGE_2_TOPIC_CONFIRMED with an assigned commenting lecturer and no outline submissions.',
});

const ITC045 = defineItc({
  id: 'ITC045',
  feature: 'outline',
  module: 'NopDeCuong',
  sheet: 'NopDeCuong',
  fn: 'Submit Outline via File Upload',
  description:
    'Verify that selecting a PDF file whose name violates the Tenlop_MaSV_HoVaTen convention is blocked by validation',
  procedure:
    '1. Log in as a Student ("Lê Thị Hương") and open the "Nộp đề cương" screen.\n' +
    '2. Click "TẢI TỆP LÊN" and select the improperly named file "DeCuongTotNghiep.pdf".',
  expected:
    '1. No request is sent to POST /outline/submit.\n' +
    '2. The modal displays validation error "Tên file không đúng định dạng! Vui lòng đổi tên file theo định dạng Tenlop_MaSV_HoVaTen (VD: DHKTPM17A_22110001_NguyenVanAn.pdf)" and keeps the "Nộp đề cương" button disabled.\n' +
    '3. The database contains 0 outline history records for student "9990000501".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Lê Thị Hương" ("9990000501") is at STAGE_2_TOPIC_CONFIRMED with an assigned commenting lecturer and no outline submissions.',
});

const ITC046 = defineItc({
  id: 'ITC046',
  feature: 'outline',
  module: 'NopDeCuong',
  sheet: 'NopDeCuong',
  fn: 'Submit Outline via File Upload',
  description:
    'Verify that selecting an empty (0-byte) file or a file of 10 MB or larger is blocked by validation',
  procedure:
    '1. Log in as a Student ("Lê Thị Hương") and open the "Nộp đề cương" screen.\n' +
    '2. Click "TẢI TỆP LÊN" and select a 0-byte file "64HTTT99_9990000501_LeThiHuong.pdf".\n' +
    '3. Select a 10 MB file "64HTTT99_9990000501_LeThiHuong.pdf".',
  expected:
    '1. No request is sent to POST /outline/submit in either attempt.\n' +
    '2. The modal displays "Vui lòng chọn file đề cương cần tải lên." for the 0-byte file and "Dung lượng file đề cương phải nhỏ hơn 10 MB." for the 10 MB file, keeping "Nộp đề cương" disabled.\n' +
    '3. The database contains 0 outline history records for student "9990000501".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Lê Thị Hương" ("9990000501") is at STAGE_2_TOPIC_CONFIRMED with an assigned commenting lecturer and no outline submissions.',
});

const ITC047 = defineItc({
  id: 'ITC047',
  feature: 'outline',
  module: 'NopDeCuong',
  sheet: 'NopDeCuong',
  fn: 'Submit Outline via File Upload',
  description:
    'Verify that submitting an outline file is rejected when no commenting lecturer has been assigned to the thesis topic yet',
  procedure:
    '1. Log in as a Student ("Lê Thị Hương") who has a confirmed official title but no assigned commenting lecturer, and open the "Nộp đề cương" screen.\n' +
    '2. Click "TẢI TỆP LÊN", select "64HTTT99_9990000501_LeThiHuong.pdf", and click "Nộp đề cương".',
  expected:
    '1. The API POST /outline/submit returns HTTP 409 with code = 3079.\n' +
    '2. The response message is "Đề tài chưa được phân công giảng viên nhận xét đề cương".\n' +
    '3. The database contains 0 thesis outline records and 0 outline history records for student "9990000501".\n' +
    '4. The UI displays error toast "Đề tài chưa được phân công giảng viên nhận xét đề cương".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Lê Thị Hương" ("9990000501") is at STAGE_2_TOPIC_CONFIRMED with no commenting lecturer assigned.',
});

const ITC048 = defineItc({
  id: 'ITC048',
  feature: 'outline',
  module: 'NopDeCuong',
  sheet: 'NopDeCuong',
  fn: 'Submit Outline via File Upload',
  description:
    'Verify that submitting an outline file is blocked when the submission deadline closes concurrently before clicking submit',
  procedure:
    '1. Log in as a Student ("Lê Thị Hương"), open the "Nộp đề cương" screen while the deadline is open, click "TẢI TỆP LÊN", and select "64HTTT99_9990000501_LeThiHuong.pdf".\n' +
    '2. The "SV_CHINH_SUA_NOP_LAI_DE_CUONG" deadline transitions to COMPLETED before clicking submit.\n' +
    '3. Click "Nộp đề cương".',
  expected:
    '1. The API POST /outline/submit returns HTTP 403 with code = 3085.\n' +
    '2. The response message is "Thời hạn sinh viên nộp đề cương chưa mở hoặc đã kết thúc".\n' +
    '3. The database keeps the thesis outline status as NULL and contains 0 outline history records for student "9990000501".\n' +
    '4. The UI displays error toast "Thời hạn sinh viên nộp đề cương chưa mở hoặc đã kết thúc".',
  precondition:
    '1. Student "Lê Thị Hương" ("9990000501") opens the file upload modal while the deadline is OPEN, and the deadline transitions to COMPLETED before submission.',
});

const ITC049 = defineItc({
  id: 'ITC049',
  feature: 'outline',
  module: 'NopDeCuong',
  sheet: 'NopDeCuong',
  fn: 'Submit Outline via File Upload',
  description:
    'Verify that submitting an outline file is blocked when the outline is approved concurrently before clicking submit',
  procedure:
    '1. Log in as a Student ("Lê Thị Hương") with a PENDING outline, open the "Nộp đề cương" screen, click "TẢI TỆP LÊN", and select "64HTTT99_9990000501_LeThiHuong.docx".\n' +
    '2. Concurrently, commenting lecturer "GV999502" approves the pending outline.\n' +
    '3. Click "Nộp đề cương".',
  expected:
    '1. The API POST /outline/submit returns HTTP 409 with code = 3081.\n' +
    '2. The response message is "Đề cương đã được phê duyệt hoặc đã có kết quả cuối cùng, không thể nộp lại".\n' +
    '3. The database preserves the APPROVED outline status and retains only the 1 APPROVED history record.\n' +
    '4. The UI displays error toast "Đề cương đã được phê duyệt hoặc đã có kết quả cuối cùng, không thể nộp lại".',
  precondition:
    '1. Student "Lê Thị Hương" ("9990000501") has 1 PENDING outline submission and opens the upload modal before commenting lecturer "GV999502" approves it.',
});

const ITC050 = defineItc({
  id: 'ITC050',
  feature: 'outline',
  module: 'NopDeCuong',
  sheet: 'NopDeCuong',
  fn: 'Compose and Submit Outline Online',
  description:
    'Verify that a student can compose an outline in the online editor and submit the auto-generated DOCX file successfully',
  procedure:
    '1. Log in as a Student ("Lê Thị Hương") and open the "Nộp đề cương" screen.\n' +
    '2. Click "SOẠN TRỰC TUYẾN", enter the Vietnamese title "Hệ thống quản lý thực tập doanh nghiệp phiên bản trực tuyến", fill all 4 required content sections and 1 implementation plan row, and click "Nộp đề cương".',
  expected:
    '1. The API POST /outline/submit returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Nộp đề cương thành công".\n' +
    '3. The database updates student "9990000501"\'s thesis outline to PENDING with title "Hệ thống quản lý thực tập doanh nghiệp phiên bản trực tuyến" and a DOCX file URL, creates 1 PENDING history record with submission_note = "Soạn và nộp từ hệ thống trực tuyến", and stores a notification for commenting lecturer "GV999502".\n' +
    '4. The UI shows toast "Nộp đề cương thành công!", closes the "Soạn đề cương trực tuyến" modal, and displays 1 row in "Lịch sử nộp đề cương" with file name containing "Lop_9990000501_LeThiHuong.docx", note "Ghi chú: Soạn và nộp từ hệ thống trực tuyến", and status "Đã nộp, chờ nhận xét".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Lê Thị Hương" ("9990000501") is at STAGE_2_TOPIC_CONFIRMED with assigned commenting lecturer "GV999502" and no outline submissions yet.',
});

const ITC051 = defineItc({
  id: 'ITC051',
  feature: 'outline',
  module: 'NopDeCuong',
  sheet: 'NopDeCuong',
  fn: 'Compose and Submit Outline Online',
  description:
    'Verify that submitting the online outline editor with missing required fields or a title exceeding 500 characters is blocked by validation',
  procedure:
    '1. Log in as a Student ("Lê Thị Hương"), open the "Nộp đề cương" screen, and click "SOẠN TRỰC TUYẾN".\n' +
    '2. Enter a 501-character Vietnamese title, leave required content sections and implementation plan task empty, and click "Nộp đề cương".',
  expected:
    '1. No request is sent to POST /outline/submit.\n' +
    '2. The modal displays footer warning "Còn thông tin bắt buộc chưa điền, vui lòng kiểm tra các mục báo đỏ.", title error "Tiêu đề đề cương không được vượt quá 500 ký tự.", section error "Vui lòng nhập nội dung mục này.", and plan error "Cần ít nhất một công việc trong kế hoạch thực hiện.".\n' +
    '3. The database contains 0 outline history records for student "9990000501".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Hạn sinh viên chỉnh sửa & nộp lại đề cương" deadline.\n' +
    '2. Student "Lê Thị Hương" ("9990000501") is at STAGE_2_TOPIC_CONFIRMED with an assigned commenting lecturer and no outline submissions.',
});

// ============================================================================
// SECURITY TEST CASES (TC-SEC-020 .. TC-SEC-024)
// ============================================================================

const SEC020 = defineItcSec({
  id: 'TC-SEC-020',
  feature: 'outline',
  module: 'NopDeCuong',
  sheet: 'NopDeCuong',
  scenario: 'An unauthenticated user opens the Student outline screen directly and calls student outline APIs',
  roleSession: 'Unauthenticated (Anonymous)',
  technique: 'EP',
  given: 'The browser has no active login session (no access_token cookie)',
  when: 'Open "/student/outline" directly on the Student portal and call GET /outline/my-outline and POST /outline/submit',
  then: 'GET /my-info, GET /outline/my-outline, and POST /outline/submit return HTTP 401 with code = 2000; the UI automatically redirects to "/login" and displays no outline data',
});

const SEC021 = defineItcSec({
  id: 'TC-SEC-021',
  feature: 'outline',
  module: 'NopDeCuong',
  sheet: 'NopDeCuong',
  scenario: 'A supervisor accesses the Student outline screen and calls POST /outline/submit',
  roleSession: 'Supervisor (SUPERVISOR), logged in',
  technique: 'EP',
  given: 'Logged in with a Supervisor account (without STUDENT role or SUBMIT_OUTLINE authority)',
  when: 'Open "/student/outline" directly on the Student portal and call POST /outline/submit with a valid PDF file',
  then: 'The UI blocks access with message "Tài khoản của bạn không có quyền truy cập cổng sinh viên."; POST /outline/submit returns HTTP 403 with code = 2001 and message "Bạn không có quyền truy cập (access denied)"',
});

const SEC022 = defineItcSec({
  id: 'TC-SEC-022',
  feature: 'outline',
  module: 'NopDeCuong',
  sheet: 'NopDeCuong',
  scenario: 'A Head of Major accesses the Student outline screen and calls POST /outline/submit',
  roleSession: 'Head of Major (HEAD_OF_MAJOR), logged in',
  technique: 'EP',
  given: 'Logged in with a Head of Major account (without STUDENT role or SUBMIT_OUTLINE authority)',
  when: 'Open "/student/outline" directly on the Student portal and call POST /outline/submit with a valid PDF file',
  then: 'The UI blocks access with message "Tài khoản của bạn không có quyền truy cập cổng sinh viên."; POST /outline/submit returns HTTP 403 with code = 2001 and message "Bạn không có quyền truy cập (access denied)"',
});

const SEC023 = defineItcSec({
  id: 'TC-SEC-023',
  feature: 'outline',
  module: 'NopDeCuong',
  sheet: 'NopDeCuong',
  scenario: 'A student session with a logged-out token accesses the outline screen and calls student outline APIs',
  roleSession: 'Student (STUDENT), logged-out token',
  technique: 'STATE_TRANSITION',
  given: 'The student has logged out via POST /log-out so the token is invalidated, while the browser still sends the old access_token cookie',
  when: 'Open "/student/outline" and call GET /outline/my-outline and POST /outline/submit with the logged-out token',
  then: 'GET /my-info, GET /outline/my-outline, and POST /outline/submit return HTTP 401 with code = 2000; the UI redirects to "/login", displays no outline data, and 0 outline history records are created in the database',
});

const SEC024 = defineItcSec({
  id: 'TC-SEC-024',
  feature: 'outline',
  module: 'NopDeCuong',
  sheet: 'NopDeCuong',
  scenario: 'A student attempts to view another student\'s outline detail by publicId (IDOR check)',
  roleSession: 'Student (STUDENT), logged in as non-owner',
  technique: 'EP',
  given: 'Student "Lê Thị Hương" ("9990000501") has an outline record with a valid publicId; another student "Đỗ Gia Huy" ("9990000502") is logged in',
  when: 'Student "Đỗ Gia Huy" opens "/student/outline" and calls GET /outline/{publicId} using student "9990000501"\'s outline publicId',
  then: 'Student "Đỗ Gia Huy"\'s own screen does not display student "9990000501"\'s outline data, and GET /outline/{publicId} returns HTTP 403 with code = 2001 and message "Bạn không có quyền truy cập thông tin đề cương này"',
});

// ============================================================================
// TẠO FILE MẪU HỢP LỆ (PDF / DOCX / TXT) KHÔNG CHỨA DỮ LIỆU THẬT
// ============================================================================

const VALID_PDF_FILENAME = '64HTTT99_9990000501_LeThiHuong.pdf';
const VALID_DOCX_FILENAME = '64HTTT99_9990000501_LeThiHuong.docx';
const INVALID_EXT_FILENAME = '64HTTT99_9990000501_LeThiHuong.txt';
const INVALID_NAME_FILENAME = 'DeCuongTotNghiep.pdf';
const OFFICIAL_TITLE_DEFAULT = 'Hệ thống quản lý thực tập doanh nghiệp';

function createMinimalValidPdfBuffer(text = 'TLU GPMS Test Outline'): Buffer {
  const safeText = text.replace(/[()\\]/g, '');
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

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createMinimalValidDocxBuffer(text = 'TLU GPMS Test Outline DOCX'): Buffer {
  const entries: Array<{ name: string; content: Buffer }> = [
    {
      name: '[Content_Types].xml',
      content: Buffer.from(
        '<?xml version="1.0" encoding="UTF-8"?>' +
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
          '<Default Extension="xml" ContentType="application/xml"/>' +
          '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
          '</Types>',
        'utf8',
      ),
    },
    {
      name: '_rels/.rels',
      content: Buffer.from(
        '<?xml version="1.0" encoding="UTF-8"?>' +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
          '</Relationships>',
        'utf8',
      ),
    },
    {
      name: 'word/document.xml',
      content: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8"?>` +
          `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
          `<w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body></w:document>`,
        'utf8',
      ),
    },
  ];

  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const data = entry.content;
    const crc = crc32(data);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuf, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + data.length;
  }

  const centralDir = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDir.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDir, eocd]);
}

// ============================================================================
// HẠ TẦNG DỮ LIỆU TEST (TẠO QUA API, ĐỐI CHIẾU DB SELECT, DỌN SẠCH SAU TEST)
// ============================================================================

const TEST_MAIN_SUPERVISOR = {
  teacherCode: 'GV999501',
  firstName: 'Nguyễn Văn',
  lastName: 'Hùng',
  fullName: 'Nguyễn Văn Hùng',
  email: 'itc.svoutline.gv.999501@tlu.edu.vn',
  phone: '0989950501',
  academicTitle: 'TS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_REVIEWER = {
  teacherCode: 'GV999502',
  firstName: 'Hoàng Thị',
  lastName: 'Thu',
  fullName: 'Hoàng Thị Thu',
  email: 'itc.svoutline.gv.999502@tlu.edu.vn',
  phone: '0989950502',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_ARCHIVE_SUPERVISOR = {
  teacherCode: 'GV999599',
  firstName: 'Trần Lưu',
  lastName: 'Trữ',
  fullName: 'Trần Lưu Trữ',
  email: 'itc.svoutline.gv.999599@tlu.edu.vn',
  phone: '0989950599',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_STUDENT_1 = {
  studentCode: '9990000501',
  firstName: 'Lê Thị',
  lastName: 'Hương',
  fullName: 'Lê Thị Hương',
  email: 'itc.svoutline.sv.9990000501@gmail.com',
  phone: '0989950101',
  batch: 'K64',
  className: '64HTTT99',
};

const TEST_STUDENT_2 = {
  studentCode: '9990000502',
  firstName: 'Đỗ Gia',
  lastName: 'Huy',
  fullName: 'Đỗ Gia Huy',
  email: 'itc.svoutline.sv.9990000502@gmail.com',
  phone: '0989950102',
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

interface ProvisionOutlineStudentSpec {
  profile: StudentProfile;
  confirmTitle?: string | null;
  assignReviewer?: boolean;
  initialSubmission?: {
    fileName?: string;
    mimeType?: string;
    buffer?: Buffer;
    submissionNote?: string;
    advisorFeedback?: string;
    reviewDecision?: 'APPROVED' | 'REQUEST_CHANGES' | 'REJECTED';
    reviewFeedback?: string;
  };
}

interface ProvisionedOutlineStudentHandle {
  profile: StudentProfile;
  studentPublicId: string;
  studentToken: string;
  topicId: number;
  topicPublicId: string;
  outlinePublicId: string | null;
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
  reviewerId: number;
  reviewerPublicId: string;
  reviewerAccountId: number;
  reviewerToken: string;
  archiveSupervisorId: number;
  archiveSupervisorPublicId: string;
  dlDangKy: DeadlineSnapshot;
  dlTbmChot: DeadlineSnapshot;
  dlDeCuong: DeadlineSnapshot;
}

let envState: TestEnvState;
let activeHandles: ProvisionedOutlineStudentHandle[] = [];
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
  token: string | null,
  file: { name: string; mimeType: string; buffer: Buffer },
  extra?: { submissionNote?: string; title?: string },
): Promise<{ status: number; body: any }> {
  const url = `${getApiBaseUrl()}/outline/submit`;
  const headers: Record<string, string> = {};
  if (token) {
    headers.Cookie = `access_token=${token}`;
  }
  const multipart: Record<string, any> = {
    file: {
      name: file.name,
      mimeType: file.mimeType,
      buffer: file.buffer,
    },
  };
  if (extra?.submissionNote !== undefined) {
    multipart.submissionNote = extra.submissionNote;
  }
  if (extra?.title !== undefined) {
    multipart.title = extra.title;
  }
  const res = await request.fetch(url, {
    method: 'POST',
    headers,
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
  maxStudents = 20,
): Promise<{ id: number; accountId: number; publicId: string; token: string }> {
  const existingRows = await dbSelect<{ id: number; account_id: number }>(
    'SELECT id, account_id FROM teacher WHERE teacher_code = ?',
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

  const tRows = await dbSelect<{ id: number; account_id: number }>(
    'SELECT id, account_id FROM teacher WHERE teacher_code = ?',
    [teacher.teacherCode],
  );
  if (tRows.length === 0) {
    throw new Error(`Không tìm thấy giảng viên ${teacher.teacherCode} trong DB`);
  }
  const teacherId = tRows[0].id;
  const accountId = tRows[0].account_id;

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
  return { id: teacherId, accountId, publicId: teacherPublicId, token };
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
    if (
      st.status === 'UNASSIGNED' ||
      st.supervisorPublicId === envState.mainSupervisorPublicId ||
      st.supervisorPublicId === envState.reviewerPublicId
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

  const delRes = await apiCall(request, envState.hodToken, 'DELETE', `/student/${matched.publicId}`);
  if (delRes.status === 200) return;

  const suffix = `${String(Date.now()).slice(-5)}${rotateCounter++}`;
  await apiCall(request, envState.hodToken, 'PUT', `/student/${matched.publicId}`, {
    data: {
      studentCode: `9997${suffix.slice(-6)}`,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: `itc.arch.svoutline.${suffix}@gmail.com`,
      phone: `0977${suffix.slice(-6)}`,
      batch: profile.batch,
      className: profile.className,
    },
  });
}

async function provisionOutlineStudent(
  request: APIRequestContext,
  spec: ProvisionOutlineStudentSpec,
): Promise<ProvisionedOutlineStudentHandle> {
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

  // Bước 1: Sinh viên gửi đơn ĐK GVHD -> GVHD duyệt -> TBM chốt khóa để lên STAGE_1_ADVISOR_ASSIGNED
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

  const handle: ProvisionedOutlineStudentHandle = {
    profile: spec.profile,
    studentPublicId: matched.publicId,
    studentToken,
    topicId: 0,
    topicPublicId: '',
    outlinePublicId: null,
  };
  activeHandles.push(handle);

  await setLockStatus(request, true);
  await setLockStatus(request, false);
  await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'OPEN');

  // Bước 2 (tùy chọn): Chốt tên đề tài và GVHD duyệt để lên STAGE_2_TOPIC_CONFIRMED
  if (spec.confirmTitle) {
    const confirmRes = await apiCall(request, studentToken, 'POST', '/topic/confirm-title', {
      data: { newName: spec.confirmTitle },
    });
    if (confirmRes.status !== 200) {
      throw new Error(`SV ${spec.profile.studentCode} không thể chốt tên đề tài: ${JSON.stringify(confirmRes.body)}`);
    }
    const ovRes = await apiCall(request, studentToken, 'GET', '/topic/my-title-history');
    handle.topicPublicId = ovRes.body?.data?.topicPublicId ?? '';
    const latestReqId = ovRes.body?.data?.histories?.[0]?.publicId;
    const approveTitleRes = await apiCall(
      request,
      envState.mainSupervisorToken,
      'PUT',
      `/topic/title-request/${latestReqId}/review`,
      { data: { decision: 'APPROVED' } },
    );
    if (approveTitleRes.status !== 200) {
      throw new Error(`GVHD không thể duyệt tên đề tài cho SV ${spec.profile.studentCode}: ${JSON.stringify(approveTitleRes.body)}`);
    }
  } else {
    const ovRes = await apiCall(request, studentToken, 'GET', '/topic/my-title-history');
    handle.topicPublicId = ovRes.body?.data?.topicPublicId ?? '';
  }

  const topicRows = await dbSelect<{ id: number }>(
    `SELECT tt.id
       FROM thesis_topic tt
       JOIN student s ON s.id = tt.student_id
      WHERE s.student_code = ? AND tt.semester_id = ?`,
    [spec.profile.studentCode, envState.semesterId],
  );
  if (topicRows.length === 0) {
    throw new Error(`Không tìm thấy thesis_topic cho SV ${spec.profile.studentCode}`);
  }
  handle.topicId = topicRows[0].id;

  // Bước 3 (tùy chọn): TBM phân công GV nhận xét (GV999502 != GV999501 theo BR-05)
  if (spec.assignReviewer) {
    const assignRes = await apiCall(
      request,
      envState.hodToken,
      'POST',
      '/api/v1/assignments/commenting-lecturers/manual',
      {
        data: {
          commentingLecturerId: envState.reviewerId,
          studentOrTopicIds: [handle.topicId],
        },
      },
    );
    if (assignRes.status !== 200) {
      throw new Error(`TBM không thể phân công GV nhận xét cho SV ${spec.profile.studentCode}: ${JSON.stringify(assignRes.body)}`);
    }
    // Đăng nhập lại để JWT của GV nhận xét cập nhật role COMMENTING_LECTURER
    envState.reviewerToken = await loginByEmail(request, TEST_REVIEWER.email);
  }

  // Bước 4 (tùy chọn): Nộp sẵn đề cương + góp ý GVHD + thẩm định GVNX
  if (spec.initialSubmission) {
    const fileName = spec.initialSubmission.fileName ?? VALID_PDF_FILENAME;
    const mimeType = spec.initialSubmission.mimeType ?? 'application/pdf';
    const buffer = spec.initialSubmission.buffer ?? createMinimalValidPdfBuffer('Initial submission');

    const subRes = await submitOutlineViaApi(
      request,
      studentToken,
      { name: fileName, mimeType, buffer },
      spec.initialSubmission.submissionNote ? { submissionNote: spec.initialSubmission.submissionNote } : undefined,
    );
    if (subRes.status !== 200) {
      throw new Error(`Không thể nộp sẵn đề cương cho SV ${spec.profile.studentCode}: ${JSON.stringify(subRes.body)}`);
    }

    const myOutlineRes = await apiCall(request, studentToken, 'GET', '/outline/my-outline');
    handle.outlinePublicId = myOutlineRes.body?.data?.publicId ?? null;

    if (spec.initialSubmission.advisorFeedback && handle.outlinePublicId) {
      const fbRes = await apiCall(
        request,
        envState.mainSupervisorToken,
        'PUT',
        `/outline/${handle.outlinePublicId}/advisor-feedback`,
        { data: { feedback: spec.initialSubmission.advisorFeedback } },
      );
      if (fbRes.status !== 200) {
        throw new Error(`Không thể gửi góp ý GVHD cho SV ${spec.profile.studentCode}: ${JSON.stringify(fbRes.body)}`);
      }
    }

    if (spec.initialSubmission.reviewDecision && handle.outlinePublicId) {
      if (spec.initialSubmission.reviewDecision === 'REJECTED') {
        await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'EXTENDED');
      }
      const revRes = await apiCall(
        request,
        envState.reviewerToken,
        'PUT',
        `/outline/${handle.outlinePublicId}/review`,
        {
          data: {
            decision: spec.initialSubmission.reviewDecision,
            feedback: spec.initialSubmission.reviewFeedback ?? 'Nhận xét kiểm thử tự động',
          },
        },
      );
      if (revRes.status !== 200) {
        throw new Error(`Không thể thẩm định đề cương (${spec.initialSubmission.reviewDecision}): ${JSON.stringify(revRes.body)}`);
      }
      if (spec.initialSubmission.reviewDecision === 'REJECTED') {
        await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'OPEN');
      }
    }
  } else {
    const myOutlineRes = await apiCall(request, studentToken, 'GET', '/outline/my-outline');
    handle.outlinePublicId = myOutlineRes.body?.data?.publicId ?? null;
  }

  return handle;
}

async function cleanupActiveStudents(request: APIRequestContext) {
  if (activeHandles.length === 0) return;

  const handles = [...activeHandles];
  activeHandles = [];

  const remaining: ProvisionedOutlineStudentHandle[] = [];
  for (const h of handles) {
    const delRes = await apiCall(request, envState.hodToken, 'DELETE', `/student/${h.studentPublicId}`);
    if (delRes.status === 200) continue;
    remaining.push(h);
  }
  if (remaining.length === 0) return;

  await sweepResidualTopicsInIsolatedMajor(request);

  for (const h of remaining) {
    const suffix = `${String(Date.now()).slice(-5)}${rotateCounter++}`;
    await apiCall(request, envState.hodToken, 'PUT', `/student/${h.studentPublicId}`, {
      data: {
        studentCode: `9997${suffix.slice(-6)}`,
        firstName: h.profile.firstName,
        lastName: h.profile.lastName,
        email: `itc.arch.svoutline.${suffix}@gmail.com`,
        phone: `0977${suffix.slice(-6)}`,
        batch: h.profile.batch,
        className: h.profile.className,
      },
    });
  }
}

async function openStudentOutlinePage(page: Page, context: BrowserContext, token: string) {
  await setAuthCookie(context, token);

  const outlinePromise = page.waitForResponse(
    (r) => r.url().includes('/outline/my-outline') && r.request().method() === 'GET',
  );
  const topicPromise = page.waitForResponse(
    (r) => r.url().includes('/topic/my-title-history') && r.request().method() === 'GET',
  );
  await page.goto('/student/outline');
  const [outlineRes, topicRes] = await Promise.all([outlinePromise, topicPromise]);
  return { outlineRes, topicRes };
}

test.describe('Report 5.2 - Student Submit Thesis Outline (NopDeCuong)', () => {
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
      reviewerId: 0,
      reviewerPublicId: '',
      reviewerAccountId: 0,
      reviewerToken: '',
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

    const reviewer = await ensureTeacher(request, TEST_REVIEWER, 20);
    envState.reviewerId = reviewer.id;
    envState.reviewerPublicId = reviewer.publicId;
    envState.reviewerAccountId = reviewer.accountId;
    envState.reviewerToken = reviewer.token;

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
  // FUNCTION 1: View Outline Overview and Submission History (ITC035..ITC040)
  // ==========================================================================

  test(ITC035.title, { annotation: ITC035.annotation }, async ({ page, context, request }) => {
    const h = await provisionOutlineStudent(request, {
      profile: TEST_STUDENT_1,
      confirmTitle: OFFICIAL_TITLE_DEFAULT,
      assignReviewer: true,
    });

    const { outlineRes } = await openStudentOutlinePage(page, context, h.studentToken);
    expect(outlineRes.status()).toBe(200);
    const body = await outlineRes.json();
    expect(body.code).toBe(1000);
    expect(body.data.currentStage).toBe('STAGE_2_TOPIC_CONFIRMED');
    expect(body.data.status).toBeNull();
    expect(body.data.lecturerName).toBe(TEST_MAIN_SUPERVISOR.fullName);
    expect(body.data.reviewerName).toBe(TEST_REVIEWER.fullName);
    expect(body.data.deadlineStatus).toBe('OPEN');
    expect(body.data.histories).toHaveLength(0);

    await expect(page.getByText(TEST_MAIN_SUPERVISOR.fullName)).toBeVisible();
    await expect(page.getByText(TEST_REVIEWER.fullName)).toBeVisible();
    await expect(page.locator('#outlineDeadlineText')).toContainText('(Đang mở)');
    await expect(page.getByText('Chưa có lần nộp đề cương nào trong học kỳ này.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'TẢI TỆP LÊN' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'SOẠN TRỰC TUYẾN' })).toBeEnabled();

    // Đối chiếu DB bằng SELECT
    const rows = await dbSelect<{
      status: string | null;
      reviewer_code: string | null;
      history_count: number;
    }>(
      `SELECT o.status,
              t.teacher_code AS reviewer_code,
              (SELECT COUNT(*) FROM thesis_outline_history h WHERE h.thesis_outline_id = o.id) AS history_count
         FROM thesis_outline o
         JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
         LEFT JOIN teacher t ON t.id = o.commenting_lecture_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBeNull();
    expect(rows[0].reviewer_code).toBe(TEST_REVIEWER.teacherCode);
    expect(Number(rows[0].history_count)).toBe(0);
  });

  test(ITC036.title, { annotation: ITC036.annotation }, async ({ page, context, request }) => {
    await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'OPEN');
    await releaseStudentCodeIfTaken(request, TEST_STUDENT_2);

    const createRes = await apiCall(request, envState.hodToken, 'POST', '/student', {
      data: {
        studentCode: TEST_STUDENT_2.studentCode,
        firstName: TEST_STUDENT_2.firstName,
        lastName: TEST_STUDENT_2.lastName,
        email: TEST_STUDENT_2.email,
        phone: TEST_STUDENT_2.phone,
        batch: TEST_STUDENT_2.batch,
        className: TEST_STUDENT_2.className,
        major: envState.majorName,
      },
    });
    expect(createRes.status).toBe(200);
    const listRes = await apiCall(request, envState.hodToken, 'GET', '/student', {
      params: { semesterId: envState.semesterPublicId, keyword: TEST_STUDENT_2.studentCode },
    });
    const st2 = (listRes.body?.data?.content ?? []).find(
      (s: any) => s.studentCode === TEST_STUDENT_2.studentCode,
    );
    expect(st2?.publicId).toBeTruthy();
    const student2Token = await loginByEmail(request, TEST_STUDENT_2.email);
    activeHandles.push({
      profile: TEST_STUDENT_2,
      studentPublicId: st2.publicId,
      studentToken: student2Token,
      topicId: 0,
      topicPublicId: '',
      outlinePublicId: null,
    });

    const { outlineRes } = await openStudentOutlinePage(page, context, student2Token);
    expect(outlineRes.status()).toBe(200);
    const body = await outlineRes.json();
    expect(body.code).toBe(1000);
    expect(body.data.currentStage).toBe('STAGE_1_REGISTERING_ADVISOR');
    expect(body.data.lecturerName).toBeNull();
    expect(body.data.status).toBeNull();
    expect(body.data.histories).toHaveLength(0);

    await expect(page.getByText('Chưa phân công').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'TẢI TỆP LÊN' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'SOẠN TRỰC TUYẾN' })).toBeDisabled();
    await expect(page.getByText('Chưa có lần nộp đề cương nào trong học kỳ này.')).toBeVisible();

    const rows = await dbSelect<{ current_stage: string; lecturer_id: number | null; outline_count: number }>(
      `SELECT tt.current_stage,
              tt.lecturer_id,
              (SELECT COUNT(*) FROM thesis_outline o WHERE o.thesis_topic_id = tt.id) AS outline_count
         FROM thesis_topic tt
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_2.studentCode, envState.semesterId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].current_stage).toBe('STAGE_1_REGISTERING_ADVISOR');
    expect(rows[0].lecturer_id).toBeNull();
    expect(Number(rows[0].outline_count)).toBe(0);
  });

  test(ITC037.title, { annotation: ITC037.annotation }, async ({ page, context, request }) => {
    const reviewFeedback = 'Cần bổ sung sơ đồ kiến trúc hệ thống';
    const advisorFeedback = 'Em nên làm rõ phần phạm vi đề tài';
    const h = await provisionOutlineStudent(request, {
      profile: TEST_STUDENT_1,
      confirmTitle: OFFICIAL_TITLE_DEFAULT,
      assignReviewer: true,
      initialSubmission: {
        fileName: VALID_PDF_FILENAME,
        advisorFeedback,
        reviewDecision: 'REQUEST_CHANGES',
        reviewFeedback,
      },
    });

    const { outlineRes } = await openStudentOutlinePage(page, context, h.studentToken);
    expect(outlineRes.status()).toBe(200);
    const body = await outlineRes.json();
    expect(body.code).toBe(1000);
    expect(body.data.status).toBe('REQUEST_CHANGES');
    expect(body.data.reviewFeedback).toBe(reviewFeedback);
    expect(body.data.advisorFeedback).toBe(advisorFeedback);
    expect(body.data.histories).toHaveLength(1);
    expect(body.data.histories[0].status).toBe('REQUEST_CHANGES');

    await expect(page.getByText(`Nhận xét của GV thẩm định (${TEST_REVIEWER.fullName}):`)).toBeVisible();
    await expect(page.getByText(`Nhận xét của GVHD (${TEST_MAIN_SUPERVISOR.fullName}):`)).toBeVisible();
    await expect(page.getByText(reviewFeedback).first()).toBeVisible();
    await expect(page.getByText(advisorFeedback).first()).toBeVisible();
    await expect(page.locator('#submissions-table-body tr')).toHaveCount(1);
    await expect(page.locator('#submissions-table-body').getByText('Yêu cầu chỉnh sửa')).toBeVisible();
    await expect(page.getByRole('button', { name: 'TẢI TỆP LÊN' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'SOẠN TRỰC TUYẾN' })).toBeEnabled();

    const rows = await dbSelect<{
      outline_status: string;
      review_feedback: string;
      advisor_feedback: string;
      history_status: string;
    }>(
      `SELECT o.status AS outline_status,
              o.review_feedback,
              o.advisor_feedback,
              h.status AS history_status
         FROM thesis_outline o
         JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
         JOIN thesis_outline_history h ON h.thesis_outline_id = o.id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].outline_status).toBe('REQUEST_CHANGES');
    expect(rows[0].history_status).toBe('REQUEST_CHANGES');
    expect(rows[0].review_feedback).toBe(reviewFeedback);
    expect(rows[0].advisor_feedback).toBe(advisorFeedback);
  });

  test(ITC038.title, { annotation: ITC038.annotation }, async ({ page, context, request }) => {
    const approveFeedback = 'Đề cương đạt yêu cầu, triển khai đúng kế hoạch';
    const h = await provisionOutlineStudent(request, {
      profile: TEST_STUDENT_1,
      confirmTitle: OFFICIAL_TITLE_DEFAULT,
      assignReviewer: true,
      initialSubmission: {
        fileName: VALID_PDF_FILENAME,
        reviewDecision: 'APPROVED',
        reviewFeedback: approveFeedback,
      },
    });

    const { outlineRes } = await openStudentOutlinePage(page, context, h.studentToken);
    expect(outlineRes.status()).toBe(200);
    const body = await outlineRes.json();
    expect(body.code).toBe(1000);
    expect(body.data.status).toBe('APPROVED');
    expect(body.data.currentStage).toBe('STAGE_3_OUTLINE_APPROVED');
    expect(body.data.reviewFeedback).toBe(approveFeedback);

    await expect(page.getByText('Đề cương đã được phê duyệt, không thể nộp lại.')).toBeVisible();
    await expect(page.locator('#submissions-table-body').getByText('Đã duyệt')).toBeVisible();
    await expect(page.getByRole('button', { name: 'TẢI TỆP LÊN' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'SOẠN TRỰC TUYẾN' })).toBeDisabled();

    const rows = await dbSelect<{ outline_status: string; current_stage: string }>(
      `SELECT o.status AS outline_status, tt.current_stage
         FROM thesis_outline o
         JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].outline_status).toBe('APPROVED');
    expect(rows[0].current_stage).toBe('STAGE_3_OUTLINE_APPROVED');
  });

  test(ITC039.title, { annotation: ITC039.annotation }, async ({ page, context, request }) => {
    const h = await provisionOutlineStudent(request, {
      profile: TEST_STUDENT_1,
      confirmTitle: OFFICIAL_TITLE_DEFAULT,
      assignReviewer: true,
      initialSubmission: {
        fileName: VALID_PDF_FILENAME,
        reviewDecision: 'REJECTED',
        reviewFeedback: 'Đề cương không đạt yêu cầu sau thời gian gia hạn',
      },
    });

    const { outlineRes } = await openStudentOutlinePage(page, context, h.studentToken);
    expect(outlineRes.status()).toBe(200);
    const body = await outlineRes.json();
    expect(body.code).toBe(1000);
    expect(body.data.status).toBe('REJECTED');
    expect(body.data.topicStatus).toBe('DISQUALIFIED');
    expect(body.data.disqualificationReason).toBe('Không hoàn thành phê duyệt đề cương đúng hạn');

    await expect(page.getByText('Đề tài đã bị đình chỉ (DISQUALIFIED)').first()).toBeVisible();
    await expect(page.locator('#submissions-table-body').getByText('Không đạt', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'TẢI TỆP LÊN' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'SOẠN TRỰC TUYẾN' })).toBeDisabled();

    const rows = await dbSelect<{ outline_status: string; topic_status: string }>(
      `SELECT o.status AS outline_status, tt.status AS topic_status
         FROM thesis_outline o
         JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].outline_status).toBe('REJECTED');
    expect(rows[0].topic_status).toBe('DISQUALIFIED');
  });

  test(ITC040.title, { annotation: ITC040.annotation }, async ({ page, context, request }) => {
    const h = await provisionOutlineStudent(request, {
      profile: TEST_STUDENT_1,
      confirmTitle: OFFICIAL_TITLE_DEFAULT,
      assignReviewer: true,
    });

    // 1. CLOSED
    await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'CLOSED');
    const closedRes = (await openStudentOutlinePage(page, context, h.studentToken)).outlineRes;
    expect(closedRes.status()).toBe(200);
    const closedBody = await closedRes.json();
    expect(closedBody.code).toBe(1000);
    expect(closedBody.data.deadlineStatus).toBe('CLOSED');
    await expect(page.locator('#outlineDeadlineText')).toContainText('Đã hết hạn');
    await expect(page.getByRole('button', { name: 'TẢI TỆP LÊN' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'SOẠN TRỰC TUYẾN' })).toBeDisabled();

    // 2. NOT_STARTED
    await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'NOT_STARTED');
    const notStartedPromise = page.waitForResponse(
      (r) => r.url().includes('/outline/my-outline') && r.request().method() === 'GET',
    );
    await page.reload();
    const notStartedRes = await notStartedPromise;
    expect(notStartedRes.status()).toBe(200);
    const notStartedBody = await notStartedRes.json();
    expect(notStartedBody.code).toBe(1000);
    expect(notStartedBody.data.deadlineStatus).toBe('NOT_STARTED');
    await expect(page.locator('#outlineDeadlineText')).toContainText('Chưa mở');
    await expect(page.getByRole('button', { name: 'TẢI TỆP LÊN' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'SOẠN TRỰC TUYẾN' })).toBeDisabled();

    // 3. EXTENDED
    await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'EXTENDED');
    const extendedPromise = page.waitForResponse(
      (r) => r.url().includes('/outline/my-outline') && r.request().method() === 'GET',
    );
    await page.reload();
    const extendedRes = await extendedPromise;
    expect(extendedRes.status()).toBe(200);
    const extendedBody = await extendedRes.json();
    expect(extendedBody.code).toBe(1000);
    expect(extendedBody.data.deadlineStatus).toBe('EXTENDED');
    await expect(page.locator('#outlineDeadlineText')).toContainText(
      'Đã hết hạn nộp — Đang trong thời gian gia hạn chấm của giảng viên',
    );
    await expect(page.getByRole('button', { name: 'TẢI TỆP LÊN' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'SOẠN TRỰC TUYẾN' })).toBeDisabled();
  });

  // ==========================================================================
  // FUNCTION 2: Submit Outline via File Upload (ITC041..ITC049)
  // ==========================================================================

  test(ITC041.title, { annotation: ITC041.annotation }, async ({ page, context, request }) => {
    const h = await provisionOutlineStudent(request, {
      profile: TEST_STUDENT_1,
      confirmTitle: OFFICIAL_TITLE_DEFAULT,
      assignReviewer: true,
    });

    const notifBeforeRows = await dbSelect<{ total: number }>(
      'SELECT COUNT(*) AS total FROM notification WHERE account_id = ?',
      [envState.reviewerAccountId],
    );
    const notifBefore = Number(notifBeforeRows[0]?.total ?? 0);

    await openStudentOutlinePage(page, context, h.studentToken);
    await page.getByRole('button', { name: 'TẢI TỆP LÊN' }).click();
    await expect(page.getByRole('heading', { name: 'Tải lên tệp đề cương' })).toBeVisible();

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Chọn tệp từ máy tính' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: VALID_PDF_FILENAME,
      mimeType: 'application/pdf',
      buffer: createMinimalValidPdfBuffer('First Outline Submission'),
    });

    const submitPromise = page.waitForResponse(
      (r) => r.url().includes('/outline/submit') && r.request().method() === 'POST',
    );
    const reloadOutlinePromise = page.waitForResponse(
      (r) => r.url().includes('/outline/my-outline') && r.request().method() === 'GET',
    );
    await page.getByRole('button', { name: 'Nộp đề cương' }).click();
    const submitRes = await submitPromise;
    expect(submitRes.status()).toBe(200);
    const submitBody = await submitRes.json();
    expect(submitBody.code).toBe(1000);
    expect(submitBody.message).toBe('Nộp đề cương thành công');

    await reloadOutlinePromise;
    await expect(page.getByText('Nộp đề cương thành công!')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tải lên tệp đề cương' })).toHaveCount(0);
    await expect(page.locator('#submissions-table-body tr')).toHaveCount(1);
    await expect(page.locator('#submissions-table-body')).toContainText(VALID_PDF_FILENAME);
    await expect(page.locator('#submissions-table-body').getByText('Đã nộp, chờ nhận xét')).toBeVisible();

    // Đối chiếu DB: thesis_outline, thesis_outline_history và notification gửi GVNX
    const outlineRows = await dbSelect<{
      status: string;
      title: string | null;
      outline_file: string | null;
      submitted_at: string | null;
      history_count: number;
    }>(
      `SELECT o.status,
              o.title,
              o.outline_file,
              o.submitted_at,
              (SELECT COUNT(*) FROM thesis_outline_history h WHERE h.thesis_outline_id = o.id AND h.status = 'PENDING') AS history_count
         FROM thesis_outline o
         JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(outlineRows).toHaveLength(1);
    expect(outlineRows[0].status).toBe('PENDING');
    expect(outlineRows[0].title).toBe(OFFICIAL_TITLE_DEFAULT);
    expect(outlineRows[0].outline_file).toBeTruthy();
    expect(outlineRows[0].submitted_at).toBeTruthy();
    expect(Number(outlineRows[0].history_count)).toBe(1);

    const notifAfterRows = await dbSelect<{ content: string }>(
      `SELECT content
         FROM notification
        WHERE account_id = ?
        ORDER BY id DESC
        LIMIT 5`,
      [envState.reviewerAccountId],
    );
    const notifCountAfterRows = await dbSelect<{ total: number }>(
      'SELECT COUNT(*) AS total FROM notification WHERE account_id = ?',
      [envState.reviewerAccountId],
    );
    expect(Number(notifCountAfterRows[0]?.total ?? 0)).toBeGreaterThan(notifBefore);
    expect(
      notifAfterRows.some(
        (n) => n.content.includes(TEST_STUDENT_1.fullName) && n.content.includes('đã nộp đề cương'),
      ),
    ).toBeTruthy();
  });

  test(ITC042.title, { annotation: ITC042.annotation }, async ({ page, context, request }) => {
    const h = await provisionOutlineStudent(request, {
      profile: TEST_STUDENT_1,
      confirmTitle: OFFICIAL_TITLE_DEFAULT,
      assignReviewer: true,
      initialSubmission: {
        fileName: VALID_PDF_FILENAME,
      },
    });

    await openStudentOutlinePage(page, context, h.studentToken);
    await expect(page.locator('#submissions-table-body tr')).toHaveCount(1);

    await page.getByRole('button', { name: 'TẢI TỆP LÊN' }).click();
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Chọn tệp từ máy tính' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: VALID_DOCX_FILENAME,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: createMinimalValidDocxBuffer('Updated Pending Outline DOCX'),
    });

    const submitPromise = page.waitForResponse(
      (r) => r.url().includes('/outline/submit') && r.request().method() === 'POST',
    );
    const reloadOutlinePromise = page.waitForResponse(
      (r) => r.url().includes('/outline/my-outline') && r.request().method() === 'GET',
    );
    await page.getByRole('button', { name: 'Nộp đề cương' }).click();
    const submitRes = await submitPromise;
    expect(submitRes.status()).toBe(200);
    const submitBody = await submitRes.json();
    expect(submitBody.code).toBe(1000);
    expect(submitBody.message).toBe('Nộp đề cương thành công');

    await reloadOutlinePromise;
    await expect(page.getByText('Nộp đề cương thành công!')).toBeVisible();
    await expect(page.locator('#submissions-table-body tr')).toHaveCount(1);
    await expect(page.locator('#submissions-table-body')).toContainText(VALID_DOCX_FILENAME);
    await expect(page.locator('#submissions-table-body').getByText('Đã nộp, chờ nhận xét')).toBeVisible();

    // Phương án B: ghi đè trên cùng bản ghi PENDING, không sinh thêm dòng lịch sử
    const rows = await dbSelect<{
      status: string;
      outline_file: string;
      history_count: number;
    }>(
      `SELECT o.status,
              o.outline_file,
              (SELECT COUNT(*) FROM thesis_outline_history h WHERE h.thesis_outline_id = o.id) AS history_count
         FROM thesis_outline o
         JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('PENDING');
    expect(rows[0].outline_file).toContain('.docx');
    expect(Number(rows[0].history_count)).toBe(1);
  });

  test(ITC043.title, { annotation: ITC043.annotation }, async ({ page, context, request }) => {
    const reviewFeedback = 'Bổ sung chương cơ sở lý thuyết';
    const advisorFeedback = 'Kiểm tra lại tài liệu tham khảo';
    const h = await provisionOutlineStudent(request, {
      profile: TEST_STUDENT_1,
      confirmTitle: OFFICIAL_TITLE_DEFAULT,
      assignReviewer: true,
      initialSubmission: {
        fileName: VALID_PDF_FILENAME,
        advisorFeedback,
        reviewDecision: 'REQUEST_CHANGES',
        reviewFeedback,
      },
    });

    await openStudentOutlinePage(page, context, h.studentToken);
    await expect(page.getByText(`Nhận xét của GV thẩm định (${TEST_REVIEWER.fullName}):`)).toBeVisible();

    await page.getByRole('button', { name: 'TẢI TỆP LÊN' }).click();
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Chọn tệp từ máy tính' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: VALID_PDF_FILENAME,
      mimeType: 'application/pdf',
      buffer: createMinimalValidPdfBuffer('Revised Outline After Request Changes'),
    });

    const submitPromise = page.waitForResponse(
      (r) => r.url().includes('/outline/submit') && r.request().method() === 'POST',
    );
    const reloadOutlinePromise = page.waitForResponse(
      (r) => r.url().includes('/outline/my-outline') && r.request().method() === 'GET',
    );
    await page.getByRole('button', { name: 'Nộp đề cương' }).click();
    const submitRes = await submitPromise;
    expect(submitRes.status()).toBe(200);
    const submitBody = await submitRes.json();
    expect(submitBody.code).toBe(1000);
    expect(submitBody.message).toBe('Nộp đề cương thành công');

    await reloadOutlinePromise;
    await expect(page.getByText('Nộp đề cương thành công!')).toBeVisible();
    await expect(page.getByText(`Nhận xét của GV thẩm định (${TEST_REVIEWER.fullName}):`)).toHaveCount(0);
    await expect(page.locator('#submissions-table-body tr')).toHaveCount(2);
    await expect(page.locator('#submissions-table-body tr').nth(0)).toContainText('Đã nộp, chờ nhận xét');
    await expect(page.locator('#submissions-table-body tr').nth(1)).toContainText('Yêu cầu chỉnh sửa');

    const outlineRows = await dbSelect<{
      status: string;
      review_feedback: string | null;
      advisor_feedback: string | null;
      reviewed_at: string | null;
    }>(
      `SELECT o.status, o.review_feedback, o.advisor_feedback, o.reviewed_at
         FROM thesis_outline o
         JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(outlineRows).toHaveLength(1);
    expect(outlineRows[0].status).toBe('PENDING');
    expect(outlineRows[0].review_feedback).toBeNull();
    expect(outlineRows[0].advisor_feedback).toBeNull();
    expect(outlineRows[0].reviewed_at).toBeNull();

    const histRows = await dbSelect<{
      status: string;
      review_feedback: string | null;
      advisor_feedback: string | null;
    }>(
      `SELECT h.status, h.review_feedback, h.advisor_feedback
         FROM thesis_outline_history h
         JOIN thesis_outline o ON o.id = h.thesis_outline_id
         JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?
        ORDER BY h.submitted_at DESC, h.id DESC`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(histRows).toHaveLength(2);
    expect(histRows[0].status).toBe('PENDING');
    expect(histRows[1].status).toBe('REQUEST_CHANGES');
    expect(histRows[1].review_feedback).toBe(reviewFeedback);
    expect(histRows[1].advisor_feedback).toBe(advisorFeedback);
  });

  test(ITC044.title, { annotation: ITC044.annotation }, async ({ page, context, request }) => {
    const h = await provisionOutlineStudent(request, {
      profile: TEST_STUDENT_1,
      confirmTitle: OFFICIAL_TITLE_DEFAULT,
      assignReviewer: true,
    });

    await openStudentOutlinePage(page, context, h.studentToken);

    let submitCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/outline/submit') && req.method() === 'POST') {
        submitCalled = true;
      }
    });

    await page.getByRole('button', { name: 'TẢI TỆP LÊN' }).click();
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Chọn tệp từ máy tính' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: INVALID_EXT_FILENAME,
      mimeType: 'text/plain',
      buffer: Buffer.from('Plain text outline content', 'utf8'),
    });

    await expect(
      page.getByText('File đề cương chỉ hỗ trợ định dạng .doc, .docx hoặc .pdf.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nộp đề cương' })).toBeDisabled();
    expect(submitCalled).toBe(false);

    const rows = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM thesis_outline_history h
         JOIN thesis_outline o ON o.id = h.thesis_outline_id
         JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(Number(rows[0].total)).toBe(0);
  });

  test(ITC045.title, { annotation: ITC045.annotation }, async ({ page, context, request }) => {
    const h = await provisionOutlineStudent(request, {
      profile: TEST_STUDENT_1,
      confirmTitle: OFFICIAL_TITLE_DEFAULT,
      assignReviewer: true,
    });

    await openStudentOutlinePage(page, context, h.studentToken);

    let submitCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/outline/submit') && req.method() === 'POST') {
        submitCalled = true;
      }
    });

    await page.getByRole('button', { name: 'TẢI TỆP LÊN' }).click();
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Chọn tệp từ máy tính' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: INVALID_NAME_FILENAME,
      mimeType: 'application/pdf',
      buffer: createMinimalValidPdfBuffer('Invalid Name Format'),
    });

    await expect(
      page.getByText(
        'Tên file không đúng định dạng! Vui lòng đổi tên file theo định dạng Tenlop_MaSV_HoVaTen (VD: DHKTPM17A_22110001_NguyenVanAn.pdf)',
      ),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nộp đề cương' })).toBeDisabled();
    expect(submitCalled).toBe(false);

    const rows = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM thesis_outline_history h
         JOIN thesis_outline o ON o.id = h.thesis_outline_id
         JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(Number(rows[0].total)).toBe(0);
  });

  test(ITC046.title, { annotation: ITC046.annotation }, async ({ page, context, request }) => {
    const h = await provisionOutlineStudent(request, {
      profile: TEST_STUDENT_1,
      confirmTitle: OFFICIAL_TITLE_DEFAULT,
      assignReviewer: true,
    });

    await openStudentOutlinePage(page, context, h.studentToken);

    let submitCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/outline/submit') && req.method() === 'POST') {
        submitCalled = true;
      }
    });

    await page.getByRole('button', { name: 'TẢI TỆP LÊN' }).click();

    // 1. File 0 byte
    const fcEmptyPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Chọn tệp từ máy tính' }).click();
    const fcEmpty = await fcEmptyPromise;
    await fcEmpty.setFiles({
      name: VALID_PDF_FILENAME,
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(0),
    });
    await expect(page.getByText('Vui lòng chọn file đề cương cần tải lên.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nộp đề cương' })).toBeDisabled();

    // 2. File đúng 10 MB (vượt giới hạn nhỏ hơn 10 MB)
    const fcLargePromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Chọn tệp từ máy tính' }).click();
    const fcLarge = await fcLargePromise;
    await fcLarge.setFiles({
      name: VALID_PDF_FILENAME,
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(10 * 1024 * 1024, 0x25),
    });
    await expect(page.getByText('Dung lượng file đề cương phải nhỏ hơn 10 MB.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nộp đề cương' })).toBeDisabled();
    expect(submitCalled).toBe(false);

    const rows = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM thesis_outline_history h
         JOIN thesis_outline o ON o.id = h.thesis_outline_id
         JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(Number(rows[0].total)).toBe(0);
  });

  test(ITC047.title, { annotation: ITC047.annotation }, async ({ page, context, request }) => {
    const h = await provisionOutlineStudent(request, {
      profile: TEST_STUDENT_1,
      confirmTitle: OFFICIAL_TITLE_DEFAULT,
      assignReviewer: false,
    });

    await openStudentOutlinePage(page, context, h.studentToken);
    await page.getByRole('button', { name: 'TẢI TỆP LÊN' }).click();

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Chọn tệp từ máy tính' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: VALID_PDF_FILENAME,
      mimeType: 'application/pdf',
      buffer: createMinimalValidPdfBuffer('No Reviewer Assigned'),
    });

    const submitPromise = page.waitForResponse(
      (r) => r.url().includes('/outline/submit') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Nộp đề cương' }).click();
    const submitRes = await submitPromise;
    expect(submitRes.status()).toBe(409);
    const submitBody = await submitRes.json();
    expect(submitBody.code).toBe(3079);
    expect(submitBody.message).toBe('Đề tài chưa được phân công giảng viên nhận xét đề cương');

    await expect(
      page.getByText('Đề tài chưa được phân công giảng viên nhận xét đề cương'),
    ).toBeVisible();

    const rows = await dbSelect<{ outline_count: number; history_count: number }>(
      `SELECT (SELECT COUNT(*) FROM thesis_outline o WHERE o.thesis_topic_id = tt.id) AS outline_count,
              (SELECT COUNT(*) FROM thesis_outline_history h JOIN thesis_outline o ON o.id = h.thesis_outline_id WHERE o.thesis_topic_id = tt.id) AS history_count
         FROM thesis_topic tt
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(rows).toHaveLength(1);
    expect(Number(rows[0].outline_count)).toBe(0);
    expect(Number(rows[0].history_count)).toBe(0);
  });

  test(ITC048.title, { annotation: ITC048.annotation }, async ({ page, context, request }) => {
    const h = await provisionOutlineStudent(request, {
      profile: TEST_STUDENT_1,
      confirmTitle: OFFICIAL_TITLE_DEFAULT,
      assignReviewer: true,
    });

    await openStudentOutlinePage(page, context, h.studentToken);
    await page.getByRole('button', { name: 'TẢI TỆP LÊN' }).click();

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Chọn tệp từ máy tính' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: VALID_PDF_FILENAME,
      mimeType: 'application/pdf',
      buffer: createMinimalValidPdfBuffer('Submitted After Deadline Closed'),
    });

    // Hạn nộp đóng ngay trước khi sinh viên bấm "Nộp đề cương"
    await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'CLOSED');

    const submitPromise = page.waitForResponse(
      (r) => r.url().includes('/outline/submit') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Nộp đề cương' }).click();
    const submitRes = await submitPromise;
    expect(submitRes.status()).toBe(403);
    const submitBody = await submitRes.json();
    expect(submitBody.code).toBe(3085);
    expect(submitBody.message).toBe('Thời hạn sinh viên nộp đề cương chưa mở hoặc đã kết thúc');

    await expect(
      page.getByText('Thời hạn sinh viên nộp đề cương chưa mở hoặc đã kết thúc'),
    ).toBeVisible();

    const rows = await dbSelect<{ status: string | null; history_count: number }>(
      `SELECT o.status,
              (SELECT COUNT(*) FROM thesis_outline_history h WHERE h.thesis_outline_id = o.id) AS history_count
         FROM thesis_outline o
         JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBeNull();
    expect(Number(rows[0].history_count)).toBe(0);
  });

  test(ITC049.title, { annotation: ITC049.annotation }, async ({ page, context, request }) => {
    const h = await provisionOutlineStudent(request, {
      profile: TEST_STUDENT_1,
      confirmTitle: OFFICIAL_TITLE_DEFAULT,
      assignReviewer: true,
      initialSubmission: {
        fileName: VALID_PDF_FILENAME,
      },
    });

    await openStudentOutlinePage(page, context, h.studentToken);
    await page.getByRole('button', { name: 'TẢI TỆP LÊN' }).click();

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Chọn tệp từ máy tính' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: VALID_DOCX_FILENAME,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: createMinimalValidDocxBuffer('Concurrent Submit After Approved'),
    });

    // Giảng viên nhận xét duyệt ĐẠT đồng thời trước khi sinh viên bấm nộp
    const approveRes = await apiCall(
      request,
      envState.reviewerToken,
      'PUT',
      `/outline/${h.outlinePublicId}/review`,
      { data: { decision: 'APPROVED', feedback: 'Đã duyệt đạt trong phiên đồng thời' } },
    );
    expect(approveRes.status).toBe(200);

    const submitPromise = page.waitForResponse(
      (r) => r.url().includes('/outline/submit') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Nộp đề cương' }).click();
    const submitRes = await submitPromise;
    expect(submitRes.status()).toBe(409);
    const submitBody = await submitRes.json();
    expect(submitBody.code).toBe(3081);
    expect(submitBody.message).toBe(
      'Đề cương đã được phê duyệt hoặc đã có kết quả cuối cùng, không thể nộp lại',
    );

    await expect(
      page.getByText('Đề cương đã được phê duyệt hoặc đã có kết quả cuối cùng, không thể nộp lại'),
    ).toBeVisible();

    const rows = await dbSelect<{ status: string; history_count: number }>(
      `SELECT o.status,
              (SELECT COUNT(*) FROM thesis_outline_history h WHERE h.thesis_outline_id = o.id) AS history_count
         FROM thesis_outline o
         JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('APPROVED');
    expect(Number(rows[0].history_count)).toBe(1);
  });

  // ==========================================================================
  // FUNCTION 3: Compose and Submit Outline Online (ITC050..ITC051)
  // ==========================================================================

  test(ITC050.title, { annotation: ITC050.annotation }, async ({ page, context, request }) => {
    const onlineTitle = 'Hệ thống quản lý thực tập doanh nghiệp phiên bản trực tuyến';
    const expectedGeneratedFileName = 'Lop_9990000501_LeThiHuong.docx';
    const h = await provisionOutlineStudent(request, {
      profile: TEST_STUDENT_1,
      confirmTitle: OFFICIAL_TITLE_DEFAULT,
      assignReviewer: true,
    });

    const notifBeforeRows = await dbSelect<{ total: number }>(
      'SELECT COUNT(*) AS total FROM notification WHERE account_id = ?',
      [envState.reviewerAccountId],
    );
    const notifBefore = Number(notifBeforeRows[0]?.total ?? 0);

    await openStudentOutlinePage(page, context, h.studentToken);
    await page.evaluate(() => localStorage.removeItem('student_outline_draft_v1'));

    await page.getByRole('button', { name: 'SOẠN TRỰC TUYẾN' }).click();
    await expect(page.getByRole('heading', { name: 'Soạn đề cương trực tuyến' })).toBeVisible();

    const editorModal = page
      .locator('div.fixed.inset-0')
      .filter({ has: page.getByRole('heading', { name: 'Soạn đề cương trực tuyến' }) });

    // Điền tiêu đề tiếng Việt, 4 mục nội dung bắt buộc và 1 dòng kế hoạch thực hiện
    await editorModal.locator('input[type="text"]').nth(0).fill(onlineTitle);
    const sectionTextareas = editorModal.locator('textarea');
    await sectionTextareas.nth(0).fill('Tóm tắt lý do chọn đề tài và phạm vi hệ thống quản lý thực tập.');
    await sectionTextareas.nth(1).fill('Xây dựng ứng dụng web quản lý quy trình thực tập từ đăng ký đến đánh giá.');
    await sectionTextareas.nth(2).fill('Tài liệu SRS, mã nguồn hoàn chỉnh và báo cáo kiểm thử.');
    await sectionTextareas.nth(3).fill('Tài liệu Spring Boot 3 và React TypeScript.');
    await editorModal.getByPlaceholder('Ví dụ: Khảo sát và phân tích yêu cầu').fill('Khảo sát và đặc tả yêu cầu');
    await editorModal.getByPlaceholder('Tuần 1 - 3').fill('Tuần 1 - 3');
    await editorModal.getByPlaceholder('Tài liệu SRS').fill('Bản đặc tả SRS');

    const submitPromise = page.waitForResponse(
      (r) => r.url().includes('/outline/submit') && r.request().method() === 'POST',
    );
    const reloadOutlinePromise = page.waitForResponse(
      (r) => r.url().includes('/outline/my-outline') && r.request().method() === 'GET',
    );
    await editorModal.getByRole('button', { name: 'Nộp đề cương' }).click();
    const submitRes = await submitPromise;
    expect(submitRes.status()).toBe(200);
    const submitBody = await submitRes.json();
    expect(submitBody.code).toBe(1000);
    expect(submitBody.message).toBe('Nộp đề cương thành công');

    await reloadOutlinePromise;
    await expect(page.getByText('Nộp đề cương thành công!')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Soạn đề cương trực tuyến' })).toHaveCount(0);
    await expect(page.locator('#submissions-table-body tr')).toHaveCount(1);
    await expect(page.locator('#submissions-table-body')).toContainText(expectedGeneratedFileName);
    await expect(page.locator('#submissions-table-body')).toContainText(
      'Ghi chú: Soạn và nộp từ hệ thống trực tuyến',
    );
    await expect(page.locator('#submissions-table-body').getByText('Đã nộp, chờ nhận xét')).toBeVisible();

    const rows = await dbSelect<{
      status: string;
      title: string | null;
      outline_file: string | null;
      submission_note: string | null;
    }>(
      `SELECT o.status,
              o.title,
              o.outline_file,
              h.submission_note
         FROM thesis_outline o
         JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
         JOIN thesis_outline_history h ON h.thesis_outline_id = o.id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('PENDING');
    expect(rows[0].title).toBe(onlineTitle);
    expect(rows[0].outline_file).toContain('.docx');
    expect(rows[0].submission_note).toBe('Soạn và nộp từ hệ thống trực tuyến');

    const notifCountAfterRows = await dbSelect<{ total: number }>(
      'SELECT COUNT(*) AS total FROM notification WHERE account_id = ?',
      [envState.reviewerAccountId],
    );
    expect(Number(notifCountAfterRows[0]?.total ?? 0)).toBeGreaterThan(notifBefore);
  });

  test(ITC051.title, { annotation: ITC051.annotation }, async ({ page, context, request }) => {
    const h = await provisionOutlineStudent(request, {
      profile: TEST_STUDENT_1,
      confirmTitle: OFFICIAL_TITLE_DEFAULT,
      assignReviewer: true,
    });

    await openStudentOutlinePage(page, context, h.studentToken);
    await page.evaluate(() => localStorage.removeItem('student_outline_draft_v1'));

    let submitCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/outline/submit') && req.method() === 'POST') {
        submitCalled = true;
      }
    });

    await page.getByRole('button', { name: 'SOẠN TRỰC TUYẾN' }).click();
    const editorModal = page
      .locator('div.fixed.inset-0')
      .filter({ has: page.getByRole('heading', { name: 'Soạn đề cương trực tuyến' }) });

    await editorModal.locator('input[type="text"]').nth(0).fill('A'.repeat(501));
    await editorModal.getByRole('button', { name: 'Nộp đề cương' }).click();

    await expect(
      editorModal.getByText('Còn thông tin bắt buộc chưa điền, vui lòng kiểm tra các mục báo đỏ.'),
    ).toBeVisible();
    await expect(
      editorModal.getByText('Tiêu đề đề cương không được vượt quá 500 ký tự.'),
    ).toBeVisible();
    await expect(editorModal.getByText('Vui lòng nhập nội dung mục này.').first()).toBeVisible();
    await expect(
      editorModal.getByText('Cần ít nhất một công việc trong kế hoạch thực hiện.'),
    ).toBeVisible();
    expect(submitCalled).toBe(false);

    const rows = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM thesis_outline_history h
         JOIN thesis_outline o ON o.id = h.thesis_outline_id
         JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(Number(rows[0].total)).toBe(0);
  });

  // ==========================================================================
  // SECURITY TEST CASES (TC-SEC-020 .. TC-SEC-024)
  // ==========================================================================

  test(SEC020.title, { annotation: SEC020.annotation }, async ({ page, context, request }) => {
    await context.clearCookies();

    const myInfoPromise = page.waitForResponse(
      (r) => r.url().includes('/my-info') && r.request().method() === 'GET',
    );
    await page.goto('/student/outline');
    const myInfoRes = await myInfoPromise;
    expect(myInfoRes.status()).toBe(401);
    expect((await myInfoRes.json()).code).toBe(2000);

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Lịch sử nộp đề cương')).toHaveCount(0);

    const unauthGetRes = await request.get(`${getApiBaseUrl()}/outline/my-outline`);
    expect(unauthGetRes.status()).toBe(401);
    expect((await unauthGetRes.json()).code).toBe(2000);

    const unauthSubmitRes = await submitOutlineViaApi(request, null, {
      name: VALID_PDF_FILENAME,
      mimeType: 'application/pdf',
      buffer: createMinimalValidPdfBuffer('Unauthenticated Submit'),
    });
    expect(unauthSubmitRes.status).toBe(401);
    expect(unauthSubmitRes.body.code).toBe(2000);
  });

  test(SEC021.title, { annotation: SEC021.annotation }, async ({ page, context, request }) => {
    await setAuthCookie(context, envState.mainSupervisorToken);
    await page.goto('/student/outline');

    await expect(
      page.getByText('Tài khoản của bạn không có quyền truy cập cổng sinh viên.'),
    ).toBeVisible();

    const submitRes = await submitOutlineViaApi(request, envState.mainSupervisorToken, {
      name: VALID_PDF_FILENAME,
      mimeType: 'application/pdf',
      buffer: createMinimalValidPdfBuffer('Supervisor Forbidden Submit'),
    });
    expect(submitRes.status).toBe(403);
    expect(submitRes.body.code).toBe(2001);
    expect(submitRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');
  });

  test(SEC022.title, { annotation: SEC022.annotation }, async ({ page, context, request }) => {
    await setAuthCookie(context, envState.hodToken);
    await page.goto('/student/outline');

    await expect(
      page.getByText('Tài khoản của bạn không có quyền truy cập cổng sinh viên.'),
    ).toBeVisible();

    const submitRes = await submitOutlineViaApi(request, envState.hodToken, {
      name: VALID_PDF_FILENAME,
      mimeType: 'application/pdf',
      buffer: createMinimalValidPdfBuffer('Head Of Major Forbidden Submit'),
    });
    expect(submitRes.status).toBe(403);
    expect(submitRes.body.code).toBe(2001);
    expect(submitRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');
  });

  test(SEC023.title, { annotation: SEC023.annotation }, async ({ page, context, request }) => {
    const h = await provisionOutlineStudent(request, {
      profile: TEST_STUDENT_1,
      confirmTitle: OFFICIAL_TITLE_DEFAULT,
      assignReviewer: true,
    });

    const freshToken = await loginByEmail(request, TEST_STUDENT_1.email);
    const logoutRes = await apiCall(request, freshToken, 'POST', '/log-out');
    expect(logoutRes.status).toBe(200);

    await setAuthCookie(context, freshToken);
    const myInfoPromise = page.waitForResponse(
      (r) => r.url().includes('/my-info') && r.request().method() === 'GET',
    );
    await page.goto('/student/outline');
    const myInfoRes = await myInfoPromise;
    expect(myInfoRes.status()).toBe(401);
    expect((await myInfoRes.json()).code).toBe(2000);

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Lịch sử nộp đề cương')).toHaveCount(0);

    const getRes = await apiCall(request, freshToken, 'GET', '/outline/my-outline');
    expect(getRes.status).toBe(401);
    expect(getRes.body.code).toBe(2000);

    const submitRes = await submitOutlineViaApi(request, freshToken, {
      name: VALID_PDF_FILENAME,
      mimeType: 'application/pdf',
      buffer: createMinimalValidPdfBuffer('Logged Out Token Submit'),
    });
    expect(submitRes.status).toBe(401);
    expect(submitRes.body.code).toBe(2000);

    const rows = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM thesis_outline_history h
         JOIN thesis_outline o ON o.id = h.thesis_outline_id
         JOIN thesis_topic tt ON tt.id = o.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(Number(rows[0].total)).toBe(0);
  });

  test(SEC024.title, { annotation: SEC024.annotation }, async ({ page, context, request }) => {
    const owner = await provisionOutlineStudent(request, {
      profile: TEST_STUDENT_1,
      confirmTitle: OFFICIAL_TITLE_DEFAULT,
      assignReviewer: true,
      initialSubmission: {
        fileName: VALID_PDF_FILENAME,
      },
    });
    expect(owner.outlinePublicId).toBeTruthy();

    // Tạo sinh viên thứ 2 trong cùng ngành để kiểm tra IDOR (truy cập đề cương của sinh viên khác)
    await updateDeadline(request, envState.dlDangKy, 'DANG_KY_GVHD', 'OPEN');
    await releaseStudentCodeIfTaken(request, TEST_STUDENT_2);
    const createRes = await apiCall(request, envState.hodToken, 'POST', '/student', {
      data: {
        studentCode: TEST_STUDENT_2.studentCode,
        firstName: TEST_STUDENT_2.firstName,
        lastName: TEST_STUDENT_2.lastName,
        email: TEST_STUDENT_2.email,
        phone: TEST_STUDENT_2.phone,
        batch: TEST_STUDENT_2.batch,
        className: TEST_STUDENT_2.className,
        major: envState.majorName,
      },
    });
    expect(createRes.status).toBe(200);
    const listRes = await apiCall(request, envState.hodToken, 'GET', '/student', {
      params: { semesterId: envState.semesterPublicId, keyword: TEST_STUDENT_2.studentCode },
    });
    const st2 = (listRes.body?.data?.content ?? []).find(
      (s: any) => s.studentCode === TEST_STUDENT_2.studentCode,
    );
    expect(st2?.publicId).toBeTruthy();
    const student2Token = await loginByEmail(request, TEST_STUDENT_2.email);
    activeHandles.push({
      profile: TEST_STUDENT_2,
      studentPublicId: st2.publicId,
      studentToken: student2Token,
      topicId: 0,
      topicPublicId: '',
      outlinePublicId: null,
    });

    await openStudentOutlinePage(page, context, student2Token);
    await expect(page.locator('#submissions-table-body')).not.toContainText(VALID_PDF_FILENAME);

    const idorRes = await apiCall(
      request,
      student2Token,
      'GET',
      `/outline/${owner.outlinePublicId}`,
    );
    expect(idorRes.status).toBe(403);
    expect(idorRes.body.code).toBe(2001);
    expect(idorRes.body.message).toBe('Bạn không có quyền truy cập thông tin đề cương này');
  });
});
