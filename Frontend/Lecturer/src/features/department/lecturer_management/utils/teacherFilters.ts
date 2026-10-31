import type {
  TeacherListParams,
  TeacherOrganizationType,
  UnitTypeFilter,
} from '../types'

/** Bộ lọc đơn vị trên giao diện: '' = tất cả đơn vị */
export type OrganizationFilter = '' | TeacherOrganizationType

/** Giá trị bộ lọc trên giao diện. Chuỗi rỗng = không lọc (không gửi lên BE) */
export interface TeacherFilters {
  keyword?: string
  name: string
  organization: OrganizationFilter
  majorName: string
  majorId?: string
  unitType?: UnitTypeFilter
  isAssigned?: boolean
}

export const DEFAULT_TEACHER_FILTERS: TeacherFilters = {
  keyword: '',
  name: '',
  organization: '',
  majorName: '',
  majorId: '',
  unitType: '',
  isAssigned: undefined,
}

export const ORGANIZATION_OPTIONS = [
  { value: 'internal', label: 'Trong trường' },
  { value: 'external', label: 'Ngoài trường' },
] as const satisfies readonly { value: OrganizationFilter; label: string }[]

export const UNIT_TYPE_OPTIONS = [
  { value: '', label: 'Tất cả đơn vị' },
  { value: 'INTERNAL', label: 'Trong trường' },
  { value: 'EXTERNAL', label: 'Ngoài trường' },
] as const

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
    Boolean(filters.keyword?.trim()) ||
    Boolean(filters.name?.trim()) ||
    filters.organization !== '' ||
    filters.majorName !== '' ||
    Boolean(filters.majorId) ||
    (Boolean(filters.unitType) && filters.unitType !== 'ALL') ||
    (filters.isAssigned !== undefined && filters.isAssigned !== false)
  )
}
