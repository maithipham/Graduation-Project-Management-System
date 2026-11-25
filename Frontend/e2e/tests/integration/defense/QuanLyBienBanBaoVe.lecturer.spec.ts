import { test, expect, type APIRequestContext, type Locator, type Page, type Response } from '@playwright/test';
import { defineItc, defineItcSec } from '../../../support/integration-test-case';
import { apiCall, getApiBaseUrl, loginByEmail } from '../../../support/api';
import { dbSelect } from '../../../support/db';

// ============================================================================
// ĐẶC TẢ TEST CASE (ITC328..ITC332 & TC-SEC-109..TC-SEC-111)
// Feature: defense | Module/Sheet: QuanLyBienBanBaoVe
// Role: Thư ký hội đồng (tài khoản "Nguyễn Kỹ thuật phần mềm" là Thư ký của "HD KTPM 01")
// Màn hình: "/lecturer/defense/councils/{hội đồng}?tab=grading" (nút "Lập & Nộp biên bản")
//           và "?tab=summary" (cột Biên bản) → hộp thoại "Biên bản bảo vệ".
// Lưu nháp / chốt biên bản thành công tạo bản ghi biên bản không có API xóa, chốt rồi không mở lại được
// → không dọn được. Vì vậy Playwright chỉ chạy các case không ghi dữ liệu (xem, giao diện chặn trước khi gửi,
// "Xem lại"), dữ liệu được đối chiếu bằng DB (SELECT) trước/sau mỗi case. Luồng lưu nháp, chốt thành công,
// BE chặn khi chốt, sửa biên bản đã chốt, Chủ tịch xem / bị chặn ghi chạy ở MockMvc
// (QuanLyBienBanBaoVeIntegrationTest, ITC333–ITC340, TC-SEC-112, tự rollback).
// ============================================================================

const FEATURE = 'defense';
const MODULE = 'QuanLyBienBanBaoVe';
const SHEET = 'QuanLyBienBanBaoVe';

const FN_VIEW = 'Xem biên bản bảo vệ';
const FN_FINALIZE = 'Nộp (chốt) biên bản bảo vệ';

const NEW_CODE = '99B14003';
const NEW_NAME = 'SV3 Test Mới';
const DONE_CODE = '99B14001';
const DONE_NAME = 'SV1 Test Đạt';

const PRE_BASE =
  'Giảng viên "Nguyễn Kỹ thuật phần mềm" (Thư ký) đã đăng nhập. "HD KTPM 01" đã công bố, gồm Chủ tịch "Lê Hoàng Nam", ' +
  'Thư ký "Nguyễn Kỹ thuật phần mềm", Ủy viên "Lê Văn Khoa", "Hoàng Thị Yến", "Lý Thị Thanh Thảo"';
const PRE_NEW = PRE_BASE + '; sinh viên "SV3 Test Mới" (99B14003) đã đạt phản biện, đã xếp ca bảo vệ, chưa có biên bản';
const PRE_DONE = PRE_BASE + '; sinh viên "SV1 Test Đạt" (99B14001) đã hoàn tất bảo vệ, biên bản đã được Thư ký chốt';

const FILL = {
  presentationSummary: 'ITC Sinh viên trình bày kiến trúc hệ thống và demo chức năng chính',
  qaContent: 'ITC Câu hỏi 1: Vì sao chọn Spring Boot? – Trả lời: dễ triển khai',
  councilConclusion: 'ITC Hội đồng đánh giá đồ án đạt yêu cầu',
};

const ITC328 = defineItc({
  id: 'ITC328', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_VIEW,
  description: 'Kiểm tra Thư ký mở biên bản của sinh viên chưa lập biên bản',
  procedure:
    '1. Đăng nhập vai trò Thư ký hội đồng.\n' +
    '2. Mở hội đồng "HD KTPM 01", chọn tab "Chấm điểm".\n' +
    '3. Chọn sinh viên "SV3 Test Mới" (99B14003), bấm "Lập & Nộp biên bản".',
  expected:
    '1. Gọi GET /defense-assignment/{mã phân công của 99B14003}/defense-minutes, HTTP 200, code = 1000; biên bản chưa được lập, được phép chỉnh sửa.\n' +
    '2. Hộp thoại "Biên bản bảo vệ — SV3 Test Mới (99B14003)" hiện dòng "Quyền Thư ký: bạn có thể chỉnh sửa và nộp biên bản sinh viên", ' +
    '3 ô nội dung trống, có nút "Lưu nháp" và "Nộp biên bản".\n' +
    '3. Dữ liệu: sinh viên 99B14003 vẫn chưa có biên bản.',
  precondition: PRE_NEW,
});

