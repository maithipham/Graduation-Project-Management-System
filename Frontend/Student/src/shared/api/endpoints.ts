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
    registration: '/student/registration',
    lecturers: '/student/lecturers',
    outline: '/student/outline',
    reports: '/student/reports',
    schedule: '/student/schedule',
    results: '/student/results',
    documents: '/student/documents',
  },
  lecturer: {
    dashboard: '/lecturer/dashboard',
    topics: '/lecturer/topics',
    reviewOutline: '/lecturer/review-outline',
    reportEvaluation: '/lecturer/report-eval',
    council: '/lecturer/council',
    department: '/lecturer/department',
  },
} as const
