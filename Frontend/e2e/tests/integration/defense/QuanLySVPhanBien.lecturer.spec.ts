import { test, expect, type APIRequestContext, type Page, type Response } from '@playwright/test';
import { defineItc, defineItcSec } from '../../../support/integration-test-case';
import { apiCall, getApiBaseUrl, loginByEmail } from '../../../support/api';
import { dbSelect } from '../../../support/db';

// ============================================================================
// ĐẶC TẢ TEST CASE (ITC313..ITC320 & TC-SEC-103..TC-SEC-105)
// Feature: defense | Module/Sheet: QuanLySVPhanBien
// Role: Giảng viên phản biện (EXAMINER) — màn hình "/lecturer/defense/reviews" (Phản biện)
//
// Phiên đăng nhập: .env.e2e chưa có E2E_EMAIL_EXAMINER, nên dùng tài khoản Trưởng bộ môn (đồng thời
// có role EXAMINER và đang được phân công phản biện) vào cổng giảng viên.
// Dữ liệu: dùng các suất phản biện đang có, KHÔNG ghi dữ liệu. Mốc "Hạn nộp phiếu chấm phản biện"
// chưa được thiết lập nên giao diện khóa xếp lịch / chấm / quyết định; case ghi thành công (xếp lịch,
// lưu nháp, nộp phiếu, quyết định, tải file lên Cloudinary) không có API hoàn tác nên không chạy.
// ============================================================================

const FEATURE = 'defense';
const MODULE = 'QuanLySVPhanBien';
const SHEET = 'QuanLySVPhanBien';
const PAGE_URL = '/lecturer/defense/reviews';
const SEARCH = 'Tìm tên SV, MSSV, đề tài...';

const FN_LIST = 'Xem danh sách sinh viên phản biện';
const FN_SHEET = 'Xem phiếu chấm phản biện';
const FN_SCHEDULE = 'Xếp lịch phản biện';
const FN_EXPORT = 'Xuất phiếu chấm phản biện';

const PRE_GVPB = 'Giảng viên phản biện đã đăng nhập (tài khoản Trưởng bộ môn đồng thời là GVPB); giảng viên được phân công phản biện sinh viên trong học kỳ hiện tại, có sinh viên đã nộp phiếu và sinh viên chưa chấm';
const PRE_CLOSED = PRE_GVPB + '; mốc "Hạn nộp phiếu chấm phản biện" của học kỳ chưa được thiết lập';

const ITC313 = defineItc({
  id: 'ITC313', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra mở màn hình Phản biện hiển thị danh sách sinh viên được phân công phản biện',
  procedure: '1. Đăng nhập vai trò Giảng viên phản biện.\n2. Mở màn hình "Phản biện" (/lecturer/defense/reviews).',
  expected:
    '1. Gọi GET /examiner-assignment/my với học kỳ hiện tại; HTTP 200, code = 1000.\n' +
    '2. Hiển thị "Hiển thị <N> / <N> sinh viên" với N = số suất phản biện trả về; các tab "Tất cả", "Chưa chấm", "Đã chấm" có số lượng đúng theo trạng thái phiếu.\n' +
    '3. Mỗi sinh viên hiển thị họ tên và "<MSSV> · <mã hội đồng>".',
  precondition: PRE_GVPB,
});

const ITC314 = defineItc({
  id: 'ITC314', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra lọc sinh viên "Chưa chấm"',
  procedure: '1. Đăng nhập vai trò Giảng viên phản biện, mở màn hình "Phản biện".\n2. Bấm tab "Chưa chấm".',
  expected:
    '1. Không gọi lại API; chỉ còn các sinh viên chưa nộp phiếu chấm phản biện, mỗi sinh viên có nhãn "Chưa chấm".\n' +
    '2. Sinh viên đã nộp phiếu không hiển thị.',
  precondition: PRE_GVPB,
});

const ITC315 = defineItc({
  id: 'ITC315', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra tìm sinh viên phản biện theo MSSV',
  procedure: '1. Đăng nhập vai trò Giảng viên phản biện, mở màn hình "Phản biện".\n2. Nhập MSSV của một sinh viên được phân công vào ô "Tìm tên SV, MSSV, đề tài...".',
  expected: '1. Hiển thị "Hiển thị 1 / <N> sinh viên"; chỉ còn sinh viên có MSSV đã nhập với đúng họ tên.',
  precondition: PRE_GVPB,
});