const ITC329 = defineItc({
  id: 'ITC329', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_VIEW,
  description: 'Kiểm tra Thư ký xem biên bản đã chốt của sinh viên đã hoàn tất bảo vệ',
  procedure:
    '1. Đăng nhập vai trò Thư ký hội đồng.\n' +
    '2. Mở hội đồng "HD KTPM 01", chọn tab "Tổng hợp".\n' +
    '3. Trên dòng "SV1 Test Đạt" (99B14001), bấm "Đã nộp" ở cột Biên bản.',
  expected:
    '1. Gọi GET /defense-assignment/{mã phân công của 99B14001}/defense-minutes, HTTP 200, code = 1000; biên bản ở trạng thái đã chốt, không được chỉnh sửa.\n' +
    '2. Hộp thoại hiện "Biên bản đã nộp chính thức bởi Nguyễn Kỹ thuật phần mềm." và nhãn "Đã nộp"; ' +
    'nội dung trình bày, hỏi đáp, kết luận đúng như đã lưu và chỉ đọc; không có nút "Lưu nháp", "Nộp biên bản".\n' +
    '3. Dữ liệu: biên bản của 99B14001 vẫn ở trạng thái đã chốt.',
  precondition: PRE_DONE,
});

const ITC330 = defineItc({
  id: 'ITC330', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_FINALIZE,
  description: 'Kiểm tra nộp biên bản khi chưa nhập nội dung nào',
  procedure:
    '1. Đăng nhập vai trò Thư ký hội đồng, mở biên bản của "SV3 Test Mới" (99B14003) từ tab "Chấm điểm".\n' +
    '2. Để trống mọi ô, không chọn có/không yêu cầu chỉnh sửa.\n3. Bấm "Nộp biên bản".',
  expected:
    '1. Hiện lỗi "Vui lòng nhập nội dung bảo vệ đồ án", "Vui lòng nhập phần trả lời câu hỏi", "Vui lòng nhập kết luận của Hội đồng", ' +
    '"Vui lòng chọn có hay không yêu cầu chỉnh sửa báo cáo"; không hiện hộp thoại xác nhận.\n' +
    '2. Không gọi PUT /defense-assignment/{mã phân công}/defense-minutes và PATCH /defense-assignment/{mã phân công}/defense-minutes/finalize.\n' +
    '3. Dữ liệu: sinh viên 99B14003 vẫn chưa có biên bản.',
  precondition: PRE_NEW,
});

const ITC331 = defineItc({
  id: 'ITC331', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_FINALIZE,
  description: 'Kiểm tra nộp biên bản khi chọn có yêu cầu chỉnh sửa nhưng không nhập nội dung yêu cầu',
  procedure:
    '1. Đăng nhập vai trò Thư ký hội đồng, mở biên bản của "SV3 Test Mới" (99B14003) từ tab "Chấm điểm".\n' +
    `2. Nhập Nội dung bảo vệ "${FILL.presentationSummary}", Phần trả lời câu hỏi "${FILL.qaContent}", Kết luận "${FILL.councilConclusion}".\n` +
    '3. Chọn "Có – sinh viên phải nộp lại báo cáo cuối cùng", để trống nội dung yêu cầu chỉnh sửa.\n4. Bấm "Nộp biên bản".',
  expected:
    '1. Hiện lỗi "Vui lòng nhập nội dung Hội đồng yêu cầu chỉnh sửa"; không hiện lỗi ở 3 ô đã nhập; không hiện hộp thoại xác nhận.\n' +
    '2. Không gọi PUT /defense-assignment/{mã phân công}/defense-minutes và PATCH /defense-assignment/{mã phân công}/defense-minutes/finalize.\n' +
    '3. Dữ liệu: sinh viên 99B14003 vẫn chưa có biên bản.',
  precondition: PRE_NEW,
});

