import { test, expect, type APIRequestContext, type Page, type Response } from '@playwright/test';
import { defineItc, defineItcSec } from '../../../support/integration-test-case';
import { apiCall, getApiBaseUrl, loginByEmail } from '../../../support/api';
import { dbSelect } from '../../../support/db';

// ============================================================================
// ĐẶC TẢ TEST CASE (ITC306..ITC312 & TC-SEC-065, TC-SEC-102)
// Feature: outline | Module/Sheet: PhanCongGVNX
// Role: Trưởng bộ môn (HEAD_OF_MAJOR) — màn hình "/department/reviewers" (Phân công GV nhận xét)
//
// Dữ liệu: dùng dữ liệu phân công GVNX đang có của học kỳ hiện tại, KHÔNG làm thay đổi dữ liệu:
// - Case phân công thành công gán lại đúng GVNX hiện tại cho 1 sinh viên (giữ nguyên người nhận xét,
//   không cấp / thu hồi role mới) → DB không đổi, kiểm tra lại bằng SELECT.
// - Case lỗi bị BE / giao diện chặn trước khi ghi.
// Không có case đổi sang GVNX khác / chia đều thật: không có API hoàn tác (thu hồi role, đề cương mới).
// ============================================================================

const FEATURE = 'outline';
const MODULE = 'PhanCongGVNX';
const SHEET = 'PhanCongGVNX';
const PAGE_URL = '/department/reviewers';
const STUDENT_SEARCH = 'Tìm theo MSSV, tên SV, đề tài...';

const FN_VIEW = 'Xem danh sách phân công GVNX';
const FN_MANUAL = 'Phân công GVNX thủ công';

const PRE_TBM = 'Trưởng bộ môn ngành Kỹ thuật phần mềm đã đăng nhập; học kỳ hiện tại có sinh viên đã được phân công GVHD và GV nhận xét';

const ITC306 = defineItc({
  id: 'ITC306', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_VIEW,
  description: 'Kiểm tra mở màn hình Phân công GV nhận xét hiển thị số sinh viên theo trạng thái phân công',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn.\n2. Mở màn hình "Phân công GV nhận xét" (/department/reviewers).',
  expected:
    '1. Gọi GET /api/v1/assignments/commenting-lecturers/students với học kỳ hiện tại, trạng thái ALL; HTTP 200, code = 1000, message "Lấy danh sách sinh viên phân công thành công".\n' +
    '2. Gọi GET /api/v1/assignments/commenting-lecturers với học kỳ hiện tại; HTTP 200, code = 1000, message "Lấy danh sách giảng viên nhận xét thành công".\n' +
    '3. Các tab "Tất cả", "Chưa phân công", "Đã phân công" hiển thị đúng số sinh viên tương ứng; nút "Phân công nhanh (Chia đều)" chỉ bật khi còn sinh viên chưa phân công.\n' +
    '4. Bảng giảng viên bên phải liệt kê đủ giảng viên nhận xét trả về.',
  precondition: PRE_TBM,
});

const ITC307 = defineItc({
  id: 'ITC307', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_VIEW,
  description: 'Kiểm tra tìm sinh viên theo MSSV hiển thị GVHD và GV nhận xét của sinh viên',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Phân công GV nhận xét".\n2. Nhập MSSV của một sinh viên vào ô "Tìm theo MSSV, tên SV, đề tài...".',
  expected: '1. Không gọi lại API.\n2. Bảng chỉ còn 1 dòng của sinh viên có MSSV đã nhập, hiển thị đúng tên sinh viên, GVHD và GV nhận xét.',
  precondition: PRE_TBM,
});

const ITC308 = defineItc({
  id: 'ITC308', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_VIEW,
  description: 'Kiểm tra tìm sinh viên với từ khóa không khớp sinh viên nào',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Phân công GV nhận xét".\n2. Nhập "KHONGTONTAI9999" vào ô tìm kiếm sinh viên.',
  expected: '1. Bảng sinh viên hiển thị "Không tìm thấy sinh viên nào phù hợp".',
  precondition: PRE_TBM,
});

