import { test, expect, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';
import { defineItc, defineItcSec } from '../../../support/integration-test-case';
import { apiCall, getApiBaseUrl, loginByEmail } from '../../../support/api';
import { dbSelect } from '../../../support/db';

// ============================================================================
// ĐẶC TẢ TEST CASE (ITC032..ITC052 & TC-SEC-048..TC-SEC-053)
// Feature: report | Module/Sheet: DuyetBaoCao
// Role: Giảng viên hướng dẫn (SUPERVISOR)
// ============================================================================

const ITC032 = defineItc({
  id: 'ITC032',
  feature: 'report',
  module: 'DuyetBaoCao',
  sheet: 'DuyetBaoCao',
  fn: 'View and Filter Supervised Final Reports',
  description:
    'Verify that a main supervisor can view supervised students\' final reports on the report check screen with accurate status tab counters, open deadline badge, and progress-report prerequisite guard',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân").\n' +
    '2. Open the "Thẩm định báo cáo" screen ("/lecturer/report-check").\n' +
    '3. Inspect the default "Chưa duyệt" tab, then click the "Tất cả" tab.',
  expected:
    '1. The API GET /report/supervisor-list returns HTTP 200 with code = 1000 and 4 supervised students at STAGE_3_OUTLINE_APPROVED or higher (2 PENDING, 1 APPROVED, 1 without a final report), all with canReview = true and deadlineStatus = "OPEN".\n' +
    '2. The database confirms 4 thesis_topic records exist for supervisor "GV999801" (3 with thesis_final_report records and 1 without) and 2 thesis_progress_report records exist.\n' +
    '3. The header displays deadline badge "Đang mở", and status tab counters show "Chưa duyệt" = 2, "Yêu cầu sửa / Không đạt" = 0, "Chưa nộp" = 1, "Đã duyệt" = 1, and "Tất cả" = 4.\n' +
    '4. Under "Chưa duyệt", student "Trần Đức Anh" ("9990000801", with progress report) shows an enabled "Thẩm định" button and "Chưa kiểm tra trùng lặp", whereas student "Nguyễn Thị Ngọc" ("9990000802", without progress report) shows a disabled "Thẩm định" button with blocked reason "Chưa nộp phiếu theo dõi tiến độ" and link "Nộp Phiếu theo dõi tiến độ ngay".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Main supervisor "Nguyễn Minh Quân" ("GV999801") supervises 4 students: "9990000801" (PENDING final report, progress report uploaded), "9990000802" (PENDING final report, no progress report), "9990000803" (APPROVED final report with 12.5% plagiarism rate), and "9990000804" (STAGE_3_OUTLINE_APPROVED, no final report submitted yet).',
});

const ITC033 = defineItc({
  id: 'ITC033',
  feature: 'report',
  module: 'DuyetBaoCao',
  sheet: 'DuyetBaoCao',
  fn: 'View and Filter Supervised Final Reports',
  description:
    'Verify that a main supervisor can switch final report status tabs, search by student code, and see the empty state when no report matches the search keyword',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân") and open the "Thẩm định báo cáo" screen ("/lecturer/report-check").\n' +
    '2. Click the "Yêu cầu sửa / Không đạt" tab, then click the "Chưa nộp" tab, then click the "Đã duyệt" tab, and then click the "Tất cả" tab.\n' +
    '3. Enter "9990000802" into the "Tìm mã SV, tên hoặc đề tài..." search box.\n' +
    '4. Replace the search keyword with "KHONGTONTAI9999".',
  expected:
    '1. The API GET /report/supervisor-list returns HTTP 200 with code = 1000 and 4 items across PENDING ("9990000801"), REQUEST_CHANGES ("9990000802"), APPROVED ("9990000803"), and not-submitted ("9990000804").\n' +
    '2. Under "Yêu cầu sửa / Không đạt", only student "Nguyễn Thị Ngọc" ("9990000802") is displayed with badge "Yêu cầu chỉnh sửa", plagiarism badge "Trùng 18.5%", and status "Chờ SV nộp lại"; under "Chưa nộp", only student "Phạm Thu Hà" ("9990000804") is displayed with "Chưa nộp báo cáo Final" and "Chờ sinh viên nộp"; under "Đã duyệt", only student "Lê Văn Tài" ("9990000803") is displayed with "Đã duyệt đạt" and "Trùng 12.5%".\n' +
    '3. Searching "9990000802" under "Tất cả" displays only student "Nguyễn Thị Ngọc" ("9990000802").\n' +
    '4. Searching "KHONGTONTAI9999" displays empty state message "Không tìm thấy báo cáo đồ án phù hợp".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Main supervisor "GV999801" supervises 4 students: "9990000801" (PENDING), "9990000802" (REQUEST_CHANGES, plagiarism 18.5%), "9990000803" (APPROVED, plagiarism 12.5%), and "9990000804" (not submitted).',
});

const ITC034 = defineItc({
  id: 'ITC034',
  feature: 'report',
  module: 'DuyetBaoCao',
  sheet: 'DuyetBaoCao',
  fn: 'View and Filter Supervised Final Reports',
  description:
    'Verify that a co-supervisor can view supervised students\' final reports in read-only mode without the review action button',
  procedure:
    '1. Log in as a Co-Supervisor ("Đặng Thị Hương").\n' +
    '2. Open the "Thẩm định báo cáo" screen ("/lecturer/report-check").',
  expected:
    '1. The API GET /report/supervisor-list returns HTTP 200 with code = 1000 and includes student "9990000801"\'s PENDING final report with canReview = false.\n' +
    '2. The database confirms supervisor "GV999802" is assigned as the co-supervisor (co_lecturer_id) on student "9990000801"\'s thesis topic.\n' +
    '3. The row displays badge "Đồng hướng dẫn (Chỉ xem)" and action label "Chỉ xem" without any "Thẩm định" button.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Supervisor "Đặng Thị Hương" ("GV999802") is assigned as co-supervisor alongside main supervisor "Nguyễn Minh Quân" ("GV999801") for student "9990000801" who has an uploaded progress report and a PENDING final report.',
});

const ITC035 = defineItc({
  id: 'ITC035',
  feature: 'report',
  module: 'DuyetBaoCao',
  sheet: 'DuyetBaoCao',
  fn: 'View and Filter Supervised Final Reports',
  description:
    'Verify that final report review controls are disabled with appropriate blocked reasons when the report deadline is closed or has not started yet',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân") and open "/lecturer/report-check" while the "NOP_BAO_CAO_VA_PHIEU_THEO_DOI" deadline is CLOSED.\n' +
    '2. Update the deadline to NOT_STARTED and reload "/lecturer/report-check".',
  expected:
    '1. When CLOSED, GET /report/supervisor-list returns HTTP 200 with code = 1000 and deadlineStatus = "CLOSED"; the header displays "(Đã hết hạn)", the "Thẩm định" button for student "9990000801" is disabled, and the row displays blocked reason "Đã hết hạn thẩm định".\n' +
    '2. When NOT_STARTED, GET /report/supervisor-list returns HTTP 200 with code = 1000 and deadlineStatus = "NOT_STARTED"; the header displays badge "Chưa mở", the "Thẩm định" button for student "9990000801" is disabled, and the row displays blocked reason "Chưa tới thời gian mở".',
  precondition:
    '1. Student "Trần Đức Anh" ("9990000801") has an uploaded progress report and a PENDING final report supervised by "GV999801".\n' +
    '2. The "NOP_BAO_CAO_VA_PHIEU_THEO_DOI" deadline is configured sequentially as CLOSED and NOT_STARTED.',
});

const ITC036 = defineItc({
  id: 'ITC036',
  feature: 'report',
  module: 'DuyetBaoCao',
  sheet: 'DuyetBaoCao',
  fn: 'Inspect Final Report Preview and Submission History',
  description:
    'Verify that a main supervisor can open the submission history modal and inspect multiple final report submission versions with plagiarism check results and supervisor feedback',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân") and open the "Thẩm định báo cáo" screen ("/lecturer/report-check").\n' +
    '2. Click the "Lịch sử" button on the row of student "Trần Đức Anh" ("9990000801").',
  expected:
    '1. The API GET /report/{publicId} returns HTTP 200 with code = 1000 and 2 history records ordered newest first (version 2 in PENDING status with plagiarismRate = null followed by version 1 in REQUEST_CHANGES status with plagiarismRate = 22.5 and supervisorFeedback = "Cần bổ sung phân tích kết quả thực nghiệm chương 4.").\n' +
    '2. The database confirms 2 thesis_final_report_history records exist for student "9990000801".\n' +
    '3. The history modal "Lịch sử nộp báo cáo — Trần Đức Anh (9990000801)" displays "Lần 2" with "Chưa chấm", badge "Đã nộp, chờ nhận xét", and "Không có nhận xét", and "Lần 1" with "22.5%", plagiarism file link "64HTTT99_9990000801_DaoVan.pdf", badge "Yêu cầu chỉnh sửa", and feedback "Cần bổ sung phân tích kết quả thực nghiệm chương 4.".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Trần Đức Anh" ("9990000801") submitted version 1 (reviewed as REQUEST_CHANGES with 22.5% plagiarism rate) and resubmitted version 2 (currently PENDING).',
});

const ITC037 = defineItc({
  id: 'ITC037',
  feature: 'report',
  module: 'DuyetBaoCao',
  sheet: 'DuyetBaoCao',
  fn: 'Inspect Final Report Preview and Submission History',
  description:
    'Verify that a main supervisor can open the classroom preview modal for a pending PDF final report, inspect metadata and PDF viewer, and launch the review modal directly from the preview header',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân") and open the "Thẩm định báo cáo" screen ("/lecturer/report-check").\n' +
    '2. Click the PDF final report file name "64HTTT99_9990000801_TranDucAnh.pdf" on the row of student "Trần Đức Anh" ("9990000801").\n' +
    '3. Click the "Thẩm định báo cáo" button in the preview modal header.',
  expected:
    '1. The API GET /report/{publicId} returns HTTP 200 with code = 1000 including finalReportFile containing "64HTTT99_9990000801_TranDucAnh.pdf", progressReport with supervisorNote = "Hoàn thành tiến độ 12 tuần", and canReview = true.\n' +
    '2. The database confirms student "9990000801"\'s thesis_final_report is in PENDING status with an uploaded thesis_progress_report.\n' +
    '3. The classroom preview modal displays document title "64HTTT99_9990000801_TranDucAnh.pdf", student "Trần Đức Anh (9990000801)", main supervisor "Nguyễn Minh Quân", "Đã nộp phiếu tiến độ", "Chưa có kết quả kiểm tra trùng lặp.", a PDF preview iframe, and an enabled "Thẩm định báo cáo" button.\n' +
    '4. Clicking "Thẩm định báo cáo" closes the preview modal and opens the "Thẩm định báo cáo Final & Kiểm tra trùng lặp" modal.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Trần Đức Anh" ("9990000801") has an uploaded progress report ("Hoàn thành tiến độ 12 tuần") and a PENDING PDF final report ("64HTTT99_9990000801_TranDucAnh.pdf").',
});

const ITC038 = defineItc({
  id: 'ITC038',
  feature: 'report',
  module: 'DuyetBaoCao',
  sheet: 'DuyetBaoCao',
  fn: 'Inspect Final Report Preview and Submission History',
  description:
    'Verify that opening the classroom preview modal for a DOCX final report without a progress report displays the non-PDF fallback viewer, missing progress report warning, and hides the review button',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân") and open the "Thẩm định báo cáo" screen ("/lecturer/report-check").\n' +
    '2. Click the DOCX final report file name "64HTTT99_9990000802_NguyenThiNgoc.docx" on the row of student "Nguyễn Thị Ngọc" ("9990000802").',
  expected:
    '1. The API GET /report/{publicId} returns HTTP 200 with code = 1000 including finalReportFile containing "64HTTT99_9990000802_NguyenThiNgoc.docx" and progressReport = null.\n' +
    '2. The database confirms 0 thesis_progress_report records exist for student "9990000802".\n' +
    '3. The preview modal displays warning "Chưa có phiếu theo dõi tiến độ (bắt buộc nộp trước khi thẩm định).", blocked reason "Chưa nộp phiếu theo dõi tiến độ", link "Nộp Phiếu theo dõi tiến độ ngay", fallback message "Trình duyệt không hỗ trợ xem trực tiếp định dạng DOCX. Vui lòng tải xuống hoặc mở trong tab mới.", button "Tải xuống tệp", and hides the "Thẩm định báo cáo" header button.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Nguyễn Thị Ngọc" ("9990000802") has a PENDING DOCX final report ("64HTTT99_9990000802_NguyenThiNgoc.docx") and no progress report uploaded yet.',
});

const ITC039 = defineItc({
  id: 'ITC039',
  feature: 'report',
  module: 'DuyetBaoCao',
  sheet: 'DuyetBaoCao',
  fn: 'Submit Plagiarism Check Result and Review Final Report',
  description:
    'Verify that a main supervisor can approve a pending final report during the open submission period with a valid plagiarism PDF and trimmed feedback, advancing the thesis topic to STAGE_4_REPORT_APPROVED',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân") and open the "Thẩm định báo cáo" screen ("/lecturer/report-check").\n' +
    '2. Click "Thẩm định" on the row of student "Trần Đức Anh" ("9990000801").\n' +
    '3. Keep "Duyệt đạt (APPROVED)" selected, enter "15.5" into "Tỷ lệ đạo văn (%)", select the valid plagiarism PDF "64HTTT99_9990000801_DaoVan.pdf" (containing student code "9990000801" and similarity score "15.5%"), enter "  Báo cáo hoàn chỉnh, tỷ lệ trùng lặp trong ngưỡng cho phép.  " into "Ý kiến nhận xét của GVHD", and click "Xác nhận thẩm định".',
  expected:
    '1. The API PUT /report/{publicId}/review returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Thẩm định báo cáo Final thành công".\n' +
    '3. The database updates thesis_final_report (status = APPROVED, plagiarism_rate = 15.5, plagiarism_file containing "64HTTT99_9990000801_DaoVan.pdf", trimmed supervisor_feedback = "Báo cáo hoàn chỉnh, tỷ lệ trùng lặp trong ngưỡng cho phép.", reviewed_at IS NOT NULL), updates the latest thesis_final_report_history to APPROVED with matching plagiarism_rate and plagiarism_history_file, advances thesis_topic.current_stage to STAGE_4_REPORT_APPROVED (status = IN_PROGRESS), and creates a student notification "Báo cáo Final của bạn đã được GVHD phê duyệt ĐẠT. Tỷ lệ đạo văn: 15.50%. Nhận xét: Báo cáo hoàn chỉnh, tỷ lệ trùng lặp trong ngưỡng cho phép.".\n' +
    '4. The UI displays toast "Đã duyệt đạt báo cáo Final", closes the modal, removes the student from "Chưa duyệt" (count becomes 0), and displays the student under "Đã duyệt" (count becomes 1) with badges "Trùng 15.5%" and "Đã duyệt đạt".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Trần Đức Anh" ("9990000801") is at STAGE_3_OUTLINE_APPROVED with an uploaded progress report and a PENDING final report.',
});

const ITC040 = defineItc({
  id: 'ITC040',
  feature: 'report',
  module: 'DuyetBaoCao',
  sheet: 'DuyetBaoCao',
  fn: 'Submit Plagiarism Check Result and Review Final Report',
  description:
    'Verify that a main supervisor can request changes on a pending final report during the open submission period with a valid plagiarism PDF and trimmed feedback',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân") and open the "Thẩm định báo cáo" screen ("/lecturer/report-check").\n' +
    '2. Click "Thẩm định" on the row of student "Trần Đức Anh" ("9990000801").\n' +
    '3. Select "Yêu cầu chỉnh sửa (REQUEST_CHANGES)", enter "24.5" into "Tỷ lệ đạo văn (%)", select the valid plagiarism PDF "64HTTT99_9990000801_DaoVan.pdf" (containing student code "9990000801" and similarity score "24.5%"), enter "  Cần trích dẫn lại chương 2 và giảm tỷ lệ trùng lặp ở phần tổng quan.  ", and click "Xác nhận thẩm định".',
  expected:
    '1. The API PUT /report/{publicId}/review returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Thẩm định báo cáo Final thành công".\n' +
    '3. The database updates thesis_final_report (status = REQUEST_CHANGES, plagiarism_rate = 24.5, plagiarism_file containing "64HTTT99_9990000801_DaoVan.pdf", trimmed supervisor_feedback = "Cần trích dẫn lại chương 2 và giảm tỷ lệ trùng lặp ở phần tổng quan.", reviewed_at IS NOT NULL), updates the latest thesis_final_report_history to REQUEST_CHANGES, keeps thesis_topic.current_stage = STAGE_3_OUTLINE_APPROVED and status = IN_PROGRESS, and creates a student notification "Báo cáo Final của bạn cần chỉnh sửa theo góp ý của GVHD. Vui lòng sửa và nộp lại trước hạn. Tỷ lệ đạo văn: 24.50%. Nhận xét: Cần trích dẫn lại chương 2 và giảm tỷ lệ trùng lặp ở phần tổng quan.".\n' +
    '4. The UI displays toast "Đã gửi yêu cầu chỉnh sửa báo cáo Final", closes the modal, and moves the student to the "Yêu cầu sửa / Không đạt" tab with badge "Yêu cầu chỉnh sửa", "Trùng 24.5%", and "Chờ SV nộp lại".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Trần Đức Anh" ("9990000801") is at STAGE_3_OUTLINE_APPROVED with an uploaded progress report and a PENDING final report.',
});

const ITC041 = defineItc({
  id: 'ITC041',
  feature: 'report',
  module: 'DuyetBaoCao',
  sheet: 'DuyetBaoCao',
  fn: 'Submit Plagiarism Check Result and Review Final Report',
  description:
    'Verify that a main supervisor can approve a pending final report at the exact 35.0% plagiarism boundary without feedback during the extended grading period',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân") and open "/lecturer/report-check" while the deadline is in EXTENDED status.\n' +
    '2. Click "Thẩm định" on the row of student "Trần Đức Anh" ("9990000801").\n' +
    '3. Verify the modal shows allowed decisions "Duyệt đạt (APPROVED)" and "Không đạt (REJECTED)" (with no REQUEST_CHANGES option), enter "35" into "Tỷ lệ đạo văn (%)", select the valid plagiarism PDF "64HTTT99_9990000801_DaoVan.pdf" (similarity score "35%"), enter spaces "   " in the feedback field, and click "Xác nhận thẩm định".',
  expected:
    '1. The header displays "(Gia hạn chấm)" and the modal badge displays "Gia hạn chấm".\n' +
    '2. The API PUT /report/{publicId}/review returns HTTP 200 with code = 1000 and message "Thẩm định báo cáo Final thành công".\n' +
    '3. The database updates thesis_final_report (status = APPROVED, plagiarism_rate = 35.0, supervisor_feedback = NULL), updates the latest thesis_final_report_history to APPROVED with supervisor_feedback = NULL, advances thesis_topic.current_stage to STAGE_4_REPORT_APPROVED, and creates a student notification "Báo cáo Final của bạn đã được GVHD phê duyệt ĐẠT. Tỷ lệ đạo văn: 35.00%.".\n' +
    '4. The UI displays toast "Đã duyệt đạt báo cáo Final" and moves the student to the "Đã duyệt" tab with badge "Trùng 35%".',
  precondition:
    '1. An ongoing semester exists where the "NOP_BAO_CAO_VA_PHIEU_THEO_DOI" deadline is in EXTENDED status within its active date range.\n' +
    '2. Student "Trần Đức Anh" ("9990000801") is at STAGE_3_OUTLINE_APPROVED with an uploaded progress report and a PENDING final report.',
});

const ITC042 = defineItc({
  id: 'ITC042',
  feature: 'report',
  module: 'DuyetBaoCao',
  sheet: 'DuyetBaoCao',
  fn: 'Submit Plagiarism Check Result and Review Final Report',
  description:
    'Verify that a main supervisor can reject a pending final report during the extended grading period and disqualify the student\'s thesis topic',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân") and open "/lecturer/report-check" while the deadline is in EXTENDED status.\n' +
    '2. Click "Thẩm định" on the row of student "Trần Đức Anh" ("9990000801").\n' +
    '3. Select "Không đạt (REJECTED)", enter "30" into "Tỷ lệ đạo văn (%)", select the valid plagiarism PDF "64HTTT99_9990000801_DaoVan.pdf" (similarity score "30%"), enter "Báo cáo không hoàn thiện các yêu cầu cốt lõi sau thời gian gia hạn.", and click "Xác nhận thẩm định".',
  expected:
    '1. The API PUT /report/{publicId}/review returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Thẩm định báo cáo Final thành công".\n' +
    '3. The database updates thesis_final_report (status = REJECTED, plagiarism_rate = 30.0, supervisor_feedback = "Báo cáo không hoàn thiện các yêu cầu cốt lõi sau thời gian gia hạn."), updates the latest thesis_final_report_history to REJECTED, updates thesis_topic.status = DISQUALIFIED with disqualification_reason = "Không hoàn thành phê duyệt báo cáo đúng hạn", and creates a student notification "Báo cáo Final của bạn không đạt trong đợt gia hạn chấm. Đồ án đã bị đình chỉ trong học kỳ này. Tỷ lệ đạo văn: 30.00%. Nhận xét: Báo cáo không hoàn thiện các yêu cầu cốt lõi sau thời gian gia hạn.".\n' +
    '4. The UI displays toast "Đã ghi nhận kết quả không đạt cho báo cáo Final" and moves the student to the "Yêu cầu sửa / Không đạt" tab with badges "Đình chỉ", "Trùng 30%", and "Không đạt".',
  precondition:
    '1. An ongoing semester exists where the "NOP_BAO_CAO_VA_PHIEU_THEO_DOI" deadline is in EXTENDED status within its active date range.\n' +
    '2. Student "Trần Đức Anh" ("9990000801") is at STAGE_3_OUTLINE_APPROVED with an uploaded progress report and a PENDING final report.',
});

const ITC043 = defineItc({
  id: 'ITC043',
  feature: 'report',
  module: 'DuyetBaoCao',
  sheet: 'DuyetBaoCao',
  fn: 'Submit Plagiarism Check Result and Review Final Report',
  description:
    'Verify that entering a plagiarism rate above 35% disables the APPROVED option on the UI and is rejected by the backend API for any review decision',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân"), open "/lecturer/report-check", and click "Thẩm định" on student "Trần Đức Anh" ("9990000801").\n' +
    '2. Enter "36.5" into "Tỷ lệ đạo văn (%)".\n' +
    '3. Select the plagiarism PDF "64HTTT99_9990000801_DaoVan.pdf" (containing similarity score "36.5%") and click "Xác nhận thẩm định" (with decision automatically switched to "Yêu cầu chỉnh sửa (REQUEST_CHANGES)").',
  expected:
    '1. Entering 36.5% displays alert "Tỷ lệ đạo văn vượt quá 35% (tối đa cho phép: 35.0%). Không thể phê duyệt Đạt. Vui lòng chọn \'Yêu cầu chỉnh sửa\' (khi đang mở nộp) hoặc \'Không đạt\' (khi gia hạn chấm).", disables the "Duyệt đạt (APPROVED)" radio option with badge "Không khả dụng khi đạo văn > 35%", and switches the selected decision to "Yêu cầu chỉnh sửa (REQUEST_CHANGES)".\n' +
    '2. Submitting with 36.5% calls PUT /report/{publicId}/review and returns HTTP 400 with code = 4000 and message "Tỷ lệ trùng lặp trong báo cáo vượt quá ngưỡng cho phép (tối đa 35%). Đồ án không đủ điều kiện duyệt!".\n' +
    '3. The modal remains open and displays field error "Tỷ lệ trùng lặp trong báo cáo vượt quá ngưỡng cho phép (tối đa 35%). Đồ án không đủ điều kiện duyệt!" under "Tỷ lệ đạo văn (%)".\n' +
    '4. The database keeps thesis_final_report.status = PENDING and plagiarism_rate = NULL.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Trần Đức Anh" ("9990000801") has an uploaded progress report and a PENDING final report.',
});

const ITC044 = defineItc({
  id: 'ITC044',
  feature: 'report',
  module: 'DuyetBaoCao',
  sheet: 'DuyetBaoCao',
  fn: 'Submit Plagiarism Check Result and Review Final Report',
  description:
    'Verify that submitting a plagiarism rate that is empty or outside the 0% to 100% range is blocked by client-side validation and rejected by the backend API',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân"), open "/lecturer/report-check", and click "Thẩm định" on student "Trần Đức Anh" ("9990000801").\n' +
    '2. Select the valid plagiarism PDF "64HTTT99_9990000801_DaoVan.pdf" and click "Xác nhận thẩm định" while leaving "Tỷ lệ đạo văn (%)" blank.\n' +
    '3. Enter "-1" into "Tỷ lệ đạo văn (%)" and click "Xác nhận thẩm định", then enter "105" into "Tỷ lệ đạo văn (%)" (with "Yêu cầu chỉnh sửa (REQUEST_CHANGES)" selected) and click "Xác nhận thẩm định".',
  expected:
    '1. No request is sent to PUT /report/{publicId}/review from the UI in any of the invalid attempts.\n' +
    '2. The modal displays validation message "Vui lòng nhập tỷ lệ đạo văn" when blank and "Tỷ lệ đạo văn phải nằm trong khoảng 0% đến 100%" when -1 or 105 is entered.\n' +
    '3. Direct API PUT /report/{publicId}/review with missing plagiarismRate returns HTTP 400 with code = 4000 and message "Vui lòng nhập tỷ lệ đạo văn", and with plagiarismRate = 105 returns HTTP 400 with code = 4000 and message "Tỷ lệ đạo văn phải nằm trong khoảng 0% đến 100%".\n' +
    '4. The database keeps thesis_final_report.status = PENDING.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Trần Đức Anh" ("9990000801") has an uploaded progress report and a PENDING final report.',
});

const ITC045 = defineItc({
  id: 'ITC045',
  feature: 'report',
  module: 'DuyetBaoCao',
  sheet: 'DuyetBaoCao',
  fn: 'Submit Plagiarism Check Result and Review Final Report',
  description:
    'Verify that submitting without a plagiarism file, selecting a non-PDF file (.docx), or selecting an improperly named PDF file is blocked by validation',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân"), open "/lecturer/report-check", and click "Thẩm định" on student "Trần Đức Anh" ("9990000801").\n' +
    '2. Enter "12" into "Tỷ lệ đạo văn (%)" and click "Xác nhận thẩm định" without selecting a file.\n' +
    '3. Select the non-PDF file "64HTTT99_9990000801_DaoVan.docx" and click "Xác nhận thẩm định".\n' +
    '4. Clear the file, select the improperly named PDF file "BaoCaoDaoVan.pdf", and click "Xác nhận thẩm định".',
  expected:
    '1. No request is sent to PUT /report/{publicId}/review from the UI in any of the 3 attempts.\n' +
    '2. The modal displays "File báo cáo kiểm tra trùng lặp không được để trống." when no file is selected, "File kiểm tra trùng lặp bắt buộc là định dạng .pdf (xuất từ Turnitin / KiểmTraTàiLiệu)." for the .docx file, and "Tên file không đúng định dạng! Vui lòng đổi tên file theo định dạng Tenlop_MaSV_HoVaTen (VD: DHKTPM17A_22110001_NguyenVanAn.pdf)" for "BaoCaoDaoVan.pdf".\n' +
    '3. Direct API PUT /report/{publicId}/review with "BaoCaoDaoVan.pdf" returns HTTP 400 with code = 4000 and message "Tên file không đúng định dạng! Vui lòng đổi tên file theo định dạng Tenlop_MaSV_HoVaTen (VD: DHKTPM17A_22110001_NguyenVanAn.pdf)".\n' +
    '4. The database keeps thesis_final_report.status = PENDING.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Trần Đức Anh" ("9990000801") has an uploaded progress report and a PENDING final report.',
});

const ITC046 = defineItc({
  id: 'ITC046',
  feature: 'report',
  module: 'DuyetBaoCao',
  sheet: 'DuyetBaoCao',
  fn: 'Submit Plagiarism Check Result and Review Final Report',
  description:
    'Verify that selecting an empty (0-byte) plagiarism file or a file of 10 MB or larger is blocked by validation',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân"), open "/lecturer/report-check", and click "Thẩm định" on student "Trần Đức Anh" ("9990000801").\n' +
    '2. Enter "12" into "Tỷ lệ đạo văn (%)", select a 0-byte PDF file "64HTTT99_9990000801_DaoVan.pdf", and click "Xác nhận thẩm định".\n' +
    '3. Clear the file, select a 10 MB PDF file "64HTTT99_9990000801_DaoVan.pdf", and click "Xác nhận thẩm định".',
  expected:
    '1. No request is sent to PUT /report/{publicId}/review from the UI in either attempt.\n' +
    '2. The modal displays "File báo cáo kiểm tra trùng lặp không được để trống." for the 0-byte file and "File tải lên phải nhỏ hơn 10MB." for the 10 MB file.\n' +
    '3. Direct API PUT /report/{publicId}/review with a 0-byte file returns HTTP 400 with code = 4000 and message "File tải lên không được để trống".\n' +
    '4. The database keeps thesis_final_report.status = PENDING.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Trần Đức Anh" ("9990000801") has an uploaded progress report and a PENDING final report.',
});

const ITC047 = defineItc({
  id: 'ITC047',
  feature: 'report',
  module: 'DuyetBaoCao',
  sheet: 'DuyetBaoCao',
  fn: 'Submit Plagiarism Check Result and Review Final Report',
  description:
    'Verify that submitting a plagiarism rate on the form that does not match the similarity score inside the uploaded PDF is rejected by the backend scanner',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân"), open "/lecturer/report-check", and click "Thẩm định" on student "Trần Đức Anh" ("9990000801").\n' +
    '2. Enter "12.0" into "Tỷ lệ đạo văn (%)", select the plagiarism PDF "64HTTT99_9990000801_DaoVan.pdf" whose internal similarity score is "18.5%", and click "Xác nhận thẩm định".',
  expected:
    '1. The API PUT /report/{publicId}/review returns HTTP 400 with code = 4000 and message "Số liệu không khớp! Tỷ lệ trùng lặp bạn nhập khác với kết quả trong file báo cáo PDF. Vui lòng kiểm tra lại tài liệu!".\n' +
    '2. The modal remains open and displays mapped error "Số liệu không khớp! Tỷ lệ trùng lặp bạn nhập trên Form khác với kết quả ghi nhận trong file báo cáo PDF. Vui lòng kiểm tra lại tỷ lệ % đã gõ!" under "Tỷ lệ đạo văn (%)".\n' +
    '3. The database keeps thesis_final_report.status = PENDING and plagiarism_rate = NULL.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Trần Đức Anh" ("9990000801") has an uploaded progress report and a PENDING final report.',
});

const ITC048 = defineItc({
  id: 'ITC048',
  feature: 'report',
  module: 'DuyetBaoCao',
  sheet: 'DuyetBaoCao',
  fn: 'Submit Plagiarism Check Result and Review Final Report',
  description:
    'Verify that uploading a plagiarism PDF belonging to another student code is rejected with a student-mismatch warning',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân"), open "/lecturer/report-check", and click "Thẩm định" on student "Trần Đức Anh" ("9990000801").\n' +
    '2. Enter "14.0" into "Tỷ lệ đạo văn (%)", select the plagiarism PDF "64HTTT99_9990000801_DaoVan.pdf" whose internal document name contains another student\'s code ("64HTTT99_9990000802_NguyenThiNgoc.pdf", similarity score "14.0%"), and click "Xác nhận thẩm định".',
  expected:
    '1. The API PUT /report/{publicId}/review returns HTTP 400 with code = 4000 and message "Cảnh báo nhầm tài liệu! File báo cáo PDF có mã sinh viên không khớp với sinh viên đang duyệt.".\n' +
    '2. The UI displays error toast and file field error "Cảnh báo nộp nhầm file! Báo cáo PDF có Mã sinh viên không khớp với sinh viên của đề tài đang duyệt. Vui lòng chọn đúng file của sinh viên này!".\n' +
    '3. The database keeps thesis_final_report.status = PENDING and plagiarism_rate = NULL.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Trần Đức Anh" ("9990000801") has an uploaded progress report and a PENDING final report.',
});

const ITC049 = defineItc({
  id: 'ITC049',
  feature: 'report',
  module: 'DuyetBaoCao',
  sheet: 'DuyetBaoCao',
  fn: 'Submit Plagiarism Check Result and Review Final Report',
  description:
    'Verify that uploading a plagiarism PDF without a valid 10-digit student code or with internal header-vs-chart score inconsistency is rejected by the backend scanner',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân"), open "/lecturer/report-check", and click "Thẩm định" on student "Trần Đức Anh" ("9990000801").\n' +
    '2. Enter "15.0" into "Tỷ lệ đạo văn (%)", select a plagiarism PDF whose internal "Tên tài liệu" line contains no 10-digit student code ("BaoCaoTotNghiep_TranDucAnh.pdf"), and click "Xác nhận thẩm định".\n' +
    '3. Replace the file with a tampered plagiarism PDF where "Điểm trùng lặp: 10.0" differs from "Có 25.0% nội dung trùng lặp" and click "Xác nhận thẩm định".',
  expected:
    '1. In step 2, PUT /report/{publicId}/review returns HTTP 400 with code = 4000 and message "Không tìm thấy Mã sinh viên hợp lệ trong mục \'Tên tài liệu\' của file báo cáo PDF (Quy chuẩn: Lop_MSV_HoTen)!"; the modal displays "Không tìm thấy Mã sinh viên hợp lệ trong mục \\"Tên tài liệu\\" của file báo cáo PDF. Vui lòng kiểm tra file có quy chuẩn đặt tên Lop_MSV_HoTen!".\n' +
    '2. In step 3, PUT /report/{publicId}/review returns HTTP 400 with code = 4000 and message "Phát hiện bất thường trong file PDF: \'Điểm trùng lặp\' ở phần thông tin không khớp với biểu đồ kết quả!"; the modal displays "Phát hiện bất thường trong file PDF: Điểm trùng lặp ở phần thông tin không khớp với biểu đồ tròn kết quả!".\n' +
    '3. The database keeps thesis_final_report.status = PENDING and plagiarism_rate = NULL.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Trần Đức Anh" ("9990000801") has an uploaded progress report and a PENDING final report.',
});

const ITC050 = defineItc({
  id: 'ITC050',
  feature: 'report',
  module: 'DuyetBaoCao',
  sheet: 'DuyetBaoCao',
  fn: 'Submit Plagiarism Check Result and Review Final Report',
  description:
    'Verify that submitting a REQUEST_CHANGES decision when the deadline transitions to EXTENDED or a REJECTED decision when the deadline transitions to OPEN is blocked with HTTP 400',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân"), open "/lecturer/report-check" while the deadline is OPEN, click "Thẩm định" on student "Trần Đức Anh" ("9990000801"), select "Yêu cầu chỉnh sửa (REQUEST_CHANGES)", enter "16.0", and select "64HTTT99_9990000801_DaoVan.pdf" (score "16.0%").\n' +
    '2. The deadline transitions to EXTENDED before clicking "Xác nhận thẩm định"; click "Xác nhận thẩm định".\n' +
    '3. Reload "/lecturer/report-check" while EXTENDED, open the modal, select "Không đạt (REJECTED)", enter "16.0", select "64HTTT99_9990000801_DaoVan.pdf", transition the deadline back to OPEN, and click "Xác nhận thẩm định".',
  expected:
    '1. In step 2, PUT /report/{publicId}/review returns HTTP 400 with code = 3099 and message "Trong thời gian gia hạn chấm chỉ được chọn Đạt (APPROVED) hoặc Không đạt (REJECTED)", and the modal displays that decision error.\n' +
    '2. In step 3, PUT /report/{publicId}/review returns HTTP 400 with code = 3098 and message "Trong thời gian nhận bài chỉ được chọn Đạt (APPROVED) hoặc Yêu cầu chỉnh sửa (REQUEST_CHANGES)", and the modal displays that decision error.\n' +
    '3. The database keeps thesis_final_report.status = PENDING and thesis_topic.status = IN_PROGRESS.',
  precondition:
    '1. Student "Trần Đức Anh" ("9990000801") has an uploaded progress report and a PENDING final report supervised by "GV999801".\n' +
    '2. The "NOP_BAO_CAO_VA_PHIEU_THEO_DOI" deadline transitions between OPEN and EXTENDED while the review modal is open.',
});

const ITC051 = defineItc({
  id: 'ITC051',
  feature: 'report',
  module: 'DuyetBaoCao',
  sheet: 'DuyetBaoCao',
  fn: 'Submit Plagiarism Check Result and Review Final Report',
  description:
    'Verify that submitting a final report review is blocked when the grading deadline closes concurrently before clicking confirm',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân"), open "/lecturer/report-check" while the deadline is OPEN, click "Thẩm định" on student "Trần Đức Anh" ("9990000801"), enter "14.0", and select "64HTTT99_9990000801_DaoVan.pdf" (score "14.0%").\n' +
    '2. The "NOP_BAO_CAO_VA_PHIEU_THEO_DOI" deadline transitions to COMPLETED before clicking confirm.\n' +
    '3. Click "Xác nhận thẩm định".',
  expected:
    '1. The API PUT /report/{publicId}/review returns HTTP 403 with code = 3097 and message "Đã quá thời hạn GVHD thẩm định báo cáo, vui lòng liên hệ Trưởng bộ môn gia hạn".\n' +
    '2. The modal remains open and displays server error alert "Đã quá thời hạn GVHD thẩm định báo cáo, vui lòng liên hệ Trưởng bộ môn gia hạn".\n' +
    '3. The database keeps thesis_final_report.status = PENDING and plagiarism_rate = NULL.',
  precondition:
    '1. Main supervisor "GV999801" opens the review modal for student "9990000801" while the deadline is OPEN, and the deadline transitions to COMPLETED before submitting.',
});

const ITC052 = defineItc({
  id: 'ITC052',
  feature: 'report',
  module: 'DuyetBaoCao',
  sheet: 'DuyetBaoCao',
  fn: 'Submit Plagiarism Check Result and Review Final Report',
  description:
    'Verify that submitting a final report review is blocked when the report is no longer in PENDING status or when the progress report has not been submitted',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân"), open "/lecturer/report-check", click "Thẩm định" on student "Trần Đức Anh" ("9990000801"), enter "14.0", and select "64HTTT99_9990000801_DaoVan.pdf" (score "14.0%").\n' +
    '2. Concurrently, the report is already reviewed as REQUEST_CHANGES before clicking confirm in the modal; click "Xác nhận thẩm định".\n' +
    '3. For student "Nguyễn Thị Ngọc" ("9990000802", who has a PENDING final report but no progress report), verify the UI blocks opening the review modal and direct API PUT /report/{publicId}/review is rejected.',
  expected:
    '1. In step 2, PUT /report/{publicId}/review returns HTTP 409 with code = 3092 and message "Báo cáo không ở trạng thái chờ thẩm định", and the modal displays alert "Báo cáo không ở trạng thái chờ thẩm định".\n' +
    '2. In step 3, student "9990000802"\'s "Thẩm định" button is disabled with "Chưa nộp phiếu theo dõi tiến độ", and direct API PUT /report/{publicId}/review returns HTTP 409 with code = 3093 and message "GVHD chưa nộp phiếu theo dõi tiến độ cho đề tài này".\n' +
    '3. The database preserves student "9990000801"\'s REQUEST_CHANGES status and keeps student "9990000802"\'s report in PENDING status.',
  precondition:
    '1. Student "Trần Đức Anh" ("9990000801") has a PENDING final report and progress report; student "Nguyễn Thị Ngọc" ("9990000802") has a PENDING final report without a progress report.',
});

// ============================================================================
// SECURITY TEST CASES (TC-SEC-048 .. TC-SEC-053)
// ============================================================================

const SEC048 = defineItcSec({
  id: 'TC-SEC-048',
  feature: 'report',
  module: 'DuyetBaoCao',
  sheet: 'DuyetBaoCao',
  scenario: 'An unauthenticated user opens the Report Check screen directly and calls supervisor report review APIs',
  roleSession: 'Unauthenticated (Anonymous)',
  technique: 'EP',
  given: 'The browser has no active login session (no access_token cookie)',
  when: 'Open "/lecturer/report-check" directly on the Lecturer portal and call GET /report/supervisor-list, GET /report/{publicId}, and PUT /report/{publicId}/review',
  then: 'GET /my-info, GET /report/supervisor-list, GET /report/{publicId}, and PUT /report/{publicId}/review return HTTP 401 with code = 2000; the UI automatically redirects to "/login" and displays no final report data',
});

const SEC049 = defineItcSec({
  id: 'TC-SEC-049',
  feature: 'report',
  module: 'DuyetBaoCao',
  sheet: 'DuyetBaoCao',
  scenario: 'A student accesses the Report Check screen and invokes supervisor report review API',
  roleSession: 'Student (STUDENT), logged in',
  technique: 'EP',
  given: 'Logged in with a Student account (without SUPERVISOR role or REVIEW_REPORT authority)',
  when: 'Open "/lecturer/report-check" directly on the Lecturer portal and call GET /report/supervisor-list and PUT /report/{publicId}/review',
  then: 'The UI blocks access with message "Tài khoản của bạn không có quyền truy cập cổng cán bộ."; GET /report/supervisor-list returns HTTP 403 with code = 2001; PUT /report/{publicId}/review returns HTTP 403 with code = 2001 and message "Bạn không có quyền truy cập (access denied)", and thesis_final_report.status remains PENDING in the database',
});

const SEC050 = defineItcSec({
  id: 'TC-SEC-050',
  feature: 'report',
  module: 'DuyetBaoCao',
  sheet: 'DuyetBaoCao',
  scenario: 'A plain lecturer without the SUPERVISOR role accesses the Report Check screen and calls final report detail and review APIs',
  roleSession: 'Lecturer (LECTURER), logged in',
  technique: 'EP',
  given: 'Logged in with a Lecturer account not assigned as a supervisor in the semester (without SUPERVISOR role or REVIEW_REPORT authority)',
  when: 'Open "/lecturer/report-check" directly on the Lecturer portal and call GET /report/supervisor-list, GET /report/{publicId}, and PUT /report/{publicId}/review',
  then: 'The UI blocks access with message "Tài khoản của bạn không có quyền truy cập cổng cán bộ."; GET /report/supervisor-list, GET /report/{publicId}, and PUT /report/{publicId}/review return HTTP 403 with code = 2001 and message "Bạn không có quyền truy cập (access denied)", and thesis_final_report.status remains PENDING in the database',
});

const SEC051 = defineItcSec({
  id: 'TC-SEC-051',
  feature: 'report',
  module: 'DuyetBaoCao',
  sheet: 'DuyetBaoCao',
  scenario: 'A supervisor session with a logged-out token accesses the Report Check screen and calls report review APIs',
  roleSession: 'Supervisor (SUPERVISOR), logged-out token',
  technique: 'STATE_TRANSITION',
  given: 'The supervisor has logged out via POST /log-out so the token is invalidated, while the browser still sends the old access_token cookie',
  when: 'Open "/lecturer/report-check" and call GET /report/supervisor-list and PUT /report/{publicId}/review with the logged-out token',
  then: 'GET /my-info, GET /report/supervisor-list, and PUT /report/{publicId}/review return HTTP 401 with code = 2000; the UI redirects to "/login", displays no data, and thesis_final_report.status remains PENDING in the database',
});

const SEC052 = defineItcSec({
  id: 'TC-SEC-052',
  feature: 'report',
  module: 'DuyetBaoCao',
  sheet: 'DuyetBaoCao',
  scenario: 'A co-supervisor attempts to review a student\'s final report via direct API despite read-only UI',
  roleSession: 'Co-Supervisor (SUPERVISOR), logged in as co-lecturer',
  technique: 'DECISION_TABLE',
  given: 'Supervisor "GV999802" is assigned as the co-supervisor (not the main supervisor) of student "9990000801"\'s thesis topic with an uploaded progress report and a PENDING final report',
  when: 'Open "/lecturer/report-check" as Co-Supervisor "GV999802" and invoke PUT /report/{publicId}/review directly with a valid plagiarism PDF',
  then: 'The UI displays badge "Đồng hướng dẫn (Chỉ xem)" and action label "Chỉ xem" with no "Thẩm định" button; PUT /report/{publicId}/review returns HTTP 403 with code = 2001 and message "Giảng viên đồng hướng dẫn chỉ có quyền xem, không có quyền thẩm định báo cáo", and thesis_final_report.status remains PENDING in the database',
});

const SEC053 = defineItcSec({
  id: 'TC-SEC-053',
  feature: 'report',
  module: 'DuyetBaoCao',
  sheet: 'DuyetBaoCao',
  scenario: 'An unrelated supervisor attempts to view detail or review another supervisor\'s student final report (IDOR)',
  roleSession: 'Supervisor (SUPERVISOR), logged in as unrelated supervisor',
  technique: 'ERROR_GUESSING',
  given: 'Supervisor "GV999803" holds the SUPERVISOR role while student "9990000801"\'s PENDING final report is supervised by "GV999801"',
  when: 'Open "/lecturer/report-check" as Supervisor "GV999803" and invoke GET /report/{publicId} and PUT /report/{publicId}/review targeting student "9990000801"\'s finalReportPublicId',
  then: 'Student "9990000801" is not displayed in Supervisor "GV999803"\'s table; GET /report/{publicId} returns HTTP 403 with code = 2001 and message "Bạn không có quyền truy cập thông tin báo cáo này"; PUT /report/{publicId}/review returns HTTP 403 with code = 2001 and message "Bạn không phải giảng viên hướng dẫn chính của đề tài này", and thesis_final_report.status remains PENDING in the database',
});

// ============================================================================
// TẠO FILE MẪU HỢP LỆ (PDF / DOCX / PDF ĐẠO VĂN TIẾNG VIỆT UNICODE)
// ============================================================================

const OFFICIAL_TITLE_DEFAULT = 'Hệ thống kiểm tra trùng lặp và thẩm định báo cáo đồ án tốt nghiệp';
const VALID_PDF_FILENAME_1 = '64HTTT99_9990000801_TranDucAnh.pdf';
const VALID_PDF_FILENAME_2 = '64HTTT99_9990000802_NguyenThiNgoc.pdf';
const VALID_DOCX_FILENAME_2 = '64HTTT99_9990000802_NguyenThiNgoc.docx';
const VALID_PDF_FILENAME_3 = '64HTTT99_9990000803_LeVanTai.pdf';
const PLAGIARISM_PDF_FILENAME_1 = '64HTTT99_9990000801_DaoVan.pdf';
const PLAGIARISM_DOCX_FILENAME_1 = '64HTTT99_9990000801_DaoVan.docx';
const PLAGIARISM_PDF_FILENAME_2 = '64HTTT99_9990000802_DaoVan.pdf';
const PLAGIARISM_PDF_FILENAME_3 = '64HTTT99_9990000803_DaoVan.pdf';
const INVALID_NAME_PLAGIARISM_PDF = 'BaoCaoDaoVan.pdf';

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

function createPlagiarismPdfBuffer(
  documentName: string,
  headerScore: number,
  ringScore: number = headerScore,
): Buffer {
  const headerStr = String(headerScore);
  const ringStr = String(ringScore);
  const lines = [
    'BÁO CÁO KIỂM TRA TRÙNG LẶP',
    `Tên tài liệu: ${documentName}`,
    `Điểm trùng lặp: ${headerStr}`,
    `Có ${ringStr}% nội dung trùng lặp`,
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

function createMinimalValidDocxBuffer(text = 'TLU GPMS Test Report DOCX'): Buffer {
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
  firstName: 'Nguyễn Minh',
  lastName: 'Quân',
  fullName: 'Nguyễn Minh Quân',
  email: 'itc.duyetbc.gv.999801@tlu.edu.vn',
  phone: '0989980801',
  academicTitle: 'TS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_CO_SUPERVISOR = {
  teacherCode: 'GV999802',
  firstName: 'Đặng Thị',
  lastName: 'Hương',
  fullName: 'Đặng Thị Hương',
  email: 'itc.duyetbc.gv.999802@tlu.edu.vn',
  phone: '0989980802',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_OTHER_SUPERVISOR = {
  teacherCode: 'GV999803',
  firstName: 'Lê Quốc',
  lastName: 'Dũng',
  fullName: 'Lê Quốc Dũng',
  email: 'itc.duyetbc.gv.999803@tlu.edu.vn',
  phone: '0989980803',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_PLAIN_LECTURER = {
  teacherCode: 'GV999804',
  firstName: 'Phạm Văn',
  lastName: 'Khánh',
  fullName: 'Phạm Văn Khánh',
  email: 'itc.duyetbc.gv.999804@tlu.edu.vn',
  phone: '0989980804',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_REVIEWER = {
  teacherCode: 'GV999805',
  firstName: 'Vũ Thị',
  lastName: 'Thảo',
  fullName: 'Vũ Thị Thảo',
  email: 'itc.duyetbc.gv.999805@tlu.edu.vn',
  phone: '0989980805',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_ARCHIVE_SUPERVISOR = {
  teacherCode: 'GV999899',
  firstName: 'Bùi Lưu',
  lastName: 'Trữ',
  fullName: 'Bùi Lưu Trữ',
  email: 'itc.duyetbc.gv.999899@tlu.edu.vn',
  phone: '0989980899',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_STUDENT_1 = {
  studentCode: '9990000801',
  firstName: 'Trần Đức',
  lastName: 'Anh',
  fullName: 'Trần Đức Anh',
  email: 'itc.duyetbc.sv.9990000801@gmail.com',
  phone: '0989980101',
  batch: 'K64',
  className: '64HTTT99',
};

const TEST_STUDENT_2 = {
  studentCode: '9990000802',
  firstName: 'Nguyễn Thị',
  lastName: 'Ngọc',
  fullName: 'Nguyễn Thị Ngọc',
  email: 'itc.duyetbc.sv.9990000802@gmail.com',
  phone: '0989980102',
  batch: 'K64',
  className: '64HTTT99',
};

const TEST_STUDENT_3 = {
  studentCode: '9990000803',
  firstName: 'Lê Văn',
  lastName: 'Tài',
  fullName: 'Lê Văn Tài',
  email: 'itc.duyetbc.sv.9990000803@gmail.com',
  phone: '0989980103',
  batch: 'K64',
  className: '64HTTT99',
};

const TEST_STUDENT_4 = {
  studentCode: '9990000804',
  firstName: 'Phạm Thu',
  lastName: 'Hà',
  fullName: 'Phạm Thu Hà',
  email: 'itc.duyetbc.sv.9990000804@gmail.com',
  phone: '0989980104',
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

interface FinalReportSubmissionStep {
  fileName: string;
  mimeType?: string;
  buffer?: Buffer;
  review?: {
    decision: 'APPROVED' | 'REQUEST_CHANGES' | 'REJECTED';
    plagiarismRate: number;
    plagiarismFileName: string;
    feedback: string;
  };
}

interface ProvisionReportStudentSpec {
  profile: StudentProfile;
  topicName?: string;
  assignCoSupervisor?: boolean;
  approveOutline?: boolean;
  progressReport?: {
    fileName: string;
    mimeType?: string;
    buffer?: Buffer;
    supervisorNote?: string;
  };
  finalReportSubmissions?: FinalReportSubmissionStep[];
}

interface ProvisionedReportStudentHandle {
  profile: StudentProfile;
  studentPublicId: string;
  studentAccountId: number;
  studentToken: string;
  topicId: number;
  topicPublicId: string;
  finalReportId: number | null;
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

async function submitProgressReportViaApi(
  request: APIRequestContext,
  token: string | null,
  topicPublicId: string,
  file: { name: string; mimeType: string; buffer: Buffer },
  supervisorNote?: string,
): Promise<{ status: number; body: any }> {
  const multipart: Record<string, any> = {
    topicPublicId,
    file: {
      name: file.name,
      mimeType: file.mimeType,
      buffer: file.buffer,
    },
  };
  if (supervisorNote !== undefined) {
    multipart.supervisorNote = supervisorNote;
  }
  return submitMultipartViaApi(request, 'POST', '/report/progress-report', token, multipart);
}

async function reviewFinalReportViaApi(
  request: APIRequestContext,
  token: string | null,
  reportPublicId: string,
  options: {
    plagiarismRate?: number | string;
    decision?: 'APPROVED' | 'REQUEST_CHANGES' | 'REJECTED' | string;
    feedback?: string;
    plagiarismFile?: { name: string; mimeType: string; buffer: Buffer };
  },
): Promise<{ status: number; body: any }> {
  const multipart: Record<string, any> = {};
  if (options.plagiarismRate !== undefined) {
    multipart.plagiarismRate = String(options.plagiarismRate);
  }
  if (options.decision !== undefined) {
    multipart.decision = options.decision;
  }
  if (options.feedback !== undefined) {
    multipart.feedback = options.feedback;
  }
  if (options.plagiarismFile !== undefined) {
    multipart.plagiarismFile = options.plagiarismFile;
  }
  return submitMultipartViaApi(request, 'PUT', `/report/${reportPublicId}/review`, token, multipart);
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
  } else {
    const updRes = await apiCall(
      request,
      envState.hodToken,
      'PUT',
      `/teacher/${teacher.teacherCode}`,
      {
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
      },
    );
    if (updRes.status !== 200) {
      throw new Error(`Không thể đồng bộ giảng viên ${teacher.teacherCode}: ${JSON.stringify(updRes.body)}`);
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
  const ownedSupervisorIds = new Set([
    envState.mainSupervisorPublicId,
    envState.coSupervisorPublicId,
    envState.otherSupervisorPublicId,
    envState.reviewerPublicId,
  ]);
  const students: any[] = wsRes.body?.data?.students ?? [];
  for (const st of students) {
    if (!String(st.studentCode || '').startsWith('999')) continue;
    const currentCoSupId =
      st.coSupervisor?.publicId ?? st.coSupervisor?.teacherPublicId ?? st.coSupervisorPublicId;
    const currentSupId =
      st.supervisor?.publicId ?? st.supervisor?.teacherPublicId ?? st.supervisorPublicId;

    if (currentCoSupId && ownedSupervisorIds.has(currentCoSupId)) {
      await apiCall(
        request,
        envState.hodToken,
        'PUT',
        `/semesters/${envState.semesterPublicId}/advisor-assignments/students/${st.studentPublicId}/co-supervisor`,
        { data: { coTeacherPublicId: null } },
      );
    }

    if (st.status === 'UNASSIGNED' || (currentSupId && ownedSupervisorIds.has(currentSupId))) {
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
      studentCode: `9999${suffix.slice(-6)}`,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: `itc.arch.duyetbc.${suffix}@gmail.com`,
      phone: `0978${suffix.slice(-6)}`,
      batch: profile.batch,
      className: profile.className,
    },
  });
}

async function provisionStudentsForReportReview(
  request: APIRequestContext,
  specs: ProvisionReportStudentSpec[],
): Promise<ProvisionedReportStudentHandle[]> {
  await sweepResidualTopicsInIsolatedMajor(request);
  await updateDeadline(request, envState.dlDangKy, 'DANG_KY_GVHD', 'OPEN');

  const handles: ProvisionedReportStudentHandle[] = [];

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

    const accRows = await dbSelect<{ account_id: number }>(
      'SELECT account_id FROM student WHERE student_code = ?',
      [spec.profile.studentCode],
    );
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
      throw new Error(`GVHD không thể duyệt đơn ĐK: ${JSON.stringify(approveRegRes.body)}`);
    }

    handles.push({
      profile: spec.profile,
      studentPublicId: matched.publicId,
      studentAccountId: accRows[0].account_id,
      studentToken,
      topicId: 0,
      topicPublicId: '',
      finalReportId: null,
      finalReportPublicId: null,
    });
  }

  activeHandles.push(...handles);

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
        throw new Error(`Không thể gán GV đồng hướng dẫn: ${JSON.stringify(coRes.body)}`);
      }
    }
  }

  await setLockStatus(request, true);
  await setLockStatus(request, false);
  await updateDeadline(request, envState.dlDeCuong, 'SV_CHINH_SUA_NOP_LAI_DE_CUONG', 'OPEN');
  await updateDeadline(request, envState.dlBaoCao, 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI', 'OPEN');

  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    const h = handles[i];

    // Chốt tên đề tài -> GVHD duyệt -> STAGE_2_TOPIC_CONFIRMED
    const confirmRes = await apiCall(request, h.studentToken, 'POST', '/topic/confirm-title', {
      data: { newName: spec.topicName ?? OFFICIAL_TITLE_DEFAULT },
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
      throw new Error(`GVHD không thể duyệt tên đề tài: ${JSON.stringify(approveTitleRes.body)}`);
    }

    const topicRows = await dbSelect<{ id: number }>(
      `SELECT tt.id
         FROM thesis_topic tt
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [h.profile.studentCode, envState.semesterId],
    );
    h.topicId = topicRows[0].id;

    // Phân công GVNX -> SV nộp đề cương -> GVNX duyệt -> STAGE_3_OUTLINE_APPROVED
    if (spec.approveOutline !== false) {
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
        throw new Error(`TBM không thể phân công GVNX: ${JSON.stringify(assignRes.body)}`);
      }
      envState.reviewerToken = await loginByEmail(request, TEST_REVIEWER.email);

      const outlineFileName = `${h.profile.className}_${h.profile.studentCode}_DeCuong.pdf`;
      const subOutlineRes = await submitMultipartViaApi(
        request,
        'POST',
        '/outline/submit',
        h.studentToken,
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
      const myOutlineRes = await apiCall(request, h.studentToken, 'GET', '/outline/my-outline');
      const outlinePublicId = myOutlineRes.body?.data?.publicId;
      const revOutlineRes = await apiCall(
        request,
        envState.reviewerToken,
        'PUT',
        `/outline/${outlinePublicId}/review`,
        {
          data: {
            decision: 'APPROVED',
            feedback: 'Đề cương đạt yêu cầu để chuyển sang giai đoạn báo cáo',
          },
        },
      );
      if (revOutlineRes.status !== 200) {
        throw new Error(`Không thể duyệt đề cương mẫu: ${JSON.stringify(revOutlineRes.body)}`);
      }
    }

    // Nộp sẵn Phiếu theo dõi tiến độ nếu cấu hình
    if (spec.progressReport) {
      const mimeType =
        spec.progressReport.mimeType ??
        (spec.progressReport.fileName.toLowerCase().endsWith('.docx')
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'application/pdf');
      const buffer =
        spec.progressReport.buffer ??
        (mimeType.includes('pdf')
          ? createMinimalValidPdfBuffer('Initial Progress Report')
          : createMinimalValidDocxBuffer('Initial Progress Report DOCX'));

      const progRes = await submitProgressReportViaApi(
        request,
        envState.mainSupervisorToken,
        h.topicPublicId,
        { name: spec.progressReport.fileName, mimeType, buffer },
        spec.progressReport.supervisorNote,
      );
      if (progRes.status !== 200) {
        throw new Error(`Không thể nộp sẵn phiếu theo dõi: ${JSON.stringify(progRes.body)}`);
      }
    }

    // Các lượt nộp Báo cáo Final (+ thẩm định) nếu cấu hình
    if (spec.finalReportSubmissions && spec.finalReportSubmissions.length > 0) {
      for (const step of spec.finalReportSubmissions) {
        const mimeType =
          step.mimeType ??
          (step.fileName.toLowerCase().endsWith('.docx')
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : 'application/pdf');
        const buffer =
          step.buffer ??
          (mimeType.includes('pdf')
            ? createMinimalValidPdfBuffer('Student Final Report PDF')
            : createMinimalValidDocxBuffer('Student Final Report DOCX'));

        const subRes = await submitMultipartViaApi(request, 'POST', '/report/submit', h.studentToken, {
          file: {
            name: step.fileName,
            mimeType,
            buffer,
          },
        });
        if (subRes.status !== 200) {
          throw new Error(`Không thể nộp sẵn báo cáo Final: ${JSON.stringify(subRes.body)}`);
        }

        const myReportRes = await apiCall(request, h.studentToken, 'GET', '/report/my-report');
        h.finalReportPublicId = myReportRes.body?.data?.publicId ?? null;

        const frRows = await dbSelect<{ id: number }>(
          'SELECT id FROM thesis_final_report WHERE thesis_topic_id = ?',
          [h.topicId],
        );
        h.finalReportId = frRows[0]?.id ?? null;

        if (step.review && h.finalReportPublicId) {
          const rev = step.review;
          if (rev.decision === 'REJECTED') {
            await updateDeadline(request, envState.dlBaoCao, 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI', 'EXTENDED');
          }
          const revRes = await reviewFinalReportViaApi(
            request,
            envState.mainSupervisorToken,
            h.finalReportPublicId,
            {
              plagiarismRate: rev.plagiarismRate,
              decision: rev.decision,
              feedback: rev.feedback,
              plagiarismFile: {
                name: rev.plagiarismFileName,
                mimeType: 'application/pdf',
                buffer: createPlagiarismPdfBuffer(step.fileName, rev.plagiarismRate),
              },
            },
          );
          if (revRes.status !== 200) {
            throw new Error(`Không thể thẩm định báo cáo mẫu (${rev.decision}): ${JSON.stringify(revRes.body)}`);
          }
          if (rev.decision === 'REJECTED') {
            await updateDeadline(request, envState.dlBaoCao, 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI', 'OPEN');
          }
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
        studentCode: `9999${suffix.slice(-6)}`,
        firstName: h.profile.firstName,
        lastName: h.profile.lastName,
        email: `itc.arch.duyetbc.${suffix}@gmail.com`,
        phone: `0978${suffix.slice(-6)}`,
        batch: h.profile.batch,
        className: h.profile.className,
      },
    });
  }
}

async function openReportCheckPage(page: Page, context: BrowserContext, token: string) {
  await setAuthCookie(context, token);

  const listPromise = page.waitForResponse(
    (r) => r.url().includes('/report/supervisor-list') && r.request().method() === 'GET',
  );
  await page.goto('/lecturer/report-check');
  const listRes = await listPromise;
  return { listRes };
}

test.describe('Report 5.2 - Supervisor Review Final Report & Plagiarism Check (DuyetBaoCao)', () => {
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
      dlBaoCao: findSnap('NOP_BAO_CAO_VA_PHIEU_THEO_DOI'),
    };

    const mainSup = await ensureTeacher(request, TEST_MAIN_SUPERVISOR, true, 20);
    envState.mainSupervisorId = mainSup.id;
    envState.mainSupervisorPublicId = mainSup.publicId;
    envState.mainSupervisorToken = mainSup.token;

    const coSup = await ensureTeacher(request, TEST_CO_SUPERVISOR, true, 20);
    envState.coSupervisorId = coSup.id;
    envState.coSupervisorPublicId = coSup.publicId;
    envState.coSupervisorToken = coSup.token;

    const otherSup = await ensureTeacher(request, TEST_OTHER_SUPERVISOR, true, 20);
    envState.otherSupervisorId = otherSup.id;
    envState.otherSupervisorPublicId = otherSup.publicId;
    envState.otherSupervisorToken = otherSup.token;

    const plainLect = await ensureTeacher(request, TEST_PLAIN_LECTURER, false, 0);
    envState.plainLecturerId = plainLect.id;
    envState.plainLecturerToken = plainLect.token;

    const reviewer = await ensureTeacher(request, TEST_REVIEWER, true, 20);
    envState.reviewerId = reviewer.id;
    envState.reviewerPublicId = reviewer.publicId;
    envState.reviewerToken = reviewer.token;

    const archiveSup = await ensureTeacher(request, TEST_ARCHIVE_SUPERVISOR, true, 500);
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
  // FUNCTION 1: View and Filter Supervised Final Reports (ITC032..ITC035)
  // ==========================================================================

  test(ITC032.title, { annotation: ITC032.annotation }, async ({ page, context, request }) => {
    await provisionStudentsForReportReview(request, [
      {
        profile: TEST_STUDENT_1,
        approveOutline: true,
        progressReport: {
          fileName: VALID_PDF_FILENAME_1,
          supervisorNote: 'Tiến độ tốt, đủ điều kiện thẩm định',
        },
        finalReportSubmissions: [{ fileName: VALID_PDF_FILENAME_1 }],
      },
      {
        profile: TEST_STUDENT_2,
        approveOutline: true,
        finalReportSubmissions: [{ fileName: VALID_PDF_FILENAME_2 }],
      },
      {
        profile: TEST_STUDENT_3,
        approveOutline: true,
        progressReport: {
          fileName: VALID_PDF_FILENAME_3,
          supervisorNote: 'Hoàn thành xuất sắc',
        },
        finalReportSubmissions: [
          {
            fileName: VALID_PDF_FILENAME_3,
            review: {
              decision: 'APPROVED',
              plagiarismRate: 12.5,
              plagiarismFileName: PLAGIARISM_PDF_FILENAME_3,
              feedback: 'Báo cáo đạt chuẩn học thuật',
            },
          },
        ],
      },
      {
        profile: TEST_STUDENT_4,
        approveOutline: true,
      },
    ]);

    const { listRes } = await openReportCheckPage(page, context, envState.mainSupervisorToken);
    expect(listRes.status()).toBe(200);
    const body = await listRes.json();
    expect(body.code).toBe(1000);
    expect(body.data).toHaveLength(4);
    for (const item of body.data) {
      expect(item.canReview).toBe(true);
      expect(item.deadlineStatus).toBe('OPEN');
    }

    await expect(page.getByText('Đang mở')).toBeVisible();
    await expect(page.locator('#tabCountPending')).toHaveText('2');
    await expect(page.locator('#tabCountRejected')).toHaveText('0');
    await expect(page.locator('#tabCountNotSubmitted')).toHaveText('1');
    await expect(page.locator('#tabCountApproved')).toHaveText('1');
    await expect(page.locator('#tabCountAll')).toHaveText('4');

    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await expect(row1).toBeVisible();
    await expect(row1.getByRole('button', { name: 'Thẩm định', exact: true })).toBeEnabled();
    await expect(row1).toContainText('Chưa kiểm tra trùng lặp');

    const row2 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) });
    await expect(row2).toBeVisible();
    await expect(row2.getByRole('button', { name: 'Thẩm định', exact: true })).toBeDisabled();
    await expect(row2).toContainText('Chưa nộp phiếu theo dõi tiến độ');
    await expect(row2.getByRole('link', { name: 'Nộp Phiếu theo dõi tiến độ ngay' })).toBeVisible();

    await page.locator('#btnTabAll').click();
    await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_3.studentCode) })).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_4.studentCode) })).toBeVisible();

    const dbTopicRows = await dbSelect<{ total: number }>(
      'SELECT COUNT(*) AS total FROM thesis_topic WHERE semester_id = ? AND lecturer_id = ?',
      [envState.semesterId, envState.mainSupervisorId],
    );
    expect(Number(dbTopicRows[0].total)).toBe(4);

    const dbReportRows = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM thesis_final_report r
         JOIN thesis_topic tt ON tt.id = r.thesis_topic_id
        WHERE tt.semester_id = ? AND tt.lecturer_id = ?`,
      [envState.semesterId, envState.mainSupervisorId],
    );
    expect(Number(dbReportRows[0].total)).toBe(3);

    const dbProgRows = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM thesis_progress_report p
         JOIN thesis_topic tt ON tt.id = p.thesis_topic_id
        WHERE tt.semester_id = ? AND tt.lecturer_id = ?`,
      [envState.semesterId, envState.mainSupervisorId],
    );
    expect(Number(dbProgRows[0].total)).toBe(2);
  });

  test(ITC033.title, { annotation: ITC033.annotation }, async ({ page, context, request }) => {
    await provisionStudentsForReportReview(request, [
      {
        profile: TEST_STUDENT_1,
        approveOutline: true,
        progressReport: { fileName: VALID_PDF_FILENAME_1 },
        finalReportSubmissions: [{ fileName: VALID_PDF_FILENAME_1 }],
      },
      {
        profile: TEST_STUDENT_2,
        approveOutline: true,
        progressReport: { fileName: VALID_PDF_FILENAME_2 },
        finalReportSubmissions: [
          {
            fileName: VALID_PDF_FILENAME_2,
            review: {
              decision: 'REQUEST_CHANGES',
              plagiarismRate: 18.5,
              plagiarismFileName: PLAGIARISM_PDF_FILENAME_2,
              feedback: 'Cần bổ sung trích dẫn tài liệu tham khảo',
            },
          },
        ],
      },
      {
        profile: TEST_STUDENT_3,
        approveOutline: true,
        progressReport: { fileName: VALID_PDF_FILENAME_3 },
        finalReportSubmissions: [
          {
            fileName: VALID_PDF_FILENAME_3,
            review: {
              decision: 'APPROVED',
              plagiarismRate: 12.5,
              plagiarismFileName: PLAGIARISM_PDF_FILENAME_3,
              feedback: 'Đạt yêu cầu bảo vệ',
            },
          },
        ],
      },
      {
        profile: TEST_STUDENT_4,
        approveOutline: true,
      },
    ]);

    const { listRes } = await openReportCheckPage(page, context, envState.mainSupervisorToken);
    expect(listRes.status()).toBe(200);
    const body = await listRes.json();
    expect(body.code).toBe(1000);
    expect(body.data).toHaveLength(4);

    await page.locator('#btnTabRejected').click();
    const row2 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) });
    await expect(row2).toBeVisible();
    await expect(row2).toContainText('Yêu cầu chỉnh sửa');
    await expect(row2).toContainText('Trùng 18.5%');
    await expect(row2).toContainText('Chờ SV nộp lại');
    await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) })).toHaveCount(0);

    await page.locator('#btnTabNotSubmitted').click();
    const row4 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_4.studentCode) });
    await expect(row4).toBeVisible();
    await expect(row4).toContainText('Chưa nộp báo cáo Final');
    await expect(row4).toContainText('Chờ sinh viên nộp');

    await page.locator('#btnTabApproved').click();
    const row3 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_3.studentCode) });
    await expect(row3).toBeVisible();
    await expect(row3).toContainText('Đã duyệt đạt');
    await expect(row3).toContainText('Trùng 12.5%');

    await page.locator('#btnTabAll').click();
    const searchInput = page.getByPlaceholder('Tìm mã SV, tên hoặc đề tài...');
    await searchInput.fill(TEST_STUDENT_2.studentCode);
    await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) })).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) })).toHaveCount(0);

    await searchInput.fill('KHONGTONTAI9999');
    await expect(page.getByText('Không tìm thấy báo cáo đồ án phù hợp')).toBeVisible();
  });

  test(ITC034.title, { annotation: ITC034.annotation }, async ({ page, context, request }) => {
    await provisionStudentsForReportReview(request, [
      {
        profile: TEST_STUDENT_1,
        assignCoSupervisor: true,
        approveOutline: true,
        progressReport: { fileName: VALID_PDF_FILENAME_1 },
        finalReportSubmissions: [{ fileName: VALID_PDF_FILENAME_1 }],
      },
    ]);

    const { listRes } = await openReportCheckPage(page, context, envState.coSupervisorToken);
    expect(listRes.status()).toBe(200);
    const body = await listRes.json();
    expect(body.code).toBe(1000);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].canReview).toBe(false);

    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await expect(row1).toBeVisible();
    await expect(row1).toContainText('Đồng hướng dẫn (Chỉ xem)');
    await expect(row1).toContainText('Chỉ xem');
    await expect(row1.getByRole('button', { name: 'Thẩm định', exact: true })).toHaveCount(0);

    const dbRows = await dbSelect<{ co_lecturer_id: number }>(
      `SELECT tt.co_lecturer_id
         FROM thesis_topic tt
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(dbRows).toHaveLength(1);
    expect(Number(dbRows[0].co_lecturer_id)).toBe(envState.coSupervisorId);
  });

  test(ITC035.title, { annotation: ITC035.annotation }, async ({ page, context, request }) => {
    await provisionStudentsForReportReview(request, [
      {
        profile: TEST_STUDENT_1,
        approveOutline: true,
        progressReport: { fileName: VALID_PDF_FILENAME_1 },
        finalReportSubmissions: [{ fileName: VALID_PDF_FILENAME_1 }],
      },
    ]);

    // 1. CLOSED
    await updateDeadline(request, envState.dlBaoCao, 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI', 'CLOSED');
    const closedOpen = await openReportCheckPage(page, context, envState.mainSupervisorToken);
    expect(closedOpen.listRes.status()).toBe(200);
    const closedBody = await closedOpen.listRes.json();
    expect(closedBody.code).toBe(1000);
    expect(closedBody.data[0].deadlineStatus).toBe('CLOSED');

    await expect(page.getByText('(Đã hết hạn)')).toBeVisible();
    const rowClosed = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await expect(rowClosed.getByRole('button', { name: 'Thẩm định', exact: true })).toBeDisabled();
    await expect(rowClosed).toContainText('Đã hết hạn thẩm định');

    // 2. NOT_STARTED
    await updateDeadline(request, envState.dlBaoCao, 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI', 'NOT_STARTED');
    const notStartedPromise = page.waitForResponse(
      (r) => r.url().includes('/report/supervisor-list') && r.request().method() === 'GET',
    );
    await page.reload();
    const notStartedRes = await notStartedPromise;
    expect(notStartedRes.status()).toBe(200);
    const notStartedBody = await notStartedRes.json();
    expect(notStartedBody.code).toBe(1000);
    expect(notStartedBody.data[0].deadlineStatus).toBe('NOT_STARTED');

    await expect(page.getByText('Chưa mở', { exact: true })).toBeVisible();
    const rowNotStarted = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await expect(rowNotStarted.getByRole('button', { name: 'Thẩm định', exact: true })).toBeDisabled();
    await expect(rowNotStarted).toContainText('Chưa tới thời gian mở');
  });

  // ==========================================================================
  // FUNCTION 2: Inspect Final Report Preview and Submission History (ITC036..ITC038)
  // ==========================================================================

  test(ITC036.title, { annotation: ITC036.annotation }, async ({ page, context, request }) => {
    const v1Feedback = 'Cần bổ sung phân tích kết quả thực nghiệm chương 4.';
    const [h1] = await provisionStudentsForReportReview(request, [
      {
        profile: TEST_STUDENT_1,
        approveOutline: true,
        progressReport: { fileName: VALID_PDF_FILENAME_1 },
        finalReportSubmissions: [
          {
            fileName: VALID_PDF_FILENAME_1,
            review: {
              decision: 'REQUEST_CHANGES',
              plagiarismRate: 22.5,
              plagiarismFileName: PLAGIARISM_PDF_FILENAME_1,
              feedback: v1Feedback,
            },
          },
          {
            fileName: VALID_PDF_FILENAME_1,
          },
        ],
      },
    ]);

    await openReportCheckPage(page, context, envState.mainSupervisorToken);
    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });

    const detailPromise = page.waitForResponse(
      (r) => r.url().includes(`/report/${h1.finalReportPublicId}`) && r.request().method() === 'GET',
    );
    await row1.getByRole('button', { name: 'Lịch sử' }).click();
    const detailRes = await detailPromise;

    expect(detailRes.status()).toBe(200);
    const detailBody = await detailRes.json();
    expect(detailBody.code).toBe(1000);
    expect(detailBody.data.histories).toHaveLength(2);
    expect(detailBody.data.histories[0].status).toBe('PENDING');
    expect(detailBody.data.histories[0].plagiarismRate).toBeNull();
    expect(detailBody.data.histories[1].status).toBe('REQUEST_CHANGES');
    expect(detailBody.data.histories[1].plagiarismRate).toBe(22.5);
    expect(detailBody.data.histories[1].supervisorFeedback).toBe(v1Feedback);

    const modal = page.locator('#reportHistoryModal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(`Lịch sử nộp báo cáo — ${TEST_STUDENT_1.fullName} (${TEST_STUDENT_1.studentCode})`);

    const rowLan2 = modal.getByRole('row', { name: /Lần 2/ });
    await expect(rowLan2).toBeVisible();
    await expect(rowLan2).toContainText('Chưa chấm');
    await expect(rowLan2).toContainText('Đã nộp, chờ nhận xét');
    await expect(rowLan2).toContainText('Không có nhận xét');

    const rowLan1 = modal.getByRole('row', { name: /Lần 1/ });
    await expect(rowLan1).toBeVisible();
    await expect(rowLan1).toContainText('22.5%');
    await expect(rowLan1).toContainText(PLAGIARISM_PDF_FILENAME_1);
    await expect(rowLan1).toContainText('Yêu cầu chỉnh sửa');
    await expect(rowLan1).toContainText(v1Feedback);

    const dbHistRows = await dbSelect<{ total: number }>(
      'SELECT COUNT(*) AS total FROM thesis_final_report_history WHERE final_report_id = ?',
      [h1.finalReportId],
    );
    expect(Number(dbHistRows[0].total)).toBe(2);
  });

  test(ITC037.title, { annotation: ITC037.annotation }, async ({ page, context, request }) => {
    const [h1] = await provisionStudentsForReportReview(request, [
      {
        profile: TEST_STUDENT_1,
        approveOutline: true,
        progressReport: {
          fileName: VALID_PDF_FILENAME_1,
          supervisorNote: 'Hoàn thành tiến độ 12 tuần',
        },
        finalReportSubmissions: [{ fileName: VALID_PDF_FILENAME_1 }],
      },
    ]);

    await openReportCheckPage(page, context, envState.mainSupervisorToken);
    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });

    const detailPromise = page.waitForResponse(
      (r) => r.url().includes(`/report/${h1.finalReportPublicId}`) && r.request().method() === 'GET',
    );
    await row1.getByRole('button', { name: new RegExp(VALID_PDF_FILENAME_1) }).click();
    const detailRes = await detailPromise;

    expect(detailRes.status()).toBe(200);
    const detailBody = await detailRes.json();
    expect(detailBody.code).toBe(1000);
    expect(detailBody.data.finalReportFile).toContain(VALID_PDF_FILENAME_1);
    expect(detailBody.data.progressReport.supervisorNote).toBe('Hoàn thành tiến độ 12 tuần');
    expect(detailBody.data.canReview).toBe(true);

    const previewModal = page.locator('#fullReportPreviewModal');
    await expect(previewModal).toBeVisible();
    await expect(previewModal.locator('#reportPreviewDocTitle')).toContainText(VALID_PDF_FILENAME_1);
    await expect(previewModal).toContainText(`${TEST_STUDENT_1.fullName} (${TEST_STUDENT_1.studentCode})`);
    await expect(previewModal).toContainText(TEST_MAIN_SUPERVISOR.fullName);
    await expect(previewModal).toContainText('Đã nộp phiếu tiến độ');
    await expect(previewModal).toContainText('Chưa có kết quả kiểm tra trùng lặp.');
    await expect(previewModal.locator('iframe')).toBeVisible();

    const reviewBtn = previewModal.locator('#btnReportPreviewReview');
    await expect(reviewBtn).toBeEnabled();
    await reviewBtn.click();

    await expect(previewModal).toHaveCount(0);
    await expect(page.locator('#finalReportReviewModal')).toBeVisible();

    const dbRows = await dbSelect<{ status: string }>(
      'SELECT status FROM thesis_final_report WHERE id = ?',
      [h1.finalReportId],
    );
    expect(dbRows[0].status).toBe('PENDING');
  });

  test(ITC038.title, { annotation: ITC038.annotation }, async ({ page, context, request }) => {
    const [h2] = await provisionStudentsForReportReview(request, [
      {
        profile: TEST_STUDENT_2,
        approveOutline: true,
        finalReportSubmissions: [{ fileName: VALID_DOCX_FILENAME_2 }],
      },
    ]);

    await openReportCheckPage(page, context, envState.mainSupervisorToken);
    const row2 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) });

    const detailPromise = page.waitForResponse(
      (r) => r.url().includes(`/report/${h2.finalReportPublicId}`) && r.request().method() === 'GET',
    );
    await row2.getByRole('button', { name: new RegExp(VALID_DOCX_FILENAME_2) }).click();
    const detailRes = await detailPromise;

    expect(detailRes.status()).toBe(200);
    const detailBody = await detailRes.json();
    expect(detailBody.code).toBe(1000);
    expect(detailBody.data.finalReportFile).toContain(VALID_DOCX_FILENAME_2);
    expect(detailBody.data.progressReport).toBeNull();

    const previewModal = page.locator('#fullReportPreviewModal');
    await expect(previewModal).toBeVisible();
    await expect(
      previewModal.getByText('Chưa có phiếu theo dõi tiến độ (bắt buộc nộp trước khi thẩm định).'),
    ).toBeVisible();
    await expect(previewModal.getByText('Chưa nộp phiếu theo dõi tiến độ', { exact: true })).toBeVisible();
    await expect(previewModal.getByRole('link', { name: 'Nộp Phiếu theo dõi tiến độ ngay' })).toBeVisible();
    await expect(
      previewModal.getByText(
        'Trình duyệt không hỗ trợ xem trực tiếp định dạng DOCX. Vui lòng tải xuống hoặc mở trong tab mới.',
      ),
    ).toBeVisible();
    await expect(previewModal.getByRole('button', { name: 'Tải xuống tệp' })).toBeVisible();
    await expect(previewModal.locator('#btnReportPreviewReview')).toHaveCount(0);

    const dbProgRows = await dbSelect<{ total: number }>(
      'SELECT COUNT(*) AS total FROM thesis_progress_report WHERE thesis_topic_id = ?',
      [h2.topicId],
    );
    expect(Number(dbProgRows[0].total)).toBe(0);
  });

  // ==========================================================================
  // FUNCTION 3: Submit Plagiarism Check Result and Review Final Report (ITC039..ITC052)
  // ==========================================================================

  test(ITC039.title, { annotation: ITC039.annotation }, async ({ page, context, request }) => {
    const [h1] = await provisionStudentsForReportReview(request, [
      {
        profile: TEST_STUDENT_1,
        approveOutline: true,
        progressReport: { fileName: VALID_PDF_FILENAME_1 },
        finalReportSubmissions: [{ fileName: VALID_PDF_FILENAME_1 }],
      },
    ]);

    await openReportCheckPage(page, context, envState.mainSupervisorToken);
    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await row1.getByRole('button', { name: 'Thẩm định', exact: true }).click();

    const modal = page.locator('#finalReportReviewModal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('input[type="radio"][value="APPROVED"]')).toBeChecked();

    await modal
      .getByPlaceholder('Nhập chính xác tỷ lệ % hiển thị trên file PDF (VD: 12.5)')
      .fill('15.5');
    await modal.locator('input[type="file"]').setInputFiles({
      name: PLAGIARISM_PDF_FILENAME_1,
      mimeType: 'application/pdf',
      buffer: createPlagiarismPdfBuffer(VALID_PDF_FILENAME_1, 15.5),
    });
    const rawFeedback = '  Báo cáo hoàn chỉnh, tỷ lệ trùng lặp trong ngưỡng cho phép.  ';
    const trimmedFeedback = 'Báo cáo hoàn chỉnh, tỷ lệ trùng lặp trong ngưỡng cho phép.';
    await modal
      .getByPlaceholder('Nhập nhận xét về nội dung báo cáo và kết quả kiểm tra trùng lặp...')
      .fill(rawFeedback);

    const reviewPromise = page.waitForResponse(
      (r) =>
        r.url().includes(`/report/${h1.finalReportPublicId}/review`) && r.request().method() === 'PUT',
    );
    await modal.getByRole('button', { name: 'Xác nhận thẩm định' }).click();
    const reviewRes = await reviewPromise;

    expect(reviewRes.status()).toBe(200);
    const reviewBody = await reviewRes.json();
    expect(reviewBody.code).toBe(1000);
    expect(reviewBody.message).toBe('Thẩm định báo cáo Final thành công');

    await expect(page.getByText('Đã duyệt đạt báo cáo Final')).toBeVisible();
    await expect(modal).toHaveCount(0);
    await expect(page.locator('#tabCountPending')).toHaveText('0');
    await expect(page.locator('#tabCountApproved')).toHaveText('1');

    await page.locator('#btnTabApproved').click();
    const approvedRow = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await expect(approvedRow).toBeVisible();
    await expect(approvedRow).toContainText('Trùng 15.5%');
    await expect(approvedRow).toContainText('Đã duyệt đạt');

    const dbReport = await dbSelect<{
      status: string;
      plagiarism_rate: number;
      plagiarism_file: string;
      supervisor_feedback: string | null;
      reviewed_at: Date | string | null;
    }>(
      `SELECT status, plagiarism_rate, plagiarism_file, supervisor_feedback, reviewed_at
         FROM thesis_final_report
        WHERE id = ?`,
      [h1.finalReportId],
    );
    expect(dbReport[0].status).toBe('APPROVED');
    expect(Number(dbReport[0].plagiarism_rate)).toBe(15.5);
    expect(dbReport[0].plagiarism_file).toContain(PLAGIARISM_PDF_FILENAME_1);
    expect(dbReport[0].supervisor_feedback).toBe(trimmedFeedback);
    expect(dbReport[0].reviewed_at).not.toBeNull();

    const dbHist = await dbSelect<{
      status: string;
      plagiarism_rate: number;
      plagiarism_history_file: string;
      supervisor_feedback: string | null;
    }>(
      `SELECT status, plagiarism_rate, plagiarism_history_file, supervisor_feedback
         FROM thesis_final_report_history
        WHERE final_report_id = ?
        ORDER BY id DESC
        LIMIT 1`,
      [h1.finalReportId],
    );
    expect(dbHist[0].status).toBe('APPROVED');
    expect(Number(dbHist[0].plagiarism_rate)).toBe(15.5);
    expect(dbHist[0].plagiarism_history_file).toContain(PLAGIARISM_PDF_FILENAME_1);
    expect(dbHist[0].supervisor_feedback).toBe(trimmedFeedback);

    const dbTopic = await dbSelect<{ current_stage: string; status: string }>(
      'SELECT current_stage, status FROM thesis_topic WHERE id = ?',
      [h1.topicId],
    );
    expect(dbTopic[0].current_stage).toBe('STAGE_4_REPORT_APPROVED');
    expect(dbTopic[0].status).toBe('IN_PROGRESS');

    const expectedNotif = `Báo cáo Final của bạn đã được GVHD phê duyệt ĐẠT. Tỷ lệ đạo văn: 15.50%. Nhận xét: ${trimmedFeedback}`;
    const notifRows = await dbSelect<{ total: number }>(
      'SELECT COUNT(*) AS total FROM notification WHERE account_id = ? AND content = ?',
      [h1.studentAccountId, expectedNotif],
    );
    expect(Number(notifRows[0].total)).toBe(1);
  });

  test(ITC040.title, { annotation: ITC040.annotation }, async ({ page, context, request }) => {
    const [h1] = await provisionStudentsForReportReview(request, [
      {
        profile: TEST_STUDENT_1,
        approveOutline: true,
        progressReport: { fileName: VALID_PDF_FILENAME_1 },
        finalReportSubmissions: [{ fileName: VALID_PDF_FILENAME_1 }],
      },
    ]);

    await openReportCheckPage(page, context, envState.mainSupervisorToken);
    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await row1.getByRole('button', { name: 'Thẩm định', exact: true }).click();

    const modal = page.locator('#finalReportReviewModal');
    await modal.locator('input[type="radio"][value="REQUEST_CHANGES"]').check();
    await modal
      .getByPlaceholder('Nhập chính xác tỷ lệ % hiển thị trên file PDF (VD: 12.5)')
      .fill('24.5');
    await modal.locator('input[type="file"]').setInputFiles({
      name: PLAGIARISM_PDF_FILENAME_1,
      mimeType: 'application/pdf',
      buffer: createPlagiarismPdfBuffer(VALID_PDF_FILENAME_1, 24.5),
    });
    const rawFeedback = '  Cần trích dẫn lại chương 2 và giảm tỷ lệ trùng lặp ở phần tổng quan.  ';
    const trimmedFeedback = 'Cần trích dẫn lại chương 2 và giảm tỷ lệ trùng lặp ở phần tổng quan.';
    await modal
      .getByPlaceholder('Nhập nhận xét về nội dung báo cáo và kết quả kiểm tra trùng lặp...')
      .fill(rawFeedback);

    const reviewPromise = page.waitForResponse(
      (r) =>
        r.url().includes(`/report/${h1.finalReportPublicId}/review`) && r.request().method() === 'PUT',
    );
    await modal.getByRole('button', { name: 'Xác nhận thẩm định' }).click();
    const reviewRes = await reviewPromise;

    expect(reviewRes.status()).toBe(200);
    const reviewBody = await reviewRes.json();
    expect(reviewBody.code).toBe(1000);
    expect(reviewBody.message).toBe('Thẩm định báo cáo Final thành công');

    await expect(page.getByText('Đã gửi yêu cầu chỉnh sửa báo cáo Final')).toBeVisible();
    await expect(modal).toHaveCount(0);

    await page.locator('#btnTabRejected').click();
    const reqRow = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await expect(reqRow).toBeVisible();
    await expect(reqRow).toContainText('Yêu cầu chỉnh sửa');
    await expect(reqRow).toContainText('Trùng 24.5%');
    await expect(reqRow).toContainText('Chờ SV nộp lại');

    const dbReport = await dbSelect<{
      status: string;
      plagiarism_rate: number;
      plagiarism_file: string;
      supervisor_feedback: string | null;
      reviewed_at: Date | string | null;
    }>(
      `SELECT status, plagiarism_rate, plagiarism_file, supervisor_feedback, reviewed_at
         FROM thesis_final_report
        WHERE id = ?`,
      [h1.finalReportId],
    );
    expect(dbReport[0].status).toBe('REQUEST_CHANGES');
    expect(Number(dbReport[0].plagiarism_rate)).toBe(24.5);
    expect(dbReport[0].plagiarism_file).toContain(PLAGIARISM_PDF_FILENAME_1);
    expect(dbReport[0].supervisor_feedback).toBe(trimmedFeedback);
    expect(dbReport[0].reviewed_at).not.toBeNull();

    const dbTopic = await dbSelect<{ current_stage: string; status: string }>(
      'SELECT current_stage, status FROM thesis_topic WHERE id = ?',
      [h1.topicId],
    );
    expect(dbTopic[0].current_stage).toBe('STAGE_3_OUTLINE_APPROVED');
    expect(dbTopic[0].status).toBe('IN_PROGRESS');

    const expectedNotif =
      `Báo cáo Final của bạn cần chỉnh sửa theo góp ý của GVHD. Vui lòng sửa và nộp lại trước hạn. ` +
      `Tỷ lệ đạo văn: 24.50%. Nhận xét: ${trimmedFeedback}`;
    const notifRows = await dbSelect<{ total: number }>(
      'SELECT COUNT(*) AS total FROM notification WHERE account_id = ? AND content = ?',
      [h1.studentAccountId, expectedNotif],
    );
    expect(Number(notifRows[0].total)).toBe(1);
  });

  test(ITC041.title, { annotation: ITC041.annotation }, async ({ page, context, request }) => {
    const [h1] = await provisionStudentsForReportReview(request, [
      {
        profile: TEST_STUDENT_1,
        approveOutline: true,
        progressReport: { fileName: VALID_PDF_FILENAME_1 },
        finalReportSubmissions: [{ fileName: VALID_PDF_FILENAME_1 }],
      },
    ]);

    await updateDeadline(request, envState.dlBaoCao, 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI', 'EXTENDED');
    await openReportCheckPage(page, context, envState.mainSupervisorToken);
    await expect(page.getByText('(Gia hạn chấm)')).toBeVisible();

    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await row1.getByRole('button', { name: 'Thẩm định', exact: true }).click();

    const modal = page.locator('#finalReportReviewModal');
    await expect(modal).toContainText('Gia hạn chấm');
    await expect(modal.locator('input[type="radio"][value="APPROVED"]')).toBeVisible();
    await expect(modal.locator('input[type="radio"][value="REJECTED"]')).toBeVisible();
    await expect(modal.locator('input[type="radio"][value="REQUEST_CHANGES"]')).toHaveCount(0);

    await modal
      .getByPlaceholder('Nhập chính xác tỷ lệ % hiển thị trên file PDF (VD: 12.5)')
      .fill('35');
    await modal.locator('input[type="file"]').setInputFiles({
      name: PLAGIARISM_PDF_FILENAME_1,
      mimeType: 'application/pdf',
      buffer: createPlagiarismPdfBuffer(VALID_PDF_FILENAME_1, 35),
    });
    await modal
      .getByPlaceholder('Nhập nhận xét về nội dung báo cáo và kết quả kiểm tra trùng lặp...')
      .fill('   ');

    const reviewPromise = page.waitForResponse(
      (r) =>
        r.url().includes(`/report/${h1.finalReportPublicId}/review`) && r.request().method() === 'PUT',
    );
    await modal.getByRole('button', { name: 'Xác nhận thẩm định' }).click();
    const reviewRes = await reviewPromise;

    expect(reviewRes.status()).toBe(200);
    const reviewBody = await reviewRes.json();
    expect(reviewBody.code).toBe(1000);
    expect(reviewBody.message).toBe('Thẩm định báo cáo Final thành công');

    await expect(page.getByText('Đã duyệt đạt báo cáo Final')).toBeVisible();
    await page.locator('#btnTabApproved').click();
    const approvedRow = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await expect(approvedRow).toContainText('Trùng 35%');

    const dbReport = await dbSelect<{
      status: string;
      plagiarism_rate: number;
      supervisor_feedback: string | null;
    }>(
      'SELECT status, plagiarism_rate, supervisor_feedback FROM thesis_final_report WHERE id = ?',
      [h1.finalReportId],
    );
    expect(dbReport[0].status).toBe('APPROVED');
    expect(Number(dbReport[0].plagiarism_rate)).toBe(35);
    expect(dbReport[0].supervisor_feedback).toBeNull();

    const dbTopic = await dbSelect<{ current_stage: string }>(
      'SELECT current_stage FROM thesis_topic WHERE id = ?',
      [h1.topicId],
    );
    expect(dbTopic[0].current_stage).toBe('STAGE_4_REPORT_APPROVED');

    const expectedNotif = 'Báo cáo Final của bạn đã được GVHD phê duyệt ĐẠT. Tỷ lệ đạo văn: 35.00%.';
    const notifRows = await dbSelect<{ total: number }>(
      'SELECT COUNT(*) AS total FROM notification WHERE account_id = ? AND content = ?',
      [h1.studentAccountId, expectedNotif],
    );
    expect(Number(notifRows[0].total)).toBe(1);
  });

  test(ITC042.title, { annotation: ITC042.annotation }, async ({ page, context, request }) => {
    const [h1] = await provisionStudentsForReportReview(request, [
      {
        profile: TEST_STUDENT_1,
        approveOutline: true,
        progressReport: { fileName: VALID_PDF_FILENAME_1 },
        finalReportSubmissions: [{ fileName: VALID_PDF_FILENAME_1 }],
      },
    ]);

    await updateDeadline(request, envState.dlBaoCao, 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI', 'EXTENDED');
    await openReportCheckPage(page, context, envState.mainSupervisorToken);

    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await row1.getByRole('button', { name: 'Thẩm định', exact: true }).click();

    const modal = page.locator('#finalReportReviewModal');
    await modal.locator('input[type="radio"][value="REJECTED"]').check();
    await modal
      .getByPlaceholder('Nhập chính xác tỷ lệ % hiển thị trên file PDF (VD: 12.5)')
      .fill('30');
    await modal.locator('input[type="file"]').setInputFiles({
      name: PLAGIARISM_PDF_FILENAME_1,
      mimeType: 'application/pdf',
      buffer: createPlagiarismPdfBuffer(VALID_PDF_FILENAME_1, 30),
    });
    const feedback = 'Báo cáo không hoàn thiện các yêu cầu cốt lõi sau thời gian gia hạn.';
    await modal
      .getByPlaceholder('Nhập nhận xét về nội dung báo cáo và kết quả kiểm tra trùng lặp...')
      .fill(feedback);

    const reviewPromise = page.waitForResponse(
      (r) =>
        r.url().includes(`/report/${h1.finalReportPublicId}/review`) && r.request().method() === 'PUT',
    );
    await modal.getByRole('button', { name: 'Xác nhận thẩm định' }).click();
    const reviewRes = await reviewPromise;

    expect(reviewRes.status()).toBe(200);
    const reviewBody = await reviewRes.json();
    expect(reviewBody.code).toBe(1000);
    expect(reviewBody.message).toBe('Thẩm định báo cáo Final thành công');

    await expect(page.getByText('Đã ghi nhận kết quả không đạt cho báo cáo Final')).toBeVisible();
    await page.locator('#btnTabRejected').click();
    const rejRow = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await expect(rejRow).toBeVisible();
    await expect(rejRow).toContainText('Đình chỉ');
    await expect(rejRow).toContainText('Trùng 30%');
    await expect(rejRow).toContainText('Không đạt');

    const dbReport = await dbSelect<{
      status: string;
      plagiarism_rate: number;
      supervisor_feedback: string | null;
    }>(
      'SELECT status, plagiarism_rate, supervisor_feedback FROM thesis_final_report WHERE id = ?',
      [h1.finalReportId],
    );
    expect(dbReport[0].status).toBe('REJECTED');
    expect(Number(dbReport[0].plagiarism_rate)).toBe(30);
    expect(dbReport[0].supervisor_feedback).toBe(feedback);

    const dbTopic = await dbSelect<{ status: string; disqualification_reason: string | null }>(
      'SELECT status, disqualification_reason FROM thesis_topic WHERE id = ?',
      [h1.topicId],
    );
    expect(dbTopic[0].status).toBe('DISQUALIFIED');
    expect(dbTopic[0].disqualification_reason).toBe('Không hoàn thành phê duyệt báo cáo đúng hạn');

    const expectedNotif =
      `Báo cáo Final của bạn không đạt trong đợt gia hạn chấm. Đồ án đã bị đình chỉ trong học kỳ này. ` +
      `Tỷ lệ đạo văn: 30.00%. Nhận xét: ${feedback}`;
    const notifRows = await dbSelect<{ total: number }>(
      'SELECT COUNT(*) AS total FROM notification WHERE account_id = ? AND content = ?',
      [h1.studentAccountId, expectedNotif],
    );
    expect(Number(notifRows[0].total)).toBe(1);
  });

  test(ITC043.title, { annotation: ITC043.annotation }, async ({ page, context, request }) => {
    const [h1] = await provisionStudentsForReportReview(request, [
      {
        profile: TEST_STUDENT_1,
        approveOutline: true,
        progressReport: { fileName: VALID_PDF_FILENAME_1 },
        finalReportSubmissions: [{ fileName: VALID_PDF_FILENAME_1 }],
      },
    ]);

    await openReportCheckPage(page, context, envState.mainSupervisorToken);
    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await row1.getByRole('button', { name: 'Thẩm định', exact: true }).click();

    const modal = page.locator('#finalReportReviewModal');
    await modal
      .getByPlaceholder('Nhập chính xác tỷ lệ % hiển thị trên file PDF (VD: 12.5)')
      .fill('36.5');

    await expect(
      modal.getByText(
        "Tỷ lệ đạo văn vượt quá 35% (tối đa cho phép: 35.0%). Không thể phê duyệt Đạt. Vui lòng chọn 'Yêu cầu chỉnh sửa' (khi đang mở nộp) hoặc 'Không đạt' (khi gia hạn chấm).",
      ),
    ).toBeVisible();
    await expect(modal.getByText('Không khả dụng khi đạo văn > 35%')).toBeVisible();
    await expect(modal.locator('input[type="radio"][value="APPROVED"]')).toBeDisabled();
    await expect(modal.locator('input[type="radio"][value="REQUEST_CHANGES"]')).toBeChecked();

    await modal.locator('input[type="file"]').setInputFiles({
      name: PLAGIARISM_PDF_FILENAME_1,
      mimeType: 'application/pdf',
      buffer: createPlagiarismPdfBuffer(VALID_PDF_FILENAME_1, 36.5),
    });

    const reviewPromise = page.waitForResponse(
      (r) =>
        r.url().includes(`/report/${h1.finalReportPublicId}/review`) && r.request().method() === 'PUT',
    );
    await modal.getByRole('button', { name: 'Xác nhận thẩm định' }).click();
    const reviewRes = await reviewPromise;

    const exceededMsg =
      'Tỷ lệ trùng lặp trong báo cáo vượt quá ngưỡng cho phép (tối đa 35%). Đồ án không đủ điều kiện duyệt!';
    expect(reviewRes.status()).toBe(400);
    const reviewBody = await reviewRes.json();
    expect(reviewBody.code).toBe(4000);
    expect(reviewBody.message).toBe(exceededMsg);

    await expect(modal).toBeVisible();
    await expect(modal.getByText(exceededMsg)).toBeVisible();

    const dbReport = await dbSelect<{ status: string; plagiarism_rate: number | null }>(
      'SELECT status, plagiarism_rate FROM thesis_final_report WHERE id = ?',
      [h1.finalReportId],
    );
    expect(dbReport[0].status).toBe('PENDING');
    expect(dbReport[0].plagiarism_rate).toBeNull();
  });

  test(ITC044.title, { annotation: ITC044.annotation }, async ({ page, context, request }) => {
    const [h1] = await provisionStudentsForReportReview(request, [
      {
        profile: TEST_STUDENT_1,
        approveOutline: true,
        progressReport: { fileName: VALID_PDF_FILENAME_1 },
        finalReportSubmissions: [{ fileName: VALID_PDF_FILENAME_1 }],
      },
    ]);

    await openReportCheckPage(page, context, envState.mainSupervisorToken);
    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await row1.getByRole('button', { name: 'Thẩm định', exact: true }).click();

    let apiCalled = false;
    page.on('request', (req) => {
      if (req.url().includes(`/report/${h1.finalReportPublicId}/review`) && req.method() === 'PUT') {
        apiCalled = true;
      }
    });

    const modal = page.locator('#finalReportReviewModal');
    await modal.locator('input[type="file"]').setInputFiles({
      name: PLAGIARISM_PDF_FILENAME_1,
      mimeType: 'application/pdf',
      buffer: createPlagiarismPdfBuffer(VALID_PDF_FILENAME_1, 12),
    });

    const rateInput = modal.getByPlaceholder(
      'Nhập chính xác tỷ lệ % hiển thị trên file PDF (VD: 12.5)',
    );

    // 1. Blank plagiarismRate
    await modal.getByRole('button', { name: 'Xác nhận thẩm định' }).click();
    await expect(modal.getByText('Vui lòng nhập tỷ lệ đạo văn')).toBeVisible();

    // 2. -1 (< 0)
    await rateInput.fill('-1');
    await modal.getByRole('button', { name: 'Xác nhận thẩm định' }).click();
    await expect(modal.getByText('Tỷ lệ đạo văn phải nằm trong khoảng 0% đến 100%')).toBeVisible();

    // 3. 105 (> 100)
    await rateInput.fill('105');
    await modal.getByRole('button', { name: 'Xác nhận thẩm định' }).click();
    await expect(modal.getByText('Tỷ lệ đạo văn phải nằm trong khoảng 0% đến 100%')).toBeVisible();
    expect(apiCalled).toBe(false);

    // Direct API verification
    const missingRateRes = await reviewFinalReportViaApi(
      request,
      envState.mainSupervisorToken,
      h1.finalReportPublicId!,
      {
        decision: 'APPROVED',
        plagiarismFile: {
          name: PLAGIARISM_PDF_FILENAME_1,
          mimeType: 'application/pdf',
          buffer: createPlagiarismPdfBuffer(VALID_PDF_FILENAME_1, 12),
        },
      },
    );
    expect(missingRateRes.status).toBe(400);
    expect(missingRateRes.body.code).toBe(4000);
    expect(missingRateRes.body.message).toBe('Vui lòng nhập tỷ lệ đạo văn');

    const invalidRateRes = await reviewFinalReportViaApi(
      request,
      envState.mainSupervisorToken,
      h1.finalReportPublicId!,
      {
        decision: 'REQUEST_CHANGES',
        plagiarismRate: 105,
        plagiarismFile: {
          name: PLAGIARISM_PDF_FILENAME_1,
          mimeType: 'application/pdf',
          buffer: createPlagiarismPdfBuffer(VALID_PDF_FILENAME_1, 12),
        },
      },
    );
    expect(invalidRateRes.status).toBe(400);
    expect(invalidRateRes.body.code).toBe(4000);
    expect(invalidRateRes.body.message).toBe('Tỷ lệ đạo văn phải nằm trong khoảng 0% đến 100%');

    const dbReport = await dbSelect<{ status: string }>(
      'SELECT status FROM thesis_final_report WHERE id = ?',
      [h1.finalReportId],
    );
    expect(dbReport[0].status).toBe('PENDING');
  });

  test(ITC045.title, { annotation: ITC045.annotation }, async ({ page, context, request }) => {
    const [h1] = await provisionStudentsForReportReview(request, [
      {
        profile: TEST_STUDENT_1,
        approveOutline: true,
        progressReport: { fileName: VALID_PDF_FILENAME_1 },
        finalReportSubmissions: [{ fileName: VALID_PDF_FILENAME_1 }],
      },
    ]);

    await openReportCheckPage(page, context, envState.mainSupervisorToken);
    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await row1.getByRole('button', { name: 'Thẩm định', exact: true }).click();

    let apiCalled = false;
    page.on('request', (req) => {
      if (req.url().includes(`/report/${h1.finalReportPublicId}/review`) && req.method() === 'PUT') {
        apiCalled = true;
      }
    });

    const modal = page.locator('#finalReportReviewModal');
    await modal
      .getByPlaceholder('Nhập chính xác tỷ lệ % hiển thị trên file PDF (VD: 12.5)')
      .fill('12');

    // 1. No file
    await modal.getByRole('button', { name: 'Xác nhận thẩm định' }).click();
    await expect(modal.getByText('File báo cáo kiểm tra trùng lặp không được để trống.')).toBeVisible();

    // 2. Non-PDF (.docx)
    await modal.locator('input[type="file"]').setInputFiles({
      name: PLAGIARISM_DOCX_FILENAME_1,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: createMinimalValidDocxBuffer('Invalid Plagiarism DOCX'),
    });
    await modal.getByRole('button', { name: 'Xác nhận thẩm định' }).click();
    await expect(
      modal.getByText('File kiểm tra trùng lặp bắt buộc là định dạng .pdf (xuất từ Turnitin / KiểmTraTàiLiệu).'),
    ).toBeVisible();

    // 3. Improperly named PDF
    await modal.getByRole('button', { name: 'Bỏ chọn file' }).click();
    await modal.locator('input[type="file"]').setInputFiles({
      name: INVALID_NAME_PLAGIARISM_PDF,
      mimeType: 'application/pdf',
      buffer: createPlagiarismPdfBuffer(VALID_PDF_FILENAME_1, 12),
    });
    await modal.getByRole('button', { name: 'Xác nhận thẩm định' }).click();

    const namingMsg =
      'Tên file không đúng định dạng! Vui lòng đổi tên file theo định dạng Tenlop_MaSV_HoVaTen (VD: DHKTPM17A_22110001_NguyenVanAn.pdf)';
    await expect(modal.getByText(namingMsg)).toBeVisible();
    expect(apiCalled).toBe(false);

    const apiRes = await reviewFinalReportViaApi(
      request,
      envState.mainSupervisorToken,
      h1.finalReportPublicId!,
      {
        decision: 'APPROVED',
        plagiarismRate: 12,
        plagiarismFile: {
          name: INVALID_NAME_PLAGIARISM_PDF,
          mimeType: 'application/pdf',
          buffer: createPlagiarismPdfBuffer(VALID_PDF_FILENAME_1, 12),
        },
      },
    );
    expect(apiRes.status).toBe(400);
    expect(apiRes.body.code).toBe(4000);
    expect(apiRes.body.message).toBe(namingMsg);

    const dbReport = await dbSelect<{ status: string }>(
      'SELECT status FROM thesis_final_report WHERE id = ?',
      [h1.finalReportId],
    );
    expect(dbReport[0].status).toBe('PENDING');
  });

  test(ITC046.title, { annotation: ITC046.annotation }, async ({ page, context, request }) => {
    const [h1] = await provisionStudentsForReportReview(request, [
      {
        profile: TEST_STUDENT_1,
        approveOutline: true,
        progressReport: { fileName: VALID_PDF_FILENAME_1 },
        finalReportSubmissions: [{ fileName: VALID_PDF_FILENAME_1 }],
      },
    ]);

    await openReportCheckPage(page, context, envState.mainSupervisorToken);
    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await row1.getByRole('button', { name: 'Thẩm định', exact: true }).click();

    let apiCalled = false;
    page.on('request', (req) => {
      if (req.url().includes(`/report/${h1.finalReportPublicId}/review`) && req.method() === 'PUT') {
        apiCalled = true;
      }
    });

    const modal = page.locator('#finalReportReviewModal');
    await modal
      .getByPlaceholder('Nhập chính xác tỷ lệ % hiển thị trên file PDF (VD: 12.5)')
      .fill('12');

    // 1. 0-byte PDF
    await modal.locator('input[type="file"]').setInputFiles({
      name: PLAGIARISM_PDF_FILENAME_1,
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(0),
    });
    await modal.getByRole('button', { name: 'Xác nhận thẩm định' }).click();
    await expect(modal.getByText('File báo cáo kiểm tra trùng lặp không được để trống.')).toBeVisible();

    // 2. 10 MB PDF
    await modal.getByRole('button', { name: 'Bỏ chọn file' }).click();
    await modal.locator('input[type="file"]').setInputFiles({
      name: PLAGIARISM_PDF_FILENAME_1,
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(10 * 1024 * 1024, 0x41),
    });
    await modal.getByRole('button', { name: 'Xác nhận thẩm định' }).click();
    await expect(modal.getByText('File tải lên phải nhỏ hơn 10MB.')).toBeVisible();
    expect(apiCalled).toBe(false);

    const emptyApiRes = await reviewFinalReportViaApi(
      request,
      envState.mainSupervisorToken,
      h1.finalReportPublicId!,
      {
        decision: 'APPROVED',
        plagiarismRate: 12,
        plagiarismFile: {
          name: PLAGIARISM_PDF_FILENAME_1,
          mimeType: 'application/pdf',
          buffer: Buffer.alloc(0),
        },
      },
    );
    expect(emptyApiRes.status).toBe(400);
    expect(emptyApiRes.body.code).toBe(4000);
    expect(emptyApiRes.body.message).toBe('File tải lên không được để trống');

    const dbReport = await dbSelect<{ status: string }>(
      'SELECT status FROM thesis_final_report WHERE id = ?',
      [h1.finalReportId],
    );
    expect(dbReport[0].status).toBe('PENDING');
  });

  test(ITC047.title, { annotation: ITC047.annotation }, async ({ page, context, request }) => {
    const [h1] = await provisionStudentsForReportReview(request, [
      {
        profile: TEST_STUDENT_1,
        approveOutline: true,
        progressReport: { fileName: VALID_PDF_FILENAME_1 },
        finalReportSubmissions: [{ fileName: VALID_PDF_FILENAME_1 }],
      },
    ]);

    await openReportCheckPage(page, context, envState.mainSupervisorToken);
    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await row1.getByRole('button', { name: 'Thẩm định', exact: true }).click();

    const modal = page.locator('#finalReportReviewModal');
    await modal
      .getByPlaceholder('Nhập chính xác tỷ lệ % hiển thị trên file PDF (VD: 12.5)')
      .fill('12.0');
    await modal.locator('input[type="file"]').setInputFiles({
      name: PLAGIARISM_PDF_FILENAME_1,
      mimeType: 'application/pdf',
      buffer: createPlagiarismPdfBuffer(VALID_PDF_FILENAME_1, 18.5),
    });

    const reviewPromise = page.waitForResponse(
      (r) =>
        r.url().includes(`/report/${h1.finalReportPublicId}/review`) && r.request().method() === 'PUT',
    );
    await modal.getByRole('button', { name: 'Xác nhận thẩm định' }).click();
    const reviewRes = await reviewPromise;

    expect(reviewRes.status()).toBe(400);
    const reviewBody = await reviewRes.json();
    expect(reviewBody.code).toBe(4000);
    expect(reviewBody.message).toBe(
      'Số liệu không khớp! Tỷ lệ trùng lặp bạn nhập khác với kết quả trong file báo cáo PDF. Vui lòng kiểm tra lại tài liệu!',
    );

    await expect(modal).toBeVisible();
    await expect(
      modal.getByText(
        'Số liệu không khớp! Tỷ lệ trùng lặp bạn nhập trên Form khác với kết quả ghi nhận trong file báo cáo PDF. Vui lòng kiểm tra lại tỷ lệ % đã gõ!',
      ),
    ).toBeVisible();

    const dbReport = await dbSelect<{ status: string; plagiarism_rate: number | null }>(
      'SELECT status, plagiarism_rate FROM thesis_final_report WHERE id = ?',
      [h1.finalReportId],
    );
    expect(dbReport[0].status).toBe('PENDING');
    expect(dbReport[0].plagiarism_rate).toBeNull();
  });

  test(ITC048.title, { annotation: ITC048.annotation }, async ({ page, context, request }) => {
    const [h1] = await provisionStudentsForReportReview(request, [
      {
        profile: TEST_STUDENT_1,
        approveOutline: true,
        progressReport: { fileName: VALID_PDF_FILENAME_1 },
        finalReportSubmissions: [{ fileName: VALID_PDF_FILENAME_1 }],
      },
    ]);

    await openReportCheckPage(page, context, envState.mainSupervisorToken);
    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await row1.getByRole('button', { name: 'Thẩm định', exact: true }).click();

    const modal = page.locator('#finalReportReviewModal');
    await modal
      .getByPlaceholder('Nhập chính xác tỷ lệ % hiển thị trên file PDF (VD: 12.5)')
      .fill('14.0');
    await modal.locator('input[type="file"]').setInputFiles({
      name: PLAGIARISM_PDF_FILENAME_1,
      mimeType: 'application/pdf',
      buffer: createPlagiarismPdfBuffer(VALID_PDF_FILENAME_2, 14.0),
    });

    const reviewPromise = page.waitForResponse(
      (r) =>
        r.url().includes(`/report/${h1.finalReportPublicId}/review`) && r.request().method() === 'PUT',
    );
    await modal.getByRole('button', { name: 'Xác nhận thẩm định' }).click();
    const reviewRes = await reviewPromise;

    expect(reviewRes.status()).toBe(400);
    const reviewBody = await reviewRes.json();
    expect(reviewBody.code).toBe(4000);
    expect(reviewBody.message).toBe(
      'Cảnh báo nhầm tài liệu! File báo cáo PDF có mã sinh viên không khớp với sinh viên đang duyệt.',
    );

    const mappedMismatchMsg =
      'Cảnh báo nộp nhầm file! Báo cáo PDF có Mã sinh viên không khớp với sinh viên của đề tài đang duyệt. Vui lòng chọn đúng file của sinh viên này!';
    await expect(modal.getByText(mappedMismatchMsg)).toBeVisible();
    await expect(page.getByText(mappedMismatchMsg).first()).toBeVisible();

    const dbReport = await dbSelect<{ status: string; plagiarism_rate: number | null }>(
      'SELECT status, plagiarism_rate FROM thesis_final_report WHERE id = ?',
      [h1.finalReportId],
    );
    expect(dbReport[0].status).toBe('PENDING');
    expect(dbReport[0].plagiarism_rate).toBeNull();
  });

  test(ITC049.title, { annotation: ITC049.annotation }, async ({ page, context, request }) => {
    const [h1] = await provisionStudentsForReportReview(request, [
      {
        profile: TEST_STUDENT_1,
        approveOutline: true,
        progressReport: { fileName: VALID_PDF_FILENAME_1 },
        finalReportSubmissions: [{ fileName: VALID_PDF_FILENAME_1 }],
      },
    ]);

    await openReportCheckPage(page, context, envState.mainSupervisorToken);
    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await row1.getByRole('button', { name: 'Thẩm định', exact: true }).click();

    const modal = page.locator('#finalReportReviewModal');
    await modal
      .getByPlaceholder('Nhập chính xác tỷ lệ % hiển thị trên file PDF (VD: 12.5)')
      .fill('15.0');

    // 1. PDF without 10-digit student code in "Tên tài liệu"
    await modal.locator('input[type="file"]').setInputFiles({
      name: PLAGIARISM_PDF_FILENAME_1,
      mimeType: 'application/pdf',
      buffer: createPlagiarismPdfBuffer('BaoCaoTotNghiep_TranDucAnh.pdf', 15.0),
    });

    const missingIdPromise = page.waitForResponse(
      (r) =>
        r.url().includes(`/report/${h1.finalReportPublicId}/review`) && r.request().method() === 'PUT',
    );
    await modal.getByRole('button', { name: 'Xác nhận thẩm định' }).click();
    const missingIdRes = await missingIdPromise;

    expect(missingIdRes.status()).toBe(400);
    const missingIdBody = await missingIdRes.json();
    expect(missingIdBody.code).toBe(4000);
    expect(missingIdBody.message).toBe(
      "Không tìm thấy Mã sinh viên hợp lệ trong mục 'Tên tài liệu' của file báo cáo PDF (Quy chuẩn: Lop_MSV_HoTen)!",
    );
    await expect(
      modal.getByText(
        'Không tìm thấy Mã sinh viên hợp lệ trong mục "Tên tài liệu" của file báo cáo PDF. Vui lòng kiểm tra file có quy chuẩn đặt tên Lop_MSV_HoTen!',
      ),
    ).toBeVisible();

    // 2. Tampered PDF (header score 10.0 vs ring score 25.0)
    await modal.getByRole('button', { name: 'Bỏ chọn file' }).click();
    await modal.locator('input[type="file"]').setInputFiles({
      name: PLAGIARISM_PDF_FILENAME_1,
      mimeType: 'application/pdf',
      buffer: createPlagiarismPdfBuffer(VALID_PDF_FILENAME_1, 10.0, 25.0),
    });

    const tamperedPromise = page.waitForResponse(
      (r) =>
        r.url().includes(`/report/${h1.finalReportPublicId}/review`) && r.request().method() === 'PUT',
    );
    await modal.getByRole('button', { name: 'Xác nhận thẩm định' }).click();
    const tamperedRes = await tamperedPromise;

    expect(tamperedRes.status()).toBe(400);
    const tamperedBody = await tamperedRes.json();
    expect(tamperedBody.code).toBe(4000);
    expect(tamperedBody.message).toBe(
      "Phát hiện bất thường trong file PDF: 'Điểm trùng lặp' ở phần thông tin không khớp với biểu đồ kết quả!",
    );
    await expect(
      modal.getByText(
        'Phát hiện bất thường trong file PDF: Điểm trùng lặp ở phần thông tin không khớp với biểu đồ tròn kết quả!',
      ),
    ).toBeVisible();

    const dbReport = await dbSelect<{ status: string; plagiarism_rate: number | null }>(
      'SELECT status, plagiarism_rate FROM thesis_final_report WHERE id = ?',
      [h1.finalReportId],
    );
    expect(dbReport[0].status).toBe('PENDING');
    expect(dbReport[0].plagiarism_rate).toBeNull();
  });

  test(ITC050.title, { annotation: ITC050.annotation }, async ({ page, context, request }) => {
    const [h1] = await provisionStudentsForReportReview(request, [
      {
        profile: TEST_STUDENT_1,
        approveOutline: true,
        progressReport: { fileName: VALID_PDF_FILENAME_1 },
        finalReportSubmissions: [{ fileName: VALID_PDF_FILENAME_1 }],
      },
    ]);

    // 1. Open while OPEN, select REQUEST_CHANGES, switch deadline to EXTENDED -> 3099
    await openReportCheckPage(page, context, envState.mainSupervisorToken);
    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await row1.getByRole('button', { name: 'Thẩm định', exact: true }).click();

    const modal = page.locator('#finalReportReviewModal');
    await modal.locator('input[type="radio"][value="REQUEST_CHANGES"]').check();
    await modal
      .getByPlaceholder('Nhập chính xác tỷ lệ % hiển thị trên file PDF (VD: 12.5)')
      .fill('16.0');
    await modal.locator('input[type="file"]').setInputFiles({
      name: PLAGIARISM_PDF_FILENAME_1,
      mimeType: 'application/pdf',
      buffer: createPlagiarismPdfBuffer(VALID_PDF_FILENAME_1, 16.0),
    });

    await updateDeadline(request, envState.dlBaoCao, 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI', 'EXTENDED');

    const reqInExtPromise = page.waitForResponse(
      (r) =>
        r.url().includes(`/report/${h1.finalReportPublicId}/review`) && r.request().method() === 'PUT',
    );
    await modal.getByRole('button', { name: 'Xác nhận thẩm định' }).click();
    const reqInExtRes = await reqInExtPromise;

    const msg3099 = 'Trong thời gian gia hạn chấm chỉ được chọn Đạt (APPROVED) hoặc Không đạt (REJECTED)';
    expect(reqInExtRes.status()).toBe(400);
    const reqInExtBody = await reqInExtRes.json();
    expect(reqInExtBody.code).toBe(3099);
    expect(reqInExtBody.message).toBe(msg3099);
    await expect(modal.getByRole('alert').filter({ hasText: msg3099 })).toBeVisible();

    // 2. Reload while EXTENDED, open modal, select REJECTED, switch deadline to OPEN -> 3098
    const reloadPromise = page.waitForResponse(
      (r) => r.url().includes('/report/supervisor-list') && r.request().method() === 'GET',
    );
    await page.reload();
    await reloadPromise;

    await page
      .getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) })
      .getByRole('button', { name: 'Thẩm định', exact: true })
      .click();

    await modal.locator('input[type="radio"][value="REJECTED"]').check();
    await modal
      .getByPlaceholder('Nhập chính xác tỷ lệ % hiển thị trên file PDF (VD: 12.5)')
      .fill('16.0');
    await modal.locator('input[type="file"]').setInputFiles({
      name: PLAGIARISM_PDF_FILENAME_1,
      mimeType: 'application/pdf',
      buffer: createPlagiarismPdfBuffer(VALID_PDF_FILENAME_1, 16.0),
    });

    await updateDeadline(request, envState.dlBaoCao, 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI', 'OPEN');

    const rejInOpenPromise = page.waitForResponse(
      (r) =>
        r.url().includes(`/report/${h1.finalReportPublicId}/review`) && r.request().method() === 'PUT',
    );
    await modal.getByRole('button', { name: 'Xác nhận thẩm định' }).click();
    const rejInOpenRes = await rejInOpenPromise;

    const msg3098 =
      'Trong thời gian nhận bài chỉ được chọn Đạt (APPROVED) hoặc Yêu cầu chỉnh sửa (REQUEST_CHANGES)';
    expect(rejInOpenRes.status()).toBe(400);
    const rejInOpenBody = await rejInOpenRes.json();
    expect(rejInOpenBody.code).toBe(3098);
    expect(rejInOpenBody.message).toBe(msg3098);
    await expect(modal.getByRole('alert').filter({ hasText: msg3098 })).toBeVisible();

    const dbReport = await dbSelect<{ status: string }>(
      'SELECT status FROM thesis_final_report WHERE id = ?',
      [h1.finalReportId],
    );
    expect(dbReport[0].status).toBe('PENDING');

    const dbTopic = await dbSelect<{ status: string }>(
      'SELECT status FROM thesis_topic WHERE id = ?',
      [h1.topicId],
    );
    expect(dbTopic[0].status).toBe('IN_PROGRESS');
  });

  test(ITC051.title, { annotation: ITC051.annotation }, async ({ page, context, request }) => {
    const [h1] = await provisionStudentsForReportReview(request, [
      {
        profile: TEST_STUDENT_1,
        approveOutline: true,
        progressReport: { fileName: VALID_PDF_FILENAME_1 },
        finalReportSubmissions: [{ fileName: VALID_PDF_FILENAME_1 }],
      },
    ]);

    await openReportCheckPage(page, context, envState.mainSupervisorToken);
    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await row1.getByRole('button', { name: 'Thẩm định', exact: true }).click();

    const modal = page.locator('#finalReportReviewModal');
    await modal
      .getByPlaceholder('Nhập chính xác tỷ lệ % hiển thị trên file PDF (VD: 12.5)')
      .fill('14.0');
    await modal.locator('input[type="file"]').setInputFiles({
      name: PLAGIARISM_PDF_FILENAME_1,
      mimeType: 'application/pdf',
      buffer: createPlagiarismPdfBuffer(VALID_PDF_FILENAME_1, 14.0),
    });

    await updateDeadline(request, envState.dlBaoCao, 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI', 'CLOSED');

    const reviewPromise = page.waitForResponse(
      (r) =>
        r.url().includes(`/report/${h1.finalReportPublicId}/review`) && r.request().method() === 'PUT',
    );
    await modal.getByRole('button', { name: 'Xác nhận thẩm định' }).click();
    const reviewRes = await reviewPromise;

    const closedMsg = 'Đã quá thời hạn GVHD thẩm định báo cáo, vui lòng liên hệ Trưởng bộ môn gia hạn';
    expect(reviewRes.status()).toBe(403);
    const reviewBody = await reviewRes.json();
    expect(reviewBody.code).toBe(3097);
    expect(reviewBody.message).toBe(closedMsg);

    await expect(modal).toBeVisible();
    await expect(modal.getByRole('alert').filter({ hasText: closedMsg })).toBeVisible();

    const dbReport = await dbSelect<{ status: string; plagiarism_rate: number | null }>(
      'SELECT status, plagiarism_rate FROM thesis_final_report WHERE id = ?',
      [h1.finalReportId],
    );
    expect(dbReport[0].status).toBe('PENDING');
    expect(dbReport[0].plagiarism_rate).toBeNull();
  });

  test(ITC052.title, { annotation: ITC052.annotation }, async ({ page, context, request }) => {
    const [h1, h2] = await provisionStudentsForReportReview(request, [
      {
        profile: TEST_STUDENT_1,
        approveOutline: true,
        progressReport: { fileName: VALID_PDF_FILENAME_1 },
        finalReportSubmissions: [{ fileName: VALID_PDF_FILENAME_1 }],
      },
      {
        profile: TEST_STUDENT_2,
        approveOutline: true,
        finalReportSubmissions: [{ fileName: VALID_PDF_FILENAME_2 }],
      },
    ]);

    await openReportCheckPage(page, context, envState.mainSupervisorToken);

    // Check student 2's button is disabled on UI due to missing progress report
    const row2 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) });
    await expect(row2.getByRole('button', { name: 'Thẩm định', exact: true })).toBeDisabled();
    await expect(row2).toContainText('Chưa nộp phiếu theo dõi tiến độ');

    // Open modal on student 1, review concurrently via API -> 3092
    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await row1.getByRole('button', { name: 'Thẩm định', exact: true }).click();

    const modal = page.locator('#finalReportReviewModal');
    await modal
      .getByPlaceholder('Nhập chính xác tỷ lệ % hiển thị trên file PDF (VD: 12.5)')
      .fill('14.0');
    await modal.locator('input[type="file"]').setInputFiles({
      name: PLAGIARISM_PDF_FILENAME_1,
      mimeType: 'application/pdf',
      buffer: createPlagiarismPdfBuffer(VALID_PDF_FILENAME_1, 14.0),
    });

    await reviewFinalReportViaApi(request, envState.mainSupervisorToken, h1.finalReportPublicId!, {
      decision: 'REQUEST_CHANGES',
      plagiarismRate: 20.0,
      feedback: 'Đã xử lý đồng thời ở tab khác',
      plagiarismFile: {
        name: PLAGIARISM_PDF_FILENAME_1,
        mimeType: 'application/pdf',
        buffer: createPlagiarismPdfBuffer(VALID_PDF_FILENAME_1, 20.0),
      },
    });

    const notPendingPromise = page.waitForResponse(
      (r) =>
        r.url().includes(`/report/${h1.finalReportPublicId}/review`) && r.request().method() === 'PUT',
    );
    await modal.getByRole('button', { name: 'Xác nhận thẩm định' }).click();
    const notPendingRes = await notPendingPromise;

    expect(notPendingRes.status()).toBe(409);
    const notPendingBody = await notPendingRes.json();
    expect(notPendingBody.code).toBe(3092);
    expect(notPendingBody.message).toBe('Báo cáo không ở trạng thái chờ thẩm định');
    await expect(
      modal.getByRole('alert').filter({ hasText: 'Báo cáo không ở trạng thái chờ thẩm định' }),
    ).toBeVisible();

    // Direct API call on student 2 without progress report -> 3093
    const noProgressRes = await reviewFinalReportViaApi(
      request,
      envState.mainSupervisorToken,
      h2.finalReportPublicId!,
      {
        decision: 'APPROVED',
        plagiarismRate: 14.0,
        plagiarismFile: {
          name: PLAGIARISM_PDF_FILENAME_2,
          mimeType: 'application/pdf',
          buffer: createPlagiarismPdfBuffer(VALID_PDF_FILENAME_2, 14.0),
        },
      },
    );
    expect(noProgressRes.status).toBe(409);
    expect(noProgressRes.body.code).toBe(3093);
    expect(noProgressRes.body.message).toBe('GVHD chưa nộp phiếu theo dõi tiến độ cho đề tài này');

    const dbReport1 = await dbSelect<{ status: string }>(
      'SELECT status FROM thesis_final_report WHERE id = ?',
      [h1.finalReportId],
    );
    expect(dbReport1[0].status).toBe('REQUEST_CHANGES');

    const dbReport2 = await dbSelect<{ status: string }>(
      'SELECT status FROM thesis_final_report WHERE id = ?',
      [h2.finalReportId],
    );
    expect(dbReport2[0].status).toBe('PENDING');
  });

  // ==========================================================================
  // SECURITY TEST CASES (TC-SEC-048 .. TC-SEC-053)
  // ==========================================================================

  test.describe('SecurityTest', () => {
    test(SEC048.title, { annotation: SEC048.annotation }, async ({ page, context, request }) => {
      const [h1] = await provisionStudentsForReportReview(request, [
        {
          profile: TEST_STUDENT_1,
          approveOutline: true,
          progressReport: { fileName: VALID_PDF_FILENAME_1 },
          finalReportSubmissions: [{ fileName: VALID_PDF_FILENAME_1 }],
        },
      ]);

      await context.clearCookies();
      const myInfoPromise = page.waitForResponse(
        (r) => r.url().includes('/my-info') && r.request().method() === 'GET',
      );
      await page.goto('/lecturer/report-check');
      const myInfoRes = await myInfoPromise;

      expect(myInfoRes.status()).toBe(401);
      expect((await myInfoRes.json()).code).toBe(2000);
      await expect(page).toHaveURL(/\/login/);

      const listRes = await request.get(
        `${getApiBaseUrl()}/report/supervisor-list?semesterId=${envState.semesterPublicId}`,
      );
      expect(listRes.status()).toBe(401);
      expect((await listRes.json()).code).toBe(2000);

      const detailRes = await request.get(`${getApiBaseUrl()}/report/${h1.finalReportPublicId}`);
      expect(detailRes.status()).toBe(401);
      expect((await detailRes.json()).code).toBe(2000);

      const revRes = await reviewFinalReportViaApi(request, null, h1.finalReportPublicId!, {
        decision: 'APPROVED',
        plagiarismRate: 12.0,
        plagiarismFile: {
          name: PLAGIARISM_PDF_FILENAME_1,
          mimeType: 'application/pdf',
          buffer: createPlagiarismPdfBuffer(VALID_PDF_FILENAME_1, 12.0),
        },
      });
      expect(revRes.status).toBe(401);
      expect(revRes.body.code).toBe(2000);
    });

    test(SEC049.title, { annotation: SEC049.annotation }, async ({ page, context, request }) => {
      const [h1] = await provisionStudentsForReportReview(request, [
        {
          profile: TEST_STUDENT_1,
          approveOutline: true,
          progressReport: { fileName: VALID_PDF_FILENAME_1 },
          finalReportSubmissions: [{ fileName: VALID_PDF_FILENAME_1 }],
        },
      ]);

      await setAuthCookie(context, h1.studentToken);
      await page.goto('/lecturer/report-check');
      await expect(
        page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.'),
      ).toBeVisible();

      const listRes = await apiCall(request, h1.studentToken, 'GET', '/report/supervisor-list', {
        params: { semesterId: envState.semesterPublicId },
      });
      expect(listRes.status).toBe(403);
      expect(listRes.body.code).toBe(2001);

      const revRes = await reviewFinalReportViaApi(request, h1.studentToken, h1.finalReportPublicId!, {
        decision: 'APPROVED',
        plagiarismRate: 12.0,
        plagiarismFile: {
          name: PLAGIARISM_PDF_FILENAME_1,
          mimeType: 'application/pdf',
          buffer: createPlagiarismPdfBuffer(VALID_PDF_FILENAME_1, 12.0),
        },
      });
      expect(revRes.status).toBe(403);
      expect(revRes.body.code).toBe(2001);
      expect(revRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');

      const dbReport = await dbSelect<{ status: string }>(
        'SELECT status FROM thesis_final_report WHERE id = ?',
        [h1.finalReportId],
      );
      expect(dbReport[0].status).toBe('PENDING');
    });

    test(SEC050.title, { annotation: SEC050.annotation }, async ({ page, context, request }) => {
      const [h1] = await provisionStudentsForReportReview(request, [
        {
          profile: TEST_STUDENT_1,
          approveOutline: true,
          progressReport: { fileName: VALID_PDF_FILENAME_1 },
          finalReportSubmissions: [{ fileName: VALID_PDF_FILENAME_1 }],
        },
      ]);

      await setAuthCookie(context, envState.plainLecturerToken);
      await page.goto('/lecturer/report-check');
      await expect(
        page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.'),
      ).toBeVisible();

      const listRes = await apiCall(request, envState.plainLecturerToken, 'GET', '/report/supervisor-list', {
        params: { semesterId: envState.semesterPublicId },
      });
      expect(listRes.status).toBe(403);
      expect(listRes.body.code).toBe(2001);
      expect(listRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');

      const detailRes = await apiCall(
        request,
        envState.plainLecturerToken,
        'GET',
        `/report/${h1.finalReportPublicId}`,
      );
      expect(detailRes.status).toBe(403);
      expect(detailRes.body.code).toBe(2001);
      expect(detailRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');

      const revRes = await reviewFinalReportViaApi(
        request,
        envState.plainLecturerToken,
        h1.finalReportPublicId!,
        {
          decision: 'APPROVED',
          plagiarismRate: 12.0,
          plagiarismFile: {
            name: PLAGIARISM_PDF_FILENAME_1,
            mimeType: 'application/pdf',
            buffer: createPlagiarismPdfBuffer(VALID_PDF_FILENAME_1, 12.0),
          },
        },
      );
      expect(revRes.status).toBe(403);
      expect(revRes.body.code).toBe(2001);
      expect(revRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');

      const dbReport = await dbSelect<{ status: string }>(
        'SELECT status FROM thesis_final_report WHERE id = ?',
        [h1.finalReportId],
      );
      expect(dbReport[0].status).toBe('PENDING');
    });

    test(SEC051.title, { annotation: SEC051.annotation }, async ({ page, context, request }) => {
      const [h1] = await provisionStudentsForReportReview(request, [
        {
          profile: TEST_STUDENT_1,
          approveOutline: true,
          progressReport: { fileName: VALID_PDF_FILENAME_1 },
          finalReportSubmissions: [{ fileName: VALID_PDF_FILENAME_1 }],
        },
      ]);

      const freshToken = await loginByEmail(request, TEST_MAIN_SUPERVISOR.email);
      const logoutRes = await apiCall(request, freshToken, 'POST', '/log-out');
      expect(logoutRes.status).toBe(200);

      await setAuthCookie(context, freshToken);
      const myInfoPromise = page.waitForResponse(
        (r) => r.url().includes('/my-info') && r.request().method() === 'GET',
      );
      await page.goto('/lecturer/report-check');
      const myInfoRes = await myInfoPromise;

      expect(myInfoRes.status()).toBe(401);
      expect((await myInfoRes.json()).code).toBe(2000);
      await expect(page).toHaveURL(/\/login/);

      const listRes = await apiCall(request, freshToken, 'GET', '/report/supervisor-list', {
        params: { semesterId: envState.semesterPublicId },
      });
      expect(listRes.status).toBe(401);
      expect(listRes.body.code).toBe(2000);

      const revRes = await reviewFinalReportViaApi(request, freshToken, h1.finalReportPublicId!, {
        decision: 'APPROVED',
        plagiarismRate: 12.0,
        plagiarismFile: {
          name: PLAGIARISM_PDF_FILENAME_1,
          mimeType: 'application/pdf',
          buffer: createPlagiarismPdfBuffer(VALID_PDF_FILENAME_1, 12.0),
        },
      });
      expect(revRes.status).toBe(401);
      expect(revRes.body.code).toBe(2000);

      const dbReport = await dbSelect<{ status: string }>(
        'SELECT status FROM thesis_final_report WHERE id = ?',
        [h1.finalReportId],
      );
      expect(dbReport[0].status).toBe('PENDING');
    });

    test(SEC052.title, { annotation: SEC052.annotation }, async ({ page, context, request }) => {
      const [h1] = await provisionStudentsForReportReview(request, [
        {
          profile: TEST_STUDENT_1,
          assignCoSupervisor: true,
          approveOutline: true,
          progressReport: { fileName: VALID_PDF_FILENAME_1 },
          finalReportSubmissions: [{ fileName: VALID_PDF_FILENAME_1 }],
        },
      ]);

      await openReportCheckPage(page, context, envState.coSupervisorToken);
      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(row1).toBeVisible();
      await expect(row1).toContainText('Đồng hướng dẫn (Chỉ xem)');
      await expect(row1).toContainText('Chỉ xem');
      await expect(row1.getByRole('button', { name: 'Thẩm định', exact: true })).toHaveCount(0);

      const revRes = await reviewFinalReportViaApi(
        request,
        envState.coSupervisorToken,
        h1.finalReportPublicId!,
        {
          decision: 'APPROVED',
          plagiarismRate: 12.0,
          plagiarismFile: {
            name: PLAGIARISM_PDF_FILENAME_1,
            mimeType: 'application/pdf',
            buffer: createPlagiarismPdfBuffer(VALID_PDF_FILENAME_1, 12.0),
          },
        },
      );
      expect(revRes.status).toBe(403);
      expect(revRes.body.code).toBe(2001);
      expect(revRes.body.message).toBe(
        'Giảng viên đồng hướng dẫn chỉ có quyền xem, không có quyền thẩm định báo cáo',
      );

      const dbReport = await dbSelect<{ status: string }>(
        'SELECT status FROM thesis_final_report WHERE id = ?',
        [h1.finalReportId],
      );
      expect(dbReport[0].status).toBe('PENDING');
    });

    test(SEC053.title, { annotation: SEC053.annotation }, async ({ page, context, request }) => {
      const [h1] = await provisionStudentsForReportReview(request, [
        {
          profile: TEST_STUDENT_1,
          approveOutline: true,
          progressReport: { fileName: VALID_PDF_FILENAME_1 },
          finalReportSubmissions: [{ fileName: VALID_PDF_FILENAME_1 }],
        },
      ]);

      await openReportCheckPage(page, context, envState.otherSupervisorToken);
      await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) })).toHaveCount(0);

      const detailRes = await apiCall(
        request,
        envState.otherSupervisorToken,
        'GET',
        `/report/${h1.finalReportPublicId}`,
      );
      expect(detailRes.status).toBe(403);
      expect(detailRes.body.code).toBe(2001);
      expect(detailRes.body.message).toBe('Bạn không có quyền truy cập thông tin báo cáo này');

      const revRes = await reviewFinalReportViaApi(
        request,
        envState.otherSupervisorToken,
        h1.finalReportPublicId!,
        {
          decision: 'APPROVED',
          plagiarismRate: 12.0,
          plagiarismFile: {
            name: PLAGIARISM_PDF_FILENAME_1,
            mimeType: 'application/pdf',
            buffer: createPlagiarismPdfBuffer(VALID_PDF_FILENAME_1, 12.0),
          },
        },
      );
      expect(revRes.status).toBe(403);
      expect(revRes.body.code).toBe(2001);
      expect(revRes.body.message).toBe('Bạn không phải giảng viên hướng dẫn chính của đề tài này');

      const dbReport = await dbSelect<{ status: string }>(
        'SELECT status FROM thesis_final_report WHERE id = ?',
        [h1.finalReportId],
      );
      expect(dbReport[0].status).toBe('PENDING');
    });
  });
});
