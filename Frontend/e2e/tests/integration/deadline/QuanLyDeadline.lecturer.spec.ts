import { test, expect, type APIRequestContext, type Page, type Response } from '@playwright/test';
import { defineItc, defineItcSec } from '../../../support/integration-test-case';
import { apiCall, getApiBaseUrl, loginByEmail } from '../../../support/api';
import { dbSelect } from '../../../support/db';

// ============================================================================
// ĐẶC TẢ TEST CASE (ITC174..ITC181 & TC-SEC-071..TC-SEC-072)
// Feature: deadline | Module/Sheet: QuanLyDeadline
// Role: Trưởng bộ môn (HEAD_OF_MAJOR) — màn hình "Kế hoạch & Tiến độ" (/department/schedule)
// BE không có API xóa mốc thời hạn. Vì vậy:
//   - Case sửa mốc chỉ sửa mốc ĐÃ CÓ "Đăng kí giáo viên hướng dẫn" của Học kỳ 1 năm học 2026-2027
//     (đã kết thúc, sửa giờ kết thúc vẫn ở quá khứ) rồi khôi phục CHÍNH XÁC giá trị cũ bằng API sau test.
//   - Thiết lập mốc CHƯA CÓ (tạo bản ghi mới) chỉ chạy ở MockMvc (tự rollback) — ITC182.
// ============================================================================

const FEATURE = 'deadline';
const MODULE = 'QuanLyDeadline';
const SHEET = 'QuanLyDeadline';
const PAGE_URL = '/department/schedule';

const FN_VIEW = 'Xem kế hoạch mốc thời hạn';
const FN_UPDATE = 'Thiết lập thời gian mốc';

const HK1 = 'Học kỳ 1 năm học 2026-2027';
const HK2 = 'Học kỳ 2 năm học 2026-2027';
const DANG_KY = 'Đăng kí giáo viên hướng dẫn';
const TBM_CHOT = 'Hạn TBM chốt & gửi danh sách GVHD dự kiến';
const TO_CHUC = 'Thời gian tổ chức Hội đồng chấm bảo vệ ĐATN';

const PRE_BASE =
  'Trưởng bộ môn đã đăng nhập. "Học kỳ 1 năm học 2026-2027" (01/08/2026 – 31/01/2027, đang diễn ra) đã thiết lập 2 mốc: ' +
  '"Đăng kí giáo viên hướng dẫn" (17h48 08/10/2026 – 17h48 02/11/2026, đã kết thúc) và ' +
  '"Thời gian tổ chức Hội đồng chấm bảo vệ ĐATN" (17h49 23/11/2026 – 17h49 25/11/2026); các mốc khác chưa thiết lập';

const ITC174 = defineItc({
  id: 'ITC174', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_VIEW,
  description: 'Kiểm tra mở màn hình Kế hoạch & Tiến độ hiển thị các mốc giai đoạn Giao nhận đồ án của học kỳ hiện tại',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn.\n2. Mở màn hình "Kế hoạch & Tiến độ" (/department/schedule).',
  expected:
    '1. Gọi GET /api/v1/deadlines với học kỳ "Học kỳ 1 năm học 2026-2027", HTTP 200, code = 1000; dữ liệu có 3 mốc Giao nhận, 1 mốc Thực hiện, 5 mốc Đánh giá.\n' +
    '2. Tab "Giao nhận đồ án" hiển thị 3 mốc; "Đăng kí giáo viên hướng dẫn" có thời gian 08/10/2026 17:48 – 02/11/2026 17:48; "Hạn TBM chốt & gửi danh sách GVHD dự kiến" để trống thời gian.\n' +
    '3. Dữ liệu: học kỳ có đúng 2 mốc đã lưu.',
  precondition: PRE_BASE,
});