const ITC309 = defineItc({
  id: 'ITC309', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_MANUAL,
  description: 'Kiểm tra giao diện chặn phân công GV nhận xét trùng với GVHD của sinh viên',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Phân công GV nhận xét".\n' +
    '2. Tích chọn một sinh viên.\n3. Ở bảng giảng viên, chọn đúng giảng viên đang là GVHD của sinh viên đó.',
  expected:
    '1. Nút "Gán (1 SV)" bị khóa với chú thích "Không thể gán: Trùng với GVHD của sinh viên đang chọn".\n' +
    '2. Không gọi POST /api/v1/assignments/commenting-lecturers/manual.',
  precondition: PRE_TBM + '; GVHD của sinh viên có trong danh sách giảng viên nhận xét',
});

const ITC310 = defineItc({
  id: 'ITC310', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_MANUAL,
  description: 'Kiểm tra phân công lại đúng GV nhận xét hiện tại cho sinh viên',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Phân công GV nhận xét".\n' +
    '2. Tích chọn một sinh viên có đề tài đang thực hiện, đã có GV nhận xét.\n' +
    '3. Chọn đúng giảng viên đang là GV nhận xét của sinh viên đó, bấm "Gán (1 SV)".',
  expected:
    '1. Gọi POST /api/v1/assignments/commenting-lecturers/manual với mã giảng viên đã chọn và mã đề tài của sinh viên; HTTP 200, code = 1000, message "Phân công giảng viên nhận xét thành công".\n' +
    '2. Hiện thông báo "Đã phân công thành công 1 sinh viên cho <tên giảng viên>"; dòng sinh viên vẫn hiển thị GV nhận xét đó.\n' +
    '3. Dữ liệu: GV nhận xét của sinh viên không đổi.',
  precondition: PRE_TBM + '; có sinh viên có đề tài đang thực hiện, đã chốt tên đề tài và đã có GV nhận xét',
});

const ITC311 = defineItc({
  id: 'ITC311', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_MANUAL,
  description: 'Kiểm tra phân công GV nhận xét cho sinh viên có đề tài đã bị loại',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Phân công GV nhận xét".\n' +
    '2. Tích chọn một sinh viên có đề tài đã bị loại (không còn đang thực hiện).\n' +
    '3. Chọn một giảng viên khác GVHD và khác GV nhận xét hiện tại của sinh viên, bấm "Gán (1 SV)".',
  expected:
    '1. Gọi POST /api/v1/assignments/commenting-lecturers/manual; HTTP 409, code = 3057, message "Đề tài không ở trạng thái đang thực hiện".\n' +
    '2. Hiện thông báo lỗi đúng message trên; dòng sinh viên vẫn hiển thị GV nhận xét cũ.\n' +
    '3. Dữ liệu: GV nhận xét của sinh viên không đổi.',
  precondition: PRE_TBM + '; có sinh viên có đề tài đã bị loại nhưng đã có GV nhận xét',
});

const ITC312 = defineItc({
  id: 'ITC312', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_MANUAL,
  description: 'Kiểm tra giao diện chặn bấm Gán khi chưa tích chọn sinh viên',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Phân công GV nhận xét".\n2. Không tích chọn sinh viên nào, chọn một giảng viên ở bảng bên phải.',
  expected:
    '1. Nút "Gán (0 SV)" bị khóa với chú thích "Tích chọn sinh viên ở bảng bên trái trước khi gán".\n' +
    '2. Không gọi POST /api/v1/assignments/commenting-lecturers/manual.',
  precondition: PRE_TBM,
});

const SEC065 = defineItcSec({
  id: 'TC-SEC-065', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Sinh viên mở màn hình Phân công GV nhận xét và gọi API phân công GV nhận xét',
  roleSession: 'Sinh viên (STUDENT), đã đăng nhập',
  technique: 'EP',
  given: 'Đăng nhập bằng tài khoản Sinh viên',
  when: 'Mở thẳng /department/reviewers; gọi POST /api/v1/assignments/commenting-lecturers/manual (đổi GV nhận xét của 1 sinh viên) bằng phiên Sinh viên',
  then: 'Màn hình hiển thị "Tài khoản của bạn không có quyền truy cập cổng cán bộ."; POST trả HTTP 403, code = 2001; GV nhận xét của sinh viên không đổi',
});

