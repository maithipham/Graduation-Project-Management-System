import { test, expect, type APIRequestContext, type Page, type Response } from '@playwright/test';
import { defineItc, defineItcSec } from '../../../support/integration-test-case';
import { apiCall, getApiBaseUrl, loginByEmail } from '../../../support/api';
import { dbSelect } from '../../../support/db';

// ============================================================================
// ĐẶC TẢ TEST CASE (ITC139..ITC146, ITC301..ITC305 & TC-SEC-064, TC-SEC-101)
// Feature: registration | Module/Sheet: PhanCongGVHD
// Role: Trưởng bộ môn (HEAD_OF_MAJOR) — màn hình "/department/supervisors" (Phân công GVHD)
//
// Dữ liệu: dùng dữ liệu phân công đang có của học kỳ hiện tại, KHÔNG làm thay đổi dữ liệu.
// - Các thao tác ghi (đổi GVHD 1, gán GVHD 2, chốt danh sách) chỉ được chạy khi mốc
//   "Hạn TBM chốt & gửi danh sách GVHD dự kiến" CHƯA được thiết lập và danh sách CHƯA khóa:
//   khi đó BE từ chối trước khi ghi. beforeAll kiểm tra điều kiện này bằng SELECT; không thỏa thì
//   dừng toàn bộ (không bấm gì) để không phân công / khóa thật trên DB dùng chung.
// - Không có case ghi thành công: phân công GVHD cho SV test sinh đơn advisor_registration và
//   thêm GV test vào kỳ sinh thông báo → không dọn được bằng API (xem báo cáo).
// ============================================================================

const FEATURE = 'registration';
const MODULE = 'PhanCongGVHD';
const SHEET = 'PhanCongGVHD';
const PAGE_URL = '/department/supervisors';
const OVERVIEW_SEARCH = 'Tìm theo tên giảng viên, email, bộ môn...';
const WS_SEARCH = 'Tìm theo tên sinh viên, MSSV, lớp...';
const DEADLINE_MSG = "Thời hạn 'Hạn TBM chốt & gửi danh sách GVHD dự kiến' chưa được thiết lập cho học kỳ này";

const FN_OVERVIEW = 'Xem danh sách GVHD của học kỳ';
const FN_QUOTA = 'Sửa hạn mức GVHD';
const FN_REMOVE = 'Loại bỏ GVHD khỏi học kỳ';
const FN_WORKSPACE = 'Xem màn phân công GVHD';
const FN_CHANGE = 'Đổi GVHD 1';
const FN_CO = 'Gán GVHD 2';
const FN_LOCK = 'Chốt danh sách GVHD';

const PRE_TBM = 'Trưởng bộ môn ngành Kỹ thuật phần mềm đã đăng nhập; học kỳ hiện tại đã có danh sách GVHD và sinh viên đã được phân công GVHD';
const PRE_DEADLINE = PRE_TBM + '; thời hạn đăng ký GVHD của sinh viên đã kết thúc; mốc "Hạn TBM chốt & gửi danh sách GVHD dự kiến" chưa được thiết lập; danh sách phân công chưa khóa';

const ITC139 = defineItc({
  id: 'ITC139', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_OVERVIEW,
  description: 'Kiểm tra mở màn hình Phân công GVHD hiển thị danh sách GVHD bộ môn của Trưởng bộ môn trong học kỳ hiện tại',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn.\n2. Mở màn hình "Phân công GVHD" (/department/supervisors).',
  expected:
    '1. Gọi GET /semesters/{mã học kỳ hiện tại}/advisors; HTTP 200, code = 1000, message "Lấy danh sách giáo viên hướng dẫn trong kỳ thành công".\n' +
    '2. Bộ lọc bộ môn tự chọn "Kỹ thuật phần mềm"; bảng có số dòng bằng số GVHD ngành Kỹ thuật phần mềm trả về.\n' +
    '3. Mỗi dòng hiển thị đúng email và hạn mức (số SV tối đa) của giảng viên.',
  precondition: PRE_TBM,
});

const ITC140 = defineItc({
  id: 'ITC140', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_OVERVIEW,
  description: 'Kiểm tra tìm kiếm GVHD với từ khóa không khớp giảng viên nào',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Phân công GVHD".\n2. Nhập "KHONGTONTAI9999" vào ô "Tìm theo tên giảng viên, email, bộ môn...".',
  expected: '1. Không gọi lại API; danh sách được lọc trên dữ liệu đã tải.\n2. Bảng hiển thị "Chưa có giảng viên hướng dẫn nào trong học kỳ này.".',
  precondition: PRE_TBM,
});

const ITC141 = defineItc({
  id: 'ITC141', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_OVERVIEW,
  description: 'Kiểm tra lọc GVHD theo trạng thái "Chưa phân công"',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Phân công GVHD".\n2. Chọn trạng thái phân công "Chưa phân công".',
  expected:
    '1. Bảng chỉ còn các GVHD ngành Kỹ thuật phần mềm đang nhận 0 sinh viên (theo dữ liệu GET /semesters/{mã học kỳ}/advisors).\n' +
    '2. Mỗi dòng hiển thị "0/<hạn mức> SV" và nút "Loại bỏ khỏi danh sách GVHD kỳ này" được bật.',
  precondition: PRE_TBM + '; có ít nhất 1 GVHD ngành Kỹ thuật phần mềm chưa nhận sinh viên nào',
});

