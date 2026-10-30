import { LecturerFilterBar } from '../components/LecturerFilterBar'
import { LecturerTable } from '../components/LecturerTable'
import { useLecturerFilters } from '../hooks/useLecturerFilters'

export default function StudentLecturersPage() {
  const {
    search,
    department,
    origin,
    currentPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    paginatedLecturers,
    handleSearchChange,
    handleDepartmentChange,
    handleOriginChange,
    handlePageChange,
  } = useLecturerFilters()

  return (
    <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden">
      <LecturerFilterBar
        search={search}
        department={department}
        origin={origin}
        onSearchChange={handleSearchChange}
        onDepartmentChange={handleDepartmentChange}
        onOriginChange={handleOriginChange}
      />

      <LecturerTable
        lecturers={paginatedLecturers}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  )
}