const ITC332 = defineItc({
  id: 'ITC332', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_FINALIZE,
  description: 'Kiểm tra bấm "Xem lại" ở hộp thoại xác nhận nộp biên bản',
  procedure:
    '1. Đăng nhập vai trò Thư ký hội đồng, mở biên bản của "SV3 Test Mới" (99B14003) từ tab "Chấm điểm".\n' +
    `2. Nhập Nội dung bảo vệ "${FILL.presentationSummary}", Phần trả lời câu hỏi "${FILL.qaContent}", Kết luận "${FILL.councilConclusion}", chọn "Không".\n` +
    '3. Bấm "Nộp biên bản", rồi bấm "Xem lại" ở hộp thoại xác nhận.',
  expected:
    '1. Hiện hộp thoại "Xác nhận nộp biên bản" cho "SV3 Test Mới".\n' +
    '2. Sau khi bấm "Xem lại": hộp thoại xác nhận đóng, biên bản vẫn mở với nội dung đã nhập.\n' +
    '3. Không gọi PUT /defense-assignment/{mã phân công}/defense-minutes và PATCH /defense-assignment/{mã phân công}/defense-minutes/finalize.\n' +
    '4. Dữ liệu: sinh viên 99B14003 vẫn chưa có biên bản.',
  precondition: PRE_NEW,
});

const SEC109 = defineItcSec({
  id: 'TC-SEC-109', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Sinh viên mở màn hình chấm điểm Hội đồng và gọi API lưu biên bản bảo vệ',
  roleSession: 'Sinh viên (STUDENT), đã đăng nhập',
  technique: 'EP',
  given: 'Đăng nhập bằng tài khoản Sinh viên',
  when: 'Mở thẳng /lecturer/defense/councils/{mã HD KTPM 01}?tab=grading; gọi PUT /defense-assignment/{mã phân công của 99B14003}/defense-minutes bằng phiên Sinh viên',
  then: 'Màn hình hiển thị "Tài khoản của bạn không có quyền truy cập cổng cán bộ."; PUT trả HTTP 403, code = 2001; sinh viên 99B14003 vẫn chưa có biên bản',
});

const SEC110 = defineItcSec({
  id: 'TC-SEC-110', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Chưa đăng nhập mở màn hình chấm điểm Hội đồng và gọi API chốt biên bản bảo vệ',
  roleSession: 'Chưa đăng nhập (không có cookie phiên)',
  technique: 'EP',
  given: 'Trình duyệt chưa đăng nhập',
  when: 'Mở thẳng /lecturer/defense/councils/{mã HD KTPM 01}?tab=grading; gọi PATCH /defense-assignment/{mã phân công của 99B14003}/defense-minutes/finalize không kèm phiên đăng nhập',
  then: 'Bị chuyển về trang đăng nhập (/login); PATCH trả HTTP 401, code = 2000; sinh viên 99B14003 vẫn chưa có biên bản',
});

const SEC111 = defineItcSec({
  id: 'TC-SEC-111', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Giảng viên không thuộc Hội đồng mở Hội đồng và gọi API lưu biên bản bảo vệ',
  roleSession: 'Giảng viên hướng dẫn (SUPERVISOR) không là thành viên "HD KTPM 01", đã đăng nhập',
  technique: 'EP',
  given: 'Đăng nhập bằng tài khoản giảng viên không thuộc "HD KTPM 01"',
  when: 'Mở thẳng /lecturer/defense/councils/{mã HD KTPM 01}?tab=grading; gọi PUT /defense-assignment/{mã phân công của 99B14003}/defense-minutes bằng phiên giảng viên đó',
  then: 'Màn hình hiển thị "Không tìm thấy thông tin hội đồng hoặc bạn không có quyền xem thông tin hội đồng này."; ' +
    'PUT trả HTTP 403, code = 3120, message "Bạn không phải là thành viên của Hội đồng này"; sinh viên 99B14003 vẫn chưa có biên bản',
});

// ============================================================================
// HÀM HỖ TRỢ
// ============================================================================

let councilId = '';
const assignmentIds: Record<string, string> = {};

const token = (request: APIRequestContext, role: 'SECRETARY' | 'STUDENT' | 'CHAIRPERSON') => {
  const email = process.env[`E2E_EMAIL_${role}`];
  if (!email) throw new Error(`Chưa cấu hình E2E_EMAIL_${role} trong .env.e2e`);
  return loginByEmail(request, email);
};

