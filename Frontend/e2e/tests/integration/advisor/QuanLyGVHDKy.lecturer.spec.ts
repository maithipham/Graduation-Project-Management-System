import path from 'node:path';
import fs from 'node:fs';
import { test, expect, type APIRequestContext, type Page, type Response } from '@playwright/test';
import { defineItc, defineItcSec } from '../../../support/integration-test-case';
import { apiCall, getApiBaseUrl, loginByEmail } from '../../../support/api';
import { dbSelect } from '../../../support/db';
import { writeXlsx } from '../../../support/xlsx';

// ============================================================================
// ĐẶC TẢ TEST CASE (ITC147..ITC158 & TC-SEC-066..TC-SEC-067)
// Feature: advisor | Module/Sheet: QuanLyGVHDKy
// Role: Trưởng bộ môn (HEAD_OF_MAJOR) — màn hình "/department/supervisors" (tab tổng quan GVHD của kỳ)
// Chỉ gồm các case dọn / khôi phục được bằng API. Theo lựa chọn của user, các case Import thành công,
// Loại bỏ GVHD và Lưu thiết lập hạn mức theo chức danh chỉ chạy ở MockMvc (tự rollback), vì:
//   - Import / phân công GVHD luôn gửi thông báo cho giảng viên → không xóa được tài khoản test.
//   - Lưu thiết lập hạn mức ghi đè hạn mức riêng của mọi GVHD trong kỳ.
// Case sửa hạn mức tăng hạn mức của 1 GVHD có sẵn rồi khôi phục đúng giá trị cũ sau test.
// ============================================================================

const FEATURE = 'advisor';
const MODULE = 'QuanLyGVHDKy';
const SHEET = 'QuanLyGVHDKy';
const PAGE_URL = '/department/supervisors';
const SEARCH_PLACEHOLDER = 'Tìm theo tên giảng viên, email, bộ môn...';

const FN_LIST = 'Xem danh sách GVHD của kỳ';
const FN_QUOTA = 'Sửa hạn mức GVHD';
const FN_REMOVE = 'Loại bỏ GVHD khỏi kỳ';
const FN_TITLE_QUOTA = 'Thiết lập hạn mức theo chức danh';
const FN_IMPORT = 'Import GVHD';
const FN_EXPORT = 'Export danh sách GVHD';

const PRE_BASE =
  'Trưởng bộ môn ngành Kỹ thuật phần mềm đã đăng nhập; học kỳ đang diễn ra "Học kỳ 1 năm học 2026-2027" có 17 GVHD, danh sách chưa chốt';
const PRE_TRANG = PRE_BASE + '; GVHD "Phạm Thu Trang" (TS., Kỹ thuật phần mềm) có hạn mức 2 SV, đang hướng dẫn 0 SV, không có đơn chờ duyệt';
const PRE_HAI = PRE_BASE + '; GVHD "Nguyễn Văn Hải" (ThS., Kỹ thuật phần mềm) có hạn mức 11 SV, đang hướng dẫn 2 SV';

const ITC147 = defineItc({
  id: 'ITC147', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra mở màn hình GVHD của kỳ hiển thị danh sách GVHD học kỳ đang diễn ra',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn.\n2. Mở màn hình "Hướng dẫn" (/department/supervisors).',
  expected:
    '1. Gọi GET /semesters/{mã học kỳ đang diễn ra}/advisors, HTTP 200, code = 1000, message "Lấy danh sách giáo viên hướng dẫn trong kỳ thành công", trả về 17 GVHD (bằng số GVHD đang hoạt động của kỳ trong hệ thống).\n' +
    '2. Ô "Lọc theo bộ môn" mặc định chọn "Kỹ thuật phần mềm" (ngành Trưởng bộ môn phụ trách).\n' +
    '3. Bảng có dòng "Phạm Thu Trang" với học vị "TS.", bộ môn "Kỹ thuật phần mềm", "Trong trường", hạn mức 2, tiến độ "0/2 SV".',
  precondition: PRE_TRANG,
});

