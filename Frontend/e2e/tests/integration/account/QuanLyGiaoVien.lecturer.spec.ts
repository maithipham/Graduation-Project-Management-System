import path from 'node:path';
import { test, expect, type APIRequestContext, type Page, type Response } from '@playwright/test';
import { defineItc, defineItcSec } from '../../../support/integration-test-case';
import { apiCall, loginByEmail } from '../../../support/api';
import { dbSelect } from '../../../support/db';
import { writeXlsx } from '../../../support/xlsx';

// ============================================================================
// ĐẶC TẢ TEST CASE (ITC086..ITC102 & TC-SEC-054..TC-SEC-057)
// Feature: account | Module/Sheet: QuanLyGiaoVien
// Role: Trưởng bộ môn (HEAD_OF_MAJOR) — màn hình "/department/lecturer-management"
// Dữ liệu test: mã GV ITCGV9xxx, email itc.gv9xxx@..., SĐT 0999xxxxxx; dọn bằng API DELETE /teacher/{id} sau mỗi test
// ============================================================================

const FEATURE = 'account';
const MODULE = 'QuanLyGiaoVien';
const SHEET = 'QuanLyGiaoVien';
const PAGE_URL = '/department/lecturer-management';

const FN_LIST = 'Xem danh sách giảng viên';
const FN_DETAIL = 'Xem chi tiết giảng viên';
const FN_CREATE = 'Thêm giảng viên';
const FN_UPDATE = 'Cập nhật giảng viên';
const FN_DELETE = 'Xóa giảng viên';
const FN_IMPORT = 'Import giảng viên';

const PRE_T1 =
  'Trưởng bộ môn phụ trách ngành "Kỹ thuật phần mềm"; giảng viên trong trường "Nguyễn Văn Kiểm" (mã ITCGV9001, itc.gv9001@tlu.edu.vn, 0999000001, TS., ngành Kỹ thuật phần mềm) đã có trong hệ thống';

const ITC086 = defineItc({
  id: 'ITC086', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra mở màn hình Quản lý giảng viên hiển thị danh sách giảng viên thuộc ngành Trưởng bộ môn phụ trách',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn.\n2. Mở màn hình "Quản lý giảng viên".',
  expected:
    '1. Gọi GET /teacher/all kèm bộ lọc ngành "Kỹ thuật phần mềm", HTTP 200, code = 1000, danh sách có giảng viên ITCGV9001.\n' +
    '2. Ô lọc ngành tự chọn "Kỹ thuật phần mềm".\n' +
    '3. Bảng hiển thị dòng "Nguyễn Văn Kiểm" (ITCGV9001, itc.gv9001@tlu.edu.vn).',
  precondition: PRE_T1,
});

const ITC087 = defineItc({
  id: 'ITC087', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra tìm kiếm giảng viên theo mã giảng viên',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Quản lý giảng viên".\n2. Nhập "ITCGV9001" vào ô "Tìm theo tên, email...".',
  expected:
    '1. Gọi GET /teacher/all với keyword = "ITCGV9001", HTTP 200, code = 1000, trả về đúng 1 giảng viên mã ITCGV9001.\n' +
    '2. Bảng chỉ còn 1 dòng "Nguyễn Văn Kiểm" (ITCGV9001).',
  precondition: PRE_T1,
});

const ITC088 = defineItc({
  id: 'ITC088', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra hiển thị trạng thái rỗng khi từ khóa tìm kiếm không khớp giảng viên nào',
  procedure: '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Quản lý giảng viên".\n2. Nhập "KHONGTONTAI9999" vào ô "Tìm theo tên, email...".',
  expected:
    '1. Gọi GET /teacher/all với keyword = "KHONGTONTAI9999", HTTP 200, code = 1000, danh sách rỗng.\n' +
    '2. Bảng hiển thị "Không tìm thấy giáo viên nào".',
  precondition: 'Không có giảng viên nào khớp từ khóa "KHONGTONTAI9999"',
});

const ITC089 = defineItc({
  id: 'ITC089', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra lọc giảng viên ngoài trường khi chọn "Tất cả ngành" và đơn vị "Ngoài trường"',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Quản lý giảng viên".\n' +
    '2. Chọn ngành "Tất cả ngành", chọn đơn vị "Ngoài trường".\n' +
    '3. Nhập "ITCGV900" vào ô tìm kiếm.',
  expected:
    '1. Gọi GET /teacher/all với unitType = EXTERNAL, keyword = "ITCGV900", không gửi bộ lọc ngành, HTTP 200, code = 1000; chỉ trả về giảng viên ITCGV9002.\n' +
    '2. Bảng hiển thị "Trần Thị Hoa" (ITCGV9002), không hiển thị "Nguyễn Văn Kiểm" (ITCGV9001).',
  precondition:
    PRE_T1 + '; giảng viên ngoài trường "Trần Thị Hoa" (ITCGV9002, itc.gv9002@gmail.com, Trường Đại học Bách khoa Hà Nội, không có ngành) đã có trong hệ thống',
});

const ITC090 = defineItc({
  id: 'ITC090', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_DETAIL,
  description: 'Kiểm tra xem chi tiết thông tin một giảng viên',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Quản lý giảng viên".\n' +
    '2. Bấm nút "Xem chi tiết" trên dòng giảng viên ITCGV9001.',
  expected:
    '1. Gọi GET /teacher/{mã định danh của giảng viên ITCGV9001}, HTTP 200, code = 1000, dữ liệu có mã ITCGV9001, email itc.gv9001@tlu.edu.vn.\n' +
    '2. Popup "Thông tin giáo viên" hiển thị: "Nguyễn Văn Kiểm", "Trường Đại học Thủy lợi", "Kỹ thuật phần mềm", "TS.", "0999000001", "itc.gv9001@tlu.edu.vn".',
  precondition: PRE_T1,
});

const ITC091 = defineItc({
  id: 'ITC091', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_CREATE,
  description: 'Kiểm tra thêm thủ công một giảng viên trong trường với thông tin hợp lệ',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Quản lý giảng viên", bấm "Thêm giảng viên".\n' +
    '2. Nhập Mã giảng viên "ITCGV9011", Họ và tên đệm "Đỗ Thanh", Tên "Bình", Email "itc.gv9011@tlu.edu.vn", Số điện thoại "0999000011"; chọn Học hàm / Học vị "ThS.".\n' +
    '3. Bấm "Lưu".',
  expected:
    '1. Đơn vị công tác tự điền "Trường Đại học Thủy lợi", Ngành cố định "Kỹ thuật phần mềm".\n' +
    '2. Gọi POST /teacher với mã ITCGV9011, email itc.gv9011@tlu.edu.vn, ngành Kỹ thuật phần mềm, học vị ThS.; HTTP 200, code = 1000, message "Thêm giáo viên thành công".\n' +
    '3. Hiện thông báo "Thêm giáo viên thành công", popup đóng, bảng có dòng "Đỗ Thanh Bình" (ITCGV9011).\n' +
    '4. Dữ liệu: giảng viên ITCGV9011 thuộc ngành Kỹ thuật phần mềm, học vị ThS., tài khoản đang hoạt động và có vai trò Giảng viên (LECTURER).',
  precondition: 'Trưởng bộ môn phụ trách ngành "Kỹ thuật phần mềm"; mã ITCGV9011, email itc.gv9011@tlu.edu.vn, SĐT 0999000011 chưa có trong hệ thống',
});

