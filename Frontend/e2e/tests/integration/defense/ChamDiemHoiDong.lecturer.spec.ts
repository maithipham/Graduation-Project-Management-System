import { test, expect, type APIRequestContext, type Page, type Response } from '@playwright/test';
import { defineItc, defineItcSec } from '../../../support/integration-test-case';
import { apiCall, getApiBaseUrl, loginByEmail } from '../../../support/api';
import { dbSelect } from '../../../support/db';

// ============================================================================
// ĐẶC TẢ TEST CASE (ITC341..ITC357 & TC-SEC-113..TC-SEC-117)
// Feature: defense | Module/Sheet: ChamDiemHoiDong
// Vai trò: Chủ tịch, Thư ký, Ủy viên của "HD KTPM 01"
// Màn hình: "/lecturer/defense/councils/{hội đồng}?tab=grading" (Chấm điểm) và "?tab=summary" (Tổng hợp).
//
// - Không có API xóa phiếu chấm: lưu nháp / gửi điểm thành công để lại phiếu và không dọn được. Vì vậy Playwright chỉ chạy
//   case xem và case giao diện chặn trước khi gửi; DB (SELECT) được đối chiếu trước/sau mỗi test.
//   Luồng ghi điểm thành công của 3 vai trò chạy ở MockMvc (ChamDiemHoiDongIntegrationTest, tự rollback).
// - Chủ tịch / Ủy viên: E2E_EMAIL_CHAIRPERSON, E2E_EMAIL_COUNCIL_MEMBER hiện là giảng viên ngoài hội đồng (các bộ khác
//   đang dùng làm người ngoài), nên bộ này đọc 2 biến riêng E2E_EMAIL_HD_CHAIRPERSON, E2E_EMAIL_HD_MEMBER.
//   Chưa có thì case báo lỗi rõ "chưa cấu hình", không tự bỏ qua.
// ============================================================================

const FEATURE = 'defense';
const MODULE = 'ChamDiemHoiDong';
const SHEET = 'ChamDiemHoiDong';

const FN_BOARD = 'View Council Grading List';
const FN_SHEET = 'View Council Grading Sheet';
const FN_DRAFT = 'Save Draft Council Grading Sheet';
const FN_SUBMIT = 'Submit Council Grading Sheet';
const FN_SUMMARY = 'View Council Score Summary';
const FN_EXPORT = 'Export Council Grading Sheet';

const COUNCIL = 'HD KTPM 01';
const COUNCIL_CODE = 'KTPM202601';
const NEW_CODE = '99B14003';
const NEW_NAME = 'SV3 Test Mới';
const DONE_CODE = '99B14001';
const DONE_NAME = 'SV1 Test Đạt';
const FAIL_CODE = '99B14002';
const NOT_REVIEWED_CODE = '2251190001';
const COMMENT = 'ITC Đồ án đạt yêu cầu, cần bổ sung phần kiểm thử';

const PRE_COUNCIL =
  '1. "HD KTPM 01" is published, with Chairperson "Lê Hoàng Nam", Secretary "Nguyễn Kỹ thuật phần mềm" and members "Lê Văn Khoa", "Hoàng Thị Yến", "Lý Thị Thanh Thảo".\n' +
  '2. The semester has a council rubric with 12 criteria, total weight 100%.\n';
const PRE_BOARD = PRE_COUNCIL +
  '3. Students "SV1 Test Đạt" (99B14001) and "SV2 Test Trượt" (99B14002) have completed the defense and were graded by all 5 members; student "SV3 Test Mới" (99B14003) passed the review, is scheduled, and has no council grading sheet; student 2251190001 has not passed the review.';
const PRE_NEW = PRE_COUNCIL +
  '3. The period for organizing the defense council is open.\n' +
  '4. Student "SV3 Test Mới" (99B14003) passed the review, is scheduled, has no council grading sheet, and both examiners gave 7.5.';
const PRE_DONE = PRE_COUNCIL + '3. Student "SV1 Test Đạt" (99B14001) has completed the defense; the Secretary gave 8.0 for every criterion.';

const OPEN_LIST = '2. Open the council "HD KTPM 01" and select the "Chấm điểm" tab.';
const OPEN_NEW = OPEN_LIST + '\n3. Select the student "SV3 Test Mới" (99B14003).\n';
const NO_WRITE = 'The database still has no council grading sheet of 99B14003.';
const NO_PUT = 'The API PUT /defense-assignment/{assignment of 99B14003}/council-evaluation is not called.';

const ITC341 = defineItc({
  id: 'ITC341', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_BOARD,
  description: 'Verify that the Secretary can view the list of students to be graded by the council',
  procedure: '1. Log in as the Secretary of the council.\n' + OPEN_LIST + '\n3. Select the student "SV3 Test Mới" (99B14003).',
  expected:
    '1. The API GET /defense-council/{council}/council-evaluation returns HTTP 200 with code = 1000; the role is SECRETARY, all scores and minutes can be viewed.\n' +
    '2. The list shows "SV1 Test Đạt" with "Đã chấm · 8.0", "SV2 Test Trượt" with "Đã chấm · 5.0", "SV3 Test Mới" with "Chưa chấm"; student 2251190001 is not displayed.\n' +
    '3. The filters show "Tất cả" 3, "Chưa chấm" 1, "Đã chấm" 2; the button "Lập & Nộp biên bản" is displayed for "SV3 Test Mới".\n' +
    '4. The scores match the grading sheets of the Secretary stored in the database.',
  precondition: PRE_BOARD,
});

