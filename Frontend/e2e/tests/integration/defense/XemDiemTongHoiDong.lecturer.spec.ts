import { readFile } from 'node:fs/promises';
import { test, expect, type APIRequestContext, type Locator, type Page, type Response } from '@playwright/test';
import { defineItc, defineItcSec } from '../../../support/integration-test-case';
import { apiCall, getApiBaseUrl, loginByEmail } from '../../../support/api';
import { dbSelect } from '../../../support/db';

// ============================================================================
// ĐẶC TẢ TEST CASE (ITC423..ITC429, ITC431, ITC432 & TC-SEC-127..TC-SEC-131)
// Feature: defense | Module/Sheet: XemDiemTongHoiDong
// Role: Chủ tịch / Thư ký hội đồng
// Màn hình: "/lecturer/defense/councils/{hội đồng}?tab=summary" (tab "Tổng hợp").
// Tài khoản Thư ký "Nguyễn Kỹ thuật phần mềm" là Thư ký "HD KTPM 01". Mọi thao tác chỉ ĐỌC nên không có dữ liệu cần dọn;
// dữ liệu được đối chiếu bằng DB (SELECT).
// Chạy ở MockMvc (XemDiemTongHoiDongIntegrationTest, tự rollback), không chạy được trên giao diện:
// - Vai Chủ tịch / Ủy viên (ITC430, ITC435, TC-SEC-132): .env.e2e chưa có tài khoản Chủ tịch / Ủy viên của hội đồng nào;
//   không tạo hội đồng test qua API được vì mốc "Thành lập hội đồng" chưa thiết lập (code 3064), cũng không xóa lại được.
// - Bảng điểm từng sinh viên GET /defense-score/{id} (ITC433, ITC434, ITC443): FE có gọi API nhưng thẻ
//   DefenseScoreBoardCard không được gắn vào màn hình nào.
// - Các trạng thái điểm khác (ITC436–ITC442): cần ghi phiếu chấm không có API xóa.
// - ITC444, TC-SEC-133: giao diện không tạo ra được request / phiên tương ứng.
// ============================================================================

const FEATURE = 'defense';
const MODULE = 'XemDiemTongHoiDong';
const SHEET = 'XemDiemTongHoiDong';

const FN_VIEW = 'View Council Total Scores';
const FN_EXPORT = 'Export Council Score Sheet';

const PASS_CODE = '99B14001';
const FAIL_CODE = '99B14002';
const NEW_CODE = '99B14003';
const PASS_NAME = 'SV1 Test Đạt';
const NEW_NAME = 'SV3 Test Mới';
const COUNCIL_CODE = 'KTPM202601';

const CHAIR = 'Lê Hoàng Nam';
const SECRETARY = 'Nguyễn Kỹ thuật phần mềm';
const MEMBER_KHOA = 'Lê Văn Khoa';
const MEMBER_YEN = 'Hoàng Thị Yến';
const MEMBER_THAO = 'Lý Thị Thanh Thảo';
const ALL_MEMBERS = [CHAIR, SECRETARY, MEMBER_KHOA, MEMBER_YEN, MEMBER_THAO];

const UNKNOWN_ID = '00000000-0000-7000-8000-000000000000';

const PRE_COUNCIL =
  '1. The lecturer "Nguyễn Kỹ thuật phần mềm" is the Secretary of council "HD KTPM 01" (code "KTPM202601"), which is published; its Chairperson is "Lê Hoàng Nam" and its members are "Lê Văn Khoa", "Hoàng Thị Yến", "Lý Thị Thanh Thảo".';
const PRE_PASS =
  PRE_COUNCIL +
  '\n2. The defense of student "SV1 Test Đạt" (99B14001) is completed; submitted scores: supervisor 8.0; examiners "Hoàng Thị Yến" 7.0 and "Lê Văn Khoa" 5.6; council "Lê Hoàng Nam" 8.0, "Nguyễn Kỹ thuật phần mềm" 8.0, "Lê Văn Khoa" 9.0, "Hoàng Thị Yến" 8.0, "Lý Thị Thanh Thảo" 6.0.';
const PRE_FAIL =
  PRE_COUNCIL +
  '\n2. The defense of student "SV2 Test Trượt" (99B14002) is completed; submitted scores: supervisor 6.0; examiners "Hoàng Thị Yến" 6.0 and "Lê Văn Khoa" 5.0; council "Lý Thị Thanh Thảo" 6.0, the other four members 5.0.';
const PRE_NEW =
  PRE_COUNCIL +
  '\n2. Student "SV3 Test Mới" (99B14003) is scheduled for defense; both examiner sheets are submitted with 7.5; the supervisor sheet is a draft; no council member has graded; no defense minutes exist.';