const ITC092 = defineItc({
  id: 'ITC092', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_CREATE,
  description: 'Kiểm tra thêm thủ công một giảng viên ngoài trường (email @gmail.com) không có ngành',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Quản lý giảng viên", bấm "Thêm giảng viên".\n' +
    '2. Nhập Mã giảng viên "ITCGV9012", Họ và tên đệm "Vũ Thị", Tên "Lan", Email "itc.gv9012@gmail.com", Số điện thoại "0999000012", Đơn vị công tác "Trường Đại học Bách khoa Hà Nội"; chọn Học hàm / Học vị "TS.".\n' +
    '3. Bấm "Lưu".',
  expected:
    '1. Ô Ngành bị khóa với lựa chọn "-- Không áp dụng cho giảng viên ngoài trường --".\n' +
    '2. Gọi POST /teacher với email itc.gv9012@gmail.com, đơn vị "Trường Đại học Bách khoa Hà Nội", không có ngành; HTTP 200, code = 1000, message "Thêm giáo viên thành công".\n' +
    '3. Hiện thông báo "Thêm giáo viên thành công".\n' +
    '4. Dữ liệu: giảng viên ITCGV9012 không thuộc ngành nào, đơn vị công tác "Trường Đại học Bách khoa Hà Nội".',
  precondition: 'Mã ITCGV9012, email itc.gv9012@gmail.com, SĐT 0999000012 chưa có trong hệ thống',
});

const ITC093 = defineItc({
  id: 'ITC093', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_CREATE,
  description: 'Kiểm tra giao diện chặn lưu khi để trống các trường bắt buộc trong form Thêm giảng viên',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Quản lý giảng viên", bấm "Thêm giảng viên".\n' +
    '2. Để trống toàn bộ các ô, bấm "Lưu".',
  expected:
    '1. Không gọi POST /teacher.\n' +
    '2. Form hiển thị các lỗi: "Mã giảng viên không được để trống", "Họ không được để trống", "Tên không được để trống", "Email không được để trống", "Số điện thoại không được để trống", "Đơn vị công tác không được để trống", "Vui lòng chọn học hàm / học vị".',
  precondition: 'Trưởng bộ môn đã đăng nhập',
});

const ITC094 = defineItc({
  id: 'ITC094', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_CREATE,
  description: 'Kiểm tra thêm giảng viên khi mã giảng viên đã tồn tại trong hệ thống',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Quản lý giảng viên", bấm "Thêm giảng viên".\n' +
    '2. Nhập Mã giảng viên "ITCGV9001", Họ và tên đệm "Hoàng Văn", Tên "Nam", Email "itc.gv9013@tlu.edu.vn", Số điện thoại "0999000013"; chọn "ThS.".\n' +
    '3. Bấm "Lưu".',
  expected:
    '1. Gọi POST /teacher, HTTP 409, code = 3015, message "Mã giảng viên đã tồn tại trong hệ thống".\n' +
    '2. Form vẫn mở và hiển thị "Mã giảng viên đã tồn tại trong hệ thống".\n' +
    '3. Dữ liệu: không tạo tài khoản với email itc.gv9013@tlu.edu.vn; mã ITCGV9001 vẫn chỉ có 1 giảng viên.',
  precondition: PRE_T1,
});

const ITC095 = defineItc({
  id: 'ITC095', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_CREATE,
  description: 'Kiểm tra thêm giảng viên trùng email và họ tên với giảng viên đang hoạt động thì chỉ cảnh báo, không thay đổi dữ liệu',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Quản lý giảng viên", bấm "Thêm giảng viên".\n' +
    '2. Nhập Mã giảng viên "ITCGV9014", Họ và tên đệm "Nguyễn Văn", Tên "Kiểm", Email "itc.gv9001@tlu.edu.vn", Số điện thoại "0999000001"; chọn "TS.".\n' +
    '3. Bấm "Lưu".',
  expected:
    '1. Gọi POST /teacher, HTTP 200, code = 1100, message "Giáo viên đã có trong hệ thống, thông tin không thay đổi".\n' +
    '2. Hiện thông báo cảnh báo "Giáo viên đã có trong hệ thống, thông tin không thay đổi", popup đóng.\n' +
    '3. Dữ liệu: không có giảng viên mã ITCGV9014; email itc.gv9001@tlu.edu.vn vẫn thuộc giảng viên ITCGV9001.',
  precondition: PRE_T1,
});

const ITC096 = defineItc({
  id: 'ITC096', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_CREATE,
  description: 'Kiểm tra thêm giảng viên khi số điện thoại trùng với tài khoản khác',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Quản lý giảng viên", bấm "Thêm giảng viên".\n' +
    '2. Nhập Mã giảng viên "ITCGV9015", Họ và tên đệm "Bùi Đức", Tên "Long", Email "itc.gv9015@tlu.edu.vn", Số điện thoại "0999000001"; chọn "ThS.".\n' +
    '3. Bấm "Lưu".',
  expected:
    '1. Gọi POST /teacher, HTTP 409, code = 3014, message "Số điện thoại trùng với tài khoản đã tồn tại trong hệ thống".\n' +
    '2. Form vẫn mở và hiển thị "Số điện thoại trùng với tài khoản đã tồn tại trong hệ thống".\n' +
    '3. Dữ liệu: không có giảng viên mã ITCGV9015.',
  precondition: PRE_T1,
});

const ITC097 = defineItc({
  id: 'ITC097', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_UPDATE,
  description: 'Kiểm tra cập nhật số điện thoại và học hàm của giảng viên thuộc ngành mình phụ trách',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Quản lý giảng viên".\n' +
    '2. Bấm "Sửa giảng viên" trên dòng ITCGV9001.\n' +
    '3. Đổi Số điện thoại thành "0999000091", chọn Học hàm / Học vị "PGS.TS.", bấm "Cập nhật".',
  expected:
    '1. Popup "Cập nhật thông tin giảng viên" điền sẵn mã ITCGV9001, email itc.gv9001@tlu.edu.vn.\n' +
    '2. Gọi PUT /teacher/{mã định danh của giảng viên ITCGV9001} với số điện thoại 0999000091, học hàm PGS.TS.; HTTP 200, code = 1000, message "Cập nhật thông tin giảng viên thành công".\n' +
    '3. Hiện thông báo "Cập nhật thông tin giảng viên thành công", popup đóng.\n' +
    '4. Dữ liệu: giảng viên ITCGV9001 có số điện thoại 0999000091 và học hàm PGS.TS.',
  precondition: PRE_T1,
});

