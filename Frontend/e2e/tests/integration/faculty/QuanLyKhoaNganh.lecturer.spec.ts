import { test, expect, type APIRequestContext, type Locator, type Page, type Response } from '@playwright/test';
import { defineItc, defineItcSec } from '../../../support/integration-test-case';
import { apiCall, getApiBaseUrl, loginByEmail } from '../../../support/api';
import { dbSelect } from '../../../support/db';

// ============================================================================
// ĐẶC TẢ TEST CASE (ITC120..ITC138 & TC-SEC-061..TC-SEC-063)
// Feature: faculty | Module/Sheet: QuanLyKhoaNganh
// Role: Quản trị viên (ADMIN) — màn hình "/admin/faculties" (Khoa)
// Dữ liệu test: mã khoa ITCK9xx, mã ngành ITCN9xx; dọn bằng API
//   DELETE /major/{id} rồi DELETE /faculty/{id} sau mỗi test
// ============================================================================

const FEATURE = 'faculty';
const MODULE = 'QuanLyKhoaNganh';
const SHEET = 'QuanLyKhoaNganh';
const PAGE_URL = '/admin/faculties';
const SEARCH_PLACEHOLDER = 'Tìm theo mã khoa, tên khoa hoặc trưởng khoa...';

const FN_LIST = 'Xem danh sách khoa';
const FN_CREATE = 'Thêm khoa';
const FN_UPDATE = 'Cập nhật khoa';
const FN_DETAIL = 'Xem chi tiết khoa';
const FN_MAJOR_CREATE = 'Thêm ngành';
const FN_MAJOR_UPDATE = 'Cập nhật ngành';

const PRE_ADMIN = 'Quản trị viên (ADMIN) đã đăng nhập';
const PRE_K1 = PRE_ADMIN + '; khoa "Khoa Kiểm thử Tích hợp ITC 901" (mã ITCK901, mô tả "Mô tả khoa ITC 901", đang hoạt động) đã có trong hệ thống, gồm 1 ngành "Ngành Kiểm thử 901" (mã ITCN901, mô tả "Mô tả ngành ITC 901", đang hoạt động, chưa có Trưởng bộ môn)';

const ITC120 = defineItc({
  id: 'ITC120', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra mở màn hình Khoa hiển thị danh sách khoa, khoa mới thêm ở đầu danh sách',
  procedure: '1. Đăng nhập vai trò Quản trị viên.\n2. Mở màn hình "Khoa" (/admin/faculties).',
  expected:
    '1. Gọi GET /faculty; HTTP 200, code = 1000; khoa đầu tiên trong dữ liệu trả về là ITCK901 với số ngành = 1.\n' +
    '2. Bảng hiển thị dòng đầu "ITCK901", "Khoa Kiểm thử Tích hợp ITC 901", "1 chuyên ngành", "Hoạt động".\n' +
    '3. Dòng "Tổng kết quả" hiển thị đúng số khoa trả về.',
  precondition: PRE_K1 + '; ITCK901 là khoa được thêm gần nhất',
});

const ITC121 = defineItc({
  id: 'ITC121', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra tìm khoa theo mã kết hợp lọc trạng thái "Không hoạt động"',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Khoa".\n' +
    '2. Nhập "ITCK90" vào ô "Tìm theo mã khoa, tên khoa hoặc trưởng khoa...".\n' +
    '3. Chọn trạng thái "Không hoạt động".',
  expected:
    '1. Không gọi lại API; danh sách được lọc trên dữ liệu đã tải.\n' +
    '2. Bảng chỉ còn 1 dòng "ITCK902" - "Khoa Kiểm thử Tích hợp ITC 902" - "Không hoạt động"; không hiển thị ITCK901.\n' +
    '3. Hiển thị "Tổng kết quả: 1 khoa" và nút "Đặt lại bộ lọc".',
  precondition: PRE_K1 + '; khoa "Khoa Kiểm thử Tích hợp ITC 902" (mã ITCK902, không hoạt động, chưa có ngành) đã có trong hệ thống',
});

const ITC122 = defineItc({
  id: 'ITC122', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_LIST,
  description: 'Kiểm tra hiển thị trạng thái rỗng khi từ khóa không khớp khoa nào',
  procedure: '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Khoa".\n2. Nhập "KHONGTONTAI9999" vào ô tìm kiếm.',
  expected:
    '1. Gọi GET /faculty khi mở màn hình; HTTP 200, code = 1000.\n' +
    '2. Sau khi nhập từ khóa, bảng hiển thị "Không tìm thấy khoa đào tạo phù hợp." và "Tổng kết quả: 0 khoa".',
  precondition: PRE_ADMIN + '; không có khoa nào khớp từ khóa "KHONGTONTAI9999"',
});

const ITC123 = defineItc({
  id: 'ITC123', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_CREATE,
  description: 'Kiểm tra Quản trị viên thêm khoa mới hợp lệ, mã khoa nhập chữ thường được chuyển thành chữ hoa',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Khoa", bấm "Thêm khoa".\n' +
    '2. Nhập Mã khoa "itck911", Tên khoa "Khoa Kiểm thử Tích hợp ITC 911", Chi tiết về khoa "Mô tả khoa ITC 911"; giữ Trạng thái "Đang hoạt động".\n' +
    '3. Bấm "Lưu".',
  expected:
    '1. Gọi POST /faculty với mã ITCK911, tên "Khoa Kiểm thử Tích hợp ITC 911", trạng thái ACTIVE; HTTP 200, code = 1000, message "Thêm mới khoa thành công".\n' +
    '2. Hiện thông báo "Thêm khoa mới thành công!", popup đóng.\n' +
    '3. Bảng có dòng "ITCK911" - "Khoa Kiểm thử Tích hợp ITC 911" - "0 chuyên ngành" - "Hoạt động".\n' +
    '4. Dữ liệu: khoa ITCK911 được lưu với mô tả "Mô tả khoa ITC 911", trạng thái hoạt động.',
  precondition: PRE_ADMIN + '; mã ITCK911 và tên "Khoa Kiểm thử Tích hợp ITC 911" chưa có trong hệ thống',
});

const ITC124 = defineItc({
  id: 'ITC124', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_CREATE,
  description: 'Kiểm tra giao diện chặn lưu khi bỏ trống mã khoa và tên khoa',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Khoa", bấm "Thêm khoa".\n' +
    '2. Để trống Mã khoa và Tên khoa, bấm "Lưu".',
  expected:
    '1. Dưới ô Mã khoa hiển thị "Vui lòng nhập mã khoa"; dưới ô Tên khoa hiển thị "Vui lòng nhập tên khoa".\n' +
    '2. Không gọi POST /faculty; popup vẫn mở.',
  precondition: PRE_ADMIN,
});

const ITC125 = defineItc({
  id: 'ITC125', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_CREATE,
  description: 'Kiểm tra thêm khoa có tên trùng với khoa đã có',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Khoa", bấm "Thêm khoa".\n' +
    '2. Nhập Mã khoa "ITCK912", Tên khoa "Khoa Kiểm thử Tích hợp ITC 901".\n' +
    '3. Bấm "Lưu".',
  expected:
    '1. Gọi POST /faculty; HTTP 409, code = 3010, message "Tên khoa đã tồn tại trong hệ thống".\n' +
    '2. Popup vẫn mở, dưới ô Tên khoa hiển thị "Tên khoa đã tồn tại trong hệ thống".\n' +
    '3. Dữ liệu: không có khoa ITCK912.',
  precondition: PRE_K1,
});

