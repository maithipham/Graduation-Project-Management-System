import { test, expect, type APIRequestContext, type Page, type Response } from '@playwright/test';
import { defineItc, defineItcSec } from '../../../support/integration-test-case';
import { apiCall, getApiBaseUrl, loginByEmail } from '../../../support/api';
import { dbSelect } from '../../../support/db';

// ============================================================================
// ĐẶC TẢ TEST CASE (ITC194..ITC199 & TC-SEC-075..TC-SEC-076)
// Feature: defense | Module/Sheet: PhanCongGVPB
// Role: Thư ký hội đồng (tài khoản Trưởng bộ môn "Nguyễn Kỹ thuật phần mềm" là Thư ký của "HD KTPM 01")
// Màn hình: "/lecturer/defense/councils" và "/lecturer/defense/councils/{hội đồng}?tab=assign"
// Phân công GVPB thành công gửi thông báo cho GV/SV thật và cấp role EXAMINER, không có API gỡ → không dọn được.
// Vì vậy Playwright chỉ chạy các case không ghi dữ liệu (xem, lỗi bị BE chặn, hoàn tác). Luồng lưu thành công
// (Thư ký, Chủ tịch) và Ủy viên bị chặn chạy ở MockMvc (ITC200–ITC202, tự rollback).
// .env.e2e chưa có tài khoản Chủ tịch nên vai Chủ tịch chỉ kiểm tra ở MockMvc.
// ============================================================================

const FEATURE = 'defense';
const MODULE = 'PhanCongGVPB';
const SHEET = 'PhanCongGVPB';

const FN_VIEW = 'Xem hội đồng và bảng phân công GVPB';
const FN_ASSIGN = 'Lưu phân công GVPB';

const SECRETARY = 'Nguyễn Kỹ thuật phần mềm';
const CHAIR = 'Lê Hoàng Nam';
const THAO = 'Lý Thị Thanh Thảo';

const PRE_BASE =
  'Giảng viên "Nguyễn Kỹ thuật phần mềm" (Thư ký) đã đăng nhập. "HD KTPM 01" đã công bố, gồm Chủ tịch "Lê Hoàng Nam", Thư ký "Nguyễn Kỹ thuật phần mềm", ' +
  'Ủy viên "Lê Văn Khoa", "Hoàng Thị Yến", "Lý Thị Thanh Thảo"; có 7 sinh viên: 4 sinh viên đang chờ phản biện (2251190001–2251190004) ' +
  'và 3 sinh viên đã qua phản biện (99B14001–99B14003)';
const PRE_AN = PRE_BASE + '; sinh viên "Nguyễn Hoàng An" (2251190001) có GVPB 1 "Nguyễn Kỹ thuật phần mềm" đã duyệt và nộp phiếu chấm, GVPB 2 "Lê Hoàng Nam"';
const PRE_BAO = PRE_BASE + '; sinh viên "Trần Minh Bảo" (2251190002) có GVPB 1 "Nguyễn Kỹ thuật phần mềm", GVPB 2 "Lê Hoàng Nam", cả hai chưa chấm';

const ITC194 = defineItc({
  id: 'ITC194', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_VIEW,
  description: 'Kiểm tra xem danh sách hội đồng mà giảng viên tham gia kèm vai trò',
  procedure: '1. Đăng nhập vai trò Thư ký hội đồng.\n2. Mở màn hình "Hội đồng của tôi" (/lecturer/defense/councils).',
  expected:
    '1. Gọi GET /defense-council/my, HTTP 200, code = 1000; có hội đồng "HD KTPM 01" với vai trò Thư ký, 7 sinh viên.\n' +
    '2. Bảng hiển thị dòng "HD KTPM 01" với vai trò "Thư ký".',
  precondition: PRE_BASE,
});