const SEC102 = defineItcSec({
  id: 'TC-SEC-102', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Chưa đăng nhập mở màn hình Phân công GV nhận xét và gọi API phân công nhanh (chia đều)',
  roleSession: 'Chưa đăng nhập (không có cookie phiên)',
  technique: 'EP',
  given: 'Trình duyệt chưa đăng nhập',
  when: 'Mở thẳng /department/reviewers; gọi POST /api/v1/assignments/commenting-lecturers/auto-distribute (không xem trước) không kèm phiên đăng nhập',
  then: 'Bị chuyển về trang đăng nhập (/login); POST trả HTTP 401, code = 2000; số đề cương đã có GV nhận xét trong học kỳ không đổi',
});

// ============================================================================
// DỮ LIỆU & HÀM HỖ TRỢ (API để lấy dữ liệu, DB chỉ SELECT)
// ============================================================================

type StudentDto = {
  studentId: number; studentCode: string; studentName: string; topicId: number; topicStatus: string; currentStage: string;
  supervisorId: number | null; supervisorName: string | null; coSupervisorId: number | null;
  commentingLecturerId: number | null; commentingLecturerName: string | null;
};
type LecturerDto = { id: number; publicId: string; fullName: string; title: string | null; organization: string; department: string };

const ELIGIBLE_STAGES = ['STAGE_2_TOPIC_CONFIRMED', 'STAGE_3_OUTLINE_APPROVED', 'STAGE_4_REPORT_APPROVED', 'STAGE_5_REVIEW_PASSED', 'STAGE_6_DEFENSE_COMPLETED'];

function requireEmail(role: string): string {
  const email = process.env[`E2E_EMAIL_${role}`];
  if (!email) throw new Error(`Chưa cấu hình E2E_EMAIL_${role} trong .env.e2e`);
  return email;
}
const token = (request: APIRequestContext, role: 'HEAD_OF_MAJOR' | 'STUDENT') => loginByEmail(request, requireEmail(role));

type Ctx = { semesterPublicId: string; semesterId: number; students: StudentDto[]; lecturers: LecturerDto[] };
let ctx: Ctx;

async function loadContext(request: APIRequestContext): Promise<Ctx> {
  const hom = await token(request, 'HEAD_OF_MAJOR');
  const cur = await apiCall(request, hom, 'GET', '/semester/current');
  const semesterPublicId: string = cur.body?.data?.publicId ?? cur.body?.data?.id;
  expect(semesterPublicId, 'Không lấy được học kỳ hiện tại').toBeTruthy();
  const st = await apiCall(request, hom, 'GET', '/api/v1/assignments/commenting-lecturers/students', { params: { semesterId: semesterPublicId, status: 'ALL' } });
  const cl = await apiCall(request, hom, 'GET', '/api/v1/assignments/commenting-lecturers', { params: { semesterId: semesterPublicId } });
  const [sem] = await dbSelect<{ id: number }>(`SELECT id FROM semester WHERE name = ?`, [cur.body.data.name]);
  return { semesterPublicId, semesterId: sem.id, students: st.body.data, lecturers: cl.body.data };
}

/** GV nhận xét hiện tại của đề tài (đọc thẳng DB vì API không trả mã giảng viên nội bộ theo đề tài) */
async function reviewerOf(topicId: number) {
  const rows = await dbSelect<{ reviewer: number | null }>(
    `SELECT commenting_lecture_id AS reviewer FROM thesis_outline WHERE thesis_topic_id = ?`, [topicId]);
  return rows[0]?.reviewer ?? null;
}

async function reviewedCount(semesterId: number) {
  const [r] = await dbSelect<{ n: number }>(
    `SELECT COUNT(*) AS n FROM thesis_outline o JOIN thesis_topic t ON t.id = o.thesis_topic_id
      WHERE t.semester_id = ? AND o.commenting_lecture_id IS NOT NULL`, [semesterId]);
  return Number(r.n);
}

