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
    quota: typeof t.amount === 'number' ? t.amount : 0,
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
      : typeof teacher?.amount === 'number'
        ? teacher.amount
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
    category: isInternal ? 'internal' : 'univ_ext',
    categoryLabel: isInternal ? 'Trong bộ môn' : 'Ngoài trường',
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

  let status: 'received' | 'unassigned' | 'approved' = 'unassigned'
  if (!s.lecturerName) {
    status = 'unassigned'
  } else if (s.topicName) {
    status = 'approved'
  } else {
    status = 'received'
  }

  return {
    id: s.publicId,
    code: s.studentCode,
    name: s.name,
    className: s.className,
    topic: s.topicName || '',
    supervisorId: matchedSupervisor?.publicId || null,
    supervisorName: s.lecturerName || null,
    supervisor2Id: null,
    supervisor2Name: s.coLecturerName || null,
    assignedTime: null,
    status,
    year,
    semester: semesterName,
  }
}

export const supervisorService = {
  // GET /semesters/{semesterId}/advisors hoặc /advisors: Lấy danh sách GVHD trong kỳ (từ bảng semester_advisor)
  async getAssignedAdvisors(
    semesterId?: string,
    keyword?: string,
  ): Promise<SemesterAdvisorResponse[]> {
    const isSpecificSemester = Boolean(semesterId && semesterId !== 'all' && semesterId !== 'ALL')
    const params: Record<string, string> = {}
    if (keyword) params.keyword = keyword
    if (isSpecificSemester && semesterId) {
      params.semesterId = semesterId
    }

    // Thứ tự endpoint thử nghiệm (ưu tiên /advisors?semesterId=... để tránh lỗi 405 Method Not Allowed trên /semesters/{id}/advisors)
    const urlsToTry: string[] = [
      '/advisors',
      ...(isSpecificSemester
        ? [`/semester/${semesterId}/advisors`, `/semesters/${semesterId}/advisors`]
        : []),
    ]

    for (const url of urlsToTry) {
      try {
        const res = await apiClient.get<ApiResponse<SemesterAdvisorResponse[]>>(url, {
          params,
          skipErrorToast: true,
        })
        const data = res.data?.data
        if (Array.isArray(data) && data.length > 0) return data
        if (Array.isArray(res.data) && res.data.length > 0) {
          return res.data as unknown as SemesterAdvisorResponse[]
        }
        if (Array.isArray(data)) return data
      } catch {
        continue
      }
    }

    return []
  },

  async getSupervisors(semesterId?: string, keyword?: string): Promise<SupervisorLecturer[]> {
    const resolvedSemesterId = semesterId === 'all' ? undefined : semesterId

    try {
      const [advisors, studentsPage] = await Promise.all([
        supervisorService.getAssignedAdvisors(resolvedSemesterId, keyword),
        resolvedSemesterId
          ? studentService
              .getStudents(
                { semesterId: resolvedSemesterId, page: 0, size: 100 },
                { skipErrorToast: true },
              )
              .catch(() => ({ content: [] }))
          : Promise.resolve({ content: [] }),
      ])

      if (advisors.length > 0) {
        return advisors.map((item) =>
          toSupervisorLecturerFromAdvisor(item, studentsPage.content),
        )
      }
    } catch {
      // Bỏ qua lỗi, tiếp tục fallback
    }

    // Fallback: nếu /advisors chưa có dữ liệu, gọi teacherService.getTeachers với isAssigned=true
    if (resolvedSemesterId) {
      try {
        const [teachersPage, studentsPage] = await Promise.all([
          teacherService.getTeachers(
            {
              semesterId: resolvedSemesterId,
              isAssigned: true,
              keyword,
              page: 0,
              size: 100,
            },
            { skipErrorToast: true },
          ),
          studentService
            .getStudents(
              { semesterId: resolvedSemesterId, page: 0, size: 100 },
              { skipErrorToast: true },
            )
            .catch(() => ({ content: [] })),
        ])
        return teachersPage.content.map((t) =>
          toSupervisorLecturer(t, studentsPage.content),
        )
      } catch (fallbackErr) {
        console.warn('Fallback teacherService.getTeachers also failed:', fallbackErr)
      }
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

  // GET /advisor/quotas?semesterId={semesterId}: Lấy thiết lập hạn mức theo chức danh
  async getAdvisorQuotas(semesterId?: string): Promise<TitleQuotaConfig[]> {
    const cleanSemesterId =
      semesterId && semesterId !== 'all' ? semesterId : undefined

    const urlsToTry: { url: string; params?: Record<string, string> }[] = []
    if (cleanSemesterId) {
      urlsToTry.push({
        url: `/semesters/${cleanSemesterId}/advisor-quotas`,
      })
      urlsToTry.push({
        url: `/semester/${cleanSemesterId}/advisor-quotas`,
      })
      urlsToTry.push({
        url: API_ENDPOINTS.advisor.quotas,
        params: { semesterId: cleanSemesterId },
      })
    }
    urlsToTry.push({
      url: API_ENDPOINTS.advisor.quotas,
    })

    for (const { url, params } of urlsToTry) {
      try {
        const res = await apiClient.get<ApiResponse<any[]>>(url, {
          params,
          skipErrorToast: true,
        })
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
        // Tiếp tục thử fallback URL khác
      }
    }

    return DEFAULT_TITLE_QUOTAS
  },

  // PUT / POST /advisor/quotas hoặc /semesters/{semesterId}/advisor-quotas
  // Body: List<AdvisorTitleQuotaDTO>
  async saveAdvisorQuotas(quotas: TitleQuotaConfig[], semesterId?: string): Promise<void> {
    const cleanSemesterId =
      semesterId && semesterId !== 'all' ? semesterId : undefined

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

    const urlsToTry: { url: string; params?: Record<string, string> }[] = []
    if (cleanSemesterId) {
      urlsToTry.push({
        url: `/semesters/${cleanSemesterId}/advisor-quotas`,
      })
      urlsToTry.push({
        url: `/semester/${cleanSemesterId}/advisor-quotas`,
      })
      urlsToTry.push({
        url: API_ENDPOINTS.advisor.quotas,
        params: { semesterId: cleanSemesterId },
      })
    }
    urlsToTry.push({
      url: API_ENDPOINTS.advisor.quotas,
    })

    let lastError: unknown = null
    for (const { url, params } of urlsToTry) {
      try {
        await apiClient.put<ApiResponse<unknown>>(url, payload, {
          params,
          skipErrorToast: true,
        })
        return
      } catch (err) {
        lastError = err
        try {
          await apiClient.post<ApiResponse<unknown>>(url, payload, {
            params,
            skipErrorToast: true,
          })
          return
        } catch (postErr) {
          lastError = postErr
        }
      }
    }

    throw lastError
  },

  getTitleQuotas(): TitleQuotaConfig[] {
    return DEFAULT_TITLE_QUOTAS
  },

  saveTitleQuotas(data: TitleQuotaConfig[]): void {
    void this.saveAdvisorQuotas(data)
  },

  // PUT / PATCH: Chỉnh sửa hạn mức (maxStudents) cho từng GVHD cụ thể trong kỳ
  // URL: /semesters/{semesterId}/advisors/{teacherId}/quota hoặc /advisors/{advisorId}/quota
  // Body: { "maxStudents": quota }
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
      semesterId && semesterId !== 'all' ? semesterId : undefined

    const urlsToTry: string[] = []
    if (cleanSemesterId) {
      urlsToTry.push(API_ENDPOINTS.advisor.updateQuota(cleanSemesterId, teacherOrAdvisorId))
      urlsToTry.push(`/semester/${cleanSemesterId}/advisors/${teacherOrAdvisorId}/quota`)
      urlsToTry.push(`/semesters/${cleanSemesterId}/advisors/${teacherOrAdvisorId}`)
      urlsToTry.push(`/semester/${cleanSemesterId}/advisors/${teacherOrAdvisorId}`)
    }
    urlsToTry.push(API_ENDPOINTS.advisor.singleQuota(teacherOrAdvisorId))
    urlsToTry.push(`/advisors/${teacherOrAdvisorId}`)

    let lastError: unknown = null
    for (const url of urlsToTry) {
      try {
        const res = await apiClient.put<ApiResponse<unknown>>(url, payload, {
          skipErrorToast: true,
        })
        return res.data?.message || 'Cập nhật hạn mức thành công'
      } catch (err) {
        lastError = err
        try {
          const resPatch = await apiClient.patch<ApiResponse<unknown>>(url, payload, {
            skipErrorToast: true,
          })
          return resPatch.data?.message || 'Cập nhật hạn mức thành công'
        } catch (patchErr) {
          lastError = patchErr
        }
      }
    }

    throw lastError
  },
}