const ITC175 = defineItc({
  id: 'ITC175', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_VIEW,
  description: 'Kiểm tra chuyển sang tab giai đoạn Đánh giá đồ án',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Kế hoạch & Tiến độ".\n2. Bấm tab "Đánh giá đồ án".',
  expected:
    '1. Danh sách đã tải (HTTP 200, code = 1000) được lọc trên giao diện, không gọi thêm API.\n' +
    '2. Bảng hiển thị 5 mốc giai đoạn Đánh giá; "Thời gian tổ chức Hội đồng chấm bảo vệ ĐATN" có thời gian 23/11/2026 17:49 – 25/11/2026 17:49.',
  precondition: PRE_BASE,
});

const ITC176 = defineItc({
  id: 'ITC176', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_VIEW,
  description: 'Kiểm tra xem kế hoạch của học kỳ chưa thiết lập mốc nào',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Kế hoạch & Tiến độ".\n2. Chọn học kỳ "Học kỳ 2".',
  expected:
    '1. Gọi GET /api/v1/deadlines với học kỳ "Học kỳ 2 năm học 2026-2027", HTTP 200, code = 1000; mọi mốc đều chưa có thời gian.\n' +
    '2. Tab "Giao nhận đồ án" hiển thị 3 mốc với các ô thời gian để trống.\n3. Dữ liệu: học kỳ 2 chưa có mốc nào được lưu.',
  precondition: PRE_BASE + '; "Học kỳ 2 năm học 2026-2027" (01/02/2027 – 31/07/2027) chưa thiết lập mốc nào',
});

const ITC177 = defineItc({
  id: 'ITC177', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_UPDATE,
  description: 'Kiểm tra sửa thời gian kết thúc của mốc đã thiết lập',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Kế hoạch & Tiến độ".\n' +
    '2. Trên dòng "Đăng kí giáo viên hướng dẫn", đổi Thời gian kết thúc thành 01/11/2026 17:48, bấm "Lưu".\n' +
    '3. Trong hộp "Xác nhận thiết lập mốc thời gian", bấm "Xác nhận".',
  expected:
    '1. Hộp xác nhận hiển thị "17h48 08/10/2026" và "17h48 01/11/2026".\n' +
    '2. Gọi PUT /api/v1/deadlines/batch-update với học kỳ "Học kỳ 1 năm học 2026-2027", 1 mốc "Đăng kí giáo viên hướng dẫn", kết thúc 2026-11-01T17:48:00; HTTP 200, code = 1000, message "Cập nhật kế hoạch mốc thời hạn thành công".\n' +
    '3. Hiện thông báo "Đã lưu mốc thời gian: \\"Đăng kí giáo viên hướng dẫn\\""; ô kết thúc hiển thị 01/11/2026 17:48.\n' +
    '4. Dữ liệu: mốc có thời gian kết thúc 2026-11-01 17:48, trạng thái Đã kết thúc; học kỳ vẫn có đúng 2 mốc đã lưu.',
  precondition: PRE_BASE,
});

const ITC178 = defineItc({
  id: 'ITC178', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_UPDATE,
  description: 'Kiểm tra hủy ở hộp xác nhận thì không lưu mốc',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Kế hoạch & Tiến độ".\n' +
    '2. Trên dòng "Đăng kí giáo viên hướng dẫn", đổi Thời gian kết thúc thành 01/11/2026 17:48, bấm "Lưu".\n' +
    '3. Trong hộp xác nhận bấm "Hủy", sau đó bấm "Hủy" trên dòng.',
  expected:
    '1. Hộp xác nhận đóng, không gọi PUT /api/v1/deadlines/batch-update.\n' +
    '2. Sau khi bấm "Hủy" trên dòng, ô kết thúc trở lại 02/11/2026 17:48.\n3. Dữ liệu: mốc vẫn kết thúc 2026-11-02 17:48.',
  precondition: PRE_BASE,
});

const ITC179 = defineItc({
  id: 'ITC179', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_UPDATE,
  description: 'Kiểm tra giao diện chặn lưu khi thời gian kết thúc trước thời gian bắt đầu',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Kế hoạch & Tiến độ".\n' +
    '2. Trên dòng "Đăng kí giáo viên hướng dẫn", đổi Thời gian kết thúc thành 01/10/2026 08:00 (trước 08/10/2026), bấm "Lưu".',
  expected:
    '1. Hiện thông báo lỗi "Thời gian kết thúc phải diễn ra sau thời gian bắt đầu!"; không mở hộp xác nhận.\n' +
    '2. Không gọi PUT /api/v1/deadlines/batch-update; dữ liệu mốc không đổi.',
  precondition: PRE_BASE,
});