const ITC148 = defineItc({
  id: 'ITC148', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra tìm kiếm GVHD theo tên giảng viên',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Hướng dẫn".\n2. Nhập "Phạm Thu Trang" vào ô "Tìm theo tên giảng viên, email, bộ môn...".',
  expected: '1. Danh sách đã tải (HTTP 200, code = 1000) được lọc trên giao diện, không gọi thêm API.\n2. Bảng chỉ còn 1 dòng "Phạm Thu Trang".',
  precondition: PRE_TRANG,
});

const ITC149 = defineItc({
  id: 'ITC149', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra lọc GVHD ngoài trường',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Hướng dẫn".\n2. Chọn bộ môn "Tất cả bộ môn", chọn đơn vị "Ngoài trường".',
  expected:
    '1. Bảng chỉ còn 4 GVHD ngoài trường: "Nguyễn Văn Bình", "Lý Thị Thanh Thảo", "Vũ Hải Yến", "Trịnh Quốc Bảo", mỗi dòng có nhãn "Ngoài trường".\n' +
    '2. Số dòng khớp số GVHD ngoài trường API trả về.',
  precondition: PRE_BASE + '; trong đó 4 GVHD ngoài trường',
});

const ITC150 = defineItc({
  id: 'ITC150', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra lọc GVHD đang hướng dẫn sinh viên',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Hướng dẫn".\n2. Chọn trạng thái "Đang hướng dẫn".',
  expected:
    '1. Bảng chỉ còn 4 GVHD đang có sinh viên: "Nguyễn Kỹ thuật phần mềm" (1 SV), "Nguyễn Văn Hải" (2 SV), "Trần Quốc Bảo" (4 SV), "Nguyễn Văn Minh" (3 SV).\n' +
    '2. Không có dòng "Phạm Thu Trang" (0 SV).',
  precondition: PRE_BASE + '; 4 GVHD đang hướng dẫn ít nhất 1 sinh viên',
});

const ITC151 = defineItc({
  id: 'ITC151', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra lọc GVHD theo bộ môn "Hệ thống thông tin"',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Hướng dẫn".\n2. Chọn bộ môn "Hệ thống thông tin".',
  expected: '1. Bảng chỉ còn 1 dòng "Trần Thị Hoa" thuộc bộ môn "Hệ thống thông tin".',
  precondition: PRE_BASE + '; GVHD "Trần Thị Hoa" là GVHD duy nhất thuộc bộ môn Hệ thống thông tin',
});

const ITC152 = defineItc({
  id: 'ITC152', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_QUOTA,
  description: 'Kiểm tra tăng hạn mức sinh viên của một GVHD',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Hướng dẫn".\n' +
    '2. Trên dòng "Phạm Thu Trang", đổi ô hạn mức từ 2 thành 3.',
  expected:
    '1. Gọi PUT /semesters/{mã học kỳ}/advisors/{mã giảng viên}/quota với hạn mức 3; HTTP 200, code = 1000, message "Cập nhật hạn mức hướng dẫn cho giáo viên thành công", dữ liệu trả về hạn mức 3.\n' +
    '2. Hiện thông báo "Cập nhật chỉ tiêu thành công"; dòng hiển thị tiến độ "0/3 SV".\n' +
    '3. Dữ liệu: hạn mức của "Phạm Thu Trang" trong học kỳ là 3.',
  precondition: PRE_TRANG,
});

const ITC153 = defineItc({
  id: 'ITC153', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_QUOTA,
  description: 'Kiểm tra giao diện chặn giảm hạn mức xuống thấp hơn số sinh viên đang hướng dẫn',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Hướng dẫn".\n' +
    '2. Trên dòng "Nguyễn Văn Hải", đổi ô hạn mức từ 11 thành 1.',
  expected:
    '1. Hiện cảnh báo "Không thể giảm hạn mức xuống 1 vì giảng viên ... hiện đang hướng dẫn 2 sinh viên.".\n' +
    '2. Không gọi API cập nhật hạn mức; dòng vẫn hiển thị "2/11 SV".\n3. Dữ liệu: hạn mức vẫn là 11.',
  precondition: PRE_HAI,
});