const LOGIN_SEC = '1. Log in as the Council Secretary.\n';
const OPEN_SUMMARY = '2. Open council "HD KTPM 01" and select the "Tổng hợp" tab.\n';
const API_OK = '1. The API GET /defense-council/{id of "HD KTPM 01"}/defense-score returns HTTP 200 with code = 1000';

const ITC423 = defineItc({
  id: 'ITC423', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_VIEW,
  description: 'Verify that the Council Secretary sees only the students who passed the review, in defense order, on the score summary',
  procedure:
    LOGIN_SEC + '2. Open the "Hội đồng" list, click "Vào chi tiết" on council "KTPM202601".\n3. Select the "Tổng hợp" tab.',
  expected:
    API_OK + '.\n' +
    '2. The response and the table contain exactly 3 students in the order "99B14001", "99B14002", "99B14003"; students "2251190001" to "2251190004" who have not passed the review are not listed.\n' +
    '3. The title "Tổng hợp kết quả bảo vệ — KTPM202601" is displayed.\n' +
    '4. The database has the same 3 students of the council at the review-passed stage or later, in the same defense order.',
  precondition: PRE_COUNCIL + '\n2. The council has 7 students: 3 passed the review and 4 have not passed it yet.',
});

const ITC424 = defineItc({
  id: 'ITC424', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_VIEW,
  description: 'Verify that the Council Secretary sees every individual score, the council average, the final score and the result of a student who passed the defense',
  procedure: LOGIN_SEC + OPEN_SUMMARY + '3. Read the row of "SV1 Test Đạt" (99B14001).',
  expected:
    API_OK + '; 5 council sheets are submitted, the council score is 7.8, the final score is 7.5, the result is PASSED and no score is hidden.\n' +
    '2. The row displays "Điểm HD" 8.0, "Điểm PB 1" 7.0, "Điểm PB 2" 5.6, the council scores of "Lê Hoàng Nam" 8.0, "Nguyễn Kỹ thuật phần mềm" 8.0, "Lê Văn Khoa" 9.0, "Hoàng Thị Yến" 8.0, "Lý Thị Thanh Thảo" 6.0, "Điểm TB HĐ" 7.8 and "Điểm tổng kết" 7.5.\n' +
    '3. The row displays the result "Đạt" with "Đã hoàn tất", minutes "Đã nộp", post-defense revision "Chờ nộp" and "✓ Hoàn tất".\n' +
    '4. The displayed individual scores equal the submitted sheets stored in the database.',
  precondition: PRE_PASS,
});

const ITC425 = defineItc({
  id: 'ITC425', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_VIEW,
  description: 'Verify that the Council Secretary sees the final score and the failed result of a student who failed the defense',
  procedure: LOGIN_SEC + OPEN_SUMMARY + '3. Read the row of "SV2 Test Trượt" (99B14002).',
  expected:
    API_OK + '; the council score is 5.2, the final score is 5.4 and the result is FAILED.\n' +
    '2. The row displays "Điểm HD" 6.0, "Điểm PB 1" 6.0, "Điểm PB 2" 5.0, the council scores of "Lý Thị Thanh Thảo" 6.0 and of the other four members 5.0, "Điểm TB HĐ" 5.2 and "Điểm tổng kết" 5.4.\n' +
    '3. The row displays the result "Không đạt" and post-defense revision "Không yêu cầu".\n' +
    '4. The displayed individual scores equal the submitted sheets stored in the database.',
  precondition: PRE_FAIL,
});

const ITC426 = defineItc({
  id: 'ITC426', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_VIEW,
  description: 'Verify that no council average or final score is displayed for a student whose council has not graded yet',
  procedure: LOGIN_SEC + OPEN_SUMMARY + '3. Read the row of "SV3 Test Mới" (99B14003).',
  expected:
    API_OK + '; 0 council sheets are submitted, the council score and final score are empty, the result is PENDING and the draft supervisor sheet carries no score.\n' +
    '2. The row displays "Điểm HD" "Nháp", "Điểm PB 1" 7.5, "Điểm PB 2" 7.5, "Chưa chấm" for all 5 council members, "—" for "Điểm TB HĐ" and "Điểm tổng kết".\n' +
    '3. The row displays the result "Chưa đủ điểm", minutes "Chưa lập", post-defense revision "Không yêu cầu" and a disabled "Hoàn tất" button; "Chốt kết quả hội đồng (0)" is disabled.\n' +
    '4. The database has no council sheet for the student.',
  precondition: PRE_NEW,
});