const ITC316 = defineItc({
  id: 'ITC316', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra tìm sinh viên phản biện với từ khóa không khớp',
  procedure: '1. Đăng nhập vai trò Giảng viên phản biện, mở màn hình "Phản biện".\n2. Nhập "KHONGTONTAI9999" vào ô tìm kiếm.',
  expected: '1. Hiển thị "Không tìm thấy sinh viên nào phù hợp." và "Hiển thị 0 / <N> sinh viên".',
  precondition: PRE_GVPB,
});

const ITC317 = defineItc({
  id: 'ITC317', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_SHEET,
  description: 'Kiểm tra xem phiếu chấm phản biện đã nộp của một sinh viên',
  procedure: '1. Đăng nhập vai trò Giảng viên phản biện, mở màn hình "Phản biện".\n2. Bấm vào sinh viên đã nộp phiếu chấm.',
  expected:
    '1. Gọi GET /examiner-assignment/{mã suất phản biện}/evaluation; HTTP 200, code = 1000, dữ liệu đúng MSSV của sinh viên.\n' +
    '2. Phiếu hiển thị họ tên, MSSV, lớp của sinh viên; trạng thái "Đã nộp (<điểm>đ)"; nội dung nhận xét, câu hỏi 1, câu hỏi 2 và điểm từng tiêu chí đúng như đã lưu.',
  precondition: PRE_GVPB,
});

const ITC318 = defineItc({
  id: 'ITC318', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_SHEET,
  description: 'Kiểm tra khóa chấm và quyết định phản biện khi chưa thiết lập mốc "Hạn nộp phiếu chấm phản biện"',
  procedure: '1. Đăng nhập vai trò Giảng viên phản biện, mở màn hình "Phản biện".\n2. Bấm vào một sinh viên chưa chấm.',
  expected:
    '1. Hiển thị thông báo "Phiếu phản biện đang khóa: Chỉ chấm từ ... đến trước <ngày đóng chấm>".\n' +
    '2. Ô nhận xét, câu hỏi, điểm tiêu chí và nút "Đủ điều kiện bảo vệ", "Không đủ điều kiện bảo vệ" đều bị khóa.\n' +
    '3. Không gọi PUT /examiner-assignment/{mã}/evaluation hay PATCH /examiner-assignment/{mã}/decision; dữ liệu: quyết định phản biện của sinh viên vẫn là "Chờ quyết định".',
  precondition: PRE_CLOSED,
});

const ITC319 = defineItc({
  id: 'ITC319', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_SCHEDULE,
  description: 'Kiểm tra khóa xếp lịch phản biện ngoài khung thời gian xếp lịch',
  procedure: '1. Đăng nhập vai trò Giảng viên phản biện, mở màn hình "Phản biện".\n2. Bấm "Bảng danh sách", xem nút "Lịch PB" ở dòng một sinh viên.',
  expected:
    '1. Nút "Lịch PB" bị khóa với chú thích "Ngoài khung thời gian xếp lịch".\n' +
    '2. Không gọi PUT /examiner-assignment/{mã}/schedule; dữ liệu: lịch phản biện không đổi.',
  precondition: PRE_CLOSED,
});

const ITC320 = defineItc({
  id: 'ITC320', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_EXPORT,
  description: 'Kiểm tra xuất phiếu chấm phản biện ra file .docx',
  procedure: '1. Đăng nhập vai trò Giảng viên phản biện, mở màn hình "Phản biện".\n2. Bấm vào sinh viên đã nộp phiếu, bấm "Xuất phiếu chấm (.docx)".',
  expected:
    '1. Gọi GET /examiner-assignment/{mã suất phản biện}/evaluation/export; HTTP 200, kiểu file Word (.docx).\n' +
    '2. Trình duyệt tải về file có đuôi ".docx".',
  precondition: PRE_GVPB,
});

