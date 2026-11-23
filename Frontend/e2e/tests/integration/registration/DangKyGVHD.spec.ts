import { test, expect, type APIRequestContext, type BrowserContext } from '@playwright/test';
import { defineItc, defineItcSec } from '../../../support/integration-test-case';
import { apiCall, getApiBaseUrl, loginByEmail } from '../../../support/api';
import { dbSelect } from '../../../support/db';

// ============================================================================
// ĐẶC TẢ TEST CASE (ITC001..ITC014 & TC-SEC-001..TC-SEC-004)
// ============================================================================

const ITC001 = defineItc({
  id: 'ITC001',
  feature: 'registration',
  module: 'DangKyGVHD',
  sheet: 'DangKyGVHD',
  fn: 'Xem tổng quan và lịch sử đăng ký GVHD',
  description: 'Kiểm tra hiển thị tổng quan và lịch sử khi sinh viên chưa có đơn đăng ký trong học kỳ hiện tại đang mở hạn',
  procedure:
    '1. Đăng nhập vai trò Sinh viên.\n' +
    '2. Mở màn hình "Đăng ký GVHD".',
  expected:
    'Gọi GET /api/student/advisor-registrations/overview, HTTP 200, code = 1000 (trạng thái hạn OPEN).\n' +
    'Gọi GET /api/student/advisor-registrations/current, HTTP 200, code = 1000.\n' +
    'Gọi GET /api/student/advisor-registrations, HTTP 200, code = 1000.\n' +
    'Thẻ tổng quan hiển thị Giảng viên hướng dẫn "Chưa có", Đề tài đăng ký "Chưa có", nút "Tạo đơn đăng ký GVHD" đang bật.\n' +
    'Bảng lịch sử hiển thị "Chưa có đơn đăng ký nào trong học kỳ này.".\n' +
    'Sinh viên 9990000101 có đề tài đồ án ở giai đoạn đăng ký GVHD và chưa có đơn đăng ký nào trong học kỳ hiện tại.',
  precondition:
    'Học kỳ hiện tại đang diễn ra, chưa khóa phân công GVHD, hạn đăng ký GVHD đang mở; sinh viên 9990000101 có đề tài ở giai đoạn đăng ký GVHD và chưa có đơn đăng ký',
});

const ITC002 = defineItc({
  id: 'ITC002',
  feature: 'registration',
  module: 'DangKyGVHD',
  sheet: 'DangKyGVHD',
  fn: 'Xem tổng quan và lịch sử đăng ký GVHD',
  description: 'Kiểm tra nút đăng ký bị khóa khi đợt đăng ký GVHD của học kỳ hiện tại đã hết hạn',
  procedure:
    '1. Đăng nhập vai trò Sinh viên.\n' +
    '2. Mở màn hình "Đăng ký GVHD" khi thời hạn đăng ký GVHD đã kết thúc.',
  expected:
    'Gọi GET /api/student/advisor-registrations/overview, HTTP 200, code = 1000 (trạng thái hạn CLOSED).\n' +
    'Thẻ tổng quan hiển thị trạng thái hạn "Đã hết hạn", nút "Tạo đơn đăng ký GVHD" bị vô hiệu hóa kèm lý do "Đã hết thời hạn đăng ký GVHD".',
  precondition:
    'Học kỳ hiện tại đang diễn ra, thời hạn đăng ký GVHD đã kết thúc; sinh viên 9990000101 chưa có đơn đăng ký',
});

const ITC003 = defineItc({
  id: 'ITC003',
  feature: 'registration',
  module: 'DangKyGVHD',
  sheet: 'DangKyGVHD',
  fn: 'Xem danh sách giảng viên có thể đăng ký',
  description: 'Kiểm tra mở hộp thoại đăng ký hiển thị danh sách giảng viên còn chỉ tiêu và tìm kiếm giảng viên theo mã/tên',
  procedure:
    '1. Đăng nhập vai trò Sinh viên, mở màn hình "Đăng ký GVHD".\n' +
    '2. Bấm nút "Tạo đơn đăng ký GVHD".\n' +
    '3. Bấm vào ô "Chọn giảng viên hướng dẫn" để mở danh sách và nhập mã giảng viên "GV999101" vào ô tìm kiếm.',
  expected:
    'Gọi GET /api/student/advisor-registrations/advisors, HTTP 200, code = 1000.\n' +
    'Danh sách hiển thị giảng viên còn chỉ tiêu "Nguyễn Văn An (GV999101)" kèm số chỉ tiêu còn lại và số đơn chờ duyệt, không hiển thị giảng viên đã hết chỉ tiêu.',
  precondition:
    'Học kỳ hiện tại đang mở hạn đăng ký GVHD; giảng viên Nguyễn Văn An (GV999101) còn chỉ tiêu hướng dẫn; giảng viên Lê Hoàng Cường (GV999103) đã hết chỉ tiêu',
});

const ITC004 = defineItc({
  id: 'ITC004',
  feature: 'registration',
  module: 'DangKyGVHD',
  sheet: 'DangKyGVHD',
  fn: 'Tạo đơn đăng ký GVHD',
  description: 'Kiểm tra tạo đơn đăng ký GVHD thành công khi chọn giảng viên còn chỉ tiêu và nhập tên đề tài dự kiến',
  procedure:
    '1. Đăng nhập vai trò Sinh viên, mở màn hình "Đăng ký GVHD".\n' +
    '2. Bấm nút "Tạo đơn đăng ký GVHD".\n' +
    '3. Chọn giảng viên "Nguyễn Văn An (GV999101)".\n' +
    '4. Nhập tên đề tài "Hệ thống quản lý đồ án tốt nghiệp thông minh" và bấm "Gửi đăng ký".',
  expected:
    'Gọi POST /api/student/advisor-registrations, HTTP 200, code = 1000.\n' +
    'Hiện thông báo "Đăng ký giảng viên hướng dẫn thành công".\n' +
    'Bảng lịch sử có dòng đơn đăng ký giảng viên "Nguyễn Văn An", đề tài "Hệ thống quản lý đồ án tốt nghiệp thông minh", trạng thái "Chờ duyệt" và nút "Sửa đơn".\n' +
    'Nút chính trên thẻ tổng quan đổi thành "Chỉnh sửa đơn đăng ký".\n' +
    'Đơn đăng ký của sinh viên 9990000101 trong học kỳ hiện tại được lưu ở trạng thái PENDING với giảng viên GV999101 và tên đề tài đã nhập.',
  precondition:
    'Học kỳ hiện tại đang mở hạn đăng ký GVHD; sinh viên 9990000101 đủ điều kiện và chưa có đơn đăng ký; giảng viên Nguyễn Văn An (GV999101) còn chỉ tiêu',
});

const ITC005 = defineItc({
  id: 'ITC005',
  feature: 'registration',
  module: 'DangKyGVHD',
  sheet: 'DangKyGVHD',
  fn: 'Tạo đơn đăng ký GVHD',
  description: 'Kiểm tra tạo đơn đăng ký GVHD thành công khi sinh viên để trống tên đề tài dự kiến',
  procedure:
    '1. Đăng nhập vai trò Sinh viên, mở màn hình "Đăng ký GVHD".\n' +
    '2. Bấm nút "Tạo đơn đăng ký GVHD".\n' +
    '3. Chọn giảng viên "Nguyễn Văn An (GV999101)", để trống ô Tên đề tài và bấm "Gửi đăng ký".',
  expected:
    'Gọi POST /api/student/advisor-registrations với topicName = null, HTTP 200, code = 1000.\n' +
    'Hiện thông báo "Đăng ký giảng viên hướng dẫn thành công".\n' +
    'Bảng lịch sử hiển thị dòng đơn của giảng viên "Nguyễn Văn An" với cột Tên đề tài dự kiến là "Chưa có tên đề tài" và trạng thái "Chờ duyệt".\n' +
    'Đơn đăng ký của sinh viên 9990000101 trong học kỳ hiện tại được lưu ở trạng thái PENDING với tên đề tài để trống (null).',
  precondition:
    'Học kỳ hiện tại đang mở hạn đăng ký GVHD; sinh viên 9990000101 đủ điều kiện và chưa có đơn đăng ký; giảng viên Nguyễn Văn An (GV999101) còn chỉ tiêu',
});

const ITC006 = defineItc({
  id: 'ITC006',
  feature: 'registration',
  module: 'DangKyGVHD',
  sheet: 'DangKyGVHD',
  fn: 'Tạo đơn đăng ký GVHD',
  description: 'Kiểm tra giao diện chặn gửi form khi sinh viên chưa chọn giảng viên hướng dẫn',
  procedure:
    '1. Đăng nhập vai trò Sinh viên, mở màn hình "Đăng ký GVHD".\n' +
    '2. Bấm nút "Tạo đơn đăng ký GVHD".\n' +
    '3. Không chọn giảng viên hướng dẫn, nhập tên đề tài "Đề tài thử nghiệm" và bấm "Gửi đăng ký".',
  expected:
    'Không gọi POST /api/student/advisor-registrations.\n' +
    'Hộp thoại hiển thị thông báo lỗi "Vui lòng chọn một giảng viên hướng dẫn từ danh sách.".\n' +
    'Sinh viên 9990000101 vẫn chưa có đơn đăng ký nào trong học kỳ hiện tại.',
  precondition:
    'Học kỳ hiện tại đang mở hạn đăng ký GVHD; sinh viên 9990000101 chưa có đơn đăng ký',
});