const ITC098 = defineItc({
  id: 'ITC098', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_UPDATE,
  description: 'Kiểm tra cập nhật email giảng viên trùng email của tài khoản khác',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Quản lý giảng viên".\n' +
    '2. Bấm "Sửa giảng viên" trên dòng ITCGV9001.\n' +
    '3. Đổi Email thành "itc.gv9003@tlu.edu.vn", bấm "Cập nhật".',
  expected:
    '1. Gọi PUT /teacher/{mã định danh của giảng viên ITCGV9001}, HTTP 409, code = 3001, message "Email đã tồn tại trong hệ thống".\n' +
    '2. Popup vẫn mở và hiển thị "Email đã tồn tại trong hệ thống".\n' +
    '3. Dữ liệu: email của giảng viên ITCGV9001 vẫn là itc.gv9001@tlu.edu.vn.',
  precondition: PRE_T1 + '; giảng viên "Lê Minh Tuấn" (ITCGV9003, itc.gv9003@tlu.edu.vn) đã có trong hệ thống',
});

const ITC099 = defineItc({
  id: 'ITC099', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_UPDATE,
  description: 'Kiểm tra cập nhật mã giảng viên trùng mã của giảng viên khác',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Quản lý giảng viên".\n' +
    '2. Bấm "Sửa giảng viên" trên dòng ITCGV9001.\n' +
    '3. Đổi Mã giảng viên thành "ITCGV9003", bấm "Cập nhật".',
  expected:
    '1. Gọi PUT /teacher/{mã định danh của giảng viên ITCGV9001}, HTTP 409, code = 3015, message "Mã giảng viên đã tồn tại trong hệ thống".\n' +
    '2. Popup vẫn mở và hiển thị "Mã giảng viên đã tồn tại trong hệ thống".\n' +
    '3. Dữ liệu: giảng viên email itc.gv9001@tlu.edu.vn vẫn có mã ITCGV9001.',
  precondition: PRE_T1 + '; giảng viên "Lê Minh Tuấn" (ITCGV9003) đã có trong hệ thống',
});

const ITC100 = defineItc({
  id: 'ITC100', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_DELETE,
  description: 'Kiểm tra xóa giảng viên chưa có sinh viên hướng dẫn và dữ liệu đồ án liên quan',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Quản lý giảng viên".\n' +
    '2. Bấm "Xóa giảng viên" trên dòng ITCGV9001.\n' +
    '3. Trong popup "Xóa giảng viên", bấm "Xác nhận xóa".',
  expected:
    '1. Popup "Xóa giảng viên" hiển thị "Nguyễn Văn Kiểm" và mã ITCGV9001.\n' +
    '2. Gọi DELETE /teacher/{mã định danh của giảng viên ITCGV9001}, HTTP 200, code = 1000, message "Xóa giảng viên thành công".\n' +
    '3. Hiện thông báo "Xóa giảng viên thành công", dòng ITCGV9001 biến mất khỏi bảng.\n' +
    '4. Dữ liệu: hồ sơ giảng viên ITCGV9001 và tài khoản itc.gv9001@tlu.edu.vn bị xóa khỏi hệ thống.',
  precondition: PRE_T1 + '; giảng viên chưa được phân công, chưa có đơn đăng ký hay đề tài nào',
});

const ITC101 = defineItc({
  id: 'ITC101', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_IMPORT,
  description: 'Kiểm tra import file Excel gồm 1 dòng hợp lệ và 1 dòng sai số điện thoại',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Quản lý giảng viên", bấm "Import File".\n' +
    '2. Chọn file giang_vien_itc.xlsx gồm 2 dòng: dòng 2 hợp lệ (ITCGV9021, "Đinh Công Mạnh", itc.gv9021@tlu.edu.vn, 0999000021, Kỹ thuật phần mềm, ThS.); dòng 3 có số điện thoại "12345" (ITCGV9022).\n' +
    '3. Bấm "Import".',
  expected:
    '1. Gọi POST /teacher/import, HTTP 200, code = 1000, message "Xử lý file import hoàn tất"; tổng 2 dòng, 1 thành công, 1 lỗi.\n' +
    '2. Popup "Kết quả import giáo viên" hiển thị "Đã xử lý 2 dòng." và "1 dòng lỗi"; tab "Lỗi" có dòng 3 với lý do "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0"; tab "Thành công" có dòng 2 "Thêm giáo viên thành công".\n' +
    '3. Dữ liệu: có giảng viên ITCGV9021 thuộc ngành Kỹ thuật phần mềm; không có giảng viên ITCGV9022.',
  precondition: 'Trưởng bộ môn phụ trách ngành "Kỹ thuật phần mềm"; mã ITCGV9021, ITCGV9022 chưa có trong hệ thống',
});

const ITC102 = defineItc({
  id: 'ITC102', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_IMPORT,
  description: 'Kiểm tra giao diện chặn import khi chọn file không phải định dạng .xlsx',
  procedure:
    '1. Đăng nhập vai trò Trưởng bộ môn, mở màn hình "Quản lý giảng viên", bấm "Import File".\n' +
    '2. Chọn file giang_vien.docx.',
  expected:
    '1. Hiển thị lỗi "File import phải có định dạng .xlsx" dưới ô chọn file.\n' +
    '2. Không gọi POST /teacher/import.',
  precondition: 'Trưởng bộ môn đã đăng nhập',
});

const SEC054 = defineItcSec({
  id: 'TC-SEC-054', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Chưa đăng nhập mở thẳng màn hình Quản lý giảng viên',
  roleSession: 'Chưa đăng nhập (không có cookie phiên)',
  technique: 'EP',
  given: 'Trình duyệt chưa đăng nhập',
  when: 'Mở thẳng đường dẫn màn hình "Quản lý giảng viên" (/department/lecturer-management); gọi GET /teacher/all không kèm phiên đăng nhập',
  then: 'Bị chuyển về trang đăng nhập (/login), không hiển thị danh sách giảng viên; GET /teacher/all trả HTTP 401, code = 2000',
});

