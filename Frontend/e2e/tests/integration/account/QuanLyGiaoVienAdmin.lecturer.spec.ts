import path from 'node:path';
import { test, expect, type APIRequestContext, type Locator, type Page, type Response } from '@playwright/test';
import { defineItc, defineItcSec } from '../../../support/integration-test-case';
import { apiCall, getApiBaseUrl, loginByEmail } from '../../../support/api';
import { dbSelect } from '../../../support/db';
import { writeXlsx } from '../../../support/xlsx';

// ============================================================================
// ĐẶC TẢ TEST CASE (ITC103..ITC119 & TC-SEC-058..TC-SEC-060)
// Feature: account | Module/Sheet: QuanLyGiaoVienAdmin
// Role: Quản trị viên (ADMIN) — màn hình "/admin/accounts-lecturer" (Tài khoản giảng viên)
// Dữ liệu test: mã GV ITCGV9xxx, email itc.gv9xxx@..., SĐT 0999xxxxxx; dọn bằng API DELETE /teacher/{id} sau mỗi test
// ============================================================================

const FEATURE = 'account';
const MODULE = 'QuanLyGiaoVienAdmin';
const SHEET = 'QuanLyGiaoVienAdmin';
const PAGE_URL = '/admin/accounts-lecturer';
const SEARCH_PLACEHOLDER = 'Tìm theo họ tên, email, SĐT, mã GV...';

const FN_LIST = 'Xem danh sách giảng viên';
const FN_DETAIL = 'Xem chi tiết giảng viên';
const FN_CREATE = 'Thêm giảng viên';
const FN_UPDATE = 'Cập nhật giảng viên';
const FN_DELETE = 'Xóa giảng viên';
const FN_IMPORT = 'Import giảng viên';

const PRE_ADMIN = 'Quản trị viên (ADMIN) đã đăng nhập, có quyền thao tác trên mọi ngành';
const PRE_T1 = PRE_ADMIN + '; giảng viên trong trường "Nguyễn Văn Kiểm" (ITCGV9001, itc.gv9001@tlu.edu.vn, 0999000001, TS., ngành Kỹ thuật phần mềm) đã có trong hệ thống';
const PRE_T4 = PRE_ADMIN + '; giảng viên "Phạm Quốc Bảo" (ITCGV9004, itc.gv9004@tlu.edu.vn, 0999000004, TS., ngành Công nghệ thông tin) đã có trong hệ thống';

const ITC103 = defineItc({
  id: 'ITC103', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra mở màn hình Tài khoản giảng viên hiển thị danh sách giảng viên mọi ngành, giảng viên mới thêm ở đầu danh sách',
  procedure: '1. Đăng nhập vai trò Quản trị viên.\n2. Mở màn hình "Tài khoản giảng viên" (/admin/accounts-lecturer).',
  expected:
    '1. Gọi GET /teacher với page = 0, size = 10, không gửi bộ lọc ngành; HTTP 200, code = 1000, message "Lấy danh sách giảng viên thành công".\n' +
    '2. Giảng viên đầu tiên trong dữ liệu trả về là ITCGV9001 (mới thêm nhất).\n' +
    '3. Bảng hiển thị số dòng bằng số giảng viên trả về (tối đa 10), dòng đầu là "Nguyễn Văn Kiểm" (ITCGV9001).',
  precondition: PRE_T1 + ' và là giảng viên được thêm gần nhất',
});

const ITC104 = defineItc({
  id: 'ITC104', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra tìm kiếm giảng viên theo mã giảng viên và hiển thị đủ thông tin trên dòng',
  procedure: '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Tài khoản giảng viên".\n2. Nhập "ITCGV9001" vào ô "Tìm theo họ tên, email, SĐT, mã GV...".',
  expected:
    '1. Gọi GET /teacher với keyword = "ITCGV9001", page = 0; HTTP 200, code = 1000, trả về đúng 1 giảng viên ITCGV9001.\n' +
    '2. Bảng có 1 dòng hiển thị "TS.", "Nguyễn Văn Kiểm", "ITCGV9001", "itc.gv9001@tlu.edu.vn", "0999000001", "Kỹ thuật phần mềm", "Trong trường", "Hoạt động".',
  precondition: PRE_T1,
});

const ITC105 = defineItc({
  id: 'ITC105', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra lọc giảng viên theo bộ môn "Công nghệ thông tin"',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Tài khoản giảng viên".\n' +
    '2. Chọn bộ môn "Công nghệ thông tin".\n3. Nhập "ITCGV900" vào ô tìm kiếm.',
  expected:
    '1. Gọi GET /teacher với majorId = ngành Công nghệ thông tin, keyword = "ITCGV900"; HTTP 200, code = 1000, chỉ trả về giảng viên ITCGV9004.\n' +
    '2. Bảng hiển thị "Phạm Quốc Bảo" (ITCGV9004), không hiển thị "Nguyễn Văn Kiểm" (ITCGV9001).',
  precondition: PRE_T1 + '; giảng viên "Phạm Quốc Bảo" (ITCGV9004, ngành Công nghệ thông tin) đã có trong hệ thống',
});

const ITC106 = defineItc({
  id: 'ITC106', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra lọc giảng viên ngoài trường',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Tài khoản giảng viên".\n' +
    '2. Chọn đơn vị "Ngoài trường".\n3. Nhập "ITCGV900" vào ô tìm kiếm.',
  expected:
    '1. Gọi GET /teacher với unitType = EXTERNAL, keyword = "ITCGV900"; HTTP 200, code = 1000, chỉ trả về giảng viên ITCGV9002.\n' +
    '2. Bảng hiển thị "Trần Thị Hoa" (ITCGV9002) kèm nhãn "Ngoài trường", "Trường Đại học Bách khoa Hà Nội"; không hiển thị ITCGV9001.',
  precondition: PRE_T1 + '; giảng viên ngoài trường "Trần Thị Hoa" (ITCGV9002, itc.gv9002@gmail.com, Trường Đại học Bách khoa Hà Nội) đã có trong hệ thống',
});

const ITC107 = defineItc({
  id: 'ITC107', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra hiển thị trạng thái rỗng khi từ khóa không khớp giảng viên nào',
  procedure: '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Tài khoản giảng viên".\n2. Nhập "KHONGTONTAI9999" vào ô tìm kiếm.',
  expected:
    '1. Gọi GET /teacher với keyword = "KHONGTONTAI9999"; HTTP 200, code = 1000, tổng số giảng viên = 0.\n' +
    '2. Bảng hiển thị "Không tìm thấy giảng viên nào phù hợp.".',
  precondition: 'Không có giảng viên nào khớp từ khóa "KHONGTONTAI9999"',
});