const displayName = (l: LecturerDto) => (l.title && !l.fullName.startsWith(l.title) ? `${l.title} ${l.fullName}` : l.fullName);
const lecturerById = (id: number | null) => ctx.lecturers.find((l) => l.id === id);
const isAssigned = (s: StudentDto) => s.commentingLecturerId != null && s.commentingLecturerId !== 0;
const isEligible = (s: StudentDto) => isAssigned(s) || (s.topicStatus === 'IN_PROGRESS' && ELIGIBLE_STAGES.includes(s.currentStage));
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const radioOf = (page: Page, name: string) => page.getByRole('radio', { name: new RegExp('^' + escapeRe(name) + '\\b') });
const rowOf = (page: Page, code: string) => page.getByRole('row').filter({ hasText: `(${code})` });
const alertWith = (page: Page, text: string | RegExp) => page.getByRole('alert').filter({ hasText: text });
const path = (r: Response) => new URL(r.url()).pathname;
const isManual = (r: Response) => r.request().method() === 'POST' && path(r).endsWith('/commenting-lecturers/manual');

function trackRequests(page: Page, method: string, test: (pathname: string) => boolean) {
  const state = { sent: false };
  page.on('request', (r) => { if (r.method() === method && test(new URL(r.url()).pathname)) state.sent = true; });
  return state;
}

/** Hiển thị đủ giảng viên (tab "Tất cả") để chọn được bất kỳ ai */
async function showAllLecturers(page: Page) {
  await page.getByRole('button', { name: 'Tất cả', exact: true }).click();
}

