import { test, expect, type APIRequestContext, type Page, type Response } from '@playwright/test';
import { defineItc, defineItcSec } from '../../../support/integration-test-case';
import { apiCall, getApiBaseUrl, loginByEmail } from '../../../support/api';
import { dbSelect } from '../../../support/db';

// ============================================================================
// ĐẶC TẢ TEST CASE (ITC321..ITC325 & TC-SEC-106..TC-SEC-108)
// Feature: defense | Module/Sheet: HoiDongDamNhan
// Role: Chủ tịch / Thư ký hội đồng — màn hình "Hội đồng của tôi" (/lecturer/defense/councils)
//       và chi tiết hội đồng (/lecturer/defense/councils/{hội đồng}?tab=members)
// Tài khoản TBM "Nguyễn Kỹ thuật phần mềm" là Thư ký của "HD KTPM 01" (không thuộc "HD KTPM 02").
// .env.e2e chưa có tài khoản Chủ tịch / Ủy viên → vai Chủ tịch, Ủy viên kiểm tra ở MockMvc (ITC326–ITC327).
// Các thao tác trong phạm vi đều chỉ đọc nên không phát sinh dữ liệu cần dọn.
// Tab Phân công (bộ PhanCongGVPB), Lịch bảo vệ, Chấm điểm, Tổng hợp là các tính năng riêng, không thuộc bộ này.
// ============================================================================

const FEATURE = 'defense';
const MODULE = 'HoiDongDamNhan';
const SHEET = 'HoiDongDamNhan';
const LIST_URL = '/lecturer/defense/councils';

const FN_LIST = 'Xem danh sách hội đồng đảm nhận';
const FN_DETAIL = 'Xem chi tiết hội đồng';

const PRE_BASE =
  'Giảng viên "Nguyễn Kỹ thuật phần mềm" đã đăng nhập, là Thư ký của duy nhất hội đồng "HD KTPM 01" (mã KTPM202601, học kỳ 1 năm học 2026-2027, ' +
  'đã công bố, bảo vệ 21/11/2026 08:00 – 23/11/2026 17:00, chưa xếp phòng, 7 sinh viên); hội đồng có Chủ tịch "Lê Hoàng Nam", ' +
  'Thư ký "Nguyễn Kỹ thuật phần mềm", Ủy viên "Lê Văn Khoa", "Hoàng Thị Yến", "Lý Thị Thanh Thảo"';

const ITC321 = defineItc({
  id: 'ITC321', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra mở màn hình Hội đồng của tôi hiển thị hội đồng đảm nhận kèm vai trò',
  procedure: '1. Đăng nhập vai trò Thư ký hội đồng.\n2. Mở màn hình "Hội đồng của tôi" (/lecturer/defense/councils).',
  expected:
    '1. Gọi GET /defense-council/my, HTTP 200, code = 1000; trả về 1 hội đồng KTPM202601 "HD KTPM 01", vai trò Thư ký, 7 sinh viên, đã công bố.\n' +
    '2. Bảng có 1 dòng "KTPM202601" – "HD KTPM 01", ngày 21/11/2026, "Chưa xếp phòng", vai trò "Thư ký", "7 sinh viên", trạng thái "Đã công bố".\n' +
    '3. Nút lọc "Tất cả" đếm 1, "Thư ký" đếm 1, "Chủ tịch" đếm 0, "Ủy viên" đếm 0.',
  precondition: PRE_BASE,
});

const ITC322 = defineItc({
  id: 'ITC322', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra lọc hội đồng theo vai trò',
  procedure: '1. Đăng nhập vai trò Thư ký hội đồng, mở màn hình "Hội đồng của tôi".\n2. Bấm lọc "Chủ tịch".\n3. Bấm lọc "Thư ký".',
  expected:
    '1. Lọc "Chủ tịch": bảng hiển thị "Bạn chưa được phân công vào hội đồng nào.", không gọi thêm API.\n' +
    '2. Lọc "Thư ký": bảng hiển thị lại dòng "KTPM202601" với vai trò "Thư ký".',
  precondition: PRE_BASE,
});