// Biên bản của sinh viên, đọc thẳng DB (API chỉ trả cho thành viên Hội đồng)
async function minutesOf(studentCode: string) {
  return dbSelect<{ status: string; presentation_summary: string | null }>(
    `SELECT dm.status, dm.presentation_summary
       FROM defense_minutes dm
       JOIN defense_assignment d ON d.id = dm.defense_assignment_id
       JOIN thesis_topic tt ON tt.id = d.thesis_topic_id JOIN student s ON s.id = tt.student_id
      WHERE s.student_code = ?`, [studentCode]);
}

const minutesPath = (code: string) => `/defense-assignment/${assignmentIds[code]}/defense-minutes`;
const isGetMinutes = (code: string) => (r: Response) =>
  r.request().method() === 'GET' && new URL(r.url()).pathname.endsWith(minutesPath(code));

function trackWrites(page: Page) {
  const s = { hit: false };
  page.on('request', (r) => {
    if (['PUT', 'PATCH'].includes(r.method()) && /\/defense-minutes(\/finalize)?$/.test(new URL(r.url()).pathname)) s.hit = true;
  });
  return s;
}

const minutesDialog = (page: Page) => page.getByRole('dialog').filter({ hasText: 'BIÊN BẢN BẢO VỆ ĐỒ ÁN TỐT NGHIỆP' });
const field = (dialog: Locator, label: string) =>
  dialog.locator(`b:text-is("${label}") + textarea`);

// Mở tab "Chấm điểm", chọn sinh viên, bấm "Lập & Nộp biên bản"
async function openFromGrading(page: Page, code: string, name: string) {
  await page.goto(`/lecturer/defense/councils/${councilId}?tab=grading`);
  await page.getByRole('button', { name: new RegExp(name) }).filter({ hasText: code }).click();
  const resPromise = page.waitForResponse(isGetMinutes(code));
  await page.getByRole('button', { name: 'Lập & Nộp biên bản' }).click();
  const res = await resPromise;
  const dialog = minutesDialog(page);
  await expect(dialog).toBeVisible();
  return { res, dialog };
}

async function fillContent(dialog: Locator) {
  await field(dialog, 'Nội dung bảo vệ đồ án:').fill(FILL.presentationSummary);
  await field(dialog, 'Phần trả lời câu hỏi:').fill(FILL.qaContent);
  await field(dialog, 'Kết luận của Hội đồng:').fill(FILL.councilConclusion);
}

// ============================================================================
// TEST
// ============================================================================

test.beforeAll(async ({ request }) => {
  const sec = await token(request, 'SECRETARY');
  const my = await apiCall(request, sec, 'GET', '/defense-council/my');
  const c = my.body.data.find((x: any) => x.name === 'HD KTPM 01');
  councilId = c.councilPublicId;
  expect(c.myRole, 'Tiền điều kiện: tài khoản Thư ký là Thư ký HD KTPM 01').toBe('SECRETARY');
  const board = (await apiCall(request, sec, 'GET', `/defense-council/${councilId}/council-evaluation`)).body.data;
  for (const s of board.students) assignmentIds[s.studentCode] = s.defenseAssignmentPublicId;
  expect(assignmentIds[NEW_CODE], 'Tiền điều kiện: 99B14003 có trong danh sách chấm').toBeTruthy();
  expect(await minutesOf(NEW_CODE), 'Tiền điều kiện: 99B14003 chưa có biên bản').toHaveLength(0);
  expect((await minutesOf(DONE_CODE))[0]?.status, 'Tiền điều kiện: biên bản 99B14001 đã chốt').toBe('FINALIZED');
});