async function openPage(page: Page) {
  const studentsPromise = page.waitForResponse((r) => r.request().method() === 'GET' && path(r).endsWith('/commenting-lecturers/students'));
  const lecturersPromise = page.waitForResponse((r) => r.request().method() === 'GET' && path(r).endsWith('/commenting-lecturers'));
  await page.goto(PAGE_URL);
  const [studentsRes, lecturersRes] = await Promise.all([studentsPromise, lecturersPromise]);
  await expect(page.getByRole('button', { name: /^Tất cả \(/ })).toBeVisible();
  return { studentsRes, lecturersRes };
}

// ============================================================================
// TEST
// ============================================================================

test.describe('Phân công GV nhận xét (Trưởng bộ môn)', () => {
  test.use({ storageState: '.auth/head_of_major.json' });

  test.beforeAll(async ({ request }) => {
    ctx = await loadContext(request);
  });

  // ------------------------------------------------------------------ Xem danh sách
  test.describe(FN_VIEW, () => {
    test(ITC306.title, { annotation: ITC306.annotation }, async ({ page }) => {
      const { studentsRes, lecturersRes } = await openPage(page);
      const su = new URL(studentsRes.url());
      expect(su.searchParams.get('semesterId')).toBe(ctx.semesterPublicId);
      expect(su.searchParams.get('status')).toBe('ALL');
      expect(studentsRes.status()).toBe(200);
      const sBody = await studentsRes.json();
      expect(sBody.code).toBe(1000);
      expect(sBody.message).toBe('Lấy danh sách sinh viên phân công thành công');
      expect(new URL(lecturersRes.url()).searchParams.get('semesterId')).toBe(ctx.semesterPublicId);
      expect(lecturersRes.status()).toBe(200);
      const lBody = await lecturersRes.json();
      expect(lBody.code).toBe(1000);
      expect(lBody.message).toBe('Lấy danh sách giảng viên nhận xét thành công');

      const eligible = (sBody.data as StudentDto[]).filter(isEligible);
      const assigned = eligible.filter(isAssigned).length;
      const unassigned = eligible.length - assigned;
      await expect(page.getByRole('button', { name: `Tất cả (${eligible.length})` })).toBeVisible();
      await expect(page.getByRole('button', { name: `Chưa phân công (${unassigned})` })).toBeVisible();
      await expect(page.getByRole('button', { name: `Đã phân công (${assigned})` })).toBeVisible();
      const quick = page.getByRole('button', { name: 'Phân công nhanh (Chia đều)' });
      if (unassigned === 0) await expect(quick).toBeDisabled(); else await expect(quick).toBeEnabled();

      await showAllLecturers(page);
      for (const l of lBody.data as LecturerDto[]) {
        await expect(radioOf(page, displayName(l))).toHaveCount(1);
      }
    });

    test(ITC307.title, { annotation: ITC307.annotation }, async ({ page }) => {
      const s = ctx.students.find((x) => isEligible(x) && isAssigned(x) && x.supervisorName)!;
      await openPage(page);
      const calls = trackRequests(page, 'GET', (p) => /commenting-lecturers/.test(p));
      await page.getByPlaceholder(STUDENT_SEARCH).fill(s.studentCode);
      const rows = page.getByRole('row').filter({ hasText: /\([0-9][0-9A-Z]*\)/ });
      await expect(rows).toHaveCount(1);
      await expect(rows.first()).toContainText(s.studentName);
      await expect(rows.first()).toContainText(`(${s.studentCode})`);
      await expect(rows.first()).toContainText(s.supervisorName!);
      await expect(rows.first()).toContainText(s.commentingLecturerName!);
      expect(calls.sent).toBe(false);
    });

    test(ITC308.title, { annotation: ITC308.annotation }, async ({ page }) => {
      await openPage(page);
      await page.getByPlaceholder(STUDENT_SEARCH).fill('KHONGTONTAI9999');
      await expect(page.getByText('Không tìm thấy sinh viên nào phù hợp')).toBeVisible();
    });
  });

  // ------------------------------------------------------------------ Phân công thủ công
  test.describe(FN_MANUAL, () => {
    test(ITC309.title, { annotation: ITC309.annotation }, async ({ page }) => {
      const s = ctx.students.find((x) => isEligible(x) && lecturerById(x.supervisorId));
      expect(s, 'Cần sinh viên có GVHD nằm trong danh sách giảng viên nhận xét').toBeTruthy();
      const sup = lecturerById(s!.supervisorId)!;
      await openPage(page);
      const posts = trackRequests(page, 'POST', (p) => p.endsWith('/manual'));
      await rowOf(page, s!.studentCode).getByRole('checkbox').check();
      await showAllLecturers(page);
      await radioOf(page, displayName(sup)).check();
      const btn = page.getByRole('button', { name: 'Gán (1 SV)' });
      await expect(btn).toBeDisabled();
      await expect(btn).toHaveAttribute('title', 'Không thể gán: Trùng với GVHD của sinh viên đang chọn');
      expect(posts.sent).toBe(false);
    });

    test(ITC310.title, { annotation: ITC310.annotation }, async ({ page }) => {
      const s = ctx.students.find((x) => x.topicStatus === 'IN_PROGRESS' && ELIGIBLE_STAGES.includes(x.currentStage)
        && isAssigned(x) && x.commentingLecturerId !== x.supervisorId && x.commentingLecturerId !== x.coSupervisorId
        && lecturerById(x.commentingLecturerId));
      expect(s, 'Cần sinh viên đang thực hiện đề tài, đã có GV nhận xét').toBeTruthy();
      const reviewer = lecturerById(s!.commentingLecturerId)!;
      const before = await reviewerOf(s!.topicId);

      await openPage(page);
      await rowOf(page, s!.studentCode).getByRole('checkbox').check();
      await showAllLecturers(page);
      await radioOf(page, displayName(reviewer)).check();
      const resPromise = page.waitForResponse(isManual);
      await page.getByRole('button', { name: 'Gán (1 SV)' }).click();
      const res = await resPromise;
      const sent = res.request().postDataJSON();
      expect(sent.commentingLecturerId).toBe(reviewer.id);
      expect(sent.studentOrTopicIds).toEqual([s!.topicId]);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.message).toBe('Phân công giảng viên nhận xét thành công');
      await expect(alertWith(page, `Đã phân công thành công 1 sinh viên cho ${displayName(reviewer)}`)).toBeVisible();
      await expect(rowOf(page, s!.studentCode)).toContainText(s!.commentingLecturerName!);
      expect(await reviewerOf(s!.topicId)).toBe(before);
    });

    test(ITC311.title, { annotation: ITC311.annotation }, async ({ page }) => {
      const s = ctx.students.find((x) => x.topicStatus !== 'IN_PROGRESS' && isAssigned(x));
      expect(s, 'Cần sinh viên có đề tài đã bị loại nhưng đã có GV nhận xét').toBeTruthy();
      const other = ctx.lecturers.find((l) => l.id !== s!.supervisorId && l.id !== s!.coSupervisorId && l.id !== s!.commentingLecturerId);
      expect(other, 'Cần giảng viên khác GVHD và GV nhận xét hiện tại').toBeTruthy();
      const before = await reviewerOf(s!.topicId);

      await openPage(page);
      await rowOf(page, s!.studentCode).getByRole('checkbox').check();
      await showAllLecturers(page);
      await radioOf(page, displayName(other!)).check();
      const resPromise = page.waitForResponse(isManual);
      await page.getByRole('button', { name: 'Gán (1 SV)' }).click();
      const res = await resPromise;
      expect(res.request().postDataJSON().studentOrTopicIds).toEqual([s!.topicId]);
      expect(res.status()).toBe(409);
      const body = await res.json();
      expect(body.code).toBe(3057);
      expect(body.message).toBe('Đề tài không ở trạng thái đang thực hiện');
      await expect(alertWith(page, 'Đề tài không ở trạng thái đang thực hiện')).toBeVisible();
      await expect(rowOf(page, s!.studentCode)).toContainText(s!.commentingLecturerName!);
      expect(await reviewerOf(s!.topicId)).toBe(before);
    });

    test(ITC312.title, { annotation: ITC312.annotation }, async ({ page }) => {
      await openPage(page);
      const posts = trackRequests(page, 'POST', (p) => p.endsWith('/manual'));
      await showAllLecturers(page);
      await radioOf(page, displayName(ctx.lecturers[0])).check();
      const btn = page.getByRole('button', { name: 'Gán (0 SV)' });
      await expect(btn).toBeDisabled();
      await expect(btn).toHaveAttribute('title', 'Tích chọn sinh viên ở bảng bên trái trước khi gán');
      expect(posts.sent).toBe(false);
    });
  });
});

