import { test, expect, type APIRequestContext, type Page, type Response } from '@playwright/test';
import { defineItc, defineItcSec } from '../../../support/integration-test-case';
import { apiCall, getApiBaseUrl, loginByEmail } from '../../../support/api';
import { dbSelect } from '../../../support/db';

// ============================================================================
// ĐẶC TẢ TEST CASE (ITC162..ITC173 & TC-SEC-068..TC-SEC-070)
// Feature: semester | Module/Sheet: QuanLyHocKy
// Role: Quản trị viên (ADMIN) — màn hình "/admin/semesters"
// BE không có API tạo/xóa học kỳ (học kỳ tự sinh theo khung thời gian chuẩn) nên các case ghi dữ liệu
// sửa học kỳ "Học kỳ 2 năm học 2026-2027" (chưa bắt đầu) / khung thời gian chuẩn có sẵn,
// rồi KHÔI PHỤC lại đúng giá trị cũ bằng API sau mỗi test.
// ============================================================================

const FEATURE = 'semester';
const MODULE = 'QuanLyHocKy';
const SHEET = 'QuanLyHocKy';
const PAGE_URL = '/admin/semesters';

const FN_LIST = 'Xem danh sách học kỳ';
const FN_UPDATE = 'Sửa thời gian học kỳ';
const FN_CONFIG = 'Cấu hình khung thời gian chuẩn';

// Dữ liệu có sẵn trong hệ thống tại thời điểm viết test (beforeAll kiểm tra lại, khác thì dừng)
const HK1 = { name: 'Học kỳ 1 năm học 2026-2027', start: '2026-08-01', end: '2027-01-31' };
const HK2 = { name: 'Học kỳ 2 năm học 2026-2027', start: '2027-02-01', end: '2027-07-31' };
const DEFAULT_CONFIG = {
  term1StartMonth: 8, term1StartDay: 1, term1EndMonth: 1, term1EndDay: 31,
  term2StartMonth: 2, term2StartDay: 1, term2EndMonth: 7, term2EndDay: 31,
};

const PRE_BASE =
  'Quản trị viên (ADMIN) đã đăng nhập. Hệ thống có 2 học kỳ: "Học kỳ 1 năm học 2026-2027" (01/08/2026 – 31/01/2027, Đang diễn ra) ' +
  'và "Học kỳ 2 năm học 2026-2027" (01/02/2027 – 31/07/2027, Chưa bắt đầu)';
const PRE_CONFIG = PRE_BASE + '; khung thời gian chuẩn: Học kỳ 1 từ 01/08 đến 31/01, Học kỳ 2 từ 01/02 đến 31/07';

const ITC162 = defineItc({
  id: 'ITC162', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra mở màn hình Quản lý học kỳ hiển thị danh sách học kỳ',
  procedure: '1. Đăng nhập vai trò Quản trị viên.\n2. Mở màn hình "Quản lý học kỳ" (/admin/semesters).',
  expected:
    '1. Gọi GET /semester, HTTP 200, code = 1000, tổng số học kỳ = 2 (bằng số học kỳ trong hệ thống).\n' +
    '2. Bảng có 2 dòng: "Học kỳ 2 năm học 2026-2027" (01/02/2027 – 31/07/2027, "Chưa bắt đầu") và "Học kỳ 1 năm học 2026-2027" (01/08/2026 – 31/01/2027, "Đang diễn ra", nhãn "Hiện tại").\n' +
    '3. Dòng tổng hiển thị "Tổng kết quả: 2 học kỳ".',
  precondition: PRE_BASE,
});

const ITC163 = defineItc({
  id: 'ITC163', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra tìm kiếm học kỳ theo tên',
  procedure: '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Quản lý học kỳ".\n2. Nhập "Học kỳ 2" vào ô "Tìm theo tên học kỳ...".',
  expected:
    '1. Gọi GET /semester với keyword = "Học kỳ 2", HTTP 200, code = 1000, trả về đúng 1 học kỳ "Học kỳ 2 năm học 2026-2027".\n' +
    '2. Bảng chỉ còn dòng "Học kỳ 2 năm học 2026-2027"; hiển thị "Tổng kết quả: 1 học kỳ".',
  precondition: PRE_BASE,
});