const ITC427 = defineItc({
  id: 'ITC427', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_VIEW,
  description: 'Verify that scores deviating by 1.5 or more are marked with a warning on the score summary',
  procedure: LOGIN_SEC + OPEN_SUMMARY + '3. Hover over the scores in the row of "SV1 Test Đạt" (99B14001).',
  expected:
    API_OK + ' and flags exactly 2 deviated scores of the student: council score 6.0 of "Lý Thị Thanh Thảo" and examiner score 5.6 of "Lê Văn Khoa".\n' +
    '2. The council score 6.0 has the warning "Cảnh báo: lệch 1.80 điểm (Bước 1 – lệch so với TB 5 điểm Hội đồng) – vẫn được tính, người chấm có thể tự sửa phiếu".\n' +
    '3. The examiner score 5.6 has the warning "Cảnh báo: lệch 2.20 điểm (Bước 2 – lệch so với TB 5 điểm Hội đồng) – vẫn được tính, người chấm có thể tự sửa phiếu".\n' +
    '4. The supervisor score 8.0 has no warning and shows "Lệch 0.63 điểm".',
  precondition: PRE_PASS,
});

const ITC428 = defineItc({
  id: 'ITC428', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_VIEW,
  description: 'Verify that the score summary explains deviated scores as warnings that are still included in the averages',
  procedure: LOGIN_SEC + OPEN_SUMMARY + '3. Read the note below the title and the row of "SV1 Test Đạt" (99B14001).',
  expected:
    API_OK + '; the council score 7.8 and the final score 7.5 include the deviated scores 6.0 and 5.6.\n' +
    '2. The note does not state that deviated scores are "bị loại khỏi điểm trung bình".',
  precondition: PRE_PASS,
});

const ITC429 = defineItc({
  id: 'ITC429', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_VIEW,
  description: 'Verify that the scores displayed for students with a completed defense equal the official result stored by the system',
  procedure: LOGIN_SEC + OPEN_SUMMARY + '3. Read "Điểm TB HĐ" and "Điểm tổng kết" of "SV1 Test Đạt" (99B14001) and "SV2 Test Trượt" (99B14002).',
  expected:
    API_OK + '.\n' +
    '2. For both students, the displayed "Điểm TB HĐ" and "Điểm tổng kết" equal the official council score and final score stored in the database.',
  precondition: PRE_COUNCIL + '\n2. The defenses of "SV1 Test Đạt" (99B14001) and "SV2 Test Trượt" (99B14002) are completed, so their scores are locked.',
});

const ITC431 = defineItc({
  id: 'ITC431', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_VIEW,
  description: 'Verify that no score is displayed when the Council Secretary opens the score summary of a council that does not exist',
  procedure: LOGIN_SEC + '2. Open the score summary URL of a council id that does not exist.',
  expected:
    '1. The API GET /defense-council/{unknown id}/examiner returns HTTP 404 with code = 3101 and the message "Không tìm thấy Hội đồng bảo vệ".\n' +
    '2. The screen displays "Không tìm thấy thông tin hội đồng hoặc bạn không có quyền xem thông tin hội đồng này."; the API GET /defense-council/{unknown id}/defense-score is not called.\n' +
    '3. The database has no council with that id.',
  precondition: '1. The Council Secretary has an active account.\n2. The council id does not exist in the system.',
});

const ITC432 = defineItc({
  id: 'ITC432', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_EXPORT,
  description: 'Verify that the Council Secretary can export the council score sheet with the same scores as the summary table',
  procedure: LOGIN_SEC + OPEN_SUMMARY + '3. Click "Xuất bảng điểm".',
  expected:
    API_OK + '.\n' +
    '2. The file "Bang_diem_KTPM202601.csv" is downloaded and the message "Đã xuất file bảng điểm CSV." is displayed.\n' +
    '3. The file has 1 header row and 3 student rows: "99B14001" with 8.0, 7.0, 5.6, council scores, 7.8, 7.5, "Dat"; "99B14002" with 6.0, 6.0, 5.0, council scores, 5.2, 5.4, "Khong dat"; "99B14003" with examiner scores 7.5, 7.5 and no average, final score or result.\n' +
    '4. No data is changed: the sheets stored in the database remain the same.',
  precondition: PRE_PASS + '\n3. "SV2 Test Trượt" (99B14002) failed the defense; "SV3 Test Mới" (99B14003) has not been graded by the council.',
});

const SUMMARY_WHEN = 'Open the "Tổng hợp" screen of "HD KTPM 01" by URL; send GET /defense-council/{id of "HD KTPM 01"}/defense-score with this session';

const SEC127 = defineItcSec({
  id: 'TC-SEC-127', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'A student views the total scores of a defense council',
  roleSession: 'Student (STUDENT), logged in',
  technique: 'EP',
  given: 'Logged in with a Student account',
  when: SUMMARY_WHEN,
  then: 'The screen displays "Tài khoản của bạn không có quyền truy cập cổng cán bộ." and no score; the API returns HTTP 403 with code = 2001 and no score data',
});

const SEC128 = defineItcSec({
  id: 'TC-SEC-128', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'An unauthenticated visitor views the total scores of a defense council',
  roleSession: 'Not logged in (no session cookie)',
  technique: 'EP',
  given: 'The browser has no login session',
  when: SUMMARY_WHEN,
  then: 'The browser is redirected to the login page; the API returns HTTP 401 with code = 2000 and no score data',
});