const ITC108 = defineItc({
  id: 'ITC108', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_DETAIL,
  description: 'Kiểm tra Quản trị viên xem chi tiết giảng viên của một ngành bất kỳ',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Tài khoản giảng viên".\n' +
    '2. Tìm "ITCGV9004", bấm nút "Xem chi tiết" trên dòng giảng viên.',
  expected:
    '1. Gọi GET /teacher/{mã định danh của giảng viên ITCGV9004}; HTTP 200, code = 1000, dữ liệu có mã ITCGV9004.\n' +
    '2. Popup "Thông tin giáo viên" hiển thị "Phạm Quốc Bảo", "Trường Đại học Thủy lợi", "Công nghệ thông tin", "TS.", "0999000004", "itc.gv9004@tlu.edu.vn".',
  precondition: PRE_T4,
});

const ITC109 = defineItc({
  id: 'ITC109', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_CREATE,
  description: 'Kiểm tra Quản trị viên thêm giảng viên trong trường và tự chọn ngành',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Tài khoản giảng viên", bấm "Thêm giảng viên".\n' +
    '2. Nhập Mã giảng viên "ITCGV9011", Họ và tên đệm "Đỗ Thanh", Tên "Bình", Email "itc.gv9011@tlu.edu.vn", Số điện thoại "0999000011"; chọn Ngành "Công nghệ thông tin", Học hàm / Học vị "ThS.".\n' +
    '3. Bấm "Lưu".',
  expected:
    '1. Đơn vị công tác tự điền "Trường Đại học Thủy lợi"; ô Ngành cho phép chọn (không bị khóa).\n' +
    '2. Gọi POST /teacher với mã ITCGV9011, ngành Công nghệ thông tin, học vị ThS.; HTTP 200, code = 1000, message "Thêm giáo viên thành công".\n' +
    '3. Hiện thông báo "Thêm giáo viên thành công", popup đóng; tìm "ITCGV9011" thấy dòng "Đỗ Thanh Bình".\n' +
    '4. Dữ liệu: giảng viên ITCGV9011 thuộc ngành Công nghệ thông tin, học vị ThS., tài khoản đang hoạt động.',
  precondition: PRE_ADMIN + '; mã ITCGV9011, email itc.gv9011@tlu.edu.vn, SĐT 0999000011 chưa có trong hệ thống',
});

const ITC110 = defineItc({
  id: 'ITC110', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_CREATE,
  description: 'Kiểm tra giao diện chặn lưu khi thêm giảng viên trong trường mà chưa chọn ngành',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Tài khoản giảng viên", bấm "Thêm giảng viên".\n' +
    '2. Nhập Mã giảng viên "ITCGV9012", Họ và tên đệm "Vũ Thị", Tên "Lan", Email "itc.gv9012@tlu.edu.vn", Số điện thoại "0999000012", chọn "ThS.", không chọn Ngành.\n' +
    '3. Bấm "Lưu".',
  expected: '1. Dưới ô Ngành hiển thị "Ngành học không được để trống".\n2. Không gọi POST /teacher; popup vẫn mở.',
  precondition: PRE_ADMIN,
});

const ITC111 = defineItc({
  id: 'ITC111', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_CREATE,
  description: 'Kiểm tra Quản trị viên thêm giảng viên ngoài trường không có ngành',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Tài khoản giảng viên", bấm "Thêm giảng viên".\n' +
    '2. Nhập Mã giảng viên "ITCGV9013", Họ và tên đệm "Hoàng Văn", Tên "Nam", Email "itc.gv9013@gmail.com", Số điện thoại "0999000013", Đơn vị công tác "Trường Đại học Bách khoa Hà Nội"; chọn "TS.".\n' +
    '3. Bấm "Lưu".',
  expected:
    '1. Ô Ngành bị khóa với lựa chọn "-- Không áp dụng cho giảng viên ngoài trường --".\n' +
    '2. Gọi POST /teacher không kèm ngành; HTTP 200, code = 1000, message "Thêm giáo viên thành công".\n' +
    '3. Hiện thông báo "Thêm giáo viên thành công".\n' +
    '4. Dữ liệu: giảng viên ITCGV9013 không thuộc ngành nào, đơn vị "Trường Đại học Bách khoa Hà Nội".',
  precondition: PRE_ADMIN + '; mã ITCGV9013, email itc.gv9013@gmail.com chưa có trong hệ thống',
});

const ITC112 = defineItc({
  id: 'ITC112', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_CREATE,
  description: 'Kiểm tra thêm giảng viên có email trùng với tài khoản của người khác',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Tài khoản giảng viên", bấm "Thêm giảng viên".\n' +
    '2. Nhập Mã giảng viên "ITCGV9014", Họ và tên đệm "Hồ Văn", Tên "Sơn", Email "itc.gv9001@tlu.edu.vn", Số điện thoại "0999000014"; chọn Ngành "Kỹ thuật phần mềm", "ThS.".\n' +
    '3. Bấm "Lưu".',
  expected:
    '1. Gọi POST /teacher; HTTP 409, code = 3014, message "Email trùng với tài khoản đã tồn tại trong hệ thống".\n' +
    '2. Popup vẫn mở và hiển thị "Email trùng với tài khoản đã tồn tại trong hệ thống".\n' +
    '3. Dữ liệu: không có giảng viên ITCGV9014; email itc.gv9001@tlu.edu.vn vẫn thuộc giảng viên ITCGV9001 "Nguyễn Văn Kiểm".',
  precondition: PRE_T1,
});

const ITC113 = defineItc({
  id: 'ITC113', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_CREATE,
  description: 'Kiểm tra giao diện chặn lưu khi đơn vị công tác không khớp với đuôi email',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Tài khoản giảng viên", bấm "Thêm giảng viên".\n' +
    '2. Nhập Mã giảng viên "ITCGV9015", Họ và tên đệm "Bùi Đức", Tên "Long", Email "itc.gv9015@tlu.edu.vn", Số điện thoại "0999000015", Đơn vị công tác "Trường Đại học Bách khoa Hà Nội"; chọn Ngành "Kỹ thuật phần mềm", "ThS.".\n' +
    '3. Bấm "Lưu".',
  expected:
    '1. Dưới ô Đơn vị công tác hiển thị "Đơn vị công tác không khớp với email (email @tlu.edu.vn phải là Trường Đại học Thủy lợi, email @gmail.com phải là trường khác)".\n' +
    '2. Không gọi POST /teacher.',
  precondition: PRE_ADMIN,
});