const ITC154 = defineItc({
  id: 'ITC154', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_REMOVE,
  description: 'Kiểm tra không cho loại bỏ GVHD đang có sinh viên hướng dẫn',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Hướng dẫn".\n2. Xem nút xóa trên dòng "Nguyễn Văn Hải".',
  expected:
    '1. Nút xóa bị khóa với chú thích "Không thể loại bỏ giảng viên đang có sinh viên hướng dẫn".\n' +
    '2. Không gọi API loại bỏ GVHD; "Nguyễn Văn Hải" vẫn là GVHD của kỳ.',
  precondition: PRE_HAI,
});

const ITC155 = defineItc({
  id: 'ITC155', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_TITLE_QUOTA,
  description: 'Kiểm tra xem thiết lập hạn mức mặc định theo chức danh của kỳ',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Hướng dẫn".\n2. Bấm "Thiết lập mặc định".',
  expected:
    '1. Giao diện tải GET /semesters/{mã học kỳ}/advisor-quotas, HTTP 200, code = 1000.\n' +
    '2. Popup "Thiết lập hạn mức theo chức danh" hiển thị: Thạc sĩ 11 / 7, Tiến sĩ 14 / 10, Phó Giáo sư 19 / 16, Giáo sư 22 / 14 (Trong trường / Ngoài trường).',
  precondition: PRE_BASE + '; hạn mức chức danh của ngành Kỹ thuật phần mềm: ThS. 11/7, TS. 14/10, PGS.TS. 19/16, GS.TS. 22/14',
});

const ITC156 = defineItc({
  id: 'ITC156', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_IMPORT,
  description: 'Kiểm tra giao diện chặn import GVHD khi chọn file không phải .xlsx',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Hướng dẫn", bấm "Import File".\n2. Chọn file gvhd.docx.',
  expected: '1. Dưới ô chọn file hiển thị "File import phải có định dạng .xlsx".\n2. Không gọi POST import GVHD.',
  precondition: PRE_BASE,
});

const ITC157 = defineItc({
  id: 'ITC157', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_IMPORT,
  description: 'Kiểm tra import GVHD bằng file Excel chỉ có dòng tiêu đề',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Hướng dẫn", bấm "Import File".\n2. Chọn file gvhd_rong.xlsx chỉ có dòng tiêu đề, bấm "Import".',
  expected:
    '1. Gọi POST /semesters/{mã học kỳ}/advisors/import-excel; HTTP 400, code = 4002, message "File Excel tải lên không có dữ liệu".\n' +
    '2. Hiện thông báo lỗi "File Excel tải lên không có dữ liệu"; không chuyển sang màn kết quả.\n' +
    '3. Dữ liệu: số GVHD của kỳ vẫn là 17.',
  precondition: PRE_BASE,
});

const ITC158 = defineItc({
  id: 'ITC158', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_EXPORT,
  description: 'Kiểm tra xuất danh sách GVHD của kỳ ra file Excel',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Hướng dẫn".\n2. Bấm "Export File (.xlsx)".',
  expected:
    '1. Gọi GET /api/advisors/export với mã học kỳ đang chọn; HTTP 200, trả file Excel (.xlsx).\n' +
    '2. Trình duyệt tải xuống file .xlsx hợp lệ; hiện thông báo "Xuất file danh sách GVHD thành công".',
  precondition: PRE_BASE,
});

const SEC066 = defineItcSec({
  id: 'TC-SEC-066', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Sinh viên mở màn hình GVHD của kỳ và gọi API sửa hạn mức GVHD',
  roleSession: 'Sinh viên (STUDENT), đã đăng nhập',
  technique: 'EP',
  given: 'Đăng nhập bằng tài khoản Sinh viên; GVHD "Phạm Thu Trang" có hạn mức 2',
  when: 'Mở thẳng /department/supervisors; gọi PUT /semesters/{mã học kỳ}/advisors/{mã giảng viên}/quota (hạn mức 3) bằng phiên Sinh viên',
  then: 'Màn hình hiển thị "Tài khoản của bạn không có quyền truy cập cổng cán bộ."; PUT trả HTTP 403, code = 2001; hạn mức vẫn là 2',
});