const ITC164 = defineItc({
  id: 'ITC164', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra lọc học kỳ theo trạng thái "Đang diễn ra"',
  procedure: '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Quản lý học kỳ".\n2. Chọn trạng thái "Đang diễn ra".',
  expected:
    '1. Danh sách đã tải (GET /semester, HTTP 200, code = 1000) được lọc ngay trên giao diện, không gọi thêm API.\n' +
    '2. Bảng chỉ còn "Học kỳ 1 năm học 2026-2027" với trạng thái "Đang diễn ra"; hiển thị "Tổng kết quả: 1 học kỳ".',
  precondition: PRE_BASE,
});

const ITC165 = defineItc({
  id: 'ITC165', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra hiển thị trạng thái rỗng khi từ khóa không khớp học kỳ nào',
  procedure: '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Quản lý học kỳ".\n2. Nhập "Học kỳ 9" vào ô "Tìm theo tên học kỳ...".',
  expected:
    '1. Gọi GET /semester với keyword = "Học kỳ 9", HTTP 200, code = 1000, danh sách rỗng.\n' +
    '2. Bảng hiển thị "Không tìm thấy học kỳ nào phù hợp với bộ lọc."; "Tổng kết quả: 0 học kỳ".',
  precondition: PRE_BASE,
});

const ITC166 = defineItc({
  id: 'ITC166', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_UPDATE,
  description: 'Kiểm tra sửa ngày kết thúc học kỳ chưa bắt đầu, không áp dụng cho các năm sau',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Quản lý học kỳ".\n' +
    '2. Bấm "Sửa thời gian" trên dòng "Học kỳ 2 năm học 2026-2027".\n' +
    '3. Đổi Thời gian kết thúc thành 30/07/2027, bỏ chọn "Tự động áp dụng khung thời gian này cho các năm sau", bấm "Lưu thay đổi".',
  expected:
    '1. Popup "Chỉnh sửa thời gian học kỳ" điền sẵn tên "Học kỳ 2 năm học 2026-2027" (không sửa được), 01/02/2027 – 31/07/2027.\n' +
    '2. Gọi PUT /semester/{mã định danh học kỳ} với ngày bắt đầu 2027-02-01, ngày kết thúc 2027-07-30, không áp dụng cho các năm sau; HTTP 200, code = 1000, message "Cập nhật thời gian học kỳ thành công".\n' +
    '3. Hiện thông báo "Cập nhật khoảng thời gian học kỳ thành công!", popup đóng, dòng học kỳ hiển thị 30/07/2027.\n' +
    '4. Dữ liệu: học kỳ có ngày kết thúc 2027-07-30, vẫn ở trạng thái Chưa bắt đầu; khung thời gian chuẩn không đổi (Học kỳ 2 kết thúc 31/07).',
  precondition: PRE_CONFIG,
});

const ITC167 = defineItc({
  id: 'ITC167', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_UPDATE,
  description: 'Kiểm tra sửa ngày kết thúc học kỳ và áp dụng làm khung chuẩn cho các năm sau',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Quản lý học kỳ".\n' +
    '2. Bấm "Sửa thời gian" trên dòng "Học kỳ 2 năm học 2026-2027".\n' +
    '3. Đổi Thời gian kết thúc thành 30/07/2027, giữ chọn "Tự động áp dụng khung thời gian này cho các năm sau", bấm "Lưu thay đổi".',
  expected:
    '1. Gọi PUT /semester/{mã định danh học kỳ} với ngày kết thúc 2027-07-30 và áp dụng cho các năm sau; HTTP 200, code = 1000, message "Cập nhật thời gian học kỳ thành công".\n' +
    '2. Hiện thông báo "Cập nhật học kỳ thành công! Khung thời gian chuẩn đã được cập nhật cho các năm sau.".\n' +
    '3. Dữ liệu: học kỳ có ngày kết thúc 2027-07-30; khung thời gian chuẩn của Học kỳ 2 đổi thành 01/02 đến 30/07.',
  precondition: PRE_CONFIG,
});

const ITC168 = defineItc({
  id: 'ITC168', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_UPDATE,
  description: 'Kiểm tra giao diện chặn lưu khi thời gian kết thúc trước thời gian bắt đầu',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Quản lý học kỳ".\n' +
    '2. Bấm "Sửa thời gian" trên dòng "Học kỳ 2 năm học 2026-2027".\n' +
    '3. Đổi Thời gian kết thúc thành 15/01/2027 (trước ngày bắt đầu 01/02/2027), bấm "Lưu thay đổi".',
  expected:
    '1. Dưới ô Thời gian kết thúc hiển thị "Thời gian kết thúc phải sau hoặc bằng thời gian bắt đầu".\n' +
    '2. Không gọi PUT /semester; popup vẫn mở; dữ liệu học kỳ không đổi.',
  precondition: PRE_BASE,
});

