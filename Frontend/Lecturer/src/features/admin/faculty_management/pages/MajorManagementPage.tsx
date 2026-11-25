import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  useFaculties,
  useCreateFaculty,
  useUpdateFaculty,
  useAddMajorToFaculty,
  useUpdateMajor,
} from '../hooks/useFaculties'
import { FacultyListView } from '../components/FacultyListView'
import { FacultyDetailView } from '../components/FacultyDetailView'
import { FacultyFormDialog } from '../components/FacultyFormDialog'
import { MajorFormDialog } from '../components/MajorFormDialog'
import type {
  Faculty,
  FacultyFormValues,
  Major,
  MajorFormValues,
} from '../types/faculty.types'

export default function MajorManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const facultyParam = searchParams.get('facultyId')
  const selectedFacultyId = facultyParam ? Number(facultyParam) : null

  const setSelectedFacultyId = (id: number | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (id !== null) {
        next.set('facultyId', String(id))
      } else {
        next.delete('facultyId')
      }
      return next
    })
  }

  // Query Backend
  const { data: apiFaculties } = useFaculties()
  const createFacultyMutation = useCreateFaculty()
  const updateFacultyMutation = useUpdateFaculty()
  const addMajorMutation = useAddMajorToFaculty()
  const updateMajorMutation = useUpdateMajor()

  // Danh sách khoa lấy hoàn toàn từ server
  const faculties: Faculty[] = useMemo(() => {
    if (apiFaculties && apiFaculties.content && apiFaculties.content.length > 0) {
      return apiFaculties.content.map((f, idx) => ({
        id: idx + 1,
        backendId: f.id,
        code: f.code,
        name: f.name,
        // API danh sách không trả mô tả; mô tả thật lấy từ GET /faculty/{id} ở màn chi tiết
        description: '',
        status: f.statusCode === 'ACTIVE' ? 'active' : 'inactive',
        majors: [],
        totalMajors: f.totalMajors,
      }))
    }
    return []
  }, [apiFaculties])

  // Dialog states
  const [isFacultyFormOpen, setIsFacultyFormOpen] = useState(false)
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null)

  const [isMajorFormOpen, setIsMajorFormOpen] = useState(false)
  const [editingMajor, setEditingMajor] = useState<Major | null>(null)

  const selectedFaculty =
    faculties.find((f) => f.id === selectedFacultyId) || null

  const handleOpenAddFaculty = () => {
    setEditingFaculty(null)
    setIsFacultyFormOpen(true)
  }

  const handleOpenEditFaculty = (faculty: Faculty) => {
    setEditingFaculty(faculty)
    setIsFacultyFormOpen(true)
  }

  const handleFacultyFormSubmit = async (values: FacultyFormValues, id?: number) => {
    if (id) {
      const target = editingFaculty?.backendId
        ? editingFaculty
        : faculties.find((f) => f.id === id)
      const uuid = target?.backendId || apiFaculties?.content[id - 1]?.id
      if (uuid) {
        await updateFacultyMutation.mutateAsync({
          id: uuid,
          body: {
            code: values.code,
            name: values.name,
            description: values.description,
            status: values.status === 'active' ? 'ACTIVE' : 'INACTIVE',
          },
        })
      }
    } else {
      await createFacultyMutation.mutateAsync({
        code: values.code,
        name: values.name,
        description: values.description,
        status: values.status === 'active' ? 'ACTIVE' : 'INACTIVE',
      })
    }
  }

  const handleOpenAddMajor = () => {
    setEditingMajor(null)
    setIsMajorFormOpen(true)
  }

  const handleOpenEditMajor = (major: Major) => {
    setEditingMajor(major)
    setIsMajorFormOpen(true)
  }

  const handleMajorFormSubmit = async (values: MajorFormValues, id?: number) => {
    if (!selectedFacultyId) return
    const faculty = faculties.find((f) => f.id === selectedFacultyId)
    const facultyUuid = faculty?.backendId || apiFaculties?.content[selectedFacultyId - 1]?.id
    const headTeacherIdNum = values.headTeacherId ? Number(values.headTeacherId) : null

    if (id) {
      const majorUuid = editingMajor?.backendId
      if (majorUuid) {
        await updateMajorMutation.mutateAsync({
          majorId: majorUuid,
          body: {
            code: values.code,
            name: values.name,
            headTeacherId: headTeacherIdNum,
            description: values.description,
            status: values.status === 'active' ? 'ACTIVE' : 'INACTIVE',
          },
        })
      }
    } else {
      if (facultyUuid) {
        await addMajorMutation.mutateAsync({
          facultyId: facultyUuid,
          body: {
            code: values.code,
            name: values.name,
            headTeacherId: headTeacherIdNum,
            description: values.description,
            status: values.status === 'active' ? 'ACTIVE' : 'INACTIVE',
          },
        })
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Main Content Area: Master-Detail Toggle */}
      {selectedFaculty ? (
        <FacultyDetailView
          faculty={selectedFaculty}
          onBack={() => setSelectedFacultyId(null)}
          onEditFaculty={handleOpenEditFaculty}
          onOpenAddMajor={handleOpenAddMajor}
          onEditMajor={handleOpenEditMajor}
        />
      ) : (
        <FacultyListView
          faculties={faculties}
          onSelectFaculty={(f) => setSelectedFacultyId(f.id)}
          onOpenAddModal={handleOpenAddFaculty}
        />
      )}

      {/* Faculty Dialog (Add / Edit) */}
      <FacultyFormDialog
        open={isFacultyFormOpen}
        onOpenChange={setIsFacultyFormOpen}
        editingFaculty={editingFaculty}
        existingFaculties={faculties}
        onSubmitSuccess={handleFacultyFormSubmit}
      />

      {/* Major Dialog (Add / Edit) */}
      <MajorFormDialog
        open={isMajorFormOpen}
        onOpenChange={setIsMajorFormOpen}
        facultyName={selectedFaculty?.name || ''}
        editingMajor={editingMajor}
        existingMajors={selectedFaculty?.majors || []}
        onSubmitSuccess={handleMajorFormSubmit}
      />
    </div>
  )
}
