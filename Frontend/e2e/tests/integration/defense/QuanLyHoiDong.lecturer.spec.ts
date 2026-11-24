import { test, expect, type APIRequestContext, type Page, type Response } from '@playwright/test';
import { defineItc, defineItcSec } from '../../../support/integration-test-case';
import { apiCall, getApiBaseUrl, loginByEmail } from '../../../support/api';
import { dbSelect } from '../../../support/db';

// ============================================================================
// ĐẶC TẢ TEST CASE (ITC183..ITC188 & TC-SEC-073..TC-SEC-074)
// Feature: defense | Module/Sheet: QuanLyHoiDong
// Role: Trưởng bộ môn (HEAD_OF_MAJOR) — màn hình "Hội đồng bảo vệ" (/department/councils)
// Mọi thao tác ghi (tạo / sửa / xóa hội đồng, lưu thành viên, đổi ngày chung) yêu cầu mốc
// "Thành lập hội đồng" đang mở. Học kỳ hiện tại CHƯA thiết lập mốc này, và mở mốc sẽ tạo bản ghi
// mốc không xóa được bằng API. Vì vậy Playwright chỉ kiểm tra: xem dữ liệu, giao diện khóa thao tác,
// thao tác ghi bị BE chặn (không ghi gì). Các luồng ghi thành công chạy ở MockMvc (ITC189–ITC193, tự rollback).
// Không có sinh viên nào đang chờ gán hội đồng nên luồng gán sinh viên thành công cũng chỉ chạy ở MockMvc.
// ============================================================================

const FEATURE = 'defense';
const MODULE = 'QuanLyHoiDong';
const SHEET = 'QuanLyHoiDong';
const PAGE_URL = '/department/councils';

const FN_LIST = 'Xem danh sách hội đồng';
const FN_MEMBERS = 'Gán giảng viên vào hội đồng';
const FN_STUDENTS = 'Gán sinh viên vào hội đồng';

const BLOCK_BANNER = 'Mốc "Thành lập hội đồng" chưa được thiết lập cho học kỳ này.';
const BE_BLOCK_MESSAGE = "Thời hạn 'Thành lập hội đồng' chưa được thiết lập cho học kỳ này";

const PRE_BASE =
  'Trưởng bộ môn ngành Kỹ thuật phần mềm đã đăng nhập; "Học kỳ 1 năm học 2026-2027" có 8 hội đồng của ngành: ' +
  '"HD KTPM 01" (đã công bố, 5 thành viên, 7 sinh viên) và "HD KTPM 02" – "HD KTPM 08" (nháp, chưa có thành viên); ' +
  'mốc "Thành lập hội đồng" của học kỳ CHƯA được thiết lập; không còn sinh viên nào chờ gán hội đồng';

const ITC183 = defineItc({
  id: 'ITC183', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra mở màn hình Hội đồng bảo vệ hiển thị danh sách hội đồng của ngành trong học kỳ',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn.\n2. Mở màn hình "Hội đồng bảo vệ" (/department/councils).',
  expected:
    '1. Gọi GET /defense-council với học kỳ hiện tại và ngành Kỹ thuật phần mềm, HTTP 200, code = 1000, message "Lấy tổng quan hội đồng bảo vệ thành công"; 8 hội đồng, 7 hội đồng chưa đủ thành viên, 0 sinh viên chờ.\n' +
    '2. Bảng hiển thị "HD KTPM 01" đến "HD KTPM 08"; tab "Danh sách hội đồng" có số 8, tab "Gán giảng viên vào hội đồng" có nhãn "7 thiếu", tab "Gán sinh viên vào hội đồng" có nhãn "0 SV chờ".\n' +
    '3. Dữ liệu: ngành có đúng 8 hội đồng trong học kỳ.',
  precondition: PRE_BASE,
});