const ITC180 = defineItc({
  id: 'ITC180', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_UPDATE,
  description: 'Kiểm tra giao diện chặn lưu khi mốc nằm ngoài thời gian học kỳ',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Kế hoạch & Tiến độ".\n' +
    '2. Trên dòng "Đăng kí giáo viên hướng dẫn", đổi Thời gian kết thúc thành 05/02/2027 08:00 (sau ngày kết thúc học kỳ 31/01/2027), bấm "Lưu".',
  expected:
    '1. Hiện thông báo lỗi "Thời gian của mốc phải nằm trong thời gian học kỳ (01/08/2026 – 31/01/2027)!"; không mở hộp xác nhận.\n' +
    '2. Không gọi PUT /api/v1/deadlines/batch-update; dữ liệu mốc không đổi.',
  precondition: PRE_BASE,
});

const ITC181 = defineItc({
  id: 'ITC181', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_UPDATE,
  description: 'Kiểm tra giao diện chặn lưu khi để trống thời gian bắt đầu',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Kế hoạch & Tiến độ".\n' +
    '2. Trên dòng "Đăng kí giáo viên hướng dẫn", xóa trống Thời gian bắt đầu, bấm "Lưu".',
  expected:
    '1. Hiện thông báo lỗi "Vui lòng nhập đầy đủ Thời gian bắt đầu và Thời gian kết thúc!"; không mở hộp xác nhận.\n' +
    '2. Không gọi PUT /api/v1/deadlines/batch-update; dữ liệu mốc không đổi.',
  precondition: PRE_BASE,
});

const SEC071 = defineItcSec({
  id: 'TC-SEC-071', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Sinh viên mở màn hình Kế hoạch & Tiến độ và gọi API sửa mốc thời hạn',
  roleSession: 'Sinh viên (STUDENT), đã đăng nhập',
  technique: 'EP',
  given: 'Đăng nhập bằng tài khoản Sinh viên',
  when: 'Mở thẳng /department/schedule; gọi PUT /api/v1/deadlines/batch-update (mốc "Đăng kí giáo viên hướng dẫn", giữ nguyên thời gian) bằng phiên Sinh viên',
  then: 'Màn hình hiển thị "Tài khoản của bạn không có quyền truy cập cổng cán bộ."; PUT trả HTTP 403, code = 2001; mốc không đổi',
});

const SEC072 = defineItcSec({
  id: 'TC-SEC-072', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Chưa đăng nhập mở màn hình Kế hoạch & Tiến độ và gọi API sửa mốc thời hạn',
  roleSession: 'Chưa đăng nhập (không có cookie phiên)',
  technique: 'EP',
  given: 'Trình duyệt chưa đăng nhập',
  when: 'Mở thẳng /department/schedule; gọi PUT /api/v1/deadlines/batch-update không kèm phiên đăng nhập',
  then: 'Bị chuyển về trang đăng nhập (/login); PUT trả HTTP 401, code = 2000; mốc không đổi',
});

// ============================================================================
// HÀM HỖ TRỢ
// ============================================================================

type Snap = { publicId: string; templateId: string; start: string; end: string; status: string };
let hk1Id = '';
let hk2Id = '';
let snap: Snap;

function requireEmail(role: string): string {
  const email = process.env[`E2E_EMAIL_${role}`];
  if (!email) throw new Error(`Chưa cấu hình E2E_EMAIL_${role} trong .env.e2e`);
  return email;
}
const token = (request: APIRequestContext, role: 'HEAD_OF_MAJOR' | 'STUDENT') => loginByEmail(request, requireEmail(role));