const ITC169 = defineItc({
  id: 'ITC169', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_UPDATE,
  description: 'Kiểm tra sửa học kỳ có ngày kết thúc trùng ngày bắt đầu (giá trị biên)',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Quản lý học kỳ".\n' +
    '2. Bấm "Sửa thời gian" trên dòng "Học kỳ 2 năm học 2026-2027".\n' +
    '3. Đổi Thời gian kết thúc thành 01/02/2027 (bằng ngày bắt đầu), bỏ chọn áp dụng cho các năm sau, bấm "Lưu thay đổi".',
  expected:
    '1. Gọi PUT /semester/{mã định danh học kỳ}; HTTP 400, code = 3006, message "Ngày bắt đầu phải đứng trước ngày kết thúc".\n' +
    '2. Popup vẫn mở và hiển thị "Ngày bắt đầu phải đứng trước ngày kết thúc".\n' +
    '3. Dữ liệu: học kỳ vẫn là 01/02/2027 – 31/07/2027.',
  precondition: PRE_BASE,
});

const ITC170 = defineItc({
  id: 'ITC170', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_UPDATE,
  description: 'Kiểm tra sửa học kỳ có khoảng thời gian trùng với học kỳ khác',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Quản lý học kỳ".\n' +
    '2. Bấm "Sửa thời gian" trên dòng "Học kỳ 2 năm học 2026-2027".\n' +
    '3. Đổi Thời gian bắt đầu thành 15/01/2027 (trùng với Học kỳ 1 kết thúc 31/01/2027), bỏ chọn áp dụng cho các năm sau, bấm "Lưu thay đổi".',
  expected:
    '1. Gọi PUT /semester/{mã định danh học kỳ}; HTTP 409, code = 3020, message "Khoảng thời gian học kỳ bị trùng lặp với học kỳ khác".\n' +
    '2. Popup vẫn mở và hiển thị "Khoảng thời gian học kỳ bị trùng lặp với học kỳ khác".\n' +
    '3. Dữ liệu: học kỳ vẫn là 01/02/2027 – 31/07/2027.',
  precondition: PRE_BASE,
});

const ITC171 = defineItc({
  id: 'ITC171', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_UPDATE,
  description: 'Kiểm tra giao diện chặn lưu khi để trống thời gian bắt đầu',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Quản lý học kỳ".\n' +
    '2. Bấm "Sửa thời gian" trên dòng "Học kỳ 2 năm học 2026-2027".\n' +
    '3. Xóa trống Thời gian bắt đầu, bấm "Lưu thay đổi".',
  expected: '1. Dưới ô Thời gian bắt đầu hiển thị "Vui lòng chọn thời gian bắt đầu".\n2. Không gọi PUT /semester; popup vẫn mở.',
  precondition: PRE_BASE,
});

const ITC172 = defineItc({
  id: 'ITC172', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_CONFIG,
  description: 'Kiểm tra xem khung thời gian chuẩn hiện tại',
  procedure: '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Quản lý học kỳ".\n2. Bấm "Khung thời gian chuẩn".',
  expected:
    '1. Khi mở màn hình, giao diện tải sẵn GET /semester/config, HTTP 200, code = 1000, dữ liệu: Học kỳ 1 từ 01/08 đến 31/01, Học kỳ 2 từ 01/02 đến 31/07.\n' +
    '2. Popup "Cấu hình Khung Thời gian Chuẩn" hiển thị Học kỳ 1: "Ngày 01" "Tháng 8" đến "Ngày 31" "Tháng 1"; Học kỳ 2: "Ngày 01" "Tháng 2" đến "Ngày 31" "Tháng 7".',
  precondition: PRE_CONFIG,
});