const ITC126 = defineItc({
  id: 'ITC126', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_CREATE,
  description: 'Kiểm tra giao diện chặn lưu khi mã khoa trùng với khoa đang hiển thị trong danh sách',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Khoa", bấm "Thêm khoa".\n' +
    '2. Nhập Mã khoa "itck901", Tên khoa "Khoa Kiểm thử Tích hợp ITC 913".\n' +
    '3. Bấm "Lưu".',
  expected:
    '1. Dưới ô Mã khoa hiển thị "Mã khoa này đã tồn tại trong hệ thống.".\n' +
    '2. Không gọi POST /faculty; popup vẫn mở.\n' +
    '3. Dữ liệu: không có khoa tên "Khoa Kiểm thử Tích hợp ITC 913".',
  precondition: PRE_K1,
});

const ITC127 = defineItc({
  id: 'ITC127', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_UPDATE,
  description: 'Kiểm tra Quản trị viên đổi tên khoa',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Khoa", bấm vào dòng khoa ITCK901.\n' +
    '2. Bấm "Cập nhật thông tin khoa".\n' +
    '3. Đổi Tên khoa thành "Khoa Kiểm thử Tích hợp ITC 901 Sửa", bấm "Lưu".',
  expected:
    '1. Popup "Cập nhật thông tin khoa" điền sẵn mã ITCK901 và tên "Khoa Kiểm thử Tích hợp ITC 901".\n' +
    '2. Gọi PUT /faculty/{mã định danh của khoa ITCK901} với mã ITCK901, tên mới, trạng thái ACTIVE; HTTP 200, code = 1000, message "Cập nhật thông tin khoa thành công".\n' +
    '3. Hiện thông báo "Cập nhật thông tin khoa thành công!", popup đóng; tiêu đề trang chi tiết hiển thị "Khoa Kiểm thử Tích hợp ITC 901 Sửa".\n' +
    '4. Dữ liệu: khoa ITCK901 có tên "Khoa Kiểm thử Tích hợp ITC 901 Sửa", vẫn đang hoạt động.',
  precondition: PRE_K1,
});

const ITC128 = defineItc({
  id: 'ITC128', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_UPDATE,
  description: 'Kiểm tra cập nhật tên khoa không làm thay đổi phần mô tả của khoa',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Khoa", bấm vào dòng khoa ITCK901.\n' +
    '2. Bấm "Cập nhật thông tin khoa".\n' +
    '3. Đổi Tên khoa thành "Khoa Kiểm thử Tích hợp ITC 901 Sửa", không sửa ô "Chi tiết về khoa", bấm "Lưu".',
  expected:
    '1. Ô "Chi tiết về khoa" điền sẵn mô tả đang lưu "Mô tả khoa ITC 901".\n' +
    '2. Gọi PUT /faculty/{mã định danh của khoa ITCK901} với mô tả "Mô tả khoa ITC 901"; HTTP 200, code = 1000.\n' +
    '3. Dữ liệu: mô tả của khoa ITCK901 vẫn là "Mô tả khoa ITC 901".',
  precondition: PRE_K1,
});

const ITC129 = defineItc({
  id: 'ITC129', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_UPDATE,
  description: 'Kiểm tra không cho vô hiệu hóa khoa còn ngành đang hoạt động',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Khoa", bấm vào dòng khoa ITCK901.\n' +
    '2. Bấm "Cập nhật thông tin khoa", chọn Trạng thái "Không hoạt động", bấm "Lưu".',
  expected:
    '1. Gọi PUT /faculty/{mã định danh của khoa ITCK901} với trạng thái INACTIVE; HTTP 400, code = 3012, message "Không thể vô hiệu hóa khoa nếu vẫn còn ngành hoặc sinh viên/giảng viên đang hoạt động trong khoa đó".\n' +
    '2. Popup vẫn mở và hiển thị đúng thông báo trên.\n' +
    '3. Dữ liệu: khoa ITCK901 vẫn đang hoạt động.',
  precondition: PRE_K1,
});

const ITC130 = defineItc({
  id: 'ITC130', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_DETAIL,
  description: 'Kiểm tra xem chi tiết khoa hiển thị danh sách ngành của khoa',
  procedure: '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Khoa".\n2. Bấm vào dòng khoa ITCK901.',
  expected:
    '1. Gọi GET /faculty/{mã định danh của khoa ITCK901}/majors; HTTP 200, code = 1000; trả về 1 ngành ITCN901.\n' +
    '2. Trang chi tiết hiển thị tiêu đề "Khoa Kiểm thử Tích hợp ITC 901", "Đang hoạt động", "1 chuyên ngành".\n' +
    '3. Bảng ngành có dòng "ITCN901" - "Ngành Kiểm thử 901" - "Chưa bổ nhiệm" - "Mô tả ngành ITC 901" - "Hoạt động"; hiển thị "Danh sách chuyên ngành: 1 ngành".',
  precondition: PRE_K1,
});

const ITC131 = defineItc({
  id: 'ITC131', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_DETAIL,
  description: 'Kiểm tra trang chi tiết khoa hiển thị đúng mô tả khoa đang lưu',
  procedure: '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Khoa".\n2. Bấm vào dòng khoa ITCK901.',
  expected:
    '1. Gọi GET /faculty/{mã định danh của khoa ITCK901}; HTTP 200, code = 1000, mô tả "Mô tả khoa ITC 901".\n' +
    '2. Mục "Giới thiệu chi tiết về khoa" hiển thị "Mô tả khoa ITC 901".',
  precondition: PRE_K1,
});

const ITC132 = defineItc({
  id: 'ITC132', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_MAJOR_CREATE,
  description: 'Kiểm tra Quản trị viên thêm ngành mới vào khoa, không chọn Trưởng bộ môn',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Khoa", bấm vào dòng khoa ITCK901, bấm "Thêm ngành".\n' +
    '2. Nhập Mã chuyên ngành "itcn911", Tên chuyên ngành "Ngành Kiểm thử 911", Chi tiết về ngành "Mô tả ngành ITC 911"; giữ Trạng thái "Đang hoạt động", không chọn Trưởng bộ môn.\n' +
    '3. Bấm "Lưu".',
  expected:
    '1. Popup "Thêm chuyên ngành mới" hiển thị khoa trực thuộc "Khoa Kiểm thử Tích hợp ITC 901".\n' +
    '2. Gọi POST /faculty/{mã định danh của khoa ITCK901}/majors với mã ITCN911, tên "Ngành Kiểm thử 911", trạng thái ACTIVE, không kèm Trưởng bộ môn; HTTP 200, code = 1000, message "Thêm mới ngành thành công".\n' +
    '3. Hiện thông báo "Thêm chuyên ngành mới thành công!", popup đóng; bảng ngành có dòng "ITCN911" - "Ngành Kiểm thử 911" - "Chưa bổ nhiệm".\n' +
    '4. Dữ liệu: ngành ITCN911 thuộc khoa ITCK901, đang hoạt động, chưa có Trưởng bộ môn.',
  precondition: PRE_K1 + '; mã ngành ITCN911 chưa có trong hệ thống',
});

