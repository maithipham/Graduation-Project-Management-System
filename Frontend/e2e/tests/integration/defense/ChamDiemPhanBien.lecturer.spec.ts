import { test, expect, type APIRequestContext, type Page, type Response, type Request } from '@playwright/test';
import { defineItc, defineItcSec } from '../../../support/integration-test-case';
import { apiCall, getApiBaseUrl, loginByEmail } from '../../../support/api';
import { dbSelect } from '../../../support/db';

// ============================================================================
// ĐẶC TẢ TEST CASE (ITC386..ITC403 & TC-SEC-123..TC-SEC-126)
// Feature: defense | Module/Sheet: ChamDiemPhanBien
// Role: Giảng viên phản biện (EXAMINER)
// Màn hình: "/lecturer/defense/reviews" (panel Rubric) và "/lecturer/defense/reviews/{suất phản biện}" (trang phiếu chấm)
//
// KHÔNG GHI DỮ LIỆU: khung chấm hiện đóng vì học kỳ chưa thiết lập mốc "Hạn nộp phiếu chấm phản biện". Tạo mốc này
// qua API thì không xóa lại được; phiếu đã nộp và quyết định Đồng ý / Không đồng ý cũng không có API hoàn tác.
// → Luồng ghi thành công (lưu nháp, nộp, nộp lại, quyết định, xét đạt / không đạt, buổi bảo vệ) chạy ở MockMvc
//   (ChamDiemPhanBienIntegrationTest, ITC404 trở đi, tự rollback).
// Các case nhập điểm / bấm lưu dùng openStaleForm(): mô phỏng form được mở khi khung chấm còn mở, bằng cách sửa DUY NHẤT
// cờ gradingOpen trong response GET phiếu ở trình duyệt. Request ghi vẫn đi thật tới BE và BE thật trả lỗi.
// Mỗi test tự đối chiếu DB trước / sau (afterEach), chạy xong không có gì phải dọn.
// ============================================================================

const FEATURE = 'defense';
const MODULE = 'ChamDiemPhanBien';
const SHEET = 'ChamDiemPhanBien';
const LIST_URL = '/lecturer/defense/reviews';

const FN_VIEW = 'View Examiner Grading Sheet';
const FN_SCORE = 'Enter Rubric Scores';
const FN_DRAFT = 'Save Draft Examiner Sheet';
const FN_SUBMIT = 'Submit Examiner Sheet';
const FN_DECIDE = 'Decide Defense Eligibility';
const FN_EXPORT = 'Export Examiner Sheet';

const MSG_NOT_CONFIGURED =
  "Chưa thiết lập mốc 'Hạn nộp phiếu chấm phản biện' hoặc 'Thời gian tổ chức Hội đồng chấm bảo vệ ĐATN' cho học kỳ của Hội đồng";
const MSG_NOT_MINE = 'Bạn không phải là Giảng viên phản biện được phân công cho sinh viên này';
const MSG_PAGE_ERROR = 'Không tìm thấy thông tin phiếu chấm phản biện hoặc bạn không có quyền truy cập.';

const COMMENT = 'ITC Đồ án đạt yêu cầu, trình bày rõ ràng';
const Q1 = 'ITC Vì sao chọn kiến trúc này?';
const Q2 = 'ITC Hệ thống mở rộng như thế nào?';

const PRE_BASE =
  '1. The lecturer is assigned as an examiner of students in the ongoing semester.\n' +
  '2. The "Hạn nộp phiếu chấm phản biện" milestone is not configured for the semester.\n';
const PRE_NEW = PRE_BASE + '3. One assigned student has no examiner sheet from this lecturer and the decision is still PENDING.';
const PRE_DONE = PRE_BASE + '3. One assigned student already has a SUBMITTED examiner sheet from this lecturer.';
const STALE =
  '\n4. The sheet was opened while grading was allowed and stayed open after the grading window became unavailable ' +
  '(simulated in the browser; the server rules are unchanged).';

const LOGIN_OPEN = '1. Log in as an Examiner and open the "Phản biện" screen.\n2. Select the student who has not been graded.\n';
const LOGIN_OPEN_DONE = '1. Log in as an Examiner and open the "Phản biện" screen.\n2. Select the student whose sheet has been submitted and click "Lưu nháp".\n';
const NOT_STORED = 'The database is unchanged: no examiner sheet, questions or decision is stored for the student.';

const ITC386 = defineItc({
  id: 'ITC386', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_VIEW,
  description: 'Verify that an examiner can open the blank grading sheet of an assigned student who has not been graded',
  procedure: '1. Log in as an Examiner.\n2. Open the grading sheet page of the student who has not been graded.',
  expected:
    '1. The API GET /examiner-assignment/{id}/evaluation returns HTTP 200 with code = 1000, the correct student code, decision PENDING and no score.\n' +
    '2. The page shows the student name, student code, council code, topic name, "Bản nháp", "Chưa đủ 2 phiếu" and "Chưa có kết quả".\n' +
    '3. Every Rubric criterion is listed with its weight and an empty score; the total weight is 100 and the total shows "0.0 / 10".\n' +
    '4. ' + NOT_STORED,
  precondition: PRE_NEW,
});

const ITC387 = defineItc({
  id: 'ITC387', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_VIEW,
  description: 'Verify that an examiner can review a submitted grading sheet with the saved scores, comment and questions',
  procedure: '1. Log in as an Examiner.\n2. Open the grading sheet page of the student whose sheet has been submitted.',
  expected:
    '1. The API GET /examiner-assignment/{id}/evaluation returns HTTP 200 with code = 1000 and sheet status SUBMITTED.\n' +
    '2. The page shows "Đã nộp phiếu" with the saved total score, and each criterion score, the comment and the 2 questions match the database.\n' +
    '3. The database keeps the submitted sheet unchanged.',
  precondition: PRE_DONE,
});