const SEC103 = defineItcSec({
  id: 'TC-SEC-103', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Sinh viên mở màn hình Phản biện và gọi API danh sách phản biện',
  roleSession: 'Sinh viên (STUDENT), đã đăng nhập',
  technique: 'EP',
  given: 'Đăng nhập bằng tài khoản Sinh viên',
  when: 'Mở thẳng /lecturer/defense/reviews; gọi GET /examiner-assignment/my bằng phiên Sinh viên',
  then: 'Màn hình hiển thị "Tài khoản của bạn không có quyền truy cập cổng cán bộ."; GET trả HTTP 403, code = 2001, không trả danh sách',
});

const SEC104 = defineItcSec({
  id: 'TC-SEC-104', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'GVPB gọi API quyết định phản biện trên suất phản biện của giảng viên khác',
  roleSession: 'Giảng viên phản biện (EXAMINER), đã đăng nhập',
  technique: 'ERROR_GUESSING',
  given: 'Đăng nhập bằng tài khoản GVPB; sinh viên có 2 GVPB, suất còn lại thuộc giảng viên khác',
  when: 'Gọi PATCH /examiner-assignment/{mã suất phản biện của GVPB còn lại}/decision với quyết định Không đồng ý',
  then: 'HTTP 403, code = 3128, message "Bạn không phải là Giảng viên phản biện được phân công cho sinh viên này"; quyết định của suất phản biện đó không đổi',
});

const SEC105 = defineItcSec({
  id: 'TC-SEC-105', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Chưa đăng nhập mở màn hình Phản biện và gọi API xếp lịch phản biện',
  roleSession: 'Chưa đăng nhập (không có cookie phiên)',
  technique: 'EP',
  given: 'Trình duyệt chưa đăng nhập',
  when: 'Mở thẳng /lecturer/defense/reviews; gọi PUT /examiner-assignment/{mã suất phản biện}/schedule không kèm phiên đăng nhập',
  then: 'Bị chuyển về trang đăng nhập (/login); PUT trả HTTP 401, code = 2000; lịch phản biện không đổi',
});

// ============================================================================
// DỮ LIỆU & HÀM HỖ TRỢ
// ============================================================================

type MyAssignment = {
  examinerAssignmentPublicId: string; examinerOrder: number; councilCode: string; studentCode: string; studentName: string;
  className: string; sheetStatus: string | null; sheetScore: number | null; decision: string; gradingCloseAt: string | null;
  scheduleOpen: boolean; gradingOpen: boolean; editable: boolean;
  coExaminer: { examinerAssignmentPublicId: string; decision: string } | null;
};

function requireEmail(role: string): string {
  const email = process.env[`E2E_EMAIL_${role}`];
  if (!email) throw new Error(`Chưa cấu hình E2E_EMAIL_${role} trong .env.e2e`);
  return email;
}
const token = (request: APIRequestContext, role: 'HEAD_OF_MAJOR' | 'STUDENT') => loginByEmail(request, requireEmail(role));

let semesterPublicId = '';
let mine: MyAssignment[] = [];

async function loadContext(request: APIRequestContext) {
  const t = await token(request, 'HEAD_OF_MAJOR');
  const cur = await apiCall(request, t, 'GET', '/semester/current');
  semesterPublicId = cur.body.data.publicId ?? cur.body.data.id;
  const my = await apiCall(request, t, 'GET', '/examiner-assignment/my', { params: { semesterId: semesterPublicId } });
  mine = my.body.data;
  expect(mine.length, 'Tài khoản GVPB cần được phân công phản biện ít nhất 1 sinh viên').toBeGreaterThan(0);
}

async function eaRow(publicId: string) {
  const rows = await dbSelect<{ review_decision: string; review_date: string | null; review_location: string | null }>(
    `SELECT review_decision, review_date, review_location FROM examiner_assignment WHERE public_id = UUID_TO_BIN(?)`, [publicId]);
  return rows[0];
}

const submitted = () => mine.filter((a) => a.sheetStatus === 'SUBMITTED');
const unsubmitted = () => mine.filter((a) => a.sheetStatus !== 'SUBMITTED');
const itemOf = (page: Page, a: MyAssignment) => page.getByText(`${a.studentCode} · ${a.councilCode}`, { exact: true });
const path = (r: Response) => new URL(r.url()).pathname;
const formatDate = (iso: string) => { const d = new Date(iso); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; };

function trackRequests(page: Page, methods: string[], test: (pathname: string) => boolean) {
  const state = { sent: false };
  page.on('request', (r) => { if (methods.includes(r.method()) && test(new URL(r.url()).pathname)) state.sent = true; });
  return state;
}

