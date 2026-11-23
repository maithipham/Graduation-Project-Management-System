import { test, expect, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';
import { defineItc, defineItcSec } from '../../../support/integration-test-case';
import { apiCall, getApiBaseUrl, loginByEmail } from '../../../support/api';
import { dbSelect } from '../../../support/db';

// ============================================================================
// ĐẶC TẢ TEST CASE (ITC016..ITC031 & TC-SEC-042..TC-SEC-047)
// Feature: report | Module/Sheet: NopPhieuTheoDoi
// Role: Giảng viên hướng dẫn (SUPERVISOR)
// ============================================================================

const ITC016 = defineItc({
  id: 'ITC016',
  feature: 'report',
  module: 'NopPhieuTheoDoi',
  sheet: 'NopPhieuTheoDoi',
  fn: 'View and Filter Supervised Progress Reports',
  description:
    'Verify that a main supervisor can view supervised students in the report stage with accurate tab counters, open deadline badge, and stage-based upload controls',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân").\n' +
    '2. Open the "Đánh giá hướng dẫn" screen ("/lecturer/guiding-evaluation").',
  expected:
    '1. The API GET /report/supervisor-list returns HTTP 200 with code = 1000 and 3 supervised students at STAGE_3_OUTLINE_APPROVED or higher (excluding the STAGE_2_TOPIC_CONFIRMED student), all with canSubmitProgressReport = true and deadlineStatus = "OPEN".\n' +
    '2. The database confirms 4 topics exist for supervisor "GV999901" (2 at STAGE_3_OUTLINE_APPROVED, 1 at STAGE_4_REPORT_APPROVED, and 1 at STAGE_2_TOPIC_CONFIRMED) and 2 thesis_progress_report records exist.\n' +
    '3. The UI displays deadline badge "Đang mở", tab counters "Tất cả" = 3, "Chưa nộp phiếu" = 1, "Đã nộp phiếu" = 2, an enabled "Nộp phiếu" button and status "Chưa nộp phiếu theo dõi" for student "9990000901", file link with "Cập nhật phiếu theo dõi" and status "Đã nộp phiếu" for student "9990000902", file link without "Cập nhật phiếu theo dõi" for student "9990000903" (STAGE_4_REPORT_APPROVED), and does not list student "9990000904" (STAGE_2_TOPIC_CONFIRMED).',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Main supervisor "Nguyễn Minh Quân" ("GV999901") supervises 4 students: "9990000901" (STAGE_3_OUTLINE_APPROVED, no progress report), "9990000902" (STAGE_3_OUTLINE_APPROVED, progress report uploaded), "9990000903" (STAGE_4_REPORT_APPROVED, progress report uploaded and final report approved), and "9990000904" (STAGE_2_TOPIC_CONFIRMED, outline not approved yet).',
});

const ITC017 = defineItc({
  id: 'ITC017',
  feature: 'report',
  module: 'NopPhieuTheoDoi',
  sheet: 'NopPhieuTheoDoi',
  fn: 'View and Filter Supervised Progress Reports',
  description:
    'Verify that a main supervisor can switch progress status tabs, search by student code, and see the empty state when no student matches the search keyword',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân") and open the "Đánh giá hướng dẫn" screen ("/lecturer/guiding-evaluation").\n' +
    '2. Click the "Chưa nộp phiếu" tab, then click the "Đã nộp phiếu" tab, and then click the "Tất cả" tab.\n' +
    '3. Enter "9990000902" into the "Tìm sinh viên, mã SV hoặc đề tài..." search box.\n' +
    '4. Replace the search keyword with "KHONGTONTAI9999".',
  expected:
    '1. The API GET /report/supervisor-list returns HTTP 200 with code = 1000 and 2 supervised students ("9990000901" without progress report and "9990000902" with progress report).\n' +
    '2. Under "Chưa nộp phiếu", only student "Trần Đức Anh" ("9990000901") is displayed; under "Đã nộp phiếu", only student "Nguyễn Thị Ngọc" ("9990000902") is displayed.\n' +
    '3. Searching "9990000902" under "Tất cả" displays only student "Nguyễn Thị Ngọc" ("9990000902").\n' +
    '4. Searching "KHONGTONTAI9999" displays empty state message "Không tìm thấy sinh viên nào phù hợp".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Main supervisor "GV999901" supervises 2 STAGE_3_OUTLINE_APPROVED students: "9990000901" (no progress report) and "9990000902" (progress report already uploaded).',
});

const ITC018 = defineItc({
  id: 'ITC018',
  feature: 'report',
  module: 'NopPhieuTheoDoi',
  sheet: 'NopPhieuTheoDoi',
  fn: 'View and Filter Supervised Progress Reports',
  description:
    'Verify that a co-supervisor can view supervised students\' progress report statuses in read-only mode without upload or update controls',
  procedure:
    '1. Log in as a Co-Supervisor ("Đặng Thị Hương").\n' +
    '2. Open the "Đánh giá hướng dẫn" screen ("/lecturer/guiding-evaluation").',
  expected:
    '1. The API GET /report/supervisor-list returns HTTP 200 with code = 1000 and includes students "9990000901" and "9990000902" with canSubmitProgressReport = false.\n' +
    '2. The database confirms supervisor "GV999902" is assigned as the co-supervisor (co_lecturer_id) on both thesis topics.\n' +
    '3. Both rows display badge "Đồng hướng dẫn (Chỉ xem)" and "GVHD chính: Nguyễn Minh Quân"; student "9990000901" displays "Chưa có phiếu theo dõi" with no "Nộp phiếu" button, and student "9990000902" displays the uploaded progress report file link with no "Cập nhật phiếu theo dõi" button.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Supervisor "Đặng Thị Hương" ("GV999902") is assigned as co-supervisor alongside main supervisor "Nguyễn Minh Quân" ("GV999901") for students "9990000901" (no progress report) and "9990000902" (progress report uploaded).',
});

const ITC019 = defineItc({
  id: 'ITC019',
  feature: 'report',
  module: 'NopPhieuTheoDoi',
  sheet: 'NopPhieuTheoDoi',
  fn: 'View and Filter Supervised Progress Reports',
  description:
    'Verify that progress report upload controls are disabled with appropriate blocked reasons when the deadline is closed or has not started yet',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân") and open "/lecturer/guiding-evaluation" while the "NOP_BAO_CAO_VA_PHIEU_THEO_DOI" deadline is CLOSED.\n' +
    '2. Update the deadline to NOT_STARTED and reload "/lecturer/guiding-evaluation".',
  expected:
    '1. When CLOSED, GET /report/supervisor-list returns HTTP 200 with code = 1000 and deadlineStatus = "CLOSED"; the header displays "(Đã hết hạn)", the "Nộp phiếu" button for student "9990000901" is disabled, and the row displays blocked reason "Đã hết hạn nộp phiếu theo dõi".\n' +
    '2. When NOT_STARTED, GET /report/supervisor-list returns HTTP 200 with code = 1000 and deadlineStatus = "NOT_STARTED"; the header displays badge "Chưa mở", the "Nộp phiếu" button for student "9990000901" is disabled, and the row displays blocked reason "Chưa tới thời gian mở".',
  precondition:
    '1. Student "Trần Đức Anh" ("9990000901") is at STAGE_3_OUTLINE_APPROVED supervised by "GV999901" with no progress report uploaded.\n' +
    '2. The "NOP_BAO_CAO_VA_PHIEU_THEO_DOI" deadline is configured sequentially as CLOSED and NOT_STARTED.',
});

const ITC020 = defineItc({
  id: 'ITC020',
  feature: 'report',
  module: 'NopPhieuTheoDoi',
  sheet: 'NopPhieuTheoDoi',
  fn: 'View and Filter Supervised Progress Reports',
  description:
    'Verify that a disqualified thesis topic displays the suspension badge, hides the progress report update button, and shows the blocked reason in the preview modal',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân") and open the "Đánh giá hướng dẫn" screen ("/lecturer/guiding-evaluation").\n' +
    '2. Inspect the row of disqualified student "Trần Đức Anh" ("9990000901") and click the progress report file link to open the preview modal.',
  expected:
    '1. The API GET /report/supervisor-list returns HTTP 200 with code = 1000 and includes student "9990000901" with topicStatus = "DISQUALIFIED" and a non-null progressReport.\n' +
    '2. The database confirms student "9990000901"\'s thesis_topic status is DISQUALIFIED.\n' +
    '3. The row displays badge "Đình chỉ" and does not show the "Cập nhật phiếu theo dõi" button; opening the preview modal displays blocked reason "Đề tài không ở trạng thái đang thực hiện" without the "Cập nhật phiếu theo dõi" button.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Trần Đức Anh" ("9990000901") has an uploaded progress report and a rejected final report during the EXTENDED period so thesis_topic.status = DISQUALIFIED.',
});

const ITC021 = defineItc({
  id: 'ITC021',
  feature: 'report',
  module: 'NopPhieuTheoDoi',
  sheet: 'NopPhieuTheoDoi',
  fn: 'Preview Progress Report and Student Report Detail',
  description:
    'Verify that a main supervisor can open the preview modal for an uploaded PDF progress report and inspect report metadata, supervisor note, PDF iframe, and update action',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân") and open the "Đánh giá hướng dẫn" screen ("/lecturer/guiding-evaluation").\n' +
    '2. Click the PDF progress report file link on the row of student "Trần Đức Anh" ("9990000901").',
  expected:
    '1. The API GET /report/{publicId} returns HTTP 200 with code = 1000 including progressReport with supervisorName = "Nguyễn Minh Quân", supervisorNote = "Sinh viên bám sát kế hoạch hàng tuần, hoàn thành tốt các mốc.", and progressFile containing "64HTTT99_9990000901_TranDucAnh.pdf".\n' +
    '2. The database confirms 1 thesis_progress_report record exists for student "9990000901" with the matching file URL and supervisor_note.\n' +
    '3. The preview modal displays "Đã nộp phiếu theo dõi tiến độ", student "Trần Đức Anh (9990000901)", uploader "Nguyễn Minh Quân", note "Sinh viên bám sát kế hoạch hàng tuần, hoàn thành tốt các mốc.", a PDF preview iframe, and an enabled "Cập nhật phiếu theo dõi" button.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Trần Đức Anh" ("9990000901") is at STAGE_3_OUTLINE_APPROVED with a PDF progress report ("64HTTT99_9990000901_TranDucAnh.pdf"), note "Sinh viên bám sát kế hoạch hàng tuần, hoàn thành tốt các mốc.", and a PENDING final report.',
});

const ITC022 = defineItc({
  id: 'ITC022',
  feature: 'report',
  module: 'NopPhieuTheoDoi',
  sheet: 'NopPhieuTheoDoi',
  fn: 'Preview Progress Report and Student Report Detail',
  description:
    'Verify that opening the preview modal for an uploaded DOCX progress report without a note displays the non-PDF fallback viewer and empty-note placeholder',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân") and open the "Đánh giá hướng dẫn" screen ("/lecturer/guiding-evaluation").\n' +
    '2. Click the "Xem trước phiếu theo dõi" icon button on the row of student "Nguyễn Thị Ngọc" ("9990000902").',
  expected:
    '1. The API GET /report/supervisor-list returns HTTP 200 with code = 1000 including student "9990000902"\'s DOCX progressReport with supervisorNote = null.\n' +
    '2. The database confirms student "9990000902"\'s thesis_progress_report stores a DOCX file URL and supervisor_note IS NULL.\n' +
    '3. The preview modal displays "Đã nộp phiếu theo dõi tiến độ", "Không có ghi chú", "Sinh viên chưa nộp báo cáo Final", fallback message "Trình duyệt không hỗ trợ xem trực tiếp định dạng DOCX. Vui lòng tải xuống hoặc mở trong tab mới.", and button "Tải xuống tệp".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Nguyễn Thị Ngọc" ("9990000902") is at STAGE_3_OUTLINE_APPROVED with an uploaded DOCX progress report ("64HTTT99_9990000902_NguyenThiNgoc.docx"), no supervisor note, and no final report submitted yet.',
});

const ITC023 = defineItc({
  id: 'ITC023',
  feature: 'report',
  module: 'NopPhieuTheoDoi',
  sheet: 'NopPhieuTheoDoi',
  fn: 'Submit and Update Progress Report',
  description:
    'Verify that a main supervisor can successfully submit a valid PDF progress report with a trimmed supervisor note for the first time',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân") and open the "Đánh giá hướng dẫn" screen ("/lecturer/guiding-evaluation").\n' +
    '2. Click "Nộp phiếu" on the row of student "Trần Đức Anh" ("9990000901").\n' +
    '3. Select the valid PDF file "64HTTT99_9990000901_TranDucAnh.pdf", enter "  Sinh viên hoàn thành tốt tiến độ 12 tuần thực hiện đồ án.  " into "Nhận xét tổng kết tiến độ của GVHD", and click "Xác nhận nộp file".',
  expected:
    '1. The API POST /report/progress-report returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Nộp phiếu theo dõi tiến độ thành công".\n' +
    '3. The database creates 1 thesis_progress_report record for student "9990000901" with supervisor "GV999901", progress_file containing "64HTTT99_9990000901_TranDucAnh.pdf", trimmed supervisor_note "Sinh viên hoàn thành tốt tiến độ 12 tuần thực hiện đồ án.", non-null submitted_at, and creates a student notification "GVHD đã nộp phiếu theo dõi tiến độ.".\n' +
    '4. The UI displays toast "Đã nộp phiếu theo dõi tiến độ cho sinh viên Trần Đức Anh", closes the modal, updates the row status to "Đã nộp phiếu", shows the file link, note "Ghi chú: Sinh viên hoàn thành tốt tiến độ 12 tuần thực hiện đồ án.", button "Cập nhật phiếu theo dõi", and updates tab counters to "Chưa nộp phiếu" = 0 and "Đã nộp phiếu" = 1.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Trần Đức Anh" ("9990000901") is at STAGE_3_OUTLINE_APPROVED (IN_PROGRESS) supervised by main supervisor "GV999901" with no progress report submitted yet.',
});

const ITC024 = defineItc({
  id: 'ITC024',
  feature: 'report',
  module: 'NopPhieuTheoDoi',
  sheet: 'NopPhieuTheoDoi',
  fn: 'Submit and Update Progress Report',
  description:
    'Verify that a main supervisor can update an existing progress report with a valid DOCX file and revised note without creating duplicate records',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân") and open the "Đánh giá hướng dẫn" screen ("/lecturer/guiding-evaluation").\n' +
    '2. Click "Cập nhật phiếu theo dõi" on the row of student "Trần Đức Anh" ("9990000901").\n' +
    '3. Verify the modal shows "Cập nhật phiếu theo dõi tiến độ", the current file link with "(Nộp file mới sẽ ghi đè file này)", and pre-filled previous note; select "64HTTT99_9990000901_TranDucAnh.docx", update the note to "Đã cập nhật phiếu theo dõi tiến độ bản cuối.", and click "Xác nhận cập nhật".',
  expected:
    '1. The API POST /report/progress-report returns HTTP 200 with code = 1000.\n' +
    '2. The response message is "Nộp phiếu theo dõi tiến độ thành công".\n' +
    '3. The database retains exactly 1 thesis_progress_report record for student "9990000901" (updated in place with the same id), overwrites progress_file to contain "64HTTT99_9990000901_TranDucAnh.docx" and supervisor_note to "Đã cập nhật phiếu theo dõi tiến độ bản cuối.", and creates a new student notification.\n' +
    '4. The UI displays toast "Đã cập nhật phiếu theo dõi tiến độ cho sinh viên Trần Đức Anh", closes the modal, and displays the updated DOCX file link and updated note in the row.',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Trần Đức Anh" ("9990000901") already has 1 PDF progress report ("64HTTT99_9990000901_TranDucAnh.pdf") with note "Nhận xét ban đầu trước khi cập nhật." uploaded by main supervisor "GV999901".',
});

const ITC025 = defineItc({
  id: 'ITC025',
  feature: 'report',
  module: 'NopPhieuTheoDoi',
  sheet: 'NopPhieuTheoDoi',
  fn: 'Submit and Update Progress Report',
  description:
    'Verify that a main supervisor can submit a valid PDF progress report without a note during the extended grading period',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân") and open the "Đánh giá hướng dẫn" screen ("/lecturer/guiding-evaluation") while the deadline is in EXTENDED status.\n' +
    '2. Click "Nộp phiếu" on the row of student "Trần Đức Anh" ("9990000901"), select "64HTTT99_9990000901_TranDucAnh.pdf", enter spaces "   " in the note field, and click "Xác nhận nộp file".',
  expected:
    '1. The header displays deadline badge "Gia hạn chấm".\n' +
    '2. The API POST /report/progress-report returns HTTP 200 with code = 1000 and message "Nộp phiếu theo dõi tiến độ thành công".\n' +
    '3. The database creates 1 thesis_progress_report record for student "9990000901" with progress_file containing "64HTTT99_9990000901_TranDucAnh.pdf" and supervisor_note = NULL.\n' +
    '4. The UI displays toast "Đã nộp phiếu theo dõi tiến độ cho sinh viên Trần Đức Anh" and updates the row status to "Đã nộp phiếu" without a "Ghi chú:" line.',
  precondition:
    '1. An ongoing semester exists where the "NOP_BAO_CAO_VA_PHIEU_THEO_DOI" deadline is in EXTENDED status within its active date range.\n' +
    '2. Student "Trần Đức Anh" ("9990000901") is at STAGE_3_OUTLINE_APPROVED supervised by "GV999901" with no progress report submitted yet.',
});

const ITC026 = defineItc({
  id: 'ITC026',
  feature: 'report',
  module: 'NopPhieuTheoDoi',
  sheet: 'NopPhieuTheoDoi',
  fn: 'Submit and Update Progress Report',
  description:
    'Verify that submitting without a file or selecting an unsupported file extension (.txt) is blocked by client-side validation and rejected by the backend API',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân"), open "/lecturer/guiding-evaluation", and click "Nộp phiếu" on student "Trần Đức Anh" ("9990000901").\n' +
    '2. Click "Xác nhận nộp file" without selecting any file.\n' +
    '3. Select the invalid file "64HTTT99_9990000901_TranDucAnh.txt" and click "Xác nhận nộp file".',
  expected:
    '1. No request is sent to POST /report/progress-report from the UI in either attempt.\n' +
    '2. The modal displays "File tải lên không được để trống." when no file is selected and "File tải lên chỉ nhận định dạng .doc, .docx hoặc .pdf." for the .txt file.\n' +
    '3. Direct API POST /report/progress-report with the .txt file returns HTTP 400 with code = 4000 and message "File tải lên chỉ nhận định dạng .doc, .docx hoặc .pdf".\n' +
    '4. The database contains 0 thesis_progress_report records for student "9990000901".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Trần Đức Anh" ("9990000901") is at STAGE_3_OUTLINE_APPROVED with no progress report submitted yet.',
});

const ITC027 = defineItc({
  id: 'ITC027',
  feature: 'report',
  module: 'NopPhieuTheoDoi',
  sheet: 'NopPhieuTheoDoi',
  fn: 'Submit and Update Progress Report',
  description:
    'Verify that selecting a PDF file whose name violates the Tenlop_MaSV_HoVaTen convention is blocked by client-side validation and rejected by the backend API',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân"), open "/lecturer/guiding-evaluation", and click "Nộp phiếu" on student "Trần Đức Anh" ("9990000901").\n' +
    '2. Select the improperly named file "PhieuTheoDoi.pdf" and click "Xác nhận nộp file".',
  expected:
    '1. No request is sent to POST /report/progress-report from the UI.\n' +
    '2. The modal displays validation error "Tên file không đúng định dạng! Vui lòng đổi tên file theo định dạng Tenlop_MaSV_HoVaTen (VD: DHKTPM17A_22110001_NguyenVanAn.pdf)".\n' +
    '3. Direct API POST /report/progress-report with "PhieuTheoDoi.pdf" returns HTTP 400 with code = 4000 and the same naming validation message.\n' +
    '4. The database contains 0 thesis_progress_report records for student "9990000901".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Trần Đức Anh" ("9990000901") is at STAGE_3_OUTLINE_APPROVED with no progress report submitted yet.',
});

const ITC028 = defineItc({
  id: 'ITC028',
  feature: 'report',
  module: 'NopPhieuTheoDoi',
  sheet: 'NopPhieuTheoDoi',
  fn: 'Submit and Update Progress Report',
  description:
    'Verify that selecting an empty (0-byte) file or a file of 10 MB or larger is blocked by validation',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân"), open "/lecturer/guiding-evaluation", and click "Nộp phiếu" on student "Trần Đức Anh" ("9990000901").\n' +
    '2. Select a 0-byte PDF file "64HTTT99_9990000901_TranDucAnh.pdf" and click "Xác nhận nộp file".\n' +
    '3. Select a 10 MB PDF file "64HTTT99_9990000901_TranDucAnh.pdf" and click "Xác nhận nộp file".',
  expected:
    '1. No request is sent to POST /report/progress-report from the UI in either attempt.\n' +
    '2. The modal displays "File tải lên không được để trống." for the 0-byte file and "File tải lên phải nhỏ hơn 10MB." for the 10 MB file.\n' +
    '3. The database contains 0 thesis_progress_report records for student "9990000901".',
  precondition:
    '1. An ongoing semester exists with an OPEN "Nộp báo cáo và phiếu theo dõi tiến độ" deadline.\n' +
    '2. Student "Trần Đức Anh" ("9990000901") is at STAGE_3_OUTLINE_APPROVED with no progress report submitted yet.',
});

const ITC029 = defineItc({
  id: 'ITC029',
  feature: 'report',
  module: 'NopPhieuTheoDoi',
  sheet: 'NopPhieuTheoDoi',
  fn: 'Submit and Update Progress Report',
  description:
    'Verify that submitting a progress report is blocked when the progress report deadline closes concurrently before clicking confirm',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân"), open "/lecturer/guiding-evaluation" while the deadline is open, click "Nộp phiếu" on student "Trần Đức Anh" ("9990000901"), and select "64HTTT99_9990000901_TranDucAnh.pdf".\n' +
    '2. The "NOP_BAO_CAO_VA_PHIEU_THEO_DOI" deadline transitions to COMPLETED before clicking confirm.\n' +
    '3. Click "Xác nhận nộp file".',
  expected:
    '1. The API POST /report/progress-report returns HTTP 403 with code = 3096.\n' +
    '2. The response message is "Thời hạn nộp phiếu theo dõi tiến độ chưa mở hoặc đã kết thúc".\n' +
    '3. The database contains 0 thesis_progress_report records for student "9990000901".\n' +
    '4. The modal remains open and displays server error alert "Thời hạn nộp phiếu theo dõi tiến độ chưa mở hoặc đã kết thúc".',
  precondition:
    '1. Main supervisor "GV999901" opens the upload modal for student "9990000901" while the deadline is OPEN, and the deadline transitions to COMPLETED before submitting.',
});

const ITC030 = defineItc({
  id: 'ITC030',
  feature: 'report',
  module: 'NopPhieuTheoDoi',
  sheet: 'NopPhieuTheoDoi',
  fn: 'Submit and Update Progress Report',
  description:
    'Verify that updating a progress report is blocked when the student\'s thesis advances to STAGE_4_REPORT_APPROVED concurrently before clicking confirm',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân"), open "/lecturer/guiding-evaluation", click "Cập nhật phiếu theo dõi" on student "Trần Đức Anh" ("9990000901"), and select "64HTTT99_9990000901_TranDucAnh.docx".\n' +
    '2. Concurrently, the student\'s PENDING final report is approved so the thesis advances to STAGE_4_REPORT_APPROVED.\n' +
    '3. Click "Xác nhận cập nhật".',
  expected:
    '1. The API POST /report/progress-report returns HTTP 409 with code = 3090.\n' +
    '2. The response message is "Đề tài chưa được duyệt đề cương hoặc không ở giai đoạn làm báo cáo".\n' +
    '3. The database preserves the original PDF progress report file URL and original note while thesis_topic.current_stage remains STAGE_4_REPORT_APPROVED.\n' +
    '4. The modal remains open and displays server error alert "Đề tài chưa được duyệt đề cương hoặc không ở giai đoạn làm báo cáo".',
  precondition:
    '1. Student "Trần Đức Anh" ("9990000901") is at STAGE_3_OUTLINE_APPROVED with an existing PDF progress report and a PENDING final report.\n' +
    '2. Main supervisor "GV999901" opens the update modal before the final report is approved concurrently.',
});

const ITC031 = defineItc({
  id: 'ITC031',
  feature: 'report',
  module: 'NopPhieuTheoDoi',
  sheet: 'NopPhieuTheoDoi',
  fn: 'Submit and Update Progress Report',
  description:
    'Verify that updating a progress report is blocked when the thesis topic becomes DISQUALIFIED concurrently before clicking confirm',
  procedure:
    '1. Log in as a main Supervisor ("Nguyễn Minh Quân"), open "/lecturer/guiding-evaluation", click "Cập nhật phiếu theo dõi" on student "Trần Đức Anh" ("9990000901"), and select "64HTTT99_9990000901_TranDucAnh.docx".\n' +
    '2. Concurrently, the deadline switches to EXTENDED and the student\'s PENDING final report is rejected so thesis_topic.status becomes DISQUALIFIED.\n' +
    '3. Click "Xác nhận cập nhật".',
  expected:
    '1. The API POST /report/progress-report returns HTTP 409 with code = 3057.\n' +
    '2. The response message is "Đề tài không ở trạng thái đang thực hiện".\n' +
    '3. The database preserves the original PDF progress report file URL and original note while thesis_topic.status remains DISQUALIFIED.\n' +
    '4. The modal remains open and displays server error alert "Đề tài không ở trạng thái đang thực hiện".',
  precondition:
    '1. Student "Trần Đức Anh" ("9990000901") is at STAGE_3_OUTLINE_APPROVED with an existing PDF progress report and a PENDING final report.\n' +
    '2. Main supervisor "GV999901" opens the update modal before the final report is rejected concurrently during the EXTENDED period.',
});

// ============================================================================
// SECURITY TEST CASES (TC-SEC-042 .. TC-SEC-047)
// ============================================================================

const SEC042 = defineItcSec({
  id: 'TC-SEC-042',
  feature: 'report',
  module: 'NopPhieuTheoDoi',
  sheet: 'NopPhieuTheoDoi',
  scenario: 'An unauthenticated user opens the Guiding Evaluation screen directly and calls supervisor progress report APIs',
  roleSession: 'Unauthenticated (Anonymous)',
  technique: 'EP',
  given: 'The browser has no active login session (no access_token cookie)',
  when: 'Open "/lecturer/guiding-evaluation" directly on the Lecturer portal and call GET /report/supervisor-list and POST /report/progress-report',
  then: 'GET /my-info, GET /report/supervisor-list, and POST /report/progress-report return HTTP 401 with code = 2000; the UI automatically redirects to "/login" and displays no progress report data',
});

const SEC043 = defineItcSec({
  id: 'TC-SEC-043',
  feature: 'report',
  module: 'NopPhieuTheoDoi',
  sheet: 'NopPhieuTheoDoi',
  scenario: 'A student accesses the Guiding Evaluation screen and invokes supervisor list and progress report upload APIs',
  roleSession: 'Student (STUDENT), logged in',
  technique: 'EP',
  given: 'Logged in with a Student account (without SUPERVISOR role or SUBMIT_PROGRESS_FORM authority)',
  when: 'Open "/lecturer/guiding-evaluation" directly on the Lecturer portal and call GET /report/supervisor-list and POST /report/progress-report',
  then: 'The UI blocks access with message "Tài khoản của bạn không có quyền truy cập cổng cán bộ."; GET /report/supervisor-list returns HTTP 403 with code = 2001; POST /report/progress-report returns HTTP 403 with code = 2001 and message "Bạn không có quyền truy cập (access denied)", and 0 thesis_progress_report records are created in the database',
});

const SEC044 = defineItcSec({
  id: 'TC-SEC-044',
  feature: 'report',
  module: 'NopPhieuTheoDoi',
  sheet: 'NopPhieuTheoDoi',
  scenario: 'A plain lecturer without the SUPERVISOR role accesses the Guiding Evaluation screen and calls progress report upload API',
  roleSession: 'Lecturer (LECTURER), logged in',
  technique: 'EP',
  given: 'Logged in with a Lecturer account not assigned as a supervisor in the semester (without SUPERVISOR role or SUBMIT_PROGRESS_FORM authority)',
  when: 'Open "/lecturer/guiding-evaluation" directly on the Lecturer portal and call GET /report/supervisor-list and POST /report/progress-report',
  then: 'The UI blocks access with message "Tài khoản của bạn không có quyền truy cập cổng cán bộ."; GET /report/supervisor-list and POST /report/progress-report return HTTP 403 with code = 2001 and message "Bạn không có quyền truy cập (access denied)", and 0 thesis_progress_report records are created in the database',
});

const SEC045 = defineItcSec({
  id: 'TC-SEC-045',
  feature: 'report',
  module: 'NopPhieuTheoDoi',
  sheet: 'NopPhieuTheoDoi',
  scenario: 'A supervisor session with a logged-out token accesses the Guiding Evaluation screen and calls progress report APIs',
  roleSession: 'Supervisor (SUPERVISOR), logged-out token',
  technique: 'STATE_TRANSITION',
  given: 'The supervisor has logged out via POST /log-out so the token is invalidated, while the browser still sends the old access_token cookie',
  when: 'Open "/lecturer/guiding-evaluation" and call GET /report/supervisor-list and POST /report/progress-report with the logged-out token',
  then: 'GET /my-info, GET /report/supervisor-list, and POST /report/progress-report return HTTP 401 with code = 2000; the UI redirects to "/login", displays no data, and 0 thesis_progress_report records are created in the database',
});

const SEC046 = defineItcSec({
  id: 'TC-SEC-046',
  feature: 'report',
  module: 'NopPhieuTheoDoi',
  sheet: 'NopPhieuTheoDoi',
  scenario: 'A co-supervisor attempts to submit a progress report via direct API despite read-only UI',
  roleSession: 'Co-Supervisor (SUPERVISOR), logged in as co-lecturer',
  technique: 'DECISION_TABLE',
  given: 'Supervisor "GV999902" is assigned as the co-supervisor (not the main supervisor) of student "9990000901"\'s thesis topic at STAGE_3_OUTLINE_APPROVED',
  when: 'Open "/lecturer/guiding-evaluation" as Co-Supervisor "GV999902" and invoke POST /report/progress-report directly with a valid PDF file',
  then: 'The UI displays badge "Đồng hướng dẫn (Chỉ xem)" and "Chưa có phiếu theo dõi" with no "Nộp phiếu" button; POST /report/progress-report returns HTTP 403 with code = 2001 and message "Giảng viên đồng hướng dẫn chỉ có quyền xem, không có quyền nộp phiếu theo dõi tiến độ", and 0 thesis_progress_report records are created in the database',
});

const SEC047 = defineItcSec({
  id: 'TC-SEC-047',
  feature: 'report',
  module: 'NopPhieuTheoDoi',
  sheet: 'NopPhieuTheoDoi',
  scenario: 'An unrelated supervisor attempts to submit a progress report for another supervisor\'s student (IDOR)',
  roleSession: 'Supervisor (SUPERVISOR), logged in as unrelated supervisor',
  technique: 'ERROR_GUESSING',
  given: 'Supervisor "GV999903" holds the SUPERVISOR role while student "9990000901" is supervised by "GV999901" at STAGE_3_OUTLINE_APPROVED',
  when: 'Open "/lecturer/guiding-evaluation" as Supervisor "GV999903" and invoke POST /report/progress-report targeting student "9990000901"\'s topicPublicId',
  then: 'Student "9990000901" is not displayed in Supervisor "GV999903"\'s table; POST /report/progress-report returns HTTP 403 with code = 2001 and message "Bạn không phải giảng viên hướng dẫn chính của đề tài này", and 0 thesis_progress_report records are created in the database',
});

// ============================================================================
// TẠO FILE MẪU HỢP LỆ (PDF / DOCX / PDF ĐẠO VĂN TIẾNG VIỆT UNICODE)
// ============================================================================

const OFFICIAL_TITLE_DEFAULT = 'Hệ thống quản lý tiến độ đồ án tốt nghiệp thông minh';
const VALID_PDF_FILENAME_1 = '64HTTT99_9990000901_TranDucAnh.pdf';
const VALID_DOCX_FILENAME_1 = '64HTTT99_9990000901_TranDucAnh.docx';
const VALID_PDF_FILENAME_2 = '64HTTT99_9990000902_NguyenThiNgoc.pdf';
const VALID_DOCX_FILENAME_2 = '64HTTT99_9990000902_NguyenThiNgoc.docx';
const VALID_PDF_FILENAME_3 = '64HTTT99_9990000903_LeVanTai.pdf';
const PLAGIARISM_PDF_FILENAME_1 = '64HTTT99_9990000901_DaoVan.pdf';
const PLAGIARISM_PDF_FILENAME_3 = '64HTTT99_9990000903_DaoVan.pdf';
const INVALID_EXT_FILENAME = '64HTTT99_9990000901_TranDucAnh.txt';
const INVALID_NAME_FILENAME = 'PhieuTheoDoi.pdf';

function createMinimalValidPdfBuffer(text = 'TLU GPMS Test Progress Report'): Buffer {
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

function createMinimalValidDocxBuffer(text = 'TLU GPMS Test Progress Report DOCX'): Buffer {
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
  teacherCode: 'GV999901',
  firstName: 'Nguyễn Minh',
  lastName: 'Quân',
  fullName: 'Nguyễn Minh Quân',
  email: 'itc.progress.gv.999901@tlu.edu.vn',
  phone: '0989990901',
  academicTitle: 'TS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_CO_SUPERVISOR = {
  teacherCode: 'GV999902',
  firstName: 'Đặng Thị',
  lastName: 'Hương',
  fullName: 'Đặng Thị Hương',
  email: 'itc.progress.gv.999902@tlu.edu.vn',
  phone: '0989990902',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_OTHER_SUPERVISOR = {
  teacherCode: 'GV999903',
  firstName: 'Lê Quốc',
  lastName: 'Dũng',
  fullName: 'Lê Quốc Dũng',
  email: 'itc.progress.gv.999903@tlu.edu.vn',
  phone: '0989990903',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_PLAIN_LECTURER = {
  teacherCode: 'GV999904',
  firstName: 'Phạm Văn',
  lastName: 'Khánh',
  fullName: 'Phạm Văn Khánh',
  email: 'itc.progress.gv.999904@tlu.edu.vn',
  phone: '0989990904',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_REVIEWER = {
  teacherCode: 'GV999905',
  firstName: 'Vũ Thị',
  lastName: 'Thảo',
  fullName: 'Vũ Thị Thảo',
  email: 'itc.progress.gv.999905@tlu.edu.vn',
  phone: '0989990905',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_ARCHIVE_SUPERVISOR = {
  teacherCode: 'GV999999',
  firstName: 'Bùi Lưu',
  lastName: 'Trữ',
  fullName: 'Bùi Lưu Trữ',
  email: 'itc.progress.gv.999999@tlu.edu.vn',
  phone: '0989990999',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_STUDENT_1 = {
  studentCode: '9990000901',
  firstName: 'Trần Đức',
  lastName: 'Anh',
  fullName: 'Trần Đức Anh',
  email: 'itc.progress.sv.9990000901@gmail.com',
  phone: '0989990101',
  batch: 'K64',
  className: '64HTTT99',
};

const TEST_STUDENT_2 = {
  studentCode: '9990000902',
  firstName: 'Nguyễn Thị',
  lastName: 'Ngọc',
  fullName: 'Nguyễn Thị Ngọc',
  email: 'itc.progress.sv.9990000902@gmail.com',
  phone: '0989990102',
  batch: 'K64',
  className: '64HTTT99',
};

const TEST_STUDENT_3 = {
  studentCode: '9990000903',
  firstName: 'Lê Văn',
  lastName: 'Tài',
  fullName: 'Lê Văn Tài',
  email: 'itc.progress.sv.9990000903@gmail.com',
  phone: '0989990103',
  batch: 'K64',
  className: '64HTTT99',
};

const TEST_STUDENT_4 = {
  studentCode: '9990000904',
  firstName: 'Phạm Thu',
  lastName: 'Hà',
  fullName: 'Phạm Thu Hà',
  email: 'itc.progress.sv.9990000904@gmail.com',
  phone: '0989990104',
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

interface ProvisionProgressStudentSpec {
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
  initialFinalReport?: {
    fileName: string;
    review?: {
      decision: 'APPROVED' | 'REQUEST_CHANGES' | 'REJECTED';
      plagiarismRate: number;
      plagiarismFileName: string;
      feedback: string;
    };
  };
}

interface ProvisionedProgressStudentHandle {
  profile: StudentProfile;
  studentPublicId: string;
  studentAccountId: number;
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
let activeHandles: ProvisionedProgressStudentHandle[] = [];
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
  supervisorToken: string,
  reportPublicId: string,
  studentDocName: string,
  plagiarismRate: number,
  plagiarismFileName: string,
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
        name: plagiarismFileName,
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
      email: `itc.arch.progress.${suffix}@gmail.com`,
      phone: `0979${suffix.slice(-6)}`,
      batch: profile.batch,
      className: profile.className,
    },
  });
}

async function provisionStudentsForProgress(
  request: APIRequestContext,
  specs: ProvisionProgressStudentSpec[],
): Promise<ProvisionedProgressStudentHandle[]> {
  await sweepResidualTopicsInIsolatedMajor(request);
  await updateDeadline(request, envState.dlDangKy, 'DANG_KY_GVHD', 'OPEN');

  const handles: ProvisionedProgressStudentHandle[] = [];

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
            feedback: 'Đề cương đạt yêu cầu để nộp phiếu theo dõi tiến độ',
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

    // Nộp sẵn Báo cáo Final (+ thẩm định) nếu cấu hình
    if (spec.initialFinalReport) {
      const subRes = await submitMultipartViaApi(request, 'POST', '/report/submit', h.studentToken, {
        file: {
          name: spec.initialFinalReport.fileName,
          mimeType: 'application/pdf',
          buffer: createMinimalValidPdfBuffer('Student Final Report'),
        },
      });
      if (subRes.status !== 200) {
        throw new Error(`Không thể nộp sẵn báo cáo Final: ${JSON.stringify(subRes.body)}`);
      }
      const myReportRes = await apiCall(request, h.studentToken, 'GET', '/report/my-report');
      h.finalReportPublicId = myReportRes.body?.data?.publicId ?? null;

      if (spec.initialFinalReport.review && h.finalReportPublicId) {
        const rev = spec.initialFinalReport.review;
        if (rev.decision === 'REJECTED') {
          await updateDeadline(request, envState.dlBaoCao, 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI', 'EXTENDED');
        }
        await reviewFinalReportViaApi(
          request,
          envState.mainSupervisorToken,
          h.finalReportPublicId,
          spec.initialFinalReport.fileName,
          rev.plagiarismRate,
          rev.plagiarismFileName,
          rev.decision,
          rev.feedback,
        );
        if (rev.decision === 'REJECTED') {
          await updateDeadline(request, envState.dlBaoCao, 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI', 'OPEN');
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

  const remaining: ProvisionedProgressStudentHandle[] = [];
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
        email: `itc.arch.progress.${suffix}@gmail.com`,
        phone: `0979${suffix.slice(-6)}`,
        batch: h.profile.batch,
        className: h.profile.className,
      },
    });
  }
}

async function openGuidingEvaluationPage(page: Page, context: BrowserContext, token: string) {
  await setAuthCookie(context, token);

  const listPromise = page.waitForResponse(
    (r) => r.url().includes('/report/supervisor-list') && r.request().method() === 'GET',
  );
  await page.goto('/lecturer/guiding-evaluation');
  const listRes = await listPromise;
  return { listRes };
}

test.describe('Report 5.2 - Supervisor Submit Progress Report (NopPhieuTheoDoi)', () => {
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
  // FUNCTION 1: View and Filter Supervised Progress Reports (ITC016..ITC020)
  // ==========================================================================

  test(ITC016.title, { annotation: ITC016.annotation }, async ({ page, context, request }) => {
    await provisionStudentsForProgress(request, [
      {
        profile: TEST_STUDENT_1,
        approveOutline: true,
      },
      {
        profile: TEST_STUDENT_2,
        approveOutline: true,
        progressReport: {
          fileName: VALID_PDF_FILENAME_2,
          supervisorNote: 'Tiến độ ổn định',
        },
      },
      {
        profile: TEST_STUDENT_3,
        approveOutline: true,
        progressReport: {
          fileName: VALID_PDF_FILENAME_3,
          supervisorNote: 'Hoàn thành xuất sắc',
        },
        initialFinalReport: {
          fileName: VALID_PDF_FILENAME_3,
          review: {
            decision: 'APPROVED',
            plagiarismRate: 12.0,
            plagiarismFileName: PLAGIARISM_PDF_FILENAME_3,
            feedback: 'Báo cáo đạt yêu cầu',
          },
        },
      },
      {
        profile: TEST_STUDENT_4,
        approveOutline: false,
      },
    ]);

    const { listRes } = await openGuidingEvaluationPage(page, context, envState.mainSupervisorToken);
    expect(listRes.status()).toBe(200);
    const body = await listRes.json();
    expect(body.code).toBe(1000);
    expect(body.data).toHaveLength(3);
    for (const item of body.data) {
      expect(item.canSubmitProgressReport).toBe(true);
      expect(item.deadlineStatus).toBe('OPEN');
    }
    const codes = body.data.map((i: any) => i.studentCode);
    expect(codes).toContain(TEST_STUDENT_1.studentCode);
    expect(codes).toContain(TEST_STUDENT_2.studentCode);
    expect(codes).toContain(TEST_STUDENT_3.studentCode);
    expect(codes).not.toContain(TEST_STUDENT_4.studentCode);

    await expect(page.getByText('Đang mở')).toBeVisible();
    await expect(page.locator('button[data-status="all"] .tab-badge')).toHaveText('3');
    await expect(page.locator('button[data-status="incomplete"] .tab-badge')).toHaveText('1');
    await expect(page.locator('button[data-status="completed"] .tab-badge')).toHaveText('2');

    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await expect(row1).toBeVisible();
    await expect(row1.getByRole('button', { name: 'Nộp phiếu', exact: true })).toBeEnabled();
    await expect(row1).toContainText('Chưa nộp phiếu theo dõi');

    const row2 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) });
    await expect(row2).toBeVisible();
    await expect(row2).toContainText(VALID_PDF_FILENAME_2);
    await expect(row2.getByRole('button', { name: 'Cập nhật phiếu theo dõi' })).toBeVisible();
    await expect(row2).toContainText('Đã nộp phiếu');

    const row3 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_3.studentCode) });
    await expect(row3).toBeVisible();
    await expect(row3).toContainText(VALID_PDF_FILENAME_3);
    await expect(row3.getByRole('button', { name: 'Cập nhật phiếu theo dõi' })).toHaveCount(0);

    await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_4.studentCode) })).toHaveCount(0);

    const dbTopicRows = await dbSelect<{ current_stage: string; total: number }>(
      `SELECT tt.current_stage, COUNT(*) AS total
         FROM thesis_topic tt
        WHERE tt.semester_id = ? AND tt.lecturer_id = ?
        GROUP BY tt.current_stage`,
      [envState.semesterId, envState.mainSupervisorId],
    );
    const stageMap = Object.fromEntries(dbTopicRows.map((r) => [r.current_stage, Number(r.total)]));
    expect(stageMap.STAGE_3_OUTLINE_APPROVED).toBe(2);
    expect(stageMap.STAGE_4_REPORT_APPROVED).toBe(1);
    expect(stageMap.STAGE_2_TOPIC_CONFIRMED).toBe(1);

    const dbProgRows = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM thesis_progress_report p
         JOIN thesis_topic tt ON tt.id = p.thesis_topic_id
        WHERE tt.semester_id = ? AND tt.lecturer_id = ?`,
      [envState.semesterId, envState.mainSupervisorId],
    );
    expect(Number(dbProgRows[0].total)).toBe(2);
  });

  test(ITC017.title, { annotation: ITC017.annotation }, async ({ page, context, request }) => {
    await provisionStudentsForProgress(request, [
      { profile: TEST_STUDENT_1, approveOutline: true },
      {
        profile: TEST_STUDENT_2,
        approveOutline: true,
        progressReport: {
          fileName: VALID_PDF_FILENAME_2,
          supervisorNote: 'Đủ điều kiện báo cáo',
        },
      },
    ]);

    const { listRes } = await openGuidingEvaluationPage(page, context, envState.mainSupervisorToken);
    expect(listRes.status()).toBe(200);
    const body = await listRes.json();
    expect(body.code).toBe(1000);
    expect(body.data).toHaveLength(2);

    await page.locator('button[data-status="incomplete"]').click();
    await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) })).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) })).toHaveCount(0);

    await page.locator('button[data-status="completed"]').click();
    await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) })).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) })).toHaveCount(0);

    await page.locator('button[data-status="all"]').click();
    const searchInput = page.getByPlaceholder('Tìm sinh viên, mã SV hoặc đề tài...');
    await searchInput.fill(TEST_STUDENT_2.studentCode);
    await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) })).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) })).toHaveCount(0);

    await searchInput.fill('KHONGTONTAI9999');
    await expect(page.getByText('Không tìm thấy sinh viên nào phù hợp')).toBeVisible();
  });

  test(ITC018.title, { annotation: ITC018.annotation }, async ({ page, context, request }) => {
    await provisionStudentsForProgress(request, [
      { profile: TEST_STUDENT_1, assignCoSupervisor: true, approveOutline: true },
      {
        profile: TEST_STUDENT_2,
        assignCoSupervisor: true,
        approveOutline: true,
        progressReport: {
          fileName: VALID_PDF_FILENAME_2,
          supervisorNote: 'GVHD chính đã nộp phiếu',
        },
      },
    ]);

    const { listRes } = await openGuidingEvaluationPage(page, context, envState.coSupervisorToken);
    expect(listRes.status()).toBe(200);
    const body = await listRes.json();
    expect(body.code).toBe(1000);
    expect(body.data).toHaveLength(2);
    for (const item of body.data) {
      expect(item.canSubmitProgressReport).toBe(false);
    }

    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await expect(row1).toBeVisible();
    await expect(row1).toContainText('Đồng hướng dẫn (Chỉ xem)');
    await expect(row1).toContainText(`GVHD chính: ${TEST_MAIN_SUPERVISOR.fullName}`);
    await expect(row1).toContainText('Chưa có phiếu theo dõi');
    await expect(row1.getByRole('button', { name: 'Nộp phiếu', exact: true })).toHaveCount(0);

    const row2 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) });
    await expect(row2).toBeVisible();
    await expect(row2).toContainText('Đồng hướng dẫn (Chỉ xem)');
    await expect(row2).toContainText(VALID_PDF_FILENAME_2);
    await expect(row2.getByRole('button', { name: 'Cập nhật phiếu theo dõi' })).toHaveCount(0);

    const dbRows = await dbSelect<{ co_lecturer_id: number }>(
      `SELECT tt.co_lecturer_id
         FROM thesis_topic tt
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code IN (?, ?) AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, TEST_STUDENT_2.studentCode, envState.semesterId],
    );
    expect(dbRows).toHaveLength(2);
    for (const r of dbRows) {
      expect(Number(r.co_lecturer_id)).toBe(envState.coSupervisorId);
    }
  });

  test(ITC019.title, { annotation: ITC019.annotation }, async ({ page, context, request }) => {
    await provisionStudentsForProgress(request, [{ profile: TEST_STUDENT_1, approveOutline: true }]);

    // 1. Deadline CLOSED
    await updateDeadline(request, envState.dlBaoCao, 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI', 'CLOSED');
    const closedOpen = await openGuidingEvaluationPage(page, context, envState.mainSupervisorToken);
    expect(closedOpen.listRes.status()).toBe(200);
    const closedBody = await closedOpen.listRes.json();
    expect(closedBody.code).toBe(1000);
    expect(closedBody.data[0].deadlineStatus).toBe('CLOSED');

    await expect(page.getByText('(Đã hết hạn)')).toBeVisible();
    const rowClosed = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await expect(rowClosed.getByRole('button', { name: 'Nộp phiếu', exact: true })).toBeDisabled();
    await expect(rowClosed).toContainText('Đã hết hạn nộp phiếu theo dõi');

    // 2. Deadline NOT_STARTED
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
    await expect(rowNotStarted.getByRole('button', { name: 'Nộp phiếu', exact: true })).toBeDisabled();
    await expect(rowNotStarted).toContainText('Chưa tới thời gian mở');
  });

  test(ITC020.title, { annotation: ITC020.annotation }, async ({ page, context, request }) => {
    await provisionStudentsForProgress(request, [
      {
        profile: TEST_STUDENT_1,
        approveOutline: true,
        progressReport: {
          fileName: VALID_PDF_FILENAME_1,
          supervisorNote: 'Phiếu trước khi đình chỉ',
        },
        initialFinalReport: {
          fileName: VALID_PDF_FILENAME_1,
          review: {
            decision: 'REJECTED',
            plagiarismRate: 28.5,
            plagiarismFileName: PLAGIARISM_PDF_FILENAME_1,
            feedback: 'Báo cáo chưa đạt yêu cầu học thuật trong đợt gia hạn chấm',
          },
        },
      },
    ]);

    const { listRes } = await openGuidingEvaluationPage(page, context, envState.mainSupervisorToken);
    expect(listRes.status()).toBe(200);
    const body = await listRes.json();
    expect(body.code).toBe(1000);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].topicStatus).toBe('DISQUALIFIED');
    expect(body.data[0].progressReport).not.toBeNull();

    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await expect(row1).toContainText('Đình chỉ');
    await expect(row1.getByRole('button', { name: 'Cập nhật phiếu theo dõi' })).toHaveCount(0);

    await row1.getByRole('button', { name: new RegExp(VALID_PDF_FILENAME_1) }).click();
    await expect(page.getByText('Đề tài không ở trạng thái đang thực hiện')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cập nhật phiếu theo dõi' })).toHaveCount(0);

    const dbRows = await dbSelect<{ status: string }>(
      `SELECT tt.status
         FROM thesis_topic tt
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(dbRows[0].status).toBe('DISQUALIFIED');
  });

  // ==========================================================================
  // FUNCTION 2: Preview Progress Report and Student Report Detail (ITC021..ITC022)
  // ==========================================================================

  test(ITC021.title, { annotation: ITC021.annotation }, async ({ page, context, request }) => {
    const expectedNote = 'Sinh viên bám sát kế hoạch hàng tuần, hoàn thành tốt các mốc.';
    const [h1] = await provisionStudentsForProgress(request, [
      {
        profile: TEST_STUDENT_1,
        approveOutline: true,
        progressReport: {
          fileName: VALID_PDF_FILENAME_1,
          supervisorNote: expectedNote,
        },
        initialFinalReport: {
          fileName: VALID_PDF_FILENAME_1,
        },
      },
    ]);

    await openGuidingEvaluationPage(page, context, envState.mainSupervisorToken);
    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });

    const detailPromise = page.waitForResponse(
      (r) => r.url().includes(`/report/${h1.finalReportPublicId}`) && r.request().method() === 'GET',
    );
    await row1.getByRole('button', { name: new RegExp(VALID_PDF_FILENAME_1) }).click();
    const detailRes = await detailPromise;

    expect(detailRes.status()).toBe(200);
    const detailBody = await detailRes.json();
    expect(detailBody.code).toBe(1000);
    expect(detailBody.data.progressReport.supervisorName).toBe(TEST_MAIN_SUPERVISOR.fullName);
    expect(detailBody.data.progressReport.supervisorNote).toBe(expectedNote);
    expect(detailBody.data.progressReport.progressFile).toContain(VALID_PDF_FILENAME_1);

    await expect(page.getByText('Đã nộp phiếu theo dõi tiến độ')).toBeVisible();
    await expect(page.getByText(`${TEST_STUDENT_1.fullName} (${TEST_STUDENT_1.studentCode})`).first()).toBeVisible();
    await expect(page.getByText(TEST_MAIN_SUPERVISOR.fullName).first()).toBeVisible();
    await expect(page.getByText(expectedNote, { exact: true })).toBeVisible();
    await expect(page.locator('iframe')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cập nhật phiếu theo dõi' }).first()).toBeEnabled();

    const dbRows = await dbSelect<{ progress_file: string; supervisor_note: string | null }>(
      `SELECT p.progress_file, p.supervisor_note
         FROM thesis_progress_report p
         JOIN thesis_topic tt ON tt.id = p.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(dbRows).toHaveLength(1);
    expect(dbRows[0].progress_file).toContain(VALID_PDF_FILENAME_1);
    expect(dbRows[0].supervisor_note).toBe(expectedNote);
  });

  test(ITC022.title, { annotation: ITC022.annotation }, async ({ page, context, request }) => {
    await provisionStudentsForProgress(request, [
      {
        profile: TEST_STUDENT_2,
        approveOutline: true,
        progressReport: {
          fileName: VALID_DOCX_FILENAME_2,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          buffer: createMinimalValidDocxBuffer('DOCX Progress Form'),
        },
      },
    ]);

    const { listRes } = await openGuidingEvaluationPage(page, context, envState.mainSupervisorToken);
    expect(listRes.status()).toBe(200);
    const listBody = await listRes.json();
    expect(listBody.code).toBe(1000);
    expect(listBody.data[0].progressReport.supervisorNote).toBeNull();

    const row2 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_2.studentCode) });
    await row2.getByRole('button', { name: 'Xem trước phiếu theo dõi' }).click();

    await expect(page.getByText('Đã nộp phiếu theo dõi tiến độ')).toBeVisible();
    await expect(page.getByText('Không có ghi chú')).toBeVisible();
    await expect(page.getByText('Sinh viên chưa nộp báo cáo Final').last()).toBeVisible();
    await expect(
      page.getByText(
        'Trình duyệt không hỗ trợ xem trực tiếp định dạng DOCX. Vui lòng tải xuống hoặc mở trong tab mới.',
      ),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tải xuống tệp' })).toBeVisible();

    const dbRows = await dbSelect<{ progress_file: string; supervisor_note: string | null }>(
      `SELECT p.progress_file, p.supervisor_note
         FROM thesis_progress_report p
         JOIN thesis_topic tt ON tt.id = p.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_2.studentCode, envState.semesterId],
    );
    expect(dbRows).toHaveLength(1);
    expect(dbRows[0].progress_file).toContain(VALID_DOCX_FILENAME_2);
    expect(dbRows[0].supervisor_note).toBeNull();
  });

  // ==========================================================================
  // FUNCTION 3: Submit and Update Progress Report (ITC023..ITC031)
  // ==========================================================================

  test(ITC023.title, { annotation: ITC023.annotation }, async ({ page, context, request }) => {
    const [h1] = await provisionStudentsForProgress(request, [
      { profile: TEST_STUDENT_1, approveOutline: true },
    ]);

    const notifBefore = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM notification
        WHERE account_id = ? AND content = ?`,
      [h1.studentAccountId, 'GVHD đã nộp phiếu theo dõi tiến độ.'],
    );

    await openGuidingEvaluationPage(page, context, envState.mainSupervisorToken);
    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await row1.getByRole('button', { name: 'Nộp phiếu', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Nộp phiếu theo dõi tiến độ' })).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles({
      name: VALID_PDF_FILENAME_1,
      mimeType: 'application/pdf',
      buffer: createMinimalValidPdfBuffer('Progress Form Submission 1'),
    });
    const rawNote = '  Sinh viên hoàn thành tốt tiến độ 12 tuần thực hiện đồ án.  ';
    const trimmedNote = 'Sinh viên hoàn thành tốt tiến độ 12 tuần thực hiện đồ án.';
    await page
      .getByPlaceholder('VD: Sinh viên hoàn thành đúng tiến độ các tuần, đủ điều kiện xét duyệt...')
      .fill(rawNote);

    const submitPromise = page.waitForResponse(
      (r) => r.url().includes('/report/progress-report') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Xác nhận nộp file' }).click();
    const submitRes = await submitPromise;

    expect(submitRes.status()).toBe(200);
    const submitBody = await submitRes.json();
    expect(submitBody.code).toBe(1000);
    expect(submitBody.message).toBe('Nộp phiếu theo dõi tiến độ thành công');

    await expect(
      page.getByText(`Đã nộp phiếu theo dõi tiến độ cho sinh viên ${TEST_STUDENT_1.fullName}`),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nộp phiếu theo dõi tiến độ' })).toHaveCount(0);

    await expect(row1).toContainText('Đã nộp phiếu');
    await expect(row1).toContainText(VALID_PDF_FILENAME_1);
    await expect(row1).toContainText(`Ghi chú: ${trimmedNote}`);
    await expect(row1.getByRole('button', { name: 'Cập nhật phiếu theo dõi' })).toBeVisible();
    await expect(page.locator('button[data-status="incomplete"] .tab-badge')).toHaveText('0');
    await expect(page.locator('button[data-status="completed"] .tab-badge')).toHaveText('1');

    const dbRows = await dbSelect<{
      supervisor_id: number;
      progress_file: string;
      supervisor_note: string | null;
      submitted_at: Date | string | null;
    }>(
      `SELECT p.supervisor_id, p.progress_file, p.supervisor_note, p.submitted_at
         FROM thesis_progress_report p
         JOIN thesis_topic tt ON tt.id = p.thesis_topic_id
         JOIN student s ON s.id = tt.student_id
        WHERE s.student_code = ? AND tt.semester_id = ?`,
      [TEST_STUDENT_1.studentCode, envState.semesterId],
    );
    expect(dbRows).toHaveLength(1);
    expect(Number(dbRows[0].supervisor_id)).toBe(envState.mainSupervisorId);
    expect(dbRows[0].progress_file).toContain(VALID_PDF_FILENAME_1);
    expect(dbRows[0].supervisor_note).toBe(trimmedNote);
    expect(dbRows[0].submitted_at).not.toBeNull();

    const notifAfter = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM notification
        WHERE account_id = ? AND content = ?`,
      [h1.studentAccountId, 'GVHD đã nộp phiếu theo dõi tiến độ.'],
    );
    expect(Number(notifAfter[0].total)).toBe(Number(notifBefore[0].total) + 1);
  });

  test(ITC024.title, { annotation: ITC024.annotation }, async ({ page, context, request }) => {
    const initialNote = 'Nhận xét ban đầu trước khi cập nhật.';
    const updatedNote = 'Đã cập nhật phiếu theo dõi tiến độ bản cuối.';

    const [h1] = await provisionStudentsForProgress(request, [
      {
        profile: TEST_STUDENT_1,
        approveOutline: true,
        progressReport: {
          fileName: VALID_PDF_FILENAME_1,
          supervisorNote: initialNote,
        },
      },
    ]);

    const beforeRows = await dbSelect<{ id: number }>(
      `SELECT p.id
         FROM thesis_progress_report p
        WHERE p.thesis_topic_id = ?`,
      [h1.topicId],
    );
    expect(beforeRows).toHaveLength(1);
    const originalRecordId = Number(beforeRows[0].id);

    const notifBefore = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM notification
        WHERE account_id = ? AND content = ?`,
      [h1.studentAccountId, 'GVHD đã nộp phiếu theo dõi tiến độ.'],
    );

    await openGuidingEvaluationPage(page, context, envState.mainSupervisorToken);
    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await row1.getByRole('button', { name: 'Cập nhật phiếu theo dõi' }).click();

    await expect(page.getByRole('heading', { name: 'Cập nhật phiếu theo dõi tiến độ' })).toBeVisible();
    await expect(page.getByText('(Nộp file mới sẽ ghi đè file này)')).toBeVisible();
    const noteBox = page.getByPlaceholder(
      'VD: Sinh viên hoàn thành đúng tiến độ các tuần, đủ điều kiện xét duyệt...',
    );
    await expect(noteBox).toHaveValue(initialNote);

    await page.locator('input[type="file"]').setInputFiles({
      name: VALID_DOCX_FILENAME_1,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: createMinimalValidDocxBuffer('Updated DOCX Progress Form'),
    });
    await noteBox.fill(updatedNote);

    const submitPromise = page.waitForResponse(
      (r) => r.url().includes('/report/progress-report') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Xác nhận cập nhật' }).click();
    const submitRes = await submitPromise;

    expect(submitRes.status()).toBe(200);
    const submitBody = await submitRes.json();
    expect(submitBody.code).toBe(1000);
    expect(submitBody.message).toBe('Nộp phiếu theo dõi tiến độ thành công');

    await expect(
      page.getByText(`Đã cập nhật phiếu theo dõi tiến độ cho sinh viên ${TEST_STUDENT_1.fullName}`),
    ).toBeVisible();
    await expect(row1).toContainText(VALID_DOCX_FILENAME_1);
    await expect(row1).toContainText(`Ghi chú: ${updatedNote}`);

    const afterRows = await dbSelect<{
      id: number;
      progress_file: string;
      supervisor_note: string | null;
    }>(
      `SELECT p.id, p.progress_file, p.supervisor_note
         FROM thesis_progress_report p
        WHERE p.thesis_topic_id = ?`,
      [h1.topicId],
    );
    expect(afterRows).toHaveLength(1);
    expect(Number(afterRows[0].id)).toBe(originalRecordId);
    expect(afterRows[0].progress_file).toContain(VALID_DOCX_FILENAME_1);
    expect(afterRows[0].supervisor_note).toBe(updatedNote);

    const notifAfter = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM notification
        WHERE account_id = ? AND content = ?`,
      [h1.studentAccountId, 'GVHD đã nộp phiếu theo dõi tiến độ.'],
    );
    expect(Number(notifAfter[0].total)).toBe(Number(notifBefore[0].total) + 1);
  });

  test(ITC025.title, { annotation: ITC025.annotation }, async ({ page, context, request }) => {
    const [h1] = await provisionStudentsForProgress(request, [
      { profile: TEST_STUDENT_1, approveOutline: true },
    ]);

    await updateDeadline(request, envState.dlBaoCao, 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI', 'EXTENDED');
    await openGuidingEvaluationPage(page, context, envState.mainSupervisorToken);

    await expect(page.getByText('Gia hạn chấm', { exact: true })).toBeVisible();

    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await row1.getByRole('button', { name: 'Nộp phiếu', exact: true }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: VALID_PDF_FILENAME_1,
      mimeType: 'application/pdf',
      buffer: createMinimalValidPdfBuffer('Extended Period Progress Form'),
    });
    await page
      .getByPlaceholder('VD: Sinh viên hoàn thành đúng tiến độ các tuần, đủ điều kiện xét duyệt...')
      .fill('   ');

    const submitPromise = page.waitForResponse(
      (r) => r.url().includes('/report/progress-report') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Xác nhận nộp file' }).click();
    const submitRes = await submitPromise;

    expect(submitRes.status()).toBe(200);
    const submitBody = await submitRes.json();
    expect(submitBody.code).toBe(1000);
    expect(submitBody.message).toBe('Nộp phiếu theo dõi tiến độ thành công');

    await expect(
      page.getByText(`Đã nộp phiếu theo dõi tiến độ cho sinh viên ${TEST_STUDENT_1.fullName}`),
    ).toBeVisible();
    await expect(row1).toContainText('Đã nộp phiếu');
    await expect(row1).not.toContainText('Ghi chú:');

    const dbRows = await dbSelect<{ progress_file: string; supervisor_note: string | null }>(
      `SELECT p.progress_file, p.supervisor_note
         FROM thesis_progress_report p
        WHERE p.thesis_topic_id = ?`,
      [h1.topicId],
    );
    expect(dbRows).toHaveLength(1);
    expect(dbRows[0].progress_file).toContain(VALID_PDF_FILENAME_1);
    expect(dbRows[0].supervisor_note).toBeNull();
  });

  test(ITC026.title, { annotation: ITC026.annotation }, async ({ page, context, request }) => {
    const [h1] = await provisionStudentsForProgress(request, [
      { profile: TEST_STUDENT_1, approveOutline: true },
    ]);

    await openGuidingEvaluationPage(page, context, envState.mainSupervisorToken);
    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await row1.getByRole('button', { name: 'Nộp phiếu', exact: true }).click();

    let apiCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/report/progress-report') && req.method() === 'POST') {
        apiCalled = true;
      }
    });

    await page.getByRole('button', { name: 'Xác nhận nộp file' }).click();
    await expect(page.getByText('File tải lên không được để trống.')).toBeVisible();

    await page.locator('input[type="file"]').setInputFiles({
      name: INVALID_EXT_FILENAME,
      mimeType: 'text/plain',
      buffer: Buffer.from('Plain text file content', 'utf8'),
    });
    await page.getByRole('button', { name: 'Xác nhận nộp file' }).click();
    await expect(page.getByText('File tải lên chỉ nhận định dạng .doc, .docx hoặc .pdf.')).toBeVisible();
    expect(apiCalled).toBe(false);

    const apiRes = await submitProgressReportViaApi(
      request,
      envState.mainSupervisorToken,
      h1.topicPublicId,
      {
        name: INVALID_EXT_FILENAME,
        mimeType: 'text/plain',
        buffer: Buffer.from('Plain text file content', 'utf8'),
      },
    );
    expect(apiRes.status).toBe(400);
    expect(apiRes.body.code).toBe(4000);
    expect(apiRes.body.message).toBe('File tải lên chỉ nhận định dạng .doc, .docx hoặc .pdf');

    const dbRows = await dbSelect<{ total: number }>(
      'SELECT COUNT(*) AS total FROM thesis_progress_report WHERE thesis_topic_id = ?',
      [h1.topicId],
    );
    expect(Number(dbRows[0].total)).toBe(0);
  });

  test(ITC027.title, { annotation: ITC027.annotation }, async ({ page, context, request }) => {
    const [h1] = await provisionStudentsForProgress(request, [
      { profile: TEST_STUDENT_1, approveOutline: true },
    ]);

    await openGuidingEvaluationPage(page, context, envState.mainSupervisorToken);
    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await row1.getByRole('button', { name: 'Nộp phiếu', exact: true }).click();

    let apiCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/report/progress-report') && req.method() === 'POST') {
        apiCalled = true;
      }
    });

    await page.locator('input[type="file"]').setInputFiles({
      name: INVALID_NAME_FILENAME,
      mimeType: 'application/pdf',
      buffer: createMinimalValidPdfBuffer('Improperly Named Progress Form'),
    });
    await page.getByRole('button', { name: 'Xác nhận nộp file' }).click();

    const expectedMsg =
      'Tên file không đúng định dạng! Vui lòng đổi tên file theo định dạng Tenlop_MaSV_HoVaTen (VD: DHKTPM17A_22110001_NguyenVanAn.pdf)';
    await expect(page.getByText(expectedMsg)).toBeVisible();
    expect(apiCalled).toBe(false);

    const apiRes = await submitProgressReportViaApi(
      request,
      envState.mainSupervisorToken,
      h1.topicPublicId,
      {
        name: INVALID_NAME_FILENAME,
        mimeType: 'application/pdf',
        buffer: createMinimalValidPdfBuffer('Improperly Named Progress Form'),
      },
    );
    expect(apiRes.status).toBe(400);
    expect(apiRes.body.code).toBe(4000);
    expect(apiRes.body.message).toBe(expectedMsg);

    const dbRows = await dbSelect<{ total: number }>(
      'SELECT COUNT(*) AS total FROM thesis_progress_report WHERE thesis_topic_id = ?',
      [h1.topicId],
    );
    expect(Number(dbRows[0].total)).toBe(0);
  });

  test(ITC028.title, { annotation: ITC028.annotation }, async ({ page, context, request }) => {
    const [h1] = await provisionStudentsForProgress(request, [
      { profile: TEST_STUDENT_1, approveOutline: true },
    ]);

    await openGuidingEvaluationPage(page, context, envState.mainSupervisorToken);
    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await row1.getByRole('button', { name: 'Nộp phiếu', exact: true }).click();

    let apiCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/report/progress-report') && req.method() === 'POST') {
        apiCalled = true;
      }
    });

    // 1. File rỗng 0 byte
    await page.locator('input[type="file"]').setInputFiles({
      name: VALID_PDF_FILENAME_1,
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(0),
    });
    await page.getByRole('button', { name: 'Xác nhận nộp file' }).click();
    await expect(page.getByText('File tải lên không được để trống.')).toBeVisible();

    // Bỏ chọn file rỗng rồi chọn file >= 10MB
    await page.getByRole('button', { name: 'Bỏ chọn file' }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: VALID_PDF_FILENAME_1,
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(10 * 1024 * 1024, 0x41),
    });
    await page.getByRole('button', { name: 'Xác nhận nộp file' }).click();
    await expect(page.getByText('File tải lên phải nhỏ hơn 10MB.')).toBeVisible();
    expect(apiCalled).toBe(false);

    const dbRows = await dbSelect<{ total: number }>(
      'SELECT COUNT(*) AS total FROM thesis_progress_report WHERE thesis_topic_id = ?',
      [h1.topicId],
    );
    expect(Number(dbRows[0].total)).toBe(0);
  });

  test(ITC029.title, { annotation: ITC029.annotation }, async ({ page, context, request }) => {
    const [h1] = await provisionStudentsForProgress(request, [
      { profile: TEST_STUDENT_1, approveOutline: true },
    ]);

    await openGuidingEvaluationPage(page, context, envState.mainSupervisorToken);
    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await row1.getByRole('button', { name: 'Nộp phiếu', exact: true }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: VALID_PDF_FILENAME_1,
      mimeType: 'application/pdf',
      buffer: createMinimalValidPdfBuffer('Late Progress Form'),
    });

    // Đóng hạn đồng thời trước khi bấm xác nhận
    await updateDeadline(request, envState.dlBaoCao, 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI', 'CLOSED');

    const submitPromise = page.waitForResponse(
      (r) => r.url().includes('/report/progress-report') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Xác nhận nộp file' }).click();
    const submitRes = await submitPromise;

    expect(submitRes.status()).toBe(403);
    const submitBody = await submitRes.json();
    expect(submitBody.code).toBe(3096);
    expect(submitBody.message).toBe('Thời hạn nộp phiếu theo dõi tiến độ chưa mở hoặc đã kết thúc');

    await expect(page.getByRole('heading', { name: 'Nộp phiếu theo dõi tiến độ' })).toBeVisible();
    await expect(
      page.getByRole('alert').filter({ hasText: 'Thời hạn nộp phiếu theo dõi tiến độ chưa mở hoặc đã kết thúc' }),
    ).toBeVisible();

    const dbRows = await dbSelect<{ total: number }>(
      'SELECT COUNT(*) AS total FROM thesis_progress_report WHERE thesis_topic_id = ?',
      [h1.topicId],
    );
    expect(Number(dbRows[0].total)).toBe(0);
  });

  test(ITC030.title, { annotation: ITC030.annotation }, async ({ page, context, request }) => {
    const originalNote = 'Phiếu ban đầu trước khi duyệt báo cáo Final';
    const [h1] = await provisionStudentsForProgress(request, [
      {
        profile: TEST_STUDENT_1,
        approveOutline: true,
        progressReport: {
          fileName: VALID_PDF_FILENAME_1,
          supervisorNote: originalNote,
        },
        initialFinalReport: {
          fileName: VALID_PDF_FILENAME_1,
        },
      },
    ]);

    await openGuidingEvaluationPage(page, context, envState.mainSupervisorToken);
    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await row1.getByRole('button', { name: 'Cập nhật phiếu theo dõi' }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: VALID_DOCX_FILENAME_1,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: createMinimalValidDocxBuffer('Concurrent Update After Stage 4'),
    });

    // Duyệt báo cáo Final đồng thời -> đề tài chuyển STAGE_4_REPORT_APPROVED
    await reviewFinalReportViaApi(
      request,
      envState.mainSupervisorToken,
      h1.finalReportPublicId!,
      VALID_PDF_FILENAME_1,
      14.5,
      PLAGIARISM_PDF_FILENAME_1,
      'APPROVED',
      'Đã duyệt đạt đồng thời',
    );

    const submitPromise = page.waitForResponse(
      (r) => r.url().includes('/report/progress-report') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Xác nhận cập nhật' }).click();
    const submitRes = await submitPromise;

    expect(submitRes.status()).toBe(409);
    const submitBody = await submitRes.json();
    expect(submitBody.code).toBe(3090);
    expect(submitBody.message).toBe('Đề tài chưa được duyệt đề cương hoặc không ở giai đoạn làm báo cáo');

    await expect(page.getByRole('heading', { name: 'Cập nhật phiếu theo dõi tiến độ' })).toBeVisible();
    await expect(
      page
        .getByRole('alert')
        .filter({ hasText: 'Đề tài chưa được duyệt đề cương hoặc không ở giai đoạn làm báo cáo' }),
    ).toBeVisible();

    const dbRows = await dbSelect<{
      progress_file: string;
      supervisor_note: string | null;
      current_stage: string;
    }>(
      `SELECT p.progress_file, p.supervisor_note, tt.current_stage
         FROM thesis_progress_report p
         JOIN thesis_topic tt ON tt.id = p.thesis_topic_id
        WHERE tt.id = ?`,
      [h1.topicId],
    );
    expect(dbRows).toHaveLength(1);
    expect(dbRows[0].progress_file).toContain(VALID_PDF_FILENAME_1);
    expect(dbRows[0].supervisor_note).toBe(originalNote);
    expect(dbRows[0].current_stage).toBe('STAGE_4_REPORT_APPROVED');
  });

  test(ITC031.title, { annotation: ITC031.annotation }, async ({ page, context, request }) => {
    const originalNote = 'Phiếu ban đầu trước khi đình chỉ đề tài';
    const [h1] = await provisionStudentsForProgress(request, [
      {
        profile: TEST_STUDENT_1,
        approveOutline: true,
        progressReport: {
          fileName: VALID_PDF_FILENAME_1,
          supervisorNote: originalNote,
        },
        initialFinalReport: {
          fileName: VALID_PDF_FILENAME_1,
        },
      },
    ]);

    await openGuidingEvaluationPage(page, context, envState.mainSupervisorToken);
    const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
    await row1.getByRole('button', { name: 'Cập nhật phiếu theo dõi' }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: VALID_DOCX_FILENAME_1,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: createMinimalValidDocxBuffer('Concurrent Update After Disqualified'),
    });

    // Chuyển EXTENDED và đánh Không đạt đồng thời -> đề tài bị DISQUALIFIED
    await updateDeadline(request, envState.dlBaoCao, 'NOP_BAO_CAO_VA_PHIEU_THEO_DOI', 'EXTENDED');
    await reviewFinalReportViaApi(
      request,
      envState.mainSupervisorToken,
      h1.finalReportPublicId!,
      VALID_PDF_FILENAME_1,
      28.5,
      PLAGIARISM_PDF_FILENAME_1,
      'REJECTED',
      'Không đạt đồng thời dẫn đến đình chỉ',
    );

    const submitPromise = page.waitForResponse(
      (r) => r.url().includes('/report/progress-report') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Xác nhận cập nhật' }).click();
    const submitRes = await submitPromise;

    expect(submitRes.status()).toBe(409);
    const submitBody = await submitRes.json();
    expect(submitBody.code).toBe(3057);
    expect(submitBody.message).toBe('Đề tài không ở trạng thái đang thực hiện');

    await expect(page.getByRole('heading', { name: 'Cập nhật phiếu theo dõi tiến độ' })).toBeVisible();
    await expect(
      page.getByRole('alert').filter({ hasText: 'Đề tài không ở trạng thái đang thực hiện' }),
    ).toBeVisible();

    const dbRows = await dbSelect<{
      progress_file: string;
      supervisor_note: string | null;
      status: string;
    }>(
      `SELECT p.progress_file, p.supervisor_note, tt.status
         FROM thesis_progress_report p
         JOIN thesis_topic tt ON tt.id = p.thesis_topic_id
        WHERE tt.id = ?`,
      [h1.topicId],
    );
    expect(dbRows).toHaveLength(1);
    expect(dbRows[0].progress_file).toContain(VALID_PDF_FILENAME_1);
    expect(dbRows[0].supervisor_note).toBe(originalNote);
    expect(dbRows[0].status).toBe('DISQUALIFIED');
  });

  // ==========================================================================
  // SECURITY TEST CASES (TC-SEC-042 .. TC-SEC-047)
  // ==========================================================================

  test.describe('SecurityTest', () => {
    test(SEC042.title, { annotation: SEC042.annotation }, async ({ page, context, request }) => {
      const [h1] = await provisionStudentsForProgress(request, [
        { profile: TEST_STUDENT_1, approveOutline: true },
      ]);

      await context.clearCookies();
      const myInfoPromise = page.waitForResponse(
        (r) => r.url().includes('/my-info') && r.request().method() === 'GET',
      );
      await page.goto('/lecturer/guiding-evaluation');
      const myInfoRes = await myInfoPromise;

      expect(myInfoRes.status()).toBe(401);
      expect((await myInfoRes.json()).code).toBe(2000);
      await expect(page).toHaveURL(/\/login/);

      const listRes = await request.get(
        `${getApiBaseUrl()}/report/supervisor-list?semesterId=${envState.semesterPublicId}`,
      );
      expect(listRes.status()).toBe(401);
      expect((await listRes.json()).code).toBe(2000);

      const postRes = await submitProgressReportViaApi(
        request,
        null,
        h1.topicPublicId,
        {
          name: VALID_PDF_FILENAME_1,
          mimeType: 'application/pdf',
          buffer: createMinimalValidPdfBuffer('Anonymous Upload'),
        },
        'Ghi chú ẩn danh',
      );
      expect(postRes.status).toBe(401);
      expect(postRes.body.code).toBe(2000);
    });

    test(SEC043.title, { annotation: SEC043.annotation }, async ({ page, context, request }) => {
      const [h1] = await provisionStudentsForProgress(request, [
        { profile: TEST_STUDENT_1, approveOutline: true },
      ]);

      await setAuthCookie(context, h1.studentToken);
      await page.goto('/lecturer/guiding-evaluation');
      await expect(
        page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.'),
      ).toBeVisible();

      const listRes = await apiCall(request, h1.studentToken, 'GET', '/report/supervisor-list', {
        params: { semesterId: envState.semesterPublicId },
      });
      expect(listRes.status).toBe(403);
      expect(listRes.body.code).toBe(2001);

      const postRes = await submitProgressReportViaApi(
        request,
        h1.studentToken,
        h1.topicPublicId,
        {
          name: VALID_PDF_FILENAME_1,
          mimeType: 'application/pdf',
          buffer: createMinimalValidPdfBuffer('Student Unauthorized Upload'),
        },
        'Sinh viên tự nộp trái phép',
      );
      expect(postRes.status).toBe(403);
      expect(postRes.body.code).toBe(2001);
      expect(postRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');

      const dbRows = await dbSelect<{ total: number }>(
        'SELECT COUNT(*) AS total FROM thesis_progress_report WHERE thesis_topic_id = ?',
        [h1.topicId],
      );
      expect(Number(dbRows[0].total)).toBe(0);
    });

    test(SEC044.title, { annotation: SEC044.annotation }, async ({ page, context, request }) => {
      const [h1] = await provisionStudentsForProgress(request, [
        { profile: TEST_STUDENT_1, approveOutline: true },
      ]);

      await setAuthCookie(context, envState.plainLecturerToken);
      await page.goto('/lecturer/guiding-evaluation');
      await expect(
        page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.'),
      ).toBeVisible();

      const listRes = await apiCall(request, envState.plainLecturerToken, 'GET', '/report/supervisor-list', {
        params: { semesterId: envState.semesterPublicId },
      });
      expect(listRes.status).toBe(403);
      expect(listRes.body.code).toBe(2001);
      expect(listRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');

      const postRes = await submitProgressReportViaApi(
        request,
        envState.plainLecturerToken,
        h1.topicPublicId,
        {
          name: VALID_PDF_FILENAME_1,
          mimeType: 'application/pdf',
          buffer: createMinimalValidPdfBuffer('Plain Lecturer Unauthorized Upload'),
        },
        'Giảng viên thường nộp trái phép',
      );
      expect(postRes.status).toBe(403);
      expect(postRes.body.code).toBe(2001);
      expect(postRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');

      const dbRows = await dbSelect<{ total: number }>(
        'SELECT COUNT(*) AS total FROM thesis_progress_report WHERE thesis_topic_id = ?',
        [h1.topicId],
      );
      expect(Number(dbRows[0].total)).toBe(0);
    });

    test(SEC045.title, { annotation: SEC045.annotation }, async ({ page, context, request }) => {
      const [h1] = await provisionStudentsForProgress(request, [
        { profile: TEST_STUDENT_1, approveOutline: true },
      ]);

      const freshToken = await loginByEmail(request, TEST_MAIN_SUPERVISOR.email);
      const logoutRes = await apiCall(request, freshToken, 'POST', '/log-out');
      expect(logoutRes.status).toBe(200);

      await setAuthCookie(context, freshToken);
      const myInfoPromise = page.waitForResponse(
        (r) => r.url().includes('/my-info') && r.request().method() === 'GET',
      );
      await page.goto('/lecturer/guiding-evaluation');
      const myInfoRes = await myInfoPromise;

      expect(myInfoRes.status()).toBe(401);
      expect((await myInfoRes.json()).code).toBe(2000);
      await expect(page).toHaveURL(/\/login/);

      const listRes = await apiCall(request, freshToken, 'GET', '/report/supervisor-list', {
        params: { semesterId: envState.semesterPublicId },
      });
      expect(listRes.status).toBe(401);
      expect(listRes.body.code).toBe(2000);

      const postRes = await submitProgressReportViaApi(
        request,
        freshToken,
        h1.topicPublicId,
        {
          name: VALID_PDF_FILENAME_1,
          mimeType: 'application/pdf',
          buffer: createMinimalValidPdfBuffer('Logged Out Token Upload'),
        },
        'Nộp với token đã đăng xuất',
      );
      expect(postRes.status).toBe(401);
      expect(postRes.body.code).toBe(2000);

      const dbRows = await dbSelect<{ total: number }>(
        'SELECT COUNT(*) AS total FROM thesis_progress_report WHERE thesis_topic_id = ?',
        [h1.topicId],
      );
      expect(Number(dbRows[0].total)).toBe(0);
    });

    test(SEC046.title, { annotation: SEC046.annotation }, async ({ page, context, request }) => {
      const [h1] = await provisionStudentsForProgress(request, [
        { profile: TEST_STUDENT_1, assignCoSupervisor: true, approveOutline: true },
      ]);

      await openGuidingEvaluationPage(page, context, envState.coSupervisorToken);
      const row1 = page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) });
      await expect(row1).toBeVisible();
      await expect(row1).toContainText('Đồng hướng dẫn (Chỉ xem)');
      await expect(row1).toContainText('Chưa có phiếu theo dõi');
      await expect(row1.getByRole('button', { name: 'Nộp phiếu', exact: true })).toHaveCount(0);

      const postRes = await submitProgressReportViaApi(
        request,
        envState.coSupervisorToken,
        h1.topicPublicId,
        {
          name: VALID_PDF_FILENAME_1,
          mimeType: 'application/pdf',
          buffer: createMinimalValidPdfBuffer('Co-Supervisor Unauthorized Upload'),
        },
        'Đồng hướng dẫn nộp trái phép',
      );
      expect(postRes.status).toBe(403);
      expect(postRes.body.code).toBe(2001);
      expect(postRes.body.message).toBe(
        'Giảng viên đồng hướng dẫn chỉ có quyền xem, không có quyền nộp phiếu theo dõi tiến độ',
      );

      const dbRows = await dbSelect<{ total: number }>(
        'SELECT COUNT(*) AS total FROM thesis_progress_report WHERE thesis_topic_id = ?',
        [h1.topicId],
      );
      expect(Number(dbRows[0].total)).toBe(0);
    });

    test(SEC047.title, { annotation: SEC047.annotation }, async ({ page, context, request }) => {
      const [h1] = await provisionStudentsForProgress(request, [
        { profile: TEST_STUDENT_1, approveOutline: true },
      ]);

      await openGuidingEvaluationPage(page, context, envState.otherSupervisorToken);
      await expect(page.getByRole('row', { name: new RegExp(TEST_STUDENT_1.studentCode) })).toHaveCount(0);

      const postRes = await submitProgressReportViaApi(
        request,
        envState.otherSupervisorToken,
        h1.topicPublicId,
        {
          name: VALID_PDF_FILENAME_1,
          mimeType: 'application/pdf',
          buffer: createMinimalValidPdfBuffer('Other Supervisor IDOR Upload'),
        },
        'GVHD khác nộp trái phép',
      );
      expect(postRes.status).toBe(403);
      expect(postRes.body.code).toBe(2001);
      expect(postRes.body.message).toBe('Bạn không phải giảng viên hướng dẫn chính của đề tài này');

      const dbRows = await dbSelect<{ total: number }>(
        'SELECT COUNT(*) AS total FROM thesis_progress_report WHERE thesis_topic_id = ?',
        [h1.topicId],
      );
      expect(Number(dbRows[0].total)).toBe(0);
    });
  });
});
