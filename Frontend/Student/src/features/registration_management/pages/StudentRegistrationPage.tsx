import { useState } from 'react'
import { useMyInfo } from '@/features/auth'
import {
  STUDENT_PROFILE_MOCK,
  STUDENT_TOPIC_STORAGE_KEYS,
} from '@/shared/constants/studentProfile.mock'
import { RegistrationDemoPanel } from '../components/RegistrationDemoPanel'
import { RegistrationFormModal } from '../components/RegistrationFormModal'
import { RegistrationHistoryTable } from '../components/RegistrationHistoryTable'
import { RegistrationOverviewCard } from '../components/RegistrationOverviewCard'
import {
  REGISTRATION_LECTURERS_MOCK,
  formatRegistrationNow,
} from '../services/registration.service'
import type {
  RegistrationLecturerOption,
  SupervisorRegistrationItem,
} from '../types/registration.types'

const REG_DEADLINE_ISO = '2026-11-15T23:59:59+07:00'

function computeCountdownLabel(nowMs: number): string {
  const diffMs = Date.parse(REG_DEADLINE_ISO) - nowMs
  if (diffMs <= 0) return 'Đã hết hạn'
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60))
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  if (days > 0) return `Còn ${days} ngày ${hours} giờ`
  return `Còn ${Math.max(1, hours)} giờ`
}

function syncTopicToStorage(nextTopic: string | null) {
  try {
    if (nextTopic === null) {
      localStorage.removeItem(STUDENT_TOPIC_STORAGE_KEYS.topic)
    } else {
      localStorage.setItem(STUDENT_TOPIC_STORAGE_KEYS.topic, nextTopic)
    }
    localStorage.removeItem(STUDENT_TOPIC_STORAGE_KEYS.oldTopic)
    localStorage.removeItem(STUDENT_TOPIC_STORAGE_KEYS.topicRequested)
  } catch {
    // ignore storage errors
  }
}

