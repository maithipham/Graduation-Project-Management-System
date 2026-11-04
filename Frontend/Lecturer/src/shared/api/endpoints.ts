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
  // Quản lý sinh viên (Trưởng bộ môn / Admin). Khác nhóm `student` ở trên (portal của sinh viên)
  departmentStudent: {
    // GET: danh sách theo học kì (Page) · POST: thêm thủ công
    base: '/student',
    // GET: chi tiết · PUT: sửa · DELETE: xóa khỏi học kì
    detail: (publicId: string) => `/student/${publicId}`,
    import: '/student/import',
    // GET: tải file Excel danh sách sinh viên (cùng bộ lọc với danh sách, không phân trang)
    export: '/student/export',
    // GET: các khóa đang có sinh viên trong học kì (dropdown Khóa)
    batch: '/student/batch',
  },
  // Quản lý giáo viên (Trưởng bộ môn / Admin)
  departmentTeacher: {
    // GET: danh sách (Page) · POST: thêm thủ công
    base: '/teacher',
    all: '/teacher/all',
    detail: (publicId: string) => `/teacher/${publicId}`,
    import: '/teacher/import',
    activate: (publicId: string) => `/teacher/${publicId}/activate`,
    // GET: danh mục học hàm, học vị (id, code, name, abbreviation)
    academicTitles: '/teacher/academic-titles',
    // GET: danh sách GV khả dụng chưa làm GVHD trong kỳ
    available: '/teacher/available',
    // POST: phân công danh sách giáo viên làm GVHD trong học kỳ
    advisors: (semesterId: string) => `/semesters/${semesterId}/advisors`,
    // POST: import file Excel danh sách GVHD trong học kỳ
    importAdvisorsExcel: (semesterId: string) => `/semesters/${semesterId}/advisors/import-excel`,
  },
  // Quản lý Giáo viên hướng dẫn (GVHD) theo học kỳ
  advisor: {
    // GET: lấy danh sách GVHD trong kỳ · POST: phân công GVHD
    advisors: (semesterId: string) => `/semesters/${semesterId}/advisors`,
    // DELETE: xóa/loại bỏ GVHD khỏi học kỳ
    removeAdvisor: (semesterId: string, teacherId: string | number) =>
      `/semesters/${semesterId}/advisors/${teacherId}`,
    // DELETE: alias xóa GVHD theo ID phân công
    removeAdvisorById: (advisorId: string | number) => `/semesters/advisors/${advisorId}`,
    // POST: import file Excel danh sách GVHD trong học kỳ
    importAdvisorsExcel: (semesterId: string) => `/semesters/${semesterId}/advisors/import-excel`,
    // GET: lấy hạn mức theo chức danh · PUT: cập nhật hạn mức theo chức danh cho kỳ
    quotas: (semesterId: string) => `/semesters/${semesterId}/advisor-quotas`,
    // PUT: Cập nhật hạn mức sinh viên tối đa cho 1 GVHD trong kỳ
    updateQuota: (semesterId: string, teacherId: string | number) =>
      `/semesters/${semesterId}/advisors/${teacherId}/quota`,
  },
  // Phân công Giảng viên Hướng dẫn (TBM Workspace & Actions)
  advisorAssignment: {
    workspace: (semesterId: string) => `/semesters/${semesterId}/advisor-assignments`,
    approve: (semesterId: string) => `/semesters/${semesterId}/advisor-assignments/approve`,
    reject: (semesterId: string) => `/semesters/${semesterId}/advisor-assignments/reject`,
    assign: (semesterId: string) => `/semesters/${semesterId}/advisor-assignments/assign`,
    changeSupervisor: (semesterId: string, studentPublicId: string) =>
      `/semesters/${semesterId}/advisor-assignments/students/${studentPublicId}/supervisor`,
    changeCoSupervisor: (semesterId: string, studentPublicId: string) =>
      `/semesters/${semesterId}/advisor-assignments/students/${studentPublicId}/co-supervisor`,
    toggleLock: (semesterId: string) => `/semesters/${semesterId}/advisor-assignments/lock-status`,
  },
  major: {
    base: '/major',
  },
  // Học kì cho dropdown Năm học / Học kì (quyền VIEW_SEMESTER). Khác nhóm admin.semesters
  semester: {
    base: '/semester',
    current: '/semester/current',
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
    // Tài khoản sinh viên (quyền *_ACCOUNT), không theo học kì
    studentAccounts: '/student/account', // GET danh sách, POST thêm thủ công
    studentAccountDetail: (publicId: string) => `/student/account/${publicId}`, // GET chi tiết, PUT sửa, DELETE xóa / khóa
    studentAccountExport: '/student/account/export', // GET xuất Excel
    studentAccountImport: '/student/account/import', // POST import file
    studentBatchAll: '/student/batch/all',
    semesters: '/semesters',
    faculties: '/faculties',
    majors: '/majors',
    majorHead: (majorId: string) => `/majors/${majorId}/head`,
  },
} as const
