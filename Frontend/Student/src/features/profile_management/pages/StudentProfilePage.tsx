import React, { useState } from 'react'
import { BookOpen, GraduationCap, Mail, SquarePen } from 'lucide-react'
import { Button, Skeleton } from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import { ProfileContactModal } from '../components/ProfileContactModal'
import { useStudentMyInfo } from '../hooks/useProfileManagement'
import { profileService } from '../services/profile.service'

const cardClass = 'bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4'

function CardTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-[#1565C0]">
      <Icon className="w-5 h-5" />
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">{title}</h2>
    </div>
  )
}

/** Một dòng "Nhãn: giá trị"; value null → hiện chữ xám nghiêng `emptyText` */
function InfoRow({
  label,
  value,
  emptyText = '—',
  className,
}: {
  label: string
  value: string | null
  emptyText?: string
  className?: string
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-slate-400 font-semibold">{label}:</span>
      {value ? (
        <span className={cn('col-span-2 font-semibold text-slate-800', className)}>{value}</span>
      ) : (
        <span className="col-span-2 italic text-slate-400">{emptyText}</span>
      )}
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="max-w-7xl w-full mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <div key={i} className={cardClass}>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  )
}

export const StudentProfilePage: React.FC = () => {
  const { data: profile, isPending, isError, refetch, isRefetching } = useStudentMyInfo()
  const [isEditOpen, setIsEditOpen] = useState(false)

  if (isPending) return <ProfileSkeleton />

  if (isError) {
    return (
      <div className="max-w-7xl w-full mx-auto bg-white rounded-xl border border-slate-200 p-10 text-center space-y-3">
        <p className="text-sm text-slate-600">Không tải được thông tin cá nhân.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          {isRefetching ? 'Đang tải...' : 'Thử lại'}
        </Button>
      </div>
    )
  }

  const avatarText = profileService.computeProfileAvatar(profile.name)
  const hasNoThesis = !profile.topicName && !profile.lecturerName && !profile.coLecturerName

  return (
    <div className="max-w-7xl w-full mx-auto space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#1565C0] text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
            {avatarText}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{profile.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-slate-400 font-medium">Hệ Đại học chính quy</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsEditOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs cursor-pointer shrink-0"
        >
          <SquarePen className="w-4 h-4 text-slate-500" />
          <span>Sửa thông tin</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cột trái: Thông tin liên hệ + Thông tin đồ án (học kỳ hiện tại) */}
        <div className={cardClass}>
          <CardTitle icon={Mail} title="Thông tin liên hệ" />
          <div className="space-y-3 text-xs">
            <InfoRow label="Email" value={profile.email} className="break-all" />
            <InfoRow label="Số điện thoại" value={profileService.formatPhone(profile.phone)} />
          </div>

          <div className="pt-2" />
          <CardTitle icon={BookOpen} title="Thông tin đồ án" />
          {hasNoThesis ? (
            <p className="text-xs italic text-slate-400">Bạn chưa có đề tài đồ án trong học kỳ này.</p>
          ) : (
            <div className="space-y-3 text-xs">
              <InfoRow label="Tên đề tài" value={profile.topicName} emptyText="Chưa có tên đề tài" />
              <InfoRow
                label="Giảng viên hướng dẫn"
                value={profile.lecturerName}
                emptyText="Chưa được phân công"
              />
              <InfoRow label="Đồng hướng dẫn" value={profile.coLecturerName} emptyText="Không có" />
            </div>
          )}
        </div>

        {/* Cột phải: Thông tin học vụ */}
        <div className={cardClass}>
          <CardTitle icon={GraduationCap} title="Thông tin học vụ" />
          <div className="space-y-3 text-xs">
            <InfoRow label="Mã sinh viên" value={profile.studentCode} className="font-bold" />
            <InfoRow label="Lớp" value={profile.className} />
            <InfoRow label="Khóa" value={profile.batch} />
            <InfoRow label="Bộ môn" value={profile.majorName} />
            <InfoRow label="Khoa" value={profile.facultyName} />
          </div>
        </div>
      </div>

      <ProfileContactModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        email={profile.email}
        initialValues={{ ...profileService.splitFullName(profile.name), phone: profile.phone }}
      />
    </div>
  )
}

export default StudentProfilePage