const ITC173 = defineItc({
  id: 'ITC173', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_CONFIG,
  description: 'Kiểm tra cập nhật khung thời gian chuẩn của Học kỳ 2',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Quản lý học kỳ", bấm "Khung thời gian chuẩn".\n' +
    '2. Ở Học kỳ 2, đổi "Đến hết ngày" thành "Ngày 30" "Tháng 7", bấm "Lưu".',
  expected:
    '1. Gọi PUT /semester/config với Học kỳ 2 kết thúc ngày 30 tháng 7 (các mốc khác giữ nguyên); HTTP 200, code = 1000, message "Cập nhật khung thời gian học kỳ thành công, các năm học tiếp theo sẽ tự động áp dụng".\n' +
    '2. Hiện thông báo "Cập nhật khung thời gian chuẩn thành công! Các năm sau sẽ tự động áp dụng.", popup đóng.\n' +
    '3. Dữ liệu: khung chuẩn Học kỳ 2 kết thúc 30/07; số học kỳ trong hệ thống không đổi (2); ngày của các học kỳ hiện có không đổi.',
  precondition: PRE_CONFIG,
});

const SEC068 = defineItcSec({
  id: 'TC-SEC-068', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Trưởng bộ môn mở màn hình Quản lý học kỳ và gọi API sửa học kỳ',
  roleSession: 'Trưởng bộ môn (HEAD_OF_MAJOR), đã đăng nhập',
  technique: 'EP',
  given: 'Đăng nhập bằng tài khoản Trưởng bộ môn (không có vai trò ADMIN)',
  when: 'Mở thẳng /admin/semesters; gọi PUT /semester/{mã định danh "Học kỳ 2 năm học 2026-2027"} (01/02/2027 – 30/07/2027) bằng phiên Trưởng bộ môn',
  then: 'Bị chuyển về /department, không hiển thị nút "Khung thời gian chuẩn"; PUT trả HTTP 403, code = 2001; học kỳ vẫn kết thúc 31/07/2027',
});

const SEC069 = defineItcSec({
  id: 'TC-SEC-069', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Sinh viên mở màn hình Quản lý học kỳ và gọi API đổi khung thời gian chuẩn',
  roleSession: 'Sinh viên (STUDENT), đã đăng nhập',
  technique: 'EP',
  given: 'Đăng nhập bằng tài khoản Sinh viên',
  when: 'Mở thẳng /admin/semesters; gọi PUT /semester/config (Học kỳ 2 kết thúc 30/07) bằng phiên Sinh viên',
  then: 'Màn hình hiển thị "Tài khoản của bạn không có quyền truy cập cổng cán bộ."; PUT trả HTTP 403, code = 2001; khung chuẩn Học kỳ 2 vẫn kết thúc 31/07',
});

const SEC070 = defineItcSec({
  id: 'TC-SEC-070', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Chưa đăng nhập mở màn hình Quản lý học kỳ và gọi API sửa học kỳ',
  roleSession: 'Chưa đăng nhập (không có cookie phiên)',
  technique: 'EP',
  given: 'Trình duyệt chưa đăng nhập',
  when: 'Mở thẳng /admin/semesters; gọi PUT /semester/{mã định danh "Học kỳ 2 năm học 2026-2027"} không kèm phiên đăng nhập',
  then: 'Bị chuyển về trang đăng nhập (/login); PUT trả HTTP 401, code = 2000; học kỳ không đổi',
});

// ============================================================================
// HÀM HỖ TRỢ
// ============================================================================

let hk2Id = '';

function requireEmail(role: string): string {
  const email = process.env[`E2E_EMAIL_${role}`];
  if (!email) throw new Error(`Chưa cấu hình E2E_EMAIL_${role} trong .env.e2e`);
  return email;
}
const token = (request: APIRequestContext, role: 'ADMIN' | 'HEAD_OF_MAJOR' | 'STUDENT') =>
  loginByEmail(request, requireEmail(role));

type SemRow = { start: string; end: string; status: string };
async function semesterRow(name: string): Promise<SemRow> {
  const rows = await dbSelect<SemRow>(
    `SELECT DATE_FORMAT(start_date, '%Y-%m-%d') AS start, DATE_FORMAT(end_date, '%Y-%m-%d') AS end, status
       FROM semester WHERE name = ?`, [name]);
  expect(rows, `Không có học kỳ ${name}`).toHaveLength(1);
  return rows[0];
}

async function configRow() {
  const rows = await dbSelect<Record<string, number>>(
    `SELECT term1_start_month, term1_start_day, term1_end_month, term1_end_day,
            term2_start_month, term2_start_day, term2_end_month, term2_end_day
       FROM semester_config ORDER BY id LIMIT 1`);
  return rows[0];
}