const ITC142 = defineItc({
  id: 'ITC142', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_QUOTA,
  description: 'Kiểm tra giao diện chặn giảm hạn mức xuống dưới số sinh viên giảng viên đang hướng dẫn',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Phân công GVHD".\n' +
    '2. Ở dòng một GVHD đang hướng dẫn từ 2 sinh viên trở lên, sửa ô hạn mức thành 1.',
  expected:
    '1. Hiện cảnh báo "Không thể giảm hạn mức xuống 1 vì giảng viên <tên giảng viên> hiện đang hướng dẫn <số SV> sinh viên.".\n' +
    '2. Không gọi PUT /semesters/{mã học kỳ}/advisors/{mã giảng viên}/quota; ô hạn mức vẫn giữ giá trị cũ.\n' +
    '3. Dữ liệu: hạn mức của giảng viên trong học kỳ không đổi.',
  precondition: PRE_TBM + '; có GVHD ngành Kỹ thuật phần mềm đang hướng dẫn từ 2 sinh viên trở lên',
});

const ITC143 = defineItc({
  id: 'ITC143', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_REMOVE,
  description: 'Kiểm tra không cho loại bỏ GVHD đang có sinh viên hướng dẫn',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Phân công GVHD".\n2. Xem nút loại bỏ ở dòng một GVHD đang hướng dẫn sinh viên.',
  expected:
    '1. Nút loại bỏ bị khóa với chú thích "Không thể loại bỏ giảng viên đang có sinh viên hướng dẫn".\n' +
    '2. Không gọi DELETE /semesters/{mã học kỳ}/advisors/{mã giảng viên}.',
  precondition: PRE_TBM + '; có GVHD ngành Kỹ thuật phần mềm đang hướng dẫn sinh viên',
});

const ITC144 = defineItc({
  id: 'ITC144', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_REMOVE,
  description: 'Kiểm tra hủy thao tác loại bỏ GVHD chưa nhận sinh viên',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Phân công GVHD".\n' +
    '2. Ở dòng một GVHD chưa nhận sinh viên nào, bấm "Loại bỏ khỏi danh sách GVHD kỳ này".\n' +
    '3. Trong popup "Loại bỏ giảng viên hướng dẫn", bấm "Hủy".',
  expected:
    '1. Popup hiển thị tên và email của giảng viên được chọn.\n' +
    '2. Sau khi bấm "Hủy": popup đóng, không gọi DELETE /semesters/{mã học kỳ}/advisors/{mã giảng viên}, giảng viên vẫn còn trong bảng.\n' +
    '3. Dữ liệu: giảng viên vẫn thuộc danh sách GVHD của học kỳ.',
  precondition: PRE_TBM + '; có ít nhất 1 GVHD ngành Kỹ thuật phần mềm chưa nhận sinh viên nào',
});

const ITC145 = defineItc({
  id: 'ITC145', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_WORKSPACE,
  description: 'Kiểm tra mở màn phân công GVHD hiển thị số lượng theo từng nhóm sinh viên',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Phân công GVHD".\n2. Bấm "Phân công GVHD".\n3. Bấm tab "Đã phân công".',
  expected:
    '1. Gọi GET /semesters/{mã học kỳ}/advisor-assignments; HTTP 200, code = 1000, message "Lấy dữ liệu phân công GVHD thành công".\n' +
    '2. Ba tab "Đã nhận giảng viên", "Chưa nhận giảng viên", "Đã phân công" hiển thị đúng số lượng tương ứng trong dữ liệu trả về.\n' +
    '3. Tab "Đã phân công" liệt kê đúng số sinh viên đã phân công, mỗi dòng có MSSV và GVHD 1 của sinh viên.',
  precondition: PRE_TBM,
});

const ITC146 = defineItc({
  id: 'ITC146', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_WORKSPACE,
  description: 'Kiểm tra tìm sinh viên theo MSSV trong tab "Đã phân công"',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Phân công GVHD", bấm "Phân công GVHD", chọn tab "Đã phân công".\n' +
    '2. Nhập MSSV của một sinh viên đã phân công vào ô "Tìm theo tên sinh viên, MSSV, lớp...".',
  expected: '1. Bảng chỉ còn 1 dòng của sinh viên có MSSV đã nhập, hiển thị đúng họ tên và GVHD 1 của sinh viên.',
  precondition: PRE_TBM,
});