const ITC133 = defineItc({
  id: 'ITC133', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_MAJOR_CREATE,
  description: 'Kiểm tra giao diện chặn lưu khi bỏ trống mã và tên chuyên ngành',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Khoa", bấm vào dòng khoa ITCK901, bấm "Thêm ngành".\n' +
    '2. Để trống Mã chuyên ngành và Tên chuyên ngành, bấm "Lưu".',
  expected:
    '1. Dưới ô Mã chuyên ngành hiển thị "Vui lòng nhập mã chuyên ngành"; dưới ô Tên chuyên ngành hiển thị "Vui lòng nhập tên chuyên ngành".\n' +
    '2. Không gọi POST /faculty/{mã định danh của khoa}/majors; popup vẫn mở.',
  precondition: PRE_K1,
});

const ITC134 = defineItc({
  id: 'ITC134', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_MAJOR_CREATE,
  description: 'Kiểm tra thêm ngành có mã trùng với ngành đã có',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Khoa", bấm vào dòng khoa ITCK901, bấm "Thêm ngành".\n' +
    '2. Nhập Mã chuyên ngành "ITCN901", Tên chuyên ngành "Ngành Kiểm thử 912".\n3. Bấm "Lưu".',
  expected:
    '1. Gọi POST /faculty/{mã định danh của khoa ITCK901}/majors; HTTP 409, code = 3021, message "Mã ngành đã tồn tại trong hệ thống".\n' +
    '2. Popup vẫn mở, dưới ô Mã chuyên ngành hiển thị "Mã ngành đã tồn tại trong hệ thống".\n' +
    '3. Dữ liệu: không có ngành "Ngành Kiểm thử 912"; khoa ITCK901 vẫn chỉ có 1 ngành.',
  precondition: PRE_K1,
});

const ITC135 = defineItc({
  id: 'ITC135', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_MAJOR_CREATE,
  description: 'Kiểm tra thêm ngành có tên trùng với ngành khác trong cùng khoa',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Khoa", bấm vào dòng khoa ITCK901, bấm "Thêm ngành".\n' +
    '2. Nhập Mã chuyên ngành "ITCN912", Tên chuyên ngành "Ngành Kiểm thử 901".\n3. Bấm "Lưu".',
  expected:
    '1. Gọi POST /faculty/{mã định danh của khoa ITCK901}/majors; HTTP 409, code = 3011, message "Tên ngành đã tồn tại trong cùng một khoa".\n' +
    '2. Popup vẫn mở, dưới ô Tên chuyên ngành hiển thị "Tên ngành đã tồn tại trong cùng một khoa".\n' +
    '3. Dữ liệu: không có ngành ITCN912.',
  precondition: PRE_K1,
});

const ITC136 = defineItc({
  id: 'ITC136', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_MAJOR_CREATE,
  description: 'Kiểm tra thêm ngành và chọn Trưởng bộ môn là giảng viên đang thuộc ngành khác',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Khoa", bấm vào dòng khoa ITCK901, bấm "Thêm ngành".\n' +
    '2. Nhập Mã chuyên ngành "ITCN913", Tên chuyên ngành "Ngành Kiểm thử 913"; ở ô Trưởng bộ môn chọn một giảng viên trong trường đang thuộc ngành Kỹ thuật phần mềm.\n' +
    '3. Bấm "Lưu".',
  expected:
    '1. Gọi POST /faculty/{mã định danh của khoa ITCK901}/majors kèm Trưởng bộ môn đã chọn; HTTP 400, code = 3016, message "Trưởng ngành phải là giáo viên trong trường thuộc ngành này và tài khoản đang hoạt động".\n' +
    '2. Popup vẫn mở, dưới ô Trưởng bộ môn hiển thị đúng thông báo trên.\n' +
    '3. Dữ liệu: không có ngành ITCN913 (không lưu dở dang).',
  precondition: PRE_K1 + '; có giảng viên trong trường, tài khoản đang hoạt động, thuộc ngành Kỹ thuật phần mềm',
});

const ITC137 = defineItc({
  id: 'ITC137', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_MAJOR_UPDATE,
  description: 'Kiểm tra Quản trị viên đổi tên và chuyển ngành sang trạng thái không hoạt động',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Khoa", bấm vào dòng khoa ITCK901.\n' +
    '2. Trên dòng ngành ITCN901 bấm "Cập nhật".\n' +
    '3. Đổi Tên chuyên ngành thành "Ngành Kiểm thử 901 Sửa", chọn Trạng thái "Không hoạt động", bấm "Lưu".',
  expected:
    '1. Popup "Cập nhật chuyên ngành" điền sẵn mã ITCN901 và tên "Ngành Kiểm thử 901".\n' +
    '2. Gọi PUT /major/{mã định danh của ngành ITCN901} với tên mới, trạng thái INACTIVE; HTTP 200, code = 1000, message "Cập nhật ngành thành công".\n' +
    '3. Hiện thông báo "Cập nhật chuyên ngành thành công!", popup đóng; dòng ITCN901 hiển thị "Ngành Kiểm thử 901 Sửa" và "Không hoạt động".\n' +
    '4. Dữ liệu: ngành ITCN901 có tên "Ngành Kiểm thử 901 Sửa", trạng thái không hoạt động.',
  precondition: PRE_K1,
});

const ITC138 = defineItc({
  id: 'ITC138', feature: FEATURE, module: MODULE, sheet: SHEET, fn: FN_MAJOR_UPDATE,
  description: 'Kiểm tra đổi tên ngành trùng với ngành khác trong cùng khoa',
  procedure:
    '1. Đăng nhập vai trò Quản trị viên, mở màn hình "Khoa", bấm vào dòng khoa ITCK901.\n' +
    '2. Trên dòng ngành ITCN902 bấm "Cập nhật".\n' +
    '3. Đổi Tên chuyên ngành thành "Ngành Kiểm thử 901", bấm "Lưu".',
  expected:
    '1. Gọi PUT /major/{mã định danh của ngành ITCN902}; HTTP 409, code = 3011, message "Tên ngành đã tồn tại trong cùng một khoa".\n' +
    '2. Popup vẫn mở, dưới ô Tên chuyên ngành hiển thị "Tên ngành đã tồn tại trong cùng một khoa".\n' +
    '3. Dữ liệu: ngành ITCN902 vẫn có tên "Ngành Kiểm thử 902".',
  precondition: PRE_K1 + '; khoa ITCK901 có thêm ngành "Ngành Kiểm thử 902" (mã ITCN902)',
});

