import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import { teacherService } from './teacher.service'
import { studentService } from '@/features/department/student_management/services/student.service'
import type {
  TeacherListItem,
  SupervisorLecturer,
  SupervisorStudent,
  TitleQuotaConfig,
  SemesterAdvisorResponse,
  AdvisorAssignmentWorkspaceResponse,
  StudentAssignmentItem,
  LecturerAssignmentItem,
} from '../types'
import type { StudentListItem } from '@/features/department/student_management/types'

export const DEFAULT_TITLE_QUOTAS: TitleQuotaConfig[] = [
  {
    id: 1,
    academicTitleId: 1,
    code: 'MASTER',
    titleCode: 'MASTER',
    title: 'Thạc sĩ',
    titleName: 'Thạc sĩ',
    shortTitle: 'ThS.',
    academicTitle: 'ThS.',
    internal: 5,
    external: 3,
    internalQuota: 5,
    externalQuota: 3,
  },
  {
    id: 2,
    academicTitleId: 2,
    code: 'DOCTOR',
    titleCode: 'DOCTOR',
    title: 'Tiến sĩ',
    titleName: 'Tiến sĩ',
    shortTitle: 'TS.',
    academicTitle: 'TS.',
    internal: 7,
    external: 4,
    internalQuota: 7,
    externalQuota: 4,
  },
  {
    id: 3,
    academicTitleId: 3,
    code: 'ASSOCIATE_PROFESSOR',
    titleCode: 'ASSOCIATE_PROFESSOR',
    title: 'Phó Giáo sư',
    titleName: 'Phó Giáo sư',
    shortTitle: 'PGS.TS.',
    academicTitle: 'PGS.TS.',
    internal: 8,
    external: 5,
    internalQuota: 8,
    externalQuota: 5,
  },
  {
    id: 4,
    academicTitleId: 4,
    code: 'PROFESSOR',
    titleCode: 'PROFESSOR',
    title: 'Giáo sư',
    titleName: 'Giáo sư',
    shortTitle: 'GS.TS.',
    academicTitle: 'GS.TS.',
    internal: 10,
    external: 6,
    internalQuota: 10,
    externalQuota: 6,
  },
]

export function toSupervisorLecturer(
  t: TeacherListItem,
  students: StudentListItem[] = [],
  semesterName = '',
  year = '',
): SupervisorLecturer {
  const cleanName = t.name.trim()
  const assignedCount = students.filter(
    (s) =>
      (s.lecturerName && s.lecturerName.toLowerCase().includes(cleanName.toLowerCase())) ||
      (s.coLecturerName && s.coLecturerName.toLowerCase().includes(cleanName.toLowerCase())),
  ).length

  return {
    id: t.publicId,
    teacherId: t.id ?? t.teacherId,
    teacherPublicId: t.publicId,
    teacherCode: t.teacherCode,
    name: t.academicTitle ? `${t.academicTitle} ${t.name}` : t.name,
    title: t.academicTitle || '',
    email: t.email,
    category: t.isInternal ? 'internal' : 'univ_ext',
    categoryLabel: t.isInternal ? 'Trong bộ môn' : 'Ngoài trường',
    department: t.majorName || t.organization || 'Bộ môn',
    quota: typeof t.maxStudents === 'number' ? t.maxStudents : 0,
    assigned: assignedCount,
    year,
    semester: semesterName,
    status: t.status ? 'active' : 'busy',
  }
}