const configMatchesDefault = (c: Record<string, number>) =>
  c.term1_start_month === 8 && c.term1_start_day === 1 && c.term1_end_month === 1 && c.term1_end_day === 31 &&
  c.term2_start_month === 2 && c.term2_start_day === 1 && c.term2_end_month === 7 && c.term2_end_day === 31;

async function semesterCount() {
  return (await dbSelect<{ n: number }>(`SELECT COUNT(*) AS n FROM semester`))[0].n;
}

// Khôi phục học kỳ 2 và khung chuẩn về giá trị ban đầu bằng API (chỉ gọi khi đã bị đổi)
async function restore(request: APIRequestContext) {
  const admin = await token(request, 'ADMIN');
  const hk2 = await semesterRow(HK2.name);
  if (hk2.start !== HK2.start || hk2.end !== HK2.end) {
    const res = await apiCall(request, admin, 'PUT', `/semester/${hk2Id}`, {
      data: { name: HK2.name, startDate: HK2.start, endDate: HK2.end, applyToFutureSemesters: false },
    });
    expect(res.status, `Không khôi phục được ${HK2.name}`).toBe(200);
  }
  if (!configMatchesDefault(await configRow())) {
    const res = await apiCall(request, admin, 'PUT', '/semester/config', { data: DEFAULT_CONFIG });
    expect(res.status, 'Không khôi phục được khung thời gian chuẩn').toBe(200);
  }
}

const isList = (r: Response, check?: (u: URL) => boolean) => {
  if (r.request().method() !== 'GET') return false;
  const u = new URL(r.url());
  return u.pathname.endsWith('/semester') && (!check || check(u));
};
const isUpdate = (r: Response) => r.request().method() === 'PUT' && new URL(r.url()).pathname.endsWith(`/semester/${hk2Id}`);

async function openPage(page: Page) {
  const resPromise = page.waitForResponse((r) => isList(r));
  await page.goto(PAGE_URL);
  const res = await resPromise;
  await expect(page.getByRole('button', { name: 'Khung thời gian chuẩn' })).toBeVisible();
  return res;
}

const rowOf = (page: Page, name: string) => page.getByRole('row').filter({ hasText: name });
const dataRows = (page: Page) => page.getByRole('row').filter({ has: page.getByRole('button', { name: 'Sửa thời gian' }) });

async function openEdit(page: Page) {
  await openPage(page);
  await rowOf(page, HK2.name).getByRole('button', { name: 'Sửa thời gian' }).click();
  const dialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Chỉnh sửa thời gian học kỳ' }) });
  await expect(dialog).toBeVisible();
  return dialog;
}

function trackPuts(page: Page) {
  const state = { put: false };
  page.on('request', (r) => { if (r.method() === 'PUT' && new URL(r.url()).pathname.includes('/semester')) state.put = true; });
  return state;
}

const futureCheckbox = (dialog: ReturnType<Page['getByRole']>) =>
  dialog.getByRole('checkbox', { name: /Tự động áp dụng khung thời gian này cho các năm sau/ });

// ============================================================================
// TEST
// ============================================================================

test.beforeAll(async ({ request }) => {
  const admin = await token(request, 'ADMIN');
  const list = await apiCall(request, admin, 'GET', '/semester', { params: { size: 50 } });
  const hk2 = list.body.data.content.find((s: any) => s.name === HK2.name);
  if (!hk2) throw new Error(`Môi trường thiếu học kỳ ${HK2.name}`);
  hk2Id = hk2.publicId;
  await restore(request);
  expect(await semesterRow(HK1.name)).toMatchObject({ start: HK1.start, end: HK1.end, status: 'ONGOING' });
  expect(await semesterRow(HK2.name)).toMatchObject({ start: HK2.start, end: HK2.end, status: 'UPCOMING' });
  expect(await semesterCount(), 'Tiền điều kiện: hệ thống có đúng 2 học kỳ').toBe(2);
});

test.afterEach(async ({ request }) => {
  await restore(request);
});