const ITC388 = defineItc({
  id: 'ITC388', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_VIEW,
  description: 'Verify that the grading sheet page is read-only when the grading window is not configured',
  procedure: '1. Log in as an Examiner.\n2. Open the grading sheet page of the student who has not been graded.',
  expected:
    '1. The API GET /examiner-assignment/{id}/evaluation returns HTTP 200 with code = 1000, with grading not open.\n' +
    '2. The page shows "Phiếu chấm phản biện đang ở chế độ chỉ đọc:"; the scores, comment, questions and both decision options are disabled; the buttons "Lưu nháp" and "Lưu" are not displayed.\n' +
    '3. No save request is sent. ' + NOT_STORED,
  precondition: PRE_NEW,
});

const ITC389 = defineItc({
  id: 'ITC389', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_VIEW,
  description: 'Verify that opening the grading sheet of a non-existent examiner assignment shows an error',
  procedure: '1. Log in as an Examiner.\n2. Open the grading sheet page with an examiner assignment code that does not exist.',
  expected:
    '1. The API GET /examiner-assignment/{id}/evaluation returns HTTP 404 with code = 3127.\n' +
    '2. The response message is "Không tìm thấy phân công phản biện".\n' +
    `3. The page shows "${MSG_PAGE_ERROR}" and no Rubric.`,
  precondition: PRE_BASE.trim(),
});

const ITC390 = defineItc({
  id: 'ITC390', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_SCORE,
  description: 'Verify that the converted scores and the rounded total follow the Rubric weights',
  procedure: LOGIN_OPEN + '3. Enter "8.5" for the first criterion and "7" for the second criterion (weights 50% and 50%).',
  expected:
    '1. No save request is sent while entering scores.\n' +
    '2. The converted scores of the two criteria are "4.3" and "3.5".\n' +
    '3. The total shows "7.8 / 10" (7.75 rounded to 1 decimal place).\n' +
    '4. ' + NOT_STORED,
  precondition: PRE_NEW + STALE,
});

const invalidScore = (id: string, value: string, reason: string) => defineItc({
  id, feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_SCORE,
  description: `Verify that a criterion score ${reason} is rejected when saving a draft`,
  procedure: LOGIN_OPEN + `3. Enter "${value}" for the first criterion and click "Lưu nháp".`,
  expected:
    '1. The message "Có một số điểm tiêu chí chưa đúng định dạng. Vui lòng kiểm tra lại." is displayed.\n' +
    '2. The API PUT /examiner-assignment/{id}/evaluation is not called.\n' +
    '3. ' + NOT_STORED,
  precondition: PRE_NEW + STALE,
});
const ITC391 = invalidScore('ITC391', '10.1', 'just above the maximum (10.1)');
const ITC392 = invalidScore('ITC392', '-0.1', 'just below the minimum (-0.1)');
const ITC393 = invalidScore('ITC393', '8.55', 'with 2 decimal places (8.55)');

const ITC394 = defineItc({
  id: 'ITC394', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_DRAFT,
  description: 'Verify that saving a draft with the boundary scores 0 and 10 is sent correctly and rejected by the server when the grading window is not configured',
  procedure: LOGIN_OPEN + `3. Enter "0" and "10" for the two criteria, enter the comment "  ${COMMENT}  ", leave both questions empty and click "Lưu nháp".`,
  expected:
    `1. The API PUT /examiner-assignment/{id}/evaluation is called once as a draft with scores 0 and 10, the trimmed comment "${COMMENT}", empty questions and no decision; it returns HTTP 400 with code = 3064.\n` +
    `2. The response message "${MSG_NOT_CONFIGURED}" is displayed on the sheet.\n` +
    '3. "Đã lưu nháp phiếu phản biện" is not displayed and the entered data stays on the sheet.\n' +
    '4. ' + NOT_STORED,
  precondition: PRE_NEW + STALE,
});

const ITC395 = defineItc({
  id: 'ITC395', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_DRAFT,
  description: 'Verify that cancelling the conversion of a submitted sheet to a draft keeps the submitted sheet',
  procedure: LOGIN_OPEN_DONE + '3. In the dialog "Chuyển về bản nháp?", click "Hủy".',
  expected:
    '1. The dialog "Chuyển về bản nháp?" is displayed, then closes after clicking "Hủy".\n' +
    '2. The API PUT /examiner-assignment/{id}/evaluation is not called.\n' +
    '3. The database keeps the submitted sheet unchanged.',
  precondition: PRE_DONE + STALE,
});

const ITC396 = defineItc({
  id: 'ITC396', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_DRAFT,
  description: 'Verify that converting a submitted sheet to a draft is rejected by the server when the grading window is not configured',
  procedure: LOGIN_OPEN_DONE + '3. In the dialog "Chuyển về bản nháp?", click "Chuyển về nháp".',
  expected:
    '1. The API PUT /examiner-assignment/{id}/evaluation is called as a draft and returns HTTP 400 with code = 3064.\n' +
    `2. The response message "${MSG_NOT_CONFIGURED}" is displayed on the sheet.\n` +
    '3. The database keeps the submitted sheet, its status and scores unchanged.',
  precondition: PRE_DONE + STALE,
});

const ITC397 = defineItc({
  id: 'ITC397', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_SUBMIT,
  description: 'Verify that a sheet with an ungraded criterion cannot be submitted',
  procedure: LOGIN_OPEN + `3. Enter "8" for the first criterion only, enter the comment "${COMMENT}", question 1 "${Q1}", question 2 "${Q2}" and click "Lưu".`,
  expected:
    '1. The message "Vui lòng chấm điểm đầy đủ và hợp lệ cho tất cả các tiêu chí trước khi nộp phiếu." is displayed.\n' +
    '2. The API PUT /examiner-assignment/{id}/evaluation is not called.\n' +
    '3. ' + NOT_STORED,
  precondition: PRE_NEW + STALE,
});