const ITC184 = defineItc({
  id: 'ITC184', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra giao diện khóa tạo / sửa / xóa hội đồng khi mốc "Thành lập hội đồng" chưa thiết lập',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn.\n2. Mở màn hình "Hội đồng bảo vệ", xem tab "Danh sách hội đồng".',
  expected:
    '1. Giao diện tải mốc thời hạn của học kỳ (GET /api/v1/deadlines, HTTP 200, code = 1000), mốc "Thành lập hội đồng" chưa có thời gian.\n' +
    '2. Hiển thị cảnh báo "Mốc \\"Thành lập hội đồng\\" chưa được thiết lập cho học kỳ này."; nút "Tạo hội đồng" và "Sửa ngày bảo vệ chung" bị khóa; ô phòng bảo vệ của "HD KTPM 02" bị khóa; không có nút xóa hội đồng.',
  precondition: PRE_BASE,
});

const ITC185 = defineItc({
  id: 'ITC185', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra xem chi tiết hội đồng đã công bố',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Hội đồng bảo vệ".\n2. Bấm "Xem chi tiết" trên dòng "HD KTPM 01".',
  expected:
    '1. Popup chi tiết "HD KTPM 01" hiển thị 5 thành viên: Chủ tịch "Lê Hoàng Nam", Thư ký "Nguyễn Kỹ thuật phần mềm", các Ủy viên "Lê Văn Khoa", "Hoàng Thị Yến", "Lý Thị Thanh Thảo".',
  precondition: PRE_BASE,
});

const ITC186 = defineItc({
  id: 'ITC186', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_MEMBERS,
  description: 'Kiểm tra mở tab gán giảng viên hiển thị giảng viên ứng viên và số thành viên của từng hội đồng',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Hội đồng bảo vệ".\n2. Bấm tab "Gán giảng viên vào hội đồng".',
  expected:
    '1. Gọi GET /defense-council/teacher với học kỳ và ngành, HTTP 200, code = 1000, message "Lấy danh sách giảng viên thành công", trả về 25 giảng viên.\n' +
    '2. Cột "Danh sách hội đồng" hiển thị "HD KTPM 01" với "5/5 TV" và "HD KTPM 02" với "0/5 TV".',
  precondition: PRE_BASE,
});

const ITC187 = defineItc({
  id: 'ITC187', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_MEMBERS,
  description: 'Kiểm tra lưu thành viên cho hội đồng nháp khi mốc "Thành lập hội đồng" chưa thiết lập',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Hội đồng bảo vệ", bấm tab "Gán giảng viên vào hội đồng".\n' +
    '2. Chọn hội đồng "HD KTPM 02"; trong danh sách "Chưa gán HĐ", tích chọn giảng viên "Đỗ Đức Long" và chọn vai trò "Chủ tịch".\n3. Bấm "Gán (1/5)".',
  expected:
    '1. Gọi PUT /defense-council/{mã hội đồng HD KTPM 02}/member, HTTP 400, code = 3064, message "Thời hạn \'Thành lập hội đồng\' chưa được thiết lập cho học kỳ này".\n' +
    '2. Hiện thông báo lỗi đúng message trên.\n3. Dữ liệu: "HD KTPM 02" vẫn chưa có thành viên nào.',
  precondition: PRE_BASE,
});

const ITC188 = defineItc({
  id: 'ITC188', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_STUDENTS,
  description: 'Kiểm tra tab gán sinh viên hiển thị sinh viên đủ điều kiện chưa gán và đã gán hội đồng',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Hội đồng bảo vệ".\n' +
    '2. Bấm tab "Gán sinh viên vào hội đồng".\n3. Bấm "Đã gán HĐ".',
  expected:
    '1. Gọi GET /defense-council/student với assigned = false, HTTP 200, code = 1000, danh sách rỗng.\n' +
    '2. Sau khi bấm "Đã gán HĐ": gọi GET /defense-council/student với assigned = true, HTTP 200, code = 1000; bảng hiển thị sinh viên "SV1 Test Đạt" (99B14001) thuộc "HD KTPM 01".',
  precondition: PRE_BASE + '; sinh viên "SV1 Test Đạt" (99B14001) đã được gán vào "HD KTPM 01"',
});