const ITC007 = defineItc({
  id: 'ITC007',
  feature: 'registration',
  module: 'DangKyGVHD',
  sheet: 'DangKyGVHD',
  fn: 'Tạo đơn đăng ký GVHD',
  description: 'Kiểm tra chặn tạo đơn mới khi giảng viên vừa hết chỉ tiêu hướng dẫn trước thời điểm bấm gửi',
  procedure:
    '1. Đăng nhập vai trò Sinh viên, mở màn hình "Đăng ký GVHD" và bấm "Tạo đơn đăng ký GVHD".\n' +
    '2. Chọn giảng viên "Lê Hoàng Cường (GV999103)" khi giảng viên còn 1 chỉ tiêu (ngay sau đó chỉ tiêu của giảng viên giảm về 0).\n' +
    '3. Nhập tên đề tài "Đề tài kiểm thử hết chỉ tiêu" và bấm "Gửi đăng ký".',
  expected:
    'Gọi POST /api/student/advisor-registrations, HTTP 400, code = 4000.\n' +
    'Hộp thoại hiển thị thông báo lỗi "Giảng viên đã đủ chỉ tiêu hướng dẫn trong học kỳ này".\n' +
    'Sinh viên 9990000101 không có đơn đăng ký mới được tạo trong học kỳ hiện tại.',
  precondition:
    'Học kỳ hiện tại đang mở hạn đăng ký GVHD; giảng viên Lê Hoàng Cường (GV999103) đạt đủ chỉ tiêu ngay trước khi sinh viên bấm gửi đơn',
});

const ITC008 = defineItc({
  id: 'ITC008',
  feature: 'registration',
  module: 'DangKyGVHD',
  sheet: 'DangKyGVHD',
  fn: 'Tạo đơn đăng ký GVHD',
  description: 'Kiểm tra chặn tạo đơn mới khi đợt đăng ký GVHD vừa hết hạn trước thời điểm bấm gửi',
  procedure:
    '1. Đăng nhập vai trò Sinh viên, mở màn hình "Đăng ký GVHD" và bấm "Tạo đơn đăng ký GVHD".\n' +
    '2. Chọn giảng viên "Nguyễn Văn An (GV999101)" và nhập tên đề tài "Đề tài kiểm thử hết hạn" (ngay sau đó thời hạn đăng ký kết thúc).\n' +
    '3. Bấm "Gửi đăng ký".',
  expected:
    'Gọi POST /api/student/advisor-registrations, HTTP 403, code = 2001.\n' +
    'Hộp thoại hiển thị thông báo lỗi "Đợt đăng ký GVHD chưa mở hoặc đã hết hạn".\n' +
    'Sinh viên 9990000101 không có đơn đăng ký mới được tạo trong học kỳ hiện tại.',
  precondition:
    'Sinh viên mở hộp thoại khi còn hạn, nhưng thời hạn đăng ký GVHD kết thúc trước khi bấm gửi',
});

const ITC009 = defineItc({
  id: 'ITC009',
  feature: 'registration',
  module: 'DangKyGVHD',
  sheet: 'DangKyGVHD',
  fn: 'Tạo đơn đăng ký GVHD',
  description: 'Kiểm tra chặn tạo đơn mới khi sinh viên đã có đơn đăng ký chưa bị từ chối trong học kỳ',
  procedure:
    '1. Đăng nhập vai trò Sinh viên, mở màn hình "Đăng ký GVHD" khi chưa có đơn và mở hộp thoại "Tạo đơn đăng ký GVHD".\n' +
    '2. Chọn giảng viên "Nguyễn Văn An (GV999101)" (đồng thời ở phiên khác sinh viên đã gửi 1 đơn đang chờ duyệt).\n' +
    '3. Bấm "Gửi đăng ký".',
  expected:
    'Gọi POST /api/student/advisor-registrations, HTTP 409, code = 1004.\n' +
    'Hộp thoại hiển thị thông báo lỗi "Bạn đã có đơn đăng ký GVHD chưa bị từ chối, không thể tạo đơn mới".\n' +
    'Sinh viên 9990000101 vẫn chỉ có duy nhất 1 đơn đăng ký trong học kỳ hiện tại.',
  precondition:
    'Sinh viên 9990000101 đã có 1 đơn đăng ký ở trạng thái PENDING trong học kỳ hiện tại trước thời điểm gửi',
});

const ITC010 = defineItc({
  id: 'ITC010',
  feature: 'registration',
  module: 'DangKyGVHD',
  sheet: 'DangKyGVHD',
  fn: 'Tạo đơn đăng ký GVHD',
  description: 'Kiểm tra sinh viên tạo lại đơn đăng ký mới thành công sau khi đơn trước đó bị giảng viên từ chối',
  procedure:
    '1. Đăng nhập vai trò Sinh viên (đơn gần nhất đã bị giảng viên Nguyễn Văn An từ chối), mở màn hình "Đăng ký GVHD".\n' +
    '2. Bấm nút "Tạo đơn đăng ký mới".\n' +
    '3. Chọn giảng viên "Trần Thị Bình (GV999102)", nhập tên đề tài "Ứng dụng AI phân tích dữ liệu học tập" và bấm "Gửi đăng ký".',
  expected:
    'Gọi POST /api/student/advisor-registrations, HTTP 200, code = 1000.\n' +
    'Hiện thông báo "Đăng ký giảng viên hướng dẫn thành công".\n' +
    'Bảng lịch sử hiển thị 2 dòng: dòng mới nhất của giảng viên "Trần Thị Bình" ở trạng thái "Chờ duyệt" và dòng cũ của giảng viên "Nguyễn Văn An" ở trạng thái "Đã từ chối".\n' +
    'Sinh viên 9990000101 có 2 bản ghi lịch sử đơn đăng ký trong học kỳ hiện tại (1 đơn REJECTED và 1 đơn PENDING mới).',
  precondition:
    'Học kỳ hiện tại đang mở hạn đăng ký GVHD; đơn đăng ký trước đó của sinh viên 9990000101 đã ở trạng thái REJECTED; giảng viên Trần Thị Bình (GV999102) còn chỉ tiêu',
});

const ITC011 = defineItc({
  id: 'ITC011',
  feature: 'registration',
  module: 'DangKyGVHD',
  sheet: 'DangKyGVHD',
  fn: 'Cập nhật đơn đăng ký GVHD',
  description: 'Kiểm tra cập nhật đơn đăng ký đang chờ duyệt thành công khi đổi giảng viên hướng dẫn và sửa tên đề tài',
  procedure:
    '1. Đăng nhập vai trò Sinh viên đang có đơn ở trạng thái "Chờ duyệt" với giảng viên Nguyễn Văn An, mở màn hình "Đăng ký GVHD".\n' +
    '2. Bấm nút "Sửa đơn" trên dòng đơn đang chờ duyệt.\n' +
    '3. Đổi giảng viên sang "Trần Thị Bình (GV999102)", sửa tên đề tài thành "Hệ thống gợi ý lộ trình học tập cá nhân hóa" và bấm "Cập nhật đăng ký".',
  expected:
    'Gọi PUT /api/student/advisor-registrations, HTTP 200, code = 1000.\n' +
    'Hiện thông báo "Cập nhật đơn đăng ký giảng viên hướng dẫn thành công".\n' +
    'Bảng lịch sử cập nhật dòng đơn sang giảng viên "Trần Thị Bình", tên đề tài "Hệ thống gợi ý lộ trình học tập cá nhân hóa", trạng thái "Chờ duyệt".\n' +
    'Đơn đăng ký PENDING của sinh viên 9990000101 trong học kỳ hiện tại được cập nhật sang giảng viên GV999102 và tên đề tài mới (không tạo thêm bản ghi mới).',
  precondition:
    'Học kỳ hiện tại đang mở hạn đăng ký GVHD; sinh viên 9990000101 đang có 1 đơn ở trạng thái PENDING; giảng viên Trần Thị Bình (GV999102) còn chỉ tiêu',
});

const ITC012 = defineItc({
  id: 'ITC012',
  feature: 'registration',
  module: 'DangKyGVHD',
  sheet: 'DangKyGVHD',
  fn: 'Cập nhật đơn đăng ký GVHD',
  description: 'Kiểm tra cập nhật đơn đăng ký đang chờ duyệt thành công khi xóa trắng tên đề tài dự kiến',
  procedure:
    '1. Đăng nhập vai trò Sinh viên đang có đơn ở trạng thái "Chờ duyệt" kèm tên đề tài, mở màn hình "Đăng ký GVHD".\n' +
    '2. Bấm nút "Chỉnh sửa đơn đăng ký" trên thẻ tổng quan.\n' +
    '3. Giữ nguyên giảng viên, xóa trắng ô Tên đề tài và bấm "Cập nhật đăng ký".',
  expected:
    'Gọi PUT /api/student/advisor-registrations với topicName = null, HTTP 200, code = 1000.\n' +
    'Hiện thông báo "Cập nhật đơn đăng ký giảng viên hướng dẫn thành công".\n' +
    'Bảng lịch sử hiển thị dòng đơn với cột Tên đề tài dự kiến là "Chưa có tên đề tài".\n' +
    'Đơn đăng ký PENDING của sinh viên 9990000101 trong học kỳ hiện tại có tên đề tài được cập nhật về null.',
  precondition:
    'Học kỳ hiện tại đang mở hạn đăng ký GVHD; sinh viên 9990000101 đang có đơn PENDING có tên đề tài',
});

const ITC013 = defineItc({
  id: 'ITC013',
  feature: 'registration',
  module: 'DangKyGVHD',
  sheet: 'DangKyGVHD',
  fn: 'Cập nhật đơn đăng ký GVHD',
  description: 'Kiểm tra chặn cập nhật đơn khi đơn vừa được giảng viên duyệt sơ bộ trước thời điểm sinh viên bấm lưu',
  procedure:
    '1. Đăng nhập vai trò Sinh viên đang có đơn ở trạng thái "Chờ duyệt", mở màn hình "Đăng ký GVHD" và bấm "Sửa đơn".\n' +
    '2. Trong khi hộp thoại cập nhật đang mở, giảng viên duyệt chấp thuận đơn của sinh viên.\n' +
    '3. Sinh viên sửa tên đề tài thành "Tên đề tài sửa muộn" và bấm "Cập nhật đăng ký".',
  expected:
    'Gọi PUT /api/student/advisor-registrations, HTTP 400, code = 4000.\n' +
    'Hộp thoại hiển thị thông báo lỗi "Chỉ được cập nhật đơn khi trạng thái là Chờ duyệt".\n' +
    'Đơn đăng ký của sinh viên 9990000101 trong học kỳ hiện tại giữ nguyên trạng thái TEACHER_APPROVED và tên đề tài ban đầu.',
  precondition:
    'Sinh viên mở hộp thoại sửa đơn khi đơn đang PENDING, nhưng giảng viên duyệt đơn sang TEACHER_APPROVED trước khi sinh viên bấm lưu',
});