const ITC114 = defineItc({
  id: 'ITC114', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_UPDATE,
  description: 'Kiểm tra Quản trị viên cập nhật số điện thoại của giảng viên thuộc ngành bất kỳ',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Tài khoản giảng viên".\n' +
    '2. Tìm "ITCGV9004", bấm "Sửa giảng viên".\n3. Đổi Số điện thoại thành "0999000094", bấm "Cập nhật".',
  expected:
    '1. Popup "Cập nhật thông tin giảng viên" điền sẵn mã ITCGV9004, ngành "Công nghệ thông tin".\n' +
    '2. Gọi PUT /teacher/{mã định danh của giảng viên ITCGV9004} với số điện thoại 0999000094; HTTP 200, code = 1000, message "Cập nhật thông tin giảng viên thành công".\n' +
    '3. Hiện thông báo "Cập nhật thông tin giảng viên thành công"; dòng ITCGV9004 hiển thị "0999000094".\n' +
    '4. Dữ liệu: giảng viên ITCGV9004 có số điện thoại 0999000094, vẫn thuộc ngành Công nghệ thông tin.',
  precondition: PRE_T4,
});

const ITC115 = defineItc({
  id: 'ITC115', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_UPDATE,
  description: 'Kiểm tra Quản trị viên chuyển ngành của giảng viên sang ngành khác',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Tài khoản giảng viên".\n' +
    '2. Tìm "ITCGV9004", bấm "Sửa giảng viên".\n3. Chọn Ngành "Kỹ thuật phần mềm", bấm "Cập nhật".',
  expected:
    '1. Gọi PUT /teacher/{mã định danh của giảng viên ITCGV9004} với ngành Kỹ thuật phần mềm; HTTP 200, code = 1000, message "Cập nhật thông tin giảng viên thành công".\n' +
    '2. Hiện thông báo "Cập nhật thông tin giảng viên thành công"; dòng ITCGV9004 hiển thị "Kỹ thuật phần mềm".\n' +
    '3. Dữ liệu: giảng viên ITCGV9004 thuộc ngành Kỹ thuật phần mềm.',
  precondition: PRE_T4,
});

const ITC116 = defineItc({
  id: 'ITC116', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_UPDATE,
  description: 'Kiểm tra cập nhật số điện thoại trùng với tài khoản khác',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Tài khoản giảng viên".\n' +
    '2. Tìm "ITCGV9001", bấm "Sửa giảng viên".\n3. Đổi Số điện thoại thành "0999000003", bấm "Cập nhật".',
  expected:
    '1. Gọi PUT /teacher/{mã định danh của giảng viên ITCGV9001}; HTTP 409, code = 3014, message "Số điện thoại đã tồn tại trong hệ thống".\n' +
    '2. Popup vẫn mở và hiển thị "Số điện thoại đã tồn tại trong hệ thống".\n' +
    '3. Dữ liệu: số điện thoại của ITCGV9001 vẫn là 0999000001.',
  precondition: PRE_T1 + '; giảng viên "Lê Minh Tuấn" (ITCGV9003, SĐT 0999000003) đã có trong hệ thống',
});

const ITC117 = defineItc({
  id: 'ITC117', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_DELETE,
  description: 'Kiểm tra Quản trị viên xóa giảng viên thuộc ngành bất kỳ',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Tài khoản giảng viên".\n' +
    '2. Tìm "ITCGV9004", bấm "Xóa giảng viên".\n3. Trong popup "Xóa giảng viên", bấm "Xác nhận xóa".',
  expected:
    '1. Popup hiển thị "Phạm Quốc Bảo" và mã ITCGV9004.\n' +
    '2. Gọi DELETE /teacher/{mã định danh của giảng viên ITCGV9004}; HTTP 200, code = 1000, message "Xóa giảng viên thành công".\n' +
    '3. Hiện thông báo "Xóa giảng viên thành công"; bảng hiển thị "Không tìm thấy giảng viên nào phù hợp.".\n' +
    '4. Dữ liệu: hồ sơ giảng viên ITCGV9004 và tài khoản itc.gv9004@tlu.edu.vn bị xóa khỏi hệ thống.',
  precondition: PRE_T4 + '; giảng viên chưa được phân công, chưa có đơn đăng ký hay đề tài nào',
});

const ITC118 = defineItc({
  id: 'ITC118', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_IMPORT,
  description: 'Kiểm tra Quản trị viên import giảng viên nhiều ngành, có 1 dòng ngành không tồn tại',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Tài khoản giảng viên", bấm "Import giảng viên".\n' +
    '2. Chọn file giang_vien_admin.xlsx gồm 3 dòng: dòng 2 ITCGV9041 ngành Kỹ thuật phần mềm; dòng 3 ITCGV9042 ngành Công nghệ thông tin; dòng 4 ITCGV9043 ngành "Ngành ABC".\n' +
    '3. Bấm "Import".',
  expected:
    '1. Gọi POST /teacher/import; HTTP 200, code = 1000, message "Xử lý file import hoàn tất"; tổng 3 dòng, 2 thành công, 1 lỗi.\n' +
    '2. Popup "Kết quả import giáo viên" hiển thị "Đã xử lý 3 dòng." và "1 dòng lỗi"; tab "Lỗi" có dòng lý do "Ngành học không tồn tại trong hệ thống"; tab "Thành công" có 2 dòng "Thêm giáo viên thành công".\n' +
    '3. Dữ liệu: ITCGV9041 thuộc ngành Kỹ thuật phần mềm, ITCGV9042 thuộc ngành Công nghệ thông tin; không có ITCGV9043.',
  precondition: PRE_ADMIN + '; mã ITCGV9041–ITCGV9043 chưa có trong hệ thống',
});

const ITC119 = defineItc({
  id: 'ITC119', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_IMPORT,
  description: 'Kiểm tra import file Excel có dòng tiêu đề không đúng mẫu',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Tài khoản giảng viên", bấm "Import giảng viên".\n' +
    '2. Chọn file sai_tieu_de.xlsx có dòng tiêu đề "Họ tên | Địa chỉ" và 1 dòng dữ liệu.\n3. Bấm "Import".',
  expected:
    '1. Gọi POST /teacher/import; HTTP 400, code = 4000, message "Dòng tiêu đề không đúng với file mẫu".\n' +
    '2. Dưới ô chọn file hiển thị "Dòng tiêu đề không đúng với file mẫu"; không chuyển sang màn kết quả.',
  precondition: PRE_ADMIN,
});