const ITC398 = defineItc({
  id: 'ITC398', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_SUBMIT,
  description: 'Verify that a sheet cannot be submitted without the comment and the 2 questions',
  procedure: LOGIN_OPEN + '3. Enter "8" and "7" for the two criteria, leave the comment and both questions empty and click "Lưu".',
  expected:
    '1. The message "Vui lòng nhập Nhận xét, Câu hỏi 1, Câu hỏi 2 trước khi nộp phiếu." is displayed.\n' +
    '2. The API PUT /examiner-assignment/{id}/evaluation is not called.\n' +
    '3. ' + NOT_STORED,
  precondition: PRE_NEW + STALE,
});

const ITC399 = defineItc({
  id: 'ITC399', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_SUBMIT,
  description: 'Verify that a sheet cannot be submitted when question 2 contains only whitespace',
  procedure: LOGIN_OPEN + `3. Enter "8" and "7" for the two criteria, the comment "${COMMENT}", question 1 "${Q1}", question 2 "   " and click "Lưu".`,
  expected:
    '1. The message "Vui lòng nhập Câu hỏi 2 trước khi nộp phiếu." is displayed.\n' +
    '2. The API PUT /examiner-assignment/{id}/evaluation is not called.\n' +
    '3. ' + NOT_STORED,
  precondition: PRE_NEW + STALE,
});

const ITC400 = defineItc({
  id: 'ITC400', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_SUBMIT,
  description: 'Verify that submitting a complete sheet is rejected by the server when the grading window is not configured',
  procedure: LOGIN_OPEN + `3. Enter "8" and "7" for the two criteria, the comment "${COMMENT}", question 1 "${Q1}", question 2 "${Q2}", choose "Đủ điều kiện bảo vệ" and click "Lưu".`,
  expected:
    '1. The API PUT /examiner-assignment/{id}/evaluation is called as a submission with the entered scores, comment, questions and decision APPROVED; it returns HTTP 400 with code = 3064.\n' +
    `2. The response message "${MSG_NOT_CONFIGURED}" is displayed on the sheet.\n` +
    '3. "Đã nộp phiếu phản biện" is not displayed and the entered data stays on the sheet.\n' +
    '4. ' + NOT_STORED,
  precondition: PRE_NEW + STALE,
});

const ITC401 = defineItc({
  id: 'ITC401', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_DECIDE,
  description: 'Verify that the decision "Không đủ điều kiện bảo vệ" is sent with the draft and rejected by the server when the grading window is not configured',
  procedure: LOGIN_OPEN + '3. Choose "Không đủ điều kiện bảo vệ" and click "Lưu nháp".',
  expected:
    '1. The API PUT /examiner-assignment/{id}/evaluation is called as a draft with decision REJECTED and returns HTTP 400 with code = 3064.\n' +
    `2. The response message "${MSG_NOT_CONFIGURED}" is displayed on the sheet.\n` +
    '3. The database keeps the decision PENDING and the defense status of the student unchanged.',
  precondition: PRE_NEW + STALE,
});

const ITC402 = defineItc({
  id: 'ITC402', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_DECIDE,
  description: 'Verify that changing the decision before saving sends only the last choice',
  procedure: LOGIN_OPEN + '3. Choose "Không đủ điều kiện bảo vệ", then choose "Đủ điều kiện bảo vệ" and click "Lưu nháp".',
  expected:
    '1. The API PUT /examiner-assignment/{id}/evaluation is called once with decision APPROVED and returns HTTP 400 with code = 3064.\n' +
    `2. The response message "${MSG_NOT_CONFIGURED}" is displayed on the sheet.\n` +
    '3. The database keeps the decision PENDING and the defense status of the student unchanged.',
  precondition: PRE_NEW + STALE,
});

const ITC403 = defineItc({
  id: 'ITC403', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_EXPORT,
  description: 'Verify that an examiner can export the blank sheet of a student who has not been graded',
  procedure: '1. Log in as an Examiner.\n2. Open the grading sheet page of the student who has not been graded and click "Xuất phiếu chấm (.docx)".',
  expected:
    '1. The API GET /examiner-assignment/{id}/evaluation/export returns HTTP 200 with a Word (.docx) file.\n' +
    '2. A non-empty .docx file is downloaded.\n' +
    '3. ' + NOT_STORED,
  precondition: PRE_NEW,
});

const SEC123 = defineItcSec({
  id: 'TC-SEC-123', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'A student opens the examiner grading sheet and calls the save API',
  roleSession: 'Student (STUDENT), logged in',
  technique: 'EP',
  given: 'Logged in with a Student account',
  when: 'Open the URL of the examiner grading sheet directly; call PUT /examiner-assignment/{id}/evaluation with the Student session',
  then: 'The page shows "Tài khoản của bạn không có quyền truy cập cổng cán bộ."; PUT returns HTTP 403 with code = 2001; the sheet and decision are unchanged',
});

const SEC124 = defineItcSec({
  id: 'TC-SEC-124', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'An unauthenticated user opens the examiner grading sheet and calls the save API',
  roleSession: 'Not logged in (no session cookie)',
  technique: 'EP',
  given: 'The browser has no login session',
  when: 'Open the URL of the examiner grading sheet directly; call PUT /examiner-assignment/{id}/evaluation without a session',
  then: 'The browser is redirected to the login page; PUT returns HTTP 401 with code = 2000; the sheet and decision are unchanged',
});