// Response phiếu chấm theo từng suất phản biện, ghi nhận từ lúc mở trang
// (sinh viên đầu danh sách được tự chọn và phiếu được lưu cache, bấm lại không gọi lại API)
const evaluations = new WeakMap<Page, Map<string, Response>>();

async function openPage(page: Page) {
  const seen = new Map<string, Response>();
  evaluations.set(page, seen);
  page.on('response', (r) => {
    const m = /\/examiner-assignment\/([^/]+)\/evaluation$/.exec(path(r));
    if (m && r.request().method() === 'GET') seen.set(m[1], r);
  });
  const resPromise = page.waitForResponse((r) => r.request().method() === 'GET' && path(r).endsWith('/examiner-assignment/my'));
  await page.goto(PAGE_URL);
  const res = await resPromise;
  await expect(page.getByPlaceholder(SEARCH)).toBeVisible();
  return res;
}

async function selectStudent(page: Page, a: MyAssignment): Promise<Response> {
  await itemOf(page, a).click();
  const seen = evaluations.get(page)!;
  await expect.poll(() => seen.has(a.examinerAssignmentPublicId), { message: 'Chưa gọi GET phiếu chấm của sinh viên đã chọn' }).toBe(true);
  return seen.get(a.examinerAssignmentPublicId)!;
}

// ============================================================================
// TEST
// ============================================================================