const SEC129 = defineItcSec({
  id: 'TC-SEC-129', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'A lecturer outside the council views its total scores',
  roleSession: 'Supervisor (SUPERVISOR) who is not a member of "HD KTPM 01", logged in',
  technique: 'EP',
  given: 'Logged in with a lecturer account that does not belong to "HD KTPM 01"',
  when: SUMMARY_WHEN,
  then: 'The screen displays "Không tìm thấy thông tin hội đồng hoặc bạn không có quyền xem thông tin hội đồng này." and no score; the API returns HTTP 403 with code = 2001, message "Bạn không có quyền xem bảng điểm bảo vệ của sinh viên này" and no score data',
});

const SEC130 = defineItcSec({
  id: 'TC-SEC-130', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'The total scores are requested with a tampered session token',
  roleSession: 'Council Secretary session with a modified token signature',
  technique: 'ERROR_GUESSING',
  given: 'The session token of the Council Secretary has been modified',
  when: SUMMARY_WHEN,
  then: 'The browser is redirected to the login page and no score is displayed; the API returns HTTP 401 with code = 2000 and no score data',
});

const SEC131 = defineItcSec({
  id: 'TC-SEC-131', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'The total scores are requested with a session that has been logged out',
  roleSession: 'Council Secretary session after logging out',
  technique: 'STATE_TRANSITION',
  given: 'The Council Secretary has logged out, the old token is reused',
  when: SUMMARY_WHEN,
  then: 'The browser is redirected to the login page and no score is displayed; the API returns HTTP 401 with code = 2000 and no score data',
});

// ============================================================================
// HÀM HỖ TRỢ
// ============================================================================

let councilId = '';

type Role = 'SECRETARY' | 'STUDENT' | 'CHAIRPERSON';
const emailOf = (role: Role) => {
  const email = process.env[`E2E_EMAIL_${role}`];
  if (!email) throw new Error(`Chưa cấu hình E2E_EMAIL_${role} trong .env.e2e`);
  return email.trim();
};
const token = (request: APIRequestContext, role: Role) => loginByEmail(request, emailOf(role));

const summaryUrl = (id: string) => `/lecturer/defense/councils/${id}?tab=summary`;
const scorePath = (id: string) => `/defense-council/${id}/defense-score`;
const isScoreGet = (id: string) => (r: Response) =>
  r.request().method() === 'GET' && new URL(r.url()).pathname.endsWith(scorePath(id));

function trackScoreCalls(page: Page) {
  const s = { count: 0 };
  page.on('request', (r) => {
    if (/\/defense-council\/[^/]+\/defense-score$/.test(new URL(r.url()).pathname)) s.count += 1;
  });
  return s;
}

// Phiếu chấm của sinh viên, đọc thẳng DB
const sheetsOf = (studentCode: string) =>
  dbSelect<{ type: string; status: string; evaluator: string; score: string | null }>(
    `SELECT es.type, es.status, CONCAT(a.first_name, ' ', a.last_name) AS evaluator, es.total_score AS score
       FROM evaluation_sheet es
       JOIN teacher t ON t.id = es.evaluator_id JOIN account a ON a.id = t.account_id
       JOIN thesis_topic tt ON tt.id = es.thesis_topic_id JOIN student s ON s.id = tt.student_id
      WHERE s.student_code = ? ORDER BY es.type, es.id`, [studentCode]);

const dbScore = async (code: string, type: string, evaluator: string) => {
  const row = (await sheetsOf(code)).find((r) => r.type === type && r.evaluator === evaluator && r.status === 'SUBMITTED');
  return row?.score == null ? undefined : Number(row.score).toFixed(1);
};

const itemOf = (body: any, code: string) => body.data.find((x: any) => x.studentCode === code);

async function openSummary(page: Page, id: string) {
  const resPromise = page.waitForResponse(isScoreGet(id));
  await page.goto(summaryUrl(id));
  const res = await resPromise;
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.code).toBe(1000);
  await expect(page.getByRole('heading', { name: /^Tổng hợp kết quả bảo vệ/ })).toBeVisible();
  return body;
}

const rowOf = (page: Page, code: string) => page.getByRole('row').filter({ hasText: code });
const COL = { advisor: 3, ex1: 4, ex2: 5, council: 11, final: 12, result: 13, minutes: 14, revision: 15, action: 16 };
const cell = (row: Locator, idx: number) => row.getByRole('cell').nth(idx);

// Cột điểm của từng thành viên Hội đồng, tìm theo tiêu đề cột (tooltip là họ tên)
async function memberCol(page: Page, fullName: string) {
  const titles = await page.getByRole('columnheader').evaluateAll((els) => els.map((e) => e.getAttribute('title')));
  const idx = titles.indexOf(fullName);
  expect(idx, `Không có cột điểm của "${fullName}"`).toBeGreaterThan(5);
  return idx;
}