const ITC195 = defineItc({
  id: 'ITC195', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_VIEW,
  description: 'Kiểm tra mở bảng phân công GVPB của hội đồng',
  procedure: '1. Đăng nhập vai trò Thư ký hội đồng.\n2. Mở hội đồng "HD KTPM 01", chọn tab "Phân công".',
  expected:
    '1. Gọi GET /defense-council/{mã hội đồng}/examiner, HTTP 200, code = 1000; vai trò của tôi là Thư ký, được phép phân công; 5 thành viên, 7 sinh viên.\n' +
    '2. Dòng "Nguyễn Hoàng An" (2251190001) hiển thị GVPB 1 "Nguyễn Kỹ thuật phần mềm", GVPB 2 "Lê Hoàng Nam".\n' +
    '3. Dòng "SV1 Test Đạt" (99B14001, đã bảo vệ xong) có ô chọn GVPB bị khóa; dòng "Trần Minh Bảo" (2251190002) cho phép chọn.',
  precondition: PRE_AN,
});

const ITC196 = defineItc({
  id: 'ITC196', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_ASSIGN,
  description: 'Kiểm tra nút lưu phân công bị khóa khi chưa có thay đổi',
  procedure: '1. Đăng nhập vai trò Thư ký hội đồng, mở tab "Phân công" của "HD KTPM 01".\n2. Không thay đổi GVPB nào.',
  expected: '1. Nút "Lưu phân công" bị khóa.\n2. Không gọi PUT /defense-council/{mã hội đồng}/examiner.',
  precondition: PRE_BASE,
});

const ITC197 = defineItc({
  id: 'ITC197', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_ASSIGN,
  description: 'Kiểm tra giao diện chặn chọn trùng 2 GVPB cho một sinh viên',
  procedure:
    '1. Đăng nhập vai trò Thư ký hội đồng, mở tab "Phân công" của "HD KTPM 01".\n' +
    '2. Trên dòng "Trần Minh Bảo" (2251190002), đổi GVPB 2 thành "Nguyễn Kỹ thuật phần mềm" (đang là GVPB 1).',
  expected:
    '1. Ô GVPB 2 nhận "Nguyễn Kỹ thuật phần mềm", ô GVPB 1 tự xóa trống (không cho 2 GVPB trùng nhau).\n' +
    '2. Dòng chưa đủ 2 GVPB nên nút "Lưu phân công" vẫn bị khóa; không gọi PUT /defense-council/{mã hội đồng}/examiner.\n' +
    '3. Dữ liệu: "Trần Minh Bảo" vẫn có GVPB 1 "Nguyễn Kỹ thuật phần mềm", GVPB 2 "Lê Hoàng Nam".',
  precondition: PRE_BAO,
});

const ITC198 = defineItc({
  id: 'ITC198', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_ASSIGN,
  description: 'Kiểm tra thay GVPB đã nộp phiếu chấm và đã duyệt',
  procedure:
    '1. Đăng nhập vai trò Thư ký hội đồng, mở tab "Phân công" của "HD KTPM 01".\n' +
    '2. Trên dòng "Nguyễn Hoàng An" (2251190001), đổi GVPB 1 từ "Nguyễn Kỹ thuật phần mềm" thành "Lý Thị Thanh Thảo".\n3. Bấm "Lưu phân công (1)".',
  expected:
    '1. Gọi PUT /defense-council/{mã hội đồng}/examiner; HTTP 409, code = 3126, message "Sinh viên Nguyễn Hoàng An (2251190001): Không thể thay Giảng viên phản biện đã nộp phiếu chấm hoặc đã đưa ra quyết định".\n' +
    '2. Hiện thông báo lỗi đúng message trên.\n3. Dữ liệu: "Nguyễn Hoàng An" vẫn có GVPB 1 "Nguyễn Kỹ thuật phần mềm", GVPB 2 "Lê Hoàng Nam".',
  precondition: PRE_AN,
});

