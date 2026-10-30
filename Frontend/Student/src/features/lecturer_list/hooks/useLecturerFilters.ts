import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  DEFAULT_DEPARTMENT,
  DEFAULT_ORIGIN,
  LECTURER_PAGE_SIZE,
  type Lecturer,
  type LecturerFilterState,
  type LecturerOriginFilter,
} from '../types/lecturer.types'
import { LECTURERS_MOCK, normalizeDepartment } from '../services/lecturer.service'

const FILTER_STORAGE_KEY = 'student_lecturer_filters_v1'

const DEFAULT_FILTER_STATE: LecturerFilterState = {
  search: '',
  department: DEFAULT_DEPARTMENT,
  origin: DEFAULT_ORIGIN,
  currentPage: 1,
}

// Đánh dấu lần nạp tài liệu đầu tiên: chỉ khôi phục sessionStorage khi F5 (reload trình duyệt),
// còn khi chuyển trang từ Sidebar trong SPA hoặc vào lại từ menu sẽ nhận giá trị lọc mặc định.
let hasConsumedInitialDocumentLoad = false

function isBrowserReload(): boolean {
  try {
    if (typeof window !== 'undefined' && typeof window.performance?.getEntriesByType === 'function') {
      const entries = window.performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
      if (entries.length > 0) {
        return entries[0].type === 'reload'
      }
    }
  } catch {
    // Ignore performance API errors
  }
  return false
}

function getInitialFilterState(): LecturerFilterState {
  if (!hasConsumedInitialDocumentLoad) {
    hasConsumedInitialDocumentLoad = true
    if (isBrowserReload()) {
      try {
        const raw = sessionStorage.getItem(FILTER_STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<{
            search: string
            dept: string
            origin: LecturerOriginFilter
            page: number
          }>
          const validOrigin: LecturerOriginFilter =
            parsed.origin === 'all' || parsed.origin === 'internal' || parsed.origin === 'external'
              ? parsed.origin
              : DEFAULT_ORIGIN
          return {
            search: typeof parsed.search === 'string' ? parsed.search : '',
            department: typeof parsed.dept === 'string' ? parsed.dept : DEFAULT_DEPARTMENT,
            origin: validOrigin,
            currentPage: typeof parsed.page === 'number' && parsed.page > 0 ? parsed.page : 1,
          }
        }
      } catch {
        // Fallback to defaults if storage parse fails
      }
    }
  }
  return DEFAULT_FILTER_STATE
}

export function useLecturerFilters(lecturers: Lecturer[] = LECTURERS_MOCK) {
  const location = useLocation()
  const [prevLocationKey, setPrevLocationKey] = useState(location.key)
  const [filters, setFilters] = useState<LecturerFilterState>(getInitialFilterState)

  // Khi bấm lại mục "Danh sách GVHD" trên Sidebar (location.key thay đổi), đặt lại bộ lọc mặc định
  if (prevLocationKey !== location.key) {
    setPrevLocationKey(location.key)
    setFilters(DEFAULT_FILTER_STATE)
  }

  // Lưu trạng thái lọc vào sessionStorage để khi nhấn F5 giữ nguyên giá trị đang chọn
  useEffect(() => {
    try {
      sessionStorage.setItem(
        FILTER_STORAGE_KEY,
        JSON.stringify({
          search: filters.search,
          dept: filters.department,
          origin: filters.origin,
          page: filters.currentPage,
        }),
      )
    } catch {
      // Ignore storage quota errors
    }
  }, [filters])

  const filteredLecturers = useMemo(() => {
    const query = filters.search.trim().toLowerCase()

    return lecturers.filter((lec) => {
      const matchSearch =
        query === '' ||
        [lec.name, lec.email, lec.department, lec.field, lec.unit].some((field) =>
          (field ?? '').toLowerCase().includes(query),
        )

      const matchDept =
        filters.department === '' ||
        normalizeDepartment(lec.department) === normalizeDepartment(filters.department)

      const lecOrigin = lec.origin || 'internal'
      const matchOrigin =
        filters.origin === 'all' ||
        (filters.origin === 'internal' && lecOrigin === 'internal') ||
        (filters.origin === 'external' && lecOrigin === 'external')

      return matchSearch && matchDept && matchOrigin
    })
  }, [lecturers, filters.search, filters.department, filters.origin])

  const totalItems = filteredLecturers.length
  const totalPages = Math.max(1, Math.ceil(totalItems / LECTURER_PAGE_SIZE))
  const safeCurrentPage = Math.min(Math.max(1, filters.currentPage), totalPages)
  const startIndex = (safeCurrentPage - 1) * LECTURER_PAGE_SIZE
  const endIndex = Math.min(startIndex + LECTURER_PAGE_SIZE, totalItems)
  const paginatedLecturers = filteredLecturers.slice(startIndex, endIndex)

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      search: value,
      currentPage: 1,
    }))
  }

  // Đồng bộ lọc Bộ môn -> Đơn vị:
  // Khi chọn bất kỳ bộ môn cụ thể nào, tự động chuyển Đơn vị về "Trong trường"
  const handleDepartmentChange = (department: string) => {
    setFilters((prev) => ({
      ...prev,
      department,
      origin: department !== '' ? 'internal' : prev.origin,
      currentPage: 1,
    }))
  }

  // Đồng bộ lọc Đơn vị -> Bộ môn:
  // - Khi chọn "Ngoài trường": Bộ môn tự động về "Tất cả bộ môn"
  // - Khi chọn lại "Trong trường" / "Tất cả đơn vị": giữ nguyên lựa chọn Bộ môn hiện tại (không tự đổi)
  const handleOriginChange = (origin: LecturerOriginFilter) => {
    setFilters((prev) => ({
      ...prev,
      origin,
      department: origin === 'external' ? '' : prev.department,
      currentPage: 1,
    }))
  }

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      currentPage: Math.min(Math.max(1, page), totalPages),
    }))
  }

  return {
    search: filters.search,
    department: filters.department,
    origin: filters.origin,
    currentPage: safeCurrentPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    paginatedLecturers,
    handleSearchChange,
    handleDepartmentChange,
    handleOriginChange,
    handlePageChange,
  }
}