const SEC125 = defineItcSec({
  id: 'TC-SEC-125', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'An examiner opens the grading sheet of the other examiner of the same student and tries to submit it',
  roleSession: 'Examiner (EXAMINER), logged in',
  technique: 'ERROR_GUESSING',
  given: 'Logged in as an Examiner; the student has another examiner',
  when: 'Open the URL of the other examiner\'s grading sheet directly; call PUT /examiner-assignment/{id}/evaluation on that sheet',
  then: `GET returns HTTP 403 with code = 3128 and the page shows "${MSG_PAGE_ERROR}"; PUT returns HTTP 403 with code = 3128 and message "${MSG_NOT_MINE}"; the other examiner's sheet and decision are unchanged`,
});

const SEC126 = defineItcSec({
  id: 'TC-SEC-126', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'An administrator opens the examiner grading sheet and calls the save API',
  roleSession: 'Administrator (ADMIN), logged in',
  technique: 'EP',
  given: 'Logged in with an Administrator account that has no lecturer role',
  when: 'Open the URL of the examiner grading sheet directly; call PUT /examiner-assignment/{id}/evaluation with the Administrator session',
  then: 'No Rubric is displayed; PUT returns HTTP 403 with code = 2001; the sheet and decision are unchanged',
});

// ============================================================================
// DỮ LIỆU & HÀM HỖ TRỢ
// ============================================================================

type Criterion = { criteriaPublicId: string; name: string; weight: number; score: number | null };
type Evaluation = {
  studentCode: string; studentName: string; topicName: string | null; councilCode: string; decision: string;
  question1: string | null; question2: string | null; gradingOpen: boolean; examinerScore: number | null;
  sheet: { status: string | null; generalComment: string | null; roundedTotalScore: number | null; groups: { criteria: Criterion[] }[] };
};
type MyAssignment = {
  examinerAssignmentPublicId: string; councilCode: string; studentCode: string; studentName: string;
  sheetStatus: string | null; decision: string; gradingOpen: boolean; editable: boolean; defenseStatus: string;
  coExaminer: { examinerAssignmentPublicId: string } | null;
};

const token = (request: APIRequestContext, role: 'EXAMINER' | 'STUDENT' | 'ADMIN') => {
  const email = process.env[`E2E_EMAIL_${role}`];
  if (!email) throw new Error(`Chưa cấu hình E2E_EMAIL_${role} trong .env.e2e`);
  return loginByEmail(request, email);
};

let fresh: MyAssignment; // sinh viên chưa chấm
let done: MyAssignment; // sinh viên đã nộp phiếu

async function loadContext(request: APIRequestContext) {
  const t = await token(request, 'EXAMINER');
  const cur = await apiCall(request, t, 'GET', '/semester/current');
  const semesterId = cur.body.data.publicId ?? cur.body.data.id;
  const my = await apiCall(request, t, 'GET', '/examiner-assignment/my', { params: { semesterId } });
  const mine = my.body.data as MyAssignment[];
  const f = mine.find((a) => !a.sheetStatus && a.decision === 'PENDING' && a.coExaminer && a.editable);
  const d = mine.find((a) => a.sheetStatus === 'SUBMITTED' && a.editable);
  expect(f, 'Cần 1 sinh viên chưa chấm, còn chờ quyết định, có 2 GVPB').toBeTruthy();
  expect(d, 'Cần 1 sinh viên đã nộp phiếu, chưa xếp ca bảo vệ').toBeTruthy();
  fresh = f!;
  done = d!;
  // Chốt an toàn: khung chấm mà mở thật thì bấm Lưu sẽ ghi dữ liệu không hoàn tác được → dừng
  for (const a of [fresh, done]) {
    expect(a.gradingOpen, 'Tiền điều kiện: khung chấm phản biện đang đóng (chưa thiết lập mốc)').toBe(false);
    expect(a.defenseStatus, 'Tiền điều kiện: sinh viên chưa xếp ca bảo vệ').not.toBe('SCHEDULED');
  }
}

// Toàn bộ dữ liệu chấm phản biện của sinh viên thuộc suất phản biện (cả 2 GVPB)
async function gradingState(examinerAssignmentId: string) {
  const topicId = (await slotRow(examinerAssignmentId)).topic_id;
  const slots = await dbSelect(
    `SELECT e.id, e.review_decision, e.decided_at, e.question_1, e.question_2 FROM examiner_assignment e
       JOIN defense_assignment d ON d.id = e.defense_assignment_id WHERE d.thesis_topic_id = ? ORDER BY e.id`, [topicId]);
  const sheets = await dbSelect(
    `SELECT id, evaluator_id, status, total_score, general_comment, submitted_at, updated_at, sheet_file_public_id
       FROM evaluation_sheet WHERE type = 'EXAMINER' AND thesis_topic_id = ? ORDER BY id`, [topicId]);
  const details = await dbSelect(
    `SELECT ed.id, ed.criteria_id, ed.score FROM evaluation_detail ed JOIN evaluation_sheet s ON s.id = ed.sheet_id
      WHERE s.type = 'EXAMINER' AND s.thesis_topic_id = ? ORDER BY ed.id`, [topicId]);
  const scores = await dbSelect(
    `SELECT examiner_score, CAST(examiner_passed AS UNSIGNED) AS passed FROM thesis_score WHERE thesis_topic_id = ?`, [topicId]);
  const status = await dbSelect(
    `SELECT d.defense_status, t.current_stage FROM defense_assignment d JOIN thesis_topic t ON t.id = d.thesis_topic_id WHERE t.id = ?`, [topicId]);
  return JSON.parse(JSON.stringify({ slots, sheets, details, scores, status }));
}