export default function StudentRegistrationPage() {
  const { data: user } = useMyInfo()
  const [nowMs] = useState<number>(() => Date.now())

  const [mentor, setMentor] = useState<string>('')
  const [topic, setTopic] = useState<string>('')
  const [assignedByTbm, setAssignedByTbm] = useState<boolean>(false)
  const [requests, setRequests] = useState<SupervisorRegistrationItem[]>([])
  const [reasonDraft, setReasonDraft] = useState<string>(
    'Đồng ý tiếp nhận hướng dẫn sinh viên.',
  )

  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [isEditingPending, setIsEditingPending] = useState<boolean>(false)

  const pendingRequest = requests.find((r) => r.status === 'Đang xử lý')
  const approvedRequest = requests.find((r) => r.status === 'Đã duyệt')
  const hasAssignedMentor =
    Boolean(approvedRequest) ||
    assignedByTbm ||
    (Boolean(mentor.trim()) && mentor !== 'Chưa có GVHD')

  const isLatestRejected =
    requests.length > 0 &&
    requests[0].status === 'Đã từ chối' &&
    !pendingRequest &&
    !hasAssignedMentor

  const handlePrimaryAction = () => {
    if (pendingRequest && pendingRequest.subStatus === 'pending_gvhd') {
      setIsEditingPending(true)
      setModalOpen(true)
    } else if (!hasAssignedMentor) {
      setIsEditingPending(false)
      setModalOpen(true)
    }
  }

  const handleFormSubmit = (lecturer: RegistrationLecturerOption, topicVal: string) => {
    const timeStr = formatRegistrationNow()

    if (isEditingPending && pendingRequest) {
      setRequests((prev) =>
        prev.map((item) =>
          item.id === pendingRequest.id
            ? {
                ...item,
                lecturerId: lecturer.id,
                lecturer: lecturer.name,
                dept: lecturer.department,
                origin: lecturer.origin,
                unit: lecturer.unit ?? '',
                topic: topicVal,
                time: `${timeStr} (Đã sửa)`,
                status: 'Đang xử lý',
                subStatus: 'pending_gvhd',
              }
            : item,
        ),
      )
    } else {
      const newReq: SupervisorRegistrationItem = {
        id: Date.now(),
        time: timeStr,
        lecturerId: lecturer.id,
        lecturer: lecturer.name,
        dept: lecturer.department,
        origin: lecturer.origin,
        unit: lecturer.unit ?? '',
        topic: topicVal,
        status: 'Đang xử lý',
        subStatus: 'pending_gvhd',
        approvedTime: '',
        note: '',
      }
      setRequests((prev) => [newReq, ...prev])
    }

    setModalOpen(false)
  }

  const handleApproveGvhd = () => {
    if (!pendingRequest) return
    setRequests((prev) =>
      prev.map((item) =>
        item.id === pendingRequest.id
          ? {
              ...item,
              status: 'Đang xử lý',
              subStatus: 'pending_tbm',
              note:
                reasonDraft.trim() ||
                'GVHD đồng ý tiếp nhận. Chờ Trưởng bộ môn phê duyệt.',
            }
          : item,
      ),
    )
  }

  const handleRejectGvhd = () => {
    if (!pendingRequest) return
    const approvedTime = formatRegistrationNow()
    setRequests((prev) =>
      prev.map((item) =>
        item.id === pendingRequest.id
          ? {
              ...item,
              status: 'Đã từ chối',
              subStatus: 'rejected_gvhd',
              approvedTime,
              note: reasonDraft.trim() || 'Giảng viên từ chối đơn đăng ký.',
            }
          : item,
      ),
    )
  }

  const handleApproveTbm = () => {
    if (!pendingRequest) return
    const approvedTime = formatRegistrationNow()
    setRequests((prev) =>
      prev.map((item) =>
        item.id === pendingRequest.id
          ? {
              ...item,
              status: 'Đã duyệt',
              subStatus: 'approved_tbm',
              approvedTime,
              note: 'Trưởng bộ môn đã phê duyệt phân công chính thức.',
            }
          : item,
      ),
    )
    setMentor(pendingRequest.lecturer)
    setTopic(pendingRequest.topic)
    setAssignedByTbm(false)
    syncTopicToStorage(pendingRequest.topic || '')
  }

  const handleRejectAndAssignTbm = () => {
    if (!pendingRequest) return
    const approvedTime = formatRegistrationNow()
    const backupLecturer = REGISTRATION_LECTURERS_MOCK.find(
      (l) => l.id !== pendingRequest.lecturerId && l.origin === 'internal',
    ) ?? {
      name: 'TS. Nguyễn Quốc Bảo',
    }

    setRequests((prev) =>
      prev.map((item) =>
        item.id === pendingRequest.id
          ? {
              ...item,
              status: 'Đã từ chối',
              subStatus: 'rejected_tbm',
              approvedTime,
              note: 'Trưởng bộ môn từ chối đề xuất và điều phối giảng viên khác.',
            }
          : item,
      ),
    )
    setMentor(backupLecturer.name)
    setTopic(pendingRequest.topic)
    setAssignedByTbm(true)
    syncTopicToStorage(pendingRequest.topic || '')
  }

  const handleResetDemo = () => {
    setMentor('')
    setTopic('')
    setAssignedByTbm(false)
    setRequests([])
    setIsEditingPending(false)
    setReasonDraft('Đồng ý tiếp nhận hướng dẫn sinh viên.')
    syncTopicToStorage(null)
  }

  const studentName = user?.name?.trim() || STUDENT_PROFILE_MOCK.name

  return (
    <div className="w-full max-w-full space-y-5">
      <RegistrationOverviewCard
        mentor={mentor}
        topic={topic}
        deadlineText="23:59 · 15/11/2026"
        countdownLabel={computeCountdownLabel(nowMs)}
        pendingRequest={pendingRequest}
        hasAssignedMentor={hasAssignedMentor}
        isLatestRejected={isLatestRejected}
        onPrimaryAction={handlePrimaryAction}
      />

      <RegistrationDemoPanel
        studentName={studentName}
        studentMssv={STUDENT_PROFILE_MOCK.mssv}
        studentClass={STUDENT_PROFILE_MOCK.className}
        mentor={mentor}
        assignedByTbm={assignedByTbm}
        hasApprovedRequest={Boolean(approvedRequest)}
        isLatestRejected={isLatestRejected}
        pendingRequest={pendingRequest}
        reasonDraft={reasonDraft}
        onReasonDraftChange={setReasonDraft}
        onApproveGvhd={handleApproveGvhd}
        onRejectGvhd={handleRejectGvhd}
        onApproveTbm={handleApproveTbm}
        onRejectAndAssignTbm={handleRejectAndAssignTbm}
        onResetDemo={handleResetDemo}
      />

      <RegistrationHistoryTable requests={requests} />

      <RegistrationFormModal
        open={modalOpen}
        isEditing={isEditingPending}
        lecturers={REGISTRATION_LECTURERS_MOCK}
        initialLecturerId={
          isEditingPending && pendingRequest ? pendingRequest.lecturerId : null
        }
        initialTopic={isEditingPending && pendingRequest ? pendingRequest.topic : ''}
        onClose={() => setModalOpen(false)}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
