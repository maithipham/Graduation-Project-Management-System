import { test, expect, type APIRequestContext, type BrowserContext, type Locator, type Page, type Response } from '@playwright/test';
import { defineItc, defineItcSec } from '../../../support/integration-test-case';
import { getApiBaseUrl, loginByEmail } from '../../../support/api';
import { dbSelect } from '../../../support/db';

// ============================================================================
// ĐẶC TẢ TEST CASE (ITC203..ITC206 & TC-SEC-077..TC-SEC-078)
// Feature: defense | Module/Sheet: XemLichSinhVien
// Màn hình: "Lịch bảo vệ" của cổng sinh viên (/student/schedule), bảng "Lịch phản biện và bảo vệ"
// gộp lịch phản biện với từng GVPB và ca bảo vệ trước Hội đồng (GET /student-schedule/my).
// Chỉ ĐỌC dữ liệu có sẵn của "HD KTPM 01" (không tạo / sửa gì) nên không có dữ liệu cần dọn;
// afterAll đối chiếu DB trước / sau để xác nhận lịch của các sinh viên không bị thay đổi.
// Tài khoản sinh viên trong hội đồng được đăng nhập qua /login-postman bằng email đọc từ DB theo mã SV
// (không in email ra log); sinh viên chưa vào hội đồng dùng E2E_EMAIL_STUDENT.
// ============================================================================

const FEATURE = 'defense';
const MODULE = 'XemLichSinhVien';
const SHEET = 'XemLichSinhVien';
const FN_VIEW = 'Xem lịch phản biện và bảo vệ';

const PRE_COUNCIL =
  '"HD KTPM 01" (Học kỳ 1 năm học 2026-2027) đã công bố, gồm Chủ tịch "TS. Lê Hoàng Nam", Thư ký "Nguyễn Kỹ thuật phần mềm", ' +
  'Ủy viên "Lê Văn Khoa", "ThS. Hoàng Thị Yến", "ThS. Lý Thị Thanh Thảo"';

const ITC203 = defineItc({
  id: 'ITC203', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_VIEW,
  description: 'Kiểm tra xem lịch khi đã có lịch phản biện với GVPB 1, GVPB 2 và ca bảo vệ chưa xếp',
  procedure:
    '1. Đăng nhập vai trò Sinh viên "Nguyễn Hoàng An" (2251190001).\n' +
    '2. Bấm menu "Lịch bảo vệ".',
  expected:
    '1. Gọi GET /student-schedule/my kèm mã học kỳ hiện tại, HTTP 200, code = 1000; trả 3 lịch theo thứ tự: Phản biện 1, Phản biện 2, Bảo vệ đồ án.\n' +
    '2. Bảng "Lịch phản biện và bảo vệ" có 3 dòng:\n' +
    '- "Phản biện 1": ngày 20/11/2026, 08:00 – 08:45, địa điểm 302, trạng thái "Đã qua", Giảng viên phản biện 1 "Nguyễn Kỹ thuật phần mềm".\n' +
    '- "Phản biện 2": ngày, giờ, địa điểm "—", trạng thái "Chưa xếp lịch", Giảng viên phản biện 2 "TS. Lê Hoàng Nam".\n' +
    '- "Bảo vệ đồ án": "Chưa xếp lịch", hiện đủ 5 thành viên hội đồng (Chủ tịch, Thư ký, 3 Ủy viên).\n' +
    '3. Dữ liệu hiển thị khớp lịch phản biện đã lưu của sinh viên.',
  precondition:
    PRE_COUNCIL + '; sinh viên "Nguyễn Hoàng An" (2251190001) thuộc hội đồng, GVPB 1 "Nguyễn Kỹ thuật phần mềm" đã xếp lịch phản biện ' +
    'ngày 20/11/2026 08:00 – 08:45 tại 302, GVPB 2 "Lê Hoàng Nam" chưa xếp lịch; sinh viên chưa được xếp ca bảo vệ',
});

