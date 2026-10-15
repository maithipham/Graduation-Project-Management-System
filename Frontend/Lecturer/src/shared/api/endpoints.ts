export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refreshToken: '/refresh-token',
    me: '/auth/me',
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