const SEC058 = defineItcSec({
  id: 'TC-SEC-058', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Trưởng bộ môn mở thẳng màn hình Tài khoản giảng viên của Quản trị viên',
  roleSession: 'Trưởng bộ môn (HEAD_OF_MAJOR), đã đăng nhập',
  technique: 'EP',
  given: 'Đăng nhập bằng tài khoản Trưởng bộ môn (không có vai trò ADMIN)',
  when: 'Mở thẳng đường dẫn /admin/accounts-lecturer',
  then: 'Bị chuyển về trang chủ Trưởng bộ môn (/department); không hiển thị nút "Import giảng viên" và ô "Tìm theo họ tên, email, SĐT, mã GV..." của màn hình Quản trị viên',
});

const SEC059 = defineItcSec({
  id: 'TC-SEC-059', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Sinh viên mở màn hình Tài khoản giảng viên và gọi API thêm giảng viên',
  roleSession: 'Sinh viên (STUDENT), đã đăng nhập',
  technique: 'EP',
  given: 'Đăng nhập bằng tài khoản Sinh viên',
  when: 'Mở thẳng /admin/accounts-lecturer; gọi POST /teacher (mã ITCGV9051) bằng phiên Sinh viên',
  then: 'Màn hình hiển thị "Tài khoản của bạn không có quyền truy cập cổng cán bộ."; POST /teacher trả HTTP 403, code = 2001; không có giảng viên ITCGV9051 được tạo',
});

const SEC060 = defineItcSec({
  id: 'TC-SEC-060', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Chưa đăng nhập mở màn hình Tài khoản giảng viên và gọi API xóa giảng viên',
  roleSession: 'Chưa đăng nhập (không có cookie phiên)',
  technique: 'EP',
  given: 'Trình duyệt chưa đăng nhập; giảng viên ITCGV9001 đã có trong hệ thống',
  when: 'Mở thẳng /admin/accounts-lecturer; gọi DELETE /teacher/{mã định danh của giảng viên ITCGV9001} không kèm phiên đăng nhập',
  then: 'Bị chuyển về trang đăng nhập (/login); DELETE /teacher trả HTTP 401, code = 2000; giảng viên ITCGV9001 vẫn còn trong hệ thống',
});

// ============================================================================
// DỮ LIỆU & HÀM HỖ TRỢ (API để chuẩn bị / dọn, DB chỉ SELECT)
// ============================================================================

type MajorKey = 'ktpm' | 'cntt' | null;
type SeedTeacher = {
  teacherCode: string; firstName: string; lastName: string; email: string; phone: string;
  organization: string; major: MajorKey; academicTitle: string;
};

const T1: SeedTeacher = { teacherCode: 'ITCGV9001', firstName: 'Nguyễn Văn', lastName: 'Kiểm', email: 'itc.gv9001@tlu.edu.vn', phone: '0999000001', organization: 'Trường Đại học Thủy lợi', major: 'ktpm', academicTitle: 'TS.' };
const T2: SeedTeacher = { teacherCode: 'ITCGV9002', firstName: 'Trần Thị', lastName: 'Hoa', email: 'itc.gv9002@gmail.com', phone: '0999000002', organization: 'Trường Đại học Bách khoa Hà Nội', major: null, academicTitle: 'ThS.' };
const T3: SeedTeacher = { teacherCode: 'ITCGV9003', firstName: 'Lê Minh', lastName: 'Tuấn', email: 'itc.gv9003@tlu.edu.vn', phone: '0999000003', organization: 'Trường Đại học Thủy lợi', major: 'ktpm', academicTitle: 'ThS.' };
const T4: SeedTeacher = { teacherCode: 'ITCGV9004', firstName: 'Phạm Quốc', lastName: 'Bảo', email: 'itc.gv9004@tlu.edu.vn', phone: '0999000004', organization: 'Trường Đại học Thủy lợi', major: 'cntt', academicTitle: 'TS.' };

const majors: Record<'ktpm' | 'cntt', { publicId: string; name: string }> = {} as never;

function requireEmail(role: string): string {
  const email = process.env[`E2E_EMAIL_${role}`];
  if (!email) throw new Error(`Chưa cấu hình E2E_EMAIL_${role} trong .env.e2e`);
  return email;
}

const token = (request: APIRequestContext, role: 'ADMIN' | 'STUDENT') => loginByEmail(request, requireEmail(role));

async function loadMajors(request: APIRequestContext) {
  const admin = await token(request, 'ADMIN');
  const res = await apiCall(request, admin, 'GET', '/major');
  const list: any[] = res.body?.data?.content ?? res.body?.data ?? [];
  const ktpm = list.find((m) => m.code === 'KTPM01');
  const cntt = list.find((m) => m.code === 'CNTT01');
  if (!ktpm || !cntt) throw new Error('Cần có ngành KTPM01 (Kỹ thuật phần mềm) và CNTT01 (Công nghệ thông tin)');
  majors.ktpm = { publicId: ktpm.publicId, name: ktpm.name };
  majors.cntt = { publicId: cntt.publicId, name: cntt.name };
}

async function seed(request: APIRequestContext, ...teachers: SeedTeacher[]) {
  const admin = await token(request, 'ADMIN');
  for (const t of teachers) {
    const res = await apiCall(request, admin, 'POST', '/teacher', {
      data: {
        teacherCode: t.teacherCode, firstName: t.firstName, lastName: t.lastName, email: t.email, phone: t.phone,
        organization: t.organization, majorId: t.major ? majors[t.major].publicId : null, academicTitle: t.academicTitle,
      },
    });
    expect(res.status, `Không tạo được dữ liệu test ${t.teacherCode}: ${JSON.stringify(res.body)}`).toBe(200);
    expect(res.body.code).toBe(1000);
  }
}

async function cleanup(request: APIRequestContext) {
  const rows = await dbSelect<{ id: number }>(
    `SELECT t.id FROM teacher t JOIN account a ON a.id = t.account_id
      WHERE t.teacher_code LIKE ? OR a.email LIKE ?`,
    ['ITCGV9%', 'itc.gv9%'],
  );
  if (rows.length === 0) return;
  const admin = await token(request, 'ADMIN');
  for (const r of rows) {
    const res = await apiCall(request, admin, 'DELETE', `/teacher/${r.id}`);
    expect(res.status, `Không dọn được giảng viên test id=${r.id}`).toBe(200);
  }
}