const ITC342 = defineItc({
  id: 'ITC342', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_BOARD,
  description: 'Verify that the Chairperson can view the list of students to be graded by the council',
  procedure: '1. Log in as the Chairperson of the council.\n' + OPEN_LIST + '\n3. Select the student "SV3 Test Mới" (99B14003).',
  expected:
    '1. The API GET /defense-council/{council}/council-evaluation returns HTTP 200 with code = 1000; the role is CHAIRPERSON, all scores can be viewed, the minutes are view only.\n' +
    '2. The list shows "SV3 Test Mới" with "Chưa chấm"; the button "Xem biên bản" is displayed.\n' +
    '3. The sheet shows the grader "Lê Hoàng Nam (Chủ tịch)".',
  precondition: PRE_BOARD,
});

const ITC343 = defineItc({
  id: 'ITC343', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_BOARD,
  description: 'Verify that a Council Member can view the list of students to be graded, with view-only minutes and without permission on all scores',
  procedure: '1. Log in as a Council Member of the council.\n' + OPEN_LIST + '\n3. Select the student "SV3 Test Mới" (99B14003).',
  expected:
    '1. The API GET /defense-council/{council}/council-evaluation returns HTTP 200 with code = 1000; the role is COUNCIL_MEMBER, the minutes are view only, all scores cannot be viewed.\n' +
    '2. The list shows "SV3 Test Mới" with "Chưa chấm"; the button "Xem biên bản" is displayed; the button "Lập & Nộp biên bản" and the "Tổng hợp" tab are not displayed.\n' +
    '3. The sheet shows the grader with the role "(Ủy viên)".',
  precondition: PRE_BOARD,
});

const ITC344 = defineItc({
  id: 'ITC344', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_BOARD,
  description: 'Verify that the Secretary can filter students by grading status',
  procedure: '1. Log in as the Secretary of the council.\n' + OPEN_LIST + '\n3. Click the filter "Chưa chấm".\n4. Click the filter "Đã chấm".',
  expected:
    '1. The API GET /defense-council/{council}/council-evaluation returns HTTP 200 with code = 1000.\n' +
    '2. "Chưa chấm" shows only "SV3 Test Mới".\n3. "Đã chấm" shows only "SV1 Test Đạt" and "SV2 Test Trượt".',
  precondition: PRE_BOARD,
});

const ITC345 = defineItc({
  id: 'ITC345', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_SHEET,
  description: 'Verify that the Secretary can open a blank grading sheet of a student who has not been graded',
  procedure: '1. Log in as the Secretary of the council.\n' + OPEN_NEW.trimEnd(),
  expected:
    '1. The API GET /defense-assignment/{assignment of 99B14003}/council-evaluation returns HTTP 200 with code = 1000; grading is open and the sheet is editable.\n' +
    '2. The sheet shows the grader "Nguyễn Kỹ thuật phần mềm (Thư ký)", the student name, code, class and topic, and 12 blank score inputs; the total is 0.0.\n' +
    '3. The buttons "Lưu nháp" and "Lưu & Gửi điểm chính thức" are displayed.\n4. ' + NO_WRITE,
  precondition: PRE_NEW,
});

const ITC346 = defineItc({
  id: 'ITC346', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_SHEET,
  description: 'Verify that the grading sheet of a student who has completed the defense is read only',
  procedure: '1. Log in as the Secretary of the council.\n' + OPEN_LIST + '\n3. Select the student "SV1 Test Đạt" (99B14001).',
  expected:
    '1. The API GET /defense-assignment/{assignment of 99B14001}/council-evaluation returns HTTP 200 with code = 1000; the sheet is SUBMITTED and not editable.\n' +
    '2. The message "Sinh viên đã hoàn tất bảo vệ hoặc không còn ở trạng thái được Hội đồng chấm điểm – phiếu chỉ xem." is displayed.\n' +
    '3. The comment and 12 scores (8 each) are displayed as stored and disabled; the total is 8.0; the buttons "Lưu nháp" and "Lưu & Gửi điểm chính thức" are not displayed.',
  precondition: PRE_DONE,
});

const ITC347 = defineItc({
  id: 'ITC347', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_SHEET,
  description: 'Verify that the total score is calculated by criterion weight while entering scores',
  procedure: '1. Log in as the Secretary of the council.\n' + OPEN_NEW +
    '4. Enter 10 for "Demo chương trình, sản phẩm thực nghiệm hoạt động ổn định" (weight 15%) and 9 for the other 11 criteria.',
  expected: '1. The total score shows 9.2 (9 × 85% + 10 × 15% = 9.15, rounded half up).\n2. ' + NO_PUT + '\n3. ' + NO_WRITE,
  precondition: PRE_NEW,
});

const ITC348 = defineItc({
  id: 'ITC348', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_DRAFT,
  description: 'Verify that a draft with a score greater than 10 is rejected',
  procedure: '1. Log in as the Secretary of the council.\n' + OPEN_NEW + '4. Enter 10.1 for the criterion "Thời gian trình bày" and click "Lưu nháp".',
  expected: '1. The error "0–10, 1 số lẻ" is displayed at the criterion "Thời gian trình bày" only.\n2. ' + NO_PUT + '\n3. ' + NO_WRITE,
  precondition: PRE_NEW,
});

const ITC349 = defineItc({
  id: 'ITC349', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_DRAFT,
  description: 'Verify that a draft with a negative score is rejected',
  procedure: '1. Log in as the Secretary of the council.\n' + OPEN_NEW + '4. Enter -0.1 for the criterion "Thời gian trình bày" and click "Lưu nháp".',
  expected: '1. The error "0–10, 1 số lẻ" is displayed at the criterion "Thời gian trình bày" only.\n2. ' + NO_PUT + '\n3. ' + NO_WRITE,
  precondition: PRE_NEW,
});