const ITC199 = defineItc({
  id: 'ITC199', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_ASSIGN,
  description: 'Kiểm tra hoàn tác thay đổi phân công chưa lưu',
  procedure:
    '1. Đăng nhập vai trò Thư ký hội đồng, mở tab "Phân công" của "HD KTPM 01".\n' +
    '2. Trên dòng "Trần Minh Bảo" (2251190002), đổi GVPB 1 thành "Lý Thị Thanh Thảo".\n3. Bấm "Hoàn tác".',
  expected:
    '1. Trước khi hoàn tác, nút hiển thị "Lưu phân công (1)".\n' +
    '2. Sau khi hoàn tác: GVPB 1 trở lại "Nguyễn Kỹ thuật phần mềm", nút "Lưu phân công" bị khóa; không gọi PUT /defense-council/{mã hội đồng}/examiner.\n' +
    '3. Dữ liệu: phân công của "Trần Minh Bảo" không đổi.',
  precondition: PRE_BAO,
});

const SEC075 = defineItcSec({
  id: 'TC-SEC-075', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Sinh viên mở bảng phân công GVPB và gọi API lưu phân công',
  roleSession: 'Sinh viên (STUDENT), đã đăng nhập',
  technique: 'EP',
  given: 'Đăng nhập bằng tài khoản Sinh viên',
  when: 'Mở thẳng /lecturer/defense/councils/{mã HD KTPM 01}?tab=assign; gọi PUT /defense-council/{mã HD KTPM 01}/examiner (Trần Minh Bảo: giữ nguyên 2 GVPB) bằng phiên Sinh viên',
  then: 'Màn hình hiển thị "Tài khoản của bạn không có quyền truy cập cổng cán bộ."; PUT trả HTTP 403, code = 2001; phân công không đổi',
});

const SEC076 = defineItcSec({
  id: 'TC-SEC-076', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Chưa đăng nhập mở bảng phân công GVPB và gọi API lưu phân công',
  roleSession: 'Chưa đăng nhập (không có cookie phiên)',
  technique: 'EP',
  given: 'Trình duyệt chưa đăng nhập',
  when: 'Mở thẳng /lecturer/defense/councils/{mã HD KTPM 01}?tab=assign; gọi PUT /defense-council/{mã HD KTPM 01}/examiner không kèm phiên đăng nhập',
  then: 'Bị chuyển về trang đăng nhập (/login); PUT trả HTTP 401, code = 2000; phân công không đổi',
});

// ============================================================================
// HÀM HỖ TRỢ
// ============================================================================

let councilId = '';
const memberIds: Record<string, string> = {};
const assignmentIds: Record<string, string> = {};

const token = (request: APIRequestContext, role: 'HEAD_OF_MAJOR' | 'STUDENT') => {
  const email = process.env[`E2E_EMAIL_${role}`];
  if (!email) throw new Error(`Chưa cấu hình E2E_EMAIL_${role} trong .env.e2e`);
  return loginByEmail(request, email);
};

// Tên GVPB theo thứ tự (1, 2) của sinh viên trong HD KTPM 01, đọc thẳng DB
async function examinersOf(studentCode: string) {
  const rows = await dbSelect<{ name: string; examiner_order: number }>(
    `SELECT CONCAT(a.first_name, ' ', a.last_name) AS name, ea.examiner_order
       FROM examiner_assignment ea
       JOIN defense_council_member m ON m.id = ea.council_member_id
       JOIN teacher t ON t.id = m.teacher_id JOIN account a ON a.id = t.account_id
       JOIN defense_assignment d ON d.id = ea.defense_assignment_id
       JOIN thesis_topic tt ON tt.id = d.thesis_topic_id JOIN student s ON s.id = tt.student_id
      WHERE s.student_code = ? ORDER BY ea.examiner_order`, [studentCode]);
  return rows.map((r) => r.name);
}

async function examinerTotal() {
  return (await dbSelect<{ n: number }>(
    `SELECT COUNT(*) AS n FROM examiner_assignment ea JOIN defense_assignment d ON d.id = ea.defense_assignment_id
      JOIN defense_council dc ON dc.id = d.council_id WHERE dc.code = 'KTPM202601'`))[0].n;
}

