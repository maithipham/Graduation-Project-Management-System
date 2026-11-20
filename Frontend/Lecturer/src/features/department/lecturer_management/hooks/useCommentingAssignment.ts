import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback'
import { commentingLecturerService } from '../services/commentingLecturer.service'
import { useManagedMajor } from './useTeachers'
import type {
  AssignmentFilterParams,
  CommentingLecturer,
  StudentAssignment,
} from '../types/commenting.types'
import {
  filterStudentAssignments,
  getConflictingStudents,
  hasAnySupervisorConflict,
  isEligibleForCommenting,
} from '../utils/commenting.mapper'

interface UseCommentingAssignmentProps {
  semesterId: string
}

export function useCommentingAssignment({ semesterId }: UseCommentingAssignmentProps) {
  const queryClient = useQueryClient()

  // 0. Thông tin ngành do Trưởng bộ môn quản lý
  const { data: managedMajor } = useManagedMajor()
  const managedMajorName = managedMajor?.name

  // 1. Quản lý trạng thái bộ lọc sinh viên & giảng viên
  const [filters, setFilters] = useState<AssignmentFilterParams>({
    search: '',
    status: 'ALL',
    department: 'all',
    lecturerSearch: '',
    lecturerCategory: 'internal', // Mặc định tab "Trong bộ môn" như hình ảnh mẫu
    lecturerSort: 'default',
  })

  // 2. Giảng viên đang được chọn (Radio selection)
  const [selectedLecturerId, setSelectedLecturerId] = useState<number | null>(null)

  // 3. Quản lý danh sách sinh viên được tích chọn (Checkboxes)
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // 4. Trạng thái Modal xem trước phân công chia đều
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<StudentAssignment[]>([])

  // 5. Query danh sách Giảng viên nhận xét kèm số lượng đang nhận xét
  const {
    data: rawLecturers = [],
    isLoading: isLecturersLoading,
    refetch: refetchLecturers,
  } = useQuery({
    queryKey: ['commenting-lecturers', semesterId, managedMajorName],
    queryFn: () => commentingLecturerService.getCommentingLecturers(semesterId, managedMajorName),
    enabled: Boolean(semesterId && semesterId !== 'all'),
  })

  // 6. Query danh sách toàn bộ sinh viên / đề tài trong kỳ
  const {
    data: rawStudents = [],
    isLoading: isStudentsLoading,
    refetch: refetchStudents,
  } = useQuery({
    queryKey: ['commenting-students', semesterId],
    queryFn: () => commentingLecturerService.getStudents(semesterId, 'ALL'),
    enabled: Boolean(semesterId && semesterId !== 'all'),
  })

  // Đã phân công GVNX: luôn hiện. Chưa phân công: chỉ hiện khi đề tài đang thực hiện (IN_PROGRESS).
  // Số SV "đang nhận" của từng GV vẫn tính trên toàn bộ rawStudents (khối lượng thật của GV).
  const eligibleStudents = useMemo(
    () => rawStudents.filter(isEligibleForCommenting),
    [rawStudents],
  )

  // Đồng bộ số lượng SV đang nhận xét giữa bảng sinh viên và danh sách giảng viên
  const lecturers = useMemo(() => {
    const countByLecturerId = new Map<number, number>()
    const countByLecturerPublicId = new Map<string, number>()

    for (const student of rawStudents) {
      if (student.commentingLecturerId) {
        countByLecturerId.set(
          student.commentingLecturerId,
          (countByLecturerId.get(student.commentingLecturerId) || 0) + 1,
        )
      }
      if (student.commentingLecturerPublicId) {
        countByLecturerPublicId.set(
          student.commentingLecturerPublicId,
          (countByLecturerPublicId.get(student.commentingLecturerPublicId) || 0) + 1,
        )
      }
    }

    return rawLecturers.map((l) => {
      const realTimeCount =
        countByLecturerId.get(l.id) ??
        (l.publicId ? countByLecturerPublicId.get(l.publicId) : undefined)

      return {
        ...l,
        commentingStudentCount:
          realTimeCount !== undefined ? realTimeCount : l.commentingStudentCount,
      }
    })
  }, [rawLecturers, rawStudents])

  // 7. Lọc danh sách sinh viên theo bộ lọc hiện tại
  const filteredStudents = useMemo(() => {
    return filterStudentAssignments(eligibleStudents, filters)
  }, [eligibleStudents, filters])

  // 8. Lọc & Sắp xếp danh sách giảng viên theo Category tab, Search keyword, Sort order
  const filteredLecturers = useMemo(() => {
    let result = [...lecturers]

    // Lọc theo 4 tabs danh mục đơn vị: Tất cả | Trong bộ môn | Ngoài bộ môn | Ngoài trường
    const cat = filters.lecturerCategory || 'internal'
    if (cat !== 'all') {
      result = result.filter((l) => l.category === cat)
    }

    // Lọc theo từ khóa tìm kiếm (tên GV, mã, học vị, bộ môn, đơn vị công tác)
    if (filters.lecturerSearch?.trim()) {
      const q = filters.lecturerSearch.trim().toLowerCase()
      result = result.filter(
        (l) =>
          l.displayName.toLowerCase().includes(q) ||
          l.code.toLowerCase().includes(q) ||
          l.department.toLowerCase().includes(q) ||
          l.organization.toLowerCase().includes(q) ||
          l.subLabel.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q),
      )
    }

    // Sắp xếp theo số lượng đang nhận xét (ĐANG NHẬN)
    const sort = filters.lecturerSort || 'default'
    if (sort === 'asc') {
      result.sort((a, b) => a.commentingStudentCount - b.commentingStudentCount)
    } else if (sort === 'desc') {
      result.sort((a, b) => b.commentingStudentCount - a.commentingStudentCount)
    }

    return result
  }, [lecturers, filters.lecturerCategory, filters.lecturerSearch, filters.lecturerSort])

  // Tự động chọn giảng viên đầu tiên trong danh sách hiển thị nếu chưa chọn
  useEffect(() => {
    if (filteredLecturers.length > 0) {
      if (
        selectedLecturerId === null ||
        !filteredLecturers.some((l) => l.id === selectedLecturerId)
      ) {
        setSelectedLecturerId(filteredLecturers[0].id)
      }
    }
  }, [filteredLecturers, selectedLecturerId])

  // Đối tượng giảng viên đang được chọn (Radio)
  const selectedLecturer = useMemo(() => {
    return lecturers.find((l) => l.id === selectedLecturerId) || null
  }, [lecturers, selectedLecturerId])

  // Lấy các đối tượng sinh viên đang được tích chọn (Checkboxes), bỏ SV không còn đủ điều kiện sau khi tải lại
  const selectedStudents = useMemo(() => {
    const set = new Set(selectedIds)
    return eligibleStudents.filter((s) => set.has(s.id))
  }, [eligibleStudents, selectedIds])
  const eligibleSelectedIds = useMemo(() => selectedStudents.map((s) => s.id), [selectedStudents])

  // Kiểm tra xung đột BR-05 (trùng GVHD) giữa giảng viên đang chọn và bất kỳ sinh viên nào được tích chọn
  const hasSelectedConflict = useMemo(() => {
    if (!selectedLecturer || selectedStudents.length === 0) return false
    return hasAnySupervisorConflict(selectedStudents, selectedLecturer)
  }, [selectedLecturer, selectedStudents])

  const conflictingStudents = useMemo(() => {
    if (!selectedLecturer || selectedStudents.length === 0) return []
    return getConflictingStudents(selectedStudents, selectedLecturer)
  }, [selectedLecturer, selectedStudents])

  // Thống kê số lượng
  const stats = useMemo(() => {
    const total = eligibleStudents.length
    const unassigned = eligibleStudents.filter((s) => s.status === 'UNASSIGNED').length
    const assigned = eligibleStudents.filter((s) => s.status === 'ASSIGNED').length
    return { total, unassigned, assigned }
  }, [eligibleStudents])

  // Invalidate cache
  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['commenting-lecturers', semesterId] })
    queryClient.invalidateQueries({ queryKey: ['commenting-students', semesterId] })
  }

  // 9. Mutation: Phân công thủ công 1 giảng viên cho danh sách sinh viên được chọn
  const manualAssignMutation = useMutation({
    mutationFn: async (lecturer: CommentingLecturer) => {
      if (!eligibleSelectedIds.length) {
        throw new Error('Vui lòng chọn ít nhất một sinh viên')
      }

      // Kiểm tra xung đột logic BR-05 (trùng GVHD)
      const conflicts = getConflictingStudents(selectedStudents, lecturer)
      if (conflicts.length > 0) {
        const conflictNames = conflicts.map((s) => `${s.studentName} (${s.studentCode})`).join(', ')
        throw new Error(
          `Không thể phân công: ${lecturer.displayName} là GVHD của các sinh viên: ${conflictNames}`,
        )
      }

      await commentingLecturerService.assignManual({
        commentingLecturerId: lecturer.id,
        commentingLecturerPublicId: lecturer.publicId,
        studentOrTopicIds: eligibleSelectedIds,
      })
    },
    onSuccess: (_, lecturer) => {
      toast.success(
        `Đã phân công thành công ${eligibleSelectedIds.length} sinh viên cho ${lecturer.displayName}`,
      )
      setSelectedIds([])
      invalidateQueries()
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Phân công thất bại'
      toast.error(msg)
    },
  })

  // Hàm gán cho giảng viên đang được chọn (Radio)
  const handleAssignCurrentSelection = () => {
    if (!selectedLecturer) {
      toast.error('Vui lòng chọn một giảng viên nhận xét ở bảng bên phải')
      return
    }
    if (eligibleSelectedIds.length === 0) {
      toast.error('Vui lòng tích chọn ít nhất một sinh viên ở bảng bên trái')
      return
    }
    if (hasSelectedConflict) {
      const conflictCodes = conflictingStudents.map((s) => s.studentCode).join(', ')
      toast.error(`Xung đột BR-05: ${selectedLecturer.displayName} là GVHD của: ${conflictCodes}`)
      return
    }
    manualAssignMutation.mutate(selectedLecturer)
  }

  // 10. Mutation: Tạo bản xem trước (Preview) phân công chia đều
  const previewAutoDistributeMutation = useMutation({
    mutationFn: async () => {
      return await commentingLecturerService.autoDistribute({
        semesterId,
        departmentId: managedMajor?.publicId,
        preview: true,
      })
    },
    onSuccess: (data) => {
      setPreviewData(data)
      setIsPreviewOpen(true)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Không thể tạo bản xem trước'
      toast.error(msg)
    },
  })

  // 11. Mutation: Xác nhận lưu phân công chia đều vào CSDL
  const confirmAutoDistributeMutation = useMutation({
    mutationFn: async () => {
      await commentingLecturerService.autoDistribute({
        semesterId,
        departmentId: managedMajor?.publicId,
        preview: false,
      })
    },
    onSuccess: () => {
      toast.success('Phân công nhanh (chia đều) thành công!')
      setIsPreviewOpen(false)
      setSelectedIds([])
      invalidateQueries()
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Lưu phân công thất bại'
      toast.error(msg)
    },
  })

  // Thao tác chọn checkbox sinh viên
  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleSelectAllVisible = (checked: boolean) => {
    if (checked) {
      const ids = filteredStudents.map((s) => s.id)
      setSelectedIds(Array.from(new Set([...selectedIds, ...ids])))
    } else {
      const visibleIdSet = new Set(filteredStudents.map((s) => s.id))
      setSelectedIds((prev) => prev.filter((id) => !visibleIdSet.has(id)))
    }
  }

  const handleClearSelection = () => {
    setSelectedIds([])
  }

  return {
    filters,
    setFilters,
    selectedIds: eligibleSelectedIds,
    selectedStudents,
    selectedLecturerId,
    setSelectedLecturerId,
    selectedLecturer,
    hasSelectedConflict,
    conflictingStudents,
    lecturers: filteredLecturers,
    allLecturers: lecturers,
    students: filteredStudents,
    stats,
    isLoading: isLecturersLoading || isStudentsLoading,
    isAssigningManual: manualAssignMutation.isPending,
    isPreviewLoading: previewAutoDistributeMutation.isPending,
    isConfirmingAutoDistribute: confirmAutoDistributeMutation.isPending,
    isPreviewOpen,
    setIsPreviewOpen,
    previewData,
    handleToggleSelect,
    handleSelectAllVisible,
    handleClearSelection,
    handleAssignManual: manualAssignMutation.mutate,
    handleAssignCurrentSelection,
    handlePreviewAutoDistribute: previewAutoDistributeMutation.mutate,
    handleConfirmAutoDistribute: confirmAutoDistributeMutation.mutate,
    refetch: () => {
      refetchLecturers()
      refetchStudents()
    },
  }
}