const SEC061 = defineItcSec({
  id: 'TC-SEC-061', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Trưởng bộ môn mở thẳng màn hình Khoa của Quản trị viên và gọi API danh sách khoa',
  roleSession: 'Trưởng bộ môn (HEAD_OF_MAJOR), đã đăng nhập',
  technique: 'EP',
  given: 'Đăng nhập bằng tài khoản Trưởng bộ môn (không có vai trò ADMIN)',
  when: 'Mở thẳng đường dẫn /admin/faculties; gọi GET /faculty bằng phiên Trưởng bộ môn',
  then: 'Bị chuyển về trang chủ Trưởng bộ môn (/department); không hiển thị nút "Thêm khoa"; GET /faculty trả HTTP 403, code = 2001, không trả danh sách khoa',
});

const SEC062 = defineItcSec({
  id: 'TC-SEC-062', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Sinh viên mở màn hình Khoa và gọi API thêm khoa',
  roleSession: 'Sinh viên (STUDENT), đã đăng nhập',
  technique: 'EP',
  given: 'Đăng nhập bằng tài khoản Sinh viên',
  when: 'Mở thẳng /admin/faculties; gọi POST /faculty (mã ITCK951) bằng phiên Sinh viên',
  then: 'Màn hình hiển thị "Tài khoản của bạn không có quyền truy cập cổng cán bộ."; POST /faculty trả HTTP 403, code = 2001; không có khoa ITCK951 được tạo',
});

const SEC063 = defineItcSec({
  id: 'TC-SEC-063', feature: FEATURE, module: MODULE, sheet: SHEET,
  scenario: 'Chưa đăng nhập mở màn hình Khoa và gọi API cập nhật ngành',
  roleSession: 'Chưa đăng nhập (không có cookie phiên)',
  technique: 'EP',
  given: 'Trình duyệt chưa đăng nhập; ngành ITCN901 "Ngành Kiểm thử 901" đã có trong hệ thống',
  when: 'Mở thẳng /admin/faculties; gọi PUT /major/{mã định danh của ngành ITCN901} đổi tên không kèm phiên đăng nhập',
  then: 'Bị chuyển về trang đăng nhập (/login); PUT /major trả HTTP 401, code = 2000; ngành ITCN901 vẫn tên "Ngành Kiểm thử 901"',
});

// ============================================================================
// DỮ LIỆU & HÀM HỖ TRỢ (API để chuẩn bị / dọn, DB chỉ SELECT)
// ============================================================================

type SeedMajor = { code: string; name: string; description: string };
type SeedFaculty = { code: string; name: string; description: string; status: 'ACTIVE' | 'INACTIVE'; majors: SeedMajor[] };

const M1: SeedMajor = { code: 'ITCN901', name: 'Ngành Kiểm thử 901', description: 'Mô tả ngành ITC 901' };
const M2: SeedMajor = { code: 'ITCN902', name: 'Ngành Kiểm thử 902', description: 'Mô tả ngành ITC 902' };
const K1: SeedFaculty = { code: 'ITCK901', name: 'Khoa Kiểm thử Tích hợp ITC 901', description: 'Mô tả khoa ITC 901', status: 'ACTIVE', majors: [M1] };
const K2: SeedFaculty = { code: 'ITCK902', name: 'Khoa Kiểm thử Tích hợp ITC 902', description: 'Mô tả khoa ITC 902', status: 'INACTIVE', majors: [] };

function requireEmail(role: string): string {
  const email = process.env[`E2E_EMAIL_${role}`];
  if (!email) throw new Error(`Chưa cấu hình E2E_EMAIL_${role} trong .env.e2e`);
  return email;
}

const token = (request: APIRequestContext, role: 'ADMIN' | 'STUDENT' | 'HEAD_OF_MAJOR') =>
  loginByEmail(request, requireEmail(role));

async function facultyIdByCode(request: APIRequestContext, admin: string, code: string): Promise<string> {
  const res = await apiCall(request, admin, 'GET', '/faculty', { params: { keyword: code, size: 50 } });
  const f = (res.body?.data?.content ?? []).find((x: any) => x.code === code);
  if (!f) throw new Error(`Không tìm thấy khoa test ${code}`);
  return f.id;
}

async function majorIdByCode(request: APIRequestContext, admin: string, facultyId: string, code: string): Promise<string> {
  const res = await apiCall(request, admin, 'GET', `/faculty/${facultyId}/majors`, { params: { size: 50 } });
  const m = (res.body?.data?.content ?? []).find((x: any) => x.code === code);
  if (!m) throw new Error(`Không tìm thấy ngành test ${code}`);
  return m.publicId;
}

/** Tạo khoa (và ngành) theo thứ tự truyền vào; khoa truyền sau cùng sẽ mới nhất */
async function seed(request: APIRequestContext, ...faculties: SeedFaculty[]) {
  const admin = await token(request, 'ADMIN');
  for (const f of faculties) {
    const res = await apiCall(request, admin, 'POST', '/faculty', {
      data: { code: f.code, name: f.name, description: f.description, status: 'ACTIVE' },
    });
    expect(res.status, `Không tạo được khoa test ${f.code}: ${JSON.stringify(res.body)}`).toBe(200);
    const fid = await facultyIdByCode(request, admin, f.code);
    for (const m of f.majors) {
      const mr = await apiCall(request, admin, 'POST', `/faculty/${fid}/majors`, {
        data: { code: m.code, name: m.name, description: m.description, status: 'ACTIVE' },
      });
      expect(mr.status, `Không tạo được ngành test ${m.code}: ${JSON.stringify(mr.body)}`).toBe(200);
    }
    if (f.status === 'INACTIVE') {
      const ur = await apiCall(request, admin, 'PUT', `/faculty/${fid}`, {
        data: { code: f.code, name: f.name, description: f.description, status: 'INACTIVE' },
      });
      expect(ur.status, `Không cập nhật được trạng thái khoa test ${f.code}`).toBe(200);
    }
  }
}

async function cleanup(request: APIRequestContext) {
  const admin = await token(request, 'ADMIN');
  const list = await apiCall(request, admin, 'GET', '/faculty', { params: { keyword: 'ITCK9', size: 100 } });
  const faculties: any[] = (list.body?.data?.content ?? []).filter((f: any) => /^ITCK9/.test(f.code));
  for (const f of faculties) {
    const majors = await apiCall(request, admin, 'GET', `/faculty/${f.id}/majors`, { params: { size: 100 } });
    for (const m of majors.body?.data?.content ?? []) {
      const dr = await apiCall(request, admin, 'DELETE', `/major/${m.publicId}`);
      expect(dr.status, `Không dọn được ngành test ${m.code}: ${JSON.stringify(dr.body)}`).toBe(200);
    }
    const df = await apiCall(request, admin, 'DELETE', `/faculty/${f.id}`);
    expect(df.status, `Không dọn được khoa test ${f.code}: ${JSON.stringify(df.body)}`).toBe(200);
  }
  // Ngành test lạc sang khoa khác (nếu có) cũng phải dọn
  const strayMajors = await dbSelect<{ code: string }>(`SELECT code FROM major WHERE code LIKE ?`, ['ITCN9%']);
  expect(strayMajors, 'Còn ngành test ITCN9xx chưa dọn được').toHaveLength(0);
}

async function facultyRow(code: string) {
  return dbSelect<{ id: number; code: string; name: string; description: string | null; status: string }>(
    `SELECT id, code, name, description, status FROM faculty WHERE code = ?`, [code]);
}