const ITC301 = defineItc({
  id: 'ITC301', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_CHANGE,
  description: 'Kiểm tra đổi GVHD 1 khi mốc "Hạn TBM chốt & gửi danh sách GVHD dự kiến" chưa được thiết lập',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Phân công GVHD", bấm "Phân công GVHD", chọn tab "Đã phân công".\n' +
    '2. Bấm "Chọn sinh viên này để đổi GVHD 1" ở dòng một sinh viên đã có GVHD 1.\n' +
    '3. Chọn một giảng viên khác còn chỉ tiêu ở bảng bên phải, bấm "Đổi GVHD (1 SV)".',
  expected:
    '1. Gọi PUT /semesters/{mã học kỳ}/advisor-assignments/students/{mã sinh viên}/supervisor với giảng viên mới đã chọn; HTTP 400, code = 3064, message "' + DEADLINE_MSG + '".\n' +
    '2. Hiện thông báo lỗi đúng message trên; dòng sinh viên vẫn hiển thị GVHD 1 cũ.\n' +
    '3. Dữ liệu: GVHD 1 và số đơn đăng ký GVHD của sinh viên không đổi.',
  precondition: PRE_DEADLINE,
});

const ITC302 = defineItc({
  id: 'ITC302', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_CHANGE,
  description: 'Kiểm tra chọn đổi GVHD 1 sang chính giảng viên đang hướng dẫn sinh viên',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Phân công GVHD", bấm "Phân công GVHD", chọn tab "Đã phân công".\n' +
    '2. Bấm "Chọn sinh viên này để đổi GVHD 1" ở dòng một sinh viên.\n' +
    '3. Chọn đúng giảng viên đang là GVHD 1 của sinh viên ở bảng bên phải, bấm "Đổi GVHD (1 SV)".',
  expected:
    '1. Hiện thông báo "Giảng viên <tên giảng viên> đã là GVHD của sinh viên được chọn.".\n' +
    '2. Không gọi PUT /semesters/{mã học kỳ}/advisor-assignments/students/{mã sinh viên}/supervisor.',
  precondition: PRE_TBM,
});

const ITC303 = defineItc({
  id: 'ITC303', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_CO,
  description: 'Kiểm tra gán GVHD 2 khi mốc "Hạn TBM chốt & gửi danh sách GVHD dự kiến" chưa được thiết lập',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Phân công GVHD", bấm "Phân công GVHD", chọn tab "Đã phân công".\n' +
    '2. Bấm "Thêm GVHD 2" ở dòng một sinh viên chưa có GVHD 2.\n' +
    '3. Chọn một giảng viên khác GVHD 1 còn chỉ tiêu ở bảng bên phải, bấm "Gán GVHD 2".',
  expected:
    '1. Gọi PUT /semesters/{mã học kỳ}/advisor-assignments/students/{mã sinh viên}/co-supervisor với giảng viên đã chọn; HTTP 400, code = 3064, message "' + DEADLINE_MSG + '".\n' +
    '2. Hiện thông báo lỗi đúng message trên, không hiện thông báo gán GVHD 2 thành công; cột GVHD 2 của sinh viên vẫn trống.\n' +
    '3. Dữ liệu: sinh viên vẫn chưa có GVHD 2.',
  precondition: PRE_DEADLINE,
});

const ITC304 = defineItc({
  id: 'ITC304', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_CO,
  description: 'Kiểm tra giao diện chặn gán GVHD 2 trùng với GVHD 1 của sinh viên',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Phân công GVHD", bấm "Phân công GVHD", chọn tab "Đã phân công".\n' +
    '2. Bấm "Thêm GVHD 2" ở dòng một sinh viên.\n' +
    '3. Chọn đúng giảng viên đang là GVHD 1 của sinh viên, bấm "Gán GVHD 2".',
  expected:
    '1. Hiện thông báo "Giảng viên <tên giảng viên> đang là GVHD 1 của sinh viên này! GVHD 2 phải là giảng viên khác.".\n' +
    '2. Không gọi PUT /semesters/{mã học kỳ}/advisor-assignments/students/{mã sinh viên}/co-supervisor.',
  precondition: PRE_TBM,
});

const ITC305 = defineItc({
  id: 'ITC305', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LOCK,
  description: 'Kiểm tra chốt danh sách GVHD khi mốc "Hạn TBM chốt & gửi danh sách GVHD dự kiến" chưa được thiết lập',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Phân công GVHD", bấm "Phân công GVHD".\n' +
    '2. Bấm "Chốt danh sách GVHD".\n' +
    '3. Trong popup "Xác nhận Chốt danh sách GVHD & Công bố chính thức", bấm "Xác nhận chốt danh sách".',
  expected:
    '1. Gọi POST /api/advisors/finalize với học kỳ hiện tại; HTTP 400, code = 3064, message "' + DEADLINE_MSG + '".\n' +
    '2. Hiện thông báo lỗi đúng message trên; nút "Chốt danh sách GVHD" vẫn hiển thị (danh sách chưa bị khóa).\n' +
    '3. Dữ liệu: danh sách phân công GVHD của học kỳ vẫn chưa khóa.',
  precondition: PRE_DEADLINE + '; 100% sinh viên đã có GVHD, không còn đơn chờ duyệt',
});

