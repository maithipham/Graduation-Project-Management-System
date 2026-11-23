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
    base: '/api/advisors',
    template: '/api/advisors/import/template',
    export: '/api/advisors/export',
    finalize: '/api/advisors/finalize',
    assign: '/api/advisors/assign',
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
  // Tài liệu & Biểu mẫu của Trưởng bộ môn (lưu trên Cloudinary)
  departmentDocument: {
    // GET: danh sách (phân trang, mọi role đã đăng nhập) · POST: tải lên (multipart, chỉ TBM)
    base: '/template',
    // PUT: sửa (multipart) · DELETE: xóa
    detail: (publicId: string) => `/template/${publicId}`,
  },
  major: {
    base: '/major',
  },
  // Học kì cho dropdown Năm học / Học kì (quyền VIEW_SEMESTER). Khác nhóm admin.semesters
  semester: {
    base: '/semester',
    current: '/semester/current',
  },
  // Báo cáo đồ án Final & Phiếu theo dõi tiến độ (GVHD / SV)
  report: {
    supervisorList: '/report/supervisor-list',
    detail: (publicId: string) => `/report/${publicId}`,
    review: (publicId: string) => `/report/${publicId}/review`,
    submitProgressReport: '/report/progress-report',
    deadlines: '/api/v1/deadlines',
  },
  // Quản lý & Thẩm định yêu cầu đổi / chốt tên đề tài (GVHD)
  topicTitle: {
    supervisorRequests: '/topic/title-request',
    review: (publicId: string) => `/topic/title-request/${publicId}/review`,
    historyByTopic: (topicPublicId: string) => `/topic/${topicPublicId}/title-history`,
    deadlines: '/api/v1/deadlines',
  },
  // Quản lý & Thẩm định đề cương đồ án tốt nghiệp (GVHD / GVNX)
  outline: {
    supervisorList: '/outline/supervisor-list',
    reviewList: '/outline/review-list',
    detail: (publicId: string) => `/outline/${publicId}`,
    review: (publicId: string) => `/outline/${publicId}/review`,
    advisorFeedback: (publicId: string) => `/outline/${publicId}/advisor-feedback`,
    deadlines: '/api/v1/deadlines',
  },
  /** Cấu hình rubric điểm (Trưởng bộ môn) – EvaluationTemplateController */
  // Danh sách học kỳ cho ô chọn "Từ kỳ" / "Đến kỳ" dùng lại semester.base ở trên
  departmentRubric: {
    // GET: danh sách theo loại (?type=) · POST: tạo rubric Nháp
    base: '/evaluation-template',
    // GET: chi tiết · PUT: lưu tên + cây · DELETE: xóa Nháp
    detail: (publicId: string) => `/evaluation-template/${publicId}`,
    clone: (publicId: string) => `/evaluation-template/${publicId}/clone`,
    applyPreview: (publicId: string) => `/evaluation-template/${publicId}/apply-preview`,
    cancelApplyPreview: (publicId: string) => `/evaluation-template/${publicId}/cancel-apply-preview`,
    apply: (publicId: string) => `/evaluation-template/${publicId}/apply`,
    semesterRange: (publicId: string) => `/evaluation-template/${publicId}/semester-range`,
    cancelApply: (publicId: string) => `/evaluation-template/${publicId}/cancel-apply`,
    // GET: 3 rubric của học kỳ (chỉ xem, không còn PUT)
    semester: (semesterPublicId: string) => `/semester/${semesterPublicId}/evaluation-template`,
  },
  /** Chấm điểm hướng dẫn (GVHD chính) – SupervisorGradeController */
  advisorGrade: {
    topics: '/advisor-grade/topic',
    openSheet: (topicPublicId: string) => `/advisor-grade/topic/${topicPublicId}/sheet`,
    sheet: (sheetPublicId: string) => `/advisor-grade/sheet/${sheetPublicId}`,
    submit: (sheetPublicId: string) => `/advisor-grade/sheet/${sheetPublicId}/submit`,
  },
  lecturer: {
    // GET: xem thông tin cá nhân · PUT: sửa Họ, Tên, Số điện thoại
    myInfo: '/teacher/my-info',
    dashboard: '/lecturer/dashboard',
    topics: '/lecturer/topics',
    reviewOutline: '/lecturer/review-outline',
    reportEvaluation: '/lecturer/report-eval',
    council: '/lecturer/council',
    department: '/lecturer/department',

    // Quản lý yêu cầu đăng ký GVHD
    base: '/api/teacher/advisor-registrations',
    deadline: '/api/teacher/advisor-registrations/deadline',

    // GET: chi tiết yêu cầu
    detail: (publicId: string) =>
      `/api/teacher/advisor-registrations/${publicId}`,

    // PATCH: duyệt yêu cầu
    approve: (publicId: string) =>
      `/api/teacher/advisor-registrations/${publicId}/approve`,

    // PATCH: từ chối yêu cầu
    reject: (publicId: string) =>
      `/api/teacher/advisor-registrations/${publicId}/reject`,
  },
  admin: {
    accounts: '/accounts',
    // Tài khoản sinh viên (quyền *_ACCOUNT), không theo học kì
    studentAccounts: '/student/account', // GET danh sách, POST thêm thủ công
    studentAccountDetail: (publicId: string) => `/student/account/${publicId}`, // GET chi tiết, PUT sửa, DELETE xóa / khóa
    studentAccountExport: '/student/account/export', // GET xuất Excel
    studentAccountImport: '/student/account/import', // POST import file
    studentBatchAll: '/student/batch/all',
    semesters: '/semester',
    faculties: '/faculty',
    majors: '/major',
    majorHead: (majorId: string) => `/major/${majorId}/head`,
  },
  // Quản lý Hội đồng bảo vệ (Trưởng bộ môn / Admin)
  defenseCouncil: {
    // GET: danh sách tổng quan theo học kỳ và bộ môn (?semesterId=&majorId=)
    base: '/defense-council',
    // POST: tạo hàng loạt hội đồng bảo vệ
    batch: '/defense-council/batch',
    // PATCH: sửa ngày bảo vệ chung cho mọi hội đồng của ngành trong học kỳ
    defenseDate: '/defense-council/defense-date',
    // GET: danh sách mốc thời hạn (dùng đọc mốc THANH_LAP_HOI_DONG)
    deadlines: '/api/v1/deadlines',
    // PATCH / DELETE: cập nhật hoặc xóa hội đồng (phòng, thời gian bảo vệ)
    detail: (councilPublicId: string) => `/defense-council/${councilPublicId}`,
    // GET: danh sách giảng viên ứng viên (?semesterId=&majorId=&scope=&assignedOnly=&keyword=)
    teacher: '/defense-council/teacher',
    // PUT: lưu phân công thành viên hội đồng
    member: (councilPublicId: string) => `/defense-council/${councilPublicId}/member`,
    // GET: danh sách sinh viên đủ điều kiện (?semesterId=&majorId=&assigned=&page=&size=)
    student: '/defense-council/student',
    // POST: gán sinh viên vào hội đồng
    assignment: (councilPublicId: string) => `/defense-council/${councilPublicId}/assignment`,
    // DELETE: gỡ sinh viên khỏi hội đồng
    removeAssignment: (councilPublicId: string, assignmentPublicId: string) =>
      `/defense-council/${councilPublicId}/assignment/${assignmentPublicId}`,
  },
  // Bước 12: Phân công GVPB, lịch & chấm phản biện (Giảng viên)
  examinerReview: {
    myCouncils: '/defense-council/my',
    councilBoard: (councilPublicId: string) => `/defense-council/${councilPublicId}/examiner`,
    assignExaminers: (defenseAssignmentPublicId: string) => `/defense-assignment/${defenseAssignmentPublicId}/examiner`,
    // PUT: lưu phân công GVPB cho nhiều sinh viên của Hội đồng trong 1 lần
    batchAssignExaminers: (councilPublicId: string) => `/defense-council/${councilPublicId}/examiner`,
    myAssignments: '/examiner-assignment/my',
    schedule: (id: string) => `/examiner-assignment/${id}/schedule`,
    evaluation: (id: string) => `/examiner-assignment/${id}/evaluation`,
    // GET: tải phiếu chấm tóm tắt Rubric (.docx) của GVPB
    evaluationExport: (id: string) => `/examiner-assignment/${id}/evaluation/export`,
    decision: (id: string) => `/examiner-assignment/${id}/decision`,
    reviewFile: (id: string) => `/examiner-assignment/${id}/review-file`,
  },
  // Bước 13: Lịch bảo vệ Hội đồng (Chủ tịch / Thư ký xếp ca)
  defenseSchedule: {
    councilSchedule: (councilPublicId: string) =>
      `/defense-council/${councilPublicId}/defense-schedule`,
    scheduleSlot: (defenseAssignmentPublicId: string) =>
      `/defense-assignment/${defenseAssignmentPublicId}/defense-slot`,
    unscheduleSlot: (defenseAssignmentPublicId: string) =>
      `/defense-assignment/${defenseAssignmentPublicId}/defense-slot`,
    // POST: tạo ca bảo vệ (tên tùy chỉnh) cho Hội đồng
    createSession: (councilPublicId: string) => `/defense-council/${councilPublicId}/defense-session`,
    // DELETE: xóa ca bảo vệ (sinh viên trong ca về Chưa xếp ca)
    deleteSession: (sessionPublicId: string) => `/defense-session/${sessionPublicId}`,
  },
  // Bước 14: Chấm điểm Hội đồng, bảng điểm realtime, biên bản, hoàn tất bảo vệ, nộp lại báo cáo
  defenseEvaluation: {
    gradingBoard: (councilPublicId: string) =>
      `/defense-council/${councilPublicId}/council-evaluation`,
    councilEvaluation: (defenseAssignmentPublicId: string) =>
      `/defense-assignment/${defenseAssignmentPublicId}/council-evaluation`,
    // GET: tải phiếu chấm tóm tắt Rubric (.docx) của thành viên Hội đồng
    councilEvaluationExport: (defenseAssignmentPublicId: string) =>
      `/defense-assignment/${defenseAssignmentPublicId}/council-evaluation/export`,
    scoreBoard: (defenseAssignmentPublicId: string) =>
      `/defense-score/${defenseAssignmentPublicId}`,
    trialScore: (defenseAssignmentPublicId: string) =>
      `/defense-assignment/${defenseAssignmentPublicId}/defense-score/trial`,
    councilScoreBoards: (councilPublicId: string) =>
      `/defense-council/${councilPublicId}/defense-score`,
    minutes: (defenseAssignmentPublicId: string) =>
      `/defense-assignment/${defenseAssignmentPublicId}/defense-minutes`,
    finalizeMinutes: (defenseAssignmentPublicId: string) =>
      `/defense-assignment/${defenseAssignmentPublicId}/defense-minutes/finalize`,
    completion: (defenseAssignmentPublicId: string) =>
      `/defense-assignment/${defenseAssignmentPublicId}/completion`,
    revisionDetail: (revisionPublicId: string) => `/defense-revision/${revisionPublicId}`,
    revisionReview: (revisionPublicId: string) => `/defense-revision/${revisionPublicId}/review`,
  },
  // Chấm phiếu hướng dẫn (GVHD chính) + Phiếu theo dõi tiến độ
  advisorEvaluation: {
    my: '/report/advisor-evaluation/my',
    detail: (topicPublicId: string) => `/report/advisor-evaluation/${topicPublicId}`,
    progressReport: '/report/progress-report',
  },
} as const