test.describe('Quản lý học kỳ (Quản trị viên)', () => {
  test.use({ storageState: '.auth/admin.json' });

  test.describe(FN_LIST, () => {
    test(ITC162.title, { annotation: ITC162.annotation }, async ({ page }) => {
      const res = await openPage(page);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.data.totalElements).toBe(await semesterCount());
      expect(body.data.totalElements).toBe(2);

      await expect(dataRows(page)).toHaveCount(2);
      const r2 = rowOf(page, HK2.name);
      for (const t of ['01/02/2027', '31/07/2027', 'Chưa bắt đầu']) await expect(r2).toContainText(t);
      const r1 = rowOf(page, HK1.name);
      for (const t of ['01/08/2026', '31/01/2027', 'Đang diễn ra', 'Hiện tại']) await expect(r1).toContainText(t);
      await expect(page.getByText(/Tổng kết quả:\s*2\s*học kỳ/)).toBeVisible();
    });

    test(ITC163.title, { annotation: ITC163.annotation }, async ({ page }) => {
      await openPage(page);
      const resPromise = page.waitForResponse((r) => isList(r, (u) => u.searchParams.get('keyword') === 'Học kỳ 2'));
      await page.getByPlaceholder('Tìm theo tên học kỳ...').fill('Học kỳ 2');
      const res = await resPromise;
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.data.content.map((s: any) => s.name)).toEqual([HK2.name]);
      await expect(dataRows(page)).toHaveCount(1);
      await expect(dataRows(page).first()).toContainText(HK2.name);
      await expect(page.getByText(/Tổng kết quả:\s*1\s*học kỳ/)).toBeVisible();
    });

    test(ITC164.title, { annotation: ITC164.annotation }, async ({ page }) => {
      const res = await openPage(page);
      expect(res.status()).toBe(200);
      expect((await res.json()).code).toBe(1000);
      let extraCalls = 0;
      page.on('request', (r) => { if (r.method() === 'GET' && new URL(r.url()).pathname.endsWith('/semester')) extraCalls++; });
      await page.getByLabel('Lọc theo trạng thái học kỳ').selectOption('active');
      await expect(dataRows(page)).toHaveCount(1);
      await expect(dataRows(page).first()).toContainText(HK1.name);
      await expect(dataRows(page).first()).toContainText('Đang diễn ra');
      await expect(page.getByText(/Tổng kết quả:\s*1\s*học kỳ/)).toBeVisible();
      expect(extraCalls).toBe(0);
    });

    test(ITC165.title, { annotation: ITC165.annotation }, async ({ page }) => {
      await openPage(page);
      const resPromise = page.waitForResponse((r) => isList(r, (u) => u.searchParams.get('keyword') === 'Học kỳ 9'));
      await page.getByPlaceholder('Tìm theo tên học kỳ...').fill('Học kỳ 9');
      const res = await resPromise;
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.data.content).toHaveLength(0);
      await expect(page.getByText('Không tìm thấy học kỳ nào phù hợp với bộ lọc.')).toBeVisible();
      await expect(page.getByText(/Tổng kết quả:\s*0\s*học kỳ/)).toBeVisible();
    });
  });

  test.describe(FN_UPDATE, () => {
    test(ITC166.title, { annotation: ITC166.annotation }, async ({ page }) => {
      const dialog = await openEdit(page);
      await expect(dialog.getByLabel('Tên học kỳ')).toHaveValue(HK2.name);
      await expect(dialog.getByLabel('Tên học kỳ')).toBeDisabled();
      await expect(dialog.getByLabel(/^Thời gian bắt đầu/)).toHaveValue(HK2.start);
      await expect(dialog.getByLabel(/^Thời gian kết thúc/)).toHaveValue(HK2.end);

      await dialog.getByLabel(/^Thời gian kết thúc/).fill('2027-07-30');
      await futureCheckbox(dialog).uncheck();
      const resPromise = page.waitForResponse(isUpdate);
      await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
      const res = await resPromise;
      const sent = res.request().postDataJSON();
      expect(sent).toMatchObject({ startDate: '2027-02-01', endDate: '2027-07-30', applyToFutureSemesters: false });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.message).toBe('Cập nhật thời gian học kỳ thành công');
      await expect(page.getByText('Cập nhật khoảng thời gian học kỳ thành công!').first()).toBeVisible();
      await expect(dialog).toBeHidden();
      await expect(rowOf(page, HK2.name)).toContainText('30/07/2027');

      expect(await semesterRow(HK2.name)).toMatchObject({ start: '2027-02-01', end: '2027-07-30', status: 'UPCOMING' });
      expect(configMatchesDefault(await configRow())).toBe(true);
    });

    test(ITC167.title, { annotation: ITC167.annotation }, async ({ page }) => {
      const dialog = await openEdit(page);
      await dialog.getByLabel(/^Thời gian kết thúc/).fill('2027-07-30');
      await expect(futureCheckbox(dialog)).toBeChecked();
      const resPromise = page.waitForResponse(isUpdate);
      await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
      const res = await resPromise;
      expect(res.request().postDataJSON()).toMatchObject({ endDate: '2027-07-30', applyToFutureSemesters: true });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.message).toBe('Cập nhật thời gian học kỳ thành công');
      await expect(page.getByText('Cập nhật học kỳ thành công! Khung thời gian chuẩn đã được cập nhật cho các năm sau.').first()).toBeVisible();

      expect((await semesterRow(HK2.name)).end).toBe('2027-07-30');
      const cfg = await configRow();
      expect([cfg.term2_start_day, cfg.term2_start_month, cfg.term2_end_day, cfg.term2_end_month]).toEqual([1, 2, 30, 7]);
    });

    test(ITC168.title, { annotation: ITC168.annotation }, async ({ page }) => {
      const dialog = await openEdit(page);
      const puts = trackPuts(page);
      await dialog.getByLabel(/^Thời gian kết thúc/).fill('2027-01-15');
      await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
      await expect(dialog.getByText('Thời gian kết thúc phải sau hoặc bằng thời gian bắt đầu')).toBeVisible();
      await expect(dialog).toBeVisible();
      expect(puts.put).toBe(false);
      expect(await semesterRow(HK2.name)).toMatchObject({ start: HK2.start, end: HK2.end });
    });

    test(ITC169.title, { annotation: ITC169.annotation }, async ({ page }) => {
      const dialog = await openEdit(page);
      await dialog.getByLabel(/^Thời gian kết thúc/).fill('2027-02-01');
      await futureCheckbox(dialog).uncheck();
      const resPromise = page.waitForResponse(isUpdate);
      await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
      const res = await resPromise;
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.code).toBe(3006);
      expect(body.message).toBe('Ngày bắt đầu phải đứng trước ngày kết thúc');
      await expect(dialog.getByRole('alert').filter({ hasText: 'Ngày bắt đầu phải đứng trước ngày kết thúc' })).toBeVisible();
      expect(await semesterRow(HK2.name)).toMatchObject({ start: HK2.start, end: HK2.end });
    });

    test(ITC170.title, { annotation: ITC170.annotation }, async ({ page }) => {
      const dialog = await openEdit(page);
      await dialog.getByLabel(/^Thời gian bắt đầu/).fill('2027-01-15');
      await futureCheckbox(dialog).uncheck();
      const resPromise = page.waitForResponse(isUpdate);
      await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
      const res = await resPromise;
      expect(res.status()).toBe(409);
      const body = await res.json();
      expect(body.code).toBe(3020);
      expect(body.message).toBe('Khoảng thời gian học kỳ bị trùng lặp với học kỳ khác');
      await expect(dialog.getByRole('alert').filter({ hasText: 'Khoảng thời gian học kỳ bị trùng lặp với học kỳ khác' })).toBeVisible();
      expect(await semesterRow(HK2.name)).toMatchObject({ start: HK2.start, end: HK2.end });
    });

    test(ITC171.title, { annotation: ITC171.annotation }, async ({ page }) => {
      const dialog = await openEdit(page);
      const puts = trackPuts(page);
      await dialog.getByLabel(/^Thời gian bắt đầu/).fill('');
      await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
      await expect(dialog.getByText('Vui lòng chọn thời gian bắt đầu')).toBeVisible();
      await expect(dialog).toBeVisible();
      expect(puts.put).toBe(false);
    });
  });

  test.describe(FN_CONFIG, () => {
    async function openConfig(page: Page) {
      // FE tải sẵn GET /semester/config ngay khi mở màn hình (popup cấu hình luôn được gắn sẵn trên trang)
      const resPromise = page.waitForResponse((r) => r.request().method() === 'GET' && new URL(r.url()).pathname.endsWith('/semester/config'));
      await openPage(page);
      const res = await resPromise;
      await page.getByRole('button', { name: 'Khung thời gian chuẩn' }).click();
      const dialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Cấu hình Khung Thời gian Chuẩn' }) });
      await expect(dialog).toBeVisible();
      // Thứ tự ô: HK1 bắt đầu (ngày, tháng), HK1 kết thúc (ngày, tháng), HK2 bắt đầu (ngày, tháng), HK2 kết thúc (ngày, tháng)
      return { res, dialog, selects: dialog.locator('select') };
    }

    test(ITC172.title, { annotation: ITC172.annotation }, async ({ page }) => {
      const { res, selects } = await openConfig(page);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.data).toMatchObject(DEFAULT_CONFIG);
      const expected = ['Ngày 01', 'Tháng 8', 'Ngày 31', 'Tháng 1', 'Ngày 01', 'Tháng 2', 'Ngày 31', 'Tháng 7'];
      await expect(selects).toHaveCount(8);
      for (let i = 0; i < 8; i++) {
        await expect(selects.nth(i).locator('option:checked')).toHaveText(expected[i]);
      }
    });

    test(ITC173.title, { annotation: ITC173.annotation }, async ({ page }) => {
      const before = await semesterCount();
      const { dialog, selects } = await openConfig(page);
      await expect(selects.nth(6).locator('option:checked')).toHaveText('Ngày 31');
      await selects.nth(6).selectOption({ label: 'Ngày 30' });
      const resPromise = page.waitForResponse((r) => r.request().method() === 'PUT' && new URL(r.url()).pathname.endsWith('/semester/config'));
      await dialog.getByRole('button', { name: 'Lưu' }).click();
      const res = await resPromise;
      expect(res.request().postDataJSON()).toEqual({ ...DEFAULT_CONFIG, term2EndDay: 30 });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.message).toBe('Cập nhật khung thời gian học kỳ thành công, các năm học tiếp theo sẽ tự động áp dụng');
      await expect(page.getByText('Cập nhật khung thời gian chuẩn thành công! Các năm sau sẽ tự động áp dụng.').first()).toBeVisible();
      await expect(dialog).toBeHidden();

      expect((await configRow()).term2_end_day).toBe(30);
      expect(await semesterCount()).toBe(before);
      expect(await semesterRow(HK1.name)).toMatchObject({ start: HK1.start, end: HK1.end });
      expect(await semesterRow(HK2.name)).toMatchObject({ start: HK2.start, end: HK2.end });
    });
  });
});