const ITC350 = defineItc({
  id: 'ITC350', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_DRAFT,
  description: 'Verify that a draft with a score of 2 decimal places is rejected',
  procedure: '1. Log in as the Secretary of the council.\n' + OPEN_NEW + '4. Enter 8.25 for the criterion "Thời gian trình bày" and click "Lưu nháp".',
  expected: '1. The error "0–10, 1 số lẻ" is displayed at the criterion "Thời gian trình bày" only.\n2. ' + NO_PUT + '\n3. ' + NO_WRITE,
  precondition: PRE_NEW,
});

const ITC351 = defineItc({
  id: 'ITC351', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_SUBMIT,
  description: 'Verify that a sheet without any score and comment cannot be submitted',
  procedure: '1. Log in as the Secretary of the council.\n' + OPEN_NEW + '4. Leave every field blank and click "Lưu & Gửi điểm chính thức".',
  expected:
    '1. The error "Bắt buộc" is displayed at all 12 criteria and the error "Vui lòng nhập nhận xét đánh giá đồ án trước khi gửi điểm" is displayed; the confirmation dialog is not opened.\n2. ' +
    NO_PUT + '\n3. ' + NO_WRITE,
  precondition: PRE_NEW,
});

const ITC352 = defineItc({
  id: 'ITC352', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_SUBMIT,
  description: 'Verify that a sheet with one criterion left blank cannot be submitted',
  procedure: '1. Log in as the Secretary of the council.\n' + OPEN_NEW +
    `4. Enter the comment "${COMMENT}", enter 8 for every criterion except "Thời gian trình bày", and click "Lưu & Gửi điểm chính thức".`,
  expected:
    '1. The error "Bắt buộc" is displayed at the criterion "Thời gian trình bày" only; the confirmation dialog is not opened.\n2. ' + NO_PUT + '\n3. ' + NO_WRITE,
  precondition: PRE_NEW,
});

const ITC353 = defineItc({
  id: 'ITC353', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_SUBMIT,
  description: 'Verify that choosing to review again in the confirmation dialog does not submit the sheet',
  procedure: '1. Log in as the Secretary of the council.\n' + OPEN_NEW +
    `4. Enter the comment "${COMMENT}" and 8 for every criterion, click "Lưu & Gửi điểm chính thức".\n5. Click "Xem lại".`,
  expected:
    '1. The dialog "Xác nhận gửi điểm bảo vệ" shows "SV3 Test Mới (99B14003)", "KTPM202601 · Thư ký", the score 8.0 and the average of the examiners "7.5 điểm"; no deviation warning is displayed.\n' +
    '2. After clicking "Xem lại", the dialog is closed and the entered comment and scores are kept.\n3. ' + NO_PUT + '\n4. ' + NO_WRITE,
  precondition: PRE_NEW,
});

const ITC354 = defineItc({
  id: 'ITC354', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_SUBMIT,
  description: 'Verify that a score deviating by 1.5 or more is only warned and still counted',
  procedure: '1. Log in as the Secretary of the council.\n' + OPEN_NEW +
    `4. Enter the comment "${COMMENT}" and 5 for every criterion, click "Lưu & Gửi điểm chính thức".\n5. Click "Xem lại".`,
  expected:
    '1. The dialog "Xác nhận gửi điểm bảo vệ" warns that the score 5.0 deviates by "2.5 điểm" from the average 7.5 of the examiners.\n' +
    '2. The warning does not state that the deviated score is removed from the average (the score is only warned and still counted).\n3. ' + NO_PUT + '\n4. ' + NO_WRITE,
  precondition: PRE_NEW,
});

const ITC355 = defineItc({
  id: 'ITC355', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_EXPORT,
  description: 'Verify that the Secretary can export the submitted council grading sheet to a .docx file',
  procedure: '1. Log in as the Secretary of the council.\n' + OPEN_LIST + '\n3. Select the student "SV1 Test Đạt" (99B14001) and click "Xuất phiếu chấm (.docx)".',
  expected:
    '1. The API GET /defense-assignment/{assignment of 99B14001}/council-evaluation/export returns HTTP 200 with a Word (.docx) file.\n' +
    '2. The browser downloads the file "Phiếu chấm tóm tắt Rubric - TVHĐ - 99B14001.docx".',
  precondition: PRE_DONE,
});

const ITC356 = defineItc({
  id: 'ITC356', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_SUMMARY,
  description: 'Verify that the Secretary can view the scores of all graders and the calculated council score and final score',
  procedure: '1. Log in as the Secretary of the council.\n2. Open the council "HD KTPM 01" and select the "Tổng hợp" tab.',
  expected:
    '1. The API GET /defense-council/{council}/defense-score returns HTTP 200 with code = 1000 and 3 students.\n' +
    '2. The row of "SV1 Test Đạt" shows supervisor 8.0, examiners 7.0 and 5.6, council scores 8.0 (Chairperson), 8.0 (Secretary) and 8.0, 9.0, 6.0 (members), council average 7.8, final score 7.5 and "Đạt"; the scores 5.6 and 6.0 are marked as deviated but still counted.\n' +
    '3. The row of "SV3 Test Mới" shows the 5 council members as "Chưa chấm" and the result "Chưa đủ điểm".\n' +
    '4. The individual scores match the submitted sheets stored in the database.',
  precondition: PRE_BOARD,
});

const ITC357 = defineItc({
  id: 'ITC357', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_SUMMARY,
  description: 'Verify that the score summary describes a deviated score as warned and still counted',
  procedure: '1. Log in as the Secretary of the council.\n2. Open the council "HD KTPM 01" and select the "Tổng hợp" tab.',
  expected:
    '1. The API GET /defense-council/{council}/defense-score returns HTTP 200 with code = 1000; 99B14001 has a deviated score and the council average 7.8 counts all 5 scores.\n' +
    '2. The description of the summary does not state that the deviated score is removed from the average.',
  precondition: PRE_BOARD,
});