const SEC064 = defineItcSec({
  id: 'TC-SEC-064', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Sinh viên mở màn hình Phân công GVHD và gọi API phân công GVHD',
  roleSession: 'Sinh viên (STUDENT), đã đăng nhập',
  technique: 'EP',
  given: 'Đăng nhập bằng tài khoản Sinh viên',
  when: 'Mở thẳng /department/supervisors; gọi POST /semesters/{mã học kỳ}/advisor-assignments/assign (gán 1 sinh viên cho 1 giảng viên) bằng phiên Sinh viên',
  then: 'Màn hình hiển thị "Tài khoản của bạn không có quyền truy cập cổng cán bộ."; POST trả HTTP 403, code = 2001; số đơn đăng ký GVHD của sinh viên không đổi',
});

const SEC101 = defineItcSec({
  id: 'TC-SEC-101', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Chưa đăng nhập mở màn hình Phân công GVHD và gọi API khóa danh sách phân công',
  roleSession: 'Chưa đăng nhập (không có cookie phiên)',
  technique: 'EP',
  given: 'Trình duyệt chưa đăng nhập; danh sách phân công GVHD của học kỳ chưa khóa',
  when: 'Mở thẳng /department/supervisors; gọi PUT /semesters/{mã học kỳ}/advisor-assignments/lock-status (khóa) không kèm phiên đăng nhập',
  then: 'Bị chuyển về trang đăng nhập (/login); PUT trả HTTP 401, code = 2000; danh sách phân công vẫn chưa khóa',
});

// ============================================================================
// DỮ LIỆU & HÀM HỖ TRỢ (API để lấy dữ liệu, DB chỉ SELECT)
// ============================================================================

type Advisor = {
  teacherId: number; teacherPublicId: string; name: string; displayName: string; email: string;
  majorName: string | null; isInternal: boolean; maxStudents: number; currentStudents: number;
  pendingRegistrations: number; status: string;
};
type WsStudent = {
  studentPublicId: string; studentCode: string; fullName: string; status: string;
  supervisor: { teacherPublicId: string; fullName: string } | null;
  coSupervisor: { teacherPublicId: string; fullName: string } | null;
};
type WsLecturer = { teacherPublicId: string; fullName: string; quota: number; assignedCount: number; majorName: string | null };

const KTPM = 'Kỹ thuật phần mềm';

function requireEmail(role: string): string {
  const email = process.env[`E2E_EMAIL_${role}`];
  if (!email) throw new Error(`Chưa cấu hình E2E_EMAIL_${role} trong .env.e2e`);
  return email;
}
const token = (request: APIRequestContext, role: 'HEAD_OF_MAJOR' | 'STUDENT') => loginByEmail(request, requireEmail(role));

type Ctx = { semesterPublicId: string; semesterName: string; semesterId: number; advisors: Advisor[]; students: WsStudent[]; lecturers: WsLecturer[]; counts: any };
let ctx: Ctx;

async function loadContext(request: APIRequestContext): Promise<Ctx> {
  const hom = await token(request, 'HEAD_OF_MAJOR');
  const cur = await apiCall(request, hom, 'GET', '/semester/current');
  const semesterPublicId: string = cur.body?.data?.publicId ?? cur.body?.data?.id;
  expect(semesterPublicId, 'Không lấy được học kỳ hiện tại').toBeTruthy();
  const ws = await apiCall(request, hom, 'GET', `/semesters/${semesterPublicId}/advisor-assignments`);
  expect(ws.status, 'Không tải được dữ liệu phân công GVHD').toBe(200);
  const adv = await apiCall(request, hom, 'GET', `/semesters/${semesterPublicId}/advisors`);
  const semesterName: string = ws.body.data.semesterName;
  const sem = await dbSelect<{ id: number }>(`SELECT id FROM semester WHERE name = ?`, [semesterName]);
  return {
    semesterPublicId, semesterName, semesterId: sem[0].id,
    advisors: adv.body.data, students: ws.body.data.students, lecturers: ws.body.data.lecturers, counts: ws.body.data.counts,
  };
}

/** Điều kiện an toàn cho các case ghi: mốc TBM chốt chưa thiết lập và danh sách chưa khóa → BE từ chối trước khi ghi */
async function assertWriteGuard(semesterId: number) {
  const [lock] = await dbSelect<{ locked: number }>(
    `SELECT CAST(is_advisor_assignment_locked AS UNSIGNED) AS locked FROM semester WHERE id = ?`, [semesterId]);
  const [dl] = await dbSelect<{ n: number }>(
    `SELECT COUNT(*) AS n FROM semester_deadlines sd JOIN deadline_templates dt ON dt.id = sd.template_id
      WHERE sd.semester_id = ? AND dt.code = ? AND sd.start_date IS NOT NULL AND sd.end_date IS NOT NULL`,
    [semesterId, 'TBM_CHOT_DS_GVHD_DU_KIEN']);
  if (Number(lock.locked) !== 0 || Number(dl.n) !== 0) {
    throw new Error('[DỪNG] Tiền điều kiện không thỏa (danh sách đã khóa hoặc đã thiết lập mốc TBM chốt): '
      + 'case ghi sẽ thay đổi dữ liệu thật nên không chạy.');
  }
}