// ------------------------------------------------------------------ Security
test.describe('SecurityTest - Phân công GV nhận xét', () => {
  test.beforeAll(async ({ request }) => {
    ctx = await loadContext(request);
  });

  test.describe('Sinh viên', () => {
    test.use({ storageState: '.auth/student.json' });
    test(SEC065.title, { annotation: SEC065.annotation }, async ({ page, request }) => {
      await page.goto(PAGE_URL);
      await expect(page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Phân công nhanh (Chia đều)' })).toHaveCount(0);

      const s = ctx.students.find((x) => isAssigned(x))!;
      const other = ctx.lecturers.find((l) => l.id !== s.supervisorId && l.id !== s.commentingLecturerId)!;
      const before = await reviewerOf(s.topicId);
      const student = await token(request, 'STUDENT');
      const res = await apiCall(request, student, 'POST', '/api/v1/assignments/commenting-lecturers/manual', {
        data: { commentingLecturerId: other.id, studentOrTopicIds: [s.topicId] },
      });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(2001);
      expect(await reviewerOf(s.topicId)).toBe(before);
    });
  });

  test.describe('Chưa đăng nhập', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test(SEC102.title, { annotation: SEC102.annotation }, async ({ page, request }) => {
      const before = await reviewedCount(ctx.semesterId);
      await page.goto(PAGE_URL);
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByRole('button', { name: 'Phân công nhanh (Chia đều)' })).toHaveCount(0);

      const res = await request.post(`${getApiBaseUrl()}/api/v1/assignments/commenting-lecturers/auto-distribute`, {
        data: { semesterId: ctx.semesterPublicId, preview: false },
      });
      expect(res.status()).toBe(401);
      expect((await res.json()).code).toBe(2000);
      expect(await reviewedCount(ctx.semesterId)).toBe(before);
    });
  });
});