async function slotRow(publicId: string) {
  const rows = await dbSelect<{ review_decision: string; question_1: string | null; question_2: string | null; teacher_id: number; topic_id: number }>(
    `SELECT e.review_decision, e.question_1, e.question_2, m.teacher_id, d.thesis_topic_id AS topic_id
       FROM examiner_assignment e JOIN defense_council_member m ON m.id = e.council_member_id
       JOIN defense_assignment d ON d.id = e.defense_assignment_id WHERE e.public_id = UUID_TO_BIN(?)`, [publicId]);
  return rows[0];
}

async function mySheetRow(publicId: string) {
  const slot = await slotRow(publicId);
  const rows = await dbSelect<{ id: number; status: string; total_score: string; general_comment: string | null }>(
    `SELECT id, status, total_score, general_comment FROM evaluation_sheet
      WHERE type = 'EXAMINER' AND thesis_topic_id = ? AND evaluator_id = ?`, [slot.topic_id, slot.teacher_id]);
  return rows[0];
}

const pathOf = (r: Response | Request) => new URL(r.url()).pathname;
const evalPath = (id: string) => `/examiner-assignment/${id}/evaluation`;
const criteriaOf = (ev: Evaluation) => ev.sheet.groups.flatMap((g) => g.criteria);
const isGet = (id: string) => (r: Response) => r.request().method() === 'GET' && pathOf(r).endsWith(evalPath(id));
const isPut = (id: string) => (r: Response) => r.request().method() === 'PUT' && pathOf(r).endsWith(evalPath(id));