const SEC055 = defineItcSec({
  id: 'TC-SEC-055', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Sinh viên mở thẳng màn hình Quản lý giảng viên',
  roleSession: 'Sinh viên (STUDENT), đã đăng nhập',
  technique: 'EP',
  given: 'Đăng nhập bằng tài khoản Sinh viên',
  when: 'Mở thẳng đường dẫn màn hình "Quản lý giảng viên" của Trưởng bộ môn; gọi GET /teacher/all bằng phiên Sinh viên',
  then: 'Màn hình hiển thị "Tài khoản của bạn không có quyền truy cập cổng cán bộ.", không thấy nút "Thêm giảng viên" và danh sách giảng viên; GET /teacher/all trả HTTP 403, code = 2001, không trả dữ liệu',
});

const SEC056 = defineItcSec({
  id: 'TC-SEC-056', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Trưởng bộ môn cập nhật giảng viên thuộc ngành khác',
  roleSession: 'Trưởng bộ môn (HEAD_OF_MAJOR) ngành Kỹ thuật phần mềm',
  technique: 'DECISION_TABLE',
  given: 'Giảng viên "Phạm Quốc Bảo" (ITCGV9004, 0999000004) thuộc ngành "Công nghệ thông tin" đã có trong hệ thống',
  when: 'Chọn ngành "Công nghệ thông tin" ở bộ lọc, bấm "Sửa giảng viên" trên dòng ITCGV9004, đổi số điện thoại thành 0999000094, bấm "Cập nhật" (PUT /teacher/{id})',
  then: 'HTTP 403, code = 3019, popup hiển thị "Giáo viên thuộc ngành khác, bạn không có quyền cập nhật"; số điện thoại của ITCGV9004 vẫn là 0999000004',
});

const SEC057 = defineItcSec({
  id: 'TC-SEC-057', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Trưởng bộ môn xóa giảng viên thuộc ngành khác',
  roleSession: 'Trưởng bộ môn (HEAD_OF_MAJOR) ngành Kỹ thuật phần mềm',
  technique: 'DECISION_TABLE',
  given: 'Giảng viên "Phạm Quốc Bảo" (ITCGV9004) thuộc ngành "Công nghệ thông tin" đã có trong hệ thống',
  when: 'Chọn ngành "Công nghệ thông tin" ở bộ lọc, bấm "Xóa giảng viên" trên dòng ITCGV9004, bấm "Xác nhận xóa" (DELETE /teacher/{id})',
  then: 'HTTP 403, code = 3019, hiện thông báo lỗi "Giáo viên thuộc ngành khác, bạn không có quyền cập nhật"; giảng viên ITCGV9004 vẫn còn trong hệ thống',
});

// ============================================================================
// DỮ LIỆU & HÀM HỖ TRỢ (chỉ dùng API để chuẩn bị / dọn, DB chỉ SELECT)
// ============================================================================

type SeedTeacher = {
  teacherCode: string; firstName: string; lastName: string; email: string; phone: string;
  organization: string; majorKey: 'own' | 'other' | null; academicTitle: string;
};

const T1: SeedTeacher = { teacherCode: 'ITCGV9001', firstName: 'Nguyễn Văn', lastName: 'Kiểm', email: 'itc.gv9001@tlu.edu.vn', phone: '0999000001', organization: 'Trường Đại học Thủy lợi', majorKey: 'own', academicTitle: 'TS.' };
const T2: SeedTeacher = { teacherCode: 'ITCGV9002', firstName: 'Trần Thị', lastName: 'Hoa', email: 'itc.gv9002@gmail.com', phone: '0999000002', organization: 'Trường Đại học Bách khoa Hà Nội', majorKey: null, academicTitle: 'ThS.' };
const T3: SeedTeacher = { teacherCode: 'ITCGV9003', firstName: 'Lê Minh', lastName: 'Tuấn', email: 'itc.gv9003@tlu.edu.vn', phone: '0999000003', organization: 'Trường Đại học Thủy lợi', majorKey: 'own', academicTitle: 'ThS.' };
const T4: SeedTeacher = { teacherCode: 'ITCGV9004', firstName: 'Phạm Quốc', lastName: 'Bảo', email: 'itc.gv9004@tlu.edu.vn', phone: '0999000004', organization: 'Trường Đại học Thủy lợi', majorKey: 'other', academicTitle: 'TS.' };

let ownMajor: { publicId: string; name: string };
let otherMajor: { publicId: string; name: string };

function requireEmail(role: string): string {
  const email = process.env[`E2E_EMAIL_${role}`];
  if (!email) throw new Error(`Chưa cấu hình E2E_EMAIL_${role} trong .env.e2e`);
  return email;
}

async function token(request: APIRequestContext, role: 'HEAD_OF_MAJOR' | 'ADMIN' | 'STUDENT') {
  return loginByEmail(request, requireEmail(role));
}

async function loadMajors(request: APIRequestContext) {
  const hm = await token(request, 'HEAD_OF_MAJOR');
  const mm = await apiCall(request, hm, 'GET', '/teacher/managed-major');
  expect(mm.status, 'Trưởng bộ môn phải phụ trách 1 ngành').toBe(200);
  ownMajor = { publicId: mm.body.data.publicId, name: mm.body.data.name };
  const majors = await apiCall(request, hm, 'GET', '/major');
  const list: any[] = majors.body?.data?.content ?? majors.body?.data ?? [];
  const other = list.find((m) => m.publicId !== ownMajor.publicId);
  if (!other) throw new Error('Cần ít nhất 1 ngành khác ngành của Trưởng bộ môn');
  otherMajor = { publicId: other.publicId, name: other.name };
}

async function seed(request: APIRequestContext, ...teachers: SeedTeacher[]) {
  const admin = await token(request, 'ADMIN');
  for (const t of teachers) {
    const majorId = t.majorKey === 'own' ? ownMajor.publicId : t.majorKey === 'other' ? otherMajor.publicId : null;
    const res = await apiCall(request, admin, 'POST', '/teacher', {
      data: {
        teacherCode: t.teacherCode, firstName: t.firstName, lastName: t.lastName, email: t.email,
        phone: t.phone, organization: t.organization, majorId, academicTitle: t.academicTitle,
      },
    });
    expect(res.status, `Không tạo được dữ liệu test ${t.teacherCode}: ${JSON.stringify(res.body)}`).toBe(200);
    expect(res.body.code).toBe(1000);
  }
}

// Xóa mọi giảng viên test (mã ITCGV9xxx hoặc email itc.gv9xxx) bằng API của Admin
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
  const rows = await dbSelect<{
    id: number; teacher_code: string; organization: string; major_id: number | null;
    major_name: string | null; title: string | null; email: string; phone: string; status: number;
  }>(
    `SELECT t.id, t.teacher_code, t.organization, t.major_id, m.name AS major_name, at.abbreviation AS title,
            a.email, a.phone, CAST(a.status AS UNSIGNED) AS status
       FROM teacher t JOIN account a ON a.id = t.account_id
       LEFT JOIN major m ON m.id = t.major_id
       LEFT JOIN academic_title at ON at.id = t.academic_title_id
      WHERE t.teacher_code = ?`,
    [code],
  );
  return rows;
}

