import { useState, useMemo, useEffect } from 'react'
import { Plus, Upload, UserCheck } from 'lucide-react'
import { Button } from '@/shared/components/ui'
import { useDebounce } from '@/shared/hooks'
import { useMajors } from '@/features/department/student_management'
import type { SpringPage } from '@/shared/types'
import { AssignAdvisorsDialog } from '../components/AssignAdvisorsDialog'
import { CreateTeacherDialog } from '../components/CreateTeacherDialog'
import { ImportTeacherDialog } from '../components/ImportTeacherDialog'
import { TeacherDetailDialog } from '../components/TeacherDetailDialog'
import { TeacherTable } from '../components/TeacherTable'
import { SemesterScopeFilter } from '../components/SemesterScopeFilter'
import { getTeacherId } from '../utils/teacherDisplay'
import { TeacherToolbar } from '../components/TeacherToolbar'
import { useManagedMajor, useAllTeachers } from '../hooks/useTeachers'
import { useSemesterScope } from '../hooks/useSemesterScope'
import type { TeacherSort, TeacherSortField, TeacherListItem } from '../types'
import {
  DEFAULT_TEACHER_FILTERS,
  toOrganizationParams,
  type TeacherFilters,
} from '../utils/teacherFilters'

// Khớp giao diện 15 dòng/trang
const DEFAULT_PAGE_SIZE = 15
const SEARCH_DEBOUNCE_MS = 400

