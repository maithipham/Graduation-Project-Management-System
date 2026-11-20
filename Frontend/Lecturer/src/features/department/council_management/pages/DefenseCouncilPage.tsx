import { useState, useEffect } from 'react'
import { Plus, ShieldAlert } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useMyInfo } from '@/features/auth'
import { ApiError } from '@/shared/types'
import { useMajors } from '@/features/department/student_management'
import { useSemesterScope } from '@/features/department/lecturer_management/hooks/useSemesterScope'
import { useManagedMajor } from '@/features/department/lecturer_management/hooks/useTeachers'
import { SemesterScopeFilter } from '@/features/department/lecturer_management/components/SemesterScopeFilter'
import { useDefenseCouncils } from '../hooks/useDefenseCouncils'
import { CouncilTable } from '../components/CouncilTable'
import { CreateCouncilDialog } from '../components/CreateCouncilDialog'
import { CouncilDetailDialog } from '../components/CouncilDetailDialog'
import { AssignTeachersWorkspace } from '../components/AssignTeachersWorkspace'
import { AssignStudentsWorkspace } from '../components/AssignStudentsWorkspace'
type CouncilTab = 'list' | 'members' | 'students'

const TABS: Array<{ value: CouncilTab; label: string }> = [
  { value: 'list', label: 'Danh sách hội đồng' },
  { value: 'members', label: 'Gán giảng viên vào hội đồng' },
  { value: 'students', label: 'Gán sinh viên vào hội đồng' },
]