test.describe('SecurityTest - Quản lý học kỳ', () => {
  test.describe('Trưởng bộ môn', () => {
    test.use({ storageState: '.auth/head_of_major.json' });
    test(SEC068.title, { annotation: SEC068.annotation }, async ({ page, request }) => {
      await page.goto(PAGE_URL);
      await expect(page).toHaveURL(/\/department$/);
      await expect(page.getByRole('button', { name: 'Khung thời gian chuẩn' })).toHaveCount(0);

      const hm = await token(request, 'HEAD_OF_MAJOR');
      const res = await apiCall(request, hm, 'PUT', `/semester/${hk2Id}`, {
        data: { startDate: HK2.start, endDate: '2027-07-30', applyToFutureSemesters: false },
      });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(2001);
      expect((await semesterRow(HK2.name)).end).toBe(HK2.end);
    });
  });

  test.describe('Sinh viên', () => {
    test.use({ storageState: '.auth/student.json' });
    test(SEC069.title, { annotation: SEC069.annotation }, async ({ page, request }) => {
      await page.goto(PAGE_URL);
      await expect(page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Khung thời gian chuẩn' })).toHaveCount(0);

      const student = await token(request, 'STUDENT');
      const res = await apiCall(request, student, 'PUT', '/semester/config', { data: { ...DEFAULT_CONFIG, term2EndDay: 30 } });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(2001);
      expect((await configRow()).term2_end_day).toBe(31);
    });
  });

  test.describe('Chưa đăng nhập', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test(SEC070.title, { annotation: SEC070.annotation }, async ({ page, request }) => {
      await page.goto(PAGE_URL);
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByPlaceholder('Tìm theo tên học kỳ...')).toHaveCount(0);

      const res = await request.put(`${getApiBaseUrl()}/semester/${hk2Id}`, {
        data: { startDate: HK2.start, endDate: '2027-07-30', applyToFutureSemesters: false },
      });
      expect(res.status()).toBe(401);
      expect((await res.json()).code).toBe(2000);
      expect(await semesterRow(HK2.name)).toMatchObject({ start: HK2.start, end: HK2.end });
    });
  });
});