const SEC113 = defineItcSec({
  id: 'TC-SEC-113', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'A student opens the council grading screen and saves a council grading sheet',
  roleSession: 'Student (STUDENT), logged in', technique: 'EP',
  given: 'Logged in with a Student account',
  when: 'Open /lecturer/defense/councils/{HD KTPM 01}?tab=grading directly; call PUT /defense-assignment/{assignment of 99B14003}/council-evaluation with the Student session',
  then: 'The screen shows "Tài khoản của bạn không có quyền truy cập cổng cán bộ."; PUT returns HTTP 403 with code = 2001; 99B14003 still has no council grading sheet',
});

const SEC114 = defineItcSec({
  id: 'TC-SEC-114', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'An anonymous user opens the council grading screen and saves a council grading sheet',
  roleSession: 'Not logged in (no session cookie)', technique: 'EP',
  given: 'The browser is not logged in',
  when: 'Open /lecturer/defense/councils/{HD KTPM 01}?tab=grading directly; call PUT /defense-assignment/{assignment of 99B14003}/council-evaluation without a session',
  then: 'The user is redirected to the login page (/login); PUT returns HTTP 401 with code = 2000; 99B14003 still has no council grading sheet',
});

const SEC115 = defineItcSec({
  id: 'TC-SEC-115', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'A lecturer outside the council opens the council and saves a council grading sheet',
  roleSession: 'Supervisor (SUPERVISOR) who is not a member of "HD KTPM 01", logged in', technique: 'EP',
  given: 'Logged in with the account of a lecturer who is not a member of "HD KTPM 01"',
  when: 'Open /lecturer/defense/councils/{HD KTPM 01}?tab=grading directly; call PUT /defense-assignment/{assignment of 99B14003}/council-evaluation with that session',
  then: 'The screen shows "Không tìm thấy thông tin hội đồng hoặc bạn không có quyền xem thông tin hội đồng này."; PUT returns HTTP 403 with code = 3120 and message "Bạn không phải là thành viên của Hội đồng này"; 99B14003 still has no council grading sheet',
});

const SEC116 = defineItcSec({
  id: 'TC-SEC-116', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'A lecturer outside the council opens the score summary and reads the score board of a student',
  roleSession: 'Supervisor (SUPERVISOR) who is not a member of "HD KTPM 01", logged in', technique: 'ERROR_GUESSING',
  given: 'Logged in with the account of a lecturer who is not a member of "HD KTPM 01"',
  when: 'Open /lecturer/defense/councils/{HD KTPM 01}?tab=summary directly; call GET /defense-score/{assignment of 99B14001} with that session',
  then: 'The screen shows no score; GET returns HTTP 403 with code = 2001 and message "Bạn không có quyền xem bảng điểm bảo vệ của sinh viên này"; no score is returned',
});

const SEC117 = defineItcSec({
  id: 'TC-SEC-117', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'A user with a tampered token opens the council grading screen and saves a council grading sheet',
  roleSession: 'Tampered token of the Secretary', technique: 'ERROR_GUESSING',
  given: 'The session cookie of the Secretary has its signature modified',
  when: 'Open /lecturer/defense/councils/{HD KTPM 01}?tab=grading directly; call PUT /defense-assignment/{assignment of 99B14003}/council-evaluation with the tampered token',
  then: 'The user is redirected to the login page (/login); PUT returns HTTP 401 with code = 2000; 99B14003 still has no council grading sheet',
});

// ============================================================================
// HÀM HỖ TRỢ
// ============================================================================

let councilId = '';
const assignmentIds: Record<string, string> = {};
let dataBefore = '';

function requireEmail(name: string): string {
  const email = process.env[name];
  if (!email) throw new Error(`Chưa cấu hình ${name} trong .env.e2e (cần cho "${COUNCIL}")`);
  return email;
}
const token = (request: APIRequestContext, role: string) => loginByEmail(request, requireEmail(`E2E_EMAIL_${role}`));

// Gắn phiên đăng nhập vào trình duyệt cho phiên không có sẵn trong global-setup
async function useSession(page: Page, accessToken: string) {
  await page.context().addCookies([{
    name: 'access_token', value: accessToken, domain: new URL(getApiBaseUrl()).hostname, path: '/',
    httpOnly: true, secure: false, sameSite: 'Lax',
  }]);
}

type SheetRow = { evaluator: string; status: string; total_score: string | null };

// Phiếu chấm của sinh viên, đọc thẳng DB (API chỉ trả phiếu của chính người đăng nhập)
async function sheetsOf(studentCode: string, type = 'COUNCIL') {
  return dbSelect<SheetRow>(
    `SELECT CONCAT(a.first_name, ' ', a.last_name) AS evaluator, e.status, e.total_score
       FROM evaluation_sheet e
       JOIN thesis_topic tt ON tt.id = e.thesis_topic_id JOIN student s ON s.id = tt.student_id
       JOIN teacher t ON t.id = e.evaluator_id JOIN account a ON a.id = t.account_id
      WHERE s.student_code = ? AND e.type = ? ORDER BY e.id`, [studentCode, type]);
}

// Dữ liệu chấm điểm của 3 sinh viên test: phải giữ nguyên sau mỗi case
async function fingerprint() {
  const codes = [DONE_CODE, FAIL_CODE, NEW_CODE];
  const sheets = await dbSelect(
    `SELECT e.id, e.status, e.total_score, e.general_comment, e.submitted_at, e.valid_for_final, e.deviation,
            (SELECT GROUP_CONCAT(CONCAT(d.criteria_id, ':', d.score) ORDER BY d.criteria_id)
               FROM evaluation_detail d WHERE d.sheet_id = e.id) AS details
       FROM evaluation_sheet e JOIN thesis_topic tt ON tt.id = e.thesis_topic_id JOIN student s ON s.id = tt.student_id
      WHERE s.student_code IN (?, ?, ?) ORDER BY e.id`, codes);
  const scores = await dbSelect(
    `SELECT ts.id, ts.advisor_score, ts.examiner_score, ts.council_score, ts.final_score
       FROM thesis_score ts JOIN thesis_topic tt ON tt.id = ts.thesis_topic_id JOIN student s ON s.id = tt.student_id
      WHERE s.student_code IN (?, ?, ?) ORDER BY ts.id`, codes);
  return JSON.stringify({ sheets, scores });
}