const ITC204 = defineItc({
  id: 'ITC204', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_VIEW,
  description: 'Kiểm tra xem lịch khi đã được xếp ca bảo vệ trước hội đồng',
  procedure:
    '1. Đăng nhập vai trò Sinh viên "SV3 Test Mới" (99B14003).\n' +
    '2. Bấm menu "Lịch bảo vệ".',
  expected:
    '1. Gọi GET /student-schedule/my kèm mã học kỳ hiện tại, HTTP 200, code = 1000; dòng đầu là "Bảo vệ đồ án" (đã xếp lịch).\n' +
    '2. Dòng "Bảo vệ đồ án": ngày 21/11/2026, 09:30 – 10:15, địa điểm "P.302 – Nhà C1", trạng thái "Đã qua"; ' +
    'Chủ tịch hội đồng "TS. Lê Hoàng Nam", Thư ký hội đồng "Nguyễn Kỹ thuật phần mềm", 3 Ủy viên.\n' +
    '3. Dòng "Phản biện 1" (GVPB "ThS. Hoàng Thị Yến") và "Phản biện 2" (GVPB "Lê Văn Khoa") ở trạng thái "Chưa xếp lịch".\n' +
    '4. Ngày giờ, phòng hiển thị khớp ca bảo vệ đã lưu của sinh viên.',
  precondition:
    PRE_COUNCIL + '; sinh viên "SV3 Test Mới" (99B14003) đã được xếp ca bảo vệ ngày 21/11/2026 09:30 – 10:15 tại "P.302 – Nhà C1", ' +
    '2 GVPB "Hoàng Thị Yến", "Lê Văn Khoa" chưa xếp lịch phản biện',
});

const ITC205 = defineItc({
  id: 'ITC205', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_VIEW,
  description: 'Kiểm tra xem lịch khi chưa có lịch nào được xếp và không thấy lịch của sinh viên khác',
  procedure:
    '1. Đăng nhập vai trò Sinh viên "Trần Minh Bảo" (2251190002).\n' +
    '2. Bấm menu "Lịch bảo vệ".',
  expected:
    '1. Gọi GET /student-schedule/my kèm mã học kỳ hiện tại, HTTP 200, code = 1000; trả 3 lịch, cả 3 đều chưa xếp lịch.\n' +
    '2. Bảng có 3 dòng "Phản biện 1" (GVPB "Nguyễn Kỹ thuật phần mềm"), "Phản biện 2" (GVPB "TS. Lê Hoàng Nam"), "Bảo vệ đồ án", ' +
    'cả 3 dòng có trạng thái "Chưa xếp lịch".\n' +
    '3. Không hiện lịch phản biện ngày 20/11/2026 tại 302 của sinh viên "Nguyễn Hoàng An".',
  precondition:
    PRE_COUNCIL + '; sinh viên "Trần Minh Bảo" (2251190002) thuộc hội đồng, GVPB 1 "Nguyễn Kỹ thuật phần mềm", GVPB 2 "Lê Hoàng Nam" ' +
    'chưa xếp lịch phản biện, chưa có ca bảo vệ',
});

const ITC206 = defineItc({
  id: 'ITC206', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_VIEW,
  description: 'Kiểm tra xem lịch khi sinh viên chưa được gán vào hội đồng nào',
  procedure:
    '1. Đăng nhập vai trò Sinh viên chưa được gán vào hội đồng.\n' +
    '2. Bấm menu "Lịch bảo vệ".',
  expected:
    '1. Gọi GET /student-schedule/my kèm mã học kỳ hiện tại, HTTP 200, code = 1000; danh sách lịch rỗng.\n' +
    '2. Hiện "Bạn chưa có lịch phản biện hoặc bảo vệ nào.", không hiện bảng lịch.',
  precondition: 'Sinh viên "Hà Dương" (1026000001) đang hoạt động, chưa được gán vào hội đồng bảo vệ nào',
});

const SEC077 = defineItcSec({
  id: 'TC-SEC-077', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Chưa đăng nhập mở màn hình Lịch bảo vệ và gọi API lịch của sinh viên',
  roleSession: 'Chưa đăng nhập (không có cookie phiên)',
  technique: 'EP',
  given: 'Trình duyệt chưa đăng nhập',
  when: 'Mở thẳng /student/schedule; gọi GET /student-schedule/my không kèm phiên đăng nhập',
  then: 'Bị chuyển về trang đăng nhập (/login), không hiện bảng lịch; GET trả HTTP 401, code = 2000, không có dữ liệu lịch',
});

const SEC078 = defineItcSec({
  id: 'TC-SEC-078', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Giảng viên mở màn hình Lịch bảo vệ của cổng sinh viên và gọi API lịch của sinh viên',
  roleSession: 'Giảng viên hướng dẫn (SUPERVISOR), đã đăng nhập',
  technique: 'EP',
  given: 'Đăng nhập bằng tài khoản Giảng viên hướng dẫn',
  when: 'Mở thẳng /student/schedule trên cổng sinh viên; gọi GET /student-schedule/my bằng phiên Giảng viên',
  then:
    'Màn hình hiển thị "Tài khoản của bạn không có quyền truy cập cổng sinh viên.", không hiện bảng lịch; ' +
    'GET trả HTTP 403, code = 2001, message "Bạn không có quyền truy cập (access denied)"',
});