async function majorRow(code: string) {
  return dbSelect<{ id: number; name: string; description: string | null; status: string; head_account_id: number | null; faculty_code: string | null }>(
    `SELECT m.id, m.name, m.description, m.status, m.head_account_id, f.code AS faculty_code
       FROM major m LEFT JOIN faculty f ON f.id = m.faculty_id
      WHERE m.code = ?`, [code]);
}

const path = (r: Response) => new URL(r.url()).pathname;
const isFacultyList = (r: Response) => r.request().method() === 'GET' && path(r).endsWith('/faculty');
const isFacultyCreate = (r: Response) => r.request().method() === 'POST' && path(r).endsWith('/faculty');
const isFacultyUpdate = (r: Response) => r.request().method() === 'PUT' && /\/faculty\/[^/]+$/.test(path(r));
const isMajorList = (r: Response) => r.request().method() === 'GET' && /\/faculty\/[^/]+\/majors$/.test(path(r));
const isFacultyDetail = (r: Response) => r.request().method() === 'GET' && /\/faculty\/[0-9a-f-]{36}$/.test(path(r));
const isMajorCreate = (r: Response) => r.request().method() === 'POST' && /\/faculty\/[^/]+\/majors$/.test(path(r));
const isMajorUpdate = (r: Response) => r.request().method() === 'PUT' && /\/major\/[^/]+$/.test(path(r));

async function openPage(page: Page) {
  const resPromise = page.waitForResponse(isFacultyList);
  await page.goto(PAGE_URL);
  const res = await resPromise;
  await expect(page.getByRole('button', { name: 'Thêm khoa' })).toBeVisible();
  return res;
}

const facultyRowOf = (page: Page, code: string) => page.getByRole('row').filter({ hasText: code });
const majorRowOf = (page: Page, code: string) => page.getByRole('row').filter({ hasText: code });
const dialogWithHeading = (page: Page, name: string) =>
  page.getByRole('dialog').filter({ has: page.getByRole('heading', { name }) });

async function openFacultyDetail(page: Page, code: string) {
  await openPage(page);
  const majorsPromise = page.waitForResponse(isMajorList);
  const detailPromise = page.waitForResponse(isFacultyDetail);
  await facultyRowOf(page, code).click();
  const [majorsRes, detailRes] = await Promise.all([majorsPromise, detailPromise]);
  await expect(page.getByRole('button', { name: 'Thêm ngành' })).toBeVisible();
  return { majorsRes, detailRes };
}

function trackRequests(page: Page, method: string, test: (pathname: string) => boolean) {
  const state = { sent: false };
  page.on('request', (r) => { if (r.method() === method && test(new URL(r.url()).pathname)) state.sent = true; });
  return state;
}

async function fillFaculty(dialog: Locator, v: { code?: string; name?: string; description?: string; status?: string }) {
  if (v.code !== undefined) await dialog.getByLabel(/^Mã khoa/).fill(v.code);
  if (v.name !== undefined) await dialog.getByLabel(/^Tên khoa/).fill(v.name);
  if (v.description !== undefined) await dialog.getByLabel(/^Chi tiết về khoa/).fill(v.description);
  if (v.status !== undefined) await dialog.getByLabel(/^Trạng thái/).selectOption({ label: v.status });
}

async function fillMajor(dialog: Locator, v: { code?: string; name?: string; description?: string; status?: string }) {
  if (v.code !== undefined) await dialog.getByLabel(/^Mã chuyên ngành/).fill(v.code);
  if (v.name !== undefined) await dialog.getByLabel(/^Tên chuyên ngành/).fill(v.name);
  if (v.description !== undefined) await dialog.getByLabel(/^Chi tiết về ngành/).fill(v.description);
  if (v.status !== undefined) await dialog.getByLabel(/^Trạng thái/).selectOption({ label: v.status });
}

// ============================================================================
// TEST
// ============================================================================