async function topicOf(studentCode: string, semesterId: number) {
  const rows = await dbSelect<{ lecturer_id: number | null; co_lecturer_id: number | null }>(
    `SELECT t.lecturer_id, t.co_lecturer_id FROM thesis_topic t JOIN student s ON s.id = t.student_id
      WHERE s.student_code = ? AND t.semester_id = ?`, [studentCode, semesterId]);
  return rows[0];
}

async function regCount(studentCode: string, semesterId: number) {
  const [r] = await dbSelect<{ n: number }>(
    `SELECT COUNT(*) AS n FROM advisor_registration r JOIN student s ON s.id = r.student_id
      WHERE s.student_code = ? AND r.semester_id = ?`, [studentCode, semesterId]);
  return Number(r.n);
}

const ktpmAdvisors = () => ctx.advisors.filter((a) => a.majorName === KTPM && a.status === 'ACTIVE');
const wsLecturer = (publicId: string) => ctx.lecturers.find((l) => l.teacherPublicId === publicId);
const hasRoom = (publicId: string) => { const l = wsLecturer(publicId); return !!l && l.assignedCount < l.quota; };
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Sinh viên đã phân công, GVHD 1 thuộc bộ môn và còn chỉ tiêu, chưa có GVHD 2 */
function pickStudent(): WsStudent {
  const s = ctx.students.find((x) => x.status === 'APPROVED' && x.supervisor && !x.coSupervisor
    && ktpmAdvisors().some((a) => a.teacherPublicId === x.supervisor!.teacherPublicId)
    && hasRoom(x.supervisor.teacherPublicId));
  if (!s) throw new Error('Cần 1 sinh viên đã phân công GVHD (thuộc bộ môn, còn chỉ tiêu), chưa có GVHD 2');
  return s;
}

/** Giảng viên bộ môn khác GVHD 1 của sinh viên và còn chỉ tiêu */
function pickOtherLecturer(s: WsStudent): Advisor {
  const a = ktpmAdvisors().find((x) => x.teacherPublicId !== s.supervisor!.teacherPublicId && hasRoom(x.teacherPublicId));
  if (!a) throw new Error('Cần 1 GVHD bộ môn khác GVHD 1 của sinh viên và còn chỉ tiêu');
  return a;
}

const radioOf = (page: Page, fullName: string) => page.getByRole('radio', { name: new RegExp('^' + escapeRe(fullName)) });
const alertWith = (page: Page, text: string | RegExp) => page.getByRole('alert').filter({ hasText: text });
const overviewRow = (page: Page, email: string) => page.getByRole('row').filter({ hasText: email });
const studentRow = (page: Page, code: string) => page.getByRole('row').filter({ hasText: code });
const path = (r: Response) => new URL(r.url()).pathname;

function trackRequests(page: Page, method: string, test: (pathname: string) => boolean) {
  const state = { sent: false };
  page.on('request', (r) => { if (r.method() === method && test(new URL(r.url()).pathname)) state.sent = true; });
  return state;
}

async function openOverview(page: Page) {
  const resPromise = page.waitForResponse((r) => r.request().method() === 'GET' && /\/semesters\/[^/]+\/advisors$/.test(path(r)));
  await page.goto(PAGE_URL);
  const res = await resPromise;
  await expect(page.getByLabel('Lọc theo bộ môn')).toHaveValue(KTPM);
  return res;
}

async function openWorkspace(page: Page, tab?: 'approved') {
  await openOverview(page);
  const wsPromise = page.waitForResponse((r) => r.request().method() === 'GET' && /\/advisor-assignments$/.test(path(r)));
  await page.getByRole('button', { name: 'Phân công GVHD' }).click();
  await expect(page.getByRole('button', { name: 'Quay lại' })).toBeVisible();
  // Dữ liệu workspace có thể đã được tải sẵn từ màn tổng quan
  const ws = await Promise.race([wsPromise, page.waitForTimeout(3000).then(() => null)]);
  if (tab === 'approved') await page.getByRole('button', { name: /^Đã phân công/ }).click();
  return ws;
}

// ============================================================================
// TEST
// ============================================================================

