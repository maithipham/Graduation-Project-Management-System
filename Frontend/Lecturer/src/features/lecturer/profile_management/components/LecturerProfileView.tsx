import React, { useState } from 'react'
import { Mail, SquarePen, UserRound } from 'lucide-react'
import { Button, Skeleton } from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import { useLecturerPortalStore } from '@/features/lecturer/lecturer_portal_storage'
import { useLecturerMyInfo } from '../hooks/useLecturerMyInfo'
import { LecturerProfileModal } from './LecturerProfileModal'
import { computeAvatar, formatDisplayName, splitFullName } from '../services/lecturerProfile.service'

// global.css cũ của portal có CSS cho mọi h1/h2 (cỡ chữ 34–54px, font Segoe UI, margin) và đè lên class Tailwind
// → dùng "!" (important) để trả tiêu đề về đúng kiểu như trang hồ sơ sinh viên
const headingReset = 'm-0! max-w-none! font-sans! leading-normal!'

const cardClass = 'bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4'

function CardTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-[#1565C0]">
      <Icon className="w-5 h-5" />
      <h2 className={cn(headingReset, 'text-sm! font-bold uppercase tracking-wider! text-slate-900!')}>
        {title}
      </h2>
    </div>
  )
}

/** Một dòng "Nhãn: giá trị"; value rỗng → hiện chữ xám nghiêng `emptyText` */
function InfoRow({
  label,
  value,
  emptyText = '—',
  className,
  children,
}: {
  label: string
  value: string | null
  emptyText?: string
  className?: string
  /** Phần hiển thị thêm sau giá trị (ví dụ nhãn "Ngoài trường") */
  children?: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-slate-400 font-semibold">{label}:</span>
      {value ? (
        <span className={cn('col-span-2 font-semibold text-slate-800', className)}>
          {value}
          {children}
        </span>
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

interface LecturerProfileViewProps {
  /** Chữ dưới tên; bỏ trống → lấy chức danh trong portal store (mặc định "Giảng viên") */
  roleLabel?: string
}

/**
 * Giao diện trang hồ sơ cán bộ (bố cục giống trang hồ sơ sinh viên), dữ liệu từ GET /teacher/my-info.
 * Dùng chung cho Giảng viên (/lecturer/profile) và Trưởng bộ môn (/department/profile)
 */
export function LecturerProfileView({ roleLabel }: LecturerProfileViewProps) {
  const { data: profile, isPending, isError, refetch, isRefetching } = useLecturerMyInfo()
  // API không trả vai trò → giữ nguồn cũ (portal store)
  const teacherTitle = useLecturerPortalStore((s) => s.teacher.title)
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

  // Giảng viên ngoài trường không thuộc Bộ môn nào
  const isExternal = profile.majorName == null

  return (
    <div className="max-w-7xl w-full mx-auto space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#1565C0] text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
            {computeAvatar(profile.name)}
          </div>
          <div>
            <h1 className={cn(headingReset, 'text-xl! font-bold text-slate-900! tracking-tight!')}>
              {formatDisplayName(profile.academicTitle, profile.name)}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-slate-400 font-medium">{roleLabel || teacherTitle || 'Giảng viên'}</span>
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
        {/* Cột trái: Thông tin cá nhân */}
        <div className={cardClass}>
          <CardTitle icon={UserRound} title="Thông tin cá nhân" />
          <div className="space-y-3 text-xs">
            <InfoRow label="Mã giảng viên" value={profile.teacherCode} className="font-bold" />
            <InfoRow label="Học vị" value={profile.academicTitleName} className="font-bold" />
            <InfoRow label="Đơn vị công tác" value={profile.organization} emptyText="Chưa cập nhật">
              {isExternal && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Ngoài trường
                </span>
              )}
            </InfoRow>
            {/* Giảng viên ngoài trường không có Bộ môn / Khoa */}
            {!isExternal && (
              <>
                <InfoRow label="Bộ môn" value={profile.majorName} />
                <InfoRow label="Khoa" value={profile.facultyName} />
              </>
            )}
          </div>
        </div>

        {/* Cột phải: Thông tin liên hệ */}
        <div className={cardClass}>
          <CardTitle icon={Mail} title="Thông tin liên hệ" />
          <div className="space-y-3 text-xs">
            <InfoRow label="Email" value={profile.email} className="break-all" />
            <InfoRow label="Số điện thoại" value={profile.phone} />
          </div>
        </div>
      </div>

      <LecturerProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        initialValues={{ ...splitFullName(profile.name), phone: profile.phone ?? '' }}
        email={profile.email}
      />
    </div>
  )
}