// ============================================================================
// HÀM HỖ TRỢ
// ============================================================================

const isScheduleResponse = (r: Response) =>
  new URL(r.url()).pathname.endsWith('/student-schedule/my') && r.request().method() === 'GET';

async function setAuthCookie(context: BrowserContext, token: string) {
  await context.clearCookies();
  await context.addCookies([{
    name: 'access_token', value: token, domain: new URL(getApiBaseUrl()).hostname,
    path: '/', httpOnly: true, secure: false, sameSite: 'Lax',
  }]);
}

// Đăng nhập sinh viên theo mã SV: email đọc từ DB (chỉ đọc), không in ra log
async function loginStudentByCode(request: APIRequestContext, context: BrowserContext, studentCode: string) {
  const rows = await dbSelect<{ email: string }>(
    `SELECT a.email FROM student s JOIN account a ON a.id = s.account_id WHERE s.student_code = ?`, [studentCode]);
  expect(rows, `Không tìm thấy tài khoản của sinh viên ${studentCode}`).toHaveLength(1);
  await setAuthCookie(context, await loginByEmail(request, rows[0].email));
}

async function loginByEnv(request: APIRequestContext, context: BrowserContext, envName: string) {
  const email = process.env[envName];
  if (!email) throw new Error(`Chưa cấu hình ${envName} trong .env.e2e`);
  await setAuthCookie(context, await loginByEmail(request, email));
}

// Mở trang chủ cổng sinh viên rồi bấm menu "Lịch bảo vệ", trả về response của GET /student-schedule/my
async function openScheduleByMenu(page: Page): Promise<Response> {
  await page.goto('/');
  const menu = page.getByRole('link', { name: 'Lịch bảo vệ' });
  await expect(menu).toBeVisible();
  const responsePromise = page.waitForResponse(isScheduleResponse);
  await menu.click();
  const response = await responsePromise;
  await expect(page).toHaveURL(/\/student\/schedule$/);
  return response;
}

async function expectOk(response: Response) {
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.code).toBe(1000);
  // FE gửi kèm mã học kỳ hiện tại
  expect(new URL(response.url()).searchParams.get('semesterId')).toBeTruthy();
  return body.data as any[];
}

function scheduleTable(page: Page): Locator {
  return page.getByRole('table', { name: 'Lịch phản biện và bảo vệ' });
}

// Kiểm tra 5 cột đầu của 1 dòng: Loại lịch | Ngày | Khung giờ | Địa điểm | Trạng thái
async function expectRow(row: Locator, cells: [string, string, string, string, string]) {
  const tds = row.getByRole('cell');
  for (let i = 0; i < cells.length; i++) {
    await expect(tds.nth(i)).toHaveText(cells[i]);
  }
}

const SNAPSHOT_CODES = ['2251190001', '2251190002', '99B14003'];

// Ảnh chụp lịch phản biện + ca bảo vệ của các sinh viên dùng trong test, để xác nhận test không làm đổi dữ liệu
async function scheduleSnapshot() {
  return dbSelect(
    `SELECT st.student_code, ea.examiner_order,
            DATE_FORMAT(ea.review_date, '%Y-%m-%d') AS review_date,
            TIME_FORMAT(ea.review_start_time, '%H:%i') AS review_start, TIME_FORMAT(ea.review_end_time, '%H:%i') AS review_end,
            ea.review_location, DATE_FORMAT(da.defense_start_time, '%Y-%m-%d %H:%i') AS defense_start,
            DATE_FORMAT(da.defense_end_time, '%Y-%m-%d %H:%i') AS defense_end, da.room
       FROM defense_assignment da
       JOIN thesis_topic tp ON tp.id = da.thesis_topic_id
       JOIN student st ON st.id = tp.student_id
       LEFT JOIN examiner_assignment ea ON ea.defense_assignment_id = da.id
      WHERE st.student_code IN (?, ?, ?)
      ORDER BY st.student_code, ea.examiner_order`, SNAPSHOT_CODES);
}

let before: unknown[] = [];

test.beforeAll(async () => {
  before = await scheduleSnapshot();
});