async function expectScores(page: Page, code: string, exp: {
  advisor: string; ex: [string, string]; council: Record<string, string>; avg: string; final: string;
}) {
  const row = rowOf(page, code);
  await expect(cell(row, COL.advisor)).toHaveText(exp.advisor);
  await expect(cell(row, COL.ex1)).toContainText(exp.ex[0]);
  await expect(cell(row, COL.ex2)).toContainText(exp.ex[1]);
  for (const [name, score] of Object.entries(exp.council)) {
    await expect(cell(row, await memberCol(page, name)), `Điểm Hội đồng của ${name}`).toHaveText(score);
  }
  await expect(cell(row, COL.council)).toHaveText(exp.avg);
  await expect(cell(row, COL.final)).toHaveText(exp.final);
}

async function exportCsv(page: Page) {
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất bảng điểm' }).click();
  const file = await dl;
  const text = (await readFile(await file.path(), 'utf8')).replace(/^﻿/, '');
  return { name: file.suggestedFilename(), lines: text.split('\n').filter((l) => l !== '') };
}

// ============================================================================
// TEST
// ============================================================================

test.beforeAll(async ({ request }) => {
  const my = await apiCall(request, await token(request, 'SECRETARY'), 'GET', '/defense-council/my');
  const c = my.body.data.find((x: any) => x.name === 'HD KTPM 01');
  expect(c?.myRole, 'Tiền điều kiện: tài khoản Thư ký là Thư ký HD KTPM 01').toBe('SECRETARY');
  councilId = c.councilPublicId;
  const council = (code: string) => sheetsOf(code).then((r) => r.filter((x) => x.type === 'COUNCIL' && x.status === 'SUBMITTED'));
  expect(await council(PASS_CODE), 'Tiền điều kiện: 99B14001 đủ 5 phiếu Hội đồng').toHaveLength(5);
  expect(await council(FAIL_CODE), 'Tiền điều kiện: 99B14002 đủ 5 phiếu Hội đồng').toHaveLength(5);
  expect(await council(NEW_CODE), 'Tiền điều kiện: 99B14003 chưa có phiếu Hội đồng').toHaveLength(0);
});

