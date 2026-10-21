import type { TeacherListParams, TeacherOrganizationType } from '../types'

/** Bộ lọc đơn vị trên giao diện: '' = tất cả đơn vị */
export type OrganizationFilter = '' | TeacherOrganizationType

/** Giá trị bộ lọc trên giao diện. Chuỗi rỗng = không lọc (không gửi lên BE) */
export interface TeacherFilters {
  name: string
  organization: OrganizationFilter
  majorName: string
}

export const DEFAULT_TEACHER_FILTERS: TeacherFilters = {
  name: '',
  organization: '',
  majorName: '',
}

export const ORGANIZATION_OPTIONS = [
  { value: 'internal', label: 'Trong trường' },
  { value: 'external', label: 'Ngoài trường' },
] as const satisfies readonly { value: OrganizationFilter; label: string }[]

/**
 * Đổi lựa chọn sang tham số GET /teacher: gửi thẳng organizationType = internal / external,
 * BE tự đổi sang điều kiện trên tên trường. Tất cả đơn vị → không gửi
 */
export function toOrganizationParams(
  organization: OrganizationFilter,
): Pick<TeacherListParams, 'organizationType'> {
  return organization ? { organizationType: organization } : {}
}

export function hasActiveTeacherFilters(filters: TeacherFilters): boolean {
  return (
    filters.name.trim() !== '' ||
    filters.organization !== DEFAULT_TEACHER_FILTERS.organization ||
    filters.majorName !== DEFAULT_TEACHER_FILTERS.majorName
  )
}
