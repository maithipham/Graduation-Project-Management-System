import { useState, useMemo } from 'react'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useSemesterStore } from '../store/semester.store'
import {
  useSemesters,
  useUpdateSemester,
} from '../hooks/useSemesters'
import { SemesterFilterToolbar } from '../components/SemesterFilterToolbar'
import { SemesterTable } from '../components/SemesterTable'
import { SemesterFormDialog } from '../components/SemesterFormDialog'
import { SemesterConfigDialog } from '../components/SemesterConfigDialog'
import type { Semester, SemesterFormValues } from '../types/semester.types'

const PAGE_SIZE = 10

export default function SemesterListPage() {
  const {
    semesters: localSemesters,
    updateSemester,
  } = useSemesterStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null)

  // Kết nối Backend API
  const { data: apiData } = useSemesters({
    search: searchTerm || undefined,
  })
  const updateMutation = useUpdateSemester()

  // Chuyển đổi dữ liệu từ Backend sang model hiển thị của UI (hoặc fallback store)
  const displaySemesters: Semester[] = useMemo(() => {
    const rawList = Array.isArray(apiData)
      ? apiData
      : apiData && Array.isArray((apiData as any).content)
        ? (apiData as any).content
        : null

    if (rawList && rawList.length > 0) {
      return rawList.map((s: any, idx: number) => ({
        id: idx + 1,
        backendId: s.id,
        name: s.name,
        startDate: s.startDate ?? s.startTime ?? s.start_date ?? '',
        endDate: s.endDate ?? s.endTime ?? s.end_date ?? '',
        status:
          s.statusCode === 'ONGOING' || s.status === 'ACTIVE'
            ? 'active'
            : s.statusCode === 'UPCOMING' || s.status === 'UPCOMING'
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

  const handleOpenEdit = (semester: Semester) => {
    setEditingSemester(semester)
    setIsFormOpen(true)
  }

  const handleFormSubmit = async (values: SemesterFormValues, id?: number) => {
    if (!id) return
    // Tìm UUID nếu có từ API
    const target = editingSemester?.backendId
      ? editingSemester
      : displaySemesters.find((s) => s.id === id)
    const uuid = target?.backendId
    if (uuid) {
      await updateMutation.mutateAsync({
        id: uuid,
        body: {
          name: values.name,
          startDate: values.startDate,
          endDate: values.endDate,
          applyToFutureSemesters: values.applyToFutureSemesters,
        },
      })
    }
    updateSemester(id, values)
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
          onOpenConfigModal={() => setIsConfigOpen(true)}
        />

        <SemesterTable
          semesters={paginatedSemesters}
          onEditSemester={handleOpenEdit}
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

      {/* Edit Semester Dialog */}
      <SemesterFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingSemester={editingSemester}
        onSubmitSuccess={handleFormSubmit}
      />

      {/* Template Config Dialog */}
      <SemesterConfigDialog
        open={isConfigOpen}
        onOpenChange={setIsConfigOpen}
      />
    </div>
  )
}