test.describe('Phân công GVHD (Trưởng bộ môn)', () => {
  test.use({ storageState: '.auth/head_of_major.json' });

  test.beforeAll(async ({ request }) => {
    ctx = await loadContext(request);
  });

  // ------------------------------------------------------------------ Danh sách GVHD của kỳ
  test.describe(FN_OVERVIEW, () => {
    test(ITC139.title, { annotation: ITC139.annotation }, async ({ page }) => {
      const res = await openOverview(page);
      expect(path(res).endsWith(`/semesters/${ctx.semesterPublicId}/advisors`)).toBe(true);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.message).toBe('Lấy danh sách giáo viên hướng dẫn trong kỳ thành công');

      const expected = (body.data as Advisor[]).filter((a) => a.majorName === KTPM);
      const dataRows = page.getByRole('row').filter({ has: page.getByRole('spinbutton', { name: 'Sửa hạn mức sinh viên' }) });
      await expect(dataRows).toHaveCount(Math.min(15, expected.length));
      for (const a of expected.slice(0, 15)) {
        const row = overviewRow(page, a.email);
        await expect(row).toHaveCount(1);
        await expect(row.getByRole('spinbutton', { name: 'Sửa hạn mức sinh viên' })).toHaveValue(String(a.maxStudents));
      }
    });

    test(ITC140.title, { annotation: ITC140.annotation }, async ({ page }) => {
      await openOverview(page);
      const calls = trackRequests(page, 'GET', (p) => /\/advisors$/.test(p));
      await page.getByPlaceholder(OVERVIEW_SEARCH).fill('KHONGTONTAI9999');
      await expect(page.getByText('Chưa có giảng viên hướng dẫn nào trong học kỳ này.')).toBeVisible();
      expect(calls.sent).toBe(false);
    });

    test(ITC141.title, { annotation: ITC141.annotation }, async ({ page }) => {
      const res = await openOverview(page);
      const idle = ((await res.json()).data as Advisor[]).filter((a) => a.majorName === KTPM && a.currentStudents === 0);
      expect(idle.length, 'Cần ít nhất 1 GVHD bộ môn chưa nhận sinh viên').toBeGreaterThan(0);
      await page.getByLabel('Lọc theo trạng thái phân công').selectOption({ label: 'Chưa phân công' });
      const dataRows = page.getByRole('row').filter({ has: page.getByRole('spinbutton', { name: 'Sửa hạn mức sinh viên' }) });
      await expect(dataRows).toHaveCount(Math.min(15, idle.length));
      for (const a of idle.slice(0, 15)) {
        const row = overviewRow(page, a.email);
        await expect(row).toContainText(`0/${a.maxStudents} SV`);
        await expect(row.getByRole('button', { name: 'Loại bỏ khỏi danh sách GVHD kỳ này' })).toBeEnabled();
      }
    });
  });

  // ------------------------------------------------------------------ Hạn mức
  test.describe(FN_QUOTA, () => {
    test(ITC142.title, { annotation: ITC142.annotation }, async ({ page }) => {
      const target = ktpmAdvisors().find((a) => (wsLecturer(a.teacherPublicId)?.assignedCount ?? a.currentStudents) >= 2);
      expect(target, 'Cần GVHD bộ môn đang hướng dẫn từ 2 sinh viên').toBeTruthy();
      const assigned = wsLecturer(target!.teacherPublicId)?.assignedCount ?? target!.currentStudents;
      await openOverview(page);
      const puts = trackRequests(page, 'PUT', (p) => /\/advisors\/[^/]+\/quota$/.test(p));
      const input = overviewRow(page, target!.email).getByRole('spinbutton', { name: 'Sửa hạn mức sinh viên' });
      await input.fill('1');
      await expect(alertWith(page, new RegExp(`Không thể giảm hạn mức xuống 1 vì giảng viên .+ hiện đang hướng dẫn ${assigned} sinh viên\\.`))).toBeVisible();
      await expect(input).toHaveValue(String(target!.maxStudents));
      expect(puts.sent).toBe(false);
      const [row] = await dbSelect<{ max_students: number }>(
        `SELECT max_students FROM semester_advisor WHERE semester_id = ? AND teacher_id = ?`, [ctx.semesterId, target!.teacherId]);
      expect(row.max_students).toBe(target!.maxStudents);
    });
  });

  // ------------------------------------------------------------------ Loại bỏ GVHD
  test.describe(FN_REMOVE, () => {
    test(ITC143.title, { annotation: ITC143.annotation }, async ({ page }) => {
      const busy = ktpmAdvisors().find((a) => a.currentStudents > 0);
      expect(busy, 'Cần GVHD bộ môn đang hướng dẫn sinh viên').toBeTruthy();
      await openOverview(page);
      const deletes = trackRequests(page, 'DELETE', (p) => /\/advisors\//.test(p));
      const btn = overviewRow(page, busy!.email).getByRole('button', { name: 'Không thể loại bỏ giảng viên đang có sinh viên hướng dẫn' });
      await expect(btn).toBeDisabled();
      expect(deletes.sent).toBe(false);
    });

    test(ITC144.title, { annotation: ITC144.annotation }, async ({ page }) => {
      const idle = ktpmAdvisors().find((a) => a.currentStudents === 0 && a.pendingRegistrations === 0);
      expect(idle, 'Cần GVHD bộ môn chưa nhận sinh viên').toBeTruthy();
      await openOverview(page);
      const deletes = trackRequests(page, 'DELETE', (p) => /\/advisors\//.test(p));
      await overviewRow(page, idle!.email).getByRole('button', { name: 'Loại bỏ khỏi danh sách GVHD kỳ này' }).click();
      const dialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Loại bỏ giảng viên hướng dẫn' }) });
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(idle!.name);
      await expect(dialog).toContainText(idle!.email);
      await dialog.getByRole('button', { name: 'Hủy' }).click();
      await expect(dialog).toBeHidden();
      await expect(overviewRow(page, idle!.email)).toHaveCount(1);
      expect(deletes.sent).toBe(false);
      const rows = await dbSelect(`SELECT id FROM semester_advisor WHERE semester_id = ? AND teacher_id = ?`, [ctx.semesterId, idle!.teacherId]);
      expect(rows).toHaveLength(1);
    });
  });

  // ------------------------------------------------------------------ Màn phân công
  test.describe(FN_WORKSPACE, () => {
    test(ITC145.title, { annotation: ITC145.annotation }, async ({ page }) => {
      const wsPromise = page.waitForResponse((r) => r.request().method() === 'GET' && /\/advisor-assignments$/.test(path(r)));
      await openOverview(page);
      await page.getByRole('button', { name: 'Phân công GVHD' }).click();
      const res = await wsPromise;
      expect(path(res).endsWith(`/semesters/${ctx.semesterPublicId}/advisor-assignments`)).toBe(true);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.message).toBe('Lấy dữ liệu phân công GVHD thành công');
      const c = body.data.counts;
      await expect(page.getByRole('button', { name: `Đã nhận giảng viên ${c.received}` })).toBeVisible();
      await expect(page.getByRole('button', { name: `Chưa nhận giảng viên ${c.unassigned}` })).toBeVisible();
      await expect(page.getByRole('button', { name: `Đã phân công ${c.approved}` })).toBeVisible();

      await page.getByRole('button', { name: /^Đã phân công/ }).click();
      const rows = page.getByRole('row').filter({ has: page.getByRole('button', { name: /GVHD 2/ }) });
      await expect(rows).toHaveCount(c.approved);
      const s = (body.data.students as WsStudent[]).find((x) => x.status === 'APPROVED' && x.supervisor)!;
      await expect(studentRow(page, s.studentCode)).toContainText(s.supervisor!.fullName);
    });

    test(ITC146.title, { annotation: ITC146.annotation }, async ({ page }) => {
      const s = pickStudent();
      await openWorkspace(page, 'approved');
      await page.getByPlaceholder(WS_SEARCH).fill(s.studentCode);
      const rows = page.getByRole('row').filter({ has: page.getByRole('button', { name: /GVHD 2/ }) });
      await expect(rows).toHaveCount(1);
      await expect(rows.first()).toContainText(s.studentCode);
      await expect(rows.first()).toContainText(s.fullName);
      await expect(rows.first()).toContainText(s.supervisor!.fullName);
    });
  });

  // ------------------------------------------------------------------ Đổi GVHD 1
  test.describe(FN_CHANGE, () => {
    test(ITC301.title, { annotation: ITC301.annotation }, async ({ page }) => {
      await assertWriteGuard(ctx.semesterId);
      const s = pickStudent();
      const target = pickOtherLecturer(s);
      const before = await topicOf(s.studentCode, ctx.semesterId);
      const regsBefore = await regCount(s.studentCode, ctx.semesterId);

      await openWorkspace(page, 'approved');
      await studentRow(page, s.studentCode).getByRole('button', { name: 'Chọn sinh viên này để đổi GVHD 1' }).click();
      await radioOf(page, target.displayName).check();
      const resPromise = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/supervisor$/.test(path(r)));
      await page.getByRole('button', { name: 'Đổi GVHD (1 SV)' }).click();
      const res = await resPromise;
      expect(path(res).endsWith(`/semesters/${ctx.semesterPublicId}/advisor-assignments/students/${s.studentPublicId}/supervisor`)).toBe(true);
      expect(res.request().postDataJSON().newTeacherPublicId).toBe(target.teacherPublicId);
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.code).toBe(3064);
      expect(body.message).toBe(DEADLINE_MSG);
      await expect(alertWith(page, DEADLINE_MSG)).toBeVisible();
      await expect(studentRow(page, s.studentCode)).toContainText(s.supervisor!.fullName);

      const after = await topicOf(s.studentCode, ctx.semesterId);
      expect(after.lecturer_id).toBe(before.lecturer_id);
      expect(await regCount(s.studentCode, ctx.semesterId)).toBe(regsBefore);
    });

    test(ITC302.title, { annotation: ITC302.annotation }, async ({ page }) => {
      const s = pickStudent();
      const current = ctx.advisors.find((a) => a.teacherPublicId === s.supervisor!.teacherPublicId)!;
      await openWorkspace(page, 'approved');
      const puts = trackRequests(page, 'PUT', (p) => /\/supervisor$/.test(p));
      await studentRow(page, s.studentCode).getByRole('button', { name: 'Chọn sinh viên này để đổi GVHD 1' }).click();
      await radioOf(page, current.displayName).check();
      await page.getByRole('button', { name: 'Đổi GVHD (1 SV)' }).click();
      await expect(alertWith(page, /đã là GVHD của sinh viên được chọn\./)).toBeVisible();
      expect(puts.sent).toBe(false);
    });
  });

  // ------------------------------------------------------------------ GVHD 2
  test.describe(FN_CO, () => {
    test(ITC303.title, { annotation: ITC303.annotation }, async ({ page }) => {
      await assertWriteGuard(ctx.semesterId);
      const s = pickStudent();
      const target = pickOtherLecturer(s);
      await openWorkspace(page, 'approved');
      await studentRow(page, s.studentCode).getByRole('button', { name: 'Thêm GVHD 2' }).click();
      await radioOf(page, target.displayName).check();
      const resPromise = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/co-supervisor$/.test(path(r)));
      await page.getByRole('button', { name: 'Gán GVHD 2' }).click();
      const res = await resPromise;
      expect(path(res).endsWith(`/students/${s.studentPublicId}/co-supervisor`)).toBe(true);
      expect(res.request().postDataJSON().coTeacherPublicId).toBe(target.teacherPublicId);
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.code).toBe(3064);
      expect(body.message).toBe(DEADLINE_MSG);
      await expect(alertWith(page, DEADLINE_MSG)).toBeVisible();
      await expect(alertWith(page, /làm GVHD 2 cho sinh viên .* thành công/)).toHaveCount(0);
      await expect(studentRow(page, s.studentCode).getByRole('button', { name: 'Thêm GVHD 2' })).toBeVisible();
      expect((await topicOf(s.studentCode, ctx.semesterId)).co_lecturer_id).toBeNull();
    });

    test(ITC304.title, { annotation: ITC304.annotation }, async ({ page }) => {
      const s = pickStudent();
      const current = ctx.advisors.find((a) => a.teacherPublicId === s.supervisor!.teacherPublicId)!;
      await openWorkspace(page, 'approved');
      const puts = trackRequests(page, 'PUT', (p) => /\/co-supervisor$/.test(p));
      await studentRow(page, s.studentCode).getByRole('button', { name: 'Thêm GVHD 2' }).click();
      await radioOf(page, current.displayName).check();
      await page.getByRole('button', { name: 'Gán GVHD 2' }).click();
      await expect(alertWith(page, /đang là GVHD 1 của sinh viên này! GVHD 2 phải là giảng viên khác\./)).toBeVisible();
      expect(puts.sent).toBe(false);
    });
  });

  // ------------------------------------------------------------------ Chốt danh sách
  test.describe(FN_LOCK, () => {
    test(ITC305.title, { annotation: ITC305.annotation }, async ({ page }) => {
      await assertWriteGuard(ctx.semesterId);
      await openWorkspace(page);
      await page.getByRole('button', { name: 'Chốt danh sách GVHD' }).click();
      await expect(page.getByRole('heading', { name: 'Xác nhận Chốt danh sách GVHD & Công bố chính thức' })).toBeVisible();
      const resPromise = page.waitForResponse((r) => r.request().method() === 'POST' && path(r).endsWith('/api/advisors/finalize'));
      await page.getByRole('button', { name: 'Xác nhận chốt danh sách' }).click();
      const res = await resPromise;
      expect(res.request().postDataJSON().semesterId).toBe(ctx.semesterPublicId);
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.code).toBe(3064);
      expect(body.message).toBe(DEADLINE_MSG);
      await expect(alertWith(page, DEADLINE_MSG)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Chốt danh sách GVHD' })).toBeVisible();
      const [sem] = await dbSelect<{ locked: number }>(
        `SELECT CAST(is_advisor_assignment_locked AS UNSIGNED) AS locked FROM semester WHERE id = ?`, [ctx.semesterId]);
      expect(Number(sem.locked)).toBe(0);
    });
  });
});

