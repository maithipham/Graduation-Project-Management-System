import { useState, useMemo } from 'react'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from '@/shared/components/feedback/toast.store'
import { useSemesterStore } from '../store/semester.store'
import {
  useSemesters,
  useCreateSemester,
  useUpdateSemester,
} from '../hooks/useSemesters'
import { SemesterFilterToolbar } from '../components/SemesterFilterToolbar'
import { SemesterTable } from '../components/SemesterTable'
import { SemesterFormDialog } from '../components/SemesterFormDialog'
import type { Semester, SemesterFormValues } from '../types/semester.types'

const PAGE_SIZE = 10

export default function SemesterListPage() {
  const {
    semesters: localSemesters,
    addSemester,
    updateSemester,
    activateSemester,
  } = useSemesterStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null)

  // Kết nối Backend API
  const { data: apiData } = useSemesters({
    search: searchTerm || undefined,
  })
  const createMutation = useCreateSemester()
  const updateMutation = useUpdateSemester()

  // Chuyển đổi dữ liệu từ Backend sang model hiển thị của UI (hoặc fallback store)
  const displaySemesters: Semester[] = useMemo(() => {
    if (apiData && apiData.content && apiData.content.length > 0) {
      return apiData.content.map((s, idx) => ({
        id: idx + 1,
        name: s.name,
        startDate: s.startDate,
        endDate: s.endDate,
        status:
          s.statusCode === 'ONGOING'
            ? 'active'
            : s.statusCode === 'UPCOMING'
              ? 'upcoming'
              : 'ended',
      }))
    }
    return localSemesters
  }, [apiData, localSemesters])

  // Filter list
  const filteredSemesters = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return displaySemesters.filter((sem) => {
      const matchSearch = !term || sem.name.toLowerCase().includes(term)
      const matchStatus = !selectedStatus || sem.status === selectedStatus
      return matchSearch && matchStatus
    })
  }, [displaySemesters, searchTerm, selectedStatus])

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredSemesters.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE
  const paginatedSemesters = filteredSemesters.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  )

  const handleOpenAdd = () => {
    setEditingSemester(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (semester: Semester) => {
    setEditingSemester(semester)
    setIsFormOpen(true)
  }

  const handleFormSubmit = async (values: SemesterFormValues, id?: number) => {
    try {
      if (id) {
        updateSemester(id, values)
        // Tìm UUID nếu có từ API
        const matched = apiData?.content[id - 1]
        if (matched?.id) {
          await updateMutation.mutateAsync({
            id: matched.id,
            body: {
              name: values.name,
              startDate: values.startDate,
              endDate: values.endDate,
            },
          })
        }
      } else {
        addSemester(values)
        await createMutation.mutateAsync({
          name: values.name,
          startDate: values.startDate,
          endDate: values.endDate,
        })
      }
    } catch {
      // Đã được xử lý hoặc fallback cập nhật local store
    }
  }

  const handleActivate = (semester: Semester) => {
    activateSemester(semester.id)
    toast.success(`Đã kích hoạt học kỳ "${semester.name}" thành công!`)
  }

  return (
    <div className="space-y-6">
      {/* Main Table Card */}
      <Card className="overflow-visible border-slate-200 shadow-xs">
        <SemesterFilterToolbar
          searchTerm={searchTerm}
          onSearchChange={(v) => {
            setSearchTerm(v)
            setCurrentPage(1)
          }}
          selectedStatus={selectedStatus}
          onStatusChange={(s) => {
            setSelectedStatus(s)
            setCurrentPage(1)
          }}
          totalCount={filteredSemesters.length}
          onOpenAddModal={handleOpenAdd}
        />

        <SemesterTable
          semesters={paginatedSemesters}
          onEditSemester={handleOpenEdit}
          onActivateSemester={handleActivate}
        />

        {/* Pagination Footer */}
        <div className="flex items-center justify-center px-4 py-3 bg-white border-t border-slate-200">
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline ml-1">Trước</span>
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    page === safeCurrentPage
                      ? 'bg-[#1565C0] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={safeCurrentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-2 text-xs"
            >
              <span className="hidden sm:inline mr-1">Sau</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Add / Edit Dialog */}
      <SemesterFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingSemester={editingSemester}
        onSubmitSuccess={handleFormSubmit}
      />
    </div>
  )
}