const SEC067 = defineItcSec({
  id: 'TC-SEC-067', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Chưa đăng nhập mở màn hình GVHD của kỳ và gọi API loại bỏ GVHD',
  roleSession: 'Chưa đăng nhập (không có cookie phiên)',
  technique: 'EP',
  given: 'Trình duyệt chưa đăng nhập; "Phạm Thu Trang" là GVHD của kỳ',
  when: 'Mở thẳng /department/supervisors; gọi DELETE /semesters/{mã học kỳ}/advisors/{mã giảng viên} không kèm phiên đăng nhập',
  then: 'Bị chuyển về trang đăng nhập (/login); DELETE trả HTTP 401, code = 2000; "Phạm Thu Trang" vẫn là GVHD của kỳ',
});

// ============================================================================
// HÀM HỖ TRỢ
// ============================================================================

const TRANG = { name: 'Phạm Thu Trang', teacherId: 25, quota: 2 };
const HAI = { name: 'Nguyễn Văn Hải', teacherId: 8, quota: 11 };
let semesterId = '';

function requireEmail(role: string): string {
  const email = process.env[`E2E_EMAIL_${role}`];
  if (!email) throw new Error(`Chưa cấu hình E2E_EMAIL_${role} trong .env.e2e`);
  return email;
}
const token = (request: APIRequestContext, role: 'HEAD_OF_MAJOR' | 'STUDENT') => loginByEmail(request, requireEmail(role));

async function advisorRow(teacherId: number) {
  return dbSelect<{ max_students: number; status: string }>(
    `SELECT sa.max_students, sa.status FROM semester_advisor sa JOIN semester s ON s.id = sa.semester_id
      WHERE s.status = 'ONGOING' AND sa.teacher_id = ?`, [teacherId]);
}

async function activeAdvisorCount() {
  return (await dbSelect<{ n: number }>(
    `SELECT COUNT(*) AS n FROM semester_advisor sa JOIN semester s ON s.id = sa.semester_id
      WHERE s.status = 'ONGOING' AND sa.status = 'ACTIVE'`))[0].n;
}

// Khôi phục hạn mức của "Phạm Thu Trang" về 2 bằng API (chỉ khi đã bị đổi)
async function restore(request: APIRequestContext) {
  const rows = await advisorRow(TRANG.teacherId);
  if (rows[0] && rows[0].max_students !== TRANG.quota) {
    const hm = await token(request, 'HEAD_OF_MAJOR');
    const res = await apiCall(request, hm, 'PUT', `/semesters/${semesterId}/advisors/${TRANG.teacherId}/quota`, {
      data: { maxStudents: TRANG.quota },
    });
    expect(res.status, 'Không khôi phục được hạn mức').toBe(200);
  }
}

const isAdvisorList = (r: Response) =>
  r.request().method() === 'GET' && /\/semesters\/[^/]+\/advisors$/.test(new URL(r.url()).pathname);

async function openPage(page: Page) {
  const resPromise = page.waitForResponse(isAdvisorList);
  await page.goto(PAGE_URL);
  const res = await resPromise;
  await expect(page.getByRole('button', { name: 'Thiết lập mặc định' })).toBeVisible();
  await expect(rowOf(page, TRANG.name)).toBeVisible();
  return res;
}

// Dòng GVHD trong bảng tổng quan: dòng có ô sửa hạn mức
const advisorRows = (page: Page) => page.locator('tbody tr').filter({ has: page.getByTitle('Sửa hạn mức sinh viên') });
const rowOf = (page: Page, name: string) => advisorRows(page).filter({ hasText: name });
const quotaInput = (page: Page, name: string) => rowOf(page, name).getByTitle('Sửa hạn mức sinh viên');

function trackRequests(page: Page, method: string, pattern: RegExp) {
  const state = { hit: false };
  page.on('request', (r) => { if (r.method() === method && pattern.test(new URL(r.url()).pathname)) state.hit = true; });
  return state;
}