const SEC073 = defineItcSec({
  id: 'TC-SEC-073', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Sinh viên mở màn hình Hội đồng bảo vệ và gọi API xem tổng quan hội đồng',
  roleSession: 'Sinh viên (STUDENT), đã đăng nhập',
  technique: 'EP',
  given: 'Đăng nhập bằng tài khoản Sinh viên',
  when: 'Mở thẳng /department/councils; gọi GET /defense-council (học kỳ hiện tại, ngành Kỹ thuật phần mềm) bằng phiên Sinh viên',
  then: 'Màn hình hiển thị "Tài khoản của bạn không có quyền truy cập cổng cán bộ."; GET trả HTTP 403, code = 2001, không trả danh sách hội đồng',
});

const SEC074 = defineItcSec({
  id: 'TC-SEC-074', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Chưa đăng nhập mở màn hình Hội đồng bảo vệ và gọi API xóa hội đồng',
  roleSession: 'Chưa đăng nhập (không có cookie phiên)',
  technique: 'EP',
  given: 'Trình duyệt chưa đăng nhập; hội đồng "HD KTPM 02" đang tồn tại',
  when: 'Mở thẳng /department/councils; gọi DELETE /defense-council/{mã hội đồng HD KTPM 02} không kèm phiên đăng nhập',
  then: 'Bị chuyển về trang đăng nhập (/login); DELETE trả HTTP 401, code = 2000; "HD KTPM 02" vẫn tồn tại',
});

// ============================================================================
// HÀM HỖ TRỢ
// ============================================================================

let semesterId = '';
let majorId = '';
let council02Id = '';

function requireEmail(role: string): string {
  const email = process.env[`E2E_EMAIL_${role}`];
  if (!email) throw new Error(`Chưa cấu hình E2E_EMAIL_${role} trong .env.e2e`);
  return email;
}
const token = (request: APIRequestContext, role: 'HEAD_OF_MAJOR' | 'STUDENT') => loginByEmail(request, requireEmail(role));

async function councilCount() {
  return (await dbSelect<{ n: number }>(
    `SELECT COUNT(*) AS n FROM defense_council dc JOIN semester s ON s.id = dc.semester_id JOIN major m ON m.id = dc.major_id
      WHERE s.status = 'ONGOING' AND m.code = 'KTPM01'`))[0].n;
}

async function memberCount(code: string) {
  return (await dbSelect<{ n: number }>(
    `SELECT COUNT(*) AS n FROM defense_council_member x JOIN defense_council dc ON dc.id = x.council_id WHERE dc.code = ?`, [code]))[0].n;
}

const isOverview = (r: Response) => r.request().method() === 'GET' && new URL(r.url()).pathname.endsWith('/defense-council');

async function openPage(page: Page) {
  const resPromise = page.waitForResponse(isOverview);
  await page.goto(PAGE_URL);
  const res = await resPromise;
  await expect(page.getByRole('tab', { name: /Danh sách hội đồng/ })).toBeVisible();
  await expect(page.getByText('HD KTPM 01').first()).toBeVisible();
  return res;
}

// ============================================================================
// TEST
// ============================================================================

test.beforeAll(async ({ request }) => {
  const hm = await token(request, 'HEAD_OF_MAJOR');
  semesterId = (await apiCall(request, hm, 'GET', '/semester/current')).body.data.publicId;
  majorId = (await apiCall(request, hm, 'GET', '/teacher/managed-major')).body.data.publicId;
  const ov = await apiCall(request, hm, 'GET', '/defense-council', { params: { semesterId, majorId } });
  council02Id = ov.body.data.councils.find((c: any) => c.name === 'HD KTPM 02').publicId;
  expect(await councilCount(), 'Tiền điều kiện: 8 hội đồng').toBe(8);
  expect(await memberCount('KTPM202602')).toBe(0);
  const dl = await dbSelect(
    `SELECT d.id FROM semester_deadlines d JOIN deadline_templates t ON t.id = d.template_id JOIN semester s ON s.id = d.semester_id
      WHERE s.status = 'ONGOING' AND t.code = 'THANH_LAP_HOI_DONG'`);
  expect(dl, 'Tiền điều kiện: mốc Thành lập hội đồng chưa thiết lập').toHaveLength(0);
});