async function deadlineRow(semesterName: string, templateCode: string) {
  return dbSelect<{ start: string; end: string; status: string }>(
    `SELECT DATE_FORMAT(d.start_date, '%Y-%m-%dT%H:%i:%s.%f') AS start,
            DATE_FORMAT(d.end_date, '%Y-%m-%dT%H:%i:%s.%f') AS end, d.status
       FROM semester_deadlines d JOIN semester s ON s.id = d.semester_id JOIN deadline_templates t ON t.id = d.template_id
      WHERE s.name = ? AND t.code = ?`, [semesterName, templateCode]);
}

async function deadlineCount(semesterName: string) {
  return (await dbSelect<{ n: number }>(
    `SELECT COUNT(*) AS n FROM semester_deadlines d JOIN semester s ON s.id = d.semester_id WHERE s.name = ?`, [semesterName]))[0].n;
}

// Khôi phục chính xác mốc "Đăng kí giáo viên hướng dẫn" (kể cả giây, trạng thái) nếu đã bị đổi
async function restore(request: APIRequestContext) {
  const [row] = await deadlineRow(HK1, 'DANG_KY_GVHD');
  if (row.start === snap.start && row.end === snap.end && row.status === snap.status) return;
  const hm = await token(request, 'HEAD_OF_MAJOR');
  const res = await apiCall(request, hm, 'PUT', '/api/v1/deadlines/batch-update', {
    data: { semesterId: hk1Id, deadlines: [{ deadlineId: snap.publicId, templateId: snap.templateId, startDate: snap.start, endDate: snap.end, status: snap.status }] },
  });
  expect(res.status, 'Không khôi phục được mốc Đăng kí giáo viên hướng dẫn').toBe(200);
}

const isGet = (r: Response, semId?: string) => {
  if (r.request().method() !== 'GET') return false;
  const u = new URL(r.url());
  return u.pathname.endsWith('/api/v1/deadlines') && (!semId || u.searchParams.get('semesterId') === semId);
};
const isPut = (r: Response) => r.request().method() === 'PUT' && new URL(r.url()).pathname.endsWith('/api/v1/deadlines/batch-update');

async function openPage(page: Page) {
  const resPromise = page.waitForResponse((r) => isGet(r, hk1Id));
  await page.goto(PAGE_URL);
  const res = await resPromise;
  await expect(rowOf(page, DANG_KY)).toBeVisible();
  return res;
}

const rows = (page: Page) => page.locator('tbody tr').filter({ has: page.locator('input[type="datetime-local"]') });
const rowOf = (page: Page, name: string) => rows(page).filter({ hasText: name });
const startInput = (page: Page, name: string) => rowOf(page, name).locator('input[type="datetime-local"]').nth(0);
const endInput = (page: Page, name: string) => rowOf(page, name).locator('input[type="datetime-local"]').nth(1);
const confirmBox = (page: Page) => page.locator('div.fixed').filter({ hasText: 'Xác nhận thiết lập mốc thời gian' });

function trackPuts(page: Page) {
  const s = { hit: false };
  page.on('request', (r) => { if (r.method() === 'PUT' && new URL(r.url()).pathname.endsWith('/batch-update')) s.hit = true; });
  return s;
}

// ============================================================================
// TEST
// ============================================================================

test.beforeAll(async ({ request }) => {
  const hm = await token(request, 'HEAD_OF_MAJOR');
  hk1Id = (await apiCall(request, hm, 'GET', '/semester/current')).body.data.publicId;
  const list = await apiCall(request, hm, 'GET', '/semester', { params: { size: 50 } });
  hk2Id = list.body.data.content.find((s: any) => s.name === HK2).publicId;
  const data = (await apiCall(request, hm, 'GET', '/api/v1/deadlines', { params: { semesterId: hk1Id } })).body.data;
  const dk = data.giaoNhanDeadlines.find((d: any) => d.code === 'DANG_KY_GVHD');
  const [row] = await deadlineRow(HK1, 'DANG_KY_GVHD');
  snap = { publicId: dk.deadlineId, templateId: dk.templateId, start: row.start, end: row.end, status: row.status };
  expect(snap.start.slice(0, 16)).toBe('2026-10-08T17:48');
  expect(snap.end.slice(0, 16)).toBe('2026-11-02T17:48');
  expect(await deadlineCount(HK1), 'Tiền điều kiện: HK1 có 2 mốc đã lưu').toBe(2);
  expect(await deadlineCount(HK2), 'Tiền điều kiện: HK2 chưa có mốc nào').toBe(0);
});

