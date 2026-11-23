import { test, expect, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';
import { defineItc, defineItcSec } from '../../../support/integration-test-case';
import { apiCall, getApiBaseUrl, loginByEmail } from '../../../support/api';
import { dbSelect } from '../../../support/db';

// ============================================================================
// ĐẶC TẢ TEST CASE (ITC001..ITC015 & TC-SEC-037..TC-SEC-041)
// Feature: report | Module/Sheet: NopBaoCao
// Role: Sinh viên (STUDENT)
// ============================================================================

const ITC001 = defineItc({
  id: 'ITC001',
  feature: 'report',
  module: 'NopBaoCao',
  sheet: 'NopBaoCao',
  fn: 'View Final Report Overview, Progress Report, and Submission History',
  description:
    'Verify that a student whose outline has been approved can view the final report overview, empty submission history, and enabled submission button when the deadline is open',
  procedure:
    '1. Log in as a Student ("Nguyễn Minh Anh").\n' +
    '2. Open the "Nộp báo cáo" screen ("/student/reports").',
  expected:
    '1. The API GET /report/my-report returns HTTP 200 with code = 1000, currentStage = "STAGE_3_OUTLINE_APPROVED", topicStatus = "IN_PROGRESS", status = null, lecturerName = "Trần Minh Tuấn", deadlineStatus = "OPEN", progressReport = null, and an empty histories list.\n' +
    '2. The database confirms student "9990000801" is at STAGE_3_OUTLINE_APPROVED with 0 final report records and 0 progress report records.\n' +
    '3. The UI displays topic name "Hệ thống phân tích dữ liệu học tập sinh viên", supervisor "Trần Minh Tuấn", deadline badge "Đang mở", empty notices "Bạn chưa nộp báo cáo Final nào trong học kỳ này.", "Giảng viên hướng dẫn chưa tải lên phiếu theo dõi tiến độ.", "Chưa có lần nộp báo cáo Final nào trong học kỳ này.", and an enabled "NỘP BÁO CÁO" button.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Nguyễn Minh Anh" ("9990000801") has topic "Hệ thống phân tích dữ liệu học tập sinh viên" at STAGE_3_OUTLINE_APPROVED (IN_PROGRESS) supervised by "Trần Minh Tuấn" ("GV999801"), with no final report and no progress report submitted yet.',
});

const ITC002 = defineItc({
  id: 'ITC002',
  feature: 'report',
  module: 'NopBaoCao',
  sheet: 'NopBaoCao',
  fn: 'View Final Report Overview, Progress Report, and Submission History',
  description:
    'Verify that the final report submission button is disabled when the student has not completed outline approval yet',
  procedure:
    '1. Log in as a Student ("Vũ Hoàng Nam") whose thesis topic is still at STAGE_2_TOPIC_CONFIRMED.\n' +
    '2. Open the "Nộp báo cáo" screen ("/student/reports").',
  expected:
    '1. The API GET /report/my-report returns HTTP 200 with code = 1000, currentStage = "STAGE_2_TOPIC_CONFIRMED", topicStatus = "IN_PROGRESS", status = null, and an empty histories list.\n' +
    '2. The database confirms student "9990000802"\'s thesis topic is at STAGE_2_TOPIC_CONFIRMED with 0 final report records.\n' +
    '3. The UI displays lock notice "Đề tài chưa hoàn thành phê duyệt đề cương, chưa thể nộp báo cáo Final." and disables the "NỘP BÁO CÁO" button.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Vũ Hoàng Nam" ("9990000802") is at STAGE_2_TOPIC_CONFIRMED (outline not approved yet) with main supervisor "Trần Minh Tuấn" ("GV999801").',
});

const ITC003 = defineItc({
  id: 'ITC003',
  feature: 'report',
  module: 'NopBaoCao',
  sheet: 'NopBaoCao',
  fn: 'View Final Report Overview, Progress Report, and Submission History',
  description:
    'Verify that a student can view the progress report file and note uploaded by the main supervisor on the final report screen',
  procedure:
    '1. Log in as a Student ("Nguyễn Minh Anh") whose main supervisor has uploaded a progress report.\n' +
    '2. Open the "Nộp báo cáo" screen ("/student/reports").',
  expected:
    '1. The API GET /report/my-report returns HTTP 200 with code = 1000, including progressReport with supervisorName = "Trần Minh Tuấn", supervisorNote = "Sinh viên hoàn thành tốt tiến độ các tuần", and progressFile containing "64HTTT99_9990000801_TienDo.pdf".\n' +
    '2. The database confirms 1 progress report record exists for student "9990000801" with supervisor_note = "Sinh viên hoàn thành tốt tiến độ các tuần" and progress_file containing "64HTTT99_9990000801_TienDo.pdf".\n' +
    '3. The UI displays the "Phiếu theo dõi tiến độ" card with file link containing "64HTTT99_9990000801_TienDo.pdf", supervisor "Trần Minh Tuấn", and note "Sinh viên hoàn thành tốt tiến độ các tuần".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Nguyễn Minh Anh" ("9990000801") is at STAGE_3_OUTLINE_APPROVED and main supervisor "Trần Minh Tuấn" ("GV999801") has uploaded progress report "64HTTT99_9990000801_TienDo.pdf" with note "Sinh viên hoàn thành tốt tiến độ các tuần".',
});

const ITC004 = defineItc({
  id: 'ITC004',
  feature: 'report',
  module: 'NopBaoCao',
  sheet: 'NopBaoCao',
  fn: 'View Final Report Overview, Progress Report, and Submission History',
  description:
    'Verify that a student whose final report requires changes can view plagiarism rate, plagiarism proof file, supervisor feedback, and keep the resubmit button enabled',
  procedure:
    '1. Log in as a Student ("Nguyễn Minh Anh") whose final report was reviewed as REQUEST_CHANGES.\n' +
    '2. Open the "Nộp báo cáo" screen ("/student/reports").',
  expected:
    '1. The API GET /report/my-report returns HTTP 200 with code = 1000, status = "REQUEST_CHANGES", plagiarismRate = 18.5, supervisorFeedback = "Cần bổ sung phần đánh giá thực nghiệm và trích dẫn", and 1 history record in REQUEST_CHANGES status.\n' +
    '2. The database confirms student "9990000801"\'s final report and its history record store REQUEST_CHANGES status, plagiarism_rate = 18.5, and supervisor feedback "Cần bổ sung phần đánh giá thực nghiệm và trích dẫn".\n' +
    '3. The UI displays status badge "Yêu cầu chỉnh sửa", plagiarism rate "18.5%", proof file link containing "64HTTT99_9990000801_DaoVan.pdf", supervisor feedback "Cần bổ sung phần đánh giá thực nghiệm và trích dẫn", 1 row in "Lịch sử nộp báo cáo", and an enabled "NỘP LẠI" button.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Nguyễn Minh Anh" ("9990000801") submitted a final report; main supervisor "GV999801" uploaded a progress report and reviewed the final report as REQUEST_CHANGES with plagiarismRate = 18.5, proof file "64HTTT99_9990000801_DaoVan.pdf", and feedback "Cần bổ sung phần đánh giá thực nghiệm và trích dẫn".',
});

const ITC005 = defineItc({
  id: 'ITC005',
  feature: 'report',
  module: 'NopBaoCao',
  sheet: 'NopBaoCao',
  fn: 'View Final Report Overview, Progress Report, and Submission History',
  description:
    'Verify that a student whose final report has been approved sees the approved status, lock notice, and disabled resubmit button',
  procedure:
    '1. Log in as a Student ("Nguyễn Minh Anh") whose final report has been approved.\n' +
    '2. Open the "Nộp báo cáo" screen ("/student/reports").',
  expected:
    '1. The API GET /report/my-report returns HTTP 200 with code = 1000, status = "APPROVED", currentStage = "STAGE_4_REPORT_APPROVED", plagiarismRate = 12.5, and supervisorFeedback = "Báo cáo đạt yêu cầu, đủ điều kiện ra hội đồng".\n' +
    '2. The database confirms student "9990000801"\'s final report status is APPROVED and thesis topic has advanced to STAGE_4_REPORT_APPROVED.\n' +
    '3. The UI displays lock notice "Báo cáo Final đã được phê duyệt đạt, không thể nộp lại.", status badge "Đã duyệt đạt", plagiarism rate "12.5%", and disables the "NỘP LẠI" button.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Nguyễn Minh Anh" ("9990000801") submitted a final report and main supervisor "GV999801" approved it with plagiarismRate = 12.5 and feedback "Báo cáo đạt yêu cầu, đủ điều kiện ra hội đồng".',
});

const ITC006 = defineItc({
  id: 'ITC006',
  feature: 'report',
  module: 'NopBaoCao',
  sheet: 'NopBaoCao',
  fn: 'View Final Report Overview, Progress Report, and Submission History',
  description:
    'Verify that a student whose final report was rejected and thesis disqualified sees the disqualification banner and disabled resubmit button',
  procedure:
    '1. Log in as a Student ("Nguyễn Minh Anh") whose final report was rejected during the extended grading period.\n' +
    '2. Open the "Nộp báo cáo" screen ("/student/reports").',
  expected:
    '1. The API GET /report/my-report returns HTTP 200 with code = 1000, status = "REJECTED", topicStatus = "DISQUALIFIED", and disqualificationReason = "Không hoàn thành phê duyệt báo cáo đúng hạn".\n' +
    '2. The database confirms student "9990000801"\'s final report status is REJECTED and thesis topic status is DISQUALIFIED.\n' +
    '3. The UI displays disqualification alert "Đề tài đã bị đình chỉ (DISQUALIFIED)", reason "Không hoàn thành phê duyệt báo cáo đúng hạn", status badge "Không đạt", and disables the "NỘP LẠI" button.',
  precondition:
    '1. Student "Nguyễn Minh Anh" ("9990000801") submitted a final report while the deadline was open, and main supervisor "GV999801" rejected it during the EXTENDED grading period.',
});

const ITC007 = defineItc({
  id: 'ITC007',
  feature: 'report',
  module: 'NopBaoCao',
  sheet: 'NopBaoCao',
  fn: 'View Final Report Overview, Progress Report, and Submission History',
  description:
    'Verify that the final report submission button is disabled when the report deadline is closed, not started, or in extended grading period',
  procedure:
    '1. Log in as a Student ("Nguyễn Minh Anh") and open the "Nộp báo cáo" screen while the deadline is CLOSED.\n' +
    '2. Update the deadline to NOT_STARTED and reload the "Nộp báo cáo" screen.\n' +
    '3. Update the deadline to EXTENDED and reload the "Nộp báo cáo" screen.',
  expected:
    '1. When CLOSED, GET /report/my-report returns HTTP 200 with code = 1000 and deadlineStatus = "CLOSED"; the UI displays badge "Đã hết hạn" and disables the "NỘP BÁO CÁO" button.\n' +
    '2. When NOT_STARTED, GET /report/my-report returns HTTP 200 with code = 1000 and deadlineStatus = "NOT_STARTED"; the UI displays badge "Chưa mở" and disables the "NỘP BÁO CÁO" button.\n' +
    '3. When EXTENDED, GET /report/my-report returns HTTP 200 with code = 1000 and deadlineStatus = "EXTENDED"; the UI displays "Đã hết hạn nộp của sinh viên — Đang trong thời gian giảng viên chấm." and disables the "NỘP BÁO CÁO" button.',
  precondition:
    '1. Student "Nguyễn Minh Anh" ("9990000801") is at STAGE_3_OUTLINE_APPROVED.\n' +
    '2. The "NOP_BAO_CAO_VA_PHIEU_THEO_DOI" deadline is configured sequentially as CLOSED, NOT_STARTED, and EXTENDED.',
});

const ITC008 = defineItc({
  id: 'ITC008',
  feature: 'report',
  module: 'NopBaoCao',
  sheet: 'NopBaoCao',
  fn: 'Submit and Resubmit Final Report',
  description:
    'Verify that a student can successfully submit a valid PDF final report for the first time',
  procedure:
    '1. Log in as a Student ("Nguyễn Minh Anh") and open the "Nộp báo cáo" screen.\n' +
    '2. Click "NỘP BÁO CÁO", select the valid PDF file "64HTTT99_9990000801_NguyenMinhAnh.pdf", and click "Xác nhận nộp".',
  expected:
    '1. The API POST /report/submit returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Nộp báo cáo Final thành công".\n' +
    '3. The database creates 1 final report record for student "9990000801" in PENDING status with a PDF file URL, creates 1 PENDING final report history record, and stores a notification for main supervisor "GV999801".\n' +
    '4. The UI shows toast "Nộp báo cáo Final thành công!", closes the "Nộp báo cáo Final" modal, changes the action button label to "NỘP LẠI", and displays 1 row in "Lịch sử nộp báo cáo" with file name containing "64HTTT99_9990000801_NguyenMinhAnh.pdf" and status "Đã nộp, chờ nhận xét".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Nguyễn Minh Anh" ("9990000801") is at STAGE_3_OUTLINE_APPROVED with main supervisor "Trần Minh Tuấn" ("GV999801") and has not submitted any final report yet.',
});

const ITC009 = defineItc({
  id: 'ITC009',
  feature: 'report',
  module: 'NopBaoCao',
  sheet: 'NopBaoCao',
  fn: 'Submit and Resubmit Final Report',
  description:
    'Verify that resubmitting a valid DOCX final report while the current submission is still PENDING updates the existing pending history record in place',
  procedure:
    '1. Log in as a Student ("Nguyễn Minh Anh") who already has a PENDING PDF final report submission, and open the "Nộp báo cáo" screen.\n' +
    '2. Click "NỘP LẠI", select the valid DOCX file "64HTTT99_9990000801_NguyenMinhAnh.docx", and click "Xác nhận nộp".',
  expected:
    '1. The API POST /report/submit returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Nộp báo cáo Final thành công".\n' +
    '3. The database keeps student "9990000801"\'s final report in PENDING status with the updated DOCX file URL and retains exactly 1 PENDING history record updated in place without creating a duplicate row.\n' +
    '4. The UI shows toast "Nộp báo cáo Final thành công!" and updates the single row in "Lịch sử nộp báo cáo" to display "64HTTT99_9990000801_NguyenMinhAnh.docx" with status "Đã nộp, chờ nhận xét".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Nguyễn Minh Anh" ("9990000801") has 1 PENDING final report submission ("64HTTT99_9990000801_NguyenMinhAnh.pdf").',
});

const ITC010 = defineItc({
  id: 'ITC010',
  feature: 'report',
  module: 'NopBaoCao',
  sheet: 'NopBaoCao',
  fn: 'Submit and Resubmit Final Report',
  description:
    'Verify that a student can resubmit a revised PDF final report after REQUEST_CHANGES, creating a second history record and resetting current review fields',
  procedure:
    '1. Log in as a Student ("Nguyễn Minh Anh") whose final report is in REQUEST_CHANGES status with plagiarism rate and supervisor feedback, and open the "Nộp báo cáo" screen.\n' +
    '2. Click "NỘP LẠI", select the revised file "64HTTT99_9990000801_NguyenMinhAnh.pdf", and click "Xác nhận nộp".',
  expected:
    '1. The API POST /report/submit returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Nộp báo cáo Final thành công".\n' +
    '3. The database transitions the main final report back to PENDING with plagiarism_rate = NULL, plagiarism_file = NULL, supervisor_feedback = NULL, and reviewed_at = NULL, while final report history stores 2 records (the newest PENDING and the previous REQUEST_CHANGES preserving plagiarism_rate = 18.5 and supervisor feedback).\n' +
    '4. The UI shows toast "Nộp báo cáo Final thành công!", displays "Chưa chấm" on the current report card, and displays 2 rows in "Lịch sử nộp báo cáo" with the newest row in status "Đã nộp, chờ nhận xét" and the older row in status "Yêu cầu chỉnh sửa".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Nguyễn Minh Anh" ("9990000801") has 1 final report reviewed as REQUEST_CHANGES by main supervisor "GV999801" with plagiarismRate = 18.5 and feedback "Cần chỉnh sửa lại chương 3 và biểu đồ kết quả".',
});

const ITC011 = defineItc({
  id: 'ITC011',
  feature: 'report',
  module: 'NopBaoCao',
  sheet: 'NopBaoCao',
  fn: 'Submit and Resubmit Final Report',
  description:
    'Verify that selecting an unsupported file format (.txt) is blocked by validation and does not create a final report submission',
  procedure:
    '1. Log in as a Student ("Nguyễn Minh Anh") and open the "Nộp báo cáo" screen.\n' +
    '2. Click "NỘP BÁO CÁO", select the invalid file "64HTTT99_9990000801_NguyenMinhAnh.txt", and click "Xác nhận nộp".',
  expected:
    '1. No request is sent to POST /report/submit.\n' +
    '2. The modal displays validation error "File tải lên chỉ nhận định dạng .doc, .docx hoặc .pdf.".\n' +
    '3. The database contains 0 final report records for student "9990000801".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Nguyễn Minh Anh" ("9990000801") is at STAGE_3_OUTLINE_APPROVED with no final report submissions.',
});

const ITC012 = defineItc({
  id: 'ITC012',
  feature: 'report',
  module: 'NopBaoCao',
  sheet: 'NopBaoCao',
  fn: 'Submit and Resubmit Final Report',
  description:
    'Verify that selecting a PDF file whose name violates the Tenlop_MaSV_HoVaTen convention is blocked by validation',
  procedure:
    '1. Log in as a Student ("Nguyễn Minh Anh") and open the "Nộp báo cáo" screen.\n' +
    '2. Click "NỘP BÁO CÁO", select the improperly named file "BaoCaoFinal.pdf", and click "Xác nhận nộp".',
  expected:
    '1. No request is sent to POST /report/submit.\n' +
    '2. The modal displays validation error "Tên file không đúng định dạng! Vui lòng đổi tên file theo định dạng Tenlop_MaSV_HoVaTen (VD: DHKTPM17A_22110001_NguyenVanAn.pdf)".\n' +
    '3. The database contains 0 final report records for student "9990000801".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Nguyễn Minh Anh" ("9990000801") is at STAGE_3_OUTLINE_APPROVED with no final report submissions.',
});

const ITC013 = defineItc({
  id: 'ITC013',
  feature: 'report',
  module: 'NopBaoCao',
  sheet: 'NopBaoCao',
  fn: 'Submit and Resubmit Final Report',
  description:
    'Verify that selecting an empty (0-byte) file or a file of 10 MB or larger is blocked by validation',
  procedure:
    '1. Log in as a Student ("Nguyễn Minh Anh") and open the "Nộp báo cáo" screen.\n' +
    '2. Click "NỘP BÁO CÁO", select a 0-byte file "64HTTT99_9990000801_NguyenMinhAnh.pdf", and click "Xác nhận nộp".\n' +
    '3. Select a 10 MB file "64HTTT99_9990000801_NguyenMinhAnh.pdf" and click "Xác nhận nộp".',
  expected:
    '1. No request is sent to POST /report/submit in either attempt.\n' +
    '2. The modal displays "File tải lên không được để trống." for the 0-byte file and "File tải lên phải nhỏ hơn 10MB." for the 10 MB file.\n' +
    '3. The database contains 0 final report records for student "9990000801".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Nguyễn Minh Anh" ("9990000801") is at STAGE_3_OUTLINE_APPROVED with no final report submissions.',
});

const ITC014 = defineItc({
  id: 'ITC014',
  feature: 'report',
  module: 'NopBaoCao',
  sheet: 'NopBaoCao',
  fn: 'Submit and Resubmit Final Report',
  description:
    'Verify that submitting a final report file is blocked when the submission deadline closes concurrently before clicking submit',
  procedure:
    '1. Log in as a Student ("Nguyễn Minh Anh"), open the "Nộp báo cáo" screen while the deadline is open, click "NỘP BÁO CÁO", and select "64HTTT99_9990000801_NguyenMinhAnh.pdf".\n' +
    '2. The "NOP_BAO_CAO_VA_PHIEU_THEO_DOI" deadline transitions to COMPLETED before clicking submit.\n' +
    '3. Click "Xác nhận nộp".',
  expected:
    '1. The API POST /report/submit returns HTTP 403 with code = 3095.\n' +
    '2. The response message is "Thời hạn sinh viên nộp báo cáo chưa mở hoặc đã kết thúc".\n' +
    '3. The database contains 0 final report records for student "9990000801".\n' +
    '4. The modal remains open and displays server error alert "Thời hạn sinh viên nộp báo cáo chưa mở hoặc đã kết thúc".',
  precondition:
    '1. Student "Nguyễn Minh Anh" ("9990000801") opens the final report modal while the deadline is OPEN, and the deadline transitions to COMPLETED before submission.',
});

const ITC015 = defineItc({
  id: 'ITC015',
  feature: 'report',
  module: 'NopBaoCao',
  sheet: 'NopBaoCao',
  fn: 'Submit and Resubmit Final Report',
  description:
    'Verify that resubmitting a final report file is blocked when the report is approved concurrently before clicking submit',
  procedure:
    '1. Log in as a Student ("Nguyễn Minh Anh") with a PENDING final report, open the "Nộp báo cáo" screen, click "NỘP LẠI", and select "64HTTT99_9990000801_NguyenMinhAnh.docx".\n' +
    '2. Concurrently, main supervisor "GV999801" approves the pending final report.\n' +
    '3. Click "Xác nhận nộp".',
  expected:
    '1. The API POST /report/submit returns HTTP 409 with code = 3091.\n' +
    '2. The response message is "Báo cáo đã được phê duyệt hoặc đã có kết quả cuối cùng, không thể nộp lại".\n' +
    '3. The database preserves the APPROVED final report status and retains only the 1 APPROVED history record.\n' +
    '4. The modal remains open and displays server error alert "Báo cáo đã được phê duyệt hoặc đã có kết quả cuối cùng, không thể nộp lại".',
  precondition:
    '1. Student "Nguyễn Minh Anh" ("9990000801") has 1 PENDING final report submission and a progress report, and opens the resubmit modal before main supervisor "GV999801" approves the report.',
});

// ============================================================================
// SECURITY TEST CASES (TC-SEC-037 .. TC-SEC-041)
// ============================================================================

const SEC037 = defineItcSec({
  id: 'TC-SEC-037',
  feature: 'report',
  module: 'NopBaoCao',
  sheet: 'NopBaoCao',
  scenario: 'An unauthenticated user opens the Student final report screen directly and calls student report APIs',
  roleSession: 'Unauthenticated (Anonymous)',
  technique: 'EP',
  given: 'The browser has no active login session (no access_token cookie)',
  when: 'Open "/student/reports" directly on the Student portal and call GET /report/my-report, GET /report/my-progress-report, and POST /report/submit',
  then: 'GET /my-info, GET /report/my-report, GET /report/my-progress-report, and POST /report/submit return HTTP 401 with code = 2000; the UI automatically redirects to "/login" and displays no final report data',
});

const SEC038 = defineItcSec({
  id: 'TC-SEC-038',
  feature: 'report',
  module: 'NopBaoCao',
  sheet: 'NopBaoCao',
  scenario: 'A supervisor accesses the Student final report screen and calls POST /report/submit',
  roleSession: 'Supervisor (SUPERVISOR), logged in',
  technique: 'EP',
  given: 'Logged in with a Supervisor account (without STUDENT role or SUBMIT_REPORT authority)',
  when: 'Open "/student/reports" directly on the Student portal and call POST /report/submit with a valid PDF file',
  then: 'The UI blocks access with message "Tài khoản của bạn không có quyền truy cập cổng sinh viên."; POST /report/submit returns HTTP 403 with code = 2001 and message "Bạn không có quyền truy cập (access denied)"',
});

const SEC039 = defineItcSec({
  id: 'TC-SEC-039',
  feature: 'report',
  module: 'NopBaoCao',
  sheet: 'NopBaoCao',
  scenario: 'A Head of Major accesses the Student final report screen and calls POST /report/submit',
  roleSession: 'Head of Major (HEAD_OF_MAJOR), logged in',
  technique: 'EP',
  given: 'Logged in with a Head of Major account (without STUDENT role or SUBMIT_REPORT authority)',
  when: 'Open "/student/reports" directly on the Student portal and call POST /report/submit with a valid PDF file',
  then: 'The UI blocks access with message "Tài khoản của bạn không có quyền truy cập cổng sinh viên."; POST /report/submit returns HTTP 403 with code = 2001 and message "Bạn không có quyền truy cập (access denied)"',
});

const SEC040 = defineItcSec({
  id: 'TC-SEC-040',
  feature: 'report',
  module: 'NopBaoCao',
  sheet: 'NopBaoCao',
  scenario: 'A student session with a logged-out token accesses the final report screen and calls student report APIs',
  roleSession: 'Student (STUDENT), logged-out token',
  technique: 'STATE_TRANSITION',
  given: 'The student has logged out via POST /log-out so the token is invalidated, while the browser still sends the old access_token cookie',
  when: 'Open "/student/reports" and call GET /report/my-report and POST /report/submit with the logged-out token',
  then: 'GET /my-info, GET /report/my-report, and POST /report/submit return HTTP 401 with code = 2000; the UI redirects to "/login", displays no report data, and 0 final report records are created in the database',
});

const SEC041 = defineItcSec({
  id: 'TC-SEC-041',
  feature: 'report',
  module: 'NopBaoCao',
  sheet: 'NopBaoCao',
  scenario: 'A student attempts to view another student\'s final report detail by publicId (IDOR check)',
  roleSession: 'Student (STUDENT), logged in as non-owner',
  technique: 'EP',
  given: 'Student "Nguyễn Minh Anh" ("9990000801") has a final report record with a valid publicId; another student "Vũ Hoàng Nam" ("9990000802") is logged in',
  when: 'Student "Vũ Hoàng Nam" opens "/student/reports" and calls GET /report/{publicId} using student "9990000801"\'s final report publicId',
  then: 'Student "Vũ Hoàng Nam"\'s own screen does not display student "9990000801"\'s report data, and GET /report/{publicId} returns HTTP 403 with code = 2001 and message "Bạn không có quyền truy cập thông tin báo cáo này"',
});

// ============================================================================
// TẠO FILE MẪU HỢP LỆ (PDF / DOCX / PDF ĐẠO VĂN TIẾNG VIỆT UNICODE)
// ============================================================================

const OFFICIAL_TITLE_DEFAULT = 'Hệ thống phân tích dữ liệu học tập sinh viên';
const VALID_PDF_FILENAME = '64HTTT99_9990000801_NguyenMinhAnh.pdf';
const VALID_DOCX_FILENAME = '64HTTT99_9990000801_NguyenMinhAnh.docx';
const PROGRESS_PDF_FILENAME = '64HTTT99_9990000801_TienDo.pdf';
const PLAGIARISM_PDF_FILENAME = '64HTTT99_9990000801_DaoVan.pdf';
const INVALID_EXT_FILENAME = '64HTTT99_9990000801_NguyenMinhAnh.txt';
const INVALID_NAME_FILENAME = 'BaoCaoFinal.pdf';

function createMinimalValidPdfBuffer(text = 'TLU GPMS Test Final Report'): Buffer {
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

/**
 * Tạo PDF có ToUnicode CMap để PDFBox bóc tách chính xác tiếng Việt có dấu
 * (khớp Regex trong PlagiarismReportExtractorService khi chuẩn bị dữ liệu review qua API).
 */
function createPlagiarismPdfBuffer(documentName: string, similarityScore: number): Buffer {
  const scoreStr = String(similarityScore);
  const lines = [
    'BÁO CÁO KIỂM TRA TRÙNG LẶP',
    `Tên tài liệu: ${documentName}`,
    `Điểm trùng lặp: ${scoreStr}`,
    `Có ${scoreStr}% nội dung trùng lặp`,
  ];

  const charToCode = new Map<string, number>();
  charToCode.set(' ', 0x20);
  let nextCode = 0x21;
  for (const line of lines) {
    for (const ch of line) {
      if (!charToCode.has(ch)) {
        charToCode.set(ch, nextCode++);
      }
    }
  }

  const bfCharEntries: string[] = [];
  for (const [ch, code] of charToCode.entries()) {
    const codeHex = code.toString(16).toUpperCase().padStart(2, '0');
    const unicodeHex = ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
    bfCharEntries.push(`<${codeHex}> <${unicodeHex}>`);
  }

  const cmapStream =
    '/CIDInit /ProcSet findresource begin\n' +
    '12 dict begin\n' +
    'begincmap\n' +
    '/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n' +
    '/CMapName /Adobe-Identity-UCS def\n' +
    '/CMapType 2 def\n' +
    '1 begincodespacerange\n' +
    '<00> <FF>\n' +
    'endcodespacerange\n' +
    `${bfCharEntries.length} beginbfchar\n` +
    `${bfCharEntries.join('\n')}\n` +
    'endbfchar\n' +
    'endcmap\n' +
    'CMapName currentdict /CMap defineresource pop\n' +
    'end\n' +
    'end\n';

  const contentCommands: string[] = ['BT', '/F1 12 Tf', '72 740 Td'];
  lines.forEach((line, idx) => {
    if (idx > 0) contentCommands.push('0 -24 Td');
    const hexString = Array.from(line)
      .map((ch) => charToCode.get(ch)!.toString(16).toUpperCase().padStart(2, '0'))
      .join('');
    contentCommands.push(`<${hexString}> Tj`);
  });
  contentCommands.push('ET');
  const contentStream = contentCommands.join('\n');

  const lastChar = nextCode - 1;
  const widths = Array.from({ length: lastChar - 32 + 1 }, () => '500').join(' ');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${Buffer.byteLength(contentStream, 'utf8')} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
    `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /FirstChar 32 /LastChar ${lastChar} /Widths [${widths}] /ToUnicode 6 0 R >>\nendobj\n`,
    `6 0 obj\n<< /Length ${Buffer.byteLength(cmapStream, 'utf8')} >>\nstream\n${cmapStream}\nendstream\nendobj\n`,
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

function createMinimalValidDocxBuffer(text = 'TLU GPMS Test Final Report DOCX'): Buffer {
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
  teacherCode: 'GV999801',
  firstName: 'Trần Minh',
  lastName: 'Tuấn',
  fullName: 'Trần Minh Tuấn',
  email: 'itc.svreport.gv.999801@tlu.edu.vn',
  phone: '0989980801',
  academicTitle: 'TS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_REVIEWER = {
  teacherCode: 'GV999802',
  firstName: 'Phạm Thị',
  lastName: 'Lan',
  fullName: 'Phạm Thị Lan',
  email: 'itc.svreport.gv.999802@tlu.edu.vn',
  phone: '0989980802',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_ARCHIVE_SUPERVISOR = {
  teacherCode: 'GV999899',
  firstName: 'Lê Lưu',
  lastName: 'Trữ',
  fullName: 'Lê Lưu Trữ',
  email: 'itc.svreport.gv.999899@tlu.edu.vn',
  phone: '0989980899',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_STUDENT_1 = {
  studentCode: '9990000801',
  firstName: 'Nguyễn Minh',
  lastName: 'Anh',
  fullName: 'Nguyễn Minh Anh',
  email: 'itc.svreport.sv.9990000801@gmail.com',
  phone: '0989980101',
  batch: 'K64',
  className: '64HTTT99',
};

const TEST_STUDENT_2 = {
  studentCode: '9990000802',
  firstName: 'Vũ Hoàng',
  lastName: 'Nam',
  fullName: 'Vũ Hoàng Nam',
  email: 'itc.svreport.sv.9990000802@gmail.com',
  phone: '0989980102',
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

interface ProvisionReportStudentSpec {
  profile: StudentProfile;
  approveOutline?: boolean;
  progressReport?: {
    fileName?: string;
    supervisorNote?: string;
  };
  initialFinalReport?: {
    fileName?: string;
    mimeType?: string;
    buffer?: Buffer;
    review?: {
      decision: 'APPROVED' | 'REQUEST_CHANGES' | 'REJECTED';
      plagiarismRate: number;
      feedback: string;
    };
  };
}

interface ProvisionedReportStudentHandle {
  profile: StudentProfile;
  studentPublicId: string;
  studentToken: string;
  topicId: number;
  topicPublicId: string;
  finalReportPublicId: string | null;
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
  mainSupervisorAccountId: number;
  mainSupervisorPublicId: string;
  mainSupervisorToken: string;
  reviewerId: number;
  reviewerPublicId: string;
  reviewerToken: string;
  archiveSupervisorId: number;
  archiveSupervisorPublicId: string;
  dlDangKy: DeadlineSnapshot;
  dlTbmChot: DeadlineSnapshot;
  dlDeCuong: DeadlineSnapshot;
  dlBaoCao: DeadlineSnapshot;
}

let envState: TestEnvState;
let activeHandles: ProvisionedReportStudentHandle[] = [];
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

async function submitMultipartViaApi(
  request: APIRequestContext,
  method: 'POST' | 'PUT',
  endpoint: string,
  token: string | null,
  multipart: Record<string, any>,
): Promise<{ status: number; body: any }> {
  const url = `${getApiBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers: Record<string, string> = {};
  if (token) {
    headers.Cookie = `access_token=${token}`;
  }
  const res = await request.fetch(url, {
    method,
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

async function submitFinalReportViaApi(
  request: APIRequestContext,
  token: string | null,
  file: { name: string; mimeType: string; buffer: Buffer },
): Promise<{ status: number; body: any }> {
  return submitMultipartViaApi(request, 'POST', '/report/submit', token, {
    file: {
      name: file.name,
      mimeType: file.mimeType,
      buffer: file.buffer,
    },
  });
}

async function submitProgressReportViaApi(
  request: APIRequestContext,
  supervisorToken: string,
  topicPublicId: string,
  fileName: string,
  supervisorNote?: string,
) {
  const multipart: Record<string, any> = {
    topicPublicId,
    file: {
      name: fileName,
      mimeType: 'application/pdf',
      buffer: createMinimalValidPdfBuffer('TLU GPMS Progress Report'),
    },
  };
  if (supervisorNote !== undefined) {
    multipart.supervisorNote = supervisorNote;
  }
  const res = await submitMultipartViaApi(
    request,
    'POST',
    '/report/progress-report',
    supervisorToken,
    multipart,
  );
  if (res.status !== 200) {
    throw new Error(`Không thể nộp phiếu theo dõi tiến độ: ${JSON.stringify(res.body)}`);
  }
}

async function reviewFinalReportViaApi(
  request: APIRequestContext,
  supervisorToken: string,
  reportPublicId: string,
  studentDocName: string,
  plagiarismRate: number,
  decision: 'APPROVED' | 'REQUEST_CHANGES' | 'REJECTED',
  feedback: string,
) {
  const res = await submitMultipartViaApi(
    request,
    'PUT',
    `/report/${reportPublicId}/review`,
    supervisorToken,
    {
      plagiarismRate: String(plagiarismRate),
      decision,
      feedback,
      plagiarismFile: {
        name: PLAGIARISM_PDF_FILENAME,
        mimeType: 'application/pdf',
        buffer: createPlagiarismPdfBuffer(studentDocName, plagiarismRate),
      },
    },
  );
  if (res.status !== 200) {
    throw new Error(`Không thể thẩm định báo cáo (${decision}): ${JSON.stringify(res.body)}`);
  }
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
  const allDeadlines: any[] = [
    ...(dlRes.body?.data?.giaoNhanDeadlines ?? []),
    ...(dlRes.body?.data?.thucHienDeadlines ?? []),
    ...(dlRes.body?.data?.danhGiaDeadlines ?? []),
  ];
  const found = allDeadlines.find((d) => d.code === code);
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
      studentCode: `9998${suffix.slice(-6)}`,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: `itc.arch.svreport.${suffix}@gmail.com`,
      phone: `0978${suffix.slice(-6)}`,
      batch: profile.batch,
      className: profile.className,
    },
  });
}

async function provisionReportStudent(
  request: APIRequestContext,
  spec: ProvisionReportStudentSpec,
): Promise<ProvisionedReportStudentHandle> {
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

  // Bước 1: Đăng ký GVHD -> GVHD duyệt -> TBM chốt khóa -> STAGE_1_ADVISOR_ASSIGNED
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
    throw new Error(`GVHD không thể duyệt đơn ĐK: ${JSON.stringify(approveRegRes.body)}`);
  }

  const handle: ProvisionedReportStudentHandle = {
    profile: spec.profile,
    studentPublicId: matched.publicId,
    studentToken,
    topicId: 0,
    topicPublicId: '',
    finalReportPublicId: null,
  };
  activeHandles.push(handle);

  await setLockStatus(request, true);
  await setLockStatus(request, false);
  await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'OPEN');
  await updateDeadline(request, envState.dlBaoCao, 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI', 'OPEN');

  // Bước 2: Chốt tên đề tài -> GVHD duyệt -> STAGE_2_TOPIC_CONFIRMED
  const confirmRes = await apiCall(request, studentToken, 'POST', '/topic/confirm-title', {
    data: { newName: OFFICIAL_TITLE_DEFAULT },
  });
  if (confirmRes.status !== 200) {
    throw new Error(`SV không thể chốt tên đề tài: ${JSON.stringify(confirmRes.body)}`);
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
    throw new Error(`GVHD không thể duyệt tên đề tài: ${JSON.stringify(approveTitleRes.body)}`);
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

  // Bước 3 (tùy chọn): Phân công GVNX -> SV nộp đề cương -> GVNX duyệt -> STAGE_3_OUTLINE_APPROVED
  if (spec.approveOutline !== false) {
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
      throw new Error(`TBM không thể phân công GVNX: ${JSON.stringify(assignRes.body)}`);
    }
    envState.reviewerToken = await loginByEmail(request, TEST_REVIEWER.email);

    const outlineFileName = `${spec.profile.className}_${spec.profile.studentCode}_DeCuong.pdf`;
    const subOutlineRes = await submitMultipartViaApi(
      request,
      'POST',
      '/outline/submit',
      studentToken,
      {
        file: {
          name: outlineFileName,
          mimeType: 'application/pdf',
          buffer: createMinimalValidPdfBuffer('Approved Outline'),
        },
      },
    );
    if (subOutlineRes.status !== 200) {
      throw new Error(`Không thể nộp đề cương mẫu: ${JSON.stringify(subOutlineRes.body)}`);
    }
    const myOutlineRes = await apiCall(request, studentToken, 'GET', '/outline/my-outline');
    const outlinePublicId = myOutlineRes.body?.data?.publicId;
    const revOutlineRes = await apiCall(
      request,
      envState.reviewerToken,
      'PUT',
      `/outline/${outlinePublicId}/review`,
      {
        data: {
          decision: 'APPROVED',
          feedback: 'Đề cương đạt yêu cầu để làm báo cáo Final',
        },
      },
    );
    if (revOutlineRes.status !== 200) {
      throw new Error(`Không thể duyệt đề cương mẫu: ${JSON.stringify(revOutlineRes.body)}`);
    }
  }

  // Bước 4 (tùy chọn): GVHD chính nộp Phiếu theo dõi tiến độ
  if (spec.progressReport || spec.initialFinalReport?.review) {
    await submitProgressReportViaApi(
      request,
      envState.mainSupervisorToken,
      handle.topicPublicId,
      spec.progressReport?.fileName ?? PROGRESS_PDF_FILENAME,
      spec.progressReport?.supervisorNote ?? 'Sinh viên hoàn thành tốt tiến độ các tuần',
    );
  }

  // Bước 5 (tùy chọn): SV nộp sẵn Báo cáo Final + GVHD thẩm định
  if (spec.initialFinalReport) {
    const fileName = spec.initialFinalReport.fileName ?? VALID_PDF_FILENAME;
    const mimeType = spec.initialFinalReport.mimeType ?? 'application/pdf';
    const buffer = spec.initialFinalReport.buffer ?? createMinimalValidPdfBuffer('Initial Final Report');

    const subRes = await submitFinalReportViaApi(request, studentToken, {
      name: fileName,
      mimeType,
      buffer,
    });
    if (subRes.status !== 200) {
      throw new Error(`Không thể nộp sẵn báo cáo Final: ${JSON.stringify(subRes.body)}`);
    }

    const myReportRes = await apiCall(request, studentToken, 'GET', '/report/my-report');
    handle.finalReportPublicId = myReportRes.body?.data?.publicId ?? null;

    if (spec.initialFinalReport.review && handle.finalReportPublicId) {
      const { decision, plagiarismRate, feedback } = spec.initialFinalReport.review;
      if (decision === 'REJECTED') {
        await updateDeadline(request, envState.dlBaoCao, 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI', 'EXTENDED');
      }
      await reviewFinalReportViaApi(
        request,
        envState.mainSupervisorToken,
        handle.finalReportPublicId,
        fileName,
        plagiarismRate,
        decision,
        feedback,
      );
      if (decision === 'REJECTED') {
        await updateDeadline(request, envState.dlBaoCao, 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI', 'OPEN');
      }
    }
  }

  return handle;
}

async function cleanupActiveStudents(request: APIRequestContext) {
  if (activeHandles.length === 0) return;

  const handles = [...activeHandles];
  activeHandles = [];

  const remaining: ProvisionedReportStudentHandle[] = [];
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
        studentCode: `9998${suffix.slice(-6)}`,
        firstName: h.profile.firstName,
        lastName: h.profile.lastName,
        email: `itc.arch.svreport.${suffix}@gmail.com`,
        phone: `0978${suffix.slice(-6)}`,
        batch: h.profile.batch,
        className: h.profile.className,
      },
    });
  }
}

async function openStudentReportsPage(page: Page, context: BrowserContext, token: string) {
  await setAuthCookie(context, token);

  const reportPromise = page.waitForResponse(
    (r) => r.url().includes('/report/my-report') && r.request().method() === 'GET',
  );
  await page.goto('/student/reports');
  const reportRes = await reportPromise;
  return { reportRes };
}

test.describe('Report 5.2 - Student Submit Final Report (NopBaoCao)', () => {
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
    const allDeadlines: any[] = [
      ...(dlRes.body?.data?.giaoNhanDeadlines ?? []),
      ...(dlRes.body?.data?.thucHienDeadlines ?? []),
      ...(dlRes.body?.data?.danhGiaDeadlines ?? []),
    ];
    const findSnap = (code: string): DeadlineSnapshot => {
      const item = allDeadlines.find((d) => d.code === code);
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
      mainSupervisorAccountId: 0,
      mainSupervisorPublicId: '',
      mainSupervisorToken: '',
      reviewerId: 0,
      reviewerPublicId: '',
      reviewerToken: '',
      archiveSupervisorId: 0,
      archiveSupervisorPublicId: '',
      dlDangKy: findSnap('DANG_KY_GVHD'),
      dlTbmChot: findSnap('TBM_CHOT_DS_GVHD_DU_KIEN'),
      dlDeCuong: findSnap('SV_CHINH_SUA_NOP_LAI_DE_CUONG'),
      dlBaoCao: findSnap('NOP_BAO_CAO_VA_PHIEU_THEO_DOI'),
    };

    const mainSup = await ensureTeacher(request, TEST_MAIN_SUPERVISOR, 20);
    envState.mainSupervisorId = mainSup.id;
    envState.mainSupervisorAccountId = mainSup.accountId;
    envState.mainSupervisorPublicId = mainSup.publicId;
    envState.mainSupervisorToken = mainSup.token;

    const reviewer = await ensureTeacher(request, TEST_REVIEWER, 20);
    envState.reviewerId = reviewer.id;
    envState.reviewerPublicId = reviewer.publicId;
    envState.reviewerToken = reviewer.token;

    const archiveSup = await ensureTeacher(request, TEST_ARCHIVE_SUPERVISOR, 500);
    envState.archiveSupervisorId = archiveSup.id;
    envState.archiveSupervisorPublicId = archiveSup.publicId;
  });

  test.afterEach(async ({ request }) => {
    await cleanupActiveStudents(request);
    await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'OPEN');
    await updateDeadline(request, envState.dlBaoCao, 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI', 'OPEN');
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
    await updateDeadline(request, envState.dlBaoCao, 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI', 'RESTORE');
  });

  // ==========================================================================
  // FUNCTION 1: View Final Report Overview, Progress Report, and Submission History (ITC001..ITC007)
  // ==========================================================================

  test(ITC001.title, { annotation: ITC001.annotation }, async ({ page, context, request }) => {
    const h = await provisionReportStudent(request, {
      profile: TEST_STUDENT_1,
      approveOutline: true,
    });

    const { reportRes } = await openStudentReportsPage(page, context, h.studentToken);
    expect(reportRes.status()).toBe(200);
    const body = await reportRes.json();
    expect(body.code).toBe(1000);
    expect(body.data.currentStage).toBe('STAGE_3_OUTLINE_APPROVED');
    expect(body.data.topicStatus).toBe('IN_PROGRESS');
    expect(body.data.status).toBeNull();
    expect(body.data.lecturerName).toBe(TEST_MAIN_SUPERVISOR.fullName);
    expect(body.data.deadlineStatus).toBe('OPEN');
    expect(body.data.progressReport).toBeNull();
    expect(body.data.histories).toHaveLength(0);

    await expect(page.getByText(OFFICIAL_TITLE_DEFAULT)).toBeVisible();
    await expect(page.getByText(TEST_MAIN_SUPERVISOR.fullName)).toBeVisible();
    await expect(page.getByText('Đang mở')).toBeVisible();
    await expect(page.getByText('Bạn chưa nộp báo cáo Final nào trong học kỳ này.')).toBeVisible();
    await expect(page.getByText('Giảng viên hướng dẫn chưa tải lên phiếu theo dõi tiến độ.')).toBeVisible();
    await expect(page.getByText('Chưa có lần nộp báo cáo Final nào trong học kỳ này.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'NỘP BÁO CÁO' })).toBeEnabled();

    const rows = await dbSelect<{
      current_stage: string;
      report_count: number;
      progress_count: number;
    }>(
      `SELECT tt.current_stage,
              (SELECT COUNT(*) FROM thesis_final_report r WHERE r.thesis_topic_id = tt.id) AS report_count,
              (SELECT COUNT(*) FROM thesis_progress_report p WHERE p.thesis_topic_id = tt.id) AS progress_count
         FROM thesis_topic tt
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].current_stage).toBe('STAGE_3_OUTLINE_APPROVED');
    expect(Number(rows[0].report_count)).toBe(0);
    expect(Number(rows[0].progress_count)).toBe(0);
  });

  test(ITC002.title, { annotation: ITC002.annotation }, async ({ page, context, request }) => {
    const h = await provisionReportStudent(request, {
      profile: TEST_STUDENT_2,
      approveOutline: false,
    });

    const { reportRes } = await openStudentReportsPage(page, context, h.studentToken);
    expect(reportRes.status()).toBe(200);
    const body = await reportRes.json();
    expect(body.code).toBe(1000);
    expect(body.data.currentStage).toBe('STAGE_2_TOPIC_CONFIRMED');
    expect(body.data.topicStatus).toBe('IN_PROGRESS');
    expect(body.data.status).toBeNull();
    expect(body.data.histories).toHaveLength(0);

    await expect(
      page.getByText('Đề tài chưa hoàn thành phê duyệt đề cương, chưa thể nộp báo cáo Final.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'NỘP BÁO CÁO' })).toBeDisabled();

    const rows = await dbSelect<{ current_stage: string; report_count: number }>(
      `SELECT tt.current_stage,
              (SELECT COUNT(*) FROM thesis_final_report r WHERE r.thesis_topic_id = tt.id) AS report_count
         FROM thesis_topic tt
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_2.studentCode, envState.semesterId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].current_stage).toBe('STAGE_2_TOPIC_CONFIRMED');
    expect(Number(rows[0].report_count)).toBe(0);
  });

  test(ITC003.title, { annotation: ITC003.annotation }, async ({ page, context, request }) => {
    const progressNote = 'Sinh viên hoàn thành tốt tiến độ các tuần';
    const h = await provisionReportStudent(request, {
      profile: TEST_STUDENT_1,
      approveOutline: true,
      progressReport: {
        fileName: PROGRESS_PDF_FILENAME,
        supervisorNote: progressNote,
      },
    });

    const { reportRes } = await openStudentReportsPage(page, context, h.studentToken);
    expect(reportRes.status()).toBe(200);
    const body = await reportRes.json();
    expect(body.code).toBe(1000);
    expect(body.data.progressReport).not.toBeNull();
    expect(body.data.progressReport.supervisorName).toBe(TEST_MAIN_SUPERVISOR.fullName);
    expect(body.data.progressReport.supervisorNote).toBe(progressNote);
    expect(body.data.progressReport.progressFile).toContain(PROGRESS_PDF_FILENAME);

    await expect(page.getByRole('heading', { name: 'Phiếu theo dõi tiến độ' })).toBeVisible();
    await expect(page.getByRole('link', { name: new RegExp(PROGRESS_PDF_FILENAME) })).toBeVisible();
    await expect(page.getByText(progressNote)).toBeVisible();

    const rows = await dbSelect<{ progress_file: string; supervisor_note: string }>(
      `SELECT p.progress_file, p.supervisor_note
         FROM thesis_progress_report p
         JOIN thesis_topic tt ON tt.id = p.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].progress_file).toContain(PROGRESS_PDF_FILENAME);
    expect(rows[0].supervisor_note).toBe(progressNote);
  });

  test(ITC004.title, { annotation: ITC004.annotation }, async ({ page, context, request }) => {
    const feedback = 'Cần bổ sung phần đánh giá thực nghiệm và trích dẫn';
    const h = await provisionReportStudent(request, {
      profile: TEST_STUDENT_1,
      approveOutline: true,
      initialFinalReport: {
        fileName: VALID_PDF_FILENAME,
        review: {
          decision: 'REQUEST_CHANGES',
          plagiarismRate: 18.5,
          feedback,
        },
      },
    });

    const { reportRes } = await openStudentReportsPage(page, context, h.studentToken);
    expect(reportRes.status()).toBe(200);
    const body = await reportRes.json();
    expect(body.code).toBe(1000);
    expect(body.data.status).toBe('REQUEST_CHANGES');
    expect(body.data.plagiarismRate).toBe(18.5);
    expect(body.data.supervisorFeedback).toBe(feedback);
    expect(body.data.histories).toHaveLength(1);
    expect(body.data.histories[0].status).toBe('REQUEST_CHANGES');

    await expect(page.getByText('Yêu cầu chỉnh sửa').first()).toBeVisible();
    await expect(page.getByText('18.5%').first()).toBeVisible();
    await expect(page.getByRole('link', { name: new RegExp(PLAGIARISM_PDF_FILENAME) }).first()).toBeVisible();
    await expect(page.getByText(feedback).first()).toBeVisible();
    await expect(page.locator('#reportHistoryTableBody tr')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'NỘP LẠI' })).toBeEnabled();

    const rows = await dbSelect<{
      report_status: string;
      plagiarism_rate: number;
      supervisor_feedback: string;
      history_status: string;
    }>(
      `SELECT r.status AS report_status,
              r.plagiarism_rate,
              r.supervisor_feedback,
              h.status AS history_status
         FROM thesis_final_report r
         JOIN thesis_topic tt ON tt.id = r.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
         JOIN thesis_final_report_history h ON h.final_report_id = r.id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].report_status).toBe('REQUEST_CHANGES');
    expect(rows[0].history_status).toBe('REQUEST_CHANGES');
    expect(Number(rows[0].plagiarism_rate)).toBe(18.5);
    expect(rows[0].supervisor_feedback).toBe(feedback);
  });

  test(ITC005.title, { annotation: ITC005.annotation }, async ({ page, context, request }) => {
    const approveFeedback = 'Báo cáo đạt yêu cầu, đủ điều kiện ra hội đồng';
    const h = await provisionReportStudent(request, {
      profile: TEST_STUDENT_1,
      approveOutline: true,
      initialFinalReport: {
        fileName: VALID_PDF_FILENAME,
        review: {
          decision: 'APPROVED',
          plagiarismRate: 12.5,
          feedback: approveFeedback,
        },
      },
    });

    const { reportRes } = await openStudentReportsPage(page, context, h.studentToken);
    expect(reportRes.status()).toBe(200);
    const body = await reportRes.json();
    expect(body.code).toBe(1000);
    expect(body.data.status).toBe('APPROVED');
    expect(body.data.currentStage).toBe('STAGE_4_REPORT_APPROVED');
    expect(body.data.plagiarismRate).toBe(12.5);
    expect(body.data.supervisorFeedback).toBe(approveFeedback);

    await expect(page.getByText('Báo cáo Final đã được phê duyệt đạt, không thể nộp lại.')).toBeVisible();
    await expect(page.getByText('Đã duyệt đạt').first()).toBeVisible();
    await expect(page.getByText('12.5%').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'NỘP LẠI' })).toBeDisabled();

    const rows = await dbSelect<{ report_status: string; current_stage: string }>(
      `SELECT r.status AS report_status, tt.current_stage
         FROM thesis_final_report r
         JOIN thesis_topic tt ON tt.id = r.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].report_status).toBe('APPROVED');
    expect(rows[0].current_stage).toBe('STAGE_4_REPORT_APPROVED');
  });

  test(ITC006.title, { annotation: ITC006.annotation }, async ({ page, context, request }) => {
    const h = await provisionReportStudent(request, {
      profile: TEST_STUDENT_1,
      approveOutline: true,
      initialFinalReport: {
        fileName: VALID_PDF_FILENAME,
        review: {
          decision: 'REJECTED',
          plagiarismRate: 20.0,
          feedback: 'Nội dung báo cáo chưa đáp ứng yêu cầu tối thiểu',
        },
      },
    });

    const { reportRes } = await openStudentReportsPage(page, context, h.studentToken);
    expect(reportRes.status()).toBe(200);
    const body = await reportRes.json();
    expect(body.code).toBe(1000);
    expect(body.data.status).toBe('REJECTED');
    expect(body.data.topicStatus).toBe('DISQUALIFIED');
    expect(body.data.disqualificationReason).toBe('Không hoàn thành phê duyệt báo cáo đúng hạn');

    await expect(page.getByText('Đề tài đã bị đình chỉ (DISQUALIFIED)')).toBeVisible();
    await expect(page.getByText(/Không hoàn thành phê duyệt báo cáo đúng hạn/).first()).toBeVisible();
    await expect(page.locator('#reportHistoryTableBody').getByText('Không đạt')).toBeVisible();
    await expect(page.getByRole('button', { name: 'NỘP LẠI' })).toBeDisabled();

    const rows = await dbSelect<{ report_status: string; topic_status: string }>(
      `SELECT r.status AS report_status, tt.status AS topic_status
         FROM thesis_final_report r
         JOIN thesis_topic tt ON tt.id = r.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].report_status).toBe('REJECTED');
    expect(rows[0].topic_status).toBe('DISQUALIFIED');
  });

  test(ITC007.title, { annotation: ITC007.annotation }, async ({ page, context, request }) => {
    const h = await provisionReportStudent(request, {
      profile: TEST_STUDENT_1,
      approveOutline: true,
    });

    // 1. CLOSED
    await updateDeadline(request, envState.dlBaoCao, 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI', 'CLOSED');
    const closedRes = await openStudentReportsPage(page, context, h.studentToken);
    expect(closedRes.reportRes.status()).toBe(200);
    const closedBody = await closedRes.reportRes.json();
    expect(closedBody.code).toBe(1000);
    expect(closedBody.data.deadlineStatus).toBe('CLOSED');
    await expect(page.getByText('Đã hết hạn', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'NỘP BÁO CÁO' })).toBeDisabled();

    // 2. NOT_STARTED
    await updateDeadline(request, envState.dlBaoCao, 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI', 'NOT_STARTED');
    const notStartedPromise = page.waitForResponse(
      (r) => r.url().includes('/report/my-report') && r.request().method() === 'GET',
    );
    await page.reload();
    const notStartedRes = await notStartedPromise;
    expect(notStartedRes.status()).toBe(200);
    const notStartedBody = await notStartedRes.json();
    expect(notStartedBody.code).toBe(1000);
    expect(notStartedBody.data.deadlineStatus).toBe('NOT_STARTED');
    await expect(page.getByText('Chưa mở', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'NỘP BÁO CÁO' })).toBeDisabled();

    // 3. EXTENDED
    await updateDeadline(request, envState.dlBaoCao, 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI', 'EXTENDED');
    const extendedPromise = page.waitForResponse(
      (r) => r.url().includes('/report/my-report') && r.request().method() === 'GET',
    );
    await page.reload();
    const extendedRes = await extendedPromise;
    expect(extendedRes.status()).toBe(200);
    const extendedBody = await extendedRes.json();
    expect(extendedBody.code).toBe(1000);
    expect(extendedBody.data.deadlineStatus).toBe('EXTENDED');
    await expect(
      page.getByText('Đã hết hạn nộp của sinh viên — Đang trong thời gian giảng viên chấm.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'NỘP BÁO CÁO' })).toBeDisabled();
  });

  // ==========================================================================
  // FUNCTION 2: Submit and Resubmit Final Report (ITC008..ITC015)
  // ==========================================================================

  test(ITC008.title, { annotation: ITC008.annotation }, async ({ page, context, request }) => {
    const h = await provisionReportStudent(request, {
      profile: TEST_STUDENT_1,
      approveOutline: true,
    });

    const notifBeforeRows = await dbSelect<{ total: number }>(
      'SELECT COUNT(*) AS total FROM notification WHERE account_id = ?',
      [envState.mainSupervisorAccountId],
    );
    const notifBefore = Number(notifBeforeRows[0]?.total ?? 0);

    await openStudentReportsPage(page, context, h.studentToken);
    await page.getByRole('button', { name: 'NỘP BÁO CÁO' }).click();

    const modal = page.locator('#submitReportModal');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('heading', { name: 'Nộp báo cáo Final' })).toBeVisible();

    await modal.locator('input[type="file"]').setInputFiles({
      name: VALID_PDF_FILENAME,
      mimeType: 'application/pdf',
      buffer: createMinimalValidPdfBuffer('First Final Report PDF'),
    });
    await expect(modal.locator('#selectedReportFileName')).toHaveText(VALID_PDF_FILENAME);

    const submitPromise = page.waitForResponse(
      (r) => r.url().includes('/report/submit') && r.request().method() === 'POST',
    );
    const reloadPromise = page.waitForResponse(
      (r) => r.url().includes('/report/my-report') && r.request().method() === 'GET',
    );
    await modal.getByRole('button', { name: 'Xác nhận nộp' }).click();

    const submitRes = await submitPromise;
    expect(submitRes.status()).toBe(200);
    const submitBody = await submitRes.json();
    expect(submitBody.code).toBe(1000);
    expect(submitBody.message).toBe('Nộp báo cáo Final thành công');

    await reloadPromise;
    await expect(page.getByText('Nộp báo cáo Final thành công!')).toBeVisible();
    await expect(modal).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'NỘP LẠI' })).toBeVisible();
    await expect(page.locator('#reportHistoryTableBody tr')).toHaveCount(1);
    await expect(page.locator('#reportHistoryTableBody')).toContainText(VALID_PDF_FILENAME);
    await expect(page.locator('#reportHistoryTableBody').getByText('Đã nộp, chờ nhận xét')).toBeVisible();

    const rows = await dbSelect<{
      status: string;
      final_report_file: string;
      history_count: number;
    }>(
      `SELECT r.status,
              r.final_report_file,
              (SELECT COUNT(*) FROM thesis_final_report_history h WHERE h.final_report_id = r.id) AS history_count
         FROM thesis_final_report r
         JOIN thesis_topic tt ON tt.id = r.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('PENDING');
    expect(rows[0].final_report_file).toContain(VALID_PDF_FILENAME);
    expect(Number(rows[0].history_count)).toBe(1);

    const notifAfterRows = await dbSelect<{ total: number }>(
      'SELECT COUNT(*) AS total FROM notification WHERE account_id = ?',
      [envState.mainSupervisorAccountId],
    );
    expect(Number(notifAfterRows[0]?.total ?? 0)).toBeGreaterThan(notifBefore);
  });

  test(ITC009.title, { annotation: ITC009.annotation }, async ({ page, context, request }) => {
    const h = await provisionReportStudent(request, {
      profile: TEST_STUDENT_1,
      approveOutline: true,
      initialFinalReport: {
        fileName: VALID_PDF_FILENAME,
      },
    });

    await openStudentReportsPage(page, context, h.studentToken);
    await page.getByRole('button', { name: 'NỘP LẠI' }).click();

    const modal = page.locator('#submitReportModal');
    await expect(modal.getByRole('heading', { name: 'Nộp lại báo cáo Final' })).toBeVisible();

    await modal.locator('input[type="file"]').setInputFiles({
      name: VALID_DOCX_FILENAME,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: createMinimalValidDocxBuffer('Overwrite Pending DOCX'),
    });

    const submitPromise = page.waitForResponse(
      (r) => r.url().includes('/report/submit') && r.request().method() === 'POST',
    );
    const reloadPromise = page.waitForResponse(
      (r) => r.url().includes('/report/my-report') && r.request().method() === 'GET',
    );
    await modal.getByRole('button', { name: 'Xác nhận nộp' }).click();

    const submitRes = await submitPromise;
    expect(submitRes.status()).toBe(200);
    const submitBody = await submitRes.json();
    expect(submitBody.code).toBe(1000);
    expect(submitBody.message).toBe('Nộp báo cáo Final thành công');

    await reloadPromise;
    await expect(page.getByText('Nộp báo cáo Final thành công!')).toBeVisible();
    await expect(page.locator('#reportHistoryTableBody tr')).toHaveCount(1);
    await expect(page.locator('#reportHistoryTableBody')).toContainText(VALID_DOCX_FILENAME);
    await expect(page.locator('#reportHistoryTableBody').getByText('Đã nộp, chờ nhận xét')).toBeVisible();

    const rows = await dbSelect<{
      status: string;
      final_report_file: string;
      history_count: number;
      history_file: string;
    }>(
      `SELECT r.status,
              r.final_report_file,
              (SELECT COUNT(*) FROM thesis_final_report_history h2 WHERE h2.final_report_id = r.id) AS history_count,
              h.final_history_file AS history_file
         FROM thesis_final_report r
         JOIN thesis_topic tt ON tt.id = r.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
         JOIN thesis_final_report_history h ON h.final_report_id = r.id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('PENDING');
    expect(rows[0].final_report_file).toContain(VALID_DOCX_FILENAME);
    expect(Number(rows[0].history_count)).toBe(1);
    expect(rows[0].history_file).toContain(VALID_DOCX_FILENAME);
  });

  test(ITC010.title, { annotation: ITC010.annotation }, async ({ page, context, request }) => {
    const oldFeedback = 'Cần chỉnh sửa lại chương 3 và biểu đồ kết quả';
    const h = await provisionReportStudent(request, {
      profile: TEST_STUDENT_1,
      approveOutline: true,
      initialFinalReport: {
        fileName: VALID_PDF_FILENAME,
        review: {
          decision: 'REQUEST_CHANGES',
          plagiarismRate: 18.5,
          feedback: oldFeedback,
        },
      },
    });

    await openStudentReportsPage(page, context, h.studentToken);
    await page.getByRole('button', { name: 'NỘP LẠI' }).click();

    const modal = page.locator('#submitReportModal');
    await modal.locator('input[type="file"]').setInputFiles({
      name: VALID_PDF_FILENAME,
      mimeType: 'application/pdf',
      buffer: createMinimalValidPdfBuffer('Revised Final Report V2'),
    });

    const submitPromise = page.waitForResponse(
      (r) => r.url().includes('/report/submit') && r.request().method() === 'POST',
    );
    const reloadPromise = page.waitForResponse(
      (r) => r.url().includes('/report/my-report') && r.request().method() === 'GET',
    );
    await modal.getByRole('button', { name: 'Xác nhận nộp' }).click();

    const submitRes = await submitPromise;
    expect(submitRes.status()).toBe(200);
    const submitBody = await submitRes.json();
    expect(submitBody.code).toBe(1000);
    expect(submitBody.message).toBe('Nộp báo cáo Final thành công');

    await reloadPromise;
    await expect(page.getByText('Nộp báo cáo Final thành công!')).toBeVisible();
    await expect(page.getByText('Chưa chấm').first()).toBeVisible();
    await expect(page.locator('#reportHistoryTableBody tr')).toHaveCount(2);
    await expect(page.locator('#reportHistoryTableBody tr').nth(0)).toContainText('Đã nộp, chờ nhận xét');
    await expect(page.locator('#reportHistoryTableBody tr').nth(1)).toContainText('Yêu cầu chỉnh sửa');

    const reportRows = await dbSelect<{
      id: number;
      status: string;
      plagiarism_rate: number | null;
      plagiarism_file: string | null;
      supervisor_feedback: string | null;
      reviewed_at: string | null;
    }>(
      `SELECT r.id, r.status, r.plagiarism_rate, r.plagiarism_file, r.supervisor_feedback, r.reviewed_at
         FROM thesis_final_report r
         JOIN thesis_topic tt ON tt.id = r.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(reportRows).toHaveLength(1);
    expect(reportRows[0].status).toBe('PENDING');
    expect(reportRows[0].plagiarism_rate).toBeNull();
    expect(reportRows[0].plagiarism_file).toBeNull();
    expect(reportRows[0].supervisor_feedback).toBeNull();
    expect(reportRows[0].reviewed_at).toBeNull();

    const histRows = await dbSelect<{
      status: string;
      plagiarism_rate: number | null;
      supervisor_feedback: string | null;
    }>(
      `SELECT status, plagiarism_rate, supervisor_feedback
         FROM thesis_final_report_history
        WHERE final_report_id = ?
        ORDER BY submitted_at DESC, id DESC`,
      [reportRows[0].id],
    );
    expect(histRows).toHaveLength(2);
    expect(histRows[0].status).toBe('PENDING');
    expect(histRows[1].status).toBe('REQUEST_CHANGES');
    expect(Number(histRows[1].plagiarism_rate)).toBe(18.5);
    expect(histRows[1].supervisor_feedback).toBe(oldFeedback);
  });

  test(ITC011.title, { annotation: ITC011.annotation }, async ({ page, context, request }) => {
    const h = await provisionReportStudent(request, {
      profile: TEST_STUDENT_1,
      approveOutline: true,
    });

    await openStudentReportsPage(page, context, h.studentToken);

    let submitCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/report/submit') && req.method() === 'POST') {
        submitCalled = true;
      }
    });

    await page.getByRole('button', { name: 'NỘP BÁO CÁO' }).click();
    const modal = page.locator('#submitReportModal');
    await modal.locator('input[type="file"]').setInputFiles({
      name: INVALID_EXT_FILENAME,
      mimeType: 'text/plain',
      buffer: Buffer.from('Plain text content', 'utf8'),
    });
    await modal.getByRole('button', { name: 'Xác nhận nộp' }).click();

    await expect(
      modal.getByText('File tải lên chỉ nhận định dạng .doc, .docx hoặc .pdf.'),
    ).toBeVisible();
    expect(submitCalled).toBe(false);

    const rows = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM thesis_final_report r
         JOIN thesis_topic tt ON tt.id = r.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(Number(rows[0].total)).toBe(0);
  });

  test(ITC012.title, { annotation: ITC012.annotation }, async ({ page, context, request }) => {
    const h = await provisionReportStudent(request, {
      profile: TEST_STUDENT_1,
      approveOutline: true,
    });

    await openStudentReportsPage(page, context, h.studentToken);

    let submitCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/report/submit') && req.method() === 'POST') {
        submitCalled = true;
      }
    });

    await page.getByRole('button', { name: 'NỘP BÁO CÁO' }).click();
    const modal = page.locator('#submitReportModal');
    await modal.locator('input[type="file"]').setInputFiles({
      name: INVALID_NAME_FILENAME,
      mimeType: 'application/pdf',
      buffer: createMinimalValidPdfBuffer('Bad Filename'),
    });
    await modal.getByRole('button', { name: 'Xác nhận nộp' }).click();

    await expect(
      modal.getByText(
        'Tên file không đúng định dạng! Vui lòng đổi tên file theo định dạng Tenlop_MaSV_HoVaTen (VD: DHKTPM17A_22110001_NguyenVanAn.pdf)',
      ),
    ).toBeVisible();
    expect(submitCalled).toBe(false);

    const rows = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM thesis_final_report r
         JOIN thesis_topic tt ON tt.id = r.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(Number(rows[0].total)).toBe(0);
  });

  test(ITC013.title, { annotation: ITC013.annotation }, async ({ page, context, request }) => {
    const h = await provisionReportStudent(request, {
      profile: TEST_STUDENT_1,
      approveOutline: true,
    });

    await openStudentReportsPage(page, context, h.studentToken);

    let submitCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/report/submit') && req.method() === 'POST') {
        submitCalled = true;
      }
    });

    await page.getByRole('button', { name: 'NỘP BÁO CÁO' }).click();
    const modal = page.locator('#submitReportModal');

    // 0-byte file
    await modal.locator('input[type="file"]').setInputFiles({
      name: VALID_PDF_FILENAME,
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(0),
    });
    await modal.getByRole('button', { name: 'Xác nhận nộp' }).click();
    await expect(modal.getByText('File tải lên không được để trống.')).toBeVisible();

    // 10 MB file
    await modal.locator('input[type="file"]').setInputFiles({
      name: VALID_PDF_FILENAME,
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(10 * 1024 * 1024, 0x41),
    });
    await modal.getByRole('button', { name: 'Xác nhận nộp' }).click();
    await expect(modal.getByText('File tải lên phải nhỏ hơn 10MB.')).toBeVisible();

    expect(submitCalled).toBe(false);

    const rows = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM thesis_final_report r
         JOIN thesis_topic tt ON tt.id = r.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(Number(rows[0].total)).toBe(0);
  });

  test(ITC014.title, { annotation: ITC014.annotation }, async ({ page, context, request }) => {
    const h = await provisionReportStudent(request, {
      profile: TEST_STUDENT_1,
      approveOutline: true,
    });

    await openStudentReportsPage(page, context, h.studentToken);
    await page.getByRole('button', { name: 'NỘP BÁO CÁO' }).click();

    const modal = page.locator('#submitReportModal');
    await modal.locator('input[type="file"]').setInputFiles({
      name: VALID_PDF_FILENAME,
      mimeType: 'application/pdf',
      buffer: createMinimalValidPdfBuffer('Concurrent Closed Deadline'),
    });

    // Đóng deadline đồng thời trước khi sinh viên bấm xác nhận nộp
    await updateDeadline(request, envState.dlBaoCao, 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI', 'CLOSED');

    const submitPromise = page.waitForResponse(
      (r) => r.url().includes('/report/submit') && r.request().method() === 'POST',
    );
    await modal.getByRole('button', { name: 'Xác nhận nộp' }).click();

    const submitRes = await submitPromise;
    expect(submitRes.status()).toBe(403);
    const submitBody = await submitRes.json();
    expect(submitBody.code).toBe(3095);
    expect(submitBody.message).toBe('Thời hạn sinh viên nộp báo cáo chưa mở hoặc đã kết thúc');

    await expect(modal).toBeVisible();
    await expect(modal.locator('p[role="alert"]')).toHaveText(
      'Thời hạn sinh viên nộp báo cáo chưa mở hoặc đã kết thúc',
    );

    const rows = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM thesis_final_report r
         JOIN thesis_topic tt ON tt.id = r.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(Number(rows[0].total)).toBe(0);
  });

  test(ITC015.title, { annotation: ITC015.annotation }, async ({ page, context, request }) => {
    const h = await provisionReportStudent(request, {
      profile: TEST_STUDENT_1,
      approveOutline: true,
      progressReport: {
        fileName: PROGRESS_PDF_FILENAME,
        supervisorNote: 'Đủ điều kiện thẩm định',
      },
      initialFinalReport: {
        fileName: VALID_PDF_FILENAME,
      },
    });
    expect(h.finalReportPublicId).toBeTruthy();

    await openStudentReportsPage(page, context, h.studentToken);
    await page.getByRole('button', { name: 'NỘP LẠI' }).click();

    const modal = page.locator('#submitReportModal');
    await modal.locator('input[type="file"]').setInputFiles({
      name: VALID_DOCX_FILENAME,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: createMinimalValidDocxBuffer('Concurrent After Approved'),
    });

    // GVHD duyệt ĐẠT báo cáo đồng thời trước khi sinh viên bấm xác nhận nộp lại
    await reviewFinalReportViaApi(
      request,
      envState.mainSupervisorToken,
      h.finalReportPublicId!,
      VALID_PDF_FILENAME,
      12.5,
      'APPROVED',
      'Đã duyệt đạt trong phiên đồng thời',
    );

    const submitPromise = page.waitForResponse(
      (r) => r.url().includes('/report/submit') && r.request().method() === 'POST',
    );
    await modal.getByRole('button', { name: 'Xác nhận nộp' }).click();

    const submitRes = await submitPromise;
    expect(submitRes.status()).toBe(409);
    const submitBody = await submitRes.json();
    expect(submitBody.code).toBe(3091);
    expect(submitBody.message).toBe(
      'Báo cáo đã được phê duyệt hoặc đã có kết quả cuối cùng, không thể nộp lại',
    );

    await expect(modal).toBeVisible();
    await expect(modal.locator('p[role="alert"]')).toHaveText(
      'Báo cáo đã được phê duyệt hoặc đã có kết quả cuối cùng, không thể nộp lại',
    );

    const rows = await dbSelect<{ status: string; history_count: number }>(
      `SELECT r.status,
              (SELECT COUNT(*) FROM thesis_final_report_history h WHERE h.final_report_id = r.id) AS history_count
         FROM thesis_final_report r
         JOIN thesis_topic tt ON tt.id = r.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('APPROVED');
    expect(Number(rows[0].history_count)).toBe(1);
  });

  // ==========================================================================
  // SECURITY TEST CASES (TC-SEC-037 .. TC-SEC-041)
  // ==========================================================================

  test(SEC037.title, { annotation: SEC037.annotation }, async ({ page, context, request }) => {
    await context.clearCookies();

    const myInfoPromise = page.waitForResponse(
      (r) => r.url().includes('/my-info') && r.request().method() === 'GET',
    );
    await page.goto('/student/reports');
    const myInfoRes = await myInfoPromise;
    expect(myInfoRes.status()).toBe(401);
    expect((await myInfoRes.json()).code).toBe(2000);

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Lịch sử nộp báo cáo')).toHaveCount(0);

    const unauthMyReport = await request.get(`${getApiBaseUrl()}/report/my-report`);
    expect(unauthMyReport.status()).toBe(401);
    expect((await unauthMyReport.json()).code).toBe(2000);

    const unauthMyProgress = await request.get(`${getApiBaseUrl()}/report/my-progress-report`);
    expect(unauthMyProgress.status()).toBe(401);
    expect((await unauthMyProgress.json()).code).toBe(2000);

    const unauthSubmit = await submitFinalReportViaApi(request, null, {
      name: VALID_PDF_FILENAME,
      mimeType: 'application/pdf',
      buffer: createMinimalValidPdfBuffer('Unauthenticated Submit'),
    });
    expect(unauthSubmit.status).toBe(401);
    expect(unauthSubmit.body.code).toBe(2000);
  });

  test(SEC038.title, { annotation: SEC038.annotation }, async ({ page, context, request }) => {
    await setAuthCookie(context, envState.mainSupervisorToken);
    await page.goto('/student/reports');

    await expect(
      page.getByText('Tài khoản của bạn không có quyền truy cập cổng sinh viên.'),
    ).toBeVisible();

    const submitRes = await submitFinalReportViaApi(request, envState.mainSupervisorToken, {
      name: VALID_PDF_FILENAME,
      mimeType: 'application/pdf',
      buffer: createMinimalValidPdfBuffer('Supervisor Forbidden Submit'),
    });
    expect(submitRes.status).toBe(403);
    expect(submitRes.body.code).toBe(2001);
    expect(submitRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');
  });

  test(SEC039.title, { annotation: SEC039.annotation }, async ({ page, context, request }) => {
    await setAuthCookie(context, envState.hodToken);
    await page.goto('/student/reports');

    await expect(
      page.getByText('Tài khoản của bạn không có quyền truy cập cổng sinh viên.'),
    ).toBeVisible();

    const submitRes = await submitFinalReportViaApi(request, envState.hodToken, {
      name: VALID_PDF_FILENAME,
      mimeType: 'application/pdf',
      buffer: createMinimalValidPdfBuffer('Head Of Major Forbidden Submit'),
    });
    expect(submitRes.status).toBe(403);
    expect(submitRes.body.code).toBe(2001);
    expect(submitRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');
  });

  test(SEC040.title, { annotation: SEC040.annotation }, async ({ page, context, request }) => {
    await provisionReportStudent(request, {
      profile: TEST_STUDENT_1,
      approveOutline: true,
    });

    const freshToken = await loginByEmail(request, TEST_STUDENT_1.email);
    const logoutRes = await apiCall(request, freshToken, 'POST', '/log-out');
    expect(logoutRes.status).toBe(200);

    await setAuthCookie(context, freshToken);
    const myInfoPromise = page.waitForResponse(
      (r) => r.url().includes('/my-info') && r.request().method() === 'GET',
    );
    await page.goto('/student/reports');
    const myInfoRes = await myInfoPromise;
    expect(myInfoRes.status()).toBe(401);
    expect((await myInfoRes.json()).code).toBe(2000);

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Lịch sử nộp báo cáo')).toHaveCount(0);

    const getRes = await apiCall(request, freshToken, 'GET', '/report/my-report');
    expect(getRes.status).toBe(401);
    expect(getRes.body.code).toBe(2000);

    const submitRes = await submitFinalReportViaApi(request, freshToken, {
      name: VALID_PDF_FILENAME,
      mimeType: 'application/pdf',
      buffer: createMinimalValidPdfBuffer('Logged Out Token Submit'),
    });
    expect(submitRes.status).toBe(401);
    expect(submitRes.body.code).toBe(2000);

    const rows = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM thesis_final_report r
         JOIN thesis_topic tt ON tt.id = r.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(Number(rows[0].total)).toBe(0);
  });

  test(SEC041.title, { annotation: SEC041.annotation }, async ({ page, context, request }) => {
    const owner = await provisionReportStudent(request, {
      profile: TEST_STUDENT_1,
      approveOutline: true,
      initialFinalReport: {
        fileName: VALID_PDF_FILENAME,
      },
    });
    expect(owner.finalReportPublicId).toBeTruthy();

    // Tạo sinh viên thứ 2 trong cùng ngành để kiểm tra IDOR (truy cập báo cáo của sinh viên khác)
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
      finalReportPublicId: null,
    });

    await openStudentReportsPage(page, context, student2Token);
    await expect(page.locator('#reportHistoryTableBody')).not.toContainText(VALID_PDF_FILENAME);

    const idorRes = await apiCall(
      request,
      student2Token,
      'GET',
      `/report/${owner.finalReportPublicId}`,
    );
    expect(idorRes.status).toBe(403);
    expect(idorRes.body.code).toBe(2001);
    expect(idorRes.body.message).toBe('Bạn không có quyền truy cập thông tin báo cáo này');
  });
});