const ITC323 = defineItc({
  id: 'ITC323', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_DETAIL,
  description: 'Kiểm tra vào chi tiết hội đồng xem thông tin chung và danh sách thành viên',
  procedure: '1. Đăng nhập vai trò Thư ký hội đồng, mở màn hình "Hội đồng của tôi".\n2. Bấm "Vào chi tiết" trên dòng "KTPM202601".',
  expected:
    '1. Chuyển tới /lecturer/defense/councils/{mã hội đồng}?tab=members; gọi GET /defense-council/{mã hội đồng}/examiner, HTTP 200, code = 1000, vai trò của tôi là Thư ký.\n' +
    '2. Khối "Thông tin chung hội đồng" hiển thị "KTPM202601 — HD KTPM 01", địa điểm "Chưa cập nhật", vai trò "Thư ký", "7 SV", "5 Giảng viên", quyền phân công GVPB "Có quyền điều chỉnh".\n' +
    '3. Bảng "Thành viên hội đồng (5 giảng viên)" hiển thị: "Lê Hoàng Nam" – Chủ tịch, "Nguyễn Kỹ thuật phần mềm" – Thư ký (kèm nhãn "Bạn"), "Lê Văn Khoa", "Hoàng Thị Yến", "Lý Thị Thanh Thảo" – Ủy viên.',
  precondition: PRE_BASE,
});

const ITC324 = defineItc({
  id: 'ITC324', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_DETAIL,
  description: 'Kiểm tra Thư ký thấy đủ các tab quản lý hội đồng và ô chuyển hội đồng',
  procedure: '1. Đăng nhập vai trò Thư ký hội đồng, mở chi tiết hội đồng "KTPM202601".',
  expected:
    '1. Ô chọn hội đồng có lựa chọn "KTPM202601 (Thư ký)" đang được chọn.\n' +
    '2. Hiển thị các tab "Thành viên", "Phân công", "Lịch bảo vệ", "Chấm điểm", "Tổng hợp" (tab "Phân công" chỉ dành cho Chủ tịch / Thư ký).',
  precondition: PRE_BASE,
});

const ITC325 = defineItc({
  id: 'ITC325', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_DETAIL,
  description: 'Kiểm tra quay lại danh sách hội đồng từ trang chi tiết',
  procedure: '1. Đăng nhập vai trò Thư ký hội đồng, mở chi tiết hội đồng "KTPM202601".\n2. Bấm nút "Hội đồng" (Quay lại danh sách hội đồng).',
  expected: '1. Chuyển về /lecturer/defense/councils, gọi lại GET /defense-council/my, HTTP 200, code = 1000; bảng hiển thị dòng "KTPM202601".',
  precondition: PRE_BASE,
});

const SEC106 = defineItcSec({
  id: 'TC-SEC-106', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Giảng viên mở chi tiết hội đồng mà mình không phải thành viên',
  roleSession: 'Giảng viên "Nguyễn Kỹ thuật phần mềm" (Thư ký HD KTPM 01), đã đăng nhập',
  technique: 'DECISION_TABLE',
  given: 'Giảng viên không thuộc hội đồng "HD KTPM 02"',
  when: 'Mở thẳng /lecturer/defense/councils/{mã HD KTPM 02}?tab=members (giao diện gọi GET /defense-council/{mã HD KTPM 02}/examiner)',
  then: 'GET trả HTTP 403, code = 3120, message "Bạn không phải là thành viên của Hội đồng này"; màn hình hiển thị "Không tìm thấy thông tin hội đồng hoặc bạn không có quyền xem thông tin hội đồng này.", không lộ thành viên / sinh viên',
});

const SEC107 = defineItcSec({
  id: 'TC-SEC-107', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Sinh viên mở màn hình Hội đồng của tôi và gọi API danh sách hội đồng đảm nhận',
  roleSession: 'Sinh viên (STUDENT), đã đăng nhập',
  technique: 'EP',
  given: 'Đăng nhập bằng tài khoản Sinh viên',
  when: 'Mở thẳng /lecturer/defense/councils; gọi GET /defense-council/my bằng phiên Sinh viên',
  then: 'Màn hình hiển thị "Tài khoản của bạn không có quyền truy cập cổng cán bộ."; GET trả HTTP 403, code = 2001, không trả dữ liệu',
});

const SEC108 = defineItcSec({
  id: 'TC-SEC-108', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Chưa đăng nhập mở màn hình Hội đồng của tôi và gọi API danh sách hội đồng đảm nhận',
  roleSession: 'Chưa đăng nhập (không có cookie phiên)',
  technique: 'EP',
  given: 'Trình duyệt chưa đăng nhập',
  when: 'Mở thẳng /lecturer/defense/councils; gọi GET /defense-council/my không kèm phiên đăng nhập',
  then: 'Bị chuyển về trang đăng nhập (/login); GET trả HTTP 401, code = 2000',
});

// ============================================================================
// HÀM HỖ TRỢ
// ============================================================================