test.describe('Quản lý khoa, ngành (Quản trị viên)', () => {
  test.use({ storageState: '.auth/admin.json' });

  test.beforeAll(async ({ request }) => {
    await cleanup(request);
  });

  test.afterEach(async ({ request }) => {
    await cleanup(request);
  });

  // ------------------------------------------------------------------ Danh sách khoa
  test.describe(FN_LIST, () => {
    test(ITC120.title, { annotation: ITC120.annotation }, async ({ page, request }) => {
      await seed(request, K1);
      const res = await openPage(page);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      const content: any[] = body.data.content;
      expect(content[0].code).toBe('ITCK901');
      expect(content[0].totalMajors).toBe(1);

      const dataRows = page.getByRole('row').filter({ hasText: /[0-9]+ chuyên ngành/ });
      await expect(dataRows).toHaveCount(Math.min(10, content.length));
      for (const text of ['ITCK901', 'Khoa Kiểm thử Tích hợp ITC 901', '1 chuyên ngành', 'Hoạt động']) {
        await expect(dataRows.first()).toContainText(text);
      }
      await expect(page.getByText(`Tổng kết quả: ${content.length} khoa`)).toBeVisible();
    });

    test(ITC121.title, { annotation: ITC121.annotation }, async ({ page, request }) => {
      await seed(request, K1, K2);
      await openPage(page);
      const listCalls = trackRequests(page, 'GET', (p) => p.endsWith('/faculty'));
      await page.getByPlaceholder(SEARCH_PLACEHOLDER).fill('ITCK90');
      await page.getByLabel('Lọc theo trạng thái khoa').selectOption({ label: 'Không hoạt động' });

      const dataRows = page.getByRole('row').filter({ hasText: /[0-9]+ chuyên ngành/ });
      await expect(dataRows).toHaveCount(1);
      await expect(dataRows.first()).toContainText('ITCK902');
      await expect(dataRows.first()).toContainText('Khoa Kiểm thử Tích hợp ITC 902');
      await expect(dataRows.first()).toContainText('Không hoạt động');
      await expect(facultyRowOf(page, 'ITCK901')).toHaveCount(0);
      await expect(page.getByText('Tổng kết quả: 1 khoa')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Đặt lại bộ lọc' })).toBeVisible();
      expect(listCalls.sent).toBe(false);
    });

    test(ITC122.title, { annotation: ITC122.annotation }, async ({ page }) => {
      const res = await openPage(page);
      expect(res.status()).toBe(200);
      expect((await res.json()).code).toBe(1000);
      await page.getByPlaceholder(SEARCH_PLACEHOLDER).fill('KHONGTONTAI9999');
      await expect(page.getByText('Không tìm thấy khoa đào tạo phù hợp.')).toBeVisible();
      await expect(page.getByText('Tổng kết quả: 0 khoa')).toBeVisible();
    });
  });

  // ------------------------------------------------------------------ Thêm khoa
  test.describe(FN_CREATE, () => {
    async function openCreate(page: Page) {
      await openPage(page);
      await page.getByRole('button', { name: 'Thêm khoa' }).click();
      const dialog = dialogWithHeading(page, 'Thêm khoa đào tạo');
      await expect(dialog).toBeVisible();
      return dialog;
    }

    test(ITC123.title, { annotation: ITC123.annotation }, async ({ page }) => {
      const dialog = await openCreate(page);
      await fillFaculty(dialog, { code: 'itck911', name: 'Khoa Kiểm thử Tích hợp ITC 911', description: 'Mô tả khoa ITC 911' });
      const resPromise = page.waitForResponse(isFacultyCreate);
      await dialog.getByRole('button', { name: 'Lưu' }).click();
      const res = await resPromise;
      const sent = res.request().postDataJSON();
      expect(sent.code).toBe('ITCK911');
      expect(sent.name).toBe('Khoa Kiểm thử Tích hợp ITC 911');
      expect(sent.status).toBe('ACTIVE');
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.message).toBe('Thêm mới khoa thành công');
      await expect(page.getByText('Thêm khoa mới thành công!').first()).toBeVisible();
      await expect(dialog).toBeHidden();

      const row = facultyRowOf(page, 'ITCK911');
      for (const text of ['Khoa Kiểm thử Tích hợp ITC 911', '0 chuyên ngành', 'Hoạt động']) {
        await expect(row).toContainText(text);
      }
      const rows = await facultyRow('ITCK911');
      expect(rows).toHaveLength(1);
      expect(rows[0].description).toBe('Mô tả khoa ITC 911');
      expect(rows[0].status).toBe('ACTIVE');
    });

    test(ITC124.title, { annotation: ITC124.annotation }, async ({ page }) => {
      const dialog = await openCreate(page);
      const posts = trackRequests(page, 'POST', (p) => p.endsWith('/faculty'));
      await dialog.getByRole('button', { name: 'Lưu' }).click();
      await expect(dialog.getByText('Vui lòng nhập mã khoa', { exact: true })).toBeVisible();
      await expect(dialog.getByText('Vui lòng nhập tên khoa', { exact: true })).toBeVisible();
      await expect(dialog).toBeVisible();
      expect(posts.sent).toBe(false);
    });

    test(ITC125.title, { annotation: ITC125.annotation }, async ({ page, request }) => {
      await seed(request, K1);
      const dialog = await openCreate(page);
      await fillFaculty(dialog, { code: 'ITCK912', name: 'Khoa Kiểm thử Tích hợp ITC 901' });
      const resPromise = page.waitForResponse(isFacultyCreate);
      await dialog.getByRole('button', { name: 'Lưu' }).click();
      const res = await resPromise;
      expect(res.status()).toBe(409);
      const body = await res.json();
      expect(body.code).toBe(3010);
      expect(body.message).toBe('Tên khoa đã tồn tại trong hệ thống');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText('Tên khoa đã tồn tại trong hệ thống', { exact: true })).toBeVisible();
      expect(await facultyRow('ITCK912')).toHaveLength(0);
    });

    test(ITC126.title, { annotation: ITC126.annotation }, async ({ page, request }) => {
      await seed(request, K1);
      const dialog = await openCreate(page);
      const posts = trackRequests(page, 'POST', (p) => p.endsWith('/faculty'));
      await fillFaculty(dialog, { code: 'itck901', name: 'Khoa Kiểm thử Tích hợp ITC 913' });
      await dialog.getByRole('button', { name: 'Lưu' }).click();
      await expect(dialog.getByText('Mã khoa này đã tồn tại trong hệ thống.', { exact: true })).toBeVisible();
      await expect(dialog).toBeVisible();
      expect(posts.sent).toBe(false);
      expect(await dbSelect(`SELECT id FROM faculty WHERE name = ?`, ['Khoa Kiểm thử Tích hợp ITC 913'])).toHaveLength(0);
    });
  });

  // ------------------------------------------------------------------ Cập nhật khoa
  test.describe(FN_UPDATE, () => {
    async function openEditFaculty(page: Page) {
      await openFacultyDetail(page, 'ITCK901');
      await page.getByRole('button', { name: 'Cập nhật thông tin khoa' }).click();
      const dialog = dialogWithHeading(page, 'Cập nhật thông tin khoa');
      await expect(dialog).toBeVisible();
      return dialog;
    }

    test(ITC127.title, { annotation: ITC127.annotation }, async ({ page, request }) => {
      await seed(request, K1);
      const k1Id = await facultyIdByCode(request, await token(request, 'ADMIN'), 'ITCK901');
      const dialog = await openEditFaculty(page);
      await expect(dialog.getByLabel(/^Mã khoa/)).toHaveValue('ITCK901');
      await expect(dialog.getByLabel(/^Tên khoa/)).toHaveValue('Khoa Kiểm thử Tích hợp ITC 901');

      await fillFaculty(dialog, { name: 'Khoa Kiểm thử Tích hợp ITC 901 Sửa' });
      const resPromise = page.waitForResponse(isFacultyUpdate);
      await dialog.getByRole('button', { name: 'Lưu' }).click();
      const res = await resPromise;
      expect(path(res).endsWith(`/faculty/${k1Id}`)).toBe(true);
      const sent = res.request().postDataJSON();
      expect(sent.code).toBe('ITCK901');
      expect(sent.name).toBe('Khoa Kiểm thử Tích hợp ITC 901 Sửa');
      expect(sent.status).toBe('ACTIVE');
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.message).toBe('Cập nhật thông tin khoa thành công');
      await expect(page.getByText('Cập nhật thông tin khoa thành công!').first()).toBeVisible();
      await expect(dialog).toBeHidden();
      await expect(page.getByText('Khoa Kiểm thử Tích hợp ITC 901 Sửa', { exact: true })).toBeVisible();

      const rows = await facultyRow('ITCK901');
      expect(rows[0].name).toBe('Khoa Kiểm thử Tích hợp ITC 901 Sửa');
      expect(rows[0].status).toBe('ACTIVE');
    });

    test(ITC128.title, { annotation: ITC128.annotation }, async ({ page, request }) => {
      await seed(request, K1);
      const dialog = await openEditFaculty(page);
      await expect(dialog.getByLabel(/^Chi tiết về khoa/)).toHaveValue('Mô tả khoa ITC 901');
      await fillFaculty(dialog, { name: 'Khoa Kiểm thử Tích hợp ITC 901 Sửa' });
      const resPromise = page.waitForResponse(isFacultyUpdate);
      await dialog.getByRole('button', { name: 'Lưu' }).click();
      const res = await resPromise;
      expect(res.request().postDataJSON().description).toBe('Mô tả khoa ITC 901');
      expect(res.status()).toBe(200);
      expect((await res.json()).code).toBe(1000);
      expect((await facultyRow('ITCK901'))[0].description).toBe('Mô tả khoa ITC 901');
    });

    test(ITC129.title, { annotation: ITC129.annotation }, async ({ page, request }) => {
      await seed(request, K1);
      const dialog = await openEditFaculty(page);
      await fillFaculty(dialog, { status: 'Không hoạt động' });
      const resPromise = page.waitForResponse(isFacultyUpdate);
      await dialog.getByRole('button', { name: 'Lưu' }).click();
      const res = await resPromise;
      expect(res.request().postDataJSON().status).toBe('INACTIVE');
      expect(res.status()).toBe(400);
      const body = await res.json();
      const msg = 'Không thể vô hiệu hóa khoa nếu vẫn còn ngành hoặc sinh viên/giảng viên đang hoạt động trong khoa đó';
      expect(body.code).toBe(3012);
      expect(body.message).toBe(msg);
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText(msg, { exact: true })).toBeVisible();
      expect((await facultyRow('ITCK901'))[0].status).toBe('ACTIVE');
    });
  });

  // ------------------------------------------------------------------ Chi tiết khoa
  test.describe(FN_DETAIL, () => {
    test(ITC130.title, { annotation: ITC130.annotation }, async ({ page, request }) => {
      await seed(request, K1);
      const k1Id = await facultyIdByCode(request, await token(request, 'ADMIN'), 'ITCK901');
      const { majorsRes } = await openFacultyDetail(page, 'ITCK901');
      expect(path(majorsRes).endsWith(`/faculty/${k1Id}/majors`)).toBe(true);
      expect(majorsRes.status()).toBe(200);
      const body = await majorsRes.json();
      expect(body.code).toBe(1000);
      expect(body.data.content.map((m: any) => m.code)).toEqual(['ITCN901']);

      await expect(page.getByText('Khoa Kiểm thử Tích hợp ITC 901', { exact: true })).toBeVisible();
      await expect(page.getByText('Trạng thái hoạt động').locator('..')).toContainText('Đang hoạt động');
      await expect(page.getByText('Quy mô đào tạo').locator('..')).toContainText('1 chuyên ngành');
      const row = majorRowOf(page, 'ITCN901');
      for (const text of ['Ngành Kiểm thử 901', 'Chưa bổ nhiệm', 'Mô tả ngành ITC 901', 'Hoạt động']) {
        await expect(row).toContainText(text);
      }
      await expect(page.getByText('Danh sách chuyên ngành: 1 ngành')).toBeVisible();
    });

    test(ITC131.title, { annotation: ITC131.annotation }, async ({ page, request }) => {
      await seed(request, K1);
      const { detailRes } = await openFacultyDetail(page, 'ITCK901');
      expect(detailRes.status()).toBe(200);
      const body = await detailRes.json();
      expect(body.code).toBe(1000);
      expect(body.data.description).toBe('Mô tả khoa ITC 901');
      const intro = page.getByText('Giới thiệu chi tiết về khoa').locator('..');
      await expect(intro).toContainText('Mô tả khoa ITC 901');
    });
  });

  // ------------------------------------------------------------------ Thêm ngành
  test.describe(FN_MAJOR_CREATE, () => {
    async function openCreateMajor(page: Page) {
      await openFacultyDetail(page, 'ITCK901');
      await page.getByRole('button', { name: 'Thêm ngành' }).click();
      const dialog = dialogWithHeading(page, 'Thêm chuyên ngành mới');
      await expect(dialog).toBeVisible();
      return dialog;
    }

    test(ITC132.title, { annotation: ITC132.annotation }, async ({ page, request }) => {
      await seed(request, K1);
      const k1Id = await facultyIdByCode(request, await token(request, 'ADMIN'), 'ITCK901');
      const dialog = await openCreateMajor(page);
      await expect(dialog).toContainText('Khoa trực thuộc: Khoa Kiểm thử Tích hợp ITC 901');
      await fillMajor(dialog, { code: 'itcn911', name: 'Ngành Kiểm thử 911', description: 'Mô tả ngành ITC 911' });
      const resPromise = page.waitForResponse(isMajorCreate);
      await dialog.getByRole('button', { name: 'Lưu' }).click();
      const res = await resPromise;
      expect(path(res).endsWith(`/faculty/${k1Id}/majors`)).toBe(true);
      const sent = res.request().postDataJSON();
      expect(sent.code).toBe('ITCN911');
      expect(sent.name).toBe('Ngành Kiểm thử 911');
      expect(sent.status).toBe('ACTIVE');
      expect(sent.headTeacherId ?? null).toBeNull();
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.message).toBe('Thêm mới ngành thành công');
      await expect(page.getByText('Thêm chuyên ngành mới thành công!').first()).toBeVisible();
      await expect(dialog).toBeHidden();
      const row = majorRowOf(page, 'ITCN911');
      await expect(row).toContainText('Ngành Kiểm thử 911');
      await expect(row).toContainText('Chưa bổ nhiệm');

      const rows = await majorRow('ITCN911');
      expect(rows).toHaveLength(1);
      expect(rows[0].faculty_code).toBe('ITCK901');
      expect(rows[0].status).toBe('ACTIVE');
      expect(rows[0].head_account_id).toBeNull();
    });

    test(ITC133.title, { annotation: ITC133.annotation }, async ({ page, request }) => {
      await seed(request, K1);
      const dialog = await openCreateMajor(page);
      const posts = trackRequests(page, 'POST', (p) => /\/majors$/.test(p));
      await dialog.getByRole('button', { name: 'Lưu' }).click();
      await expect(dialog.getByText('Vui lòng nhập mã chuyên ngành', { exact: true })).toBeVisible();
      await expect(dialog.getByText('Vui lòng nhập tên chuyên ngành', { exact: true })).toBeVisible();
      await expect(dialog).toBeVisible();
      expect(posts.sent).toBe(false);
    });

    test(ITC134.title, { annotation: ITC134.annotation }, async ({ page, request }) => {
      await seed(request, K1);
      const dialog = await openCreateMajor(page);
      await fillMajor(dialog, { code: 'ITCN901', name: 'Ngành Kiểm thử 912' });
      const resPromise = page.waitForResponse(isMajorCreate);
      await dialog.getByRole('button', { name: 'Lưu' }).click();
      const res = await resPromise;
      expect(res.status()).toBe(409);
      const body = await res.json();
      expect(body.code).toBe(3021);
      expect(body.message).toBe('Mã ngành đã tồn tại trong hệ thống');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText('Mã ngành đã tồn tại trong hệ thống', { exact: true })).toBeVisible();
      expect(await dbSelect(`SELECT id FROM major WHERE name = ?`, ['Ngành Kiểm thử 912'])).toHaveLength(0);
      const count = await dbSelect<{ total: number }>(
        `SELECT COUNT(*) AS total FROM major m JOIN faculty f ON f.id = m.faculty_id WHERE f.code = ?`, ['ITCK901']);
      expect(Number(count[0].total)).toBe(1);
    });

    test(ITC135.title, { annotation: ITC135.annotation }, async ({ page, request }) => {
      await seed(request, K1);
      const dialog = await openCreateMajor(page);
      await fillMajor(dialog, { code: 'ITCN912', name: 'Ngành Kiểm thử 901' });
      const resPromise = page.waitForResponse(isMajorCreate);
      await dialog.getByRole('button', { name: 'Lưu' }).click();
      const res = await resPromise;
      expect(res.status()).toBe(409);
      const body = await res.json();
      expect(body.code).toBe(3011);
      expect(body.message).toBe('Tên ngành đã tồn tại trong cùng một khoa');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText('Tên ngành đã tồn tại trong cùng một khoa', { exact: true })).toBeVisible();
      expect(await majorRow('ITCN912')).toHaveLength(0);
    });

    test(ITC136.title, { annotation: ITC136.annotation }, async ({ page, request }) => {
      await seed(request, K1);
      const admin = await token(request, 'ADMIN');
      const cands = await apiCall(request, admin, 'GET', '/faculty/head-candidates');
      const other = (cands.body?.data ?? []).find((c: any) => c.majorName === 'Kỹ thuật phần mềm' && c.teacherId);
      expect(other, 'Cần có giảng viên trong trường thuộc ngành Kỹ thuật phần mềm').toBeTruthy();

      const dialog = await openCreateMajor(page);
      await fillMajor(dialog, { code: 'ITCN913', name: 'Ngành Kiểm thử 913' });
      await dialog.getByRole('button', { name: /Chọn giảng viên làm Trưởng bộ môn/ }).click();
      await dialog.getByPlaceholder('Gõ tên hoặc email giảng viên...').fill(other.email);
      await dialog.getByRole('button').filter({ hasText: other.email }).first().click();

      const resPromise = page.waitForResponse(isMajorCreate);
      await dialog.getByRole('button', { name: 'Lưu' }).click();
      const res = await resPromise;
      expect(res.request().postDataJSON().headTeacherId).toBe(other.teacherId);
      expect(res.status()).toBe(400);
      const body = await res.json();
      const msg = 'Trưởng ngành phải là giáo viên trong trường thuộc ngành này và tài khoản đang hoạt động';
      expect(body.code).toBe(3016);
      expect(body.message).toBe(msg);
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText(msg, { exact: true })).toBeVisible();
      expect(await majorRow('ITCN913')).toHaveLength(0);
    });
  });

  // ------------------------------------------------------------------ Cập nhật ngành
  test.describe(FN_MAJOR_UPDATE, () => {
    async function openEditMajor(page: Page, code: string) {
      await openFacultyDetail(page, 'ITCK901');
      await majorRowOf(page, code).getByRole('button', { name: 'Cập nhật' }).click();
      const dialog = dialogWithHeading(page, 'Cập nhật chuyên ngành');
      await expect(dialog).toBeVisible();
      return dialog;
    }

    test(ITC137.title, { annotation: ITC137.annotation }, async ({ page, request }) => {
      await seed(request, K1);
      const admin = await token(request, 'ADMIN');
      const m1Id = await majorIdByCode(request, admin, await facultyIdByCode(request, admin, 'ITCK901'), 'ITCN901');
      const dialog = await openEditMajor(page, 'ITCN901');
      await expect(dialog.getByLabel(/^Mã chuyên ngành/)).toHaveValue('ITCN901');
      await expect(dialog.getByLabel(/^Tên chuyên ngành/)).toHaveValue('Ngành Kiểm thử 901');

      await fillMajor(dialog, { name: 'Ngành Kiểm thử 901 Sửa', status: 'Không hoạt động' });
      const resPromise = page.waitForResponse(isMajorUpdate);
      await dialog.getByRole('button', { name: 'Lưu' }).click();
      const res = await resPromise;
      expect(path(res).endsWith(`/major/${m1Id}`)).toBe(true);
      const sent = res.request().postDataJSON();
      expect(sent.name).toBe('Ngành Kiểm thử 901 Sửa');
      expect(sent.status).toBe('INACTIVE');
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.code).toBe(1000);
      expect(body.message).toBe('Cập nhật ngành thành công');
      await expect(page.getByText('Cập nhật chuyên ngành thành công!').first()).toBeVisible();
      await expect(dialog).toBeHidden();
      const row = majorRowOf(page, 'ITCN901');
      await expect(row).toContainText('Ngành Kiểm thử 901 Sửa');
      await expect(row).toContainText('Không hoạt động');

      const rows = await majorRow('ITCN901');
      expect(rows[0].name).toBe('Ngành Kiểm thử 901 Sửa');
      expect(rows[0].status).toBe('INACTIVE');
    });

    test(ITC138.title, { annotation: ITC138.annotation }, async ({ page, request }) => {
      await seed(request, { ...K1, majors: [M1, M2] });
      const dialog = await openEditMajor(page, 'ITCN902');
      await fillMajor(dialog, { name: 'Ngành Kiểm thử 901' });
      const resPromise = page.waitForResponse(isMajorUpdate);
      await dialog.getByRole('button', { name: 'Lưu' }).click();
      const res = await resPromise;
      expect(res.status()).toBe(409);
      const body = await res.json();
      expect(body.code).toBe(3011);
      expect(body.message).toBe('Tên ngành đã tồn tại trong cùng một khoa');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText('Tên ngành đã tồn tại trong cùng một khoa', { exact: true })).toBeVisible();
      expect((await majorRow('ITCN902'))[0].name).toBe('Ngành Kiểm thử 902');
    });
  });
});