const ITC014 = defineItc({
  id: 'ITC014',
  feature: 'registration',
  module: 'DangKyGVHD',
  sheet: 'DangKyGVHD',
  fn: 'Cập nhật đơn đăng ký GVHD',
  description: 'Kiểm tra trạng thái hiển thị khi đơn đã được giảng viên chấp thuận sơ bộ và đang chờ Trưởng bộ môn chốt danh sách',
  procedure:
    '1. Đăng nhập vai trò Sinh viên có đơn đã được giảng viên duyệt sơ bộ (TEACHER_APPROVED) khi Trưởng bộ môn chưa chốt danh sách.\n' +
    '2. Mở màn hình "Đăng ký GVHD".',
  expected:
    'Gọi GET /api/student/advisor-registrations/current và GET /api/student/advisor-registrations, HTTP 200, code = 1000.\n' +
    'Thẻ tổng quan hiển thị nút bị khóa "Đang chờ TBM chốt danh sách" kèm lý do "GVHD đã duyệt, chờ Trưởng bộ môn thẩm định".\n' +
    'Bảng lịch sử hiển thị dòng đơn với trạng thái "GVHD đã duyệt" và không có nút "Sửa đơn".',
  precondition:
    'Học kỳ hiện tại chưa khóa phân công GVHD; sinh viên 9990000101 có đơn ở trạng thái TEACHER_APPROVED',
});

const SEC001 = defineItcSec({
  id: 'TC-SEC-001',
  feature: 'registration',
  module: 'DangKyGVHD',
  sheet: 'DangKyGVHD',
  scenario: 'Người dùng chưa đăng nhập mở thẳng màn hình Đăng ký GVHD của sinh viên',
  roleSession: 'Chưa đăng nhập (Anonymous)',
  technique: 'EP',
  given: 'Trình duyệt không có phiên đăng nhập (không có cookie access_token)',
  when: 'Mở thẳng đường dẫn "/student/registration" của cổng Sinh viên',
  then: 'GET /my-info trả HTTP 401, code = 2000; giao diện tự động chuyển hướng về trang "/login", không hiển thị màn hình Đăng ký GVHD',
});

const SEC002 = defineItcSec({
  id: 'TC-SEC-002',
  feature: 'registration',
  module: 'DangKyGVHD',
  sheet: 'DangKyGVHD',
  scenario: 'Giảng viên hướng dẫn mở thẳng màn hình Đăng ký GVHD của cổng Sinh viên và gọi API đăng ký GVHD',
  roleSession: 'Giảng viên hướng dẫn (SUPERVISOR), đã đăng nhập',
  technique: 'EP',
  given: 'Đăng nhập bằng tài khoản Giảng viên hướng dẫn (không có vai trò STUDENT)',
  when: 'Mở thẳng đường dẫn "/student/registration" trên cổng Sinh viên và gửi yêu cầu GET /api/student/advisor-registrations/current',
  then: 'Giao diện chặn truy cập với thông báo "Tài khoản của bạn không có quyền truy cập cổng sinh viên."; API trả HTTP 403, code = 2001, message "Bạn không có quyền truy cập (access denied)"',
});

const SEC003 = defineItcSec({
  id: 'TC-SEC-003',
  feature: 'registration',
  module: 'DangKyGVHD',
  sheet: 'DangKyGVHD',
  scenario: 'Trưởng bộ môn gọi các API đăng ký và cập nhật đơn đăng ký GVHD dành riêng cho sinh viên',
  roleSession: 'Trưởng bộ môn (HEAD_OF_MAJOR), đã đăng nhập',
  technique: 'EP',
  given: 'Đăng nhập bằng tài khoản Trưởng bộ môn (không có vai trò STUDENT)',
  when: 'Mở thẳng đường dẫn "/student/registration" trên cổng Sinh viên và gọi POST /api/student/advisor-registrations',
  then: 'Giao diện chặn truy cập cổng sinh viên; POST /api/student/advisor-registrations trả HTTP 403, code = 2001, message "Bạn không có quyền truy cập (access denied)"',
});

const SEC004 = defineItcSec({
  id: 'TC-SEC-004',
  feature: 'registration',
  module: 'DangKyGVHD',
  sheet: 'DangKyGVHD',
  scenario: 'Phiên đăng nhập sinh viên có token đã đăng xuất mở màn hình Đăng ký GVHD',
  roleSession: 'Sinh viên (STUDENT), token đã đăng xuất',
  technique: 'STATE_TRANSITION',
  given: 'Sinh viên đã đăng xuất khiến token nằm trong danh sách vô hiệu hóa, nhưng trình duyệt vẫn gửi lại cookie access_token cũ',
  when: 'Mở đường dẫn "/student/registration" và gọi GET /api/student/advisor-registrations/current bằng token đã đăng xuất',
  then: 'API trả HTTP 401, code = 2000; giao diện chuyển về trang "/login" và không hiển thị dữ liệu đăng ký GVHD',
});

// ============================================================================
// HẠ TẦNG DỮ LIỆU TEST (TẠO QUA API, ĐỐI CHIẾU DB SELECT, DỌN SẠCH SAU TEST)
// ============================================================================

const TEST_STUDENT = {
  studentCode: '9990000101',
  firstName: 'Nguyễn Minh',
  lastName: 'Khoa',
  email: 'itc.sv.9990000101@gmail.com',
  phone: '0989900101',
  batch: 'K64',
  className: '64KTPM99',
};