async function teacherRow(code: string) {
  return dbSelect<{
    id: number; organization: string; major_id: number | null; major_name: string | null;
    title: string | null; email: string; phone: string; first_name: string; last_name: string; status: number;
  }>(
    `SELECT t.id, t.organization, t.major_id, m.name AS major_name, at.abbreviation AS title,
            a.email, a.phone, a.first_name, a.last_name, CAST(a.status AS UNSIGNED) AS status
       FROM teacher t JOIN account a ON a.id = t.account_id
       LEFT JOIN major m ON m.id = t.major_id
       LEFT JOIN academic_title at ON at.id = t.academic_title_id
      WHERE t.teacher_code = ?`,
    [code],
  );
}

const isTeacherPage = (r: Response, check?: (u: URL) => boolean) => {
  if (r.request().method() !== 'GET') return false;
  const u = new URL(r.url());
  return u.pathname.endsWith('/teacher') && u.searchParams.has('page') && (!check || check(u));
};

async function openPage(page: Page) {
  const resPromise = page.waitForResponse((r) => isTeacherPage(r));
  await page.goto(PAGE_URL);
  const res = await resPromise;
  await expect(page.getByRole('button', { name: 'Import giảng viên' })).toBeVisible();
  return res;
}

async function search(page: Page, keyword: string, extra?: (u: URL) => boolean) {
  const resPromise = page.waitForResponse((r) =>
    isTeacherPage(r, (u) => u.searchParams.get('keyword') === keyword && (!extra || extra(u))));
  await page.getByPlaceholder(SEARCH_PLACEHOLDER).fill(keyword);
  return resPromise;
}

const majorFilter = (page: Page) => page.locator('select').filter({ hasText: '-- Tất cả bộ môn --' });
const unitFilter = (page: Page) => page.locator('select').filter({ hasText: '-- Tất cả đơn vị --' });
const rowOf = (page: Page, code: string) => page.getByRole('row').filter({ hasText: code });
const dialogWithHeading = (page: Page, name: string) =>
  page.getByRole('dialog').filter({ has: page.getByRole('heading', { name }) });

async function fillTeacher(dialog: Locator, v: {
  code: string; first: string; last: string; email: string; phone: string; org?: string; major?: string; title: string;
}) {
  await dialog.getByLabel(/^Mã giảng viên/).fill(v.code);
  await dialog.getByLabel(/^Họ và tên đệm/).fill(v.first);
  await dialog.getByLabel(/^Tên/).fill(v.last);
  await dialog.getByLabel(/^Email/).fill(v.email);
  await dialog.getByLabel(/^Số điện thoại/).fill(v.phone);
  if (v.org !== undefined) await dialog.getByLabel(/^Đơn vị công tác/).fill(v.org);
  if (v.major !== undefined) await dialog.getByLabel(/^Ngành/).selectOption(v.major);
  await dialog.getByLabel(/^Học hàm \/ Học vị/).selectOption(v.title);
}

const isCreate = (r: Response) => r.request().method() === 'POST' && new URL(r.url()).pathname.endsWith('/teacher');
const isUpdate = (r: Response) => r.request().method() === 'PUT' && /\/teacher\/[^/]+$/.test(new URL(r.url()).pathname);

function trackPosts(page: Page, suffix: string) {
  const state = { posted: false };
  page.on('request', (r) => { if (r.method() === 'POST' && new URL(r.url()).pathname.endsWith(suffix)) state.posted = true; });
  return state;
}

// ============================================================================
// TEST
// ============================================================================