// Mọi request ghi của chức năng chấm phản biện gửi từ trang
function trackWrites(page: Page) {
  const writes: string[] = [];
  page.on('request', (r) => {
    if (['PUT', 'PATCH', 'POST'].includes(r.method()) && /\/examiner-assignment\//.test(pathOf(r))) writes.push(`${r.method()} ${pathOf(r)}`);
  });
  return writes;
}

// Trang phiếu chấm riêng
async function openSheetPage(page: Page, id: string) {
  const resPromise = page.waitForResponse(isGet(id));
  await page.goto(`${LIST_URL}/${id}`);
  return resPromise;
}

// Panel Rubric trên màn "Phản biện", mô phỏng form mở từ lúc khung chấm còn mở (chỉ đổi cờ gradingOpen ở trình duyệt)
async function openStaleForm(page: Page, a: MyAssignment): Promise<Evaluation> {
  const real = new Map<string, Evaluation>();
  await page.route(/\/examiner-assignment\/[^/]+\/evaluation$/, async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    const res = await route.fetch();
    const body = await res.json();
    if (body?.data) {
      real.set(/examiner-assignment\/([^/]+)\//.exec(route.request().url())![1], JSON.parse(JSON.stringify(body.data)));
      body.data.gradingOpen = true;
    }
    await route.fulfill({ response: res, json: body });
  });
  await page.goto(LIST_URL);
  await page.getByText(`${a.studentCode} · ${a.councilCode}`, { exact: true }).click();
  await expect(page.getByText('Mã sinh viên:').locator('..')).toContainText(a.studentCode);
  await expect(scoreInputs(page).first()).toBeEnabled();
  const ev = real.get(a.examinerAssignmentPublicId)!;
  expect(ev.gradingOpen, 'BE phải đang đóng khung chấm').toBe(false);
  expect(criteriaOf(ev).map((c) => Number(c.weight)), 'Rubric phản biện gồm 2 tiêu chí 50% – 50%').toEqual([50, 50]);
  return ev;
}

const scoreInputs = (page: Page) => page.getByRole('table').getByRole('textbox');
const commentBox = (page: Page) => page.getByPlaceholder('Ưu điểm, nhược điểm, mức độ hoàn thiện của đồ án...');
const q1Box = (page: Page) => page.getByPlaceholder('Câu hỏi phản biện thứ nhất dành cho sinh viên...');
const q2Box = (page: Page) => page.getByPlaceholder('Câu hỏi phản biện thứ hai dành cho sinh viên...');
const pageCommentBox = (page: Page) => page.getByPlaceholder('Nhập ưu điểm, nhược điểm, mức độ hoàn thành nội dung đồ án...');
const pageQ1Box = (page: Page) => page.getByPlaceholder('Câu hỏi chuyên môn thứ nhất...');
const pageQ2Box = (page: Page) => page.getByPlaceholder('Câu hỏi chuyên môn thứ hai...');
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

async function fillScores(page: Page, ...values: string[]) {
  for (let i = 0; i < values.length; i++) await scoreInputs(page).nth(i).fill(values[i]);
}

async function fillTexts(page: Page, comment: string, q1: string, q2: string) {
  await commentBox(page).fill(comment);
  await q1Box(page).fill(q1);
  await q2Box(page).fill(q2);
}

// Bấm nút lưu, BE thật trả lỗi chưa thiết lập mốc và giao diện hiện đúng message; trả về dữ liệu đã gửi
async function clickAndExpectNotConfigured(page: Page, a: MyAssignment, buttonName: string) {
  const resPromise = page.waitForResponse(isPut(a.examinerAssignmentPublicId));
  await button(page, buttonName).click();
  const res = await resPromise;
  expect(res.status()).toBe(400);
  const body = await res.json();
  expect(body.code).toBe(3064);
  expect(body.message).toBe(MSG_NOT_CONFIGURED);
  await expect(page.getByRole('alert').filter({ hasText: MSG_NOT_CONFIGURED })).toBeVisible();
  return res.request().postDataJSON();
}

async function expectBlockedOnForm(page: Page, message: string, writes: string[]) {
  await expect(page.getByRole('alert').filter({ hasText: message })).toBeVisible();
  expect(writes).toEqual([]);
}

const scorePayload = (ev: Evaluation, ...scores: number[]) =>
  expect.arrayContaining(criteriaOf(ev).map((c, i) => ({ criteriaPublicId: c.criteriaPublicId, score: scores[i] })));

async function putByApi(request: APIRequestContext, id: string, sessionToken?: string) {
  return request.put(`${getApiBaseUrl()}${evalPath(id)}`, {
    headers: sessionToken ? { Cookie: `access_token=${sessionToken}` } : {},
    data: { criteriaScores: [], generalComment: COMMENT, question1: Q1, question2: Q2, decision: 'APPROVED', submit: true },
  });
}

// ============================================================================
// TEST
// ============================================================================

let before: Record<string, unknown> = {};

test.beforeEach(async ({ request }) => {
  before = {};
  await loadContext(request);
  for (const a of [fresh, done]) before[a.examinerAssignmentPublicId] = await gradingState(a.examinerAssignmentPublicId);
});

// Không test nào được làm thay đổi dữ liệu (quyết định, câu hỏi, phiếu, điểm, trạng thái bảo vệ)
test.afterEach(async () => {
  for (const [id, state] of Object.entries(before)) expect(await gradingState(id)).toEqual(state);
});

test.describe('Chấm điểm phản biện (Giảng viên phản biện)', () => {
  test.use({ storageState: '.auth/examiner.json' });

  // ------------------------------------------------------------------ Xem phiếu
  test.describe(FN_VIEW, () => {
    test(ITC386.title, { annotation: ITC386.annotation }, async ({ page }) => {
      const res = await openSheetPage(page, fresh.examinerAssignmentPublicId);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      const ev = body.data as Evaluation;
      expect(ev.studentCode).toBe(fresh.studentCode);
      expect(ev.decision).toBe('PENDING');
      await expect(page.getByRole('heading', { name: fresh.studentName, exact: true })).toBeVisible();
      await expect(page.getByText(`MSSV: ${fresh.studentCode}`, { exact: true })).toBeVisible();
      await expect(page.getByText(`Hội đồng: ${fresh.councilCode}`, { exact: true })).toBeVisible();
      await expect(page.getByText('Tên đề tài:').locator('..')).toContainText(ev.topicName ?? 'Chưa có tên đề tài');
      await expect(page.getByText('Bản nháp', { exact: true })).toBeVisible();
      await expect(page.getByText('Chưa đủ 2 phiếu', { exact: true })).toBeVisible();
      await expect(page.getByText('Chưa có kết quả', { exact: true })).toBeVisible();
      const criteria = criteriaOf(ev);
      expect(criteria.length).toBeGreaterThan(0);
      expect(criteria.reduce((s, c) => s + Number(c.weight), 0)).toBe(100);
      await expect(scoreInputs(page)).toHaveCount(criteria.length);
      for (let i = 0; i < criteria.length; i++) {
        expect(criteria[i].score ?? null).toBeNull();
        const row = page.getByRole('row').filter({ hasText: criteria[i].name });
        await expect(row.getByRole('cell', { name: `${criteria[i].weight}%`, exact: true })).toBeVisible();
        await expect(scoreInputs(page).nth(i)).toHaveValue('');
      }
      await expect(page.getByText('0.0 / 10', { exact: true })).toBeVisible();
      expect(await mySheetRow(fresh.examinerAssignmentPublicId)).toBeUndefined();
    });

    test(ITC387.title, { annotation: ITC387.annotation }, async ({ page }) => {
      const res = await openSheetPage(page, done.examinerAssignmentPublicId);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect((body.data as Evaluation).sheet.status).toBe('SUBMITTED');
      const sheet = await mySheetRow(done.examinerAssignmentPublicId);
      const slot = await slotRow(done.examinerAssignmentPublicId);
      expect(sheet.status).toBe('SUBMITTED');
      const total = (Math.round(Number(sheet.total_score) * 10) / 10).toFixed(1);
      await expect(page.getByText(/^Đã nộp phiếu \(/)).toHaveText(new RegExp(`Đã nộp phiếu \\(\\s*${total}đ\\s*\\)`));
      await expect(pageCommentBox(page)).toHaveValue(sheet.general_comment ?? '');
      await expect(pageQ1Box(page)).toHaveValue(slot.question_1 ?? '');
      await expect(pageQ2Box(page)).toHaveValue(slot.question_2 ?? '');
      const saved = await dbSelect<{ name: string; score: string }>(
        `SELECT c.name, ed.score FROM evaluation_detail ed JOIN evaluation_criteria c ON c.id = ed.criteria_id WHERE ed.sheet_id = ?`, [sheet.id]);
      expect(saved.length).toBeGreaterThan(0);
      for (const s of saved) {
        await expect(page.getByRole('row').filter({ hasText: s.name }).getByRole('textbox')).toHaveValue(String(Number(s.score)));
      }
    });

    test(ITC388.title, { annotation: ITC388.annotation }, async ({ page }) => {
      const writes = trackWrites(page);
      const res = await openSheetPage(page, fresh.examinerAssignmentPublicId);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.data.gradingOpen).toBe(false);
      await expect(page.getByText('Phiếu chấm phản biện đang ở chế độ chỉ đọc:')).toBeVisible();
      for (const input of await scoreInputs(page).all()) await expect(input).toBeDisabled();
      await expect(pageCommentBox(page)).toBeDisabled();
      await expect(pageQ1Box(page)).toBeDisabled();
      await expect(pageQ2Box(page)).toBeDisabled();
      await expect(page.getByRole('button', { name: /^Đủ điều kiện bảo vệ/ })).toBeDisabled();
      await expect(page.getByRole('button', { name: /^Không đủ điều kiện bảo vệ/ })).toBeDisabled();
      await expect(button(page, 'Lưu nháp')).toHaveCount(0);
      await expect(button(page, 'Lưu')).toHaveCount(0);
      expect(writes).toEqual([]);
    });

    test(ITC389.title, { annotation: ITC389.annotation }, async ({ page }) => {
      const res = await openSheetPage(page, '00000000-0000-7000-8000-000000009999');
      expect(res.status()).toBe(404);
      const body = await res.json();
      expect(body.code).toBe(3127);
      expect(body.message).toBe('Không tìm thấy phân công phản biện');
      await expect(page.getByText(MSG_PAGE_ERROR)).toBeVisible();
      await expect(page.getByRole('table')).toHaveCount(0);
    });
  });

  // ------------------------------------------------------------------ Nhập điểm
  test.describe(FN_SCORE, () => {
    test(ITC390.title, { annotation: ITC390.annotation }, async ({ page }) => {
      const writes = trackWrites(page);
      const ev = await openStaleForm(page, fresh);
      await fillScores(page, '8.5', '7');
      const [c1, c2] = criteriaOf(ev);
      await expect(page.getByRole('row').filter({ hasText: c1.name }).getByRole('cell').nth(2)).toHaveText('4.3');
      await expect(page.getByRole('row').filter({ hasText: c2.name }).getByRole('cell').nth(2)).toHaveText('3.5');
      await expect(page.getByRole('row').filter({ hasText: 'TỔNG' }).getByRole('cell').last()).toHaveText('7.8 / 10');
      expect(writes).toEqual([]);
    });

    for (const [spec, value] of [[ITC391, '10.1'], [ITC392, '-0.1'], [ITC393, '8.55']] as const) {
      test(spec.title, { annotation: spec.annotation }, async ({ page }) => {
        const writes = trackWrites(page);
        await openStaleForm(page, fresh);
        await fillScores(page, value);
        await button(page, 'Lưu nháp').click();
        await expectBlockedOnForm(page, 'Có một số điểm tiêu chí chưa đúng định dạng. Vui lòng kiểm tra lại.', writes);
      });
    }
  });

  // ------------------------------------------------------------------ Lưu nháp
  test.describe(FN_DRAFT, () => {
    test(ITC394.title, { annotation: ITC394.annotation }, async ({ page }) => {
      const writes = trackWrites(page);
      const ev = await openStaleForm(page, fresh);
      await fillScores(page, '0', '10');
      await fillTexts(page, `  ${COMMENT}  `, '', '');
      const payload = await clickAndExpectNotConfigured(page, fresh, 'Lưu nháp');
      expect(payload).toEqual({
        criteriaScores: scorePayload(ev, 0, 10),
        generalComment: COMMENT, question1: null, question2: null, decision: null, submit: false,
      });
      expect(writes).toHaveLength(1);
      await expect(page.getByText('Đã lưu nháp phiếu phản biện')).toHaveCount(0);
      await expect(scoreInputs(page).nth(0)).toHaveValue('0');
      await expect(scoreInputs(page).nth(1)).toHaveValue('10');
    });

    test(ITC395.title, { annotation: ITC395.annotation }, async ({ page }) => {
      const writes = trackWrites(page);
      await openStaleForm(page, done);
      await button(page, 'Lưu nháp').click();
      const dialog = page.getByRole('dialog').filter({ hasText: 'Chuyển về bản nháp?' });
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: 'Hủy', exact: true }).click();
      await expect(dialog).toBeHidden();
      expect(writes).toEqual([]);
      expect((await mySheetRow(done.examinerAssignmentPublicId)).status).toBe('SUBMITTED');
    });

    test(ITC396.title, { annotation: ITC396.annotation }, async ({ page }) => {
      await openStaleForm(page, done);
      await button(page, 'Lưu nháp').click();
      await expect(page.getByRole('dialog').filter({ hasText: 'Chuyển về bản nháp?' })).toBeVisible();
      const payload = await clickAndExpectNotConfigured(page, done, 'Chuyển về nháp');
      expect(payload.submit).toBe(false);
      expect((await mySheetRow(done.examinerAssignmentPublicId)).status).toBe('SUBMITTED');
    });
  });

  // ------------------------------------------------------------------ Nộp phiếu
  test.describe(FN_SUBMIT, () => {
    test(ITC397.title, { annotation: ITC397.annotation }, async ({ page }) => {
      const writes = trackWrites(page);
      await openStaleForm(page, fresh);
      await fillScores(page, '8');
      await fillTexts(page, COMMENT, Q1, Q2);
      await button(page, 'Lưu').click();
      await expectBlockedOnForm(page, 'Vui lòng chấm điểm đầy đủ và hợp lệ cho tất cả các tiêu chí trước khi nộp phiếu.', writes);
    });

    test(ITC398.title, { annotation: ITC398.annotation }, async ({ page }) => {
      const writes = trackWrites(page);
      await openStaleForm(page, fresh);
      await fillScores(page, '8', '7');
      await fillTexts(page, '', '', '');
      await button(page, 'Lưu').click();
      await expectBlockedOnForm(page, 'Vui lòng nhập Nhận xét, Câu hỏi 1, Câu hỏi 2 trước khi nộp phiếu.', writes);
    });

    test(ITC399.title, { annotation: ITC399.annotation }, async ({ page }) => {
      const writes = trackWrites(page);
      await openStaleForm(page, fresh);
      await fillScores(page, '8', '7');
      await fillTexts(page, COMMENT, Q1, '   ');
      await button(page, 'Lưu').click();
      await expectBlockedOnForm(page, 'Vui lòng nhập Câu hỏi 2 trước khi nộp phiếu.', writes);
    });

    test(ITC400.title, { annotation: ITC400.annotation }, async ({ page }) => {
      const ev = await openStaleForm(page, fresh);
      await fillScores(page, '8', '7');
      await fillTexts(page, COMMENT, Q1, Q2);
      await button(page, 'Đủ điều kiện bảo vệ').click();
      const payload = await clickAndExpectNotConfigured(page, fresh, 'Lưu');
      expect(payload).toEqual({
        criteriaScores: scorePayload(ev, 8, 7),
        generalComment: COMMENT, question1: Q1, question2: Q2, decision: 'APPROVED', submit: true,
      });
      await expect(page.getByText('Đã nộp phiếu phản biện')).toHaveCount(0);
      await expect(scoreInputs(page).nth(0)).toHaveValue('8');
      await expect(commentBox(page)).toHaveValue(COMMENT);
      await expect(q1Box(page)).toHaveValue(Q1);
      await expect(q2Box(page)).toHaveValue(Q2);
    });
  });

  // ------------------------------------------------------------------ Quyết định
  test.describe(FN_DECIDE, () => {
    test(ITC401.title, { annotation: ITC401.annotation }, async ({ page }) => {
      await openStaleForm(page, fresh);
      await button(page, 'Không đủ điều kiện bảo vệ').click();
      const payload = await clickAndExpectNotConfigured(page, fresh, 'Lưu nháp');
      expect(payload.decision).toBe('REJECTED');
      expect(payload.submit).toBe(false);
      expect((await slotRow(fresh.examinerAssignmentPublicId)).review_decision).toBe('PENDING');
    });

    test(ITC402.title, { annotation: ITC402.annotation }, async ({ page }) => {
      const writes = trackWrites(page);
      await openStaleForm(page, fresh);
      await button(page, 'Không đủ điều kiện bảo vệ').click();
      await button(page, 'Đủ điều kiện bảo vệ').click();
      const payload = await clickAndExpectNotConfigured(page, fresh, 'Lưu nháp');
      expect(payload.decision).toBe('APPROVED');
      expect(writes).toHaveLength(1);
      expect((await slotRow(fresh.examinerAssignmentPublicId)).review_decision).toBe('PENDING');
    });
  });

  // ------------------------------------------------------------------ Xuất phiếu
  test.describe(FN_EXPORT, () => {
    test(ITC403.title, { annotation: ITC403.annotation }, async ({ page }) => {
      await openSheetPage(page, fresh.examinerAssignmentPublicId);
      const resPromise = page.waitForResponse((r) => r.request().method() === 'GET'
        && pathOf(r).endsWith(`${evalPath(fresh.examinerAssignmentPublicId)}/export`));
      const downloadPromise = page.waitForEvent('download');
      await button(page, 'Xuất phiếu chấm (.docx)').click();
      const res = await resPromise;
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toContain('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.docx$/);
      let size = 0;
      for await (const chunk of await download.createReadStream()) size += (chunk as Buffer).length;
      expect(size).toBeGreaterThan(0);
    });
  });
});