const isTeacherAll = (r: Response, check?: (u: URL) => boolean) => {
  if (r.request().method() !== 'GET') return false;
  const u = new URL(r.url());
  return u.pathname.endsWith('/teacher/all') && (!check || check(u));
};

async function openPage(page: Page) {
  const listResponse = page.waitForResponse((r) => isTeacherAll(r, (u) => u.searchParams.has('majorId')));
  await page.goto(PAGE_URL);
  const res = await listResponse;
  await expect(page.getByRole('button', { name: 'Thêm giảng viên' })).toBeVisible();
  return res;
}

async function search(page: Page, keyword: string) {
  const resPromise = page.waitForResponse((r) => isTeacherAll(r, (u) => u.searchParams.get('keyword') === keyword));
  await page.getByLabel('Tìm kiếm giáo viên').fill(keyword);
  return resPromise;
}

const rowOf = (page: Page, code: string) => page.getByRole('row').filter({ hasText: code });

// ============================================================================
// TEST
// ============================================================================

test.describe('Quản lý giảng viên (Trưởng bộ môn)', () => {
  test.use({ storageState: '.auth/head_of_major.json' });

  test.beforeAll(async ({ request }) => {
    await loadMajors(request);
    await cleanup(request);
  });

  test.afterEach(async ({ request }) => {
    await cleanup(request);
  });

  // ------------------------------------------------------------------ Danh sách
  test.describe(FN_LIST, () => {
    test(ITC086.title, { annotation: ITC086.annotation }, async ({ page, request }) => {
      await seed(request, T1);
      const res = await openPage(page);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(new URL(res.url()).searchParams.get('majorId')).toBe(ownMajor.publicId);
      expect(body.data.some((t: any) => t.teacherCode === 'ITCGV9001')).toBe(true);

      await expect(page.getByLabel('Lọc theo ngành')).toHaveValue(ownMajor.publicId);
      await page.getByLabel('Tìm kiếm giáo viên').fill('ITCGV9001');
      const row = rowOf(page, 'ITCGV9001');
      await expect(row).toBeVisible();
      await expect(row).toContainText('Nguyễn Văn Kiểm');
      await expect(row).toContainText('itc.gv9001@tlu.edu.vn');
    });

    test(ITC087.title, { annotation: ITC087.annotation }, async ({ page, request }) => {
      await seed(request, T1);
      await openPage(page);
      const res = await search(page, 'ITCGV9001');
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].teacherCode).toBe('ITCGV9001');

      const dataRows = page.getByRole('row').filter({ has: page.getByRole('button', { name: 'Xem chi tiết' }) });
      await expect(dataRows).toHaveCount(1);
      await expect(dataRows.first()).toContainText('Nguyễn Văn Kiểm');
      await expect(dataRows.first()).toContainText('ITCGV9001');
    });

    test(ITC088.title, { annotation: ITC088.annotation }, async ({ page }) => {
      await openPage(page);
      const res = await search(page, 'KHONGTONTAI9999');
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.data).toHaveLength(0);
      await expect(page.getByText('Không tìm thấy giáo viên nào')).toBeVisible();
    });

    test(ITC089.title, { annotation: ITC089.annotation }, async ({ page, request }) => {
      await seed(request, T1, T2);
      await openPage(page);
      await page.getByLabel('Lọc theo ngành').selectOption('');
      await page.getByLabel('Lọc theo đơn vị công tác').selectOption('EXTERNAL');
      const resPromise = page.waitForResponse((r) =>
        isTeacherAll(r, (u) => u.searchParams.get('keyword') === 'ITCGV900' && u.searchParams.get('unitType') === 'EXTERNAL'));
      await page.getByLabel('Tìm kiếm giáo viên').fill('ITCGV900');
      const res = await resPromise;
      expect(res.status()).toBe(200);
      expect(new URL(res.url()).searchParams.has('majorId')).toBe(false);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.data.map((t: any) => t.teacherCode)).toEqual(['ITCGV9002']);

      await expect(rowOf(page, 'ITCGV9002')).toContainText('Trần Thị Hoa');
      await expect(rowOf(page, 'ITCGV9001')).toHaveCount(0);
    });
  });

  // ------------------------------------------------------------------ Chi tiết
  test.describe(FN_DETAIL, () => {
    test(ITC090.title, { annotation: ITC090.annotation }, async ({ page, request }) => {
      await seed(request, T1);
      await openPage(page);
      await search(page, 'ITCGV9001');
      const detailPromise = page.waitForResponse((r) =>
        r.request().method() === 'GET' && /\/teacher\/[0-9a-f-]{36}$/.test(new URL(r.url()).pathname));
      await rowOf(page, 'ITCGV9001').getByRole('button', { name: 'Xem chi tiết' }).click();
      const res = await detailPromise;
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.data.teacherCode).toBe('ITCGV9001');
      expect(body.data.email).toBe('itc.gv9001@tlu.edu.vn');

      const dialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: /Thông tin giáo viên/ }) });
      await expect(dialog).toBeVisible();
      for (const text of ['Nguyễn Văn Kiểm', 'Trường Đại học Thủy lợi', ownMajor.name, 'TS.', '0999000001', 'itc.gv9001@tlu.edu.vn']) {
        await expect(dialog.getByText(text, { exact: true })).toBeVisible();
      }
    });
  });

  // ------------------------------------------------------------------ Thêm
  test.describe(FN_CREATE, () => {
    async function openCreate(page: Page) {
      await openPage(page);
      await page.getByRole('button', { name: 'Thêm giảng viên' }).first().click();
      const dialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Thêm giáo viên' }) });
      await expect(dialog).toBeVisible();
      return dialog;
    }

    async function fillTeacher(dialog: ReturnType<Page['getByRole']>, v: {
      code: string; first: string; last: string; email: string; phone: string; org?: string; title: string;
    }) {
      await dialog.getByLabel(/^Mã giảng viên/).fill(v.code);
      await dialog.getByLabel(/^Họ và tên đệm/).fill(v.first);
      await dialog.getByLabel(/^Tên/).fill(v.last);
      await dialog.getByLabel(/^Email/).fill(v.email);
      await dialog.getByLabel(/^Số điện thoại/).fill(v.phone);
      if (v.org !== undefined) await dialog.getByLabel(/^Đơn vị công tác/).fill(v.org);
      await dialog.getByLabel(/^Học hàm \/ Học vị/).selectOption(v.title);
    }

    const isCreate = (r: Response) => r.request().method() === 'POST' && new URL(r.url()).pathname.endsWith('/teacher');

    test(ITC091.title, { annotation: ITC091.annotation }, async ({ page }) => {
      const dialog = await openCreate(page);
      await fillTeacher(dialog, { code: 'ITCGV9011', first: 'Đỗ Thanh', last: 'Bình', email: 'itc.gv9011@tlu.edu.vn', phone: '0999000011', title: 'ThS.' });
      await expect(dialog.getByLabel(/^Đơn vị công tác/)).toHaveValue('Trường Đại học Thủy lợi');
      await expect(dialog.getByLabel(/^Ngành/)).toHaveValue(ownMajor.name);

      const resPromise = page.waitForResponse(isCreate);
      await dialog.getByRole('button', { name: 'Lưu' }).click();
      const res = await resPromise;
      const sent = res.request().postDataJSON();
      expect(sent.teacherCode).toBe('ITCGV9011');
      expect(sent.email).toBe('itc.gv9011@tlu.edu.vn');
      expect(sent.majorId).toBe(ownMajor.publicId);
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
      expect(rows[0].major_name).toBe(ownMajor.name);
      expect(rows[0].title).toBe('ThS.');
      expect(rows[0].status).toBe(1);
      const roles = await dbSelect<{ role_name: string }>(
        `SELECT ur.role_name FROM user_role ur JOIN account a ON a.id = ur.user_id WHERE a.email = ?`,
        ['itc.gv9011@tlu.edu.vn']);
      expect(roles.map((r) => r.role_name)).toContain('LECTURER');
    });

    test(ITC092.title, { annotation: ITC092.annotation }, async ({ page }) => {
      const dialog = await openCreate(page);
      await fillTeacher(dialog, { code: 'ITCGV9012', first: 'Vũ Thị', last: 'Lan', email: 'itc.gv9012@gmail.com', phone: '0999000012', org: 'Trường Đại học Bách khoa Hà Nội', title: 'TS.' });
      const major = dialog.getByLabel(/^Ngành/);
      await expect(major).toBeDisabled();
      await expect(major.locator('option:checked')).toHaveText('-- Không áp dụng cho giảng viên ngoài trường --');

      const resPromise = page.waitForResponse(isCreate);
      await dialog.getByRole('button', { name: 'Lưu' }).click();
      const res = await resPromise;
      const sent = res.request().postDataJSON();
      expect(sent.email).toBe('itc.gv9012@gmail.com');
      expect(sent.organization).toBe('Trường Đại học Bách khoa Hà Nội');
      expect(sent.majorId ?? null).toBeNull();
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.message).toBe('Thêm giáo viên thành công');
      await expect(page.getByText('Thêm giáo viên thành công').first()).toBeVisible();

      const rows = await teacherRow('ITCGV9012');
      expect(rows).toHaveLength(1);
      expect(rows[0].major_id).toBeNull();
      expect(rows[0].organization).toBe('Trường Đại học Bách khoa Hà Nội');
    });

    test(ITC093.title, { annotation: ITC093.annotation }, async ({ page }) => {
      const dialog = await openCreate(page);
      let posted = false;
      page.on('request', (r) => { if (r.method() === 'POST' && new URL(r.url()).pathname.endsWith('/teacher')) posted = true; });
      await dialog.getByRole('button', { name: 'Lưu' }).click();
      for (const msg of [
        'Mã giảng viên không được để trống', 'Họ không được để trống', 'Tên không được để trống',
        'Email không được để trống', 'Số điện thoại không được để trống', 'Đơn vị công tác không được để trống',
        'Vui lòng chọn học hàm / học vị',
      ]) {
        await expect(dialog.getByText(msg, { exact: true })).toBeVisible();
      }
      await expect(dialog).toBeVisible();
      expect(posted).toBe(false);
    });

    test(ITC094.title, { annotation: ITC094.annotation }, async ({ page, request }) => {
      await seed(request, T1);
      const dialog = await openCreate(page);
      await fillTeacher(dialog, { code: 'ITCGV9001', first: 'Hoàng Văn', last: 'Nam', email: 'itc.gv9013@tlu.edu.vn', phone: '0999000013', title: 'ThS.' });
      const resPromise = page.waitForResponse(isCreate);
      await dialog.getByRole('button', { name: 'Lưu' }).click();
      const res = await resPromise;
      expect(res.status()).toBe(409);
      const body = await res.json();
      expect(body.code).toBe(3015);
      expect(body.message).toBe('Mã giảng viên đã tồn tại trong hệ thống');
      await expect(dialog.getByText('Mã giảng viên đã tồn tại trong hệ thống')).toBeVisible();

      const acc = await dbSelect(`SELECT id FROM account WHERE email = ?`, ['itc.gv9013@tlu.edu.vn']);
      expect(acc).toHaveLength(0);
      expect(await teacherRow('ITCGV9001')).toHaveLength(1);
    });

    test(ITC095.title, { annotation: ITC095.annotation }, async ({ page, request }) => {
      await seed(request, T1);
      const dialog = await openCreate(page);
      await fillTeacher(dialog, { code: 'ITCGV9014', first: 'Nguyễn Văn', last: 'Kiểm', email: 'itc.gv9001@tlu.edu.vn', phone: '0999000001', title: 'TS.' });
      const resPromise = page.waitForResponse(isCreate);
      await dialog.getByRole('button', { name: 'Lưu' }).click();
      const res = await resPromise;
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1100);
      expect(body.message).toBe('Giáo viên đã có trong hệ thống, thông tin không thay đổi');
      await expect(page.getByText('Giáo viên đã có trong hệ thống, thông tin không thay đổi').first()).toBeVisible();
      await expect(dialog).toBeHidden();

      expect(await teacherRow('ITCGV9014')).toHaveLength(0);
      const t1 = await teacherRow('ITCGV9001');
      expect(t1[0].email).toBe('itc.gv9001@tlu.edu.vn');
    });

    test(ITC096.title, { annotation: ITC096.annotation }, async ({ page, request }) => {
      await seed(request, T1);
      const dialog = await openCreate(page);
      await fillTeacher(dialog, { code: 'ITCGV9015', first: 'Bùi Đức', last: 'Long', email: 'itc.gv9015@tlu.edu.vn', phone: '0999000001', title: 'ThS.' });
      const resPromise = page.waitForResponse(isCreate);
      await dialog.getByRole('button', { name: 'Lưu' }).click();
      const res = await resPromise;
      expect(res.status()).toBe(409);
      const body = await res.json();
      expect(body.code).toBe(3014);
      expect(body.message).toBe('Số điện thoại trùng với tài khoản đã tồn tại trong hệ thống');
      await expect(dialog.getByText('Số điện thoại trùng với tài khoản đã tồn tại trong hệ thống')).toBeVisible();
      expect(await teacherRow('ITCGV9015')).toHaveLength(0);
    });
  });

  // ------------------------------------------------------------------ Cập nhật
  test.describe(FN_UPDATE, () => {
    async function openEdit(page: Page, code: string) {
      await openPage(page);
      await search(page, code);
      await rowOf(page, code).getByRole('button', { name: 'Sửa giảng viên' }).click();
      const dialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Cập nhật thông tin giảng viên' }) });
      await expect(dialog).toBeVisible();
      return dialog;
    }
    const isUpdate = (r: Response) => r.request().method() === 'PUT' && /\/teacher\/[^/]+$/.test(new URL(r.url()).pathname);

    test(ITC097.title, { annotation: ITC097.annotation }, async ({ page, request }) => {
      await seed(request, T1);
      const t1Id = (await teacherRow('ITCGV9001'))[0].id;
      const dialog = await openEdit(page, 'ITCGV9001');
      await expect(dialog.getByLabel(/^Mã giảng viên/)).toHaveValue('ITCGV9001');
      await expect(dialog.getByLabel(/^Email/)).toHaveValue('itc.gv9001@tlu.edu.vn');

      await dialog.getByLabel(/^Số điện thoại/).fill('0999000091');
      await dialog.getByLabel(/^Học hàm \/ Học vị/).selectOption('PGS.TS.');
      const resPromise = page.waitForResponse(isUpdate);
      await dialog.getByRole('button', { name: 'Cập nhật' }).click();
      const res = await resPromise;
      expect(new URL(res.url()).pathname.endsWith(`/teacher/${t1Id}`)).toBe(true);
      const sent = res.request().postDataJSON();
      expect(sent.phone).toBe('0999000091');
      expect(sent.academicTitle).toBe('PGS.TS.');
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.message).toBe('Cập nhật thông tin giảng viên thành công');
      await expect(page.getByText('Cập nhật thông tin giảng viên thành công').first()).toBeVisible();
      await expect(dialog).toBeHidden();

      const rows = await teacherRow('ITCGV9001');
      expect(rows[0].phone).toBe('0999000091');
      expect(rows[0].title).toBe('PGS.TS.');
    });

    test(ITC098.title, { annotation: ITC098.annotation }, async ({ page, request }) => {
      await seed(request, T1, T3);
      const dialog = await openEdit(page, 'ITCGV9001');
      await dialog.getByLabel(/^Email/).fill('itc.gv9003@tlu.edu.vn');
      const resPromise = page.waitForResponse(isUpdate);
      await dialog.getByRole('button', { name: 'Cập nhật' }).click();
      const res = await resPromise;
      expect(res.status()).toBe(409);
      const body = await res.json();
      expect(body.code).toBe(3001);
      expect(body.message).toBe('Email đã tồn tại trong hệ thống');
      await expect(dialog.getByText('Email đã tồn tại trong hệ thống')).toBeVisible();
      expect((await teacherRow('ITCGV9001'))[0].email).toBe('itc.gv9001@tlu.edu.vn');
    });

    test(ITC099.title, { annotation: ITC099.annotation }, async ({ page, request }) => {
      await seed(request, T1, T3);
      const dialog = await openEdit(page, 'ITCGV9001');
      await dialog.getByLabel(/^Mã giảng viên/).fill('ITCGV9003');
      const resPromise = page.waitForResponse(isUpdate);
      await dialog.getByRole('button', { name: 'Cập nhật' }).click();
      const res = await resPromise;
      expect(res.status()).toBe(409);
      const body = await res.json();
      expect(body.code).toBe(3015);
      expect(body.message).toBe('Mã giảng viên đã tồn tại trong hệ thống');
      await expect(dialog.getByText('Mã giảng viên đã tồn tại trong hệ thống')).toBeVisible();
      const rows = await dbSelect<{ teacher_code: string }>(
        `SELECT t.teacher_code FROM teacher t JOIN account a ON a.id = t.account_id WHERE a.email = ?`,
        ['itc.gv9001@tlu.edu.vn']);
      expect(rows[0].teacher_code).toBe('ITCGV9001');
    });
  });

  // ------------------------------------------------------------------ Xóa
  test.describe(FN_DELETE, () => {
    test(ITC100.title, { annotation: ITC100.annotation }, async ({ page, request }) => {
      await seed(request, T1);
      const t1Id = (await teacherRow('ITCGV9001'))[0].id;
      await openPage(page);
      await search(page, 'ITCGV9001');
      await rowOf(page, 'ITCGV9001').getByRole('button', { name: 'Xóa giảng viên' }).click();
      const dialog = page.getByRole('dialog').filter({ hasText: 'Xác nhận xóa tài khoản giảng viên khỏi hệ thống' });
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText('Nguyễn Văn Kiểm');
      await expect(dialog).toContainText('ITCGV9001');

      const resPromise = page.waitForResponse((r) => r.request().method() === 'DELETE' && new URL(r.url()).pathname.endsWith(`/teacher/${t1Id}`));
      await dialog.getByRole('button', { name: 'Xác nhận xóa' }).click();
      const res = await resPromise;
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.message).toBe('Xóa giảng viên thành công');
      await expect(page.getByText('Xóa giảng viên thành công').first()).toBeVisible();
      await expect(rowOf(page, 'ITCGV9001')).toHaveCount(0);

      expect(await teacherRow('ITCGV9001')).toHaveLength(0);
      expect(await dbSelect(`SELECT id FROM account WHERE email = ?`, ['itc.gv9001@tlu.edu.vn'])).toHaveLength(0);
    });
  });

  // ------------------------------------------------------------------ Import
  test.describe(FN_IMPORT, () => {
    async function openImport(page: Page) {
      await openPage(page);
      await page.getByRole('button', { name: 'Import File' }).click();
      const dialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Import danh sách giáo viên' }) });
      await expect(dialog).toBeVisible();
      return dialog;
    }

    test(ITC101.title, { annotation: ITC101.annotation }, async ({ page }, testInfo) => {
      const file = writeXlsx(path.join(testInfo.outputDir, 'giang_vien_itc.xlsx'), [
        ['Mã giảng viên', 'Họ và tên đệm', 'Tên', 'Email', 'Số điện thoại', 'Đơn vị công tác', 'Ngành', 'Học hàm / Học vị'],
        ['ITCGV9021', 'Đinh Công', 'Mạnh', 'itc.gv9021@tlu.edu.vn', '0999000021', 'Trường Đại học Thủy lợi', ownMajor.name, 'ThS.'],
        ['ITCGV9022', 'Ngô Thị', 'Mai', 'itc.gv9022@tlu.edu.vn', '12345', 'Trường Đại học Thủy lợi', ownMajor.name, 'ThS.'],
      ]);
      const dialog = await openImport(page);
      await dialog.locator('input[type="file"]').setInputFiles(file);
      const resPromise = page.waitForResponse((r) => r.request().method() === 'POST' && new URL(r.url()).pathname.endsWith('/teacher/import'));
      await dialog.getByRole('button', { name: 'Import', exact: true }).click();
      const res = await resPromise;
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.message).toBe('Xử lý file import hoàn tất');
      expect(body.data.totalRows).toBe(2);
      expect(body.data.successCount).toBe(1);
      expect(body.data.errorCount).toBe(1);

      const result = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Kết quả import giáo viên' }) });
      await expect(result).toBeVisible();
      await expect(result).toContainText('Đã xử lý 2 dòng.');
      await expect(result).toContainText('1 dòng lỗi');
      await result.getByRole('tab', { name: /Lỗi/ }).click();
      const errRow = result.getByRole('row').filter({ hasText: 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0' });
      await expect(errRow).toHaveCount(1);
      await expect(errRow).toContainText('3');
      await result.getByRole('tab', { name: /Thành công/ }).click();
      const okRow = result.getByRole('row').filter({ hasText: 'Thêm giáo viên thành công' });
      await expect(okRow).toHaveCount(1);
      await expect(okRow).toContainText('itc.gv9021@tlu.edu.vn');

      const rows = await teacherRow('ITCGV9021');
      expect(rows).toHaveLength(1);
      expect(rows[0].major_name).toBe(ownMajor.name);
      expect(await teacherRow('ITCGV9022')).toHaveLength(0);
    });

    test(ITC102.title, { annotation: ITC102.annotation }, async ({ page }, testInfo) => {
      const fs = await import('node:fs');
      const docx = path.join(testInfo.outputDir, 'giang_vien.docx');
      fs.mkdirSync(testInfo.outputDir, { recursive: true });
      fs.writeFileSync(docx, 'Day khong phai file Excel');
      const dialog = await openImport(page);
      let posted = false;
      page.on('request', (r) => { if (r.method() === 'POST' && new URL(r.url()).pathname.endsWith('/teacher/import')) posted = true; });
      await dialog.locator('input[type="file"]').setInputFiles(docx);
      await expect(dialog.getByText('File import phải có định dạng .xlsx')).toBeVisible();
      expect(posted).toBe(false);
    });
  });

  // ------------------------------------------------------------------ Security (TBM ngoài phạm vi ngành)
  test.describe('SecurityTest - ngoài phạm vi ngành', () => {
    async function openOtherMajorRow(page: Page) {
      await openPage(page);
      const resPromise = page.waitForResponse((r) => isTeacherAll(r, (u) => u.searchParams.get('majorId') === otherMajor.publicId));
      await page.getByLabel('Lọc theo ngành').selectOption(otherMajor.publicId);
      await resPromise;
      await search(page, 'ITCGV9004');
      const row = rowOf(page, 'ITCGV9004');
      await expect(row).toContainText('Phạm Quốc Bảo');
      return row;
    }

    test(SEC056.title, { annotation: SEC056.annotation }, async ({ page, request }) => {
      await seed(request, T4);
      const row = await openOtherMajorRow(page);
      await row.getByRole('button', { name: 'Sửa giảng viên' }).click();
      const dialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Cập nhật thông tin giảng viên' }) });
      await dialog.getByLabel(/^Số điện thoại/).fill('0999000094');
      const resPromise = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/teacher\/[^/]+$/.test(new URL(r.url()).pathname));
      await dialog.getByRole('button', { name: 'Cập nhật' }).click();
      const res = await resPromise;
      expect(res.status()).toBe(403);
      const body = await res.json();
      expect(body.code).toBe(3019);
      expect(body.message).toBe('Giáo viên thuộc ngành khác, bạn không có quyền cập nhật');
      await expect(dialog.getByText('Giáo viên thuộc ngành khác, bạn không có quyền cập nhật')).toBeVisible();
      expect((await teacherRow('ITCGV9004'))[0].phone).toBe('0999000004');
    });

    test(SEC057.title, { annotation: SEC057.annotation }, async ({ page, request }) => {
      await seed(request, T4);
      const row = await openOtherMajorRow(page);
      await row.getByRole('button', { name: 'Xóa giảng viên' }).click();
      const dialog = page.getByRole('dialog').filter({ hasText: 'Xác nhận xóa tài khoản giảng viên khỏi hệ thống' });
      const resPromise = page.waitForResponse((r) => r.request().method() === 'DELETE' && /\/teacher\/[^/]+$/.test(new URL(r.url()).pathname));
      await dialog.getByRole('button', { name: 'Xác nhận xóa' }).click();
      const res = await resPromise;
      expect(res.status()).toBe(403);
      const body = await res.json();
      expect(body.code).toBe(3019);
      expect(body.message).toBe('Giáo viên thuộc ngành khác, bạn không có quyền cập nhật');
      await expect(page.getByText('Giáo viên thuộc ngành khác, bạn không có quyền cập nhật').first()).toBeVisible();
      expect(await teacherRow('ITCGV9004')).toHaveLength(1);
    });
  });
});