const boardUrl = () => `/lecturer/defense/councils/${councilId}?tab=assign`;
const isBoard = (r: Response) => r.request().method() === 'GET' && /\/defense-council\/[^/]+\/examiner$/.test(new URL(r.url()).pathname);
const isSave = (r: Response) => r.request().method() === 'PUT' && /\/defense-council\/[^/]+\/examiner$/.test(new URL(r.url()).pathname);

async function openBoard(page: Page) {
  const resPromise = page.waitForResponse(isBoard);
  await page.goto(boardUrl());
  const res = await resPromise;
  await expect(studentRow(page, '2251190001')).toBeVisible();
  return res;
}

const studentRow = (page: Page, code: string) => page.getByRole('row').filter({ hasText: code });
const gvpbSelect = (page: Page, code: string, slot: 1 | 2) => studentRow(page, code).locator('select').nth(slot - 1);
const saveButton = (page: Page) => page.getByRole('button', { name: /^Lưu phân công/ });

function trackSaves(page: Page) {
  const s = { hit: false };
  page.on('request', (r) => { if (r.method() === 'PUT' && /\/examiner$/.test(new URL(r.url()).pathname)) s.hit = true; });
  return s;
}

// ============================================================================
// TEST
// ============================================================================

test.beforeAll(async ({ request }) => {
  const sec = await token(request, 'HEAD_OF_MAJOR');
  const my = await apiCall(request, sec, 'GET', '/defense-council/my');
  const c = my.body.data.find((x: any) => x.name === 'HD KTPM 01');
  councilId = c.councilPublicId;
  expect(c.myRole, 'Tiền điều kiện: tài khoản TBM là Thư ký HD KTPM 01').toBe('SECRETARY');
  const board = (await apiCall(request, sec, 'GET', `/defense-council/${councilId}/examiner`)).body.data;
  for (const m of board.members) memberIds[m.fullName] = m.memberPublicId;
  for (const s of board.students) assignmentIds[s.studentCode] = s.defenseAssignmentPublicId;
  expect(await examinersOf('2251190001')).toEqual([SECRETARY, CHAIR]);
  expect(await examinersOf('2251190002')).toEqual([SECRETARY, CHAIR]);
});

