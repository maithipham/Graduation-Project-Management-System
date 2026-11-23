export const API_ENDPOINTS = {
  auth: {
    login: '/login',
    logout: '/log-out',
    refreshToken: '/refresh-token',
    myInfo: '/my-info',
  },
  notification: {
    // GET: danh sách thông báo · PATCH (không có body): đánh dấu tất cả là đã đọc
    base: '/notification',
    // Kênh SSE nhận thông báo mới (event "notification")
    stream: '/connection',
  },
  student: {
    overview: '/student/overview',
    // GET: thông tin cá nhân + đề tài kỳ hiện tại · PUT: sửa Họ, Tên, Số điện thoại
    myInfo: '/student/my-info',
    // Đăng ký giảng viên hướng dẫn
    advisorRegistrations: '/api/student/advisor-registrations',
    // gvhd và đề tài chính thức các kỳ
    registrationOverview: '/api/student/advisor-registrations/overview',
    // danh sách gvhd
    availableAdvisors: '/api/student/advisor-registrations/advisors',
    lecturers: '/api/student/lecturers',
    outline: '/api/student/outline',
    reports: '/api/student/reports',
    schedule: '/api/student/schedule',
    // Điểm đồ án của sinh viên đang đăng nhập (HD / PB / HĐ + tổng kết)
    myScore: '/thesis-score/my-score',
    // Tài liệu / biểu mẫu sinh viên được xem và tải (chỉ 3 loại: Đề cương, Báo cáo toàn văn, Slide bảo vệ)
    templates: '/template/shared',
  },
  lecturer: {
    dashboard: '/lecturer/dashboard',
    topics: '/lecturer/topics',
    reviewOutline: '/lecturer/review-outline',
    reportEvaluation: '/lecturer/report-eval',
    council: '/lecturer/council',
    department: '/lecturer/department',
  },
  semester: {
    base: '/semester',
    current: '/semester/current',
  },
  deadline: {
    // GET ?semesterId=... : các mốc thời hạn của học kỳ, gom theo 3 giai đoạn
    base: '/api/v1/deadlines',
  },
  major: {
    base: '/major',
  },
  topicTitle: {
    overview: '/topic/my-title-history',
    confirmInitial: '/topic/confirm-title',
    requestChange: '/topic/change-title',
  },
  outline: {
    myOutline: '/outline/my-outline',
    submit: '/outline/submit',
  },
  report: {
    myReport: '/report/my-report',
    submit: '/report/submit',
    detail: (publicId: string) => `/report/${publicId}`,
  },
  // Nộp lại báo cáo cuối cùng sau bảo vệ (Thư ký đánh dấu trong biên bản, Thư ký / Chủ tịch duyệt)
  defenseRevision: {
    // GET ?semesterId=... : yêu cầu của sinh viên đang đăng nhập (data rỗng = không có yêu cầu)
    my: '/defense-revision/my',
    // POST multipart: revisedReportFile (bắt buộc), explanationFile, studentNote
    submit: (revisionPublicId: string) => `/defense-revision/${revisionPublicId}/submission`,
  },
  advisor: {
    advisors: (semesterId: string) => `/semesters/${semesterId}/advisors`,
  },
} as const