test.describe('Quản lý sinh viên phản biện (Giảng viên phản biện)', () => {
  test.use({ storageState: '.auth/head_of_major.json' });

  test.beforeAll(async ({ request }) => {
    await loadContext(request);
  });

  // ------------------------------------------------------------------ Danh sách
  test.describe(FN_LIST, () => {
    test(ITC313.title, { annotation: ITC313.annotation }, async ({ page }) => {
      const res = await openPage(page);
      expect(new URL(res.url()).searchParams.get('semesterId')).toBe(semesterPublicId);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      const data = body.data as MyAssignment[];
      const n = data.length;
      const done = data.filter((a) => a.sheetStatus === 'SUBMITTED').length;
      await expect(page.getByText(`Hiển thị ${n} / ${n} sinh viên`)).toBeVisible();
      await expect(page.getByRole('button', { name: `Tất cả ${n}` })).toBeVisible();
      await expect(page.getByRole('button', { name: `Chưa chấm ${n - done}` })).toBeVisible();
      await expect(page.getByRole('button', { name: `Đã chấm ${done}` })).toBeVisible();
      for (const a of data) {
        await expect(itemOf(page, a)).toBeVisible();
        await expect(page.getByText(a.studentName, { exact: true }).first()).toBeVisible();
      }
    });

    test(ITC314.title, { annotation: ITC314.annotation }, async ({ page }) => {
      expect(submitted().length, 'Cần ít nhất 1 sinh viên đã nộp phiếu').toBeGreaterThan(0);
      await openPage(page);
      const calls = trackRequests(page, ['GET'], (p) => p.endsWith('/examiner-assignment/my'));
      await page.getByRole('button', { name: /^Chưa chấm/ }).click();
      await expect(page.getByText(`Hiển thị ${unsubmitted().length} / ${mine.length} sinh viên`)).toBeVisible();
      for (const a of unsubmitted()) await expect(itemOf(page, a)).toBeVisible();
      for (const a of submitted()) await expect(itemOf(page, a)).toHaveCount(0);
      expect(calls.sent).toBe(false);
    });

    test(ITC315.title, { annotation: ITC315.annotation }, async ({ page }) => {
      const a = mine[0];
      await openPage(page);
      await page.getByPlaceholder(SEARCH).fill(a.studentCode);
      await expect(page.getByText(`Hiển thị 1 / ${mine.length} sinh viên`)).toBeVisible();
      await expect(itemOf(page, a)).toBeVisible();
      await expect(page.getByText(a.studentName, { exact: true }).first()).toBeVisible();
      for (const other of mine.filter((x) => x.studentCode !== a.studentCode)) {
        await expect(itemOf(page, other)).toHaveCount(0);
      }
    });

    test(ITC316.title, { annotation: ITC316.annotation }, async ({ page }) => {
      await openPage(page);
      await page.getByPlaceholder(SEARCH).fill('KHONGTONTAI9999');
      await expect(page.getByText('Không tìm thấy sinh viên nào phù hợp.').first()).toBeVisible();
      await expect(page.getByText(`Hiển thị 0 / ${mine.length} sinh viên`)).toBeVisible();
    });
  });

  // ------------------------------------------------------------------ Phiếu chấm
  test.describe(FN_SHEET, () => {
    test(ITC317.title, { annotation: ITC317.annotation }, async ({ page }) => {
      const a = submitted()[0];
      expect(a, 'Cần ít nhất 1 sinh viên đã nộp phiếu').toBeTruthy();
      await openPage(page);
      // Chọn sinh viên khác trước (nếu có) để chắc chắn bấm chọn gọi lại API phiếu của sinh viên cần xem
      const other = mine.find((x) => x.examinerAssignmentPublicId !== a.examinerAssignmentPublicId);
      if (other) await selectStudent(page, other);
      const res = await selectStudent(page, a);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      const ev = body.data;
      expect(ev.studentCode).toBe(a.studentCode);

      const panel = page.locator('main');
      await expect(panel.getByText(`Đã nộp (${ev.sheet.roundedTotalScore.toFixed(1)}đ)`)).toBeVisible();
      for (const text of [a.studentName, a.studentCode, a.className]) {
        await expect(panel.getByText(text, { exact: true }).last()).toBeVisible();
      }
      await expect(page.getByPlaceholder('Ưu điểm, nhược điểm, mức độ hoàn thiện của đồ án...')).toHaveValue(ev.sheet.generalComment ?? '');
      await expect(page.getByPlaceholder('Câu hỏi phản biện thứ nhất dành cho sinh viên...')).toHaveValue(ev.question1 ?? '');
      await expect(page.getByPlaceholder('Câu hỏi phản biện thứ hai dành cho sinh viên...')).toHaveValue(ev.question2 ?? '');
      const scoreInputs = page.getByRole('table').getByRole('textbox');
      const scores = (ev.sheet.groups ?? []).flatMap((g: any) => g.criteria ?? []).map((c: any) => c.score);
      await expect(scoreInputs).toHaveCount(scores.length);
      for (let i = 0; i < scores.length; i++) await expect(scoreInputs.nth(i)).toHaveValue(String(scores[i]));
    });

    test(ITC318.title, { annotation: ITC318.annotation }, async ({ page }) => {
      const a = unsubmitted()[0];
      expect(a, 'Cần ít nhất 1 sinh viên chưa chấm').toBeTruthy();
      expect(a.gradingOpen, 'Tiền điều kiện: ngoài thời gian chấm phản biện').toBe(false);
      await openPage(page);
      const writes = trackRequests(page, ['PUT', 'PATCH'], (p) => /\/examiner-assignment\/[^/]+\/(evaluation|decision)$/.test(p));
      const res = await selectStudent(page, a);
      expect(res.status()).toBe(200);

      const banner = page.getByText('Phiếu phản biện đang khóa:').locator('..');
      await expect(banner).toContainText('Chỉ chấm từ');
      if (a.gradingCloseAt) await expect(banner).toContainText(`đến trước ${formatDate(a.gradingCloseAt)}`);
      await expect(page.getByPlaceholder('Ưu điểm, nhược điểm, mức độ hoàn thiện của đồ án...')).toBeDisabled();
      await expect(page.getByPlaceholder('Câu hỏi phản biện thứ nhất dành cho sinh viên...')).toBeDisabled();
      await expect(page.getByPlaceholder('Câu hỏi phản biện thứ hai dành cho sinh viên...')).toBeDisabled();
      const approve = page.getByRole('button', { name: 'Đủ điều kiện bảo vệ', exact: true });
      const reject = page.getByRole('button', { name: 'Không đủ điều kiện bảo vệ', exact: true });
      await expect(approve).toBeDisabled();
      await expect(reject).toBeDisabled();
      await approve.click({ force: true });
      expect(writes.sent).toBe(false);
      expect((await eaRow(a.examinerAssignmentPublicId)).review_decision).toBe(a.decision);
    });
  });

  // ------------------------------------------------------------------ Lịch phản biện
  test.describe(FN_SCHEDULE, () => {
    test(ITC319.title, { annotation: ITC319.annotation }, async ({ page }) => {
      const a = mine.find((x) => !x.scheduleOpen);
      expect(a, 'Tiền điều kiện: ngoài khung thời gian xếp lịch').toBeTruthy();
      const before = await eaRow(a!.examinerAssignmentPublicId);
      await openPage(page);
      const puts = trackRequests(page, ['PUT'], (p) => /\/schedule$/.test(p));
      await page.getByRole('button', { name: 'Bảng danh sách' }).click();
      const row = page.getByRole('row').filter({ hasText: a!.studentCode });
      const btn = row.getByRole('button', { name: 'Lịch PB' });
      await expect(btn).toBeDisabled();
      await expect(btn).toHaveAttribute('title', 'Ngoài khung thời gian xếp lịch');
      expect(puts.sent).toBe(false);
      expect(await eaRow(a!.examinerAssignmentPublicId)).toEqual(before);
    });
  });

  // ------------------------------------------------------------------ Xuất phiếu
  test.describe(FN_EXPORT, () => {
    test(ITC320.title, { annotation: ITC320.annotation }, async ({ page }) => {
      const a = submitted()[0];
      expect(a, 'Cần ít nhất 1 sinh viên đã nộp phiếu').toBeTruthy();
      await openPage(page);
      const other = mine.find((x) => x.examinerAssignmentPublicId !== a.examinerAssignmentPublicId);
      if (other) await selectStudent(page, other);
      await selectStudent(page, a);
      const resPromise = page.waitForResponse((r) => r.request().method() === 'GET'
        && path(r).endsWith(`/examiner-assignment/${a.examinerAssignmentPublicId}/evaluation/export`));
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Xuất phiếu chấm (.docx)' }).click();
      const res = await resPromise;
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toContain('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.docx$/);
    });
  });
});

// ------------------------------------------------------------------ Security
test.describe('SecurityTest - Phản biện', () => {
  test.beforeAll(async ({ request }) => {
    await loadContext(request);
  });

  test.describe('Sinh viên', () => {
    test.use({ storageState: '.auth/student.json' });
    test(SEC103.title, { annotation: SEC103.annotation }, async ({ page, request }) => {
      await page.goto(PAGE_URL);
      await expect(page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.')).toBeVisible();
      await expect(page.getByPlaceholder(SEARCH)).toHaveCount(0);
      const student = await token(request, 'STUDENT');
      const res = await apiCall(request, student, 'GET', '/examiner-assignment/my');
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(2001);
      expect(res.body.data ?? null).toBeNull();
    });
  });

  test.describe('Giảng viên phản biện', () => {
    test.use({ storageState: '.auth/head_of_major.json' });
    test(SEC104.title, { annotation: SEC104.annotation }, async ({ request }) => {
      const a = mine.find((x) => x.coExaminer);
      expect(a, 'Cần sinh viên có 2 GVPB').toBeTruthy();
      const otherId = a!.coExaminer!.examinerAssignmentPublicId;
      const before = await eaRow(otherId);
      const t = await token(request, 'HEAD_OF_MAJOR');
      const res = await apiCall(request, t, 'PATCH', `/examiner-assignment/${otherId}/decision`, { data: { decision: 'REJECTED' } });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(3128);
      expect(res.body.message).toBe('Bạn không phải là Giảng viên phản biện được phân công cho sinh viên này');
      expect((await eaRow(otherId)).review_decision).toBe(before.review_decision);
    });
  });

  test.describe('Chưa đăng nhập', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test(SEC105.title, { annotation: SEC105.annotation }, async ({ page, request }) => {
      const a = mine[0];
      const before = await eaRow(a.examinerAssignmentPublicId);
      await page.goto(PAGE_URL);
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByPlaceholder(SEARCH)).toHaveCount(0);
      const res = await request.put(`${getApiBaseUrl()}/examiner-assignment/${a.examinerAssignmentPublicId}/schedule`, {
        data: { reviewDate: '2026-11-26', reviewStartTime: '08:00', reviewEndTime: '09:00', reviewLocation: 'P.301' },
      });
      expect(res.status()).toBe(401);
      expect((await res.json()).code).toBe(2000);
      expect(await eaRow(a.examinerAssignmentPublicId)).toEqual(before);
    });
  });
});