test.afterAll(async () => {
  // Test chỉ đọc: không có dữ liệu cần dọn, lịch của các sinh viên phải giữ nguyên
  expect(await scheduleSnapshot()).toEqual(before);
});

// ============================================================================
// CASE CHỨC NĂNG
// ============================================================================

test.describe(FN_VIEW, () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test(ITC203.title, { annotation: ITC203.annotation }, async ({ page, context, request }) => {
    await loginStudentByCode(request, context, '2251190001');
    const data = await expectOk(await openScheduleByMenu(page));

    expect(data.map((i) => i.title)).toEqual(['Phản biện 1', 'Phản biện 2', 'Bảo vệ đồ án']);
    expect(data.map((i) => i.scheduled)).toEqual([true, false, false]);

    const rows = scheduleTable(page).locator('tbody tr');
    await expect(rows).toHaveCount(3);
    await expectRow(rows.nth(0), ['Phản biện 1', '20/11/2026', '08:00 – 08:45', '302', 'Đã qua']);
    await expect(rows.nth(0)).toContainText('Giảng viên phản biện 1:Nguyễn Kỹ thuật phần mềm');
    await expectRow(rows.nth(1), ['Phản biện 2', '—', '—', '—', 'Chưa xếp lịch']);
    await expect(rows.nth(1)).toContainText('Giảng viên phản biện 2:TS. Lê Hoàng Nam');
    await expectRow(rows.nth(2), ['Bảo vệ đồ án', '—', '—', '—', 'Chưa xếp lịch']);
    await expect(rows.nth(2)).toContainText('Chủ tịch hội đồng:TS. Lê Hoàng Nam');
    await expect(rows.nth(2)).toContainText('Thư ký hội đồng:Nguyễn Kỹ thuật phần mềm');
    await expect(rows.nth(2).getByText('Ủy viên:', { exact: true })).toHaveCount(3);

    // Đối chiếu với lịch phản biện đã lưu (API trả đủ để so sánh, đọc DB để chắc dữ liệu hiển thị là dữ liệu thật)
    const db = await dbSelect<{ examiner_order: number; review_date: string | null; s: string | null; e: string | null; review_location: string | null }>(
      `SELECT ea.examiner_order, DATE_FORMAT(ea.review_date, '%Y-%m-%d') AS review_date,
              TIME_FORMAT(ea.review_start_time, '%H:%i') AS s, TIME_FORMAT(ea.review_end_time, '%H:%i') AS e, ea.review_location
         FROM examiner_assignment ea
         JOIN defense_assignment da ON da.id = ea.defense_assignment_id
         JOIN thesis_topic tp ON tp.id = da.thesis_topic_id
         JOIN student st ON st.id = tp.student_id
        WHERE st.student_code = ? ORDER BY ea.examiner_order`, ['2251190001']);
    expect(db).toEqual([
      { examiner_order: 1, review_date: '2026-11-20', s: '08:00', e: '08:45', review_location: '302' },
      { examiner_order: 2, review_date: null, s: null, e: null, review_location: null },
    ]);
    expect([data[0].date, data[0].startTime, data[0].endTime, data[0].location])
      .toEqual([db[0].review_date, db[0].s, db[0].e, db[0].review_location]);
  });

  test(ITC204.title, { annotation: ITC204.annotation }, async ({ page, context, request }) => {
    await loginStudentByCode(request, context, '99B14003');
    const data = await expectOk(await openScheduleByMenu(page));

    expect(data[0].title).toBe('Bảo vệ đồ án');
    expect(data[0].scheduled).toBe(true);

    const rows = scheduleTable(page).locator('tbody tr');
    await expect(rows).toHaveCount(3);
    await expectRow(rows.nth(0), ['Bảo vệ đồ án', '21/11/2026', '09:30 – 10:15', 'P.302 – Nhà C1', 'Đã qua']);
    await expect(rows.nth(0)).toContainText('Chủ tịch hội đồng:TS. Lê Hoàng Nam');
    await expect(rows.nth(0)).toContainText('Thư ký hội đồng:Nguyễn Kỹ thuật phần mềm');
    await expect(rows.nth(0).getByText('Ủy viên:', { exact: true })).toHaveCount(3);
    await expectRow(rows.nth(1), ['Phản biện 1', '—', '—', '—', 'Chưa xếp lịch']);
    await expect(rows.nth(1)).toContainText('Giảng viên phản biện 1:ThS. Hoàng Thị Yến');
    await expectRow(rows.nth(2), ['Phản biện 2', '—', '—', '—', 'Chưa xếp lịch']);
    await expect(rows.nth(2)).toContainText('Giảng viên phản biện 2:Lê Văn Khoa');

    const db = await dbSelect<{ d: string; s: string; e: string; room: string }>(
      `SELECT DATE_FORMAT(da.defense_start_time, '%Y-%m-%d') AS d, DATE_FORMAT(da.defense_start_time, '%H:%i') AS s,
              DATE_FORMAT(da.defense_end_time, '%H:%i') AS e, da.room
         FROM defense_assignment da
         JOIN thesis_topic tp ON tp.id = da.thesis_topic_id
         JOIN student st ON st.id = tp.student_id
        WHERE st.student_code = ?`, ['99B14003']);
    expect(db).toEqual([{ d: '2026-11-21', s: '09:30', e: '10:15', room: 'P.302 – Nhà C1' }]);
    expect([data[0].date, data[0].startTime, data[0].endTime, data[0].location])
      .toEqual([db[0].d, db[0].s, db[0].e, db[0].room]);
  });

  test(ITC205.title, { annotation: ITC205.annotation }, async ({ page, context, request }) => {
    await loginStudentByCode(request, context, '2251190002');
    const data = await expectOk(await openScheduleByMenu(page));

    expect(data).toHaveLength(3);
    expect(data.every((i) => i.scheduled === false)).toBe(true);

    const table = scheduleTable(page);
    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(3);
    await expectRow(rows.nth(0), ['Phản biện 1', '—', '—', '—', 'Chưa xếp lịch']);
    await expect(rows.nth(0)).toContainText('Giảng viên phản biện 1:Nguyễn Kỹ thuật phần mềm');
    await expectRow(rows.nth(1), ['Phản biện 2', '—', '—', '—', 'Chưa xếp lịch']);
    await expect(rows.nth(1)).toContainText('Giảng viên phản biện 2:TS. Lê Hoàng Nam');
    await expectRow(rows.nth(2), ['Bảo vệ đồ án', '—', '—', '—', 'Chưa xếp lịch']);

    // Không lộ lịch phản biện của "Nguyễn Hoàng An"
    await expect(table.getByText('20/11/2026')).toHaveCount(0);
    await expect(table.getByRole('cell', { name: '302', exact: true })).toHaveCount(0);
  });

  test(ITC206.title, { annotation: ITC206.annotation }, async ({ page, context, request }) => {
    await loginByEnv(request, context, 'E2E_EMAIL_STUDENT');
    const data = await expectOk(await openScheduleByMenu(page));

    expect(data).toEqual([]);
    await expect(page.getByText('Bạn chưa có lịch phản biện hoặc bảo vệ nào.')).toBeVisible();
    await expect(scheduleTable(page)).toHaveCount(0);

    // Sinh viên của tài khoản này thật sự chưa thuộc hội đồng nào
    const rows = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total FROM defense_assignment da
         JOIN thesis_topic tp ON tp.id = da.thesis_topic_id
         JOIN student st ON st.id = tp.student_id
        WHERE st.student_code = ?`, ['1026000001']);
    expect(Number(rows[0].total)).toBe(0);
  });
});

// ============================================================================
// SECURITY TEST
// ============================================================================

test.describe(`${FN_VIEW} - bảo mật`, () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test(SEC077.title, { annotation: SEC077.annotation }, async ({ page, request }) => {
    await page.goto('/student/schedule');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('table', { name: 'Lịch phản biện và bảo vệ' })).toHaveCount(0);

    const res = await request.get(`${getApiBaseUrl()}/student-schedule/my`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.code).toBe(2000);
    expect(body.data).toBeUndefined();
  });

  test(SEC078.title, { annotation: SEC078.annotation }, async ({ page, context, request }) => {
    await loginByEnv(request, context, 'E2E_EMAIL_SUPERVISOR');
    await page.goto('/student/schedule');
    await expect(page.getByText('Tài khoản của bạn không có quyền truy cập cổng sinh viên.')).toBeVisible();
    await expect(page.getByRole('table', { name: 'Lịch phản biện và bảo vệ' })).toHaveCount(0);

    // Gọi API bằng chính phiên Giảng viên của trình duyệt (cookie access_token)
    const res = await page.request.get(`${getApiBaseUrl()}/student-schedule/my`);
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.code).toBe(2001);
    expect(body.message).toBe('Bạn không có quyền truy cập (access denied)');
    expect(body.data).toBeUndefined();
  });
});