let council01 = '';
let council02 = '';

const token = (request: APIRequestContext, role: 'HEAD_OF_MAJOR' | 'STUDENT') => {
  const email = process.env[`E2E_EMAIL_${role}`];
  if (!email) throw new Error(`Chưa cấu hình E2E_EMAIL_${role} trong .env.e2e`);
  return loginByEmail(request, email);
};

const isMy = (r: Response) => r.request().method() === 'GET' && new URL(r.url()).pathname.endsWith('/defense-council/my');
const isBoard = (r: Response) => r.request().method() === 'GET' && /\/defense-council\/[^/]+\/examiner$/.test(new URL(r.url()).pathname);
const councilRow = (page: Page) => page.getByRole('row').filter({ hasText: 'KTPM202601' });
const roleFilter = (page: Page, label: string) => page.getByRole('button', { name: new RegExp(`^${label}\\s*\\d+$`) });

async function openList(page: Page) {
  const resPromise = page.waitForResponse(isMy);
  await page.goto(LIST_URL);
  const res = await resPromise;
  await expect(councilRow(page)).toBeVisible();
  return res;
}

async function openDetail(page: Page) {
  const resPromise = page.waitForResponse(isBoard);
  await page.goto(`${LIST_URL}/${council01}?tab=members`);
  const res = await resPromise;
  await expect(page.getByText('Thông tin chung hội đồng')).toBeVisible();
  return res;
}

// ============================================================================
// TEST
// ============================================================================

test.beforeAll(async ({ request }) => {
  const sec = await token(request, 'HEAD_OF_MAJOR');
  const my = (await apiCall(request, sec, 'GET', '/defense-council/my')).body.data;
  expect(my, 'Tiền điều kiện: chỉ là thành viên của 1 hội đồng').toHaveLength(1);
  council01 = my[0].councilPublicId;
  // Mã HD KTPM 02 lấy qua API tổng quan hội đồng (tài khoản này cũng là Trưởng bộ môn)
  const semesterId = (await apiCall(request, sec, 'GET', '/semester/current')).body.data.publicId;
  const majorId = (await apiCall(request, sec, 'GET', '/teacher/managed-major')).body.data.publicId;
  const ov = await apiCall(request, sec, 'GET', '/defense-council', { params: { semesterId, majorId } });
  council02 = ov.body.data.councils.find((c: any) => c.code === 'KTPM202602').publicId;
  const members = await dbSelect<{ n: number }>(
    `SELECT COUNT(*) AS n FROM defense_council_member m JOIN defense_council dc ON dc.id = m.council_id WHERE dc.code = 'KTPM202601'`);
  expect(members[0].n, 'Tiền điều kiện: HD KTPM 01 có 5 thành viên').toBe(5);
});