const evaluationPath = (code: string) => `/defense-assignment/${assignmentIds[code]}/council-evaluation`;
const pathOf = (r: Response) => new URL(r.url()).pathname;
const isGet = (suffix: string) => (r: Response) => r.request().method() === 'GET' && pathOf(r).endsWith(suffix);

function trackPut(page: Page) {
  const s = { hit: false };
  page.on('request', (r) => {
    if (r.method() === 'PUT' && new URL(r.url()).pathname.endsWith('/council-evaluation')) s.hit = true;
  });
  return s;
}

const studentButton = (page: Page, code: string) => page.getByRole('button').filter({ hasText: `${code} · ${COUNCIL_CODE}` });
const criterionRow = (page: Page, name: string) => page.getByRole('row').filter({ hasText: name });
const scoreInput = (page: Page, name: string) => criterionRow(page, name).getByRole('spinbutton');
const commentBox = (page: Page) => page.locator('textarea');
// Dòng thông tin "<nhãn>: <giá trị>" ở đầu phiếu; tổng điểm ở chân phiếu
const infoLine = (page: Page, label: string) => page.getByText(label, { exact: true }).locator('xpath=..');
const totalBox = (page: Page) => page.getByText('Tổng điểm đánh giá', { exact: true }).locator('xpath=following-sibling::div[1]');
const draftButton = (page: Page) => page.getByRole('button', { name: 'Lưu nháp', exact: true });
const submitButton = (page: Page) => page.getByRole('button', { name: 'Lưu & Gửi điểm chính thức' });
const confirmDialog = (page: Page) => page.getByRole('dialog').filter({ hasText: 'Xác nhận gửi điểm bảo vệ' });

async function openGrading(page: Page) {
  const resPromise = page.waitForResponse(isGet(`/defense-council/${councilId}/council-evaluation`));
  await page.goto(`/lecturer/defense/councils/${councilId}?tab=grading`);
  const res = await resPromise;
  await expect(studentButton(page, NEW_CODE)).toBeVisible();
  return res;
}

// Nghe response phiếu từ lúc mở trang vì sinh viên đầu danh sách được tự chọn
async function openSheet(page: Page, code: string, name: string) {
  const resPromise = page.waitForResponse(isGet(evaluationPath(code)));
  await openGrading(page);
  await studentButton(page, code).click();
  const res = await resPromise;
  await expect(infoLine(page, 'Họ và tên sinh viên:')).toContainText(name);
  await expect(page.getByRole('spinbutton')).toHaveCount(12);
  return res;
}

async function openNewSheet(page: Page) {
  const puts = trackPut(page);
  const res = await openSheet(page, NEW_CODE, NEW_NAME);
  await expect(submitButton(page)).toBeVisible();
  return { res, puts };
}

async function fillAll(page: Page, score: string, except?: string) {
  const inputs = page.getByRole('spinbutton');
  for (let i = 0; i < 12; i++) await inputs.nth(i).fill(score);
  if (except) await scoreInput(page, except).fill('');
}

async function expectNotSaved(puts: { hit: boolean }) {
  expect(puts.hit, 'Không được gọi PUT council-evaluation').toBe(false);
  expect(await sheetsOf(NEW_CODE)).toHaveLength(0);
}

// ============================================================================
// TEST
// ============================================================================

test.beforeAll(async ({ request }) => {
  const sec = await token(request, 'SECRETARY');
  const my = await apiCall(request, sec, 'GET', '/defense-council/my');
  const c = my.body.data.find((x: any) => x.name === COUNCIL);
  councilId = c.councilPublicId;
  expect(c.myRole, 'Tiền điều kiện: tài khoản Thư ký là Thư ký HD KTPM 01').toBe('SECRETARY');
  const board = (await apiCall(request, sec, 'GET', `/defense-council/${councilId}/council-evaluation`)).body.data;
  for (const s of board.students) assignmentIds[s.studentCode] = s.defenseAssignmentPublicId;
  expect(board.gradingOpen, 'Tiền điều kiện: mốc tổ chức Hội đồng bảo vệ đang mở').toBe(true);
  expect(await sheetsOf(NEW_CODE), 'Tiền điều kiện: 99B14003 chưa có phiếu Hội đồng').toHaveLength(0);
});

test.beforeEach(async () => {
  dataBefore = await fingerprint();
});

test.afterEach(async () => {
  expect(await fingerprint(), 'Dữ liệu chấm điểm phải giữ nguyên sau test').toBe(dataBefore);
});