// ============================================================================
// TEST
// ============================================================================

test.beforeAll(async ({ request }) => {
  const hm = await token(request, 'HEAD_OF_MAJOR');
  const cur = await apiCall(request, hm, 'GET', '/semester/current');
  semesterId = cur.body.data.publicId;
  expect(cur.body.data.isAdvisorAssignmentLocked, 'Tiền điều kiện: danh sách GVHD chưa chốt').toBe(false);
  await restore(request);
  expect((await advisorRow(TRANG.teacherId))[0]?.max_students).toBe(TRANG.quota);
  expect((await advisorRow(HAI.teacherId))[0]?.max_students).toBe(HAI.quota);
  expect(await activeAdvisorCount(), 'Tiền điều kiện: kỳ có 17 GVHD').toBe(17);
});

test.afterEach(async ({ request }) => {
  await restore(request);
});

test.describe('GVHD của kỳ (Trưởng bộ môn)', () => {
  test.use({ storageState: '.auth/head_of_major.json' });

  test.describe(FN_LIST, () => {
    test(ITC147.title, { annotation: ITC147.annotation }, async ({ page }) => {
      const res = await openPage(page);
      expect(new URL(res.url()).pathname).toContain(`/semesters/${semesterId}/advisors`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.message).toBe('Lấy danh sách giáo viên hướng dẫn trong kỳ thành công');
      expect(body.data).toHaveLength(17);
      expect(body.data.length).toBe(await activeAdvisorCount());

      await expect(page.getByLabel('Lọc theo bộ môn')).toHaveValue('Kỹ thuật phần mềm');
      const row = rowOf(page, TRANG.name);
      for (const t of ['TS.', 'Kỹ thuật phần mềm', 'Trong trường', '0/2 SV']) await expect(row).toContainText(t);
      await expect(quotaInput(page, TRANG.name)).toHaveValue('2');
    });

    test(ITC148.title, { annotation: ITC148.annotation }, async ({ page }) => {
      const res = await openPage(page);
      expect(res.status()).toBe(200);
      expect((await res.json()).code).toBe(1000);
      const calls = trackRequests(page, 'GET', /\/advisors$/);
      await page.getByPlaceholder(SEARCH_PLACEHOLDER).fill(TRANG.name);
      await expect(advisorRows(page)).toHaveCount(1);
      await expect(advisorRows(page).first()).toContainText(TRANG.name);
      expect(calls.hit).toBe(false);
    });

    test(ITC149.title, { annotation: ITC149.annotation }, async ({ page }) => {
      const res = await openPage(page);
      const externals = (await res.json()).data.filter((a: any) => a.isInternal === false);
      expect(externals).toHaveLength(4);
      await page.getByLabel('Lọc theo bộ môn').selectOption('all');
      await page.getByLabel('Lọc theo đơn vị').selectOption('external');
      await expect(advisorRows(page)).toHaveCount(4);
      for (const name of ['Nguyễn Văn Bình', 'Lý Thị Thanh Thảo', 'Vũ Hải Yến', 'Trịnh Quốc Bảo']) {
        await expect(rowOf(page, name)).toContainText('Ngoài trường');
      }
    });

    test(ITC150.title, { annotation: ITC150.annotation }, async ({ page }) => {
      await openPage(page);
      await page.getByLabel('Lọc theo trạng thái phân công').selectOption('active');
      await expect(advisorRows(page)).toHaveCount(4);
      for (const [name, n] of [['Nguyễn Kỹ thuật phần mềm', 1], ['Nguyễn Văn Hải', 2], ['Trần Quốc Bảo', 4], ['Nguyễn Văn Minh', 3]] as const) {
        await expect(rowOf(page, name)).toContainText(`${n}/`);
      }
      await expect(rowOf(page, TRANG.name)).toHaveCount(0);
    });

    test(ITC151.title, { annotation: ITC151.annotation }, async ({ page }) => {
      await openPage(page);
      await page.getByLabel('Lọc theo bộ môn').selectOption('Hệ thống thông tin');
      await expect(advisorRows(page)).toHaveCount(1);
      await expect(advisorRows(page).first()).toContainText('Trần Thị Hoa');
      await expect(advisorRows(page).first()).toContainText('Hệ thống thông tin');
    });
  });

  test.describe(FN_QUOTA, () => {
    test(ITC152.title, { annotation: ITC152.annotation }, async ({ page }) => {
      await openPage(page);
      const resPromise = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/advisors\/[^/]+\/quota$/.test(new URL(r.url()).pathname));
      await quotaInput(page, TRANG.name).fill('3');
      const res = await resPromise;
      expect(new URL(res.url()).pathname).toContain(`/semesters/${semesterId}/advisors/${TRANG.teacherId}/quota`);
      expect(res.request().postDataJSON()).toEqual({ maxStudents: 3 });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.message).toBe('Cập nhật hạn mức hướng dẫn cho giáo viên thành công');
      expect(body.data.maxStudents).toBe(3);
      await expect(page.getByText('Cập nhật chỉ tiêu thành công').first()).toBeVisible();
      await expect(rowOf(page, TRANG.name)).toContainText('0/3 SV');
      expect((await advisorRow(TRANG.teacherId))[0].max_students).toBe(3);
    });

    test(ITC153.title, { annotation: ITC153.annotation }, async ({ page }) => {
      await openPage(page);
      const puts = trackRequests(page, 'PUT', /\/quota$/);
      await quotaInput(page, HAI.name).fill('1');
      await expect(page.getByText(/Không thể giảm hạn mức xuống 1 vì giảng viên .* hiện đang hướng dẫn 2 sinh viên\./).first()).toBeVisible();
      await expect(rowOf(page, HAI.name)).toContainText('2/11 SV');
      expect(puts.hit).toBe(false);
      expect((await advisorRow(HAI.teacherId))[0].max_students).toBe(HAI.quota);
    });
  });

  test.describe(FN_REMOVE, () => {
    test(ITC154.title, { annotation: ITC154.annotation }, async ({ page }) => {
      await openPage(page);
      const deletes = trackRequests(page, 'DELETE', /\/advisors\//);
      const btn = rowOf(page, HAI.name).getByTitle('Không thể loại bỏ giảng viên đang có sinh viên hướng dẫn');
      await expect(btn).toBeDisabled();
      await btn.click({ force: true });
      expect(deletes.hit).toBe(false);
      expect((await advisorRow(HAI.teacherId))[0].status).toBe('ACTIVE');
    });
  });

  test.describe(FN_TITLE_QUOTA, () => {
    test(ITC155.title, { annotation: ITC155.annotation }, async ({ page }) => {
      const resPromise = page.waitForResponse((r) => r.request().method() === 'GET' && /\/advisor-quotas$/.test(new URL(r.url()).pathname));
      await openPage(page);
      await page.getByRole('button', { name: 'Thiết lập mặc định' }).click();
      const res = await resPromise;
      expect(res.status()).toBe(200);
      expect((await res.json()).code).toBe(1000);

      const dialog = page.getByRole('dialog').filter({ hasText: 'Thiết lập hạn mức theo chức danh' });
      await expect(dialog).toBeVisible();
      for (const [title, internal, external] of [['Thạc sĩ', 11, 7], ['Tiến sĩ', 14, 10], ['Phó Giáo sư', 19, 16], ['Giáo sư', 22, 14]] as const) {
        const row = dialog.locator('tbody tr').filter({ hasText: new RegExp(`^\\s*${title}\\s*\\(`) });
        const inputs = row.locator('input[type="number"]');
        await expect(inputs.nth(0)).toHaveValue(String(internal));
        await expect(inputs.nth(1)).toHaveValue(String(external));
      }
    });
  });

  test.describe(FN_IMPORT, () => {
    async function openImport(page: Page) {
      await openPage(page);
      await page.getByRole('button', { name: 'Import File' }).click();
      const dialog = page.getByRole('dialog').filter({ hasText: 'Import danh sách Giáo viên Hướng dẫn' });
      await expect(dialog).toBeVisible();
      return dialog;
    }

    test(ITC156.title, { annotation: ITC156.annotation }, async ({ page }, testInfo) => {
      fs.mkdirSync(testInfo.outputDir, { recursive: true });
      const docx = path.join(testInfo.outputDir, 'gvhd.docx');
      fs.writeFileSync(docx, 'Day khong phai file Excel');
      const dialog = await openImport(page);
      const posts = trackRequests(page, 'POST', /\/import-excel$/);
      await dialog.locator('input[type="file"]').setInputFiles(docx);
      await expect(dialog.getByText('File import phải có định dạng .xlsx')).toBeVisible();
      expect(posts.hit).toBe(false);
    });

    test(ITC157.title, { annotation: ITC157.annotation }, async ({ page }, testInfo) => {
      const file = writeXlsx(path.join(testInfo.outputDir, 'gvhd_rong.xlsx'), [
        ['Mã giảng viên', 'Họ và tên đệm', 'Tên', 'Email', 'Số điện thoại', 'Đơn vị công tác', 'Ngành', 'Hạn mức'],
      ]);
      const dialog = await openImport(page);
      await dialog.locator('input[type="file"]').setInputFiles(file);
      const resPromise = page.waitForResponse((r) => r.request().method() === 'POST' && /\/import-excel$/.test(new URL(r.url()).pathname));
      await dialog.getByRole('button', { name: 'Import', exact: true }).click();
      const res = await resPromise;
      expect(new URL(res.url()).pathname).toContain(`/semesters/${semesterId}/advisors/import-excel`);
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.code).toBe(4002);
      expect(body.message).toBe('File Excel tải lên không có dữ liệu');
      await expect(page.getByText('File Excel tải lên không có dữ liệu').first()).toBeVisible();
      await expect(dialog.getByRole('button', { name: 'Import', exact: true })).toBeVisible();
      expect(await activeAdvisorCount()).toBe(17);
    });
  });

  test.describe(FN_EXPORT, () => {
    test(ITC158.title, { annotation: ITC158.annotation }, async ({ page }) => {
      await openPage(page);
      const resPromise = page.waitForResponse((r) => r.request().method() === 'GET' && new URL(r.url()).pathname.endsWith('/api/advisors/export'));
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Export File (.xlsx)' }).click();
      const res = await resPromise;
      expect(new URL(res.url()).searchParams.get('semesterId')).toBe(semesterId);
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toContain('spreadsheetml');
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
      const saved = path.join(test.info().outputDir, download.suggestedFilename());
      await download.saveAs(saved);
      expect(fs.readFileSync(saved).subarray(0, 2).toString()).toBe('PK');
      await expect(page.getByText('Xuất file danh sách GVHD thành công').first()).toBeVisible();
    });
  });
});