// ------------------------------------------------------------------ Security
test.describe('SecurityTest - Phân công GVHD', () => {
  test.beforeAll(async ({ request }) => {
    ctx = await loadContext(request);
  });

  test.describe('Sinh viên', () => {
    test.use({ storageState: '.auth/student.json' });
    test(SEC064.title, { annotation: SEC064.annotation }, async ({ page, request }) => {
      await page.goto(PAGE_URL);
      await expect(page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Phân công GVHD' })).toHaveCount(0);

      const s = pickStudent();
      const target = pickOtherLecturer(s);
      const regsBefore = await regCount(s.studentCode, ctx.semesterId);
      const student = await token(request, 'STUDENT');
      const res = await apiCall(request, student, 'POST', `/semesters/${ctx.semesterPublicId}/advisor-assignments/assign`, {
        data: { studentPublicIds: [s.studentPublicId], teacherPublicId: target.teacherPublicId },
      });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(2001);
      expect(await regCount(s.studentCode, ctx.semesterId)).toBe(regsBefore);
    });
  });

  test.describe('Chưa đăng nhập', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test(SEC101.title, { annotation: SEC101.annotation }, async ({ page, request }) => {
      await page.goto(PAGE_URL);
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByRole('button', { name: 'Phân công GVHD' })).toHaveCount(0);

      const res = await request.put(`${getApiBaseUrl()}/semesters/${ctx.semesterPublicId}/advisor-assignments/lock-status`, {
        data: { isLocked: true },
      });
      expect(res.status()).toBe(401);
      expect((await res.json()).code).toBe(2000);
      const [sem] = await dbSelect<{ locked: number }>(
        `SELECT CAST(is_advisor_assignment_locked AS UNSIGNED) AS locked FROM semester WHERE id = ?`, [ctx.semesterId]);
      expect(Number(sem.locked)).toBe(0);
    });
  });
});