export function toSupervisorLecturerFromAdvisor(
  item: SemesterAdvisorResponse,
  students: StudentListItem[] = [],
  semesterName = '',
  year = '',
  managedMajorName = '',
): SupervisorLecturer {
  const teacher = item.teacher
  const advisorId = item.id ?? item.semesterAdvisorId
  const advisorPublicId = item.publicId ? String(item.publicId) : undefined
  const teacherId =
    typeof item.teacherId === 'number'
      ? item.teacherId
      : typeof teacher?.id === 'number'
        ? teacher.id
        : typeof teacher?.teacherId === 'number'
          ? teacher.teacherId
          : undefined
  const teacherPublicId = String(item.teacherPublicId || teacher?.publicId || '')
  const teacherCode = item.teacherCode || teacher?.teacherCode
  const id = teacherPublicId || String(teacherId || advisorId || '')
  const rawName =
    item.fullNameWithTitle ||
    item.displayName ||
    item.teacherName ||
    item.name ||
    teacher?.fullNameWithTitle ||
    teacher?.displayName ||
    teacher?.name ||
    ''
  const title = item.academicTitle || teacher?.academicTitle || ''
  const email = item.teacherEmail || item.email || teacher?.email || ''
  const isInternal = item.isInternal ?? teacher?.isInternal ?? true
  const department =
    item.majorName || teacher?.majorName || item.organization || teacher?.organization || 'Bộ môn'
  const quota =
    typeof item.maxStudents === 'number'
      ? item.maxStudents
      : typeof teacher?.maxStudents === 'number'
        ? teacher.maxStudents
        : 0

  const cleanName = (item.name || item.teacherName || teacher?.name || rawName).trim()
  const matchedStudentCount = students.filter(
    (s) =>
      (s.lecturerName && s.lecturerName.toLowerCase().includes(cleanName.toLowerCase())) ||
      (s.coLecturerName && s.coLecturerName.toLowerCase().includes(cleanName.toLowerCase())),
  ).length

  const assigned =
    typeof item.currentStudents === 'number'
      ? item.currentStudents
      : typeof item.assignedStudents === 'number'
        ? item.assignedStudents
        : matchedStudentCount

  let category: 'internal' | 'dept_ext' | 'univ_ext' = 'internal'
  let categoryLabel = 'Trong bộ môn'

  if (!isInternal) {
    category = 'univ_ext'
    categoryLabel = 'Ngoài trường'
  } else if (
    managedMajorName &&
    department &&
    !department.toLowerCase().includes(managedMajorName.toLowerCase()) &&
    !managedMajorName.toLowerCase().includes(department.toLowerCase())
  ) {
    category = 'dept_ext'
    categoryLabel = 'Ngoài bộ môn'
  } else {
    category = 'internal'
    categoryLabel = 'Trong bộ môn'
  }

  return {
    id,
    advisorId,
    advisorPublicId,
    teacherId,
    teacherPublicId: teacherPublicId || undefined,
    teacherCode,
    name: rawName,
    title,
    email,
    category,
    categoryLabel,
    department,
    quota,
    assigned,
    year,
    semester: semesterName,
    status: (item.status ?? teacher?.status ?? true) ? 'active' : 'busy',
  }
}

export function toSupervisorStudent(
  s: StudentListItem,
  lecturers: TeacherListItem[] = [],
  semesterName = '',
  year = '',
): SupervisorStudent {
  const matchedSupervisor = lecturers.find(
    (l) => s.lecturerName && s.lecturerName.toLowerCase().includes(l.name.toLowerCase()),
  )

  const regStatus = (
    ((s as any).registrationStatus || (s as any).status || '') as string
  ).toUpperCase()

  let status: 'received' | 'unassigned' | 'approved' = 'unassigned'
  if (
    regStatus === 'TEACHER_APPROVED' ||
    regStatus === 'RECEIVED'
  ) {
    status = 'received'
  } else if (
    regStatus === 'APPROVED' ||
    regStatus === 'HOD_APPROVED' ||
    regStatus === 'ASSIGNED_BY_HOD' ||
    s.topicName
  ) {
    status = 'approved'
  } else if (s.lecturerName) {
    status = 'received'
  } else {
    status = 'unassigned'
  }

  return {
    id: s.publicId,
    code: s.studentCode,
    name: s.name,
    className: s.className,
    topic: s.topicName || '',
    supervisorId: status === 'unassigned' ? null : (matchedSupervisor?.publicId || null),
    supervisorName: status === 'unassigned' ? null : (s.lecturerName || null),
    supervisor2Id: null,
    supervisor2Name: status === 'unassigned' ? null : (s.coLecturerName || null),
    assignedTime: null,
    status,
    year,
    semester: semesterName,
  }
}

