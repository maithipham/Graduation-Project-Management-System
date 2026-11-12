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
    results: '/api/student/results',
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
  advisor: {
    advisors: (semesterId: string) => `/semesters/${semesterId}/advisors`,
  },
} as const
