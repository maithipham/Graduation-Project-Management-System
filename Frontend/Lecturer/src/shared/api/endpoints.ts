export const API_ENDPOINTS = {
  auth: {
    login: '/login',
    logout: '/logout',
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
  // Quản lý sinh viên (Trưởng bộ môn / Admin). Khác nhóm `student` ở trên (portal của sinh viên)
  departmentStudent: {
    // GET: danh sách (Page) · POST: thêm thủ công
    base: '/student',
    detail: (publicId: string) => `/student/${publicId}`,
    import: '/student/import',
    activate: (publicId: string) => `/student/${publicId}/activate`,
  },
  // Quản lý giáo viên hướng dẫn (Trưởng bộ môn / Admin)
  departmentTeacher: {
    // GET: danh sách (Page) · POST: thêm thủ công
    base: '/teacher',
    detail: (publicId: string) => `/teacher/${publicId}`,
    import: '/teacher/import',
    activate: (publicId: string) => `/teacher/${publicId}/activate`,
    // PATCH: thiết lập hạn mức sinh viên được nhận
    amount: (publicId: string) => `/teacher/${publicId}/amount`,
  },
  major: {
    base: '/major',
  },
  lecturer: {
    dashboard: '/lecturer/dashboard',
    topics: '/lecturer/topics',
    reviewOutline: '/lecturer/review-outline',
    reportEvaluation: '/lecturer/report-eval',
    council: '/lecturer/council',
    department: '/lecturer/department',
  },
  admin: {
    accounts: '/accounts',
    semesters: '/semesters',
    faculties: '/faculties',
    majors: '/majors',
    majorHead: (majorId: string) => `/majors/${majorId}/head`,
  },
} as const