const TEST_TEACHER_1 = {
  teacherCode: 'GV999101',
  firstName: 'Nguyễn Văn',
  lastName: 'An',
  fullName: 'Nguyễn Văn An',
  email: 'itc.gv.999101@tlu.edu.vn',
  phone: '0989900201',
  academicTitle: 'TS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_TEACHER_2 = {
  teacherCode: 'GV999102',
  firstName: 'Trần Thị',
  lastName: 'Bình',
  fullName: 'Trần Thị Bình',
  email: 'itc.gv.999102@tlu.edu.vn',
  phone: '0989900202',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

const TEST_TEACHER_3_FULL = {
  teacherCode: 'GV999103',
  firstName: 'Lê Hoàng',
  lastName: 'Cường',
  fullName: 'Lê Hoàng Cường',
  email: 'itc.gv.999103@tlu.edu.vn',
  phone: '0989900203',
  academicTitle: 'ThS.',
  organization: 'Trường Đại học Thủy lợi',
};

interface TestEnvState {
  hodToken: string;
  studentToken: string;
  teacher1Token: string;
  semesterId: number;
  semesterPublicId: string;
  semesterStartDate: string;
  semesterEndDate: string;
  originallyLocked: boolean;
  majorName: string;
  studentPublicId: string;
  teacher1Id: number;
  teacher1PublicId: string;
  teacher2Id: number;
  teacher2PublicId: string;
  teacher3Id: number;
  teacher3PublicId: string;
  dkGvhdTemplateId: string;
  dkGvhdDeadlineId: string | null;
  originalDeadlineStart: string | null;
  originalDeadlineEnd: string | null;
  originalDeadlineStatus: string | null;
}

let envState: TestEnvState;

function toLocalIso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

async function setStudentCookie(context: BrowserContext, token: string) {
  const apiUrlObj = new URL(getApiBaseUrl());
  await context.clearCookies();
  await context.addCookies([
    {
      name: 'access_token',
      value: token,
      domain: apiUrlObj.hostname,
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

async function configureDangKyGvhdDeadline(
  request: APIRequestContext,
  mode: 'OPEN' | 'CLOSED' | 'RESTORE',
) {
  const semStart = new Date(`${envState.semesterStartDate}T00:00:00`);
  const semEnd = new Date(`${envState.semesterEndDate}T23:59:59`);
  const now = new Date();

  let startDateStr: string;
  let endDateStr: string;
  let status: string | undefined;

  if (mode === 'RESTORE') {
    if (!envState.originalDeadlineStart || !envState.originalDeadlineEnd) {
      return;
    }
    startDateStr = envState.originalDeadlineStart;
    endDateStr = envState.originalDeadlineEnd;
    status = envState.originalDeadlineStatus ?? undefined;
  } else if (mode === 'OPEN') {
    const start = new Date(Math.max(semStart.getTime(), now.getTime() - 24 * 3600 * 1000));
    const end = new Date(Math.min(semEnd.getTime(), now.getTime() + 48 * 3600 * 1000));
    startDateStr = toLocalIso(start);
    endDateStr = toLocalIso(end);
    status = 'IN_PROGRESS';
  } else {
    // CLOSED: cả startDate và endDate đều nằm trước thời điểm hiện tại nhưng trong phạm vi học kỳ
    const end = new Date(Math.max(semStart.getTime() + 60 * 1000, now.getTime() - 60 * 1000));
    const start = new Date(Math.max(semStart.getTime(), end.getTime() - 3600 * 1000));
    startDateStr = toLocalIso(start);
    endDateStr = toLocalIso(end);
    status = 'COMPLETED';
  }

  const res = await apiCall(request, envState.hodToken, 'PUT', '/api/v1/deadlines/batch-update', {
    data: {
      semesterId: envState.semesterPublicId,
      deadlines: [
        {
          deadlineId: envState.dkGvhdDeadlineId,
          templateId: envState.dkGvhdTemplateId,
          startDate: startDateStr,
          endDate: endDateStr,
          status,
        },
      ],
    },
  });

  if (res.status !== 200) {
    throw new Error(`Không thể cập nhật deadline DANG_KY_GVHD (${mode}): ${JSON.stringify(res.body)}`);
  }

  // Cập nhật lại deadlineId vừa được lưu nếu lần đầu tạo mới
  const dlRes = await apiCall(request, envState.hodToken, 'GET', '/api/v1/deadlines', {
    params: { semesterId: envState.semesterPublicId },
  });
  const list: any[] = dlRes.body?.data?.giaoNhanDeadlines ?? [];
  const found = list.find((d) => d.code === 'DANG_KY_GVHD');
  if (found?.deadlineId) {
    envState.dkGvhdDeadlineId = found.deadlineId;
  }
}

async function recreateCleanStudent(request: APIRequestContext) {
  // Nếu sinh viên test đã có trong hệ thống từ case trước, tìm và xóa qua API
  const rows = await dbSelect<{ id: number }>(
    'SELECT id FROM student WHERE student_code = ?',
    [TEST_STUDENT.studentCode],
  );

  if (rows.length > 0) {
    // Lấy publicId của sinh viên qua API danh sách
    const listRes = await apiCall(request, envState.hodToken, 'GET', '/student', {
      params: {
        semesterId: envState.semesterPublicId,
        keyword: TEST_STUDENT.studentCode,
      },
    });
    const content: any[] = listRes.body?.data?.content ?? [];
    const matched = content.find((s) => s.studentCode === TEST_STUDENT.studentCode);
    if (matched?.publicId) {
      await apiCall(request, envState.hodToken, 'DELETE', `/student/${matched.publicId}`, {
        params: { semesterId: envState.semesterPublicId },
      });
    }
  }

  // Tạo mới sinh viên vào học kỳ hiện tại (chưa có đơn đăng ký nào)
  const createRes = await apiCall(request, envState.hodToken, 'POST', '/student', {
    data: {
      ...TEST_STUDENT,
      major: envState.majorName,
    },
  });
  if (createRes.status !== 200) {
    throw new Error(`Không thể tạo sinh viên test ${TEST_STUDENT.studentCode}: ${JSON.stringify(createRes.body)}`);
  }

  const listRes = await apiCall(request, envState.hodToken, 'GET', '/student', {
    params: {
      semesterId: envState.semesterPublicId,
      keyword: TEST_STUDENT.studentCode,
    },
  });
  const content: any[] = listRes.body?.data?.content ?? [];
  const matched = content.find((s) => s.studentCode === TEST_STUDENT.studentCode);
  if (!matched?.publicId) {
    throw new Error(`Không tìm thấy publicId của sinh viên ${TEST_STUDENT.studentCode} sau khi tạo`);
  }

  envState.studentPublicId = matched.publicId;
  envState.studentToken = await loginByEmail(request, TEST_STUDENT.email);
}

/**
 * Vì BE cố tình không có API xóa lịch sử đơn đăng ký GVHD (đơn bị từ chối/đã duyệt được giữ làm lịch sử)
 * và DELETE /student/{publicId} chặn xóa sinh viên đã từng gửi đơn đăng ký GVHD (mã lỗi 3028),
 * khi một case đã tạo đơn đăng ký, ta đưa giảng viên của đơn về trạng thái chưa có sinh viên chính thức
 * bằng cách từ chối đơn (nếu còn PENDING) rồi đổi mã/email sinh viên cũ sang bản ghi tạm để dọn cuối bộ test,
 * hoặc trực tiếp xoay mã/email qua PUT /student/account/{publicId}.
 *
 * Đặc biệt: Nếu đơn chưa được tạo (case chỉ đọc hoặc bị chặn), DELETE /student/{publicId} xóa sạch 100%
 *ทั้ง thesis_topic, student và account!
 */
const archivedStudentPublicIds: string[] = [];

async function resetStudentForNextCase(request: APIRequestContext) {
  if (!envState?.studentPublicId) return;

  // Kiểm tra sinh viên hiện tại có đơn đăng ký nào trong DB không
  const regRows = await dbSelect<{ total: number; status: string; reg_id: number }>(
    `SELECT COUNT(*) AS total
       FROM advisor_registration ar
       JOIN student s ON s.id = ar.student_id
      WHERE s.student_code = ? AND ar.semester_id = ?`,
    [TEST_STUDENT.studentCode, envState.semesterId],
  );

  const hasRegistrations = (regRows[0]?.total ?? 0) > 0;

  if (!hasRegistrations) {
    // Chưa có đơn đăng ký -> xóa sạch hoàn toàn qua DELETE /student/{publicId}
    const delRes = await apiCall(request, envState.hodToken, 'DELETE', `/student/${envState.studentPublicId}`, {
      params: { semesterId: envState.semesterPublicId },
    });
    if (delRes.status !== 200) {
      throw new Error(`Xóa sinh viên chưa có đơn thất bại: ${JSON.stringify(delRes.body)}`);
    }
    envState.studentPublicId = '';
    return;
  }

  // Nếu có đơn PENDING -> Giảng viên từ chối qua API để trả lại trạng thái đã xử lý
  await configureDangKyGvhdDeadline(request, 'OPEN');
  for (const teacherEmail of [TEST_TEACHER_1.email, TEST_TEACHER_2.email, TEST_TEACHER_3_FULL.email]) {
    const tToken = await loginByEmail(request, teacherEmail);
    const listRes = await apiCall(request, tToken, 'GET', '/api/teacher/advisor-registrations', {
      params: { semesterPublicId: envState.semesterPublicId, status: 'PENDING' },
    });
    const regs: any[] = listRes.body?.data?.registrations ?? [];
    for (const r of regs) {
      if (r.studentCode === TEST_STUDENT.studentCode) {
        await apiCall(request, tToken, 'PATCH', `/api/teacher/advisor-registrations/${r.registrationPublicId}/reject`);
      }
    }
  }

  // Nếu có đơn TEACHER_APPROVED -> TBM từ chối (chuyển về HOD_REJECTED để giải phóng chỉ tiêu giảng viên)
  await configureDangKyGvhdDeadline(request, 'CLOSED');
  const wsRes = await apiCall(
    request,
    envState.hodToken,
    'GET',
    `/semesters/${envState.semesterPublicId}/advisor-assignments`,
  );
  const wsStudents: any[] = wsRes.body?.data?.students ?? [];
  const wsItem = wsStudents.find((s) => s.studentCode === TEST_STUDENT.studentCode);
  if (wsItem?.registrationPublicId && wsItem.status === 'RECEIVED') {
    await apiCall(
      request,
      envState.hodToken,
      'PUT',
      `/semesters/${envState.semesterPublicId}/advisor-assignments/reject`,
      {
        data: {
          registrationPublicIds: [wsItem.registrationPublicId],
        },
      },
    );
  }
  await configureDangKyGvhdDeadline(request, 'OPEN');

  // Đổi mã SV, email, SĐT của bản ghi đã có lịch sử đơn sang mã lưu trữ tạm qua PUT /student/{publicId} của TBM để giải phóng mã 9990000101 cho case tiếp theo
  const suffix = String(Date.now()).slice(-6);
  const archiveCode = `9999${suffix}`;
  const archivePhone = `0979${suffix}`;
  const archiveEmail = `itc.arch.${suffix}@gmail.com`;

  const updRes = await apiCall(request, envState.hodToken, 'PUT', `/student/${envState.studentPublicId}`, {
    data: {
      studentCode: archiveCode,
      firstName: TEST_STUDENT.firstName,
      lastName: TEST_STUDENT.lastName,
      email: archiveEmail,
      phone: archivePhone,
      batch: TEST_STUDENT.batch,
      className: TEST_STUDENT.className,
    },
  });
  if (updRes.status !== 200) {
    throw new Error(`Không thể giải phóng mã sinh viên test: ${JSON.stringify(updRes.body)}`);
  }
  archivedStudentPublicIds.push(envState.studentPublicId);
  envState.studentPublicId = '';
}

test.describe('Báo cáo 5.2 - Sinh viên đăng ký giảng viên hướng dẫn (DangKyGVHD)', () => {
  test.beforeAll(async ({ request }) => {
    const hodEmail = process.env.E2E_EMAIL_HEAD_OF_MAJOR?.trim();
    if (!hodEmail) {
      throw new Error('Thiếu E2E_EMAIL_HEAD_OF_MAJOR trong .env.e2e');
    }

    const hodToken = await loginByEmail(request, hodEmail);

    // 1. Lấy học kỳ hiện tại
    const semRes = await apiCall(request, hodToken, 'GET', '/semester/current');
    if (semRes.status !== 200 || !semRes.body?.data?.publicId) {
      throw new Error('Không tìm thấy học kỳ hiện tại (GET /semester/current)');
    }
    const semData = semRes.body.data;
    const semRows = await dbSelect<{
      id: number;
      is_advisor_assignment_locked: number;
      start_date: string;
      end_date: string;
    }>(
      'SELECT id, is_advisor_assignment_locked, DATE_FORMAT(start_date, "%Y-%m-%d") AS start_date, DATE_FORMAT(end_date, "%Y-%m-%d") AS end_date FROM semester WHERE name = ?',
      [semData.name],
    );
    if (semRows.length === 0) {
      throw new Error(`Không tìm thấy học kỳ "${semData.name}" trong DB`);
    }

    // 2. Lấy ngành phụ trách của Trưởng bộ môn
    const majorRes = await apiCall(request, hodToken, 'GET', '/teacher/managed-major');
    let majorName: string | undefined = majorRes.body?.data?.name;
    if (!majorName) {
      const allMajorsRes = await apiCall(request, hodToken, 'GET', '/major');
      majorName = allMajorsRes.body?.data?.[0]?.name;
    }
    if (!majorName) {
      throw new Error('Không xác định được ngành học để tạo dữ liệu test');
    }

    // 3. Lấy thông tin mốc thời hạn DANG_KY_GVHD vàTBM_CHOT_DS_GVHD_DU_KIEN hiện tại để khôi phục sau khi chạy
    const dlRes = await apiCall(request, hodToken, 'GET', '/api/v1/deadlines', {
      params: { semesterId: semData.publicId },
    });
    const giaoNhan: any[] = dlRes.body?.data?.giaoNhanDeadlines ?? [];
    const dkGvhd = giaoNhan.find((d) => d.code === 'DANG_KY_GVHD');
    const tbmChot = giaoNhan.find((d) => d.code === 'TBM_CHOT_DS_GVHD_DU_KIEN');
    if (!dkGvhd?.templateId) {
      throw new Error('Không tìm thấy mốc mẫu DANG_KY_GVHD');
    }

    // Đảm bảo mốc TBM_CHOT_DS_GVHD_DU_KIEN cũng đang mở để có thể gọi API mở khóa / từ chối khi dọn dữ liệu
    if (tbmChot?.templateId) {
      const now = new Date();
      const sStart = new Date(`${semRows[0].start_date}T00:00:00`);
      const sEnd = new Date(`${semRows[0].end_date}T23:59:59`);
      await apiCall(request, hodToken, 'PUT', '/api/v1/deadlines/batch-update', {
        data: {
          semesterId: semData.publicId,
          deadlines: [
            {
              deadlineId: tbmChot.deadlineId ?? null,
              templateId: tbmChot.templateId,
              startDate: toLocalIso(new Date(Math.max(sStart.getTime(), now.getTime() - 24 * 3600 * 1000))),
              endDate: toLocalIso(new Date(Math.min(sEnd.getTime(), now.getTime() + 48 * 3600 * 1000))),
              status: 'IN_PROGRESS',
            },
          ],
        },
      });
    }

    envState = {
      hodToken,
      studentToken: '',
      teacher1Token: '',
      semesterId: semRows[0].id,
      semesterPublicId: semData.publicId,
      semesterStartDate: semRows[0].start_date,
      semesterEndDate: semRows[0].end_date,
      originallyLocked: Boolean(semRows[0].is_advisor_assignment_locked),
      majorName,
      studentPublicId: '',
      teacher1Id: 0,
      teacher1PublicId: '',
      teacher2Id: 0,
      teacher2PublicId: '',
      teacher3Id: 0,
      teacher3PublicId: '',
      dkGvhdTemplateId: dkGvhd.templateId,
      dkGvhdDeadlineId: dkGvhd.deadlineId ?? null,
      originalDeadlineStart: dkGvhd.startDate ?? null,
      originalDeadlineEnd: dkGvhd.endDate ?? null,
      originalDeadlineStatus: dkGvhd.status ?? null,
    };

    // Nếu học kỳ đang bị khóa phân công GVHD thì tạm mở khóa qua API để test đăng ký
    if (envState.originallyLocked) {
      await configureDangKyGvhdDeadline(request, 'CLOSED');
      await apiCall(
        request,
        hodToken,
        'PUT',
        `/semesters/${envState.semesterPublicId}/advisor-assignments/lock-status`,
        { data: { isLocked: false } },
      );
    }

    // 4. Tạo 3 giảng viên test qua API POST /teacher và phân công làm GVHD trong học kỳ
    for (const t of [TEST_TEACHER_1, TEST_TEACHER_2, TEST_TEACHER_3_FULL]) {
      await apiCall(request, hodToken, 'POST', '/teacher', {
        data: {
          teacherCode: t.teacherCode,
          firstName: t.firstName,
          lastName: t.lastName,
          email: t.email,
          phone: t.phone,
          academicTitle: t.academicTitle,
          organization: t.organization,
          major: majorName,
        },
      });
    }

    const tRows = await dbSelect<{ id: number; teacher_code: string }>(
      'SELECT id, teacher_code FROM teacher WHERE teacher_code IN (?, ?, ?)',
      [TEST_TEACHER_1.teacherCode, TEST_TEACHER_2.teacherCode, TEST_TEACHER_3_FULL.teacherCode],
    );
    const idByCode = new Map(tRows.map((r) => [r.teacher_code, r.id]));
    envState.teacher1Id = idByCode.get(TEST_TEACHER_1.teacherCode)!;
    envState.teacher2Id = idByCode.get(TEST_TEACHER_2.teacherCode)!;
    envState.teacher3Id = idByCode.get(TEST_TEACHER_3_FULL.teacherCode)!;

    // Phân công cả 3 giảng viên vào học kỳ hiện tại với hạn mức 5
    const assignRes = await apiCall(
      request,
      hodToken,
      'POST',
      `/semesters/${envState.semesterPublicId}/advisors`,
      {
        data: {
          teacherIds: [envState.teacher1Id, envState.teacher2Id, envState.teacher3Id],
          maxStudentsPerTeacher: 5,
        },
      },
    );
    if (assignRes.status !== 200) {
      throw new Error(`Không thể phân công giảng viên test làm GVHD: ${JSON.stringify(assignRes.body)}`);
    }

    // Đặt hạn mức của GV999103 = 0 (hết chỉ tiêu)
    await apiCall(
      request,
      hodToken,
      'PUT',
      `/semesters/${envState.semesterPublicId}/advisors/${envState.teacher3Id}/quota`,
      { data: { maxStudents: 0 } },
    );

    // Lấy publicId của 3 giảng viên
    const advisorsRes = await apiCall(
      request,
      hodToken,
      'GET',
      `/semesters/${envState.semesterPublicId}/advisors`,
    );
    const advisorList: any[] = advisorsRes.body?.data ?? [];
    envState.teacher1PublicId = advisorList.find((a) => a.teacherCode === TEST_TEACHER_1.teacherCode)?.teacherPublicId;
    envState.teacher2PublicId = advisorList.find((a) => a.teacherCode === TEST_TEACHER_2.teacherCode)?.teacherPublicId;
    envState.teacher3PublicId = advisorList.find((a) => a.teacherCode === TEST_TEACHER_3_FULL.teacherCode)?.teacherPublicId;

    envState.teacher1Token = await loginByEmail(request, TEST_TEACHER_1.email);
  });

  test.beforeEach(async ({ request }) => {
    await configureDangKyGvhdDeadline(request, 'OPEN');
    await apiCall(
      request,
      envState.hodToken,
      'PUT',
      `/semesters/${envState.semesterPublicId}/advisors/${envState.teacher3Id}/quota`,
      { data: { maxStudents: 0 } },
    );
    await recreateCleanStudent(request);
  });

  test.afterEach(async ({ request }) => {
    await resetStudentForNextCase(request);
  });

  test.afterAll(async ({ request }) => {
    if (!envState) return;
    try {
      await resetStudentForNextCase(request);
    } catch {
      // ignore
    }

    // Gỡ 3 giảng viên test khỏi danh sách GVHD của kỳ và xóa tài khoản giảng viên (nếu không còn đơn gắn với họ)
    for (const tId of [envState.teacher1Id, envState.teacher2Id, envState.teacher3Id]) {
      if (!tId) continue;
      await apiCall(
        request,
        envState.hodToken,
        'DELETE',
        `/semesters/${envState.semesterPublicId}/advisors/${tId}`,
      );
      await apiCall(request, envState.hodToken, 'DELETE', `/teacher/${tId}`);
    }

    // Khôi phục lại thời hạn DANG_KY_GVHD ban đầu
    await configureDangKyGvhdDeadline(request, 'RESTORE');
  });

  // ==========================================================================
  // FUNCTION 1: XEM TỔNG QUAN VÀ LỊCH SỬ ĐĂNG KÝ GVHD
  // ==========================================================================

  test(ITC001.title, { annotation: ITC001.annotation }, async ({ page, context }) => {
    await setStudentCookie(context, envState.studentToken);

    const overviewPromise = page.waitForResponse(
      (r) =>
        r.url().includes('/api/student/advisor-registrations/overview') &&
        r.request().method() === 'GET',
    );
    const currentPromise = page.waitForResponse(
      (r) =>
        r.url().includes('/api/student/advisor-registrations/current') &&
        r.request().method() === 'GET',
    );
    const historyPromise = page.waitForResponse(
      (r) =>
        /\/api\/student\/advisor-registrations\?semesterPublicId=/.test(r.url()) &&
        r.request().method() === 'GET',
    );

    await page.goto('/student/registration');

    const [overviewRes, currentRes, historyRes] = await Promise.all([
      overviewPromise,
      currentPromise,
      historyPromise,
    ]);

    expect(overviewRes.status()).toBe(200);
    const overviewBody = await overviewRes.json();
    expect(overviewBody.code).toBe(1000);
    expect(overviewBody.data.deadlineStatus).toBe('OPEN');

    expect(currentRes.status()).toBe(200);
    expect((await currentRes.json()).code).toBe(1000);

    expect(historyRes.status()).toBe(200);
    const historyBody = await historyRes.json();
    expect(historyBody.code).toBe(1000);
    expect(historyBody.data).toEqual([]);

    await expect(page.getByRole('button', { name: 'Tạo đơn đăng ký GVHD' })).toBeEnabled();
    await expect(
      page.getByText('Chưa có đơn đăng ký nào trong học kỳ này.'),
    ).toBeVisible();

    // Đối chiếu DB bằng SELECT
    const topicRows = await dbSelect<{ current_stage: string; status: string }>(
      `SELECT t.current_stage, t.status
         FROM thesis_topic t
         JOIN student s ON s.id = t.student_id
        WHERE s.student_code = ? AND t.semester_id = ?`,
      [TEST_STUDENT.studentCode, envState.semesterId],
    );
    expect(topicRows).toHaveLength(1);
    expect(topicRows[0].current_stage).toBe('STAGE_1_REGISTERING_ADVISOR');
    expect(topicRows[0].status).toBe('IN_PROGRESS');

    const regRows = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM advisor_registration ar
         JOIN student s ON s.id = ar.student_id
        WHERE s.student_code = ? AND ar.semester_id = ?`,
      [TEST_STUDENT.studentCode, envState.semesterId],
    );
    expect(Number(regRows[0].total)).toBe(0);
  });

  test(ITC002.title, { annotation: ITC002.annotation }, async ({ page, context, request }) => {
    await configureDangKyGvhdDeadline(request, 'CLOSED');
    await setStudentCookie(context, envState.studentToken);

    const overviewPromise = page.waitForResponse(
      (r) =>
        r.url().includes('/api/student/advisor-registrations/overview') &&
        r.request().method() === 'GET',
    );

    await page.goto('/student/registration');
    const overviewRes = await overviewPromise;

    expect(overviewRes.status()).toBe(200);
    const overviewBody = await overviewRes.json();
    expect(overviewBody.code).toBe(1000);
    expect(overviewBody.data.deadlineStatus).toBe('CLOSED');

    await expect(page.getByText('Đã hết hạn')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tạo đơn đăng ký GVHD' })).toBeDisabled();
    await expect(page.getByText('Đã hết thời hạn đăng ký GVHD')).toBeVisible();
  });

  // ==========================================================================
  // FUNCTION 2: XEM DANH SÁCH GIẢNG VIÊN CÓ THỂ ĐĂNG KÝ
  // ==========================================================================

  test(ITC003.title, { annotation: ITC003.annotation }, async ({ page, context }) => {
    await setStudentCookie(context, envState.studentToken);

    const advisorsPromise = page.waitForResponse(
      (r) =>
        r.url().includes('/api/student/advisor-registrations/advisors') &&
        r.request().method() === 'GET',
    );

    await page.goto('/student/registration');
    const advisorsRes = await advisorsPromise;

    expect(advisorsRes.status()).toBe(200);
    const advisorsBody = await advisorsRes.json();
    expect(advisorsBody.code).toBe(1000);

    const advisorCodes = (advisorsBody.data as any[]).map((a) => a.teacherCode);
    expect(advisorCodes).toContain(TEST_TEACHER_1.teacherCode);
    expect(advisorCodes).not.toContain(TEST_TEACHER_3_FULL.teacherCode);

    await page.getByRole('button', { name: 'Tạo đơn đăng ký GVHD' }).click();
    await expect(
      page.getByRole('heading', { name: 'Đăng ký giảng viên hướng dẫn' }),
    ).toBeVisible();

    await page.getByRole('button', { name: /Chọn giảng viên hướng dẫn/ }).click();
    const searchInput = page.getByPlaceholder('Tìm theo tên hoặc mã giảng viên...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill(TEST_TEACHER_1.teacherCode);

    const teacherOption = page.getByRole('button', {
      name: new RegExp(`${TEST_TEACHER_1.fullName}.*${TEST_TEACHER_1.teacherCode}`),
    });
    await expect(teacherOption).toBeVisible();
    await expect(teacherOption).toContainText(/Còn \d+ chỉ tiêu/);
    await expect(teacherOption).toContainText(/\d+ đơn chờ duyệt/);
    await expect(
      page.getByRole('button', { name: new RegExp(TEST_TEACHER_3_FULL.teacherCode) }),
    ).toHaveCount(0);
  });

  // ==========================================================================
  // FUNCTION 3: TẠO ĐƠN ĐĂNG KÝ GVHD
  // ==========================================================================

  test(ITC004.title, { annotation: ITC004.annotation }, async ({ page, context }) => {
    await setStudentCookie(context, envState.studentToken);
    await page.goto('/student/registration');

    await page.getByRole('button', { name: 'Tạo đơn đăng ký GVHD' }).click();
    await page.getByRole('button', { name: /Chọn giảng viên hướng dẫn/ }).click();
    await page
      .getByPlaceholder('Tìm theo tên hoặc mã giảng viên...')
      .fill(TEST_TEACHER_1.teacherCode);
    await page
      .getByRole('button', { name: new RegExp(TEST_TEACHER_1.teacherCode) })
      .click();

    const topicText = 'Hệ thống quản lý đồ án tốt nghiệp thông minh';
    await page.getByLabel(/Tên đề tài/).fill(topicText);

    const submitPromise = page.waitForResponse(
      (r) =>
        r.url().endsWith('/api/student/advisor-registrations') &&
        r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Gửi đăng ký' }).click();
    const submitRes = await submitPromise;

    const reqPayload = submitRes.request().postDataJSON();
    expect(reqPayload.teacherPublicId).toBe(envState.teacher1PublicId);
    expect(reqPayload.topicName).toBe(topicText);

    expect(submitRes.status()).toBe(200);
    const resBody = await submitRes.json();
    expect(resBody.code).toBe(1000);
    expect(resBody.message).toBe('Đăng ký giảng viên hướng dẫn thành công');

    await expect(
      page.getByText('Đăng ký giảng viên hướng dẫn thành công'),
    ).toBeVisible();

    const historyRow = page.getByRole('row', { name: new RegExp(TEST_TEACHER_1.fullName) });
    await expect(historyRow).toContainText(topicText);
    await expect(historyRow).toContainText('Chờ duyệt');
    await expect(historyRow.getByRole('button', { name: 'Sửa đơn' })).toBeEnabled();
    await expect(
      page.getByRole('button', { name: 'Chỉnh sửa đơn đăng ký' }),
    ).toBeEnabled();

    // Đối chiếu DB bằng SELECT
    const dbRows = await dbSelect<{
      status: string;
      topic_name: string | null;
      teacher_code: string;
    }>(
      `SELECT ar.status, ar.topic_name, t.teacher_code
         FROM advisor_registration ar
         JOIN student s ON s.id = ar.student_id
         JOIN teacher t ON t.id = ar.lecturer_id
        WHERE s.student_code = ? AND ar.semester_id = ?`,
      [TEST_STUDENT.studentCode, envState.semesterId],
    );
    expect(dbRows).toHaveLength(1);
    expect(dbRows[0].status).toBe('PENDING');
    expect(dbRows[0].topic_name).toBe(topicText);
    expect(dbRows[0].teacher_code).toBe(TEST_TEACHER_1.teacherCode);
  });

  test(ITC005.title, { annotation: ITC005.annotation }, async ({ page, context }) => {
    await setStudentCookie(context, envState.studentToken);
    await page.goto('/student/registration');

    await page.getByRole('button', { name: 'Tạo đơn đăng ký GVHD' }).click();
    await page.getByRole('button', { name: /Chọn giảng viên hướng dẫn/ }).click();
    await page
      .getByPlaceholder('Tìm theo tên hoặc mã giảng viên...')
      .fill(TEST_TEACHER_1.teacherCode);
    await page
      .getByRole('button', { name: new RegExp(TEST_TEACHER_1.teacherCode) })
      .click();

    const submitPromise = page.waitForResponse(
      (r) =>
        r.url().endsWith('/api/student/advisor-registrations') &&
        r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Gửi đăng ký' }).click();
    const submitRes = await submitPromise;

    const reqPayload = submitRes.request().postDataJSON();
    expect(reqPayload.teacherPublicId).toBe(envState.teacher1PublicId);
    expect(reqPayload.topicName).toBeNull();

    expect(submitRes.status()).toBe(200);
    const resBody = await submitRes.json();
    expect(resBody.code).toBe(1000);

    await expect(
      page.getByText('Đăng ký giảng viên hướng dẫn thành công'),
    ).toBeVisible();

    const historyRow = page.getByRole('row', { name: new RegExp(TEST_TEACHER_1.fullName) });
    await expect(historyRow).toContainText('Chưa có tên đề tài');
    await expect(historyRow).toContainText('Chờ duyệt');

    // Đối chiếu DB bằng SELECT
    const dbRows = await dbSelect<{ status: string; topic_name: string | null }>(
      `SELECT ar.status, ar.topic_name
         FROM advisor_registration ar
         JOIN student s ON s.id = ar.student_id
        WHERE s.student_code = ? AND ar.semester_id = ?`,
      [TEST_STUDENT.studentCode, envState.semesterId],
    );
    expect(dbRows).toHaveLength(1);
    expect(dbRows[0].status).toBe('PENDING');
    expect(dbRows[0].topic_name).toBeNull();
  });

  test(ITC006.title, { annotation: ITC006.annotation }, async ({ page, context }) => {
    await setStudentCookie(context, envState.studentToken);
    await page.goto('/student/registration');

    let postCalled = false;
    page.on('request', (req) => {
      if (
        req.url().endsWith('/api/student/advisor-registrations') &&
        req.method() === 'POST'
      ) {
        postCalled = true;
      }
    });

    await page.getByRole('button', { name: 'Tạo đơn đăng ký GVHD' }).click();
    await page.getByLabel(/Tên đề tài/).fill('Đề tài thử nghiệm');
    await page.getByRole('button', { name: 'Gửi đăng ký' }).click();

    await expect(
      page.getByText('Vui lòng chọn một giảng viên hướng dẫn từ danh sách.'),
    ).toBeVisible();
    expect(postCalled).toBe(false);

    const dbRows = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM advisor_registration ar
         JOIN student s ON s.id = ar.student_id
        WHERE s.student_code = ? AND ar.semester_id = ?`,
      [TEST_STUDENT.studentCode, envState.semesterId],
    );
    expect(Number(dbRows[0].total)).toBe(0);
  });

  test(ITC007.title, { annotation: ITC007.annotation }, async ({ page, context, request }) => {
    // Tạm mở hạn mức = 1 cho GV999103 để hiển thị trong dropdown khi sinh viên mở form
    await apiCall(
      request,
      envState.hodToken,
      'PUT',
      `/semesters/${envState.semesterPublicId}/advisors/${envState.teacher3Id}/quota`,
      { data: { maxStudents: 1 } },
    );

    await setStudentCookie(context, envState.studentToken);
    await page.goto('/student/registration');

    await page.getByRole('button', { name: 'Tạo đơn đăng ký GVHD' }).click();
    await page.getByRole('button', { name: /Chọn giảng viên hướng dẫn/ }).click();
    await page
      .getByPlaceholder('Tìm theo tên hoặc mã giảng viên...')
      .fill(TEST_TEACHER_3_FULL.teacherCode);
    await page
      .getByRole('button', { name: new RegExp(TEST_TEACHER_3_FULL.teacherCode) })
      .click();
    await page.getByLabel(/Tên đề tài/).fill('Đề tài kiểm thử hết chỉ tiêu');

    // Trước khi sinh viên bấm Gửi đăng ký, giảng viên GV999103 hết chỉ tiêu (maxStudents giảm về 0)
    await apiCall(
      request,
      envState.hodToken,
      'PUT',
      `/semesters/${envState.semesterPublicId}/advisors/${envState.teacher3Id}/quota`,
      { data: { maxStudents: 0 } },
    );

    const submitPromise = page.waitForResponse(
      (r) =>
        r.url().endsWith('/api/student/advisor-registrations') &&
        r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Gửi đăng ký' }).click();
    const submitRes = await submitPromise;

    expect(submitRes.status()).toBe(400);
    const resBody = await submitRes.json();
    expect(resBody.code).toBe(4000);
    expect(resBody.message).toBe('Giảng viên đã đủ chỉ tiêu hướng dẫn trong học kỳ này');

    await expect(
      page.getByText('Giảng viên đã đủ chỉ tiêu hướng dẫn trong học kỳ này'),
    ).toBeVisible();

    const dbRows = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM advisor_registration ar
         JOIN student s ON s.id = ar.student_id
        WHERE s.student_code = ? AND ar.semester_id = ?`,
      [TEST_STUDENT.studentCode, envState.semesterId],
    );
    expect(Number(dbRows[0].total)).toBe(0);
  });

  test(ITC008.title, { annotation: ITC008.annotation }, async ({ page, context, request }) => {
    await setStudentCookie(context, envState.studentToken);
    await page.goto('/student/registration');

    await page.getByRole('button', { name: 'Tạo đơn đăng ký GVHD' }).click();
    await page.getByRole('button', { name: /Chọn giảng viên hướng dẫn/ }).click();
    await page
      .getByPlaceholder('Tìm theo tên hoặc mã giảng viên...')
      .fill(TEST_TEACHER_1.teacherCode);
    await page
      .getByRole('button', { name: new RegExp(TEST_TEACHER_1.teacherCode) })
      .click();
    await page.getByLabel(/Tên đề tài/).fill('Đề tài kiểm thử hết hạn');

    // Đóng hạn đăng ký ngay trước khi sinh viên bấm nút Gửi đăng ký
    await configureDangKyGvhdDeadline(request, 'CLOSED');

    const submitPromise = page.waitForResponse(
      (r) =>
        r.url().endsWith('/api/student/advisor-registrations') &&
        r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Gửi đăng ký' }).click();
    const submitRes = await submitPromise;

    expect(submitRes.status()).toBe(403);
    const resBody = await submitRes.json();
    expect(resBody.code).toBe(2001);
    expect(resBody.message).toBe('Đợt đăng ký GVHD chưa mở hoặc đã hết hạn');

    await expect(
      page.getByText('Đợt đăng ký GVHD chưa mở hoặc đã hết hạn'),
    ).toBeVisible();

    const dbRows = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM advisor_registration ar
         JOIN student s ON s.id = ar.student_id
        WHERE s.student_code = ? AND ar.semester_id = ?`,
      [TEST_STUDENT.studentCode, envState.semesterId],
    );
    expect(Number(dbRows[0].total)).toBe(0);
  });

  test(ITC009.title, { annotation: ITC009.annotation }, async ({ page, context, request }) => {
    await setStudentCookie(context, envState.studentToken);
    await page.goto('/student/registration');

    await page.getByRole('button', { name: 'Tạo đơn đăng ký GVHD' }).click();
    await page.getByRole('button', { name: /Chọn giảng viên hướng dẫn/ }).click();
    await page
      .getByPlaceholder('Tìm theo tên hoặc mã giảng viên...')
      .fill(TEST_TEACHER_1.teacherCode);
    await page
      .getByRole('button', { name: new RegExp(TEST_TEACHER_1.teacherCode) })
      .click();

    // Giả lập sinh viên đã gửi 1 đơn ở tab khác trước khi bấm Gửi đăng ký ở tab này
    const bgSubmit = await apiCall(
      request,
      envState.studentToken,
      'POST',
      '/api/student/advisor-registrations',
      {
        data: {
          teacherPublicId: envState.teacher1PublicId,
          topicName: 'Đơn đã tạo ở tab trước',
        },
      },
    );
    expect(bgSubmit.status).toBe(200);

    const submitPromise = page.waitForResponse(
      (r) =>
        r.url().endsWith('/api/student/advisor-registrations') &&
        r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Gửi đăng ký' }).click();
    const submitRes = await submitPromise;

    expect(submitRes.status()).toBe(409);
    const resBody = await submitRes.json();
    expect(resBody.code).toBe(1004);
    expect(resBody.message).toBe(
      'Bạn đã có đơn đăng ký GVHD chưa bị từ chối, không thể tạo đơn mới',
    );

    await expect(
      page.getByText('Bạn đã có đơn đăng ký GVHD chưa bị từ chối, không thể tạo đơn mới'),
    ).toBeVisible();

    const dbRows = await dbSelect<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM advisor_registration ar
         JOIN student s ON s.id = ar.student_id
        WHERE s.student_code = ? AND ar.semester_id = ?`,
      [TEST_STUDENT.studentCode, envState.semesterId],
    );
    expect(Number(dbRows[0].total)).toBe(1);
  });

  test(ITC010.title, { annotation: ITC010.annotation }, async ({ page, context, request }) => {
    // Chuẩn bị: sinh viên đã có 1 đơn gửi cho GV999101 và bị GV999101 từ chối
    const firstSubmit = await apiCall(
      request,
      envState.studentToken,
      'POST',
      '/api/student/advisor-registrations',
      {
        data: {
          teacherPublicId: envState.teacher1PublicId,
          topicName: 'Đề tài lần 1 bị từ chối',
        },
      },
    );
    const firstRegId = firstSubmit.body?.data?.registrationPublicId;
    const rejectRes = await apiCall(
      request,
      envState.teacher1Token,
      'PATCH',
      `/api/teacher/advisor-registrations/${firstRegId}/reject`,
    );
    expect(rejectRes.status).toBe(200);

    await setStudentCookie(context, envState.studentToken);
    await page.goto('/student/registration');

    const createNewBtn = page.getByRole('button', { name: 'Tạo đơn đăng ký mới' });
    await expect(createNewBtn).toBeEnabled();
    await createNewBtn.click();

    await page.getByRole('button', { name: /Chọn giảng viên hướng dẫn/ }).click();
    await page
      .getByPlaceholder('Tìm theo tên hoặc mã giảng viên...')
      .fill(TEST_TEACHER_2.teacherCode);
    await page
      .getByRole('button', { name: new RegExp(TEST_TEACHER_2.teacherCode) })
      .click();

    const newTopic = 'Ứng dụng AI phân tích dữ liệu học tập';
    await page.getByLabel(/Tên đề tài/).fill(newTopic);

    const submitPromise = page.waitForResponse(
      (r) =>
        r.url().endsWith('/api/student/advisor-registrations') &&
        r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Gửi đăng ký' }).click();
    const submitRes = await submitPromise;

    expect(submitRes.status()).toBe(200);
    expect((await submitRes.json()).code).toBe(1000);

    await expect(
      page.getByText('Đăng ký giảng viên hướng dẫn thành công'),
    ).toBeVisible();

    const newRow = page.getByRole('row', { name: new RegExp(TEST_TEACHER_2.fullName) });
    await expect(newRow).toContainText(newTopic);
    await expect(newRow).toContainText('Chờ duyệt');

    const oldRow = page.getByRole('row', { name: new RegExp(TEST_TEACHER_1.fullName) });
    await expect(oldRow).toContainText('Đã từ chối');

    // Đối chiếu DB bằng SELECT: 2 bản ghi lịch sử (1 REJECTED, 1 PENDING)
    const dbRows = await dbSelect<{ status: string; teacher_code: string; topic_name: string }>(
      `SELECT ar.status, t.teacher_code, ar.topic_name
         FROM advisor_registration ar
         JOIN student s ON s.id = ar.student_id
         JOIN teacher t ON t.id = ar.lecturer_id
        WHERE s.student_code = ? AND ar.semester_id = ?
        ORDER BY ar.id DESC`,
      [TEST_STUDENT.studentCode, envState.semesterId],
    );
    expect(dbRows).toHaveLength(2);
    expect(dbRows[0].status).toBe('PENDING');
    expect(dbRows[0].teacher_code).toBe(TEST_TEACHER_2.teacherCode);
    expect(dbRows[0].topic_name).toBe(newTopic);
    expect(dbRows[1].status).toBe('REJECTED');
    expect(dbRows[1].teacher_code).toBe(TEST_TEACHER_1.teacherCode);
  });

  // ==========================================================================
  // FUNCTION 4: CẬP NHẬT ĐƠN ĐĂNG KÝ GVHD
  // ==========================================================================

  test(ITC011.title, { annotation: ITC011.annotation }, async ({ page, context, request }) => {
    // Chuẩn bị: sinh viên có 1 đơn PENDING với GV999101
    await apiCall(
      request,
      envState.studentToken,
      'POST',
      '/api/student/advisor-registrations',
      {
        data: {
          teacherPublicId: envState.teacher1PublicId,
          topicName: 'Đề tài ban đầu trước khi sửa',
        },
      },
    );

    await setStudentCookie(context, envState.studentToken);
    await page.goto('/student/registration');

    await page.getByRole('button', { name: 'Sửa đơn', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Cập nhật đăng ký GVHD' }),
    ).toBeVisible();

    // Đổi giảng viên sang GV999102
    await page.getByTitle('Chọn giảng viên khác').click();
    await page
      .getByPlaceholder('Tìm theo tên hoặc mã giảng viên...')
      .fill(TEST_TEACHER_2.teacherCode);
    await page
      .getByRole('button', { name: new RegExp(TEST_TEACHER_2.teacherCode) })
      .click();

    const updatedTopic = 'Hệ thống gợi ý lộ trình học tập cá nhân hóa';
    await page.getByLabel(/Tên đề tài/).fill(updatedTopic);

    const updatePromise = page.waitForResponse(
      (r) =>
        r.url().endsWith('/api/student/advisor-registrations') &&
        r.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: 'Cập nhật đăng ký' }).click();
    const updateRes = await updatePromise;

    const reqPayload = updateRes.request().postDataJSON();
    expect(reqPayload.semesterPublicId).toBe(envState.semesterPublicId);
    expect(reqPayload.teacherPublicId).toBe(envState.teacher2PublicId);
    expect(reqPayload.topicName).toBe(updatedTopic);

    expect(updateRes.status()).toBe(200);
    const resBody = await updateRes.json();
    expect(resBody.code).toBe(1000);
    expect(resBody.message).toBe('Cập nhật đơn đăng ký giảng viên hướng dẫn thành công');

    await expect(
      page.getByText('Cập nhật đơn đăng ký giảng viên hướng dẫn thành công'),
    ).toBeVisible();

    const updatedRow = page.getByRole('row', { name: new RegExp(TEST_TEACHER_2.fullName) });
    await expect(updatedRow).toContainText(updatedTopic);
    await expect(updatedRow).toContainText('Chờ duyệt');

    // Đối chiếu DB bằng SELECT: vẫn chỉ có 1 bản ghi nhưng đã cập nhật lecturer và topic_name
    const dbRows = await dbSelect<{
      status: string;
      topic_name: string | null;
      teacher_code: string;
    }>(
      `SELECT ar.status, ar.topic_name, t.teacher_code
         FROM advisor_registration ar
         JOIN student s ON s.id = ar.student_id
         JOIN teacher t ON t.id = ar.lecturer_id
        WHERE s.student_code = ? AND ar.semester_id = ?`,
      [TEST_STUDENT.studentCode, envState.semesterId],
    );
    expect(dbRows).toHaveLength(1);
    expect(dbRows[0].status).toBe('PENDING');
    expect(dbRows[0].teacher_code).toBe(TEST_TEACHER_2.teacherCode);
    expect(dbRows[0].topic_name).toBe(updatedTopic);
  });

  test(ITC012.title, { annotation: ITC012.annotation }, async ({ page, context, request }) => {
    await apiCall(
      request,
      envState.studentToken,
      'POST',
      '/api/student/advisor-registrations',
      {
        data: {
          teacherPublicId: envState.teacher1PublicId,
          topicName: 'Đề tài sẽ bị xóa trắng',
        },
      },
    );

    await setStudentCookie(context, envState.studentToken);
    await page.goto('/student/registration');

    await page.getByRole('button', { name: 'Chỉnh sửa đơn đăng ký' }).click();
    await expect(
      page.getByRole('heading', { name: 'Cập nhật đăng ký GVHD' }),
    ).toBeVisible();

    await page.getByLabel(/Tên đề tài/).fill('   ');

    const updatePromise = page.waitForResponse(
      (r) =>
        r.url().endsWith('/api/student/advisor-registrations') &&
        r.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: 'Cập nhật đăng ký' }).click();
    const updateRes = await updatePromise;

    const reqPayload = updateRes.request().postDataJSON();
    expect(reqPayload.topicName).toBeNull();

    expect(updateRes.status()).toBe(200);
    expect((await updateRes.json()).code).toBe(1000);

    await expect(
      page.getByText('Cập nhật đơn đăng ký giảng viên hướng dẫn thành công'),
    ).toBeVisible();

    const updatedRow = page.getByRole('row', { name: new RegExp(TEST_TEACHER_1.fullName) });
    await expect(updatedRow).toContainText('Chưa có tên đề tài');

    const dbRows = await dbSelect<{ topic_name: string | null }>(
      `SELECT ar.topic_name
         FROM advisor_registration ar
         JOIN student s ON s.id = ar.student_id
        WHERE s.student_code = ? AND ar.semester_id = ?`,
      [TEST_STUDENT.studentCode, envState.semesterId],
    );
    expect(dbRows).toHaveLength(1);
    expect(dbRows[0].topic_name).toBeNull();
  });

  test(ITC013.title, { annotation: ITC013.annotation }, async ({ page, context, request }) => {
    const initialTopic = 'Đề tài trước khi giảng viên duyệt';
    const submitRes = await apiCall(
      request,
      envState.studentToken,
      'POST',
      '/api/student/advisor-registrations',
      {
        data: {
          teacherPublicId: envState.teacher1PublicId,
          topicName: initialTopic,
        },
      },
    );
    const regPublicId = submitRes.body?.data?.registrationPublicId;

    await setStudentCookie(context, envState.studentToken);
    await page.goto('/student/registration');

    await page.getByRole('button', { name: 'Sửa đơn', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Cập nhật đăng ký GVHD' }),
    ).toBeVisible();

    // Trong khi sinh viên đang mở modal, giảng viên duyệt đơn sang TEACHER_APPROVED
    const approveRes = await apiCall(
      request,
      envState.teacher1Token,
      'PATCH',
      `/api/teacher/advisor-registrations/${regPublicId}/approve`,
    );
    expect(approveRes.status).toBe(200);

    await page.getByLabel(/Tên đề tài/).fill('Tên đề tài sửa muộn');

    const updatePromise = page.waitForResponse(
      (r) =>
        r.url().endsWith('/api/student/advisor-registrations') &&
        r.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: 'Cập nhật đăng ký' }).click();
    const updateRes = await updatePromise;

    expect(updateRes.status()).toBe(400);
    const resBody = await updateRes.json();
    expect(resBody.code).toBe(4000);
    expect(resBody.message).toBe('Chỉ được cập nhật đơn khi trạng thái là Chờ duyệt');

    await expect(
      page.getByText('Chỉ được cập nhật đơn khi trạng thái là Chờ duyệt'),
    ).toBeVisible();

    // Đối chiếu DB: trạng thái vẫn là TEACHER_APPROVED và tên đề tài không bị đổi
    const dbRows = await dbSelect<{ status: string; topic_name: string }>(
      `SELECT ar.status, ar.topic_name
         FROM advisor_registration ar
         JOIN student s ON s.id = ar.student_id
        WHERE s.student_code = ? AND ar.semester_id = ?`,
      [TEST_STUDENT.studentCode, envState.semesterId],
    );
    expect(dbRows).toHaveLength(1);
    expect(dbRows[0].status).toBe('TEACHER_APPROVED');
    expect(dbRows[0].topic_name).toBe(initialTopic);
  });

  test(ITC014.title, { annotation: ITC014.annotation }, async ({ page, context, request }) => {
    const submitRes = await apiCall(
      request,
      envState.studentToken,
      'POST',
      '/api/student/advisor-registrations',
      {
        data: {
          teacherPublicId: envState.teacher1PublicId,
          topicName: 'Đề tài đã được GV duyệt sơ bộ',
        },
      },
    );
    const regPublicId = submitRes.body?.data?.registrationPublicId;
    await apiCall(
      request,
      envState.teacher1Token,
      'PATCH',
      `/api/teacher/advisor-registrations/${regPublicId}/approve`,
    );

    await setStudentCookie(context, envState.studentToken);

    const currentPromise = page.waitForResponse(
      (r) =>
        r.url().includes('/api/student/advisor-registrations/current') &&
        r.request().method() === 'GET',
    );
    const historyPromise = page.waitForResponse(
      (r) =>
        /\/api\/student\/advisor-registrations\?semesterPublicId=/.test(r.url()) &&
        r.request().method() === 'GET',
    );

    await page.goto('/student/registration');
    const [currentRes, historyRes] = await Promise.all([currentPromise, historyPromise]);

    expect(currentRes.status()).toBe(200);
    const currentBody = await currentRes.json();
    expect(currentBody.code).toBe(1000);
    expect(currentBody.data.status).toBe('TEACHER_APPROVED');

    expect(historyRes.status()).toBe(200);
    expect((await historyRes.json()).code).toBe(1000);

    await expect(
      page.getByRole('button', { name: 'Đang chờ TBM chốt danh sách' }),
    ).toBeDisabled();
    await expect(
      page.getByText('GVHD đã duyệt, chờ Trưởng bộ môn thẩm định'),
    ).toBeVisible();

    const row = page.getByRole('row', { name: new RegExp(TEST_TEACHER_1.fullName) });
    await expect(row).toContainText('GVHD đã duyệt');
    await expect(row.getByRole('button', { name: 'Sửa đơn' })).toHaveCount(0);
  });

  // ==========================================================================
  // SECURITY TEST CASES (TC-SEC-001 .. TC-SEC-004)
  // ==========================================================================

  test(SEC001.title, { annotation: SEC001.annotation }, async ({ page, context }) => {
    await context.clearCookies();

    const myInfoPromise = page.waitForResponse(
      (r) => r.url().endsWith('/my-info') && r.request().method() === 'GET',
    );
    await page.goto('/student/registration');
    const myInfoRes = await myInfoPromise;

    expect(myInfoRes.status()).toBe(401);
    const body = await myInfoRes.json();
    expect(body.code).toBe(2000);

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: 'Tạo đơn đăng ký GVHD' })).toHaveCount(0);
  });

  test(SEC002.title, { annotation: SEC002.annotation }, async ({ page, context, request }) => {
    await setStudentCookie(context, envState.teacher1Token);

    await page.goto('/student/registration');
    await expect(
      page.getByText('Tài khoản của bạn không có quyền truy cập cổng sinh viên.'),
    ).toBeVisible();

    const apiRes = await apiCall(
      request,
      envState.teacher1Token,
      'GET',
      '/api/student/advisor-registrations/current',
    );
    expect(apiRes.status).toBe(403);
    expect(apiRes.body.code).toBe(2001);
    expect(apiRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');
  });

  test(SEC003.title, { annotation: SEC003.annotation }, async ({ page, context, request }) => {
    await setStudentCookie(context, envState.hodToken);

    await page.goto('/student/registration');
    await expect(
      page.getByText('Tài khoản của bạn không có quyền truy cập cổng sinh viên.'),
    ).toBeVisible();

    const apiRes = await apiCall(
      request,
      envState.hodToken,
      'POST',
      '/api/student/advisor-registrations',
      {
        data: {
          teacherPublicId: envState.teacher1PublicId,
          topicName: 'TBM thử gửi đơn đăng ký như sinh viên',
        },
      },
    );
    expect(apiRes.status).toBe(403);
    expect(apiRes.body.code).toBe(2001);
    expect(apiRes.body.message).toBe('Bạn không có quyền truy cập (access denied)');
  });

  test(SEC004.title, { annotation: SEC004.annotation }, async ({ page, context, request }) => {
    const freshToken = await loginByEmail(request, TEST_STUDENT.email);

    // Đăng xuất token này để đưa vào danh sách token bị vô hiệu hóa
    const logoutRes = await apiCall(request, freshToken, 'POST', '/log-out');
    expect(logoutRes.status).toBe(200);

    // Dùng lại token đã đăng xuất để mở màn hình và gọi API
    await setStudentCookie(context, freshToken);
    await page.goto('/student/registration');
    await expect(page).toHaveURL(/\/login$/);

    const apiRes = await apiCall(
      request,
      freshToken,
      'GET',
      '/api/student/advisor-registrations/current',
    );
    expect(apiRes.status).toBe(401);
    expect(apiRes.body.code).toBe(2000);
  });
});
