import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useSemesterScope } from '@/features/department/lecturer_management/hooks/useSemesterScope'
import { useManagedMajor } from '@/features/department/lecturer_management/hooks/useTeachers'
import { SemesterScopeFilter } from '@/features/department/lecturer_management/components/SemesterScopeFilter'
import { useDefenseCouncils } from '../hooks/useDefenseCouncils'
import { CouncilTable } from '../components/CouncilTable'
import { CreateCouncilDialog } from '../components/CreateCouncilDialog'
import { CouncilDetailDialog } from '../components/CouncilDetailDialog'
import { AssignTeachersWorkspace } from '../components/AssignTeachersWorkspace'
import { AssignStudentsWorkspace } from '../components/AssignStudentsWorkspace'
import type { DefenseCouncil } from '../types'

export default function DefenseCouncilPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'members' | 'students'>('list')
  const [selectedCouncilId, setSelectedCouncilId] = useState<string>('')
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false)
  const [detailCouncil, setDetailCouncil] = useState<DefenseCouncil | null>(null)

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

  const { data: managedMajor, isLoading: majorLoading } = useManagedMajor()

  const currentMajorCode = (managedMajor?.code || managedMajor?.name || 'KTPM')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 5)

  // Use selected IDs (publicId UUID) for queries
  const activeSemesterId = selectedSemesterId || ''
  const activeMajorId = managedMajor?.publicId || ''

  // Query Councils
  const { data: councilData, isPending: councilsLoading } = useDefenseCouncils(
    activeSemesterId,
    activeMajorId,
  )

  const councils = councilData?.councils || []
  const incompleteCount = councilData?.incompleteCouncilCount ?? 0
  const waitingStudentCount = councilData?.waitingStudentCount ?? 0

  // Auto select first council if not selected
  useEffect(() => {
    if (councils.length > 0 && (!selectedCouncilId || !councils.some((c) => c.publicId === selectedCouncilId))) {
      setSelectedCouncilId(councils[0].publicId)
    }
  }, [councils, selectedCouncilId])

  const handleCreateSuccessAndAssign = (firstCouncilId?: string) => {
    if (firstCouncilId) {
      setSelectedCouncilId(firstCouncilId)
    }
    setActiveTab('members')
  }

  return (
    <div className="space-y-4 max-w-[1440px] w-full mx-auto">
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

          {/* Managed Major (Read-only for TBM) */}
          <div className="h-9 px-3.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 flex items-center shadow-2xs">
            {majorLoading ? (
              <span className="text-slate-400">Đang tải ngành...</span>
            ) : (
              <span>{managedMajor?.name || 'Kỹ thuật phần mềm'}</span>
            )}
          </div>
        </div>
      </div>

      {/* 3-TAB NAVIGATION BAR + NÚT TẠO HỘI ĐỒNG INLINE */}
      <div className="flex items-center justify-between gap-3 w-full">
        <div
          className="h-10 bg-[#E2E8F0] p-1 rounded-xl flex items-center gap-1 text-[13px] font-semibold flex-1 shadow-2xs border border-slate-300/70"
          role="tablist"
        >
          {/* Tab 1 */}
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex-1 h-[32px] px-4 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'list'
                ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <span>Danh sách hội đồng</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === 'list'
                  ? 'bg-[#E3F2FD] text-[#1565C0]'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {councils.length}
            </span>
          </button>

          {/* Tab 2 */}
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`flex-1 h-[32px] px-4 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'members'
                ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <span>Gán giảng viên vào hội đồng</span>
            {incompleteCount > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">
                {incompleteCount} thiếu
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                Đủ 5/5
              </span>
            )}
          </button>

          {/* Tab 3 */}
          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`flex-1 h-[32px] px-4 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'students'
                ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <span>Gán sinh viên vào hội đồng</span>
            <span className="px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-[#1565C0]">
              {waitingStudentCount} SV chờ
            </span>
          </button>
        </div>

        {/* Nút Tạo hội đồng */}
        <Button
          type="button"
          onClick={() => setCreateDialogOpen(true)}
          className="h-10 px-4 rounded-xl bg-[#1565C0] text-white text-[13px] font-semibold hover:bg-[#0D47A1] transition shadow-xs inline-flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo hội đồng</span>
        </Button>
      </div>

      {/* TAB 1: DANH SÁCH HỘI ĐỒNG */}
      {activeTab === 'list' && (
        <section className="space-y-4">
          <CouncilTable
            councils={councils}
            isLoading={councilsLoading}
            onViewDetail={(c) => setDetailCouncil(c)}
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
        open={Boolean(detailCouncil)}
        onOpenChange={(open) => {
          if (!open) setDetailCouncil(null)
        }}
      />
    </div>
  )
}