export default function LecturerManagementPage() {
  const [filters, setFilters] = useState<TeacherFilters>(DEFAULT_TEACHER_FILTERS)
  // Trang hiện tại tính từ 0 giống Spring Pageable; hiển thị cho người dùng thì +1
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [sort, setSort] = useState<TeacherSort | undefined>()
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)

  // Chờ người dùng ngừng gõ 400ms mới gọi API tìm kiếm
  const keyword = useDebounce((filters.keyword ?? filters.name ?? '').trim(), SEARCH_DEBOUNCE_MS)

  const {
    academicYears,
    termsOfYear,
    selectedYear,
    selectedSemesterId,
    activeSemesterId,
    activeSemester,
    isLoading: semestersLoading,
    onYearChange,
    onSemesterChange,
  } = useSemesterScope()
  const { data: managedMajor } = useManagedMajor()
  const { data: majors, isPending: majorsLoading } = useMajors()
  const tbmMajor = managedMajor?.name ?? majors?.find((m) => m.publicId === filters.majorId)?.name ?? majors?.[0]?.name

  const [hasInitializedMajor, setHasInitializedMajor] = useState(false)

  // Mới vào trang tự động gán bộ lọc ngành theo ngành phụ trách của Trưởng bộ môn
  useEffect(() => {
    if (!hasInitializedMajor && managedMajor) {
      const targetPublicId =
        managedMajor.publicId ||
        majors?.find((m) => m.name.toLowerCase() === managedMajor.name?.toLowerCase())?.publicId

      if (targetPublicId) {
        setFilters((prev) => {
          if (!prev.majorId) {
            return {
              ...prev,
              majorId: targetPublicId,
              majorName: managedMajor.name || '',
            }
          }
          return prev
        })
        setHasInitializedMajor(true)
      }
    }
  }, [managedMajor, majors, hasInitializedMajor])

  // Khi chọn 'all' năm học hoặc học kỳ: không truyền semesterId cụ thể
  const isAllScope = selectedSemesterId === 'all' || selectedYear === 'all'
  const querySemesterId = isAllScope ? undefined : (selectedSemesterId || activeSemesterId)

  // Bộ lọc trạng thái phân công:
  // - undefined: "Tất cả trạng thái" (hiển thị đầy đủ cả Đã phân công và Chưa phân công)
  // - false: "Chưa phân công"
  // - true: "Đã phân công"
  const effectiveIsAssigned = filters.isAssigned

  // Gọi API /teacher/all lấy toàn bộ danh sách giáo viên hệ thống không phân trang
  const {
    data: rawTeachers = [],
    isPending,
    isError,
    isPlaceholderData,
  } = useAllTeachers({
    semesterId: querySemesterId,
    keyword: keyword || undefined,
    name: keyword || undefined,
    majorId: filters.majorId || undefined,
    unitType: filters.unitType || undefined,
    ...toOrganizationParams(filters.organization),
    majorName: filters.majorName || undefined,
    isAssigned: effectiveIsAssigned,
  })

  // Lọc danh sách và sắp xếp
  const filteredList = useMemo(() => {
    if (!rawTeachers) return []
    let list = rawTeachers

    // Lọc theo trạng thái phân công (nếu người dùng chọn cụ thể Chưa phân công hoặc Đã phân công)
    if (filters.isAssigned !== undefined) {
      list = list.filter((t) =>
        filters.isAssigned
          ? t.isAssigned === true || t.assignmentStatus === 'Đã phân công'
          : t.isAssigned !== true && t.assignmentStatus !== 'Đã phân công',
      )
    }

    if (sort) {
      const [field, order] = (sort as string).split(',') as [TeacherSortField, 'asc' | 'desc']
      list = [...list].sort((a, b) => {
        const valA = (a as any)[field] ?? ''
        const valB = (b as any)[field] ?? ''
        if (typeof valA === 'string' && typeof valB === 'string') {
          return order === 'asc'
            ? valA.localeCompare(valB, 'vi')
            : valB.localeCompare(valA, 'vi')
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return order === 'asc' ? valA - valB : valB - valA
        }
        return 0
      })
    }

    return list
  }, [rawTeachers, filters.isAssigned, sort])

  // Phân trang phía giao diện (Client-side pagination)
  const totalElements = filteredList.length
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize))
  const currentPage = Math.min(page, Math.max(0, totalPages - 1))

  const pagedContent = useMemo(() => {
    return filteredList.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
  }, [filteredList, currentPage, pageSize])

  const displayData = useMemo<SpringPage<TeacherListItem>>(() => {
    return {
      content: pagedContent,
      totalElements,
      totalPages,
      number: currentPage,
      size: pageSize,
      numberOfElements: pagedContent.length,
      first: currentPage === 0,
      last: currentPage >= totalPages - 1,
      empty: filteredList.length === 0,
      page: {
        number: currentPage,
        size: pageSize,
        totalElements,
        totalPages,
      },
    }
  }, [pagedContent, currentPage, pageSize, totalElements, totalPages, filteredList.length])

  const selectedTeachers = useMemo(() => {
    if (!filteredList) return []
    return filteredList.filter((t, idx) => {
      const rawId = getTeacherId(t)
      const id = typeof rawId === 'number' ? rawId : t.id ?? idx + 1
      return selectedIds.has(id)
    })
  }, [filteredList, selectedIds])

  const filtered = useMemo(() => {
    const isKeyword = Boolean((filters.keyword ?? filters.name ?? '').trim())
    const isOrg = filters.organization !== ''
    const isUnit = Boolean(filters.unitType) && filters.unitType !== 'ALL'
    const isAssigned = filters.isAssigned !== undefined
    const isMajorDifferent = managedMajor?.publicId
      ? filters.majorId !== managedMajor.publicId
      : Boolean(filters.majorId)
    return isKeyword || isOrg || isUnit || isAssigned || isMajorDifferent
  }, [filters, managedMajor])

  // Đổi bất kỳ bộ lọc nào → quay về trang đầu
  const updateFilters = (patch: Partial<TeacherFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }))
    setPage(0)
  }

  const resetFilters = () => {
    const defaultMajorId = managedMajor?.publicId || ''
    const defaultMajorName = managedMajor?.name || ''
    setFilters({
      ...DEFAULT_TEACHER_FILTERS,
      majorId: defaultMajorId,
      majorName: defaultMajorName,
    })
    setSort(undefined)
    setPage(0)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(0)
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = (selected: boolean) => {
    if (!selected || !displayData) {
      setSelectedIds(new Set())
    } else {
      const ids = displayData.content
        .filter((t) => !t.isAssigned)
        .map((t, idx) => {
          const rawId = getTeacherId(t)
          return typeof rawId === 'number' ? rawId : t.id ?? idx + 1
        })
        .filter(Boolean) as number[]
      setSelectedIds(new Set(ids))
    }
  }

  return (
    <div className="space-y-4">
      {/* Thanh hành động chính trên đầu: Bộ lọc Năm học & Học kỳ (trái), 3 nút thao tác (phải) - Không có tiêu đề h1 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SemesterScopeFilter
          selectedYear={selectedYear}
          selectedSemesterId={selectedSemesterId}
          academicYears={academicYears}
          termsOfYear={termsOfYear}
          isLoading={semestersLoading}
          onYearChange={(y) => {
            onYearChange(y)
            setPage(0)
          }}
          onSemesterChange={(s) => {
            onSemesterChange(s)
            setPage(0)
          }}
        />

        <div className="flex items-center gap-2.5 flex-wrap ml-auto">
          {/* Nút màu xanh lá: Phân công làm GVHD (x) */}
          <Button
            type="button"
            disabled={selectedIds.size === 0}
            onClick={() => setAssignOpen(true)}
            className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
          >
            <UserCheck className="w-4 h-4 mr-1.5" />
            Phân công làm GVHD ({selectedIds.size})
          </Button>

          {/* Nút Import file Excel */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setImportOpen(true)}
            className="h-9 px-3.5 text-xs font-semibold text-slate-700 shadow-2xs"
          >
            <Upload className="w-4 h-4 mr-1.5 text-slate-500" />
            Import File
          </Button>

          {/* Nút Thêm giảng viên thủ công */}
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="h-9 px-4 bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Thêm giảng viên
          </Button>
        </div>
      </div>

      {/* Thanh tìm kiếm & bộ lọc */}
      <TeacherToolbar
        filters={filters}
        onChange={updateFilters}
        onReset={resetFilters}
        showReset={filtered}
        majors={majors}
        majorsLoading={majorsLoading}
      />

      {/* Bảng danh sách giáo viên chuẩn 5 cột */}
      <TeacherTable
        data={displayData}
        isPending={isPending}
        isError={isError}
        isPlaceholderData={isPlaceholderData}
        pageSize={pageSize}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onSelectAll={selectAll}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
        onRowClick={(teacher) => setSelectedId(teacher.publicId)}
        hasFilters={filtered}
        onCreate={() => setCreateOpen(true)}
      />

      {/* Popup Phân công làm GVHD */}
      <AssignAdvisorsDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        selectedIds={Array.from(selectedIds)}
        selectedTeachers={selectedTeachers}
        semesterId={activeSemesterId}
        semesterName={activeSemester?.term || activeSemester?.name}
        academicYears={academicYears}
        termsOfYear={termsOfYear}
        selectedYear={selectedYear}
        selectedSemesterId={selectedSemesterId}
        onRemoveTeacher={toggleSelect}
        onSuccess={() => setSelectedIds(new Set())}
      />

      {/* Popup Thêm giáo viên thủ công */}
      <CreateTeacherDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        majors={majors}
        majorsLoading={majorsLoading}
        lockedMajor={tbmMajor}
      />

      {/* Popup Import file Excel */}
      <ImportTeacherDialog open={importOpen} onOpenChange={setImportOpen} />

      {/* Popup Chi tiết giảng viên khi bấm vào dòng */}
      <TeacherDetailDialog
        publicId={selectedId}
        onClose={() => setSelectedId(undefined)}
        onOpenChange={(open) => !open && setSelectedId(undefined)}
      />
    </div>
  )
}