test.describe('Hội đồng đảm nhận (Thư ký hội đồng)', () => {
  test.use({ storageState: '.auth/head_of_major.json' });

  test.describe(FN_LIST, () => {
    test(ITC321.title, { annotation: ITC321.annotation }, async ({ page }) => {
      const res = await openList(page);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.data).toHaveLength(1);
      expect(body.data[0]).toMatchObject({ code: 'KTPM202601', name: 'HD KTPM 01', myRole: 'SECRETARY', studentCount: 7, status: 'PUBLISHED' });

      const row = councilRow(page);
      for (const t of ['HD KTPM 01', '21/11/2026', 'Chưa xếp phòng', 'Thư ký', '7 sinh viên', 'Đã công bố']) await expect(row).toContainText(t);
      await expect(roleFilter(page, 'Tất cả')).toContainText('1');
      await expect(roleFilter(page, 'Thư ký')).toContainText('1');
      await expect(roleFilter(page, 'Chủ tịch')).toContainText('0');
      await expect(roleFilter(page, 'Ủy viên')).toContainText('0');
    });

    test(ITC322.title, { annotation: ITC322.annotation }, async ({ page }) => {
      await openList(page);
      let extra = 0;
      page.on('request', (r) => { if (r.method() === 'GET' && new URL(r.url()).pathname.endsWith('/defense-council/my')) extra++; });
      await roleFilter(page, 'Chủ tịch').click();
      await expect(page.getByText('Bạn chưa được phân công vào hội đồng nào.')).toBeVisible();
      await expect(councilRow(page)).toHaveCount(0);
      await roleFilter(page, 'Thư ký').click();
      await expect(councilRow(page)).toContainText('Thư ký');
      expect(extra).toBe(0);
    });
  });

  test.describe(FN_DETAIL, () => {
    test(ITC323.title, { annotation: ITC323.annotation }, async ({ page }) => {
      await openList(page);
      const resPromise = page.waitForResponse(isBoard);
      await councilRow(page).getByRole('button', { name: 'Vào chi tiết' }).click();
      const res = await resPromise;
      await expect(page).toHaveURL(new RegExp(`/lecturer/defense/councils/${council01}\\?tab=members`));
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.data.myRole).toBe('SECRETARY');

      for (const t of ['KTPM202601 — HD KTPM 01', 'Chưa cập nhật', '7 SV', '5 Giảng viên', 'Có quyền điều chỉnh']) {
        await expect(page.getByText(t, { exact: true }).first()).toBeVisible();
      }
      await expect(page.getByText('Vai trò của bạn').locator('..')).toContainText('Thư ký');
      await expect(page.getByText('Thành viên hội đồng (5 giảng viên)')).toBeVisible();
      const memberRow = (name: string) => page.getByRole('row').filter({ hasText: name });
      await expect(memberRow('Lê Hoàng Nam')).toContainText('Chủ tịch');
      await expect(memberRow('Nguyễn Kỹ thuật phần mềm')).toContainText('Thư ký');
      await expect(memberRow('Nguyễn Kỹ thuật phần mềm')).toContainText('Bạn');
      for (const n of ['Lê Văn Khoa', 'Hoàng Thị Yến', 'Lý Thị Thanh Thảo']) await expect(memberRow(n)).toContainText('Ủy viên');
    });

    test(ITC324.title, { annotation: ITC324.annotation }, async ({ page }) => {
      await openDetail(page);
      const selector = page.locator('select').filter({ has: page.locator(`option[value="${council01}"]`) });
      await expect(selector).toHaveValue(council01);
      await expect(selector.locator('option:checked')).toHaveText('KTPM202601 (Thư ký)');
      for (const tab of ['Thành viên', 'Phân công', 'Lịch bảo vệ', 'Chấm điểm', 'Tổng hợp']) {
        await expect(page.getByRole('button', { name: new RegExp(`^${tab}`) }).first()).toBeVisible();
      }
    });

    test(ITC325.title, { annotation: ITC325.annotation }, async ({ page }) => {
      await openDetail(page);
      const resPromise = page.waitForResponse(isMy);
      await page.getByTitle('Quay lại danh sách hội đồng').click();
      const res = await resPromise;
      await expect(page).toHaveURL(/\/lecturer\/defense\/councils$/);
      expect(res.status()).toBe(200);
      expect((await res.json()).code).toBe(1000);
      await expect(councilRow(page)).toBeVisible();
    });
  });

  test.describe('SecurityTest - không phải thành viên', () => {
    test(SEC106.title, { annotation: SEC106.annotation }, async ({ page }) => {
      const resPromise = page.waitForResponse(isBoard);
      await page.goto(`${LIST_URL}/${council02}?tab=members`);
      const res = await resPromise;
      expect(new URL(res.url()).pathname).toContain(`/defense-council/${council02}/examiner`);
      expect(res.status()).toBe(403);
      const body = await res.json();
      expect(body.code).toBe(3120);
      expect(body.message).toBe('Bạn không phải là thành viên của Hội đồng này');
      expect(body.data ?? null).toBeNull();
      await expect(page.getByText('Không tìm thấy thông tin hội đồng hoặc bạn không có quyền xem thông tin hội đồng này.')).toBeVisible();
      await expect(page.getByText('Thông tin chung hội đồng')).toHaveCount(0);
    });
  });
});

test.describe('SecurityTest - Hội đồng đảm nhận', () => {
  test.describe('Sinh viên', () => {
    test.use({ storageState: '.auth/student.json' });
    test(SEC107.title, { annotation: SEC107.annotation }, async ({ page, request }) => {
      await page.goto(LIST_URL);
      await expect(page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.')).toBeVisible();
      await expect(councilRow(page)).toHaveCount(0);
      const st = await token(request, 'STUDENT');
      const res = await apiCall(request, st, 'GET', '/defense-council/my');
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(2001);
      expect(res.body.data ?? null).toBeNull();
    });
  });

  test.describe('Chưa đăng nhập', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test(SEC108.title, { annotation: SEC108.annotation }, async ({ page, request }) => {
      await page.goto(LIST_URL);
      await expect(page).toHaveURL(/\/login/);
      const res = await request.get(`${getApiBaseUrl()}/defense-council/my`);
      expect(res.status()).toBe(401);
      expect((await res.json()).code).toBe(2000);
    });
  });
});