test.describe('Xem điểm tổng Hội đồng (Thư ký)', () => {
  test.use({ storageState: '.auth/secretary.json' });

  test.describe(FN_VIEW, () => {
    test(ITC423.title, { annotation: ITC423.annotation }, async ({ page }) => {
      await page.goto('/lecturer/defense/councils');
      await rowOf(page, COUNCIL_CODE).getByRole('button', { name: 'Vào chi tiết' }).click();
      const resPromise = page.waitForResponse(isScoreGet(councilId));
      await page.getByRole('button', { name: 'Tổng hợp' }).click();
      const res = await resPromise;
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      const codes = [PASS_CODE, FAIL_CODE, NEW_CODE];
      expect(body.data.map((x: any) => x.studentCode)).toEqual(codes);

      await expect(page.getByRole('heading', { name: `Tổng hợp kết quả bảo vệ — ${COUNCIL_CODE}` })).toBeVisible();
      const rows = page.locator('tbody').getByRole('row');
      await expect(rows).toHaveCount(3);
      for (let i = 0; i < 3; i++) await expect(rows.nth(i)).toContainText(codes[i]);
      for (const code of ['2251190001', '2251190002', '2251190003', '2251190004']) {
        await expect(rowOf(page, code)).toHaveCount(0);
      }
      const db = await dbSelect<{ student_code: string }>(
        `SELECT s.student_code FROM defense_assignment d JOIN defense_council dc ON dc.id = d.council_id
           JOIN thesis_topic tt ON tt.id = d.thesis_topic_id JOIN student s ON s.id = tt.student_id
          WHERE dc.code = ? AND tt.current_stage IN ('STAGE_5_REVIEW_PASSED', 'STAGE_6_DEFENSE_COMPLETED')
          ORDER BY d.slot_order`, [COUNCIL_CODE]);
      expect(db.map((r) => r.student_code)).toEqual(codes);
    });

    test(ITC424.title, { annotation: ITC424.annotation }, async ({ page }) => {
      const body = await openSummary(page, councilId);
      const b = itemOf(body, PASS_CODE).board;
      expect(b).toMatchObject({ submittedCouncilCount: 5, councilScore: 7.8, finalScore: 7.5, result: 'PASSED', scoreHidden: false });
      const council = { [CHAIR]: '8.0', [SECRETARY]: '8.0', [MEMBER_KHOA]: '9.0', [MEMBER_YEN]: '8.0', [MEMBER_THAO]: '6.0' };
      await expectScores(page, PASS_CODE, { advisor: '8.0', ex: ['7.0', '5.6'], council, avg: '7.8', final: '7.5' });
      const row = rowOf(page, PASS_CODE);
      await expect(cell(row, COL.result).getByText('Đạt', { exact: true })).toBeVisible();
      await expect(cell(row, COL.result)).toContainText('Đã hoàn tất');
      await expect(cell(row, COL.minutes)).toHaveText('Đã nộp');
      await expect(cell(row, COL.revision)).toHaveText('Chờ nộp');
      await expect(cell(row, COL.action)).toHaveText('✓ Hoàn tất');

      expect(await dbScore(PASS_CODE, 'ADVISOR', SECRETARY)).toBe('8.0');
      expect(await dbScore(PASS_CODE, 'EXAMINER', MEMBER_YEN)).toBe('7.0');
      expect(await dbScore(PASS_CODE, 'EXAMINER', MEMBER_KHOA)).toBe('5.6');
      for (const [name, score] of Object.entries(council)) expect(await dbScore(PASS_CODE, 'COUNCIL', name)).toBe(score);
    });

    test(ITC425.title, { annotation: ITC425.annotation }, async ({ page }) => {
      const body = await openSummary(page, councilId);
      expect(itemOf(body, FAIL_CODE).board).toMatchObject({ councilScore: 5.2, finalScore: 5.4, result: 'FAILED' });
      const council = { [CHAIR]: '5.0', [SECRETARY]: '5.0', [MEMBER_KHOA]: '5.0', [MEMBER_YEN]: '5.0', [MEMBER_THAO]: '6.0' };
      await expectScores(page, FAIL_CODE, { advisor: '6.0', ex: ['6.0', '5.0'], council, avg: '5.2', final: '5.4' });
      const row = rowOf(page, FAIL_CODE);
      await expect(cell(row, COL.result)).toContainText('Không đạt');
      await expect(cell(row, COL.revision)).toHaveText('Không yêu cầu');

      expect(await dbScore(FAIL_CODE, 'ADVISOR', SECRETARY)).toBe('6.0');
      expect(await dbScore(FAIL_CODE, 'EXAMINER', MEMBER_YEN)).toBe('6.0');
      expect(await dbScore(FAIL_CODE, 'EXAMINER', MEMBER_KHOA)).toBe('5.0');
      for (const [name, score] of Object.entries(council)) expect(await dbScore(FAIL_CODE, 'COUNCIL', name)).toBe(score);
    });

    test(ITC426.title, { annotation: ITC426.annotation }, async ({ page }) => {
      const body = await openSummary(page, councilId);
      const b = itemOf(body, NEW_CODE).board;
      expect(b).toMatchObject({ submittedCouncilCount: 0, councilScore: null, finalScore: null, result: 'PENDING' });
      expect(b.advisor.status).toBe('DRAFT');
      expect(b.advisor.score ?? null).toBeNull();
      await expectScores(page, NEW_CODE, {
        advisor: 'Nháp', ex: ['7.5', '7.5'],
        council: Object.fromEntries(ALL_MEMBERS.map((n) => [n, 'Chưa chấm'])), avg: '—', final: '—',
      });
      const row = rowOf(page, NEW_CODE);
      await expect(cell(row, COL.result)).toHaveText('Chưa đủ điểm');
      await expect(cell(row, COL.minutes)).toHaveText('Chưa lập');
      await expect(cell(row, COL.revision)).toHaveText('Không yêu cầu');
      await expect(row.getByRole('button', { name: 'Hoàn tất' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Chốt kết quả hội đồng (0)' })).toBeDisabled();
      expect((await sheetsOf(NEW_CODE)).filter((s) => s.type === 'COUNCIL')).toHaveLength(0);
    });

    test(ITC427.title, { annotation: ITC427.annotation }, async ({ page }) => {
      const body = await openSummary(page, councilId);
      const b = itemOf(body, PASS_CODE).board;
      expect(b.hasDeviation).toBe(true);
      const flagged = [b.advisor, ...b.examiners, ...b.council].filter((e: any) => e.deviated);
      expect(flagged.map((e: any) => [e.teacherName, e.score, e.deviationStep])).toEqual([
        [MEMBER_KHOA, 5.6, 'EXAMINER'], [MEMBER_THAO, 6, 'COUNCIL']]);

      const row = rowOf(page, PASS_CODE);
      const warn = (dev: string, step: string) =>
        `Cảnh báo: lệch ${dev} điểm (${step} – lệch so với TB 5 điểm Hội đồng) – vẫn được tính, người chấm có thể tự sửa phiếu`;
      const thao = cell(row, await memberCol(page, MEMBER_THAO)).getByTitle(warn('1.80', 'Bước 1'));
      await thao.hover();
      await expect(thao).toHaveText('6.0');
      const pb2 = cell(row, COL.ex2).getByTitle(warn('2.20', 'Bước 2'));
      await pb2.hover();
      await expect(pb2).toHaveText('5.6');
      const hd = cell(row, COL.advisor).getByTitle('Lệch 0.63 điểm', { exact: true });
      await hd.hover();
      await expect(hd).toHaveText('8.0');
      await expect(row.getByLabel('Điểm lệch')).toHaveCount(2);
    });

    test(ITC428.title, { annotation: ITC428.annotation }, async ({ page }) => {
      const body = await openSummary(page, councilId);
      expect(itemOf(body, PASS_CODE).board).toMatchObject({ councilScore: 7.8, finalScore: 7.5, hasDeviation: true });
      const row = rowOf(page, PASS_CODE);
      await expect(cell(row, COL.council)).toHaveText('7.8');
      await expect(cell(row, COL.final)).toHaveText('7.5');
      const note = page.getByText(/^Điểm GVHD, 2 GVPB và 5 thành viên Hội đồng\./);
      await expect(note).toBeVisible();
      await expect(note).not.toContainText('bị loại khỏi điểm trung bình', { timeout: 3_000 });
    });

    test(ITC429.title, { annotation: ITC429.annotation }, async ({ page }) => {
      await openSummary(page, councilId);
      const shown: Record<string, string[]> = {};
      const official: Record<string, string[]> = {};
      for (const code of [PASS_CODE, FAIL_CODE]) {
        const row = rowOf(page, code);
        shown[code] = [(await cell(row, COL.council).innerText()).trim(), (await cell(row, COL.final).innerText()).trim()];
        const [db] = await dbSelect<{ council_score: string | null; final_score: string | null }>(
          `SELECT ts.council_score, ts.final_score FROM thesis_score ts
             JOIN thesis_topic tt ON tt.id = ts.thesis_topic_id JOIN student s ON s.id = tt.student_id
            WHERE s.student_code = ?`, [code]);
        official[code] = [db.council_score, db.final_score].map((v) => (v == null ? '—' : Number(v).toFixed(1)));
      }
      expect(shown, 'Điểm TB HĐ / Điểm tổng kết hiển thị phải bằng kết quả chính thức đã lưu').toEqual(official);
    });

    test(ITC431.title, { annotation: ITC431.annotation }, async ({ page }) => {
      const calls = trackScoreCalls(page);
      const resPromise = page.waitForResponse((r) => new URL(r.url()).pathname.endsWith(`/defense-council/${UNKNOWN_ID}/examiner`)
        && r.request().method() === 'GET');
      await page.goto(summaryUrl(UNKNOWN_ID));
      const res = await resPromise;
      expect(res.status()).toBe(404);
      expect(await res.json()).toMatchObject({ code: 3101, message: 'Không tìm thấy Hội đồng bảo vệ' });
      await expect(page.getByText('Không tìm thấy thông tin hội đồng hoặc bạn không có quyền xem thông tin hội đồng này.')).toBeVisible();
      expect(calls.count).toBe(0);
      const db = await dbSelect<{ total: number }>(
        'SELECT COUNT(*) AS total FROM defense_council WHERE public_id = UNHEX(?)', [UNKNOWN_ID.replace(/-/g, '')]);
      expect(db[0].total).toBe(0);
    });
  });

  test.describe(FN_EXPORT, () => {
    test(ITC432.title, { annotation: ITC432.annotation }, async ({ page }) => {
      const allSheets = async () => [await sheetsOf(PASS_CODE), await sheetsOf(FAIL_CODE), await sheetsOf(NEW_CODE)];
      const before = await allSheets();
      await openSummary(page, councilId);
      const { name, lines } = await exportCsv(page);
      await expect(page.getByText('Đã xuất file bảng điểm CSV.')).toBeVisible();
      expect(name).toBe('Bang_diem_KTPM202601.csv');
      expect(lines).toHaveLength(4);
      expect(lines[0]).toMatch(/^STT,MSSV,Ho ten,Ten de tai,Diem GVHD,Diem GVHD 2,Diem GVPB 1,Diem GVPB 2,.*,Diem TB HD,Diem tong ket,Ket qua$/);
      // Cột Hội đồng lấy theo đúng thứ tự tiêu đề
      const header = [...lines[0].matchAll(/Diem HD \([^-]+ - ([^)]+)\)/g)].map((m) => m[1]);
      expect([...header].sort()).toEqual([...ALL_MEMBERS].sort());
      const sv1: Record<string, string> = { [CHAIR]: '8.0', [SECRETARY]: '8.0', [MEMBER_KHOA]: '9.0', [MEMBER_YEN]: '8.0', [MEMBER_THAO]: '6.0' };
      const sv2: Record<string, string> = { [CHAIR]: '5.0', [SECRETARY]: '5.0', [MEMBER_KHOA]: '5.0', [MEMBER_YEN]: '5.0', [MEMBER_THAO]: '6.0' };
      expect(lines[1].startsWith(`1,${PASS_CODE},"${PASS_NAME}",`)).toBe(true);
      expect(lines[1].endsWith(`,8.0,,7.0,5.6,${header.map((h) => sv1[h]).join(',')},7.8,7.5,Dat`), lines[1]).toBe(true);
      expect(lines[2].startsWith(`2,${FAIL_CODE},`)).toBe(true);
      expect(lines[2].endsWith(`,6.0,,6.0,5.0,${header.map((h) => sv2[h]).join(',')},5.2,5.4,Khong dat`), lines[2]).toBe(true);
      expect(lines[3].startsWith(`3,${NEW_CODE},"${NEW_NAME}",`)).toBe(true);
      // Sau 2 điểm PB: 5 ô Hội đồng, TB HĐ, tổng kết, kết quả đều trống
      expect(lines[3].endsWith(',,,7.5,7.5,,,,,,,,'), lines[3]).toBe(true);
      expect(await allSheets()).toEqual(before);
    });
  });
});

test.describe('SecurityTest - Xem điểm tổng Hội đồng', () => {
  const expectNoScore = async (page: Page) => {
    await expect(page.getByRole('heading', { name: /Tổng hợp kết quả bảo vệ/ })).toHaveCount(0);
    await expect(page.getByText(PASS_CODE)).toHaveCount(0);
  };

  test.describe('Sinh viên', () => {
    test.use({ storageState: '.auth/student.json' });
    test(SEC127.title, { annotation: SEC127.annotation }, async ({ page, request }) => {
      await page.goto(summaryUrl(councilId));
      await expect(page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.')).toBeVisible();
      await expectNoScore(page);
      const res = await apiCall(request, await token(request, 'STUDENT'), 'GET', scorePath(councilId));
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(2001);
      expect(res.body.data).toBeUndefined();
    });
  });

  test.describe('Chưa đăng nhập', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test(SEC128.title, { annotation: SEC128.annotation }, async ({ page, request }) => {
      await page.goto(summaryUrl(councilId));
      await expect(page).toHaveURL(/\/login/);
      await expectNoScore(page);
      const res = await request.get(`${getApiBaseUrl()}${scorePath(councilId)}`);
      expect(res.status()).toBe(401);
      const body = await res.json();
      expect(body.code).toBe(2000);
      expect(body.data).toBeUndefined();
    });
  });

  test.describe('Giảng viên ngoài Hội đồng', () => {
    test.use({ storageState: '.auth/chairperson.json' });
    test(SEC129.title, { annotation: SEC129.annotation }, async ({ page, request }) => {
      await page.goto(summaryUrl(councilId));
      await expect(page.getByText('Không tìm thấy thông tin hội đồng hoặc bạn không có quyền xem thông tin hội đồng này.')).toBeVisible();
      await expectNoScore(page);
      const res = await apiCall(request, await token(request, 'CHAIRPERSON'), 'GET', scorePath(councilId));
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(2001);
      expect(res.body.message).toBe('Bạn không có quyền xem bảng điểm bảo vệ của sinh viên này');
      expect(res.body.data).toBeUndefined();
    });
  });

  test.describe('Token không hợp lệ', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    const check = async (page: Page, request: APIRequestContext, value: string) => {
      await page.context().addCookies([{
        name: 'access_token', value, domain: new URL(getApiBaseUrl()).hostname, path: '/', httpOnly: true, secure: false, sameSite: 'Lax',
      }]);
      await page.goto(summaryUrl(councilId));
      await expect(page).toHaveURL(/\/login/);
      await expectNoScore(page);
      const res = await apiCall(request, value, 'GET', scorePath(councilId));
      expect(res.status).toBe(401);
      expect(res.body.code).toBe(2000);
      expect(res.body.data).toBeUndefined();
    };

    test(SEC130.title, { annotation: SEC130.annotation }, async ({ page, request, playwright }) => {
      // Đăng nhập bằng phiên riêng để không để lại cookie hợp lệ trong request của test
      const ctx = await playwright.request.newContext();
      const [h, p, s] = (await token(ctx, 'SECRETARY')).split('.');
      await ctx.dispose();
      // Đổi ký tự đầu của chữ ký (ký tự cuối có thể không đổi giá trị byte)
      await check(page, request, [h, p, (s[0] === 'A' ? 'B' : 'A') + s.slice(1)].join('.'));
    });

    test(SEC131.title, { annotation: SEC131.annotation }, async ({ page, request, playwright }) => {
      const ctx = await playwright.request.newContext();
      const old = await token(ctx, 'SECRETARY');
      const out = await ctx.post(`${getApiBaseUrl()}/log-out`, { headers: { Cookie: `access_token=${old}` } });
      expect(out.status()).toBe(200);
      await ctx.dispose();
      await check(page, request, old);
    });
  });
});