// ------------------------------------------------------------------ Security (chưa đăng nhập / sai role)
test.describe('SecurityTest - truy cập màn hình', () => {
  test.describe('Chưa đăng nhập', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test(SEC054.title, { annotation: SEC054.annotation }, async ({ page, request }) => {
      await page.goto(PAGE_URL);
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByRole('button', { name: 'Thêm giảng viên' })).toHaveCount(0);
      await expect(page.getByLabel('Tìm kiếm giáo viên')).toHaveCount(0);

      const res = await request.get(`${(process.env.E2E_API_URL || 'http://localhost:8080/gpms').replace(/\/+$/, '')}/teacher/all`);
      expect(res.status()).toBe(401);
      expect((await res.json()).code).toBe(2000);
    });
  });

  test.describe('Sinh viên', () => {
    test.use({ storageState: '.auth/student.json' });

    test(SEC055.title, { annotation: SEC055.annotation }, async ({ page, request }) => {
      await page.goto(PAGE_URL);
      await expect(page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Thêm giảng viên' })).toHaveCount(0);
      await expect(page.getByLabel('Tìm kiếm giáo viên')).toHaveCount(0);

      const studentToken = await token(request, 'STUDENT');
      const res = await apiCall(request, studentToken, 'GET', '/teacher/all');
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(2001);
      expect(res.body.data ?? null).toBeNull();
    });
  });
});