test.describe('Quản lý biên bản bảo vệ (Thư ký hội đồng)', () => {
  test.use({ storageState: '.auth/secretary.json' });

  test.describe(FN_VIEW, () => {
    test(ITC328.title, { annotation: ITC328.annotation }, async ({ page }) => {
      const { res, dialog } = await openFromGrading(page, NEW_CODE, NEW_NAME);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.data).toMatchObject({ studentCode: NEW_CODE, minutesPublicId: null, editable: true });

      await expect(page.getByRole('heading', { name: `Biên bản bảo vệ — ${NEW_NAME} (${NEW_CODE})` })).toBeVisible();
      await expect(dialog.getByText('Quyền Thư ký: bạn có thể chỉnh sửa và nộp biên bản sinh viên')).toBeVisible();
      await expect(field(dialog, 'Nội dung bảo vệ đồ án:')).toHaveValue('');
      await expect(field(dialog, 'Phần trả lời câu hỏi:')).toHaveValue('');
      await expect(field(dialog, 'Kết luận của Hội đồng:')).toHaveValue('');
      await expect(dialog.getByRole('button', { name: 'Lưu nháp' })).toBeVisible();
      await expect(dialog.getByRole('button', { name: 'Nộp biên bản' })).toBeVisible();
      expect(await minutesOf(NEW_CODE)).toHaveLength(0);
    });

    test(ITC329.title, { annotation: ITC329.annotation }, async ({ page }) => {
      await page.goto(`/lecturer/defense/councils/${councilId}?tab=summary`);
      const row = page.getByRole('row').filter({ hasText: DONE_CODE });
      const resPromise = page.waitForResponse(isGetMinutes(DONE_CODE));
      await row.getByRole('button', { name: 'Đã nộp' }).click();
      const res = await resPromise;
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.data).toMatchObject({ studentCode: DONE_CODE, status: 'FINALIZED', editable: false });

      const dialog = minutesDialog(page);
      await expect(page.getByRole('heading', { name: `Biên bản bảo vệ — ${DONE_NAME} (${DONE_CODE})` })).toBeVisible();
      await expect(dialog.getByText('Biên bản đã nộp chính thức bởi Nguyễn Kỹ thuật phần mềm.')).toBeVisible();
      await expect(dialog.getByText('Đã nộp', { exact: true })).toBeVisible();
      const summary = field(dialog, 'Nội dung bảo vệ đồ án:');
      await expect(summary).toHaveValue(body.data.presentationSummary);
      await expect(summary).toHaveAttribute('readonly', '');
      await expect(field(dialog, 'Phần trả lời câu hỏi:')).toHaveValue(body.data.qaContent);
      await expect(field(dialog, 'Kết luận của Hội đồng:')).toHaveValue(body.data.councilConclusion);
      await expect(dialog.getByRole('button', { name: 'Lưu nháp' })).toHaveCount(0);
      await expect(dialog.getByRole('button', { name: 'Nộp biên bản' })).toHaveCount(0);
      const db = await minutesOf(DONE_CODE);
      expect(db[0].status).toBe('FINALIZED');
      expect(db[0].presentation_summary).toBe(body.data.presentationSummary);
    });
  });

  test.describe(FN_FINALIZE, () => {
    test(ITC330.title, { annotation: ITC330.annotation }, async ({ page }) => {
      const { dialog } = await openFromGrading(page, NEW_CODE, NEW_NAME);
      const writes = trackWrites(page);
      await dialog.getByRole('button', { name: 'Nộp biên bản' }).click();
      for (const msg of ['Vui lòng nhập nội dung bảo vệ đồ án', 'Vui lòng nhập phần trả lời câu hỏi',
        'Vui lòng nhập kết luận của Hội đồng', 'Vui lòng chọn có hay không yêu cầu chỉnh sửa báo cáo']) {
        await expect(dialog.getByText(msg, { exact: true })).toBeVisible();
      }
      await expect(page.getByRole('heading', { name: 'Xác nhận nộp biên bản' })).toHaveCount(0);
      expect(writes.hit).toBe(false);
      expect(await minutesOf(NEW_CODE)).toHaveLength(0);
    });

    test(ITC331.title, { annotation: ITC331.annotation }, async ({ page }) => {
      const { dialog } = await openFromGrading(page, NEW_CODE, NEW_NAME);
      const writes = trackWrites(page);
      await fillContent(dialog);
      await dialog.getByLabel('Có – sinh viên phải nộp lại báo cáo cuối cùng').check();
      await dialog.getByRole('button', { name: 'Nộp biên bản' }).click();
      await expect(dialog.getByText('Vui lòng nhập nội dung Hội đồng yêu cầu chỉnh sửa', { exact: true })).toBeVisible();
      for (const msg of ['Vui lòng nhập nội dung bảo vệ đồ án', 'Vui lòng nhập phần trả lời câu hỏi',
        'Vui lòng nhập kết luận của Hội đồng', 'Vui lòng chọn có hay không yêu cầu chỉnh sửa báo cáo']) {
        await expect(dialog.getByText(msg, { exact: true })).toHaveCount(0);
      }
      await expect(page.getByRole('heading', { name: 'Xác nhận nộp biên bản' })).toHaveCount(0);
      expect(writes.hit).toBe(false);
      expect(await minutesOf(NEW_CODE)).toHaveLength(0);
    });

    test(ITC332.title, { annotation: ITC332.annotation }, async ({ page }) => {
      const { dialog } = await openFromGrading(page, NEW_CODE, NEW_NAME);
      const writes = trackWrites(page);
      await fillContent(dialog);
      await dialog.getByLabel('Không', { exact: true }).check();
      await dialog.getByRole('button', { name: 'Nộp biên bản' }).click();
      // Hộp thoại xác nhận lồng trong hộp thoại biên bản: lấy dialog có tiêu đề xác nhận, không chứa mẫu biên bản
      const confirm = page.getByRole('dialog')
        .filter({ has: page.getByRole('heading', { name: 'Xác nhận nộp biên bản' }) })
        .filter({ hasNotText: 'BIÊN BẢN BẢO VỆ ĐỒ ÁN TỐT NGHIỆP' });
      await expect(confirm).toBeVisible();
      await expect(confirm).toContainText(`Nộp biên bản bảo vệ chính thức cho ${NEW_NAME}`);
      await confirm.getByRole('button', { name: 'Xem lại' }).click();
      await expect(confirm).toHaveCount(0);
      await expect(dialog).toBeVisible();
      await expect(field(dialog, 'Nội dung bảo vệ đồ án:')).toHaveValue(FILL.presentationSummary);
      await expect(field(dialog, 'Kết luận của Hội đồng:')).toHaveValue(FILL.councilConclusion);
      expect(writes.hit).toBe(false);
      expect(await minutesOf(NEW_CODE)).toHaveLength(0);
    });
  });
});