export function toSupervisorStudentFromWorkspace(
  item: StudentAssignmentItem,
  semesterName = '',
  year = '',
): SupervisorStudent {
  const regStatus = (
    (item.registrationStatus || (item as any).advisorRegistrationStatus || '') as string
  ).toUpperCase()
  const rawStatus = (item.status || 'UNASSIGNED').toUpperCase()

  let status: 'received' | 'unassigned' | 'approved' = 'unassigned'
  if (
    rawStatus === 'TEACHER_APPROVED' ||
    rawStatus === 'RECEIVED' ||
    regStatus === 'TEACHER_APPROVED' ||
    regStatus === 'RECEIVED'
  ) {
    status = 'received'
  } else if (
    rawStatus === 'APPROVED' ||
    rawStatus === 'HOD_APPROVED' ||
    rawStatus === 'ASSIGNED_BY_HOD' ||
    regStatus === 'APPROVED' ||
    regStatus === 'HOD_APPROVED' ||
    regStatus === 'ASSIGNED_BY_HOD'
  ) {
    status = 'approved'
  } else {
    status = 'unassigned'
  }

  const registrationPublicId =
    item.registrationPublicId ||
    (item as any).advisorRegistrationPublicId ||
    (item as any).registrationId ||
    (item as any).advisorRegistrationId ||
    null

  const resolvedRegStatus =
    regStatus ||
    (status === 'received'
      ? 'TEACHER_APPROVED'
      : status === 'approved'
        ? rawStatus === 'ASSIGNED_BY_HOD'
          ? 'ASSIGNED_BY_HOD'
          : 'HOD_APPROVED'
        : null)

  return {
    id: item.studentPublicId,
    studentPublicId: item.studentPublicId,
    registrationPublicId,
    topicPublicId: item.topicPublicId,
    code: item.studentCode,
    name: item.fullName,
    className: item.className || '',
    topic: item.topicName || '',
    supervisorId: status === 'unassigned' ? null : (item.supervisor?.teacherPublicId || null),
    supervisorName: status === 'unassigned' ? null : (item.supervisor?.fullName || null),
    supervisor2Id: status === 'unassigned' ? null : (item.coSupervisor?.teacherPublicId || null),
    supervisor2Name: status === 'unassigned' ? null : (item.coSupervisor?.fullName || null),
    assignedTime: item.assignedAt || null,
    status,
    registrationStatus: resolvedRegStatus,
    year,
    semester: semesterName,
  }
}

export function toSupervisorLecturerFromWorkspace(
  item: LecturerAssignmentItem,
  semesterName = '',
  year = '',
  managedMajorName = '',
): SupervisorLecturer {
  const cat = (item.category || '').toLowerCase()
  let category: 'internal' | 'dept_ext' | 'univ_ext' = 'internal'
  let categoryLabel = item.categoryLabel || ''

  if (cat === 'univ_ext' || item.isInternal === false) {
    category = 'univ_ext'
    categoryLabel = categoryLabel || 'Ngoài trường'
  } else if (cat === 'dept_ext') {
    category = 'dept_ext'
    categoryLabel = categoryLabel || 'Ngoài bộ môn'
  } else if (cat === 'internal') {
    category = 'internal'
    categoryLabel = categoryLabel || 'Trong bộ môn'
  } else {
    const dept = item.department || item.organization || ''
    if (
      managedMajorName &&
      dept &&
      !dept.toLowerCase().includes(managedMajorName.toLowerCase()) &&
      !managedMajorName.toLowerCase().includes(dept.toLowerCase())
    ) {
      category = 'dept_ext'
      categoryLabel = categoryLabel || 'Ngoài bộ môn'
    } else {
      category = 'internal'
      categoryLabel = categoryLabel || 'Trong bộ môn'
    }
  }

  return {
    id: item.teacherPublicId,
    teacherPublicId: item.teacherPublicId,
    teacherCode: item.teacherCode,
    name: item.fullName,
    title: item.title || '',
    email: item.email,
    category,
    categoryLabel:
      categoryLabel ||
      (category === 'univ_ext'
        ? 'Ngoài trường'
        : category === 'dept_ext'
          ? 'Ngoài bộ môn'
          : 'Trong bộ môn'),
    department: item.department || item.organization || 'Bộ môn',
    quota: item.quota,
    assigned: item.assignedCount,
    year,
    semester: semesterName,
    status: 'active',
  }
}