test.describe('Chấm điểm hội đồng (Thư ký)', () => {
  test.use({ storageState: '.auth/secretary.json' });

  test.describe(FN_BOARD, () => {
    test(ITC341.title, { annotation: ITC341.annotation }, async ({ page }) => {
      const res = await openGrading(page);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.data).toMatchObject({
        councilCode: COUNCIL_CODE, myRole: 'SECRETARY', canViewAllScores: true, canViewMinutes: true, canEditMinutes: true,
      });

      await expect(studentButton(page, DONE_CODE)).toContainText('Đã chấm · 8.0');
      await expect(studentButton(page, FAIL_CODE)).toContainText('Đã chấm · 5.0');
      await expect(studentButton(page, NEW_CODE)).toContainText('Chưa chấm');
      await expect(studentButton(page, NOT_REVIEWED_CODE)).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Tất cả 3', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Chưa chấm 1', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Đã chấm 2', exact: true })).toBeVisible();
      await studentButton(page, NEW_CODE).click();
      await expect(page.getByRole('button', { name: 'Lập & Nộp biên bản' })).toBeVisible();

      for (const [code, score] of [[DONE_CODE, 8], [FAIL_CODE, 5]] as const) {
        const mine = (await sheetsOf(code)).find((s) => s.evaluator === 'Nguyễn Kỹ thuật phần mềm');
        expect(mine?.status).toBe('SUBMITTED');
        expect(Number(mine?.total_score)).toBe(score);
      }
    });

    test(ITC344.title, { annotation: ITC344.annotation }, async ({ page }) => {
      const res = await openGrading(page);
      expect(res.status()).toBe(200);
      expect((await res.json()).code).toBe(1000);
      await page.getByRole('button', { name: 'Chưa chấm 1', exact: true }).click();
      await expect(studentButton(page, DONE_CODE)).toHaveCount(0);
      await expect(studentButton(page, FAIL_CODE)).toHaveCount(0);
      await expect(studentButton(page, NEW_CODE)).toBeVisible();
      await page.getByRole('button', { name: 'Đã chấm 2', exact: true }).click();
      await expect(studentButton(page, NEW_CODE)).toHaveCount(0);
      await expect(studentButton(page, DONE_CODE)).toBeVisible();
      await expect(studentButton(page, FAIL_CODE)).toBeVisible();
    });
  });

  test.describe(FN_SHEET, () => {
    test(ITC345.title, { annotation: ITC345.annotation }, async ({ page }) => {
      const { res, puts } = await openNewSheet(page);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.data).toMatchObject({ studentCode: NEW_CODE, myRole: 'SECRETARY', gradingOpen: true, editable: true });
      expect(body.data.sheet.sheetPublicId ?? null).toBeNull();
      await expect(infoLine(page, 'Họ và tên cán bộ chấm:')).toContainText('Nguyễn Kỹ thuật phần mềm (Thư ký)');
      await expect(infoLine(page, 'Mã sinh viên:')).toContainText(NEW_CODE);
      await expect(infoLine(page, 'Lớp:')).toContainText('KTPM2');
      await expect(infoLine(page, 'Tên đề tài:')).toContainText(body.data.topicName);
      for (let i = 0; i < 12; i++) await expect(page.getByRole('spinbutton').nth(i)).toHaveValue('');
      await expect(totalBox(page)).toHaveText('0.0 / 10');
      await expect(draftButton(page)).toBeVisible();
      await expectNotSaved(puts);
    });

    test(ITC346.title, { annotation: ITC346.annotation }, async ({ page }) => {
      const res = await openSheet(page, DONE_CODE, DONE_NAME);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.data).toMatchObject({ studentCode: DONE_CODE, editable: false });
      expect(body.data.sheet.status).toBe('SUBMITTED');
      await expect(page.getByText(
        'Sinh viên đã hoàn tất bảo vệ hoặc không còn ở trạng thái được Hội đồng chấm điểm – phiếu chỉ xem.')).toBeVisible();
      await expect(commentBox(page)).toHaveValue(body.data.sheet.generalComment);
      await expect(commentBox(page)).toBeDisabled();
      for (let i = 0; i < 12; i++) {
        await expect(page.getByRole('spinbutton').nth(i)).toHaveValue('8');
        await expect(page.getByRole('spinbutton').nth(i)).toBeDisabled();
      }
      await expect(totalBox(page)).toHaveText('8.0 / 10');
      await expect(draftButton(page)).toHaveCount(0);
      await expect(submitButton(page)).toHaveCount(0);
    });

    test(ITC347.title, { annotation: ITC347.annotation }, async ({ page }) => {
      const { puts } = await openNewSheet(page);
      await fillAll(page, '9');
      await scoreInput(page, 'Demo chương trình, sản phẩm thực nghiệm hoạt động ổn định').fill('10');
      await expect(totalBox(page)).toHaveText('9.2 / 10');
      await expectNotSaved(puts);
    });
  });

  test.describe(FN_DRAFT, () => {
    for (const [itc, value] of [[ITC348, '10.1'], [ITC349, '-0.1'], [ITC350, '8.25']] as const) {
      test(itc.title, { annotation: itc.annotation }, async ({ page }) => {
        const { puts } = await openNewSheet(page);
        await scoreInput(page, 'Thời gian trình bày').fill(value);
        await draftButton(page).click();
        await expect(page.getByText('0–10, 1 số lẻ', { exact: true })).toHaveCount(1);
        await expect(criterionRow(page, 'Thời gian trình bày')).toContainText('0–10, 1 số lẻ');
        await expectNotSaved(puts);
      });
    }
  });

  test.describe(FN_SUBMIT, () => {
    test(ITC351.title, { annotation: ITC351.annotation }, async ({ page }) => {
      const { puts } = await openNewSheet(page);
      await submitButton(page).click();
      await expect(page.getByText('Bắt buộc', { exact: true })).toHaveCount(12);
      await expect(page.getByText('Vui lòng nhập nhận xét đánh giá đồ án trước khi gửi điểm', { exact: true })).toBeVisible();
      await expect(confirmDialog(page)).toHaveCount(0);
      await expectNotSaved(puts);
    });

    test(ITC352.title, { annotation: ITC352.annotation }, async ({ page }) => {
      const { puts } = await openNewSheet(page);
      await commentBox(page).fill(COMMENT);
      await fillAll(page, '8', 'Thời gian trình bày');
      await submitButton(page).click();
      await expect(page.getByText('Bắt buộc', { exact: true })).toHaveCount(1);
      await expect(criterionRow(page, 'Thời gian trình bày')).toContainText('Bắt buộc');
      await expect(confirmDialog(page)).toHaveCount(0);
      await expectNotSaved(puts);
    });

    test(ITC353.title, { annotation: ITC353.annotation }, async ({ page }) => {
      const { puts } = await openNewSheet(page);
      await commentBox(page).fill(COMMENT);
      await fillAll(page, '8');
      await submitButton(page).click();
      const dialog = confirmDialog(page);
      await expect(dialog).toContainText(`${NEW_NAME} (${NEW_CODE})`);
      await expect(dialog).toContainText(`${COUNCIL_CODE} · Thư ký`);
      await expect(dialog).toContainText('8.0 / 10');
      await expect(dialog).toContainText('7.5 điểm');
      await expect(dialog).not.toContainText('lệch');
      await dialog.getByRole('button', { name: 'Xem lại' }).click();
      await expect(dialog).toHaveCount(0);
      await expect(commentBox(page)).toHaveValue(COMMENT);
      for (let i = 0; i < 12; i++) await expect(page.getByRole('spinbutton').nth(i)).toHaveValue('8');
      await expectNotSaved(puts);
    });

    test(ITC354.title, { annotation: ITC354.annotation }, async ({ page }) => {
      const { puts } = await openNewSheet(page);
      await commentBox(page).fill(COMMENT);
      await fillAll(page, '5');
      await submitButton(page).click();
      const dialog = confirmDialog(page);
      await expect(dialog).toContainText('Điểm bạn chấm (5.0) lệch 2.5 điểm');
      await expect(dialog).toContainText('7.5');
      const warning = await dialog.innerText();
      await dialog.getByRole('button', { name: 'Xem lại' }).click();
      await expectNotSaved(puts);
      // BR-07: điểm lệch >= 1.5 chỉ cảnh báo, vẫn được tính
      expect(warning).not.toContain('bị loại khỏi điểm trung bình');
    });
  });

  test.describe(FN_EXPORT, () => {
    test(ITC355.title, { annotation: ITC355.annotation }, async ({ page }) => {
      await openSheet(page, DONE_CODE, DONE_NAME);
      const resPromise = page.waitForResponse(isGet(`${evaluationPath(DONE_CODE)}/export`));
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Xuất phiếu chấm (.docx)' }).click();
      const res = await resPromise;
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toContain('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      const download = await downloadPromise;
      expect(download.suggestedFilename().normalize('NFC')).toBe(`Phiếu chấm tóm tắt Rubric - TVHĐ - ${DONE_CODE}.docx`);
    });
  });

  test.describe(FN_SUMMARY, () => {
    const openSummary = async (page: Page) => {
      const resPromise = page.waitForResponse(isGet(`/defense-council/${councilId}/defense-score`));
      await page.goto(`/lecturer/defense/councils/${councilId}?tab=summary`);
      return resPromise;
    };

    test(ITC356.title, { annotation: ITC356.annotation }, async ({ page }) => {
      const res = await openSummary(page);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.data.map((x: any) => x.studentCode).sort()).toEqual([DONE_CODE, FAIL_CODE, NEW_CODE]);

      const done = page.getByRole('row').filter({ hasText: DONE_CODE });
      const cells = done.getByRole('cell');
      await expect(cells.nth(3)).toHaveText('8.0');
      await expect(cells.nth(4)).toContainText('7.0');
      await expect(cells.nth(5)).toContainText('5.6');
      const shown: number[] = [];
      for (let i = 6; i <= 10; i++) shown.push(Number((await cells.nth(i).innerText()).trim()));
      // Đối chiếu với phiếu đã nộp trong DB: Chủ tịch, Thư ký đúng cột; 3 Ủy viên đủ điểm
      const council = await sheetsOf(DONE_CODE);
      const dbScore = (name: string) => Number(council.find((s) => s.evaluator === name)?.total_score);
      expect(council.every((s) => s.status === 'SUBMITTED')).toBe(true);
      expect(shown.slice(0, 2)).toEqual([dbScore('Lê Hoàng Nam'), dbScore('Nguyễn Kỹ thuật phần mềm')]);
      expect(shown.slice(2).sort()).toEqual(
        ['Lê Văn Khoa', 'Hoàng Thị Yến', 'Lý Thị Thanh Thảo'].map(dbScore).sort());
      expect(shown.slice().sort()).toEqual([6, 8, 8, 8, 9]);
      expect((await sheetsOf(DONE_CODE, 'EXAMINER')).map((s) => Number(s.total_score))).toEqual([7, 5.6]);
      expect((await sheetsOf(DONE_CODE, 'ADVISOR')).map((s) => Number(s.total_score))).toEqual([8]);

      await expect(cells.nth(11)).toHaveText('7.8');
      await expect(cells.nth(12)).toHaveText('7.5');
      await expect(cells.nth(13)).toContainText('Đạt');
      // 2 điểm lệch (5.6 của GVPB, 6.0 của Ủy viên) được đánh dấu cảnh báo
      await expect(done.getByTitle(/Cảnh báo: lệch .* vẫn được tính/)).toHaveText(['5.6', '6.0']);

      const fresh = page.getByRole('row').filter({ hasText: NEW_CODE }).getByRole('cell');
      for (let i = 6; i <= 10; i++) await expect(fresh.nth(i)).toHaveText('Chưa chấm');
      await expect(fresh.nth(13)).toHaveText('Chưa đủ điểm');
    });

    test(ITC357.title, { annotation: ITC357.annotation }, async ({ page }) => {
      const res = await openSummary(page);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      const board = body.data.find((x: any) => x.studentCode === DONE_CODE).board;
      expect(board.hasDeviation).toBe(true);
      expect(board.councilScore).toBe(7.8);
      const note = page.getByText('Điểm GVHD, 2 GVPB và 5 thành viên Hội đồng.');
      await expect(note).toBeVisible();
      // BR-07: điểm lệch >= 1.5 chỉ cảnh báo, vẫn được tính
      expect(await note.innerText()).not.toContain('bị loại khỏi điểm');
    });
  });
});