test.afterEach(async ({ request }) => {
  await restore(request);
});

test.describe('Kế hoạch & Tiến độ (Trưởng bộ môn)', () => {
  test.use({ storageState: '.auth/head_of_major.json' });

  test.describe(FN_VIEW, () => {
    test(ITC174.title, { annotation: ITC174.annotation }, async ({ page }) => {
      const res = await openPage(page);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.data.giaoNhanDeadlines).toHaveLength(3);
      expect(body.data.thucHienDeadlines).toHaveLength(1);
      expect(body.data.danhGiaDeadlines).toHaveLength(5);

      await expect(rows(page)).toHaveCount(3);
      await expect(startInput(page, DANG_KY)).toHaveValue('2026-10-08T17:48');
      await expect(endInput(page, DANG_KY)).toHaveValue('2026-11-02T17:48');
      await expect(startInput(page, TBM_CHOT)).toHaveValue('');
      await expect(endInput(page, TBM_CHOT)).toHaveValue('');
      expect(await deadlineCount(HK1)).toBe(2);
    });

    test(ITC175.title, { annotation: ITC175.annotation }, async ({ page }) => {
      const res = await openPage(page);
      expect(res.status()).toBe(200);
      expect((await res.json()).code).toBe(1000);
      let extra = 0;
      page.on('request', (r) => { if (r.method() === 'GET' && new URL(r.url()).pathname.endsWith('/api/v1/deadlines')) extra++; });
      await page.getByRole('button', { name: /Đánh giá đồ án/ }).click();
      await expect(rows(page)).toHaveCount(5);
      await expect(startInput(page, TO_CHUC)).toHaveValue('2026-11-23T17:49');
      await expect(endInput(page, TO_CHUC)).toHaveValue('2026-11-25T17:49');
      expect(extra).toBe(0);
    });

    test(ITC176.title, { annotation: ITC176.annotation }, async ({ page }) => {
      await openPage(page);
      const resPromise = page.waitForResponse((r) => isGet(r, hk2Id));
      await page.getByLabel('Học kỳ', { exact: true }).selectOption(hk2Id);
      const res = await resPromise;
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      const all = [...body.data.giaoNhanDeadlines, ...body.data.thucHienDeadlines, ...body.data.danhGiaDeadlines];
      expect(all.every((d: any) => d.startDate == null && d.endDate == null)).toBe(true);

      await expect(rows(page)).toHaveCount(3);
      for (const name of [DANG_KY, TBM_CHOT]) {
        await expect(startInput(page, name)).toHaveValue('');
        await expect(endInput(page, name)).toHaveValue('');
      }
      expect(await deadlineCount(HK2)).toBe(0);
    });
  });

  test.describe(FN_UPDATE, () => {
    test(ITC177.title, { annotation: ITC177.annotation }, async ({ page }) => {
      await openPage(page);
      await endInput(page, DANG_KY).fill('2026-11-01T17:48');
      await rowOf(page, DANG_KY).getByRole('button', { name: 'Lưu' }).click();
      const box = confirmBox(page);
      await expect(box).toContainText('17h48 08/10/2026');
      await expect(box).toContainText('17h48 01/11/2026');

      const resPromise = page.waitForResponse(isPut);
      await box.getByRole('button', { name: 'Xác nhận' }).click();
      const res = await resPromise;
      const sent = res.request().postDataJSON();
      expect(sent.semesterId).toBe(hk1Id);
      expect(sent.deadlines).toHaveLength(1);
      expect(sent.deadlines[0]).toMatchObject({ deadlineId: snap.publicId, endDate: '2026-11-01T17:48:00' });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.message).toBe('Cập nhật kế hoạch mốc thời hạn thành công');
      await expect(page.getByText(`Đã lưu mốc thời gian: "${DANG_KY}"`).first()).toBeVisible();
      await expect(endInput(page, DANG_KY)).toHaveValue('2026-11-01T17:48');

      const [row] = await deadlineRow(HK1, 'DANG_KY_GVHD');
      expect(row.end.slice(0, 19)).toBe('2026-11-01T17:48:00');
      expect(row.status).toBe('COMPLETED');
      expect(await deadlineCount(HK1)).toBe(2);
    });

    test(ITC178.title, { annotation: ITC178.annotation }, async ({ page }) => {
      await openPage(page);
      const puts = trackPuts(page);
      await endInput(page, DANG_KY).fill('2026-11-01T17:48');
      await rowOf(page, DANG_KY).getByRole('button', { name: 'Lưu' }).click();
      const box = confirmBox(page);
      await expect(box).toBeVisible();
      await box.getByRole('button', { name: 'Hủy' }).click();
      await expect(box).toBeHidden();
      await rowOf(page, DANG_KY).getByRole('button', { name: 'Hủy' }).click();
      await expect(endInput(page, DANG_KY)).toHaveValue('2026-11-02T17:48');
      expect(puts.hit).toBe(false);
      expect((await deadlineRow(HK1, 'DANG_KY_GVHD'))[0].end).toBe(snap.end);
    });

    for (const [spec, field, value, message] of [
      [ITC179, 'end', '2026-10-01T08:00', 'Thời gian kết thúc phải diễn ra sau thời gian bắt đầu!'],
      [ITC180, 'end', '2027-02-05T08:00', 'Thời gian của mốc phải nằm trong thời gian học kỳ (01/08/2026 – 31/01/2027)!'],
      [ITC181, 'start', '', 'Vui lòng nhập đầy đủ Thời gian bắt đầu và Thời gian kết thúc!'],
    ] as const) {
      test(spec.title, { annotation: spec.annotation }, async ({ page }) => {
        await openPage(page);
        const puts = trackPuts(page);
        const input = field === 'end' ? endInput(page, DANG_KY) : startInput(page, DANG_KY);
        await input.fill(value);
        await rowOf(page, DANG_KY).getByRole('button', { name: 'Lưu' }).click();
        await expect(page.getByText(message).first()).toBeVisible();
        await expect(confirmBox(page)).toHaveCount(0);
        expect(puts.hit).toBe(false);
        const [row] = await deadlineRow(HK1, 'DANG_KY_GVHD');
        expect([row.start, row.end]).toEqual([snap.start, snap.end]);
      });
    }
  });
});