test.describe('SecurityTest - GVHD của kỳ', () => {
  test.describe('Sinh viên', () => {
    test.use({ storageState: '.auth/student.json' });
    test(SEC066.title, { annotation: SEC066.annotation }, async ({ page, request }) => {
      await page.goto(PAGE_URL);
      await expect(page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Thiết lập mặc định' })).toHaveCount(0);

      const st = await token(request, 'STUDENT');
      const res = await apiCall(request, st, 'PUT', `/semesters/${semesterId}/advisors/${TRANG.teacherId}/quota`, { data: { maxStudents: 3 } });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(2001);
      expect((await advisorRow(TRANG.teacherId))[0].max_students).toBe(TRANG.quota);
    });
  });

  test.describe('Chưa đăng nhập', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test(SEC067.title, { annotation: SEC067.annotation }, async ({ page, request }) => {
      await page.goto(PAGE_URL);
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByPlaceholder(SEARCH_PLACEHOLDER)).toHaveCount(0);

      const res = await request.delete(`${getApiBaseUrl()}/semesters/${semesterId}/advisors/${TRANG.teacherId}`);
      expect(res.status()).toBe(401);
      expect((await res.json()).code).toBe(2000);
      expect((await advisorRow(TRANG.teacherId))[0].status).toBe('ACTIVE');
    });
  });
});