// ------------------------------------------------------------------ Security
test.describe('SecurityTest - Khoa, ngành (Admin)', () => {
  test.beforeAll(async ({ request }) => {
    await cleanup(request);
  });
  test.afterEach(async ({ request }) => {
    await cleanup(request);
  });

  test.describe('Trưởng bộ môn', () => {
    test.use({ storageState: '.auth/head_of_major.json' });
    test(SEC061.title, { annotation: SEC061.annotation }, async ({ page, request }) => {
      await page.goto(PAGE_URL);
      await expect(page).toHaveURL(/\/department$/);
      await expect(page.getByRole('button', { name: 'Thêm khoa' })).toHaveCount(0);

      const hom = await token(request, 'HEAD_OF_MAJOR');
      const res = await apiCall(request, hom, 'GET', '/faculty');
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(2001);
      expect(res.body.data ?? null).toBeNull();
    });
  });

  test.describe('Sinh viên', () => {
    test.use({ storageState: '.auth/student.json' });
    test(SEC062.title, { annotation: SEC062.annotation }, async ({ page, request }) => {
      await page.goto(PAGE_URL);
      await expect(page.getByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Thêm khoa' })).toHaveCount(0);

      const student = await token(request, 'STUDENT');
      const res = await apiCall(request, student, 'POST', '/faculty', {
        data: { code: 'ITCK951', name: 'Khoa Kiểm thử Tích hợp ITC 951', status: 'ACTIVE' },
      });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(2001);
      expect(await facultyRow('ITCK951')).toHaveLength(0);
    });
  });

  test.describe('Chưa đăng nhập', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test(SEC063.title, { annotation: SEC063.annotation }, async ({ page, request }) => {
      await seed(request, K1);
      const admin = await token(request, 'ADMIN');
      const m1Id = await majorIdByCode(request, admin, await facultyIdByCode(request, admin, 'ITCK901'), 'ITCN901');
      await page.goto(PAGE_URL);
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByRole('button', { name: 'Thêm khoa' })).toHaveCount(0);

      const res = await request.put(`${getApiBaseUrl()}/major/${m1Id}`, {
        data: { code: 'ITCN901', name: 'Ngành bị sửa trái phép', status: 'ACTIVE' },
      });
      expect(res.status()).toBe(401);
      expect((await res.json()).code).toBe(2000);
      expect((await majorRow('ITCN901'))[0].name).toBe('Ngành Kiểm thử 901');
    });
  });
});