test.describe('SecurityTest - Kế hoạch & Tiến độ', () => {
  const body = () => ({
    semesterId: hk1Id,
    deadlines: [{ deadlineId: snap.publicId, templateId: snap.templateId, startDate: snap.start, endDate: snap.end, status: snap.status }],
  });

  test.describe('Sinh viên', () => {
    test.use({ storageState: '.auth/student.json' });
    test(SEC071.title, { annotation: SEC071.annotation }, async ({ page, request }) => {
      await page.goto(PAGE_URL);
      await expect(page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.')).toBeVisible();
      await expect(rows(page)).toHaveCount(0);
      const st = await token(request, 'STUDENT');
      const res = await apiCall(request, st, 'PUT', '/api/v1/deadlines/batch-update', { data: body() });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(2001);
      const [row] = await deadlineRow(HK1, 'DANG_KY_GVHD');
      expect([row.start, row.end, row.status]).toEqual([snap.start, snap.end, snap.status]);
    });
  });

  test.describe('Chưa đăng nhập', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test(SEC072.title, { annotation: SEC072.annotation }, async ({ page, request }) => {
      await page.goto(PAGE_URL);
      await expect(page).toHaveURL(/\/login/);
      await expect(rows(page)).toHaveCount(0);
      const res = await request.put(`${getApiBaseUrl()}/api/v1/deadlines/batch-update`, { data: body() });
      expect(res.status()).toBe(401);
      expect((await res.json()).code).toBe(2000);
      const [row] = await deadlineRow(HK1, 'DANG_KY_GVHD');
      expect([row.start, row.end]).toEqual([snap.start, snap.end]);
    });
  });
});
