import type { CandidateTeacher, TeacherScope } from '../types'

export type TeacherScopeFilter = TeacherScope

export const TEACHER_SCOPE_OPTIONS: Array<{ value: TeacherScopeFilter; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'IN_MAJOR', label: 'Trong bộ môn' },
  { value: 'OUT_MAJOR', label: 'Ngoài bộ môn' },
  { value: 'EXTERNAL', label: 'Ngoài trường' },
]

export function matchTeacherScope(t: CandidateTeacher, scope: TeacherScopeFilter): boolean {
  return scope === 'ALL' || t.scope === scope
}

/** Thứ tự hiển thị: Trong bộ môn → Ngoài bộ môn → Ngoài trường */
export function teacherScopeOrder(t: CandidateTeacher): number {
  if (t.scope === 'IN_MAJOR') return 1
  if (t.scope === 'OUT_MAJOR') return 2
  if (t.scope === 'EXTERNAL') return 3
  return 4
}
