import { teacherService } from './teacher.service'
import { supervisorService } from './supervisor.service'
import { studentService } from '@/features/department/student_management/services/student.service'
import type { TeacherListItem, ReviewerLecturer, ReviewerStudent } from '../types'
import type { StudentListItem } from '@/features/department/student_management/types'

export function toReviewerLecturer(t: TeacherListItem): ReviewerLecturer {
  return {
    id: t.publicId,
    name: t.academicTitle ? `${t.academicTitle} ${t.name}` : t.name,
    email: t.email,
    department: t.majorName || t.organization || '',
    isExternal: !t.isInternal,
  }
}

export function toReviewerStudent(s: StudentListItem): ReviewerStudent {
  const gvhds = [s.lecturerName, s.coLecturerName].filter(Boolean) as string[]
  return {
    id: s.publicId,
    code: s.studentCode,
    name: s.name,
    email: '',
    className: s.className,
    topic: s.topicName || '',
    gvhds,
    reviewerId: null,
    reviewerName: null,
    department: s.majorName || '',
    batch: s.batch || '',
  }
}

export const reviewerService = {
  async getStudents(semesterId?: string): Promise<ReviewerStudent[]> {
    const cleanSemesterId = semesterId === 'all' ? undefined : semesterId
    const res = await studentService.getStudents({ semesterId: cleanSemesterId, size: 100 })
    return res.content.map(toReviewerStudent)
  },

  async getLecturers(semesterId?: string): Promise<ReviewerLecturer[]> {
    const cleanSemesterId = semesterId === 'all' ? undefined : semesterId
    if (cleanSemesterId) {
      try {
        const advisors = await supervisorService.getSupervisors(cleanSemesterId)
        if (advisors.length > 0) {
          return advisors.map((a) => ({
            id: a.teacherPublicId || a.id,
            name: a.name,
            email: a.email,
            department: a.department || '',
            isExternal: a.category === 'univ_ext',
          }))
        }
      } catch {
        // Fallback
      }
    }
    const res = await teacherService.getTeachers({ page: 0, size: 100 })
    return res.content.map(toReviewerLecturer)
  },
}