test.describe('Quản lý giảng viên (Quản trị viên)', () => {
  test.use({ storageState: '.auth/admin.json' });

  test.beforeAll(async ({ request }) => {
    await loadMajors(request);
    await cleanup(request);
  });

  test.afterEach(async ({ request }) => {
    await cleanup(request);
  });

  // ------------------------------------------------------------------ Danh sách
  test.describe(FN_LIST, () => {
    test(ITC103.title, { annotation: ITC103.annotation }, async ({ page, request }) => {
      await seed(request, T1);
      const res = await openPage(page);
      const u = new URL(res.url());
      expect(u.searchParams.get('page')).toBe('0');
      expect(u.searchParams.get('size')).toBe('10');
      expect(u.searchParams.has('majorId')).toBe(false);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.message).toBe('Lấy danh sách giảng viên thành công');
      const content: any[] = body.data.content;
      expect(content[0].teacherCode).toBe('ITCGV9001');

      const dataRows = page.getByRole('row').filter({ has: page.getByRole('button', { name: 'Xem chi tiết' }) });
      await expect(dataRows).toHaveCount(Math.min(10, content.length));
      await expect(dataRows.first()).toContainText('Nguyễn Văn Kiểm');
      await expect(dataRows.first()).toContainText('ITCGV9001');
    });

    test(ITC104.title, { annotation: ITC104.annotation }, async ({ page, request }) => {
      await seed(request, T1);
      await openPage(page);
      const res = await search(page, 'ITCGV9001', (u) => u.searchParams.get('page') === '0');
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.data.content).toHaveLength(1);
      expect(body.data.content[0].teacherCode).toBe('ITCGV9001');

      const dataRows = page.getByRole('row').filter({ has: page.getByRole('button', { name: 'Xem chi tiết' }) });
      await expect(dataRows).toHaveCount(1);
      for (const text of ['TS.', 'Nguyễn Văn Kiểm', 'ITCGV9001', 'itc.gv9001@tlu.edu.vn', '0999000001', majors.ktpm.name, 'Trong trường', 'Hoạt động']) {
        await expect(dataRows.first()).toContainText(text);
      }
    });

    test(ITC105.title, { annotation: ITC105.annotation }, async ({ page, request }) => {
      await seed(request, T1, T4);
      await openPage(page);
      await majorFilter(page).selectOption(majors.cntt.publicId);
      const res = await search(page, 'ITCGV900', (u) => u.searchParams.get('majorId') === majors.cntt.publicId);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.data.content.map((t: any) => t.teacherCode)).toEqual(['ITCGV9004']);
      await expect(rowOf(page, 'ITCGV9004')).toContainText('Phạm Quốc Bảo');
      await expect(rowOf(page, 'ITCGV9001')).toHaveCount(0);
    });

    test(ITC106.title, { annotation: ITC106.annotation }, async ({ page, request }) => {
      await seed(request, T1, T2);
      await openPage(page);
      await unitFilter(page).selectOption('EXTERNAL');
      const res = await search(page, 'ITCGV900', (u) => u.searchParams.get('unitType') === 'EXTERNAL');
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.data.content.map((t: any) => t.teacherCode)).toEqual(['ITCGV9002']);
      const row = rowOf(page, 'ITCGV9002');
      await expect(row).toContainText('Trần Thị Hoa');
      await expect(row).toContainText('Ngoài trường');
      await expect(row).toContainText('Trường Đại học Bách khoa Hà Nội');
      await expect(rowOf(page, 'ITCGV9001')).toHaveCount(0);
    });

    test(ITC107.title, { annotation: ITC107.annotation }, async ({ page }) => {
      await openPage(page);
      const res = await search(page, 'KHONGTONTAI9999');
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      const total = body.data.totalElements ?? body.data.page?.totalElements;
      expect(total).toBe(0);
      await expect(page.getByText('Không tìm thấy giảng viên nào phù hợp.')).toBeVisible();
    });
  });

  // ------------------------------------------------------------------ Chi tiết
  test.describe(FN_DETAIL, () => {
    test(ITC108.title, { annotation: ITC108.annotation }, async ({ page, request }) => {
      await seed(request, T4);
      await openPage(page);
      await search(page, 'ITCGV9004');
      const resPromise = page.waitForResponse((r) =>
        r.request().method() === 'GET' && /\/teacher\/[0-9a-f-]{36}$/.test(new URL(r.url()).pathname));
      await rowOf(page, 'ITCGV9004').getByRole('button', { name: 'Xem chi tiết' }).click();
      const res = await resPromise;
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.data.teacherCode).toBe('ITCGV9004');

      const dialog = dialogWithHeading(page, 'Thông tin giáo viên');
      await expect(dialog).toBeVisible();
      for (const text of ['Phạm Quốc Bảo', 'Trường Đại học Thủy lợi', majors.cntt.name, 'TS.', '0999000004', 'itc.gv9004@tlu.edu.vn']) {
        await expect(dialog.getByText(text, { exact: true })).toBeVisible();
      }
    });
  });

  // ------------------------------------------------------------------ Thêm
  test.describe(FN_CREATE, () => {
    async function openCreate(page: Page) {
      await openPage(page);
      await page.getByRole('button', { name: 'Thêm giảng viên' }).click();
      const dialog = dialogWithHeading(page, 'Thêm giáo viên');
      await expect(dialog).toBeVisible();
      return dialog;
    }

    test(ITC109.title, { annotation: ITC109.annotation }, async ({ page }) => {
      const dialog = await openCreate(page);
      await fillTeacher(dialog, { code: 'ITCGV9011', first: 'Đỗ Thanh', last: 'Bình', email: 'itc.gv9011@tlu.edu.vn', phone: '0999000011', major: majors.cntt.name, title: 'ThS.' });
      await expect(dialog.getByLabel(/^Đơn vị công tác/)).toHaveValue('Trường Đại học Thủy lợi');
      await expect(dialog.getByLabel(/^Ngành/)).toBeEnabled();

      const resPromise = page.waitForResponse(isCreate);
      await dialog.getByRole('button', { name: 'Lưu' }).click();
      const res = await resPromise;
      const sent = res.request().postDataJSON();
      expect(sent.teacherCode).toBe('ITCGV9011');
      expect(sent.majorId).toBe(majors.cntt.publicId);
      expect(sent.academicTitle).toBe('ThS.');
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.message).toBe('Thêm giáo viên thành công');
      await expect(page.getByText('Thêm giáo viên thành công').first()).toBeVisible();
      await expect(dialog).toBeHidden();
      await search(page, 'ITCGV9011');
      await expect(rowOf(page, 'ITCGV9011')).toContainText('Đỗ Thanh Bình');

      const rows = await teacherRow('ITCGV9011');
      expect(rows).toHaveLength(1);
      expect(rows[0].major_name).toBe(majors.cntt.name);
      expect(rows[0].title).toBe('ThS.');
      expect(rows[0].status).toBe(1);
    });

    test(ITC110.title, { annotation: ITC110.annotation }, async ({ page }) => {
      const dialog = await openCreate(page);
      const posts = trackPosts(page, '/teacher');
      await fillTeacher(dialog, { code: 'ITCGV9012', first: 'Vũ Thị', last: 'Lan', email: 'itc.gv9012@tlu.edu.vn', phone: '0999000012', title: 'ThS.' });
      await dialog.getByRole('button', { name: 'Lưu' }).click();
      await expect(dialog.getByText('Ngành học không được để trống', { exact: true })).toBeVisible();
      await expect(dialog).toBeVisible();
      expect(posts.posted).toBe(false);
    });

    test(ITC111.title, { annotation: ITC111.annotation }, async ({ page }) => {
      const dialog = await openCreate(page);
      await fillTeacher(dialog, { code: 'ITCGV9013', first: 'Hoàng Văn', last: 'Nam', email: 'itc.gv9013@gmail.com', phone: '0999000013', org: 'Trường Đại học Bách khoa Hà Nội', title: 'TS.' });
      const major = dialog.getByLabel(/^Ngành/);
      await expect(major).toBeDisabled();
      await expect(major.locator('option:checked')).toHaveText('-- Không áp dụng cho giảng viên ngoài trường --');

      const resPromise = page.waitForResponse(isCreate);
      await dialog.getByRole('button', { name: 'Lưu' }).click();
      const res = await resPromise;
      expect(res.request().postDataJSON().majorId ?? null).toBeNull();
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.message).toBe('Thêm giáo viên thành công');
      await expect(page.getByText('Thêm giáo viên thành công').first()).toBeVisible();

      const rows = await teacherRow('ITCGV9013');
      expect(rows).toHaveLength(1);
      expect(rows[0].major_id).toBeNull();
      expect(rows[0].organization).toBe('Trường Đại học Bách khoa Hà Nội');
    });

    test(ITC112.title, { annotation: ITC112.annotation }, async ({ page, request }) => {
      await seed(request, T1);
      const dialog = await openCreate(page);
      await fillTeacher(dialog, { code: 'ITCGV9014', first: 'Hồ Văn', last: 'Sơn', email: 'itc.gv9001@tlu.edu.vn', phone: '0999000014', major: majors.ktpm.name, title: 'ThS.' });
      const resPromise = page.waitForResponse(isCreate);
      await dialog.getByRole('button', { name: 'Lưu' }).click();
      const res = await resPromise;
      expect(res.status()).toBe(409);
      const body = await res.json();
      expect(body.code).toBe(3014);
      expect(body.message).toBe('Email trùng với tài khoản đã tồn tại trong hệ thống');
      await expect(dialog.getByText('Email trùng với tài khoản đã tồn tại trong hệ thống')).toBeVisible();

      expect(await teacherRow('ITCGV9014')).toHaveLength(0);
      const t1 = await teacherRow('ITCGV9001');
      expect(t1[0].email).toBe('itc.gv9001@tlu.edu.vn');
      expect(`${t1[0].first_name} ${t1[0].last_name}`).toBe('Nguyễn Văn Kiểm');
    });

    test(ITC113.title, { annotation: ITC113.annotation }, async ({ page }) => {
      const dialog = await openCreate(page);
      const posts = trackPosts(page, '/teacher');
      await fillTeacher(dialog, { code: 'ITCGV9015', first: 'Bùi Đức', last: 'Long', email: 'itc.gv9015@tlu.edu.vn', phone: '0999000015', org: 'Trường Đại học Bách khoa Hà Nội', major: majors.ktpm.name, title: 'ThS.' });
      await dialog.getByRole('button', { name: 'Lưu' }).click();
      await expect(dialog.getByText(
        'Đơn vị công tác không khớp với email (email @tlu.edu.vn phải là Trường Đại học Thủy lợi, email @gmail.com phải là trường khác)',
        { exact: true })).toBeVisible();
      expect(posts.posted).toBe(false);
    });
  });

  // ------------------------------------------------------------------ Cập nhật
  test.describe(FN_UPDATE, () => {
    async function openEdit(page: Page, code: string) {
      await openPage(page);
      await search(page, code);
      await rowOf(page, code).getByRole('button', { name: 'Sửa giảng viên' }).click();
      const dialog = dialogWithHeading(page, 'Cập nhật thông tin giảng viên');
      await expect(dialog).toBeVisible();
      return dialog;
    }

    test(ITC114.title, { annotation: ITC114.annotation }, async ({ page, request }) => {
      await seed(request, T4);
      const t4Id = (await teacherRow('ITCGV9004'))[0].id;
      const dialog = await openEdit(page, 'ITCGV9004');
      await expect(dialog.getByLabel(/^Mã giảng viên/)).toHaveValue('ITCGV9004');
      await expect(dialog.getByLabel(/^Ngành/)).toHaveValue(majors.cntt.name);

      await dialog.getByLabel(/^Số điện thoại/).fill('0999000094');
      const resPromise = page.waitForResponse(isUpdate);
      await dialog.getByRole('button', { name: 'Cập nhật' }).click();
      const res = await resPromise;
      expect(new URL(res.url()).pathname.endsWith(`/teacher/${t4Id}`)).toBe(true);
      expect(res.request().postDataJSON().phone).toBe('0999000094');
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.message).toBe('Cập nhật thông tin giảng viên thành công');
      await expect(page.getByText('Cập nhật thông tin giảng viên thành công').first()).toBeVisible();
      await expect(rowOf(page, 'ITCGV9004')).toContainText('0999000094');

      const rows = await teacherRow('ITCGV9004');
      expect(rows[0].phone).toBe('0999000094');
      expect(rows[0].major_name).toBe(majors.cntt.name);
    });

    test(ITC115.title, { annotation: ITC115.annotation }, async ({ page, request }) => {
      await seed(request, T4);
      const dialog = await openEdit(page, 'ITCGV9004');
      await dialog.getByLabel(/^Ngành/).selectOption(majors.ktpm.name);
      const resPromise = page.waitForResponse(isUpdate);
      await dialog.getByRole('button', { name: 'Cập nhật' }).click();
      const res = await resPromise;
      const sent = res.request().postDataJSON();
      expect(sent.majorId).toBe(majors.ktpm.publicId);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.message).toBe('Cập nhật thông tin giảng viên thành công');
      await expect(page.getByText('Cập nhật thông tin giảng viên thành công').first()).toBeVisible();
      await expect(rowOf(page, 'ITCGV9004')).toContainText(majors.ktpm.name);
      expect((await teacherRow('ITCGV9004'))[0].major_name).toBe(majors.ktpm.name);
    });

    test(ITC116.title, { annotation: ITC116.annotation }, async ({ page, request }) => {
      await seed(request, T1, T3);
      const dialog = await openEdit(page, 'ITCGV9001');
      await dialog.getByLabel(/^Số điện thoại/).fill('0999000003');
      const resPromise = page.waitForResponse(isUpdate);
      await dialog.getByRole('button', { name: 'Cập nhật' }).click();
      const res = await resPromise;
      expect(res.status()).toBe(409);
      const body = await res.json();
      expect(body.code).toBe(3014);
      expect(body.message).toBe('Số điện thoại đã tồn tại trong hệ thống');
      await expect(dialog.getByText('Số điện thoại đã tồn tại trong hệ thống')).toBeVisible();
      expect((await teacherRow('ITCGV9001'))[0].phone).toBe('0999000001');
    });
  });

  // ------------------------------------------------------------------ Xóa
  test.describe(FN_DELETE, () => {
    test(ITC117.title, { annotation: ITC117.annotation }, async ({ page, request }) => {
      await seed(request, T4);
      const t4Id = (await teacherRow('ITCGV9004'))[0].id;
      await openPage(page);
      await search(page, 'ITCGV9004');
      await rowOf(page, 'ITCGV9004').getByRole('button', { name: 'Xóa giảng viên' }).click();
      const dialog = page.getByRole('dialog').filter({ hasText: 'Xác nhận xóa tài khoản giảng viên khỏi hệ thống' });
      await expect(dialog).toContainText('Phạm Quốc Bảo');
      await expect(dialog).toContainText('ITCGV9004');

      const resPromise = page.waitForResponse((r) => r.request().method() === 'DELETE' && new URL(r.url()).pathname.endsWith(`/teacher/${t4Id}`));
      await dialog.getByRole('button', { name: 'Xác nhận xóa' }).click();
      const res = await resPromise;
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.message).toBe('Xóa giảng viên thành công');
      await expect(page.getByText('Xóa giảng viên thành công').first()).toBeVisible();
      await expect(page.getByText('Không tìm thấy giảng viên nào phù hợp.')).toBeVisible();

      expect(await teacherRow('ITCGV9004')).toHaveLength(0);
      expect(await dbSelect(`SELECT id FROM account WHERE email = ?`, ['itc.gv9004@tlu.edu.vn'])).toHaveLength(0);
    });
  });

  // ------------------------------------------------------------------ Import
  test.describe(FN_IMPORT, () => {
    async function openImport(page: Page) {
      await openPage(page);
      await page.getByRole('button', { name: 'Import giảng viên' }).click();
      const dialog = dialogWithHeading(page, 'Import danh sách giáo viên');
      await expect(dialog).toBeVisible();
      return dialog;
    }
    const isImport = (r: Response) => r.request().method() === 'POST' && new URL(r.url()).pathname.endsWith('/teacher/import');

    test(ITC118.title, { annotation: ITC118.annotation }, async ({ page }, testInfo) => {
      const header = ['Mã giảng viên', 'Họ và tên đệm', 'Tên', 'Email', 'Số điện thoại', 'Đơn vị công tác', 'Ngành', 'Học hàm / Học vị'];
      const file = writeXlsx(path.join(testInfo.outputDir, 'giang_vien_admin.xlsx'), [
        header,
        ['ITCGV9041', 'Đinh Công', 'Mạnh', 'itc.gv9041@tlu.edu.vn', '0999000041', 'Trường Đại học Thủy lợi', majors.ktpm.name, 'ThS.'],
        ['ITCGV9042', 'Ngô Thị', 'Mai', 'itc.gv9042@tlu.edu.vn', '0999000042', 'Trường Đại học Thủy lợi', majors.cntt.name, 'TS.'],
        ['ITCGV9043', 'Lý Văn', 'Phúc', 'itc.gv9043@tlu.edu.vn', '0999000043', 'Trường Đại học Thủy lợi', 'Ngành ABC', 'ThS.'],
      ]);
      const dialog = await openImport(page);
      await dialog.locator('input[type="file"]').setInputFiles(file);
      const resPromise = page.waitForResponse(isImport);
      await dialog.getByRole('button', { name: 'Import', exact: true }).click();
      const res = await resPromise;
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.message).toBe('Xử lý file import hoàn tất');
      expect(body.data.totalRows).toBe(3);
      expect(body.data.successCount).toBe(2);
      expect(body.data.errorCount).toBe(1);

      const result = dialogWithHeading(page, 'Kết quả import giáo viên');
      await expect(result).toContainText('Đã xử lý 3 dòng.');
      await expect(result).toContainText('1 dòng lỗi');
      await result.getByRole('tab', { name: /Lỗi/ }).click();
      await expect(result.getByRole('row').filter({ hasText: 'Ngành học không tồn tại trong hệ thống' })).toHaveCount(1);
      await result.getByRole('tab', { name: /Thành công/ }).click();
      await expect(result.getByRole('row').filter({ hasText: 'Thêm giáo viên thành công' })).toHaveCount(2);

      expect((await teacherRow('ITCGV9041'))[0]?.major_name).toBe(majors.ktpm.name);
      expect((await teacherRow('ITCGV9042'))[0]?.major_name).toBe(majors.cntt.name);
      expect(await teacherRow('ITCGV9043')).toHaveLength(0);
    });

    test(ITC119.title, { annotation: ITC119.annotation }, async ({ page }, testInfo) => {
      const file = writeXlsx(path.join(testInfo.outputDir, 'sai_tieu_de.xlsx'), [
        ['Họ tên', 'Địa chỉ'],
        ['Nguyễn Văn Test', 'Hà Nội'],
      ]);
      const dialog = await openImport(page);
      await dialog.locator('input[type="file"]').setInputFiles(file);
      const resPromise = page.waitForResponse(isImport);
      await dialog.getByRole('button', { name: 'Import', exact: true }).click();
      const res = await resPromise;
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.code).toBe(4000);
      expect(body.message).toBe('Dòng tiêu đề không đúng với file mẫu');
      await expect(dialog.getByText('Dòng tiêu đề không đúng với file mẫu')).toBeVisible();
      await expect(dialogWithHeading(page, 'Kết quả import giáo viên')).toHaveCount(0);
    });
  });
});