export default function DefenseCouncilPage() {
  const { data: user } = useMyInfo()
  const isAuthorized = user?.roles
    ? user.roles.some((r) => r === 'ADMIN' || r === 'HEAD_OF_MAJOR')
    : true

  const [activeTab, setActiveTab] = useState<CouncilTab>('list')
  const [selectedCouncilId, setSelectedCouncilId] = useState<string>('')
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false)
  const [detailCouncilId, setDetailCouncilId] = useState<string | null>(null)

  // Scope: Semester & Major
  const {
    academicYears,
    termsOfYear,
    selectedYear,
    selectedSemesterId,
    isLoading: semestersLoading,
    onYearChange,
    onSemesterChange,
  } = useSemesterScope({ defaultToCurrent: true, allowAll: false })

  const { data: managedMajor } = useManagedMajor()
  const { data: majors, isPending: majorsLoading } = useMajors()

  const [selectedMajorId, setSelectedMajorId] = useState<string>('')

  useEffect(() => {
    if (managedMajor?.publicId) {
      setSelectedMajorId(managedMajor.publicId)
    } else if (majors && majors.length > 0 && !selectedMajorId) {
      setSelectedMajorId(majors[0].publicId)
    }
  }, [managedMajor, majors, selectedMajorId])

  const currentMajor =
    majors?.find((m) => m.publicId === selectedMajorId) || managedMajor
  const currentMajorCode = (currentMajor?.code || currentMajor?.name || 'KTPM')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 5)

  // Use selected IDs (publicId UUID) for queries
  const activeSemesterId = selectedSemesterId || ''
  const activeMajorId = selectedMajorId || managedMajor?.publicId || ''

  // Query Councils
  const {
    data: councilData,
    isPending: councilsLoading,
    error: councilsError,
  } = useDefenseCouncils(activeSemesterId, activeMajorId)

  const isForbiddenError =
    councilsError instanceof ApiError &&
    (councilsError.status === 403 || councilsError.code === 2001)

  const councils = councilData?.councils || []
  const incompleteCount = councilData?.incompleteCouncilCount ?? 0
  const waitingStudentCount = councilData?.waitingStudentCount ?? 0

  // Auto select first council if not selected
  useEffect(() => {
    if (councils.length > 0 && (!selectedCouncilId || !councils.some((c) => c.publicId === selectedCouncilId))) {
      setSelectedCouncilId(councils[0].publicId)
    }
  }, [councils, selectedCouncilId])

  // Lấy hội đồng mới nhất từ cache để modal chi tiết luôn đúng dữ liệu sau khi sửa phòng/thành viên
  const detailCouncil = councils.find((c) => c.publicId === detailCouncilId) ?? null

  const openTabForCouncil = (tab: CouncilTab, councilId: string) => {
    setDetailCouncilId(null)
    setSelectedCouncilId(councilId)
    setActiveTab(tab)
  }

  const handleCreateSuccessAndAssign = (firstCouncilId?: string) => {
    if (firstCouncilId) {
      setSelectedCouncilId(firstCouncilId)
    }
    setActiveTab('members')
  }

  if (user && !isAuthorized) {
    return (
      <div className="bg-white border border-rose-200 rounded-2xl p-12 text-center shadow-xs max-w-xl mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Không có quyền truy cập</h3>
        <p className="text-xs text-slate-500 mt-1">
          Chức năng Quản lý Hội đồng bảo vệ chỉ dành cho vai trò Quản trị viên (ADMIN) hoặc Trưởng bộ môn (HEAD_OF_MAJOR).
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-[1440px] w-full mx-auto">
      {isForbiddenError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
          <span>Bạn không có quyền truy cập dữ liệu Hội đồng bảo vệ (HTTP 403, mã lỗi 2001).</span>
        </div>
      )}

      {/* HEADER / TOOLBAR: BỘ LỌC NĂM HỌC, HỌC KỲ, BỘ MÔN */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-3 flex-wrap">
          <SemesterScopeFilter
            selectedYear={selectedYear}
            selectedSemesterId={selectedSemesterId}
            academicYears={academicYears}
            termsOfYear={termsOfYear}
            isLoading={semestersLoading}
            allowAll={false}
            onYearChange={onYearChange}
            onSemesterChange={onSemesterChange}
          />

          {/* Major Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedMajorId}
              onChange={(e) => setSelectedMajorId(e.target.value)}
              aria-label="Chọn bộ môn"
              className="h-9 px-3 pr-8 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition shadow-2xs cursor-pointer"
              disabled={majorsLoading}
            >
              {majors && majors.length > 0 ? (
                majors.map((m) => (
                  <option key={m.publicId} value={m.publicId}>
                    {m.name}
                  </option>
                ))
              ) : (
                <option value={managedMajor?.publicId || '1'}>
                  {managedMajor?.name || 'Kỹ thuật phần mềm (KTPM)'}
                </option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* 3-TAB NAVIGATION BAR + NÚT TẠO HỘI ĐỒNG INLINE */}
      <div className="flex items-center justify-between gap-3 w-full flex-wrap md:flex-nowrap">
        <div
          className="min-h-10 bg-[#E2E8F0] p-1 rounded-xl flex items-center gap-1 text-[13px] font-semibold flex-1 shadow-2xs border border-slate-300/70 overflow-x-auto"
          role="tablist"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.value)}
                className={`flex-1 h-[32px] px-4 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                <span>{tab.label}</span>
                {tab.value === 'list' && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      isActive ? 'bg-[#E3F2FD] text-[#1565C0]' : 'text-slate-500'
                    }`}
                  >
                    {councils.length}
                  </span>
                )}
                {tab.value === 'members' && incompleteCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[11px] bg-amber-100 text-amber-700 ${
                      isActive ? 'font-bold' : 'font-semibold'
                    }`}
                  >
                    {incompleteCount} thiếu
                  </span>
                )}
                {tab.value === 'students' && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[11px] ${
                      isActive ? 'font-bold bg-[#E3F2FD] text-[#1565C0]' : 'font-semibold text-slate-500'
                    }`}
                  >
                    {waitingStudentCount} SV chờ
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Nút Tạo hội đồng: chỉ hiện ở tab Danh sách */}
        {activeTab === 'list' && (
          <Button
            type="button"
            onClick={() => setCreateDialogOpen(true)}
            className="h-10 px-4 rounded-xl bg-[#1565C0] text-white text-[13px] font-semibold hover:bg-[#0D47A1] transition shadow-xs inline-flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo hội đồng</span>
          </Button>
        )}
      </div>

      {/* TAB 1: DANH SÁCH HỘI ĐỒNG */}
      {activeTab === 'list' && (
        <section className="space-y-4">
          <CouncilTable
            councils={councils}
            isLoading={councilsLoading}
            onViewDetail={(c) => setDetailCouncilId(c.publicId)}
            onCreate={() => setCreateDialogOpen(true)}
          />
        </section>
      )}

      {/* TAB 2: GÁN GIẢNG VIÊN VÀO HỘI ĐỒNG */}
      {activeTab === 'members' && (
        <section className="space-y-4">
          <AssignTeachersWorkspace
            semesterId={activeSemesterId}
            majorId={activeMajorId}
            councils={councils}
            selectedCouncilId={selectedCouncilId}
            onSelectCouncil={setSelectedCouncilId}
            onCreateCouncil={() => setCreateDialogOpen(true)}
          />
        </section>
      )}

      {/* TAB 3: GÁN SINH VIÊN VÀO HỘI ĐỒNG */}
      {activeTab === 'students' && (
        <section className="space-y-4">
          <AssignStudentsWorkspace
            semesterId={activeSemesterId}
            majorId={activeMajorId}
            councils={councils}
            selectedCouncilId={selectedCouncilId}
            onSelectCouncil={setSelectedCouncilId}
            onCreateCouncil={() => setCreateDialogOpen(true)}
          />
        </section>
      )}

      {/* MODAL: TẠO HỘI ĐỒNG */}
      <CreateCouncilDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        semesterId={activeSemesterId}
        majorId={activeMajorId}
        majorCode={currentMajorCode}
        academicYear={selectedYear}
        existingCouncilCount={councils.length}
        onSuccessAndGoToAssign={handleCreateSuccessAndAssign}
      />

      {/* MODAL: CHI TIẾT HỘI ĐỒNG */}
      <CouncilDetailDialog
        council={detailCouncil}
        semesterId={activeSemesterId}
        majorId={activeMajorId}
        open={Boolean(detailCouncil)}
        onOpenChange={(open) => {
          if (!open) setDetailCouncilId(null)
        }}
        onManageMembers={(id) => openTabForCouncil('members', id)}
        onManageStudents={(id) => openTabForCouncil('students', id)}
      />
    </div>
  )
}