test.describe('Chấm điểm hội đồng (Chủ tịch, Ủy viên)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.describe(FN_BOARD, () => {
    test(ITC342.title, { annotation: ITC342.annotation }, async ({ page, request }) => {
      await useSession(page, await token(request, 'HD_CHAIRPERSON'));
      const res = await openGrading(page);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.data).toMatchObject({ myRole: 'CHAIRPERSON', canViewAllScores: true, canViewMinutes: true, canEditMinutes: false });
      await studentButton(page, NEW_CODE).click();
      await expect(studentButton(page, NEW_CODE)).toContainText('Chưa chấm');
      await expect(page.getByRole('button', { name: 'Xem biên bản' })).toBeVisible();
      await expect(infoLine(page, 'Họ và tên cán bộ chấm:')).toContainText('Lê Hoàng Nam (Chủ tịch)');
    });

    test(ITC343.title, { annotation: ITC343.annotation }, async ({ page, request }) => {
      await useSession(page, await token(request, 'HD_MEMBER'));
      const res = await openGrading(page);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.data).toMatchObject({ myRole: 'COUNCIL_MEMBER', canViewAllScores: false, canViewMinutes: true, canEditMinutes: false });
      await studentButton(page, NEW_CODE).click();
      await expect(studentButton(page, NEW_CODE)).toContainText('Chưa chấm');
      await expect(infoLine(page, 'Họ và tên cán bộ chấm:')).toContainText('(Ủy viên)');
      await expect(page.getByRole('button', { name: 'Lập & Nộp biên bản' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Xem biên bản' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Tổng hợp' })).toHaveCount(0);
    });
  });
});