test.describe('Hội đồng bảo vệ (Trưởng bộ môn)', () => {
  test.use({ storageState: '.auth/head_of_major.json' });

  test.describe(FN_LIST, () => {
    test(ITC183.title, { annotation: ITC183.annotation }, async ({ page }) => {
      const res = await openPage(page);
      const u = new URL(res.url());
      expect(u.searchParams.get('semesterId')).toBe(semesterId);
      expect(u.searchParams.get('majorId')).toBe(majorId);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.message).toBe('Lấy tổng quan hội đồng bảo vệ thành công');
      expect(body.data.councils).toHaveLength(8);
      expect(body.data.incompleteCouncilCount).toBe(7);
      expect(body.data.waitingStudentCount).toBe(0);

      for (let i = 1; i <= 8; i++) await expect(page.getByText(`HD KTPM 0${i}`).first()).toBeVisible();
      await expect(page.getByRole('tab', { name: /Danh sách hội đồng/ })).toContainText('8');
      await expect(page.getByRole('tab', { name: /Gán giảng viên vào hội đồng/ })).toContainText('7 thiếu');
      await expect(page.getByRole('tab', { name: /Gán sinh viên vào hội đồng/ })).toContainText('0 SV chờ');
      expect(await councilCount()).toBe(8);
    });

    test(ITC184.title, { annotation: ITC184.annotation }, async ({ page }) => {
      const dlPromise = page.waitForResponse((r) => r.request().method() === 'GET' && new URL(r.url()).pathname.endsWith('/api/v1/deadlines'));
      await openPage(page);
      const dl = await dlPromise;
      expect(dl.status()).toBe(200);
      const dlBody = await dl.json();
      expect(dlBody.code).toBe(1000);
      const thanhLap = dlBody.data.danhGiaDeadlines.find((d: any) => d.code === 'THANH_LAP_HOI_DONG');
      expect(thanhLap.startDate ?? null).toBeNull();

      await expect(page.getByText(BLOCK_BANNER)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Tạo hội đồng' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Sửa ngày bảo vệ chung' })).toBeDisabled();
      await expect(page.getByLabel('Phòng bảo vệ của HD KTPM 02')).toBeDisabled();
      await expect(page.getByRole('button', { name: /^Xóa HD KTPM/ })).toHaveCount(0);
    });

    test(ITC185.title, { annotation: ITC185.annotation }, async ({ page }) => {
      await openPage(page);
      await page.getByRole('button', { name: 'Xem chi tiết HD KTPM 01' }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toContainText('HD KTPM 01');
      for (const [role, name] of [['Chủ tịch', 'Lê Hoàng Nam'], ['Thư ký', 'Nguyễn Kỹ thuật phần mềm'],
        ['Ủy viên', 'Lê Văn Khoa'], ['Ủy viên', 'Hoàng Thị Yến'], ['Ủy viên', 'Lý Thị Thanh Thảo']]) {
        await expect(dialog).toContainText(role);
        await expect(dialog).toContainText(name);
      }
    });
  });

  test.describe(FN_MEMBERS, () => {
    async function openMembers(page: Page) {
      await openPage(page);
      const resPromise = page.waitForResponse((r) => r.request().method() === 'GET' && new URL(r.url()).pathname.endsWith('/defense-council/teacher'));
      await page.getByRole('tab', { name: /Gán giảng viên vào hội đồng/ }).click();
      return resPromise;
    }
    const councilCard = (page: Page, name: string) => page.getByRole('button').filter({ hasText: name }).filter({ hasText: '/5 TV' });

    test(ITC186.title, { annotation: ITC186.annotation }, async ({ page }) => {
      const res = await openMembers(page);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.message).toBe('Lấy danh sách giảng viên thành công');
      expect(body.data).toHaveLength(25);
      await expect(councilCard(page, 'HD KTPM 01')).toContainText('5/5 TV');
      await expect(councilCard(page, 'HD KTPM 02')).toContainText('0/5 TV');
    });

    test(ITC187.title, { annotation: ITC187.annotation }, async ({ page }) => {
      await openMembers(page);
      await councilCard(page, 'HD KTPM 02').click();
      const teacherBox = page.getByRole('checkbox', { name: 'Đỗ Đức Long', exact: true });
      await teacherBox.check();
      // Dòng giảng viên: khối nhỏ nhất chứa ô tích của giảng viên và cụm nút vai trò
      const teacherRow = page.locator('div').filter({ has: teacherBox }).filter({ has: page.getByRole('button', { name: 'Chủ tịch' }) }).last();
      await teacherRow.getByRole('button', { name: 'Chủ tịch' }).click();
      const resPromise = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/defense-council\/[^/]+\/member$/.test(new URL(r.url()).pathname));
      await page.getByRole('button', { name: /^Gán \(1\/5\)$/ }).click();
      const res = await resPromise;
      expect(new URL(res.url()).pathname).toContain(`/defense-council/${council02Id}/member`);
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.code).toBe(3064);
      expect(body.message).toBe(BE_BLOCK_MESSAGE);
      await expect(page.getByText(BE_BLOCK_MESSAGE).first()).toBeVisible();
      expect(await memberCount('KTPM202602')).toBe(0);
    });
  });

  test.describe(FN_STUDENTS, () => {
    test(ITC188.title, { annotation: ITC188.annotation }, async ({ page }) => {
      await openPage(page);
      const isStudents = (r: Response, assigned: string) => r.request().method() === 'GET'
        && new URL(r.url()).pathname.endsWith('/defense-council/student') && new URL(r.url()).searchParams.get('assigned') === assigned;
      const unassignedPromise = page.waitForResponse((r) => isStudents(r, 'false'));
      await page.getByRole('tab', { name: /Gán sinh viên vào hội đồng/ }).click();
      const res1 = await unassignedPromise;
      expect(res1.status()).toBe(200);
      const b1 = await res1.json();
      expect(b1.code).toBe(1000);
      expect(b1.data.content ?? []).toHaveLength(0);

      const assignedPromise = page.waitForResponse((r) => isStudents(r, 'true'));
      await page.getByRole('button', { name: /Đã gán HĐ/ }).click();
      const res2 = await assignedPromise;
      expect(res2.status()).toBe(200);
      expect((await res2.json()).code).toBe(1000);
      await expect(page.getByRole('checkbox', { name: /^SV1 Test Đạt 99B14001/ })).toBeVisible();
      const row = page.locator('div').filter({ has: page.getByRole('checkbox', { name: /^SV1 Test Đạt 99B14001/ }) }).filter({ hasText: 'HĐ: HD KTPM 01' }).last();
      await expect(row).toContainText('HĐ: HD KTPM 01');
    });
  });
});

test.describe('SecurityTest - Hội đồng bảo vệ', () => {
  test.describe('Sinh viên', () => {
    test.use({ storageState: '.auth/student.json' });
    test(SEC073.title, { annotation: SEC073.annotation }, async ({ page, request }) => {
      await page.goto(PAGE_URL);
      await expect(page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.')).toBeVisible();
      await expect(page.getByRole('tab', { name: /Danh sách hội đồng/ })).toHaveCount(0);
      const st = await token(request, 'STUDENT');
      const res = await apiCall(request, st, 'GET', '/defense-council', { params: { semesterId, majorId } });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(2001);
      expect(res.body.data ?? null).toBeNull();
    });
  });

  test.describe('Chưa đăng nhập', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test(SEC074.title, { annotation: SEC074.annotation }, async ({ page, request }) => {
      await page.goto(PAGE_URL);
      await expect(page).toHaveURL(/\/login/);
      const res = await request.delete(`${getApiBaseUrl()}/defense-council/${council02Id}`);
      expect(res.status()).toBe(401);
      expect((await res.json()).code).toBe(2000);
      expect(await councilCount()).toBe(8);
    });
  });
});