export const supervisorService = {
  // GET /semesters/{semesterId}/advisor-assignments: Lấy dữ liệu phân công 2 cột (Workspace)
  async getWorkspace(semesterId?: string): Promise<AdvisorAssignmentWorkspaceResponse | null> {
    const cleanSemesterId = semesterId && semesterId !== 'all' ? semesterId : 'current'
    try {
      const res = await apiClient.get<ApiResponse<AdvisorAssignmentWorkspaceResponse>>(
        API_ENDPOINTS.advisorAssignment.workspace(cleanSemesterId),
        { skipErrorToast: true },
      )
      return res.data?.data || null
    } catch {
      return null
    }
  },

  // PUT /semesters/{semesterId}/advisor-assignments/approve: Phê duyệt sinh viên ở tab Đã nhận GV
  async approveRegistrations(semesterId: string, registrationPublicIds: string[]): Promise<void> {
    const cleanSemesterId = semesterId && semesterId !== 'all' ? semesterId : 'current'
    await apiClient.put<ApiResponse<void>>(
      API_ENDPOINTS.advisorAssignment.approve(cleanSemesterId),
      {
        registrationPublicIds,
        registrationIds: registrationPublicIds,
        studentPublicIds: registrationPublicIds,
        ids: registrationPublicIds,
      },
    )
  },

  // PUT /semesters/{semesterId}/advisor-assignments/reject: Từ chối phân công ở tab Đã nhận GV
  async rejectRegistrations(semesterId: string, registrationPublicIds: string[]): Promise<void> {
    const cleanSemesterId = semesterId && semesterId !== 'all' ? semesterId : 'current'
    await apiClient.put<ApiResponse<void>>(
      API_ENDPOINTS.advisorAssignment.reject(cleanSemesterId),
      {
        registrationPublicIds,
        registrationIds: registrationPublicIds,
        studentPublicIds: registrationPublicIds,
        ids: registrationPublicIds,
      },
    )
  },

  // POST /semesters/{semesterId}/advisor-assignments/assign: Phân công trực tiếp sinh viên cho GV
  async assignAdvisor(
    semesterId: string,
    studentPublicIds: string[],
    teacherPublicId: string,
  ): Promise<void> {
    const cleanSemesterId = semesterId && semesterId !== 'all' ? semesterId : 'current'
    await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.advisorAssignment.assign(cleanSemesterId),
      { studentPublicIds, teacherPublicId },
    )
  },

  // PUT /semesters/{semesterId}/advisor-assignments/students/{studentPublicId}/supervisor: Đổi GVHD 1
  async changeSupervisor(
    semesterId: string,
    studentPublicId: string,
    newTeacherPublicId: string,
  ): Promise<void> {
    const cleanSemesterId = semesterId && semesterId !== 'all' ? semesterId : 'current'
    await apiClient.put<ApiResponse<void>>(
      API_ENDPOINTS.advisorAssignment.changeSupervisor(cleanSemesterId, studentPublicId),
      { newTeacherPublicId },
    )
  },

  // PUT /semesters/{semesterId}/advisor-assignments/students/{studentPublicId}/co-supervisor: Đổi / Gỡ GVHD 2
  async changeCoSupervisor(
    semesterId: string,
    studentPublicId: string,
    coTeacherPublicId?: string | null,
  ): Promise<void> {
    const cleanSemesterId = semesterId && semesterId !== 'all' ? semesterId : 'current'
    await apiClient.put<ApiResponse<void>>(
      API_ENDPOINTS.advisorAssignment.changeCoSupervisor(cleanSemesterId, studentPublicId),
      { coTeacherPublicId: coTeacherPublicId || null },
    )
  },

  // PUT /semesters/{semesterId}/advisor-assignments/lock-status: Khóa / Mở khóa danh sách phân công
  async toggleLockAssignment(semesterId: string, isLocked: boolean): Promise<void> {
    const cleanSemesterId = semesterId && semesterId !== 'all' ? semesterId : 'current'
    await apiClient.put<ApiResponse<void>>(
      API_ENDPOINTS.advisorAssignment.toggleLock(cleanSemesterId),
      { isLocked },
    )
  },
  // GET /semesters/{semesterId}/advisors: Lấy danh sách GVHD trong kỳ (từ bảng semester_advisor)
  async getAssignedAdvisors(
    semesterId?: string,
    keyword?: string,
  ): Promise<SemesterAdvisorResponse[]> {
    if (!semesterId || semesterId === 'all' || semesterId === 'ALL') {
      return []
    }
    const params: Record<string, string> = {}
    if (keyword) params.keyword = keyword

    try {
      const res = await apiClient.get<ApiResponse<SemesterAdvisorResponse[]>>(
        API_ENDPOINTS.advisor.advisors(semesterId),
        {
          params,
          skipErrorToast: true,
        },
      )
      const data = res.data?.data
      if (Array.isArray(data) && data.length > 0) return data
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data as unknown as SemesterAdvisorResponse[]
      }
      if (Array.isArray(data)) return data
    } catch {
      // Fallback bên dưới
    }

    return []
  },

  async getSupervisors(
    semesterId?: string,
    keyword?: string,
    managedMajorName?: string,
  ): Promise<SupervisorLecturer[]> {
    if (!semesterId || semesterId === 'all') {
      return []
    }

    try {
      const [advisors, studentsPage, fetchedMajor] = await Promise.all([
        supervisorService.getAssignedAdvisors(semesterId, keyword),
        studentService
          .getStudents(
            { semesterId, page: 0, size: 100 },
            { skipErrorToast: true },
          )
          .catch(() => ({ content: [] })),
        managedMajorName ? Promise.resolve(null) : teacherService.getManagedMajor().catch(() => null),
      ])

      const finalMajorName = managedMajorName || fetchedMajor?.name || ''

      if (advisors.length > 0) {
        return advisors.map((item) =>
          toSupervisorLecturerFromAdvisor(item, studentsPage.content, '', '', finalMajorName),
        )
      }
    } catch {
      // Bỏ qua lỗi
    }

    return []
  },

  async getStudents(semesterId?: string): Promise<SupervisorStudent[]> {
    const resolvedSemesterId = semesterId === 'all' ? undefined : semesterId
    if (!resolvedSemesterId) return []

    try {
      const [studentsPage, teachersPage] = await Promise.all([
        studentService.getStudents(
          { semesterId: resolvedSemesterId, page: 0, size: 100 },
          { skipErrorToast: true },
        ),
        teacherService.getTeachers(
          { semesterId: resolvedSemesterId, isAssigned: true, page: 0, size: 100 },
          { skipErrorToast: true },
        ),
      ])
      return studentsPage.content.map((s) =>
        toSupervisorStudent(s, teachersPage.content),
      )
    } catch {
      return []
    }
  },

  // GET /semesters/{semesterId}/advisor-quotas: Lấy thiết lập hạn mức theo chức danh của học kỳ
  async getAdvisorQuotas(semesterId?: string): Promise<TitleQuotaConfig[]> {
    const cleanSemesterId =
      semesterId && semesterId !== 'all' ? semesterId : 'current'

    try {
      const res = await apiClient.get<ApiResponse<any[]>>(
        API_ENDPOINTS.advisor.quotas(cleanSemesterId),
        { skipErrorToast: true },
      )
      const data = res.data?.data
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item, idx) => {
          const academicTitleId = item.academicTitleId || item.id || idx + 1
          const titleCode = item.titleCode || item.code || ''
          const defaultMatch =
            DEFAULT_TITLE_QUOTAS.find(
              (d) =>
                d.academicTitleId === academicTitleId ||
                (titleCode && d.titleCode === titleCode),
            ) || DEFAULT_TITLE_QUOTAS[idx]
          const titleName =
            item.titleName || item.title || defaultMatch?.titleName || ''
          const academicTitle =
            item.academicTitle || item.shortTitle || defaultMatch?.academicTitle || ''
          const internalQuota =
            typeof item.internalQuota === 'number'
              ? item.internalQuota
              : typeof item.internal === 'number'
                ? item.internal
                : null
          const externalQuota =
            typeof item.externalQuota === 'number'
              ? item.externalQuota
              : typeof item.external === 'number'
                ? item.external
                : null

          return {
            id: academicTitleId,
            academicTitleId,
            code: titleCode || defaultMatch?.titleCode || '',
            titleCode: titleCode || defaultMatch?.titleCode || '',
            title: titleName || titleCode || 'Chức danh',
            titleName: titleName || titleCode || 'Chức danh',
            shortTitle: academicTitle || titleName,
            academicTitle: academicTitle || titleName,
            internal: internalQuota,
            external: externalQuota,
            internalQuota,
            externalQuota,
          }
        })
      }
    } catch {
      // Dùng danh mục mặc định
    }

    return DEFAULT_TITLE_QUOTAS
  },

  // PUT /semesters/{semesterId}/advisor-quotas: Lưu thiết lập hạn mức theo chức danh cho cả học kỳ
  async saveAdvisorQuotas(quotas: TitleQuotaConfig[], semesterId?: string): Promise<void> {
    const cleanSemesterId =
      semesterId && semesterId !== 'all' ? semesterId : 'current'

    const payload = quotas.map((q, idx) => {
      const academicTitleId =
        q.academicTitleId || (typeof q.id === 'number' ? q.id : idx + 1)
      const titleCode = q.titleCode || q.code || ''
      const titleName = q.titleName || q.title || ''
      const academicTitle = q.academicTitle || q.shortTitle || ''
      const internalQuota =
        typeof q.internal === 'number' && !isNaN(q.internal) ? q.internal : null
      const externalQuota =
        typeof q.external === 'number' && !isNaN(q.external) ? q.external : null

      return {
        academicTitleId,
        titleCode,
        titleName,
        academicTitle,
        internalQuota,
        externalQuota,
      }
    })

    await apiClient.put<ApiResponse<unknown>>(
      API_ENDPOINTS.advisor.quotas(cleanSemesterId),
      payload,
    )
  },

  getTitleQuotas(): TitleQuotaConfig[] {
    return DEFAULT_TITLE_QUOTAS
  },

  saveTitleQuotas(data: TitleQuotaConfig[]): void {
    void this.saveAdvisorQuotas(data)
  },

  // PUT /semesters/{semesterId}/advisors/{teacherId}/quota: Chỉnh sửa hạn mức (maxStudents) cho 1 GVHD cụ thể trong kỳ
  async updateLecturerQuota(
    params:
      | {
          teacherOrAdvisorId: string | number
          quota: number
          semesterId?: string
        }
      | string
      | number,
    quotaParam?: number,
    semesterIdParam?: string,
  ): Promise<string> {
    let teacherOrAdvisorId: string | number
    let quota: number
    let semesterId: string | undefined

    if (typeof params === 'object') {
      teacherOrAdvisorId = params.teacherOrAdvisorId
      quota = params.quota
      semesterId = params.semesterId
    } else {
      teacherOrAdvisorId = params
      quota = quotaParam ?? 1
      semesterId = semesterIdParam
    }

    const payload = { maxStudents: quota }
    const cleanSemesterId =
      semesterId && semesterId !== 'all' ? semesterId : 'current'

    const url = API_ENDPOINTS.advisor.updateQuota(cleanSemesterId, teacherOrAdvisorId)
    const res = await apiClient.put<ApiResponse<unknown>>(url, payload)
    return res.data?.message || 'Cập nhật hạn mức thành công'
  },

  // DELETE /semesters/{semesterId}/advisors/{teacherId}: Xóa/loại bỏ giảng viên khỏi danh sách GVHD của học kỳ
  async removeAdvisor(
    semesterId: string,
    teacherOrAdvisorId: string | number,
  ): Promise<void> {
    const cleanSemesterId =
      semesterId && semesterId !== 'all' ? semesterId : 'current'
    await apiClient.delete<ApiResponse<void>>(
      API_ENDPOINTS.advisor.removeAdvisor(cleanSemesterId, teacherOrAdvisorId),
    )
  },
}