test.describe('SecurityTest - Chấm điểm hội đồng', () => {
  const gradingUrl = () => `/lecturer/defense/councils/${councilId}?tab=grading`;
  const draftBody = { criteriaScores: [], generalComment: COMMENT, submit: false };

  test.describe('Sinh viên', () => {
    test.use({ storageState: '.auth/student.json' });
    test(SEC113.title, { annotation: SEC113.annotation }, async ({ page, request }) => {
      await page.goto(gradingUrl());
      await expect(page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.')).toBeVisible();
      await expect(studentButton(page, NEW_CODE)).toHaveCount(0);
      const res = await apiCall(request, await token(request, 'STUDENT'), 'PUT', evaluationPath(NEW_CODE), { data: draftBody });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(2001);
      expect(await sheetsOf(NEW_CODE)).toHaveLength(0);
    });
  });

  test.describe('Chưa đăng nhập / token bị sửa', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test(SEC114.title, { annotation: SEC114.annotation }, async ({ page, request }) => {
      await page.goto(gradingUrl());
      await expect(page).toHaveURL(/\/login/);
      const res = await request.put(`${getApiBaseUrl()}${evaluationPath(NEW_CODE)}`, { data: draftBody });
      expect(res.status()).toBe(401);
      expect((await res.json()).code).toBe(2000);
      expect(await sheetsOf(NEW_CODE)).toHaveLength(0);
    });

    test(SEC117.title, { annotation: SEC117.annotation }, async ({ page, request }) => {
      const [header, payload, signature] = (await token(request, 'SECRETARY')).split('.');
      const tampered = `${header}.${payload}.${signature.slice(0, 10)}${signature[10] === 'A' ? 'B' : 'A'}${signature.slice(11)}`;
      await useSession(page, tampered);
      await page.goto(gradingUrl());
      await expect(page).toHaveURL(/\/login/);
      await expect(studentButton(page, NEW_CODE)).toHaveCount(0);
      const res = await apiCall(request, tampered, 'PUT', evaluationPath(NEW_CODE), { data: draftBody });
      expect(res.status).toBe(401);
      expect(res.body.code).toBe(2000);
      expect(await sheetsOf(NEW_CODE)).toHaveLength(0);
    });
  });

  test.describe('Giảng viên không thuộc Hội đồng', () => {
    // Tài khoản E2E_EMAIL_CHAIRPERSON hiện chỉ là GVHD, không thuộc HD KTPM 01
    test.use({ storageState: '.auth/chairperson.json' });
    const denied = 'Không tìm thấy thông tin hội đồng hoặc bạn không có quyền xem thông tin hội đồng này.';

    test(SEC115.title, { annotation: SEC115.annotation }, async ({ page, request }) => {
      await page.goto(gradingUrl());
      await expect(page.getByText(denied)).toBeVisible();
      await expect(studentButton(page, NEW_CODE)).toHaveCount(0);
      const res = await apiCall(request, await token(request, 'CHAIRPERSON'), 'PUT', evaluationPath(NEW_CODE), { data: draftBody });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(3120);
      expect(res.body.message).toBe('Bạn không phải là thành viên của Hội đồng này');
      expect(await sheetsOf(NEW_CODE)).toHaveLength(0);
    });

    test(SEC116.title, { annotation: SEC116.annotation }, async ({ page, request }) => {
      await page.goto(`/lecturer/defense/councils/${councilId}?tab=summary`);
      await expect(page.getByText(denied)).toBeVisible();
      await expect(page.getByText(DONE_CODE)).toHaveCount(0);
      const res = await apiCall(request, await token(request, 'CHAIRPERSON'), 'GET', `/defense-score/${assignmentIds[DONE_CODE]}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(2001);
      expect(res.body.message).toBe('Bạn không có quyền xem bảng điểm bảo vệ của sinh viên này');
      expect(res.body.data ?? null).toBeNull();
    });
  });
});