test.describe('Phân công GVPB (Thư ký hội đồng)', () => {
  test.use({ storageState: '.auth/head_of_major.json' });

  test.describe(FN_VIEW, () => {
    test(ITC194.title, { annotation: ITC194.annotation }, async ({ page }) => {
      const resPromise = page.waitForResponse((r) => r.request().method() === 'GET' && new URL(r.url()).pathname.endsWith('/defense-council/my'));
      await page.goto('/lecturer/defense/councils');
      const res = await resPromise;
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      const c = body.data.find((x: any) => x.name === 'HD KTPM 01');
      expect(c).toMatchObject({ myRole: 'SECRETARY', studentCount: 7 });
      const row = page.getByRole('row').filter({ hasText: 'HD KTPM 01' });
      await expect(row).toContainText('Thư ký');
    });

    test(ITC195.title, { annotation: ITC195.annotation }, async ({ page }) => {
      const res = await openBoard(page);
      expect(new URL(res.url()).pathname).toContain(`/defense-council/${councilId}/examiner`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.data).toMatchObject({ myRole: 'SECRETARY', canAssignExaminers: true });
      expect(body.data.members).toHaveLength(5);
      expect(body.data.students).toHaveLength(7);

      await expect(gvpbSelect(page, '2251190001', 1)).toHaveValue(memberIds[SECRETARY]);
      await expect(gvpbSelect(page, '2251190001', 2)).toHaveValue(memberIds[CHAIR]);
      await expect(gvpbSelect(page, '99B14001', 1)).toBeDisabled();
      await expect(gvpbSelect(page, '2251190002', 1)).toBeEnabled();
    });
  });

  test.describe(FN_ASSIGN, () => {
    test(ITC196.title, { annotation: ITC196.annotation }, async ({ page }) => {
      await openBoard(page);
      const saves = trackSaves(page);
      await expect(saveButton(page)).toBeDisabled();
      expect(saves.hit).toBe(false);
    });

    test(ITC197.title, { annotation: ITC197.annotation }, async ({ page }) => {
      await openBoard(page);
      const before = await examinerTotal();
      const saves = trackSaves(page);
      await gvpbSelect(page, '2251190002', 2).selectOption(memberIds[SECRETARY]);
      await expect(gvpbSelect(page, '2251190002', 2)).toHaveValue(memberIds[SECRETARY]);
      await expect(gvpbSelect(page, '2251190002', 1)).toHaveValue('');
      await expect(saveButton(page)).toBeDisabled();
      expect(saves.hit).toBe(false);
      expect(await examinersOf('2251190002')).toEqual([SECRETARY, CHAIR]);
      expect(await examinerTotal()).toBe(before);
    });

    test(ITC198.title, { annotation: ITC198.annotation }, async ({ page }) => {
      await openBoard(page);
      await gvpbSelect(page, '2251190001', 1).selectOption(memberIds[THAO]);
      const resPromise = page.waitForResponse(isSave);
      await saveButton(page).click();
      const res = await resPromise;
      expect(res.request().postDataJSON().items[0]).toMatchObject({
        defenseAssignmentPublicId: assignmentIds['2251190001'], councilMemberPublicId1: memberIds[THAO], councilMemberPublicId2: memberIds[CHAIR] });
      expect(res.status()).toBe(409);
      const body = await res.json();
      expect(body.code).toBe(3126);
      const msg = 'Sinh viên Nguyễn Hoàng An (2251190001): Không thể thay Giảng viên phản biện đã nộp phiếu chấm hoặc đã đưa ra quyết định';
      expect(body.message).toBe(msg);
      await expect(page.getByText(msg).first()).toBeVisible();
      expect(await examinersOf('2251190001')).toEqual([SECRETARY, CHAIR]);
    });

    test(ITC199.title, { annotation: ITC199.annotation }, async ({ page }) => {
      await openBoard(page);
      const saves = trackSaves(page);
      await gvpbSelect(page, '2251190002', 1).selectOption(memberIds[THAO]);
      await expect(saveButton(page)).toHaveText(/Lưu phân công \(1\)/);
      await page.getByRole('button', { name: 'Hoàn tác' }).click();
      await expect(gvpbSelect(page, '2251190002', 1)).toHaveValue(memberIds[SECRETARY]);
      await expect(saveButton(page)).toBeDisabled();
      expect(saves.hit).toBe(false);
      expect(await examinersOf('2251190002')).toEqual([SECRETARY, CHAIR]);
    });
  });
});

test.describe('SecurityTest - Phân công GVPB', () => {
  const unchangedBody = () => ({ items: [{ defenseAssignmentPublicId: assignmentIds['2251190002'],
    councilMemberPublicId1: memberIds[SECRETARY], councilMemberPublicId2: memberIds[CHAIR] }] });

  test.describe('Sinh viên', () => {
    test.use({ storageState: '.auth/student.json' });
    test(SEC075.title, { annotation: SEC075.annotation }, async ({ page, request }) => {
      await page.goto(boardUrl());
      await expect(page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.')).toBeVisible();
      await expect(saveButton(page)).toHaveCount(0);
      const st = await token(request, 'STUDENT');
      const res = await apiCall(request, st, 'PUT', `/defense-council/${councilId}/examiner`, { data: unchangedBody() });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(2001);
      expect(await examinersOf('2251190002')).toEqual([SECRETARY, CHAIR]);
    });
  });

  test.describe('Chưa đăng nhập', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test(SEC076.title, { annotation: SEC076.annotation }, async ({ page, request }) => {
      await page.goto(boardUrl());
      await expect(page).toHaveURL(/\/login/);
      const res = await request.put(`${getApiBaseUrl()}/defense-council/${councilId}/examiner`, { data: unchangedBody() });
      expect(res.status()).toBe(401);
      expect((await res.json()).code).toBe(2000);
      expect(await examinersOf('2251190002')).toEqual([SECRETARY, CHAIR]);
    });
  });
});