// ------------------------------------------------------------------ Security
test.describe('SecurityTest - Tài khoản giảng viên (Admin)', () => {
  test.beforeAll(async ({ request }) => {
    await loadMajors(request);
    await cleanup(request);
  });
  test.afterEach(async ({ request }) => {
    await cleanup(request);
  });

  test.describe('Trưởng bộ môn', () => {
    test.use({ storageState: '.auth/head_of_major.json' });
    test(SEC058.title, { annotation: SEC058.annotation }, async ({ page }) => {
      await page.goto(PAGE_URL);
      await expect(page).toHaveURL(/\/department$/);
      await expect(page.getByRole('button', { name: 'Import giảng viên' })).toHaveCount(0);
      await expect(page.getByPlaceholder(SEARCH_PLACEHOLDER)).toHaveCount(0);
    });
  });

  test.describe('Sinh viên', () => {
    test.use({ storageState: '.auth/student.json' });
    test(SEC059.title, { annotation: SEC059.annotation }, async ({ page, request }) => {
      await page.goto(PAGE_URL);
      await expect(page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Import giảng viên' })).toHaveCount(0);

      const student = await token(request, 'STUDENT');
      const res = await apiCall(request, student, 'POST', '/teacher', {
        data: {
          teacherCode: 'ITCGV9051', firstName: 'Trịnh Văn', lastName: 'Hải', email: 'itc.gv9051@tlu.edu.vn',
          phone: '0999000051', organization: 'Trường Đại học Thủy lợi', majorId: majors.ktpm.publicId, academicTitle: 'ThS.',
        },
      });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(2001);
      expect(await teacherRow('ITCGV9051')).toHaveLength(0);
    });
  });

  test.describe('Chưa đăng nhập', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test(SEC060.title, { annotation: SEC060.annotation }, async ({ page, request }) => {
      await seed(request, T1);
      const t1Id = (await teacherRow('ITCGV9001'))[0].id;
      await page.goto(PAGE_URL);
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByPlaceholder(SEARCH_PLACEHOLDER)).toHaveCount(0);

      const res = await request.delete(`${getApiBaseUrl()}/teacher/${t1Id}`);
      expect(res.status()).toBe(401);
      expect((await res.json()).code).toBe(2000);
      expect(await teacherRow('ITCGV9001')).toHaveLength(1);
    });
  });
});