// ------------------------------------------------------------------ Security
test.describe('SecurityTest - Chấm điểm phản biện', () => {
  test.describe('Sinh viên', () => {
    test.use({ storageState: '.auth/student.json' });
    test(SEC123.title, { annotation: SEC123.annotation }, async ({ page, request }) => {
      await page.goto(`${LIST_URL}/${fresh.examinerAssignmentPublicId}`);
      await expect(page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.')).toBeVisible();
      await expect(page.getByRole('table')).toHaveCount(0);
      const res = await putByApi(request, fresh.examinerAssignmentPublicId, await token(request, 'STUDENT'));
      expect(res.status()).toBe(403);
      expect((await res.json()).code).toBe(2001);
    });
  });

  test.describe('Chưa đăng nhập', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test(SEC124.title, { annotation: SEC124.annotation }, async ({ page, playwright }) => {
      await page.goto(`${LIST_URL}/${fresh.examinerAssignmentPublicId}`);
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByRole('table')).toHaveCount(0);
      // Context riêng: fixture request có thể đã giữ cookie do /login-postman đặt trong beforeEach
      const anonymous = await playwright.request.newContext();
      try {
        const res = await putByApi(anonymous, fresh.examinerAssignmentPublicId);
        expect(res.status()).toBe(401);
        expect((await res.json()).code).toBe(2000);
      } finally {
        await anonymous.dispose();
      }
    });
  });

  test.describe('GVPB còn lại', () => {
    test.use({ storageState: '.auth/examiner.json' });
    test(SEC125.title, { annotation: SEC125.annotation }, async ({ page, request }) => {
      const otherId = fresh.coExaminer!.examinerAssignmentPublicId;
      const res = await openSheetPage(page, otherId);
      expect(res.status()).toBe(403);
      expect((await res.json()).code).toBe(3128);
      await expect(page.getByText(MSG_PAGE_ERROR)).toBeVisible();
      await expect(page.getByRole('table')).toHaveCount(0);
      const put = await putByApi(request, otherId, await token(request, 'EXAMINER'));
      expect(put.status()).toBe(403);
      const body = await put.json();
      expect(body.code).toBe(3128);
      expect(body.message).toBe(MSG_NOT_MINE);
    });
  });

  test.describe('Quản trị viên', () => {
    test.use({ storageState: '.auth/admin.json' });
    test(SEC126.title, { annotation: SEC126.annotation }, async ({ page, request }) => {
      const myInfo = page.waitForResponse((r) => pathOf(r).endsWith('/my-info'));
      await page.goto(`${LIST_URL}/${fresh.examinerAssignmentPublicId}`);
      await myInfo;
      await page.waitForLoadState('networkidle');
      await expect(page.getByPlaceholder('0 – 10')).toHaveCount(0);
      const res = await putByApi(request, fresh.examinerAssignmentPublicId, await token(request, 'ADMIN'));
      expect(res.status()).toBe(403);
      expect((await res.json()).code).toBe(2001);
    });
  });
});