test.describe('SecurityTest - Quản lý biên bản bảo vệ', () => {
  const draftBody = () => ({ ...FILL, revisionRequired: false, revisionRequirement: null });
  const gradingUrl = () => `/lecturer/defense/councils/${councilId}?tab=grading`;

  test.describe('Sinh viên', () => {
    test.use({ storageState: '.auth/student.json' });
    test(SEC109.title, { annotation: SEC109.annotation }, async ({ page, request }) => {
      await page.goto(gradingUrl());
      await expect(page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Lập & Nộp biên bản' })).toHaveCount(0);
      const st = await token(request, 'STUDENT');
      const res = await apiCall(request, st, 'PUT', minutesPath(NEW_CODE), { data: draftBody() });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(2001);
      expect(await minutesOf(NEW_CODE)).toHaveLength(0);
    });
  });

  test.describe('Chưa đăng nhập', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test(SEC110.title, { annotation: SEC110.annotation }, async ({ page, request }) => {
      await page.goto(gradingUrl());
      await expect(page).toHaveURL(/\/login/);
      const res = await request.patch(`${getApiBaseUrl()}${minutesPath(NEW_CODE)}/finalize`);
      expect(res.status()).toBe(401);
      expect((await res.json()).code).toBe(2000);
      expect(await minutesOf(NEW_CODE)).toHaveLength(0);
    });
  });

  test.describe('Giảng viên không thuộc Hội đồng', () => {
    // Tài khoản E2E_EMAIL_CHAIRPERSON hiện chỉ là GVHD, không thuộc HD KTPM 01
    test.use({ storageState: '.auth/chairperson.json' });
    test(SEC111.title, { annotation: SEC111.annotation }, async ({ page, request }) => {
      await page.goto(gradingUrl());
      await expect(page.getByText('Không tìm thấy thông tin hội đồng hoặc bạn không có quyền xem thông tin hội đồng này.')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Lập & Nộp biên bản' })).toHaveCount(0);
      const outsider = await token(request, 'CHAIRPERSON');
      const res = await apiCall(request, outsider, 'PUT', minutesPath(NEW_CODE), { data: draftBody() });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(3120);
      expect(res.body.message).toBe('Bạn không phải là thành viên của Hội đồng này');
      expect(await minutesOf(NEW_CODE)).toHaveLength(0);
    });
  });
});
